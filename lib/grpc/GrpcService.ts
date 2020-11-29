import { handleUnaryCall } from 'grpc';
import Service from '../service/Service';
import * as boltzrpc from '../proto/boltzrpc_pb';

class GrpcService {

  constructor(private service: Service) {}

  public getInfo: handleUnaryCall<boltzrpc.GetInfoRequest, boltzrpc.GetInfoResponse> = async (_, callback) => {
    try {
      callback(null, await this.service.getInfo());
    } catch (error) {
      callback(error, null);
    }
  }

  public getBalance: handleUnaryCall<boltzrpc.GetBalanceRequest, boltzrpc.GetBalanceResponse> = async (_, callback) => {
    try {
      callback(null, await this.service.getBalance());
    } catch (error) {
      callback(error, null);
    }
  }

  public deriveKeys: handleUnaryCall<boltzrpc.DeriveKeysRequest, boltzrpc.DeriveKeysResponse> = async (call, callback) => {
    try {
      const { symbol, index } = call.request.toObject();

      callback(null, this.service.deriveKeys(symbol, index));
    } catch (error) {
      callback(error, null);
    }
  }

  public getAddress: handleUnaryCall<boltzrpc.GetAddressRequest, boltzrpc.GetAddressResponse> = async (call, callback) => {
    try {
      const { symbol } = call.request.toObject();

      const address = await this.service.getAddress(symbol);

      const response = new boltzrpc.GetAddressResponse();
      response.setAddress(address);

      callback(null, response);
    } catch (error) {
      callback(error, null);
    }
  }

  public sendCoins: handleUnaryCall<boltzrpc.SendCoinsRequest, boltzrpc.SendCoinsResponse> = async (call, callback) => {
    try {
      const { vout, transactionId } = await this.service.sendCoins(call.request.toObject());

      const response = new boltzrpc.SendCoinsResponse();
      response.setVout(vout);
      response.setTransactionId(transactionId);

      callback(null, response);
    } catch (error) {
      callback(error, null);
    }
  }

  public updateTimeoutBlockDelta: handleUnaryCall<boltzrpc.UpdateTimeoutBlockDeltaRequest, boltzrpc.UpdateTimeoutBlockDeltaResponse> = async (call, callback) => {
    try {
      const { pair, newDelta } = call.request.toObject();

      this.service.updateTimeoutBlockDelta(pair, newDelta);

      callback(null, new boltzrpc.UpdateTimeoutBlockDeltaResponse());
    } catch (error) {
      callback(error, null);
    }
  }
}

export default GrpcService;
