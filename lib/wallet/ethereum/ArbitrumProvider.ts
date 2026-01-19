import type { ArbitrumConfig } from '../../Config';
import type Logger from '../../Logger';
import { type NetworkDetails, networks } from './EvmNetworks';
import InjectedProvider from './InjectedProvider';

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
}

export default ArbitrumProvider;
