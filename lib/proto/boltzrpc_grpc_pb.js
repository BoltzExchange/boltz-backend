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

function serialize_boltzrpc_ChannelBackup(arg) {
  if (!(arg instanceof boltzrpc_pb.ChannelBackup)) {
    throw new Error('Expected argument of type boltzrpc.ChannelBackup');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_boltzrpc_ChannelBackup(buffer_arg) {
  return boltzrpc_pb.ChannelBackup.deserializeBinary(new Uint8Array(buffer_arg));
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

function serialize_boltzrpc_GetFeeEstimationRequest(arg) {
  if (!(arg instanceof boltzrpc_pb.GetFeeEstimationRequest)) {
    throw new Error('Expected argument of type boltzrpc.GetFeeEstimationRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_boltzrpc_GetFeeEstimationRequest(buffer_arg) {
  return boltzrpc_pb.GetFeeEstimationRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_boltzrpc_GetFeeEstimationResponse(arg) {
  if (!(arg instanceof boltzrpc_pb.GetFeeEstimationResponse)) {
    throw new Error('Expected argument of type boltzrpc.GetFeeEstimationResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_boltzrpc_GetFeeEstimationResponse(buffer_arg) {
  return boltzrpc_pb.GetFeeEstimationResponse.deserializeBinary(new Uint8Array(buffer_arg));
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

function serialize_boltzrpc_GetTransactionRequest(arg) {
  if (!(arg instanceof boltzrpc_pb.GetTransactionRequest)) {
    throw new Error('Expected argument of type boltzrpc.GetTransactionRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_boltzrpc_GetTransactionRequest(buffer_arg) {
  return boltzrpc_pb.GetTransactionRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_boltzrpc_GetTransactionResponse(arg) {
  if (!(arg instanceof boltzrpc_pb.GetTransactionResponse)) {
    throw new Error('Expected argument of type boltzrpc.GetTransactionResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_boltzrpc_GetTransactionResponse(buffer_arg) {
  return boltzrpc_pb.GetTransactionResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_boltzrpc_ListenOnAddressRequest(arg) {
  if (!(arg instanceof boltzrpc_pb.ListenOnAddressRequest)) {
    throw new Error('Expected argument of type boltzrpc.ListenOnAddressRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_boltzrpc_ListenOnAddressRequest(buffer_arg) {
  return boltzrpc_pb.ListenOnAddressRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_boltzrpc_ListenOnAddressResponse(arg) {
  if (!(arg instanceof boltzrpc_pb.ListenOnAddressResponse)) {
    throw new Error('Expected argument of type boltzrpc.ListenOnAddressResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_boltzrpc_ListenOnAddressResponse(buffer_arg) {
  return boltzrpc_pb.ListenOnAddressResponse.deserializeBinary(new Uint8Array(buffer_arg));
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

function serialize_boltzrpc_SubscribeChannelBackupsRequest(arg) {
  if (!(arg instanceof boltzrpc_pb.SubscribeChannelBackupsRequest)) {
    throw new Error('Expected argument of type boltzrpc.SubscribeChannelBackupsRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_boltzrpc_SubscribeChannelBackupsRequest(buffer_arg) {
  return boltzrpc_pb.SubscribeChannelBackupsRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_boltzrpc_SubscribeInvoicesRequest(arg) {
  if (!(arg instanceof boltzrpc_pb.SubscribeInvoicesRequest)) {
    throw new Error('Expected argument of type boltzrpc.SubscribeInvoicesRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_boltzrpc_SubscribeInvoicesRequest(buffer_arg) {
  return boltzrpc_pb.SubscribeInvoicesRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_boltzrpc_SubscribeInvoicesResponse(arg) {
  if (!(arg instanceof boltzrpc_pb.SubscribeInvoicesResponse)) {
    throw new Error('Expected argument of type boltzrpc.SubscribeInvoicesResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_boltzrpc_SubscribeInvoicesResponse(buffer_arg) {
  return boltzrpc_pb.SubscribeInvoicesResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_boltzrpc_SubscribeRefundsRequest(arg) {
  if (!(arg instanceof boltzrpc_pb.SubscribeRefundsRequest)) {
    throw new Error('Expected argument of type boltzrpc.SubscribeRefundsRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_boltzrpc_SubscribeRefundsRequest(buffer_arg) {
  return boltzrpc_pb.SubscribeRefundsRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_boltzrpc_SubscribeRefundsResponse(arg) {
  if (!(arg instanceof boltzrpc_pb.SubscribeRefundsResponse)) {
    throw new Error('Expected argument of type boltzrpc.SubscribeRefundsResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_boltzrpc_SubscribeRefundsResponse(buffer_arg) {
  return boltzrpc_pb.SubscribeRefundsResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_boltzrpc_SubscribeTransactionsRequest(arg) {
  if (!(arg instanceof boltzrpc_pb.SubscribeTransactionsRequest)) {
    throw new Error('Expected argument of type boltzrpc.SubscribeTransactionsRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_boltzrpc_SubscribeTransactionsRequest(buffer_arg) {
  return boltzrpc_pb.SubscribeTransactionsRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_boltzrpc_SubscribeTransactionsResponse(arg) {
  if (!(arg instanceof boltzrpc_pb.SubscribeTransactionsResponse)) {
    throw new Error('Expected argument of type boltzrpc.SubscribeTransactionsResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_boltzrpc_SubscribeTransactionsResponse(buffer_arg) {
  return boltzrpc_pb.SubscribeTransactionsResponse.deserializeBinary(new Uint8Array(buffer_arg));
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
  // Gets a hex encoded transaction from a transaction hash on the specified network 
  getTransaction: {
    path: '/boltzrpc.Boltz/GetTransaction',
    requestStream: false,
    responseStream: false,
    requestType: boltzrpc_pb.GetTransactionRequest,
    responseType: boltzrpc_pb.GetTransactionResponse,
    requestSerialize: serialize_boltzrpc_GetTransactionRequest,
    requestDeserialize: deserialize_boltzrpc_GetTransactionRequest,
    responseSerialize: serialize_boltzrpc_GetTransactionResponse,
    responseDeserialize: deserialize_boltzrpc_GetTransactionResponse,
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
  // Gets a fee estimation in satoshis per vbyte for either all currencies or just a single one if specified 
  getFeeEstimation: {
    path: '/boltzrpc.Boltz/GetFeeEstimation',
    requestStream: false,
    responseStream: false,
    requestType: boltzrpc_pb.GetFeeEstimationRequest,
    responseType: boltzrpc_pb.GetFeeEstimationResponse,
    requestSerialize: serialize_boltzrpc_GetFeeEstimationRequest,
    requestDeserialize: deserialize_boltzrpc_GetFeeEstimationRequest,
    responseSerialize: serialize_boltzrpc_GetFeeEstimationResponse,
    responseDeserialize: deserialize_boltzrpc_GetFeeEstimationResponse,
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
  // Adds an entry to the list of addresses SubscribeTransactions listens to 
  listenOnAddress: {
    path: '/boltzrpc.Boltz/ListenOnAddress',
    requestStream: false,
    responseStream: false,
    requestType: boltzrpc_pb.ListenOnAddressRequest,
    responseType: boltzrpc_pb.ListenOnAddressResponse,
    requestSerialize: serialize_boltzrpc_ListenOnAddressRequest,
    requestDeserialize: deserialize_boltzrpc_ListenOnAddressRequest,
    responseSerialize: serialize_boltzrpc_ListenOnAddressResponse,
    responseDeserialize: deserialize_boltzrpc_ListenOnAddressResponse,
  },
  // Subscribes to a stream of confirmed transactions to addresses that were specified with "ListenOnAddress" 
  subscribeTransactions: {
    path: '/boltzrpc.Boltz/SubscribeTransactions',
    requestStream: false,
    responseStream: true,
    requestType: boltzrpc_pb.SubscribeTransactionsRequest,
    responseType: boltzrpc_pb.SubscribeTransactionsResponse,
    requestSerialize: serialize_boltzrpc_SubscribeTransactionsRequest,
    requestDeserialize: deserialize_boltzrpc_SubscribeTransactionsRequest,
    responseSerialize: serialize_boltzrpc_SubscribeTransactionsResponse,
    responseDeserialize: deserialize_boltzrpc_SubscribeTransactionsResponse,
  },
  // Subscribes to a stream of invoice events 
  subscribeInvoices: {
    path: '/boltzrpc.Boltz/SubscribeInvoices',
    requestStream: false,
    responseStream: true,
    requestType: boltzrpc_pb.SubscribeInvoicesRequest,
    responseType: boltzrpc_pb.SubscribeInvoicesResponse,
    requestSerialize: serialize_boltzrpc_SubscribeInvoicesRequest,
    requestDeserialize: deserialize_boltzrpc_SubscribeInvoicesRequest,
    responseSerialize: serialize_boltzrpc_SubscribeInvoicesResponse,
    responseDeserialize: deserialize_boltzrpc_SubscribeInvoicesResponse,
  },
  // Subscribes to a stream of lockup transactions that Boltz refunds 
  subscribeRefunds: {
    path: '/boltzrpc.Boltz/SubscribeRefunds',
    requestStream: false,
    responseStream: true,
    requestType: boltzrpc_pb.SubscribeRefundsRequest,
    responseType: boltzrpc_pb.SubscribeRefundsResponse,
    requestSerialize: serialize_boltzrpc_SubscribeRefundsRequest,
    requestDeserialize: deserialize_boltzrpc_SubscribeRefundsRequest,
    responseSerialize: serialize_boltzrpc_SubscribeRefundsResponse,
    responseDeserialize: deserialize_boltzrpc_SubscribeRefundsResponse,
  },
  // Subscribes to a a stream of channel backups 
  subscribeChannelBackups: {
    path: '/boltzrpc.Boltz/SubscribeChannelBackups',
    requestStream: false,
    responseStream: true,
    requestType: boltzrpc_pb.SubscribeChannelBackupsRequest,
    responseType: boltzrpc_pb.ChannelBackup,
    requestSerialize: serialize_boltzrpc_SubscribeChannelBackupsRequest,
    requestDeserialize: deserialize_boltzrpc_SubscribeChannelBackupsRequest,
    responseSerialize: serialize_boltzrpc_ChannelBackup,
    responseDeserialize: deserialize_boltzrpc_ChannelBackup,
  },
};

exports.BoltzClient = grpc.makeGenericClientConstructor(BoltzService);
