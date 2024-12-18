// package: invoicesrpc
// file: lnd/invoices.proto

/* tslint:disable */
/* eslint-disable */

import * as jspb from "google-protobuf";
import * as lnd_rpc_pb from "../lnd/rpc_pb";

export class CancelInvoiceMsg extends jspb.Message { 
    getPaymentHash(): Uint8Array | string;
    getPaymentHash_asU8(): Uint8Array;
    getPaymentHash_asB64(): string;
    setPaymentHash(value: Uint8Array | string): CancelInvoiceMsg;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): CancelInvoiceMsg.AsObject;
    static toObject(includeInstance: boolean, msg: CancelInvoiceMsg): CancelInvoiceMsg.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: CancelInvoiceMsg, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): CancelInvoiceMsg;
    static deserializeBinaryFromReader(message: CancelInvoiceMsg, reader: jspb.BinaryReader): CancelInvoiceMsg;
}

export namespace CancelInvoiceMsg {
    export type AsObject = {
        paymentHash: Uint8Array | string,
    }
}

export class CancelInvoiceResp extends jspb.Message { 

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): CancelInvoiceResp.AsObject;
    static toObject(includeInstance: boolean, msg: CancelInvoiceResp): CancelInvoiceResp.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: CancelInvoiceResp, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): CancelInvoiceResp;
    static deserializeBinaryFromReader(message: CancelInvoiceResp, reader: jspb.BinaryReader): CancelInvoiceResp;
}

export namespace CancelInvoiceResp {
    export type AsObject = {
    }
}

export class AddHoldInvoiceRequest extends jspb.Message { 
    getMemo(): string;
    setMemo(value: string): AddHoldInvoiceRequest;
    getHash(): Uint8Array | string;
    getHash_asU8(): Uint8Array;
    getHash_asB64(): string;
    setHash(value: Uint8Array | string): AddHoldInvoiceRequest;
    getValue(): number;
    setValue(value: number): AddHoldInvoiceRequest;
    getValueMsat(): number;
    setValueMsat(value: number): AddHoldInvoiceRequest;
    getDescriptionHash(): Uint8Array | string;
    getDescriptionHash_asU8(): Uint8Array;
    getDescriptionHash_asB64(): string;
    setDescriptionHash(value: Uint8Array | string): AddHoldInvoiceRequest;
    getExpiry(): number;
    setExpiry(value: number): AddHoldInvoiceRequest;
    getFallbackAddr(): string;
    setFallbackAddr(value: string): AddHoldInvoiceRequest;
    getCltvExpiry(): number;
    setCltvExpiry(value: number): AddHoldInvoiceRequest;
    clearRouteHintsList(): void;
    getRouteHintsList(): Array<lnd_rpc_pb.RouteHint>;
    setRouteHintsList(value: Array<lnd_rpc_pb.RouteHint>): AddHoldInvoiceRequest;
    addRouteHints(value?: lnd_rpc_pb.RouteHint, index?: number): lnd_rpc_pb.RouteHint;
    getPrivate(): boolean;
    setPrivate(value: boolean): AddHoldInvoiceRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): AddHoldInvoiceRequest.AsObject;
    static toObject(includeInstance: boolean, msg: AddHoldInvoiceRequest): AddHoldInvoiceRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: AddHoldInvoiceRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): AddHoldInvoiceRequest;
    static deserializeBinaryFromReader(message: AddHoldInvoiceRequest, reader: jspb.BinaryReader): AddHoldInvoiceRequest;
}

export namespace AddHoldInvoiceRequest {
    export type AsObject = {
        memo: string,
        hash: Uint8Array | string,
        value: number,
        valueMsat: number,
        descriptionHash: Uint8Array | string,
        expiry: number,
        fallbackAddr: string,
        cltvExpiry: number,
        routeHintsList: Array<lnd_rpc_pb.RouteHint.AsObject>,
        pb_private: boolean,
    }
}

export class AddHoldInvoiceResp extends jspb.Message { 
    getPaymentRequest(): string;
    setPaymentRequest(value: string): AddHoldInvoiceResp;
    getAddIndex(): number;
    setAddIndex(value: number): AddHoldInvoiceResp;
    getPaymentAddr(): Uint8Array | string;
    getPaymentAddr_asU8(): Uint8Array;
    getPaymentAddr_asB64(): string;
    setPaymentAddr(value: Uint8Array | string): AddHoldInvoiceResp;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): AddHoldInvoiceResp.AsObject;
    static toObject(includeInstance: boolean, msg: AddHoldInvoiceResp): AddHoldInvoiceResp.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: AddHoldInvoiceResp, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): AddHoldInvoiceResp;
    static deserializeBinaryFromReader(message: AddHoldInvoiceResp, reader: jspb.BinaryReader): AddHoldInvoiceResp;
}

export namespace AddHoldInvoiceResp {
    export type AsObject = {
        paymentRequest: string,
        addIndex: number,
        paymentAddr: Uint8Array | string,
    }
}

export class SettleInvoiceMsg extends jspb.Message { 
    getPreimage(): Uint8Array | string;
    getPreimage_asU8(): Uint8Array;
    getPreimage_asB64(): string;
    setPreimage(value: Uint8Array | string): SettleInvoiceMsg;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): SettleInvoiceMsg.AsObject;
    static toObject(includeInstance: boolean, msg: SettleInvoiceMsg): SettleInvoiceMsg.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: SettleInvoiceMsg, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): SettleInvoiceMsg;
    static deserializeBinaryFromReader(message: SettleInvoiceMsg, reader: jspb.BinaryReader): SettleInvoiceMsg;
}

export namespace SettleInvoiceMsg {
    export type AsObject = {
        preimage: Uint8Array | string,
    }
}

export class SettleInvoiceResp extends jspb.Message { 

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): SettleInvoiceResp.AsObject;
    static toObject(includeInstance: boolean, msg: SettleInvoiceResp): SettleInvoiceResp.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: SettleInvoiceResp, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): SettleInvoiceResp;
    static deserializeBinaryFromReader(message: SettleInvoiceResp, reader: jspb.BinaryReader): SettleInvoiceResp;
}

export namespace SettleInvoiceResp {
    export type AsObject = {
    }
}

export class SubscribeSingleInvoiceRequest extends jspb.Message { 
    getRHash(): Uint8Array | string;
    getRHash_asU8(): Uint8Array;
    getRHash_asB64(): string;
    setRHash(value: Uint8Array | string): SubscribeSingleInvoiceRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): SubscribeSingleInvoiceRequest.AsObject;
    static toObject(includeInstance: boolean, msg: SubscribeSingleInvoiceRequest): SubscribeSingleInvoiceRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: SubscribeSingleInvoiceRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): SubscribeSingleInvoiceRequest;
    static deserializeBinaryFromReader(message: SubscribeSingleInvoiceRequest, reader: jspb.BinaryReader): SubscribeSingleInvoiceRequest;
}

export namespace SubscribeSingleInvoiceRequest {
    export type AsObject = {
        rHash: Uint8Array | string,
    }
}

export class LookupInvoiceMsg extends jspb.Message { 

    hasPaymentHash(): boolean;
    clearPaymentHash(): void;
    getPaymentHash(): Uint8Array | string;
    getPaymentHash_asU8(): Uint8Array;
    getPaymentHash_asB64(): string;
    setPaymentHash(value: Uint8Array | string): LookupInvoiceMsg;

    hasPaymentAddr(): boolean;
    clearPaymentAddr(): void;
    getPaymentAddr(): Uint8Array | string;
    getPaymentAddr_asU8(): Uint8Array;
    getPaymentAddr_asB64(): string;
    setPaymentAddr(value: Uint8Array | string): LookupInvoiceMsg;

    hasSetId(): boolean;
    clearSetId(): void;
    getSetId(): Uint8Array | string;
    getSetId_asU8(): Uint8Array;
    getSetId_asB64(): string;
    setSetId(value: Uint8Array | string): LookupInvoiceMsg;
    getLookupModifier(): LookupModifier;
    setLookupModifier(value: LookupModifier): LookupInvoiceMsg;

    getInvoiceRefCase(): LookupInvoiceMsg.InvoiceRefCase;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): LookupInvoiceMsg.AsObject;
    static toObject(includeInstance: boolean, msg: LookupInvoiceMsg): LookupInvoiceMsg.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: LookupInvoiceMsg, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): LookupInvoiceMsg;
    static deserializeBinaryFromReader(message: LookupInvoiceMsg, reader: jspb.BinaryReader): LookupInvoiceMsg;
}

export namespace LookupInvoiceMsg {
    export type AsObject = {
        paymentHash: Uint8Array | string,
        paymentAddr: Uint8Array | string,
        setId: Uint8Array | string,
        lookupModifier: LookupModifier,
    }

    export enum InvoiceRefCase {
        INVOICE_REF_NOT_SET = 0,
        PAYMENT_HASH = 1,
        PAYMENT_ADDR = 2,
        SET_ID = 3,
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

export class HtlcModifyRequest extends jspb.Message { 

    hasInvoice(): boolean;
    clearInvoice(): void;
    getInvoice(): lnd_rpc_pb.Invoice | undefined;
    setInvoice(value?: lnd_rpc_pb.Invoice): HtlcModifyRequest;

    hasExitHtlcCircuitKey(): boolean;
    clearExitHtlcCircuitKey(): void;
    getExitHtlcCircuitKey(): CircuitKey | undefined;
    setExitHtlcCircuitKey(value?: CircuitKey): HtlcModifyRequest;
    getExitHtlcAmt(): number;
    setExitHtlcAmt(value: number): HtlcModifyRequest;
    getExitHtlcExpiry(): number;
    setExitHtlcExpiry(value: number): HtlcModifyRequest;
    getCurrentHeight(): number;
    setCurrentHeight(value: number): HtlcModifyRequest;

    getExitHtlcWireCustomRecordsMap(): jspb.Map<number, Uint8Array | string>;
    clearExitHtlcWireCustomRecordsMap(): void;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): HtlcModifyRequest.AsObject;
    static toObject(includeInstance: boolean, msg: HtlcModifyRequest): HtlcModifyRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: HtlcModifyRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): HtlcModifyRequest;
    static deserializeBinaryFromReader(message: HtlcModifyRequest, reader: jspb.BinaryReader): HtlcModifyRequest;
}

export namespace HtlcModifyRequest {
    export type AsObject = {
        invoice?: lnd_rpc_pb.Invoice.AsObject,
        exitHtlcCircuitKey?: CircuitKey.AsObject,
        exitHtlcAmt: number,
        exitHtlcExpiry: number,
        currentHeight: number,

        exitHtlcWireCustomRecordsMap: Array<[number, Uint8Array | string]>,
    }
}

export class HtlcModifyResponse extends jspb.Message { 

    hasCircuitKey(): boolean;
    clearCircuitKey(): void;
    getCircuitKey(): CircuitKey | undefined;
    setCircuitKey(value?: CircuitKey): HtlcModifyResponse;

    hasAmtPaid(): boolean;
    clearAmtPaid(): void;
    getAmtPaid(): number | undefined;
    setAmtPaid(value: number): HtlcModifyResponse;
    getCancelSet(): boolean;
    setCancelSet(value: boolean): HtlcModifyResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): HtlcModifyResponse.AsObject;
    static toObject(includeInstance: boolean, msg: HtlcModifyResponse): HtlcModifyResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: HtlcModifyResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): HtlcModifyResponse;
    static deserializeBinaryFromReader(message: HtlcModifyResponse, reader: jspb.BinaryReader): HtlcModifyResponse;
}

export namespace HtlcModifyResponse {
    export type AsObject = {
        circuitKey?: CircuitKey.AsObject,
        amtPaid?: number,
        cancelSet: boolean,
    }
}

export enum LookupModifier {
    DEFAULT = 0,
    HTLC_SET_ONLY = 1,
    HTLC_SET_BLANK = 2,
}
