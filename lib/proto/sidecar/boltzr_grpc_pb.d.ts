// package: boltzr
// file: boltzr.proto

/* tslint:disable */
/* eslint-disable */

import * as grpc from "@grpc/grpc-js";
import * as boltzr_pb from "./boltzr_pb";

interface IBoltzRService extends grpc.ServiceDefinition<grpc.UntypedServiceImplementation> {
    getInfo: IBoltzRService_IGetInfo;
    startWebHookRetries: IBoltzRService_IStartWebHookRetries;
    createWebHook: IBoltzRService_ICreateWebHook;
    sendWebHook: IBoltzRService_ISendWebHook;
}

interface IBoltzRService_IGetInfo extends grpc.MethodDefinition<boltzr_pb.GetInfoRequest, boltzr_pb.GetInfoResponse> {
    path: "/boltzr.BoltzR/GetInfo";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<boltzr_pb.GetInfoRequest>;
    requestDeserialize: grpc.deserialize<boltzr_pb.GetInfoRequest>;
    responseSerialize: grpc.serialize<boltzr_pb.GetInfoResponse>;
    responseDeserialize: grpc.deserialize<boltzr_pb.GetInfoResponse>;
}
interface IBoltzRService_IStartWebHookRetries extends grpc.MethodDefinition<boltzr_pb.StartWebHookRetriesRequest, boltzr_pb.StartWebHookRetriesResponse> {
    path: "/boltzr.BoltzR/StartWebHookRetries";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<boltzr_pb.StartWebHookRetriesRequest>;
    requestDeserialize: grpc.deserialize<boltzr_pb.StartWebHookRetriesRequest>;
    responseSerialize: grpc.serialize<boltzr_pb.StartWebHookRetriesResponse>;
    responseDeserialize: grpc.deserialize<boltzr_pb.StartWebHookRetriesResponse>;
}
interface IBoltzRService_ICreateWebHook extends grpc.MethodDefinition<boltzr_pb.CreateWebHookRequest, boltzr_pb.CreateWebHookResponse> {
    path: "/boltzr.BoltzR/CreateWebHook";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<boltzr_pb.CreateWebHookRequest>;
    requestDeserialize: grpc.deserialize<boltzr_pb.CreateWebHookRequest>;
    responseSerialize: grpc.serialize<boltzr_pb.CreateWebHookResponse>;
    responseDeserialize: grpc.deserialize<boltzr_pb.CreateWebHookResponse>;
}
interface IBoltzRService_ISendWebHook extends grpc.MethodDefinition<boltzr_pb.SendWebHookRequest, boltzr_pb.SendWebHookResponse> {
    path: "/boltzr.BoltzR/SendWebHook";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<boltzr_pb.SendWebHookRequest>;
    requestDeserialize: grpc.deserialize<boltzr_pb.SendWebHookRequest>;
    responseSerialize: grpc.serialize<boltzr_pb.SendWebHookResponse>;
    responseDeserialize: grpc.deserialize<boltzr_pb.SendWebHookResponse>;
}

export const BoltzRService: IBoltzRService;

export interface IBoltzRServer extends grpc.UntypedServiceImplementation {
    getInfo: grpc.handleUnaryCall<boltzr_pb.GetInfoRequest, boltzr_pb.GetInfoResponse>;
    startWebHookRetries: grpc.handleUnaryCall<boltzr_pb.StartWebHookRetriesRequest, boltzr_pb.StartWebHookRetriesResponse>;
    createWebHook: grpc.handleUnaryCall<boltzr_pb.CreateWebHookRequest, boltzr_pb.CreateWebHookResponse>;
    sendWebHook: grpc.handleUnaryCall<boltzr_pb.SendWebHookRequest, boltzr_pb.SendWebHookResponse>;
}

export interface IBoltzRClient {
    getInfo(request: boltzr_pb.GetInfoRequest, callback: (error: grpc.ServiceError | null, response: boltzr_pb.GetInfoResponse) => void): grpc.ClientUnaryCall;
    getInfo(request: boltzr_pb.GetInfoRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: boltzr_pb.GetInfoResponse) => void): grpc.ClientUnaryCall;
    getInfo(request: boltzr_pb.GetInfoRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: boltzr_pb.GetInfoResponse) => void): grpc.ClientUnaryCall;
    startWebHookRetries(request: boltzr_pb.StartWebHookRetriesRequest, callback: (error: grpc.ServiceError | null, response: boltzr_pb.StartWebHookRetriesResponse) => void): grpc.ClientUnaryCall;
    startWebHookRetries(request: boltzr_pb.StartWebHookRetriesRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: boltzr_pb.StartWebHookRetriesResponse) => void): grpc.ClientUnaryCall;
    startWebHookRetries(request: boltzr_pb.StartWebHookRetriesRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: boltzr_pb.StartWebHookRetriesResponse) => void): grpc.ClientUnaryCall;
    createWebHook(request: boltzr_pb.CreateWebHookRequest, callback: (error: grpc.ServiceError | null, response: boltzr_pb.CreateWebHookResponse) => void): grpc.ClientUnaryCall;
    createWebHook(request: boltzr_pb.CreateWebHookRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: boltzr_pb.CreateWebHookResponse) => void): grpc.ClientUnaryCall;
    createWebHook(request: boltzr_pb.CreateWebHookRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: boltzr_pb.CreateWebHookResponse) => void): grpc.ClientUnaryCall;
    sendWebHook(request: boltzr_pb.SendWebHookRequest, callback: (error: grpc.ServiceError | null, response: boltzr_pb.SendWebHookResponse) => void): grpc.ClientUnaryCall;
    sendWebHook(request: boltzr_pb.SendWebHookRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: boltzr_pb.SendWebHookResponse) => void): grpc.ClientUnaryCall;
    sendWebHook(request: boltzr_pb.SendWebHookRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: boltzr_pb.SendWebHookResponse) => void): grpc.ClientUnaryCall;
}

export class BoltzRClient extends grpc.Client implements IBoltzRClient {
    constructor(address: string, credentials: grpc.ChannelCredentials, options?: Partial<grpc.ClientOptions>);
    public getInfo(request: boltzr_pb.GetInfoRequest, callback: (error: grpc.ServiceError | null, response: boltzr_pb.GetInfoResponse) => void): grpc.ClientUnaryCall;
    public getInfo(request: boltzr_pb.GetInfoRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: boltzr_pb.GetInfoResponse) => void): grpc.ClientUnaryCall;
    public getInfo(request: boltzr_pb.GetInfoRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: boltzr_pb.GetInfoResponse) => void): grpc.ClientUnaryCall;
    public startWebHookRetries(request: boltzr_pb.StartWebHookRetriesRequest, callback: (error: grpc.ServiceError | null, response: boltzr_pb.StartWebHookRetriesResponse) => void): grpc.ClientUnaryCall;
    public startWebHookRetries(request: boltzr_pb.StartWebHookRetriesRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: boltzr_pb.StartWebHookRetriesResponse) => void): grpc.ClientUnaryCall;
    public startWebHookRetries(request: boltzr_pb.StartWebHookRetriesRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: boltzr_pb.StartWebHookRetriesResponse) => void): grpc.ClientUnaryCall;
    public createWebHook(request: boltzr_pb.CreateWebHookRequest, callback: (error: grpc.ServiceError | null, response: boltzr_pb.CreateWebHookResponse) => void): grpc.ClientUnaryCall;
    public createWebHook(request: boltzr_pb.CreateWebHookRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: boltzr_pb.CreateWebHookResponse) => void): grpc.ClientUnaryCall;
    public createWebHook(request: boltzr_pb.CreateWebHookRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: boltzr_pb.CreateWebHookResponse) => void): grpc.ClientUnaryCall;
    public sendWebHook(request: boltzr_pb.SendWebHookRequest, callback: (error: grpc.ServiceError | null, response: boltzr_pb.SendWebHookResponse) => void): grpc.ClientUnaryCall;
    public sendWebHook(request: boltzr_pb.SendWebHookRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: boltzr_pb.SendWebHookResponse) => void): grpc.ClientUnaryCall;
    public sendWebHook(request: boltzr_pb.SendWebHookRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: boltzr_pb.SendWebHookResponse) => void): grpc.ClientUnaryCall;
}
