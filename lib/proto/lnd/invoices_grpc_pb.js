// GENERATED CODE -- DO NOT EDIT!

'use strict';
var grpc = require('grpc');
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
  //
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
  //
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
  //
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
};

exports.InvoicesClient = grpc.makeGenericClientConstructor(InvoicesService);
