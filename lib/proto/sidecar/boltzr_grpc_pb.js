// GENERATED CODE -- DO NOT EDIT!

'use strict';
var grpc = require('@grpc/grpc-js');
var boltzr_pb = require('./boltzr_pb.js');

function serialize_boltzr_CreateWebHookRequest(arg) {
  if (!(arg instanceof boltzr_pb.CreateWebHookRequest)) {
    throw new Error('Expected argument of type boltzr.CreateWebHookRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_boltzr_CreateWebHookRequest(buffer_arg) {
  return boltzr_pb.CreateWebHookRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_boltzr_CreateWebHookResponse(arg) {
  if (!(arg instanceof boltzr_pb.CreateWebHookResponse)) {
    throw new Error('Expected argument of type boltzr.CreateWebHookResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_boltzr_CreateWebHookResponse(buffer_arg) {
  return boltzr_pb.CreateWebHookResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_boltzr_GetInfoRequest(arg) {
  if (!(arg instanceof boltzr_pb.GetInfoRequest)) {
    throw new Error('Expected argument of type boltzr.GetInfoRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_boltzr_GetInfoRequest(buffer_arg) {
  return boltzr_pb.GetInfoRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_boltzr_GetInfoResponse(arg) {
  if (!(arg instanceof boltzr_pb.GetInfoResponse)) {
    throw new Error('Expected argument of type boltzr.GetInfoResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_boltzr_GetInfoResponse(buffer_arg) {
  return boltzr_pb.GetInfoResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_boltzr_SendWebHookRequest(arg) {
  if (!(arg instanceof boltzr_pb.SendWebHookRequest)) {
    throw new Error('Expected argument of type boltzr.SendWebHookRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_boltzr_SendWebHookRequest(buffer_arg) {
  return boltzr_pb.SendWebHookRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_boltzr_SendWebHookResponse(arg) {
  if (!(arg instanceof boltzr_pb.SendWebHookResponse)) {
    throw new Error('Expected argument of type boltzr.SendWebHookResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_boltzr_SendWebHookResponse(buffer_arg) {
  return boltzr_pb.SendWebHookResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_boltzr_StartWebHookRetriesRequest(arg) {
  if (!(arg instanceof boltzr_pb.StartWebHookRetriesRequest)) {
    throw new Error('Expected argument of type boltzr.StartWebHookRetriesRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_boltzr_StartWebHookRetriesRequest(buffer_arg) {
  return boltzr_pb.StartWebHookRetriesRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_boltzr_StartWebHookRetriesResponse(arg) {
  if (!(arg instanceof boltzr_pb.StartWebHookRetriesResponse)) {
    throw new Error('Expected argument of type boltzr.StartWebHookRetriesResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_boltzr_StartWebHookRetriesResponse(buffer_arg) {
  return boltzr_pb.StartWebHookRetriesResponse.deserializeBinary(new Uint8Array(buffer_arg));
}


var BoltzRService = exports.BoltzRService = {
  getInfo: {
    path: '/boltzr.BoltzR/GetInfo',
    requestStream: false,
    responseStream: false,
    requestType: boltzr_pb.GetInfoRequest,
    responseType: boltzr_pb.GetInfoResponse,
    requestSerialize: serialize_boltzr_GetInfoRequest,
    requestDeserialize: deserialize_boltzr_GetInfoRequest,
    responseSerialize: serialize_boltzr_GetInfoResponse,
    responseDeserialize: deserialize_boltzr_GetInfoResponse,
  },
  startWebHookRetries: {
    path: '/boltzr.BoltzR/StartWebHookRetries',
    requestStream: false,
    responseStream: false,
    requestType: boltzr_pb.StartWebHookRetriesRequest,
    responseType: boltzr_pb.StartWebHookRetriesResponse,
    requestSerialize: serialize_boltzr_StartWebHookRetriesRequest,
    requestDeserialize: deserialize_boltzr_StartWebHookRetriesRequest,
    responseSerialize: serialize_boltzr_StartWebHookRetriesResponse,
    responseDeserialize: deserialize_boltzr_StartWebHookRetriesResponse,
  },
  createWebHook: {
    path: '/boltzr.BoltzR/CreateWebHook',
    requestStream: false,
    responseStream: false,
    requestType: boltzr_pb.CreateWebHookRequest,
    responseType: boltzr_pb.CreateWebHookResponse,
    requestSerialize: serialize_boltzr_CreateWebHookRequest,
    requestDeserialize: deserialize_boltzr_CreateWebHookRequest,
    responseSerialize: serialize_boltzr_CreateWebHookResponse,
    responseDeserialize: deserialize_boltzr_CreateWebHookResponse,
  },
  sendWebHook: {
    path: '/boltzr.BoltzR/SendWebHook',
    requestStream: false,
    responseStream: false,
    requestType: boltzr_pb.SendWebHookRequest,
    responseType: boltzr_pb.SendWebHookResponse,
    requestSerialize: serialize_boltzr_SendWebHookRequest,
    requestDeserialize: deserialize_boltzr_SendWebHookRequest,
    responseSerialize: serialize_boltzr_SendWebHookResponse,
    responseDeserialize: deserialize_boltzr_SendWebHookResponse,
  },
};

exports.BoltzRClient = grpc.makeGenericClientConstructor(BoltzRService);
