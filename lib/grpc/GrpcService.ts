/* tslint:disable no-null-keyword */
import grpc from 'grpc';
import Service from '../service/Service';
import * as boltzrpc from '../proto/boltzrpc_pb';

class GrpcService {
  constructor(private service: Service) {}

  public getInfo: grpc.handleUnaryCall<boltzrpc.GetInfoRequest, boltzrpc.GetInfoResponse> = async (_, callback) => {
    try {
      callback(null, await this.service.getInfo());
    } catch (error) {
      callback(error, null);
    }
  }

  public getBalance: grpc.handleUnaryCall<boltzrpc.GetBalanceRequest, boltzrpc.GetBalanceResponse> = async (call, callback) => {
    try {
      callback(null, await this.service.getBalance(call.request.toObject()));
    } catch (error) {
      callback(error, null);
    }
  }

  public newAddress: grpc.handleUnaryCall<boltzrpc.NewAddressRequest, boltzrpc.NewAddressResponse> = async (call, callback) => {
    try {
      const address = await this.service.newAddress(call.request.toObject());

      const response = new boltzrpc.NewAddressResponse();
      response.setAddress(address);

      callback(null, response);
    } catch (error) {
      callback(error, null);
    }
  }

  public getTransaction: grpc.handleUnaryCall<boltzrpc.GetTransactionRequest, boltzrpc.GetTransactionResponse> = async (call, callback) => {
    try {
      const transaction = await this.service.getTransaction(call.request.toObject());

      const response = new boltzrpc.GetTransactionResponse();
      response.setTransactionHex(transaction);

      callback(null, response);
    } catch (error) {
      callback({ message: error.message, name: '' }, null);
    }
  }

  public broadcastTransaction: grpc.handleUnaryCall<boltzrpc.BroadcastTransactionRequest,
  boltzrpc.BroadcastTransactionResponse> = async (call, callback) => {

    try {
      const transactionHash = await this.service.broadcastTransaction(call.request.toObject());

      const response = new boltzrpc.BroadcastTransactionResponse();
      response.setTransactionHash(transactionHash);

      callback(null, response);
    } catch (error) {
      callback({ message: error.message, name: '' }, null);
    }
  }

  public listenOnAddress: grpc.handleUnaryCall<boltzrpc.ListenOnAddressRequest, boltzrpc.ListenOnAddressResponse> = async (call, callback) => {
    try {
      await this.service.listenOnAddress(call.request.toObject());

      callback(null, new boltzrpc.ListenOnAddressResponse());
    } catch (error) {
      callback(error, null);
    }
  }

  public subscribeTransactions: grpc.handleServerStreamingCall<boltzrpc.SubscribeTransactionsRequest,
  boltzrpc.SubscribeTransactionsResponse> = async (call) => {

    this.service.on('transaction.confirmed', (transactionHash: string, outputAddress: string) => {
      const response = new boltzrpc.SubscribeTransactionsResponse();

      response.setTransactionHash(transactionHash);
      response.setOutputAddress(outputAddress);
      call.write(response);
    });
  }

  public subscribeInvoices: grpc.handleServerStreamingCall<boltzrpc.SubscribeInvoicesRequest, boltzrpc.SubscribeInvoicesResponse> = async (call) => {
    this.service.on('invoice.paid', (invoice: string) => {
      const response = new boltzrpc.SubscribeInvoicesResponse();

      response.setEvent(boltzrpc.InvoiceEvent.PAID);
      response.setInvoice(invoice);

      call.write(response);
    });

    this.service.on('invoice.settled', (invoice: string, preimage: string) => {
      const response = new boltzrpc.SubscribeInvoicesResponse();

      response.setEvent(boltzrpc.InvoiceEvent.SETTLED);
      response.setInvoice(invoice);
      response.setPreimage(preimage);

      call.write(response);
    });
  }

  public createSwap: grpc.handleUnaryCall<boltzrpc.CreateSwapRequest, boltzrpc.CreateSwapResponse> = async (call, callback) => {
    try {
      const { address, redeemScript, timeoutBlockHeight, expectedAmount } = await this.service.createSwap(call.request.toObject());

      const response = new boltzrpc.CreateSwapResponse();
      response.setAddress(address);
      response.setRedeemScript(redeemScript);
      response.setExpectedAmount(expectedAmount);
      response.setTimeoutBlockHeight(timeoutBlockHeight);

      callback(null, response);
    } catch (error) {
      callback(error, null);
    }
  }

  public createReverseSwap: grpc.handleUnaryCall<boltzrpc.CreateReverseSwapRequest, boltzrpc.CreateReverseSwapResponse> =
  async (call, callback) => {

    try {
      const {
        invoice,
        redeemScript,
        lockupAddress,
        lockupTransaction,
        lockupTransactionHash,
      } = await this.service.createReverseSwap(call.request.toObject());

      const response = new boltzrpc.CreateReverseSwapResponse();
      response.setInvoice(invoice);
      response.setRedeemScript(redeemScript);
      response.setLockupAddress(lockupAddress);
      response.setLockupTransaction(lockupTransaction);
      response.setLockupTransactionHash(lockupTransactionHash);

      callback(null, response);
    } catch (error) {
      callback(error, null);
    }
  }
}

export default GrpcService;
