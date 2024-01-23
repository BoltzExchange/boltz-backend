// GENERATED CODE -- DO NOT EDIT!

'use strict';
var grpc = require('@grpc/grpc-js');
var mpay_pb = require('./mpay_pb.js');

function serialize_mpay_GetInfoRequest(arg) {
  if (!(arg instanceof mpay_pb.GetInfoRequest)) {
    throw new Error('Expected argument of type mpay.GetInfoRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_mpay_GetInfoRequest(buffer_arg) {
  return mpay_pb.GetInfoRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_mpay_GetInfoResponse(arg) {
  if (!(arg instanceof mpay_pb.GetInfoResponse)) {
    throw new Error('Expected argument of type mpay.GetInfoResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_mpay_GetInfoResponse(buffer_arg) {
  return mpay_pb.GetInfoResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_mpay_GetRoutesRequest(arg) {
  if (!(arg instanceof mpay_pb.GetRoutesRequest)) {
    throw new Error('Expected argument of type mpay.GetRoutesRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_mpay_GetRoutesRequest(buffer_arg) {
  return mpay_pb.GetRoutesRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_mpay_GetRoutesResponse(arg) {
  if (!(arg instanceof mpay_pb.GetRoutesResponse)) {
    throw new Error('Expected argument of type mpay.GetRoutesResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_mpay_GetRoutesResponse(buffer_arg) {
  return mpay_pb.GetRoutesResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_mpay_ListPaymentsRequest(arg) {
  if (!(arg instanceof mpay_pb.ListPaymentsRequest)) {
    throw new Error('Expected argument of type mpay.ListPaymentsRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_mpay_ListPaymentsRequest(buffer_arg) {
  return mpay_pb.ListPaymentsRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_mpay_ListPaymentsResponse(arg) {
  if (!(arg instanceof mpay_pb.ListPaymentsResponse)) {
    throw new Error('Expected argument of type mpay.ListPaymentsResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_mpay_ListPaymentsResponse(buffer_arg) {
  return mpay_pb.ListPaymentsResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_mpay_PayRequest(arg) {
  if (!(arg instanceof mpay_pb.PayRequest)) {
    throw new Error('Expected argument of type mpay.PayRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_mpay_PayRequest(buffer_arg) {
  return mpay_pb.PayRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_mpay_PayResponse(arg) {
  if (!(arg instanceof mpay_pb.PayResponse)) {
    throw new Error('Expected argument of type mpay.PayResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_mpay_PayResponse(buffer_arg) {
  return mpay_pb.PayResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_mpay_ResetPathMemoryRequest(arg) {
  if (!(arg instanceof mpay_pb.ResetPathMemoryRequest)) {
    throw new Error('Expected argument of type mpay.ResetPathMemoryRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_mpay_ResetPathMemoryRequest(buffer_arg) {
  return mpay_pb.ResetPathMemoryRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_mpay_ResetPathMemoryResponse(arg) {
  if (!(arg instanceof mpay_pb.ResetPathMemoryResponse)) {
    throw new Error('Expected argument of type mpay.ResetPathMemoryResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_mpay_ResetPathMemoryResponse(buffer_arg) {
  return mpay_pb.ResetPathMemoryResponse.deserializeBinary(new Uint8Array(buffer_arg));
}


var MpayService = exports.MpayService = {
  getInfo: {
    path: '/mpay.Mpay/GetInfo',
    requestStream: false,
    responseStream: false,
    requestType: mpay_pb.GetInfoRequest,
    responseType: mpay_pb.GetInfoResponse,
    requestSerialize: serialize_mpay_GetInfoRequest,
    requestDeserialize: deserialize_mpay_GetInfoRequest,
    responseSerialize: serialize_mpay_GetInfoResponse,
    responseDeserialize: deserialize_mpay_GetInfoResponse,
  },
  getRoutes: {
    path: '/mpay.Mpay/GetRoutes',
    requestStream: false,
    responseStream: false,
    requestType: mpay_pb.GetRoutesRequest,
    responseType: mpay_pb.GetRoutesResponse,
    requestSerialize: serialize_mpay_GetRoutesRequest,
    requestDeserialize: deserialize_mpay_GetRoutesRequest,
    responseSerialize: serialize_mpay_GetRoutesResponse,
    responseDeserialize: deserialize_mpay_GetRoutesResponse,
  },
  listPayments: {
    path: '/mpay.Mpay/ListPayments',
    requestStream: false,
    responseStream: false,
    requestType: mpay_pb.ListPaymentsRequest,
    responseType: mpay_pb.ListPaymentsResponse,
    requestSerialize: serialize_mpay_ListPaymentsRequest,
    requestDeserialize: deserialize_mpay_ListPaymentsRequest,
    responseSerialize: serialize_mpay_ListPaymentsResponse,
    responseDeserialize: deserialize_mpay_ListPaymentsResponse,
  },
  pay: {
    path: '/mpay.Mpay/Pay',
    requestStream: false,
    responseStream: false,
    requestType: mpay_pb.PayRequest,
    responseType: mpay_pb.PayResponse,
    requestSerialize: serialize_mpay_PayRequest,
    requestDeserialize: deserialize_mpay_PayRequest,
    responseSerialize: serialize_mpay_PayResponse,
    responseDeserialize: deserialize_mpay_PayResponse,
  },
  resetPathMemory: {
    path: '/mpay.Mpay/ResetPathMemory',
    requestStream: false,
    responseStream: false,
    requestType: mpay_pb.ResetPathMemoryRequest,
    responseType: mpay_pb.ResetPathMemoryResponse,
    requestSerialize: serialize_mpay_ResetPathMemoryRequest,
    requestDeserialize: deserialize_mpay_ResetPathMemoryRequest,
    responseSerialize: serialize_mpay_ResetPathMemoryResponse,
    responseDeserialize: deserialize_mpay_ResetPathMemoryResponse,
  },
};

exports.MpayClient = grpc.makeGenericClientConstructor(MpayService);
