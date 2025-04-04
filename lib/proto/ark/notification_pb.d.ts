// package: fulmine.v1
// file: ark/notification.proto

/* tslint:disable */
/* eslint-disable */

import * as jspb from "google-protobuf";
import * as ark_types_pb from "../ark/types_pb";

export class SubscribeForAddressesRequest extends jspb.Message { 
    clearAddressesList(): void;
    getAddressesList(): Array<string>;
    setAddressesList(value: Array<string>): SubscribeForAddressesRequest;
    addAddresses(value: string, index?: number): string;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): SubscribeForAddressesRequest.AsObject;
    static toObject(includeInstance: boolean, msg: SubscribeForAddressesRequest): SubscribeForAddressesRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: SubscribeForAddressesRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): SubscribeForAddressesRequest;
    static deserializeBinaryFromReader(message: SubscribeForAddressesRequest, reader: jspb.BinaryReader): SubscribeForAddressesRequest;
}

export namespace SubscribeForAddressesRequest {
    export type AsObject = {
        addressesList: Array<string>,
    }
}

export class SubscribeForAddressesResponse extends jspb.Message { 

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): SubscribeForAddressesResponse.AsObject;
    static toObject(includeInstance: boolean, msg: SubscribeForAddressesResponse): SubscribeForAddressesResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: SubscribeForAddressesResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): SubscribeForAddressesResponse;
    static deserializeBinaryFromReader(message: SubscribeForAddressesResponse, reader: jspb.BinaryReader): SubscribeForAddressesResponse;
}

export namespace SubscribeForAddressesResponse {
    export type AsObject = {
    }
}

export class UnsubscribeForAddressesRequest extends jspb.Message { 
    clearAddressesList(): void;
    getAddressesList(): Array<string>;
    setAddressesList(value: Array<string>): UnsubscribeForAddressesRequest;
    addAddresses(value: string, index?: number): string;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): UnsubscribeForAddressesRequest.AsObject;
    static toObject(includeInstance: boolean, msg: UnsubscribeForAddressesRequest): UnsubscribeForAddressesRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: UnsubscribeForAddressesRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): UnsubscribeForAddressesRequest;
    static deserializeBinaryFromReader(message: UnsubscribeForAddressesRequest, reader: jspb.BinaryReader): UnsubscribeForAddressesRequest;
}

export namespace UnsubscribeForAddressesRequest {
    export type AsObject = {
        addressesList: Array<string>,
    }
}

export class UnsubscribeForAddressesResponse extends jspb.Message { 

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): UnsubscribeForAddressesResponse.AsObject;
    static toObject(includeInstance: boolean, msg: UnsubscribeForAddressesResponse): UnsubscribeForAddressesResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: UnsubscribeForAddressesResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): UnsubscribeForAddressesResponse;
    static deserializeBinaryFromReader(message: UnsubscribeForAddressesResponse, reader: jspb.BinaryReader): UnsubscribeForAddressesResponse;
}

export namespace UnsubscribeForAddressesResponse {
    export type AsObject = {
    }
}

export class GetVtxoNotificationsRequest extends jspb.Message { 

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): GetVtxoNotificationsRequest.AsObject;
    static toObject(includeInstance: boolean, msg: GetVtxoNotificationsRequest): GetVtxoNotificationsRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: GetVtxoNotificationsRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): GetVtxoNotificationsRequest;
    static deserializeBinaryFromReader(message: GetVtxoNotificationsRequest, reader: jspb.BinaryReader): GetVtxoNotificationsRequest;
}

export namespace GetVtxoNotificationsRequest {
    export type AsObject = {
    }
}

export class GetVtxoNotificationsResponse extends jspb.Message { 

    hasNotification(): boolean;
    clearNotification(): void;
    getNotification(): ark_types_pb.Notification | undefined;
    setNotification(value?: ark_types_pb.Notification): GetVtxoNotificationsResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): GetVtxoNotificationsResponse.AsObject;
    static toObject(includeInstance: boolean, msg: GetVtxoNotificationsResponse): GetVtxoNotificationsResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: GetVtxoNotificationsResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): GetVtxoNotificationsResponse;
    static deserializeBinaryFromReader(message: GetVtxoNotificationsResponse, reader: jspb.BinaryReader): GetVtxoNotificationsResponse;
}

export namespace GetVtxoNotificationsResponse {
    export type AsObject = {
        notification?: ark_types_pb.Notification.AsObject,
    }
}

export class RoundNotificationsRequest extends jspb.Message { 

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): RoundNotificationsRequest.AsObject;
    static toObject(includeInstance: boolean, msg: RoundNotificationsRequest): RoundNotificationsRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: RoundNotificationsRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): RoundNotificationsRequest;
    static deserializeBinaryFromReader(message: RoundNotificationsRequest, reader: jspb.BinaryReader): RoundNotificationsRequest;
}

export namespace RoundNotificationsRequest {
    export type AsObject = {
    }
}

export class RoundNotificationsResponse extends jspb.Message { 
    getEventType(): ark_types_pb.RoundEventType;
    setEventType(value: ark_types_pb.RoundEventType): RoundNotificationsResponse;
    getTxhex(): string;
    setTxhex(value: string): RoundNotificationsResponse;
    getTxid(): string;
    setTxid(value: string): RoundNotificationsResponse;

    hasBlockDetails(): boolean;
    clearBlockDetails(): void;
    getBlockDetails(): ark_types_pb.BlockDetails | undefined;
    setBlockDetails(value?: ark_types_pb.BlockDetails): RoundNotificationsResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): RoundNotificationsResponse.AsObject;
    static toObject(includeInstance: boolean, msg: RoundNotificationsResponse): RoundNotificationsResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: RoundNotificationsResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): RoundNotificationsResponse;
    static deserializeBinaryFromReader(message: RoundNotificationsResponse, reader: jspb.BinaryReader): RoundNotificationsResponse;
}

export namespace RoundNotificationsResponse {
    export type AsObject = {
        eventType: ark_types_pb.RoundEventType,
        txhex: string,
        txid: string,
        blockDetails?: ark_types_pb.BlockDetails.AsObject,
    }
}

export class AddWebhookRequest extends jspb.Message { 
    getEndpoint(): string;
    setEndpoint(value: string): AddWebhookRequest;
    getEventType(): ark_types_pb.WebhookEventType;
    setEventType(value: ark_types_pb.WebhookEventType): AddWebhookRequest;
    getSecret(): string;
    setSecret(value: string): AddWebhookRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): AddWebhookRequest.AsObject;
    static toObject(includeInstance: boolean, msg: AddWebhookRequest): AddWebhookRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: AddWebhookRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): AddWebhookRequest;
    static deserializeBinaryFromReader(message: AddWebhookRequest, reader: jspb.BinaryReader): AddWebhookRequest;
}

export namespace AddWebhookRequest {
    export type AsObject = {
        endpoint: string,
        eventType: ark_types_pb.WebhookEventType,
        secret: string,
    }
}

export class AddWebhookResponse extends jspb.Message { 
    getId(): string;
    setId(value: string): AddWebhookResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): AddWebhookResponse.AsObject;
    static toObject(includeInstance: boolean, msg: AddWebhookResponse): AddWebhookResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: AddWebhookResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): AddWebhookResponse;
    static deserializeBinaryFromReader(message: AddWebhookResponse, reader: jspb.BinaryReader): AddWebhookResponse;
}

export namespace AddWebhookResponse {
    export type AsObject = {
        id: string,
    }
}

export class RemoveWebhookRequest extends jspb.Message { 
    getId(): string;
    setId(value: string): RemoveWebhookRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): RemoveWebhookRequest.AsObject;
    static toObject(includeInstance: boolean, msg: RemoveWebhookRequest): RemoveWebhookRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: RemoveWebhookRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): RemoveWebhookRequest;
    static deserializeBinaryFromReader(message: RemoveWebhookRequest, reader: jspb.BinaryReader): RemoveWebhookRequest;
}

export namespace RemoveWebhookRequest {
    export type AsObject = {
        id: string,
    }
}

export class RemoveWebhookResponse extends jspb.Message { 

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): RemoveWebhookResponse.AsObject;
    static toObject(includeInstance: boolean, msg: RemoveWebhookResponse): RemoveWebhookResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: RemoveWebhookResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): RemoveWebhookResponse;
    static deserializeBinaryFromReader(message: RemoveWebhookResponse, reader: jspb.BinaryReader): RemoveWebhookResponse;
}

export namespace RemoveWebhookResponse {
    export type AsObject = {
    }
}

export class ListWebhooksRequest extends jspb.Message { 
    getEventType(): ark_types_pb.WebhookEventType;
    setEventType(value: ark_types_pb.WebhookEventType): ListWebhooksRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ListWebhooksRequest.AsObject;
    static toObject(includeInstance: boolean, msg: ListWebhooksRequest): ListWebhooksRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ListWebhooksRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ListWebhooksRequest;
    static deserializeBinaryFromReader(message: ListWebhooksRequest, reader: jspb.BinaryReader): ListWebhooksRequest;
}

export namespace ListWebhooksRequest {
    export type AsObject = {
        eventType: ark_types_pb.WebhookEventType,
    }
}

export class ListWebhooksResponse extends jspb.Message { 
    clearWebhookInfoList(): void;
    getWebhookInfoList(): Array<WebhookInfo>;
    setWebhookInfoList(value: Array<WebhookInfo>): ListWebhooksResponse;
    addWebhookInfo(value?: WebhookInfo, index?: number): WebhookInfo;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ListWebhooksResponse.AsObject;
    static toObject(includeInstance: boolean, msg: ListWebhooksResponse): ListWebhooksResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ListWebhooksResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ListWebhooksResponse;
    static deserializeBinaryFromReader(message: ListWebhooksResponse, reader: jspb.BinaryReader): ListWebhooksResponse;
}

export namespace ListWebhooksResponse {
    export type AsObject = {
        webhookInfoList: Array<WebhookInfo.AsObject>,
    }
}

export class WebhookInfo extends jspb.Message { 
    getId(): string;
    setId(value: string): WebhookInfo;
    getEndpoint(): string;
    setEndpoint(value: string): WebhookInfo;
    getIsSecured(): boolean;
    setIsSecured(value: boolean): WebhookInfo;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): WebhookInfo.AsObject;
    static toObject(includeInstance: boolean, msg: WebhookInfo): WebhookInfo.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: WebhookInfo, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): WebhookInfo;
    static deserializeBinaryFromReader(message: WebhookInfo, reader: jspb.BinaryReader): WebhookInfo;
}

export namespace WebhookInfo {
    export type AsObject = {
        id: string,
        endpoint: string,
        isSecured: boolean,
    }
}
