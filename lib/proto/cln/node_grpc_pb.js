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

function serialize_cln_AddpsbtoutputRequest(arg) {
  if (!(arg instanceof cln_node_pb.AddpsbtoutputRequest)) {
    throw new Error('Expected argument of type cln.AddpsbtoutputRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cln_AddpsbtoutputRequest(buffer_arg) {
  return cln_node_pb.AddpsbtoutputRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cln_AddpsbtoutputResponse(arg) {
  if (!(arg instanceof cln_node_pb.AddpsbtoutputResponse)) {
    throw new Error('Expected argument of type cln.AddpsbtoutputResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cln_AddpsbtoutputResponse(buffer_arg) {
  return cln_node_pb.AddpsbtoutputResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cln_AskreneageRequest(arg) {
  if (!(arg instanceof cln_node_pb.AskreneageRequest)) {
    throw new Error('Expected argument of type cln.AskreneageRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cln_AskreneageRequest(buffer_arg) {
  return cln_node_pb.AskreneageRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cln_AskreneageResponse(arg) {
  if (!(arg instanceof cln_node_pb.AskreneageResponse)) {
    throw new Error('Expected argument of type cln.AskreneageResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cln_AskreneageResponse(buffer_arg) {
  return cln_node_pb.AskreneageResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cln_AskrenebiaschannelRequest(arg) {
  if (!(arg instanceof cln_node_pb.AskrenebiaschannelRequest)) {
    throw new Error('Expected argument of type cln.AskrenebiaschannelRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cln_AskrenebiaschannelRequest(buffer_arg) {
  return cln_node_pb.AskrenebiaschannelRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cln_AskrenebiaschannelResponse(arg) {
  if (!(arg instanceof cln_node_pb.AskrenebiaschannelResponse)) {
    throw new Error('Expected argument of type cln.AskrenebiaschannelResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cln_AskrenebiaschannelResponse(buffer_arg) {
  return cln_node_pb.AskrenebiaschannelResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cln_AskrenecreatechannelRequest(arg) {
  if (!(arg instanceof cln_node_pb.AskrenecreatechannelRequest)) {
    throw new Error('Expected argument of type cln.AskrenecreatechannelRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cln_AskrenecreatechannelRequest(buffer_arg) {
  return cln_node_pb.AskrenecreatechannelRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cln_AskrenecreatechannelResponse(arg) {
  if (!(arg instanceof cln_node_pb.AskrenecreatechannelResponse)) {
    throw new Error('Expected argument of type cln.AskrenecreatechannelResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cln_AskrenecreatechannelResponse(buffer_arg) {
  return cln_node_pb.AskrenecreatechannelResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cln_AskrenecreatelayerRequest(arg) {
  if (!(arg instanceof cln_node_pb.AskrenecreatelayerRequest)) {
    throw new Error('Expected argument of type cln.AskrenecreatelayerRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cln_AskrenecreatelayerRequest(buffer_arg) {
  return cln_node_pb.AskrenecreatelayerRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cln_AskrenecreatelayerResponse(arg) {
  if (!(arg instanceof cln_node_pb.AskrenecreatelayerResponse)) {
    throw new Error('Expected argument of type cln.AskrenecreatelayerResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cln_AskrenecreatelayerResponse(buffer_arg) {
  return cln_node_pb.AskrenecreatelayerResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cln_AskrenedisablenodeRequest(arg) {
  if (!(arg instanceof cln_node_pb.AskrenedisablenodeRequest)) {
    throw new Error('Expected argument of type cln.AskrenedisablenodeRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cln_AskrenedisablenodeRequest(buffer_arg) {
  return cln_node_pb.AskrenedisablenodeRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cln_AskrenedisablenodeResponse(arg) {
  if (!(arg instanceof cln_node_pb.AskrenedisablenodeResponse)) {
    throw new Error('Expected argument of type cln.AskrenedisablenodeResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cln_AskrenedisablenodeResponse(buffer_arg) {
  return cln_node_pb.AskrenedisablenodeResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cln_AskreneinformchannelRequest(arg) {
  if (!(arg instanceof cln_node_pb.AskreneinformchannelRequest)) {
    throw new Error('Expected argument of type cln.AskreneinformchannelRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cln_AskreneinformchannelRequest(buffer_arg) {
  return cln_node_pb.AskreneinformchannelRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cln_AskreneinformchannelResponse(arg) {
  if (!(arg instanceof cln_node_pb.AskreneinformchannelResponse)) {
    throw new Error('Expected argument of type cln.AskreneinformchannelResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cln_AskreneinformchannelResponse(buffer_arg) {
  return cln_node_pb.AskreneinformchannelResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cln_AskrenelistlayersRequest(arg) {
  if (!(arg instanceof cln_node_pb.AskrenelistlayersRequest)) {
    throw new Error('Expected argument of type cln.AskrenelistlayersRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cln_AskrenelistlayersRequest(buffer_arg) {
  return cln_node_pb.AskrenelistlayersRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cln_AskrenelistlayersResponse(arg) {
  if (!(arg instanceof cln_node_pb.AskrenelistlayersResponse)) {
    throw new Error('Expected argument of type cln.AskrenelistlayersResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cln_AskrenelistlayersResponse(buffer_arg) {
  return cln_node_pb.AskrenelistlayersResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cln_AskrenelistreservationsRequest(arg) {
  if (!(arg instanceof cln_node_pb.AskrenelistreservationsRequest)) {
    throw new Error('Expected argument of type cln.AskrenelistreservationsRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cln_AskrenelistreservationsRequest(buffer_arg) {
  return cln_node_pb.AskrenelistreservationsRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cln_AskrenelistreservationsResponse(arg) {
  if (!(arg instanceof cln_node_pb.AskrenelistreservationsResponse)) {
    throw new Error('Expected argument of type cln.AskrenelistreservationsResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cln_AskrenelistreservationsResponse(buffer_arg) {
  return cln_node_pb.AskrenelistreservationsResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cln_AskreneremovelayerRequest(arg) {
  if (!(arg instanceof cln_node_pb.AskreneremovelayerRequest)) {
    throw new Error('Expected argument of type cln.AskreneremovelayerRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cln_AskreneremovelayerRequest(buffer_arg) {
  return cln_node_pb.AskreneremovelayerRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cln_AskreneremovelayerResponse(arg) {
  if (!(arg instanceof cln_node_pb.AskreneremovelayerResponse)) {
    throw new Error('Expected argument of type cln.AskreneremovelayerResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cln_AskreneremovelayerResponse(buffer_arg) {
  return cln_node_pb.AskreneremovelayerResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cln_AskrenereserveRequest(arg) {
  if (!(arg instanceof cln_node_pb.AskrenereserveRequest)) {
    throw new Error('Expected argument of type cln.AskrenereserveRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cln_AskrenereserveRequest(buffer_arg) {
  return cln_node_pb.AskrenereserveRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cln_AskrenereserveResponse(arg) {
  if (!(arg instanceof cln_node_pb.AskrenereserveResponse)) {
    throw new Error('Expected argument of type cln.AskrenereserveResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cln_AskrenereserveResponse(buffer_arg) {
  return cln_node_pb.AskrenereserveResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cln_AskreneunreserveRequest(arg) {
  if (!(arg instanceof cln_node_pb.AskreneunreserveRequest)) {
    throw new Error('Expected argument of type cln.AskreneunreserveRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cln_AskreneunreserveRequest(buffer_arg) {
  return cln_node_pb.AskreneunreserveRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cln_AskreneunreserveResponse(arg) {
  if (!(arg instanceof cln_node_pb.AskreneunreserveResponse)) {
    throw new Error('Expected argument of type cln.AskreneunreserveResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cln_AskreneunreserveResponse(buffer_arg) {
  return cln_node_pb.AskreneunreserveResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cln_AskreneupdatechannelRequest(arg) {
  if (!(arg instanceof cln_node_pb.AskreneupdatechannelRequest)) {
    throw new Error('Expected argument of type cln.AskreneupdatechannelRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cln_AskreneupdatechannelRequest(buffer_arg) {
  return cln_node_pb.AskreneupdatechannelRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cln_AskreneupdatechannelResponse(arg) {
  if (!(arg instanceof cln_node_pb.AskreneupdatechannelResponse)) {
    throw new Error('Expected argument of type cln.AskreneupdatechannelResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cln_AskreneupdatechannelResponse(buffer_arg) {
  return cln_node_pb.AskreneupdatechannelResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cln_AutocleanonceRequest(arg) {
  if (!(arg instanceof cln_node_pb.AutocleanonceRequest)) {
    throw new Error('Expected argument of type cln.AutocleanonceRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cln_AutocleanonceRequest(buffer_arg) {
  return cln_node_pb.AutocleanonceRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cln_AutocleanonceResponse(arg) {
  if (!(arg instanceof cln_node_pb.AutocleanonceResponse)) {
    throw new Error('Expected argument of type cln.AutocleanonceResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cln_AutocleanonceResponse(buffer_arg) {
  return cln_node_pb.AutocleanonceResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cln_AutocleanstatusRequest(arg) {
  if (!(arg instanceof cln_node_pb.AutocleanstatusRequest)) {
    throw new Error('Expected argument of type cln.AutocleanstatusRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cln_AutocleanstatusRequest(buffer_arg) {
  return cln_node_pb.AutocleanstatusRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cln_AutocleanstatusResponse(arg) {
  if (!(arg instanceof cln_node_pb.AutocleanstatusResponse)) {
    throw new Error('Expected argument of type cln.AutocleanstatusResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cln_AutocleanstatusResponse(buffer_arg) {
  return cln_node_pb.AutocleanstatusResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cln_BkprchannelsapyRequest(arg) {
  if (!(arg instanceof cln_node_pb.BkprchannelsapyRequest)) {
    throw new Error('Expected argument of type cln.BkprchannelsapyRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cln_BkprchannelsapyRequest(buffer_arg) {
  return cln_node_pb.BkprchannelsapyRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cln_BkprchannelsapyResponse(arg) {
  if (!(arg instanceof cln_node_pb.BkprchannelsapyResponse)) {
    throw new Error('Expected argument of type cln.BkprchannelsapyResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cln_BkprchannelsapyResponse(buffer_arg) {
  return cln_node_pb.BkprchannelsapyResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cln_BkprdumpincomecsvRequest(arg) {
  if (!(arg instanceof cln_node_pb.BkprdumpincomecsvRequest)) {
    throw new Error('Expected argument of type cln.BkprdumpincomecsvRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cln_BkprdumpincomecsvRequest(buffer_arg) {
  return cln_node_pb.BkprdumpincomecsvRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cln_BkprdumpincomecsvResponse(arg) {
  if (!(arg instanceof cln_node_pb.BkprdumpincomecsvResponse)) {
    throw new Error('Expected argument of type cln.BkprdumpincomecsvResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cln_BkprdumpincomecsvResponse(buffer_arg) {
  return cln_node_pb.BkprdumpincomecsvResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cln_BkpreditdescriptionbyoutpointRequest(arg) {
  if (!(arg instanceof cln_node_pb.BkpreditdescriptionbyoutpointRequest)) {
    throw new Error('Expected argument of type cln.BkpreditdescriptionbyoutpointRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cln_BkpreditdescriptionbyoutpointRequest(buffer_arg) {
  return cln_node_pb.BkpreditdescriptionbyoutpointRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cln_BkpreditdescriptionbyoutpointResponse(arg) {
  if (!(arg instanceof cln_node_pb.BkpreditdescriptionbyoutpointResponse)) {
    throw new Error('Expected argument of type cln.BkpreditdescriptionbyoutpointResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cln_BkpreditdescriptionbyoutpointResponse(buffer_arg) {
  return cln_node_pb.BkpreditdescriptionbyoutpointResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cln_BkpreditdescriptionbypaymentidRequest(arg) {
  if (!(arg instanceof cln_node_pb.BkpreditdescriptionbypaymentidRequest)) {
    throw new Error('Expected argument of type cln.BkpreditdescriptionbypaymentidRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cln_BkpreditdescriptionbypaymentidRequest(buffer_arg) {
  return cln_node_pb.BkpreditdescriptionbypaymentidRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cln_BkpreditdescriptionbypaymentidResponse(arg) {
  if (!(arg instanceof cln_node_pb.BkpreditdescriptionbypaymentidResponse)) {
    throw new Error('Expected argument of type cln.BkpreditdescriptionbypaymentidResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cln_BkpreditdescriptionbypaymentidResponse(buffer_arg) {
  return cln_node_pb.BkpreditdescriptionbypaymentidResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cln_BkprinspectRequest(arg) {
  if (!(arg instanceof cln_node_pb.BkprinspectRequest)) {
    throw new Error('Expected argument of type cln.BkprinspectRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cln_BkprinspectRequest(buffer_arg) {
  return cln_node_pb.BkprinspectRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cln_BkprinspectResponse(arg) {
  if (!(arg instanceof cln_node_pb.BkprinspectResponse)) {
    throw new Error('Expected argument of type cln.BkprinspectResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cln_BkprinspectResponse(buffer_arg) {
  return cln_node_pb.BkprinspectResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cln_BkprlistaccounteventsRequest(arg) {
  if (!(arg instanceof cln_node_pb.BkprlistaccounteventsRequest)) {
    throw new Error('Expected argument of type cln.BkprlistaccounteventsRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cln_BkprlistaccounteventsRequest(buffer_arg) {
  return cln_node_pb.BkprlistaccounteventsRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cln_BkprlistaccounteventsResponse(arg) {
  if (!(arg instanceof cln_node_pb.BkprlistaccounteventsResponse)) {
    throw new Error('Expected argument of type cln.BkprlistaccounteventsResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cln_BkprlistaccounteventsResponse(buffer_arg) {
  return cln_node_pb.BkprlistaccounteventsResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cln_BkprlistbalancesRequest(arg) {
  if (!(arg instanceof cln_node_pb.BkprlistbalancesRequest)) {
    throw new Error('Expected argument of type cln.BkprlistbalancesRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cln_BkprlistbalancesRequest(buffer_arg) {
  return cln_node_pb.BkprlistbalancesRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cln_BkprlistbalancesResponse(arg) {
  if (!(arg instanceof cln_node_pb.BkprlistbalancesResponse)) {
    throw new Error('Expected argument of type cln.BkprlistbalancesResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cln_BkprlistbalancesResponse(buffer_arg) {
  return cln_node_pb.BkprlistbalancesResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cln_BkprlistincomeRequest(arg) {
  if (!(arg instanceof cln_node_pb.BkprlistincomeRequest)) {
    throw new Error('Expected argument of type cln.BkprlistincomeRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cln_BkprlistincomeRequest(buffer_arg) {
  return cln_node_pb.BkprlistincomeRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cln_BkprlistincomeResponse(arg) {
  if (!(arg instanceof cln_node_pb.BkprlistincomeResponse)) {
    throw new Error('Expected argument of type cln.BkprlistincomeResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cln_BkprlistincomeResponse(buffer_arg) {
  return cln_node_pb.BkprlistincomeResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cln_BlacklistruneRequest(arg) {
  if (!(arg instanceof cln_node_pb.BlacklistruneRequest)) {
    throw new Error('Expected argument of type cln.BlacklistruneRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cln_BlacklistruneRequest(buffer_arg) {
  return cln_node_pb.BlacklistruneRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cln_BlacklistruneResponse(arg) {
  if (!(arg instanceof cln_node_pb.BlacklistruneResponse)) {
    throw new Error('Expected argument of type cln.BlacklistruneResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cln_BlacklistruneResponse(buffer_arg) {
  return cln_node_pb.BlacklistruneResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cln_BlockAddedNotification(arg) {
  if (!(arg instanceof cln_node_pb.BlockAddedNotification)) {
    throw new Error('Expected argument of type cln.BlockAddedNotification');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cln_BlockAddedNotification(buffer_arg) {
  return cln_node_pb.BlockAddedNotification.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cln_ChannelOpenFailedNotification(arg) {
  if (!(arg instanceof cln_node_pb.ChannelOpenFailedNotification)) {
    throw new Error('Expected argument of type cln.ChannelOpenFailedNotification');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cln_ChannelOpenFailedNotification(buffer_arg) {
  return cln_node_pb.ChannelOpenFailedNotification.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cln_ChannelOpenedNotification(arg) {
  if (!(arg instanceof cln_node_pb.ChannelOpenedNotification)) {
    throw new Error('Expected argument of type cln.ChannelOpenedNotification');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cln_ChannelOpenedNotification(buffer_arg) {
  return cln_node_pb.ChannelOpenedNotification.deserializeBinary(new Uint8Array(buffer_arg));
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

function serialize_cln_CheckruneRequest(arg) {
  if (!(arg instanceof cln_node_pb.CheckruneRequest)) {
    throw new Error('Expected argument of type cln.CheckruneRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cln_CheckruneRequest(buffer_arg) {
  return cln_node_pb.CheckruneRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cln_CheckruneResponse(arg) {
  if (!(arg instanceof cln_node_pb.CheckruneResponse)) {
    throw new Error('Expected argument of type cln.CheckruneResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cln_CheckruneResponse(buffer_arg) {
  return cln_node_pb.CheckruneResponse.deserializeBinary(new Uint8Array(buffer_arg));
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

function serialize_cln_CreateruneRequest(arg) {
  if (!(arg instanceof cln_node_pb.CreateruneRequest)) {
    throw new Error('Expected argument of type cln.CreateruneRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cln_CreateruneRequest(buffer_arg) {
  return cln_node_pb.CreateruneRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cln_CreateruneResponse(arg) {
  if (!(arg instanceof cln_node_pb.CreateruneResponse)) {
    throw new Error('Expected argument of type cln.CreateruneResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cln_CreateruneResponse(buffer_arg) {
  return cln_node_pb.CreateruneResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cln_CustomMsgNotification(arg) {
  if (!(arg instanceof cln_node_pb.CustomMsgNotification)) {
    throw new Error('Expected argument of type cln.CustomMsgNotification');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cln_CustomMsgNotification(buffer_arg) {
  return cln_node_pb.CustomMsgNotification.deserializeBinary(new Uint8Array(buffer_arg));
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

function serialize_cln_DelforwardRequest(arg) {
  if (!(arg instanceof cln_node_pb.DelforwardRequest)) {
    throw new Error('Expected argument of type cln.DelforwardRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cln_DelforwardRequest(buffer_arg) {
  return cln_node_pb.DelforwardRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cln_DelforwardResponse(arg) {
  if (!(arg instanceof cln_node_pb.DelforwardResponse)) {
    throw new Error('Expected argument of type cln.DelforwardResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cln_DelforwardResponse(buffer_arg) {
  return cln_node_pb.DelforwardResponse.deserializeBinary(new Uint8Array(buffer_arg));
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

function serialize_cln_DelpayRequest(arg) {
  if (!(arg instanceof cln_node_pb.DelpayRequest)) {
    throw new Error('Expected argument of type cln.DelpayRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cln_DelpayRequest(buffer_arg) {
  return cln_node_pb.DelpayRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cln_DelpayResponse(arg) {
  if (!(arg instanceof cln_node_pb.DelpayResponse)) {
    throw new Error('Expected argument of type cln.DelpayResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cln_DelpayResponse(buffer_arg) {
  return cln_node_pb.DelpayResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cln_DevforgetchannelRequest(arg) {
  if (!(arg instanceof cln_node_pb.DevforgetchannelRequest)) {
    throw new Error('Expected argument of type cln.DevforgetchannelRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cln_DevforgetchannelRequest(buffer_arg) {
  return cln_node_pb.DevforgetchannelRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cln_DevforgetchannelResponse(arg) {
  if (!(arg instanceof cln_node_pb.DevforgetchannelResponse)) {
    throw new Error('Expected argument of type cln.DevforgetchannelResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cln_DevforgetchannelResponse(buffer_arg) {
  return cln_node_pb.DevforgetchannelResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cln_DevspliceRequest(arg) {
  if (!(arg instanceof cln_node_pb.DevspliceRequest)) {
    throw new Error('Expected argument of type cln.DevspliceRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cln_DevspliceRequest(buffer_arg) {
  return cln_node_pb.DevspliceRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cln_DevspliceResponse(arg) {
  if (!(arg instanceof cln_node_pb.DevspliceResponse)) {
    throw new Error('Expected argument of type cln.DevspliceResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cln_DevspliceResponse(buffer_arg) {
  return cln_node_pb.DevspliceResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cln_DisableinvoicerequestRequest(arg) {
  if (!(arg instanceof cln_node_pb.DisableinvoicerequestRequest)) {
    throw new Error('Expected argument of type cln.DisableinvoicerequestRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cln_DisableinvoicerequestRequest(buffer_arg) {
  return cln_node_pb.DisableinvoicerequestRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cln_DisableinvoicerequestResponse(arg) {
  if (!(arg instanceof cln_node_pb.DisableinvoicerequestResponse)) {
    throw new Error('Expected argument of type cln.DisableinvoicerequestResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cln_DisableinvoicerequestResponse(buffer_arg) {
  return cln_node_pb.DisableinvoicerequestResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cln_DisableofferRequest(arg) {
  if (!(arg instanceof cln_node_pb.DisableofferRequest)) {
    throw new Error('Expected argument of type cln.DisableofferRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cln_DisableofferRequest(buffer_arg) {
  return cln_node_pb.DisableofferRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cln_DisableofferResponse(arg) {
  if (!(arg instanceof cln_node_pb.DisableofferResponse)) {
    throw new Error('Expected argument of type cln.DisableofferResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cln_DisableofferResponse(buffer_arg) {
  return cln_node_pb.DisableofferResponse.deserializeBinary(new Uint8Array(buffer_arg));
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

function serialize_cln_EmergencyrecoverRequest(arg) {
  if (!(arg instanceof cln_node_pb.EmergencyrecoverRequest)) {
    throw new Error('Expected argument of type cln.EmergencyrecoverRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cln_EmergencyrecoverRequest(buffer_arg) {
  return cln_node_pb.EmergencyrecoverRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cln_EmergencyrecoverResponse(arg) {
  if (!(arg instanceof cln_node_pb.EmergencyrecoverResponse)) {
    throw new Error('Expected argument of type cln.EmergencyrecoverResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cln_EmergencyrecoverResponse(buffer_arg) {
  return cln_node_pb.EmergencyrecoverResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cln_EnableofferRequest(arg) {
  if (!(arg instanceof cln_node_pb.EnableofferRequest)) {
    throw new Error('Expected argument of type cln.EnableofferRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cln_EnableofferRequest(buffer_arg) {
  return cln_node_pb.EnableofferRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cln_EnableofferResponse(arg) {
  if (!(arg instanceof cln_node_pb.EnableofferResponse)) {
    throw new Error('Expected argument of type cln.EnableofferResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cln_EnableofferResponse(buffer_arg) {
  return cln_node_pb.EnableofferResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cln_ExposesecretRequest(arg) {
  if (!(arg instanceof cln_node_pb.ExposesecretRequest)) {
    throw new Error('Expected argument of type cln.ExposesecretRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cln_ExposesecretRequest(buffer_arg) {
  return cln_node_pb.ExposesecretRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cln_ExposesecretResponse(arg) {
  if (!(arg instanceof cln_node_pb.ExposesecretResponse)) {
    throw new Error('Expected argument of type cln.ExposesecretResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cln_ExposesecretResponse(buffer_arg) {
  return cln_node_pb.ExposesecretResponse.deserializeBinary(new Uint8Array(buffer_arg));
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

function serialize_cln_Fundchannel_cancelRequest(arg) {
  if (!(arg instanceof cln_node_pb.Fundchannel_cancelRequest)) {
    throw new Error('Expected argument of type cln.Fundchannel_cancelRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cln_Fundchannel_cancelRequest(buffer_arg) {
  return cln_node_pb.Fundchannel_cancelRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cln_Fundchannel_cancelResponse(arg) {
  if (!(arg instanceof cln_node_pb.Fundchannel_cancelResponse)) {
    throw new Error('Expected argument of type cln.Fundchannel_cancelResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cln_Fundchannel_cancelResponse(buffer_arg) {
  return cln_node_pb.Fundchannel_cancelResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cln_Fundchannel_completeRequest(arg) {
  if (!(arg instanceof cln_node_pb.Fundchannel_completeRequest)) {
    throw new Error('Expected argument of type cln.Fundchannel_completeRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cln_Fundchannel_completeRequest(buffer_arg) {
  return cln_node_pb.Fundchannel_completeRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cln_Fundchannel_completeResponse(arg) {
  if (!(arg instanceof cln_node_pb.Fundchannel_completeResponse)) {
    throw new Error('Expected argument of type cln.Fundchannel_completeResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cln_Fundchannel_completeResponse(buffer_arg) {
  return cln_node_pb.Fundchannel_completeResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cln_Fundchannel_startRequest(arg) {
  if (!(arg instanceof cln_node_pb.Fundchannel_startRequest)) {
    throw new Error('Expected argument of type cln.Fundchannel_startRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cln_Fundchannel_startRequest(buffer_arg) {
  return cln_node_pb.Fundchannel_startRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cln_Fundchannel_startResponse(arg) {
  if (!(arg instanceof cln_node_pb.Fundchannel_startResponse)) {
    throw new Error('Expected argument of type cln.Fundchannel_startResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cln_Fundchannel_startResponse(buffer_arg) {
  return cln_node_pb.Fundchannel_startResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cln_FunderupdateRequest(arg) {
  if (!(arg instanceof cln_node_pb.FunderupdateRequest)) {
    throw new Error('Expected argument of type cln.FunderupdateRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cln_FunderupdateRequest(buffer_arg) {
  return cln_node_pb.FunderupdateRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cln_FunderupdateResponse(arg) {
  if (!(arg instanceof cln_node_pb.FunderupdateResponse)) {
    throw new Error('Expected argument of type cln.FunderupdateResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cln_FunderupdateResponse(buffer_arg) {
  return cln_node_pb.FunderupdateResponse.deserializeBinary(new Uint8Array(buffer_arg));
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

function serialize_cln_GetemergencyrecoverdataRequest(arg) {
  if (!(arg instanceof cln_node_pb.GetemergencyrecoverdataRequest)) {
    throw new Error('Expected argument of type cln.GetemergencyrecoverdataRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cln_GetemergencyrecoverdataRequest(buffer_arg) {
  return cln_node_pb.GetemergencyrecoverdataRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cln_GetemergencyrecoverdataResponse(arg) {
  if (!(arg instanceof cln_node_pb.GetemergencyrecoverdataResponse)) {
    throw new Error('Expected argument of type cln.GetemergencyrecoverdataResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cln_GetemergencyrecoverdataResponse(buffer_arg) {
  return cln_node_pb.GetemergencyrecoverdataResponse.deserializeBinary(new Uint8Array(buffer_arg));
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

function serialize_cln_GetlogRequest(arg) {
  if (!(arg instanceof cln_node_pb.GetlogRequest)) {
    throw new Error('Expected argument of type cln.GetlogRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cln_GetlogRequest(buffer_arg) {
  return cln_node_pb.GetlogRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cln_GetlogResponse(arg) {
  if (!(arg instanceof cln_node_pb.GetlogResponse)) {
    throw new Error('Expected argument of type cln.GetlogResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cln_GetlogResponse(buffer_arg) {
  return cln_node_pb.GetlogResponse.deserializeBinary(new Uint8Array(buffer_arg));
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

function serialize_cln_GetroutesRequest(arg) {
  if (!(arg instanceof cln_node_pb.GetroutesRequest)) {
    throw new Error('Expected argument of type cln.GetroutesRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cln_GetroutesRequest(buffer_arg) {
  return cln_node_pb.GetroutesRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cln_GetroutesResponse(arg) {
  if (!(arg instanceof cln_node_pb.GetroutesResponse)) {
    throw new Error('Expected argument of type cln.GetroutesResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cln_GetroutesResponse(buffer_arg) {
  return cln_node_pb.GetroutesResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cln_HelpRequest(arg) {
  if (!(arg instanceof cln_node_pb.HelpRequest)) {
    throw new Error('Expected argument of type cln.HelpRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cln_HelpRequest(buffer_arg) {
  return cln_node_pb.HelpRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cln_HelpResponse(arg) {
  if (!(arg instanceof cln_node_pb.HelpResponse)) {
    throw new Error('Expected argument of type cln.HelpResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cln_HelpResponse(buffer_arg) {
  return cln_node_pb.HelpResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cln_InjectpaymentonionRequest(arg) {
  if (!(arg instanceof cln_node_pb.InjectpaymentonionRequest)) {
    throw new Error('Expected argument of type cln.InjectpaymentonionRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cln_InjectpaymentonionRequest(buffer_arg) {
  return cln_node_pb.InjectpaymentonionRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cln_InjectpaymentonionResponse(arg) {
  if (!(arg instanceof cln_node_pb.InjectpaymentonionResponse)) {
    throw new Error('Expected argument of type cln.InjectpaymentonionResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cln_InjectpaymentonionResponse(buffer_arg) {
  return cln_node_pb.InjectpaymentonionResponse.deserializeBinary(new Uint8Array(buffer_arg));
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

function serialize_cln_InvoicerequestRequest(arg) {
  if (!(arg instanceof cln_node_pb.InvoicerequestRequest)) {
    throw new Error('Expected argument of type cln.InvoicerequestRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cln_InvoicerequestRequest(buffer_arg) {
  return cln_node_pb.InvoicerequestRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cln_InvoicerequestResponse(arg) {
  if (!(arg instanceof cln_node_pb.InvoicerequestResponse)) {
    throw new Error('Expected argument of type cln.InvoicerequestResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cln_InvoicerequestResponse(buffer_arg) {
  return cln_node_pb.InvoicerequestResponse.deserializeBinary(new Uint8Array(buffer_arg));
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

function serialize_cln_ListaddressesRequest(arg) {
  if (!(arg instanceof cln_node_pb.ListaddressesRequest)) {
    throw new Error('Expected argument of type cln.ListaddressesRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cln_ListaddressesRequest(buffer_arg) {
  return cln_node_pb.ListaddressesRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cln_ListaddressesResponse(arg) {
  if (!(arg instanceof cln_node_pb.ListaddressesResponse)) {
    throw new Error('Expected argument of type cln.ListaddressesResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cln_ListaddressesResponse(buffer_arg) {
  return cln_node_pb.ListaddressesResponse.deserializeBinary(new Uint8Array(buffer_arg));
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

function serialize_cln_ListconfigsRequest(arg) {
  if (!(arg instanceof cln_node_pb.ListconfigsRequest)) {
    throw new Error('Expected argument of type cln.ListconfigsRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cln_ListconfigsRequest(buffer_arg) {
  return cln_node_pb.ListconfigsRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cln_ListconfigsResponse(arg) {
  if (!(arg instanceof cln_node_pb.ListconfigsResponse)) {
    throw new Error('Expected argument of type cln.ListconfigsResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cln_ListconfigsResponse(buffer_arg) {
  return cln_node_pb.ListconfigsResponse.deserializeBinary(new Uint8Array(buffer_arg));
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

function serialize_cln_ListinvoicerequestsRequest(arg) {
  if (!(arg instanceof cln_node_pb.ListinvoicerequestsRequest)) {
    throw new Error('Expected argument of type cln.ListinvoicerequestsRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cln_ListinvoicerequestsRequest(buffer_arg) {
  return cln_node_pb.ListinvoicerequestsRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cln_ListinvoicerequestsResponse(arg) {
  if (!(arg instanceof cln_node_pb.ListinvoicerequestsResponse)) {
    throw new Error('Expected argument of type cln.ListinvoicerequestsResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cln_ListinvoicerequestsResponse(buffer_arg) {
  return cln_node_pb.ListinvoicerequestsResponse.deserializeBinary(new Uint8Array(buffer_arg));
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

function serialize_cln_ListoffersRequest(arg) {
  if (!(arg instanceof cln_node_pb.ListoffersRequest)) {
    throw new Error('Expected argument of type cln.ListoffersRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cln_ListoffersRequest(buffer_arg) {
  return cln_node_pb.ListoffersRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cln_ListoffersResponse(arg) {
  if (!(arg instanceof cln_node_pb.ListoffersResponse)) {
    throw new Error('Expected argument of type cln.ListoffersResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cln_ListoffersResponse(buffer_arg) {
  return cln_node_pb.ListoffersResponse.deserializeBinary(new Uint8Array(buffer_arg));
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

function serialize_cln_MakesecretRequest(arg) {
  if (!(arg instanceof cln_node_pb.MakesecretRequest)) {
    throw new Error('Expected argument of type cln.MakesecretRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cln_MakesecretRequest(buffer_arg) {
  return cln_node_pb.MakesecretRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cln_MakesecretResponse(arg) {
  if (!(arg instanceof cln_node_pb.MakesecretResponse)) {
    throw new Error('Expected argument of type cln.MakesecretResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cln_MakesecretResponse(buffer_arg) {
  return cln_node_pb.MakesecretResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cln_MultifundchannelRequest(arg) {
  if (!(arg instanceof cln_node_pb.MultifundchannelRequest)) {
    throw new Error('Expected argument of type cln.MultifundchannelRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cln_MultifundchannelRequest(buffer_arg) {
  return cln_node_pb.MultifundchannelRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cln_MultifundchannelResponse(arg) {
  if (!(arg instanceof cln_node_pb.MultifundchannelResponse)) {
    throw new Error('Expected argument of type cln.MultifundchannelResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cln_MultifundchannelResponse(buffer_arg) {
  return cln_node_pb.MultifundchannelResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cln_MultiwithdrawRequest(arg) {
  if (!(arg instanceof cln_node_pb.MultiwithdrawRequest)) {
    throw new Error('Expected argument of type cln.MultiwithdrawRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cln_MultiwithdrawRequest(buffer_arg) {
  return cln_node_pb.MultiwithdrawRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cln_MultiwithdrawResponse(arg) {
  if (!(arg instanceof cln_node_pb.MultiwithdrawResponse)) {
    throw new Error('Expected argument of type cln.MultiwithdrawResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cln_MultiwithdrawResponse(buffer_arg) {
  return cln_node_pb.MultiwithdrawResponse.deserializeBinary(new Uint8Array(buffer_arg));
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

function serialize_cln_OfferRequest(arg) {
  if (!(arg instanceof cln_node_pb.OfferRequest)) {
    throw new Error('Expected argument of type cln.OfferRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cln_OfferRequest(buffer_arg) {
  return cln_node_pb.OfferRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cln_OfferResponse(arg) {
  if (!(arg instanceof cln_node_pb.OfferResponse)) {
    throw new Error('Expected argument of type cln.OfferResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cln_OfferResponse(buffer_arg) {
  return cln_node_pb.OfferResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cln_Openchannel_abortRequest(arg) {
  if (!(arg instanceof cln_node_pb.Openchannel_abortRequest)) {
    throw new Error('Expected argument of type cln.Openchannel_abortRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cln_Openchannel_abortRequest(buffer_arg) {
  return cln_node_pb.Openchannel_abortRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cln_Openchannel_abortResponse(arg) {
  if (!(arg instanceof cln_node_pb.Openchannel_abortResponse)) {
    throw new Error('Expected argument of type cln.Openchannel_abortResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cln_Openchannel_abortResponse(buffer_arg) {
  return cln_node_pb.Openchannel_abortResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cln_Openchannel_bumpRequest(arg) {
  if (!(arg instanceof cln_node_pb.Openchannel_bumpRequest)) {
    throw new Error('Expected argument of type cln.Openchannel_bumpRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cln_Openchannel_bumpRequest(buffer_arg) {
  return cln_node_pb.Openchannel_bumpRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cln_Openchannel_bumpResponse(arg) {
  if (!(arg instanceof cln_node_pb.Openchannel_bumpResponse)) {
    throw new Error('Expected argument of type cln.Openchannel_bumpResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cln_Openchannel_bumpResponse(buffer_arg) {
  return cln_node_pb.Openchannel_bumpResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cln_Openchannel_initRequest(arg) {
  if (!(arg instanceof cln_node_pb.Openchannel_initRequest)) {
    throw new Error('Expected argument of type cln.Openchannel_initRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cln_Openchannel_initRequest(buffer_arg) {
  return cln_node_pb.Openchannel_initRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cln_Openchannel_initResponse(arg) {
  if (!(arg instanceof cln_node_pb.Openchannel_initResponse)) {
    throw new Error('Expected argument of type cln.Openchannel_initResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cln_Openchannel_initResponse(buffer_arg) {
  return cln_node_pb.Openchannel_initResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cln_Openchannel_signedRequest(arg) {
  if (!(arg instanceof cln_node_pb.Openchannel_signedRequest)) {
    throw new Error('Expected argument of type cln.Openchannel_signedRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cln_Openchannel_signedRequest(buffer_arg) {
  return cln_node_pb.Openchannel_signedRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cln_Openchannel_signedResponse(arg) {
  if (!(arg instanceof cln_node_pb.Openchannel_signedResponse)) {
    throw new Error('Expected argument of type cln.Openchannel_signedResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cln_Openchannel_signedResponse(buffer_arg) {
  return cln_node_pb.Openchannel_signedResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cln_Openchannel_updateRequest(arg) {
  if (!(arg instanceof cln_node_pb.Openchannel_updateRequest)) {
    throw new Error('Expected argument of type cln.Openchannel_updateRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cln_Openchannel_updateRequest(buffer_arg) {
  return cln_node_pb.Openchannel_updateRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cln_Openchannel_updateResponse(arg) {
  if (!(arg instanceof cln_node_pb.Openchannel_updateResponse)) {
    throw new Error('Expected argument of type cln.Openchannel_updateResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cln_Openchannel_updateResponse(buffer_arg) {
  return cln_node_pb.Openchannel_updateResponse.deserializeBinary(new Uint8Array(buffer_arg));
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

function serialize_cln_PeerConnectNotification(arg) {
  if (!(arg instanceof cln_node_pb.PeerConnectNotification)) {
    throw new Error('Expected argument of type cln.PeerConnectNotification');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cln_PeerConnectNotification(buffer_arg) {
  return cln_node_pb.PeerConnectNotification.deserializeBinary(new Uint8Array(buffer_arg));
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

function serialize_cln_PluginRequest(arg) {
  if (!(arg instanceof cln_node_pb.PluginRequest)) {
    throw new Error('Expected argument of type cln.PluginRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cln_PluginRequest(buffer_arg) {
  return cln_node_pb.PluginRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cln_PluginResponse(arg) {
  if (!(arg instanceof cln_node_pb.PluginResponse)) {
    throw new Error('Expected argument of type cln.PluginResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cln_PluginResponse(buffer_arg) {
  return cln_node_pb.PluginResponse.deserializeBinary(new Uint8Array(buffer_arg));
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

function serialize_cln_RecoverRequest(arg) {
  if (!(arg instanceof cln_node_pb.RecoverRequest)) {
    throw new Error('Expected argument of type cln.RecoverRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cln_RecoverRequest(buffer_arg) {
  return cln_node_pb.RecoverRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cln_RecoverResponse(arg) {
  if (!(arg instanceof cln_node_pb.RecoverResponse)) {
    throw new Error('Expected argument of type cln.RecoverResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cln_RecoverResponse(buffer_arg) {
  return cln_node_pb.RecoverResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cln_RecoverchannelRequest(arg) {
  if (!(arg instanceof cln_node_pb.RecoverchannelRequest)) {
    throw new Error('Expected argument of type cln.RecoverchannelRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cln_RecoverchannelRequest(buffer_arg) {
  return cln_node_pb.RecoverchannelRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cln_RecoverchannelResponse(arg) {
  if (!(arg instanceof cln_node_pb.RecoverchannelResponse)) {
    throw new Error('Expected argument of type cln.RecoverchannelResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cln_RecoverchannelResponse(buffer_arg) {
  return cln_node_pb.RecoverchannelResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cln_RenepayRequest(arg) {
  if (!(arg instanceof cln_node_pb.RenepayRequest)) {
    throw new Error('Expected argument of type cln.RenepayRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cln_RenepayRequest(buffer_arg) {
  return cln_node_pb.RenepayRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cln_RenepayResponse(arg) {
  if (!(arg instanceof cln_node_pb.RenepayResponse)) {
    throw new Error('Expected argument of type cln.RenepayResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cln_RenepayResponse(buffer_arg) {
  return cln_node_pb.RenepayResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cln_RenepaystatusRequest(arg) {
  if (!(arg instanceof cln_node_pb.RenepaystatusRequest)) {
    throw new Error('Expected argument of type cln.RenepaystatusRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cln_RenepaystatusRequest(buffer_arg) {
  return cln_node_pb.RenepaystatusRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cln_RenepaystatusResponse(arg) {
  if (!(arg instanceof cln_node_pb.RenepaystatusResponse)) {
    throw new Error('Expected argument of type cln.RenepaystatusResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cln_RenepaystatusResponse(buffer_arg) {
  return cln_node_pb.RenepaystatusResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cln_ReserveinputsRequest(arg) {
  if (!(arg instanceof cln_node_pb.ReserveinputsRequest)) {
    throw new Error('Expected argument of type cln.ReserveinputsRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cln_ReserveinputsRequest(buffer_arg) {
  return cln_node_pb.ReserveinputsRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cln_ReserveinputsResponse(arg) {
  if (!(arg instanceof cln_node_pb.ReserveinputsResponse)) {
    throw new Error('Expected argument of type cln.ReserveinputsResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cln_ReserveinputsResponse(buffer_arg) {
  return cln_node_pb.ReserveinputsResponse.deserializeBinary(new Uint8Array(buffer_arg));
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

function serialize_cln_SendinvoiceRequest(arg) {
  if (!(arg instanceof cln_node_pb.SendinvoiceRequest)) {
    throw new Error('Expected argument of type cln.SendinvoiceRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cln_SendinvoiceRequest(buffer_arg) {
  return cln_node_pb.SendinvoiceRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cln_SendinvoiceResponse(arg) {
  if (!(arg instanceof cln_node_pb.SendinvoiceResponse)) {
    throw new Error('Expected argument of type cln.SendinvoiceResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cln_SendinvoiceResponse(buffer_arg) {
  return cln_node_pb.SendinvoiceResponse.deserializeBinary(new Uint8Array(buffer_arg));
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

function serialize_cln_SetconfigRequest(arg) {
  if (!(arg instanceof cln_node_pb.SetconfigRequest)) {
    throw new Error('Expected argument of type cln.SetconfigRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cln_SetconfigRequest(buffer_arg) {
  return cln_node_pb.SetconfigRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cln_SetconfigResponse(arg) {
  if (!(arg instanceof cln_node_pb.SetconfigResponse)) {
    throw new Error('Expected argument of type cln.SetconfigResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cln_SetconfigResponse(buffer_arg) {
  return cln_node_pb.SetconfigResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cln_SetpsbtversionRequest(arg) {
  if (!(arg instanceof cln_node_pb.SetpsbtversionRequest)) {
    throw new Error('Expected argument of type cln.SetpsbtversionRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cln_SetpsbtversionRequest(buffer_arg) {
  return cln_node_pb.SetpsbtversionRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cln_SetpsbtversionResponse(arg) {
  if (!(arg instanceof cln_node_pb.SetpsbtversionResponse)) {
    throw new Error('Expected argument of type cln.SetpsbtversionResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cln_SetpsbtversionResponse(buffer_arg) {
  return cln_node_pb.SetpsbtversionResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cln_ShowrunesRequest(arg) {
  if (!(arg instanceof cln_node_pb.ShowrunesRequest)) {
    throw new Error('Expected argument of type cln.ShowrunesRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cln_ShowrunesRequest(buffer_arg) {
  return cln_node_pb.ShowrunesRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cln_ShowrunesResponse(arg) {
  if (!(arg instanceof cln_node_pb.ShowrunesResponse)) {
    throw new Error('Expected argument of type cln.ShowrunesResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cln_ShowrunesResponse(buffer_arg) {
  return cln_node_pb.ShowrunesResponse.deserializeBinary(new Uint8Array(buffer_arg));
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

function serialize_cln_Splice_initRequest(arg) {
  if (!(arg instanceof cln_node_pb.Splice_initRequest)) {
    throw new Error('Expected argument of type cln.Splice_initRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cln_Splice_initRequest(buffer_arg) {
  return cln_node_pb.Splice_initRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cln_Splice_initResponse(arg) {
  if (!(arg instanceof cln_node_pb.Splice_initResponse)) {
    throw new Error('Expected argument of type cln.Splice_initResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cln_Splice_initResponse(buffer_arg) {
  return cln_node_pb.Splice_initResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cln_Splice_signedRequest(arg) {
  if (!(arg instanceof cln_node_pb.Splice_signedRequest)) {
    throw new Error('Expected argument of type cln.Splice_signedRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cln_Splice_signedRequest(buffer_arg) {
  return cln_node_pb.Splice_signedRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cln_Splice_signedResponse(arg) {
  if (!(arg instanceof cln_node_pb.Splice_signedResponse)) {
    throw new Error('Expected argument of type cln.Splice_signedResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cln_Splice_signedResponse(buffer_arg) {
  return cln_node_pb.Splice_signedResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cln_Splice_updateRequest(arg) {
  if (!(arg instanceof cln_node_pb.Splice_updateRequest)) {
    throw new Error('Expected argument of type cln.Splice_updateRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cln_Splice_updateRequest(buffer_arg) {
  return cln_node_pb.Splice_updateRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cln_Splice_updateResponse(arg) {
  if (!(arg instanceof cln_node_pb.Splice_updateResponse)) {
    throw new Error('Expected argument of type cln.Splice_updateResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cln_Splice_updateResponse(buffer_arg) {
  return cln_node_pb.Splice_updateResponse.deserializeBinary(new Uint8Array(buffer_arg));
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

function serialize_cln_StreamBlockAddedRequest(arg) {
  if (!(arg instanceof cln_node_pb.StreamBlockAddedRequest)) {
    throw new Error('Expected argument of type cln.StreamBlockAddedRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cln_StreamBlockAddedRequest(buffer_arg) {
  return cln_node_pb.StreamBlockAddedRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cln_StreamChannelOpenFailedRequest(arg) {
  if (!(arg instanceof cln_node_pb.StreamChannelOpenFailedRequest)) {
    throw new Error('Expected argument of type cln.StreamChannelOpenFailedRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cln_StreamChannelOpenFailedRequest(buffer_arg) {
  return cln_node_pb.StreamChannelOpenFailedRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cln_StreamChannelOpenedRequest(arg) {
  if (!(arg instanceof cln_node_pb.StreamChannelOpenedRequest)) {
    throw new Error('Expected argument of type cln.StreamChannelOpenedRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cln_StreamChannelOpenedRequest(buffer_arg) {
  return cln_node_pb.StreamChannelOpenedRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cln_StreamConnectRequest(arg) {
  if (!(arg instanceof cln_node_pb.StreamConnectRequest)) {
    throw new Error('Expected argument of type cln.StreamConnectRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cln_StreamConnectRequest(buffer_arg) {
  return cln_node_pb.StreamConnectRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cln_StreamCustomMsgRequest(arg) {
  if (!(arg instanceof cln_node_pb.StreamCustomMsgRequest)) {
    throw new Error('Expected argument of type cln.StreamCustomMsgRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cln_StreamCustomMsgRequest(buffer_arg) {
  return cln_node_pb.StreamCustomMsgRequest.deserializeBinary(new Uint8Array(buffer_arg));
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

function serialize_cln_UnreserveinputsRequest(arg) {
  if (!(arg instanceof cln_node_pb.UnreserveinputsRequest)) {
    throw new Error('Expected argument of type cln.UnreserveinputsRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cln_UnreserveinputsRequest(buffer_arg) {
  return cln_node_pb.UnreserveinputsRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cln_UnreserveinputsResponse(arg) {
  if (!(arg instanceof cln_node_pb.UnreserveinputsResponse)) {
    throw new Error('Expected argument of type cln.UnreserveinputsResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cln_UnreserveinputsResponse(buffer_arg) {
  return cln_node_pb.UnreserveinputsResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cln_UpgradewalletRequest(arg) {
  if (!(arg instanceof cln_node_pb.UpgradewalletRequest)) {
    throw new Error('Expected argument of type cln.UpgradewalletRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cln_UpgradewalletRequest(buffer_arg) {
  return cln_node_pb.UpgradewalletRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cln_UpgradewalletResponse(arg) {
  if (!(arg instanceof cln_node_pb.UpgradewalletResponse)) {
    throw new Error('Expected argument of type cln.UpgradewalletResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cln_UpgradewalletResponse(buffer_arg) {
  return cln_node_pb.UpgradewalletResponse.deserializeBinary(new Uint8Array(buffer_arg));
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

function serialize_cln_XpayRequest(arg) {
  if (!(arg instanceof cln_node_pb.XpayRequest)) {
    throw new Error('Expected argument of type cln.XpayRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cln_XpayRequest(buffer_arg) {
  return cln_node_pb.XpayRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cln_XpayResponse(arg) {
  if (!(arg instanceof cln_node_pb.XpayResponse)) {
    throw new Error('Expected argument of type cln.XpayResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cln_XpayResponse(buffer_arg) {
  return cln_node_pb.XpayResponse.deserializeBinary(new Uint8Array(buffer_arg));
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
  addPsbtOutput: {
    path: '/cln.Node/AddPsbtOutput',
    requestStream: false,
    responseStream: false,
    requestType: cln_node_pb.AddpsbtoutputRequest,
    responseType: cln_node_pb.AddpsbtoutputResponse,
    requestSerialize: serialize_cln_AddpsbtoutputRequest,
    requestDeserialize: deserialize_cln_AddpsbtoutputRequest,
    responseSerialize: serialize_cln_AddpsbtoutputResponse,
    responseDeserialize: deserialize_cln_AddpsbtoutputResponse,
  },
  autoCleanOnce: {
    path: '/cln.Node/AutoCleanOnce',
    requestStream: false,
    responseStream: false,
    requestType: cln_node_pb.AutocleanonceRequest,
    responseType: cln_node_pb.AutocleanonceResponse,
    requestSerialize: serialize_cln_AutocleanonceRequest,
    requestDeserialize: deserialize_cln_AutocleanonceRequest,
    responseSerialize: serialize_cln_AutocleanonceResponse,
    responseDeserialize: deserialize_cln_AutocleanonceResponse,
  },
  autoCleanStatus: {
    path: '/cln.Node/AutoCleanStatus',
    requestStream: false,
    responseStream: false,
    requestType: cln_node_pb.AutocleanstatusRequest,
    responseType: cln_node_pb.AutocleanstatusResponse,
    requestSerialize: serialize_cln_AutocleanstatusRequest,
    requestDeserialize: deserialize_cln_AutocleanstatusRequest,
    responseSerialize: serialize_cln_AutocleanstatusResponse,
    responseDeserialize: deserialize_cln_AutocleanstatusResponse,
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
  devForgetChannel: {
    path: '/cln.Node/DevForgetChannel',
    requestStream: false,
    responseStream: false,
    requestType: cln_node_pb.DevforgetchannelRequest,
    responseType: cln_node_pb.DevforgetchannelResponse,
    requestSerialize: serialize_cln_DevforgetchannelRequest,
    requestDeserialize: deserialize_cln_DevforgetchannelRequest,
    responseSerialize: serialize_cln_DevforgetchannelResponse,
    responseDeserialize: deserialize_cln_DevforgetchannelResponse,
  },
  emergencyRecover: {
    path: '/cln.Node/EmergencyRecover',
    requestStream: false,
    responseStream: false,
    requestType: cln_node_pb.EmergencyrecoverRequest,
    responseType: cln_node_pb.EmergencyrecoverResponse,
    requestSerialize: serialize_cln_EmergencyrecoverRequest,
    requestDeserialize: deserialize_cln_EmergencyrecoverRequest,
    responseSerialize: serialize_cln_EmergencyrecoverResponse,
    responseDeserialize: deserialize_cln_EmergencyrecoverResponse,
  },
  getEmergencyRecoverData: {
    path: '/cln.Node/GetEmergencyRecoverData',
    requestStream: false,
    responseStream: false,
    requestType: cln_node_pb.GetemergencyrecoverdataRequest,
    responseType: cln_node_pb.GetemergencyrecoverdataResponse,
    requestSerialize: serialize_cln_GetemergencyrecoverdataRequest,
    requestDeserialize: deserialize_cln_GetemergencyrecoverdataRequest,
    responseSerialize: serialize_cln_GetemergencyrecoverdataResponse,
    responseDeserialize: deserialize_cln_GetemergencyrecoverdataResponse,
  },
  exposeSecret: {
    path: '/cln.Node/ExposeSecret',
    requestStream: false,
    responseStream: false,
    requestType: cln_node_pb.ExposesecretRequest,
    responseType: cln_node_pb.ExposesecretResponse,
    requestSerialize: serialize_cln_ExposesecretRequest,
    requestDeserialize: deserialize_cln_ExposesecretRequest,
    responseSerialize: serialize_cln_ExposesecretResponse,
    responseDeserialize: deserialize_cln_ExposesecretResponse,
  },
  recover: {
    path: '/cln.Node/Recover',
    requestStream: false,
    responseStream: false,
    requestType: cln_node_pb.RecoverRequest,
    responseType: cln_node_pb.RecoverResponse,
    requestSerialize: serialize_cln_RecoverRequest,
    requestDeserialize: deserialize_cln_RecoverRequest,
    responseSerialize: serialize_cln_RecoverResponse,
    responseDeserialize: deserialize_cln_RecoverResponse,
  },
  recoverChannel: {
    path: '/cln.Node/RecoverChannel',
    requestStream: false,
    responseStream: false,
    requestType: cln_node_pb.RecoverchannelRequest,
    responseType: cln_node_pb.RecoverchannelResponse,
    requestSerialize: serialize_cln_RecoverchannelRequest,
    requestDeserialize: deserialize_cln_RecoverchannelRequest,
    responseSerialize: serialize_cln_RecoverchannelResponse,
    responseDeserialize: deserialize_cln_RecoverchannelResponse,
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
  createInvoiceRequest: {
    path: '/cln.Node/CreateInvoiceRequest',
    requestStream: false,
    responseStream: false,
    requestType: cln_node_pb.InvoicerequestRequest,
    responseType: cln_node_pb.InvoicerequestResponse,
    requestSerialize: serialize_cln_InvoicerequestRequest,
    requestDeserialize: deserialize_cln_InvoicerequestRequest,
    responseSerialize: serialize_cln_InvoicerequestResponse,
    responseDeserialize: deserialize_cln_InvoicerequestResponse,
  },
  disableInvoiceRequest: {
    path: '/cln.Node/DisableInvoiceRequest',
    requestStream: false,
    responseStream: false,
    requestType: cln_node_pb.DisableinvoicerequestRequest,
    responseType: cln_node_pb.DisableinvoicerequestResponse,
    requestSerialize: serialize_cln_DisableinvoicerequestRequest,
    requestDeserialize: deserialize_cln_DisableinvoicerequestRequest,
    responseSerialize: serialize_cln_DisableinvoicerequestResponse,
    responseDeserialize: deserialize_cln_DisableinvoicerequestResponse,
  },
  listInvoiceRequests: {
    path: '/cln.Node/ListInvoiceRequests',
    requestStream: false,
    responseStream: false,
    requestType: cln_node_pb.ListinvoicerequestsRequest,
    responseType: cln_node_pb.ListinvoicerequestsResponse,
    requestSerialize: serialize_cln_ListinvoicerequestsRequest,
    requestDeserialize: deserialize_cln_ListinvoicerequestsRequest,
    responseSerialize: serialize_cln_ListinvoicerequestsResponse,
    responseDeserialize: deserialize_cln_ListinvoicerequestsResponse,
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
  makeSecret: {
    path: '/cln.Node/MakeSecret',
    requestStream: false,
    responseStream: false,
    requestType: cln_node_pb.MakesecretRequest,
    responseType: cln_node_pb.MakesecretResponse,
    requestSerialize: serialize_cln_MakesecretRequest,
    requestDeserialize: deserialize_cln_MakesecretRequest,
    responseSerialize: serialize_cln_MakesecretResponse,
    responseDeserialize: deserialize_cln_MakesecretResponse,
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
  delPay: {
    path: '/cln.Node/DelPay',
    requestStream: false,
    responseStream: false,
    requestType: cln_node_pb.DelpayRequest,
    responseType: cln_node_pb.DelpayResponse,
    requestSerialize: serialize_cln_DelpayRequest,
    requestDeserialize: deserialize_cln_DelpayRequest,
    responseSerialize: serialize_cln_DelpayResponse,
    responseDeserialize: deserialize_cln_DelpayResponse,
  },
  delForward: {
    path: '/cln.Node/DelForward',
    requestStream: false,
    responseStream: false,
    requestType: cln_node_pb.DelforwardRequest,
    responseType: cln_node_pb.DelforwardResponse,
    requestSerialize: serialize_cln_DelforwardRequest,
    requestDeserialize: deserialize_cln_DelforwardRequest,
    responseSerialize: serialize_cln_DelforwardResponse,
    responseDeserialize: deserialize_cln_DelforwardResponse,
  },
  disableOffer: {
    path: '/cln.Node/DisableOffer',
    requestStream: false,
    responseStream: false,
    requestType: cln_node_pb.DisableofferRequest,
    responseType: cln_node_pb.DisableofferResponse,
    requestSerialize: serialize_cln_DisableofferRequest,
    requestDeserialize: deserialize_cln_DisableofferRequest,
    responseSerialize: serialize_cln_DisableofferResponse,
    responseDeserialize: deserialize_cln_DisableofferResponse,
  },
  enableOffer: {
    path: '/cln.Node/EnableOffer',
    requestStream: false,
    responseStream: false,
    requestType: cln_node_pb.EnableofferRequest,
    responseType: cln_node_pb.EnableofferResponse,
    requestSerialize: serialize_cln_EnableofferRequest,
    requestDeserialize: deserialize_cln_EnableofferRequest,
    responseSerialize: serialize_cln_EnableofferResponse,
    responseDeserialize: deserialize_cln_EnableofferResponse,
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
  fundChannel_Cancel: {
    path: '/cln.Node/FundChannel_Cancel',
    requestStream: false,
    responseStream: false,
    requestType: cln_node_pb.Fundchannel_cancelRequest,
    responseType: cln_node_pb.Fundchannel_cancelResponse,
    requestSerialize: serialize_cln_Fundchannel_cancelRequest,
    requestDeserialize: deserialize_cln_Fundchannel_cancelRequest,
    responseSerialize: serialize_cln_Fundchannel_cancelResponse,
    responseDeserialize: deserialize_cln_Fundchannel_cancelResponse,
  },
  fundChannel_Complete: {
    path: '/cln.Node/FundChannel_Complete',
    requestStream: false,
    responseStream: false,
    requestType: cln_node_pb.Fundchannel_completeRequest,
    responseType: cln_node_pb.Fundchannel_completeResponse,
    requestSerialize: serialize_cln_Fundchannel_completeRequest,
    requestDeserialize: deserialize_cln_Fundchannel_completeRequest,
    responseSerialize: serialize_cln_Fundchannel_completeResponse,
    responseDeserialize: deserialize_cln_Fundchannel_completeResponse,
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
  fundChannel_Start: {
    path: '/cln.Node/FundChannel_Start',
    requestStream: false,
    responseStream: false,
    requestType: cln_node_pb.Fundchannel_startRequest,
    responseType: cln_node_pb.Fundchannel_startResponse,
    requestSerialize: serialize_cln_Fundchannel_startRequest,
    requestDeserialize: deserialize_cln_Fundchannel_startRequest,
    responseSerialize: serialize_cln_Fundchannel_startResponse,
    responseDeserialize: deserialize_cln_Fundchannel_startResponse,
  },
  getLog: {
    path: '/cln.Node/GetLog',
    requestStream: false,
    responseStream: false,
    requestType: cln_node_pb.GetlogRequest,
    responseType: cln_node_pb.GetlogResponse,
    requestSerialize: serialize_cln_GetlogRequest,
    requestDeserialize: deserialize_cln_GetlogRequest,
    responseSerialize: serialize_cln_GetlogResponse,
    responseDeserialize: deserialize_cln_GetlogResponse,
  },
  funderUpdate: {
    path: '/cln.Node/FunderUpdate',
    requestStream: false,
    responseStream: false,
    requestType: cln_node_pb.FunderupdateRequest,
    responseType: cln_node_pb.FunderupdateResponse,
    requestSerialize: serialize_cln_FunderupdateRequest,
    requestDeserialize: deserialize_cln_FunderupdateRequest,
    responseSerialize: serialize_cln_FunderupdateResponse,
    responseDeserialize: deserialize_cln_FunderupdateResponse,
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
  listAddresses: {
    path: '/cln.Node/ListAddresses',
    requestStream: false,
    responseStream: false,
    requestType: cln_node_pb.ListaddressesRequest,
    responseType: cln_node_pb.ListaddressesResponse,
    requestSerialize: serialize_cln_ListaddressesRequest,
    requestDeserialize: deserialize_cln_ListaddressesRequest,
    responseSerialize: serialize_cln_ListaddressesResponse,
    responseDeserialize: deserialize_cln_ListaddressesResponse,
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
  listOffers: {
    path: '/cln.Node/ListOffers',
    requestStream: false,
    responseStream: false,
    requestType: cln_node_pb.ListoffersRequest,
    responseType: cln_node_pb.ListoffersResponse,
    requestSerialize: serialize_cln_ListoffersRequest,
    requestDeserialize: deserialize_cln_ListoffersRequest,
    responseSerialize: serialize_cln_ListoffersResponse,
    responseDeserialize: deserialize_cln_ListoffersResponse,
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
  multiFundChannel: {
    path: '/cln.Node/MultiFundChannel',
    requestStream: false,
    responseStream: false,
    requestType: cln_node_pb.MultifundchannelRequest,
    responseType: cln_node_pb.MultifundchannelResponse,
    requestSerialize: serialize_cln_MultifundchannelRequest,
    requestDeserialize: deserialize_cln_MultifundchannelRequest,
    responseSerialize: serialize_cln_MultifundchannelResponse,
    responseDeserialize: deserialize_cln_MultifundchannelResponse,
  },
  multiWithdraw: {
    path: '/cln.Node/MultiWithdraw',
    requestStream: false,
    responseStream: false,
    requestType: cln_node_pb.MultiwithdrawRequest,
    responseType: cln_node_pb.MultiwithdrawResponse,
    requestSerialize: serialize_cln_MultiwithdrawRequest,
    requestDeserialize: deserialize_cln_MultiwithdrawRequest,
    responseSerialize: serialize_cln_MultiwithdrawResponse,
    responseDeserialize: deserialize_cln_MultiwithdrawResponse,
  },
  offer: {
    path: '/cln.Node/Offer',
    requestStream: false,
    responseStream: false,
    requestType: cln_node_pb.OfferRequest,
    responseType: cln_node_pb.OfferResponse,
    requestSerialize: serialize_cln_OfferRequest,
    requestDeserialize: deserialize_cln_OfferRequest,
    responseSerialize: serialize_cln_OfferResponse,
    responseDeserialize: deserialize_cln_OfferResponse,
  },
  openChannel_Abort: {
    path: '/cln.Node/OpenChannel_Abort',
    requestStream: false,
    responseStream: false,
    requestType: cln_node_pb.Openchannel_abortRequest,
    responseType: cln_node_pb.Openchannel_abortResponse,
    requestSerialize: serialize_cln_Openchannel_abortRequest,
    requestDeserialize: deserialize_cln_Openchannel_abortRequest,
    responseSerialize: serialize_cln_Openchannel_abortResponse,
    responseDeserialize: deserialize_cln_Openchannel_abortResponse,
  },
  openChannel_Bump: {
    path: '/cln.Node/OpenChannel_Bump',
    requestStream: false,
    responseStream: false,
    requestType: cln_node_pb.Openchannel_bumpRequest,
    responseType: cln_node_pb.Openchannel_bumpResponse,
    requestSerialize: serialize_cln_Openchannel_bumpRequest,
    requestDeserialize: deserialize_cln_Openchannel_bumpRequest,
    responseSerialize: serialize_cln_Openchannel_bumpResponse,
    responseDeserialize: deserialize_cln_Openchannel_bumpResponse,
  },
  openChannel_Init: {
    path: '/cln.Node/OpenChannel_Init',
    requestStream: false,
    responseStream: false,
    requestType: cln_node_pb.Openchannel_initRequest,
    responseType: cln_node_pb.Openchannel_initResponse,
    requestSerialize: serialize_cln_Openchannel_initRequest,
    requestDeserialize: deserialize_cln_Openchannel_initRequest,
    responseSerialize: serialize_cln_Openchannel_initResponse,
    responseDeserialize: deserialize_cln_Openchannel_initResponse,
  },
  openChannel_Signed: {
    path: '/cln.Node/OpenChannel_Signed',
    requestStream: false,
    responseStream: false,
    requestType: cln_node_pb.Openchannel_signedRequest,
    responseType: cln_node_pb.Openchannel_signedResponse,
    requestSerialize: serialize_cln_Openchannel_signedRequest,
    requestDeserialize: deserialize_cln_Openchannel_signedRequest,
    responseSerialize: serialize_cln_Openchannel_signedResponse,
    responseDeserialize: deserialize_cln_Openchannel_signedResponse,
  },
  openChannel_Update: {
    path: '/cln.Node/OpenChannel_Update',
    requestStream: false,
    responseStream: false,
    requestType: cln_node_pb.Openchannel_updateRequest,
    responseType: cln_node_pb.Openchannel_updateResponse,
    requestSerialize: serialize_cln_Openchannel_updateRequest,
    requestDeserialize: deserialize_cln_Openchannel_updateRequest,
    responseSerialize: serialize_cln_Openchannel_updateResponse,
    responseDeserialize: deserialize_cln_Openchannel_updateResponse,
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
  plugin: {
    path: '/cln.Node/Plugin',
    requestStream: false,
    responseStream: false,
    requestType: cln_node_pb.PluginRequest,
    responseType: cln_node_pb.PluginResponse,
    requestSerialize: serialize_cln_PluginRequest,
    requestDeserialize: deserialize_cln_PluginRequest,
    responseSerialize: serialize_cln_PluginResponse,
    responseDeserialize: deserialize_cln_PluginResponse,
  },
  renePayStatus: {
    path: '/cln.Node/RenePayStatus',
    requestStream: false,
    responseStream: false,
    requestType: cln_node_pb.RenepaystatusRequest,
    responseType: cln_node_pb.RenepaystatusResponse,
    requestSerialize: serialize_cln_RenepaystatusRequest,
    requestDeserialize: deserialize_cln_RenepaystatusRequest,
    responseSerialize: serialize_cln_RenepaystatusResponse,
    responseDeserialize: deserialize_cln_RenepaystatusResponse,
  },
  renePay: {
    path: '/cln.Node/RenePay',
    requestStream: false,
    responseStream: false,
    requestType: cln_node_pb.RenepayRequest,
    responseType: cln_node_pb.RenepayResponse,
    requestSerialize: serialize_cln_RenepayRequest,
    requestDeserialize: deserialize_cln_RenepayRequest,
    responseSerialize: serialize_cln_RenepayResponse,
    responseDeserialize: deserialize_cln_RenepayResponse,
  },
  reserveInputs: {
    path: '/cln.Node/ReserveInputs',
    requestStream: false,
    responseStream: false,
    requestType: cln_node_pb.ReserveinputsRequest,
    responseType: cln_node_pb.ReserveinputsResponse,
    requestSerialize: serialize_cln_ReserveinputsRequest,
    requestDeserialize: deserialize_cln_ReserveinputsRequest,
    responseSerialize: serialize_cln_ReserveinputsResponse,
    responseDeserialize: deserialize_cln_ReserveinputsResponse,
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
  sendInvoice: {
    path: '/cln.Node/SendInvoice',
    requestStream: false,
    responseStream: false,
    requestType: cln_node_pb.SendinvoiceRequest,
    responseType: cln_node_pb.SendinvoiceResponse,
    requestSerialize: serialize_cln_SendinvoiceRequest,
    requestDeserialize: deserialize_cln_SendinvoiceRequest,
    responseSerialize: serialize_cln_SendinvoiceResponse,
    responseDeserialize: deserialize_cln_SendinvoiceResponse,
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
  setConfig: {
    path: '/cln.Node/SetConfig',
    requestStream: false,
    responseStream: false,
    requestType: cln_node_pb.SetconfigRequest,
    responseType: cln_node_pb.SetconfigResponse,
    requestSerialize: serialize_cln_SetconfigRequest,
    requestDeserialize: deserialize_cln_SetconfigRequest,
    responseSerialize: serialize_cln_SetconfigResponse,
    responseDeserialize: deserialize_cln_SetconfigResponse,
  },
  setPsbtVersion: {
    path: '/cln.Node/SetPsbtVersion',
    requestStream: false,
    responseStream: false,
    requestType: cln_node_pb.SetpsbtversionRequest,
    responseType: cln_node_pb.SetpsbtversionResponse,
    requestSerialize: serialize_cln_SetpsbtversionRequest,
    requestDeserialize: deserialize_cln_SetpsbtversionRequest,
    responseSerialize: serialize_cln_SetpsbtversionResponse,
    responseDeserialize: deserialize_cln_SetpsbtversionResponse,
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
  splice_Init: {
    path: '/cln.Node/Splice_Init',
    requestStream: false,
    responseStream: false,
    requestType: cln_node_pb.Splice_initRequest,
    responseType: cln_node_pb.Splice_initResponse,
    requestSerialize: serialize_cln_Splice_initRequest,
    requestDeserialize: deserialize_cln_Splice_initRequest,
    responseSerialize: serialize_cln_Splice_initResponse,
    responseDeserialize: deserialize_cln_Splice_initResponse,
  },
  splice_Signed: {
    path: '/cln.Node/Splice_Signed',
    requestStream: false,
    responseStream: false,
    requestType: cln_node_pb.Splice_signedRequest,
    responseType: cln_node_pb.Splice_signedResponse,
    requestSerialize: serialize_cln_Splice_signedRequest,
    requestDeserialize: deserialize_cln_Splice_signedRequest,
    responseSerialize: serialize_cln_Splice_signedResponse,
    responseDeserialize: deserialize_cln_Splice_signedResponse,
  },
  splice_Update: {
    path: '/cln.Node/Splice_Update',
    requestStream: false,
    responseStream: false,
    requestType: cln_node_pb.Splice_updateRequest,
    responseType: cln_node_pb.Splice_updateResponse,
    requestSerialize: serialize_cln_Splice_updateRequest,
    requestDeserialize: deserialize_cln_Splice_updateRequest,
    responseSerialize: serialize_cln_Splice_updateResponse,
    responseDeserialize: deserialize_cln_Splice_updateResponse,
  },
  devSplice: {
    path: '/cln.Node/DevSplice',
    requestStream: false,
    responseStream: false,
    requestType: cln_node_pb.DevspliceRequest,
    responseType: cln_node_pb.DevspliceResponse,
    requestSerialize: serialize_cln_DevspliceRequest,
    requestDeserialize: deserialize_cln_DevspliceRequest,
    responseSerialize: serialize_cln_DevspliceResponse,
    responseDeserialize: deserialize_cln_DevspliceResponse,
  },
  unreserveInputs: {
    path: '/cln.Node/UnreserveInputs',
    requestStream: false,
    responseStream: false,
    requestType: cln_node_pb.UnreserveinputsRequest,
    responseType: cln_node_pb.UnreserveinputsResponse,
    requestSerialize: serialize_cln_UnreserveinputsRequest,
    requestDeserialize: deserialize_cln_UnreserveinputsRequest,
    responseSerialize: serialize_cln_UnreserveinputsResponse,
    responseDeserialize: deserialize_cln_UnreserveinputsResponse,
  },
  upgradeWallet: {
    path: '/cln.Node/UpgradeWallet',
    requestStream: false,
    responseStream: false,
    requestType: cln_node_pb.UpgradewalletRequest,
    responseType: cln_node_pb.UpgradewalletResponse,
    requestSerialize: serialize_cln_UpgradewalletRequest,
    requestDeserialize: deserialize_cln_UpgradewalletRequest,
    responseSerialize: serialize_cln_UpgradewalletResponse,
    responseDeserialize: deserialize_cln_UpgradewalletResponse,
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
  listConfigs: {
    path: '/cln.Node/ListConfigs',
    requestStream: false,
    responseStream: false,
    requestType: cln_node_pb.ListconfigsRequest,
    responseType: cln_node_pb.ListconfigsResponse,
    requestSerialize: serialize_cln_ListconfigsRequest,
    requestDeserialize: deserialize_cln_ListconfigsRequest,
    responseSerialize: serialize_cln_ListconfigsResponse,
    responseDeserialize: deserialize_cln_ListconfigsResponse,
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
  help: {
    path: '/cln.Node/Help',
    requestStream: false,
    responseStream: false,
    requestType: cln_node_pb.HelpRequest,
    responseType: cln_node_pb.HelpResponse,
    requestSerialize: serialize_cln_HelpRequest,
    requestDeserialize: deserialize_cln_HelpRequest,
    responseSerialize: serialize_cln_HelpResponse,
    responseDeserialize: deserialize_cln_HelpResponse,
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
  bkprChannelsApy: {
    path: '/cln.Node/BkprChannelsApy',
    requestStream: false,
    responseStream: false,
    requestType: cln_node_pb.BkprchannelsapyRequest,
    responseType: cln_node_pb.BkprchannelsapyResponse,
    requestSerialize: serialize_cln_BkprchannelsapyRequest,
    requestDeserialize: deserialize_cln_BkprchannelsapyRequest,
    responseSerialize: serialize_cln_BkprchannelsapyResponse,
    responseDeserialize: deserialize_cln_BkprchannelsapyResponse,
  },
  bkprDumpIncomeCsv: {
    path: '/cln.Node/BkprDumpIncomeCsv',
    requestStream: false,
    responseStream: false,
    requestType: cln_node_pb.BkprdumpincomecsvRequest,
    responseType: cln_node_pb.BkprdumpincomecsvResponse,
    requestSerialize: serialize_cln_BkprdumpincomecsvRequest,
    requestDeserialize: deserialize_cln_BkprdumpincomecsvRequest,
    responseSerialize: serialize_cln_BkprdumpincomecsvResponse,
    responseDeserialize: deserialize_cln_BkprdumpincomecsvResponse,
  },
  bkprInspect: {
    path: '/cln.Node/BkprInspect',
    requestStream: false,
    responseStream: false,
    requestType: cln_node_pb.BkprinspectRequest,
    responseType: cln_node_pb.BkprinspectResponse,
    requestSerialize: serialize_cln_BkprinspectRequest,
    requestDeserialize: deserialize_cln_BkprinspectRequest,
    responseSerialize: serialize_cln_BkprinspectResponse,
    responseDeserialize: deserialize_cln_BkprinspectResponse,
  },
  bkprListAccountEvents: {
    path: '/cln.Node/BkprListAccountEvents',
    requestStream: false,
    responseStream: false,
    requestType: cln_node_pb.BkprlistaccounteventsRequest,
    responseType: cln_node_pb.BkprlistaccounteventsResponse,
    requestSerialize: serialize_cln_BkprlistaccounteventsRequest,
    requestDeserialize: deserialize_cln_BkprlistaccounteventsRequest,
    responseSerialize: serialize_cln_BkprlistaccounteventsResponse,
    responseDeserialize: deserialize_cln_BkprlistaccounteventsResponse,
  },
  bkprListBalances: {
    path: '/cln.Node/BkprListBalances',
    requestStream: false,
    responseStream: false,
    requestType: cln_node_pb.BkprlistbalancesRequest,
    responseType: cln_node_pb.BkprlistbalancesResponse,
    requestSerialize: serialize_cln_BkprlistbalancesRequest,
    requestDeserialize: deserialize_cln_BkprlistbalancesRequest,
    responseSerialize: serialize_cln_BkprlistbalancesResponse,
    responseDeserialize: deserialize_cln_BkprlistbalancesResponse,
  },
  bkprListIncome: {
    path: '/cln.Node/BkprListIncome',
    requestStream: false,
    responseStream: false,
    requestType: cln_node_pb.BkprlistincomeRequest,
    responseType: cln_node_pb.BkprlistincomeResponse,
    requestSerialize: serialize_cln_BkprlistincomeRequest,
    requestDeserialize: deserialize_cln_BkprlistincomeRequest,
    responseSerialize: serialize_cln_BkprlistincomeResponse,
    responseDeserialize: deserialize_cln_BkprlistincomeResponse,
  },
  bkprEditDescriptionByPaymentId: {
    path: '/cln.Node/BkprEditDescriptionByPaymentId',
    requestStream: false,
    responseStream: false,
    requestType: cln_node_pb.BkpreditdescriptionbypaymentidRequest,
    responseType: cln_node_pb.BkpreditdescriptionbypaymentidResponse,
    requestSerialize: serialize_cln_BkpreditdescriptionbypaymentidRequest,
    requestDeserialize: deserialize_cln_BkpreditdescriptionbypaymentidRequest,
    responseSerialize: serialize_cln_BkpreditdescriptionbypaymentidResponse,
    responseDeserialize: deserialize_cln_BkpreditdescriptionbypaymentidResponse,
  },
  bkprEditDescriptionByOutpoint: {
    path: '/cln.Node/BkprEditDescriptionByOutpoint',
    requestStream: false,
    responseStream: false,
    requestType: cln_node_pb.BkpreditdescriptionbyoutpointRequest,
    responseType: cln_node_pb.BkpreditdescriptionbyoutpointResponse,
    requestSerialize: serialize_cln_BkpreditdescriptionbyoutpointRequest,
    requestDeserialize: deserialize_cln_BkpreditdescriptionbyoutpointRequest,
    responseSerialize: serialize_cln_BkpreditdescriptionbyoutpointResponse,
    responseDeserialize: deserialize_cln_BkpreditdescriptionbyoutpointResponse,
  },
  blacklistRune: {
    path: '/cln.Node/BlacklistRune',
    requestStream: false,
    responseStream: false,
    requestType: cln_node_pb.BlacklistruneRequest,
    responseType: cln_node_pb.BlacklistruneResponse,
    requestSerialize: serialize_cln_BlacklistruneRequest,
    requestDeserialize: deserialize_cln_BlacklistruneRequest,
    responseSerialize: serialize_cln_BlacklistruneResponse,
    responseDeserialize: deserialize_cln_BlacklistruneResponse,
  },
  checkRune: {
    path: '/cln.Node/CheckRune',
    requestStream: false,
    responseStream: false,
    requestType: cln_node_pb.CheckruneRequest,
    responseType: cln_node_pb.CheckruneResponse,
    requestSerialize: serialize_cln_CheckruneRequest,
    requestDeserialize: deserialize_cln_CheckruneRequest,
    responseSerialize: serialize_cln_CheckruneResponse,
    responseDeserialize: deserialize_cln_CheckruneResponse,
  },
  createRune: {
    path: '/cln.Node/CreateRune',
    requestStream: false,
    responseStream: false,
    requestType: cln_node_pb.CreateruneRequest,
    responseType: cln_node_pb.CreateruneResponse,
    requestSerialize: serialize_cln_CreateruneRequest,
    requestDeserialize: deserialize_cln_CreateruneRequest,
    responseSerialize: serialize_cln_CreateruneResponse,
    responseDeserialize: deserialize_cln_CreateruneResponse,
  },
  showRunes: {
    path: '/cln.Node/ShowRunes',
    requestStream: false,
    responseStream: false,
    requestType: cln_node_pb.ShowrunesRequest,
    responseType: cln_node_pb.ShowrunesResponse,
    requestSerialize: serialize_cln_ShowrunesRequest,
    requestDeserialize: deserialize_cln_ShowrunesRequest,
    responseSerialize: serialize_cln_ShowrunesResponse,
    responseDeserialize: deserialize_cln_ShowrunesResponse,
  },
  askReneUnreserve: {
    path: '/cln.Node/AskReneUnreserve',
    requestStream: false,
    responseStream: false,
    requestType: cln_node_pb.AskreneunreserveRequest,
    responseType: cln_node_pb.AskreneunreserveResponse,
    requestSerialize: serialize_cln_AskreneunreserveRequest,
    requestDeserialize: deserialize_cln_AskreneunreserveRequest,
    responseSerialize: serialize_cln_AskreneunreserveResponse,
    responseDeserialize: deserialize_cln_AskreneunreserveResponse,
  },
  askReneListLayers: {
    path: '/cln.Node/AskReneListLayers',
    requestStream: false,
    responseStream: false,
    requestType: cln_node_pb.AskrenelistlayersRequest,
    responseType: cln_node_pb.AskrenelistlayersResponse,
    requestSerialize: serialize_cln_AskrenelistlayersRequest,
    requestDeserialize: deserialize_cln_AskrenelistlayersRequest,
    responseSerialize: serialize_cln_AskrenelistlayersResponse,
    responseDeserialize: deserialize_cln_AskrenelistlayersResponse,
  },
  askReneCreateLayer: {
    path: '/cln.Node/AskReneCreateLayer',
    requestStream: false,
    responseStream: false,
    requestType: cln_node_pb.AskrenecreatelayerRequest,
    responseType: cln_node_pb.AskrenecreatelayerResponse,
    requestSerialize: serialize_cln_AskrenecreatelayerRequest,
    requestDeserialize: deserialize_cln_AskrenecreatelayerRequest,
    responseSerialize: serialize_cln_AskrenecreatelayerResponse,
    responseDeserialize: deserialize_cln_AskrenecreatelayerResponse,
  },
  askReneRemoveLayer: {
    path: '/cln.Node/AskReneRemoveLayer',
    requestStream: false,
    responseStream: false,
    requestType: cln_node_pb.AskreneremovelayerRequest,
    responseType: cln_node_pb.AskreneremovelayerResponse,
    requestSerialize: serialize_cln_AskreneremovelayerRequest,
    requestDeserialize: deserialize_cln_AskreneremovelayerRequest,
    responseSerialize: serialize_cln_AskreneremovelayerResponse,
    responseDeserialize: deserialize_cln_AskreneremovelayerResponse,
  },
  askReneReserve: {
    path: '/cln.Node/AskReneReserve',
    requestStream: false,
    responseStream: false,
    requestType: cln_node_pb.AskrenereserveRequest,
    responseType: cln_node_pb.AskrenereserveResponse,
    requestSerialize: serialize_cln_AskrenereserveRequest,
    requestDeserialize: deserialize_cln_AskrenereserveRequest,
    responseSerialize: serialize_cln_AskrenereserveResponse,
    responseDeserialize: deserialize_cln_AskrenereserveResponse,
  },
  askReneAge: {
    path: '/cln.Node/AskReneAge',
    requestStream: false,
    responseStream: false,
    requestType: cln_node_pb.AskreneageRequest,
    responseType: cln_node_pb.AskreneageResponse,
    requestSerialize: serialize_cln_AskreneageRequest,
    requestDeserialize: deserialize_cln_AskreneageRequest,
    responseSerialize: serialize_cln_AskreneageResponse,
    responseDeserialize: deserialize_cln_AskreneageResponse,
  },
  getRoutes: {
    path: '/cln.Node/GetRoutes',
    requestStream: false,
    responseStream: false,
    requestType: cln_node_pb.GetroutesRequest,
    responseType: cln_node_pb.GetroutesResponse,
    requestSerialize: serialize_cln_GetroutesRequest,
    requestDeserialize: deserialize_cln_GetroutesRequest,
    responseSerialize: serialize_cln_GetroutesResponse,
    responseDeserialize: deserialize_cln_GetroutesResponse,
  },
  askReneDisableNode: {
    path: '/cln.Node/AskReneDisableNode',
    requestStream: false,
    responseStream: false,
    requestType: cln_node_pb.AskrenedisablenodeRequest,
    responseType: cln_node_pb.AskrenedisablenodeResponse,
    requestSerialize: serialize_cln_AskrenedisablenodeRequest,
    requestDeserialize: deserialize_cln_AskrenedisablenodeRequest,
    responseSerialize: serialize_cln_AskrenedisablenodeResponse,
    responseDeserialize: deserialize_cln_AskrenedisablenodeResponse,
  },
  askReneInformChannel: {
    path: '/cln.Node/AskReneInformChannel',
    requestStream: false,
    responseStream: false,
    requestType: cln_node_pb.AskreneinformchannelRequest,
    responseType: cln_node_pb.AskreneinformchannelResponse,
    requestSerialize: serialize_cln_AskreneinformchannelRequest,
    requestDeserialize: deserialize_cln_AskreneinformchannelRequest,
    responseSerialize: serialize_cln_AskreneinformchannelResponse,
    responseDeserialize: deserialize_cln_AskreneinformchannelResponse,
  },
  askReneCreateChannel: {
    path: '/cln.Node/AskReneCreateChannel',
    requestStream: false,
    responseStream: false,
    requestType: cln_node_pb.AskrenecreatechannelRequest,
    responseType: cln_node_pb.AskrenecreatechannelResponse,
    requestSerialize: serialize_cln_AskrenecreatechannelRequest,
    requestDeserialize: deserialize_cln_AskrenecreatechannelRequest,
    responseSerialize: serialize_cln_AskrenecreatechannelResponse,
    responseDeserialize: deserialize_cln_AskrenecreatechannelResponse,
  },
  askReneUpdateChannel: {
    path: '/cln.Node/AskReneUpdateChannel',
    requestStream: false,
    responseStream: false,
    requestType: cln_node_pb.AskreneupdatechannelRequest,
    responseType: cln_node_pb.AskreneupdatechannelResponse,
    requestSerialize: serialize_cln_AskreneupdatechannelRequest,
    requestDeserialize: deserialize_cln_AskreneupdatechannelRequest,
    responseSerialize: serialize_cln_AskreneupdatechannelResponse,
    responseDeserialize: deserialize_cln_AskreneupdatechannelResponse,
  },
  askReneBiasChannel: {
    path: '/cln.Node/AskReneBiasChannel',
    requestStream: false,
    responseStream: false,
    requestType: cln_node_pb.AskrenebiaschannelRequest,
    responseType: cln_node_pb.AskrenebiaschannelResponse,
    requestSerialize: serialize_cln_AskrenebiaschannelRequest,
    requestDeserialize: deserialize_cln_AskrenebiaschannelRequest,
    responseSerialize: serialize_cln_AskrenebiaschannelResponse,
    responseDeserialize: deserialize_cln_AskrenebiaschannelResponse,
  },
  askReneListReservations: {
    path: '/cln.Node/AskReneListReservations',
    requestStream: false,
    responseStream: false,
    requestType: cln_node_pb.AskrenelistreservationsRequest,
    responseType: cln_node_pb.AskrenelistreservationsResponse,
    requestSerialize: serialize_cln_AskrenelistreservationsRequest,
    requestDeserialize: deserialize_cln_AskrenelistreservationsRequest,
    responseSerialize: serialize_cln_AskrenelistreservationsResponse,
    responseDeserialize: deserialize_cln_AskrenelistreservationsResponse,
  },
  injectPaymentOnion: {
    path: '/cln.Node/InjectPaymentOnion',
    requestStream: false,
    responseStream: false,
    requestType: cln_node_pb.InjectpaymentonionRequest,
    responseType: cln_node_pb.InjectpaymentonionResponse,
    requestSerialize: serialize_cln_InjectpaymentonionRequest,
    requestDeserialize: deserialize_cln_InjectpaymentonionRequest,
    responseSerialize: serialize_cln_InjectpaymentonionResponse,
    responseDeserialize: deserialize_cln_InjectpaymentonionResponse,
  },
  xpay: {
    path: '/cln.Node/Xpay',
    requestStream: false,
    responseStream: false,
    requestType: cln_node_pb.XpayRequest,
    responseType: cln_node_pb.XpayResponse,
    requestSerialize: serialize_cln_XpayRequest,
    requestDeserialize: deserialize_cln_XpayRequest,
    responseSerialize: serialize_cln_XpayResponse,
    responseDeserialize: deserialize_cln_XpayResponse,
  },
  subscribeBlockAdded: {
    path: '/cln.Node/SubscribeBlockAdded',
    requestStream: false,
    responseStream: true,
    requestType: cln_node_pb.StreamBlockAddedRequest,
    responseType: cln_node_pb.BlockAddedNotification,
    requestSerialize: serialize_cln_StreamBlockAddedRequest,
    requestDeserialize: deserialize_cln_StreamBlockAddedRequest,
    responseSerialize: serialize_cln_BlockAddedNotification,
    responseDeserialize: deserialize_cln_BlockAddedNotification,
  },
  subscribeChannelOpenFailed: {
    path: '/cln.Node/SubscribeChannelOpenFailed',
    requestStream: false,
    responseStream: true,
    requestType: cln_node_pb.StreamChannelOpenFailedRequest,
    responseType: cln_node_pb.ChannelOpenFailedNotification,
    requestSerialize: serialize_cln_StreamChannelOpenFailedRequest,
    requestDeserialize: deserialize_cln_StreamChannelOpenFailedRequest,
    responseSerialize: serialize_cln_ChannelOpenFailedNotification,
    responseDeserialize: deserialize_cln_ChannelOpenFailedNotification,
  },
  subscribeChannelOpened: {
    path: '/cln.Node/SubscribeChannelOpened',
    requestStream: false,
    responseStream: true,
    requestType: cln_node_pb.StreamChannelOpenedRequest,
    responseType: cln_node_pb.ChannelOpenedNotification,
    requestSerialize: serialize_cln_StreamChannelOpenedRequest,
    requestDeserialize: deserialize_cln_StreamChannelOpenedRequest,
    responseSerialize: serialize_cln_ChannelOpenedNotification,
    responseDeserialize: deserialize_cln_ChannelOpenedNotification,
  },
  subscribeConnect: {
    path: '/cln.Node/SubscribeConnect',
    requestStream: false,
    responseStream: true,
    requestType: cln_node_pb.StreamConnectRequest,
    responseType: cln_node_pb.PeerConnectNotification,
    requestSerialize: serialize_cln_StreamConnectRequest,
    requestDeserialize: deserialize_cln_StreamConnectRequest,
    responseSerialize: serialize_cln_PeerConnectNotification,
    responseDeserialize: deserialize_cln_PeerConnectNotification,
  },
  subscribeCustomMsg: {
    path: '/cln.Node/SubscribeCustomMsg',
    requestStream: false,
    responseStream: true,
    requestType: cln_node_pb.StreamCustomMsgRequest,
    responseType: cln_node_pb.CustomMsgNotification,
    requestSerialize: serialize_cln_StreamCustomMsgRequest,
    requestDeserialize: deserialize_cln_StreamCustomMsgRequest,
    responseSerialize: serialize_cln_CustomMsgNotification,
    responseDeserialize: deserialize_cln_CustomMsgNotification,
  },
};

exports.NodeClient = grpc.makeGenericClientConstructor(NodeService);
