// GENERATED CODE -- DO NOT EDIT!

'use strict';
var grpc = require('grpc');
var boltzrpc_pb = require('./boltzrpc_pb.js');

function serialize_boltzrpc_BroadcastTransactionRequest(arg) {
  if (!(arg instanceof boltzrpc_pb.BroadcastTransactionRequest)) {
    throw new Error('Expected argument of type boltzrpc.BroadcastTransactionRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_boltzrpc_BroadcastTransactionRequest(buffer_arg) {
  return boltzrpc_pb.BroadcastTransactionRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_boltzrpc_BroadcastTransactionResponse(arg) {
  if (!(arg instanceof boltzrpc_pb.BroadcastTransactionResponse)) {
    throw new Error('Expected argument of type boltzrpc.BroadcastTransactionResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_boltzrpc_BroadcastTransactionResponse(buffer_arg) {
  return boltzrpc_pb.BroadcastTransactionResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_boltzrpc_CreateReverseSwapRequest(arg) {
  if (!(arg instanceof boltzrpc_pb.CreateReverseSwapRequest)) {
    throw new Error('Expected argument of type boltzrpc.CreateReverseSwapRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_boltzrpc_CreateReverseSwapRequest(buffer_arg) {
  return boltzrpc_pb.CreateReverseSwapRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_boltzrpc_CreateReverseSwapResponse(arg) {
  if (!(arg instanceof boltzrpc_pb.CreateReverseSwapResponse)) {
    throw new Error('Expected argument of type boltzrpc.CreateReverseSwapResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_boltzrpc_CreateReverseSwapResponse(buffer_arg) {
  return boltzrpc_pb.CreateReverseSwapResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_boltzrpc_CreateSwapRequest(arg) {
  if (!(arg instanceof boltzrpc_pb.CreateSwapRequest)) {
    throw new Error('Expected argument of type boltzrpc.CreateSwapRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_boltzrpc_CreateSwapRequest(buffer_arg) {
  return boltzrpc_pb.CreateSwapRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_boltzrpc_CreateSwapResponse(arg) {
  if (!(arg instanceof boltzrpc_pb.CreateSwapResponse)) {
    throw new Error('Expected argument of type boltzrpc.CreateSwapResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_boltzrpc_CreateSwapResponse(buffer_arg) {
  return boltzrpc_pb.CreateSwapResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_boltzrpc_GetBalanceRequest(arg) {
  if (!(arg instanceof boltzrpc_pb.GetBalanceRequest)) {
    throw new Error('Expected argument of type boltzrpc.GetBalanceRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_boltzrpc_GetBalanceRequest(buffer_arg) {
  return boltzrpc_pb.GetBalanceRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_boltzrpc_GetBalanceResponse(arg) {
  if (!(arg instanceof boltzrpc_pb.GetBalanceResponse)) {
    throw new Error('Expected argument of type boltzrpc.GetBalanceResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_boltzrpc_GetBalanceResponse(buffer_arg) {
  return boltzrpc_pb.GetBalanceResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_boltzrpc_GetInfoRequest(arg) {
  if (!(arg instanceof boltzrpc_pb.GetInfoRequest)) {
    throw new Error('Expected argument of type boltzrpc.GetInfoRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_boltzrpc_GetInfoRequest(buffer_arg) {
  return boltzrpc_pb.GetInfoRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_boltzrpc_GetInfoResponse(arg) {
  if (!(arg instanceof boltzrpc_pb.GetInfoResponse)) {
    throw new Error('Expected argument of type boltzrpc.GetInfoResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_boltzrpc_GetInfoResponse(buffer_arg) {
  return boltzrpc_pb.GetInfoResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_boltzrpc_NewAddressRequest(arg) {
  if (!(arg instanceof boltzrpc_pb.NewAddressRequest)) {
    throw new Error('Expected argument of type boltzrpc.NewAddressRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_boltzrpc_NewAddressRequest(buffer_arg) {
  return boltzrpc_pb.NewAddressRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_boltzrpc_NewAddressResponse(arg) {
  if (!(arg instanceof boltzrpc_pb.NewAddressResponse)) {
    throw new Error('Expected argument of type boltzrpc.NewAddressResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_boltzrpc_NewAddressResponse(buffer_arg) {
  return boltzrpc_pb.NewAddressResponse.deserializeBinary(new Uint8Array(buffer_arg));
}


var BoltzService = exports.BoltzService = {
  // Gets general information about this Boltz instance and the nodes it is connected to 
  getInfo: {
    path: '/boltzrpc.Boltz/GetInfo',
    requestStream: false,
    responseStream: false,
    requestType: boltzrpc_pb.GetInfoRequest,
    responseType: boltzrpc_pb.GetInfoResponse,
    requestSerialize: serialize_boltzrpc_GetInfoRequest,
    requestDeserialize: deserialize_boltzrpc_GetInfoRequest,
    responseSerialize: serialize_boltzrpc_GetInfoResponse,
    responseDeserialize: deserialize_boltzrpc_GetInfoResponse,
  },
  // Gets the balance for either all wallets or just a single one if specified 
  getBalance: {
    path: '/boltzrpc.Boltz/GetBalance',
    requestStream: false,
    responseStream: false,
    requestType: boltzrpc_pb.GetBalanceRequest,
    responseType: boltzrpc_pb.GetBalanceResponse,
    requestSerialize: serialize_boltzrpc_GetBalanceRequest,
    requestDeserialize: deserialize_boltzrpc_GetBalanceRequest,
    responseSerialize: serialize_boltzrpc_GetBalanceResponse,
    responseDeserialize: deserialize_boltzrpc_GetBalanceResponse,
  },
  // Gets a new address of a specified wallet. The "type" parameter is optional and defaults to "OutputType.LEGACY" 
  newAddress: {
    path: '/boltzrpc.Boltz/NewAddress',
    requestStream: false,
    responseStream: false,
    requestType: boltzrpc_pb.NewAddressRequest,
    responseType: boltzrpc_pb.NewAddressResponse,
    requestSerialize: serialize_boltzrpc_NewAddressRequest,
    requestDeserialize: deserialize_boltzrpc_NewAddressRequest,
    responseSerialize: serialize_boltzrpc_NewAddressResponse,
    responseDeserialize: deserialize_boltzrpc_NewAddressResponse,
  },
  // Broadcasts a hex encoded transaction on the specified network 
  broadcastTransaction: {
    path: '/boltzrpc.Boltz/BroadcastTransaction',
    requestStream: false,
    responseStream: false,
    requestType: boltzrpc_pb.BroadcastTransactionRequest,
    responseType: boltzrpc_pb.BroadcastTransactionResponse,
    requestSerialize: serialize_boltzrpc_BroadcastTransactionRequest,
    requestDeserialize: deserialize_boltzrpc_BroadcastTransactionRequest,
    responseSerialize: serialize_boltzrpc_BroadcastTransactionResponse,
    responseDeserialize: deserialize_boltzrpc_BroadcastTransactionResponse,
  },
  // Creates a new Swap from the chain to Lightning 
  createSwap: {
    path: '/boltzrpc.Boltz/CreateSwap',
    requestStream: false,
    responseStream: false,
    requestType: boltzrpc_pb.CreateSwapRequest,
    responseType: boltzrpc_pb.CreateSwapResponse,
    requestSerialize: serialize_boltzrpc_CreateSwapRequest,
    requestDeserialize: deserialize_boltzrpc_CreateSwapRequest,
    responseSerialize: serialize_boltzrpc_CreateSwapResponse,
    responseDeserialize: deserialize_boltzrpc_CreateSwapResponse,
  },
  // Creates a new Swap from Lightning to the chain 
  createReverseSwap: {
    path: '/boltzrpc.Boltz/CreateReverseSwap',
    requestStream: false,
    responseStream: false,
    requestType: boltzrpc_pb.CreateReverseSwapRequest,
    responseType: boltzrpc_pb.CreateReverseSwapResponse,
    requestSerialize: serialize_boltzrpc_CreateReverseSwapRequest,
    requestDeserialize: deserialize_boltzrpc_CreateReverseSwapRequest,
    responseSerialize: serialize_boltzrpc_CreateReverseSwapResponse,
    responseDeserialize: deserialize_boltzrpc_CreateReverseSwapResponse,
  },
};

exports.BoltzClient = grpc.makeGenericClientConstructor(BoltzService);
