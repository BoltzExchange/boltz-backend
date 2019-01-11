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

export class GetTransactionRequest extends jspb.Message { 
    getCurrency(): string;
    setCurrency(value: string): void;

    getTransactionHash(): string;
    setTransactionHash(value: string): void;


    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): GetTransactionRequest.AsObject;
    static toObject(includeInstance: boolean, msg: GetTransactionRequest): GetTransactionRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: GetTransactionRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): GetTransactionRequest;
    static deserializeBinaryFromReader(message: GetTransactionRequest, reader: jspb.BinaryReader): GetTransactionRequest;
}

export namespace GetTransactionRequest {
    export type AsObject = {
        currency: string,
        transactionHash: string,
    }
}

export class GetTransactionResponse extends jspb.Message { 
    getTransactionHex(): string;
    setTransactionHex(value: string): void;


    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): GetTransactionResponse.AsObject;
    static toObject(includeInstance: boolean, msg: GetTransactionResponse): GetTransactionResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: GetTransactionResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): GetTransactionResponse;
    static deserializeBinaryFromReader(message: GetTransactionResponse, reader: jspb.BinaryReader): GetTransactionResponse;
}

export namespace GetTransactionResponse {
    export type AsObject = {
        transactionHex: string,
    }
}

export class BroadcastTransactionRequest extends jspb.Message { 
    getCurrency(): string;
    setCurrency(value: string): void;

    getTransactionHex(): string;
    setTransactionHex(value: string): void;


    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): BroadcastTransactionRequest.AsObject;
    static toObject(includeInstance: boolean, msg: BroadcastTransactionRequest): BroadcastTransactionRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: BroadcastTransactionRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): BroadcastTransactionRequest;
    static deserializeBinaryFromReader(message: BroadcastTransactionRequest, reader: jspb.BinaryReader): BroadcastTransactionRequest;
}

export namespace BroadcastTransactionRequest {
    export type AsObject = {
        currency: string,
        transactionHex: string,
    }
}

export class BroadcastTransactionResponse extends jspb.Message { 
    getTransactionHash(): string;
    setTransactionHash(value: string): void;


    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): BroadcastTransactionResponse.AsObject;
    static toObject(includeInstance: boolean, msg: BroadcastTransactionResponse): BroadcastTransactionResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: BroadcastTransactionResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): BroadcastTransactionResponse;
    static deserializeBinaryFromReader(message: BroadcastTransactionResponse, reader: jspb.BinaryReader): BroadcastTransactionResponse;
}

export namespace BroadcastTransactionResponse {
    export type AsObject = {
        transactionHash: string,
    }
}

export class ListenOnAddressRequest extends jspb.Message { 
    getCurrency(): string;
    setCurrency(value: string): void;

    getAddress(): string;
    setAddress(value: string): void;


    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ListenOnAddressRequest.AsObject;
    static toObject(includeInstance: boolean, msg: ListenOnAddressRequest): ListenOnAddressRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ListenOnAddressRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ListenOnAddressRequest;
    static deserializeBinaryFromReader(message: ListenOnAddressRequest, reader: jspb.BinaryReader): ListenOnAddressRequest;
}

export namespace ListenOnAddressRequest {
    export type AsObject = {
        currency: string,
        address: string,
    }
}

export class ListenOnAddressResponse extends jspb.Message { 

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ListenOnAddressResponse.AsObject;
    static toObject(includeInstance: boolean, msg: ListenOnAddressResponse): ListenOnAddressResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ListenOnAddressResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ListenOnAddressResponse;
    static deserializeBinaryFromReader(message: ListenOnAddressResponse, reader: jspb.BinaryReader): ListenOnAddressResponse;
}

export namespace ListenOnAddressResponse {
    export type AsObject = {
    }
}

export class SubscribeTransactionsRequest extends jspb.Message { 

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): SubscribeTransactionsRequest.AsObject;
    static toObject(includeInstance: boolean, msg: SubscribeTransactionsRequest): SubscribeTransactionsRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: SubscribeTransactionsRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): SubscribeTransactionsRequest;
    static deserializeBinaryFromReader(message: SubscribeTransactionsRequest, reader: jspb.BinaryReader): SubscribeTransactionsRequest;
}

export namespace SubscribeTransactionsRequest {
    export type AsObject = {
    }
}

export class SubscribeTransactionsResponse extends jspb.Message { 
    getTransactionHash(): string;
    setTransactionHash(value: string): void;

    getOutputAddress(): string;
    setOutputAddress(value: string): void;


    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): SubscribeTransactionsResponse.AsObject;
    static toObject(includeInstance: boolean, msg: SubscribeTransactionsResponse): SubscribeTransactionsResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: SubscribeTransactionsResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): SubscribeTransactionsResponse;
    static deserializeBinaryFromReader(message: SubscribeTransactionsResponse, reader: jspb.BinaryReader): SubscribeTransactionsResponse;
}

export namespace SubscribeTransactionsResponse {
    export type AsObject = {
        transactionHash: string,
        outputAddress: string,
    }
}

export class SubscribeInvoicesRequest extends jspb.Message { 

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): SubscribeInvoicesRequest.AsObject;
    static toObject(includeInstance: boolean, msg: SubscribeInvoicesRequest): SubscribeInvoicesRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: SubscribeInvoicesRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): SubscribeInvoicesRequest;
    static deserializeBinaryFromReader(message: SubscribeInvoicesRequest, reader: jspb.BinaryReader): SubscribeInvoicesRequest;
}

export namespace SubscribeInvoicesRequest {
    export type AsObject = {
    }
}

export class SubscribeInvoicesResponse extends jspb.Message { 
    getEvent(): InvoiceEvent;
    setEvent(value: InvoiceEvent): void;

    getInvoice(): string;
    setInvoice(value: string): void;


    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): SubscribeInvoicesResponse.AsObject;
    static toObject(includeInstance: boolean, msg: SubscribeInvoicesResponse): SubscribeInvoicesResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: SubscribeInvoicesResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): SubscribeInvoicesResponse;
    static deserializeBinaryFromReader(message: SubscribeInvoicesResponse, reader: jspb.BinaryReader): SubscribeInvoicesResponse;
}

export namespace SubscribeInvoicesResponse {
    export type AsObject = {
        event: InvoiceEvent,
        invoice: string,
    }
}

export class CreateSwapRequest extends jspb.Message { 
    getBaseCurrency(): string;
    setBaseCurrency(value: string): void;

    getQuoteCurrency(): string;
    setQuoteCurrency(value: string): void;

    getOrderSide(): OrderSide;
    setOrderSide(value: OrderSide): void;

    getRate(): number;
    setRate(value: number): void;

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
        baseCurrency: string,
        quoteCurrency: string,
        orderSide: OrderSide,
        rate: number,
        invoice: string,
        refundPublicKey: string,
        outputType: OutputType,
    }
}

export class CreateSwapResponse extends jspb.Message { 
    getRedeemScript(): string;
    setRedeemScript(value: string): void;

    getTimeoutBlockHeight(): number;
    setTimeoutBlockHeight(value: number): void;

    getAddress(): string;
    setAddress(value: string): void;

    getExpectedAmount(): number;
    setExpectedAmount(value: number): void;


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
        redeemScript: string,
        timeoutBlockHeight: number,
        address: string,
        expectedAmount: number,
    }
}

export class CreateReverseSwapRequest extends jspb.Message { 
    getBaseCurrency(): string;
    setBaseCurrency(value: string): void;

    getQuoteCurrency(): string;
    setQuoteCurrency(value: string): void;

    getOrderSide(): OrderSide;
    setOrderSide(value: OrderSide): void;

    getRate(): number;
    setRate(value: number): void;

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
        baseCurrency: string,
        quoteCurrency: string,
        orderSide: OrderSide,
        rate: number,
        claimPublicKey: string,
        amount: number,
    }
}

export class CreateReverseSwapResponse extends jspb.Message { 
    getInvoice(): string;
    setInvoice(value: string): void;

    getRedeemScript(): string;
    setRedeemScript(value: string): void;

    getLockupAddress(): string;
    setLockupAddress(value: string): void;

    getLockupTransaction(): string;
    setLockupTransaction(value: string): void;

    getLockupTransactionHash(): string;
    setLockupTransactionHash(value: string): void;


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
        lockupAddress: string,
        lockupTransaction: string,
        lockupTransactionHash: string,
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

export enum InvoiceEvent {
    PAID = 0,
    SETTLED = 1,
}
