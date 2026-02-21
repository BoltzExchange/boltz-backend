import type { ERC20Swap } from 'boltz-core/typechain/ERC20Swap';
import type { EtherSwap } from 'boltz-core/typechain/EtherSwap';
import { Signature, type Signer } from 'ethers';
import type { OverPaymentConfig } from '../../../Config';
import type Logger from '../../../Logger';
import { formatError, getHexBuffer } from '../../../Utils';
import { etherDecimals } from '../../../consts/Consts';
import {
  CurrencyType,
  SwapType,
  swapTypeToPrettyString,
} from '../../../consts/Enums';
import type Swap from '../../../db/models/Swap';
import ChainSwapRepository, {
  type ChainSwapInfo,
} from '../../../db/repositories/ChainSwapRepository';
import CommitmentRepository from '../../../db/repositories/CommitmentRepository';
import SwapRepository from '../../../db/repositories/SwapRepository';
import TimeoutDeltaProvider from '../../../service/TimeoutDeltaProvider';
import { overpaymentDefaultConfig } from '../../../swap/OverpaymentProtector';
import type Wallet from '../../Wallet';
import type ERC20WalletProvider from '../../providers/ERC20WalletProvider';
import type ConsolidatedEventHandler from '../ConsolidatedEventHandler';
import { parseBuffer } from '../EthereumUtils';
import type { NetworkDetails } from '../EvmNetworks';
import type InjectedProvider from '../InjectedProvider';
import { computeLockupHash } from './ContractUtils';
import type Contracts from './Contracts';
import { Feature } from './Contracts';

type LockupEvent = {
  preimageHash: Buffer;
  logIndex: number;
  amount: bigint;
  refundAddress: string;
  timelock: bigint;
  tokenAddress?: string;
};

class Commitments {
  // Two weeks
  private static readonly defaultCommitmentTimelockMinutes = 14 * 24 * 60;

  private provider!: InjectedProvider;
  private signer!: Signer;
  private wallets!: Map<string, Wallet>;
  private contracts!: Contracts[];

  private readonly commitmentTimelockMinutes: number;
  private readonly maxOverpaymentPercentage: number;

  constructor(
    private readonly logger: Logger,
    private readonly network: NetworkDetails,
    private readonly eventHandler: ConsolidatedEventHandler,
    commitmentTimelockMinutes?: number,
    overPaymentConfig?: OverPaymentConfig,
  ) {
    this.commitmentTimelockMinutes =
      commitmentTimelockMinutes ?? Commitments.defaultCommitmentTimelockMinutes;
    this.maxOverpaymentPercentage =
      (overPaymentConfig?.maxPercentage ??
        overpaymentDefaultConfig.maxPercentage) / 100;

    if (this.commitmentTimelockMinutes <= 0) {
      throw new Error('commitment timelock must be greater than 0');
    }

    this.logger.info(
      `Using ${this.network.name} commitment timelock: ${this.commitmentTimelockMinutes} minutes`,
    );
  }

  public init = (
    provider: InjectedProvider,
    signer: Signer,
    contracts: Contracts[],
    wallets: Map<string, Wallet>,
  ) => {
    this.provider = provider;
    this.signer = signer;
    this.wallets = wallets;

    // Only contracts that support the commitment swaps are relevant
    this.contracts = contracts.filter((c) =>
      c.features.has(Feature.CommitmentSwap),
    );
  };

  public lockupDetails = async (currency: string) => {
    const isEtherSwap = currency === this.network.symbol;
    const contracts = this.highestContractsVersion();

    const [currentBlock, contractAddress, claimAddress] = await Promise.all([
      this.provider.getLocktimeHeight(),
      isEtherSwap
        ? contracts.etherSwap.getAddress()
        : contracts.erc20Swap.getAddress(),
      this.signer.getAddress(),
    ]);

    const timelock = Math.ceil(
      currentBlock +
        this.commitmentTimelockMinutes /
          TimeoutDeltaProvider.blockTimes.get(this.network.symbol)!,
    );

    return {
      contract: contractAddress,
      claimAddress,
      timelock,
    };
  };

  public commit = async (
    currency: string,
    swapId: string,
    signature: string,
    transactionHash: string,
    logIndex?: number,
    maxOverpaymentPercentage?: number,
  ) => {
    let swap: Swap | ChainSwapInfo | null = await SwapRepository.getSwap({
      id: swapId,
    });
    if (swap === null || swap === undefined) {
      swap = await ChainSwapRepository.getChainSwap({
        id: swapId,
      });
    }

    if (swap === null || swap === undefined) {
      throw new Error('swap not found');
    }

    const { contract, version: contractVersion } =
      await this.findContractForAddress(
        swap.type === SwapType.Submarine
          ? (swap as Swap).lockupAddress
          : (swap as ChainSwapInfo).receivingData.lockupAddress,
      );

    const event = await this.findLockupEvent(
      contract,
      transactionHash,
      logIndex,
    );

    const claimAddress = await this.signer.getAddress();

    const lockupHash = await computeLockupHash(contract, {
      claimAddress,
      ...event,
    });

    {
      const existingCommitment =
        await CommitmentRepository.getByLockupHash(lockupHash);
      if (existingCommitment !== null && existingCommitment !== undefined) {
        throw new Error('commitment exists already');
      }
    }

    if (event.preimageHash.some((byte) => byte !== 0)) {
      throw new Error('commitment preimage hash has to be all zeros');
    }

    if (
      event.timelock <
      (swap.type === SwapType.Submarine
        ? (swap as Swap).timeoutBlockHeight
        : (swap as ChainSwapInfo).receivingData.timeoutBlockHeight)
    ) {
      throw new Error('commitment timelock expires before swap timeout');
    }

    const swapAmount =
      swap.type === SwapType.Submarine
        ? (swap as Swap).expectedAmount
        : (swap as ChainSwapInfo).receivingData.expectedAmount;
    if (swapAmount === undefined || swapAmount === null) {
      throw new Error('swap amount not found');
    }

    let sig: Signature;
    try {
      sig = Signature.from(signature);
    } catch (error) {
      throw new Error(`invalid signature: ${formatError(error)}`);
    }

    let signatureValid: boolean;

    if (
      maxOverpaymentPercentage !== undefined &&
      (!Number.isFinite(maxOverpaymentPercentage) ||
        maxOverpaymentPercentage < 0)
    ) {
      throw new Error('invalid maxOverpaymentPercentage');
    }

    const allowedOverpaymentPercentage =
      maxOverpaymentPercentage === undefined
        ? this.maxOverpaymentPercentage
        : maxOverpaymentPercentage / 100;

    if (currency === this.network.symbol) {
      this.checkAcceptedAmount(
        swapAmount,
        Math.floor(Number(event.amount / etherDecimals)),
        allowedOverpaymentPercentage,
      );

      signatureValid = await (contract as EtherSwap).checkCommitmentSignature(
        getHexBuffer(swap.preimageHash),
        event.amount,
        claimAddress,
        event.refundAddress,
        event.timelock,
        sig.v,
        sig.r,
        sig.s,
      );
    } else {
      const wallet = this.wallets.get(currency);
      if (wallet === undefined || wallet.type !== CurrencyType.ERC20) {
        throw new Error('wallet not found');
      }

      const erc20Wallet = wallet.walletProvider as ERC20WalletProvider;

      if (
        erc20Wallet.tokenAddress.toLowerCase() !==
        event.tokenAddress?.toLowerCase()
      ) {
        throw new Error('token address mismatch');
      }

      this.checkAcceptedAmount(
        swapAmount,
        erc20Wallet.normalizeTokenAmount(event.amount),
        allowedOverpaymentPercentage,
      );

      signatureValid = await (contract as ERC20Swap).checkCommitmentSignature(
        getHexBuffer(swap.preimageHash),
        event.amount,
        erc20Wallet.tokenAddress,
        claimAddress,
        event.refundAddress,
        event.timelock,
        sig.v,
        sig.r,
        sig.s,
      );
    }

    if (!signatureValid) {
      throw new Error('invalid signature');
    }

    this.logger.info(
      `Creating ${currency} commitment for ${swapTypeToPrettyString(swap.type)} Swap ${swapId}: ${transactionHash} (${lockupHash})`,
    );
    await CommitmentRepository.create({
      swapId,
      lockupHash,
      transactionHash,
      signature: getHexBuffer(signature.slice(2)),
    });

    const transaction = await this.provider.getTransaction(transactionHash);
    if (transaction === null) {
      throw new Error('transaction not found');
    }

    // We can emit the events with our address as claim address because
    // we verified the signature is valid with it as parameter
    if (currency === this.network.symbol) {
      this.eventHandler.emit('eth.lockup', {
        transaction,
        version: contractVersion,
        etherSwapValues: {
          amount: event.amount,
          claimAddress,
          refundAddress: event.refundAddress,
          timelock: Number(event.timelock),
          preimageHash: getHexBuffer(swap.preimageHash),
        },
      });
    } else {
      this.eventHandler.emit('erc20.lockup', {
        transaction,
        version: contractVersion,
        erc20SwapValues: {
          amount: event.amount,
          claimAddress,
          refundAddress: event.refundAddress,
          timelock: Number(event.timelock),
          preimageHash: getHexBuffer(swap.preimageHash),
          tokenAddress: event.tokenAddress!,
        },
      });
    }
  };

  private checkAcceptedAmount = (
    expectedAmount: number,
    actualAmount: number,
    allowedOverpaymentPercentage: number,
  ) => {
    if (actualAmount < expectedAmount) {
      throw new Error(
        `insufficient amount: ${actualAmount} < ${expectedAmount}`,
      );
    }

    if (
      actualAmount - expectedAmount >
      expectedAmount * allowedOverpaymentPercentage
    ) {
      throw new Error(`overpaid amount: ${actualAmount} > ${expectedAmount}`);
    }
  };

  private highestContractsVersion = (): Contracts => {
    const contracts = this.contracts.reduce<Contracts | undefined>(
      (max, c) => (max === undefined || max.version < c.version ? c : max),
      undefined,
    );

    if (contracts === undefined) {
      throw new Error('no contracts with commitment swap support available');
    }

    return contracts;
  };

  private findContractForAddress = async (
    address: string,
  ): Promise<{ version: bigint; contract: EtherSwap | ERC20Swap }> => {
    for (const c of this.contracts) {
      const [etherSwapAddress, erc20SwapAddress] = await Promise.all([
        c.etherSwap.getAddress(),
        c.erc20Swap.getAddress(),
      ]);

      if (etherSwapAddress.toLowerCase() === address.toLowerCase()) {
        return { version: c.version, contract: c.etherSwap };
      }
      if (erc20SwapAddress.toLowerCase() === address.toLowerCase()) {
        return { version: c.version, contract: c.erc20Swap };
      }
    }

    throw new Error(`contract not found for address: ${address}`);
  };

  /**
   * @param logIndex has to be specified if there are multiple lockup events in the transaction
   */
  private findLockupEvent = async (
    contract: EtherSwap | ERC20Swap,
    transactionHash: string,
    logIndex?: number,
  ): Promise<LockupEvent> => {
    const receipt = await this.provider.getTransactionReceipt(transactionHash);
    if (receipt === null) {
      throw new Error('transaction not found');
    }

    const contractAddress = (await contract.getAddress()).toLowerCase();

    const eventsToCheck =
      logIndex !== undefined
        ? [receipt.logs.find((log) => log.index === logIndex)]
        : receipt.logs;

    const lockupsFound: LockupEvent[] = [];

    for (const event of eventsToCheck) {
      if (event === undefined) {
        continue;
      }

      if (
        event.address.toLowerCase() !== contractAddress ||
        event.topics[0] !== contract.interface.getEvent('Lockup').topicHash
      ) {
        continue;
      }

      const parsedEvent = contract.interface.parseLog(event);
      if (parsedEvent === null || parsedEvent === undefined) {
        continue;
      }

      lockupsFound.push({
        logIndex: event.index,
        amount: parsedEvent.args.amount,
        timelock: parsedEvent.args.timelock,
        tokenAddress: parsedEvent.args.tokenAddress,
        refundAddress: parsedEvent.args.refundAddress,
        preimageHash: parseBuffer(parsedEvent.args.preimageHash),
      });
    }

    if (lockupsFound.length === 0) {
      throw new Error('lockup event not found');
    }

    if (lockupsFound.length > 1) {
      throw new Error(
        'multiple lockup events found; logIndex has to be specified',
      );
    }

    return lockupsFound[0];
  };
}

export default Commitments;
