// package: cln
// file: cln/primitives.proto

/* tslint:disable */
/* eslint-disable */

import * as jspb from 'google-protobuf';

export class Amount extends jspb.Message {
  getMsat(): number;
  setMsat(value: number): Amount;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): Amount.AsObject;
  static toObject(includeInstance: boolean, msg: Amount): Amount.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: Amount,
    writer: jspb.BinaryWriter,
  ): void;
  static deserializeBinary(bytes: Uint8Array): Amount;
  static deserializeBinaryFromReader(
    message: Amount,
    reader: jspb.BinaryReader,
  ): Amount;
}

export namespace Amount {
  export type AsObject = {
    msat: number;
  };
}

export class AmountOrAll extends jspb.Message {
  hasAmount(): boolean;
  clearAmount(): void;
  getAmount(): Amount | undefined;
  setAmount(value?: Amount): AmountOrAll;

  hasAll(): boolean;
  clearAll(): void;
  getAll(): boolean;
  setAll(value: boolean): AmountOrAll;

  getValueCase(): AmountOrAll.ValueCase;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): AmountOrAll.AsObject;
  static toObject(
    includeInstance: boolean,
    msg: AmountOrAll,
  ): AmountOrAll.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: AmountOrAll,
    writer: jspb.BinaryWriter,
  ): void;
  static deserializeBinary(bytes: Uint8Array): AmountOrAll;
  static deserializeBinaryFromReader(
    message: AmountOrAll,
    reader: jspb.BinaryReader,
  ): AmountOrAll;
}

export namespace AmountOrAll {
  export type AsObject = {
    amount?: Amount.AsObject;
    all: boolean;
  };

  export enum ValueCase {
    VALUE_NOT_SET = 0,
    AMOUNT = 1,
    ALL = 2,
  }
}

export class AmountOrAny extends jspb.Message {
  hasAmount(): boolean;
  clearAmount(): void;
  getAmount(): Amount | undefined;
  setAmount(value?: Amount): AmountOrAny;

  hasAny(): boolean;
  clearAny(): void;
  getAny(): boolean;
  setAny(value: boolean): AmountOrAny;

  getValueCase(): AmountOrAny.ValueCase;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): AmountOrAny.AsObject;
  static toObject(
    includeInstance: boolean,
    msg: AmountOrAny,
  ): AmountOrAny.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: AmountOrAny,
    writer: jspb.BinaryWriter,
  ): void;
  static deserializeBinary(bytes: Uint8Array): AmountOrAny;
  static deserializeBinaryFromReader(
    message: AmountOrAny,
    reader: jspb.BinaryReader,
  ): AmountOrAny;
}

export namespace AmountOrAny {
  export type AsObject = {
    amount?: Amount.AsObject;
    any: boolean;
  };

  export enum ValueCase {
    VALUE_NOT_SET = 0,
    AMOUNT = 1,
    ANY = 2,
  }
}

export class ChannelStateChangeCause extends jspb.Message {
  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ChannelStateChangeCause.AsObject;
  static toObject(
    includeInstance: boolean,
    msg: ChannelStateChangeCause,
  ): ChannelStateChangeCause.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: ChannelStateChangeCause,
    writer: jspb.BinaryWriter,
  ): void;
  static deserializeBinary(bytes: Uint8Array): ChannelStateChangeCause;
  static deserializeBinaryFromReader(
    message: ChannelStateChangeCause,
    reader: jspb.BinaryReader,
  ): ChannelStateChangeCause;
}

export namespace ChannelStateChangeCause {
  export type AsObject = {};
}

export class Outpoint extends jspb.Message {
  getTxid(): Uint8Array | string;
  getTxid_asU8(): Uint8Array;
  getTxid_asB64(): string;
  setTxid(value: Uint8Array | string): Outpoint;
  getOutnum(): number;
  setOutnum(value: number): Outpoint;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): Outpoint.AsObject;
  static toObject(includeInstance: boolean, msg: Outpoint): Outpoint.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: Outpoint,
    writer: jspb.BinaryWriter,
  ): void;
  static deserializeBinary(bytes: Uint8Array): Outpoint;
  static deserializeBinaryFromReader(
    message: Outpoint,
    reader: jspb.BinaryReader,
  ): Outpoint;
}

export namespace Outpoint {
  export type AsObject = {
    txid: Uint8Array | string;
    outnum: number;
  };
}

export class Feerate extends jspb.Message {
  hasSlow(): boolean;
  clearSlow(): void;
  getSlow(): boolean;
  setSlow(value: boolean): Feerate;

  hasNormal(): boolean;
  clearNormal(): void;
  getNormal(): boolean;
  setNormal(value: boolean): Feerate;

  hasUrgent(): boolean;
  clearUrgent(): void;
  getUrgent(): boolean;
  setUrgent(value: boolean): Feerate;

  hasPerkb(): boolean;
  clearPerkb(): void;
  getPerkb(): number;
  setPerkb(value: number): Feerate;

  hasPerkw(): boolean;
  clearPerkw(): void;
  getPerkw(): number;
  setPerkw(value: number): Feerate;

  getStyleCase(): Feerate.StyleCase;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): Feerate.AsObject;
  static toObject(includeInstance: boolean, msg: Feerate): Feerate.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: Feerate,
    writer: jspb.BinaryWriter,
  ): void;
  static deserializeBinary(bytes: Uint8Array): Feerate;
  static deserializeBinaryFromReader(
    message: Feerate,
    reader: jspb.BinaryReader,
  ): Feerate;
}

export namespace Feerate {
  export type AsObject = {
    slow: boolean;
    normal: boolean;
    urgent: boolean;
    perkb: number;
    perkw: number;
  };

  export enum StyleCase {
    STYLE_NOT_SET = 0,
    SLOW = 1,
    NORMAL = 2,
    URGENT = 3,
    PERKB = 4,
    PERKW = 5,
  }
}

export class OutputDesc extends jspb.Message {
  getAddress(): string;
  setAddress(value: string): OutputDesc;

  hasAmount(): boolean;
  clearAmount(): void;
  getAmount(): Amount | undefined;
  setAmount(value?: Amount): OutputDesc;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): OutputDesc.AsObject;
  static toObject(
    includeInstance: boolean,
    msg: OutputDesc,
  ): OutputDesc.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: OutputDesc,
    writer: jspb.BinaryWriter,
  ): void;
  static deserializeBinary(bytes: Uint8Array): OutputDesc;
  static deserializeBinaryFromReader(
    message: OutputDesc,
    reader: jspb.BinaryReader,
  ): OutputDesc;
}

export namespace OutputDesc {
  export type AsObject = {
    address: string;
    amount?: Amount.AsObject;
  };
}

export class RouteHop extends jspb.Message {
  getId(): Uint8Array | string;
  getId_asU8(): Uint8Array;
  getId_asB64(): string;
  setId(value: Uint8Array | string): RouteHop;
  getShortChannelId(): string;
  setShortChannelId(value: string): RouteHop;

  hasFeebase(): boolean;
  clearFeebase(): void;
  getFeebase(): Amount | undefined;
  setFeebase(value?: Amount): RouteHop;
  getFeeprop(): number;
  setFeeprop(value: number): RouteHop;
  getExpirydelta(): number;
  setExpirydelta(value: number): RouteHop;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): RouteHop.AsObject;
  static toObject(includeInstance: boolean, msg: RouteHop): RouteHop.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: RouteHop,
    writer: jspb.BinaryWriter,
  ): void;
  static deserializeBinary(bytes: Uint8Array): RouteHop;
  static deserializeBinaryFromReader(
    message: RouteHop,
    reader: jspb.BinaryReader,
  ): RouteHop;
}

export namespace RouteHop {
  export type AsObject = {
    id: Uint8Array | string;
    shortChannelId: string;
    feebase?: Amount.AsObject;
    feeprop: number;
    expirydelta: number;
  };
}

export class Routehint extends jspb.Message {
  clearHopsList(): void;
  getHopsList(): Array<RouteHop>;
  setHopsList(value: Array<RouteHop>): Routehint;
  addHops(value?: RouteHop, index?: number): RouteHop;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): Routehint.AsObject;
  static toObject(includeInstance: boolean, msg: Routehint): Routehint.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: Routehint,
    writer: jspb.BinaryWriter,
  ): void;
  static deserializeBinary(bytes: Uint8Array): Routehint;
  static deserializeBinaryFromReader(
    message: Routehint,
    reader: jspb.BinaryReader,
  ): Routehint;
}

export namespace Routehint {
  export type AsObject = {
    hopsList: Array<RouteHop.AsObject>;
  };
}

export class RoutehintList extends jspb.Message {
  clearHintsList(): void;
  getHintsList(): Array<Routehint>;
  setHintsList(value: Array<Routehint>): RoutehintList;
  addHints(value?: Routehint, index?: number): Routehint;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): RoutehintList.AsObject;
  static toObject(
    includeInstance: boolean,
    msg: RoutehintList,
  ): RoutehintList.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: RoutehintList,
    writer: jspb.BinaryWriter,
  ): void;
  static deserializeBinary(bytes: Uint8Array): RoutehintList;
  static deserializeBinaryFromReader(
    message: RoutehintList,
    reader: jspb.BinaryReader,
  ): RoutehintList;
}

export namespace RoutehintList {
  export type AsObject = {
    hintsList: Array<Routehint.AsObject>;
  };
}

export class TlvEntry extends jspb.Message {
  getType(): number;
  setType(value: number): TlvEntry;
  getValue(): Uint8Array | string;
  getValue_asU8(): Uint8Array;
  getValue_asB64(): string;
  setValue(value: Uint8Array | string): TlvEntry;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): TlvEntry.AsObject;
  static toObject(includeInstance: boolean, msg: TlvEntry): TlvEntry.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: TlvEntry,
    writer: jspb.BinaryWriter,
  ): void;
  static deserializeBinary(bytes: Uint8Array): TlvEntry;
  static deserializeBinaryFromReader(
    message: TlvEntry,
    reader: jspb.BinaryReader,
  ): TlvEntry;
}

export namespace TlvEntry {
  export type AsObject = {
    type: number;
    value: Uint8Array | string;
  };
}

export class TlvStream extends jspb.Message {
  clearEntriesList(): void;
  getEntriesList(): Array<TlvEntry>;
  setEntriesList(value: Array<TlvEntry>): TlvStream;
  addEntries(value?: TlvEntry, index?: number): TlvEntry;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): TlvStream.AsObject;
  static toObject(includeInstance: boolean, msg: TlvStream): TlvStream.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: TlvStream,
    writer: jspb.BinaryWriter,
  ): void;
  static deserializeBinary(bytes: Uint8Array): TlvStream;
  static deserializeBinaryFromReader(
    message: TlvStream,
    reader: jspb.BinaryReader,
  ): TlvStream;
}

export namespace TlvStream {
  export type AsObject = {
    entriesList: Array<TlvEntry.AsObject>;
  };
}

export enum ChannelSide {
  LOCAL = 0,
  REMOTE = 1,
}

export enum ChannelState {
  OPENINGD = 0,
  CHANNELDAWAITINGLOCKIN = 1,
  CHANNELDNORMAL = 2,
  CHANNELDSHUTTINGDOWN = 3,
  CLOSINGDSIGEXCHANGE = 4,
  CLOSINGDCOMPLETE = 5,
  AWAITINGUNILATERAL = 6,
  FUNDINGSPENDSEEN = 7,
  ONCHAIN = 8,
  DUALOPENDOPENINIT = 9,
  DUALOPENDAWAITINGLOCKIN = 10,
  CHANNELDAWAITINGSPLICE = 11,
}

export enum HtlcState {
  SENTADDHTLC = 0,
  SENTADDCOMMIT = 1,
  RCVDADDREVOCATION = 2,
  RCVDADDACKCOMMIT = 3,
  SENTADDACKREVOCATION = 4,
  RCVDADDACKREVOCATION = 5,
  RCVDREMOVEHTLC = 6,
  RCVDREMOVECOMMIT = 7,
  SENTREMOVEREVOCATION = 8,
  SENTREMOVEACKCOMMIT = 9,
  RCVDREMOVEACKREVOCATION = 10,
  RCVDADDHTLC = 11,
  RCVDADDCOMMIT = 12,
  SENTADDREVOCATION = 13,
  SENTADDACKCOMMIT = 14,
  SENTREMOVEHTLC = 15,
  SENTREMOVECOMMIT = 16,
  RCVDREMOVEREVOCATION = 17,
  RCVDREMOVEACKCOMMIT = 18,
  SENTREMOVEACKREVOCATION = 19,
}
