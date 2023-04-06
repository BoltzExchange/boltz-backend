import {
  Log,
  Block,
  Filter,
  FeeData,
  Network,
  Provider,
  BlockTag,
  Listener,
  AddressLike,
  Transaction,
  BigNumberish,
  ProviderEvent,
  InfuraProvider,
  AlchemyProvider,
  JsonRpcProvider,
  TransactionReceipt,
  TransactionRequest,
  TransactionResponse,
} from 'ethers';
import Errors from './Errors';
import Logger from '../../Logger';
import { formatError, stringify } from '../../Utils';
import { EthereumConfig, EthProviderServiceConfig } from '../../Config';
import PendingEthereumTransactionRepository from '../../db/repositories/PendingEthereumTransactionRepository';

enum EthProviderService {
  Node = 'Node',
  Infura = 'Infura',
  Alchemy = 'Alchemy',
}

/**
 * This provider is a wrapper for the JsonRpcProvider of ethers, but it writes sent transactions to the database
 * and, depending on the configuration, falls back to Alchemy and Infura as Web3 provider
 */
class InjectedProvider implements Provider {
  public readonly provider: this;

  private providers = new Map<string, JsonRpcProvider>();
  private pendingEthereumTransactionRepository = new PendingEthereumTransactionRepository();

  private network!: Network;

  private static readonly requestTimeout = 5000;

  constructor(private logger: Logger, config: EthereumConfig) {
    this.provider = this;

    if (config.providerEndpoint) {
      this.providers.set(EthProviderService.Node, new JsonRpcProvider(config.providerEndpoint));
      this.logAddedProvider(EthProviderService.Node, { endpoint: config.providerEndpoint });
    } else {
      this.logDisabledProvider(EthProviderService.Node, 'no endpoint was specified');
    }

    const addEthProvider = (name: EthProviderService, providerConfig: EthProviderServiceConfig) => {
      if (!providerConfig.apiKey) {
        this.logDisabledProvider(name, 'no api key was set');
        return;
      }

      if (!providerConfig.network) {
        this.logDisabledProvider(name, 'no network was specified');
        return;
      }

      switch (name) {
        case EthProviderService.Infura:
          this.providers.set(name, new InfuraProvider(
            providerConfig.network,
            providerConfig.apiKey,
          ));
          break;

        case EthProviderService.Alchemy:
          this.providers.set(name, new AlchemyProvider(
            providerConfig.network,
            providerConfig.apiKey,
          ));
          break;

        default:
          this.logDisabledProvider(name, 'provider not supported');
          return;
      }

      this.logAddedProvider(name, providerConfig);
    };

    addEthProvider(EthProviderService.Infura, config.infura);
    addEthProvider(EthProviderService.Alchemy, config.alchemy);

    if (this.providers.size === 0) {
      throw Errors.NO_PROVIDER_SPECIFIED();
    }
  }

  public init = async (): Promise<void> => {
    this.logger.verbose(`Trying to connect to ${this.providers.size} Web3 providers:\n - ${
      Array.from(this.providers.keys()).join('\n - ')
    }`);

    const networks: Network[] = [];

    for (const [providerName, provider] of this.providers) {
      try {
        const network = await provider.getNetwork();
        this.logConnectedProvider(providerName, network);
        networks.push(network);
      } catch (error) {
        this.logDisabledProvider(providerName, `could not connect: ${formatError(error)}`);
        this.providers.delete(providerName);
      }
    }

    const networksAreSame = networks.every((network) => network.chainId === networks[0].chainId);

    if (!networksAreSame) {
      throw Errors.UNEQUAL_PROVIDER_NETWORKS(networks);
    }

    this.network = networks[0];
    this.logger.info(`Connected to ${this.providers.size} Web3 providers:\n - ${
      Array.from(this.providers.keys()).join('\n - ')
    }`);
  };

  /*
   * Method calls
   */

  public destroy = (): void => {
    this.providers.forEach((provider) => provider.destroy());
  };

  public call = (
    transaction: TransactionRequest,
    blockTag?: BlockTag,
  ): Promise<string> => {
    return this.forwardMethod('call', transaction, blockTag);
  };

  public estimateGas = (transaction: TransactionRequest): Promise<bigint> => {
    return this.forwardMethod('estimateGas', transaction);
  };

  public getBalance = (addressOrName: string, blockTag?: BlockTag): Promise<bigint> => {
    return this.forwardMethod('getBalance', addressOrName, blockTag);
  };

  public getBlock = (blockHashOrBlockTag: BlockTag): Promise<Block> => {
    return this.forwardMethod('getBlock', blockHashOrBlockTag);
  };

  public getBlockNumber = (): Promise<number> => {
    return this.forwardMethod('getBlockNumber');
  };

  public getCode = (addressOrName: string, blockTag?: BlockTag): Promise<string> => {
    return this.forwardMethod('getCode', addressOrName, blockTag);
  };

  public getStorage = (address: AddressLike, position: BigNumberish, blockTag?: BlockTag | undefined): Promise<string> => {
    return this.forwardMethod(
      'getStorage',
      address,
      position,
      blockTag,
    );
  };

  public getGasPrice = (): Promise<bigint> => {
    return this.forwardMethod('getGasPrice');
  };

  public getFeeData = (): Promise<FeeData> => {
    return this.forwardMethod('getFeeData');
  };

  public getLogs = (filter: Filter): Promise<Array<Log>> => {
    return this.forwardMethod('getLogs', filter);
  };

  public getNetwork = async (): Promise<Network> => {
    return this.network;
  };

  public getStorageAt = (
    addressOrName: string,
    position: BigNumberish,
    blockTag?: BlockTag,
  ): Promise<string> => {
    return this.forwardMethod('getStorageAt', addressOrName, position, blockTag);
  };

  public getTransaction = (transactionHash: string): Promise<TransactionResponse> => {
    return this.forwardMethod('getTransaction', transactionHash);
  };

  public getTransactionCount = (
    addressOrName: string,
    blockTag?: BlockTag,
  ): Promise<number> => {
    return this.forwardMethod('getTransactionCount', addressOrName, blockTag);
  };

  public getTransactionReceipt = (transactionHash: string): Promise<TransactionReceipt> => {
    return this.forwardMethod('getTransactionReceipt', transactionHash);
  };

  public getTransactionResult = (hash: string): Promise<string | null> => {
    return this.forwardMethod('getTransactionResult', hash);
  };

  public lookupAddress = (address: string): Promise<string> => {
    return this.forwardMethod('lookupAddress', address);
  };

  public resolveName = (name: string): Promise<string> => {
    return this.forwardMethod('resolveName', name);
  };

  public broadcastTransaction = async (signedTransaction: string): Promise<TransactionResponse> => {
    const transaction = Transaction.from(signedTransaction);
    await this.addToTransactionDatabase(transaction.hash!, transaction.nonce);

    const promises: Promise<TransactionResponse>[] = [];

    // When sending a transaction, you want it to propagate on the network as quickly as possible
    // Therefore, we send it to all available providers
    for (const provider of this.providers.values()) {
      // TODO: handle rejections
      promises.push(provider.broadcastTransaction(signedTransaction));
    }

    // Return the result from whichever provider resolved the Promise first
    // The other "sendTransaction" calls will still be executed but the result won't be returned
    return Promise.race(promises);
  };

  public sendTransaction = async (tx: TransactionRequest): Promise<TransactionResponse> => {
    const res = await this.forwardMethod<Promise<TransactionResponse>>('sendTransaction', tx);
    await this.addToTransactionDatabase(res.hash, res.nonce);

    return res;
  };

  public waitForTransaction = (transactionHash: string, confirmations?: number, timeout?: number): Promise<TransactionReceipt> => {
    return this.forwardMethod(
      'waitForTransaction',
      transactionHash,
      confirmations,
      timeout,
    );
  };

  public waitForBlock = (blockTag?: BlockTag): Promise<Block> => {
    return this.forwardMethod('waitForBlock', blockTag);
  };

  /*
   * Listeners
   */

  public emit = async (eventName: ProviderEvent, ...args: Array<any>): Promise<boolean> => {
    for (const [, provider] of this.providers) {
      await provider.emit(eventName, args);
    }

    return true;
  };

  public addListener = async (eventName: ProviderEvent, listener: Listener): Promise<this> => {
    return this.on(eventName, listener);
  };

  public listenerCount = async (eventName?: ProviderEvent): Promise<number> => {
    return Array.from(this.providers.values())[0].listenerCount(eventName);
  };

  public listeners = async (eventName?: ProviderEvent): Promise<Array<Listener>> => {
    return Array.from(this.providers.values())[0].listeners(eventName);
  };

  public off = async (eventName: ProviderEvent, listener?: Listener): Promise<this> => {
    for (const [, provider] of this.providers) {
      await provider.off(eventName, listener);
    }

    return this;
  };

  public on = async (eventName: ProviderEvent, listener: Listener): Promise<this> => {
    const providerDeltas = new Map<number, number>();

    const injectedListener = (...args: any[]) => {
      if (this.providers.size === 1) {
        listener(...args);
        return;
      }

      const hashCode = this.hashCode(args.map((entry) => JSON.stringify(entry)).join());
      const currentDelta = providerDeltas.get(hashCode) || 0;

      if (currentDelta === this.providers.size - 1) {
        providerDeltas.delete(hashCode);
      } else {
        providerDeltas.set(hashCode, currentDelta + 1);
      }

      if (currentDelta === 0) {
        listener(...args);
      }
    };

    for (const provider of this.providers.values()) {
      await provider.on(eventName, injectedListener);
    }

    return this;
  };

  public once = async (eventName: ProviderEvent, listener: Listener): Promise<this> => {
    let emittedEvent = false;

    const injectedListener = (...args: any[]) => {
      if (!emittedEvent) {
        emittedEvent = true;
        listener(...args);
      }
    };

    for (const provider of this.providers.values()) {
      await provider.once(eventName, injectedListener);
    }

    return this;
  };

  public removeAllListeners = async (eventName?: ProviderEvent): Promise<this> => {
    for (const [, provider] of this.providers) {
      await provider.removeAllListeners(eventName);
    }

    return this;
  };

  public removeListener = (eventName: ProviderEvent, listener: Listener): Promise<this> => {
    return this.off(eventName, listener);
  };

  /*
   * Helper utils
   */

  private forwardMethod = async <T = any>(method: string, ...args: any[]): Promise<T> => {
    const errors: string[] = [];

    for (const [providerName, provider] of this.providers) {
      try {
        const result = await this.promiseWithTimeout(
          provider[method](...args),
          'timeout',
        );

        if (result !== null) {
          return result;
        }
      } catch (error) {
        const formattedError = formatError(error);

        this.logger.warn(`Request to ${providerName} Web3 provider failed: ${method}: ${formattedError}`);
        errors.push(formattedError);
      }
    }

    throw Errors.REQUESTS_TO_PROVIDERS_FAILED(errors);
  };

  private promiseWithTimeout = async (promise: Promise<any>, errorMessage: string): Promise<any> => {
    let timeoutHandle: NodeJS.Timeout;

    const timeoutPromise = new Promise<void>((_, reject) => {
      timeoutHandle = setTimeout(() => reject(errorMessage), InjectedProvider.requestTimeout);
    });

    return Promise.race([
      promise,
      timeoutPromise,
    ]).then((result) => {
      clearTimeout(timeoutHandle);
      return result;
    });
  };

  private addToTransactionDatabase = async (hash: string, nonce: number) => {
    this.logger.silly(`Sending Ethereum transaction: ${hash}`);
    await this.pendingEthereumTransactionRepository.addTransaction(
      hash,
      nonce,
    );
  };

  private hashCode = (value: string): number => {
    let hash = 0;

    for (let i = 0; i < value.length; i++) {
      const char = value.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash |= 0;
    }

    return hash;
  };

  private logAddedProvider = (name: string, config: Record<string, any>) => {
    this.logger.debug(`Adding Web3 provider ${name}: ${stringify(config)}`);
  };

  private logConnectedProvider = (name: string, network: Network) => {
    this.logger.verbose(`Connected to Web3 provider ${name} on network: ${network.chainId}`);
  };

  private logDisabledProvider = (name: string, reason: string) => {
    this.logger.warn(`Disabled ${name} Web3 provider: ${reason}`);
  };
}

export default InjectedProvider;
