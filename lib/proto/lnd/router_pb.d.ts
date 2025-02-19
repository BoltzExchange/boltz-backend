// package: routerrpc
// file: lnd/router.proto

/* tslint:disable */
/* eslint-disable */

import * as jspb from "google-protobuf";
import * as lnd_rpc_pb from "../lnd/rpc_pb";

export class SendPaymentRequest extends jspb.Message { 
    getDest(): Uint8Array | string;
    getDest_asU8(): Uint8Array;
    getDest_asB64(): string;
    setDest(value: Uint8Array | string): SendPaymentRequest;
    getAmt(): number;
    setAmt(value: number): SendPaymentRequest;
    getPaymentHash(): Uint8Array | string;
    getPaymentHash_asU8(): Uint8Array;
    getPaymentHash_asB64(): string;
    setPaymentHash(value: Uint8Array | string): SendPaymentRequest;
    getFinalCltvDelta(): number;
    setFinalCltvDelta(value: number): SendPaymentRequest;
    getPaymentRequest(): string;
    setPaymentRequest(value: string): SendPaymentRequest;
    getTimeoutSeconds(): number;
    setTimeoutSeconds(value: number): SendPaymentRequest;
    getFeeLimitSat(): number;
    setFeeLimitSat(value: number): SendPaymentRequest;
    getOutgoingChanId(): string;
    setOutgoingChanId(value: string): SendPaymentRequest;
    getCltvLimit(): number;
    setCltvLimit(value: number): SendPaymentRequest;
    clearRouteHintsList(): void;
    getRouteHintsList(): Array<lnd_rpc_pb.RouteHint>;
    setRouteHintsList(value: Array<lnd_rpc_pb.RouteHint>): SendPaymentRequest;
    addRouteHints(value?: lnd_rpc_pb.RouteHint, index?: number): lnd_rpc_pb.RouteHint;

    getDestCustomRecordsMap(): jspb.Map<number, Uint8Array | string>;
    clearDestCustomRecordsMap(): void;
    getAmtMsat(): number;
    setAmtMsat(value: number): SendPaymentRequest;
    getFeeLimitMsat(): number;
    setFeeLimitMsat(value: number): SendPaymentRequest;
    getLastHopPubkey(): Uint8Array | string;
    getLastHopPubkey_asU8(): Uint8Array;
    getLastHopPubkey_asB64(): string;
    setLastHopPubkey(value: Uint8Array | string): SendPaymentRequest;
    getAllowSelfPayment(): boolean;
    setAllowSelfPayment(value: boolean): SendPaymentRequest;
    clearDestFeaturesList(): void;
    getDestFeaturesList(): Array<lnd_rpc_pb.FeatureBit>;
    setDestFeaturesList(value: Array<lnd_rpc_pb.FeatureBit>): SendPaymentRequest;
    addDestFeatures(value: lnd_rpc_pb.FeatureBit, index?: number): lnd_rpc_pb.FeatureBit;
    getMaxParts(): number;
    setMaxParts(value: number): SendPaymentRequest;
    getNoInflightUpdates(): boolean;
    setNoInflightUpdates(value: boolean): SendPaymentRequest;
    clearOutgoingChanIdsList(): void;
    getOutgoingChanIdsList(): Array<number>;
    setOutgoingChanIdsList(value: Array<number>): SendPaymentRequest;
    addOutgoingChanIds(value: number, index?: number): number;
    getPaymentAddr(): Uint8Array | string;
    getPaymentAddr_asU8(): Uint8Array;
    getPaymentAddr_asB64(): string;
    setPaymentAddr(value: Uint8Array | string): SendPaymentRequest;
    getMaxShardSizeMsat(): number;
    setMaxShardSizeMsat(value: number): SendPaymentRequest;
    getAmp(): boolean;
    setAmp(value: boolean): SendPaymentRequest;
    getTimePref(): number;
    setTimePref(value: number): SendPaymentRequest;
    getCancelable(): boolean;
    setCancelable(value: boolean): SendPaymentRequest;

    getFirstHopCustomRecordsMap(): jspb.Map<number, Uint8Array | string>;
    clearFirstHopCustomRecordsMap(): void;

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
        paymentHash: Uint8Array | string,
        finalCltvDelta: number,
        paymentRequest: string,
        timeoutSeconds: number,
        feeLimitSat: number,
        outgoingChanId: string,
        cltvLimit: number,
        routeHintsList: Array<lnd_rpc_pb.RouteHint.AsObject>,

        destCustomRecordsMap: Array<[number, Uint8Array | string]>,
        amtMsat: number,
        feeLimitMsat: number,
        lastHopPubkey: Uint8Array | string,
        allowSelfPayment: boolean,
        destFeaturesList: Array<lnd_rpc_pb.FeatureBit>,
        maxParts: number,
        noInflightUpdates: boolean,
        outgoingChanIdsList: Array<number>,
        paymentAddr: Uint8Array | string,
        maxShardSizeMsat: number,
        amp: boolean,
        timePref: number,
        cancelable: boolean,

        firstHopCustomRecordsMap: Array<[number, Uint8Array | string]>,
    }
}

export class TrackPaymentRequest extends jspb.Message { 
    getPaymentHash(): Uint8Array | string;
    getPaymentHash_asU8(): Uint8Array;
    getPaymentHash_asB64(): string;
    setPaymentHash(value: Uint8Array | string): TrackPaymentRequest;
    getNoInflightUpdates(): boolean;
    setNoInflightUpdates(value: boolean): TrackPaymentRequest;

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

export class TrackPaymentsRequest extends jspb.Message { 
    getNoInflightUpdates(): boolean;
    setNoInflightUpdates(value: boolean): TrackPaymentsRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): TrackPaymentsRequest.AsObject;
    static toObject(includeInstance: boolean, msg: TrackPaymentsRequest): TrackPaymentsRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: TrackPaymentsRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): TrackPaymentsRequest;
    static deserializeBinaryFromReader(message: TrackPaymentsRequest, reader: jspb.BinaryReader): TrackPaymentsRequest;
}

export namespace TrackPaymentsRequest {
    export type AsObject = {
        noInflightUpdates: boolean,
    }
}

export class RouteFeeRequest extends jspb.Message { 
    getDest(): Uint8Array | string;
    getDest_asU8(): Uint8Array;
    getDest_asB64(): string;
    setDest(value: Uint8Array | string): RouteFeeRequest;
    getAmtSat(): number;
    setAmtSat(value: number): RouteFeeRequest;
    getPaymentRequest(): string;
    setPaymentRequest(value: string): RouteFeeRequest;
    getTimeout(): number;
    setTimeout(value: number): RouteFeeRequest;

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
        paymentRequest: string,
        timeout: number,
    }
}

export class RouteFeeResponse extends jspb.Message { 
    getRoutingFeeMsat(): number;
    setRoutingFeeMsat(value: number): RouteFeeResponse;
    getTimeLockDelay(): number;
    setTimeLockDelay(value: number): RouteFeeResponse;
    getFailureReason(): lnd_rpc_pb.PaymentFailureReason;
    setFailureReason(value: lnd_rpc_pb.PaymentFailureReason): RouteFeeResponse;

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
        failureReason: lnd_rpc_pb.PaymentFailureReason,
    }
}

export class SendToRouteRequest extends jspb.Message { 
    getPaymentHash(): Uint8Array | string;
    getPaymentHash_asU8(): Uint8Array;
    getPaymentHash_asB64(): string;
    setPaymentHash(value: Uint8Array | string): SendToRouteRequest;

    hasRoute(): boolean;
    clearRoute(): void;
    getRoute(): lnd_rpc_pb.Route | undefined;
    setRoute(value?: lnd_rpc_pb.Route): SendToRouteRequest;
    getSkipTempErr(): boolean;
    setSkipTempErr(value: boolean): SendToRouteRequest;

    getFirstHopCustomRecordsMap(): jspb.Map<number, Uint8Array | string>;
    clearFirstHopCustomRecordsMap(): void;

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
        skipTempErr: boolean,

        firstHopCustomRecordsMap: Array<[number, Uint8Array | string]>,
    }
}

export class SendToRouteResponse extends jspb.Message { 
    getPreimage(): Uint8Array | string;
    getPreimage_asU8(): Uint8Array;
    getPreimage_asB64(): string;
    setPreimage(value: Uint8Array | string): SendToRouteResponse;

    hasFailure(): boolean;
    clearFailure(): void;
    getFailure(): lnd_rpc_pb.Failure | undefined;
    setFailure(value?: lnd_rpc_pb.Failure): SendToRouteResponse;

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
    setPairsList(value: Array<PairHistory>): QueryMissionControlResponse;
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
    setPairsList(value: Array<PairHistory>): XImportMissionControlRequest;
    addPairs(value?: PairHistory, index?: number): PairHistory;
    getForce(): boolean;
    setForce(value: boolean): XImportMissionControlRequest;

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
    setNodeFrom(value: Uint8Array | string): PairHistory;
    getNodeTo(): Uint8Array | string;
    getNodeTo_asU8(): Uint8Array;
    getNodeTo_asB64(): string;
    setNodeTo(value: Uint8Array | string): PairHistory;

    hasHistory(): boolean;
    clearHistory(): void;
    getHistory(): PairData | undefined;
    setHistory(value?: PairData): PairHistory;

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
    setFailTime(value: number): PairData;
    getFailAmtSat(): number;
    setFailAmtSat(value: number): PairData;
    getFailAmtMsat(): number;
    setFailAmtMsat(value: number): PairData;
    getSuccessTime(): number;
    setSuccessTime(value: number): PairData;
    getSuccessAmtSat(): number;
    setSuccessAmtSat(value: number): PairData;
    getSuccessAmtMsat(): number;
    setSuccessAmtMsat(value: number): PairData;

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
    setConfig(value?: MissionControlConfig): GetMissionControlConfigResponse;

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
    setConfig(value?: MissionControlConfig): SetMissionControlConfigRequest;

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
    setHalfLifeSeconds(value: number): MissionControlConfig;
    getHopProbability(): number;
    setHopProbability(value: number): MissionControlConfig;
    getWeight(): number;
    setWeight(value: number): MissionControlConfig;
    getMaximumPaymentResults(): number;
    setMaximumPaymentResults(value: number): MissionControlConfig;
    getMinimumFailureRelaxInterval(): number;
    setMinimumFailureRelaxInterval(value: number): MissionControlConfig;
    getModel(): MissionControlConfig.ProbabilityModel;
    setModel(value: MissionControlConfig.ProbabilityModel): MissionControlConfig;

    hasApriori(): boolean;
    clearApriori(): void;
    getApriori(): AprioriParameters | undefined;
    setApriori(value?: AprioriParameters): MissionControlConfig;

    hasBimodal(): boolean;
    clearBimodal(): void;
    getBimodal(): BimodalParameters | undefined;
    setBimodal(value?: BimodalParameters): MissionControlConfig;

    getEstimatorconfigCase(): MissionControlConfig.EstimatorconfigCase;

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
        model: MissionControlConfig.ProbabilityModel,
        apriori?: AprioriParameters.AsObject,
        bimodal?: BimodalParameters.AsObject,
    }

    export enum ProbabilityModel {
    APRIORI = 0,
    BIMODAL = 1,
    }


    export enum EstimatorconfigCase {
        ESTIMATORCONFIG_NOT_SET = 0,
        APRIORI = 7,
        BIMODAL = 8,
    }

}

export class BimodalParameters extends jspb.Message { 
    getNodeWeight(): number;
    setNodeWeight(value: number): BimodalParameters;
    getScaleMsat(): number;
    setScaleMsat(value: number): BimodalParameters;
    getDecayTime(): number;
    setDecayTime(value: number): BimodalParameters;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): BimodalParameters.AsObject;
    static toObject(includeInstance: boolean, msg: BimodalParameters): BimodalParameters.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: BimodalParameters, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): BimodalParameters;
    static deserializeBinaryFromReader(message: BimodalParameters, reader: jspb.BinaryReader): BimodalParameters;
}

export namespace BimodalParameters {
    export type AsObject = {
        nodeWeight: number,
        scaleMsat: number,
        decayTime: number,
    }
}

export class AprioriParameters extends jspb.Message { 
    getHalfLifeSeconds(): number;
    setHalfLifeSeconds(value: number): AprioriParameters;
    getHopProbability(): number;
    setHopProbability(value: number): AprioriParameters;
    getWeight(): number;
    setWeight(value: number): AprioriParameters;
    getCapacityFraction(): number;
    setCapacityFraction(value: number): AprioriParameters;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): AprioriParameters.AsObject;
    static toObject(includeInstance: boolean, msg: AprioriParameters): AprioriParameters.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: AprioriParameters, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): AprioriParameters;
    static deserializeBinaryFromReader(message: AprioriParameters, reader: jspb.BinaryReader): AprioriParameters;
}

export namespace AprioriParameters {
    export type AsObject = {
        halfLifeSeconds: number,
        hopProbability: number,
        weight: number,
        capacityFraction: number,
    }
}

export class QueryProbabilityRequest extends jspb.Message { 
    getFromNode(): Uint8Array | string;
    getFromNode_asU8(): Uint8Array;
    getFromNode_asB64(): string;
    setFromNode(value: Uint8Array | string): QueryProbabilityRequest;
    getToNode(): Uint8Array | string;
    getToNode_asU8(): Uint8Array;
    getToNode_asB64(): string;
    setToNode(value: Uint8Array | string): QueryProbabilityRequest;
    getAmtMsat(): number;
    setAmtMsat(value: number): QueryProbabilityRequest;

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
    setProbability(value: number): QueryProbabilityResponse;

    hasHistory(): boolean;
    clearHistory(): void;
    getHistory(): PairData | undefined;
    setHistory(value?: PairData): QueryProbabilityResponse;

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
    setAmtMsat(value: number): BuildRouteRequest;
    getFinalCltvDelta(): number;
    setFinalCltvDelta(value: number): BuildRouteRequest;
    getOutgoingChanId(): string;
    setOutgoingChanId(value: string): BuildRouteRequest;
    clearHopPubkeysList(): void;
    getHopPubkeysList(): Array<Uint8Array | string>;
    getHopPubkeysList_asU8(): Array<Uint8Array>;
    getHopPubkeysList_asB64(): Array<string>;
    setHopPubkeysList(value: Array<Uint8Array | string>): BuildRouteRequest;
    addHopPubkeys(value: Uint8Array | string, index?: number): Uint8Array | string;
    getPaymentAddr(): Uint8Array | string;
    getPaymentAddr_asU8(): Uint8Array;
    getPaymentAddr_asB64(): string;
    setPaymentAddr(value: Uint8Array | string): BuildRouteRequest;

    getFirstHopCustomRecordsMap(): jspb.Map<number, Uint8Array | string>;
    clearFirstHopCustomRecordsMap(): void;

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

        firstHopCustomRecordsMap: Array<[number, Uint8Array | string]>,
    }
}

export class BuildRouteResponse extends jspb.Message { 

    hasRoute(): boolean;
    clearRoute(): void;
    getRoute(): lnd_rpc_pb.Route | undefined;
    setRoute(value?: lnd_rpc_pb.Route): BuildRouteResponse;

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
    setIncomingChannelId(value: number): HtlcEvent;
    getOutgoingChannelId(): number;
    setOutgoingChannelId(value: number): HtlcEvent;
    getIncomingHtlcId(): number;
    setIncomingHtlcId(value: number): HtlcEvent;
    getOutgoingHtlcId(): number;
    setOutgoingHtlcId(value: number): HtlcEvent;
    getTimestampNs(): number;
    setTimestampNs(value: number): HtlcEvent;
    getEventType(): HtlcEvent.EventType;
    setEventType(value: HtlcEvent.EventType): HtlcEvent;

    hasForwardEvent(): boolean;
    clearForwardEvent(): void;
    getForwardEvent(): ForwardEvent | undefined;
    setForwardEvent(value?: ForwardEvent): HtlcEvent;

    hasForwardFailEvent(): boolean;
    clearForwardFailEvent(): void;
    getForwardFailEvent(): ForwardFailEvent | undefined;
    setForwardFailEvent(value?: ForwardFailEvent): HtlcEvent;

    hasSettleEvent(): boolean;
    clearSettleEvent(): void;
    getSettleEvent(): SettleEvent | undefined;
    setSettleEvent(value?: SettleEvent): HtlcEvent;

    hasLinkFailEvent(): boolean;
    clearLinkFailEvent(): void;
    getLinkFailEvent(): LinkFailEvent | undefined;
    setLinkFailEvent(value?: LinkFailEvent): HtlcEvent;

    hasSubscribedEvent(): boolean;
    clearSubscribedEvent(): void;
    getSubscribedEvent(): SubscribedEvent | undefined;
    setSubscribedEvent(value?: SubscribedEvent): HtlcEvent;

    hasFinalHtlcEvent(): boolean;
    clearFinalHtlcEvent(): void;
    getFinalHtlcEvent(): FinalHtlcEvent | undefined;
    setFinalHtlcEvent(value?: FinalHtlcEvent): HtlcEvent;

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
        eventType: HtlcEvent.EventType,
        forwardEvent?: ForwardEvent.AsObject,
        forwardFailEvent?: ForwardFailEvent.AsObject,
        settleEvent?: SettleEvent.AsObject,
        linkFailEvent?: LinkFailEvent.AsObject,
        subscribedEvent?: SubscribedEvent.AsObject,
        finalHtlcEvent?: FinalHtlcEvent.AsObject,
    }

    export enum EventType {
    UNKNOWN = 0,
    SEND = 1,
    RECEIVE = 2,
    FORWARD = 3,
    }


    export enum EventCase {
        EVENT_NOT_SET = 0,
        FORWARD_EVENT = 7,
        FORWARD_FAIL_EVENT = 8,
        SETTLE_EVENT = 9,
        LINK_FAIL_EVENT = 10,
        SUBSCRIBED_EVENT = 11,
        FINAL_HTLC_EVENT = 12,
    }

}

export class HtlcInfo extends jspb.Message { 
    getIncomingTimelock(): number;
    setIncomingTimelock(value: number): HtlcInfo;
    getOutgoingTimelock(): number;
    setOutgoingTimelock(value: number): HtlcInfo;
    getIncomingAmtMsat(): number;
    setIncomingAmtMsat(value: number): HtlcInfo;
    getOutgoingAmtMsat(): number;
    setOutgoingAmtMsat(value: number): HtlcInfo;

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
    setInfo(value?: HtlcInfo): ForwardEvent;

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
    setPreimage(value: Uint8Array | string): SettleEvent;

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

export class FinalHtlcEvent extends jspb.Message { 
    getSettled(): boolean;
    setSettled(value: boolean): FinalHtlcEvent;
    getOffchain(): boolean;
    setOffchain(value: boolean): FinalHtlcEvent;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): FinalHtlcEvent.AsObject;
    static toObject(includeInstance: boolean, msg: FinalHtlcEvent): FinalHtlcEvent.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: FinalHtlcEvent, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): FinalHtlcEvent;
    static deserializeBinaryFromReader(message: FinalHtlcEvent, reader: jspb.BinaryReader): FinalHtlcEvent;
}

export namespace FinalHtlcEvent {
    export type AsObject = {
        settled: boolean,
        offchain: boolean,
    }
}

export class SubscribedEvent extends jspb.Message { 

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): SubscribedEvent.AsObject;
    static toObject(includeInstance: boolean, msg: SubscribedEvent): SubscribedEvent.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: SubscribedEvent, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): SubscribedEvent;
    static deserializeBinaryFromReader(message: SubscribedEvent, reader: jspb.BinaryReader): SubscribedEvent;
}

export namespace SubscribedEvent {
    export type AsObject = {
    }
}

export class LinkFailEvent extends jspb.Message { 

    hasInfo(): boolean;
    clearInfo(): void;
    getInfo(): HtlcInfo | undefined;
    setInfo(value?: HtlcInfo): LinkFailEvent;
    getWireFailure(): lnd_rpc_pb.Failure.FailureCode;
    setWireFailure(value: lnd_rpc_pb.Failure.FailureCode): LinkFailEvent;
    getFailureDetail(): FailureDetail;
    setFailureDetail(value: FailureDetail): LinkFailEvent;
    getFailureString(): string;
    setFailureString(value: string): LinkFailEvent;

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
        wireFailure: lnd_rpc_pb.Failure.FailureCode,
        failureDetail: FailureDetail,
        failureString: string,
    }
}

export class PaymentStatus extends jspb.Message { 
    getState(): PaymentState;
    setState(value: PaymentState): PaymentStatus;
    getPreimage(): Uint8Array | string;
    getPreimage_asU8(): Uint8Array;
    getPreimage_asB64(): string;
    setPreimage(value: Uint8Array | string): PaymentStatus;
    clearHtlcsList(): void;
    getHtlcsList(): Array<lnd_rpc_pb.HTLCAttempt>;
    setHtlcsList(value: Array<lnd_rpc_pb.HTLCAttempt>): PaymentStatus;
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
        state: PaymentState,
        preimage: Uint8Array | string,
        htlcsList: Array<lnd_rpc_pb.HTLCAttempt.AsObject>,
    }
}

export class CircuitKey extends jspb.Message { 
    getChanId(): number;
    setChanId(value: number): CircuitKey;
    getHtlcId(): number;
    setHtlcId(value: number): CircuitKey;

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
    setIncomingCircuitKey(value?: CircuitKey): ForwardHtlcInterceptRequest;
    getIncomingAmountMsat(): number;
    setIncomingAmountMsat(value: number): ForwardHtlcInterceptRequest;
    getIncomingExpiry(): number;
    setIncomingExpiry(value: number): ForwardHtlcInterceptRequest;
    getPaymentHash(): Uint8Array | string;
    getPaymentHash_asU8(): Uint8Array;
    getPaymentHash_asB64(): string;
    setPaymentHash(value: Uint8Array | string): ForwardHtlcInterceptRequest;
    getOutgoingRequestedChanId(): number;
    setOutgoingRequestedChanId(value: number): ForwardHtlcInterceptRequest;
    getOutgoingAmountMsat(): number;
    setOutgoingAmountMsat(value: number): ForwardHtlcInterceptRequest;
    getOutgoingExpiry(): number;
    setOutgoingExpiry(value: number): ForwardHtlcInterceptRequest;

    getCustomRecordsMap(): jspb.Map<number, Uint8Array | string>;
    clearCustomRecordsMap(): void;
    getOnionBlob(): Uint8Array | string;
    getOnionBlob_asU8(): Uint8Array;
    getOnionBlob_asB64(): string;
    setOnionBlob(value: Uint8Array | string): ForwardHtlcInterceptRequest;
    getAutoFailHeight(): number;
    setAutoFailHeight(value: number): ForwardHtlcInterceptRequest;

    getInWireCustomRecordsMap(): jspb.Map<number, Uint8Array | string>;
    clearInWireCustomRecordsMap(): void;

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
        autoFailHeight: number,

        inWireCustomRecordsMap: Array<[number, Uint8Array | string]>,
    }
}

export class ForwardHtlcInterceptResponse extends jspb.Message { 

    hasIncomingCircuitKey(): boolean;
    clearIncomingCircuitKey(): void;
    getIncomingCircuitKey(): CircuitKey | undefined;
    setIncomingCircuitKey(value?: CircuitKey): ForwardHtlcInterceptResponse;
    getAction(): ResolveHoldForwardAction;
    setAction(value: ResolveHoldForwardAction): ForwardHtlcInterceptResponse;
    getPreimage(): Uint8Array | string;
    getPreimage_asU8(): Uint8Array;
    getPreimage_asB64(): string;
    setPreimage(value: Uint8Array | string): ForwardHtlcInterceptResponse;
    getFailureMessage(): Uint8Array | string;
    getFailureMessage_asU8(): Uint8Array;
    getFailureMessage_asB64(): string;
    setFailureMessage(value: Uint8Array | string): ForwardHtlcInterceptResponse;
    getFailureCode(): lnd_rpc_pb.Failure.FailureCode;
    setFailureCode(value: lnd_rpc_pb.Failure.FailureCode): ForwardHtlcInterceptResponse;
    getInAmountMsat(): number;
    setInAmountMsat(value: number): ForwardHtlcInterceptResponse;
    getOutAmountMsat(): number;
    setOutAmountMsat(value: number): ForwardHtlcInterceptResponse;

    getOutWireCustomRecordsMap(): jspb.Map<number, Uint8Array | string>;
    clearOutWireCustomRecordsMap(): void;

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
        action: ResolveHoldForwardAction,
        preimage: Uint8Array | string,
        failureMessage: Uint8Array | string,
        failureCode: lnd_rpc_pb.Failure.FailureCode,
        inAmountMsat: number,
        outAmountMsat: number,

        outWireCustomRecordsMap: Array<[number, Uint8Array | string]>,
    }
}

export class UpdateChanStatusRequest extends jspb.Message { 

    hasChanPoint(): boolean;
    clearChanPoint(): void;
    getChanPoint(): lnd_rpc_pb.ChannelPoint | undefined;
    setChanPoint(value?: lnd_rpc_pb.ChannelPoint): UpdateChanStatusRequest;
    getAction(): ChanStatusAction;
    setAction(value: ChanStatusAction): UpdateChanStatusRequest;

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
        action: ChanStatusAction,
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

export class AddAliasesRequest extends jspb.Message { 
    clearAliasMapsList(): void;
    getAliasMapsList(): Array<lnd_rpc_pb.AliasMap>;
    setAliasMapsList(value: Array<lnd_rpc_pb.AliasMap>): AddAliasesRequest;
    addAliasMaps(value?: lnd_rpc_pb.AliasMap, index?: number): lnd_rpc_pb.AliasMap;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): AddAliasesRequest.AsObject;
    static toObject(includeInstance: boolean, msg: AddAliasesRequest): AddAliasesRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: AddAliasesRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): AddAliasesRequest;
    static deserializeBinaryFromReader(message: AddAliasesRequest, reader: jspb.BinaryReader): AddAliasesRequest;
}

export namespace AddAliasesRequest {
    export type AsObject = {
        aliasMapsList: Array<lnd_rpc_pb.AliasMap.AsObject>,
    }
}

export class AddAliasesResponse extends jspb.Message { 
    clearAliasMapsList(): void;
    getAliasMapsList(): Array<lnd_rpc_pb.AliasMap>;
    setAliasMapsList(value: Array<lnd_rpc_pb.AliasMap>): AddAliasesResponse;
    addAliasMaps(value?: lnd_rpc_pb.AliasMap, index?: number): lnd_rpc_pb.AliasMap;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): AddAliasesResponse.AsObject;
    static toObject(includeInstance: boolean, msg: AddAliasesResponse): AddAliasesResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: AddAliasesResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): AddAliasesResponse;
    static deserializeBinaryFromReader(message: AddAliasesResponse, reader: jspb.BinaryReader): AddAliasesResponse;
}

export namespace AddAliasesResponse {
    export type AsObject = {
        aliasMapsList: Array<lnd_rpc_pb.AliasMap.AsObject>,
    }
}

export class DeleteAliasesRequest extends jspb.Message { 
    clearAliasMapsList(): void;
    getAliasMapsList(): Array<lnd_rpc_pb.AliasMap>;
    setAliasMapsList(value: Array<lnd_rpc_pb.AliasMap>): DeleteAliasesRequest;
    addAliasMaps(value?: lnd_rpc_pb.AliasMap, index?: number): lnd_rpc_pb.AliasMap;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): DeleteAliasesRequest.AsObject;
    static toObject(includeInstance: boolean, msg: DeleteAliasesRequest): DeleteAliasesRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: DeleteAliasesRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): DeleteAliasesRequest;
    static deserializeBinaryFromReader(message: DeleteAliasesRequest, reader: jspb.BinaryReader): DeleteAliasesRequest;
}

export namespace DeleteAliasesRequest {
    export type AsObject = {
        aliasMapsList: Array<lnd_rpc_pb.AliasMap.AsObject>,
    }
}

export class DeleteAliasesResponse extends jspb.Message { 
    clearAliasMapsList(): void;
    getAliasMapsList(): Array<lnd_rpc_pb.AliasMap>;
    setAliasMapsList(value: Array<lnd_rpc_pb.AliasMap>): DeleteAliasesResponse;
    addAliasMaps(value?: lnd_rpc_pb.AliasMap, index?: number): lnd_rpc_pb.AliasMap;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): DeleteAliasesResponse.AsObject;
    static toObject(includeInstance: boolean, msg: DeleteAliasesResponse): DeleteAliasesResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: DeleteAliasesResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): DeleteAliasesResponse;
    static deserializeBinaryFromReader(message: DeleteAliasesResponse, reader: jspb.BinaryReader): DeleteAliasesResponse;
}

export namespace DeleteAliasesResponse {
    export type AsObject = {
        aliasMapsList: Array<lnd_rpc_pb.AliasMap.AsObject>,
    }
}

export enum FailureDetail {
    UNKNOWN = 0,
    NO_DETAIL = 1,
    ONION_DECODE = 2,
    LINK_NOT_ELIGIBLE = 3,
    ON_CHAIN_TIMEOUT = 4,
    HTLC_EXCEEDS_MAX = 5,
    INSUFFICIENT_BALANCE = 6,
    INCOMPLETE_FORWARD = 7,
    HTLC_ADD_FAILED = 8,
    FORWARDS_DISABLED = 9,
    INVOICE_CANCELED = 10,
    INVOICE_UNDERPAID = 11,
    INVOICE_EXPIRY_TOO_SOON = 12,
    INVOICE_NOT_OPEN = 13,
    MPP_INVOICE_TIMEOUT = 14,
    ADDRESS_MISMATCH = 15,
    SET_TOTAL_MISMATCH = 16,
    SET_TOTAL_TOO_LOW = 17,
    SET_OVERPAID = 18,
    UNKNOWN_INVOICE = 19,
    INVALID_KEYSEND = 20,
    MPP_IN_PROGRESS = 21,
    CIRCULAR_ROUTE = 22,
}

export enum PaymentState {
    IN_FLIGHT = 0,
    SUCCEEDED = 1,
    FAILED_TIMEOUT = 2,
    FAILED_NO_ROUTE = 3,
    FAILED_ERROR = 4,
    FAILED_INCORRECT_PAYMENT_DETAILS = 5,
    FAILED_INSUFFICIENT_BALANCE = 6,
}

export enum ResolveHoldForwardAction {
    SETTLE = 0,
    FAIL = 1,
    RESUME = 2,
    RESUME_MODIFIED = 3,
}

export enum ChanStatusAction {
    ENABLE = 0,
    DISABLE = 1,
    AUTO = 2,
}
