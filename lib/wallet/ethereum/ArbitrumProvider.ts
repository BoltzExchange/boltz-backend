import type { ArbitrumConfig } from '../../Config';
import type Logger from '../../Logger';
import { type NetworkDetails, networks } from './EvmNetworks';
import InjectedProvider from './InjectedProvider';
import type { BlockEvent } from './WebSocketProvider';

class ArbitrumProvider extends InjectedProvider {
  private l1Provider: InjectedProvider;

  constructor(
    logger: Logger,
    networkDetails: NetworkDetails,
    config: ArbitrumConfig,
  ) {
    super(logger, networkDetails, config);

    this.l1Provider = new InjectedProvider(logger, networks.Ethereum, {
      providers: config.l1Providers,
    });
  }

  public override async init(): Promise<void> {
    await super.init();
    await this.l1Provider.init();
  }

  public override async destroy(): Promise<void> {
    await this.l1Provider.destroy();
    await super.destroy();
  }

  public getLocktimeHeight = async (): Promise<number> => {
    return await this.l1Provider.getBlockNumber();
  };

  protected override getLatestBlock = async (): Promise<BlockEvent> => {
    const raw = await this.forwardMethod<{
      number: string;
      l1BlockNumber?: string;
    }>('send', 'eth_getBlockByNumber', ['latest', false]);

    return {
      number: parseInt(raw.number, 16),
      l1BlockNumber:
        raw.l1BlockNumber !== undefined
          ? parseInt(raw.l1BlockNumber, 16)
          : undefined,
    };
  };
}

export default ArbitrumProvider;
