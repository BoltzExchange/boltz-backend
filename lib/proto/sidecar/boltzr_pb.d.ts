// package: boltzr
// file: boltzr.proto

/* tslint:disable */
/* eslint-disable */

import * as jspb from "google-protobuf";

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
