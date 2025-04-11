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

function serialize_hold_CleanRequest(arg) {
  if (!(arg instanceof hold_pb.CleanRequest)) {
    throw new Error('Expected argument of type hold.CleanRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_hold_CleanRequest(buffer_arg) {
  return hold_pb.CleanRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_hold_CleanResponse(arg) {
  if (!(arg instanceof hold_pb.CleanResponse)) {
    throw new Error('Expected argument of type hold.CleanResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_hold_CleanResponse(buffer_arg) {
  return hold_pb.CleanResponse.deserializeBinary(new Uint8Array(buffer_arg));
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

function serialize_hold_InjectRequest(arg) {
  if (!(arg instanceof hold_pb.InjectRequest)) {
    throw new Error('Expected argument of type hold.InjectRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_hold_InjectRequest(buffer_arg) {
  return hold_pb.InjectRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_hold_InjectResponse(arg) {
  if (!(arg instanceof hold_pb.InjectResponse)) {
    throw new Error('Expected argument of type hold.InjectResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_hold_InjectResponse(buffer_arg) {
  return hold_pb.InjectResponse.deserializeBinary(new Uint8Array(buffer_arg));
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

function serialize_hold_OnionMessage(arg) {
  if (!(arg instanceof hold_pb.OnionMessage)) {
    throw new Error('Expected argument of type hold.OnionMessage');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_hold_OnionMessage(buffer_arg) {
  return hold_pb.OnionMessage.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_hold_OnionMessageResponse(arg) {
  if (!(arg instanceof hold_pb.OnionMessageResponse)) {
    throw new Error('Expected argument of type hold.OnionMessageResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_hold_OnionMessageResponse(buffer_arg) {
  return hold_pb.OnionMessageResponse.deserializeBinary(new Uint8Array(buffer_arg));
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
  inject: {
    path: '/hold.Hold/Inject',
    requestStream: false,
    responseStream: false,
    requestType: hold_pb.InjectRequest,
    responseType: hold_pb.InjectResponse,
    requestSerialize: serialize_hold_InjectRequest,
    requestDeserialize: deserialize_hold_InjectRequest,
    responseSerialize: serialize_hold_InjectResponse,
    responseDeserialize: deserialize_hold_InjectResponse,
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
  // Cleans cancelled invoices
clean: {
    path: '/hold.Hold/Clean',
    requestStream: false,
    responseStream: false,
    requestType: hold_pb.CleanRequest,
    responseType: hold_pb.CleanResponse,
    requestSerialize: serialize_hold_CleanRequest,
    requestDeserialize: deserialize_hold_CleanRequest,
    responseSerialize: serialize_hold_CleanResponse,
    responseDeserialize: deserialize_hold_CleanResponse,
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
  onionMessages: {
    path: '/hold.Hold/OnionMessages',
    requestStream: true,
    responseStream: true,
    requestType: hold_pb.OnionMessageResponse,
    responseType: hold_pb.OnionMessage,
    requestSerialize: serialize_hold_OnionMessageResponse,
    requestDeserialize: deserialize_hold_OnionMessageResponse,
    responseSerialize: serialize_hold_OnionMessage,
    responseDeserialize: deserialize_hold_OnionMessage,
  },
};

exports.HoldClient = grpc.makeGenericClientConstructor(HoldService, 'Hold');
