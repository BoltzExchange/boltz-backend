/*
  tslint:disable no-null-keyword
  tslint:disable-next-line: max-line-length
 */
import { ServerWriteableStream, handleUnaryCall, handleServerStreamingCall } from 'grpc';
import Service from '../service/Service';
import * as boltzrpc from '../proto/boltzrpc_pb';

class GrpcService {
  private swapEventSubscriptions: ServerWriteableStream<boltzrpc.SubscribeSwapEventsRequest>[] = [];
  private transactionSubscriptions: ServerWriteableStream<boltzrpc.SubscribeTransactionsRequest>[] = [];
  private invoiceSubscriptions: ServerWriteableStream<boltzrpc.SubscribeInvoicesRequest>[] = [];
  private channelBackupSubscriptions: ServerWriteableStream<boltzrpc.SubscribeChannelBackupsRequest>[] = [];

  constructor(private service: Service) {
    this.subscribeToEvents();
  }

  public getInfo: handleUnaryCall<boltzrpc.GetInfoRequest, boltzrpc.GetInfoResponse> = async (_, callback) => {
    try {
      callback(null, await this.service.getInfo());
    } catch (error) {
      callback(error, null);
    }
  }

  public getBalance: handleUnaryCall<boltzrpc.GetBalanceRequest, boltzrpc.GetBalanceResponse> = async (call, callback) => {
    try {
      callback(null, await this.service.getBalance(call.request.toObject()));
    } catch (error) {
      callback(error, null);
    }
  }

  public newAddress: handleUnaryCall<boltzrpc.NewAddressRequest, boltzrpc.NewAddressResponse> = async (call, callback) => {
    try {
      const address = await this.service.newAddress(call.request.toObject());

      const response = new boltzrpc.NewAddressResponse();
      response.setAddress(address);

      callback(null, response);
    } catch (error) {
      callback(error, null);
    }
  }

  public getTransaction: handleUnaryCall<boltzrpc.GetTransactionRequest, boltzrpc.GetTransactionResponse> = async (call, callback) => {
    try {
      const transaction = await this.service.getTransaction(call.request.toObject());

      const response = new boltzrpc.GetTransactionResponse();
      response.setTransactionHex(transaction);

      callback(null, response);
    } catch (error) {
      callback({ message: error.message, name: '' }, null);
    }
  }

  public getFeeEstimation: handleUnaryCall<boltzrpc.GetFeeEstimationRequest, boltzrpc.GetFeeEstimationResponse> = async (call, callback) => {
    try {
      callback(null, await this.service.getFeeEstimation(call.request.toObject()));
    } catch (error) {
      callback(error, null);
    }
  }

  public broadcastTransaction: handleUnaryCall<boltzrpc.BroadcastTransactionRequest, boltzrpc.BroadcastTransactionResponse> = async (call, callback) => {
    try {
      const transactionHash = await this.service.broadcastTransaction(call.request.toObject());

      const response = new boltzrpc.BroadcastTransactionResponse();
      response.setTransactionHash(transactionHash);

      callback(null, response);
    } catch (error) {
      callback({ message: error.message, name: '' }, null);
    }
  }

  public listenOnAddress: handleUnaryCall<boltzrpc.ListenOnAddressRequest, boltzrpc.ListenOnAddressResponse> = async (call, callback) => {
    try {
      this.service.listenOnAddress(call.request.toObject());

      callback(null, new boltzrpc.ListenOnAddressResponse());
    } catch (error) {
      callback(error, null);
    }
  }

  public subscribeSwapEvents: handleServerStreamingCall<boltzrpc.SubscribeSwapEventsRequest, boltzrpc.SubscribeSwapEventsResponse> = async (call) => {
    this.registerSubscription(call, this.swapEventSubscriptions);
  }

  public subscribeTransactions: handleServerStreamingCall<boltzrpc.SubscribeTransactionsRequest, boltzrpc.SubscribeTransactionsResponse> = async (call) => {
    this.registerSubscription(call, this.transactionSubscriptions);
  }

  public subscribeInvoices: handleServerStreamingCall<boltzrpc.SubscribeInvoicesRequest, boltzrpc.SubscribeInvoicesResponse> = async (call) => {
    this.registerSubscription(call, this.invoiceSubscriptions);
  }

  public subscribeChannelBackups: handleServerStreamingCall<boltzrpc.SubscribeChannelBackupsRequest, boltzrpc.ChannelBackup> = async (call) => {
    this.registerSubscription(call, this.channelBackupSubscriptions);
  }

  public createSwap: handleUnaryCall<boltzrpc.CreateSwapRequest, boltzrpc.CreateSwapResponse> = async (call, callback) => {
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

  public createReverseSwap: handleUnaryCall<boltzrpc.CreateReverseSwapRequest, boltzrpc.CreateReverseSwapResponse> = async (call, callback) => {
    try {
      const {
        invoice,
        minerFee,
        amountSent,
        redeemScript,
        lockupAddress,
        lockupTransaction,
        lockupTransactionHash,
      } = await this.service.createReverseSwap(call.request.toObject());

      const response = new boltzrpc.CreateReverseSwapResponse();
      response.setInvoice(invoice);
      response.setMinerFee(minerFee);
      response.setAmountSent(amountSent);
      response.setRedeemScript(redeemScript);
      response.setLockupAddress(lockupAddress);
      response.setLockupTransaction(lockupTransaction);
      response.setLockupTransactionHash(lockupTransactionHash);

      callback(null, response);
    } catch (error) {
      callback(error, null);
    }
  }

  public sendCoins: handleUnaryCall<boltzrpc.SendCoinsRequest, boltzrpc.SendCoinsResponse> = async (call, callback) => {
    try {
      const { vout, transactionHash } = await this.service.sendCoins(call.request.toObject());

      const response = new boltzrpc.SendCoinsResponse();
      response.setTransactionHash(transactionHash);
      response.setVout(vout);

      callback(null, response);
    } catch (error) {
      callback(error, null);
    }
  }

  private subscribeToEvents = () => {
    // Transaction subscription
    this.service.on('transaction.confirmed', (outputAddress: string, transactionHash: string, amountReceived: number) => {
      this.transactionSubscriptions.forEach((subscription) => {
        const response = new boltzrpc.SubscribeTransactionsResponse();
        response.setOutputAddress(outputAddress);
        response.setAmountReceived(amountReceived);
        response.setTransactionHash(transactionHash);

        subscription.write(response);
      });
    });

    // Invoice subscriptions
    this.service.on('invoice.paid', (invoice: string, routingFee: number) => {
      this.invoiceSubscriptions.forEach((subscription) => {
        const response = new boltzrpc.SubscribeInvoicesResponse();
        response.setEvent(boltzrpc.InvoiceEvent.PAID);
        response.setInvoice(invoice);
        response.setRoutingFee(routingFee);

        subscription.write(response);
      });
    });

    this.service.on('invoice.failedToPay', (invoice: string) => {
      this.invoiceSubscriptions.forEach((subscription) => {
        const response = new boltzrpc.SubscribeInvoicesResponse();
        response.setEvent(boltzrpc.InvoiceEvent.FAILED_TO_PAY);
        response.setInvoice(invoice);

        subscription.write(response);
      });
    });

    this.service.on('invoice.settled', (invoice: string, preimage: string) => {
      this.invoiceSubscriptions.forEach((subscription) => {
        const response = new boltzrpc.SubscribeInvoicesResponse();
        response.setEvent(boltzrpc.InvoiceEvent.SETTLED);
        response.setInvoice(invoice);
        response.setPreimage(preimage);

        subscription.write(response);
      });
    });

    // Swap event subscriptions
    this.service.on('claim', (lockupTransactionHash: string, lockupVout: number, minerFee: number) => {
      this.swapEventSubscriptions.forEach((subscription) => {
        const response = new boltzrpc.SubscribeSwapEventsResponse();
        const claimDetails = new boltzrpc.ClaimDetails();

        claimDetails.setLockupTransactionHash(lockupTransactionHash);
        claimDetails.setLockupVout(lockupVout);
        claimDetails.setMinerFee(minerFee);

        response.setEvent(boltzrpc.SwapEvent.CLAIM);
        response.setClaimDetails(claimDetails);

        subscription.write(response);
      });
    });

    this.service.on('abort', (invoice: string) => {
      this.swapEventSubscriptions.forEach((subscription) => {
        const response = new boltzrpc.SubscribeSwapEventsResponse();
        const abortDetails = new boltzrpc.AbortDetails();

        abortDetails.setInvoice(invoice);

        response.setEvent(boltzrpc.SwapEvent.ABORT);
        response.setAbortDetails(abortDetails);

        subscription.write(response);
      });
    });

    this.service.on('refund', (lockupTransactionHash: string, lockupVout: number, minerFee: number) => {
      this.swapEventSubscriptions.forEach((subscription) => {
        const response = new boltzrpc.SubscribeSwapEventsResponse();
        const refundDetails = new boltzrpc.RefundDetails();

        refundDetails.setLockupTransactionHash(lockupTransactionHash);
        refundDetails.setLockupVout(lockupVout);
        refundDetails.setMinerFee(minerFee);

        response.setEvent(boltzrpc.SwapEvent.REFUND);
        response.setRefundDetails(refundDetails);

        subscription.write(response);
      });
    });

    // Channel backup subscription
    this.service.on('channel.backup', (currency: string, channelBackup: string) => {
      this.channelBackupSubscriptions.forEach((subscription) => {
        const response = new boltzrpc.ChannelBackup();
        response.setCurrency(currency);
        response.setMultiChannelBackup(channelBackup);

        subscription.write(response);
      });
    });
  }

  private registerSubscription = (call: ServerWriteableStream<any>, subscriptions: ServerWriteableStream<any>[]) => {
    const index = subscriptions.push(call);

    // Remove the subscription from the array when it is closed
    call.on('finish', () => {
      subscriptions.splice(index - 1, 1);
    });

    call.on('close', () => {
      subscriptions.splice(index - 1, 1);
    });
  }
}

export default GrpcService;
