// source: ark/service.proto
/**
 * @fileoverview
 * @enhanceable
 * @suppress {missingRequire} reports error on implicit type usages.
 * @suppress {messageConventions} JS Compiler reports an error if a variable or
 *     field starts with 'MSG_' and isn't a translatable message.
 * @public
 */
// GENERATED CODE -- DO NOT EDIT!
/* eslint-disable */
// @ts-nocheck

var jspb = require('google-protobuf');
var goog = jspb;
var global = (function() {
  if (this) { return this; }
  if (typeof window !== 'undefined') { return window; }
  if (typeof global !== 'undefined') { return global; }
  if (typeof self !== 'undefined') { return self; }
  return Function('return this')();
}.call(null));

var ark_types_pb = require('../ark/types_pb.js');
goog.object.extend(proto, ark_types_pb);
var google_api_annotations_pb = require('../google/api/annotations_pb.js');
goog.object.extend(proto, google_api_annotations_pb);
goog.exportSymbol('proto.fulmine.v1.ChainSwapResponse', null, global);
goog.exportSymbol('proto.fulmine.v1.ClaimPath', null, global);
goog.exportSymbol('proto.fulmine.v1.ClaimVHTLCRequest', null, global);
goog.exportSymbol('proto.fulmine.v1.ClaimVHTLCResponse', null, global);
goog.exportSymbol('proto.fulmine.v1.CreateChainSwapRequest', null, global);
goog.exportSymbol('proto.fulmine.v1.CreateChainSwapResponse', null, global);
goog.exportSymbol('proto.fulmine.v1.CreateVHTLCRequest', null, global);
goog.exportSymbol('proto.fulmine.v1.CreateVHTLCResponse', null, global);
goog.exportSymbol('proto.fulmine.v1.Delegate', null, global);
goog.exportSymbol('proto.fulmine.v1.DelegateForfeitTx', null, global);
goog.exportSymbol('proto.fulmine.v1.DelegateIntent', null, global);
goog.exportSymbol('proto.fulmine.v1.DelegateRefundParams', null, global);
goog.exportSymbol('proto.fulmine.v1.GetAddressRequest', null, global);
goog.exportSymbol('proto.fulmine.v1.GetAddressResponse', null, global);
goog.exportSymbol('proto.fulmine.v1.GetBalanceRequest', null, global);
goog.exportSymbol('proto.fulmine.v1.GetBalanceResponse', null, global);
goog.exportSymbol('proto.fulmine.v1.GetInfoRequest', null, global);
goog.exportSymbol('proto.fulmine.v1.GetInfoResponse', null, global);
goog.exportSymbol('proto.fulmine.v1.GetInfoResponse.Network', null, global);
goog.exportSymbol('proto.fulmine.v1.GetInvoiceRequest', null, global);
goog.exportSymbol('proto.fulmine.v1.GetInvoiceResponse', null, global);
goog.exportSymbol('proto.fulmine.v1.GetOnboardAddressRequest', null, global);
goog.exportSymbol('proto.fulmine.v1.GetOnboardAddressResponse', null, global);
goog.exportSymbol('proto.fulmine.v1.GetRoundInfoRequest', null, global);
goog.exportSymbol('proto.fulmine.v1.GetRoundInfoResponse', null, global);
goog.exportSymbol('proto.fulmine.v1.GetTransactionHistoryRequest', null, global);
goog.exportSymbol('proto.fulmine.v1.GetTransactionHistoryResponse', null, global);
goog.exportSymbol('proto.fulmine.v1.GetVirtualTxsRequest', null, global);
goog.exportSymbol('proto.fulmine.v1.GetVirtualTxsResponse', null, global);
goog.exportSymbol('proto.fulmine.v1.GetVtxosRequest', null, global);
goog.exportSymbol('proto.fulmine.v1.GetVtxosRequest.FilterCase', null, global);
goog.exportSymbol('proto.fulmine.v1.GetVtxosResponse', null, global);
goog.exportSymbol('proto.fulmine.v1.IsInvoiceSettledRequest', null, global);
goog.exportSymbol('proto.fulmine.v1.IsInvoiceSettledResponse', null, global);
goog.exportSymbol('proto.fulmine.v1.ListChainSwapsRequest', null, global);
goog.exportSymbol('proto.fulmine.v1.ListChainSwapsResponse', null, global);
goog.exportSymbol('proto.fulmine.v1.ListDelegatesRequest', null, global);
goog.exportSymbol('proto.fulmine.v1.ListDelegatesResponse', null, global);
goog.exportSymbol('proto.fulmine.v1.ListVHTLCRequest', null, global);
goog.exportSymbol('proto.fulmine.v1.ListVHTLCResponse', null, global);
goog.exportSymbol('proto.fulmine.v1.NextSettlementRequest', null, global);
goog.exportSymbol('proto.fulmine.v1.NextSettlementResponse', null, global);
goog.exportSymbol('proto.fulmine.v1.PayInvoiceRequest', null, global);
goog.exportSymbol('proto.fulmine.v1.PayInvoiceResponse', null, global);
goog.exportSymbol('proto.fulmine.v1.RedeemNoteRequest', null, global);
goog.exportSymbol('proto.fulmine.v1.RedeemNoteResponse', null, global);
goog.exportSymbol('proto.fulmine.v1.RefundChainSwapRequest', null, global);
goog.exportSymbol('proto.fulmine.v1.RefundChainSwapResponse', null, global);
goog.exportSymbol('proto.fulmine.v1.RefundPath', null, global);
goog.exportSymbol('proto.fulmine.v1.RefundVHTLCWithoutReceiverRequest', null, global);
goog.exportSymbol('proto.fulmine.v1.RefundVHTLCWithoutReceiverResponse', null, global);
goog.exportSymbol('proto.fulmine.v1.RelativeLocktime', null, global);
goog.exportSymbol('proto.fulmine.v1.RelativeLocktime.LocktimeType', null, global);
goog.exportSymbol('proto.fulmine.v1.SendOffChainRequest', null, global);
goog.exportSymbol('proto.fulmine.v1.SendOffChainResponse', null, global);
goog.exportSymbol('proto.fulmine.v1.SendOnChainRequest', null, global);
goog.exportSymbol('proto.fulmine.v1.SendOnChainResponse', null, global);
goog.exportSymbol('proto.fulmine.v1.SettleRequest', null, global);
goog.exportSymbol('proto.fulmine.v1.SettleResponse', null, global);
goog.exportSymbol('proto.fulmine.v1.SettleVHTLCRequest', null, global);
goog.exportSymbol('proto.fulmine.v1.SettleVHTLCRequest.SettlementTypeCase', null, global);
goog.exportSymbol('proto.fulmine.v1.SettleVHTLCResponse', null, global);
goog.exportSymbol('proto.fulmine.v1.SignTransactionRequest', null, global);
goog.exportSymbol('proto.fulmine.v1.SignTransactionResponse', null, global);
goog.exportSymbol('proto.fulmine.v1.SwapDirection', null, global);
goog.exportSymbol('proto.fulmine.v1.TaprootLeaf', null, global);
goog.exportSymbol('proto.fulmine.v1.TaprootTree', null, global);
goog.exportSymbol('proto.fulmine.v1.Tapscripts', null, global);
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.fulmine.v1.GetAddressRequest = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.fulmine.v1.GetAddressRequest, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.fulmine.v1.GetAddressRequest.displayName = 'proto.fulmine.v1.GetAddressRequest';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.fulmine.v1.GetAddressResponse = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.fulmine.v1.GetAddressResponse, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.fulmine.v1.GetAddressResponse.displayName = 'proto.fulmine.v1.GetAddressResponse';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.fulmine.v1.GetBalanceRequest = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.fulmine.v1.GetBalanceRequest, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.fulmine.v1.GetBalanceRequest.displayName = 'proto.fulmine.v1.GetBalanceRequest';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.fulmine.v1.GetBalanceResponse = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.fulmine.v1.GetBalanceResponse, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.fulmine.v1.GetBalanceResponse.displayName = 'proto.fulmine.v1.GetBalanceResponse';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.fulmine.v1.GetInfoRequest = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.fulmine.v1.GetInfoRequest, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.fulmine.v1.GetInfoRequest.displayName = 'proto.fulmine.v1.GetInfoRequest';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.fulmine.v1.GetInfoResponse = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.fulmine.v1.GetInfoResponse, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.fulmine.v1.GetInfoResponse.displayName = 'proto.fulmine.v1.GetInfoResponse';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.fulmine.v1.GetOnboardAddressRequest = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.fulmine.v1.GetOnboardAddressRequest, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.fulmine.v1.GetOnboardAddressRequest.displayName = 'proto.fulmine.v1.GetOnboardAddressRequest';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.fulmine.v1.GetOnboardAddressResponse = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.fulmine.v1.GetOnboardAddressResponse, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.fulmine.v1.GetOnboardAddressResponse.displayName = 'proto.fulmine.v1.GetOnboardAddressResponse';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.fulmine.v1.GetRoundInfoRequest = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.fulmine.v1.GetRoundInfoRequest, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.fulmine.v1.GetRoundInfoRequest.displayName = 'proto.fulmine.v1.GetRoundInfoRequest';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.fulmine.v1.GetRoundInfoResponse = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.fulmine.v1.GetRoundInfoResponse, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.fulmine.v1.GetRoundInfoResponse.displayName = 'proto.fulmine.v1.GetRoundInfoResponse';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.fulmine.v1.GetTransactionHistoryRequest = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.fulmine.v1.GetTransactionHistoryRequest, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.fulmine.v1.GetTransactionHistoryRequest.displayName = 'proto.fulmine.v1.GetTransactionHistoryRequest';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.fulmine.v1.GetTransactionHistoryResponse = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, proto.fulmine.v1.GetTransactionHistoryResponse.repeatedFields_, null);
};
goog.inherits(proto.fulmine.v1.GetTransactionHistoryResponse, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.fulmine.v1.GetTransactionHistoryResponse.displayName = 'proto.fulmine.v1.GetTransactionHistoryResponse';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.fulmine.v1.RedeemNoteRequest = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.fulmine.v1.RedeemNoteRequest, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.fulmine.v1.RedeemNoteRequest.displayName = 'proto.fulmine.v1.RedeemNoteRequest';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.fulmine.v1.RedeemNoteResponse = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.fulmine.v1.RedeemNoteResponse, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.fulmine.v1.RedeemNoteResponse.displayName = 'proto.fulmine.v1.RedeemNoteResponse';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.fulmine.v1.SettleRequest = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.fulmine.v1.SettleRequest, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.fulmine.v1.SettleRequest.displayName = 'proto.fulmine.v1.SettleRequest';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.fulmine.v1.SettleResponse = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.fulmine.v1.SettleResponse, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.fulmine.v1.SettleResponse.displayName = 'proto.fulmine.v1.SettleResponse';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.fulmine.v1.SendOffChainRequest = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.fulmine.v1.SendOffChainRequest, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.fulmine.v1.SendOffChainRequest.displayName = 'proto.fulmine.v1.SendOffChainRequest';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.fulmine.v1.SendOffChainResponse = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.fulmine.v1.SendOffChainResponse, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.fulmine.v1.SendOffChainResponse.displayName = 'proto.fulmine.v1.SendOffChainResponse';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.fulmine.v1.SendOnChainRequest = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.fulmine.v1.SendOnChainRequest, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.fulmine.v1.SendOnChainRequest.displayName = 'proto.fulmine.v1.SendOnChainRequest';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.fulmine.v1.SendOnChainResponse = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.fulmine.v1.SendOnChainResponse, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.fulmine.v1.SendOnChainResponse.displayName = 'proto.fulmine.v1.SendOnChainResponse';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.fulmine.v1.SignTransactionRequest = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.fulmine.v1.SignTransactionRequest, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.fulmine.v1.SignTransactionRequest.displayName = 'proto.fulmine.v1.SignTransactionRequest';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.fulmine.v1.SignTransactionResponse = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.fulmine.v1.SignTransactionResponse, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.fulmine.v1.SignTransactionResponse.displayName = 'proto.fulmine.v1.SignTransactionResponse';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.fulmine.v1.CreateVHTLCRequest = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.fulmine.v1.CreateVHTLCRequest, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.fulmine.v1.CreateVHTLCRequest.displayName = 'proto.fulmine.v1.CreateVHTLCRequest';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.fulmine.v1.CreateVHTLCResponse = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.fulmine.v1.CreateVHTLCResponse, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.fulmine.v1.CreateVHTLCResponse.displayName = 'proto.fulmine.v1.CreateVHTLCResponse';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.fulmine.v1.ClaimVHTLCRequest = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.fulmine.v1.ClaimVHTLCRequest, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.fulmine.v1.ClaimVHTLCRequest.displayName = 'proto.fulmine.v1.ClaimVHTLCRequest';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.fulmine.v1.ClaimVHTLCResponse = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.fulmine.v1.ClaimVHTLCResponse, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.fulmine.v1.ClaimVHTLCResponse.displayName = 'proto.fulmine.v1.ClaimVHTLCResponse';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.fulmine.v1.RefundVHTLCWithoutReceiverRequest = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.fulmine.v1.RefundVHTLCWithoutReceiverRequest, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.fulmine.v1.RefundVHTLCWithoutReceiverRequest.displayName = 'proto.fulmine.v1.RefundVHTLCWithoutReceiverRequest';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.fulmine.v1.RefundVHTLCWithoutReceiverResponse = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.fulmine.v1.RefundVHTLCWithoutReceiverResponse, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.fulmine.v1.RefundVHTLCWithoutReceiverResponse.displayName = 'proto.fulmine.v1.RefundVHTLCWithoutReceiverResponse';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.fulmine.v1.SettleVHTLCRequest = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, proto.fulmine.v1.SettleVHTLCRequest.oneofGroups_);
};
goog.inherits(proto.fulmine.v1.SettleVHTLCRequest, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.fulmine.v1.SettleVHTLCRequest.displayName = 'proto.fulmine.v1.SettleVHTLCRequest';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.fulmine.v1.ClaimPath = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.fulmine.v1.ClaimPath, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.fulmine.v1.ClaimPath.displayName = 'proto.fulmine.v1.ClaimPath';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.fulmine.v1.RefundPath = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.fulmine.v1.RefundPath, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.fulmine.v1.RefundPath.displayName = 'proto.fulmine.v1.RefundPath';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.fulmine.v1.DelegateRefundParams = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.fulmine.v1.DelegateRefundParams, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.fulmine.v1.DelegateRefundParams.displayName = 'proto.fulmine.v1.DelegateRefundParams';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.fulmine.v1.SettleVHTLCResponse = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.fulmine.v1.SettleVHTLCResponse, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.fulmine.v1.SettleVHTLCResponse.displayName = 'proto.fulmine.v1.SettleVHTLCResponse';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.fulmine.v1.ListVHTLCRequest = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.fulmine.v1.ListVHTLCRequest, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.fulmine.v1.ListVHTLCRequest.displayName = 'proto.fulmine.v1.ListVHTLCRequest';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.fulmine.v1.ListVHTLCResponse = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, proto.fulmine.v1.ListVHTLCResponse.repeatedFields_, null);
};
goog.inherits(proto.fulmine.v1.ListVHTLCResponse, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.fulmine.v1.ListVHTLCResponse.displayName = 'proto.fulmine.v1.ListVHTLCResponse';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.fulmine.v1.GetInvoiceRequest = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.fulmine.v1.GetInvoiceRequest, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.fulmine.v1.GetInvoiceRequest.displayName = 'proto.fulmine.v1.GetInvoiceRequest';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.fulmine.v1.GetInvoiceResponse = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.fulmine.v1.GetInvoiceResponse, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.fulmine.v1.GetInvoiceResponse.displayName = 'proto.fulmine.v1.GetInvoiceResponse';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.fulmine.v1.PayInvoiceRequest = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.fulmine.v1.PayInvoiceRequest, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.fulmine.v1.PayInvoiceRequest.displayName = 'proto.fulmine.v1.PayInvoiceRequest';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.fulmine.v1.PayInvoiceResponse = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.fulmine.v1.PayInvoiceResponse, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.fulmine.v1.PayInvoiceResponse.displayName = 'proto.fulmine.v1.PayInvoiceResponse';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.fulmine.v1.TaprootTree = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.fulmine.v1.TaprootTree, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.fulmine.v1.TaprootTree.displayName = 'proto.fulmine.v1.TaprootTree';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.fulmine.v1.TaprootLeaf = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.fulmine.v1.TaprootLeaf, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.fulmine.v1.TaprootLeaf.displayName = 'proto.fulmine.v1.TaprootLeaf';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.fulmine.v1.IsInvoiceSettledRequest = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.fulmine.v1.IsInvoiceSettledRequest, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.fulmine.v1.IsInvoiceSettledRequest.displayName = 'proto.fulmine.v1.IsInvoiceSettledRequest';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.fulmine.v1.IsInvoiceSettledResponse = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.fulmine.v1.IsInvoiceSettledResponse, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.fulmine.v1.IsInvoiceSettledResponse.displayName = 'proto.fulmine.v1.IsInvoiceSettledResponse';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.fulmine.v1.RelativeLocktime = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.fulmine.v1.RelativeLocktime, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.fulmine.v1.RelativeLocktime.displayName = 'proto.fulmine.v1.RelativeLocktime';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.fulmine.v1.Tapscripts = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, proto.fulmine.v1.Tapscripts.repeatedFields_, null);
};
goog.inherits(proto.fulmine.v1.Tapscripts, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.fulmine.v1.Tapscripts.displayName = 'proto.fulmine.v1.Tapscripts';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.fulmine.v1.GetVirtualTxsRequest = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, proto.fulmine.v1.GetVirtualTxsRequest.repeatedFields_, null);
};
goog.inherits(proto.fulmine.v1.GetVirtualTxsRequest, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.fulmine.v1.GetVirtualTxsRequest.displayName = 'proto.fulmine.v1.GetVirtualTxsRequest';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.fulmine.v1.GetVirtualTxsResponse = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, proto.fulmine.v1.GetVirtualTxsResponse.repeatedFields_, null);
};
goog.inherits(proto.fulmine.v1.GetVirtualTxsResponse, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.fulmine.v1.GetVirtualTxsResponse.displayName = 'proto.fulmine.v1.GetVirtualTxsResponse';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.fulmine.v1.GetVtxosRequest = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, proto.fulmine.v1.GetVtxosRequest.oneofGroups_);
};
goog.inherits(proto.fulmine.v1.GetVtxosRequest, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.fulmine.v1.GetVtxosRequest.displayName = 'proto.fulmine.v1.GetVtxosRequest';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.fulmine.v1.GetVtxosResponse = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, proto.fulmine.v1.GetVtxosResponse.repeatedFields_, null);
};
goog.inherits(proto.fulmine.v1.GetVtxosResponse, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.fulmine.v1.GetVtxosResponse.displayName = 'proto.fulmine.v1.GetVtxosResponse';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.fulmine.v1.NextSettlementRequest = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.fulmine.v1.NextSettlementRequest, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.fulmine.v1.NextSettlementRequest.displayName = 'proto.fulmine.v1.NextSettlementRequest';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.fulmine.v1.NextSettlementResponse = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.fulmine.v1.NextSettlementResponse, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.fulmine.v1.NextSettlementResponse.displayName = 'proto.fulmine.v1.NextSettlementResponse';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.fulmine.v1.CreateChainSwapRequest = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.fulmine.v1.CreateChainSwapRequest, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.fulmine.v1.CreateChainSwapRequest.displayName = 'proto.fulmine.v1.CreateChainSwapRequest';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.fulmine.v1.CreateChainSwapResponse = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.fulmine.v1.CreateChainSwapResponse, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.fulmine.v1.CreateChainSwapResponse.displayName = 'proto.fulmine.v1.CreateChainSwapResponse';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.fulmine.v1.ChainSwapResponse = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.fulmine.v1.ChainSwapResponse, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.fulmine.v1.ChainSwapResponse.displayName = 'proto.fulmine.v1.ChainSwapResponse';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.fulmine.v1.ListChainSwapsRequest = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, proto.fulmine.v1.ListChainSwapsRequest.repeatedFields_, null);
};
goog.inherits(proto.fulmine.v1.ListChainSwapsRequest, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.fulmine.v1.ListChainSwapsRequest.displayName = 'proto.fulmine.v1.ListChainSwapsRequest';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.fulmine.v1.ListChainSwapsResponse = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, proto.fulmine.v1.ListChainSwapsResponse.repeatedFields_, null);
};
goog.inherits(proto.fulmine.v1.ListChainSwapsResponse, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.fulmine.v1.ListChainSwapsResponse.displayName = 'proto.fulmine.v1.ListChainSwapsResponse';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.fulmine.v1.RefundChainSwapRequest = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.fulmine.v1.RefundChainSwapRequest, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.fulmine.v1.RefundChainSwapRequest.displayName = 'proto.fulmine.v1.RefundChainSwapRequest';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.fulmine.v1.RefundChainSwapResponse = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.fulmine.v1.RefundChainSwapResponse, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.fulmine.v1.RefundChainSwapResponse.displayName = 'proto.fulmine.v1.RefundChainSwapResponse';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.fulmine.v1.DelegateIntent = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, proto.fulmine.v1.DelegateIntent.repeatedFields_, null);
};
goog.inherits(proto.fulmine.v1.DelegateIntent, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.fulmine.v1.DelegateIntent.displayName = 'proto.fulmine.v1.DelegateIntent';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.fulmine.v1.DelegateForfeitTx = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.fulmine.v1.DelegateForfeitTx, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.fulmine.v1.DelegateForfeitTx.displayName = 'proto.fulmine.v1.DelegateForfeitTx';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.fulmine.v1.Delegate = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, proto.fulmine.v1.Delegate.repeatedFields_, null);
};
goog.inherits(proto.fulmine.v1.Delegate, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.fulmine.v1.Delegate.displayName = 'proto.fulmine.v1.Delegate';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.fulmine.v1.ListDelegatesRequest = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.fulmine.v1.ListDelegatesRequest, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.fulmine.v1.ListDelegatesRequest.displayName = 'proto.fulmine.v1.ListDelegatesRequest';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.fulmine.v1.ListDelegatesResponse = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, proto.fulmine.v1.ListDelegatesResponse.repeatedFields_, null);
};
goog.inherits(proto.fulmine.v1.ListDelegatesResponse, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.fulmine.v1.ListDelegatesResponse.displayName = 'proto.fulmine.v1.ListDelegatesResponse';
}



if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.fulmine.v1.GetAddressRequest.prototype.toObject = function(opt_includeInstance) {
  return proto.fulmine.v1.GetAddressRequest.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.fulmine.v1.GetAddressRequest} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.fulmine.v1.GetAddressRequest.toObject = function(includeInstance, msg) {
  var f, obj = {

  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.fulmine.v1.GetAddressRequest}
 */
proto.fulmine.v1.GetAddressRequest.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.fulmine.v1.GetAddressRequest;
  return proto.fulmine.v1.GetAddressRequest.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.fulmine.v1.GetAddressRequest} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.fulmine.v1.GetAddressRequest}
 */
proto.fulmine.v1.GetAddressRequest.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.fulmine.v1.GetAddressRequest.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.fulmine.v1.GetAddressRequest.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.fulmine.v1.GetAddressRequest} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.fulmine.v1.GetAddressRequest.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.fulmine.v1.GetAddressResponse.prototype.toObject = function(opt_includeInstance) {
  return proto.fulmine.v1.GetAddressResponse.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.fulmine.v1.GetAddressResponse} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.fulmine.v1.GetAddressResponse.toObject = function(includeInstance, msg) {
  var f, obj = {
    address: jspb.Message.getFieldWithDefault(msg, 1, ""),
    pubkey: jspb.Message.getFieldWithDefault(msg, 2, "")
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.fulmine.v1.GetAddressResponse}
 */
proto.fulmine.v1.GetAddressResponse.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.fulmine.v1.GetAddressResponse;
  return proto.fulmine.v1.GetAddressResponse.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.fulmine.v1.GetAddressResponse} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.fulmine.v1.GetAddressResponse}
 */
proto.fulmine.v1.GetAddressResponse.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setAddress(value);
      break;
    case 2:
      var value = /** @type {string} */ (reader.readString());
      msg.setPubkey(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.fulmine.v1.GetAddressResponse.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.fulmine.v1.GetAddressResponse.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.fulmine.v1.GetAddressResponse} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.fulmine.v1.GetAddressResponse.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getAddress();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
  f = message.getPubkey();
  if (f.length > 0) {
    writer.writeString(
      2,
      f
    );
  }
};


/**
 * optional string address = 1;
 * @return {string}
 */
proto.fulmine.v1.GetAddressResponse.prototype.getAddress = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.fulmine.v1.GetAddressResponse} returns this
 */
proto.fulmine.v1.GetAddressResponse.prototype.setAddress = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};


/**
 * optional string pubkey = 2;
 * @return {string}
 */
proto.fulmine.v1.GetAddressResponse.prototype.getPubkey = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 2, ""));
};


/**
 * @param {string} value
 * @return {!proto.fulmine.v1.GetAddressResponse} returns this
 */
proto.fulmine.v1.GetAddressResponse.prototype.setPubkey = function(value) {
  return jspb.Message.setProto3StringField(this, 2, value);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.fulmine.v1.GetBalanceRequest.prototype.toObject = function(opt_includeInstance) {
  return proto.fulmine.v1.GetBalanceRequest.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.fulmine.v1.GetBalanceRequest} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.fulmine.v1.GetBalanceRequest.toObject = function(includeInstance, msg) {
  var f, obj = {

  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.fulmine.v1.GetBalanceRequest}
 */
proto.fulmine.v1.GetBalanceRequest.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.fulmine.v1.GetBalanceRequest;
  return proto.fulmine.v1.GetBalanceRequest.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.fulmine.v1.GetBalanceRequest} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.fulmine.v1.GetBalanceRequest}
 */
proto.fulmine.v1.GetBalanceRequest.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.fulmine.v1.GetBalanceRequest.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.fulmine.v1.GetBalanceRequest.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.fulmine.v1.GetBalanceRequest} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.fulmine.v1.GetBalanceRequest.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.fulmine.v1.GetBalanceResponse.prototype.toObject = function(opt_includeInstance) {
  return proto.fulmine.v1.GetBalanceResponse.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.fulmine.v1.GetBalanceResponse} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.fulmine.v1.GetBalanceResponse.toObject = function(includeInstance, msg) {
  var f, obj = {
    amount: jspb.Message.getFieldWithDefault(msg, 1, 0)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.fulmine.v1.GetBalanceResponse}
 */
proto.fulmine.v1.GetBalanceResponse.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.fulmine.v1.GetBalanceResponse;
  return proto.fulmine.v1.GetBalanceResponse.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.fulmine.v1.GetBalanceResponse} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.fulmine.v1.GetBalanceResponse}
 */
proto.fulmine.v1.GetBalanceResponse.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {number} */ (reader.readUint64());
      msg.setAmount(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.fulmine.v1.GetBalanceResponse.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.fulmine.v1.GetBalanceResponse.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.fulmine.v1.GetBalanceResponse} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.fulmine.v1.GetBalanceResponse.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getAmount();
  if (f !== 0) {
    writer.writeUint64(
      1,
      f
    );
  }
};


/**
 * optional uint64 amount = 1;
 * @return {number}
 */
proto.fulmine.v1.GetBalanceResponse.prototype.getAmount = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 1, 0));
};


/**
 * @param {number} value
 * @return {!proto.fulmine.v1.GetBalanceResponse} returns this
 */
proto.fulmine.v1.GetBalanceResponse.prototype.setAmount = function(value) {
  return jspb.Message.setProto3IntField(this, 1, value);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.fulmine.v1.GetInfoRequest.prototype.toObject = function(opt_includeInstance) {
  return proto.fulmine.v1.GetInfoRequest.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.fulmine.v1.GetInfoRequest} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.fulmine.v1.GetInfoRequest.toObject = function(includeInstance, msg) {
  var f, obj = {

  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.fulmine.v1.GetInfoRequest}
 */
proto.fulmine.v1.GetInfoRequest.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.fulmine.v1.GetInfoRequest;
  return proto.fulmine.v1.GetInfoRequest.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.fulmine.v1.GetInfoRequest} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.fulmine.v1.GetInfoRequest}
 */
proto.fulmine.v1.GetInfoRequest.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.fulmine.v1.GetInfoRequest.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.fulmine.v1.GetInfoRequest.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.fulmine.v1.GetInfoRequest} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.fulmine.v1.GetInfoRequest.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.fulmine.v1.GetInfoResponse.prototype.toObject = function(opt_includeInstance) {
  return proto.fulmine.v1.GetInfoResponse.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.fulmine.v1.GetInfoResponse} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.fulmine.v1.GetInfoResponse.toObject = function(includeInstance, msg) {
  var f, obj = {
    network: jspb.Message.getFieldWithDefault(msg, 1, 0),
    addrPrefix: jspb.Message.getFieldWithDefault(msg, 2, ""),
    serverUrl: jspb.Message.getFieldWithDefault(msg, 3, ""),
    buildInfo: (f = msg.getBuildInfo()) && ark_types_pb.BuildInfo.toObject(includeInstance, f),
    pubkey: jspb.Message.getFieldWithDefault(msg, 5, ""),
    signerPubkey: jspb.Message.getFieldWithDefault(msg, 6, "")
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.fulmine.v1.GetInfoResponse}
 */
proto.fulmine.v1.GetInfoResponse.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.fulmine.v1.GetInfoResponse;
  return proto.fulmine.v1.GetInfoResponse.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.fulmine.v1.GetInfoResponse} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.fulmine.v1.GetInfoResponse}
 */
proto.fulmine.v1.GetInfoResponse.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {!proto.fulmine.v1.GetInfoResponse.Network} */ (reader.readEnum());
      msg.setNetwork(value);
      break;
    case 2:
      var value = /** @type {string} */ (reader.readString());
      msg.setAddrPrefix(value);
      break;
    case 3:
      var value = /** @type {string} */ (reader.readString());
      msg.setServerUrl(value);
      break;
    case 4:
      var value = new ark_types_pb.BuildInfo;
      reader.readMessage(value,ark_types_pb.BuildInfo.deserializeBinaryFromReader);
      msg.setBuildInfo(value);
      break;
    case 5:
      var value = /** @type {string} */ (reader.readString());
      msg.setPubkey(value);
      break;
    case 6:
      var value = /** @type {string} */ (reader.readString());
      msg.setSignerPubkey(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.fulmine.v1.GetInfoResponse.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.fulmine.v1.GetInfoResponse.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.fulmine.v1.GetInfoResponse} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.fulmine.v1.GetInfoResponse.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getNetwork();
  if (f !== 0.0) {
    writer.writeEnum(
      1,
      f
    );
  }
  f = message.getAddrPrefix();
  if (f.length > 0) {
    writer.writeString(
      2,
      f
    );
  }
  f = message.getServerUrl();
  if (f.length > 0) {
    writer.writeString(
      3,
      f
    );
  }
  f = message.getBuildInfo();
  if (f != null) {
    writer.writeMessage(
      4,
      f,
      ark_types_pb.BuildInfo.serializeBinaryToWriter
    );
  }
  f = message.getPubkey();
  if (f.length > 0) {
    writer.writeString(
      5,
      f
    );
  }
  f = message.getSignerPubkey();
  if (f.length > 0) {
    writer.writeString(
      6,
      f
    );
  }
};


/**
 * @enum {number}
 */
proto.fulmine.v1.GetInfoResponse.Network = {
  NETWORK_UNSPECIFIED: 0,
  NETWORK_MAINNET: 1,
  NETWORK_TESTNET: 2,
  NETWORK_REGTEST: 3
};

/**
 * optional Network network = 1;
 * @return {!proto.fulmine.v1.GetInfoResponse.Network}
 */
proto.fulmine.v1.GetInfoResponse.prototype.getNetwork = function() {
  return /** @type {!proto.fulmine.v1.GetInfoResponse.Network} */ (jspb.Message.getFieldWithDefault(this, 1, 0));
};


/**
 * @param {!proto.fulmine.v1.GetInfoResponse.Network} value
 * @return {!proto.fulmine.v1.GetInfoResponse} returns this
 */
proto.fulmine.v1.GetInfoResponse.prototype.setNetwork = function(value) {
  return jspb.Message.setProto3EnumField(this, 1, value);
};


/**
 * optional string addr_prefix = 2;
 * @return {string}
 */
proto.fulmine.v1.GetInfoResponse.prototype.getAddrPrefix = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 2, ""));
};


/**
 * @param {string} value
 * @return {!proto.fulmine.v1.GetInfoResponse} returns this
 */
proto.fulmine.v1.GetInfoResponse.prototype.setAddrPrefix = function(value) {
  return jspb.Message.setProto3StringField(this, 2, value);
};


/**
 * optional string server_url = 3;
 * @return {string}
 */
proto.fulmine.v1.GetInfoResponse.prototype.getServerUrl = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 3, ""));
};


/**
 * @param {string} value
 * @return {!proto.fulmine.v1.GetInfoResponse} returns this
 */
proto.fulmine.v1.GetInfoResponse.prototype.setServerUrl = function(value) {
  return jspb.Message.setProto3StringField(this, 3, value);
};


/**
 * optional BuildInfo build_info = 4;
 * @return {?proto.fulmine.v1.BuildInfo}
 */
proto.fulmine.v1.GetInfoResponse.prototype.getBuildInfo = function() {
  return /** @type{?proto.fulmine.v1.BuildInfo} */ (
    jspb.Message.getWrapperField(this, ark_types_pb.BuildInfo, 4));
};


/**
 * @param {?proto.fulmine.v1.BuildInfo|undefined} value
 * @return {!proto.fulmine.v1.GetInfoResponse} returns this
*/
proto.fulmine.v1.GetInfoResponse.prototype.setBuildInfo = function(value) {
  return jspb.Message.setWrapperField(this, 4, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.fulmine.v1.GetInfoResponse} returns this
 */
proto.fulmine.v1.GetInfoResponse.prototype.clearBuildInfo = function() {
  return this.setBuildInfo(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.fulmine.v1.GetInfoResponse.prototype.hasBuildInfo = function() {
  return jspb.Message.getField(this, 4) != null;
};


/**
 * optional string pubkey = 5;
 * @return {string}
 */
proto.fulmine.v1.GetInfoResponse.prototype.getPubkey = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 5, ""));
};


/**
 * @param {string} value
 * @return {!proto.fulmine.v1.GetInfoResponse} returns this
 */
proto.fulmine.v1.GetInfoResponse.prototype.setPubkey = function(value) {
  return jspb.Message.setProto3StringField(this, 5, value);
};


/**
 * optional string signer_pubkey = 6;
 * @return {string}
 */
proto.fulmine.v1.GetInfoResponse.prototype.getSignerPubkey = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 6, ""));
};


/**
 * @param {string} value
 * @return {!proto.fulmine.v1.GetInfoResponse} returns this
 */
proto.fulmine.v1.GetInfoResponse.prototype.setSignerPubkey = function(value) {
  return jspb.Message.setProto3StringField(this, 6, value);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.fulmine.v1.GetOnboardAddressRequest.prototype.toObject = function(opt_includeInstance) {
  return proto.fulmine.v1.GetOnboardAddressRequest.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.fulmine.v1.GetOnboardAddressRequest} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.fulmine.v1.GetOnboardAddressRequest.toObject = function(includeInstance, msg) {
  var f, obj = {
    amount: jspb.Message.getFieldWithDefault(msg, 1, 0)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.fulmine.v1.GetOnboardAddressRequest}
 */
proto.fulmine.v1.GetOnboardAddressRequest.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.fulmine.v1.GetOnboardAddressRequest;
  return proto.fulmine.v1.GetOnboardAddressRequest.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.fulmine.v1.GetOnboardAddressRequest} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.fulmine.v1.GetOnboardAddressRequest}
 */
proto.fulmine.v1.GetOnboardAddressRequest.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {number} */ (reader.readUint64());
      msg.setAmount(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.fulmine.v1.GetOnboardAddressRequest.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.fulmine.v1.GetOnboardAddressRequest.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.fulmine.v1.GetOnboardAddressRequest} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.fulmine.v1.GetOnboardAddressRequest.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getAmount();
  if (f !== 0) {
    writer.writeUint64(
      1,
      f
    );
  }
};


/**
 * optional uint64 amount = 1;
 * @return {number}
 */
proto.fulmine.v1.GetOnboardAddressRequest.prototype.getAmount = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 1, 0));
};


/**
 * @param {number} value
 * @return {!proto.fulmine.v1.GetOnboardAddressRequest} returns this
 */
proto.fulmine.v1.GetOnboardAddressRequest.prototype.setAmount = function(value) {
  return jspb.Message.setProto3IntField(this, 1, value);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.fulmine.v1.GetOnboardAddressResponse.prototype.toObject = function(opt_includeInstance) {
  return proto.fulmine.v1.GetOnboardAddressResponse.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.fulmine.v1.GetOnboardAddressResponse} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.fulmine.v1.GetOnboardAddressResponse.toObject = function(includeInstance, msg) {
  var f, obj = {
    address: jspb.Message.getFieldWithDefault(msg, 1, "")
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.fulmine.v1.GetOnboardAddressResponse}
 */
proto.fulmine.v1.GetOnboardAddressResponse.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.fulmine.v1.GetOnboardAddressResponse;
  return proto.fulmine.v1.GetOnboardAddressResponse.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.fulmine.v1.GetOnboardAddressResponse} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.fulmine.v1.GetOnboardAddressResponse}
 */
proto.fulmine.v1.GetOnboardAddressResponse.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setAddress(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.fulmine.v1.GetOnboardAddressResponse.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.fulmine.v1.GetOnboardAddressResponse.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.fulmine.v1.GetOnboardAddressResponse} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.fulmine.v1.GetOnboardAddressResponse.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getAddress();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
};


/**
 * optional string address = 1;
 * @return {string}
 */
proto.fulmine.v1.GetOnboardAddressResponse.prototype.getAddress = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.fulmine.v1.GetOnboardAddressResponse} returns this
 */
proto.fulmine.v1.GetOnboardAddressResponse.prototype.setAddress = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.fulmine.v1.GetRoundInfoRequest.prototype.toObject = function(opt_includeInstance) {
  return proto.fulmine.v1.GetRoundInfoRequest.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.fulmine.v1.GetRoundInfoRequest} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.fulmine.v1.GetRoundInfoRequest.toObject = function(includeInstance, msg) {
  var f, obj = {
    roundId: jspb.Message.getFieldWithDefault(msg, 1, "")
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.fulmine.v1.GetRoundInfoRequest}
 */
proto.fulmine.v1.GetRoundInfoRequest.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.fulmine.v1.GetRoundInfoRequest;
  return proto.fulmine.v1.GetRoundInfoRequest.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.fulmine.v1.GetRoundInfoRequest} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.fulmine.v1.GetRoundInfoRequest}
 */
proto.fulmine.v1.GetRoundInfoRequest.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setRoundId(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.fulmine.v1.GetRoundInfoRequest.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.fulmine.v1.GetRoundInfoRequest.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.fulmine.v1.GetRoundInfoRequest} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.fulmine.v1.GetRoundInfoRequest.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getRoundId();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
};


/**
 * optional string round_id = 1;
 * @return {string}
 */
proto.fulmine.v1.GetRoundInfoRequest.prototype.getRoundId = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.fulmine.v1.GetRoundInfoRequest} returns this
 */
proto.fulmine.v1.GetRoundInfoRequest.prototype.setRoundId = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.fulmine.v1.GetRoundInfoResponse.prototype.toObject = function(opt_includeInstance) {
  return proto.fulmine.v1.GetRoundInfoResponse.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.fulmine.v1.GetRoundInfoResponse} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.fulmine.v1.GetRoundInfoResponse.toObject = function(includeInstance, msg) {
  var f, obj = {
    round: (f = msg.getRound()) && ark_types_pb.Round.toObject(includeInstance, f)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.fulmine.v1.GetRoundInfoResponse}
 */
proto.fulmine.v1.GetRoundInfoResponse.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.fulmine.v1.GetRoundInfoResponse;
  return proto.fulmine.v1.GetRoundInfoResponse.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.fulmine.v1.GetRoundInfoResponse} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.fulmine.v1.GetRoundInfoResponse}
 */
proto.fulmine.v1.GetRoundInfoResponse.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = new ark_types_pb.Round;
      reader.readMessage(value,ark_types_pb.Round.deserializeBinaryFromReader);
      msg.setRound(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.fulmine.v1.GetRoundInfoResponse.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.fulmine.v1.GetRoundInfoResponse.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.fulmine.v1.GetRoundInfoResponse} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.fulmine.v1.GetRoundInfoResponse.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getRound();
  if (f != null) {
    writer.writeMessage(
      1,
      f,
      ark_types_pb.Round.serializeBinaryToWriter
    );
  }
};


/**
 * optional Round round = 1;
 * @return {?proto.fulmine.v1.Round}
 */
proto.fulmine.v1.GetRoundInfoResponse.prototype.getRound = function() {
  return /** @type{?proto.fulmine.v1.Round} */ (
    jspb.Message.getWrapperField(this, ark_types_pb.Round, 1));
};


/**
 * @param {?proto.fulmine.v1.Round|undefined} value
 * @return {!proto.fulmine.v1.GetRoundInfoResponse} returns this
*/
proto.fulmine.v1.GetRoundInfoResponse.prototype.setRound = function(value) {
  return jspb.Message.setWrapperField(this, 1, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.fulmine.v1.GetRoundInfoResponse} returns this
 */
proto.fulmine.v1.GetRoundInfoResponse.prototype.clearRound = function() {
  return this.setRound(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.fulmine.v1.GetRoundInfoResponse.prototype.hasRound = function() {
  return jspb.Message.getField(this, 1) != null;
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.fulmine.v1.GetTransactionHistoryRequest.prototype.toObject = function(opt_includeInstance) {
  return proto.fulmine.v1.GetTransactionHistoryRequest.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.fulmine.v1.GetTransactionHistoryRequest} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.fulmine.v1.GetTransactionHistoryRequest.toObject = function(includeInstance, msg) {
  var f, obj = {

  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.fulmine.v1.GetTransactionHistoryRequest}
 */
proto.fulmine.v1.GetTransactionHistoryRequest.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.fulmine.v1.GetTransactionHistoryRequest;
  return proto.fulmine.v1.GetTransactionHistoryRequest.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.fulmine.v1.GetTransactionHistoryRequest} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.fulmine.v1.GetTransactionHistoryRequest}
 */
proto.fulmine.v1.GetTransactionHistoryRequest.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.fulmine.v1.GetTransactionHistoryRequest.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.fulmine.v1.GetTransactionHistoryRequest.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.fulmine.v1.GetTransactionHistoryRequest} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.fulmine.v1.GetTransactionHistoryRequest.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
};



/**
 * List of repeated fields within this message type.
 * @private {!Array<number>}
 * @const
 */
proto.fulmine.v1.GetTransactionHistoryResponse.repeatedFields_ = [1];



if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.fulmine.v1.GetTransactionHistoryResponse.prototype.toObject = function(opt_includeInstance) {
  return proto.fulmine.v1.GetTransactionHistoryResponse.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.fulmine.v1.GetTransactionHistoryResponse} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.fulmine.v1.GetTransactionHistoryResponse.toObject = function(includeInstance, msg) {
  var f, obj = {
    transactionsList: jspb.Message.toObjectList(msg.getTransactionsList(),
    ark_types_pb.TransactionInfo.toObject, includeInstance)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.fulmine.v1.GetTransactionHistoryResponse}
 */
proto.fulmine.v1.GetTransactionHistoryResponse.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.fulmine.v1.GetTransactionHistoryResponse;
  return proto.fulmine.v1.GetTransactionHistoryResponse.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.fulmine.v1.GetTransactionHistoryResponse} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.fulmine.v1.GetTransactionHistoryResponse}
 */
proto.fulmine.v1.GetTransactionHistoryResponse.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = new ark_types_pb.TransactionInfo;
      reader.readMessage(value,ark_types_pb.TransactionInfo.deserializeBinaryFromReader);
      msg.addTransactions(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.fulmine.v1.GetTransactionHistoryResponse.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.fulmine.v1.GetTransactionHistoryResponse.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.fulmine.v1.GetTransactionHistoryResponse} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.fulmine.v1.GetTransactionHistoryResponse.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getTransactionsList();
  if (f.length > 0) {
    writer.writeRepeatedMessage(
      1,
      f,
      ark_types_pb.TransactionInfo.serializeBinaryToWriter
    );
  }
};


/**
 * repeated TransactionInfo transactions = 1;
 * @return {!Array<!proto.fulmine.v1.TransactionInfo>}
 */
proto.fulmine.v1.GetTransactionHistoryResponse.prototype.getTransactionsList = function() {
  return /** @type{!Array<!proto.fulmine.v1.TransactionInfo>} */ (
    jspb.Message.getRepeatedWrapperField(this, ark_types_pb.TransactionInfo, 1));
};


/**
 * @param {!Array<!proto.fulmine.v1.TransactionInfo>} value
 * @return {!proto.fulmine.v1.GetTransactionHistoryResponse} returns this
*/
proto.fulmine.v1.GetTransactionHistoryResponse.prototype.setTransactionsList = function(value) {
  return jspb.Message.setRepeatedWrapperField(this, 1, value);
};


/**
 * @param {!proto.fulmine.v1.TransactionInfo=} opt_value
 * @param {number=} opt_index
 * @return {!proto.fulmine.v1.TransactionInfo}
 */
proto.fulmine.v1.GetTransactionHistoryResponse.prototype.addTransactions = function(opt_value, opt_index) {
  return jspb.Message.addToRepeatedWrapperField(this, 1, opt_value, proto.fulmine.v1.TransactionInfo, opt_index);
};


/**
 * Clears the list making it empty but non-null.
 * @return {!proto.fulmine.v1.GetTransactionHistoryResponse} returns this
 */
proto.fulmine.v1.GetTransactionHistoryResponse.prototype.clearTransactionsList = function() {
  return this.setTransactionsList([]);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.fulmine.v1.RedeemNoteRequest.prototype.toObject = function(opt_includeInstance) {
  return proto.fulmine.v1.RedeemNoteRequest.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.fulmine.v1.RedeemNoteRequest} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.fulmine.v1.RedeemNoteRequest.toObject = function(includeInstance, msg) {
  var f, obj = {
    note: jspb.Message.getFieldWithDefault(msg, 1, "")
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.fulmine.v1.RedeemNoteRequest}
 */
proto.fulmine.v1.RedeemNoteRequest.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.fulmine.v1.RedeemNoteRequest;
  return proto.fulmine.v1.RedeemNoteRequest.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.fulmine.v1.RedeemNoteRequest} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.fulmine.v1.RedeemNoteRequest}
 */
proto.fulmine.v1.RedeemNoteRequest.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setNote(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.fulmine.v1.RedeemNoteRequest.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.fulmine.v1.RedeemNoteRequest.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.fulmine.v1.RedeemNoteRequest} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.fulmine.v1.RedeemNoteRequest.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getNote();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
};


/**
 * optional string note = 1;
 * @return {string}
 */
proto.fulmine.v1.RedeemNoteRequest.prototype.getNote = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.fulmine.v1.RedeemNoteRequest} returns this
 */
proto.fulmine.v1.RedeemNoteRequest.prototype.setNote = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.fulmine.v1.RedeemNoteResponse.prototype.toObject = function(opt_includeInstance) {
  return proto.fulmine.v1.RedeemNoteResponse.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.fulmine.v1.RedeemNoteResponse} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.fulmine.v1.RedeemNoteResponse.toObject = function(includeInstance, msg) {
  var f, obj = {
    txid: jspb.Message.getFieldWithDefault(msg, 1, "")
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.fulmine.v1.RedeemNoteResponse}
 */
proto.fulmine.v1.RedeemNoteResponse.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.fulmine.v1.RedeemNoteResponse;
  return proto.fulmine.v1.RedeemNoteResponse.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.fulmine.v1.RedeemNoteResponse} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.fulmine.v1.RedeemNoteResponse}
 */
proto.fulmine.v1.RedeemNoteResponse.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setTxid(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.fulmine.v1.RedeemNoteResponse.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.fulmine.v1.RedeemNoteResponse.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.fulmine.v1.RedeemNoteResponse} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.fulmine.v1.RedeemNoteResponse.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getTxid();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
};


/**
 * optional string txid = 1;
 * @return {string}
 */
proto.fulmine.v1.RedeemNoteResponse.prototype.getTxid = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.fulmine.v1.RedeemNoteResponse} returns this
 */
proto.fulmine.v1.RedeemNoteResponse.prototype.setTxid = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.fulmine.v1.SettleRequest.prototype.toObject = function(opt_includeInstance) {
  return proto.fulmine.v1.SettleRequest.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.fulmine.v1.SettleRequest} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.fulmine.v1.SettleRequest.toObject = function(includeInstance, msg) {
  var f, obj = {

  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.fulmine.v1.SettleRequest}
 */
proto.fulmine.v1.SettleRequest.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.fulmine.v1.SettleRequest;
  return proto.fulmine.v1.SettleRequest.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.fulmine.v1.SettleRequest} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.fulmine.v1.SettleRequest}
 */
proto.fulmine.v1.SettleRequest.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.fulmine.v1.SettleRequest.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.fulmine.v1.SettleRequest.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.fulmine.v1.SettleRequest} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.fulmine.v1.SettleRequest.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.fulmine.v1.SettleResponse.prototype.toObject = function(opt_includeInstance) {
  return proto.fulmine.v1.SettleResponse.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.fulmine.v1.SettleResponse} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.fulmine.v1.SettleResponse.toObject = function(includeInstance, msg) {
  var f, obj = {
    txid: jspb.Message.getFieldWithDefault(msg, 1, "")
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.fulmine.v1.SettleResponse}
 */
proto.fulmine.v1.SettleResponse.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.fulmine.v1.SettleResponse;
  return proto.fulmine.v1.SettleResponse.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.fulmine.v1.SettleResponse} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.fulmine.v1.SettleResponse}
 */
proto.fulmine.v1.SettleResponse.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setTxid(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.fulmine.v1.SettleResponse.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.fulmine.v1.SettleResponse.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.fulmine.v1.SettleResponse} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.fulmine.v1.SettleResponse.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getTxid();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
};


/**
 * optional string txid = 1;
 * @return {string}
 */
proto.fulmine.v1.SettleResponse.prototype.getTxid = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.fulmine.v1.SettleResponse} returns this
 */
proto.fulmine.v1.SettleResponse.prototype.setTxid = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.fulmine.v1.SendOffChainRequest.prototype.toObject = function(opt_includeInstance) {
  return proto.fulmine.v1.SendOffChainRequest.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.fulmine.v1.SendOffChainRequest} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.fulmine.v1.SendOffChainRequest.toObject = function(includeInstance, msg) {
  var f, obj = {
    address: jspb.Message.getFieldWithDefault(msg, 1, ""),
    amount: jspb.Message.getFieldWithDefault(msg, 2, 0)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.fulmine.v1.SendOffChainRequest}
 */
proto.fulmine.v1.SendOffChainRequest.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.fulmine.v1.SendOffChainRequest;
  return proto.fulmine.v1.SendOffChainRequest.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.fulmine.v1.SendOffChainRequest} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.fulmine.v1.SendOffChainRequest}
 */
proto.fulmine.v1.SendOffChainRequest.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setAddress(value);
      break;
    case 2:
      var value = /** @type {number} */ (reader.readUint64());
      msg.setAmount(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.fulmine.v1.SendOffChainRequest.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.fulmine.v1.SendOffChainRequest.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.fulmine.v1.SendOffChainRequest} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.fulmine.v1.SendOffChainRequest.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getAddress();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
  f = message.getAmount();
  if (f !== 0) {
    writer.writeUint64(
      2,
      f
    );
  }
};


/**
 * optional string address = 1;
 * @return {string}
 */
proto.fulmine.v1.SendOffChainRequest.prototype.getAddress = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.fulmine.v1.SendOffChainRequest} returns this
 */
proto.fulmine.v1.SendOffChainRequest.prototype.setAddress = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};


/**
 * optional uint64 amount = 2;
 * @return {number}
 */
proto.fulmine.v1.SendOffChainRequest.prototype.getAmount = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 2, 0));
};


/**
 * @param {number} value
 * @return {!proto.fulmine.v1.SendOffChainRequest} returns this
 */
proto.fulmine.v1.SendOffChainRequest.prototype.setAmount = function(value) {
  return jspb.Message.setProto3IntField(this, 2, value);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.fulmine.v1.SendOffChainResponse.prototype.toObject = function(opt_includeInstance) {
  return proto.fulmine.v1.SendOffChainResponse.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.fulmine.v1.SendOffChainResponse} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.fulmine.v1.SendOffChainResponse.toObject = function(includeInstance, msg) {
  var f, obj = {
    txid: jspb.Message.getFieldWithDefault(msg, 1, "")
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.fulmine.v1.SendOffChainResponse}
 */
proto.fulmine.v1.SendOffChainResponse.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.fulmine.v1.SendOffChainResponse;
  return proto.fulmine.v1.SendOffChainResponse.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.fulmine.v1.SendOffChainResponse} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.fulmine.v1.SendOffChainResponse}
 */
proto.fulmine.v1.SendOffChainResponse.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setTxid(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.fulmine.v1.SendOffChainResponse.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.fulmine.v1.SendOffChainResponse.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.fulmine.v1.SendOffChainResponse} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.fulmine.v1.SendOffChainResponse.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getTxid();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
};


/**
 * optional string txid = 1;
 * @return {string}
 */
proto.fulmine.v1.SendOffChainResponse.prototype.getTxid = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.fulmine.v1.SendOffChainResponse} returns this
 */
proto.fulmine.v1.SendOffChainResponse.prototype.setTxid = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.fulmine.v1.SendOnChainRequest.prototype.toObject = function(opt_includeInstance) {
  return proto.fulmine.v1.SendOnChainRequest.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.fulmine.v1.SendOnChainRequest} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.fulmine.v1.SendOnChainRequest.toObject = function(includeInstance, msg) {
  var f, obj = {
    address: jspb.Message.getFieldWithDefault(msg, 1, ""),
    amount: jspb.Message.getFieldWithDefault(msg, 2, 0)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.fulmine.v1.SendOnChainRequest}
 */
proto.fulmine.v1.SendOnChainRequest.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.fulmine.v1.SendOnChainRequest;
  return proto.fulmine.v1.SendOnChainRequest.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.fulmine.v1.SendOnChainRequest} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.fulmine.v1.SendOnChainRequest}
 */
proto.fulmine.v1.SendOnChainRequest.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setAddress(value);
      break;
    case 2:
      var value = /** @type {number} */ (reader.readUint64());
      msg.setAmount(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.fulmine.v1.SendOnChainRequest.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.fulmine.v1.SendOnChainRequest.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.fulmine.v1.SendOnChainRequest} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.fulmine.v1.SendOnChainRequest.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getAddress();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
  f = message.getAmount();
  if (f !== 0) {
    writer.writeUint64(
      2,
      f
    );
  }
};


/**
 * optional string address = 1;
 * @return {string}
 */
proto.fulmine.v1.SendOnChainRequest.prototype.getAddress = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.fulmine.v1.SendOnChainRequest} returns this
 */
proto.fulmine.v1.SendOnChainRequest.prototype.setAddress = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};


/**
 * optional uint64 amount = 2;
 * @return {number}
 */
proto.fulmine.v1.SendOnChainRequest.prototype.getAmount = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 2, 0));
};


/**
 * @param {number} value
 * @return {!proto.fulmine.v1.SendOnChainRequest} returns this
 */
proto.fulmine.v1.SendOnChainRequest.prototype.setAmount = function(value) {
  return jspb.Message.setProto3IntField(this, 2, value);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.fulmine.v1.SendOnChainResponse.prototype.toObject = function(opt_includeInstance) {
  return proto.fulmine.v1.SendOnChainResponse.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.fulmine.v1.SendOnChainResponse} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.fulmine.v1.SendOnChainResponse.toObject = function(includeInstance, msg) {
  var f, obj = {
    txid: jspb.Message.getFieldWithDefault(msg, 1, "")
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.fulmine.v1.SendOnChainResponse}
 */
proto.fulmine.v1.SendOnChainResponse.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.fulmine.v1.SendOnChainResponse;
  return proto.fulmine.v1.SendOnChainResponse.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.fulmine.v1.SendOnChainResponse} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.fulmine.v1.SendOnChainResponse}
 */
proto.fulmine.v1.SendOnChainResponse.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setTxid(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.fulmine.v1.SendOnChainResponse.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.fulmine.v1.SendOnChainResponse.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.fulmine.v1.SendOnChainResponse} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.fulmine.v1.SendOnChainResponse.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getTxid();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
};


/**
 * optional string txid = 1;
 * @return {string}
 */
proto.fulmine.v1.SendOnChainResponse.prototype.getTxid = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.fulmine.v1.SendOnChainResponse} returns this
 */
proto.fulmine.v1.SendOnChainResponse.prototype.setTxid = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.fulmine.v1.SignTransactionRequest.prototype.toObject = function(opt_includeInstance) {
  return proto.fulmine.v1.SignTransactionRequest.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.fulmine.v1.SignTransactionRequest} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.fulmine.v1.SignTransactionRequest.toObject = function(includeInstance, msg) {
  var f, obj = {
    tx: jspb.Message.getFieldWithDefault(msg, 1, "")
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.fulmine.v1.SignTransactionRequest}
 */
proto.fulmine.v1.SignTransactionRequest.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.fulmine.v1.SignTransactionRequest;
  return proto.fulmine.v1.SignTransactionRequest.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.fulmine.v1.SignTransactionRequest} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.fulmine.v1.SignTransactionRequest}
 */
proto.fulmine.v1.SignTransactionRequest.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setTx(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.fulmine.v1.SignTransactionRequest.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.fulmine.v1.SignTransactionRequest.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.fulmine.v1.SignTransactionRequest} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.fulmine.v1.SignTransactionRequest.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getTx();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
};


/**
 * optional string tx = 1;
 * @return {string}
 */
proto.fulmine.v1.SignTransactionRequest.prototype.getTx = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.fulmine.v1.SignTransactionRequest} returns this
 */
proto.fulmine.v1.SignTransactionRequest.prototype.setTx = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.fulmine.v1.SignTransactionResponse.prototype.toObject = function(opt_includeInstance) {
  return proto.fulmine.v1.SignTransactionResponse.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.fulmine.v1.SignTransactionResponse} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.fulmine.v1.SignTransactionResponse.toObject = function(includeInstance, msg) {
  var f, obj = {
    signedTx: jspb.Message.getFieldWithDefault(msg, 1, "")
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.fulmine.v1.SignTransactionResponse}
 */
proto.fulmine.v1.SignTransactionResponse.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.fulmine.v1.SignTransactionResponse;
  return proto.fulmine.v1.SignTransactionResponse.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.fulmine.v1.SignTransactionResponse} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.fulmine.v1.SignTransactionResponse}
 */
proto.fulmine.v1.SignTransactionResponse.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setSignedTx(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.fulmine.v1.SignTransactionResponse.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.fulmine.v1.SignTransactionResponse.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.fulmine.v1.SignTransactionResponse} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.fulmine.v1.SignTransactionResponse.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getSignedTx();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
};


/**
 * optional string signed_tx = 1;
 * @return {string}
 */
proto.fulmine.v1.SignTransactionResponse.prototype.getSignedTx = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.fulmine.v1.SignTransactionResponse} returns this
 */
proto.fulmine.v1.SignTransactionResponse.prototype.setSignedTx = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.fulmine.v1.CreateVHTLCRequest.prototype.toObject = function(opt_includeInstance) {
  return proto.fulmine.v1.CreateVHTLCRequest.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.fulmine.v1.CreateVHTLCRequest} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.fulmine.v1.CreateVHTLCRequest.toObject = function(includeInstance, msg) {
  var f, obj = {
    preimageHash: jspb.Message.getFieldWithDefault(msg, 1, ""),
    senderPubkey: jspb.Message.getFieldWithDefault(msg, 2, ""),
    receiverPubkey: jspb.Message.getFieldWithDefault(msg, 3, ""),
    refundLocktime: jspb.Message.getFieldWithDefault(msg, 4, 0),
    unilateralClaimDelay: (f = msg.getUnilateralClaimDelay()) && proto.fulmine.v1.RelativeLocktime.toObject(includeInstance, f),
    unilateralRefundDelay: (f = msg.getUnilateralRefundDelay()) && proto.fulmine.v1.RelativeLocktime.toObject(includeInstance, f),
    unilateralRefundWithoutReceiverDelay: (f = msg.getUnilateralRefundWithoutReceiverDelay()) && proto.fulmine.v1.RelativeLocktime.toObject(includeInstance, f)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.fulmine.v1.CreateVHTLCRequest}
 */
proto.fulmine.v1.CreateVHTLCRequest.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.fulmine.v1.CreateVHTLCRequest;
  return proto.fulmine.v1.CreateVHTLCRequest.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.fulmine.v1.CreateVHTLCRequest} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.fulmine.v1.CreateVHTLCRequest}
 */
proto.fulmine.v1.CreateVHTLCRequest.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setPreimageHash(value);
      break;
    case 2:
      var value = /** @type {string} */ (reader.readString());
      msg.setSenderPubkey(value);
      break;
    case 3:
      var value = /** @type {string} */ (reader.readString());
      msg.setReceiverPubkey(value);
      break;
    case 4:
      var value = /** @type {number} */ (reader.readUint32());
      msg.setRefundLocktime(value);
      break;
    case 5:
      var value = new proto.fulmine.v1.RelativeLocktime;
      reader.readMessage(value,proto.fulmine.v1.RelativeLocktime.deserializeBinaryFromReader);
      msg.setUnilateralClaimDelay(value);
      break;
    case 6:
      var value = new proto.fulmine.v1.RelativeLocktime;
      reader.readMessage(value,proto.fulmine.v1.RelativeLocktime.deserializeBinaryFromReader);
      msg.setUnilateralRefundDelay(value);
      break;
    case 7:
      var value = new proto.fulmine.v1.RelativeLocktime;
      reader.readMessage(value,proto.fulmine.v1.RelativeLocktime.deserializeBinaryFromReader);
      msg.setUnilateralRefundWithoutReceiverDelay(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.fulmine.v1.CreateVHTLCRequest.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.fulmine.v1.CreateVHTLCRequest.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.fulmine.v1.CreateVHTLCRequest} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.fulmine.v1.CreateVHTLCRequest.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getPreimageHash();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
  f = message.getSenderPubkey();
  if (f.length > 0) {
    writer.writeString(
      2,
      f
    );
  }
  f = message.getReceiverPubkey();
  if (f.length > 0) {
    writer.writeString(
      3,
      f
    );
  }
  f = message.getRefundLocktime();
  if (f !== 0) {
    writer.writeUint32(
      4,
      f
    );
  }
  f = message.getUnilateralClaimDelay();
  if (f != null) {
    writer.writeMessage(
      5,
      f,
      proto.fulmine.v1.RelativeLocktime.serializeBinaryToWriter
    );
  }
  f = message.getUnilateralRefundDelay();
  if (f != null) {
    writer.writeMessage(
      6,
      f,
      proto.fulmine.v1.RelativeLocktime.serializeBinaryToWriter
    );
  }
  f = message.getUnilateralRefundWithoutReceiverDelay();
  if (f != null) {
    writer.writeMessage(
      7,
      f,
      proto.fulmine.v1.RelativeLocktime.serializeBinaryToWriter
    );
  }
};


/**
 * optional string preimage_hash = 1;
 * @return {string}
 */
proto.fulmine.v1.CreateVHTLCRequest.prototype.getPreimageHash = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.fulmine.v1.CreateVHTLCRequest} returns this
 */
proto.fulmine.v1.CreateVHTLCRequest.prototype.setPreimageHash = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};


/**
 * optional string sender_pubkey = 2;
 * @return {string}
 */
proto.fulmine.v1.CreateVHTLCRequest.prototype.getSenderPubkey = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 2, ""));
};


/**
 * @param {string} value
 * @return {!proto.fulmine.v1.CreateVHTLCRequest} returns this
 */
proto.fulmine.v1.CreateVHTLCRequest.prototype.setSenderPubkey = function(value) {
  return jspb.Message.setProto3StringField(this, 2, value);
};


/**
 * optional string receiver_pubkey = 3;
 * @return {string}
 */
proto.fulmine.v1.CreateVHTLCRequest.prototype.getReceiverPubkey = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 3, ""));
};


/**
 * @param {string} value
 * @return {!proto.fulmine.v1.CreateVHTLCRequest} returns this
 */
proto.fulmine.v1.CreateVHTLCRequest.prototype.setReceiverPubkey = function(value) {
  return jspb.Message.setProto3StringField(this, 3, value);
};


/**
 * optional uint32 refund_locktime = 4;
 * @return {number}
 */
proto.fulmine.v1.CreateVHTLCRequest.prototype.getRefundLocktime = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 4, 0));
};


/**
 * @param {number} value
 * @return {!proto.fulmine.v1.CreateVHTLCRequest} returns this
 */
proto.fulmine.v1.CreateVHTLCRequest.prototype.setRefundLocktime = function(value) {
  return jspb.Message.setProto3IntField(this, 4, value);
};


/**
 * optional RelativeLocktime unilateral_claim_delay = 5;
 * @return {?proto.fulmine.v1.RelativeLocktime}
 */
proto.fulmine.v1.CreateVHTLCRequest.prototype.getUnilateralClaimDelay = function() {
  return /** @type{?proto.fulmine.v1.RelativeLocktime} */ (
    jspb.Message.getWrapperField(this, proto.fulmine.v1.RelativeLocktime, 5));
};


/**
 * @param {?proto.fulmine.v1.RelativeLocktime|undefined} value
 * @return {!proto.fulmine.v1.CreateVHTLCRequest} returns this
*/
proto.fulmine.v1.CreateVHTLCRequest.prototype.setUnilateralClaimDelay = function(value) {
  return jspb.Message.setWrapperField(this, 5, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.fulmine.v1.CreateVHTLCRequest} returns this
 */
proto.fulmine.v1.CreateVHTLCRequest.prototype.clearUnilateralClaimDelay = function() {
  return this.setUnilateralClaimDelay(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.fulmine.v1.CreateVHTLCRequest.prototype.hasUnilateralClaimDelay = function() {
  return jspb.Message.getField(this, 5) != null;
};


/**
 * optional RelativeLocktime unilateral_refund_delay = 6;
 * @return {?proto.fulmine.v1.RelativeLocktime}
 */
proto.fulmine.v1.CreateVHTLCRequest.prototype.getUnilateralRefundDelay = function() {
  return /** @type{?proto.fulmine.v1.RelativeLocktime} */ (
    jspb.Message.getWrapperField(this, proto.fulmine.v1.RelativeLocktime, 6));
};


/**
 * @param {?proto.fulmine.v1.RelativeLocktime|undefined} value
 * @return {!proto.fulmine.v1.CreateVHTLCRequest} returns this
*/
proto.fulmine.v1.CreateVHTLCRequest.prototype.setUnilateralRefundDelay = function(value) {
  return jspb.Message.setWrapperField(this, 6, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.fulmine.v1.CreateVHTLCRequest} returns this
 */
proto.fulmine.v1.CreateVHTLCRequest.prototype.clearUnilateralRefundDelay = function() {
  return this.setUnilateralRefundDelay(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.fulmine.v1.CreateVHTLCRequest.prototype.hasUnilateralRefundDelay = function() {
  return jspb.Message.getField(this, 6) != null;
};


/**
 * optional RelativeLocktime unilateral_refund_without_receiver_delay = 7;
 * @return {?proto.fulmine.v1.RelativeLocktime}
 */
proto.fulmine.v1.CreateVHTLCRequest.prototype.getUnilateralRefundWithoutReceiverDelay = function() {
  return /** @type{?proto.fulmine.v1.RelativeLocktime} */ (
    jspb.Message.getWrapperField(this, proto.fulmine.v1.RelativeLocktime, 7));
};


/**
 * @param {?proto.fulmine.v1.RelativeLocktime|undefined} value
 * @return {!proto.fulmine.v1.CreateVHTLCRequest} returns this
*/
proto.fulmine.v1.CreateVHTLCRequest.prototype.setUnilateralRefundWithoutReceiverDelay = function(value) {
  return jspb.Message.setWrapperField(this, 7, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.fulmine.v1.CreateVHTLCRequest} returns this
 */
proto.fulmine.v1.CreateVHTLCRequest.prototype.clearUnilateralRefundWithoutReceiverDelay = function() {
  return this.setUnilateralRefundWithoutReceiverDelay(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.fulmine.v1.CreateVHTLCRequest.prototype.hasUnilateralRefundWithoutReceiverDelay = function() {
  return jspb.Message.getField(this, 7) != null;
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.fulmine.v1.CreateVHTLCResponse.prototype.toObject = function(opt_includeInstance) {
  return proto.fulmine.v1.CreateVHTLCResponse.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.fulmine.v1.CreateVHTLCResponse} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.fulmine.v1.CreateVHTLCResponse.toObject = function(includeInstance, msg) {
  var f, obj = {
    id: jspb.Message.getFieldWithDefault(msg, 1, ""),
    address: jspb.Message.getFieldWithDefault(msg, 2, ""),
    claimPubkey: jspb.Message.getFieldWithDefault(msg, 3, ""),
    refundPubkey: jspb.Message.getFieldWithDefault(msg, 4, ""),
    serverPubkey: jspb.Message.getFieldWithDefault(msg, 5, ""),
    swapTree: (f = msg.getSwapTree()) && proto.fulmine.v1.TaprootTree.toObject(includeInstance, f),
    refundLocktime: jspb.Message.getFieldWithDefault(msg, 7, 0),
    unilateralClaimDelay: jspb.Message.getFieldWithDefault(msg, 8, 0),
    unilateralRefundDelay: jspb.Message.getFieldWithDefault(msg, 9, 0),
    unilateralRefundWithoutReceiverDelay: jspb.Message.getFieldWithDefault(msg, 10, 0)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.fulmine.v1.CreateVHTLCResponse}
 */
proto.fulmine.v1.CreateVHTLCResponse.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.fulmine.v1.CreateVHTLCResponse;
  return proto.fulmine.v1.CreateVHTLCResponse.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.fulmine.v1.CreateVHTLCResponse} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.fulmine.v1.CreateVHTLCResponse}
 */
proto.fulmine.v1.CreateVHTLCResponse.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setId(value);
      break;
    case 2:
      var value = /** @type {string} */ (reader.readString());
      msg.setAddress(value);
      break;
    case 3:
      var value = /** @type {string} */ (reader.readString());
      msg.setClaimPubkey(value);
      break;
    case 4:
      var value = /** @type {string} */ (reader.readString());
      msg.setRefundPubkey(value);
      break;
    case 5:
      var value = /** @type {string} */ (reader.readString());
      msg.setServerPubkey(value);
      break;
    case 6:
      var value = new proto.fulmine.v1.TaprootTree;
      reader.readMessage(value,proto.fulmine.v1.TaprootTree.deserializeBinaryFromReader);
      msg.setSwapTree(value);
      break;
    case 7:
      var value = /** @type {number} */ (reader.readInt64());
      msg.setRefundLocktime(value);
      break;
    case 8:
      var value = /** @type {number} */ (reader.readInt64());
      msg.setUnilateralClaimDelay(value);
      break;
    case 9:
      var value = /** @type {number} */ (reader.readInt64());
      msg.setUnilateralRefundDelay(value);
      break;
    case 10:
      var value = /** @type {number} */ (reader.readInt64());
      msg.setUnilateralRefundWithoutReceiverDelay(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.fulmine.v1.CreateVHTLCResponse.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.fulmine.v1.CreateVHTLCResponse.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.fulmine.v1.CreateVHTLCResponse} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.fulmine.v1.CreateVHTLCResponse.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getId();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
  f = message.getAddress();
  if (f.length > 0) {
    writer.writeString(
      2,
      f
    );
  }
  f = message.getClaimPubkey();
  if (f.length > 0) {
    writer.writeString(
      3,
      f
    );
  }
  f = message.getRefundPubkey();
  if (f.length > 0) {
    writer.writeString(
      4,
      f
    );
  }
  f = message.getServerPubkey();
  if (f.length > 0) {
    writer.writeString(
      5,
      f
    );
  }
  f = message.getSwapTree();
  if (f != null) {
    writer.writeMessage(
      6,
      f,
      proto.fulmine.v1.TaprootTree.serializeBinaryToWriter
    );
  }
  f = message.getRefundLocktime();
  if (f !== 0) {
    writer.writeInt64(
      7,
      f
    );
  }
  f = message.getUnilateralClaimDelay();
  if (f !== 0) {
    writer.writeInt64(
      8,
      f
    );
  }
  f = message.getUnilateralRefundDelay();
  if (f !== 0) {
    writer.writeInt64(
      9,
      f
    );
  }
  f = message.getUnilateralRefundWithoutReceiverDelay();
  if (f !== 0) {
    writer.writeInt64(
      10,
      f
    );
  }
};


/**
 * optional string id = 1;
 * @return {string}
 */
proto.fulmine.v1.CreateVHTLCResponse.prototype.getId = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.fulmine.v1.CreateVHTLCResponse} returns this
 */
proto.fulmine.v1.CreateVHTLCResponse.prototype.setId = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};


/**
 * optional string address = 2;
 * @return {string}
 */
proto.fulmine.v1.CreateVHTLCResponse.prototype.getAddress = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 2, ""));
};


/**
 * @param {string} value
 * @return {!proto.fulmine.v1.CreateVHTLCResponse} returns this
 */
proto.fulmine.v1.CreateVHTLCResponse.prototype.setAddress = function(value) {
  return jspb.Message.setProto3StringField(this, 2, value);
};


/**
 * optional string claim_pubkey = 3;
 * @return {string}
 */
proto.fulmine.v1.CreateVHTLCResponse.prototype.getClaimPubkey = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 3, ""));
};


/**
 * @param {string} value
 * @return {!proto.fulmine.v1.CreateVHTLCResponse} returns this
 */
proto.fulmine.v1.CreateVHTLCResponse.prototype.setClaimPubkey = function(value) {
  return jspb.Message.setProto3StringField(this, 3, value);
};


/**
 * optional string refund_pubkey = 4;
 * @return {string}
 */
proto.fulmine.v1.CreateVHTLCResponse.prototype.getRefundPubkey = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 4, ""));
};


/**
 * @param {string} value
 * @return {!proto.fulmine.v1.CreateVHTLCResponse} returns this
 */
proto.fulmine.v1.CreateVHTLCResponse.prototype.setRefundPubkey = function(value) {
  return jspb.Message.setProto3StringField(this, 4, value);
};


/**
 * optional string server_pubkey = 5;
 * @return {string}
 */
proto.fulmine.v1.CreateVHTLCResponse.prototype.getServerPubkey = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 5, ""));
};


/**
 * @param {string} value
 * @return {!proto.fulmine.v1.CreateVHTLCResponse} returns this
 */
proto.fulmine.v1.CreateVHTLCResponse.prototype.setServerPubkey = function(value) {
  return jspb.Message.setProto3StringField(this, 5, value);
};


/**
 * optional TaprootTree swap_tree = 6;
 * @return {?proto.fulmine.v1.TaprootTree}
 */
proto.fulmine.v1.CreateVHTLCResponse.prototype.getSwapTree = function() {
  return /** @type{?proto.fulmine.v1.TaprootTree} */ (
    jspb.Message.getWrapperField(this, proto.fulmine.v1.TaprootTree, 6));
};


/**
 * @param {?proto.fulmine.v1.TaprootTree|undefined} value
 * @return {!proto.fulmine.v1.CreateVHTLCResponse} returns this
*/
proto.fulmine.v1.CreateVHTLCResponse.prototype.setSwapTree = function(value) {
  return jspb.Message.setWrapperField(this, 6, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.fulmine.v1.CreateVHTLCResponse} returns this
 */
proto.fulmine.v1.CreateVHTLCResponse.prototype.clearSwapTree = function() {
  return this.setSwapTree(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.fulmine.v1.CreateVHTLCResponse.prototype.hasSwapTree = function() {
  return jspb.Message.getField(this, 6) != null;
};


/**
 * optional int64 refund_locktime = 7;
 * @return {number}
 */
proto.fulmine.v1.CreateVHTLCResponse.prototype.getRefundLocktime = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 7, 0));
};


/**
 * @param {number} value
 * @return {!proto.fulmine.v1.CreateVHTLCResponse} returns this
 */
proto.fulmine.v1.CreateVHTLCResponse.prototype.setRefundLocktime = function(value) {
  return jspb.Message.setProto3IntField(this, 7, value);
};


/**
 * optional int64 unilateral_claim_delay = 8;
 * @return {number}
 */
proto.fulmine.v1.CreateVHTLCResponse.prototype.getUnilateralClaimDelay = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 8, 0));
};


/**
 * @param {number} value
 * @return {!proto.fulmine.v1.CreateVHTLCResponse} returns this
 */
proto.fulmine.v1.CreateVHTLCResponse.prototype.setUnilateralClaimDelay = function(value) {
  return jspb.Message.setProto3IntField(this, 8, value);
};


/**
 * optional int64 unilateral_refund_delay = 9;
 * @return {number}
 */
proto.fulmine.v1.CreateVHTLCResponse.prototype.getUnilateralRefundDelay = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 9, 0));
};


/**
 * @param {number} value
 * @return {!proto.fulmine.v1.CreateVHTLCResponse} returns this
 */
proto.fulmine.v1.CreateVHTLCResponse.prototype.setUnilateralRefundDelay = function(value) {
  return jspb.Message.setProto3IntField(this, 9, value);
};


/**
 * optional int64 unilateral_refund_without_receiver_delay = 10;
 * @return {number}
 */
proto.fulmine.v1.CreateVHTLCResponse.prototype.getUnilateralRefundWithoutReceiverDelay = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 10, 0));
};


/**
 * @param {number} value
 * @return {!proto.fulmine.v1.CreateVHTLCResponse} returns this
 */
proto.fulmine.v1.CreateVHTLCResponse.prototype.setUnilateralRefundWithoutReceiverDelay = function(value) {
  return jspb.Message.setProto3IntField(this, 10, value);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.fulmine.v1.ClaimVHTLCRequest.prototype.toObject = function(opt_includeInstance) {
  return proto.fulmine.v1.ClaimVHTLCRequest.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.fulmine.v1.ClaimVHTLCRequest} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.fulmine.v1.ClaimVHTLCRequest.toObject = function(includeInstance, msg) {
  var f, obj = {
    vhtlcId: jspb.Message.getFieldWithDefault(msg, 1, ""),
    preimage: jspb.Message.getFieldWithDefault(msg, 2, ""),
    outpoint: (f = msg.getOutpoint()) && ark_types_pb.Input.toObject(includeInstance, f)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.fulmine.v1.ClaimVHTLCRequest}
 */
proto.fulmine.v1.ClaimVHTLCRequest.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.fulmine.v1.ClaimVHTLCRequest;
  return proto.fulmine.v1.ClaimVHTLCRequest.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.fulmine.v1.ClaimVHTLCRequest} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.fulmine.v1.ClaimVHTLCRequest}
 */
proto.fulmine.v1.ClaimVHTLCRequest.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setVhtlcId(value);
      break;
    case 2:
      var value = /** @type {string} */ (reader.readString());
      msg.setPreimage(value);
      break;
    case 3:
      var value = new ark_types_pb.Input;
      reader.readMessage(value,ark_types_pb.Input.deserializeBinaryFromReader);
      msg.setOutpoint(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.fulmine.v1.ClaimVHTLCRequest.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.fulmine.v1.ClaimVHTLCRequest.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.fulmine.v1.ClaimVHTLCRequest} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.fulmine.v1.ClaimVHTLCRequest.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getVhtlcId();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
  f = message.getPreimage();
  if (f.length > 0) {
    writer.writeString(
      2,
      f
    );
  }
  f = message.getOutpoint();
  if (f != null) {
    writer.writeMessage(
      3,
      f,
      ark_types_pb.Input.serializeBinaryToWriter
    );
  }
};


/**
 * optional string vhtlc_id = 1;
 * @return {string}
 */
proto.fulmine.v1.ClaimVHTLCRequest.prototype.getVhtlcId = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.fulmine.v1.ClaimVHTLCRequest} returns this
 */
proto.fulmine.v1.ClaimVHTLCRequest.prototype.setVhtlcId = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};


/**
 * optional string preimage = 2;
 * @return {string}
 */
proto.fulmine.v1.ClaimVHTLCRequest.prototype.getPreimage = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 2, ""));
};


/**
 * @param {string} value
 * @return {!proto.fulmine.v1.ClaimVHTLCRequest} returns this
 */
proto.fulmine.v1.ClaimVHTLCRequest.prototype.setPreimage = function(value) {
  return jspb.Message.setProto3StringField(this, 2, value);
};


/**
 * optional Input outpoint = 3;
 * @return {?proto.fulmine.v1.Input}
 */
proto.fulmine.v1.ClaimVHTLCRequest.prototype.getOutpoint = function() {
  return /** @type{?proto.fulmine.v1.Input} */ (
    jspb.Message.getWrapperField(this, ark_types_pb.Input, 3));
};


/**
 * @param {?proto.fulmine.v1.Input|undefined} value
 * @return {!proto.fulmine.v1.ClaimVHTLCRequest} returns this
*/
proto.fulmine.v1.ClaimVHTLCRequest.prototype.setOutpoint = function(value) {
  return jspb.Message.setWrapperField(this, 3, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.fulmine.v1.ClaimVHTLCRequest} returns this
 */
proto.fulmine.v1.ClaimVHTLCRequest.prototype.clearOutpoint = function() {
  return this.setOutpoint(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.fulmine.v1.ClaimVHTLCRequest.prototype.hasOutpoint = function() {
  return jspb.Message.getField(this, 3) != null;
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.fulmine.v1.ClaimVHTLCResponse.prototype.toObject = function(opt_includeInstance) {
  return proto.fulmine.v1.ClaimVHTLCResponse.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.fulmine.v1.ClaimVHTLCResponse} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.fulmine.v1.ClaimVHTLCResponse.toObject = function(includeInstance, msg) {
  var f, obj = {
    redeemTxid: jspb.Message.getFieldWithDefault(msg, 1, "")
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.fulmine.v1.ClaimVHTLCResponse}
 */
proto.fulmine.v1.ClaimVHTLCResponse.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.fulmine.v1.ClaimVHTLCResponse;
  return proto.fulmine.v1.ClaimVHTLCResponse.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.fulmine.v1.ClaimVHTLCResponse} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.fulmine.v1.ClaimVHTLCResponse}
 */
proto.fulmine.v1.ClaimVHTLCResponse.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setRedeemTxid(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.fulmine.v1.ClaimVHTLCResponse.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.fulmine.v1.ClaimVHTLCResponse.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.fulmine.v1.ClaimVHTLCResponse} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.fulmine.v1.ClaimVHTLCResponse.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getRedeemTxid();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
};


/**
 * optional string redeem_txid = 1;
 * @return {string}
 */
proto.fulmine.v1.ClaimVHTLCResponse.prototype.getRedeemTxid = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.fulmine.v1.ClaimVHTLCResponse} returns this
 */
proto.fulmine.v1.ClaimVHTLCResponse.prototype.setRedeemTxid = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.fulmine.v1.RefundVHTLCWithoutReceiverRequest.prototype.toObject = function(opt_includeInstance) {
  return proto.fulmine.v1.RefundVHTLCWithoutReceiverRequest.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.fulmine.v1.RefundVHTLCWithoutReceiverRequest} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.fulmine.v1.RefundVHTLCWithoutReceiverRequest.toObject = function(includeInstance, msg) {
  var f, obj = {
    vhtlcId: jspb.Message.getFieldWithDefault(msg, 1, ""),
    outpoint: (f = msg.getOutpoint()) && ark_types_pb.Input.toObject(includeInstance, f)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.fulmine.v1.RefundVHTLCWithoutReceiverRequest}
 */
proto.fulmine.v1.RefundVHTLCWithoutReceiverRequest.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.fulmine.v1.RefundVHTLCWithoutReceiverRequest;
  return proto.fulmine.v1.RefundVHTLCWithoutReceiverRequest.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.fulmine.v1.RefundVHTLCWithoutReceiverRequest} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.fulmine.v1.RefundVHTLCWithoutReceiverRequest}
 */
proto.fulmine.v1.RefundVHTLCWithoutReceiverRequest.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setVhtlcId(value);
      break;
    case 2:
      var value = new ark_types_pb.Input;
      reader.readMessage(value,ark_types_pb.Input.deserializeBinaryFromReader);
      msg.setOutpoint(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.fulmine.v1.RefundVHTLCWithoutReceiverRequest.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.fulmine.v1.RefundVHTLCWithoutReceiverRequest.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.fulmine.v1.RefundVHTLCWithoutReceiverRequest} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.fulmine.v1.RefundVHTLCWithoutReceiverRequest.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getVhtlcId();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
  f = message.getOutpoint();
  if (f != null) {
    writer.writeMessage(
      2,
      f,
      ark_types_pb.Input.serializeBinaryToWriter
    );
  }
};


/**
 * optional string vhtlc_id = 1;
 * @return {string}
 */
proto.fulmine.v1.RefundVHTLCWithoutReceiverRequest.prototype.getVhtlcId = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.fulmine.v1.RefundVHTLCWithoutReceiverRequest} returns this
 */
proto.fulmine.v1.RefundVHTLCWithoutReceiverRequest.prototype.setVhtlcId = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};


/**
 * optional Input outpoint = 2;
 * @return {?proto.fulmine.v1.Input}
 */
proto.fulmine.v1.RefundVHTLCWithoutReceiverRequest.prototype.getOutpoint = function() {
  return /** @type{?proto.fulmine.v1.Input} */ (
    jspb.Message.getWrapperField(this, ark_types_pb.Input, 2));
};


/**
 * @param {?proto.fulmine.v1.Input|undefined} value
 * @return {!proto.fulmine.v1.RefundVHTLCWithoutReceiverRequest} returns this
*/
proto.fulmine.v1.RefundVHTLCWithoutReceiverRequest.prototype.setOutpoint = function(value) {
  return jspb.Message.setWrapperField(this, 2, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.fulmine.v1.RefundVHTLCWithoutReceiverRequest} returns this
 */
proto.fulmine.v1.RefundVHTLCWithoutReceiverRequest.prototype.clearOutpoint = function() {
  return this.setOutpoint(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.fulmine.v1.RefundVHTLCWithoutReceiverRequest.prototype.hasOutpoint = function() {
  return jspb.Message.getField(this, 2) != null;
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.fulmine.v1.RefundVHTLCWithoutReceiverResponse.prototype.toObject = function(opt_includeInstance) {
  return proto.fulmine.v1.RefundVHTLCWithoutReceiverResponse.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.fulmine.v1.RefundVHTLCWithoutReceiverResponse} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.fulmine.v1.RefundVHTLCWithoutReceiverResponse.toObject = function(includeInstance, msg) {
  var f, obj = {
    redeemTxid: jspb.Message.getFieldWithDefault(msg, 1, "")
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.fulmine.v1.RefundVHTLCWithoutReceiverResponse}
 */
proto.fulmine.v1.RefundVHTLCWithoutReceiverResponse.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.fulmine.v1.RefundVHTLCWithoutReceiverResponse;
  return proto.fulmine.v1.RefundVHTLCWithoutReceiverResponse.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.fulmine.v1.RefundVHTLCWithoutReceiverResponse} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.fulmine.v1.RefundVHTLCWithoutReceiverResponse}
 */
proto.fulmine.v1.RefundVHTLCWithoutReceiverResponse.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setRedeemTxid(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.fulmine.v1.RefundVHTLCWithoutReceiverResponse.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.fulmine.v1.RefundVHTLCWithoutReceiverResponse.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.fulmine.v1.RefundVHTLCWithoutReceiverResponse} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.fulmine.v1.RefundVHTLCWithoutReceiverResponse.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getRedeemTxid();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
};


/**
 * optional string redeem_txid = 1;
 * @return {string}
 */
proto.fulmine.v1.RefundVHTLCWithoutReceiverResponse.prototype.getRedeemTxid = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.fulmine.v1.RefundVHTLCWithoutReceiverResponse} returns this
 */
proto.fulmine.v1.RefundVHTLCWithoutReceiverResponse.prototype.setRedeemTxid = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};



/**
 * Oneof group definitions for this message. Each group defines the field
 * numbers belonging to that group. When of these fields' value is set, all
 * other fields in the group are cleared. During deserialization, if multiple
 * fields are encountered for a group, only the last value seen will be kept.
 * @private {!Array<!Array<number>>}
 * @const
 */
proto.fulmine.v1.SettleVHTLCRequest.oneofGroups_ = [[2,3]];

/**
 * @enum {number}
 */
proto.fulmine.v1.SettleVHTLCRequest.SettlementTypeCase = {
  SETTLEMENT_TYPE_NOT_SET: 0,
  CLAIM: 2,
  REFUND: 3
};

/**
 * @return {proto.fulmine.v1.SettleVHTLCRequest.SettlementTypeCase}
 */
proto.fulmine.v1.SettleVHTLCRequest.prototype.getSettlementTypeCase = function() {
  return /** @type {proto.fulmine.v1.SettleVHTLCRequest.SettlementTypeCase} */(jspb.Message.computeOneofCase(this, proto.fulmine.v1.SettleVHTLCRequest.oneofGroups_[0]));
};



if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.fulmine.v1.SettleVHTLCRequest.prototype.toObject = function(opt_includeInstance) {
  return proto.fulmine.v1.SettleVHTLCRequest.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.fulmine.v1.SettleVHTLCRequest} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.fulmine.v1.SettleVHTLCRequest.toObject = function(includeInstance, msg) {
  var f, obj = {
    vhtlcId: jspb.Message.getFieldWithDefault(msg, 1, ""),
    claim: (f = msg.getClaim()) && proto.fulmine.v1.ClaimPath.toObject(includeInstance, f),
    refund: (f = msg.getRefund()) && proto.fulmine.v1.RefundPath.toObject(includeInstance, f),
    outpoint: (f = msg.getOutpoint()) && ark_types_pb.Input.toObject(includeInstance, f)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.fulmine.v1.SettleVHTLCRequest}
 */
proto.fulmine.v1.SettleVHTLCRequest.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.fulmine.v1.SettleVHTLCRequest;
  return proto.fulmine.v1.SettleVHTLCRequest.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.fulmine.v1.SettleVHTLCRequest} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.fulmine.v1.SettleVHTLCRequest}
 */
proto.fulmine.v1.SettleVHTLCRequest.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setVhtlcId(value);
      break;
    case 2:
      var value = new proto.fulmine.v1.ClaimPath;
      reader.readMessage(value,proto.fulmine.v1.ClaimPath.deserializeBinaryFromReader);
      msg.setClaim(value);
      break;
    case 3:
      var value = new proto.fulmine.v1.RefundPath;
      reader.readMessage(value,proto.fulmine.v1.RefundPath.deserializeBinaryFromReader);
      msg.setRefund(value);
      break;
    case 4:
      var value = new ark_types_pb.Input;
      reader.readMessage(value,ark_types_pb.Input.deserializeBinaryFromReader);
      msg.setOutpoint(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.fulmine.v1.SettleVHTLCRequest.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.fulmine.v1.SettleVHTLCRequest.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.fulmine.v1.SettleVHTLCRequest} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.fulmine.v1.SettleVHTLCRequest.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getVhtlcId();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
  f = message.getClaim();
  if (f != null) {
    writer.writeMessage(
      2,
      f,
      proto.fulmine.v1.ClaimPath.serializeBinaryToWriter
    );
  }
  f = message.getRefund();
  if (f != null) {
    writer.writeMessage(
      3,
      f,
      proto.fulmine.v1.RefundPath.serializeBinaryToWriter
    );
  }
  f = message.getOutpoint();
  if (f != null) {
    writer.writeMessage(
      4,
      f,
      ark_types_pb.Input.serializeBinaryToWriter
    );
  }
};


/**
 * optional string vhtlc_id = 1;
 * @return {string}
 */
proto.fulmine.v1.SettleVHTLCRequest.prototype.getVhtlcId = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.fulmine.v1.SettleVHTLCRequest} returns this
 */
proto.fulmine.v1.SettleVHTLCRequest.prototype.setVhtlcId = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};


/**
 * optional ClaimPath claim = 2;
 * @return {?proto.fulmine.v1.ClaimPath}
 */
proto.fulmine.v1.SettleVHTLCRequest.prototype.getClaim = function() {
  return /** @type{?proto.fulmine.v1.ClaimPath} */ (
    jspb.Message.getWrapperField(this, proto.fulmine.v1.ClaimPath, 2));
};


/**
 * @param {?proto.fulmine.v1.ClaimPath|undefined} value
 * @return {!proto.fulmine.v1.SettleVHTLCRequest} returns this
*/
proto.fulmine.v1.SettleVHTLCRequest.prototype.setClaim = function(value) {
  return jspb.Message.setOneofWrapperField(this, 2, proto.fulmine.v1.SettleVHTLCRequest.oneofGroups_[0], value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.fulmine.v1.SettleVHTLCRequest} returns this
 */
proto.fulmine.v1.SettleVHTLCRequest.prototype.clearClaim = function() {
  return this.setClaim(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.fulmine.v1.SettleVHTLCRequest.prototype.hasClaim = function() {
  return jspb.Message.getField(this, 2) != null;
};


/**
 * optional RefundPath refund = 3;
 * @return {?proto.fulmine.v1.RefundPath}
 */
proto.fulmine.v1.SettleVHTLCRequest.prototype.getRefund = function() {
  return /** @type{?proto.fulmine.v1.RefundPath} */ (
    jspb.Message.getWrapperField(this, proto.fulmine.v1.RefundPath, 3));
};


/**
 * @param {?proto.fulmine.v1.RefundPath|undefined} value
 * @return {!proto.fulmine.v1.SettleVHTLCRequest} returns this
*/
proto.fulmine.v1.SettleVHTLCRequest.prototype.setRefund = function(value) {
  return jspb.Message.setOneofWrapperField(this, 3, proto.fulmine.v1.SettleVHTLCRequest.oneofGroups_[0], value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.fulmine.v1.SettleVHTLCRequest} returns this
 */
proto.fulmine.v1.SettleVHTLCRequest.prototype.clearRefund = function() {
  return this.setRefund(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.fulmine.v1.SettleVHTLCRequest.prototype.hasRefund = function() {
  return jspb.Message.getField(this, 3) != null;
};


/**
 * optional Input outpoint = 4;
 * @return {?proto.fulmine.v1.Input}
 */
proto.fulmine.v1.SettleVHTLCRequest.prototype.getOutpoint = function() {
  return /** @type{?proto.fulmine.v1.Input} */ (
    jspb.Message.getWrapperField(this, ark_types_pb.Input, 4));
};


/**
 * @param {?proto.fulmine.v1.Input|undefined} value
 * @return {!proto.fulmine.v1.SettleVHTLCRequest} returns this
*/
proto.fulmine.v1.SettleVHTLCRequest.prototype.setOutpoint = function(value) {
  return jspb.Message.setWrapperField(this, 4, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.fulmine.v1.SettleVHTLCRequest} returns this
 */
proto.fulmine.v1.SettleVHTLCRequest.prototype.clearOutpoint = function() {
  return this.setOutpoint(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.fulmine.v1.SettleVHTLCRequest.prototype.hasOutpoint = function() {
  return jspb.Message.getField(this, 4) != null;
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.fulmine.v1.ClaimPath.prototype.toObject = function(opt_includeInstance) {
  return proto.fulmine.v1.ClaimPath.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.fulmine.v1.ClaimPath} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.fulmine.v1.ClaimPath.toObject = function(includeInstance, msg) {
  var f, obj = {
    preimage: jspb.Message.getFieldWithDefault(msg, 1, "")
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.fulmine.v1.ClaimPath}
 */
proto.fulmine.v1.ClaimPath.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.fulmine.v1.ClaimPath;
  return proto.fulmine.v1.ClaimPath.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.fulmine.v1.ClaimPath} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.fulmine.v1.ClaimPath}
 */
proto.fulmine.v1.ClaimPath.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setPreimage(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.fulmine.v1.ClaimPath.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.fulmine.v1.ClaimPath.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.fulmine.v1.ClaimPath} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.fulmine.v1.ClaimPath.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getPreimage();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
};


/**
 * optional string preimage = 1;
 * @return {string}
 */
proto.fulmine.v1.ClaimPath.prototype.getPreimage = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.fulmine.v1.ClaimPath} returns this
 */
proto.fulmine.v1.ClaimPath.prototype.setPreimage = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.fulmine.v1.RefundPath.prototype.toObject = function(opt_includeInstance) {
  return proto.fulmine.v1.RefundPath.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.fulmine.v1.RefundPath} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.fulmine.v1.RefundPath.toObject = function(includeInstance, msg) {
  var f, obj = {
    delegateParams: (f = msg.getDelegateParams()) && proto.fulmine.v1.DelegateRefundParams.toObject(includeInstance, f)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.fulmine.v1.RefundPath}
 */
proto.fulmine.v1.RefundPath.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.fulmine.v1.RefundPath;
  return proto.fulmine.v1.RefundPath.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.fulmine.v1.RefundPath} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.fulmine.v1.RefundPath}
 */
proto.fulmine.v1.RefundPath.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = new proto.fulmine.v1.DelegateRefundParams;
      reader.readMessage(value,proto.fulmine.v1.DelegateRefundParams.deserializeBinaryFromReader);
      msg.setDelegateParams(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.fulmine.v1.RefundPath.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.fulmine.v1.RefundPath.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.fulmine.v1.RefundPath} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.fulmine.v1.RefundPath.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getDelegateParams();
  if (f != null) {
    writer.writeMessage(
      1,
      f,
      proto.fulmine.v1.DelegateRefundParams.serializeBinaryToWriter
    );
  }
};


/**
 * optional DelegateRefundParams delegate_params = 1;
 * @return {?proto.fulmine.v1.DelegateRefundParams}
 */
proto.fulmine.v1.RefundPath.prototype.getDelegateParams = function() {
  return /** @type{?proto.fulmine.v1.DelegateRefundParams} */ (
    jspb.Message.getWrapperField(this, proto.fulmine.v1.DelegateRefundParams, 1));
};


/**
 * @param {?proto.fulmine.v1.DelegateRefundParams|undefined} value
 * @return {!proto.fulmine.v1.RefundPath} returns this
*/
proto.fulmine.v1.RefundPath.prototype.setDelegateParams = function(value) {
  return jspb.Message.setWrapperField(this, 1, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.fulmine.v1.RefundPath} returns this
 */
proto.fulmine.v1.RefundPath.prototype.clearDelegateParams = function() {
  return this.setDelegateParams(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.fulmine.v1.RefundPath.prototype.hasDelegateParams = function() {
  return jspb.Message.getField(this, 1) != null;
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.fulmine.v1.DelegateRefundParams.prototype.toObject = function(opt_includeInstance) {
  return proto.fulmine.v1.DelegateRefundParams.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.fulmine.v1.DelegateRefundParams} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.fulmine.v1.DelegateRefundParams.toObject = function(includeInstance, msg) {
  var f, obj = {
    signedIntentProof: jspb.Message.getFieldWithDefault(msg, 1, ""),
    intentMessage: jspb.Message.getFieldWithDefault(msg, 2, ""),
    partialForfeitTx: jspb.Message.getFieldWithDefault(msg, 3, "")
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.fulmine.v1.DelegateRefundParams}
 */
proto.fulmine.v1.DelegateRefundParams.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.fulmine.v1.DelegateRefundParams;
  return proto.fulmine.v1.DelegateRefundParams.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.fulmine.v1.DelegateRefundParams} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.fulmine.v1.DelegateRefundParams}
 */
proto.fulmine.v1.DelegateRefundParams.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setSignedIntentProof(value);
      break;
    case 2:
      var value = /** @type {string} */ (reader.readString());
      msg.setIntentMessage(value);
      break;
    case 3:
      var value = /** @type {string} */ (reader.readString());
      msg.setPartialForfeitTx(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.fulmine.v1.DelegateRefundParams.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.fulmine.v1.DelegateRefundParams.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.fulmine.v1.DelegateRefundParams} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.fulmine.v1.DelegateRefundParams.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getSignedIntentProof();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
  f = message.getIntentMessage();
  if (f.length > 0) {
    writer.writeString(
      2,
      f
    );
  }
  f = message.getPartialForfeitTx();
  if (f.length > 0) {
    writer.writeString(
      3,
      f
    );
  }
};


/**
 * optional string signed_intent_proof = 1;
 * @return {string}
 */
proto.fulmine.v1.DelegateRefundParams.prototype.getSignedIntentProof = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.fulmine.v1.DelegateRefundParams} returns this
 */
proto.fulmine.v1.DelegateRefundParams.prototype.setSignedIntentProof = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};


/**
 * optional string intent_message = 2;
 * @return {string}
 */
proto.fulmine.v1.DelegateRefundParams.prototype.getIntentMessage = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 2, ""));
};


/**
 * @param {string} value
 * @return {!proto.fulmine.v1.DelegateRefundParams} returns this
 */
proto.fulmine.v1.DelegateRefundParams.prototype.setIntentMessage = function(value) {
  return jspb.Message.setProto3StringField(this, 2, value);
};


/**
 * optional string partial_forfeit_tx = 3;
 * @return {string}
 */
proto.fulmine.v1.DelegateRefundParams.prototype.getPartialForfeitTx = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 3, ""));
};


/**
 * @param {string} value
 * @return {!proto.fulmine.v1.DelegateRefundParams} returns this
 */
proto.fulmine.v1.DelegateRefundParams.prototype.setPartialForfeitTx = function(value) {
  return jspb.Message.setProto3StringField(this, 3, value);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.fulmine.v1.SettleVHTLCResponse.prototype.toObject = function(opt_includeInstance) {
  return proto.fulmine.v1.SettleVHTLCResponse.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.fulmine.v1.SettleVHTLCResponse} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.fulmine.v1.SettleVHTLCResponse.toObject = function(includeInstance, msg) {
  var f, obj = {
    txid: jspb.Message.getFieldWithDefault(msg, 1, "")
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.fulmine.v1.SettleVHTLCResponse}
 */
proto.fulmine.v1.SettleVHTLCResponse.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.fulmine.v1.SettleVHTLCResponse;
  return proto.fulmine.v1.SettleVHTLCResponse.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.fulmine.v1.SettleVHTLCResponse} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.fulmine.v1.SettleVHTLCResponse}
 */
proto.fulmine.v1.SettleVHTLCResponse.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setTxid(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.fulmine.v1.SettleVHTLCResponse.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.fulmine.v1.SettleVHTLCResponse.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.fulmine.v1.SettleVHTLCResponse} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.fulmine.v1.SettleVHTLCResponse.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getTxid();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
};


/**
 * optional string txid = 1;
 * @return {string}
 */
proto.fulmine.v1.SettleVHTLCResponse.prototype.getTxid = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.fulmine.v1.SettleVHTLCResponse} returns this
 */
proto.fulmine.v1.SettleVHTLCResponse.prototype.setTxid = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.fulmine.v1.ListVHTLCRequest.prototype.toObject = function(opt_includeInstance) {
  return proto.fulmine.v1.ListVHTLCRequest.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.fulmine.v1.ListVHTLCRequest} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.fulmine.v1.ListVHTLCRequest.toObject = function(includeInstance, msg) {
  var f, obj = {
    vhtlcId: jspb.Message.getFieldWithDefault(msg, 1, "")
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.fulmine.v1.ListVHTLCRequest}
 */
proto.fulmine.v1.ListVHTLCRequest.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.fulmine.v1.ListVHTLCRequest;
  return proto.fulmine.v1.ListVHTLCRequest.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.fulmine.v1.ListVHTLCRequest} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.fulmine.v1.ListVHTLCRequest}
 */
proto.fulmine.v1.ListVHTLCRequest.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setVhtlcId(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.fulmine.v1.ListVHTLCRequest.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.fulmine.v1.ListVHTLCRequest.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.fulmine.v1.ListVHTLCRequest} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.fulmine.v1.ListVHTLCRequest.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getVhtlcId();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
};


/**
 * optional string vhtlc_id = 1;
 * @return {string}
 */
proto.fulmine.v1.ListVHTLCRequest.prototype.getVhtlcId = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.fulmine.v1.ListVHTLCRequest} returns this
 */
proto.fulmine.v1.ListVHTLCRequest.prototype.setVhtlcId = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};



/**
 * List of repeated fields within this message type.
 * @private {!Array<number>}
 * @const
 */
proto.fulmine.v1.ListVHTLCResponse.repeatedFields_ = [1];



if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.fulmine.v1.ListVHTLCResponse.prototype.toObject = function(opt_includeInstance) {
  return proto.fulmine.v1.ListVHTLCResponse.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.fulmine.v1.ListVHTLCResponse} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.fulmine.v1.ListVHTLCResponse.toObject = function(includeInstance, msg) {
  var f, obj = {
    vhtlcsList: jspb.Message.toObjectList(msg.getVhtlcsList(),
    ark_types_pb.Vtxo.toObject, includeInstance)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.fulmine.v1.ListVHTLCResponse}
 */
proto.fulmine.v1.ListVHTLCResponse.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.fulmine.v1.ListVHTLCResponse;
  return proto.fulmine.v1.ListVHTLCResponse.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.fulmine.v1.ListVHTLCResponse} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.fulmine.v1.ListVHTLCResponse}
 */
proto.fulmine.v1.ListVHTLCResponse.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = new ark_types_pb.Vtxo;
      reader.readMessage(value,ark_types_pb.Vtxo.deserializeBinaryFromReader);
      msg.addVhtlcs(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.fulmine.v1.ListVHTLCResponse.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.fulmine.v1.ListVHTLCResponse.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.fulmine.v1.ListVHTLCResponse} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.fulmine.v1.ListVHTLCResponse.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getVhtlcsList();
  if (f.length > 0) {
    writer.writeRepeatedMessage(
      1,
      f,
      ark_types_pb.Vtxo.serializeBinaryToWriter
    );
  }
};


/**
 * repeated Vtxo vhtlcs = 1;
 * @return {!Array<!proto.fulmine.v1.Vtxo>}
 */
proto.fulmine.v1.ListVHTLCResponse.prototype.getVhtlcsList = function() {
  return /** @type{!Array<!proto.fulmine.v1.Vtxo>} */ (
    jspb.Message.getRepeatedWrapperField(this, ark_types_pb.Vtxo, 1));
};


/**
 * @param {!Array<!proto.fulmine.v1.Vtxo>} value
 * @return {!proto.fulmine.v1.ListVHTLCResponse} returns this
*/
proto.fulmine.v1.ListVHTLCResponse.prototype.setVhtlcsList = function(value) {
  return jspb.Message.setRepeatedWrapperField(this, 1, value);
};


/**
 * @param {!proto.fulmine.v1.Vtxo=} opt_value
 * @param {number=} opt_index
 * @return {!proto.fulmine.v1.Vtxo}
 */
proto.fulmine.v1.ListVHTLCResponse.prototype.addVhtlcs = function(opt_value, opt_index) {
  return jspb.Message.addToRepeatedWrapperField(this, 1, opt_value, proto.fulmine.v1.Vtxo, opt_index);
};


/**
 * Clears the list making it empty but non-null.
 * @return {!proto.fulmine.v1.ListVHTLCResponse} returns this
 */
proto.fulmine.v1.ListVHTLCResponse.prototype.clearVhtlcsList = function() {
  return this.setVhtlcsList([]);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.fulmine.v1.GetInvoiceRequest.prototype.toObject = function(opt_includeInstance) {
  return proto.fulmine.v1.GetInvoiceRequest.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.fulmine.v1.GetInvoiceRequest} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.fulmine.v1.GetInvoiceRequest.toObject = function(includeInstance, msg) {
  var f, obj = {
    amount: jspb.Message.getFieldWithDefault(msg, 1, 0)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.fulmine.v1.GetInvoiceRequest}
 */
proto.fulmine.v1.GetInvoiceRequest.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.fulmine.v1.GetInvoiceRequest;
  return proto.fulmine.v1.GetInvoiceRequest.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.fulmine.v1.GetInvoiceRequest} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.fulmine.v1.GetInvoiceRequest}
 */
proto.fulmine.v1.GetInvoiceRequest.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {number} */ (reader.readUint64());
      msg.setAmount(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.fulmine.v1.GetInvoiceRequest.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.fulmine.v1.GetInvoiceRequest.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.fulmine.v1.GetInvoiceRequest} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.fulmine.v1.GetInvoiceRequest.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getAmount();
  if (f !== 0) {
    writer.writeUint64(
      1,
      f
    );
  }
};


/**
 * optional uint64 amount = 1;
 * @return {number}
 */
proto.fulmine.v1.GetInvoiceRequest.prototype.getAmount = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 1, 0));
};


/**
 * @param {number} value
 * @return {!proto.fulmine.v1.GetInvoiceRequest} returns this
 */
proto.fulmine.v1.GetInvoiceRequest.prototype.setAmount = function(value) {
  return jspb.Message.setProto3IntField(this, 1, value);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.fulmine.v1.GetInvoiceResponse.prototype.toObject = function(opt_includeInstance) {
  return proto.fulmine.v1.GetInvoiceResponse.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.fulmine.v1.GetInvoiceResponse} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.fulmine.v1.GetInvoiceResponse.toObject = function(includeInstance, msg) {
  var f, obj = {
    invoice: jspb.Message.getFieldWithDefault(msg, 1, "")
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.fulmine.v1.GetInvoiceResponse}
 */
proto.fulmine.v1.GetInvoiceResponse.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.fulmine.v1.GetInvoiceResponse;
  return proto.fulmine.v1.GetInvoiceResponse.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.fulmine.v1.GetInvoiceResponse} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.fulmine.v1.GetInvoiceResponse}
 */
proto.fulmine.v1.GetInvoiceResponse.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setInvoice(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.fulmine.v1.GetInvoiceResponse.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.fulmine.v1.GetInvoiceResponse.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.fulmine.v1.GetInvoiceResponse} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.fulmine.v1.GetInvoiceResponse.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getInvoice();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
};


/**
 * optional string invoice = 1;
 * @return {string}
 */
proto.fulmine.v1.GetInvoiceResponse.prototype.getInvoice = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.fulmine.v1.GetInvoiceResponse} returns this
 */
proto.fulmine.v1.GetInvoiceResponse.prototype.setInvoice = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.fulmine.v1.PayInvoiceRequest.prototype.toObject = function(opt_includeInstance) {
  return proto.fulmine.v1.PayInvoiceRequest.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.fulmine.v1.PayInvoiceRequest} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.fulmine.v1.PayInvoiceRequest.toObject = function(includeInstance, msg) {
  var f, obj = {
    invoice: jspb.Message.getFieldWithDefault(msg, 1, "")
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.fulmine.v1.PayInvoiceRequest}
 */
proto.fulmine.v1.PayInvoiceRequest.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.fulmine.v1.PayInvoiceRequest;
  return proto.fulmine.v1.PayInvoiceRequest.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.fulmine.v1.PayInvoiceRequest} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.fulmine.v1.PayInvoiceRequest}
 */
proto.fulmine.v1.PayInvoiceRequest.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setInvoice(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.fulmine.v1.PayInvoiceRequest.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.fulmine.v1.PayInvoiceRequest.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.fulmine.v1.PayInvoiceRequest} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.fulmine.v1.PayInvoiceRequest.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getInvoice();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
};


/**
 * optional string invoice = 1;
 * @return {string}
 */
proto.fulmine.v1.PayInvoiceRequest.prototype.getInvoice = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.fulmine.v1.PayInvoiceRequest} returns this
 */
proto.fulmine.v1.PayInvoiceRequest.prototype.setInvoice = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.fulmine.v1.PayInvoiceResponse.prototype.toObject = function(opt_includeInstance) {
  return proto.fulmine.v1.PayInvoiceResponse.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.fulmine.v1.PayInvoiceResponse} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.fulmine.v1.PayInvoiceResponse.toObject = function(includeInstance, msg) {
  var f, obj = {
    txid: jspb.Message.getFieldWithDefault(msg, 1, "")
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.fulmine.v1.PayInvoiceResponse}
 */
proto.fulmine.v1.PayInvoiceResponse.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.fulmine.v1.PayInvoiceResponse;
  return proto.fulmine.v1.PayInvoiceResponse.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.fulmine.v1.PayInvoiceResponse} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.fulmine.v1.PayInvoiceResponse}
 */
proto.fulmine.v1.PayInvoiceResponse.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setTxid(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.fulmine.v1.PayInvoiceResponse.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.fulmine.v1.PayInvoiceResponse.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.fulmine.v1.PayInvoiceResponse} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.fulmine.v1.PayInvoiceResponse.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getTxid();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
};


/**
 * optional string txid = 1;
 * @return {string}
 */
proto.fulmine.v1.PayInvoiceResponse.prototype.getTxid = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.fulmine.v1.PayInvoiceResponse} returns this
 */
proto.fulmine.v1.PayInvoiceResponse.prototype.setTxid = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.fulmine.v1.TaprootTree.prototype.toObject = function(opt_includeInstance) {
  return proto.fulmine.v1.TaprootTree.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.fulmine.v1.TaprootTree} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.fulmine.v1.TaprootTree.toObject = function(includeInstance, msg) {
  var f, obj = {
    claimLeaf: (f = msg.getClaimLeaf()) && proto.fulmine.v1.TaprootLeaf.toObject(includeInstance, f),
    refundLeaf: (f = msg.getRefundLeaf()) && proto.fulmine.v1.TaprootLeaf.toObject(includeInstance, f),
    refundWithoutBoltzLeaf: (f = msg.getRefundWithoutBoltzLeaf()) && proto.fulmine.v1.TaprootLeaf.toObject(includeInstance, f),
    unilateralClaimLeaf: (f = msg.getUnilateralClaimLeaf()) && proto.fulmine.v1.TaprootLeaf.toObject(includeInstance, f),
    unilateralRefundLeaf: (f = msg.getUnilateralRefundLeaf()) && proto.fulmine.v1.TaprootLeaf.toObject(includeInstance, f),
    unilateralRefundWithoutBoltzLeaf: (f = msg.getUnilateralRefundWithoutBoltzLeaf()) && proto.fulmine.v1.TaprootLeaf.toObject(includeInstance, f)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.fulmine.v1.TaprootTree}
 */
proto.fulmine.v1.TaprootTree.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.fulmine.v1.TaprootTree;
  return proto.fulmine.v1.TaprootTree.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.fulmine.v1.TaprootTree} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.fulmine.v1.TaprootTree}
 */
proto.fulmine.v1.TaprootTree.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = new proto.fulmine.v1.TaprootLeaf;
      reader.readMessage(value,proto.fulmine.v1.TaprootLeaf.deserializeBinaryFromReader);
      msg.setClaimLeaf(value);
      break;
    case 2:
      var value = new proto.fulmine.v1.TaprootLeaf;
      reader.readMessage(value,proto.fulmine.v1.TaprootLeaf.deserializeBinaryFromReader);
      msg.setRefundLeaf(value);
      break;
    case 3:
      var value = new proto.fulmine.v1.TaprootLeaf;
      reader.readMessage(value,proto.fulmine.v1.TaprootLeaf.deserializeBinaryFromReader);
      msg.setRefundWithoutBoltzLeaf(value);
      break;
    case 4:
      var value = new proto.fulmine.v1.TaprootLeaf;
      reader.readMessage(value,proto.fulmine.v1.TaprootLeaf.deserializeBinaryFromReader);
      msg.setUnilateralClaimLeaf(value);
      break;
    case 5:
      var value = new proto.fulmine.v1.TaprootLeaf;
      reader.readMessage(value,proto.fulmine.v1.TaprootLeaf.deserializeBinaryFromReader);
      msg.setUnilateralRefundLeaf(value);
      break;
    case 6:
      var value = new proto.fulmine.v1.TaprootLeaf;
      reader.readMessage(value,proto.fulmine.v1.TaprootLeaf.deserializeBinaryFromReader);
      msg.setUnilateralRefundWithoutBoltzLeaf(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.fulmine.v1.TaprootTree.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.fulmine.v1.TaprootTree.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.fulmine.v1.TaprootTree} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.fulmine.v1.TaprootTree.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getClaimLeaf();
  if (f != null) {
    writer.writeMessage(
      1,
      f,
      proto.fulmine.v1.TaprootLeaf.serializeBinaryToWriter
    );
  }
  f = message.getRefundLeaf();
  if (f != null) {
    writer.writeMessage(
      2,
      f,
      proto.fulmine.v1.TaprootLeaf.serializeBinaryToWriter
    );
  }
  f = message.getRefundWithoutBoltzLeaf();
  if (f != null) {
    writer.writeMessage(
      3,
      f,
      proto.fulmine.v1.TaprootLeaf.serializeBinaryToWriter
    );
  }
  f = message.getUnilateralClaimLeaf();
  if (f != null) {
    writer.writeMessage(
      4,
      f,
      proto.fulmine.v1.TaprootLeaf.serializeBinaryToWriter
    );
  }
  f = message.getUnilateralRefundLeaf();
  if (f != null) {
    writer.writeMessage(
      5,
      f,
      proto.fulmine.v1.TaprootLeaf.serializeBinaryToWriter
    );
  }
  f = message.getUnilateralRefundWithoutBoltzLeaf();
  if (f != null) {
    writer.writeMessage(
      6,
      f,
      proto.fulmine.v1.TaprootLeaf.serializeBinaryToWriter
    );
  }
};


/**
 * optional TaprootLeaf claim_leaf = 1;
 * @return {?proto.fulmine.v1.TaprootLeaf}
 */
proto.fulmine.v1.TaprootTree.prototype.getClaimLeaf = function() {
  return /** @type{?proto.fulmine.v1.TaprootLeaf} */ (
    jspb.Message.getWrapperField(this, proto.fulmine.v1.TaprootLeaf, 1));
};


/**
 * @param {?proto.fulmine.v1.TaprootLeaf|undefined} value
 * @return {!proto.fulmine.v1.TaprootTree} returns this
*/
proto.fulmine.v1.TaprootTree.prototype.setClaimLeaf = function(value) {
  return jspb.Message.setWrapperField(this, 1, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.fulmine.v1.TaprootTree} returns this
 */
proto.fulmine.v1.TaprootTree.prototype.clearClaimLeaf = function() {
  return this.setClaimLeaf(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.fulmine.v1.TaprootTree.prototype.hasClaimLeaf = function() {
  return jspb.Message.getField(this, 1) != null;
};


/**
 * optional TaprootLeaf refund_leaf = 2;
 * @return {?proto.fulmine.v1.TaprootLeaf}
 */
proto.fulmine.v1.TaprootTree.prototype.getRefundLeaf = function() {
  return /** @type{?proto.fulmine.v1.TaprootLeaf} */ (
    jspb.Message.getWrapperField(this, proto.fulmine.v1.TaprootLeaf, 2));
};


/**
 * @param {?proto.fulmine.v1.TaprootLeaf|undefined} value
 * @return {!proto.fulmine.v1.TaprootTree} returns this
*/
proto.fulmine.v1.TaprootTree.prototype.setRefundLeaf = function(value) {
  return jspb.Message.setWrapperField(this, 2, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.fulmine.v1.TaprootTree} returns this
 */
proto.fulmine.v1.TaprootTree.prototype.clearRefundLeaf = function() {
  return this.setRefundLeaf(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.fulmine.v1.TaprootTree.prototype.hasRefundLeaf = function() {
  return jspb.Message.getField(this, 2) != null;
};


/**
 * optional TaprootLeaf refund_without_boltz_leaf = 3;
 * @return {?proto.fulmine.v1.TaprootLeaf}
 */
proto.fulmine.v1.TaprootTree.prototype.getRefundWithoutBoltzLeaf = function() {
  return /** @type{?proto.fulmine.v1.TaprootLeaf} */ (
    jspb.Message.getWrapperField(this, proto.fulmine.v1.TaprootLeaf, 3));
};


/**
 * @param {?proto.fulmine.v1.TaprootLeaf|undefined} value
 * @return {!proto.fulmine.v1.TaprootTree} returns this
*/
proto.fulmine.v1.TaprootTree.prototype.setRefundWithoutBoltzLeaf = function(value) {
  return jspb.Message.setWrapperField(this, 3, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.fulmine.v1.TaprootTree} returns this
 */
proto.fulmine.v1.TaprootTree.prototype.clearRefundWithoutBoltzLeaf = function() {
  return this.setRefundWithoutBoltzLeaf(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.fulmine.v1.TaprootTree.prototype.hasRefundWithoutBoltzLeaf = function() {
  return jspb.Message.getField(this, 3) != null;
};


/**
 * optional TaprootLeaf unilateral_claim_leaf = 4;
 * @return {?proto.fulmine.v1.TaprootLeaf}
 */
proto.fulmine.v1.TaprootTree.prototype.getUnilateralClaimLeaf = function() {
  return /** @type{?proto.fulmine.v1.TaprootLeaf} */ (
    jspb.Message.getWrapperField(this, proto.fulmine.v1.TaprootLeaf, 4));
};


/**
 * @param {?proto.fulmine.v1.TaprootLeaf|undefined} value
 * @return {!proto.fulmine.v1.TaprootTree} returns this
*/
proto.fulmine.v1.TaprootTree.prototype.setUnilateralClaimLeaf = function(value) {
  return jspb.Message.setWrapperField(this, 4, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.fulmine.v1.TaprootTree} returns this
 */
proto.fulmine.v1.TaprootTree.prototype.clearUnilateralClaimLeaf = function() {
  return this.setUnilateralClaimLeaf(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.fulmine.v1.TaprootTree.prototype.hasUnilateralClaimLeaf = function() {
  return jspb.Message.getField(this, 4) != null;
};


/**
 * optional TaprootLeaf unilateral_refund_leaf = 5;
 * @return {?proto.fulmine.v1.TaprootLeaf}
 */
proto.fulmine.v1.TaprootTree.prototype.getUnilateralRefundLeaf = function() {
  return /** @type{?proto.fulmine.v1.TaprootLeaf} */ (
    jspb.Message.getWrapperField(this, proto.fulmine.v1.TaprootLeaf, 5));
};


/**
 * @param {?proto.fulmine.v1.TaprootLeaf|undefined} value
 * @return {!proto.fulmine.v1.TaprootTree} returns this
*/
proto.fulmine.v1.TaprootTree.prototype.setUnilateralRefundLeaf = function(value) {
  return jspb.Message.setWrapperField(this, 5, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.fulmine.v1.TaprootTree} returns this
 */
proto.fulmine.v1.TaprootTree.prototype.clearUnilateralRefundLeaf = function() {
  return this.setUnilateralRefundLeaf(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.fulmine.v1.TaprootTree.prototype.hasUnilateralRefundLeaf = function() {
  return jspb.Message.getField(this, 5) != null;
};


/**
 * optional TaprootLeaf unilateral_refund_without_boltz_leaf = 6;
 * @return {?proto.fulmine.v1.TaprootLeaf}
 */
proto.fulmine.v1.TaprootTree.prototype.getUnilateralRefundWithoutBoltzLeaf = function() {
  return /** @type{?proto.fulmine.v1.TaprootLeaf} */ (
    jspb.Message.getWrapperField(this, proto.fulmine.v1.TaprootLeaf, 6));
};


/**
 * @param {?proto.fulmine.v1.TaprootLeaf|undefined} value
 * @return {!proto.fulmine.v1.TaprootTree} returns this
*/
proto.fulmine.v1.TaprootTree.prototype.setUnilateralRefundWithoutBoltzLeaf = function(value) {
  return jspb.Message.setWrapperField(this, 6, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.fulmine.v1.TaprootTree} returns this
 */
proto.fulmine.v1.TaprootTree.prototype.clearUnilateralRefundWithoutBoltzLeaf = function() {
  return this.setUnilateralRefundWithoutBoltzLeaf(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.fulmine.v1.TaprootTree.prototype.hasUnilateralRefundWithoutBoltzLeaf = function() {
  return jspb.Message.getField(this, 6) != null;
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.fulmine.v1.TaprootLeaf.prototype.toObject = function(opt_includeInstance) {
  return proto.fulmine.v1.TaprootLeaf.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.fulmine.v1.TaprootLeaf} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.fulmine.v1.TaprootLeaf.toObject = function(includeInstance, msg) {
  var f, obj = {
    version: jspb.Message.getFieldWithDefault(msg, 1, 0),
    output: jspb.Message.getFieldWithDefault(msg, 2, "")
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.fulmine.v1.TaprootLeaf}
 */
proto.fulmine.v1.TaprootLeaf.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.fulmine.v1.TaprootLeaf;
  return proto.fulmine.v1.TaprootLeaf.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.fulmine.v1.TaprootLeaf} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.fulmine.v1.TaprootLeaf}
 */
proto.fulmine.v1.TaprootLeaf.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {number} */ (reader.readInt32());
      msg.setVersion(value);
      break;
    case 2:
      var value = /** @type {string} */ (reader.readString());
      msg.setOutput(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.fulmine.v1.TaprootLeaf.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.fulmine.v1.TaprootLeaf.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.fulmine.v1.TaprootLeaf} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.fulmine.v1.TaprootLeaf.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getVersion();
  if (f !== 0) {
    writer.writeInt32(
      1,
      f
    );
  }
  f = message.getOutput();
  if (f.length > 0) {
    writer.writeString(
      2,
      f
    );
  }
};


/**
 * optional int32 version = 1;
 * @return {number}
 */
proto.fulmine.v1.TaprootLeaf.prototype.getVersion = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 1, 0));
};


/**
 * @param {number} value
 * @return {!proto.fulmine.v1.TaprootLeaf} returns this
 */
proto.fulmine.v1.TaprootLeaf.prototype.setVersion = function(value) {
  return jspb.Message.setProto3IntField(this, 1, value);
};


/**
 * optional string output = 2;
 * @return {string}
 */
proto.fulmine.v1.TaprootLeaf.prototype.getOutput = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 2, ""));
};


/**
 * @param {string} value
 * @return {!proto.fulmine.v1.TaprootLeaf} returns this
 */
proto.fulmine.v1.TaprootLeaf.prototype.setOutput = function(value) {
  return jspb.Message.setProto3StringField(this, 2, value);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.fulmine.v1.IsInvoiceSettledRequest.prototype.toObject = function(opt_includeInstance) {
  return proto.fulmine.v1.IsInvoiceSettledRequest.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.fulmine.v1.IsInvoiceSettledRequest} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.fulmine.v1.IsInvoiceSettledRequest.toObject = function(includeInstance, msg) {
  var f, obj = {
    invoice: jspb.Message.getFieldWithDefault(msg, 1, "")
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.fulmine.v1.IsInvoiceSettledRequest}
 */
proto.fulmine.v1.IsInvoiceSettledRequest.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.fulmine.v1.IsInvoiceSettledRequest;
  return proto.fulmine.v1.IsInvoiceSettledRequest.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.fulmine.v1.IsInvoiceSettledRequest} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.fulmine.v1.IsInvoiceSettledRequest}
 */
proto.fulmine.v1.IsInvoiceSettledRequest.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setInvoice(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.fulmine.v1.IsInvoiceSettledRequest.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.fulmine.v1.IsInvoiceSettledRequest.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.fulmine.v1.IsInvoiceSettledRequest} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.fulmine.v1.IsInvoiceSettledRequest.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getInvoice();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
};


/**
 * optional string invoice = 1;
 * @return {string}
 */
proto.fulmine.v1.IsInvoiceSettledRequest.prototype.getInvoice = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.fulmine.v1.IsInvoiceSettledRequest} returns this
 */
proto.fulmine.v1.IsInvoiceSettledRequest.prototype.setInvoice = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.fulmine.v1.IsInvoiceSettledResponse.prototype.toObject = function(opt_includeInstance) {
  return proto.fulmine.v1.IsInvoiceSettledResponse.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.fulmine.v1.IsInvoiceSettledResponse} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.fulmine.v1.IsInvoiceSettledResponse.toObject = function(includeInstance, msg) {
  var f, obj = {
    settled: jspb.Message.getBooleanFieldWithDefault(msg, 1, false)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.fulmine.v1.IsInvoiceSettledResponse}
 */
proto.fulmine.v1.IsInvoiceSettledResponse.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.fulmine.v1.IsInvoiceSettledResponse;
  return proto.fulmine.v1.IsInvoiceSettledResponse.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.fulmine.v1.IsInvoiceSettledResponse} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.fulmine.v1.IsInvoiceSettledResponse}
 */
proto.fulmine.v1.IsInvoiceSettledResponse.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {boolean} */ (reader.readBool());
      msg.setSettled(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.fulmine.v1.IsInvoiceSettledResponse.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.fulmine.v1.IsInvoiceSettledResponse.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.fulmine.v1.IsInvoiceSettledResponse} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.fulmine.v1.IsInvoiceSettledResponse.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getSettled();
  if (f) {
    writer.writeBool(
      1,
      f
    );
  }
};


/**
 * optional bool settled = 1;
 * @return {boolean}
 */
proto.fulmine.v1.IsInvoiceSettledResponse.prototype.getSettled = function() {
  return /** @type {boolean} */ (jspb.Message.getBooleanFieldWithDefault(this, 1, false));
};


/**
 * @param {boolean} value
 * @return {!proto.fulmine.v1.IsInvoiceSettledResponse} returns this
 */
proto.fulmine.v1.IsInvoiceSettledResponse.prototype.setSettled = function(value) {
  return jspb.Message.setProto3BooleanField(this, 1, value);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.fulmine.v1.RelativeLocktime.prototype.toObject = function(opt_includeInstance) {
  return proto.fulmine.v1.RelativeLocktime.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.fulmine.v1.RelativeLocktime} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.fulmine.v1.RelativeLocktime.toObject = function(includeInstance, msg) {
  var f, obj = {
    type: jspb.Message.getFieldWithDefault(msg, 1, 0),
    value: jspb.Message.getFieldWithDefault(msg, 2, 0)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.fulmine.v1.RelativeLocktime}
 */
proto.fulmine.v1.RelativeLocktime.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.fulmine.v1.RelativeLocktime;
  return proto.fulmine.v1.RelativeLocktime.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.fulmine.v1.RelativeLocktime} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.fulmine.v1.RelativeLocktime}
 */
proto.fulmine.v1.RelativeLocktime.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {!proto.fulmine.v1.RelativeLocktime.LocktimeType} */ (reader.readEnum());
      msg.setType(value);
      break;
    case 2:
      var value = /** @type {number} */ (reader.readUint32());
      msg.setValue(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.fulmine.v1.RelativeLocktime.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.fulmine.v1.RelativeLocktime.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.fulmine.v1.RelativeLocktime} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.fulmine.v1.RelativeLocktime.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getType();
  if (f !== 0.0) {
    writer.writeEnum(
      1,
      f
    );
  }
  f = message.getValue();
  if (f !== 0) {
    writer.writeUint32(
      2,
      f
    );
  }
};


/**
 * @enum {number}
 */
proto.fulmine.v1.RelativeLocktime.LocktimeType = {
  LOCKTIME_TYPE_UNSPECIFIED: 0,
  LOCKTIME_TYPE_BLOCK: 1,
  LOCKTIME_TYPE_SECOND: 2
};

/**
 * optional LocktimeType type = 1;
 * @return {!proto.fulmine.v1.RelativeLocktime.LocktimeType}
 */
proto.fulmine.v1.RelativeLocktime.prototype.getType = function() {
  return /** @type {!proto.fulmine.v1.RelativeLocktime.LocktimeType} */ (jspb.Message.getFieldWithDefault(this, 1, 0));
};


/**
 * @param {!proto.fulmine.v1.RelativeLocktime.LocktimeType} value
 * @return {!proto.fulmine.v1.RelativeLocktime} returns this
 */
proto.fulmine.v1.RelativeLocktime.prototype.setType = function(value) {
  return jspb.Message.setProto3EnumField(this, 1, value);
};


/**
 * optional uint32 value = 2;
 * @return {number}
 */
proto.fulmine.v1.RelativeLocktime.prototype.getValue = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 2, 0));
};


/**
 * @param {number} value
 * @return {!proto.fulmine.v1.RelativeLocktime} returns this
 */
proto.fulmine.v1.RelativeLocktime.prototype.setValue = function(value) {
  return jspb.Message.setProto3IntField(this, 2, value);
};



/**
 * List of repeated fields within this message type.
 * @private {!Array<number>}
 * @const
 */
proto.fulmine.v1.Tapscripts.repeatedFields_ = [1];



if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.fulmine.v1.Tapscripts.prototype.toObject = function(opt_includeInstance) {
  return proto.fulmine.v1.Tapscripts.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.fulmine.v1.Tapscripts} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.fulmine.v1.Tapscripts.toObject = function(includeInstance, msg) {
  var f, obj = {
    scriptsList: (f = jspb.Message.getRepeatedField(msg, 1)) == null ? undefined : f
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.fulmine.v1.Tapscripts}
 */
proto.fulmine.v1.Tapscripts.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.fulmine.v1.Tapscripts;
  return proto.fulmine.v1.Tapscripts.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.fulmine.v1.Tapscripts} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.fulmine.v1.Tapscripts}
 */
proto.fulmine.v1.Tapscripts.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.addScripts(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.fulmine.v1.Tapscripts.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.fulmine.v1.Tapscripts.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.fulmine.v1.Tapscripts} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.fulmine.v1.Tapscripts.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getScriptsList();
  if (f.length > 0) {
    writer.writeRepeatedString(
      1,
      f
    );
  }
};


/**
 * repeated string scripts = 1;
 * @return {!Array<string>}
 */
proto.fulmine.v1.Tapscripts.prototype.getScriptsList = function() {
  return /** @type {!Array<string>} */ (jspb.Message.getRepeatedField(this, 1));
};


/**
 * @param {!Array<string>} value
 * @return {!proto.fulmine.v1.Tapscripts} returns this
 */
proto.fulmine.v1.Tapscripts.prototype.setScriptsList = function(value) {
  return jspb.Message.setField(this, 1, value || []);
};


/**
 * @param {string} value
 * @param {number=} opt_index
 * @return {!proto.fulmine.v1.Tapscripts} returns this
 */
proto.fulmine.v1.Tapscripts.prototype.addScripts = function(value, opt_index) {
  return jspb.Message.addToRepeatedField(this, 1, value, opt_index);
};


/**
 * Clears the list making it empty but non-null.
 * @return {!proto.fulmine.v1.Tapscripts} returns this
 */
proto.fulmine.v1.Tapscripts.prototype.clearScriptsList = function() {
  return this.setScriptsList([]);
};



/**
 * List of repeated fields within this message type.
 * @private {!Array<number>}
 * @const
 */
proto.fulmine.v1.GetVirtualTxsRequest.repeatedFields_ = [1];



if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.fulmine.v1.GetVirtualTxsRequest.prototype.toObject = function(opt_includeInstance) {
  return proto.fulmine.v1.GetVirtualTxsRequest.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.fulmine.v1.GetVirtualTxsRequest} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.fulmine.v1.GetVirtualTxsRequest.toObject = function(includeInstance, msg) {
  var f, obj = {
    txidsList: (f = jspb.Message.getRepeatedField(msg, 1)) == null ? undefined : f
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.fulmine.v1.GetVirtualTxsRequest}
 */
proto.fulmine.v1.GetVirtualTxsRequest.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.fulmine.v1.GetVirtualTxsRequest;
  return proto.fulmine.v1.GetVirtualTxsRequest.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.fulmine.v1.GetVirtualTxsRequest} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.fulmine.v1.GetVirtualTxsRequest}
 */
proto.fulmine.v1.GetVirtualTxsRequest.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.addTxids(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.fulmine.v1.GetVirtualTxsRequest.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.fulmine.v1.GetVirtualTxsRequest.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.fulmine.v1.GetVirtualTxsRequest} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.fulmine.v1.GetVirtualTxsRequest.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getTxidsList();
  if (f.length > 0) {
    writer.writeRepeatedString(
      1,
      f
    );
  }
};


/**
 * repeated string txids = 1;
 * @return {!Array<string>}
 */
proto.fulmine.v1.GetVirtualTxsRequest.prototype.getTxidsList = function() {
  return /** @type {!Array<string>} */ (jspb.Message.getRepeatedField(this, 1));
};


/**
 * @param {!Array<string>} value
 * @return {!proto.fulmine.v1.GetVirtualTxsRequest} returns this
 */
proto.fulmine.v1.GetVirtualTxsRequest.prototype.setTxidsList = function(value) {
  return jspb.Message.setField(this, 1, value || []);
};


/**
 * @param {string} value
 * @param {number=} opt_index
 * @return {!proto.fulmine.v1.GetVirtualTxsRequest} returns this
 */
proto.fulmine.v1.GetVirtualTxsRequest.prototype.addTxids = function(value, opt_index) {
  return jspb.Message.addToRepeatedField(this, 1, value, opt_index);
};


/**
 * Clears the list making it empty but non-null.
 * @return {!proto.fulmine.v1.GetVirtualTxsRequest} returns this
 */
proto.fulmine.v1.GetVirtualTxsRequest.prototype.clearTxidsList = function() {
  return this.setTxidsList([]);
};



/**
 * List of repeated fields within this message type.
 * @private {!Array<number>}
 * @const
 */
proto.fulmine.v1.GetVirtualTxsResponse.repeatedFields_ = [1];



if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.fulmine.v1.GetVirtualTxsResponse.prototype.toObject = function(opt_includeInstance) {
  return proto.fulmine.v1.GetVirtualTxsResponse.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.fulmine.v1.GetVirtualTxsResponse} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.fulmine.v1.GetVirtualTxsResponse.toObject = function(includeInstance, msg) {
  var f, obj = {
    txsList: (f = jspb.Message.getRepeatedField(msg, 1)) == null ? undefined : f
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.fulmine.v1.GetVirtualTxsResponse}
 */
proto.fulmine.v1.GetVirtualTxsResponse.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.fulmine.v1.GetVirtualTxsResponse;
  return proto.fulmine.v1.GetVirtualTxsResponse.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.fulmine.v1.GetVirtualTxsResponse} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.fulmine.v1.GetVirtualTxsResponse}
 */
proto.fulmine.v1.GetVirtualTxsResponse.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.addTxs(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.fulmine.v1.GetVirtualTxsResponse.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.fulmine.v1.GetVirtualTxsResponse.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.fulmine.v1.GetVirtualTxsResponse} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.fulmine.v1.GetVirtualTxsResponse.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getTxsList();
  if (f.length > 0) {
    writer.writeRepeatedString(
      1,
      f
    );
  }
};


/**
 * repeated string txs = 1;
 * @return {!Array<string>}
 */
proto.fulmine.v1.GetVirtualTxsResponse.prototype.getTxsList = function() {
  return /** @type {!Array<string>} */ (jspb.Message.getRepeatedField(this, 1));
};


/**
 * @param {!Array<string>} value
 * @return {!proto.fulmine.v1.GetVirtualTxsResponse} returns this
 */
proto.fulmine.v1.GetVirtualTxsResponse.prototype.setTxsList = function(value) {
  return jspb.Message.setField(this, 1, value || []);
};


/**
 * @param {string} value
 * @param {number=} opt_index
 * @return {!proto.fulmine.v1.GetVirtualTxsResponse} returns this
 */
proto.fulmine.v1.GetVirtualTxsResponse.prototype.addTxs = function(value, opt_index) {
  return jspb.Message.addToRepeatedField(this, 1, value, opt_index);
};


/**
 * Clears the list making it empty but non-null.
 * @return {!proto.fulmine.v1.GetVirtualTxsResponse} returns this
 */
proto.fulmine.v1.GetVirtualTxsResponse.prototype.clearTxsList = function() {
  return this.setTxsList([]);
};



/**
 * Oneof group definitions for this message. Each group defines the field
 * numbers belonging to that group. When of these fields' value is set, all
 * other fields in the group are cleared. During deserialization, if multiple
 * fields are encountered for a group, only the last value seen will be kept.
 * @private {!Array<!Array<number>>}
 * @const
 */
proto.fulmine.v1.GetVtxosRequest.oneofGroups_ = [[1,2,3]];

/**
 * @enum {number}
 */
proto.fulmine.v1.GetVtxosRequest.FilterCase = {
  FILTER_NOT_SET: 0,
  SPENDABLE_ONLY: 1,
  SPENT_ONLY: 2,
  RECOVERABLE_ONLY: 3
};

/**
 * @return {proto.fulmine.v1.GetVtxosRequest.FilterCase}
 */
proto.fulmine.v1.GetVtxosRequest.prototype.getFilterCase = function() {
  return /** @type {proto.fulmine.v1.GetVtxosRequest.FilterCase} */(jspb.Message.computeOneofCase(this, proto.fulmine.v1.GetVtxosRequest.oneofGroups_[0]));
};



if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.fulmine.v1.GetVtxosRequest.prototype.toObject = function(opt_includeInstance) {
  return proto.fulmine.v1.GetVtxosRequest.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.fulmine.v1.GetVtxosRequest} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.fulmine.v1.GetVtxosRequest.toObject = function(includeInstance, msg) {
  var f, obj = {
    spendableOnly: jspb.Message.getBooleanFieldWithDefault(msg, 1, false),
    spentOnly: jspb.Message.getBooleanFieldWithDefault(msg, 2, false),
    recoverableOnly: jspb.Message.getBooleanFieldWithDefault(msg, 3, false)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.fulmine.v1.GetVtxosRequest}
 */
proto.fulmine.v1.GetVtxosRequest.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.fulmine.v1.GetVtxosRequest;
  return proto.fulmine.v1.GetVtxosRequest.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.fulmine.v1.GetVtxosRequest} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.fulmine.v1.GetVtxosRequest}
 */
proto.fulmine.v1.GetVtxosRequest.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {boolean} */ (reader.readBool());
      msg.setSpendableOnly(value);
      break;
    case 2:
      var value = /** @type {boolean} */ (reader.readBool());
      msg.setSpentOnly(value);
      break;
    case 3:
      var value = /** @type {boolean} */ (reader.readBool());
      msg.setRecoverableOnly(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.fulmine.v1.GetVtxosRequest.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.fulmine.v1.GetVtxosRequest.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.fulmine.v1.GetVtxosRequest} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.fulmine.v1.GetVtxosRequest.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = /** @type {boolean} */ (jspb.Message.getField(message, 1));
  if (f != null) {
    writer.writeBool(
      1,
      f
    );
  }
  f = /** @type {boolean} */ (jspb.Message.getField(message, 2));
  if (f != null) {
    writer.writeBool(
      2,
      f
    );
  }
  f = /** @type {boolean} */ (jspb.Message.getField(message, 3));
  if (f != null) {
    writer.writeBool(
      3,
      f
    );
  }
};


/**
 * optional bool spendable_only = 1;
 * @return {boolean}
 */
proto.fulmine.v1.GetVtxosRequest.prototype.getSpendableOnly = function() {
  return /** @type {boolean} */ (jspb.Message.getBooleanFieldWithDefault(this, 1, false));
};


/**
 * @param {boolean} value
 * @return {!proto.fulmine.v1.GetVtxosRequest} returns this
 */
proto.fulmine.v1.GetVtxosRequest.prototype.setSpendableOnly = function(value) {
  return jspb.Message.setOneofField(this, 1, proto.fulmine.v1.GetVtxosRequest.oneofGroups_[0], value);
};


/**
 * Clears the field making it undefined.
 * @return {!proto.fulmine.v1.GetVtxosRequest} returns this
 */
proto.fulmine.v1.GetVtxosRequest.prototype.clearSpendableOnly = function() {
  return jspb.Message.setOneofField(this, 1, proto.fulmine.v1.GetVtxosRequest.oneofGroups_[0], undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.fulmine.v1.GetVtxosRequest.prototype.hasSpendableOnly = function() {
  return jspb.Message.getField(this, 1) != null;
};


/**
 * optional bool spent_only = 2;
 * @return {boolean}
 */
proto.fulmine.v1.GetVtxosRequest.prototype.getSpentOnly = function() {
  return /** @type {boolean} */ (jspb.Message.getBooleanFieldWithDefault(this, 2, false));
};


/**
 * @param {boolean} value
 * @return {!proto.fulmine.v1.GetVtxosRequest} returns this
 */
proto.fulmine.v1.GetVtxosRequest.prototype.setSpentOnly = function(value) {
  return jspb.Message.setOneofField(this, 2, proto.fulmine.v1.GetVtxosRequest.oneofGroups_[0], value);
};


/**
 * Clears the field making it undefined.
 * @return {!proto.fulmine.v1.GetVtxosRequest} returns this
 */
proto.fulmine.v1.GetVtxosRequest.prototype.clearSpentOnly = function() {
  return jspb.Message.setOneofField(this, 2, proto.fulmine.v1.GetVtxosRequest.oneofGroups_[0], undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.fulmine.v1.GetVtxosRequest.prototype.hasSpentOnly = function() {
  return jspb.Message.getField(this, 2) != null;
};


/**
 * optional bool recoverable_only = 3;
 * @return {boolean}
 */
proto.fulmine.v1.GetVtxosRequest.prototype.getRecoverableOnly = function() {
  return /** @type {boolean} */ (jspb.Message.getBooleanFieldWithDefault(this, 3, false));
};


/**
 * @param {boolean} value
 * @return {!proto.fulmine.v1.GetVtxosRequest} returns this
 */
proto.fulmine.v1.GetVtxosRequest.prototype.setRecoverableOnly = function(value) {
  return jspb.Message.setOneofField(this, 3, proto.fulmine.v1.GetVtxosRequest.oneofGroups_[0], value);
};


/**
 * Clears the field making it undefined.
 * @return {!proto.fulmine.v1.GetVtxosRequest} returns this
 */
proto.fulmine.v1.GetVtxosRequest.prototype.clearRecoverableOnly = function() {
  return jspb.Message.setOneofField(this, 3, proto.fulmine.v1.GetVtxosRequest.oneofGroups_[0], undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.fulmine.v1.GetVtxosRequest.prototype.hasRecoverableOnly = function() {
  return jspb.Message.getField(this, 3) != null;
};



/**
 * List of repeated fields within this message type.
 * @private {!Array<number>}
 * @const
 */
proto.fulmine.v1.GetVtxosResponse.repeatedFields_ = [1];



if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.fulmine.v1.GetVtxosResponse.prototype.toObject = function(opt_includeInstance) {
  return proto.fulmine.v1.GetVtxosResponse.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.fulmine.v1.GetVtxosResponse} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.fulmine.v1.GetVtxosResponse.toObject = function(includeInstance, msg) {
  var f, obj = {
    vtxosList: jspb.Message.toObjectList(msg.getVtxosList(),
    ark_types_pb.Vtxo.toObject, includeInstance)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.fulmine.v1.GetVtxosResponse}
 */
proto.fulmine.v1.GetVtxosResponse.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.fulmine.v1.GetVtxosResponse;
  return proto.fulmine.v1.GetVtxosResponse.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.fulmine.v1.GetVtxosResponse} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.fulmine.v1.GetVtxosResponse}
 */
proto.fulmine.v1.GetVtxosResponse.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = new ark_types_pb.Vtxo;
      reader.readMessage(value,ark_types_pb.Vtxo.deserializeBinaryFromReader);
      msg.addVtxos(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.fulmine.v1.GetVtxosResponse.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.fulmine.v1.GetVtxosResponse.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.fulmine.v1.GetVtxosResponse} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.fulmine.v1.GetVtxosResponse.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getVtxosList();
  if (f.length > 0) {
    writer.writeRepeatedMessage(
      1,
      f,
      ark_types_pb.Vtxo.serializeBinaryToWriter
    );
  }
};


/**
 * repeated Vtxo vtxos = 1;
 * @return {!Array<!proto.fulmine.v1.Vtxo>}
 */
proto.fulmine.v1.GetVtxosResponse.prototype.getVtxosList = function() {
  return /** @type{!Array<!proto.fulmine.v1.Vtxo>} */ (
    jspb.Message.getRepeatedWrapperField(this, ark_types_pb.Vtxo, 1));
};


/**
 * @param {!Array<!proto.fulmine.v1.Vtxo>} value
 * @return {!proto.fulmine.v1.GetVtxosResponse} returns this
*/
proto.fulmine.v1.GetVtxosResponse.prototype.setVtxosList = function(value) {
  return jspb.Message.setRepeatedWrapperField(this, 1, value);
};


/**
 * @param {!proto.fulmine.v1.Vtxo=} opt_value
 * @param {number=} opt_index
 * @return {!proto.fulmine.v1.Vtxo}
 */
proto.fulmine.v1.GetVtxosResponse.prototype.addVtxos = function(opt_value, opt_index) {
  return jspb.Message.addToRepeatedWrapperField(this, 1, opt_value, proto.fulmine.v1.Vtxo, opt_index);
};


/**
 * Clears the list making it empty but non-null.
 * @return {!proto.fulmine.v1.GetVtxosResponse} returns this
 */
proto.fulmine.v1.GetVtxosResponse.prototype.clearVtxosList = function() {
  return this.setVtxosList([]);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.fulmine.v1.NextSettlementRequest.prototype.toObject = function(opt_includeInstance) {
  return proto.fulmine.v1.NextSettlementRequest.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.fulmine.v1.NextSettlementRequest} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.fulmine.v1.NextSettlementRequest.toObject = function(includeInstance, msg) {
  var f, obj = {

  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.fulmine.v1.NextSettlementRequest}
 */
proto.fulmine.v1.NextSettlementRequest.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.fulmine.v1.NextSettlementRequest;
  return proto.fulmine.v1.NextSettlementRequest.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.fulmine.v1.NextSettlementRequest} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.fulmine.v1.NextSettlementRequest}
 */
proto.fulmine.v1.NextSettlementRequest.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.fulmine.v1.NextSettlementRequest.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.fulmine.v1.NextSettlementRequest.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.fulmine.v1.NextSettlementRequest} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.fulmine.v1.NextSettlementRequest.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.fulmine.v1.NextSettlementResponse.prototype.toObject = function(opt_includeInstance) {
  return proto.fulmine.v1.NextSettlementResponse.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.fulmine.v1.NextSettlementResponse} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.fulmine.v1.NextSettlementResponse.toObject = function(includeInstance, msg) {
  var f, obj = {
    nextSettlementAt: jspb.Message.getFieldWithDefault(msg, 1, 0)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.fulmine.v1.NextSettlementResponse}
 */
proto.fulmine.v1.NextSettlementResponse.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.fulmine.v1.NextSettlementResponse;
  return proto.fulmine.v1.NextSettlementResponse.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.fulmine.v1.NextSettlementResponse} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.fulmine.v1.NextSettlementResponse}
 */
proto.fulmine.v1.NextSettlementResponse.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {number} */ (reader.readInt64());
      msg.setNextSettlementAt(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.fulmine.v1.NextSettlementResponse.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.fulmine.v1.NextSettlementResponse.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.fulmine.v1.NextSettlementResponse} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.fulmine.v1.NextSettlementResponse.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getNextSettlementAt();
  if (f !== 0) {
    writer.writeInt64(
      1,
      f
    );
  }
};


/**
 * optional int64 next_settlement_at = 1;
 * @return {number}
 */
proto.fulmine.v1.NextSettlementResponse.prototype.getNextSettlementAt = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 1, 0));
};


/**
 * @param {number} value
 * @return {!proto.fulmine.v1.NextSettlementResponse} returns this
 */
proto.fulmine.v1.NextSettlementResponse.prototype.setNextSettlementAt = function(value) {
  return jspb.Message.setProto3IntField(this, 1, value);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.fulmine.v1.CreateChainSwapRequest.prototype.toObject = function(opt_includeInstance) {
  return proto.fulmine.v1.CreateChainSwapRequest.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.fulmine.v1.CreateChainSwapRequest} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.fulmine.v1.CreateChainSwapRequest.toObject = function(includeInstance, msg) {
  var f, obj = {
    direction: jspb.Message.getFieldWithDefault(msg, 1, 0),
    amount: jspb.Message.getFieldWithDefault(msg, 2, 0),
    btcAddress: jspb.Message.getFieldWithDefault(msg, 3, "")
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.fulmine.v1.CreateChainSwapRequest}
 */
proto.fulmine.v1.CreateChainSwapRequest.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.fulmine.v1.CreateChainSwapRequest;
  return proto.fulmine.v1.CreateChainSwapRequest.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.fulmine.v1.CreateChainSwapRequest} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.fulmine.v1.CreateChainSwapRequest}
 */
proto.fulmine.v1.CreateChainSwapRequest.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {!proto.fulmine.v1.SwapDirection} */ (reader.readEnum());
      msg.setDirection(value);
      break;
    case 2:
      var value = /** @type {number} */ (reader.readUint64());
      msg.setAmount(value);
      break;
    case 3:
      var value = /** @type {string} */ (reader.readString());
      msg.setBtcAddress(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.fulmine.v1.CreateChainSwapRequest.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.fulmine.v1.CreateChainSwapRequest.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.fulmine.v1.CreateChainSwapRequest} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.fulmine.v1.CreateChainSwapRequest.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getDirection();
  if (f !== 0.0) {
    writer.writeEnum(
      1,
      f
    );
  }
  f = message.getAmount();
  if (f !== 0) {
    writer.writeUint64(
      2,
      f
    );
  }
  f = message.getBtcAddress();
  if (f.length > 0) {
    writer.writeString(
      3,
      f
    );
  }
};


/**
 * optional SwapDirection direction = 1;
 * @return {!proto.fulmine.v1.SwapDirection}
 */
proto.fulmine.v1.CreateChainSwapRequest.prototype.getDirection = function() {
  return /** @type {!proto.fulmine.v1.SwapDirection} */ (jspb.Message.getFieldWithDefault(this, 1, 0));
};


/**
 * @param {!proto.fulmine.v1.SwapDirection} value
 * @return {!proto.fulmine.v1.CreateChainSwapRequest} returns this
 */
proto.fulmine.v1.CreateChainSwapRequest.prototype.setDirection = function(value) {
  return jspb.Message.setProto3EnumField(this, 1, value);
};


/**
 * optional uint64 amount = 2;
 * @return {number}
 */
proto.fulmine.v1.CreateChainSwapRequest.prototype.getAmount = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 2, 0));
};


/**
 * @param {number} value
 * @return {!proto.fulmine.v1.CreateChainSwapRequest} returns this
 */
proto.fulmine.v1.CreateChainSwapRequest.prototype.setAmount = function(value) {
  return jspb.Message.setProto3IntField(this, 2, value);
};


/**
 * optional string btc_address = 3;
 * @return {string}
 */
proto.fulmine.v1.CreateChainSwapRequest.prototype.getBtcAddress = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 3, ""));
};


/**
 * @param {string} value
 * @return {!proto.fulmine.v1.CreateChainSwapRequest} returns this
 */
proto.fulmine.v1.CreateChainSwapRequest.prototype.setBtcAddress = function(value) {
  return jspb.Message.setProto3StringField(this, 3, value);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.fulmine.v1.CreateChainSwapResponse.prototype.toObject = function(opt_includeInstance) {
  return proto.fulmine.v1.CreateChainSwapResponse.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.fulmine.v1.CreateChainSwapResponse} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.fulmine.v1.CreateChainSwapResponse.toObject = function(includeInstance, msg) {
  var f, obj = {
    id: jspb.Message.getFieldWithDefault(msg, 1, ""),
    status: jspb.Message.getFieldWithDefault(msg, 2, ""),
    userLockupTxid: jspb.Message.getFieldWithDefault(msg, 3, ""),
    lockupAddress: jspb.Message.getFieldWithDefault(msg, 4, ""),
    expectedAmount: jspb.Message.getFieldWithDefault(msg, 5, 0),
    timeoutBlockHeight: jspb.Message.getFieldWithDefault(msg, 6, 0),
    preimage: jspb.Message.getFieldWithDefault(msg, 7, ""),
    error: jspb.Message.getFieldWithDefault(msg, 8, "")
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.fulmine.v1.CreateChainSwapResponse}
 */
proto.fulmine.v1.CreateChainSwapResponse.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.fulmine.v1.CreateChainSwapResponse;
  return proto.fulmine.v1.CreateChainSwapResponse.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.fulmine.v1.CreateChainSwapResponse} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.fulmine.v1.CreateChainSwapResponse}
 */
proto.fulmine.v1.CreateChainSwapResponse.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setId(value);
      break;
    case 2:
      var value = /** @type {string} */ (reader.readString());
      msg.setStatus(value);
      break;
    case 3:
      var value = /** @type {string} */ (reader.readString());
      msg.setUserLockupTxid(value);
      break;
    case 4:
      var value = /** @type {string} */ (reader.readString());
      msg.setLockupAddress(value);
      break;
    case 5:
      var value = /** @type {number} */ (reader.readUint64());
      msg.setExpectedAmount(value);
      break;
    case 6:
      var value = /** @type {number} */ (reader.readUint64());
      msg.setTimeoutBlockHeight(value);
      break;
    case 7:
      var value = /** @type {string} */ (reader.readString());
      msg.setPreimage(value);
      break;
    case 8:
      var value = /** @type {string} */ (reader.readString());
      msg.setError(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.fulmine.v1.CreateChainSwapResponse.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.fulmine.v1.CreateChainSwapResponse.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.fulmine.v1.CreateChainSwapResponse} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.fulmine.v1.CreateChainSwapResponse.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getId();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
  f = message.getStatus();
  if (f.length > 0) {
    writer.writeString(
      2,
      f
    );
  }
  f = message.getUserLockupTxid();
  if (f.length > 0) {
    writer.writeString(
      3,
      f
    );
  }
  f = message.getLockupAddress();
  if (f.length > 0) {
    writer.writeString(
      4,
      f
    );
  }
  f = message.getExpectedAmount();
  if (f !== 0) {
    writer.writeUint64(
      5,
      f
    );
  }
  f = message.getTimeoutBlockHeight();
  if (f !== 0) {
    writer.writeUint64(
      6,
      f
    );
  }
  f = message.getPreimage();
  if (f.length > 0) {
    writer.writeString(
      7,
      f
    );
  }
  f = message.getError();
  if (f.length > 0) {
    writer.writeString(
      8,
      f
    );
  }
};


/**
 * optional string id = 1;
 * @return {string}
 */
proto.fulmine.v1.CreateChainSwapResponse.prototype.getId = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.fulmine.v1.CreateChainSwapResponse} returns this
 */
proto.fulmine.v1.CreateChainSwapResponse.prototype.setId = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};


/**
 * optional string status = 2;
 * @return {string}
 */
proto.fulmine.v1.CreateChainSwapResponse.prototype.getStatus = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 2, ""));
};


/**
 * @param {string} value
 * @return {!proto.fulmine.v1.CreateChainSwapResponse} returns this
 */
proto.fulmine.v1.CreateChainSwapResponse.prototype.setStatus = function(value) {
  return jspb.Message.setProto3StringField(this, 2, value);
};


/**
 * optional string user_lockup_txid = 3;
 * @return {string}
 */
proto.fulmine.v1.CreateChainSwapResponse.prototype.getUserLockupTxid = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 3, ""));
};


/**
 * @param {string} value
 * @return {!proto.fulmine.v1.CreateChainSwapResponse} returns this
 */
proto.fulmine.v1.CreateChainSwapResponse.prototype.setUserLockupTxid = function(value) {
  return jspb.Message.setProto3StringField(this, 3, value);
};


/**
 * optional string lockup_address = 4;
 * @return {string}
 */
proto.fulmine.v1.CreateChainSwapResponse.prototype.getLockupAddress = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 4, ""));
};


/**
 * @param {string} value
 * @return {!proto.fulmine.v1.CreateChainSwapResponse} returns this
 */
proto.fulmine.v1.CreateChainSwapResponse.prototype.setLockupAddress = function(value) {
  return jspb.Message.setProto3StringField(this, 4, value);
};


/**
 * optional uint64 expected_amount = 5;
 * @return {number}
 */
proto.fulmine.v1.CreateChainSwapResponse.prototype.getExpectedAmount = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 5, 0));
};


/**
 * @param {number} value
 * @return {!proto.fulmine.v1.CreateChainSwapResponse} returns this
 */
proto.fulmine.v1.CreateChainSwapResponse.prototype.setExpectedAmount = function(value) {
  return jspb.Message.setProto3IntField(this, 5, value);
};


/**
 * optional uint64 timeout_block_height = 6;
 * @return {number}
 */
proto.fulmine.v1.CreateChainSwapResponse.prototype.getTimeoutBlockHeight = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 6, 0));
};


/**
 * @param {number} value
 * @return {!proto.fulmine.v1.CreateChainSwapResponse} returns this
 */
proto.fulmine.v1.CreateChainSwapResponse.prototype.setTimeoutBlockHeight = function(value) {
  return jspb.Message.setProto3IntField(this, 6, value);
};


/**
 * optional string preimage = 7;
 * @return {string}
 */
proto.fulmine.v1.CreateChainSwapResponse.prototype.getPreimage = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 7, ""));
};


/**
 * @param {string} value
 * @return {!proto.fulmine.v1.CreateChainSwapResponse} returns this
 */
proto.fulmine.v1.CreateChainSwapResponse.prototype.setPreimage = function(value) {
  return jspb.Message.setProto3StringField(this, 7, value);
};


/**
 * optional string error = 8;
 * @return {string}
 */
proto.fulmine.v1.CreateChainSwapResponse.prototype.getError = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 8, ""));
};


/**
 * @param {string} value
 * @return {!proto.fulmine.v1.CreateChainSwapResponse} returns this
 */
proto.fulmine.v1.CreateChainSwapResponse.prototype.setError = function(value) {
  return jspb.Message.setProto3StringField(this, 8, value);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.fulmine.v1.ChainSwapResponse.prototype.toObject = function(opt_includeInstance) {
  return proto.fulmine.v1.ChainSwapResponse.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.fulmine.v1.ChainSwapResponse} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.fulmine.v1.ChainSwapResponse.toObject = function(includeInstance, msg) {
  var f, obj = {
    id: jspb.Message.getFieldWithDefault(msg, 1, ""),
    from: jspb.Message.getFieldWithDefault(msg, 2, ""),
    to: jspb.Message.getFieldWithDefault(msg, 3, ""),
    amount: jspb.Message.getFieldWithDefault(msg, 4, 0),
    status: jspb.Message.getFieldWithDefault(msg, 5, ""),
    preimage: jspb.Message.getFieldWithDefault(msg, 6, ""),
    userLockupTxid: jspb.Message.getFieldWithDefault(msg, 7, ""),
    serverLockupTxid: jspb.Message.getFieldWithDefault(msg, 8, ""),
    claimTxid: jspb.Message.getFieldWithDefault(msg, 9, ""),
    refundTxid: jspb.Message.getFieldWithDefault(msg, 10, ""),
    btcAddress: jspb.Message.getFieldWithDefault(msg, 11, ""),
    timestamp: jspb.Message.getFieldWithDefault(msg, 12, 0),
    errorMessage: jspb.Message.getFieldWithDefault(msg, 13, "")
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.fulmine.v1.ChainSwapResponse}
 */
proto.fulmine.v1.ChainSwapResponse.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.fulmine.v1.ChainSwapResponse;
  return proto.fulmine.v1.ChainSwapResponse.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.fulmine.v1.ChainSwapResponse} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.fulmine.v1.ChainSwapResponse}
 */
proto.fulmine.v1.ChainSwapResponse.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setId(value);
      break;
    case 2:
      var value = /** @type {string} */ (reader.readString());
      msg.setFrom(value);
      break;
    case 3:
      var value = /** @type {string} */ (reader.readString());
      msg.setTo(value);
      break;
    case 4:
      var value = /** @type {number} */ (reader.readUint64());
      msg.setAmount(value);
      break;
    case 5:
      var value = /** @type {string} */ (reader.readString());
      msg.setStatus(value);
      break;
    case 6:
      var value = /** @type {string} */ (reader.readString());
      msg.setPreimage(value);
      break;
    case 7:
      var value = /** @type {string} */ (reader.readString());
      msg.setUserLockupTxid(value);
      break;
    case 8:
      var value = /** @type {string} */ (reader.readString());
      msg.setServerLockupTxid(value);
      break;
    case 9:
      var value = /** @type {string} */ (reader.readString());
      msg.setClaimTxid(value);
      break;
    case 10:
      var value = /** @type {string} */ (reader.readString());
      msg.setRefundTxid(value);
      break;
    case 11:
      var value = /** @type {string} */ (reader.readString());
      msg.setBtcAddress(value);
      break;
    case 12:
      var value = /** @type {number} */ (reader.readInt64());
      msg.setTimestamp(value);
      break;
    case 13:
      var value = /** @type {string} */ (reader.readString());
      msg.setErrorMessage(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.fulmine.v1.ChainSwapResponse.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.fulmine.v1.ChainSwapResponse.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.fulmine.v1.ChainSwapResponse} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.fulmine.v1.ChainSwapResponse.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getId();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
  f = message.getFrom();
  if (f.length > 0) {
    writer.writeString(
      2,
      f
    );
  }
  f = message.getTo();
  if (f.length > 0) {
    writer.writeString(
      3,
      f
    );
  }
  f = message.getAmount();
  if (f !== 0) {
    writer.writeUint64(
      4,
      f
    );
  }
  f = message.getStatus();
  if (f.length > 0) {
    writer.writeString(
      5,
      f
    );
  }
  f = message.getPreimage();
  if (f.length > 0) {
    writer.writeString(
      6,
      f
    );
  }
  f = message.getUserLockupTxid();
  if (f.length > 0) {
    writer.writeString(
      7,
      f
    );
  }
  f = message.getServerLockupTxid();
  if (f.length > 0) {
    writer.writeString(
      8,
      f
    );
  }
  f = message.getClaimTxid();
  if (f.length > 0) {
    writer.writeString(
      9,
      f
    );
  }
  f = message.getRefundTxid();
  if (f.length > 0) {
    writer.writeString(
      10,
      f
    );
  }
  f = message.getBtcAddress();
  if (f.length > 0) {
    writer.writeString(
      11,
      f
    );
  }
  f = message.getTimestamp();
  if (f !== 0) {
    writer.writeInt64(
      12,
      f
    );
  }
  f = message.getErrorMessage();
  if (f.length > 0) {
    writer.writeString(
      13,
      f
    );
  }
};


/**
 * optional string id = 1;
 * @return {string}
 */
proto.fulmine.v1.ChainSwapResponse.prototype.getId = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.fulmine.v1.ChainSwapResponse} returns this
 */
proto.fulmine.v1.ChainSwapResponse.prototype.setId = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};


/**
 * optional string from = 2;
 * @return {string}
 */
proto.fulmine.v1.ChainSwapResponse.prototype.getFrom = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 2, ""));
};


/**
 * @param {string} value
 * @return {!proto.fulmine.v1.ChainSwapResponse} returns this
 */
proto.fulmine.v1.ChainSwapResponse.prototype.setFrom = function(value) {
  return jspb.Message.setProto3StringField(this, 2, value);
};


/**
 * optional string to = 3;
 * @return {string}
 */
proto.fulmine.v1.ChainSwapResponse.prototype.getTo = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 3, ""));
};


/**
 * @param {string} value
 * @return {!proto.fulmine.v1.ChainSwapResponse} returns this
 */
proto.fulmine.v1.ChainSwapResponse.prototype.setTo = function(value) {
  return jspb.Message.setProto3StringField(this, 3, value);
};


/**
 * optional uint64 amount = 4;
 * @return {number}
 */
proto.fulmine.v1.ChainSwapResponse.prototype.getAmount = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 4, 0));
};


/**
 * @param {number} value
 * @return {!proto.fulmine.v1.ChainSwapResponse} returns this
 */
proto.fulmine.v1.ChainSwapResponse.prototype.setAmount = function(value) {
  return jspb.Message.setProto3IntField(this, 4, value);
};


/**
 * optional string status = 5;
 * @return {string}
 */
proto.fulmine.v1.ChainSwapResponse.prototype.getStatus = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 5, ""));
};


/**
 * @param {string} value
 * @return {!proto.fulmine.v1.ChainSwapResponse} returns this
 */
proto.fulmine.v1.ChainSwapResponse.prototype.setStatus = function(value) {
  return jspb.Message.setProto3StringField(this, 5, value);
};


/**
 * optional string preimage = 6;
 * @return {string}
 */
proto.fulmine.v1.ChainSwapResponse.prototype.getPreimage = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 6, ""));
};


/**
 * @param {string} value
 * @return {!proto.fulmine.v1.ChainSwapResponse} returns this
 */
proto.fulmine.v1.ChainSwapResponse.prototype.setPreimage = function(value) {
  return jspb.Message.setProto3StringField(this, 6, value);
};


/**
 * optional string user_lockup_txid = 7;
 * @return {string}
 */
proto.fulmine.v1.ChainSwapResponse.prototype.getUserLockupTxid = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 7, ""));
};


/**
 * @param {string} value
 * @return {!proto.fulmine.v1.ChainSwapResponse} returns this
 */
proto.fulmine.v1.ChainSwapResponse.prototype.setUserLockupTxid = function(value) {
  return jspb.Message.setProto3StringField(this, 7, value);
};


/**
 * optional string server_lockup_txid = 8;
 * @return {string}
 */
proto.fulmine.v1.ChainSwapResponse.prototype.getServerLockupTxid = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 8, ""));
};


/**
 * @param {string} value
 * @return {!proto.fulmine.v1.ChainSwapResponse} returns this
 */
proto.fulmine.v1.ChainSwapResponse.prototype.setServerLockupTxid = function(value) {
  return jspb.Message.setProto3StringField(this, 8, value);
};


/**
 * optional string claim_txid = 9;
 * @return {string}
 */
proto.fulmine.v1.ChainSwapResponse.prototype.getClaimTxid = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 9, ""));
};


/**
 * @param {string} value
 * @return {!proto.fulmine.v1.ChainSwapResponse} returns this
 */
proto.fulmine.v1.ChainSwapResponse.prototype.setClaimTxid = function(value) {
  return jspb.Message.setProto3StringField(this, 9, value);
};


/**
 * optional string refund_txid = 10;
 * @return {string}
 */
proto.fulmine.v1.ChainSwapResponse.prototype.getRefundTxid = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 10, ""));
};


/**
 * @param {string} value
 * @return {!proto.fulmine.v1.ChainSwapResponse} returns this
 */
proto.fulmine.v1.ChainSwapResponse.prototype.setRefundTxid = function(value) {
  return jspb.Message.setProto3StringField(this, 10, value);
};


/**
 * optional string btc_address = 11;
 * @return {string}
 */
proto.fulmine.v1.ChainSwapResponse.prototype.getBtcAddress = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 11, ""));
};


/**
 * @param {string} value
 * @return {!proto.fulmine.v1.ChainSwapResponse} returns this
 */
proto.fulmine.v1.ChainSwapResponse.prototype.setBtcAddress = function(value) {
  return jspb.Message.setProto3StringField(this, 11, value);
};


/**
 * optional int64 timestamp = 12;
 * @return {number}
 */
proto.fulmine.v1.ChainSwapResponse.prototype.getTimestamp = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 12, 0));
};


/**
 * @param {number} value
 * @return {!proto.fulmine.v1.ChainSwapResponse} returns this
 */
proto.fulmine.v1.ChainSwapResponse.prototype.setTimestamp = function(value) {
  return jspb.Message.setProto3IntField(this, 12, value);
};


/**
 * optional string error_message = 13;
 * @return {string}
 */
proto.fulmine.v1.ChainSwapResponse.prototype.getErrorMessage = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 13, ""));
};


/**
 * @param {string} value
 * @return {!proto.fulmine.v1.ChainSwapResponse} returns this
 */
proto.fulmine.v1.ChainSwapResponse.prototype.setErrorMessage = function(value) {
  return jspb.Message.setProto3StringField(this, 13, value);
};



/**
 * List of repeated fields within this message type.
 * @private {!Array<number>}
 * @const
 */
proto.fulmine.v1.ListChainSwapsRequest.repeatedFields_ = [1];



if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.fulmine.v1.ListChainSwapsRequest.prototype.toObject = function(opt_includeInstance) {
  return proto.fulmine.v1.ListChainSwapsRequest.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.fulmine.v1.ListChainSwapsRequest} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.fulmine.v1.ListChainSwapsRequest.toObject = function(includeInstance, msg) {
  var f, obj = {
    swapIdsList: (f = jspb.Message.getRepeatedField(msg, 1)) == null ? undefined : f
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.fulmine.v1.ListChainSwapsRequest}
 */
proto.fulmine.v1.ListChainSwapsRequest.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.fulmine.v1.ListChainSwapsRequest;
  return proto.fulmine.v1.ListChainSwapsRequest.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.fulmine.v1.ListChainSwapsRequest} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.fulmine.v1.ListChainSwapsRequest}
 */
proto.fulmine.v1.ListChainSwapsRequest.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.addSwapIds(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.fulmine.v1.ListChainSwapsRequest.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.fulmine.v1.ListChainSwapsRequest.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.fulmine.v1.ListChainSwapsRequest} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.fulmine.v1.ListChainSwapsRequest.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getSwapIdsList();
  if (f.length > 0) {
    writer.writeRepeatedString(
      1,
      f
    );
  }
};


/**
 * repeated string swap_ids = 1;
 * @return {!Array<string>}
 */
proto.fulmine.v1.ListChainSwapsRequest.prototype.getSwapIdsList = function() {
  return /** @type {!Array<string>} */ (jspb.Message.getRepeatedField(this, 1));
};


/**
 * @param {!Array<string>} value
 * @return {!proto.fulmine.v1.ListChainSwapsRequest} returns this
 */
proto.fulmine.v1.ListChainSwapsRequest.prototype.setSwapIdsList = function(value) {
  return jspb.Message.setField(this, 1, value || []);
};


/**
 * @param {string} value
 * @param {number=} opt_index
 * @return {!proto.fulmine.v1.ListChainSwapsRequest} returns this
 */
proto.fulmine.v1.ListChainSwapsRequest.prototype.addSwapIds = function(value, opt_index) {
  return jspb.Message.addToRepeatedField(this, 1, value, opt_index);
};


/**
 * Clears the list making it empty but non-null.
 * @return {!proto.fulmine.v1.ListChainSwapsRequest} returns this
 */
proto.fulmine.v1.ListChainSwapsRequest.prototype.clearSwapIdsList = function() {
  return this.setSwapIdsList([]);
};



/**
 * List of repeated fields within this message type.
 * @private {!Array<number>}
 * @const
 */
proto.fulmine.v1.ListChainSwapsResponse.repeatedFields_ = [1];



if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.fulmine.v1.ListChainSwapsResponse.prototype.toObject = function(opt_includeInstance) {
  return proto.fulmine.v1.ListChainSwapsResponse.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.fulmine.v1.ListChainSwapsResponse} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.fulmine.v1.ListChainSwapsResponse.toObject = function(includeInstance, msg) {
  var f, obj = {
    swapsList: jspb.Message.toObjectList(msg.getSwapsList(),
    proto.fulmine.v1.ChainSwapResponse.toObject, includeInstance)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.fulmine.v1.ListChainSwapsResponse}
 */
proto.fulmine.v1.ListChainSwapsResponse.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.fulmine.v1.ListChainSwapsResponse;
  return proto.fulmine.v1.ListChainSwapsResponse.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.fulmine.v1.ListChainSwapsResponse} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.fulmine.v1.ListChainSwapsResponse}
 */
proto.fulmine.v1.ListChainSwapsResponse.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = new proto.fulmine.v1.ChainSwapResponse;
      reader.readMessage(value,proto.fulmine.v1.ChainSwapResponse.deserializeBinaryFromReader);
      msg.addSwaps(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.fulmine.v1.ListChainSwapsResponse.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.fulmine.v1.ListChainSwapsResponse.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.fulmine.v1.ListChainSwapsResponse} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.fulmine.v1.ListChainSwapsResponse.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getSwapsList();
  if (f.length > 0) {
    writer.writeRepeatedMessage(
      1,
      f,
      proto.fulmine.v1.ChainSwapResponse.serializeBinaryToWriter
    );
  }
};


/**
 * repeated ChainSwapResponse swaps = 1;
 * @return {!Array<!proto.fulmine.v1.ChainSwapResponse>}
 */
proto.fulmine.v1.ListChainSwapsResponse.prototype.getSwapsList = function() {
  return /** @type{!Array<!proto.fulmine.v1.ChainSwapResponse>} */ (
    jspb.Message.getRepeatedWrapperField(this, proto.fulmine.v1.ChainSwapResponse, 1));
};


/**
 * @param {!Array<!proto.fulmine.v1.ChainSwapResponse>} value
 * @return {!proto.fulmine.v1.ListChainSwapsResponse} returns this
*/
proto.fulmine.v1.ListChainSwapsResponse.prototype.setSwapsList = function(value) {
  return jspb.Message.setRepeatedWrapperField(this, 1, value);
};


/**
 * @param {!proto.fulmine.v1.ChainSwapResponse=} opt_value
 * @param {number=} opt_index
 * @return {!proto.fulmine.v1.ChainSwapResponse}
 */
proto.fulmine.v1.ListChainSwapsResponse.prototype.addSwaps = function(opt_value, opt_index) {
  return jspb.Message.addToRepeatedWrapperField(this, 1, opt_value, proto.fulmine.v1.ChainSwapResponse, opt_index);
};


/**
 * Clears the list making it empty but non-null.
 * @return {!proto.fulmine.v1.ListChainSwapsResponse} returns this
 */
proto.fulmine.v1.ListChainSwapsResponse.prototype.clearSwapsList = function() {
  return this.setSwapsList([]);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.fulmine.v1.RefundChainSwapRequest.prototype.toObject = function(opt_includeInstance) {
  return proto.fulmine.v1.RefundChainSwapRequest.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.fulmine.v1.RefundChainSwapRequest} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.fulmine.v1.RefundChainSwapRequest.toObject = function(includeInstance, msg) {
  var f, obj = {
    id: jspb.Message.getFieldWithDefault(msg, 1, "")
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.fulmine.v1.RefundChainSwapRequest}
 */
proto.fulmine.v1.RefundChainSwapRequest.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.fulmine.v1.RefundChainSwapRequest;
  return proto.fulmine.v1.RefundChainSwapRequest.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.fulmine.v1.RefundChainSwapRequest} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.fulmine.v1.RefundChainSwapRequest}
 */
proto.fulmine.v1.RefundChainSwapRequest.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setId(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.fulmine.v1.RefundChainSwapRequest.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.fulmine.v1.RefundChainSwapRequest.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.fulmine.v1.RefundChainSwapRequest} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.fulmine.v1.RefundChainSwapRequest.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getId();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
};


/**
 * optional string id = 1;
 * @return {string}
 */
proto.fulmine.v1.RefundChainSwapRequest.prototype.getId = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.fulmine.v1.RefundChainSwapRequest} returns this
 */
proto.fulmine.v1.RefundChainSwapRequest.prototype.setId = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.fulmine.v1.RefundChainSwapResponse.prototype.toObject = function(opt_includeInstance) {
  return proto.fulmine.v1.RefundChainSwapResponse.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.fulmine.v1.RefundChainSwapResponse} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.fulmine.v1.RefundChainSwapResponse.toObject = function(includeInstance, msg) {
  var f, obj = {
    message: jspb.Message.getFieldWithDefault(msg, 1, "")
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.fulmine.v1.RefundChainSwapResponse}
 */
proto.fulmine.v1.RefundChainSwapResponse.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.fulmine.v1.RefundChainSwapResponse;
  return proto.fulmine.v1.RefundChainSwapResponse.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.fulmine.v1.RefundChainSwapResponse} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.fulmine.v1.RefundChainSwapResponse}
 */
proto.fulmine.v1.RefundChainSwapResponse.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setMessage(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.fulmine.v1.RefundChainSwapResponse.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.fulmine.v1.RefundChainSwapResponse.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.fulmine.v1.RefundChainSwapResponse} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.fulmine.v1.RefundChainSwapResponse.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getMessage();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
};


/**
 * optional string message = 1;
 * @return {string}
 */
proto.fulmine.v1.RefundChainSwapResponse.prototype.getMessage = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.fulmine.v1.RefundChainSwapResponse} returns this
 */
proto.fulmine.v1.RefundChainSwapResponse.prototype.setMessage = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};



/**
 * List of repeated fields within this message type.
 * @private {!Array<number>}
 * @const
 */
proto.fulmine.v1.DelegateIntent.repeatedFields_ = [4];



if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.fulmine.v1.DelegateIntent.prototype.toObject = function(opt_includeInstance) {
  return proto.fulmine.v1.DelegateIntent.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.fulmine.v1.DelegateIntent} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.fulmine.v1.DelegateIntent.toObject = function(includeInstance, msg) {
  var f, obj = {
    txid: jspb.Message.getFieldWithDefault(msg, 1, ""),
    message: jspb.Message.getFieldWithDefault(msg, 2, ""),
    proof: jspb.Message.getFieldWithDefault(msg, 3, ""),
    inputsList: jspb.Message.toObjectList(msg.getInputsList(),
    ark_types_pb.Input.toObject, includeInstance)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.fulmine.v1.DelegateIntent}
 */
proto.fulmine.v1.DelegateIntent.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.fulmine.v1.DelegateIntent;
  return proto.fulmine.v1.DelegateIntent.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.fulmine.v1.DelegateIntent} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.fulmine.v1.DelegateIntent}
 */
proto.fulmine.v1.DelegateIntent.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setTxid(value);
      break;
    case 2:
      var value = /** @type {string} */ (reader.readString());
      msg.setMessage(value);
      break;
    case 3:
      var value = /** @type {string} */ (reader.readString());
      msg.setProof(value);
      break;
    case 4:
      var value = new ark_types_pb.Input;
      reader.readMessage(value,ark_types_pb.Input.deserializeBinaryFromReader);
      msg.addInputs(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.fulmine.v1.DelegateIntent.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.fulmine.v1.DelegateIntent.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.fulmine.v1.DelegateIntent} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.fulmine.v1.DelegateIntent.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getTxid();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
  f = message.getMessage();
  if (f.length > 0) {
    writer.writeString(
      2,
      f
    );
  }
  f = message.getProof();
  if (f.length > 0) {
    writer.writeString(
      3,
      f
    );
  }
  f = message.getInputsList();
  if (f.length > 0) {
    writer.writeRepeatedMessage(
      4,
      f,
      ark_types_pb.Input.serializeBinaryToWriter
    );
  }
};


/**
 * optional string txid = 1;
 * @return {string}
 */
proto.fulmine.v1.DelegateIntent.prototype.getTxid = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.fulmine.v1.DelegateIntent} returns this
 */
proto.fulmine.v1.DelegateIntent.prototype.setTxid = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};


/**
 * optional string message = 2;
 * @return {string}
 */
proto.fulmine.v1.DelegateIntent.prototype.getMessage = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 2, ""));
};


/**
 * @param {string} value
 * @return {!proto.fulmine.v1.DelegateIntent} returns this
 */
proto.fulmine.v1.DelegateIntent.prototype.setMessage = function(value) {
  return jspb.Message.setProto3StringField(this, 2, value);
};


/**
 * optional string proof = 3;
 * @return {string}
 */
proto.fulmine.v1.DelegateIntent.prototype.getProof = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 3, ""));
};


/**
 * @param {string} value
 * @return {!proto.fulmine.v1.DelegateIntent} returns this
 */
proto.fulmine.v1.DelegateIntent.prototype.setProof = function(value) {
  return jspb.Message.setProto3StringField(this, 3, value);
};


/**
 * repeated Input inputs = 4;
 * @return {!Array<!proto.fulmine.v1.Input>}
 */
proto.fulmine.v1.DelegateIntent.prototype.getInputsList = function() {
  return /** @type{!Array<!proto.fulmine.v1.Input>} */ (
    jspb.Message.getRepeatedWrapperField(this, ark_types_pb.Input, 4));
};


/**
 * @param {!Array<!proto.fulmine.v1.Input>} value
 * @return {!proto.fulmine.v1.DelegateIntent} returns this
*/
proto.fulmine.v1.DelegateIntent.prototype.setInputsList = function(value) {
  return jspb.Message.setRepeatedWrapperField(this, 4, value);
};


/**
 * @param {!proto.fulmine.v1.Input=} opt_value
 * @param {number=} opt_index
 * @return {!proto.fulmine.v1.Input}
 */
proto.fulmine.v1.DelegateIntent.prototype.addInputs = function(opt_value, opt_index) {
  return jspb.Message.addToRepeatedWrapperField(this, 4, opt_value, proto.fulmine.v1.Input, opt_index);
};


/**
 * Clears the list making it empty but non-null.
 * @return {!proto.fulmine.v1.DelegateIntent} returns this
 */
proto.fulmine.v1.DelegateIntent.prototype.clearInputsList = function() {
  return this.setInputsList([]);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.fulmine.v1.DelegateForfeitTx.prototype.toObject = function(opt_includeInstance) {
  return proto.fulmine.v1.DelegateForfeitTx.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.fulmine.v1.DelegateForfeitTx} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.fulmine.v1.DelegateForfeitTx.toObject = function(includeInstance, msg) {
  var f, obj = {
    input: (f = msg.getInput()) && ark_types_pb.Input.toObject(includeInstance, f),
    forfeitTx: jspb.Message.getFieldWithDefault(msg, 2, "")
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.fulmine.v1.DelegateForfeitTx}
 */
proto.fulmine.v1.DelegateForfeitTx.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.fulmine.v1.DelegateForfeitTx;
  return proto.fulmine.v1.DelegateForfeitTx.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.fulmine.v1.DelegateForfeitTx} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.fulmine.v1.DelegateForfeitTx}
 */
proto.fulmine.v1.DelegateForfeitTx.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = new ark_types_pb.Input;
      reader.readMessage(value,ark_types_pb.Input.deserializeBinaryFromReader);
      msg.setInput(value);
      break;
    case 2:
      var value = /** @type {string} */ (reader.readString());
      msg.setForfeitTx(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.fulmine.v1.DelegateForfeitTx.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.fulmine.v1.DelegateForfeitTx.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.fulmine.v1.DelegateForfeitTx} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.fulmine.v1.DelegateForfeitTx.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getInput();
  if (f != null) {
    writer.writeMessage(
      1,
      f,
      ark_types_pb.Input.serializeBinaryToWriter
    );
  }
  f = message.getForfeitTx();
  if (f.length > 0) {
    writer.writeString(
      2,
      f
    );
  }
};


/**
 * optional Input input = 1;
 * @return {?proto.fulmine.v1.Input}
 */
proto.fulmine.v1.DelegateForfeitTx.prototype.getInput = function() {
  return /** @type{?proto.fulmine.v1.Input} */ (
    jspb.Message.getWrapperField(this, ark_types_pb.Input, 1));
};


/**
 * @param {?proto.fulmine.v1.Input|undefined} value
 * @return {!proto.fulmine.v1.DelegateForfeitTx} returns this
*/
proto.fulmine.v1.DelegateForfeitTx.prototype.setInput = function(value) {
  return jspb.Message.setWrapperField(this, 1, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.fulmine.v1.DelegateForfeitTx} returns this
 */
proto.fulmine.v1.DelegateForfeitTx.prototype.clearInput = function() {
  return this.setInput(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.fulmine.v1.DelegateForfeitTx.prototype.hasInput = function() {
  return jspb.Message.getField(this, 1) != null;
};


/**
 * optional string forfeit_tx = 2;
 * @return {string}
 */
proto.fulmine.v1.DelegateForfeitTx.prototype.getForfeitTx = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 2, ""));
};


/**
 * @param {string} value
 * @return {!proto.fulmine.v1.DelegateForfeitTx} returns this
 */
proto.fulmine.v1.DelegateForfeitTx.prototype.setForfeitTx = function(value) {
  return jspb.Message.setProto3StringField(this, 2, value);
};



/**
 * List of repeated fields within this message type.
 * @private {!Array<number>}
 * @const
 */
proto.fulmine.v1.Delegate.repeatedFields_ = [3];



if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.fulmine.v1.Delegate.prototype.toObject = function(opt_includeInstance) {
  return proto.fulmine.v1.Delegate.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.fulmine.v1.Delegate} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.fulmine.v1.Delegate.toObject = function(includeInstance, msg) {
  var f, obj = {
    id: jspb.Message.getFieldWithDefault(msg, 1, ""),
    intent: (f = msg.getIntent()) && proto.fulmine.v1.DelegateIntent.toObject(includeInstance, f),
    forfeitTxsList: jspb.Message.toObjectList(msg.getForfeitTxsList(),
    proto.fulmine.v1.DelegateForfeitTx.toObject, includeInstance),
    fee: jspb.Message.getFieldWithDefault(msg, 4, 0),
    delegatorPublicKey: jspb.Message.getFieldWithDefault(msg, 5, ""),
    scheduledAt: jspb.Message.getFieldWithDefault(msg, 6, 0),
    status: jspb.Message.getFieldWithDefault(msg, 7, ""),
    failReason: jspb.Message.getFieldWithDefault(msg, 8, ""),
    commitmentTxid: jspb.Message.getFieldWithDefault(msg, 9, "")
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.fulmine.v1.Delegate}
 */
proto.fulmine.v1.Delegate.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.fulmine.v1.Delegate;
  return proto.fulmine.v1.Delegate.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.fulmine.v1.Delegate} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.fulmine.v1.Delegate}
 */
proto.fulmine.v1.Delegate.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setId(value);
      break;
    case 2:
      var value = new proto.fulmine.v1.DelegateIntent;
      reader.readMessage(value,proto.fulmine.v1.DelegateIntent.deserializeBinaryFromReader);
      msg.setIntent(value);
      break;
    case 3:
      var value = new proto.fulmine.v1.DelegateForfeitTx;
      reader.readMessage(value,proto.fulmine.v1.DelegateForfeitTx.deserializeBinaryFromReader);
      msg.addForfeitTxs(value);
      break;
    case 4:
      var value = /** @type {number} */ (reader.readUint64());
      msg.setFee(value);
      break;
    case 5:
      var value = /** @type {string} */ (reader.readString());
      msg.setDelegatorPublicKey(value);
      break;
    case 6:
      var value = /** @type {number} */ (reader.readInt64());
      msg.setScheduledAt(value);
      break;
    case 7:
      var value = /** @type {string} */ (reader.readString());
      msg.setStatus(value);
      break;
    case 8:
      var value = /** @type {string} */ (reader.readString());
      msg.setFailReason(value);
      break;
    case 9:
      var value = /** @type {string} */ (reader.readString());
      msg.setCommitmentTxid(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.fulmine.v1.Delegate.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.fulmine.v1.Delegate.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.fulmine.v1.Delegate} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.fulmine.v1.Delegate.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getId();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
  f = message.getIntent();
  if (f != null) {
    writer.writeMessage(
      2,
      f,
      proto.fulmine.v1.DelegateIntent.serializeBinaryToWriter
    );
  }
  f = message.getForfeitTxsList();
  if (f.length > 0) {
    writer.writeRepeatedMessage(
      3,
      f,
      proto.fulmine.v1.DelegateForfeitTx.serializeBinaryToWriter
    );
  }
  f = message.getFee();
  if (f !== 0) {
    writer.writeUint64(
      4,
      f
    );
  }
  f = message.getDelegatorPublicKey();
  if (f.length > 0) {
    writer.writeString(
      5,
      f
    );
  }
  f = message.getScheduledAt();
  if (f !== 0) {
    writer.writeInt64(
      6,
      f
    );
  }
  f = message.getStatus();
  if (f.length > 0) {
    writer.writeString(
      7,
      f
    );
  }
  f = message.getFailReason();
  if (f.length > 0) {
    writer.writeString(
      8,
      f
    );
  }
  f = message.getCommitmentTxid();
  if (f.length > 0) {
    writer.writeString(
      9,
      f
    );
  }
};


/**
 * optional string id = 1;
 * @return {string}
 */
proto.fulmine.v1.Delegate.prototype.getId = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.fulmine.v1.Delegate} returns this
 */
proto.fulmine.v1.Delegate.prototype.setId = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};


/**
 * optional DelegateIntent intent = 2;
 * @return {?proto.fulmine.v1.DelegateIntent}
 */
proto.fulmine.v1.Delegate.prototype.getIntent = function() {
  return /** @type{?proto.fulmine.v1.DelegateIntent} */ (
    jspb.Message.getWrapperField(this, proto.fulmine.v1.DelegateIntent, 2));
};


/**
 * @param {?proto.fulmine.v1.DelegateIntent|undefined} value
 * @return {!proto.fulmine.v1.Delegate} returns this
*/
proto.fulmine.v1.Delegate.prototype.setIntent = function(value) {
  return jspb.Message.setWrapperField(this, 2, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.fulmine.v1.Delegate} returns this
 */
proto.fulmine.v1.Delegate.prototype.clearIntent = function() {
  return this.setIntent(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.fulmine.v1.Delegate.prototype.hasIntent = function() {
  return jspb.Message.getField(this, 2) != null;
};


/**
 * repeated DelegateForfeitTx forfeit_txs = 3;
 * @return {!Array<!proto.fulmine.v1.DelegateForfeitTx>}
 */
proto.fulmine.v1.Delegate.prototype.getForfeitTxsList = function() {
  return /** @type{!Array<!proto.fulmine.v1.DelegateForfeitTx>} */ (
    jspb.Message.getRepeatedWrapperField(this, proto.fulmine.v1.DelegateForfeitTx, 3));
};


/**
 * @param {!Array<!proto.fulmine.v1.DelegateForfeitTx>} value
 * @return {!proto.fulmine.v1.Delegate} returns this
*/
proto.fulmine.v1.Delegate.prototype.setForfeitTxsList = function(value) {
  return jspb.Message.setRepeatedWrapperField(this, 3, value);
};


/**
 * @param {!proto.fulmine.v1.DelegateForfeitTx=} opt_value
 * @param {number=} opt_index
 * @return {!proto.fulmine.v1.DelegateForfeitTx}
 */
proto.fulmine.v1.Delegate.prototype.addForfeitTxs = function(opt_value, opt_index) {
  return jspb.Message.addToRepeatedWrapperField(this, 3, opt_value, proto.fulmine.v1.DelegateForfeitTx, opt_index);
};


/**
 * Clears the list making it empty but non-null.
 * @return {!proto.fulmine.v1.Delegate} returns this
 */
proto.fulmine.v1.Delegate.prototype.clearForfeitTxsList = function() {
  return this.setForfeitTxsList([]);
};


/**
 * optional uint64 fee = 4;
 * @return {number}
 */
proto.fulmine.v1.Delegate.prototype.getFee = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 4, 0));
};


/**
 * @param {number} value
 * @return {!proto.fulmine.v1.Delegate} returns this
 */
proto.fulmine.v1.Delegate.prototype.setFee = function(value) {
  return jspb.Message.setProto3IntField(this, 4, value);
};


/**
 * optional string delegator_public_key = 5;
 * @return {string}
 */
proto.fulmine.v1.Delegate.prototype.getDelegatorPublicKey = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 5, ""));
};


/**
 * @param {string} value
 * @return {!proto.fulmine.v1.Delegate} returns this
 */
proto.fulmine.v1.Delegate.prototype.setDelegatorPublicKey = function(value) {
  return jspb.Message.setProto3StringField(this, 5, value);
};


/**
 * optional int64 scheduled_at = 6;
 * @return {number}
 */
proto.fulmine.v1.Delegate.prototype.getScheduledAt = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 6, 0));
};


/**
 * @param {number} value
 * @return {!proto.fulmine.v1.Delegate} returns this
 */
proto.fulmine.v1.Delegate.prototype.setScheduledAt = function(value) {
  return jspb.Message.setProto3IntField(this, 6, value);
};


/**
 * optional string status = 7;
 * @return {string}
 */
proto.fulmine.v1.Delegate.prototype.getStatus = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 7, ""));
};


/**
 * @param {string} value
 * @return {!proto.fulmine.v1.Delegate} returns this
 */
proto.fulmine.v1.Delegate.prototype.setStatus = function(value) {
  return jspb.Message.setProto3StringField(this, 7, value);
};


/**
 * optional string fail_reason = 8;
 * @return {string}
 */
proto.fulmine.v1.Delegate.prototype.getFailReason = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 8, ""));
};


/**
 * @param {string} value
 * @return {!proto.fulmine.v1.Delegate} returns this
 */
proto.fulmine.v1.Delegate.prototype.setFailReason = function(value) {
  return jspb.Message.setProto3StringField(this, 8, value);
};


/**
 * optional string commitment_txid = 9;
 * @return {string}
 */
proto.fulmine.v1.Delegate.prototype.getCommitmentTxid = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 9, ""));
};


/**
 * @param {string} value
 * @return {!proto.fulmine.v1.Delegate} returns this
 */
proto.fulmine.v1.Delegate.prototype.setCommitmentTxid = function(value) {
  return jspb.Message.setProto3StringField(this, 9, value);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.fulmine.v1.ListDelegatesRequest.prototype.toObject = function(opt_includeInstance) {
  return proto.fulmine.v1.ListDelegatesRequest.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.fulmine.v1.ListDelegatesRequest} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.fulmine.v1.ListDelegatesRequest.toObject = function(includeInstance, msg) {
  var f, obj = {
    status: jspb.Message.getFieldWithDefault(msg, 1, ""),
    limit: jspb.Message.getFieldWithDefault(msg, 2, 0),
    offset: jspb.Message.getFieldWithDefault(msg, 3, 0)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.fulmine.v1.ListDelegatesRequest}
 */
proto.fulmine.v1.ListDelegatesRequest.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.fulmine.v1.ListDelegatesRequest;
  return proto.fulmine.v1.ListDelegatesRequest.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.fulmine.v1.ListDelegatesRequest} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.fulmine.v1.ListDelegatesRequest}
 */
proto.fulmine.v1.ListDelegatesRequest.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setStatus(value);
      break;
    case 2:
      var value = /** @type {number} */ (reader.readUint32());
      msg.setLimit(value);
      break;
    case 3:
      var value = /** @type {number} */ (reader.readUint32());
      msg.setOffset(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.fulmine.v1.ListDelegatesRequest.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.fulmine.v1.ListDelegatesRequest.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.fulmine.v1.ListDelegatesRequest} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.fulmine.v1.ListDelegatesRequest.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getStatus();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
  f = message.getLimit();
  if (f !== 0) {
    writer.writeUint32(
      2,
      f
    );
  }
  f = message.getOffset();
  if (f !== 0) {
    writer.writeUint32(
      3,
      f
    );
  }
};


/**
 * optional string status = 1;
 * @return {string}
 */
proto.fulmine.v1.ListDelegatesRequest.prototype.getStatus = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.fulmine.v1.ListDelegatesRequest} returns this
 */
proto.fulmine.v1.ListDelegatesRequest.prototype.setStatus = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};


/**
 * optional uint32 limit = 2;
 * @return {number}
 */
proto.fulmine.v1.ListDelegatesRequest.prototype.getLimit = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 2, 0));
};


/**
 * @param {number} value
 * @return {!proto.fulmine.v1.ListDelegatesRequest} returns this
 */
proto.fulmine.v1.ListDelegatesRequest.prototype.setLimit = function(value) {
  return jspb.Message.setProto3IntField(this, 2, value);
};


/**
 * optional uint32 offset = 3;
 * @return {number}
 */
proto.fulmine.v1.ListDelegatesRequest.prototype.getOffset = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 3, 0));
};


/**
 * @param {number} value
 * @return {!proto.fulmine.v1.ListDelegatesRequest} returns this
 */
proto.fulmine.v1.ListDelegatesRequest.prototype.setOffset = function(value) {
  return jspb.Message.setProto3IntField(this, 3, value);
};



/**
 * List of repeated fields within this message type.
 * @private {!Array<number>}
 * @const
 */
proto.fulmine.v1.ListDelegatesResponse.repeatedFields_ = [1];



if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.fulmine.v1.ListDelegatesResponse.prototype.toObject = function(opt_includeInstance) {
  return proto.fulmine.v1.ListDelegatesResponse.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.fulmine.v1.ListDelegatesResponse} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.fulmine.v1.ListDelegatesResponse.toObject = function(includeInstance, msg) {
  var f, obj = {
    delegatesList: jspb.Message.toObjectList(msg.getDelegatesList(),
    proto.fulmine.v1.Delegate.toObject, includeInstance)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.fulmine.v1.ListDelegatesResponse}
 */
proto.fulmine.v1.ListDelegatesResponse.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.fulmine.v1.ListDelegatesResponse;
  return proto.fulmine.v1.ListDelegatesResponse.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.fulmine.v1.ListDelegatesResponse} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.fulmine.v1.ListDelegatesResponse}
 */
proto.fulmine.v1.ListDelegatesResponse.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = new proto.fulmine.v1.Delegate;
      reader.readMessage(value,proto.fulmine.v1.Delegate.deserializeBinaryFromReader);
      msg.addDelegates(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.fulmine.v1.ListDelegatesResponse.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.fulmine.v1.ListDelegatesResponse.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.fulmine.v1.ListDelegatesResponse} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.fulmine.v1.ListDelegatesResponse.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getDelegatesList();
  if (f.length > 0) {
    writer.writeRepeatedMessage(
      1,
      f,
      proto.fulmine.v1.Delegate.serializeBinaryToWriter
    );
  }
};


/**
 * repeated Delegate delegates = 1;
 * @return {!Array<!proto.fulmine.v1.Delegate>}
 */
proto.fulmine.v1.ListDelegatesResponse.prototype.getDelegatesList = function() {
  return /** @type{!Array<!proto.fulmine.v1.Delegate>} */ (
    jspb.Message.getRepeatedWrapperField(this, proto.fulmine.v1.Delegate, 1));
};


/**
 * @param {!Array<!proto.fulmine.v1.Delegate>} value
 * @return {!proto.fulmine.v1.ListDelegatesResponse} returns this
*/
proto.fulmine.v1.ListDelegatesResponse.prototype.setDelegatesList = function(value) {
  return jspb.Message.setRepeatedWrapperField(this, 1, value);
};


/**
 * @param {!proto.fulmine.v1.Delegate=} opt_value
 * @param {number=} opt_index
 * @return {!proto.fulmine.v1.Delegate}
 */
proto.fulmine.v1.ListDelegatesResponse.prototype.addDelegates = function(opt_value, opt_index) {
  return jspb.Message.addToRepeatedWrapperField(this, 1, opt_value, proto.fulmine.v1.Delegate, opt_index);
};


/**
 * Clears the list making it empty but non-null.
 * @return {!proto.fulmine.v1.ListDelegatesResponse} returns this
 */
proto.fulmine.v1.ListDelegatesResponse.prototype.clearDelegatesList = function() {
  return this.setDelegatesList([]);
};


/**
 * @enum {number}
 */
proto.fulmine.v1.SwapDirection = {
  SWAP_DIRECTION_UNSPECIFIED: 0,
  SWAP_DIRECTION_ARK_TO_BTC: 1,
  SWAP_DIRECTION_BTC_TO_ARK: 2
};

goog.object.extend(exports, proto.fulmine.v1);
