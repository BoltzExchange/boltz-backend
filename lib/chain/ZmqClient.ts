import zmq from 'zeromq';
import AsyncLock from 'async-lock';
import { EventEmitter } from 'events';
import { Transaction, crypto } from 'bitcoinjs-lib';
import Logger from '../Logger';
import { getHexString, reverseBuffer } from '../Utils';

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

  on(event: 'transaction.relevant.mempool', listener: (transaction: Transaction) => void): this;
  emit(event: 'transaction.relevant.mempool', transaction: Transaction): boolean;

  on(event: 'transaction.relevant.block', listener: (transaction: Transaction) => void): this;
  emit(event: 'transaction.relevant.block', transaction: Transaction): boolean;
}

class ZmqClient extends EventEmitter {
  // IDs of transactions that contain a UTXOs of Boltz
  public utxos = new Set<string>();
  public relevantOutputs = new Set<string>();

  private blockHeight = 0;
  private bestBlockHash = '';

  private hashBlockAddress?: string;

  constructor(
    private symbol: string,
    private logger: Logger,
    private getBlock: (hash: string) => Promise<{ hash: string, height: number, tx: string[], previousblockhash: string }>,
    private getBlockChainInfo: () => Promise<{ blocks: number, bestblockhash: string }>,
    private getRawTransaction: (hash: string, verbose?: boolean, blockhash?: string) => Promise<string | any>) {
    super();
  }

  public init = async (notifications: ZmqNotification[]) => {
    const activeFilters: any = {};
    const { blocks, bestblockhash } = await this.getBlockChainInfo();

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
      throw `${filters.rawTx} ZMQ notifications are not enabled`;
    }

    const logCouldNotSubscribe = (filter: string) => {
      this.logger.warn(`Could not find ${this.symbol} chain ZMQ filter: ${filter}`);
    };

    if (!activeFilters.rawBlock) {
      logCouldNotSubscribe(filters.rawBlock);

      if (!activeFilters.hashBlock) {
        logCouldNotSubscribe(filters.hashBlock);
      } else {
        this.logger.warn(`Falling back to ${this.symbol} ${filters.hashBlock} ZMQ filter`);
        this.initHashBlock();
      }
    }
  }

  public rescanChain = async (startHeight: number) => {
    // Also rescan the block that got already added to the database to
    // make sure that no transactions are missed
    const bestBlock = this.blockHeight;

    let previousBlockHash = this.bestBlockHash;
    let index = 0;

    while (bestBlock - index >= startHeight) {
      this.logger.verbose(`Rescanning ${this.symbol} block #${startHeight + index}`);

      const block = await this.getBlock(previousBlockHash);

      for (const transactionId of block.tx) {
        const rawTransaction = await this.getRawTransaction(transactionId);
        const transaction = Transaction.fromHex(rawTransaction);

        if (this.isRelevantTransaction(transaction)) {
          this.emit('transaction.relevant.block', transaction);
        }
      }

      previousBlockHash = block.previousblockhash;
      index += 1;
    }
  }

  private initRawTransaction = (address: string) => {
    const socket = this.createSocket(address, 'rawtx');

    socket.on('message', async (_, rawTransaction: Buffer) => {
      const transaction = Transaction.fromBuffer(rawTransaction);
      const id = transaction.getId();

      // If the client has already verified that the transaction is relevant for the wallet
      // when it got added to the mempool we can safely assume that it got included in a block
      // the second time the client gets the transaction
      if (this.utxos.has(id)) {
        this.utxos.delete(id);
        this.emit('transaction.relevant.block', transaction);

        return;
      }

      if (this.isRelevantTransaction(transaction)) {
        const transactionData = await this.getRawTransaction(id);

        // Check whether the transaction got confirmed or added to the mempool
        if (transactionData.confirmations) {
          this.emit('transaction.relevant.block', transaction);
        } else {
          this.utxos.add(id);
          this.emit('transaction.relevant.mempool', transaction);
        }
      }
    });
  }

  // TODO: deal with reorgs
  private initRawBlock = (address: string) => {
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

      if (previousBlockHash === this.bestBlockHash) {
        this.blockHeight += 1;
        this.bestBlockHash = hash;

        this.newChainTip();
      } else {
        this.logOrphanBlock(hash);
      }
    });
  }

  private initHashBlock = () => {
    if (this.hashBlockAddress) {
      const socket = this.createSocket(this.hashBlockAddress, 'hashblock');

      // Because the event handler is doing work asynchronously one has
      // to use a lock to ensure the events get handled sequentially
      const lock = new AsyncLock();
      const lockKey = filters.hashBlock;

      const handleBlock = async (blockHash: string) => {
        const block = await this.getBlock(blockHash);

        if (block.previousblockhash === this.bestBlockHash) {
          this.blockHeight = block.height;
          this.bestBlockHash = block.hash;

          this.newChainTip();
        } else {
          if (block.height > this.blockHeight) {
            const oldHeight = this.blockHeight;

            this.blockHeight = block.height;
            this.bestBlockHash = block.hash;

            for (let i = 1; oldHeight + i <= this.blockHeight; i += 1) {
              this.emit('block', oldHeight + i);
            }

            await this.rescanChain(oldHeight);
          } else {
            this.logOrphanBlock(block.hash);
          }
        }
      };

      socket.on('message', (_, blockHash: Buffer) => {
        const blockHashString = getHexString(blockHash);

        lock.acquire(lockKey, async () => {
          try {
            await handleBlock(blockHashString);
          } catch (error) {
            if (error.message === 'Block not found on disk') {
              // If there are many blocks added to the chain at once Bitcoin Core might
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
    } else {
      this.logger.error(`Could not fall back to ${this.symbol} ${filters.hashBlock} ZMQ filter because it is not enabled`);
    }
  }

  private isRelevantTransaction = (transaction: Transaction) => {
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

  private logOrphanBlock = (hash: string) => {
    this.logger.verbose(`Found ${this.symbol} orphan block: ${hash}`);
  }

  private createSocket = (address: string, filter: string) => {
    const socket = zmq.socket('sub');
    socket.connect(address);
    socket.subscribe(filter);

    this.logger.debug(`Connected to ${this.symbol} ZMQ filter ${filter} on: ${address}`);

    return socket;
  }
}

export default ZmqClient;
export { ZmqNotification };
