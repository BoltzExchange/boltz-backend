import { EventEmitter } from 'events';
import { ContractEventPayload } from 'ethers';
import { EtherSwap } from 'boltz-core/typechain/EtherSwap';
import { ERC20Swap } from 'boltz-core/typechain/ERC20Swap';
import Logger from '../../Logger';
import { parseBuffer } from './EthereumUtils';
import { NetworkDetails } from './EvmNetworks';
import { ERC20SwapValues, EtherSwapValues } from '../../consts/Types';
import { formatERC20SwapValues, formatEtherSwapValues } from './ContractUtils';

interface IContractEventHandler {
  // EtherSwap contract events
  on(
    event: 'eth.lockup',
    listener: (
      transactionHash: string,
      etherSwapValues: EtherSwapValues,
    ) => void,
  ): this;
  emit(
    event: 'eth.lockup',
    transactionHash: string,
    etherSwapValues: EtherSwapValues,
  ): boolean;

  on(
    event: 'eth.claim',
    listener: (
      transactionHash: string,
      preimageHash: Buffer,
      preimage: Buffer,
    ) => void,
  ): this;
  emit(
    event: 'eth.claim',
    transactionHash: string,
    preimageHash: Buffer,
    preimage: Buffer,
  ): boolean;

  on(
    event: 'eth.refund',
    listener: (transactionHash: string, preimageHash: Buffer) => void,
  ): this;
  emit(
    event: 'eth.refund',
    transactionHash: string,
    preimageHash: Buffer,
  ): boolean;

  // ERC20Swap contract events
  on(
    event: 'erc20.lockup',
    listener: (
      transactionHash: string,
      erc20SwapValues: ERC20SwapValues,
    ) => void,
  ): this;
  emit(
    event: 'erc20.lockup',
    transactionHash: string,
    erc20SwapValues: ERC20SwapValues,
  ): boolean;

  on(
    event: 'erc20.claim',
    listener: (
      transactionHash: string,
      preimageHash: Buffer,
      preimage: Buffer,
    ) => void,
  ): this;
  emit(
    event: 'erc20.claim',
    transactionHash: string,
    preimageHash: Buffer,
    preimage: Buffer,
  ): boolean;

  on(
    event: 'erc20.refund',
    listener: (transactionHash: string, preimageHash: Buffer) => void,
  ): this;
  emit(
    event: 'erc20.refund',
    transactionHash: string,
    preimageHash: Buffer,
  ): boolean;
}

class ContractEventHandler
  extends EventEmitter
  implements IContractEventHandler
{
  private etherSwap!: EtherSwap;
  private erc20Swap!: ERC20Swap;

  constructor(private logger: Logger) {
    super();
  }

  public init = async (
    networkDetails: NetworkDetails,
    etherSwap: EtherSwap,
    erc20Swap: ERC20Swap,
  ): Promise<void> => {
    this.etherSwap = etherSwap;
    this.erc20Swap = erc20Swap;

    this.logger.verbose(
      `Starting ${networkDetails.name} contract event subscriptions`,
    );

    await this.subscribeContractEvents();
  };

  public rescan = async (startHeight: number): Promise<void> => {
    const etherLockups = await this.etherSwap.queryFilter(
      this.etherSwap.filters.Lockup(),
      startHeight,
    );

    const etherClaims = await this.etherSwap.queryFilter(
      this.etherSwap.filters.Claim(),
      startHeight,
    );

    const etherRefunds = await this.etherSwap.queryFilter(
      this.etherSwap.filters.Refund(),
      startHeight,
    );

    for (const event of etherLockups) {
      this.emit(
        'eth.lockup',
        event.transactionHash,
        formatEtherSwapValues(event.args!),
      );
    }

    etherClaims.forEach((event) => {
      this.emit(
        'eth.claim',
        event.transactionHash,
        parseBuffer(event.topics[1]),
        parseBuffer(event.args!.preimage),
      );
    });

    etherRefunds.forEach((event) => {
      this.emit(
        'eth.refund',
        event.transactionHash,
        parseBuffer(event.topics[1]),
      );
    });

    const erc20Lockups = await this.erc20Swap.queryFilter(
      this.erc20Swap.filters.Lockup(),
      startHeight,
    );

    const erc20Claims = await this.erc20Swap.queryFilter(
      this.erc20Swap.filters.Claim(),
      startHeight,
    );

    const erc20Refunds = await this.erc20Swap.queryFilter(
      this.erc20Swap.filters.Refund(),
      startHeight,
    );

    for (const event of erc20Lockups) {
      this.emit(
        'erc20.lockup',
        event.transactionHash,
        formatERC20SwapValues(event.args!),
      );
    }

    erc20Claims.forEach((event) => {
      this.emit(
        'erc20.claim',
        event.transactionHash,
        parseBuffer(event.topics[1]),
        parseBuffer(event.args!.preimage),
      );
    });

    erc20Refunds.forEach((event) => {
      this.emit(
        'erc20.refund',
        event.transactionHash,
        parseBuffer(event.topics[1]),
      );
    });
  };

  private subscribeContractEvents = async () => {
    await this.etherSwap.on(
      'Lockup' as any,
      async (
        preimageHash: string,
        amount: bigint,
        claimAddress: string,
        refundAddress: string,
        timelock: bigint,
        event: ContractEventPayload,
      ) => {
        this.emit('eth.lockup', event.log.transactionHash, {
          amount,
          claimAddress,
          refundAddress,
          timelock: Number(timelock),
          preimageHash: parseBuffer(preimageHash),
        });
      },
    );

    await this.etherSwap.on(
      'Claim' as any,
      (preimageHash: string, preimage: string, event: ContractEventPayload) => {
        this.emit(
          'eth.claim',
          event.log.transactionHash,
          parseBuffer(preimageHash),
          parseBuffer(preimage),
        );
      },
    );

    await this.etherSwap.on(
      'Refund' as any,
      (preimageHash: string, event: ContractEventPayload) => {
        this.emit(
          'eth.refund',
          event.log.transactionHash,
          parseBuffer(preimageHash),
        );
      },
    );

    await this.erc20Swap.on(
      'Lockup' as any,
      async (
        preimageHash: string,
        amount: bigint,
        tokenAddress: string,
        claimAddress: string,
        refundAddress: string,
        timelock: bigint,
        event: ContractEventPayload,
      ) => {
        this.emit('erc20.lockup', event.log.transactionHash, {
          amount,
          tokenAddress,
          claimAddress,
          refundAddress,
          timelock: Number(timelock),
          preimageHash: parseBuffer(preimageHash),
        });
      },
    );

    await this.erc20Swap.on(
      'Claim' as any,
      (preimageHash: string, preimage: string, event: ContractEventPayload) => {
        this.emit(
          'erc20.claim',
          event.log.transactionHash,
          parseBuffer(preimageHash),
          parseBuffer(preimage),
        );
      },
    );

    await this.erc20Swap.on(
      'Refund' as any,
      (preimageHash: string, event: ContractEventPayload) => {
        this.emit(
          'erc20.refund',
          event.log.transactionHash,
          parseBuffer(preimageHash),
        );
      },
    );
  };
}

export default ContractEventHandler;
