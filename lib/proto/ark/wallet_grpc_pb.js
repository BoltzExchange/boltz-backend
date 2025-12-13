// GENERATED CODE -- DO NOT EDIT!

'use strict';
var grpc = require('@grpc/grpc-js');
var ark_wallet_pb = require('../ark/wallet_pb.js');
var google_api_annotations_pb = require('../google/api/annotations_pb.js');

function serialize_fulmine_v1_AuthRequest(arg) {
  if (!(arg instanceof ark_wallet_pb.AuthRequest)) {
    throw new Error('Expected argument of type fulmine.v1.AuthRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fulmine_v1_AuthRequest(buffer_arg) {
  return ark_wallet_pb.AuthRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fulmine_v1_AuthResponse(arg) {
  if (!(arg instanceof ark_wallet_pb.AuthResponse)) {
    throw new Error('Expected argument of type fulmine.v1.AuthResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fulmine_v1_AuthResponse(buffer_arg) {
  return ark_wallet_pb.AuthResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fulmine_v1_ChangePasswordRequest(arg) {
  if (!(arg instanceof ark_wallet_pb.ChangePasswordRequest)) {
    throw new Error('Expected argument of type fulmine.v1.ChangePasswordRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fulmine_v1_ChangePasswordRequest(buffer_arg) {
  return ark_wallet_pb.ChangePasswordRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fulmine_v1_ChangePasswordResponse(arg) {
  if (!(arg instanceof ark_wallet_pb.ChangePasswordResponse)) {
    throw new Error('Expected argument of type fulmine.v1.ChangePasswordResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fulmine_v1_ChangePasswordResponse(buffer_arg) {
  return ark_wallet_pb.ChangePasswordResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fulmine_v1_CreateWalletRequest(arg) {
  if (!(arg instanceof ark_wallet_pb.CreateWalletRequest)) {
    throw new Error('Expected argument of type fulmine.v1.CreateWalletRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fulmine_v1_CreateWalletRequest(buffer_arg) {
  return ark_wallet_pb.CreateWalletRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fulmine_v1_CreateWalletResponse(arg) {
  if (!(arg instanceof ark_wallet_pb.CreateWalletResponse)) {
    throw new Error('Expected argument of type fulmine.v1.CreateWalletResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fulmine_v1_CreateWalletResponse(buffer_arg) {
  return ark_wallet_pb.CreateWalletResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fulmine_v1_GenSeedRequest(arg) {
  if (!(arg instanceof ark_wallet_pb.GenSeedRequest)) {
    throw new Error('Expected argument of type fulmine.v1.GenSeedRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fulmine_v1_GenSeedRequest(buffer_arg) {
  return ark_wallet_pb.GenSeedRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fulmine_v1_GenSeedResponse(arg) {
  if (!(arg instanceof ark_wallet_pb.GenSeedResponse)) {
    throw new Error('Expected argument of type fulmine.v1.GenSeedResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fulmine_v1_GenSeedResponse(buffer_arg) {
  return ark_wallet_pb.GenSeedResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fulmine_v1_LockRequest(arg) {
  if (!(arg instanceof ark_wallet_pb.LockRequest)) {
    throw new Error('Expected argument of type fulmine.v1.LockRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fulmine_v1_LockRequest(buffer_arg) {
  return ark_wallet_pb.LockRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fulmine_v1_LockResponse(arg) {
  if (!(arg instanceof ark_wallet_pb.LockResponse)) {
    throw new Error('Expected argument of type fulmine.v1.LockResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fulmine_v1_LockResponse(buffer_arg) {
  return ark_wallet_pb.LockResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fulmine_v1_RestoreWalletRequest(arg) {
  if (!(arg instanceof ark_wallet_pb.RestoreWalletRequest)) {
    throw new Error('Expected argument of type fulmine.v1.RestoreWalletRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fulmine_v1_RestoreWalletRequest(buffer_arg) {
  return ark_wallet_pb.RestoreWalletRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fulmine_v1_RestoreWalletResponse(arg) {
  if (!(arg instanceof ark_wallet_pb.RestoreWalletResponse)) {
    throw new Error('Expected argument of type fulmine.v1.RestoreWalletResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fulmine_v1_RestoreWalletResponse(buffer_arg) {
  return ark_wallet_pb.RestoreWalletResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fulmine_v1_StatusRequest(arg) {
  if (!(arg instanceof ark_wallet_pb.StatusRequest)) {
    throw new Error('Expected argument of type fulmine.v1.StatusRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fulmine_v1_StatusRequest(buffer_arg) {
  return ark_wallet_pb.StatusRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fulmine_v1_StatusResponse(arg) {
  if (!(arg instanceof ark_wallet_pb.StatusResponse)) {
    throw new Error('Expected argument of type fulmine.v1.StatusResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fulmine_v1_StatusResponse(buffer_arg) {
  return ark_wallet_pb.StatusResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fulmine_v1_UnlockRequest(arg) {
  if (!(arg instanceof ark_wallet_pb.UnlockRequest)) {
    throw new Error('Expected argument of type fulmine.v1.UnlockRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fulmine_v1_UnlockRequest(buffer_arg) {
  return ark_wallet_pb.UnlockRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fulmine_v1_UnlockResponse(arg) {
  if (!(arg instanceof ark_wallet_pb.UnlockResponse)) {
    throw new Error('Expected argument of type fulmine.v1.UnlockResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fulmine_v1_UnlockResponse(buffer_arg) {
  return ark_wallet_pb.UnlockResponse.deserializeBinary(new Uint8Array(buffer_arg));
}


// WalletService is used to create, or restore an HD Wallet.
// It stores signing seed used for signing of transactions.
// After an HD Wallet is created, the seeds are encrypted and persisted.
// Every time a WalletService is (re)started, it needs to be unlocked with the
// encryption password.
var WalletServiceService = exports.WalletServiceService = {
  // GenSeed returns signing seed that should be used to create a new HD Wallet.
genSeed: {
    path: '/fulmine.v1.WalletService/GenSeed',
    requestStream: false,
    responseStream: false,
    requestType: ark_wallet_pb.GenSeedRequest,
    responseType: ark_wallet_pb.GenSeedResponse,
    requestSerialize: serialize_fulmine_v1_GenSeedRequest,
    requestDeserialize: deserialize_fulmine_v1_GenSeedRequest,
    responseSerialize: serialize_fulmine_v1_GenSeedResponse,
    responseDeserialize: deserialize_fulmine_v1_GenSeedResponse,
  },
  // CreateWallet creates an HD Wallet based on signing seeds,
// encrypts them with the password and persists the encrypted seeds.
createWallet: {
    path: '/fulmine.v1.WalletService/CreateWallet',
    requestStream: false,
    responseStream: false,
    requestType: ark_wallet_pb.CreateWalletRequest,
    responseType: ark_wallet_pb.CreateWalletResponse,
    requestSerialize: serialize_fulmine_v1_CreateWalletRequest,
    requestDeserialize: deserialize_fulmine_v1_CreateWalletRequest,
    responseSerialize: serialize_fulmine_v1_CreateWalletResponse,
    responseDeserialize: deserialize_fulmine_v1_CreateWalletResponse,
  },
  // Unlock tries to unlock the HD Wallet using the given password.
unlock: {
    path: '/fulmine.v1.WalletService/Unlock',
    requestStream: false,
    responseStream: false,
    requestType: ark_wallet_pb.UnlockRequest,
    responseType: ark_wallet_pb.UnlockResponse,
    requestSerialize: serialize_fulmine_v1_UnlockRequest,
    requestDeserialize: deserialize_fulmine_v1_UnlockRequest,
    responseSerialize: serialize_fulmine_v1_UnlockResponse,
    responseDeserialize: deserialize_fulmine_v1_UnlockResponse,
  },
  // Lock locks the HD wallet.
lock: {
    path: '/fulmine.v1.WalletService/Lock',
    requestStream: false,
    responseStream: false,
    requestType: ark_wallet_pb.LockRequest,
    responseType: ark_wallet_pb.LockResponse,
    requestSerialize: serialize_fulmine_v1_LockRequest,
    requestDeserialize: deserialize_fulmine_v1_LockRequest,
    responseSerialize: serialize_fulmine_v1_LockResponse,
    responseDeserialize: deserialize_fulmine_v1_LockResponse,
  },
  // ChangePassword changes the password used to encrypt/decrypt the HD seeds.
// It requires the wallet to be locked.
changePassword: {
    path: '/fulmine.v1.WalletService/ChangePassword',
    requestStream: false,
    responseStream: false,
    requestType: ark_wallet_pb.ChangePasswordRequest,
    responseType: ark_wallet_pb.ChangePasswordResponse,
    requestSerialize: serialize_fulmine_v1_ChangePasswordRequest,
    requestDeserialize: deserialize_fulmine_v1_ChangePasswordRequest,
    responseSerialize: serialize_fulmine_v1_ChangePasswordResponse,
    responseDeserialize: deserialize_fulmine_v1_ChangePasswordResponse,
  },
  // RestoreWallet restores an HD Wallet based on signing seeds,
// encrypts them with the password and persists the encrypted seeds.
restoreWallet: {
    path: '/fulmine.v1.WalletService/RestoreWallet',
    requestStream: false,
    responseStream: true,
    requestType: ark_wallet_pb.RestoreWalletRequest,
    responseType: ark_wallet_pb.RestoreWalletResponse,
    requestSerialize: serialize_fulmine_v1_RestoreWalletRequest,
    requestDeserialize: deserialize_fulmine_v1_RestoreWalletRequest,
    responseSerialize: serialize_fulmine_v1_RestoreWalletResponse,
    responseDeserialize: deserialize_fulmine_v1_RestoreWalletResponse,
  },
  // Status returns info about the status of the wallet.
status: {
    path: '/fulmine.v1.WalletService/Status',
    requestStream: false,
    responseStream: false,
    requestType: ark_wallet_pb.StatusRequest,
    responseType: ark_wallet_pb.StatusResponse,
    requestSerialize: serialize_fulmine_v1_StatusRequest,
    requestDeserialize: deserialize_fulmine_v1_StatusRequest,
    responseSerialize: serialize_fulmine_v1_StatusResponse,
    responseDeserialize: deserialize_fulmine_v1_StatusResponse,
  },
  // Auth verifies whether the given password is valid without unlocking the wallet
auth: {
    path: '/fulmine.v1.WalletService/Auth',
    requestStream: false,
    responseStream: false,
    requestType: ark_wallet_pb.AuthRequest,
    responseType: ark_wallet_pb.AuthResponse,
    requestSerialize: serialize_fulmine_v1_AuthRequest,
    requestDeserialize: deserialize_fulmine_v1_AuthRequest,
    responseSerialize: serialize_fulmine_v1_AuthResponse,
    responseDeserialize: deserialize_fulmine_v1_AuthResponse,
  },
};

exports.WalletServiceClient = grpc.makeGenericClientConstructor(WalletServiceService, 'WalletService');
