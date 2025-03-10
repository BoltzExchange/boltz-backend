import axios, { AxiosResponse } from 'axios';
import { Transaction } from 'liquidjs-lib';
import Logger from '../../Logger';
import { sleep } from '../../PromiseUtils';
import { formatError } from '../../Utils';
import { liquidSymbol } from '../../consts/LiquidTypes';
import TypedEventEmitter from '../../consts/TypedEventEmitter';
import { ZeroConfCheck } from './ZeroConfCheck';

export type ZeroConfToolConfig = {
  endpoint: string;

  interval?: number;
  maxRetries?: number;
};

type ZeroConfResponse = {
  observations?: {
    bridge?: {
      seen: number;
      total: number;
    };
  };
};

class ZeroConfTool
  extends TypedEventEmitter<{
    accepted: string;
    timeout: string;
  }>
  implements ZeroConfCheck
{
  private readonly abort = new AbortController();

  private readonly endpoint: string;

  private readonly maxRetries: number;
  private readonly retryDelay: number;

  private readonly toCheck = new Map<string, { retries: number }>();

  private readonly txStats = {
    accepted: 0n,
    rejected: 0n,

    // Number of calls made for transactions that ended up being accepted
    acceptedCalls: 0n,
  };

  constructor(
    private readonly logger: Logger,
    config: ZeroConfToolConfig,
  ) {
    super();

    this.endpoint = config.endpoint;
    this.retryDelay = config.interval || 100;
    this.maxRetries = config.maxRetries || 60;

    this.logger.info(
      `Checking every ${this.retryDelay}ms with ${this.maxRetries} retries with 0-conf tool at: ${this.endpoint}`,
    );

    this.start().then();
  }

  public get name(): string {
    return '0-conf tool';
  }

  public get stats(): typeof this.txStats & { pending: bigint } {
    return {
      ...this.txStats,
      pending: BigInt(this.toCheck.size),
    };
  }

  public checkTransaction = async (
    transaction: Transaction,
  ): Promise<boolean> => {
    const txId = transaction.getId();
    if (!this.toCheck.has(txId)) {
      this.toCheck.set(txId, { retries: 0 });
    }

    return new Promise<boolean>((resolve, reject) => {
      const acceptCallback = (id: string) => {
        if (id === txId) {
          cleanupCallbacks();
          this.logger.verbose(
            `Accepted ${liquidSymbol} 0-conf transaction (${txId}) because it was seen by all bridge nodes`,
          );

          resolve(true);
        }
      };
      const timeoutCallback = (id: string) => {
        if (id === txId) {
          cleanupCallbacks();
          this.logger.warn(
            `Rejected ${liquidSymbol} 0-conf transaction (${txId}): timeout`,
          );

          resolve(false);
        }
      };

      const cleanupCallbacks = () => {
        this.removeListener('accepted', acceptCallback);
        this.removeListener('timeout', timeoutCallback);
      };

      this.on('accepted', acceptCallback);
      this.on('timeout', timeoutCallback);

      this.check().catch((e) => {
        cleanupCallbacks();
        this.toCheck.delete(txId);

        reject(e);
      });
    });
  };

  public stop = () => {
    this.abort.abort();
  };

  private start = async () => {
    while (!this.abort.signal.aborted) {
      await sleep(this.retryDelay);

      try {
        await this.check();
      } catch (e) {
        this.logger.error(`0-conf check failed: ${formatError(e)}`);
      }
    }
  };

  private check = async () => {
    for (const [txId, { retries }] of this.toCheck) {
      const res = (
        await axios.get<any, AxiosResponse<ZeroConfResponse>>(
          `${this.endpoint}/${txId}`,
        )
      ).data;

      const bridgeData = res.observations?.bridge;
      if (bridgeData === undefined) {
        continue;
      }

      if (bridgeData.seen > 0 && bridgeData.seen === bridgeData.total) {
        if (this.toCheck.has(txId)) {
          this.toCheck.delete(txId);
          this.txStats.accepted++;
          this.txStats.acceptedCalls += BigInt(retries) + 1n;
        }

        this.emit('accepted', txId);
        continue;
      }

      const newRetries = retries + 1;
      if (newRetries >= this.maxRetries) {
        if (this.toCheck.has(txId)) {
          this.toCheck.delete(txId);
          this.txStats.rejected++;
        }

        this.emit('timeout', txId);
        continue;
      }

      this.toCheck.set(txId, { retries: newRetries });
    }
  };
}

export default ZeroConfTool;
