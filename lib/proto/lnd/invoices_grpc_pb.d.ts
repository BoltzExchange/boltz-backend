// package: invoicesrpc
// file: lnd/invoices.proto

/* tslint:disable */
/* eslint-disable */

import * as grpc from "@grpc/grpc-js";
import * as lnd_invoices_pb from "../lnd/invoices_pb";
import * as lnd_rpc_pb from "../lnd/rpc_pb";

interface IInvoicesService extends grpc.ServiceDefinition<grpc.UntypedServiceImplementation> {
    subscribeSingleInvoice: IInvoicesService_ISubscribeSingleInvoice;
    cancelInvoice: IInvoicesService_ICancelInvoice;
    addHoldInvoice: IInvoicesService_IAddHoldInvoice;
    settleInvoice: IInvoicesService_ISettleInvoice;
    lookupInvoiceV2: IInvoicesService_ILookupInvoiceV2;
    htlcModifier: IInvoicesService_IHtlcModifier;
}

interface IInvoicesService_ISubscribeSingleInvoice extends grpc.MethodDefinition<lnd_invoices_pb.SubscribeSingleInvoiceRequest, lnd_rpc_pb.Invoice> {
    path: "/invoicesrpc.Invoices/SubscribeSingleInvoice";
    requestStream: false;
    responseStream: true;
    requestSerialize: grpc.serialize<lnd_invoices_pb.SubscribeSingleInvoiceRequest>;
    requestDeserialize: grpc.deserialize<lnd_invoices_pb.SubscribeSingleInvoiceRequest>;
    responseSerialize: grpc.serialize<lnd_rpc_pb.Invoice>;
    responseDeserialize: grpc.deserialize<lnd_rpc_pb.Invoice>;
}
interface IInvoicesService_ICancelInvoice extends grpc.MethodDefinition<lnd_invoices_pb.CancelInvoiceMsg, lnd_invoices_pb.CancelInvoiceResp> {
    path: "/invoicesrpc.Invoices/CancelInvoice";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<lnd_invoices_pb.CancelInvoiceMsg>;
    requestDeserialize: grpc.deserialize<lnd_invoices_pb.CancelInvoiceMsg>;
    responseSerialize: grpc.serialize<lnd_invoices_pb.CancelInvoiceResp>;
    responseDeserialize: grpc.deserialize<lnd_invoices_pb.CancelInvoiceResp>;
}
interface IInvoicesService_IAddHoldInvoice extends grpc.MethodDefinition<lnd_invoices_pb.AddHoldInvoiceRequest, lnd_invoices_pb.AddHoldInvoiceResp> {
    path: "/invoicesrpc.Invoices/AddHoldInvoice";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<lnd_invoices_pb.AddHoldInvoiceRequest>;
    requestDeserialize: grpc.deserialize<lnd_invoices_pb.AddHoldInvoiceRequest>;
    responseSerialize: grpc.serialize<lnd_invoices_pb.AddHoldInvoiceResp>;
    responseDeserialize: grpc.deserialize<lnd_invoices_pb.AddHoldInvoiceResp>;
}
interface IInvoicesService_ISettleInvoice extends grpc.MethodDefinition<lnd_invoices_pb.SettleInvoiceMsg, lnd_invoices_pb.SettleInvoiceResp> {
    path: "/invoicesrpc.Invoices/SettleInvoice";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<lnd_invoices_pb.SettleInvoiceMsg>;
    requestDeserialize: grpc.deserialize<lnd_invoices_pb.SettleInvoiceMsg>;
    responseSerialize: grpc.serialize<lnd_invoices_pb.SettleInvoiceResp>;
    responseDeserialize: grpc.deserialize<lnd_invoices_pb.SettleInvoiceResp>;
}
interface IInvoicesService_ILookupInvoiceV2 extends grpc.MethodDefinition<lnd_invoices_pb.LookupInvoiceMsg, lnd_rpc_pb.Invoice> {
    path: "/invoicesrpc.Invoices/LookupInvoiceV2";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<lnd_invoices_pb.LookupInvoiceMsg>;
    requestDeserialize: grpc.deserialize<lnd_invoices_pb.LookupInvoiceMsg>;
    responseSerialize: grpc.serialize<lnd_rpc_pb.Invoice>;
    responseDeserialize: grpc.deserialize<lnd_rpc_pb.Invoice>;
}
interface IInvoicesService_IHtlcModifier extends grpc.MethodDefinition<lnd_invoices_pb.HtlcModifyResponse, lnd_invoices_pb.HtlcModifyRequest> {
    path: "/invoicesrpc.Invoices/HtlcModifier";
    requestStream: true;
    responseStream: true;
    requestSerialize: grpc.serialize<lnd_invoices_pb.HtlcModifyResponse>;
    requestDeserialize: grpc.deserialize<lnd_invoices_pb.HtlcModifyResponse>;
    responseSerialize: grpc.serialize<lnd_invoices_pb.HtlcModifyRequest>;
    responseDeserialize: grpc.deserialize<lnd_invoices_pb.HtlcModifyRequest>;
}

export const InvoicesService: IInvoicesService;

export interface IInvoicesServer extends grpc.UntypedServiceImplementation {
    subscribeSingleInvoice: grpc.handleServerStreamingCall<lnd_invoices_pb.SubscribeSingleInvoiceRequest, lnd_rpc_pb.Invoice>;
    cancelInvoice: grpc.handleUnaryCall<lnd_invoices_pb.CancelInvoiceMsg, lnd_invoices_pb.CancelInvoiceResp>;
    addHoldInvoice: grpc.handleUnaryCall<lnd_invoices_pb.AddHoldInvoiceRequest, lnd_invoices_pb.AddHoldInvoiceResp>;
    settleInvoice: grpc.handleUnaryCall<lnd_invoices_pb.SettleInvoiceMsg, lnd_invoices_pb.SettleInvoiceResp>;
    lookupInvoiceV2: grpc.handleUnaryCall<lnd_invoices_pb.LookupInvoiceMsg, lnd_rpc_pb.Invoice>;
    htlcModifier: grpc.handleBidiStreamingCall<lnd_invoices_pb.HtlcModifyResponse, lnd_invoices_pb.HtlcModifyRequest>;
}

export interface IInvoicesClient {
    subscribeSingleInvoice(request: lnd_invoices_pb.SubscribeSingleInvoiceRequest, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<lnd_rpc_pb.Invoice>;
    subscribeSingleInvoice(request: lnd_invoices_pb.SubscribeSingleInvoiceRequest, metadata?: grpc.Metadata, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<lnd_rpc_pb.Invoice>;
    cancelInvoice(request: lnd_invoices_pb.CancelInvoiceMsg, callback: (error: grpc.ServiceError | null, response: lnd_invoices_pb.CancelInvoiceResp) => void): grpc.ClientUnaryCall;
    cancelInvoice(request: lnd_invoices_pb.CancelInvoiceMsg, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: lnd_invoices_pb.CancelInvoiceResp) => void): grpc.ClientUnaryCall;
    cancelInvoice(request: lnd_invoices_pb.CancelInvoiceMsg, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: lnd_invoices_pb.CancelInvoiceResp) => void): grpc.ClientUnaryCall;
    addHoldInvoice(request: lnd_invoices_pb.AddHoldInvoiceRequest, callback: (error: grpc.ServiceError | null, response: lnd_invoices_pb.AddHoldInvoiceResp) => void): grpc.ClientUnaryCall;
    addHoldInvoice(request: lnd_invoices_pb.AddHoldInvoiceRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: lnd_invoices_pb.AddHoldInvoiceResp) => void): grpc.ClientUnaryCall;
    addHoldInvoice(request: lnd_invoices_pb.AddHoldInvoiceRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: lnd_invoices_pb.AddHoldInvoiceResp) => void): grpc.ClientUnaryCall;
    settleInvoice(request: lnd_invoices_pb.SettleInvoiceMsg, callback: (error: grpc.ServiceError | null, response: lnd_invoices_pb.SettleInvoiceResp) => void): grpc.ClientUnaryCall;
    settleInvoice(request: lnd_invoices_pb.SettleInvoiceMsg, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: lnd_invoices_pb.SettleInvoiceResp) => void): grpc.ClientUnaryCall;
    settleInvoice(request: lnd_invoices_pb.SettleInvoiceMsg, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: lnd_invoices_pb.SettleInvoiceResp) => void): grpc.ClientUnaryCall;
    lookupInvoiceV2(request: lnd_invoices_pb.LookupInvoiceMsg, callback: (error: grpc.ServiceError | null, response: lnd_rpc_pb.Invoice) => void): grpc.ClientUnaryCall;
    lookupInvoiceV2(request: lnd_invoices_pb.LookupInvoiceMsg, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: lnd_rpc_pb.Invoice) => void): grpc.ClientUnaryCall;
    lookupInvoiceV2(request: lnd_invoices_pb.LookupInvoiceMsg, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: lnd_rpc_pb.Invoice) => void): grpc.ClientUnaryCall;
    htlcModifier(): grpc.ClientDuplexStream<lnd_invoices_pb.HtlcModifyResponse, lnd_invoices_pb.HtlcModifyRequest>;
    htlcModifier(options: Partial<grpc.CallOptions>): grpc.ClientDuplexStream<lnd_invoices_pb.HtlcModifyResponse, lnd_invoices_pb.HtlcModifyRequest>;
    htlcModifier(metadata: grpc.Metadata, options?: Partial<grpc.CallOptions>): grpc.ClientDuplexStream<lnd_invoices_pb.HtlcModifyResponse, lnd_invoices_pb.HtlcModifyRequest>;
}

export class InvoicesClient extends grpc.Client implements IInvoicesClient {
    constructor(address: string, credentials: grpc.ChannelCredentials, options?: Partial<grpc.ClientOptions>);
    public subscribeSingleInvoice(request: lnd_invoices_pb.SubscribeSingleInvoiceRequest, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<lnd_rpc_pb.Invoice>;
    public subscribeSingleInvoice(request: lnd_invoices_pb.SubscribeSingleInvoiceRequest, metadata?: grpc.Metadata, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<lnd_rpc_pb.Invoice>;
    public cancelInvoice(request: lnd_invoices_pb.CancelInvoiceMsg, callback: (error: grpc.ServiceError | null, response: lnd_invoices_pb.CancelInvoiceResp) => void): grpc.ClientUnaryCall;
    public cancelInvoice(request: lnd_invoices_pb.CancelInvoiceMsg, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: lnd_invoices_pb.CancelInvoiceResp) => void): grpc.ClientUnaryCall;
    public cancelInvoice(request: lnd_invoices_pb.CancelInvoiceMsg, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: lnd_invoices_pb.CancelInvoiceResp) => void): grpc.ClientUnaryCall;
    public addHoldInvoice(request: lnd_invoices_pb.AddHoldInvoiceRequest, callback: (error: grpc.ServiceError | null, response: lnd_invoices_pb.AddHoldInvoiceResp) => void): grpc.ClientUnaryCall;
    public addHoldInvoice(request: lnd_invoices_pb.AddHoldInvoiceRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: lnd_invoices_pb.AddHoldInvoiceResp) => void): grpc.ClientUnaryCall;
    public addHoldInvoice(request: lnd_invoices_pb.AddHoldInvoiceRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: lnd_invoices_pb.AddHoldInvoiceResp) => void): grpc.ClientUnaryCall;
    public settleInvoice(request: lnd_invoices_pb.SettleInvoiceMsg, callback: (error: grpc.ServiceError | null, response: lnd_invoices_pb.SettleInvoiceResp) => void): grpc.ClientUnaryCall;
    public settleInvoice(request: lnd_invoices_pb.SettleInvoiceMsg, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: lnd_invoices_pb.SettleInvoiceResp) => void): grpc.ClientUnaryCall;
    public settleInvoice(request: lnd_invoices_pb.SettleInvoiceMsg, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: lnd_invoices_pb.SettleInvoiceResp) => void): grpc.ClientUnaryCall;
    public lookupInvoiceV2(request: lnd_invoices_pb.LookupInvoiceMsg, callback: (error: grpc.ServiceError | null, response: lnd_rpc_pb.Invoice) => void): grpc.ClientUnaryCall;
    public lookupInvoiceV2(request: lnd_invoices_pb.LookupInvoiceMsg, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: lnd_rpc_pb.Invoice) => void): grpc.ClientUnaryCall;
    public lookupInvoiceV2(request: lnd_invoices_pb.LookupInvoiceMsg, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: lnd_rpc_pb.Invoice) => void): grpc.ClientUnaryCall;
    public htlcModifier(options?: Partial<grpc.CallOptions>): grpc.ClientDuplexStream<lnd_invoices_pb.HtlcModifyResponse, lnd_invoices_pb.HtlcModifyRequest>;
    public htlcModifier(metadata?: grpc.Metadata, options?: Partial<grpc.CallOptions>): grpc.ClientDuplexStream<lnd_invoices_pb.HtlcModifyResponse, lnd_invoices_pb.HtlcModifyRequest>;
}
