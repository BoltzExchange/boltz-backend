import { EventEmitter } from 'events';
import { BigNumber, Event } from 'ethers';
import { EtherSwap } from 'boltz-core/typechain/EtherSwap';
import { Erc20Swap } from 'boltz-core/typechain/Erc20Swap';
import Logger from '../../Logger';
import { parseBuffer } from './EthereumUtils';

type EtherSwapValues = {
  preimageHash: Buffer;
  amount: BigNumber;
  claimAddress: string;
  refundAddress: string;
  timelock: number;
};

type ERC20SwapValues = EtherSwapValues & {
  tokenAddress: string;
};

interface ContractEventHandler {
  // EtherSwap contract events
  on(event: 'eth.lockup', listener: (transactionHash: string, etherSwapValues: EtherSwapValues) => void): this;
  emit(event: 'eth.lockup', transactionHash: string, etherSwapValues: EtherSwapValues): boolean;

  on(event: 'eth.claim', listener: (transactionHash: string, preimageHash: Buffer, preimage: Buffer) => void): this;
  emit(event: 'eth.claim', transactionHash: string, preimageHash: Buffer, preimage: Buffer): boolean;

  on(event: 'eth.refund', listener: (transactionHash: string, preimageHash: Buffer) => void): this;
  emit(event: 'eth.refund', transactionHash: string, preimageHash: Buffer): boolean;

  // ERC20Swap contract events
  on(event: 'erc20.lockup', listener: (transactionHash: string, erc20SwapValues: ERC20SwapValues) => void): this;
  emit(event: 'erc20.lockup', transactionHash: string, erc20SwapValues: ERC20SwapValues): boolean;

  on(event: 'erc20.claim', listener: (transactionHash: string, preimageHash: Buffer, preimage: Buffer) => void): this;
  emit(event: 'erc20.claim', transactionHash: string, preimageHash: Buffer, preimage: Buffer): boolean;

  on(event: 'erc20.refund', listener: (transactionHash: string, preimageHash: Buffer) => void): this;
  emit(event: 'erc20.refund', transactionHash: string, preimageHash: Buffer): boolean;
}

class ContractEventHandler extends EventEmitter {
  private etherSwap!: EtherSwap;
  private erc20Swap!: Erc20Swap;

  constructor(
    private logger: Logger,
  ) {
    super();
  }

  public init = (etherSwap: EtherSwap, erc20Swap: Erc20Swap): void => {
    this.etherSwap = etherSwap;
    this.erc20Swap = erc20Swap;

    this.logger.verbose('Starting contract event subscriptions');

    this.subscribeContractEvents();
  }

  public rescan = async (startHeight: number): Promise<void> => {
    const [etherLockups, etherClaims, etherRefunds] = await Promise.all([
      this.etherSwap.queryFilter(this.etherSwap.filters.Lockup(null, null, null, null, null), startHeight),
      this.etherSwap.queryFilter(this.etherSwap.filters.Claim(null, null), startHeight),
      this.etherSwap.queryFilter(this.etherSwap.filters.Refund(null), startHeight)
    ]);

    for (const event of etherLockups) {
      const args = event.args!;

      this.emit(
        'eth.lockup',
        event.transactionHash,
        {
          preimageHash: parseBuffer(event.topics[1]),
          amount: args.amount,
          claimAddress: args.claimAddress,
          refundAddress: args.refundAddress,
          timelock: args.timelock.toNumber(),
        },
      );
    }

    etherClaims.forEach((event) => {
      this.emit('eth.claim', event.transactionHash, parseBuffer(event.topics[1]), parseBuffer(event.args!.preimage));
    });

    etherRefunds.forEach((event) => {
      this.emit('eth.refund', event.transactionHash, parseBuffer(event.topics[1]));
    });

    const [erc20Lockups, erc20Claims, erc20Refunds] = await Promise.all([
      this.erc20Swap.queryFilter(this.erc20Swap.filters.Lockup(null, null, null, null, null, null), startHeight),
      this.erc20Swap.queryFilter(this.erc20Swap.filters.Claim(null, null), startHeight),
      this.erc20Swap.queryFilter(this.erc20Swap.filters.Refund(null), startHeight)
    ]);


    for (const event of erc20Lockups) {
      const args = event.args!;

      this.emit(
        'erc20.lockup',
        event.transactionHash,
        {
          preimageHash: parseBuffer(event.topics[1]),
          amount: args.amount,
          tokenAddress: args.tokenAddress,
          claimAddress: args.claimAddress,
          refundAddress: args.refundAddress,
          timelock: args.timelock.toNumber(),
        },
      );
    }

    erc20Claims.forEach((event) => {
      this.emit('erc20.claim', event.transactionHash, parseBuffer(event.topics[1]), parseBuffer(event.args!.preimage));
    });

    erc20Refunds.forEach((event) => {
      this.emit('erc20.refund', event.transactionHash, parseBuffer(event.topics[1]));
    });
  }

  private subscribeContractEvents = () => {
    this.etherSwap.on('Lockup', async (
      preimageHash: string,
      amount: BigNumber,
      claimAddress: string,
      refundAddress: string,
      timelock: BigNumber,
      event: Event,
    ) => {
      this.emit(
        'eth.lockup',
        event.transactionHash,
        {
          amount,
          claimAddress,
          refundAddress,
          preimageHash: parseBuffer(preimageHash),
          timelock: timelock.toNumber(),
        },
      );
    });

    this.etherSwap.on('Claim', (preimageHash: string, preimage: string, event: Event) => {
      this.emit('eth.claim', event.transactionHash, parseBuffer(preimageHash), parseBuffer(preimage));
    });

    this.etherSwap.on('Refund', (preimageHash: string, event: Event) => {
      this.emit('eth.refund', event.transactionHash, parseBuffer(preimageHash));
    });

    this.erc20Swap.on('Lockup', async (
      preimageHash: string,
      amount: BigNumber,
      tokenAddress: string,
      claimAddress: string,
      refundAddress: string,
      timelock: BigNumber,
      event: Event,
    ) => {
      this.emit(
        'erc20.lockup',
        event.transactionHash,
        {
          amount,
          tokenAddress,
          claimAddress,
          refundAddress,
          preimageHash: parseBuffer(preimageHash),
          timelock: timelock.toNumber(),
        },
      );
    });

    this.erc20Swap.on('Claim', (preimageHash: string, preimage: string, event: Event) => {
      this.emit('erc20.claim', event.transactionHash, parseBuffer(preimageHash), parseBuffer(preimage));
    });

    this.erc20Swap.on('Refund', (preimageHash: string, event: Event) => {
      this.emit('erc20.refund', event.transactionHash, parseBuffer(preimageHash));
    });
  }
}

export default ContractEventHandler;
export { EtherSwapValues, ERC20SwapValues };
