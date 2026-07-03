import { getNumber } from 'ethers';
import type { ArbitrumConfig } from '../../Config';
import type Logger from '../../Logger';
import type { NetworkDetails } from './EvmNetworks';
import InjectedProvider from './InjectedProvider';
import type { BlockEvent } from './WebSocketProvider';

class ArbitrumProvider extends InjectedProvider {
  private readonly regtest: boolean;

  constructor(
    logger: Logger,
    networkDetails: NetworkDetails,
    config: ArbitrumConfig,
  ) {
    super(logger, networkDetails, config);

    this.regtest = config.regtest === true;
  }

  public override async init(): Promise<void> {
    await super.init();

    // The block poller swallows getLatestBlock errors; fail at startup instead
    await this.getLatestBlock();
  }

  public getLocktimeHeight = async (): Promise<number> => {
    // Arbitrum contracts read block.number as the L1 height (l1BlockNumber)
    const { number, l1BlockNumber } = await this.getLatestBlock();
    return l1BlockNumber ?? number;
  };

  protected override getLatestBlock = async (): Promise<BlockEvent> => {
    const raw = await this.forwardMethod<{
      number: string | number;
      l1BlockNumber?: string | number | null;
    }>('send', 'eth_getBlockByNumber', ['latest', false]);

    if (raw.l1BlockNumber == null && !this.regtest) {
      const message =
        'Arbitrum RPC returned no l1BlockNumber for the latest block; ' +
        'refusing to fall back to the L2 block number. Check the Arbitrum RPC ' +
        'endpoint (set arbitrum.regtest = true only for regtest).';
      this.logger.error(message);
      throw new Error(message);
    }

    // getNumber also handles the decimal l1BlockNumber anvil forks return
    return {
      number: getNumber(raw.number),
      l1BlockNumber:
        raw.l1BlockNumber != null ? getNumber(raw.l1BlockNumber) : undefined,
    };
  };
}

export default ArbitrumProvider;
