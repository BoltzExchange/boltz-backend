import AsyncLock from 'async-lock';
import type Logger from '../Logger';
import type Sidecar from '../sidecar/Sidecar';
import type ChainClient from './ChainClient';

class Rescanner {
  private static readonly serviceName = 'rescan';

  private readonly lock = new AsyncLock();

  constructor(
    private readonly logger: Logger,
    private readonly chainClient: ChainClient,
    private readonly sidecar: Sidecar,
  ) {}

  public rescan = async () => {
    if (this.lock.isBusy(Rescanner.serviceName)) {
      this.logger.debug(
        `Rescanning ${this.chainClient.symbol} is already in progress`,
      );
      return;
    }

    await this.lock.acquire(Rescanner.serviceName, async () => {
      this.logger.info(
        `Rescanning ${this.chainClient.symbol} chain from height ${this.chainClient.zmqClient.blockHeight}`,
      );

      await this.chainClient.rescanChain(
        this.chainClient.zmqClient.blockHeight,
      );
      await this.sidecar.rescanMempool([this.chainClient.symbol]);
    });
  };
}

export default Rescanner;
