// source: boltzrpc.proto
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

goog.exportSymbol('proto.boltzrpc.AddReferralRequest', null, global);
goog.exportSymbol('proto.boltzrpc.AddReferralResponse', null, global);
goog.exportSymbol('proto.boltzrpc.AllowRefundRequest', null, global);
goog.exportSymbol('proto.boltzrpc.AllowRefundResponse', null, global);
goog.exportSymbol('proto.boltzrpc.Balances', null, global);
goog.exportSymbol('proto.boltzrpc.Balances.LightningBalance', null, global);
goog.exportSymbol('proto.boltzrpc.Balances.WalletBalance', null, global);
goog.exportSymbol('proto.boltzrpc.CalculateTransactionFeeRequest', null, global);
goog.exportSymbol('proto.boltzrpc.CalculateTransactionFeeResponse', null, global);
goog.exportSymbol('proto.boltzrpc.CalculateTransactionFeeResponse.RelativeCase', null, global);
goog.exportSymbol('proto.boltzrpc.ChainInfo', null, global);
goog.exportSymbol('proto.boltzrpc.CurrencyInfo', null, global);
goog.exportSymbol('proto.boltzrpc.DeriveBlindingKeyRequest', null, global);
goog.exportSymbol('proto.boltzrpc.DeriveBlindingKeyResponse', null, global);
goog.exportSymbol('proto.boltzrpc.DeriveKeysRequest', null, global);
goog.exportSymbol('proto.boltzrpc.DeriveKeysResponse', null, global);
goog.exportSymbol('proto.boltzrpc.DevHeapDumpRequest', null, global);
goog.exportSymbol('proto.boltzrpc.DevHeapDumpResponse', null, global);
goog.exportSymbol('proto.boltzrpc.GetAddressRequest', null, global);
goog.exportSymbol('proto.boltzrpc.GetAddressResponse', null, global);
goog.exportSymbol('proto.boltzrpc.GetBalanceRequest', null, global);
goog.exportSymbol('proto.boltzrpc.GetBalanceResponse', null, global);
goog.exportSymbol('proto.boltzrpc.GetInfoRequest', null, global);
goog.exportSymbol('proto.boltzrpc.GetInfoResponse', null, global);
goog.exportSymbol('proto.boltzrpc.GetLabelRequest', null, global);
goog.exportSymbol('proto.boltzrpc.GetLabelResponse', null, global);
goog.exportSymbol('proto.boltzrpc.GetLockedFundsRequest', null, global);
goog.exportSymbol('proto.boltzrpc.GetLockedFundsResponse', null, global);
goog.exportSymbol('proto.boltzrpc.GetPendingSweepsRequest', null, global);
goog.exportSymbol('proto.boltzrpc.GetPendingSweepsResponse', null, global);
goog.exportSymbol('proto.boltzrpc.GetReferralsRequest', null, global);
goog.exportSymbol('proto.boltzrpc.GetReferralsResponse', null, global);
goog.exportSymbol('proto.boltzrpc.GetReferralsResponse.Referral', null, global);
goog.exportSymbol('proto.boltzrpc.LightningInfo', null, global);
goog.exportSymbol('proto.boltzrpc.LightningInfo.Channels', null, global);
goog.exportSymbol('proto.boltzrpc.ListSwapsRequest', null, global);
goog.exportSymbol('proto.boltzrpc.ListSwapsResponse', null, global);
goog.exportSymbol('proto.boltzrpc.LockedFund', null, global);
goog.exportSymbol('proto.boltzrpc.LockedFunds', null, global);
goog.exportSymbol('proto.boltzrpc.LogLevel', null, global);
goog.exportSymbol('proto.boltzrpc.OutputType', null, global);
goog.exportSymbol('proto.boltzrpc.PendingSweep', null, global);
goog.exportSymbol('proto.boltzrpc.PendingSweeps', null, global);
goog.exportSymbol('proto.boltzrpc.RescanRequest', null, global);
goog.exportSymbol('proto.boltzrpc.RescanResponse', null, global);
goog.exportSymbol('proto.boltzrpc.SendCoinsRequest', null, global);
goog.exportSymbol('proto.boltzrpc.SendCoinsResponse', null, global);
goog.exportSymbol('proto.boltzrpc.SetLogLevelRequest', null, global);
goog.exportSymbol('proto.boltzrpc.SetLogLevelResponse', null, global);
goog.exportSymbol('proto.boltzrpc.SetReferralRequest', null, global);
goog.exportSymbol('proto.boltzrpc.SetReferralResponse', null, global);
goog.exportSymbol('proto.boltzrpc.SetSwapStatusRequest', null, global);
goog.exportSymbol('proto.boltzrpc.SetSwapStatusResponse', null, global);
goog.exportSymbol('proto.boltzrpc.StopRequest', null, global);
goog.exportSymbol('proto.boltzrpc.StopResponse', null, global);
goog.exportSymbol('proto.boltzrpc.SweepSwapsRequest', null, global);
goog.exportSymbol('proto.boltzrpc.SweepSwapsResponse', null, global);
goog.exportSymbol('proto.boltzrpc.SweepSwapsResponse.ClaimedSwaps', null, global);
goog.exportSymbol('proto.boltzrpc.UnblindOutputsRequest', null, global);
goog.exportSymbol('proto.boltzrpc.UnblindOutputsRequest.TransactionCase', null, global);
goog.exportSymbol('proto.boltzrpc.UnblindOutputsResponse', null, global);
goog.exportSymbol('proto.boltzrpc.UnblindOutputsResponse.UnblindedOutput', null, global);
goog.exportSymbol('proto.boltzrpc.UpdateTimeoutBlockDeltaRequest', null, global);
goog.exportSymbol('proto.boltzrpc.UpdateTimeoutBlockDeltaResponse', null, global);
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
proto.boltzrpc.StopRequest = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.boltzrpc.StopRequest, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.boltzrpc.StopRequest.displayName = 'proto.boltzrpc.StopRequest';
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
proto.boltzrpc.StopResponse = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.boltzrpc.StopResponse, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.boltzrpc.StopResponse.displayName = 'proto.boltzrpc.StopResponse';
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
proto.boltzrpc.GetInfoRequest = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.boltzrpc.GetInfoRequest, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.boltzrpc.GetInfoRequest.displayName = 'proto.boltzrpc.GetInfoRequest';
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
proto.boltzrpc.GetInfoResponse = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.boltzrpc.GetInfoResponse, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.boltzrpc.GetInfoResponse.displayName = 'proto.boltzrpc.GetInfoResponse';
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
proto.boltzrpc.CurrencyInfo = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.boltzrpc.CurrencyInfo, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.boltzrpc.CurrencyInfo.displayName = 'proto.boltzrpc.CurrencyInfo';
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
proto.boltzrpc.ChainInfo = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.boltzrpc.ChainInfo, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.boltzrpc.ChainInfo.displayName = 'proto.boltzrpc.ChainInfo';
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
proto.boltzrpc.LightningInfo = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.boltzrpc.LightningInfo, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.boltzrpc.LightningInfo.displayName = 'proto.boltzrpc.LightningInfo';
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
proto.boltzrpc.LightningInfo.Channels = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.boltzrpc.LightningInfo.Channels, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.boltzrpc.LightningInfo.Channels.displayName = 'proto.boltzrpc.LightningInfo.Channels';
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
proto.boltzrpc.GetBalanceRequest = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.boltzrpc.GetBalanceRequest, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.boltzrpc.GetBalanceRequest.displayName = 'proto.boltzrpc.GetBalanceRequest';
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
proto.boltzrpc.GetBalanceResponse = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.boltzrpc.GetBalanceResponse, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.boltzrpc.GetBalanceResponse.displayName = 'proto.boltzrpc.GetBalanceResponse';
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
proto.boltzrpc.Balances = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.boltzrpc.Balances, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.boltzrpc.Balances.displayName = 'proto.boltzrpc.Balances';
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
proto.boltzrpc.Balances.WalletBalance = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.boltzrpc.Balances.WalletBalance, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.boltzrpc.Balances.WalletBalance.displayName = 'proto.boltzrpc.Balances.WalletBalance';
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
proto.boltzrpc.Balances.LightningBalance = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.boltzrpc.Balances.LightningBalance, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.boltzrpc.Balances.LightningBalance.displayName = 'proto.boltzrpc.Balances.LightningBalance';
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
proto.boltzrpc.DeriveKeysRequest = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.boltzrpc.DeriveKeysRequest, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.boltzrpc.DeriveKeysRequest.displayName = 'proto.boltzrpc.DeriveKeysRequest';
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
proto.boltzrpc.DeriveKeysResponse = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.boltzrpc.DeriveKeysResponse, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.boltzrpc.DeriveKeysResponse.displayName = 'proto.boltzrpc.DeriveKeysResponse';
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
proto.boltzrpc.DeriveBlindingKeyRequest = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.boltzrpc.DeriveBlindingKeyRequest, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.boltzrpc.DeriveBlindingKeyRequest.displayName = 'proto.boltzrpc.DeriveBlindingKeyRequest';
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
proto.boltzrpc.DeriveBlindingKeyResponse = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.boltzrpc.DeriveBlindingKeyResponse, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.boltzrpc.DeriveBlindingKeyResponse.displayName = 'proto.boltzrpc.DeriveBlindingKeyResponse';
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
proto.boltzrpc.UnblindOutputsRequest = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, proto.boltzrpc.UnblindOutputsRequest.oneofGroups_);
};
goog.inherits(proto.boltzrpc.UnblindOutputsRequest, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.boltzrpc.UnblindOutputsRequest.displayName = 'proto.boltzrpc.UnblindOutputsRequest';
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
proto.boltzrpc.UnblindOutputsResponse = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, proto.boltzrpc.UnblindOutputsResponse.repeatedFields_, null);
};
goog.inherits(proto.boltzrpc.UnblindOutputsResponse, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.boltzrpc.UnblindOutputsResponse.displayName = 'proto.boltzrpc.UnblindOutputsResponse';
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
proto.boltzrpc.UnblindOutputsResponse.UnblindedOutput = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.boltzrpc.UnblindOutputsResponse.UnblindedOutput, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.boltzrpc.UnblindOutputsResponse.UnblindedOutput.displayName = 'proto.boltzrpc.UnblindOutputsResponse.UnblindedOutput';
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
proto.boltzrpc.GetAddressRequest = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.boltzrpc.GetAddressRequest, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.boltzrpc.GetAddressRequest.displayName = 'proto.boltzrpc.GetAddressRequest';
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
proto.boltzrpc.GetAddressResponse = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.boltzrpc.GetAddressResponse, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.boltzrpc.GetAddressResponse.displayName = 'proto.boltzrpc.GetAddressResponse';
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
proto.boltzrpc.SendCoinsRequest = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.boltzrpc.SendCoinsRequest, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.boltzrpc.SendCoinsRequest.displayName = 'proto.boltzrpc.SendCoinsRequest';
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
proto.boltzrpc.SendCoinsResponse = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.boltzrpc.SendCoinsResponse, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.boltzrpc.SendCoinsResponse.displayName = 'proto.boltzrpc.SendCoinsResponse';
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
proto.boltzrpc.UpdateTimeoutBlockDeltaRequest = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.boltzrpc.UpdateTimeoutBlockDeltaRequest, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.boltzrpc.UpdateTimeoutBlockDeltaRequest.displayName = 'proto.boltzrpc.UpdateTimeoutBlockDeltaRequest';
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
proto.boltzrpc.UpdateTimeoutBlockDeltaResponse = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.boltzrpc.UpdateTimeoutBlockDeltaResponse, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.boltzrpc.UpdateTimeoutBlockDeltaResponse.displayName = 'proto.boltzrpc.UpdateTimeoutBlockDeltaResponse';
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
proto.boltzrpc.AddReferralRequest = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.boltzrpc.AddReferralRequest, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.boltzrpc.AddReferralRequest.displayName = 'proto.boltzrpc.AddReferralRequest';
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
proto.boltzrpc.AddReferralResponse = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.boltzrpc.AddReferralResponse, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.boltzrpc.AddReferralResponse.displayName = 'proto.boltzrpc.AddReferralResponse';
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
proto.boltzrpc.SweepSwapsRequest = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.boltzrpc.SweepSwapsRequest, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.boltzrpc.SweepSwapsRequest.displayName = 'proto.boltzrpc.SweepSwapsRequest';
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
proto.boltzrpc.SweepSwapsResponse = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.boltzrpc.SweepSwapsResponse, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.boltzrpc.SweepSwapsResponse.displayName = 'proto.boltzrpc.SweepSwapsResponse';
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
proto.boltzrpc.SweepSwapsResponse.ClaimedSwaps = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, proto.boltzrpc.SweepSwapsResponse.ClaimedSwaps.repeatedFields_, null);
};
goog.inherits(proto.boltzrpc.SweepSwapsResponse.ClaimedSwaps, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.boltzrpc.SweepSwapsResponse.ClaimedSwaps.displayName = 'proto.boltzrpc.SweepSwapsResponse.ClaimedSwaps';
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
proto.boltzrpc.ListSwapsRequest = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.boltzrpc.ListSwapsRequest, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.boltzrpc.ListSwapsRequest.displayName = 'proto.boltzrpc.ListSwapsRequest';
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
proto.boltzrpc.ListSwapsResponse = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, proto.boltzrpc.ListSwapsResponse.repeatedFields_, null);
};
goog.inherits(proto.boltzrpc.ListSwapsResponse, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.boltzrpc.ListSwapsResponse.displayName = 'proto.boltzrpc.ListSwapsResponse';
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
proto.boltzrpc.RescanRequest = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.boltzrpc.RescanRequest, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.boltzrpc.RescanRequest.displayName = 'proto.boltzrpc.RescanRequest';
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
proto.boltzrpc.RescanResponse = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.boltzrpc.RescanResponse, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.boltzrpc.RescanResponse.displayName = 'proto.boltzrpc.RescanResponse';
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
proto.boltzrpc.SetSwapStatusRequest = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.boltzrpc.SetSwapStatusRequest, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.boltzrpc.SetSwapStatusRequest.displayName = 'proto.boltzrpc.SetSwapStatusRequest';
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
proto.boltzrpc.SetSwapStatusResponse = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.boltzrpc.SetSwapStatusResponse, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.boltzrpc.SetSwapStatusResponse.displayName = 'proto.boltzrpc.SetSwapStatusResponse';
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
proto.boltzrpc.AllowRefundRequest = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.boltzrpc.AllowRefundRequest, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.boltzrpc.AllowRefundRequest.displayName = 'proto.boltzrpc.AllowRefundRequest';
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
proto.boltzrpc.AllowRefundResponse = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.boltzrpc.AllowRefundResponse, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.boltzrpc.AllowRefundResponse.displayName = 'proto.boltzrpc.AllowRefundResponse';
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
proto.boltzrpc.GetLabelRequest = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.boltzrpc.GetLabelRequest, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.boltzrpc.GetLabelRequest.displayName = 'proto.boltzrpc.GetLabelRequest';
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
proto.boltzrpc.GetLabelResponse = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.boltzrpc.GetLabelResponse, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.boltzrpc.GetLabelResponse.displayName = 'proto.boltzrpc.GetLabelResponse';
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
proto.boltzrpc.GetReferralsRequest = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.boltzrpc.GetReferralsRequest, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.boltzrpc.GetReferralsRequest.displayName = 'proto.boltzrpc.GetReferralsRequest';
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
proto.boltzrpc.GetReferralsResponse = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, proto.boltzrpc.GetReferralsResponse.repeatedFields_, null);
};
goog.inherits(proto.boltzrpc.GetReferralsResponse, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.boltzrpc.GetReferralsResponse.displayName = 'proto.boltzrpc.GetReferralsResponse';
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
proto.boltzrpc.GetReferralsResponse.Referral = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.boltzrpc.GetReferralsResponse.Referral, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.boltzrpc.GetReferralsResponse.Referral.displayName = 'proto.boltzrpc.GetReferralsResponse.Referral';
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
proto.boltzrpc.SetReferralRequest = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.boltzrpc.SetReferralRequest, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.boltzrpc.SetReferralRequest.displayName = 'proto.boltzrpc.SetReferralRequest';
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
proto.boltzrpc.SetReferralResponse = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.boltzrpc.SetReferralResponse, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.boltzrpc.SetReferralResponse.displayName = 'proto.boltzrpc.SetReferralResponse';
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
proto.boltzrpc.DevHeapDumpRequest = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.boltzrpc.DevHeapDumpRequest, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.boltzrpc.DevHeapDumpRequest.displayName = 'proto.boltzrpc.DevHeapDumpRequest';
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
proto.boltzrpc.DevHeapDumpResponse = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.boltzrpc.DevHeapDumpResponse, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.boltzrpc.DevHeapDumpResponse.displayName = 'proto.boltzrpc.DevHeapDumpResponse';
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
proto.boltzrpc.LockedFund = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.boltzrpc.LockedFund, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.boltzrpc.LockedFund.displayName = 'proto.boltzrpc.LockedFund';
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
proto.boltzrpc.LockedFunds = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, proto.boltzrpc.LockedFunds.repeatedFields_, null);
};
goog.inherits(proto.boltzrpc.LockedFunds, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.boltzrpc.LockedFunds.displayName = 'proto.boltzrpc.LockedFunds';
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
proto.boltzrpc.GetLockedFundsRequest = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.boltzrpc.GetLockedFundsRequest, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.boltzrpc.GetLockedFundsRequest.displayName = 'proto.boltzrpc.GetLockedFundsRequest';
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
proto.boltzrpc.GetLockedFundsResponse = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.boltzrpc.GetLockedFundsResponse, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.boltzrpc.GetLockedFundsResponse.displayName = 'proto.boltzrpc.GetLockedFundsResponse';
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
proto.boltzrpc.PendingSweep = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.boltzrpc.PendingSweep, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.boltzrpc.PendingSweep.displayName = 'proto.boltzrpc.PendingSweep';
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
proto.boltzrpc.CalculateTransactionFeeRequest = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.boltzrpc.CalculateTransactionFeeRequest, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.boltzrpc.CalculateTransactionFeeRequest.displayName = 'proto.boltzrpc.CalculateTransactionFeeRequest';
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
proto.boltzrpc.CalculateTransactionFeeResponse = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, proto.boltzrpc.CalculateTransactionFeeResponse.oneofGroups_);
};
goog.inherits(proto.boltzrpc.CalculateTransactionFeeResponse, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.boltzrpc.CalculateTransactionFeeResponse.displayName = 'proto.boltzrpc.CalculateTransactionFeeResponse';
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
proto.boltzrpc.SetLogLevelRequest = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.boltzrpc.SetLogLevelRequest, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.boltzrpc.SetLogLevelRequest.displayName = 'proto.boltzrpc.SetLogLevelRequest';
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
proto.boltzrpc.SetLogLevelResponse = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.boltzrpc.SetLogLevelResponse, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.boltzrpc.SetLogLevelResponse.displayName = 'proto.boltzrpc.SetLogLevelResponse';
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
proto.boltzrpc.PendingSweeps = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, proto.boltzrpc.PendingSweeps.repeatedFields_, null);
};
goog.inherits(proto.boltzrpc.PendingSweeps, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.boltzrpc.PendingSweeps.displayName = 'proto.boltzrpc.PendingSweeps';
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
proto.boltzrpc.GetPendingSweepsRequest = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.boltzrpc.GetPendingSweepsRequest, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.boltzrpc.GetPendingSweepsRequest.displayName = 'proto.boltzrpc.GetPendingSweepsRequest';
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
proto.boltzrpc.GetPendingSweepsResponse = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.boltzrpc.GetPendingSweepsResponse, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.boltzrpc.GetPendingSweepsResponse.displayName = 'proto.boltzrpc.GetPendingSweepsResponse';
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
proto.boltzrpc.StopRequest.prototype.toObject = function(opt_includeInstance) {
  return proto.boltzrpc.StopRequest.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.boltzrpc.StopRequest} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.boltzrpc.StopRequest.toObject = function(includeInstance, msg) {
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
 * @return {!proto.boltzrpc.StopRequest}
 */
proto.boltzrpc.StopRequest.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.boltzrpc.StopRequest;
  return proto.boltzrpc.StopRequest.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.boltzrpc.StopRequest} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.boltzrpc.StopRequest}
 */
proto.boltzrpc.StopRequest.deserializeBinaryFromReader = function(msg, reader) {
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
proto.boltzrpc.StopRequest.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.boltzrpc.StopRequest.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.boltzrpc.StopRequest} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.boltzrpc.StopRequest.serializeBinaryToWriter = function(message, writer) {
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
proto.boltzrpc.StopResponse.prototype.toObject = function(opt_includeInstance) {
  return proto.boltzrpc.StopResponse.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.boltzrpc.StopResponse} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.boltzrpc.StopResponse.toObject = function(includeInstance, msg) {
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
 * @return {!proto.boltzrpc.StopResponse}
 */
proto.boltzrpc.StopResponse.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.boltzrpc.StopResponse;
  return proto.boltzrpc.StopResponse.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.boltzrpc.StopResponse} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.boltzrpc.StopResponse}
 */
proto.boltzrpc.StopResponse.deserializeBinaryFromReader = function(msg, reader) {
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
proto.boltzrpc.StopResponse.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.boltzrpc.StopResponse.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.boltzrpc.StopResponse} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.boltzrpc.StopResponse.serializeBinaryToWriter = function(message, writer) {
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
proto.boltzrpc.GetInfoRequest.prototype.toObject = function(opt_includeInstance) {
  return proto.boltzrpc.GetInfoRequest.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.boltzrpc.GetInfoRequest} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.boltzrpc.GetInfoRequest.toObject = function(includeInstance, msg) {
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
 * @return {!proto.boltzrpc.GetInfoRequest}
 */
proto.boltzrpc.GetInfoRequest.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.boltzrpc.GetInfoRequest;
  return proto.boltzrpc.GetInfoRequest.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.boltzrpc.GetInfoRequest} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.boltzrpc.GetInfoRequest}
 */
proto.boltzrpc.GetInfoRequest.deserializeBinaryFromReader = function(msg, reader) {
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
proto.boltzrpc.GetInfoRequest.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.boltzrpc.GetInfoRequest.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.boltzrpc.GetInfoRequest} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.boltzrpc.GetInfoRequest.serializeBinaryToWriter = function(message, writer) {
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
proto.boltzrpc.GetInfoResponse.prototype.toObject = function(opt_includeInstance) {
  return proto.boltzrpc.GetInfoResponse.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.boltzrpc.GetInfoResponse} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.boltzrpc.GetInfoResponse.toObject = function(includeInstance, msg) {
  var f, obj = {
    version: jspb.Message.getFieldWithDefault(msg, 1, ""),
    chainsMap: (f = msg.getChainsMap()) ? f.toObject(includeInstance, proto.boltzrpc.CurrencyInfo.toObject) : []
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
 * @return {!proto.boltzrpc.GetInfoResponse}
 */
proto.boltzrpc.GetInfoResponse.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.boltzrpc.GetInfoResponse;
  return proto.boltzrpc.GetInfoResponse.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.boltzrpc.GetInfoResponse} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.boltzrpc.GetInfoResponse}
 */
proto.boltzrpc.GetInfoResponse.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setVersion(value);
      break;
    case 2:
      var value = msg.getChainsMap();
      reader.readMessage(value, function(message, reader) {
        jspb.Map.deserializeBinary(message, reader, jspb.BinaryReader.prototype.readString, jspb.BinaryReader.prototype.readMessage, proto.boltzrpc.CurrencyInfo.deserializeBinaryFromReader, "", new proto.boltzrpc.CurrencyInfo());
         });
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
proto.boltzrpc.GetInfoResponse.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.boltzrpc.GetInfoResponse.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.boltzrpc.GetInfoResponse} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.boltzrpc.GetInfoResponse.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getVersion();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
  f = message.getChainsMap(true);
  if (f && f.getLength() > 0) {
    f.serializeBinary(2, writer, jspb.BinaryWriter.prototype.writeString, jspb.BinaryWriter.prototype.writeMessage, proto.boltzrpc.CurrencyInfo.serializeBinaryToWriter);
  }
};


/**
 * optional string version = 1;
 * @return {string}
 */
proto.boltzrpc.GetInfoResponse.prototype.getVersion = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.boltzrpc.GetInfoResponse} returns this
 */
proto.boltzrpc.GetInfoResponse.prototype.setVersion = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};


/**
 * map<string, CurrencyInfo> chains = 2;
 * @param {boolean=} opt_noLazyCreate Do not create the map if
 * empty, instead returning `undefined`
 * @return {!jspb.Map<string,!proto.boltzrpc.CurrencyInfo>}
 */
proto.boltzrpc.GetInfoResponse.prototype.getChainsMap = function(opt_noLazyCreate) {
  return /** @type {!jspb.Map<string,!proto.boltzrpc.CurrencyInfo>} */ (
      jspb.Message.getMapField(this, 2, opt_noLazyCreate,
      proto.boltzrpc.CurrencyInfo));
};


/**
 * Clears values from the map. The map will be non-null.
 * @return {!proto.boltzrpc.GetInfoResponse} returns this
 */
proto.boltzrpc.GetInfoResponse.prototype.clearChainsMap = function() {
  this.getChainsMap().clear();
  return this;};





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
proto.boltzrpc.CurrencyInfo.prototype.toObject = function(opt_includeInstance) {
  return proto.boltzrpc.CurrencyInfo.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.boltzrpc.CurrencyInfo} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.boltzrpc.CurrencyInfo.toObject = function(includeInstance, msg) {
  var f, obj = {
    chain: (f = msg.getChain()) && proto.boltzrpc.ChainInfo.toObject(includeInstance, f),
    lightningMap: (f = msg.getLightningMap()) ? f.toObject(includeInstance, proto.boltzrpc.LightningInfo.toObject) : []
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
 * @return {!proto.boltzrpc.CurrencyInfo}
 */
proto.boltzrpc.CurrencyInfo.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.boltzrpc.CurrencyInfo;
  return proto.boltzrpc.CurrencyInfo.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.boltzrpc.CurrencyInfo} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.boltzrpc.CurrencyInfo}
 */
proto.boltzrpc.CurrencyInfo.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = new proto.boltzrpc.ChainInfo;
      reader.readMessage(value,proto.boltzrpc.ChainInfo.deserializeBinaryFromReader);
      msg.setChain(value);
      break;
    case 2:
      var value = msg.getLightningMap();
      reader.readMessage(value, function(message, reader) {
        jspb.Map.deserializeBinary(message, reader, jspb.BinaryReader.prototype.readString, jspb.BinaryReader.prototype.readMessage, proto.boltzrpc.LightningInfo.deserializeBinaryFromReader, "", new proto.boltzrpc.LightningInfo());
         });
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
proto.boltzrpc.CurrencyInfo.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.boltzrpc.CurrencyInfo.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.boltzrpc.CurrencyInfo} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.boltzrpc.CurrencyInfo.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getChain();
  if (f != null) {
    writer.writeMessage(
      1,
      f,
      proto.boltzrpc.ChainInfo.serializeBinaryToWriter
    );
  }
  f = message.getLightningMap(true);
  if (f && f.getLength() > 0) {
    f.serializeBinary(2, writer, jspb.BinaryWriter.prototype.writeString, jspb.BinaryWriter.prototype.writeMessage, proto.boltzrpc.LightningInfo.serializeBinaryToWriter);
  }
};


/**
 * optional ChainInfo chain = 1;
 * @return {?proto.boltzrpc.ChainInfo}
 */
proto.boltzrpc.CurrencyInfo.prototype.getChain = function() {
  return /** @type{?proto.boltzrpc.ChainInfo} */ (
    jspb.Message.getWrapperField(this, proto.boltzrpc.ChainInfo, 1));
};


/**
 * @param {?proto.boltzrpc.ChainInfo|undefined} value
 * @return {!proto.boltzrpc.CurrencyInfo} returns this
*/
proto.boltzrpc.CurrencyInfo.prototype.setChain = function(value) {
  return jspb.Message.setWrapperField(this, 1, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.boltzrpc.CurrencyInfo} returns this
 */
proto.boltzrpc.CurrencyInfo.prototype.clearChain = function() {
  return this.setChain(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.boltzrpc.CurrencyInfo.prototype.hasChain = function() {
  return jspb.Message.getField(this, 1) != null;
};


/**
 * map<string, LightningInfo> lightning = 2;
 * @param {boolean=} opt_noLazyCreate Do not create the map if
 * empty, instead returning `undefined`
 * @return {!jspb.Map<string,!proto.boltzrpc.LightningInfo>}
 */
proto.boltzrpc.CurrencyInfo.prototype.getLightningMap = function(opt_noLazyCreate) {
  return /** @type {!jspb.Map<string,!proto.boltzrpc.LightningInfo>} */ (
      jspb.Message.getMapField(this, 2, opt_noLazyCreate,
      proto.boltzrpc.LightningInfo));
};


/**
 * Clears values from the map. The map will be non-null.
 * @return {!proto.boltzrpc.CurrencyInfo} returns this
 */
proto.boltzrpc.CurrencyInfo.prototype.clearLightningMap = function() {
  this.getLightningMap().clear();
  return this;};





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
proto.boltzrpc.ChainInfo.prototype.toObject = function(opt_includeInstance) {
  return proto.boltzrpc.ChainInfo.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.boltzrpc.ChainInfo} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.boltzrpc.ChainInfo.toObject = function(includeInstance, msg) {
  var f, obj = {
    version: jspb.Message.getFieldWithDefault(msg, 1, 0),
    blocks: jspb.Message.getFieldWithDefault(msg, 2, 0),
    scannedBlocks: jspb.Message.getFieldWithDefault(msg, 3, 0),
    connections: jspb.Message.getFieldWithDefault(msg, 4, 0),
    error: jspb.Message.getFieldWithDefault(msg, 5, "")
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
 * @return {!proto.boltzrpc.ChainInfo}
 */
proto.boltzrpc.ChainInfo.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.boltzrpc.ChainInfo;
  return proto.boltzrpc.ChainInfo.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.boltzrpc.ChainInfo} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.boltzrpc.ChainInfo}
 */
proto.boltzrpc.ChainInfo.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {number} */ (reader.readUint32());
      msg.setVersion(value);
      break;
    case 2:
      var value = /** @type {number} */ (reader.readUint64());
      msg.setBlocks(value);
      break;
    case 3:
      var value = /** @type {number} */ (reader.readUint64());
      msg.setScannedBlocks(value);
      break;
    case 4:
      var value = /** @type {number} */ (reader.readUint64());
      msg.setConnections(value);
      break;
    case 5:
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
proto.boltzrpc.ChainInfo.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.boltzrpc.ChainInfo.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.boltzrpc.ChainInfo} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.boltzrpc.ChainInfo.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getVersion();
  if (f !== 0) {
    writer.writeUint32(
      1,
      f
    );
  }
  f = message.getBlocks();
  if (f !== 0) {
    writer.writeUint64(
      2,
      f
    );
  }
  f = message.getScannedBlocks();
  if (f !== 0) {
    writer.writeUint64(
      3,
      f
    );
  }
  f = message.getConnections();
  if (f !== 0) {
    writer.writeUint64(
      4,
      f
    );
  }
  f = message.getError();
  if (f.length > 0) {
    writer.writeString(
      5,
      f
    );
  }
};


/**
 * optional uint32 version = 1;
 * @return {number}
 */
proto.boltzrpc.ChainInfo.prototype.getVersion = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 1, 0));
};


/**
 * @param {number} value
 * @return {!proto.boltzrpc.ChainInfo} returns this
 */
proto.boltzrpc.ChainInfo.prototype.setVersion = function(value) {
  return jspb.Message.setProto3IntField(this, 1, value);
};


/**
 * optional uint64 blocks = 2;
 * @return {number}
 */
proto.boltzrpc.ChainInfo.prototype.getBlocks = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 2, 0));
};


/**
 * @param {number} value
 * @return {!proto.boltzrpc.ChainInfo} returns this
 */
proto.boltzrpc.ChainInfo.prototype.setBlocks = function(value) {
  return jspb.Message.setProto3IntField(this, 2, value);
};


/**
 * optional uint64 scanned_blocks = 3;
 * @return {number}
 */
proto.boltzrpc.ChainInfo.prototype.getScannedBlocks = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 3, 0));
};


/**
 * @param {number} value
 * @return {!proto.boltzrpc.ChainInfo} returns this
 */
proto.boltzrpc.ChainInfo.prototype.setScannedBlocks = function(value) {
  return jspb.Message.setProto3IntField(this, 3, value);
};


/**
 * optional uint64 connections = 4;
 * @return {number}
 */
proto.boltzrpc.ChainInfo.prototype.getConnections = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 4, 0));
};


/**
 * @param {number} value
 * @return {!proto.boltzrpc.ChainInfo} returns this
 */
proto.boltzrpc.ChainInfo.prototype.setConnections = function(value) {
  return jspb.Message.setProto3IntField(this, 4, value);
};


/**
 * optional string error = 5;
 * @return {string}
 */
proto.boltzrpc.ChainInfo.prototype.getError = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 5, ""));
};


/**
 * @param {string} value
 * @return {!proto.boltzrpc.ChainInfo} returns this
 */
proto.boltzrpc.ChainInfo.prototype.setError = function(value) {
  return jspb.Message.setProto3StringField(this, 5, value);
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
proto.boltzrpc.LightningInfo.prototype.toObject = function(opt_includeInstance) {
  return proto.boltzrpc.LightningInfo.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.boltzrpc.LightningInfo} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.boltzrpc.LightningInfo.toObject = function(includeInstance, msg) {
  var f, obj = {
    version: jspb.Message.getFieldWithDefault(msg, 1, ""),
    channels: (f = msg.getChannels()) && proto.boltzrpc.LightningInfo.Channels.toObject(includeInstance, f),
    blockHeight: jspb.Message.getFieldWithDefault(msg, 3, 0),
    error: jspb.Message.getFieldWithDefault(msg, 4, "")
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
 * @return {!proto.boltzrpc.LightningInfo}
 */
proto.boltzrpc.LightningInfo.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.boltzrpc.LightningInfo;
  return proto.boltzrpc.LightningInfo.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.boltzrpc.LightningInfo} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.boltzrpc.LightningInfo}
 */
proto.boltzrpc.LightningInfo.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setVersion(value);
      break;
    case 2:
      var value = new proto.boltzrpc.LightningInfo.Channels;
      reader.readMessage(value,proto.boltzrpc.LightningInfo.Channels.deserializeBinaryFromReader);
      msg.setChannels(value);
      break;
    case 3:
      var value = /** @type {number} */ (reader.readUint64());
      msg.setBlockHeight(value);
      break;
    case 4:
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
proto.boltzrpc.LightningInfo.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.boltzrpc.LightningInfo.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.boltzrpc.LightningInfo} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.boltzrpc.LightningInfo.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getVersion();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
  f = message.getChannels();
  if (f != null) {
    writer.writeMessage(
      2,
      f,
      proto.boltzrpc.LightningInfo.Channels.serializeBinaryToWriter
    );
  }
  f = message.getBlockHeight();
  if (f !== 0) {
    writer.writeUint64(
      3,
      f
    );
  }
  f = message.getError();
  if (f.length > 0) {
    writer.writeString(
      4,
      f
    );
  }
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
proto.boltzrpc.LightningInfo.Channels.prototype.toObject = function(opt_includeInstance) {
  return proto.boltzrpc.LightningInfo.Channels.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.boltzrpc.LightningInfo.Channels} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.boltzrpc.LightningInfo.Channels.toObject = function(includeInstance, msg) {
  var f, obj = {
    active: jspb.Message.getFieldWithDefault(msg, 1, 0),
    inactive: jspb.Message.getFieldWithDefault(msg, 2, 0),
    pending: jspb.Message.getFieldWithDefault(msg, 3, 0)
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
 * @return {!proto.boltzrpc.LightningInfo.Channels}
 */
proto.boltzrpc.LightningInfo.Channels.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.boltzrpc.LightningInfo.Channels;
  return proto.boltzrpc.LightningInfo.Channels.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.boltzrpc.LightningInfo.Channels} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.boltzrpc.LightningInfo.Channels}
 */
proto.boltzrpc.LightningInfo.Channels.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {number} */ (reader.readUint32());
      msg.setActive(value);
      break;
    case 2:
      var value = /** @type {number} */ (reader.readUint32());
      msg.setInactive(value);
      break;
    case 3:
      var value = /** @type {number} */ (reader.readUint32());
      msg.setPending(value);
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
proto.boltzrpc.LightningInfo.Channels.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.boltzrpc.LightningInfo.Channels.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.boltzrpc.LightningInfo.Channels} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.boltzrpc.LightningInfo.Channels.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getActive();
  if (f !== 0) {
    writer.writeUint32(
      1,
      f
    );
  }
  f = message.getInactive();
  if (f !== 0) {
    writer.writeUint32(
      2,
      f
    );
  }
  f = message.getPending();
  if (f !== 0) {
    writer.writeUint32(
      3,
      f
    );
  }
};


/**
 * optional uint32 active = 1;
 * @return {number}
 */
proto.boltzrpc.LightningInfo.Channels.prototype.getActive = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 1, 0));
};


/**
 * @param {number} value
 * @return {!proto.boltzrpc.LightningInfo.Channels} returns this
 */
proto.boltzrpc.LightningInfo.Channels.prototype.setActive = function(value) {
  return jspb.Message.setProto3IntField(this, 1, value);
};


/**
 * optional uint32 inactive = 2;
 * @return {number}
 */
proto.boltzrpc.LightningInfo.Channels.prototype.getInactive = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 2, 0));
};


/**
 * @param {number} value
 * @return {!proto.boltzrpc.LightningInfo.Channels} returns this
 */
proto.boltzrpc.LightningInfo.Channels.prototype.setInactive = function(value) {
  return jspb.Message.setProto3IntField(this, 2, value);
};


/**
 * optional uint32 pending = 3;
 * @return {number}
 */
proto.boltzrpc.LightningInfo.Channels.prototype.getPending = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 3, 0));
};


/**
 * @param {number} value
 * @return {!proto.boltzrpc.LightningInfo.Channels} returns this
 */
proto.boltzrpc.LightningInfo.Channels.prototype.setPending = function(value) {
  return jspb.Message.setProto3IntField(this, 3, value);
};


/**
 * optional string version = 1;
 * @return {string}
 */
proto.boltzrpc.LightningInfo.prototype.getVersion = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.boltzrpc.LightningInfo} returns this
 */
proto.boltzrpc.LightningInfo.prototype.setVersion = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};


/**
 * optional Channels channels = 2;
 * @return {?proto.boltzrpc.LightningInfo.Channels}
 */
proto.boltzrpc.LightningInfo.prototype.getChannels = function() {
  return /** @type{?proto.boltzrpc.LightningInfo.Channels} */ (
    jspb.Message.getWrapperField(this, proto.boltzrpc.LightningInfo.Channels, 2));
};


/**
 * @param {?proto.boltzrpc.LightningInfo.Channels|undefined} value
 * @return {!proto.boltzrpc.LightningInfo} returns this
*/
proto.boltzrpc.LightningInfo.prototype.setChannels = function(value) {
  return jspb.Message.setWrapperField(this, 2, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.boltzrpc.LightningInfo} returns this
 */
proto.boltzrpc.LightningInfo.prototype.clearChannels = function() {
  return this.setChannels(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.boltzrpc.LightningInfo.prototype.hasChannels = function() {
  return jspb.Message.getField(this, 2) != null;
};


/**
 * optional uint64 block_height = 3;
 * @return {number}
 */
proto.boltzrpc.LightningInfo.prototype.getBlockHeight = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 3, 0));
};


/**
 * @param {number} value
 * @return {!proto.boltzrpc.LightningInfo} returns this
 */
proto.boltzrpc.LightningInfo.prototype.setBlockHeight = function(value) {
  return jspb.Message.setProto3IntField(this, 3, value);
};


/**
 * optional string error = 4;
 * @return {string}
 */
proto.boltzrpc.LightningInfo.prototype.getError = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 4, ""));
};


/**
 * @param {string} value
 * @return {!proto.boltzrpc.LightningInfo} returns this
 */
proto.boltzrpc.LightningInfo.prototype.setError = function(value) {
  return jspb.Message.setProto3StringField(this, 4, value);
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
proto.boltzrpc.GetBalanceRequest.prototype.toObject = function(opt_includeInstance) {
  return proto.boltzrpc.GetBalanceRequest.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.boltzrpc.GetBalanceRequest} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.boltzrpc.GetBalanceRequest.toObject = function(includeInstance, msg) {
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
 * @return {!proto.boltzrpc.GetBalanceRequest}
 */
proto.boltzrpc.GetBalanceRequest.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.boltzrpc.GetBalanceRequest;
  return proto.boltzrpc.GetBalanceRequest.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.boltzrpc.GetBalanceRequest} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.boltzrpc.GetBalanceRequest}
 */
proto.boltzrpc.GetBalanceRequest.deserializeBinaryFromReader = function(msg, reader) {
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
proto.boltzrpc.GetBalanceRequest.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.boltzrpc.GetBalanceRequest.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.boltzrpc.GetBalanceRequest} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.boltzrpc.GetBalanceRequest.serializeBinaryToWriter = function(message, writer) {
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
proto.boltzrpc.GetBalanceResponse.prototype.toObject = function(opt_includeInstance) {
  return proto.boltzrpc.GetBalanceResponse.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.boltzrpc.GetBalanceResponse} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.boltzrpc.GetBalanceResponse.toObject = function(includeInstance, msg) {
  var f, obj = {
    balancesMap: (f = msg.getBalancesMap()) ? f.toObject(includeInstance, proto.boltzrpc.Balances.toObject) : []
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
 * @return {!proto.boltzrpc.GetBalanceResponse}
 */
proto.boltzrpc.GetBalanceResponse.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.boltzrpc.GetBalanceResponse;
  return proto.boltzrpc.GetBalanceResponse.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.boltzrpc.GetBalanceResponse} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.boltzrpc.GetBalanceResponse}
 */
proto.boltzrpc.GetBalanceResponse.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = msg.getBalancesMap();
      reader.readMessage(value, function(message, reader) {
        jspb.Map.deserializeBinary(message, reader, jspb.BinaryReader.prototype.readString, jspb.BinaryReader.prototype.readMessage, proto.boltzrpc.Balances.deserializeBinaryFromReader, "", new proto.boltzrpc.Balances());
         });
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
proto.boltzrpc.GetBalanceResponse.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.boltzrpc.GetBalanceResponse.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.boltzrpc.GetBalanceResponse} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.boltzrpc.GetBalanceResponse.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getBalancesMap(true);
  if (f && f.getLength() > 0) {
    f.serializeBinary(1, writer, jspb.BinaryWriter.prototype.writeString, jspb.BinaryWriter.prototype.writeMessage, proto.boltzrpc.Balances.serializeBinaryToWriter);
  }
};


/**
 * map<string, Balances> balances = 1;
 * @param {boolean=} opt_noLazyCreate Do not create the map if
 * empty, instead returning `undefined`
 * @return {!jspb.Map<string,!proto.boltzrpc.Balances>}
 */
proto.boltzrpc.GetBalanceResponse.prototype.getBalancesMap = function(opt_noLazyCreate) {
  return /** @type {!jspb.Map<string,!proto.boltzrpc.Balances>} */ (
      jspb.Message.getMapField(this, 1, opt_noLazyCreate,
      proto.boltzrpc.Balances));
};


/**
 * Clears values from the map. The map will be non-null.
 * @return {!proto.boltzrpc.GetBalanceResponse} returns this
 */
proto.boltzrpc.GetBalanceResponse.prototype.clearBalancesMap = function() {
  this.getBalancesMap().clear();
  return this;};





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
proto.boltzrpc.Balances.prototype.toObject = function(opt_includeInstance) {
  return proto.boltzrpc.Balances.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.boltzrpc.Balances} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.boltzrpc.Balances.toObject = function(includeInstance, msg) {
  var f, obj = {
    walletsMap: (f = msg.getWalletsMap()) ? f.toObject(includeInstance, proto.boltzrpc.Balances.WalletBalance.toObject) : [],
    lightningMap: (f = msg.getLightningMap()) ? f.toObject(includeInstance, proto.boltzrpc.Balances.LightningBalance.toObject) : []
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
 * @return {!proto.boltzrpc.Balances}
 */
proto.boltzrpc.Balances.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.boltzrpc.Balances;
  return proto.boltzrpc.Balances.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.boltzrpc.Balances} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.boltzrpc.Balances}
 */
proto.boltzrpc.Balances.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = msg.getWalletsMap();
      reader.readMessage(value, function(message, reader) {
        jspb.Map.deserializeBinary(message, reader, jspb.BinaryReader.prototype.readString, jspb.BinaryReader.prototype.readMessage, proto.boltzrpc.Balances.WalletBalance.deserializeBinaryFromReader, "", new proto.boltzrpc.Balances.WalletBalance());
         });
      break;
    case 2:
      var value = msg.getLightningMap();
      reader.readMessage(value, function(message, reader) {
        jspb.Map.deserializeBinary(message, reader, jspb.BinaryReader.prototype.readString, jspb.BinaryReader.prototype.readMessage, proto.boltzrpc.Balances.LightningBalance.deserializeBinaryFromReader, "", new proto.boltzrpc.Balances.LightningBalance());
         });
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
proto.boltzrpc.Balances.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.boltzrpc.Balances.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.boltzrpc.Balances} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.boltzrpc.Balances.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getWalletsMap(true);
  if (f && f.getLength() > 0) {
    f.serializeBinary(1, writer, jspb.BinaryWriter.prototype.writeString, jspb.BinaryWriter.prototype.writeMessage, proto.boltzrpc.Balances.WalletBalance.serializeBinaryToWriter);
  }
  f = message.getLightningMap(true);
  if (f && f.getLength() > 0) {
    f.serializeBinary(2, writer, jspb.BinaryWriter.prototype.writeString, jspb.BinaryWriter.prototype.writeMessage, proto.boltzrpc.Balances.LightningBalance.serializeBinaryToWriter);
  }
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
proto.boltzrpc.Balances.WalletBalance.prototype.toObject = function(opt_includeInstance) {
  return proto.boltzrpc.Balances.WalletBalance.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.boltzrpc.Balances.WalletBalance} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.boltzrpc.Balances.WalletBalance.toObject = function(includeInstance, msg) {
  var f, obj = {
    confirmed: jspb.Message.getFieldWithDefault(msg, 1, 0),
    unconfirmed: jspb.Message.getFieldWithDefault(msg, 2, 0)
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
 * @return {!proto.boltzrpc.Balances.WalletBalance}
 */
proto.boltzrpc.Balances.WalletBalance.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.boltzrpc.Balances.WalletBalance;
  return proto.boltzrpc.Balances.WalletBalance.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.boltzrpc.Balances.WalletBalance} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.boltzrpc.Balances.WalletBalance}
 */
proto.boltzrpc.Balances.WalletBalance.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {number} */ (reader.readUint64());
      msg.setConfirmed(value);
      break;
    case 2:
      var value = /** @type {number} */ (reader.readUint64());
      msg.setUnconfirmed(value);
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
proto.boltzrpc.Balances.WalletBalance.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.boltzrpc.Balances.WalletBalance.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.boltzrpc.Balances.WalletBalance} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.boltzrpc.Balances.WalletBalance.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getConfirmed();
  if (f !== 0) {
    writer.writeUint64(
      1,
      f
    );
  }
  f = message.getUnconfirmed();
  if (f !== 0) {
    writer.writeUint64(
      2,
      f
    );
  }
};


/**
 * optional uint64 confirmed = 1;
 * @return {number}
 */
proto.boltzrpc.Balances.WalletBalance.prototype.getConfirmed = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 1, 0));
};


/**
 * @param {number} value
 * @return {!proto.boltzrpc.Balances.WalletBalance} returns this
 */
proto.boltzrpc.Balances.WalletBalance.prototype.setConfirmed = function(value) {
  return jspb.Message.setProto3IntField(this, 1, value);
};


/**
 * optional uint64 unconfirmed = 2;
 * @return {number}
 */
proto.boltzrpc.Balances.WalletBalance.prototype.getUnconfirmed = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 2, 0));
};


/**
 * @param {number} value
 * @return {!proto.boltzrpc.Balances.WalletBalance} returns this
 */
proto.boltzrpc.Balances.WalletBalance.prototype.setUnconfirmed = function(value) {
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
proto.boltzrpc.Balances.LightningBalance.prototype.toObject = function(opt_includeInstance) {
  return proto.boltzrpc.Balances.LightningBalance.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.boltzrpc.Balances.LightningBalance} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.boltzrpc.Balances.LightningBalance.toObject = function(includeInstance, msg) {
  var f, obj = {
    local: jspb.Message.getFieldWithDefault(msg, 1, 0),
    remote: jspb.Message.getFieldWithDefault(msg, 2, 0)
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
 * @return {!proto.boltzrpc.Balances.LightningBalance}
 */
proto.boltzrpc.Balances.LightningBalance.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.boltzrpc.Balances.LightningBalance;
  return proto.boltzrpc.Balances.LightningBalance.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.boltzrpc.Balances.LightningBalance} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.boltzrpc.Balances.LightningBalance}
 */
proto.boltzrpc.Balances.LightningBalance.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {number} */ (reader.readUint64());
      msg.setLocal(value);
      break;
    case 2:
      var value = /** @type {number} */ (reader.readUint64());
      msg.setRemote(value);
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
proto.boltzrpc.Balances.LightningBalance.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.boltzrpc.Balances.LightningBalance.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.boltzrpc.Balances.LightningBalance} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.boltzrpc.Balances.LightningBalance.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getLocal();
  if (f !== 0) {
    writer.writeUint64(
      1,
      f
    );
  }
  f = message.getRemote();
  if (f !== 0) {
    writer.writeUint64(
      2,
      f
    );
  }
};


/**
 * optional uint64 local = 1;
 * @return {number}
 */
proto.boltzrpc.Balances.LightningBalance.prototype.getLocal = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 1, 0));
};


/**
 * @param {number} value
 * @return {!proto.boltzrpc.Balances.LightningBalance} returns this
 */
proto.boltzrpc.Balances.LightningBalance.prototype.setLocal = function(value) {
  return jspb.Message.setProto3IntField(this, 1, value);
};


/**
 * optional uint64 remote = 2;
 * @return {number}
 */
proto.boltzrpc.Balances.LightningBalance.prototype.getRemote = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 2, 0));
};


/**
 * @param {number} value
 * @return {!proto.boltzrpc.Balances.LightningBalance} returns this
 */
proto.boltzrpc.Balances.LightningBalance.prototype.setRemote = function(value) {
  return jspb.Message.setProto3IntField(this, 2, value);
};


/**
 * map<string, WalletBalance> wallets = 1;
 * @param {boolean=} opt_noLazyCreate Do not create the map if
 * empty, instead returning `undefined`
 * @return {!jspb.Map<string,!proto.boltzrpc.Balances.WalletBalance>}
 */
proto.boltzrpc.Balances.prototype.getWalletsMap = function(opt_noLazyCreate) {
  return /** @type {!jspb.Map<string,!proto.boltzrpc.Balances.WalletBalance>} */ (
      jspb.Message.getMapField(this, 1, opt_noLazyCreate,
      proto.boltzrpc.Balances.WalletBalance));
};


/**
 * Clears values from the map. The map will be non-null.
 * @return {!proto.boltzrpc.Balances} returns this
 */
proto.boltzrpc.Balances.prototype.clearWalletsMap = function() {
  this.getWalletsMap().clear();
  return this;};


/**
 * map<string, LightningBalance> lightning = 2;
 * @param {boolean=} opt_noLazyCreate Do not create the map if
 * empty, instead returning `undefined`
 * @return {!jspb.Map<string,!proto.boltzrpc.Balances.LightningBalance>}
 */
proto.boltzrpc.Balances.prototype.getLightningMap = function(opt_noLazyCreate) {
  return /** @type {!jspb.Map<string,!proto.boltzrpc.Balances.LightningBalance>} */ (
      jspb.Message.getMapField(this, 2, opt_noLazyCreate,
      proto.boltzrpc.Balances.LightningBalance));
};


/**
 * Clears values from the map. The map will be non-null.
 * @return {!proto.boltzrpc.Balances} returns this
 */
proto.boltzrpc.Balances.prototype.clearLightningMap = function() {
  this.getLightningMap().clear();
  return this;};





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
proto.boltzrpc.DeriveKeysRequest.prototype.toObject = function(opt_includeInstance) {
  return proto.boltzrpc.DeriveKeysRequest.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.boltzrpc.DeriveKeysRequest} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.boltzrpc.DeriveKeysRequest.toObject = function(includeInstance, msg) {
  var f, obj = {
    symbol: jspb.Message.getFieldWithDefault(msg, 1, ""),
    index: jspb.Message.getFieldWithDefault(msg, 2, 0)
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
 * @return {!proto.boltzrpc.DeriveKeysRequest}
 */
proto.boltzrpc.DeriveKeysRequest.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.boltzrpc.DeriveKeysRequest;
  return proto.boltzrpc.DeriveKeysRequest.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.boltzrpc.DeriveKeysRequest} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.boltzrpc.DeriveKeysRequest}
 */
proto.boltzrpc.DeriveKeysRequest.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setSymbol(value);
      break;
    case 2:
      var value = /** @type {number} */ (reader.readUint32());
      msg.setIndex(value);
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
proto.boltzrpc.DeriveKeysRequest.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.boltzrpc.DeriveKeysRequest.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.boltzrpc.DeriveKeysRequest} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.boltzrpc.DeriveKeysRequest.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getSymbol();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
  f = message.getIndex();
  if (f !== 0) {
    writer.writeUint32(
      2,
      f
    );
  }
};


/**
 * optional string symbol = 1;
 * @return {string}
 */
proto.boltzrpc.DeriveKeysRequest.prototype.getSymbol = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.boltzrpc.DeriveKeysRequest} returns this
 */
proto.boltzrpc.DeriveKeysRequest.prototype.setSymbol = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};


/**
 * optional uint32 index = 2;
 * @return {number}
 */
proto.boltzrpc.DeriveKeysRequest.prototype.getIndex = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 2, 0));
};


/**
 * @param {number} value
 * @return {!proto.boltzrpc.DeriveKeysRequest} returns this
 */
proto.boltzrpc.DeriveKeysRequest.prototype.setIndex = function(value) {
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
proto.boltzrpc.DeriveKeysResponse.prototype.toObject = function(opt_includeInstance) {
  return proto.boltzrpc.DeriveKeysResponse.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.boltzrpc.DeriveKeysResponse} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.boltzrpc.DeriveKeysResponse.toObject = function(includeInstance, msg) {
  var f, obj = {
    publicKey: jspb.Message.getFieldWithDefault(msg, 1, ""),
    privateKey: jspb.Message.getFieldWithDefault(msg, 2, "")
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
 * @return {!proto.boltzrpc.DeriveKeysResponse}
 */
proto.boltzrpc.DeriveKeysResponse.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.boltzrpc.DeriveKeysResponse;
  return proto.boltzrpc.DeriveKeysResponse.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.boltzrpc.DeriveKeysResponse} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.boltzrpc.DeriveKeysResponse}
 */
proto.boltzrpc.DeriveKeysResponse.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setPublicKey(value);
      break;
    case 2:
      var value = /** @type {string} */ (reader.readString());
      msg.setPrivateKey(value);
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
proto.boltzrpc.DeriveKeysResponse.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.boltzrpc.DeriveKeysResponse.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.boltzrpc.DeriveKeysResponse} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.boltzrpc.DeriveKeysResponse.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getPublicKey();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
  f = message.getPrivateKey();
  if (f.length > 0) {
    writer.writeString(
      2,
      f
    );
  }
};


/**
 * optional string public_key = 1;
 * @return {string}
 */
proto.boltzrpc.DeriveKeysResponse.prototype.getPublicKey = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.boltzrpc.DeriveKeysResponse} returns this
 */
proto.boltzrpc.DeriveKeysResponse.prototype.setPublicKey = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};


/**
 * optional string private_key = 2;
 * @return {string}
 */
proto.boltzrpc.DeriveKeysResponse.prototype.getPrivateKey = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 2, ""));
};


/**
 * @param {string} value
 * @return {!proto.boltzrpc.DeriveKeysResponse} returns this
 */
proto.boltzrpc.DeriveKeysResponse.prototype.setPrivateKey = function(value) {
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
proto.boltzrpc.DeriveBlindingKeyRequest.prototype.toObject = function(opt_includeInstance) {
  return proto.boltzrpc.DeriveBlindingKeyRequest.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.boltzrpc.DeriveBlindingKeyRequest} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.boltzrpc.DeriveBlindingKeyRequest.toObject = function(includeInstance, msg) {
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
 * @return {!proto.boltzrpc.DeriveBlindingKeyRequest}
 */
proto.boltzrpc.DeriveBlindingKeyRequest.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.boltzrpc.DeriveBlindingKeyRequest;
  return proto.boltzrpc.DeriveBlindingKeyRequest.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.boltzrpc.DeriveBlindingKeyRequest} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.boltzrpc.DeriveBlindingKeyRequest}
 */
proto.boltzrpc.DeriveBlindingKeyRequest.deserializeBinaryFromReader = function(msg, reader) {
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
proto.boltzrpc.DeriveBlindingKeyRequest.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.boltzrpc.DeriveBlindingKeyRequest.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.boltzrpc.DeriveBlindingKeyRequest} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.boltzrpc.DeriveBlindingKeyRequest.serializeBinaryToWriter = function(message, writer) {
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
proto.boltzrpc.DeriveBlindingKeyRequest.prototype.getAddress = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.boltzrpc.DeriveBlindingKeyRequest} returns this
 */
proto.boltzrpc.DeriveBlindingKeyRequest.prototype.setAddress = function(value) {
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
proto.boltzrpc.DeriveBlindingKeyResponse.prototype.toObject = function(opt_includeInstance) {
  return proto.boltzrpc.DeriveBlindingKeyResponse.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.boltzrpc.DeriveBlindingKeyResponse} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.boltzrpc.DeriveBlindingKeyResponse.toObject = function(includeInstance, msg) {
  var f, obj = {
    publicKey: jspb.Message.getFieldWithDefault(msg, 1, ""),
    privateKey: jspb.Message.getFieldWithDefault(msg, 2, "")
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
 * @return {!proto.boltzrpc.DeriveBlindingKeyResponse}
 */
proto.boltzrpc.DeriveBlindingKeyResponse.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.boltzrpc.DeriveBlindingKeyResponse;
  return proto.boltzrpc.DeriveBlindingKeyResponse.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.boltzrpc.DeriveBlindingKeyResponse} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.boltzrpc.DeriveBlindingKeyResponse}
 */
proto.boltzrpc.DeriveBlindingKeyResponse.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setPublicKey(value);
      break;
    case 2:
      var value = /** @type {string} */ (reader.readString());
      msg.setPrivateKey(value);
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
proto.boltzrpc.DeriveBlindingKeyResponse.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.boltzrpc.DeriveBlindingKeyResponse.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.boltzrpc.DeriveBlindingKeyResponse} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.boltzrpc.DeriveBlindingKeyResponse.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getPublicKey();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
  f = message.getPrivateKey();
  if (f.length > 0) {
    writer.writeString(
      2,
      f
    );
  }
};


/**
 * optional string public_key = 1;
 * @return {string}
 */
proto.boltzrpc.DeriveBlindingKeyResponse.prototype.getPublicKey = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.boltzrpc.DeriveBlindingKeyResponse} returns this
 */
proto.boltzrpc.DeriveBlindingKeyResponse.prototype.setPublicKey = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};


/**
 * optional string private_key = 2;
 * @return {string}
 */
proto.boltzrpc.DeriveBlindingKeyResponse.prototype.getPrivateKey = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 2, ""));
};


/**
 * @param {string} value
 * @return {!proto.boltzrpc.DeriveBlindingKeyResponse} returns this
 */
proto.boltzrpc.DeriveBlindingKeyResponse.prototype.setPrivateKey = function(value) {
  return jspb.Message.setProto3StringField(this, 2, value);
};



/**
 * Oneof group definitions for this message. Each group defines the field
 * numbers belonging to that group. When of these fields' value is set, all
 * other fields in the group are cleared. During deserialization, if multiple
 * fields are encountered for a group, only the last value seen will be kept.
 * @private {!Array<!Array<number>>}
 * @const
 */
proto.boltzrpc.UnblindOutputsRequest.oneofGroups_ = [[1,2]];

/**
 * @enum {number}
 */
proto.boltzrpc.UnblindOutputsRequest.TransactionCase = {
  TRANSACTION_NOT_SET: 0,
  ID: 1,
  HEX: 2
};

/**
 * @return {proto.boltzrpc.UnblindOutputsRequest.TransactionCase}
 */
proto.boltzrpc.UnblindOutputsRequest.prototype.getTransactionCase = function() {
  return /** @type {proto.boltzrpc.UnblindOutputsRequest.TransactionCase} */(jspb.Message.computeOneofCase(this, proto.boltzrpc.UnblindOutputsRequest.oneofGroups_[0]));
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
proto.boltzrpc.UnblindOutputsRequest.prototype.toObject = function(opt_includeInstance) {
  return proto.boltzrpc.UnblindOutputsRequest.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.boltzrpc.UnblindOutputsRequest} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.boltzrpc.UnblindOutputsRequest.toObject = function(includeInstance, msg) {
  var f, obj = {
    id: jspb.Message.getFieldWithDefault(msg, 1, ""),
    hex: jspb.Message.getFieldWithDefault(msg, 2, "")
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
 * @return {!proto.boltzrpc.UnblindOutputsRequest}
 */
proto.boltzrpc.UnblindOutputsRequest.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.boltzrpc.UnblindOutputsRequest;
  return proto.boltzrpc.UnblindOutputsRequest.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.boltzrpc.UnblindOutputsRequest} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.boltzrpc.UnblindOutputsRequest}
 */
proto.boltzrpc.UnblindOutputsRequest.deserializeBinaryFromReader = function(msg, reader) {
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
      msg.setHex(value);
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
proto.boltzrpc.UnblindOutputsRequest.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.boltzrpc.UnblindOutputsRequest.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.boltzrpc.UnblindOutputsRequest} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.boltzrpc.UnblindOutputsRequest.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = /** @type {string} */ (jspb.Message.getField(message, 1));
  if (f != null) {
    writer.writeString(
      1,
      f
    );
  }
  f = /** @type {string} */ (jspb.Message.getField(message, 2));
  if (f != null) {
    writer.writeString(
      2,
      f
    );
  }
};


/**
 * optional string id = 1;
 * @return {string}
 */
proto.boltzrpc.UnblindOutputsRequest.prototype.getId = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.boltzrpc.UnblindOutputsRequest} returns this
 */
proto.boltzrpc.UnblindOutputsRequest.prototype.setId = function(value) {
  return jspb.Message.setOneofField(this, 1, proto.boltzrpc.UnblindOutputsRequest.oneofGroups_[0], value);
};


/**
 * Clears the field making it undefined.
 * @return {!proto.boltzrpc.UnblindOutputsRequest} returns this
 */
proto.boltzrpc.UnblindOutputsRequest.prototype.clearId = function() {
  return jspb.Message.setOneofField(this, 1, proto.boltzrpc.UnblindOutputsRequest.oneofGroups_[0], undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.boltzrpc.UnblindOutputsRequest.prototype.hasId = function() {
  return jspb.Message.getField(this, 1) != null;
};


/**
 * optional string hex = 2;
 * @return {string}
 */
proto.boltzrpc.UnblindOutputsRequest.prototype.getHex = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 2, ""));
};


/**
 * @param {string} value
 * @return {!proto.boltzrpc.UnblindOutputsRequest} returns this
 */
proto.boltzrpc.UnblindOutputsRequest.prototype.setHex = function(value) {
  return jspb.Message.setOneofField(this, 2, proto.boltzrpc.UnblindOutputsRequest.oneofGroups_[0], value);
};


/**
 * Clears the field making it undefined.
 * @return {!proto.boltzrpc.UnblindOutputsRequest} returns this
 */
proto.boltzrpc.UnblindOutputsRequest.prototype.clearHex = function() {
  return jspb.Message.setOneofField(this, 2, proto.boltzrpc.UnblindOutputsRequest.oneofGroups_[0], undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.boltzrpc.UnblindOutputsRequest.prototype.hasHex = function() {
  return jspb.Message.getField(this, 2) != null;
};



/**
 * List of repeated fields within this message type.
 * @private {!Array<number>}
 * @const
 */
proto.boltzrpc.UnblindOutputsResponse.repeatedFields_ = [1];



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
proto.boltzrpc.UnblindOutputsResponse.prototype.toObject = function(opt_includeInstance) {
  return proto.boltzrpc.UnblindOutputsResponse.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.boltzrpc.UnblindOutputsResponse} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.boltzrpc.UnblindOutputsResponse.toObject = function(includeInstance, msg) {
  var f, obj = {
    outputsList: jspb.Message.toObjectList(msg.getOutputsList(),
    proto.boltzrpc.UnblindOutputsResponse.UnblindedOutput.toObject, includeInstance)
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
 * @return {!proto.boltzrpc.UnblindOutputsResponse}
 */
proto.boltzrpc.UnblindOutputsResponse.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.boltzrpc.UnblindOutputsResponse;
  return proto.boltzrpc.UnblindOutputsResponse.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.boltzrpc.UnblindOutputsResponse} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.boltzrpc.UnblindOutputsResponse}
 */
proto.boltzrpc.UnblindOutputsResponse.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = new proto.boltzrpc.UnblindOutputsResponse.UnblindedOutput;
      reader.readMessage(value,proto.boltzrpc.UnblindOutputsResponse.UnblindedOutput.deserializeBinaryFromReader);
      msg.addOutputs(value);
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
proto.boltzrpc.UnblindOutputsResponse.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.boltzrpc.UnblindOutputsResponse.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.boltzrpc.UnblindOutputsResponse} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.boltzrpc.UnblindOutputsResponse.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getOutputsList();
  if (f.length > 0) {
    writer.writeRepeatedMessage(
      1,
      f,
      proto.boltzrpc.UnblindOutputsResponse.UnblindedOutput.serializeBinaryToWriter
    );
  }
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
proto.boltzrpc.UnblindOutputsResponse.UnblindedOutput.prototype.toObject = function(opt_includeInstance) {
  return proto.boltzrpc.UnblindOutputsResponse.UnblindedOutput.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.boltzrpc.UnblindOutputsResponse.UnblindedOutput} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.boltzrpc.UnblindOutputsResponse.UnblindedOutput.toObject = function(includeInstance, msg) {
  var f, obj = {
    value: jspb.Message.getFieldWithDefault(msg, 1, 0),
    asset: msg.getAsset_asB64(),
    isLbtc: jspb.Message.getBooleanFieldWithDefault(msg, 3, false),
    script: msg.getScript_asB64(),
    nonce: msg.getNonce_asB64(),
    rangeProof: msg.getRangeProof_asB64(),
    surjectionProof: msg.getSurjectionProof_asB64()
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
 * @return {!proto.boltzrpc.UnblindOutputsResponse.UnblindedOutput}
 */
proto.boltzrpc.UnblindOutputsResponse.UnblindedOutput.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.boltzrpc.UnblindOutputsResponse.UnblindedOutput;
  return proto.boltzrpc.UnblindOutputsResponse.UnblindedOutput.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.boltzrpc.UnblindOutputsResponse.UnblindedOutput} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.boltzrpc.UnblindOutputsResponse.UnblindedOutput}
 */
proto.boltzrpc.UnblindOutputsResponse.UnblindedOutput.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {number} */ (reader.readUint64());
      msg.setValue(value);
      break;
    case 2:
      var value = /** @type {!Uint8Array} */ (reader.readBytes());
      msg.setAsset(value);
      break;
    case 3:
      var value = /** @type {boolean} */ (reader.readBool());
      msg.setIsLbtc(value);
      break;
    case 4:
      var value = /** @type {!Uint8Array} */ (reader.readBytes());
      msg.setScript(value);
      break;
    case 5:
      var value = /** @type {!Uint8Array} */ (reader.readBytes());
      msg.setNonce(value);
      break;
    case 6:
      var value = /** @type {!Uint8Array} */ (reader.readBytes());
      msg.setRangeProof(value);
      break;
    case 7:
      var value = /** @type {!Uint8Array} */ (reader.readBytes());
      msg.setSurjectionProof(value);
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
proto.boltzrpc.UnblindOutputsResponse.UnblindedOutput.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.boltzrpc.UnblindOutputsResponse.UnblindedOutput.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.boltzrpc.UnblindOutputsResponse.UnblindedOutput} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.boltzrpc.UnblindOutputsResponse.UnblindedOutput.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getValue();
  if (f !== 0) {
    writer.writeUint64(
      1,
      f
    );
  }
  f = message.getAsset_asU8();
  if (f.length > 0) {
    writer.writeBytes(
      2,
      f
    );
  }
  f = message.getIsLbtc();
  if (f) {
    writer.writeBool(
      3,
      f
    );
  }
  f = message.getScript_asU8();
  if (f.length > 0) {
    writer.writeBytes(
      4,
      f
    );
  }
  f = message.getNonce_asU8();
  if (f.length > 0) {
    writer.writeBytes(
      5,
      f
    );
  }
  f = /** @type {!(string|Uint8Array)} */ (jspb.Message.getField(message, 6));
  if (f != null) {
    writer.writeBytes(
      6,
      f
    );
  }
  f = /** @type {!(string|Uint8Array)} */ (jspb.Message.getField(message, 7));
  if (f != null) {
    writer.writeBytes(
      7,
      f
    );
  }
};


/**
 * optional uint64 value = 1;
 * @return {number}
 */
proto.boltzrpc.UnblindOutputsResponse.UnblindedOutput.prototype.getValue = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 1, 0));
};


/**
 * @param {number} value
 * @return {!proto.boltzrpc.UnblindOutputsResponse.UnblindedOutput} returns this
 */
proto.boltzrpc.UnblindOutputsResponse.UnblindedOutput.prototype.setValue = function(value) {
  return jspb.Message.setProto3IntField(this, 1, value);
};


/**
 * optional bytes asset = 2;
 * @return {!(string|Uint8Array)}
 */
proto.boltzrpc.UnblindOutputsResponse.UnblindedOutput.prototype.getAsset = function() {
  return /** @type {!(string|Uint8Array)} */ (jspb.Message.getFieldWithDefault(this, 2, ""));
};


/**
 * optional bytes asset = 2;
 * This is a type-conversion wrapper around `getAsset()`
 * @return {string}
 */
proto.boltzrpc.UnblindOutputsResponse.UnblindedOutput.prototype.getAsset_asB64 = function() {
  return /** @type {string} */ (jspb.Message.bytesAsB64(
      this.getAsset()));
};


/**
 * optional bytes asset = 2;
 * Note that Uint8Array is not supported on all browsers.
 * @see http://caniuse.com/Uint8Array
 * This is a type-conversion wrapper around `getAsset()`
 * @return {!Uint8Array}
 */
proto.boltzrpc.UnblindOutputsResponse.UnblindedOutput.prototype.getAsset_asU8 = function() {
  return /** @type {!Uint8Array} */ (jspb.Message.bytesAsU8(
      this.getAsset()));
};


/**
 * @param {!(string|Uint8Array)} value
 * @return {!proto.boltzrpc.UnblindOutputsResponse.UnblindedOutput} returns this
 */
proto.boltzrpc.UnblindOutputsResponse.UnblindedOutput.prototype.setAsset = function(value) {
  return jspb.Message.setProto3BytesField(this, 2, value);
};


/**
 * optional bool is_lbtc = 3;
 * @return {boolean}
 */
proto.boltzrpc.UnblindOutputsResponse.UnblindedOutput.prototype.getIsLbtc = function() {
  return /** @type {boolean} */ (jspb.Message.getBooleanFieldWithDefault(this, 3, false));
};


/**
 * @param {boolean} value
 * @return {!proto.boltzrpc.UnblindOutputsResponse.UnblindedOutput} returns this
 */
proto.boltzrpc.UnblindOutputsResponse.UnblindedOutput.prototype.setIsLbtc = function(value) {
  return jspb.Message.setProto3BooleanField(this, 3, value);
};


/**
 * optional bytes script = 4;
 * @return {!(string|Uint8Array)}
 */
proto.boltzrpc.UnblindOutputsResponse.UnblindedOutput.prototype.getScript = function() {
  return /** @type {!(string|Uint8Array)} */ (jspb.Message.getFieldWithDefault(this, 4, ""));
};


/**
 * optional bytes script = 4;
 * This is a type-conversion wrapper around `getScript()`
 * @return {string}
 */
proto.boltzrpc.UnblindOutputsResponse.UnblindedOutput.prototype.getScript_asB64 = function() {
  return /** @type {string} */ (jspb.Message.bytesAsB64(
      this.getScript()));
};


/**
 * optional bytes script = 4;
 * Note that Uint8Array is not supported on all browsers.
 * @see http://caniuse.com/Uint8Array
 * This is a type-conversion wrapper around `getScript()`
 * @return {!Uint8Array}
 */
proto.boltzrpc.UnblindOutputsResponse.UnblindedOutput.prototype.getScript_asU8 = function() {
  return /** @type {!Uint8Array} */ (jspb.Message.bytesAsU8(
      this.getScript()));
};


/**
 * @param {!(string|Uint8Array)} value
 * @return {!proto.boltzrpc.UnblindOutputsResponse.UnblindedOutput} returns this
 */
proto.boltzrpc.UnblindOutputsResponse.UnblindedOutput.prototype.setScript = function(value) {
  return jspb.Message.setProto3BytesField(this, 4, value);
};


/**
 * optional bytes nonce = 5;
 * @return {!(string|Uint8Array)}
 */
proto.boltzrpc.UnblindOutputsResponse.UnblindedOutput.prototype.getNonce = function() {
  return /** @type {!(string|Uint8Array)} */ (jspb.Message.getFieldWithDefault(this, 5, ""));
};


/**
 * optional bytes nonce = 5;
 * This is a type-conversion wrapper around `getNonce()`
 * @return {string}
 */
proto.boltzrpc.UnblindOutputsResponse.UnblindedOutput.prototype.getNonce_asB64 = function() {
  return /** @type {string} */ (jspb.Message.bytesAsB64(
      this.getNonce()));
};


/**
 * optional bytes nonce = 5;
 * Note that Uint8Array is not supported on all browsers.
 * @see http://caniuse.com/Uint8Array
 * This is a type-conversion wrapper around `getNonce()`
 * @return {!Uint8Array}
 */
proto.boltzrpc.UnblindOutputsResponse.UnblindedOutput.prototype.getNonce_asU8 = function() {
  return /** @type {!Uint8Array} */ (jspb.Message.bytesAsU8(
      this.getNonce()));
};


/**
 * @param {!(string|Uint8Array)} value
 * @return {!proto.boltzrpc.UnblindOutputsResponse.UnblindedOutput} returns this
 */
proto.boltzrpc.UnblindOutputsResponse.UnblindedOutput.prototype.setNonce = function(value) {
  return jspb.Message.setProto3BytesField(this, 5, value);
};


/**
 * optional bytes range_proof = 6;
 * @return {!(string|Uint8Array)}
 */
proto.boltzrpc.UnblindOutputsResponse.UnblindedOutput.prototype.getRangeProof = function() {
  return /** @type {!(string|Uint8Array)} */ (jspb.Message.getFieldWithDefault(this, 6, ""));
};


/**
 * optional bytes range_proof = 6;
 * This is a type-conversion wrapper around `getRangeProof()`
 * @return {string}
 */
proto.boltzrpc.UnblindOutputsResponse.UnblindedOutput.prototype.getRangeProof_asB64 = function() {
  return /** @type {string} */ (jspb.Message.bytesAsB64(
      this.getRangeProof()));
};


/**
 * optional bytes range_proof = 6;
 * Note that Uint8Array is not supported on all browsers.
 * @see http://caniuse.com/Uint8Array
 * This is a type-conversion wrapper around `getRangeProof()`
 * @return {!Uint8Array}
 */
proto.boltzrpc.UnblindOutputsResponse.UnblindedOutput.prototype.getRangeProof_asU8 = function() {
  return /** @type {!Uint8Array} */ (jspb.Message.bytesAsU8(
      this.getRangeProof()));
};


/**
 * @param {!(string|Uint8Array)} value
 * @return {!proto.boltzrpc.UnblindOutputsResponse.UnblindedOutput} returns this
 */
proto.boltzrpc.UnblindOutputsResponse.UnblindedOutput.prototype.setRangeProof = function(value) {
  return jspb.Message.setField(this, 6, value);
};


/**
 * Clears the field making it undefined.
 * @return {!proto.boltzrpc.UnblindOutputsResponse.UnblindedOutput} returns this
 */
proto.boltzrpc.UnblindOutputsResponse.UnblindedOutput.prototype.clearRangeProof = function() {
  return jspb.Message.setField(this, 6, undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.boltzrpc.UnblindOutputsResponse.UnblindedOutput.prototype.hasRangeProof = function() {
  return jspb.Message.getField(this, 6) != null;
};


/**
 * optional bytes surjection_proof = 7;
 * @return {!(string|Uint8Array)}
 */
proto.boltzrpc.UnblindOutputsResponse.UnblindedOutput.prototype.getSurjectionProof = function() {
  return /** @type {!(string|Uint8Array)} */ (jspb.Message.getFieldWithDefault(this, 7, ""));
};


/**
 * optional bytes surjection_proof = 7;
 * This is a type-conversion wrapper around `getSurjectionProof()`
 * @return {string}
 */
proto.boltzrpc.UnblindOutputsResponse.UnblindedOutput.prototype.getSurjectionProof_asB64 = function() {
  return /** @type {string} */ (jspb.Message.bytesAsB64(
      this.getSurjectionProof()));
};


/**
 * optional bytes surjection_proof = 7;
 * Note that Uint8Array is not supported on all browsers.
 * @see http://caniuse.com/Uint8Array
 * This is a type-conversion wrapper around `getSurjectionProof()`
 * @return {!Uint8Array}
 */
proto.boltzrpc.UnblindOutputsResponse.UnblindedOutput.prototype.getSurjectionProof_asU8 = function() {
  return /** @type {!Uint8Array} */ (jspb.Message.bytesAsU8(
      this.getSurjectionProof()));
};


/**
 * @param {!(string|Uint8Array)} value
 * @return {!proto.boltzrpc.UnblindOutputsResponse.UnblindedOutput} returns this
 */
proto.boltzrpc.UnblindOutputsResponse.UnblindedOutput.prototype.setSurjectionProof = function(value) {
  return jspb.Message.setField(this, 7, value);
};


/**
 * Clears the field making it undefined.
 * @return {!proto.boltzrpc.UnblindOutputsResponse.UnblindedOutput} returns this
 */
proto.boltzrpc.UnblindOutputsResponse.UnblindedOutput.prototype.clearSurjectionProof = function() {
  return jspb.Message.setField(this, 7, undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.boltzrpc.UnblindOutputsResponse.UnblindedOutput.prototype.hasSurjectionProof = function() {
  return jspb.Message.getField(this, 7) != null;
};


/**
 * repeated UnblindedOutput outputs = 1;
 * @return {!Array<!proto.boltzrpc.UnblindOutputsResponse.UnblindedOutput>}
 */
proto.boltzrpc.UnblindOutputsResponse.prototype.getOutputsList = function() {
  return /** @type{!Array<!proto.boltzrpc.UnblindOutputsResponse.UnblindedOutput>} */ (
    jspb.Message.getRepeatedWrapperField(this, proto.boltzrpc.UnblindOutputsResponse.UnblindedOutput, 1));
};


/**
 * @param {!Array<!proto.boltzrpc.UnblindOutputsResponse.UnblindedOutput>} value
 * @return {!proto.boltzrpc.UnblindOutputsResponse} returns this
*/
proto.boltzrpc.UnblindOutputsResponse.prototype.setOutputsList = function(value) {
  return jspb.Message.setRepeatedWrapperField(this, 1, value);
};


/**
 * @param {!proto.boltzrpc.UnblindOutputsResponse.UnblindedOutput=} opt_value
 * @param {number=} opt_index
 * @return {!proto.boltzrpc.UnblindOutputsResponse.UnblindedOutput}
 */
proto.boltzrpc.UnblindOutputsResponse.prototype.addOutputs = function(opt_value, opt_index) {
  return jspb.Message.addToRepeatedWrapperField(this, 1, opt_value, proto.boltzrpc.UnblindOutputsResponse.UnblindedOutput, opt_index);
};


/**
 * Clears the list making it empty but non-null.
 * @return {!proto.boltzrpc.UnblindOutputsResponse} returns this
 */
proto.boltzrpc.UnblindOutputsResponse.prototype.clearOutputsList = function() {
  return this.setOutputsList([]);
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
proto.boltzrpc.GetAddressRequest.prototype.toObject = function(opt_includeInstance) {
  return proto.boltzrpc.GetAddressRequest.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.boltzrpc.GetAddressRequest} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.boltzrpc.GetAddressRequest.toObject = function(includeInstance, msg) {
  var f, obj = {
    symbol: jspb.Message.getFieldWithDefault(msg, 1, ""),
    label: jspb.Message.getFieldWithDefault(msg, 2, "")
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
 * @return {!proto.boltzrpc.GetAddressRequest}
 */
proto.boltzrpc.GetAddressRequest.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.boltzrpc.GetAddressRequest;
  return proto.boltzrpc.GetAddressRequest.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.boltzrpc.GetAddressRequest} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.boltzrpc.GetAddressRequest}
 */
proto.boltzrpc.GetAddressRequest.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setSymbol(value);
      break;
    case 2:
      var value = /** @type {string} */ (reader.readString());
      msg.setLabel(value);
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
proto.boltzrpc.GetAddressRequest.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.boltzrpc.GetAddressRequest.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.boltzrpc.GetAddressRequest} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.boltzrpc.GetAddressRequest.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getSymbol();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
  f = message.getLabel();
  if (f.length > 0) {
    writer.writeString(
      2,
      f
    );
  }
};


/**
 * optional string symbol = 1;
 * @return {string}
 */
proto.boltzrpc.GetAddressRequest.prototype.getSymbol = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.boltzrpc.GetAddressRequest} returns this
 */
proto.boltzrpc.GetAddressRequest.prototype.setSymbol = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};


/**
 * optional string label = 2;
 * @return {string}
 */
proto.boltzrpc.GetAddressRequest.prototype.getLabel = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 2, ""));
};


/**
 * @param {string} value
 * @return {!proto.boltzrpc.GetAddressRequest} returns this
 */
proto.boltzrpc.GetAddressRequest.prototype.setLabel = function(value) {
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
proto.boltzrpc.GetAddressResponse.prototype.toObject = function(opt_includeInstance) {
  return proto.boltzrpc.GetAddressResponse.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.boltzrpc.GetAddressResponse} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.boltzrpc.GetAddressResponse.toObject = function(includeInstance, msg) {
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
 * @return {!proto.boltzrpc.GetAddressResponse}
 */
proto.boltzrpc.GetAddressResponse.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.boltzrpc.GetAddressResponse;
  return proto.boltzrpc.GetAddressResponse.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.boltzrpc.GetAddressResponse} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.boltzrpc.GetAddressResponse}
 */
proto.boltzrpc.GetAddressResponse.deserializeBinaryFromReader = function(msg, reader) {
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
proto.boltzrpc.GetAddressResponse.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.boltzrpc.GetAddressResponse.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.boltzrpc.GetAddressResponse} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.boltzrpc.GetAddressResponse.serializeBinaryToWriter = function(message, writer) {
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
proto.boltzrpc.GetAddressResponse.prototype.getAddress = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.boltzrpc.GetAddressResponse} returns this
 */
proto.boltzrpc.GetAddressResponse.prototype.setAddress = function(value) {
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
proto.boltzrpc.SendCoinsRequest.prototype.toObject = function(opt_includeInstance) {
  return proto.boltzrpc.SendCoinsRequest.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.boltzrpc.SendCoinsRequest} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.boltzrpc.SendCoinsRequest.toObject = function(includeInstance, msg) {
  var f, obj = {
    symbol: jspb.Message.getFieldWithDefault(msg, 1, ""),
    address: jspb.Message.getFieldWithDefault(msg, 2, ""),
    amount: jspb.Message.getFieldWithDefault(msg, 3, 0),
    fee: jspb.Message.getFieldWithDefault(msg, 4, 0),
    sendAll: jspb.Message.getBooleanFieldWithDefault(msg, 5, false),
    label: jspb.Message.getFieldWithDefault(msg, 6, "")
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
 * @return {!proto.boltzrpc.SendCoinsRequest}
 */
proto.boltzrpc.SendCoinsRequest.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.boltzrpc.SendCoinsRequest;
  return proto.boltzrpc.SendCoinsRequest.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.boltzrpc.SendCoinsRequest} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.boltzrpc.SendCoinsRequest}
 */
proto.boltzrpc.SendCoinsRequest.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setSymbol(value);
      break;
    case 2:
      var value = /** @type {string} */ (reader.readString());
      msg.setAddress(value);
      break;
    case 3:
      var value = /** @type {number} */ (reader.readUint64());
      msg.setAmount(value);
      break;
    case 4:
      var value = /** @type {number} */ (reader.readUint32());
      msg.setFee(value);
      break;
    case 5:
      var value = /** @type {boolean} */ (reader.readBool());
      msg.setSendAll(value);
      break;
    case 6:
      var value = /** @type {string} */ (reader.readString());
      msg.setLabel(value);
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
proto.boltzrpc.SendCoinsRequest.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.boltzrpc.SendCoinsRequest.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.boltzrpc.SendCoinsRequest} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.boltzrpc.SendCoinsRequest.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getSymbol();
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
  f = message.getAmount();
  if (f !== 0) {
    writer.writeUint64(
      3,
      f
    );
  }
  f = message.getFee();
  if (f !== 0) {
    writer.writeUint32(
      4,
      f
    );
  }
  f = message.getSendAll();
  if (f) {
    writer.writeBool(
      5,
      f
    );
  }
  f = message.getLabel();
  if (f.length > 0) {
    writer.writeString(
      6,
      f
    );
  }
};


/**
 * optional string symbol = 1;
 * @return {string}
 */
proto.boltzrpc.SendCoinsRequest.prototype.getSymbol = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.boltzrpc.SendCoinsRequest} returns this
 */
proto.boltzrpc.SendCoinsRequest.prototype.setSymbol = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};


/**
 * optional string address = 2;
 * @return {string}
 */
proto.boltzrpc.SendCoinsRequest.prototype.getAddress = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 2, ""));
};


/**
 * @param {string} value
 * @return {!proto.boltzrpc.SendCoinsRequest} returns this
 */
proto.boltzrpc.SendCoinsRequest.prototype.setAddress = function(value) {
  return jspb.Message.setProto3StringField(this, 2, value);
};


/**
 * optional uint64 amount = 3;
 * @return {number}
 */
proto.boltzrpc.SendCoinsRequest.prototype.getAmount = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 3, 0));
};


/**
 * @param {number} value
 * @return {!proto.boltzrpc.SendCoinsRequest} returns this
 */
proto.boltzrpc.SendCoinsRequest.prototype.setAmount = function(value) {
  return jspb.Message.setProto3IntField(this, 3, value);
};


/**
 * optional uint32 fee = 4;
 * @return {number}
 */
proto.boltzrpc.SendCoinsRequest.prototype.getFee = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 4, 0));
};


/**
 * @param {number} value
 * @return {!proto.boltzrpc.SendCoinsRequest} returns this
 */
proto.boltzrpc.SendCoinsRequest.prototype.setFee = function(value) {
  return jspb.Message.setProto3IntField(this, 4, value);
};


/**
 * optional bool send_all = 5;
 * @return {boolean}
 */
proto.boltzrpc.SendCoinsRequest.prototype.getSendAll = function() {
  return /** @type {boolean} */ (jspb.Message.getBooleanFieldWithDefault(this, 5, false));
};


/**
 * @param {boolean} value
 * @return {!proto.boltzrpc.SendCoinsRequest} returns this
 */
proto.boltzrpc.SendCoinsRequest.prototype.setSendAll = function(value) {
  return jspb.Message.setProto3BooleanField(this, 5, value);
};


/**
 * optional string label = 6;
 * @return {string}
 */
proto.boltzrpc.SendCoinsRequest.prototype.getLabel = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 6, ""));
};


/**
 * @param {string} value
 * @return {!proto.boltzrpc.SendCoinsRequest} returns this
 */
proto.boltzrpc.SendCoinsRequest.prototype.setLabel = function(value) {
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
proto.boltzrpc.SendCoinsResponse.prototype.toObject = function(opt_includeInstance) {
  return proto.boltzrpc.SendCoinsResponse.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.boltzrpc.SendCoinsResponse} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.boltzrpc.SendCoinsResponse.toObject = function(includeInstance, msg) {
  var f, obj = {
    transactionId: jspb.Message.getFieldWithDefault(msg, 1, ""),
    vout: jspb.Message.getFieldWithDefault(msg, 2, 0)
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
 * @return {!proto.boltzrpc.SendCoinsResponse}
 */
proto.boltzrpc.SendCoinsResponse.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.boltzrpc.SendCoinsResponse;
  return proto.boltzrpc.SendCoinsResponse.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.boltzrpc.SendCoinsResponse} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.boltzrpc.SendCoinsResponse}
 */
proto.boltzrpc.SendCoinsResponse.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setTransactionId(value);
      break;
    case 2:
      var value = /** @type {number} */ (reader.readUint32());
      msg.setVout(value);
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
proto.boltzrpc.SendCoinsResponse.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.boltzrpc.SendCoinsResponse.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.boltzrpc.SendCoinsResponse} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.boltzrpc.SendCoinsResponse.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getTransactionId();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
  f = /** @type {number} */ (jspb.Message.getField(message, 2));
  if (f != null) {
    writer.writeUint32(
      2,
      f
    );
  }
};


/**
 * optional string transaction_id = 1;
 * @return {string}
 */
proto.boltzrpc.SendCoinsResponse.prototype.getTransactionId = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.boltzrpc.SendCoinsResponse} returns this
 */
proto.boltzrpc.SendCoinsResponse.prototype.setTransactionId = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};


/**
 * optional uint32 vout = 2;
 * @return {number}
 */
proto.boltzrpc.SendCoinsResponse.prototype.getVout = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 2, 0));
};


/**
 * @param {number} value
 * @return {!proto.boltzrpc.SendCoinsResponse} returns this
 */
proto.boltzrpc.SendCoinsResponse.prototype.setVout = function(value) {
  return jspb.Message.setField(this, 2, value);
};


/**
 * Clears the field making it undefined.
 * @return {!proto.boltzrpc.SendCoinsResponse} returns this
 */
proto.boltzrpc.SendCoinsResponse.prototype.clearVout = function() {
  return jspb.Message.setField(this, 2, undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.boltzrpc.SendCoinsResponse.prototype.hasVout = function() {
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
proto.boltzrpc.UpdateTimeoutBlockDeltaRequest.prototype.toObject = function(opt_includeInstance) {
  return proto.boltzrpc.UpdateTimeoutBlockDeltaRequest.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.boltzrpc.UpdateTimeoutBlockDeltaRequest} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.boltzrpc.UpdateTimeoutBlockDeltaRequest.toObject = function(includeInstance, msg) {
  var f, obj = {
    pair: jspb.Message.getFieldWithDefault(msg, 1, ""),
    reverseTimeout: jspb.Message.getFieldWithDefault(msg, 2, 0),
    swapMinimalTimeout: jspb.Message.getFieldWithDefault(msg, 3, 0),
    swapMaximalTimeout: jspb.Message.getFieldWithDefault(msg, 4, 0),
    swapTaprootTimeout: jspb.Message.getFieldWithDefault(msg, 5, 0),
    chainTimeout: jspb.Message.getFieldWithDefault(msg, 6, 0)
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
 * @return {!proto.boltzrpc.UpdateTimeoutBlockDeltaRequest}
 */
proto.boltzrpc.UpdateTimeoutBlockDeltaRequest.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.boltzrpc.UpdateTimeoutBlockDeltaRequest;
  return proto.boltzrpc.UpdateTimeoutBlockDeltaRequest.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.boltzrpc.UpdateTimeoutBlockDeltaRequest} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.boltzrpc.UpdateTimeoutBlockDeltaRequest}
 */
proto.boltzrpc.UpdateTimeoutBlockDeltaRequest.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setPair(value);
      break;
    case 2:
      var value = /** @type {number} */ (reader.readUint32());
      msg.setReverseTimeout(value);
      break;
    case 3:
      var value = /** @type {number} */ (reader.readUint32());
      msg.setSwapMinimalTimeout(value);
      break;
    case 4:
      var value = /** @type {number} */ (reader.readUint32());
      msg.setSwapMaximalTimeout(value);
      break;
    case 5:
      var value = /** @type {number} */ (reader.readUint32());
      msg.setSwapTaprootTimeout(value);
      break;
    case 6:
      var value = /** @type {number} */ (reader.readUint32());
      msg.setChainTimeout(value);
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
proto.boltzrpc.UpdateTimeoutBlockDeltaRequest.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.boltzrpc.UpdateTimeoutBlockDeltaRequest.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.boltzrpc.UpdateTimeoutBlockDeltaRequest} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.boltzrpc.UpdateTimeoutBlockDeltaRequest.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getPair();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
  f = message.getReverseTimeout();
  if (f !== 0) {
    writer.writeUint32(
      2,
      f
    );
  }
  f = message.getSwapMinimalTimeout();
  if (f !== 0) {
    writer.writeUint32(
      3,
      f
    );
  }
  f = message.getSwapMaximalTimeout();
  if (f !== 0) {
    writer.writeUint32(
      4,
      f
    );
  }
  f = message.getSwapTaprootTimeout();
  if (f !== 0) {
    writer.writeUint32(
      5,
      f
    );
  }
  f = message.getChainTimeout();
  if (f !== 0) {
    writer.writeUint32(
      6,
      f
    );
  }
};


/**
 * optional string pair = 1;
 * @return {string}
 */
proto.boltzrpc.UpdateTimeoutBlockDeltaRequest.prototype.getPair = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.boltzrpc.UpdateTimeoutBlockDeltaRequest} returns this
 */
proto.boltzrpc.UpdateTimeoutBlockDeltaRequest.prototype.setPair = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};


/**
 * optional uint32 reverse_timeout = 2;
 * @return {number}
 */
proto.boltzrpc.UpdateTimeoutBlockDeltaRequest.prototype.getReverseTimeout = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 2, 0));
};


/**
 * @param {number} value
 * @return {!proto.boltzrpc.UpdateTimeoutBlockDeltaRequest} returns this
 */
proto.boltzrpc.UpdateTimeoutBlockDeltaRequest.prototype.setReverseTimeout = function(value) {
  return jspb.Message.setProto3IntField(this, 2, value);
};


/**
 * optional uint32 swap_minimal_timeout = 3;
 * @return {number}
 */
proto.boltzrpc.UpdateTimeoutBlockDeltaRequest.prototype.getSwapMinimalTimeout = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 3, 0));
};


/**
 * @param {number} value
 * @return {!proto.boltzrpc.UpdateTimeoutBlockDeltaRequest} returns this
 */
proto.boltzrpc.UpdateTimeoutBlockDeltaRequest.prototype.setSwapMinimalTimeout = function(value) {
  return jspb.Message.setProto3IntField(this, 3, value);
};


/**
 * optional uint32 swap_maximal_timeout = 4;
 * @return {number}
 */
proto.boltzrpc.UpdateTimeoutBlockDeltaRequest.prototype.getSwapMaximalTimeout = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 4, 0));
};


/**
 * @param {number} value
 * @return {!proto.boltzrpc.UpdateTimeoutBlockDeltaRequest} returns this
 */
proto.boltzrpc.UpdateTimeoutBlockDeltaRequest.prototype.setSwapMaximalTimeout = function(value) {
  return jspb.Message.setProto3IntField(this, 4, value);
};


/**
 * optional uint32 swap_taproot_timeout = 5;
 * @return {number}
 */
proto.boltzrpc.UpdateTimeoutBlockDeltaRequest.prototype.getSwapTaprootTimeout = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 5, 0));
};


/**
 * @param {number} value
 * @return {!proto.boltzrpc.UpdateTimeoutBlockDeltaRequest} returns this
 */
proto.boltzrpc.UpdateTimeoutBlockDeltaRequest.prototype.setSwapTaprootTimeout = function(value) {
  return jspb.Message.setProto3IntField(this, 5, value);
};


/**
 * optional uint32 chain_timeout = 6;
 * @return {number}
 */
proto.boltzrpc.UpdateTimeoutBlockDeltaRequest.prototype.getChainTimeout = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 6, 0));
};


/**
 * @param {number} value
 * @return {!proto.boltzrpc.UpdateTimeoutBlockDeltaRequest} returns this
 */
proto.boltzrpc.UpdateTimeoutBlockDeltaRequest.prototype.setChainTimeout = function(value) {
  return jspb.Message.setProto3IntField(this, 6, value);
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
proto.boltzrpc.UpdateTimeoutBlockDeltaResponse.prototype.toObject = function(opt_includeInstance) {
  return proto.boltzrpc.UpdateTimeoutBlockDeltaResponse.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.boltzrpc.UpdateTimeoutBlockDeltaResponse} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.boltzrpc.UpdateTimeoutBlockDeltaResponse.toObject = function(includeInstance, msg) {
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
 * @return {!proto.boltzrpc.UpdateTimeoutBlockDeltaResponse}
 */
proto.boltzrpc.UpdateTimeoutBlockDeltaResponse.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.boltzrpc.UpdateTimeoutBlockDeltaResponse;
  return proto.boltzrpc.UpdateTimeoutBlockDeltaResponse.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.boltzrpc.UpdateTimeoutBlockDeltaResponse} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.boltzrpc.UpdateTimeoutBlockDeltaResponse}
 */
proto.boltzrpc.UpdateTimeoutBlockDeltaResponse.deserializeBinaryFromReader = function(msg, reader) {
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
proto.boltzrpc.UpdateTimeoutBlockDeltaResponse.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.boltzrpc.UpdateTimeoutBlockDeltaResponse.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.boltzrpc.UpdateTimeoutBlockDeltaResponse} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.boltzrpc.UpdateTimeoutBlockDeltaResponse.serializeBinaryToWriter = function(message, writer) {
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
proto.boltzrpc.AddReferralRequest.prototype.toObject = function(opt_includeInstance) {
  return proto.boltzrpc.AddReferralRequest.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.boltzrpc.AddReferralRequest} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.boltzrpc.AddReferralRequest.toObject = function(includeInstance, msg) {
  var f, obj = {
    id: jspb.Message.getFieldWithDefault(msg, 1, ""),
    feeShare: jspb.Message.getFieldWithDefault(msg, 2, 0),
    routingNode: jspb.Message.getFieldWithDefault(msg, 3, "")
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
 * @return {!proto.boltzrpc.AddReferralRequest}
 */
proto.boltzrpc.AddReferralRequest.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.boltzrpc.AddReferralRequest;
  return proto.boltzrpc.AddReferralRequest.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.boltzrpc.AddReferralRequest} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.boltzrpc.AddReferralRequest}
 */
proto.boltzrpc.AddReferralRequest.deserializeBinaryFromReader = function(msg, reader) {
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
      var value = /** @type {number} */ (reader.readUint32());
      msg.setFeeShare(value);
      break;
    case 3:
      var value = /** @type {string} */ (reader.readString());
      msg.setRoutingNode(value);
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
proto.boltzrpc.AddReferralRequest.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.boltzrpc.AddReferralRequest.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.boltzrpc.AddReferralRequest} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.boltzrpc.AddReferralRequest.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getId();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
  f = message.getFeeShare();
  if (f !== 0) {
    writer.writeUint32(
      2,
      f
    );
  }
  f = message.getRoutingNode();
  if (f.length > 0) {
    writer.writeString(
      3,
      f
    );
  }
};


/**
 * optional string id = 1;
 * @return {string}
 */
proto.boltzrpc.AddReferralRequest.prototype.getId = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.boltzrpc.AddReferralRequest} returns this
 */
proto.boltzrpc.AddReferralRequest.prototype.setId = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};


/**
 * optional uint32 fee_share = 2;
 * @return {number}
 */
proto.boltzrpc.AddReferralRequest.prototype.getFeeShare = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 2, 0));
};


/**
 * @param {number} value
 * @return {!proto.boltzrpc.AddReferralRequest} returns this
 */
proto.boltzrpc.AddReferralRequest.prototype.setFeeShare = function(value) {
  return jspb.Message.setProto3IntField(this, 2, value);
};


/**
 * optional string routing_node = 3;
 * @return {string}
 */
proto.boltzrpc.AddReferralRequest.prototype.getRoutingNode = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 3, ""));
};


/**
 * @param {string} value
 * @return {!proto.boltzrpc.AddReferralRequest} returns this
 */
proto.boltzrpc.AddReferralRequest.prototype.setRoutingNode = function(value) {
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
proto.boltzrpc.AddReferralResponse.prototype.toObject = function(opt_includeInstance) {
  return proto.boltzrpc.AddReferralResponse.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.boltzrpc.AddReferralResponse} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.boltzrpc.AddReferralResponse.toObject = function(includeInstance, msg) {
  var f, obj = {
    apiKey: jspb.Message.getFieldWithDefault(msg, 1, ""),
    apiSecret: jspb.Message.getFieldWithDefault(msg, 2, "")
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
 * @return {!proto.boltzrpc.AddReferralResponse}
 */
proto.boltzrpc.AddReferralResponse.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.boltzrpc.AddReferralResponse;
  return proto.boltzrpc.AddReferralResponse.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.boltzrpc.AddReferralResponse} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.boltzrpc.AddReferralResponse}
 */
proto.boltzrpc.AddReferralResponse.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setApiKey(value);
      break;
    case 2:
      var value = /** @type {string} */ (reader.readString());
      msg.setApiSecret(value);
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
proto.boltzrpc.AddReferralResponse.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.boltzrpc.AddReferralResponse.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.boltzrpc.AddReferralResponse} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.boltzrpc.AddReferralResponse.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getApiKey();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
  f = message.getApiSecret();
  if (f.length > 0) {
    writer.writeString(
      2,
      f
    );
  }
};


/**
 * optional string api_key = 1;
 * @return {string}
 */
proto.boltzrpc.AddReferralResponse.prototype.getApiKey = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.boltzrpc.AddReferralResponse} returns this
 */
proto.boltzrpc.AddReferralResponse.prototype.setApiKey = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};


/**
 * optional string api_secret = 2;
 * @return {string}
 */
proto.boltzrpc.AddReferralResponse.prototype.getApiSecret = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 2, ""));
};


/**
 * @param {string} value
 * @return {!proto.boltzrpc.AddReferralResponse} returns this
 */
proto.boltzrpc.AddReferralResponse.prototype.setApiSecret = function(value) {
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
proto.boltzrpc.SweepSwapsRequest.prototype.toObject = function(opt_includeInstance) {
  return proto.boltzrpc.SweepSwapsRequest.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.boltzrpc.SweepSwapsRequest} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.boltzrpc.SweepSwapsRequest.toObject = function(includeInstance, msg) {
  var f, obj = {
    symbol: jspb.Message.getFieldWithDefault(msg, 1, "")
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
 * @return {!proto.boltzrpc.SweepSwapsRequest}
 */
proto.boltzrpc.SweepSwapsRequest.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.boltzrpc.SweepSwapsRequest;
  return proto.boltzrpc.SweepSwapsRequest.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.boltzrpc.SweepSwapsRequest} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.boltzrpc.SweepSwapsRequest}
 */
proto.boltzrpc.SweepSwapsRequest.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setSymbol(value);
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
proto.boltzrpc.SweepSwapsRequest.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.boltzrpc.SweepSwapsRequest.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.boltzrpc.SweepSwapsRequest} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.boltzrpc.SweepSwapsRequest.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = /** @type {string} */ (jspb.Message.getField(message, 1));
  if (f != null) {
    writer.writeString(
      1,
      f
    );
  }
};


/**
 * optional string symbol = 1;
 * @return {string}
 */
proto.boltzrpc.SweepSwapsRequest.prototype.getSymbol = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.boltzrpc.SweepSwapsRequest} returns this
 */
proto.boltzrpc.SweepSwapsRequest.prototype.setSymbol = function(value) {
  return jspb.Message.setField(this, 1, value);
};


/**
 * Clears the field making it undefined.
 * @return {!proto.boltzrpc.SweepSwapsRequest} returns this
 */
proto.boltzrpc.SweepSwapsRequest.prototype.clearSymbol = function() {
  return jspb.Message.setField(this, 1, undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.boltzrpc.SweepSwapsRequest.prototype.hasSymbol = function() {
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
proto.boltzrpc.SweepSwapsResponse.prototype.toObject = function(opt_includeInstance) {
  return proto.boltzrpc.SweepSwapsResponse.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.boltzrpc.SweepSwapsResponse} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.boltzrpc.SweepSwapsResponse.toObject = function(includeInstance, msg) {
  var f, obj = {
    claimedSymbolsMap: (f = msg.getClaimedSymbolsMap()) ? f.toObject(includeInstance, proto.boltzrpc.SweepSwapsResponse.ClaimedSwaps.toObject) : []
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
 * @return {!proto.boltzrpc.SweepSwapsResponse}
 */
proto.boltzrpc.SweepSwapsResponse.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.boltzrpc.SweepSwapsResponse;
  return proto.boltzrpc.SweepSwapsResponse.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.boltzrpc.SweepSwapsResponse} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.boltzrpc.SweepSwapsResponse}
 */
proto.boltzrpc.SweepSwapsResponse.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = msg.getClaimedSymbolsMap();
      reader.readMessage(value, function(message, reader) {
        jspb.Map.deserializeBinary(message, reader, jspb.BinaryReader.prototype.readString, jspb.BinaryReader.prototype.readMessage, proto.boltzrpc.SweepSwapsResponse.ClaimedSwaps.deserializeBinaryFromReader, "", new proto.boltzrpc.SweepSwapsResponse.ClaimedSwaps());
         });
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
proto.boltzrpc.SweepSwapsResponse.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.boltzrpc.SweepSwapsResponse.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.boltzrpc.SweepSwapsResponse} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.boltzrpc.SweepSwapsResponse.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getClaimedSymbolsMap(true);
  if (f && f.getLength() > 0) {
    f.serializeBinary(1, writer, jspb.BinaryWriter.prototype.writeString, jspb.BinaryWriter.prototype.writeMessage, proto.boltzrpc.SweepSwapsResponse.ClaimedSwaps.serializeBinaryToWriter);
  }
};



/**
 * List of repeated fields within this message type.
 * @private {!Array<number>}
 * @const
 */
proto.boltzrpc.SweepSwapsResponse.ClaimedSwaps.repeatedFields_ = [1];



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
proto.boltzrpc.SweepSwapsResponse.ClaimedSwaps.prototype.toObject = function(opt_includeInstance) {
  return proto.boltzrpc.SweepSwapsResponse.ClaimedSwaps.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.boltzrpc.SweepSwapsResponse.ClaimedSwaps} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.boltzrpc.SweepSwapsResponse.ClaimedSwaps.toObject = function(includeInstance, msg) {
  var f, obj = {
    claimedIdsList: (f = jspb.Message.getRepeatedField(msg, 1)) == null ? undefined : f
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
 * @return {!proto.boltzrpc.SweepSwapsResponse.ClaimedSwaps}
 */
proto.boltzrpc.SweepSwapsResponse.ClaimedSwaps.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.boltzrpc.SweepSwapsResponse.ClaimedSwaps;
  return proto.boltzrpc.SweepSwapsResponse.ClaimedSwaps.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.boltzrpc.SweepSwapsResponse.ClaimedSwaps} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.boltzrpc.SweepSwapsResponse.ClaimedSwaps}
 */
proto.boltzrpc.SweepSwapsResponse.ClaimedSwaps.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.addClaimedIds(value);
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
proto.boltzrpc.SweepSwapsResponse.ClaimedSwaps.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.boltzrpc.SweepSwapsResponse.ClaimedSwaps.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.boltzrpc.SweepSwapsResponse.ClaimedSwaps} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.boltzrpc.SweepSwapsResponse.ClaimedSwaps.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getClaimedIdsList();
  if (f.length > 0) {
    writer.writeRepeatedString(
      1,
      f
    );
  }
};


/**
 * repeated string claimed_ids = 1;
 * @return {!Array<string>}
 */
proto.boltzrpc.SweepSwapsResponse.ClaimedSwaps.prototype.getClaimedIdsList = function() {
  return /** @type {!Array<string>} */ (jspb.Message.getRepeatedField(this, 1));
};


/**
 * @param {!Array<string>} value
 * @return {!proto.boltzrpc.SweepSwapsResponse.ClaimedSwaps} returns this
 */
proto.boltzrpc.SweepSwapsResponse.ClaimedSwaps.prototype.setClaimedIdsList = function(value) {
  return jspb.Message.setField(this, 1, value || []);
};


/**
 * @param {string} value
 * @param {number=} opt_index
 * @return {!proto.boltzrpc.SweepSwapsResponse.ClaimedSwaps} returns this
 */
proto.boltzrpc.SweepSwapsResponse.ClaimedSwaps.prototype.addClaimedIds = function(value, opt_index) {
  return jspb.Message.addToRepeatedField(this, 1, value, opt_index);
};


/**
 * Clears the list making it empty but non-null.
 * @return {!proto.boltzrpc.SweepSwapsResponse.ClaimedSwaps} returns this
 */
proto.boltzrpc.SweepSwapsResponse.ClaimedSwaps.prototype.clearClaimedIdsList = function() {
  return this.setClaimedIdsList([]);
};


/**
 * map<string, ClaimedSwaps> claimed_symbols = 1;
 * @param {boolean=} opt_noLazyCreate Do not create the map if
 * empty, instead returning `undefined`
 * @return {!jspb.Map<string,!proto.boltzrpc.SweepSwapsResponse.ClaimedSwaps>}
 */
proto.boltzrpc.SweepSwapsResponse.prototype.getClaimedSymbolsMap = function(opt_noLazyCreate) {
  return /** @type {!jspb.Map<string,!proto.boltzrpc.SweepSwapsResponse.ClaimedSwaps>} */ (
      jspb.Message.getMapField(this, 1, opt_noLazyCreate,
      proto.boltzrpc.SweepSwapsResponse.ClaimedSwaps));
};


/**
 * Clears values from the map. The map will be non-null.
 * @return {!proto.boltzrpc.SweepSwapsResponse} returns this
 */
proto.boltzrpc.SweepSwapsResponse.prototype.clearClaimedSymbolsMap = function() {
  this.getClaimedSymbolsMap().clear();
  return this;};





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
proto.boltzrpc.ListSwapsRequest.prototype.toObject = function(opt_includeInstance) {
  return proto.boltzrpc.ListSwapsRequest.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.boltzrpc.ListSwapsRequest} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.boltzrpc.ListSwapsRequest.toObject = function(includeInstance, msg) {
  var f, obj = {
    status: jspb.Message.getFieldWithDefault(msg, 1, ""),
    limit: jspb.Message.getFieldWithDefault(msg, 2, 0)
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
 * @return {!proto.boltzrpc.ListSwapsRequest}
 */
proto.boltzrpc.ListSwapsRequest.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.boltzrpc.ListSwapsRequest;
  return proto.boltzrpc.ListSwapsRequest.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.boltzrpc.ListSwapsRequest} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.boltzrpc.ListSwapsRequest}
 */
proto.boltzrpc.ListSwapsRequest.deserializeBinaryFromReader = function(msg, reader) {
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
      var value = /** @type {number} */ (reader.readUint64());
      msg.setLimit(value);
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
proto.boltzrpc.ListSwapsRequest.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.boltzrpc.ListSwapsRequest.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.boltzrpc.ListSwapsRequest} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.boltzrpc.ListSwapsRequest.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = /** @type {string} */ (jspb.Message.getField(message, 1));
  if (f != null) {
    writer.writeString(
      1,
      f
    );
  }
  f = /** @type {number} */ (jspb.Message.getField(message, 2));
  if (f != null) {
    writer.writeUint64(
      2,
      f
    );
  }
};


/**
 * optional string status = 1;
 * @return {string}
 */
proto.boltzrpc.ListSwapsRequest.prototype.getStatus = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.boltzrpc.ListSwapsRequest} returns this
 */
proto.boltzrpc.ListSwapsRequest.prototype.setStatus = function(value) {
  return jspb.Message.setField(this, 1, value);
};


/**
 * Clears the field making it undefined.
 * @return {!proto.boltzrpc.ListSwapsRequest} returns this
 */
proto.boltzrpc.ListSwapsRequest.prototype.clearStatus = function() {
  return jspb.Message.setField(this, 1, undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.boltzrpc.ListSwapsRequest.prototype.hasStatus = function() {
  return jspb.Message.getField(this, 1) != null;
};


/**
 * optional uint64 limit = 2;
 * @return {number}
 */
proto.boltzrpc.ListSwapsRequest.prototype.getLimit = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 2, 0));
};


/**
 * @param {number} value
 * @return {!proto.boltzrpc.ListSwapsRequest} returns this
 */
proto.boltzrpc.ListSwapsRequest.prototype.setLimit = function(value) {
  return jspb.Message.setField(this, 2, value);
};


/**
 * Clears the field making it undefined.
 * @return {!proto.boltzrpc.ListSwapsRequest} returns this
 */
proto.boltzrpc.ListSwapsRequest.prototype.clearLimit = function() {
  return jspb.Message.setField(this, 2, undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.boltzrpc.ListSwapsRequest.prototype.hasLimit = function() {
  return jspb.Message.getField(this, 2) != null;
};



/**
 * List of repeated fields within this message type.
 * @private {!Array<number>}
 * @const
 */
proto.boltzrpc.ListSwapsResponse.repeatedFields_ = [1,2,3];



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
proto.boltzrpc.ListSwapsResponse.prototype.toObject = function(opt_includeInstance) {
  return proto.boltzrpc.ListSwapsResponse.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.boltzrpc.ListSwapsResponse} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.boltzrpc.ListSwapsResponse.toObject = function(includeInstance, msg) {
  var f, obj = {
    submarineSwapsList: (f = jspb.Message.getRepeatedField(msg, 1)) == null ? undefined : f,
    reverseSwapsList: (f = jspb.Message.getRepeatedField(msg, 2)) == null ? undefined : f,
    chainSwapsList: (f = jspb.Message.getRepeatedField(msg, 3)) == null ? undefined : f
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
 * @return {!proto.boltzrpc.ListSwapsResponse}
 */
proto.boltzrpc.ListSwapsResponse.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.boltzrpc.ListSwapsResponse;
  return proto.boltzrpc.ListSwapsResponse.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.boltzrpc.ListSwapsResponse} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.boltzrpc.ListSwapsResponse}
 */
proto.boltzrpc.ListSwapsResponse.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.addSubmarineSwaps(value);
      break;
    case 2:
      var value = /** @type {string} */ (reader.readString());
      msg.addReverseSwaps(value);
      break;
    case 3:
      var value = /** @type {string} */ (reader.readString());
      msg.addChainSwaps(value);
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
proto.boltzrpc.ListSwapsResponse.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.boltzrpc.ListSwapsResponse.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.boltzrpc.ListSwapsResponse} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.boltzrpc.ListSwapsResponse.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getSubmarineSwapsList();
  if (f.length > 0) {
    writer.writeRepeatedString(
      1,
      f
    );
  }
  f = message.getReverseSwapsList();
  if (f.length > 0) {
    writer.writeRepeatedString(
      2,
      f
    );
  }
  f = message.getChainSwapsList();
  if (f.length > 0) {
    writer.writeRepeatedString(
      3,
      f
    );
  }
};


/**
 * repeated string submarine_swaps = 1;
 * @return {!Array<string>}
 */
proto.boltzrpc.ListSwapsResponse.prototype.getSubmarineSwapsList = function() {
  return /** @type {!Array<string>} */ (jspb.Message.getRepeatedField(this, 1));
};


/**
 * @param {!Array<string>} value
 * @return {!proto.boltzrpc.ListSwapsResponse} returns this
 */
proto.boltzrpc.ListSwapsResponse.prototype.setSubmarineSwapsList = function(value) {
  return jspb.Message.setField(this, 1, value || []);
};


/**
 * @param {string} value
 * @param {number=} opt_index
 * @return {!proto.boltzrpc.ListSwapsResponse} returns this
 */
proto.boltzrpc.ListSwapsResponse.prototype.addSubmarineSwaps = function(value, opt_index) {
  return jspb.Message.addToRepeatedField(this, 1, value, opt_index);
};


/**
 * Clears the list making it empty but non-null.
 * @return {!proto.boltzrpc.ListSwapsResponse} returns this
 */
proto.boltzrpc.ListSwapsResponse.prototype.clearSubmarineSwapsList = function() {
  return this.setSubmarineSwapsList([]);
};


/**
 * repeated string reverse_swaps = 2;
 * @return {!Array<string>}
 */
proto.boltzrpc.ListSwapsResponse.prototype.getReverseSwapsList = function() {
  return /** @type {!Array<string>} */ (jspb.Message.getRepeatedField(this, 2));
};


/**
 * @param {!Array<string>} value
 * @return {!proto.boltzrpc.ListSwapsResponse} returns this
 */
proto.boltzrpc.ListSwapsResponse.prototype.setReverseSwapsList = function(value) {
  return jspb.Message.setField(this, 2, value || []);
};


/**
 * @param {string} value
 * @param {number=} opt_index
 * @return {!proto.boltzrpc.ListSwapsResponse} returns this
 */
proto.boltzrpc.ListSwapsResponse.prototype.addReverseSwaps = function(value, opt_index) {
  return jspb.Message.addToRepeatedField(this, 2, value, opt_index);
};


/**
 * Clears the list making it empty but non-null.
 * @return {!proto.boltzrpc.ListSwapsResponse} returns this
 */
proto.boltzrpc.ListSwapsResponse.prototype.clearReverseSwapsList = function() {
  return this.setReverseSwapsList([]);
};


/**
 * repeated string chain_swaps = 3;
 * @return {!Array<string>}
 */
proto.boltzrpc.ListSwapsResponse.prototype.getChainSwapsList = function() {
  return /** @type {!Array<string>} */ (jspb.Message.getRepeatedField(this, 3));
};


/**
 * @param {!Array<string>} value
 * @return {!proto.boltzrpc.ListSwapsResponse} returns this
 */
proto.boltzrpc.ListSwapsResponse.prototype.setChainSwapsList = function(value) {
  return jspb.Message.setField(this, 3, value || []);
};


/**
 * @param {string} value
 * @param {number=} opt_index
 * @return {!proto.boltzrpc.ListSwapsResponse} returns this
 */
proto.boltzrpc.ListSwapsResponse.prototype.addChainSwaps = function(value, opt_index) {
  return jspb.Message.addToRepeatedField(this, 3, value, opt_index);
};


/**
 * Clears the list making it empty but non-null.
 * @return {!proto.boltzrpc.ListSwapsResponse} returns this
 */
proto.boltzrpc.ListSwapsResponse.prototype.clearChainSwapsList = function() {
  return this.setChainSwapsList([]);
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
proto.boltzrpc.RescanRequest.prototype.toObject = function(opt_includeInstance) {
  return proto.boltzrpc.RescanRequest.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.boltzrpc.RescanRequest} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.boltzrpc.RescanRequest.toObject = function(includeInstance, msg) {
  var f, obj = {
    symbol: jspb.Message.getFieldWithDefault(msg, 1, ""),
    startHeight: jspb.Message.getFieldWithDefault(msg, 2, 0),
    includeMempool: jspb.Message.getBooleanFieldWithDefault(msg, 3, false)
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
 * @return {!proto.boltzrpc.RescanRequest}
 */
proto.boltzrpc.RescanRequest.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.boltzrpc.RescanRequest;
  return proto.boltzrpc.RescanRequest.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.boltzrpc.RescanRequest} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.boltzrpc.RescanRequest}
 */
proto.boltzrpc.RescanRequest.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setSymbol(value);
      break;
    case 2:
      var value = /** @type {number} */ (reader.readUint64());
      msg.setStartHeight(value);
      break;
    case 3:
      var value = /** @type {boolean} */ (reader.readBool());
      msg.setIncludeMempool(value);
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
proto.boltzrpc.RescanRequest.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.boltzrpc.RescanRequest.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.boltzrpc.RescanRequest} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.boltzrpc.RescanRequest.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getSymbol();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
  f = message.getStartHeight();
  if (f !== 0) {
    writer.writeUint64(
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
 * optional string symbol = 1;
 * @return {string}
 */
proto.boltzrpc.RescanRequest.prototype.getSymbol = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.boltzrpc.RescanRequest} returns this
 */
proto.boltzrpc.RescanRequest.prototype.setSymbol = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};


/**
 * optional uint64 start_height = 2;
 * @return {number}
 */
proto.boltzrpc.RescanRequest.prototype.getStartHeight = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 2, 0));
};


/**
 * @param {number} value
 * @return {!proto.boltzrpc.RescanRequest} returns this
 */
proto.boltzrpc.RescanRequest.prototype.setStartHeight = function(value) {
  return jspb.Message.setProto3IntField(this, 2, value);
};


/**
 * optional bool include_mempool = 3;
 * @return {boolean}
 */
proto.boltzrpc.RescanRequest.prototype.getIncludeMempool = function() {
  return /** @type {boolean} */ (jspb.Message.getBooleanFieldWithDefault(this, 3, false));
};


/**
 * @param {boolean} value
 * @return {!proto.boltzrpc.RescanRequest} returns this
 */
proto.boltzrpc.RescanRequest.prototype.setIncludeMempool = function(value) {
  return jspb.Message.setField(this, 3, value);
};


/**
 * Clears the field making it undefined.
 * @return {!proto.boltzrpc.RescanRequest} returns this
 */
proto.boltzrpc.RescanRequest.prototype.clearIncludeMempool = function() {
  return jspb.Message.setField(this, 3, undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.boltzrpc.RescanRequest.prototype.hasIncludeMempool = function() {
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
proto.boltzrpc.RescanResponse.prototype.toObject = function(opt_includeInstance) {
  return proto.boltzrpc.RescanResponse.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.boltzrpc.RescanResponse} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.boltzrpc.RescanResponse.toObject = function(includeInstance, msg) {
  var f, obj = {
    startHeight: jspb.Message.getFieldWithDefault(msg, 1, 0),
    endHeight: jspb.Message.getFieldWithDefault(msg, 2, 0)
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
 * @return {!proto.boltzrpc.RescanResponse}
 */
proto.boltzrpc.RescanResponse.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.boltzrpc.RescanResponse;
  return proto.boltzrpc.RescanResponse.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.boltzrpc.RescanResponse} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.boltzrpc.RescanResponse}
 */
proto.boltzrpc.RescanResponse.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {number} */ (reader.readUint64());
      msg.setStartHeight(value);
      break;
    case 2:
      var value = /** @type {number} */ (reader.readUint64());
      msg.setEndHeight(value);
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
proto.boltzrpc.RescanResponse.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.boltzrpc.RescanResponse.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.boltzrpc.RescanResponse} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.boltzrpc.RescanResponse.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getStartHeight();
  if (f !== 0) {
    writer.writeUint64(
      1,
      f
    );
  }
  f = message.getEndHeight();
  if (f !== 0) {
    writer.writeUint64(
      2,
      f
    );
  }
};


/**
 * optional uint64 start_height = 1;
 * @return {number}
 */
proto.boltzrpc.RescanResponse.prototype.getStartHeight = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 1, 0));
};


/**
 * @param {number} value
 * @return {!proto.boltzrpc.RescanResponse} returns this
 */
proto.boltzrpc.RescanResponse.prototype.setStartHeight = function(value) {
  return jspb.Message.setProto3IntField(this, 1, value);
};


/**
 * optional uint64 end_height = 2;
 * @return {number}
 */
proto.boltzrpc.RescanResponse.prototype.getEndHeight = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 2, 0));
};


/**
 * @param {number} value
 * @return {!proto.boltzrpc.RescanResponse} returns this
 */
proto.boltzrpc.RescanResponse.prototype.setEndHeight = function(value) {
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
proto.boltzrpc.SetSwapStatusRequest.prototype.toObject = function(opt_includeInstance) {
  return proto.boltzrpc.SetSwapStatusRequest.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.boltzrpc.SetSwapStatusRequest} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.boltzrpc.SetSwapStatusRequest.toObject = function(includeInstance, msg) {
  var f, obj = {
    id: jspb.Message.getFieldWithDefault(msg, 1, ""),
    status: jspb.Message.getFieldWithDefault(msg, 2, "")
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
 * @return {!proto.boltzrpc.SetSwapStatusRequest}
 */
proto.boltzrpc.SetSwapStatusRequest.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.boltzrpc.SetSwapStatusRequest;
  return proto.boltzrpc.SetSwapStatusRequest.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.boltzrpc.SetSwapStatusRequest} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.boltzrpc.SetSwapStatusRequest}
 */
proto.boltzrpc.SetSwapStatusRequest.deserializeBinaryFromReader = function(msg, reader) {
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
proto.boltzrpc.SetSwapStatusRequest.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.boltzrpc.SetSwapStatusRequest.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.boltzrpc.SetSwapStatusRequest} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.boltzrpc.SetSwapStatusRequest.serializeBinaryToWriter = function(message, writer) {
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
};


/**
 * optional string id = 1;
 * @return {string}
 */
proto.boltzrpc.SetSwapStatusRequest.prototype.getId = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.boltzrpc.SetSwapStatusRequest} returns this
 */
proto.boltzrpc.SetSwapStatusRequest.prototype.setId = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};


/**
 * optional string status = 2;
 * @return {string}
 */
proto.boltzrpc.SetSwapStatusRequest.prototype.getStatus = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 2, ""));
};


/**
 * @param {string} value
 * @return {!proto.boltzrpc.SetSwapStatusRequest} returns this
 */
proto.boltzrpc.SetSwapStatusRequest.prototype.setStatus = function(value) {
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
proto.boltzrpc.SetSwapStatusResponse.prototype.toObject = function(opt_includeInstance) {
  return proto.boltzrpc.SetSwapStatusResponse.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.boltzrpc.SetSwapStatusResponse} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.boltzrpc.SetSwapStatusResponse.toObject = function(includeInstance, msg) {
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
 * @return {!proto.boltzrpc.SetSwapStatusResponse}
 */
proto.boltzrpc.SetSwapStatusResponse.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.boltzrpc.SetSwapStatusResponse;
  return proto.boltzrpc.SetSwapStatusResponse.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.boltzrpc.SetSwapStatusResponse} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.boltzrpc.SetSwapStatusResponse}
 */
proto.boltzrpc.SetSwapStatusResponse.deserializeBinaryFromReader = function(msg, reader) {
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
proto.boltzrpc.SetSwapStatusResponse.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.boltzrpc.SetSwapStatusResponse.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.boltzrpc.SetSwapStatusResponse} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.boltzrpc.SetSwapStatusResponse.serializeBinaryToWriter = function(message, writer) {
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
proto.boltzrpc.AllowRefundRequest.prototype.toObject = function(opt_includeInstance) {
  return proto.boltzrpc.AllowRefundRequest.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.boltzrpc.AllowRefundRequest} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.boltzrpc.AllowRefundRequest.toObject = function(includeInstance, msg) {
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
 * @return {!proto.boltzrpc.AllowRefundRequest}
 */
proto.boltzrpc.AllowRefundRequest.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.boltzrpc.AllowRefundRequest;
  return proto.boltzrpc.AllowRefundRequest.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.boltzrpc.AllowRefundRequest} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.boltzrpc.AllowRefundRequest}
 */
proto.boltzrpc.AllowRefundRequest.deserializeBinaryFromReader = function(msg, reader) {
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
proto.boltzrpc.AllowRefundRequest.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.boltzrpc.AllowRefundRequest.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.boltzrpc.AllowRefundRequest} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.boltzrpc.AllowRefundRequest.serializeBinaryToWriter = function(message, writer) {
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
proto.boltzrpc.AllowRefundRequest.prototype.getId = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.boltzrpc.AllowRefundRequest} returns this
 */
proto.boltzrpc.AllowRefundRequest.prototype.setId = function(value) {
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
proto.boltzrpc.AllowRefundResponse.prototype.toObject = function(opt_includeInstance) {
  return proto.boltzrpc.AllowRefundResponse.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.boltzrpc.AllowRefundResponse} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.boltzrpc.AllowRefundResponse.toObject = function(includeInstance, msg) {
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
 * @return {!proto.boltzrpc.AllowRefundResponse}
 */
proto.boltzrpc.AllowRefundResponse.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.boltzrpc.AllowRefundResponse;
  return proto.boltzrpc.AllowRefundResponse.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.boltzrpc.AllowRefundResponse} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.boltzrpc.AllowRefundResponse}
 */
proto.boltzrpc.AllowRefundResponse.deserializeBinaryFromReader = function(msg, reader) {
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
proto.boltzrpc.AllowRefundResponse.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.boltzrpc.AllowRefundResponse.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.boltzrpc.AllowRefundResponse} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.boltzrpc.AllowRefundResponse.serializeBinaryToWriter = function(message, writer) {
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
proto.boltzrpc.GetLabelRequest.prototype.toObject = function(opt_includeInstance) {
  return proto.boltzrpc.GetLabelRequest.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.boltzrpc.GetLabelRequest} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.boltzrpc.GetLabelRequest.toObject = function(includeInstance, msg) {
  var f, obj = {
    txId: jspb.Message.getFieldWithDefault(msg, 1, "")
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
 * @return {!proto.boltzrpc.GetLabelRequest}
 */
proto.boltzrpc.GetLabelRequest.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.boltzrpc.GetLabelRequest;
  return proto.boltzrpc.GetLabelRequest.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.boltzrpc.GetLabelRequest} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.boltzrpc.GetLabelRequest}
 */
proto.boltzrpc.GetLabelRequest.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setTxId(value);
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
proto.boltzrpc.GetLabelRequest.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.boltzrpc.GetLabelRequest.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.boltzrpc.GetLabelRequest} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.boltzrpc.GetLabelRequest.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getTxId();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
};


/**
 * optional string tx_id = 1;
 * @return {string}
 */
proto.boltzrpc.GetLabelRequest.prototype.getTxId = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.boltzrpc.GetLabelRequest} returns this
 */
proto.boltzrpc.GetLabelRequest.prototype.setTxId = function(value) {
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
proto.boltzrpc.GetLabelResponse.prototype.toObject = function(opt_includeInstance) {
  return proto.boltzrpc.GetLabelResponse.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.boltzrpc.GetLabelResponse} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.boltzrpc.GetLabelResponse.toObject = function(includeInstance, msg) {
  var f, obj = {
    symbol: jspb.Message.getFieldWithDefault(msg, 1, ""),
    label: jspb.Message.getFieldWithDefault(msg, 2, "")
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
 * @return {!proto.boltzrpc.GetLabelResponse}
 */
proto.boltzrpc.GetLabelResponse.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.boltzrpc.GetLabelResponse;
  return proto.boltzrpc.GetLabelResponse.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.boltzrpc.GetLabelResponse} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.boltzrpc.GetLabelResponse}
 */
proto.boltzrpc.GetLabelResponse.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setSymbol(value);
      break;
    case 2:
      var value = /** @type {string} */ (reader.readString());
      msg.setLabel(value);
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
proto.boltzrpc.GetLabelResponse.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.boltzrpc.GetLabelResponse.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.boltzrpc.GetLabelResponse} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.boltzrpc.GetLabelResponse.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getSymbol();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
  f = message.getLabel();
  if (f.length > 0) {
    writer.writeString(
      2,
      f
    );
  }
};


/**
 * optional string symbol = 1;
 * @return {string}
 */
proto.boltzrpc.GetLabelResponse.prototype.getSymbol = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.boltzrpc.GetLabelResponse} returns this
 */
proto.boltzrpc.GetLabelResponse.prototype.setSymbol = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};


/**
 * optional string label = 2;
 * @return {string}
 */
proto.boltzrpc.GetLabelResponse.prototype.getLabel = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 2, ""));
};


/**
 * @param {string} value
 * @return {!proto.boltzrpc.GetLabelResponse} returns this
 */
proto.boltzrpc.GetLabelResponse.prototype.setLabel = function(value) {
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
proto.boltzrpc.GetReferralsRequest.prototype.toObject = function(opt_includeInstance) {
  return proto.boltzrpc.GetReferralsRequest.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.boltzrpc.GetReferralsRequest} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.boltzrpc.GetReferralsRequest.toObject = function(includeInstance, msg) {
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
 * @return {!proto.boltzrpc.GetReferralsRequest}
 */
proto.boltzrpc.GetReferralsRequest.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.boltzrpc.GetReferralsRequest;
  return proto.boltzrpc.GetReferralsRequest.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.boltzrpc.GetReferralsRequest} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.boltzrpc.GetReferralsRequest}
 */
proto.boltzrpc.GetReferralsRequest.deserializeBinaryFromReader = function(msg, reader) {
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
proto.boltzrpc.GetReferralsRequest.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.boltzrpc.GetReferralsRequest.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.boltzrpc.GetReferralsRequest} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.boltzrpc.GetReferralsRequest.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = /** @type {string} */ (jspb.Message.getField(message, 1));
  if (f != null) {
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
proto.boltzrpc.GetReferralsRequest.prototype.getId = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.boltzrpc.GetReferralsRequest} returns this
 */
proto.boltzrpc.GetReferralsRequest.prototype.setId = function(value) {
  return jspb.Message.setField(this, 1, value);
};


/**
 * Clears the field making it undefined.
 * @return {!proto.boltzrpc.GetReferralsRequest} returns this
 */
proto.boltzrpc.GetReferralsRequest.prototype.clearId = function() {
  return jspb.Message.setField(this, 1, undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.boltzrpc.GetReferralsRequest.prototype.hasId = function() {
  return jspb.Message.getField(this, 1) != null;
};



/**
 * List of repeated fields within this message type.
 * @private {!Array<number>}
 * @const
 */
proto.boltzrpc.GetReferralsResponse.repeatedFields_ = [1];



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
proto.boltzrpc.GetReferralsResponse.prototype.toObject = function(opt_includeInstance) {
  return proto.boltzrpc.GetReferralsResponse.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.boltzrpc.GetReferralsResponse} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.boltzrpc.GetReferralsResponse.toObject = function(includeInstance, msg) {
  var f, obj = {
    referralList: jspb.Message.toObjectList(msg.getReferralList(),
    proto.boltzrpc.GetReferralsResponse.Referral.toObject, includeInstance)
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
 * @return {!proto.boltzrpc.GetReferralsResponse}
 */
proto.boltzrpc.GetReferralsResponse.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.boltzrpc.GetReferralsResponse;
  return proto.boltzrpc.GetReferralsResponse.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.boltzrpc.GetReferralsResponse} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.boltzrpc.GetReferralsResponse}
 */
proto.boltzrpc.GetReferralsResponse.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = new proto.boltzrpc.GetReferralsResponse.Referral;
      reader.readMessage(value,proto.boltzrpc.GetReferralsResponse.Referral.deserializeBinaryFromReader);
      msg.addReferral(value);
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
proto.boltzrpc.GetReferralsResponse.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.boltzrpc.GetReferralsResponse.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.boltzrpc.GetReferralsResponse} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.boltzrpc.GetReferralsResponse.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getReferralList();
  if (f.length > 0) {
    writer.writeRepeatedMessage(
      1,
      f,
      proto.boltzrpc.GetReferralsResponse.Referral.serializeBinaryToWriter
    );
  }
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
proto.boltzrpc.GetReferralsResponse.Referral.prototype.toObject = function(opt_includeInstance) {
  return proto.boltzrpc.GetReferralsResponse.Referral.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.boltzrpc.GetReferralsResponse.Referral} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.boltzrpc.GetReferralsResponse.Referral.toObject = function(includeInstance, msg) {
  var f, obj = {
    id: jspb.Message.getFieldWithDefault(msg, 1, ""),
    config: jspb.Message.getFieldWithDefault(msg, 2, "")
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
 * @return {!proto.boltzrpc.GetReferralsResponse.Referral}
 */
proto.boltzrpc.GetReferralsResponse.Referral.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.boltzrpc.GetReferralsResponse.Referral;
  return proto.boltzrpc.GetReferralsResponse.Referral.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.boltzrpc.GetReferralsResponse.Referral} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.boltzrpc.GetReferralsResponse.Referral}
 */
proto.boltzrpc.GetReferralsResponse.Referral.deserializeBinaryFromReader = function(msg, reader) {
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
      msg.setConfig(value);
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
proto.boltzrpc.GetReferralsResponse.Referral.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.boltzrpc.GetReferralsResponse.Referral.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.boltzrpc.GetReferralsResponse.Referral} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.boltzrpc.GetReferralsResponse.Referral.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getId();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
  f = /** @type {string} */ (jspb.Message.getField(message, 2));
  if (f != null) {
    writer.writeString(
      2,
      f
    );
  }
};


/**
 * optional string id = 1;
 * @return {string}
 */
proto.boltzrpc.GetReferralsResponse.Referral.prototype.getId = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.boltzrpc.GetReferralsResponse.Referral} returns this
 */
proto.boltzrpc.GetReferralsResponse.Referral.prototype.setId = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};


/**
 * optional string config = 2;
 * @return {string}
 */
proto.boltzrpc.GetReferralsResponse.Referral.prototype.getConfig = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 2, ""));
};


/**
 * @param {string} value
 * @return {!proto.boltzrpc.GetReferralsResponse.Referral} returns this
 */
proto.boltzrpc.GetReferralsResponse.Referral.prototype.setConfig = function(value) {
  return jspb.Message.setField(this, 2, value);
};


/**
 * Clears the field making it undefined.
 * @return {!proto.boltzrpc.GetReferralsResponse.Referral} returns this
 */
proto.boltzrpc.GetReferralsResponse.Referral.prototype.clearConfig = function() {
  return jspb.Message.setField(this, 2, undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.boltzrpc.GetReferralsResponse.Referral.prototype.hasConfig = function() {
  return jspb.Message.getField(this, 2) != null;
};


/**
 * repeated Referral referral = 1;
 * @return {!Array<!proto.boltzrpc.GetReferralsResponse.Referral>}
 */
proto.boltzrpc.GetReferralsResponse.prototype.getReferralList = function() {
  return /** @type{!Array<!proto.boltzrpc.GetReferralsResponse.Referral>} */ (
    jspb.Message.getRepeatedWrapperField(this, proto.boltzrpc.GetReferralsResponse.Referral, 1));
};


/**
 * @param {!Array<!proto.boltzrpc.GetReferralsResponse.Referral>} value
 * @return {!proto.boltzrpc.GetReferralsResponse} returns this
*/
proto.boltzrpc.GetReferralsResponse.prototype.setReferralList = function(value) {
  return jspb.Message.setRepeatedWrapperField(this, 1, value);
};


/**
 * @param {!proto.boltzrpc.GetReferralsResponse.Referral=} opt_value
 * @param {number=} opt_index
 * @return {!proto.boltzrpc.GetReferralsResponse.Referral}
 */
proto.boltzrpc.GetReferralsResponse.prototype.addReferral = function(opt_value, opt_index) {
  return jspb.Message.addToRepeatedWrapperField(this, 1, opt_value, proto.boltzrpc.GetReferralsResponse.Referral, opt_index);
};


/**
 * Clears the list making it empty but non-null.
 * @return {!proto.boltzrpc.GetReferralsResponse} returns this
 */
proto.boltzrpc.GetReferralsResponse.prototype.clearReferralList = function() {
  return this.setReferralList([]);
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
proto.boltzrpc.SetReferralRequest.prototype.toObject = function(opt_includeInstance) {
  return proto.boltzrpc.SetReferralRequest.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.boltzrpc.SetReferralRequest} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.boltzrpc.SetReferralRequest.toObject = function(includeInstance, msg) {
  var f, obj = {
    id: jspb.Message.getFieldWithDefault(msg, 1, ""),
    config: jspb.Message.getFieldWithDefault(msg, 2, "")
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
 * @return {!proto.boltzrpc.SetReferralRequest}
 */
proto.boltzrpc.SetReferralRequest.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.boltzrpc.SetReferralRequest;
  return proto.boltzrpc.SetReferralRequest.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.boltzrpc.SetReferralRequest} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.boltzrpc.SetReferralRequest}
 */
proto.boltzrpc.SetReferralRequest.deserializeBinaryFromReader = function(msg, reader) {
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
      msg.setConfig(value);
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
proto.boltzrpc.SetReferralRequest.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.boltzrpc.SetReferralRequest.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.boltzrpc.SetReferralRequest} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.boltzrpc.SetReferralRequest.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getId();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
  f = /** @type {string} */ (jspb.Message.getField(message, 2));
  if (f != null) {
    writer.writeString(
      2,
      f
    );
  }
};


/**
 * optional string id = 1;
 * @return {string}
 */
proto.boltzrpc.SetReferralRequest.prototype.getId = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.boltzrpc.SetReferralRequest} returns this
 */
proto.boltzrpc.SetReferralRequest.prototype.setId = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};


/**
 * optional string config = 2;
 * @return {string}
 */
proto.boltzrpc.SetReferralRequest.prototype.getConfig = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 2, ""));
};


/**
 * @param {string} value
 * @return {!proto.boltzrpc.SetReferralRequest} returns this
 */
proto.boltzrpc.SetReferralRequest.prototype.setConfig = function(value) {
  return jspb.Message.setField(this, 2, value);
};


/**
 * Clears the field making it undefined.
 * @return {!proto.boltzrpc.SetReferralRequest} returns this
 */
proto.boltzrpc.SetReferralRequest.prototype.clearConfig = function() {
  return jspb.Message.setField(this, 2, undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.boltzrpc.SetReferralRequest.prototype.hasConfig = function() {
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
proto.boltzrpc.SetReferralResponse.prototype.toObject = function(opt_includeInstance) {
  return proto.boltzrpc.SetReferralResponse.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.boltzrpc.SetReferralResponse} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.boltzrpc.SetReferralResponse.toObject = function(includeInstance, msg) {
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
 * @return {!proto.boltzrpc.SetReferralResponse}
 */
proto.boltzrpc.SetReferralResponse.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.boltzrpc.SetReferralResponse;
  return proto.boltzrpc.SetReferralResponse.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.boltzrpc.SetReferralResponse} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.boltzrpc.SetReferralResponse}
 */
proto.boltzrpc.SetReferralResponse.deserializeBinaryFromReader = function(msg, reader) {
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
proto.boltzrpc.SetReferralResponse.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.boltzrpc.SetReferralResponse.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.boltzrpc.SetReferralResponse} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.boltzrpc.SetReferralResponse.serializeBinaryToWriter = function(message, writer) {
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
proto.boltzrpc.DevHeapDumpRequest.prototype.toObject = function(opt_includeInstance) {
  return proto.boltzrpc.DevHeapDumpRequest.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.boltzrpc.DevHeapDumpRequest} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.boltzrpc.DevHeapDumpRequest.toObject = function(includeInstance, msg) {
  var f, obj = {
    path: jspb.Message.getFieldWithDefault(msg, 1, "")
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
 * @return {!proto.boltzrpc.DevHeapDumpRequest}
 */
proto.boltzrpc.DevHeapDumpRequest.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.boltzrpc.DevHeapDumpRequest;
  return proto.boltzrpc.DevHeapDumpRequest.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.boltzrpc.DevHeapDumpRequest} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.boltzrpc.DevHeapDumpRequest}
 */
proto.boltzrpc.DevHeapDumpRequest.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setPath(value);
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
proto.boltzrpc.DevHeapDumpRequest.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.boltzrpc.DevHeapDumpRequest.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.boltzrpc.DevHeapDumpRequest} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.boltzrpc.DevHeapDumpRequest.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = /** @type {string} */ (jspb.Message.getField(message, 1));
  if (f != null) {
    writer.writeString(
      1,
      f
    );
  }
};


/**
 * optional string path = 1;
 * @return {string}
 */
proto.boltzrpc.DevHeapDumpRequest.prototype.getPath = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.boltzrpc.DevHeapDumpRequest} returns this
 */
proto.boltzrpc.DevHeapDumpRequest.prototype.setPath = function(value) {
  return jspb.Message.setField(this, 1, value);
};


/**
 * Clears the field making it undefined.
 * @return {!proto.boltzrpc.DevHeapDumpRequest} returns this
 */
proto.boltzrpc.DevHeapDumpRequest.prototype.clearPath = function() {
  return jspb.Message.setField(this, 1, undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.boltzrpc.DevHeapDumpRequest.prototype.hasPath = function() {
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
proto.boltzrpc.DevHeapDumpResponse.prototype.toObject = function(opt_includeInstance) {
  return proto.boltzrpc.DevHeapDumpResponse.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.boltzrpc.DevHeapDumpResponse} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.boltzrpc.DevHeapDumpResponse.toObject = function(includeInstance, msg) {
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
 * @return {!proto.boltzrpc.DevHeapDumpResponse}
 */
proto.boltzrpc.DevHeapDumpResponse.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.boltzrpc.DevHeapDumpResponse;
  return proto.boltzrpc.DevHeapDumpResponse.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.boltzrpc.DevHeapDumpResponse} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.boltzrpc.DevHeapDumpResponse}
 */
proto.boltzrpc.DevHeapDumpResponse.deserializeBinaryFromReader = function(msg, reader) {
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
proto.boltzrpc.DevHeapDumpResponse.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.boltzrpc.DevHeapDumpResponse.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.boltzrpc.DevHeapDumpResponse} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.boltzrpc.DevHeapDumpResponse.serializeBinaryToWriter = function(message, writer) {
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
proto.boltzrpc.LockedFund.prototype.toObject = function(opt_includeInstance) {
  return proto.boltzrpc.LockedFund.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.boltzrpc.LockedFund} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.boltzrpc.LockedFund.toObject = function(includeInstance, msg) {
  var f, obj = {
    swapId: jspb.Message.getFieldWithDefault(msg, 1, ""),
    onchainAmount: jspb.Message.getFieldWithDefault(msg, 2, 0)
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
 * @return {!proto.boltzrpc.LockedFund}
 */
proto.boltzrpc.LockedFund.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.boltzrpc.LockedFund;
  return proto.boltzrpc.LockedFund.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.boltzrpc.LockedFund} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.boltzrpc.LockedFund}
 */
proto.boltzrpc.LockedFund.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setSwapId(value);
      break;
    case 2:
      var value = /** @type {number} */ (reader.readUint64());
      msg.setOnchainAmount(value);
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
proto.boltzrpc.LockedFund.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.boltzrpc.LockedFund.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.boltzrpc.LockedFund} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.boltzrpc.LockedFund.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getSwapId();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
  f = message.getOnchainAmount();
  if (f !== 0) {
    writer.writeUint64(
      2,
      f
    );
  }
};


/**
 * optional string swap_id = 1;
 * @return {string}
 */
proto.boltzrpc.LockedFund.prototype.getSwapId = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.boltzrpc.LockedFund} returns this
 */
proto.boltzrpc.LockedFund.prototype.setSwapId = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};


/**
 * optional uint64 onchain_amount = 2;
 * @return {number}
 */
proto.boltzrpc.LockedFund.prototype.getOnchainAmount = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 2, 0));
};


/**
 * @param {number} value
 * @return {!proto.boltzrpc.LockedFund} returns this
 */
proto.boltzrpc.LockedFund.prototype.setOnchainAmount = function(value) {
  return jspb.Message.setProto3IntField(this, 2, value);
};



/**
 * List of repeated fields within this message type.
 * @private {!Array<number>}
 * @const
 */
proto.boltzrpc.LockedFunds.repeatedFields_ = [1,2];



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
proto.boltzrpc.LockedFunds.prototype.toObject = function(opt_includeInstance) {
  return proto.boltzrpc.LockedFunds.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.boltzrpc.LockedFunds} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.boltzrpc.LockedFunds.toObject = function(includeInstance, msg) {
  var f, obj = {
    reverseSwapsList: jspb.Message.toObjectList(msg.getReverseSwapsList(),
    proto.boltzrpc.LockedFund.toObject, includeInstance),
    chainSwapsList: jspb.Message.toObjectList(msg.getChainSwapsList(),
    proto.boltzrpc.LockedFund.toObject, includeInstance)
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
 * @return {!proto.boltzrpc.LockedFunds}
 */
proto.boltzrpc.LockedFunds.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.boltzrpc.LockedFunds;
  return proto.boltzrpc.LockedFunds.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.boltzrpc.LockedFunds} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.boltzrpc.LockedFunds}
 */
proto.boltzrpc.LockedFunds.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = new proto.boltzrpc.LockedFund;
      reader.readMessage(value,proto.boltzrpc.LockedFund.deserializeBinaryFromReader);
      msg.addReverseSwaps(value);
      break;
    case 2:
      var value = new proto.boltzrpc.LockedFund;
      reader.readMessage(value,proto.boltzrpc.LockedFund.deserializeBinaryFromReader);
      msg.addChainSwaps(value);
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
proto.boltzrpc.LockedFunds.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.boltzrpc.LockedFunds.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.boltzrpc.LockedFunds} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.boltzrpc.LockedFunds.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getReverseSwapsList();
  if (f.length > 0) {
    writer.writeRepeatedMessage(
      1,
      f,
      proto.boltzrpc.LockedFund.serializeBinaryToWriter
    );
  }
  f = message.getChainSwapsList();
  if (f.length > 0) {
    writer.writeRepeatedMessage(
      2,
      f,
      proto.boltzrpc.LockedFund.serializeBinaryToWriter
    );
  }
};


/**
 * repeated LockedFund reverse_swaps = 1;
 * @return {!Array<!proto.boltzrpc.LockedFund>}
 */
proto.boltzrpc.LockedFunds.prototype.getReverseSwapsList = function() {
  return /** @type{!Array<!proto.boltzrpc.LockedFund>} */ (
    jspb.Message.getRepeatedWrapperField(this, proto.boltzrpc.LockedFund, 1));
};


/**
 * @param {!Array<!proto.boltzrpc.LockedFund>} value
 * @return {!proto.boltzrpc.LockedFunds} returns this
*/
proto.boltzrpc.LockedFunds.prototype.setReverseSwapsList = function(value) {
  return jspb.Message.setRepeatedWrapperField(this, 1, value);
};


/**
 * @param {!proto.boltzrpc.LockedFund=} opt_value
 * @param {number=} opt_index
 * @return {!proto.boltzrpc.LockedFund}
 */
proto.boltzrpc.LockedFunds.prototype.addReverseSwaps = function(opt_value, opt_index) {
  return jspb.Message.addToRepeatedWrapperField(this, 1, opt_value, proto.boltzrpc.LockedFund, opt_index);
};


/**
 * Clears the list making it empty but non-null.
 * @return {!proto.boltzrpc.LockedFunds} returns this
 */
proto.boltzrpc.LockedFunds.prototype.clearReverseSwapsList = function() {
  return this.setReverseSwapsList([]);
};


/**
 * repeated LockedFund chain_swaps = 2;
 * @return {!Array<!proto.boltzrpc.LockedFund>}
 */
proto.boltzrpc.LockedFunds.prototype.getChainSwapsList = function() {
  return /** @type{!Array<!proto.boltzrpc.LockedFund>} */ (
    jspb.Message.getRepeatedWrapperField(this, proto.boltzrpc.LockedFund, 2));
};


/**
 * @param {!Array<!proto.boltzrpc.LockedFund>} value
 * @return {!proto.boltzrpc.LockedFunds} returns this
*/
proto.boltzrpc.LockedFunds.prototype.setChainSwapsList = function(value) {
  return jspb.Message.setRepeatedWrapperField(this, 2, value);
};


/**
 * @param {!proto.boltzrpc.LockedFund=} opt_value
 * @param {number=} opt_index
 * @return {!proto.boltzrpc.LockedFund}
 */
proto.boltzrpc.LockedFunds.prototype.addChainSwaps = function(opt_value, opt_index) {
  return jspb.Message.addToRepeatedWrapperField(this, 2, opt_value, proto.boltzrpc.LockedFund, opt_index);
};


/**
 * Clears the list making it empty but non-null.
 * @return {!proto.boltzrpc.LockedFunds} returns this
 */
proto.boltzrpc.LockedFunds.prototype.clearChainSwapsList = function() {
  return this.setChainSwapsList([]);
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
proto.boltzrpc.GetLockedFundsRequest.prototype.toObject = function(opt_includeInstance) {
  return proto.boltzrpc.GetLockedFundsRequest.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.boltzrpc.GetLockedFundsRequest} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.boltzrpc.GetLockedFundsRequest.toObject = function(includeInstance, msg) {
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
 * @return {!proto.boltzrpc.GetLockedFundsRequest}
 */
proto.boltzrpc.GetLockedFundsRequest.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.boltzrpc.GetLockedFundsRequest;
  return proto.boltzrpc.GetLockedFundsRequest.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.boltzrpc.GetLockedFundsRequest} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.boltzrpc.GetLockedFundsRequest}
 */
proto.boltzrpc.GetLockedFundsRequest.deserializeBinaryFromReader = function(msg, reader) {
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
proto.boltzrpc.GetLockedFundsRequest.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.boltzrpc.GetLockedFundsRequest.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.boltzrpc.GetLockedFundsRequest} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.boltzrpc.GetLockedFundsRequest.serializeBinaryToWriter = function(message, writer) {
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
proto.boltzrpc.GetLockedFundsResponse.prototype.toObject = function(opt_includeInstance) {
  return proto.boltzrpc.GetLockedFundsResponse.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.boltzrpc.GetLockedFundsResponse} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.boltzrpc.GetLockedFundsResponse.toObject = function(includeInstance, msg) {
  var f, obj = {
    lockedFundsMap: (f = msg.getLockedFundsMap()) ? f.toObject(includeInstance, proto.boltzrpc.LockedFunds.toObject) : []
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
 * @return {!proto.boltzrpc.GetLockedFundsResponse}
 */
proto.boltzrpc.GetLockedFundsResponse.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.boltzrpc.GetLockedFundsResponse;
  return proto.boltzrpc.GetLockedFundsResponse.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.boltzrpc.GetLockedFundsResponse} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.boltzrpc.GetLockedFundsResponse}
 */
proto.boltzrpc.GetLockedFundsResponse.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = msg.getLockedFundsMap();
      reader.readMessage(value, function(message, reader) {
        jspb.Map.deserializeBinary(message, reader, jspb.BinaryReader.prototype.readString, jspb.BinaryReader.prototype.readMessage, proto.boltzrpc.LockedFunds.deserializeBinaryFromReader, "", new proto.boltzrpc.LockedFunds());
         });
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
proto.boltzrpc.GetLockedFundsResponse.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.boltzrpc.GetLockedFundsResponse.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.boltzrpc.GetLockedFundsResponse} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.boltzrpc.GetLockedFundsResponse.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getLockedFundsMap(true);
  if (f && f.getLength() > 0) {
    f.serializeBinary(1, writer, jspb.BinaryWriter.prototype.writeString, jspb.BinaryWriter.prototype.writeMessage, proto.boltzrpc.LockedFunds.serializeBinaryToWriter);
  }
};


/**
 * map<string, LockedFunds> locked_funds = 1;
 * @param {boolean=} opt_noLazyCreate Do not create the map if
 * empty, instead returning `undefined`
 * @return {!jspb.Map<string,!proto.boltzrpc.LockedFunds>}
 */
proto.boltzrpc.GetLockedFundsResponse.prototype.getLockedFundsMap = function(opt_noLazyCreate) {
  return /** @type {!jspb.Map<string,!proto.boltzrpc.LockedFunds>} */ (
      jspb.Message.getMapField(this, 1, opt_noLazyCreate,
      proto.boltzrpc.LockedFunds));
};


/**
 * Clears values from the map. The map will be non-null.
 * @return {!proto.boltzrpc.GetLockedFundsResponse} returns this
 */
proto.boltzrpc.GetLockedFundsResponse.prototype.clearLockedFundsMap = function() {
  this.getLockedFundsMap().clear();
  return this;};





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
proto.boltzrpc.PendingSweep.prototype.toObject = function(opt_includeInstance) {
  return proto.boltzrpc.PendingSweep.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.boltzrpc.PendingSweep} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.boltzrpc.PendingSweep.toObject = function(includeInstance, msg) {
  var f, obj = {
    swapId: jspb.Message.getFieldWithDefault(msg, 1, ""),
    onchainAmount: jspb.Message.getFieldWithDefault(msg, 2, 0),
    type: jspb.Message.getFieldWithDefault(msg, 3, "")
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
 * @return {!proto.boltzrpc.PendingSweep}
 */
proto.boltzrpc.PendingSweep.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.boltzrpc.PendingSweep;
  return proto.boltzrpc.PendingSweep.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.boltzrpc.PendingSweep} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.boltzrpc.PendingSweep}
 */
proto.boltzrpc.PendingSweep.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setSwapId(value);
      break;
    case 2:
      var value = /** @type {number} */ (reader.readUint64());
      msg.setOnchainAmount(value);
      break;
    case 3:
      var value = /** @type {string} */ (reader.readString());
      msg.setType(value);
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
proto.boltzrpc.PendingSweep.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.boltzrpc.PendingSweep.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.boltzrpc.PendingSweep} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.boltzrpc.PendingSweep.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getSwapId();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
  f = message.getOnchainAmount();
  if (f !== 0) {
    writer.writeUint64(
      2,
      f
    );
  }
  f = message.getType();
  if (f.length > 0) {
    writer.writeString(
      3,
      f
    );
  }
};


/**
 * optional string swap_id = 1;
 * @return {string}
 */
proto.boltzrpc.PendingSweep.prototype.getSwapId = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.boltzrpc.PendingSweep} returns this
 */
proto.boltzrpc.PendingSweep.prototype.setSwapId = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};


/**
 * optional uint64 onchain_amount = 2;
 * @return {number}
 */
proto.boltzrpc.PendingSweep.prototype.getOnchainAmount = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 2, 0));
};


/**
 * @param {number} value
 * @return {!proto.boltzrpc.PendingSweep} returns this
 */
proto.boltzrpc.PendingSweep.prototype.setOnchainAmount = function(value) {
  return jspb.Message.setProto3IntField(this, 2, value);
};


/**
 * optional string type = 3;
 * @return {string}
 */
proto.boltzrpc.PendingSweep.prototype.getType = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 3, ""));
};


/**
 * @param {string} value
 * @return {!proto.boltzrpc.PendingSweep} returns this
 */
proto.boltzrpc.PendingSweep.prototype.setType = function(value) {
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
proto.boltzrpc.CalculateTransactionFeeRequest.prototype.toObject = function(opt_includeInstance) {
  return proto.boltzrpc.CalculateTransactionFeeRequest.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.boltzrpc.CalculateTransactionFeeRequest} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.boltzrpc.CalculateTransactionFeeRequest.toObject = function(includeInstance, msg) {
  var f, obj = {
    symbol: jspb.Message.getFieldWithDefault(msg, 1, ""),
    transactionId: jspb.Message.getFieldWithDefault(msg, 2, "")
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
 * @return {!proto.boltzrpc.CalculateTransactionFeeRequest}
 */
proto.boltzrpc.CalculateTransactionFeeRequest.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.boltzrpc.CalculateTransactionFeeRequest;
  return proto.boltzrpc.CalculateTransactionFeeRequest.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.boltzrpc.CalculateTransactionFeeRequest} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.boltzrpc.CalculateTransactionFeeRequest}
 */
proto.boltzrpc.CalculateTransactionFeeRequest.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setSymbol(value);
      break;
    case 2:
      var value = /** @type {string} */ (reader.readString());
      msg.setTransactionId(value);
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
proto.boltzrpc.CalculateTransactionFeeRequest.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.boltzrpc.CalculateTransactionFeeRequest.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.boltzrpc.CalculateTransactionFeeRequest} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.boltzrpc.CalculateTransactionFeeRequest.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getSymbol();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
  f = message.getTransactionId();
  if (f.length > 0) {
    writer.writeString(
      2,
      f
    );
  }
};


/**
 * optional string symbol = 1;
 * @return {string}
 */
proto.boltzrpc.CalculateTransactionFeeRequest.prototype.getSymbol = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.boltzrpc.CalculateTransactionFeeRequest} returns this
 */
proto.boltzrpc.CalculateTransactionFeeRequest.prototype.setSymbol = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};


/**
 * optional string transaction_id = 2;
 * @return {string}
 */
proto.boltzrpc.CalculateTransactionFeeRequest.prototype.getTransactionId = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 2, ""));
};


/**
 * @param {string} value
 * @return {!proto.boltzrpc.CalculateTransactionFeeRequest} returns this
 */
proto.boltzrpc.CalculateTransactionFeeRequest.prototype.setTransactionId = function(value) {
  return jspb.Message.setProto3StringField(this, 2, value);
};



/**
 * Oneof group definitions for this message. Each group defines the field
 * numbers belonging to that group. When of these fields' value is set, all
 * other fields in the group are cleared. During deserialization, if multiple
 * fields are encountered for a group, only the last value seen will be kept.
 * @private {!Array<!Array<number>>}
 * @const
 */
proto.boltzrpc.CalculateTransactionFeeResponse.oneofGroups_ = [[2,3]];

/**
 * @enum {number}
 */
proto.boltzrpc.CalculateTransactionFeeResponse.RelativeCase = {
  RELATIVE_NOT_SET: 0,
  SAT_PER_VBYTE: 2,
  GWEI: 3
};

/**
 * @return {proto.boltzrpc.CalculateTransactionFeeResponse.RelativeCase}
 */
proto.boltzrpc.CalculateTransactionFeeResponse.prototype.getRelativeCase = function() {
  return /** @type {proto.boltzrpc.CalculateTransactionFeeResponse.RelativeCase} */(jspb.Message.computeOneofCase(this, proto.boltzrpc.CalculateTransactionFeeResponse.oneofGroups_[0]));
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
proto.boltzrpc.CalculateTransactionFeeResponse.prototype.toObject = function(opt_includeInstance) {
  return proto.boltzrpc.CalculateTransactionFeeResponse.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.boltzrpc.CalculateTransactionFeeResponse} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.boltzrpc.CalculateTransactionFeeResponse.toObject = function(includeInstance, msg) {
  var f, obj = {
    absolute: jspb.Message.getFieldWithDefault(msg, 1, 0),
    satPerVbyte: jspb.Message.getFloatingPointFieldWithDefault(msg, 2, 0.0),
    gwei: jspb.Message.getFloatingPointFieldWithDefault(msg, 3, 0.0)
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
 * @return {!proto.boltzrpc.CalculateTransactionFeeResponse}
 */
proto.boltzrpc.CalculateTransactionFeeResponse.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.boltzrpc.CalculateTransactionFeeResponse;
  return proto.boltzrpc.CalculateTransactionFeeResponse.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.boltzrpc.CalculateTransactionFeeResponse} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.boltzrpc.CalculateTransactionFeeResponse}
 */
proto.boltzrpc.CalculateTransactionFeeResponse.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {number} */ (reader.readUint64());
      msg.setAbsolute(value);
      break;
    case 2:
      var value = /** @type {number} */ (reader.readDouble());
      msg.setSatPerVbyte(value);
      break;
    case 3:
      var value = /** @type {number} */ (reader.readDouble());
      msg.setGwei(value);
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
proto.boltzrpc.CalculateTransactionFeeResponse.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.boltzrpc.CalculateTransactionFeeResponse.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.boltzrpc.CalculateTransactionFeeResponse} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.boltzrpc.CalculateTransactionFeeResponse.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getAbsolute();
  if (f !== 0) {
    writer.writeUint64(
      1,
      f
    );
  }
  f = /** @type {number} */ (jspb.Message.getField(message, 2));
  if (f != null) {
    writer.writeDouble(
      2,
      f
    );
  }
  f = /** @type {number} */ (jspb.Message.getField(message, 3));
  if (f != null) {
    writer.writeDouble(
      3,
      f
    );
  }
};


/**
 * optional uint64 absolute = 1;
 * @return {number}
 */
proto.boltzrpc.CalculateTransactionFeeResponse.prototype.getAbsolute = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 1, 0));
};


/**
 * @param {number} value
 * @return {!proto.boltzrpc.CalculateTransactionFeeResponse} returns this
 */
proto.boltzrpc.CalculateTransactionFeeResponse.prototype.setAbsolute = function(value) {
  return jspb.Message.setProto3IntField(this, 1, value);
};


/**
 * optional double sat_per_vbyte = 2;
 * @return {number}
 */
proto.boltzrpc.CalculateTransactionFeeResponse.prototype.getSatPerVbyte = function() {
  return /** @type {number} */ (jspb.Message.getFloatingPointFieldWithDefault(this, 2, 0.0));
};


/**
 * @param {number} value
 * @return {!proto.boltzrpc.CalculateTransactionFeeResponse} returns this
 */
proto.boltzrpc.CalculateTransactionFeeResponse.prototype.setSatPerVbyte = function(value) {
  return jspb.Message.setOneofField(this, 2, proto.boltzrpc.CalculateTransactionFeeResponse.oneofGroups_[0], value);
};


/**
 * Clears the field making it undefined.
 * @return {!proto.boltzrpc.CalculateTransactionFeeResponse} returns this
 */
proto.boltzrpc.CalculateTransactionFeeResponse.prototype.clearSatPerVbyte = function() {
  return jspb.Message.setOneofField(this, 2, proto.boltzrpc.CalculateTransactionFeeResponse.oneofGroups_[0], undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.boltzrpc.CalculateTransactionFeeResponse.prototype.hasSatPerVbyte = function() {
  return jspb.Message.getField(this, 2) != null;
};


/**
 * optional double gwei = 3;
 * @return {number}
 */
proto.boltzrpc.CalculateTransactionFeeResponse.prototype.getGwei = function() {
  return /** @type {number} */ (jspb.Message.getFloatingPointFieldWithDefault(this, 3, 0.0));
};


/**
 * @param {number} value
 * @return {!proto.boltzrpc.CalculateTransactionFeeResponse} returns this
 */
proto.boltzrpc.CalculateTransactionFeeResponse.prototype.setGwei = function(value) {
  return jspb.Message.setOneofField(this, 3, proto.boltzrpc.CalculateTransactionFeeResponse.oneofGroups_[0], value);
};


/**
 * Clears the field making it undefined.
 * @return {!proto.boltzrpc.CalculateTransactionFeeResponse} returns this
 */
proto.boltzrpc.CalculateTransactionFeeResponse.prototype.clearGwei = function() {
  return jspb.Message.setOneofField(this, 3, proto.boltzrpc.CalculateTransactionFeeResponse.oneofGroups_[0], undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.boltzrpc.CalculateTransactionFeeResponse.prototype.hasGwei = function() {
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
proto.boltzrpc.SetLogLevelRequest.prototype.toObject = function(opt_includeInstance) {
  return proto.boltzrpc.SetLogLevelRequest.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.boltzrpc.SetLogLevelRequest} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.boltzrpc.SetLogLevelRequest.toObject = function(includeInstance, msg) {
  var f, obj = {
    level: jspb.Message.getFieldWithDefault(msg, 1, 0)
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
 * @return {!proto.boltzrpc.SetLogLevelRequest}
 */
proto.boltzrpc.SetLogLevelRequest.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.boltzrpc.SetLogLevelRequest;
  return proto.boltzrpc.SetLogLevelRequest.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.boltzrpc.SetLogLevelRequest} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.boltzrpc.SetLogLevelRequest}
 */
proto.boltzrpc.SetLogLevelRequest.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {!proto.boltzrpc.LogLevel} */ (reader.readEnum());
      msg.setLevel(value);
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
proto.boltzrpc.SetLogLevelRequest.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.boltzrpc.SetLogLevelRequest.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.boltzrpc.SetLogLevelRequest} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.boltzrpc.SetLogLevelRequest.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getLevel();
  if (f !== 0.0) {
    writer.writeEnum(
      1,
      f
    );
  }
};


/**
 * optional LogLevel level = 1;
 * @return {!proto.boltzrpc.LogLevel}
 */
proto.boltzrpc.SetLogLevelRequest.prototype.getLevel = function() {
  return /** @type {!proto.boltzrpc.LogLevel} */ (jspb.Message.getFieldWithDefault(this, 1, 0));
};


/**
 * @param {!proto.boltzrpc.LogLevel} value
 * @return {!proto.boltzrpc.SetLogLevelRequest} returns this
 */
proto.boltzrpc.SetLogLevelRequest.prototype.setLevel = function(value) {
  return jspb.Message.setProto3EnumField(this, 1, value);
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
proto.boltzrpc.SetLogLevelResponse.prototype.toObject = function(opt_includeInstance) {
  return proto.boltzrpc.SetLogLevelResponse.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.boltzrpc.SetLogLevelResponse} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.boltzrpc.SetLogLevelResponse.toObject = function(includeInstance, msg) {
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
 * @return {!proto.boltzrpc.SetLogLevelResponse}
 */
proto.boltzrpc.SetLogLevelResponse.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.boltzrpc.SetLogLevelResponse;
  return proto.boltzrpc.SetLogLevelResponse.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.boltzrpc.SetLogLevelResponse} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.boltzrpc.SetLogLevelResponse}
 */
proto.boltzrpc.SetLogLevelResponse.deserializeBinaryFromReader = function(msg, reader) {
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
proto.boltzrpc.SetLogLevelResponse.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.boltzrpc.SetLogLevelResponse.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.boltzrpc.SetLogLevelResponse} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.boltzrpc.SetLogLevelResponse.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
};



/**
 * List of repeated fields within this message type.
 * @private {!Array<number>}
 * @const
 */
proto.boltzrpc.PendingSweeps.repeatedFields_ = [1];



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
proto.boltzrpc.PendingSweeps.prototype.toObject = function(opt_includeInstance) {
  return proto.boltzrpc.PendingSweeps.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.boltzrpc.PendingSweeps} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.boltzrpc.PendingSweeps.toObject = function(includeInstance, msg) {
  var f, obj = {
    pendingSweepsList: jspb.Message.toObjectList(msg.getPendingSweepsList(),
    proto.boltzrpc.PendingSweep.toObject, includeInstance)
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
 * @return {!proto.boltzrpc.PendingSweeps}
 */
proto.boltzrpc.PendingSweeps.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.boltzrpc.PendingSweeps;
  return proto.boltzrpc.PendingSweeps.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.boltzrpc.PendingSweeps} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.boltzrpc.PendingSweeps}
 */
proto.boltzrpc.PendingSweeps.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = new proto.boltzrpc.PendingSweep;
      reader.readMessage(value,proto.boltzrpc.PendingSweep.deserializeBinaryFromReader);
      msg.addPendingSweeps(value);
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
proto.boltzrpc.PendingSweeps.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.boltzrpc.PendingSweeps.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.boltzrpc.PendingSweeps} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.boltzrpc.PendingSweeps.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getPendingSweepsList();
  if (f.length > 0) {
    writer.writeRepeatedMessage(
      1,
      f,
      proto.boltzrpc.PendingSweep.serializeBinaryToWriter
    );
  }
};


/**
 * repeated PendingSweep pending_sweeps = 1;
 * @return {!Array<!proto.boltzrpc.PendingSweep>}
 */
proto.boltzrpc.PendingSweeps.prototype.getPendingSweepsList = function() {
  return /** @type{!Array<!proto.boltzrpc.PendingSweep>} */ (
    jspb.Message.getRepeatedWrapperField(this, proto.boltzrpc.PendingSweep, 1));
};


/**
 * @param {!Array<!proto.boltzrpc.PendingSweep>} value
 * @return {!proto.boltzrpc.PendingSweeps} returns this
*/
proto.boltzrpc.PendingSweeps.prototype.setPendingSweepsList = function(value) {
  return jspb.Message.setRepeatedWrapperField(this, 1, value);
};


/**
 * @param {!proto.boltzrpc.PendingSweep=} opt_value
 * @param {number=} opt_index
 * @return {!proto.boltzrpc.PendingSweep}
 */
proto.boltzrpc.PendingSweeps.prototype.addPendingSweeps = function(opt_value, opt_index) {
  return jspb.Message.addToRepeatedWrapperField(this, 1, opt_value, proto.boltzrpc.PendingSweep, opt_index);
};


/**
 * Clears the list making it empty but non-null.
 * @return {!proto.boltzrpc.PendingSweeps} returns this
 */
proto.boltzrpc.PendingSweeps.prototype.clearPendingSweepsList = function() {
  return this.setPendingSweepsList([]);
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
proto.boltzrpc.GetPendingSweepsRequest.prototype.toObject = function(opt_includeInstance) {
  return proto.boltzrpc.GetPendingSweepsRequest.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.boltzrpc.GetPendingSweepsRequest} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.boltzrpc.GetPendingSweepsRequest.toObject = function(includeInstance, msg) {
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
 * @return {!proto.boltzrpc.GetPendingSweepsRequest}
 */
proto.boltzrpc.GetPendingSweepsRequest.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.boltzrpc.GetPendingSweepsRequest;
  return proto.boltzrpc.GetPendingSweepsRequest.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.boltzrpc.GetPendingSweepsRequest} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.boltzrpc.GetPendingSweepsRequest}
 */
proto.boltzrpc.GetPendingSweepsRequest.deserializeBinaryFromReader = function(msg, reader) {
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
proto.boltzrpc.GetPendingSweepsRequest.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.boltzrpc.GetPendingSweepsRequest.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.boltzrpc.GetPendingSweepsRequest} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.boltzrpc.GetPendingSweepsRequest.serializeBinaryToWriter = function(message, writer) {
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
proto.boltzrpc.GetPendingSweepsResponse.prototype.toObject = function(opt_includeInstance) {
  return proto.boltzrpc.GetPendingSweepsResponse.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.boltzrpc.GetPendingSweepsResponse} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.boltzrpc.GetPendingSweepsResponse.toObject = function(includeInstance, msg) {
  var f, obj = {
    pendingSweepsMap: (f = msg.getPendingSweepsMap()) ? f.toObject(includeInstance, proto.boltzrpc.PendingSweeps.toObject) : []
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
 * @return {!proto.boltzrpc.GetPendingSweepsResponse}
 */
proto.boltzrpc.GetPendingSweepsResponse.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.boltzrpc.GetPendingSweepsResponse;
  return proto.boltzrpc.GetPendingSweepsResponse.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.boltzrpc.GetPendingSweepsResponse} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.boltzrpc.GetPendingSweepsResponse}
 */
proto.boltzrpc.GetPendingSweepsResponse.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = msg.getPendingSweepsMap();
      reader.readMessage(value, function(message, reader) {
        jspb.Map.deserializeBinary(message, reader, jspb.BinaryReader.prototype.readString, jspb.BinaryReader.prototype.readMessage, proto.boltzrpc.PendingSweeps.deserializeBinaryFromReader, "", new proto.boltzrpc.PendingSweeps());
         });
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
proto.boltzrpc.GetPendingSweepsResponse.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.boltzrpc.GetPendingSweepsResponse.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.boltzrpc.GetPendingSweepsResponse} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.boltzrpc.GetPendingSweepsResponse.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getPendingSweepsMap(true);
  if (f && f.getLength() > 0) {
    f.serializeBinary(1, writer, jspb.BinaryWriter.prototype.writeString, jspb.BinaryWriter.prototype.writeMessage, proto.boltzrpc.PendingSweeps.serializeBinaryToWriter);
  }
};


/**
 * map<string, PendingSweeps> pending_sweeps = 1;
 * @param {boolean=} opt_noLazyCreate Do not create the map if
 * empty, instead returning `undefined`
 * @return {!jspb.Map<string,!proto.boltzrpc.PendingSweeps>}
 */
proto.boltzrpc.GetPendingSweepsResponse.prototype.getPendingSweepsMap = function(opt_noLazyCreate) {
  return /** @type {!jspb.Map<string,!proto.boltzrpc.PendingSweeps>} */ (
      jspb.Message.getMapField(this, 1, opt_noLazyCreate,
      proto.boltzrpc.PendingSweeps));
};


/**
 * Clears values from the map. The map will be non-null.
 * @return {!proto.boltzrpc.GetPendingSweepsResponse} returns this
 */
proto.boltzrpc.GetPendingSweepsResponse.prototype.clearPendingSweepsMap = function() {
  this.getPendingSweepsMap().clear();
  return this;};


/**
 * @enum {number}
 */
proto.boltzrpc.OutputType = {
  BECH32: 0,
  COMPATIBILITY: 1,
  LEGACY: 2
};

/**
 * @enum {number}
 */
proto.boltzrpc.LogLevel = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  VERBOSE: 3,
  DEBUG: 4,
  SILLY: 5
};

goog.object.extend(exports, proto.boltzrpc);
