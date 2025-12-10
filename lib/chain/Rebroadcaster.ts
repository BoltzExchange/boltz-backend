import type Logger from '../Logger';
import { formatError } from '../Utils';
import RebroadcastRepository from '../db/repositories/RebroadcastRepository';
import type Sidecar from '../sidecar/Sidecar';
import type { IChainClient } from './ChainClient';

class Rebroadcaster {
  constructor(
    private readonly logger: Logger,
    private readonly sidecar: Sidecar,
    private readonly client: IChainClient,
  ) {
    this.sidecar.on('block', async (block) => {
      if (block.symbol !== this.client.symbol) {
        return;
      }

      try {
        await this.rebroadcast();
      } catch (e) {
        this.logger.error(
          `Rebroadcasts of ${this.client.symbol} failed: ${formatError(e)}`,
        );
      }
    });
  }

  public static isReasonToRebroadcast = (error: string) =>
    error.includes('too-long-mempool-chain');

  public save = async (rawTransaction: string) => {
    if ((await RebroadcastRepository.get(rawTransaction)) !== null) {
      this.logger.debug(`Rebroadcast already saved for ${this.client.symbol}`);
      return;
    }

    this.logger.verbose(`Saving rebroadcast for ${this.client.symbol}`);
    await RebroadcastRepository.add(this.client.symbol, rawTransaction);
  };

  private rebroadcast = async () => {
    this.logger.silly(`Rebroadcasting for ${this.client.symbol}`);

    for (const { rawTransaction } of await RebroadcastRepository.getForSymbol(
      this.client.symbol,
    )) {
      try {
        const txId = await this.client.sendRawTransaction(rawTransaction);
        this.logger.info(
          `Rebroadcast for ${this.client.symbol} succeeded: ${txId}`,
        );
      } catch (e) {
        const formatted = formatError(e);
        if (Rebroadcaster.isReasonToRebroadcast(formatted)) {
          this.logger.debug(
            `Rebroadcast for ${this.client.symbol} failed: ${formatError(e)}`,
          );
          continue;
        }

        this.logger.info(
          `Rebroadcast for ${this.client.symbol} failed (${formatted}) but should not be retried`,
        );
      }

      await RebroadcastRepository.delete(rawTransaction);
    }
  };
}

export default Rebroadcaster;
