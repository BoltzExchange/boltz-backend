// package: fulmine.v1
// file: ark/wallet.proto

/* tslint:disable */
/* eslint-disable */

import * as jspb from "google-protobuf";

export class GenSeedRequest extends jspb.Message { 

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): GenSeedRequest.AsObject;
    static toObject(includeInstance: boolean, msg: GenSeedRequest): GenSeedRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: GenSeedRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): GenSeedRequest;
    static deserializeBinaryFromReader(message: GenSeedRequest, reader: jspb.BinaryReader): GenSeedRequest;
}

export namespace GenSeedRequest {
    export type AsObject = {
    }
}

export class GenSeedResponse extends jspb.Message { 
    getHex(): string;
    setHex(value: string): GenSeedResponse;
    getNsec(): string;
    setNsec(value: string): GenSeedResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): GenSeedResponse.AsObject;
    static toObject(includeInstance: boolean, msg: GenSeedResponse): GenSeedResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: GenSeedResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): GenSeedResponse;
    static deserializeBinaryFromReader(message: GenSeedResponse, reader: jspb.BinaryReader): GenSeedResponse;
}

export namespace GenSeedResponse {
    export type AsObject = {
        hex: string,
        nsec: string,
    }
}

export class CreateWalletRequest extends jspb.Message { 
    getPrivateKey(): string;
    setPrivateKey(value: string): CreateWalletRequest;
    getPassword(): string;
    setPassword(value: string): CreateWalletRequest;
    getServerUrl(): string;
    setServerUrl(value: string): CreateWalletRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): CreateWalletRequest.AsObject;
    static toObject(includeInstance: boolean, msg: CreateWalletRequest): CreateWalletRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: CreateWalletRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): CreateWalletRequest;
    static deserializeBinaryFromReader(message: CreateWalletRequest, reader: jspb.BinaryReader): CreateWalletRequest;
}

export namespace CreateWalletRequest {
    export type AsObject = {
        privateKey: string,
        password: string,
        serverUrl: string,
    }
}

export class CreateWalletResponse extends jspb.Message { 

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): CreateWalletResponse.AsObject;
    static toObject(includeInstance: boolean, msg: CreateWalletResponse): CreateWalletResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: CreateWalletResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): CreateWalletResponse;
    static deserializeBinaryFromReader(message: CreateWalletResponse, reader: jspb.BinaryReader): CreateWalletResponse;
}

export namespace CreateWalletResponse {
    export type AsObject = {
    }
}

export class UnlockRequest extends jspb.Message { 
    getPassword(): string;
    setPassword(value: string): UnlockRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): UnlockRequest.AsObject;
    static toObject(includeInstance: boolean, msg: UnlockRequest): UnlockRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: UnlockRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): UnlockRequest;
    static deserializeBinaryFromReader(message: UnlockRequest, reader: jspb.BinaryReader): UnlockRequest;
}

export namespace UnlockRequest {
    export type AsObject = {
        password: string,
    }
}

export class UnlockResponse extends jspb.Message { 

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): UnlockResponse.AsObject;
    static toObject(includeInstance: boolean, msg: UnlockResponse): UnlockResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: UnlockResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): UnlockResponse;
    static deserializeBinaryFromReader(message: UnlockResponse, reader: jspb.BinaryReader): UnlockResponse;
}

export namespace UnlockResponse {
    export type AsObject = {
    }
}

export class LockRequest extends jspb.Message { 
    getPassword(): string;
    setPassword(value: string): LockRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): LockRequest.AsObject;
    static toObject(includeInstance: boolean, msg: LockRequest): LockRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: LockRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): LockRequest;
    static deserializeBinaryFromReader(message: LockRequest, reader: jspb.BinaryReader): LockRequest;
}

export namespace LockRequest {
    export type AsObject = {
        password: string,
    }
}

export class LockResponse extends jspb.Message { 

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): LockResponse.AsObject;
    static toObject(includeInstance: boolean, msg: LockResponse): LockResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: LockResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): LockResponse;
    static deserializeBinaryFromReader(message: LockResponse, reader: jspb.BinaryReader): LockResponse;
}

export namespace LockResponse {
    export type AsObject = {
    }
}

export class ChangePasswordRequest extends jspb.Message { 
    getCurrentPassword(): string;
    setCurrentPassword(value: string): ChangePasswordRequest;
    getNewPassword(): string;
    setNewPassword(value: string): ChangePasswordRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ChangePasswordRequest.AsObject;
    static toObject(includeInstance: boolean, msg: ChangePasswordRequest): ChangePasswordRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ChangePasswordRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ChangePasswordRequest;
    static deserializeBinaryFromReader(message: ChangePasswordRequest, reader: jspb.BinaryReader): ChangePasswordRequest;
}

export namespace ChangePasswordRequest {
    export type AsObject = {
        currentPassword: string,
        newPassword: string,
    }
}

export class ChangePasswordResponse extends jspb.Message { 

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ChangePasswordResponse.AsObject;
    static toObject(includeInstance: boolean, msg: ChangePasswordResponse): ChangePasswordResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ChangePasswordResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ChangePasswordResponse;
    static deserializeBinaryFromReader(message: ChangePasswordResponse, reader: jspb.BinaryReader): ChangePasswordResponse;
}

export namespace ChangePasswordResponse {
    export type AsObject = {
    }
}

export class RestoreWalletRequest extends jspb.Message { 
    getMnemonic(): string;
    setMnemonic(value: string): RestoreWalletRequest;
    getPassword(): string;
    setPassword(value: string): RestoreWalletRequest;
    getServerUrl(): string;
    setServerUrl(value: string): RestoreWalletRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): RestoreWalletRequest.AsObject;
    static toObject(includeInstance: boolean, msg: RestoreWalletRequest): RestoreWalletRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: RestoreWalletRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): RestoreWalletRequest;
    static deserializeBinaryFromReader(message: RestoreWalletRequest, reader: jspb.BinaryReader): RestoreWalletRequest;
}

export namespace RestoreWalletRequest {
    export type AsObject = {
        mnemonic: string,
        password: string,
        serverUrl: string,
    }
}

export class RestoreWalletResponse extends jspb.Message { 

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): RestoreWalletResponse.AsObject;
    static toObject(includeInstance: boolean, msg: RestoreWalletResponse): RestoreWalletResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: RestoreWalletResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): RestoreWalletResponse;
    static deserializeBinaryFromReader(message: RestoreWalletResponse, reader: jspb.BinaryReader): RestoreWalletResponse;
}

export namespace RestoreWalletResponse {
    export type AsObject = {
    }
}

export class StatusRequest extends jspb.Message { 

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): StatusRequest.AsObject;
    static toObject(includeInstance: boolean, msg: StatusRequest): StatusRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: StatusRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): StatusRequest;
    static deserializeBinaryFromReader(message: StatusRequest, reader: jspb.BinaryReader): StatusRequest;
}

export namespace StatusRequest {
    export type AsObject = {
    }
}

export class StatusResponse extends jspb.Message { 
    getInitialized(): boolean;
    setInitialized(value: boolean): StatusResponse;
    getSynced(): boolean;
    setSynced(value: boolean): StatusResponse;
    getUnlocked(): boolean;
    setUnlocked(value: boolean): StatusResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): StatusResponse.AsObject;
    static toObject(includeInstance: boolean, msg: StatusResponse): StatusResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: StatusResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): StatusResponse;
    static deserializeBinaryFromReader(message: StatusResponse, reader: jspb.BinaryReader): StatusResponse;
}

export namespace StatusResponse {
    export type AsObject = {
        initialized: boolean,
        synced: boolean,
        unlocked: boolean,
    }
}

export class AuthRequest extends jspb.Message { 
    getPassword(): string;
    setPassword(value: string): AuthRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): AuthRequest.AsObject;
    static toObject(includeInstance: boolean, msg: AuthRequest): AuthRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: AuthRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): AuthRequest;
    static deserializeBinaryFromReader(message: AuthRequest, reader: jspb.BinaryReader): AuthRequest;
}

export namespace AuthRequest {
    export type AsObject = {
        password: string,
    }
}

export class AuthResponse extends jspb.Message { 
    getVerified(): boolean;
    setVerified(value: boolean): AuthResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): AuthResponse.AsObject;
    static toObject(includeInstance: boolean, msg: AuthResponse): AuthResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: AuthResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): AuthResponse;
    static deserializeBinaryFromReader(message: AuthResponse, reader: jspb.BinaryReader): AuthResponse;
}

export namespace AuthResponse {
    export type AsObject = {
        verified: boolean,
    }
}
