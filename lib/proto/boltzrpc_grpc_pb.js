// GENERATED CODE -- DO NOT EDIT!

'use strict';
var grpc = require('@grpc/grpc-js');
var boltzrpc_pb = require('./boltzrpc_pb.js');

function serialize_boltzrpc_AddReferralRequest(arg) {
  if (!(arg instanceof boltzrpc_pb.AddReferralRequest)) {
    throw new Error('Expected argument of type boltzrpc.AddReferralRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_boltzrpc_AddReferralRequest(buffer_arg) {
  return boltzrpc_pb.AddReferralRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_boltzrpc_AddReferralResponse(arg) {
  if (!(arg instanceof boltzrpc_pb.AddReferralResponse)) {
    throw new Error('Expected argument of type boltzrpc.AddReferralResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_boltzrpc_AddReferralResponse(buffer_arg) {
  return boltzrpc_pb.AddReferralResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_boltzrpc_AllowRefundRequest(arg) {
  if (!(arg instanceof boltzrpc_pb.AllowRefundRequest)) {
    throw new Error('Expected argument of type boltzrpc.AllowRefundRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_boltzrpc_AllowRefundRequest(buffer_arg) {
  return boltzrpc_pb.AllowRefundRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_boltzrpc_AllowRefundResponse(arg) {
  if (!(arg instanceof boltzrpc_pb.AllowRefundResponse)) {
    throw new Error('Expected argument of type boltzrpc.AllowRefundResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_boltzrpc_AllowRefundResponse(buffer_arg) {
  return boltzrpc_pb.AllowRefundResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_boltzrpc_CalculateTransactionFeeRequest(arg) {
  if (!(arg instanceof boltzrpc_pb.CalculateTransactionFeeRequest)) {
    throw new Error('Expected argument of type boltzrpc.CalculateTransactionFeeRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_boltzrpc_CalculateTransactionFeeRequest(buffer_arg) {
  return boltzrpc_pb.CalculateTransactionFeeRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_boltzrpc_CalculateTransactionFeeResponse(arg) {
  if (!(arg instanceof boltzrpc_pb.CalculateTransactionFeeResponse)) {
    throw new Error('Expected argument of type boltzrpc.CalculateTransactionFeeResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_boltzrpc_CalculateTransactionFeeResponse(buffer_arg) {
  return boltzrpc_pb.CalculateTransactionFeeResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_boltzrpc_DeriveBlindingKeyRequest(arg) {
  if (!(arg instanceof boltzrpc_pb.DeriveBlindingKeyRequest)) {
    throw new Error('Expected argument of type boltzrpc.DeriveBlindingKeyRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_boltzrpc_DeriveBlindingKeyRequest(buffer_arg) {
  return boltzrpc_pb.DeriveBlindingKeyRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_boltzrpc_DeriveBlindingKeyResponse(arg) {
  if (!(arg instanceof boltzrpc_pb.DeriveBlindingKeyResponse)) {
    throw new Error('Expected argument of type boltzrpc.DeriveBlindingKeyResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_boltzrpc_DeriveBlindingKeyResponse(buffer_arg) {
  return boltzrpc_pb.DeriveBlindingKeyResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

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

function serialize_boltzrpc_DevHeapDumpRequest(arg) {
  if (!(arg instanceof boltzrpc_pb.DevHeapDumpRequest)) {
    throw new Error('Expected argument of type boltzrpc.DevHeapDumpRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_boltzrpc_DevHeapDumpRequest(buffer_arg) {
  return boltzrpc_pb.DevHeapDumpRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_boltzrpc_DevHeapDumpResponse(arg) {
  if (!(arg instanceof boltzrpc_pb.DevHeapDumpResponse)) {
    throw new Error('Expected argument of type boltzrpc.DevHeapDumpResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_boltzrpc_DevHeapDumpResponse(buffer_arg) {
  return boltzrpc_pb.DevHeapDumpResponse.deserializeBinary(new Uint8Array(buffer_arg));
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

function serialize_boltzrpc_GetLabelRequest(arg) {
  if (!(arg instanceof boltzrpc_pb.GetLabelRequest)) {
    throw new Error('Expected argument of type boltzrpc.GetLabelRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_boltzrpc_GetLabelRequest(buffer_arg) {
  return boltzrpc_pb.GetLabelRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_boltzrpc_GetLabelResponse(arg) {
  if (!(arg instanceof boltzrpc_pb.GetLabelResponse)) {
    throw new Error('Expected argument of type boltzrpc.GetLabelResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_boltzrpc_GetLabelResponse(buffer_arg) {
  return boltzrpc_pb.GetLabelResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_boltzrpc_GetLockedFundsRequest(arg) {
  if (!(arg instanceof boltzrpc_pb.GetLockedFundsRequest)) {
    throw new Error('Expected argument of type boltzrpc.GetLockedFundsRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_boltzrpc_GetLockedFundsRequest(buffer_arg) {
  return boltzrpc_pb.GetLockedFundsRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_boltzrpc_GetLockedFundsResponse(arg) {
  if (!(arg instanceof boltzrpc_pb.GetLockedFundsResponse)) {
    throw new Error('Expected argument of type boltzrpc.GetLockedFundsResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_boltzrpc_GetLockedFundsResponse(buffer_arg) {
  return boltzrpc_pb.GetLockedFundsResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_boltzrpc_GetPendingSweepsRequest(arg) {
  if (!(arg instanceof boltzrpc_pb.GetPendingSweepsRequest)) {
    throw new Error('Expected argument of type boltzrpc.GetPendingSweepsRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_boltzrpc_GetPendingSweepsRequest(buffer_arg) {
  return boltzrpc_pb.GetPendingSweepsRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_boltzrpc_GetPendingSweepsResponse(arg) {
  if (!(arg instanceof boltzrpc_pb.GetPendingSweepsResponse)) {
    throw new Error('Expected argument of type boltzrpc.GetPendingSweepsResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_boltzrpc_GetPendingSweepsResponse(buffer_arg) {
  return boltzrpc_pb.GetPendingSweepsResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_boltzrpc_GetReferralsRequest(arg) {
  if (!(arg instanceof boltzrpc_pb.GetReferralsRequest)) {
    throw new Error('Expected argument of type boltzrpc.GetReferralsRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_boltzrpc_GetReferralsRequest(buffer_arg) {
  return boltzrpc_pb.GetReferralsRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_boltzrpc_GetReferralsResponse(arg) {
  if (!(arg instanceof boltzrpc_pb.GetReferralsResponse)) {
    throw new Error('Expected argument of type boltzrpc.GetReferralsResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_boltzrpc_GetReferralsResponse(buffer_arg) {
  return boltzrpc_pb.GetReferralsResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_boltzrpc_ListSwapsRequest(arg) {
  if (!(arg instanceof boltzrpc_pb.ListSwapsRequest)) {
    throw new Error('Expected argument of type boltzrpc.ListSwapsRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_boltzrpc_ListSwapsRequest(buffer_arg) {
  return boltzrpc_pb.ListSwapsRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_boltzrpc_ListSwapsResponse(arg) {
  if (!(arg instanceof boltzrpc_pb.ListSwapsResponse)) {
    throw new Error('Expected argument of type boltzrpc.ListSwapsResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_boltzrpc_ListSwapsResponse(buffer_arg) {
  return boltzrpc_pb.ListSwapsResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_boltzrpc_RescanRequest(arg) {
  if (!(arg instanceof boltzrpc_pb.RescanRequest)) {
    throw new Error('Expected argument of type boltzrpc.RescanRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_boltzrpc_RescanRequest(buffer_arg) {
  return boltzrpc_pb.RescanRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_boltzrpc_RescanResponse(arg) {
  if (!(arg instanceof boltzrpc_pb.RescanResponse)) {
    throw new Error('Expected argument of type boltzrpc.RescanResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_boltzrpc_RescanResponse(buffer_arg) {
  return boltzrpc_pb.RescanResponse.deserializeBinary(new Uint8Array(buffer_arg));
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

function serialize_boltzrpc_SetLogLevelRequest(arg) {
  if (!(arg instanceof boltzrpc_pb.SetLogLevelRequest)) {
    throw new Error('Expected argument of type boltzrpc.SetLogLevelRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_boltzrpc_SetLogLevelRequest(buffer_arg) {
  return boltzrpc_pb.SetLogLevelRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_boltzrpc_SetLogLevelResponse(arg) {
  if (!(arg instanceof boltzrpc_pb.SetLogLevelResponse)) {
    throw new Error('Expected argument of type boltzrpc.SetLogLevelResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_boltzrpc_SetLogLevelResponse(buffer_arg) {
  return boltzrpc_pb.SetLogLevelResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_boltzrpc_SetReferralRequest(arg) {
  if (!(arg instanceof boltzrpc_pb.SetReferralRequest)) {
    throw new Error('Expected argument of type boltzrpc.SetReferralRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_boltzrpc_SetReferralRequest(buffer_arg) {
  return boltzrpc_pb.SetReferralRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_boltzrpc_SetReferralResponse(arg) {
  if (!(arg instanceof boltzrpc_pb.SetReferralResponse)) {
    throw new Error('Expected argument of type boltzrpc.SetReferralResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_boltzrpc_SetReferralResponse(buffer_arg) {
  return boltzrpc_pb.SetReferralResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_boltzrpc_SetSwapStatusRequest(arg) {
  if (!(arg instanceof boltzrpc_pb.SetSwapStatusRequest)) {
    throw new Error('Expected argument of type boltzrpc.SetSwapStatusRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_boltzrpc_SetSwapStatusRequest(buffer_arg) {
  return boltzrpc_pb.SetSwapStatusRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_boltzrpc_SetSwapStatusResponse(arg) {
  if (!(arg instanceof boltzrpc_pb.SetSwapStatusResponse)) {
    throw new Error('Expected argument of type boltzrpc.SetSwapStatusResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_boltzrpc_SetSwapStatusResponse(buffer_arg) {
  return boltzrpc_pb.SetSwapStatusResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_boltzrpc_StopRequest(arg) {
  if (!(arg instanceof boltzrpc_pb.StopRequest)) {
    throw new Error('Expected argument of type boltzrpc.StopRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_boltzrpc_StopRequest(buffer_arg) {
  return boltzrpc_pb.StopRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_boltzrpc_StopResponse(arg) {
  if (!(arg instanceof boltzrpc_pb.StopResponse)) {
    throw new Error('Expected argument of type boltzrpc.StopResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_boltzrpc_StopResponse(buffer_arg) {
  return boltzrpc_pb.StopResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_boltzrpc_SweepSwapsRequest(arg) {
  if (!(arg instanceof boltzrpc_pb.SweepSwapsRequest)) {
    throw new Error('Expected argument of type boltzrpc.SweepSwapsRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_boltzrpc_SweepSwapsRequest(buffer_arg) {
  return boltzrpc_pb.SweepSwapsRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_boltzrpc_SweepSwapsResponse(arg) {
  if (!(arg instanceof boltzrpc_pb.SweepSwapsResponse)) {
    throw new Error('Expected argument of type boltzrpc.SweepSwapsResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_boltzrpc_SweepSwapsResponse(buffer_arg) {
  return boltzrpc_pb.SweepSwapsResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_boltzrpc_UnblindOutputsRequest(arg) {
  if (!(arg instanceof boltzrpc_pb.UnblindOutputsRequest)) {
    throw new Error('Expected argument of type boltzrpc.UnblindOutputsRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_boltzrpc_UnblindOutputsRequest(buffer_arg) {
  return boltzrpc_pb.UnblindOutputsRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_boltzrpc_UnblindOutputsResponse(arg) {
  if (!(arg instanceof boltzrpc_pb.UnblindOutputsResponse)) {
    throw new Error('Expected argument of type boltzrpc.UnblindOutputsResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_boltzrpc_UnblindOutputsResponse(buffer_arg) {
  return boltzrpc_pb.UnblindOutputsResponse.deserializeBinary(new Uint8Array(buffer_arg));
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
  stop: {
    path: '/boltzrpc.Boltz/Stop',
    requestStream: false,
    responseStream: false,
    requestType: boltzrpc_pb.StopRequest,
    responseType: boltzrpc_pb.StopResponse,
    requestSerialize: serialize_boltzrpc_StopRequest,
    requestDeserialize: deserialize_boltzrpc_StopRequest,
    responseSerialize: serialize_boltzrpc_StopResponse,
    responseDeserialize: deserialize_boltzrpc_StopResponse,
  },
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
  deriveBlindingKeys: {
    path: '/boltzrpc.Boltz/DeriveBlindingKeys',
    requestStream: false,
    responseStream: false,
    requestType: boltzrpc_pb.DeriveBlindingKeyRequest,
    responseType: boltzrpc_pb.DeriveBlindingKeyResponse,
    requestSerialize: serialize_boltzrpc_DeriveBlindingKeyRequest,
    requestDeserialize: deserialize_boltzrpc_DeriveBlindingKeyRequest,
    responseSerialize: serialize_boltzrpc_DeriveBlindingKeyResponse,
    responseDeserialize: deserialize_boltzrpc_DeriveBlindingKeyResponse,
  },
  unblindOutputs: {
    path: '/boltzrpc.Boltz/UnblindOutputs',
    requestStream: false,
    responseStream: false,
    requestType: boltzrpc_pb.UnblindOutputsRequest,
    responseType: boltzrpc_pb.UnblindOutputsResponse,
    requestSerialize: serialize_boltzrpc_UnblindOutputsRequest,
    requestDeserialize: deserialize_boltzrpc_UnblindOutputsRequest,
    responseSerialize: serialize_boltzrpc_UnblindOutputsResponse,
    responseDeserialize: deserialize_boltzrpc_UnblindOutputsResponse,
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
  // Adds a new referral ID to the database 
addReferral: {
    path: '/boltzrpc.Boltz/AddReferral',
    requestStream: false,
    responseStream: false,
    requestType: boltzrpc_pb.AddReferralRequest,
    responseType: boltzrpc_pb.AddReferralResponse,
    requestSerialize: serialize_boltzrpc_AddReferralRequest,
    requestDeserialize: deserialize_boltzrpc_AddReferralRequest,
    responseSerialize: serialize_boltzrpc_AddReferralResponse,
    responseDeserialize: deserialize_boltzrpc_AddReferralResponse,
  },
  // Modifies the status of a swap 
setSwapStatus: {
    path: '/boltzrpc.Boltz/SetSwapStatus',
    requestStream: false,
    responseStream: false,
    requestType: boltzrpc_pb.SetSwapStatusRequest,
    responseType: boltzrpc_pb.SetSwapStatusResponse,
    requestSerialize: serialize_boltzrpc_SetSwapStatusRequest,
    requestDeserialize: deserialize_boltzrpc_SetSwapStatusRequest,
    responseSerialize: serialize_boltzrpc_SetSwapStatusResponse,
    responseDeserialize: deserialize_boltzrpc_SetSwapStatusResponse,
  },
  // Disables safety checks to allow for a cooperative refund for a swap 
allowRefund: {
    path: '/boltzrpc.Boltz/AllowRefund',
    requestStream: false,
    responseStream: false,
    requestType: boltzrpc_pb.AllowRefundRequest,
    responseType: boltzrpc_pb.AllowRefundResponse,
    requestSerialize: serialize_boltzrpc_AllowRefundRequest,
    requestDeserialize: deserialize_boltzrpc_AllowRefundRequest,
    responseSerialize: serialize_boltzrpc_AllowRefundResponse,
    responseDeserialize: deserialize_boltzrpc_AllowRefundResponse,
  },
  // Gets funds locked by the server for swaps 
getLockedFunds: {
    path: '/boltzrpc.Boltz/GetLockedFunds',
    requestStream: false,
    responseStream: false,
    requestType: boltzrpc_pb.GetLockedFundsRequest,
    responseType: boltzrpc_pb.GetLockedFundsResponse,
    requestSerialize: serialize_boltzrpc_GetLockedFundsRequest,
    requestDeserialize: deserialize_boltzrpc_GetLockedFundsRequest,
    responseSerialize: serialize_boltzrpc_GetLockedFundsResponse,
    responseDeserialize: deserialize_boltzrpc_GetLockedFundsResponse,
  },
  // Gets funds pending for sweep by the server 
getPendingSweeps: {
    path: '/boltzrpc.Boltz/GetPendingSweeps',
    requestStream: false,
    responseStream: false,
    requestType: boltzrpc_pb.GetPendingSweepsRequest,
    responseType: boltzrpc_pb.GetPendingSweepsResponse,
    requestSerialize: serialize_boltzrpc_GetPendingSweepsRequest,
    requestDeserialize: deserialize_boltzrpc_GetPendingSweepsRequest,
    responseSerialize: serialize_boltzrpc_GetPendingSweepsResponse,
    responseDeserialize: deserialize_boltzrpc_GetPendingSweepsResponse,
  },
  sweepSwaps: {
    path: '/boltzrpc.Boltz/SweepSwaps',
    requestStream: false,
    responseStream: false,
    requestType: boltzrpc_pb.SweepSwapsRequest,
    responseType: boltzrpc_pb.SweepSwapsResponse,
    requestSerialize: serialize_boltzrpc_SweepSwapsRequest,
    requestDeserialize: deserialize_boltzrpc_SweepSwapsRequest,
    responseSerialize: serialize_boltzrpc_SweepSwapsResponse,
    responseDeserialize: deserialize_boltzrpc_SweepSwapsResponse,
  },
  listSwaps: {
    path: '/boltzrpc.Boltz/ListSwaps',
    requestStream: false,
    responseStream: false,
    requestType: boltzrpc_pb.ListSwapsRequest,
    responseType: boltzrpc_pb.ListSwapsResponse,
    requestSerialize: serialize_boltzrpc_ListSwapsRequest,
    requestDeserialize: deserialize_boltzrpc_ListSwapsRequest,
    responseSerialize: serialize_boltzrpc_ListSwapsResponse,
    responseDeserialize: deserialize_boltzrpc_ListSwapsResponse,
  },
  rescan: {
    path: '/boltzrpc.Boltz/Rescan',
    requestStream: false,
    responseStream: false,
    requestType: boltzrpc_pb.RescanRequest,
    responseType: boltzrpc_pb.RescanResponse,
    requestSerialize: serialize_boltzrpc_RescanRequest,
    requestDeserialize: deserialize_boltzrpc_RescanRequest,
    responseSerialize: serialize_boltzrpc_RescanResponse,
    responseDeserialize: deserialize_boltzrpc_RescanResponse,
  },
  getLabel: {
    path: '/boltzrpc.Boltz/GetLabel',
    requestStream: false,
    responseStream: false,
    requestType: boltzrpc_pb.GetLabelRequest,
    responseType: boltzrpc_pb.GetLabelResponse,
    requestSerialize: serialize_boltzrpc_GetLabelRequest,
    requestDeserialize: deserialize_boltzrpc_GetLabelRequest,
    responseSerialize: serialize_boltzrpc_GetLabelResponse,
    responseDeserialize: deserialize_boltzrpc_GetLabelResponse,
  },
  getReferrals: {
    path: '/boltzrpc.Boltz/GetReferrals',
    requestStream: false,
    responseStream: false,
    requestType: boltzrpc_pb.GetReferralsRequest,
    responseType: boltzrpc_pb.GetReferralsResponse,
    requestSerialize: serialize_boltzrpc_GetReferralsRequest,
    requestDeserialize: deserialize_boltzrpc_GetReferralsRequest,
    responseSerialize: serialize_boltzrpc_GetReferralsResponse,
    responseDeserialize: deserialize_boltzrpc_GetReferralsResponse,
  },
  setReferral: {
    path: '/boltzrpc.Boltz/SetReferral',
    requestStream: false,
    responseStream: false,
    requestType: boltzrpc_pb.SetReferralRequest,
    responseType: boltzrpc_pb.SetReferralResponse,
    requestSerialize: serialize_boltzrpc_SetReferralRequest,
    requestDeserialize: deserialize_boltzrpc_SetReferralRequest,
    responseSerialize: serialize_boltzrpc_SetReferralResponse,
    responseDeserialize: deserialize_boltzrpc_SetReferralResponse,
  },
  calculateTransactionFee: {
    path: '/boltzrpc.Boltz/CalculateTransactionFee',
    requestStream: false,
    responseStream: false,
    requestType: boltzrpc_pb.CalculateTransactionFeeRequest,
    responseType: boltzrpc_pb.CalculateTransactionFeeResponse,
    requestSerialize: serialize_boltzrpc_CalculateTransactionFeeRequest,
    requestDeserialize: deserialize_boltzrpc_CalculateTransactionFeeRequest,
    responseSerialize: serialize_boltzrpc_CalculateTransactionFeeResponse,
    responseDeserialize: deserialize_boltzrpc_CalculateTransactionFeeResponse,
  },
  setLogLevel: {
    path: '/boltzrpc.Boltz/SetLogLevel',
    requestStream: false,
    responseStream: false,
    requestType: boltzrpc_pb.SetLogLevelRequest,
    responseType: boltzrpc_pb.SetLogLevelResponse,
    requestSerialize: serialize_boltzrpc_SetLogLevelRequest,
    requestDeserialize: deserialize_boltzrpc_SetLogLevelRequest,
    responseSerialize: serialize_boltzrpc_SetLogLevelResponse,
    responseDeserialize: deserialize_boltzrpc_SetLogLevelResponse,
  },
  devHeapDump: {
    path: '/boltzrpc.Boltz/DevHeapDump',
    requestStream: false,
    responseStream: false,
    requestType: boltzrpc_pb.DevHeapDumpRequest,
    responseType: boltzrpc_pb.DevHeapDumpResponse,
    requestSerialize: serialize_boltzrpc_DevHeapDumpRequest,
    requestDeserialize: deserialize_boltzrpc_DevHeapDumpRequest,
    responseSerialize: serialize_boltzrpc_DevHeapDumpResponse,
    responseDeserialize: deserialize_boltzrpc_DevHeapDumpResponse,
  },
};

exports.BoltzClient = grpc.makeGenericClientConstructor(BoltzService);
