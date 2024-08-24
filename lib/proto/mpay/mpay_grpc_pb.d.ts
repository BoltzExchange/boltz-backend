// package: mpay
// file: mpay.proto

/* tslint:disable */
/* eslint-disable */

import * as grpc from "@grpc/grpc-js";
import * as mpay_pb from "./mpay_pb";

interface IMpayService extends grpc.ServiceDefinition<grpc.UntypedServiceImplementation> {
    getInfo: IMpayService_IGetInfo;
    getRoutes: IMpayService_IGetRoutes;
    listPayments: IMpayService_IListPayments;
    pay: IMpayService_IPay;
    resetPathMemory: IMpayService_IResetPathMemory;
    payStatus: IMpayService_IPayStatus;
}

interface IMpayService_IGetInfo extends grpc.MethodDefinition<mpay_pb.GetInfoRequest, mpay_pb.GetInfoResponse> {
    path: "/mpay.Mpay/GetInfo";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<mpay_pb.GetInfoRequest>;
    requestDeserialize: grpc.deserialize<mpay_pb.GetInfoRequest>;
    responseSerialize: grpc.serialize<mpay_pb.GetInfoResponse>;
    responseDeserialize: grpc.deserialize<mpay_pb.GetInfoResponse>;
}
interface IMpayService_IGetRoutes extends grpc.MethodDefinition<mpay_pb.GetRoutesRequest, mpay_pb.GetRoutesResponse> {
    path: "/mpay.Mpay/GetRoutes";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<mpay_pb.GetRoutesRequest>;
    requestDeserialize: grpc.deserialize<mpay_pb.GetRoutesRequest>;
    responseSerialize: grpc.serialize<mpay_pb.GetRoutesResponse>;
    responseDeserialize: grpc.deserialize<mpay_pb.GetRoutesResponse>;
}
interface IMpayService_IListPayments extends grpc.MethodDefinition<mpay_pb.ListPaymentsRequest, mpay_pb.ListPaymentsResponse> {
    path: "/mpay.Mpay/ListPayments";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<mpay_pb.ListPaymentsRequest>;
    requestDeserialize: grpc.deserialize<mpay_pb.ListPaymentsRequest>;
    responseSerialize: grpc.serialize<mpay_pb.ListPaymentsResponse>;
    responseDeserialize: grpc.deserialize<mpay_pb.ListPaymentsResponse>;
}
interface IMpayService_IPay extends grpc.MethodDefinition<mpay_pb.PayRequest, mpay_pb.PayResponse> {
    path: "/mpay.Mpay/Pay";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<mpay_pb.PayRequest>;
    requestDeserialize: grpc.deserialize<mpay_pb.PayRequest>;
    responseSerialize: grpc.serialize<mpay_pb.PayResponse>;
    responseDeserialize: grpc.deserialize<mpay_pb.PayResponse>;
}
interface IMpayService_IResetPathMemory extends grpc.MethodDefinition<mpay_pb.ResetPathMemoryRequest, mpay_pb.ResetPathMemoryResponse> {
    path: "/mpay.Mpay/ResetPathMemory";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<mpay_pb.ResetPathMemoryRequest>;
    requestDeserialize: grpc.deserialize<mpay_pb.ResetPathMemoryRequest>;
    responseSerialize: grpc.serialize<mpay_pb.ResetPathMemoryResponse>;
    responseDeserialize: grpc.deserialize<mpay_pb.ResetPathMemoryResponse>;
}
interface IMpayService_IPayStatus extends grpc.MethodDefinition<mpay_pb.PayStatusRequest, mpay_pb.PayStatusResponse> {
    path: "/mpay.Mpay/PayStatus";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<mpay_pb.PayStatusRequest>;
    requestDeserialize: grpc.deserialize<mpay_pb.PayStatusRequest>;
    responseSerialize: grpc.serialize<mpay_pb.PayStatusResponse>;
    responseDeserialize: grpc.deserialize<mpay_pb.PayStatusResponse>;
}

export const MpayService: IMpayService;

export interface IMpayServer extends grpc.UntypedServiceImplementation {
    getInfo: grpc.handleUnaryCall<mpay_pb.GetInfoRequest, mpay_pb.GetInfoResponse>;
    getRoutes: grpc.handleUnaryCall<mpay_pb.GetRoutesRequest, mpay_pb.GetRoutesResponse>;
    listPayments: grpc.handleUnaryCall<mpay_pb.ListPaymentsRequest, mpay_pb.ListPaymentsResponse>;
    pay: grpc.handleUnaryCall<mpay_pb.PayRequest, mpay_pb.PayResponse>;
    resetPathMemory: grpc.handleUnaryCall<mpay_pb.ResetPathMemoryRequest, mpay_pb.ResetPathMemoryResponse>;
    payStatus: grpc.handleUnaryCall<mpay_pb.PayStatusRequest, mpay_pb.PayStatusResponse>;
}

export interface IMpayClient {
    getInfo(request: mpay_pb.GetInfoRequest, callback: (error: grpc.ServiceError | null, response: mpay_pb.GetInfoResponse) => void): grpc.ClientUnaryCall;
    getInfo(request: mpay_pb.GetInfoRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: mpay_pb.GetInfoResponse) => void): grpc.ClientUnaryCall;
    getInfo(request: mpay_pb.GetInfoRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: mpay_pb.GetInfoResponse) => void): grpc.ClientUnaryCall;
    getRoutes(request: mpay_pb.GetRoutesRequest, callback: (error: grpc.ServiceError | null, response: mpay_pb.GetRoutesResponse) => void): grpc.ClientUnaryCall;
    getRoutes(request: mpay_pb.GetRoutesRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: mpay_pb.GetRoutesResponse) => void): grpc.ClientUnaryCall;
    getRoutes(request: mpay_pb.GetRoutesRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: mpay_pb.GetRoutesResponse) => void): grpc.ClientUnaryCall;
    listPayments(request: mpay_pb.ListPaymentsRequest, callback: (error: grpc.ServiceError | null, response: mpay_pb.ListPaymentsResponse) => void): grpc.ClientUnaryCall;
    listPayments(request: mpay_pb.ListPaymentsRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: mpay_pb.ListPaymentsResponse) => void): grpc.ClientUnaryCall;
    listPayments(request: mpay_pb.ListPaymentsRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: mpay_pb.ListPaymentsResponse) => void): grpc.ClientUnaryCall;
    pay(request: mpay_pb.PayRequest, callback: (error: grpc.ServiceError | null, response: mpay_pb.PayResponse) => void): grpc.ClientUnaryCall;
    pay(request: mpay_pb.PayRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: mpay_pb.PayResponse) => void): grpc.ClientUnaryCall;
    pay(request: mpay_pb.PayRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: mpay_pb.PayResponse) => void): grpc.ClientUnaryCall;
    resetPathMemory(request: mpay_pb.ResetPathMemoryRequest, callback: (error: grpc.ServiceError | null, response: mpay_pb.ResetPathMemoryResponse) => void): grpc.ClientUnaryCall;
    resetPathMemory(request: mpay_pb.ResetPathMemoryRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: mpay_pb.ResetPathMemoryResponse) => void): grpc.ClientUnaryCall;
    resetPathMemory(request: mpay_pb.ResetPathMemoryRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: mpay_pb.ResetPathMemoryResponse) => void): grpc.ClientUnaryCall;
    payStatus(request: mpay_pb.PayStatusRequest, callback: (error: grpc.ServiceError | null, response: mpay_pb.PayStatusResponse) => void): grpc.ClientUnaryCall;
    payStatus(request: mpay_pb.PayStatusRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: mpay_pb.PayStatusResponse) => void): grpc.ClientUnaryCall;
    payStatus(request: mpay_pb.PayStatusRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: mpay_pb.PayStatusResponse) => void): grpc.ClientUnaryCall;
}

export class MpayClient extends grpc.Client implements IMpayClient {
    constructor(address: string, credentials: grpc.ChannelCredentials, options?: Partial<grpc.ClientOptions>);
    public getInfo(request: mpay_pb.GetInfoRequest, callback: (error: grpc.ServiceError | null, response: mpay_pb.GetInfoResponse) => void): grpc.ClientUnaryCall;
    public getInfo(request: mpay_pb.GetInfoRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: mpay_pb.GetInfoResponse) => void): grpc.ClientUnaryCall;
    public getInfo(request: mpay_pb.GetInfoRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: mpay_pb.GetInfoResponse) => void): grpc.ClientUnaryCall;
    public getRoutes(request: mpay_pb.GetRoutesRequest, callback: (error: grpc.ServiceError | null, response: mpay_pb.GetRoutesResponse) => void): grpc.ClientUnaryCall;
    public getRoutes(request: mpay_pb.GetRoutesRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: mpay_pb.GetRoutesResponse) => void): grpc.ClientUnaryCall;
    public getRoutes(request: mpay_pb.GetRoutesRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: mpay_pb.GetRoutesResponse) => void): grpc.ClientUnaryCall;
    public listPayments(request: mpay_pb.ListPaymentsRequest, callback: (error: grpc.ServiceError | null, response: mpay_pb.ListPaymentsResponse) => void): grpc.ClientUnaryCall;
    public listPayments(request: mpay_pb.ListPaymentsRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: mpay_pb.ListPaymentsResponse) => void): grpc.ClientUnaryCall;
    public listPayments(request: mpay_pb.ListPaymentsRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: mpay_pb.ListPaymentsResponse) => void): grpc.ClientUnaryCall;
    public pay(request: mpay_pb.PayRequest, callback: (error: grpc.ServiceError | null, response: mpay_pb.PayResponse) => void): grpc.ClientUnaryCall;
    public pay(request: mpay_pb.PayRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: mpay_pb.PayResponse) => void): grpc.ClientUnaryCall;
    public pay(request: mpay_pb.PayRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: mpay_pb.PayResponse) => void): grpc.ClientUnaryCall;
    public resetPathMemory(request: mpay_pb.ResetPathMemoryRequest, callback: (error: grpc.ServiceError | null, response: mpay_pb.ResetPathMemoryResponse) => void): grpc.ClientUnaryCall;
    public resetPathMemory(request: mpay_pb.ResetPathMemoryRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: mpay_pb.ResetPathMemoryResponse) => void): grpc.ClientUnaryCall;
    public resetPathMemory(request: mpay_pb.ResetPathMemoryRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: mpay_pb.ResetPathMemoryResponse) => void): grpc.ClientUnaryCall;
    public payStatus(request: mpay_pb.PayStatusRequest, callback: (error: grpc.ServiceError | null, response: mpay_pb.PayStatusResponse) => void): grpc.ClientUnaryCall;
    public payStatus(request: mpay_pb.PayStatusRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: mpay_pb.PayStatusResponse) => void): grpc.ClientUnaryCall;
    public payStatus(request: mpay_pb.PayStatusRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: mpay_pb.PayStatusResponse) => void): grpc.ClientUnaryCall;
}
