import TypedEventEmitter from '../../consts/TypedEventEmitter';
import type { Events } from './contracts/ContractEventHandler';
import type ContractEventHandler from './contracts/ContractEventHandler';

class ConsolidatedEventHandler extends TypedEventEmitter<Events> {
  private readonly handlers: ContractEventHandler[] = [];

  constructor() {
    super();
  }

  public register = (handler: ContractEventHandler) => {
    this.handlers.push(handler);

    handler.on('eth.lockup', (lockup) => this.emit('eth.lockup', lockup));
    handler.on('eth.claim', (claim) => this.emit('eth.claim', claim));
    handler.on('eth.refund', (refund) => this.emit('eth.refund', refund));

    handler.on('erc20.lockup', (lockup) => this.emit('erc20.lockup', lockup));
    handler.on('erc20.claim', (claim) => this.emit('erc20.claim', claim));
    handler.on('erc20.refund', (refund) => this.emit('erc20.refund', refund));
  };

  public rescan = async (startHeight: number): Promise<void> => {
    await Promise.all(
      this.handlers.map((handler) => handler.rescan(startHeight)),
    );
  };

  public destroy = () => {
    this.handlers.forEach((handler) => handler.destroy());
  };
}

export default ConsolidatedEventHandler;
