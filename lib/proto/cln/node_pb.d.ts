// package: cln
// file: cln/node.proto

/* tslint:disable */

/* eslint-disable */
import * as jspb from 'google-protobuf';
import * as cln_primitives_pb from '../cln/primitives_pb';

export class GetinfoRequest extends jspb.Message {
  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): GetinfoRequest.AsObject;
  static toObject(
    includeInstance: boolean,
    msg: GetinfoRequest,
  ): GetinfoRequest.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: GetinfoRequest,
    writer: jspb.BinaryWriter,
  ): void;
  static deserializeBinary(bytes: Uint8Array): GetinfoRequest;
  static deserializeBinaryFromReader(
    message: GetinfoRequest,
    reader: jspb.BinaryReader,
  ): GetinfoRequest;
}

export namespace GetinfoRequest {
  export type AsObject = {};
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
  static toObject(
    includeInstance: boolean,
    msg: GetinfoResponse,
  ): GetinfoResponse.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: GetinfoResponse,
    writer: jspb.BinaryWriter,
  ): void;
  static deserializeBinary(bytes: Uint8Array): GetinfoResponse;
  static deserializeBinaryFromReader(
    message: GetinfoResponse,
    reader: jspb.BinaryReader,
  ): GetinfoResponse;
}

export namespace GetinfoResponse {
  export type AsObject = {
    id: Uint8Array | string;
    alias?: string;
    color: Uint8Array | string;
    numPeers: number;
    numPendingChannels: number;
    numActiveChannels: number;
    numInactiveChannels: number;
    version: string;
    lightningDir: string;
    ourFeatures?: GetinfoOur_features.AsObject;
    blockheight: number;
    network: string;
    feesCollectedMsat?: cln_primitives_pb.Amount.AsObject;
    addressList: Array<GetinfoAddress.AsObject>;
    bindingList: Array<GetinfoBinding.AsObject>;
    warningBitcoindSync?: string;
    warningLightningdSync?: string;
  };
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
  static toObject(
    includeInstance: boolean,
    msg: GetinfoOur_features,
  ): GetinfoOur_features.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: GetinfoOur_features,
    writer: jspb.BinaryWriter,
  ): void;
  static deserializeBinary(bytes: Uint8Array): GetinfoOur_features;
  static deserializeBinaryFromReader(
    message: GetinfoOur_features,
    reader: jspb.BinaryReader,
  ): GetinfoOur_features;
}

export namespace GetinfoOur_features {
  export type AsObject = {
    init: Uint8Array | string;
    node: Uint8Array | string;
    channel: Uint8Array | string;
    invoice: Uint8Array | string;
  };
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
  static toObject(
    includeInstance: boolean,
    msg: GetinfoAddress,
  ): GetinfoAddress.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: GetinfoAddress,
    writer: jspb.BinaryWriter,
  ): void;
  static deserializeBinary(bytes: Uint8Array): GetinfoAddress;
  static deserializeBinaryFromReader(
    message: GetinfoAddress,
    reader: jspb.BinaryReader,
  ): GetinfoAddress;
}

export namespace GetinfoAddress {
  export type AsObject = {
    itemType: GetinfoAddress.GetinfoAddressType;
    port: number;
    address?: string;
  };

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

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): GetinfoBinding.AsObject;
  static toObject(
    includeInstance: boolean,
    msg: GetinfoBinding,
  ): GetinfoBinding.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: GetinfoBinding,
    writer: jspb.BinaryWriter,
  ): void;
  static deserializeBinary(bytes: Uint8Array): GetinfoBinding;
  static deserializeBinaryFromReader(
    message: GetinfoBinding,
    reader: jspb.BinaryReader,
  ): GetinfoBinding;
}

export namespace GetinfoBinding {
  export type AsObject = {
    itemType: GetinfoBinding.GetinfoBindingType;
    address?: string;
    port?: number;
    socket?: string;
  };

  export enum GetinfoBindingType {
    LOCAL_SOCKET = 0,
    WEBSOCKET = 5,
    IPV4 = 1,
    IPV6 = 2,
    TORV2 = 3,
    TORV3 = 4,
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
  getLevel(): string | undefined;
  setLevel(value: string): ListpeersRequest;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ListpeersRequest.AsObject;
  static toObject(
    includeInstance: boolean,
    msg: ListpeersRequest,
  ): ListpeersRequest.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: ListpeersRequest,
    writer: jspb.BinaryWriter,
  ): void;
  static deserializeBinary(bytes: Uint8Array): ListpeersRequest;
  static deserializeBinaryFromReader(
    message: ListpeersRequest,
    reader: jspb.BinaryReader,
  ): ListpeersRequest;
}

export namespace ListpeersRequest {
  export type AsObject = {
    id: Uint8Array | string;
    level?: string;
  };
}

export class ListpeersResponse extends jspb.Message {
  clearPeersList(): void;
  getPeersList(): Array<ListpeersPeers>;
  setPeersList(value: Array<ListpeersPeers>): ListpeersResponse;
  addPeers(value?: ListpeersPeers, index?: number): ListpeersPeers;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ListpeersResponse.AsObject;
  static toObject(
    includeInstance: boolean,
    msg: ListpeersResponse,
  ): ListpeersResponse.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: ListpeersResponse,
    writer: jspb.BinaryWriter,
  ): void;
  static deserializeBinary(bytes: Uint8Array): ListpeersResponse;
  static deserializeBinaryFromReader(
    message: ListpeersResponse,
    reader: jspb.BinaryReader,
  ): ListpeersResponse;
}

export namespace ListpeersResponse {
  export type AsObject = {
    peersList: Array<ListpeersPeers.AsObject>;
  };
}

export class ListpeersPeers extends jspb.Message {
  getId(): Uint8Array | string;
  getId_asU8(): Uint8Array;
  getId_asB64(): string;
  setId(value: Uint8Array | string): ListpeersPeers;
  getConnected(): boolean;
  setConnected(value: boolean): ListpeersPeers;

  hasNumChannels(): boolean;
  clearNumChannels(): void;
  getNumChannels(): number | undefined;
  setNumChannels(value: number): ListpeersPeers;
  clearLogList(): void;
  getLogList(): Array<ListpeersPeersLog>;
  setLogList(value: Array<ListpeersPeersLog>): ListpeersPeers;
  addLog(value?: ListpeersPeersLog, index?: number): ListpeersPeersLog;
  clearChannelsList(): void;
  getChannelsList(): Array<ListpeersPeersChannels>;
  setChannelsList(value: Array<ListpeersPeersChannels>): ListpeersPeers;
  addChannels(
    value?: ListpeersPeersChannels,
    index?: number,
  ): ListpeersPeersChannels;
  clearNetaddrList(): void;
  getNetaddrList(): Array<string>;
  setNetaddrList(value: Array<string>): ListpeersPeers;
  addNetaddr(value: string, index?: number): string;

  hasRemoteAddr(): boolean;
  clearRemoteAddr(): void;
  getRemoteAddr(): string | undefined;
  setRemoteAddr(value: string): ListpeersPeers;

  hasFeatures(): boolean;
  clearFeatures(): void;
  getFeatures(): Uint8Array | string;
  getFeatures_asU8(): Uint8Array;
  getFeatures_asB64(): string;
  setFeatures(value: Uint8Array | string): ListpeersPeers;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ListpeersPeers.AsObject;
  static toObject(
    includeInstance: boolean,
    msg: ListpeersPeers,
  ): ListpeersPeers.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: ListpeersPeers,
    writer: jspb.BinaryWriter,
  ): void;
  static deserializeBinary(bytes: Uint8Array): ListpeersPeers;
  static deserializeBinaryFromReader(
    message: ListpeersPeers,
    reader: jspb.BinaryReader,
  ): ListpeersPeers;
}

export namespace ListpeersPeers {
  export type AsObject = {
    id: Uint8Array | string;
    connected: boolean;
    numChannels?: number;
    logList: Array<ListpeersPeersLog.AsObject>;
    channelsList: Array<ListpeersPeersChannels.AsObject>;
    netaddrList: Array<string>;
    remoteAddr?: string;
    features: Uint8Array | string;
  };
}

export class ListpeersPeersLog extends jspb.Message {
  getItemType(): ListpeersPeersLog.ListpeersPeersLogType;
  setItemType(
    value: ListpeersPeersLog.ListpeersPeersLogType,
  ): ListpeersPeersLog;

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
  static toObject(
    includeInstance: boolean,
    msg: ListpeersPeersLog,
  ): ListpeersPeersLog.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: ListpeersPeersLog,
    writer: jspb.BinaryWriter,
  ): void;
  static deserializeBinary(bytes: Uint8Array): ListpeersPeersLog;
  static deserializeBinaryFromReader(
    message: ListpeersPeersLog,
    reader: jspb.BinaryReader,
  ): ListpeersPeersLog;
}

export namespace ListpeersPeersLog {
  export type AsObject = {
    itemType: ListpeersPeersLog.ListpeersPeersLogType;
    numSkipped?: number;
    time?: string;
    source?: string;
    log?: string;
    nodeId: Uint8Array | string;
    data: Uint8Array | string;
  };

  export enum ListpeersPeersLogType {
    SKIPPED = 0,
    BROKEN = 1,
    UNUSUAL = 2,
    INFO = 3,
    DEBUG = 4,
    IO_IN = 5,
    IO_OUT = 6,
  }
}

export class ListpeersPeersChannels extends jspb.Message {
  getState(): ListpeersPeersChannels.ListpeersPeersChannelsState;
  setState(
    value: ListpeersPeersChannels.ListpeersPeersChannelsState,
  ): ListpeersPeersChannels;

  hasScratchTxid(): boolean;
  clearScratchTxid(): void;
  getScratchTxid(): Uint8Array | string;
  getScratchTxid_asU8(): Uint8Array;
  getScratchTxid_asB64(): string;
  setScratchTxid(value: Uint8Array | string): ListpeersPeersChannels;

  hasFeerate(): boolean;
  clearFeerate(): void;
  getFeerate(): ListpeersPeersChannelsFeerate | undefined;
  setFeerate(value?: ListpeersPeersChannelsFeerate): ListpeersPeersChannels;

  hasOwner(): boolean;
  clearOwner(): void;
  getOwner(): string | undefined;
  setOwner(value: string): ListpeersPeersChannels;

  hasShortChannelId(): boolean;
  clearShortChannelId(): void;
  getShortChannelId(): string | undefined;
  setShortChannelId(value: string): ListpeersPeersChannels;

  hasChannelId(): boolean;
  clearChannelId(): void;
  getChannelId(): Uint8Array | string;
  getChannelId_asU8(): Uint8Array;
  getChannelId_asB64(): string;
  setChannelId(value: Uint8Array | string): ListpeersPeersChannels;

  hasFundingTxid(): boolean;
  clearFundingTxid(): void;
  getFundingTxid(): Uint8Array | string;
  getFundingTxid_asU8(): Uint8Array;
  getFundingTxid_asB64(): string;
  setFundingTxid(value: Uint8Array | string): ListpeersPeersChannels;

  hasFundingOutnum(): boolean;
  clearFundingOutnum(): void;
  getFundingOutnum(): number | undefined;
  setFundingOutnum(value: number): ListpeersPeersChannels;

  hasInitialFeerate(): boolean;
  clearInitialFeerate(): void;
  getInitialFeerate(): string | undefined;
  setInitialFeerate(value: string): ListpeersPeersChannels;

  hasLastFeerate(): boolean;
  clearLastFeerate(): void;
  getLastFeerate(): string | undefined;
  setLastFeerate(value: string): ListpeersPeersChannels;

  hasNextFeerate(): boolean;
  clearNextFeerate(): void;
  getNextFeerate(): string | undefined;
  setNextFeerate(value: string): ListpeersPeersChannels;

  hasNextFeeStep(): boolean;
  clearNextFeeStep(): void;
  getNextFeeStep(): number | undefined;
  setNextFeeStep(value: number): ListpeersPeersChannels;
  clearInflightList(): void;
  getInflightList(): Array<ListpeersPeersChannelsInflight>;
  setInflightList(
    value: Array<ListpeersPeersChannelsInflight>,
  ): ListpeersPeersChannels;
  addInflight(
    value?: ListpeersPeersChannelsInflight,
    index?: number,
  ): ListpeersPeersChannelsInflight;

  hasCloseTo(): boolean;
  clearCloseTo(): void;
  getCloseTo(): Uint8Array | string;
  getCloseTo_asU8(): Uint8Array;
  getCloseTo_asB64(): string;
  setCloseTo(value: Uint8Array | string): ListpeersPeersChannels;

  hasPrivate(): boolean;
  clearPrivate(): void;
  getPrivate(): boolean | undefined;
  setPrivate(value: boolean): ListpeersPeersChannels;
  getOpener(): cln_primitives_pb.ChannelSide;
  setOpener(value: cln_primitives_pb.ChannelSide): ListpeersPeersChannels;

  hasCloser(): boolean;
  clearCloser(): void;
  getCloser(): cln_primitives_pb.ChannelSide | undefined;
  setCloser(value: cln_primitives_pb.ChannelSide): ListpeersPeersChannels;
  clearFeaturesList(): void;
  getFeaturesList(): Array<string>;
  setFeaturesList(value: Array<string>): ListpeersPeersChannels;
  addFeatures(value: string, index?: number): string;

  hasFunding(): boolean;
  clearFunding(): void;
  getFunding(): ListpeersPeersChannelsFunding | undefined;
  setFunding(value?: ListpeersPeersChannelsFunding): ListpeersPeersChannels;

  hasToUsMsat(): boolean;
  clearToUsMsat(): void;
  getToUsMsat(): cln_primitives_pb.Amount | undefined;
  setToUsMsat(value?: cln_primitives_pb.Amount): ListpeersPeersChannels;

  hasMinToUsMsat(): boolean;
  clearMinToUsMsat(): void;
  getMinToUsMsat(): cln_primitives_pb.Amount | undefined;
  setMinToUsMsat(value?: cln_primitives_pb.Amount): ListpeersPeersChannels;

  hasMaxToUsMsat(): boolean;
  clearMaxToUsMsat(): void;
  getMaxToUsMsat(): cln_primitives_pb.Amount | undefined;
  setMaxToUsMsat(value?: cln_primitives_pb.Amount): ListpeersPeersChannels;

  hasTotalMsat(): boolean;
  clearTotalMsat(): void;
  getTotalMsat(): cln_primitives_pb.Amount | undefined;
  setTotalMsat(value?: cln_primitives_pb.Amount): ListpeersPeersChannels;

  hasFeeBaseMsat(): boolean;
  clearFeeBaseMsat(): void;
  getFeeBaseMsat(): cln_primitives_pb.Amount | undefined;
  setFeeBaseMsat(value?: cln_primitives_pb.Amount): ListpeersPeersChannels;

  hasFeeProportionalMillionths(): boolean;
  clearFeeProportionalMillionths(): void;
  getFeeProportionalMillionths(): number | undefined;
  setFeeProportionalMillionths(value: number): ListpeersPeersChannels;

  hasDustLimitMsat(): boolean;
  clearDustLimitMsat(): void;
  getDustLimitMsat(): cln_primitives_pb.Amount | undefined;
  setDustLimitMsat(value?: cln_primitives_pb.Amount): ListpeersPeersChannels;

  hasMaxTotalHtlcInMsat(): boolean;
  clearMaxTotalHtlcInMsat(): void;
  getMaxTotalHtlcInMsat(): cln_primitives_pb.Amount | undefined;
  setMaxTotalHtlcInMsat(
    value?: cln_primitives_pb.Amount,
  ): ListpeersPeersChannels;

  hasTheirReserveMsat(): boolean;
  clearTheirReserveMsat(): void;
  getTheirReserveMsat(): cln_primitives_pb.Amount | undefined;
  setTheirReserveMsat(value?: cln_primitives_pb.Amount): ListpeersPeersChannels;

  hasOurReserveMsat(): boolean;
  clearOurReserveMsat(): void;
  getOurReserveMsat(): cln_primitives_pb.Amount | undefined;
  setOurReserveMsat(value?: cln_primitives_pb.Amount): ListpeersPeersChannels;

  hasSpendableMsat(): boolean;
  clearSpendableMsat(): void;
  getSpendableMsat(): cln_primitives_pb.Amount | undefined;
  setSpendableMsat(value?: cln_primitives_pb.Amount): ListpeersPeersChannels;

  hasReceivableMsat(): boolean;
  clearReceivableMsat(): void;
  getReceivableMsat(): cln_primitives_pb.Amount | undefined;
  setReceivableMsat(value?: cln_primitives_pb.Amount): ListpeersPeersChannels;

  hasMinimumHtlcInMsat(): boolean;
  clearMinimumHtlcInMsat(): void;
  getMinimumHtlcInMsat(): cln_primitives_pb.Amount | undefined;
  setMinimumHtlcInMsat(
    value?: cln_primitives_pb.Amount,
  ): ListpeersPeersChannels;

  hasMinimumHtlcOutMsat(): boolean;
  clearMinimumHtlcOutMsat(): void;
  getMinimumHtlcOutMsat(): cln_primitives_pb.Amount | undefined;
  setMinimumHtlcOutMsat(
    value?: cln_primitives_pb.Amount,
  ): ListpeersPeersChannels;

  hasMaximumHtlcOutMsat(): boolean;
  clearMaximumHtlcOutMsat(): void;
  getMaximumHtlcOutMsat(): cln_primitives_pb.Amount | undefined;
  setMaximumHtlcOutMsat(
    value?: cln_primitives_pb.Amount,
  ): ListpeersPeersChannels;

  hasTheirToSelfDelay(): boolean;
  clearTheirToSelfDelay(): void;
  getTheirToSelfDelay(): number | undefined;
  setTheirToSelfDelay(value: number): ListpeersPeersChannels;

  hasOurToSelfDelay(): boolean;
  clearOurToSelfDelay(): void;
  getOurToSelfDelay(): number | undefined;
  setOurToSelfDelay(value: number): ListpeersPeersChannels;

  hasMaxAcceptedHtlcs(): boolean;
  clearMaxAcceptedHtlcs(): void;
  getMaxAcceptedHtlcs(): number | undefined;
  setMaxAcceptedHtlcs(value: number): ListpeersPeersChannels;

  hasAlias(): boolean;
  clearAlias(): void;
  getAlias(): ListpeersPeersChannelsAlias | undefined;
  setAlias(value?: ListpeersPeersChannelsAlias): ListpeersPeersChannels;
  clearStatusList(): void;
  getStatusList(): Array<string>;
  setStatusList(value: Array<string>): ListpeersPeersChannels;
  addStatus(value: string, index?: number): string;

  hasInPaymentsOffered(): boolean;
  clearInPaymentsOffered(): void;
  getInPaymentsOffered(): number | undefined;
  setInPaymentsOffered(value: number): ListpeersPeersChannels;

  hasInOfferedMsat(): boolean;
  clearInOfferedMsat(): void;
  getInOfferedMsat(): cln_primitives_pb.Amount | undefined;
  setInOfferedMsat(value?: cln_primitives_pb.Amount): ListpeersPeersChannels;

  hasInPaymentsFulfilled(): boolean;
  clearInPaymentsFulfilled(): void;
  getInPaymentsFulfilled(): number | undefined;
  setInPaymentsFulfilled(value: number): ListpeersPeersChannels;

  hasInFulfilledMsat(): boolean;
  clearInFulfilledMsat(): void;
  getInFulfilledMsat(): cln_primitives_pb.Amount | undefined;
  setInFulfilledMsat(value?: cln_primitives_pb.Amount): ListpeersPeersChannels;

  hasOutPaymentsOffered(): boolean;
  clearOutPaymentsOffered(): void;
  getOutPaymentsOffered(): number | undefined;
  setOutPaymentsOffered(value: number): ListpeersPeersChannels;

  hasOutOfferedMsat(): boolean;
  clearOutOfferedMsat(): void;
  getOutOfferedMsat(): cln_primitives_pb.Amount | undefined;
  setOutOfferedMsat(value?: cln_primitives_pb.Amount): ListpeersPeersChannels;

  hasOutPaymentsFulfilled(): boolean;
  clearOutPaymentsFulfilled(): void;
  getOutPaymentsFulfilled(): number | undefined;
  setOutPaymentsFulfilled(value: number): ListpeersPeersChannels;

  hasOutFulfilledMsat(): boolean;
  clearOutFulfilledMsat(): void;
  getOutFulfilledMsat(): cln_primitives_pb.Amount | undefined;
  setOutFulfilledMsat(value?: cln_primitives_pb.Amount): ListpeersPeersChannels;
  clearHtlcsList(): void;
  getHtlcsList(): Array<ListpeersPeersChannelsHtlcs>;
  setHtlcsList(
    value: Array<ListpeersPeersChannelsHtlcs>,
  ): ListpeersPeersChannels;
  addHtlcs(
    value?: ListpeersPeersChannelsHtlcs,
    index?: number,
  ): ListpeersPeersChannelsHtlcs;

  hasCloseToAddr(): boolean;
  clearCloseToAddr(): void;
  getCloseToAddr(): string | undefined;
  setCloseToAddr(value: string): ListpeersPeersChannels;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ListpeersPeersChannels.AsObject;
  static toObject(
    includeInstance: boolean,
    msg: ListpeersPeersChannels,
  ): ListpeersPeersChannels.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: ListpeersPeersChannels,
    writer: jspb.BinaryWriter,
  ): void;
  static deserializeBinary(bytes: Uint8Array): ListpeersPeersChannels;
  static deserializeBinaryFromReader(
    message: ListpeersPeersChannels,
    reader: jspb.BinaryReader,
  ): ListpeersPeersChannels;
}

export namespace ListpeersPeersChannels {
  export type AsObject = {
    state: ListpeersPeersChannels.ListpeersPeersChannelsState;
    scratchTxid: Uint8Array | string;
    feerate?: ListpeersPeersChannelsFeerate.AsObject;
    owner?: string;
    shortChannelId?: string;
    channelId: Uint8Array | string;
    fundingTxid: Uint8Array | string;
    fundingOutnum?: number;
    initialFeerate?: string;
    lastFeerate?: string;
    nextFeerate?: string;
    nextFeeStep?: number;
    inflightList: Array<ListpeersPeersChannelsInflight.AsObject>;
    closeTo: Uint8Array | string;
    pb_private?: boolean;
    opener: cln_primitives_pb.ChannelSide;
    closer?: cln_primitives_pb.ChannelSide;
    featuresList: Array<string>;
    funding?: ListpeersPeersChannelsFunding.AsObject;
    toUsMsat?: cln_primitives_pb.Amount.AsObject;
    minToUsMsat?: cln_primitives_pb.Amount.AsObject;
    maxToUsMsat?: cln_primitives_pb.Amount.AsObject;
    totalMsat?: cln_primitives_pb.Amount.AsObject;
    feeBaseMsat?: cln_primitives_pb.Amount.AsObject;
    feeProportionalMillionths?: number;
    dustLimitMsat?: cln_primitives_pb.Amount.AsObject;
    maxTotalHtlcInMsat?: cln_primitives_pb.Amount.AsObject;
    theirReserveMsat?: cln_primitives_pb.Amount.AsObject;
    ourReserveMsat?: cln_primitives_pb.Amount.AsObject;
    spendableMsat?: cln_primitives_pb.Amount.AsObject;
    receivableMsat?: cln_primitives_pb.Amount.AsObject;
    minimumHtlcInMsat?: cln_primitives_pb.Amount.AsObject;
    minimumHtlcOutMsat?: cln_primitives_pb.Amount.AsObject;
    maximumHtlcOutMsat?: cln_primitives_pb.Amount.AsObject;
    theirToSelfDelay?: number;
    ourToSelfDelay?: number;
    maxAcceptedHtlcs?: number;
    alias?: ListpeersPeersChannelsAlias.AsObject;
    statusList: Array<string>;
    inPaymentsOffered?: number;
    inOfferedMsat?: cln_primitives_pb.Amount.AsObject;
    inPaymentsFulfilled?: number;
    inFulfilledMsat?: cln_primitives_pb.Amount.AsObject;
    outPaymentsOffered?: number;
    outOfferedMsat?: cln_primitives_pb.Amount.AsObject;
    outPaymentsFulfilled?: number;
    outFulfilledMsat?: cln_primitives_pb.Amount.AsObject;
    htlcsList: Array<ListpeersPeersChannelsHtlcs.AsObject>;
    closeToAddr?: string;
  };

  export enum ListpeersPeersChannelsState {
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
    DUALOPEND_OPEN_COMMITTED = 11,
    DUALOPEND_OPEN_COMMIT_READY = 12,
  }
}

export class ListpeersPeersChannelsFeerate extends jspb.Message {
  getPerkw(): number;
  setPerkw(value: number): ListpeersPeersChannelsFeerate;
  getPerkb(): number;
  setPerkb(value: number): ListpeersPeersChannelsFeerate;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ListpeersPeersChannelsFeerate.AsObject;
  static toObject(
    includeInstance: boolean,
    msg: ListpeersPeersChannelsFeerate,
  ): ListpeersPeersChannelsFeerate.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: ListpeersPeersChannelsFeerate,
    writer: jspb.BinaryWriter,
  ): void;
  static deserializeBinary(bytes: Uint8Array): ListpeersPeersChannelsFeerate;
  static deserializeBinaryFromReader(
    message: ListpeersPeersChannelsFeerate,
    reader: jspb.BinaryReader,
  ): ListpeersPeersChannelsFeerate;
}

export namespace ListpeersPeersChannelsFeerate {
  export type AsObject = {
    perkw: number;
    perkb: number;
  };
}

export class ListpeersPeersChannelsInflight extends jspb.Message {
  getFundingTxid(): Uint8Array | string;
  getFundingTxid_asU8(): Uint8Array;
  getFundingTxid_asB64(): string;
  setFundingTxid(value: Uint8Array | string): ListpeersPeersChannelsInflight;
  getFundingOutnum(): number;
  setFundingOutnum(value: number): ListpeersPeersChannelsInflight;
  getFeerate(): string;
  setFeerate(value: string): ListpeersPeersChannelsInflight;

  hasTotalFundingMsat(): boolean;
  clearTotalFundingMsat(): void;
  getTotalFundingMsat(): cln_primitives_pb.Amount | undefined;
  setTotalFundingMsat(
    value?: cln_primitives_pb.Amount,
  ): ListpeersPeersChannelsInflight;

  hasOurFundingMsat(): boolean;
  clearOurFundingMsat(): void;
  getOurFundingMsat(): cln_primitives_pb.Amount | undefined;
  setOurFundingMsat(
    value?: cln_primitives_pb.Amount,
  ): ListpeersPeersChannelsInflight;

  hasSpliceAmount(): boolean;
  clearSpliceAmount(): void;
  getSpliceAmount(): number | undefined;
  setSpliceAmount(value: number): ListpeersPeersChannelsInflight;
  getScratchTxid(): Uint8Array | string;
  getScratchTxid_asU8(): Uint8Array;
  getScratchTxid_asB64(): string;
  setScratchTxid(value: Uint8Array | string): ListpeersPeersChannelsInflight;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ListpeersPeersChannelsInflight.AsObject;
  static toObject(
    includeInstance: boolean,
    msg: ListpeersPeersChannelsInflight,
  ): ListpeersPeersChannelsInflight.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: ListpeersPeersChannelsInflight,
    writer: jspb.BinaryWriter,
  ): void;
  static deserializeBinary(bytes: Uint8Array): ListpeersPeersChannelsInflight;
  static deserializeBinaryFromReader(
    message: ListpeersPeersChannelsInflight,
    reader: jspb.BinaryReader,
  ): ListpeersPeersChannelsInflight;
}

export namespace ListpeersPeersChannelsInflight {
  export type AsObject = {
    fundingTxid: Uint8Array | string;
    fundingOutnum: number;
    feerate: string;
    totalFundingMsat?: cln_primitives_pb.Amount.AsObject;
    ourFundingMsat?: cln_primitives_pb.Amount.AsObject;
    spliceAmount?: number;
    scratchTxid: Uint8Array | string;
  };
}

export class ListpeersPeersChannelsFunding extends jspb.Message {
  hasPushedMsat(): boolean;
  clearPushedMsat(): void;
  getPushedMsat(): cln_primitives_pb.Amount | undefined;
  setPushedMsat(
    value?: cln_primitives_pb.Amount,
  ): ListpeersPeersChannelsFunding;

  hasLocalFundsMsat(): boolean;
  clearLocalFundsMsat(): void;
  getLocalFundsMsat(): cln_primitives_pb.Amount | undefined;
  setLocalFundsMsat(
    value?: cln_primitives_pb.Amount,
  ): ListpeersPeersChannelsFunding;

  hasRemoteFundsMsat(): boolean;
  clearRemoteFundsMsat(): void;
  getRemoteFundsMsat(): cln_primitives_pb.Amount | undefined;
  setRemoteFundsMsat(
    value?: cln_primitives_pb.Amount,
  ): ListpeersPeersChannelsFunding;

  hasFeePaidMsat(): boolean;
  clearFeePaidMsat(): void;
  getFeePaidMsat(): cln_primitives_pb.Amount | undefined;
  setFeePaidMsat(
    value?: cln_primitives_pb.Amount,
  ): ListpeersPeersChannelsFunding;

  hasFeeRcvdMsat(): boolean;
  clearFeeRcvdMsat(): void;
  getFeeRcvdMsat(): cln_primitives_pb.Amount | undefined;
  setFeeRcvdMsat(
    value?: cln_primitives_pb.Amount,
  ): ListpeersPeersChannelsFunding;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ListpeersPeersChannelsFunding.AsObject;
  static toObject(
    includeInstance: boolean,
    msg: ListpeersPeersChannelsFunding,
  ): ListpeersPeersChannelsFunding.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: ListpeersPeersChannelsFunding,
    writer: jspb.BinaryWriter,
  ): void;
  static deserializeBinary(bytes: Uint8Array): ListpeersPeersChannelsFunding;
  static deserializeBinaryFromReader(
    message: ListpeersPeersChannelsFunding,
    reader: jspb.BinaryReader,
  ): ListpeersPeersChannelsFunding;
}

export namespace ListpeersPeersChannelsFunding {
  export type AsObject = {
    pushedMsat?: cln_primitives_pb.Amount.AsObject;
    localFundsMsat?: cln_primitives_pb.Amount.AsObject;
    remoteFundsMsat?: cln_primitives_pb.Amount.AsObject;
    feePaidMsat?: cln_primitives_pb.Amount.AsObject;
    feeRcvdMsat?: cln_primitives_pb.Amount.AsObject;
  };
}

export class ListpeersPeersChannelsAlias extends jspb.Message {
  hasLocal(): boolean;
  clearLocal(): void;
  getLocal(): string | undefined;
  setLocal(value: string): ListpeersPeersChannelsAlias;

  hasRemote(): boolean;
  clearRemote(): void;
  getRemote(): string | undefined;
  setRemote(value: string): ListpeersPeersChannelsAlias;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ListpeersPeersChannelsAlias.AsObject;
  static toObject(
    includeInstance: boolean,
    msg: ListpeersPeersChannelsAlias,
  ): ListpeersPeersChannelsAlias.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: ListpeersPeersChannelsAlias,
    writer: jspb.BinaryWriter,
  ): void;
  static deserializeBinary(bytes: Uint8Array): ListpeersPeersChannelsAlias;
  static deserializeBinaryFromReader(
    message: ListpeersPeersChannelsAlias,
    reader: jspb.BinaryReader,
  ): ListpeersPeersChannelsAlias;
}

export namespace ListpeersPeersChannelsAlias {
  export type AsObject = {
    local?: string;
    remote?: string;
  };
}

export class ListpeersPeersChannelsHtlcs extends jspb.Message {
  getDirection(): ListpeersPeersChannelsHtlcs.ListpeersPeersChannelsHtlcsDirection;
  setDirection(
    value: ListpeersPeersChannelsHtlcs.ListpeersPeersChannelsHtlcsDirection,
  ): ListpeersPeersChannelsHtlcs;
  getId(): number;
  setId(value: number): ListpeersPeersChannelsHtlcs;

  hasAmountMsat(): boolean;
  clearAmountMsat(): void;
  getAmountMsat(): cln_primitives_pb.Amount | undefined;
  setAmountMsat(value?: cln_primitives_pb.Amount): ListpeersPeersChannelsHtlcs;
  getExpiry(): number;
  setExpiry(value: number): ListpeersPeersChannelsHtlcs;
  getPaymentHash(): Uint8Array | string;
  getPaymentHash_asU8(): Uint8Array;
  getPaymentHash_asB64(): string;
  setPaymentHash(value: Uint8Array | string): ListpeersPeersChannelsHtlcs;

  hasLocalTrimmed(): boolean;
  clearLocalTrimmed(): void;
  getLocalTrimmed(): boolean | undefined;
  setLocalTrimmed(value: boolean): ListpeersPeersChannelsHtlcs;

  hasStatus(): boolean;
  clearStatus(): void;
  getStatus(): string | undefined;
  setStatus(value: string): ListpeersPeersChannelsHtlcs;
  getState(): cln_primitives_pb.HtlcState;
  setState(value: cln_primitives_pb.HtlcState): ListpeersPeersChannelsHtlcs;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ListpeersPeersChannelsHtlcs.AsObject;
  static toObject(
    includeInstance: boolean,
    msg: ListpeersPeersChannelsHtlcs,
  ): ListpeersPeersChannelsHtlcs.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: ListpeersPeersChannelsHtlcs,
    writer: jspb.BinaryWriter,
  ): void;
  static deserializeBinary(bytes: Uint8Array): ListpeersPeersChannelsHtlcs;
  static deserializeBinaryFromReader(
    message: ListpeersPeersChannelsHtlcs,
    reader: jspb.BinaryReader,
  ): ListpeersPeersChannelsHtlcs;
}

export namespace ListpeersPeersChannelsHtlcs {
  export type AsObject = {
    direction: ListpeersPeersChannelsHtlcs.ListpeersPeersChannelsHtlcsDirection;
    id: number;
    amountMsat?: cln_primitives_pb.Amount.AsObject;
    expiry: number;
    paymentHash: Uint8Array | string;
    localTrimmed?: boolean;
    status?: string;
    state: cln_primitives_pb.HtlcState;
  };

  export enum ListpeersPeersChannelsHtlcsDirection {
    IN = 0,
    OUT = 1,
  }
}

export class ListfundsRequest extends jspb.Message {
  hasSpent(): boolean;
  clearSpent(): void;
  getSpent(): boolean | undefined;
  setSpent(value: boolean): ListfundsRequest;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ListfundsRequest.AsObject;
  static toObject(
    includeInstance: boolean,
    msg: ListfundsRequest,
  ): ListfundsRequest.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: ListfundsRequest,
    writer: jspb.BinaryWriter,
  ): void;
  static deserializeBinary(bytes: Uint8Array): ListfundsRequest;
  static deserializeBinaryFromReader(
    message: ListfundsRequest,
    reader: jspb.BinaryReader,
  ): ListfundsRequest;
}

export namespace ListfundsRequest {
  export type AsObject = {
    spent?: boolean;
  };
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
  static toObject(
    includeInstance: boolean,
    msg: ListfundsResponse,
  ): ListfundsResponse.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: ListfundsResponse,
    writer: jspb.BinaryWriter,
  ): void;
  static deserializeBinary(bytes: Uint8Array): ListfundsResponse;
  static deserializeBinaryFromReader(
    message: ListfundsResponse,
    reader: jspb.BinaryReader,
  ): ListfundsResponse;
}

export namespace ListfundsResponse {
  export type AsObject = {
    outputsList: Array<ListfundsOutputs.AsObject>;
    channelsList: Array<ListfundsChannels.AsObject>;
  };
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
  getReserved(): boolean;
  setReserved(value: boolean): ListfundsOutputs;

  hasBlockheight(): boolean;
  clearBlockheight(): void;
  getBlockheight(): number | undefined;
  setBlockheight(value: number): ListfundsOutputs;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ListfundsOutputs.AsObject;
  static toObject(
    includeInstance: boolean,
    msg: ListfundsOutputs,
  ): ListfundsOutputs.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: ListfundsOutputs,
    writer: jspb.BinaryWriter,
  ): void;
  static deserializeBinary(bytes: Uint8Array): ListfundsOutputs;
  static deserializeBinaryFromReader(
    message: ListfundsOutputs,
    reader: jspb.BinaryReader,
  ): ListfundsOutputs;
}

export namespace ListfundsOutputs {
  export type AsObject = {
    txid: Uint8Array | string;
    output: number;
    amountMsat?: cln_primitives_pb.Amount.AsObject;
    scriptpubkey: Uint8Array | string;
    address?: string;
    redeemscript: Uint8Array | string;
    status: ListfundsOutputs.ListfundsOutputsStatus;
    reserved: boolean;
    blockheight?: number;
  };

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

  hasChannelId(): boolean;
  clearChannelId(): void;
  getChannelId(): Uint8Array | string;
  getChannelId_asU8(): Uint8Array;
  getChannelId_asB64(): string;
  setChannelId(value: Uint8Array | string): ListfundsChannels;

  hasShortChannelId(): boolean;
  clearShortChannelId(): void;
  getShortChannelId(): string | undefined;
  setShortChannelId(value: string): ListfundsChannels;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ListfundsChannels.AsObject;
  static toObject(
    includeInstance: boolean,
    msg: ListfundsChannels,
  ): ListfundsChannels.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: ListfundsChannels,
    writer: jspb.BinaryWriter,
  ): void;
  static deserializeBinary(bytes: Uint8Array): ListfundsChannels;
  static deserializeBinaryFromReader(
    message: ListfundsChannels,
    reader: jspb.BinaryReader,
  ): ListfundsChannels;
}

export namespace ListfundsChannels {
  export type AsObject = {
    peerId: Uint8Array | string;
    ourAmountMsat?: cln_primitives_pb.Amount.AsObject;
    amountMsat?: cln_primitives_pb.Amount.AsObject;
    fundingTxid: Uint8Array | string;
    fundingOutput: number;
    connected: boolean;
    state: cln_primitives_pb.ChannelState;
    channelId: Uint8Array | string;
    shortChannelId?: string;
  };
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

  hasAmountMsat(): boolean;
  clearAmountMsat(): void;
  getAmountMsat(): cln_primitives_pb.Amount | undefined;
  setAmountMsat(value?: cln_primitives_pb.Amount): SendpayRequest;

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

  hasLocalinvreqid(): boolean;
  clearLocalinvreqid(): void;
  getLocalinvreqid(): Uint8Array | string;
  getLocalinvreqid_asU8(): Uint8Array;
  getLocalinvreqid_asB64(): string;
  setLocalinvreqid(value: Uint8Array | string): SendpayRequest;

  hasGroupid(): boolean;
  clearGroupid(): void;
  getGroupid(): number | undefined;
  setGroupid(value: number): SendpayRequest;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): SendpayRequest.AsObject;
  static toObject(
    includeInstance: boolean,
    msg: SendpayRequest,
  ): SendpayRequest.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: SendpayRequest,
    writer: jspb.BinaryWriter,
  ): void;
  static deserializeBinary(bytes: Uint8Array): SendpayRequest;
  static deserializeBinaryFromReader(
    message: SendpayRequest,
    reader: jspb.BinaryReader,
  ): SendpayRequest;
}

export namespace SendpayRequest {
  export type AsObject = {
    routeList: Array<SendpayRoute.AsObject>;
    paymentHash: Uint8Array | string;
    label?: string;
    amountMsat?: cln_primitives_pb.Amount.AsObject;
    bolt11?: string;
    paymentSecret: Uint8Array | string;
    partid?: number;
    localinvreqid: Uint8Array | string;
    groupid?: number;
  };
}

export class SendpayResponse extends jspb.Message {
  hasCreatedIndex(): boolean;
  clearCreatedIndex(): void;
  getCreatedIndex(): number | undefined;
  setCreatedIndex(value: number): SendpayResponse;

  hasUpdatedIndex(): boolean;
  clearUpdatedIndex(): void;
  getUpdatedIndex(): number | undefined;
  setUpdatedIndex(value: number): SendpayResponse;
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

  hasCompletedAt(): boolean;
  clearCompletedAt(): void;
  getCompletedAt(): number | undefined;
  setCompletedAt(value: number): SendpayResponse;

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

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): SendpayResponse.AsObject;
  static toObject(
    includeInstance: boolean,
    msg: SendpayResponse,
  ): SendpayResponse.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: SendpayResponse,
    writer: jspb.BinaryWriter,
  ): void;
  static deserializeBinary(bytes: Uint8Array): SendpayResponse;
  static deserializeBinaryFromReader(
    message: SendpayResponse,
    reader: jspb.BinaryReader,
  ): SendpayResponse;
}

export namespace SendpayResponse {
  export type AsObject = {
    createdIndex?: number;
    updatedIndex?: number;
    id: number;
    groupid?: number;
    paymentHash: Uint8Array | string;
    status: SendpayResponse.SendpayStatus;
    amountMsat?: cln_primitives_pb.Amount.AsObject;
    destination: Uint8Array | string;
    createdAt: number;
    completedAt?: number;
    amountSentMsat?: cln_primitives_pb.Amount.AsObject;
    label?: string;
    partid?: number;
    bolt11?: string;
    bolt12?: string;
    paymentPreimage: Uint8Array | string;
    message?: string;
  };

  export enum SendpayStatus {
    PENDING = 0,
    COMPLETE = 1,
  }
}

export class SendpayRoute extends jspb.Message {
  hasAmountMsat(): boolean;
  clearAmountMsat(): void;
  getAmountMsat(): cln_primitives_pb.Amount | undefined;
  setAmountMsat(value?: cln_primitives_pb.Amount): SendpayRoute;
  getId(): Uint8Array | string;
  getId_asU8(): Uint8Array;
  getId_asB64(): string;
  setId(value: Uint8Array | string): SendpayRoute;
  getDelay(): number;
  setDelay(value: number): SendpayRoute;
  getChannel(): string;
  setChannel(value: string): SendpayRoute;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): SendpayRoute.AsObject;
  static toObject(
    includeInstance: boolean,
    msg: SendpayRoute,
  ): SendpayRoute.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: SendpayRoute,
    writer: jspb.BinaryWriter,
  ): void;
  static deserializeBinary(bytes: Uint8Array): SendpayRoute;
  static deserializeBinaryFromReader(
    message: SendpayRoute,
    reader: jspb.BinaryReader,
  ): SendpayRoute;
}

export namespace SendpayRoute {
  export type AsObject = {
    amountMsat?: cln_primitives_pb.Amount.AsObject;
    id: Uint8Array | string;
    delay: number;
    channel: string;
  };
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
  static toObject(
    includeInstance: boolean,
    msg: ListchannelsRequest,
  ): ListchannelsRequest.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: ListchannelsRequest,
    writer: jspb.BinaryWriter,
  ): void;
  static deserializeBinary(bytes: Uint8Array): ListchannelsRequest;
  static deserializeBinaryFromReader(
    message: ListchannelsRequest,
    reader: jspb.BinaryReader,
  ): ListchannelsRequest;
}

export namespace ListchannelsRequest {
  export type AsObject = {
    shortChannelId?: string;
    source: Uint8Array | string;
    destination: Uint8Array | string;
  };
}

export class ListchannelsResponse extends jspb.Message {
  clearChannelsList(): void;
  getChannelsList(): Array<ListchannelsChannels>;
  setChannelsList(value: Array<ListchannelsChannels>): ListchannelsResponse;
  addChannels(
    value?: ListchannelsChannels,
    index?: number,
  ): ListchannelsChannels;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ListchannelsResponse.AsObject;
  static toObject(
    includeInstance: boolean,
    msg: ListchannelsResponse,
  ): ListchannelsResponse.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: ListchannelsResponse,
    writer: jspb.BinaryWriter,
  ): void;
  static deserializeBinary(bytes: Uint8Array): ListchannelsResponse;
  static deserializeBinaryFromReader(
    message: ListchannelsResponse,
    reader: jspb.BinaryReader,
  ): ListchannelsResponse;
}

export namespace ListchannelsResponse {
  export type AsObject = {
    channelsList: Array<ListchannelsChannels.AsObject>;
  };
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
  getDirection(): number;
  setDirection(value: number): ListchannelsChannels;
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

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ListchannelsChannels.AsObject;
  static toObject(
    includeInstance: boolean,
    msg: ListchannelsChannels,
  ): ListchannelsChannels.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: ListchannelsChannels,
    writer: jspb.BinaryWriter,
  ): void;
  static deserializeBinary(bytes: Uint8Array): ListchannelsChannels;
  static deserializeBinaryFromReader(
    message: ListchannelsChannels,
    reader: jspb.BinaryReader,
  ): ListchannelsChannels;
}

export namespace ListchannelsChannels {
  export type AsObject = {
    source: Uint8Array | string;
    destination: Uint8Array | string;
    shortChannelId: string;
    direction: number;
    pb_public: boolean;
    amountMsat?: cln_primitives_pb.Amount.AsObject;
    messageFlags: number;
    channelFlags: number;
    active: boolean;
    lastUpdate: number;
    baseFeeMillisatoshi: number;
    feePerMillionth: number;
    delay: number;
    htlcMinimumMsat?: cln_primitives_pb.Amount.AsObject;
    htlcMaximumMsat?: cln_primitives_pb.Amount.AsObject;
    features: Uint8Array | string;
  };
}

export class AddgossipRequest extends jspb.Message {
  getMessage(): Uint8Array | string;
  getMessage_asU8(): Uint8Array;
  getMessage_asB64(): string;
  setMessage(value: Uint8Array | string): AddgossipRequest;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): AddgossipRequest.AsObject;
  static toObject(
    includeInstance: boolean,
    msg: AddgossipRequest,
  ): AddgossipRequest.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: AddgossipRequest,
    writer: jspb.BinaryWriter,
  ): void;
  static deserializeBinary(bytes: Uint8Array): AddgossipRequest;
  static deserializeBinaryFromReader(
    message: AddgossipRequest,
    reader: jspb.BinaryReader,
  ): AddgossipRequest;
}

export namespace AddgossipRequest {
  export type AsObject = {
    message: Uint8Array | string;
  };
}

export class AddgossipResponse extends jspb.Message {
  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): AddgossipResponse.AsObject;
  static toObject(
    includeInstance: boolean,
    msg: AddgossipResponse,
  ): AddgossipResponse.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: AddgossipResponse,
    writer: jspb.BinaryWriter,
  ): void;
  static deserializeBinary(bytes: Uint8Array): AddgossipResponse;
  static deserializeBinaryFromReader(
    message: AddgossipResponse,
    reader: jspb.BinaryReader,
  ): AddgossipResponse;
}

export namespace AddgossipResponse {
  export type AsObject = {};
}

export class AutocleaninvoiceRequest extends jspb.Message {
  hasExpiredBy(): boolean;
  clearExpiredBy(): void;
  getExpiredBy(): number | undefined;
  setExpiredBy(value: number): AutocleaninvoiceRequest;

  hasCycleSeconds(): boolean;
  clearCycleSeconds(): void;
  getCycleSeconds(): number | undefined;
  setCycleSeconds(value: number): AutocleaninvoiceRequest;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): AutocleaninvoiceRequest.AsObject;
  static toObject(
    includeInstance: boolean,
    msg: AutocleaninvoiceRequest,
  ): AutocleaninvoiceRequest.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: AutocleaninvoiceRequest,
    writer: jspb.BinaryWriter,
  ): void;
  static deserializeBinary(bytes: Uint8Array): AutocleaninvoiceRequest;
  static deserializeBinaryFromReader(
    message: AutocleaninvoiceRequest,
    reader: jspb.BinaryReader,
  ): AutocleaninvoiceRequest;
}

export namespace AutocleaninvoiceRequest {
  export type AsObject = {
    expiredBy?: number;
    cycleSeconds?: number;
  };
}

export class AutocleaninvoiceResponse extends jspb.Message {
  getEnabled(): boolean;
  setEnabled(value: boolean): AutocleaninvoiceResponse;

  hasExpiredBy(): boolean;
  clearExpiredBy(): void;
  getExpiredBy(): number | undefined;
  setExpiredBy(value: number): AutocleaninvoiceResponse;

  hasCycleSeconds(): boolean;
  clearCycleSeconds(): void;
  getCycleSeconds(): number | undefined;
  setCycleSeconds(value: number): AutocleaninvoiceResponse;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): AutocleaninvoiceResponse.AsObject;
  static toObject(
    includeInstance: boolean,
    msg: AutocleaninvoiceResponse,
  ): AutocleaninvoiceResponse.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: AutocleaninvoiceResponse,
    writer: jspb.BinaryWriter,
  ): void;
  static deserializeBinary(bytes: Uint8Array): AutocleaninvoiceResponse;
  static deserializeBinaryFromReader(
    message: AutocleaninvoiceResponse,
    reader: jspb.BinaryReader,
  ): AutocleaninvoiceResponse;
}

export namespace AutocleaninvoiceResponse {
  export type AsObject = {
    enabled: boolean;
    expiredBy?: number;
    cycleSeconds?: number;
  };
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
  static toObject(
    includeInstance: boolean,
    msg: CheckmessageRequest,
  ): CheckmessageRequest.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: CheckmessageRequest,
    writer: jspb.BinaryWriter,
  ): void;
  static deserializeBinary(bytes: Uint8Array): CheckmessageRequest;
  static deserializeBinaryFromReader(
    message: CheckmessageRequest,
    reader: jspb.BinaryReader,
  ): CheckmessageRequest;
}

export namespace CheckmessageRequest {
  export type AsObject = {
    message: string;
    zbase: string;
    pubkey: Uint8Array | string;
  };
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
  static toObject(
    includeInstance: boolean,
    msg: CheckmessageResponse,
  ): CheckmessageResponse.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: CheckmessageResponse,
    writer: jspb.BinaryWriter,
  ): void;
  static deserializeBinary(bytes: Uint8Array): CheckmessageResponse;
  static deserializeBinaryFromReader(
    message: CheckmessageResponse,
    reader: jspb.BinaryReader,
  ): CheckmessageResponse;
}

export namespace CheckmessageResponse {
  export type AsObject = {
    verified: boolean;
    pubkey: Uint8Array | string;
  };
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
  addFeerange(
    value?: cln_primitives_pb.Feerate,
    index?: number,
  ): cln_primitives_pb.Feerate;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): CloseRequest.AsObject;
  static toObject(
    includeInstance: boolean,
    msg: CloseRequest,
  ): CloseRequest.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: CloseRequest,
    writer: jspb.BinaryWriter,
  ): void;
  static deserializeBinary(bytes: Uint8Array): CloseRequest;
  static deserializeBinaryFromReader(
    message: CloseRequest,
    reader: jspb.BinaryReader,
  ): CloseRequest;
}

export namespace CloseRequest {
  export type AsObject = {
    id: string;
    unilateraltimeout?: number;
    destination?: string;
    feeNegotiationStep?: string;
    wrongFunding?: cln_primitives_pb.Outpoint.AsObject;
    forceLeaseClosed?: boolean;
    feerangeList: Array<cln_primitives_pb.Feerate.AsObject>;
  };
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

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): CloseResponse.AsObject;
  static toObject(
    includeInstance: boolean,
    msg: CloseResponse,
  ): CloseResponse.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: CloseResponse,
    writer: jspb.BinaryWriter,
  ): void;
  static deserializeBinary(bytes: Uint8Array): CloseResponse;
  static deserializeBinaryFromReader(
    message: CloseResponse,
    reader: jspb.BinaryReader,
  ): CloseResponse;
}

export namespace CloseResponse {
  export type AsObject = {
    itemType: CloseResponse.CloseType;
    tx: Uint8Array | string;
    txid: Uint8Array | string;
  };

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
  static toObject(
    includeInstance: boolean,
    msg: ConnectRequest,
  ): ConnectRequest.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: ConnectRequest,
    writer: jspb.BinaryWriter,
  ): void;
  static deserializeBinary(bytes: Uint8Array): ConnectRequest;
  static deserializeBinaryFromReader(
    message: ConnectRequest,
    reader: jspb.BinaryReader,
  ): ConnectRequest;
}

export namespace ConnectRequest {
  export type AsObject = {
    id: string;
    host?: string;
    port?: number;
  };
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
  static toObject(
    includeInstance: boolean,
    msg: ConnectResponse,
  ): ConnectResponse.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: ConnectResponse,
    writer: jspb.BinaryWriter,
  ): void;
  static deserializeBinary(bytes: Uint8Array): ConnectResponse;
  static deserializeBinaryFromReader(
    message: ConnectResponse,
    reader: jspb.BinaryReader,
  ): ConnectResponse;
}

export namespace ConnectResponse {
  export type AsObject = {
    id: Uint8Array | string;
    features: Uint8Array | string;
    direction: ConnectResponse.ConnectDirection;
    address?: ConnectAddress.AsObject;
  };

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
  static toObject(
    includeInstance: boolean,
    msg: ConnectAddress,
  ): ConnectAddress.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: ConnectAddress,
    writer: jspb.BinaryWriter,
  ): void;
  static deserializeBinary(bytes: Uint8Array): ConnectAddress;
  static deserializeBinaryFromReader(
    message: ConnectAddress,
    reader: jspb.BinaryReader,
  ): ConnectAddress;
}

export namespace ConnectAddress {
  export type AsObject = {
    itemType: ConnectAddress.ConnectAddressType;
    socket?: string;
    address?: string;
    port?: number;
  };

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
  static toObject(
    includeInstance: boolean,
    msg: CreateinvoiceRequest,
  ): CreateinvoiceRequest.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: CreateinvoiceRequest,
    writer: jspb.BinaryWriter,
  ): void;
  static deserializeBinary(bytes: Uint8Array): CreateinvoiceRequest;
  static deserializeBinaryFromReader(
    message: CreateinvoiceRequest,
    reader: jspb.BinaryReader,
  ): CreateinvoiceRequest;
}

export namespace CreateinvoiceRequest {
  export type AsObject = {
    invstring: string;
    label: string;
    preimage: Uint8Array | string;
  };
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
  setStatus(
    value: CreateinvoiceResponse.CreateinvoiceStatus,
  ): CreateinvoiceResponse;
  getDescription(): string;
  setDescription(value: string): CreateinvoiceResponse;
  getExpiresAt(): number;
  setExpiresAt(value: number): CreateinvoiceResponse;

  hasCreatedIndex(): boolean;
  clearCreatedIndex(): void;
  getCreatedIndex(): number | undefined;
  setCreatedIndex(value: number): CreateinvoiceResponse;

  hasPayIndex(): boolean;
  clearPayIndex(): void;
  getPayIndex(): number | undefined;
  setPayIndex(value: number): CreateinvoiceResponse;

  hasAmountReceivedMsat(): boolean;
  clearAmountReceivedMsat(): void;
  getAmountReceivedMsat(): cln_primitives_pb.Amount | undefined;
  setAmountReceivedMsat(
    value?: cln_primitives_pb.Amount,
  ): CreateinvoiceResponse;

  hasPaidAt(): boolean;
  clearPaidAt(): void;
  getPaidAt(): number | undefined;
  setPaidAt(value: number): CreateinvoiceResponse;

  hasPaidOutpoint(): boolean;
  clearPaidOutpoint(): void;
  getPaidOutpoint(): CreateinvoicePaid_outpoint | undefined;
  setPaidOutpoint(value?: CreateinvoicePaid_outpoint): CreateinvoiceResponse;

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

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): CreateinvoiceResponse.AsObject;
  static toObject(
    includeInstance: boolean,
    msg: CreateinvoiceResponse,
  ): CreateinvoiceResponse.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: CreateinvoiceResponse,
    writer: jspb.BinaryWriter,
  ): void;
  static deserializeBinary(bytes: Uint8Array): CreateinvoiceResponse;
  static deserializeBinaryFromReader(
    message: CreateinvoiceResponse,
    reader: jspb.BinaryReader,
  ): CreateinvoiceResponse;
}

export namespace CreateinvoiceResponse {
  export type AsObject = {
    label: string;
    bolt11?: string;
    bolt12?: string;
    paymentHash: Uint8Array | string;
    amountMsat?: cln_primitives_pb.Amount.AsObject;
    status: CreateinvoiceResponse.CreateinvoiceStatus;
    description: string;
    expiresAt: number;
    createdIndex?: number;
    payIndex?: number;
    amountReceivedMsat?: cln_primitives_pb.Amount.AsObject;
    paidAt?: number;
    paidOutpoint?: CreateinvoicePaid_outpoint.AsObject;
    paymentPreimage: Uint8Array | string;
    localOfferId: Uint8Array | string;
    invreqPayerNote?: string;
  };

  export enum CreateinvoiceStatus {
    PAID = 0,
    EXPIRED = 1,
    UNPAID = 2,
  }
}

export class CreateinvoicePaid_outpoint extends jspb.Message {
  hasTxid(): boolean;
  clearTxid(): void;
  getTxid(): Uint8Array | string;
  getTxid_asU8(): Uint8Array;
  getTxid_asB64(): string;
  setTxid(value: Uint8Array | string): CreateinvoicePaid_outpoint;

  hasOutnum(): boolean;
  clearOutnum(): void;
  getOutnum(): number | undefined;
  setOutnum(value: number): CreateinvoicePaid_outpoint;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): CreateinvoicePaid_outpoint.AsObject;
  static toObject(
    includeInstance: boolean,
    msg: CreateinvoicePaid_outpoint,
  ): CreateinvoicePaid_outpoint.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: CreateinvoicePaid_outpoint,
    writer: jspb.BinaryWriter,
  ): void;
  static deserializeBinary(bytes: Uint8Array): CreateinvoicePaid_outpoint;
  static deserializeBinaryFromReader(
    message: CreateinvoicePaid_outpoint,
    reader: jspb.BinaryReader,
  ): CreateinvoicePaid_outpoint;
}

export namespace CreateinvoicePaid_outpoint {
  export type AsObject = {
    txid: Uint8Array | string;
    outnum?: number;
  };
}

export class DatastoreRequest extends jspb.Message {
  clearKeyList(): void;
  getKeyList(): Array<string>;
  setKeyList(value: Array<string>): DatastoreRequest;
  addKey(value: string, index?: number): string;

  hasString(): boolean;
  clearString(): void;
  getString(): string | undefined;
  setString(value: string): DatastoreRequest;

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

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): DatastoreRequest.AsObject;
  static toObject(
    includeInstance: boolean,
    msg: DatastoreRequest,
  ): DatastoreRequest.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: DatastoreRequest,
    writer: jspb.BinaryWriter,
  ): void;
  static deserializeBinary(bytes: Uint8Array): DatastoreRequest;
  static deserializeBinaryFromReader(
    message: DatastoreRequest,
    reader: jspb.BinaryReader,
  ): DatastoreRequest;
}

export namespace DatastoreRequest {
  export type AsObject = {
    keyList: Array<string>;
    string?: string;
    hex: Uint8Array | string;
    mode?: DatastoreRequest.DatastoreMode;
    generation?: number;
  };

  export enum DatastoreMode {
    MUST_CREATE = 0,
    MUST_REPLACE = 1,
    CREATE_OR_REPLACE = 2,
    MUST_APPEND = 3,
    CREATE_OR_APPEND = 4,
  }
}

export class DatastoreResponse extends jspb.Message {
  clearKeyList(): void;
  getKeyList(): Array<string>;
  setKeyList(value: Array<string>): DatastoreResponse;
  addKey(value: string, index?: number): string;

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

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): DatastoreResponse.AsObject;
  static toObject(
    includeInstance: boolean,
    msg: DatastoreResponse,
  ): DatastoreResponse.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: DatastoreResponse,
    writer: jspb.BinaryWriter,
  ): void;
  static deserializeBinary(bytes: Uint8Array): DatastoreResponse;
  static deserializeBinaryFromReader(
    message: DatastoreResponse,
    reader: jspb.BinaryReader,
  ): DatastoreResponse;
}

export namespace DatastoreResponse {
  export type AsObject = {
    keyList: Array<string>;
    generation?: number;
    hex: Uint8Array | string;
    string?: string;
  };
}

export class DatastoreusageRequest extends jspb.Message {
  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): DatastoreusageRequest.AsObject;
  static toObject(
    includeInstance: boolean,
    msg: DatastoreusageRequest,
  ): DatastoreusageRequest.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: DatastoreusageRequest,
    writer: jspb.BinaryWriter,
  ): void;
  static deserializeBinary(bytes: Uint8Array): DatastoreusageRequest;
  static deserializeBinaryFromReader(
    message: DatastoreusageRequest,
    reader: jspb.BinaryReader,
  ): DatastoreusageRequest;
}

export namespace DatastoreusageRequest {
  export type AsObject = {};
}

export class DatastoreusageResponse extends jspb.Message {
  hasDatastoreusage(): boolean;
  clearDatastoreusage(): void;
  getDatastoreusage(): DatastoreusageDatastoreusage | undefined;
  setDatastoreusage(
    value?: DatastoreusageDatastoreusage,
  ): DatastoreusageResponse;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): DatastoreusageResponse.AsObject;
  static toObject(
    includeInstance: boolean,
    msg: DatastoreusageResponse,
  ): DatastoreusageResponse.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: DatastoreusageResponse,
    writer: jspb.BinaryWriter,
  ): void;
  static deserializeBinary(bytes: Uint8Array): DatastoreusageResponse;
  static deserializeBinaryFromReader(
    message: DatastoreusageResponse,
    reader: jspb.BinaryReader,
  ): DatastoreusageResponse;
}

export namespace DatastoreusageResponse {
  export type AsObject = {
    datastoreusage?: DatastoreusageDatastoreusage.AsObject;
  };
}

export class DatastoreusageDatastoreusage extends jspb.Message {
  hasKey(): boolean;
  clearKey(): void;
  getKey(): string | undefined;
  setKey(value: string): DatastoreusageDatastoreusage;

  hasTotalBytes(): boolean;
  clearTotalBytes(): void;
  getTotalBytes(): number | undefined;
  setTotalBytes(value: number): DatastoreusageDatastoreusage;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): DatastoreusageDatastoreusage.AsObject;
  static toObject(
    includeInstance: boolean,
    msg: DatastoreusageDatastoreusage,
  ): DatastoreusageDatastoreusage.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: DatastoreusageDatastoreusage,
    writer: jspb.BinaryWriter,
  ): void;
  static deserializeBinary(bytes: Uint8Array): DatastoreusageDatastoreusage;
  static deserializeBinaryFromReader(
    message: DatastoreusageDatastoreusage,
    reader: jspb.BinaryReader,
  ): DatastoreusageDatastoreusage;
}

export namespace DatastoreusageDatastoreusage {
  export type AsObject = {
    key?: string;
    totalBytes?: number;
  };
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
  static toObject(
    includeInstance: boolean,
    msg: CreateonionRequest,
  ): CreateonionRequest.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: CreateonionRequest,
    writer: jspb.BinaryWriter,
  ): void;
  static deserializeBinary(bytes: Uint8Array): CreateonionRequest;
  static deserializeBinaryFromReader(
    message: CreateonionRequest,
    reader: jspb.BinaryReader,
  ): CreateonionRequest;
}

export namespace CreateonionRequest {
  export type AsObject = {
    hopsList: Array<CreateonionHops.AsObject>;
    assocdata: Uint8Array | string;
    sessionKey: Uint8Array | string;
    onionSize?: number;
  };
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
  addSharedSecrets(
    value: Uint8Array | string,
    index?: number,
  ): Uint8Array | string;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): CreateonionResponse.AsObject;
  static toObject(
    includeInstance: boolean,
    msg: CreateonionResponse,
  ): CreateonionResponse.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: CreateonionResponse,
    writer: jspb.BinaryWriter,
  ): void;
  static deserializeBinary(bytes: Uint8Array): CreateonionResponse;
  static deserializeBinaryFromReader(
    message: CreateonionResponse,
    reader: jspb.BinaryReader,
  ): CreateonionResponse;
}

export namespace CreateonionResponse {
  export type AsObject = {
    onion: Uint8Array | string;
    sharedSecretsList: Array<Uint8Array | string>;
  };
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
  static toObject(
    includeInstance: boolean,
    msg: CreateonionHops,
  ): CreateonionHops.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: CreateonionHops,
    writer: jspb.BinaryWriter,
  ): void;
  static deserializeBinary(bytes: Uint8Array): CreateonionHops;
  static deserializeBinaryFromReader(
    message: CreateonionHops,
    reader: jspb.BinaryReader,
  ): CreateonionHops;
}

export namespace CreateonionHops {
  export type AsObject = {
    pubkey: Uint8Array | string;
    payload: Uint8Array | string;
  };
}

export class DeldatastoreRequest extends jspb.Message {
  clearKeyList(): void;
  getKeyList(): Array<string>;
  setKeyList(value: Array<string>): DeldatastoreRequest;
  addKey(value: string, index?: number): string;

  hasGeneration(): boolean;
  clearGeneration(): void;
  getGeneration(): number | undefined;
  setGeneration(value: number): DeldatastoreRequest;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): DeldatastoreRequest.AsObject;
  static toObject(
    includeInstance: boolean,
    msg: DeldatastoreRequest,
  ): DeldatastoreRequest.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: DeldatastoreRequest,
    writer: jspb.BinaryWriter,
  ): void;
  static deserializeBinary(bytes: Uint8Array): DeldatastoreRequest;
  static deserializeBinaryFromReader(
    message: DeldatastoreRequest,
    reader: jspb.BinaryReader,
  ): DeldatastoreRequest;
}

export namespace DeldatastoreRequest {
  export type AsObject = {
    keyList: Array<string>;
    generation?: number;
  };
}

export class DeldatastoreResponse extends jspb.Message {
  clearKeyList(): void;
  getKeyList(): Array<string>;
  setKeyList(value: Array<string>): DeldatastoreResponse;
  addKey(value: string, index?: number): string;

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

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): DeldatastoreResponse.AsObject;
  static toObject(
    includeInstance: boolean,
    msg: DeldatastoreResponse,
  ): DeldatastoreResponse.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: DeldatastoreResponse,
    writer: jspb.BinaryWriter,
  ): void;
  static deserializeBinary(bytes: Uint8Array): DeldatastoreResponse;
  static deserializeBinaryFromReader(
    message: DeldatastoreResponse,
    reader: jspb.BinaryReader,
  ): DeldatastoreResponse;
}

export namespace DeldatastoreResponse {
  export type AsObject = {
    keyList: Array<string>;
    generation?: number;
    hex: Uint8Array | string;
    string?: string;
  };
}

export class DelexpiredinvoiceRequest extends jspb.Message {
  hasMaxexpirytime(): boolean;
  clearMaxexpirytime(): void;
  getMaxexpirytime(): number | undefined;
  setMaxexpirytime(value: number): DelexpiredinvoiceRequest;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): DelexpiredinvoiceRequest.AsObject;
  static toObject(
    includeInstance: boolean,
    msg: DelexpiredinvoiceRequest,
  ): DelexpiredinvoiceRequest.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: DelexpiredinvoiceRequest,
    writer: jspb.BinaryWriter,
  ): void;
  static deserializeBinary(bytes: Uint8Array): DelexpiredinvoiceRequest;
  static deserializeBinaryFromReader(
    message: DelexpiredinvoiceRequest,
    reader: jspb.BinaryReader,
  ): DelexpiredinvoiceRequest;
}

export namespace DelexpiredinvoiceRequest {
  export type AsObject = {
    maxexpirytime?: number;
  };
}

export class DelexpiredinvoiceResponse extends jspb.Message {
  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): DelexpiredinvoiceResponse.AsObject;
  static toObject(
    includeInstance: boolean,
    msg: DelexpiredinvoiceResponse,
  ): DelexpiredinvoiceResponse.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: DelexpiredinvoiceResponse,
    writer: jspb.BinaryWriter,
  ): void;
  static deserializeBinary(bytes: Uint8Array): DelexpiredinvoiceResponse;
  static deserializeBinaryFromReader(
    message: DelexpiredinvoiceResponse,
    reader: jspb.BinaryReader,
  ): DelexpiredinvoiceResponse;
}

export namespace DelexpiredinvoiceResponse {
  export type AsObject = {};
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
  static toObject(
    includeInstance: boolean,
    msg: DelinvoiceRequest,
  ): DelinvoiceRequest.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: DelinvoiceRequest,
    writer: jspb.BinaryWriter,
  ): void;
  static deserializeBinary(bytes: Uint8Array): DelinvoiceRequest;
  static deserializeBinaryFromReader(
    message: DelinvoiceRequest,
    reader: jspb.BinaryReader,
  ): DelinvoiceRequest;
}

export namespace DelinvoiceRequest {
  export type AsObject = {
    label: string;
    status: DelinvoiceRequest.DelinvoiceStatus;
    desconly?: boolean;
  };

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

  hasCreatedIndex(): boolean;
  clearCreatedIndex(): void;
  getCreatedIndex(): number | undefined;
  setCreatedIndex(value: number): DelinvoiceResponse;

  hasUpdatedIndex(): boolean;
  clearUpdatedIndex(): void;
  getUpdatedIndex(): number | undefined;
  setUpdatedIndex(value: number): DelinvoiceResponse;
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

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): DelinvoiceResponse.AsObject;
  static toObject(
    includeInstance: boolean,
    msg: DelinvoiceResponse,
  ): DelinvoiceResponse.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: DelinvoiceResponse,
    writer: jspb.BinaryWriter,
  ): void;
  static deserializeBinary(bytes: Uint8Array): DelinvoiceResponse;
  static deserializeBinaryFromReader(
    message: DelinvoiceResponse,
    reader: jspb.BinaryReader,
  ): DelinvoiceResponse;
}

export namespace DelinvoiceResponse {
  export type AsObject = {
    label: string;
    bolt11?: string;
    bolt12?: string;
    amountMsat?: cln_primitives_pb.Amount.AsObject;
    description?: string;
    paymentHash: Uint8Array | string;
    createdIndex?: number;
    updatedIndex?: number;
    status: DelinvoiceResponse.DelinvoiceStatus;
    expiresAt: number;
    localOfferId: Uint8Array | string;
    invreqPayerNote?: string;
  };

  export enum DelinvoiceStatus {
    PAID = 0,
    EXPIRED = 1,
    UNPAID = 2,
  }
}

export class InvoiceRequest extends jspb.Message {
  hasAmountMsat(): boolean;
  clearAmountMsat(): void;
  getAmountMsat(): cln_primitives_pb.AmountOrAny | undefined;
  setAmountMsat(value?: cln_primitives_pb.AmountOrAny): InvoiceRequest;
  getDescription(): string;
  setDescription(value: string): InvoiceRequest;
  getLabel(): string;
  setLabel(value: string): InvoiceRequest;

  hasExpiry(): boolean;
  clearExpiry(): void;
  getExpiry(): number | undefined;
  setExpiry(value: number): InvoiceRequest;
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

  hasDeschashonly(): boolean;
  clearDeschashonly(): void;
  getDeschashonly(): boolean | undefined;
  setDeschashonly(value: boolean): InvoiceRequest;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): InvoiceRequest.AsObject;
  static toObject(
    includeInstance: boolean,
    msg: InvoiceRequest,
  ): InvoiceRequest.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: InvoiceRequest,
    writer: jspb.BinaryWriter,
  ): void;
  static deserializeBinary(bytes: Uint8Array): InvoiceRequest;
  static deserializeBinaryFromReader(
    message: InvoiceRequest,
    reader: jspb.BinaryReader,
  ): InvoiceRequest;
}

export namespace InvoiceRequest {
  export type AsObject = {
    amountMsat?: cln_primitives_pb.AmountOrAny.AsObject;
    description: string;
    label: string;
    expiry?: number;
    fallbacksList: Array<string>;
    preimage: Uint8Array | string;
    cltv?: number;
    deschashonly?: boolean;
  };
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

  hasCreatedIndex(): boolean;
  clearCreatedIndex(): void;
  getCreatedIndex(): number | undefined;
  setCreatedIndex(value: number): InvoiceResponse;

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

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): InvoiceResponse.AsObject;
  static toObject(
    includeInstance: boolean,
    msg: InvoiceResponse,
  ): InvoiceResponse.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: InvoiceResponse,
    writer: jspb.BinaryWriter,
  ): void;
  static deserializeBinary(bytes: Uint8Array): InvoiceResponse;
  static deserializeBinaryFromReader(
    message: InvoiceResponse,
    reader: jspb.BinaryReader,
  ): InvoiceResponse;
}

export namespace InvoiceResponse {
  export type AsObject = {
    bolt11: string;
    paymentHash: Uint8Array | string;
    paymentSecret: Uint8Array | string;
    expiresAt: number;
    createdIndex?: number;
    warningCapacity?: string;
    warningOffline?: string;
    warningDeadends?: string;
    warningPrivateUnused?: string;
    warningMpp?: string;
  };
}

export class ListdatastoreRequest extends jspb.Message {
  clearKeyList(): void;
  getKeyList(): Array<string>;
  setKeyList(value: Array<string>): ListdatastoreRequest;
  addKey(value: string, index?: number): string;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ListdatastoreRequest.AsObject;
  static toObject(
    includeInstance: boolean,
    msg: ListdatastoreRequest,
  ): ListdatastoreRequest.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: ListdatastoreRequest,
    writer: jspb.BinaryWriter,
  ): void;
  static deserializeBinary(bytes: Uint8Array): ListdatastoreRequest;
  static deserializeBinaryFromReader(
    message: ListdatastoreRequest,
    reader: jspb.BinaryReader,
  ): ListdatastoreRequest;
}

export namespace ListdatastoreRequest {
  export type AsObject = {
    keyList: Array<string>;
  };
}

export class ListdatastoreResponse extends jspb.Message {
  clearDatastoreList(): void;
  getDatastoreList(): Array<ListdatastoreDatastore>;
  setDatastoreList(value: Array<ListdatastoreDatastore>): ListdatastoreResponse;
  addDatastore(
    value?: ListdatastoreDatastore,
    index?: number,
  ): ListdatastoreDatastore;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ListdatastoreResponse.AsObject;
  static toObject(
    includeInstance: boolean,
    msg: ListdatastoreResponse,
  ): ListdatastoreResponse.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: ListdatastoreResponse,
    writer: jspb.BinaryWriter,
  ): void;
  static deserializeBinary(bytes: Uint8Array): ListdatastoreResponse;
  static deserializeBinaryFromReader(
    message: ListdatastoreResponse,
    reader: jspb.BinaryReader,
  ): ListdatastoreResponse;
}

export namespace ListdatastoreResponse {
  export type AsObject = {
    datastoreList: Array<ListdatastoreDatastore.AsObject>;
  };
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
  static toObject(
    includeInstance: boolean,
    msg: ListdatastoreDatastore,
  ): ListdatastoreDatastore.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: ListdatastoreDatastore,
    writer: jspb.BinaryWriter,
  ): void;
  static deserializeBinary(bytes: Uint8Array): ListdatastoreDatastore;
  static deserializeBinaryFromReader(
    message: ListdatastoreDatastore,
    reader: jspb.BinaryReader,
  ): ListdatastoreDatastore;
}

export namespace ListdatastoreDatastore {
  export type AsObject = {
    keyList: Array<string>;
    generation?: number;
    hex: Uint8Array | string;
    string?: string;
  };
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
  static toObject(
    includeInstance: boolean,
    msg: ListinvoicesRequest,
  ): ListinvoicesRequest.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: ListinvoicesRequest,
    writer: jspb.BinaryWriter,
  ): void;
  static deserializeBinary(bytes: Uint8Array): ListinvoicesRequest;
  static deserializeBinaryFromReader(
    message: ListinvoicesRequest,
    reader: jspb.BinaryReader,
  ): ListinvoicesRequest;
}

export namespace ListinvoicesRequest {
  export type AsObject = {
    label?: string;
    invstring?: string;
    paymentHash: Uint8Array | string;
    offerId?: string;
    index?: ListinvoicesRequest.ListinvoicesIndex;
    start?: number;
    limit?: number;
  };

  export enum ListinvoicesIndex {
    CREATED = 0,
    UPDATED = 1,
  }
}

export class ListinvoicesResponse extends jspb.Message {
  clearInvoicesList(): void;
  getInvoicesList(): Array<ListinvoicesInvoices>;
  setInvoicesList(value: Array<ListinvoicesInvoices>): ListinvoicesResponse;
  addInvoices(
    value?: ListinvoicesInvoices,
    index?: number,
  ): ListinvoicesInvoices;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ListinvoicesResponse.AsObject;
  static toObject(
    includeInstance: boolean,
    msg: ListinvoicesResponse,
  ): ListinvoicesResponse.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: ListinvoicesResponse,
    writer: jspb.BinaryWriter,
  ): void;
  static deserializeBinary(bytes: Uint8Array): ListinvoicesResponse;
  static deserializeBinaryFromReader(
    message: ListinvoicesResponse,
    reader: jspb.BinaryReader,
  ): ListinvoicesResponse;
}

export namespace ListinvoicesResponse {
  export type AsObject = {
    invoicesList: Array<ListinvoicesInvoices.AsObject>;
  };
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
  setStatus(
    value: ListinvoicesInvoices.ListinvoicesInvoicesStatus,
  ): ListinvoicesInvoices;
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

  hasPaidOutpoint(): boolean;
  clearPaidOutpoint(): void;
  getPaidOutpoint(): ListinvoicesInvoicesPaid_outpoint | undefined;
  setPaidOutpoint(
    value?: ListinvoicesInvoicesPaid_outpoint,
  ): ListinvoicesInvoices;

  hasPaymentPreimage(): boolean;
  clearPaymentPreimage(): void;
  getPaymentPreimage(): Uint8Array | string;
  getPaymentPreimage_asU8(): Uint8Array;
  getPaymentPreimage_asB64(): string;
  setPaymentPreimage(value: Uint8Array | string): ListinvoicesInvoices;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ListinvoicesInvoices.AsObject;
  static toObject(
    includeInstance: boolean,
    msg: ListinvoicesInvoices,
  ): ListinvoicesInvoices.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: ListinvoicesInvoices,
    writer: jspb.BinaryWriter,
  ): void;
  static deserializeBinary(bytes: Uint8Array): ListinvoicesInvoices;
  static deserializeBinaryFromReader(
    message: ListinvoicesInvoices,
    reader: jspb.BinaryReader,
  ): ListinvoicesInvoices;
}

export namespace ListinvoicesInvoices {
  export type AsObject = {
    label: string;
    description?: string;
    paymentHash: Uint8Array | string;
    status: ListinvoicesInvoices.ListinvoicesInvoicesStatus;
    expiresAt: number;
    amountMsat?: cln_primitives_pb.Amount.AsObject;
    bolt11?: string;
    bolt12?: string;
    localOfferId: Uint8Array | string;
    invreqPayerNote?: string;
    createdIndex?: number;
    updatedIndex?: number;
    payIndex?: number;
    amountReceivedMsat?: cln_primitives_pb.Amount.AsObject;
    paidAt?: number;
    paidOutpoint?: ListinvoicesInvoicesPaid_outpoint.AsObject;
    paymentPreimage: Uint8Array | string;
  };

  export enum ListinvoicesInvoicesStatus {
    UNPAID = 0,
    PAID = 1,
    EXPIRED = 2,
  }
}

export class ListinvoicesInvoicesPaid_outpoint extends jspb.Message {
  hasTxid(): boolean;
  clearTxid(): void;
  getTxid(): Uint8Array | string;
  getTxid_asU8(): Uint8Array;
  getTxid_asB64(): string;
  setTxid(value: Uint8Array | string): ListinvoicesInvoicesPaid_outpoint;

  hasOutnum(): boolean;
  clearOutnum(): void;
  getOutnum(): number | undefined;
  setOutnum(value: number): ListinvoicesInvoicesPaid_outpoint;

  serializeBinary(): Uint8Array;
  toObject(
    includeInstance?: boolean,
  ): ListinvoicesInvoicesPaid_outpoint.AsObject;
  static toObject(
    includeInstance: boolean,
    msg: ListinvoicesInvoicesPaid_outpoint,
  ): ListinvoicesInvoicesPaid_outpoint.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: ListinvoicesInvoicesPaid_outpoint,
    writer: jspb.BinaryWriter,
  ): void;
  static deserializeBinary(
    bytes: Uint8Array,
  ): ListinvoicesInvoicesPaid_outpoint;
  static deserializeBinaryFromReader(
    message: ListinvoicesInvoicesPaid_outpoint,
    reader: jspb.BinaryReader,
  ): ListinvoicesInvoicesPaid_outpoint;
}

export namespace ListinvoicesInvoicesPaid_outpoint {
  export type AsObject = {
    txid: Uint8Array | string;
    outnum?: number;
  };
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
  addSharedSecrets(
    value: Uint8Array | string,
    index?: number,
  ): Uint8Array | string;

  hasPartid(): boolean;
  clearPartid(): void;
  getPartid(): number | undefined;
  setPartid(value: number): SendonionRequest;

  hasBolt11(): boolean;
  clearBolt11(): void;
  getBolt11(): string | undefined;
  setBolt11(value: string): SendonionRequest;

  hasAmountMsat(): boolean;
  clearAmountMsat(): void;
  getAmountMsat(): cln_primitives_pb.Amount | undefined;
  setAmountMsat(value?: cln_primitives_pb.Amount): SendonionRequest;

  hasDestination(): boolean;
  clearDestination(): void;
  getDestination(): Uint8Array | string;
  getDestination_asU8(): Uint8Array;
  getDestination_asB64(): string;
  setDestination(value: Uint8Array | string): SendonionRequest;

  hasLocalinvreqid(): boolean;
  clearLocalinvreqid(): void;
  getLocalinvreqid(): Uint8Array | string;
  getLocalinvreqid_asU8(): Uint8Array;
  getLocalinvreqid_asB64(): string;
  setLocalinvreqid(value: Uint8Array | string): SendonionRequest;

  hasGroupid(): boolean;
  clearGroupid(): void;
  getGroupid(): number | undefined;
  setGroupid(value: number): SendonionRequest;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): SendonionRequest.AsObject;
  static toObject(
    includeInstance: boolean,
    msg: SendonionRequest,
  ): SendonionRequest.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: SendonionRequest,
    writer: jspb.BinaryWriter,
  ): void;
  static deserializeBinary(bytes: Uint8Array): SendonionRequest;
  static deserializeBinaryFromReader(
    message: SendonionRequest,
    reader: jspb.BinaryReader,
  ): SendonionRequest;
}

export namespace SendonionRequest {
  export type AsObject = {
    onion: Uint8Array | string;
    firstHop?: SendonionFirst_hop.AsObject;
    paymentHash: Uint8Array | string;
    label?: string;
    sharedSecretsList: Array<Uint8Array | string>;
    partid?: number;
    bolt11?: string;
    amountMsat?: cln_primitives_pb.Amount.AsObject;
    destination: Uint8Array | string;
    localinvreqid: Uint8Array | string;
    groupid?: number;
  };
}

export class SendonionResponse extends jspb.Message {
  hasCreatedIndex(): boolean;
  clearCreatedIndex(): void;
  getCreatedIndex(): number | undefined;
  setCreatedIndex(value: number): SendonionResponse;
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

  hasPartid(): boolean;
  clearPartid(): void;
  getPartid(): number | undefined;
  setPartid(value: number): SendonionResponse;

  hasUpdatedIndex(): boolean;
  clearUpdatedIndex(): void;
  getUpdatedIndex(): number | undefined;
  setUpdatedIndex(value: number): SendonionResponse;

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

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): SendonionResponse.AsObject;
  static toObject(
    includeInstance: boolean,
    msg: SendonionResponse,
  ): SendonionResponse.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: SendonionResponse,
    writer: jspb.BinaryWriter,
  ): void;
  static deserializeBinary(bytes: Uint8Array): SendonionResponse;
  static deserializeBinaryFromReader(
    message: SendonionResponse,
    reader: jspb.BinaryReader,
  ): SendonionResponse;
}

export namespace SendonionResponse {
  export type AsObject = {
    createdIndex?: number;
    id: number;
    paymentHash: Uint8Array | string;
    status: SendonionResponse.SendonionStatus;
    amountMsat?: cln_primitives_pb.Amount.AsObject;
    destination: Uint8Array | string;
    createdAt: number;
    amountSentMsat?: cln_primitives_pb.Amount.AsObject;
    label?: string;
    bolt11?: string;
    bolt12?: string;
    partid?: number;
    updatedIndex?: number;
    paymentPreimage: Uint8Array | string;
    message?: string;
  };

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
  static toObject(
    includeInstance: boolean,
    msg: SendonionFirst_hop,
  ): SendonionFirst_hop.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: SendonionFirst_hop,
    writer: jspb.BinaryWriter,
  ): void;
  static deserializeBinary(bytes: Uint8Array): SendonionFirst_hop;
  static deserializeBinaryFromReader(
    message: SendonionFirst_hop,
    reader: jspb.BinaryReader,
  ): SendonionFirst_hop;
}

export namespace SendonionFirst_hop {
  export type AsObject = {
    id: Uint8Array | string;
    amountMsat?: cln_primitives_pb.Amount.AsObject;
    delay: number;
  };
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
  static toObject(
    includeInstance: boolean,
    msg: ListsendpaysRequest,
  ): ListsendpaysRequest.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: ListsendpaysRequest,
    writer: jspb.BinaryWriter,
  ): void;
  static deserializeBinary(bytes: Uint8Array): ListsendpaysRequest;
  static deserializeBinaryFromReader(
    message: ListsendpaysRequest,
    reader: jspb.BinaryReader,
  ): ListsendpaysRequest;
}

export namespace ListsendpaysRequest {
  export type AsObject = {
    bolt11?: string;
    paymentHash: Uint8Array | string;
    status?: ListsendpaysRequest.ListsendpaysStatus;
    index?: ListsendpaysRequest.ListsendpaysIndex;
    start?: number;
    limit?: number;
  };

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
  addPayments(
    value?: ListsendpaysPayments,
    index?: number,
  ): ListsendpaysPayments;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ListsendpaysResponse.AsObject;
  static toObject(
    includeInstance: boolean,
    msg: ListsendpaysResponse,
  ): ListsendpaysResponse.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: ListsendpaysResponse,
    writer: jspb.BinaryWriter,
  ): void;
  static deserializeBinary(bytes: Uint8Array): ListsendpaysResponse;
  static deserializeBinaryFromReader(
    message: ListsendpaysResponse,
    reader: jspb.BinaryReader,
  ): ListsendpaysResponse;
}

export namespace ListsendpaysResponse {
  export type AsObject = {
    paymentsList: Array<ListsendpaysPayments.AsObject>;
  };
}

export class ListsendpaysPayments extends jspb.Message {
  hasCreatedIndex(): boolean;
  clearCreatedIndex(): void;
  getCreatedIndex(): number | undefined;
  setCreatedIndex(value: number): ListsendpaysPayments;
  getId(): number;
  setId(value: number): ListsendpaysPayments;
  getGroupid(): number;
  setGroupid(value: number): ListsendpaysPayments;

  hasPartid(): boolean;
  clearPartid(): void;
  getPartid(): number | undefined;
  setPartid(value: number): ListsendpaysPayments;
  getPaymentHash(): Uint8Array | string;
  getPaymentHash_asU8(): Uint8Array;
  getPaymentHash_asB64(): string;
  setPaymentHash(value: Uint8Array | string): ListsendpaysPayments;

  hasUpdatedIndex(): boolean;
  clearUpdatedIndex(): void;
  getUpdatedIndex(): number | undefined;
  setUpdatedIndex(value: number): ListsendpaysPayments;
  getStatus(): ListsendpaysPayments.ListsendpaysPaymentsStatus;
  setStatus(
    value: ListsendpaysPayments.ListsendpaysPaymentsStatus,
  ): ListsendpaysPayments;

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

  hasDescription(): boolean;
  clearDescription(): void;
  getDescription(): string | undefined;
  setDescription(value: string): ListsendpaysPayments;

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

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ListsendpaysPayments.AsObject;
  static toObject(
    includeInstance: boolean,
    msg: ListsendpaysPayments,
  ): ListsendpaysPayments.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: ListsendpaysPayments,
    writer: jspb.BinaryWriter,
  ): void;
  static deserializeBinary(bytes: Uint8Array): ListsendpaysPayments;
  static deserializeBinaryFromReader(
    message: ListsendpaysPayments,
    reader: jspb.BinaryReader,
  ): ListsendpaysPayments;
}

export namespace ListsendpaysPayments {
  export type AsObject = {
    createdIndex?: number;
    id: number;
    groupid: number;
    partid?: number;
    paymentHash: Uint8Array | string;
    updatedIndex?: number;
    status: ListsendpaysPayments.ListsendpaysPaymentsStatus;
    amountMsat?: cln_primitives_pb.Amount.AsObject;
    destination: Uint8Array | string;
    createdAt: number;
    amountSentMsat?: cln_primitives_pb.Amount.AsObject;
    label?: string;
    bolt11?: string;
    description?: string;
    bolt12?: string;
    paymentPreimage: Uint8Array | string;
    erroronion: Uint8Array | string;
  };

  export enum ListsendpaysPaymentsStatus {
    PENDING = 0,
    FAILED = 1,
    COMPLETE = 2,
  }
}

export class ListtransactionsRequest extends jspb.Message {
  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ListtransactionsRequest.AsObject;
  static toObject(
    includeInstance: boolean,
    msg: ListtransactionsRequest,
  ): ListtransactionsRequest.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: ListtransactionsRequest,
    writer: jspb.BinaryWriter,
  ): void;
  static deserializeBinary(bytes: Uint8Array): ListtransactionsRequest;
  static deserializeBinaryFromReader(
    message: ListtransactionsRequest,
    reader: jspb.BinaryReader,
  ): ListtransactionsRequest;
}

export namespace ListtransactionsRequest {
  export type AsObject = {};
}

export class ListtransactionsResponse extends jspb.Message {
  clearTransactionsList(): void;
  getTransactionsList(): Array<ListtransactionsTransactions>;
  setTransactionsList(
    value: Array<ListtransactionsTransactions>,
  ): ListtransactionsResponse;
  addTransactions(
    value?: ListtransactionsTransactions,
    index?: number,
  ): ListtransactionsTransactions;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ListtransactionsResponse.AsObject;
  static toObject(
    includeInstance: boolean,
    msg: ListtransactionsResponse,
  ): ListtransactionsResponse.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: ListtransactionsResponse,
    writer: jspb.BinaryWriter,
  ): void;
  static deserializeBinary(bytes: Uint8Array): ListtransactionsResponse;
  static deserializeBinaryFromReader(
    message: ListtransactionsResponse,
    reader: jspb.BinaryReader,
  ): ListtransactionsResponse;
}

export namespace ListtransactionsResponse {
  export type AsObject = {
    transactionsList: Array<ListtransactionsTransactions.AsObject>;
  };
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
  setInputsList(
    value: Array<ListtransactionsTransactionsInputs>,
  ): ListtransactionsTransactions;
  addInputs(
    value?: ListtransactionsTransactionsInputs,
    index?: number,
  ): ListtransactionsTransactionsInputs;
  clearOutputsList(): void;
  getOutputsList(): Array<ListtransactionsTransactionsOutputs>;
  setOutputsList(
    value: Array<ListtransactionsTransactionsOutputs>,
  ): ListtransactionsTransactions;
  addOutputs(
    value?: ListtransactionsTransactionsOutputs,
    index?: number,
  ): ListtransactionsTransactionsOutputs;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ListtransactionsTransactions.AsObject;
  static toObject(
    includeInstance: boolean,
    msg: ListtransactionsTransactions,
  ): ListtransactionsTransactions.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: ListtransactionsTransactions,
    writer: jspb.BinaryWriter,
  ): void;
  static deserializeBinary(bytes: Uint8Array): ListtransactionsTransactions;
  static deserializeBinaryFromReader(
    message: ListtransactionsTransactions,
    reader: jspb.BinaryReader,
  ): ListtransactionsTransactions;
}

export namespace ListtransactionsTransactions {
  export type AsObject = {
    hash: Uint8Array | string;
    rawtx: Uint8Array | string;
    blockheight: number;
    txindex: number;
    locktime: number;
    version: number;
    inputsList: Array<ListtransactionsTransactionsInputs.AsObject>;
    outputsList: Array<ListtransactionsTransactionsOutputs.AsObject>;
  };
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
  toObject(
    includeInstance?: boolean,
  ): ListtransactionsTransactionsInputs.AsObject;
  static toObject(
    includeInstance: boolean,
    msg: ListtransactionsTransactionsInputs,
  ): ListtransactionsTransactionsInputs.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: ListtransactionsTransactionsInputs,
    writer: jspb.BinaryWriter,
  ): void;
  static deserializeBinary(
    bytes: Uint8Array,
  ): ListtransactionsTransactionsInputs;
  static deserializeBinaryFromReader(
    message: ListtransactionsTransactionsInputs,
    reader: jspb.BinaryReader,
  ): ListtransactionsTransactionsInputs;
}

export namespace ListtransactionsTransactionsInputs {
  export type AsObject = {
    txid: Uint8Array | string;
    index: number;
    sequence: number;
  };
}

export class ListtransactionsTransactionsOutputs extends jspb.Message {
  getIndex(): number;
  setIndex(value: number): ListtransactionsTransactionsOutputs;

  hasAmountMsat(): boolean;
  clearAmountMsat(): void;
  getAmountMsat(): cln_primitives_pb.Amount | undefined;
  setAmountMsat(
    value?: cln_primitives_pb.Amount,
  ): ListtransactionsTransactionsOutputs;
  getScriptpubkey(): Uint8Array | string;
  getScriptpubkey_asU8(): Uint8Array;
  getScriptpubkey_asB64(): string;
  setScriptpubkey(
    value: Uint8Array | string,
  ): ListtransactionsTransactionsOutputs;

  serializeBinary(): Uint8Array;
  toObject(
    includeInstance?: boolean,
  ): ListtransactionsTransactionsOutputs.AsObject;
  static toObject(
    includeInstance: boolean,
    msg: ListtransactionsTransactionsOutputs,
  ): ListtransactionsTransactionsOutputs.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: ListtransactionsTransactionsOutputs,
    writer: jspb.BinaryWriter,
  ): void;
  static deserializeBinary(
    bytes: Uint8Array,
  ): ListtransactionsTransactionsOutputs;
  static deserializeBinaryFromReader(
    message: ListtransactionsTransactionsOutputs,
    reader: jspb.BinaryReader,
  ): ListtransactionsTransactionsOutputs;
}

export namespace ListtransactionsTransactionsOutputs {
  export type AsObject = {
    index: number;
    amountMsat?: cln_primitives_pb.Amount.AsObject;
    scriptpubkey: Uint8Array | string;
  };
}

export class PayRequest extends jspb.Message {
  getBolt11(): string;
  setBolt11(value: string): PayRequest;

  hasAmountMsat(): boolean;
  clearAmountMsat(): void;
  getAmountMsat(): cln_primitives_pb.Amount | undefined;
  setAmountMsat(value?: cln_primitives_pb.Amount): PayRequest;

  hasLabel(): boolean;
  clearLabel(): void;
  getLabel(): string | undefined;
  setLabel(value: string): PayRequest;

  hasRiskfactor(): boolean;
  clearRiskfactor(): void;
  getRiskfactor(): number | undefined;
  setRiskfactor(value: number): PayRequest;

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

  hasLocalinvreqid(): boolean;
  clearLocalinvreqid(): void;
  getLocalinvreqid(): Uint8Array | string;
  getLocalinvreqid_asU8(): Uint8Array;
  getLocalinvreqid_asB64(): string;
  setLocalinvreqid(value: Uint8Array | string): PayRequest;
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

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): PayRequest.AsObject;
  static toObject(
    includeInstance: boolean,
    msg: PayRequest,
  ): PayRequest.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: PayRequest,
    writer: jspb.BinaryWriter,
  ): void;
  static deserializeBinary(bytes: Uint8Array): PayRequest;
  static deserializeBinaryFromReader(
    message: PayRequest,
    reader: jspb.BinaryReader,
  ): PayRequest;
}

export namespace PayRequest {
  export type AsObject = {
    bolt11: string;
    amountMsat?: cln_primitives_pb.Amount.AsObject;
    label?: string;
    riskfactor?: number;
    maxfeepercent?: number;
    retryFor?: number;
    maxdelay?: number;
    exemptfee?: cln_primitives_pb.Amount.AsObject;
    localinvreqid: Uint8Array | string;
    excludeList: Array<string>;
    maxfee?: cln_primitives_pb.Amount.AsObject;
    description?: string;
  };
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
  static toObject(
    includeInstance: boolean,
    msg: PayResponse,
  ): PayResponse.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: PayResponse,
    writer: jspb.BinaryWriter,
  ): void;
  static deserializeBinary(bytes: Uint8Array): PayResponse;
  static deserializeBinaryFromReader(
    message: PayResponse,
    reader: jspb.BinaryReader,
  ): PayResponse;
}

export namespace PayResponse {
  export type AsObject = {
    paymentPreimage: Uint8Array | string;
    destination: Uint8Array | string;
    paymentHash: Uint8Array | string;
    createdAt: number;
    parts: number;
    amountMsat?: cln_primitives_pb.Amount.AsObject;
    amountSentMsat?: cln_primitives_pb.Amount.AsObject;
    warningPartialCompletion?: string;
    status: PayResponse.PayStatus;
  };

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
  static toObject(
    includeInstance: boolean,
    msg: ListnodesRequest,
  ): ListnodesRequest.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: ListnodesRequest,
    writer: jspb.BinaryWriter,
  ): void;
  static deserializeBinary(bytes: Uint8Array): ListnodesRequest;
  static deserializeBinaryFromReader(
    message: ListnodesRequest,
    reader: jspb.BinaryReader,
  ): ListnodesRequest;
}

export namespace ListnodesRequest {
  export type AsObject = {
    id: Uint8Array | string;
  };
}

export class ListnodesResponse extends jspb.Message {
  clearNodesList(): void;
  getNodesList(): Array<ListnodesNodes>;
  setNodesList(value: Array<ListnodesNodes>): ListnodesResponse;
  addNodes(value?: ListnodesNodes, index?: number): ListnodesNodes;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ListnodesResponse.AsObject;
  static toObject(
    includeInstance: boolean,
    msg: ListnodesResponse,
  ): ListnodesResponse.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: ListnodesResponse,
    writer: jspb.BinaryWriter,
  ): void;
  static deserializeBinary(bytes: Uint8Array): ListnodesResponse;
  static deserializeBinaryFromReader(
    message: ListnodesResponse,
    reader: jspb.BinaryReader,
  ): ListnodesResponse;
}

export namespace ListnodesResponse {
  export type AsObject = {
    nodesList: Array<ListnodesNodes.AsObject>;
  };
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
  addAddresses(
    value?: ListnodesNodesAddresses,
    index?: number,
  ): ListnodesNodesAddresses;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ListnodesNodes.AsObject;
  static toObject(
    includeInstance: boolean,
    msg: ListnodesNodes,
  ): ListnodesNodes.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: ListnodesNodes,
    writer: jspb.BinaryWriter,
  ): void;
  static deserializeBinary(bytes: Uint8Array): ListnodesNodes;
  static deserializeBinaryFromReader(
    message: ListnodesNodes,
    reader: jspb.BinaryReader,
  ): ListnodesNodes;
}

export namespace ListnodesNodes {
  export type AsObject = {
    nodeid: Uint8Array | string;
    lastTimestamp?: number;
    alias?: string;
    color: Uint8Array | string;
    features: Uint8Array | string;
    addressesList: Array<ListnodesNodesAddresses.AsObject>;
  };
}

export class ListnodesNodesAddresses extends jspb.Message {
  getItemType(): ListnodesNodesAddresses.ListnodesNodesAddressesType;
  setItemType(
    value: ListnodesNodesAddresses.ListnodesNodesAddressesType,
  ): ListnodesNodesAddresses;
  getPort(): number;
  setPort(value: number): ListnodesNodesAddresses;

  hasAddress(): boolean;
  clearAddress(): void;
  getAddress(): string | undefined;
  setAddress(value: string): ListnodesNodesAddresses;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ListnodesNodesAddresses.AsObject;
  static toObject(
    includeInstance: boolean,
    msg: ListnodesNodesAddresses,
  ): ListnodesNodesAddresses.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: ListnodesNodesAddresses,
    writer: jspb.BinaryWriter,
  ): void;
  static deserializeBinary(bytes: Uint8Array): ListnodesNodesAddresses;
  static deserializeBinaryFromReader(
    message: ListnodesNodesAddresses,
    reader: jspb.BinaryReader,
  ): ListnodesNodesAddresses;
}

export namespace ListnodesNodesAddresses {
  export type AsObject = {
    itemType: ListnodesNodesAddresses.ListnodesNodesAddressesType;
    port: number;
    address?: string;
  };

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
  static toObject(
    includeInstance: boolean,
    msg: WaitanyinvoiceRequest,
  ): WaitanyinvoiceRequest.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: WaitanyinvoiceRequest,
    writer: jspb.BinaryWriter,
  ): void;
  static deserializeBinary(bytes: Uint8Array): WaitanyinvoiceRequest;
  static deserializeBinaryFromReader(
    message: WaitanyinvoiceRequest,
    reader: jspb.BinaryReader,
  ): WaitanyinvoiceRequest;
}

export namespace WaitanyinvoiceRequest {
  export type AsObject = {
    lastpayIndex?: number;
    timeout?: number;
  };
}

export class WaitanyinvoiceResponse extends jspb.Message {
  getLabel(): string;
  setLabel(value: string): WaitanyinvoiceResponse;
  getDescription(): string;
  setDescription(value: string): WaitanyinvoiceResponse;
  getPaymentHash(): Uint8Array | string;
  getPaymentHash_asU8(): Uint8Array;
  getPaymentHash_asB64(): string;
  setPaymentHash(value: Uint8Array | string): WaitanyinvoiceResponse;
  getStatus(): WaitanyinvoiceResponse.WaitanyinvoiceStatus;
  setStatus(
    value: WaitanyinvoiceResponse.WaitanyinvoiceStatus,
  ): WaitanyinvoiceResponse;
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

  hasCreatedIndex(): boolean;
  clearCreatedIndex(): void;
  getCreatedIndex(): number | undefined;
  setCreatedIndex(value: number): WaitanyinvoiceResponse;

  hasUpdatedIndex(): boolean;
  clearUpdatedIndex(): void;
  getUpdatedIndex(): number | undefined;
  setUpdatedIndex(value: number): WaitanyinvoiceResponse;

  hasPayIndex(): boolean;
  clearPayIndex(): void;
  getPayIndex(): number | undefined;
  setPayIndex(value: number): WaitanyinvoiceResponse;

  hasAmountReceivedMsat(): boolean;
  clearAmountReceivedMsat(): void;
  getAmountReceivedMsat(): cln_primitives_pb.Amount | undefined;
  setAmountReceivedMsat(
    value?: cln_primitives_pb.Amount,
  ): WaitanyinvoiceResponse;

  hasPaidAt(): boolean;
  clearPaidAt(): void;
  getPaidAt(): number | undefined;
  setPaidAt(value: number): WaitanyinvoiceResponse;

  hasPaidOutpoint(): boolean;
  clearPaidOutpoint(): void;
  getPaidOutpoint(): WaitanyinvoicePaid_outpoint | undefined;
  setPaidOutpoint(value?: WaitanyinvoicePaid_outpoint): WaitanyinvoiceResponse;

  hasPaymentPreimage(): boolean;
  clearPaymentPreimage(): void;
  getPaymentPreimage(): Uint8Array | string;
  getPaymentPreimage_asU8(): Uint8Array;
  getPaymentPreimage_asB64(): string;
  setPaymentPreimage(value: Uint8Array | string): WaitanyinvoiceResponse;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): WaitanyinvoiceResponse.AsObject;
  static toObject(
    includeInstance: boolean,
    msg: WaitanyinvoiceResponse,
  ): WaitanyinvoiceResponse.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: WaitanyinvoiceResponse,
    writer: jspb.BinaryWriter,
  ): void;
  static deserializeBinary(bytes: Uint8Array): WaitanyinvoiceResponse;
  static deserializeBinaryFromReader(
    message: WaitanyinvoiceResponse,
    reader: jspb.BinaryReader,
  ): WaitanyinvoiceResponse;
}

export namespace WaitanyinvoiceResponse {
  export type AsObject = {
    label: string;
    description: string;
    paymentHash: Uint8Array | string;
    status: WaitanyinvoiceResponse.WaitanyinvoiceStatus;
    expiresAt: number;
    amountMsat?: cln_primitives_pb.Amount.AsObject;
    bolt11?: string;
    bolt12?: string;
    createdIndex?: number;
    updatedIndex?: number;
    payIndex?: number;
    amountReceivedMsat?: cln_primitives_pb.Amount.AsObject;
    paidAt?: number;
    paidOutpoint?: WaitanyinvoicePaid_outpoint.AsObject;
    paymentPreimage: Uint8Array | string;
  };

  export enum WaitanyinvoiceStatus {
    PAID = 0,
    EXPIRED = 1,
  }
}

export class WaitanyinvoicePaid_outpoint extends jspb.Message {
  hasTxid(): boolean;
  clearTxid(): void;
  getTxid(): Uint8Array | string;
  getTxid_asU8(): Uint8Array;
  getTxid_asB64(): string;
  setTxid(value: Uint8Array | string): WaitanyinvoicePaid_outpoint;

  hasOutnum(): boolean;
  clearOutnum(): void;
  getOutnum(): number | undefined;
  setOutnum(value: number): WaitanyinvoicePaid_outpoint;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): WaitanyinvoicePaid_outpoint.AsObject;
  static toObject(
    includeInstance: boolean,
    msg: WaitanyinvoicePaid_outpoint,
  ): WaitanyinvoicePaid_outpoint.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: WaitanyinvoicePaid_outpoint,
    writer: jspb.BinaryWriter,
  ): void;
  static deserializeBinary(bytes: Uint8Array): WaitanyinvoicePaid_outpoint;
  static deserializeBinaryFromReader(
    message: WaitanyinvoicePaid_outpoint,
    reader: jspb.BinaryReader,
  ): WaitanyinvoicePaid_outpoint;
}

export namespace WaitanyinvoicePaid_outpoint {
  export type AsObject = {
    txid: Uint8Array | string;
    outnum?: number;
  };
}

export class WaitinvoiceRequest extends jspb.Message {
  getLabel(): string;
  setLabel(value: string): WaitinvoiceRequest;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): WaitinvoiceRequest.AsObject;
  static toObject(
    includeInstance: boolean,
    msg: WaitinvoiceRequest,
  ): WaitinvoiceRequest.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: WaitinvoiceRequest,
    writer: jspb.BinaryWriter,
  ): void;
  static deserializeBinary(bytes: Uint8Array): WaitinvoiceRequest;
  static deserializeBinaryFromReader(
    message: WaitinvoiceRequest,
    reader: jspb.BinaryReader,
  ): WaitinvoiceRequest;
}

export namespace WaitinvoiceRequest {
  export type AsObject = {
    label: string;
  };
}

export class WaitinvoiceResponse extends jspb.Message {
  getLabel(): string;
  setLabel(value: string): WaitinvoiceResponse;
  getDescription(): string;
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

  hasCreatedIndex(): boolean;
  clearCreatedIndex(): void;
  getCreatedIndex(): number | undefined;
  setCreatedIndex(value: number): WaitinvoiceResponse;

  hasUpdatedIndex(): boolean;
  clearUpdatedIndex(): void;
  getUpdatedIndex(): number | undefined;
  setUpdatedIndex(value: number): WaitinvoiceResponse;

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

  hasPaidOutpoint(): boolean;
  clearPaidOutpoint(): void;
  getPaidOutpoint(): WaitinvoicePaid_outpoint | undefined;
  setPaidOutpoint(value?: WaitinvoicePaid_outpoint): WaitinvoiceResponse;

  hasPaymentPreimage(): boolean;
  clearPaymentPreimage(): void;
  getPaymentPreimage(): Uint8Array | string;
  getPaymentPreimage_asU8(): Uint8Array;
  getPaymentPreimage_asB64(): string;
  setPaymentPreimage(value: Uint8Array | string): WaitinvoiceResponse;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): WaitinvoiceResponse.AsObject;
  static toObject(
    includeInstance: boolean,
    msg: WaitinvoiceResponse,
  ): WaitinvoiceResponse.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: WaitinvoiceResponse,
    writer: jspb.BinaryWriter,
  ): void;
  static deserializeBinary(bytes: Uint8Array): WaitinvoiceResponse;
  static deserializeBinaryFromReader(
    message: WaitinvoiceResponse,
    reader: jspb.BinaryReader,
  ): WaitinvoiceResponse;
}

export namespace WaitinvoiceResponse {
  export type AsObject = {
    label: string;
    description: string;
    paymentHash: Uint8Array | string;
    status: WaitinvoiceResponse.WaitinvoiceStatus;
    expiresAt: number;
    amountMsat?: cln_primitives_pb.Amount.AsObject;
    bolt11?: string;
    bolt12?: string;
    createdIndex?: number;
    updatedIndex?: number;
    payIndex?: number;
    amountReceivedMsat?: cln_primitives_pb.Amount.AsObject;
    paidAt?: number;
    paidOutpoint?: WaitinvoicePaid_outpoint.AsObject;
    paymentPreimage: Uint8Array | string;
  };

  export enum WaitinvoiceStatus {
    PAID = 0,
    EXPIRED = 1,
  }
}

export class WaitinvoicePaid_outpoint extends jspb.Message {
  hasTxid(): boolean;
  clearTxid(): void;
  getTxid(): Uint8Array | string;
  getTxid_asU8(): Uint8Array;
  getTxid_asB64(): string;
  setTxid(value: Uint8Array | string): WaitinvoicePaid_outpoint;

  hasOutnum(): boolean;
  clearOutnum(): void;
  getOutnum(): number | undefined;
  setOutnum(value: number): WaitinvoicePaid_outpoint;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): WaitinvoicePaid_outpoint.AsObject;
  static toObject(
    includeInstance: boolean,
    msg: WaitinvoicePaid_outpoint,
  ): WaitinvoicePaid_outpoint.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: WaitinvoicePaid_outpoint,
    writer: jspb.BinaryWriter,
  ): void;
  static deserializeBinary(bytes: Uint8Array): WaitinvoicePaid_outpoint;
  static deserializeBinaryFromReader(
    message: WaitinvoicePaid_outpoint,
    reader: jspb.BinaryReader,
  ): WaitinvoicePaid_outpoint;
}

export namespace WaitinvoicePaid_outpoint {
  export type AsObject = {
    txid: Uint8Array | string;
    outnum?: number;
  };
}

export class WaitsendpayRequest extends jspb.Message {
  getPaymentHash(): Uint8Array | string;
  getPaymentHash_asU8(): Uint8Array;
  getPaymentHash_asB64(): string;
  setPaymentHash(value: Uint8Array | string): WaitsendpayRequest;

  hasTimeout(): boolean;
  clearTimeout(): void;
  getTimeout(): number | undefined;
  setTimeout(value: number): WaitsendpayRequest;

  hasPartid(): boolean;
  clearPartid(): void;
  getPartid(): number | undefined;
  setPartid(value: number): WaitsendpayRequest;

  hasGroupid(): boolean;
  clearGroupid(): void;
  getGroupid(): number | undefined;
  setGroupid(value: number): WaitsendpayRequest;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): WaitsendpayRequest.AsObject;
  static toObject(
    includeInstance: boolean,
    msg: WaitsendpayRequest,
  ): WaitsendpayRequest.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: WaitsendpayRequest,
    writer: jspb.BinaryWriter,
  ): void;
  static deserializeBinary(bytes: Uint8Array): WaitsendpayRequest;
  static deserializeBinaryFromReader(
    message: WaitsendpayRequest,
    reader: jspb.BinaryReader,
  ): WaitsendpayRequest;
}

export namespace WaitsendpayRequest {
  export type AsObject = {
    paymentHash: Uint8Array | string;
    timeout?: number;
    partid?: number;
    groupid?: number;
  };
}

export class WaitsendpayResponse extends jspb.Message {
  hasCreatedIndex(): boolean;
  clearCreatedIndex(): void;
  getCreatedIndex(): number | undefined;
  setCreatedIndex(value: number): WaitsendpayResponse;
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

  hasUpdatedIndex(): boolean;
  clearUpdatedIndex(): void;
  getUpdatedIndex(): number | undefined;
  setUpdatedIndex(value: number): WaitsendpayResponse;

  hasCompletedAt(): boolean;
  clearCompletedAt(): void;
  getCompletedAt(): number | undefined;
  setCompletedAt(value: number): WaitsendpayResponse;

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

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): WaitsendpayResponse.AsObject;
  static toObject(
    includeInstance: boolean,
    msg: WaitsendpayResponse,
  ): WaitsendpayResponse.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: WaitsendpayResponse,
    writer: jspb.BinaryWriter,
  ): void;
  static deserializeBinary(bytes: Uint8Array): WaitsendpayResponse;
  static deserializeBinaryFromReader(
    message: WaitsendpayResponse,
    reader: jspb.BinaryReader,
  ): WaitsendpayResponse;
}

export namespace WaitsendpayResponse {
  export type AsObject = {
    createdIndex?: number;
    id: number;
    groupid?: number;
    paymentHash: Uint8Array | string;
    status: WaitsendpayResponse.WaitsendpayStatus;
    amountMsat?: cln_primitives_pb.Amount.AsObject;
    destination: Uint8Array | string;
    createdAt: number;
    updatedIndex?: number;
    completedAt?: number;
    amountSentMsat?: cln_primitives_pb.Amount.AsObject;
    label?: string;
    partid?: number;
    bolt11?: string;
    bolt12?: string;
    paymentPreimage: Uint8Array | string;
  };

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
  static toObject(
    includeInstance: boolean,
    msg: NewaddrRequest,
  ): NewaddrRequest.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: NewaddrRequest,
    writer: jspb.BinaryWriter,
  ): void;
  static deserializeBinary(bytes: Uint8Array): NewaddrRequest;
  static deserializeBinaryFromReader(
    message: NewaddrRequest,
    reader: jspb.BinaryReader,
  ): NewaddrRequest;
}

export namespace NewaddrRequest {
  export type AsObject = {
    addresstype?: NewaddrRequest.NewaddrAddresstype;
  };

  export enum NewaddrAddresstype {
    BECH32 = 0,
    P2TR = 3,
    ALL = 2,
  }
}

export class NewaddrResponse extends jspb.Message {
  hasP2tr(): boolean;
  clearP2tr(): void;
  getP2tr(): string | undefined;
  setP2tr(value: string): NewaddrResponse;

  hasBech32(): boolean;
  clearBech32(): void;
  getBech32(): string | undefined;
  setBech32(value: string): NewaddrResponse;

  hasP2shSegwit(): boolean;
  clearP2shSegwit(): void;
  getP2shSegwit(): string | undefined;
  setP2shSegwit(value: string): NewaddrResponse;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): NewaddrResponse.AsObject;
  static toObject(
    includeInstance: boolean,
    msg: NewaddrResponse,
  ): NewaddrResponse.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: NewaddrResponse,
    writer: jspb.BinaryWriter,
  ): void;
  static deserializeBinary(bytes: Uint8Array): NewaddrResponse;
  static deserializeBinaryFromReader(
    message: NewaddrResponse,
    reader: jspb.BinaryReader,
  ): NewaddrResponse;
}

export namespace NewaddrResponse {
  export type AsObject = {
    p2tr?: string;
    bech32?: string;
    p2shSegwit?: string;
  };
}

export class WithdrawRequest extends jspb.Message {
  getDestination(): string;
  setDestination(value: string): WithdrawRequest;

  hasSatoshi(): boolean;
  clearSatoshi(): void;
  getSatoshi(): cln_primitives_pb.AmountOrAll | undefined;
  setSatoshi(value?: cln_primitives_pb.AmountOrAll): WithdrawRequest;

  hasFeerate(): boolean;
  clearFeerate(): void;
  getFeerate(): cln_primitives_pb.Feerate | undefined;
  setFeerate(value?: cln_primitives_pb.Feerate): WithdrawRequest;

  hasMinconf(): boolean;
  clearMinconf(): void;
  getMinconf(): number | undefined;
  setMinconf(value: number): WithdrawRequest;
  clearUtxosList(): void;
  getUtxosList(): Array<cln_primitives_pb.Outpoint>;
  setUtxosList(value: Array<cln_primitives_pb.Outpoint>): WithdrawRequest;
  addUtxos(
    value?: cln_primitives_pb.Outpoint,
    index?: number,
  ): cln_primitives_pb.Outpoint;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): WithdrawRequest.AsObject;
  static toObject(
    includeInstance: boolean,
    msg: WithdrawRequest,
  ): WithdrawRequest.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: WithdrawRequest,
    writer: jspb.BinaryWriter,
  ): void;
  static deserializeBinary(bytes: Uint8Array): WithdrawRequest;
  static deserializeBinaryFromReader(
    message: WithdrawRequest,
    reader: jspb.BinaryReader,
  ): WithdrawRequest;
}

export namespace WithdrawRequest {
  export type AsObject = {
    destination: string;
    satoshi?: cln_primitives_pb.AmountOrAll.AsObject;
    feerate?: cln_primitives_pb.Feerate.AsObject;
    minconf?: number;
    utxosList: Array<cln_primitives_pb.Outpoint.AsObject>;
  };
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
  static toObject(
    includeInstance: boolean,
    msg: WithdrawResponse,
  ): WithdrawResponse.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: WithdrawResponse,
    writer: jspb.BinaryWriter,
  ): void;
  static deserializeBinary(bytes: Uint8Array): WithdrawResponse;
  static deserializeBinaryFromReader(
    message: WithdrawResponse,
    reader: jspb.BinaryReader,
  ): WithdrawResponse;
}

export namespace WithdrawResponse {
  export type AsObject = {
    tx: Uint8Array | string;
    txid: Uint8Array | string;
    psbt: string;
  };
}

export class KeysendRequest extends jspb.Message {
  getDestination(): Uint8Array | string;
  getDestination_asU8(): Uint8Array;
  getDestination_asB64(): string;
  setDestination(value: Uint8Array | string): KeysendRequest;

  hasAmountMsat(): boolean;
  clearAmountMsat(): void;
  getAmountMsat(): cln_primitives_pb.Amount | undefined;
  setAmountMsat(value?: cln_primitives_pb.Amount): KeysendRequest;

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

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): KeysendRequest.AsObject;
  static toObject(
    includeInstance: boolean,
    msg: KeysendRequest,
  ): KeysendRequest.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: KeysendRequest,
    writer: jspb.BinaryWriter,
  ): void;
  static deserializeBinary(bytes: Uint8Array): KeysendRequest;
  static deserializeBinaryFromReader(
    message: KeysendRequest,
    reader: jspb.BinaryReader,
  ): KeysendRequest;
}

export namespace KeysendRequest {
  export type AsObject = {
    destination: Uint8Array | string;
    amountMsat?: cln_primitives_pb.Amount.AsObject;
    label?: string;
    maxfeepercent?: number;
    retryFor?: number;
    maxdelay?: number;
    exemptfee?: cln_primitives_pb.Amount.AsObject;
    routehints?: cln_primitives_pb.RoutehintList.AsObject;
    extratlvs?: cln_primitives_pb.TlvStream.AsObject;
  };
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
  static toObject(
    includeInstance: boolean,
    msg: KeysendResponse,
  ): KeysendResponse.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: KeysendResponse,
    writer: jspb.BinaryWriter,
  ): void;
  static deserializeBinary(bytes: Uint8Array): KeysendResponse;
  static deserializeBinaryFromReader(
    message: KeysendResponse,
    reader: jspb.BinaryReader,
  ): KeysendResponse;
}

export namespace KeysendResponse {
  export type AsObject = {
    paymentPreimage: Uint8Array | string;
    destination: Uint8Array | string;
    paymentHash: Uint8Array | string;
    createdAt: number;
    parts: number;
    amountMsat?: cln_primitives_pb.Amount.AsObject;
    amountSentMsat?: cln_primitives_pb.Amount.AsObject;
    warningPartialCompletion?: string;
    status: KeysendResponse.KeysendStatus;
  };

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
  static toObject(
    includeInstance: boolean,
    msg: FundpsbtRequest,
  ): FundpsbtRequest.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: FundpsbtRequest,
    writer: jspb.BinaryWriter,
  ): void;
  static deserializeBinary(bytes: Uint8Array): FundpsbtRequest;
  static deserializeBinaryFromReader(
    message: FundpsbtRequest,
    reader: jspb.BinaryReader,
  ): FundpsbtRequest;
}

export namespace FundpsbtRequest {
  export type AsObject = {
    satoshi?: cln_primitives_pb.AmountOrAll.AsObject;
    feerate?: cln_primitives_pb.Feerate.AsObject;
    startweight: number;
    minconf?: number;
    reserve?: number;
    locktime?: number;
    minWitnessWeight?: number;
    excessAsChange?: boolean;
    nonwrapped?: boolean;
    openingAnchorChannel?: boolean;
  };
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
  addReservations(
    value?: FundpsbtReservations,
    index?: number,
  ): FundpsbtReservations;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): FundpsbtResponse.AsObject;
  static toObject(
    includeInstance: boolean,
    msg: FundpsbtResponse,
  ): FundpsbtResponse.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: FundpsbtResponse,
    writer: jspb.BinaryWriter,
  ): void;
  static deserializeBinary(bytes: Uint8Array): FundpsbtResponse;
  static deserializeBinaryFromReader(
    message: FundpsbtResponse,
    reader: jspb.BinaryReader,
  ): FundpsbtResponse;
}

export namespace FundpsbtResponse {
  export type AsObject = {
    psbt: string;
    feeratePerKw: number;
    estimatedFinalWeight: number;
    excessMsat?: cln_primitives_pb.Amount.AsObject;
    changeOutnum?: number;
    reservationsList: Array<FundpsbtReservations.AsObject>;
  };
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
  static toObject(
    includeInstance: boolean,
    msg: FundpsbtReservations,
  ): FundpsbtReservations.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: FundpsbtReservations,
    writer: jspb.BinaryWriter,
  ): void;
  static deserializeBinary(bytes: Uint8Array): FundpsbtReservations;
  static deserializeBinaryFromReader(
    message: FundpsbtReservations,
    reader: jspb.BinaryReader,
  ): FundpsbtReservations;
}

export namespace FundpsbtReservations {
  export type AsObject = {
    txid: Uint8Array | string;
    vout: number;
    wasReserved: boolean;
    reserved: boolean;
    reservedToBlock: number;
  };
}

export class SendpsbtRequest extends jspb.Message {
  getPsbt(): string;
  setPsbt(value: string): SendpsbtRequest;

  hasReserve(): boolean;
  clearReserve(): void;
  getReserve(): boolean | undefined;
  setReserve(value: boolean): SendpsbtRequest;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): SendpsbtRequest.AsObject;
  static toObject(
    includeInstance: boolean,
    msg: SendpsbtRequest,
  ): SendpsbtRequest.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: SendpsbtRequest,
    writer: jspb.BinaryWriter,
  ): void;
  static deserializeBinary(bytes: Uint8Array): SendpsbtRequest;
  static deserializeBinaryFromReader(
    message: SendpsbtRequest,
    reader: jspb.BinaryReader,
  ): SendpsbtRequest;
}

export namespace SendpsbtRequest {
  export type AsObject = {
    psbt: string;
    reserve?: boolean;
  };
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
  static toObject(
    includeInstance: boolean,
    msg: SendpsbtResponse,
  ): SendpsbtResponse.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: SendpsbtResponse,
    writer: jspb.BinaryWriter,
  ): void;
  static deserializeBinary(bytes: Uint8Array): SendpsbtResponse;
  static deserializeBinaryFromReader(
    message: SendpsbtResponse,
    reader: jspb.BinaryReader,
  ): SendpsbtResponse;
}

export namespace SendpsbtResponse {
  export type AsObject = {
    tx: Uint8Array | string;
    txid: Uint8Array | string;
  };
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
  static toObject(
    includeInstance: boolean,
    msg: SignpsbtRequest,
  ): SignpsbtRequest.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: SignpsbtRequest,
    writer: jspb.BinaryWriter,
  ): void;
  static deserializeBinary(bytes: Uint8Array): SignpsbtRequest;
  static deserializeBinaryFromReader(
    message: SignpsbtRequest,
    reader: jspb.BinaryReader,
  ): SignpsbtRequest;
}

export namespace SignpsbtRequest {
  export type AsObject = {
    psbt: string;
    signonlyList: Array<number>;
  };
}

export class SignpsbtResponse extends jspb.Message {
  getSignedPsbt(): string;
  setSignedPsbt(value: string): SignpsbtResponse;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): SignpsbtResponse.AsObject;
  static toObject(
    includeInstance: boolean,
    msg: SignpsbtResponse,
  ): SignpsbtResponse.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: SignpsbtResponse,
    writer: jspb.BinaryWriter,
  ): void;
  static deserializeBinary(bytes: Uint8Array): SignpsbtResponse;
  static deserializeBinaryFromReader(
    message: SignpsbtResponse,
    reader: jspb.BinaryReader,
  ): SignpsbtResponse;
}

export namespace SignpsbtResponse {
  export type AsObject = {
    signedPsbt: string;
  };
}

export class UtxopsbtRequest extends jspb.Message {
  hasSatoshi(): boolean;
  clearSatoshi(): void;
  getSatoshi(): cln_primitives_pb.Amount | undefined;
  setSatoshi(value?: cln_primitives_pb.Amount): UtxopsbtRequest;

  hasFeerate(): boolean;
  clearFeerate(): void;
  getFeerate(): cln_primitives_pb.Feerate | undefined;
  setFeerate(value?: cln_primitives_pb.Feerate): UtxopsbtRequest;
  getStartweight(): number;
  setStartweight(value: number): UtxopsbtRequest;
  clearUtxosList(): void;
  getUtxosList(): Array<cln_primitives_pb.Outpoint>;
  setUtxosList(value: Array<cln_primitives_pb.Outpoint>): UtxopsbtRequest;
  addUtxos(
    value?: cln_primitives_pb.Outpoint,
    index?: number,
  ): cln_primitives_pb.Outpoint;

  hasReserve(): boolean;
  clearReserve(): void;
  getReserve(): number | undefined;
  setReserve(value: number): UtxopsbtRequest;

  hasReservedok(): boolean;
  clearReservedok(): void;
  getReservedok(): boolean | undefined;
  setReservedok(value: boolean): UtxopsbtRequest;

  hasLocktime(): boolean;
  clearLocktime(): void;
  getLocktime(): number | undefined;
  setLocktime(value: number): UtxopsbtRequest;

  hasMinWitnessWeight(): boolean;
  clearMinWitnessWeight(): void;
  getMinWitnessWeight(): number | undefined;
  setMinWitnessWeight(value: number): UtxopsbtRequest;

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
  static toObject(
    includeInstance: boolean,
    msg: UtxopsbtRequest,
  ): UtxopsbtRequest.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: UtxopsbtRequest,
    writer: jspb.BinaryWriter,
  ): void;
  static deserializeBinary(bytes: Uint8Array): UtxopsbtRequest;
  static deserializeBinaryFromReader(
    message: UtxopsbtRequest,
    reader: jspb.BinaryReader,
  ): UtxopsbtRequest;
}

export namespace UtxopsbtRequest {
  export type AsObject = {
    satoshi?: cln_primitives_pb.Amount.AsObject;
    feerate?: cln_primitives_pb.Feerate.AsObject;
    startweight: number;
    utxosList: Array<cln_primitives_pb.Outpoint.AsObject>;
    reserve?: number;
    reservedok?: boolean;
    locktime?: number;
    minWitnessWeight?: number;
    excessAsChange?: boolean;
    openingAnchorChannel?: boolean;
  };
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
  addReservations(
    value?: UtxopsbtReservations,
    index?: number,
  ): UtxopsbtReservations;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): UtxopsbtResponse.AsObject;
  static toObject(
    includeInstance: boolean,
    msg: UtxopsbtResponse,
  ): UtxopsbtResponse.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: UtxopsbtResponse,
    writer: jspb.BinaryWriter,
  ): void;
  static deserializeBinary(bytes: Uint8Array): UtxopsbtResponse;
  static deserializeBinaryFromReader(
    message: UtxopsbtResponse,
    reader: jspb.BinaryReader,
  ): UtxopsbtResponse;
}

export namespace UtxopsbtResponse {
  export type AsObject = {
    psbt: string;
    feeratePerKw: number;
    estimatedFinalWeight: number;
    excessMsat?: cln_primitives_pb.Amount.AsObject;
    changeOutnum?: number;
    reservationsList: Array<UtxopsbtReservations.AsObject>;
  };
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
  static toObject(
    includeInstance: boolean,
    msg: UtxopsbtReservations,
  ): UtxopsbtReservations.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: UtxopsbtReservations,
    writer: jspb.BinaryWriter,
  ): void;
  static deserializeBinary(bytes: Uint8Array): UtxopsbtReservations;
  static deserializeBinaryFromReader(
    message: UtxopsbtReservations,
    reader: jspb.BinaryReader,
  ): UtxopsbtReservations;
}

export namespace UtxopsbtReservations {
  export type AsObject = {
    txid: Uint8Array | string;
    vout: number;
    wasReserved: boolean;
    reserved: boolean;
    reservedToBlock: number;
  };
}

export class TxdiscardRequest extends jspb.Message {
  getTxid(): Uint8Array | string;
  getTxid_asU8(): Uint8Array;
  getTxid_asB64(): string;
  setTxid(value: Uint8Array | string): TxdiscardRequest;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): TxdiscardRequest.AsObject;
  static toObject(
    includeInstance: boolean,
    msg: TxdiscardRequest,
  ): TxdiscardRequest.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: TxdiscardRequest,
    writer: jspb.BinaryWriter,
  ): void;
  static deserializeBinary(bytes: Uint8Array): TxdiscardRequest;
  static deserializeBinaryFromReader(
    message: TxdiscardRequest,
    reader: jspb.BinaryReader,
  ): TxdiscardRequest;
}

export namespace TxdiscardRequest {
  export type AsObject = {
    txid: Uint8Array | string;
  };
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
  static toObject(
    includeInstance: boolean,
    msg: TxdiscardResponse,
  ): TxdiscardResponse.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: TxdiscardResponse,
    writer: jspb.BinaryWriter,
  ): void;
  static deserializeBinary(bytes: Uint8Array): TxdiscardResponse;
  static deserializeBinaryFromReader(
    message: TxdiscardResponse,
    reader: jspb.BinaryReader,
  ): TxdiscardResponse;
}

export namespace TxdiscardResponse {
  export type AsObject = {
    unsignedTx: Uint8Array | string;
    txid: Uint8Array | string;
  };
}

export class TxprepareRequest extends jspb.Message {
  clearOutputsList(): void;
  getOutputsList(): Array<cln_primitives_pb.OutputDesc>;
  setOutputsList(value: Array<cln_primitives_pb.OutputDesc>): TxprepareRequest;
  addOutputs(
    value?: cln_primitives_pb.OutputDesc,
    index?: number,
  ): cln_primitives_pb.OutputDesc;

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
  addUtxos(
    value?: cln_primitives_pb.Outpoint,
    index?: number,
  ): cln_primitives_pb.Outpoint;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): TxprepareRequest.AsObject;
  static toObject(
    includeInstance: boolean,
    msg: TxprepareRequest,
  ): TxprepareRequest.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: TxprepareRequest,
    writer: jspb.BinaryWriter,
  ): void;
  static deserializeBinary(bytes: Uint8Array): TxprepareRequest;
  static deserializeBinaryFromReader(
    message: TxprepareRequest,
    reader: jspb.BinaryReader,
  ): TxprepareRequest;
}

export namespace TxprepareRequest {
  export type AsObject = {
    outputsList: Array<cln_primitives_pb.OutputDesc.AsObject>;
    feerate?: cln_primitives_pb.Feerate.AsObject;
    minconf?: number;
    utxosList: Array<cln_primitives_pb.Outpoint.AsObject>;
  };
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
  static toObject(
    includeInstance: boolean,
    msg: TxprepareResponse,
  ): TxprepareResponse.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: TxprepareResponse,
    writer: jspb.BinaryWriter,
  ): void;
  static deserializeBinary(bytes: Uint8Array): TxprepareResponse;
  static deserializeBinaryFromReader(
    message: TxprepareResponse,
    reader: jspb.BinaryReader,
  ): TxprepareResponse;
}

export namespace TxprepareResponse {
  export type AsObject = {
    psbt: string;
    unsignedTx: Uint8Array | string;
    txid: Uint8Array | string;
  };
}

export class TxsendRequest extends jspb.Message {
  getTxid(): Uint8Array | string;
  getTxid_asU8(): Uint8Array;
  getTxid_asB64(): string;
  setTxid(value: Uint8Array | string): TxsendRequest;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): TxsendRequest.AsObject;
  static toObject(
    includeInstance: boolean,
    msg: TxsendRequest,
  ): TxsendRequest.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: TxsendRequest,
    writer: jspb.BinaryWriter,
  ): void;
  static deserializeBinary(bytes: Uint8Array): TxsendRequest;
  static deserializeBinaryFromReader(
    message: TxsendRequest,
    reader: jspb.BinaryReader,
  ): TxsendRequest;
}

export namespace TxsendRequest {
  export type AsObject = {
    txid: Uint8Array | string;
  };
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
  static toObject(
    includeInstance: boolean,
    msg: TxsendResponse,
  ): TxsendResponse.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: TxsendResponse,
    writer: jspb.BinaryWriter,
  ): void;
  static deserializeBinary(bytes: Uint8Array): TxsendResponse;
  static deserializeBinaryFromReader(
    message: TxsendResponse,
    reader: jspb.BinaryReader,
  ): TxsendResponse;
}

export namespace TxsendResponse {
  export type AsObject = {
    psbt: string;
    tx: Uint8Array | string;
    txid: Uint8Array | string;
  };
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
  static toObject(
    includeInstance: boolean,
    msg: ListpeerchannelsRequest,
  ): ListpeerchannelsRequest.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: ListpeerchannelsRequest,
    writer: jspb.BinaryWriter,
  ): void;
  static deserializeBinary(bytes: Uint8Array): ListpeerchannelsRequest;
  static deserializeBinaryFromReader(
    message: ListpeerchannelsRequest,
    reader: jspb.BinaryReader,
  ): ListpeerchannelsRequest;
}

export namespace ListpeerchannelsRequest {
  export type AsObject = {
    id: Uint8Array | string;
  };
}

export class ListpeerchannelsResponse extends jspb.Message {
  clearChannelsList(): void;
  getChannelsList(): Array<ListpeerchannelsChannels>;
  setChannelsList(
    value: Array<ListpeerchannelsChannels>,
  ): ListpeerchannelsResponse;
  addChannels(
    value?: ListpeerchannelsChannels,
    index?: number,
  ): ListpeerchannelsChannels;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ListpeerchannelsResponse.AsObject;
  static toObject(
    includeInstance: boolean,
    msg: ListpeerchannelsResponse,
  ): ListpeerchannelsResponse.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: ListpeerchannelsResponse,
    writer: jspb.BinaryWriter,
  ): void;
  static deserializeBinary(bytes: Uint8Array): ListpeerchannelsResponse;
  static deserializeBinaryFromReader(
    message: ListpeerchannelsResponse,
    reader: jspb.BinaryReader,
  ): ListpeerchannelsResponse;
}

export namespace ListpeerchannelsResponse {
  export type AsObject = {
    channelsList: Array<ListpeerchannelsChannels.AsObject>;
  };
}

export class ListpeerchannelsChannels extends jspb.Message {
  hasPeerId(): boolean;
  clearPeerId(): void;
  getPeerId(): Uint8Array | string;
  getPeerId_asU8(): Uint8Array;
  getPeerId_asB64(): string;
  setPeerId(value: Uint8Array | string): ListpeerchannelsChannels;

  hasPeerConnected(): boolean;
  clearPeerConnected(): void;
  getPeerConnected(): boolean | undefined;
  setPeerConnected(value: boolean): ListpeerchannelsChannels;

  hasState(): boolean;
  clearState(): void;
  getState():
    | ListpeerchannelsChannels.ListpeerchannelsChannelsState
    | undefined;
  setState(
    value: ListpeerchannelsChannels.ListpeerchannelsChannelsState,
  ): ListpeerchannelsChannels;

  hasScratchTxid(): boolean;
  clearScratchTxid(): void;
  getScratchTxid(): Uint8Array | string;
  getScratchTxid_asU8(): Uint8Array;
  getScratchTxid_asB64(): string;
  setScratchTxid(value: Uint8Array | string): ListpeerchannelsChannels;

  hasIgnoreFeeLimits(): boolean;
  clearIgnoreFeeLimits(): void;
  getIgnoreFeeLimits(): boolean | undefined;
  setIgnoreFeeLimits(value: boolean): ListpeerchannelsChannels;

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
  setInflightList(
    value: Array<ListpeerchannelsChannelsInflight>,
  ): ListpeerchannelsChannels;
  addInflight(
    value?: ListpeerchannelsChannelsInflight,
    index?: number,
  ): ListpeerchannelsChannelsInflight;

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

  hasOpener(): boolean;
  clearOpener(): void;
  getOpener(): cln_primitives_pb.ChannelSide | undefined;
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
  setMaxTotalHtlcInMsat(
    value?: cln_primitives_pb.Amount,
  ): ListpeerchannelsChannels;

  hasTheirReserveMsat(): boolean;
  clearTheirReserveMsat(): void;
  getTheirReserveMsat(): cln_primitives_pb.Amount | undefined;
  setTheirReserveMsat(
    value?: cln_primitives_pb.Amount,
  ): ListpeerchannelsChannels;

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
  setMinimumHtlcInMsat(
    value?: cln_primitives_pb.Amount,
  ): ListpeerchannelsChannels;

  hasMinimumHtlcOutMsat(): boolean;
  clearMinimumHtlcOutMsat(): void;
  getMinimumHtlcOutMsat(): cln_primitives_pb.Amount | undefined;
  setMinimumHtlcOutMsat(
    value?: cln_primitives_pb.Amount,
  ): ListpeerchannelsChannels;

  hasMaximumHtlcOutMsat(): boolean;
  clearMaximumHtlcOutMsat(): void;
  getMaximumHtlcOutMsat(): cln_primitives_pb.Amount | undefined;
  setMaximumHtlcOutMsat(
    value?: cln_primitives_pb.Amount,
  ): ListpeerchannelsChannels;

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
  setInFulfilledMsat(
    value?: cln_primitives_pb.Amount,
  ): ListpeerchannelsChannels;

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
  setOutFulfilledMsat(
    value?: cln_primitives_pb.Amount,
  ): ListpeerchannelsChannels;
  clearHtlcsList(): void;
  getHtlcsList(): Array<ListpeerchannelsChannelsHtlcs>;
  setHtlcsList(
    value: Array<ListpeerchannelsChannelsHtlcs>,
  ): ListpeerchannelsChannels;
  addHtlcs(
    value?: ListpeerchannelsChannelsHtlcs,
    index?: number,
  ): ListpeerchannelsChannelsHtlcs;

  hasCloseToAddr(): boolean;
  clearCloseToAddr(): void;
  getCloseToAddr(): string | undefined;
  setCloseToAddr(value: string): ListpeerchannelsChannels;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ListpeerchannelsChannels.AsObject;
  static toObject(
    includeInstance: boolean,
    msg: ListpeerchannelsChannels,
  ): ListpeerchannelsChannels.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: ListpeerchannelsChannels,
    writer: jspb.BinaryWriter,
  ): void;
  static deserializeBinary(bytes: Uint8Array): ListpeerchannelsChannels;
  static deserializeBinaryFromReader(
    message: ListpeerchannelsChannels,
    reader: jspb.BinaryReader,
  ): ListpeerchannelsChannels;
}

export namespace ListpeerchannelsChannels {
  export type AsObject = {
    peerId: Uint8Array | string;
    peerConnected?: boolean;
    state?: ListpeerchannelsChannels.ListpeerchannelsChannelsState;
    scratchTxid: Uint8Array | string;
    ignoreFeeLimits?: boolean;
    feerate?: ListpeerchannelsChannelsFeerate.AsObject;
    owner?: string;
    shortChannelId?: string;
    channelId: Uint8Array | string;
    fundingTxid: Uint8Array | string;
    fundingOutnum?: number;
    initialFeerate?: string;
    lastFeerate?: string;
    nextFeerate?: string;
    nextFeeStep?: number;
    inflightList: Array<ListpeerchannelsChannelsInflight.AsObject>;
    closeTo: Uint8Array | string;
    pb_private?: boolean;
    opener?: cln_primitives_pb.ChannelSide;
    closer?: cln_primitives_pb.ChannelSide;
    funding?: ListpeerchannelsChannelsFunding.AsObject;
    toUsMsat?: cln_primitives_pb.Amount.AsObject;
    minToUsMsat?: cln_primitives_pb.Amount.AsObject;
    maxToUsMsat?: cln_primitives_pb.Amount.AsObject;
    totalMsat?: cln_primitives_pb.Amount.AsObject;
    feeBaseMsat?: cln_primitives_pb.Amount.AsObject;
    feeProportionalMillionths?: number;
    dustLimitMsat?: cln_primitives_pb.Amount.AsObject;
    maxTotalHtlcInMsat?: cln_primitives_pb.Amount.AsObject;
    theirReserveMsat?: cln_primitives_pb.Amount.AsObject;
    ourReserveMsat?: cln_primitives_pb.Amount.AsObject;
    spendableMsat?: cln_primitives_pb.Amount.AsObject;
    receivableMsat?: cln_primitives_pb.Amount.AsObject;
    minimumHtlcInMsat?: cln_primitives_pb.Amount.AsObject;
    minimumHtlcOutMsat?: cln_primitives_pb.Amount.AsObject;
    maximumHtlcOutMsat?: cln_primitives_pb.Amount.AsObject;
    theirToSelfDelay?: number;
    ourToSelfDelay?: number;
    maxAcceptedHtlcs?: number;
    alias?: ListpeerchannelsChannelsAlias.AsObject;
    statusList: Array<string>;
    inPaymentsOffered?: number;
    inOfferedMsat?: cln_primitives_pb.Amount.AsObject;
    inPaymentsFulfilled?: number;
    inFulfilledMsat?: cln_primitives_pb.Amount.AsObject;
    outPaymentsOffered?: number;
    outOfferedMsat?: cln_primitives_pb.Amount.AsObject;
    outPaymentsFulfilled?: number;
    outFulfilledMsat?: cln_primitives_pb.Amount.AsObject;
    htlcsList: Array<ListpeerchannelsChannelsHtlcs.AsObject>;
    closeToAddr?: string;
  };

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

export class ListpeerchannelsChannelsFeerate extends jspb.Message {
  hasPerkw(): boolean;
  clearPerkw(): void;
  getPerkw(): number | undefined;
  setPerkw(value: number): ListpeerchannelsChannelsFeerate;

  hasPerkb(): boolean;
  clearPerkb(): void;
  getPerkb(): number | undefined;
  setPerkb(value: number): ListpeerchannelsChannelsFeerate;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ListpeerchannelsChannelsFeerate.AsObject;
  static toObject(
    includeInstance: boolean,
    msg: ListpeerchannelsChannelsFeerate,
  ): ListpeerchannelsChannelsFeerate.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: ListpeerchannelsChannelsFeerate,
    writer: jspb.BinaryWriter,
  ): void;
  static deserializeBinary(bytes: Uint8Array): ListpeerchannelsChannelsFeerate;
  static deserializeBinaryFromReader(
    message: ListpeerchannelsChannelsFeerate,
    reader: jspb.BinaryReader,
  ): ListpeerchannelsChannelsFeerate;
}

export namespace ListpeerchannelsChannelsFeerate {
  export type AsObject = {
    perkw?: number;
    perkb?: number;
  };
}

export class ListpeerchannelsChannelsInflight extends jspb.Message {
  hasFundingTxid(): boolean;
  clearFundingTxid(): void;
  getFundingTxid(): Uint8Array | string;
  getFundingTxid_asU8(): Uint8Array;
  getFundingTxid_asB64(): string;
  setFundingTxid(value: Uint8Array | string): ListpeerchannelsChannelsInflight;

  hasFundingOutnum(): boolean;
  clearFundingOutnum(): void;
  getFundingOutnum(): number | undefined;
  setFundingOutnum(value: number): ListpeerchannelsChannelsInflight;

  hasFeerate(): boolean;
  clearFeerate(): void;
  getFeerate(): string | undefined;
  setFeerate(value: string): ListpeerchannelsChannelsInflight;

  hasTotalFundingMsat(): boolean;
  clearTotalFundingMsat(): void;
  getTotalFundingMsat(): cln_primitives_pb.Amount | undefined;
  setTotalFundingMsat(
    value?: cln_primitives_pb.Amount,
  ): ListpeerchannelsChannelsInflight;

  hasSpliceAmount(): boolean;
  clearSpliceAmount(): void;
  getSpliceAmount(): number | undefined;
  setSpliceAmount(value: number): ListpeerchannelsChannelsInflight;

  hasOurFundingMsat(): boolean;
  clearOurFundingMsat(): void;
  getOurFundingMsat(): cln_primitives_pb.Amount | undefined;
  setOurFundingMsat(
    value?: cln_primitives_pb.Amount,
  ): ListpeerchannelsChannelsInflight;

  hasScratchTxid(): boolean;
  clearScratchTxid(): void;
  getScratchTxid(): Uint8Array | string;
  getScratchTxid_asU8(): Uint8Array;
  getScratchTxid_asB64(): string;
  setScratchTxid(value: Uint8Array | string): ListpeerchannelsChannelsInflight;

  serializeBinary(): Uint8Array;
  toObject(
    includeInstance?: boolean,
  ): ListpeerchannelsChannelsInflight.AsObject;
  static toObject(
    includeInstance: boolean,
    msg: ListpeerchannelsChannelsInflight,
  ): ListpeerchannelsChannelsInflight.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: ListpeerchannelsChannelsInflight,
    writer: jspb.BinaryWriter,
  ): void;
  static deserializeBinary(bytes: Uint8Array): ListpeerchannelsChannelsInflight;
  static deserializeBinaryFromReader(
    message: ListpeerchannelsChannelsInflight,
    reader: jspb.BinaryReader,
  ): ListpeerchannelsChannelsInflight;
}

export namespace ListpeerchannelsChannelsInflight {
  export type AsObject = {
    fundingTxid: Uint8Array | string;
    fundingOutnum?: number;
    feerate?: string;
    totalFundingMsat?: cln_primitives_pb.Amount.AsObject;
    spliceAmount?: number;
    ourFundingMsat?: cln_primitives_pb.Amount.AsObject;
    scratchTxid: Uint8Array | string;
  };
}

export class ListpeerchannelsChannelsFunding extends jspb.Message {
  hasPushedMsat(): boolean;
  clearPushedMsat(): void;
  getPushedMsat(): cln_primitives_pb.Amount | undefined;
  setPushedMsat(
    value?: cln_primitives_pb.Amount,
  ): ListpeerchannelsChannelsFunding;

  hasLocalFundsMsat(): boolean;
  clearLocalFundsMsat(): void;
  getLocalFundsMsat(): cln_primitives_pb.Amount | undefined;
  setLocalFundsMsat(
    value?: cln_primitives_pb.Amount,
  ): ListpeerchannelsChannelsFunding;

  hasRemoteFundsMsat(): boolean;
  clearRemoteFundsMsat(): void;
  getRemoteFundsMsat(): cln_primitives_pb.Amount | undefined;
  setRemoteFundsMsat(
    value?: cln_primitives_pb.Amount,
  ): ListpeerchannelsChannelsFunding;

  hasFeePaidMsat(): boolean;
  clearFeePaidMsat(): void;
  getFeePaidMsat(): cln_primitives_pb.Amount | undefined;
  setFeePaidMsat(
    value?: cln_primitives_pb.Amount,
  ): ListpeerchannelsChannelsFunding;

  hasFeeRcvdMsat(): boolean;
  clearFeeRcvdMsat(): void;
  getFeeRcvdMsat(): cln_primitives_pb.Amount | undefined;
  setFeeRcvdMsat(
    value?: cln_primitives_pb.Amount,
  ): ListpeerchannelsChannelsFunding;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ListpeerchannelsChannelsFunding.AsObject;
  static toObject(
    includeInstance: boolean,
    msg: ListpeerchannelsChannelsFunding,
  ): ListpeerchannelsChannelsFunding.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: ListpeerchannelsChannelsFunding,
    writer: jspb.BinaryWriter,
  ): void;
  static deserializeBinary(bytes: Uint8Array): ListpeerchannelsChannelsFunding;
  static deserializeBinaryFromReader(
    message: ListpeerchannelsChannelsFunding,
    reader: jspb.BinaryReader,
  ): ListpeerchannelsChannelsFunding;
}

export namespace ListpeerchannelsChannelsFunding {
  export type AsObject = {
    pushedMsat?: cln_primitives_pb.Amount.AsObject;
    localFundsMsat?: cln_primitives_pb.Amount.AsObject;
    remoteFundsMsat?: cln_primitives_pb.Amount.AsObject;
    feePaidMsat?: cln_primitives_pb.Amount.AsObject;
    feeRcvdMsat?: cln_primitives_pb.Amount.AsObject;
  };
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
  static toObject(
    includeInstance: boolean,
    msg: ListpeerchannelsChannelsAlias,
  ): ListpeerchannelsChannelsAlias.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: ListpeerchannelsChannelsAlias,
    writer: jspb.BinaryWriter,
  ): void;
  static deserializeBinary(bytes: Uint8Array): ListpeerchannelsChannelsAlias;
  static deserializeBinaryFromReader(
    message: ListpeerchannelsChannelsAlias,
    reader: jspb.BinaryReader,
  ): ListpeerchannelsChannelsAlias;
}

export namespace ListpeerchannelsChannelsAlias {
  export type AsObject = {
    local?: string;
    remote?: string;
  };
}

export class ListpeerchannelsChannelsHtlcs extends jspb.Message {
  hasDirection(): boolean;
  clearDirection(): void;
  getDirection():
    | ListpeerchannelsChannelsHtlcs.ListpeerchannelsChannelsHtlcsDirection
    | undefined;
  setDirection(
    value: ListpeerchannelsChannelsHtlcs.ListpeerchannelsChannelsHtlcsDirection,
  ): ListpeerchannelsChannelsHtlcs;

  hasId(): boolean;
  clearId(): void;
  getId(): number | undefined;
  setId(value: number): ListpeerchannelsChannelsHtlcs;

  hasAmountMsat(): boolean;
  clearAmountMsat(): void;
  getAmountMsat(): cln_primitives_pb.Amount | undefined;
  setAmountMsat(
    value?: cln_primitives_pb.Amount,
  ): ListpeerchannelsChannelsHtlcs;

  hasExpiry(): boolean;
  clearExpiry(): void;
  getExpiry(): number | undefined;
  setExpiry(value: number): ListpeerchannelsChannelsHtlcs;

  hasPaymentHash(): boolean;
  clearPaymentHash(): void;
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

  hasState(): boolean;
  clearState(): void;
  getState(): cln_primitives_pb.HtlcState | undefined;
  setState(value: cln_primitives_pb.HtlcState): ListpeerchannelsChannelsHtlcs;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ListpeerchannelsChannelsHtlcs.AsObject;
  static toObject(
    includeInstance: boolean,
    msg: ListpeerchannelsChannelsHtlcs,
  ): ListpeerchannelsChannelsHtlcs.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: ListpeerchannelsChannelsHtlcs,
    writer: jspb.BinaryWriter,
  ): void;
  static deserializeBinary(bytes: Uint8Array): ListpeerchannelsChannelsHtlcs;
  static deserializeBinaryFromReader(
    message: ListpeerchannelsChannelsHtlcs,
    reader: jspb.BinaryReader,
  ): ListpeerchannelsChannelsHtlcs;
}

export namespace ListpeerchannelsChannelsHtlcs {
  export type AsObject = {
    direction?: ListpeerchannelsChannelsHtlcs.ListpeerchannelsChannelsHtlcsDirection;
    id?: number;
    amountMsat?: cln_primitives_pb.Amount.AsObject;
    expiry?: number;
    paymentHash: Uint8Array | string;
    localTrimmed?: boolean;
    status?: string;
    state?: cln_primitives_pb.HtlcState;
  };

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
  static toObject(
    includeInstance: boolean,
    msg: ListclosedchannelsRequest,
  ): ListclosedchannelsRequest.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: ListclosedchannelsRequest,
    writer: jspb.BinaryWriter,
  ): void;
  static deserializeBinary(bytes: Uint8Array): ListclosedchannelsRequest;
  static deserializeBinaryFromReader(
    message: ListclosedchannelsRequest,
    reader: jspb.BinaryReader,
  ): ListclosedchannelsRequest;
}

export namespace ListclosedchannelsRequest {
  export type AsObject = {
    id: Uint8Array | string;
  };
}

export class ListclosedchannelsResponse extends jspb.Message {
  clearClosedchannelsList(): void;
  getClosedchannelsList(): Array<ListclosedchannelsClosedchannels>;
  setClosedchannelsList(
    value: Array<ListclosedchannelsClosedchannels>,
  ): ListclosedchannelsResponse;
  addClosedchannels(
    value?: ListclosedchannelsClosedchannels,
    index?: number,
  ): ListclosedchannelsClosedchannels;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ListclosedchannelsResponse.AsObject;
  static toObject(
    includeInstance: boolean,
    msg: ListclosedchannelsResponse,
  ): ListclosedchannelsResponse.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: ListclosedchannelsResponse,
    writer: jspb.BinaryWriter,
  ): void;
  static deserializeBinary(bytes: Uint8Array): ListclosedchannelsResponse;
  static deserializeBinaryFromReader(
    message: ListclosedchannelsResponse,
    reader: jspb.BinaryReader,
  ): ListclosedchannelsResponse;
}

export namespace ListclosedchannelsResponse {
  export type AsObject = {
    closedchannelsList: Array<ListclosedchannelsClosedchannels.AsObject>;
  };
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
  setAlias(
    value?: ListclosedchannelsClosedchannelsAlias,
  ): ListclosedchannelsClosedchannels;
  getOpener(): cln_primitives_pb.ChannelSide;
  setOpener(
    value: cln_primitives_pb.ChannelSide,
  ): ListclosedchannelsClosedchannels;

  hasCloser(): boolean;
  clearCloser(): void;
  getCloser(): cln_primitives_pb.ChannelSide | undefined;
  setCloser(
    value: cln_primitives_pb.ChannelSide,
  ): ListclosedchannelsClosedchannels;
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
  setFundingFeePaidMsat(
    value?: cln_primitives_pb.Amount,
  ): ListclosedchannelsClosedchannels;

  hasFundingFeeRcvdMsat(): boolean;
  clearFundingFeeRcvdMsat(): void;
  getFundingFeeRcvdMsat(): cln_primitives_pb.Amount | undefined;
  setFundingFeeRcvdMsat(
    value?: cln_primitives_pb.Amount,
  ): ListclosedchannelsClosedchannels;

  hasFundingPushedMsat(): boolean;
  clearFundingPushedMsat(): void;
  getFundingPushedMsat(): cln_primitives_pb.Amount | undefined;
  setFundingPushedMsat(
    value?: cln_primitives_pb.Amount,
  ): ListclosedchannelsClosedchannels;

  hasTotalMsat(): boolean;
  clearTotalMsat(): void;
  getTotalMsat(): cln_primitives_pb.Amount | undefined;
  setTotalMsat(
    value?: cln_primitives_pb.Amount,
  ): ListclosedchannelsClosedchannels;

  hasFinalToUsMsat(): boolean;
  clearFinalToUsMsat(): void;
  getFinalToUsMsat(): cln_primitives_pb.Amount | undefined;
  setFinalToUsMsat(
    value?: cln_primitives_pb.Amount,
  ): ListclosedchannelsClosedchannels;

  hasMinToUsMsat(): boolean;
  clearMinToUsMsat(): void;
  getMinToUsMsat(): cln_primitives_pb.Amount | undefined;
  setMinToUsMsat(
    value?: cln_primitives_pb.Amount,
  ): ListclosedchannelsClosedchannels;

  hasMaxToUsMsat(): boolean;
  clearMaxToUsMsat(): void;
  getMaxToUsMsat(): cln_primitives_pb.Amount | undefined;
  setMaxToUsMsat(
    value?: cln_primitives_pb.Amount,
  ): ListclosedchannelsClosedchannels;

  hasLastCommitmentTxid(): boolean;
  clearLastCommitmentTxid(): void;
  getLastCommitmentTxid(): Uint8Array | string;
  getLastCommitmentTxid_asU8(): Uint8Array;
  getLastCommitmentTxid_asB64(): string;
  setLastCommitmentTxid(
    value: Uint8Array | string,
  ): ListclosedchannelsClosedchannels;

  hasLastCommitmentFeeMsat(): boolean;
  clearLastCommitmentFeeMsat(): void;
  getLastCommitmentFeeMsat(): cln_primitives_pb.Amount | undefined;
  setLastCommitmentFeeMsat(
    value?: cln_primitives_pb.Amount,
  ): ListclosedchannelsClosedchannels;
  getCloseCause(): ListclosedchannelsClosedchannels.ListclosedchannelsClosedchannelsClose_cause;
  setCloseCause(
    value: ListclosedchannelsClosedchannels.ListclosedchannelsClosedchannelsClose_cause,
  ): ListclosedchannelsClosedchannels;

  serializeBinary(): Uint8Array;
  toObject(
    includeInstance?: boolean,
  ): ListclosedchannelsClosedchannels.AsObject;
  static toObject(
    includeInstance: boolean,
    msg: ListclosedchannelsClosedchannels,
  ): ListclosedchannelsClosedchannels.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: ListclosedchannelsClosedchannels,
    writer: jspb.BinaryWriter,
  ): void;
  static deserializeBinary(bytes: Uint8Array): ListclosedchannelsClosedchannels;
  static deserializeBinaryFromReader(
    message: ListclosedchannelsClosedchannels,
    reader: jspb.BinaryReader,
  ): ListclosedchannelsClosedchannels;
}

export namespace ListclosedchannelsClosedchannels {
  export type AsObject = {
    peerId: Uint8Array | string;
    channelId: Uint8Array | string;
    shortChannelId?: string;
    alias?: ListclosedchannelsClosedchannelsAlias.AsObject;
    opener: cln_primitives_pb.ChannelSide;
    closer?: cln_primitives_pb.ChannelSide;
    pb_private: boolean;
    totalLocalCommitments: number;
    totalRemoteCommitments: number;
    totalHtlcsSent: number;
    fundingTxid: Uint8Array | string;
    fundingOutnum: number;
    leased: boolean;
    fundingFeePaidMsat?: cln_primitives_pb.Amount.AsObject;
    fundingFeeRcvdMsat?: cln_primitives_pb.Amount.AsObject;
    fundingPushedMsat?: cln_primitives_pb.Amount.AsObject;
    totalMsat?: cln_primitives_pb.Amount.AsObject;
    finalToUsMsat?: cln_primitives_pb.Amount.AsObject;
    minToUsMsat?: cln_primitives_pb.Amount.AsObject;
    maxToUsMsat?: cln_primitives_pb.Amount.AsObject;
    lastCommitmentTxid: Uint8Array | string;
    lastCommitmentFeeMsat?: cln_primitives_pb.Amount.AsObject;
    closeCause: ListclosedchannelsClosedchannels.ListclosedchannelsClosedchannelsClose_cause;
  };

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
  toObject(
    includeInstance?: boolean,
  ): ListclosedchannelsClosedchannelsAlias.AsObject;
  static toObject(
    includeInstance: boolean,
    msg: ListclosedchannelsClosedchannelsAlias,
  ): ListclosedchannelsClosedchannelsAlias.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: ListclosedchannelsClosedchannelsAlias,
    writer: jspb.BinaryWriter,
  ): void;
  static deserializeBinary(
    bytes: Uint8Array,
  ): ListclosedchannelsClosedchannelsAlias;
  static deserializeBinaryFromReader(
    message: ListclosedchannelsClosedchannelsAlias,
    reader: jspb.BinaryReader,
  ): ListclosedchannelsClosedchannelsAlias;
}

export namespace ListclosedchannelsClosedchannelsAlias {
  export type AsObject = {
    local?: string;
    remote?: string;
  };
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
  static toObject(
    includeInstance: boolean,
    msg: DecodepayRequest,
  ): DecodepayRequest.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: DecodepayRequest,
    writer: jspb.BinaryWriter,
  ): void;
  static deserializeBinary(bytes: Uint8Array): DecodepayRequest;
  static deserializeBinaryFromReader(
    message: DecodepayRequest,
    reader: jspb.BinaryReader,
  ): DecodepayRequest;
}

export namespace DecodepayRequest {
  export type AsObject = {
    bolt11: string;
    description?: string;
  };
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

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): DecodepayResponse.AsObject;
  static toObject(
    includeInstance: boolean,
    msg: DecodepayResponse,
  ): DecodepayResponse.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: DecodepayResponse,
    writer: jspb.BinaryWriter,
  ): void;
  static deserializeBinary(bytes: Uint8Array): DecodepayResponse;
  static deserializeBinaryFromReader(
    message: DecodepayResponse,
    reader: jspb.BinaryReader,
  ): DecodepayResponse;
}

export namespace DecodepayResponse {
  export type AsObject = {
    currency: string;
    createdAt: number;
    expiry: number;
    payee: Uint8Array | string;
    amountMsat?: cln_primitives_pb.Amount.AsObject;
    paymentHash: Uint8Array | string;
    signature: string;
    description?: string;
    descriptionHash: Uint8Array | string;
    minFinalCltvExpiry: number;
    paymentSecret: Uint8Array | string;
    features: Uint8Array | string;
    paymentMetadata: Uint8Array | string;
    fallbacksList: Array<DecodepayFallbacks.AsObject>;
    extraList: Array<DecodepayExtra.AsObject>;
  };
}

export class DecodepayFallbacks extends jspb.Message {
  getItemType(): DecodepayFallbacks.DecodepayFallbacksType;
  setItemType(
    value: DecodepayFallbacks.DecodepayFallbacksType,
  ): DecodepayFallbacks;

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
  static toObject(
    includeInstance: boolean,
    msg: DecodepayFallbacks,
  ): DecodepayFallbacks.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: DecodepayFallbacks,
    writer: jspb.BinaryWriter,
  ): void;
  static deserializeBinary(bytes: Uint8Array): DecodepayFallbacks;
  static deserializeBinaryFromReader(
    message: DecodepayFallbacks,
    reader: jspb.BinaryReader,
  ): DecodepayFallbacks;
}

export namespace DecodepayFallbacks {
  export type AsObject = {
    itemType: DecodepayFallbacks.DecodepayFallbacksType;
    addr?: string;
    hex: Uint8Array | string;
  };

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
  static toObject(
    includeInstance: boolean,
    msg: DecodepayExtra,
  ): DecodepayExtra.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: DecodepayExtra,
    writer: jspb.BinaryWriter,
  ): void;
  static deserializeBinary(bytes: Uint8Array): DecodepayExtra;
  static deserializeBinaryFromReader(
    message: DecodepayExtra,
    reader: jspb.BinaryReader,
  ): DecodepayExtra;
}

export namespace DecodepayExtra {
  export type AsObject = {
    tag: string;
    data: string;
  };
}

export class DecodeRequest extends jspb.Message {
  getString(): string;
  setString(value: string): DecodeRequest;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): DecodeRequest.AsObject;
  static toObject(
    includeInstance: boolean,
    msg: DecodeRequest,
  ): DecodeRequest.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: DecodeRequest,
    writer: jspb.BinaryWriter,
  ): void;
  static deserializeBinary(bytes: Uint8Array): DecodeRequest;
  static deserializeBinaryFromReader(
    message: DecodeRequest,
    reader: jspb.BinaryReader,
  ): DecodeRequest;
}

export namespace DecodeRequest {
  export type AsObject = {
    string: string;
  };
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
  addOfferChains(
    value: Uint8Array | string,
    index?: number,
  ): Uint8Array | string;

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
  setInvoiceFallbacksList(
    value: Array<DecodeInvoice_fallbacks>,
  ): DecodeResponse;
  addInvoiceFallbacks(
    value?: DecodeInvoice_fallbacks,
    index?: number,
  ): DecodeInvoice_fallbacks;

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
  addRestrictions(
    value?: DecodeRestrictions,
    index?: number,
  ): DecodeRestrictions;

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

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): DecodeResponse.AsObject;
  static toObject(
    includeInstance: boolean,
    msg: DecodeResponse,
  ): DecodeResponse.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: DecodeResponse,
    writer: jspb.BinaryWriter,
  ): void;
  static deserializeBinary(bytes: Uint8Array): DecodeResponse;
  static deserializeBinaryFromReader(
    message: DecodeResponse,
    reader: jspb.BinaryReader,
  ): DecodeResponse;
}

export namespace DecodeResponse {
  export type AsObject = {
    itemType: DecodeResponse.DecodeType;
    valid: boolean;
    offerId: Uint8Array | string;
    offerChainsList: Array<Uint8Array | string>;
    offerMetadata: Uint8Array | string;
    offerCurrency?: string;
    warningUnknownOfferCurrency?: string;
    currencyMinorUnit?: number;
    offerAmount?: number;
    offerAmountMsat?: cln_primitives_pb.Amount.AsObject;
    offerDescription?: string;
    offerIssuer?: string;
    offerFeatures: Uint8Array | string;
    offerAbsoluteExpiry?: number;
    offerQuantityMax?: number;
    offerPathsList: Array<DecodeOffer_paths.AsObject>;
    offerNodeId: Uint8Array | string;
    warningMissingOfferNodeId?: string;
    warningInvalidOfferDescription?: string;
    warningMissingOfferDescription?: string;
    warningInvalidOfferCurrency?: string;
    warningInvalidOfferIssuer?: string;
    invreqMetadata: Uint8Array | string;
    invreqPayerId: Uint8Array | string;
    invreqChain: Uint8Array | string;
    invreqAmountMsat?: cln_primitives_pb.Amount.AsObject;
    invreqFeatures: Uint8Array | string;
    invreqQuantity?: number;
    invreqPayerNote?: string;
    invreqRecurrenceCounter?: number;
    invreqRecurrenceStart?: number;
    warningMissingInvreqMetadata?: string;
    warningMissingInvreqPayerId?: string;
    warningInvalidInvreqPayerNote?: string;
    warningMissingInvoiceRequestSignature?: string;
    warningInvalidInvoiceRequestSignature?: string;
    invoiceCreatedAt?: number;
    invoiceRelativeExpiry?: number;
    invoicePaymentHash: Uint8Array | string;
    invoiceAmountMsat?: cln_primitives_pb.Amount.AsObject;
    invoiceFallbacksList: Array<DecodeInvoice_fallbacks.AsObject>;
    invoiceFeatures: Uint8Array | string;
    invoiceNodeId: Uint8Array | string;
    invoiceRecurrenceBasetime?: number;
    warningMissingInvoicePaths?: string;
    warningMissingInvoiceBlindedpay?: string;
    warningMissingInvoiceCreatedAt?: string;
    warningMissingInvoicePaymentHash?: string;
    warningMissingInvoiceAmount?: string;
    warningMissingInvoiceRecurrenceBasetime?: string;
    warningMissingInvoiceNodeId?: string;
    warningMissingInvoiceSignature?: string;
    warningInvalidInvoiceSignature?: string;
    fallbacksList: Array<DecodeFallbacks.AsObject>;
    createdAt?: number;
    expiry?: number;
    payee: Uint8Array | string;
    paymentHash: Uint8Array | string;
    descriptionHash: Uint8Array | string;
    minFinalCltvExpiry?: number;
    paymentSecret: Uint8Array | string;
    paymentMetadata: Uint8Array | string;
    extraList: Array<DecodeExtra.AsObject>;
    uniqueId?: string;
    version?: string;
    string?: string;
    restrictionsList: Array<DecodeRestrictions.AsObject>;
    warningRuneInvalidUtf8?: string;
    hex: Uint8Array | string;
    decrypted: Uint8Array | string;
  };

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
  getFirstNodeId(): Uint8Array | string;
  getFirstNodeId_asU8(): Uint8Array;
  getFirstNodeId_asB64(): string;
  setFirstNodeId(value: Uint8Array | string): DecodeOffer_paths;
  getBlinding(): Uint8Array | string;
  getBlinding_asU8(): Uint8Array;
  getBlinding_asB64(): string;
  setBlinding(value: Uint8Array | string): DecodeOffer_paths;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): DecodeOffer_paths.AsObject;
  static toObject(
    includeInstance: boolean,
    msg: DecodeOffer_paths,
  ): DecodeOffer_paths.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: DecodeOffer_paths,
    writer: jspb.BinaryWriter,
  ): void;
  static deserializeBinary(bytes: Uint8Array): DecodeOffer_paths;
  static deserializeBinaryFromReader(
    message: DecodeOffer_paths,
    reader: jspb.BinaryReader,
  ): DecodeOffer_paths;
}

export namespace DecodeOffer_paths {
  export type AsObject = {
    firstNodeId: Uint8Array | string;
    blinding: Uint8Array | string;
  };
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
  static toObject(
    includeInstance: boolean,
    msg: DecodeOffer_recurrencePaywindow,
  ): DecodeOffer_recurrencePaywindow.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: DecodeOffer_recurrencePaywindow,
    writer: jspb.BinaryWriter,
  ): void;
  static deserializeBinary(bytes: Uint8Array): DecodeOffer_recurrencePaywindow;
  static deserializeBinaryFromReader(
    message: DecodeOffer_recurrencePaywindow,
    reader: jspb.BinaryReader,
  ): DecodeOffer_recurrencePaywindow;
}

export namespace DecodeOffer_recurrencePaywindow {
  export type AsObject = {
    secondsBefore: number;
    secondsAfter: number;
    proportionalAmount?: boolean;
  };
}

export class DecodeInvoice_pathsPath extends jspb.Message {
  getBlindedNodeId(): Uint8Array | string;
  getBlindedNodeId_asU8(): Uint8Array;
  getBlindedNodeId_asB64(): string;
  setBlindedNodeId(value: Uint8Array | string): DecodeInvoice_pathsPath;
  getEncryptedRecipientData(): Uint8Array | string;
  getEncryptedRecipientData_asU8(): Uint8Array;
  getEncryptedRecipientData_asB64(): string;
  setEncryptedRecipientData(
    value: Uint8Array | string,
  ): DecodeInvoice_pathsPath;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): DecodeInvoice_pathsPath.AsObject;
  static toObject(
    includeInstance: boolean,
    msg: DecodeInvoice_pathsPath,
  ): DecodeInvoice_pathsPath.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: DecodeInvoice_pathsPath,
    writer: jspb.BinaryWriter,
  ): void;
  static deserializeBinary(bytes: Uint8Array): DecodeInvoice_pathsPath;
  static deserializeBinaryFromReader(
    message: DecodeInvoice_pathsPath,
    reader: jspb.BinaryReader,
  ): DecodeInvoice_pathsPath;
}

export namespace DecodeInvoice_pathsPath {
  export type AsObject = {
    blindedNodeId: Uint8Array | string;
    encryptedRecipientData: Uint8Array | string;
  };
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
  static toObject(
    includeInstance: boolean,
    msg: DecodeInvoice_fallbacks,
  ): DecodeInvoice_fallbacks.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: DecodeInvoice_fallbacks,
    writer: jspb.BinaryWriter,
  ): void;
  static deserializeBinary(bytes: Uint8Array): DecodeInvoice_fallbacks;
  static deserializeBinaryFromReader(
    message: DecodeInvoice_fallbacks,
    reader: jspb.BinaryReader,
  ): DecodeInvoice_fallbacks;
}

export namespace DecodeInvoice_fallbacks {
  export type AsObject = {
    version: number;
    hex: Uint8Array | string;
    address?: string;
  };
}

export class DecodeFallbacks extends jspb.Message {
  hasWarningInvoiceFallbacksVersionInvalid(): boolean;
  clearWarningInvoiceFallbacksVersionInvalid(): void;
  getWarningInvoiceFallbacksVersionInvalid(): string | undefined;
  setWarningInvoiceFallbacksVersionInvalid(value: string): DecodeFallbacks;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): DecodeFallbacks.AsObject;
  static toObject(
    includeInstance: boolean,
    msg: DecodeFallbacks,
  ): DecodeFallbacks.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: DecodeFallbacks,
    writer: jspb.BinaryWriter,
  ): void;
  static deserializeBinary(bytes: Uint8Array): DecodeFallbacks;
  static deserializeBinaryFromReader(
    message: DecodeFallbacks,
    reader: jspb.BinaryReader,
  ): DecodeFallbacks;
}

export namespace DecodeFallbacks {
  export type AsObject = {
    warningInvoiceFallbacksVersionInvalid?: string;
  };
}

export class DecodeExtra extends jspb.Message {
  getTag(): string;
  setTag(value: string): DecodeExtra;
  getData(): string;
  setData(value: string): DecodeExtra;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): DecodeExtra.AsObject;
  static toObject(
    includeInstance: boolean,
    msg: DecodeExtra,
  ): DecodeExtra.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: DecodeExtra,
    writer: jspb.BinaryWriter,
  ): void;
  static deserializeBinary(bytes: Uint8Array): DecodeExtra;
  static deserializeBinaryFromReader(
    message: DecodeExtra,
    reader: jspb.BinaryReader,
  ): DecodeExtra;
}

export namespace DecodeExtra {
  export type AsObject = {
    tag: string;
    data: string;
  };
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
  static toObject(
    includeInstance: boolean,
    msg: DecodeRestrictions,
  ): DecodeRestrictions.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: DecodeRestrictions,
    writer: jspb.BinaryWriter,
  ): void;
  static deserializeBinary(bytes: Uint8Array): DecodeRestrictions;
  static deserializeBinaryFromReader(
    message: DecodeRestrictions,
    reader: jspb.BinaryReader,
  ): DecodeRestrictions;
}

export namespace DecodeRestrictions {
  export type AsObject = {
    alternativesList: Array<string>;
    summary: string;
  };
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
  static toObject(
    includeInstance: boolean,
    msg: DisconnectRequest,
  ): DisconnectRequest.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: DisconnectRequest,
    writer: jspb.BinaryWriter,
  ): void;
  static deserializeBinary(bytes: Uint8Array): DisconnectRequest;
  static deserializeBinaryFromReader(
    message: DisconnectRequest,
    reader: jspb.BinaryReader,
  ): DisconnectRequest;
}

export namespace DisconnectRequest {
  export type AsObject = {
    id: Uint8Array | string;
    force?: boolean;
  };
}

export class DisconnectResponse extends jspb.Message {
  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): DisconnectResponse.AsObject;
  static toObject(
    includeInstance: boolean,
    msg: DisconnectResponse,
  ): DisconnectResponse.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: DisconnectResponse,
    writer: jspb.BinaryWriter,
  ): void;
  static deserializeBinary(bytes: Uint8Array): DisconnectResponse;
  static deserializeBinaryFromReader(
    message: DisconnectResponse,
    reader: jspb.BinaryReader,
  ): DisconnectResponse;
}

export namespace DisconnectResponse {
  export type AsObject = {};
}

export class FeeratesRequest extends jspb.Message {
  getStyle(): FeeratesRequest.FeeratesStyle;
  setStyle(value: FeeratesRequest.FeeratesStyle): FeeratesRequest;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): FeeratesRequest.AsObject;
  static toObject(
    includeInstance: boolean,
    msg: FeeratesRequest,
  ): FeeratesRequest.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: FeeratesRequest,
    writer: jspb.BinaryWriter,
  ): void;
  static deserializeBinary(bytes: Uint8Array): FeeratesRequest;
  static deserializeBinaryFromReader(
    message: FeeratesRequest,
    reader: jspb.BinaryReader,
  ): FeeratesRequest;
}

export namespace FeeratesRequest {
  export type AsObject = {
    style: FeeratesRequest.FeeratesStyle;
  };

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
  setOnchainFeeEstimates(
    value?: FeeratesOnchain_fee_estimates,
  ): FeeratesResponse;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): FeeratesResponse.AsObject;
  static toObject(
    includeInstance: boolean,
    msg: FeeratesResponse,
  ): FeeratesResponse.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: FeeratesResponse,
    writer: jspb.BinaryWriter,
  ): void;
  static deserializeBinary(bytes: Uint8Array): FeeratesResponse;
  static deserializeBinaryFromReader(
    message: FeeratesResponse,
    reader: jspb.BinaryReader,
  ): FeeratesResponse;
}

export namespace FeeratesResponse {
  export type AsObject = {
    warningMissingFeerates?: string;
    perkb?: FeeratesPerkb.AsObject;
    perkw?: FeeratesPerkw.AsObject;
    onchainFeeEstimates?: FeeratesOnchain_fee_estimates.AsObject;
  };
}

export class FeeratesPerkb extends jspb.Message {
  getMinAcceptable(): number;
  setMinAcceptable(value: number): FeeratesPerkb;
  getMaxAcceptable(): number;
  setMaxAcceptable(value: number): FeeratesPerkb;

  hasFloor(): boolean;
  clearFloor(): void;
  getFloor(): number | undefined;
  setFloor(value: number): FeeratesPerkb;
  clearEstimatesList(): void;
  getEstimatesList(): Array<FeeratesPerkbEstimates>;
  setEstimatesList(value: Array<FeeratesPerkbEstimates>): FeeratesPerkb;
  addEstimates(
    value?: FeeratesPerkbEstimates,
    index?: number,
  ): FeeratesPerkbEstimates;

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

  hasUnilateralAnchorClose(): boolean;
  clearUnilateralAnchorClose(): void;
  getUnilateralAnchorClose(): number | undefined;
  setUnilateralAnchorClose(value: number): FeeratesPerkb;

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

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): FeeratesPerkb.AsObject;
  static toObject(
    includeInstance: boolean,
    msg: FeeratesPerkb,
  ): FeeratesPerkb.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: FeeratesPerkb,
    writer: jspb.BinaryWriter,
  ): void;
  static deserializeBinary(bytes: Uint8Array): FeeratesPerkb;
  static deserializeBinaryFromReader(
    message: FeeratesPerkb,
    reader: jspb.BinaryReader,
  ): FeeratesPerkb;
}

export namespace FeeratesPerkb {
  export type AsObject = {
    minAcceptable: number;
    maxAcceptable: number;
    floor?: number;
    estimatesList: Array<FeeratesPerkbEstimates.AsObject>;
    opening?: number;
    mutualClose?: number;
    unilateralClose?: number;
    unilateralAnchorClose?: number;
    delayedToUs?: number;
    htlcResolution?: number;
    penalty?: number;
  };
}

export class FeeratesPerkbEstimates extends jspb.Message {
  hasBlockcount(): boolean;
  clearBlockcount(): void;
  getBlockcount(): number | undefined;
  setBlockcount(value: number): FeeratesPerkbEstimates;

  hasFeerate(): boolean;
  clearFeerate(): void;
  getFeerate(): number | undefined;
  setFeerate(value: number): FeeratesPerkbEstimates;

  hasSmoothedFeerate(): boolean;
  clearSmoothedFeerate(): void;
  getSmoothedFeerate(): number | undefined;
  setSmoothedFeerate(value: number): FeeratesPerkbEstimates;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): FeeratesPerkbEstimates.AsObject;
  static toObject(
    includeInstance: boolean,
    msg: FeeratesPerkbEstimates,
  ): FeeratesPerkbEstimates.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: FeeratesPerkbEstimates,
    writer: jspb.BinaryWriter,
  ): void;
  static deserializeBinary(bytes: Uint8Array): FeeratesPerkbEstimates;
  static deserializeBinaryFromReader(
    message: FeeratesPerkbEstimates,
    reader: jspb.BinaryReader,
  ): FeeratesPerkbEstimates;
}

export namespace FeeratesPerkbEstimates {
  export type AsObject = {
    blockcount?: number;
    feerate?: number;
    smoothedFeerate?: number;
  };
}

export class FeeratesPerkw extends jspb.Message {
  getMinAcceptable(): number;
  setMinAcceptable(value: number): FeeratesPerkw;
  getMaxAcceptable(): number;
  setMaxAcceptable(value: number): FeeratesPerkw;

  hasFloor(): boolean;
  clearFloor(): void;
  getFloor(): number | undefined;
  setFloor(value: number): FeeratesPerkw;
  clearEstimatesList(): void;
  getEstimatesList(): Array<FeeratesPerkwEstimates>;
  setEstimatesList(value: Array<FeeratesPerkwEstimates>): FeeratesPerkw;
  addEstimates(
    value?: FeeratesPerkwEstimates,
    index?: number,
  ): FeeratesPerkwEstimates;

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

  hasUnilateralAnchorClose(): boolean;
  clearUnilateralAnchorClose(): void;
  getUnilateralAnchorClose(): number | undefined;
  setUnilateralAnchorClose(value: number): FeeratesPerkw;

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

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): FeeratesPerkw.AsObject;
  static toObject(
    includeInstance: boolean,
    msg: FeeratesPerkw,
  ): FeeratesPerkw.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: FeeratesPerkw,
    writer: jspb.BinaryWriter,
  ): void;
  static deserializeBinary(bytes: Uint8Array): FeeratesPerkw;
  static deserializeBinaryFromReader(
    message: FeeratesPerkw,
    reader: jspb.BinaryReader,
  ): FeeratesPerkw;
}

export namespace FeeratesPerkw {
  export type AsObject = {
    minAcceptable: number;
    maxAcceptable: number;
    floor?: number;
    estimatesList: Array<FeeratesPerkwEstimates.AsObject>;
    opening?: number;
    mutualClose?: number;
    unilateralClose?: number;
    unilateralAnchorClose?: number;
    delayedToUs?: number;
    htlcResolution?: number;
    penalty?: number;
  };
}

export class FeeratesPerkwEstimates extends jspb.Message {
  hasBlockcount(): boolean;
  clearBlockcount(): void;
  getBlockcount(): number | undefined;
  setBlockcount(value: number): FeeratesPerkwEstimates;

  hasFeerate(): boolean;
  clearFeerate(): void;
  getFeerate(): number | undefined;
  setFeerate(value: number): FeeratesPerkwEstimates;

  hasSmoothedFeerate(): boolean;
  clearSmoothedFeerate(): void;
  getSmoothedFeerate(): number | undefined;
  setSmoothedFeerate(value: number): FeeratesPerkwEstimates;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): FeeratesPerkwEstimates.AsObject;
  static toObject(
    includeInstance: boolean,
    msg: FeeratesPerkwEstimates,
  ): FeeratesPerkwEstimates.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: FeeratesPerkwEstimates,
    writer: jspb.BinaryWriter,
  ): void;
  static deserializeBinary(bytes: Uint8Array): FeeratesPerkwEstimates;
  static deserializeBinaryFromReader(
    message: FeeratesPerkwEstimates,
    reader: jspb.BinaryReader,
  ): FeeratesPerkwEstimates;
}

export namespace FeeratesPerkwEstimates {
  export type AsObject = {
    blockcount?: number;
    feerate?: number;
    smoothedFeerate?: number;
  };
}

export class FeeratesOnchain_fee_estimates extends jspb.Message {
  getOpeningChannelSatoshis(): number;
  setOpeningChannelSatoshis(value: number): FeeratesOnchain_fee_estimates;
  getMutualCloseSatoshis(): number;
  setMutualCloseSatoshis(value: number): FeeratesOnchain_fee_estimates;
  getUnilateralCloseSatoshis(): number;
  setUnilateralCloseSatoshis(value: number): FeeratesOnchain_fee_estimates;

  hasUnilateralCloseNonanchorSatoshis(): boolean;
  clearUnilateralCloseNonanchorSatoshis(): void;
  getUnilateralCloseNonanchorSatoshis(): number | undefined;
  setUnilateralCloseNonanchorSatoshis(
    value: number,
  ): FeeratesOnchain_fee_estimates;
  getHtlcTimeoutSatoshis(): number;
  setHtlcTimeoutSatoshis(value: number): FeeratesOnchain_fee_estimates;
  getHtlcSuccessSatoshis(): number;
  setHtlcSuccessSatoshis(value: number): FeeratesOnchain_fee_estimates;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): FeeratesOnchain_fee_estimates.AsObject;
  static toObject(
    includeInstance: boolean,
    msg: FeeratesOnchain_fee_estimates,
  ): FeeratesOnchain_fee_estimates.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: FeeratesOnchain_fee_estimates,
    writer: jspb.BinaryWriter,
  ): void;
  static deserializeBinary(bytes: Uint8Array): FeeratesOnchain_fee_estimates;
  static deserializeBinaryFromReader(
    message: FeeratesOnchain_fee_estimates,
    reader: jspb.BinaryReader,
  ): FeeratesOnchain_fee_estimates;
}

export namespace FeeratesOnchain_fee_estimates {
  export type AsObject = {
    openingChannelSatoshis: number;
    mutualCloseSatoshis: number;
    unilateralCloseSatoshis: number;
    unilateralCloseNonanchorSatoshis?: number;
    htlcTimeoutSatoshis: number;
    htlcSuccessSatoshis: number;
  };
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

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): FetchinvoiceRequest.AsObject;
  static toObject(
    includeInstance: boolean,
    msg: FetchinvoiceRequest,
  ): FetchinvoiceRequest.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: FetchinvoiceRequest,
    writer: jspb.BinaryWriter,
  ): void;
  static deserializeBinary(bytes: Uint8Array): FetchinvoiceRequest;
  static deserializeBinaryFromReader(
    message: FetchinvoiceRequest,
    reader: jspb.BinaryReader,
  ): FetchinvoiceRequest;
}

export namespace FetchinvoiceRequest {
  export type AsObject = {
    offer: string;
    amountMsat?: cln_primitives_pb.Amount.AsObject;
    quantity?: number;
    recurrenceCounter?: number;
    recurrenceStart?: number;
    recurrenceLabel?: string;
    timeout?: number;
    payerNote?: string;
  };
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
  static toObject(
    includeInstance: boolean,
    msg: FetchinvoiceResponse,
  ): FetchinvoiceResponse.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: FetchinvoiceResponse,
    writer: jspb.BinaryWriter,
  ): void;
  static deserializeBinary(bytes: Uint8Array): FetchinvoiceResponse;
  static deserializeBinaryFromReader(
    message: FetchinvoiceResponse,
    reader: jspb.BinaryReader,
  ): FetchinvoiceResponse;
}

export namespace FetchinvoiceResponse {
  export type AsObject = {
    invoice: string;
    changes?: FetchinvoiceChanges.AsObject;
    nextPeriod?: FetchinvoiceNext_period.AsObject;
  };
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
  static toObject(
    includeInstance: boolean,
    msg: FetchinvoiceChanges,
  ): FetchinvoiceChanges.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: FetchinvoiceChanges,
    writer: jspb.BinaryWriter,
  ): void;
  static deserializeBinary(bytes: Uint8Array): FetchinvoiceChanges;
  static deserializeBinaryFromReader(
    message: FetchinvoiceChanges,
    reader: jspb.BinaryReader,
  ): FetchinvoiceChanges;
}

export namespace FetchinvoiceChanges {
  export type AsObject = {
    descriptionAppended?: string;
    description?: string;
    vendorRemoved?: string;
    vendor?: string;
    amountMsat?: cln_primitives_pb.Amount.AsObject;
  };
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
  static toObject(
    includeInstance: boolean,
    msg: FetchinvoiceNext_period,
  ): FetchinvoiceNext_period.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: FetchinvoiceNext_period,
    writer: jspb.BinaryWriter,
  ): void;
  static deserializeBinary(bytes: Uint8Array): FetchinvoiceNext_period;
  static deserializeBinaryFromReader(
    message: FetchinvoiceNext_period,
    reader: jspb.BinaryReader,
  ): FetchinvoiceNext_period;
}

export namespace FetchinvoiceNext_period {
  export type AsObject = {
    counter: number;
    starttime: number;
    endtime: number;
    paywindowStart: number;
    paywindowEnd: number;
  };
}

export class FundchannelRequest extends jspb.Message {
  getId(): Uint8Array | string;
  getId_asU8(): Uint8Array;
  getId_asB64(): string;
  setId(value: Uint8Array | string): FundchannelRequest;

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

  hasMinconf(): boolean;
  clearMinconf(): void;
  getMinconf(): number | undefined;
  setMinconf(value: number): FundchannelRequest;

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
  clearUtxosList(): void;
  getUtxosList(): Array<cln_primitives_pb.Outpoint>;
  setUtxosList(value: Array<cln_primitives_pb.Outpoint>): FundchannelRequest;
  addUtxos(
    value?: cln_primitives_pb.Outpoint,
    index?: number,
  ): cln_primitives_pb.Outpoint;

  hasMindepth(): boolean;
  clearMindepth(): void;
  getMindepth(): number | undefined;
  setMindepth(value: number): FundchannelRequest;

  hasReserve(): boolean;
  clearReserve(): void;
  getReserve(): cln_primitives_pb.Amount | undefined;
  setReserve(value?: cln_primitives_pb.Amount): FundchannelRequest;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): FundchannelRequest.AsObject;
  static toObject(
    includeInstance: boolean,
    msg: FundchannelRequest,
  ): FundchannelRequest.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: FundchannelRequest,
    writer: jspb.BinaryWriter,
  ): void;
  static deserializeBinary(bytes: Uint8Array): FundchannelRequest;
  static deserializeBinaryFromReader(
    message: FundchannelRequest,
    reader: jspb.BinaryReader,
  ): FundchannelRequest;
}

export namespace FundchannelRequest {
  export type AsObject = {
    id: Uint8Array | string;
    amount?: cln_primitives_pb.AmountOrAll.AsObject;
    feerate?: cln_primitives_pb.Feerate.AsObject;
    announce?: boolean;
    minconf?: number;
    pushMsat?: cln_primitives_pb.Amount.AsObject;
    closeTo?: string;
    requestAmt?: cln_primitives_pb.Amount.AsObject;
    compactLease?: string;
    utxosList: Array<cln_primitives_pb.Outpoint.AsObject>;
    mindepth?: number;
    reserve?: cln_primitives_pb.Amount.AsObject;
  };
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

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): FundchannelResponse.AsObject;
  static toObject(
    includeInstance: boolean,
    msg: FundchannelResponse,
  ): FundchannelResponse.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: FundchannelResponse,
    writer: jspb.BinaryWriter,
  ): void;
  static deserializeBinary(bytes: Uint8Array): FundchannelResponse;
  static deserializeBinaryFromReader(
    message: FundchannelResponse,
    reader: jspb.BinaryReader,
  ): FundchannelResponse;
}

export namespace FundchannelResponse {
  export type AsObject = {
    tx: Uint8Array | string;
    txid: Uint8Array | string;
    outnum: number;
    channelId: Uint8Array | string;
    closeTo: Uint8Array | string;
    mindepth?: number;
  };
}

export class GetrouteRequest extends jspb.Message {
  getId(): Uint8Array | string;
  getId_asU8(): Uint8Array;
  getId_asB64(): string;
  setId(value: Uint8Array | string): GetrouteRequest;

  hasAmountMsat(): boolean;
  clearAmountMsat(): void;
  getAmountMsat(): cln_primitives_pb.Amount | undefined;
  setAmountMsat(value?: cln_primitives_pb.Amount): GetrouteRequest;
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

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): GetrouteRequest.AsObject;
  static toObject(
    includeInstance: boolean,
    msg: GetrouteRequest,
  ): GetrouteRequest.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: GetrouteRequest,
    writer: jspb.BinaryWriter,
  ): void;
  static deserializeBinary(bytes: Uint8Array): GetrouteRequest;
  static deserializeBinaryFromReader(
    message: GetrouteRequest,
    reader: jspb.BinaryReader,
  ): GetrouteRequest;
}

export namespace GetrouteRequest {
  export type AsObject = {
    id: Uint8Array | string;
    amountMsat?: cln_primitives_pb.Amount.AsObject;
    riskfactor: number;
    cltv?: number;
    fromid: Uint8Array | string;
    fuzzpercent?: number;
    excludeList: Array<string>;
    maxhops?: number;
  };
}

export class GetrouteResponse extends jspb.Message {
  clearRouteList(): void;
  getRouteList(): Array<GetrouteRoute>;
  setRouteList(value: Array<GetrouteRoute>): GetrouteResponse;
  addRoute(value?: GetrouteRoute, index?: number): GetrouteRoute;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): GetrouteResponse.AsObject;
  static toObject(
    includeInstance: boolean,
    msg: GetrouteResponse,
  ): GetrouteResponse.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: GetrouteResponse,
    writer: jspb.BinaryWriter,
  ): void;
  static deserializeBinary(bytes: Uint8Array): GetrouteResponse;
  static deserializeBinaryFromReader(
    message: GetrouteResponse,
    reader: jspb.BinaryReader,
  ): GetrouteResponse;
}

export namespace GetrouteResponse {
  export type AsObject = {
    routeList: Array<GetrouteRoute.AsObject>;
  };
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
  static toObject(
    includeInstance: boolean,
    msg: GetrouteRoute,
  ): GetrouteRoute.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: GetrouteRoute,
    writer: jspb.BinaryWriter,
  ): void;
  static deserializeBinary(bytes: Uint8Array): GetrouteRoute;
  static deserializeBinaryFromReader(
    message: GetrouteRoute,
    reader: jspb.BinaryReader,
  ): GetrouteRoute;
}

export namespace GetrouteRoute {
  export type AsObject = {
    id: Uint8Array | string;
    channel: string;
    direction: number;
    amountMsat?: cln_primitives_pb.Amount.AsObject;
    delay: number;
    style: GetrouteRoute.GetrouteRouteStyle;
  };

  export enum GetrouteRouteStyle {
    TLV = 0,
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
  static toObject(
    includeInstance: boolean,
    msg: ListforwardsRequest,
  ): ListforwardsRequest.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: ListforwardsRequest,
    writer: jspb.BinaryWriter,
  ): void;
  static deserializeBinary(bytes: Uint8Array): ListforwardsRequest;
  static deserializeBinaryFromReader(
    message: ListforwardsRequest,
    reader: jspb.BinaryReader,
  ): ListforwardsRequest;
}

export namespace ListforwardsRequest {
  export type AsObject = {
    status?: ListforwardsRequest.ListforwardsStatus;
    inChannel?: string;
    outChannel?: string;
    index?: ListforwardsRequest.ListforwardsIndex;
    start?: number;
    limit?: number;
  };

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
  addForwards(
    value?: ListforwardsForwards,
    index?: number,
  ): ListforwardsForwards;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ListforwardsResponse.AsObject;
  static toObject(
    includeInstance: boolean,
    msg: ListforwardsResponse,
  ): ListforwardsResponse.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: ListforwardsResponse,
    writer: jspb.BinaryWriter,
  ): void;
  static deserializeBinary(bytes: Uint8Array): ListforwardsResponse;
  static deserializeBinaryFromReader(
    message: ListforwardsResponse,
    reader: jspb.BinaryReader,
  ): ListforwardsResponse;
}

export namespace ListforwardsResponse {
  export type AsObject = {
    forwardsList: Array<ListforwardsForwards.AsObject>;
  };
}

export class ListforwardsForwards extends jspb.Message {
  hasCreatedIndex(): boolean;
  clearCreatedIndex(): void;
  getCreatedIndex(): number | undefined;
  setCreatedIndex(value: number): ListforwardsForwards;
  getInChannel(): string;
  setInChannel(value: string): ListforwardsForwards;

  hasInHtlcId(): boolean;
  clearInHtlcId(): void;
  getInHtlcId(): number | undefined;
  setInHtlcId(value: number): ListforwardsForwards;

  hasInMsat(): boolean;
  clearInMsat(): void;
  getInMsat(): cln_primitives_pb.Amount | undefined;
  setInMsat(value?: cln_primitives_pb.Amount): ListforwardsForwards;
  getStatus(): ListforwardsForwards.ListforwardsForwardsStatus;
  setStatus(
    value: ListforwardsForwards.ListforwardsForwardsStatus,
  ): ListforwardsForwards;
  getReceivedTime(): number;
  setReceivedTime(value: number): ListforwardsForwards;

  hasOutChannel(): boolean;
  clearOutChannel(): void;
  getOutChannel(): string | undefined;
  setOutChannel(value: string): ListforwardsForwards;

  hasOutHtlcId(): boolean;
  clearOutHtlcId(): void;
  getOutHtlcId(): number | undefined;
  setOutHtlcId(value: number): ListforwardsForwards;

  hasUpdatedIndex(): boolean;
  clearUpdatedIndex(): void;
  getUpdatedIndex(): number | undefined;
  setUpdatedIndex(value: number): ListforwardsForwards;

  hasStyle(): boolean;
  clearStyle(): void;
  getStyle(): ListforwardsForwards.ListforwardsForwardsStyle | undefined;
  setStyle(
    value: ListforwardsForwards.ListforwardsForwardsStyle,
  ): ListforwardsForwards;

  hasFeeMsat(): boolean;
  clearFeeMsat(): void;
  getFeeMsat(): cln_primitives_pb.Amount | undefined;
  setFeeMsat(value?: cln_primitives_pb.Amount): ListforwardsForwards;

  hasOutMsat(): boolean;
  clearOutMsat(): void;
  getOutMsat(): cln_primitives_pb.Amount | undefined;
  setOutMsat(value?: cln_primitives_pb.Amount): ListforwardsForwards;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ListforwardsForwards.AsObject;
  static toObject(
    includeInstance: boolean,
    msg: ListforwardsForwards,
  ): ListforwardsForwards.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: ListforwardsForwards,
    writer: jspb.BinaryWriter,
  ): void;
  static deserializeBinary(bytes: Uint8Array): ListforwardsForwards;
  static deserializeBinaryFromReader(
    message: ListforwardsForwards,
    reader: jspb.BinaryReader,
  ): ListforwardsForwards;
}

export namespace ListforwardsForwards {
  export type AsObject = {
    createdIndex?: number;
    inChannel: string;
    inHtlcId?: number;
    inMsat?: cln_primitives_pb.Amount.AsObject;
    status: ListforwardsForwards.ListforwardsForwardsStatus;
    receivedTime: number;
    outChannel?: string;
    outHtlcId?: number;
    updatedIndex?: number;
    style?: ListforwardsForwards.ListforwardsForwardsStyle;
    feeMsat?: cln_primitives_pb.Amount.AsObject;
    outMsat?: cln_primitives_pb.Amount.AsObject;
  };

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

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ListpaysRequest.AsObject;
  static toObject(
    includeInstance: boolean,
    msg: ListpaysRequest,
  ): ListpaysRequest.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: ListpaysRequest,
    writer: jspb.BinaryWriter,
  ): void;
  static deserializeBinary(bytes: Uint8Array): ListpaysRequest;
  static deserializeBinaryFromReader(
    message: ListpaysRequest,
    reader: jspb.BinaryReader,
  ): ListpaysRequest;
}

export namespace ListpaysRequest {
  export type AsObject = {
    bolt11?: string;
    paymentHash: Uint8Array | string;
    status?: ListpaysRequest.ListpaysStatus;
  };

  export enum ListpaysStatus {
    PENDING = 0,
    COMPLETE = 1,
    FAILED = 2,
  }
}

export class ListpaysResponse extends jspb.Message {
  clearPaysList(): void;
  getPaysList(): Array<ListpaysPays>;
  setPaysList(value: Array<ListpaysPays>): ListpaysResponse;
  addPays(value?: ListpaysPays, index?: number): ListpaysPays;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ListpaysResponse.AsObject;
  static toObject(
    includeInstance: boolean,
    msg: ListpaysResponse,
  ): ListpaysResponse.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: ListpaysResponse,
    writer: jspb.BinaryWriter,
  ): void;
  static deserializeBinary(bytes: Uint8Array): ListpaysResponse;
  static deserializeBinaryFromReader(
    message: ListpaysResponse,
    reader: jspb.BinaryReader,
  ): ListpaysResponse;
}

export namespace ListpaysResponse {
  export type AsObject = {
    paysList: Array<ListpaysPays.AsObject>;
  };
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

  hasCompletedAt(): boolean;
  clearCompletedAt(): void;
  getCompletedAt(): number | undefined;
  setCompletedAt(value: number): ListpaysPays;

  hasLabel(): boolean;
  clearLabel(): void;
  getLabel(): string | undefined;
  setLabel(value: string): ListpaysPays;

  hasBolt11(): boolean;
  clearBolt11(): void;
  getBolt11(): string | undefined;
  setBolt11(value: string): ListpaysPays;

  hasDescription(): boolean;
  clearDescription(): void;
  getDescription(): string | undefined;
  setDescription(value: string): ListpaysPays;

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

  hasErroronion(): boolean;
  clearErroronion(): void;
  getErroronion(): Uint8Array | string;
  getErroronion_asU8(): Uint8Array;
  getErroronion_asB64(): string;
  setErroronion(value: Uint8Array | string): ListpaysPays;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ListpaysPays.AsObject;
  static toObject(
    includeInstance: boolean,
    msg: ListpaysPays,
  ): ListpaysPays.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: ListpaysPays,
    writer: jspb.BinaryWriter,
  ): void;
  static deserializeBinary(bytes: Uint8Array): ListpaysPays;
  static deserializeBinaryFromReader(
    message: ListpaysPays,
    reader: jspb.BinaryReader,
  ): ListpaysPays;
}

export namespace ListpaysPays {
  export type AsObject = {
    paymentHash: Uint8Array | string;
    status: ListpaysPays.ListpaysPaysStatus;
    destination: Uint8Array | string;
    createdAt: number;
    completedAt?: number;
    label?: string;
    bolt11?: string;
    description?: string;
    bolt12?: string;
    amountMsat?: cln_primitives_pb.Amount.AsObject;
    amountSentMsat?: cln_primitives_pb.Amount.AsObject;
    preimage: Uint8Array | string;
    numberOfParts?: number;
    erroronion: Uint8Array | string;
  };

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
  static toObject(
    includeInstance: boolean,
    msg: ListhtlcsRequest,
  ): ListhtlcsRequest.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: ListhtlcsRequest,
    writer: jspb.BinaryWriter,
  ): void;
  static deserializeBinary(bytes: Uint8Array): ListhtlcsRequest;
  static deserializeBinaryFromReader(
    message: ListhtlcsRequest,
    reader: jspb.BinaryReader,
  ): ListhtlcsRequest;
}

export namespace ListhtlcsRequest {
  export type AsObject = {
    id?: string;
  };
}

export class ListhtlcsResponse extends jspb.Message {
  clearHtlcsList(): void;
  getHtlcsList(): Array<ListhtlcsHtlcs>;
  setHtlcsList(value: Array<ListhtlcsHtlcs>): ListhtlcsResponse;
  addHtlcs(value?: ListhtlcsHtlcs, index?: number): ListhtlcsHtlcs;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ListhtlcsResponse.AsObject;
  static toObject(
    includeInstance: boolean,
    msg: ListhtlcsResponse,
  ): ListhtlcsResponse.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: ListhtlcsResponse,
    writer: jspb.BinaryWriter,
  ): void;
  static deserializeBinary(bytes: Uint8Array): ListhtlcsResponse;
  static deserializeBinaryFromReader(
    message: ListhtlcsResponse,
    reader: jspb.BinaryReader,
  ): ListhtlcsResponse;
}

export namespace ListhtlcsResponse {
  export type AsObject = {
    htlcsList: Array<ListhtlcsHtlcs.AsObject>;
  };
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
  static toObject(
    includeInstance: boolean,
    msg: ListhtlcsHtlcs,
  ): ListhtlcsHtlcs.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: ListhtlcsHtlcs,
    writer: jspb.BinaryWriter,
  ): void;
  static deserializeBinary(bytes: Uint8Array): ListhtlcsHtlcs;
  static deserializeBinaryFromReader(
    message: ListhtlcsHtlcs,
    reader: jspb.BinaryReader,
  ): ListhtlcsHtlcs;
}

export namespace ListhtlcsHtlcs {
  export type AsObject = {
    shortChannelId: string;
    id: number;
    expiry: number;
    amountMsat?: cln_primitives_pb.Amount.AsObject;
    direction: ListhtlcsHtlcs.ListhtlcsHtlcsDirection;
    paymentHash: Uint8Array | string;
    state: cln_primitives_pb.HtlcState;
  };

  export enum ListhtlcsHtlcsDirection {
    OUT = 0,
    IN = 1,
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
  static toObject(
    includeInstance: boolean,
    msg: PingRequest,
  ): PingRequest.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: PingRequest,
    writer: jspb.BinaryWriter,
  ): void;
  static deserializeBinary(bytes: Uint8Array): PingRequest;
  static deserializeBinaryFromReader(
    message: PingRequest,
    reader: jspb.BinaryReader,
  ): PingRequest;
}

export namespace PingRequest {
  export type AsObject = {
    id: Uint8Array | string;
    len?: number;
    pongbytes?: number;
  };
}

export class PingResponse extends jspb.Message {
  getTotlen(): number;
  setTotlen(value: number): PingResponse;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): PingResponse.AsObject;
  static toObject(
    includeInstance: boolean,
    msg: PingResponse,
  ): PingResponse.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: PingResponse,
    writer: jspb.BinaryWriter,
  ): void;
  static deserializeBinary(bytes: Uint8Array): PingResponse;
  static deserializeBinaryFromReader(
    message: PingResponse,
    reader: jspb.BinaryReader,
  ): PingResponse;
}

export namespace PingResponse {
  export type AsObject = {
    totlen: number;
  };
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
  static toObject(
    includeInstance: boolean,
    msg: SendcustommsgRequest,
  ): SendcustommsgRequest.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: SendcustommsgRequest,
    writer: jspb.BinaryWriter,
  ): void;
  static deserializeBinary(bytes: Uint8Array): SendcustommsgRequest;
  static deserializeBinaryFromReader(
    message: SendcustommsgRequest,
    reader: jspb.BinaryReader,
  ): SendcustommsgRequest;
}

export namespace SendcustommsgRequest {
  export type AsObject = {
    nodeId: Uint8Array | string;
    msg: Uint8Array | string;
  };
}

export class SendcustommsgResponse extends jspb.Message {
  getStatus(): string;
  setStatus(value: string): SendcustommsgResponse;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): SendcustommsgResponse.AsObject;
  static toObject(
    includeInstance: boolean,
    msg: SendcustommsgResponse,
  ): SendcustommsgResponse.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: SendcustommsgResponse,
    writer: jspb.BinaryWriter,
  ): void;
  static deserializeBinary(bytes: Uint8Array): SendcustommsgResponse;
  static deserializeBinaryFromReader(
    message: SendcustommsgResponse,
    reader: jspb.BinaryReader,
  ): SendcustommsgResponse;
}

export namespace SendcustommsgResponse {
  export type AsObject = {
    status: string;
  };
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
  static toObject(
    includeInstance: boolean,
    msg: SetchannelRequest,
  ): SetchannelRequest.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: SetchannelRequest,
    writer: jspb.BinaryWriter,
  ): void;
  static deserializeBinary(bytes: Uint8Array): SetchannelRequest;
  static deserializeBinaryFromReader(
    message: SetchannelRequest,
    reader: jspb.BinaryReader,
  ): SetchannelRequest;
}

export namespace SetchannelRequest {
  export type AsObject = {
    id: string;
    feebase?: cln_primitives_pb.Amount.AsObject;
    feeppm?: number;
    htlcmin?: cln_primitives_pb.Amount.AsObject;
    htlcmax?: cln_primitives_pb.Amount.AsObject;
    enforcedelay?: number;
    ignorefeelimits?: boolean;
  };
}

export class SetchannelResponse extends jspb.Message {
  clearChannelsList(): void;
  getChannelsList(): Array<SetchannelChannels>;
  setChannelsList(value: Array<SetchannelChannels>): SetchannelResponse;
  addChannels(value?: SetchannelChannels, index?: number): SetchannelChannels;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): SetchannelResponse.AsObject;
  static toObject(
    includeInstance: boolean,
    msg: SetchannelResponse,
  ): SetchannelResponse.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: SetchannelResponse,
    writer: jspb.BinaryWriter,
  ): void;
  static deserializeBinary(bytes: Uint8Array): SetchannelResponse;
  static deserializeBinaryFromReader(
    message: SetchannelResponse,
    reader: jspb.BinaryReader,
  ): SetchannelResponse;
}

export namespace SetchannelResponse {
  export type AsObject = {
    channelsList: Array<SetchannelChannels.AsObject>;
  };
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

  hasIgnoreFeeLimits(): boolean;
  clearIgnoreFeeLimits(): void;
  getIgnoreFeeLimits(): boolean | undefined;
  setIgnoreFeeLimits(value: boolean): SetchannelChannels;

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

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): SetchannelChannels.AsObject;
  static toObject(
    includeInstance: boolean,
    msg: SetchannelChannels,
  ): SetchannelChannels.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: SetchannelChannels,
    writer: jspb.BinaryWriter,
  ): void;
  static deserializeBinary(bytes: Uint8Array): SetchannelChannels;
  static deserializeBinaryFromReader(
    message: SetchannelChannels,
    reader: jspb.BinaryReader,
  ): SetchannelChannels;
}

export namespace SetchannelChannels {
  export type AsObject = {
    peerId: Uint8Array | string;
    channelId: Uint8Array | string;
    shortChannelId?: string;
    feeBaseMsat?: cln_primitives_pb.Amount.AsObject;
    feeProportionalMillionths: number;
    ignoreFeeLimits?: boolean;
    minimumHtlcOutMsat?: cln_primitives_pb.Amount.AsObject;
    warningHtlcminTooLow?: string;
    maximumHtlcOutMsat?: cln_primitives_pb.Amount.AsObject;
    warningHtlcmaxTooHigh?: string;
  };
}

export class SigninvoiceRequest extends jspb.Message {
  getInvstring(): string;
  setInvstring(value: string): SigninvoiceRequest;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): SigninvoiceRequest.AsObject;
  static toObject(
    includeInstance: boolean,
    msg: SigninvoiceRequest,
  ): SigninvoiceRequest.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: SigninvoiceRequest,
    writer: jspb.BinaryWriter,
  ): void;
  static deserializeBinary(bytes: Uint8Array): SigninvoiceRequest;
  static deserializeBinaryFromReader(
    message: SigninvoiceRequest,
    reader: jspb.BinaryReader,
  ): SigninvoiceRequest;
}

export namespace SigninvoiceRequest {
  export type AsObject = {
    invstring: string;
  };
}

export class SigninvoiceResponse extends jspb.Message {
  getBolt11(): string;
  setBolt11(value: string): SigninvoiceResponse;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): SigninvoiceResponse.AsObject;
  static toObject(
    includeInstance: boolean,
    msg: SigninvoiceResponse,
  ): SigninvoiceResponse.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: SigninvoiceResponse,
    writer: jspb.BinaryWriter,
  ): void;
  static deserializeBinary(bytes: Uint8Array): SigninvoiceResponse;
  static deserializeBinaryFromReader(
    message: SigninvoiceResponse,
    reader: jspb.BinaryReader,
  ): SigninvoiceResponse;
}

export namespace SigninvoiceResponse {
  export type AsObject = {
    bolt11: string;
  };
}

export class SignmessageRequest extends jspb.Message {
  getMessage(): string;
  setMessage(value: string): SignmessageRequest;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): SignmessageRequest.AsObject;
  static toObject(
    includeInstance: boolean,
    msg: SignmessageRequest,
  ): SignmessageRequest.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: SignmessageRequest,
    writer: jspb.BinaryWriter,
  ): void;
  static deserializeBinary(bytes: Uint8Array): SignmessageRequest;
  static deserializeBinaryFromReader(
    message: SignmessageRequest,
    reader: jspb.BinaryReader,
  ): SignmessageRequest;
}

export namespace SignmessageRequest {
  export type AsObject = {
    message: string;
  };
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
  static toObject(
    includeInstance: boolean,
    msg: SignmessageResponse,
  ): SignmessageResponse.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: SignmessageResponse,
    writer: jspb.BinaryWriter,
  ): void;
  static deserializeBinary(bytes: Uint8Array): SignmessageResponse;
  static deserializeBinaryFromReader(
    message: SignmessageResponse,
    reader: jspb.BinaryReader,
  ): SignmessageResponse;
}

export namespace SignmessageResponse {
  export type AsObject = {
    signature: Uint8Array | string;
    recid: Uint8Array | string;
    zbase: string;
  };
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
  static toObject(
    includeInstance: boolean,
    msg: WaitblockheightRequest,
  ): WaitblockheightRequest.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: WaitblockheightRequest,
    writer: jspb.BinaryWriter,
  ): void;
  static deserializeBinary(bytes: Uint8Array): WaitblockheightRequest;
  static deserializeBinaryFromReader(
    message: WaitblockheightRequest,
    reader: jspb.BinaryReader,
  ): WaitblockheightRequest;
}

export namespace WaitblockheightRequest {
  export type AsObject = {
    blockheight: number;
    timeout?: number;
  };
}

export class WaitblockheightResponse extends jspb.Message {
  getBlockheight(): number;
  setBlockheight(value: number): WaitblockheightResponse;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): WaitblockheightResponse.AsObject;
  static toObject(
    includeInstance: boolean,
    msg: WaitblockheightResponse,
  ): WaitblockheightResponse.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: WaitblockheightResponse,
    writer: jspb.BinaryWriter,
  ): void;
  static deserializeBinary(bytes: Uint8Array): WaitblockheightResponse;
  static deserializeBinaryFromReader(
    message: WaitblockheightResponse,
    reader: jspb.BinaryReader,
  ): WaitblockheightResponse;
}

export namespace WaitblockheightResponse {
  export type AsObject = {
    blockheight: number;
  };
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
  static toObject(
    includeInstance: boolean,
    msg: WaitRequest,
  ): WaitRequest.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: WaitRequest,
    writer: jspb.BinaryWriter,
  ): void;
  static deserializeBinary(bytes: Uint8Array): WaitRequest;
  static deserializeBinaryFromReader(
    message: WaitRequest,
    reader: jspb.BinaryReader,
  ): WaitRequest;
}

export namespace WaitRequest {
  export type AsObject = {
    subsystem: WaitRequest.WaitSubsystem;
    indexname: WaitRequest.WaitIndexname;
    nextvalue: number;
  };

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

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): WaitResponse.AsObject;
  static toObject(
    includeInstance: boolean,
    msg: WaitResponse,
  ): WaitResponse.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: WaitResponse,
    writer: jspb.BinaryWriter,
  ): void;
  static deserializeBinary(bytes: Uint8Array): WaitResponse;
  static deserializeBinaryFromReader(
    message: WaitResponse,
    reader: jspb.BinaryReader,
  ): WaitResponse;
}

export namespace WaitResponse {
  export type AsObject = {
    subsystem: WaitResponse.WaitSubsystem;
    created?: number;
    updated?: number;
    deleted?: number;
  };

  export enum WaitSubsystem {
    INVOICES = 0,
    FORWARDS = 1,
    SENDPAYS = 2,
  }
}

export class StopRequest extends jspb.Message {
  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): StopRequest.AsObject;
  static toObject(
    includeInstance: boolean,
    msg: StopRequest,
  ): StopRequest.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: StopRequest,
    writer: jspb.BinaryWriter,
  ): void;
  static deserializeBinary(bytes: Uint8Array): StopRequest;
  static deserializeBinaryFromReader(
    message: StopRequest,
    reader: jspb.BinaryReader,
  ): StopRequest;
}

export namespace StopRequest {
  export type AsObject = {};
}

export class StopResponse extends jspb.Message {
  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): StopResponse.AsObject;
  static toObject(
    includeInstance: boolean,
    msg: StopResponse,
  ): StopResponse.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: StopResponse,
    writer: jspb.BinaryWriter,
  ): void;
  static deserializeBinary(bytes: Uint8Array): StopResponse;
  static deserializeBinaryFromReader(
    message: StopResponse,
    reader: jspb.BinaryReader,
  ): StopResponse;
}

export namespace StopResponse {
  export type AsObject = {};
}

export class PreapprovekeysendRequest extends jspb.Message {
  hasDestination(): boolean;
  clearDestination(): void;
  getDestination(): Uint8Array | string;
  getDestination_asU8(): Uint8Array;
  getDestination_asB64(): string;
  setDestination(value: Uint8Array | string): PreapprovekeysendRequest;

  hasPaymentHash(): boolean;
  clearPaymentHash(): void;
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
  static toObject(
    includeInstance: boolean,
    msg: PreapprovekeysendRequest,
  ): PreapprovekeysendRequest.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: PreapprovekeysendRequest,
    writer: jspb.BinaryWriter,
  ): void;
  static deserializeBinary(bytes: Uint8Array): PreapprovekeysendRequest;
  static deserializeBinaryFromReader(
    message: PreapprovekeysendRequest,
    reader: jspb.BinaryReader,
  ): PreapprovekeysendRequest;
}

export namespace PreapprovekeysendRequest {
  export type AsObject = {
    destination: Uint8Array | string;
    paymentHash: Uint8Array | string;
    amountMsat?: cln_primitives_pb.Amount.AsObject;
  };
}

export class PreapprovekeysendResponse extends jspb.Message {
  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): PreapprovekeysendResponse.AsObject;
  static toObject(
    includeInstance: boolean,
    msg: PreapprovekeysendResponse,
  ): PreapprovekeysendResponse.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: PreapprovekeysendResponse,
    writer: jspb.BinaryWriter,
  ): void;
  static deserializeBinary(bytes: Uint8Array): PreapprovekeysendResponse;
  static deserializeBinaryFromReader(
    message: PreapprovekeysendResponse,
    reader: jspb.BinaryReader,
  ): PreapprovekeysendResponse;
}

export namespace PreapprovekeysendResponse {
  export type AsObject = {};
}

export class PreapproveinvoiceRequest extends jspb.Message {
  hasBolt11(): boolean;
  clearBolt11(): void;
  getBolt11(): string | undefined;
  setBolt11(value: string): PreapproveinvoiceRequest;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): PreapproveinvoiceRequest.AsObject;
  static toObject(
    includeInstance: boolean,
    msg: PreapproveinvoiceRequest,
  ): PreapproveinvoiceRequest.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: PreapproveinvoiceRequest,
    writer: jspb.BinaryWriter,
  ): void;
  static deserializeBinary(bytes: Uint8Array): PreapproveinvoiceRequest;
  static deserializeBinaryFromReader(
    message: PreapproveinvoiceRequest,
    reader: jspb.BinaryReader,
  ): PreapproveinvoiceRequest;
}

export namespace PreapproveinvoiceRequest {
  export type AsObject = {
    bolt11?: string;
  };
}

export class PreapproveinvoiceResponse extends jspb.Message {
  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): PreapproveinvoiceResponse.AsObject;
  static toObject(
    includeInstance: boolean,
    msg: PreapproveinvoiceResponse,
  ): PreapproveinvoiceResponse.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: PreapproveinvoiceResponse,
    writer: jspb.BinaryWriter,
  ): void;
  static deserializeBinary(bytes: Uint8Array): PreapproveinvoiceResponse;
  static deserializeBinaryFromReader(
    message: PreapproveinvoiceResponse,
    reader: jspb.BinaryReader,
  ): PreapproveinvoiceResponse;
}

export namespace PreapproveinvoiceResponse {
  export type AsObject = {};
}

export class StaticbackupRequest extends jspb.Message {
  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): StaticbackupRequest.AsObject;
  static toObject(
    includeInstance: boolean,
    msg: StaticbackupRequest,
  ): StaticbackupRequest.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: StaticbackupRequest,
    writer: jspb.BinaryWriter,
  ): void;
  static deserializeBinary(bytes: Uint8Array): StaticbackupRequest;
  static deserializeBinaryFromReader(
    message: StaticbackupRequest,
    reader: jspb.BinaryReader,
  ): StaticbackupRequest;
}

export namespace StaticbackupRequest {
  export type AsObject = {};
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
  static toObject(
    includeInstance: boolean,
    msg: StaticbackupResponse,
  ): StaticbackupResponse.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: StaticbackupResponse,
    writer: jspb.BinaryWriter,
  ): void;
  static deserializeBinary(bytes: Uint8Array): StaticbackupResponse;
  static deserializeBinaryFromReader(
    message: StaticbackupResponse,
    reader: jspb.BinaryReader,
  ): StaticbackupResponse;
}

export namespace StaticbackupResponse {
  export type AsObject = {
    scbList: Array<Uint8Array | string>;
  };
}
