import { handleUnaryCall } from '@grpc/grpc-js';
import { Transaction as TransactionLiquid } from 'liquidjs-lib';
import { parseTransaction } from '../Core';
import { getHexString } from '../Utils';
import { CurrencyType } from '../consts/Enums';
import * as boltzrpc from '../proto/boltzrpc_pb';
import Service from '../service/Service';

class GrpcService {
  constructor(private service: Service) {}

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
      const { symbol } = call.request.toObject();

      const address = await this.service.getAddress(symbol);

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
      response.setVout(vout);
      response.setTransactionId(transactionId);

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
        swapTaproot,
        reverseTimeout,
        swapMinimalTimeout,
        swapMaximalTimeout,
      } = call.request.toObject();

      this.service.updateTimeoutBlockDelta(pair, {
        swapTaproot,
        reverse: reverseTimeout,
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
