// package: lnrpc
// file: lndrpc.proto

/* tslint:disable */

import * as grpc from "grpc";
import * as lndrpc_pb from "./lndrpc_pb";

interface IWalletUnlockerService extends grpc.ServiceDefinition<grpc.UntypedServiceImplementation> {
    genSeed: IWalletUnlockerService_IGenSeed;
    initWallet: IWalletUnlockerService_IInitWallet;
    unlockWallet: IWalletUnlockerService_IUnlockWallet;
    changePassword: IWalletUnlockerService_IChangePassword;
}

interface IWalletUnlockerService_IGenSeed extends grpc.MethodDefinition<lndrpc_pb.GenSeedRequest, lndrpc_pb.GenSeedResponse> {
    path: string; // "/lnrpc.WalletUnlocker/GenSeed"
    requestStream: boolean; // false
    responseStream: boolean; // false
    requestSerialize: grpc.serialize<lndrpc_pb.GenSeedRequest>;
    requestDeserialize: grpc.deserialize<lndrpc_pb.GenSeedRequest>;
    responseSerialize: grpc.serialize<lndrpc_pb.GenSeedResponse>;
    responseDeserialize: grpc.deserialize<lndrpc_pb.GenSeedResponse>;
}
interface IWalletUnlockerService_IInitWallet extends grpc.MethodDefinition<lndrpc_pb.InitWalletRequest, lndrpc_pb.InitWalletResponse> {
    path: string; // "/lnrpc.WalletUnlocker/InitWallet"
    requestStream: boolean; // false
    responseStream: boolean; // false
    requestSerialize: grpc.serialize<lndrpc_pb.InitWalletRequest>;
    requestDeserialize: grpc.deserialize<lndrpc_pb.InitWalletRequest>;
    responseSerialize: grpc.serialize<lndrpc_pb.InitWalletResponse>;
    responseDeserialize: grpc.deserialize<lndrpc_pb.InitWalletResponse>;
}
interface IWalletUnlockerService_IUnlockWallet extends grpc.MethodDefinition<lndrpc_pb.UnlockWalletRequest, lndrpc_pb.UnlockWalletResponse> {
    path: string; // "/lnrpc.WalletUnlocker/UnlockWallet"
    requestStream: boolean; // false
    responseStream: boolean; // false
    requestSerialize: grpc.serialize<lndrpc_pb.UnlockWalletRequest>;
    requestDeserialize: grpc.deserialize<lndrpc_pb.UnlockWalletRequest>;
    responseSerialize: grpc.serialize<lndrpc_pb.UnlockWalletResponse>;
    responseDeserialize: grpc.deserialize<lndrpc_pb.UnlockWalletResponse>;
}
interface IWalletUnlockerService_IChangePassword extends grpc.MethodDefinition<lndrpc_pb.ChangePasswordRequest, lndrpc_pb.ChangePasswordResponse> {
    path: string; // "/lnrpc.WalletUnlocker/ChangePassword"
    requestStream: boolean; // false
    responseStream: boolean; // false
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
    genSeed(request: lndrpc_pb.GenSeedRequest, callback: (error: Error | null, response: lndrpc_pb.GenSeedResponse) => void): grpc.ClientUnaryCall;
    genSeed(request: lndrpc_pb.GenSeedRequest, metadata: grpc.Metadata, callback: (error: Error | null, response: lndrpc_pb.GenSeedResponse) => void): grpc.ClientUnaryCall;
    genSeed(request: lndrpc_pb.GenSeedRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: Error | null, response: lndrpc_pb.GenSeedResponse) => void): grpc.ClientUnaryCall;
    initWallet(request: lndrpc_pb.InitWalletRequest, callback: (error: Error | null, response: lndrpc_pb.InitWalletResponse) => void): grpc.ClientUnaryCall;
    initWallet(request: lndrpc_pb.InitWalletRequest, metadata: grpc.Metadata, callback: (error: Error | null, response: lndrpc_pb.InitWalletResponse) => void): grpc.ClientUnaryCall;
    initWallet(request: lndrpc_pb.InitWalletRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: Error | null, response: lndrpc_pb.InitWalletResponse) => void): grpc.ClientUnaryCall;
    unlockWallet(request: lndrpc_pb.UnlockWalletRequest, callback: (error: Error | null, response: lndrpc_pb.UnlockWalletResponse) => void): grpc.ClientUnaryCall;
    unlockWallet(request: lndrpc_pb.UnlockWalletRequest, metadata: grpc.Metadata, callback: (error: Error | null, response: lndrpc_pb.UnlockWalletResponse) => void): grpc.ClientUnaryCall;
    unlockWallet(request: lndrpc_pb.UnlockWalletRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: Error | null, response: lndrpc_pb.UnlockWalletResponse) => void): grpc.ClientUnaryCall;
    changePassword(request: lndrpc_pb.ChangePasswordRequest, callback: (error: Error | null, response: lndrpc_pb.ChangePasswordResponse) => void): grpc.ClientUnaryCall;
    changePassword(request: lndrpc_pb.ChangePasswordRequest, metadata: grpc.Metadata, callback: (error: Error | null, response: lndrpc_pb.ChangePasswordResponse) => void): grpc.ClientUnaryCall;
    changePassword(request: lndrpc_pb.ChangePasswordRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: Error | null, response: lndrpc_pb.ChangePasswordResponse) => void): grpc.ClientUnaryCall;
}

export class WalletUnlockerClient extends grpc.Client implements IWalletUnlockerClient {
    constructor(address: string, credentials: grpc.ChannelCredentials, options?: object);
    public genSeed(request: lndrpc_pb.GenSeedRequest, callback: (error: Error | null, response: lndrpc_pb.GenSeedResponse) => void): grpc.ClientUnaryCall;
    public genSeed(request: lndrpc_pb.GenSeedRequest, metadata: grpc.Metadata, callback: (error: Error | null, response: lndrpc_pb.GenSeedResponse) => void): grpc.ClientUnaryCall;
    public genSeed(request: lndrpc_pb.GenSeedRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: Error | null, response: lndrpc_pb.GenSeedResponse) => void): grpc.ClientUnaryCall;
    public initWallet(request: lndrpc_pb.InitWalletRequest, callback: (error: Error | null, response: lndrpc_pb.InitWalletResponse) => void): grpc.ClientUnaryCall;
    public initWallet(request: lndrpc_pb.InitWalletRequest, metadata: grpc.Metadata, callback: (error: Error | null, response: lndrpc_pb.InitWalletResponse) => void): grpc.ClientUnaryCall;
    public initWallet(request: lndrpc_pb.InitWalletRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: Error | null, response: lndrpc_pb.InitWalletResponse) => void): grpc.ClientUnaryCall;
    public unlockWallet(request: lndrpc_pb.UnlockWalletRequest, callback: (error: Error | null, response: lndrpc_pb.UnlockWalletResponse) => void): grpc.ClientUnaryCall;
    public unlockWallet(request: lndrpc_pb.UnlockWalletRequest, metadata: grpc.Metadata, callback: (error: Error | null, response: lndrpc_pb.UnlockWalletResponse) => void): grpc.ClientUnaryCall;
    public unlockWallet(request: lndrpc_pb.UnlockWalletRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: Error | null, response: lndrpc_pb.UnlockWalletResponse) => void): grpc.ClientUnaryCall;
    public changePassword(request: lndrpc_pb.ChangePasswordRequest, callback: (error: Error | null, response: lndrpc_pb.ChangePasswordResponse) => void): grpc.ClientUnaryCall;
    public changePassword(request: lndrpc_pb.ChangePasswordRequest, metadata: grpc.Metadata, callback: (error: Error | null, response: lndrpc_pb.ChangePasswordResponse) => void): grpc.ClientUnaryCall;
    public changePassword(request: lndrpc_pb.ChangePasswordRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: Error | null, response: lndrpc_pb.ChangePasswordResponse) => void): grpc.ClientUnaryCall;
}

interface ILightningService extends grpc.ServiceDefinition<grpc.UntypedServiceImplementation> {
    walletBalance: ILightningService_IWalletBalance;
    channelBalance: ILightningService_IChannelBalance;
    getTransactions: ILightningService_IGetTransactions;
    sendCoins: ILightningService_ISendCoins;
    subscribeTransactions: ILightningService_ISubscribeTransactions;
    sendMany: ILightningService_ISendMany;
    newAddress: ILightningService_INewAddress;
    newWitnessAddress: ILightningService_INewWitnessAddress;
    signMessage: ILightningService_ISignMessage;
    verifyMessage: ILightningService_IVerifyMessage;
    connectPeer: ILightningService_IConnectPeer;
    disconnectPeer: ILightningService_IDisconnectPeer;
    listPeers: ILightningService_IListPeers;
    getInfo: ILightningService_IGetInfo;
    pendingChannels: ILightningService_IPendingChannels;
    listChannels: ILightningService_IListChannels;
    closedChannels: ILightningService_IClosedChannels;
    openChannelSync: ILightningService_IOpenChannelSync;
    openChannel: ILightningService_IOpenChannel;
    closeChannel: ILightningService_ICloseChannel;
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
}

interface ILightningService_IWalletBalance extends grpc.MethodDefinition<lndrpc_pb.WalletBalanceRequest, lndrpc_pb.WalletBalanceResponse> {
    path: string; // "/lnrpc.Lightning/WalletBalance"
    requestStream: boolean; // false
    responseStream: boolean; // false
    requestSerialize: grpc.serialize<lndrpc_pb.WalletBalanceRequest>;
    requestDeserialize: grpc.deserialize<lndrpc_pb.WalletBalanceRequest>;
    responseSerialize: grpc.serialize<lndrpc_pb.WalletBalanceResponse>;
    responseDeserialize: grpc.deserialize<lndrpc_pb.WalletBalanceResponse>;
}
interface ILightningService_IChannelBalance extends grpc.MethodDefinition<lndrpc_pb.ChannelBalanceRequest, lndrpc_pb.ChannelBalanceResponse> {
    path: string; // "/lnrpc.Lightning/ChannelBalance"
    requestStream: boolean; // false
    responseStream: boolean; // false
    requestSerialize: grpc.serialize<lndrpc_pb.ChannelBalanceRequest>;
    requestDeserialize: grpc.deserialize<lndrpc_pb.ChannelBalanceRequest>;
    responseSerialize: grpc.serialize<lndrpc_pb.ChannelBalanceResponse>;
    responseDeserialize: grpc.deserialize<lndrpc_pb.ChannelBalanceResponse>;
}
interface ILightningService_IGetTransactions extends grpc.MethodDefinition<lndrpc_pb.GetTransactionsRequest, lndrpc_pb.TransactionDetails> {
    path: string; // "/lnrpc.Lightning/GetTransactions"
    requestStream: boolean; // false
    responseStream: boolean; // false
    requestSerialize: grpc.serialize<lndrpc_pb.GetTransactionsRequest>;
    requestDeserialize: grpc.deserialize<lndrpc_pb.GetTransactionsRequest>;
    responseSerialize: grpc.serialize<lndrpc_pb.TransactionDetails>;
    responseDeserialize: grpc.deserialize<lndrpc_pb.TransactionDetails>;
}
interface ILightningService_ISendCoins extends grpc.MethodDefinition<lndrpc_pb.SendCoinsRequest, lndrpc_pb.SendCoinsResponse> {
    path: string; // "/lnrpc.Lightning/SendCoins"
    requestStream: boolean; // false
    responseStream: boolean; // false
    requestSerialize: grpc.serialize<lndrpc_pb.SendCoinsRequest>;
    requestDeserialize: grpc.deserialize<lndrpc_pb.SendCoinsRequest>;
    responseSerialize: grpc.serialize<lndrpc_pb.SendCoinsResponse>;
    responseDeserialize: grpc.deserialize<lndrpc_pb.SendCoinsResponse>;
}
interface ILightningService_ISubscribeTransactions extends grpc.MethodDefinition<lndrpc_pb.GetTransactionsRequest, lndrpc_pb.Transaction> {
    path: string; // "/lnrpc.Lightning/SubscribeTransactions"
    requestStream: boolean; // false
    responseStream: boolean; // true
    requestSerialize: grpc.serialize<lndrpc_pb.GetTransactionsRequest>;
    requestDeserialize: grpc.deserialize<lndrpc_pb.GetTransactionsRequest>;
    responseSerialize: grpc.serialize<lndrpc_pb.Transaction>;
    responseDeserialize: grpc.deserialize<lndrpc_pb.Transaction>;
}
interface ILightningService_ISendMany extends grpc.MethodDefinition<lndrpc_pb.SendManyRequest, lndrpc_pb.SendManyResponse> {
    path: string; // "/lnrpc.Lightning/SendMany"
    requestStream: boolean; // false
    responseStream: boolean; // false
    requestSerialize: grpc.serialize<lndrpc_pb.SendManyRequest>;
    requestDeserialize: grpc.deserialize<lndrpc_pb.SendManyRequest>;
    responseSerialize: grpc.serialize<lndrpc_pb.SendManyResponse>;
    responseDeserialize: grpc.deserialize<lndrpc_pb.SendManyResponse>;
}
interface ILightningService_INewAddress extends grpc.MethodDefinition<lndrpc_pb.NewAddressRequest, lndrpc_pb.NewAddressResponse> {
    path: string; // "/lnrpc.Lightning/NewAddress"
    requestStream: boolean; // false
    responseStream: boolean; // false
    requestSerialize: grpc.serialize<lndrpc_pb.NewAddressRequest>;
    requestDeserialize: grpc.deserialize<lndrpc_pb.NewAddressRequest>;
    responseSerialize: grpc.serialize<lndrpc_pb.NewAddressResponse>;
    responseDeserialize: grpc.deserialize<lndrpc_pb.NewAddressResponse>;
}
interface ILightningService_INewWitnessAddress extends grpc.MethodDefinition<lndrpc_pb.NewWitnessAddressRequest, lndrpc_pb.NewAddressResponse> {
    path: string; // "/lnrpc.Lightning/NewWitnessAddress"
    requestStream: boolean; // false
    responseStream: boolean; // false
    requestSerialize: grpc.serialize<lndrpc_pb.NewWitnessAddressRequest>;
    requestDeserialize: grpc.deserialize<lndrpc_pb.NewWitnessAddressRequest>;
    responseSerialize: grpc.serialize<lndrpc_pb.NewAddressResponse>;
    responseDeserialize: grpc.deserialize<lndrpc_pb.NewAddressResponse>;
}
interface ILightningService_ISignMessage extends grpc.MethodDefinition<lndrpc_pb.SignMessageRequest, lndrpc_pb.SignMessageResponse> {
    path: string; // "/lnrpc.Lightning/SignMessage"
    requestStream: boolean; // false
    responseStream: boolean; // false
    requestSerialize: grpc.serialize<lndrpc_pb.SignMessageRequest>;
    requestDeserialize: grpc.deserialize<lndrpc_pb.SignMessageRequest>;
    responseSerialize: grpc.serialize<lndrpc_pb.SignMessageResponse>;
    responseDeserialize: grpc.deserialize<lndrpc_pb.SignMessageResponse>;
}
interface ILightningService_IVerifyMessage extends grpc.MethodDefinition<lndrpc_pb.VerifyMessageRequest, lndrpc_pb.VerifyMessageResponse> {
    path: string; // "/lnrpc.Lightning/VerifyMessage"
    requestStream: boolean; // false
    responseStream: boolean; // false
    requestSerialize: grpc.serialize<lndrpc_pb.VerifyMessageRequest>;
    requestDeserialize: grpc.deserialize<lndrpc_pb.VerifyMessageRequest>;
    responseSerialize: grpc.serialize<lndrpc_pb.VerifyMessageResponse>;
    responseDeserialize: grpc.deserialize<lndrpc_pb.VerifyMessageResponse>;
}
interface ILightningService_IConnectPeer extends grpc.MethodDefinition<lndrpc_pb.ConnectPeerRequest, lndrpc_pb.ConnectPeerResponse> {
    path: string; // "/lnrpc.Lightning/ConnectPeer"
    requestStream: boolean; // false
    responseStream: boolean; // false
    requestSerialize: grpc.serialize<lndrpc_pb.ConnectPeerRequest>;
    requestDeserialize: grpc.deserialize<lndrpc_pb.ConnectPeerRequest>;
    responseSerialize: grpc.serialize<lndrpc_pb.ConnectPeerResponse>;
    responseDeserialize: grpc.deserialize<lndrpc_pb.ConnectPeerResponse>;
}
interface ILightningService_IDisconnectPeer extends grpc.MethodDefinition<lndrpc_pb.DisconnectPeerRequest, lndrpc_pb.DisconnectPeerResponse> {
    path: string; // "/lnrpc.Lightning/DisconnectPeer"
    requestStream: boolean; // false
    responseStream: boolean; // false
    requestSerialize: grpc.serialize<lndrpc_pb.DisconnectPeerRequest>;
    requestDeserialize: grpc.deserialize<lndrpc_pb.DisconnectPeerRequest>;
    responseSerialize: grpc.serialize<lndrpc_pb.DisconnectPeerResponse>;
    responseDeserialize: grpc.deserialize<lndrpc_pb.DisconnectPeerResponse>;
}
interface ILightningService_IListPeers extends grpc.MethodDefinition<lndrpc_pb.ListPeersRequest, lndrpc_pb.ListPeersResponse> {
    path: string; // "/lnrpc.Lightning/ListPeers"
    requestStream: boolean; // false
    responseStream: boolean; // false
    requestSerialize: grpc.serialize<lndrpc_pb.ListPeersRequest>;
    requestDeserialize: grpc.deserialize<lndrpc_pb.ListPeersRequest>;
    responseSerialize: grpc.serialize<lndrpc_pb.ListPeersResponse>;
    responseDeserialize: grpc.deserialize<lndrpc_pb.ListPeersResponse>;
}
interface ILightningService_IGetInfo extends grpc.MethodDefinition<lndrpc_pb.GetInfoRequest, lndrpc_pb.GetInfoResponse> {
    path: string; // "/lnrpc.Lightning/GetInfo"
    requestStream: boolean; // false
    responseStream: boolean; // false
    requestSerialize: grpc.serialize<lndrpc_pb.GetInfoRequest>;
    requestDeserialize: grpc.deserialize<lndrpc_pb.GetInfoRequest>;
    responseSerialize: grpc.serialize<lndrpc_pb.GetInfoResponse>;
    responseDeserialize: grpc.deserialize<lndrpc_pb.GetInfoResponse>;
}
interface ILightningService_IPendingChannels extends grpc.MethodDefinition<lndrpc_pb.PendingChannelsRequest, lndrpc_pb.PendingChannelsResponse> {
    path: string; // "/lnrpc.Lightning/PendingChannels"
    requestStream: boolean; // false
    responseStream: boolean; // false
    requestSerialize: grpc.serialize<lndrpc_pb.PendingChannelsRequest>;
    requestDeserialize: grpc.deserialize<lndrpc_pb.PendingChannelsRequest>;
    responseSerialize: grpc.serialize<lndrpc_pb.PendingChannelsResponse>;
    responseDeserialize: grpc.deserialize<lndrpc_pb.PendingChannelsResponse>;
}
interface ILightningService_IListChannels extends grpc.MethodDefinition<lndrpc_pb.ListChannelsRequest, lndrpc_pb.ListChannelsResponse> {
    path: string; // "/lnrpc.Lightning/ListChannels"
    requestStream: boolean; // false
    responseStream: boolean; // false
    requestSerialize: grpc.serialize<lndrpc_pb.ListChannelsRequest>;
    requestDeserialize: grpc.deserialize<lndrpc_pb.ListChannelsRequest>;
    responseSerialize: grpc.serialize<lndrpc_pb.ListChannelsResponse>;
    responseDeserialize: grpc.deserialize<lndrpc_pb.ListChannelsResponse>;
}
interface ILightningService_IClosedChannels extends grpc.MethodDefinition<lndrpc_pb.ClosedChannelsRequest, lndrpc_pb.ClosedChannelsResponse> {
    path: string; // "/lnrpc.Lightning/ClosedChannels"
    requestStream: boolean; // false
    responseStream: boolean; // false
    requestSerialize: grpc.serialize<lndrpc_pb.ClosedChannelsRequest>;
    requestDeserialize: grpc.deserialize<lndrpc_pb.ClosedChannelsRequest>;
    responseSerialize: grpc.serialize<lndrpc_pb.ClosedChannelsResponse>;
    responseDeserialize: grpc.deserialize<lndrpc_pb.ClosedChannelsResponse>;
}
interface ILightningService_IOpenChannelSync extends grpc.MethodDefinition<lndrpc_pb.OpenChannelRequest, lndrpc_pb.ChannelPoint> {
    path: string; // "/lnrpc.Lightning/OpenChannelSync"
    requestStream: boolean; // false
    responseStream: boolean; // false
    requestSerialize: grpc.serialize<lndrpc_pb.OpenChannelRequest>;
    requestDeserialize: grpc.deserialize<lndrpc_pb.OpenChannelRequest>;
    responseSerialize: grpc.serialize<lndrpc_pb.ChannelPoint>;
    responseDeserialize: grpc.deserialize<lndrpc_pb.ChannelPoint>;
}
interface ILightningService_IOpenChannel extends grpc.MethodDefinition<lndrpc_pb.OpenChannelRequest, lndrpc_pb.OpenStatusUpdate> {
    path: string; // "/lnrpc.Lightning/OpenChannel"
    requestStream: boolean; // false
    responseStream: boolean; // true
    requestSerialize: grpc.serialize<lndrpc_pb.OpenChannelRequest>;
    requestDeserialize: grpc.deserialize<lndrpc_pb.OpenChannelRequest>;
    responseSerialize: grpc.serialize<lndrpc_pb.OpenStatusUpdate>;
    responseDeserialize: grpc.deserialize<lndrpc_pb.OpenStatusUpdate>;
}
interface ILightningService_ICloseChannel extends grpc.MethodDefinition<lndrpc_pb.CloseChannelRequest, lndrpc_pb.CloseStatusUpdate> {
    path: string; // "/lnrpc.Lightning/CloseChannel"
    requestStream: boolean; // false
    responseStream: boolean; // true
    requestSerialize: grpc.serialize<lndrpc_pb.CloseChannelRequest>;
    requestDeserialize: grpc.deserialize<lndrpc_pb.CloseChannelRequest>;
    responseSerialize: grpc.serialize<lndrpc_pb.CloseStatusUpdate>;
    responseDeserialize: grpc.deserialize<lndrpc_pb.CloseStatusUpdate>;
}
interface ILightningService_ISendPayment extends grpc.MethodDefinition<lndrpc_pb.SendRequest, lndrpc_pb.SendResponse> {
    path: string; // "/lnrpc.Lightning/SendPayment"
    requestStream: boolean; // true
    responseStream: boolean; // true
    requestSerialize: grpc.serialize<lndrpc_pb.SendRequest>;
    requestDeserialize: grpc.deserialize<lndrpc_pb.SendRequest>;
    responseSerialize: grpc.serialize<lndrpc_pb.SendResponse>;
    responseDeserialize: grpc.deserialize<lndrpc_pb.SendResponse>;
}
interface ILightningService_ISendPaymentSync extends grpc.MethodDefinition<lndrpc_pb.SendRequest, lndrpc_pb.SendResponse> {
    path: string; // "/lnrpc.Lightning/SendPaymentSync"
    requestStream: boolean; // false
    responseStream: boolean; // false
    requestSerialize: grpc.serialize<lndrpc_pb.SendRequest>;
    requestDeserialize: grpc.deserialize<lndrpc_pb.SendRequest>;
    responseSerialize: grpc.serialize<lndrpc_pb.SendResponse>;
    responseDeserialize: grpc.deserialize<lndrpc_pb.SendResponse>;
}
interface ILightningService_ISendToRoute extends grpc.MethodDefinition<lndrpc_pb.SendToRouteRequest, lndrpc_pb.SendResponse> {
    path: string; // "/lnrpc.Lightning/SendToRoute"
    requestStream: boolean; // true
    responseStream: boolean; // true
    requestSerialize: grpc.serialize<lndrpc_pb.SendToRouteRequest>;
    requestDeserialize: grpc.deserialize<lndrpc_pb.SendToRouteRequest>;
    responseSerialize: grpc.serialize<lndrpc_pb.SendResponse>;
    responseDeserialize: grpc.deserialize<lndrpc_pb.SendResponse>;
}
interface ILightningService_ISendToRouteSync extends grpc.MethodDefinition<lndrpc_pb.SendToRouteRequest, lndrpc_pb.SendResponse> {
    path: string; // "/lnrpc.Lightning/SendToRouteSync"
    requestStream: boolean; // false
    responseStream: boolean; // false
    requestSerialize: grpc.serialize<lndrpc_pb.SendToRouteRequest>;
    requestDeserialize: grpc.deserialize<lndrpc_pb.SendToRouteRequest>;
    responseSerialize: grpc.serialize<lndrpc_pb.SendResponse>;
    responseDeserialize: grpc.deserialize<lndrpc_pb.SendResponse>;
}
interface ILightningService_IAddInvoice extends grpc.MethodDefinition<lndrpc_pb.Invoice, lndrpc_pb.AddInvoiceResponse> {
    path: string; // "/lnrpc.Lightning/AddInvoice"
    requestStream: boolean; // false
    responseStream: boolean; // false
    requestSerialize: grpc.serialize<lndrpc_pb.Invoice>;
    requestDeserialize: grpc.deserialize<lndrpc_pb.Invoice>;
    responseSerialize: grpc.serialize<lndrpc_pb.AddInvoiceResponse>;
    responseDeserialize: grpc.deserialize<lndrpc_pb.AddInvoiceResponse>;
}
interface ILightningService_IListInvoices extends grpc.MethodDefinition<lndrpc_pb.ListInvoiceRequest, lndrpc_pb.ListInvoiceResponse> {
    path: string; // "/lnrpc.Lightning/ListInvoices"
    requestStream: boolean; // false
    responseStream: boolean; // false
    requestSerialize: grpc.serialize<lndrpc_pb.ListInvoiceRequest>;
    requestDeserialize: grpc.deserialize<lndrpc_pb.ListInvoiceRequest>;
    responseSerialize: grpc.serialize<lndrpc_pb.ListInvoiceResponse>;
    responseDeserialize: grpc.deserialize<lndrpc_pb.ListInvoiceResponse>;
}
interface ILightningService_ILookupInvoice extends grpc.MethodDefinition<lndrpc_pb.PaymentHash, lndrpc_pb.Invoice> {
    path: string; // "/lnrpc.Lightning/LookupInvoice"
    requestStream: boolean; // false
    responseStream: boolean; // false
    requestSerialize: grpc.serialize<lndrpc_pb.PaymentHash>;
    requestDeserialize: grpc.deserialize<lndrpc_pb.PaymentHash>;
    responseSerialize: grpc.serialize<lndrpc_pb.Invoice>;
    responseDeserialize: grpc.deserialize<lndrpc_pb.Invoice>;
}
interface ILightningService_ISubscribeInvoices extends grpc.MethodDefinition<lndrpc_pb.InvoiceSubscription, lndrpc_pb.Invoice> {
    path: string; // "/lnrpc.Lightning/SubscribeInvoices"
    requestStream: boolean; // false
    responseStream: boolean; // true
    requestSerialize: grpc.serialize<lndrpc_pb.InvoiceSubscription>;
    requestDeserialize: grpc.deserialize<lndrpc_pb.InvoiceSubscription>;
    responseSerialize: grpc.serialize<lndrpc_pb.Invoice>;
    responseDeserialize: grpc.deserialize<lndrpc_pb.Invoice>;
}
interface ILightningService_IDecodePayReq extends grpc.MethodDefinition<lndrpc_pb.PayReqString, lndrpc_pb.PayReq> {
    path: string; // "/lnrpc.Lightning/DecodePayReq"
    requestStream: boolean; // false
    responseStream: boolean; // false
    requestSerialize: grpc.serialize<lndrpc_pb.PayReqString>;
    requestDeserialize: grpc.deserialize<lndrpc_pb.PayReqString>;
    responseSerialize: grpc.serialize<lndrpc_pb.PayReq>;
    responseDeserialize: grpc.deserialize<lndrpc_pb.PayReq>;
}
interface ILightningService_IListPayments extends grpc.MethodDefinition<lndrpc_pb.ListPaymentsRequest, lndrpc_pb.ListPaymentsResponse> {
    path: string; // "/lnrpc.Lightning/ListPayments"
    requestStream: boolean; // false
    responseStream: boolean; // false
    requestSerialize: grpc.serialize<lndrpc_pb.ListPaymentsRequest>;
    requestDeserialize: grpc.deserialize<lndrpc_pb.ListPaymentsRequest>;
    responseSerialize: grpc.serialize<lndrpc_pb.ListPaymentsResponse>;
    responseDeserialize: grpc.deserialize<lndrpc_pb.ListPaymentsResponse>;
}
interface ILightningService_IDeleteAllPayments extends grpc.MethodDefinition<lndrpc_pb.DeleteAllPaymentsRequest, lndrpc_pb.DeleteAllPaymentsResponse> {
    path: string; // "/lnrpc.Lightning/DeleteAllPayments"
    requestStream: boolean; // false
    responseStream: boolean; // false
    requestSerialize: grpc.serialize<lndrpc_pb.DeleteAllPaymentsRequest>;
    requestDeserialize: grpc.deserialize<lndrpc_pb.DeleteAllPaymentsRequest>;
    responseSerialize: grpc.serialize<lndrpc_pb.DeleteAllPaymentsResponse>;
    responseDeserialize: grpc.deserialize<lndrpc_pb.DeleteAllPaymentsResponse>;
}
interface ILightningService_IDescribeGraph extends grpc.MethodDefinition<lndrpc_pb.ChannelGraphRequest, lndrpc_pb.ChannelGraph> {
    path: string; // "/lnrpc.Lightning/DescribeGraph"
    requestStream: boolean; // false
    responseStream: boolean; // false
    requestSerialize: grpc.serialize<lndrpc_pb.ChannelGraphRequest>;
    requestDeserialize: grpc.deserialize<lndrpc_pb.ChannelGraphRequest>;
    responseSerialize: grpc.serialize<lndrpc_pb.ChannelGraph>;
    responseDeserialize: grpc.deserialize<lndrpc_pb.ChannelGraph>;
}
interface ILightningService_IGetChanInfo extends grpc.MethodDefinition<lndrpc_pb.ChanInfoRequest, lndrpc_pb.ChannelEdge> {
    path: string; // "/lnrpc.Lightning/GetChanInfo"
    requestStream: boolean; // false
    responseStream: boolean; // false
    requestSerialize: grpc.serialize<lndrpc_pb.ChanInfoRequest>;
    requestDeserialize: grpc.deserialize<lndrpc_pb.ChanInfoRequest>;
    responseSerialize: grpc.serialize<lndrpc_pb.ChannelEdge>;
    responseDeserialize: grpc.deserialize<lndrpc_pb.ChannelEdge>;
}
interface ILightningService_IGetNodeInfo extends grpc.MethodDefinition<lndrpc_pb.NodeInfoRequest, lndrpc_pb.NodeInfo> {
    path: string; // "/lnrpc.Lightning/GetNodeInfo"
    requestStream: boolean; // false
    responseStream: boolean; // false
    requestSerialize: grpc.serialize<lndrpc_pb.NodeInfoRequest>;
    requestDeserialize: grpc.deserialize<lndrpc_pb.NodeInfoRequest>;
    responseSerialize: grpc.serialize<lndrpc_pb.NodeInfo>;
    responseDeserialize: grpc.deserialize<lndrpc_pb.NodeInfo>;
}
interface ILightningService_IQueryRoutes extends grpc.MethodDefinition<lndrpc_pb.QueryRoutesRequest, lndrpc_pb.QueryRoutesResponse> {
    path: string; // "/lnrpc.Lightning/QueryRoutes"
    requestStream: boolean; // false
    responseStream: boolean; // false
    requestSerialize: grpc.serialize<lndrpc_pb.QueryRoutesRequest>;
    requestDeserialize: grpc.deserialize<lndrpc_pb.QueryRoutesRequest>;
    responseSerialize: grpc.serialize<lndrpc_pb.QueryRoutesResponse>;
    responseDeserialize: grpc.deserialize<lndrpc_pb.QueryRoutesResponse>;
}
interface ILightningService_IGetNetworkInfo extends grpc.MethodDefinition<lndrpc_pb.NetworkInfoRequest, lndrpc_pb.NetworkInfo> {
    path: string; // "/lnrpc.Lightning/GetNetworkInfo"
    requestStream: boolean; // false
    responseStream: boolean; // false
    requestSerialize: grpc.serialize<lndrpc_pb.NetworkInfoRequest>;
    requestDeserialize: grpc.deserialize<lndrpc_pb.NetworkInfoRequest>;
    responseSerialize: grpc.serialize<lndrpc_pb.NetworkInfo>;
    responseDeserialize: grpc.deserialize<lndrpc_pb.NetworkInfo>;
}
interface ILightningService_IStopDaemon extends grpc.MethodDefinition<lndrpc_pb.StopRequest, lndrpc_pb.StopResponse> {
    path: string; // "/lnrpc.Lightning/StopDaemon"
    requestStream: boolean; // false
    responseStream: boolean; // false
    requestSerialize: grpc.serialize<lndrpc_pb.StopRequest>;
    requestDeserialize: grpc.deserialize<lndrpc_pb.StopRequest>;
    responseSerialize: grpc.serialize<lndrpc_pb.StopResponse>;
    responseDeserialize: grpc.deserialize<lndrpc_pb.StopResponse>;
}
interface ILightningService_ISubscribeChannelGraph extends grpc.MethodDefinition<lndrpc_pb.GraphTopologySubscription, lndrpc_pb.GraphTopologyUpdate> {
    path: string; // "/lnrpc.Lightning/SubscribeChannelGraph"
    requestStream: boolean; // false
    responseStream: boolean; // true
    requestSerialize: grpc.serialize<lndrpc_pb.GraphTopologySubscription>;
    requestDeserialize: grpc.deserialize<lndrpc_pb.GraphTopologySubscription>;
    responseSerialize: grpc.serialize<lndrpc_pb.GraphTopologyUpdate>;
    responseDeserialize: grpc.deserialize<lndrpc_pb.GraphTopologyUpdate>;
}
interface ILightningService_IDebugLevel extends grpc.MethodDefinition<lndrpc_pb.DebugLevelRequest, lndrpc_pb.DebugLevelResponse> {
    path: string; // "/lnrpc.Lightning/DebugLevel"
    requestStream: boolean; // false
    responseStream: boolean; // false
    requestSerialize: grpc.serialize<lndrpc_pb.DebugLevelRequest>;
    requestDeserialize: grpc.deserialize<lndrpc_pb.DebugLevelRequest>;
    responseSerialize: grpc.serialize<lndrpc_pb.DebugLevelResponse>;
    responseDeserialize: grpc.deserialize<lndrpc_pb.DebugLevelResponse>;
}
interface ILightningService_IFeeReport extends grpc.MethodDefinition<lndrpc_pb.FeeReportRequest, lndrpc_pb.FeeReportResponse> {
    path: string; // "/lnrpc.Lightning/FeeReport"
    requestStream: boolean; // false
    responseStream: boolean; // false
    requestSerialize: grpc.serialize<lndrpc_pb.FeeReportRequest>;
    requestDeserialize: grpc.deserialize<lndrpc_pb.FeeReportRequest>;
    responseSerialize: grpc.serialize<lndrpc_pb.FeeReportResponse>;
    responseDeserialize: grpc.deserialize<lndrpc_pb.FeeReportResponse>;
}
interface ILightningService_IUpdateChannelPolicy extends grpc.MethodDefinition<lndrpc_pb.PolicyUpdateRequest, lndrpc_pb.PolicyUpdateResponse> {
    path: string; // "/lnrpc.Lightning/UpdateChannelPolicy"
    requestStream: boolean; // false
    responseStream: boolean; // false
    requestSerialize: grpc.serialize<lndrpc_pb.PolicyUpdateRequest>;
    requestDeserialize: grpc.deserialize<lndrpc_pb.PolicyUpdateRequest>;
    responseSerialize: grpc.serialize<lndrpc_pb.PolicyUpdateResponse>;
    responseDeserialize: grpc.deserialize<lndrpc_pb.PolicyUpdateResponse>;
}
interface ILightningService_IForwardingHistory extends grpc.MethodDefinition<lndrpc_pb.ForwardingHistoryRequest, lndrpc_pb.ForwardingHistoryResponse> {
    path: string; // "/lnrpc.Lightning/ForwardingHistory"
    requestStream: boolean; // false
    responseStream: boolean; // false
    requestSerialize: grpc.serialize<lndrpc_pb.ForwardingHistoryRequest>;
    requestDeserialize: grpc.deserialize<lndrpc_pb.ForwardingHistoryRequest>;
    responseSerialize: grpc.serialize<lndrpc_pb.ForwardingHistoryResponse>;
    responseDeserialize: grpc.deserialize<lndrpc_pb.ForwardingHistoryResponse>;
}

export const LightningService: ILightningService;

export interface ILightningServer {
    walletBalance: grpc.handleUnaryCall<lndrpc_pb.WalletBalanceRequest, lndrpc_pb.WalletBalanceResponse>;
    channelBalance: grpc.handleUnaryCall<lndrpc_pb.ChannelBalanceRequest, lndrpc_pb.ChannelBalanceResponse>;
    getTransactions: grpc.handleUnaryCall<lndrpc_pb.GetTransactionsRequest, lndrpc_pb.TransactionDetails>;
    sendCoins: grpc.handleUnaryCall<lndrpc_pb.SendCoinsRequest, lndrpc_pb.SendCoinsResponse>;
    subscribeTransactions: grpc.handleServerStreamingCall<lndrpc_pb.GetTransactionsRequest, lndrpc_pb.Transaction>;
    sendMany: grpc.handleUnaryCall<lndrpc_pb.SendManyRequest, lndrpc_pb.SendManyResponse>;
    newAddress: grpc.handleUnaryCall<lndrpc_pb.NewAddressRequest, lndrpc_pb.NewAddressResponse>;
    newWitnessAddress: grpc.handleUnaryCall<lndrpc_pb.NewWitnessAddressRequest, lndrpc_pb.NewAddressResponse>;
    signMessage: grpc.handleUnaryCall<lndrpc_pb.SignMessageRequest, lndrpc_pb.SignMessageResponse>;
    verifyMessage: grpc.handleUnaryCall<lndrpc_pb.VerifyMessageRequest, lndrpc_pb.VerifyMessageResponse>;
    connectPeer: grpc.handleUnaryCall<lndrpc_pb.ConnectPeerRequest, lndrpc_pb.ConnectPeerResponse>;
    disconnectPeer: grpc.handleUnaryCall<lndrpc_pb.DisconnectPeerRequest, lndrpc_pb.DisconnectPeerResponse>;
    listPeers: grpc.handleUnaryCall<lndrpc_pb.ListPeersRequest, lndrpc_pb.ListPeersResponse>;
    getInfo: grpc.handleUnaryCall<lndrpc_pb.GetInfoRequest, lndrpc_pb.GetInfoResponse>;
    pendingChannels: grpc.handleUnaryCall<lndrpc_pb.PendingChannelsRequest, lndrpc_pb.PendingChannelsResponse>;
    listChannels: grpc.handleUnaryCall<lndrpc_pb.ListChannelsRequest, lndrpc_pb.ListChannelsResponse>;
    closedChannels: grpc.handleUnaryCall<lndrpc_pb.ClosedChannelsRequest, lndrpc_pb.ClosedChannelsResponse>;
    openChannelSync: grpc.handleUnaryCall<lndrpc_pb.OpenChannelRequest, lndrpc_pb.ChannelPoint>;
    openChannel: grpc.handleServerStreamingCall<lndrpc_pb.OpenChannelRequest, lndrpc_pb.OpenStatusUpdate>;
    closeChannel: grpc.handleServerStreamingCall<lndrpc_pb.CloseChannelRequest, lndrpc_pb.CloseStatusUpdate>;
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
}

export interface ILightningClient {
    walletBalance(request: lndrpc_pb.WalletBalanceRequest, callback: (error: Error | null, response: lndrpc_pb.WalletBalanceResponse) => void): grpc.ClientUnaryCall;
    walletBalance(request: lndrpc_pb.WalletBalanceRequest, metadata: grpc.Metadata, callback: (error: Error | null, response: lndrpc_pb.WalletBalanceResponse) => void): grpc.ClientUnaryCall;
    walletBalance(request: lndrpc_pb.WalletBalanceRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: Error | null, response: lndrpc_pb.WalletBalanceResponse) => void): grpc.ClientUnaryCall;
    channelBalance(request: lndrpc_pb.ChannelBalanceRequest, callback: (error: Error | null, response: lndrpc_pb.ChannelBalanceResponse) => void): grpc.ClientUnaryCall;
    channelBalance(request: lndrpc_pb.ChannelBalanceRequest, metadata: grpc.Metadata, callback: (error: Error | null, response: lndrpc_pb.ChannelBalanceResponse) => void): grpc.ClientUnaryCall;
    channelBalance(request: lndrpc_pb.ChannelBalanceRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: Error | null, response: lndrpc_pb.ChannelBalanceResponse) => void): grpc.ClientUnaryCall;
    getTransactions(request: lndrpc_pb.GetTransactionsRequest, callback: (error: Error | null, response: lndrpc_pb.TransactionDetails) => void): grpc.ClientUnaryCall;
    getTransactions(request: lndrpc_pb.GetTransactionsRequest, metadata: grpc.Metadata, callback: (error: Error | null, response: lndrpc_pb.TransactionDetails) => void): grpc.ClientUnaryCall;
    getTransactions(request: lndrpc_pb.GetTransactionsRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: Error | null, response: lndrpc_pb.TransactionDetails) => void): grpc.ClientUnaryCall;
    sendCoins(request: lndrpc_pb.SendCoinsRequest, callback: (error: Error | null, response: lndrpc_pb.SendCoinsResponse) => void): grpc.ClientUnaryCall;
    sendCoins(request: lndrpc_pb.SendCoinsRequest, metadata: grpc.Metadata, callback: (error: Error | null, response: lndrpc_pb.SendCoinsResponse) => void): grpc.ClientUnaryCall;
    sendCoins(request: lndrpc_pb.SendCoinsRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: Error | null, response: lndrpc_pb.SendCoinsResponse) => void): grpc.ClientUnaryCall;
    subscribeTransactions(request: lndrpc_pb.GetTransactionsRequest, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<lndrpc_pb.Transaction>;
    subscribeTransactions(request: lndrpc_pb.GetTransactionsRequest, metadata?: grpc.Metadata, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<lndrpc_pb.Transaction>;
    sendMany(request: lndrpc_pb.SendManyRequest, callback: (error: Error | null, response: lndrpc_pb.SendManyResponse) => void): grpc.ClientUnaryCall;
    sendMany(request: lndrpc_pb.SendManyRequest, metadata: grpc.Metadata, callback: (error: Error | null, response: lndrpc_pb.SendManyResponse) => void): grpc.ClientUnaryCall;
    sendMany(request: lndrpc_pb.SendManyRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: Error | null, response: lndrpc_pb.SendManyResponse) => void): grpc.ClientUnaryCall;
    newAddress(request: lndrpc_pb.NewAddressRequest, callback: (error: Error | null, response: lndrpc_pb.NewAddressResponse) => void): grpc.ClientUnaryCall;
    newAddress(request: lndrpc_pb.NewAddressRequest, metadata: grpc.Metadata, callback: (error: Error | null, response: lndrpc_pb.NewAddressResponse) => void): grpc.ClientUnaryCall;
    newAddress(request: lndrpc_pb.NewAddressRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: Error | null, response: lndrpc_pb.NewAddressResponse) => void): grpc.ClientUnaryCall;
    newWitnessAddress(request: lndrpc_pb.NewWitnessAddressRequest, callback: (error: Error | null, response: lndrpc_pb.NewAddressResponse) => void): grpc.ClientUnaryCall;
    newWitnessAddress(request: lndrpc_pb.NewWitnessAddressRequest, metadata: grpc.Metadata, callback: (error: Error | null, response: lndrpc_pb.NewAddressResponse) => void): grpc.ClientUnaryCall;
    newWitnessAddress(request: lndrpc_pb.NewWitnessAddressRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: Error | null, response: lndrpc_pb.NewAddressResponse) => void): grpc.ClientUnaryCall;
    signMessage(request: lndrpc_pb.SignMessageRequest, callback: (error: Error | null, response: lndrpc_pb.SignMessageResponse) => void): grpc.ClientUnaryCall;
    signMessage(request: lndrpc_pb.SignMessageRequest, metadata: grpc.Metadata, callback: (error: Error | null, response: lndrpc_pb.SignMessageResponse) => void): grpc.ClientUnaryCall;
    signMessage(request: lndrpc_pb.SignMessageRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: Error | null, response: lndrpc_pb.SignMessageResponse) => void): grpc.ClientUnaryCall;
    verifyMessage(request: lndrpc_pb.VerifyMessageRequest, callback: (error: Error | null, response: lndrpc_pb.VerifyMessageResponse) => void): grpc.ClientUnaryCall;
    verifyMessage(request: lndrpc_pb.VerifyMessageRequest, metadata: grpc.Metadata, callback: (error: Error | null, response: lndrpc_pb.VerifyMessageResponse) => void): grpc.ClientUnaryCall;
    verifyMessage(request: lndrpc_pb.VerifyMessageRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: Error | null, response: lndrpc_pb.VerifyMessageResponse) => void): grpc.ClientUnaryCall;
    connectPeer(request: lndrpc_pb.ConnectPeerRequest, callback: (error: Error | null, response: lndrpc_pb.ConnectPeerResponse) => void): grpc.ClientUnaryCall;
    connectPeer(request: lndrpc_pb.ConnectPeerRequest, metadata: grpc.Metadata, callback: (error: Error | null, response: lndrpc_pb.ConnectPeerResponse) => void): grpc.ClientUnaryCall;
    connectPeer(request: lndrpc_pb.ConnectPeerRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: Error | null, response: lndrpc_pb.ConnectPeerResponse) => void): grpc.ClientUnaryCall;
    disconnectPeer(request: lndrpc_pb.DisconnectPeerRequest, callback: (error: Error | null, response: lndrpc_pb.DisconnectPeerResponse) => void): grpc.ClientUnaryCall;
    disconnectPeer(request: lndrpc_pb.DisconnectPeerRequest, metadata: grpc.Metadata, callback: (error: Error | null, response: lndrpc_pb.DisconnectPeerResponse) => void): grpc.ClientUnaryCall;
    disconnectPeer(request: lndrpc_pb.DisconnectPeerRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: Error | null, response: lndrpc_pb.DisconnectPeerResponse) => void): grpc.ClientUnaryCall;
    listPeers(request: lndrpc_pb.ListPeersRequest, callback: (error: Error | null, response: lndrpc_pb.ListPeersResponse) => void): grpc.ClientUnaryCall;
    listPeers(request: lndrpc_pb.ListPeersRequest, metadata: grpc.Metadata, callback: (error: Error | null, response: lndrpc_pb.ListPeersResponse) => void): grpc.ClientUnaryCall;
    listPeers(request: lndrpc_pb.ListPeersRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: Error | null, response: lndrpc_pb.ListPeersResponse) => void): grpc.ClientUnaryCall;
    getInfo(request: lndrpc_pb.GetInfoRequest, callback: (error: Error | null, response: lndrpc_pb.GetInfoResponse) => void): grpc.ClientUnaryCall;
    getInfo(request: lndrpc_pb.GetInfoRequest, metadata: grpc.Metadata, callback: (error: Error | null, response: lndrpc_pb.GetInfoResponse) => void): grpc.ClientUnaryCall;
    getInfo(request: lndrpc_pb.GetInfoRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: Error | null, response: lndrpc_pb.GetInfoResponse) => void): grpc.ClientUnaryCall;
    pendingChannels(request: lndrpc_pb.PendingChannelsRequest, callback: (error: Error | null, response: lndrpc_pb.PendingChannelsResponse) => void): grpc.ClientUnaryCall;
    pendingChannels(request: lndrpc_pb.PendingChannelsRequest, metadata: grpc.Metadata, callback: (error: Error | null, response: lndrpc_pb.PendingChannelsResponse) => void): grpc.ClientUnaryCall;
    pendingChannels(request: lndrpc_pb.PendingChannelsRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: Error | null, response: lndrpc_pb.PendingChannelsResponse) => void): grpc.ClientUnaryCall;
    listChannels(request: lndrpc_pb.ListChannelsRequest, callback: (error: Error | null, response: lndrpc_pb.ListChannelsResponse) => void): grpc.ClientUnaryCall;
    listChannels(request: lndrpc_pb.ListChannelsRequest, metadata: grpc.Metadata, callback: (error: Error | null, response: lndrpc_pb.ListChannelsResponse) => void): grpc.ClientUnaryCall;
    listChannels(request: lndrpc_pb.ListChannelsRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: Error | null, response: lndrpc_pb.ListChannelsResponse) => void): grpc.ClientUnaryCall;
    closedChannels(request: lndrpc_pb.ClosedChannelsRequest, callback: (error: Error | null, response: lndrpc_pb.ClosedChannelsResponse) => void): grpc.ClientUnaryCall;
    closedChannels(request: lndrpc_pb.ClosedChannelsRequest, metadata: grpc.Metadata, callback: (error: Error | null, response: lndrpc_pb.ClosedChannelsResponse) => void): grpc.ClientUnaryCall;
    closedChannels(request: lndrpc_pb.ClosedChannelsRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: Error | null, response: lndrpc_pb.ClosedChannelsResponse) => void): grpc.ClientUnaryCall;
    openChannelSync(request: lndrpc_pb.OpenChannelRequest, callback: (error: Error | null, response: lndrpc_pb.ChannelPoint) => void): grpc.ClientUnaryCall;
    openChannelSync(request: lndrpc_pb.OpenChannelRequest, metadata: grpc.Metadata, callback: (error: Error | null, response: lndrpc_pb.ChannelPoint) => void): grpc.ClientUnaryCall;
    openChannelSync(request: lndrpc_pb.OpenChannelRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: Error | null, response: lndrpc_pb.ChannelPoint) => void): grpc.ClientUnaryCall;
    openChannel(request: lndrpc_pb.OpenChannelRequest, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<lndrpc_pb.OpenStatusUpdate>;
    openChannel(request: lndrpc_pb.OpenChannelRequest, metadata?: grpc.Metadata, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<lndrpc_pb.OpenStatusUpdate>;
    closeChannel(request: lndrpc_pb.CloseChannelRequest, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<lndrpc_pb.CloseStatusUpdate>;
    closeChannel(request: lndrpc_pb.CloseChannelRequest, metadata?: grpc.Metadata, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<lndrpc_pb.CloseStatusUpdate>;
    sendPayment(): grpc.ClientDuplexStream<lndrpc_pb.SendRequest, lndrpc_pb.SendResponse>;
    sendPayment(options: Partial<grpc.CallOptions>): grpc.ClientDuplexStream<lndrpc_pb.SendRequest, lndrpc_pb.SendResponse>;
    sendPayment(metadata: grpc.Metadata, options?: Partial<grpc.CallOptions>): grpc.ClientDuplexStream<lndrpc_pb.SendRequest, lndrpc_pb.SendResponse>;
    sendPaymentSync(request: lndrpc_pb.SendRequest, callback: (error: Error | null, response: lndrpc_pb.SendResponse) => void): grpc.ClientUnaryCall;
    sendPaymentSync(request: lndrpc_pb.SendRequest, metadata: grpc.Metadata, callback: (error: Error | null, response: lndrpc_pb.SendResponse) => void): grpc.ClientUnaryCall;
    sendPaymentSync(request: lndrpc_pb.SendRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: Error | null, response: lndrpc_pb.SendResponse) => void): grpc.ClientUnaryCall;
    sendToRoute(): grpc.ClientDuplexStream<lndrpc_pb.SendToRouteRequest, lndrpc_pb.SendResponse>;
    sendToRoute(options: Partial<grpc.CallOptions>): grpc.ClientDuplexStream<lndrpc_pb.SendToRouteRequest, lndrpc_pb.SendResponse>;
    sendToRoute(metadata: grpc.Metadata, options?: Partial<grpc.CallOptions>): grpc.ClientDuplexStream<lndrpc_pb.SendToRouteRequest, lndrpc_pb.SendResponse>;
    sendToRouteSync(request: lndrpc_pb.SendToRouteRequest, callback: (error: Error | null, response: lndrpc_pb.SendResponse) => void): grpc.ClientUnaryCall;
    sendToRouteSync(request: lndrpc_pb.SendToRouteRequest, metadata: grpc.Metadata, callback: (error: Error | null, response: lndrpc_pb.SendResponse) => void): grpc.ClientUnaryCall;
    sendToRouteSync(request: lndrpc_pb.SendToRouteRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: Error | null, response: lndrpc_pb.SendResponse) => void): grpc.ClientUnaryCall;
    addInvoice(request: lndrpc_pb.Invoice, callback: (error: Error | null, response: lndrpc_pb.AddInvoiceResponse) => void): grpc.ClientUnaryCall;
    addInvoice(request: lndrpc_pb.Invoice, metadata: grpc.Metadata, callback: (error: Error | null, response: lndrpc_pb.AddInvoiceResponse) => void): grpc.ClientUnaryCall;
    addInvoice(request: lndrpc_pb.Invoice, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: Error | null, response: lndrpc_pb.AddInvoiceResponse) => void): grpc.ClientUnaryCall;
    listInvoices(request: lndrpc_pb.ListInvoiceRequest, callback: (error: Error | null, response: lndrpc_pb.ListInvoiceResponse) => void): grpc.ClientUnaryCall;
    listInvoices(request: lndrpc_pb.ListInvoiceRequest, metadata: grpc.Metadata, callback: (error: Error | null, response: lndrpc_pb.ListInvoiceResponse) => void): grpc.ClientUnaryCall;
    listInvoices(request: lndrpc_pb.ListInvoiceRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: Error | null, response: lndrpc_pb.ListInvoiceResponse) => void): grpc.ClientUnaryCall;
    lookupInvoice(request: lndrpc_pb.PaymentHash, callback: (error: Error | null, response: lndrpc_pb.Invoice) => void): grpc.ClientUnaryCall;
    lookupInvoice(request: lndrpc_pb.PaymentHash, metadata: grpc.Metadata, callback: (error: Error | null, response: lndrpc_pb.Invoice) => void): grpc.ClientUnaryCall;
    lookupInvoice(request: lndrpc_pb.PaymentHash, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: Error | null, response: lndrpc_pb.Invoice) => void): grpc.ClientUnaryCall;
    subscribeInvoices(request: lndrpc_pb.InvoiceSubscription, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<lndrpc_pb.Invoice>;
    subscribeInvoices(request: lndrpc_pb.InvoiceSubscription, metadata?: grpc.Metadata, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<lndrpc_pb.Invoice>;
    decodePayReq(request: lndrpc_pb.PayReqString, callback: (error: Error | null, response: lndrpc_pb.PayReq) => void): grpc.ClientUnaryCall;
    decodePayReq(request: lndrpc_pb.PayReqString, metadata: grpc.Metadata, callback: (error: Error | null, response: lndrpc_pb.PayReq) => void): grpc.ClientUnaryCall;
    decodePayReq(request: lndrpc_pb.PayReqString, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: Error | null, response: lndrpc_pb.PayReq) => void): grpc.ClientUnaryCall;
    listPayments(request: lndrpc_pb.ListPaymentsRequest, callback: (error: Error | null, response: lndrpc_pb.ListPaymentsResponse) => void): grpc.ClientUnaryCall;
    listPayments(request: lndrpc_pb.ListPaymentsRequest, metadata: grpc.Metadata, callback: (error: Error | null, response: lndrpc_pb.ListPaymentsResponse) => void): grpc.ClientUnaryCall;
    listPayments(request: lndrpc_pb.ListPaymentsRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: Error | null, response: lndrpc_pb.ListPaymentsResponse) => void): grpc.ClientUnaryCall;
    deleteAllPayments(request: lndrpc_pb.DeleteAllPaymentsRequest, callback: (error: Error | null, response: lndrpc_pb.DeleteAllPaymentsResponse) => void): grpc.ClientUnaryCall;
    deleteAllPayments(request: lndrpc_pb.DeleteAllPaymentsRequest, metadata: grpc.Metadata, callback: (error: Error | null, response: lndrpc_pb.DeleteAllPaymentsResponse) => void): grpc.ClientUnaryCall;
    deleteAllPayments(request: lndrpc_pb.DeleteAllPaymentsRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: Error | null, response: lndrpc_pb.DeleteAllPaymentsResponse) => void): grpc.ClientUnaryCall;
    describeGraph(request: lndrpc_pb.ChannelGraphRequest, callback: (error: Error | null, response: lndrpc_pb.ChannelGraph) => void): grpc.ClientUnaryCall;
    describeGraph(request: lndrpc_pb.ChannelGraphRequest, metadata: grpc.Metadata, callback: (error: Error | null, response: lndrpc_pb.ChannelGraph) => void): grpc.ClientUnaryCall;
    describeGraph(request: lndrpc_pb.ChannelGraphRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: Error | null, response: lndrpc_pb.ChannelGraph) => void): grpc.ClientUnaryCall;
    getChanInfo(request: lndrpc_pb.ChanInfoRequest, callback: (error: Error | null, response: lndrpc_pb.ChannelEdge) => void): grpc.ClientUnaryCall;
    getChanInfo(request: lndrpc_pb.ChanInfoRequest, metadata: grpc.Metadata, callback: (error: Error | null, response: lndrpc_pb.ChannelEdge) => void): grpc.ClientUnaryCall;
    getChanInfo(request: lndrpc_pb.ChanInfoRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: Error | null, response: lndrpc_pb.ChannelEdge) => void): grpc.ClientUnaryCall;
    getNodeInfo(request: lndrpc_pb.NodeInfoRequest, callback: (error: Error | null, response: lndrpc_pb.NodeInfo) => void): grpc.ClientUnaryCall;
    getNodeInfo(request: lndrpc_pb.NodeInfoRequest, metadata: grpc.Metadata, callback: (error: Error | null, response: lndrpc_pb.NodeInfo) => void): grpc.ClientUnaryCall;
    getNodeInfo(request: lndrpc_pb.NodeInfoRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: Error | null, response: lndrpc_pb.NodeInfo) => void): grpc.ClientUnaryCall;
    queryRoutes(request: lndrpc_pb.QueryRoutesRequest, callback: (error: Error | null, response: lndrpc_pb.QueryRoutesResponse) => void): grpc.ClientUnaryCall;
    queryRoutes(request: lndrpc_pb.QueryRoutesRequest, metadata: grpc.Metadata, callback: (error: Error | null, response: lndrpc_pb.QueryRoutesResponse) => void): grpc.ClientUnaryCall;
    queryRoutes(request: lndrpc_pb.QueryRoutesRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: Error | null, response: lndrpc_pb.QueryRoutesResponse) => void): grpc.ClientUnaryCall;
    getNetworkInfo(request: lndrpc_pb.NetworkInfoRequest, callback: (error: Error | null, response: lndrpc_pb.NetworkInfo) => void): grpc.ClientUnaryCall;
    getNetworkInfo(request: lndrpc_pb.NetworkInfoRequest, metadata: grpc.Metadata, callback: (error: Error | null, response: lndrpc_pb.NetworkInfo) => void): grpc.ClientUnaryCall;
    getNetworkInfo(request: lndrpc_pb.NetworkInfoRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: Error | null, response: lndrpc_pb.NetworkInfo) => void): grpc.ClientUnaryCall;
    stopDaemon(request: lndrpc_pb.StopRequest, callback: (error: Error | null, response: lndrpc_pb.StopResponse) => void): grpc.ClientUnaryCall;
    stopDaemon(request: lndrpc_pb.StopRequest, metadata: grpc.Metadata, callback: (error: Error | null, response: lndrpc_pb.StopResponse) => void): grpc.ClientUnaryCall;
    stopDaemon(request: lndrpc_pb.StopRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: Error | null, response: lndrpc_pb.StopResponse) => void): grpc.ClientUnaryCall;
    subscribeChannelGraph(request: lndrpc_pb.GraphTopologySubscription, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<lndrpc_pb.GraphTopologyUpdate>;
    subscribeChannelGraph(request: lndrpc_pb.GraphTopologySubscription, metadata?: grpc.Metadata, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<lndrpc_pb.GraphTopologyUpdate>;
    debugLevel(request: lndrpc_pb.DebugLevelRequest, callback: (error: Error | null, response: lndrpc_pb.DebugLevelResponse) => void): grpc.ClientUnaryCall;
    debugLevel(request: lndrpc_pb.DebugLevelRequest, metadata: grpc.Metadata, callback: (error: Error | null, response: lndrpc_pb.DebugLevelResponse) => void): grpc.ClientUnaryCall;
    debugLevel(request: lndrpc_pb.DebugLevelRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: Error | null, response: lndrpc_pb.DebugLevelResponse) => void): grpc.ClientUnaryCall;
    feeReport(request: lndrpc_pb.FeeReportRequest, callback: (error: Error | null, response: lndrpc_pb.FeeReportResponse) => void): grpc.ClientUnaryCall;
    feeReport(request: lndrpc_pb.FeeReportRequest, metadata: grpc.Metadata, callback: (error: Error | null, response: lndrpc_pb.FeeReportResponse) => void): grpc.ClientUnaryCall;
    feeReport(request: lndrpc_pb.FeeReportRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: Error | null, response: lndrpc_pb.FeeReportResponse) => void): grpc.ClientUnaryCall;
    updateChannelPolicy(request: lndrpc_pb.PolicyUpdateRequest, callback: (error: Error | null, response: lndrpc_pb.PolicyUpdateResponse) => void): grpc.ClientUnaryCall;
    updateChannelPolicy(request: lndrpc_pb.PolicyUpdateRequest, metadata: grpc.Metadata, callback: (error: Error | null, response: lndrpc_pb.PolicyUpdateResponse) => void): grpc.ClientUnaryCall;
    updateChannelPolicy(request: lndrpc_pb.PolicyUpdateRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: Error | null, response: lndrpc_pb.PolicyUpdateResponse) => void): grpc.ClientUnaryCall;
    forwardingHistory(request: lndrpc_pb.ForwardingHistoryRequest, callback: (error: Error | null, response: lndrpc_pb.ForwardingHistoryResponse) => void): grpc.ClientUnaryCall;
    forwardingHistory(request: lndrpc_pb.ForwardingHistoryRequest, metadata: grpc.Metadata, callback: (error: Error | null, response: lndrpc_pb.ForwardingHistoryResponse) => void): grpc.ClientUnaryCall;
    forwardingHistory(request: lndrpc_pb.ForwardingHistoryRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: Error | null, response: lndrpc_pb.ForwardingHistoryResponse) => void): grpc.ClientUnaryCall;
}

export class LightningClient extends grpc.Client implements ILightningClient {
    constructor(address: string, credentials: grpc.ChannelCredentials, options?: object);
    public walletBalance(request: lndrpc_pb.WalletBalanceRequest, callback: (error: Error | null, response: lndrpc_pb.WalletBalanceResponse) => void): grpc.ClientUnaryCall;
    public walletBalance(request: lndrpc_pb.WalletBalanceRequest, metadata: grpc.Metadata, callback: (error: Error | null, response: lndrpc_pb.WalletBalanceResponse) => void): grpc.ClientUnaryCall;
    public walletBalance(request: lndrpc_pb.WalletBalanceRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: Error | null, response: lndrpc_pb.WalletBalanceResponse) => void): grpc.ClientUnaryCall;
    public channelBalance(request: lndrpc_pb.ChannelBalanceRequest, callback: (error: Error | null, response: lndrpc_pb.ChannelBalanceResponse) => void): grpc.ClientUnaryCall;
    public channelBalance(request: lndrpc_pb.ChannelBalanceRequest, metadata: grpc.Metadata, callback: (error: Error | null, response: lndrpc_pb.ChannelBalanceResponse) => void): grpc.ClientUnaryCall;
    public channelBalance(request: lndrpc_pb.ChannelBalanceRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: Error | null, response: lndrpc_pb.ChannelBalanceResponse) => void): grpc.ClientUnaryCall;
    public getTransactions(request: lndrpc_pb.GetTransactionsRequest, callback: (error: Error | null, response: lndrpc_pb.TransactionDetails) => void): grpc.ClientUnaryCall;
    public getTransactions(request: lndrpc_pb.GetTransactionsRequest, metadata: grpc.Metadata, callback: (error: Error | null, response: lndrpc_pb.TransactionDetails) => void): grpc.ClientUnaryCall;
    public getTransactions(request: lndrpc_pb.GetTransactionsRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: Error | null, response: lndrpc_pb.TransactionDetails) => void): grpc.ClientUnaryCall;
    public sendCoins(request: lndrpc_pb.SendCoinsRequest, callback: (error: Error | null, response: lndrpc_pb.SendCoinsResponse) => void): grpc.ClientUnaryCall;
    public sendCoins(request: lndrpc_pb.SendCoinsRequest, metadata: grpc.Metadata, callback: (error: Error | null, response: lndrpc_pb.SendCoinsResponse) => void): grpc.ClientUnaryCall;
    public sendCoins(request: lndrpc_pb.SendCoinsRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: Error | null, response: lndrpc_pb.SendCoinsResponse) => void): grpc.ClientUnaryCall;
    public subscribeTransactions(request: lndrpc_pb.GetTransactionsRequest, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<lndrpc_pb.Transaction>;
    public subscribeTransactions(request: lndrpc_pb.GetTransactionsRequest, metadata?: grpc.Metadata, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<lndrpc_pb.Transaction>;
    public sendMany(request: lndrpc_pb.SendManyRequest, callback: (error: Error | null, response: lndrpc_pb.SendManyResponse) => void): grpc.ClientUnaryCall;
    public sendMany(request: lndrpc_pb.SendManyRequest, metadata: grpc.Metadata, callback: (error: Error | null, response: lndrpc_pb.SendManyResponse) => void): grpc.ClientUnaryCall;
    public sendMany(request: lndrpc_pb.SendManyRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: Error | null, response: lndrpc_pb.SendManyResponse) => void): grpc.ClientUnaryCall;
    public newAddress(request: lndrpc_pb.NewAddressRequest, callback: (error: Error | null, response: lndrpc_pb.NewAddressResponse) => void): grpc.ClientUnaryCall;
    public newAddress(request: lndrpc_pb.NewAddressRequest, metadata: grpc.Metadata, callback: (error: Error | null, response: lndrpc_pb.NewAddressResponse) => void): grpc.ClientUnaryCall;
    public newAddress(request: lndrpc_pb.NewAddressRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: Error | null, response: lndrpc_pb.NewAddressResponse) => void): grpc.ClientUnaryCall;
    public newWitnessAddress(request: lndrpc_pb.NewWitnessAddressRequest, callback: (error: Error | null, response: lndrpc_pb.NewAddressResponse) => void): grpc.ClientUnaryCall;
    public newWitnessAddress(request: lndrpc_pb.NewWitnessAddressRequest, metadata: grpc.Metadata, callback: (error: Error | null, response: lndrpc_pb.NewAddressResponse) => void): grpc.ClientUnaryCall;
    public newWitnessAddress(request: lndrpc_pb.NewWitnessAddressRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: Error | null, response: lndrpc_pb.NewAddressResponse) => void): grpc.ClientUnaryCall;
    public signMessage(request: lndrpc_pb.SignMessageRequest, callback: (error: Error | null, response: lndrpc_pb.SignMessageResponse) => void): grpc.ClientUnaryCall;
    public signMessage(request: lndrpc_pb.SignMessageRequest, metadata: grpc.Metadata, callback: (error: Error | null, response: lndrpc_pb.SignMessageResponse) => void): grpc.ClientUnaryCall;
    public signMessage(request: lndrpc_pb.SignMessageRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: Error | null, response: lndrpc_pb.SignMessageResponse) => void): grpc.ClientUnaryCall;
    public verifyMessage(request: lndrpc_pb.VerifyMessageRequest, callback: (error: Error | null, response: lndrpc_pb.VerifyMessageResponse) => void): grpc.ClientUnaryCall;
    public verifyMessage(request: lndrpc_pb.VerifyMessageRequest, metadata: grpc.Metadata, callback: (error: Error | null, response: lndrpc_pb.VerifyMessageResponse) => void): grpc.ClientUnaryCall;
    public verifyMessage(request: lndrpc_pb.VerifyMessageRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: Error | null, response: lndrpc_pb.VerifyMessageResponse) => void): grpc.ClientUnaryCall;
    public connectPeer(request: lndrpc_pb.ConnectPeerRequest, callback: (error: Error | null, response: lndrpc_pb.ConnectPeerResponse) => void): grpc.ClientUnaryCall;
    public connectPeer(request: lndrpc_pb.ConnectPeerRequest, metadata: grpc.Metadata, callback: (error: Error | null, response: lndrpc_pb.ConnectPeerResponse) => void): grpc.ClientUnaryCall;
    public connectPeer(request: lndrpc_pb.ConnectPeerRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: Error | null, response: lndrpc_pb.ConnectPeerResponse) => void): grpc.ClientUnaryCall;
    public disconnectPeer(request: lndrpc_pb.DisconnectPeerRequest, callback: (error: Error | null, response: lndrpc_pb.DisconnectPeerResponse) => void): grpc.ClientUnaryCall;
    public disconnectPeer(request: lndrpc_pb.DisconnectPeerRequest, metadata: grpc.Metadata, callback: (error: Error | null, response: lndrpc_pb.DisconnectPeerResponse) => void): grpc.ClientUnaryCall;
    public disconnectPeer(request: lndrpc_pb.DisconnectPeerRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: Error | null, response: lndrpc_pb.DisconnectPeerResponse) => void): grpc.ClientUnaryCall;
    public listPeers(request: lndrpc_pb.ListPeersRequest, callback: (error: Error | null, response: lndrpc_pb.ListPeersResponse) => void): grpc.ClientUnaryCall;
    public listPeers(request: lndrpc_pb.ListPeersRequest, metadata: grpc.Metadata, callback: (error: Error | null, response: lndrpc_pb.ListPeersResponse) => void): grpc.ClientUnaryCall;
    public listPeers(request: lndrpc_pb.ListPeersRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: Error | null, response: lndrpc_pb.ListPeersResponse) => void): grpc.ClientUnaryCall;
    public getInfo(request: lndrpc_pb.GetInfoRequest, callback: (error: Error | null, response: lndrpc_pb.GetInfoResponse) => void): grpc.ClientUnaryCall;
    public getInfo(request: lndrpc_pb.GetInfoRequest, metadata: grpc.Metadata, callback: (error: Error | null, response: lndrpc_pb.GetInfoResponse) => void): grpc.ClientUnaryCall;
    public getInfo(request: lndrpc_pb.GetInfoRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: Error | null, response: lndrpc_pb.GetInfoResponse) => void): grpc.ClientUnaryCall;
    public pendingChannels(request: lndrpc_pb.PendingChannelsRequest, callback: (error: Error | null, response: lndrpc_pb.PendingChannelsResponse) => void): grpc.ClientUnaryCall;
    public pendingChannels(request: lndrpc_pb.PendingChannelsRequest, metadata: grpc.Metadata, callback: (error: Error | null, response: lndrpc_pb.PendingChannelsResponse) => void): grpc.ClientUnaryCall;
    public pendingChannels(request: lndrpc_pb.PendingChannelsRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: Error | null, response: lndrpc_pb.PendingChannelsResponse) => void): grpc.ClientUnaryCall;
    public listChannels(request: lndrpc_pb.ListChannelsRequest, callback: (error: Error | null, response: lndrpc_pb.ListChannelsResponse) => void): grpc.ClientUnaryCall;
    public listChannels(request: lndrpc_pb.ListChannelsRequest, metadata: grpc.Metadata, callback: (error: Error | null, response: lndrpc_pb.ListChannelsResponse) => void): grpc.ClientUnaryCall;
    public listChannels(request: lndrpc_pb.ListChannelsRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: Error | null, response: lndrpc_pb.ListChannelsResponse) => void): grpc.ClientUnaryCall;
    public closedChannels(request: lndrpc_pb.ClosedChannelsRequest, callback: (error: Error | null, response: lndrpc_pb.ClosedChannelsResponse) => void): grpc.ClientUnaryCall;
    public closedChannels(request: lndrpc_pb.ClosedChannelsRequest, metadata: grpc.Metadata, callback: (error: Error | null, response: lndrpc_pb.ClosedChannelsResponse) => void): grpc.ClientUnaryCall;
    public closedChannels(request: lndrpc_pb.ClosedChannelsRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: Error | null, response: lndrpc_pb.ClosedChannelsResponse) => void): grpc.ClientUnaryCall;
    public openChannelSync(request: lndrpc_pb.OpenChannelRequest, callback: (error: Error | null, response: lndrpc_pb.ChannelPoint) => void): grpc.ClientUnaryCall;
    public openChannelSync(request: lndrpc_pb.OpenChannelRequest, metadata: grpc.Metadata, callback: (error: Error | null, response: lndrpc_pb.ChannelPoint) => void): grpc.ClientUnaryCall;
    public openChannelSync(request: lndrpc_pb.OpenChannelRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: Error | null, response: lndrpc_pb.ChannelPoint) => void): grpc.ClientUnaryCall;
    public openChannel(request: lndrpc_pb.OpenChannelRequest, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<lndrpc_pb.OpenStatusUpdate>;
    public openChannel(request: lndrpc_pb.OpenChannelRequest, metadata?: grpc.Metadata, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<lndrpc_pb.OpenStatusUpdate>;
    public closeChannel(request: lndrpc_pb.CloseChannelRequest, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<lndrpc_pb.CloseStatusUpdate>;
    public closeChannel(request: lndrpc_pb.CloseChannelRequest, metadata?: grpc.Metadata, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<lndrpc_pb.CloseStatusUpdate>;
    public sendPayment(options?: Partial<grpc.CallOptions>): grpc.ClientDuplexStream<lndrpc_pb.SendRequest, lndrpc_pb.SendResponse>;
    public sendPayment(metadata?: grpc.Metadata, options?: Partial<grpc.CallOptions>): grpc.ClientDuplexStream<lndrpc_pb.SendRequest, lndrpc_pb.SendResponse>;
    public sendPaymentSync(request: lndrpc_pb.SendRequest, callback: (error: Error | null, response: lndrpc_pb.SendResponse) => void): grpc.ClientUnaryCall;
    public sendPaymentSync(request: lndrpc_pb.SendRequest, metadata: grpc.Metadata, callback: (error: Error | null, response: lndrpc_pb.SendResponse) => void): grpc.ClientUnaryCall;
    public sendPaymentSync(request: lndrpc_pb.SendRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: Error | null, response: lndrpc_pb.SendResponse) => void): grpc.ClientUnaryCall;
    public sendToRoute(options?: Partial<grpc.CallOptions>): grpc.ClientDuplexStream<lndrpc_pb.SendToRouteRequest, lndrpc_pb.SendResponse>;
    public sendToRoute(metadata?: grpc.Metadata, options?: Partial<grpc.CallOptions>): grpc.ClientDuplexStream<lndrpc_pb.SendToRouteRequest, lndrpc_pb.SendResponse>;
    public sendToRouteSync(request: lndrpc_pb.SendToRouteRequest, callback: (error: Error | null, response: lndrpc_pb.SendResponse) => void): grpc.ClientUnaryCall;
    public sendToRouteSync(request: lndrpc_pb.SendToRouteRequest, metadata: grpc.Metadata, callback: (error: Error | null, response: lndrpc_pb.SendResponse) => void): grpc.ClientUnaryCall;
    public sendToRouteSync(request: lndrpc_pb.SendToRouteRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: Error | null, response: lndrpc_pb.SendResponse) => void): grpc.ClientUnaryCall;
    public addInvoice(request: lndrpc_pb.Invoice, callback: (error: Error | null, response: lndrpc_pb.AddInvoiceResponse) => void): grpc.ClientUnaryCall;
    public addInvoice(request: lndrpc_pb.Invoice, metadata: grpc.Metadata, callback: (error: Error | null, response: lndrpc_pb.AddInvoiceResponse) => void): grpc.ClientUnaryCall;
    public addInvoice(request: lndrpc_pb.Invoice, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: Error | null, response: lndrpc_pb.AddInvoiceResponse) => void): grpc.ClientUnaryCall;
    public listInvoices(request: lndrpc_pb.ListInvoiceRequest, callback: (error: Error | null, response: lndrpc_pb.ListInvoiceResponse) => void): grpc.ClientUnaryCall;
    public listInvoices(request: lndrpc_pb.ListInvoiceRequest, metadata: grpc.Metadata, callback: (error: Error | null, response: lndrpc_pb.ListInvoiceResponse) => void): grpc.ClientUnaryCall;
    public listInvoices(request: lndrpc_pb.ListInvoiceRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: Error | null, response: lndrpc_pb.ListInvoiceResponse) => void): grpc.ClientUnaryCall;
    public lookupInvoice(request: lndrpc_pb.PaymentHash, callback: (error: Error | null, response: lndrpc_pb.Invoice) => void): grpc.ClientUnaryCall;
    public lookupInvoice(request: lndrpc_pb.PaymentHash, metadata: grpc.Metadata, callback: (error: Error | null, response: lndrpc_pb.Invoice) => void): grpc.ClientUnaryCall;
    public lookupInvoice(request: lndrpc_pb.PaymentHash, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: Error | null, response: lndrpc_pb.Invoice) => void): grpc.ClientUnaryCall;
    public subscribeInvoices(request: lndrpc_pb.InvoiceSubscription, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<lndrpc_pb.Invoice>;
    public subscribeInvoices(request: lndrpc_pb.InvoiceSubscription, metadata?: grpc.Metadata, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<lndrpc_pb.Invoice>;
    public decodePayReq(request: lndrpc_pb.PayReqString, callback: (error: Error | null, response: lndrpc_pb.PayReq) => void): grpc.ClientUnaryCall;
    public decodePayReq(request: lndrpc_pb.PayReqString, metadata: grpc.Metadata, callback: (error: Error | null, response: lndrpc_pb.PayReq) => void): grpc.ClientUnaryCall;
    public decodePayReq(request: lndrpc_pb.PayReqString, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: Error | null, response: lndrpc_pb.PayReq) => void): grpc.ClientUnaryCall;
    public listPayments(request: lndrpc_pb.ListPaymentsRequest, callback: (error: Error | null, response: lndrpc_pb.ListPaymentsResponse) => void): grpc.ClientUnaryCall;
    public listPayments(request: lndrpc_pb.ListPaymentsRequest, metadata: grpc.Metadata, callback: (error: Error | null, response: lndrpc_pb.ListPaymentsResponse) => void): grpc.ClientUnaryCall;
    public listPayments(request: lndrpc_pb.ListPaymentsRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: Error | null, response: lndrpc_pb.ListPaymentsResponse) => void): grpc.ClientUnaryCall;
    public deleteAllPayments(request: lndrpc_pb.DeleteAllPaymentsRequest, callback: (error: Error | null, response: lndrpc_pb.DeleteAllPaymentsResponse) => void): grpc.ClientUnaryCall;
    public deleteAllPayments(request: lndrpc_pb.DeleteAllPaymentsRequest, metadata: grpc.Metadata, callback: (error: Error | null, response: lndrpc_pb.DeleteAllPaymentsResponse) => void): grpc.ClientUnaryCall;
    public deleteAllPayments(request: lndrpc_pb.DeleteAllPaymentsRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: Error | null, response: lndrpc_pb.DeleteAllPaymentsResponse) => void): grpc.ClientUnaryCall;
    public describeGraph(request: lndrpc_pb.ChannelGraphRequest, callback: (error: Error | null, response: lndrpc_pb.ChannelGraph) => void): grpc.ClientUnaryCall;
    public describeGraph(request: lndrpc_pb.ChannelGraphRequest, metadata: grpc.Metadata, callback: (error: Error | null, response: lndrpc_pb.ChannelGraph) => void): grpc.ClientUnaryCall;
    public describeGraph(request: lndrpc_pb.ChannelGraphRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: Error | null, response: lndrpc_pb.ChannelGraph) => void): grpc.ClientUnaryCall;
    public getChanInfo(request: lndrpc_pb.ChanInfoRequest, callback: (error: Error | null, response: lndrpc_pb.ChannelEdge) => void): grpc.ClientUnaryCall;
    public getChanInfo(request: lndrpc_pb.ChanInfoRequest, metadata: grpc.Metadata, callback: (error: Error | null, response: lndrpc_pb.ChannelEdge) => void): grpc.ClientUnaryCall;
    public getChanInfo(request: lndrpc_pb.ChanInfoRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: Error | null, response: lndrpc_pb.ChannelEdge) => void): grpc.ClientUnaryCall;
    public getNodeInfo(request: lndrpc_pb.NodeInfoRequest, callback: (error: Error | null, response: lndrpc_pb.NodeInfo) => void): grpc.ClientUnaryCall;
    public getNodeInfo(request: lndrpc_pb.NodeInfoRequest, metadata: grpc.Metadata, callback: (error: Error | null, response: lndrpc_pb.NodeInfo) => void): grpc.ClientUnaryCall;
    public getNodeInfo(request: lndrpc_pb.NodeInfoRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: Error | null, response: lndrpc_pb.NodeInfo) => void): grpc.ClientUnaryCall;
    public queryRoutes(request: lndrpc_pb.QueryRoutesRequest, callback: (error: Error | null, response: lndrpc_pb.QueryRoutesResponse) => void): grpc.ClientUnaryCall;
    public queryRoutes(request: lndrpc_pb.QueryRoutesRequest, metadata: grpc.Metadata, callback: (error: Error | null, response: lndrpc_pb.QueryRoutesResponse) => void): grpc.ClientUnaryCall;
    public queryRoutes(request: lndrpc_pb.QueryRoutesRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: Error | null, response: lndrpc_pb.QueryRoutesResponse) => void): grpc.ClientUnaryCall;
    public getNetworkInfo(request: lndrpc_pb.NetworkInfoRequest, callback: (error: Error | null, response: lndrpc_pb.NetworkInfo) => void): grpc.ClientUnaryCall;
    public getNetworkInfo(request: lndrpc_pb.NetworkInfoRequest, metadata: grpc.Metadata, callback: (error: Error | null, response: lndrpc_pb.NetworkInfo) => void): grpc.ClientUnaryCall;
    public getNetworkInfo(request: lndrpc_pb.NetworkInfoRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: Error | null, response: lndrpc_pb.NetworkInfo) => void): grpc.ClientUnaryCall;
    public stopDaemon(request: lndrpc_pb.StopRequest, callback: (error: Error | null, response: lndrpc_pb.StopResponse) => void): grpc.ClientUnaryCall;
    public stopDaemon(request: lndrpc_pb.StopRequest, metadata: grpc.Metadata, callback: (error: Error | null, response: lndrpc_pb.StopResponse) => void): grpc.ClientUnaryCall;
    public stopDaemon(request: lndrpc_pb.StopRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: Error | null, response: lndrpc_pb.StopResponse) => void): grpc.ClientUnaryCall;
    public subscribeChannelGraph(request: lndrpc_pb.GraphTopologySubscription, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<lndrpc_pb.GraphTopologyUpdate>;
    public subscribeChannelGraph(request: lndrpc_pb.GraphTopologySubscription, metadata?: grpc.Metadata, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<lndrpc_pb.GraphTopologyUpdate>;
    public debugLevel(request: lndrpc_pb.DebugLevelRequest, callback: (error: Error | null, response: lndrpc_pb.DebugLevelResponse) => void): grpc.ClientUnaryCall;
    public debugLevel(request: lndrpc_pb.DebugLevelRequest, metadata: grpc.Metadata, callback: (error: Error | null, response: lndrpc_pb.DebugLevelResponse) => void): grpc.ClientUnaryCall;
    public debugLevel(request: lndrpc_pb.DebugLevelRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: Error | null, response: lndrpc_pb.DebugLevelResponse) => void): grpc.ClientUnaryCall;
    public feeReport(request: lndrpc_pb.FeeReportRequest, callback: (error: Error | null, response: lndrpc_pb.FeeReportResponse) => void): grpc.ClientUnaryCall;
    public feeReport(request: lndrpc_pb.FeeReportRequest, metadata: grpc.Metadata, callback: (error: Error | null, response: lndrpc_pb.FeeReportResponse) => void): grpc.ClientUnaryCall;
    public feeReport(request: lndrpc_pb.FeeReportRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: Error | null, response: lndrpc_pb.FeeReportResponse) => void): grpc.ClientUnaryCall;
    public updateChannelPolicy(request: lndrpc_pb.PolicyUpdateRequest, callback: (error: Error | null, response: lndrpc_pb.PolicyUpdateResponse) => void): grpc.ClientUnaryCall;
    public updateChannelPolicy(request: lndrpc_pb.PolicyUpdateRequest, metadata: grpc.Metadata, callback: (error: Error | null, response: lndrpc_pb.PolicyUpdateResponse) => void): grpc.ClientUnaryCall;
    public updateChannelPolicy(request: lndrpc_pb.PolicyUpdateRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: Error | null, response: lndrpc_pb.PolicyUpdateResponse) => void): grpc.ClientUnaryCall;
    public forwardingHistory(request: lndrpc_pb.ForwardingHistoryRequest, callback: (error: Error | null, response: lndrpc_pb.ForwardingHistoryResponse) => void): grpc.ClientUnaryCall;
    public forwardingHistory(request: lndrpc_pb.ForwardingHistoryRequest, metadata: grpc.Metadata, callback: (error: Error | null, response: lndrpc_pb.ForwardingHistoryResponse) => void): grpc.ClientUnaryCall;
    public forwardingHistory(request: lndrpc_pb.ForwardingHistoryRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: Error | null, response: lndrpc_pb.ForwardingHistoryResponse) => void): grpc.ClientUnaryCall;
}
