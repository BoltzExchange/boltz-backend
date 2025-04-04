// package: fulmine.v1
// file: ark/notification.proto

/* tslint:disable */
/* eslint-disable */

import * as grpc from "@grpc/grpc-js";
import * as ark_notification_pb from "../ark/notification_pb";
import * as ark_types_pb from "../ark/types_pb";

interface INotificationServiceService extends grpc.ServiceDefinition<grpc.UntypedServiceImplementation> {
    subscribeForAddresses: INotificationServiceService_ISubscribeForAddresses;
    unsubscribeForAddresses: INotificationServiceService_IUnsubscribeForAddresses;
    getVtxoNotifications: INotificationServiceService_IGetVtxoNotifications;
    roundNotifications: INotificationServiceService_IRoundNotifications;
    addWebhook: INotificationServiceService_IAddWebhook;
    removeWebhook: INotificationServiceService_IRemoveWebhook;
    listWebhooks: INotificationServiceService_IListWebhooks;
}

interface INotificationServiceService_ISubscribeForAddresses extends grpc.MethodDefinition<ark_notification_pb.SubscribeForAddressesRequest, ark_notification_pb.SubscribeForAddressesResponse> {
    path: "/fulmine.v1.NotificationService/SubscribeForAddresses";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<ark_notification_pb.SubscribeForAddressesRequest>;
    requestDeserialize: grpc.deserialize<ark_notification_pb.SubscribeForAddressesRequest>;
    responseSerialize: grpc.serialize<ark_notification_pb.SubscribeForAddressesResponse>;
    responseDeserialize: grpc.deserialize<ark_notification_pb.SubscribeForAddressesResponse>;
}
interface INotificationServiceService_IUnsubscribeForAddresses extends grpc.MethodDefinition<ark_notification_pb.UnsubscribeForAddressesRequest, ark_notification_pb.UnsubscribeForAddressesResponse> {
    path: "/fulmine.v1.NotificationService/UnsubscribeForAddresses";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<ark_notification_pb.UnsubscribeForAddressesRequest>;
    requestDeserialize: grpc.deserialize<ark_notification_pb.UnsubscribeForAddressesRequest>;
    responseSerialize: grpc.serialize<ark_notification_pb.UnsubscribeForAddressesResponse>;
    responseDeserialize: grpc.deserialize<ark_notification_pb.UnsubscribeForAddressesResponse>;
}
interface INotificationServiceService_IGetVtxoNotifications extends grpc.MethodDefinition<ark_notification_pb.GetVtxoNotificationsRequest, ark_notification_pb.GetVtxoNotificationsResponse> {
    path: "/fulmine.v1.NotificationService/GetVtxoNotifications";
    requestStream: false;
    responseStream: true;
    requestSerialize: grpc.serialize<ark_notification_pb.GetVtxoNotificationsRequest>;
    requestDeserialize: grpc.deserialize<ark_notification_pb.GetVtxoNotificationsRequest>;
    responseSerialize: grpc.serialize<ark_notification_pb.GetVtxoNotificationsResponse>;
    responseDeserialize: grpc.deserialize<ark_notification_pb.GetVtxoNotificationsResponse>;
}
interface INotificationServiceService_IRoundNotifications extends grpc.MethodDefinition<ark_notification_pb.RoundNotificationsRequest, ark_notification_pb.RoundNotificationsResponse> {
    path: "/fulmine.v1.NotificationService/RoundNotifications";
    requestStream: false;
    responseStream: true;
    requestSerialize: grpc.serialize<ark_notification_pb.RoundNotificationsRequest>;
    requestDeserialize: grpc.deserialize<ark_notification_pb.RoundNotificationsRequest>;
    responseSerialize: grpc.serialize<ark_notification_pb.RoundNotificationsResponse>;
    responseDeserialize: grpc.deserialize<ark_notification_pb.RoundNotificationsResponse>;
}
interface INotificationServiceService_IAddWebhook extends grpc.MethodDefinition<ark_notification_pb.AddWebhookRequest, ark_notification_pb.AddWebhookResponse> {
    path: "/fulmine.v1.NotificationService/AddWebhook";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<ark_notification_pb.AddWebhookRequest>;
    requestDeserialize: grpc.deserialize<ark_notification_pb.AddWebhookRequest>;
    responseSerialize: grpc.serialize<ark_notification_pb.AddWebhookResponse>;
    responseDeserialize: grpc.deserialize<ark_notification_pb.AddWebhookResponse>;
}
interface INotificationServiceService_IRemoveWebhook extends grpc.MethodDefinition<ark_notification_pb.RemoveWebhookRequest, ark_notification_pb.RemoveWebhookResponse> {
    path: "/fulmine.v1.NotificationService/RemoveWebhook";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<ark_notification_pb.RemoveWebhookRequest>;
    requestDeserialize: grpc.deserialize<ark_notification_pb.RemoveWebhookRequest>;
    responseSerialize: grpc.serialize<ark_notification_pb.RemoveWebhookResponse>;
    responseDeserialize: grpc.deserialize<ark_notification_pb.RemoveWebhookResponse>;
}
interface INotificationServiceService_IListWebhooks extends grpc.MethodDefinition<ark_notification_pb.ListWebhooksRequest, ark_notification_pb.ListWebhooksResponse> {
    path: "/fulmine.v1.NotificationService/ListWebhooks";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<ark_notification_pb.ListWebhooksRequest>;
    requestDeserialize: grpc.deserialize<ark_notification_pb.ListWebhooksRequest>;
    responseSerialize: grpc.serialize<ark_notification_pb.ListWebhooksResponse>;
    responseDeserialize: grpc.deserialize<ark_notification_pb.ListWebhooksResponse>;
}

export const NotificationServiceService: INotificationServiceService;

export interface INotificationServiceServer extends grpc.UntypedServiceImplementation {
    subscribeForAddresses: grpc.handleUnaryCall<ark_notification_pb.SubscribeForAddressesRequest, ark_notification_pb.SubscribeForAddressesResponse>;
    unsubscribeForAddresses: grpc.handleUnaryCall<ark_notification_pb.UnsubscribeForAddressesRequest, ark_notification_pb.UnsubscribeForAddressesResponse>;
    getVtxoNotifications: grpc.handleServerStreamingCall<ark_notification_pb.GetVtxoNotificationsRequest, ark_notification_pb.GetVtxoNotificationsResponse>;
    roundNotifications: grpc.handleServerStreamingCall<ark_notification_pb.RoundNotificationsRequest, ark_notification_pb.RoundNotificationsResponse>;
    addWebhook: grpc.handleUnaryCall<ark_notification_pb.AddWebhookRequest, ark_notification_pb.AddWebhookResponse>;
    removeWebhook: grpc.handleUnaryCall<ark_notification_pb.RemoveWebhookRequest, ark_notification_pb.RemoveWebhookResponse>;
    listWebhooks: grpc.handleUnaryCall<ark_notification_pb.ListWebhooksRequest, ark_notification_pb.ListWebhooksResponse>;
}

export interface INotificationServiceClient {
    subscribeForAddresses(request: ark_notification_pb.SubscribeForAddressesRequest, callback: (error: grpc.ServiceError | null, response: ark_notification_pb.SubscribeForAddressesResponse) => void): grpc.ClientUnaryCall;
    subscribeForAddresses(request: ark_notification_pb.SubscribeForAddressesRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: ark_notification_pb.SubscribeForAddressesResponse) => void): grpc.ClientUnaryCall;
    subscribeForAddresses(request: ark_notification_pb.SubscribeForAddressesRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: ark_notification_pb.SubscribeForAddressesResponse) => void): grpc.ClientUnaryCall;
    unsubscribeForAddresses(request: ark_notification_pb.UnsubscribeForAddressesRequest, callback: (error: grpc.ServiceError | null, response: ark_notification_pb.UnsubscribeForAddressesResponse) => void): grpc.ClientUnaryCall;
    unsubscribeForAddresses(request: ark_notification_pb.UnsubscribeForAddressesRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: ark_notification_pb.UnsubscribeForAddressesResponse) => void): grpc.ClientUnaryCall;
    unsubscribeForAddresses(request: ark_notification_pb.UnsubscribeForAddressesRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: ark_notification_pb.UnsubscribeForAddressesResponse) => void): grpc.ClientUnaryCall;
    getVtxoNotifications(request: ark_notification_pb.GetVtxoNotificationsRequest, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<ark_notification_pb.GetVtxoNotificationsResponse>;
    getVtxoNotifications(request: ark_notification_pb.GetVtxoNotificationsRequest, metadata?: grpc.Metadata, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<ark_notification_pb.GetVtxoNotificationsResponse>;
    roundNotifications(request: ark_notification_pb.RoundNotificationsRequest, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<ark_notification_pb.RoundNotificationsResponse>;
    roundNotifications(request: ark_notification_pb.RoundNotificationsRequest, metadata?: grpc.Metadata, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<ark_notification_pb.RoundNotificationsResponse>;
    addWebhook(request: ark_notification_pb.AddWebhookRequest, callback: (error: grpc.ServiceError | null, response: ark_notification_pb.AddWebhookResponse) => void): grpc.ClientUnaryCall;
    addWebhook(request: ark_notification_pb.AddWebhookRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: ark_notification_pb.AddWebhookResponse) => void): grpc.ClientUnaryCall;
    addWebhook(request: ark_notification_pb.AddWebhookRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: ark_notification_pb.AddWebhookResponse) => void): grpc.ClientUnaryCall;
    removeWebhook(request: ark_notification_pb.RemoveWebhookRequest, callback: (error: grpc.ServiceError | null, response: ark_notification_pb.RemoveWebhookResponse) => void): grpc.ClientUnaryCall;
    removeWebhook(request: ark_notification_pb.RemoveWebhookRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: ark_notification_pb.RemoveWebhookResponse) => void): grpc.ClientUnaryCall;
    removeWebhook(request: ark_notification_pb.RemoveWebhookRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: ark_notification_pb.RemoveWebhookResponse) => void): grpc.ClientUnaryCall;
    listWebhooks(request: ark_notification_pb.ListWebhooksRequest, callback: (error: grpc.ServiceError | null, response: ark_notification_pb.ListWebhooksResponse) => void): grpc.ClientUnaryCall;
    listWebhooks(request: ark_notification_pb.ListWebhooksRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: ark_notification_pb.ListWebhooksResponse) => void): grpc.ClientUnaryCall;
    listWebhooks(request: ark_notification_pb.ListWebhooksRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: ark_notification_pb.ListWebhooksResponse) => void): grpc.ClientUnaryCall;
}

export class NotificationServiceClient extends grpc.Client implements INotificationServiceClient {
    constructor(address: string, credentials: grpc.ChannelCredentials, options?: Partial<grpc.ClientOptions>);
    public subscribeForAddresses(request: ark_notification_pb.SubscribeForAddressesRequest, callback: (error: grpc.ServiceError | null, response: ark_notification_pb.SubscribeForAddressesResponse) => void): grpc.ClientUnaryCall;
    public subscribeForAddresses(request: ark_notification_pb.SubscribeForAddressesRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: ark_notification_pb.SubscribeForAddressesResponse) => void): grpc.ClientUnaryCall;
    public subscribeForAddresses(request: ark_notification_pb.SubscribeForAddressesRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: ark_notification_pb.SubscribeForAddressesResponse) => void): grpc.ClientUnaryCall;
    public unsubscribeForAddresses(request: ark_notification_pb.UnsubscribeForAddressesRequest, callback: (error: grpc.ServiceError | null, response: ark_notification_pb.UnsubscribeForAddressesResponse) => void): grpc.ClientUnaryCall;
    public unsubscribeForAddresses(request: ark_notification_pb.UnsubscribeForAddressesRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: ark_notification_pb.UnsubscribeForAddressesResponse) => void): grpc.ClientUnaryCall;
    public unsubscribeForAddresses(request: ark_notification_pb.UnsubscribeForAddressesRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: ark_notification_pb.UnsubscribeForAddressesResponse) => void): grpc.ClientUnaryCall;
    public getVtxoNotifications(request: ark_notification_pb.GetVtxoNotificationsRequest, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<ark_notification_pb.GetVtxoNotificationsResponse>;
    public getVtxoNotifications(request: ark_notification_pb.GetVtxoNotificationsRequest, metadata?: grpc.Metadata, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<ark_notification_pb.GetVtxoNotificationsResponse>;
    public roundNotifications(request: ark_notification_pb.RoundNotificationsRequest, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<ark_notification_pb.RoundNotificationsResponse>;
    public roundNotifications(request: ark_notification_pb.RoundNotificationsRequest, metadata?: grpc.Metadata, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<ark_notification_pb.RoundNotificationsResponse>;
    public addWebhook(request: ark_notification_pb.AddWebhookRequest, callback: (error: grpc.ServiceError | null, response: ark_notification_pb.AddWebhookResponse) => void): grpc.ClientUnaryCall;
    public addWebhook(request: ark_notification_pb.AddWebhookRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: ark_notification_pb.AddWebhookResponse) => void): grpc.ClientUnaryCall;
    public addWebhook(request: ark_notification_pb.AddWebhookRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: ark_notification_pb.AddWebhookResponse) => void): grpc.ClientUnaryCall;
    public removeWebhook(request: ark_notification_pb.RemoveWebhookRequest, callback: (error: grpc.ServiceError | null, response: ark_notification_pb.RemoveWebhookResponse) => void): grpc.ClientUnaryCall;
    public removeWebhook(request: ark_notification_pb.RemoveWebhookRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: ark_notification_pb.RemoveWebhookResponse) => void): grpc.ClientUnaryCall;
    public removeWebhook(request: ark_notification_pb.RemoveWebhookRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: ark_notification_pb.RemoveWebhookResponse) => void): grpc.ClientUnaryCall;
    public listWebhooks(request: ark_notification_pb.ListWebhooksRequest, callback: (error: grpc.ServiceError | null, response: ark_notification_pb.ListWebhooksResponse) => void): grpc.ClientUnaryCall;
    public listWebhooks(request: ark_notification_pb.ListWebhooksRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: ark_notification_pb.ListWebhooksResponse) => void): grpc.ClientUnaryCall;
    public listWebhooks(request: ark_notification_pb.ListWebhooksRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: ark_notification_pb.ListWebhooksResponse) => void): grpc.ClientUnaryCall;
}
