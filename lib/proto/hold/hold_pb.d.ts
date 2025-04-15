// package: hold
// file: hold.proto

/* tslint:disable */
/* eslint-disable */

import * as jspb from "google-protobuf";

export class GetInfoRequest extends jspb.Message { 

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): GetInfoRequest.AsObject;
    static toObject(includeInstance: boolean, msg: GetInfoRequest): GetInfoRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: GetInfoRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): GetInfoRequest;
    static deserializeBinaryFromReader(message: GetInfoRequest, reader: jspb.BinaryReader): GetInfoRequest;
}

export namespace GetInfoRequest {
    export type AsObject = {
    }
}

export class GetInfoResponse extends jspb.Message { 
    getVersion(): string;
    setVersion(value: string): GetInfoResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): GetInfoResponse.AsObject;
    static toObject(includeInstance: boolean, msg: GetInfoResponse): GetInfoResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: GetInfoResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): GetInfoResponse;
    static deserializeBinaryFromReader(message: GetInfoResponse, reader: jspb.BinaryReader): GetInfoResponse;
}

export namespace GetInfoResponse {
    export type AsObject = {
        version: string,
    }
}

export class Hop extends jspb.Message { 
    getPublicKey(): Uint8Array | string;
    getPublicKey_asU8(): Uint8Array;
    getPublicKey_asB64(): string;
    setPublicKey(value: Uint8Array | string): Hop;
    getShortChannelId(): number;
    setShortChannelId(value: number): Hop;
    getBaseFee(): number;
    setBaseFee(value: number): Hop;
    getPpmFee(): number;
    setPpmFee(value: number): Hop;
    getCltvExpiryDelta(): number;
    setCltvExpiryDelta(value: number): Hop;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): Hop.AsObject;
    static toObject(includeInstance: boolean, msg: Hop): Hop.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: Hop, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): Hop;
    static deserializeBinaryFromReader(message: Hop, reader: jspb.BinaryReader): Hop;
}

export namespace Hop {
    export type AsObject = {
        publicKey: Uint8Array | string,
        shortChannelId: number,
        baseFee: number,
        ppmFee: number,
        cltvExpiryDelta: number,
    }
}

export class RoutingHint extends jspb.Message { 
    clearHopsList(): void;
    getHopsList(): Array<Hop>;
    setHopsList(value: Array<Hop>): RoutingHint;
    addHops(value?: Hop, index?: number): Hop;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): RoutingHint.AsObject;
    static toObject(includeInstance: boolean, msg: RoutingHint): RoutingHint.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: RoutingHint, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): RoutingHint;
    static deserializeBinaryFromReader(message: RoutingHint, reader: jspb.BinaryReader): RoutingHint;
}

export namespace RoutingHint {
    export type AsObject = {
        hopsList: Array<Hop.AsObject>,
    }
}

export class InvoiceRequest extends jspb.Message { 
    getPaymentHash(): Uint8Array | string;
    getPaymentHash_asU8(): Uint8Array;
    getPaymentHash_asB64(): string;
    setPaymentHash(value: Uint8Array | string): InvoiceRequest;
    getAmountMsat(): number;
    setAmountMsat(value: number): InvoiceRequest;

    hasMemo(): boolean;
    clearMemo(): void;
    getMemo(): string;
    setMemo(value: string): InvoiceRequest;

    hasHash(): boolean;
    clearHash(): void;
    getHash(): Uint8Array | string;
    getHash_asU8(): Uint8Array;
    getHash_asB64(): string;
    setHash(value: Uint8Array | string): InvoiceRequest;

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

    getDescriptionCase(): InvoiceRequest.DescriptionCase;

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
        paymentHash: Uint8Array | string,
        amountMsat: number,
        memo: string,
        hash: Uint8Array | string,
        expiry?: number,
        minFinalCltvExpiry?: number,
        routingHintsList: Array<RoutingHint.AsObject>,
    }

    export enum DescriptionCase {
        DESCRIPTION_NOT_SET = 0,
        MEMO = 3,
        HASH = 4,
    }

}

export class InvoiceResponse extends jspb.Message { 
    getBolt11(): string;
    setBolt11(value: string): InvoiceResponse;

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
    }
}

export class InjectRequest extends jspb.Message { 
    getInvoice(): string;
    setInvoice(value: string): InjectRequest;

    hasMinCltvExpiry(): boolean;
    clearMinCltvExpiry(): void;
    getMinCltvExpiry(): number | undefined;
    setMinCltvExpiry(value: number): InjectRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): InjectRequest.AsObject;
    static toObject(includeInstance: boolean, msg: InjectRequest): InjectRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: InjectRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): InjectRequest;
    static deserializeBinaryFromReader(message: InjectRequest, reader: jspb.BinaryReader): InjectRequest;
}

export namespace InjectRequest {
    export type AsObject = {
        invoice: string,
        minCltvExpiry?: number,
    }
}

export class InjectResponse extends jspb.Message { 

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): InjectResponse.AsObject;
    static toObject(includeInstance: boolean, msg: InjectResponse): InjectResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: InjectResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): InjectResponse;
    static deserializeBinaryFromReader(message: InjectResponse, reader: jspb.BinaryReader): InjectResponse;
}

export namespace InjectResponse {
    export type AsObject = {
    }
}

export class ListRequest extends jspb.Message { 

    hasPaymentHash(): boolean;
    clearPaymentHash(): void;
    getPaymentHash(): Uint8Array | string;
    getPaymentHash_asU8(): Uint8Array;
    getPaymentHash_asB64(): string;
    setPaymentHash(value: Uint8Array | string): ListRequest;

    hasPagination(): boolean;
    clearPagination(): void;
    getPagination(): ListRequest.Pagination | undefined;
    setPagination(value?: ListRequest.Pagination): ListRequest;

    getConstraintCase(): ListRequest.ConstraintCase;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ListRequest.AsObject;
    static toObject(includeInstance: boolean, msg: ListRequest): ListRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ListRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ListRequest;
    static deserializeBinaryFromReader(message: ListRequest, reader: jspb.BinaryReader): ListRequest;
}

export namespace ListRequest {
    export type AsObject = {
        paymentHash: Uint8Array | string,
        pagination?: ListRequest.Pagination.AsObject,
    }


    export class Pagination extends jspb.Message { 
        getIndexStart(): number;
        setIndexStart(value: number): Pagination;
        getLimit(): number;
        setLimit(value: number): Pagination;

        serializeBinary(): Uint8Array;
        toObject(includeInstance?: boolean): Pagination.AsObject;
        static toObject(includeInstance: boolean, msg: Pagination): Pagination.AsObject;
        static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
        static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
        static serializeBinaryToWriter(message: Pagination, writer: jspb.BinaryWriter): void;
        static deserializeBinary(bytes: Uint8Array): Pagination;
        static deserializeBinaryFromReader(message: Pagination, reader: jspb.BinaryReader): Pagination;
    }

    export namespace Pagination {
        export type AsObject = {
            indexStart: number,
            limit: number,
        }
    }


    export enum ConstraintCase {
        CONSTRAINT_NOT_SET = 0,
        PAYMENT_HASH = 1,
        PAGINATION = 2,
    }

}

export class Htlc extends jspb.Message { 
    getId(): number;
    setId(value: number): Htlc;
    getState(): InvoiceState;
    setState(value: InvoiceState): Htlc;
    getScid(): string;
    setScid(value: string): Htlc;
    getChannelId(): number;
    setChannelId(value: number): Htlc;
    getMsat(): number;
    setMsat(value: number): Htlc;
    getCreatedAt(): number;
    setCreatedAt(value: number): Htlc;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): Htlc.AsObject;
    static toObject(includeInstance: boolean, msg: Htlc): Htlc.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: Htlc, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): Htlc;
    static deserializeBinaryFromReader(message: Htlc, reader: jspb.BinaryReader): Htlc;
}

export namespace Htlc {
    export type AsObject = {
        id: number,
        state: InvoiceState,
        scid: string,
        channelId: number,
        msat: number,
        createdAt: number,
    }
}

export class Invoice extends jspb.Message { 
    getId(): number;
    setId(value: number): Invoice;
    getPaymentHash(): Uint8Array | string;
    getPaymentHash_asU8(): Uint8Array;
    getPaymentHash_asB64(): string;
    setPaymentHash(value: Uint8Array | string): Invoice;

    hasPreimage(): boolean;
    clearPreimage(): void;
    getPreimage(): Uint8Array | string;
    getPreimage_asU8(): Uint8Array;
    getPreimage_asB64(): string;
    setPreimage(value: Uint8Array | string): Invoice;
    getInvoice(): string;
    setInvoice(value: string): Invoice;
    getState(): InvoiceState;
    setState(value: InvoiceState): Invoice;
    getCreatedAt(): number;
    setCreatedAt(value: number): Invoice;

    hasSettledAt(): boolean;
    clearSettledAt(): void;
    getSettledAt(): number | undefined;
    setSettledAt(value: number): Invoice;
    clearHtlcsList(): void;
    getHtlcsList(): Array<Htlc>;
    setHtlcsList(value: Array<Htlc>): Invoice;
    addHtlcs(value?: Htlc, index?: number): Htlc;

    hasMinCltvExpiry(): boolean;
    clearMinCltvExpiry(): void;
    getMinCltvExpiry(): number | undefined;
    setMinCltvExpiry(value: number): Invoice;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): Invoice.AsObject;
    static toObject(includeInstance: boolean, msg: Invoice): Invoice.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: Invoice, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): Invoice;
    static deserializeBinaryFromReader(message: Invoice, reader: jspb.BinaryReader): Invoice;
}

export namespace Invoice {
    export type AsObject = {
        id: number,
        paymentHash: Uint8Array | string,
        preimage: Uint8Array | string,
        invoice: string,
        state: InvoiceState,
        createdAt: number,
        settledAt?: number,
        htlcsList: Array<Htlc.AsObject>,
        minCltvExpiry?: number,
    }
}

export class ListResponse extends jspb.Message { 
    clearInvoicesList(): void;
    getInvoicesList(): Array<Invoice>;
    setInvoicesList(value: Array<Invoice>): ListResponse;
    addInvoices(value?: Invoice, index?: number): Invoice;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ListResponse.AsObject;
    static toObject(includeInstance: boolean, msg: ListResponse): ListResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ListResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ListResponse;
    static deserializeBinaryFromReader(message: ListResponse, reader: jspb.BinaryReader): ListResponse;
}

export namespace ListResponse {
    export type AsObject = {
        invoicesList: Array<Invoice.AsObject>,
    }
}

export class SettleRequest extends jspb.Message { 
    getPaymentPreimage(): Uint8Array | string;
    getPaymentPreimage_asU8(): Uint8Array;
    getPaymentPreimage_asB64(): string;
    setPaymentPreimage(value: Uint8Array | string): SettleRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): SettleRequest.AsObject;
    static toObject(includeInstance: boolean, msg: SettleRequest): SettleRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: SettleRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): SettleRequest;
    static deserializeBinaryFromReader(message: SettleRequest, reader: jspb.BinaryReader): SettleRequest;
}

export namespace SettleRequest {
    export type AsObject = {
        paymentPreimage: Uint8Array | string,
    }
}

export class SettleResponse extends jspb.Message { 

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): SettleResponse.AsObject;
    static toObject(includeInstance: boolean, msg: SettleResponse): SettleResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: SettleResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): SettleResponse;
    static deserializeBinaryFromReader(message: SettleResponse, reader: jspb.BinaryReader): SettleResponse;
}

export namespace SettleResponse {
    export type AsObject = {
    }
}

export class CancelRequest extends jspb.Message { 
    getPaymentHash(): Uint8Array | string;
    getPaymentHash_asU8(): Uint8Array;
    getPaymentHash_asB64(): string;
    setPaymentHash(value: Uint8Array | string): CancelRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): CancelRequest.AsObject;
    static toObject(includeInstance: boolean, msg: CancelRequest): CancelRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: CancelRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): CancelRequest;
    static deserializeBinaryFromReader(message: CancelRequest, reader: jspb.BinaryReader): CancelRequest;
}

export namespace CancelRequest {
    export type AsObject = {
        paymentHash: Uint8Array | string,
    }
}

export class CancelResponse extends jspb.Message { 

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): CancelResponse.AsObject;
    static toObject(includeInstance: boolean, msg: CancelResponse): CancelResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: CancelResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): CancelResponse;
    static deserializeBinaryFromReader(message: CancelResponse, reader: jspb.BinaryReader): CancelResponse;
}

export namespace CancelResponse {
    export type AsObject = {
    }
}

export class CleanRequest extends jspb.Message { 

    hasAge(): boolean;
    clearAge(): void;
    getAge(): number | undefined;
    setAge(value: number): CleanRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): CleanRequest.AsObject;
    static toObject(includeInstance: boolean, msg: CleanRequest): CleanRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: CleanRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): CleanRequest;
    static deserializeBinaryFromReader(message: CleanRequest, reader: jspb.BinaryReader): CleanRequest;
}

export namespace CleanRequest {
    export type AsObject = {
        age?: number,
    }
}

export class CleanResponse extends jspb.Message { 
    getCleaned(): number;
    setCleaned(value: number): CleanResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): CleanResponse.AsObject;
    static toObject(includeInstance: boolean, msg: CleanResponse): CleanResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: CleanResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): CleanResponse;
    static deserializeBinaryFromReader(message: CleanResponse, reader: jspb.BinaryReader): CleanResponse;
}

export namespace CleanResponse {
    export type AsObject = {
        cleaned: number,
    }
}

export class TrackRequest extends jspb.Message { 
    getPaymentHash(): Uint8Array | string;
    getPaymentHash_asU8(): Uint8Array;
    getPaymentHash_asB64(): string;
    setPaymentHash(value: Uint8Array | string): TrackRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): TrackRequest.AsObject;
    static toObject(includeInstance: boolean, msg: TrackRequest): TrackRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: TrackRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): TrackRequest;
    static deserializeBinaryFromReader(message: TrackRequest, reader: jspb.BinaryReader): TrackRequest;
}

export namespace TrackRequest {
    export type AsObject = {
        paymentHash: Uint8Array | string,
    }
}

export class TrackResponse extends jspb.Message { 
    getState(): InvoiceState;
    setState(value: InvoiceState): TrackResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): TrackResponse.AsObject;
    static toObject(includeInstance: boolean, msg: TrackResponse): TrackResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: TrackResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): TrackResponse;
    static deserializeBinaryFromReader(message: TrackResponse, reader: jspb.BinaryReader): TrackResponse;
}

export namespace TrackResponse {
    export type AsObject = {
        state: InvoiceState,
    }
}

export class TrackAllRequest extends jspb.Message { 
    clearPaymentHashesList(): void;
    getPaymentHashesList(): Array<Uint8Array | string>;
    getPaymentHashesList_asU8(): Array<Uint8Array>;
    getPaymentHashesList_asB64(): Array<string>;
    setPaymentHashesList(value: Array<Uint8Array | string>): TrackAllRequest;
    addPaymentHashes(value: Uint8Array | string, index?: number): Uint8Array | string;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): TrackAllRequest.AsObject;
    static toObject(includeInstance: boolean, msg: TrackAllRequest): TrackAllRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: TrackAllRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): TrackAllRequest;
    static deserializeBinaryFromReader(message: TrackAllRequest, reader: jspb.BinaryReader): TrackAllRequest;
}

export namespace TrackAllRequest {
    export type AsObject = {
        paymentHashesList: Array<Uint8Array | string>,
    }
}

export class TrackAllResponse extends jspb.Message { 
    getPaymentHash(): Uint8Array | string;
    getPaymentHash_asU8(): Uint8Array;
    getPaymentHash_asB64(): string;
    setPaymentHash(value: Uint8Array | string): TrackAllResponse;
    getBolt11(): string;
    setBolt11(value: string): TrackAllResponse;
    getState(): InvoiceState;
    setState(value: InvoiceState): TrackAllResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): TrackAllResponse.AsObject;
    static toObject(includeInstance: boolean, msg: TrackAllResponse): TrackAllResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: TrackAllResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): TrackAllResponse;
    static deserializeBinaryFromReader(message: TrackAllResponse, reader: jspb.BinaryReader): TrackAllResponse;
}

export namespace TrackAllResponse {
    export type AsObject = {
        paymentHash: Uint8Array | string,
        bolt11: string,
        state: InvoiceState,
    }
}

export class OnionMessage extends jspb.Message { 
    getId(): number;
    setId(value: number): OnionMessage;

    hasPathsecret(): boolean;
    clearPathsecret(): void;
    getPathsecret(): Uint8Array | string;
    getPathsecret_asU8(): Uint8Array;
    getPathsecret_asB64(): string;
    setPathsecret(value: Uint8Array | string): OnionMessage;

    hasReplyBlindedpath(): boolean;
    clearReplyBlindedpath(): void;
    getReplyBlindedpath(): OnionMessage.ReplyBlindedPath | undefined;
    setReplyBlindedpath(value?: OnionMessage.ReplyBlindedPath): OnionMessage;

    hasInvoiceRequest(): boolean;
    clearInvoiceRequest(): void;
    getInvoiceRequest(): Uint8Array | string;
    getInvoiceRequest_asU8(): Uint8Array;
    getInvoiceRequest_asB64(): string;
    setInvoiceRequest(value: Uint8Array | string): OnionMessage;

    hasInvoice(): boolean;
    clearInvoice(): void;
    getInvoice(): Uint8Array | string;
    getInvoice_asU8(): Uint8Array;
    getInvoice_asB64(): string;
    setInvoice(value: Uint8Array | string): OnionMessage;

    hasInvoiceError(): boolean;
    clearInvoiceError(): void;
    getInvoiceError(): Uint8Array | string;
    getInvoiceError_asU8(): Uint8Array;
    getInvoiceError_asB64(): string;
    setInvoiceError(value: Uint8Array | string): OnionMessage;
    clearUnknownFieldsList(): void;
    getUnknownFieldsList(): Array<OnionMessage.UnknownField>;
    setUnknownFieldsList(value: Array<OnionMessage.UnknownField>): OnionMessage;
    addUnknownFields(value?: OnionMessage.UnknownField, index?: number): OnionMessage.UnknownField;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): OnionMessage.AsObject;
    static toObject(includeInstance: boolean, msg: OnionMessage): OnionMessage.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: OnionMessage, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): OnionMessage;
    static deserializeBinaryFromReader(message: OnionMessage, reader: jspb.BinaryReader): OnionMessage;
}

export namespace OnionMessage {
    export type AsObject = {
        id: number,
        pathsecret: Uint8Array | string,
        replyBlindedpath?: OnionMessage.ReplyBlindedPath.AsObject,
        invoiceRequest: Uint8Array | string,
        invoice: Uint8Array | string,
        invoiceError: Uint8Array | string,
        unknownFieldsList: Array<OnionMessage.UnknownField.AsObject>,
    }


    export class ReplyBlindedPath extends jspb.Message { 

        hasFirstNodeId(): boolean;
        clearFirstNodeId(): void;
        getFirstNodeId(): Uint8Array | string;
        getFirstNodeId_asU8(): Uint8Array;
        getFirstNodeId_asB64(): string;
        setFirstNodeId(value: Uint8Array | string): ReplyBlindedPath;

        hasFirstScid(): boolean;
        clearFirstScid(): void;
        getFirstScid(): string | undefined;
        setFirstScid(value: string): ReplyBlindedPath;

        hasFirstScidDir(): boolean;
        clearFirstScidDir(): void;
        getFirstScidDir(): number | undefined;
        setFirstScidDir(value: number): ReplyBlindedPath;

        hasFirstPathKey(): boolean;
        clearFirstPathKey(): void;
        getFirstPathKey(): Uint8Array | string;
        getFirstPathKey_asU8(): Uint8Array;
        getFirstPathKey_asB64(): string;
        setFirstPathKey(value: Uint8Array | string): ReplyBlindedPath;
        clearHopsList(): void;
        getHopsList(): Array<OnionMessage.ReplyBlindedPath.Hop>;
        setHopsList(value: Array<OnionMessage.ReplyBlindedPath.Hop>): ReplyBlindedPath;
        addHops(value?: OnionMessage.ReplyBlindedPath.Hop, index?: number): OnionMessage.ReplyBlindedPath.Hop;

        serializeBinary(): Uint8Array;
        toObject(includeInstance?: boolean): ReplyBlindedPath.AsObject;
        static toObject(includeInstance: boolean, msg: ReplyBlindedPath): ReplyBlindedPath.AsObject;
        static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
        static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
        static serializeBinaryToWriter(message: ReplyBlindedPath, writer: jspb.BinaryWriter): void;
        static deserializeBinary(bytes: Uint8Array): ReplyBlindedPath;
        static deserializeBinaryFromReader(message: ReplyBlindedPath, reader: jspb.BinaryReader): ReplyBlindedPath;
    }

    export namespace ReplyBlindedPath {
        export type AsObject = {
            firstNodeId: Uint8Array | string,
            firstScid?: string,
            firstScidDir?: number,
            firstPathKey: Uint8Array | string,
            hopsList: Array<OnionMessage.ReplyBlindedPath.Hop.AsObject>,
        }


        export class Hop extends jspb.Message { 

            hasBlindedNodeId(): boolean;
            clearBlindedNodeId(): void;
            getBlindedNodeId(): Uint8Array | string;
            getBlindedNodeId_asU8(): Uint8Array;
            getBlindedNodeId_asB64(): string;
            setBlindedNodeId(value: Uint8Array | string): Hop;

            hasEncryptedRecipientData(): boolean;
            clearEncryptedRecipientData(): void;
            getEncryptedRecipientData(): Uint8Array | string;
            getEncryptedRecipientData_asU8(): Uint8Array;
            getEncryptedRecipientData_asB64(): string;
            setEncryptedRecipientData(value: Uint8Array | string): Hop;

            serializeBinary(): Uint8Array;
            toObject(includeInstance?: boolean): Hop.AsObject;
            static toObject(includeInstance: boolean, msg: Hop): Hop.AsObject;
            static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
            static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
            static serializeBinaryToWriter(message: Hop, writer: jspb.BinaryWriter): void;
            static deserializeBinary(bytes: Uint8Array): Hop;
            static deserializeBinaryFromReader(message: Hop, reader: jspb.BinaryReader): Hop;
        }

        export namespace Hop {
            export type AsObject = {
                blindedNodeId: Uint8Array | string,
                encryptedRecipientData: Uint8Array | string,
            }
        }

    }

    export class UnknownField extends jspb.Message { 
        getNumber(): number;
        setNumber(value: number): UnknownField;
        getValue(): Uint8Array | string;
        getValue_asU8(): Uint8Array;
        getValue_asB64(): string;
        setValue(value: Uint8Array | string): UnknownField;

        serializeBinary(): Uint8Array;
        toObject(includeInstance?: boolean): UnknownField.AsObject;
        static toObject(includeInstance: boolean, msg: UnknownField): UnknownField.AsObject;
        static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
        static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
        static serializeBinaryToWriter(message: UnknownField, writer: jspb.BinaryWriter): void;
        static deserializeBinary(bytes: Uint8Array): UnknownField;
        static deserializeBinaryFromReader(message: UnknownField, reader: jspb.BinaryReader): UnknownField;
    }

    export namespace UnknownField {
        export type AsObject = {
            number: number,
            value: Uint8Array | string,
        }
    }

}

export class OnionMessageResponse extends jspb.Message { 
    getId(): number;
    setId(value: number): OnionMessageResponse;
    getAction(): HookAction;
    setAction(value: HookAction): OnionMessageResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): OnionMessageResponse.AsObject;
    static toObject(includeInstance: boolean, msg: OnionMessageResponse): OnionMessageResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: OnionMessageResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): OnionMessageResponse;
    static deserializeBinaryFromReader(message: OnionMessageResponse, reader: jspb.BinaryReader): OnionMessageResponse;
}

export namespace OnionMessageResponse {
    export type AsObject = {
        id: number,
        action: HookAction,
    }
}

export enum HookAction {
    CONTINUE = 0,
    RESOLVE = 1,
}

export enum InvoiceState {
    UNPAID = 0,
    ACCEPTED = 1,
    PAID = 2,
    CANCELLED = 3,
}
