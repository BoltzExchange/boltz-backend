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

export class SendMessageRequest extends jspb.Message { 
    getMessage(): string;
    setMessage(value: string): SendMessageRequest;

    hasIsAlert(): boolean;
    clearIsAlert(): void;
    getIsAlert(): boolean | undefined;
    setIsAlert(value: boolean): SendMessageRequest;

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
        isAlert?: boolean,
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
