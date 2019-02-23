import zmq from 'zeromq';
import { EventEmitter } from 'events';
import { Transaction } from 'bitcoinjs-lib';
import Logger from '../Logger';
import { getHexString } from '../Utils';

type ZmqNotification = {
  type: string;
  address: string;
};

const filters = {
  rawTx: 'pubrawtx',
};

interface ZmqClient {
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

  constructor(
    private symbol: string,
    private logger: Logger,
    private getRawTransaction: (hash: string, verbose?: boolean, blockhash?: string) => Promise<string | any>) {

    super();
  }

  public init = (notifications: ZmqNotification[]) => {
    for (const notification of notifications) {
      switch (notification.type) {
        case filters.rawTx:
          this.rawtx = true;
          this.initRawTransaction(notification.address);
          break;
      }
    }

    if (!this.rawtx) {
      this.throwMissingNotifications(filters.rawTx);
    }
  }

  private initRawTransaction = (address: string) => {
    const socket = this.createSocket(address, 'rawtx');

    socket.on('message', async (_, message) => {
      const transaction = Transaction.fromBuffer(message);
      const id = transaction.getId();

      // If the client has already verified that the transaction is relevant for the wallet
      // when it got added to the mempool we can safely assume that it got included in a block
      // the second time the client gets the transaction
      if (this.utxos.has(id)) {
        this.utxos.delete(id);
        this.emit('transaction.relevant.block', transaction);

        return;
      }

      for (const output of transaction.outs) {
        if (this.relevantOutputs.has(getHexString(output.script))) {
          const transactionData = await this.getRawTransaction(id);

          // Check whether the transaction got confirmed or added to the mempool
          if (transactionData.confirmations) {
            this.emit('transaction.relevant.block', transaction);
          } else {
            this.utxos.add(id);
            this.emit('transaction.relevant.mempool', transaction);
          }
          break;
        }
      }
    });
  }

  private createSocket = (address: string, filter: string) => {
    const socket = zmq.socket('sub');
    socket.connect(address);
    socket.subscribe(filter);

    this.logger.debug(`Connected to ${this.symbol} ZMQ filter ${filter} on: ${address}`);

    return socket;
  }

  private throwMissingNotifications = (filter: string) => {
    throw `${filter} ZMQ notifications are not enabled`;
  }
}

export default ZmqClient;
export { ZmqNotification };
