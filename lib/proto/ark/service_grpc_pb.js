// GENERATED CODE -- DO NOT EDIT!

'use strict';
var grpc = require('@grpc/grpc-js');
var ark_service_pb = require('../ark/service_pb.js');
var ark_types_pb = require('../ark/types_pb.js');
var google_api_annotations_pb = require('../google/api/annotations_pb.js');

function serialize_fulmine_v1_ClaimVHTLCRequest(arg) {
  if (!(arg instanceof ark_service_pb.ClaimVHTLCRequest)) {
    throw new Error('Expected argument of type fulmine.v1.ClaimVHTLCRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fulmine_v1_ClaimVHTLCRequest(buffer_arg) {
  return ark_service_pb.ClaimVHTLCRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fulmine_v1_ClaimVHTLCResponse(arg) {
  if (!(arg instanceof ark_service_pb.ClaimVHTLCResponse)) {
    throw new Error('Expected argument of type fulmine.v1.ClaimVHTLCResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fulmine_v1_ClaimVHTLCResponse(buffer_arg) {
  return ark_service_pb.ClaimVHTLCResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fulmine_v1_CreateVHTLCRequest(arg) {
  if (!(arg instanceof ark_service_pb.CreateVHTLCRequest)) {
    throw new Error('Expected argument of type fulmine.v1.CreateVHTLCRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fulmine_v1_CreateVHTLCRequest(buffer_arg) {
  return ark_service_pb.CreateVHTLCRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fulmine_v1_CreateVHTLCResponse(arg) {
  if (!(arg instanceof ark_service_pb.CreateVHTLCResponse)) {
    throw new Error('Expected argument of type fulmine.v1.CreateVHTLCResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fulmine_v1_CreateVHTLCResponse(buffer_arg) {
  return ark_service_pb.CreateVHTLCResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fulmine_v1_GetAddressRequest(arg) {
  if (!(arg instanceof ark_service_pb.GetAddressRequest)) {
    throw new Error('Expected argument of type fulmine.v1.GetAddressRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fulmine_v1_GetAddressRequest(buffer_arg) {
  return ark_service_pb.GetAddressRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fulmine_v1_GetAddressResponse(arg) {
  if (!(arg instanceof ark_service_pb.GetAddressResponse)) {
    throw new Error('Expected argument of type fulmine.v1.GetAddressResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fulmine_v1_GetAddressResponse(buffer_arg) {
  return ark_service_pb.GetAddressResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fulmine_v1_GetBalanceRequest(arg) {
  if (!(arg instanceof ark_service_pb.GetBalanceRequest)) {
    throw new Error('Expected argument of type fulmine.v1.GetBalanceRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fulmine_v1_GetBalanceRequest(buffer_arg) {
  return ark_service_pb.GetBalanceRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fulmine_v1_GetBalanceResponse(arg) {
  if (!(arg instanceof ark_service_pb.GetBalanceResponse)) {
    throw new Error('Expected argument of type fulmine.v1.GetBalanceResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fulmine_v1_GetBalanceResponse(buffer_arg) {
  return ark_service_pb.GetBalanceResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fulmine_v1_GetDelegatePublicKeyRequest(arg) {
  if (!(arg instanceof ark_service_pb.GetDelegatePublicKeyRequest)) {
    throw new Error('Expected argument of type fulmine.v1.GetDelegatePublicKeyRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fulmine_v1_GetDelegatePublicKeyRequest(buffer_arg) {
  return ark_service_pb.GetDelegatePublicKeyRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fulmine_v1_GetDelegatePublicKeyResponse(arg) {
  if (!(arg instanceof ark_service_pb.GetDelegatePublicKeyResponse)) {
    throw new Error('Expected argument of type fulmine.v1.GetDelegatePublicKeyResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fulmine_v1_GetDelegatePublicKeyResponse(buffer_arg) {
  return ark_service_pb.GetDelegatePublicKeyResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fulmine_v1_GetInfoRequest(arg) {
  if (!(arg instanceof ark_service_pb.GetInfoRequest)) {
    throw new Error('Expected argument of type fulmine.v1.GetInfoRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fulmine_v1_GetInfoRequest(buffer_arg) {
  return ark_service_pb.GetInfoRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fulmine_v1_GetInfoResponse(arg) {
  if (!(arg instanceof ark_service_pb.GetInfoResponse)) {
    throw new Error('Expected argument of type fulmine.v1.GetInfoResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fulmine_v1_GetInfoResponse(buffer_arg) {
  return ark_service_pb.GetInfoResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fulmine_v1_GetInvoiceRequest(arg) {
  if (!(arg instanceof ark_service_pb.GetInvoiceRequest)) {
    throw new Error('Expected argument of type fulmine.v1.GetInvoiceRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fulmine_v1_GetInvoiceRequest(buffer_arg) {
  return ark_service_pb.GetInvoiceRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fulmine_v1_GetInvoiceResponse(arg) {
  if (!(arg instanceof ark_service_pb.GetInvoiceResponse)) {
    throw new Error('Expected argument of type fulmine.v1.GetInvoiceResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fulmine_v1_GetInvoiceResponse(buffer_arg) {
  return ark_service_pb.GetInvoiceResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fulmine_v1_GetOnboardAddressRequest(arg) {
  if (!(arg instanceof ark_service_pb.GetOnboardAddressRequest)) {
    throw new Error('Expected argument of type fulmine.v1.GetOnboardAddressRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fulmine_v1_GetOnboardAddressRequest(buffer_arg) {
  return ark_service_pb.GetOnboardAddressRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fulmine_v1_GetOnboardAddressResponse(arg) {
  if (!(arg instanceof ark_service_pb.GetOnboardAddressResponse)) {
    throw new Error('Expected argument of type fulmine.v1.GetOnboardAddressResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fulmine_v1_GetOnboardAddressResponse(buffer_arg) {
  return ark_service_pb.GetOnboardAddressResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fulmine_v1_GetRoundInfoRequest(arg) {
  if (!(arg instanceof ark_service_pb.GetRoundInfoRequest)) {
    throw new Error('Expected argument of type fulmine.v1.GetRoundInfoRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fulmine_v1_GetRoundInfoRequest(buffer_arg) {
  return ark_service_pb.GetRoundInfoRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fulmine_v1_GetRoundInfoResponse(arg) {
  if (!(arg instanceof ark_service_pb.GetRoundInfoResponse)) {
    throw new Error('Expected argument of type fulmine.v1.GetRoundInfoResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fulmine_v1_GetRoundInfoResponse(buffer_arg) {
  return ark_service_pb.GetRoundInfoResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fulmine_v1_GetTransactionHistoryRequest(arg) {
  if (!(arg instanceof ark_service_pb.GetTransactionHistoryRequest)) {
    throw new Error('Expected argument of type fulmine.v1.GetTransactionHistoryRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fulmine_v1_GetTransactionHistoryRequest(buffer_arg) {
  return ark_service_pb.GetTransactionHistoryRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fulmine_v1_GetTransactionHistoryResponse(arg) {
  if (!(arg instanceof ark_service_pb.GetTransactionHistoryResponse)) {
    throw new Error('Expected argument of type fulmine.v1.GetTransactionHistoryResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fulmine_v1_GetTransactionHistoryResponse(buffer_arg) {
  return ark_service_pb.GetTransactionHistoryResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fulmine_v1_GetVirtualTxsRequest(arg) {
  if (!(arg instanceof ark_service_pb.GetVirtualTxsRequest)) {
    throw new Error('Expected argument of type fulmine.v1.GetVirtualTxsRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fulmine_v1_GetVirtualTxsRequest(buffer_arg) {
  return ark_service_pb.GetVirtualTxsRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fulmine_v1_GetVirtualTxsResponse(arg) {
  if (!(arg instanceof ark_service_pb.GetVirtualTxsResponse)) {
    throw new Error('Expected argument of type fulmine.v1.GetVirtualTxsResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fulmine_v1_GetVirtualTxsResponse(buffer_arg) {
  return ark_service_pb.GetVirtualTxsResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fulmine_v1_IsInvoiceSettledRequest(arg) {
  if (!(arg instanceof ark_service_pb.IsInvoiceSettledRequest)) {
    throw new Error('Expected argument of type fulmine.v1.IsInvoiceSettledRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fulmine_v1_IsInvoiceSettledRequest(buffer_arg) {
  return ark_service_pb.IsInvoiceSettledRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fulmine_v1_IsInvoiceSettledResponse(arg) {
  if (!(arg instanceof ark_service_pb.IsInvoiceSettledResponse)) {
    throw new Error('Expected argument of type fulmine.v1.IsInvoiceSettledResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fulmine_v1_IsInvoiceSettledResponse(buffer_arg) {
  return ark_service_pb.IsInvoiceSettledResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fulmine_v1_ListVHTLCRequest(arg) {
  if (!(arg instanceof ark_service_pb.ListVHTLCRequest)) {
    throw new Error('Expected argument of type fulmine.v1.ListVHTLCRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fulmine_v1_ListVHTLCRequest(buffer_arg) {
  return ark_service_pb.ListVHTLCRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fulmine_v1_ListVHTLCResponse(arg) {
  if (!(arg instanceof ark_service_pb.ListVHTLCResponse)) {
    throw new Error('Expected argument of type fulmine.v1.ListVHTLCResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fulmine_v1_ListVHTLCResponse(buffer_arg) {
  return ark_service_pb.ListVHTLCResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fulmine_v1_ListWatchedAddressesRequest(arg) {
  if (!(arg instanceof ark_service_pb.ListWatchedAddressesRequest)) {
    throw new Error('Expected argument of type fulmine.v1.ListWatchedAddressesRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fulmine_v1_ListWatchedAddressesRequest(buffer_arg) {
  return ark_service_pb.ListWatchedAddressesRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fulmine_v1_ListWatchedAddressesResponse(arg) {
  if (!(arg instanceof ark_service_pb.ListWatchedAddressesResponse)) {
    throw new Error('Expected argument of type fulmine.v1.ListWatchedAddressesResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fulmine_v1_ListWatchedAddressesResponse(buffer_arg) {
  return ark_service_pb.ListWatchedAddressesResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fulmine_v1_PayInvoiceRequest(arg) {
  if (!(arg instanceof ark_service_pb.PayInvoiceRequest)) {
    throw new Error('Expected argument of type fulmine.v1.PayInvoiceRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fulmine_v1_PayInvoiceRequest(buffer_arg) {
  return ark_service_pb.PayInvoiceRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fulmine_v1_PayInvoiceResponse(arg) {
  if (!(arg instanceof ark_service_pb.PayInvoiceResponse)) {
    throw new Error('Expected argument of type fulmine.v1.PayInvoiceResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fulmine_v1_PayInvoiceResponse(buffer_arg) {
  return ark_service_pb.PayInvoiceResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fulmine_v1_RedeemNoteRequest(arg) {
  if (!(arg instanceof ark_service_pb.RedeemNoteRequest)) {
    throw new Error('Expected argument of type fulmine.v1.RedeemNoteRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fulmine_v1_RedeemNoteRequest(buffer_arg) {
  return ark_service_pb.RedeemNoteRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fulmine_v1_RedeemNoteResponse(arg) {
  if (!(arg instanceof ark_service_pb.RedeemNoteResponse)) {
    throw new Error('Expected argument of type fulmine.v1.RedeemNoteResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fulmine_v1_RedeemNoteResponse(buffer_arg) {
  return ark_service_pb.RedeemNoteResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fulmine_v1_RefundVHTLCWithoutReceiverRequest(arg) {
  if (!(arg instanceof ark_service_pb.RefundVHTLCWithoutReceiverRequest)) {
    throw new Error('Expected argument of type fulmine.v1.RefundVHTLCWithoutReceiverRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fulmine_v1_RefundVHTLCWithoutReceiverRequest(buffer_arg) {
  return ark_service_pb.RefundVHTLCWithoutReceiverRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fulmine_v1_RefundVHTLCWithoutReceiverResponse(arg) {
  if (!(arg instanceof ark_service_pb.RefundVHTLCWithoutReceiverResponse)) {
    throw new Error('Expected argument of type fulmine.v1.RefundVHTLCWithoutReceiverResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fulmine_v1_RefundVHTLCWithoutReceiverResponse(buffer_arg) {
  return ark_service_pb.RefundVHTLCWithoutReceiverResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fulmine_v1_SendOffChainRequest(arg) {
  if (!(arg instanceof ark_service_pb.SendOffChainRequest)) {
    throw new Error('Expected argument of type fulmine.v1.SendOffChainRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fulmine_v1_SendOffChainRequest(buffer_arg) {
  return ark_service_pb.SendOffChainRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fulmine_v1_SendOffChainResponse(arg) {
  if (!(arg instanceof ark_service_pb.SendOffChainResponse)) {
    throw new Error('Expected argument of type fulmine.v1.SendOffChainResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fulmine_v1_SendOffChainResponse(buffer_arg) {
  return ark_service_pb.SendOffChainResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fulmine_v1_SendOnChainRequest(arg) {
  if (!(arg instanceof ark_service_pb.SendOnChainRequest)) {
    throw new Error('Expected argument of type fulmine.v1.SendOnChainRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fulmine_v1_SendOnChainRequest(buffer_arg) {
  return ark_service_pb.SendOnChainRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fulmine_v1_SendOnChainResponse(arg) {
  if (!(arg instanceof ark_service_pb.SendOnChainResponse)) {
    throw new Error('Expected argument of type fulmine.v1.SendOnChainResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fulmine_v1_SendOnChainResponse(buffer_arg) {
  return ark_service_pb.SendOnChainResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fulmine_v1_SettleRequest(arg) {
  if (!(arg instanceof ark_service_pb.SettleRequest)) {
    throw new Error('Expected argument of type fulmine.v1.SettleRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fulmine_v1_SettleRequest(buffer_arg) {
  return ark_service_pb.SettleRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fulmine_v1_SettleResponse(arg) {
  if (!(arg instanceof ark_service_pb.SettleResponse)) {
    throw new Error('Expected argument of type fulmine.v1.SettleResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fulmine_v1_SettleResponse(buffer_arg) {
  return ark_service_pb.SettleResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fulmine_v1_SignTransactionRequest(arg) {
  if (!(arg instanceof ark_service_pb.SignTransactionRequest)) {
    throw new Error('Expected argument of type fulmine.v1.SignTransactionRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fulmine_v1_SignTransactionRequest(buffer_arg) {
  return ark_service_pb.SignTransactionRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fulmine_v1_SignTransactionResponse(arg) {
  if (!(arg instanceof ark_service_pb.SignTransactionResponse)) {
    throw new Error('Expected argument of type fulmine.v1.SignTransactionResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fulmine_v1_SignTransactionResponse(buffer_arg) {
  return ark_service_pb.SignTransactionResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fulmine_v1_UnwatchAddressRequest(arg) {
  if (!(arg instanceof ark_service_pb.UnwatchAddressRequest)) {
    throw new Error('Expected argument of type fulmine.v1.UnwatchAddressRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fulmine_v1_UnwatchAddressRequest(buffer_arg) {
  return ark_service_pb.UnwatchAddressRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fulmine_v1_UnwatchAddressResponse(arg) {
  if (!(arg instanceof ark_service_pb.UnwatchAddressResponse)) {
    throw new Error('Expected argument of type fulmine.v1.UnwatchAddressResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fulmine_v1_UnwatchAddressResponse(buffer_arg) {
  return ark_service_pb.UnwatchAddressResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fulmine_v1_WatchAddressForRolloverRequest(arg) {
  if (!(arg instanceof ark_service_pb.WatchAddressForRolloverRequest)) {
    throw new Error('Expected argument of type fulmine.v1.WatchAddressForRolloverRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fulmine_v1_WatchAddressForRolloverRequest(buffer_arg) {
  return ark_service_pb.WatchAddressForRolloverRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fulmine_v1_WatchAddressForRolloverResponse(arg) {
  if (!(arg instanceof ark_service_pb.WatchAddressForRolloverResponse)) {
    throw new Error('Expected argument of type fulmine.v1.WatchAddressForRolloverResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fulmine_v1_WatchAddressForRolloverResponse(buffer_arg) {
  return ark_service_pb.WatchAddressForRolloverResponse.deserializeBinary(new Uint8Array(buffer_arg));
}


var ServiceService = exports.ServiceService = {
  // GetAddress returns offchain address
getAddress: {
    path: '/fulmine.v1.Service/GetAddress',
    requestStream: false,
    responseStream: false,
    requestType: ark_service_pb.GetAddressRequest,
    responseType: ark_service_pb.GetAddressResponse,
    requestSerialize: serialize_fulmine_v1_GetAddressRequest,
    requestDeserialize: deserialize_fulmine_v1_GetAddressRequest,
    responseSerialize: serialize_fulmine_v1_GetAddressResponse,
    responseDeserialize: deserialize_fulmine_v1_GetAddressResponse,
  },
  // GetBalance returns ark balance
getBalance: {
    path: '/fulmine.v1.Service/GetBalance',
    requestStream: false,
    responseStream: false,
    requestType: ark_service_pb.GetBalanceRequest,
    responseType: ark_service_pb.GetBalanceResponse,
    requestSerialize: serialize_fulmine_v1_GetBalanceRequest,
    requestDeserialize: deserialize_fulmine_v1_GetBalanceRequest,
    responseSerialize: serialize_fulmine_v1_GetBalanceResponse,
    responseDeserialize: deserialize_fulmine_v1_GetBalanceResponse,
  },
  // GetInfo returns info about the ark account
getInfo: {
    path: '/fulmine.v1.Service/GetInfo',
    requestStream: false,
    responseStream: false,
    requestType: ark_service_pb.GetInfoRequest,
    responseType: ark_service_pb.GetInfoResponse,
    requestSerialize: serialize_fulmine_v1_GetInfoRequest,
    requestDeserialize: deserialize_fulmine_v1_GetInfoRequest,
    responseSerialize: serialize_fulmine_v1_GetInfoResponse,
    responseDeserialize: deserialize_fulmine_v1_GetInfoResponse,
  },
  // GetOnboardAddress returns onchain address and invoice for requested amount
getOnboardAddress: {
    path: '/fulmine.v1.Service/GetOnboardAddress',
    requestStream: false,
    responseStream: false,
    requestType: ark_service_pb.GetOnboardAddressRequest,
    responseType: ark_service_pb.GetOnboardAddressResponse,
    requestSerialize: serialize_fulmine_v1_GetOnboardAddressRequest,
    requestDeserialize: deserialize_fulmine_v1_GetOnboardAddressRequest,
    responseSerialize: serialize_fulmine_v1_GetOnboardAddressResponse,
    responseDeserialize: deserialize_fulmine_v1_GetOnboardAddressResponse,
  },
  // Returns round info for optional round_id (no round_id returns current round info)
getRoundInfo: {
    path: '/fulmine.v1.Service/GetRoundInfo',
    requestStream: false,
    responseStream: false,
    requestType: ark_service_pb.GetRoundInfoRequest,
    responseType: ark_service_pb.GetRoundInfoResponse,
    requestSerialize: serialize_fulmine_v1_GetRoundInfoRequest,
    requestDeserialize: deserialize_fulmine_v1_GetRoundInfoRequest,
    responseSerialize: serialize_fulmine_v1_GetRoundInfoResponse,
    responseDeserialize: deserialize_fulmine_v1_GetRoundInfoResponse,
  },
  // GetTransactionHistory returns virtual transactions history
getTransactionHistory: {
    path: '/fulmine.v1.Service/GetTransactionHistory',
    requestStream: false,
    responseStream: false,
    requestType: ark_service_pb.GetTransactionHistoryRequest,
    responseType: ark_service_pb.GetTransactionHistoryResponse,
    requestSerialize: serialize_fulmine_v1_GetTransactionHistoryRequest,
    requestDeserialize: deserialize_fulmine_v1_GetTransactionHistoryRequest,
    responseSerialize: serialize_fulmine_v1_GetTransactionHistoryResponse,
    responseDeserialize: deserialize_fulmine_v1_GetTransactionHistoryResponse,
  },
  // Redeems an ark note by joining a round
redeemNote: {
    path: '/fulmine.v1.Service/RedeemNote',
    requestStream: false,
    responseStream: false,
    requestType: ark_service_pb.RedeemNoteRequest,
    responseType: ark_service_pb.RedeemNoteResponse,
    requestSerialize: serialize_fulmine_v1_RedeemNoteRequest,
    requestDeserialize: deserialize_fulmine_v1_RedeemNoteRequest,
    responseSerialize: serialize_fulmine_v1_RedeemNoteResponse,
    responseDeserialize: deserialize_fulmine_v1_RedeemNoteResponse,
  },
  // Settle vtxos and boarding utxos
settle: {
    path: '/fulmine.v1.Service/Settle',
    requestStream: false,
    responseStream: false,
    requestType: ark_service_pb.SettleRequest,
    responseType: ark_service_pb.SettleResponse,
    requestSerialize: serialize_fulmine_v1_SettleRequest,
    requestDeserialize: deserialize_fulmine_v1_SettleRequest,
    responseSerialize: serialize_fulmine_v1_SettleResponse,
    responseDeserialize: deserialize_fulmine_v1_SettleResponse,
  },
  // Send asks to send amount to ark address by joining a round
sendOffChain: {
    path: '/fulmine.v1.Service/SendOffChain',
    requestStream: false,
    responseStream: false,
    requestType: ark_service_pb.SendOffChainRequest,
    responseType: ark_service_pb.SendOffChainResponse,
    requestSerialize: serialize_fulmine_v1_SendOffChainRequest,
    requestDeserialize: deserialize_fulmine_v1_SendOffChainRequest,
    responseSerialize: serialize_fulmine_v1_SendOffChainResponse,
    responseDeserialize: deserialize_fulmine_v1_SendOffChainResponse,
  },
  // SendOnChain asks to send requested amount to requested onchain address
sendOnChain: {
    path: '/fulmine.v1.Service/SendOnChain',
    requestStream: false,
    responseStream: false,
    requestType: ark_service_pb.SendOnChainRequest,
    responseType: ark_service_pb.SendOnChainResponse,
    requestSerialize: serialize_fulmine_v1_SendOnChainRequest,
    requestDeserialize: deserialize_fulmine_v1_SendOnChainRequest,
    responseSerialize: serialize_fulmine_v1_SendOnChainResponse,
    responseDeserialize: deserialize_fulmine_v1_SendOnChainResponse,
  },
  signTransaction: {
    path: '/fulmine.v1.Service/SignTransaction',
    requestStream: false,
    responseStream: false,
    requestType: ark_service_pb.SignTransactionRequest,
    responseType: ark_service_pb.SignTransactionResponse,
    requestSerialize: serialize_fulmine_v1_SignTransactionRequest,
    requestDeserialize: deserialize_fulmine_v1_SignTransactionRequest,
    responseSerialize: serialize_fulmine_v1_SignTransactionResponse,
    responseDeserialize: deserialize_fulmine_v1_SignTransactionResponse,
  },
  // CreateVHTLCAddress computes a VHTLC address
createVHTLC: {
    path: '/fulmine.v1.Service/CreateVHTLC',
    requestStream: false,
    responseStream: false,
    requestType: ark_service_pb.CreateVHTLCRequest,
    responseType: ark_service_pb.CreateVHTLCResponse,
    requestSerialize: serialize_fulmine_v1_CreateVHTLCRequest,
    requestDeserialize: deserialize_fulmine_v1_CreateVHTLCRequest,
    responseSerialize: serialize_fulmine_v1_CreateVHTLCResponse,
    responseDeserialize: deserialize_fulmine_v1_CreateVHTLCResponse,
  },
  // ClaimVHTLC = self send vHTLC -> VTXO
claimVHTLC: {
    path: '/fulmine.v1.Service/ClaimVHTLC',
    requestStream: false,
    responseStream: false,
    requestType: ark_service_pb.ClaimVHTLCRequest,
    responseType: ark_service_pb.ClaimVHTLCResponse,
    requestSerialize: serialize_fulmine_v1_ClaimVHTLCRequest,
    requestDeserialize: deserialize_fulmine_v1_ClaimVHTLCRequest,
    responseSerialize: serialize_fulmine_v1_ClaimVHTLCResponse,
    responseDeserialize: deserialize_fulmine_v1_ClaimVHTLCResponse,
  },
  refundVHTLCWithoutReceiver: {
    path: '/fulmine.v1.Service/RefundVHTLCWithoutReceiver',
    requestStream: false,
    responseStream: false,
    requestType: ark_service_pb.RefundVHTLCWithoutReceiverRequest,
    responseType: ark_service_pb.RefundVHTLCWithoutReceiverResponse,
    requestSerialize: serialize_fulmine_v1_RefundVHTLCWithoutReceiverRequest,
    requestDeserialize: deserialize_fulmine_v1_RefundVHTLCWithoutReceiverRequest,
    responseSerialize: serialize_fulmine_v1_RefundVHTLCWithoutReceiverResponse,
    responseDeserialize: deserialize_fulmine_v1_RefundVHTLCWithoutReceiverResponse,
  },
  // ListVHTLC = list all vhtlc OR filter by vhtlc_id
listVHTLC: {
    path: '/fulmine.v1.Service/ListVHTLC',
    requestStream: false,
    responseStream: false,
    requestType: ark_service_pb.ListVHTLCRequest,
    responseType: ark_service_pb.ListVHTLCResponse,
    requestSerialize: serialize_fulmine_v1_ListVHTLCRequest,
    requestDeserialize: deserialize_fulmine_v1_ListVHTLCRequest,
    responseSerialize: serialize_fulmine_v1_ListVHTLCResponse,
    responseDeserialize: deserialize_fulmine_v1_ListVHTLCResponse,
  },
  getInvoice: {
    path: '/fulmine.v1.Service/GetInvoice',
    requestStream: false,
    responseStream: false,
    requestType: ark_service_pb.GetInvoiceRequest,
    responseType: ark_service_pb.GetInvoiceResponse,
    requestSerialize: serialize_fulmine_v1_GetInvoiceRequest,
    requestDeserialize: deserialize_fulmine_v1_GetInvoiceRequest,
    responseSerialize: serialize_fulmine_v1_GetInvoiceResponse,
    responseDeserialize: deserialize_fulmine_v1_GetInvoiceResponse,
  },
  payInvoice: {
    path: '/fulmine.v1.Service/PayInvoice',
    requestStream: false,
    responseStream: false,
    requestType: ark_service_pb.PayInvoiceRequest,
    responseType: ark_service_pb.PayInvoiceResponse,
    requestSerialize: serialize_fulmine_v1_PayInvoiceRequest,
    requestDeserialize: deserialize_fulmine_v1_PayInvoiceRequest,
    responseSerialize: serialize_fulmine_v1_PayInvoiceResponse,
    responseDeserialize: deserialize_fulmine_v1_PayInvoiceResponse,
  },
  isInvoiceSettled: {
    path: '/fulmine.v1.Service/IsInvoiceSettled',
    requestStream: false,
    responseStream: false,
    requestType: ark_service_pb.IsInvoiceSettledRequest,
    responseType: ark_service_pb.IsInvoiceSettledResponse,
    requestSerialize: serialize_fulmine_v1_IsInvoiceSettledRequest,
    requestDeserialize: deserialize_fulmine_v1_IsInvoiceSettledRequest,
    responseSerialize: serialize_fulmine_v1_IsInvoiceSettledResponse,
    responseDeserialize: deserialize_fulmine_v1_IsInvoiceSettledResponse,
  },
  // GetDelegatePublicKey retrieves the Fulmine's public key to be included in VTXO scripts.
getDelegatePublicKey: {
    path: '/fulmine.v1.Service/GetDelegatePublicKey',
    requestStream: false,
    responseStream: false,
    requestType: ark_service_pb.GetDelegatePublicKeyRequest,
    responseType: ark_service_pb.GetDelegatePublicKeyResponse,
    requestSerialize: serialize_fulmine_v1_GetDelegatePublicKeyRequest,
    requestDeserialize: deserialize_fulmine_v1_GetDelegatePublicKeyRequest,
    responseSerialize: serialize_fulmine_v1_GetDelegatePublicKeyResponse,
    responseDeserialize: deserialize_fulmine_v1_GetDelegatePublicKeyResponse,
  },
  // WatchAddressForRollover watches an address for rollover
watchAddressForRollover: {
    path: '/fulmine.v1.Service/WatchAddressForRollover',
    requestStream: false,
    responseStream: false,
    requestType: ark_service_pb.WatchAddressForRolloverRequest,
    responseType: ark_service_pb.WatchAddressForRolloverResponse,
    requestSerialize: serialize_fulmine_v1_WatchAddressForRolloverRequest,
    requestDeserialize: deserialize_fulmine_v1_WatchAddressForRolloverRequest,
    responseSerialize: serialize_fulmine_v1_WatchAddressForRolloverResponse,
    responseDeserialize: deserialize_fulmine_v1_WatchAddressForRolloverResponse,
  },
  // UnwatchAddress unsubscribes an address from vtxo rollover
unwatchAddress: {
    path: '/fulmine.v1.Service/UnwatchAddress',
    requestStream: false,
    responseStream: false,
    requestType: ark_service_pb.UnwatchAddressRequest,
    responseType: ark_service_pb.UnwatchAddressResponse,
    requestSerialize: serialize_fulmine_v1_UnwatchAddressRequest,
    requestDeserialize: deserialize_fulmine_v1_UnwatchAddressRequest,
    responseSerialize: serialize_fulmine_v1_UnwatchAddressResponse,
    responseDeserialize: deserialize_fulmine_v1_UnwatchAddressResponse,
  },
  // ListWatchedAddresses lists all watched addresses
listWatchedAddresses: {
    path: '/fulmine.v1.Service/ListWatchedAddresses',
    requestStream: false,
    responseStream: false,
    requestType: ark_service_pb.ListWatchedAddressesRequest,
    responseType: ark_service_pb.ListWatchedAddressesResponse,
    requestSerialize: serialize_fulmine_v1_ListWatchedAddressesRequest,
    requestDeserialize: deserialize_fulmine_v1_ListWatchedAddressesRequest,
    responseSerialize: serialize_fulmine_v1_ListWatchedAddressesResponse,
    responseDeserialize: deserialize_fulmine_v1_ListWatchedAddressesResponse,
  },
  // GetVirtualTxs returns the virtual transactions in hex format for the specified txids.
getVirtualTxs: {
    path: '/fulmine.v1.Service/GetVirtualTxs',
    requestStream: false,
    responseStream: false,
    requestType: ark_service_pb.GetVirtualTxsRequest,
    responseType: ark_service_pb.GetVirtualTxsResponse,
    requestSerialize: serialize_fulmine_v1_GetVirtualTxsRequest,
    requestDeserialize: deserialize_fulmine_v1_GetVirtualTxsRequest,
    responseSerialize: serialize_fulmine_v1_GetVirtualTxsResponse,
    responseDeserialize: deserialize_fulmine_v1_GetVirtualTxsResponse,
  },
};

exports.ServiceClient = grpc.makeGenericClientConstructor(ServiceService, 'Service');
