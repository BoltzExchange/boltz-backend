// GENERATED CODE -- DO NOT EDIT!

'use strict';
var grpc = require('grpc');
var lnd_router_pb = require('../lnd/router_pb.js');
var lnd_rpc_pb = require('../lnd/rpc_pb.js');

function serialize_lnrpc_HTLCAttempt(arg) {
  if (!(arg instanceof lnd_rpc_pb.HTLCAttempt)) {
    throw new Error('Expected argument of type lnrpc.HTLCAttempt');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_lnrpc_HTLCAttempt(buffer_arg) {
  return lnd_rpc_pb.HTLCAttempt.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_lnrpc_Payment(arg) {
  if (!(arg instanceof lnd_rpc_pb.Payment)) {
    throw new Error('Expected argument of type lnrpc.Payment');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_lnrpc_Payment(buffer_arg) {
  return lnd_rpc_pb.Payment.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_routerrpc_BuildRouteRequest(arg) {
  if (!(arg instanceof lnd_router_pb.BuildRouteRequest)) {
    throw new Error('Expected argument of type routerrpc.BuildRouteRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_routerrpc_BuildRouteRequest(buffer_arg) {
  return lnd_router_pb.BuildRouteRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_routerrpc_BuildRouteResponse(arg) {
  if (!(arg instanceof lnd_router_pb.BuildRouteResponse)) {
    throw new Error('Expected argument of type routerrpc.BuildRouteResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_routerrpc_BuildRouteResponse(buffer_arg) {
  return lnd_router_pb.BuildRouteResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_routerrpc_ForwardHtlcInterceptRequest(arg) {
  if (!(arg instanceof lnd_router_pb.ForwardHtlcInterceptRequest)) {
    throw new Error('Expected argument of type routerrpc.ForwardHtlcInterceptRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_routerrpc_ForwardHtlcInterceptRequest(buffer_arg) {
  return lnd_router_pb.ForwardHtlcInterceptRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_routerrpc_ForwardHtlcInterceptResponse(arg) {
  if (!(arg instanceof lnd_router_pb.ForwardHtlcInterceptResponse)) {
    throw new Error('Expected argument of type routerrpc.ForwardHtlcInterceptResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_routerrpc_ForwardHtlcInterceptResponse(buffer_arg) {
  return lnd_router_pb.ForwardHtlcInterceptResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_routerrpc_HtlcEvent(arg) {
  if (!(arg instanceof lnd_router_pb.HtlcEvent)) {
    throw new Error('Expected argument of type routerrpc.HtlcEvent');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_routerrpc_HtlcEvent(buffer_arg) {
  return lnd_router_pb.HtlcEvent.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_routerrpc_PaymentStatus(arg) {
  if (!(arg instanceof lnd_router_pb.PaymentStatus)) {
    throw new Error('Expected argument of type routerrpc.PaymentStatus');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_routerrpc_PaymentStatus(buffer_arg) {
  return lnd_router_pb.PaymentStatus.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_routerrpc_QueryMissionControlRequest(arg) {
  if (!(arg instanceof lnd_router_pb.QueryMissionControlRequest)) {
    throw new Error('Expected argument of type routerrpc.QueryMissionControlRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_routerrpc_QueryMissionControlRequest(buffer_arg) {
  return lnd_router_pb.QueryMissionControlRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_routerrpc_QueryMissionControlResponse(arg) {
  if (!(arg instanceof lnd_router_pb.QueryMissionControlResponse)) {
    throw new Error('Expected argument of type routerrpc.QueryMissionControlResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_routerrpc_QueryMissionControlResponse(buffer_arg) {
  return lnd_router_pb.QueryMissionControlResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_routerrpc_QueryProbabilityRequest(arg) {
  if (!(arg instanceof lnd_router_pb.QueryProbabilityRequest)) {
    throw new Error('Expected argument of type routerrpc.QueryProbabilityRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_routerrpc_QueryProbabilityRequest(buffer_arg) {
  return lnd_router_pb.QueryProbabilityRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_routerrpc_QueryProbabilityResponse(arg) {
  if (!(arg instanceof lnd_router_pb.QueryProbabilityResponse)) {
    throw new Error('Expected argument of type routerrpc.QueryProbabilityResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_routerrpc_QueryProbabilityResponse(buffer_arg) {
  return lnd_router_pb.QueryProbabilityResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_routerrpc_ResetMissionControlRequest(arg) {
  if (!(arg instanceof lnd_router_pb.ResetMissionControlRequest)) {
    throw new Error('Expected argument of type routerrpc.ResetMissionControlRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_routerrpc_ResetMissionControlRequest(buffer_arg) {
  return lnd_router_pb.ResetMissionControlRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_routerrpc_ResetMissionControlResponse(arg) {
  if (!(arg instanceof lnd_router_pb.ResetMissionControlResponse)) {
    throw new Error('Expected argument of type routerrpc.ResetMissionControlResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_routerrpc_ResetMissionControlResponse(buffer_arg) {
  return lnd_router_pb.ResetMissionControlResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_routerrpc_RouteFeeRequest(arg) {
  if (!(arg instanceof lnd_router_pb.RouteFeeRequest)) {
    throw new Error('Expected argument of type routerrpc.RouteFeeRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_routerrpc_RouteFeeRequest(buffer_arg) {
  return lnd_router_pb.RouteFeeRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_routerrpc_RouteFeeResponse(arg) {
  if (!(arg instanceof lnd_router_pb.RouteFeeResponse)) {
    throw new Error('Expected argument of type routerrpc.RouteFeeResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_routerrpc_RouteFeeResponse(buffer_arg) {
  return lnd_router_pb.RouteFeeResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_routerrpc_SendPaymentRequest(arg) {
  if (!(arg instanceof lnd_router_pb.SendPaymentRequest)) {
    throw new Error('Expected argument of type routerrpc.SendPaymentRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_routerrpc_SendPaymentRequest(buffer_arg) {
  return lnd_router_pb.SendPaymentRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_routerrpc_SendToRouteRequest(arg) {
  if (!(arg instanceof lnd_router_pb.SendToRouteRequest)) {
    throw new Error('Expected argument of type routerrpc.SendToRouteRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_routerrpc_SendToRouteRequest(buffer_arg) {
  return lnd_router_pb.SendToRouteRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_routerrpc_SendToRouteResponse(arg) {
  if (!(arg instanceof lnd_router_pb.SendToRouteResponse)) {
    throw new Error('Expected argument of type routerrpc.SendToRouteResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_routerrpc_SendToRouteResponse(buffer_arg) {
  return lnd_router_pb.SendToRouteResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_routerrpc_SubscribeHtlcEventsRequest(arg) {
  if (!(arg instanceof lnd_router_pb.SubscribeHtlcEventsRequest)) {
    throw new Error('Expected argument of type routerrpc.SubscribeHtlcEventsRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_routerrpc_SubscribeHtlcEventsRequest(buffer_arg) {
  return lnd_router_pb.SubscribeHtlcEventsRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_routerrpc_TrackPaymentRequest(arg) {
  if (!(arg instanceof lnd_router_pb.TrackPaymentRequest)) {
    throw new Error('Expected argument of type routerrpc.TrackPaymentRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_routerrpc_TrackPaymentRequest(buffer_arg) {
  return lnd_router_pb.TrackPaymentRequest.deserializeBinary(new Uint8Array(buffer_arg));
}


// Router is a service that offers advanced interaction with the router
// subsystem of the daemon.
var RouterService = exports.RouterService = {
  //
// SendPaymentV2 attempts to route a payment described by the passed
// PaymentRequest to the final destination. The call returns a stream of
// payment updates.
sendPaymentV2: {
    path: '/routerrpc.Router/SendPaymentV2',
    requestStream: false,
    responseStream: true,
    requestType: lnd_router_pb.SendPaymentRequest,
    responseType: lnd_rpc_pb.Payment,
    requestSerialize: serialize_routerrpc_SendPaymentRequest,
    requestDeserialize: deserialize_routerrpc_SendPaymentRequest,
    responseSerialize: serialize_lnrpc_Payment,
    responseDeserialize: deserialize_lnrpc_Payment,
  },
  //
// TrackPaymentV2 returns an update stream for the payment identified by the
// payment hash.
trackPaymentV2: {
    path: '/routerrpc.Router/TrackPaymentV2',
    requestStream: false,
    responseStream: true,
    requestType: lnd_router_pb.TrackPaymentRequest,
    responseType: lnd_rpc_pb.Payment,
    requestSerialize: serialize_routerrpc_TrackPaymentRequest,
    requestDeserialize: deserialize_routerrpc_TrackPaymentRequest,
    responseSerialize: serialize_lnrpc_Payment,
    responseDeserialize: deserialize_lnrpc_Payment,
  },
  //
// EstimateRouteFee allows callers to obtain a lower bound w.r.t how much it
// may cost to send an HTLC to the target end destination.
estimateRouteFee: {
    path: '/routerrpc.Router/EstimateRouteFee',
    requestStream: false,
    responseStream: false,
    requestType: lnd_router_pb.RouteFeeRequest,
    responseType: lnd_router_pb.RouteFeeResponse,
    requestSerialize: serialize_routerrpc_RouteFeeRequest,
    requestDeserialize: deserialize_routerrpc_RouteFeeRequest,
    responseSerialize: serialize_routerrpc_RouteFeeResponse,
    responseDeserialize: deserialize_routerrpc_RouteFeeResponse,
  },
  //
// Deprecated, use SendToRouteV2. SendToRoute attempts to make a payment via
// the specified route. This method differs from SendPayment in that it
// allows users to specify a full route manually. This can be used for
// things like rebalancing, and atomic swaps. It differs from the newer
// SendToRouteV2 in that it doesn't return the full HTLC information.
sendToRoute: {
    path: '/routerrpc.Router/SendToRoute',
    requestStream: false,
    responseStream: false,
    requestType: lnd_router_pb.SendToRouteRequest,
    responseType: lnd_router_pb.SendToRouteResponse,
    requestSerialize: serialize_routerrpc_SendToRouteRequest,
    requestDeserialize: deserialize_routerrpc_SendToRouteRequest,
    responseSerialize: serialize_routerrpc_SendToRouteResponse,
    responseDeserialize: deserialize_routerrpc_SendToRouteResponse,
  },
  //
// SendToRouteV2 attempts to make a payment via the specified route. This
// method differs from SendPayment in that it allows users to specify a full
// route manually. This can be used for things like rebalancing, and atomic
// swaps.
sendToRouteV2: {
    path: '/routerrpc.Router/SendToRouteV2',
    requestStream: false,
    responseStream: false,
    requestType: lnd_router_pb.SendToRouteRequest,
    responseType: lnd_rpc_pb.HTLCAttempt,
    requestSerialize: serialize_routerrpc_SendToRouteRequest,
    requestDeserialize: deserialize_routerrpc_SendToRouteRequest,
    responseSerialize: serialize_lnrpc_HTLCAttempt,
    responseDeserialize: deserialize_lnrpc_HTLCAttempt,
  },
  //
// ResetMissionControl clears all mission control state and starts with a clean
// slate.
resetMissionControl: {
    path: '/routerrpc.Router/ResetMissionControl',
    requestStream: false,
    responseStream: false,
    requestType: lnd_router_pb.ResetMissionControlRequest,
    responseType: lnd_router_pb.ResetMissionControlResponse,
    requestSerialize: serialize_routerrpc_ResetMissionControlRequest,
    requestDeserialize: deserialize_routerrpc_ResetMissionControlRequest,
    responseSerialize: serialize_routerrpc_ResetMissionControlResponse,
    responseDeserialize: deserialize_routerrpc_ResetMissionControlResponse,
  },
  //
// QueryMissionControl exposes the internal mission control state to callers.
// It is a development feature.
queryMissionControl: {
    path: '/routerrpc.Router/QueryMissionControl',
    requestStream: false,
    responseStream: false,
    requestType: lnd_router_pb.QueryMissionControlRequest,
    responseType: lnd_router_pb.QueryMissionControlResponse,
    requestSerialize: serialize_routerrpc_QueryMissionControlRequest,
    requestDeserialize: deserialize_routerrpc_QueryMissionControlRequest,
    responseSerialize: serialize_routerrpc_QueryMissionControlResponse,
    responseDeserialize: deserialize_routerrpc_QueryMissionControlResponse,
  },
  //
// QueryProbability returns the current success probability estimate for a
// given node pair and amount.
queryProbability: {
    path: '/routerrpc.Router/QueryProbability',
    requestStream: false,
    responseStream: false,
    requestType: lnd_router_pb.QueryProbabilityRequest,
    responseType: lnd_router_pb.QueryProbabilityResponse,
    requestSerialize: serialize_routerrpc_QueryProbabilityRequest,
    requestDeserialize: deserialize_routerrpc_QueryProbabilityRequest,
    responseSerialize: serialize_routerrpc_QueryProbabilityResponse,
    responseDeserialize: deserialize_routerrpc_QueryProbabilityResponse,
  },
  //
// BuildRoute builds a fully specified route based on a list of hop public
// keys. It retrieves the relevant channel policies from the graph in order to
// calculate the correct fees and time locks.
buildRoute: {
    path: '/routerrpc.Router/BuildRoute',
    requestStream: false,
    responseStream: false,
    requestType: lnd_router_pb.BuildRouteRequest,
    responseType: lnd_router_pb.BuildRouteResponse,
    requestSerialize: serialize_routerrpc_BuildRouteRequest,
    requestDeserialize: deserialize_routerrpc_BuildRouteRequest,
    responseSerialize: serialize_routerrpc_BuildRouteResponse,
    responseDeserialize: deserialize_routerrpc_BuildRouteResponse,
  },
  //
// SubscribeHtlcEvents creates a uni-directional stream from the server to
// the client which delivers a stream of htlc events.
subscribeHtlcEvents: {
    path: '/routerrpc.Router/SubscribeHtlcEvents',
    requestStream: false,
    responseStream: true,
    requestType: lnd_router_pb.SubscribeHtlcEventsRequest,
    responseType: lnd_router_pb.HtlcEvent,
    requestSerialize: serialize_routerrpc_SubscribeHtlcEventsRequest,
    requestDeserialize: deserialize_routerrpc_SubscribeHtlcEventsRequest,
    responseSerialize: serialize_routerrpc_HtlcEvent,
    responseDeserialize: deserialize_routerrpc_HtlcEvent,
  },
  //
// Deprecated, use SendPaymentV2. SendPayment attempts to route a payment
// described by the passed PaymentRequest to the final destination. The call
// returns a stream of payment status updates.
sendPayment: {
    path: '/routerrpc.Router/SendPayment',
    requestStream: false,
    responseStream: true,
    requestType: lnd_router_pb.SendPaymentRequest,
    responseType: lnd_router_pb.PaymentStatus,
    requestSerialize: serialize_routerrpc_SendPaymentRequest,
    requestDeserialize: deserialize_routerrpc_SendPaymentRequest,
    responseSerialize: serialize_routerrpc_PaymentStatus,
    responseDeserialize: deserialize_routerrpc_PaymentStatus,
  },
  //
// Deprecated, use TrackPaymentV2. TrackPayment returns an update stream for
// the payment identified by the payment hash.
trackPayment: {
    path: '/routerrpc.Router/TrackPayment',
    requestStream: false,
    responseStream: true,
    requestType: lnd_router_pb.TrackPaymentRequest,
    responseType: lnd_router_pb.PaymentStatus,
    requestSerialize: serialize_routerrpc_TrackPaymentRequest,
    requestDeserialize: deserialize_routerrpc_TrackPaymentRequest,
    responseSerialize: serialize_routerrpc_PaymentStatus,
    responseDeserialize: deserialize_routerrpc_PaymentStatus,
  },
  // *
// HtlcInterceptor dispatches a bi-directional streaming RPC in which
// Forwarded HTLC requests are sent to the client and the client responds with
// a boolean that tells LND if this htlc should be intercepted.
// In case of interception, the htlc can be either settled, cancelled or
// resumed later by using the ResolveHoldForward endpoint.
htlcInterceptor: {
    path: '/routerrpc.Router/HtlcInterceptor',
    requestStream: true,
    responseStream: true,
    requestType: lnd_router_pb.ForwardHtlcInterceptResponse,
    responseType: lnd_router_pb.ForwardHtlcInterceptRequest,
    requestSerialize: serialize_routerrpc_ForwardHtlcInterceptResponse,
    requestDeserialize: deserialize_routerrpc_ForwardHtlcInterceptResponse,
    responseSerialize: serialize_routerrpc_ForwardHtlcInterceptRequest,
    responseDeserialize: deserialize_routerrpc_ForwardHtlcInterceptRequest,
  },
};

exports.RouterClient = grpc.makeGenericClientConstructor(RouterService);
