// package: boltzrpc
// file: boltzrpc.proto

/* tslint:disable */

import * as grpc from "grpc";
import * as boltzrpc_pb from "./boltzrpc_pb";

interface IBoltzService extends grpc.ServiceDefinition<grpc.UntypedServiceImplementation> {
    getInfo: IBoltzService_IGetInfo;
    getBalance: IBoltzService_IGetBalance;
    newAddress: IBoltzService_INewAddress;
    getTransaction: IBoltzService_IGetTransaction;
    broadcastTransaction: IBoltzService_IBroadcastTransaction;
    listenOnAddress: IBoltzService_IListenOnAddress;
    subscribeTransactions: IBoltzService_ISubscribeTransactions;
    subscribeInvoices: IBoltzService_ISubscribeInvoices;
    createSwap: IBoltzService_ICreateSwap;
    createReverseSwap: IBoltzService_ICreateReverseSwap;
}

interface IBoltzService_IGetInfo extends grpc.MethodDefinition<boltzrpc_pb.GetInfoRequest, boltzrpc_pb.GetInfoResponse> {
    path: string; // "/boltzrpc.Boltz/GetInfo"
    requestStream: boolean; // false
    responseStream: boolean; // false
    requestSerialize: grpc.serialize<boltzrpc_pb.GetInfoRequest>;
    requestDeserialize: grpc.deserialize<boltzrpc_pb.GetInfoRequest>;
    responseSerialize: grpc.serialize<boltzrpc_pb.GetInfoResponse>;
    responseDeserialize: grpc.deserialize<boltzrpc_pb.GetInfoResponse>;
}
interface IBoltzService_IGetBalance extends grpc.MethodDefinition<boltzrpc_pb.GetBalanceRequest, boltzrpc_pb.GetBalanceResponse> {
    path: string; // "/boltzrpc.Boltz/GetBalance"
    requestStream: boolean; // false
    responseStream: boolean; // false
    requestSerialize: grpc.serialize<boltzrpc_pb.GetBalanceRequest>;
    requestDeserialize: grpc.deserialize<boltzrpc_pb.GetBalanceRequest>;
    responseSerialize: grpc.serialize<boltzrpc_pb.GetBalanceResponse>;
    responseDeserialize: grpc.deserialize<boltzrpc_pb.GetBalanceResponse>;
}
interface IBoltzService_INewAddress extends grpc.MethodDefinition<boltzrpc_pb.NewAddressRequest, boltzrpc_pb.NewAddressResponse> {
    path: string; // "/boltzrpc.Boltz/NewAddress"
    requestStream: boolean; // false
    responseStream: boolean; // false
    requestSerialize: grpc.serialize<boltzrpc_pb.NewAddressRequest>;
    requestDeserialize: grpc.deserialize<boltzrpc_pb.NewAddressRequest>;
    responseSerialize: grpc.serialize<boltzrpc_pb.NewAddressResponse>;
    responseDeserialize: grpc.deserialize<boltzrpc_pb.NewAddressResponse>;
}
interface IBoltzService_IGetTransaction extends grpc.MethodDefinition<boltzrpc_pb.GetTransactionRequest, boltzrpc_pb.GetTransactionResponse> {
    path: string; // "/boltzrpc.Boltz/GetTransaction"
    requestStream: boolean; // false
    responseStream: boolean; // false
    requestSerialize: grpc.serialize<boltzrpc_pb.GetTransactionRequest>;
    requestDeserialize: grpc.deserialize<boltzrpc_pb.GetTransactionRequest>;
    responseSerialize: grpc.serialize<boltzrpc_pb.GetTransactionResponse>;
    responseDeserialize: grpc.deserialize<boltzrpc_pb.GetTransactionResponse>;
}
interface IBoltzService_IBroadcastTransaction extends grpc.MethodDefinition<boltzrpc_pb.BroadcastTransactionRequest, boltzrpc_pb.BroadcastTransactionResponse> {
    path: string; // "/boltzrpc.Boltz/BroadcastTransaction"
    requestStream: boolean; // false
    responseStream: boolean; // false
    requestSerialize: grpc.serialize<boltzrpc_pb.BroadcastTransactionRequest>;
    requestDeserialize: grpc.deserialize<boltzrpc_pb.BroadcastTransactionRequest>;
    responseSerialize: grpc.serialize<boltzrpc_pb.BroadcastTransactionResponse>;
    responseDeserialize: grpc.deserialize<boltzrpc_pb.BroadcastTransactionResponse>;
}
interface IBoltzService_IListenOnAddress extends grpc.MethodDefinition<boltzrpc_pb.ListenOnAddressRequest, boltzrpc_pb.ListenOnAddressResponse> {
    path: string; // "/boltzrpc.Boltz/ListenOnAddress"
    requestStream: boolean; // false
    responseStream: boolean; // false
    requestSerialize: grpc.serialize<boltzrpc_pb.ListenOnAddressRequest>;
    requestDeserialize: grpc.deserialize<boltzrpc_pb.ListenOnAddressRequest>;
    responseSerialize: grpc.serialize<boltzrpc_pb.ListenOnAddressResponse>;
    responseDeserialize: grpc.deserialize<boltzrpc_pb.ListenOnAddressResponse>;
}
interface IBoltzService_ISubscribeTransactions extends grpc.MethodDefinition<boltzrpc_pb.SubscribeTransactionsRequest, boltzrpc_pb.SubscribeTransactionsResponse> {
    path: string; // "/boltzrpc.Boltz/SubscribeTransactions"
    requestStream: boolean; // false
    responseStream: boolean; // true
    requestSerialize: grpc.serialize<boltzrpc_pb.SubscribeTransactionsRequest>;
    requestDeserialize: grpc.deserialize<boltzrpc_pb.SubscribeTransactionsRequest>;
    responseSerialize: grpc.serialize<boltzrpc_pb.SubscribeTransactionsResponse>;
    responseDeserialize: grpc.deserialize<boltzrpc_pb.SubscribeTransactionsResponse>;
}
interface IBoltzService_ISubscribeInvoices extends grpc.MethodDefinition<boltzrpc_pb.SubscribeInvoicesRequest, boltzrpc_pb.SubscribeInvoicesResponse> {
    path: string; // "/boltzrpc.Boltz/SubscribeInvoices"
    requestStream: boolean; // false
    responseStream: boolean; // true
    requestSerialize: grpc.serialize<boltzrpc_pb.SubscribeInvoicesRequest>;
    requestDeserialize: grpc.deserialize<boltzrpc_pb.SubscribeInvoicesRequest>;
    responseSerialize: grpc.serialize<boltzrpc_pb.SubscribeInvoicesResponse>;
    responseDeserialize: grpc.deserialize<boltzrpc_pb.SubscribeInvoicesResponse>;
}
interface IBoltzService_ICreateSwap extends grpc.MethodDefinition<boltzrpc_pb.CreateSwapRequest, boltzrpc_pb.CreateSwapResponse> {
    path: string; // "/boltzrpc.Boltz/CreateSwap"
    requestStream: boolean; // false
    responseStream: boolean; // false
    requestSerialize: grpc.serialize<boltzrpc_pb.CreateSwapRequest>;
    requestDeserialize: grpc.deserialize<boltzrpc_pb.CreateSwapRequest>;
    responseSerialize: grpc.serialize<boltzrpc_pb.CreateSwapResponse>;
    responseDeserialize: grpc.deserialize<boltzrpc_pb.CreateSwapResponse>;
}
interface IBoltzService_ICreateReverseSwap extends grpc.MethodDefinition<boltzrpc_pb.CreateReverseSwapRequest, boltzrpc_pb.CreateReverseSwapResponse> {
    path: string; // "/boltzrpc.Boltz/CreateReverseSwap"
    requestStream: boolean; // false
    responseStream: boolean; // false
    requestSerialize: grpc.serialize<boltzrpc_pb.CreateReverseSwapRequest>;
    requestDeserialize: grpc.deserialize<boltzrpc_pb.CreateReverseSwapRequest>;
    responseSerialize: grpc.serialize<boltzrpc_pb.CreateReverseSwapResponse>;
    responseDeserialize: grpc.deserialize<boltzrpc_pb.CreateReverseSwapResponse>;
}

export const BoltzService: IBoltzService;

export interface IBoltzServer {
    getInfo: grpc.handleUnaryCall<boltzrpc_pb.GetInfoRequest, boltzrpc_pb.GetInfoResponse>;
    getBalance: grpc.handleUnaryCall<boltzrpc_pb.GetBalanceRequest, boltzrpc_pb.GetBalanceResponse>;
    newAddress: grpc.handleUnaryCall<boltzrpc_pb.NewAddressRequest, boltzrpc_pb.NewAddressResponse>;
    getTransaction: grpc.handleUnaryCall<boltzrpc_pb.GetTransactionRequest, boltzrpc_pb.GetTransactionResponse>;
    broadcastTransaction: grpc.handleUnaryCall<boltzrpc_pb.BroadcastTransactionRequest, boltzrpc_pb.BroadcastTransactionResponse>;
    listenOnAddress: grpc.handleUnaryCall<boltzrpc_pb.ListenOnAddressRequest, boltzrpc_pb.ListenOnAddressResponse>;
    subscribeTransactions: grpc.handleServerStreamingCall<boltzrpc_pb.SubscribeTransactionsRequest, boltzrpc_pb.SubscribeTransactionsResponse>;
    subscribeInvoices: grpc.handleServerStreamingCall<boltzrpc_pb.SubscribeInvoicesRequest, boltzrpc_pb.SubscribeInvoicesResponse>;
    createSwap: grpc.handleUnaryCall<boltzrpc_pb.CreateSwapRequest, boltzrpc_pb.CreateSwapResponse>;
    createReverseSwap: grpc.handleUnaryCall<boltzrpc_pb.CreateReverseSwapRequest, boltzrpc_pb.CreateReverseSwapResponse>;
}

export interface IBoltzClient {
    getInfo(request: boltzrpc_pb.GetInfoRequest, callback: (error: grpc.ServiceError | null, response: boltzrpc_pb.GetInfoResponse) => void): grpc.ClientUnaryCall;
    getInfo(request: boltzrpc_pb.GetInfoRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: boltzrpc_pb.GetInfoResponse) => void): grpc.ClientUnaryCall;
    getInfo(request: boltzrpc_pb.GetInfoRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: boltzrpc_pb.GetInfoResponse) => void): grpc.ClientUnaryCall;
    getBalance(request: boltzrpc_pb.GetBalanceRequest, callback: (error: grpc.ServiceError | null, response: boltzrpc_pb.GetBalanceResponse) => void): grpc.ClientUnaryCall;
    getBalance(request: boltzrpc_pb.GetBalanceRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: boltzrpc_pb.GetBalanceResponse) => void): grpc.ClientUnaryCall;
    getBalance(request: boltzrpc_pb.GetBalanceRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: boltzrpc_pb.GetBalanceResponse) => void): grpc.ClientUnaryCall;
    newAddress(request: boltzrpc_pb.NewAddressRequest, callback: (error: grpc.ServiceError | null, response: boltzrpc_pb.NewAddressResponse) => void): grpc.ClientUnaryCall;
    newAddress(request: boltzrpc_pb.NewAddressRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: boltzrpc_pb.NewAddressResponse) => void): grpc.ClientUnaryCall;
    newAddress(request: boltzrpc_pb.NewAddressRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: boltzrpc_pb.NewAddressResponse) => void): grpc.ClientUnaryCall;
    getTransaction(request: boltzrpc_pb.GetTransactionRequest, callback: (error: grpc.ServiceError | null, response: boltzrpc_pb.GetTransactionResponse) => void): grpc.ClientUnaryCall;
    getTransaction(request: boltzrpc_pb.GetTransactionRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: boltzrpc_pb.GetTransactionResponse) => void): grpc.ClientUnaryCall;
    getTransaction(request: boltzrpc_pb.GetTransactionRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: boltzrpc_pb.GetTransactionResponse) => void): grpc.ClientUnaryCall;
    broadcastTransaction(request: boltzrpc_pb.BroadcastTransactionRequest, callback: (error: grpc.ServiceError | null, response: boltzrpc_pb.BroadcastTransactionResponse) => void): grpc.ClientUnaryCall;
    broadcastTransaction(request: boltzrpc_pb.BroadcastTransactionRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: boltzrpc_pb.BroadcastTransactionResponse) => void): grpc.ClientUnaryCall;
    broadcastTransaction(request: boltzrpc_pb.BroadcastTransactionRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: boltzrpc_pb.BroadcastTransactionResponse) => void): grpc.ClientUnaryCall;
    listenOnAddress(request: boltzrpc_pb.ListenOnAddressRequest, callback: (error: grpc.ServiceError | null, response: boltzrpc_pb.ListenOnAddressResponse) => void): grpc.ClientUnaryCall;
    listenOnAddress(request: boltzrpc_pb.ListenOnAddressRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: boltzrpc_pb.ListenOnAddressResponse) => void): grpc.ClientUnaryCall;
    listenOnAddress(request: boltzrpc_pb.ListenOnAddressRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: boltzrpc_pb.ListenOnAddressResponse) => void): grpc.ClientUnaryCall;
    subscribeTransactions(request: boltzrpc_pb.SubscribeTransactionsRequest, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<boltzrpc_pb.SubscribeTransactionsResponse>;
    subscribeTransactions(request: boltzrpc_pb.SubscribeTransactionsRequest, metadata?: grpc.Metadata, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<boltzrpc_pb.SubscribeTransactionsResponse>;
    subscribeInvoices(request: boltzrpc_pb.SubscribeInvoicesRequest, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<boltzrpc_pb.SubscribeInvoicesResponse>;
    subscribeInvoices(request: boltzrpc_pb.SubscribeInvoicesRequest, metadata?: grpc.Metadata, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<boltzrpc_pb.SubscribeInvoicesResponse>;
    createSwap(request: boltzrpc_pb.CreateSwapRequest, callback: (error: grpc.ServiceError | null, response: boltzrpc_pb.CreateSwapResponse) => void): grpc.ClientUnaryCall;
    createSwap(request: boltzrpc_pb.CreateSwapRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: boltzrpc_pb.CreateSwapResponse) => void): grpc.ClientUnaryCall;
    createSwap(request: boltzrpc_pb.CreateSwapRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: boltzrpc_pb.CreateSwapResponse) => void): grpc.ClientUnaryCall;
    createReverseSwap(request: boltzrpc_pb.CreateReverseSwapRequest, callback: (error: grpc.ServiceError | null, response: boltzrpc_pb.CreateReverseSwapResponse) => void): grpc.ClientUnaryCall;
    createReverseSwap(request: boltzrpc_pb.CreateReverseSwapRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: boltzrpc_pb.CreateReverseSwapResponse) => void): grpc.ClientUnaryCall;
    createReverseSwap(request: boltzrpc_pb.CreateReverseSwapRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: boltzrpc_pb.CreateReverseSwapResponse) => void): grpc.ClientUnaryCall;
}

export class BoltzClient extends grpc.Client implements IBoltzClient {
    constructor(address: string, credentials: grpc.ChannelCredentials, options?: object);
    public getInfo(request: boltzrpc_pb.GetInfoRequest, callback: (error: grpc.ServiceError | null, response: boltzrpc_pb.GetInfoResponse) => void): grpc.ClientUnaryCall;
    public getInfo(request: boltzrpc_pb.GetInfoRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: boltzrpc_pb.GetInfoResponse) => void): grpc.ClientUnaryCall;
    public getInfo(request: boltzrpc_pb.GetInfoRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: boltzrpc_pb.GetInfoResponse) => void): grpc.ClientUnaryCall;
    public getBalance(request: boltzrpc_pb.GetBalanceRequest, callback: (error: grpc.ServiceError | null, response: boltzrpc_pb.GetBalanceResponse) => void): grpc.ClientUnaryCall;
    public getBalance(request: boltzrpc_pb.GetBalanceRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: boltzrpc_pb.GetBalanceResponse) => void): grpc.ClientUnaryCall;
    public getBalance(request: boltzrpc_pb.GetBalanceRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: boltzrpc_pb.GetBalanceResponse) => void): grpc.ClientUnaryCall;
    public newAddress(request: boltzrpc_pb.NewAddressRequest, callback: (error: grpc.ServiceError | null, response: boltzrpc_pb.NewAddressResponse) => void): grpc.ClientUnaryCall;
    public newAddress(request: boltzrpc_pb.NewAddressRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: boltzrpc_pb.NewAddressResponse) => void): grpc.ClientUnaryCall;
    public newAddress(request: boltzrpc_pb.NewAddressRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: boltzrpc_pb.NewAddressResponse) => void): grpc.ClientUnaryCall;
    public getTransaction(request: boltzrpc_pb.GetTransactionRequest, callback: (error: grpc.ServiceError | null, response: boltzrpc_pb.GetTransactionResponse) => void): grpc.ClientUnaryCall;
    public getTransaction(request: boltzrpc_pb.GetTransactionRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: boltzrpc_pb.GetTransactionResponse) => void): grpc.ClientUnaryCall;
    public getTransaction(request: boltzrpc_pb.GetTransactionRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: boltzrpc_pb.GetTransactionResponse) => void): grpc.ClientUnaryCall;
    public broadcastTransaction(request: boltzrpc_pb.BroadcastTransactionRequest, callback: (error: grpc.ServiceError | null, response: boltzrpc_pb.BroadcastTransactionResponse) => void): grpc.ClientUnaryCall;
    public broadcastTransaction(request: boltzrpc_pb.BroadcastTransactionRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: boltzrpc_pb.BroadcastTransactionResponse) => void): grpc.ClientUnaryCall;
    public broadcastTransaction(request: boltzrpc_pb.BroadcastTransactionRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: boltzrpc_pb.BroadcastTransactionResponse) => void): grpc.ClientUnaryCall;
    public listenOnAddress(request: boltzrpc_pb.ListenOnAddressRequest, callback: (error: grpc.ServiceError | null, response: boltzrpc_pb.ListenOnAddressResponse) => void): grpc.ClientUnaryCall;
    public listenOnAddress(request: boltzrpc_pb.ListenOnAddressRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: boltzrpc_pb.ListenOnAddressResponse) => void): grpc.ClientUnaryCall;
    public listenOnAddress(request: boltzrpc_pb.ListenOnAddressRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: boltzrpc_pb.ListenOnAddressResponse) => void): grpc.ClientUnaryCall;
    public subscribeTransactions(request: boltzrpc_pb.SubscribeTransactionsRequest, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<boltzrpc_pb.SubscribeTransactionsResponse>;
    public subscribeTransactions(request: boltzrpc_pb.SubscribeTransactionsRequest, metadata?: grpc.Metadata, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<boltzrpc_pb.SubscribeTransactionsResponse>;
    public subscribeInvoices(request: boltzrpc_pb.SubscribeInvoicesRequest, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<boltzrpc_pb.SubscribeInvoicesResponse>;
    public subscribeInvoices(request: boltzrpc_pb.SubscribeInvoicesRequest, metadata?: grpc.Metadata, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<boltzrpc_pb.SubscribeInvoicesResponse>;
    public createSwap(request: boltzrpc_pb.CreateSwapRequest, callback: (error: grpc.ServiceError | null, response: boltzrpc_pb.CreateSwapResponse) => void): grpc.ClientUnaryCall;
    public createSwap(request: boltzrpc_pb.CreateSwapRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: boltzrpc_pb.CreateSwapResponse) => void): grpc.ClientUnaryCall;
    public createSwap(request: boltzrpc_pb.CreateSwapRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: boltzrpc_pb.CreateSwapResponse) => void): grpc.ClientUnaryCall;
    public createReverseSwap(request: boltzrpc_pb.CreateReverseSwapRequest, callback: (error: grpc.ServiceError | null, response: boltzrpc_pb.CreateReverseSwapResponse) => void): grpc.ClientUnaryCall;
    public createReverseSwap(request: boltzrpc_pb.CreateReverseSwapRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: boltzrpc_pb.CreateReverseSwapResponse) => void): grpc.ClientUnaryCall;
    public createReverseSwap(request: boltzrpc_pb.CreateReverseSwapRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: boltzrpc_pb.CreateReverseSwapResponse) => void): grpc.ClientUnaryCall;
}
