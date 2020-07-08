import { Transaction } from 'bitcoinjs-lib';
import Logger from '../Logger';
import RpcClient from './RpcClient';
import BaseClient from '../BaseClient';
import { getHexString } from '../Utils';
import { ClientStatus } from '../consts/Enums';
import ZmqClient, { ZmqNotification, filters } from './ZmqClient';
import { Block, BlockchainInfo, RawTransaction, BlockVerbose, NetworkInfo, UnspentUtxo } from '../consts/Types';

type ChainConfig = {
  host: string;
  port: number;
  rpcuser: string;
  rpcpass: string;

  zmqpubrawtx?: string;
  zmqpubrawblock?: string;
  zmqpubhashblock?: string;
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

  public connect = async (): Promise<void> => {
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

  public disconnect = (): void => {
    this.clearReconnectTimer();

    this.zmqClient.close();
    this.setClientStatus(ClientStatus.Disconnected);
  }

  public getNetworkInfo = (): Promise<NetworkInfo> => {
    return this.client.request<NetworkInfo>('getnetworkinfo');
  }

  public getBlockchainInfo = async (): Promise<BlockchainInfo & {
    scannedBlocks: number,
  }> => {
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

  /**
   * Add an output to the list of relevant ones
   */
  public addOutputFilter = (outputScript: Buffer): void => {
    this.zmqClient.relevantOutputs.add(getHexString(outputScript));
  }

  /**
   * Removes an output from the list of relevant ones
   */
  public removeOutputFilter = (outputScript: Buffer): void => {
    this.zmqClient.relevantOutputs.delete(getHexString(outputScript));
  }

  /**
   * Adds an input hash to the list of relevant ones
   */
  public addInputFilter = (inputHash: Buffer): void=> {
    this.zmqClient.relevantInputs.add(getHexString(inputHash));
  }

  /**
   * Removes an input hash from the list of relevant ones
   */
  public removeInputFilter = (inputHash: Buffer): void => {
    this.zmqClient.relevantInputs.delete(getHexString(inputHash));
  }

  public rescanChain = async (startHeight: number): Promise<void> => {
    await this.zmqClient.rescanChain(startHeight);
  }

  public sendRawTransaction = (rawTransaction: string): Promise<string> => {
    return this.client.request<string>('sendrawtransaction', [rawTransaction]);
  }

  public getRawTransaction = (id: string): Promise<string> => {
    return this.client.request<string>('getrawtransaction', [id]);
  }

  public getRawTransactionVerbose = (id: string): Promise<RawTransaction> => {
    return this.client.request<RawTransaction>('getrawtransaction', [id, 1]);
  }

  public estimateFee = async (confTarget = 2): Promise<number> => {
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
   * @param address to which coins should be sent
   * @param amount in satoshis
   */
  public sendToAddress = (address: string, amount: number): Promise<string> => {
    return this.client.request<string>('sendtoaddress', [address, amount / ChainClient.decimals]);
  }

  public listUnspent = (): Promise<UnspentUtxo[]> => {
    return this.client.request<UnspentUtxo[]>('listunspent');
  }

  public generate = async (blocks: number): Promise<string[]> => {
    return this.client.request<string[]>('generatetoaddress', [blocks, await this.getNewAddress()]);
  }

  private getNewAddress = (): Promise<string> => {
    return this.client.request<string>('getnewaddress', []);
  }

  private getZmqNotifications = (): Promise<ZmqNotification[]> => {
    return this.client.request<ZmqNotification[]>('getzmqnotifications');
  }

  private listenToZmq = (): void=> {
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
