/*
  tslint:disable no-null-keyword
  tslint:disable-next-line: max-line-length
 */
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

  public getBalance: handleUnaryCall<boltzrpc.GetBalanceRequest, boltzrpc.GetBalanceResponse> = async (call, callback) => {
    try {
      const { symbol } = call.request.toObject();

      callback(null, await this.service.getBalance(symbol));
    } catch (error) {
      callback(error, null);
    }
  }

  public newAddress: handleUnaryCall<boltzrpc.NewAddressRequest, boltzrpc.NewAddressResponse> = async (call, callback) => {
    try {
      const { symbol, type } = call.request.toObject();

      const address = await this.service.newAddress(symbol, type);

      const response = new boltzrpc.NewAddressResponse();
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
}

export default GrpcService;
