// package: fulmine.v1
// file: ark/service.proto

/* tslint:disable */
/* eslint-disable */

import * as grpc from "@grpc/grpc-js";
import * as ark_service_pb from "../ark/service_pb";
import * as ark_types_pb from "../ark/types_pb";

interface IServiceService extends grpc.ServiceDefinition<grpc.UntypedServiceImplementation> {
    getAddress: IServiceService_IGetAddress;
    getBalance: IServiceService_IGetBalance;
    getInfo: IServiceService_IGetInfo;
    getOnboardAddress: IServiceService_IGetOnboardAddress;
    getRoundInfo: IServiceService_IGetRoundInfo;
    getTransactionHistory: IServiceService_IGetTransactionHistory;
    redeemNote: IServiceService_IRedeemNote;
    settle: IServiceService_ISettle;
    sendOffChain: IServiceService_ISendOffChain;
    sendOnChain: IServiceService_ISendOnChain;
    signTransaction: IServiceService_ISignTransaction;
    createVHTLC: IServiceService_ICreateVHTLC;
    claimVHTLC: IServiceService_IClaimVHTLC;
    refundVHTLCWithoutReceiver: IServiceService_IRefundVHTLCWithoutReceiver;
    settleVHTLC: IServiceService_ISettleVHTLC;
    listVHTLC: IServiceService_IListVHTLC;
    getInvoice: IServiceService_IGetInvoice;
    payInvoice: IServiceService_IPayInvoice;
    isInvoiceSettled: IServiceService_IIsInvoiceSettled;
    getVirtualTxs: IServiceService_IGetVirtualTxs;
    getVtxos: IServiceService_IGetVtxos;
    nextSettlement: IServiceService_INextSettlement;
    createChainSwap: IServiceService_ICreateChainSwap;
    listChainSwaps: IServiceService_IListChainSwaps;
    refundChainSwap: IServiceService_IRefundChainSwap;
    listDelegates: IServiceService_IListDelegates;
}

interface IServiceService_IGetAddress extends grpc.MethodDefinition<ark_service_pb.GetAddressRequest, ark_service_pb.GetAddressResponse> {
    path: "/fulmine.v1.Service/GetAddress";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<ark_service_pb.GetAddressRequest>;
    requestDeserialize: grpc.deserialize<ark_service_pb.GetAddressRequest>;
    responseSerialize: grpc.serialize<ark_service_pb.GetAddressResponse>;
    responseDeserialize: grpc.deserialize<ark_service_pb.GetAddressResponse>;
}
interface IServiceService_IGetBalance extends grpc.MethodDefinition<ark_service_pb.GetBalanceRequest, ark_service_pb.GetBalanceResponse> {
    path: "/fulmine.v1.Service/GetBalance";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<ark_service_pb.GetBalanceRequest>;
    requestDeserialize: grpc.deserialize<ark_service_pb.GetBalanceRequest>;
    responseSerialize: grpc.serialize<ark_service_pb.GetBalanceResponse>;
    responseDeserialize: grpc.deserialize<ark_service_pb.GetBalanceResponse>;
}
interface IServiceService_IGetInfo extends grpc.MethodDefinition<ark_service_pb.GetInfoRequest, ark_service_pb.GetInfoResponse> {
    path: "/fulmine.v1.Service/GetInfo";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<ark_service_pb.GetInfoRequest>;
    requestDeserialize: grpc.deserialize<ark_service_pb.GetInfoRequest>;
    responseSerialize: grpc.serialize<ark_service_pb.GetInfoResponse>;
    responseDeserialize: grpc.deserialize<ark_service_pb.GetInfoResponse>;
}
interface IServiceService_IGetOnboardAddress extends grpc.MethodDefinition<ark_service_pb.GetOnboardAddressRequest, ark_service_pb.GetOnboardAddressResponse> {
    path: "/fulmine.v1.Service/GetOnboardAddress";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<ark_service_pb.GetOnboardAddressRequest>;
    requestDeserialize: grpc.deserialize<ark_service_pb.GetOnboardAddressRequest>;
    responseSerialize: grpc.serialize<ark_service_pb.GetOnboardAddressResponse>;
    responseDeserialize: grpc.deserialize<ark_service_pb.GetOnboardAddressResponse>;
}
interface IServiceService_IGetRoundInfo extends grpc.MethodDefinition<ark_service_pb.GetRoundInfoRequest, ark_service_pb.GetRoundInfoResponse> {
    path: "/fulmine.v1.Service/GetRoundInfo";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<ark_service_pb.GetRoundInfoRequest>;
    requestDeserialize: grpc.deserialize<ark_service_pb.GetRoundInfoRequest>;
    responseSerialize: grpc.serialize<ark_service_pb.GetRoundInfoResponse>;
    responseDeserialize: grpc.deserialize<ark_service_pb.GetRoundInfoResponse>;
}
interface IServiceService_IGetTransactionHistory extends grpc.MethodDefinition<ark_service_pb.GetTransactionHistoryRequest, ark_service_pb.GetTransactionHistoryResponse> {
    path: "/fulmine.v1.Service/GetTransactionHistory";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<ark_service_pb.GetTransactionHistoryRequest>;
    requestDeserialize: grpc.deserialize<ark_service_pb.GetTransactionHistoryRequest>;
    responseSerialize: grpc.serialize<ark_service_pb.GetTransactionHistoryResponse>;
    responseDeserialize: grpc.deserialize<ark_service_pb.GetTransactionHistoryResponse>;
}
interface IServiceService_IRedeemNote extends grpc.MethodDefinition<ark_service_pb.RedeemNoteRequest, ark_service_pb.RedeemNoteResponse> {
    path: "/fulmine.v1.Service/RedeemNote";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<ark_service_pb.RedeemNoteRequest>;
    requestDeserialize: grpc.deserialize<ark_service_pb.RedeemNoteRequest>;
    responseSerialize: grpc.serialize<ark_service_pb.RedeemNoteResponse>;
    responseDeserialize: grpc.deserialize<ark_service_pb.RedeemNoteResponse>;
}
interface IServiceService_ISettle extends grpc.MethodDefinition<ark_service_pb.SettleRequest, ark_service_pb.SettleResponse> {
    path: "/fulmine.v1.Service/Settle";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<ark_service_pb.SettleRequest>;
    requestDeserialize: grpc.deserialize<ark_service_pb.SettleRequest>;
    responseSerialize: grpc.serialize<ark_service_pb.SettleResponse>;
    responseDeserialize: grpc.deserialize<ark_service_pb.SettleResponse>;
}
interface IServiceService_ISendOffChain extends grpc.MethodDefinition<ark_service_pb.SendOffChainRequest, ark_service_pb.SendOffChainResponse> {
    path: "/fulmine.v1.Service/SendOffChain";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<ark_service_pb.SendOffChainRequest>;
    requestDeserialize: grpc.deserialize<ark_service_pb.SendOffChainRequest>;
    responseSerialize: grpc.serialize<ark_service_pb.SendOffChainResponse>;
    responseDeserialize: grpc.deserialize<ark_service_pb.SendOffChainResponse>;
}
interface IServiceService_ISendOnChain extends grpc.MethodDefinition<ark_service_pb.SendOnChainRequest, ark_service_pb.SendOnChainResponse> {
    path: "/fulmine.v1.Service/SendOnChain";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<ark_service_pb.SendOnChainRequest>;
    requestDeserialize: grpc.deserialize<ark_service_pb.SendOnChainRequest>;
    responseSerialize: grpc.serialize<ark_service_pb.SendOnChainResponse>;
    responseDeserialize: grpc.deserialize<ark_service_pb.SendOnChainResponse>;
}
interface IServiceService_ISignTransaction extends grpc.MethodDefinition<ark_service_pb.SignTransactionRequest, ark_service_pb.SignTransactionResponse> {
    path: "/fulmine.v1.Service/SignTransaction";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<ark_service_pb.SignTransactionRequest>;
    requestDeserialize: grpc.deserialize<ark_service_pb.SignTransactionRequest>;
    responseSerialize: grpc.serialize<ark_service_pb.SignTransactionResponse>;
    responseDeserialize: grpc.deserialize<ark_service_pb.SignTransactionResponse>;
}
interface IServiceService_ICreateVHTLC extends grpc.MethodDefinition<ark_service_pb.CreateVHTLCRequest, ark_service_pb.CreateVHTLCResponse> {
    path: "/fulmine.v1.Service/CreateVHTLC";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<ark_service_pb.CreateVHTLCRequest>;
    requestDeserialize: grpc.deserialize<ark_service_pb.CreateVHTLCRequest>;
    responseSerialize: grpc.serialize<ark_service_pb.CreateVHTLCResponse>;
    responseDeserialize: grpc.deserialize<ark_service_pb.CreateVHTLCResponse>;
}
interface IServiceService_IClaimVHTLC extends grpc.MethodDefinition<ark_service_pb.ClaimVHTLCRequest, ark_service_pb.ClaimVHTLCResponse> {
    path: "/fulmine.v1.Service/ClaimVHTLC";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<ark_service_pb.ClaimVHTLCRequest>;
    requestDeserialize: grpc.deserialize<ark_service_pb.ClaimVHTLCRequest>;
    responseSerialize: grpc.serialize<ark_service_pb.ClaimVHTLCResponse>;
    responseDeserialize: grpc.deserialize<ark_service_pb.ClaimVHTLCResponse>;
}
interface IServiceService_IRefundVHTLCWithoutReceiver extends grpc.MethodDefinition<ark_service_pb.RefundVHTLCWithoutReceiverRequest, ark_service_pb.RefundVHTLCWithoutReceiverResponse> {
    path: "/fulmine.v1.Service/RefundVHTLCWithoutReceiver";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<ark_service_pb.RefundVHTLCWithoutReceiverRequest>;
    requestDeserialize: grpc.deserialize<ark_service_pb.RefundVHTLCWithoutReceiverRequest>;
    responseSerialize: grpc.serialize<ark_service_pb.RefundVHTLCWithoutReceiverResponse>;
    responseDeserialize: grpc.deserialize<ark_service_pb.RefundVHTLCWithoutReceiverResponse>;
}
interface IServiceService_ISettleVHTLC extends grpc.MethodDefinition<ark_service_pb.SettleVHTLCRequest, ark_service_pb.SettleVHTLCResponse> {
    path: "/fulmine.v1.Service/SettleVHTLC";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<ark_service_pb.SettleVHTLCRequest>;
    requestDeserialize: grpc.deserialize<ark_service_pb.SettleVHTLCRequest>;
    responseSerialize: grpc.serialize<ark_service_pb.SettleVHTLCResponse>;
    responseDeserialize: grpc.deserialize<ark_service_pb.SettleVHTLCResponse>;
}
interface IServiceService_IListVHTLC extends grpc.MethodDefinition<ark_service_pb.ListVHTLCRequest, ark_service_pb.ListVHTLCResponse> {
    path: "/fulmine.v1.Service/ListVHTLC";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<ark_service_pb.ListVHTLCRequest>;
    requestDeserialize: grpc.deserialize<ark_service_pb.ListVHTLCRequest>;
    responseSerialize: grpc.serialize<ark_service_pb.ListVHTLCResponse>;
    responseDeserialize: grpc.deserialize<ark_service_pb.ListVHTLCResponse>;
}
interface IServiceService_IGetInvoice extends grpc.MethodDefinition<ark_service_pb.GetInvoiceRequest, ark_service_pb.GetInvoiceResponse> {
    path: "/fulmine.v1.Service/GetInvoice";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<ark_service_pb.GetInvoiceRequest>;
    requestDeserialize: grpc.deserialize<ark_service_pb.GetInvoiceRequest>;
    responseSerialize: grpc.serialize<ark_service_pb.GetInvoiceResponse>;
    responseDeserialize: grpc.deserialize<ark_service_pb.GetInvoiceResponse>;
}
interface IServiceService_IPayInvoice extends grpc.MethodDefinition<ark_service_pb.PayInvoiceRequest, ark_service_pb.PayInvoiceResponse> {
    path: "/fulmine.v1.Service/PayInvoice";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<ark_service_pb.PayInvoiceRequest>;
    requestDeserialize: grpc.deserialize<ark_service_pb.PayInvoiceRequest>;
    responseSerialize: grpc.serialize<ark_service_pb.PayInvoiceResponse>;
    responseDeserialize: grpc.deserialize<ark_service_pb.PayInvoiceResponse>;
}
interface IServiceService_IIsInvoiceSettled extends grpc.MethodDefinition<ark_service_pb.IsInvoiceSettledRequest, ark_service_pb.IsInvoiceSettledResponse> {
    path: "/fulmine.v1.Service/IsInvoiceSettled";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<ark_service_pb.IsInvoiceSettledRequest>;
    requestDeserialize: grpc.deserialize<ark_service_pb.IsInvoiceSettledRequest>;
    responseSerialize: grpc.serialize<ark_service_pb.IsInvoiceSettledResponse>;
    responseDeserialize: grpc.deserialize<ark_service_pb.IsInvoiceSettledResponse>;
}
interface IServiceService_IGetVirtualTxs extends grpc.MethodDefinition<ark_service_pb.GetVirtualTxsRequest, ark_service_pb.GetVirtualTxsResponse> {
    path: "/fulmine.v1.Service/GetVirtualTxs";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<ark_service_pb.GetVirtualTxsRequest>;
    requestDeserialize: grpc.deserialize<ark_service_pb.GetVirtualTxsRequest>;
    responseSerialize: grpc.serialize<ark_service_pb.GetVirtualTxsResponse>;
    responseDeserialize: grpc.deserialize<ark_service_pb.GetVirtualTxsResponse>;
}
interface IServiceService_IGetVtxos extends grpc.MethodDefinition<ark_service_pb.GetVtxosRequest, ark_service_pb.GetVtxosResponse> {
    path: "/fulmine.v1.Service/GetVtxos";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<ark_service_pb.GetVtxosRequest>;
    requestDeserialize: grpc.deserialize<ark_service_pb.GetVtxosRequest>;
    responseSerialize: grpc.serialize<ark_service_pb.GetVtxosResponse>;
    responseDeserialize: grpc.deserialize<ark_service_pb.GetVtxosResponse>;
}
interface IServiceService_INextSettlement extends grpc.MethodDefinition<ark_service_pb.NextSettlementRequest, ark_service_pb.NextSettlementResponse> {
    path: "/fulmine.v1.Service/NextSettlement";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<ark_service_pb.NextSettlementRequest>;
    requestDeserialize: grpc.deserialize<ark_service_pb.NextSettlementRequest>;
    responseSerialize: grpc.serialize<ark_service_pb.NextSettlementResponse>;
    responseDeserialize: grpc.deserialize<ark_service_pb.NextSettlementResponse>;
}
interface IServiceService_ICreateChainSwap extends grpc.MethodDefinition<ark_service_pb.CreateChainSwapRequest, ark_service_pb.CreateChainSwapResponse> {
    path: "/fulmine.v1.Service/CreateChainSwap";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<ark_service_pb.CreateChainSwapRequest>;
    requestDeserialize: grpc.deserialize<ark_service_pb.CreateChainSwapRequest>;
    responseSerialize: grpc.serialize<ark_service_pb.CreateChainSwapResponse>;
    responseDeserialize: grpc.deserialize<ark_service_pb.CreateChainSwapResponse>;
}
interface IServiceService_IListChainSwaps extends grpc.MethodDefinition<ark_service_pb.ListChainSwapsRequest, ark_service_pb.ListChainSwapsResponse> {
    path: "/fulmine.v1.Service/ListChainSwaps";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<ark_service_pb.ListChainSwapsRequest>;
    requestDeserialize: grpc.deserialize<ark_service_pb.ListChainSwapsRequest>;
    responseSerialize: grpc.serialize<ark_service_pb.ListChainSwapsResponse>;
    responseDeserialize: grpc.deserialize<ark_service_pb.ListChainSwapsResponse>;
}
interface IServiceService_IRefundChainSwap extends grpc.MethodDefinition<ark_service_pb.RefundChainSwapRequest, ark_service_pb.RefundChainSwapResponse> {
    path: "/fulmine.v1.Service/RefundChainSwap";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<ark_service_pb.RefundChainSwapRequest>;
    requestDeserialize: grpc.deserialize<ark_service_pb.RefundChainSwapRequest>;
    responseSerialize: grpc.serialize<ark_service_pb.RefundChainSwapResponse>;
    responseDeserialize: grpc.deserialize<ark_service_pb.RefundChainSwapResponse>;
}
interface IServiceService_IListDelegates extends grpc.MethodDefinition<ark_service_pb.ListDelegatesRequest, ark_service_pb.ListDelegatesResponse> {
    path: "/fulmine.v1.Service/ListDelegates";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<ark_service_pb.ListDelegatesRequest>;
    requestDeserialize: grpc.deserialize<ark_service_pb.ListDelegatesRequest>;
    responseSerialize: grpc.serialize<ark_service_pb.ListDelegatesResponse>;
    responseDeserialize: grpc.deserialize<ark_service_pb.ListDelegatesResponse>;
}

export const ServiceService: IServiceService;

export interface IServiceServer extends grpc.UntypedServiceImplementation {
    getAddress: grpc.handleUnaryCall<ark_service_pb.GetAddressRequest, ark_service_pb.GetAddressResponse>;
    getBalance: grpc.handleUnaryCall<ark_service_pb.GetBalanceRequest, ark_service_pb.GetBalanceResponse>;
    getInfo: grpc.handleUnaryCall<ark_service_pb.GetInfoRequest, ark_service_pb.GetInfoResponse>;
    getOnboardAddress: grpc.handleUnaryCall<ark_service_pb.GetOnboardAddressRequest, ark_service_pb.GetOnboardAddressResponse>;
    getRoundInfo: grpc.handleUnaryCall<ark_service_pb.GetRoundInfoRequest, ark_service_pb.GetRoundInfoResponse>;
    getTransactionHistory: grpc.handleUnaryCall<ark_service_pb.GetTransactionHistoryRequest, ark_service_pb.GetTransactionHistoryResponse>;
    redeemNote: grpc.handleUnaryCall<ark_service_pb.RedeemNoteRequest, ark_service_pb.RedeemNoteResponse>;
    settle: grpc.handleUnaryCall<ark_service_pb.SettleRequest, ark_service_pb.SettleResponse>;
    sendOffChain: grpc.handleUnaryCall<ark_service_pb.SendOffChainRequest, ark_service_pb.SendOffChainResponse>;
    sendOnChain: grpc.handleUnaryCall<ark_service_pb.SendOnChainRequest, ark_service_pb.SendOnChainResponse>;
    signTransaction: grpc.handleUnaryCall<ark_service_pb.SignTransactionRequest, ark_service_pb.SignTransactionResponse>;
    createVHTLC: grpc.handleUnaryCall<ark_service_pb.CreateVHTLCRequest, ark_service_pb.CreateVHTLCResponse>;
    claimVHTLC: grpc.handleUnaryCall<ark_service_pb.ClaimVHTLCRequest, ark_service_pb.ClaimVHTLCResponse>;
    refundVHTLCWithoutReceiver: grpc.handleUnaryCall<ark_service_pb.RefundVHTLCWithoutReceiverRequest, ark_service_pb.RefundVHTLCWithoutReceiverResponse>;
    settleVHTLC: grpc.handleUnaryCall<ark_service_pb.SettleVHTLCRequest, ark_service_pb.SettleVHTLCResponse>;
    listVHTLC: grpc.handleUnaryCall<ark_service_pb.ListVHTLCRequest, ark_service_pb.ListVHTLCResponse>;
    getInvoice: grpc.handleUnaryCall<ark_service_pb.GetInvoiceRequest, ark_service_pb.GetInvoiceResponse>;
    payInvoice: grpc.handleUnaryCall<ark_service_pb.PayInvoiceRequest, ark_service_pb.PayInvoiceResponse>;
    isInvoiceSettled: grpc.handleUnaryCall<ark_service_pb.IsInvoiceSettledRequest, ark_service_pb.IsInvoiceSettledResponse>;
    getVirtualTxs: grpc.handleUnaryCall<ark_service_pb.GetVirtualTxsRequest, ark_service_pb.GetVirtualTxsResponse>;
    getVtxos: grpc.handleUnaryCall<ark_service_pb.GetVtxosRequest, ark_service_pb.GetVtxosResponse>;
    nextSettlement: grpc.handleUnaryCall<ark_service_pb.NextSettlementRequest, ark_service_pb.NextSettlementResponse>;
    createChainSwap: grpc.handleUnaryCall<ark_service_pb.CreateChainSwapRequest, ark_service_pb.CreateChainSwapResponse>;
    listChainSwaps: grpc.handleUnaryCall<ark_service_pb.ListChainSwapsRequest, ark_service_pb.ListChainSwapsResponse>;
    refundChainSwap: grpc.handleUnaryCall<ark_service_pb.RefundChainSwapRequest, ark_service_pb.RefundChainSwapResponse>;
    listDelegates: grpc.handleUnaryCall<ark_service_pb.ListDelegatesRequest, ark_service_pb.ListDelegatesResponse>;
}

export interface IServiceClient {
    getAddress(request: ark_service_pb.GetAddressRequest, callback: (error: grpc.ServiceError | null, response: ark_service_pb.GetAddressResponse) => void): grpc.ClientUnaryCall;
    getAddress(request: ark_service_pb.GetAddressRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: ark_service_pb.GetAddressResponse) => void): grpc.ClientUnaryCall;
    getAddress(request: ark_service_pb.GetAddressRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: ark_service_pb.GetAddressResponse) => void): grpc.ClientUnaryCall;
    getBalance(request: ark_service_pb.GetBalanceRequest, callback: (error: grpc.ServiceError | null, response: ark_service_pb.GetBalanceResponse) => void): grpc.ClientUnaryCall;
    getBalance(request: ark_service_pb.GetBalanceRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: ark_service_pb.GetBalanceResponse) => void): grpc.ClientUnaryCall;
    getBalance(request: ark_service_pb.GetBalanceRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: ark_service_pb.GetBalanceResponse) => void): grpc.ClientUnaryCall;
    getInfo(request: ark_service_pb.GetInfoRequest, callback: (error: grpc.ServiceError | null, response: ark_service_pb.GetInfoResponse) => void): grpc.ClientUnaryCall;
    getInfo(request: ark_service_pb.GetInfoRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: ark_service_pb.GetInfoResponse) => void): grpc.ClientUnaryCall;
    getInfo(request: ark_service_pb.GetInfoRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: ark_service_pb.GetInfoResponse) => void): grpc.ClientUnaryCall;
    getOnboardAddress(request: ark_service_pb.GetOnboardAddressRequest, callback: (error: grpc.ServiceError | null, response: ark_service_pb.GetOnboardAddressResponse) => void): grpc.ClientUnaryCall;
    getOnboardAddress(request: ark_service_pb.GetOnboardAddressRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: ark_service_pb.GetOnboardAddressResponse) => void): grpc.ClientUnaryCall;
    getOnboardAddress(request: ark_service_pb.GetOnboardAddressRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: ark_service_pb.GetOnboardAddressResponse) => void): grpc.ClientUnaryCall;
    getRoundInfo(request: ark_service_pb.GetRoundInfoRequest, callback: (error: grpc.ServiceError | null, response: ark_service_pb.GetRoundInfoResponse) => void): grpc.ClientUnaryCall;
    getRoundInfo(request: ark_service_pb.GetRoundInfoRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: ark_service_pb.GetRoundInfoResponse) => void): grpc.ClientUnaryCall;
    getRoundInfo(request: ark_service_pb.GetRoundInfoRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: ark_service_pb.GetRoundInfoResponse) => void): grpc.ClientUnaryCall;
    getTransactionHistory(request: ark_service_pb.GetTransactionHistoryRequest, callback: (error: grpc.ServiceError | null, response: ark_service_pb.GetTransactionHistoryResponse) => void): grpc.ClientUnaryCall;
    getTransactionHistory(request: ark_service_pb.GetTransactionHistoryRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: ark_service_pb.GetTransactionHistoryResponse) => void): grpc.ClientUnaryCall;
    getTransactionHistory(request: ark_service_pb.GetTransactionHistoryRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: ark_service_pb.GetTransactionHistoryResponse) => void): grpc.ClientUnaryCall;
    redeemNote(request: ark_service_pb.RedeemNoteRequest, callback: (error: grpc.ServiceError | null, response: ark_service_pb.RedeemNoteResponse) => void): grpc.ClientUnaryCall;
    redeemNote(request: ark_service_pb.RedeemNoteRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: ark_service_pb.RedeemNoteResponse) => void): grpc.ClientUnaryCall;
    redeemNote(request: ark_service_pb.RedeemNoteRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: ark_service_pb.RedeemNoteResponse) => void): grpc.ClientUnaryCall;
    settle(request: ark_service_pb.SettleRequest, callback: (error: grpc.ServiceError | null, response: ark_service_pb.SettleResponse) => void): grpc.ClientUnaryCall;
    settle(request: ark_service_pb.SettleRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: ark_service_pb.SettleResponse) => void): grpc.ClientUnaryCall;
    settle(request: ark_service_pb.SettleRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: ark_service_pb.SettleResponse) => void): grpc.ClientUnaryCall;
    sendOffChain(request: ark_service_pb.SendOffChainRequest, callback: (error: grpc.ServiceError | null, response: ark_service_pb.SendOffChainResponse) => void): grpc.ClientUnaryCall;
    sendOffChain(request: ark_service_pb.SendOffChainRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: ark_service_pb.SendOffChainResponse) => void): grpc.ClientUnaryCall;
    sendOffChain(request: ark_service_pb.SendOffChainRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: ark_service_pb.SendOffChainResponse) => void): grpc.ClientUnaryCall;
    sendOnChain(request: ark_service_pb.SendOnChainRequest, callback: (error: grpc.ServiceError | null, response: ark_service_pb.SendOnChainResponse) => void): grpc.ClientUnaryCall;
    sendOnChain(request: ark_service_pb.SendOnChainRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: ark_service_pb.SendOnChainResponse) => void): grpc.ClientUnaryCall;
    sendOnChain(request: ark_service_pb.SendOnChainRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: ark_service_pb.SendOnChainResponse) => void): grpc.ClientUnaryCall;
    signTransaction(request: ark_service_pb.SignTransactionRequest, callback: (error: grpc.ServiceError | null, response: ark_service_pb.SignTransactionResponse) => void): grpc.ClientUnaryCall;
    signTransaction(request: ark_service_pb.SignTransactionRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: ark_service_pb.SignTransactionResponse) => void): grpc.ClientUnaryCall;
    signTransaction(request: ark_service_pb.SignTransactionRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: ark_service_pb.SignTransactionResponse) => void): grpc.ClientUnaryCall;
    createVHTLC(request: ark_service_pb.CreateVHTLCRequest, callback: (error: grpc.ServiceError | null, response: ark_service_pb.CreateVHTLCResponse) => void): grpc.ClientUnaryCall;
    createVHTLC(request: ark_service_pb.CreateVHTLCRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: ark_service_pb.CreateVHTLCResponse) => void): grpc.ClientUnaryCall;
    createVHTLC(request: ark_service_pb.CreateVHTLCRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: ark_service_pb.CreateVHTLCResponse) => void): grpc.ClientUnaryCall;
    claimVHTLC(request: ark_service_pb.ClaimVHTLCRequest, callback: (error: grpc.ServiceError | null, response: ark_service_pb.ClaimVHTLCResponse) => void): grpc.ClientUnaryCall;
    claimVHTLC(request: ark_service_pb.ClaimVHTLCRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: ark_service_pb.ClaimVHTLCResponse) => void): grpc.ClientUnaryCall;
    claimVHTLC(request: ark_service_pb.ClaimVHTLCRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: ark_service_pb.ClaimVHTLCResponse) => void): grpc.ClientUnaryCall;
    refundVHTLCWithoutReceiver(request: ark_service_pb.RefundVHTLCWithoutReceiverRequest, callback: (error: grpc.ServiceError | null, response: ark_service_pb.RefundVHTLCWithoutReceiverResponse) => void): grpc.ClientUnaryCall;
    refundVHTLCWithoutReceiver(request: ark_service_pb.RefundVHTLCWithoutReceiverRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: ark_service_pb.RefundVHTLCWithoutReceiverResponse) => void): grpc.ClientUnaryCall;
    refundVHTLCWithoutReceiver(request: ark_service_pb.RefundVHTLCWithoutReceiverRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: ark_service_pb.RefundVHTLCWithoutReceiverResponse) => void): grpc.ClientUnaryCall;
    settleVHTLC(request: ark_service_pb.SettleVHTLCRequest, callback: (error: grpc.ServiceError | null, response: ark_service_pb.SettleVHTLCResponse) => void): grpc.ClientUnaryCall;
    settleVHTLC(request: ark_service_pb.SettleVHTLCRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: ark_service_pb.SettleVHTLCResponse) => void): grpc.ClientUnaryCall;
    settleVHTLC(request: ark_service_pb.SettleVHTLCRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: ark_service_pb.SettleVHTLCResponse) => void): grpc.ClientUnaryCall;
    listVHTLC(request: ark_service_pb.ListVHTLCRequest, callback: (error: grpc.ServiceError | null, response: ark_service_pb.ListVHTLCResponse) => void): grpc.ClientUnaryCall;
    listVHTLC(request: ark_service_pb.ListVHTLCRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: ark_service_pb.ListVHTLCResponse) => void): grpc.ClientUnaryCall;
    listVHTLC(request: ark_service_pb.ListVHTLCRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: ark_service_pb.ListVHTLCResponse) => void): grpc.ClientUnaryCall;
    getInvoice(request: ark_service_pb.GetInvoiceRequest, callback: (error: grpc.ServiceError | null, response: ark_service_pb.GetInvoiceResponse) => void): grpc.ClientUnaryCall;
    getInvoice(request: ark_service_pb.GetInvoiceRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: ark_service_pb.GetInvoiceResponse) => void): grpc.ClientUnaryCall;
    getInvoice(request: ark_service_pb.GetInvoiceRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: ark_service_pb.GetInvoiceResponse) => void): grpc.ClientUnaryCall;
    payInvoice(request: ark_service_pb.PayInvoiceRequest, callback: (error: grpc.ServiceError | null, response: ark_service_pb.PayInvoiceResponse) => void): grpc.ClientUnaryCall;
    payInvoice(request: ark_service_pb.PayInvoiceRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: ark_service_pb.PayInvoiceResponse) => void): grpc.ClientUnaryCall;
    payInvoice(request: ark_service_pb.PayInvoiceRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: ark_service_pb.PayInvoiceResponse) => void): grpc.ClientUnaryCall;
    isInvoiceSettled(request: ark_service_pb.IsInvoiceSettledRequest, callback: (error: grpc.ServiceError | null, response: ark_service_pb.IsInvoiceSettledResponse) => void): grpc.ClientUnaryCall;
    isInvoiceSettled(request: ark_service_pb.IsInvoiceSettledRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: ark_service_pb.IsInvoiceSettledResponse) => void): grpc.ClientUnaryCall;
    isInvoiceSettled(request: ark_service_pb.IsInvoiceSettledRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: ark_service_pb.IsInvoiceSettledResponse) => void): grpc.ClientUnaryCall;
    getVirtualTxs(request: ark_service_pb.GetVirtualTxsRequest, callback: (error: grpc.ServiceError | null, response: ark_service_pb.GetVirtualTxsResponse) => void): grpc.ClientUnaryCall;
    getVirtualTxs(request: ark_service_pb.GetVirtualTxsRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: ark_service_pb.GetVirtualTxsResponse) => void): grpc.ClientUnaryCall;
    getVirtualTxs(request: ark_service_pb.GetVirtualTxsRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: ark_service_pb.GetVirtualTxsResponse) => void): grpc.ClientUnaryCall;
    getVtxos(request: ark_service_pb.GetVtxosRequest, callback: (error: grpc.ServiceError | null, response: ark_service_pb.GetVtxosResponse) => void): grpc.ClientUnaryCall;
    getVtxos(request: ark_service_pb.GetVtxosRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: ark_service_pb.GetVtxosResponse) => void): grpc.ClientUnaryCall;
    getVtxos(request: ark_service_pb.GetVtxosRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: ark_service_pb.GetVtxosResponse) => void): grpc.ClientUnaryCall;
    nextSettlement(request: ark_service_pb.NextSettlementRequest, callback: (error: grpc.ServiceError | null, response: ark_service_pb.NextSettlementResponse) => void): grpc.ClientUnaryCall;
    nextSettlement(request: ark_service_pb.NextSettlementRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: ark_service_pb.NextSettlementResponse) => void): grpc.ClientUnaryCall;
    nextSettlement(request: ark_service_pb.NextSettlementRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: ark_service_pb.NextSettlementResponse) => void): grpc.ClientUnaryCall;
    createChainSwap(request: ark_service_pb.CreateChainSwapRequest, callback: (error: grpc.ServiceError | null, response: ark_service_pb.CreateChainSwapResponse) => void): grpc.ClientUnaryCall;
    createChainSwap(request: ark_service_pb.CreateChainSwapRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: ark_service_pb.CreateChainSwapResponse) => void): grpc.ClientUnaryCall;
    createChainSwap(request: ark_service_pb.CreateChainSwapRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: ark_service_pb.CreateChainSwapResponse) => void): grpc.ClientUnaryCall;
    listChainSwaps(request: ark_service_pb.ListChainSwapsRequest, callback: (error: grpc.ServiceError | null, response: ark_service_pb.ListChainSwapsResponse) => void): grpc.ClientUnaryCall;
    listChainSwaps(request: ark_service_pb.ListChainSwapsRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: ark_service_pb.ListChainSwapsResponse) => void): grpc.ClientUnaryCall;
    listChainSwaps(request: ark_service_pb.ListChainSwapsRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: ark_service_pb.ListChainSwapsResponse) => void): grpc.ClientUnaryCall;
    refundChainSwap(request: ark_service_pb.RefundChainSwapRequest, callback: (error: grpc.ServiceError | null, response: ark_service_pb.RefundChainSwapResponse) => void): grpc.ClientUnaryCall;
    refundChainSwap(request: ark_service_pb.RefundChainSwapRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: ark_service_pb.RefundChainSwapResponse) => void): grpc.ClientUnaryCall;
    refundChainSwap(request: ark_service_pb.RefundChainSwapRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: ark_service_pb.RefundChainSwapResponse) => void): grpc.ClientUnaryCall;
    listDelegates(request: ark_service_pb.ListDelegatesRequest, callback: (error: grpc.ServiceError | null, response: ark_service_pb.ListDelegatesResponse) => void): grpc.ClientUnaryCall;
    listDelegates(request: ark_service_pb.ListDelegatesRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: ark_service_pb.ListDelegatesResponse) => void): grpc.ClientUnaryCall;
    listDelegates(request: ark_service_pb.ListDelegatesRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: ark_service_pb.ListDelegatesResponse) => void): grpc.ClientUnaryCall;
}

export class ServiceClient extends grpc.Client implements IServiceClient {
    constructor(address: string, credentials: grpc.ChannelCredentials, options?: Partial<grpc.ClientOptions>);
    public getAddress(request: ark_service_pb.GetAddressRequest, callback: (error: grpc.ServiceError | null, response: ark_service_pb.GetAddressResponse) => void): grpc.ClientUnaryCall;
    public getAddress(request: ark_service_pb.GetAddressRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: ark_service_pb.GetAddressResponse) => void): grpc.ClientUnaryCall;
    public getAddress(request: ark_service_pb.GetAddressRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: ark_service_pb.GetAddressResponse) => void): grpc.ClientUnaryCall;
    public getBalance(request: ark_service_pb.GetBalanceRequest, callback: (error: grpc.ServiceError | null, response: ark_service_pb.GetBalanceResponse) => void): grpc.ClientUnaryCall;
    public getBalance(request: ark_service_pb.GetBalanceRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: ark_service_pb.GetBalanceResponse) => void): grpc.ClientUnaryCall;
    public getBalance(request: ark_service_pb.GetBalanceRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: ark_service_pb.GetBalanceResponse) => void): grpc.ClientUnaryCall;
    public getInfo(request: ark_service_pb.GetInfoRequest, callback: (error: grpc.ServiceError | null, response: ark_service_pb.GetInfoResponse) => void): grpc.ClientUnaryCall;
    public getInfo(request: ark_service_pb.GetInfoRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: ark_service_pb.GetInfoResponse) => void): grpc.ClientUnaryCall;
    public getInfo(request: ark_service_pb.GetInfoRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: ark_service_pb.GetInfoResponse) => void): grpc.ClientUnaryCall;
    public getOnboardAddress(request: ark_service_pb.GetOnboardAddressRequest, callback: (error: grpc.ServiceError | null, response: ark_service_pb.GetOnboardAddressResponse) => void): grpc.ClientUnaryCall;
    public getOnboardAddress(request: ark_service_pb.GetOnboardAddressRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: ark_service_pb.GetOnboardAddressResponse) => void): grpc.ClientUnaryCall;
    public getOnboardAddress(request: ark_service_pb.GetOnboardAddressRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: ark_service_pb.GetOnboardAddressResponse) => void): grpc.ClientUnaryCall;
    public getRoundInfo(request: ark_service_pb.GetRoundInfoRequest, callback: (error: grpc.ServiceError | null, response: ark_service_pb.GetRoundInfoResponse) => void): grpc.ClientUnaryCall;
    public getRoundInfo(request: ark_service_pb.GetRoundInfoRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: ark_service_pb.GetRoundInfoResponse) => void): grpc.ClientUnaryCall;
    public getRoundInfo(request: ark_service_pb.GetRoundInfoRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: ark_service_pb.GetRoundInfoResponse) => void): grpc.ClientUnaryCall;
    public getTransactionHistory(request: ark_service_pb.GetTransactionHistoryRequest, callback: (error: grpc.ServiceError | null, response: ark_service_pb.GetTransactionHistoryResponse) => void): grpc.ClientUnaryCall;
    public getTransactionHistory(request: ark_service_pb.GetTransactionHistoryRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: ark_service_pb.GetTransactionHistoryResponse) => void): grpc.ClientUnaryCall;
    public getTransactionHistory(request: ark_service_pb.GetTransactionHistoryRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: ark_service_pb.GetTransactionHistoryResponse) => void): grpc.ClientUnaryCall;
    public redeemNote(request: ark_service_pb.RedeemNoteRequest, callback: (error: grpc.ServiceError | null, response: ark_service_pb.RedeemNoteResponse) => void): grpc.ClientUnaryCall;
    public redeemNote(request: ark_service_pb.RedeemNoteRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: ark_service_pb.RedeemNoteResponse) => void): grpc.ClientUnaryCall;
    public redeemNote(request: ark_service_pb.RedeemNoteRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: ark_service_pb.RedeemNoteResponse) => void): grpc.ClientUnaryCall;
    public settle(request: ark_service_pb.SettleRequest, callback: (error: grpc.ServiceError | null, response: ark_service_pb.SettleResponse) => void): grpc.ClientUnaryCall;
    public settle(request: ark_service_pb.SettleRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: ark_service_pb.SettleResponse) => void): grpc.ClientUnaryCall;
    public settle(request: ark_service_pb.SettleRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: ark_service_pb.SettleResponse) => void): grpc.ClientUnaryCall;
    public sendOffChain(request: ark_service_pb.SendOffChainRequest, callback: (error: grpc.ServiceError | null, response: ark_service_pb.SendOffChainResponse) => void): grpc.ClientUnaryCall;
    public sendOffChain(request: ark_service_pb.SendOffChainRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: ark_service_pb.SendOffChainResponse) => void): grpc.ClientUnaryCall;
    public sendOffChain(request: ark_service_pb.SendOffChainRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: ark_service_pb.SendOffChainResponse) => void): grpc.ClientUnaryCall;
    public sendOnChain(request: ark_service_pb.SendOnChainRequest, callback: (error: grpc.ServiceError | null, response: ark_service_pb.SendOnChainResponse) => void): grpc.ClientUnaryCall;
    public sendOnChain(request: ark_service_pb.SendOnChainRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: ark_service_pb.SendOnChainResponse) => void): grpc.ClientUnaryCall;
    public sendOnChain(request: ark_service_pb.SendOnChainRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: ark_service_pb.SendOnChainResponse) => void): grpc.ClientUnaryCall;
    public signTransaction(request: ark_service_pb.SignTransactionRequest, callback: (error: grpc.ServiceError | null, response: ark_service_pb.SignTransactionResponse) => void): grpc.ClientUnaryCall;
    public signTransaction(request: ark_service_pb.SignTransactionRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: ark_service_pb.SignTransactionResponse) => void): grpc.ClientUnaryCall;
    public signTransaction(request: ark_service_pb.SignTransactionRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: ark_service_pb.SignTransactionResponse) => void): grpc.ClientUnaryCall;
    public createVHTLC(request: ark_service_pb.CreateVHTLCRequest, callback: (error: grpc.ServiceError | null, response: ark_service_pb.CreateVHTLCResponse) => void): grpc.ClientUnaryCall;
    public createVHTLC(request: ark_service_pb.CreateVHTLCRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: ark_service_pb.CreateVHTLCResponse) => void): grpc.ClientUnaryCall;
    public createVHTLC(request: ark_service_pb.CreateVHTLCRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: ark_service_pb.CreateVHTLCResponse) => void): grpc.ClientUnaryCall;
    public claimVHTLC(request: ark_service_pb.ClaimVHTLCRequest, callback: (error: grpc.ServiceError | null, response: ark_service_pb.ClaimVHTLCResponse) => void): grpc.ClientUnaryCall;
    public claimVHTLC(request: ark_service_pb.ClaimVHTLCRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: ark_service_pb.ClaimVHTLCResponse) => void): grpc.ClientUnaryCall;
    public claimVHTLC(request: ark_service_pb.ClaimVHTLCRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: ark_service_pb.ClaimVHTLCResponse) => void): grpc.ClientUnaryCall;
    public refundVHTLCWithoutReceiver(request: ark_service_pb.RefundVHTLCWithoutReceiverRequest, callback: (error: grpc.ServiceError | null, response: ark_service_pb.RefundVHTLCWithoutReceiverResponse) => void): grpc.ClientUnaryCall;
    public refundVHTLCWithoutReceiver(request: ark_service_pb.RefundVHTLCWithoutReceiverRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: ark_service_pb.RefundVHTLCWithoutReceiverResponse) => void): grpc.ClientUnaryCall;
    public refundVHTLCWithoutReceiver(request: ark_service_pb.RefundVHTLCWithoutReceiverRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: ark_service_pb.RefundVHTLCWithoutReceiverResponse) => void): grpc.ClientUnaryCall;
    public settleVHTLC(request: ark_service_pb.SettleVHTLCRequest, callback: (error: grpc.ServiceError | null, response: ark_service_pb.SettleVHTLCResponse) => void): grpc.ClientUnaryCall;
    public settleVHTLC(request: ark_service_pb.SettleVHTLCRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: ark_service_pb.SettleVHTLCResponse) => void): grpc.ClientUnaryCall;
    public settleVHTLC(request: ark_service_pb.SettleVHTLCRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: ark_service_pb.SettleVHTLCResponse) => void): grpc.ClientUnaryCall;
    public listVHTLC(request: ark_service_pb.ListVHTLCRequest, callback: (error: grpc.ServiceError | null, response: ark_service_pb.ListVHTLCResponse) => void): grpc.ClientUnaryCall;
    public listVHTLC(request: ark_service_pb.ListVHTLCRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: ark_service_pb.ListVHTLCResponse) => void): grpc.ClientUnaryCall;
    public listVHTLC(request: ark_service_pb.ListVHTLCRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: ark_service_pb.ListVHTLCResponse) => void): grpc.ClientUnaryCall;
    public getInvoice(request: ark_service_pb.GetInvoiceRequest, callback: (error: grpc.ServiceError | null, response: ark_service_pb.GetInvoiceResponse) => void): grpc.ClientUnaryCall;
    public getInvoice(request: ark_service_pb.GetInvoiceRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: ark_service_pb.GetInvoiceResponse) => void): grpc.ClientUnaryCall;
    public getInvoice(request: ark_service_pb.GetInvoiceRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: ark_service_pb.GetInvoiceResponse) => void): grpc.ClientUnaryCall;
    public payInvoice(request: ark_service_pb.PayInvoiceRequest, callback: (error: grpc.ServiceError | null, response: ark_service_pb.PayInvoiceResponse) => void): grpc.ClientUnaryCall;
    public payInvoice(request: ark_service_pb.PayInvoiceRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: ark_service_pb.PayInvoiceResponse) => void): grpc.ClientUnaryCall;
    public payInvoice(request: ark_service_pb.PayInvoiceRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: ark_service_pb.PayInvoiceResponse) => void): grpc.ClientUnaryCall;
    public isInvoiceSettled(request: ark_service_pb.IsInvoiceSettledRequest, callback: (error: grpc.ServiceError | null, response: ark_service_pb.IsInvoiceSettledResponse) => void): grpc.ClientUnaryCall;
    public isInvoiceSettled(request: ark_service_pb.IsInvoiceSettledRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: ark_service_pb.IsInvoiceSettledResponse) => void): grpc.ClientUnaryCall;
    public isInvoiceSettled(request: ark_service_pb.IsInvoiceSettledRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: ark_service_pb.IsInvoiceSettledResponse) => void): grpc.ClientUnaryCall;
    public getVirtualTxs(request: ark_service_pb.GetVirtualTxsRequest, callback: (error: grpc.ServiceError | null, response: ark_service_pb.GetVirtualTxsResponse) => void): grpc.ClientUnaryCall;
    public getVirtualTxs(request: ark_service_pb.GetVirtualTxsRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: ark_service_pb.GetVirtualTxsResponse) => void): grpc.ClientUnaryCall;
    public getVirtualTxs(request: ark_service_pb.GetVirtualTxsRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: ark_service_pb.GetVirtualTxsResponse) => void): grpc.ClientUnaryCall;
    public getVtxos(request: ark_service_pb.GetVtxosRequest, callback: (error: grpc.ServiceError | null, response: ark_service_pb.GetVtxosResponse) => void): grpc.ClientUnaryCall;
    public getVtxos(request: ark_service_pb.GetVtxosRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: ark_service_pb.GetVtxosResponse) => void): grpc.ClientUnaryCall;
    public getVtxos(request: ark_service_pb.GetVtxosRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: ark_service_pb.GetVtxosResponse) => void): grpc.ClientUnaryCall;
    public nextSettlement(request: ark_service_pb.NextSettlementRequest, callback: (error: grpc.ServiceError | null, response: ark_service_pb.NextSettlementResponse) => void): grpc.ClientUnaryCall;
    public nextSettlement(request: ark_service_pb.NextSettlementRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: ark_service_pb.NextSettlementResponse) => void): grpc.ClientUnaryCall;
    public nextSettlement(request: ark_service_pb.NextSettlementRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: ark_service_pb.NextSettlementResponse) => void): grpc.ClientUnaryCall;
    public createChainSwap(request: ark_service_pb.CreateChainSwapRequest, callback: (error: grpc.ServiceError | null, response: ark_service_pb.CreateChainSwapResponse) => void): grpc.ClientUnaryCall;
    public createChainSwap(request: ark_service_pb.CreateChainSwapRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: ark_service_pb.CreateChainSwapResponse) => void): grpc.ClientUnaryCall;
    public createChainSwap(request: ark_service_pb.CreateChainSwapRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: ark_service_pb.CreateChainSwapResponse) => void): grpc.ClientUnaryCall;
    public listChainSwaps(request: ark_service_pb.ListChainSwapsRequest, callback: (error: grpc.ServiceError | null, response: ark_service_pb.ListChainSwapsResponse) => void): grpc.ClientUnaryCall;
    public listChainSwaps(request: ark_service_pb.ListChainSwapsRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: ark_service_pb.ListChainSwapsResponse) => void): grpc.ClientUnaryCall;
    public listChainSwaps(request: ark_service_pb.ListChainSwapsRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: ark_service_pb.ListChainSwapsResponse) => void): grpc.ClientUnaryCall;
    public refundChainSwap(request: ark_service_pb.RefundChainSwapRequest, callback: (error: grpc.ServiceError | null, response: ark_service_pb.RefundChainSwapResponse) => void): grpc.ClientUnaryCall;
    public refundChainSwap(request: ark_service_pb.RefundChainSwapRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: ark_service_pb.RefundChainSwapResponse) => void): grpc.ClientUnaryCall;
    public refundChainSwap(request: ark_service_pb.RefundChainSwapRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: ark_service_pb.RefundChainSwapResponse) => void): grpc.ClientUnaryCall;
    public listDelegates(request: ark_service_pb.ListDelegatesRequest, callback: (error: grpc.ServiceError | null, response: ark_service_pb.ListDelegatesResponse) => void): grpc.ClientUnaryCall;
    public listDelegates(request: ark_service_pb.ListDelegatesRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: ark_service_pb.ListDelegatesResponse) => void): grpc.ClientUnaryCall;
    public listDelegates(request: ark_service_pb.ListDelegatesRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: ark_service_pb.ListDelegatesResponse) => void): grpc.ClientUnaryCall;
}
