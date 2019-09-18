// package: boltzrpc
// file: boltzrpc.proto

/* tslint:disable */

import * as grpc from "grpc";
import * as boltzrpc_pb from "./boltzrpc_pb";

interface IBoltzService extends grpc.ServiceDefinition<grpc.UntypedServiceImplementation> {
    getInfo: IBoltzService_IGetInfo;
    getBalance: IBoltzService_IGetBalance;
    newAddress: IBoltzService_INewAddress;
    sendCoins: IBoltzService_ISendCoins;
    updateTimeoutBlockDelta: IBoltzService_IUpdateTimeoutBlockDelta;
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
interface IBoltzService_ISendCoins extends grpc.MethodDefinition<boltzrpc_pb.SendCoinsRequest, boltzrpc_pb.SendCoinsResponse> {
    path: string; // "/boltzrpc.Boltz/SendCoins"
    requestStream: boolean; // false
    responseStream: boolean; // false
    requestSerialize: grpc.serialize<boltzrpc_pb.SendCoinsRequest>;
    requestDeserialize: grpc.deserialize<boltzrpc_pb.SendCoinsRequest>;
    responseSerialize: grpc.serialize<boltzrpc_pb.SendCoinsResponse>;
    responseDeserialize: grpc.deserialize<boltzrpc_pb.SendCoinsResponse>;
}
interface IBoltzService_IUpdateTimeoutBlockDelta extends grpc.MethodDefinition<boltzrpc_pb.UpdateTimeoutBlockDeltaRequest, boltzrpc_pb.UpdateTimeoutBlockDeltaResponse> {
    path: string; // "/boltzrpc.Boltz/UpdateTimeoutBlockDelta"
    requestStream: boolean; // false
    responseStream: boolean; // false
    requestSerialize: grpc.serialize<boltzrpc_pb.UpdateTimeoutBlockDeltaRequest>;
    requestDeserialize: grpc.deserialize<boltzrpc_pb.UpdateTimeoutBlockDeltaRequest>;
    responseSerialize: grpc.serialize<boltzrpc_pb.UpdateTimeoutBlockDeltaResponse>;
    responseDeserialize: grpc.deserialize<boltzrpc_pb.UpdateTimeoutBlockDeltaResponse>;
}

export const BoltzService: IBoltzService;

export interface IBoltzServer {
    getInfo: grpc.handleUnaryCall<boltzrpc_pb.GetInfoRequest, boltzrpc_pb.GetInfoResponse>;
    getBalance: grpc.handleUnaryCall<boltzrpc_pb.GetBalanceRequest, boltzrpc_pb.GetBalanceResponse>;
    newAddress: grpc.handleUnaryCall<boltzrpc_pb.NewAddressRequest, boltzrpc_pb.NewAddressResponse>;
    sendCoins: grpc.handleUnaryCall<boltzrpc_pb.SendCoinsRequest, boltzrpc_pb.SendCoinsResponse>;
    updateTimeoutBlockDelta: grpc.handleUnaryCall<boltzrpc_pb.UpdateTimeoutBlockDeltaRequest, boltzrpc_pb.UpdateTimeoutBlockDeltaResponse>;
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
    sendCoins(request: boltzrpc_pb.SendCoinsRequest, callback: (error: grpc.ServiceError | null, response: boltzrpc_pb.SendCoinsResponse) => void): grpc.ClientUnaryCall;
    sendCoins(request: boltzrpc_pb.SendCoinsRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: boltzrpc_pb.SendCoinsResponse) => void): grpc.ClientUnaryCall;
    sendCoins(request: boltzrpc_pb.SendCoinsRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: boltzrpc_pb.SendCoinsResponse) => void): grpc.ClientUnaryCall;
    updateTimeoutBlockDelta(request: boltzrpc_pb.UpdateTimeoutBlockDeltaRequest, callback: (error: grpc.ServiceError | null, response: boltzrpc_pb.UpdateTimeoutBlockDeltaResponse) => void): grpc.ClientUnaryCall;
    updateTimeoutBlockDelta(request: boltzrpc_pb.UpdateTimeoutBlockDeltaRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: boltzrpc_pb.UpdateTimeoutBlockDeltaResponse) => void): grpc.ClientUnaryCall;
    updateTimeoutBlockDelta(request: boltzrpc_pb.UpdateTimeoutBlockDeltaRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: boltzrpc_pb.UpdateTimeoutBlockDeltaResponse) => void): grpc.ClientUnaryCall;
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
    public sendCoins(request: boltzrpc_pb.SendCoinsRequest, callback: (error: grpc.ServiceError | null, response: boltzrpc_pb.SendCoinsResponse) => void): grpc.ClientUnaryCall;
    public sendCoins(request: boltzrpc_pb.SendCoinsRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: boltzrpc_pb.SendCoinsResponse) => void): grpc.ClientUnaryCall;
    public sendCoins(request: boltzrpc_pb.SendCoinsRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: boltzrpc_pb.SendCoinsResponse) => void): grpc.ClientUnaryCall;
    public updateTimeoutBlockDelta(request: boltzrpc_pb.UpdateTimeoutBlockDeltaRequest, callback: (error: grpc.ServiceError | null, response: boltzrpc_pb.UpdateTimeoutBlockDeltaResponse) => void): grpc.ClientUnaryCall;
    public updateTimeoutBlockDelta(request: boltzrpc_pb.UpdateTimeoutBlockDeltaRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: boltzrpc_pb.UpdateTimeoutBlockDeltaResponse) => void): grpc.ClientUnaryCall;
    public updateTimeoutBlockDelta(request: boltzrpc_pb.UpdateTimeoutBlockDeltaRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: boltzrpc_pb.UpdateTimeoutBlockDeltaResponse) => void): grpc.ClientUnaryCall;
}
