import { Transaction } from 'bitcoinjs-lib';
import Logger from '../Logger';
import RpcClient from './RpcClient';
import BaseClient from '../BaseClient';
import { getHexString } from '../Utils';
import { ClientStatus } from '../consts/Enums';
import ZmqClient, { ZmqNotification } from './ZmqClient';

type ChainConfig = {
  host: string;
  port: number;
  rpcuser: string;
  rpcpass: string;

  // The method to get the addresses for ZMQ sockets ('getzmqnotifications') got added
  // with Bitcoin Core version 0.17 and because the latest release of Litecoin Core is
  // one version behind (0.16.3 at the time writing this) the socket has to be set manually
  pubrawtx?: string;
};

type NetworkInfo = {
  version: number;
  subversion: string;
  protocolversion: number;
  localservices: number;
  localrelay: boolean;
  timeoffset: number;
  networkactive: boolean;
  connections: number;
  relayfee: number;
  incrementalfee: number;
};

type BlockchainInfo = {
  chain: string;
  blocks: number;
  headers: number;
  bestblockhash: string;
  difficulty: number;
  mediantime: number;
  verificationprogress: number;
  initialblockdownload: string;
  chainwork: string;
  size_on_disk: number;
  pruned: false;
};

type Block = {
  hash: string;
  confirmations: number;
  strippedsize: number;
  size: number;
  weight: number;
  height: number;
  version: number;
  versionHex: string;
  merkleroot: string;
  tx: string[];
  time: number;
  nonce: number;
  bits: string;
  difficulty: number;
  chainwork: string;
  nTx: number;
  previousblockhash: string;
};

// TODO: add latest block height of pubrawblock to database
// TODO: rescan all blocks that came after the latest in the database
interface ChainClient {
  // TODO: block connected with pubrawblock
  on(event: 'block.connected', listener: (height: number) => void): this;
  emit(event: 'block.connected', height: number): boolean;

  on(event: 'transaction.relevant.mempool', listener: (transaction: Transaction) => void): this;
  emit(event: 'transaction.relevant.mempool', transaction: Transaction): boolean;

  on(event: 'transaction.relevant.block', listener: (transaction: Transaction) => void): this;
  emit(event: 'transaction.relevant.block', transaction: Transaction): boolean;
}

class ChainClient extends BaseClient {
  private client: RpcClient;
  private zmqClient: ZmqClient;

  constructor(logger: Logger, private config: ChainConfig, public readonly symbol: string) {
    super();

    this.client = new RpcClient(config);
    this.zmqClient = new ZmqClient(symbol, logger, this.getRawTransaction);

    this.zmqClient.on('transaction.relevant.mempool', (transaction) => {
      this.emit('transaction.relevant.mempool', transaction);
    });

    this.zmqClient.on('transaction.relevant.block', (transaction) => {
      this.emit('transaction.relevant.block', transaction);
    });
  }

  public connect = async () => {
    const notifications = this.config.pubrawtx ? [
      {
        type: 'pubrawtx',
        address: this.config.pubrawtx!,
      },
    ] : await this.getZmqNotifications();

    this.zmqClient.init(notifications);
  }

  public disconnect = () => {
    this.clearReconnectTimer();
    this.setClientStatus(ClientStatus.Disconnected);
  }

  public getNetworkInfo = () => {
    return this.client.request<NetworkInfo>('getnetworkinfo');
  }

  public getBlockchainInfo = () => {
    return this.client.request<BlockchainInfo>('getblockchaininfo');
  }

  public getBlock = (hash: string): Promise<Block> => {
    return this.client.request<Block>('getblock', [hash]);
  }

  /**
   * Adds outputs to the list of relevant ones
   *
   * @param outputScripts list of output script Buffer
   */
  public updateOutputFilter = (outputScripts: Buffer[]) => {
    outputScripts.forEach((script) => {
      this.zmqClient.relevantOutputs.add(getHexString(script));
    });
  }

  public sendRawTransaction = (rawTransaction: string, allowHighFees = true) => {
    return this.client.request<string>('sendrawtransaction', [rawTransaction, allowHighFees]);
  }

  /**
   * @param blockhash if provided Bitcoin Core will search for the transaction only in that block
   */
  public getRawTransaction = (hash: string, verbose = false, blockhash?: string) => {
    // TODO: add type
    return this.client.request<string | any>('getrawtransaction', [hash, verbose, blockhash]);
  }

  public estimateFee = async (confTarget = 2) => {
    const response = await this.client.request<any>('estimatesmartfee', [confTarget]);

    if (typeof response === 'object') {
      return 2;
    }

    const feePerKb = response * 100000000;
    return feePerKb / 1000;
  }

  public generate = (blocks: number) => {
    return this.client.request<string[]>('generate', [blocks]);
  }

  private getZmqNotifications = () => {
    return this.client.request<ZmqNotification[]>('getzmqnotifications');
  }
}

export default ChainClient;
export { ChainConfig };
