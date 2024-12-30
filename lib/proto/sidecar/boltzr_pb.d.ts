// package: boltzr
// file: boltzr.proto

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

export class SetLogLevelRequest extends jspb.Message { 
    getLevel(): LogLevel;
    setLevel(value: LogLevel): SetLogLevelRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): SetLogLevelRequest.AsObject;
    static toObject(includeInstance: boolean, msg: SetLogLevelRequest): SetLogLevelRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: SetLogLevelRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): SetLogLevelRequest;
    static deserializeBinaryFromReader(message: SetLogLevelRequest, reader: jspb.BinaryReader): SetLogLevelRequest;
}

export namespace SetLogLevelRequest {
    export type AsObject = {
        level: LogLevel,
    }
}

export class SetLogLevelResponse extends jspb.Message { 

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): SetLogLevelResponse.AsObject;
    static toObject(includeInstance: boolean, msg: SetLogLevelResponse): SetLogLevelResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: SetLogLevelResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): SetLogLevelResponse;
    static deserializeBinaryFromReader(message: SetLogLevelResponse, reader: jspb.BinaryReader): SetLogLevelResponse;
}

export namespace SetLogLevelResponse {
    export type AsObject = {
    }
}

export class SendMessageRequest extends jspb.Message { 
    getMessage(): string;
    setMessage(value: string): SendMessageRequest;

    hasIsImportant(): boolean;
    clearIsImportant(): void;
    getIsImportant(): boolean | undefined;
    setIsImportant(value: boolean): SendMessageRequest;

    hasSendAlert(): boolean;
    clearSendAlert(): void;
    getSendAlert(): boolean | undefined;
    setSendAlert(value: boolean): SendMessageRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): SendMessageRequest.AsObject;
    static toObject(includeInstance: boolean, msg: SendMessageRequest): SendMessageRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: SendMessageRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): SendMessageRequest;
    static deserializeBinaryFromReader(message: SendMessageRequest, reader: jspb.BinaryReader): SendMessageRequest;
}

export namespace SendMessageRequest {
    export type AsObject = {
        message: string,
        isImportant?: boolean,
        sendAlert?: boolean,
    }
}

export class SendMessageResponse extends jspb.Message { 

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): SendMessageResponse.AsObject;
    static toObject(includeInstance: boolean, msg: SendMessageResponse): SendMessageResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: SendMessageResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): SendMessageResponse;
    static deserializeBinaryFromReader(message: SendMessageResponse, reader: jspb.BinaryReader): SendMessageResponse;
}

export namespace SendMessageResponse {
    export type AsObject = {
    }
}

export class GetMessagesRequest extends jspb.Message { 

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): GetMessagesRequest.AsObject;
    static toObject(includeInstance: boolean, msg: GetMessagesRequest): GetMessagesRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: GetMessagesRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): GetMessagesRequest;
    static deserializeBinaryFromReader(message: GetMessagesRequest, reader: jspb.BinaryReader): GetMessagesRequest;
}

export namespace GetMessagesRequest {
    export type AsObject = {
    }
}

export class GetMessagesResponse extends jspb.Message { 
    getMessage(): string;
    setMessage(value: string): GetMessagesResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): GetMessagesResponse.AsObject;
    static toObject(includeInstance: boolean, msg: GetMessagesResponse): GetMessagesResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: GetMessagesResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): GetMessagesResponse;
    static deserializeBinaryFromReader(message: GetMessagesResponse, reader: jspb.BinaryReader): GetMessagesResponse;
}

export namespace GetMessagesResponse {
    export type AsObject = {
        message: string,
    }
}

export class SwapUpdate extends jspb.Message { 
    getId(): string;
    setId(value: string): SwapUpdate;
    getStatus(): string;
    setStatus(value: string): SwapUpdate;

    hasZeroConfRejected(): boolean;
    clearZeroConfRejected(): void;
    getZeroConfRejected(): boolean | undefined;
    setZeroConfRejected(value: boolean): SwapUpdate;

    hasTransactionInfo(): boolean;
    clearTransactionInfo(): void;
    getTransactionInfo(): SwapUpdate.TransactionInfo | undefined;
    setTransactionInfo(value?: SwapUpdate.TransactionInfo): SwapUpdate;

    hasFailureReason(): boolean;
    clearFailureReason(): void;
    getFailureReason(): string | undefined;
    setFailureReason(value: string): SwapUpdate;

    hasFailureDetails(): boolean;
    clearFailureDetails(): void;
    getFailureDetails(): SwapUpdate.FailureDetails | undefined;
    setFailureDetails(value?: SwapUpdate.FailureDetails): SwapUpdate;

    hasChannelInfo(): boolean;
    clearChannelInfo(): void;
    getChannelInfo(): SwapUpdate.ChannelInfo | undefined;
    setChannelInfo(value?: SwapUpdate.ChannelInfo): SwapUpdate;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): SwapUpdate.AsObject;
    static toObject(includeInstance: boolean, msg: SwapUpdate): SwapUpdate.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: SwapUpdate, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): SwapUpdate;
    static deserializeBinaryFromReader(message: SwapUpdate, reader: jspb.BinaryReader): SwapUpdate;
}

export namespace SwapUpdate {
    export type AsObject = {
        id: string,
        status: string,
        zeroConfRejected?: boolean,
        transactionInfo?: SwapUpdate.TransactionInfo.AsObject,
        failureReason?: string,
        failureDetails?: SwapUpdate.FailureDetails.AsObject,
        channelInfo?: SwapUpdate.ChannelInfo.AsObject,
    }


    export class TransactionInfo extends jspb.Message { 
        getId(): string;
        setId(value: string): TransactionInfo;

        hasHex(): boolean;
        clearHex(): void;
        getHex(): string | undefined;
        setHex(value: string): TransactionInfo;

        hasEta(): boolean;
        clearEta(): void;
        getEta(): number | undefined;
        setEta(value: number): TransactionInfo;

        serializeBinary(): Uint8Array;
        toObject(includeInstance?: boolean): TransactionInfo.AsObject;
        static toObject(includeInstance: boolean, msg: TransactionInfo): TransactionInfo.AsObject;
        static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
        static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
        static serializeBinaryToWriter(message: TransactionInfo, writer: jspb.BinaryWriter): void;
        static deserializeBinary(bytes: Uint8Array): TransactionInfo;
        static deserializeBinaryFromReader(message: TransactionInfo, reader: jspb.BinaryReader): TransactionInfo;
    }

    export namespace TransactionInfo {
        export type AsObject = {
            id: string,
            hex?: string,
            eta?: number,
        }
    }

    export class FailureDetails extends jspb.Message { 
        getExpected(): number;
        setExpected(value: number): FailureDetails;
        getActual(): number;
        setActual(value: number): FailureDetails;

        serializeBinary(): Uint8Array;
        toObject(includeInstance?: boolean): FailureDetails.AsObject;
        static toObject(includeInstance: boolean, msg: FailureDetails): FailureDetails.AsObject;
        static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
        static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
        static serializeBinaryToWriter(message: FailureDetails, writer: jspb.BinaryWriter): void;
        static deserializeBinary(bytes: Uint8Array): FailureDetails;
        static deserializeBinaryFromReader(message: FailureDetails, reader: jspb.BinaryReader): FailureDetails;
    }

    export namespace FailureDetails {
        export type AsObject = {
            expected: number,
            actual: number,
        }
    }

    export class ChannelInfo extends jspb.Message { 
        getFundingTransactionId(): string;
        setFundingTransactionId(value: string): ChannelInfo;
        getFundingTransactionVout(): number;
        setFundingTransactionVout(value: number): ChannelInfo;

        serializeBinary(): Uint8Array;
        toObject(includeInstance?: boolean): ChannelInfo.AsObject;
        static toObject(includeInstance: boolean, msg: ChannelInfo): ChannelInfo.AsObject;
        static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
        static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
        static serializeBinaryToWriter(message: ChannelInfo, writer: jspb.BinaryWriter): void;
        static deserializeBinary(bytes: Uint8Array): ChannelInfo;
        static deserializeBinaryFromReader(message: ChannelInfo, reader: jspb.BinaryReader): ChannelInfo;
    }

    export namespace ChannelInfo {
        export type AsObject = {
            fundingTransactionId: string,
            fundingTransactionVout: number,
        }
    }

}

export class SwapUpdateRequest extends jspb.Message { 
    clearStatusList(): void;
    getStatusList(): Array<SwapUpdate>;
    setStatusList(value: Array<SwapUpdate>): SwapUpdateRequest;
    addStatus(value?: SwapUpdate, index?: number): SwapUpdate;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): SwapUpdateRequest.AsObject;
    static toObject(includeInstance: boolean, msg: SwapUpdateRequest): SwapUpdateRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: SwapUpdateRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): SwapUpdateRequest;
    static deserializeBinaryFromReader(message: SwapUpdateRequest, reader: jspb.BinaryReader): SwapUpdateRequest;
}

export namespace SwapUpdateRequest {
    export type AsObject = {
        statusList: Array<SwapUpdate.AsObject>,
    }
}

export class SwapUpdateResponse extends jspb.Message { 
    clearIdsList(): void;
    getIdsList(): Array<string>;
    setIdsList(value: Array<string>): SwapUpdateResponse;
    addIds(value: string, index?: number): string;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): SwapUpdateResponse.AsObject;
    static toObject(includeInstance: boolean, msg: SwapUpdateResponse): SwapUpdateResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: SwapUpdateResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): SwapUpdateResponse;
    static deserializeBinaryFromReader(message: SwapUpdateResponse, reader: jspb.BinaryReader): SwapUpdateResponse;
}

export namespace SwapUpdateResponse {
    export type AsObject = {
        idsList: Array<string>,
    }
}

export class SendSwapUpdateRequest extends jspb.Message { 

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): SendSwapUpdateRequest.AsObject;
    static toObject(includeInstance: boolean, msg: SendSwapUpdateRequest): SendSwapUpdateRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: SendSwapUpdateRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): SendSwapUpdateRequest;
    static deserializeBinaryFromReader(message: SendSwapUpdateRequest, reader: jspb.BinaryReader): SendSwapUpdateRequest;
}

export namespace SendSwapUpdateRequest {
    export type AsObject = {
    }
}

export class SendSwapUpdateResponse extends jspb.Message { 

    hasUpdate(): boolean;
    clearUpdate(): void;
    getUpdate(): SwapUpdate | undefined;
    setUpdate(value?: SwapUpdate): SendSwapUpdateResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): SendSwapUpdateResponse.AsObject;
    static toObject(includeInstance: boolean, msg: SendSwapUpdateResponse): SendSwapUpdateResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: SendSwapUpdateResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): SendSwapUpdateResponse;
    static deserializeBinaryFromReader(message: SendSwapUpdateResponse, reader: jspb.BinaryReader): SendSwapUpdateResponse;
}

export namespace SendSwapUpdateResponse {
    export type AsObject = {
        update?: SwapUpdate.AsObject,
    }
}

export class StartWebHookRetriesRequest extends jspb.Message { 

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): StartWebHookRetriesRequest.AsObject;
    static toObject(includeInstance: boolean, msg: StartWebHookRetriesRequest): StartWebHookRetriesRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: StartWebHookRetriesRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): StartWebHookRetriesRequest;
    static deserializeBinaryFromReader(message: StartWebHookRetriesRequest, reader: jspb.BinaryReader): StartWebHookRetriesRequest;
}

export namespace StartWebHookRetriesRequest {
    export type AsObject = {
    }
}

export class StartWebHookRetriesResponse extends jspb.Message { 

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): StartWebHookRetriesResponse.AsObject;
    static toObject(includeInstance: boolean, msg: StartWebHookRetriesResponse): StartWebHookRetriesResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: StartWebHookRetriesResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): StartWebHookRetriesResponse;
    static deserializeBinaryFromReader(message: StartWebHookRetriesResponse, reader: jspb.BinaryReader): StartWebHookRetriesResponse;
}

export namespace StartWebHookRetriesResponse {
    export type AsObject = {
    }
}

export class CreateWebHookRequest extends jspb.Message { 
    getId(): string;
    setId(value: string): CreateWebHookRequest;
    getUrl(): string;
    setUrl(value: string): CreateWebHookRequest;
    getHashSwapId(): boolean;
    setHashSwapId(value: boolean): CreateWebHookRequest;
    clearStatusList(): void;
    getStatusList(): Array<string>;
    setStatusList(value: Array<string>): CreateWebHookRequest;
    addStatus(value: string, index?: number): string;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): CreateWebHookRequest.AsObject;
    static toObject(includeInstance: boolean, msg: CreateWebHookRequest): CreateWebHookRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: CreateWebHookRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): CreateWebHookRequest;
    static deserializeBinaryFromReader(message: CreateWebHookRequest, reader: jspb.BinaryReader): CreateWebHookRequest;
}

export namespace CreateWebHookRequest {
    export type AsObject = {
        id: string,
        url: string,
        hashSwapId: boolean,
        statusList: Array<string>,
    }
}

export class CreateWebHookResponse extends jspb.Message { 

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): CreateWebHookResponse.AsObject;
    static toObject(includeInstance: boolean, msg: CreateWebHookResponse): CreateWebHookResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: CreateWebHookResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): CreateWebHookResponse;
    static deserializeBinaryFromReader(message: CreateWebHookResponse, reader: jspb.BinaryReader): CreateWebHookResponse;
}

export namespace CreateWebHookResponse {
    export type AsObject = {
    }
}

export class SendWebHookRequest extends jspb.Message { 
    getId(): string;
    setId(value: string): SendWebHookRequest;
    getStatus(): string;
    setStatus(value: string): SendWebHookRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): SendWebHookRequest.AsObject;
    static toObject(includeInstance: boolean, msg: SendWebHookRequest): SendWebHookRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: SendWebHookRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): SendWebHookRequest;
    static deserializeBinaryFromReader(message: SendWebHookRequest, reader: jspb.BinaryReader): SendWebHookRequest;
}

export namespace SendWebHookRequest {
    export type AsObject = {
        id: string,
        status: string,
    }
}

export class SendWebHookResponse extends jspb.Message { 
    getOk(): boolean;
    setOk(value: boolean): SendWebHookResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): SendWebHookResponse.AsObject;
    static toObject(includeInstance: boolean, msg: SendWebHookResponse): SendWebHookResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: SendWebHookResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): SendWebHookResponse;
    static deserializeBinaryFromReader(message: SendWebHookResponse, reader: jspb.BinaryReader): SendWebHookResponse;
}

export namespace SendWebHookResponse {
    export type AsObject = {
        ok: boolean,
    }
}

export class SignEvmRefundRequest extends jspb.Message { 
    getPreimageHash(): Uint8Array | string;
    getPreimageHash_asU8(): Uint8Array;
    getPreimageHash_asB64(): string;
    setPreimageHash(value: Uint8Array | string): SignEvmRefundRequest;
    getAmount(): string;
    setAmount(value: string): SignEvmRefundRequest;

    hasTokenAddress(): boolean;
    clearTokenAddress(): void;
    getTokenAddress(): string | undefined;
    setTokenAddress(value: string): SignEvmRefundRequest;
    getTimeout(): number;
    setTimeout(value: number): SignEvmRefundRequest;

    hasAddress(): boolean;
    clearAddress(): void;
    getAddress(): string;
    setAddress(value: string): SignEvmRefundRequest;

    hasVersion(): boolean;
    clearVersion(): void;
    getVersion(): number;
    setVersion(value: number): SignEvmRefundRequest;

    getContractCase(): SignEvmRefundRequest.ContractCase;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): SignEvmRefundRequest.AsObject;
    static toObject(includeInstance: boolean, msg: SignEvmRefundRequest): SignEvmRefundRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: SignEvmRefundRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): SignEvmRefundRequest;
    static deserializeBinaryFromReader(message: SignEvmRefundRequest, reader: jspb.BinaryReader): SignEvmRefundRequest;
}

export namespace SignEvmRefundRequest {
    export type AsObject = {
        preimageHash: Uint8Array | string,
        amount: string,
        tokenAddress?: string,
        timeout: number,
        address: string,
        version: number,
    }

    export enum ContractCase {
        CONTRACT_NOT_SET = 0,
        ADDRESS = 5,
        VERSION = 6,
    }

}

export class SignEvmRefundResponse extends jspb.Message { 
    getSignature(): Uint8Array | string;
    getSignature_asU8(): Uint8Array;
    getSignature_asB64(): string;
    setSignature(value: Uint8Array | string): SignEvmRefundResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): SignEvmRefundResponse.AsObject;
    static toObject(includeInstance: boolean, msg: SignEvmRefundResponse): SignEvmRefundResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: SignEvmRefundResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): SignEvmRefundResponse;
    static deserializeBinaryFromReader(message: SignEvmRefundResponse, reader: jspb.BinaryReader): SignEvmRefundResponse;
}

export namespace SignEvmRefundResponse {
    export type AsObject = {
        signature: Uint8Array | string,
    }
}

export class DecodeInvoiceOrOfferRequest extends jspb.Message { 
    getInvoiceOrOffer(): string;
    setInvoiceOrOffer(value: string): DecodeInvoiceOrOfferRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): DecodeInvoiceOrOfferRequest.AsObject;
    static toObject(includeInstance: boolean, msg: DecodeInvoiceOrOfferRequest): DecodeInvoiceOrOfferRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: DecodeInvoiceOrOfferRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): DecodeInvoiceOrOfferRequest;
    static deserializeBinaryFromReader(message: DecodeInvoiceOrOfferRequest, reader: jspb.BinaryReader): DecodeInvoiceOrOfferRequest;
}

export namespace DecodeInvoiceOrOfferRequest {
    export type AsObject = {
        invoiceOrOffer: string,
    }
}

export class Bolt11Invoice extends jspb.Message { 
    getPayeePubkey(): Uint8Array | string;
    getPayeePubkey_asU8(): Uint8Array;
    getPayeePubkey_asB64(): string;
    setPayeePubkey(value: Uint8Array | string): Bolt11Invoice;

    hasMsat(): boolean;
    clearMsat(): void;
    getMsat(): number | undefined;
    setMsat(value: number): Bolt11Invoice;
    getPaymentHash(): Uint8Array | string;
    getPaymentHash_asU8(): Uint8Array;
    getPaymentHash_asB64(): string;
    setPaymentHash(value: Uint8Array | string): Bolt11Invoice;

    hasMemo(): boolean;
    clearMemo(): void;
    getMemo(): string;
    setMemo(value: string): Bolt11Invoice;

    hasDescriptionHash(): boolean;
    clearDescriptionHash(): void;
    getDescriptionHash(): Uint8Array | string;
    getDescriptionHash_asU8(): Uint8Array;
    getDescriptionHash_asB64(): string;
    setDescriptionHash(value: Uint8Array | string): Bolt11Invoice;
    getCreatedAt(): number;
    setCreatedAt(value: number): Bolt11Invoice;
    getExpiry(): number;
    setExpiry(value: number): Bolt11Invoice;
    getMinFinalCltvExpiry(): number;
    setMinFinalCltvExpiry(value: number): Bolt11Invoice;
    clearHintsList(): void;
    getHintsList(): Array<Bolt11Invoice.RoutingHints>;
    setHintsList(value: Array<Bolt11Invoice.RoutingHints>): Bolt11Invoice;
    addHints(value?: Bolt11Invoice.RoutingHints, index?: number): Bolt11Invoice.RoutingHints;
    clearFeaturesList(): void;
    getFeaturesList(): Array<Feature>;
    setFeaturesList(value: Array<Feature>): Bolt11Invoice;
    addFeatures(value: Feature, index?: number): Feature;

    getDescriptionCase(): Bolt11Invoice.DescriptionCase;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): Bolt11Invoice.AsObject;
    static toObject(includeInstance: boolean, msg: Bolt11Invoice): Bolt11Invoice.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: Bolt11Invoice, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): Bolt11Invoice;
    static deserializeBinaryFromReader(message: Bolt11Invoice, reader: jspb.BinaryReader): Bolt11Invoice;
}

export namespace Bolt11Invoice {
    export type AsObject = {
        payeePubkey: Uint8Array | string,
        msat?: number,
        paymentHash: Uint8Array | string,
        memo: string,
        descriptionHash: Uint8Array | string,
        createdAt: number,
        expiry: number,
        minFinalCltvExpiry: number,
        hintsList: Array<Bolt11Invoice.RoutingHints.AsObject>,
        featuresList: Array<Feature>,
    }


    export class RoutingHints extends jspb.Message { 
        clearHopsList(): void;
        getHopsList(): Array<Bolt11Invoice.RoutingHints.RoutingHint>;
        setHopsList(value: Array<Bolt11Invoice.RoutingHints.RoutingHint>): RoutingHints;
        addHops(value?: Bolt11Invoice.RoutingHints.RoutingHint, index?: number): Bolt11Invoice.RoutingHints.RoutingHint;

        serializeBinary(): Uint8Array;
        toObject(includeInstance?: boolean): RoutingHints.AsObject;
        static toObject(includeInstance: boolean, msg: RoutingHints): RoutingHints.AsObject;
        static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
        static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
        static serializeBinaryToWriter(message: RoutingHints, writer: jspb.BinaryWriter): void;
        static deserializeBinary(bytes: Uint8Array): RoutingHints;
        static deserializeBinaryFromReader(message: RoutingHints, reader: jspb.BinaryReader): RoutingHints;
    }

    export namespace RoutingHints {
        export type AsObject = {
            hopsList: Array<Bolt11Invoice.RoutingHints.RoutingHint.AsObject>,
        }


        export class RoutingHint extends jspb.Message { 
            getNode(): Uint8Array | string;
            getNode_asU8(): Uint8Array;
            getNode_asB64(): string;
            setNode(value: Uint8Array | string): RoutingHint;
            getChannelId(): number;
            setChannelId(value: number): RoutingHint;
            getBaseFeeMsat(): number;
            setBaseFeeMsat(value: number): RoutingHint;
            getPpmFee(): number;
            setPpmFee(value: number): RoutingHint;
            getCltvExpiryDelta(): number;
            setCltvExpiryDelta(value: number): RoutingHint;

            hasHtlcMinimumMsat(): boolean;
            clearHtlcMinimumMsat(): void;
            getHtlcMinimumMsat(): number | undefined;
            setHtlcMinimumMsat(value: number): RoutingHint;

            hasHtlcMaximumMsat(): boolean;
            clearHtlcMaximumMsat(): void;
            getHtlcMaximumMsat(): number | undefined;
            setHtlcMaximumMsat(value: number): RoutingHint;

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
                node: Uint8Array | string,
                channelId: number,
                baseFeeMsat: number,
                ppmFee: number,
                cltvExpiryDelta: number,
                htlcMinimumMsat?: number,
                htlcMaximumMsat?: number,
            }
        }

    }


    export enum DescriptionCase {
        DESCRIPTION_NOT_SET = 0,
        MEMO = 4,
        DESCRIPTION_HASH = 5,
    }

}

export class Bolt12Offer extends jspb.Message { 
    getId(): Uint8Array | string;
    getId_asU8(): Uint8Array;
    getId_asB64(): string;
    setId(value: Uint8Array | string): Bolt12Offer;

    hasSigningPubkey(): boolean;
    clearSigningPubkey(): void;
    getSigningPubkey(): Uint8Array | string;
    getSigningPubkey_asU8(): Uint8Array;
    getSigningPubkey_asB64(): string;
    setSigningPubkey(value: Uint8Array | string): Bolt12Offer;

    hasDescription(): boolean;
    clearDescription(): void;
    getDescription(): string | undefined;
    setDescription(value: string): Bolt12Offer;

    hasMinAmountMsat(): boolean;
    clearMinAmountMsat(): void;
    getMinAmountMsat(): number | undefined;
    setMinAmountMsat(value: number): Bolt12Offer;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): Bolt12Offer.AsObject;
    static toObject(includeInstance: boolean, msg: Bolt12Offer): Bolt12Offer.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: Bolt12Offer, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): Bolt12Offer;
    static deserializeBinaryFromReader(message: Bolt12Offer, reader: jspb.BinaryReader): Bolt12Offer;
}

export namespace Bolt12Offer {
    export type AsObject = {
        id: Uint8Array | string,
        signingPubkey: Uint8Array | string,
        description?: string,
        minAmountMsat?: number,
    }
}

export class Bolt12Invoice extends jspb.Message { 
    getSigningPubkey(): Uint8Array | string;
    getSigningPubkey_asU8(): Uint8Array;
    getSigningPubkey_asB64(): string;
    setSigningPubkey(value: Uint8Array | string): Bolt12Invoice;

    hasMsat(): boolean;
    clearMsat(): void;
    getMsat(): number | undefined;
    setMsat(value: number): Bolt12Invoice;
    getPaymentHash(): Uint8Array | string;
    getPaymentHash_asU8(): Uint8Array;
    getPaymentHash_asB64(): string;
    setPaymentHash(value: Uint8Array | string): Bolt12Invoice;

    hasDescription(): boolean;
    clearDescription(): void;
    getDescription(): string | undefined;
    setDescription(value: string): Bolt12Invoice;
    getCreatedAt(): number;
    setCreatedAt(value: number): Bolt12Invoice;
    getExpiry(): number;
    setExpiry(value: number): Bolt12Invoice;
    clearPathsList(): void;
    getPathsList(): Array<Bolt12Invoice.Path>;
    setPathsList(value: Array<Bolt12Invoice.Path>): Bolt12Invoice;
    addPaths(value?: Bolt12Invoice.Path, index?: number): Bolt12Invoice.Path;
    clearFeaturesList(): void;
    getFeaturesList(): Array<Feature>;
    setFeaturesList(value: Array<Feature>): Bolt12Invoice;
    addFeatures(value: Feature, index?: number): Feature;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): Bolt12Invoice.AsObject;
    static toObject(includeInstance: boolean, msg: Bolt12Invoice): Bolt12Invoice.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: Bolt12Invoice, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): Bolt12Invoice;
    static deserializeBinaryFromReader(message: Bolt12Invoice, reader: jspb.BinaryReader): Bolt12Invoice;
}

export namespace Bolt12Invoice {
    export type AsObject = {
        signingPubkey: Uint8Array | string,
        msat?: number,
        paymentHash: Uint8Array | string,
        description?: string,
        createdAt: number,
        expiry: number,
        pathsList: Array<Bolt12Invoice.Path.AsObject>,
        featuresList: Array<Feature>,
    }


    export class Path extends jspb.Message { 

        hasFirstNodePubkey(): boolean;
        clearFirstNodePubkey(): void;
        getFirstNodePubkey(): Uint8Array | string;
        getFirstNodePubkey_asU8(): Uint8Array;
        getFirstNodePubkey_asB64(): string;
        setFirstNodePubkey(value: Uint8Array | string): Path;
        getBaseFeeMsat(): number;
        setBaseFeeMsat(value: number): Path;
        getPpmFee(): number;
        setPpmFee(value: number): Path;
        getCltvExpiryDelta(): number;
        setCltvExpiryDelta(value: number): Path;

        serializeBinary(): Uint8Array;
        toObject(includeInstance?: boolean): Path.AsObject;
        static toObject(includeInstance: boolean, msg: Path): Path.AsObject;
        static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
        static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
        static serializeBinaryToWriter(message: Path, writer: jspb.BinaryWriter): void;
        static deserializeBinary(bytes: Uint8Array): Path;
        static deserializeBinaryFromReader(message: Path, reader: jspb.BinaryReader): Path;
    }

    export namespace Path {
        export type AsObject = {
            firstNodePubkey: Uint8Array | string,
            baseFeeMsat: number,
            ppmFee: number,
            cltvExpiryDelta: number,
        }
    }

}

export class DecodeInvoiceOrOfferResponse extends jspb.Message { 
    getIsExpired(): boolean;
    setIsExpired(value: boolean): DecodeInvoiceOrOfferResponse;

    hasBolt11(): boolean;
    clearBolt11(): void;
    getBolt11(): Bolt11Invoice | undefined;
    setBolt11(value?: Bolt11Invoice): DecodeInvoiceOrOfferResponse;

    hasOffer(): boolean;
    clearOffer(): void;
    getOffer(): Bolt12Offer | undefined;
    setOffer(value?: Bolt12Offer): DecodeInvoiceOrOfferResponse;

    hasBolt12Invoice(): boolean;
    clearBolt12Invoice(): void;
    getBolt12Invoice(): Bolt12Invoice | undefined;
    setBolt12Invoice(value?: Bolt12Invoice): DecodeInvoiceOrOfferResponse;

    getDecodedCase(): DecodeInvoiceOrOfferResponse.DecodedCase;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): DecodeInvoiceOrOfferResponse.AsObject;
    static toObject(includeInstance: boolean, msg: DecodeInvoiceOrOfferResponse): DecodeInvoiceOrOfferResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: DecodeInvoiceOrOfferResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): DecodeInvoiceOrOfferResponse;
    static deserializeBinaryFromReader(message: DecodeInvoiceOrOfferResponse, reader: jspb.BinaryReader): DecodeInvoiceOrOfferResponse;
}

export namespace DecodeInvoiceOrOfferResponse {
    export type AsObject = {
        isExpired: boolean,
        bolt11?: Bolt11Invoice.AsObject,
        offer?: Bolt12Offer.AsObject,
        bolt12Invoice?: Bolt12Invoice.AsObject,
    }

    export enum DecodedCase {
        DECODED_NOT_SET = 0,
        BOLT11 = 2,
        OFFER = 3,
        BOLT12_INVOICE = 4,
    }

}

export class FetchInvoiceRequest extends jspb.Message { 
    getCurrency(): string;
    setCurrency(value: string): FetchInvoiceRequest;
    getOffer(): string;
    setOffer(value: string): FetchInvoiceRequest;
    getAmountMsat(): number;
    setAmountMsat(value: number): FetchInvoiceRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): FetchInvoiceRequest.AsObject;
    static toObject(includeInstance: boolean, msg: FetchInvoiceRequest): FetchInvoiceRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: FetchInvoiceRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): FetchInvoiceRequest;
    static deserializeBinaryFromReader(message: FetchInvoiceRequest, reader: jspb.BinaryReader): FetchInvoiceRequest;
}

export namespace FetchInvoiceRequest {
    export type AsObject = {
        currency: string,
        offer: string,
        amountMsat: number,
    }
}

export class FetchInvoiceResponse extends jspb.Message { 
    getInvoice(): string;
    setInvoice(value: string): FetchInvoiceResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): FetchInvoiceResponse.AsObject;
    static toObject(includeInstance: boolean, msg: FetchInvoiceResponse): FetchInvoiceResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: FetchInvoiceResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): FetchInvoiceResponse;
    static deserializeBinaryFromReader(message: FetchInvoiceResponse, reader: jspb.BinaryReader): FetchInvoiceResponse;
}

export namespace FetchInvoiceResponse {
    export type AsObject = {
        invoice: string,
    }
}

export class ScanMempoolRequest extends jspb.Message { 
    clearSymbolsList(): void;
    getSymbolsList(): Array<string>;
    setSymbolsList(value: Array<string>): ScanMempoolRequest;
    addSymbols(value: string, index?: number): string;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ScanMempoolRequest.AsObject;
    static toObject(includeInstance: boolean, msg: ScanMempoolRequest): ScanMempoolRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ScanMempoolRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ScanMempoolRequest;
    static deserializeBinaryFromReader(message: ScanMempoolRequest, reader: jspb.BinaryReader): ScanMempoolRequest;
}

export namespace ScanMempoolRequest {
    export type AsObject = {
        symbolsList: Array<string>,
    }
}

export class ScanMempoolResponse extends jspb.Message { 

    getTransactionsMap(): jspb.Map<string, ScanMempoolResponse.Transactions>;
    clearTransactionsMap(): void;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ScanMempoolResponse.AsObject;
    static toObject(includeInstance: boolean, msg: ScanMempoolResponse): ScanMempoolResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ScanMempoolResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ScanMempoolResponse;
    static deserializeBinaryFromReader(message: ScanMempoolResponse, reader: jspb.BinaryReader): ScanMempoolResponse;
}

export namespace ScanMempoolResponse {
    export type AsObject = {

        transactionsMap: Array<[string, ScanMempoolResponse.Transactions.AsObject]>,
    }


    export class Transactions extends jspb.Message { 
        clearRawList(): void;
        getRawList(): Array<Uint8Array | string>;
        getRawList_asU8(): Array<Uint8Array>;
        getRawList_asB64(): Array<string>;
        setRawList(value: Array<Uint8Array | string>): Transactions;
        addRaw(value: Uint8Array | string, index?: number): Uint8Array | string;

        serializeBinary(): Uint8Array;
        toObject(includeInstance?: boolean): Transactions.AsObject;
        static toObject(includeInstance: boolean, msg: Transactions): Transactions.AsObject;
        static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
        static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
        static serializeBinaryToWriter(message: Transactions, writer: jspb.BinaryWriter): void;
        static deserializeBinary(bytes: Uint8Array): Transactions;
        static deserializeBinaryFromReader(message: Transactions, reader: jspb.BinaryReader): Transactions;
    }

    export namespace Transactions {
        export type AsObject = {
            rawList: Array<Uint8Array | string>,
        }
    }

}

export enum LogLevel {
    ERROR = 0,
    WARN = 1,
    INFO = 2,
    DEBUG = 3,
    TRACE = 4,
}

export enum Feature {
    BASIC_MPP = 0,
}
