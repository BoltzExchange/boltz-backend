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

function serialize_boltzr_DecodeInvoiceOrOfferRequest(arg) {
  if (!(arg instanceof boltzr_pb.DecodeInvoiceOrOfferRequest)) {
    throw new Error('Expected argument of type boltzr.DecodeInvoiceOrOfferRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_boltzr_DecodeInvoiceOrOfferRequest(buffer_arg) {
  return boltzr_pb.DecodeInvoiceOrOfferRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_boltzr_DecodeInvoiceOrOfferResponse(arg) {
  if (!(arg instanceof boltzr_pb.DecodeInvoiceOrOfferResponse)) {
    throw new Error('Expected argument of type boltzr.DecodeInvoiceOrOfferResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_boltzr_DecodeInvoiceOrOfferResponse(buffer_arg) {
  return boltzr_pb.DecodeInvoiceOrOfferResponse.deserializeBinary(new Uint8Array(buffer_arg));
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

function serialize_boltzr_GetPayjoinUriRequest(arg) {
  if (!(arg instanceof boltzr_pb.GetPayjoinUriRequest)) {
    throw new Error('Expected argument of type boltzr.GetPayjoinUriRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_boltzr_GetPayjoinUriRequest(buffer_arg) {
  return boltzr_pb.GetPayjoinUriRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_boltzr_GetPayjoinUriResponse(arg) {
  if (!(arg instanceof boltzr_pb.GetPayjoinUriResponse)) {
    throw new Error('Expected argument of type boltzr.GetPayjoinUriResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_boltzr_GetPayjoinUriResponse(buffer_arg) {
  return boltzr_pb.GetPayjoinUriResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_boltzr_IsMarkedRequest(arg) {
  if (!(arg instanceof boltzr_pb.IsMarkedRequest)) {
    throw new Error('Expected argument of type boltzr.IsMarkedRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_boltzr_IsMarkedRequest(buffer_arg) {
  return boltzr_pb.IsMarkedRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_boltzr_IsMarkedResponse(arg) {
  if (!(arg instanceof boltzr_pb.IsMarkedResponse)) {
    throw new Error('Expected argument of type boltzr.IsMarkedResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_boltzr_IsMarkedResponse(buffer_arg) {
  return boltzr_pb.IsMarkedResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_boltzr_ScanMempoolRequest(arg) {
  if (!(arg instanceof boltzr_pb.ScanMempoolRequest)) {
    throw new Error('Expected argument of type boltzr.ScanMempoolRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_boltzr_ScanMempoolRequest(buffer_arg) {
  return boltzr_pb.ScanMempoolRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_boltzr_ScanMempoolResponse(arg) {
  if (!(arg instanceof boltzr_pb.ScanMempoolResponse)) {
    throw new Error('Expected argument of type boltzr.ScanMempoolResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_boltzr_ScanMempoolResponse(buffer_arg) {
  return boltzr_pb.ScanMempoolResponse.deserializeBinary(new Uint8Array(buffer_arg));
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

function serialize_boltzr_SendSwapUpdateRequest(arg) {
  if (!(arg instanceof boltzr_pb.SendSwapUpdateRequest)) {
    throw new Error('Expected argument of type boltzr.SendSwapUpdateRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_boltzr_SendSwapUpdateRequest(buffer_arg) {
  return boltzr_pb.SendSwapUpdateRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_boltzr_SendSwapUpdateResponse(arg) {
  if (!(arg instanceof boltzr_pb.SendSwapUpdateResponse)) {
    throw new Error('Expected argument of type boltzr.SendSwapUpdateResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_boltzr_SendSwapUpdateResponse(buffer_arg) {
  return boltzr_pb.SendSwapUpdateResponse.deserializeBinary(new Uint8Array(buffer_arg));
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

function serialize_boltzr_SetLogLevelRequest(arg) {
  if (!(arg instanceof boltzr_pb.SetLogLevelRequest)) {
    throw new Error('Expected argument of type boltzr.SetLogLevelRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_boltzr_SetLogLevelRequest(buffer_arg) {
  return boltzr_pb.SetLogLevelRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_boltzr_SetLogLevelResponse(arg) {
  if (!(arg instanceof boltzr_pb.SetLogLevelResponse)) {
    throw new Error('Expected argument of type boltzr.SetLogLevelResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_boltzr_SetLogLevelResponse(buffer_arg) {
  return boltzr_pb.SetLogLevelResponse.deserializeBinary(new Uint8Array(buffer_arg));
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
  setLogLevel: {
    path: '/boltzr.BoltzR/SetLogLevel',
    requestStream: false,
    responseStream: false,
    requestType: boltzr_pb.SetLogLevelRequest,
    responseType: boltzr_pb.SetLogLevelResponse,
    requestSerialize: serialize_boltzr_SetLogLevelRequest,
    requestDeserialize: deserialize_boltzr_SetLogLevelRequest,
    responseSerialize: serialize_boltzr_SetLogLevelResponse,
    responseDeserialize: deserialize_boltzr_SetLogLevelResponse,
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
  sendSwapUpdate: {
    path: '/boltzr.BoltzR/SendSwapUpdate',
    requestStream: false,
    responseStream: true,
    requestType: boltzr_pb.SendSwapUpdateRequest,
    responseType: boltzr_pb.SendSwapUpdateResponse,
    requestSerialize: serialize_boltzr_SendSwapUpdateRequest,
    requestDeserialize: deserialize_boltzr_SendSwapUpdateRequest,
    responseSerialize: serialize_boltzr_SendSwapUpdateResponse,
    responseDeserialize: deserialize_boltzr_SendSwapUpdateResponse,
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
  decodeInvoiceOrOffer: {
    path: '/boltzr.BoltzR/DecodeInvoiceOrOffer',
    requestStream: false,
    responseStream: false,
    requestType: boltzr_pb.DecodeInvoiceOrOfferRequest,
    responseType: boltzr_pb.DecodeInvoiceOrOfferResponse,
    requestSerialize: serialize_boltzr_DecodeInvoiceOrOfferRequest,
    requestDeserialize: deserialize_boltzr_DecodeInvoiceOrOfferRequest,
    responseSerialize: serialize_boltzr_DecodeInvoiceOrOfferResponse,
    responseDeserialize: deserialize_boltzr_DecodeInvoiceOrOfferResponse,
  },
  isMarked: {
    path: '/boltzr.BoltzR/IsMarked',
    requestStream: false,
    responseStream: false,
    requestType: boltzr_pb.IsMarkedRequest,
    responseType: boltzr_pb.IsMarkedResponse,
    requestSerialize: serialize_boltzr_IsMarkedRequest,
    requestDeserialize: deserialize_boltzr_IsMarkedRequest,
    responseSerialize: serialize_boltzr_IsMarkedResponse,
    responseDeserialize: deserialize_boltzr_IsMarkedResponse,
  },
  scanMempool: {
    path: '/boltzr.BoltzR/ScanMempool',
    requestStream: false,
    responseStream: false,
    requestType: boltzr_pb.ScanMempoolRequest,
    responseType: boltzr_pb.ScanMempoolResponse,
    requestSerialize: serialize_boltzr_ScanMempoolRequest,
    requestDeserialize: deserialize_boltzr_ScanMempoolRequest,
    responseSerialize: serialize_boltzr_ScanMempoolResponse,
    responseDeserialize: deserialize_boltzr_ScanMempoolResponse,
  },
  getPayjoinUri: {
    path: '/boltzr.BoltzR/GetPayjoinUri',
    requestStream: false,
    responseStream: false,
    requestType: boltzr_pb.GetPayjoinUriRequest,
    responseType: boltzr_pb.GetPayjoinUriResponse,
    requestSerialize: serialize_boltzr_GetPayjoinUriRequest,
    requestDeserialize: deserialize_boltzr_GetPayjoinUriRequest,
    responseSerialize: serialize_boltzr_GetPayjoinUriResponse,
    responseDeserialize: deserialize_boltzr_GetPayjoinUriResponse,
  },
};

exports.BoltzRClient = grpc.makeGenericClientConstructor(BoltzRService, 'BoltzR');
