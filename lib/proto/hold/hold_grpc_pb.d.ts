// package: hold
// file: hold.proto

/* tslint:disable */
/* eslint-disable */

import * as grpc from '@grpc/grpc-js';
import * as hold_pb from './hold_pb';

interface IHoldService
  extends grpc.ServiceDefinition<grpc.UntypedServiceImplementation> {
  getInfo: IHoldService_IGetInfo;
  invoice: IHoldService_IInvoice;
  routingHints: IHoldService_IRoutingHints;
  list: IHoldService_IList;
  settle: IHoldService_ISettle;
  cancel: IHoldService_ICancel;
  track: IHoldService_ITrack;
  trackAll: IHoldService_ITrackAll;
  payStatus: IHoldService_IPayStatus;
  getRoute: IHoldService_IGetRoute;
}

interface IHoldService_IGetInfo
  extends grpc.MethodDefinition<
    hold_pb.GetInfoRequest,
    hold_pb.GetInfoResponse
  > {
  path: '/hold.Hold/GetInfo';
  requestStream: false;
  responseStream: false;
  requestSerialize: grpc.serialize<hold_pb.GetInfoRequest>;
  requestDeserialize: grpc.deserialize<hold_pb.GetInfoRequest>;
  responseSerialize: grpc.serialize<hold_pb.GetInfoResponse>;
  responseDeserialize: grpc.deserialize<hold_pb.GetInfoResponse>;
}
interface IHoldService_IInvoice
  extends grpc.MethodDefinition<
    hold_pb.InvoiceRequest,
    hold_pb.InvoiceResponse
  > {
  path: '/hold.Hold/Invoice';
  requestStream: false;
  responseStream: false;
  requestSerialize: grpc.serialize<hold_pb.InvoiceRequest>;
  requestDeserialize: grpc.deserialize<hold_pb.InvoiceRequest>;
  responseSerialize: grpc.serialize<hold_pb.InvoiceResponse>;
  responseDeserialize: grpc.deserialize<hold_pb.InvoiceResponse>;
}
interface IHoldService_IRoutingHints
  extends grpc.MethodDefinition<
    hold_pb.RoutingHintsRequest,
    hold_pb.RoutingHintsResponse
  > {
  path: '/hold.Hold/RoutingHints';
  requestStream: false;
  responseStream: false;
  requestSerialize: grpc.serialize<hold_pb.RoutingHintsRequest>;
  requestDeserialize: grpc.deserialize<hold_pb.RoutingHintsRequest>;
  responseSerialize: grpc.serialize<hold_pb.RoutingHintsResponse>;
  responseDeserialize: grpc.deserialize<hold_pb.RoutingHintsResponse>;
}
interface IHoldService_IList
  extends grpc.MethodDefinition<hold_pb.ListRequest, hold_pb.ListResponse> {
  path: '/hold.Hold/List';
  requestStream: false;
  responseStream: false;
  requestSerialize: grpc.serialize<hold_pb.ListRequest>;
  requestDeserialize: grpc.deserialize<hold_pb.ListRequest>;
  responseSerialize: grpc.serialize<hold_pb.ListResponse>;
  responseDeserialize: grpc.deserialize<hold_pb.ListResponse>;
}
interface IHoldService_ISettle
  extends grpc.MethodDefinition<hold_pb.SettleRequest, hold_pb.SettleResponse> {
  path: '/hold.Hold/Settle';
  requestStream: false;
  responseStream: false;
  requestSerialize: grpc.serialize<hold_pb.SettleRequest>;
  requestDeserialize: grpc.deserialize<hold_pb.SettleRequest>;
  responseSerialize: grpc.serialize<hold_pb.SettleResponse>;
  responseDeserialize: grpc.deserialize<hold_pb.SettleResponse>;
}
interface IHoldService_ICancel
  extends grpc.MethodDefinition<hold_pb.CancelRequest, hold_pb.CancelResponse> {
  path: '/hold.Hold/Cancel';
  requestStream: false;
  responseStream: false;
  requestSerialize: grpc.serialize<hold_pb.CancelRequest>;
  requestDeserialize: grpc.deserialize<hold_pb.CancelRequest>;
  responseSerialize: grpc.serialize<hold_pb.CancelResponse>;
  responseDeserialize: grpc.deserialize<hold_pb.CancelResponse>;
}
interface IHoldService_ITrack
  extends grpc.MethodDefinition<hold_pb.TrackRequest, hold_pb.TrackResponse> {
  path: '/hold.Hold/Track';
  requestStream: false;
  responseStream: true;
  requestSerialize: grpc.serialize<hold_pb.TrackRequest>;
  requestDeserialize: grpc.deserialize<hold_pb.TrackRequest>;
  responseSerialize: grpc.serialize<hold_pb.TrackResponse>;
  responseDeserialize: grpc.deserialize<hold_pb.TrackResponse>;
}
interface IHoldService_ITrackAll
  extends grpc.MethodDefinition<
    hold_pb.TrackAllRequest,
    hold_pb.TrackAllResponse
  > {
  path: '/hold.Hold/TrackAll';
  requestStream: false;
  responseStream: true;
  requestSerialize: grpc.serialize<hold_pb.TrackAllRequest>;
  requestDeserialize: grpc.deserialize<hold_pb.TrackAllRequest>;
  responseSerialize: grpc.serialize<hold_pb.TrackAllResponse>;
  responseDeserialize: grpc.deserialize<hold_pb.TrackAllResponse>;
}
interface IHoldService_IPayStatus
  extends grpc.MethodDefinition<
    hold_pb.PayStatusRequest,
    hold_pb.PayStatusResponse
  > {
  path: '/hold.Hold/PayStatus';
  requestStream: false;
  responseStream: false;
  requestSerialize: grpc.serialize<hold_pb.PayStatusRequest>;
  requestDeserialize: grpc.deserialize<hold_pb.PayStatusRequest>;
  responseSerialize: grpc.serialize<hold_pb.PayStatusResponse>;
  responseDeserialize: grpc.deserialize<hold_pb.PayStatusResponse>;
}
interface IHoldService_IGetRoute
  extends grpc.MethodDefinition<
    hold_pb.GetRouteRequest,
    hold_pb.GetRouteResponse
  > {
  path: '/hold.Hold/GetRoute';
  requestStream: false;
  responseStream: false;
  requestSerialize: grpc.serialize<hold_pb.GetRouteRequest>;
  requestDeserialize: grpc.deserialize<hold_pb.GetRouteRequest>;
  responseSerialize: grpc.serialize<hold_pb.GetRouteResponse>;
  responseDeserialize: grpc.deserialize<hold_pb.GetRouteResponse>;
}

export const HoldService: IHoldService;

export interface IHoldServer extends grpc.UntypedServiceImplementation {
  getInfo: grpc.handleUnaryCall<
    hold_pb.GetInfoRequest,
    hold_pb.GetInfoResponse
  >;
  invoice: grpc.handleUnaryCall<
    hold_pb.InvoiceRequest,
    hold_pb.InvoiceResponse
  >;
  routingHints: grpc.handleUnaryCall<
    hold_pb.RoutingHintsRequest,
    hold_pb.RoutingHintsResponse
  >;
  list: grpc.handleUnaryCall<hold_pb.ListRequest, hold_pb.ListResponse>;
  settle: grpc.handleUnaryCall<hold_pb.SettleRequest, hold_pb.SettleResponse>;
  cancel: grpc.handleUnaryCall<hold_pb.CancelRequest, hold_pb.CancelResponse>;
  track: grpc.handleServerStreamingCall<
    hold_pb.TrackRequest,
    hold_pb.TrackResponse
  >;
  trackAll: grpc.handleServerStreamingCall<
    hold_pb.TrackAllRequest,
    hold_pb.TrackAllResponse
  >;
  payStatus: grpc.handleUnaryCall<
    hold_pb.PayStatusRequest,
    hold_pb.PayStatusResponse
  >;
  getRoute: grpc.handleUnaryCall<
    hold_pb.GetRouteRequest,
    hold_pb.GetRouteResponse
  >;
}

export interface IHoldClient {
  getInfo(
    request: hold_pb.GetInfoRequest,
    callback: (
      error: grpc.ServiceError | null,
      response: hold_pb.GetInfoResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  getInfo(
    request: hold_pb.GetInfoRequest,
    metadata: grpc.Metadata,
    callback: (
      error: grpc.ServiceError | null,
      response: hold_pb.GetInfoResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  getInfo(
    request: hold_pb.GetInfoRequest,
    metadata: grpc.Metadata,
    options: Partial<grpc.CallOptions>,
    callback: (
      error: grpc.ServiceError | null,
      response: hold_pb.GetInfoResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  invoice(
    request: hold_pb.InvoiceRequest,
    callback: (
      error: grpc.ServiceError | null,
      response: hold_pb.InvoiceResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  invoice(
    request: hold_pb.InvoiceRequest,
    metadata: grpc.Metadata,
    callback: (
      error: grpc.ServiceError | null,
      response: hold_pb.InvoiceResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  invoice(
    request: hold_pb.InvoiceRequest,
    metadata: grpc.Metadata,
    options: Partial<grpc.CallOptions>,
    callback: (
      error: grpc.ServiceError | null,
      response: hold_pb.InvoiceResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  routingHints(
    request: hold_pb.RoutingHintsRequest,
    callback: (
      error: grpc.ServiceError | null,
      response: hold_pb.RoutingHintsResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  routingHints(
    request: hold_pb.RoutingHintsRequest,
    metadata: grpc.Metadata,
    callback: (
      error: grpc.ServiceError | null,
      response: hold_pb.RoutingHintsResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  routingHints(
    request: hold_pb.RoutingHintsRequest,
    metadata: grpc.Metadata,
    options: Partial<grpc.CallOptions>,
    callback: (
      error: grpc.ServiceError | null,
      response: hold_pb.RoutingHintsResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  list(
    request: hold_pb.ListRequest,
    callback: (
      error: grpc.ServiceError | null,
      response: hold_pb.ListResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  list(
    request: hold_pb.ListRequest,
    metadata: grpc.Metadata,
    callback: (
      error: grpc.ServiceError | null,
      response: hold_pb.ListResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  list(
    request: hold_pb.ListRequest,
    metadata: grpc.Metadata,
    options: Partial<grpc.CallOptions>,
    callback: (
      error: grpc.ServiceError | null,
      response: hold_pb.ListResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  settle(
    request: hold_pb.SettleRequest,
    callback: (
      error: grpc.ServiceError | null,
      response: hold_pb.SettleResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  settle(
    request: hold_pb.SettleRequest,
    metadata: grpc.Metadata,
    callback: (
      error: grpc.ServiceError | null,
      response: hold_pb.SettleResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  settle(
    request: hold_pb.SettleRequest,
    metadata: grpc.Metadata,
    options: Partial<grpc.CallOptions>,
    callback: (
      error: grpc.ServiceError | null,
      response: hold_pb.SettleResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  cancel(
    request: hold_pb.CancelRequest,
    callback: (
      error: grpc.ServiceError | null,
      response: hold_pb.CancelResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  cancel(
    request: hold_pb.CancelRequest,
    metadata: grpc.Metadata,
    callback: (
      error: grpc.ServiceError | null,
      response: hold_pb.CancelResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  cancel(
    request: hold_pb.CancelRequest,
    metadata: grpc.Metadata,
    options: Partial<grpc.CallOptions>,
    callback: (
      error: grpc.ServiceError | null,
      response: hold_pb.CancelResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  track(
    request: hold_pb.TrackRequest,
    options?: Partial<grpc.CallOptions>,
  ): grpc.ClientReadableStream<hold_pb.TrackResponse>;
  track(
    request: hold_pb.TrackRequest,
    metadata?: grpc.Metadata,
    options?: Partial<grpc.CallOptions>,
  ): grpc.ClientReadableStream<hold_pb.TrackResponse>;
  trackAll(
    request: hold_pb.TrackAllRequest,
    options?: Partial<grpc.CallOptions>,
  ): grpc.ClientReadableStream<hold_pb.TrackAllResponse>;
  trackAll(
    request: hold_pb.TrackAllRequest,
    metadata?: grpc.Metadata,
    options?: Partial<grpc.CallOptions>,
  ): grpc.ClientReadableStream<hold_pb.TrackAllResponse>;
  payStatus(
    request: hold_pb.PayStatusRequest,
    callback: (
      error: grpc.ServiceError | null,
      response: hold_pb.PayStatusResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  payStatus(
    request: hold_pb.PayStatusRequest,
    metadata: grpc.Metadata,
    callback: (
      error: grpc.ServiceError | null,
      response: hold_pb.PayStatusResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  payStatus(
    request: hold_pb.PayStatusRequest,
    metadata: grpc.Metadata,
    options: Partial<grpc.CallOptions>,
    callback: (
      error: grpc.ServiceError | null,
      response: hold_pb.PayStatusResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  getRoute(
    request: hold_pb.GetRouteRequest,
    callback: (
      error: grpc.ServiceError | null,
      response: hold_pb.GetRouteResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  getRoute(
    request: hold_pb.GetRouteRequest,
    metadata: grpc.Metadata,
    callback: (
      error: grpc.ServiceError | null,
      response: hold_pb.GetRouteResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  getRoute(
    request: hold_pb.GetRouteRequest,
    metadata: grpc.Metadata,
    options: Partial<grpc.CallOptions>,
    callback: (
      error: grpc.ServiceError | null,
      response: hold_pb.GetRouteResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
}

export class HoldClient extends grpc.Client implements IHoldClient {
  constructor(
    address: string,
    credentials: grpc.ChannelCredentials,
    options?: Partial<grpc.ClientOptions>,
  );
  public getInfo(
    request: hold_pb.GetInfoRequest,
    callback: (
      error: grpc.ServiceError | null,
      response: hold_pb.GetInfoResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  public getInfo(
    request: hold_pb.GetInfoRequest,
    metadata: grpc.Metadata,
    callback: (
      error: grpc.ServiceError | null,
      response: hold_pb.GetInfoResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  public getInfo(
    request: hold_pb.GetInfoRequest,
    metadata: grpc.Metadata,
    options: Partial<grpc.CallOptions>,
    callback: (
      error: grpc.ServiceError | null,
      response: hold_pb.GetInfoResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  public invoice(
    request: hold_pb.InvoiceRequest,
    callback: (
      error: grpc.ServiceError | null,
      response: hold_pb.InvoiceResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  public invoice(
    request: hold_pb.InvoiceRequest,
    metadata: grpc.Metadata,
    callback: (
      error: grpc.ServiceError | null,
      response: hold_pb.InvoiceResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  public invoice(
    request: hold_pb.InvoiceRequest,
    metadata: grpc.Metadata,
    options: Partial<grpc.CallOptions>,
    callback: (
      error: grpc.ServiceError | null,
      response: hold_pb.InvoiceResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  public routingHints(
    request: hold_pb.RoutingHintsRequest,
    callback: (
      error: grpc.ServiceError | null,
      response: hold_pb.RoutingHintsResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  public routingHints(
    request: hold_pb.RoutingHintsRequest,
    metadata: grpc.Metadata,
    callback: (
      error: grpc.ServiceError | null,
      response: hold_pb.RoutingHintsResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  public routingHints(
    request: hold_pb.RoutingHintsRequest,
    metadata: grpc.Metadata,
    options: Partial<grpc.CallOptions>,
    callback: (
      error: grpc.ServiceError | null,
      response: hold_pb.RoutingHintsResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  public list(
    request: hold_pb.ListRequest,
    callback: (
      error: grpc.ServiceError | null,
      response: hold_pb.ListResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  public list(
    request: hold_pb.ListRequest,
    metadata: grpc.Metadata,
    callback: (
      error: grpc.ServiceError | null,
      response: hold_pb.ListResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  public list(
    request: hold_pb.ListRequest,
    metadata: grpc.Metadata,
    options: Partial<grpc.CallOptions>,
    callback: (
      error: grpc.ServiceError | null,
      response: hold_pb.ListResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  public settle(
    request: hold_pb.SettleRequest,
    callback: (
      error: grpc.ServiceError | null,
      response: hold_pb.SettleResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  public settle(
    request: hold_pb.SettleRequest,
    metadata: grpc.Metadata,
    callback: (
      error: grpc.ServiceError | null,
      response: hold_pb.SettleResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  public settle(
    request: hold_pb.SettleRequest,
    metadata: grpc.Metadata,
    options: Partial<grpc.CallOptions>,
    callback: (
      error: grpc.ServiceError | null,
      response: hold_pb.SettleResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  public cancel(
    request: hold_pb.CancelRequest,
    callback: (
      error: grpc.ServiceError | null,
      response: hold_pb.CancelResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  public cancel(
    request: hold_pb.CancelRequest,
    metadata: grpc.Metadata,
    callback: (
      error: grpc.ServiceError | null,
      response: hold_pb.CancelResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  public cancel(
    request: hold_pb.CancelRequest,
    metadata: grpc.Metadata,
    options: Partial<grpc.CallOptions>,
    callback: (
      error: grpc.ServiceError | null,
      response: hold_pb.CancelResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  public track(
    request: hold_pb.TrackRequest,
    options?: Partial<grpc.CallOptions>,
  ): grpc.ClientReadableStream<hold_pb.TrackResponse>;
  public track(
    request: hold_pb.TrackRequest,
    metadata?: grpc.Metadata,
    options?: Partial<grpc.CallOptions>,
  ): grpc.ClientReadableStream<hold_pb.TrackResponse>;
  public trackAll(
    request: hold_pb.TrackAllRequest,
    options?: Partial<grpc.CallOptions>,
  ): grpc.ClientReadableStream<hold_pb.TrackAllResponse>;
  public trackAll(
    request: hold_pb.TrackAllRequest,
    metadata?: grpc.Metadata,
    options?: Partial<grpc.CallOptions>,
  ): grpc.ClientReadableStream<hold_pb.TrackAllResponse>;
  public payStatus(
    request: hold_pb.PayStatusRequest,
    callback: (
      error: grpc.ServiceError | null,
      response: hold_pb.PayStatusResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  public payStatus(
    request: hold_pb.PayStatusRequest,
    metadata: grpc.Metadata,
    callback: (
      error: grpc.ServiceError | null,
      response: hold_pb.PayStatusResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  public payStatus(
    request: hold_pb.PayStatusRequest,
    metadata: grpc.Metadata,
    options: Partial<grpc.CallOptions>,
    callback: (
      error: grpc.ServiceError | null,
      response: hold_pb.PayStatusResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  public getRoute(
    request: hold_pb.GetRouteRequest,
    callback: (
      error: grpc.ServiceError | null,
      response: hold_pb.GetRouteResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  public getRoute(
    request: hold_pb.GetRouteRequest,
    metadata: grpc.Metadata,
    callback: (
      error: grpc.ServiceError | null,
      response: hold_pb.GetRouteResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  public getRoute(
    request: hold_pb.GetRouteRequest,
    metadata: grpc.Metadata,
    options: Partial<grpc.CallOptions>,
    callback: (
      error: grpc.ServiceError | null,
      response: hold_pb.GetRouteResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
}
