import AsyncLock from 'async-lock';
import { verifyMessage } from 'ethers';
import { Op } from 'sequelize';
import type Logger from '../../Logger';
import {
  getChainCurrency,
  getHexString,
  getLightningCurrency,
  splitPairId,
} from '../../Utils';
import { SwapType, swapTypeToPrettyString } from '../../consts/Enums';
import type { ERC20SwapValues } from '../../consts/Types';
import type Swap from '../../db/models/Swap';
import type { ChainSwapInfo } from '../../db/repositories/ChainSwapRepository';
import ChainSwapRepository from '../../db/repositories/ChainSwapRepository';
import CommitmentRepository from '../../db/repositories/CommitmentRepository';
import SwapRepository from '../../db/repositories/SwapRepository';
import type Sidecar from '../../sidecar/Sidecar';
import type { Currency } from '../../wallet/WalletManager';
import type WalletManager from '../../wallet/WalletManager';
import {
  computeLockupHash,
  isCommitmentPreimageHash,
  queryERC20SwapValuesFromLock,
  queryERC20SwapValuesFromTransaction,
  queryEtherSwapValuesFromLock,
  queryEtherSwapValuesFromTransaction,
} from '../../wallet/ethereum/contracts/ContractUtils';
import Errors from '../Errors';
import MusigSigner from './MusigSigner';

export type RefundSignatureLock = <T>(cb: () => Promise<T>) => Promise<T>;

class EipSigner {
  private static readonly refundSignatureLock = 'refundSignature';

  public static commitmentRefundAddressProofMessage = (
    chainSymbol: string,
    transactionHash: string,
    logIndex?: number,
  ): string =>
    [
      'Boltz commitment refund authorization',
      `chain: ${chainSymbol}`,
      `transactionHash: ${transactionHash}`,
      `logIndex: ${logIndex ?? 'none'}`,
    ].join('\n');

  private readonly lock = new AsyncLock();

  constructor(
    private readonly logger: Logger,
    private readonly currencies: Map<string, Currency>,
    private readonly walletManager: WalletManager,
    private readonly sidecar: Sidecar,
  ) {}

  public refundSignatureLock = <T>(cb: () => Promise<T>): Promise<T> =>
    this.lock.acquire(EipSigner.refundSignatureLock, cb);

  public signSwapRefund = async (swapIdOrPreimageHash: string) =>
    this.refundSignatureLock(async () => {
      const { swap, chainSymbol, lightningCurrency } =
        await this.getSwap(swapIdOrPreimageHash);
      const manager = this.walletManager.ethereumManagers.find((man) =>
        man.hasSymbol(chainSymbol),
      );

      if (manager === undefined) {
        throw 'chain currency is not EVM based';
      }

      {
        const rejectionReason = await MusigSigner.refundNonEligibilityReason(
          swap,
          lightningCurrency,
        );
        if (rejectionReason !== undefined) {
          this.logger.verbose(
            `Not creating EIP-712 signature for refund of ${swapTypeToPrettyString(swap.type)} Swap ${swap.id}: ${rejectionReason}`,
          );
          throw Errors.NOT_ELIGIBLE_FOR_COOPERATIVE_REFUND(rejectionReason);
        }
      }

      this.logger.debug(
        `Creating EIP-712 signature for refund of Swap ${swap.id}`,
      );

      const isEtherSwap = manager.networkDetails.symbol === chainSymbol;

      const lockupTransactionId =
        swap.type === SwapType.Submarine
          ? (swap as Swap).lockupTransactionId
          : (swap as ChainSwapInfo).receivingData.lockupTransactionId;

      if (lockupTransactionId === undefined || lockupTransactionId === null) {
        throw Errors.NOT_ELIGIBLE_FOR_COOPERATIVE_REFUND(
          'no coins were locked up',
        );
      }

      const contractAddress =
        swap.type === SwapType.Submarine
          ? (swap as Swap).lockupAddress
          : (swap as ChainSwapInfo).receivingData.lockupAddress;

      const contracts = await manager.contractsForAddress(contractAddress);
      if (contracts === undefined) {
        throw Errors.NOT_ELIGIBLE_FOR_COOPERATIVE_REFUND('contract not found');
      }

      // Query actual lockup values from the chain
      // This handles commitment swaps automatically via logIndex lookup
      const lockupValues = isEtherSwap
        ? await queryEtherSwapValuesFromLock(
            swap,
            manager.provider,
            contracts.etherSwap,
            lockupTransactionId,
          )
        : await queryERC20SwapValuesFromLock(
            swap,
            manager.provider,
            contracts.erc20Swap,
            lockupTransactionId,
          );

      const sidecarRes = await this.sidecar.signEvmRefund(
        manager.networkDetails.symbol,
        contractAddress,
        lockupValues.preimageHash,
        lockupValues.amount,
        isEtherSwap
          ? undefined
          : (lockupValues as ERC20SwapValues).tokenAddress,
        lockupValues.timelock,
      );

      if (swap.type === SwapType.Chain) {
        await ChainSwapRepository.setRefundSignatureCreated(swap.id);
      } else {
        await SwapRepository.setRefundSignatureCreated(swap.id);
      }

      return `0x${getHexString(sidecarRes)}`;
    });

  public signCommitmentRefund = async (
    chainSymbol: string,
    transactionHash: string,
    refundAddressSignature: string,
    logIndex?: number,
  ) =>
    this.refundSignatureLock(async () => {
      const manager = this.walletManager.ethereumManagers.find((man) =>
        man.hasSymbol(chainSymbol),
      );

      if (manager === undefined) {
        throw 'chain currency is not EVM based';
      }

      const transaction =
        await manager.provider.getTransaction(transactionHash);
      if (transaction?.to === undefined || transaction.to === null) {
        throw Errors.NOT_ELIGIBLE_FOR_COOPERATIVE_REFUND(
          'lockup transaction not found',
        );
      }

      const contracts = await manager.contractsForAddress(transaction.to);
      if (contracts === undefined) {
        throw Errors.NOT_ELIGIBLE_FOR_COOPERATIVE_REFUND('contract not found');
      }

      const isEtherSwap = manager.networkDetails.symbol === chainSymbol;
      const lockupValues = isEtherSwap
        ? await queryEtherSwapValuesFromTransaction(
            manager.provider,
            contracts.etherSwap,
            transactionHash,
            logIndex,
          )
        : await queryERC20SwapValuesFromTransaction(
            manager.provider,
            contracts.erc20Swap,
            transactionHash,
            logIndex,
          );

      if (
        lockupValues.claimAddress.toLowerCase() !==
        manager.address.toLowerCase()
      ) {
        throw Errors.NOT_ELIGIBLE_FOR_COOPERATIVE_REFUND(
          'claim address mismatch',
        );
      }

      if (!isCommitmentPreimageHash(lockupValues.preimageHash)) {
        throw Errors.NOT_ELIGIBLE_FOR_COOPERATIVE_REFUND(
          'commitment preimage hash has to be all zeros',
        );
      }
      this.validateRefundAddressSignature(
        chainSymbol,
        transactionHash,
        logIndex,
        lockupValues.refundAddress,
        refundAddressSignature,
      );

      const tokenAddress = !isEtherSwap
        ? (lockupValues as ERC20SwapValues).tokenAddress
        : undefined;
      if (!isEtherSwap) {
        const expectedTokenAddress = manager.tokenAddresses.get(chainSymbol);
        if (expectedTokenAddress === undefined) {
          throw Errors.NOT_SUPPORTED_BY_SYMBOL(chainSymbol);
        }
        if (
          tokenAddress!.toLowerCase() !== expectedTokenAddress.toLowerCase()
        ) {
          throw Errors.NOT_ELIGIBLE_FOR_COOPERATIVE_REFUND(
            'token address mismatch',
          );
        }
      }

      const lockupHash = await computeLockupHash(
        isEtherSwap ? contracts.etherSwap : contracts.erc20Swap,
        {
          preimageHash: lockupValues.preimageHash,
          amount: lockupValues.amount,
          claimAddress: lockupValues.claimAddress,
          refundAddress: lockupValues.refundAddress,
          timelock: BigInt(lockupValues.timelock),
          tokenAddress,
        },
      );

      this.logger.debug(
        `Creating EIP-712 signature for refund of unlinked commitment ${lockupHash}: ${transactionHash}`,
      );

      const sidecarRes = await this.sidecar.signEvmRefund(
        manager.networkDetails.symbol,
        transaction.to,
        lockupValues.preimageHash,
        lockupValues.amount,
        tokenAddress,
        lockupValues.timelock,
      );
      await CommitmentRepository.markRefunded(lockupHash, transactionHash);

      return `0x${getHexString(sidecarRes)}`;
    });

  private validateRefundAddressSignature = (
    chainSymbol: string,
    transactionHash: string,
    logIndex: number | undefined,
    refundAddress: string,
    refundAddressSignature: string,
  ) => {
    let recoveredAddress: string;
    try {
      recoveredAddress = verifyMessage(
        EipSigner.commitmentRefundAddressProofMessage(
          chainSymbol,
          transactionHash,
          logIndex,
        ),
        refundAddressSignature,
      );
    } catch {
      throw Errors.NOT_ELIGIBLE_FOR_COOPERATIVE_REFUND(
        'invalid refund address signature',
      );
    }

    if (recoveredAddress.toLowerCase() !== refundAddress.toLowerCase()) {
      throw Errors.NOT_ELIGIBLE_FOR_COOPERATIVE_REFUND(
        'refund address signature mismatch',
      );
    }
  };

  private getSwap = async (
    swapIdOrPreimageHash: string,
  ): Promise<{
    swap: Swap | ChainSwapInfo;
    chainSymbol: string;
    lightningCurrency?: Currency;
  }> => {
    const [swap, chainSwap] = await Promise.all([
      SwapRepository.getSwap({
        [Op.or]: {
          id: swapIdOrPreimageHash,
          preimageHash: swapIdOrPreimageHash,
        },
      }),
      ChainSwapRepository.getChainSwap({
        [Op.or]: {
          id: swapIdOrPreimageHash,
          preimageHash: swapIdOrPreimageHash,
        },
      }),
    ]);

    if (swap !== null) {
      const { base, quote } = splitPairId(swap.pair);

      return {
        swap,
        chainSymbol: getChainCurrency(base, quote, swap.orderSide, false),
        lightningCurrency: this.currencies.get(
          getLightningCurrency(base, quote, swap.orderSide, false),
        ),
      };
    } else if (chainSwap !== null) {
      return {
        swap: chainSwap,
        chainSymbol: chainSwap.receivingData.symbol,
      };
    }

    throw Errors.SWAP_NOT_FOUND(swapIdOrPreimageHash);
  };
}

export default EipSigner;
