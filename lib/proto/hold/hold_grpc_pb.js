// GENERATED CODE -- DO NOT EDIT!

'use strict';
var grpc = require('@grpc/grpc-js');
var hold_pb = require('./hold_pb.js');

function serialize_hold_CancelRequest(arg) {
  if (!(arg instanceof hold_pb.CancelRequest)) {
    throw new Error('Expected argument of type hold.CancelRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_hold_CancelRequest(buffer_arg) {
  return hold_pb.CancelRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_hold_CancelResponse(arg) {
  if (!(arg instanceof hold_pb.CancelResponse)) {
    throw new Error('Expected argument of type hold.CancelResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_hold_CancelResponse(buffer_arg) {
  return hold_pb.CancelResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_hold_GetInfoRequest(arg) {
  if (!(arg instanceof hold_pb.GetInfoRequest)) {
    throw new Error('Expected argument of type hold.GetInfoRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_hold_GetInfoRequest(buffer_arg) {
  return hold_pb.GetInfoRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_hold_GetInfoResponse(arg) {
  if (!(arg instanceof hold_pb.GetInfoResponse)) {
    throw new Error('Expected argument of type hold.GetInfoResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_hold_GetInfoResponse(buffer_arg) {
  return hold_pb.GetInfoResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_hold_InvoiceRequest(arg) {
  if (!(arg instanceof hold_pb.InvoiceRequest)) {
    throw new Error('Expected argument of type hold.InvoiceRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_hold_InvoiceRequest(buffer_arg) {
  return hold_pb.InvoiceRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_hold_InvoiceResponse(arg) {
  if (!(arg instanceof hold_pb.InvoiceResponse)) {
    throw new Error('Expected argument of type hold.InvoiceResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_hold_InvoiceResponse(buffer_arg) {
  return hold_pb.InvoiceResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_hold_ListRequest(arg) {
  if (!(arg instanceof hold_pb.ListRequest)) {
    throw new Error('Expected argument of type hold.ListRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_hold_ListRequest(buffer_arg) {
  return hold_pb.ListRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_hold_ListResponse(arg) {
  if (!(arg instanceof hold_pb.ListResponse)) {
    throw new Error('Expected argument of type hold.ListResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_hold_ListResponse(buffer_arg) {
  return hold_pb.ListResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_hold_RoutingHintsRequest(arg) {
  if (!(arg instanceof hold_pb.RoutingHintsRequest)) {
    throw new Error('Expected argument of type hold.RoutingHintsRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_hold_RoutingHintsRequest(buffer_arg) {
  return hold_pb.RoutingHintsRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_hold_RoutingHintsResponse(arg) {
  if (!(arg instanceof hold_pb.RoutingHintsResponse)) {
    throw new Error('Expected argument of type hold.RoutingHintsResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_hold_RoutingHintsResponse(buffer_arg) {
  return hold_pb.RoutingHintsResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_hold_SettleRequest(arg) {
  if (!(arg instanceof hold_pb.SettleRequest)) {
    throw new Error('Expected argument of type hold.SettleRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_hold_SettleRequest(buffer_arg) {
  return hold_pb.SettleRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_hold_SettleResponse(arg) {
  if (!(arg instanceof hold_pb.SettleResponse)) {
    throw new Error('Expected argument of type hold.SettleResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_hold_SettleResponse(buffer_arg) {
  return hold_pb.SettleResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_hold_TrackAllRequest(arg) {
  if (!(arg instanceof hold_pb.TrackAllRequest)) {
    throw new Error('Expected argument of type hold.TrackAllRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_hold_TrackAllRequest(buffer_arg) {
  return hold_pb.TrackAllRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_hold_TrackAllResponse(arg) {
  if (!(arg instanceof hold_pb.TrackAllResponse)) {
    throw new Error('Expected argument of type hold.TrackAllResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_hold_TrackAllResponse(buffer_arg) {
  return hold_pb.TrackAllResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_hold_TrackRequest(arg) {
  if (!(arg instanceof hold_pb.TrackRequest)) {
    throw new Error('Expected argument of type hold.TrackRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_hold_TrackRequest(buffer_arg) {
  return hold_pb.TrackRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_hold_TrackResponse(arg) {
  if (!(arg instanceof hold_pb.TrackResponse)) {
    throw new Error('Expected argument of type hold.TrackResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_hold_TrackResponse(buffer_arg) {
  return hold_pb.TrackResponse.deserializeBinary(new Uint8Array(buffer_arg));
}


var HoldService = exports.HoldService = {
  getInfo: {
    path: '/hold.Hold/GetInfo',
    requestStream: false,
    responseStream: false,
    requestType: hold_pb.GetInfoRequest,
    responseType: hold_pb.GetInfoResponse,
    requestSerialize: serialize_hold_GetInfoRequest,
    requestDeserialize: deserialize_hold_GetInfoRequest,
    responseSerialize: serialize_hold_GetInfoResponse,
    responseDeserialize: deserialize_hold_GetInfoResponse,
  },
  invoice: {
    path: '/hold.Hold/Invoice',
    requestStream: false,
    responseStream: false,
    requestType: hold_pb.InvoiceRequest,
    responseType: hold_pb.InvoiceResponse,
    requestSerialize: serialize_hold_InvoiceRequest,
    requestDeserialize: deserialize_hold_InvoiceRequest,
    responseSerialize: serialize_hold_InvoiceResponse,
    responseDeserialize: deserialize_hold_InvoiceResponse,
  },
  routingHints: {
    path: '/hold.Hold/RoutingHints',
    requestStream: false,
    responseStream: false,
    requestType: hold_pb.RoutingHintsRequest,
    responseType: hold_pb.RoutingHintsResponse,
    requestSerialize: serialize_hold_RoutingHintsRequest,
    requestDeserialize: deserialize_hold_RoutingHintsRequest,
    responseSerialize: serialize_hold_RoutingHintsResponse,
    responseDeserialize: deserialize_hold_RoutingHintsResponse,
  },
  list: {
    path: '/hold.Hold/List',
    requestStream: false,
    responseStream: false,
    requestType: hold_pb.ListRequest,
    responseType: hold_pb.ListResponse,
    requestSerialize: serialize_hold_ListRequest,
    requestDeserialize: deserialize_hold_ListRequest,
    responseSerialize: serialize_hold_ListResponse,
    responseDeserialize: deserialize_hold_ListResponse,
  },
  settle: {
    path: '/hold.Hold/Settle',
    requestStream: false,
    responseStream: false,
    requestType: hold_pb.SettleRequest,
    responseType: hold_pb.SettleResponse,
    requestSerialize: serialize_hold_SettleRequest,
    requestDeserialize: deserialize_hold_SettleRequest,
    responseSerialize: serialize_hold_SettleResponse,
    responseDeserialize: deserialize_hold_SettleResponse,
  },
  cancel: {
    path: '/hold.Hold/Cancel',
    requestStream: false,
    responseStream: false,
    requestType: hold_pb.CancelRequest,
    responseType: hold_pb.CancelResponse,
    requestSerialize: serialize_hold_CancelRequest,
    requestDeserialize: deserialize_hold_CancelRequest,
    responseSerialize: serialize_hold_CancelResponse,
    responseDeserialize: deserialize_hold_CancelResponse,
  },
  track: {
    path: '/hold.Hold/Track',
    requestStream: false,
    responseStream: true,
    requestType: hold_pb.TrackRequest,
    responseType: hold_pb.TrackResponse,
    requestSerialize: serialize_hold_TrackRequest,
    requestDeserialize: deserialize_hold_TrackRequest,
    responseSerialize: serialize_hold_TrackResponse,
    responseDeserialize: deserialize_hold_TrackResponse,
  },
  trackAll: {
    path: '/hold.Hold/TrackAll',
    requestStream: false,
    responseStream: true,
    requestType: hold_pb.TrackAllRequest,
    responseType: hold_pb.TrackAllResponse,
    requestSerialize: serialize_hold_TrackAllRequest,
    requestDeserialize: deserialize_hold_TrackAllRequest,
    responseSerialize: serialize_hold_TrackAllResponse,
    responseDeserialize: deserialize_hold_TrackAllResponse,
  },
};

exports.HoldClient = grpc.makeGenericClientConstructor(HoldService);
