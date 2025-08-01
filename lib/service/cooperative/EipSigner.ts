import AsyncLock from 'async-lock';
import { Op } from 'sequelize';
import type Logger from '../../Logger';
import {
  getChainCurrency,
  getHexBuffer,
  getHexString,
  getLightningCurrency,
  splitPairId,
} from '../../Utils';
import { etherDecimals } from '../../consts/Consts';
import { SwapType, swapTypeToPrettyString } from '../../consts/Enums';
import type Swap from '../../db/models/Swap';
import type { ChainSwapInfo } from '../../db/repositories/ChainSwapRepository';
import ChainSwapRepository from '../../db/repositories/ChainSwapRepository';
import SwapRepository from '../../db/repositories/SwapRepository';
import type Sidecar from '../../sidecar/Sidecar';
import type { Currency } from '../../wallet/WalletManager';
import type WalletManager from '../../wallet/WalletManager';
import type ERC20WalletProvider from '../../wallet/providers/ERC20WalletProvider';
import Errors from '../Errors';
import MusigSigner from './MusigSigner';

class EipSigner {
  private static readonly refundSignatureLock = 'refundSignature';

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

      const onchainAmount =
        swap.type === SwapType.Submarine
          ? (swap as Swap).onchainAmount
          : (swap as ChainSwapInfo).receivingData.amount;

      const contractAddress =
        swap.type === SwapType.Submarine
          ? (swap as Swap).lockupAddress
          : (swap as ChainSwapInfo).receivingData.lockupAddress;

      const sidecarRes = await this.sidecar.signEvmRefund(
        contractAddress,
        getHexBuffer(swap.preimageHash),
        isEtherSwap
          ? BigInt(onchainAmount!) * etherDecimals
          : (
              this.walletManager.wallets.get(chainSymbol)!
                .walletProvider as ERC20WalletProvider
            ).formatTokenAmount(onchainAmount!),
        isEtherSwap ? undefined : manager.tokenAddresses.get(chainSymbol),
        swap.type === SwapType.Submarine
          ? (swap as Swap).timeoutBlockHeight
          : (swap as ChainSwapInfo).receivingData.timeoutBlockHeight,
      );

      if (swap.type === SwapType.Chain) {
        await ChainSwapRepository.setRefundSignatureCreated(swap.id);
      } else {
        await SwapRepository.setRefundSignatureCreated(swap.id);
      }

      return `0x${getHexString(sidecarRes)}`;
    });

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
