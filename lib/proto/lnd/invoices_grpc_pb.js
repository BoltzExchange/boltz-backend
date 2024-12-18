// GENERATED CODE -- DO NOT EDIT!

'use strict';
var grpc = require('@grpc/grpc-js');
var lnd_invoices_pb = require('../lnd/invoices_pb.js');
var lnd_rpc_pb = require('../lnd/rpc_pb.js');

function serialize_invoicesrpc_AddHoldInvoiceRequest(arg) {
  if (!(arg instanceof lnd_invoices_pb.AddHoldInvoiceRequest)) {
    throw new Error('Expected argument of type invoicesrpc.AddHoldInvoiceRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_invoicesrpc_AddHoldInvoiceRequest(buffer_arg) {
  return lnd_invoices_pb.AddHoldInvoiceRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_invoicesrpc_AddHoldInvoiceResp(arg) {
  if (!(arg instanceof lnd_invoices_pb.AddHoldInvoiceResp)) {
    throw new Error('Expected argument of type invoicesrpc.AddHoldInvoiceResp');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_invoicesrpc_AddHoldInvoiceResp(buffer_arg) {
  return lnd_invoices_pb.AddHoldInvoiceResp.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_invoicesrpc_CancelInvoiceMsg(arg) {
  if (!(arg instanceof lnd_invoices_pb.CancelInvoiceMsg)) {
    throw new Error('Expected argument of type invoicesrpc.CancelInvoiceMsg');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_invoicesrpc_CancelInvoiceMsg(buffer_arg) {
  return lnd_invoices_pb.CancelInvoiceMsg.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_invoicesrpc_CancelInvoiceResp(arg) {
  if (!(arg instanceof lnd_invoices_pb.CancelInvoiceResp)) {
    throw new Error('Expected argument of type invoicesrpc.CancelInvoiceResp');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_invoicesrpc_CancelInvoiceResp(buffer_arg) {
  return lnd_invoices_pb.CancelInvoiceResp.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_invoicesrpc_HtlcModifyRequest(arg) {
  if (!(arg instanceof lnd_invoices_pb.HtlcModifyRequest)) {
    throw new Error('Expected argument of type invoicesrpc.HtlcModifyRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_invoicesrpc_HtlcModifyRequest(buffer_arg) {
  return lnd_invoices_pb.HtlcModifyRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_invoicesrpc_HtlcModifyResponse(arg) {
  if (!(arg instanceof lnd_invoices_pb.HtlcModifyResponse)) {
    throw new Error('Expected argument of type invoicesrpc.HtlcModifyResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_invoicesrpc_HtlcModifyResponse(buffer_arg) {
  return lnd_invoices_pb.HtlcModifyResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_invoicesrpc_LookupInvoiceMsg(arg) {
  if (!(arg instanceof lnd_invoices_pb.LookupInvoiceMsg)) {
    throw new Error('Expected argument of type invoicesrpc.LookupInvoiceMsg');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_invoicesrpc_LookupInvoiceMsg(buffer_arg) {
  return lnd_invoices_pb.LookupInvoiceMsg.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_invoicesrpc_SettleInvoiceMsg(arg) {
  if (!(arg instanceof lnd_invoices_pb.SettleInvoiceMsg)) {
    throw new Error('Expected argument of type invoicesrpc.SettleInvoiceMsg');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_invoicesrpc_SettleInvoiceMsg(buffer_arg) {
  return lnd_invoices_pb.SettleInvoiceMsg.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_invoicesrpc_SettleInvoiceResp(arg) {
  if (!(arg instanceof lnd_invoices_pb.SettleInvoiceResp)) {
    throw new Error('Expected argument of type invoicesrpc.SettleInvoiceResp');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_invoicesrpc_SettleInvoiceResp(buffer_arg) {
  return lnd_invoices_pb.SettleInvoiceResp.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_invoicesrpc_SubscribeSingleInvoiceRequest(arg) {
  if (!(arg instanceof lnd_invoices_pb.SubscribeSingleInvoiceRequest)) {
    throw new Error('Expected argument of type invoicesrpc.SubscribeSingleInvoiceRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_invoicesrpc_SubscribeSingleInvoiceRequest(buffer_arg) {
  return lnd_invoices_pb.SubscribeSingleInvoiceRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_lnrpc_Invoice(arg) {
  if (!(arg instanceof lnd_rpc_pb.Invoice)) {
    throw new Error('Expected argument of type lnrpc.Invoice');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_lnrpc_Invoice(buffer_arg) {
  return lnd_rpc_pb.Invoice.deserializeBinary(new Uint8Array(buffer_arg));
}


//
// Comments in this file will be directly parsed into the API
// Documentation as descriptions of the associated method, message, or field.
// These descriptions should go right above the definition of the object, and
// can be in either block or // comment format.
//
// An RPC method can be matched to an lncli command by placing a line in the
// beginning of the description in exactly the following format:
// lncli: `methodname`
//
// Failure to specify the exact name of the command will cause documentation
// generation to fail.
//
// More information on how exactly the gRPC documentation is generated from
// this proto file can be found here:
// https://github.com/lightninglabs/lightning-api
//
// Invoices is a service that can be used to create, accept, settle and cancel
// invoices.
var InvoicesService = exports.InvoicesService = {
  //
// SubscribeSingleInvoice returns a uni-directional stream (server -> client)
// to notify the client of state transitions of the specified invoice.
// Initially the current invoice state is always sent out.
subscribeSingleInvoice: {
    path: '/invoicesrpc.Invoices/SubscribeSingleInvoice',
    requestStream: false,
    responseStream: true,
    requestType: lnd_invoices_pb.SubscribeSingleInvoiceRequest,
    responseType: lnd_rpc_pb.Invoice,
    requestSerialize: serialize_invoicesrpc_SubscribeSingleInvoiceRequest,
    requestDeserialize: deserialize_invoicesrpc_SubscribeSingleInvoiceRequest,
    responseSerialize: serialize_lnrpc_Invoice,
    responseDeserialize: deserialize_lnrpc_Invoice,
  },
  // lncli: `cancelinvoice`
// CancelInvoice cancels a currently open invoice. If the invoice is already
// canceled, this call will succeed. If the invoice is already settled, it will
// fail.
cancelInvoice: {
    path: '/invoicesrpc.Invoices/CancelInvoice',
    requestStream: false,
    responseStream: false,
    requestType: lnd_invoices_pb.CancelInvoiceMsg,
    responseType: lnd_invoices_pb.CancelInvoiceResp,
    requestSerialize: serialize_invoicesrpc_CancelInvoiceMsg,
    requestDeserialize: deserialize_invoicesrpc_CancelInvoiceMsg,
    responseSerialize: serialize_invoicesrpc_CancelInvoiceResp,
    responseDeserialize: deserialize_invoicesrpc_CancelInvoiceResp,
  },
  // lncli: `addholdinvoice`
// AddHoldInvoice creates a hold invoice. It ties the invoice to the hash
// supplied in the request.
addHoldInvoice: {
    path: '/invoicesrpc.Invoices/AddHoldInvoice',
    requestStream: false,
    responseStream: false,
    requestType: lnd_invoices_pb.AddHoldInvoiceRequest,
    responseType: lnd_invoices_pb.AddHoldInvoiceResp,
    requestSerialize: serialize_invoicesrpc_AddHoldInvoiceRequest,
    requestDeserialize: deserialize_invoicesrpc_AddHoldInvoiceRequest,
    responseSerialize: serialize_invoicesrpc_AddHoldInvoiceResp,
    responseDeserialize: deserialize_invoicesrpc_AddHoldInvoiceResp,
  },
  // lncli: `settleinvoice`
// SettleInvoice settles an accepted invoice. If the invoice is already
// settled, this call will succeed.
settleInvoice: {
    path: '/invoicesrpc.Invoices/SettleInvoice',
    requestStream: false,
    responseStream: false,
    requestType: lnd_invoices_pb.SettleInvoiceMsg,
    responseType: lnd_invoices_pb.SettleInvoiceResp,
    requestSerialize: serialize_invoicesrpc_SettleInvoiceMsg,
    requestDeserialize: deserialize_invoicesrpc_SettleInvoiceMsg,
    responseSerialize: serialize_invoicesrpc_SettleInvoiceResp,
    responseDeserialize: deserialize_invoicesrpc_SettleInvoiceResp,
  },
  //
// LookupInvoiceV2 attempts to look up at invoice. An invoice can be referenced
// using either its payment hash, payment address, or set ID.
lookupInvoiceV2: {
    path: '/invoicesrpc.Invoices/LookupInvoiceV2',
    requestStream: false,
    responseStream: false,
    requestType: lnd_invoices_pb.LookupInvoiceMsg,
    responseType: lnd_rpc_pb.Invoice,
    requestSerialize: serialize_invoicesrpc_LookupInvoiceMsg,
    requestDeserialize: deserialize_invoicesrpc_LookupInvoiceMsg,
    responseSerialize: serialize_lnrpc_Invoice,
    responseDeserialize: deserialize_lnrpc_Invoice,
  },
  //
// HtlcModifier is a bidirectional streaming RPC that allows a client to
// intercept and modify the HTLCs that attempt to settle the given invoice. The
// server will send HTLCs of invoices to the client and the client can modify
// some aspects of the HTLC in order to pass the invoice acceptance tests.
htlcModifier: {
    path: '/invoicesrpc.Invoices/HtlcModifier',
    requestStream: true,
    responseStream: true,
    requestType: lnd_invoices_pb.HtlcModifyResponse,
    responseType: lnd_invoices_pb.HtlcModifyRequest,
    requestSerialize: serialize_invoicesrpc_HtlcModifyResponse,
    requestDeserialize: deserialize_invoicesrpc_HtlcModifyResponse,
    responseSerialize: serialize_invoicesrpc_HtlcModifyRequest,
    responseDeserialize: deserialize_invoicesrpc_HtlcModifyRequest,
  },
};

exports.InvoicesClient = grpc.makeGenericClientConstructor(InvoicesService);
