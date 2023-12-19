// GENERATED CODE -- DO NOT EDIT!

'use strict';
var grpc = require('@grpc/grpc-js');
var cln_node_pb = require('../cln/node_pb.js');
var cln_primitives_pb = require('../cln/primitives_pb.js');

function serialize_cln_AddgossipRequest(arg) {
  if (!(arg instanceof cln_node_pb.AddgossipRequest)) {
    throw new Error('Expected argument of type cln.AddgossipRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cln_AddgossipRequest(buffer_arg) {
  return cln_node_pb.AddgossipRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cln_AddgossipResponse(arg) {
  if (!(arg instanceof cln_node_pb.AddgossipResponse)) {
    throw new Error('Expected argument of type cln.AddgossipResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cln_AddgossipResponse(buffer_arg) {
  return cln_node_pb.AddgossipResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cln_AutocleaninvoiceRequest(arg) {
  if (!(arg instanceof cln_node_pb.AutocleaninvoiceRequest)) {
    throw new Error('Expected argument of type cln.AutocleaninvoiceRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cln_AutocleaninvoiceRequest(buffer_arg) {
  return cln_node_pb.AutocleaninvoiceRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cln_AutocleaninvoiceResponse(arg) {
  if (!(arg instanceof cln_node_pb.AutocleaninvoiceResponse)) {
    throw new Error('Expected argument of type cln.AutocleaninvoiceResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cln_AutocleaninvoiceResponse(buffer_arg) {
  return cln_node_pb.AutocleaninvoiceResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cln_CheckmessageRequest(arg) {
  if (!(arg instanceof cln_node_pb.CheckmessageRequest)) {
    throw new Error('Expected argument of type cln.CheckmessageRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cln_CheckmessageRequest(buffer_arg) {
  return cln_node_pb.CheckmessageRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cln_CheckmessageResponse(arg) {
  if (!(arg instanceof cln_node_pb.CheckmessageResponse)) {
    throw new Error('Expected argument of type cln.CheckmessageResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cln_CheckmessageResponse(buffer_arg) {
  return cln_node_pb.CheckmessageResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cln_CloseRequest(arg) {
  if (!(arg instanceof cln_node_pb.CloseRequest)) {
    throw new Error('Expected argument of type cln.CloseRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cln_CloseRequest(buffer_arg) {
  return cln_node_pb.CloseRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cln_CloseResponse(arg) {
  if (!(arg instanceof cln_node_pb.CloseResponse)) {
    throw new Error('Expected argument of type cln.CloseResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cln_CloseResponse(buffer_arg) {
  return cln_node_pb.CloseResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cln_ConnectRequest(arg) {
  if (!(arg instanceof cln_node_pb.ConnectRequest)) {
    throw new Error('Expected argument of type cln.ConnectRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cln_ConnectRequest(buffer_arg) {
  return cln_node_pb.ConnectRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cln_ConnectResponse(arg) {
  if (!(arg instanceof cln_node_pb.ConnectResponse)) {
    throw new Error('Expected argument of type cln.ConnectResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cln_ConnectResponse(buffer_arg) {
  return cln_node_pb.ConnectResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cln_CreateinvoiceRequest(arg) {
  if (!(arg instanceof cln_node_pb.CreateinvoiceRequest)) {
    throw new Error('Expected argument of type cln.CreateinvoiceRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cln_CreateinvoiceRequest(buffer_arg) {
  return cln_node_pb.CreateinvoiceRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cln_CreateinvoiceResponse(arg) {
  if (!(arg instanceof cln_node_pb.CreateinvoiceResponse)) {
    throw new Error('Expected argument of type cln.CreateinvoiceResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cln_CreateinvoiceResponse(buffer_arg) {
  return cln_node_pb.CreateinvoiceResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cln_CreateonionRequest(arg) {
  if (!(arg instanceof cln_node_pb.CreateonionRequest)) {
    throw new Error('Expected argument of type cln.CreateonionRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cln_CreateonionRequest(buffer_arg) {
  return cln_node_pb.CreateonionRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cln_CreateonionResponse(arg) {
  if (!(arg instanceof cln_node_pb.CreateonionResponse)) {
    throw new Error('Expected argument of type cln.CreateonionResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cln_CreateonionResponse(buffer_arg) {
  return cln_node_pb.CreateonionResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cln_DatastoreRequest(arg) {
  if (!(arg instanceof cln_node_pb.DatastoreRequest)) {
    throw new Error('Expected argument of type cln.DatastoreRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cln_DatastoreRequest(buffer_arg) {
  return cln_node_pb.DatastoreRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cln_DatastoreResponse(arg) {
  if (!(arg instanceof cln_node_pb.DatastoreResponse)) {
    throw new Error('Expected argument of type cln.DatastoreResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cln_DatastoreResponse(buffer_arg) {
  return cln_node_pb.DatastoreResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cln_DatastoreusageRequest(arg) {
  if (!(arg instanceof cln_node_pb.DatastoreusageRequest)) {
    throw new Error('Expected argument of type cln.DatastoreusageRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cln_DatastoreusageRequest(buffer_arg) {
  return cln_node_pb.DatastoreusageRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cln_DatastoreusageResponse(arg) {
  if (!(arg instanceof cln_node_pb.DatastoreusageResponse)) {
    throw new Error('Expected argument of type cln.DatastoreusageResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cln_DatastoreusageResponse(buffer_arg) {
  return cln_node_pb.DatastoreusageResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cln_DecodeRequest(arg) {
  if (!(arg instanceof cln_node_pb.DecodeRequest)) {
    throw new Error('Expected argument of type cln.DecodeRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cln_DecodeRequest(buffer_arg) {
  return cln_node_pb.DecodeRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cln_DecodeResponse(arg) {
  if (!(arg instanceof cln_node_pb.DecodeResponse)) {
    throw new Error('Expected argument of type cln.DecodeResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cln_DecodeResponse(buffer_arg) {
  return cln_node_pb.DecodeResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cln_DecodepayRequest(arg) {
  if (!(arg instanceof cln_node_pb.DecodepayRequest)) {
    throw new Error('Expected argument of type cln.DecodepayRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cln_DecodepayRequest(buffer_arg) {
  return cln_node_pb.DecodepayRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cln_DecodepayResponse(arg) {
  if (!(arg instanceof cln_node_pb.DecodepayResponse)) {
    throw new Error('Expected argument of type cln.DecodepayResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cln_DecodepayResponse(buffer_arg) {
  return cln_node_pb.DecodepayResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cln_DeldatastoreRequest(arg) {
  if (!(arg instanceof cln_node_pb.DeldatastoreRequest)) {
    throw new Error('Expected argument of type cln.DeldatastoreRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cln_DeldatastoreRequest(buffer_arg) {
  return cln_node_pb.DeldatastoreRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cln_DeldatastoreResponse(arg) {
  if (!(arg instanceof cln_node_pb.DeldatastoreResponse)) {
    throw new Error('Expected argument of type cln.DeldatastoreResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cln_DeldatastoreResponse(buffer_arg) {
  return cln_node_pb.DeldatastoreResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cln_DelexpiredinvoiceRequest(arg) {
  if (!(arg instanceof cln_node_pb.DelexpiredinvoiceRequest)) {
    throw new Error('Expected argument of type cln.DelexpiredinvoiceRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cln_DelexpiredinvoiceRequest(buffer_arg) {
  return cln_node_pb.DelexpiredinvoiceRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cln_DelexpiredinvoiceResponse(arg) {
  if (!(arg instanceof cln_node_pb.DelexpiredinvoiceResponse)) {
    throw new Error('Expected argument of type cln.DelexpiredinvoiceResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cln_DelexpiredinvoiceResponse(buffer_arg) {
  return cln_node_pb.DelexpiredinvoiceResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cln_DelinvoiceRequest(arg) {
  if (!(arg instanceof cln_node_pb.DelinvoiceRequest)) {
    throw new Error('Expected argument of type cln.DelinvoiceRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cln_DelinvoiceRequest(buffer_arg) {
  return cln_node_pb.DelinvoiceRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cln_DelinvoiceResponse(arg) {
  if (!(arg instanceof cln_node_pb.DelinvoiceResponse)) {
    throw new Error('Expected argument of type cln.DelinvoiceResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cln_DelinvoiceResponse(buffer_arg) {
  return cln_node_pb.DelinvoiceResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cln_DisconnectRequest(arg) {
  if (!(arg instanceof cln_node_pb.DisconnectRequest)) {
    throw new Error('Expected argument of type cln.DisconnectRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cln_DisconnectRequest(buffer_arg) {
  return cln_node_pb.DisconnectRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cln_DisconnectResponse(arg) {
  if (!(arg instanceof cln_node_pb.DisconnectResponse)) {
    throw new Error('Expected argument of type cln.DisconnectResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cln_DisconnectResponse(buffer_arg) {
  return cln_node_pb.DisconnectResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cln_FeeratesRequest(arg) {
  if (!(arg instanceof cln_node_pb.FeeratesRequest)) {
    throw new Error('Expected argument of type cln.FeeratesRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cln_FeeratesRequest(buffer_arg) {
  return cln_node_pb.FeeratesRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cln_FeeratesResponse(arg) {
  if (!(arg instanceof cln_node_pb.FeeratesResponse)) {
    throw new Error('Expected argument of type cln.FeeratesResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cln_FeeratesResponse(buffer_arg) {
  return cln_node_pb.FeeratesResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cln_FetchinvoiceRequest(arg) {
  if (!(arg instanceof cln_node_pb.FetchinvoiceRequest)) {
    throw new Error('Expected argument of type cln.FetchinvoiceRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cln_FetchinvoiceRequest(buffer_arg) {
  return cln_node_pb.FetchinvoiceRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cln_FetchinvoiceResponse(arg) {
  if (!(arg instanceof cln_node_pb.FetchinvoiceResponse)) {
    throw new Error('Expected argument of type cln.FetchinvoiceResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cln_FetchinvoiceResponse(buffer_arg) {
  return cln_node_pb.FetchinvoiceResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cln_FundchannelRequest(arg) {
  if (!(arg instanceof cln_node_pb.FundchannelRequest)) {
    throw new Error('Expected argument of type cln.FundchannelRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cln_FundchannelRequest(buffer_arg) {
  return cln_node_pb.FundchannelRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cln_FundchannelResponse(arg) {
  if (!(arg instanceof cln_node_pb.FundchannelResponse)) {
    throw new Error('Expected argument of type cln.FundchannelResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cln_FundchannelResponse(buffer_arg) {
  return cln_node_pb.FundchannelResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cln_FundpsbtRequest(arg) {
  if (!(arg instanceof cln_node_pb.FundpsbtRequest)) {
    throw new Error('Expected argument of type cln.FundpsbtRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cln_FundpsbtRequest(buffer_arg) {
  return cln_node_pb.FundpsbtRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cln_FundpsbtResponse(arg) {
  if (!(arg instanceof cln_node_pb.FundpsbtResponse)) {
    throw new Error('Expected argument of type cln.FundpsbtResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cln_FundpsbtResponse(buffer_arg) {
  return cln_node_pb.FundpsbtResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cln_GetinfoRequest(arg) {
  if (!(arg instanceof cln_node_pb.GetinfoRequest)) {
    throw new Error('Expected argument of type cln.GetinfoRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cln_GetinfoRequest(buffer_arg) {
  return cln_node_pb.GetinfoRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cln_GetinfoResponse(arg) {
  if (!(arg instanceof cln_node_pb.GetinfoResponse)) {
    throw new Error('Expected argument of type cln.GetinfoResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cln_GetinfoResponse(buffer_arg) {
  return cln_node_pb.GetinfoResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cln_GetrouteRequest(arg) {
  if (!(arg instanceof cln_node_pb.GetrouteRequest)) {
    throw new Error('Expected argument of type cln.GetrouteRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cln_GetrouteRequest(buffer_arg) {
  return cln_node_pb.GetrouteRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cln_GetrouteResponse(arg) {
  if (!(arg instanceof cln_node_pb.GetrouteResponse)) {
    throw new Error('Expected argument of type cln.GetrouteResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cln_GetrouteResponse(buffer_arg) {
  return cln_node_pb.GetrouteResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cln_InvoiceRequest(arg) {
  if (!(arg instanceof cln_node_pb.InvoiceRequest)) {
    throw new Error('Expected argument of type cln.InvoiceRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cln_InvoiceRequest(buffer_arg) {
  return cln_node_pb.InvoiceRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cln_InvoiceResponse(arg) {
  if (!(arg instanceof cln_node_pb.InvoiceResponse)) {
    throw new Error('Expected argument of type cln.InvoiceResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cln_InvoiceResponse(buffer_arg) {
  return cln_node_pb.InvoiceResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cln_KeysendRequest(arg) {
  if (!(arg instanceof cln_node_pb.KeysendRequest)) {
    throw new Error('Expected argument of type cln.KeysendRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cln_KeysendRequest(buffer_arg) {
  return cln_node_pb.KeysendRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cln_KeysendResponse(arg) {
  if (!(arg instanceof cln_node_pb.KeysendResponse)) {
    throw new Error('Expected argument of type cln.KeysendResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cln_KeysendResponse(buffer_arg) {
  return cln_node_pb.KeysendResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cln_ListchannelsRequest(arg) {
  if (!(arg instanceof cln_node_pb.ListchannelsRequest)) {
    throw new Error('Expected argument of type cln.ListchannelsRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cln_ListchannelsRequest(buffer_arg) {
  return cln_node_pb.ListchannelsRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cln_ListchannelsResponse(arg) {
  if (!(arg instanceof cln_node_pb.ListchannelsResponse)) {
    throw new Error('Expected argument of type cln.ListchannelsResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cln_ListchannelsResponse(buffer_arg) {
  return cln_node_pb.ListchannelsResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cln_ListclosedchannelsRequest(arg) {
  if (!(arg instanceof cln_node_pb.ListclosedchannelsRequest)) {
    throw new Error('Expected argument of type cln.ListclosedchannelsRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cln_ListclosedchannelsRequest(buffer_arg) {
  return cln_node_pb.ListclosedchannelsRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cln_ListclosedchannelsResponse(arg) {
  if (!(arg instanceof cln_node_pb.ListclosedchannelsResponse)) {
    throw new Error('Expected argument of type cln.ListclosedchannelsResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cln_ListclosedchannelsResponse(buffer_arg) {
  return cln_node_pb.ListclosedchannelsResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cln_ListdatastoreRequest(arg) {
  if (!(arg instanceof cln_node_pb.ListdatastoreRequest)) {
    throw new Error('Expected argument of type cln.ListdatastoreRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cln_ListdatastoreRequest(buffer_arg) {
  return cln_node_pb.ListdatastoreRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cln_ListdatastoreResponse(arg) {
  if (!(arg instanceof cln_node_pb.ListdatastoreResponse)) {
    throw new Error('Expected argument of type cln.ListdatastoreResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cln_ListdatastoreResponse(buffer_arg) {
  return cln_node_pb.ListdatastoreResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cln_ListforwardsRequest(arg) {
  if (!(arg instanceof cln_node_pb.ListforwardsRequest)) {
    throw new Error('Expected argument of type cln.ListforwardsRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cln_ListforwardsRequest(buffer_arg) {
  return cln_node_pb.ListforwardsRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cln_ListforwardsResponse(arg) {
  if (!(arg instanceof cln_node_pb.ListforwardsResponse)) {
    throw new Error('Expected argument of type cln.ListforwardsResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cln_ListforwardsResponse(buffer_arg) {
  return cln_node_pb.ListforwardsResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cln_ListfundsRequest(arg) {
  if (!(arg instanceof cln_node_pb.ListfundsRequest)) {
    throw new Error('Expected argument of type cln.ListfundsRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cln_ListfundsRequest(buffer_arg) {
  return cln_node_pb.ListfundsRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cln_ListfundsResponse(arg) {
  if (!(arg instanceof cln_node_pb.ListfundsResponse)) {
    throw new Error('Expected argument of type cln.ListfundsResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cln_ListfundsResponse(buffer_arg) {
  return cln_node_pb.ListfundsResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cln_ListhtlcsRequest(arg) {
  if (!(arg instanceof cln_node_pb.ListhtlcsRequest)) {
    throw new Error('Expected argument of type cln.ListhtlcsRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cln_ListhtlcsRequest(buffer_arg) {
  return cln_node_pb.ListhtlcsRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cln_ListhtlcsResponse(arg) {
  if (!(arg instanceof cln_node_pb.ListhtlcsResponse)) {
    throw new Error('Expected argument of type cln.ListhtlcsResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cln_ListhtlcsResponse(buffer_arg) {
  return cln_node_pb.ListhtlcsResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cln_ListinvoicesRequest(arg) {
  if (!(arg instanceof cln_node_pb.ListinvoicesRequest)) {
    throw new Error('Expected argument of type cln.ListinvoicesRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cln_ListinvoicesRequest(buffer_arg) {
  return cln_node_pb.ListinvoicesRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cln_ListinvoicesResponse(arg) {
  if (!(arg instanceof cln_node_pb.ListinvoicesResponse)) {
    throw new Error('Expected argument of type cln.ListinvoicesResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cln_ListinvoicesResponse(buffer_arg) {
  return cln_node_pb.ListinvoicesResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cln_ListnodesRequest(arg) {
  if (!(arg instanceof cln_node_pb.ListnodesRequest)) {
    throw new Error('Expected argument of type cln.ListnodesRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cln_ListnodesRequest(buffer_arg) {
  return cln_node_pb.ListnodesRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cln_ListnodesResponse(arg) {
  if (!(arg instanceof cln_node_pb.ListnodesResponse)) {
    throw new Error('Expected argument of type cln.ListnodesResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cln_ListnodesResponse(buffer_arg) {
  return cln_node_pb.ListnodesResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cln_ListpaysRequest(arg) {
  if (!(arg instanceof cln_node_pb.ListpaysRequest)) {
    throw new Error('Expected argument of type cln.ListpaysRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cln_ListpaysRequest(buffer_arg) {
  return cln_node_pb.ListpaysRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cln_ListpaysResponse(arg) {
  if (!(arg instanceof cln_node_pb.ListpaysResponse)) {
    throw new Error('Expected argument of type cln.ListpaysResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cln_ListpaysResponse(buffer_arg) {
  return cln_node_pb.ListpaysResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cln_ListpeerchannelsRequest(arg) {
  if (!(arg instanceof cln_node_pb.ListpeerchannelsRequest)) {
    throw new Error('Expected argument of type cln.ListpeerchannelsRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cln_ListpeerchannelsRequest(buffer_arg) {
  return cln_node_pb.ListpeerchannelsRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cln_ListpeerchannelsResponse(arg) {
  if (!(arg instanceof cln_node_pb.ListpeerchannelsResponse)) {
    throw new Error('Expected argument of type cln.ListpeerchannelsResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cln_ListpeerchannelsResponse(buffer_arg) {
  return cln_node_pb.ListpeerchannelsResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cln_ListpeersRequest(arg) {
  if (!(arg instanceof cln_node_pb.ListpeersRequest)) {
    throw new Error('Expected argument of type cln.ListpeersRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cln_ListpeersRequest(buffer_arg) {
  return cln_node_pb.ListpeersRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cln_ListpeersResponse(arg) {
  if (!(arg instanceof cln_node_pb.ListpeersResponse)) {
    throw new Error('Expected argument of type cln.ListpeersResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cln_ListpeersResponse(buffer_arg) {
  return cln_node_pb.ListpeersResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cln_ListsendpaysRequest(arg) {
  if (!(arg instanceof cln_node_pb.ListsendpaysRequest)) {
    throw new Error('Expected argument of type cln.ListsendpaysRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cln_ListsendpaysRequest(buffer_arg) {
  return cln_node_pb.ListsendpaysRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cln_ListsendpaysResponse(arg) {
  if (!(arg instanceof cln_node_pb.ListsendpaysResponse)) {
    throw new Error('Expected argument of type cln.ListsendpaysResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cln_ListsendpaysResponse(buffer_arg) {
  return cln_node_pb.ListsendpaysResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cln_ListtransactionsRequest(arg) {
  if (!(arg instanceof cln_node_pb.ListtransactionsRequest)) {
    throw new Error('Expected argument of type cln.ListtransactionsRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cln_ListtransactionsRequest(buffer_arg) {
  return cln_node_pb.ListtransactionsRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cln_ListtransactionsResponse(arg) {
  if (!(arg instanceof cln_node_pb.ListtransactionsResponse)) {
    throw new Error('Expected argument of type cln.ListtransactionsResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cln_ListtransactionsResponse(buffer_arg) {
  return cln_node_pb.ListtransactionsResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cln_NewaddrRequest(arg) {
  if (!(arg instanceof cln_node_pb.NewaddrRequest)) {
    throw new Error('Expected argument of type cln.NewaddrRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cln_NewaddrRequest(buffer_arg) {
  return cln_node_pb.NewaddrRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cln_NewaddrResponse(arg) {
  if (!(arg instanceof cln_node_pb.NewaddrResponse)) {
    throw new Error('Expected argument of type cln.NewaddrResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cln_NewaddrResponse(buffer_arg) {
  return cln_node_pb.NewaddrResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cln_PayRequest(arg) {
  if (!(arg instanceof cln_node_pb.PayRequest)) {
    throw new Error('Expected argument of type cln.PayRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cln_PayRequest(buffer_arg) {
  return cln_node_pb.PayRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cln_PayResponse(arg) {
  if (!(arg instanceof cln_node_pb.PayResponse)) {
    throw new Error('Expected argument of type cln.PayResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cln_PayResponse(buffer_arg) {
  return cln_node_pb.PayResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cln_PingRequest(arg) {
  if (!(arg instanceof cln_node_pb.PingRequest)) {
    throw new Error('Expected argument of type cln.PingRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cln_PingRequest(buffer_arg) {
  return cln_node_pb.PingRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cln_PingResponse(arg) {
  if (!(arg instanceof cln_node_pb.PingResponse)) {
    throw new Error('Expected argument of type cln.PingResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cln_PingResponse(buffer_arg) {
  return cln_node_pb.PingResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cln_PreapproveinvoiceRequest(arg) {
  if (!(arg instanceof cln_node_pb.PreapproveinvoiceRequest)) {
    throw new Error('Expected argument of type cln.PreapproveinvoiceRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cln_PreapproveinvoiceRequest(buffer_arg) {
  return cln_node_pb.PreapproveinvoiceRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cln_PreapproveinvoiceResponse(arg) {
  if (!(arg instanceof cln_node_pb.PreapproveinvoiceResponse)) {
    throw new Error('Expected argument of type cln.PreapproveinvoiceResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cln_PreapproveinvoiceResponse(buffer_arg) {
  return cln_node_pb.PreapproveinvoiceResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cln_PreapprovekeysendRequest(arg) {
  if (!(arg instanceof cln_node_pb.PreapprovekeysendRequest)) {
    throw new Error('Expected argument of type cln.PreapprovekeysendRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cln_PreapprovekeysendRequest(buffer_arg) {
  return cln_node_pb.PreapprovekeysendRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cln_PreapprovekeysendResponse(arg) {
  if (!(arg instanceof cln_node_pb.PreapprovekeysendResponse)) {
    throw new Error('Expected argument of type cln.PreapprovekeysendResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cln_PreapprovekeysendResponse(buffer_arg) {
  return cln_node_pb.PreapprovekeysendResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cln_SendcustommsgRequest(arg) {
  if (!(arg instanceof cln_node_pb.SendcustommsgRequest)) {
    throw new Error('Expected argument of type cln.SendcustommsgRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cln_SendcustommsgRequest(buffer_arg) {
  return cln_node_pb.SendcustommsgRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cln_SendcustommsgResponse(arg) {
  if (!(arg instanceof cln_node_pb.SendcustommsgResponse)) {
    throw new Error('Expected argument of type cln.SendcustommsgResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cln_SendcustommsgResponse(buffer_arg) {
  return cln_node_pb.SendcustommsgResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cln_SendonionRequest(arg) {
  if (!(arg instanceof cln_node_pb.SendonionRequest)) {
    throw new Error('Expected argument of type cln.SendonionRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cln_SendonionRequest(buffer_arg) {
  return cln_node_pb.SendonionRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cln_SendonionResponse(arg) {
  if (!(arg instanceof cln_node_pb.SendonionResponse)) {
    throw new Error('Expected argument of type cln.SendonionResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cln_SendonionResponse(buffer_arg) {
  return cln_node_pb.SendonionResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cln_SendpayRequest(arg) {
  if (!(arg instanceof cln_node_pb.SendpayRequest)) {
    throw new Error('Expected argument of type cln.SendpayRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cln_SendpayRequest(buffer_arg) {
  return cln_node_pb.SendpayRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cln_SendpayResponse(arg) {
  if (!(arg instanceof cln_node_pb.SendpayResponse)) {
    throw new Error('Expected argument of type cln.SendpayResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cln_SendpayResponse(buffer_arg) {
  return cln_node_pb.SendpayResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cln_SendpsbtRequest(arg) {
  if (!(arg instanceof cln_node_pb.SendpsbtRequest)) {
    throw new Error('Expected argument of type cln.SendpsbtRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cln_SendpsbtRequest(buffer_arg) {
  return cln_node_pb.SendpsbtRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cln_SendpsbtResponse(arg) {
  if (!(arg instanceof cln_node_pb.SendpsbtResponse)) {
    throw new Error('Expected argument of type cln.SendpsbtResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cln_SendpsbtResponse(buffer_arg) {
  return cln_node_pb.SendpsbtResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cln_SetchannelRequest(arg) {
  if (!(arg instanceof cln_node_pb.SetchannelRequest)) {
    throw new Error('Expected argument of type cln.SetchannelRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cln_SetchannelRequest(buffer_arg) {
  return cln_node_pb.SetchannelRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cln_SetchannelResponse(arg) {
  if (!(arg instanceof cln_node_pb.SetchannelResponse)) {
    throw new Error('Expected argument of type cln.SetchannelResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cln_SetchannelResponse(buffer_arg) {
  return cln_node_pb.SetchannelResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cln_SigninvoiceRequest(arg) {
  if (!(arg instanceof cln_node_pb.SigninvoiceRequest)) {
    throw new Error('Expected argument of type cln.SigninvoiceRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cln_SigninvoiceRequest(buffer_arg) {
  return cln_node_pb.SigninvoiceRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cln_SigninvoiceResponse(arg) {
  if (!(arg instanceof cln_node_pb.SigninvoiceResponse)) {
    throw new Error('Expected argument of type cln.SigninvoiceResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cln_SigninvoiceResponse(buffer_arg) {
  return cln_node_pb.SigninvoiceResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cln_SignmessageRequest(arg) {
  if (!(arg instanceof cln_node_pb.SignmessageRequest)) {
    throw new Error('Expected argument of type cln.SignmessageRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cln_SignmessageRequest(buffer_arg) {
  return cln_node_pb.SignmessageRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cln_SignmessageResponse(arg) {
  if (!(arg instanceof cln_node_pb.SignmessageResponse)) {
    throw new Error('Expected argument of type cln.SignmessageResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cln_SignmessageResponse(buffer_arg) {
  return cln_node_pb.SignmessageResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cln_SignpsbtRequest(arg) {
  if (!(arg instanceof cln_node_pb.SignpsbtRequest)) {
    throw new Error('Expected argument of type cln.SignpsbtRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cln_SignpsbtRequest(buffer_arg) {
  return cln_node_pb.SignpsbtRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cln_SignpsbtResponse(arg) {
  if (!(arg instanceof cln_node_pb.SignpsbtResponse)) {
    throw new Error('Expected argument of type cln.SignpsbtResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cln_SignpsbtResponse(buffer_arg) {
  return cln_node_pb.SignpsbtResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cln_StaticbackupRequest(arg) {
  if (!(arg instanceof cln_node_pb.StaticbackupRequest)) {
    throw new Error('Expected argument of type cln.StaticbackupRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cln_StaticbackupRequest(buffer_arg) {
  return cln_node_pb.StaticbackupRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cln_StaticbackupResponse(arg) {
  if (!(arg instanceof cln_node_pb.StaticbackupResponse)) {
    throw new Error('Expected argument of type cln.StaticbackupResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cln_StaticbackupResponse(buffer_arg) {
  return cln_node_pb.StaticbackupResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cln_StopRequest(arg) {
  if (!(arg instanceof cln_node_pb.StopRequest)) {
    throw new Error('Expected argument of type cln.StopRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cln_StopRequest(buffer_arg) {
  return cln_node_pb.StopRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cln_StopResponse(arg) {
  if (!(arg instanceof cln_node_pb.StopResponse)) {
    throw new Error('Expected argument of type cln.StopResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cln_StopResponse(buffer_arg) {
  return cln_node_pb.StopResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cln_TxdiscardRequest(arg) {
  if (!(arg instanceof cln_node_pb.TxdiscardRequest)) {
    throw new Error('Expected argument of type cln.TxdiscardRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cln_TxdiscardRequest(buffer_arg) {
  return cln_node_pb.TxdiscardRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cln_TxdiscardResponse(arg) {
  if (!(arg instanceof cln_node_pb.TxdiscardResponse)) {
    throw new Error('Expected argument of type cln.TxdiscardResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cln_TxdiscardResponse(buffer_arg) {
  return cln_node_pb.TxdiscardResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cln_TxprepareRequest(arg) {
  if (!(arg instanceof cln_node_pb.TxprepareRequest)) {
    throw new Error('Expected argument of type cln.TxprepareRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cln_TxprepareRequest(buffer_arg) {
  return cln_node_pb.TxprepareRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cln_TxprepareResponse(arg) {
  if (!(arg instanceof cln_node_pb.TxprepareResponse)) {
    throw new Error('Expected argument of type cln.TxprepareResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cln_TxprepareResponse(buffer_arg) {
  return cln_node_pb.TxprepareResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cln_TxsendRequest(arg) {
  if (!(arg instanceof cln_node_pb.TxsendRequest)) {
    throw new Error('Expected argument of type cln.TxsendRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cln_TxsendRequest(buffer_arg) {
  return cln_node_pb.TxsendRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cln_TxsendResponse(arg) {
  if (!(arg instanceof cln_node_pb.TxsendResponse)) {
    throw new Error('Expected argument of type cln.TxsendResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cln_TxsendResponse(buffer_arg) {
  return cln_node_pb.TxsendResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cln_UtxopsbtRequest(arg) {
  if (!(arg instanceof cln_node_pb.UtxopsbtRequest)) {
    throw new Error('Expected argument of type cln.UtxopsbtRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cln_UtxopsbtRequest(buffer_arg) {
  return cln_node_pb.UtxopsbtRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cln_UtxopsbtResponse(arg) {
  if (!(arg instanceof cln_node_pb.UtxopsbtResponse)) {
    throw new Error('Expected argument of type cln.UtxopsbtResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cln_UtxopsbtResponse(buffer_arg) {
  return cln_node_pb.UtxopsbtResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cln_WaitRequest(arg) {
  if (!(arg instanceof cln_node_pb.WaitRequest)) {
    throw new Error('Expected argument of type cln.WaitRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cln_WaitRequest(buffer_arg) {
  return cln_node_pb.WaitRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cln_WaitResponse(arg) {
  if (!(arg instanceof cln_node_pb.WaitResponse)) {
    throw new Error('Expected argument of type cln.WaitResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cln_WaitResponse(buffer_arg) {
  return cln_node_pb.WaitResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cln_WaitanyinvoiceRequest(arg) {
  if (!(arg instanceof cln_node_pb.WaitanyinvoiceRequest)) {
    throw new Error('Expected argument of type cln.WaitanyinvoiceRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cln_WaitanyinvoiceRequest(buffer_arg) {
  return cln_node_pb.WaitanyinvoiceRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cln_WaitanyinvoiceResponse(arg) {
  if (!(arg instanceof cln_node_pb.WaitanyinvoiceResponse)) {
    throw new Error('Expected argument of type cln.WaitanyinvoiceResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cln_WaitanyinvoiceResponse(buffer_arg) {
  return cln_node_pb.WaitanyinvoiceResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cln_WaitblockheightRequest(arg) {
  if (!(arg instanceof cln_node_pb.WaitblockheightRequest)) {
    throw new Error('Expected argument of type cln.WaitblockheightRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cln_WaitblockheightRequest(buffer_arg) {
  return cln_node_pb.WaitblockheightRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cln_WaitblockheightResponse(arg) {
  if (!(arg instanceof cln_node_pb.WaitblockheightResponse)) {
    throw new Error('Expected argument of type cln.WaitblockheightResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cln_WaitblockheightResponse(buffer_arg) {
  return cln_node_pb.WaitblockheightResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cln_WaitinvoiceRequest(arg) {
  if (!(arg instanceof cln_node_pb.WaitinvoiceRequest)) {
    throw new Error('Expected argument of type cln.WaitinvoiceRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cln_WaitinvoiceRequest(buffer_arg) {
  return cln_node_pb.WaitinvoiceRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cln_WaitinvoiceResponse(arg) {
  if (!(arg instanceof cln_node_pb.WaitinvoiceResponse)) {
    throw new Error('Expected argument of type cln.WaitinvoiceResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cln_WaitinvoiceResponse(buffer_arg) {
  return cln_node_pb.WaitinvoiceResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cln_WaitsendpayRequest(arg) {
  if (!(arg instanceof cln_node_pb.WaitsendpayRequest)) {
    throw new Error('Expected argument of type cln.WaitsendpayRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cln_WaitsendpayRequest(buffer_arg) {
  return cln_node_pb.WaitsendpayRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cln_WaitsendpayResponse(arg) {
  if (!(arg instanceof cln_node_pb.WaitsendpayResponse)) {
    throw new Error('Expected argument of type cln.WaitsendpayResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cln_WaitsendpayResponse(buffer_arg) {
  return cln_node_pb.WaitsendpayResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cln_WithdrawRequest(arg) {
  if (!(arg instanceof cln_node_pb.WithdrawRequest)) {
    throw new Error('Expected argument of type cln.WithdrawRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cln_WithdrawRequest(buffer_arg) {
  return cln_node_pb.WithdrawRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cln_WithdrawResponse(arg) {
  if (!(arg instanceof cln_node_pb.WithdrawResponse)) {
    throw new Error('Expected argument of type cln.WithdrawResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cln_WithdrawResponse(buffer_arg) {
  return cln_node_pb.WithdrawResponse.deserializeBinary(new Uint8Array(buffer_arg));
}


var NodeService = exports.NodeService = {
  getinfo: {
    path: '/cln.Node/Getinfo',
    requestStream: false,
    responseStream: false,
    requestType: cln_node_pb.GetinfoRequest,
    responseType: cln_node_pb.GetinfoResponse,
    requestSerialize: serialize_cln_GetinfoRequest,
    requestDeserialize: deserialize_cln_GetinfoRequest,
    responseSerialize: serialize_cln_GetinfoResponse,
    responseDeserialize: deserialize_cln_GetinfoResponse,
  },
  listPeers: {
    path: '/cln.Node/ListPeers',
    requestStream: false,
    responseStream: false,
    requestType: cln_node_pb.ListpeersRequest,
    responseType: cln_node_pb.ListpeersResponse,
    requestSerialize: serialize_cln_ListpeersRequest,
    requestDeserialize: deserialize_cln_ListpeersRequest,
    responseSerialize: serialize_cln_ListpeersResponse,
    responseDeserialize: deserialize_cln_ListpeersResponse,
  },
  listFunds: {
    path: '/cln.Node/ListFunds',
    requestStream: false,
    responseStream: false,
    requestType: cln_node_pb.ListfundsRequest,
    responseType: cln_node_pb.ListfundsResponse,
    requestSerialize: serialize_cln_ListfundsRequest,
    requestDeserialize: deserialize_cln_ListfundsRequest,
    responseSerialize: serialize_cln_ListfundsResponse,
    responseDeserialize: deserialize_cln_ListfundsResponse,
  },
  sendPay: {
    path: '/cln.Node/SendPay',
    requestStream: false,
    responseStream: false,
    requestType: cln_node_pb.SendpayRequest,
    responseType: cln_node_pb.SendpayResponse,
    requestSerialize: serialize_cln_SendpayRequest,
    requestDeserialize: deserialize_cln_SendpayRequest,
    responseSerialize: serialize_cln_SendpayResponse,
    responseDeserialize: deserialize_cln_SendpayResponse,
  },
  listChannels: {
    path: '/cln.Node/ListChannels',
    requestStream: false,
    responseStream: false,
    requestType: cln_node_pb.ListchannelsRequest,
    responseType: cln_node_pb.ListchannelsResponse,
    requestSerialize: serialize_cln_ListchannelsRequest,
    requestDeserialize: deserialize_cln_ListchannelsRequest,
    responseSerialize: serialize_cln_ListchannelsResponse,
    responseDeserialize: deserialize_cln_ListchannelsResponse,
  },
  addGossip: {
    path: '/cln.Node/AddGossip',
    requestStream: false,
    responseStream: false,
    requestType: cln_node_pb.AddgossipRequest,
    responseType: cln_node_pb.AddgossipResponse,
    requestSerialize: serialize_cln_AddgossipRequest,
    requestDeserialize: deserialize_cln_AddgossipRequest,
    responseSerialize: serialize_cln_AddgossipResponse,
    responseDeserialize: deserialize_cln_AddgossipResponse,
  },
  autoCleanInvoice: {
    path: '/cln.Node/AutoCleanInvoice',
    requestStream: false,
    responseStream: false,
    requestType: cln_node_pb.AutocleaninvoiceRequest,
    responseType: cln_node_pb.AutocleaninvoiceResponse,
    requestSerialize: serialize_cln_AutocleaninvoiceRequest,
    requestDeserialize: deserialize_cln_AutocleaninvoiceRequest,
    responseSerialize: serialize_cln_AutocleaninvoiceResponse,
    responseDeserialize: deserialize_cln_AutocleaninvoiceResponse,
  },
  checkMessage: {
    path: '/cln.Node/CheckMessage',
    requestStream: false,
    responseStream: false,
    requestType: cln_node_pb.CheckmessageRequest,
    responseType: cln_node_pb.CheckmessageResponse,
    requestSerialize: serialize_cln_CheckmessageRequest,
    requestDeserialize: deserialize_cln_CheckmessageRequest,
    responseSerialize: serialize_cln_CheckmessageResponse,
    responseDeserialize: deserialize_cln_CheckmessageResponse,
  },
  close: {
    path: '/cln.Node/Close',
    requestStream: false,
    responseStream: false,
    requestType: cln_node_pb.CloseRequest,
    responseType: cln_node_pb.CloseResponse,
    requestSerialize: serialize_cln_CloseRequest,
    requestDeserialize: deserialize_cln_CloseRequest,
    responseSerialize: serialize_cln_CloseResponse,
    responseDeserialize: deserialize_cln_CloseResponse,
  },
  connectPeer: {
    path: '/cln.Node/ConnectPeer',
    requestStream: false,
    responseStream: false,
    requestType: cln_node_pb.ConnectRequest,
    responseType: cln_node_pb.ConnectResponse,
    requestSerialize: serialize_cln_ConnectRequest,
    requestDeserialize: deserialize_cln_ConnectRequest,
    responseSerialize: serialize_cln_ConnectResponse,
    responseDeserialize: deserialize_cln_ConnectResponse,
  },
  createInvoice: {
    path: '/cln.Node/CreateInvoice',
    requestStream: false,
    responseStream: false,
    requestType: cln_node_pb.CreateinvoiceRequest,
    responseType: cln_node_pb.CreateinvoiceResponse,
    requestSerialize: serialize_cln_CreateinvoiceRequest,
    requestDeserialize: deserialize_cln_CreateinvoiceRequest,
    responseSerialize: serialize_cln_CreateinvoiceResponse,
    responseDeserialize: deserialize_cln_CreateinvoiceResponse,
  },
  datastore: {
    path: '/cln.Node/Datastore',
    requestStream: false,
    responseStream: false,
    requestType: cln_node_pb.DatastoreRequest,
    responseType: cln_node_pb.DatastoreResponse,
    requestSerialize: serialize_cln_DatastoreRequest,
    requestDeserialize: deserialize_cln_DatastoreRequest,
    responseSerialize: serialize_cln_DatastoreResponse,
    responseDeserialize: deserialize_cln_DatastoreResponse,
  },
  datastoreUsage: {
    path: '/cln.Node/DatastoreUsage',
    requestStream: false,
    responseStream: false,
    requestType: cln_node_pb.DatastoreusageRequest,
    responseType: cln_node_pb.DatastoreusageResponse,
    requestSerialize: serialize_cln_DatastoreusageRequest,
    requestDeserialize: deserialize_cln_DatastoreusageRequest,
    responseSerialize: serialize_cln_DatastoreusageResponse,
    responseDeserialize: deserialize_cln_DatastoreusageResponse,
  },
  createOnion: {
    path: '/cln.Node/CreateOnion',
    requestStream: false,
    responseStream: false,
    requestType: cln_node_pb.CreateonionRequest,
    responseType: cln_node_pb.CreateonionResponse,
    requestSerialize: serialize_cln_CreateonionRequest,
    requestDeserialize: deserialize_cln_CreateonionRequest,
    responseSerialize: serialize_cln_CreateonionResponse,
    responseDeserialize: deserialize_cln_CreateonionResponse,
  },
  delDatastore: {
    path: '/cln.Node/DelDatastore',
    requestStream: false,
    responseStream: false,
    requestType: cln_node_pb.DeldatastoreRequest,
    responseType: cln_node_pb.DeldatastoreResponse,
    requestSerialize: serialize_cln_DeldatastoreRequest,
    requestDeserialize: deserialize_cln_DeldatastoreRequest,
    responseSerialize: serialize_cln_DeldatastoreResponse,
    responseDeserialize: deserialize_cln_DeldatastoreResponse,
  },
  delExpiredInvoice: {
    path: '/cln.Node/DelExpiredInvoice',
    requestStream: false,
    responseStream: false,
    requestType: cln_node_pb.DelexpiredinvoiceRequest,
    responseType: cln_node_pb.DelexpiredinvoiceResponse,
    requestSerialize: serialize_cln_DelexpiredinvoiceRequest,
    requestDeserialize: deserialize_cln_DelexpiredinvoiceRequest,
    responseSerialize: serialize_cln_DelexpiredinvoiceResponse,
    responseDeserialize: deserialize_cln_DelexpiredinvoiceResponse,
  },
  delInvoice: {
    path: '/cln.Node/DelInvoice',
    requestStream: false,
    responseStream: false,
    requestType: cln_node_pb.DelinvoiceRequest,
    responseType: cln_node_pb.DelinvoiceResponse,
    requestSerialize: serialize_cln_DelinvoiceRequest,
    requestDeserialize: deserialize_cln_DelinvoiceRequest,
    responseSerialize: serialize_cln_DelinvoiceResponse,
    responseDeserialize: deserialize_cln_DelinvoiceResponse,
  },
  invoice: {
    path: '/cln.Node/Invoice',
    requestStream: false,
    responseStream: false,
    requestType: cln_node_pb.InvoiceRequest,
    responseType: cln_node_pb.InvoiceResponse,
    requestSerialize: serialize_cln_InvoiceRequest,
    requestDeserialize: deserialize_cln_InvoiceRequest,
    responseSerialize: serialize_cln_InvoiceResponse,
    responseDeserialize: deserialize_cln_InvoiceResponse,
  },
  listDatastore: {
    path: '/cln.Node/ListDatastore',
    requestStream: false,
    responseStream: false,
    requestType: cln_node_pb.ListdatastoreRequest,
    responseType: cln_node_pb.ListdatastoreResponse,
    requestSerialize: serialize_cln_ListdatastoreRequest,
    requestDeserialize: deserialize_cln_ListdatastoreRequest,
    responseSerialize: serialize_cln_ListdatastoreResponse,
    responseDeserialize: deserialize_cln_ListdatastoreResponse,
  },
  listInvoices: {
    path: '/cln.Node/ListInvoices',
    requestStream: false,
    responseStream: false,
    requestType: cln_node_pb.ListinvoicesRequest,
    responseType: cln_node_pb.ListinvoicesResponse,
    requestSerialize: serialize_cln_ListinvoicesRequest,
    requestDeserialize: deserialize_cln_ListinvoicesRequest,
    responseSerialize: serialize_cln_ListinvoicesResponse,
    responseDeserialize: deserialize_cln_ListinvoicesResponse,
  },
  sendOnion: {
    path: '/cln.Node/SendOnion',
    requestStream: false,
    responseStream: false,
    requestType: cln_node_pb.SendonionRequest,
    responseType: cln_node_pb.SendonionResponse,
    requestSerialize: serialize_cln_SendonionRequest,
    requestDeserialize: deserialize_cln_SendonionRequest,
    responseSerialize: serialize_cln_SendonionResponse,
    responseDeserialize: deserialize_cln_SendonionResponse,
  },
  listSendPays: {
    path: '/cln.Node/ListSendPays',
    requestStream: false,
    responseStream: false,
    requestType: cln_node_pb.ListsendpaysRequest,
    responseType: cln_node_pb.ListsendpaysResponse,
    requestSerialize: serialize_cln_ListsendpaysRequest,
    requestDeserialize: deserialize_cln_ListsendpaysRequest,
    responseSerialize: serialize_cln_ListsendpaysResponse,
    responseDeserialize: deserialize_cln_ListsendpaysResponse,
  },
  listTransactions: {
    path: '/cln.Node/ListTransactions',
    requestStream: false,
    responseStream: false,
    requestType: cln_node_pb.ListtransactionsRequest,
    responseType: cln_node_pb.ListtransactionsResponse,
    requestSerialize: serialize_cln_ListtransactionsRequest,
    requestDeserialize: deserialize_cln_ListtransactionsRequest,
    responseSerialize: serialize_cln_ListtransactionsResponse,
    responseDeserialize: deserialize_cln_ListtransactionsResponse,
  },
  pay: {
    path: '/cln.Node/Pay',
    requestStream: false,
    responseStream: false,
    requestType: cln_node_pb.PayRequest,
    responseType: cln_node_pb.PayResponse,
    requestSerialize: serialize_cln_PayRequest,
    requestDeserialize: deserialize_cln_PayRequest,
    responseSerialize: serialize_cln_PayResponse,
    responseDeserialize: deserialize_cln_PayResponse,
  },
  listNodes: {
    path: '/cln.Node/ListNodes',
    requestStream: false,
    responseStream: false,
    requestType: cln_node_pb.ListnodesRequest,
    responseType: cln_node_pb.ListnodesResponse,
    requestSerialize: serialize_cln_ListnodesRequest,
    requestDeserialize: deserialize_cln_ListnodesRequest,
    responseSerialize: serialize_cln_ListnodesResponse,
    responseDeserialize: deserialize_cln_ListnodesResponse,
  },
  waitAnyInvoice: {
    path: '/cln.Node/WaitAnyInvoice',
    requestStream: false,
    responseStream: false,
    requestType: cln_node_pb.WaitanyinvoiceRequest,
    responseType: cln_node_pb.WaitanyinvoiceResponse,
    requestSerialize: serialize_cln_WaitanyinvoiceRequest,
    requestDeserialize: deserialize_cln_WaitanyinvoiceRequest,
    responseSerialize: serialize_cln_WaitanyinvoiceResponse,
    responseDeserialize: deserialize_cln_WaitanyinvoiceResponse,
  },
  waitInvoice: {
    path: '/cln.Node/WaitInvoice',
    requestStream: false,
    responseStream: false,
    requestType: cln_node_pb.WaitinvoiceRequest,
    responseType: cln_node_pb.WaitinvoiceResponse,
    requestSerialize: serialize_cln_WaitinvoiceRequest,
    requestDeserialize: deserialize_cln_WaitinvoiceRequest,
    responseSerialize: serialize_cln_WaitinvoiceResponse,
    responseDeserialize: deserialize_cln_WaitinvoiceResponse,
  },
  waitSendPay: {
    path: '/cln.Node/WaitSendPay',
    requestStream: false,
    responseStream: false,
    requestType: cln_node_pb.WaitsendpayRequest,
    responseType: cln_node_pb.WaitsendpayResponse,
    requestSerialize: serialize_cln_WaitsendpayRequest,
    requestDeserialize: deserialize_cln_WaitsendpayRequest,
    responseSerialize: serialize_cln_WaitsendpayResponse,
    responseDeserialize: deserialize_cln_WaitsendpayResponse,
  },
  newAddr: {
    path: '/cln.Node/NewAddr',
    requestStream: false,
    responseStream: false,
    requestType: cln_node_pb.NewaddrRequest,
    responseType: cln_node_pb.NewaddrResponse,
    requestSerialize: serialize_cln_NewaddrRequest,
    requestDeserialize: deserialize_cln_NewaddrRequest,
    responseSerialize: serialize_cln_NewaddrResponse,
    responseDeserialize: deserialize_cln_NewaddrResponse,
  },
  withdraw: {
    path: '/cln.Node/Withdraw',
    requestStream: false,
    responseStream: false,
    requestType: cln_node_pb.WithdrawRequest,
    responseType: cln_node_pb.WithdrawResponse,
    requestSerialize: serialize_cln_WithdrawRequest,
    requestDeserialize: deserialize_cln_WithdrawRequest,
    responseSerialize: serialize_cln_WithdrawResponse,
    responseDeserialize: deserialize_cln_WithdrawResponse,
  },
  keySend: {
    path: '/cln.Node/KeySend',
    requestStream: false,
    responseStream: false,
    requestType: cln_node_pb.KeysendRequest,
    responseType: cln_node_pb.KeysendResponse,
    requestSerialize: serialize_cln_KeysendRequest,
    requestDeserialize: deserialize_cln_KeysendRequest,
    responseSerialize: serialize_cln_KeysendResponse,
    responseDeserialize: deserialize_cln_KeysendResponse,
  },
  fundPsbt: {
    path: '/cln.Node/FundPsbt',
    requestStream: false,
    responseStream: false,
    requestType: cln_node_pb.FundpsbtRequest,
    responseType: cln_node_pb.FundpsbtResponse,
    requestSerialize: serialize_cln_FundpsbtRequest,
    requestDeserialize: deserialize_cln_FundpsbtRequest,
    responseSerialize: serialize_cln_FundpsbtResponse,
    responseDeserialize: deserialize_cln_FundpsbtResponse,
  },
  sendPsbt: {
    path: '/cln.Node/SendPsbt',
    requestStream: false,
    responseStream: false,
    requestType: cln_node_pb.SendpsbtRequest,
    responseType: cln_node_pb.SendpsbtResponse,
    requestSerialize: serialize_cln_SendpsbtRequest,
    requestDeserialize: deserialize_cln_SendpsbtRequest,
    responseSerialize: serialize_cln_SendpsbtResponse,
    responseDeserialize: deserialize_cln_SendpsbtResponse,
  },
  signPsbt: {
    path: '/cln.Node/SignPsbt',
    requestStream: false,
    responseStream: false,
    requestType: cln_node_pb.SignpsbtRequest,
    responseType: cln_node_pb.SignpsbtResponse,
    requestSerialize: serialize_cln_SignpsbtRequest,
    requestDeserialize: deserialize_cln_SignpsbtRequest,
    responseSerialize: serialize_cln_SignpsbtResponse,
    responseDeserialize: deserialize_cln_SignpsbtResponse,
  },
  utxoPsbt: {
    path: '/cln.Node/UtxoPsbt',
    requestStream: false,
    responseStream: false,
    requestType: cln_node_pb.UtxopsbtRequest,
    responseType: cln_node_pb.UtxopsbtResponse,
    requestSerialize: serialize_cln_UtxopsbtRequest,
    requestDeserialize: deserialize_cln_UtxopsbtRequest,
    responseSerialize: serialize_cln_UtxopsbtResponse,
    responseDeserialize: deserialize_cln_UtxopsbtResponse,
  },
  txDiscard: {
    path: '/cln.Node/TxDiscard',
    requestStream: false,
    responseStream: false,
    requestType: cln_node_pb.TxdiscardRequest,
    responseType: cln_node_pb.TxdiscardResponse,
    requestSerialize: serialize_cln_TxdiscardRequest,
    requestDeserialize: deserialize_cln_TxdiscardRequest,
    responseSerialize: serialize_cln_TxdiscardResponse,
    responseDeserialize: deserialize_cln_TxdiscardResponse,
  },
  txPrepare: {
    path: '/cln.Node/TxPrepare',
    requestStream: false,
    responseStream: false,
    requestType: cln_node_pb.TxprepareRequest,
    responseType: cln_node_pb.TxprepareResponse,
    requestSerialize: serialize_cln_TxprepareRequest,
    requestDeserialize: deserialize_cln_TxprepareRequest,
    responseSerialize: serialize_cln_TxprepareResponse,
    responseDeserialize: deserialize_cln_TxprepareResponse,
  },
  txSend: {
    path: '/cln.Node/TxSend',
    requestStream: false,
    responseStream: false,
    requestType: cln_node_pb.TxsendRequest,
    responseType: cln_node_pb.TxsendResponse,
    requestSerialize: serialize_cln_TxsendRequest,
    requestDeserialize: deserialize_cln_TxsendRequest,
    responseSerialize: serialize_cln_TxsendResponse,
    responseDeserialize: deserialize_cln_TxsendResponse,
  },
  listPeerChannels: {
    path: '/cln.Node/ListPeerChannels',
    requestStream: false,
    responseStream: false,
    requestType: cln_node_pb.ListpeerchannelsRequest,
    responseType: cln_node_pb.ListpeerchannelsResponse,
    requestSerialize: serialize_cln_ListpeerchannelsRequest,
    requestDeserialize: deserialize_cln_ListpeerchannelsRequest,
    responseSerialize: serialize_cln_ListpeerchannelsResponse,
    responseDeserialize: deserialize_cln_ListpeerchannelsResponse,
  },
  listClosedChannels: {
    path: '/cln.Node/ListClosedChannels',
    requestStream: false,
    responseStream: false,
    requestType: cln_node_pb.ListclosedchannelsRequest,
    responseType: cln_node_pb.ListclosedchannelsResponse,
    requestSerialize: serialize_cln_ListclosedchannelsRequest,
    requestDeserialize: deserialize_cln_ListclosedchannelsRequest,
    responseSerialize: serialize_cln_ListclosedchannelsResponse,
    responseDeserialize: deserialize_cln_ListclosedchannelsResponse,
  },
  decodePay: {
    path: '/cln.Node/DecodePay',
    requestStream: false,
    responseStream: false,
    requestType: cln_node_pb.DecodepayRequest,
    responseType: cln_node_pb.DecodepayResponse,
    requestSerialize: serialize_cln_DecodepayRequest,
    requestDeserialize: deserialize_cln_DecodepayRequest,
    responseSerialize: serialize_cln_DecodepayResponse,
    responseDeserialize: deserialize_cln_DecodepayResponse,
  },
  decode: {
    path: '/cln.Node/Decode',
    requestStream: false,
    responseStream: false,
    requestType: cln_node_pb.DecodeRequest,
    responseType: cln_node_pb.DecodeResponse,
    requestSerialize: serialize_cln_DecodeRequest,
    requestDeserialize: deserialize_cln_DecodeRequest,
    responseSerialize: serialize_cln_DecodeResponse,
    responseDeserialize: deserialize_cln_DecodeResponse,
  },
  disconnect: {
    path: '/cln.Node/Disconnect',
    requestStream: false,
    responseStream: false,
    requestType: cln_node_pb.DisconnectRequest,
    responseType: cln_node_pb.DisconnectResponse,
    requestSerialize: serialize_cln_DisconnectRequest,
    requestDeserialize: deserialize_cln_DisconnectRequest,
    responseSerialize: serialize_cln_DisconnectResponse,
    responseDeserialize: deserialize_cln_DisconnectResponse,
  },
  feerates: {
    path: '/cln.Node/Feerates',
    requestStream: false,
    responseStream: false,
    requestType: cln_node_pb.FeeratesRequest,
    responseType: cln_node_pb.FeeratesResponse,
    requestSerialize: serialize_cln_FeeratesRequest,
    requestDeserialize: deserialize_cln_FeeratesRequest,
    responseSerialize: serialize_cln_FeeratesResponse,
    responseDeserialize: deserialize_cln_FeeratesResponse,
  },
  fetchInvoice: {
    path: '/cln.Node/FetchInvoice',
    requestStream: false,
    responseStream: false,
    requestType: cln_node_pb.FetchinvoiceRequest,
    responseType: cln_node_pb.FetchinvoiceResponse,
    requestSerialize: serialize_cln_FetchinvoiceRequest,
    requestDeserialize: deserialize_cln_FetchinvoiceRequest,
    responseSerialize: serialize_cln_FetchinvoiceResponse,
    responseDeserialize: deserialize_cln_FetchinvoiceResponse,
  },
  fundChannel: {
    path: '/cln.Node/FundChannel',
    requestStream: false,
    responseStream: false,
    requestType: cln_node_pb.FundchannelRequest,
    responseType: cln_node_pb.FundchannelResponse,
    requestSerialize: serialize_cln_FundchannelRequest,
    requestDeserialize: deserialize_cln_FundchannelRequest,
    responseSerialize: serialize_cln_FundchannelResponse,
    responseDeserialize: deserialize_cln_FundchannelResponse,
  },
  getRoute: {
    path: '/cln.Node/GetRoute',
    requestStream: false,
    responseStream: false,
    requestType: cln_node_pb.GetrouteRequest,
    responseType: cln_node_pb.GetrouteResponse,
    requestSerialize: serialize_cln_GetrouteRequest,
    requestDeserialize: deserialize_cln_GetrouteRequest,
    responseSerialize: serialize_cln_GetrouteResponse,
    responseDeserialize: deserialize_cln_GetrouteResponse,
  },
  listForwards: {
    path: '/cln.Node/ListForwards',
    requestStream: false,
    responseStream: false,
    requestType: cln_node_pb.ListforwardsRequest,
    responseType: cln_node_pb.ListforwardsResponse,
    requestSerialize: serialize_cln_ListforwardsRequest,
    requestDeserialize: deserialize_cln_ListforwardsRequest,
    responseSerialize: serialize_cln_ListforwardsResponse,
    responseDeserialize: deserialize_cln_ListforwardsResponse,
  },
  listPays: {
    path: '/cln.Node/ListPays',
    requestStream: false,
    responseStream: false,
    requestType: cln_node_pb.ListpaysRequest,
    responseType: cln_node_pb.ListpaysResponse,
    requestSerialize: serialize_cln_ListpaysRequest,
    requestDeserialize: deserialize_cln_ListpaysRequest,
    responseSerialize: serialize_cln_ListpaysResponse,
    responseDeserialize: deserialize_cln_ListpaysResponse,
  },
  listHtlcs: {
    path: '/cln.Node/ListHtlcs',
    requestStream: false,
    responseStream: false,
    requestType: cln_node_pb.ListhtlcsRequest,
    responseType: cln_node_pb.ListhtlcsResponse,
    requestSerialize: serialize_cln_ListhtlcsRequest,
    requestDeserialize: deserialize_cln_ListhtlcsRequest,
    responseSerialize: serialize_cln_ListhtlcsResponse,
    responseDeserialize: deserialize_cln_ListhtlcsResponse,
  },
  ping: {
    path: '/cln.Node/Ping',
    requestStream: false,
    responseStream: false,
    requestType: cln_node_pb.PingRequest,
    responseType: cln_node_pb.PingResponse,
    requestSerialize: serialize_cln_PingRequest,
    requestDeserialize: deserialize_cln_PingRequest,
    responseSerialize: serialize_cln_PingResponse,
    responseDeserialize: deserialize_cln_PingResponse,
  },
  sendCustomMsg: {
    path: '/cln.Node/SendCustomMsg',
    requestStream: false,
    responseStream: false,
    requestType: cln_node_pb.SendcustommsgRequest,
    responseType: cln_node_pb.SendcustommsgResponse,
    requestSerialize: serialize_cln_SendcustommsgRequest,
    requestDeserialize: deserialize_cln_SendcustommsgRequest,
    responseSerialize: serialize_cln_SendcustommsgResponse,
    responseDeserialize: deserialize_cln_SendcustommsgResponse,
  },
  setChannel: {
    path: '/cln.Node/SetChannel',
    requestStream: false,
    responseStream: false,
    requestType: cln_node_pb.SetchannelRequest,
    responseType: cln_node_pb.SetchannelResponse,
    requestSerialize: serialize_cln_SetchannelRequest,
    requestDeserialize: deserialize_cln_SetchannelRequest,
    responseSerialize: serialize_cln_SetchannelResponse,
    responseDeserialize: deserialize_cln_SetchannelResponse,
  },
  signInvoice: {
    path: '/cln.Node/SignInvoice',
    requestStream: false,
    responseStream: false,
    requestType: cln_node_pb.SigninvoiceRequest,
    responseType: cln_node_pb.SigninvoiceResponse,
    requestSerialize: serialize_cln_SigninvoiceRequest,
    requestDeserialize: deserialize_cln_SigninvoiceRequest,
    responseSerialize: serialize_cln_SigninvoiceResponse,
    responseDeserialize: deserialize_cln_SigninvoiceResponse,
  },
  signMessage: {
    path: '/cln.Node/SignMessage',
    requestStream: false,
    responseStream: false,
    requestType: cln_node_pb.SignmessageRequest,
    responseType: cln_node_pb.SignmessageResponse,
    requestSerialize: serialize_cln_SignmessageRequest,
    requestDeserialize: deserialize_cln_SignmessageRequest,
    responseSerialize: serialize_cln_SignmessageResponse,
    responseDeserialize: deserialize_cln_SignmessageResponse,
  },
  waitBlockHeight: {
    path: '/cln.Node/WaitBlockHeight',
    requestStream: false,
    responseStream: false,
    requestType: cln_node_pb.WaitblockheightRequest,
    responseType: cln_node_pb.WaitblockheightResponse,
    requestSerialize: serialize_cln_WaitblockheightRequest,
    requestDeserialize: deserialize_cln_WaitblockheightRequest,
    responseSerialize: serialize_cln_WaitblockheightResponse,
    responseDeserialize: deserialize_cln_WaitblockheightResponse,
  },
  wait: {
    path: '/cln.Node/Wait',
    requestStream: false,
    responseStream: false,
    requestType: cln_node_pb.WaitRequest,
    responseType: cln_node_pb.WaitResponse,
    requestSerialize: serialize_cln_WaitRequest,
    requestDeserialize: deserialize_cln_WaitRequest,
    responseSerialize: serialize_cln_WaitResponse,
    responseDeserialize: deserialize_cln_WaitResponse,
  },
  stop: {
    path: '/cln.Node/Stop',
    requestStream: false,
    responseStream: false,
    requestType: cln_node_pb.StopRequest,
    responseType: cln_node_pb.StopResponse,
    requestSerialize: serialize_cln_StopRequest,
    requestDeserialize: deserialize_cln_StopRequest,
    responseSerialize: serialize_cln_StopResponse,
    responseDeserialize: deserialize_cln_StopResponse,
  },
  preApproveKeysend: {
    path: '/cln.Node/PreApproveKeysend',
    requestStream: false,
    responseStream: false,
    requestType: cln_node_pb.PreapprovekeysendRequest,
    responseType: cln_node_pb.PreapprovekeysendResponse,
    requestSerialize: serialize_cln_PreapprovekeysendRequest,
    requestDeserialize: deserialize_cln_PreapprovekeysendRequest,
    responseSerialize: serialize_cln_PreapprovekeysendResponse,
    responseDeserialize: deserialize_cln_PreapprovekeysendResponse,
  },
  preApproveInvoice: {
    path: '/cln.Node/PreApproveInvoice',
    requestStream: false,
    responseStream: false,
    requestType: cln_node_pb.PreapproveinvoiceRequest,
    responseType: cln_node_pb.PreapproveinvoiceResponse,
    requestSerialize: serialize_cln_PreapproveinvoiceRequest,
    requestDeserialize: deserialize_cln_PreapproveinvoiceRequest,
    responseSerialize: serialize_cln_PreapproveinvoiceResponse,
    responseDeserialize: deserialize_cln_PreapproveinvoiceResponse,
  },
  staticBackup: {
    path: '/cln.Node/StaticBackup',
    requestStream: false,
    responseStream: false,
    requestType: cln_node_pb.StaticbackupRequest,
    responseType: cln_node_pb.StaticbackupResponse,
    requestSerialize: serialize_cln_StaticbackupRequest,
    requestDeserialize: deserialize_cln_StaticbackupRequest,
    responseSerialize: serialize_cln_StaticbackupResponse,
    responseDeserialize: deserialize_cln_StaticbackupResponse,
  },
};

exports.NodeClient = grpc.makeGenericClientConstructor(NodeService);
