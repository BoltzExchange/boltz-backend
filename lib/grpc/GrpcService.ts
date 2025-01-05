import { handleUnaryCall } from '@grpc/grpc-js';
import { Transaction as TransactionLiquid } from 'liquidjs-lib';
import process from 'process';
import { parseTransaction } from '../Core';
import { dumpHeap } from '../HeapDump';
import Logger, { LogLevel as BackendLevel } from '../Logger';
import { wait } from '../PromiseUtils';
import { getHexString, getUnixTime } from '../Utils';
import { CurrencyType, swapTypeToPrettyString } from '../consts/Enums';
import Referral, { ReferralConfig } from '../db/models/Referral';
import ReferralRepository from '../db/repositories/ReferralRepository';
import TransactionLabelRepository from '../db/repositories/TransactionLabelRepository';
import * as boltzrpc from '../proto/boltzrpc_pb';
import { LogLevel } from '../proto/boltzrpc_pb';
import Service from '../service/Service';
import Sidecar from '../sidecar/Sidecar';

class GrpcService {
  constructor(
    private readonly logger: Logger,
    private readonly service: Service,
  ) {}

  public stop: handleUnaryCall<boltzrpc.StopRequest, boltzrpc.StopRequest> =
    async (_, callback) => {
      callback(null, new boltzrpc.StopResponse());

      await Sidecar.stop();
      await wait(500);

      // eslint-disable-next-line n/no-process-exit
      process.exit(0);
    };

  public getInfo: handleUnaryCall<
    boltzrpc.GetInfoRequest,
    boltzrpc.GetInfoResponse
  > = async (call, callback) => {
    await this.handleCallback(call, callback, () => this.service.getInfo());
  };

  public getBalance: handleUnaryCall<
    boltzrpc.GetBalanceRequest,
    boltzrpc.GetBalanceResponse
  > = async (call, callback) => {
    await this.handleCallback(call, callback, () => this.service.getBalance());
  };

  public deriveKeys: handleUnaryCall<
    boltzrpc.DeriveKeysRequest,
    boltzrpc.DeriveKeysResponse
  > = async (call, callback) => {
    await this.handleCallback(call, callback, async () => {
      const { symbol, index } = call.request.toObject();
      return this.service.deriveKeys(symbol, index);
    });
  };

  public deriveBlindingKeys: handleUnaryCall<
    boltzrpc.DeriveBlindingKeyRequest,
    boltzrpc.DeriveBlindingKeyResponse
  > = async (call, callback) => {
    await this.handleCallback(call, callback, async () => {
      const { address } = call.request.toObject();
      const { publicKey, privateKey } =
        this.service.elementsService.deriveBlindingKeys(address);

      const res = new boltzrpc.DeriveBlindingKeyResponse();
      res.setPublicKey(getHexString(publicKey));
      res.setPrivateKey(getHexString(privateKey));

      return res;
    });
  };

  public unblindOutputs: handleUnaryCall<
    boltzrpc.UnblindOutputsRequest,
    boltzrpc.UnblindOutputsResponse
  > = async (call, callback) => {
    await this.handleCallback(call, callback, async () => {
      const outputs =
        call.request.hasId() && call.request.getId() !== ''
          ? await this.service.elementsService.unblindOutputsFromId(
              call.request.getId(),
            )
          : await this.service.elementsService.unblindOutputs(
              parseTransaction(
                CurrencyType.Liquid,
                call.request.getHex(),
              ) as TransactionLiquid,
            );

      const res = new boltzrpc.UnblindOutputsResponse();
      res.setOutputsList(
        outputs.map((out) => {
          const rpcOut = new boltzrpc.UnblindOutputsResponse.UnblindedOutput();
          rpcOut.setValue(out.value);
          rpcOut.setAsset(out.asset);
          rpcOut.setIsLbtc(out.isLbtc);
          rpcOut.setScript(out.script);
          rpcOut.setNonce(out.nonce);

          if (out.rangeProof) {
            rpcOut.setRangeProof(out.rangeProof);
          }

          if (out.surjectionProof) {
            rpcOut.setSurjectionProof(out.surjectionProof);
          }

          return rpcOut;
        }),
      );

      return res;
    });
  };

  public getAddress: handleUnaryCall<
    boltzrpc.GetAddressRequest,
    boltzrpc.GetAddressResponse
  > = async (call, callback) => {
    await this.handleCallback(call, callback, async () => {
      const { symbol, label } = call.request.toObject();
      const address = await this.service.getAddress(symbol, label);

      const response = new boltzrpc.GetAddressResponse();
      response.setAddress(address);

      return response;
    });
  };

  public sendCoins: handleUnaryCall<
    boltzrpc.SendCoinsRequest,
    boltzrpc.SendCoinsResponse
  > = async (call, callback) => {
    await this.handleCallback(call, callback, async () => {
      const { vout, transactionId } = await this.service.sendCoins(
        call.request.toObject(),
      );

      const response = new boltzrpc.SendCoinsResponse();
      response.setTransactionId(transactionId);
      if (vout !== undefined) {
        response.setVout(vout);
      }

      return response;
    });
  };

  public updateTimeoutBlockDelta: handleUnaryCall<
    boltzrpc.UpdateTimeoutBlockDeltaRequest,
    boltzrpc.UpdateTimeoutBlockDeltaResponse
  > = async (call, callback) => {
    await this.handleCallback(call, callback, async () => {
      const {
        pair,
        chainTimeout,
        reverseTimeout,
        swapTaprootTimeout,
        swapMinimalTimeout,
        swapMaximalTimeout,
      } = call.request.toObject();

      this.service.updateTimeoutBlockDelta(pair, {
        chain: chainTimeout,
        reverse: reverseTimeout,
        swapTaproot: swapTaprootTimeout,
        swapMinimal: swapMinimalTimeout,
        swapMaximal: swapMaximalTimeout,
      });

      return new boltzrpc.UpdateTimeoutBlockDeltaResponse();
    });
  };

  public addReferral: handleUnaryCall<
    boltzrpc.AddReferralRequest,
    boltzrpc.AddReferralResponse
  > = async (call, callback) => {
    await this.handleCallback(call, callback, async () => {
      const { id, feeShare, routingNode } = call.request.toObject();

      const { apiKey, apiSecret } = await this.service.addReferral({
        id,
        feeShare,
        routingNode: routingNode === '' ? undefined : routingNode,
      });

      const response = new boltzrpc.AddReferralResponse();

      response.setApiKey(apiKey);
      response.setApiSecret(apiSecret);

      return response;
    });
  };

  public setSwapStatus: handleUnaryCall<
    boltzrpc.SetSwapStatusRequest,
    boltzrpc.SetSwapStatusResponse
  > = async (call, callback) => {
    await this.handleCallback(call, callback, async () => {
      const { id, status } = call.request.toObject();

      await this.service.setSwapStatus(id, status);

      return new boltzrpc.SetSwapStatusResponse();
    });
  };

  public allowRefund: handleUnaryCall<
    boltzrpc.AllowRefundRequest,
    boltzrpc.AllowRefundResponse
  > = async (call, callback) => {
    await this.handleCallback(call, callback, async () => {
      const { id } = call.request.toObject();
      await this.service.allowRefund(id);

      return new boltzrpc.AllowRefundResponse();
    });
  };

  public getLockedFunds: handleUnaryCall<
    boltzrpc.GetLockedFundsRequest,
    boltzrpc.GetLockedFundsResponse
  > = async (call, callback) => {
    await this.handleCallback(call, callback, async () => {
      const lockedFunds = await this.service.getLockedFunds();

      const response = new boltzrpc.GetLockedFundsResponse();
      const lockedFundsGrpcMap = response.getLockedFundsMap();

      lockedFunds.forEach((swaps, currency) => {
        const lockedFundsList = new boltzrpc.LockedFunds();

        swaps.reverseSwaps.forEach((swap) => {
          const lockedFund = new boltzrpc.LockedFund();
          lockedFund.setSwapId(swap.id);
          lockedFund.setOnchainAmount(swap.onchainAmount);

          lockedFundsList.addReverseSwaps(lockedFund);
        });

        swaps.chainSwaps.forEach((swap) => {
          const lockedFund = new boltzrpc.LockedFund();
          lockedFund.setSwapId(swap.id);
          lockedFund.setOnchainAmount(swap.sendingData.amount!);

          lockedFundsList.addChainSwaps(lockedFund);
        });

        lockedFundsGrpcMap.set(currency, lockedFundsList);
      });

      return response;
    });
  };

  public getPendingSweeps: handleUnaryCall<
    boltzrpc.GetPendingSweepsRequest,
    boltzrpc.GetPendingSweepsResponse
  > = async (call, callback) => {
    await this.handleCallback(call, callback, async () => {
      const response = new boltzrpc.GetPendingSweepsResponse();
      const pendingSweeps = this.service.getPendingSweeps();
      const pendingSweepsGrpcMap = response.getPendingSweepsMap();

      pendingSweeps.forEach((swapToClaim, currency) => {
        const pendingSweepsList = new boltzrpc.PendingSweeps();
        swapToClaim
          .map((toClaim) => {
            const pendingSweep = new boltzrpc.PendingSweep();
            pendingSweep.setSwapId(toClaim.id);
            pendingSweep.setOnchainAmount(toClaim.onchainAmount || 0);
            pendingSweep.setType(swapTypeToPrettyString(toClaim.type));
            return pendingSweep;
          })
          .forEach((pendingSweep) =>
            pendingSweepsList.addPendingSweeps(pendingSweep),
          );

        pendingSweepsGrpcMap.set(currency, pendingSweepsList);
      });

      return response;
    });
  };

  public sweepSwaps: handleUnaryCall<
    boltzrpc.SweepSwapsRequest,
    boltzrpc.SweepSwapsResponse
  > = async (call, callback) => {
    await this.handleCallback(call, callback, async () => {
      const { symbol } = call.request.toObject();

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

      const response = new boltzrpc.SweepSwapsResponse();
      const grpcMap = response.getClaimedSymbolsMap();

      for (const [symbol, swapIds] of claimed) {
        const ids = new boltzrpc.SweepSwapsResponse.ClaimedSwaps();
        ids.setClaimedIdsList(swapIds);
        grpcMap.set(symbol, ids);
      }

      return response;
    });
  };

  public listSwaps: handleUnaryCall<
    boltzrpc.ListSwapsRequest,
    boltzrpc.ListSwapsResponse
  > = async (call, callback) => {
    await this.handleCallback(call, callback, async () => {
      const { status, limit } = call.request.toObject();

      const swaps = await this.service.listSwaps(
        status !== undefined && status !== '' ? status : undefined,
        limit,
      );

      const response = new boltzrpc.ListSwapsResponse();
      response.setChainSwapsList(swaps.chain);
      response.setReverseSwapsList(swaps.reverse);
      response.setSubmarineSwapsList(swaps.submarine);

      return response;
    });
  };

  public rescan: handleUnaryCall<
    boltzrpc.RescanRequest,
    boltzrpc.RescanResponse
  > = async (call, callback) => {
    await this.handleCallback(call, callback, async () => {
      const { symbol, startHeight, includeMempool } = call.request.toObject();

      const endHeight = await this.service.rescan(
        symbol,
        startHeight,
        includeMempool,
      );

      const response = new boltzrpc.RescanResponse();
      response.setStartHeight(startHeight);
      response.setEndHeight(endHeight);

      return response;
    });
  };

  public getLabel: handleUnaryCall<
    boltzrpc.GetLabelRequest,
    boltzrpc.GetLabelResponse
  > = async (call, callback) => {
    await this.handleCallback(call, callback, async () => {
      const { txId } = call.request.toObject();
      const label = await TransactionLabelRepository.getLabel(txId);
      if (label == null) {
        throw 'no label found';
      }

      const response = new boltzrpc.GetLabelResponse();
      response.setSymbol(label.symbol);
      response.setLabel(label.label);
      return response;
    });
  };

  public setLogLevel: handleUnaryCall<
    boltzrpc.SetLogLevelRequest,
    boltzrpc.SetLogLevelResponse
  > = async (call, callback) => {
    await this.handleCallback(call, callback, async () => {
      let level: BackendLevel;

      switch (call.request.getLevel()) {
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
      }

      await this.service.setLogLevel(level);

      return new boltzrpc.SetLogLevelResponse();
    });
  };

  public devHeapDump: handleUnaryCall<
    boltzrpc.DevHeapDumpRequest,
    boltzrpc.DevHeapDumpResponse
  > = async (call, callback) => {
    await this.handleCallback(call, callback, async () => {
      const filePath =
        call.request.getPath() || `${getUnixTime()}.heapsnapshot`;

      this.logger.verbose(`Dumping heap at: ${filePath}`);
      await dumpHeap(filePath);

      return new boltzrpc.DevHeapDumpResponse();
    });
  };

  public calculateTransactionFee: handleUnaryCall<
    boltzrpc.CalculateTransactionFeeRequest,
    boltzrpc.CalculateTransactionFeeResponse
  > = async (call, callback) => {
    await this.handleCallback(call, callback, async () => {
      const { symbol, transactionId } = call.request.toObject();

      const { absolute, satPerVbyte, gwei } =
        await this.service.calculateTransactionFee(symbol, transactionId);

      const res = new boltzrpc.CalculateTransactionFeeResponse();
      res.setAbsolute(absolute);

      if (satPerVbyte !== undefined) {
        res.setSatPerVbyte(satPerVbyte);
      }
      if (gwei !== undefined) {
        res.setGwei(gwei);
      }

      return res;
    });
  };

  public getReferrals: handleUnaryCall<
    boltzrpc.GetReferralsRequest,
    boltzrpc.GetReferralsResponse
  > = async (call, callback) => {
    const formatReferral = (referral: Referral) => {
      const ref = new boltzrpc.GetReferralsResponse.Referral();
      ref.setId(referral.id);

      if (referral.config !== null && referral.config !== undefined) {
        ref.setConfig(JSON.stringify(referral.config));
      }

      return ref;
    };

    await this.handleCallback(call, callback, async () => {
      const { id } = call.request.toObject();

      if (id == undefined || id === '') {
        const referrals = await ReferralRepository.getReferrals();

        const res = new boltzrpc.GetReferralsResponse();
        res.setReferralList(referrals.map(formatReferral));

        return res;
      } else {
        const referral = await ReferralRepository.getReferralById(id);

        if (referral === null) {
          throw `could not find referral with id: ${id}`;
        }

        const res = new boltzrpc.GetReferralsResponse();
        res.setReferralList([formatReferral(referral)]);

        return res;
      }
    });
  };

  public setReferral: handleUnaryCall<
    boltzrpc.SetReferralRequest,
    boltzrpc.SetReferralResponse
  > = async (call, callback) => {
    await this.handleCallback(call, callback, async () => {
      const { id, config } = call.request.toObject();

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

      await ReferralRepository.setConfig(referral, parsedConfig);

      return new boltzrpc.SetReferralResponse();
    });
  };

  private handleCallback = async <R, T>(
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
