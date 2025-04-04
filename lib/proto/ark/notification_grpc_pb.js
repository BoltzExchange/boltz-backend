// GENERATED CODE -- DO NOT EDIT!

'use strict';
var grpc = require('@grpc/grpc-js');
var ark_notification_pb = require('../ark/notification_pb.js');
var ark_types_pb = require('../ark/types_pb.js');
var google_api_annotations_pb = require('../google/api/annotations_pb.js');

function serialize_fulmine_v1_AddWebhookRequest(arg) {
  if (!(arg instanceof ark_notification_pb.AddWebhookRequest)) {
    throw new Error('Expected argument of type fulmine.v1.AddWebhookRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fulmine_v1_AddWebhookRequest(buffer_arg) {
  return ark_notification_pb.AddWebhookRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fulmine_v1_AddWebhookResponse(arg) {
  if (!(arg instanceof ark_notification_pb.AddWebhookResponse)) {
    throw new Error('Expected argument of type fulmine.v1.AddWebhookResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fulmine_v1_AddWebhookResponse(buffer_arg) {
  return ark_notification_pb.AddWebhookResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fulmine_v1_GetVtxoNotificationsRequest(arg) {
  if (!(arg instanceof ark_notification_pb.GetVtxoNotificationsRequest)) {
    throw new Error('Expected argument of type fulmine.v1.GetVtxoNotificationsRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fulmine_v1_GetVtxoNotificationsRequest(buffer_arg) {
  return ark_notification_pb.GetVtxoNotificationsRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fulmine_v1_GetVtxoNotificationsResponse(arg) {
  if (!(arg instanceof ark_notification_pb.GetVtxoNotificationsResponse)) {
    throw new Error('Expected argument of type fulmine.v1.GetVtxoNotificationsResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fulmine_v1_GetVtxoNotificationsResponse(buffer_arg) {
  return ark_notification_pb.GetVtxoNotificationsResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fulmine_v1_ListWebhooksRequest(arg) {
  if (!(arg instanceof ark_notification_pb.ListWebhooksRequest)) {
    throw new Error('Expected argument of type fulmine.v1.ListWebhooksRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fulmine_v1_ListWebhooksRequest(buffer_arg) {
  return ark_notification_pb.ListWebhooksRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fulmine_v1_ListWebhooksResponse(arg) {
  if (!(arg instanceof ark_notification_pb.ListWebhooksResponse)) {
    throw new Error('Expected argument of type fulmine.v1.ListWebhooksResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fulmine_v1_ListWebhooksResponse(buffer_arg) {
  return ark_notification_pb.ListWebhooksResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fulmine_v1_RemoveWebhookRequest(arg) {
  if (!(arg instanceof ark_notification_pb.RemoveWebhookRequest)) {
    throw new Error('Expected argument of type fulmine.v1.RemoveWebhookRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fulmine_v1_RemoveWebhookRequest(buffer_arg) {
  return ark_notification_pb.RemoveWebhookRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fulmine_v1_RemoveWebhookResponse(arg) {
  if (!(arg instanceof ark_notification_pb.RemoveWebhookResponse)) {
    throw new Error('Expected argument of type fulmine.v1.RemoveWebhookResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fulmine_v1_RemoveWebhookResponse(buffer_arg) {
  return ark_notification_pb.RemoveWebhookResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fulmine_v1_RoundNotificationsRequest(arg) {
  if (!(arg instanceof ark_notification_pb.RoundNotificationsRequest)) {
    throw new Error('Expected argument of type fulmine.v1.RoundNotificationsRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fulmine_v1_RoundNotificationsRequest(buffer_arg) {
  return ark_notification_pb.RoundNotificationsRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fulmine_v1_RoundNotificationsResponse(arg) {
  if (!(arg instanceof ark_notification_pb.RoundNotificationsResponse)) {
    throw new Error('Expected argument of type fulmine.v1.RoundNotificationsResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fulmine_v1_RoundNotificationsResponse(buffer_arg) {
  return ark_notification_pb.RoundNotificationsResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fulmine_v1_SubscribeForAddressesRequest(arg) {
  if (!(arg instanceof ark_notification_pb.SubscribeForAddressesRequest)) {
    throw new Error('Expected argument of type fulmine.v1.SubscribeForAddressesRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fulmine_v1_SubscribeForAddressesRequest(buffer_arg) {
  return ark_notification_pb.SubscribeForAddressesRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fulmine_v1_SubscribeForAddressesResponse(arg) {
  if (!(arg instanceof ark_notification_pb.SubscribeForAddressesResponse)) {
    throw new Error('Expected argument of type fulmine.v1.SubscribeForAddressesResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fulmine_v1_SubscribeForAddressesResponse(buffer_arg) {
  return ark_notification_pb.SubscribeForAddressesResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fulmine_v1_UnsubscribeForAddressesRequest(arg) {
  if (!(arg instanceof ark_notification_pb.UnsubscribeForAddressesRequest)) {
    throw new Error('Expected argument of type fulmine.v1.UnsubscribeForAddressesRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fulmine_v1_UnsubscribeForAddressesRequest(buffer_arg) {
  return ark_notification_pb.UnsubscribeForAddressesRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fulmine_v1_UnsubscribeForAddressesResponse(arg) {
  if (!(arg instanceof ark_notification_pb.UnsubscribeForAddressesResponse)) {
    throw new Error('Expected argument of type fulmine.v1.UnsubscribeForAddressesResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fulmine_v1_UnsubscribeForAddressesResponse(buffer_arg) {
  return ark_notification_pb.UnsubscribeForAddressesResponse.deserializeBinary(new Uint8Array(buffer_arg));
}


// NotificationService is used to get notification about wallet events.
// It offers 2 way of getting notified about events: with the help of grpc 
// server-side stream or by subscribing webhooks invoked whenever an event 
// occurs.
var NotificationServiceService = exports.NotificationServiceService = {
  // SubscribeForAddresses subscribes for notifications for given addresses
subscribeForAddresses: {
    path: '/fulmine.v1.NotificationService/SubscribeForAddresses',
    requestStream: false,
    responseStream: false,
    requestType: ark_notification_pb.SubscribeForAddressesRequest,
    responseType: ark_notification_pb.SubscribeForAddressesResponse,
    requestSerialize: serialize_fulmine_v1_SubscribeForAddressesRequest,
    requestDeserialize: deserialize_fulmine_v1_SubscribeForAddressesRequest,
    responseSerialize: serialize_fulmine_v1_SubscribeForAddressesResponse,
    responseDeserialize: deserialize_fulmine_v1_SubscribeForAddressesResponse,
  },
  // UnsubscribeForAddresses unsubscribes from notifications for given addresses
unsubscribeForAddresses: {
    path: '/fulmine.v1.NotificationService/UnsubscribeForAddresses',
    requestStream: false,
    responseStream: false,
    requestType: ark_notification_pb.UnsubscribeForAddressesRequest,
    responseType: ark_notification_pb.UnsubscribeForAddressesResponse,
    requestSerialize: serialize_fulmine_v1_UnsubscribeForAddressesRequest,
    requestDeserialize: deserialize_fulmine_v1_UnsubscribeForAddressesRequest,
    responseSerialize: serialize_fulmine_v1_UnsubscribeForAddressesResponse,
    responseDeserialize: deserialize_fulmine_v1_UnsubscribeForAddressesResponse,
  },
  // GetVtxoNotifications streams notifications for subscribed addresses
getVtxoNotifications: {
    path: '/fulmine.v1.NotificationService/GetVtxoNotifications',
    requestStream: false,
    responseStream: true,
    requestType: ark_notification_pb.GetVtxoNotificationsRequest,
    responseType: ark_notification_pb.GetVtxoNotificationsResponse,
    requestSerialize: serialize_fulmine_v1_GetVtxoNotificationsRequest,
    requestDeserialize: deserialize_fulmine_v1_GetVtxoNotificationsRequest,
    responseSerialize: serialize_fulmine_v1_GetVtxoNotificationsResponse,
    responseDeserialize: deserialize_fulmine_v1_GetVtxoNotificationsResponse,
  },
  // **************//
//   STREAMS    //
// **************//
//
// Notifies about events related to wallet transactions.
roundNotifications: {
    path: '/fulmine.v1.NotificationService/RoundNotifications',
    requestStream: false,
    responseStream: true,
    requestType: ark_notification_pb.RoundNotificationsRequest,
    responseType: ark_notification_pb.RoundNotificationsResponse,
    requestSerialize: serialize_fulmine_v1_RoundNotificationsRequest,
    requestDeserialize: deserialize_fulmine_v1_RoundNotificationsRequest,
    responseSerialize: serialize_fulmine_v1_RoundNotificationsResponse,
    responseDeserialize: deserialize_fulmine_v1_RoundNotificationsResponse,
  },
  // ***************//
//   WEBHOOKS    //
// ***************//
//
// Adds a webhook registered for some kind of event.
addWebhook: {
    path: '/fulmine.v1.NotificationService/AddWebhook',
    requestStream: false,
    responseStream: false,
    requestType: ark_notification_pb.AddWebhookRequest,
    responseType: ark_notification_pb.AddWebhookResponse,
    requestSerialize: serialize_fulmine_v1_AddWebhookRequest,
    requestDeserialize: deserialize_fulmine_v1_AddWebhookRequest,
    responseSerialize: serialize_fulmine_v1_AddWebhookResponse,
    responseDeserialize: deserialize_fulmine_v1_AddWebhookResponse,
  },
  // Removes some previously added webhook.
removeWebhook: {
    path: '/fulmine.v1.NotificationService/RemoveWebhook',
    requestStream: false,
    responseStream: false,
    requestType: ark_notification_pb.RemoveWebhookRequest,
    responseType: ark_notification_pb.RemoveWebhookResponse,
    requestSerialize: serialize_fulmine_v1_RemoveWebhookRequest,
    requestDeserialize: deserialize_fulmine_v1_RemoveWebhookRequest,
    responseSerialize: serialize_fulmine_v1_RemoveWebhookResponse,
    responseDeserialize: deserialize_fulmine_v1_RemoveWebhookResponse,
  },
  // Returns registered webhooks.
listWebhooks: {
    path: '/fulmine.v1.NotificationService/ListWebhooks',
    requestStream: false,
    responseStream: false,
    requestType: ark_notification_pb.ListWebhooksRequest,
    responseType: ark_notification_pb.ListWebhooksResponse,
    requestSerialize: serialize_fulmine_v1_ListWebhooksRequest,
    requestDeserialize: deserialize_fulmine_v1_ListWebhooksRequest,
    responseSerialize: serialize_fulmine_v1_ListWebhooksResponse,
    responseDeserialize: deserialize_fulmine_v1_ListWebhooksResponse,
  },
};

exports.NotificationServiceClient = grpc.makeGenericClientConstructor(NotificationServiceService, 'NotificationService');
// **************//
//   PUB-SUB    //
// **************//
