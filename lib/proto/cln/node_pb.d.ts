// package: cln
// file: cln/node.proto

/* tslint:disable */
/* eslint-disable */

import * as jspb from "google-protobuf";
import * as cln_primitives_pb from "../cln/primitives_pb";

export class GetinfoRequest extends jspb.Message { 

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): GetinfoRequest.AsObject;
    static toObject(includeInstance: boolean, msg: GetinfoRequest): GetinfoRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: GetinfoRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): GetinfoRequest;
    static deserializeBinaryFromReader(message: GetinfoRequest, reader: jspb.BinaryReader): GetinfoRequest;
}

export namespace GetinfoRequest {
    export type AsObject = {
    }
}

export class GetinfoResponse extends jspb.Message { 
    getId(): Uint8Array | string;
    getId_asU8(): Uint8Array;
    getId_asB64(): string;
    setId(value: Uint8Array | string): GetinfoResponse;

    hasAlias(): boolean;
    clearAlias(): void;
    getAlias(): string | undefined;
    setAlias(value: string): GetinfoResponse;
    getColor(): Uint8Array | string;
    getColor_asU8(): Uint8Array;
    getColor_asB64(): string;
    setColor(value: Uint8Array | string): GetinfoResponse;
    getNumPeers(): number;
    setNumPeers(value: number): GetinfoResponse;
    getNumPendingChannels(): number;
    setNumPendingChannels(value: number): GetinfoResponse;
    getNumActiveChannels(): number;
    setNumActiveChannels(value: number): GetinfoResponse;
    getNumInactiveChannels(): number;
    setNumInactiveChannels(value: number): GetinfoResponse;
    getVersion(): string;
    setVersion(value: string): GetinfoResponse;
    getLightningDir(): string;
    setLightningDir(value: string): GetinfoResponse;

    hasOurFeatures(): boolean;
    clearOurFeatures(): void;
    getOurFeatures(): GetinfoOur_features | undefined;
    setOurFeatures(value?: GetinfoOur_features): GetinfoResponse;
    getBlockheight(): number;
    setBlockheight(value: number): GetinfoResponse;
    getNetwork(): string;
    setNetwork(value: string): GetinfoResponse;

    hasFeesCollectedMsat(): boolean;
    clearFeesCollectedMsat(): void;
    getFeesCollectedMsat(): cln_primitives_pb.Amount | undefined;
    setFeesCollectedMsat(value?: cln_primitives_pb.Amount): GetinfoResponse;
    clearAddressList(): void;
    getAddressList(): Array<GetinfoAddress>;
    setAddressList(value: Array<GetinfoAddress>): GetinfoResponse;
    addAddress(value?: GetinfoAddress, index?: number): GetinfoAddress;
    clearBindingList(): void;
    getBindingList(): Array<GetinfoBinding>;
    setBindingList(value: Array<GetinfoBinding>): GetinfoResponse;
    addBinding(value?: GetinfoBinding, index?: number): GetinfoBinding;

    hasWarningBitcoindSync(): boolean;
    clearWarningBitcoindSync(): void;
    getWarningBitcoindSync(): string | undefined;
    setWarningBitcoindSync(value: string): GetinfoResponse;

    hasWarningLightningdSync(): boolean;
    clearWarningLightningdSync(): void;
    getWarningLightningdSync(): string | undefined;
    setWarningLightningdSync(value: string): GetinfoResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): GetinfoResponse.AsObject;
    static toObject(includeInstance: boolean, msg: GetinfoResponse): GetinfoResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: GetinfoResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): GetinfoResponse;
    static deserializeBinaryFromReader(message: GetinfoResponse, reader: jspb.BinaryReader): GetinfoResponse;
}

export namespace GetinfoResponse {
    export type AsObject = {
        id: Uint8Array | string,
        alias?: string,
        color: Uint8Array | string,
        numPeers: number,
        numPendingChannels: number,
        numActiveChannels: number,
        numInactiveChannels: number,
        version: string,
        lightningDir: string,
        ourFeatures?: GetinfoOur_features.AsObject,
        blockheight: number,
        network: string,
        feesCollectedMsat?: cln_primitives_pb.Amount.AsObject,
        addressList: Array<GetinfoAddress.AsObject>,
        bindingList: Array<GetinfoBinding.AsObject>,
        warningBitcoindSync?: string,
        warningLightningdSync?: string,
    }
}

export class GetinfoOur_features extends jspb.Message { 
    getInit(): Uint8Array | string;
    getInit_asU8(): Uint8Array;
    getInit_asB64(): string;
    setInit(value: Uint8Array | string): GetinfoOur_features;
    getNode(): Uint8Array | string;
    getNode_asU8(): Uint8Array;
    getNode_asB64(): string;
    setNode(value: Uint8Array | string): GetinfoOur_features;
    getChannel(): Uint8Array | string;
    getChannel_asU8(): Uint8Array;
    getChannel_asB64(): string;
    setChannel(value: Uint8Array | string): GetinfoOur_features;
    getInvoice(): Uint8Array | string;
    getInvoice_asU8(): Uint8Array;
    getInvoice_asB64(): string;
    setInvoice(value: Uint8Array | string): GetinfoOur_features;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): GetinfoOur_features.AsObject;
    static toObject(includeInstance: boolean, msg: GetinfoOur_features): GetinfoOur_features.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: GetinfoOur_features, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): GetinfoOur_features;
    static deserializeBinaryFromReader(message: GetinfoOur_features, reader: jspb.BinaryReader): GetinfoOur_features;
}

export namespace GetinfoOur_features {
    export type AsObject = {
        init: Uint8Array | string,
        node: Uint8Array | string,
        channel: Uint8Array | string,
        invoice: Uint8Array | string,
    }
}

export class GetinfoAddress extends jspb.Message { 
    getItemType(): GetinfoAddress.GetinfoAddressType;
    setItemType(value: GetinfoAddress.GetinfoAddressType): GetinfoAddress;
    getPort(): number;
    setPort(value: number): GetinfoAddress;

    hasAddress(): boolean;
    clearAddress(): void;
    getAddress(): string | undefined;
    setAddress(value: string): GetinfoAddress;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): GetinfoAddress.AsObject;
    static toObject(includeInstance: boolean, msg: GetinfoAddress): GetinfoAddress.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: GetinfoAddress, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): GetinfoAddress;
    static deserializeBinaryFromReader(message: GetinfoAddress, reader: jspb.BinaryReader): GetinfoAddress;
}

export namespace GetinfoAddress {
    export type AsObject = {
        itemType: GetinfoAddress.GetinfoAddressType,
        port: number,
        address?: string,
    }

    export enum GetinfoAddressType {
    DNS = 0,
    IPV4 = 1,
    IPV6 = 2,
    TORV2 = 3,
    TORV3 = 4,
    }

}

export class GetinfoBinding extends jspb.Message { 
    getItemType(): GetinfoBinding.GetinfoBindingType;
    setItemType(value: GetinfoBinding.GetinfoBindingType): GetinfoBinding;

    hasAddress(): boolean;
    clearAddress(): void;
    getAddress(): string | undefined;
    setAddress(value: string): GetinfoBinding;

    hasPort(): boolean;
    clearPort(): void;
    getPort(): number | undefined;
    setPort(value: number): GetinfoBinding;

    hasSocket(): boolean;
    clearSocket(): void;
    getSocket(): string | undefined;
    setSocket(value: string): GetinfoBinding;

    hasSubtype(): boolean;
    clearSubtype(): void;
    getSubtype(): string | undefined;
    setSubtype(value: string): GetinfoBinding;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): GetinfoBinding.AsObject;
    static toObject(includeInstance: boolean, msg: GetinfoBinding): GetinfoBinding.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: GetinfoBinding, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): GetinfoBinding;
    static deserializeBinaryFromReader(message: GetinfoBinding, reader: jspb.BinaryReader): GetinfoBinding;
}

export namespace GetinfoBinding {
    export type AsObject = {
        itemType: GetinfoBinding.GetinfoBindingType,
        address?: string,
        port?: number,
        socket?: string,
        subtype?: string,
    }

    export enum GetinfoBindingType {
    LOCAL_SOCKET = 0,
    IPV4 = 1,
    IPV6 = 2,
    TORV2 = 3,
    TORV3 = 4,
    WEBSOCKET = 5,
    }

}

export class ListpeersRequest extends jspb.Message { 

    hasId(): boolean;
    clearId(): void;
    getId(): Uint8Array | string;
    getId_asU8(): Uint8Array;
    getId_asB64(): string;
    setId(value: Uint8Array | string): ListpeersRequest;

    hasLevel(): boolean;
    clearLevel(): void;
    getLevel(): ListpeersRequest.ListpeersLevel | undefined;
    setLevel(value: ListpeersRequest.ListpeersLevel): ListpeersRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ListpeersRequest.AsObject;
    static toObject(includeInstance: boolean, msg: ListpeersRequest): ListpeersRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ListpeersRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ListpeersRequest;
    static deserializeBinaryFromReader(message: ListpeersRequest, reader: jspb.BinaryReader): ListpeersRequest;
}

export namespace ListpeersRequest {
    export type AsObject = {
        id: Uint8Array | string,
        level?: ListpeersRequest.ListpeersLevel,
    }

    export enum ListpeersLevel {
    IO = 0,
    DEBUG = 1,
    INFO = 2,
    UNUSUAL = 3,
    TRACE = 4,
    }

}

export class ListpeersResponse extends jspb.Message { 
    clearPeersList(): void;
    getPeersList(): Array<ListpeersPeers>;
    setPeersList(value: Array<ListpeersPeers>): ListpeersResponse;
    addPeers(value?: ListpeersPeers, index?: number): ListpeersPeers;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ListpeersResponse.AsObject;
    static toObject(includeInstance: boolean, msg: ListpeersResponse): ListpeersResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ListpeersResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ListpeersResponse;
    static deserializeBinaryFromReader(message: ListpeersResponse, reader: jspb.BinaryReader): ListpeersResponse;
}

export namespace ListpeersResponse {
    export type AsObject = {
        peersList: Array<ListpeersPeers.AsObject>,
    }
}

export class ListpeersPeers extends jspb.Message { 
    getId(): Uint8Array | string;
    getId_asU8(): Uint8Array;
    getId_asB64(): string;
    setId(value: Uint8Array | string): ListpeersPeers;
    getConnected(): boolean;
    setConnected(value: boolean): ListpeersPeers;
    clearLogList(): void;
    getLogList(): Array<ListpeersPeersLog>;
    setLogList(value: Array<ListpeersPeersLog>): ListpeersPeers;
    addLog(value?: ListpeersPeersLog, index?: number): ListpeersPeersLog;
    clearNetaddrList(): void;
    getNetaddrList(): Array<string>;
    setNetaddrList(value: Array<string>): ListpeersPeers;
    addNetaddr(value: string, index?: number): string;

    hasFeatures(): boolean;
    clearFeatures(): void;
    getFeatures(): Uint8Array | string;
    getFeatures_asU8(): Uint8Array;
    getFeatures_asB64(): string;
    setFeatures(value: Uint8Array | string): ListpeersPeers;

    hasRemoteAddr(): boolean;
    clearRemoteAddr(): void;
    getRemoteAddr(): string | undefined;
    setRemoteAddr(value: string): ListpeersPeers;

    hasNumChannels(): boolean;
    clearNumChannels(): void;
    getNumChannels(): number | undefined;
    setNumChannels(value: number): ListpeersPeers;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ListpeersPeers.AsObject;
    static toObject(includeInstance: boolean, msg: ListpeersPeers): ListpeersPeers.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ListpeersPeers, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ListpeersPeers;
    static deserializeBinaryFromReader(message: ListpeersPeers, reader: jspb.BinaryReader): ListpeersPeers;
}

export namespace ListpeersPeers {
    export type AsObject = {
        id: Uint8Array | string,
        connected: boolean,
        logList: Array<ListpeersPeersLog.AsObject>,
        netaddrList: Array<string>,
        features: Uint8Array | string,
        remoteAddr?: string,
        numChannels?: number,
    }
}

export class ListpeersPeersLog extends jspb.Message { 
    getItemType(): ListpeersPeersLog.ListpeersPeersLogType;
    setItemType(value: ListpeersPeersLog.ListpeersPeersLogType): ListpeersPeersLog;

    hasNumSkipped(): boolean;
    clearNumSkipped(): void;
    getNumSkipped(): number | undefined;
    setNumSkipped(value: number): ListpeersPeersLog;

    hasTime(): boolean;
    clearTime(): void;
    getTime(): string | undefined;
    setTime(value: string): ListpeersPeersLog;

    hasSource(): boolean;
    clearSource(): void;
    getSource(): string | undefined;
    setSource(value: string): ListpeersPeersLog;

    hasLog(): boolean;
    clearLog(): void;
    getLog(): string | undefined;
    setLog(value: string): ListpeersPeersLog;

    hasNodeId(): boolean;
    clearNodeId(): void;
    getNodeId(): Uint8Array | string;
    getNodeId_asU8(): Uint8Array;
    getNodeId_asB64(): string;
    setNodeId(value: Uint8Array | string): ListpeersPeersLog;

    hasData(): boolean;
    clearData(): void;
    getData(): Uint8Array | string;
    getData_asU8(): Uint8Array;
    getData_asB64(): string;
    setData(value: Uint8Array | string): ListpeersPeersLog;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ListpeersPeersLog.AsObject;
    static toObject(includeInstance: boolean, msg: ListpeersPeersLog): ListpeersPeersLog.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ListpeersPeersLog, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ListpeersPeersLog;
    static deserializeBinaryFromReader(message: ListpeersPeersLog, reader: jspb.BinaryReader): ListpeersPeersLog;
}

export namespace ListpeersPeersLog {
    export type AsObject = {
        itemType: ListpeersPeersLog.ListpeersPeersLogType,
        numSkipped?: number,
        time?: string,
        source?: string,
        log?: string,
        nodeId: Uint8Array | string,
        data: Uint8Array | string,
    }

    export enum ListpeersPeersLogType {
    SKIPPED = 0,
    BROKEN = 1,
    UNUSUAL = 2,
    INFO = 3,
    DEBUG = 4,
    IO_IN = 5,
    IO_OUT = 6,
    TRACE = 7,
    }

}

export class ListfundsRequest extends jspb.Message { 

    hasSpent(): boolean;
    clearSpent(): void;
    getSpent(): boolean | undefined;
    setSpent(value: boolean): ListfundsRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ListfundsRequest.AsObject;
    static toObject(includeInstance: boolean, msg: ListfundsRequest): ListfundsRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ListfundsRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ListfundsRequest;
    static deserializeBinaryFromReader(message: ListfundsRequest, reader: jspb.BinaryReader): ListfundsRequest;
}

export namespace ListfundsRequest {
    export type AsObject = {
        spent?: boolean,
    }
}

export class ListfundsResponse extends jspb.Message { 
    clearOutputsList(): void;
    getOutputsList(): Array<ListfundsOutputs>;
    setOutputsList(value: Array<ListfundsOutputs>): ListfundsResponse;
    addOutputs(value?: ListfundsOutputs, index?: number): ListfundsOutputs;
    clearChannelsList(): void;
    getChannelsList(): Array<ListfundsChannels>;
    setChannelsList(value: Array<ListfundsChannels>): ListfundsResponse;
    addChannels(value?: ListfundsChannels, index?: number): ListfundsChannels;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ListfundsResponse.AsObject;
    static toObject(includeInstance: boolean, msg: ListfundsResponse): ListfundsResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ListfundsResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ListfundsResponse;
    static deserializeBinaryFromReader(message: ListfundsResponse, reader: jspb.BinaryReader): ListfundsResponse;
}

export namespace ListfundsResponse {
    export type AsObject = {
        outputsList: Array<ListfundsOutputs.AsObject>,
        channelsList: Array<ListfundsChannels.AsObject>,
    }
}

export class ListfundsOutputs extends jspb.Message { 
    getTxid(): Uint8Array | string;
    getTxid_asU8(): Uint8Array;
    getTxid_asB64(): string;
    setTxid(value: Uint8Array | string): ListfundsOutputs;
    getOutput(): number;
    setOutput(value: number): ListfundsOutputs;

    hasAmountMsat(): boolean;
    clearAmountMsat(): void;
    getAmountMsat(): cln_primitives_pb.Amount | undefined;
    setAmountMsat(value?: cln_primitives_pb.Amount): ListfundsOutputs;
    getScriptpubkey(): Uint8Array | string;
    getScriptpubkey_asU8(): Uint8Array;
    getScriptpubkey_asB64(): string;
    setScriptpubkey(value: Uint8Array | string): ListfundsOutputs;

    hasAddress(): boolean;
    clearAddress(): void;
    getAddress(): string | undefined;
    setAddress(value: string): ListfundsOutputs;

    hasRedeemscript(): boolean;
    clearRedeemscript(): void;
    getRedeemscript(): Uint8Array | string;
    getRedeemscript_asU8(): Uint8Array;
    getRedeemscript_asB64(): string;
    setRedeemscript(value: Uint8Array | string): ListfundsOutputs;
    getStatus(): ListfundsOutputs.ListfundsOutputsStatus;
    setStatus(value: ListfundsOutputs.ListfundsOutputsStatus): ListfundsOutputs;

    hasBlockheight(): boolean;
    clearBlockheight(): void;
    getBlockheight(): number | undefined;
    setBlockheight(value: number): ListfundsOutputs;
    getReserved(): boolean;
    setReserved(value: boolean): ListfundsOutputs;

    hasReservedToBlock(): boolean;
    clearReservedToBlock(): void;
    getReservedToBlock(): number | undefined;
    setReservedToBlock(value: number): ListfundsOutputs;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ListfundsOutputs.AsObject;
    static toObject(includeInstance: boolean, msg: ListfundsOutputs): ListfundsOutputs.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ListfundsOutputs, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ListfundsOutputs;
    static deserializeBinaryFromReader(message: ListfundsOutputs, reader: jspb.BinaryReader): ListfundsOutputs;
}

export namespace ListfundsOutputs {
    export type AsObject = {
        txid: Uint8Array | string,
        output: number,
        amountMsat?: cln_primitives_pb.Amount.AsObject,
        scriptpubkey: Uint8Array | string,
        address?: string,
        redeemscript: Uint8Array | string,
        status: ListfundsOutputs.ListfundsOutputsStatus,
        blockheight?: number,
        reserved: boolean,
        reservedToBlock?: number,
    }

    export enum ListfundsOutputsStatus {
    UNCONFIRMED = 0,
    CONFIRMED = 1,
    SPENT = 2,
    IMMATURE = 3,
    }

}

export class ListfundsChannels extends jspb.Message { 
    getPeerId(): Uint8Array | string;
    getPeerId_asU8(): Uint8Array;
    getPeerId_asB64(): string;
    setPeerId(value: Uint8Array | string): ListfundsChannels;

    hasOurAmountMsat(): boolean;
    clearOurAmountMsat(): void;
    getOurAmountMsat(): cln_primitives_pb.Amount | undefined;
    setOurAmountMsat(value?: cln_primitives_pb.Amount): ListfundsChannels;

    hasAmountMsat(): boolean;
    clearAmountMsat(): void;
    getAmountMsat(): cln_primitives_pb.Amount | undefined;
    setAmountMsat(value?: cln_primitives_pb.Amount): ListfundsChannels;
    getFundingTxid(): Uint8Array | string;
    getFundingTxid_asU8(): Uint8Array;
    getFundingTxid_asB64(): string;
    setFundingTxid(value: Uint8Array | string): ListfundsChannels;
    getFundingOutput(): number;
    setFundingOutput(value: number): ListfundsChannels;
    getConnected(): boolean;
    setConnected(value: boolean): ListfundsChannels;
    getState(): cln_primitives_pb.ChannelState;
    setState(value: cln_primitives_pb.ChannelState): ListfundsChannels;

    hasShortChannelId(): boolean;
    clearShortChannelId(): void;
    getShortChannelId(): string | undefined;
    setShortChannelId(value: string): ListfundsChannels;

    hasChannelId(): boolean;
    clearChannelId(): void;
    getChannelId(): Uint8Array | string;
    getChannelId_asU8(): Uint8Array;
    getChannelId_asB64(): string;
    setChannelId(value: Uint8Array | string): ListfundsChannels;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ListfundsChannels.AsObject;
    static toObject(includeInstance: boolean, msg: ListfundsChannels): ListfundsChannels.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ListfundsChannels, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ListfundsChannels;
    static deserializeBinaryFromReader(message: ListfundsChannels, reader: jspb.BinaryReader): ListfundsChannels;
}

export namespace ListfundsChannels {
    export type AsObject = {
        peerId: Uint8Array | string,
        ourAmountMsat?: cln_primitives_pb.Amount.AsObject,
        amountMsat?: cln_primitives_pb.Amount.AsObject,
        fundingTxid: Uint8Array | string,
        fundingOutput: number,
        connected: boolean,
        state: cln_primitives_pb.ChannelState,
        shortChannelId?: string,
        channelId: Uint8Array | string,
    }
}

export class SendpayRequest extends jspb.Message { 
    clearRouteList(): void;
    getRouteList(): Array<SendpayRoute>;
    setRouteList(value: Array<SendpayRoute>): SendpayRequest;
    addRoute(value?: SendpayRoute, index?: number): SendpayRoute;
    getPaymentHash(): Uint8Array | string;
    getPaymentHash_asU8(): Uint8Array;
    getPaymentHash_asB64(): string;
    setPaymentHash(value: Uint8Array | string): SendpayRequest;

    hasLabel(): boolean;
    clearLabel(): void;
    getLabel(): string | undefined;
    setLabel(value: string): SendpayRequest;

    hasBolt11(): boolean;
    clearBolt11(): void;
    getBolt11(): string | undefined;
    setBolt11(value: string): SendpayRequest;

    hasPaymentSecret(): boolean;
    clearPaymentSecret(): void;
    getPaymentSecret(): Uint8Array | string;
    getPaymentSecret_asU8(): Uint8Array;
    getPaymentSecret_asB64(): string;
    setPaymentSecret(value: Uint8Array | string): SendpayRequest;

    hasPartid(): boolean;
    clearPartid(): void;
    getPartid(): number | undefined;
    setPartid(value: number): SendpayRequest;

    hasGroupid(): boolean;
    clearGroupid(): void;
    getGroupid(): number | undefined;
    setGroupid(value: number): SendpayRequest;

    hasAmountMsat(): boolean;
    clearAmountMsat(): void;
    getAmountMsat(): cln_primitives_pb.Amount | undefined;
    setAmountMsat(value?: cln_primitives_pb.Amount): SendpayRequest;

    hasLocalinvreqid(): boolean;
    clearLocalinvreqid(): void;
    getLocalinvreqid(): Uint8Array | string;
    getLocalinvreqid_asU8(): Uint8Array;
    getLocalinvreqid_asB64(): string;
    setLocalinvreqid(value: Uint8Array | string): SendpayRequest;

    hasPaymentMetadata(): boolean;
    clearPaymentMetadata(): void;
    getPaymentMetadata(): Uint8Array | string;
    getPaymentMetadata_asU8(): Uint8Array;
    getPaymentMetadata_asB64(): string;
    setPaymentMetadata(value: Uint8Array | string): SendpayRequest;

    hasDescription(): boolean;
    clearDescription(): void;
    getDescription(): string | undefined;
    setDescription(value: string): SendpayRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): SendpayRequest.AsObject;
    static toObject(includeInstance: boolean, msg: SendpayRequest): SendpayRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: SendpayRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): SendpayRequest;
    static deserializeBinaryFromReader(message: SendpayRequest, reader: jspb.BinaryReader): SendpayRequest;
}

export namespace SendpayRequest {
    export type AsObject = {
        routeList: Array<SendpayRoute.AsObject>,
        paymentHash: Uint8Array | string,
        label?: string,
        bolt11?: string,
        paymentSecret: Uint8Array | string,
        partid?: number,
        groupid?: number,
        amountMsat?: cln_primitives_pb.Amount.AsObject,
        localinvreqid: Uint8Array | string,
        paymentMetadata: Uint8Array | string,
        description?: string,
    }
}

export class SendpayResponse extends jspb.Message { 
    getId(): number;
    setId(value: number): SendpayResponse;

    hasGroupid(): boolean;
    clearGroupid(): void;
    getGroupid(): number | undefined;
    setGroupid(value: number): SendpayResponse;
    getPaymentHash(): Uint8Array | string;
    getPaymentHash_asU8(): Uint8Array;
    getPaymentHash_asB64(): string;
    setPaymentHash(value: Uint8Array | string): SendpayResponse;
    getStatus(): SendpayResponse.SendpayStatus;
    setStatus(value: SendpayResponse.SendpayStatus): SendpayResponse;

    hasAmountMsat(): boolean;
    clearAmountMsat(): void;
    getAmountMsat(): cln_primitives_pb.Amount | undefined;
    setAmountMsat(value?: cln_primitives_pb.Amount): SendpayResponse;

    hasDestination(): boolean;
    clearDestination(): void;
    getDestination(): Uint8Array | string;
    getDestination_asU8(): Uint8Array;
    getDestination_asB64(): string;
    setDestination(value: Uint8Array | string): SendpayResponse;
    getCreatedAt(): number;
    setCreatedAt(value: number): SendpayResponse;

    hasAmountSentMsat(): boolean;
    clearAmountSentMsat(): void;
    getAmountSentMsat(): cln_primitives_pb.Amount | undefined;
    setAmountSentMsat(value?: cln_primitives_pb.Amount): SendpayResponse;

    hasLabel(): boolean;
    clearLabel(): void;
    getLabel(): string | undefined;
    setLabel(value: string): SendpayResponse;

    hasPartid(): boolean;
    clearPartid(): void;
    getPartid(): number | undefined;
    setPartid(value: number): SendpayResponse;

    hasBolt11(): boolean;
    clearBolt11(): void;
    getBolt11(): string | undefined;
    setBolt11(value: string): SendpayResponse;

    hasBolt12(): boolean;
    clearBolt12(): void;
    getBolt12(): string | undefined;
    setBolt12(value: string): SendpayResponse;

    hasPaymentPreimage(): boolean;
    clearPaymentPreimage(): void;
    getPaymentPreimage(): Uint8Array | string;
    getPaymentPreimage_asU8(): Uint8Array;
    getPaymentPreimage_asB64(): string;
    setPaymentPreimage(value: Uint8Array | string): SendpayResponse;

    hasMessage(): boolean;
    clearMessage(): void;
    getMessage(): string | undefined;
    setMessage(value: string): SendpayResponse;

    hasCompletedAt(): boolean;
    clearCompletedAt(): void;
    getCompletedAt(): number | undefined;
    setCompletedAt(value: number): SendpayResponse;

    hasCreatedIndex(): boolean;
    clearCreatedIndex(): void;
    getCreatedIndex(): number | undefined;
    setCreatedIndex(value: number): SendpayResponse;

    hasUpdatedIndex(): boolean;
    clearUpdatedIndex(): void;
    getUpdatedIndex(): number | undefined;
    setUpdatedIndex(value: number): SendpayResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): SendpayResponse.AsObject;
    static toObject(includeInstance: boolean, msg: SendpayResponse): SendpayResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: SendpayResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): SendpayResponse;
    static deserializeBinaryFromReader(message: SendpayResponse, reader: jspb.BinaryReader): SendpayResponse;
}

export namespace SendpayResponse {
    export type AsObject = {
        id: number,
        groupid?: number,
        paymentHash: Uint8Array | string,
        status: SendpayResponse.SendpayStatus,
        amountMsat?: cln_primitives_pb.Amount.AsObject,
        destination: Uint8Array | string,
        createdAt: number,
        amountSentMsat?: cln_primitives_pb.Amount.AsObject,
        label?: string,
        partid?: number,
        bolt11?: string,
        bolt12?: string,
        paymentPreimage: Uint8Array | string,
        message?: string,
        completedAt?: number,
        createdIndex?: number,
        updatedIndex?: number,
    }

    export enum SendpayStatus {
    PENDING = 0,
    COMPLETE = 1,
    }

}

export class SendpayRoute extends jspb.Message { 
    getId(): Uint8Array | string;
    getId_asU8(): Uint8Array;
    getId_asB64(): string;
    setId(value: Uint8Array | string): SendpayRoute;
    getDelay(): number;
    setDelay(value: number): SendpayRoute;
    getChannel(): string;
    setChannel(value: string): SendpayRoute;

    hasAmountMsat(): boolean;
    clearAmountMsat(): void;
    getAmountMsat(): cln_primitives_pb.Amount | undefined;
    setAmountMsat(value?: cln_primitives_pb.Amount): SendpayRoute;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): SendpayRoute.AsObject;
    static toObject(includeInstance: boolean, msg: SendpayRoute): SendpayRoute.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: SendpayRoute, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): SendpayRoute;
    static deserializeBinaryFromReader(message: SendpayRoute, reader: jspb.BinaryReader): SendpayRoute;
}

export namespace SendpayRoute {
    export type AsObject = {
        id: Uint8Array | string,
        delay: number,
        channel: string,
        amountMsat?: cln_primitives_pb.Amount.AsObject,
    }
}

export class ListchannelsRequest extends jspb.Message { 

    hasShortChannelId(): boolean;
    clearShortChannelId(): void;
    getShortChannelId(): string | undefined;
    setShortChannelId(value: string): ListchannelsRequest;

    hasSource(): boolean;
    clearSource(): void;
    getSource(): Uint8Array | string;
    getSource_asU8(): Uint8Array;
    getSource_asB64(): string;
    setSource(value: Uint8Array | string): ListchannelsRequest;

    hasDestination(): boolean;
    clearDestination(): void;
    getDestination(): Uint8Array | string;
    getDestination_asU8(): Uint8Array;
    getDestination_asB64(): string;
    setDestination(value: Uint8Array | string): ListchannelsRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ListchannelsRequest.AsObject;
    static toObject(includeInstance: boolean, msg: ListchannelsRequest): ListchannelsRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ListchannelsRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ListchannelsRequest;
    static deserializeBinaryFromReader(message: ListchannelsRequest, reader: jspb.BinaryReader): ListchannelsRequest;
}

export namespace ListchannelsRequest {
    export type AsObject = {
        shortChannelId?: string,
        source: Uint8Array | string,
        destination: Uint8Array | string,
    }
}

export class ListchannelsResponse extends jspb.Message { 
    clearChannelsList(): void;
    getChannelsList(): Array<ListchannelsChannels>;
    setChannelsList(value: Array<ListchannelsChannels>): ListchannelsResponse;
    addChannels(value?: ListchannelsChannels, index?: number): ListchannelsChannels;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ListchannelsResponse.AsObject;
    static toObject(includeInstance: boolean, msg: ListchannelsResponse): ListchannelsResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ListchannelsResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ListchannelsResponse;
    static deserializeBinaryFromReader(message: ListchannelsResponse, reader: jspb.BinaryReader): ListchannelsResponse;
}

export namespace ListchannelsResponse {
    export type AsObject = {
        channelsList: Array<ListchannelsChannels.AsObject>,
    }
}

export class ListchannelsChannels extends jspb.Message { 
    getSource(): Uint8Array | string;
    getSource_asU8(): Uint8Array;
    getSource_asB64(): string;
    setSource(value: Uint8Array | string): ListchannelsChannels;
    getDestination(): Uint8Array | string;
    getDestination_asU8(): Uint8Array;
    getDestination_asB64(): string;
    setDestination(value: Uint8Array | string): ListchannelsChannels;
    getShortChannelId(): string;
    setShortChannelId(value: string): ListchannelsChannels;
    getPublic(): boolean;
    setPublic(value: boolean): ListchannelsChannels;

    hasAmountMsat(): boolean;
    clearAmountMsat(): void;
    getAmountMsat(): cln_primitives_pb.Amount | undefined;
    setAmountMsat(value?: cln_primitives_pb.Amount): ListchannelsChannels;
    getMessageFlags(): number;
    setMessageFlags(value: number): ListchannelsChannels;
    getChannelFlags(): number;
    setChannelFlags(value: number): ListchannelsChannels;
    getActive(): boolean;
    setActive(value: boolean): ListchannelsChannels;
    getLastUpdate(): number;
    setLastUpdate(value: number): ListchannelsChannels;
    getBaseFeeMillisatoshi(): number;
    setBaseFeeMillisatoshi(value: number): ListchannelsChannels;
    getFeePerMillionth(): number;
    setFeePerMillionth(value: number): ListchannelsChannels;
    getDelay(): number;
    setDelay(value: number): ListchannelsChannels;

    hasHtlcMinimumMsat(): boolean;
    clearHtlcMinimumMsat(): void;
    getHtlcMinimumMsat(): cln_primitives_pb.Amount | undefined;
    setHtlcMinimumMsat(value?: cln_primitives_pb.Amount): ListchannelsChannels;

    hasHtlcMaximumMsat(): boolean;
    clearHtlcMaximumMsat(): void;
    getHtlcMaximumMsat(): cln_primitives_pb.Amount | undefined;
    setHtlcMaximumMsat(value?: cln_primitives_pb.Amount): ListchannelsChannels;
    getFeatures(): Uint8Array | string;
    getFeatures_asU8(): Uint8Array;
    getFeatures_asB64(): string;
    setFeatures(value: Uint8Array | string): ListchannelsChannels;
    getDirection(): number;
    setDirection(value: number): ListchannelsChannels;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ListchannelsChannels.AsObject;
    static toObject(includeInstance: boolean, msg: ListchannelsChannels): ListchannelsChannels.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ListchannelsChannels, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ListchannelsChannels;
    static deserializeBinaryFromReader(message: ListchannelsChannels, reader: jspb.BinaryReader): ListchannelsChannels;
}

export namespace ListchannelsChannels {
    export type AsObject = {
        source: Uint8Array | string,
        destination: Uint8Array | string,
        shortChannelId: string,
        pb_public: boolean,
        amountMsat?: cln_primitives_pb.Amount.AsObject,
        messageFlags: number,
        channelFlags: number,
        active: boolean,
        lastUpdate: number,
        baseFeeMillisatoshi: number,
        feePerMillionth: number,
        delay: number,
        htlcMinimumMsat?: cln_primitives_pb.Amount.AsObject,
        htlcMaximumMsat?: cln_primitives_pb.Amount.AsObject,
        features: Uint8Array | string,
        direction: number,
    }
}

export class AddgossipRequest extends jspb.Message { 
    getMessage(): Uint8Array | string;
    getMessage_asU8(): Uint8Array;
    getMessage_asB64(): string;
    setMessage(value: Uint8Array | string): AddgossipRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): AddgossipRequest.AsObject;
    static toObject(includeInstance: boolean, msg: AddgossipRequest): AddgossipRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: AddgossipRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): AddgossipRequest;
    static deserializeBinaryFromReader(message: AddgossipRequest, reader: jspb.BinaryReader): AddgossipRequest;
}

export namespace AddgossipRequest {
    export type AsObject = {
        message: Uint8Array | string,
    }
}

export class AddgossipResponse extends jspb.Message { 

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): AddgossipResponse.AsObject;
    static toObject(includeInstance: boolean, msg: AddgossipResponse): AddgossipResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: AddgossipResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): AddgossipResponse;
    static deserializeBinaryFromReader(message: AddgossipResponse, reader: jspb.BinaryReader): AddgossipResponse;
}

export namespace AddgossipResponse {
    export type AsObject = {
    }
}

export class AddpsbtoutputRequest extends jspb.Message { 

    hasSatoshi(): boolean;
    clearSatoshi(): void;
    getSatoshi(): cln_primitives_pb.Amount | undefined;
    setSatoshi(value?: cln_primitives_pb.Amount): AddpsbtoutputRequest;

    hasLocktime(): boolean;
    clearLocktime(): void;
    getLocktime(): number | undefined;
    setLocktime(value: number): AddpsbtoutputRequest;

    hasInitialpsbt(): boolean;
    clearInitialpsbt(): void;
    getInitialpsbt(): string | undefined;
    setInitialpsbt(value: string): AddpsbtoutputRequest;

    hasDestination(): boolean;
    clearDestination(): void;
    getDestination(): string | undefined;
    setDestination(value: string): AddpsbtoutputRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): AddpsbtoutputRequest.AsObject;
    static toObject(includeInstance: boolean, msg: AddpsbtoutputRequest): AddpsbtoutputRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: AddpsbtoutputRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): AddpsbtoutputRequest;
    static deserializeBinaryFromReader(message: AddpsbtoutputRequest, reader: jspb.BinaryReader): AddpsbtoutputRequest;
}

export namespace AddpsbtoutputRequest {
    export type AsObject = {
        satoshi?: cln_primitives_pb.Amount.AsObject,
        locktime?: number,
        initialpsbt?: string,
        destination?: string,
    }
}

export class AddpsbtoutputResponse extends jspb.Message { 
    getPsbt(): string;
    setPsbt(value: string): AddpsbtoutputResponse;
    getEstimatedAddedWeight(): number;
    setEstimatedAddedWeight(value: number): AddpsbtoutputResponse;
    getOutnum(): number;
    setOutnum(value: number): AddpsbtoutputResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): AddpsbtoutputResponse.AsObject;
    static toObject(includeInstance: boolean, msg: AddpsbtoutputResponse): AddpsbtoutputResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: AddpsbtoutputResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): AddpsbtoutputResponse;
    static deserializeBinaryFromReader(message: AddpsbtoutputResponse, reader: jspb.BinaryReader): AddpsbtoutputResponse;
}

export namespace AddpsbtoutputResponse {
    export type AsObject = {
        psbt: string,
        estimatedAddedWeight: number,
        outnum: number,
    }
}

export class AutocleanonceRequest extends jspb.Message { 
    getSubsystem(): cln_primitives_pb.AutocleanSubsystem;
    setSubsystem(value: cln_primitives_pb.AutocleanSubsystem): AutocleanonceRequest;
    getAge(): number;
    setAge(value: number): AutocleanonceRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): AutocleanonceRequest.AsObject;
    static toObject(includeInstance: boolean, msg: AutocleanonceRequest): AutocleanonceRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: AutocleanonceRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): AutocleanonceRequest;
    static deserializeBinaryFromReader(message: AutocleanonceRequest, reader: jspb.BinaryReader): AutocleanonceRequest;
}

export namespace AutocleanonceRequest {
    export type AsObject = {
        subsystem: cln_primitives_pb.AutocleanSubsystem,
        age: number,
    }
}

export class AutocleanonceResponse extends jspb.Message { 

    hasAutoclean(): boolean;
    clearAutoclean(): void;
    getAutoclean(): AutocleanonceAutoclean | undefined;
    setAutoclean(value?: AutocleanonceAutoclean): AutocleanonceResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): AutocleanonceResponse.AsObject;
    static toObject(includeInstance: boolean, msg: AutocleanonceResponse): AutocleanonceResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: AutocleanonceResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): AutocleanonceResponse;
    static deserializeBinaryFromReader(message: AutocleanonceResponse, reader: jspb.BinaryReader): AutocleanonceResponse;
}

export namespace AutocleanonceResponse {
    export type AsObject = {
        autoclean?: AutocleanonceAutoclean.AsObject,
    }
}

export class AutocleanonceAutoclean extends jspb.Message { 

    hasSucceededforwards(): boolean;
    clearSucceededforwards(): void;
    getSucceededforwards(): AutocleanonceAutocleanSucceededforwards | undefined;
    setSucceededforwards(value?: AutocleanonceAutocleanSucceededforwards): AutocleanonceAutoclean;

    hasFailedforwards(): boolean;
    clearFailedforwards(): void;
    getFailedforwards(): AutocleanonceAutocleanFailedforwards | undefined;
    setFailedforwards(value?: AutocleanonceAutocleanFailedforwards): AutocleanonceAutoclean;

    hasSucceededpays(): boolean;
    clearSucceededpays(): void;
    getSucceededpays(): AutocleanonceAutocleanSucceededpays | undefined;
    setSucceededpays(value?: AutocleanonceAutocleanSucceededpays): AutocleanonceAutoclean;

    hasFailedpays(): boolean;
    clearFailedpays(): void;
    getFailedpays(): AutocleanonceAutocleanFailedpays | undefined;
    setFailedpays(value?: AutocleanonceAutocleanFailedpays): AutocleanonceAutoclean;

    hasPaidinvoices(): boolean;
    clearPaidinvoices(): void;
    getPaidinvoices(): AutocleanonceAutocleanPaidinvoices | undefined;
    setPaidinvoices(value?: AutocleanonceAutocleanPaidinvoices): AutocleanonceAutoclean;

    hasExpiredinvoices(): boolean;
    clearExpiredinvoices(): void;
    getExpiredinvoices(): AutocleanonceAutocleanExpiredinvoices | undefined;
    setExpiredinvoices(value?: AutocleanonceAutocleanExpiredinvoices): AutocleanonceAutoclean;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): AutocleanonceAutoclean.AsObject;
    static toObject(includeInstance: boolean, msg: AutocleanonceAutoclean): AutocleanonceAutoclean.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: AutocleanonceAutoclean, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): AutocleanonceAutoclean;
    static deserializeBinaryFromReader(message: AutocleanonceAutoclean, reader: jspb.BinaryReader): AutocleanonceAutoclean;
}

export namespace AutocleanonceAutoclean {
    export type AsObject = {
        succeededforwards?: AutocleanonceAutocleanSucceededforwards.AsObject,
        failedforwards?: AutocleanonceAutocleanFailedforwards.AsObject,
        succeededpays?: AutocleanonceAutocleanSucceededpays.AsObject,
        failedpays?: AutocleanonceAutocleanFailedpays.AsObject,
        paidinvoices?: AutocleanonceAutocleanPaidinvoices.AsObject,
        expiredinvoices?: AutocleanonceAutocleanExpiredinvoices.AsObject,
    }
}

export class AutocleanonceAutocleanSucceededforwards extends jspb.Message { 
    getCleaned(): number;
    setCleaned(value: number): AutocleanonceAutocleanSucceededforwards;
    getUncleaned(): number;
    setUncleaned(value: number): AutocleanonceAutocleanSucceededforwards;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): AutocleanonceAutocleanSucceededforwards.AsObject;
    static toObject(includeInstance: boolean, msg: AutocleanonceAutocleanSucceededforwards): AutocleanonceAutocleanSucceededforwards.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: AutocleanonceAutocleanSucceededforwards, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): AutocleanonceAutocleanSucceededforwards;
    static deserializeBinaryFromReader(message: AutocleanonceAutocleanSucceededforwards, reader: jspb.BinaryReader): AutocleanonceAutocleanSucceededforwards;
}

export namespace AutocleanonceAutocleanSucceededforwards {
    export type AsObject = {
        cleaned: number,
        uncleaned: number,
    }
}

export class AutocleanonceAutocleanFailedforwards extends jspb.Message { 
    getCleaned(): number;
    setCleaned(value: number): AutocleanonceAutocleanFailedforwards;
    getUncleaned(): number;
    setUncleaned(value: number): AutocleanonceAutocleanFailedforwards;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): AutocleanonceAutocleanFailedforwards.AsObject;
    static toObject(includeInstance: boolean, msg: AutocleanonceAutocleanFailedforwards): AutocleanonceAutocleanFailedforwards.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: AutocleanonceAutocleanFailedforwards, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): AutocleanonceAutocleanFailedforwards;
    static deserializeBinaryFromReader(message: AutocleanonceAutocleanFailedforwards, reader: jspb.BinaryReader): AutocleanonceAutocleanFailedforwards;
}

export namespace AutocleanonceAutocleanFailedforwards {
    export type AsObject = {
        cleaned: number,
        uncleaned: number,
    }
}

export class AutocleanonceAutocleanSucceededpays extends jspb.Message { 
    getCleaned(): number;
    setCleaned(value: number): AutocleanonceAutocleanSucceededpays;
    getUncleaned(): number;
    setUncleaned(value: number): AutocleanonceAutocleanSucceededpays;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): AutocleanonceAutocleanSucceededpays.AsObject;
    static toObject(includeInstance: boolean, msg: AutocleanonceAutocleanSucceededpays): AutocleanonceAutocleanSucceededpays.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: AutocleanonceAutocleanSucceededpays, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): AutocleanonceAutocleanSucceededpays;
    static deserializeBinaryFromReader(message: AutocleanonceAutocleanSucceededpays, reader: jspb.BinaryReader): AutocleanonceAutocleanSucceededpays;
}

export namespace AutocleanonceAutocleanSucceededpays {
    export type AsObject = {
        cleaned: number,
        uncleaned: number,
    }
}

export class AutocleanonceAutocleanFailedpays extends jspb.Message { 
    getCleaned(): number;
    setCleaned(value: number): AutocleanonceAutocleanFailedpays;
    getUncleaned(): number;
    setUncleaned(value: number): AutocleanonceAutocleanFailedpays;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): AutocleanonceAutocleanFailedpays.AsObject;
    static toObject(includeInstance: boolean, msg: AutocleanonceAutocleanFailedpays): AutocleanonceAutocleanFailedpays.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: AutocleanonceAutocleanFailedpays, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): AutocleanonceAutocleanFailedpays;
    static deserializeBinaryFromReader(message: AutocleanonceAutocleanFailedpays, reader: jspb.BinaryReader): AutocleanonceAutocleanFailedpays;
}

export namespace AutocleanonceAutocleanFailedpays {
    export type AsObject = {
        cleaned: number,
        uncleaned: number,
    }
}

export class AutocleanonceAutocleanPaidinvoices extends jspb.Message { 
    getCleaned(): number;
    setCleaned(value: number): AutocleanonceAutocleanPaidinvoices;
    getUncleaned(): number;
    setUncleaned(value: number): AutocleanonceAutocleanPaidinvoices;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): AutocleanonceAutocleanPaidinvoices.AsObject;
    static toObject(includeInstance: boolean, msg: AutocleanonceAutocleanPaidinvoices): AutocleanonceAutocleanPaidinvoices.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: AutocleanonceAutocleanPaidinvoices, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): AutocleanonceAutocleanPaidinvoices;
    static deserializeBinaryFromReader(message: AutocleanonceAutocleanPaidinvoices, reader: jspb.BinaryReader): AutocleanonceAutocleanPaidinvoices;
}

export namespace AutocleanonceAutocleanPaidinvoices {
    export type AsObject = {
        cleaned: number,
        uncleaned: number,
    }
}

export class AutocleanonceAutocleanExpiredinvoices extends jspb.Message { 
    getCleaned(): number;
    setCleaned(value: number): AutocleanonceAutocleanExpiredinvoices;
    getUncleaned(): number;
    setUncleaned(value: number): AutocleanonceAutocleanExpiredinvoices;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): AutocleanonceAutocleanExpiredinvoices.AsObject;
    static toObject(includeInstance: boolean, msg: AutocleanonceAutocleanExpiredinvoices): AutocleanonceAutocleanExpiredinvoices.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: AutocleanonceAutocleanExpiredinvoices, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): AutocleanonceAutocleanExpiredinvoices;
    static deserializeBinaryFromReader(message: AutocleanonceAutocleanExpiredinvoices, reader: jspb.BinaryReader): AutocleanonceAutocleanExpiredinvoices;
}

export namespace AutocleanonceAutocleanExpiredinvoices {
    export type AsObject = {
        cleaned: number,
        uncleaned: number,
    }
}

export class AutocleanstatusRequest extends jspb.Message { 

    hasSubsystem(): boolean;
    clearSubsystem(): void;
    getSubsystem(): cln_primitives_pb.AutocleanSubsystem | undefined;
    setSubsystem(value: cln_primitives_pb.AutocleanSubsystem): AutocleanstatusRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): AutocleanstatusRequest.AsObject;
    static toObject(includeInstance: boolean, msg: AutocleanstatusRequest): AutocleanstatusRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: AutocleanstatusRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): AutocleanstatusRequest;
    static deserializeBinaryFromReader(message: AutocleanstatusRequest, reader: jspb.BinaryReader): AutocleanstatusRequest;
}

export namespace AutocleanstatusRequest {
    export type AsObject = {
        subsystem?: cln_primitives_pb.AutocleanSubsystem,
    }
}

export class AutocleanstatusResponse extends jspb.Message { 

    hasAutoclean(): boolean;
    clearAutoclean(): void;
    getAutoclean(): AutocleanstatusAutoclean | undefined;
    setAutoclean(value?: AutocleanstatusAutoclean): AutocleanstatusResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): AutocleanstatusResponse.AsObject;
    static toObject(includeInstance: boolean, msg: AutocleanstatusResponse): AutocleanstatusResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: AutocleanstatusResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): AutocleanstatusResponse;
    static deserializeBinaryFromReader(message: AutocleanstatusResponse, reader: jspb.BinaryReader): AutocleanstatusResponse;
}

export namespace AutocleanstatusResponse {
    export type AsObject = {
        autoclean?: AutocleanstatusAutoclean.AsObject,
    }
}

export class AutocleanstatusAutoclean extends jspb.Message { 

    hasSucceededforwards(): boolean;
    clearSucceededforwards(): void;
    getSucceededforwards(): AutocleanstatusAutocleanSucceededforwards | undefined;
    setSucceededforwards(value?: AutocleanstatusAutocleanSucceededforwards): AutocleanstatusAutoclean;

    hasFailedforwards(): boolean;
    clearFailedforwards(): void;
    getFailedforwards(): AutocleanstatusAutocleanFailedforwards | undefined;
    setFailedforwards(value?: AutocleanstatusAutocleanFailedforwards): AutocleanstatusAutoclean;

    hasSucceededpays(): boolean;
    clearSucceededpays(): void;
    getSucceededpays(): AutocleanstatusAutocleanSucceededpays | undefined;
    setSucceededpays(value?: AutocleanstatusAutocleanSucceededpays): AutocleanstatusAutoclean;

    hasFailedpays(): boolean;
    clearFailedpays(): void;
    getFailedpays(): AutocleanstatusAutocleanFailedpays | undefined;
    setFailedpays(value?: AutocleanstatusAutocleanFailedpays): AutocleanstatusAutoclean;

    hasPaidinvoices(): boolean;
    clearPaidinvoices(): void;
    getPaidinvoices(): AutocleanstatusAutocleanPaidinvoices | undefined;
    setPaidinvoices(value?: AutocleanstatusAutocleanPaidinvoices): AutocleanstatusAutoclean;

    hasExpiredinvoices(): boolean;
    clearExpiredinvoices(): void;
    getExpiredinvoices(): AutocleanstatusAutocleanExpiredinvoices | undefined;
    setExpiredinvoices(value?: AutocleanstatusAutocleanExpiredinvoices): AutocleanstatusAutoclean;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): AutocleanstatusAutoclean.AsObject;
    static toObject(includeInstance: boolean, msg: AutocleanstatusAutoclean): AutocleanstatusAutoclean.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: AutocleanstatusAutoclean, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): AutocleanstatusAutoclean;
    static deserializeBinaryFromReader(message: AutocleanstatusAutoclean, reader: jspb.BinaryReader): AutocleanstatusAutoclean;
}

export namespace AutocleanstatusAutoclean {
    export type AsObject = {
        succeededforwards?: AutocleanstatusAutocleanSucceededforwards.AsObject,
        failedforwards?: AutocleanstatusAutocleanFailedforwards.AsObject,
        succeededpays?: AutocleanstatusAutocleanSucceededpays.AsObject,
        failedpays?: AutocleanstatusAutocleanFailedpays.AsObject,
        paidinvoices?: AutocleanstatusAutocleanPaidinvoices.AsObject,
        expiredinvoices?: AutocleanstatusAutocleanExpiredinvoices.AsObject,
    }
}

export class AutocleanstatusAutocleanSucceededforwards extends jspb.Message { 
    getEnabled(): boolean;
    setEnabled(value: boolean): AutocleanstatusAutocleanSucceededforwards;
    getCleaned(): number;
    setCleaned(value: number): AutocleanstatusAutocleanSucceededforwards;

    hasAge(): boolean;
    clearAge(): void;
    getAge(): number | undefined;
    setAge(value: number): AutocleanstatusAutocleanSucceededforwards;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): AutocleanstatusAutocleanSucceededforwards.AsObject;
    static toObject(includeInstance: boolean, msg: AutocleanstatusAutocleanSucceededforwards): AutocleanstatusAutocleanSucceededforwards.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: AutocleanstatusAutocleanSucceededforwards, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): AutocleanstatusAutocleanSucceededforwards;
    static deserializeBinaryFromReader(message: AutocleanstatusAutocleanSucceededforwards, reader: jspb.BinaryReader): AutocleanstatusAutocleanSucceededforwards;
}

export namespace AutocleanstatusAutocleanSucceededforwards {
    export type AsObject = {
        enabled: boolean,
        cleaned: number,
        age?: number,
    }
}

export class AutocleanstatusAutocleanFailedforwards extends jspb.Message { 
    getEnabled(): boolean;
    setEnabled(value: boolean): AutocleanstatusAutocleanFailedforwards;
    getCleaned(): number;
    setCleaned(value: number): AutocleanstatusAutocleanFailedforwards;

    hasAge(): boolean;
    clearAge(): void;
    getAge(): number | undefined;
    setAge(value: number): AutocleanstatusAutocleanFailedforwards;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): AutocleanstatusAutocleanFailedforwards.AsObject;
    static toObject(includeInstance: boolean, msg: AutocleanstatusAutocleanFailedforwards): AutocleanstatusAutocleanFailedforwards.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: AutocleanstatusAutocleanFailedforwards, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): AutocleanstatusAutocleanFailedforwards;
    static deserializeBinaryFromReader(message: AutocleanstatusAutocleanFailedforwards, reader: jspb.BinaryReader): AutocleanstatusAutocleanFailedforwards;
}

export namespace AutocleanstatusAutocleanFailedforwards {
    export type AsObject = {
        enabled: boolean,
        cleaned: number,
        age?: number,
    }
}

export class AutocleanstatusAutocleanSucceededpays extends jspb.Message { 
    getEnabled(): boolean;
    setEnabled(value: boolean): AutocleanstatusAutocleanSucceededpays;
    getCleaned(): number;
    setCleaned(value: number): AutocleanstatusAutocleanSucceededpays;

    hasAge(): boolean;
    clearAge(): void;
    getAge(): number | undefined;
    setAge(value: number): AutocleanstatusAutocleanSucceededpays;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): AutocleanstatusAutocleanSucceededpays.AsObject;
    static toObject(includeInstance: boolean, msg: AutocleanstatusAutocleanSucceededpays): AutocleanstatusAutocleanSucceededpays.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: AutocleanstatusAutocleanSucceededpays, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): AutocleanstatusAutocleanSucceededpays;
    static deserializeBinaryFromReader(message: AutocleanstatusAutocleanSucceededpays, reader: jspb.BinaryReader): AutocleanstatusAutocleanSucceededpays;
}

export namespace AutocleanstatusAutocleanSucceededpays {
    export type AsObject = {
        enabled: boolean,
        cleaned: number,
        age?: number,
    }
}

export class AutocleanstatusAutocleanFailedpays extends jspb.Message { 
    getEnabled(): boolean;
    setEnabled(value: boolean): AutocleanstatusAutocleanFailedpays;
    getCleaned(): number;
    setCleaned(value: number): AutocleanstatusAutocleanFailedpays;

    hasAge(): boolean;
    clearAge(): void;
    getAge(): number | undefined;
    setAge(value: number): AutocleanstatusAutocleanFailedpays;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): AutocleanstatusAutocleanFailedpays.AsObject;
    static toObject(includeInstance: boolean, msg: AutocleanstatusAutocleanFailedpays): AutocleanstatusAutocleanFailedpays.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: AutocleanstatusAutocleanFailedpays, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): AutocleanstatusAutocleanFailedpays;
    static deserializeBinaryFromReader(message: AutocleanstatusAutocleanFailedpays, reader: jspb.BinaryReader): AutocleanstatusAutocleanFailedpays;
}

export namespace AutocleanstatusAutocleanFailedpays {
    export type AsObject = {
        enabled: boolean,
        cleaned: number,
        age?: number,
    }
}

export class AutocleanstatusAutocleanPaidinvoices extends jspb.Message { 
    getEnabled(): boolean;
    setEnabled(value: boolean): AutocleanstatusAutocleanPaidinvoices;
    getCleaned(): number;
    setCleaned(value: number): AutocleanstatusAutocleanPaidinvoices;

    hasAge(): boolean;
    clearAge(): void;
    getAge(): number | undefined;
    setAge(value: number): AutocleanstatusAutocleanPaidinvoices;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): AutocleanstatusAutocleanPaidinvoices.AsObject;
    static toObject(includeInstance: boolean, msg: AutocleanstatusAutocleanPaidinvoices): AutocleanstatusAutocleanPaidinvoices.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: AutocleanstatusAutocleanPaidinvoices, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): AutocleanstatusAutocleanPaidinvoices;
    static deserializeBinaryFromReader(message: AutocleanstatusAutocleanPaidinvoices, reader: jspb.BinaryReader): AutocleanstatusAutocleanPaidinvoices;
}

export namespace AutocleanstatusAutocleanPaidinvoices {
    export type AsObject = {
        enabled: boolean,
        cleaned: number,
        age?: number,
    }
}

export class AutocleanstatusAutocleanExpiredinvoices extends jspb.Message { 
    getEnabled(): boolean;
    setEnabled(value: boolean): AutocleanstatusAutocleanExpiredinvoices;
    getCleaned(): number;
    setCleaned(value: number): AutocleanstatusAutocleanExpiredinvoices;

    hasAge(): boolean;
    clearAge(): void;
    getAge(): number | undefined;
    setAge(value: number): AutocleanstatusAutocleanExpiredinvoices;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): AutocleanstatusAutocleanExpiredinvoices.AsObject;
    static toObject(includeInstance: boolean, msg: AutocleanstatusAutocleanExpiredinvoices): AutocleanstatusAutocleanExpiredinvoices.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: AutocleanstatusAutocleanExpiredinvoices, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): AutocleanstatusAutocleanExpiredinvoices;
    static deserializeBinaryFromReader(message: AutocleanstatusAutocleanExpiredinvoices, reader: jspb.BinaryReader): AutocleanstatusAutocleanExpiredinvoices;
}

export namespace AutocleanstatusAutocleanExpiredinvoices {
    export type AsObject = {
        enabled: boolean,
        cleaned: number,
        age?: number,
    }
}

export class CheckmessageRequest extends jspb.Message { 
    getMessage(): string;
    setMessage(value: string): CheckmessageRequest;
    getZbase(): string;
    setZbase(value: string): CheckmessageRequest;

    hasPubkey(): boolean;
    clearPubkey(): void;
    getPubkey(): Uint8Array | string;
    getPubkey_asU8(): Uint8Array;
    getPubkey_asB64(): string;
    setPubkey(value: Uint8Array | string): CheckmessageRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): CheckmessageRequest.AsObject;
    static toObject(includeInstance: boolean, msg: CheckmessageRequest): CheckmessageRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: CheckmessageRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): CheckmessageRequest;
    static deserializeBinaryFromReader(message: CheckmessageRequest, reader: jspb.BinaryReader): CheckmessageRequest;
}

export namespace CheckmessageRequest {
    export type AsObject = {
        message: string,
        zbase: string,
        pubkey: Uint8Array | string,
    }
}

export class CheckmessageResponse extends jspb.Message { 
    getVerified(): boolean;
    setVerified(value: boolean): CheckmessageResponse;
    getPubkey(): Uint8Array | string;
    getPubkey_asU8(): Uint8Array;
    getPubkey_asB64(): string;
    setPubkey(value: Uint8Array | string): CheckmessageResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): CheckmessageResponse.AsObject;
    static toObject(includeInstance: boolean, msg: CheckmessageResponse): CheckmessageResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: CheckmessageResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): CheckmessageResponse;
    static deserializeBinaryFromReader(message: CheckmessageResponse, reader: jspb.BinaryReader): CheckmessageResponse;
}

export namespace CheckmessageResponse {
    export type AsObject = {
        verified: boolean,
        pubkey: Uint8Array | string,
    }
}

export class CloseRequest extends jspb.Message { 
    getId(): string;
    setId(value: string): CloseRequest;

    hasUnilateraltimeout(): boolean;
    clearUnilateraltimeout(): void;
    getUnilateraltimeout(): number | undefined;
    setUnilateraltimeout(value: number): CloseRequest;

    hasDestination(): boolean;
    clearDestination(): void;
    getDestination(): string | undefined;
    setDestination(value: string): CloseRequest;

    hasFeeNegotiationStep(): boolean;
    clearFeeNegotiationStep(): void;
    getFeeNegotiationStep(): string | undefined;
    setFeeNegotiationStep(value: string): CloseRequest;

    hasWrongFunding(): boolean;
    clearWrongFunding(): void;
    getWrongFunding(): cln_primitives_pb.Outpoint | undefined;
    setWrongFunding(value?: cln_primitives_pb.Outpoint): CloseRequest;

    hasForceLeaseClosed(): boolean;
    clearForceLeaseClosed(): void;
    getForceLeaseClosed(): boolean | undefined;
    setForceLeaseClosed(value: boolean): CloseRequest;
    clearFeerangeList(): void;
    getFeerangeList(): Array<cln_primitives_pb.Feerate>;
    setFeerangeList(value: Array<cln_primitives_pb.Feerate>): CloseRequest;
    addFeerange(value?: cln_primitives_pb.Feerate, index?: number): cln_primitives_pb.Feerate;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): CloseRequest.AsObject;
    static toObject(includeInstance: boolean, msg: CloseRequest): CloseRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: CloseRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): CloseRequest;
    static deserializeBinaryFromReader(message: CloseRequest, reader: jspb.BinaryReader): CloseRequest;
}

export namespace CloseRequest {
    export type AsObject = {
        id: string,
        unilateraltimeout?: number,
        destination?: string,
        feeNegotiationStep?: string,
        wrongFunding?: cln_primitives_pb.Outpoint.AsObject,
        forceLeaseClosed?: boolean,
        feerangeList: Array<cln_primitives_pb.Feerate.AsObject>,
    }
}

export class CloseResponse extends jspb.Message { 
    getItemType(): CloseResponse.CloseType;
    setItemType(value: CloseResponse.CloseType): CloseResponse;

    hasTx(): boolean;
    clearTx(): void;
    getTx(): Uint8Array | string;
    getTx_asU8(): Uint8Array;
    getTx_asB64(): string;
    setTx(value: Uint8Array | string): CloseResponse;

    hasTxid(): boolean;
    clearTxid(): void;
    getTxid(): Uint8Array | string;
    getTxid_asU8(): Uint8Array;
    getTxid_asB64(): string;
    setTxid(value: Uint8Array | string): CloseResponse;
    clearTxsList(): void;
    getTxsList(): Array<Uint8Array | string>;
    getTxsList_asU8(): Array<Uint8Array>;
    getTxsList_asB64(): Array<string>;
    setTxsList(value: Array<Uint8Array | string>): CloseResponse;
    addTxs(value: Uint8Array | string, index?: number): Uint8Array | string;
    clearTxidsList(): void;
    getTxidsList(): Array<Uint8Array | string>;
    getTxidsList_asU8(): Array<Uint8Array>;
    getTxidsList_asB64(): Array<string>;
    setTxidsList(value: Array<Uint8Array | string>): CloseResponse;
    addTxids(value: Uint8Array | string, index?: number): Uint8Array | string;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): CloseResponse.AsObject;
    static toObject(includeInstance: boolean, msg: CloseResponse): CloseResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: CloseResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): CloseResponse;
    static deserializeBinaryFromReader(message: CloseResponse, reader: jspb.BinaryReader): CloseResponse;
}

export namespace CloseResponse {
    export type AsObject = {
        itemType: CloseResponse.CloseType,
        tx: Uint8Array | string,
        txid: Uint8Array | string,
        txsList: Array<Uint8Array | string>,
        txidsList: Array<Uint8Array | string>,
    }

    export enum CloseType {
    MUTUAL = 0,
    UNILATERAL = 1,
    UNOPENED = 2,
    }

}

export class ConnectRequest extends jspb.Message { 
    getId(): string;
    setId(value: string): ConnectRequest;

    hasHost(): boolean;
    clearHost(): void;
    getHost(): string | undefined;
    setHost(value: string): ConnectRequest;

    hasPort(): boolean;
    clearPort(): void;
    getPort(): number | undefined;
    setPort(value: number): ConnectRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ConnectRequest.AsObject;
    static toObject(includeInstance: boolean, msg: ConnectRequest): ConnectRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ConnectRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ConnectRequest;
    static deserializeBinaryFromReader(message: ConnectRequest, reader: jspb.BinaryReader): ConnectRequest;
}

export namespace ConnectRequest {
    export type AsObject = {
        id: string,
        host?: string,
        port?: number,
    }
}

export class ConnectResponse extends jspb.Message { 
    getId(): Uint8Array | string;
    getId_asU8(): Uint8Array;
    getId_asB64(): string;
    setId(value: Uint8Array | string): ConnectResponse;
    getFeatures(): Uint8Array | string;
    getFeatures_asU8(): Uint8Array;
    getFeatures_asB64(): string;
    setFeatures(value: Uint8Array | string): ConnectResponse;
    getDirection(): ConnectResponse.ConnectDirection;
    setDirection(value: ConnectResponse.ConnectDirection): ConnectResponse;

    hasAddress(): boolean;
    clearAddress(): void;
    getAddress(): ConnectAddress | undefined;
    setAddress(value?: ConnectAddress): ConnectResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ConnectResponse.AsObject;
    static toObject(includeInstance: boolean, msg: ConnectResponse): ConnectResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ConnectResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ConnectResponse;
    static deserializeBinaryFromReader(message: ConnectResponse, reader: jspb.BinaryReader): ConnectResponse;
}

export namespace ConnectResponse {
    export type AsObject = {
        id: Uint8Array | string,
        features: Uint8Array | string,
        direction: ConnectResponse.ConnectDirection,
        address?: ConnectAddress.AsObject,
    }

    export enum ConnectDirection {
    IN = 0,
    OUT = 1,
    }

}

export class ConnectAddress extends jspb.Message { 
    getItemType(): ConnectAddress.ConnectAddressType;
    setItemType(value: ConnectAddress.ConnectAddressType): ConnectAddress;

    hasSocket(): boolean;
    clearSocket(): void;
    getSocket(): string | undefined;
    setSocket(value: string): ConnectAddress;

    hasAddress(): boolean;
    clearAddress(): void;
    getAddress(): string | undefined;
    setAddress(value: string): ConnectAddress;

    hasPort(): boolean;
    clearPort(): void;
    getPort(): number | undefined;
    setPort(value: number): ConnectAddress;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ConnectAddress.AsObject;
    static toObject(includeInstance: boolean, msg: ConnectAddress): ConnectAddress.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ConnectAddress, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ConnectAddress;
    static deserializeBinaryFromReader(message: ConnectAddress, reader: jspb.BinaryReader): ConnectAddress;
}

export namespace ConnectAddress {
    export type AsObject = {
        itemType: ConnectAddress.ConnectAddressType,
        socket?: string,
        address?: string,
        port?: number,
    }

    export enum ConnectAddressType {
    LOCAL_SOCKET = 0,
    IPV4 = 1,
    IPV6 = 2,
    TORV2 = 3,
    TORV3 = 4,
    }

}

export class CreateinvoiceRequest extends jspb.Message { 
    getInvstring(): string;
    setInvstring(value: string): CreateinvoiceRequest;
    getLabel(): string;
    setLabel(value: string): CreateinvoiceRequest;
    getPreimage(): Uint8Array | string;
    getPreimage_asU8(): Uint8Array;
    getPreimage_asB64(): string;
    setPreimage(value: Uint8Array | string): CreateinvoiceRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): CreateinvoiceRequest.AsObject;
    static toObject(includeInstance: boolean, msg: CreateinvoiceRequest): CreateinvoiceRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: CreateinvoiceRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): CreateinvoiceRequest;
    static deserializeBinaryFromReader(message: CreateinvoiceRequest, reader: jspb.BinaryReader): CreateinvoiceRequest;
}

export namespace CreateinvoiceRequest {
    export type AsObject = {
        invstring: string,
        label: string,
        preimage: Uint8Array | string,
    }
}

export class CreateinvoiceResponse extends jspb.Message { 
    getLabel(): string;
    setLabel(value: string): CreateinvoiceResponse;

    hasBolt11(): boolean;
    clearBolt11(): void;
    getBolt11(): string | undefined;
    setBolt11(value: string): CreateinvoiceResponse;

    hasBolt12(): boolean;
    clearBolt12(): void;
    getBolt12(): string | undefined;
    setBolt12(value: string): CreateinvoiceResponse;
    getPaymentHash(): Uint8Array | string;
    getPaymentHash_asU8(): Uint8Array;
    getPaymentHash_asB64(): string;
    setPaymentHash(value: Uint8Array | string): CreateinvoiceResponse;

    hasAmountMsat(): boolean;
    clearAmountMsat(): void;
    getAmountMsat(): cln_primitives_pb.Amount | undefined;
    setAmountMsat(value?: cln_primitives_pb.Amount): CreateinvoiceResponse;
    getStatus(): CreateinvoiceResponse.CreateinvoiceStatus;
    setStatus(value: CreateinvoiceResponse.CreateinvoiceStatus): CreateinvoiceResponse;
    getDescription(): string;
    setDescription(value: string): CreateinvoiceResponse;
    getExpiresAt(): number;
    setExpiresAt(value: number): CreateinvoiceResponse;

    hasPayIndex(): boolean;
    clearPayIndex(): void;
    getPayIndex(): number | undefined;
    setPayIndex(value: number): CreateinvoiceResponse;

    hasAmountReceivedMsat(): boolean;
    clearAmountReceivedMsat(): void;
    getAmountReceivedMsat(): cln_primitives_pb.Amount | undefined;
    setAmountReceivedMsat(value?: cln_primitives_pb.Amount): CreateinvoiceResponse;

    hasPaidAt(): boolean;
    clearPaidAt(): void;
    getPaidAt(): number | undefined;
    setPaidAt(value: number): CreateinvoiceResponse;

    hasPaymentPreimage(): boolean;
    clearPaymentPreimage(): void;
    getPaymentPreimage(): Uint8Array | string;
    getPaymentPreimage_asU8(): Uint8Array;
    getPaymentPreimage_asB64(): string;
    setPaymentPreimage(value: Uint8Array | string): CreateinvoiceResponse;

    hasLocalOfferId(): boolean;
    clearLocalOfferId(): void;
    getLocalOfferId(): Uint8Array | string;
    getLocalOfferId_asU8(): Uint8Array;
    getLocalOfferId_asB64(): string;
    setLocalOfferId(value: Uint8Array | string): CreateinvoiceResponse;

    hasInvreqPayerNote(): boolean;
    clearInvreqPayerNote(): void;
    getInvreqPayerNote(): string | undefined;
    setInvreqPayerNote(value: string): CreateinvoiceResponse;

    hasCreatedIndex(): boolean;
    clearCreatedIndex(): void;
    getCreatedIndex(): number | undefined;
    setCreatedIndex(value: number): CreateinvoiceResponse;

    hasPaidOutpoint(): boolean;
    clearPaidOutpoint(): void;
    getPaidOutpoint(): CreateinvoicePaid_outpoint | undefined;
    setPaidOutpoint(value?: CreateinvoicePaid_outpoint): CreateinvoiceResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): CreateinvoiceResponse.AsObject;
    static toObject(includeInstance: boolean, msg: CreateinvoiceResponse): CreateinvoiceResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: CreateinvoiceResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): CreateinvoiceResponse;
    static deserializeBinaryFromReader(message: CreateinvoiceResponse, reader: jspb.BinaryReader): CreateinvoiceResponse;
}

export namespace CreateinvoiceResponse {
    export type AsObject = {
        label: string,
        bolt11?: string,
        bolt12?: string,
        paymentHash: Uint8Array | string,
        amountMsat?: cln_primitives_pb.Amount.AsObject,
        status: CreateinvoiceResponse.CreateinvoiceStatus,
        description: string,
        expiresAt: number,
        payIndex?: number,
        amountReceivedMsat?: cln_primitives_pb.Amount.AsObject,
        paidAt?: number,
        paymentPreimage: Uint8Array | string,
        localOfferId: Uint8Array | string,
        invreqPayerNote?: string,
        createdIndex?: number,
        paidOutpoint?: CreateinvoicePaid_outpoint.AsObject,
    }

    export enum CreateinvoiceStatus {
    PAID = 0,
    EXPIRED = 1,
    UNPAID = 2,
    }

}

export class CreateinvoicePaid_outpoint extends jspb.Message { 
    getTxid(): Uint8Array | string;
    getTxid_asU8(): Uint8Array;
    getTxid_asB64(): string;
    setTxid(value: Uint8Array | string): CreateinvoicePaid_outpoint;
    getOutnum(): number;
    setOutnum(value: number): CreateinvoicePaid_outpoint;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): CreateinvoicePaid_outpoint.AsObject;
    static toObject(includeInstance: boolean, msg: CreateinvoicePaid_outpoint): CreateinvoicePaid_outpoint.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: CreateinvoicePaid_outpoint, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): CreateinvoicePaid_outpoint;
    static deserializeBinaryFromReader(message: CreateinvoicePaid_outpoint, reader: jspb.BinaryReader): CreateinvoicePaid_outpoint;
}

export namespace CreateinvoicePaid_outpoint {
    export type AsObject = {
        txid: Uint8Array | string,
        outnum: number,
    }
}

export class DatastoreRequest extends jspb.Message { 

    hasHex(): boolean;
    clearHex(): void;
    getHex(): Uint8Array | string;
    getHex_asU8(): Uint8Array;
    getHex_asB64(): string;
    setHex(value: Uint8Array | string): DatastoreRequest;

    hasMode(): boolean;
    clearMode(): void;
    getMode(): DatastoreRequest.DatastoreMode | undefined;
    setMode(value: DatastoreRequest.DatastoreMode): DatastoreRequest;

    hasGeneration(): boolean;
    clearGeneration(): void;
    getGeneration(): number | undefined;
    setGeneration(value: number): DatastoreRequest;
    clearKeyList(): void;
    getKeyList(): Array<string>;
    setKeyList(value: Array<string>): DatastoreRequest;
    addKey(value: string, index?: number): string;

    hasString(): boolean;
    clearString(): void;
    getString(): string | undefined;
    setString(value: string): DatastoreRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): DatastoreRequest.AsObject;
    static toObject(includeInstance: boolean, msg: DatastoreRequest): DatastoreRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: DatastoreRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): DatastoreRequest;
    static deserializeBinaryFromReader(message: DatastoreRequest, reader: jspb.BinaryReader): DatastoreRequest;
}

export namespace DatastoreRequest {
    export type AsObject = {
        hex: Uint8Array | string,
        mode?: DatastoreRequest.DatastoreMode,
        generation?: number,
        keyList: Array<string>,
        string?: string,
    }

    export enum DatastoreMode {
    MUST_CREATE = 0,
    MUST_REPLACE = 1,
    CREATE_OR_REPLACE = 2,
    MUST_APPEND = 3,
    CREATE_OR_APPEND = 4,
    }

}

export class DatastoreResponse extends jspb.Message { 

    hasGeneration(): boolean;
    clearGeneration(): void;
    getGeneration(): number | undefined;
    setGeneration(value: number): DatastoreResponse;

    hasHex(): boolean;
    clearHex(): void;
    getHex(): Uint8Array | string;
    getHex_asU8(): Uint8Array;
    getHex_asB64(): string;
    setHex(value: Uint8Array | string): DatastoreResponse;

    hasString(): boolean;
    clearString(): void;
    getString(): string | undefined;
    setString(value: string): DatastoreResponse;
    clearKeyList(): void;
    getKeyList(): Array<string>;
    setKeyList(value: Array<string>): DatastoreResponse;
    addKey(value: string, index?: number): string;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): DatastoreResponse.AsObject;
    static toObject(includeInstance: boolean, msg: DatastoreResponse): DatastoreResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: DatastoreResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): DatastoreResponse;
    static deserializeBinaryFromReader(message: DatastoreResponse, reader: jspb.BinaryReader): DatastoreResponse;
}

export namespace DatastoreResponse {
    export type AsObject = {
        generation?: number,
        hex: Uint8Array | string,
        string?: string,
        keyList: Array<string>,
    }
}

export class DatastoreusageRequest extends jspb.Message { 
    clearKeyList(): void;
    getKeyList(): Array<string>;
    setKeyList(value: Array<string>): DatastoreusageRequest;
    addKey(value: string, index?: number): string;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): DatastoreusageRequest.AsObject;
    static toObject(includeInstance: boolean, msg: DatastoreusageRequest): DatastoreusageRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: DatastoreusageRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): DatastoreusageRequest;
    static deserializeBinaryFromReader(message: DatastoreusageRequest, reader: jspb.BinaryReader): DatastoreusageRequest;
}

export namespace DatastoreusageRequest {
    export type AsObject = {
        keyList: Array<string>,
    }
}

export class DatastoreusageResponse extends jspb.Message { 

    hasDatastoreusage(): boolean;
    clearDatastoreusage(): void;
    getDatastoreusage(): DatastoreusageDatastoreusage | undefined;
    setDatastoreusage(value?: DatastoreusageDatastoreusage): DatastoreusageResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): DatastoreusageResponse.AsObject;
    static toObject(includeInstance: boolean, msg: DatastoreusageResponse): DatastoreusageResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: DatastoreusageResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): DatastoreusageResponse;
    static deserializeBinaryFromReader(message: DatastoreusageResponse, reader: jspb.BinaryReader): DatastoreusageResponse;
}

export namespace DatastoreusageResponse {
    export type AsObject = {
        datastoreusage?: DatastoreusageDatastoreusage.AsObject,
    }
}

export class DatastoreusageDatastoreusage extends jspb.Message { 
    getKey(): string;
    setKey(value: string): DatastoreusageDatastoreusage;
    getTotalBytes(): number;
    setTotalBytes(value: number): DatastoreusageDatastoreusage;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): DatastoreusageDatastoreusage.AsObject;
    static toObject(includeInstance: boolean, msg: DatastoreusageDatastoreusage): DatastoreusageDatastoreusage.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: DatastoreusageDatastoreusage, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): DatastoreusageDatastoreusage;
    static deserializeBinaryFromReader(message: DatastoreusageDatastoreusage, reader: jspb.BinaryReader): DatastoreusageDatastoreusage;
}

export namespace DatastoreusageDatastoreusage {
    export type AsObject = {
        key: string,
        totalBytes: number,
    }
}

export class CreateonionRequest extends jspb.Message { 
    clearHopsList(): void;
    getHopsList(): Array<CreateonionHops>;
    setHopsList(value: Array<CreateonionHops>): CreateonionRequest;
    addHops(value?: CreateonionHops, index?: number): CreateonionHops;
    getAssocdata(): Uint8Array | string;
    getAssocdata_asU8(): Uint8Array;
    getAssocdata_asB64(): string;
    setAssocdata(value: Uint8Array | string): CreateonionRequest;

    hasSessionKey(): boolean;
    clearSessionKey(): void;
    getSessionKey(): Uint8Array | string;
    getSessionKey_asU8(): Uint8Array;
    getSessionKey_asB64(): string;
    setSessionKey(value: Uint8Array | string): CreateonionRequest;

    hasOnionSize(): boolean;
    clearOnionSize(): void;
    getOnionSize(): number | undefined;
    setOnionSize(value: number): CreateonionRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): CreateonionRequest.AsObject;
    static toObject(includeInstance: boolean, msg: CreateonionRequest): CreateonionRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: CreateonionRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): CreateonionRequest;
    static deserializeBinaryFromReader(message: CreateonionRequest, reader: jspb.BinaryReader): CreateonionRequest;
}

export namespace CreateonionRequest {
    export type AsObject = {
        hopsList: Array<CreateonionHops.AsObject>,
        assocdata: Uint8Array | string,
        sessionKey: Uint8Array | string,
        onionSize?: number,
    }
}

export class CreateonionResponse extends jspb.Message { 
    getOnion(): Uint8Array | string;
    getOnion_asU8(): Uint8Array;
    getOnion_asB64(): string;
    setOnion(value: Uint8Array | string): CreateonionResponse;
    clearSharedSecretsList(): void;
    getSharedSecretsList(): Array<Uint8Array | string>;
    getSharedSecretsList_asU8(): Array<Uint8Array>;
    getSharedSecretsList_asB64(): Array<string>;
    setSharedSecretsList(value: Array<Uint8Array | string>): CreateonionResponse;
    addSharedSecrets(value: Uint8Array | string, index?: number): Uint8Array | string;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): CreateonionResponse.AsObject;
    static toObject(includeInstance: boolean, msg: CreateonionResponse): CreateonionResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: CreateonionResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): CreateonionResponse;
    static deserializeBinaryFromReader(message: CreateonionResponse, reader: jspb.BinaryReader): CreateonionResponse;
}

export namespace CreateonionResponse {
    export type AsObject = {
        onion: Uint8Array | string,
        sharedSecretsList: Array<Uint8Array | string>,
    }
}

export class CreateonionHops extends jspb.Message { 
    getPubkey(): Uint8Array | string;
    getPubkey_asU8(): Uint8Array;
    getPubkey_asB64(): string;
    setPubkey(value: Uint8Array | string): CreateonionHops;
    getPayload(): Uint8Array | string;
    getPayload_asU8(): Uint8Array;
    getPayload_asB64(): string;
    setPayload(value: Uint8Array | string): CreateonionHops;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): CreateonionHops.AsObject;
    static toObject(includeInstance: boolean, msg: CreateonionHops): CreateonionHops.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: CreateonionHops, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): CreateonionHops;
    static deserializeBinaryFromReader(message: CreateonionHops, reader: jspb.BinaryReader): CreateonionHops;
}

export namespace CreateonionHops {
    export type AsObject = {
        pubkey: Uint8Array | string,
        payload: Uint8Array | string,
    }
}

export class DeldatastoreRequest extends jspb.Message { 

    hasGeneration(): boolean;
    clearGeneration(): void;
    getGeneration(): number | undefined;
    setGeneration(value: number): DeldatastoreRequest;
    clearKeyList(): void;
    getKeyList(): Array<string>;
    setKeyList(value: Array<string>): DeldatastoreRequest;
    addKey(value: string, index?: number): string;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): DeldatastoreRequest.AsObject;
    static toObject(includeInstance: boolean, msg: DeldatastoreRequest): DeldatastoreRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: DeldatastoreRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): DeldatastoreRequest;
    static deserializeBinaryFromReader(message: DeldatastoreRequest, reader: jspb.BinaryReader): DeldatastoreRequest;
}

export namespace DeldatastoreRequest {
    export type AsObject = {
        generation?: number,
        keyList: Array<string>,
    }
}

export class DeldatastoreResponse extends jspb.Message { 

    hasGeneration(): boolean;
    clearGeneration(): void;
    getGeneration(): number | undefined;
    setGeneration(value: number): DeldatastoreResponse;

    hasHex(): boolean;
    clearHex(): void;
    getHex(): Uint8Array | string;
    getHex_asU8(): Uint8Array;
    getHex_asB64(): string;
    setHex(value: Uint8Array | string): DeldatastoreResponse;

    hasString(): boolean;
    clearString(): void;
    getString(): string | undefined;
    setString(value: string): DeldatastoreResponse;
    clearKeyList(): void;
    getKeyList(): Array<string>;
    setKeyList(value: Array<string>): DeldatastoreResponse;
    addKey(value: string, index?: number): string;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): DeldatastoreResponse.AsObject;
    static toObject(includeInstance: boolean, msg: DeldatastoreResponse): DeldatastoreResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: DeldatastoreResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): DeldatastoreResponse;
    static deserializeBinaryFromReader(message: DeldatastoreResponse, reader: jspb.BinaryReader): DeldatastoreResponse;
}

export namespace DeldatastoreResponse {
    export type AsObject = {
        generation?: number,
        hex: Uint8Array | string,
        string?: string,
        keyList: Array<string>,
    }
}

export class DelinvoiceRequest extends jspb.Message { 
    getLabel(): string;
    setLabel(value: string): DelinvoiceRequest;
    getStatus(): DelinvoiceRequest.DelinvoiceStatus;
    setStatus(value: DelinvoiceRequest.DelinvoiceStatus): DelinvoiceRequest;

    hasDesconly(): boolean;
    clearDesconly(): void;
    getDesconly(): boolean | undefined;
    setDesconly(value: boolean): DelinvoiceRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): DelinvoiceRequest.AsObject;
    static toObject(includeInstance: boolean, msg: DelinvoiceRequest): DelinvoiceRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: DelinvoiceRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): DelinvoiceRequest;
    static deserializeBinaryFromReader(message: DelinvoiceRequest, reader: jspb.BinaryReader): DelinvoiceRequest;
}

export namespace DelinvoiceRequest {
    export type AsObject = {
        label: string,
        status: DelinvoiceRequest.DelinvoiceStatus,
        desconly?: boolean,
    }

    export enum DelinvoiceStatus {
    PAID = 0,
    EXPIRED = 1,
    UNPAID = 2,
    }

}

export class DelinvoiceResponse extends jspb.Message { 
    getLabel(): string;
    setLabel(value: string): DelinvoiceResponse;

    hasBolt11(): boolean;
    clearBolt11(): void;
    getBolt11(): string | undefined;
    setBolt11(value: string): DelinvoiceResponse;

    hasBolt12(): boolean;
    clearBolt12(): void;
    getBolt12(): string | undefined;
    setBolt12(value: string): DelinvoiceResponse;

    hasAmountMsat(): boolean;
    clearAmountMsat(): void;
    getAmountMsat(): cln_primitives_pb.Amount | undefined;
    setAmountMsat(value?: cln_primitives_pb.Amount): DelinvoiceResponse;

    hasDescription(): boolean;
    clearDescription(): void;
    getDescription(): string | undefined;
    setDescription(value: string): DelinvoiceResponse;
    getPaymentHash(): Uint8Array | string;
    getPaymentHash_asU8(): Uint8Array;
    getPaymentHash_asB64(): string;
    setPaymentHash(value: Uint8Array | string): DelinvoiceResponse;
    getStatus(): DelinvoiceResponse.DelinvoiceStatus;
    setStatus(value: DelinvoiceResponse.DelinvoiceStatus): DelinvoiceResponse;
    getExpiresAt(): number;
    setExpiresAt(value: number): DelinvoiceResponse;

    hasLocalOfferId(): boolean;
    clearLocalOfferId(): void;
    getLocalOfferId(): Uint8Array | string;
    getLocalOfferId_asU8(): Uint8Array;
    getLocalOfferId_asB64(): string;
    setLocalOfferId(value: Uint8Array | string): DelinvoiceResponse;

    hasInvreqPayerNote(): boolean;
    clearInvreqPayerNote(): void;
    getInvreqPayerNote(): string | undefined;
    setInvreqPayerNote(value: string): DelinvoiceResponse;

    hasCreatedIndex(): boolean;
    clearCreatedIndex(): void;
    getCreatedIndex(): number | undefined;
    setCreatedIndex(value: number): DelinvoiceResponse;

    hasUpdatedIndex(): boolean;
    clearUpdatedIndex(): void;
    getUpdatedIndex(): number | undefined;
    setUpdatedIndex(value: number): DelinvoiceResponse;

    hasPayIndex(): boolean;
    clearPayIndex(): void;
    getPayIndex(): number | undefined;
    setPayIndex(value: number): DelinvoiceResponse;

    hasAmountReceivedMsat(): boolean;
    clearAmountReceivedMsat(): void;
    getAmountReceivedMsat(): cln_primitives_pb.Amount | undefined;
    setAmountReceivedMsat(value?: cln_primitives_pb.Amount): DelinvoiceResponse;

    hasPaidAt(): boolean;
    clearPaidAt(): void;
    getPaidAt(): number | undefined;
    setPaidAt(value: number): DelinvoiceResponse;

    hasPaymentPreimage(): boolean;
    clearPaymentPreimage(): void;
    getPaymentPreimage(): Uint8Array | string;
    getPaymentPreimage_asU8(): Uint8Array;
    getPaymentPreimage_asB64(): string;
    setPaymentPreimage(value: Uint8Array | string): DelinvoiceResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): DelinvoiceResponse.AsObject;
    static toObject(includeInstance: boolean, msg: DelinvoiceResponse): DelinvoiceResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: DelinvoiceResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): DelinvoiceResponse;
    static deserializeBinaryFromReader(message: DelinvoiceResponse, reader: jspb.BinaryReader): DelinvoiceResponse;
}

export namespace DelinvoiceResponse {
    export type AsObject = {
        label: string,
        bolt11?: string,
        bolt12?: string,
        amountMsat?: cln_primitives_pb.Amount.AsObject,
        description?: string,
        paymentHash: Uint8Array | string,
        status: DelinvoiceResponse.DelinvoiceStatus,
        expiresAt: number,
        localOfferId: Uint8Array | string,
        invreqPayerNote?: string,
        createdIndex?: number,
        updatedIndex?: number,
        payIndex?: number,
        amountReceivedMsat?: cln_primitives_pb.Amount.AsObject,
        paidAt?: number,
        paymentPreimage: Uint8Array | string,
    }

    export enum DelinvoiceStatus {
    PAID = 0,
    EXPIRED = 1,
    UNPAID = 2,
    }

}

export class DevforgetchannelRequest extends jspb.Message { 
    getId(): Uint8Array | string;
    getId_asU8(): Uint8Array;
    getId_asB64(): string;
    setId(value: Uint8Array | string): DevforgetchannelRequest;

    hasShortChannelId(): boolean;
    clearShortChannelId(): void;
    getShortChannelId(): string | undefined;
    setShortChannelId(value: string): DevforgetchannelRequest;

    hasChannelId(): boolean;
    clearChannelId(): void;
    getChannelId(): Uint8Array | string;
    getChannelId_asU8(): Uint8Array;
    getChannelId_asB64(): string;
    setChannelId(value: Uint8Array | string): DevforgetchannelRequest;

    hasForce(): boolean;
    clearForce(): void;
    getForce(): boolean | undefined;
    setForce(value: boolean): DevforgetchannelRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): DevforgetchannelRequest.AsObject;
    static toObject(includeInstance: boolean, msg: DevforgetchannelRequest): DevforgetchannelRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: DevforgetchannelRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): DevforgetchannelRequest;
    static deserializeBinaryFromReader(message: DevforgetchannelRequest, reader: jspb.BinaryReader): DevforgetchannelRequest;
}

export namespace DevforgetchannelRequest {
    export type AsObject = {
        id: Uint8Array | string,
        shortChannelId?: string,
        channelId: Uint8Array | string,
        force?: boolean,
    }
}

export class DevforgetchannelResponse extends jspb.Message { 
    getForced(): boolean;
    setForced(value: boolean): DevforgetchannelResponse;
    getFundingUnspent(): boolean;
    setFundingUnspent(value: boolean): DevforgetchannelResponse;
    getFundingTxid(): Uint8Array | string;
    getFundingTxid_asU8(): Uint8Array;
    getFundingTxid_asB64(): string;
    setFundingTxid(value: Uint8Array | string): DevforgetchannelResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): DevforgetchannelResponse.AsObject;
    static toObject(includeInstance: boolean, msg: DevforgetchannelResponse): DevforgetchannelResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: DevforgetchannelResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): DevforgetchannelResponse;
    static deserializeBinaryFromReader(message: DevforgetchannelResponse, reader: jspb.BinaryReader): DevforgetchannelResponse;
}

export namespace DevforgetchannelResponse {
    export type AsObject = {
        forced: boolean,
        fundingUnspent: boolean,
        fundingTxid: Uint8Array | string,
    }
}

export class EmergencyrecoverRequest extends jspb.Message { 

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): EmergencyrecoverRequest.AsObject;
    static toObject(includeInstance: boolean, msg: EmergencyrecoverRequest): EmergencyrecoverRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: EmergencyrecoverRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): EmergencyrecoverRequest;
    static deserializeBinaryFromReader(message: EmergencyrecoverRequest, reader: jspb.BinaryReader): EmergencyrecoverRequest;
}

export namespace EmergencyrecoverRequest {
    export type AsObject = {
    }
}

export class EmergencyrecoverResponse extends jspb.Message { 
    clearStubsList(): void;
    getStubsList(): Array<Uint8Array | string>;
    getStubsList_asU8(): Array<Uint8Array>;
    getStubsList_asB64(): Array<string>;
    setStubsList(value: Array<Uint8Array | string>): EmergencyrecoverResponse;
    addStubs(value: Uint8Array | string, index?: number): Uint8Array | string;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): EmergencyrecoverResponse.AsObject;
    static toObject(includeInstance: boolean, msg: EmergencyrecoverResponse): EmergencyrecoverResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: EmergencyrecoverResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): EmergencyrecoverResponse;
    static deserializeBinaryFromReader(message: EmergencyrecoverResponse, reader: jspb.BinaryReader): EmergencyrecoverResponse;
}

export namespace EmergencyrecoverResponse {
    export type AsObject = {
        stubsList: Array<Uint8Array | string>,
    }
}

export class GetemergencyrecoverdataRequest extends jspb.Message { 

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): GetemergencyrecoverdataRequest.AsObject;
    static toObject(includeInstance: boolean, msg: GetemergencyrecoverdataRequest): GetemergencyrecoverdataRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: GetemergencyrecoverdataRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): GetemergencyrecoverdataRequest;
    static deserializeBinaryFromReader(message: GetemergencyrecoverdataRequest, reader: jspb.BinaryReader): GetemergencyrecoverdataRequest;
}

export namespace GetemergencyrecoverdataRequest {
    export type AsObject = {
    }
}

export class GetemergencyrecoverdataResponse extends jspb.Message { 
    getFiledata(): Uint8Array | string;
    getFiledata_asU8(): Uint8Array;
    getFiledata_asB64(): string;
    setFiledata(value: Uint8Array | string): GetemergencyrecoverdataResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): GetemergencyrecoverdataResponse.AsObject;
    static toObject(includeInstance: boolean, msg: GetemergencyrecoverdataResponse): GetemergencyrecoverdataResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: GetemergencyrecoverdataResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): GetemergencyrecoverdataResponse;
    static deserializeBinaryFromReader(message: GetemergencyrecoverdataResponse, reader: jspb.BinaryReader): GetemergencyrecoverdataResponse;
}

export namespace GetemergencyrecoverdataResponse {
    export type AsObject = {
        filedata: Uint8Array | string,
    }
}

export class ExposesecretRequest extends jspb.Message { 
    getPassphrase(): string;
    setPassphrase(value: string): ExposesecretRequest;

    hasIdentifier(): boolean;
    clearIdentifier(): void;
    getIdentifier(): string | undefined;
    setIdentifier(value: string): ExposesecretRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ExposesecretRequest.AsObject;
    static toObject(includeInstance: boolean, msg: ExposesecretRequest): ExposesecretRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ExposesecretRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ExposesecretRequest;
    static deserializeBinaryFromReader(message: ExposesecretRequest, reader: jspb.BinaryReader): ExposesecretRequest;
}

export namespace ExposesecretRequest {
    export type AsObject = {
        passphrase: string,
        identifier?: string,
    }
}

export class ExposesecretResponse extends jspb.Message { 
    getIdentifier(): string;
    setIdentifier(value: string): ExposesecretResponse;
    getCodex32(): string;
    setCodex32(value: string): ExposesecretResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ExposesecretResponse.AsObject;
    static toObject(includeInstance: boolean, msg: ExposesecretResponse): ExposesecretResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ExposesecretResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ExposesecretResponse;
    static deserializeBinaryFromReader(message: ExposesecretResponse, reader: jspb.BinaryReader): ExposesecretResponse;
}

export namespace ExposesecretResponse {
    export type AsObject = {
        identifier: string,
        codex32: string,
    }
}

export class RecoverRequest extends jspb.Message { 
    getHsmsecret(): string;
    setHsmsecret(value: string): RecoverRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): RecoverRequest.AsObject;
    static toObject(includeInstance: boolean, msg: RecoverRequest): RecoverRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: RecoverRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): RecoverRequest;
    static deserializeBinaryFromReader(message: RecoverRequest, reader: jspb.BinaryReader): RecoverRequest;
}

export namespace RecoverRequest {
    export type AsObject = {
        hsmsecret: string,
    }
}

export class RecoverResponse extends jspb.Message { 

    hasResult(): boolean;
    clearResult(): void;
    getResult(): RecoverResponse.RecoverResult | undefined;
    setResult(value: RecoverResponse.RecoverResult): RecoverResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): RecoverResponse.AsObject;
    static toObject(includeInstance: boolean, msg: RecoverResponse): RecoverResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: RecoverResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): RecoverResponse;
    static deserializeBinaryFromReader(message: RecoverResponse, reader: jspb.BinaryReader): RecoverResponse;
}

export namespace RecoverResponse {
    export type AsObject = {
        result?: RecoverResponse.RecoverResult,
    }

    export enum RecoverResult {
    RECOVERY_RESTART_IN_PROGRESS = 0,
    }

}

export class RecoverchannelRequest extends jspb.Message { 
    clearScbList(): void;
    getScbList(): Array<Uint8Array | string>;
    getScbList_asU8(): Array<Uint8Array>;
    getScbList_asB64(): Array<string>;
    setScbList(value: Array<Uint8Array | string>): RecoverchannelRequest;
    addScb(value: Uint8Array | string, index?: number): Uint8Array | string;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): RecoverchannelRequest.AsObject;
    static toObject(includeInstance: boolean, msg: RecoverchannelRequest): RecoverchannelRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: RecoverchannelRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): RecoverchannelRequest;
    static deserializeBinaryFromReader(message: RecoverchannelRequest, reader: jspb.BinaryReader): RecoverchannelRequest;
}

export namespace RecoverchannelRequest {
    export type AsObject = {
        scbList: Array<Uint8Array | string>,
    }
}

export class RecoverchannelResponse extends jspb.Message { 
    clearStubsList(): void;
    getStubsList(): Array<string>;
    setStubsList(value: Array<string>): RecoverchannelResponse;
    addStubs(value: string, index?: number): string;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): RecoverchannelResponse.AsObject;
    static toObject(includeInstance: boolean, msg: RecoverchannelResponse): RecoverchannelResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: RecoverchannelResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): RecoverchannelResponse;
    static deserializeBinaryFromReader(message: RecoverchannelResponse, reader: jspb.BinaryReader): RecoverchannelResponse;
}

export namespace RecoverchannelResponse {
    export type AsObject = {
        stubsList: Array<string>,
    }
}

export class InvoiceRequest extends jspb.Message { 
    getDescription(): string;
    setDescription(value: string): InvoiceRequest;
    getLabel(): string;
    setLabel(value: string): InvoiceRequest;
    clearFallbacksList(): void;
    getFallbacksList(): Array<string>;
    setFallbacksList(value: Array<string>): InvoiceRequest;
    addFallbacks(value: string, index?: number): string;

    hasPreimage(): boolean;
    clearPreimage(): void;
    getPreimage(): Uint8Array | string;
    getPreimage_asU8(): Uint8Array;
    getPreimage_asB64(): string;
    setPreimage(value: Uint8Array | string): InvoiceRequest;

    hasCltv(): boolean;
    clearCltv(): void;
    getCltv(): number | undefined;
    setCltv(value: number): InvoiceRequest;

    hasExpiry(): boolean;
    clearExpiry(): void;
    getExpiry(): number | undefined;
    setExpiry(value: number): InvoiceRequest;
    clearExposeprivatechannelsList(): void;
    getExposeprivatechannelsList(): Array<string>;
    setExposeprivatechannelsList(value: Array<string>): InvoiceRequest;
    addExposeprivatechannels(value: string, index?: number): string;

    hasDeschashonly(): boolean;
    clearDeschashonly(): void;
    getDeschashonly(): boolean | undefined;
    setDeschashonly(value: boolean): InvoiceRequest;

    hasAmountMsat(): boolean;
    clearAmountMsat(): void;
    getAmountMsat(): cln_primitives_pb.AmountOrAny | undefined;
    setAmountMsat(value?: cln_primitives_pb.AmountOrAny): InvoiceRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): InvoiceRequest.AsObject;
    static toObject(includeInstance: boolean, msg: InvoiceRequest): InvoiceRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: InvoiceRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): InvoiceRequest;
    static deserializeBinaryFromReader(message: InvoiceRequest, reader: jspb.BinaryReader): InvoiceRequest;
}

export namespace InvoiceRequest {
    export type AsObject = {
        description: string,
        label: string,
        fallbacksList: Array<string>,
        preimage: Uint8Array | string,
        cltv?: number,
        expiry?: number,
        exposeprivatechannelsList: Array<string>,
        deschashonly?: boolean,
        amountMsat?: cln_primitives_pb.AmountOrAny.AsObject,
    }
}

export class InvoiceResponse extends jspb.Message { 
    getBolt11(): string;
    setBolt11(value: string): InvoiceResponse;
    getPaymentHash(): Uint8Array | string;
    getPaymentHash_asU8(): Uint8Array;
    getPaymentHash_asB64(): string;
    setPaymentHash(value: Uint8Array | string): InvoiceResponse;
    getPaymentSecret(): Uint8Array | string;
    getPaymentSecret_asU8(): Uint8Array;
    getPaymentSecret_asB64(): string;
    setPaymentSecret(value: Uint8Array | string): InvoiceResponse;
    getExpiresAt(): number;
    setExpiresAt(value: number): InvoiceResponse;

    hasWarningCapacity(): boolean;
    clearWarningCapacity(): void;
    getWarningCapacity(): string | undefined;
    setWarningCapacity(value: string): InvoiceResponse;

    hasWarningOffline(): boolean;
    clearWarningOffline(): void;
    getWarningOffline(): string | undefined;
    setWarningOffline(value: string): InvoiceResponse;

    hasWarningDeadends(): boolean;
    clearWarningDeadends(): void;
    getWarningDeadends(): string | undefined;
    setWarningDeadends(value: string): InvoiceResponse;

    hasWarningPrivateUnused(): boolean;
    clearWarningPrivateUnused(): void;
    getWarningPrivateUnused(): string | undefined;
    setWarningPrivateUnused(value: string): InvoiceResponse;

    hasWarningMpp(): boolean;
    clearWarningMpp(): void;
    getWarningMpp(): string | undefined;
    setWarningMpp(value: string): InvoiceResponse;

    hasCreatedIndex(): boolean;
    clearCreatedIndex(): void;
    getCreatedIndex(): number | undefined;
    setCreatedIndex(value: number): InvoiceResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): InvoiceResponse.AsObject;
    static toObject(includeInstance: boolean, msg: InvoiceResponse): InvoiceResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: InvoiceResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): InvoiceResponse;
    static deserializeBinaryFromReader(message: InvoiceResponse, reader: jspb.BinaryReader): InvoiceResponse;
}

export namespace InvoiceResponse {
    export type AsObject = {
        bolt11: string,
        paymentHash: Uint8Array | string,
        paymentSecret: Uint8Array | string,
        expiresAt: number,
        warningCapacity?: string,
        warningOffline?: string,
        warningDeadends?: string,
        warningPrivateUnused?: string,
        warningMpp?: string,
        createdIndex?: number,
    }
}

export class InvoicerequestRequest extends jspb.Message { 

    hasAmount(): boolean;
    clearAmount(): void;
    getAmount(): cln_primitives_pb.Amount | undefined;
    setAmount(value?: cln_primitives_pb.Amount): InvoicerequestRequest;
    getDescription(): string;
    setDescription(value: string): InvoicerequestRequest;

    hasIssuer(): boolean;
    clearIssuer(): void;
    getIssuer(): string | undefined;
    setIssuer(value: string): InvoicerequestRequest;

    hasLabel(): boolean;
    clearLabel(): void;
    getLabel(): string | undefined;
    setLabel(value: string): InvoicerequestRequest;

    hasAbsoluteExpiry(): boolean;
    clearAbsoluteExpiry(): void;
    getAbsoluteExpiry(): number | undefined;
    setAbsoluteExpiry(value: number): InvoicerequestRequest;

    hasSingleUse(): boolean;
    clearSingleUse(): void;
    getSingleUse(): boolean | undefined;
    setSingleUse(value: boolean): InvoicerequestRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): InvoicerequestRequest.AsObject;
    static toObject(includeInstance: boolean, msg: InvoicerequestRequest): InvoicerequestRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: InvoicerequestRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): InvoicerequestRequest;
    static deserializeBinaryFromReader(message: InvoicerequestRequest, reader: jspb.BinaryReader): InvoicerequestRequest;
}

export namespace InvoicerequestRequest {
    export type AsObject = {
        amount?: cln_primitives_pb.Amount.AsObject,
        description: string,
        issuer?: string,
        label?: string,
        absoluteExpiry?: number,
        singleUse?: boolean,
    }
}

export class InvoicerequestResponse extends jspb.Message { 
    getInvreqId(): Uint8Array | string;
    getInvreqId_asU8(): Uint8Array;
    getInvreqId_asB64(): string;
    setInvreqId(value: Uint8Array | string): InvoicerequestResponse;
    getActive(): boolean;
    setActive(value: boolean): InvoicerequestResponse;
    getSingleUse(): boolean;
    setSingleUse(value: boolean): InvoicerequestResponse;
    getBolt12(): string;
    setBolt12(value: string): InvoicerequestResponse;
    getUsed(): boolean;
    setUsed(value: boolean): InvoicerequestResponse;

    hasLabel(): boolean;
    clearLabel(): void;
    getLabel(): string | undefined;
    setLabel(value: string): InvoicerequestResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): InvoicerequestResponse.AsObject;
    static toObject(includeInstance: boolean, msg: InvoicerequestResponse): InvoicerequestResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: InvoicerequestResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): InvoicerequestResponse;
    static deserializeBinaryFromReader(message: InvoicerequestResponse, reader: jspb.BinaryReader): InvoicerequestResponse;
}

export namespace InvoicerequestResponse {
    export type AsObject = {
        invreqId: Uint8Array | string,
        active: boolean,
        singleUse: boolean,
        bolt12: string,
        used: boolean,
        label?: string,
    }
}

export class DisableinvoicerequestRequest extends jspb.Message { 
    getInvreqId(): string;
    setInvreqId(value: string): DisableinvoicerequestRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): DisableinvoicerequestRequest.AsObject;
    static toObject(includeInstance: boolean, msg: DisableinvoicerequestRequest): DisableinvoicerequestRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: DisableinvoicerequestRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): DisableinvoicerequestRequest;
    static deserializeBinaryFromReader(message: DisableinvoicerequestRequest, reader: jspb.BinaryReader): DisableinvoicerequestRequest;
}

export namespace DisableinvoicerequestRequest {
    export type AsObject = {
        invreqId: string,
    }
}

export class DisableinvoicerequestResponse extends jspb.Message { 
    getInvreqId(): Uint8Array | string;
    getInvreqId_asU8(): Uint8Array;
    getInvreqId_asB64(): string;
    setInvreqId(value: Uint8Array | string): DisableinvoicerequestResponse;
    getActive(): boolean;
    setActive(value: boolean): DisableinvoicerequestResponse;
    getSingleUse(): boolean;
    setSingleUse(value: boolean): DisableinvoicerequestResponse;
    getBolt12(): string;
    setBolt12(value: string): DisableinvoicerequestResponse;
    getUsed(): boolean;
    setUsed(value: boolean): DisableinvoicerequestResponse;

    hasLabel(): boolean;
    clearLabel(): void;
    getLabel(): string | undefined;
    setLabel(value: string): DisableinvoicerequestResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): DisableinvoicerequestResponse.AsObject;
    static toObject(includeInstance: boolean, msg: DisableinvoicerequestResponse): DisableinvoicerequestResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: DisableinvoicerequestResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): DisableinvoicerequestResponse;
    static deserializeBinaryFromReader(message: DisableinvoicerequestResponse, reader: jspb.BinaryReader): DisableinvoicerequestResponse;
}

export namespace DisableinvoicerequestResponse {
    export type AsObject = {
        invreqId: Uint8Array | string,
        active: boolean,
        singleUse: boolean,
        bolt12: string,
        used: boolean,
        label?: string,
    }
}

export class ListinvoicerequestsRequest extends jspb.Message { 

    hasInvreqId(): boolean;
    clearInvreqId(): void;
    getInvreqId(): string | undefined;
    setInvreqId(value: string): ListinvoicerequestsRequest;

    hasActiveOnly(): boolean;
    clearActiveOnly(): void;
    getActiveOnly(): boolean | undefined;
    setActiveOnly(value: boolean): ListinvoicerequestsRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ListinvoicerequestsRequest.AsObject;
    static toObject(includeInstance: boolean, msg: ListinvoicerequestsRequest): ListinvoicerequestsRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ListinvoicerequestsRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ListinvoicerequestsRequest;
    static deserializeBinaryFromReader(message: ListinvoicerequestsRequest, reader: jspb.BinaryReader): ListinvoicerequestsRequest;
}

export namespace ListinvoicerequestsRequest {
    export type AsObject = {
        invreqId?: string,
        activeOnly?: boolean,
    }
}

export class ListinvoicerequestsResponse extends jspb.Message { 
    clearInvoicerequestsList(): void;
    getInvoicerequestsList(): Array<ListinvoicerequestsInvoicerequests>;
    setInvoicerequestsList(value: Array<ListinvoicerequestsInvoicerequests>): ListinvoicerequestsResponse;
    addInvoicerequests(value?: ListinvoicerequestsInvoicerequests, index?: number): ListinvoicerequestsInvoicerequests;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ListinvoicerequestsResponse.AsObject;
    static toObject(includeInstance: boolean, msg: ListinvoicerequestsResponse): ListinvoicerequestsResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ListinvoicerequestsResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ListinvoicerequestsResponse;
    static deserializeBinaryFromReader(message: ListinvoicerequestsResponse, reader: jspb.BinaryReader): ListinvoicerequestsResponse;
}

export namespace ListinvoicerequestsResponse {
    export type AsObject = {
        invoicerequestsList: Array<ListinvoicerequestsInvoicerequests.AsObject>,
    }
}

export class ListinvoicerequestsInvoicerequests extends jspb.Message { 
    getInvreqId(): Uint8Array | string;
    getInvreqId_asU8(): Uint8Array;
    getInvreqId_asB64(): string;
    setInvreqId(value: Uint8Array | string): ListinvoicerequestsInvoicerequests;
    getActive(): boolean;
    setActive(value: boolean): ListinvoicerequestsInvoicerequests;
    getSingleUse(): boolean;
    setSingleUse(value: boolean): ListinvoicerequestsInvoicerequests;
    getBolt12(): string;
    setBolt12(value: string): ListinvoicerequestsInvoicerequests;
    getUsed(): boolean;
    setUsed(value: boolean): ListinvoicerequestsInvoicerequests;

    hasLabel(): boolean;
    clearLabel(): void;
    getLabel(): string | undefined;
    setLabel(value: string): ListinvoicerequestsInvoicerequests;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ListinvoicerequestsInvoicerequests.AsObject;
    static toObject(includeInstance: boolean, msg: ListinvoicerequestsInvoicerequests): ListinvoicerequestsInvoicerequests.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ListinvoicerequestsInvoicerequests, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ListinvoicerequestsInvoicerequests;
    static deserializeBinaryFromReader(message: ListinvoicerequestsInvoicerequests, reader: jspb.BinaryReader): ListinvoicerequestsInvoicerequests;
}

export namespace ListinvoicerequestsInvoicerequests {
    export type AsObject = {
        invreqId: Uint8Array | string,
        active: boolean,
        singleUse: boolean,
        bolt12: string,
        used: boolean,
        label?: string,
    }
}

export class ListdatastoreRequest extends jspb.Message { 
    clearKeyList(): void;
    getKeyList(): Array<string>;
    setKeyList(value: Array<string>): ListdatastoreRequest;
    addKey(value: string, index?: number): string;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ListdatastoreRequest.AsObject;
    static toObject(includeInstance: boolean, msg: ListdatastoreRequest): ListdatastoreRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ListdatastoreRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ListdatastoreRequest;
    static deserializeBinaryFromReader(message: ListdatastoreRequest, reader: jspb.BinaryReader): ListdatastoreRequest;
}

export namespace ListdatastoreRequest {
    export type AsObject = {
        keyList: Array<string>,
    }
}

export class ListdatastoreResponse extends jspb.Message { 
    clearDatastoreList(): void;
    getDatastoreList(): Array<ListdatastoreDatastore>;
    setDatastoreList(value: Array<ListdatastoreDatastore>): ListdatastoreResponse;
    addDatastore(value?: ListdatastoreDatastore, index?: number): ListdatastoreDatastore;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ListdatastoreResponse.AsObject;
    static toObject(includeInstance: boolean, msg: ListdatastoreResponse): ListdatastoreResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ListdatastoreResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ListdatastoreResponse;
    static deserializeBinaryFromReader(message: ListdatastoreResponse, reader: jspb.BinaryReader): ListdatastoreResponse;
}

export namespace ListdatastoreResponse {
    export type AsObject = {
        datastoreList: Array<ListdatastoreDatastore.AsObject>,
    }
}

export class ListdatastoreDatastore extends jspb.Message { 
    clearKeyList(): void;
    getKeyList(): Array<string>;
    setKeyList(value: Array<string>): ListdatastoreDatastore;
    addKey(value: string, index?: number): string;

    hasGeneration(): boolean;
    clearGeneration(): void;
    getGeneration(): number | undefined;
    setGeneration(value: number): ListdatastoreDatastore;

    hasHex(): boolean;
    clearHex(): void;
    getHex(): Uint8Array | string;
    getHex_asU8(): Uint8Array;
    getHex_asB64(): string;
    setHex(value: Uint8Array | string): ListdatastoreDatastore;

    hasString(): boolean;
    clearString(): void;
    getString(): string | undefined;
    setString(value: string): ListdatastoreDatastore;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ListdatastoreDatastore.AsObject;
    static toObject(includeInstance: boolean, msg: ListdatastoreDatastore): ListdatastoreDatastore.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ListdatastoreDatastore, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ListdatastoreDatastore;
    static deserializeBinaryFromReader(message: ListdatastoreDatastore, reader: jspb.BinaryReader): ListdatastoreDatastore;
}

export namespace ListdatastoreDatastore {
    export type AsObject = {
        keyList: Array<string>,
        generation?: number,
        hex: Uint8Array | string,
        string?: string,
    }
}

export class ListinvoicesRequest extends jspb.Message { 

    hasLabel(): boolean;
    clearLabel(): void;
    getLabel(): string | undefined;
    setLabel(value: string): ListinvoicesRequest;

    hasInvstring(): boolean;
    clearInvstring(): void;
    getInvstring(): string | undefined;
    setInvstring(value: string): ListinvoicesRequest;

    hasPaymentHash(): boolean;
    clearPaymentHash(): void;
    getPaymentHash(): Uint8Array | string;
    getPaymentHash_asU8(): Uint8Array;
    getPaymentHash_asB64(): string;
    setPaymentHash(value: Uint8Array | string): ListinvoicesRequest;

    hasOfferId(): boolean;
    clearOfferId(): void;
    getOfferId(): string | undefined;
    setOfferId(value: string): ListinvoicesRequest;

    hasIndex(): boolean;
    clearIndex(): void;
    getIndex(): ListinvoicesRequest.ListinvoicesIndex | undefined;
    setIndex(value: ListinvoicesRequest.ListinvoicesIndex): ListinvoicesRequest;

    hasStart(): boolean;
    clearStart(): void;
    getStart(): number | undefined;
    setStart(value: number): ListinvoicesRequest;

    hasLimit(): boolean;
    clearLimit(): void;
    getLimit(): number | undefined;
    setLimit(value: number): ListinvoicesRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ListinvoicesRequest.AsObject;
    static toObject(includeInstance: boolean, msg: ListinvoicesRequest): ListinvoicesRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ListinvoicesRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ListinvoicesRequest;
    static deserializeBinaryFromReader(message: ListinvoicesRequest, reader: jspb.BinaryReader): ListinvoicesRequest;
}

export namespace ListinvoicesRequest {
    export type AsObject = {
        label?: string,
        invstring?: string,
        paymentHash: Uint8Array | string,
        offerId?: string,
        index?: ListinvoicesRequest.ListinvoicesIndex,
        start?: number,
        limit?: number,
    }

    export enum ListinvoicesIndex {
    CREATED = 0,
    UPDATED = 1,
    }

}

export class ListinvoicesResponse extends jspb.Message { 
    clearInvoicesList(): void;
    getInvoicesList(): Array<ListinvoicesInvoices>;
    setInvoicesList(value: Array<ListinvoicesInvoices>): ListinvoicesResponse;
    addInvoices(value?: ListinvoicesInvoices, index?: number): ListinvoicesInvoices;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ListinvoicesResponse.AsObject;
    static toObject(includeInstance: boolean, msg: ListinvoicesResponse): ListinvoicesResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ListinvoicesResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ListinvoicesResponse;
    static deserializeBinaryFromReader(message: ListinvoicesResponse, reader: jspb.BinaryReader): ListinvoicesResponse;
}

export namespace ListinvoicesResponse {
    export type AsObject = {
        invoicesList: Array<ListinvoicesInvoices.AsObject>,
    }
}

export class ListinvoicesInvoices extends jspb.Message { 
    getLabel(): string;
    setLabel(value: string): ListinvoicesInvoices;

    hasDescription(): boolean;
    clearDescription(): void;
    getDescription(): string | undefined;
    setDescription(value: string): ListinvoicesInvoices;
    getPaymentHash(): Uint8Array | string;
    getPaymentHash_asU8(): Uint8Array;
    getPaymentHash_asB64(): string;
    setPaymentHash(value: Uint8Array | string): ListinvoicesInvoices;
    getStatus(): ListinvoicesInvoices.ListinvoicesInvoicesStatus;
    setStatus(value: ListinvoicesInvoices.ListinvoicesInvoicesStatus): ListinvoicesInvoices;
    getExpiresAt(): number;
    setExpiresAt(value: number): ListinvoicesInvoices;

    hasAmountMsat(): boolean;
    clearAmountMsat(): void;
    getAmountMsat(): cln_primitives_pb.Amount | undefined;
    setAmountMsat(value?: cln_primitives_pb.Amount): ListinvoicesInvoices;

    hasBolt11(): boolean;
    clearBolt11(): void;
    getBolt11(): string | undefined;
    setBolt11(value: string): ListinvoicesInvoices;

    hasBolt12(): boolean;
    clearBolt12(): void;
    getBolt12(): string | undefined;
    setBolt12(value: string): ListinvoicesInvoices;

    hasLocalOfferId(): boolean;
    clearLocalOfferId(): void;
    getLocalOfferId(): Uint8Array | string;
    getLocalOfferId_asU8(): Uint8Array;
    getLocalOfferId_asB64(): string;
    setLocalOfferId(value: Uint8Array | string): ListinvoicesInvoices;

    hasPayIndex(): boolean;
    clearPayIndex(): void;
    getPayIndex(): number | undefined;
    setPayIndex(value: number): ListinvoicesInvoices;

    hasAmountReceivedMsat(): boolean;
    clearAmountReceivedMsat(): void;
    getAmountReceivedMsat(): cln_primitives_pb.Amount | undefined;
    setAmountReceivedMsat(value?: cln_primitives_pb.Amount): ListinvoicesInvoices;

    hasPaidAt(): boolean;
    clearPaidAt(): void;
    getPaidAt(): number | undefined;
    setPaidAt(value: number): ListinvoicesInvoices;

    hasPaymentPreimage(): boolean;
    clearPaymentPreimage(): void;
    getPaymentPreimage(): Uint8Array | string;
    getPaymentPreimage_asU8(): Uint8Array;
    getPaymentPreimage_asB64(): string;
    setPaymentPreimage(value: Uint8Array | string): ListinvoicesInvoices;

    hasInvreqPayerNote(): boolean;
    clearInvreqPayerNote(): void;
    getInvreqPayerNote(): string | undefined;
    setInvreqPayerNote(value: string): ListinvoicesInvoices;

    hasCreatedIndex(): boolean;
    clearCreatedIndex(): void;
    getCreatedIndex(): number | undefined;
    setCreatedIndex(value: number): ListinvoicesInvoices;

    hasUpdatedIndex(): boolean;
    clearUpdatedIndex(): void;
    getUpdatedIndex(): number | undefined;
    setUpdatedIndex(value: number): ListinvoicesInvoices;

    hasPaidOutpoint(): boolean;
    clearPaidOutpoint(): void;
    getPaidOutpoint(): ListinvoicesInvoicesPaid_outpoint | undefined;
    setPaidOutpoint(value?: ListinvoicesInvoicesPaid_outpoint): ListinvoicesInvoices;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ListinvoicesInvoices.AsObject;
    static toObject(includeInstance: boolean, msg: ListinvoicesInvoices): ListinvoicesInvoices.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ListinvoicesInvoices, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ListinvoicesInvoices;
    static deserializeBinaryFromReader(message: ListinvoicesInvoices, reader: jspb.BinaryReader): ListinvoicesInvoices;
}

export namespace ListinvoicesInvoices {
    export type AsObject = {
        label: string,
        description?: string,
        paymentHash: Uint8Array | string,
        status: ListinvoicesInvoices.ListinvoicesInvoicesStatus,
        expiresAt: number,
        amountMsat?: cln_primitives_pb.Amount.AsObject,
        bolt11?: string,
        bolt12?: string,
        localOfferId: Uint8Array | string,
        payIndex?: number,
        amountReceivedMsat?: cln_primitives_pb.Amount.AsObject,
        paidAt?: number,
        paymentPreimage: Uint8Array | string,
        invreqPayerNote?: string,
        createdIndex?: number,
        updatedIndex?: number,
        paidOutpoint?: ListinvoicesInvoicesPaid_outpoint.AsObject,
    }

    export enum ListinvoicesInvoicesStatus {
    UNPAID = 0,
    PAID = 1,
    EXPIRED = 2,
    }

}

export class ListinvoicesInvoicesPaid_outpoint extends jspb.Message { 
    getTxid(): Uint8Array | string;
    getTxid_asU8(): Uint8Array;
    getTxid_asB64(): string;
    setTxid(value: Uint8Array | string): ListinvoicesInvoicesPaid_outpoint;
    getOutnum(): number;
    setOutnum(value: number): ListinvoicesInvoicesPaid_outpoint;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ListinvoicesInvoicesPaid_outpoint.AsObject;
    static toObject(includeInstance: boolean, msg: ListinvoicesInvoicesPaid_outpoint): ListinvoicesInvoicesPaid_outpoint.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ListinvoicesInvoicesPaid_outpoint, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ListinvoicesInvoicesPaid_outpoint;
    static deserializeBinaryFromReader(message: ListinvoicesInvoicesPaid_outpoint, reader: jspb.BinaryReader): ListinvoicesInvoicesPaid_outpoint;
}

export namespace ListinvoicesInvoicesPaid_outpoint {
    export type AsObject = {
        txid: Uint8Array | string,
        outnum: number,
    }
}

export class SendonionRequest extends jspb.Message { 
    getOnion(): Uint8Array | string;
    getOnion_asU8(): Uint8Array;
    getOnion_asB64(): string;
    setOnion(value: Uint8Array | string): SendonionRequest;

    hasFirstHop(): boolean;
    clearFirstHop(): void;
    getFirstHop(): SendonionFirst_hop | undefined;
    setFirstHop(value?: SendonionFirst_hop): SendonionRequest;
    getPaymentHash(): Uint8Array | string;
    getPaymentHash_asU8(): Uint8Array;
    getPaymentHash_asB64(): string;
    setPaymentHash(value: Uint8Array | string): SendonionRequest;

    hasLabel(): boolean;
    clearLabel(): void;
    getLabel(): string | undefined;
    setLabel(value: string): SendonionRequest;
    clearSharedSecretsList(): void;
    getSharedSecretsList(): Array<Uint8Array | string>;
    getSharedSecretsList_asU8(): Array<Uint8Array>;
    getSharedSecretsList_asB64(): Array<string>;
    setSharedSecretsList(value: Array<Uint8Array | string>): SendonionRequest;
    addSharedSecrets(value: Uint8Array | string, index?: number): Uint8Array | string;

    hasPartid(): boolean;
    clearPartid(): void;
    getPartid(): number | undefined;
    setPartid(value: number): SendonionRequest;

    hasBolt11(): boolean;
    clearBolt11(): void;
    getBolt11(): string | undefined;
    setBolt11(value: string): SendonionRequest;

    hasDestination(): boolean;
    clearDestination(): void;
    getDestination(): Uint8Array | string;
    getDestination_asU8(): Uint8Array;
    getDestination_asB64(): string;
    setDestination(value: Uint8Array | string): SendonionRequest;

    hasGroupid(): boolean;
    clearGroupid(): void;
    getGroupid(): number | undefined;
    setGroupid(value: number): SendonionRequest;

    hasAmountMsat(): boolean;
    clearAmountMsat(): void;
    getAmountMsat(): cln_primitives_pb.Amount | undefined;
    setAmountMsat(value?: cln_primitives_pb.Amount): SendonionRequest;

    hasLocalinvreqid(): boolean;
    clearLocalinvreqid(): void;
    getLocalinvreqid(): Uint8Array | string;
    getLocalinvreqid_asU8(): Uint8Array;
    getLocalinvreqid_asB64(): string;
    setLocalinvreqid(value: Uint8Array | string): SendonionRequest;

    hasDescription(): boolean;
    clearDescription(): void;
    getDescription(): string | undefined;
    setDescription(value: string): SendonionRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): SendonionRequest.AsObject;
    static toObject(includeInstance: boolean, msg: SendonionRequest): SendonionRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: SendonionRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): SendonionRequest;
    static deserializeBinaryFromReader(message: SendonionRequest, reader: jspb.BinaryReader): SendonionRequest;
}

export namespace SendonionRequest {
    export type AsObject = {
        onion: Uint8Array | string,
        firstHop?: SendonionFirst_hop.AsObject,
        paymentHash: Uint8Array | string,
        label?: string,
        sharedSecretsList: Array<Uint8Array | string>,
        partid?: number,
        bolt11?: string,
        destination: Uint8Array | string,
        groupid?: number,
        amountMsat?: cln_primitives_pb.Amount.AsObject,
        localinvreqid: Uint8Array | string,
        description?: string,
    }
}

export class SendonionResponse extends jspb.Message { 
    getId(): number;
    setId(value: number): SendonionResponse;
    getPaymentHash(): Uint8Array | string;
    getPaymentHash_asU8(): Uint8Array;
    getPaymentHash_asB64(): string;
    setPaymentHash(value: Uint8Array | string): SendonionResponse;
    getStatus(): SendonionResponse.SendonionStatus;
    setStatus(value: SendonionResponse.SendonionStatus): SendonionResponse;

    hasAmountMsat(): boolean;
    clearAmountMsat(): void;
    getAmountMsat(): cln_primitives_pb.Amount | undefined;
    setAmountMsat(value?: cln_primitives_pb.Amount): SendonionResponse;

    hasDestination(): boolean;
    clearDestination(): void;
    getDestination(): Uint8Array | string;
    getDestination_asU8(): Uint8Array;
    getDestination_asB64(): string;
    setDestination(value: Uint8Array | string): SendonionResponse;
    getCreatedAt(): number;
    setCreatedAt(value: number): SendonionResponse;

    hasAmountSentMsat(): boolean;
    clearAmountSentMsat(): void;
    getAmountSentMsat(): cln_primitives_pb.Amount | undefined;
    setAmountSentMsat(value?: cln_primitives_pb.Amount): SendonionResponse;

    hasLabel(): boolean;
    clearLabel(): void;
    getLabel(): string | undefined;
    setLabel(value: string): SendonionResponse;

    hasBolt11(): boolean;
    clearBolt11(): void;
    getBolt11(): string | undefined;
    setBolt11(value: string): SendonionResponse;

    hasBolt12(): boolean;
    clearBolt12(): void;
    getBolt12(): string | undefined;
    setBolt12(value: string): SendonionResponse;

    hasPaymentPreimage(): boolean;
    clearPaymentPreimage(): void;
    getPaymentPreimage(): Uint8Array | string;
    getPaymentPreimage_asU8(): Uint8Array;
    getPaymentPreimage_asB64(): string;
    setPaymentPreimage(value: Uint8Array | string): SendonionResponse;

    hasMessage(): boolean;
    clearMessage(): void;
    getMessage(): string | undefined;
    setMessage(value: string): SendonionResponse;

    hasPartid(): boolean;
    clearPartid(): void;
    getPartid(): number | undefined;
    setPartid(value: number): SendonionResponse;

    hasCreatedIndex(): boolean;
    clearCreatedIndex(): void;
    getCreatedIndex(): number | undefined;
    setCreatedIndex(value: number): SendonionResponse;

    hasUpdatedIndex(): boolean;
    clearUpdatedIndex(): void;
    getUpdatedIndex(): number | undefined;
    setUpdatedIndex(value: number): SendonionResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): SendonionResponse.AsObject;
    static toObject(includeInstance: boolean, msg: SendonionResponse): SendonionResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: SendonionResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): SendonionResponse;
    static deserializeBinaryFromReader(message: SendonionResponse, reader: jspb.BinaryReader): SendonionResponse;
}

export namespace SendonionResponse {
    export type AsObject = {
        id: number,
        paymentHash: Uint8Array | string,
        status: SendonionResponse.SendonionStatus,
        amountMsat?: cln_primitives_pb.Amount.AsObject,
        destination: Uint8Array | string,
        createdAt: number,
        amountSentMsat?: cln_primitives_pb.Amount.AsObject,
        label?: string,
        bolt11?: string,
        bolt12?: string,
        paymentPreimage: Uint8Array | string,
        message?: string,
        partid?: number,
        createdIndex?: number,
        updatedIndex?: number,
    }

    export enum SendonionStatus {
    PENDING = 0,
    COMPLETE = 1,
    }

}

export class SendonionFirst_hop extends jspb.Message { 
    getId(): Uint8Array | string;
    getId_asU8(): Uint8Array;
    getId_asB64(): string;
    setId(value: Uint8Array | string): SendonionFirst_hop;

    hasAmountMsat(): boolean;
    clearAmountMsat(): void;
    getAmountMsat(): cln_primitives_pb.Amount | undefined;
    setAmountMsat(value?: cln_primitives_pb.Amount): SendonionFirst_hop;
    getDelay(): number;
    setDelay(value: number): SendonionFirst_hop;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): SendonionFirst_hop.AsObject;
    static toObject(includeInstance: boolean, msg: SendonionFirst_hop): SendonionFirst_hop.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: SendonionFirst_hop, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): SendonionFirst_hop;
    static deserializeBinaryFromReader(message: SendonionFirst_hop, reader: jspb.BinaryReader): SendonionFirst_hop;
}

export namespace SendonionFirst_hop {
    export type AsObject = {
        id: Uint8Array | string,
        amountMsat?: cln_primitives_pb.Amount.AsObject,
        delay: number,
    }
}

export class ListsendpaysRequest extends jspb.Message { 

    hasBolt11(): boolean;
    clearBolt11(): void;
    getBolt11(): string | undefined;
    setBolt11(value: string): ListsendpaysRequest;

    hasPaymentHash(): boolean;
    clearPaymentHash(): void;
    getPaymentHash(): Uint8Array | string;
    getPaymentHash_asU8(): Uint8Array;
    getPaymentHash_asB64(): string;
    setPaymentHash(value: Uint8Array | string): ListsendpaysRequest;

    hasStatus(): boolean;
    clearStatus(): void;
    getStatus(): ListsendpaysRequest.ListsendpaysStatus | undefined;
    setStatus(value: ListsendpaysRequest.ListsendpaysStatus): ListsendpaysRequest;

    hasIndex(): boolean;
    clearIndex(): void;
    getIndex(): ListsendpaysRequest.ListsendpaysIndex | undefined;
    setIndex(value: ListsendpaysRequest.ListsendpaysIndex): ListsendpaysRequest;

    hasStart(): boolean;
    clearStart(): void;
    getStart(): number | undefined;
    setStart(value: number): ListsendpaysRequest;

    hasLimit(): boolean;
    clearLimit(): void;
    getLimit(): number | undefined;
    setLimit(value: number): ListsendpaysRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ListsendpaysRequest.AsObject;
    static toObject(includeInstance: boolean, msg: ListsendpaysRequest): ListsendpaysRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ListsendpaysRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ListsendpaysRequest;
    static deserializeBinaryFromReader(message: ListsendpaysRequest, reader: jspb.BinaryReader): ListsendpaysRequest;
}

export namespace ListsendpaysRequest {
    export type AsObject = {
        bolt11?: string,
        paymentHash: Uint8Array | string,
        status?: ListsendpaysRequest.ListsendpaysStatus,
        index?: ListsendpaysRequest.ListsendpaysIndex,
        start?: number,
        limit?: number,
    }

    export enum ListsendpaysStatus {
    PENDING = 0,
    COMPLETE = 1,
    FAILED = 2,
    }

    export enum ListsendpaysIndex {
    CREATED = 0,
    UPDATED = 1,
    }

}

export class ListsendpaysResponse extends jspb.Message { 
    clearPaymentsList(): void;
    getPaymentsList(): Array<ListsendpaysPayments>;
    setPaymentsList(value: Array<ListsendpaysPayments>): ListsendpaysResponse;
    addPayments(value?: ListsendpaysPayments, index?: number): ListsendpaysPayments;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ListsendpaysResponse.AsObject;
    static toObject(includeInstance: boolean, msg: ListsendpaysResponse): ListsendpaysResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ListsendpaysResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ListsendpaysResponse;
    static deserializeBinaryFromReader(message: ListsendpaysResponse, reader: jspb.BinaryReader): ListsendpaysResponse;
}

export namespace ListsendpaysResponse {
    export type AsObject = {
        paymentsList: Array<ListsendpaysPayments.AsObject>,
    }
}

export class ListsendpaysPayments extends jspb.Message { 
    getId(): number;
    setId(value: number): ListsendpaysPayments;
    getGroupid(): number;
    setGroupid(value: number): ListsendpaysPayments;
    getPaymentHash(): Uint8Array | string;
    getPaymentHash_asU8(): Uint8Array;
    getPaymentHash_asB64(): string;
    setPaymentHash(value: Uint8Array | string): ListsendpaysPayments;
    getStatus(): ListsendpaysPayments.ListsendpaysPaymentsStatus;
    setStatus(value: ListsendpaysPayments.ListsendpaysPaymentsStatus): ListsendpaysPayments;

    hasAmountMsat(): boolean;
    clearAmountMsat(): void;
    getAmountMsat(): cln_primitives_pb.Amount | undefined;
    setAmountMsat(value?: cln_primitives_pb.Amount): ListsendpaysPayments;

    hasDestination(): boolean;
    clearDestination(): void;
    getDestination(): Uint8Array | string;
    getDestination_asU8(): Uint8Array;
    getDestination_asB64(): string;
    setDestination(value: Uint8Array | string): ListsendpaysPayments;
    getCreatedAt(): number;
    setCreatedAt(value: number): ListsendpaysPayments;

    hasAmountSentMsat(): boolean;
    clearAmountSentMsat(): void;
    getAmountSentMsat(): cln_primitives_pb.Amount | undefined;
    setAmountSentMsat(value?: cln_primitives_pb.Amount): ListsendpaysPayments;

    hasLabel(): boolean;
    clearLabel(): void;
    getLabel(): string | undefined;
    setLabel(value: string): ListsendpaysPayments;

    hasBolt11(): boolean;
    clearBolt11(): void;
    getBolt11(): string | undefined;
    setBolt11(value: string): ListsendpaysPayments;

    hasBolt12(): boolean;
    clearBolt12(): void;
    getBolt12(): string | undefined;
    setBolt12(value: string): ListsendpaysPayments;

    hasPaymentPreimage(): boolean;
    clearPaymentPreimage(): void;
    getPaymentPreimage(): Uint8Array | string;
    getPaymentPreimage_asU8(): Uint8Array;
    getPaymentPreimage_asB64(): string;
    setPaymentPreimage(value: Uint8Array | string): ListsendpaysPayments;

    hasErroronion(): boolean;
    clearErroronion(): void;
    getErroronion(): Uint8Array | string;
    getErroronion_asU8(): Uint8Array;
    getErroronion_asB64(): string;
    setErroronion(value: Uint8Array | string): ListsendpaysPayments;

    hasDescription(): boolean;
    clearDescription(): void;
    getDescription(): string | undefined;
    setDescription(value: string): ListsendpaysPayments;

    hasPartid(): boolean;
    clearPartid(): void;
    getPartid(): number | undefined;
    setPartid(value: number): ListsendpaysPayments;

    hasCreatedIndex(): boolean;
    clearCreatedIndex(): void;
    getCreatedIndex(): number | undefined;
    setCreatedIndex(value: number): ListsendpaysPayments;

    hasUpdatedIndex(): boolean;
    clearUpdatedIndex(): void;
    getUpdatedIndex(): number | undefined;
    setUpdatedIndex(value: number): ListsendpaysPayments;

    hasCompletedAt(): boolean;
    clearCompletedAt(): void;
    getCompletedAt(): number | undefined;
    setCompletedAt(value: number): ListsendpaysPayments;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ListsendpaysPayments.AsObject;
    static toObject(includeInstance: boolean, msg: ListsendpaysPayments): ListsendpaysPayments.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ListsendpaysPayments, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ListsendpaysPayments;
    static deserializeBinaryFromReader(message: ListsendpaysPayments, reader: jspb.BinaryReader): ListsendpaysPayments;
}

export namespace ListsendpaysPayments {
    export type AsObject = {
        id: number,
        groupid: number,
        paymentHash: Uint8Array | string,
        status: ListsendpaysPayments.ListsendpaysPaymentsStatus,
        amountMsat?: cln_primitives_pb.Amount.AsObject,
        destination: Uint8Array | string,
        createdAt: number,
        amountSentMsat?: cln_primitives_pb.Amount.AsObject,
        label?: string,
        bolt11?: string,
        bolt12?: string,
        paymentPreimage: Uint8Array | string,
        erroronion: Uint8Array | string,
        description?: string,
        partid?: number,
        createdIndex?: number,
        updatedIndex?: number,
        completedAt?: number,
    }

    export enum ListsendpaysPaymentsStatus {
    PENDING = 0,
    FAILED = 1,
    COMPLETE = 2,
    }

}

export class ListtransactionsRequest extends jspb.Message { 

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ListtransactionsRequest.AsObject;
    static toObject(includeInstance: boolean, msg: ListtransactionsRequest): ListtransactionsRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ListtransactionsRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ListtransactionsRequest;
    static deserializeBinaryFromReader(message: ListtransactionsRequest, reader: jspb.BinaryReader): ListtransactionsRequest;
}

export namespace ListtransactionsRequest {
    export type AsObject = {
    }
}

export class ListtransactionsResponse extends jspb.Message { 
    clearTransactionsList(): void;
    getTransactionsList(): Array<ListtransactionsTransactions>;
    setTransactionsList(value: Array<ListtransactionsTransactions>): ListtransactionsResponse;
    addTransactions(value?: ListtransactionsTransactions, index?: number): ListtransactionsTransactions;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ListtransactionsResponse.AsObject;
    static toObject(includeInstance: boolean, msg: ListtransactionsResponse): ListtransactionsResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ListtransactionsResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ListtransactionsResponse;
    static deserializeBinaryFromReader(message: ListtransactionsResponse, reader: jspb.BinaryReader): ListtransactionsResponse;
}

export namespace ListtransactionsResponse {
    export type AsObject = {
        transactionsList: Array<ListtransactionsTransactions.AsObject>,
    }
}

export class ListtransactionsTransactions extends jspb.Message { 
    getHash(): Uint8Array | string;
    getHash_asU8(): Uint8Array;
    getHash_asB64(): string;
    setHash(value: Uint8Array | string): ListtransactionsTransactions;
    getRawtx(): Uint8Array | string;
    getRawtx_asU8(): Uint8Array;
    getRawtx_asB64(): string;
    setRawtx(value: Uint8Array | string): ListtransactionsTransactions;
    getBlockheight(): number;
    setBlockheight(value: number): ListtransactionsTransactions;
    getTxindex(): number;
    setTxindex(value: number): ListtransactionsTransactions;
    getLocktime(): number;
    setLocktime(value: number): ListtransactionsTransactions;
    getVersion(): number;
    setVersion(value: number): ListtransactionsTransactions;
    clearInputsList(): void;
    getInputsList(): Array<ListtransactionsTransactionsInputs>;
    setInputsList(value: Array<ListtransactionsTransactionsInputs>): ListtransactionsTransactions;
    addInputs(value?: ListtransactionsTransactionsInputs, index?: number): ListtransactionsTransactionsInputs;
    clearOutputsList(): void;
    getOutputsList(): Array<ListtransactionsTransactionsOutputs>;
    setOutputsList(value: Array<ListtransactionsTransactionsOutputs>): ListtransactionsTransactions;
    addOutputs(value?: ListtransactionsTransactionsOutputs, index?: number): ListtransactionsTransactionsOutputs;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ListtransactionsTransactions.AsObject;
    static toObject(includeInstance: boolean, msg: ListtransactionsTransactions): ListtransactionsTransactions.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ListtransactionsTransactions, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ListtransactionsTransactions;
    static deserializeBinaryFromReader(message: ListtransactionsTransactions, reader: jspb.BinaryReader): ListtransactionsTransactions;
}

export namespace ListtransactionsTransactions {
    export type AsObject = {
        hash: Uint8Array | string,
        rawtx: Uint8Array | string,
        blockheight: number,
        txindex: number,
        locktime: number,
        version: number,
        inputsList: Array<ListtransactionsTransactionsInputs.AsObject>,
        outputsList: Array<ListtransactionsTransactionsOutputs.AsObject>,
    }
}

export class ListtransactionsTransactionsInputs extends jspb.Message { 
    getTxid(): Uint8Array | string;
    getTxid_asU8(): Uint8Array;
    getTxid_asB64(): string;
    setTxid(value: Uint8Array | string): ListtransactionsTransactionsInputs;
    getIndex(): number;
    setIndex(value: number): ListtransactionsTransactionsInputs;
    getSequence(): number;
    setSequence(value: number): ListtransactionsTransactionsInputs;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ListtransactionsTransactionsInputs.AsObject;
    static toObject(includeInstance: boolean, msg: ListtransactionsTransactionsInputs): ListtransactionsTransactionsInputs.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ListtransactionsTransactionsInputs, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ListtransactionsTransactionsInputs;
    static deserializeBinaryFromReader(message: ListtransactionsTransactionsInputs, reader: jspb.BinaryReader): ListtransactionsTransactionsInputs;
}

export namespace ListtransactionsTransactionsInputs {
    export type AsObject = {
        txid: Uint8Array | string,
        index: number,
        sequence: number,
    }
}

export class ListtransactionsTransactionsOutputs extends jspb.Message { 
    getIndex(): number;
    setIndex(value: number): ListtransactionsTransactionsOutputs;
    getScriptpubkey(): Uint8Array | string;
    getScriptpubkey_asU8(): Uint8Array;
    getScriptpubkey_asB64(): string;
    setScriptpubkey(value: Uint8Array | string): ListtransactionsTransactionsOutputs;

    hasAmountMsat(): boolean;
    clearAmountMsat(): void;
    getAmountMsat(): cln_primitives_pb.Amount | undefined;
    setAmountMsat(value?: cln_primitives_pb.Amount): ListtransactionsTransactionsOutputs;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ListtransactionsTransactionsOutputs.AsObject;
    static toObject(includeInstance: boolean, msg: ListtransactionsTransactionsOutputs): ListtransactionsTransactionsOutputs.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ListtransactionsTransactionsOutputs, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ListtransactionsTransactionsOutputs;
    static deserializeBinaryFromReader(message: ListtransactionsTransactionsOutputs, reader: jspb.BinaryReader): ListtransactionsTransactionsOutputs;
}

export namespace ListtransactionsTransactionsOutputs {
    export type AsObject = {
        index: number,
        scriptpubkey: Uint8Array | string,
        amountMsat?: cln_primitives_pb.Amount.AsObject,
    }
}

export class MakesecretRequest extends jspb.Message { 

    hasHex(): boolean;
    clearHex(): void;
    getHex(): Uint8Array | string;
    getHex_asU8(): Uint8Array;
    getHex_asB64(): string;
    setHex(value: Uint8Array | string): MakesecretRequest;

    hasString(): boolean;
    clearString(): void;
    getString(): string | undefined;
    setString(value: string): MakesecretRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): MakesecretRequest.AsObject;
    static toObject(includeInstance: boolean, msg: MakesecretRequest): MakesecretRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: MakesecretRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): MakesecretRequest;
    static deserializeBinaryFromReader(message: MakesecretRequest, reader: jspb.BinaryReader): MakesecretRequest;
}

export namespace MakesecretRequest {
    export type AsObject = {
        hex: Uint8Array | string,
        string?: string,
    }
}

export class MakesecretResponse extends jspb.Message { 
    getSecret(): Uint8Array | string;
    getSecret_asU8(): Uint8Array;
    getSecret_asB64(): string;
    setSecret(value: Uint8Array | string): MakesecretResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): MakesecretResponse.AsObject;
    static toObject(includeInstance: boolean, msg: MakesecretResponse): MakesecretResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: MakesecretResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): MakesecretResponse;
    static deserializeBinaryFromReader(message: MakesecretResponse, reader: jspb.BinaryReader): MakesecretResponse;
}

export namespace MakesecretResponse {
    export type AsObject = {
        secret: Uint8Array | string,
    }
}

export class PayRequest extends jspb.Message { 
    getBolt11(): string;
    setBolt11(value: string): PayRequest;

    hasLabel(): boolean;
    clearLabel(): void;
    getLabel(): string | undefined;
    setLabel(value: string): PayRequest;

    hasMaxfeepercent(): boolean;
    clearMaxfeepercent(): void;
    getMaxfeepercent(): number | undefined;
    setMaxfeepercent(value: number): PayRequest;

    hasRetryFor(): boolean;
    clearRetryFor(): void;
    getRetryFor(): number | undefined;
    setRetryFor(value: number): PayRequest;

    hasMaxdelay(): boolean;
    clearMaxdelay(): void;
    getMaxdelay(): number | undefined;
    setMaxdelay(value: number): PayRequest;

    hasExemptfee(): boolean;
    clearExemptfee(): void;
    getExemptfee(): cln_primitives_pb.Amount | undefined;
    setExemptfee(value?: cln_primitives_pb.Amount): PayRequest;

    hasRiskfactor(): boolean;
    clearRiskfactor(): void;
    getRiskfactor(): number | undefined;
    setRiskfactor(value: number): PayRequest;
    clearExcludeList(): void;
    getExcludeList(): Array<string>;
    setExcludeList(value: Array<string>): PayRequest;
    addExclude(value: string, index?: number): string;

    hasMaxfee(): boolean;
    clearMaxfee(): void;
    getMaxfee(): cln_primitives_pb.Amount | undefined;
    setMaxfee(value?: cln_primitives_pb.Amount): PayRequest;

    hasDescription(): boolean;
    clearDescription(): void;
    getDescription(): string | undefined;
    setDescription(value: string): PayRequest;

    hasAmountMsat(): boolean;
    clearAmountMsat(): void;
    getAmountMsat(): cln_primitives_pb.Amount | undefined;
    setAmountMsat(value?: cln_primitives_pb.Amount): PayRequest;

    hasLocalinvreqid(): boolean;
    clearLocalinvreqid(): void;
    getLocalinvreqid(): Uint8Array | string;
    getLocalinvreqid_asU8(): Uint8Array;
    getLocalinvreqid_asB64(): string;
    setLocalinvreqid(value: Uint8Array | string): PayRequest;

    hasPartialMsat(): boolean;
    clearPartialMsat(): void;
    getPartialMsat(): cln_primitives_pb.Amount | undefined;
    setPartialMsat(value?: cln_primitives_pb.Amount): PayRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): PayRequest.AsObject;
    static toObject(includeInstance: boolean, msg: PayRequest): PayRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: PayRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): PayRequest;
    static deserializeBinaryFromReader(message: PayRequest, reader: jspb.BinaryReader): PayRequest;
}

export namespace PayRequest {
    export type AsObject = {
        bolt11: string,
        label?: string,
        maxfeepercent?: number,
        retryFor?: number,
        maxdelay?: number,
        exemptfee?: cln_primitives_pb.Amount.AsObject,
        riskfactor?: number,
        excludeList: Array<string>,
        maxfee?: cln_primitives_pb.Amount.AsObject,
        description?: string,
        amountMsat?: cln_primitives_pb.Amount.AsObject,
        localinvreqid: Uint8Array | string,
        partialMsat?: cln_primitives_pb.Amount.AsObject,
    }
}

export class PayResponse extends jspb.Message { 
    getPaymentPreimage(): Uint8Array | string;
    getPaymentPreimage_asU8(): Uint8Array;
    getPaymentPreimage_asB64(): string;
    setPaymentPreimage(value: Uint8Array | string): PayResponse;

    hasDestination(): boolean;
    clearDestination(): void;
    getDestination(): Uint8Array | string;
    getDestination_asU8(): Uint8Array;
    getDestination_asB64(): string;
    setDestination(value: Uint8Array | string): PayResponse;
    getPaymentHash(): Uint8Array | string;
    getPaymentHash_asU8(): Uint8Array;
    getPaymentHash_asB64(): string;
    setPaymentHash(value: Uint8Array | string): PayResponse;
    getCreatedAt(): number;
    setCreatedAt(value: number): PayResponse;
    getParts(): number;
    setParts(value: number): PayResponse;

    hasAmountMsat(): boolean;
    clearAmountMsat(): void;
    getAmountMsat(): cln_primitives_pb.Amount | undefined;
    setAmountMsat(value?: cln_primitives_pb.Amount): PayResponse;

    hasAmountSentMsat(): boolean;
    clearAmountSentMsat(): void;
    getAmountSentMsat(): cln_primitives_pb.Amount | undefined;
    setAmountSentMsat(value?: cln_primitives_pb.Amount): PayResponse;

    hasWarningPartialCompletion(): boolean;
    clearWarningPartialCompletion(): void;
    getWarningPartialCompletion(): string | undefined;
    setWarningPartialCompletion(value: string): PayResponse;
    getStatus(): PayResponse.PayStatus;
    setStatus(value: PayResponse.PayStatus): PayResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): PayResponse.AsObject;
    static toObject(includeInstance: boolean, msg: PayResponse): PayResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: PayResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): PayResponse;
    static deserializeBinaryFromReader(message: PayResponse, reader: jspb.BinaryReader): PayResponse;
}

export namespace PayResponse {
    export type AsObject = {
        paymentPreimage: Uint8Array | string,
        destination: Uint8Array | string,
        paymentHash: Uint8Array | string,
        createdAt: number,
        parts: number,
        amountMsat?: cln_primitives_pb.Amount.AsObject,
        amountSentMsat?: cln_primitives_pb.Amount.AsObject,
        warningPartialCompletion?: string,
        status: PayResponse.PayStatus,
    }

    export enum PayStatus {
    COMPLETE = 0,
    PENDING = 1,
    FAILED = 2,
    }

}

export class ListnodesRequest extends jspb.Message { 

    hasId(): boolean;
    clearId(): void;
    getId(): Uint8Array | string;
    getId_asU8(): Uint8Array;
    getId_asB64(): string;
    setId(value: Uint8Array | string): ListnodesRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ListnodesRequest.AsObject;
    static toObject(includeInstance: boolean, msg: ListnodesRequest): ListnodesRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ListnodesRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ListnodesRequest;
    static deserializeBinaryFromReader(message: ListnodesRequest, reader: jspb.BinaryReader): ListnodesRequest;
}

export namespace ListnodesRequest {
    export type AsObject = {
        id: Uint8Array | string,
    }
}

export class ListnodesResponse extends jspb.Message { 
    clearNodesList(): void;
    getNodesList(): Array<ListnodesNodes>;
    setNodesList(value: Array<ListnodesNodes>): ListnodesResponse;
    addNodes(value?: ListnodesNodes, index?: number): ListnodesNodes;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ListnodesResponse.AsObject;
    static toObject(includeInstance: boolean, msg: ListnodesResponse): ListnodesResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ListnodesResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ListnodesResponse;
    static deserializeBinaryFromReader(message: ListnodesResponse, reader: jspb.BinaryReader): ListnodesResponse;
}

export namespace ListnodesResponse {
    export type AsObject = {
        nodesList: Array<ListnodesNodes.AsObject>,
    }
}

export class ListnodesNodes extends jspb.Message { 
    getNodeid(): Uint8Array | string;
    getNodeid_asU8(): Uint8Array;
    getNodeid_asB64(): string;
    setNodeid(value: Uint8Array | string): ListnodesNodes;

    hasLastTimestamp(): boolean;
    clearLastTimestamp(): void;
    getLastTimestamp(): number | undefined;
    setLastTimestamp(value: number): ListnodesNodes;

    hasAlias(): boolean;
    clearAlias(): void;
    getAlias(): string | undefined;
    setAlias(value: string): ListnodesNodes;

    hasColor(): boolean;
    clearColor(): void;
    getColor(): Uint8Array | string;
    getColor_asU8(): Uint8Array;
    getColor_asB64(): string;
    setColor(value: Uint8Array | string): ListnodesNodes;

    hasFeatures(): boolean;
    clearFeatures(): void;
    getFeatures(): Uint8Array | string;
    getFeatures_asU8(): Uint8Array;
    getFeatures_asB64(): string;
    setFeatures(value: Uint8Array | string): ListnodesNodes;
    clearAddressesList(): void;
    getAddressesList(): Array<ListnodesNodesAddresses>;
    setAddressesList(value: Array<ListnodesNodesAddresses>): ListnodesNodes;
    addAddresses(value?: ListnodesNodesAddresses, index?: number): ListnodesNodesAddresses;

    hasOptionWillFund(): boolean;
    clearOptionWillFund(): void;
    getOptionWillFund(): ListnodesNodesOption_will_fund | undefined;
    setOptionWillFund(value?: ListnodesNodesOption_will_fund): ListnodesNodes;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ListnodesNodes.AsObject;
    static toObject(includeInstance: boolean, msg: ListnodesNodes): ListnodesNodes.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ListnodesNodes, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ListnodesNodes;
    static deserializeBinaryFromReader(message: ListnodesNodes, reader: jspb.BinaryReader): ListnodesNodes;
}

export namespace ListnodesNodes {
    export type AsObject = {
        nodeid: Uint8Array | string,
        lastTimestamp?: number,
        alias?: string,
        color: Uint8Array | string,
        features: Uint8Array | string,
        addressesList: Array<ListnodesNodesAddresses.AsObject>,
        optionWillFund?: ListnodesNodesOption_will_fund.AsObject,
    }
}

export class ListnodesNodesOption_will_fund extends jspb.Message { 

    hasLeaseFeeBaseMsat(): boolean;
    clearLeaseFeeBaseMsat(): void;
    getLeaseFeeBaseMsat(): cln_primitives_pb.Amount | undefined;
    setLeaseFeeBaseMsat(value?: cln_primitives_pb.Amount): ListnodesNodesOption_will_fund;
    getLeaseFeeBasis(): number;
    setLeaseFeeBasis(value: number): ListnodesNodesOption_will_fund;
    getFundingWeight(): number;
    setFundingWeight(value: number): ListnodesNodesOption_will_fund;

    hasChannelFeeMaxBaseMsat(): boolean;
    clearChannelFeeMaxBaseMsat(): void;
    getChannelFeeMaxBaseMsat(): cln_primitives_pb.Amount | undefined;
    setChannelFeeMaxBaseMsat(value?: cln_primitives_pb.Amount): ListnodesNodesOption_will_fund;
    getChannelFeeMaxProportionalThousandths(): number;
    setChannelFeeMaxProportionalThousandths(value: number): ListnodesNodesOption_will_fund;
    getCompactLease(): Uint8Array | string;
    getCompactLease_asU8(): Uint8Array;
    getCompactLease_asB64(): string;
    setCompactLease(value: Uint8Array | string): ListnodesNodesOption_will_fund;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ListnodesNodesOption_will_fund.AsObject;
    static toObject(includeInstance: boolean, msg: ListnodesNodesOption_will_fund): ListnodesNodesOption_will_fund.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ListnodesNodesOption_will_fund, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ListnodesNodesOption_will_fund;
    static deserializeBinaryFromReader(message: ListnodesNodesOption_will_fund, reader: jspb.BinaryReader): ListnodesNodesOption_will_fund;
}

export namespace ListnodesNodesOption_will_fund {
    export type AsObject = {
        leaseFeeBaseMsat?: cln_primitives_pb.Amount.AsObject,
        leaseFeeBasis: number,
        fundingWeight: number,
        channelFeeMaxBaseMsat?: cln_primitives_pb.Amount.AsObject,
        channelFeeMaxProportionalThousandths: number,
        compactLease: Uint8Array | string,
    }
}

export class ListnodesNodesAddresses extends jspb.Message { 
    getItemType(): ListnodesNodesAddresses.ListnodesNodesAddressesType;
    setItemType(value: ListnodesNodesAddresses.ListnodesNodesAddressesType): ListnodesNodesAddresses;
    getPort(): number;
    setPort(value: number): ListnodesNodesAddresses;

    hasAddress(): boolean;
    clearAddress(): void;
    getAddress(): string | undefined;
    setAddress(value: string): ListnodesNodesAddresses;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ListnodesNodesAddresses.AsObject;
    static toObject(includeInstance: boolean, msg: ListnodesNodesAddresses): ListnodesNodesAddresses.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ListnodesNodesAddresses, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ListnodesNodesAddresses;
    static deserializeBinaryFromReader(message: ListnodesNodesAddresses, reader: jspb.BinaryReader): ListnodesNodesAddresses;
}

export namespace ListnodesNodesAddresses {
    export type AsObject = {
        itemType: ListnodesNodesAddresses.ListnodesNodesAddressesType,
        port: number,
        address?: string,
    }

    export enum ListnodesNodesAddressesType {
    DNS = 0,
    IPV4 = 1,
    IPV6 = 2,
    TORV2 = 3,
    TORV3 = 4,
    }

}

export class WaitanyinvoiceRequest extends jspb.Message { 

    hasLastpayIndex(): boolean;
    clearLastpayIndex(): void;
    getLastpayIndex(): number | undefined;
    setLastpayIndex(value: number): WaitanyinvoiceRequest;

    hasTimeout(): boolean;
    clearTimeout(): void;
    getTimeout(): number | undefined;
    setTimeout(value: number): WaitanyinvoiceRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): WaitanyinvoiceRequest.AsObject;
    static toObject(includeInstance: boolean, msg: WaitanyinvoiceRequest): WaitanyinvoiceRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: WaitanyinvoiceRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): WaitanyinvoiceRequest;
    static deserializeBinaryFromReader(message: WaitanyinvoiceRequest, reader: jspb.BinaryReader): WaitanyinvoiceRequest;
}

export namespace WaitanyinvoiceRequest {
    export type AsObject = {
        lastpayIndex?: number,
        timeout?: number,
    }
}

export class WaitanyinvoiceResponse extends jspb.Message { 
    getLabel(): string;
    setLabel(value: string): WaitanyinvoiceResponse;

    hasDescription(): boolean;
    clearDescription(): void;
    getDescription(): string | undefined;
    setDescription(value: string): WaitanyinvoiceResponse;
    getPaymentHash(): Uint8Array | string;
    getPaymentHash_asU8(): Uint8Array;
    getPaymentHash_asB64(): string;
    setPaymentHash(value: Uint8Array | string): WaitanyinvoiceResponse;
    getStatus(): WaitanyinvoiceResponse.WaitanyinvoiceStatus;
    setStatus(value: WaitanyinvoiceResponse.WaitanyinvoiceStatus): WaitanyinvoiceResponse;
    getExpiresAt(): number;
    setExpiresAt(value: number): WaitanyinvoiceResponse;

    hasAmountMsat(): boolean;
    clearAmountMsat(): void;
    getAmountMsat(): cln_primitives_pb.Amount | undefined;
    setAmountMsat(value?: cln_primitives_pb.Amount): WaitanyinvoiceResponse;

    hasBolt11(): boolean;
    clearBolt11(): void;
    getBolt11(): string | undefined;
    setBolt11(value: string): WaitanyinvoiceResponse;

    hasBolt12(): boolean;
    clearBolt12(): void;
    getBolt12(): string | undefined;
    setBolt12(value: string): WaitanyinvoiceResponse;

    hasPayIndex(): boolean;
    clearPayIndex(): void;
    getPayIndex(): number | undefined;
    setPayIndex(value: number): WaitanyinvoiceResponse;

    hasAmountReceivedMsat(): boolean;
    clearAmountReceivedMsat(): void;
    getAmountReceivedMsat(): cln_primitives_pb.Amount | undefined;
    setAmountReceivedMsat(value?: cln_primitives_pb.Amount): WaitanyinvoiceResponse;

    hasPaidAt(): boolean;
    clearPaidAt(): void;
    getPaidAt(): number | undefined;
    setPaidAt(value: number): WaitanyinvoiceResponse;

    hasPaymentPreimage(): boolean;
    clearPaymentPreimage(): void;
    getPaymentPreimage(): Uint8Array | string;
    getPaymentPreimage_asU8(): Uint8Array;
    getPaymentPreimage_asB64(): string;
    setPaymentPreimage(value: Uint8Array | string): WaitanyinvoiceResponse;

    hasCreatedIndex(): boolean;
    clearCreatedIndex(): void;
    getCreatedIndex(): number | undefined;
    setCreatedIndex(value: number): WaitanyinvoiceResponse;

    hasUpdatedIndex(): boolean;
    clearUpdatedIndex(): void;
    getUpdatedIndex(): number | undefined;
    setUpdatedIndex(value: number): WaitanyinvoiceResponse;

    hasPaidOutpoint(): boolean;
    clearPaidOutpoint(): void;
    getPaidOutpoint(): WaitanyinvoicePaid_outpoint | undefined;
    setPaidOutpoint(value?: WaitanyinvoicePaid_outpoint): WaitanyinvoiceResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): WaitanyinvoiceResponse.AsObject;
    static toObject(includeInstance: boolean, msg: WaitanyinvoiceResponse): WaitanyinvoiceResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: WaitanyinvoiceResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): WaitanyinvoiceResponse;
    static deserializeBinaryFromReader(message: WaitanyinvoiceResponse, reader: jspb.BinaryReader): WaitanyinvoiceResponse;
}

export namespace WaitanyinvoiceResponse {
    export type AsObject = {
        label: string,
        description?: string,
        paymentHash: Uint8Array | string,
        status: WaitanyinvoiceResponse.WaitanyinvoiceStatus,
        expiresAt: number,
        amountMsat?: cln_primitives_pb.Amount.AsObject,
        bolt11?: string,
        bolt12?: string,
        payIndex?: number,
        amountReceivedMsat?: cln_primitives_pb.Amount.AsObject,
        paidAt?: number,
        paymentPreimage: Uint8Array | string,
        createdIndex?: number,
        updatedIndex?: number,
        paidOutpoint?: WaitanyinvoicePaid_outpoint.AsObject,
    }

    export enum WaitanyinvoiceStatus {
    PAID = 0,
    EXPIRED = 1,
    }

}

export class WaitanyinvoicePaid_outpoint extends jspb.Message { 
    getTxid(): Uint8Array | string;
    getTxid_asU8(): Uint8Array;
    getTxid_asB64(): string;
    setTxid(value: Uint8Array | string): WaitanyinvoicePaid_outpoint;
    getOutnum(): number;
    setOutnum(value: number): WaitanyinvoicePaid_outpoint;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): WaitanyinvoicePaid_outpoint.AsObject;
    static toObject(includeInstance: boolean, msg: WaitanyinvoicePaid_outpoint): WaitanyinvoicePaid_outpoint.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: WaitanyinvoicePaid_outpoint, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): WaitanyinvoicePaid_outpoint;
    static deserializeBinaryFromReader(message: WaitanyinvoicePaid_outpoint, reader: jspb.BinaryReader): WaitanyinvoicePaid_outpoint;
}

export namespace WaitanyinvoicePaid_outpoint {
    export type AsObject = {
        txid: Uint8Array | string,
        outnum: number,
    }
}

export class WaitinvoiceRequest extends jspb.Message { 
    getLabel(): string;
    setLabel(value: string): WaitinvoiceRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): WaitinvoiceRequest.AsObject;
    static toObject(includeInstance: boolean, msg: WaitinvoiceRequest): WaitinvoiceRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: WaitinvoiceRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): WaitinvoiceRequest;
    static deserializeBinaryFromReader(message: WaitinvoiceRequest, reader: jspb.BinaryReader): WaitinvoiceRequest;
}

export namespace WaitinvoiceRequest {
    export type AsObject = {
        label: string,
    }
}

export class WaitinvoiceResponse extends jspb.Message { 
    getLabel(): string;
    setLabel(value: string): WaitinvoiceResponse;

    hasDescription(): boolean;
    clearDescription(): void;
    getDescription(): string | undefined;
    setDescription(value: string): WaitinvoiceResponse;
    getPaymentHash(): Uint8Array | string;
    getPaymentHash_asU8(): Uint8Array;
    getPaymentHash_asB64(): string;
    setPaymentHash(value: Uint8Array | string): WaitinvoiceResponse;
    getStatus(): WaitinvoiceResponse.WaitinvoiceStatus;
    setStatus(value: WaitinvoiceResponse.WaitinvoiceStatus): WaitinvoiceResponse;
    getExpiresAt(): number;
    setExpiresAt(value: number): WaitinvoiceResponse;

    hasAmountMsat(): boolean;
    clearAmountMsat(): void;
    getAmountMsat(): cln_primitives_pb.Amount | undefined;
    setAmountMsat(value?: cln_primitives_pb.Amount): WaitinvoiceResponse;

    hasBolt11(): boolean;
    clearBolt11(): void;
    getBolt11(): string | undefined;
    setBolt11(value: string): WaitinvoiceResponse;

    hasBolt12(): boolean;
    clearBolt12(): void;
    getBolt12(): string | undefined;
    setBolt12(value: string): WaitinvoiceResponse;

    hasPayIndex(): boolean;
    clearPayIndex(): void;
    getPayIndex(): number | undefined;
    setPayIndex(value: number): WaitinvoiceResponse;

    hasAmountReceivedMsat(): boolean;
    clearAmountReceivedMsat(): void;
    getAmountReceivedMsat(): cln_primitives_pb.Amount | undefined;
    setAmountReceivedMsat(value?: cln_primitives_pb.Amount): WaitinvoiceResponse;

    hasPaidAt(): boolean;
    clearPaidAt(): void;
    getPaidAt(): number | undefined;
    setPaidAt(value: number): WaitinvoiceResponse;

    hasPaymentPreimage(): boolean;
    clearPaymentPreimage(): void;
    getPaymentPreimage(): Uint8Array | string;
    getPaymentPreimage_asU8(): Uint8Array;
    getPaymentPreimage_asB64(): string;
    setPaymentPreimage(value: Uint8Array | string): WaitinvoiceResponse;

    hasCreatedIndex(): boolean;
    clearCreatedIndex(): void;
    getCreatedIndex(): number | undefined;
    setCreatedIndex(value: number): WaitinvoiceResponse;

    hasUpdatedIndex(): boolean;
    clearUpdatedIndex(): void;
    getUpdatedIndex(): number | undefined;
    setUpdatedIndex(value: number): WaitinvoiceResponse;

    hasPaidOutpoint(): boolean;
    clearPaidOutpoint(): void;
    getPaidOutpoint(): WaitinvoicePaid_outpoint | undefined;
    setPaidOutpoint(value?: WaitinvoicePaid_outpoint): WaitinvoiceResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): WaitinvoiceResponse.AsObject;
    static toObject(includeInstance: boolean, msg: WaitinvoiceResponse): WaitinvoiceResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: WaitinvoiceResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): WaitinvoiceResponse;
    static deserializeBinaryFromReader(message: WaitinvoiceResponse, reader: jspb.BinaryReader): WaitinvoiceResponse;
}

export namespace WaitinvoiceResponse {
    export type AsObject = {
        label: string,
        description?: string,
        paymentHash: Uint8Array | string,
        status: WaitinvoiceResponse.WaitinvoiceStatus,
        expiresAt: number,
        amountMsat?: cln_primitives_pb.Amount.AsObject,
        bolt11?: string,
        bolt12?: string,
        payIndex?: number,
        amountReceivedMsat?: cln_primitives_pb.Amount.AsObject,
        paidAt?: number,
        paymentPreimage: Uint8Array | string,
        createdIndex?: number,
        updatedIndex?: number,
        paidOutpoint?: WaitinvoicePaid_outpoint.AsObject,
    }

    export enum WaitinvoiceStatus {
    PAID = 0,
    EXPIRED = 1,
    }

}

export class WaitinvoicePaid_outpoint extends jspb.Message { 
    getTxid(): Uint8Array | string;
    getTxid_asU8(): Uint8Array;
    getTxid_asB64(): string;
    setTxid(value: Uint8Array | string): WaitinvoicePaid_outpoint;
    getOutnum(): number;
    setOutnum(value: number): WaitinvoicePaid_outpoint;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): WaitinvoicePaid_outpoint.AsObject;
    static toObject(includeInstance: boolean, msg: WaitinvoicePaid_outpoint): WaitinvoicePaid_outpoint.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: WaitinvoicePaid_outpoint, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): WaitinvoicePaid_outpoint;
    static deserializeBinaryFromReader(message: WaitinvoicePaid_outpoint, reader: jspb.BinaryReader): WaitinvoicePaid_outpoint;
}

export namespace WaitinvoicePaid_outpoint {
    export type AsObject = {
        txid: Uint8Array | string,
        outnum: number,
    }
}

export class WaitsendpayRequest extends jspb.Message { 
    getPaymentHash(): Uint8Array | string;
    getPaymentHash_asU8(): Uint8Array;
    getPaymentHash_asB64(): string;
    setPaymentHash(value: Uint8Array | string): WaitsendpayRequest;

    hasPartid(): boolean;
    clearPartid(): void;
    getPartid(): number | undefined;
    setPartid(value: number): WaitsendpayRequest;

    hasTimeout(): boolean;
    clearTimeout(): void;
    getTimeout(): number | undefined;
    setTimeout(value: number): WaitsendpayRequest;

    hasGroupid(): boolean;
    clearGroupid(): void;
    getGroupid(): number | undefined;
    setGroupid(value: number): WaitsendpayRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): WaitsendpayRequest.AsObject;
    static toObject(includeInstance: boolean, msg: WaitsendpayRequest): WaitsendpayRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: WaitsendpayRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): WaitsendpayRequest;
    static deserializeBinaryFromReader(message: WaitsendpayRequest, reader: jspb.BinaryReader): WaitsendpayRequest;
}

export namespace WaitsendpayRequest {
    export type AsObject = {
        paymentHash: Uint8Array | string,
        partid?: number,
        timeout?: number,
        groupid?: number,
    }
}

export class WaitsendpayResponse extends jspb.Message { 
    getId(): number;
    setId(value: number): WaitsendpayResponse;

    hasGroupid(): boolean;
    clearGroupid(): void;
    getGroupid(): number | undefined;
    setGroupid(value: number): WaitsendpayResponse;
    getPaymentHash(): Uint8Array | string;
    getPaymentHash_asU8(): Uint8Array;
    getPaymentHash_asB64(): string;
    setPaymentHash(value: Uint8Array | string): WaitsendpayResponse;
    getStatus(): WaitsendpayResponse.WaitsendpayStatus;
    setStatus(value: WaitsendpayResponse.WaitsendpayStatus): WaitsendpayResponse;

    hasAmountMsat(): boolean;
    clearAmountMsat(): void;
    getAmountMsat(): cln_primitives_pb.Amount | undefined;
    setAmountMsat(value?: cln_primitives_pb.Amount): WaitsendpayResponse;

    hasDestination(): boolean;
    clearDestination(): void;
    getDestination(): Uint8Array | string;
    getDestination_asU8(): Uint8Array;
    getDestination_asB64(): string;
    setDestination(value: Uint8Array | string): WaitsendpayResponse;
    getCreatedAt(): number;
    setCreatedAt(value: number): WaitsendpayResponse;

    hasAmountSentMsat(): boolean;
    clearAmountSentMsat(): void;
    getAmountSentMsat(): cln_primitives_pb.Amount | undefined;
    setAmountSentMsat(value?: cln_primitives_pb.Amount): WaitsendpayResponse;

    hasLabel(): boolean;
    clearLabel(): void;
    getLabel(): string | undefined;
    setLabel(value: string): WaitsendpayResponse;

    hasPartid(): boolean;
    clearPartid(): void;
    getPartid(): number | undefined;
    setPartid(value: number): WaitsendpayResponse;

    hasBolt11(): boolean;
    clearBolt11(): void;
    getBolt11(): string | undefined;
    setBolt11(value: string): WaitsendpayResponse;

    hasBolt12(): boolean;
    clearBolt12(): void;
    getBolt12(): string | undefined;
    setBolt12(value: string): WaitsendpayResponse;

    hasPaymentPreimage(): boolean;
    clearPaymentPreimage(): void;
    getPaymentPreimage(): Uint8Array | string;
    getPaymentPreimage_asU8(): Uint8Array;
    getPaymentPreimage_asB64(): string;
    setPaymentPreimage(value: Uint8Array | string): WaitsendpayResponse;

    hasCompletedAt(): boolean;
    clearCompletedAt(): void;
    getCompletedAt(): number | undefined;
    setCompletedAt(value: number): WaitsendpayResponse;

    hasCreatedIndex(): boolean;
    clearCreatedIndex(): void;
    getCreatedIndex(): number | undefined;
    setCreatedIndex(value: number): WaitsendpayResponse;

    hasUpdatedIndex(): boolean;
    clearUpdatedIndex(): void;
    getUpdatedIndex(): number | undefined;
    setUpdatedIndex(value: number): WaitsendpayResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): WaitsendpayResponse.AsObject;
    static toObject(includeInstance: boolean, msg: WaitsendpayResponse): WaitsendpayResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: WaitsendpayResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): WaitsendpayResponse;
    static deserializeBinaryFromReader(message: WaitsendpayResponse, reader: jspb.BinaryReader): WaitsendpayResponse;
}

export namespace WaitsendpayResponse {
    export type AsObject = {
        id: number,
        groupid?: number,
        paymentHash: Uint8Array | string,
        status: WaitsendpayResponse.WaitsendpayStatus,
        amountMsat?: cln_primitives_pb.Amount.AsObject,
        destination: Uint8Array | string,
        createdAt: number,
        amountSentMsat?: cln_primitives_pb.Amount.AsObject,
        label?: string,
        partid?: number,
        bolt11?: string,
        bolt12?: string,
        paymentPreimage: Uint8Array | string,
        completedAt?: number,
        createdIndex?: number,
        updatedIndex?: number,
    }

    export enum WaitsendpayStatus {
    COMPLETE = 0,
    }

}

export class NewaddrRequest extends jspb.Message { 

    hasAddresstype(): boolean;
    clearAddresstype(): void;
    getAddresstype(): NewaddrRequest.NewaddrAddresstype | undefined;
    setAddresstype(value: NewaddrRequest.NewaddrAddresstype): NewaddrRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): NewaddrRequest.AsObject;
    static toObject(includeInstance: boolean, msg: NewaddrRequest): NewaddrRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: NewaddrRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): NewaddrRequest;
    static deserializeBinaryFromReader(message: NewaddrRequest, reader: jspb.BinaryReader): NewaddrRequest;
}

export namespace NewaddrRequest {
    export type AsObject = {
        addresstype?: NewaddrRequest.NewaddrAddresstype,
    }

    export enum NewaddrAddresstype {
    BECH32 = 0,
    ALL = 2,
    P2TR = 3,
    }

}

export class NewaddrResponse extends jspb.Message { 

    hasBech32(): boolean;
    clearBech32(): void;
    getBech32(): string | undefined;
    setBech32(value: string): NewaddrResponse;

    hasP2tr(): boolean;
    clearP2tr(): void;
    getP2tr(): string | undefined;
    setP2tr(value: string): NewaddrResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): NewaddrResponse.AsObject;
    static toObject(includeInstance: boolean, msg: NewaddrResponse): NewaddrResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: NewaddrResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): NewaddrResponse;
    static deserializeBinaryFromReader(message: NewaddrResponse, reader: jspb.BinaryReader): NewaddrResponse;
}

export namespace NewaddrResponse {
    export type AsObject = {
        bech32?: string,
        p2tr?: string,
    }
}

export class WithdrawRequest extends jspb.Message { 
    getDestination(): string;
    setDestination(value: string): WithdrawRequest;

    hasSatoshi(): boolean;
    clearSatoshi(): void;
    getSatoshi(): cln_primitives_pb.AmountOrAll | undefined;
    setSatoshi(value?: cln_primitives_pb.AmountOrAll): WithdrawRequest;

    hasMinconf(): boolean;
    clearMinconf(): void;
    getMinconf(): number | undefined;
    setMinconf(value: number): WithdrawRequest;
    clearUtxosList(): void;
    getUtxosList(): Array<cln_primitives_pb.Outpoint>;
    setUtxosList(value: Array<cln_primitives_pb.Outpoint>): WithdrawRequest;
    addUtxos(value?: cln_primitives_pb.Outpoint, index?: number): cln_primitives_pb.Outpoint;

    hasFeerate(): boolean;
    clearFeerate(): void;
    getFeerate(): cln_primitives_pb.Feerate | undefined;
    setFeerate(value?: cln_primitives_pb.Feerate): WithdrawRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): WithdrawRequest.AsObject;
    static toObject(includeInstance: boolean, msg: WithdrawRequest): WithdrawRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: WithdrawRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): WithdrawRequest;
    static deserializeBinaryFromReader(message: WithdrawRequest, reader: jspb.BinaryReader): WithdrawRequest;
}

export namespace WithdrawRequest {
    export type AsObject = {
        destination: string,
        satoshi?: cln_primitives_pb.AmountOrAll.AsObject,
        minconf?: number,
        utxosList: Array<cln_primitives_pb.Outpoint.AsObject>,
        feerate?: cln_primitives_pb.Feerate.AsObject,
    }
}

export class WithdrawResponse extends jspb.Message { 
    getTx(): Uint8Array | string;
    getTx_asU8(): Uint8Array;
    getTx_asB64(): string;
    setTx(value: Uint8Array | string): WithdrawResponse;
    getTxid(): Uint8Array | string;
    getTxid_asU8(): Uint8Array;
    getTxid_asB64(): string;
    setTxid(value: Uint8Array | string): WithdrawResponse;
    getPsbt(): string;
    setPsbt(value: string): WithdrawResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): WithdrawResponse.AsObject;
    static toObject(includeInstance: boolean, msg: WithdrawResponse): WithdrawResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: WithdrawResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): WithdrawResponse;
    static deserializeBinaryFromReader(message: WithdrawResponse, reader: jspb.BinaryReader): WithdrawResponse;
}

export namespace WithdrawResponse {
    export type AsObject = {
        tx: Uint8Array | string,
        txid: Uint8Array | string,
        psbt: string,
    }
}

export class KeysendRequest extends jspb.Message { 
    getDestination(): Uint8Array | string;
    getDestination_asU8(): Uint8Array;
    getDestination_asB64(): string;
    setDestination(value: Uint8Array | string): KeysendRequest;

    hasLabel(): boolean;
    clearLabel(): void;
    getLabel(): string | undefined;
    setLabel(value: string): KeysendRequest;

    hasMaxfeepercent(): boolean;
    clearMaxfeepercent(): void;
    getMaxfeepercent(): number | undefined;
    setMaxfeepercent(value: number): KeysendRequest;

    hasRetryFor(): boolean;
    clearRetryFor(): void;
    getRetryFor(): number | undefined;
    setRetryFor(value: number): KeysendRequest;

    hasMaxdelay(): boolean;
    clearMaxdelay(): void;
    getMaxdelay(): number | undefined;
    setMaxdelay(value: number): KeysendRequest;

    hasExemptfee(): boolean;
    clearExemptfee(): void;
    getExemptfee(): cln_primitives_pb.Amount | undefined;
    setExemptfee(value?: cln_primitives_pb.Amount): KeysendRequest;

    hasRoutehints(): boolean;
    clearRoutehints(): void;
    getRoutehints(): cln_primitives_pb.RoutehintList | undefined;
    setRoutehints(value?: cln_primitives_pb.RoutehintList): KeysendRequest;

    hasExtratlvs(): boolean;
    clearExtratlvs(): void;
    getExtratlvs(): cln_primitives_pb.TlvStream | undefined;
    setExtratlvs(value?: cln_primitives_pb.TlvStream): KeysendRequest;

    hasAmountMsat(): boolean;
    clearAmountMsat(): void;
    getAmountMsat(): cln_primitives_pb.Amount | undefined;
    setAmountMsat(value?: cln_primitives_pb.Amount): KeysendRequest;

    hasMaxfee(): boolean;
    clearMaxfee(): void;
    getMaxfee(): cln_primitives_pb.Amount | undefined;
    setMaxfee(value?: cln_primitives_pb.Amount): KeysendRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): KeysendRequest.AsObject;
    static toObject(includeInstance: boolean, msg: KeysendRequest): KeysendRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: KeysendRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): KeysendRequest;
    static deserializeBinaryFromReader(message: KeysendRequest, reader: jspb.BinaryReader): KeysendRequest;
}

export namespace KeysendRequest {
    export type AsObject = {
        destination: Uint8Array | string,
        label?: string,
        maxfeepercent?: number,
        retryFor?: number,
        maxdelay?: number,
        exemptfee?: cln_primitives_pb.Amount.AsObject,
        routehints?: cln_primitives_pb.RoutehintList.AsObject,
        extratlvs?: cln_primitives_pb.TlvStream.AsObject,
        amountMsat?: cln_primitives_pb.Amount.AsObject,
        maxfee?: cln_primitives_pb.Amount.AsObject,
    }
}

export class KeysendResponse extends jspb.Message { 
    getPaymentPreimage(): Uint8Array | string;
    getPaymentPreimage_asU8(): Uint8Array;
    getPaymentPreimage_asB64(): string;
    setPaymentPreimage(value: Uint8Array | string): KeysendResponse;

    hasDestination(): boolean;
    clearDestination(): void;
    getDestination(): Uint8Array | string;
    getDestination_asU8(): Uint8Array;
    getDestination_asB64(): string;
    setDestination(value: Uint8Array | string): KeysendResponse;
    getPaymentHash(): Uint8Array | string;
    getPaymentHash_asU8(): Uint8Array;
    getPaymentHash_asB64(): string;
    setPaymentHash(value: Uint8Array | string): KeysendResponse;
    getCreatedAt(): number;
    setCreatedAt(value: number): KeysendResponse;
    getParts(): number;
    setParts(value: number): KeysendResponse;

    hasAmountMsat(): boolean;
    clearAmountMsat(): void;
    getAmountMsat(): cln_primitives_pb.Amount | undefined;
    setAmountMsat(value?: cln_primitives_pb.Amount): KeysendResponse;

    hasAmountSentMsat(): boolean;
    clearAmountSentMsat(): void;
    getAmountSentMsat(): cln_primitives_pb.Amount | undefined;
    setAmountSentMsat(value?: cln_primitives_pb.Amount): KeysendResponse;

    hasWarningPartialCompletion(): boolean;
    clearWarningPartialCompletion(): void;
    getWarningPartialCompletion(): string | undefined;
    setWarningPartialCompletion(value: string): KeysendResponse;
    getStatus(): KeysendResponse.KeysendStatus;
    setStatus(value: KeysendResponse.KeysendStatus): KeysendResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): KeysendResponse.AsObject;
    static toObject(includeInstance: boolean, msg: KeysendResponse): KeysendResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: KeysendResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): KeysendResponse;
    static deserializeBinaryFromReader(message: KeysendResponse, reader: jspb.BinaryReader): KeysendResponse;
}

export namespace KeysendResponse {
    export type AsObject = {
        paymentPreimage: Uint8Array | string,
        destination: Uint8Array | string,
        paymentHash: Uint8Array | string,
        createdAt: number,
        parts: number,
        amountMsat?: cln_primitives_pb.Amount.AsObject,
        amountSentMsat?: cln_primitives_pb.Amount.AsObject,
        warningPartialCompletion?: string,
        status: KeysendResponse.KeysendStatus,
    }

    export enum KeysendStatus {
    COMPLETE = 0,
    }

}

export class FundpsbtRequest extends jspb.Message { 

    hasSatoshi(): boolean;
    clearSatoshi(): void;
    getSatoshi(): cln_primitives_pb.AmountOrAll | undefined;
    setSatoshi(value?: cln_primitives_pb.AmountOrAll): FundpsbtRequest;

    hasFeerate(): boolean;
    clearFeerate(): void;
    getFeerate(): cln_primitives_pb.Feerate | undefined;
    setFeerate(value?: cln_primitives_pb.Feerate): FundpsbtRequest;
    getStartweight(): number;
    setStartweight(value: number): FundpsbtRequest;

    hasMinconf(): boolean;
    clearMinconf(): void;
    getMinconf(): number | undefined;
    setMinconf(value: number): FundpsbtRequest;

    hasReserve(): boolean;
    clearReserve(): void;
    getReserve(): number | undefined;
    setReserve(value: number): FundpsbtRequest;

    hasLocktime(): boolean;
    clearLocktime(): void;
    getLocktime(): number | undefined;
    setLocktime(value: number): FundpsbtRequest;

    hasMinWitnessWeight(): boolean;
    clearMinWitnessWeight(): void;
    getMinWitnessWeight(): number | undefined;
    setMinWitnessWeight(value: number): FundpsbtRequest;

    hasExcessAsChange(): boolean;
    clearExcessAsChange(): void;
    getExcessAsChange(): boolean | undefined;
    setExcessAsChange(value: boolean): FundpsbtRequest;

    hasNonwrapped(): boolean;
    clearNonwrapped(): void;
    getNonwrapped(): boolean | undefined;
    setNonwrapped(value: boolean): FundpsbtRequest;

    hasOpeningAnchorChannel(): boolean;
    clearOpeningAnchorChannel(): void;
    getOpeningAnchorChannel(): boolean | undefined;
    setOpeningAnchorChannel(value: boolean): FundpsbtRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): FundpsbtRequest.AsObject;
    static toObject(includeInstance: boolean, msg: FundpsbtRequest): FundpsbtRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: FundpsbtRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): FundpsbtRequest;
    static deserializeBinaryFromReader(message: FundpsbtRequest, reader: jspb.BinaryReader): FundpsbtRequest;
}

export namespace FundpsbtRequest {
    export type AsObject = {
        satoshi?: cln_primitives_pb.AmountOrAll.AsObject,
        feerate?: cln_primitives_pb.Feerate.AsObject,
        startweight: number,
        minconf?: number,
        reserve?: number,
        locktime?: number,
        minWitnessWeight?: number,
        excessAsChange?: boolean,
        nonwrapped?: boolean,
        openingAnchorChannel?: boolean,
    }
}

export class FundpsbtResponse extends jspb.Message { 
    getPsbt(): string;
    setPsbt(value: string): FundpsbtResponse;
    getFeeratePerKw(): number;
    setFeeratePerKw(value: number): FundpsbtResponse;
    getEstimatedFinalWeight(): number;
    setEstimatedFinalWeight(value: number): FundpsbtResponse;

    hasExcessMsat(): boolean;
    clearExcessMsat(): void;
    getExcessMsat(): cln_primitives_pb.Amount | undefined;
    setExcessMsat(value?: cln_primitives_pb.Amount): FundpsbtResponse;

    hasChangeOutnum(): boolean;
    clearChangeOutnum(): void;
    getChangeOutnum(): number | undefined;
    setChangeOutnum(value: number): FundpsbtResponse;
    clearReservationsList(): void;
    getReservationsList(): Array<FundpsbtReservations>;
    setReservationsList(value: Array<FundpsbtReservations>): FundpsbtResponse;
    addReservations(value?: FundpsbtReservations, index?: number): FundpsbtReservations;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): FundpsbtResponse.AsObject;
    static toObject(includeInstance: boolean, msg: FundpsbtResponse): FundpsbtResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: FundpsbtResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): FundpsbtResponse;
    static deserializeBinaryFromReader(message: FundpsbtResponse, reader: jspb.BinaryReader): FundpsbtResponse;
}

export namespace FundpsbtResponse {
    export type AsObject = {
        psbt: string,
        feeratePerKw: number,
        estimatedFinalWeight: number,
        excessMsat?: cln_primitives_pb.Amount.AsObject,
        changeOutnum?: number,
        reservationsList: Array<FundpsbtReservations.AsObject>,
    }
}

export class FundpsbtReservations extends jspb.Message { 
    getTxid(): Uint8Array | string;
    getTxid_asU8(): Uint8Array;
    getTxid_asB64(): string;
    setTxid(value: Uint8Array | string): FundpsbtReservations;
    getVout(): number;
    setVout(value: number): FundpsbtReservations;
    getWasReserved(): boolean;
    setWasReserved(value: boolean): FundpsbtReservations;
    getReserved(): boolean;
    setReserved(value: boolean): FundpsbtReservations;
    getReservedToBlock(): number;
    setReservedToBlock(value: number): FundpsbtReservations;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): FundpsbtReservations.AsObject;
    static toObject(includeInstance: boolean, msg: FundpsbtReservations): FundpsbtReservations.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: FundpsbtReservations, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): FundpsbtReservations;
    static deserializeBinaryFromReader(message: FundpsbtReservations, reader: jspb.BinaryReader): FundpsbtReservations;
}

export namespace FundpsbtReservations {
    export type AsObject = {
        txid: Uint8Array | string,
        vout: number,
        wasReserved: boolean,
        reserved: boolean,
        reservedToBlock: number,
    }
}

export class SendpsbtRequest extends jspb.Message { 
    getPsbt(): string;
    setPsbt(value: string): SendpsbtRequest;

    hasReserve(): boolean;
    clearReserve(): void;
    getReserve(): number | undefined;
    setReserve(value: number): SendpsbtRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): SendpsbtRequest.AsObject;
    static toObject(includeInstance: boolean, msg: SendpsbtRequest): SendpsbtRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: SendpsbtRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): SendpsbtRequest;
    static deserializeBinaryFromReader(message: SendpsbtRequest, reader: jspb.BinaryReader): SendpsbtRequest;
}

export namespace SendpsbtRequest {
    export type AsObject = {
        psbt: string,
        reserve?: number,
    }
}

export class SendpsbtResponse extends jspb.Message { 
    getTx(): Uint8Array | string;
    getTx_asU8(): Uint8Array;
    getTx_asB64(): string;
    setTx(value: Uint8Array | string): SendpsbtResponse;
    getTxid(): Uint8Array | string;
    getTxid_asU8(): Uint8Array;
    getTxid_asB64(): string;
    setTxid(value: Uint8Array | string): SendpsbtResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): SendpsbtResponse.AsObject;
    static toObject(includeInstance: boolean, msg: SendpsbtResponse): SendpsbtResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: SendpsbtResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): SendpsbtResponse;
    static deserializeBinaryFromReader(message: SendpsbtResponse, reader: jspb.BinaryReader): SendpsbtResponse;
}

export namespace SendpsbtResponse {
    export type AsObject = {
        tx: Uint8Array | string,
        txid: Uint8Array | string,
    }
}

export class SignpsbtRequest extends jspb.Message { 
    getPsbt(): string;
    setPsbt(value: string): SignpsbtRequest;
    clearSignonlyList(): void;
    getSignonlyList(): Array<number>;
    setSignonlyList(value: Array<number>): SignpsbtRequest;
    addSignonly(value: number, index?: number): number;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): SignpsbtRequest.AsObject;
    static toObject(includeInstance: boolean, msg: SignpsbtRequest): SignpsbtRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: SignpsbtRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): SignpsbtRequest;
    static deserializeBinaryFromReader(message: SignpsbtRequest, reader: jspb.BinaryReader): SignpsbtRequest;
}

export namespace SignpsbtRequest {
    export type AsObject = {
        psbt: string,
        signonlyList: Array<number>,
    }
}

export class SignpsbtResponse extends jspb.Message { 
    getSignedPsbt(): string;
    setSignedPsbt(value: string): SignpsbtResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): SignpsbtResponse.AsObject;
    static toObject(includeInstance: boolean, msg: SignpsbtResponse): SignpsbtResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: SignpsbtResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): SignpsbtResponse;
    static deserializeBinaryFromReader(message: SignpsbtResponse, reader: jspb.BinaryReader): SignpsbtResponse;
}

export namespace SignpsbtResponse {
    export type AsObject = {
        signedPsbt: string,
    }
}

export class UtxopsbtRequest extends jspb.Message { 

    hasSatoshi(): boolean;
    clearSatoshi(): void;
    getSatoshi(): cln_primitives_pb.AmountOrAll | undefined;
    setSatoshi(value?: cln_primitives_pb.AmountOrAll): UtxopsbtRequest;

    hasFeerate(): boolean;
    clearFeerate(): void;
    getFeerate(): cln_primitives_pb.Feerate | undefined;
    setFeerate(value?: cln_primitives_pb.Feerate): UtxopsbtRequest;
    getStartweight(): number;
    setStartweight(value: number): UtxopsbtRequest;
    clearUtxosList(): void;
    getUtxosList(): Array<cln_primitives_pb.Outpoint>;
    setUtxosList(value: Array<cln_primitives_pb.Outpoint>): UtxopsbtRequest;
    addUtxos(value?: cln_primitives_pb.Outpoint, index?: number): cln_primitives_pb.Outpoint;

    hasReserve(): boolean;
    clearReserve(): void;
    getReserve(): number | undefined;
    setReserve(value: number): UtxopsbtRequest;

    hasLocktime(): boolean;
    clearLocktime(): void;
    getLocktime(): number | undefined;
    setLocktime(value: number): UtxopsbtRequest;

    hasMinWitnessWeight(): boolean;
    clearMinWitnessWeight(): void;
    getMinWitnessWeight(): number | undefined;
    setMinWitnessWeight(value: number): UtxopsbtRequest;

    hasReservedok(): boolean;
    clearReservedok(): void;
    getReservedok(): boolean | undefined;
    setReservedok(value: boolean): UtxopsbtRequest;

    hasExcessAsChange(): boolean;
    clearExcessAsChange(): void;
    getExcessAsChange(): boolean | undefined;
    setExcessAsChange(value: boolean): UtxopsbtRequest;

    hasOpeningAnchorChannel(): boolean;
    clearOpeningAnchorChannel(): void;
    getOpeningAnchorChannel(): boolean | undefined;
    setOpeningAnchorChannel(value: boolean): UtxopsbtRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): UtxopsbtRequest.AsObject;
    static toObject(includeInstance: boolean, msg: UtxopsbtRequest): UtxopsbtRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: UtxopsbtRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): UtxopsbtRequest;
    static deserializeBinaryFromReader(message: UtxopsbtRequest, reader: jspb.BinaryReader): UtxopsbtRequest;
}

export namespace UtxopsbtRequest {
    export type AsObject = {
        satoshi?: cln_primitives_pb.AmountOrAll.AsObject,
        feerate?: cln_primitives_pb.Feerate.AsObject,
        startweight: number,
        utxosList: Array<cln_primitives_pb.Outpoint.AsObject>,
        reserve?: number,
        locktime?: number,
        minWitnessWeight?: number,
        reservedok?: boolean,
        excessAsChange?: boolean,
        openingAnchorChannel?: boolean,
    }
}

export class UtxopsbtResponse extends jspb.Message { 
    getPsbt(): string;
    setPsbt(value: string): UtxopsbtResponse;
    getFeeratePerKw(): number;
    setFeeratePerKw(value: number): UtxopsbtResponse;
    getEstimatedFinalWeight(): number;
    setEstimatedFinalWeight(value: number): UtxopsbtResponse;

    hasExcessMsat(): boolean;
    clearExcessMsat(): void;
    getExcessMsat(): cln_primitives_pb.Amount | undefined;
    setExcessMsat(value?: cln_primitives_pb.Amount): UtxopsbtResponse;

    hasChangeOutnum(): boolean;
    clearChangeOutnum(): void;
    getChangeOutnum(): number | undefined;
    setChangeOutnum(value: number): UtxopsbtResponse;
    clearReservationsList(): void;
    getReservationsList(): Array<UtxopsbtReservations>;
    setReservationsList(value: Array<UtxopsbtReservations>): UtxopsbtResponse;
    addReservations(value?: UtxopsbtReservations, index?: number): UtxopsbtReservations;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): UtxopsbtResponse.AsObject;
    static toObject(includeInstance: boolean, msg: UtxopsbtResponse): UtxopsbtResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: UtxopsbtResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): UtxopsbtResponse;
    static deserializeBinaryFromReader(message: UtxopsbtResponse, reader: jspb.BinaryReader): UtxopsbtResponse;
}

export namespace UtxopsbtResponse {
    export type AsObject = {
        psbt: string,
        feeratePerKw: number,
        estimatedFinalWeight: number,
        excessMsat?: cln_primitives_pb.Amount.AsObject,
        changeOutnum?: number,
        reservationsList: Array<UtxopsbtReservations.AsObject>,
    }
}

export class UtxopsbtReservations extends jspb.Message { 
    getTxid(): Uint8Array | string;
    getTxid_asU8(): Uint8Array;
    getTxid_asB64(): string;
    setTxid(value: Uint8Array | string): UtxopsbtReservations;
    getVout(): number;
    setVout(value: number): UtxopsbtReservations;
    getWasReserved(): boolean;
    setWasReserved(value: boolean): UtxopsbtReservations;
    getReserved(): boolean;
    setReserved(value: boolean): UtxopsbtReservations;
    getReservedToBlock(): number;
    setReservedToBlock(value: number): UtxopsbtReservations;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): UtxopsbtReservations.AsObject;
    static toObject(includeInstance: boolean, msg: UtxopsbtReservations): UtxopsbtReservations.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: UtxopsbtReservations, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): UtxopsbtReservations;
    static deserializeBinaryFromReader(message: UtxopsbtReservations, reader: jspb.BinaryReader): UtxopsbtReservations;
}

export namespace UtxopsbtReservations {
    export type AsObject = {
        txid: Uint8Array | string,
        vout: number,
        wasReserved: boolean,
        reserved: boolean,
        reservedToBlock: number,
    }
}

export class TxdiscardRequest extends jspb.Message { 
    getTxid(): Uint8Array | string;
    getTxid_asU8(): Uint8Array;
    getTxid_asB64(): string;
    setTxid(value: Uint8Array | string): TxdiscardRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): TxdiscardRequest.AsObject;
    static toObject(includeInstance: boolean, msg: TxdiscardRequest): TxdiscardRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: TxdiscardRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): TxdiscardRequest;
    static deserializeBinaryFromReader(message: TxdiscardRequest, reader: jspb.BinaryReader): TxdiscardRequest;
}

export namespace TxdiscardRequest {
    export type AsObject = {
        txid: Uint8Array | string,
    }
}

export class TxdiscardResponse extends jspb.Message { 
    getUnsignedTx(): Uint8Array | string;
    getUnsignedTx_asU8(): Uint8Array;
    getUnsignedTx_asB64(): string;
    setUnsignedTx(value: Uint8Array | string): TxdiscardResponse;
    getTxid(): Uint8Array | string;
    getTxid_asU8(): Uint8Array;
    getTxid_asB64(): string;
    setTxid(value: Uint8Array | string): TxdiscardResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): TxdiscardResponse.AsObject;
    static toObject(includeInstance: boolean, msg: TxdiscardResponse): TxdiscardResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: TxdiscardResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): TxdiscardResponse;
    static deserializeBinaryFromReader(message: TxdiscardResponse, reader: jspb.BinaryReader): TxdiscardResponse;
}

export namespace TxdiscardResponse {
    export type AsObject = {
        unsignedTx: Uint8Array | string,
        txid: Uint8Array | string,
    }
}

export class TxprepareRequest extends jspb.Message { 

    hasFeerate(): boolean;
    clearFeerate(): void;
    getFeerate(): cln_primitives_pb.Feerate | undefined;
    setFeerate(value?: cln_primitives_pb.Feerate): TxprepareRequest;

    hasMinconf(): boolean;
    clearMinconf(): void;
    getMinconf(): number | undefined;
    setMinconf(value: number): TxprepareRequest;
    clearUtxosList(): void;
    getUtxosList(): Array<cln_primitives_pb.Outpoint>;
    setUtxosList(value: Array<cln_primitives_pb.Outpoint>): TxprepareRequest;
    addUtxos(value?: cln_primitives_pb.Outpoint, index?: number): cln_primitives_pb.Outpoint;
    clearOutputsList(): void;
    getOutputsList(): Array<cln_primitives_pb.OutputDesc>;
    setOutputsList(value: Array<cln_primitives_pb.OutputDesc>): TxprepareRequest;
    addOutputs(value?: cln_primitives_pb.OutputDesc, index?: number): cln_primitives_pb.OutputDesc;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): TxprepareRequest.AsObject;
    static toObject(includeInstance: boolean, msg: TxprepareRequest): TxprepareRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: TxprepareRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): TxprepareRequest;
    static deserializeBinaryFromReader(message: TxprepareRequest, reader: jspb.BinaryReader): TxprepareRequest;
}

export namespace TxprepareRequest {
    export type AsObject = {
        feerate?: cln_primitives_pb.Feerate.AsObject,
        minconf?: number,
        utxosList: Array<cln_primitives_pb.Outpoint.AsObject>,
        outputsList: Array<cln_primitives_pb.OutputDesc.AsObject>,
    }
}

export class TxprepareResponse extends jspb.Message { 
    getPsbt(): string;
    setPsbt(value: string): TxprepareResponse;
    getUnsignedTx(): Uint8Array | string;
    getUnsignedTx_asU8(): Uint8Array;
    getUnsignedTx_asB64(): string;
    setUnsignedTx(value: Uint8Array | string): TxprepareResponse;
    getTxid(): Uint8Array | string;
    getTxid_asU8(): Uint8Array;
    getTxid_asB64(): string;
    setTxid(value: Uint8Array | string): TxprepareResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): TxprepareResponse.AsObject;
    static toObject(includeInstance: boolean, msg: TxprepareResponse): TxprepareResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: TxprepareResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): TxprepareResponse;
    static deserializeBinaryFromReader(message: TxprepareResponse, reader: jspb.BinaryReader): TxprepareResponse;
}

export namespace TxprepareResponse {
    export type AsObject = {
        psbt: string,
        unsignedTx: Uint8Array | string,
        txid: Uint8Array | string,
    }
}

export class TxsendRequest extends jspb.Message { 
    getTxid(): Uint8Array | string;
    getTxid_asU8(): Uint8Array;
    getTxid_asB64(): string;
    setTxid(value: Uint8Array | string): TxsendRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): TxsendRequest.AsObject;
    static toObject(includeInstance: boolean, msg: TxsendRequest): TxsendRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: TxsendRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): TxsendRequest;
    static deserializeBinaryFromReader(message: TxsendRequest, reader: jspb.BinaryReader): TxsendRequest;
}

export namespace TxsendRequest {
    export type AsObject = {
        txid: Uint8Array | string,
    }
}

export class TxsendResponse extends jspb.Message { 
    getPsbt(): string;
    setPsbt(value: string): TxsendResponse;
    getTx(): Uint8Array | string;
    getTx_asU8(): Uint8Array;
    getTx_asB64(): string;
    setTx(value: Uint8Array | string): TxsendResponse;
    getTxid(): Uint8Array | string;
    getTxid_asU8(): Uint8Array;
    getTxid_asB64(): string;
    setTxid(value: Uint8Array | string): TxsendResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): TxsendResponse.AsObject;
    static toObject(includeInstance: boolean, msg: TxsendResponse): TxsendResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: TxsendResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): TxsendResponse;
    static deserializeBinaryFromReader(message: TxsendResponse, reader: jspb.BinaryReader): TxsendResponse;
}

export namespace TxsendResponse {
    export type AsObject = {
        psbt: string,
        tx: Uint8Array | string,
        txid: Uint8Array | string,
    }
}

export class ListpeerchannelsRequest extends jspb.Message { 

    hasId(): boolean;
    clearId(): void;
    getId(): Uint8Array | string;
    getId_asU8(): Uint8Array;
    getId_asB64(): string;
    setId(value: Uint8Array | string): ListpeerchannelsRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ListpeerchannelsRequest.AsObject;
    static toObject(includeInstance: boolean, msg: ListpeerchannelsRequest): ListpeerchannelsRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ListpeerchannelsRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ListpeerchannelsRequest;
    static deserializeBinaryFromReader(message: ListpeerchannelsRequest, reader: jspb.BinaryReader): ListpeerchannelsRequest;
}

export namespace ListpeerchannelsRequest {
    export type AsObject = {
        id: Uint8Array | string,
    }
}

export class ListpeerchannelsResponse extends jspb.Message { 
    clearChannelsList(): void;
    getChannelsList(): Array<ListpeerchannelsChannels>;
    setChannelsList(value: Array<ListpeerchannelsChannels>): ListpeerchannelsResponse;
    addChannels(value?: ListpeerchannelsChannels, index?: number): ListpeerchannelsChannels;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ListpeerchannelsResponse.AsObject;
    static toObject(includeInstance: boolean, msg: ListpeerchannelsResponse): ListpeerchannelsResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ListpeerchannelsResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ListpeerchannelsResponse;
    static deserializeBinaryFromReader(message: ListpeerchannelsResponse, reader: jspb.BinaryReader): ListpeerchannelsResponse;
}

export namespace ListpeerchannelsResponse {
    export type AsObject = {
        channelsList: Array<ListpeerchannelsChannels.AsObject>,
    }
}

export class ListpeerchannelsChannels extends jspb.Message { 
    getPeerId(): Uint8Array | string;
    getPeerId_asU8(): Uint8Array;
    getPeerId_asB64(): string;
    setPeerId(value: Uint8Array | string): ListpeerchannelsChannels;
    getPeerConnected(): boolean;
    setPeerConnected(value: boolean): ListpeerchannelsChannels;
    getState(): ListpeerchannelsChannels.ListpeerchannelsChannelsState;
    setState(value: ListpeerchannelsChannels.ListpeerchannelsChannelsState): ListpeerchannelsChannels;

    hasScratchTxid(): boolean;
    clearScratchTxid(): void;
    getScratchTxid(): Uint8Array | string;
    getScratchTxid_asU8(): Uint8Array;
    getScratchTxid_asB64(): string;
    setScratchTxid(value: Uint8Array | string): ListpeerchannelsChannels;

    hasFeerate(): boolean;
    clearFeerate(): void;
    getFeerate(): ListpeerchannelsChannelsFeerate | undefined;
    setFeerate(value?: ListpeerchannelsChannelsFeerate): ListpeerchannelsChannels;

    hasOwner(): boolean;
    clearOwner(): void;
    getOwner(): string | undefined;
    setOwner(value: string): ListpeerchannelsChannels;

    hasShortChannelId(): boolean;
    clearShortChannelId(): void;
    getShortChannelId(): string | undefined;
    setShortChannelId(value: string): ListpeerchannelsChannels;

    hasChannelId(): boolean;
    clearChannelId(): void;
    getChannelId(): Uint8Array | string;
    getChannelId_asU8(): Uint8Array;
    getChannelId_asB64(): string;
    setChannelId(value: Uint8Array | string): ListpeerchannelsChannels;

    hasFundingTxid(): boolean;
    clearFundingTxid(): void;
    getFundingTxid(): Uint8Array | string;
    getFundingTxid_asU8(): Uint8Array;
    getFundingTxid_asB64(): string;
    setFundingTxid(value: Uint8Array | string): ListpeerchannelsChannels;

    hasFundingOutnum(): boolean;
    clearFundingOutnum(): void;
    getFundingOutnum(): number | undefined;
    setFundingOutnum(value: number): ListpeerchannelsChannels;

    hasInitialFeerate(): boolean;
    clearInitialFeerate(): void;
    getInitialFeerate(): string | undefined;
    setInitialFeerate(value: string): ListpeerchannelsChannels;

    hasLastFeerate(): boolean;
    clearLastFeerate(): void;
    getLastFeerate(): string | undefined;
    setLastFeerate(value: string): ListpeerchannelsChannels;

    hasNextFeerate(): boolean;
    clearNextFeerate(): void;
    getNextFeerate(): string | undefined;
    setNextFeerate(value: string): ListpeerchannelsChannels;

    hasNextFeeStep(): boolean;
    clearNextFeeStep(): void;
    getNextFeeStep(): number | undefined;
    setNextFeeStep(value: number): ListpeerchannelsChannels;
    clearInflightList(): void;
    getInflightList(): Array<ListpeerchannelsChannelsInflight>;
    setInflightList(value: Array<ListpeerchannelsChannelsInflight>): ListpeerchannelsChannels;
    addInflight(value?: ListpeerchannelsChannelsInflight, index?: number): ListpeerchannelsChannelsInflight;

    hasCloseTo(): boolean;
    clearCloseTo(): void;
    getCloseTo(): Uint8Array | string;
    getCloseTo_asU8(): Uint8Array;
    getCloseTo_asB64(): string;
    setCloseTo(value: Uint8Array | string): ListpeerchannelsChannels;

    hasPrivate(): boolean;
    clearPrivate(): void;
    getPrivate(): boolean | undefined;
    setPrivate(value: boolean): ListpeerchannelsChannels;
    getOpener(): cln_primitives_pb.ChannelSide;
    setOpener(value: cln_primitives_pb.ChannelSide): ListpeerchannelsChannels;

    hasCloser(): boolean;
    clearCloser(): void;
    getCloser(): cln_primitives_pb.ChannelSide | undefined;
    setCloser(value: cln_primitives_pb.ChannelSide): ListpeerchannelsChannels;

    hasFunding(): boolean;
    clearFunding(): void;
    getFunding(): ListpeerchannelsChannelsFunding | undefined;
    setFunding(value?: ListpeerchannelsChannelsFunding): ListpeerchannelsChannels;

    hasToUsMsat(): boolean;
    clearToUsMsat(): void;
    getToUsMsat(): cln_primitives_pb.Amount | undefined;
    setToUsMsat(value?: cln_primitives_pb.Amount): ListpeerchannelsChannels;

    hasMinToUsMsat(): boolean;
    clearMinToUsMsat(): void;
    getMinToUsMsat(): cln_primitives_pb.Amount | undefined;
    setMinToUsMsat(value?: cln_primitives_pb.Amount): ListpeerchannelsChannels;

    hasMaxToUsMsat(): boolean;
    clearMaxToUsMsat(): void;
    getMaxToUsMsat(): cln_primitives_pb.Amount | undefined;
    setMaxToUsMsat(value?: cln_primitives_pb.Amount): ListpeerchannelsChannels;

    hasTotalMsat(): boolean;
    clearTotalMsat(): void;
    getTotalMsat(): cln_primitives_pb.Amount | undefined;
    setTotalMsat(value?: cln_primitives_pb.Amount): ListpeerchannelsChannels;

    hasFeeBaseMsat(): boolean;
    clearFeeBaseMsat(): void;
    getFeeBaseMsat(): cln_primitives_pb.Amount | undefined;
    setFeeBaseMsat(value?: cln_primitives_pb.Amount): ListpeerchannelsChannels;

    hasFeeProportionalMillionths(): boolean;
    clearFeeProportionalMillionths(): void;
    getFeeProportionalMillionths(): number | undefined;
    setFeeProportionalMillionths(value: number): ListpeerchannelsChannels;

    hasDustLimitMsat(): boolean;
    clearDustLimitMsat(): void;
    getDustLimitMsat(): cln_primitives_pb.Amount | undefined;
    setDustLimitMsat(value?: cln_primitives_pb.Amount): ListpeerchannelsChannels;

    hasMaxTotalHtlcInMsat(): boolean;
    clearMaxTotalHtlcInMsat(): void;
    getMaxTotalHtlcInMsat(): cln_primitives_pb.Amount | undefined;
    setMaxTotalHtlcInMsat(value?: cln_primitives_pb.Amount): ListpeerchannelsChannels;

    hasTheirReserveMsat(): boolean;
    clearTheirReserveMsat(): void;
    getTheirReserveMsat(): cln_primitives_pb.Amount | undefined;
    setTheirReserveMsat(value?: cln_primitives_pb.Amount): ListpeerchannelsChannels;

    hasOurReserveMsat(): boolean;
    clearOurReserveMsat(): void;
    getOurReserveMsat(): cln_primitives_pb.Amount | undefined;
    setOurReserveMsat(value?: cln_primitives_pb.Amount): ListpeerchannelsChannels;

    hasSpendableMsat(): boolean;
    clearSpendableMsat(): void;
    getSpendableMsat(): cln_primitives_pb.Amount | undefined;
    setSpendableMsat(value?: cln_primitives_pb.Amount): ListpeerchannelsChannels;

    hasReceivableMsat(): boolean;
    clearReceivableMsat(): void;
    getReceivableMsat(): cln_primitives_pb.Amount | undefined;
    setReceivableMsat(value?: cln_primitives_pb.Amount): ListpeerchannelsChannels;

    hasMinimumHtlcInMsat(): boolean;
    clearMinimumHtlcInMsat(): void;
    getMinimumHtlcInMsat(): cln_primitives_pb.Amount | undefined;
    setMinimumHtlcInMsat(value?: cln_primitives_pb.Amount): ListpeerchannelsChannels;

    hasMinimumHtlcOutMsat(): boolean;
    clearMinimumHtlcOutMsat(): void;
    getMinimumHtlcOutMsat(): cln_primitives_pb.Amount | undefined;
    setMinimumHtlcOutMsat(value?: cln_primitives_pb.Amount): ListpeerchannelsChannels;

    hasMaximumHtlcOutMsat(): boolean;
    clearMaximumHtlcOutMsat(): void;
    getMaximumHtlcOutMsat(): cln_primitives_pb.Amount | undefined;
    setMaximumHtlcOutMsat(value?: cln_primitives_pb.Amount): ListpeerchannelsChannels;

    hasTheirToSelfDelay(): boolean;
    clearTheirToSelfDelay(): void;
    getTheirToSelfDelay(): number | undefined;
    setTheirToSelfDelay(value: number): ListpeerchannelsChannels;

    hasOurToSelfDelay(): boolean;
    clearOurToSelfDelay(): void;
    getOurToSelfDelay(): number | undefined;
    setOurToSelfDelay(value: number): ListpeerchannelsChannels;

    hasMaxAcceptedHtlcs(): boolean;
    clearMaxAcceptedHtlcs(): void;
    getMaxAcceptedHtlcs(): number | undefined;
    setMaxAcceptedHtlcs(value: number): ListpeerchannelsChannels;

    hasAlias(): boolean;
    clearAlias(): void;
    getAlias(): ListpeerchannelsChannelsAlias | undefined;
    setAlias(value?: ListpeerchannelsChannelsAlias): ListpeerchannelsChannels;
    clearStatusList(): void;
    getStatusList(): Array<string>;
    setStatusList(value: Array<string>): ListpeerchannelsChannels;
    addStatus(value: string, index?: number): string;

    hasInPaymentsOffered(): boolean;
    clearInPaymentsOffered(): void;
    getInPaymentsOffered(): number | undefined;
    setInPaymentsOffered(value: number): ListpeerchannelsChannels;

    hasInOfferedMsat(): boolean;
    clearInOfferedMsat(): void;
    getInOfferedMsat(): cln_primitives_pb.Amount | undefined;
    setInOfferedMsat(value?: cln_primitives_pb.Amount): ListpeerchannelsChannels;

    hasInPaymentsFulfilled(): boolean;
    clearInPaymentsFulfilled(): void;
    getInPaymentsFulfilled(): number | undefined;
    setInPaymentsFulfilled(value: number): ListpeerchannelsChannels;

    hasInFulfilledMsat(): boolean;
    clearInFulfilledMsat(): void;
    getInFulfilledMsat(): cln_primitives_pb.Amount | undefined;
    setInFulfilledMsat(value?: cln_primitives_pb.Amount): ListpeerchannelsChannels;

    hasOutPaymentsOffered(): boolean;
    clearOutPaymentsOffered(): void;
    getOutPaymentsOffered(): number | undefined;
    setOutPaymentsOffered(value: number): ListpeerchannelsChannels;

    hasOutOfferedMsat(): boolean;
    clearOutOfferedMsat(): void;
    getOutOfferedMsat(): cln_primitives_pb.Amount | undefined;
    setOutOfferedMsat(value?: cln_primitives_pb.Amount): ListpeerchannelsChannels;

    hasOutPaymentsFulfilled(): boolean;
    clearOutPaymentsFulfilled(): void;
    getOutPaymentsFulfilled(): number | undefined;
    setOutPaymentsFulfilled(value: number): ListpeerchannelsChannels;

    hasOutFulfilledMsat(): boolean;
    clearOutFulfilledMsat(): void;
    getOutFulfilledMsat(): cln_primitives_pb.Amount | undefined;
    setOutFulfilledMsat(value?: cln_primitives_pb.Amount): ListpeerchannelsChannels;
    clearHtlcsList(): void;
    getHtlcsList(): Array<ListpeerchannelsChannelsHtlcs>;
    setHtlcsList(value: Array<ListpeerchannelsChannelsHtlcs>): ListpeerchannelsChannels;
    addHtlcs(value?: ListpeerchannelsChannelsHtlcs, index?: number): ListpeerchannelsChannelsHtlcs;

    hasCloseToAddr(): boolean;
    clearCloseToAddr(): void;
    getCloseToAddr(): string | undefined;
    setCloseToAddr(value: string): ListpeerchannelsChannels;

    hasIgnoreFeeLimits(): boolean;
    clearIgnoreFeeLimits(): void;
    getIgnoreFeeLimits(): boolean | undefined;
    setIgnoreFeeLimits(value: boolean): ListpeerchannelsChannels;

    hasUpdates(): boolean;
    clearUpdates(): void;
    getUpdates(): ListpeerchannelsChannelsUpdates | undefined;
    setUpdates(value?: ListpeerchannelsChannelsUpdates): ListpeerchannelsChannels;

    hasLastStableConnection(): boolean;
    clearLastStableConnection(): void;
    getLastStableConnection(): number | undefined;
    setLastStableConnection(value: number): ListpeerchannelsChannels;

    hasLostState(): boolean;
    clearLostState(): void;
    getLostState(): boolean | undefined;
    setLostState(value: boolean): ListpeerchannelsChannels;

    hasReestablished(): boolean;
    clearReestablished(): void;
    getReestablished(): boolean | undefined;
    setReestablished(value: boolean): ListpeerchannelsChannels;

    hasLastTxFeeMsat(): boolean;
    clearLastTxFeeMsat(): void;
    getLastTxFeeMsat(): cln_primitives_pb.Amount | undefined;
    setLastTxFeeMsat(value?: cln_primitives_pb.Amount): ListpeerchannelsChannels;

    hasDirection(): boolean;
    clearDirection(): void;
    getDirection(): number | undefined;
    setDirection(value: number): ListpeerchannelsChannels;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ListpeerchannelsChannels.AsObject;
    static toObject(includeInstance: boolean, msg: ListpeerchannelsChannels): ListpeerchannelsChannels.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ListpeerchannelsChannels, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ListpeerchannelsChannels;
    static deserializeBinaryFromReader(message: ListpeerchannelsChannels, reader: jspb.BinaryReader): ListpeerchannelsChannels;
}

export namespace ListpeerchannelsChannels {
    export type AsObject = {
        peerId: Uint8Array | string,
        peerConnected: boolean,
        state: ListpeerchannelsChannels.ListpeerchannelsChannelsState,
        scratchTxid: Uint8Array | string,
        feerate?: ListpeerchannelsChannelsFeerate.AsObject,
        owner?: string,
        shortChannelId?: string,
        channelId: Uint8Array | string,
        fundingTxid: Uint8Array | string,
        fundingOutnum?: number,
        initialFeerate?: string,
        lastFeerate?: string,
        nextFeerate?: string,
        nextFeeStep?: number,
        inflightList: Array<ListpeerchannelsChannelsInflight.AsObject>,
        closeTo: Uint8Array | string,
        pb_private?: boolean,
        opener: cln_primitives_pb.ChannelSide,
        closer?: cln_primitives_pb.ChannelSide,
        funding?: ListpeerchannelsChannelsFunding.AsObject,
        toUsMsat?: cln_primitives_pb.Amount.AsObject,
        minToUsMsat?: cln_primitives_pb.Amount.AsObject,
        maxToUsMsat?: cln_primitives_pb.Amount.AsObject,
        totalMsat?: cln_primitives_pb.Amount.AsObject,
        feeBaseMsat?: cln_primitives_pb.Amount.AsObject,
        feeProportionalMillionths?: number,
        dustLimitMsat?: cln_primitives_pb.Amount.AsObject,
        maxTotalHtlcInMsat?: cln_primitives_pb.Amount.AsObject,
        theirReserveMsat?: cln_primitives_pb.Amount.AsObject,
        ourReserveMsat?: cln_primitives_pb.Amount.AsObject,
        spendableMsat?: cln_primitives_pb.Amount.AsObject,
        receivableMsat?: cln_primitives_pb.Amount.AsObject,
        minimumHtlcInMsat?: cln_primitives_pb.Amount.AsObject,
        minimumHtlcOutMsat?: cln_primitives_pb.Amount.AsObject,
        maximumHtlcOutMsat?: cln_primitives_pb.Amount.AsObject,
        theirToSelfDelay?: number,
        ourToSelfDelay?: number,
        maxAcceptedHtlcs?: number,
        alias?: ListpeerchannelsChannelsAlias.AsObject,
        statusList: Array<string>,
        inPaymentsOffered?: number,
        inOfferedMsat?: cln_primitives_pb.Amount.AsObject,
        inPaymentsFulfilled?: number,
        inFulfilledMsat?: cln_primitives_pb.Amount.AsObject,
        outPaymentsOffered?: number,
        outOfferedMsat?: cln_primitives_pb.Amount.AsObject,
        outPaymentsFulfilled?: number,
        outFulfilledMsat?: cln_primitives_pb.Amount.AsObject,
        htlcsList: Array<ListpeerchannelsChannelsHtlcs.AsObject>,
        closeToAddr?: string,
        ignoreFeeLimits?: boolean,
        updates?: ListpeerchannelsChannelsUpdates.AsObject,
        lastStableConnection?: number,
        lostState?: boolean,
        reestablished?: boolean,
        lastTxFeeMsat?: cln_primitives_pb.Amount.AsObject,
        direction?: number,
    }

    export enum ListpeerchannelsChannelsState {
    OPENINGD = 0,
    CHANNELD_AWAITING_LOCKIN = 1,
    CHANNELD_NORMAL = 2,
    CHANNELD_SHUTTING_DOWN = 3,
    CLOSINGD_SIGEXCHANGE = 4,
    CLOSINGD_COMPLETE = 5,
    AWAITING_UNILATERAL = 6,
    FUNDING_SPEND_SEEN = 7,
    ONCHAIN = 8,
    DUALOPEND_OPEN_INIT = 9,
    DUALOPEND_AWAITING_LOCKIN = 10,
    CHANNELD_AWAITING_SPLICE = 11,
    DUALOPEND_OPEN_COMMITTED = 12,
    DUALOPEND_OPEN_COMMIT_READY = 13,
    }

}

export class ListpeerchannelsChannelsUpdates extends jspb.Message { 

    hasLocal(): boolean;
    clearLocal(): void;
    getLocal(): ListpeerchannelsChannelsUpdatesLocal | undefined;
    setLocal(value?: ListpeerchannelsChannelsUpdatesLocal): ListpeerchannelsChannelsUpdates;

    hasRemote(): boolean;
    clearRemote(): void;
    getRemote(): ListpeerchannelsChannelsUpdatesRemote | undefined;
    setRemote(value?: ListpeerchannelsChannelsUpdatesRemote): ListpeerchannelsChannelsUpdates;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ListpeerchannelsChannelsUpdates.AsObject;
    static toObject(includeInstance: boolean, msg: ListpeerchannelsChannelsUpdates): ListpeerchannelsChannelsUpdates.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ListpeerchannelsChannelsUpdates, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ListpeerchannelsChannelsUpdates;
    static deserializeBinaryFromReader(message: ListpeerchannelsChannelsUpdates, reader: jspb.BinaryReader): ListpeerchannelsChannelsUpdates;
}

export namespace ListpeerchannelsChannelsUpdates {
    export type AsObject = {
        local?: ListpeerchannelsChannelsUpdatesLocal.AsObject,
        remote?: ListpeerchannelsChannelsUpdatesRemote.AsObject,
    }
}

export class ListpeerchannelsChannelsUpdatesLocal extends jspb.Message { 

    hasHtlcMinimumMsat(): boolean;
    clearHtlcMinimumMsat(): void;
    getHtlcMinimumMsat(): cln_primitives_pb.Amount | undefined;
    setHtlcMinimumMsat(value?: cln_primitives_pb.Amount): ListpeerchannelsChannelsUpdatesLocal;

    hasHtlcMaximumMsat(): boolean;
    clearHtlcMaximumMsat(): void;
    getHtlcMaximumMsat(): cln_primitives_pb.Amount | undefined;
    setHtlcMaximumMsat(value?: cln_primitives_pb.Amount): ListpeerchannelsChannelsUpdatesLocal;
    getCltvExpiryDelta(): number;
    setCltvExpiryDelta(value: number): ListpeerchannelsChannelsUpdatesLocal;

    hasFeeBaseMsat(): boolean;
    clearFeeBaseMsat(): void;
    getFeeBaseMsat(): cln_primitives_pb.Amount | undefined;
    setFeeBaseMsat(value?: cln_primitives_pb.Amount): ListpeerchannelsChannelsUpdatesLocal;
    getFeeProportionalMillionths(): number;
    setFeeProportionalMillionths(value: number): ListpeerchannelsChannelsUpdatesLocal;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ListpeerchannelsChannelsUpdatesLocal.AsObject;
    static toObject(includeInstance: boolean, msg: ListpeerchannelsChannelsUpdatesLocal): ListpeerchannelsChannelsUpdatesLocal.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ListpeerchannelsChannelsUpdatesLocal, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ListpeerchannelsChannelsUpdatesLocal;
    static deserializeBinaryFromReader(message: ListpeerchannelsChannelsUpdatesLocal, reader: jspb.BinaryReader): ListpeerchannelsChannelsUpdatesLocal;
}

export namespace ListpeerchannelsChannelsUpdatesLocal {
    export type AsObject = {
        htlcMinimumMsat?: cln_primitives_pb.Amount.AsObject,
        htlcMaximumMsat?: cln_primitives_pb.Amount.AsObject,
        cltvExpiryDelta: number,
        feeBaseMsat?: cln_primitives_pb.Amount.AsObject,
        feeProportionalMillionths: number,
    }
}

export class ListpeerchannelsChannelsUpdatesRemote extends jspb.Message { 

    hasHtlcMinimumMsat(): boolean;
    clearHtlcMinimumMsat(): void;
    getHtlcMinimumMsat(): cln_primitives_pb.Amount | undefined;
    setHtlcMinimumMsat(value?: cln_primitives_pb.Amount): ListpeerchannelsChannelsUpdatesRemote;

    hasHtlcMaximumMsat(): boolean;
    clearHtlcMaximumMsat(): void;
    getHtlcMaximumMsat(): cln_primitives_pb.Amount | undefined;
    setHtlcMaximumMsat(value?: cln_primitives_pb.Amount): ListpeerchannelsChannelsUpdatesRemote;
    getCltvExpiryDelta(): number;
    setCltvExpiryDelta(value: number): ListpeerchannelsChannelsUpdatesRemote;

    hasFeeBaseMsat(): boolean;
    clearFeeBaseMsat(): void;
    getFeeBaseMsat(): cln_primitives_pb.Amount | undefined;
    setFeeBaseMsat(value?: cln_primitives_pb.Amount): ListpeerchannelsChannelsUpdatesRemote;
    getFeeProportionalMillionths(): number;
    setFeeProportionalMillionths(value: number): ListpeerchannelsChannelsUpdatesRemote;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ListpeerchannelsChannelsUpdatesRemote.AsObject;
    static toObject(includeInstance: boolean, msg: ListpeerchannelsChannelsUpdatesRemote): ListpeerchannelsChannelsUpdatesRemote.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ListpeerchannelsChannelsUpdatesRemote, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ListpeerchannelsChannelsUpdatesRemote;
    static deserializeBinaryFromReader(message: ListpeerchannelsChannelsUpdatesRemote, reader: jspb.BinaryReader): ListpeerchannelsChannelsUpdatesRemote;
}

export namespace ListpeerchannelsChannelsUpdatesRemote {
    export type AsObject = {
        htlcMinimumMsat?: cln_primitives_pb.Amount.AsObject,
        htlcMaximumMsat?: cln_primitives_pb.Amount.AsObject,
        cltvExpiryDelta: number,
        feeBaseMsat?: cln_primitives_pb.Amount.AsObject,
        feeProportionalMillionths: number,
    }
}

export class ListpeerchannelsChannelsFeerate extends jspb.Message { 
    getPerkw(): number;
    setPerkw(value: number): ListpeerchannelsChannelsFeerate;
    getPerkb(): number;
    setPerkb(value: number): ListpeerchannelsChannelsFeerate;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ListpeerchannelsChannelsFeerate.AsObject;
    static toObject(includeInstance: boolean, msg: ListpeerchannelsChannelsFeerate): ListpeerchannelsChannelsFeerate.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ListpeerchannelsChannelsFeerate, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ListpeerchannelsChannelsFeerate;
    static deserializeBinaryFromReader(message: ListpeerchannelsChannelsFeerate, reader: jspb.BinaryReader): ListpeerchannelsChannelsFeerate;
}

export namespace ListpeerchannelsChannelsFeerate {
    export type AsObject = {
        perkw: number,
        perkb: number,
    }
}

export class ListpeerchannelsChannelsInflight extends jspb.Message { 
    getFundingTxid(): Uint8Array | string;
    getFundingTxid_asU8(): Uint8Array;
    getFundingTxid_asB64(): string;
    setFundingTxid(value: Uint8Array | string): ListpeerchannelsChannelsInflight;
    getFundingOutnum(): number;
    setFundingOutnum(value: number): ListpeerchannelsChannelsInflight;
    getFeerate(): string;
    setFeerate(value: string): ListpeerchannelsChannelsInflight;

    hasTotalFundingMsat(): boolean;
    clearTotalFundingMsat(): void;
    getTotalFundingMsat(): cln_primitives_pb.Amount | undefined;
    setTotalFundingMsat(value?: cln_primitives_pb.Amount): ListpeerchannelsChannelsInflight;

    hasOurFundingMsat(): boolean;
    clearOurFundingMsat(): void;
    getOurFundingMsat(): cln_primitives_pb.Amount | undefined;
    setOurFundingMsat(value?: cln_primitives_pb.Amount): ListpeerchannelsChannelsInflight;

    hasScratchTxid(): boolean;
    clearScratchTxid(): void;
    getScratchTxid(): Uint8Array | string;
    getScratchTxid_asU8(): Uint8Array;
    getScratchTxid_asB64(): string;
    setScratchTxid(value: Uint8Array | string): ListpeerchannelsChannelsInflight;

    hasSpliceAmount(): boolean;
    clearSpliceAmount(): void;
    getSpliceAmount(): number | undefined;
    setSpliceAmount(value: number): ListpeerchannelsChannelsInflight;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ListpeerchannelsChannelsInflight.AsObject;
    static toObject(includeInstance: boolean, msg: ListpeerchannelsChannelsInflight): ListpeerchannelsChannelsInflight.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ListpeerchannelsChannelsInflight, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ListpeerchannelsChannelsInflight;
    static deserializeBinaryFromReader(message: ListpeerchannelsChannelsInflight, reader: jspb.BinaryReader): ListpeerchannelsChannelsInflight;
}

export namespace ListpeerchannelsChannelsInflight {
    export type AsObject = {
        fundingTxid: Uint8Array | string,
        fundingOutnum: number,
        feerate: string,
        totalFundingMsat?: cln_primitives_pb.Amount.AsObject,
        ourFundingMsat?: cln_primitives_pb.Amount.AsObject,
        scratchTxid: Uint8Array | string,
        spliceAmount?: number,
    }
}

export class ListpeerchannelsChannelsFunding extends jspb.Message { 

    hasPushedMsat(): boolean;
    clearPushedMsat(): void;
    getPushedMsat(): cln_primitives_pb.Amount | undefined;
    setPushedMsat(value?: cln_primitives_pb.Amount): ListpeerchannelsChannelsFunding;

    hasLocalFundsMsat(): boolean;
    clearLocalFundsMsat(): void;
    getLocalFundsMsat(): cln_primitives_pb.Amount | undefined;
    setLocalFundsMsat(value?: cln_primitives_pb.Amount): ListpeerchannelsChannelsFunding;

    hasRemoteFundsMsat(): boolean;
    clearRemoteFundsMsat(): void;
    getRemoteFundsMsat(): cln_primitives_pb.Amount | undefined;
    setRemoteFundsMsat(value?: cln_primitives_pb.Amount): ListpeerchannelsChannelsFunding;

    hasFeePaidMsat(): boolean;
    clearFeePaidMsat(): void;
    getFeePaidMsat(): cln_primitives_pb.Amount | undefined;
    setFeePaidMsat(value?: cln_primitives_pb.Amount): ListpeerchannelsChannelsFunding;

    hasFeeRcvdMsat(): boolean;
    clearFeeRcvdMsat(): void;
    getFeeRcvdMsat(): cln_primitives_pb.Amount | undefined;
    setFeeRcvdMsat(value?: cln_primitives_pb.Amount): ListpeerchannelsChannelsFunding;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ListpeerchannelsChannelsFunding.AsObject;
    static toObject(includeInstance: boolean, msg: ListpeerchannelsChannelsFunding): ListpeerchannelsChannelsFunding.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ListpeerchannelsChannelsFunding, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ListpeerchannelsChannelsFunding;
    static deserializeBinaryFromReader(message: ListpeerchannelsChannelsFunding, reader: jspb.BinaryReader): ListpeerchannelsChannelsFunding;
}

export namespace ListpeerchannelsChannelsFunding {
    export type AsObject = {
        pushedMsat?: cln_primitives_pb.Amount.AsObject,
        localFundsMsat?: cln_primitives_pb.Amount.AsObject,
        remoteFundsMsat?: cln_primitives_pb.Amount.AsObject,
        feePaidMsat?: cln_primitives_pb.Amount.AsObject,
        feeRcvdMsat?: cln_primitives_pb.Amount.AsObject,
    }
}

export class ListpeerchannelsChannelsAlias extends jspb.Message { 

    hasLocal(): boolean;
    clearLocal(): void;
    getLocal(): string | undefined;
    setLocal(value: string): ListpeerchannelsChannelsAlias;

    hasRemote(): boolean;
    clearRemote(): void;
    getRemote(): string | undefined;
    setRemote(value: string): ListpeerchannelsChannelsAlias;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ListpeerchannelsChannelsAlias.AsObject;
    static toObject(includeInstance: boolean, msg: ListpeerchannelsChannelsAlias): ListpeerchannelsChannelsAlias.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ListpeerchannelsChannelsAlias, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ListpeerchannelsChannelsAlias;
    static deserializeBinaryFromReader(message: ListpeerchannelsChannelsAlias, reader: jspb.BinaryReader): ListpeerchannelsChannelsAlias;
}

export namespace ListpeerchannelsChannelsAlias {
    export type AsObject = {
        local?: string,
        remote?: string,
    }
}

export class ListpeerchannelsChannelsHtlcs extends jspb.Message { 
    getDirection(): ListpeerchannelsChannelsHtlcs.ListpeerchannelsChannelsHtlcsDirection;
    setDirection(value: ListpeerchannelsChannelsHtlcs.ListpeerchannelsChannelsHtlcsDirection): ListpeerchannelsChannelsHtlcs;
    getId(): number;
    setId(value: number): ListpeerchannelsChannelsHtlcs;

    hasAmountMsat(): boolean;
    clearAmountMsat(): void;
    getAmountMsat(): cln_primitives_pb.Amount | undefined;
    setAmountMsat(value?: cln_primitives_pb.Amount): ListpeerchannelsChannelsHtlcs;
    getExpiry(): number;
    setExpiry(value: number): ListpeerchannelsChannelsHtlcs;
    getPaymentHash(): Uint8Array | string;
    getPaymentHash_asU8(): Uint8Array;
    getPaymentHash_asB64(): string;
    setPaymentHash(value: Uint8Array | string): ListpeerchannelsChannelsHtlcs;

    hasLocalTrimmed(): boolean;
    clearLocalTrimmed(): void;
    getLocalTrimmed(): boolean | undefined;
    setLocalTrimmed(value: boolean): ListpeerchannelsChannelsHtlcs;

    hasStatus(): boolean;
    clearStatus(): void;
    getStatus(): string | undefined;
    setStatus(value: string): ListpeerchannelsChannelsHtlcs;
    getState(): cln_primitives_pb.HtlcState;
    setState(value: cln_primitives_pb.HtlcState): ListpeerchannelsChannelsHtlcs;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ListpeerchannelsChannelsHtlcs.AsObject;
    static toObject(includeInstance: boolean, msg: ListpeerchannelsChannelsHtlcs): ListpeerchannelsChannelsHtlcs.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ListpeerchannelsChannelsHtlcs, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ListpeerchannelsChannelsHtlcs;
    static deserializeBinaryFromReader(message: ListpeerchannelsChannelsHtlcs, reader: jspb.BinaryReader): ListpeerchannelsChannelsHtlcs;
}

export namespace ListpeerchannelsChannelsHtlcs {
    export type AsObject = {
        direction: ListpeerchannelsChannelsHtlcs.ListpeerchannelsChannelsHtlcsDirection,
        id: number,
        amountMsat?: cln_primitives_pb.Amount.AsObject,
        expiry: number,
        paymentHash: Uint8Array | string,
        localTrimmed?: boolean,
        status?: string,
        state: cln_primitives_pb.HtlcState,
    }

    export enum ListpeerchannelsChannelsHtlcsDirection {
    IN = 0,
    OUT = 1,
    }

}

export class ListclosedchannelsRequest extends jspb.Message { 

    hasId(): boolean;
    clearId(): void;
    getId(): Uint8Array | string;
    getId_asU8(): Uint8Array;
    getId_asB64(): string;
    setId(value: Uint8Array | string): ListclosedchannelsRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ListclosedchannelsRequest.AsObject;
    static toObject(includeInstance: boolean, msg: ListclosedchannelsRequest): ListclosedchannelsRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ListclosedchannelsRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ListclosedchannelsRequest;
    static deserializeBinaryFromReader(message: ListclosedchannelsRequest, reader: jspb.BinaryReader): ListclosedchannelsRequest;
}

export namespace ListclosedchannelsRequest {
    export type AsObject = {
        id: Uint8Array | string,
    }
}

export class ListclosedchannelsResponse extends jspb.Message { 
    clearClosedchannelsList(): void;
    getClosedchannelsList(): Array<ListclosedchannelsClosedchannels>;
    setClosedchannelsList(value: Array<ListclosedchannelsClosedchannels>): ListclosedchannelsResponse;
    addClosedchannels(value?: ListclosedchannelsClosedchannels, index?: number): ListclosedchannelsClosedchannels;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ListclosedchannelsResponse.AsObject;
    static toObject(includeInstance: boolean, msg: ListclosedchannelsResponse): ListclosedchannelsResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ListclosedchannelsResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ListclosedchannelsResponse;
    static deserializeBinaryFromReader(message: ListclosedchannelsResponse, reader: jspb.BinaryReader): ListclosedchannelsResponse;
}

export namespace ListclosedchannelsResponse {
    export type AsObject = {
        closedchannelsList: Array<ListclosedchannelsClosedchannels.AsObject>,
    }
}

export class ListclosedchannelsClosedchannels extends jspb.Message { 

    hasPeerId(): boolean;
    clearPeerId(): void;
    getPeerId(): Uint8Array | string;
    getPeerId_asU8(): Uint8Array;
    getPeerId_asB64(): string;
    setPeerId(value: Uint8Array | string): ListclosedchannelsClosedchannels;
    getChannelId(): Uint8Array | string;
    getChannelId_asU8(): Uint8Array;
    getChannelId_asB64(): string;
    setChannelId(value: Uint8Array | string): ListclosedchannelsClosedchannels;

    hasShortChannelId(): boolean;
    clearShortChannelId(): void;
    getShortChannelId(): string | undefined;
    setShortChannelId(value: string): ListclosedchannelsClosedchannels;

    hasAlias(): boolean;
    clearAlias(): void;
    getAlias(): ListclosedchannelsClosedchannelsAlias | undefined;
    setAlias(value?: ListclosedchannelsClosedchannelsAlias): ListclosedchannelsClosedchannels;
    getOpener(): cln_primitives_pb.ChannelSide;
    setOpener(value: cln_primitives_pb.ChannelSide): ListclosedchannelsClosedchannels;

    hasCloser(): boolean;
    clearCloser(): void;
    getCloser(): cln_primitives_pb.ChannelSide | undefined;
    setCloser(value: cln_primitives_pb.ChannelSide): ListclosedchannelsClosedchannels;
    getPrivate(): boolean;
    setPrivate(value: boolean): ListclosedchannelsClosedchannels;
    getTotalLocalCommitments(): number;
    setTotalLocalCommitments(value: number): ListclosedchannelsClosedchannels;
    getTotalRemoteCommitments(): number;
    setTotalRemoteCommitments(value: number): ListclosedchannelsClosedchannels;
    getTotalHtlcsSent(): number;
    setTotalHtlcsSent(value: number): ListclosedchannelsClosedchannels;
    getFundingTxid(): Uint8Array | string;
    getFundingTxid_asU8(): Uint8Array;
    getFundingTxid_asB64(): string;
    setFundingTxid(value: Uint8Array | string): ListclosedchannelsClosedchannels;
    getFundingOutnum(): number;
    setFundingOutnum(value: number): ListclosedchannelsClosedchannels;
    getLeased(): boolean;
    setLeased(value: boolean): ListclosedchannelsClosedchannels;

    hasFundingFeePaidMsat(): boolean;
    clearFundingFeePaidMsat(): void;
    getFundingFeePaidMsat(): cln_primitives_pb.Amount | undefined;
    setFundingFeePaidMsat(value?: cln_primitives_pb.Amount): ListclosedchannelsClosedchannels;

    hasFundingFeeRcvdMsat(): boolean;
    clearFundingFeeRcvdMsat(): void;
    getFundingFeeRcvdMsat(): cln_primitives_pb.Amount | undefined;
    setFundingFeeRcvdMsat(value?: cln_primitives_pb.Amount): ListclosedchannelsClosedchannels;

    hasFundingPushedMsat(): boolean;
    clearFundingPushedMsat(): void;
    getFundingPushedMsat(): cln_primitives_pb.Amount | undefined;
    setFundingPushedMsat(value?: cln_primitives_pb.Amount): ListclosedchannelsClosedchannels;

    hasTotalMsat(): boolean;
    clearTotalMsat(): void;
    getTotalMsat(): cln_primitives_pb.Amount | undefined;
    setTotalMsat(value?: cln_primitives_pb.Amount): ListclosedchannelsClosedchannels;

    hasFinalToUsMsat(): boolean;
    clearFinalToUsMsat(): void;
    getFinalToUsMsat(): cln_primitives_pb.Amount | undefined;
    setFinalToUsMsat(value?: cln_primitives_pb.Amount): ListclosedchannelsClosedchannels;

    hasMinToUsMsat(): boolean;
    clearMinToUsMsat(): void;
    getMinToUsMsat(): cln_primitives_pb.Amount | undefined;
    setMinToUsMsat(value?: cln_primitives_pb.Amount): ListclosedchannelsClosedchannels;

    hasMaxToUsMsat(): boolean;
    clearMaxToUsMsat(): void;
    getMaxToUsMsat(): cln_primitives_pb.Amount | undefined;
    setMaxToUsMsat(value?: cln_primitives_pb.Amount): ListclosedchannelsClosedchannels;

    hasLastCommitmentTxid(): boolean;
    clearLastCommitmentTxid(): void;
    getLastCommitmentTxid(): Uint8Array | string;
    getLastCommitmentTxid_asU8(): Uint8Array;
    getLastCommitmentTxid_asB64(): string;
    setLastCommitmentTxid(value: Uint8Array | string): ListclosedchannelsClosedchannels;

    hasLastCommitmentFeeMsat(): boolean;
    clearLastCommitmentFeeMsat(): void;
    getLastCommitmentFeeMsat(): cln_primitives_pb.Amount | undefined;
    setLastCommitmentFeeMsat(value?: cln_primitives_pb.Amount): ListclosedchannelsClosedchannels;
    getCloseCause(): ListclosedchannelsClosedchannels.ListclosedchannelsClosedchannelsClose_cause;
    setCloseCause(value: ListclosedchannelsClosedchannels.ListclosedchannelsClosedchannelsClose_cause): ListclosedchannelsClosedchannels;

    hasLastStableConnection(): boolean;
    clearLastStableConnection(): void;
    getLastStableConnection(): number | undefined;
    setLastStableConnection(value: number): ListclosedchannelsClosedchannels;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ListclosedchannelsClosedchannels.AsObject;
    static toObject(includeInstance: boolean, msg: ListclosedchannelsClosedchannels): ListclosedchannelsClosedchannels.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ListclosedchannelsClosedchannels, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ListclosedchannelsClosedchannels;
    static deserializeBinaryFromReader(message: ListclosedchannelsClosedchannels, reader: jspb.BinaryReader): ListclosedchannelsClosedchannels;
}

export namespace ListclosedchannelsClosedchannels {
    export type AsObject = {
        peerId: Uint8Array | string,
        channelId: Uint8Array | string,
        shortChannelId?: string,
        alias?: ListclosedchannelsClosedchannelsAlias.AsObject,
        opener: cln_primitives_pb.ChannelSide,
        closer?: cln_primitives_pb.ChannelSide,
        pb_private: boolean,
        totalLocalCommitments: number,
        totalRemoteCommitments: number,
        totalHtlcsSent: number,
        fundingTxid: Uint8Array | string,
        fundingOutnum: number,
        leased: boolean,
        fundingFeePaidMsat?: cln_primitives_pb.Amount.AsObject,
        fundingFeeRcvdMsat?: cln_primitives_pb.Amount.AsObject,
        fundingPushedMsat?: cln_primitives_pb.Amount.AsObject,
        totalMsat?: cln_primitives_pb.Amount.AsObject,
        finalToUsMsat?: cln_primitives_pb.Amount.AsObject,
        minToUsMsat?: cln_primitives_pb.Amount.AsObject,
        maxToUsMsat?: cln_primitives_pb.Amount.AsObject,
        lastCommitmentTxid: Uint8Array | string,
        lastCommitmentFeeMsat?: cln_primitives_pb.Amount.AsObject,
        closeCause: ListclosedchannelsClosedchannels.ListclosedchannelsClosedchannelsClose_cause,
        lastStableConnection?: number,
    }

    export enum ListclosedchannelsClosedchannelsClose_cause {
    UNKNOWN = 0,
    LOCAL = 1,
    USER = 2,
    REMOTE = 3,
    PROTOCOL = 4,
    ONCHAIN = 5,
    }

}

export class ListclosedchannelsClosedchannelsAlias extends jspb.Message { 

    hasLocal(): boolean;
    clearLocal(): void;
    getLocal(): string | undefined;
    setLocal(value: string): ListclosedchannelsClosedchannelsAlias;

    hasRemote(): boolean;
    clearRemote(): void;
    getRemote(): string | undefined;
    setRemote(value: string): ListclosedchannelsClosedchannelsAlias;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ListclosedchannelsClosedchannelsAlias.AsObject;
    static toObject(includeInstance: boolean, msg: ListclosedchannelsClosedchannelsAlias): ListclosedchannelsClosedchannelsAlias.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ListclosedchannelsClosedchannelsAlias, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ListclosedchannelsClosedchannelsAlias;
    static deserializeBinaryFromReader(message: ListclosedchannelsClosedchannelsAlias, reader: jspb.BinaryReader): ListclosedchannelsClosedchannelsAlias;
}

export namespace ListclosedchannelsClosedchannelsAlias {
    export type AsObject = {
        local?: string,
        remote?: string,
    }
}

export class DecodepayRequest extends jspb.Message { 
    getBolt11(): string;
    setBolt11(value: string): DecodepayRequest;

    hasDescription(): boolean;
    clearDescription(): void;
    getDescription(): string | undefined;
    setDescription(value: string): DecodepayRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): DecodepayRequest.AsObject;
    static toObject(includeInstance: boolean, msg: DecodepayRequest): DecodepayRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: DecodepayRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): DecodepayRequest;
    static deserializeBinaryFromReader(message: DecodepayRequest, reader: jspb.BinaryReader): DecodepayRequest;
}

export namespace DecodepayRequest {
    export type AsObject = {
        bolt11: string,
        description?: string,
    }
}

export class DecodepayResponse extends jspb.Message { 
    getCurrency(): string;
    setCurrency(value: string): DecodepayResponse;
    getCreatedAt(): number;
    setCreatedAt(value: number): DecodepayResponse;
    getExpiry(): number;
    setExpiry(value: number): DecodepayResponse;
    getPayee(): Uint8Array | string;
    getPayee_asU8(): Uint8Array;
    getPayee_asB64(): string;
    setPayee(value: Uint8Array | string): DecodepayResponse;

    hasAmountMsat(): boolean;
    clearAmountMsat(): void;
    getAmountMsat(): cln_primitives_pb.Amount | undefined;
    setAmountMsat(value?: cln_primitives_pb.Amount): DecodepayResponse;
    getPaymentHash(): Uint8Array | string;
    getPaymentHash_asU8(): Uint8Array;
    getPaymentHash_asB64(): string;
    setPaymentHash(value: Uint8Array | string): DecodepayResponse;
    getSignature(): string;
    setSignature(value: string): DecodepayResponse;

    hasDescription(): boolean;
    clearDescription(): void;
    getDescription(): string | undefined;
    setDescription(value: string): DecodepayResponse;

    hasDescriptionHash(): boolean;
    clearDescriptionHash(): void;
    getDescriptionHash(): Uint8Array | string;
    getDescriptionHash_asU8(): Uint8Array;
    getDescriptionHash_asB64(): string;
    setDescriptionHash(value: Uint8Array | string): DecodepayResponse;
    getMinFinalCltvExpiry(): number;
    setMinFinalCltvExpiry(value: number): DecodepayResponse;

    hasPaymentSecret(): boolean;
    clearPaymentSecret(): void;
    getPaymentSecret(): Uint8Array | string;
    getPaymentSecret_asU8(): Uint8Array;
    getPaymentSecret_asB64(): string;
    setPaymentSecret(value: Uint8Array | string): DecodepayResponse;

    hasFeatures(): boolean;
    clearFeatures(): void;
    getFeatures(): Uint8Array | string;
    getFeatures_asU8(): Uint8Array;
    getFeatures_asB64(): string;
    setFeatures(value: Uint8Array | string): DecodepayResponse;

    hasPaymentMetadata(): boolean;
    clearPaymentMetadata(): void;
    getPaymentMetadata(): Uint8Array | string;
    getPaymentMetadata_asU8(): Uint8Array;
    getPaymentMetadata_asB64(): string;
    setPaymentMetadata(value: Uint8Array | string): DecodepayResponse;
    clearFallbacksList(): void;
    getFallbacksList(): Array<DecodepayFallbacks>;
    setFallbacksList(value: Array<DecodepayFallbacks>): DecodepayResponse;
    addFallbacks(value?: DecodepayFallbacks, index?: number): DecodepayFallbacks;
    clearExtraList(): void;
    getExtraList(): Array<DecodepayExtra>;
    setExtraList(value: Array<DecodepayExtra>): DecodepayResponse;
    addExtra(value?: DecodepayExtra, index?: number): DecodepayExtra;

    hasRoutes(): boolean;
    clearRoutes(): void;
    getRoutes(): cln_primitives_pb.DecodeRoutehintList | undefined;
    setRoutes(value?: cln_primitives_pb.DecodeRoutehintList): DecodepayResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): DecodepayResponse.AsObject;
    static toObject(includeInstance: boolean, msg: DecodepayResponse): DecodepayResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: DecodepayResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): DecodepayResponse;
    static deserializeBinaryFromReader(message: DecodepayResponse, reader: jspb.BinaryReader): DecodepayResponse;
}

export namespace DecodepayResponse {
    export type AsObject = {
        currency: string,
        createdAt: number,
        expiry: number,
        payee: Uint8Array | string,
        amountMsat?: cln_primitives_pb.Amount.AsObject,
        paymentHash: Uint8Array | string,
        signature: string,
        description?: string,
        descriptionHash: Uint8Array | string,
        minFinalCltvExpiry: number,
        paymentSecret: Uint8Array | string,
        features: Uint8Array | string,
        paymentMetadata: Uint8Array | string,
        fallbacksList: Array<DecodepayFallbacks.AsObject>,
        extraList: Array<DecodepayExtra.AsObject>,
        routes?: cln_primitives_pb.DecodeRoutehintList.AsObject,
    }
}

export class DecodepayFallbacks extends jspb.Message { 
    getItemType(): DecodepayFallbacks.DecodepayFallbacksType;
    setItemType(value: DecodepayFallbacks.DecodepayFallbacksType): DecodepayFallbacks;

    hasAddr(): boolean;
    clearAddr(): void;
    getAddr(): string | undefined;
    setAddr(value: string): DecodepayFallbacks;
    getHex(): Uint8Array | string;
    getHex_asU8(): Uint8Array;
    getHex_asB64(): string;
    setHex(value: Uint8Array | string): DecodepayFallbacks;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): DecodepayFallbacks.AsObject;
    static toObject(includeInstance: boolean, msg: DecodepayFallbacks): DecodepayFallbacks.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: DecodepayFallbacks, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): DecodepayFallbacks;
    static deserializeBinaryFromReader(message: DecodepayFallbacks, reader: jspb.BinaryReader): DecodepayFallbacks;
}

export namespace DecodepayFallbacks {
    export type AsObject = {
        itemType: DecodepayFallbacks.DecodepayFallbacksType,
        addr?: string,
        hex: Uint8Array | string,
    }

    export enum DecodepayFallbacksType {
    P2PKH = 0,
    P2SH = 1,
    P2WPKH = 2,
    P2WSH = 3,
    P2TR = 4,
    }

}

export class DecodepayExtra extends jspb.Message { 
    getTag(): string;
    setTag(value: string): DecodepayExtra;
    getData(): string;
    setData(value: string): DecodepayExtra;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): DecodepayExtra.AsObject;
    static toObject(includeInstance: boolean, msg: DecodepayExtra): DecodepayExtra.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: DecodepayExtra, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): DecodepayExtra;
    static deserializeBinaryFromReader(message: DecodepayExtra, reader: jspb.BinaryReader): DecodepayExtra;
}

export namespace DecodepayExtra {
    export type AsObject = {
        tag: string,
        data: string,
    }
}

export class DecodeRequest extends jspb.Message { 
    getString(): string;
    setString(value: string): DecodeRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): DecodeRequest.AsObject;
    static toObject(includeInstance: boolean, msg: DecodeRequest): DecodeRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: DecodeRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): DecodeRequest;
    static deserializeBinaryFromReader(message: DecodeRequest, reader: jspb.BinaryReader): DecodeRequest;
}

export namespace DecodeRequest {
    export type AsObject = {
        string: string,
    }
}

export class DecodeResponse extends jspb.Message { 
    getItemType(): DecodeResponse.DecodeType;
    setItemType(value: DecodeResponse.DecodeType): DecodeResponse;
    getValid(): boolean;
    setValid(value: boolean): DecodeResponse;

    hasOfferId(): boolean;
    clearOfferId(): void;
    getOfferId(): Uint8Array | string;
    getOfferId_asU8(): Uint8Array;
    getOfferId_asB64(): string;
    setOfferId(value: Uint8Array | string): DecodeResponse;
    clearOfferChainsList(): void;
    getOfferChainsList(): Array<Uint8Array | string>;
    getOfferChainsList_asU8(): Array<Uint8Array>;
    getOfferChainsList_asB64(): Array<string>;
    setOfferChainsList(value: Array<Uint8Array | string>): DecodeResponse;
    addOfferChains(value: Uint8Array | string, index?: number): Uint8Array | string;

    hasOfferMetadata(): boolean;
    clearOfferMetadata(): void;
    getOfferMetadata(): Uint8Array | string;
    getOfferMetadata_asU8(): Uint8Array;
    getOfferMetadata_asB64(): string;
    setOfferMetadata(value: Uint8Array | string): DecodeResponse;

    hasOfferCurrency(): boolean;
    clearOfferCurrency(): void;
    getOfferCurrency(): string | undefined;
    setOfferCurrency(value: string): DecodeResponse;

    hasWarningUnknownOfferCurrency(): boolean;
    clearWarningUnknownOfferCurrency(): void;
    getWarningUnknownOfferCurrency(): string | undefined;
    setWarningUnknownOfferCurrency(value: string): DecodeResponse;

    hasCurrencyMinorUnit(): boolean;
    clearCurrencyMinorUnit(): void;
    getCurrencyMinorUnit(): number | undefined;
    setCurrencyMinorUnit(value: number): DecodeResponse;

    hasOfferAmount(): boolean;
    clearOfferAmount(): void;
    getOfferAmount(): number | undefined;
    setOfferAmount(value: number): DecodeResponse;

    hasOfferAmountMsat(): boolean;
    clearOfferAmountMsat(): void;
    getOfferAmountMsat(): cln_primitives_pb.Amount | undefined;
    setOfferAmountMsat(value?: cln_primitives_pb.Amount): DecodeResponse;

    hasOfferDescription(): boolean;
    clearOfferDescription(): void;
    getOfferDescription(): string | undefined;
    setOfferDescription(value: string): DecodeResponse;

    hasOfferIssuer(): boolean;
    clearOfferIssuer(): void;
    getOfferIssuer(): string | undefined;
    setOfferIssuer(value: string): DecodeResponse;

    hasOfferFeatures(): boolean;
    clearOfferFeatures(): void;
    getOfferFeatures(): Uint8Array | string;
    getOfferFeatures_asU8(): Uint8Array;
    getOfferFeatures_asB64(): string;
    setOfferFeatures(value: Uint8Array | string): DecodeResponse;

    hasOfferAbsoluteExpiry(): boolean;
    clearOfferAbsoluteExpiry(): void;
    getOfferAbsoluteExpiry(): number | undefined;
    setOfferAbsoluteExpiry(value: number): DecodeResponse;

    hasOfferQuantityMax(): boolean;
    clearOfferQuantityMax(): void;
    getOfferQuantityMax(): number | undefined;
    setOfferQuantityMax(value: number): DecodeResponse;
    clearOfferPathsList(): void;
    getOfferPathsList(): Array<DecodeOffer_paths>;
    setOfferPathsList(value: Array<DecodeOffer_paths>): DecodeResponse;
    addOfferPaths(value?: DecodeOffer_paths, index?: number): DecodeOffer_paths;

    hasOfferNodeId(): boolean;
    clearOfferNodeId(): void;
    getOfferNodeId(): Uint8Array | string;
    getOfferNodeId_asU8(): Uint8Array;
    getOfferNodeId_asB64(): string;
    setOfferNodeId(value: Uint8Array | string): DecodeResponse;

    hasWarningMissingOfferNodeId(): boolean;
    clearWarningMissingOfferNodeId(): void;
    getWarningMissingOfferNodeId(): string | undefined;
    setWarningMissingOfferNodeId(value: string): DecodeResponse;

    hasWarningInvalidOfferDescription(): boolean;
    clearWarningInvalidOfferDescription(): void;
    getWarningInvalidOfferDescription(): string | undefined;
    setWarningInvalidOfferDescription(value: string): DecodeResponse;

    hasWarningMissingOfferDescription(): boolean;
    clearWarningMissingOfferDescription(): void;
    getWarningMissingOfferDescription(): string | undefined;
    setWarningMissingOfferDescription(value: string): DecodeResponse;

    hasWarningInvalidOfferCurrency(): boolean;
    clearWarningInvalidOfferCurrency(): void;
    getWarningInvalidOfferCurrency(): string | undefined;
    setWarningInvalidOfferCurrency(value: string): DecodeResponse;

    hasWarningInvalidOfferIssuer(): boolean;
    clearWarningInvalidOfferIssuer(): void;
    getWarningInvalidOfferIssuer(): string | undefined;
    setWarningInvalidOfferIssuer(value: string): DecodeResponse;

    hasInvreqMetadata(): boolean;
    clearInvreqMetadata(): void;
    getInvreqMetadata(): Uint8Array | string;
    getInvreqMetadata_asU8(): Uint8Array;
    getInvreqMetadata_asB64(): string;
    setInvreqMetadata(value: Uint8Array | string): DecodeResponse;

    hasInvreqPayerId(): boolean;
    clearInvreqPayerId(): void;
    getInvreqPayerId(): Uint8Array | string;
    getInvreqPayerId_asU8(): Uint8Array;
    getInvreqPayerId_asB64(): string;
    setInvreqPayerId(value: Uint8Array | string): DecodeResponse;

    hasInvreqChain(): boolean;
    clearInvreqChain(): void;
    getInvreqChain(): Uint8Array | string;
    getInvreqChain_asU8(): Uint8Array;
    getInvreqChain_asB64(): string;
    setInvreqChain(value: Uint8Array | string): DecodeResponse;

    hasInvreqAmountMsat(): boolean;
    clearInvreqAmountMsat(): void;
    getInvreqAmountMsat(): cln_primitives_pb.Amount | undefined;
    setInvreqAmountMsat(value?: cln_primitives_pb.Amount): DecodeResponse;

    hasInvreqFeatures(): boolean;
    clearInvreqFeatures(): void;
    getInvreqFeatures(): Uint8Array | string;
    getInvreqFeatures_asU8(): Uint8Array;
    getInvreqFeatures_asB64(): string;
    setInvreqFeatures(value: Uint8Array | string): DecodeResponse;

    hasInvreqQuantity(): boolean;
    clearInvreqQuantity(): void;
    getInvreqQuantity(): number | undefined;
    setInvreqQuantity(value: number): DecodeResponse;

    hasInvreqPayerNote(): boolean;
    clearInvreqPayerNote(): void;
    getInvreqPayerNote(): string | undefined;
    setInvreqPayerNote(value: string): DecodeResponse;

    hasInvreqRecurrenceCounter(): boolean;
    clearInvreqRecurrenceCounter(): void;
    getInvreqRecurrenceCounter(): number | undefined;
    setInvreqRecurrenceCounter(value: number): DecodeResponse;

    hasInvreqRecurrenceStart(): boolean;
    clearInvreqRecurrenceStart(): void;
    getInvreqRecurrenceStart(): number | undefined;
    setInvreqRecurrenceStart(value: number): DecodeResponse;

    hasWarningMissingInvreqMetadata(): boolean;
    clearWarningMissingInvreqMetadata(): void;
    getWarningMissingInvreqMetadata(): string | undefined;
    setWarningMissingInvreqMetadata(value: string): DecodeResponse;

    hasWarningMissingInvreqPayerId(): boolean;
    clearWarningMissingInvreqPayerId(): void;
    getWarningMissingInvreqPayerId(): string | undefined;
    setWarningMissingInvreqPayerId(value: string): DecodeResponse;

    hasWarningInvalidInvreqPayerNote(): boolean;
    clearWarningInvalidInvreqPayerNote(): void;
    getWarningInvalidInvreqPayerNote(): string | undefined;
    setWarningInvalidInvreqPayerNote(value: string): DecodeResponse;

    hasWarningMissingInvoiceRequestSignature(): boolean;
    clearWarningMissingInvoiceRequestSignature(): void;
    getWarningMissingInvoiceRequestSignature(): string | undefined;
    setWarningMissingInvoiceRequestSignature(value: string): DecodeResponse;

    hasWarningInvalidInvoiceRequestSignature(): boolean;
    clearWarningInvalidInvoiceRequestSignature(): void;
    getWarningInvalidInvoiceRequestSignature(): string | undefined;
    setWarningInvalidInvoiceRequestSignature(value: string): DecodeResponse;

    hasInvoiceCreatedAt(): boolean;
    clearInvoiceCreatedAt(): void;
    getInvoiceCreatedAt(): number | undefined;
    setInvoiceCreatedAt(value: number): DecodeResponse;

    hasInvoiceRelativeExpiry(): boolean;
    clearInvoiceRelativeExpiry(): void;
    getInvoiceRelativeExpiry(): number | undefined;
    setInvoiceRelativeExpiry(value: number): DecodeResponse;

    hasInvoicePaymentHash(): boolean;
    clearInvoicePaymentHash(): void;
    getInvoicePaymentHash(): Uint8Array | string;
    getInvoicePaymentHash_asU8(): Uint8Array;
    getInvoicePaymentHash_asB64(): string;
    setInvoicePaymentHash(value: Uint8Array | string): DecodeResponse;

    hasInvoiceAmountMsat(): boolean;
    clearInvoiceAmountMsat(): void;
    getInvoiceAmountMsat(): cln_primitives_pb.Amount | undefined;
    setInvoiceAmountMsat(value?: cln_primitives_pb.Amount): DecodeResponse;
    clearInvoiceFallbacksList(): void;
    getInvoiceFallbacksList(): Array<DecodeInvoice_fallbacks>;
    setInvoiceFallbacksList(value: Array<DecodeInvoice_fallbacks>): DecodeResponse;
    addInvoiceFallbacks(value?: DecodeInvoice_fallbacks, index?: number): DecodeInvoice_fallbacks;

    hasInvoiceFeatures(): boolean;
    clearInvoiceFeatures(): void;
    getInvoiceFeatures(): Uint8Array | string;
    getInvoiceFeatures_asU8(): Uint8Array;
    getInvoiceFeatures_asB64(): string;
    setInvoiceFeatures(value: Uint8Array | string): DecodeResponse;

    hasInvoiceNodeId(): boolean;
    clearInvoiceNodeId(): void;
    getInvoiceNodeId(): Uint8Array | string;
    getInvoiceNodeId_asU8(): Uint8Array;
    getInvoiceNodeId_asB64(): string;
    setInvoiceNodeId(value: Uint8Array | string): DecodeResponse;

    hasInvoiceRecurrenceBasetime(): boolean;
    clearInvoiceRecurrenceBasetime(): void;
    getInvoiceRecurrenceBasetime(): number | undefined;
    setInvoiceRecurrenceBasetime(value: number): DecodeResponse;

    hasWarningMissingInvoicePaths(): boolean;
    clearWarningMissingInvoicePaths(): void;
    getWarningMissingInvoicePaths(): string | undefined;
    setWarningMissingInvoicePaths(value: string): DecodeResponse;

    hasWarningMissingInvoiceBlindedpay(): boolean;
    clearWarningMissingInvoiceBlindedpay(): void;
    getWarningMissingInvoiceBlindedpay(): string | undefined;
    setWarningMissingInvoiceBlindedpay(value: string): DecodeResponse;

    hasWarningMissingInvoiceCreatedAt(): boolean;
    clearWarningMissingInvoiceCreatedAt(): void;
    getWarningMissingInvoiceCreatedAt(): string | undefined;
    setWarningMissingInvoiceCreatedAt(value: string): DecodeResponse;

    hasWarningMissingInvoicePaymentHash(): boolean;
    clearWarningMissingInvoicePaymentHash(): void;
    getWarningMissingInvoicePaymentHash(): string | undefined;
    setWarningMissingInvoicePaymentHash(value: string): DecodeResponse;

    hasWarningMissingInvoiceAmount(): boolean;
    clearWarningMissingInvoiceAmount(): void;
    getWarningMissingInvoiceAmount(): string | undefined;
    setWarningMissingInvoiceAmount(value: string): DecodeResponse;

    hasWarningMissingInvoiceRecurrenceBasetime(): boolean;
    clearWarningMissingInvoiceRecurrenceBasetime(): void;
    getWarningMissingInvoiceRecurrenceBasetime(): string | undefined;
    setWarningMissingInvoiceRecurrenceBasetime(value: string): DecodeResponse;

    hasWarningMissingInvoiceNodeId(): boolean;
    clearWarningMissingInvoiceNodeId(): void;
    getWarningMissingInvoiceNodeId(): string | undefined;
    setWarningMissingInvoiceNodeId(value: string): DecodeResponse;

    hasWarningMissingInvoiceSignature(): boolean;
    clearWarningMissingInvoiceSignature(): void;
    getWarningMissingInvoiceSignature(): string | undefined;
    setWarningMissingInvoiceSignature(value: string): DecodeResponse;

    hasWarningInvalidInvoiceSignature(): boolean;
    clearWarningInvalidInvoiceSignature(): void;
    getWarningInvalidInvoiceSignature(): string | undefined;
    setWarningInvalidInvoiceSignature(value: string): DecodeResponse;
    clearFallbacksList(): void;
    getFallbacksList(): Array<DecodeFallbacks>;
    setFallbacksList(value: Array<DecodeFallbacks>): DecodeResponse;
    addFallbacks(value?: DecodeFallbacks, index?: number): DecodeFallbacks;

    hasCreatedAt(): boolean;
    clearCreatedAt(): void;
    getCreatedAt(): number | undefined;
    setCreatedAt(value: number): DecodeResponse;

    hasExpiry(): boolean;
    clearExpiry(): void;
    getExpiry(): number | undefined;
    setExpiry(value: number): DecodeResponse;

    hasPayee(): boolean;
    clearPayee(): void;
    getPayee(): Uint8Array | string;
    getPayee_asU8(): Uint8Array;
    getPayee_asB64(): string;
    setPayee(value: Uint8Array | string): DecodeResponse;

    hasPaymentHash(): boolean;
    clearPaymentHash(): void;
    getPaymentHash(): Uint8Array | string;
    getPaymentHash_asU8(): Uint8Array;
    getPaymentHash_asB64(): string;
    setPaymentHash(value: Uint8Array | string): DecodeResponse;

    hasDescriptionHash(): boolean;
    clearDescriptionHash(): void;
    getDescriptionHash(): Uint8Array | string;
    getDescriptionHash_asU8(): Uint8Array;
    getDescriptionHash_asB64(): string;
    setDescriptionHash(value: Uint8Array | string): DecodeResponse;

    hasMinFinalCltvExpiry(): boolean;
    clearMinFinalCltvExpiry(): void;
    getMinFinalCltvExpiry(): number | undefined;
    setMinFinalCltvExpiry(value: number): DecodeResponse;

    hasPaymentSecret(): boolean;
    clearPaymentSecret(): void;
    getPaymentSecret(): Uint8Array | string;
    getPaymentSecret_asU8(): Uint8Array;
    getPaymentSecret_asB64(): string;
    setPaymentSecret(value: Uint8Array | string): DecodeResponse;

    hasPaymentMetadata(): boolean;
    clearPaymentMetadata(): void;
    getPaymentMetadata(): Uint8Array | string;
    getPaymentMetadata_asU8(): Uint8Array;
    getPaymentMetadata_asB64(): string;
    setPaymentMetadata(value: Uint8Array | string): DecodeResponse;
    clearExtraList(): void;
    getExtraList(): Array<DecodeExtra>;
    setExtraList(value: Array<DecodeExtra>): DecodeResponse;
    addExtra(value?: DecodeExtra, index?: number): DecodeExtra;

    hasUniqueId(): boolean;
    clearUniqueId(): void;
    getUniqueId(): string | undefined;
    setUniqueId(value: string): DecodeResponse;

    hasVersion(): boolean;
    clearVersion(): void;
    getVersion(): string | undefined;
    setVersion(value: string): DecodeResponse;

    hasString(): boolean;
    clearString(): void;
    getString(): string | undefined;
    setString(value: string): DecodeResponse;
    clearRestrictionsList(): void;
    getRestrictionsList(): Array<DecodeRestrictions>;
    setRestrictionsList(value: Array<DecodeRestrictions>): DecodeResponse;
    addRestrictions(value?: DecodeRestrictions, index?: number): DecodeRestrictions;

    hasWarningRuneInvalidUtf8(): boolean;
    clearWarningRuneInvalidUtf8(): void;
    getWarningRuneInvalidUtf8(): string | undefined;
    setWarningRuneInvalidUtf8(value: string): DecodeResponse;

    hasHex(): boolean;
    clearHex(): void;
    getHex(): Uint8Array | string;
    getHex_asU8(): Uint8Array;
    getHex_asB64(): string;
    setHex(value: Uint8Array | string): DecodeResponse;

    hasDecrypted(): boolean;
    clearDecrypted(): void;
    getDecrypted(): Uint8Array | string;
    getDecrypted_asU8(): Uint8Array;
    getDecrypted_asB64(): string;
    setDecrypted(value: Uint8Array | string): DecodeResponse;

    hasSignature(): boolean;
    clearSignature(): void;
    getSignature(): string | undefined;
    setSignature(value: string): DecodeResponse;

    hasCurrency(): boolean;
    clearCurrency(): void;
    getCurrency(): string | undefined;
    setCurrency(value: string): DecodeResponse;

    hasAmountMsat(): boolean;
    clearAmountMsat(): void;
    getAmountMsat(): cln_primitives_pb.Amount | undefined;
    setAmountMsat(value?: cln_primitives_pb.Amount): DecodeResponse;

    hasDescription(): boolean;
    clearDescription(): void;
    getDescription(): string | undefined;
    setDescription(value: string): DecodeResponse;

    hasFeatures(): boolean;
    clearFeatures(): void;
    getFeatures(): Uint8Array | string;
    getFeatures_asU8(): Uint8Array;
    getFeatures_asB64(): string;
    setFeatures(value: Uint8Array | string): DecodeResponse;

    hasRoutes(): boolean;
    clearRoutes(): void;
    getRoutes(): cln_primitives_pb.DecodeRoutehintList | undefined;
    setRoutes(value?: cln_primitives_pb.DecodeRoutehintList): DecodeResponse;

    hasOfferIssuerId(): boolean;
    clearOfferIssuerId(): void;
    getOfferIssuerId(): Uint8Array | string;
    getOfferIssuerId_asU8(): Uint8Array;
    getOfferIssuerId_asB64(): string;
    setOfferIssuerId(value: Uint8Array | string): DecodeResponse;

    hasWarningMissingOfferIssuerId(): boolean;
    clearWarningMissingOfferIssuerId(): void;
    getWarningMissingOfferIssuerId(): string | undefined;
    setWarningMissingOfferIssuerId(value: string): DecodeResponse;
    clearInvreqPathsList(): void;
    getInvreqPathsList(): Array<DecodeInvreq_paths>;
    setInvreqPathsList(value: Array<DecodeInvreq_paths>): DecodeResponse;
    addInvreqPaths(value?: DecodeInvreq_paths, index?: number): DecodeInvreq_paths;

    hasWarningEmptyBlindedPath(): boolean;
    clearWarningEmptyBlindedPath(): void;
    getWarningEmptyBlindedPath(): string | undefined;
    setWarningEmptyBlindedPath(value: string): DecodeResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): DecodeResponse.AsObject;
    static toObject(includeInstance: boolean, msg: DecodeResponse): DecodeResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: DecodeResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): DecodeResponse;
    static deserializeBinaryFromReader(message: DecodeResponse, reader: jspb.BinaryReader): DecodeResponse;
}

export namespace DecodeResponse {
    export type AsObject = {
        itemType: DecodeResponse.DecodeType,
        valid: boolean,
        offerId: Uint8Array | string,
        offerChainsList: Array<Uint8Array | string>,
        offerMetadata: Uint8Array | string,
        offerCurrency?: string,
        warningUnknownOfferCurrency?: string,
        currencyMinorUnit?: number,
        offerAmount?: number,
        offerAmountMsat?: cln_primitives_pb.Amount.AsObject,
        offerDescription?: string,
        offerIssuer?: string,
        offerFeatures: Uint8Array | string,
        offerAbsoluteExpiry?: number,
        offerQuantityMax?: number,
        offerPathsList: Array<DecodeOffer_paths.AsObject>,
        offerNodeId: Uint8Array | string,
        warningMissingOfferNodeId?: string,
        warningInvalidOfferDescription?: string,
        warningMissingOfferDescription?: string,
        warningInvalidOfferCurrency?: string,
        warningInvalidOfferIssuer?: string,
        invreqMetadata: Uint8Array | string,
        invreqPayerId: Uint8Array | string,
        invreqChain: Uint8Array | string,
        invreqAmountMsat?: cln_primitives_pb.Amount.AsObject,
        invreqFeatures: Uint8Array | string,
        invreqQuantity?: number,
        invreqPayerNote?: string,
        invreqRecurrenceCounter?: number,
        invreqRecurrenceStart?: number,
        warningMissingInvreqMetadata?: string,
        warningMissingInvreqPayerId?: string,
        warningInvalidInvreqPayerNote?: string,
        warningMissingInvoiceRequestSignature?: string,
        warningInvalidInvoiceRequestSignature?: string,
        invoiceCreatedAt?: number,
        invoiceRelativeExpiry?: number,
        invoicePaymentHash: Uint8Array | string,
        invoiceAmountMsat?: cln_primitives_pb.Amount.AsObject,
        invoiceFallbacksList: Array<DecodeInvoice_fallbacks.AsObject>,
        invoiceFeatures: Uint8Array | string,
        invoiceNodeId: Uint8Array | string,
        invoiceRecurrenceBasetime?: number,
        warningMissingInvoicePaths?: string,
        warningMissingInvoiceBlindedpay?: string,
        warningMissingInvoiceCreatedAt?: string,
        warningMissingInvoicePaymentHash?: string,
        warningMissingInvoiceAmount?: string,
        warningMissingInvoiceRecurrenceBasetime?: string,
        warningMissingInvoiceNodeId?: string,
        warningMissingInvoiceSignature?: string,
        warningInvalidInvoiceSignature?: string,
        fallbacksList: Array<DecodeFallbacks.AsObject>,
        createdAt?: number,
        expiry?: number,
        payee: Uint8Array | string,
        paymentHash: Uint8Array | string,
        descriptionHash: Uint8Array | string,
        minFinalCltvExpiry?: number,
        paymentSecret: Uint8Array | string,
        paymentMetadata: Uint8Array | string,
        extraList: Array<DecodeExtra.AsObject>,
        uniqueId?: string,
        version?: string,
        string?: string,
        restrictionsList: Array<DecodeRestrictions.AsObject>,
        warningRuneInvalidUtf8?: string,
        hex: Uint8Array | string,
        decrypted: Uint8Array | string,
        signature?: string,
        currency?: string,
        amountMsat?: cln_primitives_pb.Amount.AsObject,
        description?: string,
        features: Uint8Array | string,
        routes?: cln_primitives_pb.DecodeRoutehintList.AsObject,
        offerIssuerId: Uint8Array | string,
        warningMissingOfferIssuerId?: string,
        invreqPathsList: Array<DecodeInvreq_paths.AsObject>,
        warningEmptyBlindedPath?: string,
    }

    export enum DecodeType {
    BOLT12_OFFER = 0,
    BOLT12_INVOICE = 1,
    BOLT12_INVOICE_REQUEST = 2,
    BOLT11_INVOICE = 3,
    RUNE = 4,
    EMERGENCY_RECOVER = 5,
    }

}

export class DecodeOffer_paths extends jspb.Message { 

    hasFirstNodeId(): boolean;
    clearFirstNodeId(): void;
    getFirstNodeId(): Uint8Array | string;
    getFirstNodeId_asU8(): Uint8Array;
    getFirstNodeId_asB64(): string;
    setFirstNodeId(value: Uint8Array | string): DecodeOffer_paths;

    hasBlinding(): boolean;
    clearBlinding(): void;
    getBlinding(): Uint8Array | string;
    getBlinding_asU8(): Uint8Array;
    getBlinding_asB64(): string;
    setBlinding(value: Uint8Array | string): DecodeOffer_paths;

    hasFirstScidDir(): boolean;
    clearFirstScidDir(): void;
    getFirstScidDir(): number | undefined;
    setFirstScidDir(value: number): DecodeOffer_paths;

    hasFirstScid(): boolean;
    clearFirstScid(): void;
    getFirstScid(): string | undefined;
    setFirstScid(value: string): DecodeOffer_paths;

    hasFirstPathKey(): boolean;
    clearFirstPathKey(): void;
    getFirstPathKey(): Uint8Array | string;
    getFirstPathKey_asU8(): Uint8Array;
    getFirstPathKey_asB64(): string;
    setFirstPathKey(value: Uint8Array | string): DecodeOffer_paths;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): DecodeOffer_paths.AsObject;
    static toObject(includeInstance: boolean, msg: DecodeOffer_paths): DecodeOffer_paths.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: DecodeOffer_paths, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): DecodeOffer_paths;
    static deserializeBinaryFromReader(message: DecodeOffer_paths, reader: jspb.BinaryReader): DecodeOffer_paths;
}

export namespace DecodeOffer_paths {
    export type AsObject = {
        firstNodeId: Uint8Array | string,
        blinding: Uint8Array | string,
        firstScidDir?: number,
        firstScid?: string,
        firstPathKey: Uint8Array | string,
    }
}

export class DecodeOffer_recurrencePaywindow extends jspb.Message { 
    getSecondsBefore(): number;
    setSecondsBefore(value: number): DecodeOffer_recurrencePaywindow;
    getSecondsAfter(): number;
    setSecondsAfter(value: number): DecodeOffer_recurrencePaywindow;

    hasProportionalAmount(): boolean;
    clearProportionalAmount(): void;
    getProportionalAmount(): boolean | undefined;
    setProportionalAmount(value: boolean): DecodeOffer_recurrencePaywindow;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): DecodeOffer_recurrencePaywindow.AsObject;
    static toObject(includeInstance: boolean, msg: DecodeOffer_recurrencePaywindow): DecodeOffer_recurrencePaywindow.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: DecodeOffer_recurrencePaywindow, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): DecodeOffer_recurrencePaywindow;
    static deserializeBinaryFromReader(message: DecodeOffer_recurrencePaywindow, reader: jspb.BinaryReader): DecodeOffer_recurrencePaywindow;
}

export namespace DecodeOffer_recurrencePaywindow {
    export type AsObject = {
        secondsBefore: number,
        secondsAfter: number,
        proportionalAmount?: boolean,
    }
}

export class DecodeInvreq_paths extends jspb.Message { 

    hasFirstScidDir(): boolean;
    clearFirstScidDir(): void;
    getFirstScidDir(): number | undefined;
    setFirstScidDir(value: number): DecodeInvreq_paths;

    hasBlinding(): boolean;
    clearBlinding(): void;
    getBlinding(): Uint8Array | string;
    getBlinding_asU8(): Uint8Array;
    getBlinding_asB64(): string;
    setBlinding(value: Uint8Array | string): DecodeInvreq_paths;

    hasFirstNodeId(): boolean;
    clearFirstNodeId(): void;
    getFirstNodeId(): Uint8Array | string;
    getFirstNodeId_asU8(): Uint8Array;
    getFirstNodeId_asB64(): string;
    setFirstNodeId(value: Uint8Array | string): DecodeInvreq_paths;

    hasFirstScid(): boolean;
    clearFirstScid(): void;
    getFirstScid(): string | undefined;
    setFirstScid(value: string): DecodeInvreq_paths;
    clearPathList(): void;
    getPathList(): Array<DecodeInvreq_pathsPath>;
    setPathList(value: Array<DecodeInvreq_pathsPath>): DecodeInvreq_paths;
    addPath(value?: DecodeInvreq_pathsPath, index?: number): DecodeInvreq_pathsPath;

    hasFirstPathKey(): boolean;
    clearFirstPathKey(): void;
    getFirstPathKey(): Uint8Array | string;
    getFirstPathKey_asU8(): Uint8Array;
    getFirstPathKey_asB64(): string;
    setFirstPathKey(value: Uint8Array | string): DecodeInvreq_paths;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): DecodeInvreq_paths.AsObject;
    static toObject(includeInstance: boolean, msg: DecodeInvreq_paths): DecodeInvreq_paths.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: DecodeInvreq_paths, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): DecodeInvreq_paths;
    static deserializeBinaryFromReader(message: DecodeInvreq_paths, reader: jspb.BinaryReader): DecodeInvreq_paths;
}

export namespace DecodeInvreq_paths {
    export type AsObject = {
        firstScidDir?: number,
        blinding: Uint8Array | string,
        firstNodeId: Uint8Array | string,
        firstScid?: string,
        pathList: Array<DecodeInvreq_pathsPath.AsObject>,
        firstPathKey: Uint8Array | string,
    }
}

export class DecodeInvreq_pathsPath extends jspb.Message { 
    getBlindedNodeId(): Uint8Array | string;
    getBlindedNodeId_asU8(): Uint8Array;
    getBlindedNodeId_asB64(): string;
    setBlindedNodeId(value: Uint8Array | string): DecodeInvreq_pathsPath;
    getEncryptedRecipientData(): Uint8Array | string;
    getEncryptedRecipientData_asU8(): Uint8Array;
    getEncryptedRecipientData_asB64(): string;
    setEncryptedRecipientData(value: Uint8Array | string): DecodeInvreq_pathsPath;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): DecodeInvreq_pathsPath.AsObject;
    static toObject(includeInstance: boolean, msg: DecodeInvreq_pathsPath): DecodeInvreq_pathsPath.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: DecodeInvreq_pathsPath, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): DecodeInvreq_pathsPath;
    static deserializeBinaryFromReader(message: DecodeInvreq_pathsPath, reader: jspb.BinaryReader): DecodeInvreq_pathsPath;
}

export namespace DecodeInvreq_pathsPath {
    export type AsObject = {
        blindedNodeId: Uint8Array | string,
        encryptedRecipientData: Uint8Array | string,
    }
}

export class DecodeInvoice_pathsPath extends jspb.Message { 
    getBlindedNodeId(): Uint8Array | string;
    getBlindedNodeId_asU8(): Uint8Array;
    getBlindedNodeId_asB64(): string;
    setBlindedNodeId(value: Uint8Array | string): DecodeInvoice_pathsPath;
    getEncryptedRecipientData(): Uint8Array | string;
    getEncryptedRecipientData_asU8(): Uint8Array;
    getEncryptedRecipientData_asB64(): string;
    setEncryptedRecipientData(value: Uint8Array | string): DecodeInvoice_pathsPath;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): DecodeInvoice_pathsPath.AsObject;
    static toObject(includeInstance: boolean, msg: DecodeInvoice_pathsPath): DecodeInvoice_pathsPath.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: DecodeInvoice_pathsPath, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): DecodeInvoice_pathsPath;
    static deserializeBinaryFromReader(message: DecodeInvoice_pathsPath, reader: jspb.BinaryReader): DecodeInvoice_pathsPath;
}

export namespace DecodeInvoice_pathsPath {
    export type AsObject = {
        blindedNodeId: Uint8Array | string,
        encryptedRecipientData: Uint8Array | string,
    }
}

export class DecodeInvoice_fallbacks extends jspb.Message { 
    getVersion(): number;
    setVersion(value: number): DecodeInvoice_fallbacks;
    getHex(): Uint8Array | string;
    getHex_asU8(): Uint8Array;
    getHex_asB64(): string;
    setHex(value: Uint8Array | string): DecodeInvoice_fallbacks;

    hasAddress(): boolean;
    clearAddress(): void;
    getAddress(): string | undefined;
    setAddress(value: string): DecodeInvoice_fallbacks;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): DecodeInvoice_fallbacks.AsObject;
    static toObject(includeInstance: boolean, msg: DecodeInvoice_fallbacks): DecodeInvoice_fallbacks.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: DecodeInvoice_fallbacks, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): DecodeInvoice_fallbacks;
    static deserializeBinaryFromReader(message: DecodeInvoice_fallbacks, reader: jspb.BinaryReader): DecodeInvoice_fallbacks;
}

export namespace DecodeInvoice_fallbacks {
    export type AsObject = {
        version: number,
        hex: Uint8Array | string,
        address?: string,
    }
}

export class DecodeFallbacks extends jspb.Message { 

    hasWarningInvoiceFallbacksVersionInvalid(): boolean;
    clearWarningInvoiceFallbacksVersionInvalid(): void;
    getWarningInvoiceFallbacksVersionInvalid(): string | undefined;
    setWarningInvoiceFallbacksVersionInvalid(value: string): DecodeFallbacks;
    getItemType(): DecodeFallbacks.DecodeFallbacksType;
    setItemType(value: DecodeFallbacks.DecodeFallbacksType): DecodeFallbacks;

    hasAddr(): boolean;
    clearAddr(): void;
    getAddr(): string | undefined;
    setAddr(value: string): DecodeFallbacks;
    getHex(): Uint8Array | string;
    getHex_asU8(): Uint8Array;
    getHex_asB64(): string;
    setHex(value: Uint8Array | string): DecodeFallbacks;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): DecodeFallbacks.AsObject;
    static toObject(includeInstance: boolean, msg: DecodeFallbacks): DecodeFallbacks.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: DecodeFallbacks, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): DecodeFallbacks;
    static deserializeBinaryFromReader(message: DecodeFallbacks, reader: jspb.BinaryReader): DecodeFallbacks;
}

export namespace DecodeFallbacks {
    export type AsObject = {
        warningInvoiceFallbacksVersionInvalid?: string,
        itemType: DecodeFallbacks.DecodeFallbacksType,
        addr?: string,
        hex: Uint8Array | string,
    }

    export enum DecodeFallbacksType {
    P2PKH = 0,
    P2SH = 1,
    P2WPKH = 2,
    P2WSH = 3,
    P2TR = 4,
    }

}

export class DecodeExtra extends jspb.Message { 
    getTag(): string;
    setTag(value: string): DecodeExtra;
    getData(): string;
    setData(value: string): DecodeExtra;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): DecodeExtra.AsObject;
    static toObject(includeInstance: boolean, msg: DecodeExtra): DecodeExtra.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: DecodeExtra, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): DecodeExtra;
    static deserializeBinaryFromReader(message: DecodeExtra, reader: jspb.BinaryReader): DecodeExtra;
}

export namespace DecodeExtra {
    export type AsObject = {
        tag: string,
        data: string,
    }
}

export class DecodeRestrictions extends jspb.Message { 
    clearAlternativesList(): void;
    getAlternativesList(): Array<string>;
    setAlternativesList(value: Array<string>): DecodeRestrictions;
    addAlternatives(value: string, index?: number): string;
    getSummary(): string;
    setSummary(value: string): DecodeRestrictions;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): DecodeRestrictions.AsObject;
    static toObject(includeInstance: boolean, msg: DecodeRestrictions): DecodeRestrictions.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: DecodeRestrictions, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): DecodeRestrictions;
    static deserializeBinaryFromReader(message: DecodeRestrictions, reader: jspb.BinaryReader): DecodeRestrictions;
}

export namespace DecodeRestrictions {
    export type AsObject = {
        alternativesList: Array<string>,
        summary: string,
    }
}

export class DelpayRequest extends jspb.Message { 
    getPaymentHash(): Uint8Array | string;
    getPaymentHash_asU8(): Uint8Array;
    getPaymentHash_asB64(): string;
    setPaymentHash(value: Uint8Array | string): DelpayRequest;
    getStatus(): DelpayRequest.DelpayStatus;
    setStatus(value: DelpayRequest.DelpayStatus): DelpayRequest;

    hasPartid(): boolean;
    clearPartid(): void;
    getPartid(): number | undefined;
    setPartid(value: number): DelpayRequest;

    hasGroupid(): boolean;
    clearGroupid(): void;
    getGroupid(): number | undefined;
    setGroupid(value: number): DelpayRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): DelpayRequest.AsObject;
    static toObject(includeInstance: boolean, msg: DelpayRequest): DelpayRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: DelpayRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): DelpayRequest;
    static deserializeBinaryFromReader(message: DelpayRequest, reader: jspb.BinaryReader): DelpayRequest;
}

export namespace DelpayRequest {
    export type AsObject = {
        paymentHash: Uint8Array | string,
        status: DelpayRequest.DelpayStatus,
        partid?: number,
        groupid?: number,
    }

    export enum DelpayStatus {
    COMPLETE = 0,
    FAILED = 1,
    }

}

export class DelpayResponse extends jspb.Message { 
    clearPaymentsList(): void;
    getPaymentsList(): Array<DelpayPayments>;
    setPaymentsList(value: Array<DelpayPayments>): DelpayResponse;
    addPayments(value?: DelpayPayments, index?: number): DelpayPayments;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): DelpayResponse.AsObject;
    static toObject(includeInstance: boolean, msg: DelpayResponse): DelpayResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: DelpayResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): DelpayResponse;
    static deserializeBinaryFromReader(message: DelpayResponse, reader: jspb.BinaryReader): DelpayResponse;
}

export namespace DelpayResponse {
    export type AsObject = {
        paymentsList: Array<DelpayPayments.AsObject>,
    }
}

export class DelpayPayments extends jspb.Message { 

    hasCreatedIndex(): boolean;
    clearCreatedIndex(): void;
    getCreatedIndex(): number | undefined;
    setCreatedIndex(value: number): DelpayPayments;
    getId(): number;
    setId(value: number): DelpayPayments;
    getPaymentHash(): Uint8Array | string;
    getPaymentHash_asU8(): Uint8Array;
    getPaymentHash_asB64(): string;
    setPaymentHash(value: Uint8Array | string): DelpayPayments;
    getStatus(): DelpayPayments.DelpayPaymentsStatus;
    setStatus(value: DelpayPayments.DelpayPaymentsStatus): DelpayPayments;

    hasAmountSentMsat(): boolean;
    clearAmountSentMsat(): void;
    getAmountSentMsat(): cln_primitives_pb.Amount | undefined;
    setAmountSentMsat(value?: cln_primitives_pb.Amount): DelpayPayments;

    hasPartid(): boolean;
    clearPartid(): void;
    getPartid(): number | undefined;
    setPartid(value: number): DelpayPayments;

    hasDestination(): boolean;
    clearDestination(): void;
    getDestination(): Uint8Array | string;
    getDestination_asU8(): Uint8Array;
    getDestination_asB64(): string;
    setDestination(value: Uint8Array | string): DelpayPayments;

    hasAmountMsat(): boolean;
    clearAmountMsat(): void;
    getAmountMsat(): cln_primitives_pb.Amount | undefined;
    setAmountMsat(value?: cln_primitives_pb.Amount): DelpayPayments;
    getCreatedAt(): number;
    setCreatedAt(value: number): DelpayPayments;

    hasUpdatedIndex(): boolean;
    clearUpdatedIndex(): void;
    getUpdatedIndex(): number | undefined;
    setUpdatedIndex(value: number): DelpayPayments;

    hasCompletedAt(): boolean;
    clearCompletedAt(): void;
    getCompletedAt(): number | undefined;
    setCompletedAt(value: number): DelpayPayments;

    hasGroupid(): boolean;
    clearGroupid(): void;
    getGroupid(): number | undefined;
    setGroupid(value: number): DelpayPayments;

    hasPaymentPreimage(): boolean;
    clearPaymentPreimage(): void;
    getPaymentPreimage(): Uint8Array | string;
    getPaymentPreimage_asU8(): Uint8Array;
    getPaymentPreimage_asB64(): string;
    setPaymentPreimage(value: Uint8Array | string): DelpayPayments;

    hasLabel(): boolean;
    clearLabel(): void;
    getLabel(): string | undefined;
    setLabel(value: string): DelpayPayments;

    hasBolt11(): boolean;
    clearBolt11(): void;
    getBolt11(): string | undefined;
    setBolt11(value: string): DelpayPayments;

    hasBolt12(): boolean;
    clearBolt12(): void;
    getBolt12(): string | undefined;
    setBolt12(value: string): DelpayPayments;

    hasErroronion(): boolean;
    clearErroronion(): void;
    getErroronion(): Uint8Array | string;
    getErroronion_asU8(): Uint8Array;
    getErroronion_asB64(): string;
    setErroronion(value: Uint8Array | string): DelpayPayments;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): DelpayPayments.AsObject;
    static toObject(includeInstance: boolean, msg: DelpayPayments): DelpayPayments.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: DelpayPayments, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): DelpayPayments;
    static deserializeBinaryFromReader(message: DelpayPayments, reader: jspb.BinaryReader): DelpayPayments;
}

export namespace DelpayPayments {
    export type AsObject = {
        createdIndex?: number,
        id: number,
        paymentHash: Uint8Array | string,
        status: DelpayPayments.DelpayPaymentsStatus,
        amountSentMsat?: cln_primitives_pb.Amount.AsObject,
        partid?: number,
        destination: Uint8Array | string,
        amountMsat?: cln_primitives_pb.Amount.AsObject,
        createdAt: number,
        updatedIndex?: number,
        completedAt?: number,
        groupid?: number,
        paymentPreimage: Uint8Array | string,
        label?: string,
        bolt11?: string,
        bolt12?: string,
        erroronion: Uint8Array | string,
    }

    export enum DelpayPaymentsStatus {
    PENDING = 0,
    FAILED = 1,
    COMPLETE = 2,
    }

}

export class DelforwardRequest extends jspb.Message { 
    getInChannel(): string;
    setInChannel(value: string): DelforwardRequest;
    getInHtlcId(): number;
    setInHtlcId(value: number): DelforwardRequest;
    getStatus(): DelforwardRequest.DelforwardStatus;
    setStatus(value: DelforwardRequest.DelforwardStatus): DelforwardRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): DelforwardRequest.AsObject;
    static toObject(includeInstance: boolean, msg: DelforwardRequest): DelforwardRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: DelforwardRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): DelforwardRequest;
    static deserializeBinaryFromReader(message: DelforwardRequest, reader: jspb.BinaryReader): DelforwardRequest;
}

export namespace DelforwardRequest {
    export type AsObject = {
        inChannel: string,
        inHtlcId: number,
        status: DelforwardRequest.DelforwardStatus,
    }

    export enum DelforwardStatus {
    SETTLED = 0,
    LOCAL_FAILED = 1,
    FAILED = 2,
    }

}

export class DelforwardResponse extends jspb.Message { 

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): DelforwardResponse.AsObject;
    static toObject(includeInstance: boolean, msg: DelforwardResponse): DelforwardResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: DelforwardResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): DelforwardResponse;
    static deserializeBinaryFromReader(message: DelforwardResponse, reader: jspb.BinaryReader): DelforwardResponse;
}

export namespace DelforwardResponse {
    export type AsObject = {
    }
}

export class DisableofferRequest extends jspb.Message { 
    getOfferId(): Uint8Array | string;
    getOfferId_asU8(): Uint8Array;
    getOfferId_asB64(): string;
    setOfferId(value: Uint8Array | string): DisableofferRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): DisableofferRequest.AsObject;
    static toObject(includeInstance: boolean, msg: DisableofferRequest): DisableofferRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: DisableofferRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): DisableofferRequest;
    static deserializeBinaryFromReader(message: DisableofferRequest, reader: jspb.BinaryReader): DisableofferRequest;
}

export namespace DisableofferRequest {
    export type AsObject = {
        offerId: Uint8Array | string,
    }
}

export class DisableofferResponse extends jspb.Message { 
    getOfferId(): Uint8Array | string;
    getOfferId_asU8(): Uint8Array;
    getOfferId_asB64(): string;
    setOfferId(value: Uint8Array | string): DisableofferResponse;
    getActive(): boolean;
    setActive(value: boolean): DisableofferResponse;
    getSingleUse(): boolean;
    setSingleUse(value: boolean): DisableofferResponse;
    getBolt12(): string;
    setBolt12(value: string): DisableofferResponse;
    getUsed(): boolean;
    setUsed(value: boolean): DisableofferResponse;

    hasLabel(): boolean;
    clearLabel(): void;
    getLabel(): string | undefined;
    setLabel(value: string): DisableofferResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): DisableofferResponse.AsObject;
    static toObject(includeInstance: boolean, msg: DisableofferResponse): DisableofferResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: DisableofferResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): DisableofferResponse;
    static deserializeBinaryFromReader(message: DisableofferResponse, reader: jspb.BinaryReader): DisableofferResponse;
}

export namespace DisableofferResponse {
    export type AsObject = {
        offerId: Uint8Array | string,
        active: boolean,
        singleUse: boolean,
        bolt12: string,
        used: boolean,
        label?: string,
    }
}

export class EnableofferRequest extends jspb.Message { 
    getOfferId(): Uint8Array | string;
    getOfferId_asU8(): Uint8Array;
    getOfferId_asB64(): string;
    setOfferId(value: Uint8Array | string): EnableofferRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): EnableofferRequest.AsObject;
    static toObject(includeInstance: boolean, msg: EnableofferRequest): EnableofferRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: EnableofferRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): EnableofferRequest;
    static deserializeBinaryFromReader(message: EnableofferRequest, reader: jspb.BinaryReader): EnableofferRequest;
}

export namespace EnableofferRequest {
    export type AsObject = {
        offerId: Uint8Array | string,
    }
}

export class EnableofferResponse extends jspb.Message { 
    getOfferId(): Uint8Array | string;
    getOfferId_asU8(): Uint8Array;
    getOfferId_asB64(): string;
    setOfferId(value: Uint8Array | string): EnableofferResponse;
    getActive(): boolean;
    setActive(value: boolean): EnableofferResponse;
    getSingleUse(): boolean;
    setSingleUse(value: boolean): EnableofferResponse;
    getBolt12(): string;
    setBolt12(value: string): EnableofferResponse;
    getUsed(): boolean;
    setUsed(value: boolean): EnableofferResponse;

    hasLabel(): boolean;
    clearLabel(): void;
    getLabel(): string | undefined;
    setLabel(value: string): EnableofferResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): EnableofferResponse.AsObject;
    static toObject(includeInstance: boolean, msg: EnableofferResponse): EnableofferResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: EnableofferResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): EnableofferResponse;
    static deserializeBinaryFromReader(message: EnableofferResponse, reader: jspb.BinaryReader): EnableofferResponse;
}

export namespace EnableofferResponse {
    export type AsObject = {
        offerId: Uint8Array | string,
        active: boolean,
        singleUse: boolean,
        bolt12: string,
        used: boolean,
        label?: string,
    }
}

export class DisconnectRequest extends jspb.Message { 
    getId(): Uint8Array | string;
    getId_asU8(): Uint8Array;
    getId_asB64(): string;
    setId(value: Uint8Array | string): DisconnectRequest;

    hasForce(): boolean;
    clearForce(): void;
    getForce(): boolean | undefined;
    setForce(value: boolean): DisconnectRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): DisconnectRequest.AsObject;
    static toObject(includeInstance: boolean, msg: DisconnectRequest): DisconnectRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: DisconnectRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): DisconnectRequest;
    static deserializeBinaryFromReader(message: DisconnectRequest, reader: jspb.BinaryReader): DisconnectRequest;
}

export namespace DisconnectRequest {
    export type AsObject = {
        id: Uint8Array | string,
        force?: boolean,
    }
}

export class DisconnectResponse extends jspb.Message { 

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): DisconnectResponse.AsObject;
    static toObject(includeInstance: boolean, msg: DisconnectResponse): DisconnectResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: DisconnectResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): DisconnectResponse;
    static deserializeBinaryFromReader(message: DisconnectResponse, reader: jspb.BinaryReader): DisconnectResponse;
}

export namespace DisconnectResponse {
    export type AsObject = {
    }
}

export class FeeratesRequest extends jspb.Message { 
    getStyle(): FeeratesRequest.FeeratesStyle;
    setStyle(value: FeeratesRequest.FeeratesStyle): FeeratesRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): FeeratesRequest.AsObject;
    static toObject(includeInstance: boolean, msg: FeeratesRequest): FeeratesRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: FeeratesRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): FeeratesRequest;
    static deserializeBinaryFromReader(message: FeeratesRequest, reader: jspb.BinaryReader): FeeratesRequest;
}

export namespace FeeratesRequest {
    export type AsObject = {
        style: FeeratesRequest.FeeratesStyle,
    }

    export enum FeeratesStyle {
    PERKB = 0,
    PERKW = 1,
    }

}

export class FeeratesResponse extends jspb.Message { 

    hasWarningMissingFeerates(): boolean;
    clearWarningMissingFeerates(): void;
    getWarningMissingFeerates(): string | undefined;
    setWarningMissingFeerates(value: string): FeeratesResponse;

    hasPerkb(): boolean;
    clearPerkb(): void;
    getPerkb(): FeeratesPerkb | undefined;
    setPerkb(value?: FeeratesPerkb): FeeratesResponse;

    hasPerkw(): boolean;
    clearPerkw(): void;
    getPerkw(): FeeratesPerkw | undefined;
    setPerkw(value?: FeeratesPerkw): FeeratesResponse;

    hasOnchainFeeEstimates(): boolean;
    clearOnchainFeeEstimates(): void;
    getOnchainFeeEstimates(): FeeratesOnchain_fee_estimates | undefined;
    setOnchainFeeEstimates(value?: FeeratesOnchain_fee_estimates): FeeratesResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): FeeratesResponse.AsObject;
    static toObject(includeInstance: boolean, msg: FeeratesResponse): FeeratesResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: FeeratesResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): FeeratesResponse;
    static deserializeBinaryFromReader(message: FeeratesResponse, reader: jspb.BinaryReader): FeeratesResponse;
}

export namespace FeeratesResponse {
    export type AsObject = {
        warningMissingFeerates?: string,
        perkb?: FeeratesPerkb.AsObject,
        perkw?: FeeratesPerkw.AsObject,
        onchainFeeEstimates?: FeeratesOnchain_fee_estimates.AsObject,
    }
}

export class FeeratesPerkb extends jspb.Message { 
    getMinAcceptable(): number;
    setMinAcceptable(value: number): FeeratesPerkb;
    getMaxAcceptable(): number;
    setMaxAcceptable(value: number): FeeratesPerkb;

    hasOpening(): boolean;
    clearOpening(): void;
    getOpening(): number | undefined;
    setOpening(value: number): FeeratesPerkb;

    hasMutualClose(): boolean;
    clearMutualClose(): void;
    getMutualClose(): number | undefined;
    setMutualClose(value: number): FeeratesPerkb;

    hasUnilateralClose(): boolean;
    clearUnilateralClose(): void;
    getUnilateralClose(): number | undefined;
    setUnilateralClose(value: number): FeeratesPerkb;

    hasDelayedToUs(): boolean;
    clearDelayedToUs(): void;
    getDelayedToUs(): number | undefined;
    setDelayedToUs(value: number): FeeratesPerkb;

    hasHtlcResolution(): boolean;
    clearHtlcResolution(): void;
    getHtlcResolution(): number | undefined;
    setHtlcResolution(value: number): FeeratesPerkb;

    hasPenalty(): boolean;
    clearPenalty(): void;
    getPenalty(): number | undefined;
    setPenalty(value: number): FeeratesPerkb;
    clearEstimatesList(): void;
    getEstimatesList(): Array<FeeratesPerkbEstimates>;
    setEstimatesList(value: Array<FeeratesPerkbEstimates>): FeeratesPerkb;
    addEstimates(value?: FeeratesPerkbEstimates, index?: number): FeeratesPerkbEstimates;

    hasFloor(): boolean;
    clearFloor(): void;
    getFloor(): number | undefined;
    setFloor(value: number): FeeratesPerkb;

    hasUnilateralAnchorClose(): boolean;
    clearUnilateralAnchorClose(): void;
    getUnilateralAnchorClose(): number | undefined;
    setUnilateralAnchorClose(value: number): FeeratesPerkb;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): FeeratesPerkb.AsObject;
    static toObject(includeInstance: boolean, msg: FeeratesPerkb): FeeratesPerkb.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: FeeratesPerkb, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): FeeratesPerkb;
    static deserializeBinaryFromReader(message: FeeratesPerkb, reader: jspb.BinaryReader): FeeratesPerkb;
}

export namespace FeeratesPerkb {
    export type AsObject = {
        minAcceptable: number,
        maxAcceptable: number,
        opening?: number,
        mutualClose?: number,
        unilateralClose?: number,
        delayedToUs?: number,
        htlcResolution?: number,
        penalty?: number,
        estimatesList: Array<FeeratesPerkbEstimates.AsObject>,
        floor?: number,
        unilateralAnchorClose?: number,
    }
}

export class FeeratesPerkbEstimates extends jspb.Message { 
    getBlockcount(): number;
    setBlockcount(value: number): FeeratesPerkbEstimates;
    getFeerate(): number;
    setFeerate(value: number): FeeratesPerkbEstimates;
    getSmoothedFeerate(): number;
    setSmoothedFeerate(value: number): FeeratesPerkbEstimates;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): FeeratesPerkbEstimates.AsObject;
    static toObject(includeInstance: boolean, msg: FeeratesPerkbEstimates): FeeratesPerkbEstimates.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: FeeratesPerkbEstimates, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): FeeratesPerkbEstimates;
    static deserializeBinaryFromReader(message: FeeratesPerkbEstimates, reader: jspb.BinaryReader): FeeratesPerkbEstimates;
}

export namespace FeeratesPerkbEstimates {
    export type AsObject = {
        blockcount: number,
        feerate: number,
        smoothedFeerate: number,
    }
}

export class FeeratesPerkw extends jspb.Message { 
    getMinAcceptable(): number;
    setMinAcceptable(value: number): FeeratesPerkw;
    getMaxAcceptable(): number;
    setMaxAcceptable(value: number): FeeratesPerkw;

    hasOpening(): boolean;
    clearOpening(): void;
    getOpening(): number | undefined;
    setOpening(value: number): FeeratesPerkw;

    hasMutualClose(): boolean;
    clearMutualClose(): void;
    getMutualClose(): number | undefined;
    setMutualClose(value: number): FeeratesPerkw;

    hasUnilateralClose(): boolean;
    clearUnilateralClose(): void;
    getUnilateralClose(): number | undefined;
    setUnilateralClose(value: number): FeeratesPerkw;

    hasDelayedToUs(): boolean;
    clearDelayedToUs(): void;
    getDelayedToUs(): number | undefined;
    setDelayedToUs(value: number): FeeratesPerkw;

    hasHtlcResolution(): boolean;
    clearHtlcResolution(): void;
    getHtlcResolution(): number | undefined;
    setHtlcResolution(value: number): FeeratesPerkw;

    hasPenalty(): boolean;
    clearPenalty(): void;
    getPenalty(): number | undefined;
    setPenalty(value: number): FeeratesPerkw;
    clearEstimatesList(): void;
    getEstimatesList(): Array<FeeratesPerkwEstimates>;
    setEstimatesList(value: Array<FeeratesPerkwEstimates>): FeeratesPerkw;
    addEstimates(value?: FeeratesPerkwEstimates, index?: number): FeeratesPerkwEstimates;

    hasFloor(): boolean;
    clearFloor(): void;
    getFloor(): number | undefined;
    setFloor(value: number): FeeratesPerkw;

    hasUnilateralAnchorClose(): boolean;
    clearUnilateralAnchorClose(): void;
    getUnilateralAnchorClose(): number | undefined;
    setUnilateralAnchorClose(value: number): FeeratesPerkw;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): FeeratesPerkw.AsObject;
    static toObject(includeInstance: boolean, msg: FeeratesPerkw): FeeratesPerkw.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: FeeratesPerkw, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): FeeratesPerkw;
    static deserializeBinaryFromReader(message: FeeratesPerkw, reader: jspb.BinaryReader): FeeratesPerkw;
}

export namespace FeeratesPerkw {
    export type AsObject = {
        minAcceptable: number,
        maxAcceptable: number,
        opening?: number,
        mutualClose?: number,
        unilateralClose?: number,
        delayedToUs?: number,
        htlcResolution?: number,
        penalty?: number,
        estimatesList: Array<FeeratesPerkwEstimates.AsObject>,
        floor?: number,
        unilateralAnchorClose?: number,
    }
}

export class FeeratesPerkwEstimates extends jspb.Message { 
    getBlockcount(): number;
    setBlockcount(value: number): FeeratesPerkwEstimates;
    getFeerate(): number;
    setFeerate(value: number): FeeratesPerkwEstimates;
    getSmoothedFeerate(): number;
    setSmoothedFeerate(value: number): FeeratesPerkwEstimates;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): FeeratesPerkwEstimates.AsObject;
    static toObject(includeInstance: boolean, msg: FeeratesPerkwEstimates): FeeratesPerkwEstimates.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: FeeratesPerkwEstimates, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): FeeratesPerkwEstimates;
    static deserializeBinaryFromReader(message: FeeratesPerkwEstimates, reader: jspb.BinaryReader): FeeratesPerkwEstimates;
}

export namespace FeeratesPerkwEstimates {
    export type AsObject = {
        blockcount: number,
        feerate: number,
        smoothedFeerate: number,
    }
}

export class FeeratesOnchain_fee_estimates extends jspb.Message { 
    getOpeningChannelSatoshis(): number;
    setOpeningChannelSatoshis(value: number): FeeratesOnchain_fee_estimates;
    getMutualCloseSatoshis(): number;
    setMutualCloseSatoshis(value: number): FeeratesOnchain_fee_estimates;
    getUnilateralCloseSatoshis(): number;
    setUnilateralCloseSatoshis(value: number): FeeratesOnchain_fee_estimates;
    getHtlcTimeoutSatoshis(): number;
    setHtlcTimeoutSatoshis(value: number): FeeratesOnchain_fee_estimates;
    getHtlcSuccessSatoshis(): number;
    setHtlcSuccessSatoshis(value: number): FeeratesOnchain_fee_estimates;

    hasUnilateralCloseNonanchorSatoshis(): boolean;
    clearUnilateralCloseNonanchorSatoshis(): void;
    getUnilateralCloseNonanchorSatoshis(): number | undefined;
    setUnilateralCloseNonanchorSatoshis(value: number): FeeratesOnchain_fee_estimates;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): FeeratesOnchain_fee_estimates.AsObject;
    static toObject(includeInstance: boolean, msg: FeeratesOnchain_fee_estimates): FeeratesOnchain_fee_estimates.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: FeeratesOnchain_fee_estimates, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): FeeratesOnchain_fee_estimates;
    static deserializeBinaryFromReader(message: FeeratesOnchain_fee_estimates, reader: jspb.BinaryReader): FeeratesOnchain_fee_estimates;
}

export namespace FeeratesOnchain_fee_estimates {
    export type AsObject = {
        openingChannelSatoshis: number,
        mutualCloseSatoshis: number,
        unilateralCloseSatoshis: number,
        htlcTimeoutSatoshis: number,
        htlcSuccessSatoshis: number,
        unilateralCloseNonanchorSatoshis?: number,
    }
}

export class FetchinvoiceRequest extends jspb.Message { 
    getOffer(): string;
    setOffer(value: string): FetchinvoiceRequest;

    hasAmountMsat(): boolean;
    clearAmountMsat(): void;
    getAmountMsat(): cln_primitives_pb.Amount | undefined;
    setAmountMsat(value?: cln_primitives_pb.Amount): FetchinvoiceRequest;

    hasQuantity(): boolean;
    clearQuantity(): void;
    getQuantity(): number | undefined;
    setQuantity(value: number): FetchinvoiceRequest;

    hasRecurrenceCounter(): boolean;
    clearRecurrenceCounter(): void;
    getRecurrenceCounter(): number | undefined;
    setRecurrenceCounter(value: number): FetchinvoiceRequest;

    hasRecurrenceStart(): boolean;
    clearRecurrenceStart(): void;
    getRecurrenceStart(): number | undefined;
    setRecurrenceStart(value: number): FetchinvoiceRequest;

    hasRecurrenceLabel(): boolean;
    clearRecurrenceLabel(): void;
    getRecurrenceLabel(): string | undefined;
    setRecurrenceLabel(value: string): FetchinvoiceRequest;

    hasTimeout(): boolean;
    clearTimeout(): void;
    getTimeout(): number | undefined;
    setTimeout(value: number): FetchinvoiceRequest;

    hasPayerNote(): boolean;
    clearPayerNote(): void;
    getPayerNote(): string | undefined;
    setPayerNote(value: string): FetchinvoiceRequest;

    hasPayerMetadata(): boolean;
    clearPayerMetadata(): void;
    getPayerMetadata(): string | undefined;
    setPayerMetadata(value: string): FetchinvoiceRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): FetchinvoiceRequest.AsObject;
    static toObject(includeInstance: boolean, msg: FetchinvoiceRequest): FetchinvoiceRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: FetchinvoiceRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): FetchinvoiceRequest;
    static deserializeBinaryFromReader(message: FetchinvoiceRequest, reader: jspb.BinaryReader): FetchinvoiceRequest;
}

export namespace FetchinvoiceRequest {
    export type AsObject = {
        offer: string,
        amountMsat?: cln_primitives_pb.Amount.AsObject,
        quantity?: number,
        recurrenceCounter?: number,
        recurrenceStart?: number,
        recurrenceLabel?: string,
        timeout?: number,
        payerNote?: string,
        payerMetadata?: string,
    }
}

export class FetchinvoiceResponse extends jspb.Message { 
    getInvoice(): string;
    setInvoice(value: string): FetchinvoiceResponse;

    hasChanges(): boolean;
    clearChanges(): void;
    getChanges(): FetchinvoiceChanges | undefined;
    setChanges(value?: FetchinvoiceChanges): FetchinvoiceResponse;

    hasNextPeriod(): boolean;
    clearNextPeriod(): void;
    getNextPeriod(): FetchinvoiceNext_period | undefined;
    setNextPeriod(value?: FetchinvoiceNext_period): FetchinvoiceResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): FetchinvoiceResponse.AsObject;
    static toObject(includeInstance: boolean, msg: FetchinvoiceResponse): FetchinvoiceResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: FetchinvoiceResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): FetchinvoiceResponse;
    static deserializeBinaryFromReader(message: FetchinvoiceResponse, reader: jspb.BinaryReader): FetchinvoiceResponse;
}

export namespace FetchinvoiceResponse {
    export type AsObject = {
        invoice: string,
        changes?: FetchinvoiceChanges.AsObject,
        nextPeriod?: FetchinvoiceNext_period.AsObject,
    }
}

export class FetchinvoiceChanges extends jspb.Message { 

    hasDescriptionAppended(): boolean;
    clearDescriptionAppended(): void;
    getDescriptionAppended(): string | undefined;
    setDescriptionAppended(value: string): FetchinvoiceChanges;

    hasDescription(): boolean;
    clearDescription(): void;
    getDescription(): string | undefined;
    setDescription(value: string): FetchinvoiceChanges;

    hasVendorRemoved(): boolean;
    clearVendorRemoved(): void;
    getVendorRemoved(): string | undefined;
    setVendorRemoved(value: string): FetchinvoiceChanges;

    hasVendor(): boolean;
    clearVendor(): void;
    getVendor(): string | undefined;
    setVendor(value: string): FetchinvoiceChanges;

    hasAmountMsat(): boolean;
    clearAmountMsat(): void;
    getAmountMsat(): cln_primitives_pb.Amount | undefined;
    setAmountMsat(value?: cln_primitives_pb.Amount): FetchinvoiceChanges;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): FetchinvoiceChanges.AsObject;
    static toObject(includeInstance: boolean, msg: FetchinvoiceChanges): FetchinvoiceChanges.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: FetchinvoiceChanges, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): FetchinvoiceChanges;
    static deserializeBinaryFromReader(message: FetchinvoiceChanges, reader: jspb.BinaryReader): FetchinvoiceChanges;
}

export namespace FetchinvoiceChanges {
    export type AsObject = {
        descriptionAppended?: string,
        description?: string,
        vendorRemoved?: string,
        vendor?: string,
        amountMsat?: cln_primitives_pb.Amount.AsObject,
    }
}

export class FetchinvoiceNext_period extends jspb.Message { 
    getCounter(): number;
    setCounter(value: number): FetchinvoiceNext_period;
    getStarttime(): number;
    setStarttime(value: number): FetchinvoiceNext_period;
    getEndtime(): number;
    setEndtime(value: number): FetchinvoiceNext_period;
    getPaywindowStart(): number;
    setPaywindowStart(value: number): FetchinvoiceNext_period;
    getPaywindowEnd(): number;
    setPaywindowEnd(value: number): FetchinvoiceNext_period;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): FetchinvoiceNext_period.AsObject;
    static toObject(includeInstance: boolean, msg: FetchinvoiceNext_period): FetchinvoiceNext_period.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: FetchinvoiceNext_period, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): FetchinvoiceNext_period;
    static deserializeBinaryFromReader(message: FetchinvoiceNext_period, reader: jspb.BinaryReader): FetchinvoiceNext_period;
}

export namespace FetchinvoiceNext_period {
    export type AsObject = {
        counter: number,
        starttime: number,
        endtime: number,
        paywindowStart: number,
        paywindowEnd: number,
    }
}

export class Fundchannel_cancelRequest extends jspb.Message { 
    getId(): Uint8Array | string;
    getId_asU8(): Uint8Array;
    getId_asB64(): string;
    setId(value: Uint8Array | string): Fundchannel_cancelRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): Fundchannel_cancelRequest.AsObject;
    static toObject(includeInstance: boolean, msg: Fundchannel_cancelRequest): Fundchannel_cancelRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: Fundchannel_cancelRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): Fundchannel_cancelRequest;
    static deserializeBinaryFromReader(message: Fundchannel_cancelRequest, reader: jspb.BinaryReader): Fundchannel_cancelRequest;
}

export namespace Fundchannel_cancelRequest {
    export type AsObject = {
        id: Uint8Array | string,
    }
}

export class Fundchannel_cancelResponse extends jspb.Message { 
    getCancelled(): string;
    setCancelled(value: string): Fundchannel_cancelResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): Fundchannel_cancelResponse.AsObject;
    static toObject(includeInstance: boolean, msg: Fundchannel_cancelResponse): Fundchannel_cancelResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: Fundchannel_cancelResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): Fundchannel_cancelResponse;
    static deserializeBinaryFromReader(message: Fundchannel_cancelResponse, reader: jspb.BinaryReader): Fundchannel_cancelResponse;
}

export namespace Fundchannel_cancelResponse {
    export type AsObject = {
        cancelled: string,
    }
}

export class Fundchannel_completeRequest extends jspb.Message { 
    getId(): Uint8Array | string;
    getId_asU8(): Uint8Array;
    getId_asB64(): string;
    setId(value: Uint8Array | string): Fundchannel_completeRequest;
    getPsbt(): string;
    setPsbt(value: string): Fundchannel_completeRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): Fundchannel_completeRequest.AsObject;
    static toObject(includeInstance: boolean, msg: Fundchannel_completeRequest): Fundchannel_completeRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: Fundchannel_completeRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): Fundchannel_completeRequest;
    static deserializeBinaryFromReader(message: Fundchannel_completeRequest, reader: jspb.BinaryReader): Fundchannel_completeRequest;
}

export namespace Fundchannel_completeRequest {
    export type AsObject = {
        id: Uint8Array | string,
        psbt: string,
    }
}

export class Fundchannel_completeResponse extends jspb.Message { 
    getChannelId(): Uint8Array | string;
    getChannelId_asU8(): Uint8Array;
    getChannelId_asB64(): string;
    setChannelId(value: Uint8Array | string): Fundchannel_completeResponse;
    getCommitmentsSecured(): boolean;
    setCommitmentsSecured(value: boolean): Fundchannel_completeResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): Fundchannel_completeResponse.AsObject;
    static toObject(includeInstance: boolean, msg: Fundchannel_completeResponse): Fundchannel_completeResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: Fundchannel_completeResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): Fundchannel_completeResponse;
    static deserializeBinaryFromReader(message: Fundchannel_completeResponse, reader: jspb.BinaryReader): Fundchannel_completeResponse;
}

export namespace Fundchannel_completeResponse {
    export type AsObject = {
        channelId: Uint8Array | string,
        commitmentsSecured: boolean,
    }
}

export class FundchannelRequest extends jspb.Message { 

    hasAmount(): boolean;
    clearAmount(): void;
    getAmount(): cln_primitives_pb.AmountOrAll | undefined;
    setAmount(value?: cln_primitives_pb.AmountOrAll): FundchannelRequest;

    hasFeerate(): boolean;
    clearFeerate(): void;
    getFeerate(): cln_primitives_pb.Feerate | undefined;
    setFeerate(value?: cln_primitives_pb.Feerate): FundchannelRequest;

    hasAnnounce(): boolean;
    clearAnnounce(): void;
    getAnnounce(): boolean | undefined;
    setAnnounce(value: boolean): FundchannelRequest;

    hasPushMsat(): boolean;
    clearPushMsat(): void;
    getPushMsat(): cln_primitives_pb.Amount | undefined;
    setPushMsat(value?: cln_primitives_pb.Amount): FundchannelRequest;

    hasCloseTo(): boolean;
    clearCloseTo(): void;
    getCloseTo(): string | undefined;
    setCloseTo(value: string): FundchannelRequest;

    hasRequestAmt(): boolean;
    clearRequestAmt(): void;
    getRequestAmt(): cln_primitives_pb.Amount | undefined;
    setRequestAmt(value?: cln_primitives_pb.Amount): FundchannelRequest;

    hasCompactLease(): boolean;
    clearCompactLease(): void;
    getCompactLease(): string | undefined;
    setCompactLease(value: string): FundchannelRequest;
    getId(): Uint8Array | string;
    getId_asU8(): Uint8Array;
    getId_asB64(): string;
    setId(value: Uint8Array | string): FundchannelRequest;

    hasMinconf(): boolean;
    clearMinconf(): void;
    getMinconf(): number | undefined;
    setMinconf(value: number): FundchannelRequest;
    clearUtxosList(): void;
    getUtxosList(): Array<cln_primitives_pb.Outpoint>;
    setUtxosList(value: Array<cln_primitives_pb.Outpoint>): FundchannelRequest;
    addUtxos(value?: cln_primitives_pb.Outpoint, index?: number): cln_primitives_pb.Outpoint;

    hasMindepth(): boolean;
    clearMindepth(): void;
    getMindepth(): number | undefined;
    setMindepth(value: number): FundchannelRequest;

    hasReserve(): boolean;
    clearReserve(): void;
    getReserve(): cln_primitives_pb.Amount | undefined;
    setReserve(value?: cln_primitives_pb.Amount): FundchannelRequest;
    clearChannelTypeList(): void;
    getChannelTypeList(): Array<number>;
    setChannelTypeList(value: Array<number>): FundchannelRequest;
    addChannelType(value: number, index?: number): number;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): FundchannelRequest.AsObject;
    static toObject(includeInstance: boolean, msg: FundchannelRequest): FundchannelRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: FundchannelRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): FundchannelRequest;
    static deserializeBinaryFromReader(message: FundchannelRequest, reader: jspb.BinaryReader): FundchannelRequest;
}

export namespace FundchannelRequest {
    export type AsObject = {
        amount?: cln_primitives_pb.AmountOrAll.AsObject,
        feerate?: cln_primitives_pb.Feerate.AsObject,
        announce?: boolean,
        pushMsat?: cln_primitives_pb.Amount.AsObject,
        closeTo?: string,
        requestAmt?: cln_primitives_pb.Amount.AsObject,
        compactLease?: string,
        id: Uint8Array | string,
        minconf?: number,
        utxosList: Array<cln_primitives_pb.Outpoint.AsObject>,
        mindepth?: number,
        reserve?: cln_primitives_pb.Amount.AsObject,
        channelTypeList: Array<number>,
    }
}

export class FundchannelResponse extends jspb.Message { 
    getTx(): Uint8Array | string;
    getTx_asU8(): Uint8Array;
    getTx_asB64(): string;
    setTx(value: Uint8Array | string): FundchannelResponse;
    getTxid(): Uint8Array | string;
    getTxid_asU8(): Uint8Array;
    getTxid_asB64(): string;
    setTxid(value: Uint8Array | string): FundchannelResponse;
    getOutnum(): number;
    setOutnum(value: number): FundchannelResponse;
    getChannelId(): Uint8Array | string;
    getChannelId_asU8(): Uint8Array;
    getChannelId_asB64(): string;
    setChannelId(value: Uint8Array | string): FundchannelResponse;

    hasCloseTo(): boolean;
    clearCloseTo(): void;
    getCloseTo(): Uint8Array | string;
    getCloseTo_asU8(): Uint8Array;
    getCloseTo_asB64(): string;
    setCloseTo(value: Uint8Array | string): FundchannelResponse;

    hasMindepth(): boolean;
    clearMindepth(): void;
    getMindepth(): number | undefined;
    setMindepth(value: number): FundchannelResponse;

    hasChannelType(): boolean;
    clearChannelType(): void;
    getChannelType(): FundchannelChannel_type | undefined;
    setChannelType(value?: FundchannelChannel_type): FundchannelResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): FundchannelResponse.AsObject;
    static toObject(includeInstance: boolean, msg: FundchannelResponse): FundchannelResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: FundchannelResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): FundchannelResponse;
    static deserializeBinaryFromReader(message: FundchannelResponse, reader: jspb.BinaryReader): FundchannelResponse;
}

export namespace FundchannelResponse {
    export type AsObject = {
        tx: Uint8Array | string,
        txid: Uint8Array | string,
        outnum: number,
        channelId: Uint8Array | string,
        closeTo: Uint8Array | string,
        mindepth?: number,
        channelType?: FundchannelChannel_type.AsObject,
    }
}

export class FundchannelChannel_type extends jspb.Message { 
    clearBitsList(): void;
    getBitsList(): Array<number>;
    setBitsList(value: Array<number>): FundchannelChannel_type;
    addBits(value: number, index?: number): number;
    clearNamesList(): void;
    getNamesList(): Array<cln_primitives_pb.ChannelTypeName>;
    setNamesList(value: Array<cln_primitives_pb.ChannelTypeName>): FundchannelChannel_type;
    addNames(value: cln_primitives_pb.ChannelTypeName, index?: number): cln_primitives_pb.ChannelTypeName;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): FundchannelChannel_type.AsObject;
    static toObject(includeInstance: boolean, msg: FundchannelChannel_type): FundchannelChannel_type.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: FundchannelChannel_type, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): FundchannelChannel_type;
    static deserializeBinaryFromReader(message: FundchannelChannel_type, reader: jspb.BinaryReader): FundchannelChannel_type;
}

export namespace FundchannelChannel_type {
    export type AsObject = {
        bitsList: Array<number>,
        namesList: Array<cln_primitives_pb.ChannelTypeName>,
    }
}

export class Fundchannel_startRequest extends jspb.Message { 
    getId(): Uint8Array | string;
    getId_asU8(): Uint8Array;
    getId_asB64(): string;
    setId(value: Uint8Array | string): Fundchannel_startRequest;

    hasAmount(): boolean;
    clearAmount(): void;
    getAmount(): cln_primitives_pb.Amount | undefined;
    setAmount(value?: cln_primitives_pb.Amount): Fundchannel_startRequest;

    hasFeerate(): boolean;
    clearFeerate(): void;
    getFeerate(): cln_primitives_pb.Feerate | undefined;
    setFeerate(value?: cln_primitives_pb.Feerate): Fundchannel_startRequest;

    hasAnnounce(): boolean;
    clearAnnounce(): void;
    getAnnounce(): boolean | undefined;
    setAnnounce(value: boolean): Fundchannel_startRequest;

    hasCloseTo(): boolean;
    clearCloseTo(): void;
    getCloseTo(): string | undefined;
    setCloseTo(value: string): Fundchannel_startRequest;

    hasPushMsat(): boolean;
    clearPushMsat(): void;
    getPushMsat(): cln_primitives_pb.Amount | undefined;
    setPushMsat(value?: cln_primitives_pb.Amount): Fundchannel_startRequest;

    hasMindepth(): boolean;
    clearMindepth(): void;
    getMindepth(): number | undefined;
    setMindepth(value: number): Fundchannel_startRequest;

    hasReserve(): boolean;
    clearReserve(): void;
    getReserve(): cln_primitives_pb.Amount | undefined;
    setReserve(value?: cln_primitives_pb.Amount): Fundchannel_startRequest;
    clearChannelTypeList(): void;
    getChannelTypeList(): Array<number>;
    setChannelTypeList(value: Array<number>): Fundchannel_startRequest;
    addChannelType(value: number, index?: number): number;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): Fundchannel_startRequest.AsObject;
    static toObject(includeInstance: boolean, msg: Fundchannel_startRequest): Fundchannel_startRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: Fundchannel_startRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): Fundchannel_startRequest;
    static deserializeBinaryFromReader(message: Fundchannel_startRequest, reader: jspb.BinaryReader): Fundchannel_startRequest;
}

export namespace Fundchannel_startRequest {
    export type AsObject = {
        id: Uint8Array | string,
        amount?: cln_primitives_pb.Amount.AsObject,
        feerate?: cln_primitives_pb.Feerate.AsObject,
        announce?: boolean,
        closeTo?: string,
        pushMsat?: cln_primitives_pb.Amount.AsObject,
        mindepth?: number,
        reserve?: cln_primitives_pb.Amount.AsObject,
        channelTypeList: Array<number>,
    }
}

export class Fundchannel_startResponse extends jspb.Message { 
    getFundingAddress(): string;
    setFundingAddress(value: string): Fundchannel_startResponse;
    getScriptpubkey(): Uint8Array | string;
    getScriptpubkey_asU8(): Uint8Array;
    getScriptpubkey_asB64(): string;
    setScriptpubkey(value: Uint8Array | string): Fundchannel_startResponse;

    hasChannelType(): boolean;
    clearChannelType(): void;
    getChannelType(): Fundchannel_startChannel_type | undefined;
    setChannelType(value?: Fundchannel_startChannel_type): Fundchannel_startResponse;

    hasCloseTo(): boolean;
    clearCloseTo(): void;
    getCloseTo(): Uint8Array | string;
    getCloseTo_asU8(): Uint8Array;
    getCloseTo_asB64(): string;
    setCloseTo(value: Uint8Array | string): Fundchannel_startResponse;
    getWarningUsage(): string;
    setWarningUsage(value: string): Fundchannel_startResponse;

    hasMindepth(): boolean;
    clearMindepth(): void;
    getMindepth(): number | undefined;
    setMindepth(value: number): Fundchannel_startResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): Fundchannel_startResponse.AsObject;
    static toObject(includeInstance: boolean, msg: Fundchannel_startResponse): Fundchannel_startResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: Fundchannel_startResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): Fundchannel_startResponse;
    static deserializeBinaryFromReader(message: Fundchannel_startResponse, reader: jspb.BinaryReader): Fundchannel_startResponse;
}

export namespace Fundchannel_startResponse {
    export type AsObject = {
        fundingAddress: string,
        scriptpubkey: Uint8Array | string,
        channelType?: Fundchannel_startChannel_type.AsObject,
        closeTo: Uint8Array | string,
        warningUsage: string,
        mindepth?: number,
    }
}

export class Fundchannel_startChannel_type extends jspb.Message { 
    clearBitsList(): void;
    getBitsList(): Array<number>;
    setBitsList(value: Array<number>): Fundchannel_startChannel_type;
    addBits(value: number, index?: number): number;
    clearNamesList(): void;
    getNamesList(): Array<cln_primitives_pb.ChannelTypeName>;
    setNamesList(value: Array<cln_primitives_pb.ChannelTypeName>): Fundchannel_startChannel_type;
    addNames(value: cln_primitives_pb.ChannelTypeName, index?: number): cln_primitives_pb.ChannelTypeName;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): Fundchannel_startChannel_type.AsObject;
    static toObject(includeInstance: boolean, msg: Fundchannel_startChannel_type): Fundchannel_startChannel_type.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: Fundchannel_startChannel_type, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): Fundchannel_startChannel_type;
    static deserializeBinaryFromReader(message: Fundchannel_startChannel_type, reader: jspb.BinaryReader): Fundchannel_startChannel_type;
}

export namespace Fundchannel_startChannel_type {
    export type AsObject = {
        bitsList: Array<number>,
        namesList: Array<cln_primitives_pb.ChannelTypeName>,
    }
}

export class GetlogRequest extends jspb.Message { 

    hasLevel(): boolean;
    clearLevel(): void;
    getLevel(): GetlogRequest.GetlogLevel | undefined;
    setLevel(value: GetlogRequest.GetlogLevel): GetlogRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): GetlogRequest.AsObject;
    static toObject(includeInstance: boolean, msg: GetlogRequest): GetlogRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: GetlogRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): GetlogRequest;
    static deserializeBinaryFromReader(message: GetlogRequest, reader: jspb.BinaryReader): GetlogRequest;
}

export namespace GetlogRequest {
    export type AsObject = {
        level?: GetlogRequest.GetlogLevel,
    }

    export enum GetlogLevel {
    BROKEN = 0,
    UNUSUAL = 1,
    INFO = 2,
    DEBUG = 3,
    IO = 4,
    TRACE = 5,
    }

}

export class GetlogResponse extends jspb.Message { 
    getCreatedAt(): string;
    setCreatedAt(value: string): GetlogResponse;
    getBytesUsed(): number;
    setBytesUsed(value: number): GetlogResponse;
    getBytesMax(): number;
    setBytesMax(value: number): GetlogResponse;
    clearLogList(): void;
    getLogList(): Array<GetlogLog>;
    setLogList(value: Array<GetlogLog>): GetlogResponse;
    addLog(value?: GetlogLog, index?: number): GetlogLog;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): GetlogResponse.AsObject;
    static toObject(includeInstance: boolean, msg: GetlogResponse): GetlogResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: GetlogResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): GetlogResponse;
    static deserializeBinaryFromReader(message: GetlogResponse, reader: jspb.BinaryReader): GetlogResponse;
}

export namespace GetlogResponse {
    export type AsObject = {
        createdAt: string,
        bytesUsed: number,
        bytesMax: number,
        logList: Array<GetlogLog.AsObject>,
    }
}

export class GetlogLog extends jspb.Message { 
    getItemType(): GetlogLog.GetlogLogType;
    setItemType(value: GetlogLog.GetlogLogType): GetlogLog;

    hasNumSkipped(): boolean;
    clearNumSkipped(): void;
    getNumSkipped(): number | undefined;
    setNumSkipped(value: number): GetlogLog;

    hasTime(): boolean;
    clearTime(): void;
    getTime(): string | undefined;
    setTime(value: string): GetlogLog;

    hasSource(): boolean;
    clearSource(): void;
    getSource(): string | undefined;
    setSource(value: string): GetlogLog;

    hasLog(): boolean;
    clearLog(): void;
    getLog(): string | undefined;
    setLog(value: string): GetlogLog;

    hasNodeId(): boolean;
    clearNodeId(): void;
    getNodeId(): Uint8Array | string;
    getNodeId_asU8(): Uint8Array;
    getNodeId_asB64(): string;
    setNodeId(value: Uint8Array | string): GetlogLog;

    hasData(): boolean;
    clearData(): void;
    getData(): Uint8Array | string;
    getData_asU8(): Uint8Array;
    getData_asB64(): string;
    setData(value: Uint8Array | string): GetlogLog;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): GetlogLog.AsObject;
    static toObject(includeInstance: boolean, msg: GetlogLog): GetlogLog.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: GetlogLog, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): GetlogLog;
    static deserializeBinaryFromReader(message: GetlogLog, reader: jspb.BinaryReader): GetlogLog;
}

export namespace GetlogLog {
    export type AsObject = {
        itemType: GetlogLog.GetlogLogType,
        numSkipped?: number,
        time?: string,
        source?: string,
        log?: string,
        nodeId: Uint8Array | string,
        data: Uint8Array | string,
    }

    export enum GetlogLogType {
    SKIPPED = 0,
    BROKEN = 1,
    UNUSUAL = 2,
    INFO = 3,
    DEBUG = 4,
    IO_IN = 5,
    IO_OUT = 6,
    TRACE = 7,
    }

}

export class FunderupdateRequest extends jspb.Message { 

    hasPolicy(): boolean;
    clearPolicy(): void;
    getPolicy(): FunderupdateRequest.FunderupdatePolicy | undefined;
    setPolicy(value: FunderupdateRequest.FunderupdatePolicy): FunderupdateRequest;

    hasPolicyMod(): boolean;
    clearPolicyMod(): void;
    getPolicyMod(): cln_primitives_pb.Amount | undefined;
    setPolicyMod(value?: cln_primitives_pb.Amount): FunderupdateRequest;

    hasLeasesOnly(): boolean;
    clearLeasesOnly(): void;
    getLeasesOnly(): boolean | undefined;
    setLeasesOnly(value: boolean): FunderupdateRequest;

    hasMinTheirFundingMsat(): boolean;
    clearMinTheirFundingMsat(): void;
    getMinTheirFundingMsat(): cln_primitives_pb.Amount | undefined;
    setMinTheirFundingMsat(value?: cln_primitives_pb.Amount): FunderupdateRequest;

    hasMaxTheirFundingMsat(): boolean;
    clearMaxTheirFundingMsat(): void;
    getMaxTheirFundingMsat(): cln_primitives_pb.Amount | undefined;
    setMaxTheirFundingMsat(value?: cln_primitives_pb.Amount): FunderupdateRequest;

    hasPerChannelMinMsat(): boolean;
    clearPerChannelMinMsat(): void;
    getPerChannelMinMsat(): cln_primitives_pb.Amount | undefined;
    setPerChannelMinMsat(value?: cln_primitives_pb.Amount): FunderupdateRequest;

    hasPerChannelMaxMsat(): boolean;
    clearPerChannelMaxMsat(): void;
    getPerChannelMaxMsat(): cln_primitives_pb.Amount | undefined;
    setPerChannelMaxMsat(value?: cln_primitives_pb.Amount): FunderupdateRequest;

    hasReserveTankMsat(): boolean;
    clearReserveTankMsat(): void;
    getReserveTankMsat(): cln_primitives_pb.Amount | undefined;
    setReserveTankMsat(value?: cln_primitives_pb.Amount): FunderupdateRequest;

    hasFuzzPercent(): boolean;
    clearFuzzPercent(): void;
    getFuzzPercent(): number | undefined;
    setFuzzPercent(value: number): FunderupdateRequest;

    hasFundProbability(): boolean;
    clearFundProbability(): void;
    getFundProbability(): number | undefined;
    setFundProbability(value: number): FunderupdateRequest;

    hasLeaseFeeBaseMsat(): boolean;
    clearLeaseFeeBaseMsat(): void;
    getLeaseFeeBaseMsat(): cln_primitives_pb.Amount | undefined;
    setLeaseFeeBaseMsat(value?: cln_primitives_pb.Amount): FunderupdateRequest;

    hasLeaseFeeBasis(): boolean;
    clearLeaseFeeBasis(): void;
    getLeaseFeeBasis(): number | undefined;
    setLeaseFeeBasis(value: number): FunderupdateRequest;

    hasFundingWeight(): boolean;
    clearFundingWeight(): void;
    getFundingWeight(): number | undefined;
    setFundingWeight(value: number): FunderupdateRequest;

    hasChannelFeeMaxBaseMsat(): boolean;
    clearChannelFeeMaxBaseMsat(): void;
    getChannelFeeMaxBaseMsat(): cln_primitives_pb.Amount | undefined;
    setChannelFeeMaxBaseMsat(value?: cln_primitives_pb.Amount): FunderupdateRequest;

    hasChannelFeeMaxProportionalThousandths(): boolean;
    clearChannelFeeMaxProportionalThousandths(): void;
    getChannelFeeMaxProportionalThousandths(): number | undefined;
    setChannelFeeMaxProportionalThousandths(value: number): FunderupdateRequest;

    hasCompactLease(): boolean;
    clearCompactLease(): void;
    getCompactLease(): Uint8Array | string;
    getCompactLease_asU8(): Uint8Array;
    getCompactLease_asB64(): string;
    setCompactLease(value: Uint8Array | string): FunderupdateRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): FunderupdateRequest.AsObject;
    static toObject(includeInstance: boolean, msg: FunderupdateRequest): FunderupdateRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: FunderupdateRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): FunderupdateRequest;
    static deserializeBinaryFromReader(message: FunderupdateRequest, reader: jspb.BinaryReader): FunderupdateRequest;
}

export namespace FunderupdateRequest {
    export type AsObject = {
        policy?: FunderupdateRequest.FunderupdatePolicy,
        policyMod?: cln_primitives_pb.Amount.AsObject,
        leasesOnly?: boolean,
        minTheirFundingMsat?: cln_primitives_pb.Amount.AsObject,
        maxTheirFundingMsat?: cln_primitives_pb.Amount.AsObject,
        perChannelMinMsat?: cln_primitives_pb.Amount.AsObject,
        perChannelMaxMsat?: cln_primitives_pb.Amount.AsObject,
        reserveTankMsat?: cln_primitives_pb.Amount.AsObject,
        fuzzPercent?: number,
        fundProbability?: number,
        leaseFeeBaseMsat?: cln_primitives_pb.Amount.AsObject,
        leaseFeeBasis?: number,
        fundingWeight?: number,
        channelFeeMaxBaseMsat?: cln_primitives_pb.Amount.AsObject,
        channelFeeMaxProportionalThousandths?: number,
        compactLease: Uint8Array | string,
    }

    export enum FunderupdatePolicy {
    MATCH = 0,
    AVAILABLE = 1,
    FIXED = 2,
    }

}

export class FunderupdateResponse extends jspb.Message { 
    getSummary(): string;
    setSummary(value: string): FunderupdateResponse;
    getPolicy(): FunderupdateResponse.FunderupdatePolicy;
    setPolicy(value: FunderupdateResponse.FunderupdatePolicy): FunderupdateResponse;
    getPolicyMod(): number;
    setPolicyMod(value: number): FunderupdateResponse;
    getLeasesOnly(): boolean;
    setLeasesOnly(value: boolean): FunderupdateResponse;

    hasMinTheirFundingMsat(): boolean;
    clearMinTheirFundingMsat(): void;
    getMinTheirFundingMsat(): cln_primitives_pb.Amount | undefined;
    setMinTheirFundingMsat(value?: cln_primitives_pb.Amount): FunderupdateResponse;

    hasMaxTheirFundingMsat(): boolean;
    clearMaxTheirFundingMsat(): void;
    getMaxTheirFundingMsat(): cln_primitives_pb.Amount | undefined;
    setMaxTheirFundingMsat(value?: cln_primitives_pb.Amount): FunderupdateResponse;

    hasPerChannelMinMsat(): boolean;
    clearPerChannelMinMsat(): void;
    getPerChannelMinMsat(): cln_primitives_pb.Amount | undefined;
    setPerChannelMinMsat(value?: cln_primitives_pb.Amount): FunderupdateResponse;

    hasPerChannelMaxMsat(): boolean;
    clearPerChannelMaxMsat(): void;
    getPerChannelMaxMsat(): cln_primitives_pb.Amount | undefined;
    setPerChannelMaxMsat(value?: cln_primitives_pb.Amount): FunderupdateResponse;

    hasReserveTankMsat(): boolean;
    clearReserveTankMsat(): void;
    getReserveTankMsat(): cln_primitives_pb.Amount | undefined;
    setReserveTankMsat(value?: cln_primitives_pb.Amount): FunderupdateResponse;
    getFuzzPercent(): number;
    setFuzzPercent(value: number): FunderupdateResponse;
    getFundProbability(): number;
    setFundProbability(value: number): FunderupdateResponse;

    hasLeaseFeeBaseMsat(): boolean;
    clearLeaseFeeBaseMsat(): void;
    getLeaseFeeBaseMsat(): cln_primitives_pb.Amount | undefined;
    setLeaseFeeBaseMsat(value?: cln_primitives_pb.Amount): FunderupdateResponse;

    hasLeaseFeeBasis(): boolean;
    clearLeaseFeeBasis(): void;
    getLeaseFeeBasis(): number | undefined;
    setLeaseFeeBasis(value: number): FunderupdateResponse;

    hasFundingWeight(): boolean;
    clearFundingWeight(): void;
    getFundingWeight(): number | undefined;
    setFundingWeight(value: number): FunderupdateResponse;

    hasChannelFeeMaxBaseMsat(): boolean;
    clearChannelFeeMaxBaseMsat(): void;
    getChannelFeeMaxBaseMsat(): cln_primitives_pb.Amount | undefined;
    setChannelFeeMaxBaseMsat(value?: cln_primitives_pb.Amount): FunderupdateResponse;

    hasChannelFeeMaxProportionalThousandths(): boolean;
    clearChannelFeeMaxProportionalThousandths(): void;
    getChannelFeeMaxProportionalThousandths(): number | undefined;
    setChannelFeeMaxProportionalThousandths(value: number): FunderupdateResponse;

    hasCompactLease(): boolean;
    clearCompactLease(): void;
    getCompactLease(): Uint8Array | string;
    getCompactLease_asU8(): Uint8Array;
    getCompactLease_asB64(): string;
    setCompactLease(value: Uint8Array | string): FunderupdateResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): FunderupdateResponse.AsObject;
    static toObject(includeInstance: boolean, msg: FunderupdateResponse): FunderupdateResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: FunderupdateResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): FunderupdateResponse;
    static deserializeBinaryFromReader(message: FunderupdateResponse, reader: jspb.BinaryReader): FunderupdateResponse;
}

export namespace FunderupdateResponse {
    export type AsObject = {
        summary: string,
        policy: FunderupdateResponse.FunderupdatePolicy,
        policyMod: number,
        leasesOnly: boolean,
        minTheirFundingMsat?: cln_primitives_pb.Amount.AsObject,
        maxTheirFundingMsat?: cln_primitives_pb.Amount.AsObject,
        perChannelMinMsat?: cln_primitives_pb.Amount.AsObject,
        perChannelMaxMsat?: cln_primitives_pb.Amount.AsObject,
        reserveTankMsat?: cln_primitives_pb.Amount.AsObject,
        fuzzPercent: number,
        fundProbability: number,
        leaseFeeBaseMsat?: cln_primitives_pb.Amount.AsObject,
        leaseFeeBasis?: number,
        fundingWeight?: number,
        channelFeeMaxBaseMsat?: cln_primitives_pb.Amount.AsObject,
        channelFeeMaxProportionalThousandths?: number,
        compactLease: Uint8Array | string,
    }

    export enum FunderupdatePolicy {
    MATCH = 0,
    AVAILABLE = 1,
    FIXED = 2,
    }

}

export class GetrouteRequest extends jspb.Message { 
    getId(): Uint8Array | string;
    getId_asU8(): Uint8Array;
    getId_asB64(): string;
    setId(value: Uint8Array | string): GetrouteRequest;
    getRiskfactor(): number;
    setRiskfactor(value: number): GetrouteRequest;

    hasCltv(): boolean;
    clearCltv(): void;
    getCltv(): number | undefined;
    setCltv(value: number): GetrouteRequest;

    hasFromid(): boolean;
    clearFromid(): void;
    getFromid(): Uint8Array | string;
    getFromid_asU8(): Uint8Array;
    getFromid_asB64(): string;
    setFromid(value: Uint8Array | string): GetrouteRequest;

    hasFuzzpercent(): boolean;
    clearFuzzpercent(): void;
    getFuzzpercent(): number | undefined;
    setFuzzpercent(value: number): GetrouteRequest;
    clearExcludeList(): void;
    getExcludeList(): Array<string>;
    setExcludeList(value: Array<string>): GetrouteRequest;
    addExclude(value: string, index?: number): string;

    hasMaxhops(): boolean;
    clearMaxhops(): void;
    getMaxhops(): number | undefined;
    setMaxhops(value: number): GetrouteRequest;

    hasAmountMsat(): boolean;
    clearAmountMsat(): void;
    getAmountMsat(): cln_primitives_pb.Amount | undefined;
    setAmountMsat(value?: cln_primitives_pb.Amount): GetrouteRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): GetrouteRequest.AsObject;
    static toObject(includeInstance: boolean, msg: GetrouteRequest): GetrouteRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: GetrouteRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): GetrouteRequest;
    static deserializeBinaryFromReader(message: GetrouteRequest, reader: jspb.BinaryReader): GetrouteRequest;
}

export namespace GetrouteRequest {
    export type AsObject = {
        id: Uint8Array | string,
        riskfactor: number,
        cltv?: number,
        fromid: Uint8Array | string,
        fuzzpercent?: number,
        excludeList: Array<string>,
        maxhops?: number,
        amountMsat?: cln_primitives_pb.Amount.AsObject,
    }
}

export class GetrouteResponse extends jspb.Message { 
    clearRouteList(): void;
    getRouteList(): Array<GetrouteRoute>;
    setRouteList(value: Array<GetrouteRoute>): GetrouteResponse;
    addRoute(value?: GetrouteRoute, index?: number): GetrouteRoute;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): GetrouteResponse.AsObject;
    static toObject(includeInstance: boolean, msg: GetrouteResponse): GetrouteResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: GetrouteResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): GetrouteResponse;
    static deserializeBinaryFromReader(message: GetrouteResponse, reader: jspb.BinaryReader): GetrouteResponse;
}

export namespace GetrouteResponse {
    export type AsObject = {
        routeList: Array<GetrouteRoute.AsObject>,
    }
}

export class GetrouteRoute extends jspb.Message { 
    getId(): Uint8Array | string;
    getId_asU8(): Uint8Array;
    getId_asB64(): string;
    setId(value: Uint8Array | string): GetrouteRoute;
    getChannel(): string;
    setChannel(value: string): GetrouteRoute;
    getDirection(): number;
    setDirection(value: number): GetrouteRoute;

    hasAmountMsat(): boolean;
    clearAmountMsat(): void;
    getAmountMsat(): cln_primitives_pb.Amount | undefined;
    setAmountMsat(value?: cln_primitives_pb.Amount): GetrouteRoute;
    getDelay(): number;
    setDelay(value: number): GetrouteRoute;
    getStyle(): GetrouteRoute.GetrouteRouteStyle;
    setStyle(value: GetrouteRoute.GetrouteRouteStyle): GetrouteRoute;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): GetrouteRoute.AsObject;
    static toObject(includeInstance: boolean, msg: GetrouteRoute): GetrouteRoute.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: GetrouteRoute, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): GetrouteRoute;
    static deserializeBinaryFromReader(message: GetrouteRoute, reader: jspb.BinaryReader): GetrouteRoute;
}

export namespace GetrouteRoute {
    export type AsObject = {
        id: Uint8Array | string,
        channel: string,
        direction: number,
        amountMsat?: cln_primitives_pb.Amount.AsObject,
        delay: number,
        style: GetrouteRoute.GetrouteRouteStyle,
    }

    export enum GetrouteRouteStyle {
    TLV = 0,
    }

}

export class ListaddressesRequest extends jspb.Message { 

    hasAddress(): boolean;
    clearAddress(): void;
    getAddress(): string | undefined;
    setAddress(value: string): ListaddressesRequest;

    hasStart(): boolean;
    clearStart(): void;
    getStart(): number | undefined;
    setStart(value: number): ListaddressesRequest;

    hasLimit(): boolean;
    clearLimit(): void;
    getLimit(): number | undefined;
    setLimit(value: number): ListaddressesRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ListaddressesRequest.AsObject;
    static toObject(includeInstance: boolean, msg: ListaddressesRequest): ListaddressesRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ListaddressesRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ListaddressesRequest;
    static deserializeBinaryFromReader(message: ListaddressesRequest, reader: jspb.BinaryReader): ListaddressesRequest;
}

export namespace ListaddressesRequest {
    export type AsObject = {
        address?: string,
        start?: number,
        limit?: number,
    }
}

export class ListaddressesResponse extends jspb.Message { 
    clearAddressesList(): void;
    getAddressesList(): Array<ListaddressesAddresses>;
    setAddressesList(value: Array<ListaddressesAddresses>): ListaddressesResponse;
    addAddresses(value?: ListaddressesAddresses, index?: number): ListaddressesAddresses;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ListaddressesResponse.AsObject;
    static toObject(includeInstance: boolean, msg: ListaddressesResponse): ListaddressesResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ListaddressesResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ListaddressesResponse;
    static deserializeBinaryFromReader(message: ListaddressesResponse, reader: jspb.BinaryReader): ListaddressesResponse;
}

export namespace ListaddressesResponse {
    export type AsObject = {
        addressesList: Array<ListaddressesAddresses.AsObject>,
    }
}

export class ListaddressesAddresses extends jspb.Message { 
    getKeyidx(): number;
    setKeyidx(value: number): ListaddressesAddresses;

    hasBech32(): boolean;
    clearBech32(): void;
    getBech32(): string | undefined;
    setBech32(value: string): ListaddressesAddresses;

    hasP2tr(): boolean;
    clearP2tr(): void;
    getP2tr(): string | undefined;
    setP2tr(value: string): ListaddressesAddresses;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ListaddressesAddresses.AsObject;
    static toObject(includeInstance: boolean, msg: ListaddressesAddresses): ListaddressesAddresses.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ListaddressesAddresses, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ListaddressesAddresses;
    static deserializeBinaryFromReader(message: ListaddressesAddresses, reader: jspb.BinaryReader): ListaddressesAddresses;
}

export namespace ListaddressesAddresses {
    export type AsObject = {
        keyidx: number,
        bech32?: string,
        p2tr?: string,
    }
}

export class ListforwardsRequest extends jspb.Message { 

    hasStatus(): boolean;
    clearStatus(): void;
    getStatus(): ListforwardsRequest.ListforwardsStatus | undefined;
    setStatus(value: ListforwardsRequest.ListforwardsStatus): ListforwardsRequest;

    hasInChannel(): boolean;
    clearInChannel(): void;
    getInChannel(): string | undefined;
    setInChannel(value: string): ListforwardsRequest;

    hasOutChannel(): boolean;
    clearOutChannel(): void;
    getOutChannel(): string | undefined;
    setOutChannel(value: string): ListforwardsRequest;

    hasIndex(): boolean;
    clearIndex(): void;
    getIndex(): ListforwardsRequest.ListforwardsIndex | undefined;
    setIndex(value: ListforwardsRequest.ListforwardsIndex): ListforwardsRequest;

    hasStart(): boolean;
    clearStart(): void;
    getStart(): number | undefined;
    setStart(value: number): ListforwardsRequest;

    hasLimit(): boolean;
    clearLimit(): void;
    getLimit(): number | undefined;
    setLimit(value: number): ListforwardsRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ListforwardsRequest.AsObject;
    static toObject(includeInstance: boolean, msg: ListforwardsRequest): ListforwardsRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ListforwardsRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ListforwardsRequest;
    static deserializeBinaryFromReader(message: ListforwardsRequest, reader: jspb.BinaryReader): ListforwardsRequest;
}

export namespace ListforwardsRequest {
    export type AsObject = {
        status?: ListforwardsRequest.ListforwardsStatus,
        inChannel?: string,
        outChannel?: string,
        index?: ListforwardsRequest.ListforwardsIndex,
        start?: number,
        limit?: number,
    }

    export enum ListforwardsStatus {
    OFFERED = 0,
    SETTLED = 1,
    LOCAL_FAILED = 2,
    FAILED = 3,
    }

    export enum ListforwardsIndex {
    CREATED = 0,
    UPDATED = 1,
    }

}

export class ListforwardsResponse extends jspb.Message { 
    clearForwardsList(): void;
    getForwardsList(): Array<ListforwardsForwards>;
    setForwardsList(value: Array<ListforwardsForwards>): ListforwardsResponse;
    addForwards(value?: ListforwardsForwards, index?: number): ListforwardsForwards;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ListforwardsResponse.AsObject;
    static toObject(includeInstance: boolean, msg: ListforwardsResponse): ListforwardsResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ListforwardsResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ListforwardsResponse;
    static deserializeBinaryFromReader(message: ListforwardsResponse, reader: jspb.BinaryReader): ListforwardsResponse;
}

export namespace ListforwardsResponse {
    export type AsObject = {
        forwardsList: Array<ListforwardsForwards.AsObject>,
    }
}

export class ListforwardsForwards extends jspb.Message { 
    getInChannel(): string;
    setInChannel(value: string): ListforwardsForwards;

    hasInMsat(): boolean;
    clearInMsat(): void;
    getInMsat(): cln_primitives_pb.Amount | undefined;
    setInMsat(value?: cln_primitives_pb.Amount): ListforwardsForwards;
    getStatus(): ListforwardsForwards.ListforwardsForwardsStatus;
    setStatus(value: ListforwardsForwards.ListforwardsForwardsStatus): ListforwardsForwards;
    getReceivedTime(): number;
    setReceivedTime(value: number): ListforwardsForwards;

    hasOutChannel(): boolean;
    clearOutChannel(): void;
    getOutChannel(): string | undefined;
    setOutChannel(value: string): ListforwardsForwards;

    hasFeeMsat(): boolean;
    clearFeeMsat(): void;
    getFeeMsat(): cln_primitives_pb.Amount | undefined;
    setFeeMsat(value?: cln_primitives_pb.Amount): ListforwardsForwards;

    hasOutMsat(): boolean;
    clearOutMsat(): void;
    getOutMsat(): cln_primitives_pb.Amount | undefined;
    setOutMsat(value?: cln_primitives_pb.Amount): ListforwardsForwards;

    hasStyle(): boolean;
    clearStyle(): void;
    getStyle(): ListforwardsForwards.ListforwardsForwardsStyle | undefined;
    setStyle(value: ListforwardsForwards.ListforwardsForwardsStyle): ListforwardsForwards;

    hasInHtlcId(): boolean;
    clearInHtlcId(): void;
    getInHtlcId(): number | undefined;
    setInHtlcId(value: number): ListforwardsForwards;

    hasOutHtlcId(): boolean;
    clearOutHtlcId(): void;
    getOutHtlcId(): number | undefined;
    setOutHtlcId(value: number): ListforwardsForwards;

    hasCreatedIndex(): boolean;
    clearCreatedIndex(): void;
    getCreatedIndex(): number | undefined;
    setCreatedIndex(value: number): ListforwardsForwards;

    hasUpdatedIndex(): boolean;
    clearUpdatedIndex(): void;
    getUpdatedIndex(): number | undefined;
    setUpdatedIndex(value: number): ListforwardsForwards;

    hasResolvedTime(): boolean;
    clearResolvedTime(): void;
    getResolvedTime(): number | undefined;
    setResolvedTime(value: number): ListforwardsForwards;

    hasFailcode(): boolean;
    clearFailcode(): void;
    getFailcode(): number | undefined;
    setFailcode(value: number): ListforwardsForwards;

    hasFailreason(): boolean;
    clearFailreason(): void;
    getFailreason(): string | undefined;
    setFailreason(value: string): ListforwardsForwards;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ListforwardsForwards.AsObject;
    static toObject(includeInstance: boolean, msg: ListforwardsForwards): ListforwardsForwards.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ListforwardsForwards, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ListforwardsForwards;
    static deserializeBinaryFromReader(message: ListforwardsForwards, reader: jspb.BinaryReader): ListforwardsForwards;
}

export namespace ListforwardsForwards {
    export type AsObject = {
        inChannel: string,
        inMsat?: cln_primitives_pb.Amount.AsObject,
        status: ListforwardsForwards.ListforwardsForwardsStatus,
        receivedTime: number,
        outChannel?: string,
        feeMsat?: cln_primitives_pb.Amount.AsObject,
        outMsat?: cln_primitives_pb.Amount.AsObject,
        style?: ListforwardsForwards.ListforwardsForwardsStyle,
        inHtlcId?: number,
        outHtlcId?: number,
        createdIndex?: number,
        updatedIndex?: number,
        resolvedTime?: number,
        failcode?: number,
        failreason?: string,
    }

    export enum ListforwardsForwardsStatus {
    OFFERED = 0,
    SETTLED = 1,
    LOCAL_FAILED = 2,
    FAILED = 3,
    }

    export enum ListforwardsForwardsStyle {
    LEGACY = 0,
    TLV = 1,
    }

}

export class ListoffersRequest extends jspb.Message { 

    hasOfferId(): boolean;
    clearOfferId(): void;
    getOfferId(): Uint8Array | string;
    getOfferId_asU8(): Uint8Array;
    getOfferId_asB64(): string;
    setOfferId(value: Uint8Array | string): ListoffersRequest;

    hasActiveOnly(): boolean;
    clearActiveOnly(): void;
    getActiveOnly(): boolean | undefined;
    setActiveOnly(value: boolean): ListoffersRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ListoffersRequest.AsObject;
    static toObject(includeInstance: boolean, msg: ListoffersRequest): ListoffersRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ListoffersRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ListoffersRequest;
    static deserializeBinaryFromReader(message: ListoffersRequest, reader: jspb.BinaryReader): ListoffersRequest;
}

export namespace ListoffersRequest {
    export type AsObject = {
        offerId: Uint8Array | string,
        activeOnly?: boolean,
    }
}

export class ListoffersResponse extends jspb.Message { 
    clearOffersList(): void;
    getOffersList(): Array<ListoffersOffers>;
    setOffersList(value: Array<ListoffersOffers>): ListoffersResponse;
    addOffers(value?: ListoffersOffers, index?: number): ListoffersOffers;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ListoffersResponse.AsObject;
    static toObject(includeInstance: boolean, msg: ListoffersResponse): ListoffersResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ListoffersResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ListoffersResponse;
    static deserializeBinaryFromReader(message: ListoffersResponse, reader: jspb.BinaryReader): ListoffersResponse;
}

export namespace ListoffersResponse {
    export type AsObject = {
        offersList: Array<ListoffersOffers.AsObject>,
    }
}

export class ListoffersOffers extends jspb.Message { 
    getOfferId(): Uint8Array | string;
    getOfferId_asU8(): Uint8Array;
    getOfferId_asB64(): string;
    setOfferId(value: Uint8Array | string): ListoffersOffers;
    getActive(): boolean;
    setActive(value: boolean): ListoffersOffers;
    getSingleUse(): boolean;
    setSingleUse(value: boolean): ListoffersOffers;
    getBolt12(): string;
    setBolt12(value: string): ListoffersOffers;
    getUsed(): boolean;
    setUsed(value: boolean): ListoffersOffers;

    hasLabel(): boolean;
    clearLabel(): void;
    getLabel(): string | undefined;
    setLabel(value: string): ListoffersOffers;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ListoffersOffers.AsObject;
    static toObject(includeInstance: boolean, msg: ListoffersOffers): ListoffersOffers.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ListoffersOffers, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ListoffersOffers;
    static deserializeBinaryFromReader(message: ListoffersOffers, reader: jspb.BinaryReader): ListoffersOffers;
}

export namespace ListoffersOffers {
    export type AsObject = {
        offerId: Uint8Array | string,
        active: boolean,
        singleUse: boolean,
        bolt12: string,
        used: boolean,
        label?: string,
    }
}

export class ListpaysRequest extends jspb.Message { 

    hasBolt11(): boolean;
    clearBolt11(): void;
    getBolt11(): string | undefined;
    setBolt11(value: string): ListpaysRequest;

    hasPaymentHash(): boolean;
    clearPaymentHash(): void;
    getPaymentHash(): Uint8Array | string;
    getPaymentHash_asU8(): Uint8Array;
    getPaymentHash_asB64(): string;
    setPaymentHash(value: Uint8Array | string): ListpaysRequest;

    hasStatus(): boolean;
    clearStatus(): void;
    getStatus(): ListpaysRequest.ListpaysStatus | undefined;
    setStatus(value: ListpaysRequest.ListpaysStatus): ListpaysRequest;

    hasIndex(): boolean;
    clearIndex(): void;
    getIndex(): ListpaysRequest.ListpaysIndex | undefined;
    setIndex(value: ListpaysRequest.ListpaysIndex): ListpaysRequest;

    hasStart(): boolean;
    clearStart(): void;
    getStart(): number | undefined;
    setStart(value: number): ListpaysRequest;

    hasLimit(): boolean;
    clearLimit(): void;
    getLimit(): number | undefined;
    setLimit(value: number): ListpaysRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ListpaysRequest.AsObject;
    static toObject(includeInstance: boolean, msg: ListpaysRequest): ListpaysRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ListpaysRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ListpaysRequest;
    static deserializeBinaryFromReader(message: ListpaysRequest, reader: jspb.BinaryReader): ListpaysRequest;
}

export namespace ListpaysRequest {
    export type AsObject = {
        bolt11?: string,
        paymentHash: Uint8Array | string,
        status?: ListpaysRequest.ListpaysStatus,
        index?: ListpaysRequest.ListpaysIndex,
        start?: number,
        limit?: number,
    }

    export enum ListpaysStatus {
    PENDING = 0,
    COMPLETE = 1,
    FAILED = 2,
    }

    export enum ListpaysIndex {
    CREATED = 0,
    UPDATED = 1,
    }

}

export class ListpaysResponse extends jspb.Message { 
    clearPaysList(): void;
    getPaysList(): Array<ListpaysPays>;
    setPaysList(value: Array<ListpaysPays>): ListpaysResponse;
    addPays(value?: ListpaysPays, index?: number): ListpaysPays;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ListpaysResponse.AsObject;
    static toObject(includeInstance: boolean, msg: ListpaysResponse): ListpaysResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ListpaysResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ListpaysResponse;
    static deserializeBinaryFromReader(message: ListpaysResponse, reader: jspb.BinaryReader): ListpaysResponse;
}

export namespace ListpaysResponse {
    export type AsObject = {
        paysList: Array<ListpaysPays.AsObject>,
    }
}

export class ListpaysPays extends jspb.Message { 
    getPaymentHash(): Uint8Array | string;
    getPaymentHash_asU8(): Uint8Array;
    getPaymentHash_asB64(): string;
    setPaymentHash(value: Uint8Array | string): ListpaysPays;
    getStatus(): ListpaysPays.ListpaysPaysStatus;
    setStatus(value: ListpaysPays.ListpaysPaysStatus): ListpaysPays;

    hasDestination(): boolean;
    clearDestination(): void;
    getDestination(): Uint8Array | string;
    getDestination_asU8(): Uint8Array;
    getDestination_asB64(): string;
    setDestination(value: Uint8Array | string): ListpaysPays;
    getCreatedAt(): number;
    setCreatedAt(value: number): ListpaysPays;

    hasLabel(): boolean;
    clearLabel(): void;
    getLabel(): string | undefined;
    setLabel(value: string): ListpaysPays;

    hasBolt11(): boolean;
    clearBolt11(): void;
    getBolt11(): string | undefined;
    setBolt11(value: string): ListpaysPays;

    hasBolt12(): boolean;
    clearBolt12(): void;
    getBolt12(): string | undefined;
    setBolt12(value: string): ListpaysPays;

    hasAmountMsat(): boolean;
    clearAmountMsat(): void;
    getAmountMsat(): cln_primitives_pb.Amount | undefined;
    setAmountMsat(value?: cln_primitives_pb.Amount): ListpaysPays;

    hasAmountSentMsat(): boolean;
    clearAmountSentMsat(): void;
    getAmountSentMsat(): cln_primitives_pb.Amount | undefined;
    setAmountSentMsat(value?: cln_primitives_pb.Amount): ListpaysPays;

    hasErroronion(): boolean;
    clearErroronion(): void;
    getErroronion(): Uint8Array | string;
    getErroronion_asU8(): Uint8Array;
    getErroronion_asB64(): string;
    setErroronion(value: Uint8Array | string): ListpaysPays;

    hasDescription(): boolean;
    clearDescription(): void;
    getDescription(): string | undefined;
    setDescription(value: string): ListpaysPays;

    hasCompletedAt(): boolean;
    clearCompletedAt(): void;
    getCompletedAt(): number | undefined;
    setCompletedAt(value: number): ListpaysPays;

    hasPreimage(): boolean;
    clearPreimage(): void;
    getPreimage(): Uint8Array | string;
    getPreimage_asU8(): Uint8Array;
    getPreimage_asB64(): string;
    setPreimage(value: Uint8Array | string): ListpaysPays;

    hasNumberOfParts(): boolean;
    clearNumberOfParts(): void;
    getNumberOfParts(): number | undefined;
    setNumberOfParts(value: number): ListpaysPays;

    hasCreatedIndex(): boolean;
    clearCreatedIndex(): void;
    getCreatedIndex(): number | undefined;
    setCreatedIndex(value: number): ListpaysPays;

    hasUpdatedIndex(): boolean;
    clearUpdatedIndex(): void;
    getUpdatedIndex(): number | undefined;
    setUpdatedIndex(value: number): ListpaysPays;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ListpaysPays.AsObject;
    static toObject(includeInstance: boolean, msg: ListpaysPays): ListpaysPays.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ListpaysPays, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ListpaysPays;
    static deserializeBinaryFromReader(message: ListpaysPays, reader: jspb.BinaryReader): ListpaysPays;
}

export namespace ListpaysPays {
    export type AsObject = {
        paymentHash: Uint8Array | string,
        status: ListpaysPays.ListpaysPaysStatus,
        destination: Uint8Array | string,
        createdAt: number,
        label?: string,
        bolt11?: string,
        bolt12?: string,
        amountMsat?: cln_primitives_pb.Amount.AsObject,
        amountSentMsat?: cln_primitives_pb.Amount.AsObject,
        erroronion: Uint8Array | string,
        description?: string,
        completedAt?: number,
        preimage: Uint8Array | string,
        numberOfParts?: number,
        createdIndex?: number,
        updatedIndex?: number,
    }

    export enum ListpaysPaysStatus {
    PENDING = 0,
    FAILED = 1,
    COMPLETE = 2,
    }

}

export class ListhtlcsRequest extends jspb.Message { 

    hasId(): boolean;
    clearId(): void;
    getId(): string | undefined;
    setId(value: string): ListhtlcsRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ListhtlcsRequest.AsObject;
    static toObject(includeInstance: boolean, msg: ListhtlcsRequest): ListhtlcsRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ListhtlcsRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ListhtlcsRequest;
    static deserializeBinaryFromReader(message: ListhtlcsRequest, reader: jspb.BinaryReader): ListhtlcsRequest;
}

export namespace ListhtlcsRequest {
    export type AsObject = {
        id?: string,
    }
}

export class ListhtlcsResponse extends jspb.Message { 
    clearHtlcsList(): void;
    getHtlcsList(): Array<ListhtlcsHtlcs>;
    setHtlcsList(value: Array<ListhtlcsHtlcs>): ListhtlcsResponse;
    addHtlcs(value?: ListhtlcsHtlcs, index?: number): ListhtlcsHtlcs;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ListhtlcsResponse.AsObject;
    static toObject(includeInstance: boolean, msg: ListhtlcsResponse): ListhtlcsResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ListhtlcsResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ListhtlcsResponse;
    static deserializeBinaryFromReader(message: ListhtlcsResponse, reader: jspb.BinaryReader): ListhtlcsResponse;
}

export namespace ListhtlcsResponse {
    export type AsObject = {
        htlcsList: Array<ListhtlcsHtlcs.AsObject>,
    }
}

export class ListhtlcsHtlcs extends jspb.Message { 
    getShortChannelId(): string;
    setShortChannelId(value: string): ListhtlcsHtlcs;
    getId(): number;
    setId(value: number): ListhtlcsHtlcs;
    getExpiry(): number;
    setExpiry(value: number): ListhtlcsHtlcs;

    hasAmountMsat(): boolean;
    clearAmountMsat(): void;
    getAmountMsat(): cln_primitives_pb.Amount | undefined;
    setAmountMsat(value?: cln_primitives_pb.Amount): ListhtlcsHtlcs;
    getDirection(): ListhtlcsHtlcs.ListhtlcsHtlcsDirection;
    setDirection(value: ListhtlcsHtlcs.ListhtlcsHtlcsDirection): ListhtlcsHtlcs;
    getPaymentHash(): Uint8Array | string;
    getPaymentHash_asU8(): Uint8Array;
    getPaymentHash_asB64(): string;
    setPaymentHash(value: Uint8Array | string): ListhtlcsHtlcs;
    getState(): cln_primitives_pb.HtlcState;
    setState(value: cln_primitives_pb.HtlcState): ListhtlcsHtlcs;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ListhtlcsHtlcs.AsObject;
    static toObject(includeInstance: boolean, msg: ListhtlcsHtlcs): ListhtlcsHtlcs.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ListhtlcsHtlcs, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ListhtlcsHtlcs;
    static deserializeBinaryFromReader(message: ListhtlcsHtlcs, reader: jspb.BinaryReader): ListhtlcsHtlcs;
}

export namespace ListhtlcsHtlcs {
    export type AsObject = {
        shortChannelId: string,
        id: number,
        expiry: number,
        amountMsat?: cln_primitives_pb.Amount.AsObject,
        direction: ListhtlcsHtlcs.ListhtlcsHtlcsDirection,
        paymentHash: Uint8Array | string,
        state: cln_primitives_pb.HtlcState,
    }

    export enum ListhtlcsHtlcsDirection {
    OUT = 0,
    IN = 1,
    }

}

export class MultifundchannelRequest extends jspb.Message { 
    clearDestinationsList(): void;
    getDestinationsList(): Array<MultifundchannelDestinations>;
    setDestinationsList(value: Array<MultifundchannelDestinations>): MultifundchannelRequest;
    addDestinations(value?: MultifundchannelDestinations, index?: number): MultifundchannelDestinations;

    hasFeerate(): boolean;
    clearFeerate(): void;
    getFeerate(): cln_primitives_pb.Feerate | undefined;
    setFeerate(value?: cln_primitives_pb.Feerate): MultifundchannelRequest;

    hasMinconf(): boolean;
    clearMinconf(): void;
    getMinconf(): number | undefined;
    setMinconf(value: number): MultifundchannelRequest;
    clearUtxosList(): void;
    getUtxosList(): Array<cln_primitives_pb.Outpoint>;
    setUtxosList(value: Array<cln_primitives_pb.Outpoint>): MultifundchannelRequest;
    addUtxos(value?: cln_primitives_pb.Outpoint, index?: number): cln_primitives_pb.Outpoint;

    hasMinchannels(): boolean;
    clearMinchannels(): void;
    getMinchannels(): number | undefined;
    setMinchannels(value: number): MultifundchannelRequest;

    hasCommitmentFeerate(): boolean;
    clearCommitmentFeerate(): void;
    getCommitmentFeerate(): cln_primitives_pb.Feerate | undefined;
    setCommitmentFeerate(value?: cln_primitives_pb.Feerate): MultifundchannelRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): MultifundchannelRequest.AsObject;
    static toObject(includeInstance: boolean, msg: MultifundchannelRequest): MultifundchannelRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: MultifundchannelRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): MultifundchannelRequest;
    static deserializeBinaryFromReader(message: MultifundchannelRequest, reader: jspb.BinaryReader): MultifundchannelRequest;
}

export namespace MultifundchannelRequest {
    export type AsObject = {
        destinationsList: Array<MultifundchannelDestinations.AsObject>,
        feerate?: cln_primitives_pb.Feerate.AsObject,
        minconf?: number,
        utxosList: Array<cln_primitives_pb.Outpoint.AsObject>,
        minchannels?: number,
        commitmentFeerate?: cln_primitives_pb.Feerate.AsObject,
    }
}

export class MultifundchannelResponse extends jspb.Message { 
    getTx(): Uint8Array | string;
    getTx_asU8(): Uint8Array;
    getTx_asB64(): string;
    setTx(value: Uint8Array | string): MultifundchannelResponse;
    getTxid(): Uint8Array | string;
    getTxid_asU8(): Uint8Array;
    getTxid_asB64(): string;
    setTxid(value: Uint8Array | string): MultifundchannelResponse;
    clearChannelIdsList(): void;
    getChannelIdsList(): Array<MultifundchannelChannel_ids>;
    setChannelIdsList(value: Array<MultifundchannelChannel_ids>): MultifundchannelResponse;
    addChannelIds(value?: MultifundchannelChannel_ids, index?: number): MultifundchannelChannel_ids;
    clearFailedList(): void;
    getFailedList(): Array<MultifundchannelFailed>;
    setFailedList(value: Array<MultifundchannelFailed>): MultifundchannelResponse;
    addFailed(value?: MultifundchannelFailed, index?: number): MultifundchannelFailed;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): MultifundchannelResponse.AsObject;
    static toObject(includeInstance: boolean, msg: MultifundchannelResponse): MultifundchannelResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: MultifundchannelResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): MultifundchannelResponse;
    static deserializeBinaryFromReader(message: MultifundchannelResponse, reader: jspb.BinaryReader): MultifundchannelResponse;
}

export namespace MultifundchannelResponse {
    export type AsObject = {
        tx: Uint8Array | string,
        txid: Uint8Array | string,
        channelIdsList: Array<MultifundchannelChannel_ids.AsObject>,
        failedList: Array<MultifundchannelFailed.AsObject>,
    }
}

export class MultifundchannelDestinations extends jspb.Message { 
    getId(): string;
    setId(value: string): MultifundchannelDestinations;

    hasAmount(): boolean;
    clearAmount(): void;
    getAmount(): cln_primitives_pb.AmountOrAll | undefined;
    setAmount(value?: cln_primitives_pb.AmountOrAll): MultifundchannelDestinations;

    hasAnnounce(): boolean;
    clearAnnounce(): void;
    getAnnounce(): boolean | undefined;
    setAnnounce(value: boolean): MultifundchannelDestinations;

    hasPushMsat(): boolean;
    clearPushMsat(): void;
    getPushMsat(): cln_primitives_pb.Amount | undefined;
    setPushMsat(value?: cln_primitives_pb.Amount): MultifundchannelDestinations;

    hasCloseTo(): boolean;
    clearCloseTo(): void;
    getCloseTo(): string | undefined;
    setCloseTo(value: string): MultifundchannelDestinations;

    hasRequestAmt(): boolean;
    clearRequestAmt(): void;
    getRequestAmt(): cln_primitives_pb.Amount | undefined;
    setRequestAmt(value?: cln_primitives_pb.Amount): MultifundchannelDestinations;

    hasCompactLease(): boolean;
    clearCompactLease(): void;
    getCompactLease(): string | undefined;
    setCompactLease(value: string): MultifundchannelDestinations;

    hasMindepth(): boolean;
    clearMindepth(): void;
    getMindepth(): number | undefined;
    setMindepth(value: number): MultifundchannelDestinations;

    hasReserve(): boolean;
    clearReserve(): void;
    getReserve(): cln_primitives_pb.Amount | undefined;
    setReserve(value?: cln_primitives_pb.Amount): MultifundchannelDestinations;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): MultifundchannelDestinations.AsObject;
    static toObject(includeInstance: boolean, msg: MultifundchannelDestinations): MultifundchannelDestinations.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: MultifundchannelDestinations, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): MultifundchannelDestinations;
    static deserializeBinaryFromReader(message: MultifundchannelDestinations, reader: jspb.BinaryReader): MultifundchannelDestinations;
}

export namespace MultifundchannelDestinations {
    export type AsObject = {
        id: string,
        amount?: cln_primitives_pb.AmountOrAll.AsObject,
        announce?: boolean,
        pushMsat?: cln_primitives_pb.Amount.AsObject,
        closeTo?: string,
        requestAmt?: cln_primitives_pb.Amount.AsObject,
        compactLease?: string,
        mindepth?: number,
        reserve?: cln_primitives_pb.Amount.AsObject,
    }
}

export class MultifundchannelChannel_ids extends jspb.Message { 
    getId(): Uint8Array | string;
    getId_asU8(): Uint8Array;
    getId_asB64(): string;
    setId(value: Uint8Array | string): MultifundchannelChannel_ids;
    getOutnum(): number;
    setOutnum(value: number): MultifundchannelChannel_ids;
    getChannelId(): Uint8Array | string;
    getChannelId_asU8(): Uint8Array;
    getChannelId_asB64(): string;
    setChannelId(value: Uint8Array | string): MultifundchannelChannel_ids;

    hasChannelType(): boolean;
    clearChannelType(): void;
    getChannelType(): MultifundchannelChannel_idsChannel_type | undefined;
    setChannelType(value?: MultifundchannelChannel_idsChannel_type): MultifundchannelChannel_ids;

    hasCloseTo(): boolean;
    clearCloseTo(): void;
    getCloseTo(): Uint8Array | string;
    getCloseTo_asU8(): Uint8Array;
    getCloseTo_asB64(): string;
    setCloseTo(value: Uint8Array | string): MultifundchannelChannel_ids;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): MultifundchannelChannel_ids.AsObject;
    static toObject(includeInstance: boolean, msg: MultifundchannelChannel_ids): MultifundchannelChannel_ids.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: MultifundchannelChannel_ids, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): MultifundchannelChannel_ids;
    static deserializeBinaryFromReader(message: MultifundchannelChannel_ids, reader: jspb.BinaryReader): MultifundchannelChannel_ids;
}

export namespace MultifundchannelChannel_ids {
    export type AsObject = {
        id: Uint8Array | string,
        outnum: number,
        channelId: Uint8Array | string,
        channelType?: MultifundchannelChannel_idsChannel_type.AsObject,
        closeTo: Uint8Array | string,
    }
}

export class MultifundchannelChannel_idsChannel_type extends jspb.Message { 
    clearBitsList(): void;
    getBitsList(): Array<number>;
    setBitsList(value: Array<number>): MultifundchannelChannel_idsChannel_type;
    addBits(value: number, index?: number): number;
    clearNamesList(): void;
    getNamesList(): Array<cln_primitives_pb.ChannelTypeName>;
    setNamesList(value: Array<cln_primitives_pb.ChannelTypeName>): MultifundchannelChannel_idsChannel_type;
    addNames(value: cln_primitives_pb.ChannelTypeName, index?: number): cln_primitives_pb.ChannelTypeName;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): MultifundchannelChannel_idsChannel_type.AsObject;
    static toObject(includeInstance: boolean, msg: MultifundchannelChannel_idsChannel_type): MultifundchannelChannel_idsChannel_type.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: MultifundchannelChannel_idsChannel_type, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): MultifundchannelChannel_idsChannel_type;
    static deserializeBinaryFromReader(message: MultifundchannelChannel_idsChannel_type, reader: jspb.BinaryReader): MultifundchannelChannel_idsChannel_type;
}

export namespace MultifundchannelChannel_idsChannel_type {
    export type AsObject = {
        bitsList: Array<number>,
        namesList: Array<cln_primitives_pb.ChannelTypeName>,
    }
}

export class MultifundchannelFailed extends jspb.Message { 
    getId(): Uint8Array | string;
    getId_asU8(): Uint8Array;
    getId_asB64(): string;
    setId(value: Uint8Array | string): MultifundchannelFailed;
    getMethod(): MultifundchannelFailed.MultifundchannelFailedMethod;
    setMethod(value: MultifundchannelFailed.MultifundchannelFailedMethod): MultifundchannelFailed;

    hasError(): boolean;
    clearError(): void;
    getError(): MultifundchannelFailedError | undefined;
    setError(value?: MultifundchannelFailedError): MultifundchannelFailed;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): MultifundchannelFailed.AsObject;
    static toObject(includeInstance: boolean, msg: MultifundchannelFailed): MultifundchannelFailed.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: MultifundchannelFailed, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): MultifundchannelFailed;
    static deserializeBinaryFromReader(message: MultifundchannelFailed, reader: jspb.BinaryReader): MultifundchannelFailed;
}

export namespace MultifundchannelFailed {
    export type AsObject = {
        id: Uint8Array | string,
        method: MultifundchannelFailed.MultifundchannelFailedMethod,
        error?: MultifundchannelFailedError.AsObject,
    }

    export enum MultifundchannelFailedMethod {
    CONNECT = 0,
    OPENCHANNEL_INIT = 1,
    FUNDCHANNEL_START = 2,
    FUNDCHANNEL_COMPLETE = 3,
    }

}

export class MultifundchannelFailedError extends jspb.Message { 
    getCode(): number;
    setCode(value: number): MultifundchannelFailedError;
    getMessage(): string;
    setMessage(value: string): MultifundchannelFailedError;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): MultifundchannelFailedError.AsObject;
    static toObject(includeInstance: boolean, msg: MultifundchannelFailedError): MultifundchannelFailedError.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: MultifundchannelFailedError, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): MultifundchannelFailedError;
    static deserializeBinaryFromReader(message: MultifundchannelFailedError, reader: jspb.BinaryReader): MultifundchannelFailedError;
}

export namespace MultifundchannelFailedError {
    export type AsObject = {
        code: number,
        message: string,
    }
}

export class MultiwithdrawRequest extends jspb.Message { 
    clearOutputsList(): void;
    getOutputsList(): Array<cln_primitives_pb.OutputDesc>;
    setOutputsList(value: Array<cln_primitives_pb.OutputDesc>): MultiwithdrawRequest;
    addOutputs(value?: cln_primitives_pb.OutputDesc, index?: number): cln_primitives_pb.OutputDesc;

    hasFeerate(): boolean;
    clearFeerate(): void;
    getFeerate(): cln_primitives_pb.Feerate | undefined;
    setFeerate(value?: cln_primitives_pb.Feerate): MultiwithdrawRequest;

    hasMinconf(): boolean;
    clearMinconf(): void;
    getMinconf(): number | undefined;
    setMinconf(value: number): MultiwithdrawRequest;
    clearUtxosList(): void;
    getUtxosList(): Array<cln_primitives_pb.Outpoint>;
    setUtxosList(value: Array<cln_primitives_pb.Outpoint>): MultiwithdrawRequest;
    addUtxos(value?: cln_primitives_pb.Outpoint, index?: number): cln_primitives_pb.Outpoint;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): MultiwithdrawRequest.AsObject;
    static toObject(includeInstance: boolean, msg: MultiwithdrawRequest): MultiwithdrawRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: MultiwithdrawRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): MultiwithdrawRequest;
    static deserializeBinaryFromReader(message: MultiwithdrawRequest, reader: jspb.BinaryReader): MultiwithdrawRequest;
}

export namespace MultiwithdrawRequest {
    export type AsObject = {
        outputsList: Array<cln_primitives_pb.OutputDesc.AsObject>,
        feerate?: cln_primitives_pb.Feerate.AsObject,
        minconf?: number,
        utxosList: Array<cln_primitives_pb.Outpoint.AsObject>,
    }
}

export class MultiwithdrawResponse extends jspb.Message { 
    getTx(): Uint8Array | string;
    getTx_asU8(): Uint8Array;
    getTx_asB64(): string;
    setTx(value: Uint8Array | string): MultiwithdrawResponse;
    getTxid(): Uint8Array | string;
    getTxid_asU8(): Uint8Array;
    getTxid_asB64(): string;
    setTxid(value: Uint8Array | string): MultiwithdrawResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): MultiwithdrawResponse.AsObject;
    static toObject(includeInstance: boolean, msg: MultiwithdrawResponse): MultiwithdrawResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: MultiwithdrawResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): MultiwithdrawResponse;
    static deserializeBinaryFromReader(message: MultiwithdrawResponse, reader: jspb.BinaryReader): MultiwithdrawResponse;
}

export namespace MultiwithdrawResponse {
    export type AsObject = {
        tx: Uint8Array | string,
        txid: Uint8Array | string,
    }
}

export class OfferRequest extends jspb.Message { 
    getAmount(): string;
    setAmount(value: string): OfferRequest;

    hasDescription(): boolean;
    clearDescription(): void;
    getDescription(): string | undefined;
    setDescription(value: string): OfferRequest;

    hasIssuer(): boolean;
    clearIssuer(): void;
    getIssuer(): string | undefined;
    setIssuer(value: string): OfferRequest;

    hasLabel(): boolean;
    clearLabel(): void;
    getLabel(): string | undefined;
    setLabel(value: string): OfferRequest;

    hasQuantityMax(): boolean;
    clearQuantityMax(): void;
    getQuantityMax(): number | undefined;
    setQuantityMax(value: number): OfferRequest;

    hasAbsoluteExpiry(): boolean;
    clearAbsoluteExpiry(): void;
    getAbsoluteExpiry(): number | undefined;
    setAbsoluteExpiry(value: number): OfferRequest;

    hasRecurrence(): boolean;
    clearRecurrence(): void;
    getRecurrence(): string | undefined;
    setRecurrence(value: string): OfferRequest;

    hasRecurrenceBase(): boolean;
    clearRecurrenceBase(): void;
    getRecurrenceBase(): string | undefined;
    setRecurrenceBase(value: string): OfferRequest;

    hasRecurrencePaywindow(): boolean;
    clearRecurrencePaywindow(): void;
    getRecurrencePaywindow(): string | undefined;
    setRecurrencePaywindow(value: string): OfferRequest;

    hasRecurrenceLimit(): boolean;
    clearRecurrenceLimit(): void;
    getRecurrenceLimit(): number | undefined;
    setRecurrenceLimit(value: number): OfferRequest;

    hasSingleUse(): boolean;
    clearSingleUse(): void;
    getSingleUse(): boolean | undefined;
    setSingleUse(value: boolean): OfferRequest;

    hasRecurrenceStartAnyPeriod(): boolean;
    clearRecurrenceStartAnyPeriod(): void;
    getRecurrenceStartAnyPeriod(): boolean | undefined;
    setRecurrenceStartAnyPeriod(value: boolean): OfferRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): OfferRequest.AsObject;
    static toObject(includeInstance: boolean, msg: OfferRequest): OfferRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: OfferRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): OfferRequest;
    static deserializeBinaryFromReader(message: OfferRequest, reader: jspb.BinaryReader): OfferRequest;
}

export namespace OfferRequest {
    export type AsObject = {
        amount: string,
        description?: string,
        issuer?: string,
        label?: string,
        quantityMax?: number,
        absoluteExpiry?: number,
        recurrence?: string,
        recurrenceBase?: string,
        recurrencePaywindow?: string,
        recurrenceLimit?: number,
        singleUse?: boolean,
        recurrenceStartAnyPeriod?: boolean,
    }
}

export class OfferResponse extends jspb.Message { 
    getOfferId(): Uint8Array | string;
    getOfferId_asU8(): Uint8Array;
    getOfferId_asB64(): string;
    setOfferId(value: Uint8Array | string): OfferResponse;
    getActive(): boolean;
    setActive(value: boolean): OfferResponse;
    getSingleUse(): boolean;
    setSingleUse(value: boolean): OfferResponse;
    getBolt12(): string;
    setBolt12(value: string): OfferResponse;
    getUsed(): boolean;
    setUsed(value: boolean): OfferResponse;
    getCreated(): boolean;
    setCreated(value: boolean): OfferResponse;

    hasLabel(): boolean;
    clearLabel(): void;
    getLabel(): string | undefined;
    setLabel(value: string): OfferResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): OfferResponse.AsObject;
    static toObject(includeInstance: boolean, msg: OfferResponse): OfferResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: OfferResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): OfferResponse;
    static deserializeBinaryFromReader(message: OfferResponse, reader: jspb.BinaryReader): OfferResponse;
}

export namespace OfferResponse {
    export type AsObject = {
        offerId: Uint8Array | string,
        active: boolean,
        singleUse: boolean,
        bolt12: string,
        used: boolean,
        created: boolean,
        label?: string,
    }
}

export class Openchannel_abortRequest extends jspb.Message { 
    getChannelId(): Uint8Array | string;
    getChannelId_asU8(): Uint8Array;
    getChannelId_asB64(): string;
    setChannelId(value: Uint8Array | string): Openchannel_abortRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): Openchannel_abortRequest.AsObject;
    static toObject(includeInstance: boolean, msg: Openchannel_abortRequest): Openchannel_abortRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: Openchannel_abortRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): Openchannel_abortRequest;
    static deserializeBinaryFromReader(message: Openchannel_abortRequest, reader: jspb.BinaryReader): Openchannel_abortRequest;
}

export namespace Openchannel_abortRequest {
    export type AsObject = {
        channelId: Uint8Array | string,
    }
}

export class Openchannel_abortResponse extends jspb.Message { 
    getChannelId(): Uint8Array | string;
    getChannelId_asU8(): Uint8Array;
    getChannelId_asB64(): string;
    setChannelId(value: Uint8Array | string): Openchannel_abortResponse;
    getChannelCanceled(): boolean;
    setChannelCanceled(value: boolean): Openchannel_abortResponse;
    getReason(): string;
    setReason(value: string): Openchannel_abortResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): Openchannel_abortResponse.AsObject;
    static toObject(includeInstance: boolean, msg: Openchannel_abortResponse): Openchannel_abortResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: Openchannel_abortResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): Openchannel_abortResponse;
    static deserializeBinaryFromReader(message: Openchannel_abortResponse, reader: jspb.BinaryReader): Openchannel_abortResponse;
}

export namespace Openchannel_abortResponse {
    export type AsObject = {
        channelId: Uint8Array | string,
        channelCanceled: boolean,
        reason: string,
    }
}

export class Openchannel_bumpRequest extends jspb.Message { 
    getChannelId(): Uint8Array | string;
    getChannelId_asU8(): Uint8Array;
    getChannelId_asB64(): string;
    setChannelId(value: Uint8Array | string): Openchannel_bumpRequest;
    getInitialpsbt(): string;
    setInitialpsbt(value: string): Openchannel_bumpRequest;

    hasFundingFeerate(): boolean;
    clearFundingFeerate(): void;
    getFundingFeerate(): cln_primitives_pb.Feerate | undefined;
    setFundingFeerate(value?: cln_primitives_pb.Feerate): Openchannel_bumpRequest;

    hasAmount(): boolean;
    clearAmount(): void;
    getAmount(): cln_primitives_pb.Amount | undefined;
    setAmount(value?: cln_primitives_pb.Amount): Openchannel_bumpRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): Openchannel_bumpRequest.AsObject;
    static toObject(includeInstance: boolean, msg: Openchannel_bumpRequest): Openchannel_bumpRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: Openchannel_bumpRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): Openchannel_bumpRequest;
    static deserializeBinaryFromReader(message: Openchannel_bumpRequest, reader: jspb.BinaryReader): Openchannel_bumpRequest;
}

export namespace Openchannel_bumpRequest {
    export type AsObject = {
        channelId: Uint8Array | string,
        initialpsbt: string,
        fundingFeerate?: cln_primitives_pb.Feerate.AsObject,
        amount?: cln_primitives_pb.Amount.AsObject,
    }
}

export class Openchannel_bumpResponse extends jspb.Message { 
    getChannelId(): Uint8Array | string;
    getChannelId_asU8(): Uint8Array;
    getChannelId_asB64(): string;
    setChannelId(value: Uint8Array | string): Openchannel_bumpResponse;

    hasChannelType(): boolean;
    clearChannelType(): void;
    getChannelType(): Openchannel_bumpChannel_type | undefined;
    setChannelType(value?: Openchannel_bumpChannel_type): Openchannel_bumpResponse;
    getPsbt(): string;
    setPsbt(value: string): Openchannel_bumpResponse;
    getCommitmentsSecured(): boolean;
    setCommitmentsSecured(value: boolean): Openchannel_bumpResponse;
    getFundingSerial(): number;
    setFundingSerial(value: number): Openchannel_bumpResponse;

    hasRequiresConfirmedInputs(): boolean;
    clearRequiresConfirmedInputs(): void;
    getRequiresConfirmedInputs(): boolean | undefined;
    setRequiresConfirmedInputs(value: boolean): Openchannel_bumpResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): Openchannel_bumpResponse.AsObject;
    static toObject(includeInstance: boolean, msg: Openchannel_bumpResponse): Openchannel_bumpResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: Openchannel_bumpResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): Openchannel_bumpResponse;
    static deserializeBinaryFromReader(message: Openchannel_bumpResponse, reader: jspb.BinaryReader): Openchannel_bumpResponse;
}

export namespace Openchannel_bumpResponse {
    export type AsObject = {
        channelId: Uint8Array | string,
        channelType?: Openchannel_bumpChannel_type.AsObject,
        psbt: string,
        commitmentsSecured: boolean,
        fundingSerial: number,
        requiresConfirmedInputs?: boolean,
    }
}

export class Openchannel_bumpChannel_type extends jspb.Message { 
    clearBitsList(): void;
    getBitsList(): Array<number>;
    setBitsList(value: Array<number>): Openchannel_bumpChannel_type;
    addBits(value: number, index?: number): number;
    clearNamesList(): void;
    getNamesList(): Array<cln_primitives_pb.ChannelTypeName>;
    setNamesList(value: Array<cln_primitives_pb.ChannelTypeName>): Openchannel_bumpChannel_type;
    addNames(value: cln_primitives_pb.ChannelTypeName, index?: number): cln_primitives_pb.ChannelTypeName;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): Openchannel_bumpChannel_type.AsObject;
    static toObject(includeInstance: boolean, msg: Openchannel_bumpChannel_type): Openchannel_bumpChannel_type.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: Openchannel_bumpChannel_type, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): Openchannel_bumpChannel_type;
    static deserializeBinaryFromReader(message: Openchannel_bumpChannel_type, reader: jspb.BinaryReader): Openchannel_bumpChannel_type;
}

export namespace Openchannel_bumpChannel_type {
    export type AsObject = {
        bitsList: Array<number>,
        namesList: Array<cln_primitives_pb.ChannelTypeName>,
    }
}

export class Openchannel_initRequest extends jspb.Message { 
    getId(): Uint8Array | string;
    getId_asU8(): Uint8Array;
    getId_asB64(): string;
    setId(value: Uint8Array | string): Openchannel_initRequest;
    getInitialpsbt(): string;
    setInitialpsbt(value: string): Openchannel_initRequest;

    hasCommitmentFeerate(): boolean;
    clearCommitmentFeerate(): void;
    getCommitmentFeerate(): cln_primitives_pb.Feerate | undefined;
    setCommitmentFeerate(value?: cln_primitives_pb.Feerate): Openchannel_initRequest;

    hasFundingFeerate(): boolean;
    clearFundingFeerate(): void;
    getFundingFeerate(): cln_primitives_pb.Feerate | undefined;
    setFundingFeerate(value?: cln_primitives_pb.Feerate): Openchannel_initRequest;

    hasAnnounce(): boolean;
    clearAnnounce(): void;
    getAnnounce(): boolean | undefined;
    setAnnounce(value: boolean): Openchannel_initRequest;

    hasCloseTo(): boolean;
    clearCloseTo(): void;
    getCloseTo(): string | undefined;
    setCloseTo(value: string): Openchannel_initRequest;

    hasRequestAmt(): boolean;
    clearRequestAmt(): void;
    getRequestAmt(): cln_primitives_pb.Amount | undefined;
    setRequestAmt(value?: cln_primitives_pb.Amount): Openchannel_initRequest;

    hasCompactLease(): boolean;
    clearCompactLease(): void;
    getCompactLease(): Uint8Array | string;
    getCompactLease_asU8(): Uint8Array;
    getCompactLease_asB64(): string;
    setCompactLease(value: Uint8Array | string): Openchannel_initRequest;
    clearChannelTypeList(): void;
    getChannelTypeList(): Array<number>;
    setChannelTypeList(value: Array<number>): Openchannel_initRequest;
    addChannelType(value: number, index?: number): number;

    hasAmount(): boolean;
    clearAmount(): void;
    getAmount(): cln_primitives_pb.Amount | undefined;
    setAmount(value?: cln_primitives_pb.Amount): Openchannel_initRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): Openchannel_initRequest.AsObject;
    static toObject(includeInstance: boolean, msg: Openchannel_initRequest): Openchannel_initRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: Openchannel_initRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): Openchannel_initRequest;
    static deserializeBinaryFromReader(message: Openchannel_initRequest, reader: jspb.BinaryReader): Openchannel_initRequest;
}

export namespace Openchannel_initRequest {
    export type AsObject = {
        id: Uint8Array | string,
        initialpsbt: string,
        commitmentFeerate?: cln_primitives_pb.Feerate.AsObject,
        fundingFeerate?: cln_primitives_pb.Feerate.AsObject,
        announce?: boolean,
        closeTo?: string,
        requestAmt?: cln_primitives_pb.Amount.AsObject,
        compactLease: Uint8Array | string,
        channelTypeList: Array<number>,
        amount?: cln_primitives_pb.Amount.AsObject,
    }
}

export class Openchannel_initResponse extends jspb.Message { 
    getChannelId(): Uint8Array | string;
    getChannelId_asU8(): Uint8Array;
    getChannelId_asB64(): string;
    setChannelId(value: Uint8Array | string): Openchannel_initResponse;
    getPsbt(): string;
    setPsbt(value: string): Openchannel_initResponse;

    hasChannelType(): boolean;
    clearChannelType(): void;
    getChannelType(): Openchannel_initChannel_type | undefined;
    setChannelType(value?: Openchannel_initChannel_type): Openchannel_initResponse;
    getCommitmentsSecured(): boolean;
    setCommitmentsSecured(value: boolean): Openchannel_initResponse;
    getFundingSerial(): number;
    setFundingSerial(value: number): Openchannel_initResponse;

    hasRequiresConfirmedInputs(): boolean;
    clearRequiresConfirmedInputs(): void;
    getRequiresConfirmedInputs(): boolean | undefined;
    setRequiresConfirmedInputs(value: boolean): Openchannel_initResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): Openchannel_initResponse.AsObject;
    static toObject(includeInstance: boolean, msg: Openchannel_initResponse): Openchannel_initResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: Openchannel_initResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): Openchannel_initResponse;
    static deserializeBinaryFromReader(message: Openchannel_initResponse, reader: jspb.BinaryReader): Openchannel_initResponse;
}

export namespace Openchannel_initResponse {
    export type AsObject = {
        channelId: Uint8Array | string,
        psbt: string,
        channelType?: Openchannel_initChannel_type.AsObject,
        commitmentsSecured: boolean,
        fundingSerial: number,
        requiresConfirmedInputs?: boolean,
    }
}

export class Openchannel_initChannel_type extends jspb.Message { 
    clearBitsList(): void;
    getBitsList(): Array<number>;
    setBitsList(value: Array<number>): Openchannel_initChannel_type;
    addBits(value: number, index?: number): number;
    clearNamesList(): void;
    getNamesList(): Array<cln_primitives_pb.ChannelTypeName>;
    setNamesList(value: Array<cln_primitives_pb.ChannelTypeName>): Openchannel_initChannel_type;
    addNames(value: cln_primitives_pb.ChannelTypeName, index?: number): cln_primitives_pb.ChannelTypeName;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): Openchannel_initChannel_type.AsObject;
    static toObject(includeInstance: boolean, msg: Openchannel_initChannel_type): Openchannel_initChannel_type.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: Openchannel_initChannel_type, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): Openchannel_initChannel_type;
    static deserializeBinaryFromReader(message: Openchannel_initChannel_type, reader: jspb.BinaryReader): Openchannel_initChannel_type;
}

export namespace Openchannel_initChannel_type {
    export type AsObject = {
        bitsList: Array<number>,
        namesList: Array<cln_primitives_pb.ChannelTypeName>,
    }
}

export class Openchannel_signedRequest extends jspb.Message { 
    getChannelId(): Uint8Array | string;
    getChannelId_asU8(): Uint8Array;
    getChannelId_asB64(): string;
    setChannelId(value: Uint8Array | string): Openchannel_signedRequest;
    getSignedPsbt(): string;
    setSignedPsbt(value: string): Openchannel_signedRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): Openchannel_signedRequest.AsObject;
    static toObject(includeInstance: boolean, msg: Openchannel_signedRequest): Openchannel_signedRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: Openchannel_signedRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): Openchannel_signedRequest;
    static deserializeBinaryFromReader(message: Openchannel_signedRequest, reader: jspb.BinaryReader): Openchannel_signedRequest;
}

export namespace Openchannel_signedRequest {
    export type AsObject = {
        channelId: Uint8Array | string,
        signedPsbt: string,
    }
}

export class Openchannel_signedResponse extends jspb.Message { 
    getChannelId(): Uint8Array | string;
    getChannelId_asU8(): Uint8Array;
    getChannelId_asB64(): string;
    setChannelId(value: Uint8Array | string): Openchannel_signedResponse;
    getTx(): Uint8Array | string;
    getTx_asU8(): Uint8Array;
    getTx_asB64(): string;
    setTx(value: Uint8Array | string): Openchannel_signedResponse;
    getTxid(): Uint8Array | string;
    getTxid_asU8(): Uint8Array;
    getTxid_asB64(): string;
    setTxid(value: Uint8Array | string): Openchannel_signedResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): Openchannel_signedResponse.AsObject;
    static toObject(includeInstance: boolean, msg: Openchannel_signedResponse): Openchannel_signedResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: Openchannel_signedResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): Openchannel_signedResponse;
    static deserializeBinaryFromReader(message: Openchannel_signedResponse, reader: jspb.BinaryReader): Openchannel_signedResponse;
}

export namespace Openchannel_signedResponse {
    export type AsObject = {
        channelId: Uint8Array | string,
        tx: Uint8Array | string,
        txid: Uint8Array | string,
    }
}

export class Openchannel_updateRequest extends jspb.Message { 
    getChannelId(): Uint8Array | string;
    getChannelId_asU8(): Uint8Array;
    getChannelId_asB64(): string;
    setChannelId(value: Uint8Array | string): Openchannel_updateRequest;
    getPsbt(): string;
    setPsbt(value: string): Openchannel_updateRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): Openchannel_updateRequest.AsObject;
    static toObject(includeInstance: boolean, msg: Openchannel_updateRequest): Openchannel_updateRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: Openchannel_updateRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): Openchannel_updateRequest;
    static deserializeBinaryFromReader(message: Openchannel_updateRequest, reader: jspb.BinaryReader): Openchannel_updateRequest;
}

export namespace Openchannel_updateRequest {
    export type AsObject = {
        channelId: Uint8Array | string,
        psbt: string,
    }
}

export class Openchannel_updateResponse extends jspb.Message { 
    getChannelId(): Uint8Array | string;
    getChannelId_asU8(): Uint8Array;
    getChannelId_asB64(): string;
    setChannelId(value: Uint8Array | string): Openchannel_updateResponse;

    hasChannelType(): boolean;
    clearChannelType(): void;
    getChannelType(): Openchannel_updateChannel_type | undefined;
    setChannelType(value?: Openchannel_updateChannel_type): Openchannel_updateResponse;
    getPsbt(): string;
    setPsbt(value: string): Openchannel_updateResponse;
    getCommitmentsSecured(): boolean;
    setCommitmentsSecured(value: boolean): Openchannel_updateResponse;
    getFundingOutnum(): number;
    setFundingOutnum(value: number): Openchannel_updateResponse;

    hasCloseTo(): boolean;
    clearCloseTo(): void;
    getCloseTo(): Uint8Array | string;
    getCloseTo_asU8(): Uint8Array;
    getCloseTo_asB64(): string;
    setCloseTo(value: Uint8Array | string): Openchannel_updateResponse;

    hasRequiresConfirmedInputs(): boolean;
    clearRequiresConfirmedInputs(): void;
    getRequiresConfirmedInputs(): boolean | undefined;
    setRequiresConfirmedInputs(value: boolean): Openchannel_updateResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): Openchannel_updateResponse.AsObject;
    static toObject(includeInstance: boolean, msg: Openchannel_updateResponse): Openchannel_updateResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: Openchannel_updateResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): Openchannel_updateResponse;
    static deserializeBinaryFromReader(message: Openchannel_updateResponse, reader: jspb.BinaryReader): Openchannel_updateResponse;
}

export namespace Openchannel_updateResponse {
    export type AsObject = {
        channelId: Uint8Array | string,
        channelType?: Openchannel_updateChannel_type.AsObject,
        psbt: string,
        commitmentsSecured: boolean,
        fundingOutnum: number,
        closeTo: Uint8Array | string,
        requiresConfirmedInputs?: boolean,
    }
}

export class Openchannel_updateChannel_type extends jspb.Message { 
    clearBitsList(): void;
    getBitsList(): Array<number>;
    setBitsList(value: Array<number>): Openchannel_updateChannel_type;
    addBits(value: number, index?: number): number;
    clearNamesList(): void;
    getNamesList(): Array<cln_primitives_pb.ChannelTypeName>;
    setNamesList(value: Array<cln_primitives_pb.ChannelTypeName>): Openchannel_updateChannel_type;
    addNames(value: cln_primitives_pb.ChannelTypeName, index?: number): cln_primitives_pb.ChannelTypeName;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): Openchannel_updateChannel_type.AsObject;
    static toObject(includeInstance: boolean, msg: Openchannel_updateChannel_type): Openchannel_updateChannel_type.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: Openchannel_updateChannel_type, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): Openchannel_updateChannel_type;
    static deserializeBinaryFromReader(message: Openchannel_updateChannel_type, reader: jspb.BinaryReader): Openchannel_updateChannel_type;
}

export namespace Openchannel_updateChannel_type {
    export type AsObject = {
        bitsList: Array<number>,
        namesList: Array<cln_primitives_pb.ChannelTypeName>,
    }
}

export class PingRequest extends jspb.Message { 
    getId(): Uint8Array | string;
    getId_asU8(): Uint8Array;
    getId_asB64(): string;
    setId(value: Uint8Array | string): PingRequest;

    hasLen(): boolean;
    clearLen(): void;
    getLen(): number | undefined;
    setLen(value: number): PingRequest;

    hasPongbytes(): boolean;
    clearPongbytes(): void;
    getPongbytes(): number | undefined;
    setPongbytes(value: number): PingRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): PingRequest.AsObject;
    static toObject(includeInstance: boolean, msg: PingRequest): PingRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: PingRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): PingRequest;
    static deserializeBinaryFromReader(message: PingRequest, reader: jspb.BinaryReader): PingRequest;
}

export namespace PingRequest {
    export type AsObject = {
        id: Uint8Array | string,
        len?: number,
        pongbytes?: number,
    }
}

export class PingResponse extends jspb.Message { 
    getTotlen(): number;
    setTotlen(value: number): PingResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): PingResponse.AsObject;
    static toObject(includeInstance: boolean, msg: PingResponse): PingResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: PingResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): PingResponse;
    static deserializeBinaryFromReader(message: PingResponse, reader: jspb.BinaryReader): PingResponse;
}

export namespace PingResponse {
    export type AsObject = {
        totlen: number,
    }
}

export class PluginRequest extends jspb.Message { 
    getSubcommand(): cln_primitives_pb.PluginSubcommand;
    setSubcommand(value: cln_primitives_pb.PluginSubcommand): PluginRequest;

    hasPlugin(): boolean;
    clearPlugin(): void;
    getPlugin(): string | undefined;
    setPlugin(value: string): PluginRequest;

    hasDirectory(): boolean;
    clearDirectory(): void;
    getDirectory(): string | undefined;
    setDirectory(value: string): PluginRequest;
    clearOptionsList(): void;
    getOptionsList(): Array<string>;
    setOptionsList(value: Array<string>): PluginRequest;
    addOptions(value: string, index?: number): string;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): PluginRequest.AsObject;
    static toObject(includeInstance: boolean, msg: PluginRequest): PluginRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: PluginRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): PluginRequest;
    static deserializeBinaryFromReader(message: PluginRequest, reader: jspb.BinaryReader): PluginRequest;
}

export namespace PluginRequest {
    export type AsObject = {
        subcommand: cln_primitives_pb.PluginSubcommand,
        plugin?: string,
        directory?: string,
        optionsList: Array<string>,
    }
}

export class PluginResponse extends jspb.Message { 
    getCommand(): cln_primitives_pb.PluginSubcommand;
    setCommand(value: cln_primitives_pb.PluginSubcommand): PluginResponse;
    clearPluginsList(): void;
    getPluginsList(): Array<PluginPlugins>;
    setPluginsList(value: Array<PluginPlugins>): PluginResponse;
    addPlugins(value?: PluginPlugins, index?: number): PluginPlugins;

    hasResult(): boolean;
    clearResult(): void;
    getResult(): string | undefined;
    setResult(value: string): PluginResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): PluginResponse.AsObject;
    static toObject(includeInstance: boolean, msg: PluginResponse): PluginResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: PluginResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): PluginResponse;
    static deserializeBinaryFromReader(message: PluginResponse, reader: jspb.BinaryReader): PluginResponse;
}

export namespace PluginResponse {
    export type AsObject = {
        command: cln_primitives_pb.PluginSubcommand,
        pluginsList: Array<PluginPlugins.AsObject>,
        result?: string,
    }
}

export class PluginPlugins extends jspb.Message { 
    getName(): string;
    setName(value: string): PluginPlugins;
    getActive(): boolean;
    setActive(value: boolean): PluginPlugins;
    getDynamic(): boolean;
    setDynamic(value: boolean): PluginPlugins;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): PluginPlugins.AsObject;
    static toObject(includeInstance: boolean, msg: PluginPlugins): PluginPlugins.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: PluginPlugins, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): PluginPlugins;
    static deserializeBinaryFromReader(message: PluginPlugins, reader: jspb.BinaryReader): PluginPlugins;
}

export namespace PluginPlugins {
    export type AsObject = {
        name: string,
        active: boolean,
        dynamic: boolean,
    }
}

export class RenepaystatusRequest extends jspb.Message { 

    hasInvstring(): boolean;
    clearInvstring(): void;
    getInvstring(): string | undefined;
    setInvstring(value: string): RenepaystatusRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): RenepaystatusRequest.AsObject;
    static toObject(includeInstance: boolean, msg: RenepaystatusRequest): RenepaystatusRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: RenepaystatusRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): RenepaystatusRequest;
    static deserializeBinaryFromReader(message: RenepaystatusRequest, reader: jspb.BinaryReader): RenepaystatusRequest;
}

export namespace RenepaystatusRequest {
    export type AsObject = {
        invstring?: string,
    }
}

export class RenepaystatusResponse extends jspb.Message { 
    clearPaystatusList(): void;
    getPaystatusList(): Array<RenepaystatusPaystatus>;
    setPaystatusList(value: Array<RenepaystatusPaystatus>): RenepaystatusResponse;
    addPaystatus(value?: RenepaystatusPaystatus, index?: number): RenepaystatusPaystatus;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): RenepaystatusResponse.AsObject;
    static toObject(includeInstance: boolean, msg: RenepaystatusResponse): RenepaystatusResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: RenepaystatusResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): RenepaystatusResponse;
    static deserializeBinaryFromReader(message: RenepaystatusResponse, reader: jspb.BinaryReader): RenepaystatusResponse;
}

export namespace RenepaystatusResponse {
    export type AsObject = {
        paystatusList: Array<RenepaystatusPaystatus.AsObject>,
    }
}

export class RenepaystatusPaystatus extends jspb.Message { 
    getBolt11(): string;
    setBolt11(value: string): RenepaystatusPaystatus;

    hasPaymentPreimage(): boolean;
    clearPaymentPreimage(): void;
    getPaymentPreimage(): Uint8Array | string;
    getPaymentPreimage_asU8(): Uint8Array;
    getPaymentPreimage_asB64(): string;
    setPaymentPreimage(value: Uint8Array | string): RenepaystatusPaystatus;
    getPaymentHash(): Uint8Array | string;
    getPaymentHash_asU8(): Uint8Array;
    getPaymentHash_asB64(): string;
    setPaymentHash(value: Uint8Array | string): RenepaystatusPaystatus;
    getCreatedAt(): number;
    setCreatedAt(value: number): RenepaystatusPaystatus;
    getGroupid(): number;
    setGroupid(value: number): RenepaystatusPaystatus;

    hasParts(): boolean;
    clearParts(): void;
    getParts(): number | undefined;
    setParts(value: number): RenepaystatusPaystatus;

    hasAmountMsat(): boolean;
    clearAmountMsat(): void;
    getAmountMsat(): cln_primitives_pb.Amount | undefined;
    setAmountMsat(value?: cln_primitives_pb.Amount): RenepaystatusPaystatus;

    hasAmountSentMsat(): boolean;
    clearAmountSentMsat(): void;
    getAmountSentMsat(): cln_primitives_pb.Amount | undefined;
    setAmountSentMsat(value?: cln_primitives_pb.Amount): RenepaystatusPaystatus;
    getStatus(): RenepaystatusPaystatus.RenepaystatusPaystatusStatus;
    setStatus(value: RenepaystatusPaystatus.RenepaystatusPaystatusStatus): RenepaystatusPaystatus;

    hasDestination(): boolean;
    clearDestination(): void;
    getDestination(): Uint8Array | string;
    getDestination_asU8(): Uint8Array;
    getDestination_asB64(): string;
    setDestination(value: Uint8Array | string): RenepaystatusPaystatus;
    clearNotesList(): void;
    getNotesList(): Array<string>;
    setNotesList(value: Array<string>): RenepaystatusPaystatus;
    addNotes(value: string, index?: number): string;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): RenepaystatusPaystatus.AsObject;
    static toObject(includeInstance: boolean, msg: RenepaystatusPaystatus): RenepaystatusPaystatus.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: RenepaystatusPaystatus, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): RenepaystatusPaystatus;
    static deserializeBinaryFromReader(message: RenepaystatusPaystatus, reader: jspb.BinaryReader): RenepaystatusPaystatus;
}

export namespace RenepaystatusPaystatus {
    export type AsObject = {
        bolt11: string,
        paymentPreimage: Uint8Array | string,
        paymentHash: Uint8Array | string,
        createdAt: number,
        groupid: number,
        parts?: number,
        amountMsat?: cln_primitives_pb.Amount.AsObject,
        amountSentMsat?: cln_primitives_pb.Amount.AsObject,
        status: RenepaystatusPaystatus.RenepaystatusPaystatusStatus,
        destination: Uint8Array | string,
        notesList: Array<string>,
    }

    export enum RenepaystatusPaystatusStatus {
    COMPLETE = 0,
    PENDING = 1,
    FAILED = 2,
    }

}

export class RenepayRequest extends jspb.Message { 
    getInvstring(): string;
    setInvstring(value: string): RenepayRequest;

    hasAmountMsat(): boolean;
    clearAmountMsat(): void;
    getAmountMsat(): cln_primitives_pb.Amount | undefined;
    setAmountMsat(value?: cln_primitives_pb.Amount): RenepayRequest;

    hasMaxfee(): boolean;
    clearMaxfee(): void;
    getMaxfee(): cln_primitives_pb.Amount | undefined;
    setMaxfee(value?: cln_primitives_pb.Amount): RenepayRequest;

    hasMaxdelay(): boolean;
    clearMaxdelay(): void;
    getMaxdelay(): number | undefined;
    setMaxdelay(value: number): RenepayRequest;

    hasRetryFor(): boolean;
    clearRetryFor(): void;
    getRetryFor(): number | undefined;
    setRetryFor(value: number): RenepayRequest;

    hasDescription(): boolean;
    clearDescription(): void;
    getDescription(): string | undefined;
    setDescription(value: string): RenepayRequest;

    hasLabel(): boolean;
    clearLabel(): void;
    getLabel(): string | undefined;
    setLabel(value: string): RenepayRequest;

    hasDevUseShadow(): boolean;
    clearDevUseShadow(): void;
    getDevUseShadow(): boolean | undefined;
    setDevUseShadow(value: boolean): RenepayRequest;
    clearExcludeList(): void;
    getExcludeList(): Array<string>;
    setExcludeList(value: Array<string>): RenepayRequest;
    addExclude(value: string, index?: number): string;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): RenepayRequest.AsObject;
    static toObject(includeInstance: boolean, msg: RenepayRequest): RenepayRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: RenepayRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): RenepayRequest;
    static deserializeBinaryFromReader(message: RenepayRequest, reader: jspb.BinaryReader): RenepayRequest;
}

export namespace RenepayRequest {
    export type AsObject = {
        invstring: string,
        amountMsat?: cln_primitives_pb.Amount.AsObject,
        maxfee?: cln_primitives_pb.Amount.AsObject,
        maxdelay?: number,
        retryFor?: number,
        description?: string,
        label?: string,
        devUseShadow?: boolean,
        excludeList: Array<string>,
    }
}

export class RenepayResponse extends jspb.Message { 
    getPaymentPreimage(): Uint8Array | string;
    getPaymentPreimage_asU8(): Uint8Array;
    getPaymentPreimage_asB64(): string;
    setPaymentPreimage(value: Uint8Array | string): RenepayResponse;
    getPaymentHash(): Uint8Array | string;
    getPaymentHash_asU8(): Uint8Array;
    getPaymentHash_asB64(): string;
    setPaymentHash(value: Uint8Array | string): RenepayResponse;
    getCreatedAt(): number;
    setCreatedAt(value: number): RenepayResponse;
    getParts(): number;
    setParts(value: number): RenepayResponse;

    hasAmountMsat(): boolean;
    clearAmountMsat(): void;
    getAmountMsat(): cln_primitives_pb.Amount | undefined;
    setAmountMsat(value?: cln_primitives_pb.Amount): RenepayResponse;

    hasAmountSentMsat(): boolean;
    clearAmountSentMsat(): void;
    getAmountSentMsat(): cln_primitives_pb.Amount | undefined;
    setAmountSentMsat(value?: cln_primitives_pb.Amount): RenepayResponse;
    getStatus(): RenepayResponse.RenepayStatus;
    setStatus(value: RenepayResponse.RenepayStatus): RenepayResponse;

    hasDestination(): boolean;
    clearDestination(): void;
    getDestination(): Uint8Array | string;
    getDestination_asU8(): Uint8Array;
    getDestination_asB64(): string;
    setDestination(value: Uint8Array | string): RenepayResponse;

    hasBolt11(): boolean;
    clearBolt11(): void;
    getBolt11(): string | undefined;
    setBolt11(value: string): RenepayResponse;

    hasBolt12(): boolean;
    clearBolt12(): void;
    getBolt12(): string | undefined;
    setBolt12(value: string): RenepayResponse;

    hasGroupid(): boolean;
    clearGroupid(): void;
    getGroupid(): number | undefined;
    setGroupid(value: number): RenepayResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): RenepayResponse.AsObject;
    static toObject(includeInstance: boolean, msg: RenepayResponse): RenepayResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: RenepayResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): RenepayResponse;
    static deserializeBinaryFromReader(message: RenepayResponse, reader: jspb.BinaryReader): RenepayResponse;
}

export namespace RenepayResponse {
    export type AsObject = {
        paymentPreimage: Uint8Array | string,
        paymentHash: Uint8Array | string,
        createdAt: number,
        parts: number,
        amountMsat?: cln_primitives_pb.Amount.AsObject,
        amountSentMsat?: cln_primitives_pb.Amount.AsObject,
        status: RenepayResponse.RenepayStatus,
        destination: Uint8Array | string,
        bolt11?: string,
        bolt12?: string,
        groupid?: number,
    }

    export enum RenepayStatus {
    COMPLETE = 0,
    PENDING = 1,
    FAILED = 2,
    }

}

export class ReserveinputsRequest extends jspb.Message { 
    getPsbt(): string;
    setPsbt(value: string): ReserveinputsRequest;

    hasExclusive(): boolean;
    clearExclusive(): void;
    getExclusive(): boolean | undefined;
    setExclusive(value: boolean): ReserveinputsRequest;

    hasReserve(): boolean;
    clearReserve(): void;
    getReserve(): number | undefined;
    setReserve(value: number): ReserveinputsRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ReserveinputsRequest.AsObject;
    static toObject(includeInstance: boolean, msg: ReserveinputsRequest): ReserveinputsRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ReserveinputsRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ReserveinputsRequest;
    static deserializeBinaryFromReader(message: ReserveinputsRequest, reader: jspb.BinaryReader): ReserveinputsRequest;
}

export namespace ReserveinputsRequest {
    export type AsObject = {
        psbt: string,
        exclusive?: boolean,
        reserve?: number,
    }
}

export class ReserveinputsResponse extends jspb.Message { 
    clearReservationsList(): void;
    getReservationsList(): Array<ReserveinputsReservations>;
    setReservationsList(value: Array<ReserveinputsReservations>): ReserveinputsResponse;
    addReservations(value?: ReserveinputsReservations, index?: number): ReserveinputsReservations;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ReserveinputsResponse.AsObject;
    static toObject(includeInstance: boolean, msg: ReserveinputsResponse): ReserveinputsResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ReserveinputsResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ReserveinputsResponse;
    static deserializeBinaryFromReader(message: ReserveinputsResponse, reader: jspb.BinaryReader): ReserveinputsResponse;
}

export namespace ReserveinputsResponse {
    export type AsObject = {
        reservationsList: Array<ReserveinputsReservations.AsObject>,
    }
}

export class ReserveinputsReservations extends jspb.Message { 
    getTxid(): Uint8Array | string;
    getTxid_asU8(): Uint8Array;
    getTxid_asB64(): string;
    setTxid(value: Uint8Array | string): ReserveinputsReservations;
    getVout(): number;
    setVout(value: number): ReserveinputsReservations;
    getWasReserved(): boolean;
    setWasReserved(value: boolean): ReserveinputsReservations;
    getReserved(): boolean;
    setReserved(value: boolean): ReserveinputsReservations;
    getReservedToBlock(): number;
    setReservedToBlock(value: number): ReserveinputsReservations;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ReserveinputsReservations.AsObject;
    static toObject(includeInstance: boolean, msg: ReserveinputsReservations): ReserveinputsReservations.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ReserveinputsReservations, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ReserveinputsReservations;
    static deserializeBinaryFromReader(message: ReserveinputsReservations, reader: jspb.BinaryReader): ReserveinputsReservations;
}

export namespace ReserveinputsReservations {
    export type AsObject = {
        txid: Uint8Array | string,
        vout: number,
        wasReserved: boolean,
        reserved: boolean,
        reservedToBlock: number,
    }
}

export class SendcustommsgRequest extends jspb.Message { 
    getNodeId(): Uint8Array | string;
    getNodeId_asU8(): Uint8Array;
    getNodeId_asB64(): string;
    setNodeId(value: Uint8Array | string): SendcustommsgRequest;
    getMsg(): Uint8Array | string;
    getMsg_asU8(): Uint8Array;
    getMsg_asB64(): string;
    setMsg(value: Uint8Array | string): SendcustommsgRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): SendcustommsgRequest.AsObject;
    static toObject(includeInstance: boolean, msg: SendcustommsgRequest): SendcustommsgRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: SendcustommsgRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): SendcustommsgRequest;
    static deserializeBinaryFromReader(message: SendcustommsgRequest, reader: jspb.BinaryReader): SendcustommsgRequest;
}

export namespace SendcustommsgRequest {
    export type AsObject = {
        nodeId: Uint8Array | string,
        msg: Uint8Array | string,
    }
}

export class SendcustommsgResponse extends jspb.Message { 
    getStatus(): string;
    setStatus(value: string): SendcustommsgResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): SendcustommsgResponse.AsObject;
    static toObject(includeInstance: boolean, msg: SendcustommsgResponse): SendcustommsgResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: SendcustommsgResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): SendcustommsgResponse;
    static deserializeBinaryFromReader(message: SendcustommsgResponse, reader: jspb.BinaryReader): SendcustommsgResponse;
}

export namespace SendcustommsgResponse {
    export type AsObject = {
        status: string,
    }
}

export class SendinvoiceRequest extends jspb.Message { 
    getInvreq(): string;
    setInvreq(value: string): SendinvoiceRequest;
    getLabel(): string;
    setLabel(value: string): SendinvoiceRequest;

    hasAmountMsat(): boolean;
    clearAmountMsat(): void;
    getAmountMsat(): cln_primitives_pb.Amount | undefined;
    setAmountMsat(value?: cln_primitives_pb.Amount): SendinvoiceRequest;

    hasTimeout(): boolean;
    clearTimeout(): void;
    getTimeout(): number | undefined;
    setTimeout(value: number): SendinvoiceRequest;

    hasQuantity(): boolean;
    clearQuantity(): void;
    getQuantity(): number | undefined;
    setQuantity(value: number): SendinvoiceRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): SendinvoiceRequest.AsObject;
    static toObject(includeInstance: boolean, msg: SendinvoiceRequest): SendinvoiceRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: SendinvoiceRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): SendinvoiceRequest;
    static deserializeBinaryFromReader(message: SendinvoiceRequest, reader: jspb.BinaryReader): SendinvoiceRequest;
}

export namespace SendinvoiceRequest {
    export type AsObject = {
        invreq: string,
        label: string,
        amountMsat?: cln_primitives_pb.Amount.AsObject,
        timeout?: number,
        quantity?: number,
    }
}

export class SendinvoiceResponse extends jspb.Message { 
    getLabel(): string;
    setLabel(value: string): SendinvoiceResponse;
    getDescription(): string;
    setDescription(value: string): SendinvoiceResponse;
    getPaymentHash(): Uint8Array | string;
    getPaymentHash_asU8(): Uint8Array;
    getPaymentHash_asB64(): string;
    setPaymentHash(value: Uint8Array | string): SendinvoiceResponse;
    getStatus(): SendinvoiceResponse.SendinvoiceStatus;
    setStatus(value: SendinvoiceResponse.SendinvoiceStatus): SendinvoiceResponse;
    getExpiresAt(): number;
    setExpiresAt(value: number): SendinvoiceResponse;

    hasAmountMsat(): boolean;
    clearAmountMsat(): void;
    getAmountMsat(): cln_primitives_pb.Amount | undefined;
    setAmountMsat(value?: cln_primitives_pb.Amount): SendinvoiceResponse;

    hasBolt12(): boolean;
    clearBolt12(): void;
    getBolt12(): string | undefined;
    setBolt12(value: string): SendinvoiceResponse;

    hasCreatedIndex(): boolean;
    clearCreatedIndex(): void;
    getCreatedIndex(): number | undefined;
    setCreatedIndex(value: number): SendinvoiceResponse;

    hasUpdatedIndex(): boolean;
    clearUpdatedIndex(): void;
    getUpdatedIndex(): number | undefined;
    setUpdatedIndex(value: number): SendinvoiceResponse;

    hasPayIndex(): boolean;
    clearPayIndex(): void;
    getPayIndex(): number | undefined;
    setPayIndex(value: number): SendinvoiceResponse;

    hasAmountReceivedMsat(): boolean;
    clearAmountReceivedMsat(): void;
    getAmountReceivedMsat(): cln_primitives_pb.Amount | undefined;
    setAmountReceivedMsat(value?: cln_primitives_pb.Amount): SendinvoiceResponse;

    hasPaidAt(): boolean;
    clearPaidAt(): void;
    getPaidAt(): number | undefined;
    setPaidAt(value: number): SendinvoiceResponse;

    hasPaymentPreimage(): boolean;
    clearPaymentPreimage(): void;
    getPaymentPreimage(): Uint8Array | string;
    getPaymentPreimage_asU8(): Uint8Array;
    getPaymentPreimage_asB64(): string;
    setPaymentPreimage(value: Uint8Array | string): SendinvoiceResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): SendinvoiceResponse.AsObject;
    static toObject(includeInstance: boolean, msg: SendinvoiceResponse): SendinvoiceResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: SendinvoiceResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): SendinvoiceResponse;
    static deserializeBinaryFromReader(message: SendinvoiceResponse, reader: jspb.BinaryReader): SendinvoiceResponse;
}

export namespace SendinvoiceResponse {
    export type AsObject = {
        label: string,
        description: string,
        paymentHash: Uint8Array | string,
        status: SendinvoiceResponse.SendinvoiceStatus,
        expiresAt: number,
        amountMsat?: cln_primitives_pb.Amount.AsObject,
        bolt12?: string,
        createdIndex?: number,
        updatedIndex?: number,
        payIndex?: number,
        amountReceivedMsat?: cln_primitives_pb.Amount.AsObject,
        paidAt?: number,
        paymentPreimage: Uint8Array | string,
    }

    export enum SendinvoiceStatus {
    UNPAID = 0,
    PAID = 1,
    EXPIRED = 2,
    }

}

export class SetchannelRequest extends jspb.Message { 
    getId(): string;
    setId(value: string): SetchannelRequest;

    hasFeebase(): boolean;
    clearFeebase(): void;
    getFeebase(): cln_primitives_pb.Amount | undefined;
    setFeebase(value?: cln_primitives_pb.Amount): SetchannelRequest;

    hasFeeppm(): boolean;
    clearFeeppm(): void;
    getFeeppm(): number | undefined;
    setFeeppm(value: number): SetchannelRequest;

    hasHtlcmin(): boolean;
    clearHtlcmin(): void;
    getHtlcmin(): cln_primitives_pb.Amount | undefined;
    setHtlcmin(value?: cln_primitives_pb.Amount): SetchannelRequest;

    hasHtlcmax(): boolean;
    clearHtlcmax(): void;
    getHtlcmax(): cln_primitives_pb.Amount | undefined;
    setHtlcmax(value?: cln_primitives_pb.Amount): SetchannelRequest;

    hasEnforcedelay(): boolean;
    clearEnforcedelay(): void;
    getEnforcedelay(): number | undefined;
    setEnforcedelay(value: number): SetchannelRequest;

    hasIgnorefeelimits(): boolean;
    clearIgnorefeelimits(): void;
    getIgnorefeelimits(): boolean | undefined;
    setIgnorefeelimits(value: boolean): SetchannelRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): SetchannelRequest.AsObject;
    static toObject(includeInstance: boolean, msg: SetchannelRequest): SetchannelRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: SetchannelRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): SetchannelRequest;
    static deserializeBinaryFromReader(message: SetchannelRequest, reader: jspb.BinaryReader): SetchannelRequest;
}

export namespace SetchannelRequest {
    export type AsObject = {
        id: string,
        feebase?: cln_primitives_pb.Amount.AsObject,
        feeppm?: number,
        htlcmin?: cln_primitives_pb.Amount.AsObject,
        htlcmax?: cln_primitives_pb.Amount.AsObject,
        enforcedelay?: number,
        ignorefeelimits?: boolean,
    }
}

export class SetchannelResponse extends jspb.Message { 
    clearChannelsList(): void;
    getChannelsList(): Array<SetchannelChannels>;
    setChannelsList(value: Array<SetchannelChannels>): SetchannelResponse;
    addChannels(value?: SetchannelChannels, index?: number): SetchannelChannels;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): SetchannelResponse.AsObject;
    static toObject(includeInstance: boolean, msg: SetchannelResponse): SetchannelResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: SetchannelResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): SetchannelResponse;
    static deserializeBinaryFromReader(message: SetchannelResponse, reader: jspb.BinaryReader): SetchannelResponse;
}

export namespace SetchannelResponse {
    export type AsObject = {
        channelsList: Array<SetchannelChannels.AsObject>,
    }
}

export class SetchannelChannels extends jspb.Message { 
    getPeerId(): Uint8Array | string;
    getPeerId_asU8(): Uint8Array;
    getPeerId_asB64(): string;
    setPeerId(value: Uint8Array | string): SetchannelChannels;
    getChannelId(): Uint8Array | string;
    getChannelId_asU8(): Uint8Array;
    getChannelId_asB64(): string;
    setChannelId(value: Uint8Array | string): SetchannelChannels;

    hasShortChannelId(): boolean;
    clearShortChannelId(): void;
    getShortChannelId(): string | undefined;
    setShortChannelId(value: string): SetchannelChannels;

    hasFeeBaseMsat(): boolean;
    clearFeeBaseMsat(): void;
    getFeeBaseMsat(): cln_primitives_pb.Amount | undefined;
    setFeeBaseMsat(value?: cln_primitives_pb.Amount): SetchannelChannels;
    getFeeProportionalMillionths(): number;
    setFeeProportionalMillionths(value: number): SetchannelChannels;

    hasMinimumHtlcOutMsat(): boolean;
    clearMinimumHtlcOutMsat(): void;
    getMinimumHtlcOutMsat(): cln_primitives_pb.Amount | undefined;
    setMinimumHtlcOutMsat(value?: cln_primitives_pb.Amount): SetchannelChannels;

    hasWarningHtlcminTooLow(): boolean;
    clearWarningHtlcminTooLow(): void;
    getWarningHtlcminTooLow(): string | undefined;
    setWarningHtlcminTooLow(value: string): SetchannelChannels;

    hasMaximumHtlcOutMsat(): boolean;
    clearMaximumHtlcOutMsat(): void;
    getMaximumHtlcOutMsat(): cln_primitives_pb.Amount | undefined;
    setMaximumHtlcOutMsat(value?: cln_primitives_pb.Amount): SetchannelChannels;

    hasWarningHtlcmaxTooHigh(): boolean;
    clearWarningHtlcmaxTooHigh(): void;
    getWarningHtlcmaxTooHigh(): string | undefined;
    setWarningHtlcmaxTooHigh(value: string): SetchannelChannels;

    hasIgnoreFeeLimits(): boolean;
    clearIgnoreFeeLimits(): void;
    getIgnoreFeeLimits(): boolean | undefined;
    setIgnoreFeeLimits(value: boolean): SetchannelChannels;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): SetchannelChannels.AsObject;
    static toObject(includeInstance: boolean, msg: SetchannelChannels): SetchannelChannels.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: SetchannelChannels, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): SetchannelChannels;
    static deserializeBinaryFromReader(message: SetchannelChannels, reader: jspb.BinaryReader): SetchannelChannels;
}

export namespace SetchannelChannels {
    export type AsObject = {
        peerId: Uint8Array | string,
        channelId: Uint8Array | string,
        shortChannelId?: string,
        feeBaseMsat?: cln_primitives_pb.Amount.AsObject,
        feeProportionalMillionths: number,
        minimumHtlcOutMsat?: cln_primitives_pb.Amount.AsObject,
        warningHtlcminTooLow?: string,
        maximumHtlcOutMsat?: cln_primitives_pb.Amount.AsObject,
        warningHtlcmaxTooHigh?: string,
        ignoreFeeLimits?: boolean,
    }
}

export class SetconfigRequest extends jspb.Message { 
    getConfig(): string;
    setConfig(value: string): SetconfigRequest;

    hasVal(): boolean;
    clearVal(): void;
    getVal(): string | undefined;
    setVal(value: string): SetconfigRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): SetconfigRequest.AsObject;
    static toObject(includeInstance: boolean, msg: SetconfigRequest): SetconfigRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: SetconfigRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): SetconfigRequest;
    static deserializeBinaryFromReader(message: SetconfigRequest, reader: jspb.BinaryReader): SetconfigRequest;
}

export namespace SetconfigRequest {
    export type AsObject = {
        config: string,
        val?: string,
    }
}

export class SetconfigResponse extends jspb.Message { 

    hasConfig(): boolean;
    clearConfig(): void;
    getConfig(): SetconfigConfig | undefined;
    setConfig(value?: SetconfigConfig): SetconfigResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): SetconfigResponse.AsObject;
    static toObject(includeInstance: boolean, msg: SetconfigResponse): SetconfigResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: SetconfigResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): SetconfigResponse;
    static deserializeBinaryFromReader(message: SetconfigResponse, reader: jspb.BinaryReader): SetconfigResponse;
}

export namespace SetconfigResponse {
    export type AsObject = {
        config?: SetconfigConfig.AsObject,
    }
}

export class SetconfigConfig extends jspb.Message { 
    getConfig(): string;
    setConfig(value: string): SetconfigConfig;
    getSource(): string;
    setSource(value: string): SetconfigConfig;

    hasPlugin(): boolean;
    clearPlugin(): void;
    getPlugin(): string | undefined;
    setPlugin(value: string): SetconfigConfig;
    getDynamic(): boolean;
    setDynamic(value: boolean): SetconfigConfig;

    hasSet(): boolean;
    clearSet(): void;
    getSet(): boolean | undefined;
    setSet(value: boolean): SetconfigConfig;

    hasValueStr(): boolean;
    clearValueStr(): void;
    getValueStr(): string | undefined;
    setValueStr(value: string): SetconfigConfig;

    hasValueMsat(): boolean;
    clearValueMsat(): void;
    getValueMsat(): cln_primitives_pb.Amount | undefined;
    setValueMsat(value?: cln_primitives_pb.Amount): SetconfigConfig;

    hasValueInt(): boolean;
    clearValueInt(): void;
    getValueInt(): number | undefined;
    setValueInt(value: number): SetconfigConfig;

    hasValueBool(): boolean;
    clearValueBool(): void;
    getValueBool(): boolean | undefined;
    setValueBool(value: boolean): SetconfigConfig;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): SetconfigConfig.AsObject;
    static toObject(includeInstance: boolean, msg: SetconfigConfig): SetconfigConfig.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: SetconfigConfig, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): SetconfigConfig;
    static deserializeBinaryFromReader(message: SetconfigConfig, reader: jspb.BinaryReader): SetconfigConfig;
}

export namespace SetconfigConfig {
    export type AsObject = {
        config: string,
        source: string,
        plugin?: string,
        dynamic: boolean,
        set?: boolean,
        valueStr?: string,
        valueMsat?: cln_primitives_pb.Amount.AsObject,
        valueInt?: number,
        valueBool?: boolean,
    }
}

export class SetpsbtversionRequest extends jspb.Message { 
    getPsbt(): string;
    setPsbt(value: string): SetpsbtversionRequest;
    getVersion(): number;
    setVersion(value: number): SetpsbtversionRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): SetpsbtversionRequest.AsObject;
    static toObject(includeInstance: boolean, msg: SetpsbtversionRequest): SetpsbtversionRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: SetpsbtversionRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): SetpsbtversionRequest;
    static deserializeBinaryFromReader(message: SetpsbtversionRequest, reader: jspb.BinaryReader): SetpsbtversionRequest;
}

export namespace SetpsbtversionRequest {
    export type AsObject = {
        psbt: string,
        version: number,
    }
}

export class SetpsbtversionResponse extends jspb.Message { 
    getPsbt(): string;
    setPsbt(value: string): SetpsbtversionResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): SetpsbtversionResponse.AsObject;
    static toObject(includeInstance: boolean, msg: SetpsbtversionResponse): SetpsbtversionResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: SetpsbtversionResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): SetpsbtversionResponse;
    static deserializeBinaryFromReader(message: SetpsbtversionResponse, reader: jspb.BinaryReader): SetpsbtversionResponse;
}

export namespace SetpsbtversionResponse {
    export type AsObject = {
        psbt: string,
    }
}

export class SigninvoiceRequest extends jspb.Message { 
    getInvstring(): string;
    setInvstring(value: string): SigninvoiceRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): SigninvoiceRequest.AsObject;
    static toObject(includeInstance: boolean, msg: SigninvoiceRequest): SigninvoiceRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: SigninvoiceRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): SigninvoiceRequest;
    static deserializeBinaryFromReader(message: SigninvoiceRequest, reader: jspb.BinaryReader): SigninvoiceRequest;
}

export namespace SigninvoiceRequest {
    export type AsObject = {
        invstring: string,
    }
}

export class SigninvoiceResponse extends jspb.Message { 
    getBolt11(): string;
    setBolt11(value: string): SigninvoiceResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): SigninvoiceResponse.AsObject;
    static toObject(includeInstance: boolean, msg: SigninvoiceResponse): SigninvoiceResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: SigninvoiceResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): SigninvoiceResponse;
    static deserializeBinaryFromReader(message: SigninvoiceResponse, reader: jspb.BinaryReader): SigninvoiceResponse;
}

export namespace SigninvoiceResponse {
    export type AsObject = {
        bolt11: string,
    }
}

export class SignmessageRequest extends jspb.Message { 
    getMessage(): string;
    setMessage(value: string): SignmessageRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): SignmessageRequest.AsObject;
    static toObject(includeInstance: boolean, msg: SignmessageRequest): SignmessageRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: SignmessageRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): SignmessageRequest;
    static deserializeBinaryFromReader(message: SignmessageRequest, reader: jspb.BinaryReader): SignmessageRequest;
}

export namespace SignmessageRequest {
    export type AsObject = {
        message: string,
    }
}

export class SignmessageResponse extends jspb.Message { 
    getSignature(): Uint8Array | string;
    getSignature_asU8(): Uint8Array;
    getSignature_asB64(): string;
    setSignature(value: Uint8Array | string): SignmessageResponse;
    getRecid(): Uint8Array | string;
    getRecid_asU8(): Uint8Array;
    getRecid_asB64(): string;
    setRecid(value: Uint8Array | string): SignmessageResponse;
    getZbase(): string;
    setZbase(value: string): SignmessageResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): SignmessageResponse.AsObject;
    static toObject(includeInstance: boolean, msg: SignmessageResponse): SignmessageResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: SignmessageResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): SignmessageResponse;
    static deserializeBinaryFromReader(message: SignmessageResponse, reader: jspb.BinaryReader): SignmessageResponse;
}

export namespace SignmessageResponse {
    export type AsObject = {
        signature: Uint8Array | string,
        recid: Uint8Array | string,
        zbase: string,
    }
}

export class Splice_initRequest extends jspb.Message { 
    getChannelId(): Uint8Array | string;
    getChannelId_asU8(): Uint8Array;
    getChannelId_asB64(): string;
    setChannelId(value: Uint8Array | string): Splice_initRequest;
    getRelativeAmount(): number;
    setRelativeAmount(value: number): Splice_initRequest;

    hasInitialpsbt(): boolean;
    clearInitialpsbt(): void;
    getInitialpsbt(): string | undefined;
    setInitialpsbt(value: string): Splice_initRequest;

    hasFeeratePerKw(): boolean;
    clearFeeratePerKw(): void;
    getFeeratePerKw(): number | undefined;
    setFeeratePerKw(value: number): Splice_initRequest;

    hasForceFeerate(): boolean;
    clearForceFeerate(): void;
    getForceFeerate(): boolean | undefined;
    setForceFeerate(value: boolean): Splice_initRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): Splice_initRequest.AsObject;
    static toObject(includeInstance: boolean, msg: Splice_initRequest): Splice_initRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: Splice_initRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): Splice_initRequest;
    static deserializeBinaryFromReader(message: Splice_initRequest, reader: jspb.BinaryReader): Splice_initRequest;
}

export namespace Splice_initRequest {
    export type AsObject = {
        channelId: Uint8Array | string,
        relativeAmount: number,
        initialpsbt?: string,
        feeratePerKw?: number,
        forceFeerate?: boolean,
    }
}

export class Splice_initResponse extends jspb.Message { 
    getPsbt(): string;
    setPsbt(value: string): Splice_initResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): Splice_initResponse.AsObject;
    static toObject(includeInstance: boolean, msg: Splice_initResponse): Splice_initResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: Splice_initResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): Splice_initResponse;
    static deserializeBinaryFromReader(message: Splice_initResponse, reader: jspb.BinaryReader): Splice_initResponse;
}

export namespace Splice_initResponse {
    export type AsObject = {
        psbt: string,
    }
}

export class Splice_signedRequest extends jspb.Message { 
    getChannelId(): Uint8Array | string;
    getChannelId_asU8(): Uint8Array;
    getChannelId_asB64(): string;
    setChannelId(value: Uint8Array | string): Splice_signedRequest;
    getPsbt(): string;
    setPsbt(value: string): Splice_signedRequest;

    hasSignFirst(): boolean;
    clearSignFirst(): void;
    getSignFirst(): boolean | undefined;
    setSignFirst(value: boolean): Splice_signedRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): Splice_signedRequest.AsObject;
    static toObject(includeInstance: boolean, msg: Splice_signedRequest): Splice_signedRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: Splice_signedRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): Splice_signedRequest;
    static deserializeBinaryFromReader(message: Splice_signedRequest, reader: jspb.BinaryReader): Splice_signedRequest;
}

export namespace Splice_signedRequest {
    export type AsObject = {
        channelId: Uint8Array | string,
        psbt: string,
        signFirst?: boolean,
    }
}

export class Splice_signedResponse extends jspb.Message { 
    getTx(): Uint8Array | string;
    getTx_asU8(): Uint8Array;
    getTx_asB64(): string;
    setTx(value: Uint8Array | string): Splice_signedResponse;
    getTxid(): Uint8Array | string;
    getTxid_asU8(): Uint8Array;
    getTxid_asB64(): string;
    setTxid(value: Uint8Array | string): Splice_signedResponse;

    hasOutnum(): boolean;
    clearOutnum(): void;
    getOutnum(): number | undefined;
    setOutnum(value: number): Splice_signedResponse;
    getPsbt(): string;
    setPsbt(value: string): Splice_signedResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): Splice_signedResponse.AsObject;
    static toObject(includeInstance: boolean, msg: Splice_signedResponse): Splice_signedResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: Splice_signedResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): Splice_signedResponse;
    static deserializeBinaryFromReader(message: Splice_signedResponse, reader: jspb.BinaryReader): Splice_signedResponse;
}

export namespace Splice_signedResponse {
    export type AsObject = {
        tx: Uint8Array | string,
        txid: Uint8Array | string,
        outnum?: number,
        psbt: string,
    }
}

export class Splice_updateRequest extends jspb.Message { 
    getChannelId(): Uint8Array | string;
    getChannelId_asU8(): Uint8Array;
    getChannelId_asB64(): string;
    setChannelId(value: Uint8Array | string): Splice_updateRequest;
    getPsbt(): string;
    setPsbt(value: string): Splice_updateRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): Splice_updateRequest.AsObject;
    static toObject(includeInstance: boolean, msg: Splice_updateRequest): Splice_updateRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: Splice_updateRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): Splice_updateRequest;
    static deserializeBinaryFromReader(message: Splice_updateRequest, reader: jspb.BinaryReader): Splice_updateRequest;
}

export namespace Splice_updateRequest {
    export type AsObject = {
        channelId: Uint8Array | string,
        psbt: string,
    }
}

export class Splice_updateResponse extends jspb.Message { 
    getPsbt(): string;
    setPsbt(value: string): Splice_updateResponse;
    getCommitmentsSecured(): boolean;
    setCommitmentsSecured(value: boolean): Splice_updateResponse;

    hasSignaturesSecured(): boolean;
    clearSignaturesSecured(): void;
    getSignaturesSecured(): boolean | undefined;
    setSignaturesSecured(value: boolean): Splice_updateResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): Splice_updateResponse.AsObject;
    static toObject(includeInstance: boolean, msg: Splice_updateResponse): Splice_updateResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: Splice_updateResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): Splice_updateResponse;
    static deserializeBinaryFromReader(message: Splice_updateResponse, reader: jspb.BinaryReader): Splice_updateResponse;
}

export namespace Splice_updateResponse {
    export type AsObject = {
        psbt: string,
        commitmentsSecured: boolean,
        signaturesSecured?: boolean,
    }
}

export class DevspliceRequest extends jspb.Message { 
    getScriptOrJson(): string;
    setScriptOrJson(value: string): DevspliceRequest;

    hasDryrun(): boolean;
    clearDryrun(): void;
    getDryrun(): boolean | undefined;
    setDryrun(value: boolean): DevspliceRequest;

    hasForceFeerate(): boolean;
    clearForceFeerate(): void;
    getForceFeerate(): boolean | undefined;
    setForceFeerate(value: boolean): DevspliceRequest;

    hasDebugLog(): boolean;
    clearDebugLog(): void;
    getDebugLog(): boolean | undefined;
    setDebugLog(value: boolean): DevspliceRequest;

    hasDevWetrun(): boolean;
    clearDevWetrun(): void;
    getDevWetrun(): boolean | undefined;
    setDevWetrun(value: boolean): DevspliceRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): DevspliceRequest.AsObject;
    static toObject(includeInstance: boolean, msg: DevspliceRequest): DevspliceRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: DevspliceRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): DevspliceRequest;
    static deserializeBinaryFromReader(message: DevspliceRequest, reader: jspb.BinaryReader): DevspliceRequest;
}

export namespace DevspliceRequest {
    export type AsObject = {
        scriptOrJson: string,
        dryrun?: boolean,
        forceFeerate?: boolean,
        debugLog?: boolean,
        devWetrun?: boolean,
    }
}

export class DevspliceResponse extends jspb.Message { 
    clearDryrunList(): void;
    getDryrunList(): Array<string>;
    setDryrunList(value: Array<string>): DevspliceResponse;
    addDryrun(value: string, index?: number): string;

    hasPsbt(): boolean;
    clearPsbt(): void;
    getPsbt(): string | undefined;
    setPsbt(value: string): DevspliceResponse;

    hasTx(): boolean;
    clearTx(): void;
    getTx(): string | undefined;
    setTx(value: string): DevspliceResponse;

    hasTxid(): boolean;
    clearTxid(): void;
    getTxid(): string | undefined;
    setTxid(value: string): DevspliceResponse;
    clearLogList(): void;
    getLogList(): Array<string>;
    setLogList(value: Array<string>): DevspliceResponse;
    addLog(value: string, index?: number): string;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): DevspliceResponse.AsObject;
    static toObject(includeInstance: boolean, msg: DevspliceResponse): DevspliceResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: DevspliceResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): DevspliceResponse;
    static deserializeBinaryFromReader(message: DevspliceResponse, reader: jspb.BinaryReader): DevspliceResponse;
}

export namespace DevspliceResponse {
    export type AsObject = {
        dryrunList: Array<string>,
        psbt?: string,
        tx?: string,
        txid?: string,
        logList: Array<string>,
    }
}

export class UnreserveinputsRequest extends jspb.Message { 
    getPsbt(): string;
    setPsbt(value: string): UnreserveinputsRequest;

    hasReserve(): boolean;
    clearReserve(): void;
    getReserve(): number | undefined;
    setReserve(value: number): UnreserveinputsRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): UnreserveinputsRequest.AsObject;
    static toObject(includeInstance: boolean, msg: UnreserveinputsRequest): UnreserveinputsRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: UnreserveinputsRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): UnreserveinputsRequest;
    static deserializeBinaryFromReader(message: UnreserveinputsRequest, reader: jspb.BinaryReader): UnreserveinputsRequest;
}

export namespace UnreserveinputsRequest {
    export type AsObject = {
        psbt: string,
        reserve?: number,
    }
}

export class UnreserveinputsResponse extends jspb.Message { 
    clearReservationsList(): void;
    getReservationsList(): Array<UnreserveinputsReservations>;
    setReservationsList(value: Array<UnreserveinputsReservations>): UnreserveinputsResponse;
    addReservations(value?: UnreserveinputsReservations, index?: number): UnreserveinputsReservations;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): UnreserveinputsResponse.AsObject;
    static toObject(includeInstance: boolean, msg: UnreserveinputsResponse): UnreserveinputsResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: UnreserveinputsResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): UnreserveinputsResponse;
    static deserializeBinaryFromReader(message: UnreserveinputsResponse, reader: jspb.BinaryReader): UnreserveinputsResponse;
}

export namespace UnreserveinputsResponse {
    export type AsObject = {
        reservationsList: Array<UnreserveinputsReservations.AsObject>,
    }
}

export class UnreserveinputsReservations extends jspb.Message { 
    getTxid(): Uint8Array | string;
    getTxid_asU8(): Uint8Array;
    getTxid_asB64(): string;
    setTxid(value: Uint8Array | string): UnreserveinputsReservations;
    getVout(): number;
    setVout(value: number): UnreserveinputsReservations;
    getWasReserved(): boolean;
    setWasReserved(value: boolean): UnreserveinputsReservations;
    getReserved(): boolean;
    setReserved(value: boolean): UnreserveinputsReservations;

    hasReservedToBlock(): boolean;
    clearReservedToBlock(): void;
    getReservedToBlock(): number | undefined;
    setReservedToBlock(value: number): UnreserveinputsReservations;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): UnreserveinputsReservations.AsObject;
    static toObject(includeInstance: boolean, msg: UnreserveinputsReservations): UnreserveinputsReservations.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: UnreserveinputsReservations, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): UnreserveinputsReservations;
    static deserializeBinaryFromReader(message: UnreserveinputsReservations, reader: jspb.BinaryReader): UnreserveinputsReservations;
}

export namespace UnreserveinputsReservations {
    export type AsObject = {
        txid: Uint8Array | string,
        vout: number,
        wasReserved: boolean,
        reserved: boolean,
        reservedToBlock?: number,
    }
}

export class UpgradewalletRequest extends jspb.Message { 

    hasFeerate(): boolean;
    clearFeerate(): void;
    getFeerate(): cln_primitives_pb.Feerate | undefined;
    setFeerate(value?: cln_primitives_pb.Feerate): UpgradewalletRequest;

    hasReservedok(): boolean;
    clearReservedok(): void;
    getReservedok(): boolean | undefined;
    setReservedok(value: boolean): UpgradewalletRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): UpgradewalletRequest.AsObject;
    static toObject(includeInstance: boolean, msg: UpgradewalletRequest): UpgradewalletRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: UpgradewalletRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): UpgradewalletRequest;
    static deserializeBinaryFromReader(message: UpgradewalletRequest, reader: jspb.BinaryReader): UpgradewalletRequest;
}

export namespace UpgradewalletRequest {
    export type AsObject = {
        feerate?: cln_primitives_pb.Feerate.AsObject,
        reservedok?: boolean,
    }
}

export class UpgradewalletResponse extends jspb.Message { 

    hasUpgradedOuts(): boolean;
    clearUpgradedOuts(): void;
    getUpgradedOuts(): number | undefined;
    setUpgradedOuts(value: number): UpgradewalletResponse;

    hasPsbt(): boolean;
    clearPsbt(): void;
    getPsbt(): string | undefined;
    setPsbt(value: string): UpgradewalletResponse;

    hasTx(): boolean;
    clearTx(): void;
    getTx(): Uint8Array | string;
    getTx_asU8(): Uint8Array;
    getTx_asB64(): string;
    setTx(value: Uint8Array | string): UpgradewalletResponse;

    hasTxid(): boolean;
    clearTxid(): void;
    getTxid(): Uint8Array | string;
    getTxid_asU8(): Uint8Array;
    getTxid_asB64(): string;
    setTxid(value: Uint8Array | string): UpgradewalletResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): UpgradewalletResponse.AsObject;
    static toObject(includeInstance: boolean, msg: UpgradewalletResponse): UpgradewalletResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: UpgradewalletResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): UpgradewalletResponse;
    static deserializeBinaryFromReader(message: UpgradewalletResponse, reader: jspb.BinaryReader): UpgradewalletResponse;
}

export namespace UpgradewalletResponse {
    export type AsObject = {
        upgradedOuts?: number,
        psbt?: string,
        tx: Uint8Array | string,
        txid: Uint8Array | string,
    }
}

export class WaitblockheightRequest extends jspb.Message { 
    getBlockheight(): number;
    setBlockheight(value: number): WaitblockheightRequest;

    hasTimeout(): boolean;
    clearTimeout(): void;
    getTimeout(): number | undefined;
    setTimeout(value: number): WaitblockheightRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): WaitblockheightRequest.AsObject;
    static toObject(includeInstance: boolean, msg: WaitblockheightRequest): WaitblockheightRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: WaitblockheightRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): WaitblockheightRequest;
    static deserializeBinaryFromReader(message: WaitblockheightRequest, reader: jspb.BinaryReader): WaitblockheightRequest;
}

export namespace WaitblockheightRequest {
    export type AsObject = {
        blockheight: number,
        timeout?: number,
    }
}

export class WaitblockheightResponse extends jspb.Message { 
    getBlockheight(): number;
    setBlockheight(value: number): WaitblockheightResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): WaitblockheightResponse.AsObject;
    static toObject(includeInstance: boolean, msg: WaitblockheightResponse): WaitblockheightResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: WaitblockheightResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): WaitblockheightResponse;
    static deserializeBinaryFromReader(message: WaitblockheightResponse, reader: jspb.BinaryReader): WaitblockheightResponse;
}

export namespace WaitblockheightResponse {
    export type AsObject = {
        blockheight: number,
    }
}

export class WaitRequest extends jspb.Message { 
    getSubsystem(): WaitRequest.WaitSubsystem;
    setSubsystem(value: WaitRequest.WaitSubsystem): WaitRequest;
    getIndexname(): WaitRequest.WaitIndexname;
    setIndexname(value: WaitRequest.WaitIndexname): WaitRequest;
    getNextvalue(): number;
    setNextvalue(value: number): WaitRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): WaitRequest.AsObject;
    static toObject(includeInstance: boolean, msg: WaitRequest): WaitRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: WaitRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): WaitRequest;
    static deserializeBinaryFromReader(message: WaitRequest, reader: jspb.BinaryReader): WaitRequest;
}

export namespace WaitRequest {
    export type AsObject = {
        subsystem: WaitRequest.WaitSubsystem,
        indexname: WaitRequest.WaitIndexname,
        nextvalue: number,
    }

    export enum WaitSubsystem {
    INVOICES = 0,
    FORWARDS = 1,
    SENDPAYS = 2,
    }

    export enum WaitIndexname {
    CREATED = 0,
    UPDATED = 1,
    DELETED = 2,
    }

}

export class WaitResponse extends jspb.Message { 
    getSubsystem(): WaitResponse.WaitSubsystem;
    setSubsystem(value: WaitResponse.WaitSubsystem): WaitResponse;

    hasCreated(): boolean;
    clearCreated(): void;
    getCreated(): number | undefined;
    setCreated(value: number): WaitResponse;

    hasUpdated(): boolean;
    clearUpdated(): void;
    getUpdated(): number | undefined;
    setUpdated(value: number): WaitResponse;

    hasDeleted(): boolean;
    clearDeleted(): void;
    getDeleted(): number | undefined;
    setDeleted(value: number): WaitResponse;

    hasDetails(): boolean;
    clearDetails(): void;
    getDetails(): WaitDetails | undefined;
    setDetails(value?: WaitDetails): WaitResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): WaitResponse.AsObject;
    static toObject(includeInstance: boolean, msg: WaitResponse): WaitResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: WaitResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): WaitResponse;
    static deserializeBinaryFromReader(message: WaitResponse, reader: jspb.BinaryReader): WaitResponse;
}

export namespace WaitResponse {
    export type AsObject = {
        subsystem: WaitResponse.WaitSubsystem,
        created?: number,
        updated?: number,
        deleted?: number,
        details?: WaitDetails.AsObject,
    }

    export enum WaitSubsystem {
    INVOICES = 0,
    FORWARDS = 1,
    SENDPAYS = 2,
    }

}

export class WaitDetails extends jspb.Message { 

    hasStatus(): boolean;
    clearStatus(): void;
    getStatus(): WaitDetails.WaitDetailsStatus | undefined;
    setStatus(value: WaitDetails.WaitDetailsStatus): WaitDetails;

    hasLabel(): boolean;
    clearLabel(): void;
    getLabel(): string | undefined;
    setLabel(value: string): WaitDetails;

    hasDescription(): boolean;
    clearDescription(): void;
    getDescription(): string | undefined;
    setDescription(value: string): WaitDetails;

    hasBolt11(): boolean;
    clearBolt11(): void;
    getBolt11(): string | undefined;
    setBolt11(value: string): WaitDetails;

    hasBolt12(): boolean;
    clearBolt12(): void;
    getBolt12(): string | undefined;
    setBolt12(value: string): WaitDetails;

    hasPartid(): boolean;
    clearPartid(): void;
    getPartid(): number | undefined;
    setPartid(value: number): WaitDetails;

    hasGroupid(): boolean;
    clearGroupid(): void;
    getGroupid(): number | undefined;
    setGroupid(value: number): WaitDetails;

    hasPaymentHash(): boolean;
    clearPaymentHash(): void;
    getPaymentHash(): Uint8Array | string;
    getPaymentHash_asU8(): Uint8Array;
    getPaymentHash_asB64(): string;
    setPaymentHash(value: Uint8Array | string): WaitDetails;

    hasInChannel(): boolean;
    clearInChannel(): void;
    getInChannel(): string | undefined;
    setInChannel(value: string): WaitDetails;

    hasInHtlcId(): boolean;
    clearInHtlcId(): void;
    getInHtlcId(): number | undefined;
    setInHtlcId(value: number): WaitDetails;

    hasInMsat(): boolean;
    clearInMsat(): void;
    getInMsat(): cln_primitives_pb.Amount | undefined;
    setInMsat(value?: cln_primitives_pb.Amount): WaitDetails;

    hasOutChannel(): boolean;
    clearOutChannel(): void;
    getOutChannel(): string | undefined;
    setOutChannel(value: string): WaitDetails;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): WaitDetails.AsObject;
    static toObject(includeInstance: boolean, msg: WaitDetails): WaitDetails.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: WaitDetails, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): WaitDetails;
    static deserializeBinaryFromReader(message: WaitDetails, reader: jspb.BinaryReader): WaitDetails;
}

export namespace WaitDetails {
    export type AsObject = {
        status?: WaitDetails.WaitDetailsStatus,
        label?: string,
        description?: string,
        bolt11?: string,
        bolt12?: string,
        partid?: number,
        groupid?: number,
        paymentHash: Uint8Array | string,
        inChannel?: string,
        inHtlcId?: number,
        inMsat?: cln_primitives_pb.Amount.AsObject,
        outChannel?: string,
    }

    export enum WaitDetailsStatus {
    UNPAID = 0,
    PAID = 1,
    EXPIRED = 2,
    PENDING = 3,
    FAILED = 4,
    COMPLETE = 5,
    OFFERED = 6,
    SETTLED = 7,
    LOCAL_FAILED = 8,
    }

}

export class ListconfigsRequest extends jspb.Message { 

    hasConfig(): boolean;
    clearConfig(): void;
    getConfig(): string | undefined;
    setConfig(value: string): ListconfigsRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ListconfigsRequest.AsObject;
    static toObject(includeInstance: boolean, msg: ListconfigsRequest): ListconfigsRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ListconfigsRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ListconfigsRequest;
    static deserializeBinaryFromReader(message: ListconfigsRequest, reader: jspb.BinaryReader): ListconfigsRequest;
}

export namespace ListconfigsRequest {
    export type AsObject = {
        config?: string,
    }
}

export class ListconfigsResponse extends jspb.Message { 

    hasConfigs(): boolean;
    clearConfigs(): void;
    getConfigs(): ListconfigsConfigs | undefined;
    setConfigs(value?: ListconfigsConfigs): ListconfigsResponse;
    clearPluginsList(): void;
    getPluginsList(): Array<ListconfigsPlugins>;
    setPluginsList(value: Array<ListconfigsPlugins>): ListconfigsResponse;
    addPlugins(value?: ListconfigsPlugins, index?: number): ListconfigsPlugins;
    clearImportantPluginsList(): void;
    getImportantPluginsList(): Array<ListconfigsImportantplugins>;
    setImportantPluginsList(value: Array<ListconfigsImportantplugins>): ListconfigsResponse;
    addImportantPlugins(value?: ListconfigsImportantplugins, index?: number): ListconfigsImportantplugins;

    hasConf(): boolean;
    clearConf(): void;
    getConf(): string | undefined;
    setConf(value: string): ListconfigsResponse;

    hasLightningDir(): boolean;
    clearLightningDir(): void;
    getLightningDir(): string | undefined;
    setLightningDir(value: string): ListconfigsResponse;

    hasNetwork(): boolean;
    clearNetwork(): void;
    getNetwork(): string | undefined;
    setNetwork(value: string): ListconfigsResponse;

    hasAllowDeprecatedApis(): boolean;
    clearAllowDeprecatedApis(): void;
    getAllowDeprecatedApis(): boolean | undefined;
    setAllowDeprecatedApis(value: boolean): ListconfigsResponse;

    hasRpcFile(): boolean;
    clearRpcFile(): void;
    getRpcFile(): string | undefined;
    setRpcFile(value: string): ListconfigsResponse;
    clearDisablePluginList(): void;
    getDisablePluginList(): Array<string>;
    setDisablePluginList(value: Array<string>): ListconfigsResponse;
    addDisablePlugin(value: string, index?: number): string;

    hasBookkeeperDir(): boolean;
    clearBookkeeperDir(): void;
    getBookkeeperDir(): string | undefined;
    setBookkeeperDir(value: string): ListconfigsResponse;

    hasBookkeeperDb(): boolean;
    clearBookkeeperDb(): void;
    getBookkeeperDb(): string | undefined;
    setBookkeeperDb(value: string): ListconfigsResponse;

    hasAlwaysUseProxy(): boolean;
    clearAlwaysUseProxy(): void;
    getAlwaysUseProxy(): boolean | undefined;
    setAlwaysUseProxy(value: boolean): ListconfigsResponse;

    hasDaemon(): boolean;
    clearDaemon(): void;
    getDaemon(): boolean | undefined;
    setDaemon(value: boolean): ListconfigsResponse;

    hasWallet(): boolean;
    clearWallet(): void;
    getWallet(): string | undefined;
    setWallet(value: string): ListconfigsResponse;

    hasLargeChannels(): boolean;
    clearLargeChannels(): void;
    getLargeChannels(): boolean | undefined;
    setLargeChannels(value: boolean): ListconfigsResponse;

    hasExperimentalDualFund(): boolean;
    clearExperimentalDualFund(): void;
    getExperimentalDualFund(): boolean | undefined;
    setExperimentalDualFund(value: boolean): ListconfigsResponse;

    hasExperimentalSplicing(): boolean;
    clearExperimentalSplicing(): void;
    getExperimentalSplicing(): boolean | undefined;
    setExperimentalSplicing(value: boolean): ListconfigsResponse;

    hasExperimentalOnionMessages(): boolean;
    clearExperimentalOnionMessages(): void;
    getExperimentalOnionMessages(): boolean | undefined;
    setExperimentalOnionMessages(value: boolean): ListconfigsResponse;

    hasExperimentalOffers(): boolean;
    clearExperimentalOffers(): void;
    getExperimentalOffers(): boolean | undefined;
    setExperimentalOffers(value: boolean): ListconfigsResponse;

    hasExperimentalShutdownWrongFunding(): boolean;
    clearExperimentalShutdownWrongFunding(): void;
    getExperimentalShutdownWrongFunding(): boolean | undefined;
    setExperimentalShutdownWrongFunding(value: boolean): ListconfigsResponse;

    hasExperimentalPeerStorage(): boolean;
    clearExperimentalPeerStorage(): void;
    getExperimentalPeerStorage(): boolean | undefined;
    setExperimentalPeerStorage(value: boolean): ListconfigsResponse;

    hasExperimentalQuiesce(): boolean;
    clearExperimentalQuiesce(): void;
    getExperimentalQuiesce(): boolean | undefined;
    setExperimentalQuiesce(value: boolean): ListconfigsResponse;

    hasExperimentalUpgradeProtocol(): boolean;
    clearExperimentalUpgradeProtocol(): void;
    getExperimentalUpgradeProtocol(): boolean | undefined;
    setExperimentalUpgradeProtocol(value: boolean): ListconfigsResponse;

    hasInvoicesOnchainFallback(): boolean;
    clearInvoicesOnchainFallback(): void;
    getInvoicesOnchainFallback(): boolean | undefined;
    setInvoicesOnchainFallback(value: boolean): ListconfigsResponse;

    hasDatabaseUpgrade(): boolean;
    clearDatabaseUpgrade(): void;
    getDatabaseUpgrade(): boolean | undefined;
    setDatabaseUpgrade(value: boolean): ListconfigsResponse;

    hasRgb(): boolean;
    clearRgb(): void;
    getRgb(): Uint8Array | string;
    getRgb_asU8(): Uint8Array;
    getRgb_asB64(): string;
    setRgb(value: Uint8Array | string): ListconfigsResponse;

    hasAlias(): boolean;
    clearAlias(): void;
    getAlias(): string | undefined;
    setAlias(value: string): ListconfigsResponse;

    hasPidFile(): boolean;
    clearPidFile(): void;
    getPidFile(): string | undefined;
    setPidFile(value: string): ListconfigsResponse;

    hasIgnoreFeeLimits(): boolean;
    clearIgnoreFeeLimits(): void;
    getIgnoreFeeLimits(): boolean | undefined;
    setIgnoreFeeLimits(value: boolean): ListconfigsResponse;

    hasWatchtimeBlocks(): boolean;
    clearWatchtimeBlocks(): void;
    getWatchtimeBlocks(): number | undefined;
    setWatchtimeBlocks(value: number): ListconfigsResponse;

    hasMaxLocktimeBlocks(): boolean;
    clearMaxLocktimeBlocks(): void;
    getMaxLocktimeBlocks(): number | undefined;
    setMaxLocktimeBlocks(value: number): ListconfigsResponse;

    hasFundingConfirms(): boolean;
    clearFundingConfirms(): void;
    getFundingConfirms(): number | undefined;
    setFundingConfirms(value: number): ListconfigsResponse;

    hasCltvDelta(): boolean;
    clearCltvDelta(): void;
    getCltvDelta(): number | undefined;
    setCltvDelta(value: number): ListconfigsResponse;

    hasCltvFinal(): boolean;
    clearCltvFinal(): void;
    getCltvFinal(): number | undefined;
    setCltvFinal(value: number): ListconfigsResponse;

    hasCommitTime(): boolean;
    clearCommitTime(): void;
    getCommitTime(): number | undefined;
    setCommitTime(value: number): ListconfigsResponse;

    hasFeeBase(): boolean;
    clearFeeBase(): void;
    getFeeBase(): number | undefined;
    setFeeBase(value: number): ListconfigsResponse;

    hasRescan(): boolean;
    clearRescan(): void;
    getRescan(): number | undefined;
    setRescan(value: number): ListconfigsResponse;

    hasFeePerSatoshi(): boolean;
    clearFeePerSatoshi(): void;
    getFeePerSatoshi(): number | undefined;
    setFeePerSatoshi(value: number): ListconfigsResponse;

    hasMaxConcurrentHtlcs(): boolean;
    clearMaxConcurrentHtlcs(): void;
    getMaxConcurrentHtlcs(): number | undefined;
    setMaxConcurrentHtlcs(value: number): ListconfigsResponse;

    hasHtlcMinimumMsat(): boolean;
    clearHtlcMinimumMsat(): void;
    getHtlcMinimumMsat(): cln_primitives_pb.Amount | undefined;
    setHtlcMinimumMsat(value?: cln_primitives_pb.Amount): ListconfigsResponse;

    hasHtlcMaximumMsat(): boolean;
    clearHtlcMaximumMsat(): void;
    getHtlcMaximumMsat(): cln_primitives_pb.Amount | undefined;
    setHtlcMaximumMsat(value?: cln_primitives_pb.Amount): ListconfigsResponse;

    hasMaxDustHtlcExposureMsat(): boolean;
    clearMaxDustHtlcExposureMsat(): void;
    getMaxDustHtlcExposureMsat(): cln_primitives_pb.Amount | undefined;
    setMaxDustHtlcExposureMsat(value?: cln_primitives_pb.Amount): ListconfigsResponse;

    hasMinCapacitySat(): boolean;
    clearMinCapacitySat(): void;
    getMinCapacitySat(): number | undefined;
    setMinCapacitySat(value: number): ListconfigsResponse;

    hasAddr(): boolean;
    clearAddr(): void;
    getAddr(): string | undefined;
    setAddr(value: string): ListconfigsResponse;

    hasAnnounceAddr(): boolean;
    clearAnnounceAddr(): void;
    getAnnounceAddr(): string | undefined;
    setAnnounceAddr(value: string): ListconfigsResponse;

    hasBindAddr(): boolean;
    clearBindAddr(): void;
    getBindAddr(): string | undefined;
    setBindAddr(value: string): ListconfigsResponse;

    hasOffline(): boolean;
    clearOffline(): void;
    getOffline(): boolean | undefined;
    setOffline(value: boolean): ListconfigsResponse;

    hasAutolisten(): boolean;
    clearAutolisten(): void;
    getAutolisten(): boolean | undefined;
    setAutolisten(value: boolean): ListconfigsResponse;

    hasProxy(): boolean;
    clearProxy(): void;
    getProxy(): string | undefined;
    setProxy(value: string): ListconfigsResponse;

    hasDisableDns(): boolean;
    clearDisableDns(): void;
    getDisableDns(): boolean | undefined;
    setDisableDns(value: boolean): ListconfigsResponse;

    hasAnnounceAddrDiscovered(): boolean;
    clearAnnounceAddrDiscovered(): void;
    getAnnounceAddrDiscovered(): string | undefined;
    setAnnounceAddrDiscovered(value: string): ListconfigsResponse;

    hasAnnounceAddrDiscoveredPort(): boolean;
    clearAnnounceAddrDiscoveredPort(): void;
    getAnnounceAddrDiscoveredPort(): number | undefined;
    setAnnounceAddrDiscoveredPort(value: number): ListconfigsResponse;

    hasEncryptedHsm(): boolean;
    clearEncryptedHsm(): void;
    getEncryptedHsm(): boolean | undefined;
    setEncryptedHsm(value: boolean): ListconfigsResponse;

    hasRpcFileMode(): boolean;
    clearRpcFileMode(): void;
    getRpcFileMode(): string | undefined;
    setRpcFileMode(value: string): ListconfigsResponse;

    hasLogLevel(): boolean;
    clearLogLevel(): void;
    getLogLevel(): string | undefined;
    setLogLevel(value: string): ListconfigsResponse;

    hasLogPrefix(): boolean;
    clearLogPrefix(): void;
    getLogPrefix(): string | undefined;
    setLogPrefix(value: string): ListconfigsResponse;

    hasLogFile(): boolean;
    clearLogFile(): void;
    getLogFile(): string | undefined;
    setLogFile(value: string): ListconfigsResponse;

    hasLogTimestamps(): boolean;
    clearLogTimestamps(): void;
    getLogTimestamps(): boolean | undefined;
    setLogTimestamps(value: boolean): ListconfigsResponse;

    hasForceFeerates(): boolean;
    clearForceFeerates(): void;
    getForceFeerates(): string | undefined;
    setForceFeerates(value: string): ListconfigsResponse;

    hasSubdaemon(): boolean;
    clearSubdaemon(): void;
    getSubdaemon(): string | undefined;
    setSubdaemon(value: string): ListconfigsResponse;

    hasFetchinvoiceNoconnect(): boolean;
    clearFetchinvoiceNoconnect(): void;
    getFetchinvoiceNoconnect(): boolean | undefined;
    setFetchinvoiceNoconnect(value: boolean): ListconfigsResponse;

    hasAcceptHtlcTlvTypes(): boolean;
    clearAcceptHtlcTlvTypes(): void;
    getAcceptHtlcTlvTypes(): string | undefined;
    setAcceptHtlcTlvTypes(value: string): ListconfigsResponse;

    hasTorServicePassword(): boolean;
    clearTorServicePassword(): void;
    getTorServicePassword(): string | undefined;
    setTorServicePassword(value: string): ListconfigsResponse;

    hasDevAllowdustreserve(): boolean;
    clearDevAllowdustreserve(): void;
    getDevAllowdustreserve(): boolean | undefined;
    setDevAllowdustreserve(value: boolean): ListconfigsResponse;

    hasAnnounceAddrDns(): boolean;
    clearAnnounceAddrDns(): void;
    getAnnounceAddrDns(): boolean | undefined;
    setAnnounceAddrDns(value: boolean): ListconfigsResponse;

    hasRequireConfirmedInputs(): boolean;
    clearRequireConfirmedInputs(): void;
    getRequireConfirmedInputs(): boolean | undefined;
    setRequireConfirmedInputs(value: boolean): ListconfigsResponse;

    hasDeveloper(): boolean;
    clearDeveloper(): void;
    getDeveloper(): boolean | undefined;
    setDeveloper(value: boolean): ListconfigsResponse;

    hasCommitFee(): boolean;
    clearCommitFee(): void;
    getCommitFee(): number | undefined;
    setCommitFee(value: number): ListconfigsResponse;

    hasMinEmergencyMsat(): boolean;
    clearMinEmergencyMsat(): void;
    getMinEmergencyMsat(): cln_primitives_pb.Amount | undefined;
    setMinEmergencyMsat(value?: cln_primitives_pb.Amount): ListconfigsResponse;

    hasCommitFeerateOffset(): boolean;
    clearCommitFeerateOffset(): void;
    getCommitFeerateOffset(): number | undefined;
    setCommitFeerateOffset(value: number): ListconfigsResponse;

    hasAutoconnectSeekerPeers(): boolean;
    clearAutoconnectSeekerPeers(): void;
    getAutoconnectSeekerPeers(): number | undefined;
    setAutoconnectSeekerPeers(value: number): ListconfigsResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ListconfigsResponse.AsObject;
    static toObject(includeInstance: boolean, msg: ListconfigsResponse): ListconfigsResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ListconfigsResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ListconfigsResponse;
    static deserializeBinaryFromReader(message: ListconfigsResponse, reader: jspb.BinaryReader): ListconfigsResponse;
}

export namespace ListconfigsResponse {
    export type AsObject = {
        configs?: ListconfigsConfigs.AsObject,
        pluginsList: Array<ListconfigsPlugins.AsObject>,
        importantPluginsList: Array<ListconfigsImportantplugins.AsObject>,
        conf?: string,
        lightningDir?: string,
        network?: string,
        allowDeprecatedApis?: boolean,
        rpcFile?: string,
        disablePluginList: Array<string>,
        bookkeeperDir?: string,
        bookkeeperDb?: string,
        alwaysUseProxy?: boolean,
        daemon?: boolean,
        wallet?: string,
        largeChannels?: boolean,
        experimentalDualFund?: boolean,
        experimentalSplicing?: boolean,
        experimentalOnionMessages?: boolean,
        experimentalOffers?: boolean,
        experimentalShutdownWrongFunding?: boolean,
        experimentalPeerStorage?: boolean,
        experimentalQuiesce?: boolean,
        experimentalUpgradeProtocol?: boolean,
        invoicesOnchainFallback?: boolean,
        databaseUpgrade?: boolean,
        rgb: Uint8Array | string,
        alias?: string,
        pidFile?: string,
        ignoreFeeLimits?: boolean,
        watchtimeBlocks?: number,
        maxLocktimeBlocks?: number,
        fundingConfirms?: number,
        cltvDelta?: number,
        cltvFinal?: number,
        commitTime?: number,
        feeBase?: number,
        rescan?: number,
        feePerSatoshi?: number,
        maxConcurrentHtlcs?: number,
        htlcMinimumMsat?: cln_primitives_pb.Amount.AsObject,
        htlcMaximumMsat?: cln_primitives_pb.Amount.AsObject,
        maxDustHtlcExposureMsat?: cln_primitives_pb.Amount.AsObject,
        minCapacitySat?: number,
        addr?: string,
        announceAddr?: string,
        bindAddr?: string,
        offline?: boolean,
        autolisten?: boolean,
        proxy?: string,
        disableDns?: boolean,
        announceAddrDiscovered?: string,
        announceAddrDiscoveredPort?: number,
        encryptedHsm?: boolean,
        rpcFileMode?: string,
        logLevel?: string,
        logPrefix?: string,
        logFile?: string,
        logTimestamps?: boolean,
        forceFeerates?: string,
        subdaemon?: string,
        fetchinvoiceNoconnect?: boolean,
        acceptHtlcTlvTypes?: string,
        torServicePassword?: string,
        devAllowdustreserve?: boolean,
        announceAddrDns?: boolean,
        requireConfirmedInputs?: boolean,
        developer?: boolean,
        commitFee?: number,
        minEmergencyMsat?: cln_primitives_pb.Amount.AsObject,
        commitFeerateOffset?: number,
        autoconnectSeekerPeers?: number,
    }
}

export class ListconfigsConfigs extends jspb.Message { 

    hasConf(): boolean;
    clearConf(): void;
    getConf(): ListconfigsConfigsConf | undefined;
    setConf(value?: ListconfigsConfigsConf): ListconfigsConfigs;

    hasDeveloper(): boolean;
    clearDeveloper(): void;
    getDeveloper(): ListconfigsConfigsDeveloper | undefined;
    setDeveloper(value?: ListconfigsConfigsDeveloper): ListconfigsConfigs;

    hasClearPlugins(): boolean;
    clearClearPlugins(): void;
    getClearPlugins(): ListconfigsConfigsClearplugins | undefined;
    setClearPlugins(value?: ListconfigsConfigsClearplugins): ListconfigsConfigs;

    hasDisableMpp(): boolean;
    clearDisableMpp(): void;
    getDisableMpp(): ListconfigsConfigsDisablempp | undefined;
    setDisableMpp(value?: ListconfigsConfigsDisablempp): ListconfigsConfigs;

    hasMainnet(): boolean;
    clearMainnet(): void;
    getMainnet(): ListconfigsConfigsMainnet | undefined;
    setMainnet(value?: ListconfigsConfigsMainnet): ListconfigsConfigs;

    hasRegtest(): boolean;
    clearRegtest(): void;
    getRegtest(): ListconfigsConfigsRegtest | undefined;
    setRegtest(value?: ListconfigsConfigsRegtest): ListconfigsConfigs;

    hasSignet(): boolean;
    clearSignet(): void;
    getSignet(): ListconfigsConfigsSignet | undefined;
    setSignet(value?: ListconfigsConfigsSignet): ListconfigsConfigs;

    hasTestnet(): boolean;
    clearTestnet(): void;
    getTestnet(): ListconfigsConfigsTestnet | undefined;
    setTestnet(value?: ListconfigsConfigsTestnet): ListconfigsConfigs;

    hasImportantPlugin(): boolean;
    clearImportantPlugin(): void;
    getImportantPlugin(): ListconfigsConfigsImportantplugin | undefined;
    setImportantPlugin(value?: ListconfigsConfigsImportantplugin): ListconfigsConfigs;

    hasPlugin(): boolean;
    clearPlugin(): void;
    getPlugin(): ListconfigsConfigsPlugin | undefined;
    setPlugin(value?: ListconfigsConfigsPlugin): ListconfigsConfigs;

    hasPluginDir(): boolean;
    clearPluginDir(): void;
    getPluginDir(): ListconfigsConfigsPlugindir | undefined;
    setPluginDir(value?: ListconfigsConfigsPlugindir): ListconfigsConfigs;

    hasLightningDir(): boolean;
    clearLightningDir(): void;
    getLightningDir(): ListconfigsConfigsLightningdir | undefined;
    setLightningDir(value?: ListconfigsConfigsLightningdir): ListconfigsConfigs;

    hasNetwork(): boolean;
    clearNetwork(): void;
    getNetwork(): ListconfigsConfigsNetwork | undefined;
    setNetwork(value?: ListconfigsConfigsNetwork): ListconfigsConfigs;

    hasAllowDeprecatedApis(): boolean;
    clearAllowDeprecatedApis(): void;
    getAllowDeprecatedApis(): ListconfigsConfigsAllowdeprecatedapis | undefined;
    setAllowDeprecatedApis(value?: ListconfigsConfigsAllowdeprecatedapis): ListconfigsConfigs;

    hasRpcFile(): boolean;
    clearRpcFile(): void;
    getRpcFile(): ListconfigsConfigsRpcfile | undefined;
    setRpcFile(value?: ListconfigsConfigsRpcfile): ListconfigsConfigs;

    hasDisablePlugin(): boolean;
    clearDisablePlugin(): void;
    getDisablePlugin(): ListconfigsConfigsDisableplugin | undefined;
    setDisablePlugin(value?: ListconfigsConfigsDisableplugin): ListconfigsConfigs;

    hasAlwaysUseProxy(): boolean;
    clearAlwaysUseProxy(): void;
    getAlwaysUseProxy(): ListconfigsConfigsAlwaysuseproxy | undefined;
    setAlwaysUseProxy(value?: ListconfigsConfigsAlwaysuseproxy): ListconfigsConfigs;

    hasDaemon(): boolean;
    clearDaemon(): void;
    getDaemon(): ListconfigsConfigsDaemon | undefined;
    setDaemon(value?: ListconfigsConfigsDaemon): ListconfigsConfigs;

    hasWallet(): boolean;
    clearWallet(): void;
    getWallet(): ListconfigsConfigsWallet | undefined;
    setWallet(value?: ListconfigsConfigsWallet): ListconfigsConfigs;

    hasLargeChannels(): boolean;
    clearLargeChannels(): void;
    getLargeChannels(): ListconfigsConfigsLargechannels | undefined;
    setLargeChannels(value?: ListconfigsConfigsLargechannels): ListconfigsConfigs;

    hasExperimentalDualFund(): boolean;
    clearExperimentalDualFund(): void;
    getExperimentalDualFund(): ListconfigsConfigsExperimentaldualfund | undefined;
    setExperimentalDualFund(value?: ListconfigsConfigsExperimentaldualfund): ListconfigsConfigs;

    hasExperimentalSplicing(): boolean;
    clearExperimentalSplicing(): void;
    getExperimentalSplicing(): ListconfigsConfigsExperimentalsplicing | undefined;
    setExperimentalSplicing(value?: ListconfigsConfigsExperimentalsplicing): ListconfigsConfigs;

    hasExperimentalOnionMessages(): boolean;
    clearExperimentalOnionMessages(): void;
    getExperimentalOnionMessages(): ListconfigsConfigsExperimentalonionmessages | undefined;
    setExperimentalOnionMessages(value?: ListconfigsConfigsExperimentalonionmessages): ListconfigsConfigs;

    hasExperimentalOffers(): boolean;
    clearExperimentalOffers(): void;
    getExperimentalOffers(): ListconfigsConfigsExperimentaloffers | undefined;
    setExperimentalOffers(value?: ListconfigsConfigsExperimentaloffers): ListconfigsConfigs;

    hasExperimentalShutdownWrongFunding(): boolean;
    clearExperimentalShutdownWrongFunding(): void;
    getExperimentalShutdownWrongFunding(): ListconfigsConfigsExperimentalshutdownwrongfunding | undefined;
    setExperimentalShutdownWrongFunding(value?: ListconfigsConfigsExperimentalshutdownwrongfunding): ListconfigsConfigs;

    hasExperimentalPeerStorage(): boolean;
    clearExperimentalPeerStorage(): void;
    getExperimentalPeerStorage(): ListconfigsConfigsExperimentalpeerstorage | undefined;
    setExperimentalPeerStorage(value?: ListconfigsConfigsExperimentalpeerstorage): ListconfigsConfigs;

    hasExperimentalAnchors(): boolean;
    clearExperimentalAnchors(): void;
    getExperimentalAnchors(): ListconfigsConfigsExperimentalanchors | undefined;
    setExperimentalAnchors(value?: ListconfigsConfigsExperimentalanchors): ListconfigsConfigs;

    hasDatabaseUpgrade(): boolean;
    clearDatabaseUpgrade(): void;
    getDatabaseUpgrade(): ListconfigsConfigsDatabaseupgrade | undefined;
    setDatabaseUpgrade(value?: ListconfigsConfigsDatabaseupgrade): ListconfigsConfigs;

    hasRgb(): boolean;
    clearRgb(): void;
    getRgb(): ListconfigsConfigsRgb | undefined;
    setRgb(value?: ListconfigsConfigsRgb): ListconfigsConfigs;

    hasAlias(): boolean;
    clearAlias(): void;
    getAlias(): ListconfigsConfigsAlias | undefined;
    setAlias(value?: ListconfigsConfigsAlias): ListconfigsConfigs;

    hasPidFile(): boolean;
    clearPidFile(): void;
    getPidFile(): ListconfigsConfigsPidfile | undefined;
    setPidFile(value?: ListconfigsConfigsPidfile): ListconfigsConfigs;

    hasIgnoreFeeLimits(): boolean;
    clearIgnoreFeeLimits(): void;
    getIgnoreFeeLimits(): ListconfigsConfigsIgnorefeelimits | undefined;
    setIgnoreFeeLimits(value?: ListconfigsConfigsIgnorefeelimits): ListconfigsConfigs;

    hasWatchtimeBlocks(): boolean;
    clearWatchtimeBlocks(): void;
    getWatchtimeBlocks(): ListconfigsConfigsWatchtimeblocks | undefined;
    setWatchtimeBlocks(value?: ListconfigsConfigsWatchtimeblocks): ListconfigsConfigs;

    hasMaxLocktimeBlocks(): boolean;
    clearMaxLocktimeBlocks(): void;
    getMaxLocktimeBlocks(): ListconfigsConfigsMaxlocktimeblocks | undefined;
    setMaxLocktimeBlocks(value?: ListconfigsConfigsMaxlocktimeblocks): ListconfigsConfigs;

    hasFundingConfirms(): boolean;
    clearFundingConfirms(): void;
    getFundingConfirms(): ListconfigsConfigsFundingconfirms | undefined;
    setFundingConfirms(value?: ListconfigsConfigsFundingconfirms): ListconfigsConfigs;

    hasCltvDelta(): boolean;
    clearCltvDelta(): void;
    getCltvDelta(): ListconfigsConfigsCltvdelta | undefined;
    setCltvDelta(value?: ListconfigsConfigsCltvdelta): ListconfigsConfigs;

    hasCltvFinal(): boolean;
    clearCltvFinal(): void;
    getCltvFinal(): ListconfigsConfigsCltvfinal | undefined;
    setCltvFinal(value?: ListconfigsConfigsCltvfinal): ListconfigsConfigs;

    hasCommitTime(): boolean;
    clearCommitTime(): void;
    getCommitTime(): ListconfigsConfigsCommittime | undefined;
    setCommitTime(value?: ListconfigsConfigsCommittime): ListconfigsConfigs;

    hasFeeBase(): boolean;
    clearFeeBase(): void;
    getFeeBase(): ListconfigsConfigsFeebase | undefined;
    setFeeBase(value?: ListconfigsConfigsFeebase): ListconfigsConfigs;

    hasRescan(): boolean;
    clearRescan(): void;
    getRescan(): ListconfigsConfigsRescan | undefined;
    setRescan(value?: ListconfigsConfigsRescan): ListconfigsConfigs;

    hasFeePerSatoshi(): boolean;
    clearFeePerSatoshi(): void;
    getFeePerSatoshi(): ListconfigsConfigsFeepersatoshi | undefined;
    setFeePerSatoshi(value?: ListconfigsConfigsFeepersatoshi): ListconfigsConfigs;

    hasMaxConcurrentHtlcs(): boolean;
    clearMaxConcurrentHtlcs(): void;
    getMaxConcurrentHtlcs(): ListconfigsConfigsMaxconcurrenthtlcs | undefined;
    setMaxConcurrentHtlcs(value?: ListconfigsConfigsMaxconcurrenthtlcs): ListconfigsConfigs;

    hasHtlcMinimumMsat(): boolean;
    clearHtlcMinimumMsat(): void;
    getHtlcMinimumMsat(): ListconfigsConfigsHtlcminimummsat | undefined;
    setHtlcMinimumMsat(value?: ListconfigsConfigsHtlcminimummsat): ListconfigsConfigs;

    hasHtlcMaximumMsat(): boolean;
    clearHtlcMaximumMsat(): void;
    getHtlcMaximumMsat(): ListconfigsConfigsHtlcmaximummsat | undefined;
    setHtlcMaximumMsat(value?: ListconfigsConfigsHtlcmaximummsat): ListconfigsConfigs;

    hasMaxDustHtlcExposureMsat(): boolean;
    clearMaxDustHtlcExposureMsat(): void;
    getMaxDustHtlcExposureMsat(): ListconfigsConfigsMaxdusthtlcexposuremsat | undefined;
    setMaxDustHtlcExposureMsat(value?: ListconfigsConfigsMaxdusthtlcexposuremsat): ListconfigsConfigs;

    hasMinCapacitySat(): boolean;
    clearMinCapacitySat(): void;
    getMinCapacitySat(): ListconfigsConfigsMincapacitysat | undefined;
    setMinCapacitySat(value?: ListconfigsConfigsMincapacitysat): ListconfigsConfigs;

    hasAddr(): boolean;
    clearAddr(): void;
    getAddr(): ListconfigsConfigsAddr | undefined;
    setAddr(value?: ListconfigsConfigsAddr): ListconfigsConfigs;

    hasAnnounceAddr(): boolean;
    clearAnnounceAddr(): void;
    getAnnounceAddr(): ListconfigsConfigsAnnounceaddr | undefined;
    setAnnounceAddr(value?: ListconfigsConfigsAnnounceaddr): ListconfigsConfigs;

    hasBindAddr(): boolean;
    clearBindAddr(): void;
    getBindAddr(): ListconfigsConfigsBindaddr | undefined;
    setBindAddr(value?: ListconfigsConfigsBindaddr): ListconfigsConfigs;

    hasOffline(): boolean;
    clearOffline(): void;
    getOffline(): ListconfigsConfigsOffline | undefined;
    setOffline(value?: ListconfigsConfigsOffline): ListconfigsConfigs;

    hasAutolisten(): boolean;
    clearAutolisten(): void;
    getAutolisten(): ListconfigsConfigsAutolisten | undefined;
    setAutolisten(value?: ListconfigsConfigsAutolisten): ListconfigsConfigs;

    hasProxy(): boolean;
    clearProxy(): void;
    getProxy(): ListconfigsConfigsProxy | undefined;
    setProxy(value?: ListconfigsConfigsProxy): ListconfigsConfigs;

    hasDisableDns(): boolean;
    clearDisableDns(): void;
    getDisableDns(): ListconfigsConfigsDisabledns | undefined;
    setDisableDns(value?: ListconfigsConfigsDisabledns): ListconfigsConfigs;

    hasAnnounceAddrDiscovered(): boolean;
    clearAnnounceAddrDiscovered(): void;
    getAnnounceAddrDiscovered(): ListconfigsConfigsAnnounceaddrdiscovered | undefined;
    setAnnounceAddrDiscovered(value?: ListconfigsConfigsAnnounceaddrdiscovered): ListconfigsConfigs;

    hasAnnounceAddrDiscoveredPort(): boolean;
    clearAnnounceAddrDiscoveredPort(): void;
    getAnnounceAddrDiscoveredPort(): ListconfigsConfigsAnnounceaddrdiscoveredport | undefined;
    setAnnounceAddrDiscoveredPort(value?: ListconfigsConfigsAnnounceaddrdiscoveredport): ListconfigsConfigs;

    hasEncryptedHsm(): boolean;
    clearEncryptedHsm(): void;
    getEncryptedHsm(): ListconfigsConfigsEncryptedhsm | undefined;
    setEncryptedHsm(value?: ListconfigsConfigsEncryptedhsm): ListconfigsConfigs;

    hasRpcFileMode(): boolean;
    clearRpcFileMode(): void;
    getRpcFileMode(): ListconfigsConfigsRpcfilemode | undefined;
    setRpcFileMode(value?: ListconfigsConfigsRpcfilemode): ListconfigsConfigs;

    hasLogLevel(): boolean;
    clearLogLevel(): void;
    getLogLevel(): ListconfigsConfigsLoglevel | undefined;
    setLogLevel(value?: ListconfigsConfigsLoglevel): ListconfigsConfigs;

    hasLogPrefix(): boolean;
    clearLogPrefix(): void;
    getLogPrefix(): ListconfigsConfigsLogprefix | undefined;
    setLogPrefix(value?: ListconfigsConfigsLogprefix): ListconfigsConfigs;

    hasLogFile(): boolean;
    clearLogFile(): void;
    getLogFile(): ListconfigsConfigsLogfile | undefined;
    setLogFile(value?: ListconfigsConfigsLogfile): ListconfigsConfigs;

    hasLogTimestamps(): boolean;
    clearLogTimestamps(): void;
    getLogTimestamps(): ListconfigsConfigsLogtimestamps | undefined;
    setLogTimestamps(value?: ListconfigsConfigsLogtimestamps): ListconfigsConfigs;

    hasForceFeerates(): boolean;
    clearForceFeerates(): void;
    getForceFeerates(): ListconfigsConfigsForcefeerates | undefined;
    setForceFeerates(value?: ListconfigsConfigsForcefeerates): ListconfigsConfigs;

    hasSubdaemon(): boolean;
    clearSubdaemon(): void;
    getSubdaemon(): ListconfigsConfigsSubdaemon | undefined;
    setSubdaemon(value?: ListconfigsConfigsSubdaemon): ListconfigsConfigs;

    hasFetchinvoiceNoconnect(): boolean;
    clearFetchinvoiceNoconnect(): void;
    getFetchinvoiceNoconnect(): ListconfigsConfigsFetchinvoicenoconnect | undefined;
    setFetchinvoiceNoconnect(value?: ListconfigsConfigsFetchinvoicenoconnect): ListconfigsConfigs;

    hasAcceptHtlcTlvTypes(): boolean;
    clearAcceptHtlcTlvTypes(): void;
    getAcceptHtlcTlvTypes(): ListconfigsConfigsAccepthtlctlvtypes | undefined;
    setAcceptHtlcTlvTypes(value?: ListconfigsConfigsAccepthtlctlvtypes): ListconfigsConfigs;

    hasTorServicePassword(): boolean;
    clearTorServicePassword(): void;
    getTorServicePassword(): ListconfigsConfigsTorservicepassword | undefined;
    setTorServicePassword(value?: ListconfigsConfigsTorservicepassword): ListconfigsConfigs;

    hasAnnounceAddrDns(): boolean;
    clearAnnounceAddrDns(): void;
    getAnnounceAddrDns(): ListconfigsConfigsAnnounceaddrdns | undefined;
    setAnnounceAddrDns(value?: ListconfigsConfigsAnnounceaddrdns): ListconfigsConfigs;

    hasRequireConfirmedInputs(): boolean;
    clearRequireConfirmedInputs(): void;
    getRequireConfirmedInputs(): ListconfigsConfigsRequireconfirmedinputs | undefined;
    setRequireConfirmedInputs(value?: ListconfigsConfigsRequireconfirmedinputs): ListconfigsConfigs;

    hasCommitFee(): boolean;
    clearCommitFee(): void;
    getCommitFee(): ListconfigsConfigsCommitfee | undefined;
    setCommitFee(value?: ListconfigsConfigsCommitfee): ListconfigsConfigs;

    hasCommitFeerateOffset(): boolean;
    clearCommitFeerateOffset(): void;
    getCommitFeerateOffset(): ListconfigsConfigsCommitfeerateoffset | undefined;
    setCommitFeerateOffset(value?: ListconfigsConfigsCommitfeerateoffset): ListconfigsConfigs;

    hasAutoconnectSeekerPeers(): boolean;
    clearAutoconnectSeekerPeers(): void;
    getAutoconnectSeekerPeers(): ListconfigsConfigsAutoconnectseekerpeers | undefined;
    setAutoconnectSeekerPeers(value?: ListconfigsConfigsAutoconnectseekerpeers): ListconfigsConfigs;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ListconfigsConfigs.AsObject;
    static toObject(includeInstance: boolean, msg: ListconfigsConfigs): ListconfigsConfigs.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ListconfigsConfigs, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ListconfigsConfigs;
    static deserializeBinaryFromReader(message: ListconfigsConfigs, reader: jspb.BinaryReader): ListconfigsConfigs;
}

export namespace ListconfigsConfigs {
    export type AsObject = {
        conf?: ListconfigsConfigsConf.AsObject,
        developer?: ListconfigsConfigsDeveloper.AsObject,
        clearPlugins?: ListconfigsConfigsClearplugins.AsObject,
        disableMpp?: ListconfigsConfigsDisablempp.AsObject,
        mainnet?: ListconfigsConfigsMainnet.AsObject,
        regtest?: ListconfigsConfigsRegtest.AsObject,
        signet?: ListconfigsConfigsSignet.AsObject,
        testnet?: ListconfigsConfigsTestnet.AsObject,
        importantPlugin?: ListconfigsConfigsImportantplugin.AsObject,
        plugin?: ListconfigsConfigsPlugin.AsObject,
        pluginDir?: ListconfigsConfigsPlugindir.AsObject,
        lightningDir?: ListconfigsConfigsLightningdir.AsObject,
        network?: ListconfigsConfigsNetwork.AsObject,
        allowDeprecatedApis?: ListconfigsConfigsAllowdeprecatedapis.AsObject,
        rpcFile?: ListconfigsConfigsRpcfile.AsObject,
        disablePlugin?: ListconfigsConfigsDisableplugin.AsObject,
        alwaysUseProxy?: ListconfigsConfigsAlwaysuseproxy.AsObject,
        daemon?: ListconfigsConfigsDaemon.AsObject,
        wallet?: ListconfigsConfigsWallet.AsObject,
        largeChannels?: ListconfigsConfigsLargechannels.AsObject,
        experimentalDualFund?: ListconfigsConfigsExperimentaldualfund.AsObject,
        experimentalSplicing?: ListconfigsConfigsExperimentalsplicing.AsObject,
        experimentalOnionMessages?: ListconfigsConfigsExperimentalonionmessages.AsObject,
        experimentalOffers?: ListconfigsConfigsExperimentaloffers.AsObject,
        experimentalShutdownWrongFunding?: ListconfigsConfigsExperimentalshutdownwrongfunding.AsObject,
        experimentalPeerStorage?: ListconfigsConfigsExperimentalpeerstorage.AsObject,
        experimentalAnchors?: ListconfigsConfigsExperimentalanchors.AsObject,
        databaseUpgrade?: ListconfigsConfigsDatabaseupgrade.AsObject,
        rgb?: ListconfigsConfigsRgb.AsObject,
        alias?: ListconfigsConfigsAlias.AsObject,
        pidFile?: ListconfigsConfigsPidfile.AsObject,
        ignoreFeeLimits?: ListconfigsConfigsIgnorefeelimits.AsObject,
        watchtimeBlocks?: ListconfigsConfigsWatchtimeblocks.AsObject,
        maxLocktimeBlocks?: ListconfigsConfigsMaxlocktimeblocks.AsObject,
        fundingConfirms?: ListconfigsConfigsFundingconfirms.AsObject,
        cltvDelta?: ListconfigsConfigsCltvdelta.AsObject,
        cltvFinal?: ListconfigsConfigsCltvfinal.AsObject,
        commitTime?: ListconfigsConfigsCommittime.AsObject,
        feeBase?: ListconfigsConfigsFeebase.AsObject,
        rescan?: ListconfigsConfigsRescan.AsObject,
        feePerSatoshi?: ListconfigsConfigsFeepersatoshi.AsObject,
        maxConcurrentHtlcs?: ListconfigsConfigsMaxconcurrenthtlcs.AsObject,
        htlcMinimumMsat?: ListconfigsConfigsHtlcminimummsat.AsObject,
        htlcMaximumMsat?: ListconfigsConfigsHtlcmaximummsat.AsObject,
        maxDustHtlcExposureMsat?: ListconfigsConfigsMaxdusthtlcexposuremsat.AsObject,
        minCapacitySat?: ListconfigsConfigsMincapacitysat.AsObject,
        addr?: ListconfigsConfigsAddr.AsObject,
        announceAddr?: ListconfigsConfigsAnnounceaddr.AsObject,
        bindAddr?: ListconfigsConfigsBindaddr.AsObject,
        offline?: ListconfigsConfigsOffline.AsObject,
        autolisten?: ListconfigsConfigsAutolisten.AsObject,
        proxy?: ListconfigsConfigsProxy.AsObject,
        disableDns?: ListconfigsConfigsDisabledns.AsObject,
        announceAddrDiscovered?: ListconfigsConfigsAnnounceaddrdiscovered.AsObject,
        announceAddrDiscoveredPort?: ListconfigsConfigsAnnounceaddrdiscoveredport.AsObject,
        encryptedHsm?: ListconfigsConfigsEncryptedhsm.AsObject,
        rpcFileMode?: ListconfigsConfigsRpcfilemode.AsObject,
        logLevel?: ListconfigsConfigsLoglevel.AsObject,
        logPrefix?: ListconfigsConfigsLogprefix.AsObject,
        logFile?: ListconfigsConfigsLogfile.AsObject,
        logTimestamps?: ListconfigsConfigsLogtimestamps.AsObject,
        forceFeerates?: ListconfigsConfigsForcefeerates.AsObject,
        subdaemon?: ListconfigsConfigsSubdaemon.AsObject,
        fetchinvoiceNoconnect?: ListconfigsConfigsFetchinvoicenoconnect.AsObject,
        acceptHtlcTlvTypes?: ListconfigsConfigsAccepthtlctlvtypes.AsObject,
        torServicePassword?: ListconfigsConfigsTorservicepassword.AsObject,
        announceAddrDns?: ListconfigsConfigsAnnounceaddrdns.AsObject,
        requireConfirmedInputs?: ListconfigsConfigsRequireconfirmedinputs.AsObject,
        commitFee?: ListconfigsConfigsCommitfee.AsObject,
        commitFeerateOffset?: ListconfigsConfigsCommitfeerateoffset.AsObject,
        autoconnectSeekerPeers?: ListconfigsConfigsAutoconnectseekerpeers.AsObject,
    }
}

export class ListconfigsConfigsConf extends jspb.Message { 
    getValueStr(): string;
    setValueStr(value: string): ListconfigsConfigsConf;
    getSource(): ListconfigsConfigsConf.ListconfigsConfigsConfSource;
    setSource(value: ListconfigsConfigsConf.ListconfigsConfigsConfSource): ListconfigsConfigsConf;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ListconfigsConfigsConf.AsObject;
    static toObject(includeInstance: boolean, msg: ListconfigsConfigsConf): ListconfigsConfigsConf.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ListconfigsConfigsConf, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ListconfigsConfigsConf;
    static deserializeBinaryFromReader(message: ListconfigsConfigsConf, reader: jspb.BinaryReader): ListconfigsConfigsConf;
}

export namespace ListconfigsConfigsConf {
    export type AsObject = {
        valueStr: string,
        source: ListconfigsConfigsConf.ListconfigsConfigsConfSource,
    }

    export enum ListconfigsConfigsConfSource {
    CMDLINE = 0,
    }

}

export class ListconfigsConfigsDeveloper extends jspb.Message { 
    getSet(): boolean;
    setSet(value: boolean): ListconfigsConfigsDeveloper;
    getSource(): string;
    setSource(value: string): ListconfigsConfigsDeveloper;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ListconfigsConfigsDeveloper.AsObject;
    static toObject(includeInstance: boolean, msg: ListconfigsConfigsDeveloper): ListconfigsConfigsDeveloper.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ListconfigsConfigsDeveloper, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ListconfigsConfigsDeveloper;
    static deserializeBinaryFromReader(message: ListconfigsConfigsDeveloper, reader: jspb.BinaryReader): ListconfigsConfigsDeveloper;
}

export namespace ListconfigsConfigsDeveloper {
    export type AsObject = {
        set: boolean,
        source: string,
    }
}

export class ListconfigsConfigsClearplugins extends jspb.Message { 
    getSet(): boolean;
    setSet(value: boolean): ListconfigsConfigsClearplugins;
    getSource(): string;
    setSource(value: string): ListconfigsConfigsClearplugins;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ListconfigsConfigsClearplugins.AsObject;
    static toObject(includeInstance: boolean, msg: ListconfigsConfigsClearplugins): ListconfigsConfigsClearplugins.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ListconfigsConfigsClearplugins, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ListconfigsConfigsClearplugins;
    static deserializeBinaryFromReader(message: ListconfigsConfigsClearplugins, reader: jspb.BinaryReader): ListconfigsConfigsClearplugins;
}

export namespace ListconfigsConfigsClearplugins {
    export type AsObject = {
        set: boolean,
        source: string,
    }
}

export class ListconfigsConfigsDisablempp extends jspb.Message { 
    getSet(): boolean;
    setSet(value: boolean): ListconfigsConfigsDisablempp;
    getSource(): string;
    setSource(value: string): ListconfigsConfigsDisablempp;

    hasPlugin(): boolean;
    clearPlugin(): void;
    getPlugin(): string | undefined;
    setPlugin(value: string): ListconfigsConfigsDisablempp;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ListconfigsConfigsDisablempp.AsObject;
    static toObject(includeInstance: boolean, msg: ListconfigsConfigsDisablempp): ListconfigsConfigsDisablempp.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ListconfigsConfigsDisablempp, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ListconfigsConfigsDisablempp;
    static deserializeBinaryFromReader(message: ListconfigsConfigsDisablempp, reader: jspb.BinaryReader): ListconfigsConfigsDisablempp;
}

export namespace ListconfigsConfigsDisablempp {
    export type AsObject = {
        set: boolean,
        source: string,
        plugin?: string,
    }
}

export class ListconfigsConfigsMainnet extends jspb.Message { 
    getSet(): boolean;
    setSet(value: boolean): ListconfigsConfigsMainnet;
    getSource(): string;
    setSource(value: string): ListconfigsConfigsMainnet;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ListconfigsConfigsMainnet.AsObject;
    static toObject(includeInstance: boolean, msg: ListconfigsConfigsMainnet): ListconfigsConfigsMainnet.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ListconfigsConfigsMainnet, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ListconfigsConfigsMainnet;
    static deserializeBinaryFromReader(message: ListconfigsConfigsMainnet, reader: jspb.BinaryReader): ListconfigsConfigsMainnet;
}

export namespace ListconfigsConfigsMainnet {
    export type AsObject = {
        set: boolean,
        source: string,
    }
}

export class ListconfigsConfigsRegtest extends jspb.Message { 
    getSet(): boolean;
    setSet(value: boolean): ListconfigsConfigsRegtest;
    getSource(): string;
    setSource(value: string): ListconfigsConfigsRegtest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ListconfigsConfigsRegtest.AsObject;
    static toObject(includeInstance: boolean, msg: ListconfigsConfigsRegtest): ListconfigsConfigsRegtest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ListconfigsConfigsRegtest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ListconfigsConfigsRegtest;
    static deserializeBinaryFromReader(message: ListconfigsConfigsRegtest, reader: jspb.BinaryReader): ListconfigsConfigsRegtest;
}

export namespace ListconfigsConfigsRegtest {
    export type AsObject = {
        set: boolean,
        source: string,
    }
}

export class ListconfigsConfigsSignet extends jspb.Message { 
    getSet(): boolean;
    setSet(value: boolean): ListconfigsConfigsSignet;
    getSource(): string;
    setSource(value: string): ListconfigsConfigsSignet;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ListconfigsConfigsSignet.AsObject;
    static toObject(includeInstance: boolean, msg: ListconfigsConfigsSignet): ListconfigsConfigsSignet.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ListconfigsConfigsSignet, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ListconfigsConfigsSignet;
    static deserializeBinaryFromReader(message: ListconfigsConfigsSignet, reader: jspb.BinaryReader): ListconfigsConfigsSignet;
}

export namespace ListconfigsConfigsSignet {
    export type AsObject = {
        set: boolean,
        source: string,
    }
}

export class ListconfigsConfigsTestnet extends jspb.Message { 
    getSet(): boolean;
    setSet(value: boolean): ListconfigsConfigsTestnet;
    getSource(): string;
    setSource(value: string): ListconfigsConfigsTestnet;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ListconfigsConfigsTestnet.AsObject;
    static toObject(includeInstance: boolean, msg: ListconfigsConfigsTestnet): ListconfigsConfigsTestnet.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ListconfigsConfigsTestnet, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ListconfigsConfigsTestnet;
    static deserializeBinaryFromReader(message: ListconfigsConfigsTestnet, reader: jspb.BinaryReader): ListconfigsConfigsTestnet;
}

export namespace ListconfigsConfigsTestnet {
    export type AsObject = {
        set: boolean,
        source: string,
    }
}

export class ListconfigsConfigsImportantplugin extends jspb.Message { 
    clearValuesStrList(): void;
    getValuesStrList(): Array<string>;
    setValuesStrList(value: Array<string>): ListconfigsConfigsImportantplugin;
    addValuesStr(value: string, index?: number): string;
    clearSourcesList(): void;
    getSourcesList(): Array<string>;
    setSourcesList(value: Array<string>): ListconfigsConfigsImportantplugin;
    addSources(value: string, index?: number): string;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ListconfigsConfigsImportantplugin.AsObject;
    static toObject(includeInstance: boolean, msg: ListconfigsConfigsImportantplugin): ListconfigsConfigsImportantplugin.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ListconfigsConfigsImportantplugin, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ListconfigsConfigsImportantplugin;
    static deserializeBinaryFromReader(message: ListconfigsConfigsImportantplugin, reader: jspb.BinaryReader): ListconfigsConfigsImportantplugin;
}

export namespace ListconfigsConfigsImportantplugin {
    export type AsObject = {
        valuesStrList: Array<string>,
        sourcesList: Array<string>,
    }
}

export class ListconfigsConfigsPlugin extends jspb.Message { 
    clearValuesStrList(): void;
    getValuesStrList(): Array<string>;
    setValuesStrList(value: Array<string>): ListconfigsConfigsPlugin;
    addValuesStr(value: string, index?: number): string;
    clearSourcesList(): void;
    getSourcesList(): Array<string>;
    setSourcesList(value: Array<string>): ListconfigsConfigsPlugin;
    addSources(value: string, index?: number): string;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ListconfigsConfigsPlugin.AsObject;
    static toObject(includeInstance: boolean, msg: ListconfigsConfigsPlugin): ListconfigsConfigsPlugin.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ListconfigsConfigsPlugin, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ListconfigsConfigsPlugin;
    static deserializeBinaryFromReader(message: ListconfigsConfigsPlugin, reader: jspb.BinaryReader): ListconfigsConfigsPlugin;
}

export namespace ListconfigsConfigsPlugin {
    export type AsObject = {
        valuesStrList: Array<string>,
        sourcesList: Array<string>,
    }
}

export class ListconfigsConfigsPlugindir extends jspb.Message { 
    clearValuesStrList(): void;
    getValuesStrList(): Array<string>;
    setValuesStrList(value: Array<string>): ListconfigsConfigsPlugindir;
    addValuesStr(value: string, index?: number): string;
    clearSourcesList(): void;
    getSourcesList(): Array<string>;
    setSourcesList(value: Array<string>): ListconfigsConfigsPlugindir;
    addSources(value: string, index?: number): string;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ListconfigsConfigsPlugindir.AsObject;
    static toObject(includeInstance: boolean, msg: ListconfigsConfigsPlugindir): ListconfigsConfigsPlugindir.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ListconfigsConfigsPlugindir, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ListconfigsConfigsPlugindir;
    static deserializeBinaryFromReader(message: ListconfigsConfigsPlugindir, reader: jspb.BinaryReader): ListconfigsConfigsPlugindir;
}

export namespace ListconfigsConfigsPlugindir {
    export type AsObject = {
        valuesStrList: Array<string>,
        sourcesList: Array<string>,
    }
}

export class ListconfigsConfigsLightningdir extends jspb.Message { 
    getValueStr(): string;
    setValueStr(value: string): ListconfigsConfigsLightningdir;
    getSource(): string;
    setSource(value: string): ListconfigsConfigsLightningdir;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ListconfigsConfigsLightningdir.AsObject;
    static toObject(includeInstance: boolean, msg: ListconfigsConfigsLightningdir): ListconfigsConfigsLightningdir.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ListconfigsConfigsLightningdir, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ListconfigsConfigsLightningdir;
    static deserializeBinaryFromReader(message: ListconfigsConfigsLightningdir, reader: jspb.BinaryReader): ListconfigsConfigsLightningdir;
}

export namespace ListconfigsConfigsLightningdir {
    export type AsObject = {
        valueStr: string,
        source: string,
    }
}

export class ListconfigsConfigsNetwork extends jspb.Message { 
    getValueStr(): string;
    setValueStr(value: string): ListconfigsConfigsNetwork;
    getSource(): string;
    setSource(value: string): ListconfigsConfigsNetwork;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ListconfigsConfigsNetwork.AsObject;
    static toObject(includeInstance: boolean, msg: ListconfigsConfigsNetwork): ListconfigsConfigsNetwork.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ListconfigsConfigsNetwork, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ListconfigsConfigsNetwork;
    static deserializeBinaryFromReader(message: ListconfigsConfigsNetwork, reader: jspb.BinaryReader): ListconfigsConfigsNetwork;
}

export namespace ListconfigsConfigsNetwork {
    export type AsObject = {
        valueStr: string,
        source: string,
    }
}

export class ListconfigsConfigsAllowdeprecatedapis extends jspb.Message { 
    getValueBool(): boolean;
    setValueBool(value: boolean): ListconfigsConfigsAllowdeprecatedapis;
    getSource(): string;
    setSource(value: string): ListconfigsConfigsAllowdeprecatedapis;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ListconfigsConfigsAllowdeprecatedapis.AsObject;
    static toObject(includeInstance: boolean, msg: ListconfigsConfigsAllowdeprecatedapis): ListconfigsConfigsAllowdeprecatedapis.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ListconfigsConfigsAllowdeprecatedapis, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ListconfigsConfigsAllowdeprecatedapis;
    static deserializeBinaryFromReader(message: ListconfigsConfigsAllowdeprecatedapis, reader: jspb.BinaryReader): ListconfigsConfigsAllowdeprecatedapis;
}

export namespace ListconfigsConfigsAllowdeprecatedapis {
    export type AsObject = {
        valueBool: boolean,
        source: string,
    }
}

export class ListconfigsConfigsRpcfile extends jspb.Message { 
    getValueStr(): string;
    setValueStr(value: string): ListconfigsConfigsRpcfile;
    getSource(): string;
    setSource(value: string): ListconfigsConfigsRpcfile;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ListconfigsConfigsRpcfile.AsObject;
    static toObject(includeInstance: boolean, msg: ListconfigsConfigsRpcfile): ListconfigsConfigsRpcfile.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ListconfigsConfigsRpcfile, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ListconfigsConfigsRpcfile;
    static deserializeBinaryFromReader(message: ListconfigsConfigsRpcfile, reader: jspb.BinaryReader): ListconfigsConfigsRpcfile;
}

export namespace ListconfigsConfigsRpcfile {
    export type AsObject = {
        valueStr: string,
        source: string,
    }
}

export class ListconfigsConfigsDisableplugin extends jspb.Message { 
    clearValuesStrList(): void;
    getValuesStrList(): Array<string>;
    setValuesStrList(value: Array<string>): ListconfigsConfigsDisableplugin;
    addValuesStr(value: string, index?: number): string;
    clearSourcesList(): void;
    getSourcesList(): Array<string>;
    setSourcesList(value: Array<string>): ListconfigsConfigsDisableplugin;
    addSources(value: string, index?: number): string;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ListconfigsConfigsDisableplugin.AsObject;
    static toObject(includeInstance: boolean, msg: ListconfigsConfigsDisableplugin): ListconfigsConfigsDisableplugin.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ListconfigsConfigsDisableplugin, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ListconfigsConfigsDisableplugin;
    static deserializeBinaryFromReader(message: ListconfigsConfigsDisableplugin, reader: jspb.BinaryReader): ListconfigsConfigsDisableplugin;
}

export namespace ListconfigsConfigsDisableplugin {
    export type AsObject = {
        valuesStrList: Array<string>,
        sourcesList: Array<string>,
    }
}

export class ListconfigsConfigsAlwaysuseproxy extends jspb.Message { 
    getValueBool(): boolean;
    setValueBool(value: boolean): ListconfigsConfigsAlwaysuseproxy;
    getSource(): string;
    setSource(value: string): ListconfigsConfigsAlwaysuseproxy;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ListconfigsConfigsAlwaysuseproxy.AsObject;
    static toObject(includeInstance: boolean, msg: ListconfigsConfigsAlwaysuseproxy): ListconfigsConfigsAlwaysuseproxy.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ListconfigsConfigsAlwaysuseproxy, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ListconfigsConfigsAlwaysuseproxy;
    static deserializeBinaryFromReader(message: ListconfigsConfigsAlwaysuseproxy, reader: jspb.BinaryReader): ListconfigsConfigsAlwaysuseproxy;
}

export namespace ListconfigsConfigsAlwaysuseproxy {
    export type AsObject = {
        valueBool: boolean,
        source: string,
    }
}

export class ListconfigsConfigsDaemon extends jspb.Message { 
    getSet(): boolean;
    setSet(value: boolean): ListconfigsConfigsDaemon;
    getSource(): string;
    setSource(value: string): ListconfigsConfigsDaemon;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ListconfigsConfigsDaemon.AsObject;
    static toObject(includeInstance: boolean, msg: ListconfigsConfigsDaemon): ListconfigsConfigsDaemon.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ListconfigsConfigsDaemon, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ListconfigsConfigsDaemon;
    static deserializeBinaryFromReader(message: ListconfigsConfigsDaemon, reader: jspb.BinaryReader): ListconfigsConfigsDaemon;
}

export namespace ListconfigsConfigsDaemon {
    export type AsObject = {
        set: boolean,
        source: string,
    }
}

export class ListconfigsConfigsWallet extends jspb.Message { 
    getValueStr(): string;
    setValueStr(value: string): ListconfigsConfigsWallet;
    getSource(): string;
    setSource(value: string): ListconfigsConfigsWallet;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ListconfigsConfigsWallet.AsObject;
    static toObject(includeInstance: boolean, msg: ListconfigsConfigsWallet): ListconfigsConfigsWallet.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ListconfigsConfigsWallet, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ListconfigsConfigsWallet;
    static deserializeBinaryFromReader(message: ListconfigsConfigsWallet, reader: jspb.BinaryReader): ListconfigsConfigsWallet;
}

export namespace ListconfigsConfigsWallet {
    export type AsObject = {
        valueStr: string,
        source: string,
    }
}

export class ListconfigsConfigsLargechannels extends jspb.Message { 
    getSet(): boolean;
    setSet(value: boolean): ListconfigsConfigsLargechannels;
    getSource(): string;
    setSource(value: string): ListconfigsConfigsLargechannels;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ListconfigsConfigsLargechannels.AsObject;
    static toObject(includeInstance: boolean, msg: ListconfigsConfigsLargechannels): ListconfigsConfigsLargechannels.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ListconfigsConfigsLargechannels, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ListconfigsConfigsLargechannels;
    static deserializeBinaryFromReader(message: ListconfigsConfigsLargechannels, reader: jspb.BinaryReader): ListconfigsConfigsLargechannels;
}

export namespace ListconfigsConfigsLargechannels {
    export type AsObject = {
        set: boolean,
        source: string,
    }
}

export class ListconfigsConfigsExperimentaldualfund extends jspb.Message { 
    getSet(): boolean;
    setSet(value: boolean): ListconfigsConfigsExperimentaldualfund;
    getSource(): string;
    setSource(value: string): ListconfigsConfigsExperimentaldualfund;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ListconfigsConfigsExperimentaldualfund.AsObject;
    static toObject(includeInstance: boolean, msg: ListconfigsConfigsExperimentaldualfund): ListconfigsConfigsExperimentaldualfund.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ListconfigsConfigsExperimentaldualfund, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ListconfigsConfigsExperimentaldualfund;
    static deserializeBinaryFromReader(message: ListconfigsConfigsExperimentaldualfund, reader: jspb.BinaryReader): ListconfigsConfigsExperimentaldualfund;
}

export namespace ListconfigsConfigsExperimentaldualfund {
    export type AsObject = {
        set: boolean,
        source: string,
    }
}

export class ListconfigsConfigsExperimentalsplicing extends jspb.Message { 
    getSet(): boolean;
    setSet(value: boolean): ListconfigsConfigsExperimentalsplicing;
    getSource(): string;
    setSource(value: string): ListconfigsConfigsExperimentalsplicing;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ListconfigsConfigsExperimentalsplicing.AsObject;
    static toObject(includeInstance: boolean, msg: ListconfigsConfigsExperimentalsplicing): ListconfigsConfigsExperimentalsplicing.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ListconfigsConfigsExperimentalsplicing, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ListconfigsConfigsExperimentalsplicing;
    static deserializeBinaryFromReader(message: ListconfigsConfigsExperimentalsplicing, reader: jspb.BinaryReader): ListconfigsConfigsExperimentalsplicing;
}

export namespace ListconfigsConfigsExperimentalsplicing {
    export type AsObject = {
        set: boolean,
        source: string,
    }
}

export class ListconfigsConfigsExperimentalonionmessages extends jspb.Message { 
    getSet(): boolean;
    setSet(value: boolean): ListconfigsConfigsExperimentalonionmessages;
    getSource(): string;
    setSource(value: string): ListconfigsConfigsExperimentalonionmessages;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ListconfigsConfigsExperimentalonionmessages.AsObject;
    static toObject(includeInstance: boolean, msg: ListconfigsConfigsExperimentalonionmessages): ListconfigsConfigsExperimentalonionmessages.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ListconfigsConfigsExperimentalonionmessages, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ListconfigsConfigsExperimentalonionmessages;
    static deserializeBinaryFromReader(message: ListconfigsConfigsExperimentalonionmessages, reader: jspb.BinaryReader): ListconfigsConfigsExperimentalonionmessages;
}

export namespace ListconfigsConfigsExperimentalonionmessages {
    export type AsObject = {
        set: boolean,
        source: string,
    }
}

export class ListconfigsConfigsExperimentaloffers extends jspb.Message { 
    getSet(): boolean;
    setSet(value: boolean): ListconfigsConfigsExperimentaloffers;
    getSource(): string;
    setSource(value: string): ListconfigsConfigsExperimentaloffers;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ListconfigsConfigsExperimentaloffers.AsObject;
    static toObject(includeInstance: boolean, msg: ListconfigsConfigsExperimentaloffers): ListconfigsConfigsExperimentaloffers.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ListconfigsConfigsExperimentaloffers, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ListconfigsConfigsExperimentaloffers;
    static deserializeBinaryFromReader(message: ListconfigsConfigsExperimentaloffers, reader: jspb.BinaryReader): ListconfigsConfigsExperimentaloffers;
}

export namespace ListconfigsConfigsExperimentaloffers {
    export type AsObject = {
        set: boolean,
        source: string,
    }
}

export class ListconfigsConfigsExperimentalshutdownwrongfunding extends jspb.Message { 
    getSet(): boolean;
    setSet(value: boolean): ListconfigsConfigsExperimentalshutdownwrongfunding;
    getSource(): string;
    setSource(value: string): ListconfigsConfigsExperimentalshutdownwrongfunding;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ListconfigsConfigsExperimentalshutdownwrongfunding.AsObject;
    static toObject(includeInstance: boolean, msg: ListconfigsConfigsExperimentalshutdownwrongfunding): ListconfigsConfigsExperimentalshutdownwrongfunding.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ListconfigsConfigsExperimentalshutdownwrongfunding, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ListconfigsConfigsExperimentalshutdownwrongfunding;
    static deserializeBinaryFromReader(message: ListconfigsConfigsExperimentalshutdownwrongfunding, reader: jspb.BinaryReader): ListconfigsConfigsExperimentalshutdownwrongfunding;
}

export namespace ListconfigsConfigsExperimentalshutdownwrongfunding {
    export type AsObject = {
        set: boolean,
        source: string,
    }
}

export class ListconfigsConfigsExperimentalpeerstorage extends jspb.Message { 
    getSet(): boolean;
    setSet(value: boolean): ListconfigsConfigsExperimentalpeerstorage;
    getSource(): string;
    setSource(value: string): ListconfigsConfigsExperimentalpeerstorage;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ListconfigsConfigsExperimentalpeerstorage.AsObject;
    static toObject(includeInstance: boolean, msg: ListconfigsConfigsExperimentalpeerstorage): ListconfigsConfigsExperimentalpeerstorage.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ListconfigsConfigsExperimentalpeerstorage, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ListconfigsConfigsExperimentalpeerstorage;
    static deserializeBinaryFromReader(message: ListconfigsConfigsExperimentalpeerstorage, reader: jspb.BinaryReader): ListconfigsConfigsExperimentalpeerstorage;
}

export namespace ListconfigsConfigsExperimentalpeerstorage {
    export type AsObject = {
        set: boolean,
        source: string,
    }
}

export class ListconfigsConfigsExperimentalanchors extends jspb.Message { 
    getSet(): boolean;
    setSet(value: boolean): ListconfigsConfigsExperimentalanchors;
    getSource(): string;
    setSource(value: string): ListconfigsConfigsExperimentalanchors;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ListconfigsConfigsExperimentalanchors.AsObject;
    static toObject(includeInstance: boolean, msg: ListconfigsConfigsExperimentalanchors): ListconfigsConfigsExperimentalanchors.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ListconfigsConfigsExperimentalanchors, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ListconfigsConfigsExperimentalanchors;
    static deserializeBinaryFromReader(message: ListconfigsConfigsExperimentalanchors, reader: jspb.BinaryReader): ListconfigsConfigsExperimentalanchors;
}

export namespace ListconfigsConfigsExperimentalanchors {
    export type AsObject = {
        set: boolean,
        source: string,
    }
}

export class ListconfigsConfigsDatabaseupgrade extends jspb.Message { 
    getValueBool(): boolean;
    setValueBool(value: boolean): ListconfigsConfigsDatabaseupgrade;
    getSource(): string;
    setSource(value: string): ListconfigsConfigsDatabaseupgrade;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ListconfigsConfigsDatabaseupgrade.AsObject;
    static toObject(includeInstance: boolean, msg: ListconfigsConfigsDatabaseupgrade): ListconfigsConfigsDatabaseupgrade.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ListconfigsConfigsDatabaseupgrade, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ListconfigsConfigsDatabaseupgrade;
    static deserializeBinaryFromReader(message: ListconfigsConfigsDatabaseupgrade, reader: jspb.BinaryReader): ListconfigsConfigsDatabaseupgrade;
}

export namespace ListconfigsConfigsDatabaseupgrade {
    export type AsObject = {
        valueBool: boolean,
        source: string,
    }
}

export class ListconfigsConfigsRgb extends jspb.Message { 
    getValueStr(): Uint8Array | string;
    getValueStr_asU8(): Uint8Array;
    getValueStr_asB64(): string;
    setValueStr(value: Uint8Array | string): ListconfigsConfigsRgb;
    getSource(): string;
    setSource(value: string): ListconfigsConfigsRgb;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ListconfigsConfigsRgb.AsObject;
    static toObject(includeInstance: boolean, msg: ListconfigsConfigsRgb): ListconfigsConfigsRgb.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ListconfigsConfigsRgb, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ListconfigsConfigsRgb;
    static deserializeBinaryFromReader(message: ListconfigsConfigsRgb, reader: jspb.BinaryReader): ListconfigsConfigsRgb;
}

export namespace ListconfigsConfigsRgb {
    export type AsObject = {
        valueStr: Uint8Array | string,
        source: string,
    }
}

export class ListconfigsConfigsAlias extends jspb.Message { 
    getValueStr(): string;
    setValueStr(value: string): ListconfigsConfigsAlias;
    getSource(): string;
    setSource(value: string): ListconfigsConfigsAlias;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ListconfigsConfigsAlias.AsObject;
    static toObject(includeInstance: boolean, msg: ListconfigsConfigsAlias): ListconfigsConfigsAlias.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ListconfigsConfigsAlias, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ListconfigsConfigsAlias;
    static deserializeBinaryFromReader(message: ListconfigsConfigsAlias, reader: jspb.BinaryReader): ListconfigsConfigsAlias;
}

export namespace ListconfigsConfigsAlias {
    export type AsObject = {
        valueStr: string,
        source: string,
    }
}

export class ListconfigsConfigsPidfile extends jspb.Message { 
    getValueStr(): string;
    setValueStr(value: string): ListconfigsConfigsPidfile;
    getSource(): string;
    setSource(value: string): ListconfigsConfigsPidfile;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ListconfigsConfigsPidfile.AsObject;
    static toObject(includeInstance: boolean, msg: ListconfigsConfigsPidfile): ListconfigsConfigsPidfile.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ListconfigsConfigsPidfile, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ListconfigsConfigsPidfile;
    static deserializeBinaryFromReader(message: ListconfigsConfigsPidfile, reader: jspb.BinaryReader): ListconfigsConfigsPidfile;
}

export namespace ListconfigsConfigsPidfile {
    export type AsObject = {
        valueStr: string,
        source: string,
    }
}

export class ListconfigsConfigsIgnorefeelimits extends jspb.Message { 
    getValueBool(): boolean;
    setValueBool(value: boolean): ListconfigsConfigsIgnorefeelimits;
    getSource(): string;
    setSource(value: string): ListconfigsConfigsIgnorefeelimits;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ListconfigsConfigsIgnorefeelimits.AsObject;
    static toObject(includeInstance: boolean, msg: ListconfigsConfigsIgnorefeelimits): ListconfigsConfigsIgnorefeelimits.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ListconfigsConfigsIgnorefeelimits, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ListconfigsConfigsIgnorefeelimits;
    static deserializeBinaryFromReader(message: ListconfigsConfigsIgnorefeelimits, reader: jspb.BinaryReader): ListconfigsConfigsIgnorefeelimits;
}

export namespace ListconfigsConfigsIgnorefeelimits {
    export type AsObject = {
        valueBool: boolean,
        source: string,
    }
}

export class ListconfigsConfigsWatchtimeblocks extends jspb.Message { 
    getValueInt(): number;
    setValueInt(value: number): ListconfigsConfigsWatchtimeblocks;
    getSource(): string;
    setSource(value: string): ListconfigsConfigsWatchtimeblocks;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ListconfigsConfigsWatchtimeblocks.AsObject;
    static toObject(includeInstance: boolean, msg: ListconfigsConfigsWatchtimeblocks): ListconfigsConfigsWatchtimeblocks.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ListconfigsConfigsWatchtimeblocks, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ListconfigsConfigsWatchtimeblocks;
    static deserializeBinaryFromReader(message: ListconfigsConfigsWatchtimeblocks, reader: jspb.BinaryReader): ListconfigsConfigsWatchtimeblocks;
}

export namespace ListconfigsConfigsWatchtimeblocks {
    export type AsObject = {
        valueInt: number,
        source: string,
    }
}

export class ListconfigsConfigsMaxlocktimeblocks extends jspb.Message { 
    getValueInt(): number;
    setValueInt(value: number): ListconfigsConfigsMaxlocktimeblocks;
    getSource(): string;
    setSource(value: string): ListconfigsConfigsMaxlocktimeblocks;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ListconfigsConfigsMaxlocktimeblocks.AsObject;
    static toObject(includeInstance: boolean, msg: ListconfigsConfigsMaxlocktimeblocks): ListconfigsConfigsMaxlocktimeblocks.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ListconfigsConfigsMaxlocktimeblocks, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ListconfigsConfigsMaxlocktimeblocks;
    static deserializeBinaryFromReader(message: ListconfigsConfigsMaxlocktimeblocks, reader: jspb.BinaryReader): ListconfigsConfigsMaxlocktimeblocks;
}

export namespace ListconfigsConfigsMaxlocktimeblocks {
    export type AsObject = {
        valueInt: number,
        source: string,
    }
}

export class ListconfigsConfigsFundingconfirms extends jspb.Message { 
    getValueInt(): number;
    setValueInt(value: number): ListconfigsConfigsFundingconfirms;
    getSource(): string;
    setSource(value: string): ListconfigsConfigsFundingconfirms;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ListconfigsConfigsFundingconfirms.AsObject;
    static toObject(includeInstance: boolean, msg: ListconfigsConfigsFundingconfirms): ListconfigsConfigsFundingconfirms.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ListconfigsConfigsFundingconfirms, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ListconfigsConfigsFundingconfirms;
    static deserializeBinaryFromReader(message: ListconfigsConfigsFundingconfirms, reader: jspb.BinaryReader): ListconfigsConfigsFundingconfirms;
}

export namespace ListconfigsConfigsFundingconfirms {
    export type AsObject = {
        valueInt: number,
        source: string,
    }
}

export class ListconfigsConfigsCltvdelta extends jspb.Message { 
    getValueInt(): number;
    setValueInt(value: number): ListconfigsConfigsCltvdelta;
    getSource(): string;
    setSource(value: string): ListconfigsConfigsCltvdelta;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ListconfigsConfigsCltvdelta.AsObject;
    static toObject(includeInstance: boolean, msg: ListconfigsConfigsCltvdelta): ListconfigsConfigsCltvdelta.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ListconfigsConfigsCltvdelta, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ListconfigsConfigsCltvdelta;
    static deserializeBinaryFromReader(message: ListconfigsConfigsCltvdelta, reader: jspb.BinaryReader): ListconfigsConfigsCltvdelta;
}

export namespace ListconfigsConfigsCltvdelta {
    export type AsObject = {
        valueInt: number,
        source: string,
    }
}

export class ListconfigsConfigsCltvfinal extends jspb.Message { 
    getValueInt(): number;
    setValueInt(value: number): ListconfigsConfigsCltvfinal;
    getSource(): string;
    setSource(value: string): ListconfigsConfigsCltvfinal;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ListconfigsConfigsCltvfinal.AsObject;
    static toObject(includeInstance: boolean, msg: ListconfigsConfigsCltvfinal): ListconfigsConfigsCltvfinal.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ListconfigsConfigsCltvfinal, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ListconfigsConfigsCltvfinal;
    static deserializeBinaryFromReader(message: ListconfigsConfigsCltvfinal, reader: jspb.BinaryReader): ListconfigsConfigsCltvfinal;
}

export namespace ListconfigsConfigsCltvfinal {
    export type AsObject = {
        valueInt: number,
        source: string,
    }
}

export class ListconfigsConfigsCommittime extends jspb.Message { 
    getValueInt(): number;
    setValueInt(value: number): ListconfigsConfigsCommittime;
    getSource(): string;
    setSource(value: string): ListconfigsConfigsCommittime;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ListconfigsConfigsCommittime.AsObject;
    static toObject(includeInstance: boolean, msg: ListconfigsConfigsCommittime): ListconfigsConfigsCommittime.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ListconfigsConfigsCommittime, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ListconfigsConfigsCommittime;
    static deserializeBinaryFromReader(message: ListconfigsConfigsCommittime, reader: jspb.BinaryReader): ListconfigsConfigsCommittime;
}

export namespace ListconfigsConfigsCommittime {
    export type AsObject = {
        valueInt: number,
        source: string,
    }
}

export class ListconfigsConfigsFeebase extends jspb.Message { 
    getValueInt(): number;
    setValueInt(value: number): ListconfigsConfigsFeebase;
    getSource(): string;
    setSource(value: string): ListconfigsConfigsFeebase;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ListconfigsConfigsFeebase.AsObject;
    static toObject(includeInstance: boolean, msg: ListconfigsConfigsFeebase): ListconfigsConfigsFeebase.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ListconfigsConfigsFeebase, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ListconfigsConfigsFeebase;
    static deserializeBinaryFromReader(message: ListconfigsConfigsFeebase, reader: jspb.BinaryReader): ListconfigsConfigsFeebase;
}

export namespace ListconfigsConfigsFeebase {
    export type AsObject = {
        valueInt: number,
        source: string,
    }
}

export class ListconfigsConfigsRescan extends jspb.Message { 
    getValueInt(): number;
    setValueInt(value: number): ListconfigsConfigsRescan;
    getSource(): string;
    setSource(value: string): ListconfigsConfigsRescan;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ListconfigsConfigsRescan.AsObject;
    static toObject(includeInstance: boolean, msg: ListconfigsConfigsRescan): ListconfigsConfigsRescan.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ListconfigsConfigsRescan, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ListconfigsConfigsRescan;
    static deserializeBinaryFromReader(message: ListconfigsConfigsRescan, reader: jspb.BinaryReader): ListconfigsConfigsRescan;
}

export namespace ListconfigsConfigsRescan {
    export type AsObject = {
        valueInt: number,
        source: string,
    }
}

export class ListconfigsConfigsFeepersatoshi extends jspb.Message { 
    getValueInt(): number;
    setValueInt(value: number): ListconfigsConfigsFeepersatoshi;
    getSource(): string;
    setSource(value: string): ListconfigsConfigsFeepersatoshi;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ListconfigsConfigsFeepersatoshi.AsObject;
    static toObject(includeInstance: boolean, msg: ListconfigsConfigsFeepersatoshi): ListconfigsConfigsFeepersatoshi.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ListconfigsConfigsFeepersatoshi, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ListconfigsConfigsFeepersatoshi;
    static deserializeBinaryFromReader(message: ListconfigsConfigsFeepersatoshi, reader: jspb.BinaryReader): ListconfigsConfigsFeepersatoshi;
}

export namespace ListconfigsConfigsFeepersatoshi {
    export type AsObject = {
        valueInt: number,
        source: string,
    }
}

export class ListconfigsConfigsMaxconcurrenthtlcs extends jspb.Message { 
    getValueInt(): number;
    setValueInt(value: number): ListconfigsConfigsMaxconcurrenthtlcs;
    getSource(): string;
    setSource(value: string): ListconfigsConfigsMaxconcurrenthtlcs;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ListconfigsConfigsMaxconcurrenthtlcs.AsObject;
    static toObject(includeInstance: boolean, msg: ListconfigsConfigsMaxconcurrenthtlcs): ListconfigsConfigsMaxconcurrenthtlcs.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ListconfigsConfigsMaxconcurrenthtlcs, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ListconfigsConfigsMaxconcurrenthtlcs;
    static deserializeBinaryFromReader(message: ListconfigsConfigsMaxconcurrenthtlcs, reader: jspb.BinaryReader): ListconfigsConfigsMaxconcurrenthtlcs;
}

export namespace ListconfigsConfigsMaxconcurrenthtlcs {
    export type AsObject = {
        valueInt: number,
        source: string,
    }
}

export class ListconfigsConfigsHtlcminimummsat extends jspb.Message { 

    hasValueMsat(): boolean;
    clearValueMsat(): void;
    getValueMsat(): cln_primitives_pb.Amount | undefined;
    setValueMsat(value?: cln_primitives_pb.Amount): ListconfigsConfigsHtlcminimummsat;
    getSource(): string;
    setSource(value: string): ListconfigsConfigsHtlcminimummsat;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ListconfigsConfigsHtlcminimummsat.AsObject;
    static toObject(includeInstance: boolean, msg: ListconfigsConfigsHtlcminimummsat): ListconfigsConfigsHtlcminimummsat.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ListconfigsConfigsHtlcminimummsat, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ListconfigsConfigsHtlcminimummsat;
    static deserializeBinaryFromReader(message: ListconfigsConfigsHtlcminimummsat, reader: jspb.BinaryReader): ListconfigsConfigsHtlcminimummsat;
}

export namespace ListconfigsConfigsHtlcminimummsat {
    export type AsObject = {
        valueMsat?: cln_primitives_pb.Amount.AsObject,
        source: string,
    }
}

export class ListconfigsConfigsHtlcmaximummsat extends jspb.Message { 

    hasValueMsat(): boolean;
    clearValueMsat(): void;
    getValueMsat(): cln_primitives_pb.Amount | undefined;
    setValueMsat(value?: cln_primitives_pb.Amount): ListconfigsConfigsHtlcmaximummsat;
    getSource(): string;
    setSource(value: string): ListconfigsConfigsHtlcmaximummsat;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ListconfigsConfigsHtlcmaximummsat.AsObject;
    static toObject(includeInstance: boolean, msg: ListconfigsConfigsHtlcmaximummsat): ListconfigsConfigsHtlcmaximummsat.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ListconfigsConfigsHtlcmaximummsat, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ListconfigsConfigsHtlcmaximummsat;
    static deserializeBinaryFromReader(message: ListconfigsConfigsHtlcmaximummsat, reader: jspb.BinaryReader): ListconfigsConfigsHtlcmaximummsat;
}

export namespace ListconfigsConfigsHtlcmaximummsat {
    export type AsObject = {
        valueMsat?: cln_primitives_pb.Amount.AsObject,
        source: string,
    }
}

export class ListconfigsConfigsMaxdusthtlcexposuremsat extends jspb.Message { 

    hasValueMsat(): boolean;
    clearValueMsat(): void;
    getValueMsat(): cln_primitives_pb.Amount | undefined;
    setValueMsat(value?: cln_primitives_pb.Amount): ListconfigsConfigsMaxdusthtlcexposuremsat;
    getSource(): string;
    setSource(value: string): ListconfigsConfigsMaxdusthtlcexposuremsat;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ListconfigsConfigsMaxdusthtlcexposuremsat.AsObject;
    static toObject(includeInstance: boolean, msg: ListconfigsConfigsMaxdusthtlcexposuremsat): ListconfigsConfigsMaxdusthtlcexposuremsat.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ListconfigsConfigsMaxdusthtlcexposuremsat, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ListconfigsConfigsMaxdusthtlcexposuremsat;
    static deserializeBinaryFromReader(message: ListconfigsConfigsMaxdusthtlcexposuremsat, reader: jspb.BinaryReader): ListconfigsConfigsMaxdusthtlcexposuremsat;
}

export namespace ListconfigsConfigsMaxdusthtlcexposuremsat {
    export type AsObject = {
        valueMsat?: cln_primitives_pb.Amount.AsObject,
        source: string,
    }
}

export class ListconfigsConfigsMincapacitysat extends jspb.Message { 
    getValueInt(): number;
    setValueInt(value: number): ListconfigsConfigsMincapacitysat;
    getSource(): string;
    setSource(value: string): ListconfigsConfigsMincapacitysat;

    hasDynamic(): boolean;
    clearDynamic(): void;
    getDynamic(): boolean | undefined;
    setDynamic(value: boolean): ListconfigsConfigsMincapacitysat;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ListconfigsConfigsMincapacitysat.AsObject;
    static toObject(includeInstance: boolean, msg: ListconfigsConfigsMincapacitysat): ListconfigsConfigsMincapacitysat.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ListconfigsConfigsMincapacitysat, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ListconfigsConfigsMincapacitysat;
    static deserializeBinaryFromReader(message: ListconfigsConfigsMincapacitysat, reader: jspb.BinaryReader): ListconfigsConfigsMincapacitysat;
}

export namespace ListconfigsConfigsMincapacitysat {
    export type AsObject = {
        valueInt: number,
        source: string,
        dynamic?: boolean,
    }
}

export class ListconfigsConfigsAddr extends jspb.Message { 
    clearValuesStrList(): void;
    getValuesStrList(): Array<string>;
    setValuesStrList(value: Array<string>): ListconfigsConfigsAddr;
    addValuesStr(value: string, index?: number): string;
    clearSourcesList(): void;
    getSourcesList(): Array<string>;
    setSourcesList(value: Array<string>): ListconfigsConfigsAddr;
    addSources(value: string, index?: number): string;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ListconfigsConfigsAddr.AsObject;
    static toObject(includeInstance: boolean, msg: ListconfigsConfigsAddr): ListconfigsConfigsAddr.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ListconfigsConfigsAddr, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ListconfigsConfigsAddr;
    static deserializeBinaryFromReader(message: ListconfigsConfigsAddr, reader: jspb.BinaryReader): ListconfigsConfigsAddr;
}

export namespace ListconfigsConfigsAddr {
    export type AsObject = {
        valuesStrList: Array<string>,
        sourcesList: Array<string>,
    }
}

export class ListconfigsConfigsAnnounceaddr extends jspb.Message { 
    clearValuesStrList(): void;
    getValuesStrList(): Array<string>;
    setValuesStrList(value: Array<string>): ListconfigsConfigsAnnounceaddr;
    addValuesStr(value: string, index?: number): string;
    clearSourcesList(): void;
    getSourcesList(): Array<string>;
    setSourcesList(value: Array<string>): ListconfigsConfigsAnnounceaddr;
    addSources(value: string, index?: number): string;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ListconfigsConfigsAnnounceaddr.AsObject;
    static toObject(includeInstance: boolean, msg: ListconfigsConfigsAnnounceaddr): ListconfigsConfigsAnnounceaddr.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ListconfigsConfigsAnnounceaddr, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ListconfigsConfigsAnnounceaddr;
    static deserializeBinaryFromReader(message: ListconfigsConfigsAnnounceaddr, reader: jspb.BinaryReader): ListconfigsConfigsAnnounceaddr;
}

export namespace ListconfigsConfigsAnnounceaddr {
    export type AsObject = {
        valuesStrList: Array<string>,
        sourcesList: Array<string>,
    }
}

export class ListconfigsConfigsBindaddr extends jspb.Message { 
    clearValuesStrList(): void;
    getValuesStrList(): Array<string>;
    setValuesStrList(value: Array<string>): ListconfigsConfigsBindaddr;
    addValuesStr(value: string, index?: number): string;
    clearSourcesList(): void;
    getSourcesList(): Array<string>;
    setSourcesList(value: Array<string>): ListconfigsConfigsBindaddr;
    addSources(value: string, index?: number): string;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ListconfigsConfigsBindaddr.AsObject;
    static toObject(includeInstance: boolean, msg: ListconfigsConfigsBindaddr): ListconfigsConfigsBindaddr.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ListconfigsConfigsBindaddr, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ListconfigsConfigsBindaddr;
    static deserializeBinaryFromReader(message: ListconfigsConfigsBindaddr, reader: jspb.BinaryReader): ListconfigsConfigsBindaddr;
}

export namespace ListconfigsConfigsBindaddr {
    export type AsObject = {
        valuesStrList: Array<string>,
        sourcesList: Array<string>,
    }
}

export class ListconfigsConfigsOffline extends jspb.Message { 
    getSet(): boolean;
    setSet(value: boolean): ListconfigsConfigsOffline;
    getSource(): string;
    setSource(value: string): ListconfigsConfigsOffline;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ListconfigsConfigsOffline.AsObject;
    static toObject(includeInstance: boolean, msg: ListconfigsConfigsOffline): ListconfigsConfigsOffline.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ListconfigsConfigsOffline, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ListconfigsConfigsOffline;
    static deserializeBinaryFromReader(message: ListconfigsConfigsOffline, reader: jspb.BinaryReader): ListconfigsConfigsOffline;
}

export namespace ListconfigsConfigsOffline {
    export type AsObject = {
        set: boolean,
        source: string,
    }
}

export class ListconfigsConfigsAutolisten extends jspb.Message { 
    getValueBool(): boolean;
    setValueBool(value: boolean): ListconfigsConfigsAutolisten;
    getSource(): string;
    setSource(value: string): ListconfigsConfigsAutolisten;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ListconfigsConfigsAutolisten.AsObject;
    static toObject(includeInstance: boolean, msg: ListconfigsConfigsAutolisten): ListconfigsConfigsAutolisten.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ListconfigsConfigsAutolisten, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ListconfigsConfigsAutolisten;
    static deserializeBinaryFromReader(message: ListconfigsConfigsAutolisten, reader: jspb.BinaryReader): ListconfigsConfigsAutolisten;
}

export namespace ListconfigsConfigsAutolisten {
    export type AsObject = {
        valueBool: boolean,
        source: string,
    }
}

export class ListconfigsConfigsProxy extends jspb.Message { 
    getValueStr(): string;
    setValueStr(value: string): ListconfigsConfigsProxy;
    getSource(): string;
    setSource(value: string): ListconfigsConfigsProxy;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ListconfigsConfigsProxy.AsObject;
    static toObject(includeInstance: boolean, msg: ListconfigsConfigsProxy): ListconfigsConfigsProxy.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ListconfigsConfigsProxy, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ListconfigsConfigsProxy;
    static deserializeBinaryFromReader(message: ListconfigsConfigsProxy, reader: jspb.BinaryReader): ListconfigsConfigsProxy;
}

export namespace ListconfigsConfigsProxy {
    export type AsObject = {
        valueStr: string,
        source: string,
    }
}

export class ListconfigsConfigsDisabledns extends jspb.Message { 
    getSet(): boolean;
    setSet(value: boolean): ListconfigsConfigsDisabledns;
    getSource(): string;
    setSource(value: string): ListconfigsConfigsDisabledns;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ListconfigsConfigsDisabledns.AsObject;
    static toObject(includeInstance: boolean, msg: ListconfigsConfigsDisabledns): ListconfigsConfigsDisabledns.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ListconfigsConfigsDisabledns, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ListconfigsConfigsDisabledns;
    static deserializeBinaryFromReader(message: ListconfigsConfigsDisabledns, reader: jspb.BinaryReader): ListconfigsConfigsDisabledns;
}

export namespace ListconfigsConfigsDisabledns {
    export type AsObject = {
        set: boolean,
        source: string,
    }
}

export class ListconfigsConfigsAnnounceaddrdiscovered extends jspb.Message { 
    getValueStr(): ListconfigsConfigsAnnounceaddrdiscovered.ListconfigsConfigsAnnounceaddrdiscoveredValue_str;
    setValueStr(value: ListconfigsConfigsAnnounceaddrdiscovered.ListconfigsConfigsAnnounceaddrdiscoveredValue_str): ListconfigsConfigsAnnounceaddrdiscovered;
    getSource(): string;
    setSource(value: string): ListconfigsConfigsAnnounceaddrdiscovered;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ListconfigsConfigsAnnounceaddrdiscovered.AsObject;
    static toObject(includeInstance: boolean, msg: ListconfigsConfigsAnnounceaddrdiscovered): ListconfigsConfigsAnnounceaddrdiscovered.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ListconfigsConfigsAnnounceaddrdiscovered, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ListconfigsConfigsAnnounceaddrdiscovered;
    static deserializeBinaryFromReader(message: ListconfigsConfigsAnnounceaddrdiscovered, reader: jspb.BinaryReader): ListconfigsConfigsAnnounceaddrdiscovered;
}

export namespace ListconfigsConfigsAnnounceaddrdiscovered {
    export type AsObject = {
        valueStr: ListconfigsConfigsAnnounceaddrdiscovered.ListconfigsConfigsAnnounceaddrdiscoveredValue_str,
        source: string,
    }

    export enum ListconfigsConfigsAnnounceaddrdiscoveredValue_str {
    TRUE = 0,
    FALSE = 1,
    AUTO = 2,
    }

}

export class ListconfigsConfigsAnnounceaddrdiscoveredport extends jspb.Message { 
    getValueInt(): number;
    setValueInt(value: number): ListconfigsConfigsAnnounceaddrdiscoveredport;
    getSource(): string;
    setSource(value: string): ListconfigsConfigsAnnounceaddrdiscoveredport;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ListconfigsConfigsAnnounceaddrdiscoveredport.AsObject;
    static toObject(includeInstance: boolean, msg: ListconfigsConfigsAnnounceaddrdiscoveredport): ListconfigsConfigsAnnounceaddrdiscoveredport.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ListconfigsConfigsAnnounceaddrdiscoveredport, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ListconfigsConfigsAnnounceaddrdiscoveredport;
    static deserializeBinaryFromReader(message: ListconfigsConfigsAnnounceaddrdiscoveredport, reader: jspb.BinaryReader): ListconfigsConfigsAnnounceaddrdiscoveredport;
}

export namespace ListconfigsConfigsAnnounceaddrdiscoveredport {
    export type AsObject = {
        valueInt: number,
        source: string,
    }
}

export class ListconfigsConfigsEncryptedhsm extends jspb.Message { 
    getSet(): boolean;
    setSet(value: boolean): ListconfigsConfigsEncryptedhsm;
    getSource(): string;
    setSource(value: string): ListconfigsConfigsEncryptedhsm;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ListconfigsConfigsEncryptedhsm.AsObject;
    static toObject(includeInstance: boolean, msg: ListconfigsConfigsEncryptedhsm): ListconfigsConfigsEncryptedhsm.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ListconfigsConfigsEncryptedhsm, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ListconfigsConfigsEncryptedhsm;
    static deserializeBinaryFromReader(message: ListconfigsConfigsEncryptedhsm, reader: jspb.BinaryReader): ListconfigsConfigsEncryptedhsm;
}

export namespace ListconfigsConfigsEncryptedhsm {
    export type AsObject = {
        set: boolean,
        source: string,
    }
}

export class ListconfigsConfigsRpcfilemode extends jspb.Message { 
    getValueStr(): string;
    setValueStr(value: string): ListconfigsConfigsRpcfilemode;
    getSource(): string;
    setSource(value: string): ListconfigsConfigsRpcfilemode;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ListconfigsConfigsRpcfilemode.AsObject;
    static toObject(includeInstance: boolean, msg: ListconfigsConfigsRpcfilemode): ListconfigsConfigsRpcfilemode.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ListconfigsConfigsRpcfilemode, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ListconfigsConfigsRpcfilemode;
    static deserializeBinaryFromReader(message: ListconfigsConfigsRpcfilemode, reader: jspb.BinaryReader): ListconfigsConfigsRpcfilemode;
}

export namespace ListconfigsConfigsRpcfilemode {
    export type AsObject = {
        valueStr: string,
        source: string,
    }
}

export class ListconfigsConfigsLoglevel extends jspb.Message { 
    getValueStr(): string;
    setValueStr(value: string): ListconfigsConfigsLoglevel;
    getSource(): string;
    setSource(value: string): ListconfigsConfigsLoglevel;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ListconfigsConfigsLoglevel.AsObject;
    static toObject(includeInstance: boolean, msg: ListconfigsConfigsLoglevel): ListconfigsConfigsLoglevel.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ListconfigsConfigsLoglevel, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ListconfigsConfigsLoglevel;
    static deserializeBinaryFromReader(message: ListconfigsConfigsLoglevel, reader: jspb.BinaryReader): ListconfigsConfigsLoglevel;
}

export namespace ListconfigsConfigsLoglevel {
    export type AsObject = {
        valueStr: string,
        source: string,
    }
}

export class ListconfigsConfigsLogprefix extends jspb.Message { 
    getValueStr(): string;
    setValueStr(value: string): ListconfigsConfigsLogprefix;
    getSource(): string;
    setSource(value: string): ListconfigsConfigsLogprefix;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ListconfigsConfigsLogprefix.AsObject;
    static toObject(includeInstance: boolean, msg: ListconfigsConfigsLogprefix): ListconfigsConfigsLogprefix.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ListconfigsConfigsLogprefix, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ListconfigsConfigsLogprefix;
    static deserializeBinaryFromReader(message: ListconfigsConfigsLogprefix, reader: jspb.BinaryReader): ListconfigsConfigsLogprefix;
}

export namespace ListconfigsConfigsLogprefix {
    export type AsObject = {
        valueStr: string,
        source: string,
    }
}

export class ListconfigsConfigsLogfile extends jspb.Message { 
    clearValuesStrList(): void;
    getValuesStrList(): Array<string>;
    setValuesStrList(value: Array<string>): ListconfigsConfigsLogfile;
    addValuesStr(value: string, index?: number): string;
    clearSourcesList(): void;
    getSourcesList(): Array<string>;
    setSourcesList(value: Array<string>): ListconfigsConfigsLogfile;
    addSources(value: string, index?: number): string;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ListconfigsConfigsLogfile.AsObject;
    static toObject(includeInstance: boolean, msg: ListconfigsConfigsLogfile): ListconfigsConfigsLogfile.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ListconfigsConfigsLogfile, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ListconfigsConfigsLogfile;
    static deserializeBinaryFromReader(message: ListconfigsConfigsLogfile, reader: jspb.BinaryReader): ListconfigsConfigsLogfile;
}

export namespace ListconfigsConfigsLogfile {
    export type AsObject = {
        valuesStrList: Array<string>,
        sourcesList: Array<string>,
    }
}

export class ListconfigsConfigsLogtimestamps extends jspb.Message { 
    getValueBool(): boolean;
    setValueBool(value: boolean): ListconfigsConfigsLogtimestamps;
    getSource(): string;
    setSource(value: string): ListconfigsConfigsLogtimestamps;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ListconfigsConfigsLogtimestamps.AsObject;
    static toObject(includeInstance: boolean, msg: ListconfigsConfigsLogtimestamps): ListconfigsConfigsLogtimestamps.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ListconfigsConfigsLogtimestamps, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ListconfigsConfigsLogtimestamps;
    static deserializeBinaryFromReader(message: ListconfigsConfigsLogtimestamps, reader: jspb.BinaryReader): ListconfigsConfigsLogtimestamps;
}

export namespace ListconfigsConfigsLogtimestamps {
    export type AsObject = {
        valueBool: boolean,
        source: string,
    }
}

export class ListconfigsConfigsForcefeerates extends jspb.Message { 
    getValueStr(): string;
    setValueStr(value: string): ListconfigsConfigsForcefeerates;
    getSource(): string;
    setSource(value: string): ListconfigsConfigsForcefeerates;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ListconfigsConfigsForcefeerates.AsObject;
    static toObject(includeInstance: boolean, msg: ListconfigsConfigsForcefeerates): ListconfigsConfigsForcefeerates.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ListconfigsConfigsForcefeerates, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ListconfigsConfigsForcefeerates;
    static deserializeBinaryFromReader(message: ListconfigsConfigsForcefeerates, reader: jspb.BinaryReader): ListconfigsConfigsForcefeerates;
}

export namespace ListconfigsConfigsForcefeerates {
    export type AsObject = {
        valueStr: string,
        source: string,
    }
}

export class ListconfigsConfigsSubdaemon extends jspb.Message { 
    clearValuesStrList(): void;
    getValuesStrList(): Array<string>;
    setValuesStrList(value: Array<string>): ListconfigsConfigsSubdaemon;
    addValuesStr(value: string, index?: number): string;
    clearSourcesList(): void;
    getSourcesList(): Array<string>;
    setSourcesList(value: Array<string>): ListconfigsConfigsSubdaemon;
    addSources(value: string, index?: number): string;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ListconfigsConfigsSubdaemon.AsObject;
    static toObject(includeInstance: boolean, msg: ListconfigsConfigsSubdaemon): ListconfigsConfigsSubdaemon.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ListconfigsConfigsSubdaemon, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ListconfigsConfigsSubdaemon;
    static deserializeBinaryFromReader(message: ListconfigsConfigsSubdaemon, reader: jspb.BinaryReader): ListconfigsConfigsSubdaemon;
}

export namespace ListconfigsConfigsSubdaemon {
    export type AsObject = {
        valuesStrList: Array<string>,
        sourcesList: Array<string>,
    }
}

export class ListconfigsConfigsFetchinvoicenoconnect extends jspb.Message { 
    getSet(): boolean;
    setSet(value: boolean): ListconfigsConfigsFetchinvoicenoconnect;
    getSource(): string;
    setSource(value: string): ListconfigsConfigsFetchinvoicenoconnect;

    hasPlugin(): boolean;
    clearPlugin(): void;
    getPlugin(): string | undefined;
    setPlugin(value: string): ListconfigsConfigsFetchinvoicenoconnect;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ListconfigsConfigsFetchinvoicenoconnect.AsObject;
    static toObject(includeInstance: boolean, msg: ListconfigsConfigsFetchinvoicenoconnect): ListconfigsConfigsFetchinvoicenoconnect.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ListconfigsConfigsFetchinvoicenoconnect, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ListconfigsConfigsFetchinvoicenoconnect;
    static deserializeBinaryFromReader(message: ListconfigsConfigsFetchinvoicenoconnect, reader: jspb.BinaryReader): ListconfigsConfigsFetchinvoicenoconnect;
}

export namespace ListconfigsConfigsFetchinvoicenoconnect {
    export type AsObject = {
        set: boolean,
        source: string,
        plugin?: string,
    }
}

export class ListconfigsConfigsAccepthtlctlvtypes extends jspb.Message { 
    getValueStr(): string;
    setValueStr(value: string): ListconfigsConfigsAccepthtlctlvtypes;
    getSource(): string;
    setSource(value: string): ListconfigsConfigsAccepthtlctlvtypes;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ListconfigsConfigsAccepthtlctlvtypes.AsObject;
    static toObject(includeInstance: boolean, msg: ListconfigsConfigsAccepthtlctlvtypes): ListconfigsConfigsAccepthtlctlvtypes.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ListconfigsConfigsAccepthtlctlvtypes, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ListconfigsConfigsAccepthtlctlvtypes;
    static deserializeBinaryFromReader(message: ListconfigsConfigsAccepthtlctlvtypes, reader: jspb.BinaryReader): ListconfigsConfigsAccepthtlctlvtypes;
}

export namespace ListconfigsConfigsAccepthtlctlvtypes {
    export type AsObject = {
        valueStr: string,
        source: string,
    }
}

export class ListconfigsConfigsTorservicepassword extends jspb.Message { 
    getValueStr(): string;
    setValueStr(value: string): ListconfigsConfigsTorservicepassword;
    getSource(): string;
    setSource(value: string): ListconfigsConfigsTorservicepassword;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ListconfigsConfigsTorservicepassword.AsObject;
    static toObject(includeInstance: boolean, msg: ListconfigsConfigsTorservicepassword): ListconfigsConfigsTorservicepassword.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ListconfigsConfigsTorservicepassword, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ListconfigsConfigsTorservicepassword;
    static deserializeBinaryFromReader(message: ListconfigsConfigsTorservicepassword, reader: jspb.BinaryReader): ListconfigsConfigsTorservicepassword;
}

export namespace ListconfigsConfigsTorservicepassword {
    export type AsObject = {
        valueStr: string,
        source: string,
    }
}

export class ListconfigsConfigsAnnounceaddrdns extends jspb.Message { 
    getValueBool(): boolean;
    setValueBool(value: boolean): ListconfigsConfigsAnnounceaddrdns;
    getSource(): string;
    setSource(value: string): ListconfigsConfigsAnnounceaddrdns;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ListconfigsConfigsAnnounceaddrdns.AsObject;
    static toObject(includeInstance: boolean, msg: ListconfigsConfigsAnnounceaddrdns): ListconfigsConfigsAnnounceaddrdns.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ListconfigsConfigsAnnounceaddrdns, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ListconfigsConfigsAnnounceaddrdns;
    static deserializeBinaryFromReader(message: ListconfigsConfigsAnnounceaddrdns, reader: jspb.BinaryReader): ListconfigsConfigsAnnounceaddrdns;
}

export namespace ListconfigsConfigsAnnounceaddrdns {
    export type AsObject = {
        valueBool: boolean,
        source: string,
    }
}

export class ListconfigsConfigsRequireconfirmedinputs extends jspb.Message { 
    getValueBool(): boolean;
    setValueBool(value: boolean): ListconfigsConfigsRequireconfirmedinputs;
    getSource(): string;
    setSource(value: string): ListconfigsConfigsRequireconfirmedinputs;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ListconfigsConfigsRequireconfirmedinputs.AsObject;
    static toObject(includeInstance: boolean, msg: ListconfigsConfigsRequireconfirmedinputs): ListconfigsConfigsRequireconfirmedinputs.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ListconfigsConfigsRequireconfirmedinputs, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ListconfigsConfigsRequireconfirmedinputs;
    static deserializeBinaryFromReader(message: ListconfigsConfigsRequireconfirmedinputs, reader: jspb.BinaryReader): ListconfigsConfigsRequireconfirmedinputs;
}

export namespace ListconfigsConfigsRequireconfirmedinputs {
    export type AsObject = {
        valueBool: boolean,
        source: string,
    }
}

export class ListconfigsConfigsCommitfee extends jspb.Message { 
    getValueInt(): number;
    setValueInt(value: number): ListconfigsConfigsCommitfee;
    getSource(): string;
    setSource(value: string): ListconfigsConfigsCommitfee;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ListconfigsConfigsCommitfee.AsObject;
    static toObject(includeInstance: boolean, msg: ListconfigsConfigsCommitfee): ListconfigsConfigsCommitfee.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ListconfigsConfigsCommitfee, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ListconfigsConfigsCommitfee;
    static deserializeBinaryFromReader(message: ListconfigsConfigsCommitfee, reader: jspb.BinaryReader): ListconfigsConfigsCommitfee;
}

export namespace ListconfigsConfigsCommitfee {
    export type AsObject = {
        valueInt: number,
        source: string,
    }
}

export class ListconfigsConfigsCommitfeerateoffset extends jspb.Message { 
    getValueInt(): number;
    setValueInt(value: number): ListconfigsConfigsCommitfeerateoffset;
    getSource(): string;
    setSource(value: string): ListconfigsConfigsCommitfeerateoffset;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ListconfigsConfigsCommitfeerateoffset.AsObject;
    static toObject(includeInstance: boolean, msg: ListconfigsConfigsCommitfeerateoffset): ListconfigsConfigsCommitfeerateoffset.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ListconfigsConfigsCommitfeerateoffset, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ListconfigsConfigsCommitfeerateoffset;
    static deserializeBinaryFromReader(message: ListconfigsConfigsCommitfeerateoffset, reader: jspb.BinaryReader): ListconfigsConfigsCommitfeerateoffset;
}

export namespace ListconfigsConfigsCommitfeerateoffset {
    export type AsObject = {
        valueInt: number,
        source: string,
    }
}

export class ListconfigsConfigsAutoconnectseekerpeers extends jspb.Message { 
    getValueInt(): number;
    setValueInt(value: number): ListconfigsConfigsAutoconnectseekerpeers;
    getSource(): string;
    setSource(value: string): ListconfigsConfigsAutoconnectseekerpeers;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ListconfigsConfigsAutoconnectseekerpeers.AsObject;
    static toObject(includeInstance: boolean, msg: ListconfigsConfigsAutoconnectseekerpeers): ListconfigsConfigsAutoconnectseekerpeers.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ListconfigsConfigsAutoconnectseekerpeers, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ListconfigsConfigsAutoconnectseekerpeers;
    static deserializeBinaryFromReader(message: ListconfigsConfigsAutoconnectseekerpeers, reader: jspb.BinaryReader): ListconfigsConfigsAutoconnectseekerpeers;
}

export namespace ListconfigsConfigsAutoconnectseekerpeers {
    export type AsObject = {
        valueInt: number,
        source: string,
    }
}

export class ListconfigsPlugins extends jspb.Message { 
    getPath(): string;
    setPath(value: string): ListconfigsPlugins;
    getName(): string;
    setName(value: string): ListconfigsPlugins;

    hasOptions(): boolean;
    clearOptions(): void;
    getOptions(): ListconfigsPluginsOptions | undefined;
    setOptions(value?: ListconfigsPluginsOptions): ListconfigsPlugins;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ListconfigsPlugins.AsObject;
    static toObject(includeInstance: boolean, msg: ListconfigsPlugins): ListconfigsPlugins.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ListconfigsPlugins, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ListconfigsPlugins;
    static deserializeBinaryFromReader(message: ListconfigsPlugins, reader: jspb.BinaryReader): ListconfigsPlugins;
}

export namespace ListconfigsPlugins {
    export type AsObject = {
        path: string,
        name: string,
        options?: ListconfigsPluginsOptions.AsObject,
    }
}

export class ListconfigsPluginsOptions extends jspb.Message { 

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ListconfigsPluginsOptions.AsObject;
    static toObject(includeInstance: boolean, msg: ListconfigsPluginsOptions): ListconfigsPluginsOptions.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ListconfigsPluginsOptions, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ListconfigsPluginsOptions;
    static deserializeBinaryFromReader(message: ListconfigsPluginsOptions, reader: jspb.BinaryReader): ListconfigsPluginsOptions;
}

export namespace ListconfigsPluginsOptions {
    export type AsObject = {
    }
}

export class ListconfigsImportantplugins extends jspb.Message { 
    getPath(): string;
    setPath(value: string): ListconfigsImportantplugins;
    getName(): string;
    setName(value: string): ListconfigsImportantplugins;

    hasOptions(): boolean;
    clearOptions(): void;
    getOptions(): ListconfigsImportantpluginsOptions | undefined;
    setOptions(value?: ListconfigsImportantpluginsOptions): ListconfigsImportantplugins;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ListconfigsImportantplugins.AsObject;
    static toObject(includeInstance: boolean, msg: ListconfigsImportantplugins): ListconfigsImportantplugins.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ListconfigsImportantplugins, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ListconfigsImportantplugins;
    static deserializeBinaryFromReader(message: ListconfigsImportantplugins, reader: jspb.BinaryReader): ListconfigsImportantplugins;
}

export namespace ListconfigsImportantplugins {
    export type AsObject = {
        path: string,
        name: string,
        options?: ListconfigsImportantpluginsOptions.AsObject,
    }
}

export class ListconfigsImportantpluginsOptions extends jspb.Message { 

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ListconfigsImportantpluginsOptions.AsObject;
    static toObject(includeInstance: boolean, msg: ListconfigsImportantpluginsOptions): ListconfigsImportantpluginsOptions.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ListconfigsImportantpluginsOptions, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ListconfigsImportantpluginsOptions;
    static deserializeBinaryFromReader(message: ListconfigsImportantpluginsOptions, reader: jspb.BinaryReader): ListconfigsImportantpluginsOptions;
}

export namespace ListconfigsImportantpluginsOptions {
    export type AsObject = {
    }
}

export class StopRequest extends jspb.Message { 

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): StopRequest.AsObject;
    static toObject(includeInstance: boolean, msg: StopRequest): StopRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: StopRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): StopRequest;
    static deserializeBinaryFromReader(message: StopRequest, reader: jspb.BinaryReader): StopRequest;
}

export namespace StopRequest {
    export type AsObject = {
    }
}

export class StopResponse extends jspb.Message { 

    hasResult(): boolean;
    clearResult(): void;
    getResult(): StopResponse.StopResult | undefined;
    setResult(value: StopResponse.StopResult): StopResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): StopResponse.AsObject;
    static toObject(includeInstance: boolean, msg: StopResponse): StopResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: StopResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): StopResponse;
    static deserializeBinaryFromReader(message: StopResponse, reader: jspb.BinaryReader): StopResponse;
}

export namespace StopResponse {
    export type AsObject = {
        result?: StopResponse.StopResult,
    }

    export enum StopResult {
    SHUTDOWN_COMPLETE = 0,
    }

}

export class HelpRequest extends jspb.Message { 

    hasCommand(): boolean;
    clearCommand(): void;
    getCommand(): string | undefined;
    setCommand(value: string): HelpRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): HelpRequest.AsObject;
    static toObject(includeInstance: boolean, msg: HelpRequest): HelpRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: HelpRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): HelpRequest;
    static deserializeBinaryFromReader(message: HelpRequest, reader: jspb.BinaryReader): HelpRequest;
}

export namespace HelpRequest {
    export type AsObject = {
        command?: string,
    }
}

export class HelpResponse extends jspb.Message { 
    clearHelpList(): void;
    getHelpList(): Array<HelpHelp>;
    setHelpList(value: Array<HelpHelp>): HelpResponse;
    addHelp(value?: HelpHelp, index?: number): HelpHelp;

    hasFormatHint(): boolean;
    clearFormatHint(): void;
    getFormatHint(): HelpResponse.HelpFormathint | undefined;
    setFormatHint(value: HelpResponse.HelpFormathint): HelpResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): HelpResponse.AsObject;
    static toObject(includeInstance: boolean, msg: HelpResponse): HelpResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: HelpResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): HelpResponse;
    static deserializeBinaryFromReader(message: HelpResponse, reader: jspb.BinaryReader): HelpResponse;
}

export namespace HelpResponse {
    export type AsObject = {
        helpList: Array<HelpHelp.AsObject>,
        formatHint?: HelpResponse.HelpFormathint,
    }

    export enum HelpFormathint {
    SIMPLE = 0,
    }

}

export class HelpHelp extends jspb.Message { 
    getCommand(): string;
    setCommand(value: string): HelpHelp;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): HelpHelp.AsObject;
    static toObject(includeInstance: boolean, msg: HelpHelp): HelpHelp.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: HelpHelp, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): HelpHelp;
    static deserializeBinaryFromReader(message: HelpHelp, reader: jspb.BinaryReader): HelpHelp;
}

export namespace HelpHelp {
    export type AsObject = {
        command: string,
    }
}

export class PreapprovekeysendRequest extends jspb.Message { 
    getDestination(): Uint8Array | string;
    getDestination_asU8(): Uint8Array;
    getDestination_asB64(): string;
    setDestination(value: Uint8Array | string): PreapprovekeysendRequest;
    getPaymentHash(): Uint8Array | string;
    getPaymentHash_asU8(): Uint8Array;
    getPaymentHash_asB64(): string;
    setPaymentHash(value: Uint8Array | string): PreapprovekeysendRequest;

    hasAmountMsat(): boolean;
    clearAmountMsat(): void;
    getAmountMsat(): cln_primitives_pb.Amount | undefined;
    setAmountMsat(value?: cln_primitives_pb.Amount): PreapprovekeysendRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): PreapprovekeysendRequest.AsObject;
    static toObject(includeInstance: boolean, msg: PreapprovekeysendRequest): PreapprovekeysendRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: PreapprovekeysendRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): PreapprovekeysendRequest;
    static deserializeBinaryFromReader(message: PreapprovekeysendRequest, reader: jspb.BinaryReader): PreapprovekeysendRequest;
}

export namespace PreapprovekeysendRequest {
    export type AsObject = {
        destination: Uint8Array | string,
        paymentHash: Uint8Array | string,
        amountMsat?: cln_primitives_pb.Amount.AsObject,
    }
}

export class PreapprovekeysendResponse extends jspb.Message { 

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): PreapprovekeysendResponse.AsObject;
    static toObject(includeInstance: boolean, msg: PreapprovekeysendResponse): PreapprovekeysendResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: PreapprovekeysendResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): PreapprovekeysendResponse;
    static deserializeBinaryFromReader(message: PreapprovekeysendResponse, reader: jspb.BinaryReader): PreapprovekeysendResponse;
}

export namespace PreapprovekeysendResponse {
    export type AsObject = {
    }
}

export class PreapproveinvoiceRequest extends jspb.Message { 
    getBolt11(): string;
    setBolt11(value: string): PreapproveinvoiceRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): PreapproveinvoiceRequest.AsObject;
    static toObject(includeInstance: boolean, msg: PreapproveinvoiceRequest): PreapproveinvoiceRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: PreapproveinvoiceRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): PreapproveinvoiceRequest;
    static deserializeBinaryFromReader(message: PreapproveinvoiceRequest, reader: jspb.BinaryReader): PreapproveinvoiceRequest;
}

export namespace PreapproveinvoiceRequest {
    export type AsObject = {
        bolt11: string,
    }
}

export class PreapproveinvoiceResponse extends jspb.Message { 

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): PreapproveinvoiceResponse.AsObject;
    static toObject(includeInstance: boolean, msg: PreapproveinvoiceResponse): PreapproveinvoiceResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: PreapproveinvoiceResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): PreapproveinvoiceResponse;
    static deserializeBinaryFromReader(message: PreapproveinvoiceResponse, reader: jspb.BinaryReader): PreapproveinvoiceResponse;
}

export namespace PreapproveinvoiceResponse {
    export type AsObject = {
    }
}

export class StaticbackupRequest extends jspb.Message { 

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): StaticbackupRequest.AsObject;
    static toObject(includeInstance: boolean, msg: StaticbackupRequest): StaticbackupRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: StaticbackupRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): StaticbackupRequest;
    static deserializeBinaryFromReader(message: StaticbackupRequest, reader: jspb.BinaryReader): StaticbackupRequest;
}

export namespace StaticbackupRequest {
    export type AsObject = {
    }
}

export class StaticbackupResponse extends jspb.Message { 
    clearScbList(): void;
    getScbList(): Array<Uint8Array | string>;
    getScbList_asU8(): Array<Uint8Array>;
    getScbList_asB64(): Array<string>;
    setScbList(value: Array<Uint8Array | string>): StaticbackupResponse;
    addScb(value: Uint8Array | string, index?: number): Uint8Array | string;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): StaticbackupResponse.AsObject;
    static toObject(includeInstance: boolean, msg: StaticbackupResponse): StaticbackupResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: StaticbackupResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): StaticbackupResponse;
    static deserializeBinaryFromReader(message: StaticbackupResponse, reader: jspb.BinaryReader): StaticbackupResponse;
}

export namespace StaticbackupResponse {
    export type AsObject = {
        scbList: Array<Uint8Array | string>,
    }
}

export class BkprchannelsapyRequest extends jspb.Message { 

    hasStartTime(): boolean;
    clearStartTime(): void;
    getStartTime(): number | undefined;
    setStartTime(value: number): BkprchannelsapyRequest;

    hasEndTime(): boolean;
    clearEndTime(): void;
    getEndTime(): number | undefined;
    setEndTime(value: number): BkprchannelsapyRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): BkprchannelsapyRequest.AsObject;
    static toObject(includeInstance: boolean, msg: BkprchannelsapyRequest): BkprchannelsapyRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: BkprchannelsapyRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): BkprchannelsapyRequest;
    static deserializeBinaryFromReader(message: BkprchannelsapyRequest, reader: jspb.BinaryReader): BkprchannelsapyRequest;
}

export namespace BkprchannelsapyRequest {
    export type AsObject = {
        startTime?: number,
        endTime?: number,
    }
}

export class BkprchannelsapyResponse extends jspb.Message { 
    clearChannelsApyList(): void;
    getChannelsApyList(): Array<BkprchannelsapyChannels_apy>;
    setChannelsApyList(value: Array<BkprchannelsapyChannels_apy>): BkprchannelsapyResponse;
    addChannelsApy(value?: BkprchannelsapyChannels_apy, index?: number): BkprchannelsapyChannels_apy;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): BkprchannelsapyResponse.AsObject;
    static toObject(includeInstance: boolean, msg: BkprchannelsapyResponse): BkprchannelsapyResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: BkprchannelsapyResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): BkprchannelsapyResponse;
    static deserializeBinaryFromReader(message: BkprchannelsapyResponse, reader: jspb.BinaryReader): BkprchannelsapyResponse;
}

export namespace BkprchannelsapyResponse {
    export type AsObject = {
        channelsApyList: Array<BkprchannelsapyChannels_apy.AsObject>,
    }
}

export class BkprchannelsapyChannels_apy extends jspb.Message { 
    getAccount(): string;
    setAccount(value: string): BkprchannelsapyChannels_apy;

    hasRoutedOutMsat(): boolean;
    clearRoutedOutMsat(): void;
    getRoutedOutMsat(): cln_primitives_pb.Amount | undefined;
    setRoutedOutMsat(value?: cln_primitives_pb.Amount): BkprchannelsapyChannels_apy;

    hasRoutedInMsat(): boolean;
    clearRoutedInMsat(): void;
    getRoutedInMsat(): cln_primitives_pb.Amount | undefined;
    setRoutedInMsat(value?: cln_primitives_pb.Amount): BkprchannelsapyChannels_apy;

    hasLeaseFeePaidMsat(): boolean;
    clearLeaseFeePaidMsat(): void;
    getLeaseFeePaidMsat(): cln_primitives_pb.Amount | undefined;
    setLeaseFeePaidMsat(value?: cln_primitives_pb.Amount): BkprchannelsapyChannels_apy;

    hasLeaseFeeEarnedMsat(): boolean;
    clearLeaseFeeEarnedMsat(): void;
    getLeaseFeeEarnedMsat(): cln_primitives_pb.Amount | undefined;
    setLeaseFeeEarnedMsat(value?: cln_primitives_pb.Amount): BkprchannelsapyChannels_apy;

    hasPushedOutMsat(): boolean;
    clearPushedOutMsat(): void;
    getPushedOutMsat(): cln_primitives_pb.Amount | undefined;
    setPushedOutMsat(value?: cln_primitives_pb.Amount): BkprchannelsapyChannels_apy;

    hasPushedInMsat(): boolean;
    clearPushedInMsat(): void;
    getPushedInMsat(): cln_primitives_pb.Amount | undefined;
    setPushedInMsat(value?: cln_primitives_pb.Amount): BkprchannelsapyChannels_apy;

    hasOurStartBalanceMsat(): boolean;
    clearOurStartBalanceMsat(): void;
    getOurStartBalanceMsat(): cln_primitives_pb.Amount | undefined;
    setOurStartBalanceMsat(value?: cln_primitives_pb.Amount): BkprchannelsapyChannels_apy;

    hasChannelStartBalanceMsat(): boolean;
    clearChannelStartBalanceMsat(): void;
    getChannelStartBalanceMsat(): cln_primitives_pb.Amount | undefined;
    setChannelStartBalanceMsat(value?: cln_primitives_pb.Amount): BkprchannelsapyChannels_apy;

    hasFeesOutMsat(): boolean;
    clearFeesOutMsat(): void;
    getFeesOutMsat(): cln_primitives_pb.Amount | undefined;
    setFeesOutMsat(value?: cln_primitives_pb.Amount): BkprchannelsapyChannels_apy;

    hasFeesInMsat(): boolean;
    clearFeesInMsat(): void;
    getFeesInMsat(): cln_primitives_pb.Amount | undefined;
    setFeesInMsat(value?: cln_primitives_pb.Amount): BkprchannelsapyChannels_apy;
    getUtilizationOut(): string;
    setUtilizationOut(value: string): BkprchannelsapyChannels_apy;

    hasUtilizationOutInitial(): boolean;
    clearUtilizationOutInitial(): void;
    getUtilizationOutInitial(): string | undefined;
    setUtilizationOutInitial(value: string): BkprchannelsapyChannels_apy;
    getUtilizationIn(): string;
    setUtilizationIn(value: string): BkprchannelsapyChannels_apy;

    hasUtilizationInInitial(): boolean;
    clearUtilizationInInitial(): void;
    getUtilizationInInitial(): string | undefined;
    setUtilizationInInitial(value: string): BkprchannelsapyChannels_apy;
    getApyOut(): string;
    setApyOut(value: string): BkprchannelsapyChannels_apy;

    hasApyOutInitial(): boolean;
    clearApyOutInitial(): void;
    getApyOutInitial(): string | undefined;
    setApyOutInitial(value: string): BkprchannelsapyChannels_apy;
    getApyIn(): string;
    setApyIn(value: string): BkprchannelsapyChannels_apy;

    hasApyInInitial(): boolean;
    clearApyInInitial(): void;
    getApyInInitial(): string | undefined;
    setApyInInitial(value: string): BkprchannelsapyChannels_apy;
    getApyTotal(): string;
    setApyTotal(value: string): BkprchannelsapyChannels_apy;

    hasApyTotalInitial(): boolean;
    clearApyTotalInitial(): void;
    getApyTotalInitial(): string | undefined;
    setApyTotalInitial(value: string): BkprchannelsapyChannels_apy;

    hasApyLease(): boolean;
    clearApyLease(): void;
    getApyLease(): string | undefined;
    setApyLease(value: string): BkprchannelsapyChannels_apy;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): BkprchannelsapyChannels_apy.AsObject;
    static toObject(includeInstance: boolean, msg: BkprchannelsapyChannels_apy): BkprchannelsapyChannels_apy.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: BkprchannelsapyChannels_apy, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): BkprchannelsapyChannels_apy;
    static deserializeBinaryFromReader(message: BkprchannelsapyChannels_apy, reader: jspb.BinaryReader): BkprchannelsapyChannels_apy;
}

export namespace BkprchannelsapyChannels_apy {
    export type AsObject = {
        account: string,
        routedOutMsat?: cln_primitives_pb.Amount.AsObject,
        routedInMsat?: cln_primitives_pb.Amount.AsObject,
        leaseFeePaidMsat?: cln_primitives_pb.Amount.AsObject,
        leaseFeeEarnedMsat?: cln_primitives_pb.Amount.AsObject,
        pushedOutMsat?: cln_primitives_pb.Amount.AsObject,
        pushedInMsat?: cln_primitives_pb.Amount.AsObject,
        ourStartBalanceMsat?: cln_primitives_pb.Amount.AsObject,
        channelStartBalanceMsat?: cln_primitives_pb.Amount.AsObject,
        feesOutMsat?: cln_primitives_pb.Amount.AsObject,
        feesInMsat?: cln_primitives_pb.Amount.AsObject,
        utilizationOut: string,
        utilizationOutInitial?: string,
        utilizationIn: string,
        utilizationInInitial?: string,
        apyOut: string,
        apyOutInitial?: string,
        apyIn: string,
        apyInInitial?: string,
        apyTotal: string,
        apyTotalInitial?: string,
        apyLease?: string,
    }
}

export class BkprdumpincomecsvRequest extends jspb.Message { 
    getCsvFormat(): string;
    setCsvFormat(value: string): BkprdumpincomecsvRequest;

    hasCsvFile(): boolean;
    clearCsvFile(): void;
    getCsvFile(): string | undefined;
    setCsvFile(value: string): BkprdumpincomecsvRequest;

    hasConsolidateFees(): boolean;
    clearConsolidateFees(): void;
    getConsolidateFees(): boolean | undefined;
    setConsolidateFees(value: boolean): BkprdumpincomecsvRequest;

    hasStartTime(): boolean;
    clearStartTime(): void;
    getStartTime(): number | undefined;
    setStartTime(value: number): BkprdumpincomecsvRequest;

    hasEndTime(): boolean;
    clearEndTime(): void;
    getEndTime(): number | undefined;
    setEndTime(value: number): BkprdumpincomecsvRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): BkprdumpincomecsvRequest.AsObject;
    static toObject(includeInstance: boolean, msg: BkprdumpincomecsvRequest): BkprdumpincomecsvRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: BkprdumpincomecsvRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): BkprdumpincomecsvRequest;
    static deserializeBinaryFromReader(message: BkprdumpincomecsvRequest, reader: jspb.BinaryReader): BkprdumpincomecsvRequest;
}

export namespace BkprdumpincomecsvRequest {
    export type AsObject = {
        csvFormat: string,
        csvFile?: string,
        consolidateFees?: boolean,
        startTime?: number,
        endTime?: number,
    }
}

export class BkprdumpincomecsvResponse extends jspb.Message { 
    getCsvFile(): string;
    setCsvFile(value: string): BkprdumpincomecsvResponse;
    getCsvFormat(): BkprdumpincomecsvResponse.BkprdumpincomecsvCsv_format;
    setCsvFormat(value: BkprdumpincomecsvResponse.BkprdumpincomecsvCsv_format): BkprdumpincomecsvResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): BkprdumpincomecsvResponse.AsObject;
    static toObject(includeInstance: boolean, msg: BkprdumpincomecsvResponse): BkprdumpincomecsvResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: BkprdumpincomecsvResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): BkprdumpincomecsvResponse;
    static deserializeBinaryFromReader(message: BkprdumpincomecsvResponse, reader: jspb.BinaryReader): BkprdumpincomecsvResponse;
}

export namespace BkprdumpincomecsvResponse {
    export type AsObject = {
        csvFile: string,
        csvFormat: BkprdumpincomecsvResponse.BkprdumpincomecsvCsv_format,
    }

    export enum BkprdumpincomecsvCsv_format {
    COINTRACKER = 0,
    KOINLY = 1,
    HARMONY = 2,
    QUICKBOOKS = 3,
    }

}

export class BkprinspectRequest extends jspb.Message { 
    getAccount(): string;
    setAccount(value: string): BkprinspectRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): BkprinspectRequest.AsObject;
    static toObject(includeInstance: boolean, msg: BkprinspectRequest): BkprinspectRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: BkprinspectRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): BkprinspectRequest;
    static deserializeBinaryFromReader(message: BkprinspectRequest, reader: jspb.BinaryReader): BkprinspectRequest;
}

export namespace BkprinspectRequest {
    export type AsObject = {
        account: string,
    }
}

export class BkprinspectResponse extends jspb.Message { 
    clearTxsList(): void;
    getTxsList(): Array<BkprinspectTxs>;
    setTxsList(value: Array<BkprinspectTxs>): BkprinspectResponse;
    addTxs(value?: BkprinspectTxs, index?: number): BkprinspectTxs;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): BkprinspectResponse.AsObject;
    static toObject(includeInstance: boolean, msg: BkprinspectResponse): BkprinspectResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: BkprinspectResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): BkprinspectResponse;
    static deserializeBinaryFromReader(message: BkprinspectResponse, reader: jspb.BinaryReader): BkprinspectResponse;
}

export namespace BkprinspectResponse {
    export type AsObject = {
        txsList: Array<BkprinspectTxs.AsObject>,
    }
}

export class BkprinspectTxs extends jspb.Message { 
    getTxid(): Uint8Array | string;
    getTxid_asU8(): Uint8Array;
    getTxid_asB64(): string;
    setTxid(value: Uint8Array | string): BkprinspectTxs;

    hasBlockheight(): boolean;
    clearBlockheight(): void;
    getBlockheight(): number | undefined;
    setBlockheight(value: number): BkprinspectTxs;

    hasFeesPaidMsat(): boolean;
    clearFeesPaidMsat(): void;
    getFeesPaidMsat(): cln_primitives_pb.Amount | undefined;
    setFeesPaidMsat(value?: cln_primitives_pb.Amount): BkprinspectTxs;
    clearOutputsList(): void;
    getOutputsList(): Array<BkprinspectTxsOutputs>;
    setOutputsList(value: Array<BkprinspectTxsOutputs>): BkprinspectTxs;
    addOutputs(value?: BkprinspectTxsOutputs, index?: number): BkprinspectTxsOutputs;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): BkprinspectTxs.AsObject;
    static toObject(includeInstance: boolean, msg: BkprinspectTxs): BkprinspectTxs.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: BkprinspectTxs, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): BkprinspectTxs;
    static deserializeBinaryFromReader(message: BkprinspectTxs, reader: jspb.BinaryReader): BkprinspectTxs;
}

export namespace BkprinspectTxs {
    export type AsObject = {
        txid: Uint8Array | string,
        blockheight?: number,
        feesPaidMsat?: cln_primitives_pb.Amount.AsObject,
        outputsList: Array<BkprinspectTxsOutputs.AsObject>,
    }
}

export class BkprinspectTxsOutputs extends jspb.Message { 
    getAccount(): string;
    setAccount(value: string): BkprinspectTxsOutputs;
    getOutnum(): number;
    setOutnum(value: number): BkprinspectTxsOutputs;

    hasOutputValueMsat(): boolean;
    clearOutputValueMsat(): void;
    getOutputValueMsat(): cln_primitives_pb.Amount | undefined;
    setOutputValueMsat(value?: cln_primitives_pb.Amount): BkprinspectTxsOutputs;
    getCurrency(): string;
    setCurrency(value: string): BkprinspectTxsOutputs;

    hasCreditMsat(): boolean;
    clearCreditMsat(): void;
    getCreditMsat(): cln_primitives_pb.Amount | undefined;
    setCreditMsat(value?: cln_primitives_pb.Amount): BkprinspectTxsOutputs;

    hasDebitMsat(): boolean;
    clearDebitMsat(): void;
    getDebitMsat(): cln_primitives_pb.Amount | undefined;
    setDebitMsat(value?: cln_primitives_pb.Amount): BkprinspectTxsOutputs;

    hasOriginatingAccount(): boolean;
    clearOriginatingAccount(): void;
    getOriginatingAccount(): string | undefined;
    setOriginatingAccount(value: string): BkprinspectTxsOutputs;

    hasOutputTag(): boolean;
    clearOutputTag(): void;
    getOutputTag(): string | undefined;
    setOutputTag(value: string): BkprinspectTxsOutputs;

    hasSpendTag(): boolean;
    clearSpendTag(): void;
    getSpendTag(): string | undefined;
    setSpendTag(value: string): BkprinspectTxsOutputs;

    hasSpendingTxid(): boolean;
    clearSpendingTxid(): void;
    getSpendingTxid(): Uint8Array | string;
    getSpendingTxid_asU8(): Uint8Array;
    getSpendingTxid_asB64(): string;
    setSpendingTxid(value: Uint8Array | string): BkprinspectTxsOutputs;

    hasPaymentId(): boolean;
    clearPaymentId(): void;
    getPaymentId(): Uint8Array | string;
    getPaymentId_asU8(): Uint8Array;
    getPaymentId_asB64(): string;
    setPaymentId(value: Uint8Array | string): BkprinspectTxsOutputs;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): BkprinspectTxsOutputs.AsObject;
    static toObject(includeInstance: boolean, msg: BkprinspectTxsOutputs): BkprinspectTxsOutputs.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: BkprinspectTxsOutputs, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): BkprinspectTxsOutputs;
    static deserializeBinaryFromReader(message: BkprinspectTxsOutputs, reader: jspb.BinaryReader): BkprinspectTxsOutputs;
}

export namespace BkprinspectTxsOutputs {
    export type AsObject = {
        account: string,
        outnum: number,
        outputValueMsat?: cln_primitives_pb.Amount.AsObject,
        currency: string,
        creditMsat?: cln_primitives_pb.Amount.AsObject,
        debitMsat?: cln_primitives_pb.Amount.AsObject,
        originatingAccount?: string,
        outputTag?: string,
        spendTag?: string,
        spendingTxid: Uint8Array | string,
        paymentId: Uint8Array | string,
    }
}

export class BkprlistaccounteventsRequest extends jspb.Message { 

    hasAccount(): boolean;
    clearAccount(): void;
    getAccount(): string | undefined;
    setAccount(value: string): BkprlistaccounteventsRequest;

    hasPaymentId(): boolean;
    clearPaymentId(): void;
    getPaymentId(): string | undefined;
    setPaymentId(value: string): BkprlistaccounteventsRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): BkprlistaccounteventsRequest.AsObject;
    static toObject(includeInstance: boolean, msg: BkprlistaccounteventsRequest): BkprlistaccounteventsRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: BkprlistaccounteventsRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): BkprlistaccounteventsRequest;
    static deserializeBinaryFromReader(message: BkprlistaccounteventsRequest, reader: jspb.BinaryReader): BkprlistaccounteventsRequest;
}

export namespace BkprlistaccounteventsRequest {
    export type AsObject = {
        account?: string,
        paymentId?: string,
    }
}

export class BkprlistaccounteventsResponse extends jspb.Message { 
    clearEventsList(): void;
    getEventsList(): Array<BkprlistaccounteventsEvents>;
    setEventsList(value: Array<BkprlistaccounteventsEvents>): BkprlistaccounteventsResponse;
    addEvents(value?: BkprlistaccounteventsEvents, index?: number): BkprlistaccounteventsEvents;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): BkprlistaccounteventsResponse.AsObject;
    static toObject(includeInstance: boolean, msg: BkprlistaccounteventsResponse): BkprlistaccounteventsResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: BkprlistaccounteventsResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): BkprlistaccounteventsResponse;
    static deserializeBinaryFromReader(message: BkprlistaccounteventsResponse, reader: jspb.BinaryReader): BkprlistaccounteventsResponse;
}

export namespace BkprlistaccounteventsResponse {
    export type AsObject = {
        eventsList: Array<BkprlistaccounteventsEvents.AsObject>,
    }
}

export class BkprlistaccounteventsEvents extends jspb.Message { 
    getAccount(): string;
    setAccount(value: string): BkprlistaccounteventsEvents;
    getItemType(): BkprlistaccounteventsEvents.BkprlistaccounteventsEventsType;
    setItemType(value: BkprlistaccounteventsEvents.BkprlistaccounteventsEventsType): BkprlistaccounteventsEvents;
    getTag(): string;
    setTag(value: string): BkprlistaccounteventsEvents;

    hasCreditMsat(): boolean;
    clearCreditMsat(): void;
    getCreditMsat(): cln_primitives_pb.Amount | undefined;
    setCreditMsat(value?: cln_primitives_pb.Amount): BkprlistaccounteventsEvents;

    hasDebitMsat(): boolean;
    clearDebitMsat(): void;
    getDebitMsat(): cln_primitives_pb.Amount | undefined;
    setDebitMsat(value?: cln_primitives_pb.Amount): BkprlistaccounteventsEvents;
    getCurrency(): string;
    setCurrency(value: string): BkprlistaccounteventsEvents;
    getTimestamp(): number;
    setTimestamp(value: number): BkprlistaccounteventsEvents;

    hasOutpoint(): boolean;
    clearOutpoint(): void;
    getOutpoint(): string | undefined;
    setOutpoint(value: string): BkprlistaccounteventsEvents;

    hasBlockheight(): boolean;
    clearBlockheight(): void;
    getBlockheight(): number | undefined;
    setBlockheight(value: number): BkprlistaccounteventsEvents;

    hasOrigin(): boolean;
    clearOrigin(): void;
    getOrigin(): string | undefined;
    setOrigin(value: string): BkprlistaccounteventsEvents;

    hasPaymentId(): boolean;
    clearPaymentId(): void;
    getPaymentId(): Uint8Array | string;
    getPaymentId_asU8(): Uint8Array;
    getPaymentId_asB64(): string;
    setPaymentId(value: Uint8Array | string): BkprlistaccounteventsEvents;

    hasTxid(): boolean;
    clearTxid(): void;
    getTxid(): Uint8Array | string;
    getTxid_asU8(): Uint8Array;
    getTxid_asB64(): string;
    setTxid(value: Uint8Array | string): BkprlistaccounteventsEvents;

    hasDescription(): boolean;
    clearDescription(): void;
    getDescription(): string | undefined;
    setDescription(value: string): BkprlistaccounteventsEvents;

    hasFeesMsat(): boolean;
    clearFeesMsat(): void;
    getFeesMsat(): cln_primitives_pb.Amount | undefined;
    setFeesMsat(value?: cln_primitives_pb.Amount): BkprlistaccounteventsEvents;

    hasIsRebalance(): boolean;
    clearIsRebalance(): void;
    getIsRebalance(): boolean | undefined;
    setIsRebalance(value: boolean): BkprlistaccounteventsEvents;

    hasPartId(): boolean;
    clearPartId(): void;
    getPartId(): number | undefined;
    setPartId(value: number): BkprlistaccounteventsEvents;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): BkprlistaccounteventsEvents.AsObject;
    static toObject(includeInstance: boolean, msg: BkprlistaccounteventsEvents): BkprlistaccounteventsEvents.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: BkprlistaccounteventsEvents, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): BkprlistaccounteventsEvents;
    static deserializeBinaryFromReader(message: BkprlistaccounteventsEvents, reader: jspb.BinaryReader): BkprlistaccounteventsEvents;
}

export namespace BkprlistaccounteventsEvents {
    export type AsObject = {
        account: string,
        itemType: BkprlistaccounteventsEvents.BkprlistaccounteventsEventsType,
        tag: string,
        creditMsat?: cln_primitives_pb.Amount.AsObject,
        debitMsat?: cln_primitives_pb.Amount.AsObject,
        currency: string,
        timestamp: number,
        outpoint?: string,
        blockheight?: number,
        origin?: string,
        paymentId: Uint8Array | string,
        txid: Uint8Array | string,
        description?: string,
        feesMsat?: cln_primitives_pb.Amount.AsObject,
        isRebalance?: boolean,
        partId?: number,
    }

    export enum BkprlistaccounteventsEventsType {
    ONCHAIN_FEE = 0,
    CHAIN = 1,
    CHANNEL = 2,
    }

}

export class BkprlistbalancesRequest extends jspb.Message { 

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): BkprlistbalancesRequest.AsObject;
    static toObject(includeInstance: boolean, msg: BkprlistbalancesRequest): BkprlistbalancesRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: BkprlistbalancesRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): BkprlistbalancesRequest;
    static deserializeBinaryFromReader(message: BkprlistbalancesRequest, reader: jspb.BinaryReader): BkprlistbalancesRequest;
}

export namespace BkprlistbalancesRequest {
    export type AsObject = {
    }
}

export class BkprlistbalancesResponse extends jspb.Message { 
    clearAccountsList(): void;
    getAccountsList(): Array<BkprlistbalancesAccounts>;
    setAccountsList(value: Array<BkprlistbalancesAccounts>): BkprlistbalancesResponse;
    addAccounts(value?: BkprlistbalancesAccounts, index?: number): BkprlistbalancesAccounts;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): BkprlistbalancesResponse.AsObject;
    static toObject(includeInstance: boolean, msg: BkprlistbalancesResponse): BkprlistbalancesResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: BkprlistbalancesResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): BkprlistbalancesResponse;
    static deserializeBinaryFromReader(message: BkprlistbalancesResponse, reader: jspb.BinaryReader): BkprlistbalancesResponse;
}

export namespace BkprlistbalancesResponse {
    export type AsObject = {
        accountsList: Array<BkprlistbalancesAccounts.AsObject>,
    }
}

export class BkprlistbalancesAccounts extends jspb.Message { 
    getAccount(): string;
    setAccount(value: string): BkprlistbalancesAccounts;
    clearBalancesList(): void;
    getBalancesList(): Array<BkprlistbalancesAccountsBalances>;
    setBalancesList(value: Array<BkprlistbalancesAccountsBalances>): BkprlistbalancesAccounts;
    addBalances(value?: BkprlistbalancesAccountsBalances, index?: number): BkprlistbalancesAccountsBalances;

    hasPeerId(): boolean;
    clearPeerId(): void;
    getPeerId(): Uint8Array | string;
    getPeerId_asU8(): Uint8Array;
    getPeerId_asB64(): string;
    setPeerId(value: Uint8Array | string): BkprlistbalancesAccounts;

    hasWeOpened(): boolean;
    clearWeOpened(): void;
    getWeOpened(): boolean | undefined;
    setWeOpened(value: boolean): BkprlistbalancesAccounts;

    hasAccountClosed(): boolean;
    clearAccountClosed(): void;
    getAccountClosed(): boolean | undefined;
    setAccountClosed(value: boolean): BkprlistbalancesAccounts;

    hasAccountResolved(): boolean;
    clearAccountResolved(): void;
    getAccountResolved(): boolean | undefined;
    setAccountResolved(value: boolean): BkprlistbalancesAccounts;

    hasResolvedAtBlock(): boolean;
    clearResolvedAtBlock(): void;
    getResolvedAtBlock(): number | undefined;
    setResolvedAtBlock(value: number): BkprlistbalancesAccounts;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): BkprlistbalancesAccounts.AsObject;
    static toObject(includeInstance: boolean, msg: BkprlistbalancesAccounts): BkprlistbalancesAccounts.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: BkprlistbalancesAccounts, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): BkprlistbalancesAccounts;
    static deserializeBinaryFromReader(message: BkprlistbalancesAccounts, reader: jspb.BinaryReader): BkprlistbalancesAccounts;
}

export namespace BkprlistbalancesAccounts {
    export type AsObject = {
        account: string,
        balancesList: Array<BkprlistbalancesAccountsBalances.AsObject>,
        peerId: Uint8Array | string,
        weOpened?: boolean,
        accountClosed?: boolean,
        accountResolved?: boolean,
        resolvedAtBlock?: number,
    }
}

export class BkprlistbalancesAccountsBalances extends jspb.Message { 

    hasBalanceMsat(): boolean;
    clearBalanceMsat(): void;
    getBalanceMsat(): cln_primitives_pb.Amount | undefined;
    setBalanceMsat(value?: cln_primitives_pb.Amount): BkprlistbalancesAccountsBalances;
    getCoinType(): string;
    setCoinType(value: string): BkprlistbalancesAccountsBalances;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): BkprlistbalancesAccountsBalances.AsObject;
    static toObject(includeInstance: boolean, msg: BkprlistbalancesAccountsBalances): BkprlistbalancesAccountsBalances.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: BkprlistbalancesAccountsBalances, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): BkprlistbalancesAccountsBalances;
    static deserializeBinaryFromReader(message: BkprlistbalancesAccountsBalances, reader: jspb.BinaryReader): BkprlistbalancesAccountsBalances;
}

export namespace BkprlistbalancesAccountsBalances {
    export type AsObject = {
        balanceMsat?: cln_primitives_pb.Amount.AsObject,
        coinType: string,
    }
}

export class BkprlistincomeRequest extends jspb.Message { 

    hasConsolidateFees(): boolean;
    clearConsolidateFees(): void;
    getConsolidateFees(): boolean | undefined;
    setConsolidateFees(value: boolean): BkprlistincomeRequest;

    hasStartTime(): boolean;
    clearStartTime(): void;
    getStartTime(): number | undefined;
    setStartTime(value: number): BkprlistincomeRequest;

    hasEndTime(): boolean;
    clearEndTime(): void;
    getEndTime(): number | undefined;
    setEndTime(value: number): BkprlistincomeRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): BkprlistincomeRequest.AsObject;
    static toObject(includeInstance: boolean, msg: BkprlistincomeRequest): BkprlistincomeRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: BkprlistincomeRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): BkprlistincomeRequest;
    static deserializeBinaryFromReader(message: BkprlistincomeRequest, reader: jspb.BinaryReader): BkprlistincomeRequest;
}

export namespace BkprlistincomeRequest {
    export type AsObject = {
        consolidateFees?: boolean,
        startTime?: number,
        endTime?: number,
    }
}

export class BkprlistincomeResponse extends jspb.Message { 
    clearIncomeEventsList(): void;
    getIncomeEventsList(): Array<BkprlistincomeIncome_events>;
    setIncomeEventsList(value: Array<BkprlistincomeIncome_events>): BkprlistincomeResponse;
    addIncomeEvents(value?: BkprlistincomeIncome_events, index?: number): BkprlistincomeIncome_events;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): BkprlistincomeResponse.AsObject;
    static toObject(includeInstance: boolean, msg: BkprlistincomeResponse): BkprlistincomeResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: BkprlistincomeResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): BkprlistincomeResponse;
    static deserializeBinaryFromReader(message: BkprlistincomeResponse, reader: jspb.BinaryReader): BkprlistincomeResponse;
}

export namespace BkprlistincomeResponse {
    export type AsObject = {
        incomeEventsList: Array<BkprlistincomeIncome_events.AsObject>,
    }
}

export class BkprlistincomeIncome_events extends jspb.Message { 
    getAccount(): string;
    setAccount(value: string): BkprlistincomeIncome_events;
    getTag(): string;
    setTag(value: string): BkprlistincomeIncome_events;

    hasCreditMsat(): boolean;
    clearCreditMsat(): void;
    getCreditMsat(): cln_primitives_pb.Amount | undefined;
    setCreditMsat(value?: cln_primitives_pb.Amount): BkprlistincomeIncome_events;

    hasDebitMsat(): boolean;
    clearDebitMsat(): void;
    getDebitMsat(): cln_primitives_pb.Amount | undefined;
    setDebitMsat(value?: cln_primitives_pb.Amount): BkprlistincomeIncome_events;
    getCurrency(): string;
    setCurrency(value: string): BkprlistincomeIncome_events;
    getTimestamp(): number;
    setTimestamp(value: number): BkprlistincomeIncome_events;

    hasDescription(): boolean;
    clearDescription(): void;
    getDescription(): string | undefined;
    setDescription(value: string): BkprlistincomeIncome_events;

    hasOutpoint(): boolean;
    clearOutpoint(): void;
    getOutpoint(): string | undefined;
    setOutpoint(value: string): BkprlistincomeIncome_events;

    hasTxid(): boolean;
    clearTxid(): void;
    getTxid(): Uint8Array | string;
    getTxid_asU8(): Uint8Array;
    getTxid_asB64(): string;
    setTxid(value: Uint8Array | string): BkprlistincomeIncome_events;

    hasPaymentId(): boolean;
    clearPaymentId(): void;
    getPaymentId(): Uint8Array | string;
    getPaymentId_asU8(): Uint8Array;
    getPaymentId_asB64(): string;
    setPaymentId(value: Uint8Array | string): BkprlistincomeIncome_events;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): BkprlistincomeIncome_events.AsObject;
    static toObject(includeInstance: boolean, msg: BkprlistincomeIncome_events): BkprlistincomeIncome_events.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: BkprlistincomeIncome_events, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): BkprlistincomeIncome_events;
    static deserializeBinaryFromReader(message: BkprlistincomeIncome_events, reader: jspb.BinaryReader): BkprlistincomeIncome_events;
}

export namespace BkprlistincomeIncome_events {
    export type AsObject = {
        account: string,
        tag: string,
        creditMsat?: cln_primitives_pb.Amount.AsObject,
        debitMsat?: cln_primitives_pb.Amount.AsObject,
        currency: string,
        timestamp: number,
        description?: string,
        outpoint?: string,
        txid: Uint8Array | string,
        paymentId: Uint8Array | string,
    }
}

export class BkpreditdescriptionbypaymentidRequest extends jspb.Message { 
    getPaymentId(): string;
    setPaymentId(value: string): BkpreditdescriptionbypaymentidRequest;
    getDescription(): string;
    setDescription(value: string): BkpreditdescriptionbypaymentidRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): BkpreditdescriptionbypaymentidRequest.AsObject;
    static toObject(includeInstance: boolean, msg: BkpreditdescriptionbypaymentidRequest): BkpreditdescriptionbypaymentidRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: BkpreditdescriptionbypaymentidRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): BkpreditdescriptionbypaymentidRequest;
    static deserializeBinaryFromReader(message: BkpreditdescriptionbypaymentidRequest, reader: jspb.BinaryReader): BkpreditdescriptionbypaymentidRequest;
}

export namespace BkpreditdescriptionbypaymentidRequest {
    export type AsObject = {
        paymentId: string,
        description: string,
    }
}

export class BkpreditdescriptionbypaymentidResponse extends jspb.Message { 
    clearUpdatedList(): void;
    getUpdatedList(): Array<BkpreditdescriptionbypaymentidUpdated>;
    setUpdatedList(value: Array<BkpreditdescriptionbypaymentidUpdated>): BkpreditdescriptionbypaymentidResponse;
    addUpdated(value?: BkpreditdescriptionbypaymentidUpdated, index?: number): BkpreditdescriptionbypaymentidUpdated;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): BkpreditdescriptionbypaymentidResponse.AsObject;
    static toObject(includeInstance: boolean, msg: BkpreditdescriptionbypaymentidResponse): BkpreditdescriptionbypaymentidResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: BkpreditdescriptionbypaymentidResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): BkpreditdescriptionbypaymentidResponse;
    static deserializeBinaryFromReader(message: BkpreditdescriptionbypaymentidResponse, reader: jspb.BinaryReader): BkpreditdescriptionbypaymentidResponse;
}

export namespace BkpreditdescriptionbypaymentidResponse {
    export type AsObject = {
        updatedList: Array<BkpreditdescriptionbypaymentidUpdated.AsObject>,
    }
}

export class BkpreditdescriptionbypaymentidUpdated extends jspb.Message { 
    getAccount(): string;
    setAccount(value: string): BkpreditdescriptionbypaymentidUpdated;
    getItemType(): BkpreditdescriptionbypaymentidUpdated.BkpreditdescriptionbypaymentidUpdatedType;
    setItemType(value: BkpreditdescriptionbypaymentidUpdated.BkpreditdescriptionbypaymentidUpdatedType): BkpreditdescriptionbypaymentidUpdated;
    getTag(): string;
    setTag(value: string): BkpreditdescriptionbypaymentidUpdated;

    hasCreditMsat(): boolean;
    clearCreditMsat(): void;
    getCreditMsat(): cln_primitives_pb.Amount | undefined;
    setCreditMsat(value?: cln_primitives_pb.Amount): BkpreditdescriptionbypaymentidUpdated;

    hasDebitMsat(): boolean;
    clearDebitMsat(): void;
    getDebitMsat(): cln_primitives_pb.Amount | undefined;
    setDebitMsat(value?: cln_primitives_pb.Amount): BkpreditdescriptionbypaymentidUpdated;
    getCurrency(): string;
    setCurrency(value: string): BkpreditdescriptionbypaymentidUpdated;
    getTimestamp(): number;
    setTimestamp(value: number): BkpreditdescriptionbypaymentidUpdated;
    getDescription(): string;
    setDescription(value: string): BkpreditdescriptionbypaymentidUpdated;

    hasOutpoint(): boolean;
    clearOutpoint(): void;
    getOutpoint(): string | undefined;
    setOutpoint(value: string): BkpreditdescriptionbypaymentidUpdated;

    hasBlockheight(): boolean;
    clearBlockheight(): void;
    getBlockheight(): number | undefined;
    setBlockheight(value: number): BkpreditdescriptionbypaymentidUpdated;

    hasOrigin(): boolean;
    clearOrigin(): void;
    getOrigin(): string | undefined;
    setOrigin(value: string): BkpreditdescriptionbypaymentidUpdated;

    hasPaymentId(): boolean;
    clearPaymentId(): void;
    getPaymentId(): Uint8Array | string;
    getPaymentId_asU8(): Uint8Array;
    getPaymentId_asB64(): string;
    setPaymentId(value: Uint8Array | string): BkpreditdescriptionbypaymentidUpdated;

    hasTxid(): boolean;
    clearTxid(): void;
    getTxid(): Uint8Array | string;
    getTxid_asU8(): Uint8Array;
    getTxid_asB64(): string;
    setTxid(value: Uint8Array | string): BkpreditdescriptionbypaymentidUpdated;

    hasFeesMsat(): boolean;
    clearFeesMsat(): void;
    getFeesMsat(): cln_primitives_pb.Amount | undefined;
    setFeesMsat(value?: cln_primitives_pb.Amount): BkpreditdescriptionbypaymentidUpdated;

    hasIsRebalance(): boolean;
    clearIsRebalance(): void;
    getIsRebalance(): boolean | undefined;
    setIsRebalance(value: boolean): BkpreditdescriptionbypaymentidUpdated;

    hasPartId(): boolean;
    clearPartId(): void;
    getPartId(): number | undefined;
    setPartId(value: number): BkpreditdescriptionbypaymentidUpdated;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): BkpreditdescriptionbypaymentidUpdated.AsObject;
    static toObject(includeInstance: boolean, msg: BkpreditdescriptionbypaymentidUpdated): BkpreditdescriptionbypaymentidUpdated.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: BkpreditdescriptionbypaymentidUpdated, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): BkpreditdescriptionbypaymentidUpdated;
    static deserializeBinaryFromReader(message: BkpreditdescriptionbypaymentidUpdated, reader: jspb.BinaryReader): BkpreditdescriptionbypaymentidUpdated;
}

export namespace BkpreditdescriptionbypaymentidUpdated {
    export type AsObject = {
        account: string,
        itemType: BkpreditdescriptionbypaymentidUpdated.BkpreditdescriptionbypaymentidUpdatedType,
        tag: string,
        creditMsat?: cln_primitives_pb.Amount.AsObject,
        debitMsat?: cln_primitives_pb.Amount.AsObject,
        currency: string,
        timestamp: number,
        description: string,
        outpoint?: string,
        blockheight?: number,
        origin?: string,
        paymentId: Uint8Array | string,
        txid: Uint8Array | string,
        feesMsat?: cln_primitives_pb.Amount.AsObject,
        isRebalance?: boolean,
        partId?: number,
    }

    export enum BkpreditdescriptionbypaymentidUpdatedType {
    CHAIN = 0,
    CHANNEL = 1,
    }

}

export class BkpreditdescriptionbyoutpointRequest extends jspb.Message { 
    getOutpoint(): string;
    setOutpoint(value: string): BkpreditdescriptionbyoutpointRequest;
    getDescription(): string;
    setDescription(value: string): BkpreditdescriptionbyoutpointRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): BkpreditdescriptionbyoutpointRequest.AsObject;
    static toObject(includeInstance: boolean, msg: BkpreditdescriptionbyoutpointRequest): BkpreditdescriptionbyoutpointRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: BkpreditdescriptionbyoutpointRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): BkpreditdescriptionbyoutpointRequest;
    static deserializeBinaryFromReader(message: BkpreditdescriptionbyoutpointRequest, reader: jspb.BinaryReader): BkpreditdescriptionbyoutpointRequest;
}

export namespace BkpreditdescriptionbyoutpointRequest {
    export type AsObject = {
        outpoint: string,
        description: string,
    }
}

export class BkpreditdescriptionbyoutpointResponse extends jspb.Message { 
    clearUpdatedList(): void;
    getUpdatedList(): Array<BkpreditdescriptionbyoutpointUpdated>;
    setUpdatedList(value: Array<BkpreditdescriptionbyoutpointUpdated>): BkpreditdescriptionbyoutpointResponse;
    addUpdated(value?: BkpreditdescriptionbyoutpointUpdated, index?: number): BkpreditdescriptionbyoutpointUpdated;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): BkpreditdescriptionbyoutpointResponse.AsObject;
    static toObject(includeInstance: boolean, msg: BkpreditdescriptionbyoutpointResponse): BkpreditdescriptionbyoutpointResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: BkpreditdescriptionbyoutpointResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): BkpreditdescriptionbyoutpointResponse;
    static deserializeBinaryFromReader(message: BkpreditdescriptionbyoutpointResponse, reader: jspb.BinaryReader): BkpreditdescriptionbyoutpointResponse;
}

export namespace BkpreditdescriptionbyoutpointResponse {
    export type AsObject = {
        updatedList: Array<BkpreditdescriptionbyoutpointUpdated.AsObject>,
    }
}

export class BkpreditdescriptionbyoutpointUpdated extends jspb.Message { 
    getAccount(): string;
    setAccount(value: string): BkpreditdescriptionbyoutpointUpdated;
    getItemType(): BkpreditdescriptionbyoutpointUpdated.BkpreditdescriptionbyoutpointUpdatedType;
    setItemType(value: BkpreditdescriptionbyoutpointUpdated.BkpreditdescriptionbyoutpointUpdatedType): BkpreditdescriptionbyoutpointUpdated;
    getTag(): string;
    setTag(value: string): BkpreditdescriptionbyoutpointUpdated;

    hasCreditMsat(): boolean;
    clearCreditMsat(): void;
    getCreditMsat(): cln_primitives_pb.Amount | undefined;
    setCreditMsat(value?: cln_primitives_pb.Amount): BkpreditdescriptionbyoutpointUpdated;

    hasDebitMsat(): boolean;
    clearDebitMsat(): void;
    getDebitMsat(): cln_primitives_pb.Amount | undefined;
    setDebitMsat(value?: cln_primitives_pb.Amount): BkpreditdescriptionbyoutpointUpdated;
    getCurrency(): string;
    setCurrency(value: string): BkpreditdescriptionbyoutpointUpdated;
    getTimestamp(): number;
    setTimestamp(value: number): BkpreditdescriptionbyoutpointUpdated;
    getDescription(): string;
    setDescription(value: string): BkpreditdescriptionbyoutpointUpdated;

    hasOutpoint(): boolean;
    clearOutpoint(): void;
    getOutpoint(): string | undefined;
    setOutpoint(value: string): BkpreditdescriptionbyoutpointUpdated;

    hasBlockheight(): boolean;
    clearBlockheight(): void;
    getBlockheight(): number | undefined;
    setBlockheight(value: number): BkpreditdescriptionbyoutpointUpdated;

    hasOrigin(): boolean;
    clearOrigin(): void;
    getOrigin(): string | undefined;
    setOrigin(value: string): BkpreditdescriptionbyoutpointUpdated;

    hasPaymentId(): boolean;
    clearPaymentId(): void;
    getPaymentId(): Uint8Array | string;
    getPaymentId_asU8(): Uint8Array;
    getPaymentId_asB64(): string;
    setPaymentId(value: Uint8Array | string): BkpreditdescriptionbyoutpointUpdated;

    hasTxid(): boolean;
    clearTxid(): void;
    getTxid(): Uint8Array | string;
    getTxid_asU8(): Uint8Array;
    getTxid_asB64(): string;
    setTxid(value: Uint8Array | string): BkpreditdescriptionbyoutpointUpdated;

    hasFeesMsat(): boolean;
    clearFeesMsat(): void;
    getFeesMsat(): cln_primitives_pb.Amount | undefined;
    setFeesMsat(value?: cln_primitives_pb.Amount): BkpreditdescriptionbyoutpointUpdated;

    hasIsRebalance(): boolean;
    clearIsRebalance(): void;
    getIsRebalance(): boolean | undefined;
    setIsRebalance(value: boolean): BkpreditdescriptionbyoutpointUpdated;

    hasPartId(): boolean;
    clearPartId(): void;
    getPartId(): number | undefined;
    setPartId(value: number): BkpreditdescriptionbyoutpointUpdated;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): BkpreditdescriptionbyoutpointUpdated.AsObject;
    static toObject(includeInstance: boolean, msg: BkpreditdescriptionbyoutpointUpdated): BkpreditdescriptionbyoutpointUpdated.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: BkpreditdescriptionbyoutpointUpdated, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): BkpreditdescriptionbyoutpointUpdated;
    static deserializeBinaryFromReader(message: BkpreditdescriptionbyoutpointUpdated, reader: jspb.BinaryReader): BkpreditdescriptionbyoutpointUpdated;
}

export namespace BkpreditdescriptionbyoutpointUpdated {
    export type AsObject = {
        account: string,
        itemType: BkpreditdescriptionbyoutpointUpdated.BkpreditdescriptionbyoutpointUpdatedType,
        tag: string,
        creditMsat?: cln_primitives_pb.Amount.AsObject,
        debitMsat?: cln_primitives_pb.Amount.AsObject,
        currency: string,
        timestamp: number,
        description: string,
        outpoint?: string,
        blockheight?: number,
        origin?: string,
        paymentId: Uint8Array | string,
        txid: Uint8Array | string,
        feesMsat?: cln_primitives_pb.Amount.AsObject,
        isRebalance?: boolean,
        partId?: number,
    }

    export enum BkpreditdescriptionbyoutpointUpdatedType {
    CHAIN = 0,
    CHANNEL = 1,
    }

}

export class BlacklistruneRequest extends jspb.Message { 

    hasStart(): boolean;
    clearStart(): void;
    getStart(): number | undefined;
    setStart(value: number): BlacklistruneRequest;

    hasEnd(): boolean;
    clearEnd(): void;
    getEnd(): number | undefined;
    setEnd(value: number): BlacklistruneRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): BlacklistruneRequest.AsObject;
    static toObject(includeInstance: boolean, msg: BlacklistruneRequest): BlacklistruneRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: BlacklistruneRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): BlacklistruneRequest;
    static deserializeBinaryFromReader(message: BlacklistruneRequest, reader: jspb.BinaryReader): BlacklistruneRequest;
}

export namespace BlacklistruneRequest {
    export type AsObject = {
        start?: number,
        end?: number,
    }
}

export class BlacklistruneResponse extends jspb.Message { 
    clearBlacklistList(): void;
    getBlacklistList(): Array<BlacklistruneBlacklist>;
    setBlacklistList(value: Array<BlacklistruneBlacklist>): BlacklistruneResponse;
    addBlacklist(value?: BlacklistruneBlacklist, index?: number): BlacklistruneBlacklist;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): BlacklistruneResponse.AsObject;
    static toObject(includeInstance: boolean, msg: BlacklistruneResponse): BlacklistruneResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: BlacklistruneResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): BlacklistruneResponse;
    static deserializeBinaryFromReader(message: BlacklistruneResponse, reader: jspb.BinaryReader): BlacklistruneResponse;
}

export namespace BlacklistruneResponse {
    export type AsObject = {
        blacklistList: Array<BlacklistruneBlacklist.AsObject>,
    }
}

export class BlacklistruneBlacklist extends jspb.Message { 
    getStart(): number;
    setStart(value: number): BlacklistruneBlacklist;
    getEnd(): number;
    setEnd(value: number): BlacklistruneBlacklist;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): BlacklistruneBlacklist.AsObject;
    static toObject(includeInstance: boolean, msg: BlacklistruneBlacklist): BlacklistruneBlacklist.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: BlacklistruneBlacklist, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): BlacklistruneBlacklist;
    static deserializeBinaryFromReader(message: BlacklistruneBlacklist, reader: jspb.BinaryReader): BlacklistruneBlacklist;
}

export namespace BlacklistruneBlacklist {
    export type AsObject = {
        start: number,
        end: number,
    }
}

export class CheckruneRequest extends jspb.Message { 
    getRune(): string;
    setRune(value: string): CheckruneRequest;

    hasNodeid(): boolean;
    clearNodeid(): void;
    getNodeid(): string | undefined;
    setNodeid(value: string): CheckruneRequest;

    hasMethod(): boolean;
    clearMethod(): void;
    getMethod(): string | undefined;
    setMethod(value: string): CheckruneRequest;
    clearParamsList(): void;
    getParamsList(): Array<string>;
    setParamsList(value: Array<string>): CheckruneRequest;
    addParams(value: string, index?: number): string;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): CheckruneRequest.AsObject;
    static toObject(includeInstance: boolean, msg: CheckruneRequest): CheckruneRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: CheckruneRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): CheckruneRequest;
    static deserializeBinaryFromReader(message: CheckruneRequest, reader: jspb.BinaryReader): CheckruneRequest;
}

export namespace CheckruneRequest {
    export type AsObject = {
        rune: string,
        nodeid?: string,
        method?: string,
        paramsList: Array<string>,
    }
}

export class CheckruneResponse extends jspb.Message { 
    getValid(): boolean;
    setValid(value: boolean): CheckruneResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): CheckruneResponse.AsObject;
    static toObject(includeInstance: boolean, msg: CheckruneResponse): CheckruneResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: CheckruneResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): CheckruneResponse;
    static deserializeBinaryFromReader(message: CheckruneResponse, reader: jspb.BinaryReader): CheckruneResponse;
}

export namespace CheckruneResponse {
    export type AsObject = {
        valid: boolean,
    }
}

export class CreateruneRequest extends jspb.Message { 

    hasRune(): boolean;
    clearRune(): void;
    getRune(): string | undefined;
    setRune(value: string): CreateruneRequest;
    clearRestrictionsList(): void;
    getRestrictionsList(): Array<string>;
    setRestrictionsList(value: Array<string>): CreateruneRequest;
    addRestrictions(value: string, index?: number): string;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): CreateruneRequest.AsObject;
    static toObject(includeInstance: boolean, msg: CreateruneRequest): CreateruneRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: CreateruneRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): CreateruneRequest;
    static deserializeBinaryFromReader(message: CreateruneRequest, reader: jspb.BinaryReader): CreateruneRequest;
}

export namespace CreateruneRequest {
    export type AsObject = {
        rune?: string,
        restrictionsList: Array<string>,
    }
}

export class CreateruneResponse extends jspb.Message { 
    getRune(): string;
    setRune(value: string): CreateruneResponse;
    getUniqueId(): string;
    setUniqueId(value: string): CreateruneResponse;

    hasWarningUnrestrictedRune(): boolean;
    clearWarningUnrestrictedRune(): void;
    getWarningUnrestrictedRune(): string | undefined;
    setWarningUnrestrictedRune(value: string): CreateruneResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): CreateruneResponse.AsObject;
    static toObject(includeInstance: boolean, msg: CreateruneResponse): CreateruneResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: CreateruneResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): CreateruneResponse;
    static deserializeBinaryFromReader(message: CreateruneResponse, reader: jspb.BinaryReader): CreateruneResponse;
}

export namespace CreateruneResponse {
    export type AsObject = {
        rune: string,
        uniqueId: string,
        warningUnrestrictedRune?: string,
    }
}

export class ShowrunesRequest extends jspb.Message { 

    hasRune(): boolean;
    clearRune(): void;
    getRune(): string | undefined;
    setRune(value: string): ShowrunesRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ShowrunesRequest.AsObject;
    static toObject(includeInstance: boolean, msg: ShowrunesRequest): ShowrunesRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ShowrunesRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ShowrunesRequest;
    static deserializeBinaryFromReader(message: ShowrunesRequest, reader: jspb.BinaryReader): ShowrunesRequest;
}

export namespace ShowrunesRequest {
    export type AsObject = {
        rune?: string,
    }
}

export class ShowrunesResponse extends jspb.Message { 
    clearRunesList(): void;
    getRunesList(): Array<ShowrunesRunes>;
    setRunesList(value: Array<ShowrunesRunes>): ShowrunesResponse;
    addRunes(value?: ShowrunesRunes, index?: number): ShowrunesRunes;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ShowrunesResponse.AsObject;
    static toObject(includeInstance: boolean, msg: ShowrunesResponse): ShowrunesResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ShowrunesResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ShowrunesResponse;
    static deserializeBinaryFromReader(message: ShowrunesResponse, reader: jspb.BinaryReader): ShowrunesResponse;
}

export namespace ShowrunesResponse {
    export type AsObject = {
        runesList: Array<ShowrunesRunes.AsObject>,
    }
}

export class ShowrunesRunes extends jspb.Message { 
    getRune(): string;
    setRune(value: string): ShowrunesRunes;
    getUniqueId(): string;
    setUniqueId(value: string): ShowrunesRunes;
    clearRestrictionsList(): void;
    getRestrictionsList(): Array<ShowrunesRunesRestrictions>;
    setRestrictionsList(value: Array<ShowrunesRunesRestrictions>): ShowrunesRunes;
    addRestrictions(value?: ShowrunesRunesRestrictions, index?: number): ShowrunesRunesRestrictions;
    getRestrictionsAsEnglish(): string;
    setRestrictionsAsEnglish(value: string): ShowrunesRunes;

    hasStored(): boolean;
    clearStored(): void;
    getStored(): boolean | undefined;
    setStored(value: boolean): ShowrunesRunes;

    hasBlacklisted(): boolean;
    clearBlacklisted(): void;
    getBlacklisted(): boolean | undefined;
    setBlacklisted(value: boolean): ShowrunesRunes;

    hasLastUsed(): boolean;
    clearLastUsed(): void;
    getLastUsed(): number | undefined;
    setLastUsed(value: number): ShowrunesRunes;

    hasOurRune(): boolean;
    clearOurRune(): void;
    getOurRune(): boolean | undefined;
    setOurRune(value: boolean): ShowrunesRunes;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ShowrunesRunes.AsObject;
    static toObject(includeInstance: boolean, msg: ShowrunesRunes): ShowrunesRunes.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ShowrunesRunes, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ShowrunesRunes;
    static deserializeBinaryFromReader(message: ShowrunesRunes, reader: jspb.BinaryReader): ShowrunesRunes;
}

export namespace ShowrunesRunes {
    export type AsObject = {
        rune: string,
        uniqueId: string,
        restrictionsList: Array<ShowrunesRunesRestrictions.AsObject>,
        restrictionsAsEnglish: string,
        stored?: boolean,
        blacklisted?: boolean,
        lastUsed?: number,
        ourRune?: boolean,
    }
}

export class ShowrunesRunesRestrictions extends jspb.Message { 
    clearAlternativesList(): void;
    getAlternativesList(): Array<ShowrunesRunesRestrictionsAlternatives>;
    setAlternativesList(value: Array<ShowrunesRunesRestrictionsAlternatives>): ShowrunesRunesRestrictions;
    addAlternatives(value?: ShowrunesRunesRestrictionsAlternatives, index?: number): ShowrunesRunesRestrictionsAlternatives;
    getEnglish(): string;
    setEnglish(value: string): ShowrunesRunesRestrictions;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ShowrunesRunesRestrictions.AsObject;
    static toObject(includeInstance: boolean, msg: ShowrunesRunesRestrictions): ShowrunesRunesRestrictions.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ShowrunesRunesRestrictions, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ShowrunesRunesRestrictions;
    static deserializeBinaryFromReader(message: ShowrunesRunesRestrictions, reader: jspb.BinaryReader): ShowrunesRunesRestrictions;
}

export namespace ShowrunesRunesRestrictions {
    export type AsObject = {
        alternativesList: Array<ShowrunesRunesRestrictionsAlternatives.AsObject>,
        english: string,
    }
}

export class ShowrunesRunesRestrictionsAlternatives extends jspb.Message { 
    getFieldname(): string;
    setFieldname(value: string): ShowrunesRunesRestrictionsAlternatives;
    getValue(): string;
    setValue(value: string): ShowrunesRunesRestrictionsAlternatives;
    getCondition(): string;
    setCondition(value: string): ShowrunesRunesRestrictionsAlternatives;
    getEnglish(): string;
    setEnglish(value: string): ShowrunesRunesRestrictionsAlternatives;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ShowrunesRunesRestrictionsAlternatives.AsObject;
    static toObject(includeInstance: boolean, msg: ShowrunesRunesRestrictionsAlternatives): ShowrunesRunesRestrictionsAlternatives.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ShowrunesRunesRestrictionsAlternatives, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ShowrunesRunesRestrictionsAlternatives;
    static deserializeBinaryFromReader(message: ShowrunesRunesRestrictionsAlternatives, reader: jspb.BinaryReader): ShowrunesRunesRestrictionsAlternatives;
}

export namespace ShowrunesRunesRestrictionsAlternatives {
    export type AsObject = {
        fieldname: string,
        value: string,
        condition: string,
        english: string,
    }
}

export class AskreneunreserveRequest extends jspb.Message { 
    clearPathList(): void;
    getPathList(): Array<AskreneunreservePath>;
    setPathList(value: Array<AskreneunreservePath>): AskreneunreserveRequest;
    addPath(value?: AskreneunreservePath, index?: number): AskreneunreservePath;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): AskreneunreserveRequest.AsObject;
    static toObject(includeInstance: boolean, msg: AskreneunreserveRequest): AskreneunreserveRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: AskreneunreserveRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): AskreneunreserveRequest;
    static deserializeBinaryFromReader(message: AskreneunreserveRequest, reader: jspb.BinaryReader): AskreneunreserveRequest;
}

export namespace AskreneunreserveRequest {
    export type AsObject = {
        pathList: Array<AskreneunreservePath.AsObject>,
    }
}

export class AskreneunreserveResponse extends jspb.Message { 

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): AskreneunreserveResponse.AsObject;
    static toObject(includeInstance: boolean, msg: AskreneunreserveResponse): AskreneunreserveResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: AskreneunreserveResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): AskreneunreserveResponse;
    static deserializeBinaryFromReader(message: AskreneunreserveResponse, reader: jspb.BinaryReader): AskreneunreserveResponse;
}

export namespace AskreneunreserveResponse {
    export type AsObject = {
    }
}

export class AskreneunreservePath extends jspb.Message { 

    hasAmountMsat(): boolean;
    clearAmountMsat(): void;
    getAmountMsat(): cln_primitives_pb.Amount | undefined;
    setAmountMsat(value?: cln_primitives_pb.Amount): AskreneunreservePath;

    hasShortChannelIdDir(): boolean;
    clearShortChannelIdDir(): void;
    getShortChannelIdDir(): string | undefined;
    setShortChannelIdDir(value: string): AskreneunreservePath;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): AskreneunreservePath.AsObject;
    static toObject(includeInstance: boolean, msg: AskreneunreservePath): AskreneunreservePath.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: AskreneunreservePath, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): AskreneunreservePath;
    static deserializeBinaryFromReader(message: AskreneunreservePath, reader: jspb.BinaryReader): AskreneunreservePath;
}

export namespace AskreneunreservePath {
    export type AsObject = {
        amountMsat?: cln_primitives_pb.Amount.AsObject,
        shortChannelIdDir?: string,
    }
}

export class AskrenelistlayersRequest extends jspb.Message { 

    hasLayer(): boolean;
    clearLayer(): void;
    getLayer(): string | undefined;
    setLayer(value: string): AskrenelistlayersRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): AskrenelistlayersRequest.AsObject;
    static toObject(includeInstance: boolean, msg: AskrenelistlayersRequest): AskrenelistlayersRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: AskrenelistlayersRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): AskrenelistlayersRequest;
    static deserializeBinaryFromReader(message: AskrenelistlayersRequest, reader: jspb.BinaryReader): AskrenelistlayersRequest;
}

export namespace AskrenelistlayersRequest {
    export type AsObject = {
        layer?: string,
    }
}

export class AskrenelistlayersResponse extends jspb.Message { 
    clearLayersList(): void;
    getLayersList(): Array<AskrenelistlayersLayers>;
    setLayersList(value: Array<AskrenelistlayersLayers>): AskrenelistlayersResponse;
    addLayers(value?: AskrenelistlayersLayers, index?: number): AskrenelistlayersLayers;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): AskrenelistlayersResponse.AsObject;
    static toObject(includeInstance: boolean, msg: AskrenelistlayersResponse): AskrenelistlayersResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: AskrenelistlayersResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): AskrenelistlayersResponse;
    static deserializeBinaryFromReader(message: AskrenelistlayersResponse, reader: jspb.BinaryReader): AskrenelistlayersResponse;
}

export namespace AskrenelistlayersResponse {
    export type AsObject = {
        layersList: Array<AskrenelistlayersLayers.AsObject>,
    }
}

export class AskrenelistlayersLayers extends jspb.Message { 
    getLayer(): string;
    setLayer(value: string): AskrenelistlayersLayers;
    clearDisabledNodesList(): void;
    getDisabledNodesList(): Array<Uint8Array | string>;
    getDisabledNodesList_asU8(): Array<Uint8Array>;
    getDisabledNodesList_asB64(): Array<string>;
    setDisabledNodesList(value: Array<Uint8Array | string>): AskrenelistlayersLayers;
    addDisabledNodes(value: Uint8Array | string, index?: number): Uint8Array | string;
    clearCreatedChannelsList(): void;
    getCreatedChannelsList(): Array<AskrenelistlayersLayersCreated_channels>;
    setCreatedChannelsList(value: Array<AskrenelistlayersLayersCreated_channels>): AskrenelistlayersLayers;
    addCreatedChannels(value?: AskrenelistlayersLayersCreated_channels, index?: number): AskrenelistlayersLayersCreated_channels;
    clearConstraintsList(): void;
    getConstraintsList(): Array<AskrenelistlayersLayersConstraints>;
    setConstraintsList(value: Array<AskrenelistlayersLayersConstraints>): AskrenelistlayersLayers;
    addConstraints(value?: AskrenelistlayersLayersConstraints, index?: number): AskrenelistlayersLayersConstraints;

    hasPersistent(): boolean;
    clearPersistent(): void;
    getPersistent(): boolean | undefined;
    setPersistent(value: boolean): AskrenelistlayersLayers;
    clearDisabledChannelsList(): void;
    getDisabledChannelsList(): Array<string>;
    setDisabledChannelsList(value: Array<string>): AskrenelistlayersLayers;
    addDisabledChannels(value: string, index?: number): string;
    clearChannelUpdatesList(): void;
    getChannelUpdatesList(): Array<AskrenelistlayersLayersChannel_updates>;
    setChannelUpdatesList(value: Array<AskrenelistlayersLayersChannel_updates>): AskrenelistlayersLayers;
    addChannelUpdates(value?: AskrenelistlayersLayersChannel_updates, index?: number): AskrenelistlayersLayersChannel_updates;
    clearBiasesList(): void;
    getBiasesList(): Array<AskrenelistlayersLayersBiases>;
    setBiasesList(value: Array<AskrenelistlayersLayersBiases>): AskrenelistlayersLayers;
    addBiases(value?: AskrenelistlayersLayersBiases, index?: number): AskrenelistlayersLayersBiases;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): AskrenelistlayersLayers.AsObject;
    static toObject(includeInstance: boolean, msg: AskrenelistlayersLayers): AskrenelistlayersLayers.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: AskrenelistlayersLayers, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): AskrenelistlayersLayers;
    static deserializeBinaryFromReader(message: AskrenelistlayersLayers, reader: jspb.BinaryReader): AskrenelistlayersLayers;
}

export namespace AskrenelistlayersLayers {
    export type AsObject = {
        layer: string,
        disabledNodesList: Array<Uint8Array | string>,
        createdChannelsList: Array<AskrenelistlayersLayersCreated_channels.AsObject>,
        constraintsList: Array<AskrenelistlayersLayersConstraints.AsObject>,
        persistent?: boolean,
        disabledChannelsList: Array<string>,
        channelUpdatesList: Array<AskrenelistlayersLayersChannel_updates.AsObject>,
        biasesList: Array<AskrenelistlayersLayersBiases.AsObject>,
    }
}

export class AskrenelistlayersLayersCreated_channels extends jspb.Message { 
    getSource(): Uint8Array | string;
    getSource_asU8(): Uint8Array;
    getSource_asB64(): string;
    setSource(value: Uint8Array | string): AskrenelistlayersLayersCreated_channels;
    getDestination(): Uint8Array | string;
    getDestination_asU8(): Uint8Array;
    getDestination_asB64(): string;
    setDestination(value: Uint8Array | string): AskrenelistlayersLayersCreated_channels;
    getShortChannelId(): string;
    setShortChannelId(value: string): AskrenelistlayersLayersCreated_channels;

    hasCapacityMsat(): boolean;
    clearCapacityMsat(): void;
    getCapacityMsat(): cln_primitives_pb.Amount | undefined;
    setCapacityMsat(value?: cln_primitives_pb.Amount): AskrenelistlayersLayersCreated_channels;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): AskrenelistlayersLayersCreated_channels.AsObject;
    static toObject(includeInstance: boolean, msg: AskrenelistlayersLayersCreated_channels): AskrenelistlayersLayersCreated_channels.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: AskrenelistlayersLayersCreated_channels, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): AskrenelistlayersLayersCreated_channels;
    static deserializeBinaryFromReader(message: AskrenelistlayersLayersCreated_channels, reader: jspb.BinaryReader): AskrenelistlayersLayersCreated_channels;
}

export namespace AskrenelistlayersLayersCreated_channels {
    export type AsObject = {
        source: Uint8Array | string,
        destination: Uint8Array | string,
        shortChannelId: string,
        capacityMsat?: cln_primitives_pb.Amount.AsObject,
    }
}

export class AskrenelistlayersLayersChannel_updates extends jspb.Message { 
    getShortChannelIdDir(): string;
    setShortChannelIdDir(value: string): AskrenelistlayersLayersChannel_updates;

    hasEnabled(): boolean;
    clearEnabled(): void;
    getEnabled(): boolean | undefined;
    setEnabled(value: boolean): AskrenelistlayersLayersChannel_updates;

    hasHtlcMinimumMsat(): boolean;
    clearHtlcMinimumMsat(): void;
    getHtlcMinimumMsat(): cln_primitives_pb.Amount | undefined;
    setHtlcMinimumMsat(value?: cln_primitives_pb.Amount): AskrenelistlayersLayersChannel_updates;

    hasHtlcMaximumMsat(): boolean;
    clearHtlcMaximumMsat(): void;
    getHtlcMaximumMsat(): cln_primitives_pb.Amount | undefined;
    setHtlcMaximumMsat(value?: cln_primitives_pb.Amount): AskrenelistlayersLayersChannel_updates;

    hasFeeBaseMsat(): boolean;
    clearFeeBaseMsat(): void;
    getFeeBaseMsat(): cln_primitives_pb.Amount | undefined;
    setFeeBaseMsat(value?: cln_primitives_pb.Amount): AskrenelistlayersLayersChannel_updates;

    hasFeeProportionalMillionths(): boolean;
    clearFeeProportionalMillionths(): void;
    getFeeProportionalMillionths(): number | undefined;
    setFeeProportionalMillionths(value: number): AskrenelistlayersLayersChannel_updates;

    hasCltvExpiryDelta(): boolean;
    clearCltvExpiryDelta(): void;
    getCltvExpiryDelta(): number | undefined;
    setCltvExpiryDelta(value: number): AskrenelistlayersLayersChannel_updates;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): AskrenelistlayersLayersChannel_updates.AsObject;
    static toObject(includeInstance: boolean, msg: AskrenelistlayersLayersChannel_updates): AskrenelistlayersLayersChannel_updates.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: AskrenelistlayersLayersChannel_updates, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): AskrenelistlayersLayersChannel_updates;
    static deserializeBinaryFromReader(message: AskrenelistlayersLayersChannel_updates, reader: jspb.BinaryReader): AskrenelistlayersLayersChannel_updates;
}

export namespace AskrenelistlayersLayersChannel_updates {
    export type AsObject = {
        shortChannelIdDir: string,
        enabled?: boolean,
        htlcMinimumMsat?: cln_primitives_pb.Amount.AsObject,
        htlcMaximumMsat?: cln_primitives_pb.Amount.AsObject,
        feeBaseMsat?: cln_primitives_pb.Amount.AsObject,
        feeProportionalMillionths?: number,
        cltvExpiryDelta?: number,
    }
}

export class AskrenelistlayersLayersConstraints extends jspb.Message { 

    hasMaximumMsat(): boolean;
    clearMaximumMsat(): void;
    getMaximumMsat(): cln_primitives_pb.Amount | undefined;
    setMaximumMsat(value?: cln_primitives_pb.Amount): AskrenelistlayersLayersConstraints;

    hasMinimumMsat(): boolean;
    clearMinimumMsat(): void;
    getMinimumMsat(): cln_primitives_pb.Amount | undefined;
    setMinimumMsat(value?: cln_primitives_pb.Amount): AskrenelistlayersLayersConstraints;

    hasShortChannelIdDir(): boolean;
    clearShortChannelIdDir(): void;
    getShortChannelIdDir(): string | undefined;
    setShortChannelIdDir(value: string): AskrenelistlayersLayersConstraints;

    hasTimestamp(): boolean;
    clearTimestamp(): void;
    getTimestamp(): number | undefined;
    setTimestamp(value: number): AskrenelistlayersLayersConstraints;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): AskrenelistlayersLayersConstraints.AsObject;
    static toObject(includeInstance: boolean, msg: AskrenelistlayersLayersConstraints): AskrenelistlayersLayersConstraints.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: AskrenelistlayersLayersConstraints, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): AskrenelistlayersLayersConstraints;
    static deserializeBinaryFromReader(message: AskrenelistlayersLayersConstraints, reader: jspb.BinaryReader): AskrenelistlayersLayersConstraints;
}

export namespace AskrenelistlayersLayersConstraints {
    export type AsObject = {
        maximumMsat?: cln_primitives_pb.Amount.AsObject,
        minimumMsat?: cln_primitives_pb.Amount.AsObject,
        shortChannelIdDir?: string,
        timestamp?: number,
    }
}

export class AskrenelistlayersLayersBiases extends jspb.Message { 
    getShortChannelIdDir(): string;
    setShortChannelIdDir(value: string): AskrenelistlayersLayersBiases;
    getBias(): number;
    setBias(value: number): AskrenelistlayersLayersBiases;

    hasDescription(): boolean;
    clearDescription(): void;
    getDescription(): string | undefined;
    setDescription(value: string): AskrenelistlayersLayersBiases;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): AskrenelistlayersLayersBiases.AsObject;
    static toObject(includeInstance: boolean, msg: AskrenelistlayersLayersBiases): AskrenelistlayersLayersBiases.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: AskrenelistlayersLayersBiases, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): AskrenelistlayersLayersBiases;
    static deserializeBinaryFromReader(message: AskrenelistlayersLayersBiases, reader: jspb.BinaryReader): AskrenelistlayersLayersBiases;
}

export namespace AskrenelistlayersLayersBiases {
    export type AsObject = {
        shortChannelIdDir: string,
        bias: number,
        description?: string,
    }
}

export class AskrenecreatelayerRequest extends jspb.Message { 
    getLayer(): string;
    setLayer(value: string): AskrenecreatelayerRequest;

    hasPersistent(): boolean;
    clearPersistent(): void;
    getPersistent(): boolean | undefined;
    setPersistent(value: boolean): AskrenecreatelayerRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): AskrenecreatelayerRequest.AsObject;
    static toObject(includeInstance: boolean, msg: AskrenecreatelayerRequest): AskrenecreatelayerRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: AskrenecreatelayerRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): AskrenecreatelayerRequest;
    static deserializeBinaryFromReader(message: AskrenecreatelayerRequest, reader: jspb.BinaryReader): AskrenecreatelayerRequest;
}

export namespace AskrenecreatelayerRequest {
    export type AsObject = {
        layer: string,
        persistent?: boolean,
    }
}

export class AskrenecreatelayerResponse extends jspb.Message { 
    clearLayersList(): void;
    getLayersList(): Array<AskrenecreatelayerLayers>;
    setLayersList(value: Array<AskrenecreatelayerLayers>): AskrenecreatelayerResponse;
    addLayers(value?: AskrenecreatelayerLayers, index?: number): AskrenecreatelayerLayers;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): AskrenecreatelayerResponse.AsObject;
    static toObject(includeInstance: boolean, msg: AskrenecreatelayerResponse): AskrenecreatelayerResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: AskrenecreatelayerResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): AskrenecreatelayerResponse;
    static deserializeBinaryFromReader(message: AskrenecreatelayerResponse, reader: jspb.BinaryReader): AskrenecreatelayerResponse;
}

export namespace AskrenecreatelayerResponse {
    export type AsObject = {
        layersList: Array<AskrenecreatelayerLayers.AsObject>,
    }
}

export class AskrenecreatelayerLayers extends jspb.Message { 
    getLayer(): string;
    setLayer(value: string): AskrenecreatelayerLayers;
    getPersistent(): boolean;
    setPersistent(value: boolean): AskrenecreatelayerLayers;
    clearDisabledNodesList(): void;
    getDisabledNodesList(): Array<Uint8Array | string>;
    getDisabledNodesList_asU8(): Array<Uint8Array>;
    getDisabledNodesList_asB64(): Array<string>;
    setDisabledNodesList(value: Array<Uint8Array | string>): AskrenecreatelayerLayers;
    addDisabledNodes(value: Uint8Array | string, index?: number): Uint8Array | string;
    clearDisabledChannelsList(): void;
    getDisabledChannelsList(): Array<string>;
    setDisabledChannelsList(value: Array<string>): AskrenecreatelayerLayers;
    addDisabledChannels(value: string, index?: number): string;
    clearCreatedChannelsList(): void;
    getCreatedChannelsList(): Array<AskrenecreatelayerLayersCreated_channels>;
    setCreatedChannelsList(value: Array<AskrenecreatelayerLayersCreated_channels>): AskrenecreatelayerLayers;
    addCreatedChannels(value?: AskrenecreatelayerLayersCreated_channels, index?: number): AskrenecreatelayerLayersCreated_channels;
    clearChannelUpdatesList(): void;
    getChannelUpdatesList(): Array<AskrenecreatelayerLayersChannel_updates>;
    setChannelUpdatesList(value: Array<AskrenecreatelayerLayersChannel_updates>): AskrenecreatelayerLayers;
    addChannelUpdates(value?: AskrenecreatelayerLayersChannel_updates, index?: number): AskrenecreatelayerLayersChannel_updates;
    clearConstraintsList(): void;
    getConstraintsList(): Array<AskrenecreatelayerLayersConstraints>;
    setConstraintsList(value: Array<AskrenecreatelayerLayersConstraints>): AskrenecreatelayerLayers;
    addConstraints(value?: AskrenecreatelayerLayersConstraints, index?: number): AskrenecreatelayerLayersConstraints;
    clearBiasesList(): void;
    getBiasesList(): Array<AskrenecreatelayerLayersBiases>;
    setBiasesList(value: Array<AskrenecreatelayerLayersBiases>): AskrenecreatelayerLayers;
    addBiases(value?: AskrenecreatelayerLayersBiases, index?: number): AskrenecreatelayerLayersBiases;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): AskrenecreatelayerLayers.AsObject;
    static toObject(includeInstance: boolean, msg: AskrenecreatelayerLayers): AskrenecreatelayerLayers.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: AskrenecreatelayerLayers, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): AskrenecreatelayerLayers;
    static deserializeBinaryFromReader(message: AskrenecreatelayerLayers, reader: jspb.BinaryReader): AskrenecreatelayerLayers;
}

export namespace AskrenecreatelayerLayers {
    export type AsObject = {
        layer: string,
        persistent: boolean,
        disabledNodesList: Array<Uint8Array | string>,
        disabledChannelsList: Array<string>,
        createdChannelsList: Array<AskrenecreatelayerLayersCreated_channels.AsObject>,
        channelUpdatesList: Array<AskrenecreatelayerLayersChannel_updates.AsObject>,
        constraintsList: Array<AskrenecreatelayerLayersConstraints.AsObject>,
        biasesList: Array<AskrenecreatelayerLayersBiases.AsObject>,
    }
}

export class AskrenecreatelayerLayersCreated_channels extends jspb.Message { 
    getSource(): Uint8Array | string;
    getSource_asU8(): Uint8Array;
    getSource_asB64(): string;
    setSource(value: Uint8Array | string): AskrenecreatelayerLayersCreated_channels;
    getDestination(): Uint8Array | string;
    getDestination_asU8(): Uint8Array;
    getDestination_asB64(): string;
    setDestination(value: Uint8Array | string): AskrenecreatelayerLayersCreated_channels;
    getShortChannelId(): string;
    setShortChannelId(value: string): AskrenecreatelayerLayersCreated_channels;

    hasCapacityMsat(): boolean;
    clearCapacityMsat(): void;
    getCapacityMsat(): cln_primitives_pb.Amount | undefined;
    setCapacityMsat(value?: cln_primitives_pb.Amount): AskrenecreatelayerLayersCreated_channels;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): AskrenecreatelayerLayersCreated_channels.AsObject;
    static toObject(includeInstance: boolean, msg: AskrenecreatelayerLayersCreated_channels): AskrenecreatelayerLayersCreated_channels.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: AskrenecreatelayerLayersCreated_channels, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): AskrenecreatelayerLayersCreated_channels;
    static deserializeBinaryFromReader(message: AskrenecreatelayerLayersCreated_channels, reader: jspb.BinaryReader): AskrenecreatelayerLayersCreated_channels;
}

export namespace AskrenecreatelayerLayersCreated_channels {
    export type AsObject = {
        source: Uint8Array | string,
        destination: Uint8Array | string,
        shortChannelId: string,
        capacityMsat?: cln_primitives_pb.Amount.AsObject,
    }
}

export class AskrenecreatelayerLayersChannel_updates extends jspb.Message { 

    hasHtlcMinimumMsat(): boolean;
    clearHtlcMinimumMsat(): void;
    getHtlcMinimumMsat(): cln_primitives_pb.Amount | undefined;
    setHtlcMinimumMsat(value?: cln_primitives_pb.Amount): AskrenecreatelayerLayersChannel_updates;

    hasHtlcMaximumMsat(): boolean;
    clearHtlcMaximumMsat(): void;
    getHtlcMaximumMsat(): cln_primitives_pb.Amount | undefined;
    setHtlcMaximumMsat(value?: cln_primitives_pb.Amount): AskrenecreatelayerLayersChannel_updates;

    hasFeeBaseMsat(): boolean;
    clearFeeBaseMsat(): void;
    getFeeBaseMsat(): cln_primitives_pb.Amount | undefined;
    setFeeBaseMsat(value?: cln_primitives_pb.Amount): AskrenecreatelayerLayersChannel_updates;

    hasFeeProportionalMillionths(): boolean;
    clearFeeProportionalMillionths(): void;
    getFeeProportionalMillionths(): number | undefined;
    setFeeProportionalMillionths(value: number): AskrenecreatelayerLayersChannel_updates;

    hasDelay(): boolean;
    clearDelay(): void;
    getDelay(): number | undefined;
    setDelay(value: number): AskrenecreatelayerLayersChannel_updates;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): AskrenecreatelayerLayersChannel_updates.AsObject;
    static toObject(includeInstance: boolean, msg: AskrenecreatelayerLayersChannel_updates): AskrenecreatelayerLayersChannel_updates.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: AskrenecreatelayerLayersChannel_updates, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): AskrenecreatelayerLayersChannel_updates;
    static deserializeBinaryFromReader(message: AskrenecreatelayerLayersChannel_updates, reader: jspb.BinaryReader): AskrenecreatelayerLayersChannel_updates;
}

export namespace AskrenecreatelayerLayersChannel_updates {
    export type AsObject = {
        htlcMinimumMsat?: cln_primitives_pb.Amount.AsObject,
        htlcMaximumMsat?: cln_primitives_pb.Amount.AsObject,
        feeBaseMsat?: cln_primitives_pb.Amount.AsObject,
        feeProportionalMillionths?: number,
        delay?: number,
    }
}

export class AskrenecreatelayerLayersConstraints extends jspb.Message { 
    getShortChannelId(): string;
    setShortChannelId(value: string): AskrenecreatelayerLayersConstraints;
    getDirection(): number;
    setDirection(value: number): AskrenecreatelayerLayersConstraints;

    hasMaximumMsat(): boolean;
    clearMaximumMsat(): void;
    getMaximumMsat(): cln_primitives_pb.Amount | undefined;
    setMaximumMsat(value?: cln_primitives_pb.Amount): AskrenecreatelayerLayersConstraints;

    hasMinimumMsat(): boolean;
    clearMinimumMsat(): void;
    getMinimumMsat(): cln_primitives_pb.Amount | undefined;
    setMinimumMsat(value?: cln_primitives_pb.Amount): AskrenecreatelayerLayersConstraints;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): AskrenecreatelayerLayersConstraints.AsObject;
    static toObject(includeInstance: boolean, msg: AskrenecreatelayerLayersConstraints): AskrenecreatelayerLayersConstraints.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: AskrenecreatelayerLayersConstraints, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): AskrenecreatelayerLayersConstraints;
    static deserializeBinaryFromReader(message: AskrenecreatelayerLayersConstraints, reader: jspb.BinaryReader): AskrenecreatelayerLayersConstraints;
}

export namespace AskrenecreatelayerLayersConstraints {
    export type AsObject = {
        shortChannelId: string,
        direction: number,
        maximumMsat?: cln_primitives_pb.Amount.AsObject,
        minimumMsat?: cln_primitives_pb.Amount.AsObject,
    }
}

export class AskrenecreatelayerLayersBiases extends jspb.Message { 
    getShortChannelIdDir(): string;
    setShortChannelIdDir(value: string): AskrenecreatelayerLayersBiases;
    getBias(): number;
    setBias(value: number): AskrenecreatelayerLayersBiases;

    hasDescription(): boolean;
    clearDescription(): void;
    getDescription(): string | undefined;
    setDescription(value: string): AskrenecreatelayerLayersBiases;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): AskrenecreatelayerLayersBiases.AsObject;
    static toObject(includeInstance: boolean, msg: AskrenecreatelayerLayersBiases): AskrenecreatelayerLayersBiases.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: AskrenecreatelayerLayersBiases, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): AskrenecreatelayerLayersBiases;
    static deserializeBinaryFromReader(message: AskrenecreatelayerLayersBiases, reader: jspb.BinaryReader): AskrenecreatelayerLayersBiases;
}

export namespace AskrenecreatelayerLayersBiases {
    export type AsObject = {
        shortChannelIdDir: string,
        bias: number,
        description?: string,
    }
}

export class AskreneremovelayerRequest extends jspb.Message { 
    getLayer(): string;
    setLayer(value: string): AskreneremovelayerRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): AskreneremovelayerRequest.AsObject;
    static toObject(includeInstance: boolean, msg: AskreneremovelayerRequest): AskreneremovelayerRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: AskreneremovelayerRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): AskreneremovelayerRequest;
    static deserializeBinaryFromReader(message: AskreneremovelayerRequest, reader: jspb.BinaryReader): AskreneremovelayerRequest;
}

export namespace AskreneremovelayerRequest {
    export type AsObject = {
        layer: string,
    }
}

export class AskreneremovelayerResponse extends jspb.Message { 

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): AskreneremovelayerResponse.AsObject;
    static toObject(includeInstance: boolean, msg: AskreneremovelayerResponse): AskreneremovelayerResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: AskreneremovelayerResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): AskreneremovelayerResponse;
    static deserializeBinaryFromReader(message: AskreneremovelayerResponse, reader: jspb.BinaryReader): AskreneremovelayerResponse;
}

export namespace AskreneremovelayerResponse {
    export type AsObject = {
    }
}

export class AskrenereserveRequest extends jspb.Message { 
    clearPathList(): void;
    getPathList(): Array<AskrenereservePath>;
    setPathList(value: Array<AskrenereservePath>): AskrenereserveRequest;
    addPath(value?: AskrenereservePath, index?: number): AskrenereservePath;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): AskrenereserveRequest.AsObject;
    static toObject(includeInstance: boolean, msg: AskrenereserveRequest): AskrenereserveRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: AskrenereserveRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): AskrenereserveRequest;
    static deserializeBinaryFromReader(message: AskrenereserveRequest, reader: jspb.BinaryReader): AskrenereserveRequest;
}

export namespace AskrenereserveRequest {
    export type AsObject = {
        pathList: Array<AskrenereservePath.AsObject>,
    }
}

export class AskrenereserveResponse extends jspb.Message { 

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): AskrenereserveResponse.AsObject;
    static toObject(includeInstance: boolean, msg: AskrenereserveResponse): AskrenereserveResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: AskrenereserveResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): AskrenereserveResponse;
    static deserializeBinaryFromReader(message: AskrenereserveResponse, reader: jspb.BinaryReader): AskrenereserveResponse;
}

export namespace AskrenereserveResponse {
    export type AsObject = {
    }
}

export class AskrenereservePath extends jspb.Message { 

    hasAmountMsat(): boolean;
    clearAmountMsat(): void;
    getAmountMsat(): cln_primitives_pb.Amount | undefined;
    setAmountMsat(value?: cln_primitives_pb.Amount): AskrenereservePath;

    hasShortChannelIdDir(): boolean;
    clearShortChannelIdDir(): void;
    getShortChannelIdDir(): string | undefined;
    setShortChannelIdDir(value: string): AskrenereservePath;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): AskrenereservePath.AsObject;
    static toObject(includeInstance: boolean, msg: AskrenereservePath): AskrenereservePath.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: AskrenereservePath, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): AskrenereservePath;
    static deserializeBinaryFromReader(message: AskrenereservePath, reader: jspb.BinaryReader): AskrenereservePath;
}

export namespace AskrenereservePath {
    export type AsObject = {
        amountMsat?: cln_primitives_pb.Amount.AsObject,
        shortChannelIdDir?: string,
    }
}

export class AskreneageRequest extends jspb.Message { 
    getLayer(): string;
    setLayer(value: string): AskreneageRequest;
    getCutoff(): number;
    setCutoff(value: number): AskreneageRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): AskreneageRequest.AsObject;
    static toObject(includeInstance: boolean, msg: AskreneageRequest): AskreneageRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: AskreneageRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): AskreneageRequest;
    static deserializeBinaryFromReader(message: AskreneageRequest, reader: jspb.BinaryReader): AskreneageRequest;
}

export namespace AskreneageRequest {
    export type AsObject = {
        layer: string,
        cutoff: number,
    }
}

export class AskreneageResponse extends jspb.Message { 
    getLayer(): string;
    setLayer(value: string): AskreneageResponse;
    getNumRemoved(): number;
    setNumRemoved(value: number): AskreneageResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): AskreneageResponse.AsObject;
    static toObject(includeInstance: boolean, msg: AskreneageResponse): AskreneageResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: AskreneageResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): AskreneageResponse;
    static deserializeBinaryFromReader(message: AskreneageResponse, reader: jspb.BinaryReader): AskreneageResponse;
}

export namespace AskreneageResponse {
    export type AsObject = {
        layer: string,
        numRemoved: number,
    }
}

export class GetroutesRequest extends jspb.Message { 
    getSource(): Uint8Array | string;
    getSource_asU8(): Uint8Array;
    getSource_asB64(): string;
    setSource(value: Uint8Array | string): GetroutesRequest;
    getDestination(): Uint8Array | string;
    getDestination_asU8(): Uint8Array;
    getDestination_asB64(): string;
    setDestination(value: Uint8Array | string): GetroutesRequest;

    hasAmountMsat(): boolean;
    clearAmountMsat(): void;
    getAmountMsat(): cln_primitives_pb.Amount | undefined;
    setAmountMsat(value?: cln_primitives_pb.Amount): GetroutesRequest;
    clearLayersList(): void;
    getLayersList(): Array<string>;
    setLayersList(value: Array<string>): GetroutesRequest;
    addLayers(value: string, index?: number): string;

    hasMaxfeeMsat(): boolean;
    clearMaxfeeMsat(): void;
    getMaxfeeMsat(): cln_primitives_pb.Amount | undefined;
    setMaxfeeMsat(value?: cln_primitives_pb.Amount): GetroutesRequest;

    hasFinalCltv(): boolean;
    clearFinalCltv(): void;
    getFinalCltv(): number | undefined;
    setFinalCltv(value: number): GetroutesRequest;

    hasMaxdelay(): boolean;
    clearMaxdelay(): void;
    getMaxdelay(): number | undefined;
    setMaxdelay(value: number): GetroutesRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): GetroutesRequest.AsObject;
    static toObject(includeInstance: boolean, msg: GetroutesRequest): GetroutesRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: GetroutesRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): GetroutesRequest;
    static deserializeBinaryFromReader(message: GetroutesRequest, reader: jspb.BinaryReader): GetroutesRequest;
}

export namespace GetroutesRequest {
    export type AsObject = {
        source: Uint8Array | string,
        destination: Uint8Array | string,
        amountMsat?: cln_primitives_pb.Amount.AsObject,
        layersList: Array<string>,
        maxfeeMsat?: cln_primitives_pb.Amount.AsObject,
        finalCltv?: number,
        maxdelay?: number,
    }
}

export class GetroutesResponse extends jspb.Message { 
    getProbabilityPpm(): number;
    setProbabilityPpm(value: number): GetroutesResponse;
    clearRoutesList(): void;
    getRoutesList(): Array<GetroutesRoutes>;
    setRoutesList(value: Array<GetroutesRoutes>): GetroutesResponse;
    addRoutes(value?: GetroutesRoutes, index?: number): GetroutesRoutes;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): GetroutesResponse.AsObject;
    static toObject(includeInstance: boolean, msg: GetroutesResponse): GetroutesResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: GetroutesResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): GetroutesResponse;
    static deserializeBinaryFromReader(message: GetroutesResponse, reader: jspb.BinaryReader): GetroutesResponse;
}

export namespace GetroutesResponse {
    export type AsObject = {
        probabilityPpm: number,
        routesList: Array<GetroutesRoutes.AsObject>,
    }
}

export class GetroutesRoutes extends jspb.Message { 
    getProbabilityPpm(): number;
    setProbabilityPpm(value: number): GetroutesRoutes;

    hasAmountMsat(): boolean;
    clearAmountMsat(): void;
    getAmountMsat(): cln_primitives_pb.Amount | undefined;
    setAmountMsat(value?: cln_primitives_pb.Amount): GetroutesRoutes;
    clearPathList(): void;
    getPathList(): Array<GetroutesRoutesPath>;
    setPathList(value: Array<GetroutesRoutesPath>): GetroutesRoutes;
    addPath(value?: GetroutesRoutesPath, index?: number): GetroutesRoutesPath;

    hasFinalCltv(): boolean;
    clearFinalCltv(): void;
    getFinalCltv(): number | undefined;
    setFinalCltv(value: number): GetroutesRoutes;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): GetroutesRoutes.AsObject;
    static toObject(includeInstance: boolean, msg: GetroutesRoutes): GetroutesRoutes.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: GetroutesRoutes, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): GetroutesRoutes;
    static deserializeBinaryFromReader(message: GetroutesRoutes, reader: jspb.BinaryReader): GetroutesRoutes;
}

export namespace GetroutesRoutes {
    export type AsObject = {
        probabilityPpm: number,
        amountMsat?: cln_primitives_pb.Amount.AsObject,
        pathList: Array<GetroutesRoutesPath.AsObject>,
        finalCltv?: number,
    }
}

export class GetroutesRoutesPath extends jspb.Message { 

    hasAmountMsat(): boolean;
    clearAmountMsat(): void;
    getAmountMsat(): cln_primitives_pb.Amount | undefined;
    setAmountMsat(value?: cln_primitives_pb.Amount): GetroutesRoutesPath;
    getNextNodeId(): Uint8Array | string;
    getNextNodeId_asU8(): Uint8Array;
    getNextNodeId_asB64(): string;
    setNextNodeId(value: Uint8Array | string): GetroutesRoutesPath;
    getDelay(): number;
    setDelay(value: number): GetroutesRoutesPath;

    hasShortChannelIdDir(): boolean;
    clearShortChannelIdDir(): void;
    getShortChannelIdDir(): string | undefined;
    setShortChannelIdDir(value: string): GetroutesRoutesPath;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): GetroutesRoutesPath.AsObject;
    static toObject(includeInstance: boolean, msg: GetroutesRoutesPath): GetroutesRoutesPath.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: GetroutesRoutesPath, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): GetroutesRoutesPath;
    static deserializeBinaryFromReader(message: GetroutesRoutesPath, reader: jspb.BinaryReader): GetroutesRoutesPath;
}

export namespace GetroutesRoutesPath {
    export type AsObject = {
        amountMsat?: cln_primitives_pb.Amount.AsObject,
        nextNodeId: Uint8Array | string,
        delay: number,
        shortChannelIdDir?: string,
    }
}

export class AskrenedisablenodeRequest extends jspb.Message { 
    getLayer(): string;
    setLayer(value: string): AskrenedisablenodeRequest;
    getNode(): Uint8Array | string;
    getNode_asU8(): Uint8Array;
    getNode_asB64(): string;
    setNode(value: Uint8Array | string): AskrenedisablenodeRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): AskrenedisablenodeRequest.AsObject;
    static toObject(includeInstance: boolean, msg: AskrenedisablenodeRequest): AskrenedisablenodeRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: AskrenedisablenodeRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): AskrenedisablenodeRequest;
    static deserializeBinaryFromReader(message: AskrenedisablenodeRequest, reader: jspb.BinaryReader): AskrenedisablenodeRequest;
}

export namespace AskrenedisablenodeRequest {
    export type AsObject = {
        layer: string,
        node: Uint8Array | string,
    }
}

export class AskrenedisablenodeResponse extends jspb.Message { 

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): AskrenedisablenodeResponse.AsObject;
    static toObject(includeInstance: boolean, msg: AskrenedisablenodeResponse): AskrenedisablenodeResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: AskrenedisablenodeResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): AskrenedisablenodeResponse;
    static deserializeBinaryFromReader(message: AskrenedisablenodeResponse, reader: jspb.BinaryReader): AskrenedisablenodeResponse;
}

export namespace AskrenedisablenodeResponse {
    export type AsObject = {
    }
}

export class AskreneinformchannelRequest extends jspb.Message { 
    getLayer(): string;
    setLayer(value: string): AskreneinformchannelRequest;

    hasShortChannelIdDir(): boolean;
    clearShortChannelIdDir(): void;
    getShortChannelIdDir(): string | undefined;
    setShortChannelIdDir(value: string): AskreneinformchannelRequest;

    hasAmountMsat(): boolean;
    clearAmountMsat(): void;
    getAmountMsat(): cln_primitives_pb.Amount | undefined;
    setAmountMsat(value?: cln_primitives_pb.Amount): AskreneinformchannelRequest;

    hasInform(): boolean;
    clearInform(): void;
    getInform(): AskreneinformchannelRequest.AskreneinformchannelInform | undefined;
    setInform(value: AskreneinformchannelRequest.AskreneinformchannelInform): AskreneinformchannelRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): AskreneinformchannelRequest.AsObject;
    static toObject(includeInstance: boolean, msg: AskreneinformchannelRequest): AskreneinformchannelRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: AskreneinformchannelRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): AskreneinformchannelRequest;
    static deserializeBinaryFromReader(message: AskreneinformchannelRequest, reader: jspb.BinaryReader): AskreneinformchannelRequest;
}

export namespace AskreneinformchannelRequest {
    export type AsObject = {
        layer: string,
        shortChannelIdDir?: string,
        amountMsat?: cln_primitives_pb.Amount.AsObject,
        inform?: AskreneinformchannelRequest.AskreneinformchannelInform,
    }

    export enum AskreneinformchannelInform {
    CONSTRAINED = 0,
    UNCONSTRAINED = 1,
    SUCCEEDED = 2,
    }

}

export class AskreneinformchannelResponse extends jspb.Message { 
    clearConstraintsList(): void;
    getConstraintsList(): Array<AskreneinformchannelConstraints>;
    setConstraintsList(value: Array<AskreneinformchannelConstraints>): AskreneinformchannelResponse;
    addConstraints(value?: AskreneinformchannelConstraints, index?: number): AskreneinformchannelConstraints;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): AskreneinformchannelResponse.AsObject;
    static toObject(includeInstance: boolean, msg: AskreneinformchannelResponse): AskreneinformchannelResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: AskreneinformchannelResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): AskreneinformchannelResponse;
    static deserializeBinaryFromReader(message: AskreneinformchannelResponse, reader: jspb.BinaryReader): AskreneinformchannelResponse;
}

export namespace AskreneinformchannelResponse {
    export type AsObject = {
        constraintsList: Array<AskreneinformchannelConstraints.AsObject>,
    }
}

export class AskreneinformchannelConstraints extends jspb.Message { 
    getShortChannelIdDir(): string;
    setShortChannelIdDir(value: string): AskreneinformchannelConstraints;
    getLayer(): string;
    setLayer(value: string): AskreneinformchannelConstraints;
    getTimestamp(): number;
    setTimestamp(value: number): AskreneinformchannelConstraints;

    hasMaximumMsat(): boolean;
    clearMaximumMsat(): void;
    getMaximumMsat(): cln_primitives_pb.Amount | undefined;
    setMaximumMsat(value?: cln_primitives_pb.Amount): AskreneinformchannelConstraints;

    hasMinimumMsat(): boolean;
    clearMinimumMsat(): void;
    getMinimumMsat(): cln_primitives_pb.Amount | undefined;
    setMinimumMsat(value?: cln_primitives_pb.Amount): AskreneinformchannelConstraints;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): AskreneinformchannelConstraints.AsObject;
    static toObject(includeInstance: boolean, msg: AskreneinformchannelConstraints): AskreneinformchannelConstraints.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: AskreneinformchannelConstraints, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): AskreneinformchannelConstraints;
    static deserializeBinaryFromReader(message: AskreneinformchannelConstraints, reader: jspb.BinaryReader): AskreneinformchannelConstraints;
}

export namespace AskreneinformchannelConstraints {
    export type AsObject = {
        shortChannelIdDir: string,
        layer: string,
        timestamp: number,
        maximumMsat?: cln_primitives_pb.Amount.AsObject,
        minimumMsat?: cln_primitives_pb.Amount.AsObject,
    }
}

export class AskrenecreatechannelRequest extends jspb.Message { 
    getLayer(): string;
    setLayer(value: string): AskrenecreatechannelRequest;
    getSource(): Uint8Array | string;
    getSource_asU8(): Uint8Array;
    getSource_asB64(): string;
    setSource(value: Uint8Array | string): AskrenecreatechannelRequest;
    getDestination(): Uint8Array | string;
    getDestination_asU8(): Uint8Array;
    getDestination_asB64(): string;
    setDestination(value: Uint8Array | string): AskrenecreatechannelRequest;
    getShortChannelId(): string;
    setShortChannelId(value: string): AskrenecreatechannelRequest;

    hasCapacityMsat(): boolean;
    clearCapacityMsat(): void;
    getCapacityMsat(): cln_primitives_pb.Amount | undefined;
    setCapacityMsat(value?: cln_primitives_pb.Amount): AskrenecreatechannelRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): AskrenecreatechannelRequest.AsObject;
    static toObject(includeInstance: boolean, msg: AskrenecreatechannelRequest): AskrenecreatechannelRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: AskrenecreatechannelRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): AskrenecreatechannelRequest;
    static deserializeBinaryFromReader(message: AskrenecreatechannelRequest, reader: jspb.BinaryReader): AskrenecreatechannelRequest;
}

export namespace AskrenecreatechannelRequest {
    export type AsObject = {
        layer: string,
        source: Uint8Array | string,
        destination: Uint8Array | string,
        shortChannelId: string,
        capacityMsat?: cln_primitives_pb.Amount.AsObject,
    }
}

export class AskrenecreatechannelResponse extends jspb.Message { 

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): AskrenecreatechannelResponse.AsObject;
    static toObject(includeInstance: boolean, msg: AskrenecreatechannelResponse): AskrenecreatechannelResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: AskrenecreatechannelResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): AskrenecreatechannelResponse;
    static deserializeBinaryFromReader(message: AskrenecreatechannelResponse, reader: jspb.BinaryReader): AskrenecreatechannelResponse;
}

export namespace AskrenecreatechannelResponse {
    export type AsObject = {
    }
}

export class AskreneupdatechannelRequest extends jspb.Message { 
    getLayer(): string;
    setLayer(value: string): AskreneupdatechannelRequest;
    getShortChannelIdDir(): string;
    setShortChannelIdDir(value: string): AskreneupdatechannelRequest;

    hasEnabled(): boolean;
    clearEnabled(): void;
    getEnabled(): boolean | undefined;
    setEnabled(value: boolean): AskreneupdatechannelRequest;

    hasHtlcMinimumMsat(): boolean;
    clearHtlcMinimumMsat(): void;
    getHtlcMinimumMsat(): cln_primitives_pb.Amount | undefined;
    setHtlcMinimumMsat(value?: cln_primitives_pb.Amount): AskreneupdatechannelRequest;

    hasHtlcMaximumMsat(): boolean;
    clearHtlcMaximumMsat(): void;
    getHtlcMaximumMsat(): cln_primitives_pb.Amount | undefined;
    setHtlcMaximumMsat(value?: cln_primitives_pb.Amount): AskreneupdatechannelRequest;

    hasFeeBaseMsat(): boolean;
    clearFeeBaseMsat(): void;
    getFeeBaseMsat(): cln_primitives_pb.Amount | undefined;
    setFeeBaseMsat(value?: cln_primitives_pb.Amount): AskreneupdatechannelRequest;

    hasFeeProportionalMillionths(): boolean;
    clearFeeProportionalMillionths(): void;
    getFeeProportionalMillionths(): number | undefined;
    setFeeProportionalMillionths(value: number): AskreneupdatechannelRequest;

    hasCltvExpiryDelta(): boolean;
    clearCltvExpiryDelta(): void;
    getCltvExpiryDelta(): number | undefined;
    setCltvExpiryDelta(value: number): AskreneupdatechannelRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): AskreneupdatechannelRequest.AsObject;
    static toObject(includeInstance: boolean, msg: AskreneupdatechannelRequest): AskreneupdatechannelRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: AskreneupdatechannelRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): AskreneupdatechannelRequest;
    static deserializeBinaryFromReader(message: AskreneupdatechannelRequest, reader: jspb.BinaryReader): AskreneupdatechannelRequest;
}

export namespace AskreneupdatechannelRequest {
    export type AsObject = {
        layer: string,
        shortChannelIdDir: string,
        enabled?: boolean,
        htlcMinimumMsat?: cln_primitives_pb.Amount.AsObject,
        htlcMaximumMsat?: cln_primitives_pb.Amount.AsObject,
        feeBaseMsat?: cln_primitives_pb.Amount.AsObject,
        feeProportionalMillionths?: number,
        cltvExpiryDelta?: number,
    }
}

export class AskreneupdatechannelResponse extends jspb.Message { 

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): AskreneupdatechannelResponse.AsObject;
    static toObject(includeInstance: boolean, msg: AskreneupdatechannelResponse): AskreneupdatechannelResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: AskreneupdatechannelResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): AskreneupdatechannelResponse;
    static deserializeBinaryFromReader(message: AskreneupdatechannelResponse, reader: jspb.BinaryReader): AskreneupdatechannelResponse;
}

export namespace AskreneupdatechannelResponse {
    export type AsObject = {
    }
}

export class AskrenebiaschannelRequest extends jspb.Message { 
    getLayer(): string;
    setLayer(value: string): AskrenebiaschannelRequest;
    getShortChannelIdDir(): string;
    setShortChannelIdDir(value: string): AskrenebiaschannelRequest;
    getBias(): number;
    setBias(value: number): AskrenebiaschannelRequest;

    hasDescription(): boolean;
    clearDescription(): void;
    getDescription(): string | undefined;
    setDescription(value: string): AskrenebiaschannelRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): AskrenebiaschannelRequest.AsObject;
    static toObject(includeInstance: boolean, msg: AskrenebiaschannelRequest): AskrenebiaschannelRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: AskrenebiaschannelRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): AskrenebiaschannelRequest;
    static deserializeBinaryFromReader(message: AskrenebiaschannelRequest, reader: jspb.BinaryReader): AskrenebiaschannelRequest;
}

export namespace AskrenebiaschannelRequest {
    export type AsObject = {
        layer: string,
        shortChannelIdDir: string,
        bias: number,
        description?: string,
    }
}

export class AskrenebiaschannelResponse extends jspb.Message { 
    clearBiasesList(): void;
    getBiasesList(): Array<AskrenebiaschannelBiases>;
    setBiasesList(value: Array<AskrenebiaschannelBiases>): AskrenebiaschannelResponse;
    addBiases(value?: AskrenebiaschannelBiases, index?: number): AskrenebiaschannelBiases;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): AskrenebiaschannelResponse.AsObject;
    static toObject(includeInstance: boolean, msg: AskrenebiaschannelResponse): AskrenebiaschannelResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: AskrenebiaschannelResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): AskrenebiaschannelResponse;
    static deserializeBinaryFromReader(message: AskrenebiaschannelResponse, reader: jspb.BinaryReader): AskrenebiaschannelResponse;
}

export namespace AskrenebiaschannelResponse {
    export type AsObject = {
        biasesList: Array<AskrenebiaschannelBiases.AsObject>,
    }
}

export class AskrenebiaschannelBiases extends jspb.Message { 
    getLayer(): string;
    setLayer(value: string): AskrenebiaschannelBiases;
    getShortChannelIdDir(): string;
    setShortChannelIdDir(value: string): AskrenebiaschannelBiases;
    getBias(): number;
    setBias(value: number): AskrenebiaschannelBiases;

    hasDescription(): boolean;
    clearDescription(): void;
    getDescription(): string | undefined;
    setDescription(value: string): AskrenebiaschannelBiases;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): AskrenebiaschannelBiases.AsObject;
    static toObject(includeInstance: boolean, msg: AskrenebiaschannelBiases): AskrenebiaschannelBiases.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: AskrenebiaschannelBiases, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): AskrenebiaschannelBiases;
    static deserializeBinaryFromReader(message: AskrenebiaschannelBiases, reader: jspb.BinaryReader): AskrenebiaschannelBiases;
}

export namespace AskrenebiaschannelBiases {
    export type AsObject = {
        layer: string,
        shortChannelIdDir: string,
        bias: number,
        description?: string,
    }
}

export class AskrenelistreservationsRequest extends jspb.Message { 

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): AskrenelistreservationsRequest.AsObject;
    static toObject(includeInstance: boolean, msg: AskrenelistreservationsRequest): AskrenelistreservationsRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: AskrenelistreservationsRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): AskrenelistreservationsRequest;
    static deserializeBinaryFromReader(message: AskrenelistreservationsRequest, reader: jspb.BinaryReader): AskrenelistreservationsRequest;
}

export namespace AskrenelistreservationsRequest {
    export type AsObject = {
    }
}

export class AskrenelistreservationsResponse extends jspb.Message { 
    clearReservationsList(): void;
    getReservationsList(): Array<AskrenelistreservationsReservations>;
    setReservationsList(value: Array<AskrenelistreservationsReservations>): AskrenelistreservationsResponse;
    addReservations(value?: AskrenelistreservationsReservations, index?: number): AskrenelistreservationsReservations;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): AskrenelistreservationsResponse.AsObject;
    static toObject(includeInstance: boolean, msg: AskrenelistreservationsResponse): AskrenelistreservationsResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: AskrenelistreservationsResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): AskrenelistreservationsResponse;
    static deserializeBinaryFromReader(message: AskrenelistreservationsResponse, reader: jspb.BinaryReader): AskrenelistreservationsResponse;
}

export namespace AskrenelistreservationsResponse {
    export type AsObject = {
        reservationsList: Array<AskrenelistreservationsReservations.AsObject>,
    }
}

export class AskrenelistreservationsReservations extends jspb.Message { 
    getShortChannelIdDir(): string;
    setShortChannelIdDir(value: string): AskrenelistreservationsReservations;

    hasAmountMsat(): boolean;
    clearAmountMsat(): void;
    getAmountMsat(): cln_primitives_pb.Amount | undefined;
    setAmountMsat(value?: cln_primitives_pb.Amount): AskrenelistreservationsReservations;
    getAgeInSeconds(): number;
    setAgeInSeconds(value: number): AskrenelistreservationsReservations;
    getCommandId(): string;
    setCommandId(value: string): AskrenelistreservationsReservations;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): AskrenelistreservationsReservations.AsObject;
    static toObject(includeInstance: boolean, msg: AskrenelistreservationsReservations): AskrenelistreservationsReservations.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: AskrenelistreservationsReservations, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): AskrenelistreservationsReservations;
    static deserializeBinaryFromReader(message: AskrenelistreservationsReservations, reader: jspb.BinaryReader): AskrenelistreservationsReservations;
}

export namespace AskrenelistreservationsReservations {
    export type AsObject = {
        shortChannelIdDir: string,
        amountMsat?: cln_primitives_pb.Amount.AsObject,
        ageInSeconds: number,
        commandId: string,
    }
}

export class InjectpaymentonionRequest extends jspb.Message { 
    getOnion(): Uint8Array | string;
    getOnion_asU8(): Uint8Array;
    getOnion_asB64(): string;
    setOnion(value: Uint8Array | string): InjectpaymentonionRequest;
    getPaymentHash(): Uint8Array | string;
    getPaymentHash_asU8(): Uint8Array;
    getPaymentHash_asB64(): string;
    setPaymentHash(value: Uint8Array | string): InjectpaymentonionRequest;

    hasAmountMsat(): boolean;
    clearAmountMsat(): void;
    getAmountMsat(): cln_primitives_pb.Amount | undefined;
    setAmountMsat(value?: cln_primitives_pb.Amount): InjectpaymentonionRequest;
    getCltvExpiry(): number;
    setCltvExpiry(value: number): InjectpaymentonionRequest;
    getPartid(): number;
    setPartid(value: number): InjectpaymentonionRequest;
    getGroupid(): number;
    setGroupid(value: number): InjectpaymentonionRequest;

    hasLabel(): boolean;
    clearLabel(): void;
    getLabel(): string | undefined;
    setLabel(value: string): InjectpaymentonionRequest;

    hasInvstring(): boolean;
    clearInvstring(): void;
    getInvstring(): string | undefined;
    setInvstring(value: string): InjectpaymentonionRequest;

    hasLocalinvreqid(): boolean;
    clearLocalinvreqid(): void;
    getLocalinvreqid(): Uint8Array | string;
    getLocalinvreqid_asU8(): Uint8Array;
    getLocalinvreqid_asB64(): string;
    setLocalinvreqid(value: Uint8Array | string): InjectpaymentonionRequest;

    hasDestinationMsat(): boolean;
    clearDestinationMsat(): void;
    getDestinationMsat(): cln_primitives_pb.Amount | undefined;
    setDestinationMsat(value?: cln_primitives_pb.Amount): InjectpaymentonionRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): InjectpaymentonionRequest.AsObject;
    static toObject(includeInstance: boolean, msg: InjectpaymentonionRequest): InjectpaymentonionRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: InjectpaymentonionRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): InjectpaymentonionRequest;
    static deserializeBinaryFromReader(message: InjectpaymentonionRequest, reader: jspb.BinaryReader): InjectpaymentonionRequest;
}

export namespace InjectpaymentonionRequest {
    export type AsObject = {
        onion: Uint8Array | string,
        paymentHash: Uint8Array | string,
        amountMsat?: cln_primitives_pb.Amount.AsObject,
        cltvExpiry: number,
        partid: number,
        groupid: number,
        label?: string,
        invstring?: string,
        localinvreqid: Uint8Array | string,
        destinationMsat?: cln_primitives_pb.Amount.AsObject,
    }
}

export class InjectpaymentonionResponse extends jspb.Message { 
    getCreatedAt(): number;
    setCreatedAt(value: number): InjectpaymentonionResponse;
    getCompletedAt(): number;
    setCompletedAt(value: number): InjectpaymentonionResponse;
    getCreatedIndex(): number;
    setCreatedIndex(value: number): InjectpaymentonionResponse;
    getPaymentPreimage(): Uint8Array | string;
    getPaymentPreimage_asU8(): Uint8Array;
    getPaymentPreimage_asB64(): string;
    setPaymentPreimage(value: Uint8Array | string): InjectpaymentonionResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): InjectpaymentonionResponse.AsObject;
    static toObject(includeInstance: boolean, msg: InjectpaymentonionResponse): InjectpaymentonionResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: InjectpaymentonionResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): InjectpaymentonionResponse;
    static deserializeBinaryFromReader(message: InjectpaymentonionResponse, reader: jspb.BinaryReader): InjectpaymentonionResponse;
}

export namespace InjectpaymentonionResponse {
    export type AsObject = {
        createdAt: number,
        completedAt: number,
        createdIndex: number,
        paymentPreimage: Uint8Array | string,
    }
}

export class XpayRequest extends jspb.Message { 
    getInvstring(): string;
    setInvstring(value: string): XpayRequest;

    hasAmountMsat(): boolean;
    clearAmountMsat(): void;
    getAmountMsat(): cln_primitives_pb.Amount | undefined;
    setAmountMsat(value?: cln_primitives_pb.Amount): XpayRequest;

    hasMaxfee(): boolean;
    clearMaxfee(): void;
    getMaxfee(): cln_primitives_pb.Amount | undefined;
    setMaxfee(value?: cln_primitives_pb.Amount): XpayRequest;
    clearLayersList(): void;
    getLayersList(): Array<string>;
    setLayersList(value: Array<string>): XpayRequest;
    addLayers(value: string, index?: number): string;

    hasRetryFor(): boolean;
    clearRetryFor(): void;
    getRetryFor(): number | undefined;
    setRetryFor(value: number): XpayRequest;

    hasPartialMsat(): boolean;
    clearPartialMsat(): void;
    getPartialMsat(): cln_primitives_pb.Amount | undefined;
    setPartialMsat(value?: cln_primitives_pb.Amount): XpayRequest;

    hasMaxdelay(): boolean;
    clearMaxdelay(): void;
    getMaxdelay(): number | undefined;
    setMaxdelay(value: number): XpayRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): XpayRequest.AsObject;
    static toObject(includeInstance: boolean, msg: XpayRequest): XpayRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: XpayRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): XpayRequest;
    static deserializeBinaryFromReader(message: XpayRequest, reader: jspb.BinaryReader): XpayRequest;
}

export namespace XpayRequest {
    export type AsObject = {
        invstring: string,
        amountMsat?: cln_primitives_pb.Amount.AsObject,
        maxfee?: cln_primitives_pb.Amount.AsObject,
        layersList: Array<string>,
        retryFor?: number,
        partialMsat?: cln_primitives_pb.Amount.AsObject,
        maxdelay?: number,
    }
}

export class XpayResponse extends jspb.Message { 
    getPaymentPreimage(): Uint8Array | string;
    getPaymentPreimage_asU8(): Uint8Array;
    getPaymentPreimage_asB64(): string;
    setPaymentPreimage(value: Uint8Array | string): XpayResponse;
    getFailedParts(): number;
    setFailedParts(value: number): XpayResponse;
    getSuccessfulParts(): number;
    setSuccessfulParts(value: number): XpayResponse;

    hasAmountMsat(): boolean;
    clearAmountMsat(): void;
    getAmountMsat(): cln_primitives_pb.Amount | undefined;
    setAmountMsat(value?: cln_primitives_pb.Amount): XpayResponse;

    hasAmountSentMsat(): boolean;
    clearAmountSentMsat(): void;
    getAmountSentMsat(): cln_primitives_pb.Amount | undefined;
    setAmountSentMsat(value?: cln_primitives_pb.Amount): XpayResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): XpayResponse.AsObject;
    static toObject(includeInstance: boolean, msg: XpayResponse): XpayResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: XpayResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): XpayResponse;
    static deserializeBinaryFromReader(message: XpayResponse, reader: jspb.BinaryReader): XpayResponse;
}

export namespace XpayResponse {
    export type AsObject = {
        paymentPreimage: Uint8Array | string,
        failedParts: number,
        successfulParts: number,
        amountMsat?: cln_primitives_pb.Amount.AsObject,
        amountSentMsat?: cln_primitives_pb.Amount.AsObject,
    }
}

export class StreamBlockAddedRequest extends jspb.Message { 

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): StreamBlockAddedRequest.AsObject;
    static toObject(includeInstance: boolean, msg: StreamBlockAddedRequest): StreamBlockAddedRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: StreamBlockAddedRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): StreamBlockAddedRequest;
    static deserializeBinaryFromReader(message: StreamBlockAddedRequest, reader: jspb.BinaryReader): StreamBlockAddedRequest;
}

export namespace StreamBlockAddedRequest {
    export type AsObject = {
    }
}

export class BlockAddedNotification extends jspb.Message { 
    getHash(): Uint8Array | string;
    getHash_asU8(): Uint8Array;
    getHash_asB64(): string;
    setHash(value: Uint8Array | string): BlockAddedNotification;
    getHeight(): number;
    setHeight(value: number): BlockAddedNotification;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): BlockAddedNotification.AsObject;
    static toObject(includeInstance: boolean, msg: BlockAddedNotification): BlockAddedNotification.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: BlockAddedNotification, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): BlockAddedNotification;
    static deserializeBinaryFromReader(message: BlockAddedNotification, reader: jspb.BinaryReader): BlockAddedNotification;
}

export namespace BlockAddedNotification {
    export type AsObject = {
        hash: Uint8Array | string,
        height: number,
    }
}

export class StreamChannelOpenFailedRequest extends jspb.Message { 

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): StreamChannelOpenFailedRequest.AsObject;
    static toObject(includeInstance: boolean, msg: StreamChannelOpenFailedRequest): StreamChannelOpenFailedRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: StreamChannelOpenFailedRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): StreamChannelOpenFailedRequest;
    static deserializeBinaryFromReader(message: StreamChannelOpenFailedRequest, reader: jspb.BinaryReader): StreamChannelOpenFailedRequest;
}

export namespace StreamChannelOpenFailedRequest {
    export type AsObject = {
    }
}

export class ChannelOpenFailedNotification extends jspb.Message { 
    getChannelId(): Uint8Array | string;
    getChannelId_asU8(): Uint8Array;
    getChannelId_asB64(): string;
    setChannelId(value: Uint8Array | string): ChannelOpenFailedNotification;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ChannelOpenFailedNotification.AsObject;
    static toObject(includeInstance: boolean, msg: ChannelOpenFailedNotification): ChannelOpenFailedNotification.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ChannelOpenFailedNotification, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ChannelOpenFailedNotification;
    static deserializeBinaryFromReader(message: ChannelOpenFailedNotification, reader: jspb.BinaryReader): ChannelOpenFailedNotification;
}

export namespace ChannelOpenFailedNotification {
    export type AsObject = {
        channelId: Uint8Array | string,
    }
}

export class StreamChannelOpenedRequest extends jspb.Message { 

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): StreamChannelOpenedRequest.AsObject;
    static toObject(includeInstance: boolean, msg: StreamChannelOpenedRequest): StreamChannelOpenedRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: StreamChannelOpenedRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): StreamChannelOpenedRequest;
    static deserializeBinaryFromReader(message: StreamChannelOpenedRequest, reader: jspb.BinaryReader): StreamChannelOpenedRequest;
}

export namespace StreamChannelOpenedRequest {
    export type AsObject = {
    }
}

export class ChannelOpenedNotification extends jspb.Message { 
    getId(): Uint8Array | string;
    getId_asU8(): Uint8Array;
    getId_asB64(): string;
    setId(value: Uint8Array | string): ChannelOpenedNotification;

    hasFundingMsat(): boolean;
    clearFundingMsat(): void;
    getFundingMsat(): cln_primitives_pb.Amount | undefined;
    setFundingMsat(value?: cln_primitives_pb.Amount): ChannelOpenedNotification;
    getFundingTxid(): Uint8Array | string;
    getFundingTxid_asU8(): Uint8Array;
    getFundingTxid_asB64(): string;
    setFundingTxid(value: Uint8Array | string): ChannelOpenedNotification;
    getChannelReady(): boolean;
    setChannelReady(value: boolean): ChannelOpenedNotification;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ChannelOpenedNotification.AsObject;
    static toObject(includeInstance: boolean, msg: ChannelOpenedNotification): ChannelOpenedNotification.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ChannelOpenedNotification, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ChannelOpenedNotification;
    static deserializeBinaryFromReader(message: ChannelOpenedNotification, reader: jspb.BinaryReader): ChannelOpenedNotification;
}

export namespace ChannelOpenedNotification {
    export type AsObject = {
        id: Uint8Array | string,
        fundingMsat?: cln_primitives_pb.Amount.AsObject,
        fundingTxid: Uint8Array | string,
        channelReady: boolean,
    }
}

export class StreamConnectRequest extends jspb.Message { 

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): StreamConnectRequest.AsObject;
    static toObject(includeInstance: boolean, msg: StreamConnectRequest): StreamConnectRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: StreamConnectRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): StreamConnectRequest;
    static deserializeBinaryFromReader(message: StreamConnectRequest, reader: jspb.BinaryReader): StreamConnectRequest;
}

export namespace StreamConnectRequest {
    export type AsObject = {
    }
}

export class PeerConnectNotification extends jspb.Message { 
    getId(): Uint8Array | string;
    getId_asU8(): Uint8Array;
    getId_asB64(): string;
    setId(value: Uint8Array | string): PeerConnectNotification;
    getDirection(): PeerConnectNotification.PeerConnectDirection;
    setDirection(value: PeerConnectNotification.PeerConnectDirection): PeerConnectNotification;

    hasAddress(): boolean;
    clearAddress(): void;
    getAddress(): PeerConnectAddress | undefined;
    setAddress(value?: PeerConnectAddress): PeerConnectNotification;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): PeerConnectNotification.AsObject;
    static toObject(includeInstance: boolean, msg: PeerConnectNotification): PeerConnectNotification.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: PeerConnectNotification, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): PeerConnectNotification;
    static deserializeBinaryFromReader(message: PeerConnectNotification, reader: jspb.BinaryReader): PeerConnectNotification;
}

export namespace PeerConnectNotification {
    export type AsObject = {
        id: Uint8Array | string,
        direction: PeerConnectNotification.PeerConnectDirection,
        address?: PeerConnectAddress.AsObject,
    }

    export enum PeerConnectDirection {
    IN = 0,
    OUT = 1,
    }

}

export class PeerConnectAddress extends jspb.Message { 
    getItemType(): PeerConnectAddress.PeerConnectAddressType;
    setItemType(value: PeerConnectAddress.PeerConnectAddressType): PeerConnectAddress;

    hasSocket(): boolean;
    clearSocket(): void;
    getSocket(): string | undefined;
    setSocket(value: string): PeerConnectAddress;

    hasAddress(): boolean;
    clearAddress(): void;
    getAddress(): string | undefined;
    setAddress(value: string): PeerConnectAddress;

    hasPort(): boolean;
    clearPort(): void;
    getPort(): number | undefined;
    setPort(value: number): PeerConnectAddress;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): PeerConnectAddress.AsObject;
    static toObject(includeInstance: boolean, msg: PeerConnectAddress): PeerConnectAddress.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: PeerConnectAddress, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): PeerConnectAddress;
    static deserializeBinaryFromReader(message: PeerConnectAddress, reader: jspb.BinaryReader): PeerConnectAddress;
}

export namespace PeerConnectAddress {
    export type AsObject = {
        itemType: PeerConnectAddress.PeerConnectAddressType,
        socket?: string,
        address?: string,
        port?: number,
    }

    export enum PeerConnectAddressType {
    LOCAL_SOCKET = 0,
    IPV4 = 1,
    IPV6 = 2,
    TORV2 = 3,
    TORV3 = 4,
    }

}

export class StreamCustomMsgRequest extends jspb.Message { 

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): StreamCustomMsgRequest.AsObject;
    static toObject(includeInstance: boolean, msg: StreamCustomMsgRequest): StreamCustomMsgRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: StreamCustomMsgRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): StreamCustomMsgRequest;
    static deserializeBinaryFromReader(message: StreamCustomMsgRequest, reader: jspb.BinaryReader): StreamCustomMsgRequest;
}

export namespace StreamCustomMsgRequest {
    export type AsObject = {
    }
}

export class CustomMsgNotification extends jspb.Message { 
    getPeerId(): Uint8Array | string;
    getPeerId_asU8(): Uint8Array;
    getPeerId_asB64(): string;
    setPeerId(value: Uint8Array | string): CustomMsgNotification;
    getPayload(): Uint8Array | string;
    getPayload_asU8(): Uint8Array;
    getPayload_asB64(): string;
    setPayload(value: Uint8Array | string): CustomMsgNotification;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): CustomMsgNotification.AsObject;
    static toObject(includeInstance: boolean, msg: CustomMsgNotification): CustomMsgNotification.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: CustomMsgNotification, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): CustomMsgNotification;
    static deserializeBinaryFromReader(message: CustomMsgNotification, reader: jspb.BinaryReader): CustomMsgNotification;
}

export namespace CustomMsgNotification {
    export type AsObject = {
        peerId: Uint8Array | string,
        payload: Uint8Array | string,
    }
}
