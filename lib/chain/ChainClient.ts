import { Transaction } from 'bitcoinjs-lib';
import Logger from '../Logger';
import RpcClient from './RpcClient';
import BaseClient from '../BaseClient';
import { getHexString } from '../Utils';
import { ClientStatus } from '../consts/Enums';
import ZmqClient, { ZmqNotification } from './ZmqClient';
import { Block, BlockchainInfo, RawTransaction } from '../consts/Types';

type ChainConfig = {
  host: string;
  port: number;
  rpcuser: string;
  rpcpass: string;
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

interface ChainClient {
  on(event: 'block', listener: (height: number) => void): this;
  emit(event: 'block', height: number): boolean;

  on(event: 'transaction', listener: (transaction: Transaction, confirmed: boolean) => void): this;
  emit(event: 'transaction', transcation: Transaction, confirmed: boolean): boolean;
}

class ChainClient extends BaseClient {
  public zmqClient: ZmqClient;

  private client: RpcClient;

  private static readonly decimals = 100000000;

  constructor(logger: Logger, config: ChainConfig, public readonly symbol: string) {
    super();

    this.client = new RpcClient(config);
    this.zmqClient = new ZmqClient(
      symbol,
      logger,
      this.getBlock,
      this.getBlockchainInfo,
      this.getRawTransaction,
    );

    this.listenToZmq();
  }

  public connect = async () => {
    await this.zmqClient.init(await this.getZmqNotifications());
  }

  public disconnect = async () => {
    this.clearReconnectTimer();

    await this.zmqClient.close();
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

  public invalidateBlock = (hash: string) => {
    return this.client.request<void>('invalidateblock', [hash]);
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

  public rescanChain = async (startHeight: number) => {
    await this.zmqClient.rescanChain(startHeight);
  }

  public sendRawTransaction = (rawTransaction: string, allowHighFees = true) => {
    return this.client.request<string>('sendrawtransaction', [rawTransaction, allowHighFees]);
  }

  public getRawTransaction = (id: string) => {
    return this.client.request<string>('getrawtransaction', [id]);
  }

  public getRawTransactionVerbose = (id: string) => {
    return this.client.request<RawTransaction>('getrawtransaction', [id, true]);
  }

  public estimateFee = async (confTarget = 2) => {
    const response = await this.client.request<any>('estimatesmartfee', [confTarget]);

    if (response.feerate) {
      const feePerKb = response.feerate * ChainClient.decimals;
      return Math.max(Math.round(feePerKb / 1000), 2);
    }

    return 2;
  }

  /**
   * @param amount in satoshis
   */
  public sendToAddress = (address: string, amount: number) => {
    return this.client.request<string>('sendtoaddress', [address, amount / ChainClient.decimals]);
  }

  public generate = (blocks: number) => {
    return this.client.request<string[]>('generate', [blocks]);
  }

  private getZmqNotifications = () => {
    return this.client.request<ZmqNotification[]>('getzmqnotifications');
  }

  private listenToZmq = () => {
    this.zmqClient.on('block', (height) => {
      this.emit('block', height);
    });

    this.zmqClient.on('transaction', (transaction, confirmed) => {
      this.emit('transaction', transaction, confirmed);
    });
  }
}

export default ChainClient;
export { ChainConfig };
