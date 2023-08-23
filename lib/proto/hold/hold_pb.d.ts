// package: hold
// file: hold.proto

/* tslint:disable */
/* eslint-disable */

import * as jspb from 'google-protobuf';

export class GetInfoRequest extends jspb.Message {
  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): GetInfoRequest.AsObject;
  static toObject(
    includeInstance: boolean,
    msg: GetInfoRequest,
  ): GetInfoRequest.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: GetInfoRequest,
    writer: jspb.BinaryWriter,
  ): void;
  static deserializeBinary(bytes: Uint8Array): GetInfoRequest;
  static deserializeBinaryFromReader(
    message: GetInfoRequest,
    reader: jspb.BinaryReader,
  ): GetInfoRequest;
}

export namespace GetInfoRequest {
  export type AsObject = {};
}

export class GetInfoResponse extends jspb.Message {
  getVersion(): string;
  setVersion(value: string): GetInfoResponse;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): GetInfoResponse.AsObject;
  static toObject(
    includeInstance: boolean,
    msg: GetInfoResponse,
  ): GetInfoResponse.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: GetInfoResponse,
    writer: jspb.BinaryWriter,
  ): void;
  static deserializeBinary(bytes: Uint8Array): GetInfoResponse;
  static deserializeBinaryFromReader(
    message: GetInfoResponse,
    reader: jspb.BinaryReader,
  ): GetInfoResponse;
}

export namespace GetInfoResponse {
  export type AsObject = {
    version: string;
  };
}

export class InvoiceRequest extends jspb.Message {
  getPaymentHash(): string;
  setPaymentHash(value: string): InvoiceRequest;
  getAmountMsat(): number;
  setAmountMsat(value: number): InvoiceRequest;

  hasDescription(): boolean;
  clearDescription(): void;
  getDescription(): string | undefined;
  setDescription(value: string): InvoiceRequest;

  hasExpiry(): boolean;
  clearExpiry(): void;
  getExpiry(): number | undefined;
  setExpiry(value: number): InvoiceRequest;

  hasMinFinalCltvExpiry(): boolean;
  clearMinFinalCltvExpiry(): void;
  getMinFinalCltvExpiry(): number | undefined;
  setMinFinalCltvExpiry(value: number): InvoiceRequest;
  clearRoutingHintsList(): void;
  getRoutingHintsList(): Array<RoutingHint>;
  setRoutingHintsList(value: Array<RoutingHint>): InvoiceRequest;
  addRoutingHints(value?: RoutingHint, index?: number): RoutingHint;

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
    paymentHash: string;
    amountMsat: number;
    description?: string;
    expiry?: number;
    minFinalCltvExpiry?: number;
    routingHintsList: Array<RoutingHint.AsObject>;
  };
}

export class InvoiceResponse extends jspb.Message {
  getBolt11(): string;
  setBolt11(value: string): InvoiceResponse;

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
  };
}

export class RoutingHintsRequest extends jspb.Message {
  getNode(): string;
  setNode(value: string): RoutingHintsRequest;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): RoutingHintsRequest.AsObject;
  static toObject(
    includeInstance: boolean,
    msg: RoutingHintsRequest,
  ): RoutingHintsRequest.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: RoutingHintsRequest,
    writer: jspb.BinaryWriter,
  ): void;
  static deserializeBinary(bytes: Uint8Array): RoutingHintsRequest;
  static deserializeBinaryFromReader(
    message: RoutingHintsRequest,
    reader: jspb.BinaryReader,
  ): RoutingHintsRequest;
}

export namespace RoutingHintsRequest {
  export type AsObject = {
    node: string;
  };
}

export class Hop extends jspb.Message {
  getPublicKey(): string;
  setPublicKey(value: string): Hop;
  getShortChannelId(): string;
  setShortChannelId(value: string): Hop;
  getBaseFee(): number;
  setBaseFee(value: number): Hop;
  getPpmFee(): number;
  setPpmFee(value: number): Hop;
  getCltvExpiryDelta(): number;
  setCltvExpiryDelta(value: number): Hop;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): Hop.AsObject;
  static toObject(includeInstance: boolean, msg: Hop): Hop.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(message: Hop, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): Hop;
  static deserializeBinaryFromReader(
    message: Hop,
    reader: jspb.BinaryReader,
  ): Hop;
}

export namespace Hop {
  export type AsObject = {
    publicKey: string;
    shortChannelId: string;
    baseFee: number;
    ppmFee: number;
    cltvExpiryDelta: number;
  };
}

export class RoutingHint extends jspb.Message {
  clearHopsList(): void;
  getHopsList(): Array<Hop>;
  setHopsList(value: Array<Hop>): RoutingHint;
  addHops(value?: Hop, index?: number): Hop;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): RoutingHint.AsObject;
  static toObject(
    includeInstance: boolean,
    msg: RoutingHint,
  ): RoutingHint.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: RoutingHint,
    writer: jspb.BinaryWriter,
  ): void;
  static deserializeBinary(bytes: Uint8Array): RoutingHint;
  static deserializeBinaryFromReader(
    message: RoutingHint,
    reader: jspb.BinaryReader,
  ): RoutingHint;
}

export namespace RoutingHint {
  export type AsObject = {
    hopsList: Array<Hop.AsObject>;
  };
}

export class RoutingHintsResponse extends jspb.Message {
  clearHintsList(): void;
  getHintsList(): Array<RoutingHint>;
  setHintsList(value: Array<RoutingHint>): RoutingHintsResponse;
  addHints(value?: RoutingHint, index?: number): RoutingHint;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): RoutingHintsResponse.AsObject;
  static toObject(
    includeInstance: boolean,
    msg: RoutingHintsResponse,
  ): RoutingHintsResponse.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: RoutingHintsResponse,
    writer: jspb.BinaryWriter,
  ): void;
  static deserializeBinary(bytes: Uint8Array): RoutingHintsResponse;
  static deserializeBinaryFromReader(
    message: RoutingHintsResponse,
    reader: jspb.BinaryReader,
  ): RoutingHintsResponse;
}

export namespace RoutingHintsResponse {
  export type AsObject = {
    hintsList: Array<RoutingHint.AsObject>;
  };
}

export class ListRequest extends jspb.Message {
  hasPaymentHash(): boolean;
  clearPaymentHash(): void;
  getPaymentHash(): string | undefined;
  setPaymentHash(value: string): ListRequest;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ListRequest.AsObject;
  static toObject(
    includeInstance: boolean,
    msg: ListRequest,
  ): ListRequest.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: ListRequest,
    writer: jspb.BinaryWriter,
  ): void;
  static deserializeBinary(bytes: Uint8Array): ListRequest;
  static deserializeBinaryFromReader(
    message: ListRequest,
    reader: jspb.BinaryReader,
  ): ListRequest;
}

export namespace ListRequest {
  export type AsObject = {
    paymentHash?: string;
  };
}

export class Htlc extends jspb.Message {
  getState(): HtlcState;
  setState(value: HtlcState): Htlc;
  getMsat(): number;
  setMsat(value: number): Htlc;
  getCreatedAt(): number;
  setCreatedAt(value: number): Htlc;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): Htlc.AsObject;
  static toObject(includeInstance: boolean, msg: Htlc): Htlc.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: Htlc,
    writer: jspb.BinaryWriter,
  ): void;
  static deserializeBinary(bytes: Uint8Array): Htlc;
  static deserializeBinaryFromReader(
    message: Htlc,
    reader: jspb.BinaryReader,
  ): Htlc;
}

export namespace Htlc {
  export type AsObject = {
    state: HtlcState;
    msat: number;
    createdAt: number;
  };
}

export class Invoice extends jspb.Message {
  getPaymentHash(): string;
  setPaymentHash(value: string): Invoice;

  hasPaymentPreimage(): boolean;
  clearPaymentPreimage(): void;
  getPaymentPreimage(): string | undefined;
  setPaymentPreimage(value: string): Invoice;
  getState(): InvoiceState;
  setState(value: InvoiceState): Invoice;
  getBolt11(): string;
  setBolt11(value: string): Invoice;
  getCreatedAt(): number;
  setCreatedAt(value: number): Invoice;
  clearHtlcsList(): void;
  getHtlcsList(): Array<Htlc>;
  setHtlcsList(value: Array<Htlc>): Invoice;
  addHtlcs(value?: Htlc, index?: number): Htlc;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): Invoice.AsObject;
  static toObject(includeInstance: boolean, msg: Invoice): Invoice.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: Invoice,
    writer: jspb.BinaryWriter,
  ): void;
  static deserializeBinary(bytes: Uint8Array): Invoice;
  static deserializeBinaryFromReader(
    message: Invoice,
    reader: jspb.BinaryReader,
  ): Invoice;
}

export namespace Invoice {
  export type AsObject = {
    paymentHash: string;
    paymentPreimage?: string;
    state: InvoiceState;
    bolt11: string;
    createdAt: number;
    htlcsList: Array<Htlc.AsObject>;
  };
}

export class ListResponse extends jspb.Message {
  clearInvoicesList(): void;
  getInvoicesList(): Array<Invoice>;
  setInvoicesList(value: Array<Invoice>): ListResponse;
  addInvoices(value?: Invoice, index?: number): Invoice;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ListResponse.AsObject;
  static toObject(
    includeInstance: boolean,
    msg: ListResponse,
  ): ListResponse.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: ListResponse,
    writer: jspb.BinaryWriter,
  ): void;
  static deserializeBinary(bytes: Uint8Array): ListResponse;
  static deserializeBinaryFromReader(
    message: ListResponse,
    reader: jspb.BinaryReader,
  ): ListResponse;
}

export namespace ListResponse {
  export type AsObject = {
    invoicesList: Array<Invoice.AsObject>;
  };
}

export class SettleRequest extends jspb.Message {
  getPaymentPreimage(): string;
  setPaymentPreimage(value: string): SettleRequest;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): SettleRequest.AsObject;
  static toObject(
    includeInstance: boolean,
    msg: SettleRequest,
  ): SettleRequest.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: SettleRequest,
    writer: jspb.BinaryWriter,
  ): void;
  static deserializeBinary(bytes: Uint8Array): SettleRequest;
  static deserializeBinaryFromReader(
    message: SettleRequest,
    reader: jspb.BinaryReader,
  ): SettleRequest;
}

export namespace SettleRequest {
  export type AsObject = {
    paymentPreimage: string;
  };
}

export class SettleResponse extends jspb.Message {
  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): SettleResponse.AsObject;
  static toObject(
    includeInstance: boolean,
    msg: SettleResponse,
  ): SettleResponse.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: SettleResponse,
    writer: jspb.BinaryWriter,
  ): void;
  static deserializeBinary(bytes: Uint8Array): SettleResponse;
  static deserializeBinaryFromReader(
    message: SettleResponse,
    reader: jspb.BinaryReader,
  ): SettleResponse;
}

export namespace SettleResponse {
  export type AsObject = {};
}

export class CancelRequest extends jspb.Message {
  getPaymentHash(): string;
  setPaymentHash(value: string): CancelRequest;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): CancelRequest.AsObject;
  static toObject(
    includeInstance: boolean,
    msg: CancelRequest,
  ): CancelRequest.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: CancelRequest,
    writer: jspb.BinaryWriter,
  ): void;
  static deserializeBinary(bytes: Uint8Array): CancelRequest;
  static deserializeBinaryFromReader(
    message: CancelRequest,
    reader: jspb.BinaryReader,
  ): CancelRequest;
}

export namespace CancelRequest {
  export type AsObject = {
    paymentHash: string;
  };
}

export class CancelResponse extends jspb.Message {
  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): CancelResponse.AsObject;
  static toObject(
    includeInstance: boolean,
    msg: CancelResponse,
  ): CancelResponse.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: CancelResponse,
    writer: jspb.BinaryWriter,
  ): void;
  static deserializeBinary(bytes: Uint8Array): CancelResponse;
  static deserializeBinaryFromReader(
    message: CancelResponse,
    reader: jspb.BinaryReader,
  ): CancelResponse;
}

export namespace CancelResponse {
  export type AsObject = {};
}

export class TrackRequest extends jspb.Message {
  getPaymentHash(): string;
  setPaymentHash(value: string): TrackRequest;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): TrackRequest.AsObject;
  static toObject(
    includeInstance: boolean,
    msg: TrackRequest,
  ): TrackRequest.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: TrackRequest,
    writer: jspb.BinaryWriter,
  ): void;
  static deserializeBinary(bytes: Uint8Array): TrackRequest;
  static deserializeBinaryFromReader(
    message: TrackRequest,
    reader: jspb.BinaryReader,
  ): TrackRequest;
}

export namespace TrackRequest {
  export type AsObject = {
    paymentHash: string;
  };
}

export class TrackResponse extends jspb.Message {
  getState(): InvoiceState;
  setState(value: InvoiceState): TrackResponse;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): TrackResponse.AsObject;
  static toObject(
    includeInstance: boolean,
    msg: TrackResponse,
  ): TrackResponse.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: TrackResponse,
    writer: jspb.BinaryWriter,
  ): void;
  static deserializeBinary(bytes: Uint8Array): TrackResponse;
  static deserializeBinaryFromReader(
    message: TrackResponse,
    reader: jspb.BinaryReader,
  ): TrackResponse;
}

export namespace TrackResponse {
  export type AsObject = {
    state: InvoiceState;
  };
}

export class TrackAllRequest extends jspb.Message {
  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): TrackAllRequest.AsObject;
  static toObject(
    includeInstance: boolean,
    msg: TrackAllRequest,
  ): TrackAllRequest.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: TrackAllRequest,
    writer: jspb.BinaryWriter,
  ): void;
  static deserializeBinary(bytes: Uint8Array): TrackAllRequest;
  static deserializeBinaryFromReader(
    message: TrackAllRequest,
    reader: jspb.BinaryReader,
  ): TrackAllRequest;
}

export namespace TrackAllRequest {
  export type AsObject = {};
}

export class TrackAllResponse extends jspb.Message {
  getPaymentHash(): string;
  setPaymentHash(value: string): TrackAllResponse;
  getBolt11(): string;
  setBolt11(value: string): TrackAllResponse;
  getState(): InvoiceState;
  setState(value: InvoiceState): TrackAllResponse;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): TrackAllResponse.AsObject;
  static toObject(
    includeInstance: boolean,
    msg: TrackAllResponse,
  ): TrackAllResponse.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: TrackAllResponse,
    writer: jspb.BinaryWriter,
  ): void;
  static deserializeBinary(bytes: Uint8Array): TrackAllResponse;
  static deserializeBinaryFromReader(
    message: TrackAllResponse,
    reader: jspb.BinaryReader,
  ): TrackAllResponse;
}

export namespace TrackAllResponse {
  export type AsObject = {
    paymentHash: string;
    bolt11: string;
    state: InvoiceState;
  };
}

export enum InvoiceState {
  INVOICE_UNPAID = 0,
  INVOICE_ACCEPTED = 1,
  INVOICE_PAID = 2,
  INVOICE_CANCELLED = 3,
}

export enum HtlcState {
  HTLC_ACCEPTED = 0,
  HTLC_SETTLED = 1,
  HTLC_CANCELLED = 2,
}
