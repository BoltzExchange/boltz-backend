import type { ClientDuplexStream, ClientReadableStream } from '@grpc/grpc-js';
import { Metadata } from '@grpc/grpc-js';
import { Status } from '@grpc/grpc-js/build/src/constants';
import child_process from 'node:child_process';
import path from 'path';
import type { BaseClientEvents } from '../BaseClient';
import BaseClient from '../BaseClient';
import type { ConfigType } from '../Config';
import { parseTransaction } from '../Core';
import type Logger from '../Logger';
import { LogLevel } from '../Logger';
import { sleep } from '../PromiseUtils';
import {
  formatError,
  fromProtoInt,
  getHexString,
  getVersion,
  stringify,
  toProtoInt,
} from '../Utils';
import type SwapInfos from '../api/SwapInfos';
import type { SomeTransaction } from '../chain/ChainClient';
import ElementsClient from '../chain/ElementsClient';
import { ClientStatus, CurrencyType, SwapUpdateEvent } from '../consts/Enums';
import SwapRepository from '../db/repositories/SwapRepository';
import { grpcOptions, unaryCall } from '../lightning/GrpcUtils';
import { createSsl } from '../lightning/cln/Types';
import { BoltzRClient } from '../proto/boltzr';
import * as sidecarrpc from '../proto/boltzr';
import type { SwapUpdate } from '../service/EventHandler';
import type EventHandler from '../service/EventHandler';
import DecodedInvoice from './DecodedInvoice';

const enum TransactionStatus {
  Confirmed,
  ZeroConfSafe,
  NotSafe,
}

type Update = { id: string; status: SwapUpdate };

type RescanChainRequest = {
  symbol: string;
  startHeight: number;
  includeMempool?: boolean;
};

export type TransactionEvent = {
  symbol: string;
  transaction: SomeTransaction;
  status: TransactionStatus;
  swapIds: string[];
};

type SidecarConfig = {
  path?: string;

  config?: string;
  logFile?: string;

  grpc: {
    host: string;
    port: number;
    certificates?: string;
  };
};

class Sidecar extends BaseClient<
  BaseClientEvents & {
    transaction: TransactionEvent;
    block: {
      symbol: string;
      height: number;
      hash: Buffer;
    };
  }
> {
  public static readonly symbol = 'Boltz';
  public static readonly serviceName = 'sidecar';

  private static readonly dirtySuffix = '-dirty';
  private static readonly isProduction = process.env.NODE_ENV === 'production';

  private static childProcess?: child_process.ChildProcessWithoutNullStreams;

  private static maxConnectRetries = 50;
  private static connectRetryTimeout = 500;

  private client?: BoltzRClient;
  private readonly clientMeta = new Metadata();

  private swapInfos!: SwapInfos;
  private eventHandler!: EventHandler;

  private subscribeSwapUpdatesCall?: ClientDuplexStream<
    sidecarrpc.SwapUpdateRequest,
    sidecarrpc.SwapUpdateResponse
  >;
  private subscribeSendSwapUpdatesCall?: ClientReadableStream<sidecarrpc.SendSwapUpdateRequest>;
  private subscribeBlockAddedCall?: ClientReadableStream<sidecarrpc.BlockAddedRequest>;
  private subscribeRelevantTransactionCall?: ClientReadableStream<sidecarrpc.RelevantTransactionRequest>;

  constructor(
    logger: Logger,
    private readonly config: SidecarConfig,
    private readonly dataDir: string,
  ) {
    super(logger, Sidecar.symbol);
  }

  public static start = (logger: Logger, config: ConfigType) => {
    const sidecarBuildType = Sidecar.isProduction ? 'release' : 'debug';
    logger.info(`Starting ${sidecarBuildType} sidecar`);

    this.childProcess = child_process.spawn(
      config.sidecar.path ||
        path.join(
          path.resolve(__dirname, '..', '..', '..'),
          `target/${sidecarBuildType}/boltzr`,
        ),
      [
        '--config',
        config.sidecar?.config || config.configpath,
        '--log-level',
        config.loglevel === 'silly' ? 'trace' : config.loglevel,
      ],
    );
    Sidecar.childProcess!.stdout.pipe(process.stdout);
    Sidecar.childProcess!.stderr.pipe(process.stderr);
  };

  public static stop = async () => {
    if (Sidecar.childProcess) {
      await new Promise<void>((resolve) => {
        Sidecar.childProcess!.once('exit', resolve);
        Sidecar.childProcess!.kill('SIGINT');
      });
    }
  };

  public serviceName(): string {
    return Sidecar.serviceName;
  }

  public connect = async (
    eventHandler: EventHandler,
    swapInfos: SwapInfos,
    withSubscriptions: boolean = true,
  ): Promise<boolean> => {
    this.swapInfos = swapInfos;
    this.eventHandler = eventHandler;

    if (this.isConnected()) {
      return true;
    }

    await sleep(Sidecar.connectRetryTimeout * 2);

    for (let i = 0; i < Sidecar.maxConnectRetries; i++) {
      try {
        return await this.tryConnect(withSubscriptions);
      } catch (e) {
        if (i === Sidecar.maxConnectRetries - 1) {
          throw e;
        }

        this.logger.warn(
          `Connection to ${this.serviceName()} failed: ${formatError(e)}`,
        );
        this.logger.warn(
          `Retrying connecting to ${this.serviceName()} in: ${Sidecar.connectRetryTimeout / 1_000}s`,
        );
        await sleep(Sidecar.connectRetryTimeout);
      }
    }

    return false;
  };

  public disconnect = (): void => {
    this.subscribeSwapUpdatesCall?.cancel();
    this.subscribeSendSwapUpdatesCall?.cancel();
    this.subscribeBlockAddedCall?.cancel();
    this.subscribeRelevantTransactionCall?.cancel();

    this.clearReconnectTimer();

    this.client?.close();
    this.removeAllListeners();

    this.setClientStatus(ClientStatus.Disconnected);
  };

  public start = async () => {
    await this.unaryNodeCall<
      sidecarrpc.StartWebHookRetriesRequest,
      sidecarrpc.StartWebHookRetriesResponse
    >('startWebHookRetries', {});
  };

  public getInfo = () =>
    this.unaryNodeCall<sidecarrpc.GetInfoRequest, sidecarrpc.GetInfoResponse>(
      'getInfo',
      {},
    );

  public validateVersion = async () => {
    const info = await this.getInfo();
    const ourVersion = getVersion();

    const versionCompatible = Sidecar.isProduction
      ? Sidecar.trimDirtySuffix(info.version) ===
        Sidecar.trimDirtySuffix(ourVersion)
      : info.version.split('-')[0] === ourVersion.split('-')[0];

    if (!versionCompatible) {
      throw `sidecar version incompatible: ${info.version} vs ${getVersion()}`;
    }
  };

  public setLogLevel = async (level: LogLevel) => {
    let lvl: sidecarrpc.LogLevel;

    switch (level) {
      case LogLevel.Error:
        lvl = sidecarrpc.LogLevel.ERROR;
        break;

      case LogLevel.Warn:
        lvl = sidecarrpc.LogLevel.WARN;
        break;

      case LogLevel.Info:
      case LogLevel.Verbose:
        lvl = sidecarrpc.LogLevel.INFO;
        break;

      case LogLevel.Debug:
        lvl = sidecarrpc.LogLevel.DEBUG;
        break;

      case LogLevel.Silly:
        lvl = sidecarrpc.LogLevel.TRACE;
        break;
    }

    const req: sidecarrpc.SetLogLevelRequest = {
      level: lvl,
    };

    await this.unaryNodeCall<
      sidecarrpc.SetLogLevelRequest,
      sidecarrpc.SetLogLevelResponse
    >('setLogLevel', req);
  };

  public sendMessage = async (
    message: string,
    isImportant?: boolean,
    sendAlert?: boolean,
  ) => {
    const req: sidecarrpc.SendMessageRequest = {
      message,
      isImportant,
      sendAlert,
    };

    await this.unaryNodeCall<
      sidecarrpc.SendMessageRequest,
      sidecarrpc.SendMessageResponse
    >('sendMessage', req);
  };

  public getMessages = () => this.client!.getMessages({});

  public createWebHook = async (
    swapId: string,
    url: string,
    hashSwapId?: boolean,
    statusInclude?: string[],
  ) => {
    const req: sidecarrpc.CreateWebHookRequest = {
      id: swapId,
      url,
      hashSwapId: hashSwapId || false,
      status: statusInclude || [],
    };

    await this.unaryNodeCall<
      sidecarrpc.CreateWebHookRequest,
      sidecarrpc.CreateWebHookResponse
    >('createWebHook', req);
  };

  public claimBatch = async (swapIds: string[]) => {
    const req: sidecarrpc.ClaimBatchRequest = {
      swapIds,
    };

    const res = await this.unaryNodeCall<
      sidecarrpc.ClaimBatchRequest,
      sidecarrpc.ClaimBatchResponse
    >('claimBatch', req);

    return {
      transaction: res.transaction,
      transactionId: res.transactionId,
      fee: fromProtoInt(res.fee),
    };
  };

  public signEvmRefund = async (
    chain: string,
    contractAddress: string,
    preimageHash: Buffer,
    amount: bigint,
    tokenAddress: string | undefined,
    timeout: number,
  ) => {
    const req: sidecarrpc.SignEvmRefundRequest = {
      chain,
      address: contractAddress,
      preimageHash,
      amount: amount.toString(),
      timeout: toProtoInt(timeout),
      tokenAddress,
    };

    const res = await this.unaryNodeCall<
      sidecarrpc.SignEvmRefundRequest,
      sidecarrpc.SignEvmRefundResponse
    >('signEvmRefund', req);
    return res.signature;
  };

  public decodeInvoiceOrOffer = async (invoiceOrOffer: string) => {
    const req: sidecarrpc.DecodeInvoiceOrOfferRequest = {
      invoiceOrOffer,
    };

    return new DecodedInvoice(
      await this.unaryNodeCall<
        sidecarrpc.DecodeInvoiceOrOfferRequest,
        sidecarrpc.DecodeInvoiceOrOfferResponse
      >('decodeInvoiceOrOffer', req),
    );
  };

  public isMarked = async (ip: string) => {
    const req: sidecarrpc.IsMarkedRequest = {
      ip,
    };

    return (
      await this.unaryNodeCall<
        sidecarrpc.IsMarkedRequest,
        sidecarrpc.IsMarkedResponse
      >('isMarked', req)
    ).isMarked;
  };

  private subscribeSwapUpdates = () => {
    const serializeSwapUpdate = (id: string | undefined, updates: Update[]) => {
      return {
        id,
        status: updates.map((entry) => ({
          id: entry.id,
          status: entry.status.status,
          zeroConfRejected: entry.status.zeroConfRejected,
          transactionInfo: entry.status.transaction
            ? {
                id: entry.status.transaction.id,
                hex: entry.status.transaction.hex,
                eta: entry.status.transaction.eta
                  ? toProtoInt(entry.status.transaction.eta)
                  : undefined,
                confirmed: entry.status.transaction.confirmed,
              }
            : undefined,
          failureReason: entry.status.failureReason,
          failureDetails: entry.status.failureDetails
            ? {
                actual: toProtoInt(entry.status.failureDetails.actual),
                expected: toProtoInt(entry.status.failureDetails.expected),
              }
            : undefined,
        })),
      } satisfies sidecarrpc.SwapUpdateRequest;
    };

    if (this.subscribeSwapUpdatesCall !== undefined) {
      this.subscribeSwapUpdatesCall.cancel();
    }

    this.subscribeSwapUpdatesCall = this.client!.swapUpdate(this.clientMeta);

    this.subscribeSwapUpdatesCall.on(
      'data',
      async (data: sidecarrpc.SwapUpdateResponse) => {
        const status = (
          await Promise.all(
            data.swapIds.map(async (id) => ({
              id,
              status: await this.swapInfos.get(id),
            })),
          )
        ).filter((update): update is Update => update.status !== undefined);
        if (status.length === 0) {
          return;
        }

        this.subscribeSwapUpdatesCall!.write(
          serializeSwapUpdate(data.id, status),
        );
      },
    );

    this.subscribeSwapUpdatesCall.on('error', (err) => {
      this.logger.warn(
        `Swap updates streaming call threw error: ${formatError(err)}`,
      );
      this.subscribeSwapUpdatesCall = undefined;
    });

    this.subscribeSwapUpdatesCall.on('end', () => {
      this.eventHandler.removeAllListeners();

      if (this.subscribeSwapUpdatesCall !== undefined) {
        this.subscribeSwapUpdatesCall.cancel();
        this.subscribeSwapUpdatesCall = undefined;
      }
    });

    this.eventHandler.on('swap.update', async ({ id, status }) => {
      if (this.subscribeSwapUpdatesCall === undefined) {
        return;
      }

      this.subscribeSwapUpdatesCall.write(
        serializeSwapUpdate(undefined, [{ id, status }]),
      );

      await this.sendWebHook(id, status.status);
    });
  };

  private subscribeSendSwapUpdates = () => {
    if (this.subscribeSendSwapUpdatesCall !== undefined) {
      this.subscribeSendSwapUpdatesCall.cancel();
    }

    this.subscribeSendSwapUpdatesCall = this.client!.sendSwapUpdate(
      {},
      this.clientMeta,
    );

    this.subscribeSendSwapUpdatesCall.on(
      'data',
      async (data: sidecarrpc.SendSwapUpdateResponse) => {
        const update = data.update;
        if (update === undefined) {
          return;
        }

        try {
          await this.handleSentSwapUpdate(update);
        } catch (e) {
          this.logger.error(
            `Handling sent swap update (${stringify(data)}) failed: ${formatError(e)}`,
          );
        }
      },
    );

    this.subscribeSendSwapUpdatesCall.on('error', (err) => {
      this.logger.warn(
        `Send swap updates streaming call threw error: ${formatError(err)}`,
      );
      this.subscribeSendSwapUpdatesCall = undefined;
    });

    this.subscribeSendSwapUpdatesCall.on('end', () => {
      if (this.subscribeSendSwapUpdatesCall !== undefined) {
        this.subscribeSendSwapUpdatesCall.cancel();
        this.subscribeSendSwapUpdatesCall = undefined;
      }
    });
  };

  private handleSentSwapUpdate = async (update: sidecarrpc.SwapUpdate) => {
    switch (update.status) {
      case SwapUpdateEvent.TransactionDirect: {
        const transactionInfo = update.transactionInfo!;
        this.eventHandler.emit('swap.update', {
          id: update.id,
          status: {
            status: SwapUpdateEvent.TransactionDirect,
            transaction: {
              id: transactionInfo.id,
              hex: transactionInfo.hex,
            },
          },
          skipCache: true,
        });
        return;
      }
      case SwapUpdateEvent.InvoiceFailedToPay: {
        const swap = await SwapRepository.getSwap({
          id: update.id,
        });
        if (swap === null) {
          this.logger.warn(
            `Could not find swap for update with id: ${update.id}`,
          );
          return;
        }

        this.eventHandler.nursery.emit(
          SwapUpdateEvent.InvoiceFailedToPay,
          swap,
        );
        return;
      }
      default: {
        this.logger.warn(
          `Got swap update that could not be handled: ${stringify(update)}`,
        );
        return;
      }
    }
  };

  /**
   * Rescans one or more chains. If none are specified, all chains will be rescanned
   * @param requests - The chains to rescan
   */
  public rescanChains = async (requests?: RescanChainRequest[]) => {
    const req: sidecarrpc.RescanChainsRequest = {
      chains: (requests ?? []).map((request) => ({
        symbol: request.symbol,
        startHeight: toProtoInt(request.startHeight),
        includeMempool: request.includeMempool,
      })),
    };

    return await this.unaryNodeCall<
      sidecarrpc.RescanChainsRequest,
      sidecarrpc.RescanChainsResponse
    >('rescanChains', req);
  };

  /**
   * Check a specific transaction for relevance to swaps
   * @param symbol - The currency symbol (e.g., 'BTC', 'L-BTC')
   * @param txId - The transaction ID to check
   */
  public checkTransaction = async (symbol: string, txId: string) => {
    const req: sidecarrpc.CheckTransactionRequest = {
      symbol,
      id: txId,
    };

    await this.unaryNodeCall<
      sidecarrpc.CheckTransactionRequest,
      sidecarrpc.CheckTransactionResponse
    >('checkTransaction', req);
  };

  public estimateFee = async (symbol: string) => {
    const req: sidecarrpc.EstimateFeeRequest = {
      symbol,
    };

    const res = await this.unaryNodeCall<
      sidecarrpc.EstimateFeeRequest,
      sidecarrpc.EstimateFeeResponse
    >('estimateFee', req);
    return fromProtoInt(res.estimate);
  };

  private sendWebHook = async (swapId: string, status: SwapUpdateEvent) => {
    const req: sidecarrpc.SendWebHookRequest = {
      id: swapId,
      status,
    };

    try {
      const res = await this.unaryNodeCall<
        sidecarrpc.SendWebHookRequest,
        sidecarrpc.SendWebHookResponse
      >('sendWebHook', req);
      return res.ok;
    } catch (e) {
      // Ignore not found errors
      if ((e as any).code === Status.NOT_FOUND) {
        return true;
      }

      throw e;
    }
  };

  public subscribeBlockAdded = () => {
    if (this.subscribeBlockAddedCall !== undefined) {
      this.subscribeBlockAddedCall.cancel();
    }

    this.subscribeBlockAddedCall = this.client!.blockAdded({}, this.clientMeta);

    this.subscribeBlockAddedCall.on('data', async (block: sidecarrpc.Block) => {
      const hash = block.hash;
      this.logger.debug(
        `Got ${block.symbol} block ${block.height} (${getHexString(hash)}) from sidecar`,
      );

      this.emit('block', {
        height: fromProtoInt(block.height),
        symbol: block.symbol,
        hash,
      });
    });

    this.subscribeBlockAddedCall.on('error', (err) => {
      this.logger.warn(`Block added stream threw error: ${formatError(err)}`);
      this.subscribeBlockAddedCall = undefined;
    });

    this.subscribeBlockAddedCall.on('end', () => {
      if (this.subscribeBlockAddedCall !== undefined) {
        this.subscribeBlockAddedCall.cancel();
        this.subscribeBlockAddedCall = undefined;
      }
    });
  };

  public subscribeRelevantTransaction = () => {
    if (this.subscribeRelevantTransactionCall !== undefined) {
      this.subscribeRelevantTransactionCall.cancel();
    }

    this.subscribeRelevantTransactionCall = this.client!.transactionFound(
      {},
      this.clientMeta,
    );

    const parseStatus = (status: sidecarrpc.TransactionStatus) => {
      switch (status) {
        case sidecarrpc.TransactionStatus.TRANSACTION_STATUS_CONFIRMED:
          return TransactionStatus.Confirmed;
        case sidecarrpc.TransactionStatus.TRANSACTION_STATUS_ZERO_CONF_SAFE:
          return TransactionStatus.ZeroConfSafe;
        default:
          return TransactionStatus.NotSafe;
      }
    };

    this.subscribeRelevantTransactionCall.on(
      'data',
      async (transaction: sidecarrpc.RelevantTransaction) => {
        const currencyType =
          transaction.symbol === ElementsClient.symbol
            ? CurrencyType.Liquid
            : CurrencyType.BitcoinLike;

        const status = parseStatus(transaction.status);

        // Ignore unsafe 0-conf Liquid transaction
        if (
          currencyType === CurrencyType.Liquid &&
          status === TransactionStatus.NotSafe
        ) {
          return;
        }

        this.emit('transaction', {
          symbol: transaction.symbol,
          transaction: parseTransaction(currencyType, transaction.transaction),
          status,
          swapIds: transaction.swapIds,
        });
      },
    );

    this.subscribeRelevantTransactionCall.on('error', (err) => {
      this.logger.warn(
        `Relevant transaction stream threw error: ${formatError(err)}`,
      );
      this.subscribeRelevantTransactionCall = undefined;
    });

    this.subscribeRelevantTransactionCall.on('end', () => {
      if (this.subscribeRelevantTransactionCall !== undefined) {
        this.subscribeRelevantTransactionCall.cancel();
        this.subscribeRelevantTransactionCall = undefined;
      }
    });
  };

  private tryConnect = async (withSubscriptions: boolean = true) => {
    const certPath =
      this.config.grpc.certificates ||
      path.join(this.dataDir, 'sidecar', 'certificates');
    this.client = new BoltzRClient(
      `${this.config.grpc.host}:${this.config.grpc.port}`,
      createSsl(Sidecar.serviceName, Sidecar.symbol, {
        rootCertPath: path.join(certPath, 'ca.pem'),
        certChainPath: path.join(certPath, 'client.pem'),
        privateKeyPath: path.join(certPath, 'client-key.pem'),
      }),
      grpcOptions('sidecar'),
    );

    try {
      await this.getInfo();

      if (withSubscriptions) {
        this.subscribeSwapUpdates();
        this.subscribeSendSwapUpdates();
        this.subscribeBlockAdded();
        this.subscribeRelevantTransaction();
      }

      this.setClientStatus(ClientStatus.Connected);
    } catch (error) {
      this.setClientStatus(ClientStatus.Disconnected);
      throw error;
    }

    return true;
  };

  private unaryNodeCall = <T, U>(
    methodName: keyof BoltzRClient,
    params: T,
  ): Promise<U> => {
    return unaryCall(this.client!, methodName, params, this.clientMeta);
  };

  private static trimDirtySuffix = (version: string): string =>
    version.endsWith(Sidecar.dirtySuffix)
      ? version.slice(0, -Sidecar.dirtySuffix.length)
      : version;
}

export default Sidecar;
export { SidecarConfig, TransactionStatus };
