import AsyncLock from 'async-lock';
import type { Transaction } from 'bitcoinjs-lib';
import { crypto } from 'bitcoinjs-lib';
import type { Transaction as LiquidTransaction } from 'liquidjs-lib';
import { parseTransaction } from '../Core';
import type Logger from '../Logger';
import {
  formatError,
  getHexString,
  isTxConfirmed,
  reverseBuffer,
} from '../Utils';
import { CurrencyType } from '../consts/Enums';
import TypedEventEmitter from '../consts/TypedEventEmitter';
import type ChainClient from './ChainClient';
import Errors from './Errors';
import ZmqSocket from './ZmqSocket';

type ZmqNotification = {
  type: string;
  address: string;
};

const filters = {
  rawTx: 'pubrawtx',
  rawBlock: 'pubrawblock',
  hashBlock: 'pubhashblock',
};

export type SomeTransaction = Transaction | LiquidTransaction;

class ZmqClient<T extends SomeTransaction> extends TypedEventEmitter<{
  block: number;
  reconnected: string;
  transaction: {
    transaction: T;
    confirmed: boolean;
  };
}> {
  // 1 hour
  private static readonly inactivityTimeoutMsBlock = 3_600_000;
  // 5 minutes
  private static readonly inactivityTimeoutMsTransaction = 300_000;

  // Maximum value for a signed 32-bit integer (Node.js timer limit)
  private static readonly inactivityTimeoutMsRegtest = 2 ** 31 - 1;

  public relevantInputs = new Set<string>();
  public relevantOutputs = new Set<string>();

  public blockHeight = 0;

  private currencyType!: CurrencyType;

  private bestBlockHash = '';

  private rawBlockAddress?: string;
  private hashBlockAddress?: string;

  private sockets: ZmqSocket[] = [];

  private compatibilityRescan = false;

  // Because the event handlers that process the blocks are doing work asynchronously,
  // one has to use a lock to ensure the events get handled sequentially
  private blockHandleLock = new AsyncLock();

  constructor(
    private readonly symbol: string,
    private readonly logger: Logger,
    private readonly isRegtest: boolean,
    private readonly chainClient: ChainClient,
    private readonly rpcHost: string,
  ) {
    super();

    // For an unreproducible issue with transactions we did not see in the mempool
    if (this.symbol === 'BTC') {
      this.on('block', async (height) => {
        await new Promise((resolve) => setTimeout(resolve, 1_000));
        try {
          await this.rescanChain(height);
        } catch (error) {
          this.logger.error(
            `Error rescanning ${this.symbol} chain after ZMQ block: ${formatError(error)}`,
          );
        }
      });
    }
  }

  public init = async (
    currencyType: CurrencyType,
    notifications: ZmqNotification[],
  ): Promise<void> => {
    this.currencyType = currencyType;

    const activeFilters: any = {};
    const { blocks, bestblockhash } =
      await this.chainClient.getBlockchainInfo();

    this.blockHeight = blocks;
    this.bestBlockHash = bestblockhash;

    for (const notification of notifications) {
      switch (notification.type) {
        case filters.rawTx:
          activeFilters.rawtx = true;
          this.initRawTransaction(notification.address);
          break;

        case filters.rawBlock:
          activeFilters.rawBlock = true;
          this.rawBlockAddress = notification.address;
          break;

        case filters.hashBlock:
          activeFilters.hashBlock = true;
          this.hashBlockAddress = notification.address;
          break;
      }
    }

    if (!activeFilters.rawtx) {
      throw Errors.NO_RAWTX();
    }

    const logCouldNotSubscribe = (filter: string) => {
      this.logger.warn(
        `Could not find ${this.symbol} chain ZMQ filter: ${filter}`,
      );
    };

    if (activeFilters.rawBlock) {
      this.initRawBlock();
    } else {
      logCouldNotSubscribe(filters.rawBlock);

      if (!activeFilters.hashBlock) {
        logCouldNotSubscribe(filters.hashBlock);

        throw Errors.NO_BLOCK_NOTIFICATIONS();
      } else {
        this.logger.warn(
          `Falling back to ${this.symbol} ${filters.hashBlock} ZMQ filter`,
        );
        this.initHashBlock();
      }
    }
  };

  public close = (): void => {
    for (const socket of this.sockets) {
      // Catch errors that are thrown if the socket is closed already
      try {
        socket.disconnect();
      } catch (error) {
        this.logger.debug(
          `${this.symbol} socket already closed: ${formatError(error)}`,
        );
      }
    }
  };

  public rescanChain = async (startHeight: number): Promise<void> => {
    const checkTransaction = (transaction: T) => {
      if (this.isRelevantTransaction(transaction)) {
        this.emit('transaction', { transaction, confirmed: true });
      }
    };

    try {
      for (let i = 0; startHeight + i <= this.blockHeight; i += 1) {
        const hash = await this.chainClient.getBlockhash(startHeight + i);

        if (!this.compatibilityRescan) {
          const block = await this.chainClient.getBlockVerbose(hash);

          for (const { hex } of block.tx) {
            checkTransaction(parseTransaction(this.currencyType, hex) as T);
          }
        } else {
          const block = await this.chainClient.getBlock(hash);

          for (const tx of block.tx) {
            const rawTransaction = await this.chainClient.getRawTransaction(tx);
            checkTransaction(
              parseTransaction(this.currencyType, rawTransaction) as T,
            );
          }
        }
      }
    } catch (error) {
      if (!this.compatibilityRescan) {
        this.logger.info(
          `Falling back to compatibility rescan for ${this.symbol} chain`,
        );
        this.compatibilityRescan = true;

        await this.rescanChain(startHeight);
      } else {
        throw error;
      }
    }
  };

  private initRawTransaction = (address: string) => {
    const socket = this.createSocket(
      address,
      'rawtx',
      this.getInactivityTimeoutMs(ZmqClient.inactivityTimeoutMsTransaction),
    );

    socket.on('data', async (rawTransaction) => {
      const transaction = parseTransaction(
        this.currencyType,
        rawTransaction,
      ) as T;
      const id = transaction.getId();

      if (this.isRelevantTransaction(transaction)) {
        try {
          const transactionData =
            await this.chainClient.getRawTransactionVerbose(id);

          this.emit('transaction', {
            transaction,
            confirmed: isTxConfirmed(transactionData),
          });
        } catch (error) {
          this.logger.error(
            `Getting confirmation status of ${this.symbol} transaction ${id} failed: ${formatError(error)}`,
          );
        }
      }
    });
  };

  private initRawBlock = () => {
    // Elements raw block subscriptions are not supported
    if (
      this.currencyType === CurrencyType.Liquid ||
      this.rawBlockAddress === undefined
    ) {
      return this.initHashBlock();
    }

    const socket = this.createSocket(
      this.rawBlockAddress!,
      'rawblock',
      this.getInactivityTimeoutMs(ZmqClient.inactivityTimeoutMsBlock),
    );

    socket.on('data', async (rawBlock) => {
      const previousBlockHash = getHexString(
        reverseBuffer(rawBlock.subarray(4, 36)),
      );

      // To get the hash of a block one has to get the header (first 80 bytes),
      // hash it twice with SHA256 and reverse the resulting Buffer
      const hash = getHexString(
        reverseBuffer(crypto.sha256(crypto.sha256(rawBlock.subarray(0, 80)))),
      );

      this.blockHandleLock.acquire(
        filters.rawBlock,
        async () => {
          if (previousBlockHash === this.bestBlockHash) {
            this.blockHeight += 1;
            this.bestBlockHash = hash;

            this.newChainTip();
          } else {
            // If there are many blocks added to the chain at once, Bitcoin Core might
            // take a few milliseconds to write all of them to the disk. Therefore,
            // we just get the height of the previous block and increase it by 1
            const previousBlock =
              await this.chainClient.getBlock(previousBlockHash);
            const height = previousBlock.height + 1;

            if (height > this.blockHeight) {
              if (height > this.blockHeight + 1) {
                for (let i = 1; height > this.blockHeight + i; i += 1) {
                  this.emit('block', this.blockHeight + i);
                }
              }

              this.blockHeight = height;
              this.bestBlockHash = hash;

              this.logReorganize();
              this.newChainTip();
            } else {
              this.logOrphanBlock(hash);
            }
          }
        },
        () => {},
      );
    });
  };

  private initHashBlock = () => {
    if (!this.hashBlockAddress) {
      throw Errors.NO_BLOCK_FALLBACK();
    }

    const lockKey = filters.hashBlock;
    const socket = this.createSocket(
      this.hashBlockAddress,
      'hashblock',
      this.getInactivityTimeoutMs(ZmqClient.inactivityTimeoutMsBlock),
    );

    const handleBlock = async (blockHash: string) => {
      const block = await this.chainClient.getBlock(blockHash);

      if (block.previousblockhash === this.bestBlockHash) {
        this.blockHeight = block.height;
        this.bestBlockHash = block.hash;

        this.newChainTip();
      } else {
        if (block.height > this.blockHeight) {
          for (let i = 1; block.height > this.blockHeight + i; i += 1) {
            this.emit('block', this.blockHeight + i);
          }

          this.blockHeight = block.height;
          this.bestBlockHash = block.hash;

          this.logReorganize();
          this.newChainTip();
        } else {
          this.logOrphanBlock(block.hash);
        }
      }
    };

    socket.on('data', (blockHash) => {
      const blockHashString = getHexString(blockHash);

      this.blockHandleLock.acquire(
        lockKey,
        async () => {
          try {
            await handleBlock(blockHashString);
          } catch (error) {
            if ((error as any).message === 'Block not found on disk') {
              // If there are many blocks added to the chain at once, Bitcoin Core might
              // take a few milliseconds to write all of them to the disk.
              // Therefore, it just retries getting the block after a little delay
              setTimeout(async () => {
                await handleBlock(blockHashString);
              }, 250);
            } else {
              this.logger.error(
                `${this.symbol} ${
                  filters.hashBlock
                } ZMQ filter threw: ${JSON.stringify(error, undefined, 2)}`,
              );
            }
          }
        },
        () => {},
      );
    });
  };

  private isRelevantTransaction = (transaction: SomeTransaction) => {
    for (const input of transaction.ins) {
      if (this.relevantInputs.has(getHexString(input.hash))) {
        return true;
      }
    }

    for (const output of transaction.outs) {
      if (this.relevantOutputs.has(getHexString(output.script))) {
        return true;
      }
    }

    return false;
  };

  private newChainTip = () => {
    this.logger.silly(
      `New ${this.symbol} chain tip #${this.blockHeight}: ${this.bestBlockHash}`,
    );

    this.emit('block', this.blockHeight);
  };

  private logReorganize = () => {
    this.logger.info(
      `Reorganized ${this.symbol} chain to #${this.blockHeight}: ${this.bestBlockHash}`,
    );
  };

  private logOrphanBlock = (hash: string) => {
    this.logger.verbose(`Found ${this.symbol} orphan block: ${hash}`);
  };

  private createSocket = (
    address: string,
    filter: string,
    inactivityTimeoutMs: number,
  ) => {
    const sanitizedAddress = this.replaceZmqAddressWildcard(address);
    this.logger.silly(
      `Sanitized ${this.symbol} ZMQ filter ${filter} address (${address}) to: ${sanitizedAddress}`,
    );

    const socket = new ZmqSocket(
      this.logger,
      this.symbol,
      filter,
      sanitizedAddress,
      inactivityTimeoutMs,
    );
    socket.on('reconnected', () => {
      this.emit('reconnected', filter);
    });
    this.sockets.push(socket);
    socket.connect();

    return socket;
  };

  private replaceZmqAddressWildcard = (address: string) =>
    address.replace('0.0.0.0', this.rpcHost);

  private getInactivityTimeoutMs = (real: number) => {
    if (this.isRegtest) {
      return ZmqClient.inactivityTimeoutMsRegtest;
    }

    return real;
  };
}

export default ZmqClient;
export { ZmqNotification, filters };
