// package: boltzrpc
// file: boltzrpc.proto

/* tslint:disable */
/* eslint-disable */

import * as jspb from "google-protobuf";

export class StopRequest extends jspb.Message { 

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): StopRequest.AsObject;
    static toObject(includeInstance: boolean, msg: StopRequest): StopRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: StopRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): StopRequest;
    static deserializeBinaryFromReader(message: StopRequest, reader: jspb.BinaryReader): StopRequest;
}

export namespace StopRequest {
    export type AsObject = {
    }
}

export class StopResponse extends jspb.Message { 

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): StopResponse.AsObject;
    static toObject(includeInstance: boolean, msg: StopResponse): StopResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: StopResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): StopResponse;
    static deserializeBinaryFromReader(message: StopResponse, reader: jspb.BinaryReader): StopResponse;
}

export namespace StopResponse {
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

    getChainsMap(): jspb.Map<string, CurrencyInfo>;
    clearChainsMap(): void;

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

        chainsMap: Array<[string, CurrencyInfo.AsObject]>,
    }
}

export class CurrencyInfo extends jspb.Message { 

    hasChain(): boolean;
    clearChain(): void;
    getChain(): ChainInfo | undefined;
    setChain(value?: ChainInfo): CurrencyInfo;

    getLightningMap(): jspb.Map<string, LightningInfo>;
    clearLightningMap(): void;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): CurrencyInfo.AsObject;
    static toObject(includeInstance: boolean, msg: CurrencyInfo): CurrencyInfo.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: CurrencyInfo, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): CurrencyInfo;
    static deserializeBinaryFromReader(message: CurrencyInfo, reader: jspb.BinaryReader): CurrencyInfo;
}

export namespace CurrencyInfo {
    export type AsObject = {
        chain?: ChainInfo.AsObject,

        lightningMap: Array<[string, LightningInfo.AsObject]>,
    }
}

export class ChainInfo extends jspb.Message { 
    getVersion(): number;
    setVersion(value: number): ChainInfo;
    getBlocks(): number;
    setBlocks(value: number): ChainInfo;
    getScannedBlocks(): number;
    setScannedBlocks(value: number): ChainInfo;
    getConnections(): number;
    setConnections(value: number): ChainInfo;
    getError(): string;
    setError(value: string): ChainInfo;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ChainInfo.AsObject;
    static toObject(includeInstance: boolean, msg: ChainInfo): ChainInfo.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ChainInfo, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ChainInfo;
    static deserializeBinaryFromReader(message: ChainInfo, reader: jspb.BinaryReader): ChainInfo;
}

export namespace ChainInfo {
    export type AsObject = {
        version: number,
        blocks: number,
        scannedBlocks: number,
        connections: number,
        error: string,
    }
}

export class LightningInfo extends jspb.Message { 
    getVersion(): string;
    setVersion(value: string): LightningInfo;

    hasChannels(): boolean;
    clearChannels(): void;
    getChannels(): LightningInfo.Channels | undefined;
    setChannels(value?: LightningInfo.Channels): LightningInfo;
    getBlockHeight(): number;
    setBlockHeight(value: number): LightningInfo;
    getError(): string;
    setError(value: string): LightningInfo;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): LightningInfo.AsObject;
    static toObject(includeInstance: boolean, msg: LightningInfo): LightningInfo.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: LightningInfo, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): LightningInfo;
    static deserializeBinaryFromReader(message: LightningInfo, reader: jspb.BinaryReader): LightningInfo;
}

export namespace LightningInfo {
    export type AsObject = {
        version: string,
        channels?: LightningInfo.Channels.AsObject,
        blockHeight: number,
        error: string,
    }


    export class Channels extends jspb.Message { 
        getActive(): number;
        setActive(value: number): Channels;
        getInactive(): number;
        setInactive(value: number): Channels;
        getPending(): number;
        setPending(value: number): Channels;

        serializeBinary(): Uint8Array;
        toObject(includeInstance?: boolean): Channels.AsObject;
        static toObject(includeInstance: boolean, msg: Channels): Channels.AsObject;
        static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
        static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
        static serializeBinaryToWriter(message: Channels, writer: jspb.BinaryWriter): void;
        static deserializeBinary(bytes: Uint8Array): Channels;
        static deserializeBinaryFromReader(message: Channels, reader: jspb.BinaryReader): Channels;
    }

    export namespace Channels {
        export type AsObject = {
            active: number,
            inactive: number,
            pending: number,
        }
    }

}

export class GetBalanceRequest extends jspb.Message { 

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): GetBalanceRequest.AsObject;
    static toObject(includeInstance: boolean, msg: GetBalanceRequest): GetBalanceRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: GetBalanceRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): GetBalanceRequest;
    static deserializeBinaryFromReader(message: GetBalanceRequest, reader: jspb.BinaryReader): GetBalanceRequest;
}

export namespace GetBalanceRequest {
    export type AsObject = {
    }
}

export class GetBalanceResponse extends jspb.Message { 

    getBalancesMap(): jspb.Map<string, Balances>;
    clearBalancesMap(): void;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): GetBalanceResponse.AsObject;
    static toObject(includeInstance: boolean, msg: GetBalanceResponse): GetBalanceResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: GetBalanceResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): GetBalanceResponse;
    static deserializeBinaryFromReader(message: GetBalanceResponse, reader: jspb.BinaryReader): GetBalanceResponse;
}

export namespace GetBalanceResponse {
    export type AsObject = {

        balancesMap: Array<[string, Balances.AsObject]>,
    }
}

export class Balances extends jspb.Message { 

    getWalletsMap(): jspb.Map<string, Balances.WalletBalance>;
    clearWalletsMap(): void;

    getLightningMap(): jspb.Map<string, Balances.LightningBalance>;
    clearLightningMap(): void;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): Balances.AsObject;
    static toObject(includeInstance: boolean, msg: Balances): Balances.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: Balances, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): Balances;
    static deserializeBinaryFromReader(message: Balances, reader: jspb.BinaryReader): Balances;
}

export namespace Balances {
    export type AsObject = {

        walletsMap: Array<[string, Balances.WalletBalance.AsObject]>,

        lightningMap: Array<[string, Balances.LightningBalance.AsObject]>,
    }


    export class WalletBalance extends jspb.Message { 
        getConfirmed(): number;
        setConfirmed(value: number): WalletBalance;
        getUnconfirmed(): number;
        setUnconfirmed(value: number): WalletBalance;

        serializeBinary(): Uint8Array;
        toObject(includeInstance?: boolean): WalletBalance.AsObject;
        static toObject(includeInstance: boolean, msg: WalletBalance): WalletBalance.AsObject;
        static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
        static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
        static serializeBinaryToWriter(message: WalletBalance, writer: jspb.BinaryWriter): void;
        static deserializeBinary(bytes: Uint8Array): WalletBalance;
        static deserializeBinaryFromReader(message: WalletBalance, reader: jspb.BinaryReader): WalletBalance;
    }

    export namespace WalletBalance {
        export type AsObject = {
            confirmed: number,
            unconfirmed: number,
        }
    }

    export class LightningBalance extends jspb.Message { 
        getLocal(): number;
        setLocal(value: number): LightningBalance;
        getRemote(): number;
        setRemote(value: number): LightningBalance;

        serializeBinary(): Uint8Array;
        toObject(includeInstance?: boolean): LightningBalance.AsObject;
        static toObject(includeInstance: boolean, msg: LightningBalance): LightningBalance.AsObject;
        static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
        static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
        static serializeBinaryToWriter(message: LightningBalance, writer: jspb.BinaryWriter): void;
        static deserializeBinary(bytes: Uint8Array): LightningBalance;
        static deserializeBinaryFromReader(message: LightningBalance, reader: jspb.BinaryReader): LightningBalance;
    }

    export namespace LightningBalance {
        export type AsObject = {
            local: number,
            remote: number,
        }
    }

}

export class DeriveKeysRequest extends jspb.Message { 
    getSymbol(): string;
    setSymbol(value: string): DeriveKeysRequest;
    getIndex(): number;
    setIndex(value: number): DeriveKeysRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): DeriveKeysRequest.AsObject;
    static toObject(includeInstance: boolean, msg: DeriveKeysRequest): DeriveKeysRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: DeriveKeysRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): DeriveKeysRequest;
    static deserializeBinaryFromReader(message: DeriveKeysRequest, reader: jspb.BinaryReader): DeriveKeysRequest;
}

export namespace DeriveKeysRequest {
    export type AsObject = {
        symbol: string,
        index: number,
    }
}

export class DeriveKeysResponse extends jspb.Message { 
    getPublicKey(): string;
    setPublicKey(value: string): DeriveKeysResponse;
    getPrivateKey(): string;
    setPrivateKey(value: string): DeriveKeysResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): DeriveKeysResponse.AsObject;
    static toObject(includeInstance: boolean, msg: DeriveKeysResponse): DeriveKeysResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: DeriveKeysResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): DeriveKeysResponse;
    static deserializeBinaryFromReader(message: DeriveKeysResponse, reader: jspb.BinaryReader): DeriveKeysResponse;
}

export namespace DeriveKeysResponse {
    export type AsObject = {
        publicKey: string,
        privateKey: string,
    }
}

export class DeriveBlindingKeyRequest extends jspb.Message { 
    getAddress(): string;
    setAddress(value: string): DeriveBlindingKeyRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): DeriveBlindingKeyRequest.AsObject;
    static toObject(includeInstance: boolean, msg: DeriveBlindingKeyRequest): DeriveBlindingKeyRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: DeriveBlindingKeyRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): DeriveBlindingKeyRequest;
    static deserializeBinaryFromReader(message: DeriveBlindingKeyRequest, reader: jspb.BinaryReader): DeriveBlindingKeyRequest;
}

export namespace DeriveBlindingKeyRequest {
    export type AsObject = {
        address: string,
    }
}

export class DeriveBlindingKeyResponse extends jspb.Message { 
    getPublicKey(): string;
    setPublicKey(value: string): DeriveBlindingKeyResponse;
    getPrivateKey(): string;
    setPrivateKey(value: string): DeriveBlindingKeyResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): DeriveBlindingKeyResponse.AsObject;
    static toObject(includeInstance: boolean, msg: DeriveBlindingKeyResponse): DeriveBlindingKeyResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: DeriveBlindingKeyResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): DeriveBlindingKeyResponse;
    static deserializeBinaryFromReader(message: DeriveBlindingKeyResponse, reader: jspb.BinaryReader): DeriveBlindingKeyResponse;
}

export namespace DeriveBlindingKeyResponse {
    export type AsObject = {
        publicKey: string,
        privateKey: string,
    }
}

export class UnblindOutputsRequest extends jspb.Message { 

    hasId(): boolean;
    clearId(): void;
    getId(): string;
    setId(value: string): UnblindOutputsRequest;

    hasHex(): boolean;
    clearHex(): void;
    getHex(): string;
    setHex(value: string): UnblindOutputsRequest;

    getTransactionCase(): UnblindOutputsRequest.TransactionCase;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): UnblindOutputsRequest.AsObject;
    static toObject(includeInstance: boolean, msg: UnblindOutputsRequest): UnblindOutputsRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: UnblindOutputsRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): UnblindOutputsRequest;
    static deserializeBinaryFromReader(message: UnblindOutputsRequest, reader: jspb.BinaryReader): UnblindOutputsRequest;
}

export namespace UnblindOutputsRequest {
    export type AsObject = {
        id: string,
        hex: string,
    }

    export enum TransactionCase {
        TRANSACTION_NOT_SET = 0,
        ID = 1,
        HEX = 2,
    }

}

export class UnblindOutputsResponse extends jspb.Message { 
    clearOutputsList(): void;
    getOutputsList(): Array<UnblindOutputsResponse.UnblindedOutput>;
    setOutputsList(value: Array<UnblindOutputsResponse.UnblindedOutput>): UnblindOutputsResponse;
    addOutputs(value?: UnblindOutputsResponse.UnblindedOutput, index?: number): UnblindOutputsResponse.UnblindedOutput;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): UnblindOutputsResponse.AsObject;
    static toObject(includeInstance: boolean, msg: UnblindOutputsResponse): UnblindOutputsResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: UnblindOutputsResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): UnblindOutputsResponse;
    static deserializeBinaryFromReader(message: UnblindOutputsResponse, reader: jspb.BinaryReader): UnblindOutputsResponse;
}

export namespace UnblindOutputsResponse {
    export type AsObject = {
        outputsList: Array<UnblindOutputsResponse.UnblindedOutput.AsObject>,
    }


    export class UnblindedOutput extends jspb.Message { 
        getValue(): number;
        setValue(value: number): UnblindedOutput;
        getAsset(): Uint8Array | string;
        getAsset_asU8(): Uint8Array;
        getAsset_asB64(): string;
        setAsset(value: Uint8Array | string): UnblindedOutput;
        getIsLbtc(): boolean;
        setIsLbtc(value: boolean): UnblindedOutput;
        getScript(): Uint8Array | string;
        getScript_asU8(): Uint8Array;
        getScript_asB64(): string;
        setScript(value: Uint8Array | string): UnblindedOutput;
        getNonce(): Uint8Array | string;
        getNonce_asU8(): Uint8Array;
        getNonce_asB64(): string;
        setNonce(value: Uint8Array | string): UnblindedOutput;

        hasRangeProof(): boolean;
        clearRangeProof(): void;
        getRangeProof(): Uint8Array | string;
        getRangeProof_asU8(): Uint8Array;
        getRangeProof_asB64(): string;
        setRangeProof(value: Uint8Array | string): UnblindedOutput;

        hasSurjectionProof(): boolean;
        clearSurjectionProof(): void;
        getSurjectionProof(): Uint8Array | string;
        getSurjectionProof_asU8(): Uint8Array;
        getSurjectionProof_asB64(): string;
        setSurjectionProof(value: Uint8Array | string): UnblindedOutput;

        serializeBinary(): Uint8Array;
        toObject(includeInstance?: boolean): UnblindedOutput.AsObject;
        static toObject(includeInstance: boolean, msg: UnblindedOutput): UnblindedOutput.AsObject;
        static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
        static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
        static serializeBinaryToWriter(message: UnblindedOutput, writer: jspb.BinaryWriter): void;
        static deserializeBinary(bytes: Uint8Array): UnblindedOutput;
        static deserializeBinaryFromReader(message: UnblindedOutput, reader: jspb.BinaryReader): UnblindedOutput;
    }

    export namespace UnblindedOutput {
        export type AsObject = {
            value: number,
            asset: Uint8Array | string,
            isLbtc: boolean,
            script: Uint8Array | string,
            nonce: Uint8Array | string,
            rangeProof: Uint8Array | string,
            surjectionProof: Uint8Array | string,
        }
    }

}

export class GetAddressRequest extends jspb.Message { 
    getSymbol(): string;
    setSymbol(value: string): GetAddressRequest;
    getLabel(): string;
    setLabel(value: string): GetAddressRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): GetAddressRequest.AsObject;
    static toObject(includeInstance: boolean, msg: GetAddressRequest): GetAddressRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: GetAddressRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): GetAddressRequest;
    static deserializeBinaryFromReader(message: GetAddressRequest, reader: jspb.BinaryReader): GetAddressRequest;
}

export namespace GetAddressRequest {
    export type AsObject = {
        symbol: string,
        label: string,
    }
}

export class GetAddressResponse extends jspb.Message { 
    getAddress(): string;
    setAddress(value: string): GetAddressResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): GetAddressResponse.AsObject;
    static toObject(includeInstance: boolean, msg: GetAddressResponse): GetAddressResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: GetAddressResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): GetAddressResponse;
    static deserializeBinaryFromReader(message: GetAddressResponse, reader: jspb.BinaryReader): GetAddressResponse;
}

export namespace GetAddressResponse {
    export type AsObject = {
        address: string,
    }
}

export class SendCoinsRequest extends jspb.Message { 
    getSymbol(): string;
    setSymbol(value: string): SendCoinsRequest;
    getAddress(): string;
    setAddress(value: string): SendCoinsRequest;
    getAmount(): number;
    setAmount(value: number): SendCoinsRequest;
    getFee(): number;
    setFee(value: number): SendCoinsRequest;
    getSendAll(): boolean;
    setSendAll(value: boolean): SendCoinsRequest;
    getLabel(): string;
    setLabel(value: string): SendCoinsRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): SendCoinsRequest.AsObject;
    static toObject(includeInstance: boolean, msg: SendCoinsRequest): SendCoinsRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: SendCoinsRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): SendCoinsRequest;
    static deserializeBinaryFromReader(message: SendCoinsRequest, reader: jspb.BinaryReader): SendCoinsRequest;
}

export namespace SendCoinsRequest {
    export type AsObject = {
        symbol: string,
        address: string,
        amount: number,
        fee: number,
        sendAll: boolean,
        label: string,
    }
}

export class SendCoinsResponse extends jspb.Message { 
    getTransactionId(): string;
    setTransactionId(value: string): SendCoinsResponse;

    hasVout(): boolean;
    clearVout(): void;
    getVout(): number | undefined;
    setVout(value: number): SendCoinsResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): SendCoinsResponse.AsObject;
    static toObject(includeInstance: boolean, msg: SendCoinsResponse): SendCoinsResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: SendCoinsResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): SendCoinsResponse;
    static deserializeBinaryFromReader(message: SendCoinsResponse, reader: jspb.BinaryReader): SendCoinsResponse;
}

export namespace SendCoinsResponse {
    export type AsObject = {
        transactionId: string,
        vout?: number,
    }
}

export class UpdateTimeoutBlockDeltaRequest extends jspb.Message { 
    getPair(): string;
    setPair(value: string): UpdateTimeoutBlockDeltaRequest;
    getReverseTimeout(): number;
    setReverseTimeout(value: number): UpdateTimeoutBlockDeltaRequest;
    getSwapMinimalTimeout(): number;
    setSwapMinimalTimeout(value: number): UpdateTimeoutBlockDeltaRequest;
    getSwapMaximalTimeout(): number;
    setSwapMaximalTimeout(value: number): UpdateTimeoutBlockDeltaRequest;
    getSwapTaprootTimeout(): number;
    setSwapTaprootTimeout(value: number): UpdateTimeoutBlockDeltaRequest;
    getChainTimeout(): number;
    setChainTimeout(value: number): UpdateTimeoutBlockDeltaRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): UpdateTimeoutBlockDeltaRequest.AsObject;
    static toObject(includeInstance: boolean, msg: UpdateTimeoutBlockDeltaRequest): UpdateTimeoutBlockDeltaRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: UpdateTimeoutBlockDeltaRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): UpdateTimeoutBlockDeltaRequest;
    static deserializeBinaryFromReader(message: UpdateTimeoutBlockDeltaRequest, reader: jspb.BinaryReader): UpdateTimeoutBlockDeltaRequest;
}

export namespace UpdateTimeoutBlockDeltaRequest {
    export type AsObject = {
        pair: string,
        reverseTimeout: number,
        swapMinimalTimeout: number,
        swapMaximalTimeout: number,
        swapTaprootTimeout: number,
        chainTimeout: number,
    }
}

export class UpdateTimeoutBlockDeltaResponse extends jspb.Message { 

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): UpdateTimeoutBlockDeltaResponse.AsObject;
    static toObject(includeInstance: boolean, msg: UpdateTimeoutBlockDeltaResponse): UpdateTimeoutBlockDeltaResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: UpdateTimeoutBlockDeltaResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): UpdateTimeoutBlockDeltaResponse;
    static deserializeBinaryFromReader(message: UpdateTimeoutBlockDeltaResponse, reader: jspb.BinaryReader): UpdateTimeoutBlockDeltaResponse;
}

export namespace UpdateTimeoutBlockDeltaResponse {
    export type AsObject = {
    }
}

export class AddReferralRequest extends jspb.Message { 
    getId(): string;
    setId(value: string): AddReferralRequest;
    getFeeShare(): number;
    setFeeShare(value: number): AddReferralRequest;
    getRoutingNode(): string;
    setRoutingNode(value: string): AddReferralRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): AddReferralRequest.AsObject;
    static toObject(includeInstance: boolean, msg: AddReferralRequest): AddReferralRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: AddReferralRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): AddReferralRequest;
    static deserializeBinaryFromReader(message: AddReferralRequest, reader: jspb.BinaryReader): AddReferralRequest;
}

export namespace AddReferralRequest {
    export type AsObject = {
        id: string,
        feeShare: number,
        routingNode: string,
    }
}

export class AddReferralResponse extends jspb.Message { 
    getApiKey(): string;
    setApiKey(value: string): AddReferralResponse;
    getApiSecret(): string;
    setApiSecret(value: string): AddReferralResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): AddReferralResponse.AsObject;
    static toObject(includeInstance: boolean, msg: AddReferralResponse): AddReferralResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: AddReferralResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): AddReferralResponse;
    static deserializeBinaryFromReader(message: AddReferralResponse, reader: jspb.BinaryReader): AddReferralResponse;
}

export namespace AddReferralResponse {
    export type AsObject = {
        apiKey: string,
        apiSecret: string,
    }
}

export class SweepSwapsRequest extends jspb.Message { 

    hasSymbol(): boolean;
    clearSymbol(): void;
    getSymbol(): string | undefined;
    setSymbol(value: string): SweepSwapsRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): SweepSwapsRequest.AsObject;
    static toObject(includeInstance: boolean, msg: SweepSwapsRequest): SweepSwapsRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: SweepSwapsRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): SweepSwapsRequest;
    static deserializeBinaryFromReader(message: SweepSwapsRequest, reader: jspb.BinaryReader): SweepSwapsRequest;
}

export namespace SweepSwapsRequest {
    export type AsObject = {
        symbol?: string,
    }
}

export class SweepSwapsResponse extends jspb.Message { 

    getClaimedSymbolsMap(): jspb.Map<string, SweepSwapsResponse.ClaimedSwaps>;
    clearClaimedSymbolsMap(): void;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): SweepSwapsResponse.AsObject;
    static toObject(includeInstance: boolean, msg: SweepSwapsResponse): SweepSwapsResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: SweepSwapsResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): SweepSwapsResponse;
    static deserializeBinaryFromReader(message: SweepSwapsResponse, reader: jspb.BinaryReader): SweepSwapsResponse;
}

export namespace SweepSwapsResponse {
    export type AsObject = {

        claimedSymbolsMap: Array<[string, SweepSwapsResponse.ClaimedSwaps.AsObject]>,
    }


    export class ClaimedSwaps extends jspb.Message { 
        clearClaimedIdsList(): void;
        getClaimedIdsList(): Array<string>;
        setClaimedIdsList(value: Array<string>): ClaimedSwaps;
        addClaimedIds(value: string, index?: number): string;

        serializeBinary(): Uint8Array;
        toObject(includeInstance?: boolean): ClaimedSwaps.AsObject;
        static toObject(includeInstance: boolean, msg: ClaimedSwaps): ClaimedSwaps.AsObject;
        static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
        static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
        static serializeBinaryToWriter(message: ClaimedSwaps, writer: jspb.BinaryWriter): void;
        static deserializeBinary(bytes: Uint8Array): ClaimedSwaps;
        static deserializeBinaryFromReader(message: ClaimedSwaps, reader: jspb.BinaryReader): ClaimedSwaps;
    }

    export namespace ClaimedSwaps {
        export type AsObject = {
            claimedIdsList: Array<string>,
        }
    }

}

export class ListSwapsRequest extends jspb.Message { 

    hasStatus(): boolean;
    clearStatus(): void;
    getStatus(): string | undefined;
    setStatus(value: string): ListSwapsRequest;

    hasLimit(): boolean;
    clearLimit(): void;
    getLimit(): number | undefined;
    setLimit(value: number): ListSwapsRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ListSwapsRequest.AsObject;
    static toObject(includeInstance: boolean, msg: ListSwapsRequest): ListSwapsRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ListSwapsRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ListSwapsRequest;
    static deserializeBinaryFromReader(message: ListSwapsRequest, reader: jspb.BinaryReader): ListSwapsRequest;
}

export namespace ListSwapsRequest {
    export type AsObject = {
        status?: string,
        limit?: number,
    }
}

export class ListSwapsResponse extends jspb.Message { 
    clearSubmarineSwapsList(): void;
    getSubmarineSwapsList(): Array<string>;
    setSubmarineSwapsList(value: Array<string>): ListSwapsResponse;
    addSubmarineSwaps(value: string, index?: number): string;
    clearReverseSwapsList(): void;
    getReverseSwapsList(): Array<string>;
    setReverseSwapsList(value: Array<string>): ListSwapsResponse;
    addReverseSwaps(value: string, index?: number): string;
    clearChainSwapsList(): void;
    getChainSwapsList(): Array<string>;
    setChainSwapsList(value: Array<string>): ListSwapsResponse;
    addChainSwaps(value: string, index?: number): string;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ListSwapsResponse.AsObject;
    static toObject(includeInstance: boolean, msg: ListSwapsResponse): ListSwapsResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ListSwapsResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ListSwapsResponse;
    static deserializeBinaryFromReader(message: ListSwapsResponse, reader: jspb.BinaryReader): ListSwapsResponse;
}

export namespace ListSwapsResponse {
    export type AsObject = {
        submarineSwapsList: Array<string>,
        reverseSwapsList: Array<string>,
        chainSwapsList: Array<string>,
    }
}

export class RescanRequest extends jspb.Message { 
    getSymbol(): string;
    setSymbol(value: string): RescanRequest;
    getStartHeight(): number;
    setStartHeight(value: number): RescanRequest;

    hasIncludeMempool(): boolean;
    clearIncludeMempool(): void;
    getIncludeMempool(): boolean | undefined;
    setIncludeMempool(value: boolean): RescanRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): RescanRequest.AsObject;
    static toObject(includeInstance: boolean, msg: RescanRequest): RescanRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: RescanRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): RescanRequest;
    static deserializeBinaryFromReader(message: RescanRequest, reader: jspb.BinaryReader): RescanRequest;
}

export namespace RescanRequest {
    export type AsObject = {
        symbol: string,
        startHeight: number,
        includeMempool?: boolean,
    }
}

export class RescanResponse extends jspb.Message { 
    getStartHeight(): number;
    setStartHeight(value: number): RescanResponse;
    getEndHeight(): number;
    setEndHeight(value: number): RescanResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): RescanResponse.AsObject;
    static toObject(includeInstance: boolean, msg: RescanResponse): RescanResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: RescanResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): RescanResponse;
    static deserializeBinaryFromReader(message: RescanResponse, reader: jspb.BinaryReader): RescanResponse;
}

export namespace RescanResponse {
    export type AsObject = {
        startHeight: number,
        endHeight: number,
    }
}

export class SetSwapStatusRequest extends jspb.Message { 
    getId(): string;
    setId(value: string): SetSwapStatusRequest;
    getStatus(): string;
    setStatus(value: string): SetSwapStatusRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): SetSwapStatusRequest.AsObject;
    static toObject(includeInstance: boolean, msg: SetSwapStatusRequest): SetSwapStatusRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: SetSwapStatusRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): SetSwapStatusRequest;
    static deserializeBinaryFromReader(message: SetSwapStatusRequest, reader: jspb.BinaryReader): SetSwapStatusRequest;
}

export namespace SetSwapStatusRequest {
    export type AsObject = {
        id: string,
        status: string,
    }
}

export class SetSwapStatusResponse extends jspb.Message { 

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): SetSwapStatusResponse.AsObject;
    static toObject(includeInstance: boolean, msg: SetSwapStatusResponse): SetSwapStatusResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: SetSwapStatusResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): SetSwapStatusResponse;
    static deserializeBinaryFromReader(message: SetSwapStatusResponse, reader: jspb.BinaryReader): SetSwapStatusResponse;
}

export namespace SetSwapStatusResponse {
    export type AsObject = {
    }
}

export class AllowRefundRequest extends jspb.Message { 
    getId(): string;
    setId(value: string): AllowRefundRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): AllowRefundRequest.AsObject;
    static toObject(includeInstance: boolean, msg: AllowRefundRequest): AllowRefundRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: AllowRefundRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): AllowRefundRequest;
    static deserializeBinaryFromReader(message: AllowRefundRequest, reader: jspb.BinaryReader): AllowRefundRequest;
}

export namespace AllowRefundRequest {
    export type AsObject = {
        id: string,
    }
}

export class AllowRefundResponse extends jspb.Message { 

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): AllowRefundResponse.AsObject;
    static toObject(includeInstance: boolean, msg: AllowRefundResponse): AllowRefundResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: AllowRefundResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): AllowRefundResponse;
    static deserializeBinaryFromReader(message: AllowRefundResponse, reader: jspb.BinaryReader): AllowRefundResponse;
}

export namespace AllowRefundResponse {
    export type AsObject = {
    }
}

export class GetLabelRequest extends jspb.Message { 
    getTxId(): string;
    setTxId(value: string): GetLabelRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): GetLabelRequest.AsObject;
    static toObject(includeInstance: boolean, msg: GetLabelRequest): GetLabelRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: GetLabelRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): GetLabelRequest;
    static deserializeBinaryFromReader(message: GetLabelRequest, reader: jspb.BinaryReader): GetLabelRequest;
}

export namespace GetLabelRequest {
    export type AsObject = {
        txId: string,
    }
}

export class GetLabelResponse extends jspb.Message { 
    getSymbol(): string;
    setSymbol(value: string): GetLabelResponse;
    getLabel(): string;
    setLabel(value: string): GetLabelResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): GetLabelResponse.AsObject;
    static toObject(includeInstance: boolean, msg: GetLabelResponse): GetLabelResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: GetLabelResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): GetLabelResponse;
    static deserializeBinaryFromReader(message: GetLabelResponse, reader: jspb.BinaryReader): GetLabelResponse;
}

export namespace GetLabelResponse {
    export type AsObject = {
        symbol: string,
        label: string,
    }
}

export class GetReferralsRequest extends jspb.Message { 

    hasId(): boolean;
    clearId(): void;
    getId(): string | undefined;
    setId(value: string): GetReferralsRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): GetReferralsRequest.AsObject;
    static toObject(includeInstance: boolean, msg: GetReferralsRequest): GetReferralsRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: GetReferralsRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): GetReferralsRequest;
    static deserializeBinaryFromReader(message: GetReferralsRequest, reader: jspb.BinaryReader): GetReferralsRequest;
}

export namespace GetReferralsRequest {
    export type AsObject = {
        id?: string,
    }
}

export class GetReferralsResponse extends jspb.Message { 
    clearReferralList(): void;
    getReferralList(): Array<GetReferralsResponse.Referral>;
    setReferralList(value: Array<GetReferralsResponse.Referral>): GetReferralsResponse;
    addReferral(value?: GetReferralsResponse.Referral, index?: number): GetReferralsResponse.Referral;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): GetReferralsResponse.AsObject;
    static toObject(includeInstance: boolean, msg: GetReferralsResponse): GetReferralsResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: GetReferralsResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): GetReferralsResponse;
    static deserializeBinaryFromReader(message: GetReferralsResponse, reader: jspb.BinaryReader): GetReferralsResponse;
}

export namespace GetReferralsResponse {
    export type AsObject = {
        referralList: Array<GetReferralsResponse.Referral.AsObject>,
    }


    export class Referral extends jspb.Message { 
        getId(): string;
        setId(value: string): Referral;

        hasConfig(): boolean;
        clearConfig(): void;
        getConfig(): string | undefined;
        setConfig(value: string): Referral;

        serializeBinary(): Uint8Array;
        toObject(includeInstance?: boolean): Referral.AsObject;
        static toObject(includeInstance: boolean, msg: Referral): Referral.AsObject;
        static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
        static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
        static serializeBinaryToWriter(message: Referral, writer: jspb.BinaryWriter): void;
        static deserializeBinary(bytes: Uint8Array): Referral;
        static deserializeBinaryFromReader(message: Referral, reader: jspb.BinaryReader): Referral;
    }

    export namespace Referral {
        export type AsObject = {
            id: string,
            config?: string,
        }
    }

}

export class SetReferralRequest extends jspb.Message { 
    getId(): string;
    setId(value: string): SetReferralRequest;

    hasConfig(): boolean;
    clearConfig(): void;
    getConfig(): string | undefined;
    setConfig(value: string): SetReferralRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): SetReferralRequest.AsObject;
    static toObject(includeInstance: boolean, msg: SetReferralRequest): SetReferralRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: SetReferralRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): SetReferralRequest;
    static deserializeBinaryFromReader(message: SetReferralRequest, reader: jspb.BinaryReader): SetReferralRequest;
}

export namespace SetReferralRequest {
    export type AsObject = {
        id: string,
        config?: string,
    }
}

export class SetReferralResponse extends jspb.Message { 

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): SetReferralResponse.AsObject;
    static toObject(includeInstance: boolean, msg: SetReferralResponse): SetReferralResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: SetReferralResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): SetReferralResponse;
    static deserializeBinaryFromReader(message: SetReferralResponse, reader: jspb.BinaryReader): SetReferralResponse;
}

export namespace SetReferralResponse {
    export type AsObject = {
    }
}

export class DevHeapDumpRequest extends jspb.Message { 

    hasPath(): boolean;
    clearPath(): void;
    getPath(): string | undefined;
    setPath(value: string): DevHeapDumpRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): DevHeapDumpRequest.AsObject;
    static toObject(includeInstance: boolean, msg: DevHeapDumpRequest): DevHeapDumpRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: DevHeapDumpRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): DevHeapDumpRequest;
    static deserializeBinaryFromReader(message: DevHeapDumpRequest, reader: jspb.BinaryReader): DevHeapDumpRequest;
}

export namespace DevHeapDumpRequest {
    export type AsObject = {
        path?: string,
    }
}

export class DevHeapDumpResponse extends jspb.Message { 

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): DevHeapDumpResponse.AsObject;
    static toObject(includeInstance: boolean, msg: DevHeapDumpResponse): DevHeapDumpResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: DevHeapDumpResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): DevHeapDumpResponse;
    static deserializeBinaryFromReader(message: DevHeapDumpResponse, reader: jspb.BinaryReader): DevHeapDumpResponse;
}

export namespace DevHeapDumpResponse {
    export type AsObject = {
    }
}

export class LockedFund extends jspb.Message { 
    getSwapId(): string;
    setSwapId(value: string): LockedFund;
    getOnchainAmount(): number;
    setOnchainAmount(value: number): LockedFund;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): LockedFund.AsObject;
    static toObject(includeInstance: boolean, msg: LockedFund): LockedFund.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: LockedFund, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): LockedFund;
    static deserializeBinaryFromReader(message: LockedFund, reader: jspb.BinaryReader): LockedFund;
}

export namespace LockedFund {
    export type AsObject = {
        swapId: string,
        onchainAmount: number,
    }
}

export class LockedFunds extends jspb.Message { 
    clearReverseSwapsList(): void;
    getReverseSwapsList(): Array<LockedFund>;
    setReverseSwapsList(value: Array<LockedFund>): LockedFunds;
    addReverseSwaps(value?: LockedFund, index?: number): LockedFund;
    clearChainSwapsList(): void;
    getChainSwapsList(): Array<LockedFund>;
    setChainSwapsList(value: Array<LockedFund>): LockedFunds;
    addChainSwaps(value?: LockedFund, index?: number): LockedFund;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): LockedFunds.AsObject;
    static toObject(includeInstance: boolean, msg: LockedFunds): LockedFunds.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: LockedFunds, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): LockedFunds;
    static deserializeBinaryFromReader(message: LockedFunds, reader: jspb.BinaryReader): LockedFunds;
}

export namespace LockedFunds {
    export type AsObject = {
        reverseSwapsList: Array<LockedFund.AsObject>,
        chainSwapsList: Array<LockedFund.AsObject>,
    }
}

export class GetLockedFundsRequest extends jspb.Message { 

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): GetLockedFundsRequest.AsObject;
    static toObject(includeInstance: boolean, msg: GetLockedFundsRequest): GetLockedFundsRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: GetLockedFundsRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): GetLockedFundsRequest;
    static deserializeBinaryFromReader(message: GetLockedFundsRequest, reader: jspb.BinaryReader): GetLockedFundsRequest;
}

export namespace GetLockedFundsRequest {
    export type AsObject = {
    }
}

export class GetLockedFundsResponse extends jspb.Message { 

    getLockedFundsMap(): jspb.Map<string, LockedFunds>;
    clearLockedFundsMap(): void;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): GetLockedFundsResponse.AsObject;
    static toObject(includeInstance: boolean, msg: GetLockedFundsResponse): GetLockedFundsResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: GetLockedFundsResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): GetLockedFundsResponse;
    static deserializeBinaryFromReader(message: GetLockedFundsResponse, reader: jspb.BinaryReader): GetLockedFundsResponse;
}

export namespace GetLockedFundsResponse {
    export type AsObject = {

        lockedFundsMap: Array<[string, LockedFunds.AsObject]>,
    }
}

export class PendingSweep extends jspb.Message { 
    getSwapId(): string;
    setSwapId(value: string): PendingSweep;
    getOnchainAmount(): number;
    setOnchainAmount(value: number): PendingSweep;
    getType(): string;
    setType(value: string): PendingSweep;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): PendingSweep.AsObject;
    static toObject(includeInstance: boolean, msg: PendingSweep): PendingSweep.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: PendingSweep, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): PendingSweep;
    static deserializeBinaryFromReader(message: PendingSweep, reader: jspb.BinaryReader): PendingSweep;
}

export namespace PendingSweep {
    export type AsObject = {
        swapId: string,
        onchainAmount: number,
        type: string,
    }
}

export class CalculateTransactionFeeRequest extends jspb.Message { 
    getSymbol(): string;
    setSymbol(value: string): CalculateTransactionFeeRequest;
    getTransactionId(): string;
    setTransactionId(value: string): CalculateTransactionFeeRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): CalculateTransactionFeeRequest.AsObject;
    static toObject(includeInstance: boolean, msg: CalculateTransactionFeeRequest): CalculateTransactionFeeRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: CalculateTransactionFeeRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): CalculateTransactionFeeRequest;
    static deserializeBinaryFromReader(message: CalculateTransactionFeeRequest, reader: jspb.BinaryReader): CalculateTransactionFeeRequest;
}

export namespace CalculateTransactionFeeRequest {
    export type AsObject = {
        symbol: string,
        transactionId: string,
    }
}

export class CalculateTransactionFeeResponse extends jspb.Message { 
    getAbsolute(): number;
    setAbsolute(value: number): CalculateTransactionFeeResponse;

    hasSatPerVbyte(): boolean;
    clearSatPerVbyte(): void;
    getSatPerVbyte(): number;
    setSatPerVbyte(value: number): CalculateTransactionFeeResponse;

    hasGwei(): boolean;
    clearGwei(): void;
    getGwei(): number;
    setGwei(value: number): CalculateTransactionFeeResponse;

    getRelativeCase(): CalculateTransactionFeeResponse.RelativeCase;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): CalculateTransactionFeeResponse.AsObject;
    static toObject(includeInstance: boolean, msg: CalculateTransactionFeeResponse): CalculateTransactionFeeResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: CalculateTransactionFeeResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): CalculateTransactionFeeResponse;
    static deserializeBinaryFromReader(message: CalculateTransactionFeeResponse, reader: jspb.BinaryReader): CalculateTransactionFeeResponse;
}

export namespace CalculateTransactionFeeResponse {
    export type AsObject = {
        absolute: number,
        satPerVbyte: number,
        gwei: number,
    }

    export enum RelativeCase {
        RELATIVE_NOT_SET = 0,
        SAT_PER_VBYTE = 2,
        GWEI = 3,
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

export class PendingSweeps extends jspb.Message { 
    clearPendingSweepsList(): void;
    getPendingSweepsList(): Array<PendingSweep>;
    setPendingSweepsList(value: Array<PendingSweep>): PendingSweeps;
    addPendingSweeps(value?: PendingSweep, index?: number): PendingSweep;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): PendingSweeps.AsObject;
    static toObject(includeInstance: boolean, msg: PendingSweeps): PendingSweeps.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: PendingSweeps, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): PendingSweeps;
    static deserializeBinaryFromReader(message: PendingSweeps, reader: jspb.BinaryReader): PendingSweeps;
}

export namespace PendingSweeps {
    export type AsObject = {
        pendingSweepsList: Array<PendingSweep.AsObject>,
    }
}

export class GetPendingSweepsRequest extends jspb.Message { 

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): GetPendingSweepsRequest.AsObject;
    static toObject(includeInstance: boolean, msg: GetPendingSweepsRequest): GetPendingSweepsRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: GetPendingSweepsRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): GetPendingSweepsRequest;
    static deserializeBinaryFromReader(message: GetPendingSweepsRequest, reader: jspb.BinaryReader): GetPendingSweepsRequest;
}

export namespace GetPendingSweepsRequest {
    export type AsObject = {
    }
}

export class GetPendingSweepsResponse extends jspb.Message { 

    getPendingSweepsMap(): jspb.Map<string, PendingSweeps>;
    clearPendingSweepsMap(): void;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): GetPendingSweepsResponse.AsObject;
    static toObject(includeInstance: boolean, msg: GetPendingSweepsResponse): GetPendingSweepsResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: GetPendingSweepsResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): GetPendingSweepsResponse;
    static deserializeBinaryFromReader(message: GetPendingSweepsResponse, reader: jspb.BinaryReader): GetPendingSweepsResponse;
}

export namespace GetPendingSweepsResponse {
    export type AsObject = {

        pendingSweepsMap: Array<[string, PendingSweeps.AsObject]>,
    }
}

export enum OutputType {
    BECH32 = 0,
    COMPATIBILITY = 1,
    LEGACY = 2,
}

export enum LogLevel {
    ERROR = 0,
    WARN = 1,
    INFO = 2,
    VERBOSE = 3,
    DEBUG = 4,
    SILLY = 5,
}
