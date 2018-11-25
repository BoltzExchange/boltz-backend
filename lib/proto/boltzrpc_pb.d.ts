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

    clearChainsList(): void;
    getChainsList(): Array<CurrencyInfo>;
    setChainsList(value: Array<CurrencyInfo>): void;
    addChains(value?: CurrencyInfo, index?: number): CurrencyInfo;


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
        chainsList: Array<CurrencyInfo.AsObject>,
    }
}

export class CurrencyInfo extends jspb.Message { 
    getSymbol(): string;
    setSymbol(value: string): void;


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
        symbol: string,
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

    getTestnet(): boolean;
    setTestnet(value: boolean): void;


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
        testnet: boolean,
    }
}

export class LndInfo extends jspb.Message { 
    getVersion(): string;
    setVersion(value: string): void;


    hasLndchannels(): boolean;
    clearLndchannels(): void;
    getLndchannels(): LndChannels | undefined;
    setLndchannels(value?: LndChannels): void;

    getBlockheight(): number;
    setBlockheight(value: number): void;

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
        lndchannels?: LndChannels.AsObject,
        blockheight: number,
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
    getCurrency(): string;
    setCurrency(value: string): void;


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
        currency: string,
    }
}

export class GetBalanceResponse extends jspb.Message { 

    getBalancesMap(): jspb.Map<string, WalletBalance>;
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

        balancesMap: Array<[string, WalletBalance.AsObject]>,
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

export class NewAddressRequest extends jspb.Message { 
    getCurrency(): string;
    setCurrency(value: string): void;

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
        currency: string,
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

export class CreateSwapRequest extends jspb.Message { 
    getPairId(): string;
    setPairId(value: string): void;

    getOrderSide(): OrderSide;
    setOrderSide(value: OrderSide): void;

    getInvoice(): string;
    setInvoice(value: string): void;

    getRefundPublicKey(): string;
    setRefundPublicKey(value: string): void;

    getOutputType(): OutputType;
    setOutputType(value: OutputType): void;


    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): CreateSwapRequest.AsObject;
    static toObject(includeInstance: boolean, msg: CreateSwapRequest): CreateSwapRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: CreateSwapRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): CreateSwapRequest;
    static deserializeBinaryFromReader(message: CreateSwapRequest, reader: jspb.BinaryReader): CreateSwapRequest;
}

export namespace CreateSwapRequest {
    export type AsObject = {
        pairId: string,
        orderSide: OrderSide,
        invoice: string,
        refundPublicKey: string,
        outputType: OutputType,
    }
}

export class CreateSwapResponse extends jspb.Message { 
    getAddress(): string;
    setAddress(value: string): void;

    getRedeemScript(): string;
    setRedeemScript(value: string): void;

    getExpectedAmount(): number;
    setExpectedAmount(value: number): void;

    getBip21(): string;
    setBip21(value: string): void;


    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): CreateSwapResponse.AsObject;
    static toObject(includeInstance: boolean, msg: CreateSwapResponse): CreateSwapResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: CreateSwapResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): CreateSwapResponse;
    static deserializeBinaryFromReader(message: CreateSwapResponse, reader: jspb.BinaryReader): CreateSwapResponse;
}

export namespace CreateSwapResponse {
    export type AsObject = {
        address: string,
        redeemScript: string,
        expectedAmount: number,
        bip21: string,
    }
}

export class CreateReverseSwapRequest extends jspb.Message { 
    getPairId(): string;
    setPairId(value: string): void;

    getOrderSide(): OrderSide;
    setOrderSide(value: OrderSide): void;

    getClaimPublicKey(): string;
    setClaimPublicKey(value: string): void;

    getAmount(): number;
    setAmount(value: number): void;


    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): CreateReverseSwapRequest.AsObject;
    static toObject(includeInstance: boolean, msg: CreateReverseSwapRequest): CreateReverseSwapRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: CreateReverseSwapRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): CreateReverseSwapRequest;
    static deserializeBinaryFromReader(message: CreateReverseSwapRequest, reader: jspb.BinaryReader): CreateReverseSwapRequest;
}

export namespace CreateReverseSwapRequest {
    export type AsObject = {
        pairId: string,
        orderSide: OrderSide,
        claimPublicKey: string,
        amount: number,
    }
}

export class CreateReverseSwapResponse extends jspb.Message { 
    getInvoice(): string;
    setInvoice(value: string): void;

    getRedeemScript(): string;
    setRedeemScript(value: string): void;

    getTransaction(): string;
    setTransaction(value: string): void;

    getTransactionHash(): string;
    setTransactionHash(value: string): void;


    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): CreateReverseSwapResponse.AsObject;
    static toObject(includeInstance: boolean, msg: CreateReverseSwapResponse): CreateReverseSwapResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: CreateReverseSwapResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): CreateReverseSwapResponse;
    static deserializeBinaryFromReader(message: CreateReverseSwapResponse, reader: jspb.BinaryReader): CreateReverseSwapResponse;
}

export namespace CreateReverseSwapResponse {
    export type AsObject = {
        invoice: string,
        redeemScript: string,
        transaction: string,
        transactionHash: string,
    }
}

export enum OutputType {
    BECH32 = 0,
    COMPATIBILITY = 1,
    LEGACY = 2,
}

export enum OrderSide {
    BUY = 0,
    SELL = 1,
}
