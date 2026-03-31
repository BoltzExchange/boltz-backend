import type { ServerDuplexStream, handleUnaryCall } from '@grpc/grpc-js';
import type { Transaction as TransactionLiquid } from 'liquidjs-lib';
import process from 'process';
import { parseTransaction } from '../Core';
import { dumpHeap } from '../HeapDump';
import type Logger from '../Logger';
import { LogLevel as BackendLevel } from '../Logger';
import { wait } from '../PromiseUtils';
import {
  fromOptionalProtoInt,
  fromProtoInt,
  getHexBuffer,
  getHexString,
  getUnixTime,
  removeHexPrefix,
  stringify,
  toProtoInt,
} from '../Utils';
import type Api from '../api/Api';
import {
  CurrencyType,
  swapTypeFromGrpcSwapType,
  swapTypeToPrettyString,
} from '../consts/Enums';
import type { ReferralConfig } from '../db/models/Referral';
import type Referral from '../db/models/Referral';
import PendingEthereumTransactionRepository from '../db/repositories/PendingEthereumTransactionRepository';
import ReferralRepository from '../db/repositories/ReferralRepository';
import TransactionLabelRepository from '../db/repositories/TransactionLabelRepository';
import type * as boltzrpc from '../proto/boltzrpc';
import { LogLevel } from '../proto/boltzrpc';
import type Service from '../service/Service';
import Sidecar from '../sidecar/Sidecar';

class GrpcService {
  constructor(
    private readonly logger: Logger,
    private readonly service: Service,
    private readonly api: Api,
  ) {}

  public stop: handleUnaryCall<boltzrpc.StopRequest, boltzrpc.StopResponse> =
    async (_, callback) => {
      callback(null, {});

      await Sidecar.stop();
      await wait(500);

      // eslint-disable-next-line n/no-process-exit
      process.exit(0);
    };

  public getInfo: handleUnaryCall<
    boltzrpc.GetInfoRequest,
    boltzrpc.GetInfoResponse
  > = async (call, callback) => {
    await GrpcService.handleCallback(call, callback, () =>
      this.service.getInfo(),
    );
  };

  public getBalance: handleUnaryCall<
    boltzrpc.GetBalanceRequest,
    boltzrpc.GetBalanceResponse
  > = async (call, callback) => {
    await GrpcService.handleCallback(call, callback, () =>
      this.service.getBalance(),
    );
  };

  public deriveKeys: handleUnaryCall<
    boltzrpc.DeriveKeysRequest,
    boltzrpc.DeriveKeysResponse
  > = async (call, callback) => {
    await GrpcService.handleCallback(call, callback, async () => {
      const { symbol, index } = call.request;
      return this.service.deriveKeys(symbol, index);
    });
  };

  public deriveBlindingKeys: handleUnaryCall<
    boltzrpc.DeriveBlindingKeyRequest,
    boltzrpc.DeriveBlindingKeyResponse
  > = async (call, callback) => {
    await GrpcService.handleCallback(call, callback, async () => {
      const { address } = call.request;
      const { publicKey, privateKey } =
        this.service.elementsService.deriveBlindingKeys(address);
      return {
        publicKey: getHexString(publicKey),
        privateKey: getHexString(privateKey),
      };
    });
  };

  public unblindOutputs: handleUnaryCall<
    boltzrpc.UnblindOutputsRequest,
    boltzrpc.UnblindOutputsResponse
  > = async (call, callback) => {
    await GrpcService.handleCallback(call, callback, async () => {
      const outputs =
        call.request.id !== undefined && call.request.id !== ''
          ? await this.service.elementsService.unblindOutputsFromId(
              call.request.id,
            )
          : await this.service.elementsService.unblindOutputs(
              parseTransaction(
                CurrencyType.Liquid,
                call.request.hex ?? '',
              ) as TransactionLiquid,
            );
      return {
        outputs: outputs.map((out) => ({
          value: toProtoInt(out.value),
          asset: out.asset,
          isLbtc: out.isLbtc,
          script: out.script,
          nonce: out.nonce,
          rangeProof: out.rangeProof,
          surjectionProof: out.surjectionProof,
        })),
      };
    });
  };

  public getAddress: handleUnaryCall<
    boltzrpc.GetAddressRequest,
    boltzrpc.GetAddressResponse
  > = async (call, callback) => {
    await GrpcService.handleCallback(call, callback, async () => {
      const { symbol, label } = call.request;
      const address = await this.service.getAddress(symbol, label);
      return { address };
    });
  };

  public sendCoins: handleUnaryCall<
    boltzrpc.SendCoinsRequest,
    boltzrpc.SendCoinsResponse
  > = async (call, callback) => {
    await GrpcService.handleCallback(call, callback, async () => {
      const { vout, transactionId } = await this.service.sendCoins(
        call.request.symbol,
        call.request.address,
        fromProtoInt(call.request.amount),
        call.request.label,
        call.request.sendAll,
        fromOptionalProtoInt(call.request.fee),
      );
      return {
        transactionId,
        vout,
      };
    });
  };

  public addReferral: handleUnaryCall<
    boltzrpc.AddReferralRequest,
    boltzrpc.AddReferralResponse
  > = async (call, callback) => {
    await GrpcService.handleCallback(call, callback, async () => {
      const { id, feeShare, routingNode } = call.request;

      const { apiKey, apiSecret } = await this.service.addReferral({
        id,
        feeShare,
        routingNode:
          routingNode !== undefined && routingNode !== ''
            ? routingNode
            : undefined,
      });

      return {
        apiKey,
        apiSecret,
      };
    });
  };

  public setSwapStatus: handleUnaryCall<
    boltzrpc.SetSwapStatusRequest,
    boltzrpc.SetSwapStatusResponse
  > = async (call, callback) => {
    await GrpcService.handleCallback(call, callback, async () => {
      const { id, status } = call.request;

      await this.service.setSwapStatus(id, status);

      return {};
    });
  };

  public allowRefund: handleUnaryCall<
    boltzrpc.AllowRefundRequest,
    boltzrpc.AllowRefundResponse
  > = async (call, callback) => {
    await GrpcService.handleCallback(call, callback, async () => {
      const { id } = call.request;
      await this.service.allowRefund(id);

      return {};
    });
  };

  public getLockedFunds: handleUnaryCall<
    boltzrpc.GetLockedFundsRequest,
    boltzrpc.GetLockedFundsResponse
  > = async (call, callback) => {
    await GrpcService.handleCallback(call, callback, async () => {
      const lockedFunds = await this.service.getLockedFunds();
      return {
        lockedFunds: Object.fromEntries(
          Array.from(lockedFunds.entries()).map(([currency, swaps]) => [
            currency,
            {
              reverseSwaps: swaps.reverseSwaps.map((swap) => ({
                swapId: swap.id,
                onchainAmount: toProtoInt(swap.onchainAmount),
              })),
              chainSwaps: swaps.chainSwaps.map((swap) => ({
                swapId: swap.id,
                onchainAmount: toProtoInt(swap.sendingData.amount!),
              })),
            },
          ]),
        ),
      };
    });
  };

  public getPendingSweeps: handleUnaryCall<
    boltzrpc.GetPendingSweepsRequest,
    boltzrpc.GetPendingSweepsResponse
  > = async (call, callback) => {
    await GrpcService.handleCallback(call, callback, async () => {
      const pendingSweeps = this.service.getPendingSweeps();
      return {
        pendingSweeps: Object.fromEntries(
          Array.from(pendingSweeps.entries()).map(([currency, swapToClaim]) => [
            currency,
            {
              pendingSweeps: swapToClaim.map((toClaim) => ({
                swapId: toClaim.id,
                onchainAmount: toProtoInt(toClaim.onchainAmount || 0),
                type: swapTypeToPrettyString(toClaim.type),
              })),
            },
          ]),
        ),
      };
    });
  };

  public sweepSwaps: handleUnaryCall<
    boltzrpc.SweepSwapsRequest,
    boltzrpc.SweepSwapsResponse
  > = async (call, callback) => {
    await GrpcService.handleCallback(call, callback, async () => {
      const { symbol } = call.request;

      const claimed = symbol
        ? new Map<string, string[]>([
            [
              symbol,
              await this.service.swapManager.deferredClaimer.sweepSymbol(
                symbol,
              ),
            ],
          ])
        : await this.service.swapManager.deferredClaimer.sweep();

      return {
        claimedSymbols: Object.fromEntries(
          Array.from(claimed.entries()).map(([claimedSymbol, swapIds]) => [
            claimedSymbol,
            {
              claimedIds: swapIds,
            },
          ]),
        ),
      };
    });
  };

  public listSwaps: handleUnaryCall<
    boltzrpc.ListSwapsRequest,
    boltzrpc.ListSwapsResponse
  > = async (call, callback) => {
    await GrpcService.handleCallback(call, callback, async () => {
      const { status, limit } = call.request;

      const swaps = await this.service.listSwaps(
        status !== undefined && status !== '' ? status : undefined,
        fromOptionalProtoInt(limit),
      );

      return {
        chainSwaps: swaps.chain,
        reverseSwaps: swaps.reverse,
        submarineSwaps: swaps.submarine,
      };
    });
  };

  public rescan: handleUnaryCall<
    boltzrpc.RescanRequest,
    boltzrpc.RescanResponse
  > = async (call, callback) => {
    await GrpcService.handleCallback(call, callback, async () => {
      const { symbol, startHeight, includeMempool } = call.request;

      const endHeight = await this.service.rescan(
        symbol,
        fromProtoInt(startHeight),
        includeMempool,
      );

      return {
        startHeight,
        endHeight: toProtoInt(endHeight),
      };
    });
  };

  public checkTransaction: handleUnaryCall<
    boltzrpc.CheckTransactionRequest,
    boltzrpc.CheckTransactionResponse
  > = async (call, callback) => {
    await GrpcService.handleCallback(call, callback, async () => {
      const { symbol, id } = call.request;

      await this.service.checkTransaction(symbol, id);

      return {};
    });
  };

  public getLabel: handleUnaryCall<
    boltzrpc.GetLabelRequest,
    boltzrpc.GetLabelResponse
  > = async (call, callback) => {
    await GrpcService.handleCallback(call, callback, async () => {
      const { txId } = call.request;
      const label = await TransactionLabelRepository.getLabel(txId);
      if (label == null) {
        throw 'no label found';
      }

      return {
        symbol: label.symbol,
        label: label.label,
      };
    });
  };

  public getPendingEvmTransactions: handleUnaryCall<
    boltzrpc.GetPendingEvmTransactionsRequest,
    boltzrpc.GetPendingEvmTransactionsResponse
  > = async (call, callback) => {
    await GrpcService.handleCallback(call, callback, async () => {
      const transactions: boltzrpc.GetPendingEvmTransactionsResponse_Transaction[] =
        [];

      for (const tx of await PendingEthereumTransactionRepository.getTransactions()) {
        const txGrpc: boltzrpc.GetPendingEvmTransactionsResponse_Transaction = {
          symbol: tx.chain,
          hash: getHexBuffer(removeHexPrefix(tx.hash)),
          hex: getHexBuffer(removeHexPrefix(tx.hex)),
          nonce: toProtoInt(tx.nonce),
          amountSent: tx.etherAmount.toString(),
        };

        {
          const label = await TransactionLabelRepository.getLabel(tx.hash);
          if (label !== null) {
            txGrpc.label = label.label;
          }
        }

        {
          const manager = this.service.walletManager.ethereumManagers.find(
            (m) => m.hasSymbol(tx.chain),
          );
          if (manager !== undefined) {
            const received = await manager.getClaimedAmount(tx.hex);
            if (received !== undefined) {
              txGrpc.amountReceived = received.amount.toString();

              if (received.token !== undefined) {
                const tokenSymbol = Array.from(
                  manager.tokenAddresses.entries(),
                ).find(([, address]) => address === received.token);

                if (tokenSymbol !== undefined) {
                  txGrpc.symbol = tokenSymbol[0];
                }
              }
            }
          }
        }

        transactions.push(txGrpc);
      }

      return { transactions };
    });
  };

  public setLogLevel: handleUnaryCall<
    boltzrpc.SetLogLevelRequest,
    boltzrpc.SetLogLevelResponse
  > = async (call, callback) => {
    await GrpcService.handleCallback(call, callback, async () => {
      let level: BackendLevel;

      switch (call.request.level) {
        case LogLevel.ERROR:
          level = BackendLevel.Error;
          break;

        case LogLevel.WARN:
          level = BackendLevel.Warn;
          break;

        case LogLevel.INFO:
          level = BackendLevel.Info;
          break;

        case LogLevel.VERBOSE:
          level = BackendLevel.Verbose;
          break;

        case LogLevel.DEBUG:
          level = BackendLevel.Debug;
          break;

        case LogLevel.SILLY:
          level = BackendLevel.Silly;
          break;

        case LogLevel.UNRECOGNIZED:
          throw 'invalid log level';

        default: {
          const exhaustiveLogLevel: never = call.request.level;
          throw new Error(`Unhandled log level: ${exhaustiveLogLevel}`);
        }
      }

      await this.service.setLogLevel(level);

      return {};
    });
  };

  public devHeapDump: handleUnaryCall<
    boltzrpc.DevHeapDumpRequest,
    boltzrpc.DevHeapDumpResponse
  > = async (call, callback) => {
    await GrpcService.handleCallback(call, callback, async () => {
      const filePath = call.request.path || `${getUnixTime()}.heapsnapshot`;

      this.logger.verbose(`Dumping heap at: ${filePath}`);
      await dumpHeap(filePath);

      return {};
    });
  };

  public calculateTransactionFee: handleUnaryCall<
    boltzrpc.CalculateTransactionFeeRequest,
    boltzrpc.CalculateTransactionFeeResponse
  > = async (call, callback) => {
    await GrpcService.handleCallback(call, callback, async () => {
      const { symbol, transactionId } = call.request;

      const { absolute, satPerVbyte, gwei } =
        await this.service.calculateTransactionFee(symbol, transactionId);

      return {
        absolute: toProtoInt(absolute),
        satPerVbyte,
        gwei,
      };
    });
  };

  public swapCreationHook = (
    call: ServerDuplexStream<
      boltzrpc.SwapCreationResponse,
      boltzrpc.SwapCreation
    >,
  ) => {
    this.service.swapManager.creationHook.connectToStream(call);
  };

  public invoiceCreationHook = (
    call: ServerDuplexStream<
      boltzrpc.InvoiceCreationHookResponse,
      boltzrpc.InvoiceCreationHookRequest
    >,
  ) => {
    this.service.swapManager.invoiceCreationHook.connectToStream(call);
  };

  public transactionHook = (
    call: ServerDuplexStream<
      boltzrpc.TransactionHookResponse,
      boltzrpc.TransactionHookRequest
    >,
  ) => {
    this.service.swapManager.nursery.transactionHook.connectToStream(call);
  };

  public invoicePaymentHook = (
    call: ServerDuplexStream<
      boltzrpc.InvoicePaymentHookResponse,
      boltzrpc.InvoicePaymentHookRequest
    >,
  ) => {
    this.service.nodeSwitch.paymentHook.connectToStream(call);
  };

  public getReferrals: handleUnaryCall<
    boltzrpc.GetReferralsRequest,
    boltzrpc.GetReferralsResponse
  > = async (call, callback) => {
    const formatReferral = (referral: Referral) => {
      return {
        id: referral.id,
        config:
          referral.config !== null && referral.config !== undefined
            ? JSON.stringify(referral.config)
            : undefined,
      } satisfies boltzrpc.GetReferralsResponse_Referral;
    };

    await GrpcService.handleCallback(call, callback, async () => {
      const { id } = call.request;

      if (id == undefined || id === '') {
        const referrals = await ReferralRepository.getReferrals();
        return { referral: referrals.map(formatReferral) };
      } else {
        const referral = await ReferralRepository.getReferralById(id);

        if (referral === null) {
          throw `could not find referral with id: ${id}`;
        }

        return { referral: [formatReferral(referral)] };
      }
    });
  };

  public setReferral: handleUnaryCall<
    boltzrpc.SetReferralRequest,
    boltzrpc.SetReferralResponse
  > = async (call, callback) => {
    await GrpcService.handleCallback(call, callback, async () => {
      const { id, config } = call.request;

      const referral = await ReferralRepository.getReferralById(id);
      if (referral === null) {
        throw `could not find referral with id: ${id}`;
      }

      let parsedConfig: ReferralConfig | null = null;
      if (config !== null && config !== undefined && config !== '') {
        parsedConfig = JSON.parse(config);
        if (typeof parsedConfig !== 'object') {
          throw 'config is not an object';
        }
      }

      this.logger.debug(
        `Setting referral config for ${referral.id}: ${stringify(parsedConfig)}`,
      );
      await ReferralRepository.setConfig(referral, parsedConfig);

      return {};
    });
  };

  public invoiceClnThreshold: handleUnaryCall<
    boltzrpc.InvoiceClnThresholdRequest,
    boltzrpc.InvoiceClnThresholdResponse
  > = async (call, callback) => {
    await GrpcService.handleCallback(call, callback, async () => {
      const { thresholds } = call.request;
      this.service.nodeSwitch.updateClnThresholds(
        thresholds.map((t) => ({
          threshold: fromProtoInt(t.threshold),
          type: swapTypeFromGrpcSwapType(t.type),
        })),
      );
      return {};
    });
  };

  public devClearSwapUpdateCache: handleUnaryCall<
    boltzrpc.DevClearSwapUpdateCacheRequest,
    boltzrpc.DevClearSwapUpdateCacheResponse
  > = async (call, callback) => {
    await GrpcService.handleCallback(call, callback, async () => {
      const { id } = call.request;

      if (id !== undefined && id != null && id !== '') {
        this.logger.debug(`Clearing cache for swap: ${id}`);
        await this.api.swapInfos.cache.delete(id);
      } else {
        this.logger.debug('Clearing entire swap update cache');
        await this.api.swapInfos.cache.clear();
      }

      return {};
    });
  };

  public devDisableCooperative: handleUnaryCall<
    boltzrpc.DevDisableCooperativeRequest,
    boltzrpc.DevDisableCooperativeResponse
  > = async (call, callback) => {
    await GrpcService.handleCallback(call, callback, async () => {
      const { disabled } = call.request;
      this.logger.warn(
        `${disabled ? 'Dis' : 'En'}abling cooperative swap signatures`,
      );

      for (const signer of [
        this.service.musigSigner,
        this.service.swapManager.chainSwapSigner,
        this.service.swapManager.deferredClaimer,
      ]) {
        signer.setDisableCooperative(disabled);
      }

      return {};
    });
  };

  private static handleCallback = async <R, T>(
    call: R,
    callback: (error: any, res: T | null) => void,
    handler: (call: R) => Promise<T>,
  ) => {
    try {
      callback(null, await handler(call));
    } catch (error) {
      callback(typeof error === 'string' ? { message: error } : error, null);
    }
  };
}

export default GrpcService;
