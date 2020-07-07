// package: lnrpc
// file: lndrpc.proto

/* tslint:disable */
/* eslint-disable */

import * as grpc from "grpc";
import * as lndrpc_pb from "./lndrpc_pb";
import * as annotations_pb from "./annotations_pb";

interface IWalletUnlockerService extends grpc.ServiceDefinition<grpc.UntypedServiceImplementation> {
    genSeed: IWalletUnlockerService_IGenSeed;
    initWallet: IWalletUnlockerService_IInitWallet;
    unlockWallet: IWalletUnlockerService_IUnlockWallet;
    changePassword: IWalletUnlockerService_IChangePassword;
}

interface IWalletUnlockerService_IGenSeed extends grpc.MethodDefinition<lndrpc_pb.GenSeedRequest, lndrpc_pb.GenSeedResponse> {
    path: string; // "/lnrpc.WalletUnlocker/GenSeed"
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<lndrpc_pb.GenSeedRequest>;
    requestDeserialize: grpc.deserialize<lndrpc_pb.GenSeedRequest>;
    responseSerialize: grpc.serialize<lndrpc_pb.GenSeedResponse>;
    responseDeserialize: grpc.deserialize<lndrpc_pb.GenSeedResponse>;
}
interface IWalletUnlockerService_IInitWallet extends grpc.MethodDefinition<lndrpc_pb.InitWalletRequest, lndrpc_pb.InitWalletResponse> {
    path: string; // "/lnrpc.WalletUnlocker/InitWallet"
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<lndrpc_pb.InitWalletRequest>;
    requestDeserialize: grpc.deserialize<lndrpc_pb.InitWalletRequest>;
    responseSerialize: grpc.serialize<lndrpc_pb.InitWalletResponse>;
    responseDeserialize: grpc.deserialize<lndrpc_pb.InitWalletResponse>;
}
interface IWalletUnlockerService_IUnlockWallet extends grpc.MethodDefinition<lndrpc_pb.UnlockWalletRequest, lndrpc_pb.UnlockWalletResponse> {
    path: string; // "/lnrpc.WalletUnlocker/UnlockWallet"
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<lndrpc_pb.UnlockWalletRequest>;
    requestDeserialize: grpc.deserialize<lndrpc_pb.UnlockWalletRequest>;
    responseSerialize: grpc.serialize<lndrpc_pb.UnlockWalletResponse>;
    responseDeserialize: grpc.deserialize<lndrpc_pb.UnlockWalletResponse>;
}
interface IWalletUnlockerService_IChangePassword extends grpc.MethodDefinition<lndrpc_pb.ChangePasswordRequest, lndrpc_pb.ChangePasswordResponse> {
    path: string; // "/lnrpc.WalletUnlocker/ChangePassword"
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<lndrpc_pb.ChangePasswordRequest>;
    requestDeserialize: grpc.deserialize<lndrpc_pb.ChangePasswordRequest>;
    responseSerialize: grpc.serialize<lndrpc_pb.ChangePasswordResponse>;
    responseDeserialize: grpc.deserialize<lndrpc_pb.ChangePasswordResponse>;
}

export const WalletUnlockerService: IWalletUnlockerService;

export interface IWalletUnlockerServer {
    genSeed: grpc.handleUnaryCall<lndrpc_pb.GenSeedRequest, lndrpc_pb.GenSeedResponse>;
    initWallet: grpc.handleUnaryCall<lndrpc_pb.InitWalletRequest, lndrpc_pb.InitWalletResponse>;
    unlockWallet: grpc.handleUnaryCall<lndrpc_pb.UnlockWalletRequest, lndrpc_pb.UnlockWalletResponse>;
    changePassword: grpc.handleUnaryCall<lndrpc_pb.ChangePasswordRequest, lndrpc_pb.ChangePasswordResponse>;
}

export interface IWalletUnlockerClient {
    genSeed(request: lndrpc_pb.GenSeedRequest, callback: (error: grpc.ServiceError | null, response: lndrpc_pb.GenSeedResponse) => void): grpc.ClientUnaryCall;
    genSeed(request: lndrpc_pb.GenSeedRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: lndrpc_pb.GenSeedResponse) => void): grpc.ClientUnaryCall;
    genSeed(request: lndrpc_pb.GenSeedRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: lndrpc_pb.GenSeedResponse) => void): grpc.ClientUnaryCall;
    initWallet(request: lndrpc_pb.InitWalletRequest, callback: (error: grpc.ServiceError | null, response: lndrpc_pb.InitWalletResponse) => void): grpc.ClientUnaryCall;
    initWallet(request: lndrpc_pb.InitWalletRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: lndrpc_pb.InitWalletResponse) => void): grpc.ClientUnaryCall;
    initWallet(request: lndrpc_pb.InitWalletRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: lndrpc_pb.InitWalletResponse) => void): grpc.ClientUnaryCall;
    unlockWallet(request: lndrpc_pb.UnlockWalletRequest, callback: (error: grpc.ServiceError | null, response: lndrpc_pb.UnlockWalletResponse) => void): grpc.ClientUnaryCall;
    unlockWallet(request: lndrpc_pb.UnlockWalletRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: lndrpc_pb.UnlockWalletResponse) => void): grpc.ClientUnaryCall;
    unlockWallet(request: lndrpc_pb.UnlockWalletRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: lndrpc_pb.UnlockWalletResponse) => void): grpc.ClientUnaryCall;
    changePassword(request: lndrpc_pb.ChangePasswordRequest, callback: (error: grpc.ServiceError | null, response: lndrpc_pb.ChangePasswordResponse) => void): grpc.ClientUnaryCall;
    changePassword(request: lndrpc_pb.ChangePasswordRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: lndrpc_pb.ChangePasswordResponse) => void): grpc.ClientUnaryCall;
    changePassword(request: lndrpc_pb.ChangePasswordRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: lndrpc_pb.ChangePasswordResponse) => void): grpc.ClientUnaryCall;
}

export class WalletUnlockerClient extends grpc.Client implements IWalletUnlockerClient {
    constructor(address: string, credentials: grpc.ChannelCredentials, options?: object);
    public genSeed(request: lndrpc_pb.GenSeedRequest, callback: (error: grpc.ServiceError | null, response: lndrpc_pb.GenSeedResponse) => void): grpc.ClientUnaryCall;
    public genSeed(request: lndrpc_pb.GenSeedRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: lndrpc_pb.GenSeedResponse) => void): grpc.ClientUnaryCall;
    public genSeed(request: lndrpc_pb.GenSeedRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: lndrpc_pb.GenSeedResponse) => void): grpc.ClientUnaryCall;
    public initWallet(request: lndrpc_pb.InitWalletRequest, callback: (error: grpc.ServiceError | null, response: lndrpc_pb.InitWalletResponse) => void): grpc.ClientUnaryCall;
    public initWallet(request: lndrpc_pb.InitWalletRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: lndrpc_pb.InitWalletResponse) => void): grpc.ClientUnaryCall;
    public initWallet(request: lndrpc_pb.InitWalletRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: lndrpc_pb.InitWalletResponse) => void): grpc.ClientUnaryCall;
    public unlockWallet(request: lndrpc_pb.UnlockWalletRequest, callback: (error: grpc.ServiceError | null, response: lndrpc_pb.UnlockWalletResponse) => void): grpc.ClientUnaryCall;
    public unlockWallet(request: lndrpc_pb.UnlockWalletRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: lndrpc_pb.UnlockWalletResponse) => void): grpc.ClientUnaryCall;
    public unlockWallet(request: lndrpc_pb.UnlockWalletRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: lndrpc_pb.UnlockWalletResponse) => void): grpc.ClientUnaryCall;
    public changePassword(request: lndrpc_pb.ChangePasswordRequest, callback: (error: grpc.ServiceError | null, response: lndrpc_pb.ChangePasswordResponse) => void): grpc.ClientUnaryCall;
    public changePassword(request: lndrpc_pb.ChangePasswordRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: lndrpc_pb.ChangePasswordResponse) => void): grpc.ClientUnaryCall;
    public changePassword(request: lndrpc_pb.ChangePasswordRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: lndrpc_pb.ChangePasswordResponse) => void): grpc.ClientUnaryCall;
}

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
}

interface ILightningService_IWalletBalance extends grpc.MethodDefinition<lndrpc_pb.WalletBalanceRequest, lndrpc_pb.WalletBalanceResponse> {
    path: string; // "/lnrpc.Lightning/WalletBalance"
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<lndrpc_pb.WalletBalanceRequest>;
    requestDeserialize: grpc.deserialize<lndrpc_pb.WalletBalanceRequest>;
    responseSerialize: grpc.serialize<lndrpc_pb.WalletBalanceResponse>;
    responseDeserialize: grpc.deserialize<lndrpc_pb.WalletBalanceResponse>;
}
interface ILightningService_IChannelBalance extends grpc.MethodDefinition<lndrpc_pb.ChannelBalanceRequest, lndrpc_pb.ChannelBalanceResponse> {
    path: string; // "/lnrpc.Lightning/ChannelBalance"
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<lndrpc_pb.ChannelBalanceRequest>;
    requestDeserialize: grpc.deserialize<lndrpc_pb.ChannelBalanceRequest>;
    responseSerialize: grpc.serialize<lndrpc_pb.ChannelBalanceResponse>;
    responseDeserialize: grpc.deserialize<lndrpc_pb.ChannelBalanceResponse>;
}
interface ILightningService_IGetTransactions extends grpc.MethodDefinition<lndrpc_pb.GetTransactionsRequest, lndrpc_pb.TransactionDetails> {
    path: string; // "/lnrpc.Lightning/GetTransactions"
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<lndrpc_pb.GetTransactionsRequest>;
    requestDeserialize: grpc.deserialize<lndrpc_pb.GetTransactionsRequest>;
    responseSerialize: grpc.serialize<lndrpc_pb.TransactionDetails>;
    responseDeserialize: grpc.deserialize<lndrpc_pb.TransactionDetails>;
}
interface ILightningService_IEstimateFee extends grpc.MethodDefinition<lndrpc_pb.EstimateFeeRequest, lndrpc_pb.EstimateFeeResponse> {
    path: string; // "/lnrpc.Lightning/EstimateFee"
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<lndrpc_pb.EstimateFeeRequest>;
    requestDeserialize: grpc.deserialize<lndrpc_pb.EstimateFeeRequest>;
    responseSerialize: grpc.serialize<lndrpc_pb.EstimateFeeResponse>;
    responseDeserialize: grpc.deserialize<lndrpc_pb.EstimateFeeResponse>;
}
interface ILightningService_ISendCoins extends grpc.MethodDefinition<lndrpc_pb.SendCoinsRequest, lndrpc_pb.SendCoinsResponse> {
    path: string; // "/lnrpc.Lightning/SendCoins"
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<lndrpc_pb.SendCoinsRequest>;
    requestDeserialize: grpc.deserialize<lndrpc_pb.SendCoinsRequest>;
    responseSerialize: grpc.serialize<lndrpc_pb.SendCoinsResponse>;
    responseDeserialize: grpc.deserialize<lndrpc_pb.SendCoinsResponse>;
}
interface ILightningService_IListUnspent extends grpc.MethodDefinition<lndrpc_pb.ListUnspentRequest, lndrpc_pb.ListUnspentResponse> {
    path: string; // "/lnrpc.Lightning/ListUnspent"
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<lndrpc_pb.ListUnspentRequest>;
    requestDeserialize: grpc.deserialize<lndrpc_pb.ListUnspentRequest>;
    responseSerialize: grpc.serialize<lndrpc_pb.ListUnspentResponse>;
    responseDeserialize: grpc.deserialize<lndrpc_pb.ListUnspentResponse>;
}
interface ILightningService_ISubscribeTransactions extends grpc.MethodDefinition<lndrpc_pb.GetTransactionsRequest, lndrpc_pb.Transaction> {
    path: string; // "/lnrpc.Lightning/SubscribeTransactions"
    requestStream: false;
    responseStream: true;
    requestSerialize: grpc.serialize<lndrpc_pb.GetTransactionsRequest>;
    requestDeserialize: grpc.deserialize<lndrpc_pb.GetTransactionsRequest>;
    responseSerialize: grpc.serialize<lndrpc_pb.Transaction>;
    responseDeserialize: grpc.deserialize<lndrpc_pb.Transaction>;
}
interface ILightningService_ISendMany extends grpc.MethodDefinition<lndrpc_pb.SendManyRequest, lndrpc_pb.SendManyResponse> {
    path: string; // "/lnrpc.Lightning/SendMany"
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<lndrpc_pb.SendManyRequest>;
    requestDeserialize: grpc.deserialize<lndrpc_pb.SendManyRequest>;
    responseSerialize: grpc.serialize<lndrpc_pb.SendManyResponse>;
    responseDeserialize: grpc.deserialize<lndrpc_pb.SendManyResponse>;
}
interface ILightningService_INewAddress extends grpc.MethodDefinition<lndrpc_pb.NewAddressRequest, lndrpc_pb.NewAddressResponse> {
    path: string; // "/lnrpc.Lightning/NewAddress"
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<lndrpc_pb.NewAddressRequest>;
    requestDeserialize: grpc.deserialize<lndrpc_pb.NewAddressRequest>;
    responseSerialize: grpc.serialize<lndrpc_pb.NewAddressResponse>;
    responseDeserialize: grpc.deserialize<lndrpc_pb.NewAddressResponse>;
}
interface ILightningService_ISignMessage extends grpc.MethodDefinition<lndrpc_pb.SignMessageRequest, lndrpc_pb.SignMessageResponse> {
    path: string; // "/lnrpc.Lightning/SignMessage"
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<lndrpc_pb.SignMessageRequest>;
    requestDeserialize: grpc.deserialize<lndrpc_pb.SignMessageRequest>;
    responseSerialize: grpc.serialize<lndrpc_pb.SignMessageResponse>;
    responseDeserialize: grpc.deserialize<lndrpc_pb.SignMessageResponse>;
}
interface ILightningService_IVerifyMessage extends grpc.MethodDefinition<lndrpc_pb.VerifyMessageRequest, lndrpc_pb.VerifyMessageResponse> {
    path: string; // "/lnrpc.Lightning/VerifyMessage"
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<lndrpc_pb.VerifyMessageRequest>;
    requestDeserialize: grpc.deserialize<lndrpc_pb.VerifyMessageRequest>;
    responseSerialize: grpc.serialize<lndrpc_pb.VerifyMessageResponse>;
    responseDeserialize: grpc.deserialize<lndrpc_pb.VerifyMessageResponse>;
}
interface ILightningService_IConnectPeer extends grpc.MethodDefinition<lndrpc_pb.ConnectPeerRequest, lndrpc_pb.ConnectPeerResponse> {
    path: string; // "/lnrpc.Lightning/ConnectPeer"
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<lndrpc_pb.ConnectPeerRequest>;
    requestDeserialize: grpc.deserialize<lndrpc_pb.ConnectPeerRequest>;
    responseSerialize: grpc.serialize<lndrpc_pb.ConnectPeerResponse>;
    responseDeserialize: grpc.deserialize<lndrpc_pb.ConnectPeerResponse>;
}
interface ILightningService_IDisconnectPeer extends grpc.MethodDefinition<lndrpc_pb.DisconnectPeerRequest, lndrpc_pb.DisconnectPeerResponse> {
    path: string; // "/lnrpc.Lightning/DisconnectPeer"
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<lndrpc_pb.DisconnectPeerRequest>;
    requestDeserialize: grpc.deserialize<lndrpc_pb.DisconnectPeerRequest>;
    responseSerialize: grpc.serialize<lndrpc_pb.DisconnectPeerResponse>;
    responseDeserialize: grpc.deserialize<lndrpc_pb.DisconnectPeerResponse>;
}
interface ILightningService_IListPeers extends grpc.MethodDefinition<lndrpc_pb.ListPeersRequest, lndrpc_pb.ListPeersResponse> {
    path: string; // "/lnrpc.Lightning/ListPeers"
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<lndrpc_pb.ListPeersRequest>;
    requestDeserialize: grpc.deserialize<lndrpc_pb.ListPeersRequest>;
    responseSerialize: grpc.serialize<lndrpc_pb.ListPeersResponse>;
    responseDeserialize: grpc.deserialize<lndrpc_pb.ListPeersResponse>;
}
interface ILightningService_ISubscribePeerEvents extends grpc.MethodDefinition<lndrpc_pb.PeerEventSubscription, lndrpc_pb.PeerEvent> {
    path: string; // "/lnrpc.Lightning/SubscribePeerEvents"
    requestStream: false;
    responseStream: true;
    requestSerialize: grpc.serialize<lndrpc_pb.PeerEventSubscription>;
    requestDeserialize: grpc.deserialize<lndrpc_pb.PeerEventSubscription>;
    responseSerialize: grpc.serialize<lndrpc_pb.PeerEvent>;
    responseDeserialize: grpc.deserialize<lndrpc_pb.PeerEvent>;
}
interface ILightningService_IGetInfo extends grpc.MethodDefinition<lndrpc_pb.GetInfoRequest, lndrpc_pb.GetInfoResponse> {
    path: string; // "/lnrpc.Lightning/GetInfo"
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<lndrpc_pb.GetInfoRequest>;
    requestDeserialize: grpc.deserialize<lndrpc_pb.GetInfoRequest>;
    responseSerialize: grpc.serialize<lndrpc_pb.GetInfoResponse>;
    responseDeserialize: grpc.deserialize<lndrpc_pb.GetInfoResponse>;
}
interface ILightningService_IPendingChannels extends grpc.MethodDefinition<lndrpc_pb.PendingChannelsRequest, lndrpc_pb.PendingChannelsResponse> {
    path: string; // "/lnrpc.Lightning/PendingChannels"
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<lndrpc_pb.PendingChannelsRequest>;
    requestDeserialize: grpc.deserialize<lndrpc_pb.PendingChannelsRequest>;
    responseSerialize: grpc.serialize<lndrpc_pb.PendingChannelsResponse>;
    responseDeserialize: grpc.deserialize<lndrpc_pb.PendingChannelsResponse>;
}
interface ILightningService_IListChannels extends grpc.MethodDefinition<lndrpc_pb.ListChannelsRequest, lndrpc_pb.ListChannelsResponse> {
    path: string; // "/lnrpc.Lightning/ListChannels"
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<lndrpc_pb.ListChannelsRequest>;
    requestDeserialize: grpc.deserialize<lndrpc_pb.ListChannelsRequest>;
    responseSerialize: grpc.serialize<lndrpc_pb.ListChannelsResponse>;
    responseDeserialize: grpc.deserialize<lndrpc_pb.ListChannelsResponse>;
}
interface ILightningService_ISubscribeChannelEvents extends grpc.MethodDefinition<lndrpc_pb.ChannelEventSubscription, lndrpc_pb.ChannelEventUpdate> {
    path: string; // "/lnrpc.Lightning/SubscribeChannelEvents"
    requestStream: false;
    responseStream: true;
    requestSerialize: grpc.serialize<lndrpc_pb.ChannelEventSubscription>;
    requestDeserialize: grpc.deserialize<lndrpc_pb.ChannelEventSubscription>;
    responseSerialize: grpc.serialize<lndrpc_pb.ChannelEventUpdate>;
    responseDeserialize: grpc.deserialize<lndrpc_pb.ChannelEventUpdate>;
}
interface ILightningService_IClosedChannels extends grpc.MethodDefinition<lndrpc_pb.ClosedChannelsRequest, lndrpc_pb.ClosedChannelsResponse> {
    path: string; // "/lnrpc.Lightning/ClosedChannels"
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<lndrpc_pb.ClosedChannelsRequest>;
    requestDeserialize: grpc.deserialize<lndrpc_pb.ClosedChannelsRequest>;
    responseSerialize: grpc.serialize<lndrpc_pb.ClosedChannelsResponse>;
    responseDeserialize: grpc.deserialize<lndrpc_pb.ClosedChannelsResponse>;
}
interface ILightningService_IOpenChannelSync extends grpc.MethodDefinition<lndrpc_pb.OpenChannelRequest, lndrpc_pb.ChannelPoint> {
    path: string; // "/lnrpc.Lightning/OpenChannelSync"
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<lndrpc_pb.OpenChannelRequest>;
    requestDeserialize: grpc.deserialize<lndrpc_pb.OpenChannelRequest>;
    responseSerialize: grpc.serialize<lndrpc_pb.ChannelPoint>;
    responseDeserialize: grpc.deserialize<lndrpc_pb.ChannelPoint>;
}
interface ILightningService_IOpenChannel extends grpc.MethodDefinition<lndrpc_pb.OpenChannelRequest, lndrpc_pb.OpenStatusUpdate> {
    path: string; // "/lnrpc.Lightning/OpenChannel"
    requestStream: false;
    responseStream: true;
    requestSerialize: grpc.serialize<lndrpc_pb.OpenChannelRequest>;
    requestDeserialize: grpc.deserialize<lndrpc_pb.OpenChannelRequest>;
    responseSerialize: grpc.serialize<lndrpc_pb.OpenStatusUpdate>;
    responseDeserialize: grpc.deserialize<lndrpc_pb.OpenStatusUpdate>;
}
interface ILightningService_IFundingStateStep extends grpc.MethodDefinition<lndrpc_pb.FundingTransitionMsg, lndrpc_pb.FundingStateStepResp> {
    path: string; // "/lnrpc.Lightning/FundingStateStep"
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<lndrpc_pb.FundingTransitionMsg>;
    requestDeserialize: grpc.deserialize<lndrpc_pb.FundingTransitionMsg>;
    responseSerialize: grpc.serialize<lndrpc_pb.FundingStateStepResp>;
    responseDeserialize: grpc.deserialize<lndrpc_pb.FundingStateStepResp>;
}
interface ILightningService_IChannelAcceptor extends grpc.MethodDefinition<lndrpc_pb.ChannelAcceptResponse, lndrpc_pb.ChannelAcceptRequest> {
    path: string; // "/lnrpc.Lightning/ChannelAcceptor"
    requestStream: true;
    responseStream: true;
    requestSerialize: grpc.serialize<lndrpc_pb.ChannelAcceptResponse>;
    requestDeserialize: grpc.deserialize<lndrpc_pb.ChannelAcceptResponse>;
    responseSerialize: grpc.serialize<lndrpc_pb.ChannelAcceptRequest>;
    responseDeserialize: grpc.deserialize<lndrpc_pb.ChannelAcceptRequest>;
}
interface ILightningService_ICloseChannel extends grpc.MethodDefinition<lndrpc_pb.CloseChannelRequest, lndrpc_pb.CloseStatusUpdate> {
    path: string; // "/lnrpc.Lightning/CloseChannel"
    requestStream: false;
    responseStream: true;
    requestSerialize: grpc.serialize<lndrpc_pb.CloseChannelRequest>;
    requestDeserialize: grpc.deserialize<lndrpc_pb.CloseChannelRequest>;
    responseSerialize: grpc.serialize<lndrpc_pb.CloseStatusUpdate>;
    responseDeserialize: grpc.deserialize<lndrpc_pb.CloseStatusUpdate>;
}
interface ILightningService_IAbandonChannel extends grpc.MethodDefinition<lndrpc_pb.AbandonChannelRequest, lndrpc_pb.AbandonChannelResponse> {
    path: string; // "/lnrpc.Lightning/AbandonChannel"
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<lndrpc_pb.AbandonChannelRequest>;
    requestDeserialize: grpc.deserialize<lndrpc_pb.AbandonChannelRequest>;
    responseSerialize: grpc.serialize<lndrpc_pb.AbandonChannelResponse>;
    responseDeserialize: grpc.deserialize<lndrpc_pb.AbandonChannelResponse>;
}
interface ILightningService_ISendPayment extends grpc.MethodDefinition<lndrpc_pb.SendRequest, lndrpc_pb.SendResponse> {
    path: string; // "/lnrpc.Lightning/SendPayment"
    requestStream: true;
    responseStream: true;
    requestSerialize: grpc.serialize<lndrpc_pb.SendRequest>;
    requestDeserialize: grpc.deserialize<lndrpc_pb.SendRequest>;
    responseSerialize: grpc.serialize<lndrpc_pb.SendResponse>;
    responseDeserialize: grpc.deserialize<lndrpc_pb.SendResponse>;
}
interface ILightningService_ISendPaymentSync extends grpc.MethodDefinition<lndrpc_pb.SendRequest, lndrpc_pb.SendResponse> {
    path: string; // "/lnrpc.Lightning/SendPaymentSync"
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<lndrpc_pb.SendRequest>;
    requestDeserialize: grpc.deserialize<lndrpc_pb.SendRequest>;
    responseSerialize: grpc.serialize<lndrpc_pb.SendResponse>;
    responseDeserialize: grpc.deserialize<lndrpc_pb.SendResponse>;
}
interface ILightningService_ISendToRoute extends grpc.MethodDefinition<lndrpc_pb.SendToRouteRequest, lndrpc_pb.SendResponse> {
    path: string; // "/lnrpc.Lightning/SendToRoute"
    requestStream: true;
    responseStream: true;
    requestSerialize: grpc.serialize<lndrpc_pb.SendToRouteRequest>;
    requestDeserialize: grpc.deserialize<lndrpc_pb.SendToRouteRequest>;
    responseSerialize: grpc.serialize<lndrpc_pb.SendResponse>;
    responseDeserialize: grpc.deserialize<lndrpc_pb.SendResponse>;
}
interface ILightningService_ISendToRouteSync extends grpc.MethodDefinition<lndrpc_pb.SendToRouteRequest, lndrpc_pb.SendResponse> {
    path: string; // "/lnrpc.Lightning/SendToRouteSync"
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<lndrpc_pb.SendToRouteRequest>;
    requestDeserialize: grpc.deserialize<lndrpc_pb.SendToRouteRequest>;
    responseSerialize: grpc.serialize<lndrpc_pb.SendResponse>;
    responseDeserialize: grpc.deserialize<lndrpc_pb.SendResponse>;
}
interface ILightningService_IAddInvoice extends grpc.MethodDefinition<lndrpc_pb.Invoice, lndrpc_pb.AddInvoiceResponse> {
    path: string; // "/lnrpc.Lightning/AddInvoice"
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<lndrpc_pb.Invoice>;
    requestDeserialize: grpc.deserialize<lndrpc_pb.Invoice>;
    responseSerialize: grpc.serialize<lndrpc_pb.AddInvoiceResponse>;
    responseDeserialize: grpc.deserialize<lndrpc_pb.AddInvoiceResponse>;
}
interface ILightningService_IListInvoices extends grpc.MethodDefinition<lndrpc_pb.ListInvoiceRequest, lndrpc_pb.ListInvoiceResponse> {
    path: string; // "/lnrpc.Lightning/ListInvoices"
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<lndrpc_pb.ListInvoiceRequest>;
    requestDeserialize: grpc.deserialize<lndrpc_pb.ListInvoiceRequest>;
    responseSerialize: grpc.serialize<lndrpc_pb.ListInvoiceResponse>;
    responseDeserialize: grpc.deserialize<lndrpc_pb.ListInvoiceResponse>;
}
interface ILightningService_ILookupInvoice extends grpc.MethodDefinition<lndrpc_pb.PaymentHash, lndrpc_pb.Invoice> {
    path: string; // "/lnrpc.Lightning/LookupInvoice"
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<lndrpc_pb.PaymentHash>;
    requestDeserialize: grpc.deserialize<lndrpc_pb.PaymentHash>;
    responseSerialize: grpc.serialize<lndrpc_pb.Invoice>;
    responseDeserialize: grpc.deserialize<lndrpc_pb.Invoice>;
}
interface ILightningService_ISubscribeInvoices extends grpc.MethodDefinition<lndrpc_pb.InvoiceSubscription, lndrpc_pb.Invoice> {
    path: string; // "/lnrpc.Lightning/SubscribeInvoices"
    requestStream: false;
    responseStream: true;
    requestSerialize: grpc.serialize<lndrpc_pb.InvoiceSubscription>;
    requestDeserialize: grpc.deserialize<lndrpc_pb.InvoiceSubscription>;
    responseSerialize: grpc.serialize<lndrpc_pb.Invoice>;
    responseDeserialize: grpc.deserialize<lndrpc_pb.Invoice>;
}
interface ILightningService_IDecodePayReq extends grpc.MethodDefinition<lndrpc_pb.PayReqString, lndrpc_pb.PayReq> {
    path: string; // "/lnrpc.Lightning/DecodePayReq"
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<lndrpc_pb.PayReqString>;
    requestDeserialize: grpc.deserialize<lndrpc_pb.PayReqString>;
    responseSerialize: grpc.serialize<lndrpc_pb.PayReq>;
    responseDeserialize: grpc.deserialize<lndrpc_pb.PayReq>;
}
interface ILightningService_IListPayments extends grpc.MethodDefinition<lndrpc_pb.ListPaymentsRequest, lndrpc_pb.ListPaymentsResponse> {
    path: string; // "/lnrpc.Lightning/ListPayments"
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<lndrpc_pb.ListPaymentsRequest>;
    requestDeserialize: grpc.deserialize<lndrpc_pb.ListPaymentsRequest>;
    responseSerialize: grpc.serialize<lndrpc_pb.ListPaymentsResponse>;
    responseDeserialize: grpc.deserialize<lndrpc_pb.ListPaymentsResponse>;
}
interface ILightningService_IDeleteAllPayments extends grpc.MethodDefinition<lndrpc_pb.DeleteAllPaymentsRequest, lndrpc_pb.DeleteAllPaymentsResponse> {
    path: string; // "/lnrpc.Lightning/DeleteAllPayments"
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<lndrpc_pb.DeleteAllPaymentsRequest>;
    requestDeserialize: grpc.deserialize<lndrpc_pb.DeleteAllPaymentsRequest>;
    responseSerialize: grpc.serialize<lndrpc_pb.DeleteAllPaymentsResponse>;
    responseDeserialize: grpc.deserialize<lndrpc_pb.DeleteAllPaymentsResponse>;
}
interface ILightningService_IDescribeGraph extends grpc.MethodDefinition<lndrpc_pb.ChannelGraphRequest, lndrpc_pb.ChannelGraph> {
    path: string; // "/lnrpc.Lightning/DescribeGraph"
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<lndrpc_pb.ChannelGraphRequest>;
    requestDeserialize: grpc.deserialize<lndrpc_pb.ChannelGraphRequest>;
    responseSerialize: grpc.serialize<lndrpc_pb.ChannelGraph>;
    responseDeserialize: grpc.deserialize<lndrpc_pb.ChannelGraph>;
}
interface ILightningService_IGetNodeMetrics extends grpc.MethodDefinition<lndrpc_pb.NodeMetricsRequest, lndrpc_pb.NodeMetricsResponse> {
    path: string; // "/lnrpc.Lightning/GetNodeMetrics"
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<lndrpc_pb.NodeMetricsRequest>;
    requestDeserialize: grpc.deserialize<lndrpc_pb.NodeMetricsRequest>;
    responseSerialize: grpc.serialize<lndrpc_pb.NodeMetricsResponse>;
    responseDeserialize: grpc.deserialize<lndrpc_pb.NodeMetricsResponse>;
}
interface ILightningService_IGetChanInfo extends grpc.MethodDefinition<lndrpc_pb.ChanInfoRequest, lndrpc_pb.ChannelEdge> {
    path: string; // "/lnrpc.Lightning/GetChanInfo"
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<lndrpc_pb.ChanInfoRequest>;
    requestDeserialize: grpc.deserialize<lndrpc_pb.ChanInfoRequest>;
    responseSerialize: grpc.serialize<lndrpc_pb.ChannelEdge>;
    responseDeserialize: grpc.deserialize<lndrpc_pb.ChannelEdge>;
}
interface ILightningService_IGetNodeInfo extends grpc.MethodDefinition<lndrpc_pb.NodeInfoRequest, lndrpc_pb.NodeInfo> {
    path: string; // "/lnrpc.Lightning/GetNodeInfo"
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<lndrpc_pb.NodeInfoRequest>;
    requestDeserialize: grpc.deserialize<lndrpc_pb.NodeInfoRequest>;
    responseSerialize: grpc.serialize<lndrpc_pb.NodeInfo>;
    responseDeserialize: grpc.deserialize<lndrpc_pb.NodeInfo>;
}
interface ILightningService_IQueryRoutes extends grpc.MethodDefinition<lndrpc_pb.QueryRoutesRequest, lndrpc_pb.QueryRoutesResponse> {
    path: string; // "/lnrpc.Lightning/QueryRoutes"
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<lndrpc_pb.QueryRoutesRequest>;
    requestDeserialize: grpc.deserialize<lndrpc_pb.QueryRoutesRequest>;
    responseSerialize: grpc.serialize<lndrpc_pb.QueryRoutesResponse>;
    responseDeserialize: grpc.deserialize<lndrpc_pb.QueryRoutesResponse>;
}
interface ILightningService_IGetNetworkInfo extends grpc.MethodDefinition<lndrpc_pb.NetworkInfoRequest, lndrpc_pb.NetworkInfo> {
    path: string; // "/lnrpc.Lightning/GetNetworkInfo"
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<lndrpc_pb.NetworkInfoRequest>;
    requestDeserialize: grpc.deserialize<lndrpc_pb.NetworkInfoRequest>;
    responseSerialize: grpc.serialize<lndrpc_pb.NetworkInfo>;
    responseDeserialize: grpc.deserialize<lndrpc_pb.NetworkInfo>;
}
interface ILightningService_IStopDaemon extends grpc.MethodDefinition<lndrpc_pb.StopRequest, lndrpc_pb.StopResponse> {
    path: string; // "/lnrpc.Lightning/StopDaemon"
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<lndrpc_pb.StopRequest>;
    requestDeserialize: grpc.deserialize<lndrpc_pb.StopRequest>;
    responseSerialize: grpc.serialize<lndrpc_pb.StopResponse>;
    responseDeserialize: grpc.deserialize<lndrpc_pb.StopResponse>;
}
interface ILightningService_ISubscribeChannelGraph extends grpc.MethodDefinition<lndrpc_pb.GraphTopologySubscription, lndrpc_pb.GraphTopologyUpdate> {
    path: string; // "/lnrpc.Lightning/SubscribeChannelGraph"
    requestStream: false;
    responseStream: true;
    requestSerialize: grpc.serialize<lndrpc_pb.GraphTopologySubscription>;
    requestDeserialize: grpc.deserialize<lndrpc_pb.GraphTopologySubscription>;
    responseSerialize: grpc.serialize<lndrpc_pb.GraphTopologyUpdate>;
    responseDeserialize: grpc.deserialize<lndrpc_pb.GraphTopologyUpdate>;
}
interface ILightningService_IDebugLevel extends grpc.MethodDefinition<lndrpc_pb.DebugLevelRequest, lndrpc_pb.DebugLevelResponse> {
    path: string; // "/lnrpc.Lightning/DebugLevel"
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<lndrpc_pb.DebugLevelRequest>;
    requestDeserialize: grpc.deserialize<lndrpc_pb.DebugLevelRequest>;
    responseSerialize: grpc.serialize<lndrpc_pb.DebugLevelResponse>;
    responseDeserialize: grpc.deserialize<lndrpc_pb.DebugLevelResponse>;
}
interface ILightningService_IFeeReport extends grpc.MethodDefinition<lndrpc_pb.FeeReportRequest, lndrpc_pb.FeeReportResponse> {
    path: string; // "/lnrpc.Lightning/FeeReport"
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<lndrpc_pb.FeeReportRequest>;
    requestDeserialize: grpc.deserialize<lndrpc_pb.FeeReportRequest>;
    responseSerialize: grpc.serialize<lndrpc_pb.FeeReportResponse>;
    responseDeserialize: grpc.deserialize<lndrpc_pb.FeeReportResponse>;
}
interface ILightningService_IUpdateChannelPolicy extends grpc.MethodDefinition<lndrpc_pb.PolicyUpdateRequest, lndrpc_pb.PolicyUpdateResponse> {
    path: string; // "/lnrpc.Lightning/UpdateChannelPolicy"
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<lndrpc_pb.PolicyUpdateRequest>;
    requestDeserialize: grpc.deserialize<lndrpc_pb.PolicyUpdateRequest>;
    responseSerialize: grpc.serialize<lndrpc_pb.PolicyUpdateResponse>;
    responseDeserialize: grpc.deserialize<lndrpc_pb.PolicyUpdateResponse>;
}
interface ILightningService_IForwardingHistory extends grpc.MethodDefinition<lndrpc_pb.ForwardingHistoryRequest, lndrpc_pb.ForwardingHistoryResponse> {
    path: string; // "/lnrpc.Lightning/ForwardingHistory"
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<lndrpc_pb.ForwardingHistoryRequest>;
    requestDeserialize: grpc.deserialize<lndrpc_pb.ForwardingHistoryRequest>;
    responseSerialize: grpc.serialize<lndrpc_pb.ForwardingHistoryResponse>;
    responseDeserialize: grpc.deserialize<lndrpc_pb.ForwardingHistoryResponse>;
}
interface ILightningService_IExportChannelBackup extends grpc.MethodDefinition<lndrpc_pb.ExportChannelBackupRequest, lndrpc_pb.ChannelBackup> {
    path: string; // "/lnrpc.Lightning/ExportChannelBackup"
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<lndrpc_pb.ExportChannelBackupRequest>;
    requestDeserialize: grpc.deserialize<lndrpc_pb.ExportChannelBackupRequest>;
    responseSerialize: grpc.serialize<lndrpc_pb.ChannelBackup>;
    responseDeserialize: grpc.deserialize<lndrpc_pb.ChannelBackup>;
}
interface ILightningService_IExportAllChannelBackups extends grpc.MethodDefinition<lndrpc_pb.ChanBackupExportRequest, lndrpc_pb.ChanBackupSnapshot> {
    path: string; // "/lnrpc.Lightning/ExportAllChannelBackups"
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<lndrpc_pb.ChanBackupExportRequest>;
    requestDeserialize: grpc.deserialize<lndrpc_pb.ChanBackupExportRequest>;
    responseSerialize: grpc.serialize<lndrpc_pb.ChanBackupSnapshot>;
    responseDeserialize: grpc.deserialize<lndrpc_pb.ChanBackupSnapshot>;
}
interface ILightningService_IVerifyChanBackup extends grpc.MethodDefinition<lndrpc_pb.ChanBackupSnapshot, lndrpc_pb.VerifyChanBackupResponse> {
    path: string; // "/lnrpc.Lightning/VerifyChanBackup"
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<lndrpc_pb.ChanBackupSnapshot>;
    requestDeserialize: grpc.deserialize<lndrpc_pb.ChanBackupSnapshot>;
    responseSerialize: grpc.serialize<lndrpc_pb.VerifyChanBackupResponse>;
    responseDeserialize: grpc.deserialize<lndrpc_pb.VerifyChanBackupResponse>;
}
interface ILightningService_IRestoreChannelBackups extends grpc.MethodDefinition<lndrpc_pb.RestoreChanBackupRequest, lndrpc_pb.RestoreBackupResponse> {
    path: string; // "/lnrpc.Lightning/RestoreChannelBackups"
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<lndrpc_pb.RestoreChanBackupRequest>;
    requestDeserialize: grpc.deserialize<lndrpc_pb.RestoreChanBackupRequest>;
    responseSerialize: grpc.serialize<lndrpc_pb.RestoreBackupResponse>;
    responseDeserialize: grpc.deserialize<lndrpc_pb.RestoreBackupResponse>;
}
interface ILightningService_ISubscribeChannelBackups extends grpc.MethodDefinition<lndrpc_pb.ChannelBackupSubscription, lndrpc_pb.ChanBackupSnapshot> {
    path: string; // "/lnrpc.Lightning/SubscribeChannelBackups"
    requestStream: false;
    responseStream: true;
    requestSerialize: grpc.serialize<lndrpc_pb.ChannelBackupSubscription>;
    requestDeserialize: grpc.deserialize<lndrpc_pb.ChannelBackupSubscription>;
    responseSerialize: grpc.serialize<lndrpc_pb.ChanBackupSnapshot>;
    responseDeserialize: grpc.deserialize<lndrpc_pb.ChanBackupSnapshot>;
}
interface ILightningService_IBakeMacaroon extends grpc.MethodDefinition<lndrpc_pb.BakeMacaroonRequest, lndrpc_pb.BakeMacaroonResponse> {
    path: string; // "/lnrpc.Lightning/BakeMacaroon"
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<lndrpc_pb.BakeMacaroonRequest>;
    requestDeserialize: grpc.deserialize<lndrpc_pb.BakeMacaroonRequest>;
    responseSerialize: grpc.serialize<lndrpc_pb.BakeMacaroonResponse>;
    responseDeserialize: grpc.deserialize<lndrpc_pb.BakeMacaroonResponse>;
}

export const LightningService: ILightningService;

export interface ILightningServer {
    walletBalance: grpc.handleUnaryCall<lndrpc_pb.WalletBalanceRequest, lndrpc_pb.WalletBalanceResponse>;
    channelBalance: grpc.handleUnaryCall<lndrpc_pb.ChannelBalanceRequest, lndrpc_pb.ChannelBalanceResponse>;
    getTransactions: grpc.handleUnaryCall<lndrpc_pb.GetTransactionsRequest, lndrpc_pb.TransactionDetails>;
    estimateFee: grpc.handleUnaryCall<lndrpc_pb.EstimateFeeRequest, lndrpc_pb.EstimateFeeResponse>;
    sendCoins: grpc.handleUnaryCall<lndrpc_pb.SendCoinsRequest, lndrpc_pb.SendCoinsResponse>;
    listUnspent: grpc.handleUnaryCall<lndrpc_pb.ListUnspentRequest, lndrpc_pb.ListUnspentResponse>;
    subscribeTransactions: grpc.handleServerStreamingCall<lndrpc_pb.GetTransactionsRequest, lndrpc_pb.Transaction>;
    sendMany: grpc.handleUnaryCall<lndrpc_pb.SendManyRequest, lndrpc_pb.SendManyResponse>;
    newAddress: grpc.handleUnaryCall<lndrpc_pb.NewAddressRequest, lndrpc_pb.NewAddressResponse>;
    signMessage: grpc.handleUnaryCall<lndrpc_pb.SignMessageRequest, lndrpc_pb.SignMessageResponse>;
    verifyMessage: grpc.handleUnaryCall<lndrpc_pb.VerifyMessageRequest, lndrpc_pb.VerifyMessageResponse>;
    connectPeer: grpc.handleUnaryCall<lndrpc_pb.ConnectPeerRequest, lndrpc_pb.ConnectPeerResponse>;
    disconnectPeer: grpc.handleUnaryCall<lndrpc_pb.DisconnectPeerRequest, lndrpc_pb.DisconnectPeerResponse>;
    listPeers: grpc.handleUnaryCall<lndrpc_pb.ListPeersRequest, lndrpc_pb.ListPeersResponse>;
    subscribePeerEvents: grpc.handleServerStreamingCall<lndrpc_pb.PeerEventSubscription, lndrpc_pb.PeerEvent>;
    getInfo: grpc.handleUnaryCall<lndrpc_pb.GetInfoRequest, lndrpc_pb.GetInfoResponse>;
    pendingChannels: grpc.handleUnaryCall<lndrpc_pb.PendingChannelsRequest, lndrpc_pb.PendingChannelsResponse>;
    listChannels: grpc.handleUnaryCall<lndrpc_pb.ListChannelsRequest, lndrpc_pb.ListChannelsResponse>;
    subscribeChannelEvents: grpc.handleServerStreamingCall<lndrpc_pb.ChannelEventSubscription, lndrpc_pb.ChannelEventUpdate>;
    closedChannels: grpc.handleUnaryCall<lndrpc_pb.ClosedChannelsRequest, lndrpc_pb.ClosedChannelsResponse>;
    openChannelSync: grpc.handleUnaryCall<lndrpc_pb.OpenChannelRequest, lndrpc_pb.ChannelPoint>;
    openChannel: grpc.handleServerStreamingCall<lndrpc_pb.OpenChannelRequest, lndrpc_pb.OpenStatusUpdate>;
    fundingStateStep: grpc.handleUnaryCall<lndrpc_pb.FundingTransitionMsg, lndrpc_pb.FundingStateStepResp>;
    channelAcceptor: grpc.handleBidiStreamingCall<lndrpc_pb.ChannelAcceptResponse, lndrpc_pb.ChannelAcceptRequest>;
    closeChannel: grpc.handleServerStreamingCall<lndrpc_pb.CloseChannelRequest, lndrpc_pb.CloseStatusUpdate>;
    abandonChannel: grpc.handleUnaryCall<lndrpc_pb.AbandonChannelRequest, lndrpc_pb.AbandonChannelResponse>;
    sendPayment: grpc.handleBidiStreamingCall<lndrpc_pb.SendRequest, lndrpc_pb.SendResponse>;
    sendPaymentSync: grpc.handleUnaryCall<lndrpc_pb.SendRequest, lndrpc_pb.SendResponse>;
    sendToRoute: grpc.handleBidiStreamingCall<lndrpc_pb.SendToRouteRequest, lndrpc_pb.SendResponse>;
    sendToRouteSync: grpc.handleUnaryCall<lndrpc_pb.SendToRouteRequest, lndrpc_pb.SendResponse>;
    addInvoice: grpc.handleUnaryCall<lndrpc_pb.Invoice, lndrpc_pb.AddInvoiceResponse>;
    listInvoices: grpc.handleUnaryCall<lndrpc_pb.ListInvoiceRequest, lndrpc_pb.ListInvoiceResponse>;
    lookupInvoice: grpc.handleUnaryCall<lndrpc_pb.PaymentHash, lndrpc_pb.Invoice>;
    subscribeInvoices: grpc.handleServerStreamingCall<lndrpc_pb.InvoiceSubscription, lndrpc_pb.Invoice>;
    decodePayReq: grpc.handleUnaryCall<lndrpc_pb.PayReqString, lndrpc_pb.PayReq>;
    listPayments: grpc.handleUnaryCall<lndrpc_pb.ListPaymentsRequest, lndrpc_pb.ListPaymentsResponse>;
    deleteAllPayments: grpc.handleUnaryCall<lndrpc_pb.DeleteAllPaymentsRequest, lndrpc_pb.DeleteAllPaymentsResponse>;
    describeGraph: grpc.handleUnaryCall<lndrpc_pb.ChannelGraphRequest, lndrpc_pb.ChannelGraph>;
    getNodeMetrics: grpc.handleUnaryCall<lndrpc_pb.NodeMetricsRequest, lndrpc_pb.NodeMetricsResponse>;
    getChanInfo: grpc.handleUnaryCall<lndrpc_pb.ChanInfoRequest, lndrpc_pb.ChannelEdge>;
    getNodeInfo: grpc.handleUnaryCall<lndrpc_pb.NodeInfoRequest, lndrpc_pb.NodeInfo>;
    queryRoutes: grpc.handleUnaryCall<lndrpc_pb.QueryRoutesRequest, lndrpc_pb.QueryRoutesResponse>;
    getNetworkInfo: grpc.handleUnaryCall<lndrpc_pb.NetworkInfoRequest, lndrpc_pb.NetworkInfo>;
    stopDaemon: grpc.handleUnaryCall<lndrpc_pb.StopRequest, lndrpc_pb.StopResponse>;
    subscribeChannelGraph: grpc.handleServerStreamingCall<lndrpc_pb.GraphTopologySubscription, lndrpc_pb.GraphTopologyUpdate>;
    debugLevel: grpc.handleUnaryCall<lndrpc_pb.DebugLevelRequest, lndrpc_pb.DebugLevelResponse>;
    feeReport: grpc.handleUnaryCall<lndrpc_pb.FeeReportRequest, lndrpc_pb.FeeReportResponse>;
    updateChannelPolicy: grpc.handleUnaryCall<lndrpc_pb.PolicyUpdateRequest, lndrpc_pb.PolicyUpdateResponse>;
    forwardingHistory: grpc.handleUnaryCall<lndrpc_pb.ForwardingHistoryRequest, lndrpc_pb.ForwardingHistoryResponse>;
    exportChannelBackup: grpc.handleUnaryCall<lndrpc_pb.ExportChannelBackupRequest, lndrpc_pb.ChannelBackup>;
    exportAllChannelBackups: grpc.handleUnaryCall<lndrpc_pb.ChanBackupExportRequest, lndrpc_pb.ChanBackupSnapshot>;
    verifyChanBackup: grpc.handleUnaryCall<lndrpc_pb.ChanBackupSnapshot, lndrpc_pb.VerifyChanBackupResponse>;
    restoreChannelBackups: grpc.handleUnaryCall<lndrpc_pb.RestoreChanBackupRequest, lndrpc_pb.RestoreBackupResponse>;
    subscribeChannelBackups: grpc.handleServerStreamingCall<lndrpc_pb.ChannelBackupSubscription, lndrpc_pb.ChanBackupSnapshot>;
    bakeMacaroon: grpc.handleUnaryCall<lndrpc_pb.BakeMacaroonRequest, lndrpc_pb.BakeMacaroonResponse>;
}

export interface ILightningClient {
    walletBalance(request: lndrpc_pb.WalletBalanceRequest, callback: (error: grpc.ServiceError | null, response: lndrpc_pb.WalletBalanceResponse) => void): grpc.ClientUnaryCall;
    walletBalance(request: lndrpc_pb.WalletBalanceRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: lndrpc_pb.WalletBalanceResponse) => void): grpc.ClientUnaryCall;
    walletBalance(request: lndrpc_pb.WalletBalanceRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: lndrpc_pb.WalletBalanceResponse) => void): grpc.ClientUnaryCall;
    channelBalance(request: lndrpc_pb.ChannelBalanceRequest, callback: (error: grpc.ServiceError | null, response: lndrpc_pb.ChannelBalanceResponse) => void): grpc.ClientUnaryCall;
    channelBalance(request: lndrpc_pb.ChannelBalanceRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: lndrpc_pb.ChannelBalanceResponse) => void): grpc.ClientUnaryCall;
    channelBalance(request: lndrpc_pb.ChannelBalanceRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: lndrpc_pb.ChannelBalanceResponse) => void): grpc.ClientUnaryCall;
    getTransactions(request: lndrpc_pb.GetTransactionsRequest, callback: (error: grpc.ServiceError | null, response: lndrpc_pb.TransactionDetails) => void): grpc.ClientUnaryCall;
    getTransactions(request: lndrpc_pb.GetTransactionsRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: lndrpc_pb.TransactionDetails) => void): grpc.ClientUnaryCall;
    getTransactions(request: lndrpc_pb.GetTransactionsRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: lndrpc_pb.TransactionDetails) => void): grpc.ClientUnaryCall;
    estimateFee(request: lndrpc_pb.EstimateFeeRequest, callback: (error: grpc.ServiceError | null, response: lndrpc_pb.EstimateFeeResponse) => void): grpc.ClientUnaryCall;
    estimateFee(request: lndrpc_pb.EstimateFeeRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: lndrpc_pb.EstimateFeeResponse) => void): grpc.ClientUnaryCall;
    estimateFee(request: lndrpc_pb.EstimateFeeRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: lndrpc_pb.EstimateFeeResponse) => void): grpc.ClientUnaryCall;
    sendCoins(request: lndrpc_pb.SendCoinsRequest, callback: (error: grpc.ServiceError | null, response: lndrpc_pb.SendCoinsResponse) => void): grpc.ClientUnaryCall;
    sendCoins(request: lndrpc_pb.SendCoinsRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: lndrpc_pb.SendCoinsResponse) => void): grpc.ClientUnaryCall;
    sendCoins(request: lndrpc_pb.SendCoinsRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: lndrpc_pb.SendCoinsResponse) => void): grpc.ClientUnaryCall;
    listUnspent(request: lndrpc_pb.ListUnspentRequest, callback: (error: grpc.ServiceError | null, response: lndrpc_pb.ListUnspentResponse) => void): grpc.ClientUnaryCall;
    listUnspent(request: lndrpc_pb.ListUnspentRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: lndrpc_pb.ListUnspentResponse) => void): grpc.ClientUnaryCall;
    listUnspent(request: lndrpc_pb.ListUnspentRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: lndrpc_pb.ListUnspentResponse) => void): grpc.ClientUnaryCall;
    subscribeTransactions(request: lndrpc_pb.GetTransactionsRequest, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<lndrpc_pb.Transaction>;
    subscribeTransactions(request: lndrpc_pb.GetTransactionsRequest, metadata?: grpc.Metadata, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<lndrpc_pb.Transaction>;
    sendMany(request: lndrpc_pb.SendManyRequest, callback: (error: grpc.ServiceError | null, response: lndrpc_pb.SendManyResponse) => void): grpc.ClientUnaryCall;
    sendMany(request: lndrpc_pb.SendManyRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: lndrpc_pb.SendManyResponse) => void): grpc.ClientUnaryCall;
    sendMany(request: lndrpc_pb.SendManyRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: lndrpc_pb.SendManyResponse) => void): grpc.ClientUnaryCall;
    newAddress(request: lndrpc_pb.NewAddressRequest, callback: (error: grpc.ServiceError | null, response: lndrpc_pb.NewAddressResponse) => void): grpc.ClientUnaryCall;
    newAddress(request: lndrpc_pb.NewAddressRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: lndrpc_pb.NewAddressResponse) => void): grpc.ClientUnaryCall;
    newAddress(request: lndrpc_pb.NewAddressRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: lndrpc_pb.NewAddressResponse) => void): grpc.ClientUnaryCall;
    signMessage(request: lndrpc_pb.SignMessageRequest, callback: (error: grpc.ServiceError | null, response: lndrpc_pb.SignMessageResponse) => void): grpc.ClientUnaryCall;
    signMessage(request: lndrpc_pb.SignMessageRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: lndrpc_pb.SignMessageResponse) => void): grpc.ClientUnaryCall;
    signMessage(request: lndrpc_pb.SignMessageRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: lndrpc_pb.SignMessageResponse) => void): grpc.ClientUnaryCall;
    verifyMessage(request: lndrpc_pb.VerifyMessageRequest, callback: (error: grpc.ServiceError | null, response: lndrpc_pb.VerifyMessageResponse) => void): grpc.ClientUnaryCall;
    verifyMessage(request: lndrpc_pb.VerifyMessageRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: lndrpc_pb.VerifyMessageResponse) => void): grpc.ClientUnaryCall;
    verifyMessage(request: lndrpc_pb.VerifyMessageRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: lndrpc_pb.VerifyMessageResponse) => void): grpc.ClientUnaryCall;
    connectPeer(request: lndrpc_pb.ConnectPeerRequest, callback: (error: grpc.ServiceError | null, response: lndrpc_pb.ConnectPeerResponse) => void): grpc.ClientUnaryCall;
    connectPeer(request: lndrpc_pb.ConnectPeerRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: lndrpc_pb.ConnectPeerResponse) => void): grpc.ClientUnaryCall;
    connectPeer(request: lndrpc_pb.ConnectPeerRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: lndrpc_pb.ConnectPeerResponse) => void): grpc.ClientUnaryCall;
    disconnectPeer(request: lndrpc_pb.DisconnectPeerRequest, callback: (error: grpc.ServiceError | null, response: lndrpc_pb.DisconnectPeerResponse) => void): grpc.ClientUnaryCall;
    disconnectPeer(request: lndrpc_pb.DisconnectPeerRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: lndrpc_pb.DisconnectPeerResponse) => void): grpc.ClientUnaryCall;
    disconnectPeer(request: lndrpc_pb.DisconnectPeerRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: lndrpc_pb.DisconnectPeerResponse) => void): grpc.ClientUnaryCall;
    listPeers(request: lndrpc_pb.ListPeersRequest, callback: (error: grpc.ServiceError | null, response: lndrpc_pb.ListPeersResponse) => void): grpc.ClientUnaryCall;
    listPeers(request: lndrpc_pb.ListPeersRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: lndrpc_pb.ListPeersResponse) => void): grpc.ClientUnaryCall;
    listPeers(request: lndrpc_pb.ListPeersRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: lndrpc_pb.ListPeersResponse) => void): grpc.ClientUnaryCall;
    subscribePeerEvents(request: lndrpc_pb.PeerEventSubscription, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<lndrpc_pb.PeerEvent>;
    subscribePeerEvents(request: lndrpc_pb.PeerEventSubscription, metadata?: grpc.Metadata, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<lndrpc_pb.PeerEvent>;
    getInfo(request: lndrpc_pb.GetInfoRequest, callback: (error: grpc.ServiceError | null, response: lndrpc_pb.GetInfoResponse) => void): grpc.ClientUnaryCall;
    getInfo(request: lndrpc_pb.GetInfoRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: lndrpc_pb.GetInfoResponse) => void): grpc.ClientUnaryCall;
    getInfo(request: lndrpc_pb.GetInfoRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: lndrpc_pb.GetInfoResponse) => void): grpc.ClientUnaryCall;
    pendingChannels(request: lndrpc_pb.PendingChannelsRequest, callback: (error: grpc.ServiceError | null, response: lndrpc_pb.PendingChannelsResponse) => void): grpc.ClientUnaryCall;
    pendingChannels(request: lndrpc_pb.PendingChannelsRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: lndrpc_pb.PendingChannelsResponse) => void): grpc.ClientUnaryCall;
    pendingChannels(request: lndrpc_pb.PendingChannelsRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: lndrpc_pb.PendingChannelsResponse) => void): grpc.ClientUnaryCall;
    listChannels(request: lndrpc_pb.ListChannelsRequest, callback: (error: grpc.ServiceError | null, response: lndrpc_pb.ListChannelsResponse) => void): grpc.ClientUnaryCall;
    listChannels(request: lndrpc_pb.ListChannelsRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: lndrpc_pb.ListChannelsResponse) => void): grpc.ClientUnaryCall;
    listChannels(request: lndrpc_pb.ListChannelsRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: lndrpc_pb.ListChannelsResponse) => void): grpc.ClientUnaryCall;
    subscribeChannelEvents(request: lndrpc_pb.ChannelEventSubscription, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<lndrpc_pb.ChannelEventUpdate>;
    subscribeChannelEvents(request: lndrpc_pb.ChannelEventSubscription, metadata?: grpc.Metadata, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<lndrpc_pb.ChannelEventUpdate>;
    closedChannels(request: lndrpc_pb.ClosedChannelsRequest, callback: (error: grpc.ServiceError | null, response: lndrpc_pb.ClosedChannelsResponse) => void): grpc.ClientUnaryCall;
    closedChannels(request: lndrpc_pb.ClosedChannelsRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: lndrpc_pb.ClosedChannelsResponse) => void): grpc.ClientUnaryCall;
    closedChannels(request: lndrpc_pb.ClosedChannelsRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: lndrpc_pb.ClosedChannelsResponse) => void): grpc.ClientUnaryCall;
    openChannelSync(request: lndrpc_pb.OpenChannelRequest, callback: (error: grpc.ServiceError | null, response: lndrpc_pb.ChannelPoint) => void): grpc.ClientUnaryCall;
    openChannelSync(request: lndrpc_pb.OpenChannelRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: lndrpc_pb.ChannelPoint) => void): grpc.ClientUnaryCall;
    openChannelSync(request: lndrpc_pb.OpenChannelRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: lndrpc_pb.ChannelPoint) => void): grpc.ClientUnaryCall;
    openChannel(request: lndrpc_pb.OpenChannelRequest, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<lndrpc_pb.OpenStatusUpdate>;
    openChannel(request: lndrpc_pb.OpenChannelRequest, metadata?: grpc.Metadata, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<lndrpc_pb.OpenStatusUpdate>;
    fundingStateStep(request: lndrpc_pb.FundingTransitionMsg, callback: (error: grpc.ServiceError | null, response: lndrpc_pb.FundingStateStepResp) => void): grpc.ClientUnaryCall;
    fundingStateStep(request: lndrpc_pb.FundingTransitionMsg, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: lndrpc_pb.FundingStateStepResp) => void): grpc.ClientUnaryCall;
    fundingStateStep(request: lndrpc_pb.FundingTransitionMsg, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: lndrpc_pb.FundingStateStepResp) => void): grpc.ClientUnaryCall;
    channelAcceptor(): grpc.ClientDuplexStream<lndrpc_pb.ChannelAcceptResponse, lndrpc_pb.ChannelAcceptRequest>;
    channelAcceptor(options: Partial<grpc.CallOptions>): grpc.ClientDuplexStream<lndrpc_pb.ChannelAcceptResponse, lndrpc_pb.ChannelAcceptRequest>;
    channelAcceptor(metadata: grpc.Metadata, options?: Partial<grpc.CallOptions>): grpc.ClientDuplexStream<lndrpc_pb.ChannelAcceptResponse, lndrpc_pb.ChannelAcceptRequest>;
    closeChannel(request: lndrpc_pb.CloseChannelRequest, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<lndrpc_pb.CloseStatusUpdate>;
    closeChannel(request: lndrpc_pb.CloseChannelRequest, metadata?: grpc.Metadata, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<lndrpc_pb.CloseStatusUpdate>;
    abandonChannel(request: lndrpc_pb.AbandonChannelRequest, callback: (error: grpc.ServiceError | null, response: lndrpc_pb.AbandonChannelResponse) => void): grpc.ClientUnaryCall;
    abandonChannel(request: lndrpc_pb.AbandonChannelRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: lndrpc_pb.AbandonChannelResponse) => void): grpc.ClientUnaryCall;
    abandonChannel(request: lndrpc_pb.AbandonChannelRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: lndrpc_pb.AbandonChannelResponse) => void): grpc.ClientUnaryCall;
    sendPayment(): grpc.ClientDuplexStream<lndrpc_pb.SendRequest, lndrpc_pb.SendResponse>;
    sendPayment(options: Partial<grpc.CallOptions>): grpc.ClientDuplexStream<lndrpc_pb.SendRequest, lndrpc_pb.SendResponse>;
    sendPayment(metadata: grpc.Metadata, options?: Partial<grpc.CallOptions>): grpc.ClientDuplexStream<lndrpc_pb.SendRequest, lndrpc_pb.SendResponse>;
    sendPaymentSync(request: lndrpc_pb.SendRequest, callback: (error: grpc.ServiceError | null, response: lndrpc_pb.SendResponse) => void): grpc.ClientUnaryCall;
    sendPaymentSync(request: lndrpc_pb.SendRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: lndrpc_pb.SendResponse) => void): grpc.ClientUnaryCall;
    sendPaymentSync(request: lndrpc_pb.SendRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: lndrpc_pb.SendResponse) => void): grpc.ClientUnaryCall;
    sendToRoute(): grpc.ClientDuplexStream<lndrpc_pb.SendToRouteRequest, lndrpc_pb.SendResponse>;
    sendToRoute(options: Partial<grpc.CallOptions>): grpc.ClientDuplexStream<lndrpc_pb.SendToRouteRequest, lndrpc_pb.SendResponse>;
    sendToRoute(metadata: grpc.Metadata, options?: Partial<grpc.CallOptions>): grpc.ClientDuplexStream<lndrpc_pb.SendToRouteRequest, lndrpc_pb.SendResponse>;
    sendToRouteSync(request: lndrpc_pb.SendToRouteRequest, callback: (error: grpc.ServiceError | null, response: lndrpc_pb.SendResponse) => void): grpc.ClientUnaryCall;
    sendToRouteSync(request: lndrpc_pb.SendToRouteRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: lndrpc_pb.SendResponse) => void): grpc.ClientUnaryCall;
    sendToRouteSync(request: lndrpc_pb.SendToRouteRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: lndrpc_pb.SendResponse) => void): grpc.ClientUnaryCall;
    addInvoice(request: lndrpc_pb.Invoice, callback: (error: grpc.ServiceError | null, response: lndrpc_pb.AddInvoiceResponse) => void): grpc.ClientUnaryCall;
    addInvoice(request: lndrpc_pb.Invoice, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: lndrpc_pb.AddInvoiceResponse) => void): grpc.ClientUnaryCall;
    addInvoice(request: lndrpc_pb.Invoice, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: lndrpc_pb.AddInvoiceResponse) => void): grpc.ClientUnaryCall;
    listInvoices(request: lndrpc_pb.ListInvoiceRequest, callback: (error: grpc.ServiceError | null, response: lndrpc_pb.ListInvoiceResponse) => void): grpc.ClientUnaryCall;
    listInvoices(request: lndrpc_pb.ListInvoiceRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: lndrpc_pb.ListInvoiceResponse) => void): grpc.ClientUnaryCall;
    listInvoices(request: lndrpc_pb.ListInvoiceRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: lndrpc_pb.ListInvoiceResponse) => void): grpc.ClientUnaryCall;
    lookupInvoice(request: lndrpc_pb.PaymentHash, callback: (error: grpc.ServiceError | null, response: lndrpc_pb.Invoice) => void): grpc.ClientUnaryCall;
    lookupInvoice(request: lndrpc_pb.PaymentHash, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: lndrpc_pb.Invoice) => void): grpc.ClientUnaryCall;
    lookupInvoice(request: lndrpc_pb.PaymentHash, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: lndrpc_pb.Invoice) => void): grpc.ClientUnaryCall;
    subscribeInvoices(request: lndrpc_pb.InvoiceSubscription, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<lndrpc_pb.Invoice>;
    subscribeInvoices(request: lndrpc_pb.InvoiceSubscription, metadata?: grpc.Metadata, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<lndrpc_pb.Invoice>;
    decodePayReq(request: lndrpc_pb.PayReqString, callback: (error: grpc.ServiceError | null, response: lndrpc_pb.PayReq) => void): grpc.ClientUnaryCall;
    decodePayReq(request: lndrpc_pb.PayReqString, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: lndrpc_pb.PayReq) => void): grpc.ClientUnaryCall;
    decodePayReq(request: lndrpc_pb.PayReqString, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: lndrpc_pb.PayReq) => void): grpc.ClientUnaryCall;
    listPayments(request: lndrpc_pb.ListPaymentsRequest, callback: (error: grpc.ServiceError | null, response: lndrpc_pb.ListPaymentsResponse) => void): grpc.ClientUnaryCall;
    listPayments(request: lndrpc_pb.ListPaymentsRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: lndrpc_pb.ListPaymentsResponse) => void): grpc.ClientUnaryCall;
    listPayments(request: lndrpc_pb.ListPaymentsRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: lndrpc_pb.ListPaymentsResponse) => void): grpc.ClientUnaryCall;
    deleteAllPayments(request: lndrpc_pb.DeleteAllPaymentsRequest, callback: (error: grpc.ServiceError | null, response: lndrpc_pb.DeleteAllPaymentsResponse) => void): grpc.ClientUnaryCall;
    deleteAllPayments(request: lndrpc_pb.DeleteAllPaymentsRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: lndrpc_pb.DeleteAllPaymentsResponse) => void): grpc.ClientUnaryCall;
    deleteAllPayments(request: lndrpc_pb.DeleteAllPaymentsRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: lndrpc_pb.DeleteAllPaymentsResponse) => void): grpc.ClientUnaryCall;
    describeGraph(request: lndrpc_pb.ChannelGraphRequest, callback: (error: grpc.ServiceError | null, response: lndrpc_pb.ChannelGraph) => void): grpc.ClientUnaryCall;
    describeGraph(request: lndrpc_pb.ChannelGraphRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: lndrpc_pb.ChannelGraph) => void): grpc.ClientUnaryCall;
    describeGraph(request: lndrpc_pb.ChannelGraphRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: lndrpc_pb.ChannelGraph) => void): grpc.ClientUnaryCall;
    getNodeMetrics(request: lndrpc_pb.NodeMetricsRequest, callback: (error: grpc.ServiceError | null, response: lndrpc_pb.NodeMetricsResponse) => void): grpc.ClientUnaryCall;
    getNodeMetrics(request: lndrpc_pb.NodeMetricsRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: lndrpc_pb.NodeMetricsResponse) => void): grpc.ClientUnaryCall;
    getNodeMetrics(request: lndrpc_pb.NodeMetricsRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: lndrpc_pb.NodeMetricsResponse) => void): grpc.ClientUnaryCall;
    getChanInfo(request: lndrpc_pb.ChanInfoRequest, callback: (error: grpc.ServiceError | null, response: lndrpc_pb.ChannelEdge) => void): grpc.ClientUnaryCall;
    getChanInfo(request: lndrpc_pb.ChanInfoRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: lndrpc_pb.ChannelEdge) => void): grpc.ClientUnaryCall;
    getChanInfo(request: lndrpc_pb.ChanInfoRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: lndrpc_pb.ChannelEdge) => void): grpc.ClientUnaryCall;
    getNodeInfo(request: lndrpc_pb.NodeInfoRequest, callback: (error: grpc.ServiceError | null, response: lndrpc_pb.NodeInfo) => void): grpc.ClientUnaryCall;
    getNodeInfo(request: lndrpc_pb.NodeInfoRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: lndrpc_pb.NodeInfo) => void): grpc.ClientUnaryCall;
    getNodeInfo(request: lndrpc_pb.NodeInfoRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: lndrpc_pb.NodeInfo) => void): grpc.ClientUnaryCall;
    queryRoutes(request: lndrpc_pb.QueryRoutesRequest, callback: (error: grpc.ServiceError | null, response: lndrpc_pb.QueryRoutesResponse) => void): grpc.ClientUnaryCall;
    queryRoutes(request: lndrpc_pb.QueryRoutesRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: lndrpc_pb.QueryRoutesResponse) => void): grpc.ClientUnaryCall;
    queryRoutes(request: lndrpc_pb.QueryRoutesRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: lndrpc_pb.QueryRoutesResponse) => void): grpc.ClientUnaryCall;
    getNetworkInfo(request: lndrpc_pb.NetworkInfoRequest, callback: (error: grpc.ServiceError | null, response: lndrpc_pb.NetworkInfo) => void): grpc.ClientUnaryCall;
    getNetworkInfo(request: lndrpc_pb.NetworkInfoRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: lndrpc_pb.NetworkInfo) => void): grpc.ClientUnaryCall;
    getNetworkInfo(request: lndrpc_pb.NetworkInfoRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: lndrpc_pb.NetworkInfo) => void): grpc.ClientUnaryCall;
    stopDaemon(request: lndrpc_pb.StopRequest, callback: (error: grpc.ServiceError | null, response: lndrpc_pb.StopResponse) => void): grpc.ClientUnaryCall;
    stopDaemon(request: lndrpc_pb.StopRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: lndrpc_pb.StopResponse) => void): grpc.ClientUnaryCall;
    stopDaemon(request: lndrpc_pb.StopRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: lndrpc_pb.StopResponse) => void): grpc.ClientUnaryCall;
    subscribeChannelGraph(request: lndrpc_pb.GraphTopologySubscription, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<lndrpc_pb.GraphTopologyUpdate>;
    subscribeChannelGraph(request: lndrpc_pb.GraphTopologySubscription, metadata?: grpc.Metadata, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<lndrpc_pb.GraphTopologyUpdate>;
    debugLevel(request: lndrpc_pb.DebugLevelRequest, callback: (error: grpc.ServiceError | null, response: lndrpc_pb.DebugLevelResponse) => void): grpc.ClientUnaryCall;
    debugLevel(request: lndrpc_pb.DebugLevelRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: lndrpc_pb.DebugLevelResponse) => void): grpc.ClientUnaryCall;
    debugLevel(request: lndrpc_pb.DebugLevelRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: lndrpc_pb.DebugLevelResponse) => void): grpc.ClientUnaryCall;
    feeReport(request: lndrpc_pb.FeeReportRequest, callback: (error: grpc.ServiceError | null, response: lndrpc_pb.FeeReportResponse) => void): grpc.ClientUnaryCall;
    feeReport(request: lndrpc_pb.FeeReportRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: lndrpc_pb.FeeReportResponse) => void): grpc.ClientUnaryCall;
    feeReport(request: lndrpc_pb.FeeReportRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: lndrpc_pb.FeeReportResponse) => void): grpc.ClientUnaryCall;
    updateChannelPolicy(request: lndrpc_pb.PolicyUpdateRequest, callback: (error: grpc.ServiceError | null, response: lndrpc_pb.PolicyUpdateResponse) => void): grpc.ClientUnaryCall;
    updateChannelPolicy(request: lndrpc_pb.PolicyUpdateRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: lndrpc_pb.PolicyUpdateResponse) => void): grpc.ClientUnaryCall;
    updateChannelPolicy(request: lndrpc_pb.PolicyUpdateRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: lndrpc_pb.PolicyUpdateResponse) => void): grpc.ClientUnaryCall;
    forwardingHistory(request: lndrpc_pb.ForwardingHistoryRequest, callback: (error: grpc.ServiceError | null, response: lndrpc_pb.ForwardingHistoryResponse) => void): grpc.ClientUnaryCall;
    forwardingHistory(request: lndrpc_pb.ForwardingHistoryRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: lndrpc_pb.ForwardingHistoryResponse) => void): grpc.ClientUnaryCall;
    forwardingHistory(request: lndrpc_pb.ForwardingHistoryRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: lndrpc_pb.ForwardingHistoryResponse) => void): grpc.ClientUnaryCall;
    exportChannelBackup(request: lndrpc_pb.ExportChannelBackupRequest, callback: (error: grpc.ServiceError | null, response: lndrpc_pb.ChannelBackup) => void): grpc.ClientUnaryCall;
    exportChannelBackup(request: lndrpc_pb.ExportChannelBackupRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: lndrpc_pb.ChannelBackup) => void): grpc.ClientUnaryCall;
    exportChannelBackup(request: lndrpc_pb.ExportChannelBackupRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: lndrpc_pb.ChannelBackup) => void): grpc.ClientUnaryCall;
    exportAllChannelBackups(request: lndrpc_pb.ChanBackupExportRequest, callback: (error: grpc.ServiceError | null, response: lndrpc_pb.ChanBackupSnapshot) => void): grpc.ClientUnaryCall;
    exportAllChannelBackups(request: lndrpc_pb.ChanBackupExportRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: lndrpc_pb.ChanBackupSnapshot) => void): grpc.ClientUnaryCall;
    exportAllChannelBackups(request: lndrpc_pb.ChanBackupExportRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: lndrpc_pb.ChanBackupSnapshot) => void): grpc.ClientUnaryCall;
    verifyChanBackup(request: lndrpc_pb.ChanBackupSnapshot, callback: (error: grpc.ServiceError | null, response: lndrpc_pb.VerifyChanBackupResponse) => void): grpc.ClientUnaryCall;
    verifyChanBackup(request: lndrpc_pb.ChanBackupSnapshot, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: lndrpc_pb.VerifyChanBackupResponse) => void): grpc.ClientUnaryCall;
    verifyChanBackup(request: lndrpc_pb.ChanBackupSnapshot, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: lndrpc_pb.VerifyChanBackupResponse) => void): grpc.ClientUnaryCall;
    restoreChannelBackups(request: lndrpc_pb.RestoreChanBackupRequest, callback: (error: grpc.ServiceError | null, response: lndrpc_pb.RestoreBackupResponse) => void): grpc.ClientUnaryCall;
    restoreChannelBackups(request: lndrpc_pb.RestoreChanBackupRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: lndrpc_pb.RestoreBackupResponse) => void): grpc.ClientUnaryCall;
    restoreChannelBackups(request: lndrpc_pb.RestoreChanBackupRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: lndrpc_pb.RestoreBackupResponse) => void): grpc.ClientUnaryCall;
    subscribeChannelBackups(request: lndrpc_pb.ChannelBackupSubscription, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<lndrpc_pb.ChanBackupSnapshot>;
    subscribeChannelBackups(request: lndrpc_pb.ChannelBackupSubscription, metadata?: grpc.Metadata, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<lndrpc_pb.ChanBackupSnapshot>;
    bakeMacaroon(request: lndrpc_pb.BakeMacaroonRequest, callback: (error: grpc.ServiceError | null, response: lndrpc_pb.BakeMacaroonResponse) => void): grpc.ClientUnaryCall;
    bakeMacaroon(request: lndrpc_pb.BakeMacaroonRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: lndrpc_pb.BakeMacaroonResponse) => void): grpc.ClientUnaryCall;
    bakeMacaroon(request: lndrpc_pb.BakeMacaroonRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: lndrpc_pb.BakeMacaroonResponse) => void): grpc.ClientUnaryCall;
}

export class LightningClient extends grpc.Client implements ILightningClient {
    constructor(address: string, credentials: grpc.ChannelCredentials, options?: object);
    public walletBalance(request: lndrpc_pb.WalletBalanceRequest, callback: (error: grpc.ServiceError | null, response: lndrpc_pb.WalletBalanceResponse) => void): grpc.ClientUnaryCall;
    public walletBalance(request: lndrpc_pb.WalletBalanceRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: lndrpc_pb.WalletBalanceResponse) => void): grpc.ClientUnaryCall;
    public walletBalance(request: lndrpc_pb.WalletBalanceRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: lndrpc_pb.WalletBalanceResponse) => void): grpc.ClientUnaryCall;
    public channelBalance(request: lndrpc_pb.ChannelBalanceRequest, callback: (error: grpc.ServiceError | null, response: lndrpc_pb.ChannelBalanceResponse) => void): grpc.ClientUnaryCall;
    public channelBalance(request: lndrpc_pb.ChannelBalanceRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: lndrpc_pb.ChannelBalanceResponse) => void): grpc.ClientUnaryCall;
    public channelBalance(request: lndrpc_pb.ChannelBalanceRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: lndrpc_pb.ChannelBalanceResponse) => void): grpc.ClientUnaryCall;
    public getTransactions(request: lndrpc_pb.GetTransactionsRequest, callback: (error: grpc.ServiceError | null, response: lndrpc_pb.TransactionDetails) => void): grpc.ClientUnaryCall;
    public getTransactions(request: lndrpc_pb.GetTransactionsRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: lndrpc_pb.TransactionDetails) => void): grpc.ClientUnaryCall;
    public getTransactions(request: lndrpc_pb.GetTransactionsRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: lndrpc_pb.TransactionDetails) => void): grpc.ClientUnaryCall;
    public estimateFee(request: lndrpc_pb.EstimateFeeRequest, callback: (error: grpc.ServiceError | null, response: lndrpc_pb.EstimateFeeResponse) => void): grpc.ClientUnaryCall;
    public estimateFee(request: lndrpc_pb.EstimateFeeRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: lndrpc_pb.EstimateFeeResponse) => void): grpc.ClientUnaryCall;
    public estimateFee(request: lndrpc_pb.EstimateFeeRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: lndrpc_pb.EstimateFeeResponse) => void): grpc.ClientUnaryCall;
    public sendCoins(request: lndrpc_pb.SendCoinsRequest, callback: (error: grpc.ServiceError | null, response: lndrpc_pb.SendCoinsResponse) => void): grpc.ClientUnaryCall;
    public sendCoins(request: lndrpc_pb.SendCoinsRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: lndrpc_pb.SendCoinsResponse) => void): grpc.ClientUnaryCall;
    public sendCoins(request: lndrpc_pb.SendCoinsRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: lndrpc_pb.SendCoinsResponse) => void): grpc.ClientUnaryCall;
    public listUnspent(request: lndrpc_pb.ListUnspentRequest, callback: (error: grpc.ServiceError | null, response: lndrpc_pb.ListUnspentResponse) => void): grpc.ClientUnaryCall;
    public listUnspent(request: lndrpc_pb.ListUnspentRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: lndrpc_pb.ListUnspentResponse) => void): grpc.ClientUnaryCall;
    public listUnspent(request: lndrpc_pb.ListUnspentRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: lndrpc_pb.ListUnspentResponse) => void): grpc.ClientUnaryCall;
    public subscribeTransactions(request: lndrpc_pb.GetTransactionsRequest, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<lndrpc_pb.Transaction>;
    public subscribeTransactions(request: lndrpc_pb.GetTransactionsRequest, metadata?: grpc.Metadata, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<lndrpc_pb.Transaction>;
    public sendMany(request: lndrpc_pb.SendManyRequest, callback: (error: grpc.ServiceError | null, response: lndrpc_pb.SendManyResponse) => void): grpc.ClientUnaryCall;
    public sendMany(request: lndrpc_pb.SendManyRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: lndrpc_pb.SendManyResponse) => void): grpc.ClientUnaryCall;
    public sendMany(request: lndrpc_pb.SendManyRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: lndrpc_pb.SendManyResponse) => void): grpc.ClientUnaryCall;
    public newAddress(request: lndrpc_pb.NewAddressRequest, callback: (error: grpc.ServiceError | null, response: lndrpc_pb.NewAddressResponse) => void): grpc.ClientUnaryCall;
    public newAddress(request: lndrpc_pb.NewAddressRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: lndrpc_pb.NewAddressResponse) => void): grpc.ClientUnaryCall;
    public newAddress(request: lndrpc_pb.NewAddressRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: lndrpc_pb.NewAddressResponse) => void): grpc.ClientUnaryCall;
    public signMessage(request: lndrpc_pb.SignMessageRequest, callback: (error: grpc.ServiceError | null, response: lndrpc_pb.SignMessageResponse) => void): grpc.ClientUnaryCall;
    public signMessage(request: lndrpc_pb.SignMessageRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: lndrpc_pb.SignMessageResponse) => void): grpc.ClientUnaryCall;
    public signMessage(request: lndrpc_pb.SignMessageRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: lndrpc_pb.SignMessageResponse) => void): grpc.ClientUnaryCall;
    public verifyMessage(request: lndrpc_pb.VerifyMessageRequest, callback: (error: grpc.ServiceError | null, response: lndrpc_pb.VerifyMessageResponse) => void): grpc.ClientUnaryCall;
    public verifyMessage(request: lndrpc_pb.VerifyMessageRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: lndrpc_pb.VerifyMessageResponse) => void): grpc.ClientUnaryCall;
    public verifyMessage(request: lndrpc_pb.VerifyMessageRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: lndrpc_pb.VerifyMessageResponse) => void): grpc.ClientUnaryCall;
    public connectPeer(request: lndrpc_pb.ConnectPeerRequest, callback: (error: grpc.ServiceError | null, response: lndrpc_pb.ConnectPeerResponse) => void): grpc.ClientUnaryCall;
    public connectPeer(request: lndrpc_pb.ConnectPeerRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: lndrpc_pb.ConnectPeerResponse) => void): grpc.ClientUnaryCall;
    public connectPeer(request: lndrpc_pb.ConnectPeerRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: lndrpc_pb.ConnectPeerResponse) => void): grpc.ClientUnaryCall;
    public disconnectPeer(request: lndrpc_pb.DisconnectPeerRequest, callback: (error: grpc.ServiceError | null, response: lndrpc_pb.DisconnectPeerResponse) => void): grpc.ClientUnaryCall;
    public disconnectPeer(request: lndrpc_pb.DisconnectPeerRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: lndrpc_pb.DisconnectPeerResponse) => void): grpc.ClientUnaryCall;
    public disconnectPeer(request: lndrpc_pb.DisconnectPeerRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: lndrpc_pb.DisconnectPeerResponse) => void): grpc.ClientUnaryCall;
    public listPeers(request: lndrpc_pb.ListPeersRequest, callback: (error: grpc.ServiceError | null, response: lndrpc_pb.ListPeersResponse) => void): grpc.ClientUnaryCall;
    public listPeers(request: lndrpc_pb.ListPeersRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: lndrpc_pb.ListPeersResponse) => void): grpc.ClientUnaryCall;
    public listPeers(request: lndrpc_pb.ListPeersRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: lndrpc_pb.ListPeersResponse) => void): grpc.ClientUnaryCall;
    public subscribePeerEvents(request: lndrpc_pb.PeerEventSubscription, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<lndrpc_pb.PeerEvent>;
    public subscribePeerEvents(request: lndrpc_pb.PeerEventSubscription, metadata?: grpc.Metadata, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<lndrpc_pb.PeerEvent>;
    public getInfo(request: lndrpc_pb.GetInfoRequest, callback: (error: grpc.ServiceError | null, response: lndrpc_pb.GetInfoResponse) => void): grpc.ClientUnaryCall;
    public getInfo(request: lndrpc_pb.GetInfoRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: lndrpc_pb.GetInfoResponse) => void): grpc.ClientUnaryCall;
    public getInfo(request: lndrpc_pb.GetInfoRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: lndrpc_pb.GetInfoResponse) => void): grpc.ClientUnaryCall;
    public pendingChannels(request: lndrpc_pb.PendingChannelsRequest, callback: (error: grpc.ServiceError | null, response: lndrpc_pb.PendingChannelsResponse) => void): grpc.ClientUnaryCall;
    public pendingChannels(request: lndrpc_pb.PendingChannelsRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: lndrpc_pb.PendingChannelsResponse) => void): grpc.ClientUnaryCall;
    public pendingChannels(request: lndrpc_pb.PendingChannelsRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: lndrpc_pb.PendingChannelsResponse) => void): grpc.ClientUnaryCall;
    public listChannels(request: lndrpc_pb.ListChannelsRequest, callback: (error: grpc.ServiceError | null, response: lndrpc_pb.ListChannelsResponse) => void): grpc.ClientUnaryCall;
    public listChannels(request: lndrpc_pb.ListChannelsRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: lndrpc_pb.ListChannelsResponse) => void): grpc.ClientUnaryCall;
    public listChannels(request: lndrpc_pb.ListChannelsRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: lndrpc_pb.ListChannelsResponse) => void): grpc.ClientUnaryCall;
    public subscribeChannelEvents(request: lndrpc_pb.ChannelEventSubscription, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<lndrpc_pb.ChannelEventUpdate>;
    public subscribeChannelEvents(request: lndrpc_pb.ChannelEventSubscription, metadata?: grpc.Metadata, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<lndrpc_pb.ChannelEventUpdate>;
    public closedChannels(request: lndrpc_pb.ClosedChannelsRequest, callback: (error: grpc.ServiceError | null, response: lndrpc_pb.ClosedChannelsResponse) => void): grpc.ClientUnaryCall;
    public closedChannels(request: lndrpc_pb.ClosedChannelsRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: lndrpc_pb.ClosedChannelsResponse) => void): grpc.ClientUnaryCall;
    public closedChannels(request: lndrpc_pb.ClosedChannelsRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: lndrpc_pb.ClosedChannelsResponse) => void): grpc.ClientUnaryCall;
    public openChannelSync(request: lndrpc_pb.OpenChannelRequest, callback: (error: grpc.ServiceError | null, response: lndrpc_pb.ChannelPoint) => void): grpc.ClientUnaryCall;
    public openChannelSync(request: lndrpc_pb.OpenChannelRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: lndrpc_pb.ChannelPoint) => void): grpc.ClientUnaryCall;
    public openChannelSync(request: lndrpc_pb.OpenChannelRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: lndrpc_pb.ChannelPoint) => void): grpc.ClientUnaryCall;
    public openChannel(request: lndrpc_pb.OpenChannelRequest, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<lndrpc_pb.OpenStatusUpdate>;
    public openChannel(request: lndrpc_pb.OpenChannelRequest, metadata?: grpc.Metadata, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<lndrpc_pb.OpenStatusUpdate>;
    public fundingStateStep(request: lndrpc_pb.FundingTransitionMsg, callback: (error: grpc.ServiceError | null, response: lndrpc_pb.FundingStateStepResp) => void): grpc.ClientUnaryCall;
    public fundingStateStep(request: lndrpc_pb.FundingTransitionMsg, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: lndrpc_pb.FundingStateStepResp) => void): grpc.ClientUnaryCall;
    public fundingStateStep(request: lndrpc_pb.FundingTransitionMsg, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: lndrpc_pb.FundingStateStepResp) => void): grpc.ClientUnaryCall;
    public channelAcceptor(options?: Partial<grpc.CallOptions>): grpc.ClientDuplexStream<lndrpc_pb.ChannelAcceptResponse, lndrpc_pb.ChannelAcceptRequest>;
    public channelAcceptor(metadata?: grpc.Metadata, options?: Partial<grpc.CallOptions>): grpc.ClientDuplexStream<lndrpc_pb.ChannelAcceptResponse, lndrpc_pb.ChannelAcceptRequest>;
    public closeChannel(request: lndrpc_pb.CloseChannelRequest, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<lndrpc_pb.CloseStatusUpdate>;
    public closeChannel(request: lndrpc_pb.CloseChannelRequest, metadata?: grpc.Metadata, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<lndrpc_pb.CloseStatusUpdate>;
    public abandonChannel(request: lndrpc_pb.AbandonChannelRequest, callback: (error: grpc.ServiceError | null, response: lndrpc_pb.AbandonChannelResponse) => void): grpc.ClientUnaryCall;
    public abandonChannel(request: lndrpc_pb.AbandonChannelRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: lndrpc_pb.AbandonChannelResponse) => void): grpc.ClientUnaryCall;
    public abandonChannel(request: lndrpc_pb.AbandonChannelRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: lndrpc_pb.AbandonChannelResponse) => void): grpc.ClientUnaryCall;
    public sendPayment(options?: Partial<grpc.CallOptions>): grpc.ClientDuplexStream<lndrpc_pb.SendRequest, lndrpc_pb.SendResponse>;
    public sendPayment(metadata?: grpc.Metadata, options?: Partial<grpc.CallOptions>): grpc.ClientDuplexStream<lndrpc_pb.SendRequest, lndrpc_pb.SendResponse>;
    public sendPaymentSync(request: lndrpc_pb.SendRequest, callback: (error: grpc.ServiceError | null, response: lndrpc_pb.SendResponse) => void): grpc.ClientUnaryCall;
    public sendPaymentSync(request: lndrpc_pb.SendRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: lndrpc_pb.SendResponse) => void): grpc.ClientUnaryCall;
    public sendPaymentSync(request: lndrpc_pb.SendRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: lndrpc_pb.SendResponse) => void): grpc.ClientUnaryCall;
    public sendToRoute(options?: Partial<grpc.CallOptions>): grpc.ClientDuplexStream<lndrpc_pb.SendToRouteRequest, lndrpc_pb.SendResponse>;
    public sendToRoute(metadata?: grpc.Metadata, options?: Partial<grpc.CallOptions>): grpc.ClientDuplexStream<lndrpc_pb.SendToRouteRequest, lndrpc_pb.SendResponse>;
    public sendToRouteSync(request: lndrpc_pb.SendToRouteRequest, callback: (error: grpc.ServiceError | null, response: lndrpc_pb.SendResponse) => void): grpc.ClientUnaryCall;
    public sendToRouteSync(request: lndrpc_pb.SendToRouteRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: lndrpc_pb.SendResponse) => void): grpc.ClientUnaryCall;
    public sendToRouteSync(request: lndrpc_pb.SendToRouteRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: lndrpc_pb.SendResponse) => void): grpc.ClientUnaryCall;
    public addInvoice(request: lndrpc_pb.Invoice, callback: (error: grpc.ServiceError | null, response: lndrpc_pb.AddInvoiceResponse) => void): grpc.ClientUnaryCall;
    public addInvoice(request: lndrpc_pb.Invoice, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: lndrpc_pb.AddInvoiceResponse) => void): grpc.ClientUnaryCall;
    public addInvoice(request: lndrpc_pb.Invoice, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: lndrpc_pb.AddInvoiceResponse) => void): grpc.ClientUnaryCall;
    public listInvoices(request: lndrpc_pb.ListInvoiceRequest, callback: (error: grpc.ServiceError | null, response: lndrpc_pb.ListInvoiceResponse) => void): grpc.ClientUnaryCall;
    public listInvoices(request: lndrpc_pb.ListInvoiceRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: lndrpc_pb.ListInvoiceResponse) => void): grpc.ClientUnaryCall;
    public listInvoices(request: lndrpc_pb.ListInvoiceRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: lndrpc_pb.ListInvoiceResponse) => void): grpc.ClientUnaryCall;
    public lookupInvoice(request: lndrpc_pb.PaymentHash, callback: (error: grpc.ServiceError | null, response: lndrpc_pb.Invoice) => void): grpc.ClientUnaryCall;
    public lookupInvoice(request: lndrpc_pb.PaymentHash, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: lndrpc_pb.Invoice) => void): grpc.ClientUnaryCall;
    public lookupInvoice(request: lndrpc_pb.PaymentHash, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: lndrpc_pb.Invoice) => void): grpc.ClientUnaryCall;
    public subscribeInvoices(request: lndrpc_pb.InvoiceSubscription, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<lndrpc_pb.Invoice>;
    public subscribeInvoices(request: lndrpc_pb.InvoiceSubscription, metadata?: grpc.Metadata, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<lndrpc_pb.Invoice>;
    public decodePayReq(request: lndrpc_pb.PayReqString, callback: (error: grpc.ServiceError | null, response: lndrpc_pb.PayReq) => void): grpc.ClientUnaryCall;
    public decodePayReq(request: lndrpc_pb.PayReqString, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: lndrpc_pb.PayReq) => void): grpc.ClientUnaryCall;
    public decodePayReq(request: lndrpc_pb.PayReqString, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: lndrpc_pb.PayReq) => void): grpc.ClientUnaryCall;
    public listPayments(request: lndrpc_pb.ListPaymentsRequest, callback: (error: grpc.ServiceError | null, response: lndrpc_pb.ListPaymentsResponse) => void): grpc.ClientUnaryCall;
    public listPayments(request: lndrpc_pb.ListPaymentsRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: lndrpc_pb.ListPaymentsResponse) => void): grpc.ClientUnaryCall;
    public listPayments(request: lndrpc_pb.ListPaymentsRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: lndrpc_pb.ListPaymentsResponse) => void): grpc.ClientUnaryCall;
    public deleteAllPayments(request: lndrpc_pb.DeleteAllPaymentsRequest, callback: (error: grpc.ServiceError | null, response: lndrpc_pb.DeleteAllPaymentsResponse) => void): grpc.ClientUnaryCall;
    public deleteAllPayments(request: lndrpc_pb.DeleteAllPaymentsRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: lndrpc_pb.DeleteAllPaymentsResponse) => void): grpc.ClientUnaryCall;
    public deleteAllPayments(request: lndrpc_pb.DeleteAllPaymentsRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: lndrpc_pb.DeleteAllPaymentsResponse) => void): grpc.ClientUnaryCall;
    public describeGraph(request: lndrpc_pb.ChannelGraphRequest, callback: (error: grpc.ServiceError | null, response: lndrpc_pb.ChannelGraph) => void): grpc.ClientUnaryCall;
    public describeGraph(request: lndrpc_pb.ChannelGraphRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: lndrpc_pb.ChannelGraph) => void): grpc.ClientUnaryCall;
    public describeGraph(request: lndrpc_pb.ChannelGraphRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: lndrpc_pb.ChannelGraph) => void): grpc.ClientUnaryCall;
    public getNodeMetrics(request: lndrpc_pb.NodeMetricsRequest, callback: (error: grpc.ServiceError | null, response: lndrpc_pb.NodeMetricsResponse) => void): grpc.ClientUnaryCall;
    public getNodeMetrics(request: lndrpc_pb.NodeMetricsRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: lndrpc_pb.NodeMetricsResponse) => void): grpc.ClientUnaryCall;
    public getNodeMetrics(request: lndrpc_pb.NodeMetricsRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: lndrpc_pb.NodeMetricsResponse) => void): grpc.ClientUnaryCall;
    public getChanInfo(request: lndrpc_pb.ChanInfoRequest, callback: (error: grpc.ServiceError | null, response: lndrpc_pb.ChannelEdge) => void): grpc.ClientUnaryCall;
    public getChanInfo(request: lndrpc_pb.ChanInfoRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: lndrpc_pb.ChannelEdge) => void): grpc.ClientUnaryCall;
    public getChanInfo(request: lndrpc_pb.ChanInfoRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: lndrpc_pb.ChannelEdge) => void): grpc.ClientUnaryCall;
    public getNodeInfo(request: lndrpc_pb.NodeInfoRequest, callback: (error: grpc.ServiceError | null, response: lndrpc_pb.NodeInfo) => void): grpc.ClientUnaryCall;
    public getNodeInfo(request: lndrpc_pb.NodeInfoRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: lndrpc_pb.NodeInfo) => void): grpc.ClientUnaryCall;
    public getNodeInfo(request: lndrpc_pb.NodeInfoRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: lndrpc_pb.NodeInfo) => void): grpc.ClientUnaryCall;
    public queryRoutes(request: lndrpc_pb.QueryRoutesRequest, callback: (error: grpc.ServiceError | null, response: lndrpc_pb.QueryRoutesResponse) => void): grpc.ClientUnaryCall;
    public queryRoutes(request: lndrpc_pb.QueryRoutesRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: lndrpc_pb.QueryRoutesResponse) => void): grpc.ClientUnaryCall;
    public queryRoutes(request: lndrpc_pb.QueryRoutesRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: lndrpc_pb.QueryRoutesResponse) => void): grpc.ClientUnaryCall;
    public getNetworkInfo(request: lndrpc_pb.NetworkInfoRequest, callback: (error: grpc.ServiceError | null, response: lndrpc_pb.NetworkInfo) => void): grpc.ClientUnaryCall;
    public getNetworkInfo(request: lndrpc_pb.NetworkInfoRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: lndrpc_pb.NetworkInfo) => void): grpc.ClientUnaryCall;
    public getNetworkInfo(request: lndrpc_pb.NetworkInfoRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: lndrpc_pb.NetworkInfo) => void): grpc.ClientUnaryCall;
    public stopDaemon(request: lndrpc_pb.StopRequest, callback: (error: grpc.ServiceError | null, response: lndrpc_pb.StopResponse) => void): grpc.ClientUnaryCall;
    public stopDaemon(request: lndrpc_pb.StopRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: lndrpc_pb.StopResponse) => void): grpc.ClientUnaryCall;
    public stopDaemon(request: lndrpc_pb.StopRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: lndrpc_pb.StopResponse) => void): grpc.ClientUnaryCall;
    public subscribeChannelGraph(request: lndrpc_pb.GraphTopologySubscription, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<lndrpc_pb.GraphTopologyUpdate>;
    public subscribeChannelGraph(request: lndrpc_pb.GraphTopologySubscription, metadata?: grpc.Metadata, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<lndrpc_pb.GraphTopologyUpdate>;
    public debugLevel(request: lndrpc_pb.DebugLevelRequest, callback: (error: grpc.ServiceError | null, response: lndrpc_pb.DebugLevelResponse) => void): grpc.ClientUnaryCall;
    public debugLevel(request: lndrpc_pb.DebugLevelRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: lndrpc_pb.DebugLevelResponse) => void): grpc.ClientUnaryCall;
    public debugLevel(request: lndrpc_pb.DebugLevelRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: lndrpc_pb.DebugLevelResponse) => void): grpc.ClientUnaryCall;
    public feeReport(request: lndrpc_pb.FeeReportRequest, callback: (error: grpc.ServiceError | null, response: lndrpc_pb.FeeReportResponse) => void): grpc.ClientUnaryCall;
    public feeReport(request: lndrpc_pb.FeeReportRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: lndrpc_pb.FeeReportResponse) => void): grpc.ClientUnaryCall;
    public feeReport(request: lndrpc_pb.FeeReportRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: lndrpc_pb.FeeReportResponse) => void): grpc.ClientUnaryCall;
    public updateChannelPolicy(request: lndrpc_pb.PolicyUpdateRequest, callback: (error: grpc.ServiceError | null, response: lndrpc_pb.PolicyUpdateResponse) => void): grpc.ClientUnaryCall;
    public updateChannelPolicy(request: lndrpc_pb.PolicyUpdateRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: lndrpc_pb.PolicyUpdateResponse) => void): grpc.ClientUnaryCall;
    public updateChannelPolicy(request: lndrpc_pb.PolicyUpdateRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: lndrpc_pb.PolicyUpdateResponse) => void): grpc.ClientUnaryCall;
    public forwardingHistory(request: lndrpc_pb.ForwardingHistoryRequest, callback: (error: grpc.ServiceError | null, response: lndrpc_pb.ForwardingHistoryResponse) => void): grpc.ClientUnaryCall;
    public forwardingHistory(request: lndrpc_pb.ForwardingHistoryRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: lndrpc_pb.ForwardingHistoryResponse) => void): grpc.ClientUnaryCall;
    public forwardingHistory(request: lndrpc_pb.ForwardingHistoryRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: lndrpc_pb.ForwardingHistoryResponse) => void): grpc.ClientUnaryCall;
    public exportChannelBackup(request: lndrpc_pb.ExportChannelBackupRequest, callback: (error: grpc.ServiceError | null, response: lndrpc_pb.ChannelBackup) => void): grpc.ClientUnaryCall;
    public exportChannelBackup(request: lndrpc_pb.ExportChannelBackupRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: lndrpc_pb.ChannelBackup) => void): grpc.ClientUnaryCall;
    public exportChannelBackup(request: lndrpc_pb.ExportChannelBackupRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: lndrpc_pb.ChannelBackup) => void): grpc.ClientUnaryCall;
    public exportAllChannelBackups(request: lndrpc_pb.ChanBackupExportRequest, callback: (error: grpc.ServiceError | null, response: lndrpc_pb.ChanBackupSnapshot) => void): grpc.ClientUnaryCall;
    public exportAllChannelBackups(request: lndrpc_pb.ChanBackupExportRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: lndrpc_pb.ChanBackupSnapshot) => void): grpc.ClientUnaryCall;
    public exportAllChannelBackups(request: lndrpc_pb.ChanBackupExportRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: lndrpc_pb.ChanBackupSnapshot) => void): grpc.ClientUnaryCall;
    public verifyChanBackup(request: lndrpc_pb.ChanBackupSnapshot, callback: (error: grpc.ServiceError | null, response: lndrpc_pb.VerifyChanBackupResponse) => void): grpc.ClientUnaryCall;
    public verifyChanBackup(request: lndrpc_pb.ChanBackupSnapshot, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: lndrpc_pb.VerifyChanBackupResponse) => void): grpc.ClientUnaryCall;
    public verifyChanBackup(request: lndrpc_pb.ChanBackupSnapshot, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: lndrpc_pb.VerifyChanBackupResponse) => void): grpc.ClientUnaryCall;
    public restoreChannelBackups(request: lndrpc_pb.RestoreChanBackupRequest, callback: (error: grpc.ServiceError | null, response: lndrpc_pb.RestoreBackupResponse) => void): grpc.ClientUnaryCall;
    public restoreChannelBackups(request: lndrpc_pb.RestoreChanBackupRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: lndrpc_pb.RestoreBackupResponse) => void): grpc.ClientUnaryCall;
    public restoreChannelBackups(request: lndrpc_pb.RestoreChanBackupRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: lndrpc_pb.RestoreBackupResponse) => void): grpc.ClientUnaryCall;
    public subscribeChannelBackups(request: lndrpc_pb.ChannelBackupSubscription, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<lndrpc_pb.ChanBackupSnapshot>;
    public subscribeChannelBackups(request: lndrpc_pb.ChannelBackupSubscription, metadata?: grpc.Metadata, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<lndrpc_pb.ChanBackupSnapshot>;
    public bakeMacaroon(request: lndrpc_pb.BakeMacaroonRequest, callback: (error: grpc.ServiceError | null, response: lndrpc_pb.BakeMacaroonResponse) => void): grpc.ClientUnaryCall;
    public bakeMacaroon(request: lndrpc_pb.BakeMacaroonRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: lndrpc_pb.BakeMacaroonResponse) => void): grpc.ClientUnaryCall;
    public bakeMacaroon(request: lndrpc_pb.BakeMacaroonRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: lndrpc_pb.BakeMacaroonResponse) => void): grpc.ClientUnaryCall;
}
