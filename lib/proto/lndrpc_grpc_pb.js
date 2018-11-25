// GENERATED CODE -- DO NOT EDIT!

'use strict';
var grpc = require('grpc');
var lndrpc_pb = require('./lndrpc_pb.js');
var google_api_annotations_pb = require('./google/api/annotations_pb.js');

function serialize_lnrpc_AddInvoiceResponse(arg) {
  if (!(arg instanceof lndrpc_pb.AddInvoiceResponse)) {
    throw new Error('Expected argument of type lnrpc.AddInvoiceResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_lnrpc_AddInvoiceResponse(buffer_arg) {
  return lndrpc_pb.AddInvoiceResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_lnrpc_ChanInfoRequest(arg) {
  if (!(arg instanceof lndrpc_pb.ChanInfoRequest)) {
    throw new Error('Expected argument of type lnrpc.ChanInfoRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_lnrpc_ChanInfoRequest(buffer_arg) {
  return lndrpc_pb.ChanInfoRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_lnrpc_ChangePasswordRequest(arg) {
  if (!(arg instanceof lndrpc_pb.ChangePasswordRequest)) {
    throw new Error('Expected argument of type lnrpc.ChangePasswordRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_lnrpc_ChangePasswordRequest(buffer_arg) {
  return lndrpc_pb.ChangePasswordRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_lnrpc_ChangePasswordResponse(arg) {
  if (!(arg instanceof lndrpc_pb.ChangePasswordResponse)) {
    throw new Error('Expected argument of type lnrpc.ChangePasswordResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_lnrpc_ChangePasswordResponse(buffer_arg) {
  return lndrpc_pb.ChangePasswordResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_lnrpc_ChannelBalanceRequest(arg) {
  if (!(arg instanceof lndrpc_pb.ChannelBalanceRequest)) {
    throw new Error('Expected argument of type lnrpc.ChannelBalanceRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_lnrpc_ChannelBalanceRequest(buffer_arg) {
  return lndrpc_pb.ChannelBalanceRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_lnrpc_ChannelBalanceResponse(arg) {
  if (!(arg instanceof lndrpc_pb.ChannelBalanceResponse)) {
    throw new Error('Expected argument of type lnrpc.ChannelBalanceResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_lnrpc_ChannelBalanceResponse(buffer_arg) {
  return lndrpc_pb.ChannelBalanceResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_lnrpc_ChannelEdge(arg) {
  if (!(arg instanceof lndrpc_pb.ChannelEdge)) {
    throw new Error('Expected argument of type lnrpc.ChannelEdge');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_lnrpc_ChannelEdge(buffer_arg) {
  return lndrpc_pb.ChannelEdge.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_lnrpc_ChannelGraph(arg) {
  if (!(arg instanceof lndrpc_pb.ChannelGraph)) {
    throw new Error('Expected argument of type lnrpc.ChannelGraph');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_lnrpc_ChannelGraph(buffer_arg) {
  return lndrpc_pb.ChannelGraph.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_lnrpc_ChannelGraphRequest(arg) {
  if (!(arg instanceof lndrpc_pb.ChannelGraphRequest)) {
    throw new Error('Expected argument of type lnrpc.ChannelGraphRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_lnrpc_ChannelGraphRequest(buffer_arg) {
  return lndrpc_pb.ChannelGraphRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_lnrpc_ChannelPoint(arg) {
  if (!(arg instanceof lndrpc_pb.ChannelPoint)) {
    throw new Error('Expected argument of type lnrpc.ChannelPoint');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_lnrpc_ChannelPoint(buffer_arg) {
  return lndrpc_pb.ChannelPoint.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_lnrpc_CloseChannelRequest(arg) {
  if (!(arg instanceof lndrpc_pb.CloseChannelRequest)) {
    throw new Error('Expected argument of type lnrpc.CloseChannelRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_lnrpc_CloseChannelRequest(buffer_arg) {
  return lndrpc_pb.CloseChannelRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_lnrpc_CloseStatusUpdate(arg) {
  if (!(arg instanceof lndrpc_pb.CloseStatusUpdate)) {
    throw new Error('Expected argument of type lnrpc.CloseStatusUpdate');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_lnrpc_CloseStatusUpdate(buffer_arg) {
  return lndrpc_pb.CloseStatusUpdate.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_lnrpc_ClosedChannelsRequest(arg) {
  if (!(arg instanceof lndrpc_pb.ClosedChannelsRequest)) {
    throw new Error('Expected argument of type lnrpc.ClosedChannelsRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_lnrpc_ClosedChannelsRequest(buffer_arg) {
  return lndrpc_pb.ClosedChannelsRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_lnrpc_ClosedChannelsResponse(arg) {
  if (!(arg instanceof lndrpc_pb.ClosedChannelsResponse)) {
    throw new Error('Expected argument of type lnrpc.ClosedChannelsResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_lnrpc_ClosedChannelsResponse(buffer_arg) {
  return lndrpc_pb.ClosedChannelsResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_lnrpc_ConnectPeerRequest(arg) {
  if (!(arg instanceof lndrpc_pb.ConnectPeerRequest)) {
    throw new Error('Expected argument of type lnrpc.ConnectPeerRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_lnrpc_ConnectPeerRequest(buffer_arg) {
  return lndrpc_pb.ConnectPeerRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_lnrpc_ConnectPeerResponse(arg) {
  if (!(arg instanceof lndrpc_pb.ConnectPeerResponse)) {
    throw new Error('Expected argument of type lnrpc.ConnectPeerResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_lnrpc_ConnectPeerResponse(buffer_arg) {
  return lndrpc_pb.ConnectPeerResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_lnrpc_DebugLevelRequest(arg) {
  if (!(arg instanceof lndrpc_pb.DebugLevelRequest)) {
    throw new Error('Expected argument of type lnrpc.DebugLevelRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_lnrpc_DebugLevelRequest(buffer_arg) {
  return lndrpc_pb.DebugLevelRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_lnrpc_DebugLevelResponse(arg) {
  if (!(arg instanceof lndrpc_pb.DebugLevelResponse)) {
    throw new Error('Expected argument of type lnrpc.DebugLevelResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_lnrpc_DebugLevelResponse(buffer_arg) {
  return lndrpc_pb.DebugLevelResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_lnrpc_DeleteAllPaymentsRequest(arg) {
  if (!(arg instanceof lndrpc_pb.DeleteAllPaymentsRequest)) {
    throw new Error('Expected argument of type lnrpc.DeleteAllPaymentsRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_lnrpc_DeleteAllPaymentsRequest(buffer_arg) {
  return lndrpc_pb.DeleteAllPaymentsRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_lnrpc_DeleteAllPaymentsResponse(arg) {
  if (!(arg instanceof lndrpc_pb.DeleteAllPaymentsResponse)) {
    throw new Error('Expected argument of type lnrpc.DeleteAllPaymentsResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_lnrpc_DeleteAllPaymentsResponse(buffer_arg) {
  return lndrpc_pb.DeleteAllPaymentsResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_lnrpc_DisconnectPeerRequest(arg) {
  if (!(arg instanceof lndrpc_pb.DisconnectPeerRequest)) {
    throw new Error('Expected argument of type lnrpc.DisconnectPeerRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_lnrpc_DisconnectPeerRequest(buffer_arg) {
  return lndrpc_pb.DisconnectPeerRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_lnrpc_DisconnectPeerResponse(arg) {
  if (!(arg instanceof lndrpc_pb.DisconnectPeerResponse)) {
    throw new Error('Expected argument of type lnrpc.DisconnectPeerResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_lnrpc_DisconnectPeerResponse(buffer_arg) {
  return lndrpc_pb.DisconnectPeerResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_lnrpc_FeeReportRequest(arg) {
  if (!(arg instanceof lndrpc_pb.FeeReportRequest)) {
    throw new Error('Expected argument of type lnrpc.FeeReportRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_lnrpc_FeeReportRequest(buffer_arg) {
  return lndrpc_pb.FeeReportRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_lnrpc_FeeReportResponse(arg) {
  if (!(arg instanceof lndrpc_pb.FeeReportResponse)) {
    throw new Error('Expected argument of type lnrpc.FeeReportResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_lnrpc_FeeReportResponse(buffer_arg) {
  return lndrpc_pb.FeeReportResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_lnrpc_ForwardingHistoryRequest(arg) {
  if (!(arg instanceof lndrpc_pb.ForwardingHistoryRequest)) {
    throw new Error('Expected argument of type lnrpc.ForwardingHistoryRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_lnrpc_ForwardingHistoryRequest(buffer_arg) {
  return lndrpc_pb.ForwardingHistoryRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_lnrpc_ForwardingHistoryResponse(arg) {
  if (!(arg instanceof lndrpc_pb.ForwardingHistoryResponse)) {
    throw new Error('Expected argument of type lnrpc.ForwardingHistoryResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_lnrpc_ForwardingHistoryResponse(buffer_arg) {
  return lndrpc_pb.ForwardingHistoryResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_lnrpc_GenSeedRequest(arg) {
  if (!(arg instanceof lndrpc_pb.GenSeedRequest)) {
    throw new Error('Expected argument of type lnrpc.GenSeedRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_lnrpc_GenSeedRequest(buffer_arg) {
  return lndrpc_pb.GenSeedRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_lnrpc_GenSeedResponse(arg) {
  if (!(arg instanceof lndrpc_pb.GenSeedResponse)) {
    throw new Error('Expected argument of type lnrpc.GenSeedResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_lnrpc_GenSeedResponse(buffer_arg) {
  return lndrpc_pb.GenSeedResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_lnrpc_GetInfoRequest(arg) {
  if (!(arg instanceof lndrpc_pb.GetInfoRequest)) {
    throw new Error('Expected argument of type lnrpc.GetInfoRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_lnrpc_GetInfoRequest(buffer_arg) {
  return lndrpc_pb.GetInfoRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_lnrpc_GetInfoResponse(arg) {
  if (!(arg instanceof lndrpc_pb.GetInfoResponse)) {
    throw new Error('Expected argument of type lnrpc.GetInfoResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_lnrpc_GetInfoResponse(buffer_arg) {
  return lndrpc_pb.GetInfoResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_lnrpc_GetTransactionsRequest(arg) {
  if (!(arg instanceof lndrpc_pb.GetTransactionsRequest)) {
    throw new Error('Expected argument of type lnrpc.GetTransactionsRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_lnrpc_GetTransactionsRequest(buffer_arg) {
  return lndrpc_pb.GetTransactionsRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_lnrpc_GraphTopologySubscription(arg) {
  if (!(arg instanceof lndrpc_pb.GraphTopologySubscription)) {
    throw new Error('Expected argument of type lnrpc.GraphTopologySubscription');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_lnrpc_GraphTopologySubscription(buffer_arg) {
  return lndrpc_pb.GraphTopologySubscription.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_lnrpc_GraphTopologyUpdate(arg) {
  if (!(arg instanceof lndrpc_pb.GraphTopologyUpdate)) {
    throw new Error('Expected argument of type lnrpc.GraphTopologyUpdate');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_lnrpc_GraphTopologyUpdate(buffer_arg) {
  return lndrpc_pb.GraphTopologyUpdate.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_lnrpc_InitWalletRequest(arg) {
  if (!(arg instanceof lndrpc_pb.InitWalletRequest)) {
    throw new Error('Expected argument of type lnrpc.InitWalletRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_lnrpc_InitWalletRequest(buffer_arg) {
  return lndrpc_pb.InitWalletRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_lnrpc_InitWalletResponse(arg) {
  if (!(arg instanceof lndrpc_pb.InitWalletResponse)) {
    throw new Error('Expected argument of type lnrpc.InitWalletResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_lnrpc_InitWalletResponse(buffer_arg) {
  return lndrpc_pb.InitWalletResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_lnrpc_Invoice(arg) {
  if (!(arg instanceof lndrpc_pb.Invoice)) {
    throw new Error('Expected argument of type lnrpc.Invoice');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_lnrpc_Invoice(buffer_arg) {
  return lndrpc_pb.Invoice.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_lnrpc_InvoiceSubscription(arg) {
  if (!(arg instanceof lndrpc_pb.InvoiceSubscription)) {
    throw new Error('Expected argument of type lnrpc.InvoiceSubscription');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_lnrpc_InvoiceSubscription(buffer_arg) {
  return lndrpc_pb.InvoiceSubscription.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_lnrpc_ListChannelsRequest(arg) {
  if (!(arg instanceof lndrpc_pb.ListChannelsRequest)) {
    throw new Error('Expected argument of type lnrpc.ListChannelsRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_lnrpc_ListChannelsRequest(buffer_arg) {
  return lndrpc_pb.ListChannelsRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_lnrpc_ListChannelsResponse(arg) {
  if (!(arg instanceof lndrpc_pb.ListChannelsResponse)) {
    throw new Error('Expected argument of type lnrpc.ListChannelsResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_lnrpc_ListChannelsResponse(buffer_arg) {
  return lndrpc_pb.ListChannelsResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_lnrpc_ListInvoiceRequest(arg) {
  if (!(arg instanceof lndrpc_pb.ListInvoiceRequest)) {
    throw new Error('Expected argument of type lnrpc.ListInvoiceRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_lnrpc_ListInvoiceRequest(buffer_arg) {
  return lndrpc_pb.ListInvoiceRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_lnrpc_ListInvoiceResponse(arg) {
  if (!(arg instanceof lndrpc_pb.ListInvoiceResponse)) {
    throw new Error('Expected argument of type lnrpc.ListInvoiceResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_lnrpc_ListInvoiceResponse(buffer_arg) {
  return lndrpc_pb.ListInvoiceResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_lnrpc_ListPaymentsRequest(arg) {
  if (!(arg instanceof lndrpc_pb.ListPaymentsRequest)) {
    throw new Error('Expected argument of type lnrpc.ListPaymentsRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_lnrpc_ListPaymentsRequest(buffer_arg) {
  return lndrpc_pb.ListPaymentsRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_lnrpc_ListPaymentsResponse(arg) {
  if (!(arg instanceof lndrpc_pb.ListPaymentsResponse)) {
    throw new Error('Expected argument of type lnrpc.ListPaymentsResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_lnrpc_ListPaymentsResponse(buffer_arg) {
  return lndrpc_pb.ListPaymentsResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_lnrpc_ListPeersRequest(arg) {
  if (!(arg instanceof lndrpc_pb.ListPeersRequest)) {
    throw new Error('Expected argument of type lnrpc.ListPeersRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_lnrpc_ListPeersRequest(buffer_arg) {
  return lndrpc_pb.ListPeersRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_lnrpc_ListPeersResponse(arg) {
  if (!(arg instanceof lndrpc_pb.ListPeersResponse)) {
    throw new Error('Expected argument of type lnrpc.ListPeersResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_lnrpc_ListPeersResponse(buffer_arg) {
  return lndrpc_pb.ListPeersResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_lnrpc_NetworkInfo(arg) {
  if (!(arg instanceof lndrpc_pb.NetworkInfo)) {
    throw new Error('Expected argument of type lnrpc.NetworkInfo');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_lnrpc_NetworkInfo(buffer_arg) {
  return lndrpc_pb.NetworkInfo.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_lnrpc_NetworkInfoRequest(arg) {
  if (!(arg instanceof lndrpc_pb.NetworkInfoRequest)) {
    throw new Error('Expected argument of type lnrpc.NetworkInfoRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_lnrpc_NetworkInfoRequest(buffer_arg) {
  return lndrpc_pb.NetworkInfoRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_lnrpc_NewAddressRequest(arg) {
  if (!(arg instanceof lndrpc_pb.NewAddressRequest)) {
    throw new Error('Expected argument of type lnrpc.NewAddressRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_lnrpc_NewAddressRequest(buffer_arg) {
  return lndrpc_pb.NewAddressRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_lnrpc_NewAddressResponse(arg) {
  if (!(arg instanceof lndrpc_pb.NewAddressResponse)) {
    throw new Error('Expected argument of type lnrpc.NewAddressResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_lnrpc_NewAddressResponse(buffer_arg) {
  return lndrpc_pb.NewAddressResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_lnrpc_NewWitnessAddressRequest(arg) {
  if (!(arg instanceof lndrpc_pb.NewWitnessAddressRequest)) {
    throw new Error('Expected argument of type lnrpc.NewWitnessAddressRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_lnrpc_NewWitnessAddressRequest(buffer_arg) {
  return lndrpc_pb.NewWitnessAddressRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_lnrpc_NodeInfo(arg) {
  if (!(arg instanceof lndrpc_pb.NodeInfo)) {
    throw new Error('Expected argument of type lnrpc.NodeInfo');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_lnrpc_NodeInfo(buffer_arg) {
  return lndrpc_pb.NodeInfo.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_lnrpc_NodeInfoRequest(arg) {
  if (!(arg instanceof lndrpc_pb.NodeInfoRequest)) {
    throw new Error('Expected argument of type lnrpc.NodeInfoRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_lnrpc_NodeInfoRequest(buffer_arg) {
  return lndrpc_pb.NodeInfoRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_lnrpc_OpenChannelRequest(arg) {
  if (!(arg instanceof lndrpc_pb.OpenChannelRequest)) {
    throw new Error('Expected argument of type lnrpc.OpenChannelRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_lnrpc_OpenChannelRequest(buffer_arg) {
  return lndrpc_pb.OpenChannelRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_lnrpc_OpenStatusUpdate(arg) {
  if (!(arg instanceof lndrpc_pb.OpenStatusUpdate)) {
    throw new Error('Expected argument of type lnrpc.OpenStatusUpdate');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_lnrpc_OpenStatusUpdate(buffer_arg) {
  return lndrpc_pb.OpenStatusUpdate.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_lnrpc_PayReq(arg) {
  if (!(arg instanceof lndrpc_pb.PayReq)) {
    throw new Error('Expected argument of type lnrpc.PayReq');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_lnrpc_PayReq(buffer_arg) {
  return lndrpc_pb.PayReq.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_lnrpc_PayReqString(arg) {
  if (!(arg instanceof lndrpc_pb.PayReqString)) {
    throw new Error('Expected argument of type lnrpc.PayReqString');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_lnrpc_PayReqString(buffer_arg) {
  return lndrpc_pb.PayReqString.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_lnrpc_PaymentHash(arg) {
  if (!(arg instanceof lndrpc_pb.PaymentHash)) {
    throw new Error('Expected argument of type lnrpc.PaymentHash');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_lnrpc_PaymentHash(buffer_arg) {
  return lndrpc_pb.PaymentHash.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_lnrpc_PendingChannelsRequest(arg) {
  if (!(arg instanceof lndrpc_pb.PendingChannelsRequest)) {
    throw new Error('Expected argument of type lnrpc.PendingChannelsRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_lnrpc_PendingChannelsRequest(buffer_arg) {
  return lndrpc_pb.PendingChannelsRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_lnrpc_PendingChannelsResponse(arg) {
  if (!(arg instanceof lndrpc_pb.PendingChannelsResponse)) {
    throw new Error('Expected argument of type lnrpc.PendingChannelsResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_lnrpc_PendingChannelsResponse(buffer_arg) {
  return lndrpc_pb.PendingChannelsResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_lnrpc_PolicyUpdateRequest(arg) {
  if (!(arg instanceof lndrpc_pb.PolicyUpdateRequest)) {
    throw new Error('Expected argument of type lnrpc.PolicyUpdateRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_lnrpc_PolicyUpdateRequest(buffer_arg) {
  return lndrpc_pb.PolicyUpdateRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_lnrpc_PolicyUpdateResponse(arg) {
  if (!(arg instanceof lndrpc_pb.PolicyUpdateResponse)) {
    throw new Error('Expected argument of type lnrpc.PolicyUpdateResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_lnrpc_PolicyUpdateResponse(buffer_arg) {
  return lndrpc_pb.PolicyUpdateResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_lnrpc_QueryRoutesRequest(arg) {
  if (!(arg instanceof lndrpc_pb.QueryRoutesRequest)) {
    throw new Error('Expected argument of type lnrpc.QueryRoutesRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_lnrpc_QueryRoutesRequest(buffer_arg) {
  return lndrpc_pb.QueryRoutesRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_lnrpc_QueryRoutesResponse(arg) {
  if (!(arg instanceof lndrpc_pb.QueryRoutesResponse)) {
    throw new Error('Expected argument of type lnrpc.QueryRoutesResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_lnrpc_QueryRoutesResponse(buffer_arg) {
  return lndrpc_pb.QueryRoutesResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_lnrpc_SendCoinsRequest(arg) {
  if (!(arg instanceof lndrpc_pb.SendCoinsRequest)) {
    throw new Error('Expected argument of type lnrpc.SendCoinsRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_lnrpc_SendCoinsRequest(buffer_arg) {
  return lndrpc_pb.SendCoinsRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_lnrpc_SendCoinsResponse(arg) {
  if (!(arg instanceof lndrpc_pb.SendCoinsResponse)) {
    throw new Error('Expected argument of type lnrpc.SendCoinsResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_lnrpc_SendCoinsResponse(buffer_arg) {
  return lndrpc_pb.SendCoinsResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_lnrpc_SendManyRequest(arg) {
  if (!(arg instanceof lndrpc_pb.SendManyRequest)) {
    throw new Error('Expected argument of type lnrpc.SendManyRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_lnrpc_SendManyRequest(buffer_arg) {
  return lndrpc_pb.SendManyRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_lnrpc_SendManyResponse(arg) {
  if (!(arg instanceof lndrpc_pb.SendManyResponse)) {
    throw new Error('Expected argument of type lnrpc.SendManyResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_lnrpc_SendManyResponse(buffer_arg) {
  return lndrpc_pb.SendManyResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_lnrpc_SendRequest(arg) {
  if (!(arg instanceof lndrpc_pb.SendRequest)) {
    throw new Error('Expected argument of type lnrpc.SendRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_lnrpc_SendRequest(buffer_arg) {
  return lndrpc_pb.SendRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_lnrpc_SendResponse(arg) {
  if (!(arg instanceof lndrpc_pb.SendResponse)) {
    throw new Error('Expected argument of type lnrpc.SendResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_lnrpc_SendResponse(buffer_arg) {
  return lndrpc_pb.SendResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_lnrpc_SendToRouteRequest(arg) {
  if (!(arg instanceof lndrpc_pb.SendToRouteRequest)) {
    throw new Error('Expected argument of type lnrpc.SendToRouteRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_lnrpc_SendToRouteRequest(buffer_arg) {
  return lndrpc_pb.SendToRouteRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_lnrpc_SignMessageRequest(arg) {
  if (!(arg instanceof lndrpc_pb.SignMessageRequest)) {
    throw new Error('Expected argument of type lnrpc.SignMessageRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_lnrpc_SignMessageRequest(buffer_arg) {
  return lndrpc_pb.SignMessageRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_lnrpc_SignMessageResponse(arg) {
  if (!(arg instanceof lndrpc_pb.SignMessageResponse)) {
    throw new Error('Expected argument of type lnrpc.SignMessageResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_lnrpc_SignMessageResponse(buffer_arg) {
  return lndrpc_pb.SignMessageResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_lnrpc_StopRequest(arg) {
  if (!(arg instanceof lndrpc_pb.StopRequest)) {
    throw new Error('Expected argument of type lnrpc.StopRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_lnrpc_StopRequest(buffer_arg) {
  return lndrpc_pb.StopRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_lnrpc_StopResponse(arg) {
  if (!(arg instanceof lndrpc_pb.StopResponse)) {
    throw new Error('Expected argument of type lnrpc.StopResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_lnrpc_StopResponse(buffer_arg) {
  return lndrpc_pb.StopResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_lnrpc_Transaction(arg) {
  if (!(arg instanceof lndrpc_pb.Transaction)) {
    throw new Error('Expected argument of type lnrpc.Transaction');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_lnrpc_Transaction(buffer_arg) {
  return lndrpc_pb.Transaction.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_lnrpc_TransactionDetails(arg) {
  if (!(arg instanceof lndrpc_pb.TransactionDetails)) {
    throw new Error('Expected argument of type lnrpc.TransactionDetails');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_lnrpc_TransactionDetails(buffer_arg) {
  return lndrpc_pb.TransactionDetails.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_lnrpc_UnlockWalletRequest(arg) {
  if (!(arg instanceof lndrpc_pb.UnlockWalletRequest)) {
    throw new Error('Expected argument of type lnrpc.UnlockWalletRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_lnrpc_UnlockWalletRequest(buffer_arg) {
  return lndrpc_pb.UnlockWalletRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_lnrpc_UnlockWalletResponse(arg) {
  if (!(arg instanceof lndrpc_pb.UnlockWalletResponse)) {
    throw new Error('Expected argument of type lnrpc.UnlockWalletResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_lnrpc_UnlockWalletResponse(buffer_arg) {
  return lndrpc_pb.UnlockWalletResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_lnrpc_VerifyMessageRequest(arg) {
  if (!(arg instanceof lndrpc_pb.VerifyMessageRequest)) {
    throw new Error('Expected argument of type lnrpc.VerifyMessageRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_lnrpc_VerifyMessageRequest(buffer_arg) {
  return lndrpc_pb.VerifyMessageRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_lnrpc_VerifyMessageResponse(arg) {
  if (!(arg instanceof lndrpc_pb.VerifyMessageResponse)) {
    throw new Error('Expected argument of type lnrpc.VerifyMessageResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_lnrpc_VerifyMessageResponse(buffer_arg) {
  return lndrpc_pb.VerifyMessageResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_lnrpc_WalletBalanceRequest(arg) {
  if (!(arg instanceof lndrpc_pb.WalletBalanceRequest)) {
    throw new Error('Expected argument of type lnrpc.WalletBalanceRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_lnrpc_WalletBalanceRequest(buffer_arg) {
  return lndrpc_pb.WalletBalanceRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_lnrpc_WalletBalanceResponse(arg) {
  if (!(arg instanceof lndrpc_pb.WalletBalanceResponse)) {
    throw new Error('Expected argument of type lnrpc.WalletBalanceResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_lnrpc_WalletBalanceResponse(buffer_arg) {
  return lndrpc_pb.WalletBalanceResponse.deserializeBinary(new Uint8Array(buffer_arg));
}


// The WalletUnlocker service is used to set up a wallet password for
// lnd at first startup, and unlock a previously set up wallet.
var WalletUnlockerService = exports.WalletUnlockerService = {
  // *
  // GenSeed is the first method that should be used to instantiate a new lnd
  // instance. This method allows a caller to generate a new aezeed cipher seed
  // given an optional passphrase. If provided, the passphrase will be necessary
  // to decrypt the cipherseed to expose the internal wallet seed.
  //
  // Once the cipherseed is obtained and verified by the user, the InitWallet
  // method should be used to commit the newly generated seed, and create the
  // wallet.
  genSeed: {
    path: '/lnrpc.WalletUnlocker/GenSeed',
    requestStream: false,
    responseStream: false,
    requestType: lndrpc_pb.GenSeedRequest,
    responseType: lndrpc_pb.GenSeedResponse,
    requestSerialize: serialize_lnrpc_GenSeedRequest,
    requestDeserialize: deserialize_lnrpc_GenSeedRequest,
    responseSerialize: serialize_lnrpc_GenSeedResponse,
    responseDeserialize: deserialize_lnrpc_GenSeedResponse,
  },
  // * 
  // InitWallet is used when lnd is starting up for the first time to fully
  // initialize the daemon and its internal wallet. At the very least a wallet
  // password must be provided. This will be used to encrypt sensitive material
  // on disk.
  //
  // In the case of a recovery scenario, the user can also specify their aezeed
  // mnemonic and passphrase. If set, then the daemon will use this prior state
  // to initialize its internal wallet.
  //
  // Alternatively, this can be used along with the GenSeed RPC to obtain a
  // seed, then present it to the user. Once it has been verified by the user,
  // the seed can be fed into this RPC in order to commit the new wallet.
  initWallet: {
    path: '/lnrpc.WalletUnlocker/InitWallet',
    requestStream: false,
    responseStream: false,
    requestType: lndrpc_pb.InitWalletRequest,
    responseType: lndrpc_pb.InitWalletResponse,
    requestSerialize: serialize_lnrpc_InitWalletRequest,
    requestDeserialize: deserialize_lnrpc_InitWalletRequest,
    responseSerialize: serialize_lnrpc_InitWalletResponse,
    responseDeserialize: deserialize_lnrpc_InitWalletResponse,
  },
  // * lncli: `unlock`
  // UnlockWallet is used at startup of lnd to provide a password to unlock
  // the wallet database.
  unlockWallet: {
    path: '/lnrpc.WalletUnlocker/UnlockWallet',
    requestStream: false,
    responseStream: false,
    requestType: lndrpc_pb.UnlockWalletRequest,
    responseType: lndrpc_pb.UnlockWalletResponse,
    requestSerialize: serialize_lnrpc_UnlockWalletRequest,
    requestDeserialize: deserialize_lnrpc_UnlockWalletRequest,
    responseSerialize: serialize_lnrpc_UnlockWalletResponse,
    responseDeserialize: deserialize_lnrpc_UnlockWalletResponse,
  },
  // * lncli: `changepassword`
  // ChangePassword changes the password of the encrypted wallet. This will
  // automatically unlock the wallet database if successful.
  changePassword: {
    path: '/lnrpc.WalletUnlocker/ChangePassword',
    requestStream: false,
    responseStream: false,
    requestType: lndrpc_pb.ChangePasswordRequest,
    responseType: lndrpc_pb.ChangePasswordResponse,
    requestSerialize: serialize_lnrpc_ChangePasswordRequest,
    requestDeserialize: deserialize_lnrpc_ChangePasswordRequest,
    responseSerialize: serialize_lnrpc_ChangePasswordResponse,
    responseDeserialize: deserialize_lnrpc_ChangePasswordResponse,
  },
};

exports.WalletUnlockerClient = grpc.makeGenericClientConstructor(WalletUnlockerService);
var LightningService = exports.LightningService = {
  // * lncli: `walletbalance`
  // WalletBalance returns total unspent outputs(confirmed and unconfirmed), all
  // confirmed unspent outputs and all unconfirmed unspent outputs under control
  // of the wallet. 
  walletBalance: {
    path: '/lnrpc.Lightning/WalletBalance',
    requestStream: false,
    responseStream: false,
    requestType: lndrpc_pb.WalletBalanceRequest,
    responseType: lndrpc_pb.WalletBalanceResponse,
    requestSerialize: serialize_lnrpc_WalletBalanceRequest,
    requestDeserialize: deserialize_lnrpc_WalletBalanceRequest,
    responseSerialize: serialize_lnrpc_WalletBalanceResponse,
    responseDeserialize: deserialize_lnrpc_WalletBalanceResponse,
  },
  // * lncli: `channelbalance`
  // ChannelBalance returns the total funds available across all open channels
  // in satoshis.
  channelBalance: {
    path: '/lnrpc.Lightning/ChannelBalance',
    requestStream: false,
    responseStream: false,
    requestType: lndrpc_pb.ChannelBalanceRequest,
    responseType: lndrpc_pb.ChannelBalanceResponse,
    requestSerialize: serialize_lnrpc_ChannelBalanceRequest,
    requestDeserialize: deserialize_lnrpc_ChannelBalanceRequest,
    responseSerialize: serialize_lnrpc_ChannelBalanceResponse,
    responseDeserialize: deserialize_lnrpc_ChannelBalanceResponse,
  },
  // * lncli: `listchaintxns`
  // GetTransactions returns a list describing all the known transactions
  // relevant to the wallet.
  getTransactions: {
    path: '/lnrpc.Lightning/GetTransactions',
    requestStream: false,
    responseStream: false,
    requestType: lndrpc_pb.GetTransactionsRequest,
    responseType: lndrpc_pb.TransactionDetails,
    requestSerialize: serialize_lnrpc_GetTransactionsRequest,
    requestDeserialize: deserialize_lnrpc_GetTransactionsRequest,
    responseSerialize: serialize_lnrpc_TransactionDetails,
    responseDeserialize: deserialize_lnrpc_TransactionDetails,
  },
  // * lncli: `sendcoins`
  // SendCoins executes a request to send coins to a particular address. Unlike
  // SendMany, this RPC call only allows creating a single output at a time. If
  // neither target_conf, or sat_per_byte are set, then the internal wallet will
  // consult its fee model to determine a fee for the default confirmation
  // target.
  sendCoins: {
    path: '/lnrpc.Lightning/SendCoins',
    requestStream: false,
    responseStream: false,
    requestType: lndrpc_pb.SendCoinsRequest,
    responseType: lndrpc_pb.SendCoinsResponse,
    requestSerialize: serialize_lnrpc_SendCoinsRequest,
    requestDeserialize: deserialize_lnrpc_SendCoinsRequest,
    responseSerialize: serialize_lnrpc_SendCoinsResponse,
    responseDeserialize: deserialize_lnrpc_SendCoinsResponse,
  },
  // *
  // SubscribeTransactions creates a uni-directional stream from the server to
  // the client in which any newly discovered transactions relevant to the
  // wallet are sent over.
  subscribeTransactions: {
    path: '/lnrpc.Lightning/SubscribeTransactions',
    requestStream: false,
    responseStream: true,
    requestType: lndrpc_pb.GetTransactionsRequest,
    responseType: lndrpc_pb.Transaction,
    requestSerialize: serialize_lnrpc_GetTransactionsRequest,
    requestDeserialize: deserialize_lnrpc_GetTransactionsRequest,
    responseSerialize: serialize_lnrpc_Transaction,
    responseDeserialize: deserialize_lnrpc_Transaction,
  },
  // * lncli: `sendmany`
  // SendMany handles a request for a transaction that creates multiple specified
  // outputs in parallel. If neither target_conf, or sat_per_byte are set, then
  // the internal wallet will consult its fee model to determine a fee for the
  // default confirmation target.
  sendMany: {
    path: '/lnrpc.Lightning/SendMany',
    requestStream: false,
    responseStream: false,
    requestType: lndrpc_pb.SendManyRequest,
    responseType: lndrpc_pb.SendManyResponse,
    requestSerialize: serialize_lnrpc_SendManyRequest,
    requestDeserialize: deserialize_lnrpc_SendManyRequest,
    responseSerialize: serialize_lnrpc_SendManyResponse,
    responseDeserialize: deserialize_lnrpc_SendManyResponse,
  },
  // * lncli: `newaddress`
  // NewAddress creates a new address under control of the local wallet.
  newAddress: {
    path: '/lnrpc.Lightning/NewAddress',
    requestStream: false,
    responseStream: false,
    requestType: lndrpc_pb.NewAddressRequest,
    responseType: lndrpc_pb.NewAddressResponse,
    requestSerialize: serialize_lnrpc_NewAddressRequest,
    requestDeserialize: deserialize_lnrpc_NewAddressRequest,
    responseSerialize: serialize_lnrpc_NewAddressResponse,
    responseDeserialize: deserialize_lnrpc_NewAddressResponse,
  },
  // *
  // NewWitnessAddress creates a new witness address under control of the local wallet.
  newWitnessAddress: {
    path: '/lnrpc.Lightning/NewWitnessAddress',
    requestStream: false,
    responseStream: false,
    requestType: lndrpc_pb.NewWitnessAddressRequest,
    responseType: lndrpc_pb.NewAddressResponse,
    requestSerialize: serialize_lnrpc_NewWitnessAddressRequest,
    requestDeserialize: deserialize_lnrpc_NewWitnessAddressRequest,
    responseSerialize: serialize_lnrpc_NewAddressResponse,
    responseDeserialize: deserialize_lnrpc_NewAddressResponse,
  },
  // * lncli: `signmessage`
  // SignMessage signs a message with this node's private key. The returned
  // signature string is `zbase32` encoded and pubkey recoverable, meaning that
  // only the message digest and signature are needed for verification.
  signMessage: {
    path: '/lnrpc.Lightning/SignMessage',
    requestStream: false,
    responseStream: false,
    requestType: lndrpc_pb.SignMessageRequest,
    responseType: lndrpc_pb.SignMessageResponse,
    requestSerialize: serialize_lnrpc_SignMessageRequest,
    requestDeserialize: deserialize_lnrpc_SignMessageRequest,
    responseSerialize: serialize_lnrpc_SignMessageResponse,
    responseDeserialize: deserialize_lnrpc_SignMessageResponse,
  },
  // * lncli: `verifymessage`
  // VerifyMessage verifies a signature over a msg. The signature must be
  // zbase32 encoded and signed by an active node in the resident node's
  // channel database. In addition to returning the validity of the signature,
  // VerifyMessage also returns the recovered pubkey from the signature.
  verifyMessage: {
    path: '/lnrpc.Lightning/VerifyMessage',
    requestStream: false,
    responseStream: false,
    requestType: lndrpc_pb.VerifyMessageRequest,
    responseType: lndrpc_pb.VerifyMessageResponse,
    requestSerialize: serialize_lnrpc_VerifyMessageRequest,
    requestDeserialize: deserialize_lnrpc_VerifyMessageRequest,
    responseSerialize: serialize_lnrpc_VerifyMessageResponse,
    responseDeserialize: deserialize_lnrpc_VerifyMessageResponse,
  },
  // * lncli: `connect`
  // ConnectPeer attempts to establish a connection to a remote peer. This is at
  // the networking level, and is used for communication between nodes. This is
  // distinct from establishing a channel with a peer.
  connectPeer: {
    path: '/lnrpc.Lightning/ConnectPeer',
    requestStream: false,
    responseStream: false,
    requestType: lndrpc_pb.ConnectPeerRequest,
    responseType: lndrpc_pb.ConnectPeerResponse,
    requestSerialize: serialize_lnrpc_ConnectPeerRequest,
    requestDeserialize: deserialize_lnrpc_ConnectPeerRequest,
    responseSerialize: serialize_lnrpc_ConnectPeerResponse,
    responseDeserialize: deserialize_lnrpc_ConnectPeerResponse,
  },
  // * lncli: `disconnect`
  // DisconnectPeer attempts to disconnect one peer from another identified by a
  // given pubKey. In the case that we currently have a pending or active channel
  // with the target peer, then this action will be not be allowed.
  disconnectPeer: {
    path: '/lnrpc.Lightning/DisconnectPeer',
    requestStream: false,
    responseStream: false,
    requestType: lndrpc_pb.DisconnectPeerRequest,
    responseType: lndrpc_pb.DisconnectPeerResponse,
    requestSerialize: serialize_lnrpc_DisconnectPeerRequest,
    requestDeserialize: deserialize_lnrpc_DisconnectPeerRequest,
    responseSerialize: serialize_lnrpc_DisconnectPeerResponse,
    responseDeserialize: deserialize_lnrpc_DisconnectPeerResponse,
  },
  // * lncli: `listpeers`
  // ListPeers returns a verbose listing of all currently active peers.
  listPeers: {
    path: '/lnrpc.Lightning/ListPeers',
    requestStream: false,
    responseStream: false,
    requestType: lndrpc_pb.ListPeersRequest,
    responseType: lndrpc_pb.ListPeersResponse,
    requestSerialize: serialize_lnrpc_ListPeersRequest,
    requestDeserialize: deserialize_lnrpc_ListPeersRequest,
    responseSerialize: serialize_lnrpc_ListPeersResponse,
    responseDeserialize: deserialize_lnrpc_ListPeersResponse,
  },
  // * lncli: `getinfo`
  // GetInfo returns general information concerning the lightning node including
  // it's identity pubkey, alias, the chains it is connected to, and information
  // concerning the number of open+pending channels.
  getInfo: {
    path: '/lnrpc.Lightning/GetInfo',
    requestStream: false,
    responseStream: false,
    requestType: lndrpc_pb.GetInfoRequest,
    responseType: lndrpc_pb.GetInfoResponse,
    requestSerialize: serialize_lnrpc_GetInfoRequest,
    requestDeserialize: deserialize_lnrpc_GetInfoRequest,
    responseSerialize: serialize_lnrpc_GetInfoResponse,
    responseDeserialize: deserialize_lnrpc_GetInfoResponse,
  },
  // TODO(roasbeef): merge with below with bool?
  //
  // * lncli: `pendingchannels`
  // PendingChannels returns a list of all the channels that are currently
  // considered "pending". A channel is pending if it has finished the funding
  // workflow and is waiting for confirmations for the funding txn, or is in the
  // process of closure, either initiated cooperatively or non-cooperatively.
  pendingChannels: {
    path: '/lnrpc.Lightning/PendingChannels',
    requestStream: false,
    responseStream: false,
    requestType: lndrpc_pb.PendingChannelsRequest,
    responseType: lndrpc_pb.PendingChannelsResponse,
    requestSerialize: serialize_lnrpc_PendingChannelsRequest,
    requestDeserialize: deserialize_lnrpc_PendingChannelsRequest,
    responseSerialize: serialize_lnrpc_PendingChannelsResponse,
    responseDeserialize: deserialize_lnrpc_PendingChannelsResponse,
  },
  // * lncli: `listchannels`
  // ListChannels returns a description of all the open channels that this node
  // is a participant in.
  listChannels: {
    path: '/lnrpc.Lightning/ListChannels',
    requestStream: false,
    responseStream: false,
    requestType: lndrpc_pb.ListChannelsRequest,
    responseType: lndrpc_pb.ListChannelsResponse,
    requestSerialize: serialize_lnrpc_ListChannelsRequest,
    requestDeserialize: deserialize_lnrpc_ListChannelsRequest,
    responseSerialize: serialize_lnrpc_ListChannelsResponse,
    responseDeserialize: deserialize_lnrpc_ListChannelsResponse,
  },
  // * lncli: `closedchannels`
  // ClosedChannels returns a description of all the closed channels that 
  // this node was a participant in.
  closedChannels: {
    path: '/lnrpc.Lightning/ClosedChannels',
    requestStream: false,
    responseStream: false,
    requestType: lndrpc_pb.ClosedChannelsRequest,
    responseType: lndrpc_pb.ClosedChannelsResponse,
    requestSerialize: serialize_lnrpc_ClosedChannelsRequest,
    requestDeserialize: deserialize_lnrpc_ClosedChannelsRequest,
    responseSerialize: serialize_lnrpc_ClosedChannelsResponse,
    responseDeserialize: deserialize_lnrpc_ClosedChannelsResponse,
  },
  // *
  // OpenChannelSync is a synchronous version of the OpenChannel RPC call. This
  // call is meant to be consumed by clients to the REST proxy. As with all
  // other sync calls, all byte slices are intended to be populated as hex
  // encoded strings.
  openChannelSync: {
    path: '/lnrpc.Lightning/OpenChannelSync',
    requestStream: false,
    responseStream: false,
    requestType: lndrpc_pb.OpenChannelRequest,
    responseType: lndrpc_pb.ChannelPoint,
    requestSerialize: serialize_lnrpc_OpenChannelRequest,
    requestDeserialize: deserialize_lnrpc_OpenChannelRequest,
    responseSerialize: serialize_lnrpc_ChannelPoint,
    responseDeserialize: deserialize_lnrpc_ChannelPoint,
  },
  // * lncli: `openchannel`
  // OpenChannel attempts to open a singly funded channel specified in the
  // request to a remote peer. Users are able to specify a target number of
  // blocks that the funding transaction should be confirmed in, or a manual fee
  // rate to us for the funding transaction. If neither are specified, then a
  // lax block confirmation target is used.
  openChannel: {
    path: '/lnrpc.Lightning/OpenChannel',
    requestStream: false,
    responseStream: true,
    requestType: lndrpc_pb.OpenChannelRequest,
    responseType: lndrpc_pb.OpenStatusUpdate,
    requestSerialize: serialize_lnrpc_OpenChannelRequest,
    requestDeserialize: deserialize_lnrpc_OpenChannelRequest,
    responseSerialize: serialize_lnrpc_OpenStatusUpdate,
    responseDeserialize: deserialize_lnrpc_OpenStatusUpdate,
  },
  // * lncli: `closechannel`
  // CloseChannel attempts to close an active channel identified by its channel
  // outpoint (ChannelPoint). The actions of this method can additionally be
  // augmented to attempt a force close after a timeout period in the case of an
  // inactive peer. If a non-force close (cooperative closure) is requested,
  // then the user can specify either a target number of blocks until the
  // closure transaction is confirmed, or a manual fee rate. If neither are
  // specified, then a default lax, block confirmation target is used.
  closeChannel: {
    path: '/lnrpc.Lightning/CloseChannel',
    requestStream: false,
    responseStream: true,
    requestType: lndrpc_pb.CloseChannelRequest,
    responseType: lndrpc_pb.CloseStatusUpdate,
    requestSerialize: serialize_lnrpc_CloseChannelRequest,
    requestDeserialize: deserialize_lnrpc_CloseChannelRequest,
    responseSerialize: serialize_lnrpc_CloseStatusUpdate,
    responseDeserialize: deserialize_lnrpc_CloseStatusUpdate,
  },
  // * lncli: `sendpayment`
  // SendPayment dispatches a bi-directional streaming RPC for sending payments
  // through the Lightning Network. A single RPC invocation creates a persistent
  // bi-directional stream allowing clients to rapidly send payments through the
  // Lightning Network with a single persistent connection.
  sendPayment: {
    path: '/lnrpc.Lightning/SendPayment',
    requestStream: true,
    responseStream: true,
    requestType: lndrpc_pb.SendRequest,
    responseType: lndrpc_pb.SendResponse,
    requestSerialize: serialize_lnrpc_SendRequest,
    requestDeserialize: deserialize_lnrpc_SendRequest,
    responseSerialize: serialize_lnrpc_SendResponse,
    responseDeserialize: deserialize_lnrpc_SendResponse,
  },
  // *
  // SendPaymentSync is the synchronous non-streaming version of SendPayment.
  // This RPC is intended to be consumed by clients of the REST proxy.
  // Additionally, this RPC expects the destination's public key and the payment
  // hash (if any) to be encoded as hex strings.
  sendPaymentSync: {
    path: '/lnrpc.Lightning/SendPaymentSync',
    requestStream: false,
    responseStream: false,
    requestType: lndrpc_pb.SendRequest,
    responseType: lndrpc_pb.SendResponse,
    requestSerialize: serialize_lnrpc_SendRequest,
    requestDeserialize: deserialize_lnrpc_SendRequest,
    responseSerialize: serialize_lnrpc_SendResponse,
    responseDeserialize: deserialize_lnrpc_SendResponse,
  },
  // * lncli: `sendtoroute`
  // SendToRoute is a bi-directional streaming RPC for sending payment through
  // the Lightning Network. This method differs from SendPayment in that it
  // allows users to specify a full route manually. This can be used for things
  // like rebalancing, and atomic swaps.
  sendToRoute: {
    path: '/lnrpc.Lightning/SendToRoute',
    requestStream: true,
    responseStream: true,
    requestType: lndrpc_pb.SendToRouteRequest,
    responseType: lndrpc_pb.SendResponse,
    requestSerialize: serialize_lnrpc_SendToRouteRequest,
    requestDeserialize: deserialize_lnrpc_SendToRouteRequest,
    responseSerialize: serialize_lnrpc_SendResponse,
    responseDeserialize: deserialize_lnrpc_SendResponse,
  },
  // *
  // SendToRouteSync is a synchronous version of SendToRoute. It Will block
  // until the payment either fails or succeeds.
  sendToRouteSync: {
    path: '/lnrpc.Lightning/SendToRouteSync',
    requestStream: false,
    responseStream: false,
    requestType: lndrpc_pb.SendToRouteRequest,
    responseType: lndrpc_pb.SendResponse,
    requestSerialize: serialize_lnrpc_SendToRouteRequest,
    requestDeserialize: deserialize_lnrpc_SendToRouteRequest,
    responseSerialize: serialize_lnrpc_SendResponse,
    responseDeserialize: deserialize_lnrpc_SendResponse,
  },
  // * lncli: `addinvoice`
  // AddInvoice attempts to add a new invoice to the invoice database. Any
  // duplicated invoices are rejected, therefore all invoices *must* have a
  // unique payment preimage.
  addInvoice: {
    path: '/lnrpc.Lightning/AddInvoice',
    requestStream: false,
    responseStream: false,
    requestType: lndrpc_pb.Invoice,
    responseType: lndrpc_pb.AddInvoiceResponse,
    requestSerialize: serialize_lnrpc_Invoice,
    requestDeserialize: deserialize_lnrpc_Invoice,
    responseSerialize: serialize_lnrpc_AddInvoiceResponse,
    responseDeserialize: deserialize_lnrpc_AddInvoiceResponse,
  },
  // * lncli: `listinvoices`
  // ListInvoices returns a list of all the invoices currently stored within the
  // database. Any active debug invoices are ignored. It has full support for
  // paginated responses, allowing users to query for specific invoices through
  // their add_index. This can be done by using either the first_index_offset or
  // last_index_offset fields included in the response as the index_offset of the
  // next request. The reversed flag is set by default in order to paginate
  // backwards. If you wish to paginate forwards, you must explicitly set the
  // flag to false. If none of the parameters are specified, then the last 100
  // invoices will be returned.
  listInvoices: {
    path: '/lnrpc.Lightning/ListInvoices',
    requestStream: false,
    responseStream: false,
    requestType: lndrpc_pb.ListInvoiceRequest,
    responseType: lndrpc_pb.ListInvoiceResponse,
    requestSerialize: serialize_lnrpc_ListInvoiceRequest,
    requestDeserialize: deserialize_lnrpc_ListInvoiceRequest,
    responseSerialize: serialize_lnrpc_ListInvoiceResponse,
    responseDeserialize: deserialize_lnrpc_ListInvoiceResponse,
  },
  // * lncli: `lookupinvoice`
  // LookupInvoice attempts to look up an invoice according to its payment hash.
  // The passed payment hash *must* be exactly 32 bytes, if not, an error is
  // returned.
  lookupInvoice: {
    path: '/lnrpc.Lightning/LookupInvoice',
    requestStream: false,
    responseStream: false,
    requestType: lndrpc_pb.PaymentHash,
    responseType: lndrpc_pb.Invoice,
    requestSerialize: serialize_lnrpc_PaymentHash,
    requestDeserialize: deserialize_lnrpc_PaymentHash,
    responseSerialize: serialize_lnrpc_Invoice,
    responseDeserialize: deserialize_lnrpc_Invoice,
  },
  // *
  // SubscribeInvoices returns a uni-directional stream (sever -> client) for
  // notifying the client of newly added/settled invoices. The caller can
  // optionally specify the add_index and/or the settle_index. If the add_index
  // is specified, then we'll first start by sending add invoice events for all
  // invoices with an add_index greater than the specified value.  If the
  // settle_index is specified, the next, we'll send out all settle events for
  // invoices with a settle_index greater than the specified value.  One or both
  // of these fields can be set. If no fields are set, then we'll only send out
  // the latest add/settle events.
  subscribeInvoices: {
    path: '/lnrpc.Lightning/SubscribeInvoices',
    requestStream: false,
    responseStream: true,
    requestType: lndrpc_pb.InvoiceSubscription,
    responseType: lndrpc_pb.Invoice,
    requestSerialize: serialize_lnrpc_InvoiceSubscription,
    requestDeserialize: deserialize_lnrpc_InvoiceSubscription,
    responseSerialize: serialize_lnrpc_Invoice,
    responseDeserialize: deserialize_lnrpc_Invoice,
  },
  // * lncli: `decodepayreq`
  // DecodePayReq takes an encoded payment request string and attempts to decode
  // it, returning a full description of the conditions encoded within the
  // payment request.
  decodePayReq: {
    path: '/lnrpc.Lightning/DecodePayReq',
    requestStream: false,
    responseStream: false,
    requestType: lndrpc_pb.PayReqString,
    responseType: lndrpc_pb.PayReq,
    requestSerialize: serialize_lnrpc_PayReqString,
    requestDeserialize: deserialize_lnrpc_PayReqString,
    responseSerialize: serialize_lnrpc_PayReq,
    responseDeserialize: deserialize_lnrpc_PayReq,
  },
  // * lncli: `listpayments`
  // ListPayments returns a list of all outgoing payments.
  listPayments: {
    path: '/lnrpc.Lightning/ListPayments',
    requestStream: false,
    responseStream: false,
    requestType: lndrpc_pb.ListPaymentsRequest,
    responseType: lndrpc_pb.ListPaymentsResponse,
    requestSerialize: serialize_lnrpc_ListPaymentsRequest,
    requestDeserialize: deserialize_lnrpc_ListPaymentsRequest,
    responseSerialize: serialize_lnrpc_ListPaymentsResponse,
    responseDeserialize: deserialize_lnrpc_ListPaymentsResponse,
  },
  // *
  // DeleteAllPayments deletes all outgoing payments from DB.
  deleteAllPayments: {
    path: '/lnrpc.Lightning/DeleteAllPayments',
    requestStream: false,
    responseStream: false,
    requestType: lndrpc_pb.DeleteAllPaymentsRequest,
    responseType: lndrpc_pb.DeleteAllPaymentsResponse,
    requestSerialize: serialize_lnrpc_DeleteAllPaymentsRequest,
    requestDeserialize: deserialize_lnrpc_DeleteAllPaymentsRequest,
    responseSerialize: serialize_lnrpc_DeleteAllPaymentsResponse,
    responseDeserialize: deserialize_lnrpc_DeleteAllPaymentsResponse,
  },
  // * lncli: `describegraph`
  // DescribeGraph returns a description of the latest graph state from the
  // point of view of the node. The graph information is partitioned into two
  // components: all the nodes/vertexes, and all the edges that connect the
  // vertexes themselves.  As this is a directed graph, the edges also contain
  // the node directional specific routing policy which includes: the time lock
  // delta, fee information, etc.
  describeGraph: {
    path: '/lnrpc.Lightning/DescribeGraph',
    requestStream: false,
    responseStream: false,
    requestType: lndrpc_pb.ChannelGraphRequest,
    responseType: lndrpc_pb.ChannelGraph,
    requestSerialize: serialize_lnrpc_ChannelGraphRequest,
    requestDeserialize: deserialize_lnrpc_ChannelGraphRequest,
    responseSerialize: serialize_lnrpc_ChannelGraph,
    responseDeserialize: deserialize_lnrpc_ChannelGraph,
  },
  // * lncli: `getchaninfo`
  // GetChanInfo returns the latest authenticated network announcement for the
  // given channel identified by its channel ID: an 8-byte integer which
  // uniquely identifies the location of transaction's funding output within the
  // blockchain.
  getChanInfo: {
    path: '/lnrpc.Lightning/GetChanInfo',
    requestStream: false,
    responseStream: false,
    requestType: lndrpc_pb.ChanInfoRequest,
    responseType: lndrpc_pb.ChannelEdge,
    requestSerialize: serialize_lnrpc_ChanInfoRequest,
    requestDeserialize: deserialize_lnrpc_ChanInfoRequest,
    responseSerialize: serialize_lnrpc_ChannelEdge,
    responseDeserialize: deserialize_lnrpc_ChannelEdge,
  },
  // * lncli: `getnodeinfo`
  // GetNodeInfo returns the latest advertised, aggregated, and authenticated
  // channel information for the specified node identified by its public key.
  getNodeInfo: {
    path: '/lnrpc.Lightning/GetNodeInfo',
    requestStream: false,
    responseStream: false,
    requestType: lndrpc_pb.NodeInfoRequest,
    responseType: lndrpc_pb.NodeInfo,
    requestSerialize: serialize_lnrpc_NodeInfoRequest,
    requestDeserialize: deserialize_lnrpc_NodeInfoRequest,
    responseSerialize: serialize_lnrpc_NodeInfo,
    responseDeserialize: deserialize_lnrpc_NodeInfo,
  },
  // * lncli: `queryroutes`
  // QueryRoutes attempts to query the daemon's Channel Router for a possible
  // route to a target destination capable of carrying a specific amount of
  // satoshis. The retuned route contains the full details required to craft and
  // send an HTLC, also including the necessary information that should be
  // present within the Sphinx packet encapsulated within the HTLC.
  queryRoutes: {
    path: '/lnrpc.Lightning/QueryRoutes',
    requestStream: false,
    responseStream: false,
    requestType: lndrpc_pb.QueryRoutesRequest,
    responseType: lndrpc_pb.QueryRoutesResponse,
    requestSerialize: serialize_lnrpc_QueryRoutesRequest,
    requestDeserialize: deserialize_lnrpc_QueryRoutesRequest,
    responseSerialize: serialize_lnrpc_QueryRoutesResponse,
    responseDeserialize: deserialize_lnrpc_QueryRoutesResponse,
  },
  // * lncli: `getnetworkinfo`
  // GetNetworkInfo returns some basic stats about the known channel graph from
  // the point of view of the node.
  getNetworkInfo: {
    path: '/lnrpc.Lightning/GetNetworkInfo',
    requestStream: false,
    responseStream: false,
    requestType: lndrpc_pb.NetworkInfoRequest,
    responseType: lndrpc_pb.NetworkInfo,
    requestSerialize: serialize_lnrpc_NetworkInfoRequest,
    requestDeserialize: deserialize_lnrpc_NetworkInfoRequest,
    responseSerialize: serialize_lnrpc_NetworkInfo,
    responseDeserialize: deserialize_lnrpc_NetworkInfo,
  },
  // * lncli: `stop`
  // StopDaemon will send a shutdown request to the interrupt handler, triggering
  // a graceful shutdown of the daemon.
  stopDaemon: {
    path: '/lnrpc.Lightning/StopDaemon',
    requestStream: false,
    responseStream: false,
    requestType: lndrpc_pb.StopRequest,
    responseType: lndrpc_pb.StopResponse,
    requestSerialize: serialize_lnrpc_StopRequest,
    requestDeserialize: deserialize_lnrpc_StopRequest,
    responseSerialize: serialize_lnrpc_StopResponse,
    responseDeserialize: deserialize_lnrpc_StopResponse,
  },
  // *
  // SubscribeChannelGraph launches a streaming RPC that allows the caller to
  // receive notifications upon any changes to the channel graph topology from
  // the point of view of the responding node. Events notified include: new
  // nodes coming online, nodes updating their authenticated attributes, new
  // channels being advertised, updates in the routing policy for a directional
  // channel edge, and when channels are closed on-chain.
  subscribeChannelGraph: {
    path: '/lnrpc.Lightning/SubscribeChannelGraph',
    requestStream: false,
    responseStream: true,
    requestType: lndrpc_pb.GraphTopologySubscription,
    responseType: lndrpc_pb.GraphTopologyUpdate,
    requestSerialize: serialize_lnrpc_GraphTopologySubscription,
    requestDeserialize: deserialize_lnrpc_GraphTopologySubscription,
    responseSerialize: serialize_lnrpc_GraphTopologyUpdate,
    responseDeserialize: deserialize_lnrpc_GraphTopologyUpdate,
  },
  // * lncli: `debuglevel`
  // DebugLevel allows a caller to programmatically set the logging verbosity of
  // lnd. The logging can be targeted according to a coarse daemon-wide logging
  // level, or in a granular fashion to specify the logging for a target
  // sub-system.
  debugLevel: {
    path: '/lnrpc.Lightning/DebugLevel',
    requestStream: false,
    responseStream: false,
    requestType: lndrpc_pb.DebugLevelRequest,
    responseType: lndrpc_pb.DebugLevelResponse,
    requestSerialize: serialize_lnrpc_DebugLevelRequest,
    requestDeserialize: deserialize_lnrpc_DebugLevelRequest,
    responseSerialize: serialize_lnrpc_DebugLevelResponse,
    responseDeserialize: deserialize_lnrpc_DebugLevelResponse,
  },
  // * lncli: `feereport`
  // FeeReport allows the caller to obtain a report detailing the current fee
  // schedule enforced by the node globally for each channel.
  feeReport: {
    path: '/lnrpc.Lightning/FeeReport',
    requestStream: false,
    responseStream: false,
    requestType: lndrpc_pb.FeeReportRequest,
    responseType: lndrpc_pb.FeeReportResponse,
    requestSerialize: serialize_lnrpc_FeeReportRequest,
    requestDeserialize: deserialize_lnrpc_FeeReportRequest,
    responseSerialize: serialize_lnrpc_FeeReportResponse,
    responseDeserialize: deserialize_lnrpc_FeeReportResponse,
  },
  // * lncli: `updatechanpolicy`
  // UpdateChannelPolicy allows the caller to update the fee schedule and
  // channel policies for all channels globally, or a particular channel.
  updateChannelPolicy: {
    path: '/lnrpc.Lightning/UpdateChannelPolicy',
    requestStream: false,
    responseStream: false,
    requestType: lndrpc_pb.PolicyUpdateRequest,
    responseType: lndrpc_pb.PolicyUpdateResponse,
    requestSerialize: serialize_lnrpc_PolicyUpdateRequest,
    requestDeserialize: deserialize_lnrpc_PolicyUpdateRequest,
    responseSerialize: serialize_lnrpc_PolicyUpdateResponse,
    responseDeserialize: deserialize_lnrpc_PolicyUpdateResponse,
  },
  // * lncli: `fwdinghistory`
  // ForwardingHistory allows the caller to query the htlcswitch for a record of
  // all HTLC's forwarded within the target time range, and integer offset
  // within that time range. If no time-range is specified, then the first chunk
  // of the past 24 hrs of forwarding history are returned.
  //
  // A list of forwarding events are returned. The size of each forwarding event
  // is 40 bytes, and the max message size able to be returned in gRPC is 4 MiB.
  // As a result each message can only contain 50k entries.  Each response has
  // the index offset of the last entry. The index offset can be provided to the
  // request to allow the caller to skip a series of records.
  forwardingHistory: {
    path: '/lnrpc.Lightning/ForwardingHistory',
    requestStream: false,
    responseStream: false,
    requestType: lndrpc_pb.ForwardingHistoryRequest,
    responseType: lndrpc_pb.ForwardingHistoryResponse,
    requestSerialize: serialize_lnrpc_ForwardingHistoryRequest,
    requestDeserialize: deserialize_lnrpc_ForwardingHistoryRequest,
    responseSerialize: serialize_lnrpc_ForwardingHistoryResponse,
    responseDeserialize: deserialize_lnrpc_ForwardingHistoryResponse,
  },
};

exports.LightningClient = grpc.makeGenericClientConstructor(LightningService);
