import { BigNumber, BigNumberish, providers, utils } from 'ethers';
import { BlockWithTransactions } from '@ethersproject/abstract-provider';
import Errors from './Errors';
import Logger from '../../Logger';
import { formatError, stringify } from '../../Utils';
import { EthereumConfig, EthProviderServiceConfig } from '../../Config';
import PendingEthereumTransactionRepository from '../../db/PendingEthereumTransactionRepository';

enum EthProviderService {
  Infura = 'Infura',
  Alchemy = 'Alchemy',
  Websocket = 'WebSocket'
}

/**
 * This provider is a wrapper for the WebSocketProvider of ethers but it writes sent transactions to the database
 * and, depending on the configuration, falls back to Alchemy and Infura as Web3 provider
 */
class InjectedProvider implements providers.Provider {
  public _isProvider = true;

  private providers = new Map<string, providers.WebSocketProvider>();
  private pendingEthereumTransactionRepository = new PendingEthereumTransactionRepository();

  private network!: providers.Network;

  constructor(private logger: Logger, config: EthereumConfig) {
    if (config.providerEndpoint) {
      this.providers.set(EthProviderService.Websocket, new providers.WebSocketProvider(config.providerEndpoint));
      this.logAddedProvider(EthProviderService.Websocket, { endpoint: config.providerEndpoint });
    } else {
      this.logDisabledProvider(EthProviderService.Websocket, 'no endpoint was specified');
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
          this.providers.set(name, new providers.InfuraWebSocketProvider(
            providerConfig.network,
            providerConfig.apiKey,
          ));
          break;

        case EthProviderService.Alchemy:
          this.providers.set(name, new providers.AlchemyWebSocketProvider(
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
    this.logger.verbose(`Trying to connect to ${this.providers.size} Web3 providers:\n - ${Array.from(this.providers.keys()).join('\n - ')}`);

    const networks: providers.Network[] = [];

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
    this.logger.info(`Connected to ${this.providers.size} Web3 providers:\n - ${Array.from(this.providers.keys()).join('\n - ')}`);
  }

  public destroy = async (): Promise<void> => {
    for (const provider of this.providers.values()) {
      await provider.destroy();
    }
  }

  /*
   * Method calls
   */

  public call = (
    transaction: utils.Deferrable<providers.TransactionRequest>,
    blockTag?: providers.BlockTag,
  ): Promise<string> => {
    return this.forwardMethod('call', transaction, blockTag);
  }

  public estimateGas = (transaction: providers.TransactionRequest): Promise<BigNumber> => {
    return this.forwardMethod('estimateGas', transaction);
  }

  public getBalance = (addressOrName: string, blockTag?: providers.BlockTag): Promise<BigNumber> => {
    return this.forwardMethod('getBalance', addressOrName, blockTag);
  }

  public getBlock = (blockHashOrBlockTag: providers.BlockTag): Promise<providers.Block> => {
    return this.forwardMethod('getBlock', blockHashOrBlockTag);
  }

  public getBlockNumber = (): Promise<number> => {
    return this.forwardMethod('getBlockNumber');
  }

  public getBlockWithTransactions = (blockHashOrBlockTag: providers.BlockTag): Promise<BlockWithTransactions> => {
    return this.forwardMethod('getBlockWithTransactions', blockHashOrBlockTag);
  }

  public getCode = (addressOrName: string, blockTag?: providers.BlockTag): Promise<string> => {
    return this.forwardMethod('getCode', addressOrName, blockTag);
  }

  public getGasPrice = (): Promise<BigNumber> => {
    return this.forwardMethod('getGasPrice');
  }

  public getLogs = (filter: providers.Filter): Promise<Array<providers.Log>> => {
    return this.forwardMethod('getLogs', filter);
  }

  public getNetwork = async (): Promise<providers.Network> => {
    return this.network;
  }

  public getStorageAt = (
    addressOrName: string,
    position: BigNumberish,
    blockTag?: providers.BlockTag,
  ): Promise<string> => {
    return this.forwardMethod('getStorageAt', addressOrName, position, blockTag);
  }

  public getTransaction = (transactionHash: string): Promise<providers.TransactionResponse> => {
    return this.forwardMethod('getTransaction', transactionHash);
  }

  public getTransactionCount = (
    addressOrName: string,
    blockTag?: providers.BlockTag,
  ): Promise<number> => {
    return this.forwardMethod('getTransactionCount', addressOrName, blockTag);
  }

  public getTransactionReceipt = (transactionHash: string): Promise<providers.TransactionReceipt> => {
    return this.forwardMethod('getTransactionReceipt', transactionHash);
  }

  public lookupAddress = (address: string): Promise<string> => {
    return this.forwardMethod('lookupAddress', address);
  }

  public resolveName = (name: string): Promise<string> => {
    return this.forwardMethod('resolveName', name);
  }

  public sendTransaction = async (signedTransaction: string): Promise<providers.TransactionResponse> => {
    const transaction = utils.parseTransaction(signedTransaction);

    this.logger.silly(`Sending Ethereum transaction: ${transaction.hash}`);
    await this.pendingEthereumTransactionRepository.addTransaction(
      transaction.hash!,
      transaction.nonce,
    );

    const promises: Promise<providers.TransactionResponse>[] = [];

    // When sending a transaction, you want it to propagate on the network as quickly as possible
    // Therefore, we send the it to all available providers
    for (const provider of this.providers.values()) {
      // TODO: handle rejections
      promises.push(provider.sendTransaction(signedTransaction));
    }

    // Return the result from whichever provider resolved the Promise first
    // The other "sendTransaction" calls will still be executed but the result won't be returned
    return Promise.race(promises);
  }

  public waitForTransaction = (transactionHash: string, confirmations?: number, timeout?: number): Promise<providers.TransactionReceipt> => {
    return this.forwardMethod('waitForTransaction', {
      transactionHash,
      confirmations,
      timeout,
    });
  }

  /*
   * Listeners
   */

  public emit = (eventName: providers.EventType, ...args: Array<any>): boolean => {
    for (const [, provider] of this.providers) {
      provider.emit(eventName, args);
    }

    return true;
  }

  public addListener = (eventName: providers.EventType, listener: providers.Listener): providers.Provider => {
    return this.on(eventName, listener);
  }

  public listenerCount = (eventName?: providers.EventType): number => {
    return Array.from(this.providers.values())[0].listenerCount(eventName);
  }

  public listeners = (eventName?: providers.EventType): Array<providers.Listener> => {
    return Array.from(this.providers.values())[0].listeners(eventName);
  }

  public off = (eventName: providers.EventType, listener?: providers.Listener): providers.Provider => {
    for (const [, provider] of this.providers) {
      provider.off(eventName, listener);
    }

    return this;
  }

  public on = (eventName: providers.EventType, listener: providers.Listener): providers.Provider => {
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
      provider.on(eventName, injectedListener);
    }

    return this;
  }

  public once = (eventName: providers.EventType, listener: providers.Listener): providers.Provider => {
    let emittedEvent = false;

    const injectedListener = (...args: any[]) => {
      if (!emittedEvent) {
        emittedEvent = true;
        listener(...args);
      }
    };

    for (const provider of this.providers.values()) {
      provider.once(eventName, injectedListener);
    }

    return this;
  }

  public removeAllListeners = (eventName?: providers.EventType): providers.Provider => {
    for (const [, provider] of this.providers) {
      provider.removeAllListeners(eventName);
    }

    return this;
  }

  public removeListener = (eventName: providers.EventType, listener: providers.Listener): providers.Provider => {
    return this.off(eventName, listener);
  }

  /*
   * Helper utils
   */

  private forwardMethod = async (method: string, ...args: any[]): Promise<any> => {
    const errors: string[] = [];

    let resultIsNull = false;

    for (const [providerName, provider] of this.providers) {
      try {
        const result = await provider[method](...args);

        if (result !== null) {
          return result;
        } else {
          resultIsNull = true;
        }
      } catch (error) {
        const formattedError = formatError(error);

        this.logger.warn(`Request to ${providerName} Web3 provider failed: ${formattedError}`);
        errors.push(formattedError);
      }
    }

    if (resultIsNull) {
      return null;
    }

    throw Errors.REQUESTS_TO_PROVIDERS_FAILED(errors);
  }

  private hashCode = (value: string): number => {
    let hash = 0;

    for (let i = 0; i < value.length; i++) {
      const char = value.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash |= 0;
    }

    return hash;
  }

  private logAddedProvider = (name: string, config: Record<string, any>) => {
    this.logger.debug(`Adding Web3 provider ${name}: ${stringify(config)}`);
  }

  private logConnectedProvider = (name: string, network: providers.Network) => {
    this.logger.verbose(`Connected to Web3 provider ${name} on network: ${network.chainId}`);
  }

  private logDisabledProvider = (name: string, reason: string) => {
    this.logger.warn(`Disabled ${name} Web3 provider: ${reason}`);
  }
}

export default InjectedProvider;
