// GENERATED CODE -- DO NOT EDIT!

'use strict';
var grpc = require('grpc');
var boltzrpc_pb = require('./boltzrpc_pb.js');

function serialize_boltzrpc_DeriveKeysRequest(arg) {
  if (!(arg instanceof boltzrpc_pb.DeriveKeysRequest)) {
    throw new Error('Expected argument of type boltzrpc.DeriveKeysRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_boltzrpc_DeriveKeysRequest(buffer_arg) {
  return boltzrpc_pb.DeriveKeysRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_boltzrpc_DeriveKeysResponse(arg) {
  if (!(arg instanceof boltzrpc_pb.DeriveKeysResponse)) {
    throw new Error('Expected argument of type boltzrpc.DeriveKeysResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_boltzrpc_DeriveKeysResponse(buffer_arg) {
  return boltzrpc_pb.DeriveKeysResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_boltzrpc_GetAddressRequest(arg) {
  if (!(arg instanceof boltzrpc_pb.GetAddressRequest)) {
    throw new Error('Expected argument of type boltzrpc.GetAddressRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_boltzrpc_GetAddressRequest(buffer_arg) {
  return boltzrpc_pb.GetAddressRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_boltzrpc_GetAddressResponse(arg) {
  if (!(arg instanceof boltzrpc_pb.GetAddressResponse)) {
    throw new Error('Expected argument of type boltzrpc.GetAddressResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_boltzrpc_GetAddressResponse(buffer_arg) {
  return boltzrpc_pb.GetAddressResponse.deserializeBinary(new Uint8Array(buffer_arg));
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

function serialize_boltzrpc_SendCoinsRequest(arg) {
  if (!(arg instanceof boltzrpc_pb.SendCoinsRequest)) {
    throw new Error('Expected argument of type boltzrpc.SendCoinsRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_boltzrpc_SendCoinsRequest(buffer_arg) {
  return boltzrpc_pb.SendCoinsRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_boltzrpc_SendCoinsResponse(arg) {
  if (!(arg instanceof boltzrpc_pb.SendCoinsResponse)) {
    throw new Error('Expected argument of type boltzrpc.SendCoinsResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_boltzrpc_SendCoinsResponse(buffer_arg) {
  return boltzrpc_pb.SendCoinsResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_boltzrpc_UpdateTimeoutBlockDeltaRequest(arg) {
  if (!(arg instanceof boltzrpc_pb.UpdateTimeoutBlockDeltaRequest)) {
    throw new Error('Expected argument of type boltzrpc.UpdateTimeoutBlockDeltaRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_boltzrpc_UpdateTimeoutBlockDeltaRequest(buffer_arg) {
  return boltzrpc_pb.UpdateTimeoutBlockDeltaRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_boltzrpc_UpdateTimeoutBlockDeltaResponse(arg) {
  if (!(arg instanceof boltzrpc_pb.UpdateTimeoutBlockDeltaResponse)) {
    throw new Error('Expected argument of type boltzrpc.UpdateTimeoutBlockDeltaResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_boltzrpc_UpdateTimeoutBlockDeltaResponse(buffer_arg) {
  return boltzrpc_pb.UpdateTimeoutBlockDeltaResponse.deserializeBinary(new Uint8Array(buffer_arg));
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
  // Gets the balance of all wallets 
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
  // Derives a keypair from the index of an HD wallet 
deriveKeys: {
    path: '/boltzrpc.Boltz/DeriveKeys',
    requestStream: false,
    responseStream: false,
    requestType: boltzrpc_pb.DeriveKeysRequest,
    responseType: boltzrpc_pb.DeriveKeysResponse,
    requestSerialize: serialize_boltzrpc_DeriveKeysRequest,
    requestDeserialize: deserialize_boltzrpc_DeriveKeysRequest,
    responseSerialize: serialize_boltzrpc_DeriveKeysResponse,
    responseDeserialize: deserialize_boltzrpc_DeriveKeysResponse,
  },
  // Gets an address of a specified wallet 
getAddress: {
    path: '/boltzrpc.Boltz/GetAddress',
    requestStream: false,
    responseStream: false,
    requestType: boltzrpc_pb.GetAddressRequest,
    responseType: boltzrpc_pb.GetAddressResponse,
    requestSerialize: serialize_boltzrpc_GetAddressRequest,
    requestDeserialize: deserialize_boltzrpc_GetAddressRequest,
    responseSerialize: serialize_boltzrpc_GetAddressResponse,
    responseDeserialize: deserialize_boltzrpc_GetAddressResponse,
  },
  // Sends onchain coins to a specified address 
sendCoins: {
    path: '/boltzrpc.Boltz/SendCoins',
    requestStream: false,
    responseStream: false,
    requestType: boltzrpc_pb.SendCoinsRequest,
    responseType: boltzrpc_pb.SendCoinsResponse,
    requestSerialize: serialize_boltzrpc_SendCoinsRequest,
    requestDeserialize: deserialize_boltzrpc_SendCoinsRequest,
    responseSerialize: serialize_boltzrpc_SendCoinsResponse,
    responseDeserialize: deserialize_boltzrpc_SendCoinsResponse,
  },
  // Updates the timeout block delta of a pair 
updateTimeoutBlockDelta: {
    path: '/boltzrpc.Boltz/UpdateTimeoutBlockDelta',
    requestStream: false,
    responseStream: false,
    requestType: boltzrpc_pb.UpdateTimeoutBlockDeltaRequest,
    responseType: boltzrpc_pb.UpdateTimeoutBlockDeltaResponse,
    requestSerialize: serialize_boltzrpc_UpdateTimeoutBlockDeltaRequest,
    requestDeserialize: deserialize_boltzrpc_UpdateTimeoutBlockDeltaRequest,
    responseSerialize: serialize_boltzrpc_UpdateTimeoutBlockDeltaResponse,
    responseDeserialize: deserialize_boltzrpc_UpdateTimeoutBlockDeltaResponse,
  },
};

exports.BoltzClient = grpc.makeGenericClientConstructor(BoltzService);
