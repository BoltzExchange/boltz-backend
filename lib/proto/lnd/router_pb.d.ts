// package: routerrpc
// file: lnd/router.proto

import * as jspb from "google-protobuf";
import * as lnd_rpc_pb from "../lnd/rpc_pb";

export class SendPaymentRequest extends jspb.Message {
  getDest(): Uint8Array | string;
  getDest_asU8(): Uint8Array;
  getDest_asB64(): string;
  setDest(value: Uint8Array | string): void;

  getAmt(): number;
  setAmt(value: number): void;

  getAmtMsat(): number;
  setAmtMsat(value: number): void;

  getPaymentHash(): Uint8Array | string;
  getPaymentHash_asU8(): Uint8Array;
  getPaymentHash_asB64(): string;
  setPaymentHash(value: Uint8Array | string): void;

  getFinalCltvDelta(): number;
  setFinalCltvDelta(value: number): void;

  getPaymentAddr(): Uint8Array | string;
  getPaymentAddr_asU8(): Uint8Array;
  getPaymentAddr_asB64(): string;
  setPaymentAddr(value: Uint8Array | string): void;

  getPaymentRequest(): string;
  setPaymentRequest(value: string): void;

  getTimeoutSeconds(): number;
  setTimeoutSeconds(value: number): void;

  getFeeLimitSat(): number;
  setFeeLimitSat(value: number): void;

  getFeeLimitMsat(): number;
  setFeeLimitMsat(value: number): void;

  getOutgoingChanId(): string;
  setOutgoingChanId(value: string): void;

  clearOutgoingChanIdsList(): void;
  getOutgoingChanIdsList(): Array<number>;
  setOutgoingChanIdsList(value: Array<number>): void;
  addOutgoingChanIds(value: number, index?: number): number;

  getLastHopPubkey(): Uint8Array | string;
  getLastHopPubkey_asU8(): Uint8Array;
  getLastHopPubkey_asB64(): string;
  setLastHopPubkey(value: Uint8Array | string): void;

  getCltvLimit(): number;
  setCltvLimit(value: number): void;

  clearRouteHintsList(): void;
  getRouteHintsList(): Array<lnd_rpc_pb.RouteHint>;
  setRouteHintsList(value: Array<lnd_rpc_pb.RouteHint>): void;
  addRouteHints(value?: lnd_rpc_pb.RouteHint, index?: number): lnd_rpc_pb.RouteHint;

  getDestCustomRecordsMap(): jspb.Map<number, Uint8Array | string>;
  clearDestCustomRecordsMap(): void;
  getAllowSelfPayment(): boolean;
  setAllowSelfPayment(value: boolean): void;

  clearDestFeaturesList(): void;
  getDestFeaturesList(): Array<lnd_rpc_pb.FeatureBitMap[keyof lnd_rpc_pb.FeatureBitMap]>;
  setDestFeaturesList(value: Array<lnd_rpc_pb.FeatureBitMap[keyof lnd_rpc_pb.FeatureBitMap]>): void;
  addDestFeatures(value: lnd_rpc_pb.FeatureBitMap[keyof lnd_rpc_pb.FeatureBitMap], index?: number): lnd_rpc_pb.FeatureBitMap[keyof lnd_rpc_pb.FeatureBitMap];

  getMaxParts(): number;
  setMaxParts(value: number): void;

  getNoInflightUpdates(): boolean;
  setNoInflightUpdates(value: boolean): void;

  getMaxShardSizeMsat(): number;
  setMaxShardSizeMsat(value: number): void;

  getAmp(): boolean;
  setAmp(value: boolean): void;

  getTimePref(): number;
  setTimePref(value: number): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): SendPaymentRequest.AsObject;
  static toObject(includeInstance: boolean, msg: SendPaymentRequest): SendPaymentRequest.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: SendPaymentRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): SendPaymentRequest;
  static deserializeBinaryFromReader(message: SendPaymentRequest, reader: jspb.BinaryReader): SendPaymentRequest;
}

export namespace SendPaymentRequest {
  export type AsObject = {
    dest: Uint8Array | string,
    amt: number,
    amtMsat: number,
    paymentHash: Uint8Array | string,
    finalCltvDelta: number,
    paymentAddr: Uint8Array | string,
    paymentRequest: string,
    timeoutSeconds: number,
    feeLimitSat: number,
    feeLimitMsat: number,
    outgoingChanId: string,
    outgoingChanIdsList: Array<number>,
    lastHopPubkey: Uint8Array | string,
    cltvLimit: number,
    routeHintsList: Array<lnd_rpc_pb.RouteHint.AsObject>,
    destCustomRecordsMap: Array<[number, Uint8Array | string]>,
    allowSelfPayment: boolean,
    destFeaturesList: Array<lnd_rpc_pb.FeatureBitMap[keyof lnd_rpc_pb.FeatureBitMap]>,
    maxParts: number,
    noInflightUpdates: boolean,
    maxShardSizeMsat: number,
    amp: boolean,
    timePref: number,
  }
}

export class TrackPaymentRequest extends jspb.Message {
  getPaymentHash(): Uint8Array | string;
  getPaymentHash_asU8(): Uint8Array;
  getPaymentHash_asB64(): string;
  setPaymentHash(value: Uint8Array | string): void;

  getNoInflightUpdates(): boolean;
  setNoInflightUpdates(value: boolean): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): TrackPaymentRequest.AsObject;
  static toObject(includeInstance: boolean, msg: TrackPaymentRequest): TrackPaymentRequest.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: TrackPaymentRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): TrackPaymentRequest;
  static deserializeBinaryFromReader(message: TrackPaymentRequest, reader: jspb.BinaryReader): TrackPaymentRequest;
}

export namespace TrackPaymentRequest {
  export type AsObject = {
    paymentHash: Uint8Array | string,
    noInflightUpdates: boolean,
  }
}

export class RouteFeeRequest extends jspb.Message {
  getDest(): Uint8Array | string;
  getDest_asU8(): Uint8Array;
  getDest_asB64(): string;
  setDest(value: Uint8Array | string): void;

  getAmtSat(): number;
  setAmtSat(value: number): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): RouteFeeRequest.AsObject;
  static toObject(includeInstance: boolean, msg: RouteFeeRequest): RouteFeeRequest.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: RouteFeeRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): RouteFeeRequest;
  static deserializeBinaryFromReader(message: RouteFeeRequest, reader: jspb.BinaryReader): RouteFeeRequest;
}

export namespace RouteFeeRequest {
  export type AsObject = {
    dest: Uint8Array | string,
    amtSat: number,
  }
}

export class RouteFeeResponse extends jspb.Message {
  getRoutingFeeMsat(): number;
  setRoutingFeeMsat(value: number): void;

  getTimeLockDelay(): number;
  setTimeLockDelay(value: number): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): RouteFeeResponse.AsObject;
  static toObject(includeInstance: boolean, msg: RouteFeeResponse): RouteFeeResponse.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: RouteFeeResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): RouteFeeResponse;
  static deserializeBinaryFromReader(message: RouteFeeResponse, reader: jspb.BinaryReader): RouteFeeResponse;
}

export namespace RouteFeeResponse {
  export type AsObject = {
    routingFeeMsat: number,
    timeLockDelay: number,
  }
}

export class SendToRouteRequest extends jspb.Message {
  getPaymentHash(): Uint8Array | string;
  getPaymentHash_asU8(): Uint8Array;
  getPaymentHash_asB64(): string;
  setPaymentHash(value: Uint8Array | string): void;

  hasRoute(): boolean;
  clearRoute(): void;
  getRoute(): lnd_rpc_pb.Route | undefined;
  setRoute(value?: lnd_rpc_pb.Route): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): SendToRouteRequest.AsObject;
  static toObject(includeInstance: boolean, msg: SendToRouteRequest): SendToRouteRequest.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: SendToRouteRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): SendToRouteRequest;
  static deserializeBinaryFromReader(message: SendToRouteRequest, reader: jspb.BinaryReader): SendToRouteRequest;
}

export namespace SendToRouteRequest {
  export type AsObject = {
    paymentHash: Uint8Array | string,
    route?: lnd_rpc_pb.Route.AsObject,
  }
}

export class SendToRouteResponse extends jspb.Message {
  getPreimage(): Uint8Array | string;
  getPreimage_asU8(): Uint8Array;
  getPreimage_asB64(): string;
  setPreimage(value: Uint8Array | string): void;

  hasFailure(): boolean;
  clearFailure(): void;
  getFailure(): lnd_rpc_pb.Failure | undefined;
  setFailure(value?: lnd_rpc_pb.Failure): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): SendToRouteResponse.AsObject;
  static toObject(includeInstance: boolean, msg: SendToRouteResponse): SendToRouteResponse.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: SendToRouteResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): SendToRouteResponse;
  static deserializeBinaryFromReader(message: SendToRouteResponse, reader: jspb.BinaryReader): SendToRouteResponse;
}

export namespace SendToRouteResponse {
  export type AsObject = {
    preimage: Uint8Array | string,
    failure?: lnd_rpc_pb.Failure.AsObject,
  }
}

export class ResetMissionControlRequest extends jspb.Message {
  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ResetMissionControlRequest.AsObject;
  static toObject(includeInstance: boolean, msg: ResetMissionControlRequest): ResetMissionControlRequest.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: ResetMissionControlRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ResetMissionControlRequest;
  static deserializeBinaryFromReader(message: ResetMissionControlRequest, reader: jspb.BinaryReader): ResetMissionControlRequest;
}

export namespace ResetMissionControlRequest {
  export type AsObject = {
  }
}

export class ResetMissionControlResponse extends jspb.Message {
  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ResetMissionControlResponse.AsObject;
  static toObject(includeInstance: boolean, msg: ResetMissionControlResponse): ResetMissionControlResponse.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: ResetMissionControlResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ResetMissionControlResponse;
  static deserializeBinaryFromReader(message: ResetMissionControlResponse, reader: jspb.BinaryReader): ResetMissionControlResponse;
}

export namespace ResetMissionControlResponse {
  export type AsObject = {
  }
}

export class QueryMissionControlRequest extends jspb.Message {
  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): QueryMissionControlRequest.AsObject;
  static toObject(includeInstance: boolean, msg: QueryMissionControlRequest): QueryMissionControlRequest.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: QueryMissionControlRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): QueryMissionControlRequest;
  static deserializeBinaryFromReader(message: QueryMissionControlRequest, reader: jspb.BinaryReader): QueryMissionControlRequest;
}

export namespace QueryMissionControlRequest {
  export type AsObject = {
  }
}

export class QueryMissionControlResponse extends jspb.Message {
  clearPairsList(): void;
  getPairsList(): Array<PairHistory>;
  setPairsList(value: Array<PairHistory>): void;
  addPairs(value?: PairHistory, index?: number): PairHistory;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): QueryMissionControlResponse.AsObject;
  static toObject(includeInstance: boolean, msg: QueryMissionControlResponse): QueryMissionControlResponse.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: QueryMissionControlResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): QueryMissionControlResponse;
  static deserializeBinaryFromReader(message: QueryMissionControlResponse, reader: jspb.BinaryReader): QueryMissionControlResponse;
}

export namespace QueryMissionControlResponse {
  export type AsObject = {
    pairsList: Array<PairHistory.AsObject>,
  }
}

export class XImportMissionControlRequest extends jspb.Message {
  clearPairsList(): void;
  getPairsList(): Array<PairHistory>;
  setPairsList(value: Array<PairHistory>): void;
  addPairs(value?: PairHistory, index?: number): PairHistory;

  getForce(): boolean;
  setForce(value: boolean): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): XImportMissionControlRequest.AsObject;
  static toObject(includeInstance: boolean, msg: XImportMissionControlRequest): XImportMissionControlRequest.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: XImportMissionControlRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): XImportMissionControlRequest;
  static deserializeBinaryFromReader(message: XImportMissionControlRequest, reader: jspb.BinaryReader): XImportMissionControlRequest;
}

export namespace XImportMissionControlRequest {
  export type AsObject = {
    pairsList: Array<PairHistory.AsObject>,
    force: boolean,
  }
}

export class XImportMissionControlResponse extends jspb.Message {
  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): XImportMissionControlResponse.AsObject;
  static toObject(includeInstance: boolean, msg: XImportMissionControlResponse): XImportMissionControlResponse.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: XImportMissionControlResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): XImportMissionControlResponse;
  static deserializeBinaryFromReader(message: XImportMissionControlResponse, reader: jspb.BinaryReader): XImportMissionControlResponse;
}

export namespace XImportMissionControlResponse {
  export type AsObject = {
  }
}

export class PairHistory extends jspb.Message {
  getNodeFrom(): Uint8Array | string;
  getNodeFrom_asU8(): Uint8Array;
  getNodeFrom_asB64(): string;
  setNodeFrom(value: Uint8Array | string): void;

  getNodeTo(): Uint8Array | string;
  getNodeTo_asU8(): Uint8Array;
  getNodeTo_asB64(): string;
  setNodeTo(value: Uint8Array | string): void;

  hasHistory(): boolean;
  clearHistory(): void;
  getHistory(): PairData | undefined;
  setHistory(value?: PairData): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): PairHistory.AsObject;
  static toObject(includeInstance: boolean, msg: PairHistory): PairHistory.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: PairHistory, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): PairHistory;
  static deserializeBinaryFromReader(message: PairHistory, reader: jspb.BinaryReader): PairHistory;
}

export namespace PairHistory {
  export type AsObject = {
    nodeFrom: Uint8Array | string,
    nodeTo: Uint8Array | string,
    history?: PairData.AsObject,
  }
}

export class PairData extends jspb.Message {
  getFailTime(): number;
  setFailTime(value: number): void;

  getFailAmtSat(): number;
  setFailAmtSat(value: number): void;

  getFailAmtMsat(): number;
  setFailAmtMsat(value: number): void;

  getSuccessTime(): number;
  setSuccessTime(value: number): void;

  getSuccessAmtSat(): number;
  setSuccessAmtSat(value: number): void;

  getSuccessAmtMsat(): number;
  setSuccessAmtMsat(value: number): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): PairData.AsObject;
  static toObject(includeInstance: boolean, msg: PairData): PairData.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: PairData, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): PairData;
  static deserializeBinaryFromReader(message: PairData, reader: jspb.BinaryReader): PairData;
}

export namespace PairData {
  export type AsObject = {
    failTime: number,
    failAmtSat: number,
    failAmtMsat: number,
    successTime: number,
    successAmtSat: number,
    successAmtMsat: number,
  }
}

export class GetMissionControlConfigRequest extends jspb.Message {
  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): GetMissionControlConfigRequest.AsObject;
  static toObject(includeInstance: boolean, msg: GetMissionControlConfigRequest): GetMissionControlConfigRequest.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: GetMissionControlConfigRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): GetMissionControlConfigRequest;
  static deserializeBinaryFromReader(message: GetMissionControlConfigRequest, reader: jspb.BinaryReader): GetMissionControlConfigRequest;
}

export namespace GetMissionControlConfigRequest {
  export type AsObject = {
  }
}

export class GetMissionControlConfigResponse extends jspb.Message {
  hasConfig(): boolean;
  clearConfig(): void;
  getConfig(): MissionControlConfig | undefined;
  setConfig(value?: MissionControlConfig): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): GetMissionControlConfigResponse.AsObject;
  static toObject(includeInstance: boolean, msg: GetMissionControlConfigResponse): GetMissionControlConfigResponse.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: GetMissionControlConfigResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): GetMissionControlConfigResponse;
  static deserializeBinaryFromReader(message: GetMissionControlConfigResponse, reader: jspb.BinaryReader): GetMissionControlConfigResponse;
}

export namespace GetMissionControlConfigResponse {
  export type AsObject = {
    config?: MissionControlConfig.AsObject,
  }
}

export class SetMissionControlConfigRequest extends jspb.Message {
  hasConfig(): boolean;
  clearConfig(): void;
  getConfig(): MissionControlConfig | undefined;
  setConfig(value?: MissionControlConfig): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): SetMissionControlConfigRequest.AsObject;
  static toObject(includeInstance: boolean, msg: SetMissionControlConfigRequest): SetMissionControlConfigRequest.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: SetMissionControlConfigRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): SetMissionControlConfigRequest;
  static deserializeBinaryFromReader(message: SetMissionControlConfigRequest, reader: jspb.BinaryReader): SetMissionControlConfigRequest;
}

export namespace SetMissionControlConfigRequest {
  export type AsObject = {
    config?: MissionControlConfig.AsObject,
  }
}

export class SetMissionControlConfigResponse extends jspb.Message {
  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): SetMissionControlConfigResponse.AsObject;
  static toObject(includeInstance: boolean, msg: SetMissionControlConfigResponse): SetMissionControlConfigResponse.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: SetMissionControlConfigResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): SetMissionControlConfigResponse;
  static deserializeBinaryFromReader(message: SetMissionControlConfigResponse, reader: jspb.BinaryReader): SetMissionControlConfigResponse;
}

export namespace SetMissionControlConfigResponse {
  export type AsObject = {
  }
}

export class MissionControlConfig extends jspb.Message {
  getHalfLifeSeconds(): number;
  setHalfLifeSeconds(value: number): void;

  getHopProbability(): number;
  setHopProbability(value: number): void;

  getWeight(): number;
  setWeight(value: number): void;

  getMaximumPaymentResults(): number;
  setMaximumPaymentResults(value: number): void;

  getMinimumFailureRelaxInterval(): number;
  setMinimumFailureRelaxInterval(value: number): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): MissionControlConfig.AsObject;
  static toObject(includeInstance: boolean, msg: MissionControlConfig): MissionControlConfig.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: MissionControlConfig, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): MissionControlConfig;
  static deserializeBinaryFromReader(message: MissionControlConfig, reader: jspb.BinaryReader): MissionControlConfig;
}

export namespace MissionControlConfig {
  export type AsObject = {
    halfLifeSeconds: number,
    hopProbability: number,
    weight: number,
    maximumPaymentResults: number,
    minimumFailureRelaxInterval: number,
  }
}

export class QueryProbabilityRequest extends jspb.Message {
  getFromNode(): Uint8Array | string;
  getFromNode_asU8(): Uint8Array;
  getFromNode_asB64(): string;
  setFromNode(value: Uint8Array | string): void;

  getToNode(): Uint8Array | string;
  getToNode_asU8(): Uint8Array;
  getToNode_asB64(): string;
  setToNode(value: Uint8Array | string): void;

  getAmtMsat(): number;
  setAmtMsat(value: number): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): QueryProbabilityRequest.AsObject;
  static toObject(includeInstance: boolean, msg: QueryProbabilityRequest): QueryProbabilityRequest.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: QueryProbabilityRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): QueryProbabilityRequest;
  static deserializeBinaryFromReader(message: QueryProbabilityRequest, reader: jspb.BinaryReader): QueryProbabilityRequest;
}

export namespace QueryProbabilityRequest {
  export type AsObject = {
    fromNode: Uint8Array | string,
    toNode: Uint8Array | string,
    amtMsat: number,
  }
}

export class QueryProbabilityResponse extends jspb.Message {
  getProbability(): number;
  setProbability(value: number): void;

  hasHistory(): boolean;
  clearHistory(): void;
  getHistory(): PairData | undefined;
  setHistory(value?: PairData): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): QueryProbabilityResponse.AsObject;
  static toObject(includeInstance: boolean, msg: QueryProbabilityResponse): QueryProbabilityResponse.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: QueryProbabilityResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): QueryProbabilityResponse;
  static deserializeBinaryFromReader(message: QueryProbabilityResponse, reader: jspb.BinaryReader): QueryProbabilityResponse;
}

export namespace QueryProbabilityResponse {
  export type AsObject = {
    probability: number,
    history?: PairData.AsObject,
  }
}

export class BuildRouteRequest extends jspb.Message {
  getAmtMsat(): number;
  setAmtMsat(value: number): void;

  getFinalCltvDelta(): number;
  setFinalCltvDelta(value: number): void;

  getOutgoingChanId(): string;
  setOutgoingChanId(value: string): void;

  clearHopPubkeysList(): void;
  getHopPubkeysList(): Array<Uint8Array | string>;
  getHopPubkeysList_asU8(): Array<Uint8Array>;
  getHopPubkeysList_asB64(): Array<string>;
  setHopPubkeysList(value: Array<Uint8Array | string>): void;
  addHopPubkeys(value: Uint8Array | string, index?: number): Uint8Array | string;

  getPaymentAddr(): Uint8Array | string;
  getPaymentAddr_asU8(): Uint8Array;
  getPaymentAddr_asB64(): string;
  setPaymentAddr(value: Uint8Array | string): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): BuildRouteRequest.AsObject;
  static toObject(includeInstance: boolean, msg: BuildRouteRequest): BuildRouteRequest.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: BuildRouteRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): BuildRouteRequest;
  static deserializeBinaryFromReader(message: BuildRouteRequest, reader: jspb.BinaryReader): BuildRouteRequest;
}

export namespace BuildRouteRequest {
  export type AsObject = {
    amtMsat: number,
    finalCltvDelta: number,
    outgoingChanId: string,
    hopPubkeysList: Array<Uint8Array | string>,
    paymentAddr: Uint8Array | string,
  }
}

export class BuildRouteResponse extends jspb.Message {
  hasRoute(): boolean;
  clearRoute(): void;
  getRoute(): lnd_rpc_pb.Route | undefined;
  setRoute(value?: lnd_rpc_pb.Route): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): BuildRouteResponse.AsObject;
  static toObject(includeInstance: boolean, msg: BuildRouteResponse): BuildRouteResponse.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: BuildRouteResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): BuildRouteResponse;
  static deserializeBinaryFromReader(message: BuildRouteResponse, reader: jspb.BinaryReader): BuildRouteResponse;
}

export namespace BuildRouteResponse {
  export type AsObject = {
    route?: lnd_rpc_pb.Route.AsObject,
  }
}

export class SubscribeHtlcEventsRequest extends jspb.Message {
  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): SubscribeHtlcEventsRequest.AsObject;
  static toObject(includeInstance: boolean, msg: SubscribeHtlcEventsRequest): SubscribeHtlcEventsRequest.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: SubscribeHtlcEventsRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): SubscribeHtlcEventsRequest;
  static deserializeBinaryFromReader(message: SubscribeHtlcEventsRequest, reader: jspb.BinaryReader): SubscribeHtlcEventsRequest;
}

export namespace SubscribeHtlcEventsRequest {
  export type AsObject = {
  }
}

export class HtlcEvent extends jspb.Message {
  getIncomingChannelId(): number;
  setIncomingChannelId(value: number): void;

  getOutgoingChannelId(): number;
  setOutgoingChannelId(value: number): void;

  getIncomingHtlcId(): number;
  setIncomingHtlcId(value: number): void;

  getOutgoingHtlcId(): number;
  setOutgoingHtlcId(value: number): void;

  getTimestampNs(): number;
  setTimestampNs(value: number): void;

  getEventType(): HtlcEvent.EventTypeMap[keyof HtlcEvent.EventTypeMap];
  setEventType(value: HtlcEvent.EventTypeMap[keyof HtlcEvent.EventTypeMap]): void;

  hasForwardEvent(): boolean;
  clearForwardEvent(): void;
  getForwardEvent(): ForwardEvent | undefined;
  setForwardEvent(value?: ForwardEvent): void;

  hasForwardFailEvent(): boolean;
  clearForwardFailEvent(): void;
  getForwardFailEvent(): ForwardFailEvent | undefined;
  setForwardFailEvent(value?: ForwardFailEvent): void;

  hasSettleEvent(): boolean;
  clearSettleEvent(): void;
  getSettleEvent(): SettleEvent | undefined;
  setSettleEvent(value?: SettleEvent): void;

  hasLinkFailEvent(): boolean;
  clearLinkFailEvent(): void;
  getLinkFailEvent(): LinkFailEvent | undefined;
  setLinkFailEvent(value?: LinkFailEvent): void;

  getEventCase(): HtlcEvent.EventCase;
  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): HtlcEvent.AsObject;
  static toObject(includeInstance: boolean, msg: HtlcEvent): HtlcEvent.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: HtlcEvent, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): HtlcEvent;
  static deserializeBinaryFromReader(message: HtlcEvent, reader: jspb.BinaryReader): HtlcEvent;
}

export namespace HtlcEvent {
  export type AsObject = {
    incomingChannelId: number,
    outgoingChannelId: number,
    incomingHtlcId: number,
    outgoingHtlcId: number,
    timestampNs: number,
    eventType: HtlcEvent.EventTypeMap[keyof HtlcEvent.EventTypeMap],
    forwardEvent?: ForwardEvent.AsObject,
    forwardFailEvent?: ForwardFailEvent.AsObject,
    settleEvent?: SettleEvent.AsObject,
    linkFailEvent?: LinkFailEvent.AsObject,
  }

  export interface EventTypeMap {
    UNKNOWN: 0;
    SEND: 1;
    RECEIVE: 2;
    FORWARD: 3;
  }

  export const EventType: EventTypeMap;

  export enum EventCase {
    EVENT_NOT_SET = 0,
    FORWARD_EVENT = 7,
    FORWARD_FAIL_EVENT = 8,
    SETTLE_EVENT = 9,
    LINK_FAIL_EVENT = 10,
  }
}

export class HtlcInfo extends jspb.Message {
  getIncomingTimelock(): number;
  setIncomingTimelock(value: number): void;

  getOutgoingTimelock(): number;
  setOutgoingTimelock(value: number): void;

  getIncomingAmtMsat(): number;
  setIncomingAmtMsat(value: number): void;

  getOutgoingAmtMsat(): number;
  setOutgoingAmtMsat(value: number): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): HtlcInfo.AsObject;
  static toObject(includeInstance: boolean, msg: HtlcInfo): HtlcInfo.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: HtlcInfo, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): HtlcInfo;
  static deserializeBinaryFromReader(message: HtlcInfo, reader: jspb.BinaryReader): HtlcInfo;
}

export namespace HtlcInfo {
  export type AsObject = {
    incomingTimelock: number,
    outgoingTimelock: number,
    incomingAmtMsat: number,
    outgoingAmtMsat: number,
  }
}

export class ForwardEvent extends jspb.Message {
  hasInfo(): boolean;
  clearInfo(): void;
  getInfo(): HtlcInfo | undefined;
  setInfo(value?: HtlcInfo): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ForwardEvent.AsObject;
  static toObject(includeInstance: boolean, msg: ForwardEvent): ForwardEvent.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: ForwardEvent, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ForwardEvent;
  static deserializeBinaryFromReader(message: ForwardEvent, reader: jspb.BinaryReader): ForwardEvent;
}

export namespace ForwardEvent {
  export type AsObject = {
    info?: HtlcInfo.AsObject,
  }
}

export class ForwardFailEvent extends jspb.Message {
  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ForwardFailEvent.AsObject;
  static toObject(includeInstance: boolean, msg: ForwardFailEvent): ForwardFailEvent.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: ForwardFailEvent, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ForwardFailEvent;
  static deserializeBinaryFromReader(message: ForwardFailEvent, reader: jspb.BinaryReader): ForwardFailEvent;
}

export namespace ForwardFailEvent {
  export type AsObject = {
  }
}

export class SettleEvent extends jspb.Message {
  getPreimage(): Uint8Array | string;
  getPreimage_asU8(): Uint8Array;
  getPreimage_asB64(): string;
  setPreimage(value: Uint8Array | string): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): SettleEvent.AsObject;
  static toObject(includeInstance: boolean, msg: SettleEvent): SettleEvent.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: SettleEvent, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): SettleEvent;
  static deserializeBinaryFromReader(message: SettleEvent, reader: jspb.BinaryReader): SettleEvent;
}

export namespace SettleEvent {
  export type AsObject = {
    preimage: Uint8Array | string,
  }
}

export class LinkFailEvent extends jspb.Message {
  hasInfo(): boolean;
  clearInfo(): void;
  getInfo(): HtlcInfo | undefined;
  setInfo(value?: HtlcInfo): void;

  getWireFailure(): lnd_rpc_pb.Failure.FailureCodeMap[keyof lnd_rpc_pb.Failure.FailureCodeMap];
  setWireFailure(value: lnd_rpc_pb.Failure.FailureCodeMap[keyof lnd_rpc_pb.Failure.FailureCodeMap]): void;

  getFailureDetail(): FailureDetailMap[keyof FailureDetailMap];
  setFailureDetail(value: FailureDetailMap[keyof FailureDetailMap]): void;

  getFailureString(): string;
  setFailureString(value: string): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): LinkFailEvent.AsObject;
  static toObject(includeInstance: boolean, msg: LinkFailEvent): LinkFailEvent.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: LinkFailEvent, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): LinkFailEvent;
  static deserializeBinaryFromReader(message: LinkFailEvent, reader: jspb.BinaryReader): LinkFailEvent;
}

export namespace LinkFailEvent {
  export type AsObject = {
    info?: HtlcInfo.AsObject,
    wireFailure: lnd_rpc_pb.Failure.FailureCodeMap[keyof lnd_rpc_pb.Failure.FailureCodeMap],
    failureDetail: FailureDetailMap[keyof FailureDetailMap],
    failureString: string,
  }
}

export class PaymentStatus extends jspb.Message {
  getState(): PaymentStateMap[keyof PaymentStateMap];
  setState(value: PaymentStateMap[keyof PaymentStateMap]): void;

  getPreimage(): Uint8Array | string;
  getPreimage_asU8(): Uint8Array;
  getPreimage_asB64(): string;
  setPreimage(value: Uint8Array | string): void;

  clearHtlcsList(): void;
  getHtlcsList(): Array<lnd_rpc_pb.HTLCAttempt>;
  setHtlcsList(value: Array<lnd_rpc_pb.HTLCAttempt>): void;
  addHtlcs(value?: lnd_rpc_pb.HTLCAttempt, index?: number): lnd_rpc_pb.HTLCAttempt;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): PaymentStatus.AsObject;
  static toObject(includeInstance: boolean, msg: PaymentStatus): PaymentStatus.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: PaymentStatus, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): PaymentStatus;
  static deserializeBinaryFromReader(message: PaymentStatus, reader: jspb.BinaryReader): PaymentStatus;
}

export namespace PaymentStatus {
  export type AsObject = {
    state: PaymentStateMap[keyof PaymentStateMap],
    preimage: Uint8Array | string,
    htlcsList: Array<lnd_rpc_pb.HTLCAttempt.AsObject>,
  }
}

export class CircuitKey extends jspb.Message {
  getChanId(): number;
  setChanId(value: number): void;

  getHtlcId(): number;
  setHtlcId(value: number): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): CircuitKey.AsObject;
  static toObject(includeInstance: boolean, msg: CircuitKey): CircuitKey.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: CircuitKey, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): CircuitKey;
  static deserializeBinaryFromReader(message: CircuitKey, reader: jspb.BinaryReader): CircuitKey;
}

export namespace CircuitKey {
  export type AsObject = {
    chanId: number,
    htlcId: number,
  }
}

export class ForwardHtlcInterceptRequest extends jspb.Message {
  hasIncomingCircuitKey(): boolean;
  clearIncomingCircuitKey(): void;
  getIncomingCircuitKey(): CircuitKey | undefined;
  setIncomingCircuitKey(value?: CircuitKey): void;

  getIncomingAmountMsat(): number;
  setIncomingAmountMsat(value: number): void;

  getIncomingExpiry(): number;
  setIncomingExpiry(value: number): void;

  getPaymentHash(): Uint8Array | string;
  getPaymentHash_asU8(): Uint8Array;
  getPaymentHash_asB64(): string;
  setPaymentHash(value: Uint8Array | string): void;

  getOutgoingRequestedChanId(): number;
  setOutgoingRequestedChanId(value: number): void;

  getOutgoingAmountMsat(): number;
  setOutgoingAmountMsat(value: number): void;

  getOutgoingExpiry(): number;
  setOutgoingExpiry(value: number): void;

  getCustomRecordsMap(): jspb.Map<number, Uint8Array | string>;
  clearCustomRecordsMap(): void;
  getOnionBlob(): Uint8Array | string;
  getOnionBlob_asU8(): Uint8Array;
  getOnionBlob_asB64(): string;
  setOnionBlob(value: Uint8Array | string): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ForwardHtlcInterceptRequest.AsObject;
  static toObject(includeInstance: boolean, msg: ForwardHtlcInterceptRequest): ForwardHtlcInterceptRequest.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: ForwardHtlcInterceptRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ForwardHtlcInterceptRequest;
  static deserializeBinaryFromReader(message: ForwardHtlcInterceptRequest, reader: jspb.BinaryReader): ForwardHtlcInterceptRequest;
}

export namespace ForwardHtlcInterceptRequest {
  export type AsObject = {
    incomingCircuitKey?: CircuitKey.AsObject,
    incomingAmountMsat: number,
    incomingExpiry: number,
    paymentHash: Uint8Array | string,
    outgoingRequestedChanId: number,
    outgoingAmountMsat: number,
    outgoingExpiry: number,
    customRecordsMap: Array<[number, Uint8Array | string]>,
    onionBlob: Uint8Array | string,
  }
}

export class ForwardHtlcInterceptResponse extends jspb.Message {
  hasIncomingCircuitKey(): boolean;
  clearIncomingCircuitKey(): void;
  getIncomingCircuitKey(): CircuitKey | undefined;
  setIncomingCircuitKey(value?: CircuitKey): void;

  getAction(): ResolveHoldForwardActionMap[keyof ResolveHoldForwardActionMap];
  setAction(value: ResolveHoldForwardActionMap[keyof ResolveHoldForwardActionMap]): void;

  getPreimage(): Uint8Array | string;
  getPreimage_asU8(): Uint8Array;
  getPreimage_asB64(): string;
  setPreimage(value: Uint8Array | string): void;

  getFailureMessage(): Uint8Array | string;
  getFailureMessage_asU8(): Uint8Array;
  getFailureMessage_asB64(): string;
  setFailureMessage(value: Uint8Array | string): void;

  getFailureCode(): lnd_rpc_pb.Failure.FailureCodeMap[keyof lnd_rpc_pb.Failure.FailureCodeMap];
  setFailureCode(value: lnd_rpc_pb.Failure.FailureCodeMap[keyof lnd_rpc_pb.Failure.FailureCodeMap]): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ForwardHtlcInterceptResponse.AsObject;
  static toObject(includeInstance: boolean, msg: ForwardHtlcInterceptResponse): ForwardHtlcInterceptResponse.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: ForwardHtlcInterceptResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ForwardHtlcInterceptResponse;
  static deserializeBinaryFromReader(message: ForwardHtlcInterceptResponse, reader: jspb.BinaryReader): ForwardHtlcInterceptResponse;
}

export namespace ForwardHtlcInterceptResponse {
  export type AsObject = {
    incomingCircuitKey?: CircuitKey.AsObject,
    action: ResolveHoldForwardActionMap[keyof ResolveHoldForwardActionMap],
    preimage: Uint8Array | string,
    failureMessage: Uint8Array | string,
    failureCode: lnd_rpc_pb.Failure.FailureCodeMap[keyof lnd_rpc_pb.Failure.FailureCodeMap],
  }
}

export class UpdateChanStatusRequest extends jspb.Message {
  hasChanPoint(): boolean;
  clearChanPoint(): void;
  getChanPoint(): lnd_rpc_pb.ChannelPoint | undefined;
  setChanPoint(value?: lnd_rpc_pb.ChannelPoint): void;

  getAction(): ChanStatusActionMap[keyof ChanStatusActionMap];
  setAction(value: ChanStatusActionMap[keyof ChanStatusActionMap]): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): UpdateChanStatusRequest.AsObject;
  static toObject(includeInstance: boolean, msg: UpdateChanStatusRequest): UpdateChanStatusRequest.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: UpdateChanStatusRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): UpdateChanStatusRequest;
  static deserializeBinaryFromReader(message: UpdateChanStatusRequest, reader: jspb.BinaryReader): UpdateChanStatusRequest;
}

export namespace UpdateChanStatusRequest {
  export type AsObject = {
    chanPoint?: lnd_rpc_pb.ChannelPoint.AsObject,
    action: ChanStatusActionMap[keyof ChanStatusActionMap],
  }
}

export class UpdateChanStatusResponse extends jspb.Message {
  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): UpdateChanStatusResponse.AsObject;
  static toObject(includeInstance: boolean, msg: UpdateChanStatusResponse): UpdateChanStatusResponse.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: UpdateChanStatusResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): UpdateChanStatusResponse;
  static deserializeBinaryFromReader(message: UpdateChanStatusResponse, reader: jspb.BinaryReader): UpdateChanStatusResponse;
}

export namespace UpdateChanStatusResponse {
  export type AsObject = {
  }
}

export interface FailureDetailMap {
  UNKNOWN: 0;
  NO_DETAIL: 1;
  ONION_DECODE: 2;
  LINK_NOT_ELIGIBLE: 3;
  ON_CHAIN_TIMEOUT: 4;
  HTLC_EXCEEDS_MAX: 5;
  INSUFFICIENT_BALANCE: 6;
  INCOMPLETE_FORWARD: 7;
  HTLC_ADD_FAILED: 8;
  FORWARDS_DISABLED: 9;
  INVOICE_CANCELED: 10;
  INVOICE_UNDERPAID: 11;
  INVOICE_EXPIRY_TOO_SOON: 12;
  INVOICE_NOT_OPEN: 13;
  MPP_INVOICE_TIMEOUT: 14;
  ADDRESS_MISMATCH: 15;
  SET_TOTAL_MISMATCH: 16;
  SET_TOTAL_TOO_LOW: 17;
  SET_OVERPAID: 18;
  UNKNOWN_INVOICE: 19;
  INVALID_KEYSEND: 20;
  MPP_IN_PROGRESS: 21;
  CIRCULAR_ROUTE: 22;
}

export const FailureDetail: FailureDetailMap;

export interface PaymentStateMap {
  IN_FLIGHT: 0;
  SUCCEEDED: 1;
  FAILED_TIMEOUT: 2;
  FAILED_NO_ROUTE: 3;
  FAILED_ERROR: 4;
  FAILED_INCORRECT_PAYMENT_DETAILS: 5;
  FAILED_INSUFFICIENT_BALANCE: 6;
}

export const PaymentState: PaymentStateMap;

export interface ResolveHoldForwardActionMap {
  SETTLE: 0;
  FAIL: 1;
  RESUME: 2;
}

export const ResolveHoldForwardAction: ResolveHoldForwardActionMap;

export interface ChanStatusActionMap {
  ENABLE: 0;
  DISABLE: 1;
  AUTO: 2;
}

export const ChanStatusAction: ChanStatusActionMap;

