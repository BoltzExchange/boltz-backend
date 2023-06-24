import AsyncLock from 'async-lock';
import zmq, { Socket } from 'zeromq';
import { EventEmitter } from 'events';
import { crypto, Transaction } from 'bitcoinjs-lib';
import { Transaction as LiquidTransaction } from 'liquidjs-lib';
import Errors from './Errors';
import Logger from '../Logger';
import ChainClient from './ChainClient';
import { parseTransaction } from '../Core';
import { CurrencyType } from '../consts/Enums';
import { RawTransaction } from '../consts/Types';
import { formatError, getHexString, reverseBuffer } from '../Utils';

type ZmqNotification = {
  type: string;
  address: string;
};

const filters = {
  rawTx: 'pubrawtx',
  rawBlock: 'pubrawblock',
  hashBlock: 'pubhashblock',
};

interface ZmqClient {
  on(event: 'block', listener: (height: number) => void): this;
  emit(event: 'block', height: number): boolean;

  on(
    event: 'transaction',
    listener: (
      transaction: Transaction | LiquidTransaction,
      confirmed: boolean,
    ) => void,
  ): this;
  emit(
    event: 'transaction',
    transaction: Transaction | LiquidTransaction,
    confirmed: boolean,
  ): boolean;
}

class ZmqClient extends EventEmitter {
  // IDs of transactions that contain a UTXOs of Boltz
  public utxos = new Set<string>();

  public relevantInputs = new Set<string>();
  public relevantOutputs = new Set<string>();

  public blockHeight = 0;

  private currencyType!: CurrencyType;

  private bestBlockHash = '';

  private rawBlockAddress?: string;
  private hashBlockAddress?: string;

  private sockets: Socket[] = [];

  private compatibilityRescan = false;

  // Because the event handlers that process the blocks are doing work asynchronously
  // one has to use a lock to ensure the events get handled sequentially
  private blockHandleLock = new AsyncLock();

  private static readonly connectTimeout = 1000;

  constructor(
    private symbol: string,
    private logger: Logger,
    private chainClient: ChainClient,
  ) {
    super();
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
          await this.initRawTransaction(notification.address);
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
      await this.initRawBlock();
    } else {
      logCouldNotSubscribe(filters.rawBlock);

      if (!activeFilters.hashBlock) {
        logCouldNotSubscribe(filters.hashBlock);

        throw Errors.NO_BLOCK_NOTIFICATIONS();
      } else {
        this.logger.warn(
          `Falling back to ${this.symbol} ${filters.hashBlock} ZMQ filter`,
        );
        await this.initHashBlock();
      }
    }
  };

  public close = (): void => {
    this.sockets.forEach((socket) => {
      // Catch errors that are thrown if the socket is closed already
      try {
        socket.close();
      } catch (error) {
        this.logger.debug(
          `${this.symbol} socket already closed: ${formatError(error)}`,
        );
      }
    });
  };

  public rescanChain = async (startHeight: number): Promise<void> => {
    const checkTransaction = (transaction: Transaction | LiquidTransaction) => {
      if (this.isRelevantTransaction(transaction)) {
        this.emit('transaction', transaction, true);
      }
    };

    try {
      for (let i = 0; startHeight + i <= this.blockHeight; i += 1) {
        const hash = await this.chainClient.getBlockhash(startHeight + i);

        if (!this.compatibilityRescan) {
          const block = await this.chainClient.getBlockVerbose(hash);

          for (const { hex } of block.tx) {
            checkTransaction(parseTransaction(this.currencyType, hex));
          }
        } else {
          const block = await this.chainClient.getBlock(hash);

          for (const tx of block.tx) {
            const rawTransaction = await this.chainClient.getRawTransaction(tx);
            checkTransaction(
              parseTransaction(this.currencyType, rawTransaction),
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

  private initRawTransaction = async (address: string) => {
    const socket = await this.createSocket(address, 'rawtx');

    socket.on('message', async (_, rawTransaction: Buffer) => {
      const transaction = parseTransaction(this.currencyType, rawTransaction);
      const id = transaction.getId();

      // If the client has already verified that the transaction is relevant for the wallet
      // when it got added to the mempool we can safely assume that it got included in a block
      // the second time the client receives the transaction
      if (this.utxos.has(id)) {
        this.utxos.delete(id);
        this.emit('transaction', transaction, true);

        return;
      }

      if (this.isRelevantTransaction(transaction)) {
        const transactionData =
          (await this.chainClient.getRawTransactionVerbose(
            id,
          )) as RawTransaction;

        // Check whether the transaction got confirmed or added to the mempool
        if (transactionData.confirmations) {
          this.emit('transaction', transaction, true);
        } else {
          this.utxos.add(id);
          this.emit('transaction', transaction, false);
        }
      }
    });
  };

  private initRawBlock = async () => {
    // Elements raw block subscriptions are not supported
    if (
      this.currencyType === CurrencyType.Liquid ||
      this.rawBlockAddress === undefined
    ) {
      return this.initHashBlock();
    }

    const socket = await this.createSocket(this.rawBlockAddress!, 'rawblock');

    socket.on('disconnect', () => {
      socket.disconnect(this.rawBlockAddress!);

      this.logger.warn(
        `${this.symbol} ${filters.rawBlock} ZMQ filter disconnected. Falling back to ${filters.hashBlock}`,
      );
      this.initHashBlock();
    });

    socket.on('message', async (_, rawBlock: Buffer) => {
      const previousBlockHash = getHexString(
        reverseBuffer(rawBlock.slice(4, 36)),
      );

      // To get the hash of a block one has to get the header (first 80 bytes),
      // hash it twice with SHA256 and reverse the resulting Buffer
      const hash = getHexString(
        reverseBuffer(crypto.sha256(crypto.sha256(rawBlock.slice(0, 80)))),
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
            const previousBlock = await this.chainClient.getBlock(
              previousBlockHash,
            );
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

  private initHashBlock = async () => {
    if (!this.hashBlockAddress) {
      throw Errors.NO_BLOCK_FALLBACK();
    }

    const lockKey = filters.hashBlock;
    const socket = await this.createSocket(this.hashBlockAddress, 'hashblock');

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

    socket.on('message', (_, blockHash: Buffer) => {
      const blockHashString = getHexString(blockHash);

      this.blockHandleLock.acquire(
        lockKey,
        async () => {
          try {
            await handleBlock(blockHashString);
          } catch (error) {
            if ((error as any).message === 'Block not found on disk') {
              // If there are many blocks added to the chain at once, Bitcoin Core might
              // take a few milliseconds to write all of them to the disk. Therefore
              // it just retries getting the block after a little delay
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

  private isRelevantTransaction = (
    transaction: Transaction | LiquidTransaction,
  ) => {
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

  private createSocket = (address: string, filter: string) => {
    return new Promise<Socket>((resolve, reject) => {
      const socket = zmq.socket('sub').monitor();
      this.sockets.push(socket);

      const timeoutHandle = setTimeout(
        () =>
          reject(Errors.ZMQ_CONNECTION_TIMEOUT(this.symbol, filter, address)),
        ZmqClient.connectTimeout,
      );

      socket.on('connect', () => {
        this.logger.debug(
          `Connected to ${this.symbol} ZMQ filter ${filter} on: ${address}`,
        );

        clearTimeout(timeoutHandle);
        resolve(socket);
      });

      socket.connect(address);
      socket.subscribe(filter);
    });
  };
}

export default ZmqClient;
export { ZmqNotification, filters };
