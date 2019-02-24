import zmq from 'zeromq';
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

  private rawtx = false;
  private rawBlock = false;

  private blockHeight = 0;
  private bestBlockHash = '';

  constructor(
    private symbol: string,
    private logger: Logger,
    private getBlock: (hash: string) => Promise<{ tx: string[], previousblockhash: string }>,
    private getBlockChainInfo: () => Promise<{ blocks: number, bestblockhash: string }>,
    private getRawTransaction: (hash: string, verbose?: boolean, blockhash?: string) => Promise<string | any>) {
    super();
  }

  public init = async (notifications: ZmqNotification[]) => {
    const { blocks, bestblockhash } = await this.getBlockChainInfo();

    this.blockHeight = blocks;
    this.bestBlockHash = bestblockhash;

    for (const notification of notifications) {
      switch (notification.type) {
        case filters.rawTx:
          this.rawtx = true;
          this.initRawTransaction(notification.address);
          break;

        case filters.rawBlock:
          this.rawBlock = true;
          this.initRawBlock(notification.address);
          break;
      }
    }

    if (!this.rawtx) {
      throw this.getMissingStreamMessage(filters.rawTx);
    }

    if (!this.rawBlock) {
      this.logger.warn(`Could not subscribe to ${this.symbol} chain ${filters.rawBlock}: ${this.getMissingStreamMessage(filters.rawBlock)}`);
    }
  }

  public rescanChain = async (startHeight: number) => {
    // Also rescan the block that got already added to the database to
    // make sure that no transaction are missed
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

      if (this.bestBlockHash === previousBlockHash) {
        this.blockHeight += 1;
        this.bestBlockHash = hash;

        this.logger.silly(`New ${this.symbol} chain tip #${this.blockHeight}: ${hash}`);

        this.emit('block', this.blockHeight);
      } else {
        this.logger.debug(`Found ${this.symbol} orphan block: ${hash}`);
      }
    });
  }

  private isRelevantTransaction = (transaction: Transaction) => {
    for (const output of transaction.outs) {
      if (this.relevantOutputs.has(getHexString(output.script))) {
        return true;
      }
    }

    return false;
  }

  private createSocket = (address: string, filter: string) => {
    const socket = zmq.socket('sub');
    socket.connect(address);
    socket.subscribe(filter);

    this.logger.debug(`Connected to ${this.symbol} ZMQ filter ${filter} on: ${address}`);

    return socket;
  }

  private getMissingStreamMessage = (filter: string) => {
    return `${filter} ZMQ notifications are not enabled`;
  }
}

export default ZmqClient;
export { ZmqNotification };
