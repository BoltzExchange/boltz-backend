// package: boltzrpc
// file: boltzrpc.proto

/* tslint:disable */

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
    setVersion(value: string): void;


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
    setChain(value?: ChainInfo): void;


    hasLnd(): boolean;
    clearLnd(): void;
    getLnd(): LndInfo | undefined;
    setLnd(value?: LndInfo): void;


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
        lnd?: LndInfo.AsObject,
    }
}

export class ChainInfo extends jspb.Message { 
    getVersion(): number;
    setVersion(value: number): void;

    getProtocolversion(): number;
    setProtocolversion(value: number): void;

    getBlocks(): number;
    setBlocks(value: number): void;

    getConnections(): number;
    setConnections(value: number): void;

    getError(): string;
    setError(value: string): void;


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
        protocolversion: number,
        blocks: number,
        connections: number,
        error: string,
    }
}

export class LndInfo extends jspb.Message { 
    getVersion(): string;
    setVersion(value: string): void;


    hasLndChannels(): boolean;
    clearLndChannels(): void;
    getLndChannels(): LndChannels | undefined;
    setLndChannels(value?: LndChannels): void;

    getBlockHeight(): number;
    setBlockHeight(value: number): void;

    getError(): string;
    setError(value: string): void;


    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): LndInfo.AsObject;
    static toObject(includeInstance: boolean, msg: LndInfo): LndInfo.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: LndInfo, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): LndInfo;
    static deserializeBinaryFromReader(message: LndInfo, reader: jspb.BinaryReader): LndInfo;
}

export namespace LndInfo {
    export type AsObject = {
        version: string,
        lndChannels?: LndChannels.AsObject,
        blockHeight: number,
        error: string,
    }
}

export class LndChannels extends jspb.Message { 
    getActive(): number;
    setActive(value: number): void;

    getInactive(): number;
    setInactive(value: number): void;

    getPending(): number;
    setPending(value: number): void;


    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): LndChannels.AsObject;
    static toObject(includeInstance: boolean, msg: LndChannels): LndChannels.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: LndChannels, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): LndChannels;
    static deserializeBinaryFromReader(message: LndChannels, reader: jspb.BinaryReader): LndChannels;
}

export namespace LndChannels {
    export type AsObject = {
        active: number,
        inactive: number,
        pending: number,
    }
}

export class GetBalanceRequest extends jspb.Message { 
    getSymbol(): string;
    setSymbol(value: string): void;


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
        symbol: string,
    }
}

export class GetBalanceResponse extends jspb.Message { 

    getBalancesMap(): jspb.Map<string, Balance>;
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

        balancesMap: Array<[string, Balance.AsObject]>,
    }
}

export class Balance extends jspb.Message { 

    hasWalletBalance(): boolean;
    clearWalletBalance(): void;
    getWalletBalance(): WalletBalance | undefined;
    setWalletBalance(value?: WalletBalance): void;


    hasLightningBalance(): boolean;
    clearLightningBalance(): void;
    getLightningBalance(): LightningBalance | undefined;
    setLightningBalance(value?: LightningBalance): void;


    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): Balance.AsObject;
    static toObject(includeInstance: boolean, msg: Balance): Balance.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: Balance, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): Balance;
    static deserializeBinaryFromReader(message: Balance, reader: jspb.BinaryReader): Balance;
}

export namespace Balance {
    export type AsObject = {
        walletBalance?: WalletBalance.AsObject,
        lightningBalance?: LightningBalance.AsObject,
    }
}

export class LightningBalance extends jspb.Message { 

    hasWalletBalance(): boolean;
    clearWalletBalance(): void;
    getWalletBalance(): WalletBalance | undefined;
    setWalletBalance(value?: WalletBalance): void;


    hasChannelBalance(): boolean;
    clearChannelBalance(): void;
    getChannelBalance(): ChannelBalance | undefined;
    setChannelBalance(value?: ChannelBalance): void;


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
        walletBalance?: WalletBalance.AsObject,
        channelBalance?: ChannelBalance.AsObject,
    }
}

export class WalletBalance extends jspb.Message { 
    getTotalBalance(): number;
    setTotalBalance(value: number): void;

    getConfirmedBalance(): number;
    setConfirmedBalance(value: number): void;

    getUnconfirmedBalance(): number;
    setUnconfirmedBalance(value: number): void;


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
        totalBalance: number,
        confirmedBalance: number,
        unconfirmedBalance: number,
    }
}

export class ChannelBalance extends jspb.Message { 
    getLocalBalance(): number;
    setLocalBalance(value: number): void;

    getRemoteBalance(): number;
    setRemoteBalance(value: number): void;


    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ChannelBalance.AsObject;
    static toObject(includeInstance: boolean, msg: ChannelBalance): ChannelBalance.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ChannelBalance, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ChannelBalance;
    static deserializeBinaryFromReader(message: ChannelBalance, reader: jspb.BinaryReader): ChannelBalance;
}

export namespace ChannelBalance {
    export type AsObject = {
        localBalance: number,
        remoteBalance: number,
    }
}

export class NewAddressRequest extends jspb.Message { 
    getSymbol(): string;
    setSymbol(value: string): void;

    getType(): OutputType;
    setType(value: OutputType): void;


    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): NewAddressRequest.AsObject;
    static toObject(includeInstance: boolean, msg: NewAddressRequest): NewAddressRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: NewAddressRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): NewAddressRequest;
    static deserializeBinaryFromReader(message: NewAddressRequest, reader: jspb.BinaryReader): NewAddressRequest;
}

export namespace NewAddressRequest {
    export type AsObject = {
        symbol: string,
        type: OutputType,
    }
}

export class NewAddressResponse extends jspb.Message { 
    getAddress(): string;
    setAddress(value: string): void;


    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): NewAddressResponse.AsObject;
    static toObject(includeInstance: boolean, msg: NewAddressResponse): NewAddressResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: NewAddressResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): NewAddressResponse;
    static deserializeBinaryFromReader(message: NewAddressResponse, reader: jspb.BinaryReader): NewAddressResponse;
}

export namespace NewAddressResponse {
    export type AsObject = {
        address: string,
    }
}

export class SendCoinsRequest extends jspb.Message { 
    getSymbol(): string;
    setSymbol(value: string): void;

    getAddress(): string;
    setAddress(value: string): void;

    getAmount(): number;
    setAmount(value: number): void;

    getSatPerVbyte(): number;
    setSatPerVbyte(value: number): void;

    getSendAll(): boolean;
    setSendAll(value: boolean): void;


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
        satPerVbyte: number,
        sendAll: boolean,
    }
}

export class SendCoinsResponse extends jspb.Message { 
    getTransactionHash(): string;
    setTransactionHash(value: string): void;

    getVout(): number;
    setVout(value: number): void;


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
        transactionHash: string,
        vout: number,
    }
}

export enum OutputType {
    BECH32 = 0,
    COMPATIBILITY = 1,
    LEGACY = 2,
}
