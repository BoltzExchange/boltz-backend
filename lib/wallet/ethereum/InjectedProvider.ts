import { SpanKind, SpanStatusCode, context, trace } from '@opentelemetry/api';
import type {
  AbstractProvider,
  AddressLike,
  BigNumberish,
  Block,
  BlockTag,
  FeeData,
  Filter,
  Listener,
  Log,
  Network,
  Provider,
  ProviderEvent,
  TransactionReceipt,
  TransactionRequest,
  TransactionResponse,
} from 'ethers';
import { JsonRpcProvider, Transaction } from 'ethers';
import type { EthereumConfig, ProviderConfig } from '../../Config';
import { shutdownSignal } from '../../ExitHandler';
import type Logger from '../../Logger';
import { racePromise, sleep } from '../../PromiseUtils';
import Tracing from '../../Tracing';
import { formatError } from '../../Utils';
import PendingEthereumTransactionRepository from '../../db/repositories/PendingEthereumTransactionRepository';
import Errors from './Errors';
import { isNonceConflictError } from './EthereumUtils';
import type { NetworkDetails } from './EvmNetworks';
import WebSocketProvider, { type BlockEvent } from './WebSocketProvider';

const bigIntReplacer = (_key: string, value: any) =>
  typeof value === 'bigint' ? { $bigint: value.toString() } : value;

const broadcastRecoveryDelays = [250, 750, 1_500, 3_000, 5_000, 8_000, 11_500];
const broadcastTransactionLookupTimeout = 5_000;

/**
 * This provider is a wrapper for the Provider of ethers, but it writes sent transactions to the database
 * and, depending on the configuration, falls back to alternative providers
 */
class InjectedProvider implements Provider {
  public readonly provider: this;

  private providers = new Map<string, AbstractProvider>();
  private network!: Network;
  private destroyed = false;

  private blockListeners = new Set<(block: BlockEvent) => void>();
  private blockPollTimer: NodeJS.Timeout | undefined;
  private reconnectCallbacks = new Set<() => void>();

  private static readonly requestTimeout = 5000;
  private static readonly blockPollIntervalMs = 2_500;

  constructor(
    private readonly logger: Logger,
    private readonly networkDetails: NetworkDetails,
    config: Pick<EthereumConfig, 'providers' | 'providerEndpoint'>,
  ) {
    this.provider = this;

    const providers = config.providers ?? [];
    if (
      config.providerEndpoint !== undefined &&
      config.providerEndpoint !== ''
    ) {
      providers.push({
        endpoint: config.providerEndpoint,
      });
    }

    for (const provider of providers) {
      this.addEthProvider(provider);
    }

    if (this.providers.size === 0) {
      throw Errors.NO_PROVIDER_SPECIFIED();
    }
  }

  public async init(): Promise<void> {
    this.logger.verbose(
      `Trying to connect to ${this.providers.size} ${
        this.networkDetails.name
      } RPC providers:\n - ${Array.from(this.providers.keys()).join('\n - ')}`,
    );

    const networks: Network[] = [];

    for (const [providerName, provider] of this.providers) {
      try {
        const network = await provider.getNetwork();
        this.logConnectedProvider(providerName, network);
        networks.push(network);
      } catch (error) {
        this.logDisabledProvider(
          providerName,
          `could not connect: ${formatError(error)}`,
        );
        this.providers.delete(providerName);
      }
    }

    if (networks.length === 0) {
      throw Errors.NO_PROVIDER_SPECIFIED();
    }

    const networksAreSame = networks.every(
      (network) => network.chainId === networks[0].chainId,
    );

    if (!networksAreSame) {
      throw Errors.UNEQUAL_PROVIDER_NETWORKS(networks);
    }

    this.network = networks[0];
    this.logger.info(
      `Connected to ${this.providers.size} ${
        this.networkDetails.name
      } RPC providers:\n - ${Array.from(this.providers.keys()).join('\n - ')}`,
    );
  }

  private addEthProvider = (config: ProviderConfig) => {
    const name = config.name ?? config.endpoint;

    if (config.endpoint === undefined || config.endpoint === '') {
      this.logDisabledProvider(name, 'not configured');
      return;
    }

    this.providers.set(
      name,
      config.endpoint.startsWith('ws://') ||
        config.endpoint.startsWith('wss://')
        ? new WebSocketProvider(
            this.logger,
            this.networkDetails.symbol,
            name,
            config.endpoint,
          )
        : new JsonRpcProvider(config.endpoint, undefined, {
            staticNetwork: true,
            polling: true,
            pollingInterval: InjectedProvider.blockPollIntervalMs,
          }),
    );

    this.logAddedProvider(name);
  };

  public getLocktimeHeight = async (): Promise<number> => {
    return await this.getBlockNumber();
  };

  /*
   * Method calls
   */

  public async destroy(): Promise<void> {
    this.destroyed = true;
    if (this.blockPollTimer !== undefined) {
      clearInterval(this.blockPollTimer);
      this.blockPollTimer = undefined;
    }
    this.blockListeners.clear();

    for (const provider of this.providers.values()) {
      if (provider instanceof WebSocketProvider) {
        for (const cb of this.reconnectCallbacks) {
          provider.ws.off('reconnected', cb);
        }
      }
    }
    this.reconnectCallbacks.clear();

    await Promise.all(
      Array.from(this.providers.values()).map((provider) => provider.destroy()),
    );
  }

  public call = (
    transaction: TransactionRequest,
    blockTag?: BlockTag,
  ): Promise<string> => {
    return this.forwardMethod('call', transaction, blockTag);
  };

  public estimateGas = (transaction: TransactionRequest): Promise<bigint> => {
    return this.forwardMethod('estimateGas', transaction);
  };

  public getBalance = (
    addressOrName: string,
    blockTag?: BlockTag,
  ): Promise<bigint> => {
    return this.forwardMethod('getBalance', addressOrName, blockTag);
  };

  public getBlock = (blockHashOrBlockTag: BlockTag): Promise<Block> => {
    return this.forwardMethod('getBlock', blockHashOrBlockTag);
  };

  public getBlockNumber = (): Promise<number> => {
    return this.forwardMethod('getBlockNumber');
  };

  public getCode = (
    addressOrName: string,
    blockTag?: BlockTag,
  ): Promise<string> => {
    return this.forwardMethod('getCode', addressOrName, blockTag);
  };

  public getStorage = (
    address: AddressLike,
    position: BigNumberish,
    blockTag?: BlockTag | undefined,
  ): Promise<string> => {
    return this.forwardMethod('getStorage', address, position, blockTag);
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
    return this.forwardMethod(
      'getStorageAt',
      addressOrName,
      position,
      blockTag,
    );
  };

  public getTransaction = (
    transactionHash: string,
  ): Promise<TransactionResponse | null> => {
    return this.forwardMethodNullable('getTransaction', transactionHash);
  };

  public getTransactionCount = async (
    addressOrName: string,
    blockTag?: BlockTag,
  ): Promise<number> => {
    // Max of our pending-tx high-water mark and the chain's count, so a stale or
    // orphaned pending row can't drag the nonce below the chain's floor.
    const [highestNonce, rpc] = await Promise.all([
      PendingEthereumTransactionRepository.getHighestNonce(
        this.networkDetails.symbol,
      ),
      this.forwardMethod<number>(
        'getTransactionCount',
        addressOrName,
        blockTag,
      ),
    ]);

    return Math.max(highestNonce ?? 0, rpc);
  };

  public getConfirmedTransactionCount = (
    addressOrName: string,
  ): Promise<number> =>
    this.forwardMethod<number>('getTransactionCount', addressOrName, 'latest');

  public getTransactionReceipt = (
    transactionHash: string,
  ): Promise<TransactionReceipt | null> => {
    return this.forwardMethodNullable('getTransactionReceipt', transactionHash);
  };

  public getTransactionResult = (
    transactionHash: string,
  ): Promise<string | null> => {
    return this.forwardMethodNullable('getTransactionResult', transactionHash);
  };

  public lookupAddress = (address: string): Promise<string> => {
    return this.forwardMethod('lookupAddress', address);
  };

  public resolveName = (name: string): Promise<string> => {
    return this.forwardMethod('resolveName', name);
  };

  public broadcastTransaction = async (
    signedTransaction: string,
  ): Promise<TransactionResponse> => {
    const tx = Transaction.from(signedTransaction);
    await this.addToTransactionDatabase(tx);

    // When sending a transaction, you want it to propagate on the network as quickly as possible
    // Therefore, we send it to all available providers
    const promises = Array.from(this.providers.values()).map((provider) =>
      provider.broadcastTransaction(signedTransaction),
    );

    const settled = await Promise.allSettled(promises);
    const results = settled
      .filter(
        (res): res is PromiseFulfilledResult<TransactionResponse> =>
          res.status === 'fulfilled',
      )
      .map((res) => res.value);

    if (results.length > 0) {
      return results[0];
    }

    const rejections = settled as PromiseRejectedResult[];
    const nonceConflict = rejections.find((r) =>
      isNonceConflictError(r.reason),
    );

    // Arbitrum (and any RPC fanout) can return "nonce too low" / "already known"
    // for a transaction that the sequencer has already accepted. Before treating
    // the broadcast as failed, check whether this exact signed tx is on chain.
    if (nonceConflict !== undefined) {
      const onchain = await this.lookupBroadcastedTransactionWithRetry(
        tx.hash!,
      );
      if (onchain !== null) {
        this.logger.warn(
          `Broadcast of ${this.networkDetails.name} transaction ${tx.hash} returned a nonce conflict but the transaction is on the chain; treating as success`,
        );
        return onchain;
      }
    }

    const error = (nonceConflict ?? rejections[0]).reason;
    this.logger.error(
      `Failed to broadcast ${this.networkDetails.name} transaction ${tx.hash}: ${formatError(error)}`,
    );
    throw error;
  };

  private lookupBroadcastedTransactionWithRetry = async (
    hash: string,
  ): Promise<TransactionResponse | null> => {
    let transaction = await this.lookupBroadcastedTransaction(hash);
    for (const delay of broadcastRecoveryDelays) {
      if (transaction !== null) {
        return transaction;
      }

      await sleep(delay);
      transaction = await this.lookupBroadcastedTransaction(hash);
    }

    return transaction;
  };

  private lookupBroadcastedTransaction = async (
    hash: string,
  ): Promise<TransactionResponse | null> => {
    const lookups = Array.from(this.providers.values()).map((provider) =>
      racePromise(
        provider.getTransaction(hash),
        (reject) =>
          reject(new Error(`timed out looking up broadcasted tx ${hash}`)),
        broadcastTransactionLookupTimeout,
      ),
    );
    const settled = await Promise.allSettled(lookups);
    for (const res of settled) {
      if (res.status === 'fulfilled' && res.value !== null) {
        return res.value;
      }
    }
    return null;
  };

  public sendTransaction = async (
    tx: TransactionRequest,
  ): Promise<TransactionResponse> => {
    const res = await this.forwardMethod<Promise<TransactionResponse>>(
      'sendTransaction',
      tx,
    );

    await this.addToTransactionDatabase(Transaction.from(res));

    return res;
  };

  public waitForTransaction = (
    transactionHash: string,
    confirmations?: number,
    timeout?: number,
  ): Promise<TransactionReceipt> => {
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

  public emit = async (
    eventName: ProviderEvent,
    ...args: Array<any>
  ): Promise<boolean> => {
    for (const [, provider] of this.providers) {
      await provider.emit(eventName, args);
    }

    return true;
  };

  public addListener = async (
    eventName: ProviderEvent,
    listener: Listener,
  ): Promise<this> => {
    return this.on(eventName, listener);
  };

  public listenerCount = async (eventName?: ProviderEvent): Promise<number> => {
    return Array.from(this.providers.values())[0].listenerCount(eventName);
  };

  public listeners = async (
    eventName?: ProviderEvent,
  ): Promise<Array<Listener>> => {
    return Array.from(this.providers.values())[0].listeners(eventName);
  };

  public off = async (
    eventName: ProviderEvent,
    listener?: Listener,
  ): Promise<this> => {
    for (const [, provider] of this.providers) {
      await provider.off(eventName, listener);
    }

    return this;
  };

  public on = async (
    eventName: ProviderEvent,
    listener: Listener,
  ): Promise<this> => {
    const injected = this.createInjectedListener(listener);

    for (const provider of this.providers.values()) {
      await provider.on(eventName, injected);
    }

    return this;
  };

  public onBlock = async (
    listener: (block: BlockEvent) => void,
  ): Promise<this> => {
    const guarded = (block: BlockEvent) => {
      if (this.destroyed || shutdownSignal.aborted) {
        return;
      }
      listener(block);
    };

    this.blockListeners.add(guarded);
    this.startBlockPoll();

    return this;
  };

  public onReconnect = (callback: () => void): void => {
    this.reconnectCallbacks.add(callback);
    for (const provider of this.providers.values()) {
      if (provider instanceof WebSocketProvider) {
        provider.ws.on('reconnected', callback);
      }
    }
  };

  protected getLatestBlock = async (): Promise<BlockEvent> => {
    return { number: await this.getBlockNumber() };
  };

  private startBlockPoll = () => {
    if (this.blockPollTimer !== undefined || this.destroyed) {
      return;
    }

    let inFlight = false;
    const tick = async () => {
      if (inFlight || this.destroyed) {
        return;
      }
      inFlight = true;

      try {
        let block: BlockEvent;
        try {
          block = await this.getLatestBlock();
        } catch (error) {
          this.logger.warn(
            `${this.networkDetails.name} block poll failed: ${formatError(error)}`,
          );
          return;
        }

        for (const listener of this.blockListeners) {
          try {
            listener(block);
          } catch (error) {
            this.logger.error(
              `${this.networkDetails.name} block listener threw: ${formatError(error)}`,
            );
          }
        }
      } finally {
        inFlight = false;
      }
    };

    void tick();
    this.blockPollTimer = setInterval(() => {
      void tick();
    }, InjectedProvider.blockPollIntervalMs);
  };

  public once = async (
    eventName: ProviderEvent,
    listener: Listener,
  ): Promise<this> => {
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

  public removeAllListeners = async (
    eventName?: ProviderEvent,
  ): Promise<this> => {
    for (const [, provider] of this.providers) {
      await provider.removeAllListeners(eventName);
    }

    return this;
  };

  public removeListener = (
    eventName: ProviderEvent,
    listener: Listener,
  ): Promise<this> => {
    return this.off(eventName, listener);
  };

  /*
   * Helper utils
   */

  protected forwardMethod = async <T = any>(
    method: string,
    ...args: any[]
  ): Promise<T> => {
    const span = Tracing.tracer.startSpan(
      `${this.networkDetails.name} RPC ${method}`,
      {
        kind: SpanKind.CLIENT,
        attributes: {
          'rpc.method': method,
          args: args.map((p) =>
            p !== undefined && p !== null
              ? JSON.stringify(p, bigIntReplacer)
              : String(p),
          ),
        },
      },
    );
    const ctx = trace.setSpan(context.active(), span);

    try {
      return await context.with(
        ctx,
        this.forwardMethodInternal<T>,
        this,
        method,
        ...args,
      );
    } catch (error) {
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: formatError(error),
      });
      throw error;
    } finally {
      span.end();
    }
  };

  private forwardMethodInternal = async <T = any>(
    method: string,
    ...args: any[]
  ): Promise<T> => {
    const res = await this.forwardMethodNullable<T>(method, ...args);
    if (res === null) {
      throw Errors.REQUESTS_TO_PROVIDERS_FAILED(['null returned']);
    }

    return res;
  };

  private forwardMethodNullable = async <T = any>(
    method: string,
    ...args: any[]
  ): Promise<T | null> => {
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

        this.logger.warn(
          `Request to ${this.networkDetails.name} RPC provider ${providerName} failed: ${method}: ${formattedError}`,
        );
        errors.push(formattedError);
      }
    }

    if (errors.length > 0) {
      throw Errors.REQUESTS_TO_PROVIDERS_FAILED(errors);
    }

    return null;
  };

  private promiseWithTimeout = async (
    promise: Promise<any>,
    errorMessage: string,
  ): Promise<any> => {
    let timeoutHandle: NodeJS.Timeout;

    const timeoutPromise = new Promise<void>((_, reject) => {
      timeoutHandle = setTimeout(
        () => reject(errorMessage),
        InjectedProvider.requestTimeout,
      );
    });

    return Promise.race([promise, timeoutPromise]).then((result) => {
      clearTimeout(timeoutHandle);
      return result;
    });
  };

  private addToTransactionDatabase = async (tx: Transaction) => {
    this.logger.silly(
      `Sending ${this.networkDetails.name} transaction: ${tx.hash}`,
    );
    await PendingEthereumTransactionRepository.addTransaction(
      tx.hash!,
      this.networkDetails.symbol,
      tx.nonce,
      tx.value,
      tx.serialized,
    );
  };

  private createInjectedListener = (
    listener: Listener,
    providersCount: number = this.providers.size,
  ) => {
    const providerDeltas = new Map<number, number>();
    const safeStringify = (entry: unknown) => {
      try {
        return JSON.stringify(entry, bigIntReplacer);
      } catch {
        return String(entry);
      }
    };

    return (...args: any[]) => {
      if (providersCount === 1) {
        listener(...args);
        return;
      }

      const hashCode = this.hashCode(
        args.map((entry) => safeStringify(entry)).join(),
      );
      const currentDelta = providerDeltas.get(hashCode) || 0;

      if (currentDelta === providersCount - 1) {
        providerDeltas.delete(hashCode);
      } else {
        providerDeltas.set(hashCode, currentDelta + 1);
      }

      if (providerDeltas.size > 10_000) {
        providerDeltas.clear();
      }

      if (currentDelta === 0) {
        listener(...args);
      }
    };
  };

  private hashCode = (value: string): number => {
    let hash = 0;

    for (let i = 0; i < value.length; i++) {
      const char = value.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash |= 0;
    }

    return hash;
  };

  private logAddedProvider = (name: string) => {
    this.logger.debug(
      `Adding ${this.networkDetails.name} RPC provider ${name}`,
    );
  };

  private logConnectedProvider = (name: string, network: Network) => {
    this.logger.verbose(
      `Connected to ${this.networkDetails.name} RPC provider ${name} on network: ${network.chainId}`,
    );
  };

  private logDisabledProvider = (name: string, reason: string) => {
    this.logger.warn(
      `Disabled ${this.networkDetails.name} RPC provider ${name}: ${reason}`,
    );
  };
}

export default InjectedProvider;
