// package: invoicesrpc
// file: lndinvoices.proto

/* tslint:disable */
/* eslint-disable */

import * as grpc from "grpc";
import * as lndinvoices_pb from "./lndinvoices_pb";
import * as lndrpc_pb from "./lndrpc_pb";

interface IInvoicesService extends grpc.ServiceDefinition<grpc.UntypedServiceImplementation> {
    subscribeSingleInvoice: IInvoicesService_ISubscribeSingleInvoice;
    cancelInvoice: IInvoicesService_ICancelInvoice;
    addHoldInvoice: IInvoicesService_IAddHoldInvoice;
    settleInvoice: IInvoicesService_ISettleInvoice;
}

interface IInvoicesService_ISubscribeSingleInvoice extends grpc.MethodDefinition<lndinvoices_pb.SubscribeSingleInvoiceRequest, lndrpc_pb.Invoice> {
    path: string; // "/invoicesrpc.Invoices/SubscribeSingleInvoice"
    requestStream: false;
    responseStream: true;
    requestSerialize: grpc.serialize<lndinvoices_pb.SubscribeSingleInvoiceRequest>;
    requestDeserialize: grpc.deserialize<lndinvoices_pb.SubscribeSingleInvoiceRequest>;
    responseSerialize: grpc.serialize<lndrpc_pb.Invoice>;
    responseDeserialize: grpc.deserialize<lndrpc_pb.Invoice>;
}
interface IInvoicesService_ICancelInvoice extends grpc.MethodDefinition<lndinvoices_pb.CancelInvoiceMsg, lndinvoices_pb.CancelInvoiceResp> {
    path: string; // "/invoicesrpc.Invoices/CancelInvoice"
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<lndinvoices_pb.CancelInvoiceMsg>;
    requestDeserialize: grpc.deserialize<lndinvoices_pb.CancelInvoiceMsg>;
    responseSerialize: grpc.serialize<lndinvoices_pb.CancelInvoiceResp>;
    responseDeserialize: grpc.deserialize<lndinvoices_pb.CancelInvoiceResp>;
}
interface IInvoicesService_IAddHoldInvoice extends grpc.MethodDefinition<lndinvoices_pb.AddHoldInvoiceRequest, lndinvoices_pb.AddHoldInvoiceResp> {
    path: string; // "/invoicesrpc.Invoices/AddHoldInvoice"
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<lndinvoices_pb.AddHoldInvoiceRequest>;
    requestDeserialize: grpc.deserialize<lndinvoices_pb.AddHoldInvoiceRequest>;
    responseSerialize: grpc.serialize<lndinvoices_pb.AddHoldInvoiceResp>;
    responseDeserialize: grpc.deserialize<lndinvoices_pb.AddHoldInvoiceResp>;
}
interface IInvoicesService_ISettleInvoice extends grpc.MethodDefinition<lndinvoices_pb.SettleInvoiceMsg, lndinvoices_pb.SettleInvoiceResp> {
    path: string; // "/invoicesrpc.Invoices/SettleInvoice"
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<lndinvoices_pb.SettleInvoiceMsg>;
    requestDeserialize: grpc.deserialize<lndinvoices_pb.SettleInvoiceMsg>;
    responseSerialize: grpc.serialize<lndinvoices_pb.SettleInvoiceResp>;
    responseDeserialize: grpc.deserialize<lndinvoices_pb.SettleInvoiceResp>;
}

export const InvoicesService: IInvoicesService;

export interface IInvoicesServer {
    subscribeSingleInvoice: grpc.handleServerStreamingCall<lndinvoices_pb.SubscribeSingleInvoiceRequest, lndrpc_pb.Invoice>;
    cancelInvoice: grpc.handleUnaryCall<lndinvoices_pb.CancelInvoiceMsg, lndinvoices_pb.CancelInvoiceResp>;
    addHoldInvoice: grpc.handleUnaryCall<lndinvoices_pb.AddHoldInvoiceRequest, lndinvoices_pb.AddHoldInvoiceResp>;
    settleInvoice: grpc.handleUnaryCall<lndinvoices_pb.SettleInvoiceMsg, lndinvoices_pb.SettleInvoiceResp>;
}

export interface IInvoicesClient {
    subscribeSingleInvoice(request: lndinvoices_pb.SubscribeSingleInvoiceRequest, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<lndrpc_pb.Invoice>;
    subscribeSingleInvoice(request: lndinvoices_pb.SubscribeSingleInvoiceRequest, metadata?: grpc.Metadata, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<lndrpc_pb.Invoice>;
    cancelInvoice(request: lndinvoices_pb.CancelInvoiceMsg, callback: (error: grpc.ServiceError | null, response: lndinvoices_pb.CancelInvoiceResp) => void): grpc.ClientUnaryCall;
    cancelInvoice(request: lndinvoices_pb.CancelInvoiceMsg, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: lndinvoices_pb.CancelInvoiceResp) => void): grpc.ClientUnaryCall;
    cancelInvoice(request: lndinvoices_pb.CancelInvoiceMsg, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: lndinvoices_pb.CancelInvoiceResp) => void): grpc.ClientUnaryCall;
    addHoldInvoice(request: lndinvoices_pb.AddHoldInvoiceRequest, callback: (error: grpc.ServiceError | null, response: lndinvoices_pb.AddHoldInvoiceResp) => void): grpc.ClientUnaryCall;
    addHoldInvoice(request: lndinvoices_pb.AddHoldInvoiceRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: lndinvoices_pb.AddHoldInvoiceResp) => void): grpc.ClientUnaryCall;
    addHoldInvoice(request: lndinvoices_pb.AddHoldInvoiceRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: lndinvoices_pb.AddHoldInvoiceResp) => void): grpc.ClientUnaryCall;
    settleInvoice(request: lndinvoices_pb.SettleInvoiceMsg, callback: (error: grpc.ServiceError | null, response: lndinvoices_pb.SettleInvoiceResp) => void): grpc.ClientUnaryCall;
    settleInvoice(request: lndinvoices_pb.SettleInvoiceMsg, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: lndinvoices_pb.SettleInvoiceResp) => void): grpc.ClientUnaryCall;
    settleInvoice(request: lndinvoices_pb.SettleInvoiceMsg, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: lndinvoices_pb.SettleInvoiceResp) => void): grpc.ClientUnaryCall;
}

export class InvoicesClient extends grpc.Client implements IInvoicesClient {
    constructor(address: string, credentials: grpc.ChannelCredentials, options?: object);
    public subscribeSingleInvoice(request: lndinvoices_pb.SubscribeSingleInvoiceRequest, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<lndrpc_pb.Invoice>;
    public subscribeSingleInvoice(request: lndinvoices_pb.SubscribeSingleInvoiceRequest, metadata?: grpc.Metadata, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<lndrpc_pb.Invoice>;
    public cancelInvoice(request: lndinvoices_pb.CancelInvoiceMsg, callback: (error: grpc.ServiceError | null, response: lndinvoices_pb.CancelInvoiceResp) => void): grpc.ClientUnaryCall;
    public cancelInvoice(request: lndinvoices_pb.CancelInvoiceMsg, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: lndinvoices_pb.CancelInvoiceResp) => void): grpc.ClientUnaryCall;
    public cancelInvoice(request: lndinvoices_pb.CancelInvoiceMsg, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: lndinvoices_pb.CancelInvoiceResp) => void): grpc.ClientUnaryCall;
    public addHoldInvoice(request: lndinvoices_pb.AddHoldInvoiceRequest, callback: (error: grpc.ServiceError | null, response: lndinvoices_pb.AddHoldInvoiceResp) => void): grpc.ClientUnaryCall;
    public addHoldInvoice(request: lndinvoices_pb.AddHoldInvoiceRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: lndinvoices_pb.AddHoldInvoiceResp) => void): grpc.ClientUnaryCall;
    public addHoldInvoice(request: lndinvoices_pb.AddHoldInvoiceRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: lndinvoices_pb.AddHoldInvoiceResp) => void): grpc.ClientUnaryCall;
    public settleInvoice(request: lndinvoices_pb.SettleInvoiceMsg, callback: (error: grpc.ServiceError | null, response: lndinvoices_pb.SettleInvoiceResp) => void): grpc.ClientUnaryCall;
    public settleInvoice(request: lndinvoices_pb.SettleInvoiceMsg, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: lndinvoices_pb.SettleInvoiceResp) => void): grpc.ClientUnaryCall;
    public settleInvoice(request: lndinvoices_pb.SettleInvoiceMsg, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: lndinvoices_pb.SettleInvoiceResp) => void): grpc.ClientUnaryCall;
}
