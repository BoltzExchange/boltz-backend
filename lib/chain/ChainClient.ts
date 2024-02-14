import { Transaction } from 'bitcoinjs-lib';
import { Transaction as LiquidTransaction } from 'liquidjs-lib';
import BaseClient from '../BaseClient';
import { ChainConfig } from '../Config';
import Logger from '../Logger';
import { formatError, getHexString } from '../Utils';
import { ClientStatus, CurrencyType } from '../consts/Enums';
import {
  Block,
  BlockVerbose,
  BlockchainInfo,
  NetworkInfo,
  RawTransaction,
  UnspentUtxo,
  WalletInfo,
} from '../consts/Types';
import ChainTipRepository from '../db/repositories/ChainTipRepository';
import MempoolSpace from './MempoolSpace';
import RpcClient from './RpcClient';
import ZmqClient, { ZmqNotification, filters } from './ZmqClient';

enum AddressType {
  Legacy = 'legacy',
  P2shegwit = 'p2sh-segwit',
  Bech32 = 'bech32',
  Taproot = 'bech32m',
}

class ChainClient extends BaseClient<{
  'status.changed': ClientStatus;
  block: number;
  transaction: {
    transaction: Transaction | LiquidTransaction;
    confirmed: boolean;
  };
}> {
  public static readonly serviceName = 'Core';
  public static readonly decimals = 100000000;

  public currencyType: CurrencyType = CurrencyType.BitcoinLike;

  protected client: RpcClient;
  protected zmqClient: ZmqClient;
  protected feeFloor = 2;

  private readonly mempoolSpace?: MempoolSpace;

  constructor(
    logger: Logger,
    private readonly config: ChainConfig,
    symbol: string,
  ) {
    super(logger, symbol);

    this.client = new RpcClient(this.config);
    this.zmqClient = new ZmqClient(symbol, logger, this);

    if (this.config.mempoolSpace && this.config.mempoolSpace !== '') {
      this.mempoolSpace = new MempoolSpace(
        this.logger,
        this.symbol,
        this.config.mempoolSpace,
      );
    }
  }

  public serviceName = (): string => {
    return ChainClient.serviceName;
  };

  public connect = async (): Promise<void> => {
    let zmqNotifications: ZmqNotification[] = [];

    if (
      this.config.zmqpubrawtx !== undefined &&
      (this.config.zmqpubrawblock !== undefined ||
        this.config.zmqpubhashblock !== undefined)
    ) {
      this.logger.debug(
        `Using configured ZMQ endpoints for ${this.symbol} client`,
      );

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
    } else {
      this.logger.debug(
        `ZMQ endpoints for ${this.symbol} client not configured; fetching from RPC`,
      );

      // Dogecoin Core and Zcash don't support the 'getzmqnotifications' method *yet*
      // Therefore, the hosts and ports for these chains have to be configured manually
      try {
        zmqNotifications = await this.getZmqNotifications();
      } catch (error) {
        if ((error as any).message === 'Method not found') {
          this.logger.warn(
            `${this.symbol} client does not support fetching ZMQ endpoints. Please set them in the config`,
          );
        }

        throw error;
      }
    }

    await this.zmqClient.init(this.currencyType, zmqNotifications);
    await this.listenToZmq();

    if (this.mempoolSpace) {
      await this.mempoolSpace.init();
    }
  };

  public disconnect = (): void => {
    this.clearReconnectTimer();

    this.zmqClient.close();
    this.setClientStatus(ClientStatus.Disconnected);
  };

  public getNetworkInfo = (): Promise<NetworkInfo> => {
    return this.client.request<NetworkInfo>('getnetworkinfo');
  };

  public getBlockchainInfo = async (): Promise<
    BlockchainInfo & {
      scannedBlocks: number;
    }
  > => {
    const blockchainInfo =
      await this.client.request<BlockchainInfo>('getblockchaininfo');

    return {
      ...blockchainInfo,
      scannedBlocks: this.zmqClient.blockHeight,
    };
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

  /**
   * Add an output to the list of relevant ones
   */
  public addOutputFilter = (outputScript: Buffer): void => {
    this.zmqClient.relevantOutputs.add(getHexString(outputScript));
  };

  /**
   * Removes an output from the list of relevant ones
   */
  public removeOutputFilter = (outputScript: Buffer): void => {
    this.zmqClient.relevantOutputs.delete(getHexString(outputScript));
  };

  /**
   * Adds an input hash to the list of relevant ones
   */
  public addInputFilter = (inputHash: Buffer): void => {
    this.zmqClient.relevantInputs.add(getHexString(inputHash));
  };

  /**
   * Removes an input hash from the list of relevant ones
   */
  public removeInputFilter = (inputHash: Buffer): void => {
    this.zmqClient.relevantInputs.delete(getHexString(inputHash));
  };

  public rescanChain = async (startHeight: number): Promise<void> => {
    await this.zmqClient.rescanChain(startHeight);
  };

  public sendRawTransaction = (rawTransaction: string): Promise<string> => {
    return this.client.request<string>('sendrawtransaction', [rawTransaction]);
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

  public getRawMempool = async () => {
    return this.client.request<string[]>('getrawmempool');
  };

  public estimateFee = async (confTarget = 2): Promise<number> => {
    return this.estimateFeeWithFloor(confTarget);
  };

  public getWalletInfo = async (): Promise<WalletInfo> => {
    return this.client.request<WalletInfo>('getwalletinfo');
  };

  public sendToAddress = (
    address: string,
    amount: number,
    satPerVbyte?: number,
    subtractFeeFromAmount = false,
  ): Promise<string> => {
    return this.client.request<string>('sendtoaddress', [
      address,
      amount / ChainClient.decimals,
      undefined,
      undefined,
      subtractFeeFromAmount,
      false,
      undefined,
      undefined,
      undefined,
      satPerVbyte,
    ]);
  };

  public listUnspent = (minconf = 0): Promise<UnspentUtxo[]> => {
    return this.client.request<UnspentUtxo[]>('listunspent', [minconf]);
  };

  public generate = async (blocks: number): Promise<string[]> => {
    return this.client.request<string[]>('generatetoaddress', [
      blocks,
      await this.getNewAddress(),
    ]);
  };

  public getNewAddress = (
    type: AddressType = AddressType.Bech32,
  ): Promise<string> => {
    return this.client.request<string>('getnewaddress', [undefined, type]);
  };

  protected estimateFeeWithFloor = async (confTarget: number) => {
    const mempoolFee = this.mempoolSpace?.latestFee();

    const estimation =
      mempoolFee !== undefined
        ? mempoolFee
        : await this.estimateFeeChainClient(confTarget);

    return Math.max(estimation, this.feeFloor);
  };

  private estimateFeeChainClient = async (confTarget = 1) => {
    try {
      const response = await this.client.request<any>('estimatesmartfee', [
        confTarget,
      ]);

      if (response.feerate) {
        const feePerKb = response.feerate * ChainClient.decimals;
        return Math.max(Math.round(feePerKb / 1000), 2);
      }

      return this.feeFloor;
    } catch (error) {
      if ((error as any).message === 'Method not found') {
        // TODO: use estimatefee for outdated node versions
        this.logger.warn(
          `'estimatesmartfee' method not found on ${this.symbol} chain`,
        );

        return 2;
      }

      throw error;
    }
  };

  private getZmqNotifications = (): Promise<ZmqNotification[]> => {
    return this.client.request<ZmqNotification[]>('getzmqnotifications');
  };

  private listenToZmq = async (): Promise<void> => {
    const { scannedBlocks } = await this.getBlockchainInfo();
    const chainTip = await ChainTipRepository.findOrCreateTip(
      this.symbol,
      scannedBlocks,
    );

    this.zmqClient.on('block', async (height) => {
      this.logger.silly(`Got new ${this.symbol} block: ${height}`);
      await ChainTipRepository.updateTip(chainTip, height);
      this.emit('block', height);
    });

    this.zmqClient.on('transaction', ({ transaction, confirmed }) => {
      this.emit('transaction', { transaction, confirmed });
    });
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
export { AddressType };
