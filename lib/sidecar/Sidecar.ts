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
import { formatError, getHexString, getVersion, stringify } from '../Utils';
import type SwapInfos from '../api/SwapInfos';
import type { SomeTransaction } from '../chain/ChainClient';
import ElementsClient from '../chain/ElementsClient';
import { ClientStatus, CurrencyType, SwapUpdateEvent } from '../consts/Enums';
import SwapRepository from '../db/repositories/SwapRepository';
import { grpcOptions, unaryCall } from '../lightning/GrpcUtils';
import { createSsl } from '../lightning/cln/Types';
import { BoltzRClient } from '../proto/boltzr_grpc_pb';
import * as sidecarrpc from '../proto/boltzr_pb';
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
  fundingAddressIds: string[];
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
    >('startWebHookRetries', new sidecarrpc.StartWebHookRetriesRequest());
  };

  public getInfo = () =>
    this.unaryNodeCall<
      sidecarrpc.GetInfoRequest,
      sidecarrpc.GetInfoResponse.AsObject
    >('getInfo', new sidecarrpc.GetInfoRequest(), true);

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

    const req = new sidecarrpc.SetLogLevelRequest();
    req.setLevel(lvl);

    await this.unaryNodeCall<
      sidecarrpc.SetLogLevelRequest,
      sidecarrpc.SetLogLevelResponse.AsObject
    >('setLogLevel', req);
  };

  public sendMessage = async (
    message: string,
    isImportant?: boolean,
    sendAlert?: boolean,
  ) => {
    const req = new sidecarrpc.SendMessageRequest();
    req.setMessage(message);
    if (isImportant) {
      req.setIsImportant(isImportant);
    }

    if (sendAlert) {
      req.setSendAlert(sendAlert);
    }

    await this.unaryNodeCall<
      sidecarrpc.SendMessageRequest,
      sidecarrpc.SendMessageResponse
    >('sendMessage', req);
  };

  public getMessages = () =>
    this.client!.getMessages(new sidecarrpc.GetMessagesRequest());

  public createWebHook = async (
    swapId: string,
    url: string,
    hashSwapId?: boolean,
    statusInclude?: string[],
  ) => {
    const req = new sidecarrpc.CreateWebHookRequest();
    req.setId(swapId);
    req.setUrl(url);
    req.setHashSwapId(hashSwapId || false);
    req.setStatusList(statusInclude || []);

    await this.unaryNodeCall<
      sidecarrpc.CreateWebHookRequest,
      sidecarrpc.CreateWebHookResponse
    >('createWebHook', req);
  };

  public claimBatch = async (
    swapIds: string[],
  ): Promise<sidecarrpc.ClaimBatchResponse.AsObject> => {
    const req = new sidecarrpc.ClaimBatchRequest();
    req.setSwapIdsList(swapIds);

    return await this.unaryNodeCall<
      sidecarrpc.ClaimBatchRequest,
      sidecarrpc.ClaimBatchResponse.AsObject
    >('claimBatch', req);
  };

  public signEvmRefund = async (
    chain: string,
    contractAddress: string,
    preimageHash: Buffer,
    amount: bigint,
    tokenAddress: string | undefined,
    timeout: number,
  ) => {
    const req = new sidecarrpc.SignEvmRefundRequest();
    req.setChain(chain);
    req.setAddress(contractAddress);
    req.setPreimageHash(preimageHash);
    req.setAmount(amount.toString());
    req.setTimeout(timeout);

    if (tokenAddress) {
      req.setTokenAddress(tokenAddress);
    }

    const res = await this.unaryNodeCall<
      sidecarrpc.SignEvmRefundRequest,
      sidecarrpc.SignEvmRefundResponse.AsObject
    >('signEvmRefund', req, true);
    return Buffer.from(res.signature as string, 'base64');
  };

  public decodeInvoiceOrOffer = async (invoiceOrOffer: string) => {
    const req = new sidecarrpc.DecodeInvoiceOrOfferRequest();
    req.setInvoiceOrOffer(invoiceOrOffer);

    return new DecodedInvoice(
      await this.unaryNodeCall<
        sidecarrpc.DecodeInvoiceOrOfferRequest,
        sidecarrpc.DecodeInvoiceOrOfferResponse
      >('decodeInvoiceOrOffer', req, false),
    );
  };

  public isMarked = async (ip: string) => {
    const req = new sidecarrpc.IsMarkedRequest();
    req.setIp(ip);

    return (
      await this.unaryNodeCall<
        sidecarrpc.IsMarkedRequest,
        sidecarrpc.IsMarkedResponse.AsObject
      >('isMarked', req)
    ).isMarked;
  };

  private subscribeSwapUpdates = () => {
    const serializeSwapUpdate = (id: string | undefined, updates: Update[]) => {
      const req = new sidecarrpc.SwapUpdateRequest();

      if (id !== undefined) {
        req.setId(id);
      }

      req.setStatusList(
        updates.map((entry) => {
          const update = new sidecarrpc.SwapUpdate();
          update.setId(entry.id);
          update.setStatus(entry.status.status);

          if (entry.status.zeroConfRejected !== undefined) {
            update.setZeroConfRejected(entry.status.zeroConfRejected);
          }

          if (entry.status.transaction) {
            const transaction = new sidecarrpc.SwapUpdate.TransactionInfo();
            transaction.setId(entry.status.transaction.id);

            if (entry.status.transaction.hex !== undefined) {
              transaction.setHex(entry.status.transaction.hex);
            }

            if (entry.status.transaction.eta !== undefined) {
              transaction.setEta(entry.status.transaction.eta);
            }

            update.setTransactionInfo(transaction);
          }

          if (entry.status.failureReason !== undefined) {
            update.setFailureReason(entry.status.failureReason);
          }

          if (entry.status.failureDetails !== undefined) {
            const details = new sidecarrpc.SwapUpdate.FailureDetails();
            details.setActual(entry.status.failureDetails.actual);
            details.setExpected(entry.status.failureDetails.expected);

            update.setFailureDetails(details);
          }

          return update;
        }),
      );

      return req;
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
            data.getSwapIdsList().map(async (id) => ({
              id,
              status: await this.swapInfos.get(id),
            })),
          )
        ).filter((update): update is Update => update.status !== undefined);
        if (status.length === 0) {
          return;
        }

        this.subscribeSwapUpdatesCall!.write(
          serializeSwapUpdate(data.getId(), status),
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
      new sidecarrpc.SendSwapUpdateRequest(),
      this.clientMeta,
    );

    this.subscribeSendSwapUpdatesCall.on(
      'data',
      async (data: sidecarrpc.SendSwapUpdateResponse) => {
        const update = data.getUpdate();
        if (update === undefined) {
          return;
        }

        try {
          await this.handleSentSwapUpdate(update);
        } catch (e) {
          this.logger.error(
            `Handling sent swap update (${stringify(data.toObject())}) failed: ${formatError(e)}`,
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
    switch (update.getStatus()) {
      case SwapUpdateEvent.TransactionDirect: {
        const transactionInfo = update.getTransactionInfo()!;
        this.eventHandler.emit('swap.update', {
          id: update.getId(),
          status: {
            status: SwapUpdateEvent.TransactionDirect,
            transaction: {
              id: transactionInfo.getId(),
              hex: transactionInfo.getHex(),
            },
          },
          skipCache: true,
        });
        return;
      }
      case SwapUpdateEvent.InvoiceFailedToPay: {
        const swap = await SwapRepository.getSwap({
          id: update.getId(),
        });
        if (swap === null) {
          this.logger.warn(
            `Could not find swap for update with id: ${update.getId()}`,
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
          `Got swap update that could not be handled: ${stringify(update.toObject())}`,
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
    const req = new sidecarrpc.RescanChainsRequest();
    for (const request of requests ?? []) {
      const subReq = new sidecarrpc.RescanChainsRequest.ChainRescan();
      subReq.setSymbol(request.symbol);
      subReq.setStartHeight(request.startHeight);
      if (request.includeMempool !== undefined) {
        subReq.setIncludeMempool(request.includeMempool);
      }
      req.addChains(subReq);
    }

    return await this.unaryNodeCall<
      sidecarrpc.RescanChainsRequest,
      sidecarrpc.RescanChainsResponse.AsObject
    >('rescanChains', req);
  };

  /**
   * Check a specific transaction for relevance to swaps
   * @param symbol - The currency symbol (e.g., 'BTC', 'L-BTC')
   * @param txId - The transaction ID to check
   */
  public checkTransaction = async (symbol: string, txId: string) => {
    const req = new sidecarrpc.CheckTransactionRequest();
    req.setSymbol(symbol);
    req.setId(txId);

    await this.unaryNodeCall<
      sidecarrpc.CheckTransactionRequest,
      sidecarrpc.CheckTransactionResponse.AsObject
    >('checkTransaction', req);
  };

  public estimateFee = async (symbol: string) => {
    const req = new sidecarrpc.EstimateFeeRequest();
    req.setSymbol(symbol);

    const res = await this.unaryNodeCall<
      sidecarrpc.EstimateFeeRequest,
      sidecarrpc.EstimateFeeResponse.AsObject
    >('estimateFee', req);
    return res.estimate;
  };

  private sendWebHook = async (swapId: string, status: SwapUpdateEvent) => {
    const req = new sidecarrpc.SendWebHookRequest();
    req.setId(swapId);
    req.setStatus(status);

    try {
      const res = await this.unaryNodeCall<
        sidecarrpc.SendWebHookRequest,
        sidecarrpc.SendWebHookResponse
      >('sendWebHook', req, false);
      return res.getOk();
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

    this.subscribeBlockAddedCall = this.client!.blockAdded(
      new sidecarrpc.BlockAddedRequest(),
      this.clientMeta,
    );

    this.subscribeBlockAddedCall.on('data', async (block: sidecarrpc.Block) => {
      const hash = Buffer.from(block.getHash_asU8());
      this.logger.debug(
        `Got ${block.getSymbol()} block ${block.getHeight()} (${getHexString(hash)}) from sidecar`,
      );

      this.emit('block', {
        height: block.getHeight(),
        symbol: block.getSymbol(),
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
      new sidecarrpc.RelevantTransactionRequest(),
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
          transaction.getSymbol() === ElementsClient.symbol
            ? CurrencyType.Liquid
            : CurrencyType.BitcoinLike;

        const status = parseStatus(transaction.getStatus());

        // Ignore unsafe 0-conf Liquid transaction
        if (
          currencyType === CurrencyType.Liquid &&
          status === TransactionStatus.NotSafe
        ) {
          return;
        }

        this.emit('transaction', {
          symbol: transaction.getSymbol(),
          transaction: parseTransaction(
            currencyType,
            Buffer.from(transaction.getTransaction_asU8()),
          ),
          status,
          swapIds: transaction.getSwapIdsList(),
          fundingAddressIds: transaction.getFundingAddressIdsList(),
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
    toObject = true,
  ): Promise<U> => {
    return unaryCall(
      this.client!,
      methodName,
      params,
      this.clientMeta,
      toObject,
    );
  };

  private static trimDirtySuffix = (version: string): string =>
    version.endsWith(Sidecar.dirtySuffix)
      ? version.slice(0, -Sidecar.dirtySuffix.length)
      : version;
}

export default Sidecar;
export { SidecarConfig, TransactionStatus };
