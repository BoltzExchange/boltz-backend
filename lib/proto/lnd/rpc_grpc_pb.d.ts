// package: lnrpc
// file: lnd/rpc.proto

/* tslint:disable */
/* eslint-disable */

import * as grpc from "grpc";
import * as lnd_rpc_pb from "../lnd/rpc_pb";

interface ILightningService extends grpc.ServiceDefinition<grpc.UntypedServiceImplementation> {
    walletBalance: ILightningService_IWalletBalance;
    channelBalance: ILightningService_IChannelBalance;
    getTransactions: ILightningService_IGetTransactions;
    estimateFee: ILightningService_IEstimateFee;
    sendCoins: ILightningService_ISendCoins;
    listUnspent: ILightningService_IListUnspent;
    subscribeTransactions: ILightningService_ISubscribeTransactions;
    sendMany: ILightningService_ISendMany;
    newAddress: ILightningService_INewAddress;
    signMessage: ILightningService_ISignMessage;
    verifyMessage: ILightningService_IVerifyMessage;
    connectPeer: ILightningService_IConnectPeer;
    disconnectPeer: ILightningService_IDisconnectPeer;
    listPeers: ILightningService_IListPeers;
    subscribePeerEvents: ILightningService_ISubscribePeerEvents;
    getInfo: ILightningService_IGetInfo;
    getRecoveryInfo: ILightningService_IGetRecoveryInfo;
    pendingChannels: ILightningService_IPendingChannels;
    listChannels: ILightningService_IListChannels;
    subscribeChannelEvents: ILightningService_ISubscribeChannelEvents;
    closedChannels: ILightningService_IClosedChannels;
    openChannelSync: ILightningService_IOpenChannelSync;
    openChannel: ILightningService_IOpenChannel;
    fundingStateStep: ILightningService_IFundingStateStep;
    channelAcceptor: ILightningService_IChannelAcceptor;
    closeChannel: ILightningService_ICloseChannel;
    abandonChannel: ILightningService_IAbandonChannel;
    sendPayment: ILightningService_ISendPayment;
    sendPaymentSync: ILightningService_ISendPaymentSync;
    sendToRoute: ILightningService_ISendToRoute;
    sendToRouteSync: ILightningService_ISendToRouteSync;
    addInvoice: ILightningService_IAddInvoice;
    listInvoices: ILightningService_IListInvoices;
    lookupInvoice: ILightningService_ILookupInvoice;
    subscribeInvoices: ILightningService_ISubscribeInvoices;
    decodePayReq: ILightningService_IDecodePayReq;
    listPayments: ILightningService_IListPayments;
    deleteAllPayments: ILightningService_IDeleteAllPayments;
    describeGraph: ILightningService_IDescribeGraph;
    getNodeMetrics: ILightningService_IGetNodeMetrics;
    getChanInfo: ILightningService_IGetChanInfo;
    getNodeInfo: ILightningService_IGetNodeInfo;
    queryRoutes: ILightningService_IQueryRoutes;
    getNetworkInfo: ILightningService_IGetNetworkInfo;
    stopDaemon: ILightningService_IStopDaemon;
    subscribeChannelGraph: ILightningService_ISubscribeChannelGraph;
    debugLevel: ILightningService_IDebugLevel;
    feeReport: ILightningService_IFeeReport;
    updateChannelPolicy: ILightningService_IUpdateChannelPolicy;
    forwardingHistory: ILightningService_IForwardingHistory;
    exportChannelBackup: ILightningService_IExportChannelBackup;
    exportAllChannelBackups: ILightningService_IExportAllChannelBackups;
    verifyChanBackup: ILightningService_IVerifyChanBackup;
    restoreChannelBackups: ILightningService_IRestoreChannelBackups;
    subscribeChannelBackups: ILightningService_ISubscribeChannelBackups;
    bakeMacaroon: ILightningService_IBakeMacaroon;
    listPermissions: ILightningService_IListPermissions;
}

interface ILightningService_IWalletBalance extends grpc.MethodDefinition<lnd_rpc_pb.WalletBalanceRequest, lnd_rpc_pb.WalletBalanceResponse> {
    path: "/lnrpc.Lightning/WalletBalance";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<lnd_rpc_pb.WalletBalanceRequest>;
    requestDeserialize: grpc.deserialize<lnd_rpc_pb.WalletBalanceRequest>;
    responseSerialize: grpc.serialize<lnd_rpc_pb.WalletBalanceResponse>;
    responseDeserialize: grpc.deserialize<lnd_rpc_pb.WalletBalanceResponse>;
}
interface ILightningService_IChannelBalance extends grpc.MethodDefinition<lnd_rpc_pb.ChannelBalanceRequest, lnd_rpc_pb.ChannelBalanceResponse> {
    path: "/lnrpc.Lightning/ChannelBalance";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<lnd_rpc_pb.ChannelBalanceRequest>;
    requestDeserialize: grpc.deserialize<lnd_rpc_pb.ChannelBalanceRequest>;
    responseSerialize: grpc.serialize<lnd_rpc_pb.ChannelBalanceResponse>;
    responseDeserialize: grpc.deserialize<lnd_rpc_pb.ChannelBalanceResponse>;
}
interface ILightningService_IGetTransactions extends grpc.MethodDefinition<lnd_rpc_pb.GetTransactionsRequest, lnd_rpc_pb.TransactionDetails> {
    path: "/lnrpc.Lightning/GetTransactions";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<lnd_rpc_pb.GetTransactionsRequest>;
    requestDeserialize: grpc.deserialize<lnd_rpc_pb.GetTransactionsRequest>;
    responseSerialize: grpc.serialize<lnd_rpc_pb.TransactionDetails>;
    responseDeserialize: grpc.deserialize<lnd_rpc_pb.TransactionDetails>;
}
interface ILightningService_IEstimateFee extends grpc.MethodDefinition<lnd_rpc_pb.EstimateFeeRequest, lnd_rpc_pb.EstimateFeeResponse> {
    path: "/lnrpc.Lightning/EstimateFee";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<lnd_rpc_pb.EstimateFeeRequest>;
    requestDeserialize: grpc.deserialize<lnd_rpc_pb.EstimateFeeRequest>;
    responseSerialize: grpc.serialize<lnd_rpc_pb.EstimateFeeResponse>;
    responseDeserialize: grpc.deserialize<lnd_rpc_pb.EstimateFeeResponse>;
}
interface ILightningService_ISendCoins extends grpc.MethodDefinition<lnd_rpc_pb.SendCoinsRequest, lnd_rpc_pb.SendCoinsResponse> {
    path: "/lnrpc.Lightning/SendCoins";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<lnd_rpc_pb.SendCoinsRequest>;
    requestDeserialize: grpc.deserialize<lnd_rpc_pb.SendCoinsRequest>;
    responseSerialize: grpc.serialize<lnd_rpc_pb.SendCoinsResponse>;
    responseDeserialize: grpc.deserialize<lnd_rpc_pb.SendCoinsResponse>;
}
interface ILightningService_IListUnspent extends grpc.MethodDefinition<lnd_rpc_pb.ListUnspentRequest, lnd_rpc_pb.ListUnspentResponse> {
    path: "/lnrpc.Lightning/ListUnspent";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<lnd_rpc_pb.ListUnspentRequest>;
    requestDeserialize: grpc.deserialize<lnd_rpc_pb.ListUnspentRequest>;
    responseSerialize: grpc.serialize<lnd_rpc_pb.ListUnspentResponse>;
    responseDeserialize: grpc.deserialize<lnd_rpc_pb.ListUnspentResponse>;
}
interface ILightningService_ISubscribeTransactions extends grpc.MethodDefinition<lnd_rpc_pb.GetTransactionsRequest, lnd_rpc_pb.Transaction> {
    path: "/lnrpc.Lightning/SubscribeTransactions";
    requestStream: false;
    responseStream: true;
    requestSerialize: grpc.serialize<lnd_rpc_pb.GetTransactionsRequest>;
    requestDeserialize: grpc.deserialize<lnd_rpc_pb.GetTransactionsRequest>;
    responseSerialize: grpc.serialize<lnd_rpc_pb.Transaction>;
    responseDeserialize: grpc.deserialize<lnd_rpc_pb.Transaction>;
}
interface ILightningService_ISendMany extends grpc.MethodDefinition<lnd_rpc_pb.SendManyRequest, lnd_rpc_pb.SendManyResponse> {
    path: "/lnrpc.Lightning/SendMany";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<lnd_rpc_pb.SendManyRequest>;
    requestDeserialize: grpc.deserialize<lnd_rpc_pb.SendManyRequest>;
    responseSerialize: grpc.serialize<lnd_rpc_pb.SendManyResponse>;
    responseDeserialize: grpc.deserialize<lnd_rpc_pb.SendManyResponse>;
}
interface ILightningService_INewAddress extends grpc.MethodDefinition<lnd_rpc_pb.NewAddressRequest, lnd_rpc_pb.NewAddressResponse> {
    path: "/lnrpc.Lightning/NewAddress";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<lnd_rpc_pb.NewAddressRequest>;
    requestDeserialize: grpc.deserialize<lnd_rpc_pb.NewAddressRequest>;
    responseSerialize: grpc.serialize<lnd_rpc_pb.NewAddressResponse>;
    responseDeserialize: grpc.deserialize<lnd_rpc_pb.NewAddressResponse>;
}
interface ILightningService_ISignMessage extends grpc.MethodDefinition<lnd_rpc_pb.SignMessageRequest, lnd_rpc_pb.SignMessageResponse> {
    path: "/lnrpc.Lightning/SignMessage";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<lnd_rpc_pb.SignMessageRequest>;
    requestDeserialize: grpc.deserialize<lnd_rpc_pb.SignMessageRequest>;
    responseSerialize: grpc.serialize<lnd_rpc_pb.SignMessageResponse>;
    responseDeserialize: grpc.deserialize<lnd_rpc_pb.SignMessageResponse>;
}
interface ILightningService_IVerifyMessage extends grpc.MethodDefinition<lnd_rpc_pb.VerifyMessageRequest, lnd_rpc_pb.VerifyMessageResponse> {
    path: "/lnrpc.Lightning/VerifyMessage";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<lnd_rpc_pb.VerifyMessageRequest>;
    requestDeserialize: grpc.deserialize<lnd_rpc_pb.VerifyMessageRequest>;
    responseSerialize: grpc.serialize<lnd_rpc_pb.VerifyMessageResponse>;
    responseDeserialize: grpc.deserialize<lnd_rpc_pb.VerifyMessageResponse>;
}
interface ILightningService_IConnectPeer extends grpc.MethodDefinition<lnd_rpc_pb.ConnectPeerRequest, lnd_rpc_pb.ConnectPeerResponse> {
    path: "/lnrpc.Lightning/ConnectPeer";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<lnd_rpc_pb.ConnectPeerRequest>;
    requestDeserialize: grpc.deserialize<lnd_rpc_pb.ConnectPeerRequest>;
    responseSerialize: grpc.serialize<lnd_rpc_pb.ConnectPeerResponse>;
    responseDeserialize: grpc.deserialize<lnd_rpc_pb.ConnectPeerResponse>;
}
interface ILightningService_IDisconnectPeer extends grpc.MethodDefinition<lnd_rpc_pb.DisconnectPeerRequest, lnd_rpc_pb.DisconnectPeerResponse> {
    path: "/lnrpc.Lightning/DisconnectPeer";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<lnd_rpc_pb.DisconnectPeerRequest>;
    requestDeserialize: grpc.deserialize<lnd_rpc_pb.DisconnectPeerRequest>;
    responseSerialize: grpc.serialize<lnd_rpc_pb.DisconnectPeerResponse>;
    responseDeserialize: grpc.deserialize<lnd_rpc_pb.DisconnectPeerResponse>;
}
interface ILightningService_IListPeers extends grpc.MethodDefinition<lnd_rpc_pb.ListPeersRequest, lnd_rpc_pb.ListPeersResponse> {
    path: "/lnrpc.Lightning/ListPeers";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<lnd_rpc_pb.ListPeersRequest>;
    requestDeserialize: grpc.deserialize<lnd_rpc_pb.ListPeersRequest>;
    responseSerialize: grpc.serialize<lnd_rpc_pb.ListPeersResponse>;
    responseDeserialize: grpc.deserialize<lnd_rpc_pb.ListPeersResponse>;
}
interface ILightningService_ISubscribePeerEvents extends grpc.MethodDefinition<lnd_rpc_pb.PeerEventSubscription, lnd_rpc_pb.PeerEvent> {
    path: "/lnrpc.Lightning/SubscribePeerEvents";
    requestStream: false;
    responseStream: true;
    requestSerialize: grpc.serialize<lnd_rpc_pb.PeerEventSubscription>;
    requestDeserialize: grpc.deserialize<lnd_rpc_pb.PeerEventSubscription>;
    responseSerialize: grpc.serialize<lnd_rpc_pb.PeerEvent>;
    responseDeserialize: grpc.deserialize<lnd_rpc_pb.PeerEvent>;
}
interface ILightningService_IGetInfo extends grpc.MethodDefinition<lnd_rpc_pb.GetInfoRequest, lnd_rpc_pb.GetInfoResponse> {
    path: "/lnrpc.Lightning/GetInfo";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<lnd_rpc_pb.GetInfoRequest>;
    requestDeserialize: grpc.deserialize<lnd_rpc_pb.GetInfoRequest>;
    responseSerialize: grpc.serialize<lnd_rpc_pb.GetInfoResponse>;
    responseDeserialize: grpc.deserialize<lnd_rpc_pb.GetInfoResponse>;
}
interface ILightningService_IGetRecoveryInfo extends grpc.MethodDefinition<lnd_rpc_pb.GetRecoveryInfoRequest, lnd_rpc_pb.GetRecoveryInfoResponse> {
    path: "/lnrpc.Lightning/GetRecoveryInfo";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<lnd_rpc_pb.GetRecoveryInfoRequest>;
    requestDeserialize: grpc.deserialize<lnd_rpc_pb.GetRecoveryInfoRequest>;
    responseSerialize: grpc.serialize<lnd_rpc_pb.GetRecoveryInfoResponse>;
    responseDeserialize: grpc.deserialize<lnd_rpc_pb.GetRecoveryInfoResponse>;
}
interface ILightningService_IPendingChannels extends grpc.MethodDefinition<lnd_rpc_pb.PendingChannelsRequest, lnd_rpc_pb.PendingChannelsResponse> {
    path: "/lnrpc.Lightning/PendingChannels";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<lnd_rpc_pb.PendingChannelsRequest>;
    requestDeserialize: grpc.deserialize<lnd_rpc_pb.PendingChannelsRequest>;
    responseSerialize: grpc.serialize<lnd_rpc_pb.PendingChannelsResponse>;
    responseDeserialize: grpc.deserialize<lnd_rpc_pb.PendingChannelsResponse>;
}
interface ILightningService_IListChannels extends grpc.MethodDefinition<lnd_rpc_pb.ListChannelsRequest, lnd_rpc_pb.ListChannelsResponse> {
    path: "/lnrpc.Lightning/ListChannels";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<lnd_rpc_pb.ListChannelsRequest>;
    requestDeserialize: grpc.deserialize<lnd_rpc_pb.ListChannelsRequest>;
    responseSerialize: grpc.serialize<lnd_rpc_pb.ListChannelsResponse>;
    responseDeserialize: grpc.deserialize<lnd_rpc_pb.ListChannelsResponse>;
}
interface ILightningService_ISubscribeChannelEvents extends grpc.MethodDefinition<lnd_rpc_pb.ChannelEventSubscription, lnd_rpc_pb.ChannelEventUpdate> {
    path: "/lnrpc.Lightning/SubscribeChannelEvents";
    requestStream: false;
    responseStream: true;
    requestSerialize: grpc.serialize<lnd_rpc_pb.ChannelEventSubscription>;
    requestDeserialize: grpc.deserialize<lnd_rpc_pb.ChannelEventSubscription>;
    responseSerialize: grpc.serialize<lnd_rpc_pb.ChannelEventUpdate>;
    responseDeserialize: grpc.deserialize<lnd_rpc_pb.ChannelEventUpdate>;
}
interface ILightningService_IClosedChannels extends grpc.MethodDefinition<lnd_rpc_pb.ClosedChannelsRequest, lnd_rpc_pb.ClosedChannelsResponse> {
    path: "/lnrpc.Lightning/ClosedChannels";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<lnd_rpc_pb.ClosedChannelsRequest>;
    requestDeserialize: grpc.deserialize<lnd_rpc_pb.ClosedChannelsRequest>;
    responseSerialize: grpc.serialize<lnd_rpc_pb.ClosedChannelsResponse>;
    responseDeserialize: grpc.deserialize<lnd_rpc_pb.ClosedChannelsResponse>;
}
interface ILightningService_IOpenChannelSync extends grpc.MethodDefinition<lnd_rpc_pb.OpenChannelRequest, lnd_rpc_pb.ChannelPoint> {
    path: "/lnrpc.Lightning/OpenChannelSync";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<lnd_rpc_pb.OpenChannelRequest>;
    requestDeserialize: grpc.deserialize<lnd_rpc_pb.OpenChannelRequest>;
    responseSerialize: grpc.serialize<lnd_rpc_pb.ChannelPoint>;
    responseDeserialize: grpc.deserialize<lnd_rpc_pb.ChannelPoint>;
}
interface ILightningService_IOpenChannel extends grpc.MethodDefinition<lnd_rpc_pb.OpenChannelRequest, lnd_rpc_pb.OpenStatusUpdate> {
    path: "/lnrpc.Lightning/OpenChannel";
    requestStream: false;
    responseStream: true;
    requestSerialize: grpc.serialize<lnd_rpc_pb.OpenChannelRequest>;
    requestDeserialize: grpc.deserialize<lnd_rpc_pb.OpenChannelRequest>;
    responseSerialize: grpc.serialize<lnd_rpc_pb.OpenStatusUpdate>;
    responseDeserialize: grpc.deserialize<lnd_rpc_pb.OpenStatusUpdate>;
}
interface ILightningService_IFundingStateStep extends grpc.MethodDefinition<lnd_rpc_pb.FundingTransitionMsg, lnd_rpc_pb.FundingStateStepResp> {
    path: "/lnrpc.Lightning/FundingStateStep";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<lnd_rpc_pb.FundingTransitionMsg>;
    requestDeserialize: grpc.deserialize<lnd_rpc_pb.FundingTransitionMsg>;
    responseSerialize: grpc.serialize<lnd_rpc_pb.FundingStateStepResp>;
    responseDeserialize: grpc.deserialize<lnd_rpc_pb.FundingStateStepResp>;
}
interface ILightningService_IChannelAcceptor extends grpc.MethodDefinition<lnd_rpc_pb.ChannelAcceptResponse, lnd_rpc_pb.ChannelAcceptRequest> {
    path: "/lnrpc.Lightning/ChannelAcceptor";
    requestStream: true;
    responseStream: true;
    requestSerialize: grpc.serialize<lnd_rpc_pb.ChannelAcceptResponse>;
    requestDeserialize: grpc.deserialize<lnd_rpc_pb.ChannelAcceptResponse>;
    responseSerialize: grpc.serialize<lnd_rpc_pb.ChannelAcceptRequest>;
    responseDeserialize: grpc.deserialize<lnd_rpc_pb.ChannelAcceptRequest>;
}
interface ILightningService_ICloseChannel extends grpc.MethodDefinition<lnd_rpc_pb.CloseChannelRequest, lnd_rpc_pb.CloseStatusUpdate> {
    path: "/lnrpc.Lightning/CloseChannel";
    requestStream: false;
    responseStream: true;
    requestSerialize: grpc.serialize<lnd_rpc_pb.CloseChannelRequest>;
    requestDeserialize: grpc.deserialize<lnd_rpc_pb.CloseChannelRequest>;
    responseSerialize: grpc.serialize<lnd_rpc_pb.CloseStatusUpdate>;
    responseDeserialize: grpc.deserialize<lnd_rpc_pb.CloseStatusUpdate>;
}
interface ILightningService_IAbandonChannel extends grpc.MethodDefinition<lnd_rpc_pb.AbandonChannelRequest, lnd_rpc_pb.AbandonChannelResponse> {
    path: "/lnrpc.Lightning/AbandonChannel";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<lnd_rpc_pb.AbandonChannelRequest>;
    requestDeserialize: grpc.deserialize<lnd_rpc_pb.AbandonChannelRequest>;
    responseSerialize: grpc.serialize<lnd_rpc_pb.AbandonChannelResponse>;
    responseDeserialize: grpc.deserialize<lnd_rpc_pb.AbandonChannelResponse>;
}
interface ILightningService_ISendPayment extends grpc.MethodDefinition<lnd_rpc_pb.SendRequest, lnd_rpc_pb.SendResponse> {
    path: "/lnrpc.Lightning/SendPayment";
    requestStream: true;
    responseStream: true;
    requestSerialize: grpc.serialize<lnd_rpc_pb.SendRequest>;
    requestDeserialize: grpc.deserialize<lnd_rpc_pb.SendRequest>;
    responseSerialize: grpc.serialize<lnd_rpc_pb.SendResponse>;
    responseDeserialize: grpc.deserialize<lnd_rpc_pb.SendResponse>;
}
interface ILightningService_ISendPaymentSync extends grpc.MethodDefinition<lnd_rpc_pb.SendRequest, lnd_rpc_pb.SendResponse> {
    path: "/lnrpc.Lightning/SendPaymentSync";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<lnd_rpc_pb.SendRequest>;
    requestDeserialize: grpc.deserialize<lnd_rpc_pb.SendRequest>;
    responseSerialize: grpc.serialize<lnd_rpc_pb.SendResponse>;
    responseDeserialize: grpc.deserialize<lnd_rpc_pb.SendResponse>;
}
interface ILightningService_ISendToRoute extends grpc.MethodDefinition<lnd_rpc_pb.SendToRouteRequest, lnd_rpc_pb.SendResponse> {
    path: "/lnrpc.Lightning/SendToRoute";
    requestStream: true;
    responseStream: true;
    requestSerialize: grpc.serialize<lnd_rpc_pb.SendToRouteRequest>;
    requestDeserialize: grpc.deserialize<lnd_rpc_pb.SendToRouteRequest>;
    responseSerialize: grpc.serialize<lnd_rpc_pb.SendResponse>;
    responseDeserialize: grpc.deserialize<lnd_rpc_pb.SendResponse>;
}
interface ILightningService_ISendToRouteSync extends grpc.MethodDefinition<lnd_rpc_pb.SendToRouteRequest, lnd_rpc_pb.SendResponse> {
    path: "/lnrpc.Lightning/SendToRouteSync";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<lnd_rpc_pb.SendToRouteRequest>;
    requestDeserialize: grpc.deserialize<lnd_rpc_pb.SendToRouteRequest>;
    responseSerialize: grpc.serialize<lnd_rpc_pb.SendResponse>;
    responseDeserialize: grpc.deserialize<lnd_rpc_pb.SendResponse>;
}
interface ILightningService_IAddInvoice extends grpc.MethodDefinition<lnd_rpc_pb.Invoice, lnd_rpc_pb.AddInvoiceResponse> {
    path: "/lnrpc.Lightning/AddInvoice";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<lnd_rpc_pb.Invoice>;
    requestDeserialize: grpc.deserialize<lnd_rpc_pb.Invoice>;
    responseSerialize: grpc.serialize<lnd_rpc_pb.AddInvoiceResponse>;
    responseDeserialize: grpc.deserialize<lnd_rpc_pb.AddInvoiceResponse>;
}
interface ILightningService_IListInvoices extends grpc.MethodDefinition<lnd_rpc_pb.ListInvoiceRequest, lnd_rpc_pb.ListInvoiceResponse> {
    path: "/lnrpc.Lightning/ListInvoices";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<lnd_rpc_pb.ListInvoiceRequest>;
    requestDeserialize: grpc.deserialize<lnd_rpc_pb.ListInvoiceRequest>;
    responseSerialize: grpc.serialize<lnd_rpc_pb.ListInvoiceResponse>;
    responseDeserialize: grpc.deserialize<lnd_rpc_pb.ListInvoiceResponse>;
}
interface ILightningService_ILookupInvoice extends grpc.MethodDefinition<lnd_rpc_pb.PaymentHash, lnd_rpc_pb.Invoice> {
    path: "/lnrpc.Lightning/LookupInvoice";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<lnd_rpc_pb.PaymentHash>;
    requestDeserialize: grpc.deserialize<lnd_rpc_pb.PaymentHash>;
    responseSerialize: grpc.serialize<lnd_rpc_pb.Invoice>;
    responseDeserialize: grpc.deserialize<lnd_rpc_pb.Invoice>;
}
interface ILightningService_ISubscribeInvoices extends grpc.MethodDefinition<lnd_rpc_pb.InvoiceSubscription, lnd_rpc_pb.Invoice> {
    path: "/lnrpc.Lightning/SubscribeInvoices";
    requestStream: false;
    responseStream: true;
    requestSerialize: grpc.serialize<lnd_rpc_pb.InvoiceSubscription>;
    requestDeserialize: grpc.deserialize<lnd_rpc_pb.InvoiceSubscription>;
    responseSerialize: grpc.serialize<lnd_rpc_pb.Invoice>;
    responseDeserialize: grpc.deserialize<lnd_rpc_pb.Invoice>;
}
interface ILightningService_IDecodePayReq extends grpc.MethodDefinition<lnd_rpc_pb.PayReqString, lnd_rpc_pb.PayReq> {
    path: "/lnrpc.Lightning/DecodePayReq";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<lnd_rpc_pb.PayReqString>;
    requestDeserialize: grpc.deserialize<lnd_rpc_pb.PayReqString>;
    responseSerialize: grpc.serialize<lnd_rpc_pb.PayReq>;
    responseDeserialize: grpc.deserialize<lnd_rpc_pb.PayReq>;
}
interface ILightningService_IListPayments extends grpc.MethodDefinition<lnd_rpc_pb.ListPaymentsRequest, lnd_rpc_pb.ListPaymentsResponse> {
    path: "/lnrpc.Lightning/ListPayments";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<lnd_rpc_pb.ListPaymentsRequest>;
    requestDeserialize: grpc.deserialize<lnd_rpc_pb.ListPaymentsRequest>;
    responseSerialize: grpc.serialize<lnd_rpc_pb.ListPaymentsResponse>;
    responseDeserialize: grpc.deserialize<lnd_rpc_pb.ListPaymentsResponse>;
}
interface ILightningService_IDeleteAllPayments extends grpc.MethodDefinition<lnd_rpc_pb.DeleteAllPaymentsRequest, lnd_rpc_pb.DeleteAllPaymentsResponse> {
    path: "/lnrpc.Lightning/DeleteAllPayments";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<lnd_rpc_pb.DeleteAllPaymentsRequest>;
    requestDeserialize: grpc.deserialize<lnd_rpc_pb.DeleteAllPaymentsRequest>;
    responseSerialize: grpc.serialize<lnd_rpc_pb.DeleteAllPaymentsResponse>;
    responseDeserialize: grpc.deserialize<lnd_rpc_pb.DeleteAllPaymentsResponse>;
}
interface ILightningService_IDescribeGraph extends grpc.MethodDefinition<lnd_rpc_pb.ChannelGraphRequest, lnd_rpc_pb.ChannelGraph> {
    path: "/lnrpc.Lightning/DescribeGraph";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<lnd_rpc_pb.ChannelGraphRequest>;
    requestDeserialize: grpc.deserialize<lnd_rpc_pb.ChannelGraphRequest>;
    responseSerialize: grpc.serialize<lnd_rpc_pb.ChannelGraph>;
    responseDeserialize: grpc.deserialize<lnd_rpc_pb.ChannelGraph>;
}
interface ILightningService_IGetNodeMetrics extends grpc.MethodDefinition<lnd_rpc_pb.NodeMetricsRequest, lnd_rpc_pb.NodeMetricsResponse> {
    path: "/lnrpc.Lightning/GetNodeMetrics";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<lnd_rpc_pb.NodeMetricsRequest>;
    requestDeserialize: grpc.deserialize<lnd_rpc_pb.NodeMetricsRequest>;
    responseSerialize: grpc.serialize<lnd_rpc_pb.NodeMetricsResponse>;
    responseDeserialize: grpc.deserialize<lnd_rpc_pb.NodeMetricsResponse>;
}
interface ILightningService_IGetChanInfo extends grpc.MethodDefinition<lnd_rpc_pb.ChanInfoRequest, lnd_rpc_pb.ChannelEdge> {
    path: "/lnrpc.Lightning/GetChanInfo";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<lnd_rpc_pb.ChanInfoRequest>;
    requestDeserialize: grpc.deserialize<lnd_rpc_pb.ChanInfoRequest>;
    responseSerialize: grpc.serialize<lnd_rpc_pb.ChannelEdge>;
    responseDeserialize: grpc.deserialize<lnd_rpc_pb.ChannelEdge>;
}
interface ILightningService_IGetNodeInfo extends grpc.MethodDefinition<lnd_rpc_pb.NodeInfoRequest, lnd_rpc_pb.NodeInfo> {
    path: "/lnrpc.Lightning/GetNodeInfo";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<lnd_rpc_pb.NodeInfoRequest>;
    requestDeserialize: grpc.deserialize<lnd_rpc_pb.NodeInfoRequest>;
    responseSerialize: grpc.serialize<lnd_rpc_pb.NodeInfo>;
    responseDeserialize: grpc.deserialize<lnd_rpc_pb.NodeInfo>;
}
interface ILightningService_IQueryRoutes extends grpc.MethodDefinition<lnd_rpc_pb.QueryRoutesRequest, lnd_rpc_pb.QueryRoutesResponse> {
    path: "/lnrpc.Lightning/QueryRoutes";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<lnd_rpc_pb.QueryRoutesRequest>;
    requestDeserialize: grpc.deserialize<lnd_rpc_pb.QueryRoutesRequest>;
    responseSerialize: grpc.serialize<lnd_rpc_pb.QueryRoutesResponse>;
    responseDeserialize: grpc.deserialize<lnd_rpc_pb.QueryRoutesResponse>;
}
interface ILightningService_IGetNetworkInfo extends grpc.MethodDefinition<lnd_rpc_pb.NetworkInfoRequest, lnd_rpc_pb.NetworkInfo> {
    path: "/lnrpc.Lightning/GetNetworkInfo";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<lnd_rpc_pb.NetworkInfoRequest>;
    requestDeserialize: grpc.deserialize<lnd_rpc_pb.NetworkInfoRequest>;
    responseSerialize: grpc.serialize<lnd_rpc_pb.NetworkInfo>;
    responseDeserialize: grpc.deserialize<lnd_rpc_pb.NetworkInfo>;
}
interface ILightningService_IStopDaemon extends grpc.MethodDefinition<lnd_rpc_pb.StopRequest, lnd_rpc_pb.StopResponse> {
    path: "/lnrpc.Lightning/StopDaemon";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<lnd_rpc_pb.StopRequest>;
    requestDeserialize: grpc.deserialize<lnd_rpc_pb.StopRequest>;
    responseSerialize: grpc.serialize<lnd_rpc_pb.StopResponse>;
    responseDeserialize: grpc.deserialize<lnd_rpc_pb.StopResponse>;
}
interface ILightningService_ISubscribeChannelGraph extends grpc.MethodDefinition<lnd_rpc_pb.GraphTopologySubscription, lnd_rpc_pb.GraphTopologyUpdate> {
    path: "/lnrpc.Lightning/SubscribeChannelGraph";
    requestStream: false;
    responseStream: true;
    requestSerialize: grpc.serialize<lnd_rpc_pb.GraphTopologySubscription>;
    requestDeserialize: grpc.deserialize<lnd_rpc_pb.GraphTopologySubscription>;
    responseSerialize: grpc.serialize<lnd_rpc_pb.GraphTopologyUpdate>;
    responseDeserialize: grpc.deserialize<lnd_rpc_pb.GraphTopologyUpdate>;
}
interface ILightningService_IDebugLevel extends grpc.MethodDefinition<lnd_rpc_pb.DebugLevelRequest, lnd_rpc_pb.DebugLevelResponse> {
    path: "/lnrpc.Lightning/DebugLevel";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<lnd_rpc_pb.DebugLevelRequest>;
    requestDeserialize: grpc.deserialize<lnd_rpc_pb.DebugLevelRequest>;
    responseSerialize: grpc.serialize<lnd_rpc_pb.DebugLevelResponse>;
    responseDeserialize: grpc.deserialize<lnd_rpc_pb.DebugLevelResponse>;
}
interface ILightningService_IFeeReport extends grpc.MethodDefinition<lnd_rpc_pb.FeeReportRequest, lnd_rpc_pb.FeeReportResponse> {
    path: "/lnrpc.Lightning/FeeReport";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<lnd_rpc_pb.FeeReportRequest>;
    requestDeserialize: grpc.deserialize<lnd_rpc_pb.FeeReportRequest>;
    responseSerialize: grpc.serialize<lnd_rpc_pb.FeeReportResponse>;
    responseDeserialize: grpc.deserialize<lnd_rpc_pb.FeeReportResponse>;
}
interface ILightningService_IUpdateChannelPolicy extends grpc.MethodDefinition<lnd_rpc_pb.PolicyUpdateRequest, lnd_rpc_pb.PolicyUpdateResponse> {
    path: "/lnrpc.Lightning/UpdateChannelPolicy";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<lnd_rpc_pb.PolicyUpdateRequest>;
    requestDeserialize: grpc.deserialize<lnd_rpc_pb.PolicyUpdateRequest>;
    responseSerialize: grpc.serialize<lnd_rpc_pb.PolicyUpdateResponse>;
    responseDeserialize: grpc.deserialize<lnd_rpc_pb.PolicyUpdateResponse>;
}
interface ILightningService_IForwardingHistory extends grpc.MethodDefinition<lnd_rpc_pb.ForwardingHistoryRequest, lnd_rpc_pb.ForwardingHistoryResponse> {
    path: "/lnrpc.Lightning/ForwardingHistory";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<lnd_rpc_pb.ForwardingHistoryRequest>;
    requestDeserialize: grpc.deserialize<lnd_rpc_pb.ForwardingHistoryRequest>;
    responseSerialize: grpc.serialize<lnd_rpc_pb.ForwardingHistoryResponse>;
    responseDeserialize: grpc.deserialize<lnd_rpc_pb.ForwardingHistoryResponse>;
}
interface ILightningService_IExportChannelBackup extends grpc.MethodDefinition<lnd_rpc_pb.ExportChannelBackupRequest, lnd_rpc_pb.ChannelBackup> {
    path: "/lnrpc.Lightning/ExportChannelBackup";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<lnd_rpc_pb.ExportChannelBackupRequest>;
    requestDeserialize: grpc.deserialize<lnd_rpc_pb.ExportChannelBackupRequest>;
    responseSerialize: grpc.serialize<lnd_rpc_pb.ChannelBackup>;
    responseDeserialize: grpc.deserialize<lnd_rpc_pb.ChannelBackup>;
}
interface ILightningService_IExportAllChannelBackups extends grpc.MethodDefinition<lnd_rpc_pb.ChanBackupExportRequest, lnd_rpc_pb.ChanBackupSnapshot> {
    path: "/lnrpc.Lightning/ExportAllChannelBackups";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<lnd_rpc_pb.ChanBackupExportRequest>;
    requestDeserialize: grpc.deserialize<lnd_rpc_pb.ChanBackupExportRequest>;
    responseSerialize: grpc.serialize<lnd_rpc_pb.ChanBackupSnapshot>;
    responseDeserialize: grpc.deserialize<lnd_rpc_pb.ChanBackupSnapshot>;
}
interface ILightningService_IVerifyChanBackup extends grpc.MethodDefinition<lnd_rpc_pb.ChanBackupSnapshot, lnd_rpc_pb.VerifyChanBackupResponse> {
    path: "/lnrpc.Lightning/VerifyChanBackup";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<lnd_rpc_pb.ChanBackupSnapshot>;
    requestDeserialize: grpc.deserialize<lnd_rpc_pb.ChanBackupSnapshot>;
    responseSerialize: grpc.serialize<lnd_rpc_pb.VerifyChanBackupResponse>;
    responseDeserialize: grpc.deserialize<lnd_rpc_pb.VerifyChanBackupResponse>;
}
interface ILightningService_IRestoreChannelBackups extends grpc.MethodDefinition<lnd_rpc_pb.RestoreChanBackupRequest, lnd_rpc_pb.RestoreBackupResponse> {
    path: "/lnrpc.Lightning/RestoreChannelBackups";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<lnd_rpc_pb.RestoreChanBackupRequest>;
    requestDeserialize: grpc.deserialize<lnd_rpc_pb.RestoreChanBackupRequest>;
    responseSerialize: grpc.serialize<lnd_rpc_pb.RestoreBackupResponse>;
    responseDeserialize: grpc.deserialize<lnd_rpc_pb.RestoreBackupResponse>;
}
interface ILightningService_ISubscribeChannelBackups extends grpc.MethodDefinition<lnd_rpc_pb.ChannelBackupSubscription, lnd_rpc_pb.ChanBackupSnapshot> {
    path: "/lnrpc.Lightning/SubscribeChannelBackups";
    requestStream: false;
    responseStream: true;
    requestSerialize: grpc.serialize<lnd_rpc_pb.ChannelBackupSubscription>;
    requestDeserialize: grpc.deserialize<lnd_rpc_pb.ChannelBackupSubscription>;
    responseSerialize: grpc.serialize<lnd_rpc_pb.ChanBackupSnapshot>;
    responseDeserialize: grpc.deserialize<lnd_rpc_pb.ChanBackupSnapshot>;
}
interface ILightningService_IBakeMacaroon extends grpc.MethodDefinition<lnd_rpc_pb.BakeMacaroonRequest, lnd_rpc_pb.BakeMacaroonResponse> {
    path: "/lnrpc.Lightning/BakeMacaroon";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<lnd_rpc_pb.BakeMacaroonRequest>;
    requestDeserialize: grpc.deserialize<lnd_rpc_pb.BakeMacaroonRequest>;
    responseSerialize: grpc.serialize<lnd_rpc_pb.BakeMacaroonResponse>;
    responseDeserialize: grpc.deserialize<lnd_rpc_pb.BakeMacaroonResponse>;
}
interface ILightningService_IListPermissions extends grpc.MethodDefinition<lnd_rpc_pb.ListPermissionsRequest, lnd_rpc_pb.ListPermissionsResponse> {
    path: "/lnrpc.Lightning/ListPermissions";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<lnd_rpc_pb.ListPermissionsRequest>;
    requestDeserialize: grpc.deserialize<lnd_rpc_pb.ListPermissionsRequest>;
    responseSerialize: grpc.serialize<lnd_rpc_pb.ListPermissionsResponse>;
    responseDeserialize: grpc.deserialize<lnd_rpc_pb.ListPermissionsResponse>;
}

export const LightningService: ILightningService;

export interface ILightningServer {
    walletBalance: grpc.handleUnaryCall<lnd_rpc_pb.WalletBalanceRequest, lnd_rpc_pb.WalletBalanceResponse>;
    channelBalance: grpc.handleUnaryCall<lnd_rpc_pb.ChannelBalanceRequest, lnd_rpc_pb.ChannelBalanceResponse>;
    getTransactions: grpc.handleUnaryCall<lnd_rpc_pb.GetTransactionsRequest, lnd_rpc_pb.TransactionDetails>;
    estimateFee: grpc.handleUnaryCall<lnd_rpc_pb.EstimateFeeRequest, lnd_rpc_pb.EstimateFeeResponse>;
    sendCoins: grpc.handleUnaryCall<lnd_rpc_pb.SendCoinsRequest, lnd_rpc_pb.SendCoinsResponse>;
    listUnspent: grpc.handleUnaryCall<lnd_rpc_pb.ListUnspentRequest, lnd_rpc_pb.ListUnspentResponse>;
    subscribeTransactions: grpc.handleServerStreamingCall<lnd_rpc_pb.GetTransactionsRequest, lnd_rpc_pb.Transaction>;
    sendMany: grpc.handleUnaryCall<lnd_rpc_pb.SendManyRequest, lnd_rpc_pb.SendManyResponse>;
    newAddress: grpc.handleUnaryCall<lnd_rpc_pb.NewAddressRequest, lnd_rpc_pb.NewAddressResponse>;
    signMessage: grpc.handleUnaryCall<lnd_rpc_pb.SignMessageRequest, lnd_rpc_pb.SignMessageResponse>;
    verifyMessage: grpc.handleUnaryCall<lnd_rpc_pb.VerifyMessageRequest, lnd_rpc_pb.VerifyMessageResponse>;
    connectPeer: grpc.handleUnaryCall<lnd_rpc_pb.ConnectPeerRequest, lnd_rpc_pb.ConnectPeerResponse>;
    disconnectPeer: grpc.handleUnaryCall<lnd_rpc_pb.DisconnectPeerRequest, lnd_rpc_pb.DisconnectPeerResponse>;
    listPeers: grpc.handleUnaryCall<lnd_rpc_pb.ListPeersRequest, lnd_rpc_pb.ListPeersResponse>;
    subscribePeerEvents: grpc.handleServerStreamingCall<lnd_rpc_pb.PeerEventSubscription, lnd_rpc_pb.PeerEvent>;
    getInfo: grpc.handleUnaryCall<lnd_rpc_pb.GetInfoRequest, lnd_rpc_pb.GetInfoResponse>;
    getRecoveryInfo: grpc.handleUnaryCall<lnd_rpc_pb.GetRecoveryInfoRequest, lnd_rpc_pb.GetRecoveryInfoResponse>;
    pendingChannels: grpc.handleUnaryCall<lnd_rpc_pb.PendingChannelsRequest, lnd_rpc_pb.PendingChannelsResponse>;
    listChannels: grpc.handleUnaryCall<lnd_rpc_pb.ListChannelsRequest, lnd_rpc_pb.ListChannelsResponse>;
    subscribeChannelEvents: grpc.handleServerStreamingCall<lnd_rpc_pb.ChannelEventSubscription, lnd_rpc_pb.ChannelEventUpdate>;
    closedChannels: grpc.handleUnaryCall<lnd_rpc_pb.ClosedChannelsRequest, lnd_rpc_pb.ClosedChannelsResponse>;
    openChannelSync: grpc.handleUnaryCall<lnd_rpc_pb.OpenChannelRequest, lnd_rpc_pb.ChannelPoint>;
    openChannel: grpc.handleServerStreamingCall<lnd_rpc_pb.OpenChannelRequest, lnd_rpc_pb.OpenStatusUpdate>;
    fundingStateStep: grpc.handleUnaryCall<lnd_rpc_pb.FundingTransitionMsg, lnd_rpc_pb.FundingStateStepResp>;
    channelAcceptor: grpc.handleBidiStreamingCall<lnd_rpc_pb.ChannelAcceptResponse, lnd_rpc_pb.ChannelAcceptRequest>;
    closeChannel: grpc.handleServerStreamingCall<lnd_rpc_pb.CloseChannelRequest, lnd_rpc_pb.CloseStatusUpdate>;
    abandonChannel: grpc.handleUnaryCall<lnd_rpc_pb.AbandonChannelRequest, lnd_rpc_pb.AbandonChannelResponse>;
    sendPayment: grpc.handleBidiStreamingCall<lnd_rpc_pb.SendRequest, lnd_rpc_pb.SendResponse>;
    sendPaymentSync: grpc.handleUnaryCall<lnd_rpc_pb.SendRequest, lnd_rpc_pb.SendResponse>;
    sendToRoute: grpc.handleBidiStreamingCall<lnd_rpc_pb.SendToRouteRequest, lnd_rpc_pb.SendResponse>;
    sendToRouteSync: grpc.handleUnaryCall<lnd_rpc_pb.SendToRouteRequest, lnd_rpc_pb.SendResponse>;
    addInvoice: grpc.handleUnaryCall<lnd_rpc_pb.Invoice, lnd_rpc_pb.AddInvoiceResponse>;
    listInvoices: grpc.handleUnaryCall<lnd_rpc_pb.ListInvoiceRequest, lnd_rpc_pb.ListInvoiceResponse>;
    lookupInvoice: grpc.handleUnaryCall<lnd_rpc_pb.PaymentHash, lnd_rpc_pb.Invoice>;
    subscribeInvoices: grpc.handleServerStreamingCall<lnd_rpc_pb.InvoiceSubscription, lnd_rpc_pb.Invoice>;
    decodePayReq: grpc.handleUnaryCall<lnd_rpc_pb.PayReqString, lnd_rpc_pb.PayReq>;
    listPayments: grpc.handleUnaryCall<lnd_rpc_pb.ListPaymentsRequest, lnd_rpc_pb.ListPaymentsResponse>;
    deleteAllPayments: grpc.handleUnaryCall<lnd_rpc_pb.DeleteAllPaymentsRequest, lnd_rpc_pb.DeleteAllPaymentsResponse>;
    describeGraph: grpc.handleUnaryCall<lnd_rpc_pb.ChannelGraphRequest, lnd_rpc_pb.ChannelGraph>;
    getNodeMetrics: grpc.handleUnaryCall<lnd_rpc_pb.NodeMetricsRequest, lnd_rpc_pb.NodeMetricsResponse>;
    getChanInfo: grpc.handleUnaryCall<lnd_rpc_pb.ChanInfoRequest, lnd_rpc_pb.ChannelEdge>;
    getNodeInfo: grpc.handleUnaryCall<lnd_rpc_pb.NodeInfoRequest, lnd_rpc_pb.NodeInfo>;
    queryRoutes: grpc.handleUnaryCall<lnd_rpc_pb.QueryRoutesRequest, lnd_rpc_pb.QueryRoutesResponse>;
    getNetworkInfo: grpc.handleUnaryCall<lnd_rpc_pb.NetworkInfoRequest, lnd_rpc_pb.NetworkInfo>;
    stopDaemon: grpc.handleUnaryCall<lnd_rpc_pb.StopRequest, lnd_rpc_pb.StopResponse>;
    subscribeChannelGraph: grpc.handleServerStreamingCall<lnd_rpc_pb.GraphTopologySubscription, lnd_rpc_pb.GraphTopologyUpdate>;
    debugLevel: grpc.handleUnaryCall<lnd_rpc_pb.DebugLevelRequest, lnd_rpc_pb.DebugLevelResponse>;
    feeReport: grpc.handleUnaryCall<lnd_rpc_pb.FeeReportRequest, lnd_rpc_pb.FeeReportResponse>;
    updateChannelPolicy: grpc.handleUnaryCall<lnd_rpc_pb.PolicyUpdateRequest, lnd_rpc_pb.PolicyUpdateResponse>;
    forwardingHistory: grpc.handleUnaryCall<lnd_rpc_pb.ForwardingHistoryRequest, lnd_rpc_pb.ForwardingHistoryResponse>;
    exportChannelBackup: grpc.handleUnaryCall<lnd_rpc_pb.ExportChannelBackupRequest, lnd_rpc_pb.ChannelBackup>;
    exportAllChannelBackups: grpc.handleUnaryCall<lnd_rpc_pb.ChanBackupExportRequest, lnd_rpc_pb.ChanBackupSnapshot>;
    verifyChanBackup: grpc.handleUnaryCall<lnd_rpc_pb.ChanBackupSnapshot, lnd_rpc_pb.VerifyChanBackupResponse>;
    restoreChannelBackups: grpc.handleUnaryCall<lnd_rpc_pb.RestoreChanBackupRequest, lnd_rpc_pb.RestoreBackupResponse>;
    subscribeChannelBackups: grpc.handleServerStreamingCall<lnd_rpc_pb.ChannelBackupSubscription, lnd_rpc_pb.ChanBackupSnapshot>;
    bakeMacaroon: grpc.handleUnaryCall<lnd_rpc_pb.BakeMacaroonRequest, lnd_rpc_pb.BakeMacaroonResponse>;
    listPermissions: grpc.handleUnaryCall<lnd_rpc_pb.ListPermissionsRequest, lnd_rpc_pb.ListPermissionsResponse>;
}

export interface ILightningClient {
    walletBalance(request: lnd_rpc_pb.WalletBalanceRequest, callback: (error: grpc.ServiceError | null, response: lnd_rpc_pb.WalletBalanceResponse) => void): grpc.ClientUnaryCall;
    walletBalance(request: lnd_rpc_pb.WalletBalanceRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: lnd_rpc_pb.WalletBalanceResponse) => void): grpc.ClientUnaryCall;
    walletBalance(request: lnd_rpc_pb.WalletBalanceRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: lnd_rpc_pb.WalletBalanceResponse) => void): grpc.ClientUnaryCall;
    channelBalance(request: lnd_rpc_pb.ChannelBalanceRequest, callback: (error: grpc.ServiceError | null, response: lnd_rpc_pb.ChannelBalanceResponse) => void): grpc.ClientUnaryCall;
    channelBalance(request: lnd_rpc_pb.ChannelBalanceRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: lnd_rpc_pb.ChannelBalanceResponse) => void): grpc.ClientUnaryCall;
    channelBalance(request: lnd_rpc_pb.ChannelBalanceRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: lnd_rpc_pb.ChannelBalanceResponse) => void): grpc.ClientUnaryCall;
    getTransactions(request: lnd_rpc_pb.GetTransactionsRequest, callback: (error: grpc.ServiceError | null, response: lnd_rpc_pb.TransactionDetails) => void): grpc.ClientUnaryCall;
    getTransactions(request: lnd_rpc_pb.GetTransactionsRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: lnd_rpc_pb.TransactionDetails) => void): grpc.ClientUnaryCall;
    getTransactions(request: lnd_rpc_pb.GetTransactionsRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: lnd_rpc_pb.TransactionDetails) => void): grpc.ClientUnaryCall;
    estimateFee(request: lnd_rpc_pb.EstimateFeeRequest, callback: (error: grpc.ServiceError | null, response: lnd_rpc_pb.EstimateFeeResponse) => void): grpc.ClientUnaryCall;
    estimateFee(request: lnd_rpc_pb.EstimateFeeRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: lnd_rpc_pb.EstimateFeeResponse) => void): grpc.ClientUnaryCall;
    estimateFee(request: lnd_rpc_pb.EstimateFeeRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: lnd_rpc_pb.EstimateFeeResponse) => void): grpc.ClientUnaryCall;
    sendCoins(request: lnd_rpc_pb.SendCoinsRequest, callback: (error: grpc.ServiceError | null, response: lnd_rpc_pb.SendCoinsResponse) => void): grpc.ClientUnaryCall;
    sendCoins(request: lnd_rpc_pb.SendCoinsRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: lnd_rpc_pb.SendCoinsResponse) => void): grpc.ClientUnaryCall;
    sendCoins(request: lnd_rpc_pb.SendCoinsRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: lnd_rpc_pb.SendCoinsResponse) => void): grpc.ClientUnaryCall;
    listUnspent(request: lnd_rpc_pb.ListUnspentRequest, callback: (error: grpc.ServiceError | null, response: lnd_rpc_pb.ListUnspentResponse) => void): grpc.ClientUnaryCall;
    listUnspent(request: lnd_rpc_pb.ListUnspentRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: lnd_rpc_pb.ListUnspentResponse) => void): grpc.ClientUnaryCall;
    listUnspent(request: lnd_rpc_pb.ListUnspentRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: lnd_rpc_pb.ListUnspentResponse) => void): grpc.ClientUnaryCall;
    subscribeTransactions(request: lnd_rpc_pb.GetTransactionsRequest, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<lnd_rpc_pb.Transaction>;
    subscribeTransactions(request: lnd_rpc_pb.GetTransactionsRequest, metadata?: grpc.Metadata, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<lnd_rpc_pb.Transaction>;
    sendMany(request: lnd_rpc_pb.SendManyRequest, callback: (error: grpc.ServiceError | null, response: lnd_rpc_pb.SendManyResponse) => void): grpc.ClientUnaryCall;
    sendMany(request: lnd_rpc_pb.SendManyRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: lnd_rpc_pb.SendManyResponse) => void): grpc.ClientUnaryCall;
    sendMany(request: lnd_rpc_pb.SendManyRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: lnd_rpc_pb.SendManyResponse) => void): grpc.ClientUnaryCall;
    newAddress(request: lnd_rpc_pb.NewAddressRequest, callback: (error: grpc.ServiceError | null, response: lnd_rpc_pb.NewAddressResponse) => void): grpc.ClientUnaryCall;
    newAddress(request: lnd_rpc_pb.NewAddressRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: lnd_rpc_pb.NewAddressResponse) => void): grpc.ClientUnaryCall;
    newAddress(request: lnd_rpc_pb.NewAddressRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: lnd_rpc_pb.NewAddressResponse) => void): grpc.ClientUnaryCall;
    signMessage(request: lnd_rpc_pb.SignMessageRequest, callback: (error: grpc.ServiceError | null, response: lnd_rpc_pb.SignMessageResponse) => void): grpc.ClientUnaryCall;
    signMessage(request: lnd_rpc_pb.SignMessageRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: lnd_rpc_pb.SignMessageResponse) => void): grpc.ClientUnaryCall;
    signMessage(request: lnd_rpc_pb.SignMessageRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: lnd_rpc_pb.SignMessageResponse) => void): grpc.ClientUnaryCall;
    verifyMessage(request: lnd_rpc_pb.VerifyMessageRequest, callback: (error: grpc.ServiceError | null, response: lnd_rpc_pb.VerifyMessageResponse) => void): grpc.ClientUnaryCall;
    verifyMessage(request: lnd_rpc_pb.VerifyMessageRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: lnd_rpc_pb.VerifyMessageResponse) => void): grpc.ClientUnaryCall;
    verifyMessage(request: lnd_rpc_pb.VerifyMessageRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: lnd_rpc_pb.VerifyMessageResponse) => void): grpc.ClientUnaryCall;
    connectPeer(request: lnd_rpc_pb.ConnectPeerRequest, callback: (error: grpc.ServiceError | null, response: lnd_rpc_pb.ConnectPeerResponse) => void): grpc.ClientUnaryCall;
    connectPeer(request: lnd_rpc_pb.ConnectPeerRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: lnd_rpc_pb.ConnectPeerResponse) => void): grpc.ClientUnaryCall;
    connectPeer(request: lnd_rpc_pb.ConnectPeerRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: lnd_rpc_pb.ConnectPeerResponse) => void): grpc.ClientUnaryCall;
    disconnectPeer(request: lnd_rpc_pb.DisconnectPeerRequest, callback: (error: grpc.ServiceError | null, response: lnd_rpc_pb.DisconnectPeerResponse) => void): grpc.ClientUnaryCall;
    disconnectPeer(request: lnd_rpc_pb.DisconnectPeerRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: lnd_rpc_pb.DisconnectPeerResponse) => void): grpc.ClientUnaryCall;
    disconnectPeer(request: lnd_rpc_pb.DisconnectPeerRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: lnd_rpc_pb.DisconnectPeerResponse) => void): grpc.ClientUnaryCall;
    listPeers(request: lnd_rpc_pb.ListPeersRequest, callback: (error: grpc.ServiceError | null, response: lnd_rpc_pb.ListPeersResponse) => void): grpc.ClientUnaryCall;
    listPeers(request: lnd_rpc_pb.ListPeersRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: lnd_rpc_pb.ListPeersResponse) => void): grpc.ClientUnaryCall;
    listPeers(request: lnd_rpc_pb.ListPeersRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: lnd_rpc_pb.ListPeersResponse) => void): grpc.ClientUnaryCall;
    subscribePeerEvents(request: lnd_rpc_pb.PeerEventSubscription, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<lnd_rpc_pb.PeerEvent>;
    subscribePeerEvents(request: lnd_rpc_pb.PeerEventSubscription, metadata?: grpc.Metadata, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<lnd_rpc_pb.PeerEvent>;
    getInfo(request: lnd_rpc_pb.GetInfoRequest, callback: (error: grpc.ServiceError | null, response: lnd_rpc_pb.GetInfoResponse) => void): grpc.ClientUnaryCall;
    getInfo(request: lnd_rpc_pb.GetInfoRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: lnd_rpc_pb.GetInfoResponse) => void): grpc.ClientUnaryCall;
    getInfo(request: lnd_rpc_pb.GetInfoRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: lnd_rpc_pb.GetInfoResponse) => void): grpc.ClientUnaryCall;
    getRecoveryInfo(request: lnd_rpc_pb.GetRecoveryInfoRequest, callback: (error: grpc.ServiceError | null, response: lnd_rpc_pb.GetRecoveryInfoResponse) => void): grpc.ClientUnaryCall;
    getRecoveryInfo(request: lnd_rpc_pb.GetRecoveryInfoRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: lnd_rpc_pb.GetRecoveryInfoResponse) => void): grpc.ClientUnaryCall;
    getRecoveryInfo(request: lnd_rpc_pb.GetRecoveryInfoRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: lnd_rpc_pb.GetRecoveryInfoResponse) => void): grpc.ClientUnaryCall;
    pendingChannels(request: lnd_rpc_pb.PendingChannelsRequest, callback: (error: grpc.ServiceError | null, response: lnd_rpc_pb.PendingChannelsResponse) => void): grpc.ClientUnaryCall;
    pendingChannels(request: lnd_rpc_pb.PendingChannelsRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: lnd_rpc_pb.PendingChannelsResponse) => void): grpc.ClientUnaryCall;
    pendingChannels(request: lnd_rpc_pb.PendingChannelsRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: lnd_rpc_pb.PendingChannelsResponse) => void): grpc.ClientUnaryCall;
    listChannels(request: lnd_rpc_pb.ListChannelsRequest, callback: (error: grpc.ServiceError | null, response: lnd_rpc_pb.ListChannelsResponse) => void): grpc.ClientUnaryCall;
    listChannels(request: lnd_rpc_pb.ListChannelsRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: lnd_rpc_pb.ListChannelsResponse) => void): grpc.ClientUnaryCall;
    listChannels(request: lnd_rpc_pb.ListChannelsRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: lnd_rpc_pb.ListChannelsResponse) => void): grpc.ClientUnaryCall;
    subscribeChannelEvents(request: lnd_rpc_pb.ChannelEventSubscription, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<lnd_rpc_pb.ChannelEventUpdate>;
    subscribeChannelEvents(request: lnd_rpc_pb.ChannelEventSubscription, metadata?: grpc.Metadata, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<lnd_rpc_pb.ChannelEventUpdate>;
    closedChannels(request: lnd_rpc_pb.ClosedChannelsRequest, callback: (error: grpc.ServiceError | null, response: lnd_rpc_pb.ClosedChannelsResponse) => void): grpc.ClientUnaryCall;
    closedChannels(request: lnd_rpc_pb.ClosedChannelsRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: lnd_rpc_pb.ClosedChannelsResponse) => void): grpc.ClientUnaryCall;
    closedChannels(request: lnd_rpc_pb.ClosedChannelsRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: lnd_rpc_pb.ClosedChannelsResponse) => void): grpc.ClientUnaryCall;
    openChannelSync(request: lnd_rpc_pb.OpenChannelRequest, callback: (error: grpc.ServiceError | null, response: lnd_rpc_pb.ChannelPoint) => void): grpc.ClientUnaryCall;
    openChannelSync(request: lnd_rpc_pb.OpenChannelRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: lnd_rpc_pb.ChannelPoint) => void): grpc.ClientUnaryCall;
    openChannelSync(request: lnd_rpc_pb.OpenChannelRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: lnd_rpc_pb.ChannelPoint) => void): grpc.ClientUnaryCall;
    openChannel(request: lnd_rpc_pb.OpenChannelRequest, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<lnd_rpc_pb.OpenStatusUpdate>;
    openChannel(request: lnd_rpc_pb.OpenChannelRequest, metadata?: grpc.Metadata, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<lnd_rpc_pb.OpenStatusUpdate>;
    fundingStateStep(request: lnd_rpc_pb.FundingTransitionMsg, callback: (error: grpc.ServiceError | null, response: lnd_rpc_pb.FundingStateStepResp) => void): grpc.ClientUnaryCall;
    fundingStateStep(request: lnd_rpc_pb.FundingTransitionMsg, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: lnd_rpc_pb.FundingStateStepResp) => void): grpc.ClientUnaryCall;
    fundingStateStep(request: lnd_rpc_pb.FundingTransitionMsg, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: lnd_rpc_pb.FundingStateStepResp) => void): grpc.ClientUnaryCall;
    channelAcceptor(): grpc.ClientDuplexStream<lnd_rpc_pb.ChannelAcceptResponse, lnd_rpc_pb.ChannelAcceptRequest>;
    channelAcceptor(options: Partial<grpc.CallOptions>): grpc.ClientDuplexStream<lnd_rpc_pb.ChannelAcceptResponse, lnd_rpc_pb.ChannelAcceptRequest>;
    channelAcceptor(metadata: grpc.Metadata, options?: Partial<grpc.CallOptions>): grpc.ClientDuplexStream<lnd_rpc_pb.ChannelAcceptResponse, lnd_rpc_pb.ChannelAcceptRequest>;
    closeChannel(request: lnd_rpc_pb.CloseChannelRequest, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<lnd_rpc_pb.CloseStatusUpdate>;
    closeChannel(request: lnd_rpc_pb.CloseChannelRequest, metadata?: grpc.Metadata, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<lnd_rpc_pb.CloseStatusUpdate>;
    abandonChannel(request: lnd_rpc_pb.AbandonChannelRequest, callback: (error: grpc.ServiceError | null, response: lnd_rpc_pb.AbandonChannelResponse) => void): grpc.ClientUnaryCall;
    abandonChannel(request: lnd_rpc_pb.AbandonChannelRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: lnd_rpc_pb.AbandonChannelResponse) => void): grpc.ClientUnaryCall;
    abandonChannel(request: lnd_rpc_pb.AbandonChannelRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: lnd_rpc_pb.AbandonChannelResponse) => void): grpc.ClientUnaryCall;
    sendPayment(): grpc.ClientDuplexStream<lnd_rpc_pb.SendRequest, lnd_rpc_pb.SendResponse>;
    sendPayment(options: Partial<grpc.CallOptions>): grpc.ClientDuplexStream<lnd_rpc_pb.SendRequest, lnd_rpc_pb.SendResponse>;
    sendPayment(metadata: grpc.Metadata, options?: Partial<grpc.CallOptions>): grpc.ClientDuplexStream<lnd_rpc_pb.SendRequest, lnd_rpc_pb.SendResponse>;
    sendPaymentSync(request: lnd_rpc_pb.SendRequest, callback: (error: grpc.ServiceError | null, response: lnd_rpc_pb.SendResponse) => void): grpc.ClientUnaryCall;
    sendPaymentSync(request: lnd_rpc_pb.SendRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: lnd_rpc_pb.SendResponse) => void): grpc.ClientUnaryCall;
    sendPaymentSync(request: lnd_rpc_pb.SendRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: lnd_rpc_pb.SendResponse) => void): grpc.ClientUnaryCall;
    sendToRoute(): grpc.ClientDuplexStream<lnd_rpc_pb.SendToRouteRequest, lnd_rpc_pb.SendResponse>;
    sendToRoute(options: Partial<grpc.CallOptions>): grpc.ClientDuplexStream<lnd_rpc_pb.SendToRouteRequest, lnd_rpc_pb.SendResponse>;
    sendToRoute(metadata: grpc.Metadata, options?: Partial<grpc.CallOptions>): grpc.ClientDuplexStream<lnd_rpc_pb.SendToRouteRequest, lnd_rpc_pb.SendResponse>;
    sendToRouteSync(request: lnd_rpc_pb.SendToRouteRequest, callback: (error: grpc.ServiceError | null, response: lnd_rpc_pb.SendResponse) => void): grpc.ClientUnaryCall;
    sendToRouteSync(request: lnd_rpc_pb.SendToRouteRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: lnd_rpc_pb.SendResponse) => void): grpc.ClientUnaryCall;
    sendToRouteSync(request: lnd_rpc_pb.SendToRouteRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: lnd_rpc_pb.SendResponse) => void): grpc.ClientUnaryCall;
    addInvoice(request: lnd_rpc_pb.Invoice, callback: (error: grpc.ServiceError | null, response: lnd_rpc_pb.AddInvoiceResponse) => void): grpc.ClientUnaryCall;
    addInvoice(request: lnd_rpc_pb.Invoice, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: lnd_rpc_pb.AddInvoiceResponse) => void): grpc.ClientUnaryCall;
    addInvoice(request: lnd_rpc_pb.Invoice, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: lnd_rpc_pb.AddInvoiceResponse) => void): grpc.ClientUnaryCall;
    listInvoices(request: lnd_rpc_pb.ListInvoiceRequest, callback: (error: grpc.ServiceError | null, response: lnd_rpc_pb.ListInvoiceResponse) => void): grpc.ClientUnaryCall;
    listInvoices(request: lnd_rpc_pb.ListInvoiceRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: lnd_rpc_pb.ListInvoiceResponse) => void): grpc.ClientUnaryCall;
    listInvoices(request: lnd_rpc_pb.ListInvoiceRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: lnd_rpc_pb.ListInvoiceResponse) => void): grpc.ClientUnaryCall;
    lookupInvoice(request: lnd_rpc_pb.PaymentHash, callback: (error: grpc.ServiceError | null, response: lnd_rpc_pb.Invoice) => void): grpc.ClientUnaryCall;
    lookupInvoice(request: lnd_rpc_pb.PaymentHash, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: lnd_rpc_pb.Invoice) => void): grpc.ClientUnaryCall;
    lookupInvoice(request: lnd_rpc_pb.PaymentHash, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: lnd_rpc_pb.Invoice) => void): grpc.ClientUnaryCall;
    subscribeInvoices(request: lnd_rpc_pb.InvoiceSubscription, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<lnd_rpc_pb.Invoice>;
    subscribeInvoices(request: lnd_rpc_pb.InvoiceSubscription, metadata?: grpc.Metadata, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<lnd_rpc_pb.Invoice>;
    decodePayReq(request: lnd_rpc_pb.PayReqString, callback: (error: grpc.ServiceError | null, response: lnd_rpc_pb.PayReq) => void): grpc.ClientUnaryCall;
    decodePayReq(request: lnd_rpc_pb.PayReqString, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: lnd_rpc_pb.PayReq) => void): grpc.ClientUnaryCall;
    decodePayReq(request: lnd_rpc_pb.PayReqString, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: lnd_rpc_pb.PayReq) => void): grpc.ClientUnaryCall;
    listPayments(request: lnd_rpc_pb.ListPaymentsRequest, callback: (error: grpc.ServiceError | null, response: lnd_rpc_pb.ListPaymentsResponse) => void): grpc.ClientUnaryCall;
    listPayments(request: lnd_rpc_pb.ListPaymentsRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: lnd_rpc_pb.ListPaymentsResponse) => void): grpc.ClientUnaryCall;
    listPayments(request: lnd_rpc_pb.ListPaymentsRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: lnd_rpc_pb.ListPaymentsResponse) => void): grpc.ClientUnaryCall;
    deleteAllPayments(request: lnd_rpc_pb.DeleteAllPaymentsRequest, callback: (error: grpc.ServiceError | null, response: lnd_rpc_pb.DeleteAllPaymentsResponse) => void): grpc.ClientUnaryCall;
    deleteAllPayments(request: lnd_rpc_pb.DeleteAllPaymentsRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: lnd_rpc_pb.DeleteAllPaymentsResponse) => void): grpc.ClientUnaryCall;
    deleteAllPayments(request: lnd_rpc_pb.DeleteAllPaymentsRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: lnd_rpc_pb.DeleteAllPaymentsResponse) => void): grpc.ClientUnaryCall;
    describeGraph(request: lnd_rpc_pb.ChannelGraphRequest, callback: (error: grpc.ServiceError | null, response: lnd_rpc_pb.ChannelGraph) => void): grpc.ClientUnaryCall;
    describeGraph(request: lnd_rpc_pb.ChannelGraphRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: lnd_rpc_pb.ChannelGraph) => void): grpc.ClientUnaryCall;
    describeGraph(request: lnd_rpc_pb.ChannelGraphRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: lnd_rpc_pb.ChannelGraph) => void): grpc.ClientUnaryCall;
    getNodeMetrics(request: lnd_rpc_pb.NodeMetricsRequest, callback: (error: grpc.ServiceError | null, response: lnd_rpc_pb.NodeMetricsResponse) => void): grpc.ClientUnaryCall;
    getNodeMetrics(request: lnd_rpc_pb.NodeMetricsRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: lnd_rpc_pb.NodeMetricsResponse) => void): grpc.ClientUnaryCall;
    getNodeMetrics(request: lnd_rpc_pb.NodeMetricsRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: lnd_rpc_pb.NodeMetricsResponse) => void): grpc.ClientUnaryCall;
    getChanInfo(request: lnd_rpc_pb.ChanInfoRequest, callback: (error: grpc.ServiceError | null, response: lnd_rpc_pb.ChannelEdge) => void): grpc.ClientUnaryCall;
    getChanInfo(request: lnd_rpc_pb.ChanInfoRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: lnd_rpc_pb.ChannelEdge) => void): grpc.ClientUnaryCall;
    getChanInfo(request: lnd_rpc_pb.ChanInfoRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: lnd_rpc_pb.ChannelEdge) => void): grpc.ClientUnaryCall;
    getNodeInfo(request: lnd_rpc_pb.NodeInfoRequest, callback: (error: grpc.ServiceError | null, response: lnd_rpc_pb.NodeInfo) => void): grpc.ClientUnaryCall;
    getNodeInfo(request: lnd_rpc_pb.NodeInfoRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: lnd_rpc_pb.NodeInfo) => void): grpc.ClientUnaryCall;
    getNodeInfo(request: lnd_rpc_pb.NodeInfoRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: lnd_rpc_pb.NodeInfo) => void): grpc.ClientUnaryCall;
    queryRoutes(request: lnd_rpc_pb.QueryRoutesRequest, callback: (error: grpc.ServiceError | null, response: lnd_rpc_pb.QueryRoutesResponse) => void): grpc.ClientUnaryCall;
    queryRoutes(request: lnd_rpc_pb.QueryRoutesRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: lnd_rpc_pb.QueryRoutesResponse) => void): grpc.ClientUnaryCall;
    queryRoutes(request: lnd_rpc_pb.QueryRoutesRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: lnd_rpc_pb.QueryRoutesResponse) => void): grpc.ClientUnaryCall;
    getNetworkInfo(request: lnd_rpc_pb.NetworkInfoRequest, callback: (error: grpc.ServiceError | null, response: lnd_rpc_pb.NetworkInfo) => void): grpc.ClientUnaryCall;
    getNetworkInfo(request: lnd_rpc_pb.NetworkInfoRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: lnd_rpc_pb.NetworkInfo) => void): grpc.ClientUnaryCall;
    getNetworkInfo(request: lnd_rpc_pb.NetworkInfoRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: lnd_rpc_pb.NetworkInfo) => void): grpc.ClientUnaryCall;
    stopDaemon(request: lnd_rpc_pb.StopRequest, callback: (error: grpc.ServiceError | null, response: lnd_rpc_pb.StopResponse) => void): grpc.ClientUnaryCall;
    stopDaemon(request: lnd_rpc_pb.StopRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: lnd_rpc_pb.StopResponse) => void): grpc.ClientUnaryCall;
    stopDaemon(request: lnd_rpc_pb.StopRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: lnd_rpc_pb.StopResponse) => void): grpc.ClientUnaryCall;
    subscribeChannelGraph(request: lnd_rpc_pb.GraphTopologySubscription, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<lnd_rpc_pb.GraphTopologyUpdate>;
    subscribeChannelGraph(request: lnd_rpc_pb.GraphTopologySubscription, metadata?: grpc.Metadata, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<lnd_rpc_pb.GraphTopologyUpdate>;
    debugLevel(request: lnd_rpc_pb.DebugLevelRequest, callback: (error: grpc.ServiceError | null, response: lnd_rpc_pb.DebugLevelResponse) => void): grpc.ClientUnaryCall;
    debugLevel(request: lnd_rpc_pb.DebugLevelRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: lnd_rpc_pb.DebugLevelResponse) => void): grpc.ClientUnaryCall;
    debugLevel(request: lnd_rpc_pb.DebugLevelRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: lnd_rpc_pb.DebugLevelResponse) => void): grpc.ClientUnaryCall;
    feeReport(request: lnd_rpc_pb.FeeReportRequest, callback: (error: grpc.ServiceError | null, response: lnd_rpc_pb.FeeReportResponse) => void): grpc.ClientUnaryCall;
    feeReport(request: lnd_rpc_pb.FeeReportRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: lnd_rpc_pb.FeeReportResponse) => void): grpc.ClientUnaryCall;
    feeReport(request: lnd_rpc_pb.FeeReportRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: lnd_rpc_pb.FeeReportResponse) => void): grpc.ClientUnaryCall;
    updateChannelPolicy(request: lnd_rpc_pb.PolicyUpdateRequest, callback: (error: grpc.ServiceError | null, response: lnd_rpc_pb.PolicyUpdateResponse) => void): grpc.ClientUnaryCall;
    updateChannelPolicy(request: lnd_rpc_pb.PolicyUpdateRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: lnd_rpc_pb.PolicyUpdateResponse) => void): grpc.ClientUnaryCall;
    updateChannelPolicy(request: lnd_rpc_pb.PolicyUpdateRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: lnd_rpc_pb.PolicyUpdateResponse) => void): grpc.ClientUnaryCall;
    forwardingHistory(request: lnd_rpc_pb.ForwardingHistoryRequest, callback: (error: grpc.ServiceError | null, response: lnd_rpc_pb.ForwardingHistoryResponse) => void): grpc.ClientUnaryCall;
    forwardingHistory(request: lnd_rpc_pb.ForwardingHistoryRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: lnd_rpc_pb.ForwardingHistoryResponse) => void): grpc.ClientUnaryCall;
    forwardingHistory(request: lnd_rpc_pb.ForwardingHistoryRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: lnd_rpc_pb.ForwardingHistoryResponse) => void): grpc.ClientUnaryCall;
    exportChannelBackup(request: lnd_rpc_pb.ExportChannelBackupRequest, callback: (error: grpc.ServiceError | null, response: lnd_rpc_pb.ChannelBackup) => void): grpc.ClientUnaryCall;
    exportChannelBackup(request: lnd_rpc_pb.ExportChannelBackupRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: lnd_rpc_pb.ChannelBackup) => void): grpc.ClientUnaryCall;
    exportChannelBackup(request: lnd_rpc_pb.ExportChannelBackupRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: lnd_rpc_pb.ChannelBackup) => void): grpc.ClientUnaryCall;
    exportAllChannelBackups(request: lnd_rpc_pb.ChanBackupExportRequest, callback: (error: grpc.ServiceError | null, response: lnd_rpc_pb.ChanBackupSnapshot) => void): grpc.ClientUnaryCall;
    exportAllChannelBackups(request: lnd_rpc_pb.ChanBackupExportRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: lnd_rpc_pb.ChanBackupSnapshot) => void): grpc.ClientUnaryCall;
    exportAllChannelBackups(request: lnd_rpc_pb.ChanBackupExportRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: lnd_rpc_pb.ChanBackupSnapshot) => void): grpc.ClientUnaryCall;
    verifyChanBackup(request: lnd_rpc_pb.ChanBackupSnapshot, callback: (error: grpc.ServiceError | null, response: lnd_rpc_pb.VerifyChanBackupResponse) => void): grpc.ClientUnaryCall;
    verifyChanBackup(request: lnd_rpc_pb.ChanBackupSnapshot, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: lnd_rpc_pb.VerifyChanBackupResponse) => void): grpc.ClientUnaryCall;
    verifyChanBackup(request: lnd_rpc_pb.ChanBackupSnapshot, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: lnd_rpc_pb.VerifyChanBackupResponse) => void): grpc.ClientUnaryCall;
    restoreChannelBackups(request: lnd_rpc_pb.RestoreChanBackupRequest, callback: (error: grpc.ServiceError | null, response: lnd_rpc_pb.RestoreBackupResponse) => void): grpc.ClientUnaryCall;
    restoreChannelBackups(request: lnd_rpc_pb.RestoreChanBackupRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: lnd_rpc_pb.RestoreBackupResponse) => void): grpc.ClientUnaryCall;
    restoreChannelBackups(request: lnd_rpc_pb.RestoreChanBackupRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: lnd_rpc_pb.RestoreBackupResponse) => void): grpc.ClientUnaryCall;
    subscribeChannelBackups(request: lnd_rpc_pb.ChannelBackupSubscription, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<lnd_rpc_pb.ChanBackupSnapshot>;
    subscribeChannelBackups(request: lnd_rpc_pb.ChannelBackupSubscription, metadata?: grpc.Metadata, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<lnd_rpc_pb.ChanBackupSnapshot>;
    bakeMacaroon(request: lnd_rpc_pb.BakeMacaroonRequest, callback: (error: grpc.ServiceError | null, response: lnd_rpc_pb.BakeMacaroonResponse) => void): grpc.ClientUnaryCall;
    bakeMacaroon(request: lnd_rpc_pb.BakeMacaroonRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: lnd_rpc_pb.BakeMacaroonResponse) => void): grpc.ClientUnaryCall;
    bakeMacaroon(request: lnd_rpc_pb.BakeMacaroonRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: lnd_rpc_pb.BakeMacaroonResponse) => void): grpc.ClientUnaryCall;
    listPermissions(request: lnd_rpc_pb.ListPermissionsRequest, callback: (error: grpc.ServiceError | null, response: lnd_rpc_pb.ListPermissionsResponse) => void): grpc.ClientUnaryCall;
    listPermissions(request: lnd_rpc_pb.ListPermissionsRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: lnd_rpc_pb.ListPermissionsResponse) => void): grpc.ClientUnaryCall;
    listPermissions(request: lnd_rpc_pb.ListPermissionsRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: lnd_rpc_pb.ListPermissionsResponse) => void): grpc.ClientUnaryCall;
}

export class LightningClient extends grpc.Client implements ILightningClient {
    constructor(address: string, credentials: grpc.ChannelCredentials, options?: object);
    public walletBalance(request: lnd_rpc_pb.WalletBalanceRequest, callback: (error: grpc.ServiceError | null, response: lnd_rpc_pb.WalletBalanceResponse) => void): grpc.ClientUnaryCall;
    public walletBalance(request: lnd_rpc_pb.WalletBalanceRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: lnd_rpc_pb.WalletBalanceResponse) => void): grpc.ClientUnaryCall;
    public walletBalance(request: lnd_rpc_pb.WalletBalanceRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: lnd_rpc_pb.WalletBalanceResponse) => void): grpc.ClientUnaryCall;
    public channelBalance(request: lnd_rpc_pb.ChannelBalanceRequest, callback: (error: grpc.ServiceError | null, response: lnd_rpc_pb.ChannelBalanceResponse) => void): grpc.ClientUnaryCall;
    public channelBalance(request: lnd_rpc_pb.ChannelBalanceRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: lnd_rpc_pb.ChannelBalanceResponse) => void): grpc.ClientUnaryCall;
    public channelBalance(request: lnd_rpc_pb.ChannelBalanceRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: lnd_rpc_pb.ChannelBalanceResponse) => void): grpc.ClientUnaryCall;
    public getTransactions(request: lnd_rpc_pb.GetTransactionsRequest, callback: (error: grpc.ServiceError | null, response: lnd_rpc_pb.TransactionDetails) => void): grpc.ClientUnaryCall;
    public getTransactions(request: lnd_rpc_pb.GetTransactionsRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: lnd_rpc_pb.TransactionDetails) => void): grpc.ClientUnaryCall;
    public getTransactions(request: lnd_rpc_pb.GetTransactionsRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: lnd_rpc_pb.TransactionDetails) => void): grpc.ClientUnaryCall;
    public estimateFee(request: lnd_rpc_pb.EstimateFeeRequest, callback: (error: grpc.ServiceError | null, response: lnd_rpc_pb.EstimateFeeResponse) => void): grpc.ClientUnaryCall;
    public estimateFee(request: lnd_rpc_pb.EstimateFeeRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: lnd_rpc_pb.EstimateFeeResponse) => void): grpc.ClientUnaryCall;
    public estimateFee(request: lnd_rpc_pb.EstimateFeeRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: lnd_rpc_pb.EstimateFeeResponse) => void): grpc.ClientUnaryCall;
    public sendCoins(request: lnd_rpc_pb.SendCoinsRequest, callback: (error: grpc.ServiceError | null, response: lnd_rpc_pb.SendCoinsResponse) => void): grpc.ClientUnaryCall;
    public sendCoins(request: lnd_rpc_pb.SendCoinsRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: lnd_rpc_pb.SendCoinsResponse) => void): grpc.ClientUnaryCall;
    public sendCoins(request: lnd_rpc_pb.SendCoinsRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: lnd_rpc_pb.SendCoinsResponse) => void): grpc.ClientUnaryCall;
    public listUnspent(request: lnd_rpc_pb.ListUnspentRequest, callback: (error: grpc.ServiceError | null, response: lnd_rpc_pb.ListUnspentResponse) => void): grpc.ClientUnaryCall;
    public listUnspent(request: lnd_rpc_pb.ListUnspentRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: lnd_rpc_pb.ListUnspentResponse) => void): grpc.ClientUnaryCall;
    public listUnspent(request: lnd_rpc_pb.ListUnspentRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: lnd_rpc_pb.ListUnspentResponse) => void): grpc.ClientUnaryCall;
    public subscribeTransactions(request: lnd_rpc_pb.GetTransactionsRequest, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<lnd_rpc_pb.Transaction>;
    public subscribeTransactions(request: lnd_rpc_pb.GetTransactionsRequest, metadata?: grpc.Metadata, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<lnd_rpc_pb.Transaction>;
    public sendMany(request: lnd_rpc_pb.SendManyRequest, callback: (error: grpc.ServiceError | null, response: lnd_rpc_pb.SendManyResponse) => void): grpc.ClientUnaryCall;
    public sendMany(request: lnd_rpc_pb.SendManyRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: lnd_rpc_pb.SendManyResponse) => void): grpc.ClientUnaryCall;
    public sendMany(request: lnd_rpc_pb.SendManyRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: lnd_rpc_pb.SendManyResponse) => void): grpc.ClientUnaryCall;
    public newAddress(request: lnd_rpc_pb.NewAddressRequest, callback: (error: grpc.ServiceError | null, response: lnd_rpc_pb.NewAddressResponse) => void): grpc.ClientUnaryCall;
    public newAddress(request: lnd_rpc_pb.NewAddressRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: lnd_rpc_pb.NewAddressResponse) => void): grpc.ClientUnaryCall;
    public newAddress(request: lnd_rpc_pb.NewAddressRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: lnd_rpc_pb.NewAddressResponse) => void): grpc.ClientUnaryCall;
    public signMessage(request: lnd_rpc_pb.SignMessageRequest, callback: (error: grpc.ServiceError | null, response: lnd_rpc_pb.SignMessageResponse) => void): grpc.ClientUnaryCall;
    public signMessage(request: lnd_rpc_pb.SignMessageRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: lnd_rpc_pb.SignMessageResponse) => void): grpc.ClientUnaryCall;
    public signMessage(request: lnd_rpc_pb.SignMessageRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: lnd_rpc_pb.SignMessageResponse) => void): grpc.ClientUnaryCall;
    public verifyMessage(request: lnd_rpc_pb.VerifyMessageRequest, callback: (error: grpc.ServiceError | null, response: lnd_rpc_pb.VerifyMessageResponse) => void): grpc.ClientUnaryCall;
    public verifyMessage(request: lnd_rpc_pb.VerifyMessageRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: lnd_rpc_pb.VerifyMessageResponse) => void): grpc.ClientUnaryCall;
    public verifyMessage(request: lnd_rpc_pb.VerifyMessageRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: lnd_rpc_pb.VerifyMessageResponse) => void): grpc.ClientUnaryCall;
    public connectPeer(request: lnd_rpc_pb.ConnectPeerRequest, callback: (error: grpc.ServiceError | null, response: lnd_rpc_pb.ConnectPeerResponse) => void): grpc.ClientUnaryCall;
    public connectPeer(request: lnd_rpc_pb.ConnectPeerRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: lnd_rpc_pb.ConnectPeerResponse) => void): grpc.ClientUnaryCall;
    public connectPeer(request: lnd_rpc_pb.ConnectPeerRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: lnd_rpc_pb.ConnectPeerResponse) => void): grpc.ClientUnaryCall;
    public disconnectPeer(request: lnd_rpc_pb.DisconnectPeerRequest, callback: (error: grpc.ServiceError | null, response: lnd_rpc_pb.DisconnectPeerResponse) => void): grpc.ClientUnaryCall;
    public disconnectPeer(request: lnd_rpc_pb.DisconnectPeerRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: lnd_rpc_pb.DisconnectPeerResponse) => void): grpc.ClientUnaryCall;
    public disconnectPeer(request: lnd_rpc_pb.DisconnectPeerRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: lnd_rpc_pb.DisconnectPeerResponse) => void): grpc.ClientUnaryCall;
    public listPeers(request: lnd_rpc_pb.ListPeersRequest, callback: (error: grpc.ServiceError | null, response: lnd_rpc_pb.ListPeersResponse) => void): grpc.ClientUnaryCall;
    public listPeers(request: lnd_rpc_pb.ListPeersRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: lnd_rpc_pb.ListPeersResponse) => void): grpc.ClientUnaryCall;
    public listPeers(request: lnd_rpc_pb.ListPeersRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: lnd_rpc_pb.ListPeersResponse) => void): grpc.ClientUnaryCall;
    public subscribePeerEvents(request: lnd_rpc_pb.PeerEventSubscription, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<lnd_rpc_pb.PeerEvent>;
    public subscribePeerEvents(request: lnd_rpc_pb.PeerEventSubscription, metadata?: grpc.Metadata, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<lnd_rpc_pb.PeerEvent>;
    public getInfo(request: lnd_rpc_pb.GetInfoRequest, callback: (error: grpc.ServiceError | null, response: lnd_rpc_pb.GetInfoResponse) => void): grpc.ClientUnaryCall;
    public getInfo(request: lnd_rpc_pb.GetInfoRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: lnd_rpc_pb.GetInfoResponse) => void): grpc.ClientUnaryCall;
    public getInfo(request: lnd_rpc_pb.GetInfoRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: lnd_rpc_pb.GetInfoResponse) => void): grpc.ClientUnaryCall;
    public getRecoveryInfo(request: lnd_rpc_pb.GetRecoveryInfoRequest, callback: (error: grpc.ServiceError | null, response: lnd_rpc_pb.GetRecoveryInfoResponse) => void): grpc.ClientUnaryCall;
    public getRecoveryInfo(request: lnd_rpc_pb.GetRecoveryInfoRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: lnd_rpc_pb.GetRecoveryInfoResponse) => void): grpc.ClientUnaryCall;
    public getRecoveryInfo(request: lnd_rpc_pb.GetRecoveryInfoRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: lnd_rpc_pb.GetRecoveryInfoResponse) => void): grpc.ClientUnaryCall;
    public pendingChannels(request: lnd_rpc_pb.PendingChannelsRequest, callback: (error: grpc.ServiceError | null, response: lnd_rpc_pb.PendingChannelsResponse) => void): grpc.ClientUnaryCall;
    public pendingChannels(request: lnd_rpc_pb.PendingChannelsRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: lnd_rpc_pb.PendingChannelsResponse) => void): grpc.ClientUnaryCall;
    public pendingChannels(request: lnd_rpc_pb.PendingChannelsRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: lnd_rpc_pb.PendingChannelsResponse) => void): grpc.ClientUnaryCall;
    public listChannels(request: lnd_rpc_pb.ListChannelsRequest, callback: (error: grpc.ServiceError | null, response: lnd_rpc_pb.ListChannelsResponse) => void): grpc.ClientUnaryCall;
    public listChannels(request: lnd_rpc_pb.ListChannelsRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: lnd_rpc_pb.ListChannelsResponse) => void): grpc.ClientUnaryCall;
    public listChannels(request: lnd_rpc_pb.ListChannelsRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: lnd_rpc_pb.ListChannelsResponse) => void): grpc.ClientUnaryCall;
    public subscribeChannelEvents(request: lnd_rpc_pb.ChannelEventSubscription, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<lnd_rpc_pb.ChannelEventUpdate>;
    public subscribeChannelEvents(request: lnd_rpc_pb.ChannelEventSubscription, metadata?: grpc.Metadata, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<lnd_rpc_pb.ChannelEventUpdate>;
    public closedChannels(request: lnd_rpc_pb.ClosedChannelsRequest, callback: (error: grpc.ServiceError | null, response: lnd_rpc_pb.ClosedChannelsResponse) => void): grpc.ClientUnaryCall;
    public closedChannels(request: lnd_rpc_pb.ClosedChannelsRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: lnd_rpc_pb.ClosedChannelsResponse) => void): grpc.ClientUnaryCall;
    public closedChannels(request: lnd_rpc_pb.ClosedChannelsRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: lnd_rpc_pb.ClosedChannelsResponse) => void): grpc.ClientUnaryCall;
    public openChannelSync(request: lnd_rpc_pb.OpenChannelRequest, callback: (error: grpc.ServiceError | null, response: lnd_rpc_pb.ChannelPoint) => void): grpc.ClientUnaryCall;
    public openChannelSync(request: lnd_rpc_pb.OpenChannelRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: lnd_rpc_pb.ChannelPoint) => void): grpc.ClientUnaryCall;
    public openChannelSync(request: lnd_rpc_pb.OpenChannelRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: lnd_rpc_pb.ChannelPoint) => void): grpc.ClientUnaryCall;
    public openChannel(request: lnd_rpc_pb.OpenChannelRequest, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<lnd_rpc_pb.OpenStatusUpdate>;
    public openChannel(request: lnd_rpc_pb.OpenChannelRequest, metadata?: grpc.Metadata, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<lnd_rpc_pb.OpenStatusUpdate>;
    public fundingStateStep(request: lnd_rpc_pb.FundingTransitionMsg, callback: (error: grpc.ServiceError | null, response: lnd_rpc_pb.FundingStateStepResp) => void): grpc.ClientUnaryCall;
    public fundingStateStep(request: lnd_rpc_pb.FundingTransitionMsg, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: lnd_rpc_pb.FundingStateStepResp) => void): grpc.ClientUnaryCall;
    public fundingStateStep(request: lnd_rpc_pb.FundingTransitionMsg, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: lnd_rpc_pb.FundingStateStepResp) => void): grpc.ClientUnaryCall;
    public channelAcceptor(options?: Partial<grpc.CallOptions>): grpc.ClientDuplexStream<lnd_rpc_pb.ChannelAcceptResponse, lnd_rpc_pb.ChannelAcceptRequest>;
    public channelAcceptor(metadata?: grpc.Metadata, options?: Partial<grpc.CallOptions>): grpc.ClientDuplexStream<lnd_rpc_pb.ChannelAcceptResponse, lnd_rpc_pb.ChannelAcceptRequest>;
    public closeChannel(request: lnd_rpc_pb.CloseChannelRequest, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<lnd_rpc_pb.CloseStatusUpdate>;
    public closeChannel(request: lnd_rpc_pb.CloseChannelRequest, metadata?: grpc.Metadata, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<lnd_rpc_pb.CloseStatusUpdate>;
    public abandonChannel(request: lnd_rpc_pb.AbandonChannelRequest, callback: (error: grpc.ServiceError | null, response: lnd_rpc_pb.AbandonChannelResponse) => void): grpc.ClientUnaryCall;
    public abandonChannel(request: lnd_rpc_pb.AbandonChannelRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: lnd_rpc_pb.AbandonChannelResponse) => void): grpc.ClientUnaryCall;
    public abandonChannel(request: lnd_rpc_pb.AbandonChannelRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: lnd_rpc_pb.AbandonChannelResponse) => void): grpc.ClientUnaryCall;
    public sendPayment(options?: Partial<grpc.CallOptions>): grpc.ClientDuplexStream<lnd_rpc_pb.SendRequest, lnd_rpc_pb.SendResponse>;
    public sendPayment(metadata?: grpc.Metadata, options?: Partial<grpc.CallOptions>): grpc.ClientDuplexStream<lnd_rpc_pb.SendRequest, lnd_rpc_pb.SendResponse>;
    public sendPaymentSync(request: lnd_rpc_pb.SendRequest, callback: (error: grpc.ServiceError | null, response: lnd_rpc_pb.SendResponse) => void): grpc.ClientUnaryCall;
    public sendPaymentSync(request: lnd_rpc_pb.SendRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: lnd_rpc_pb.SendResponse) => void): grpc.ClientUnaryCall;
    public sendPaymentSync(request: lnd_rpc_pb.SendRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: lnd_rpc_pb.SendResponse) => void): grpc.ClientUnaryCall;
    public sendToRoute(options?: Partial<grpc.CallOptions>): grpc.ClientDuplexStream<lnd_rpc_pb.SendToRouteRequest, lnd_rpc_pb.SendResponse>;
    public sendToRoute(metadata?: grpc.Metadata, options?: Partial<grpc.CallOptions>): grpc.ClientDuplexStream<lnd_rpc_pb.SendToRouteRequest, lnd_rpc_pb.SendResponse>;
    public sendToRouteSync(request: lnd_rpc_pb.SendToRouteRequest, callback: (error: grpc.ServiceError | null, response: lnd_rpc_pb.SendResponse) => void): grpc.ClientUnaryCall;
    public sendToRouteSync(request: lnd_rpc_pb.SendToRouteRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: lnd_rpc_pb.SendResponse) => void): grpc.ClientUnaryCall;
    public sendToRouteSync(request: lnd_rpc_pb.SendToRouteRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: lnd_rpc_pb.SendResponse) => void): grpc.ClientUnaryCall;
    public addInvoice(request: lnd_rpc_pb.Invoice, callback: (error: grpc.ServiceError | null, response: lnd_rpc_pb.AddInvoiceResponse) => void): grpc.ClientUnaryCall;
    public addInvoice(request: lnd_rpc_pb.Invoice, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: lnd_rpc_pb.AddInvoiceResponse) => void): grpc.ClientUnaryCall;
    public addInvoice(request: lnd_rpc_pb.Invoice, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: lnd_rpc_pb.AddInvoiceResponse) => void): grpc.ClientUnaryCall;
    public listInvoices(request: lnd_rpc_pb.ListInvoiceRequest, callback: (error: grpc.ServiceError | null, response: lnd_rpc_pb.ListInvoiceResponse) => void): grpc.ClientUnaryCall;
    public listInvoices(request: lnd_rpc_pb.ListInvoiceRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: lnd_rpc_pb.ListInvoiceResponse) => void): grpc.ClientUnaryCall;
    public listInvoices(request: lnd_rpc_pb.ListInvoiceRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: lnd_rpc_pb.ListInvoiceResponse) => void): grpc.ClientUnaryCall;
    public lookupInvoice(request: lnd_rpc_pb.PaymentHash, callback: (error: grpc.ServiceError | null, response: lnd_rpc_pb.Invoice) => void): grpc.ClientUnaryCall;
    public lookupInvoice(request: lnd_rpc_pb.PaymentHash, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: lnd_rpc_pb.Invoice) => void): grpc.ClientUnaryCall;
    public lookupInvoice(request: lnd_rpc_pb.PaymentHash, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: lnd_rpc_pb.Invoice) => void): grpc.ClientUnaryCall;
    public subscribeInvoices(request: lnd_rpc_pb.InvoiceSubscription, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<lnd_rpc_pb.Invoice>;
    public subscribeInvoices(request: lnd_rpc_pb.InvoiceSubscription, metadata?: grpc.Metadata, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<lnd_rpc_pb.Invoice>;
    public decodePayReq(request: lnd_rpc_pb.PayReqString, callback: (error: grpc.ServiceError | null, response: lnd_rpc_pb.PayReq) => void): grpc.ClientUnaryCall;
    public decodePayReq(request: lnd_rpc_pb.PayReqString, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: lnd_rpc_pb.PayReq) => void): grpc.ClientUnaryCall;
    public decodePayReq(request: lnd_rpc_pb.PayReqString, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: lnd_rpc_pb.PayReq) => void): grpc.ClientUnaryCall;
    public listPayments(request: lnd_rpc_pb.ListPaymentsRequest, callback: (error: grpc.ServiceError | null, response: lnd_rpc_pb.ListPaymentsResponse) => void): grpc.ClientUnaryCall;
    public listPayments(request: lnd_rpc_pb.ListPaymentsRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: lnd_rpc_pb.ListPaymentsResponse) => void): grpc.ClientUnaryCall;
    public listPayments(request: lnd_rpc_pb.ListPaymentsRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: lnd_rpc_pb.ListPaymentsResponse) => void): grpc.ClientUnaryCall;
    public deleteAllPayments(request: lnd_rpc_pb.DeleteAllPaymentsRequest, callback: (error: grpc.ServiceError | null, response: lnd_rpc_pb.DeleteAllPaymentsResponse) => void): grpc.ClientUnaryCall;
    public deleteAllPayments(request: lnd_rpc_pb.DeleteAllPaymentsRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: lnd_rpc_pb.DeleteAllPaymentsResponse) => void): grpc.ClientUnaryCall;
    public deleteAllPayments(request: lnd_rpc_pb.DeleteAllPaymentsRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: lnd_rpc_pb.DeleteAllPaymentsResponse) => void): grpc.ClientUnaryCall;
    public describeGraph(request: lnd_rpc_pb.ChannelGraphRequest, callback: (error: grpc.ServiceError | null, response: lnd_rpc_pb.ChannelGraph) => void): grpc.ClientUnaryCall;
    public describeGraph(request: lnd_rpc_pb.ChannelGraphRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: lnd_rpc_pb.ChannelGraph) => void): grpc.ClientUnaryCall;
    public describeGraph(request: lnd_rpc_pb.ChannelGraphRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: lnd_rpc_pb.ChannelGraph) => void): grpc.ClientUnaryCall;
    public getNodeMetrics(request: lnd_rpc_pb.NodeMetricsRequest, callback: (error: grpc.ServiceError | null, response: lnd_rpc_pb.NodeMetricsResponse) => void): grpc.ClientUnaryCall;
    public getNodeMetrics(request: lnd_rpc_pb.NodeMetricsRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: lnd_rpc_pb.NodeMetricsResponse) => void): grpc.ClientUnaryCall;
    public getNodeMetrics(request: lnd_rpc_pb.NodeMetricsRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: lnd_rpc_pb.NodeMetricsResponse) => void): grpc.ClientUnaryCall;
    public getChanInfo(request: lnd_rpc_pb.ChanInfoRequest, callback: (error: grpc.ServiceError | null, response: lnd_rpc_pb.ChannelEdge) => void): grpc.ClientUnaryCall;
    public getChanInfo(request: lnd_rpc_pb.ChanInfoRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: lnd_rpc_pb.ChannelEdge) => void): grpc.ClientUnaryCall;
    public getChanInfo(request: lnd_rpc_pb.ChanInfoRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: lnd_rpc_pb.ChannelEdge) => void): grpc.ClientUnaryCall;
    public getNodeInfo(request: lnd_rpc_pb.NodeInfoRequest, callback: (error: grpc.ServiceError | null, response: lnd_rpc_pb.NodeInfo) => void): grpc.ClientUnaryCall;
    public getNodeInfo(request: lnd_rpc_pb.NodeInfoRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: lnd_rpc_pb.NodeInfo) => void): grpc.ClientUnaryCall;
    public getNodeInfo(request: lnd_rpc_pb.NodeInfoRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: lnd_rpc_pb.NodeInfo) => void): grpc.ClientUnaryCall;
    public queryRoutes(request: lnd_rpc_pb.QueryRoutesRequest, callback: (error: grpc.ServiceError | null, response: lnd_rpc_pb.QueryRoutesResponse) => void): grpc.ClientUnaryCall;
    public queryRoutes(request: lnd_rpc_pb.QueryRoutesRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: lnd_rpc_pb.QueryRoutesResponse) => void): grpc.ClientUnaryCall;
    public queryRoutes(request: lnd_rpc_pb.QueryRoutesRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: lnd_rpc_pb.QueryRoutesResponse) => void): grpc.ClientUnaryCall;
    public getNetworkInfo(request: lnd_rpc_pb.NetworkInfoRequest, callback: (error: grpc.ServiceError | null, response: lnd_rpc_pb.NetworkInfo) => void): grpc.ClientUnaryCall;
    public getNetworkInfo(request: lnd_rpc_pb.NetworkInfoRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: lnd_rpc_pb.NetworkInfo) => void): grpc.ClientUnaryCall;
    public getNetworkInfo(request: lnd_rpc_pb.NetworkInfoRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: lnd_rpc_pb.NetworkInfo) => void): grpc.ClientUnaryCall;
    public stopDaemon(request: lnd_rpc_pb.StopRequest, callback: (error: grpc.ServiceError | null, response: lnd_rpc_pb.StopResponse) => void): grpc.ClientUnaryCall;
    public stopDaemon(request: lnd_rpc_pb.StopRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: lnd_rpc_pb.StopResponse) => void): grpc.ClientUnaryCall;
    public stopDaemon(request: lnd_rpc_pb.StopRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: lnd_rpc_pb.StopResponse) => void): grpc.ClientUnaryCall;
    public subscribeChannelGraph(request: lnd_rpc_pb.GraphTopologySubscription, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<lnd_rpc_pb.GraphTopologyUpdate>;
    public subscribeChannelGraph(request: lnd_rpc_pb.GraphTopologySubscription, metadata?: grpc.Metadata, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<lnd_rpc_pb.GraphTopologyUpdate>;
    public debugLevel(request: lnd_rpc_pb.DebugLevelRequest, callback: (error: grpc.ServiceError | null, response: lnd_rpc_pb.DebugLevelResponse) => void): grpc.ClientUnaryCall;
    public debugLevel(request: lnd_rpc_pb.DebugLevelRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: lnd_rpc_pb.DebugLevelResponse) => void): grpc.ClientUnaryCall;
    public debugLevel(request: lnd_rpc_pb.DebugLevelRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: lnd_rpc_pb.DebugLevelResponse) => void): grpc.ClientUnaryCall;
    public feeReport(request: lnd_rpc_pb.FeeReportRequest, callback: (error: grpc.ServiceError | null, response: lnd_rpc_pb.FeeReportResponse) => void): grpc.ClientUnaryCall;
    public feeReport(request: lnd_rpc_pb.FeeReportRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: lnd_rpc_pb.FeeReportResponse) => void): grpc.ClientUnaryCall;
    public feeReport(request: lnd_rpc_pb.FeeReportRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: lnd_rpc_pb.FeeReportResponse) => void): grpc.ClientUnaryCall;
    public updateChannelPolicy(request: lnd_rpc_pb.PolicyUpdateRequest, callback: (error: grpc.ServiceError | null, response: lnd_rpc_pb.PolicyUpdateResponse) => void): grpc.ClientUnaryCall;
    public updateChannelPolicy(request: lnd_rpc_pb.PolicyUpdateRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: lnd_rpc_pb.PolicyUpdateResponse) => void): grpc.ClientUnaryCall;
    public updateChannelPolicy(request: lnd_rpc_pb.PolicyUpdateRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: lnd_rpc_pb.PolicyUpdateResponse) => void): grpc.ClientUnaryCall;
    public forwardingHistory(request: lnd_rpc_pb.ForwardingHistoryRequest, callback: (error: grpc.ServiceError | null, response: lnd_rpc_pb.ForwardingHistoryResponse) => void): grpc.ClientUnaryCall;
    public forwardingHistory(request: lnd_rpc_pb.ForwardingHistoryRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: lnd_rpc_pb.ForwardingHistoryResponse) => void): grpc.ClientUnaryCall;
    public forwardingHistory(request: lnd_rpc_pb.ForwardingHistoryRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: lnd_rpc_pb.ForwardingHistoryResponse) => void): grpc.ClientUnaryCall;
    public exportChannelBackup(request: lnd_rpc_pb.ExportChannelBackupRequest, callback: (error: grpc.ServiceError | null, response: lnd_rpc_pb.ChannelBackup) => void): grpc.ClientUnaryCall;
    public exportChannelBackup(request: lnd_rpc_pb.ExportChannelBackupRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: lnd_rpc_pb.ChannelBackup) => void): grpc.ClientUnaryCall;
    public exportChannelBackup(request: lnd_rpc_pb.ExportChannelBackupRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: lnd_rpc_pb.ChannelBackup) => void): grpc.ClientUnaryCall;
    public exportAllChannelBackups(request: lnd_rpc_pb.ChanBackupExportRequest, callback: (error: grpc.ServiceError | null, response: lnd_rpc_pb.ChanBackupSnapshot) => void): grpc.ClientUnaryCall;
    public exportAllChannelBackups(request: lnd_rpc_pb.ChanBackupExportRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: lnd_rpc_pb.ChanBackupSnapshot) => void): grpc.ClientUnaryCall;
    public exportAllChannelBackups(request: lnd_rpc_pb.ChanBackupExportRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: lnd_rpc_pb.ChanBackupSnapshot) => void): grpc.ClientUnaryCall;
    public verifyChanBackup(request: lnd_rpc_pb.ChanBackupSnapshot, callback: (error: grpc.ServiceError | null, response: lnd_rpc_pb.VerifyChanBackupResponse) => void): grpc.ClientUnaryCall;
    public verifyChanBackup(request: lnd_rpc_pb.ChanBackupSnapshot, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: lnd_rpc_pb.VerifyChanBackupResponse) => void): grpc.ClientUnaryCall;
    public verifyChanBackup(request: lnd_rpc_pb.ChanBackupSnapshot, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: lnd_rpc_pb.VerifyChanBackupResponse) => void): grpc.ClientUnaryCall;
    public restoreChannelBackups(request: lnd_rpc_pb.RestoreChanBackupRequest, callback: (error: grpc.ServiceError | null, response: lnd_rpc_pb.RestoreBackupResponse) => void): grpc.ClientUnaryCall;
    public restoreChannelBackups(request: lnd_rpc_pb.RestoreChanBackupRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: lnd_rpc_pb.RestoreBackupResponse) => void): grpc.ClientUnaryCall;
    public restoreChannelBackups(request: lnd_rpc_pb.RestoreChanBackupRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: lnd_rpc_pb.RestoreBackupResponse) => void): grpc.ClientUnaryCall;
    public subscribeChannelBackups(request: lnd_rpc_pb.ChannelBackupSubscription, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<lnd_rpc_pb.ChanBackupSnapshot>;
    public subscribeChannelBackups(request: lnd_rpc_pb.ChannelBackupSubscription, metadata?: grpc.Metadata, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<lnd_rpc_pb.ChanBackupSnapshot>;
    public bakeMacaroon(request: lnd_rpc_pb.BakeMacaroonRequest, callback: (error: grpc.ServiceError | null, response: lnd_rpc_pb.BakeMacaroonResponse) => void): grpc.ClientUnaryCall;
    public bakeMacaroon(request: lnd_rpc_pb.BakeMacaroonRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: lnd_rpc_pb.BakeMacaroonResponse) => void): grpc.ClientUnaryCall;
    public bakeMacaroon(request: lnd_rpc_pb.BakeMacaroonRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: lnd_rpc_pb.BakeMacaroonResponse) => void): grpc.ClientUnaryCall;
    public listPermissions(request: lnd_rpc_pb.ListPermissionsRequest, callback: (error: grpc.ServiceError | null, response: lnd_rpc_pb.ListPermissionsResponse) => void): grpc.ClientUnaryCall;
    public listPermissions(request: lnd_rpc_pb.ListPermissionsRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: lnd_rpc_pb.ListPermissionsResponse) => void): grpc.ClientUnaryCall;
    public listPermissions(request: lnd_rpc_pb.ListPermissionsRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: lnd_rpc_pb.ListPermissionsResponse) => void): grpc.ClientUnaryCall;
}
