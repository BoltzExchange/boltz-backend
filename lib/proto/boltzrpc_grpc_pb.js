// GENERATED CODE -- DO NOT EDIT!

'use strict';
var grpc = require('grpc');
var boltzrpc_pb = require('./boltzrpc_pb.js');

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
};

exports.BoltzClient = grpc.makeGenericClientConstructor(BoltzService);
