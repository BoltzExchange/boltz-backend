import type { Transaction } from 'bitcoinjs-lib';
import type { Transaction as LiquidTransaction } from 'liquidjs-lib';
import BaseClient from '../BaseClient';
import type { ChainConfig } from '../Config';
import type Logger from '../Logger';
import { formatError } from '../Utils';
import { ClientStatus, CurrencyType } from '../consts/Enums';
import type TypedEventEmitter from '../consts/TypedEventEmitter';
import type {
  AddressInfo,
  Block,
  BlockVerbose,
  BlockchainInfo,
  MempoolAcceptResult,
  NetworkInfo,
  RawTransaction,
  UnspentUtxo,
  WalletTransaction,
} from '../consts/Types';
import type Sidecar from '../sidecar/Sidecar';
import Rebroadcaster from './Rebroadcaster';
import RpcClient from './RpcClient';

type SomeTransaction = Transaction | LiquidTransaction;

enum AddressType {
  Legacy = 'legacy',
  P2shegwit = 'p2sh-segwit',
  Bech32 = 'bech32',
  Taproot = 'bech32m',
}

type ChainClientEvents = {
  'status.changed': ClientStatus;
};

interface IChainClient extends TypedEventEmitter<ChainClientEvents> {
  get isRegtest(): boolean;
  get symbol(): string;
  get currencyType(): CurrencyType;

  getBlockchainInfo(): Promise<BlockchainInfo>;
  getNetworkInfo(): Promise<NetworkInfo>;

  getBlock(hash: string): Promise<Block>;
  getBlockhash(height: number): Promise<string>;

  sendRawTransaction(
    transactionHex: string,
    isSwapRelated?: boolean,
  ): Promise<string>;
  getRawTransaction(transactionId: string): Promise<string>;
  getRawTransactionVerbose(transactionId: string): Promise<RawTransaction>;
  getWalletTransaction(transactionId: string): Promise<WalletTransaction>;
  saveRebroadcast(rawTransaction: string): Promise<void>;
  testMempoolAccept(transactionsHex: string[]): Promise<MempoolAcceptResult[]>;

  estimateFee(): Promise<number>;

  listUnspent(minimalConfirmations?: number): Promise<UnspentUtxo[]>;
  getNewAddress(label: string, type: AddressType): Promise<string>;
  sendToAddress(
    address: string,
    amount: number,
    satPerVbyte: number | undefined,
    subtractFeeFromAmount: boolean | undefined,
    label: string,
  ): Promise<string>;
}

class ChainClient extends BaseClient implements IChainClient {
  public static readonly serviceName = 'Core';
  public static readonly decimals = 100_000_000;

  public currencyType: CurrencyType = CurrencyType.BitcoinLike;
  public isRegtest = false;

  protected client: RpcClient;

  private readonly rebroadcaster: Rebroadcaster;

  constructor(
    logger: Logger,
    protected readonly sidecar: Sidecar,
    network: string,
    private readonly config: ChainConfig,
    symbol: string,
  ) {
    super(logger, symbol);

    this.client = new RpcClient(logger, symbol, this.config);
    this.isRegtest = network.toLowerCase().includes('regtest');
    this.rebroadcaster = new Rebroadcaster(this.logger, sidecar, this);
  }

  public serviceName = (): string => {
    return ChainClient.serviceName;
  };

  public disconnect = (): void => {
    this.clearReconnectTimer();
    this.setClientStatus(ClientStatus.Disconnected);
  };

  public getNetworkInfo = (): Promise<NetworkInfo> => {
    return this.client.request<NetworkInfo>('getnetworkinfo');
  };

  public getBlockchainInfo = async () => {
    return await this.client.request<BlockchainInfo>('getblockchaininfo');
  };

  public getBlock = (hash: string): Promise<Block> => {
    return this.client.request<Block>('getblock', [hash]);
  };

  public getBlockVerbose = (hash: string): Promise<BlockVerbose> => {
    return this.client.request<BlockVerbose>('getblock', [hash, 2]);
  };

  public getBlockhash = (height: number): Promise<string> => {
    return this.client.request<string>('getblockhash', [height]);
  };

  public sendRawTransaction = async (
    rawTransaction: string,
  ): Promise<string> => {
    try {
      return await this.client.request<string>('sendrawtransaction', [
        rawTransaction,
      ]);
    } catch (e) {
      if (Rebroadcaster.isReasonToRebroadcast(formatError(e))) {
        await this.rebroadcaster.save(rawTransaction);
      }

      throw e;
    }
  };

  public getRawTransaction = async (id: string): Promise<string> => {
    try {
      return await this.client.request<string>('getrawtransaction', [id]);
    } catch (error) {
      throw this.formatGetTransactionError(id, error);
    }
  };

  public getRawTransactionVerbose = async (
    id: string,
  ): Promise<RawTransaction> => {
    try {
      return await this.client.request<RawTransaction>('getrawtransaction', [
        id,
        1,
      ]);
    } catch (error) {
      throw this.formatGetTransactionError(id, error);
    }
  };

  public testMempoolAccept = (
    transactionsHex: string[],
  ): Promise<MempoolAcceptResult[]> => {
    return this.client.request('testmempoolaccept', [transactionsHex]);
  };

  public getWalletTransaction = (id: string): Promise<WalletTransaction> => {
    return this.client.request<WalletTransaction>('gettransaction', [id], true);
  };

  public saveRebroadcast = (rawTransaction: string): Promise<void> => {
    return this.rebroadcaster.save(rawTransaction);
  };

  public getRawMempool = async () => {
    return this.client.request<string[]>('getrawmempool');
  };

  public estimateFee = async (): Promise<number> => {
    return await this.sidecar.estimateFee(this.symbol);
  };

  public sendToAddress = (
    address: string,
    amount: number,
    satPerVbyte: number | undefined,
    subtractFeeFromAmount = false,
    label: string,
  ): Promise<string> => {
    return this.client.request<string>(
      'sendtoaddress',
      [
        address,
        amount / ChainClient.decimals,
        label,
        undefined,
        subtractFeeFromAmount,
        false,
        undefined,
        undefined,
        undefined,
        satPerVbyte,
      ],
      true,
    );
  };

  public listUnspent = (minimalConfirmations = 0): Promise<UnspentUtxo[]> => {
    return this.client.request<UnspentUtxo[]>(
      'listunspent',
      [minimalConfirmations],
      true,
    );
  };

  public generate = async (blocks: number): Promise<string[]> => {
    return this.client.request<string[]>(
      'generatetoaddress',
      [blocks, await this.getNewAddress('generatetoaddress')],
      true,
    );
  };

  public getNewAddress = (
    label: string,
    type: AddressType = AddressType.Bech32,
  ): Promise<string> => {
    return this.client.request<string>('getnewaddress', [label, type], true);
  };

  public getAddressInfo = (address: string): Promise<AddressInfo> => {
    return this.client.request<AddressInfo>('getaddressinfo', [address], true);
  };

  private formatGetTransactionError = (id: string, error: any): string => {
    const formattedError = formatError(error);
    if (formattedError.includes('No such mempool or blockchain transaction')) {
      return `${formattedError} ID: ${id}`;
    }

    return error;
  };
}

export default ChainClient;
export { AddressType, ChainClientEvents, IChainClient, SomeTransaction };
