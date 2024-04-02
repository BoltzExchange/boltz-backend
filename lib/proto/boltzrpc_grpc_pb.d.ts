// package: boltzrpc
// file: boltzrpc.proto

/* tslint:disable */
/* eslint-disable */

import * as grpc from "@grpc/grpc-js";
import * as boltzrpc_pb from "./boltzrpc_pb";

interface IBoltzService extends grpc.ServiceDefinition<grpc.UntypedServiceImplementation> {
    getInfo: IBoltzService_IGetInfo;
    getBalance: IBoltzService_IGetBalance;
    deriveKeys: IBoltzService_IDeriveKeys;
    deriveBlindingKeys: IBoltzService_IDeriveBlindingKeys;
    unblindOutputs: IBoltzService_IUnblindOutputs;
    getAddress: IBoltzService_IGetAddress;
    sendCoins: IBoltzService_ISendCoins;
    updateTimeoutBlockDelta: IBoltzService_IUpdateTimeoutBlockDelta;
    addReferral: IBoltzService_IAddReferral;
    setSwapStatus: IBoltzService_ISetSwapStatus;
    getLockedFunds: IBoltzService_IGetLockedFunds;
    sweepSwaps: IBoltzService_ISweepSwaps;
    rescan: IBoltzService_IRescan;
    devHeapDump: IBoltzService_IDevHeapDump;
}

interface IBoltzService_IGetInfo extends grpc.MethodDefinition<boltzrpc_pb.GetInfoRequest, boltzrpc_pb.GetInfoResponse> {
    path: "/boltzrpc.Boltz/GetInfo";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<boltzrpc_pb.GetInfoRequest>;
    requestDeserialize: grpc.deserialize<boltzrpc_pb.GetInfoRequest>;
    responseSerialize: grpc.serialize<boltzrpc_pb.GetInfoResponse>;
    responseDeserialize: grpc.deserialize<boltzrpc_pb.GetInfoResponse>;
}
interface IBoltzService_IGetBalance extends grpc.MethodDefinition<boltzrpc_pb.GetBalanceRequest, boltzrpc_pb.GetBalanceResponse> {
    path: "/boltzrpc.Boltz/GetBalance";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<boltzrpc_pb.GetBalanceRequest>;
    requestDeserialize: grpc.deserialize<boltzrpc_pb.GetBalanceRequest>;
    responseSerialize: grpc.serialize<boltzrpc_pb.GetBalanceResponse>;
    responseDeserialize: grpc.deserialize<boltzrpc_pb.GetBalanceResponse>;
}
interface IBoltzService_IDeriveKeys extends grpc.MethodDefinition<boltzrpc_pb.DeriveKeysRequest, boltzrpc_pb.DeriveKeysResponse> {
    path: "/boltzrpc.Boltz/DeriveKeys";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<boltzrpc_pb.DeriveKeysRequest>;
    requestDeserialize: grpc.deserialize<boltzrpc_pb.DeriveKeysRequest>;
    responseSerialize: grpc.serialize<boltzrpc_pb.DeriveKeysResponse>;
    responseDeserialize: grpc.deserialize<boltzrpc_pb.DeriveKeysResponse>;
}
interface IBoltzService_IDeriveBlindingKeys extends grpc.MethodDefinition<boltzrpc_pb.DeriveBlindingKeyRequest, boltzrpc_pb.DeriveBlindingKeyResponse> {
    path: "/boltzrpc.Boltz/DeriveBlindingKeys";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<boltzrpc_pb.DeriveBlindingKeyRequest>;
    requestDeserialize: grpc.deserialize<boltzrpc_pb.DeriveBlindingKeyRequest>;
    responseSerialize: grpc.serialize<boltzrpc_pb.DeriveBlindingKeyResponse>;
    responseDeserialize: grpc.deserialize<boltzrpc_pb.DeriveBlindingKeyResponse>;
}
interface IBoltzService_IUnblindOutputs extends grpc.MethodDefinition<boltzrpc_pb.UnblindOutputsRequest, boltzrpc_pb.UnblindOutputsResponse> {
    path: "/boltzrpc.Boltz/UnblindOutputs";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<boltzrpc_pb.UnblindOutputsRequest>;
    requestDeserialize: grpc.deserialize<boltzrpc_pb.UnblindOutputsRequest>;
    responseSerialize: grpc.serialize<boltzrpc_pb.UnblindOutputsResponse>;
    responseDeserialize: grpc.deserialize<boltzrpc_pb.UnblindOutputsResponse>;
}
interface IBoltzService_IGetAddress extends grpc.MethodDefinition<boltzrpc_pb.GetAddressRequest, boltzrpc_pb.GetAddressResponse> {
    path: "/boltzrpc.Boltz/GetAddress";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<boltzrpc_pb.GetAddressRequest>;
    requestDeserialize: grpc.deserialize<boltzrpc_pb.GetAddressRequest>;
    responseSerialize: grpc.serialize<boltzrpc_pb.GetAddressResponse>;
    responseDeserialize: grpc.deserialize<boltzrpc_pb.GetAddressResponse>;
}
interface IBoltzService_ISendCoins extends grpc.MethodDefinition<boltzrpc_pb.SendCoinsRequest, boltzrpc_pb.SendCoinsResponse> {
    path: "/boltzrpc.Boltz/SendCoins";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<boltzrpc_pb.SendCoinsRequest>;
    requestDeserialize: grpc.deserialize<boltzrpc_pb.SendCoinsRequest>;
    responseSerialize: grpc.serialize<boltzrpc_pb.SendCoinsResponse>;
    responseDeserialize: grpc.deserialize<boltzrpc_pb.SendCoinsResponse>;
}
interface IBoltzService_IUpdateTimeoutBlockDelta extends grpc.MethodDefinition<boltzrpc_pb.UpdateTimeoutBlockDeltaRequest, boltzrpc_pb.UpdateTimeoutBlockDeltaResponse> {
    path: "/boltzrpc.Boltz/UpdateTimeoutBlockDelta";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<boltzrpc_pb.UpdateTimeoutBlockDeltaRequest>;
    requestDeserialize: grpc.deserialize<boltzrpc_pb.UpdateTimeoutBlockDeltaRequest>;
    responseSerialize: grpc.serialize<boltzrpc_pb.UpdateTimeoutBlockDeltaResponse>;
    responseDeserialize: grpc.deserialize<boltzrpc_pb.UpdateTimeoutBlockDeltaResponse>;
}
interface IBoltzService_IAddReferral extends grpc.MethodDefinition<boltzrpc_pb.AddReferralRequest, boltzrpc_pb.AddReferralResponse> {
    path: "/boltzrpc.Boltz/AddReferral";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<boltzrpc_pb.AddReferralRequest>;
    requestDeserialize: grpc.deserialize<boltzrpc_pb.AddReferralRequest>;
    responseSerialize: grpc.serialize<boltzrpc_pb.AddReferralResponse>;
    responseDeserialize: grpc.deserialize<boltzrpc_pb.AddReferralResponse>;
}
interface IBoltzService_ISetSwapStatus extends grpc.MethodDefinition<boltzrpc_pb.SetSwapStatusRequest, boltzrpc_pb.SetSwapStatusResponse> {
    path: "/boltzrpc.Boltz/SetSwapStatus";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<boltzrpc_pb.SetSwapStatusRequest>;
    requestDeserialize: grpc.deserialize<boltzrpc_pb.SetSwapStatusRequest>;
    responseSerialize: grpc.serialize<boltzrpc_pb.SetSwapStatusResponse>;
    responseDeserialize: grpc.deserialize<boltzrpc_pb.SetSwapStatusResponse>;
}
interface IBoltzService_IGetLockedFunds extends grpc.MethodDefinition<boltzrpc_pb.GetLockedFundsRequest, boltzrpc_pb.GetLockedFundsResponse> {
    path: "/boltzrpc.Boltz/GetLockedFunds";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<boltzrpc_pb.GetLockedFundsRequest>;
    requestDeserialize: grpc.deserialize<boltzrpc_pb.GetLockedFundsRequest>;
    responseSerialize: grpc.serialize<boltzrpc_pb.GetLockedFundsResponse>;
    responseDeserialize: grpc.deserialize<boltzrpc_pb.GetLockedFundsResponse>;
}
interface IBoltzService_ISweepSwaps extends grpc.MethodDefinition<boltzrpc_pb.SweepSwapsRequest, boltzrpc_pb.SweepSwapsResponse> {
    path: "/boltzrpc.Boltz/SweepSwaps";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<boltzrpc_pb.SweepSwapsRequest>;
    requestDeserialize: grpc.deserialize<boltzrpc_pb.SweepSwapsRequest>;
    responseSerialize: grpc.serialize<boltzrpc_pb.SweepSwapsResponse>;
    responseDeserialize: grpc.deserialize<boltzrpc_pb.SweepSwapsResponse>;
}
interface IBoltzService_IRescan extends grpc.MethodDefinition<boltzrpc_pb.RescanRequest, boltzrpc_pb.RescanResponse> {
    path: "/boltzrpc.Boltz/Rescan";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<boltzrpc_pb.RescanRequest>;
    requestDeserialize: grpc.deserialize<boltzrpc_pb.RescanRequest>;
    responseSerialize: grpc.serialize<boltzrpc_pb.RescanResponse>;
    responseDeserialize: grpc.deserialize<boltzrpc_pb.RescanResponse>;
}
interface IBoltzService_IDevHeapDump extends grpc.MethodDefinition<boltzrpc_pb.DevHeapDumpRequest, boltzrpc_pb.DevHeapDumpResponse> {
    path: "/boltzrpc.Boltz/DevHeapDump";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<boltzrpc_pb.DevHeapDumpRequest>;
    requestDeserialize: grpc.deserialize<boltzrpc_pb.DevHeapDumpRequest>;
    responseSerialize: grpc.serialize<boltzrpc_pb.DevHeapDumpResponse>;
    responseDeserialize: grpc.deserialize<boltzrpc_pb.DevHeapDumpResponse>;
}

export const BoltzService: IBoltzService;

export interface IBoltzServer extends grpc.UntypedServiceImplementation {
    getInfo: grpc.handleUnaryCall<boltzrpc_pb.GetInfoRequest, boltzrpc_pb.GetInfoResponse>;
    getBalance: grpc.handleUnaryCall<boltzrpc_pb.GetBalanceRequest, boltzrpc_pb.GetBalanceResponse>;
    deriveKeys: grpc.handleUnaryCall<boltzrpc_pb.DeriveKeysRequest, boltzrpc_pb.DeriveKeysResponse>;
    deriveBlindingKeys: grpc.handleUnaryCall<boltzrpc_pb.DeriveBlindingKeyRequest, boltzrpc_pb.DeriveBlindingKeyResponse>;
    unblindOutputs: grpc.handleUnaryCall<boltzrpc_pb.UnblindOutputsRequest, boltzrpc_pb.UnblindOutputsResponse>;
    getAddress: grpc.handleUnaryCall<boltzrpc_pb.GetAddressRequest, boltzrpc_pb.GetAddressResponse>;
    sendCoins: grpc.handleUnaryCall<boltzrpc_pb.SendCoinsRequest, boltzrpc_pb.SendCoinsResponse>;
    updateTimeoutBlockDelta: grpc.handleUnaryCall<boltzrpc_pb.UpdateTimeoutBlockDeltaRequest, boltzrpc_pb.UpdateTimeoutBlockDeltaResponse>;
    addReferral: grpc.handleUnaryCall<boltzrpc_pb.AddReferralRequest, boltzrpc_pb.AddReferralResponse>;
    setSwapStatus: grpc.handleUnaryCall<boltzrpc_pb.SetSwapStatusRequest, boltzrpc_pb.SetSwapStatusResponse>;
    getLockedFunds: grpc.handleUnaryCall<boltzrpc_pb.GetLockedFundsRequest, boltzrpc_pb.GetLockedFundsResponse>;
    sweepSwaps: grpc.handleUnaryCall<boltzrpc_pb.SweepSwapsRequest, boltzrpc_pb.SweepSwapsResponse>;
    rescan: grpc.handleUnaryCall<boltzrpc_pb.RescanRequest, boltzrpc_pb.RescanResponse>;
    devHeapDump: grpc.handleUnaryCall<boltzrpc_pb.DevHeapDumpRequest, boltzrpc_pb.DevHeapDumpResponse>;
}

export interface IBoltzClient {
    getInfo(request: boltzrpc_pb.GetInfoRequest, callback: (error: grpc.ServiceError | null, response: boltzrpc_pb.GetInfoResponse) => void): grpc.ClientUnaryCall;
    getInfo(request: boltzrpc_pb.GetInfoRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: boltzrpc_pb.GetInfoResponse) => void): grpc.ClientUnaryCall;
    getInfo(request: boltzrpc_pb.GetInfoRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: boltzrpc_pb.GetInfoResponse) => void): grpc.ClientUnaryCall;
    getBalance(request: boltzrpc_pb.GetBalanceRequest, callback: (error: grpc.ServiceError | null, response: boltzrpc_pb.GetBalanceResponse) => void): grpc.ClientUnaryCall;
    getBalance(request: boltzrpc_pb.GetBalanceRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: boltzrpc_pb.GetBalanceResponse) => void): grpc.ClientUnaryCall;
    getBalance(request: boltzrpc_pb.GetBalanceRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: boltzrpc_pb.GetBalanceResponse) => void): grpc.ClientUnaryCall;
    deriveKeys(request: boltzrpc_pb.DeriveKeysRequest, callback: (error: grpc.ServiceError | null, response: boltzrpc_pb.DeriveKeysResponse) => void): grpc.ClientUnaryCall;
    deriveKeys(request: boltzrpc_pb.DeriveKeysRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: boltzrpc_pb.DeriveKeysResponse) => void): grpc.ClientUnaryCall;
    deriveKeys(request: boltzrpc_pb.DeriveKeysRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: boltzrpc_pb.DeriveKeysResponse) => void): grpc.ClientUnaryCall;
    deriveBlindingKeys(request: boltzrpc_pb.DeriveBlindingKeyRequest, callback: (error: grpc.ServiceError | null, response: boltzrpc_pb.DeriveBlindingKeyResponse) => void): grpc.ClientUnaryCall;
    deriveBlindingKeys(request: boltzrpc_pb.DeriveBlindingKeyRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: boltzrpc_pb.DeriveBlindingKeyResponse) => void): grpc.ClientUnaryCall;
    deriveBlindingKeys(request: boltzrpc_pb.DeriveBlindingKeyRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: boltzrpc_pb.DeriveBlindingKeyResponse) => void): grpc.ClientUnaryCall;
    unblindOutputs(request: boltzrpc_pb.UnblindOutputsRequest, callback: (error: grpc.ServiceError | null, response: boltzrpc_pb.UnblindOutputsResponse) => void): grpc.ClientUnaryCall;
    unblindOutputs(request: boltzrpc_pb.UnblindOutputsRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: boltzrpc_pb.UnblindOutputsResponse) => void): grpc.ClientUnaryCall;
    unblindOutputs(request: boltzrpc_pb.UnblindOutputsRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: boltzrpc_pb.UnblindOutputsResponse) => void): grpc.ClientUnaryCall;
    getAddress(request: boltzrpc_pb.GetAddressRequest, callback: (error: grpc.ServiceError | null, response: boltzrpc_pb.GetAddressResponse) => void): grpc.ClientUnaryCall;
    getAddress(request: boltzrpc_pb.GetAddressRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: boltzrpc_pb.GetAddressResponse) => void): grpc.ClientUnaryCall;
    getAddress(request: boltzrpc_pb.GetAddressRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: boltzrpc_pb.GetAddressResponse) => void): grpc.ClientUnaryCall;
    sendCoins(request: boltzrpc_pb.SendCoinsRequest, callback: (error: grpc.ServiceError | null, response: boltzrpc_pb.SendCoinsResponse) => void): grpc.ClientUnaryCall;
    sendCoins(request: boltzrpc_pb.SendCoinsRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: boltzrpc_pb.SendCoinsResponse) => void): grpc.ClientUnaryCall;
    sendCoins(request: boltzrpc_pb.SendCoinsRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: boltzrpc_pb.SendCoinsResponse) => void): grpc.ClientUnaryCall;
    updateTimeoutBlockDelta(request: boltzrpc_pb.UpdateTimeoutBlockDeltaRequest, callback: (error: grpc.ServiceError | null, response: boltzrpc_pb.UpdateTimeoutBlockDeltaResponse) => void): grpc.ClientUnaryCall;
    updateTimeoutBlockDelta(request: boltzrpc_pb.UpdateTimeoutBlockDeltaRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: boltzrpc_pb.UpdateTimeoutBlockDeltaResponse) => void): grpc.ClientUnaryCall;
    updateTimeoutBlockDelta(request: boltzrpc_pb.UpdateTimeoutBlockDeltaRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: boltzrpc_pb.UpdateTimeoutBlockDeltaResponse) => void): grpc.ClientUnaryCall;
    addReferral(request: boltzrpc_pb.AddReferralRequest, callback: (error: grpc.ServiceError | null, response: boltzrpc_pb.AddReferralResponse) => void): grpc.ClientUnaryCall;
    addReferral(request: boltzrpc_pb.AddReferralRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: boltzrpc_pb.AddReferralResponse) => void): grpc.ClientUnaryCall;
    addReferral(request: boltzrpc_pb.AddReferralRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: boltzrpc_pb.AddReferralResponse) => void): grpc.ClientUnaryCall;
    setSwapStatus(request: boltzrpc_pb.SetSwapStatusRequest, callback: (error: grpc.ServiceError | null, response: boltzrpc_pb.SetSwapStatusResponse) => void): grpc.ClientUnaryCall;
    setSwapStatus(request: boltzrpc_pb.SetSwapStatusRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: boltzrpc_pb.SetSwapStatusResponse) => void): grpc.ClientUnaryCall;
    setSwapStatus(request: boltzrpc_pb.SetSwapStatusRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: boltzrpc_pb.SetSwapStatusResponse) => void): grpc.ClientUnaryCall;
    getLockedFunds(request: boltzrpc_pb.GetLockedFundsRequest, callback: (error: grpc.ServiceError | null, response: boltzrpc_pb.GetLockedFundsResponse) => void): grpc.ClientUnaryCall;
    getLockedFunds(request: boltzrpc_pb.GetLockedFundsRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: boltzrpc_pb.GetLockedFundsResponse) => void): grpc.ClientUnaryCall;
    getLockedFunds(request: boltzrpc_pb.GetLockedFundsRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: boltzrpc_pb.GetLockedFundsResponse) => void): grpc.ClientUnaryCall;
    sweepSwaps(request: boltzrpc_pb.SweepSwapsRequest, callback: (error: grpc.ServiceError | null, response: boltzrpc_pb.SweepSwapsResponse) => void): grpc.ClientUnaryCall;
    sweepSwaps(request: boltzrpc_pb.SweepSwapsRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: boltzrpc_pb.SweepSwapsResponse) => void): grpc.ClientUnaryCall;
    sweepSwaps(request: boltzrpc_pb.SweepSwapsRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: boltzrpc_pb.SweepSwapsResponse) => void): grpc.ClientUnaryCall;
    rescan(request: boltzrpc_pb.RescanRequest, callback: (error: grpc.ServiceError | null, response: boltzrpc_pb.RescanResponse) => void): grpc.ClientUnaryCall;
    rescan(request: boltzrpc_pb.RescanRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: boltzrpc_pb.RescanResponse) => void): grpc.ClientUnaryCall;
    rescan(request: boltzrpc_pb.RescanRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: boltzrpc_pb.RescanResponse) => void): grpc.ClientUnaryCall;
    devHeapDump(request: boltzrpc_pb.DevHeapDumpRequest, callback: (error: grpc.ServiceError | null, response: boltzrpc_pb.DevHeapDumpResponse) => void): grpc.ClientUnaryCall;
    devHeapDump(request: boltzrpc_pb.DevHeapDumpRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: boltzrpc_pb.DevHeapDumpResponse) => void): grpc.ClientUnaryCall;
    devHeapDump(request: boltzrpc_pb.DevHeapDumpRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: boltzrpc_pb.DevHeapDumpResponse) => void): grpc.ClientUnaryCall;
}

export class BoltzClient extends grpc.Client implements IBoltzClient {
    constructor(address: string, credentials: grpc.ChannelCredentials, options?: Partial<grpc.ClientOptions>);
    public getInfo(request: boltzrpc_pb.GetInfoRequest, callback: (error: grpc.ServiceError | null, response: boltzrpc_pb.GetInfoResponse) => void): grpc.ClientUnaryCall;
    public getInfo(request: boltzrpc_pb.GetInfoRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: boltzrpc_pb.GetInfoResponse) => void): grpc.ClientUnaryCall;
    public getInfo(request: boltzrpc_pb.GetInfoRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: boltzrpc_pb.GetInfoResponse) => void): grpc.ClientUnaryCall;
    public getBalance(request: boltzrpc_pb.GetBalanceRequest, callback: (error: grpc.ServiceError | null, response: boltzrpc_pb.GetBalanceResponse) => void): grpc.ClientUnaryCall;
    public getBalance(request: boltzrpc_pb.GetBalanceRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: boltzrpc_pb.GetBalanceResponse) => void): grpc.ClientUnaryCall;
    public getBalance(request: boltzrpc_pb.GetBalanceRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: boltzrpc_pb.GetBalanceResponse) => void): grpc.ClientUnaryCall;
    public deriveKeys(request: boltzrpc_pb.DeriveKeysRequest, callback: (error: grpc.ServiceError | null, response: boltzrpc_pb.DeriveKeysResponse) => void): grpc.ClientUnaryCall;
    public deriveKeys(request: boltzrpc_pb.DeriveKeysRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: boltzrpc_pb.DeriveKeysResponse) => void): grpc.ClientUnaryCall;
    public deriveKeys(request: boltzrpc_pb.DeriveKeysRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: boltzrpc_pb.DeriveKeysResponse) => void): grpc.ClientUnaryCall;
    public deriveBlindingKeys(request: boltzrpc_pb.DeriveBlindingKeyRequest, callback: (error: grpc.ServiceError | null, response: boltzrpc_pb.DeriveBlindingKeyResponse) => void): grpc.ClientUnaryCall;
    public deriveBlindingKeys(request: boltzrpc_pb.DeriveBlindingKeyRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: boltzrpc_pb.DeriveBlindingKeyResponse) => void): grpc.ClientUnaryCall;
    public deriveBlindingKeys(request: boltzrpc_pb.DeriveBlindingKeyRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: boltzrpc_pb.DeriveBlindingKeyResponse) => void): grpc.ClientUnaryCall;
    public unblindOutputs(request: boltzrpc_pb.UnblindOutputsRequest, callback: (error: grpc.ServiceError | null, response: boltzrpc_pb.UnblindOutputsResponse) => void): grpc.ClientUnaryCall;
    public unblindOutputs(request: boltzrpc_pb.UnblindOutputsRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: boltzrpc_pb.UnblindOutputsResponse) => void): grpc.ClientUnaryCall;
    public unblindOutputs(request: boltzrpc_pb.UnblindOutputsRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: boltzrpc_pb.UnblindOutputsResponse) => void): grpc.ClientUnaryCall;
    public getAddress(request: boltzrpc_pb.GetAddressRequest, callback: (error: grpc.ServiceError | null, response: boltzrpc_pb.GetAddressResponse) => void): grpc.ClientUnaryCall;
    public getAddress(request: boltzrpc_pb.GetAddressRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: boltzrpc_pb.GetAddressResponse) => void): grpc.ClientUnaryCall;
    public getAddress(request: boltzrpc_pb.GetAddressRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: boltzrpc_pb.GetAddressResponse) => void): grpc.ClientUnaryCall;
    public sendCoins(request: boltzrpc_pb.SendCoinsRequest, callback: (error: grpc.ServiceError | null, response: boltzrpc_pb.SendCoinsResponse) => void): grpc.ClientUnaryCall;
    public sendCoins(request: boltzrpc_pb.SendCoinsRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: boltzrpc_pb.SendCoinsResponse) => void): grpc.ClientUnaryCall;
    public sendCoins(request: boltzrpc_pb.SendCoinsRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: boltzrpc_pb.SendCoinsResponse) => void): grpc.ClientUnaryCall;
    public updateTimeoutBlockDelta(request: boltzrpc_pb.UpdateTimeoutBlockDeltaRequest, callback: (error: grpc.ServiceError | null, response: boltzrpc_pb.UpdateTimeoutBlockDeltaResponse) => void): grpc.ClientUnaryCall;
    public updateTimeoutBlockDelta(request: boltzrpc_pb.UpdateTimeoutBlockDeltaRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: boltzrpc_pb.UpdateTimeoutBlockDeltaResponse) => void): grpc.ClientUnaryCall;
    public updateTimeoutBlockDelta(request: boltzrpc_pb.UpdateTimeoutBlockDeltaRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: boltzrpc_pb.UpdateTimeoutBlockDeltaResponse) => void): grpc.ClientUnaryCall;
    public addReferral(request: boltzrpc_pb.AddReferralRequest, callback: (error: grpc.ServiceError | null, response: boltzrpc_pb.AddReferralResponse) => void): grpc.ClientUnaryCall;
    public addReferral(request: boltzrpc_pb.AddReferralRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: boltzrpc_pb.AddReferralResponse) => void): grpc.ClientUnaryCall;
    public addReferral(request: boltzrpc_pb.AddReferralRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: boltzrpc_pb.AddReferralResponse) => void): grpc.ClientUnaryCall;
    public setSwapStatus(request: boltzrpc_pb.SetSwapStatusRequest, callback: (error: grpc.ServiceError | null, response: boltzrpc_pb.SetSwapStatusResponse) => void): grpc.ClientUnaryCall;
    public setSwapStatus(request: boltzrpc_pb.SetSwapStatusRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: boltzrpc_pb.SetSwapStatusResponse) => void): grpc.ClientUnaryCall;
    public setSwapStatus(request: boltzrpc_pb.SetSwapStatusRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: boltzrpc_pb.SetSwapStatusResponse) => void): grpc.ClientUnaryCall;
    public getLockedFunds(request: boltzrpc_pb.GetLockedFundsRequest, callback: (error: grpc.ServiceError | null, response: boltzrpc_pb.GetLockedFundsResponse) => void): grpc.ClientUnaryCall;
    public getLockedFunds(request: boltzrpc_pb.GetLockedFundsRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: boltzrpc_pb.GetLockedFundsResponse) => void): grpc.ClientUnaryCall;
    public getLockedFunds(request: boltzrpc_pb.GetLockedFundsRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: boltzrpc_pb.GetLockedFundsResponse) => void): grpc.ClientUnaryCall;
    public sweepSwaps(request: boltzrpc_pb.SweepSwapsRequest, callback: (error: grpc.ServiceError | null, response: boltzrpc_pb.SweepSwapsResponse) => void): grpc.ClientUnaryCall;
    public sweepSwaps(request: boltzrpc_pb.SweepSwapsRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: boltzrpc_pb.SweepSwapsResponse) => void): grpc.ClientUnaryCall;
    public sweepSwaps(request: boltzrpc_pb.SweepSwapsRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: boltzrpc_pb.SweepSwapsResponse) => void): grpc.ClientUnaryCall;
    public rescan(request: boltzrpc_pb.RescanRequest, callback: (error: grpc.ServiceError | null, response: boltzrpc_pb.RescanResponse) => void): grpc.ClientUnaryCall;
    public rescan(request: boltzrpc_pb.RescanRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: boltzrpc_pb.RescanResponse) => void): grpc.ClientUnaryCall;
    public rescan(request: boltzrpc_pb.RescanRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: boltzrpc_pb.RescanResponse) => void): grpc.ClientUnaryCall;
    public devHeapDump(request: boltzrpc_pb.DevHeapDumpRequest, callback: (error: grpc.ServiceError | null, response: boltzrpc_pb.DevHeapDumpResponse) => void): grpc.ClientUnaryCall;
    public devHeapDump(request: boltzrpc_pb.DevHeapDumpRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: boltzrpc_pb.DevHeapDumpResponse) => void): grpc.ClientUnaryCall;
    public devHeapDump(request: boltzrpc_pb.DevHeapDumpRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: boltzrpc_pb.DevHeapDumpResponse) => void): grpc.ClientUnaryCall;
}
