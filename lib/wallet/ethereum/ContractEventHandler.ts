import { EventEmitter } from 'events';
import { EtherSwap } from 'boltz-core/typechain/EtherSwap';
import { Erc20Swap } from 'boltz-core/typechain/Erc20Swap';
import Logger from '../../Logger';
import { parseBuffer } from './EthereumUtils';

interface ContractEventHandler {
  // EtherSwap contract events
  on(event: 'eth.lockup', listener: (preimageHash: Buffer) => void): this;
  emit(event: 'eth.lockup', preimageHash: Buffer): boolean;

  on(event: 'eth.claim', listener: (preimageHash: Buffer, preimage: Buffer) => void): this;
  emit(event: 'eth.claim', preimageHash: Buffer, preimage: Buffer): boolean;

  on(event: 'eth.refund', listener: (preimageHash: Buffer) => void): this;
  emit(event: 'eth.refund', preimageHash: Buffer): boolean;

  // ERC20Swap contract events
  on(event: 'erc20.lockup', listener: (preimageHash: Buffer) => void): this;
  emit(event: 'erc20.lockup', preimageHash: Buffer): boolean;

  on(event: 'erc20.claim', listener: (preimageHash: Buffer, preimage: Buffer) => void): this;
  emit(event: 'erc20.claim', preimageHash: Buffer, preimage: Buffer): boolean;

  on(event: 'erc20.refund', listener: (preimageHash: Buffer) => void): this;
  emit(event: 'erc20.refund', preimageHash: Buffer): boolean;
}

class ContractEventHandler extends EventEmitter {
  constructor(
    private logger: Logger,
    private etherSwap: EtherSwap,
    private erc20Swap: Erc20Swap,
  ) {
    super();
  }

  public init = (): void => {
    this.logger.verbose('Starting contract event subscriptions');

    this.subscribeContractEvents();
  }

  public rescan = async (startHeight: number): Promise<void> => {
    const [etherLockups, etherClaims, etherRefunds] = await Promise.all([
      this.etherSwap.queryFilter(this.etherSwap.filters.Lockup(null), startHeight),
      this.etherSwap.queryFilter(this.etherSwap.filters.Claim(null, null), startHeight),
      this.etherSwap.queryFilter(this.etherSwap.filters.Refund(null), startHeight)
    ]);

    etherLockups.forEach((lockup) => {
      this.emit('eth.lockup', parseBuffer(lockup.topics[1]));
    });

    etherClaims.forEach((claim) => {
      this.emit('eth.claim', parseBuffer(claim.topics[1]), parseBuffer(claim.args!.preimage));
    });

    etherRefunds.forEach((refund) => {
      this.emit('eth.refund', parseBuffer(refund.topics[1]));
    });

    const [erc20Lockups, erc20Claims, erc20Refunds] = await Promise.all([
      this.erc20Swap.queryFilter(this.erc20Swap.filters.Lockup(null), startHeight),
      this.erc20Swap.queryFilter(this.erc20Swap.filters.Claim(null, null), startHeight),
      this.erc20Swap.queryFilter(this.erc20Swap.filters.Refund(null), startHeight)
    ]);

    erc20Lockups.forEach((lockup) => {
      this.emit('erc20.lockup', parseBuffer(lockup.topics[1]));
    });

    erc20Claims.forEach((claim) => {
      this.emit('erc20.claim', parseBuffer(claim.topics[1]), parseBuffer(claim.args!.preimage));
    });

    erc20Refunds.forEach((refund) => {
      this.emit('erc20.refund', parseBuffer(refund.topics[1]));
    });
  }

  private subscribeContractEvents = () => {
    this.etherSwap.on('Lockup', (preimageHash) => {
      this.emit('eth.lockup', parseBuffer(preimageHash));
    });

    this.etherSwap.on('Claim', (preimageHash, preimage) => {
      this.emit('eth.claim', parseBuffer(preimageHash), parseBuffer(preimage));
    });

    this.etherSwap.on('Refund', (preimageHash) => {
      this.emit('eth.refund', parseBuffer(preimageHash));
    });

    this.erc20Swap.on('Lockup', (preimageHash) => {
      this.emit('erc20.lockup', parseBuffer(preimageHash));
    });

    this.erc20Swap.on('Claim', (preimageHash, preimage) => {
      this.emit('erc20.claim', parseBuffer(preimageHash), parseBuffer(preimage));
    });

    this.erc20Swap.on('Refund', (preimageHash) => {
      this.emit('erc20.refund', parseBuffer(preimageHash));
    });
  }
}

export default ContractEventHandler;
