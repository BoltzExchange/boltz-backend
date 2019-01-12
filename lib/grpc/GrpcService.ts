/* tslint:disable no-null-keyword */
import grpc from 'grpc';
import Service from '../service/Service';
import * as boltzrpc from '../proto/boltzrpc_pb';
import { Info as LndInfo } from '../lightning/LndClient';
import { Info as ChainInfo } from '../chain/ChainClientInterface';

const createChainClientInfo = (info: ChainInfo): boltzrpc.ChainInfo => {
  const chainInfo = new boltzrpc.ChainInfo();
  const { version, protocolversion, blocks, connections, testnet } = info;

  chainInfo.setVersion(version);
  chainInfo.setProtocolversion(protocolversion);
  chainInfo.setBlocks(blocks);
  chainInfo.setConnections(connections);
  chainInfo.setTestnet(testnet);

  return chainInfo;
};

const createLndInfo = (lndInfo: LndInfo): boltzrpc.LndInfo => {
  const lnd = new boltzrpc.LndInfo();
  const { version, blockheight, error } = lndInfo;

  if (lndInfo.channels) {
    const channels = new boltzrpc.LndChannels();

    channels.setActive(lndInfo.channels.active);
    channels.setPending(lndInfo.channels.pending);
    channels.setInactive(lndInfo.channels.inactive ? lndInfo.channels.inactive : 0);

    lnd.setLndchannels(channels);
  }

  lnd.setVersion(version ? version : '');
  lnd.setBlockheight(blockheight ? blockheight : 0);

  lnd.setError(error ? error : '');

  return lnd;
};

class GrpcService {
  constructor(private service: Service) {}

  public getInfo: grpc.handleUnaryCall<boltzrpc.GetInfoRequest, boltzrpc.GetInfoResponse> = async (_, callback) => {
    try {
      const getInfoResponse = await this.service.getInfo();

      const response = new boltzrpc.GetInfoResponse();
      response.setVersion(getInfoResponse.version);

      const currencies: boltzrpc.CurrencyInfo[] = [];

      getInfoResponse.currencies.forEach((currency) => {
        const currencyInfo = new boltzrpc.CurrencyInfo();

        currencyInfo.setSymbol(currency.symbol);
        currencyInfo.setChain(createChainClientInfo(currency.chainInfo));
        currencyInfo.setLnd(createLndInfo(currency.lndInfo));

        currencies.push(currencyInfo);
      });

      response.setChainsList(currencies);

      callback(null, response);
    } catch (error) {
      callback(error, null);
    }
  }

  public getBalance: grpc.handleUnaryCall<boltzrpc.GetBalanceRequest, boltzrpc.GetBalanceResponse> = async (call, callback) => {
    try {
      const balances = await this.service.getBalance(call.request.toObject());

      const response = new boltzrpc.GetBalanceResponse();

      const responseMap: Map<string, boltzrpc.WalletBalance> = response.getBalancesMap();

      balances.forEach((balance, currency) => {
        const walletBalance = new boltzrpc.WalletBalance();

        walletBalance.setTotalBalance(balance.totalBalance);
        walletBalance.setConfirmedBalance(balance.confirmedBalance);
        walletBalance.setUnconfirmedBalance(balance.unconfirmedBalance);

        responseMap.set(currency, walletBalance);
      });

      callback(null, response);
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

    this.service.on('invoice.settled', (invoice: string) => {
      const response = new boltzrpc.SubscribeInvoicesResponse();

      response.setEvent(boltzrpc.InvoiceEvent.SETTLED);
      response.setInvoice(invoice);

      call.write(response);
    });
  }

  public createSwap: grpc.handleUnaryCall<boltzrpc.CreateSwapRequest, boltzrpc.CreateSwapResponse> = async (call, callback) => {
    try {
      const { address, redeemScript, timeoutBlockHeight, expectedAmount } = await this.service.createSwap(call.request.toObject());

      const response = new boltzrpc.CreateSwapResponse();
      response.setRedeemScript(redeemScript);
      response.setTimeoutBlockHeight(timeoutBlockHeight);
      response.setAddress(address);
      response.setExpectedAmount(expectedAmount);

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
