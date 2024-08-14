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

function serialize_boltzr_GetMessagesRequest(arg) {
  if (!(arg instanceof boltzr_pb.GetMessagesRequest)) {
    throw new Error('Expected argument of type boltzr.GetMessagesRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_boltzr_GetMessagesRequest(buffer_arg) {
  return boltzr_pb.GetMessagesRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_boltzr_GetMessagesResponse(arg) {
  if (!(arg instanceof boltzr_pb.GetMessagesResponse)) {
    throw new Error('Expected argument of type boltzr.GetMessagesResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_boltzr_GetMessagesResponse(buffer_arg) {
  return boltzr_pb.GetMessagesResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_boltzr_SendMessageRequest(arg) {
  if (!(arg instanceof boltzr_pb.SendMessageRequest)) {
    throw new Error('Expected argument of type boltzr.SendMessageRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_boltzr_SendMessageRequest(buffer_arg) {
  return boltzr_pb.SendMessageRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_boltzr_SendMessageResponse(arg) {
  if (!(arg instanceof boltzr_pb.SendMessageResponse)) {
    throw new Error('Expected argument of type boltzr.SendMessageResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_boltzr_SendMessageResponse(buffer_arg) {
  return boltzr_pb.SendMessageResponse.deserializeBinary(new Uint8Array(buffer_arg));
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

function serialize_boltzr_SignEvmRefundRequest(arg) {
  if (!(arg instanceof boltzr_pb.SignEvmRefundRequest)) {
    throw new Error('Expected argument of type boltzr.SignEvmRefundRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_boltzr_SignEvmRefundRequest(buffer_arg) {
  return boltzr_pb.SignEvmRefundRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_boltzr_SignEvmRefundResponse(arg) {
  if (!(arg instanceof boltzr_pb.SignEvmRefundResponse)) {
    throw new Error('Expected argument of type boltzr.SignEvmRefundResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_boltzr_SignEvmRefundResponse(buffer_arg) {
  return boltzr_pb.SignEvmRefundResponse.deserializeBinary(new Uint8Array(buffer_arg));
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

function serialize_boltzr_SwapUpdateRequest(arg) {
  if (!(arg instanceof boltzr_pb.SwapUpdateRequest)) {
    throw new Error('Expected argument of type boltzr.SwapUpdateRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_boltzr_SwapUpdateRequest(buffer_arg) {
  return boltzr_pb.SwapUpdateRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_boltzr_SwapUpdateResponse(arg) {
  if (!(arg instanceof boltzr_pb.SwapUpdateResponse)) {
    throw new Error('Expected argument of type boltzr.SwapUpdateResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_boltzr_SwapUpdateResponse(buffer_arg) {
  return boltzr_pb.SwapUpdateResponse.deserializeBinary(new Uint8Array(buffer_arg));
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
  sendMessage: {
    path: '/boltzr.BoltzR/SendMessage',
    requestStream: false,
    responseStream: false,
    requestType: boltzr_pb.SendMessageRequest,
    responseType: boltzr_pb.SendMessageResponse,
    requestSerialize: serialize_boltzr_SendMessageRequest,
    requestDeserialize: deserialize_boltzr_SendMessageRequest,
    responseSerialize: serialize_boltzr_SendMessageResponse,
    responseDeserialize: deserialize_boltzr_SendMessageResponse,
  },
  getMessages: {
    path: '/boltzr.BoltzR/GetMessages',
    requestStream: false,
    responseStream: true,
    requestType: boltzr_pb.GetMessagesRequest,
    responseType: boltzr_pb.GetMessagesResponse,
    requestSerialize: serialize_boltzr_GetMessagesRequest,
    requestDeserialize: deserialize_boltzr_GetMessagesRequest,
    responseSerialize: serialize_boltzr_GetMessagesResponse,
    responseDeserialize: deserialize_boltzr_GetMessagesResponse,
  },
  swapUpdate: {
    path: '/boltzr.BoltzR/SwapUpdate',
    requestStream: true,
    responseStream: true,
    requestType: boltzr_pb.SwapUpdateRequest,
    responseType: boltzr_pb.SwapUpdateResponse,
    requestSerialize: serialize_boltzr_SwapUpdateRequest,
    requestDeserialize: deserialize_boltzr_SwapUpdateRequest,
    responseSerialize: serialize_boltzr_SwapUpdateResponse,
    responseDeserialize: deserialize_boltzr_SwapUpdateResponse,
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
  signEvmRefund: {
    path: '/boltzr.BoltzR/SignEvmRefund',
    requestStream: false,
    responseStream: false,
    requestType: boltzr_pb.SignEvmRefundRequest,
    responseType: boltzr_pb.SignEvmRefundResponse,
    requestSerialize: serialize_boltzr_SignEvmRefundRequest,
    requestDeserialize: deserialize_boltzr_SignEvmRefundRequest,
    responseSerialize: serialize_boltzr_SignEvmRefundResponse,
    responseDeserialize: deserialize_boltzr_SignEvmRefundResponse,
  },
};

exports.BoltzRClient = grpc.makeGenericClientConstructor(BoltzRService);
