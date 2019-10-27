import AsyncLock from 'async-lock';
import zmq, { Socket } from 'zeromq';
import { EventEmitter } from 'events';
import { Transaction, crypto } from 'bitcoinjs-lib';
import Errors from './Errors';
import Logger from '../Logger';
import { getHexString, reverseBuffer } from '../Utils';
import { Block, BlockchainInfo, RawTransaction, BlockVerbose } from '../consts/Types';

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

  on(event: 'transaction', listener: (transaction: Transaction, confirmed: boolean) => void): this;
  emit(event: 'transaction', transcation: Transaction, confirmed: boolean): boolean;
}

class ZmqClient extends EventEmitter {
  // IDs of transactions that contain a UTXOs of Boltz
  public utxos = new Set<string>();

  public relevantInputs = new Set<string>();
  public relevantOutputs = new Set<string>();

  private blockHeight = 0;
  private bestBlockHash = '';

  private hashBlockAddress?: string;

  private sockets: Socket[] = [];

  private compatibilityRescan = false;

  // Because the event handlers that process the blocks are doing work asynchronously
  // one has to use a lock to ensure the events get handled sequentially
  private blockHandleLock = new AsyncLock();

  constructor(
    private symbol: string,
    private logger: Logger,
    private getBlock: (hash: string) => Promise<Block>,
    private getBlockchainInfo: () => Promise<BlockchainInfo>,
    private getBlockhash: (height: number) => Promise<string>,
    private getBlockVerbose: (hash: string) => Promise<BlockVerbose>,
    private getRawTransactionVerbose: (id: string) => Promise<RawTransaction>) {
    super();
  }

  public init = async (notifications: ZmqNotification[]) => {
    const activeFilters: any = {};
    const { blocks, bestblockhash } = await this.getBlockchainInfo();

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
          this.initRawBlock(notification.address);
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
      this.logger.warn(`Could not find ${this.symbol} chain ZMQ filter: ${filter}`);
    };

    if (!activeFilters.rawBlock) {
      logCouldNotSubscribe(filters.rawBlock);

      if (!activeFilters.hashBlock) {
        logCouldNotSubscribe(filters.hashBlock);

        throw Errors.NO_BLOCK_NOTIFICATIONS();
      } else {
        this.logger.warn(`Falling back to ${this.symbol} ${filters.hashBlock} ZMQ filter`);
        this.initHashBlock();
      }
    }
  }

  public close = async () => {
    this.sockets.forEach((socket) => {
      // Catch errors that are thrown if the socket is closed already
      try {
        socket.close();
      } catch {}
    });
  }

  public rescanChain = async (startHeight: number) => {
    const checkTransaction = (transaction: Transaction) => {
      if (this.isRelevantTransaction(transaction)) {
        this.emit('transaction', transaction, true);
      }
    };

    try {
      for (let i = 0; startHeight + i <= this.blockHeight; i += 1) {
        this.logger.debug(`Rescanning ${this.symbol} block #${startHeight + i}`);

        const hash = await this.getBlockhash(startHeight + i);

        if (!this.compatibilityRescan) {
          const block = await this.getBlockVerbose(hash);

          for (const { hex } of block.tx) {
            const transaction = Transaction.fromHex(hex);

            checkTransaction(transaction);
          }

        } else {
          const block = await this.getBlock(hash);

          for (const tx of block.tx) {
            const rawTransaction = await this.getRawTransactionVerbose(tx);
            const transaction = Transaction.fromHex(rawTransaction.hex);

            checkTransaction(transaction);
          }
        }
      }
    } catch (error) {
      if (!this.compatibilityRescan) {
        this.logger.info(`Falling back to compatibility rescan for ${this.symbol} chain`);
        this.compatibilityRescan = true;

        await this.rescanChain(startHeight);
      } else {
        throw error;
      }
    }
  }

  private initRawTransaction = (address: string) => {
    const socket = this.createSocket(address, 'rawtx');

    socket.on('message', async (_, rawTransaction: Buffer) => {
      const transaction = Transaction.fromBuffer(rawTransaction);
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
        const transactionData = await this.getRawTransactionVerbose(id) as RawTransaction;

        // Check whether the transaction got confirmed or added to the mempool
        if (transactionData.confirmations) {
          this.emit('transaction', transaction, true);
        } else {
          this.utxos.add(id);
          this.emit('transaction', transaction, false);
        }
      }
    });
  }

  private initRawBlock = (address: string) => {
    const lockKey = filters.rawBlock;
    const socket = this.createSocket(address, 'rawblock');

    socket.monitor();
    socket.on('disconnect', () => {
      socket.disconnect(address);

      this.logger.warn(`${this.symbol} ${filters.rawBlock} ZMQ filter disconnected. Falling back to ${filters.hashBlock}`);
      this.initHashBlock();
    });

    socket.on('message', async (_, rawBlock: Buffer) => {
      const previousBlockHash = getHexString(
        reverseBuffer(
          rawBlock.slice(4, 36),
        ),
      );

      // To get the hash of a block one has to get the header (first 80 bytes),
      // hash it twice with SHA256 and reverse the resulting Buffer
      const hash = getHexString(
        reverseBuffer(
          crypto.sha256(
            crypto.sha256(
              rawBlock.slice(0, 80),
            ),
          ),
        ),
      );

      this.blockHandleLock.acquire(lockKey, async () => {
        if (previousBlockHash === this.bestBlockHash) {
          this.blockHeight += 1;
          this.bestBlockHash = hash;

          this.newChainTip();
        } else {
          // If there are many blocks added to the chain at once, Bitcoin Core might
          // take a few milliseconds to write all of them to the disk. Therefore
          // we just get the height of the previous block and increase it by 1
          const previousBlock = await this.getBlock(previousBlockHash);
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
      }, () => {});
    });
  }

  private initHashBlock = () => {
    if (!this.hashBlockAddress) {
      throw Errors.NO_BLOCK_FALLBACK(this.symbol);
    }

    const lockKey = filters.hashBlock;
    const socket = this.createSocket(this.hashBlockAddress, 'hashblock');

    const handleBlock = async (blockHash: string) => {
      const block = await this.getBlock(blockHash);

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

      this.blockHandleLock.acquire(lockKey, async () => {
        try {
          await handleBlock(blockHashString);
        } catch (error) {
          if (error.message === 'Block not found on disk') {
            // If there are many blocks added to the chain at once, Bitcoin Core might
            // take a few milliseconds to write all of them to the disk. Therefore
            // it just retries getting the block after a little delay
            setTimeout(async () => {
              await handleBlock(blockHashString);
            }, 250);
          } else {
            this.logger.error(`${this.symbol} ${filters.hashBlock} ZMQ filter threw: ${JSON.stringify(error, undefined, 2)}`);
          }
        }
      }, () => {});
    });
  }

  private isRelevantTransaction = (transaction: Transaction) => {
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
  }

  private newChainTip = () => {
    this.logger.silly(`New ${this.symbol} chain tip #${this.blockHeight}: ${this.bestBlockHash}`);

    this.emit('block', this.blockHeight);
  }

  private logReorganize = () => {
    this.logger.info(`Reorganized ${this.symbol} chain to #${this.blockHeight}: ${this.bestBlockHash}`);
  }

  private logOrphanBlock = (hash: string) => {
    this.logger.verbose(`Found ${this.symbol} orphan block: ${hash}`);
  }

  private createSocket = (address: string, filter: string) => {
    const socket = zmq.socket('sub');
    this.sockets.push(socket);

    socket.connect(address);
    socket.subscribe(filter);

    this.logger.debug(`Connected to ${this.symbol} ZMQ filter ${filter} on: ${address}`);

    return socket;
  }
}

export default ZmqClient;
export { ZmqNotification, filters };
