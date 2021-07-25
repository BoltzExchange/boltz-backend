// package: routerrpc
// file: lnd/router.proto

/* tslint:disable */
/* eslint-disable */

import * as grpc from "grpc";
import * as lnd_router_pb from "../lnd/router_pb";
import * as lnd_rpc_pb from "../lnd/rpc_pb";

interface IRouterService extends grpc.ServiceDefinition<grpc.UntypedServiceImplementation> {
    sendPaymentV2: IRouterService_ISendPaymentV2;
    trackPaymentV2: IRouterService_ITrackPaymentV2;
    estimateRouteFee: IRouterService_IEstimateRouteFee;
    sendToRoute: IRouterService_ISendToRoute;
    sendToRouteV2: IRouterService_ISendToRouteV2;
    resetMissionControl: IRouterService_IResetMissionControl;
    queryMissionControl: IRouterService_IQueryMissionControl;
    xImportMissionControl: IRouterService_IXImportMissionControl;
    getMissionControlConfig: IRouterService_IGetMissionControlConfig;
    setMissionControlConfig: IRouterService_ISetMissionControlConfig;
    queryProbability: IRouterService_IQueryProbability;
    buildRoute: IRouterService_IBuildRoute;
    subscribeHtlcEvents: IRouterService_ISubscribeHtlcEvents;
    sendPayment: IRouterService_ISendPayment;
    trackPayment: IRouterService_ITrackPayment;
    htlcInterceptor: IRouterService_IHtlcInterceptor;
    updateChanStatus: IRouterService_IUpdateChanStatus;
}

interface IRouterService_ISendPaymentV2 extends grpc.MethodDefinition<lnd_router_pb.SendPaymentRequest, lnd_rpc_pb.Payment> {
    path: "/routerrpc.Router/SendPaymentV2";
    requestStream: false;
    responseStream: true;
    requestSerialize: grpc.serialize<lnd_router_pb.SendPaymentRequest>;
    requestDeserialize: grpc.deserialize<lnd_router_pb.SendPaymentRequest>;
    responseSerialize: grpc.serialize<lnd_rpc_pb.Payment>;
    responseDeserialize: grpc.deserialize<lnd_rpc_pb.Payment>;
}
interface IRouterService_ITrackPaymentV2 extends grpc.MethodDefinition<lnd_router_pb.TrackPaymentRequest, lnd_rpc_pb.Payment> {
    path: "/routerrpc.Router/TrackPaymentV2";
    requestStream: false;
    responseStream: true;
    requestSerialize: grpc.serialize<lnd_router_pb.TrackPaymentRequest>;
    requestDeserialize: grpc.deserialize<lnd_router_pb.TrackPaymentRequest>;
    responseSerialize: grpc.serialize<lnd_rpc_pb.Payment>;
    responseDeserialize: grpc.deserialize<lnd_rpc_pb.Payment>;
}
interface IRouterService_IEstimateRouteFee extends grpc.MethodDefinition<lnd_router_pb.RouteFeeRequest, lnd_router_pb.RouteFeeResponse> {
    path: "/routerrpc.Router/EstimateRouteFee";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<lnd_router_pb.RouteFeeRequest>;
    requestDeserialize: grpc.deserialize<lnd_router_pb.RouteFeeRequest>;
    responseSerialize: grpc.serialize<lnd_router_pb.RouteFeeResponse>;
    responseDeserialize: grpc.deserialize<lnd_router_pb.RouteFeeResponse>;
}
interface IRouterService_ISendToRoute extends grpc.MethodDefinition<lnd_router_pb.SendToRouteRequest, lnd_router_pb.SendToRouteResponse> {
    path: "/routerrpc.Router/SendToRoute";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<lnd_router_pb.SendToRouteRequest>;
    requestDeserialize: grpc.deserialize<lnd_router_pb.SendToRouteRequest>;
    responseSerialize: grpc.serialize<lnd_router_pb.SendToRouteResponse>;
    responseDeserialize: grpc.deserialize<lnd_router_pb.SendToRouteResponse>;
}
interface IRouterService_ISendToRouteV2 extends grpc.MethodDefinition<lnd_router_pb.SendToRouteRequest, lnd_rpc_pb.HTLCAttempt> {
    path: "/routerrpc.Router/SendToRouteV2";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<lnd_router_pb.SendToRouteRequest>;
    requestDeserialize: grpc.deserialize<lnd_router_pb.SendToRouteRequest>;
    responseSerialize: grpc.serialize<lnd_rpc_pb.HTLCAttempt>;
    responseDeserialize: grpc.deserialize<lnd_rpc_pb.HTLCAttempt>;
}
interface IRouterService_IResetMissionControl extends grpc.MethodDefinition<lnd_router_pb.ResetMissionControlRequest, lnd_router_pb.ResetMissionControlResponse> {
    path: "/routerrpc.Router/ResetMissionControl";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<lnd_router_pb.ResetMissionControlRequest>;
    requestDeserialize: grpc.deserialize<lnd_router_pb.ResetMissionControlRequest>;
    responseSerialize: grpc.serialize<lnd_router_pb.ResetMissionControlResponse>;
    responseDeserialize: grpc.deserialize<lnd_router_pb.ResetMissionControlResponse>;
}
interface IRouterService_IQueryMissionControl extends grpc.MethodDefinition<lnd_router_pb.QueryMissionControlRequest, lnd_router_pb.QueryMissionControlResponse> {
    path: "/routerrpc.Router/QueryMissionControl";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<lnd_router_pb.QueryMissionControlRequest>;
    requestDeserialize: grpc.deserialize<lnd_router_pb.QueryMissionControlRequest>;
    responseSerialize: grpc.serialize<lnd_router_pb.QueryMissionControlResponse>;
    responseDeserialize: grpc.deserialize<lnd_router_pb.QueryMissionControlResponse>;
}
interface IRouterService_IXImportMissionControl extends grpc.MethodDefinition<lnd_router_pb.XImportMissionControlRequest, lnd_router_pb.XImportMissionControlResponse> {
    path: "/routerrpc.Router/XImportMissionControl";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<lnd_router_pb.XImportMissionControlRequest>;
    requestDeserialize: grpc.deserialize<lnd_router_pb.XImportMissionControlRequest>;
    responseSerialize: grpc.serialize<lnd_router_pb.XImportMissionControlResponse>;
    responseDeserialize: grpc.deserialize<lnd_router_pb.XImportMissionControlResponse>;
}
interface IRouterService_IGetMissionControlConfig extends grpc.MethodDefinition<lnd_router_pb.GetMissionControlConfigRequest, lnd_router_pb.GetMissionControlConfigResponse> {
    path: "/routerrpc.Router/GetMissionControlConfig";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<lnd_router_pb.GetMissionControlConfigRequest>;
    requestDeserialize: grpc.deserialize<lnd_router_pb.GetMissionControlConfigRequest>;
    responseSerialize: grpc.serialize<lnd_router_pb.GetMissionControlConfigResponse>;
    responseDeserialize: grpc.deserialize<lnd_router_pb.GetMissionControlConfigResponse>;
}
interface IRouterService_ISetMissionControlConfig extends grpc.MethodDefinition<lnd_router_pb.SetMissionControlConfigRequest, lnd_router_pb.SetMissionControlConfigResponse> {
    path: "/routerrpc.Router/SetMissionControlConfig";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<lnd_router_pb.SetMissionControlConfigRequest>;
    requestDeserialize: grpc.deserialize<lnd_router_pb.SetMissionControlConfigRequest>;
    responseSerialize: grpc.serialize<lnd_router_pb.SetMissionControlConfigResponse>;
    responseDeserialize: grpc.deserialize<lnd_router_pb.SetMissionControlConfigResponse>;
}
interface IRouterService_IQueryProbability extends grpc.MethodDefinition<lnd_router_pb.QueryProbabilityRequest, lnd_router_pb.QueryProbabilityResponse> {
    path: "/routerrpc.Router/QueryProbability";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<lnd_router_pb.QueryProbabilityRequest>;
    requestDeserialize: grpc.deserialize<lnd_router_pb.QueryProbabilityRequest>;
    responseSerialize: grpc.serialize<lnd_router_pb.QueryProbabilityResponse>;
    responseDeserialize: grpc.deserialize<lnd_router_pb.QueryProbabilityResponse>;
}
interface IRouterService_IBuildRoute extends grpc.MethodDefinition<lnd_router_pb.BuildRouteRequest, lnd_router_pb.BuildRouteResponse> {
    path: "/routerrpc.Router/BuildRoute";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<lnd_router_pb.BuildRouteRequest>;
    requestDeserialize: grpc.deserialize<lnd_router_pb.BuildRouteRequest>;
    responseSerialize: grpc.serialize<lnd_router_pb.BuildRouteResponse>;
    responseDeserialize: grpc.deserialize<lnd_router_pb.BuildRouteResponse>;
}
interface IRouterService_ISubscribeHtlcEvents extends grpc.MethodDefinition<lnd_router_pb.SubscribeHtlcEventsRequest, lnd_router_pb.HtlcEvent> {
    path: "/routerrpc.Router/SubscribeHtlcEvents";
    requestStream: false;
    responseStream: true;
    requestSerialize: grpc.serialize<lnd_router_pb.SubscribeHtlcEventsRequest>;
    requestDeserialize: grpc.deserialize<lnd_router_pb.SubscribeHtlcEventsRequest>;
    responseSerialize: grpc.serialize<lnd_router_pb.HtlcEvent>;
    responseDeserialize: grpc.deserialize<lnd_router_pb.HtlcEvent>;
}
interface IRouterService_ISendPayment extends grpc.MethodDefinition<lnd_router_pb.SendPaymentRequest, lnd_router_pb.PaymentStatus> {
    path: "/routerrpc.Router/SendPayment";
    requestStream: false;
    responseStream: true;
    requestSerialize: grpc.serialize<lnd_router_pb.SendPaymentRequest>;
    requestDeserialize: grpc.deserialize<lnd_router_pb.SendPaymentRequest>;
    responseSerialize: grpc.serialize<lnd_router_pb.PaymentStatus>;
    responseDeserialize: grpc.deserialize<lnd_router_pb.PaymentStatus>;
}
interface IRouterService_ITrackPayment extends grpc.MethodDefinition<lnd_router_pb.TrackPaymentRequest, lnd_router_pb.PaymentStatus> {
    path: "/routerrpc.Router/TrackPayment";
    requestStream: false;
    responseStream: true;
    requestSerialize: grpc.serialize<lnd_router_pb.TrackPaymentRequest>;
    requestDeserialize: grpc.deserialize<lnd_router_pb.TrackPaymentRequest>;
    responseSerialize: grpc.serialize<lnd_router_pb.PaymentStatus>;
    responseDeserialize: grpc.deserialize<lnd_router_pb.PaymentStatus>;
}
interface IRouterService_IHtlcInterceptor extends grpc.MethodDefinition<lnd_router_pb.ForwardHtlcInterceptResponse, lnd_router_pb.ForwardHtlcInterceptRequest> {
    path: "/routerrpc.Router/HtlcInterceptor";
    requestStream: true;
    responseStream: true;
    requestSerialize: grpc.serialize<lnd_router_pb.ForwardHtlcInterceptResponse>;
    requestDeserialize: grpc.deserialize<lnd_router_pb.ForwardHtlcInterceptResponse>;
    responseSerialize: grpc.serialize<lnd_router_pb.ForwardHtlcInterceptRequest>;
    responseDeserialize: grpc.deserialize<lnd_router_pb.ForwardHtlcInterceptRequest>;
}
interface IRouterService_IUpdateChanStatus extends grpc.MethodDefinition<lnd_router_pb.UpdateChanStatusRequest, lnd_router_pb.UpdateChanStatusResponse> {
    path: "/routerrpc.Router/UpdateChanStatus";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<lnd_router_pb.UpdateChanStatusRequest>;
    requestDeserialize: grpc.deserialize<lnd_router_pb.UpdateChanStatusRequest>;
    responseSerialize: grpc.serialize<lnd_router_pb.UpdateChanStatusResponse>;
    responseDeserialize: grpc.deserialize<lnd_router_pb.UpdateChanStatusResponse>;
}

export const RouterService: IRouterService;

export interface IRouterServer {
    sendPaymentV2: grpc.handleServerStreamingCall<lnd_router_pb.SendPaymentRequest, lnd_rpc_pb.Payment>;
    trackPaymentV2: grpc.handleServerStreamingCall<lnd_router_pb.TrackPaymentRequest, lnd_rpc_pb.Payment>;
    estimateRouteFee: grpc.handleUnaryCall<lnd_router_pb.RouteFeeRequest, lnd_router_pb.RouteFeeResponse>;
    sendToRoute: grpc.handleUnaryCall<lnd_router_pb.SendToRouteRequest, lnd_router_pb.SendToRouteResponse>;
    sendToRouteV2: grpc.handleUnaryCall<lnd_router_pb.SendToRouteRequest, lnd_rpc_pb.HTLCAttempt>;
    resetMissionControl: grpc.handleUnaryCall<lnd_router_pb.ResetMissionControlRequest, lnd_router_pb.ResetMissionControlResponse>;
    queryMissionControl: grpc.handleUnaryCall<lnd_router_pb.QueryMissionControlRequest, lnd_router_pb.QueryMissionControlResponse>;
    xImportMissionControl: grpc.handleUnaryCall<lnd_router_pb.XImportMissionControlRequest, lnd_router_pb.XImportMissionControlResponse>;
    getMissionControlConfig: grpc.handleUnaryCall<lnd_router_pb.GetMissionControlConfigRequest, lnd_router_pb.GetMissionControlConfigResponse>;
    setMissionControlConfig: grpc.handleUnaryCall<lnd_router_pb.SetMissionControlConfigRequest, lnd_router_pb.SetMissionControlConfigResponse>;
    queryProbability: grpc.handleUnaryCall<lnd_router_pb.QueryProbabilityRequest, lnd_router_pb.QueryProbabilityResponse>;
    buildRoute: grpc.handleUnaryCall<lnd_router_pb.BuildRouteRequest, lnd_router_pb.BuildRouteResponse>;
    subscribeHtlcEvents: grpc.handleServerStreamingCall<lnd_router_pb.SubscribeHtlcEventsRequest, lnd_router_pb.HtlcEvent>;
    sendPayment: grpc.handleServerStreamingCall<lnd_router_pb.SendPaymentRequest, lnd_router_pb.PaymentStatus>;
    trackPayment: grpc.handleServerStreamingCall<lnd_router_pb.TrackPaymentRequest, lnd_router_pb.PaymentStatus>;
    htlcInterceptor: grpc.handleBidiStreamingCall<lnd_router_pb.ForwardHtlcInterceptResponse, lnd_router_pb.ForwardHtlcInterceptRequest>;
    updateChanStatus: grpc.handleUnaryCall<lnd_router_pb.UpdateChanStatusRequest, lnd_router_pb.UpdateChanStatusResponse>;
}

export interface IRouterClient {
    sendPaymentV2(request: lnd_router_pb.SendPaymentRequest, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<lnd_rpc_pb.Payment>;
    sendPaymentV2(request: lnd_router_pb.SendPaymentRequest, metadata?: grpc.Metadata, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<lnd_rpc_pb.Payment>;
    trackPaymentV2(request: lnd_router_pb.TrackPaymentRequest, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<lnd_rpc_pb.Payment>;
    trackPaymentV2(request: lnd_router_pb.TrackPaymentRequest, metadata?: grpc.Metadata, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<lnd_rpc_pb.Payment>;
    estimateRouteFee(request: lnd_router_pb.RouteFeeRequest, callback: (error: grpc.ServiceError | null, response: lnd_router_pb.RouteFeeResponse) => void): grpc.ClientUnaryCall;
    estimateRouteFee(request: lnd_router_pb.RouteFeeRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: lnd_router_pb.RouteFeeResponse) => void): grpc.ClientUnaryCall;
    estimateRouteFee(request: lnd_router_pb.RouteFeeRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: lnd_router_pb.RouteFeeResponse) => void): grpc.ClientUnaryCall;
    sendToRoute(request: lnd_router_pb.SendToRouteRequest, callback: (error: grpc.ServiceError | null, response: lnd_router_pb.SendToRouteResponse) => void): grpc.ClientUnaryCall;
    sendToRoute(request: lnd_router_pb.SendToRouteRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: lnd_router_pb.SendToRouteResponse) => void): grpc.ClientUnaryCall;
    sendToRoute(request: lnd_router_pb.SendToRouteRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: lnd_router_pb.SendToRouteResponse) => void): grpc.ClientUnaryCall;
    sendToRouteV2(request: lnd_router_pb.SendToRouteRequest, callback: (error: grpc.ServiceError | null, response: lnd_rpc_pb.HTLCAttempt) => void): grpc.ClientUnaryCall;
    sendToRouteV2(request: lnd_router_pb.SendToRouteRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: lnd_rpc_pb.HTLCAttempt) => void): grpc.ClientUnaryCall;
    sendToRouteV2(request: lnd_router_pb.SendToRouteRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: lnd_rpc_pb.HTLCAttempt) => void): grpc.ClientUnaryCall;
    resetMissionControl(request: lnd_router_pb.ResetMissionControlRequest, callback: (error: grpc.ServiceError | null, response: lnd_router_pb.ResetMissionControlResponse) => void): grpc.ClientUnaryCall;
    resetMissionControl(request: lnd_router_pb.ResetMissionControlRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: lnd_router_pb.ResetMissionControlResponse) => void): grpc.ClientUnaryCall;
    resetMissionControl(request: lnd_router_pb.ResetMissionControlRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: lnd_router_pb.ResetMissionControlResponse) => void): grpc.ClientUnaryCall;
    queryMissionControl(request: lnd_router_pb.QueryMissionControlRequest, callback: (error: grpc.ServiceError | null, response: lnd_router_pb.QueryMissionControlResponse) => void): grpc.ClientUnaryCall;
    queryMissionControl(request: lnd_router_pb.QueryMissionControlRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: lnd_router_pb.QueryMissionControlResponse) => void): grpc.ClientUnaryCall;
    queryMissionControl(request: lnd_router_pb.QueryMissionControlRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: lnd_router_pb.QueryMissionControlResponse) => void): grpc.ClientUnaryCall;
    xImportMissionControl(request: lnd_router_pb.XImportMissionControlRequest, callback: (error: grpc.ServiceError | null, response: lnd_router_pb.XImportMissionControlResponse) => void): grpc.ClientUnaryCall;
    xImportMissionControl(request: lnd_router_pb.XImportMissionControlRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: lnd_router_pb.XImportMissionControlResponse) => void): grpc.ClientUnaryCall;
    xImportMissionControl(request: lnd_router_pb.XImportMissionControlRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: lnd_router_pb.XImportMissionControlResponse) => void): grpc.ClientUnaryCall;
    getMissionControlConfig(request: lnd_router_pb.GetMissionControlConfigRequest, callback: (error: grpc.ServiceError | null, response: lnd_router_pb.GetMissionControlConfigResponse) => void): grpc.ClientUnaryCall;
    getMissionControlConfig(request: lnd_router_pb.GetMissionControlConfigRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: lnd_router_pb.GetMissionControlConfigResponse) => void): grpc.ClientUnaryCall;
    getMissionControlConfig(request: lnd_router_pb.GetMissionControlConfigRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: lnd_router_pb.GetMissionControlConfigResponse) => void): grpc.ClientUnaryCall;
    setMissionControlConfig(request: lnd_router_pb.SetMissionControlConfigRequest, callback: (error: grpc.ServiceError | null, response: lnd_router_pb.SetMissionControlConfigResponse) => void): grpc.ClientUnaryCall;
    setMissionControlConfig(request: lnd_router_pb.SetMissionControlConfigRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: lnd_router_pb.SetMissionControlConfigResponse) => void): grpc.ClientUnaryCall;
    setMissionControlConfig(request: lnd_router_pb.SetMissionControlConfigRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: lnd_router_pb.SetMissionControlConfigResponse) => void): grpc.ClientUnaryCall;
    queryProbability(request: lnd_router_pb.QueryProbabilityRequest, callback: (error: grpc.ServiceError | null, response: lnd_router_pb.QueryProbabilityResponse) => void): grpc.ClientUnaryCall;
    queryProbability(request: lnd_router_pb.QueryProbabilityRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: lnd_router_pb.QueryProbabilityResponse) => void): grpc.ClientUnaryCall;
    queryProbability(request: lnd_router_pb.QueryProbabilityRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: lnd_router_pb.QueryProbabilityResponse) => void): grpc.ClientUnaryCall;
    buildRoute(request: lnd_router_pb.BuildRouteRequest, callback: (error: grpc.ServiceError | null, response: lnd_router_pb.BuildRouteResponse) => void): grpc.ClientUnaryCall;
    buildRoute(request: lnd_router_pb.BuildRouteRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: lnd_router_pb.BuildRouteResponse) => void): grpc.ClientUnaryCall;
    buildRoute(request: lnd_router_pb.BuildRouteRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: lnd_router_pb.BuildRouteResponse) => void): grpc.ClientUnaryCall;
    subscribeHtlcEvents(request: lnd_router_pb.SubscribeHtlcEventsRequest, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<lnd_router_pb.HtlcEvent>;
    subscribeHtlcEvents(request: lnd_router_pb.SubscribeHtlcEventsRequest, metadata?: grpc.Metadata, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<lnd_router_pb.HtlcEvent>;
    sendPayment(request: lnd_router_pb.SendPaymentRequest, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<lnd_router_pb.PaymentStatus>;
    sendPayment(request: lnd_router_pb.SendPaymentRequest, metadata?: grpc.Metadata, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<lnd_router_pb.PaymentStatus>;
    trackPayment(request: lnd_router_pb.TrackPaymentRequest, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<lnd_router_pb.PaymentStatus>;
    trackPayment(request: lnd_router_pb.TrackPaymentRequest, metadata?: grpc.Metadata, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<lnd_router_pb.PaymentStatus>;
    htlcInterceptor(): grpc.ClientDuplexStream<lnd_router_pb.ForwardHtlcInterceptResponse, lnd_router_pb.ForwardHtlcInterceptRequest>;
    htlcInterceptor(options: Partial<grpc.CallOptions>): grpc.ClientDuplexStream<lnd_router_pb.ForwardHtlcInterceptResponse, lnd_router_pb.ForwardHtlcInterceptRequest>;
    htlcInterceptor(metadata: grpc.Metadata, options?: Partial<grpc.CallOptions>): grpc.ClientDuplexStream<lnd_router_pb.ForwardHtlcInterceptResponse, lnd_router_pb.ForwardHtlcInterceptRequest>;
    updateChanStatus(request: lnd_router_pb.UpdateChanStatusRequest, callback: (error: grpc.ServiceError | null, response: lnd_router_pb.UpdateChanStatusResponse) => void): grpc.ClientUnaryCall;
    updateChanStatus(request: lnd_router_pb.UpdateChanStatusRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: lnd_router_pb.UpdateChanStatusResponse) => void): grpc.ClientUnaryCall;
    updateChanStatus(request: lnd_router_pb.UpdateChanStatusRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: lnd_router_pb.UpdateChanStatusResponse) => void): grpc.ClientUnaryCall;
}

export class RouterClient extends grpc.Client implements IRouterClient {
    constructor(address: string, credentials: grpc.ChannelCredentials, options?: object);
    public sendPaymentV2(request: lnd_router_pb.SendPaymentRequest, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<lnd_rpc_pb.Payment>;
    public sendPaymentV2(request: lnd_router_pb.SendPaymentRequest, metadata?: grpc.Metadata, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<lnd_rpc_pb.Payment>;
    public trackPaymentV2(request: lnd_router_pb.TrackPaymentRequest, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<lnd_rpc_pb.Payment>;
    public trackPaymentV2(request: lnd_router_pb.TrackPaymentRequest, metadata?: grpc.Metadata, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<lnd_rpc_pb.Payment>;
    public estimateRouteFee(request: lnd_router_pb.RouteFeeRequest, callback: (error: grpc.ServiceError | null, response: lnd_router_pb.RouteFeeResponse) => void): grpc.ClientUnaryCall;
    public estimateRouteFee(request: lnd_router_pb.RouteFeeRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: lnd_router_pb.RouteFeeResponse) => void): grpc.ClientUnaryCall;
    public estimateRouteFee(request: lnd_router_pb.RouteFeeRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: lnd_router_pb.RouteFeeResponse) => void): grpc.ClientUnaryCall;
    public sendToRoute(request: lnd_router_pb.SendToRouteRequest, callback: (error: grpc.ServiceError | null, response: lnd_router_pb.SendToRouteResponse) => void): grpc.ClientUnaryCall;
    public sendToRoute(request: lnd_router_pb.SendToRouteRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: lnd_router_pb.SendToRouteResponse) => void): grpc.ClientUnaryCall;
    public sendToRoute(request: lnd_router_pb.SendToRouteRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: lnd_router_pb.SendToRouteResponse) => void): grpc.ClientUnaryCall;
    public sendToRouteV2(request: lnd_router_pb.SendToRouteRequest, callback: (error: grpc.ServiceError | null, response: lnd_rpc_pb.HTLCAttempt) => void): grpc.ClientUnaryCall;
    public sendToRouteV2(request: lnd_router_pb.SendToRouteRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: lnd_rpc_pb.HTLCAttempt) => void): grpc.ClientUnaryCall;
    public sendToRouteV2(request: lnd_router_pb.SendToRouteRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: lnd_rpc_pb.HTLCAttempt) => void): grpc.ClientUnaryCall;
    public resetMissionControl(request: lnd_router_pb.ResetMissionControlRequest, callback: (error: grpc.ServiceError | null, response: lnd_router_pb.ResetMissionControlResponse) => void): grpc.ClientUnaryCall;
    public resetMissionControl(request: lnd_router_pb.ResetMissionControlRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: lnd_router_pb.ResetMissionControlResponse) => void): grpc.ClientUnaryCall;
    public resetMissionControl(request: lnd_router_pb.ResetMissionControlRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: lnd_router_pb.ResetMissionControlResponse) => void): grpc.ClientUnaryCall;
    public queryMissionControl(request: lnd_router_pb.QueryMissionControlRequest, callback: (error: grpc.ServiceError | null, response: lnd_router_pb.QueryMissionControlResponse) => void): grpc.ClientUnaryCall;
    public queryMissionControl(request: lnd_router_pb.QueryMissionControlRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: lnd_router_pb.QueryMissionControlResponse) => void): grpc.ClientUnaryCall;
    public queryMissionControl(request: lnd_router_pb.QueryMissionControlRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: lnd_router_pb.QueryMissionControlResponse) => void): grpc.ClientUnaryCall;
    public xImportMissionControl(request: lnd_router_pb.XImportMissionControlRequest, callback: (error: grpc.ServiceError | null, response: lnd_router_pb.XImportMissionControlResponse) => void): grpc.ClientUnaryCall;
    public xImportMissionControl(request: lnd_router_pb.XImportMissionControlRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: lnd_router_pb.XImportMissionControlResponse) => void): grpc.ClientUnaryCall;
    public xImportMissionControl(request: lnd_router_pb.XImportMissionControlRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: lnd_router_pb.XImportMissionControlResponse) => void): grpc.ClientUnaryCall;
    public getMissionControlConfig(request: lnd_router_pb.GetMissionControlConfigRequest, callback: (error: grpc.ServiceError | null, response: lnd_router_pb.GetMissionControlConfigResponse) => void): grpc.ClientUnaryCall;
    public getMissionControlConfig(request: lnd_router_pb.GetMissionControlConfigRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: lnd_router_pb.GetMissionControlConfigResponse) => void): grpc.ClientUnaryCall;
    public getMissionControlConfig(request: lnd_router_pb.GetMissionControlConfigRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: lnd_router_pb.GetMissionControlConfigResponse) => void): grpc.ClientUnaryCall;
    public setMissionControlConfig(request: lnd_router_pb.SetMissionControlConfigRequest, callback: (error: grpc.ServiceError | null, response: lnd_router_pb.SetMissionControlConfigResponse) => void): grpc.ClientUnaryCall;
    public setMissionControlConfig(request: lnd_router_pb.SetMissionControlConfigRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: lnd_router_pb.SetMissionControlConfigResponse) => void): grpc.ClientUnaryCall;
    public setMissionControlConfig(request: lnd_router_pb.SetMissionControlConfigRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: lnd_router_pb.SetMissionControlConfigResponse) => void): grpc.ClientUnaryCall;
    public queryProbability(request: lnd_router_pb.QueryProbabilityRequest, callback: (error: grpc.ServiceError | null, response: lnd_router_pb.QueryProbabilityResponse) => void): grpc.ClientUnaryCall;
    public queryProbability(request: lnd_router_pb.QueryProbabilityRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: lnd_router_pb.QueryProbabilityResponse) => void): grpc.ClientUnaryCall;
    public queryProbability(request: lnd_router_pb.QueryProbabilityRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: lnd_router_pb.QueryProbabilityResponse) => void): grpc.ClientUnaryCall;
    public buildRoute(request: lnd_router_pb.BuildRouteRequest, callback: (error: grpc.ServiceError | null, response: lnd_router_pb.BuildRouteResponse) => void): grpc.ClientUnaryCall;
    public buildRoute(request: lnd_router_pb.BuildRouteRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: lnd_router_pb.BuildRouteResponse) => void): grpc.ClientUnaryCall;
    public buildRoute(request: lnd_router_pb.BuildRouteRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: lnd_router_pb.BuildRouteResponse) => void): grpc.ClientUnaryCall;
    public subscribeHtlcEvents(request: lnd_router_pb.SubscribeHtlcEventsRequest, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<lnd_router_pb.HtlcEvent>;
    public subscribeHtlcEvents(request: lnd_router_pb.SubscribeHtlcEventsRequest, metadata?: grpc.Metadata, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<lnd_router_pb.HtlcEvent>;
    public sendPayment(request: lnd_router_pb.SendPaymentRequest, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<lnd_router_pb.PaymentStatus>;
    public sendPayment(request: lnd_router_pb.SendPaymentRequest, metadata?: grpc.Metadata, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<lnd_router_pb.PaymentStatus>;
    public trackPayment(request: lnd_router_pb.TrackPaymentRequest, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<lnd_router_pb.PaymentStatus>;
    public trackPayment(request: lnd_router_pb.TrackPaymentRequest, metadata?: grpc.Metadata, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<lnd_router_pb.PaymentStatus>;
    public htlcInterceptor(options?: Partial<grpc.CallOptions>): grpc.ClientDuplexStream<lnd_router_pb.ForwardHtlcInterceptResponse, lnd_router_pb.ForwardHtlcInterceptRequest>;
    public htlcInterceptor(metadata?: grpc.Metadata, options?: Partial<grpc.CallOptions>): grpc.ClientDuplexStream<lnd_router_pb.ForwardHtlcInterceptResponse, lnd_router_pb.ForwardHtlcInterceptRequest>;
    public updateChanStatus(request: lnd_router_pb.UpdateChanStatusRequest, callback: (error: grpc.ServiceError | null, response: lnd_router_pb.UpdateChanStatusResponse) => void): grpc.ClientUnaryCall;
    public updateChanStatus(request: lnd_router_pb.UpdateChanStatusRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: lnd_router_pb.UpdateChanStatusResponse) => void): grpc.ClientUnaryCall;
    public updateChanStatus(request: lnd_router_pb.UpdateChanStatusRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: lnd_router_pb.UpdateChanStatusResponse) => void): grpc.ClientUnaryCall;
}
