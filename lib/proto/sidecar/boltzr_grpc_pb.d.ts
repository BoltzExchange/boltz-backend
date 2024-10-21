// package: boltzr
// file: boltzr.proto

/* tslint:disable */
/* eslint-disable */

import * as grpc from "@grpc/grpc-js";
import * as boltzr_pb from "./boltzr_pb";

interface IBoltzRService extends grpc.ServiceDefinition<grpc.UntypedServiceImplementation> {
    getInfo: IBoltzRService_IGetInfo;
    setLogLevel: IBoltzRService_ISetLogLevel;
    sendMessage: IBoltzRService_ISendMessage;
    getMessages: IBoltzRService_IGetMessages;
    swapUpdate: IBoltzRService_ISwapUpdate;
    startWebHookRetries: IBoltzRService_IStartWebHookRetries;
    createWebHook: IBoltzRService_ICreateWebHook;
    sendWebHook: IBoltzRService_ISendWebHook;
    signEvmRefund: IBoltzRService_ISignEvmRefund;
    decodeInvoiceOrOffer: IBoltzRService_IDecodeInvoiceOrOffer;
    fetchInvoice: IBoltzRService_IFetchInvoice;
    scanMempool: IBoltzRService_IScanMempool;
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
interface IBoltzRService_ISetLogLevel extends grpc.MethodDefinition<boltzr_pb.SetLogLevelRequest, boltzr_pb.SetLogLevelResponse> {
    path: "/boltzr.BoltzR/SetLogLevel";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<boltzr_pb.SetLogLevelRequest>;
    requestDeserialize: grpc.deserialize<boltzr_pb.SetLogLevelRequest>;
    responseSerialize: grpc.serialize<boltzr_pb.SetLogLevelResponse>;
    responseDeserialize: grpc.deserialize<boltzr_pb.SetLogLevelResponse>;
}
interface IBoltzRService_ISendMessage extends grpc.MethodDefinition<boltzr_pb.SendMessageRequest, boltzr_pb.SendMessageResponse> {
    path: "/boltzr.BoltzR/SendMessage";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<boltzr_pb.SendMessageRequest>;
    requestDeserialize: grpc.deserialize<boltzr_pb.SendMessageRequest>;
    responseSerialize: grpc.serialize<boltzr_pb.SendMessageResponse>;
    responseDeserialize: grpc.deserialize<boltzr_pb.SendMessageResponse>;
}
interface IBoltzRService_IGetMessages extends grpc.MethodDefinition<boltzr_pb.GetMessagesRequest, boltzr_pb.GetMessagesResponse> {
    path: "/boltzr.BoltzR/GetMessages";
    requestStream: false;
    responseStream: true;
    requestSerialize: grpc.serialize<boltzr_pb.GetMessagesRequest>;
    requestDeserialize: grpc.deserialize<boltzr_pb.GetMessagesRequest>;
    responseSerialize: grpc.serialize<boltzr_pb.GetMessagesResponse>;
    responseDeserialize: grpc.deserialize<boltzr_pb.GetMessagesResponse>;
}
interface IBoltzRService_ISwapUpdate extends grpc.MethodDefinition<boltzr_pb.SwapUpdateRequest, boltzr_pb.SwapUpdateResponse> {
    path: "/boltzr.BoltzR/SwapUpdate";
    requestStream: true;
    responseStream: true;
    requestSerialize: grpc.serialize<boltzr_pb.SwapUpdateRequest>;
    requestDeserialize: grpc.deserialize<boltzr_pb.SwapUpdateRequest>;
    responseSerialize: grpc.serialize<boltzr_pb.SwapUpdateResponse>;
    responseDeserialize: grpc.deserialize<boltzr_pb.SwapUpdateResponse>;
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
interface IBoltzRService_ISignEvmRefund extends grpc.MethodDefinition<boltzr_pb.SignEvmRefundRequest, boltzr_pb.SignEvmRefundResponse> {
    path: "/boltzr.BoltzR/SignEvmRefund";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<boltzr_pb.SignEvmRefundRequest>;
    requestDeserialize: grpc.deserialize<boltzr_pb.SignEvmRefundRequest>;
    responseSerialize: grpc.serialize<boltzr_pb.SignEvmRefundResponse>;
    responseDeserialize: grpc.deserialize<boltzr_pb.SignEvmRefundResponse>;
}
interface IBoltzRService_IDecodeInvoiceOrOffer extends grpc.MethodDefinition<boltzr_pb.DecodeInvoiceOrOfferRequest, boltzr_pb.DecodeInvoiceOrOfferResponse> {
    path: "/boltzr.BoltzR/DecodeInvoiceOrOffer";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<boltzr_pb.DecodeInvoiceOrOfferRequest>;
    requestDeserialize: grpc.deserialize<boltzr_pb.DecodeInvoiceOrOfferRequest>;
    responseSerialize: grpc.serialize<boltzr_pb.DecodeInvoiceOrOfferResponse>;
    responseDeserialize: grpc.deserialize<boltzr_pb.DecodeInvoiceOrOfferResponse>;
}
interface IBoltzRService_IFetchInvoice extends grpc.MethodDefinition<boltzr_pb.FetchInvoiceRequest, boltzr_pb.FetchInvoiceResponse> {
    path: "/boltzr.BoltzR/FetchInvoice";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<boltzr_pb.FetchInvoiceRequest>;
    requestDeserialize: grpc.deserialize<boltzr_pb.FetchInvoiceRequest>;
    responseSerialize: grpc.serialize<boltzr_pb.FetchInvoiceResponse>;
    responseDeserialize: grpc.deserialize<boltzr_pb.FetchInvoiceResponse>;
}
interface IBoltzRService_IScanMempool extends grpc.MethodDefinition<boltzr_pb.ScanMempoolRequest, boltzr_pb.ScanMempoolResponse> {
    path: "/boltzr.BoltzR/ScanMempool";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<boltzr_pb.ScanMempoolRequest>;
    requestDeserialize: grpc.deserialize<boltzr_pb.ScanMempoolRequest>;
    responseSerialize: grpc.serialize<boltzr_pb.ScanMempoolResponse>;
    responseDeserialize: grpc.deserialize<boltzr_pb.ScanMempoolResponse>;
}

export const BoltzRService: IBoltzRService;

export interface IBoltzRServer extends grpc.UntypedServiceImplementation {
    getInfo: grpc.handleUnaryCall<boltzr_pb.GetInfoRequest, boltzr_pb.GetInfoResponse>;
    setLogLevel: grpc.handleUnaryCall<boltzr_pb.SetLogLevelRequest, boltzr_pb.SetLogLevelResponse>;
    sendMessage: grpc.handleUnaryCall<boltzr_pb.SendMessageRequest, boltzr_pb.SendMessageResponse>;
    getMessages: grpc.handleServerStreamingCall<boltzr_pb.GetMessagesRequest, boltzr_pb.GetMessagesResponse>;
    swapUpdate: grpc.handleBidiStreamingCall<boltzr_pb.SwapUpdateRequest, boltzr_pb.SwapUpdateResponse>;
    startWebHookRetries: grpc.handleUnaryCall<boltzr_pb.StartWebHookRetriesRequest, boltzr_pb.StartWebHookRetriesResponse>;
    createWebHook: grpc.handleUnaryCall<boltzr_pb.CreateWebHookRequest, boltzr_pb.CreateWebHookResponse>;
    sendWebHook: grpc.handleUnaryCall<boltzr_pb.SendWebHookRequest, boltzr_pb.SendWebHookResponse>;
    signEvmRefund: grpc.handleUnaryCall<boltzr_pb.SignEvmRefundRequest, boltzr_pb.SignEvmRefundResponse>;
    decodeInvoiceOrOffer: grpc.handleUnaryCall<boltzr_pb.DecodeInvoiceOrOfferRequest, boltzr_pb.DecodeInvoiceOrOfferResponse>;
    fetchInvoice: grpc.handleUnaryCall<boltzr_pb.FetchInvoiceRequest, boltzr_pb.FetchInvoiceResponse>;
    scanMempool: grpc.handleUnaryCall<boltzr_pb.ScanMempoolRequest, boltzr_pb.ScanMempoolResponse>;
}

export interface IBoltzRClient {
    getInfo(request: boltzr_pb.GetInfoRequest, callback: (error: grpc.ServiceError | null, response: boltzr_pb.GetInfoResponse) => void): grpc.ClientUnaryCall;
    getInfo(request: boltzr_pb.GetInfoRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: boltzr_pb.GetInfoResponse) => void): grpc.ClientUnaryCall;
    getInfo(request: boltzr_pb.GetInfoRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: boltzr_pb.GetInfoResponse) => void): grpc.ClientUnaryCall;
    setLogLevel(request: boltzr_pb.SetLogLevelRequest, callback: (error: grpc.ServiceError | null, response: boltzr_pb.SetLogLevelResponse) => void): grpc.ClientUnaryCall;
    setLogLevel(request: boltzr_pb.SetLogLevelRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: boltzr_pb.SetLogLevelResponse) => void): grpc.ClientUnaryCall;
    setLogLevel(request: boltzr_pb.SetLogLevelRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: boltzr_pb.SetLogLevelResponse) => void): grpc.ClientUnaryCall;
    sendMessage(request: boltzr_pb.SendMessageRequest, callback: (error: grpc.ServiceError | null, response: boltzr_pb.SendMessageResponse) => void): grpc.ClientUnaryCall;
    sendMessage(request: boltzr_pb.SendMessageRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: boltzr_pb.SendMessageResponse) => void): grpc.ClientUnaryCall;
    sendMessage(request: boltzr_pb.SendMessageRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: boltzr_pb.SendMessageResponse) => void): grpc.ClientUnaryCall;
    getMessages(request: boltzr_pb.GetMessagesRequest, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<boltzr_pb.GetMessagesResponse>;
    getMessages(request: boltzr_pb.GetMessagesRequest, metadata?: grpc.Metadata, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<boltzr_pb.GetMessagesResponse>;
    swapUpdate(): grpc.ClientDuplexStream<boltzr_pb.SwapUpdateRequest, boltzr_pb.SwapUpdateResponse>;
    swapUpdate(options: Partial<grpc.CallOptions>): grpc.ClientDuplexStream<boltzr_pb.SwapUpdateRequest, boltzr_pb.SwapUpdateResponse>;
    swapUpdate(metadata: grpc.Metadata, options?: Partial<grpc.CallOptions>): grpc.ClientDuplexStream<boltzr_pb.SwapUpdateRequest, boltzr_pb.SwapUpdateResponse>;
    startWebHookRetries(request: boltzr_pb.StartWebHookRetriesRequest, callback: (error: grpc.ServiceError | null, response: boltzr_pb.StartWebHookRetriesResponse) => void): grpc.ClientUnaryCall;
    startWebHookRetries(request: boltzr_pb.StartWebHookRetriesRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: boltzr_pb.StartWebHookRetriesResponse) => void): grpc.ClientUnaryCall;
    startWebHookRetries(request: boltzr_pb.StartWebHookRetriesRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: boltzr_pb.StartWebHookRetriesResponse) => void): grpc.ClientUnaryCall;
    createWebHook(request: boltzr_pb.CreateWebHookRequest, callback: (error: grpc.ServiceError | null, response: boltzr_pb.CreateWebHookResponse) => void): grpc.ClientUnaryCall;
    createWebHook(request: boltzr_pb.CreateWebHookRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: boltzr_pb.CreateWebHookResponse) => void): grpc.ClientUnaryCall;
    createWebHook(request: boltzr_pb.CreateWebHookRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: boltzr_pb.CreateWebHookResponse) => void): grpc.ClientUnaryCall;
    sendWebHook(request: boltzr_pb.SendWebHookRequest, callback: (error: grpc.ServiceError | null, response: boltzr_pb.SendWebHookResponse) => void): grpc.ClientUnaryCall;
    sendWebHook(request: boltzr_pb.SendWebHookRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: boltzr_pb.SendWebHookResponse) => void): grpc.ClientUnaryCall;
    sendWebHook(request: boltzr_pb.SendWebHookRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: boltzr_pb.SendWebHookResponse) => void): grpc.ClientUnaryCall;
    signEvmRefund(request: boltzr_pb.SignEvmRefundRequest, callback: (error: grpc.ServiceError | null, response: boltzr_pb.SignEvmRefundResponse) => void): grpc.ClientUnaryCall;
    signEvmRefund(request: boltzr_pb.SignEvmRefundRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: boltzr_pb.SignEvmRefundResponse) => void): grpc.ClientUnaryCall;
    signEvmRefund(request: boltzr_pb.SignEvmRefundRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: boltzr_pb.SignEvmRefundResponse) => void): grpc.ClientUnaryCall;
    decodeInvoiceOrOffer(request: boltzr_pb.DecodeInvoiceOrOfferRequest, callback: (error: grpc.ServiceError | null, response: boltzr_pb.DecodeInvoiceOrOfferResponse) => void): grpc.ClientUnaryCall;
    decodeInvoiceOrOffer(request: boltzr_pb.DecodeInvoiceOrOfferRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: boltzr_pb.DecodeInvoiceOrOfferResponse) => void): grpc.ClientUnaryCall;
    decodeInvoiceOrOffer(request: boltzr_pb.DecodeInvoiceOrOfferRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: boltzr_pb.DecodeInvoiceOrOfferResponse) => void): grpc.ClientUnaryCall;
    fetchInvoice(request: boltzr_pb.FetchInvoiceRequest, callback: (error: grpc.ServiceError | null, response: boltzr_pb.FetchInvoiceResponse) => void): grpc.ClientUnaryCall;
    fetchInvoice(request: boltzr_pb.FetchInvoiceRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: boltzr_pb.FetchInvoiceResponse) => void): grpc.ClientUnaryCall;
    fetchInvoice(request: boltzr_pb.FetchInvoiceRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: boltzr_pb.FetchInvoiceResponse) => void): grpc.ClientUnaryCall;
    scanMempool(request: boltzr_pb.ScanMempoolRequest, callback: (error: grpc.ServiceError | null, response: boltzr_pb.ScanMempoolResponse) => void): grpc.ClientUnaryCall;
    scanMempool(request: boltzr_pb.ScanMempoolRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: boltzr_pb.ScanMempoolResponse) => void): grpc.ClientUnaryCall;
    scanMempool(request: boltzr_pb.ScanMempoolRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: boltzr_pb.ScanMempoolResponse) => void): grpc.ClientUnaryCall;
}

export class BoltzRClient extends grpc.Client implements IBoltzRClient {
    constructor(address: string, credentials: grpc.ChannelCredentials, options?: Partial<grpc.ClientOptions>);
    public getInfo(request: boltzr_pb.GetInfoRequest, callback: (error: grpc.ServiceError | null, response: boltzr_pb.GetInfoResponse) => void): grpc.ClientUnaryCall;
    public getInfo(request: boltzr_pb.GetInfoRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: boltzr_pb.GetInfoResponse) => void): grpc.ClientUnaryCall;
    public getInfo(request: boltzr_pb.GetInfoRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: boltzr_pb.GetInfoResponse) => void): grpc.ClientUnaryCall;
    public setLogLevel(request: boltzr_pb.SetLogLevelRequest, callback: (error: grpc.ServiceError | null, response: boltzr_pb.SetLogLevelResponse) => void): grpc.ClientUnaryCall;
    public setLogLevel(request: boltzr_pb.SetLogLevelRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: boltzr_pb.SetLogLevelResponse) => void): grpc.ClientUnaryCall;
    public setLogLevel(request: boltzr_pb.SetLogLevelRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: boltzr_pb.SetLogLevelResponse) => void): grpc.ClientUnaryCall;
    public sendMessage(request: boltzr_pb.SendMessageRequest, callback: (error: grpc.ServiceError | null, response: boltzr_pb.SendMessageResponse) => void): grpc.ClientUnaryCall;
    public sendMessage(request: boltzr_pb.SendMessageRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: boltzr_pb.SendMessageResponse) => void): grpc.ClientUnaryCall;
    public sendMessage(request: boltzr_pb.SendMessageRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: boltzr_pb.SendMessageResponse) => void): grpc.ClientUnaryCall;
    public getMessages(request: boltzr_pb.GetMessagesRequest, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<boltzr_pb.GetMessagesResponse>;
    public getMessages(request: boltzr_pb.GetMessagesRequest, metadata?: grpc.Metadata, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<boltzr_pb.GetMessagesResponse>;
    public swapUpdate(options?: Partial<grpc.CallOptions>): grpc.ClientDuplexStream<boltzr_pb.SwapUpdateRequest, boltzr_pb.SwapUpdateResponse>;
    public swapUpdate(metadata?: grpc.Metadata, options?: Partial<grpc.CallOptions>): grpc.ClientDuplexStream<boltzr_pb.SwapUpdateRequest, boltzr_pb.SwapUpdateResponse>;
    public startWebHookRetries(request: boltzr_pb.StartWebHookRetriesRequest, callback: (error: grpc.ServiceError | null, response: boltzr_pb.StartWebHookRetriesResponse) => void): grpc.ClientUnaryCall;
    public startWebHookRetries(request: boltzr_pb.StartWebHookRetriesRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: boltzr_pb.StartWebHookRetriesResponse) => void): grpc.ClientUnaryCall;
    public startWebHookRetries(request: boltzr_pb.StartWebHookRetriesRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: boltzr_pb.StartWebHookRetriesResponse) => void): grpc.ClientUnaryCall;
    public createWebHook(request: boltzr_pb.CreateWebHookRequest, callback: (error: grpc.ServiceError | null, response: boltzr_pb.CreateWebHookResponse) => void): grpc.ClientUnaryCall;
    public createWebHook(request: boltzr_pb.CreateWebHookRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: boltzr_pb.CreateWebHookResponse) => void): grpc.ClientUnaryCall;
    public createWebHook(request: boltzr_pb.CreateWebHookRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: boltzr_pb.CreateWebHookResponse) => void): grpc.ClientUnaryCall;
    public sendWebHook(request: boltzr_pb.SendWebHookRequest, callback: (error: grpc.ServiceError | null, response: boltzr_pb.SendWebHookResponse) => void): grpc.ClientUnaryCall;
    public sendWebHook(request: boltzr_pb.SendWebHookRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: boltzr_pb.SendWebHookResponse) => void): grpc.ClientUnaryCall;
    public sendWebHook(request: boltzr_pb.SendWebHookRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: boltzr_pb.SendWebHookResponse) => void): grpc.ClientUnaryCall;
    public signEvmRefund(request: boltzr_pb.SignEvmRefundRequest, callback: (error: grpc.ServiceError | null, response: boltzr_pb.SignEvmRefundResponse) => void): grpc.ClientUnaryCall;
    public signEvmRefund(request: boltzr_pb.SignEvmRefundRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: boltzr_pb.SignEvmRefundResponse) => void): grpc.ClientUnaryCall;
    public signEvmRefund(request: boltzr_pb.SignEvmRefundRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: boltzr_pb.SignEvmRefundResponse) => void): grpc.ClientUnaryCall;
    public decodeInvoiceOrOffer(request: boltzr_pb.DecodeInvoiceOrOfferRequest, callback: (error: grpc.ServiceError | null, response: boltzr_pb.DecodeInvoiceOrOfferResponse) => void): grpc.ClientUnaryCall;
    public decodeInvoiceOrOffer(request: boltzr_pb.DecodeInvoiceOrOfferRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: boltzr_pb.DecodeInvoiceOrOfferResponse) => void): grpc.ClientUnaryCall;
    public decodeInvoiceOrOffer(request: boltzr_pb.DecodeInvoiceOrOfferRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: boltzr_pb.DecodeInvoiceOrOfferResponse) => void): grpc.ClientUnaryCall;
    public fetchInvoice(request: boltzr_pb.FetchInvoiceRequest, callback: (error: grpc.ServiceError | null, response: boltzr_pb.FetchInvoiceResponse) => void): grpc.ClientUnaryCall;
    public fetchInvoice(request: boltzr_pb.FetchInvoiceRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: boltzr_pb.FetchInvoiceResponse) => void): grpc.ClientUnaryCall;
    public fetchInvoice(request: boltzr_pb.FetchInvoiceRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: boltzr_pb.FetchInvoiceResponse) => void): grpc.ClientUnaryCall;
    public scanMempool(request: boltzr_pb.ScanMempoolRequest, callback: (error: grpc.ServiceError | null, response: boltzr_pb.ScanMempoolResponse) => void): grpc.ClientUnaryCall;
    public scanMempool(request: boltzr_pb.ScanMempoolRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: boltzr_pb.ScanMempoolResponse) => void): grpc.ClientUnaryCall;
    public scanMempool(request: boltzr_pb.ScanMempoolRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: boltzr_pb.ScanMempoolResponse) => void): grpc.ClientUnaryCall;
}
