import { Transaction } from 'bitcoinjs-lib';
import Logger from '../Logger';
import RpcClient from './RpcClient';
import BaseClient from '../BaseClient';
import { getHexString } from '../Utils';
import { ClientStatus } from '../consts/Enums';
import ZmqClient, { ZmqNotification, filters } from './ZmqClient';
import { Block, BlockchainInfo, RawTransaction, BlockVerbose } from '../consts/Types';

type ChainConfig = {
  host: string;
  port: number;
  rpcuser: string;
  rpcpass: string;

  zmqpubrawtx?: string;
  zmqpubrawblock?: string;
  zmqpubhashblock?: string;
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

type UnspentUtxo = {
  txid: string;
  vout: number;
  address: string;
  label: string;
  scriptPubKey: string;
  amount: number;
  confirmations: number;
  redeemScript: string;
  witnessScript: string;
  spendable: boolean;
  solvable: boolean;
  desc?: string;
  safe: boolean;
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

  constructor(private logger: Logger, private config: ChainConfig, public readonly symbol: string) {
    super();

    this.client = new RpcClient(this.config);
    this.zmqClient = new ZmqClient(
      symbol,
      logger,
      this.getBlock,
      this.getBlockchainInfo,
      this.getBlockhash,
      this.getBlockVerbose,
      this.getRawTransactionVerbose,
    );

    this.listenToZmq();
  }

  public connect = async () => {
    let zmqNotifications: ZmqNotification[] = [];

    // Dogecoin Core and Zcash don't support the "getzmqnotifications" method *yet*
    // Therefore the host and ports for these chains have to be configured manually
    try {
      zmqNotifications = await this.getZmqNotifications();
    } catch (error) {
      if (error.message !== 'Method not found') {
        throw error;
      }

      if (this.config.zmqpubrawtx) {
        zmqNotifications.push({
          type: filters.rawTx,
          address: this.config.zmqpubrawtx,
        });
      }

      if (this.config.zmqpubrawblock) {
        zmqNotifications.push({
          type: filters.rawBlock,
          address: this.config.zmqpubrawblock,
        });
      }

      if (this.config.zmqpubhashblock) {
        zmqNotifications.push({
          type: filters.hashBlock,
          address: this.config.zmqpubhashblock,
        });
      }
    }

    await this.zmqClient.init(zmqNotifications);
  }

  public disconnect = async () => {
    this.clearReconnectTimer();

    await this.zmqClient.close();
    this.setClientStatus(ClientStatus.Disconnected);
  }

  public getNetworkInfo = () => {
    return this.client.request<NetworkInfo>('getnetworkinfo');
  }

  public getBlockchainInfo = async () => {
    const blockchainInfo = await this.client.request<BlockchainInfo>('getblockchaininfo');

    return {
      ...blockchainInfo,
      scannedBlocks: this.zmqClient.blockHeight,
    };
  }

  public getBlock = (hash: string): Promise<Block> => {
    return this.client.request<Block>('getblock', [hash]);
  }

  public getBlockVerbose = (hash: string): Promise<BlockVerbose> => {
    return this.client.request<BlockVerbose>('getblock', [hash, 2]);
  }

  public getBlockhash = (height: number): Promise<string> => {
    return this.client.request<string>('getblockhash', [height]);
  }

  public invalidateBlock = (hash: string) => {
    return this.client.request<void>('invalidateblock', [hash]);
  }

  /**
   * Add an output to the list of relevant ones
   */
  public addOutputFilter = (outputScript: Buffer) => {
    this.zmqClient.relevantOutputs.add(getHexString(outputScript));
  }

  /**
   * Removes an output from the list of relevant ones
   */
  public removeOutputFilter = (outputScript: Buffer) => {
    this.zmqClient.relevantOutputs.delete(getHexString(outputScript));
  }

  /**
   * Adds an input to the list of relevant ones
   */
  public addInputFilter = (inputHash: Buffer) => {
    this.zmqClient.relevantInputs.add(getHexString(inputHash));
  }

  /**
   * Removes an input from the list of relevant ones
   */
  public removeInputFilter = (inputHash: Buffer) => {
    this.zmqClient.relevantInputs.delete(getHexString(inputHash));
  }

  public rescanChain = async (startHeight: number) => {
    await this.zmqClient.rescanChain(startHeight);
  }

  public sendRawTransaction = (rawTransaction: string) => {
    return this.client.request<string>('sendrawtransaction', [rawTransaction]);
  }

  public getRawTransaction = (id: string) => {
    return this.client.request<string>('getrawtransaction', [id]);
  }

  public getRawTransactionVerbose = (id: string) => {
    return this.client.request<RawTransaction>('getrawtransaction', [id, 1]);
  }

  public estimateFee = async (confTarget = 2) => {
    try {
      const response = await this.client.request<any>('estimatesmartfee', [confTarget]);

      if (response.feerate) {
        const feePerKb = response.feerate * ChainClient.decimals;
        return Math.max(Math.round(feePerKb / 1000), 2);
      }

      return 2;
    } catch (error) {
      if (error.message === 'Method not found') {
        // TODO: use estimatefee for outdated node versions
        this.logger.warn(`"estimatesmartfee" method not found on ${this.symbol} chain`);

        return 2;
      }

      throw error;
    }
  }

  /**
   * @param amount in satoshis
   */
  public sendToAddress = (address: string, amount: number) => {
    return this.client.request<string>('sendtoaddress', [address, amount / ChainClient.decimals]);
  }

  public listUnspent = () => {
    return this.client.request<UnspentUtxo[]>('listunspent');
  }

  public generate = async (blocks: number) => {
    return this.client.request<string[]>('generatetoaddress', [blocks, await this.getNewAddress()]);
  }

  private getNewAddress = () => {
    return this.client.request<string>('getnewaddress', []);
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
