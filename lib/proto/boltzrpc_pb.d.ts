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

export class GetFeeEstimationRequest extends jspb.Message { 
    getCurrency(): string;
    setCurrency(value: string): void;

    getBlocks(): number;
    setBlocks(value: number): void;


    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): GetFeeEstimationRequest.AsObject;
    static toObject(includeInstance: boolean, msg: GetFeeEstimationRequest): GetFeeEstimationRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: GetFeeEstimationRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): GetFeeEstimationRequest;
    static deserializeBinaryFromReader(message: GetFeeEstimationRequest, reader: jspb.BinaryReader): GetFeeEstimationRequest;
}

export namespace GetFeeEstimationRequest {
    export type AsObject = {
        currency: string,
        blocks: number,
    }
}

export class GetFeeEstimationResponse extends jspb.Message { 

    getFeesMap(): jspb.Map<string, number>;
    clearFeesMap(): void;


    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): GetFeeEstimationResponse.AsObject;
    static toObject(includeInstance: boolean, msg: GetFeeEstimationResponse): GetFeeEstimationResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: GetFeeEstimationResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): GetFeeEstimationResponse;
    static deserializeBinaryFromReader(message: GetFeeEstimationResponse, reader: jspb.BinaryReader): GetFeeEstimationResponse;
}

export namespace GetFeeEstimationResponse {
    export type AsObject = {

        feesMap: Array<[string, number]>,
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
    getOutputAddress(): string;
    setOutputAddress(value: string): void;

    getTransactionHash(): string;
    setTransactionHash(value: string): void;

    getAmountReceived(): number;
    setAmountReceived(value: number): void;

    getConfirmed(): boolean;
    setConfirmed(value: boolean): void;


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
        outputAddress: string,
        transactionHash: string,
        amountReceived: number,
        confirmed: boolean,
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


    hasPreimage(): boolean;
    clearPreimage(): void;
    getPreimage(): string;
    setPreimage(value: string): void;


    hasRoutingFee(): boolean;
    clearRoutingFee(): void;
    getRoutingFee(): number;
    setRoutingFee(value: number): void;


    getEventDetailsCase(): SubscribeInvoicesResponse.EventDetailsCase;

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
        preimage: string,
        routingFee: number,
    }

    export enum EventDetailsCase {
        EVENTDETAILS_NOT_SET = 0,
    
    PREIMAGE = 3,

    ROUTING_FEE = 4,

    }

}

export class SubscribeSwapEventsRequest extends jspb.Message { 

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): SubscribeSwapEventsRequest.AsObject;
    static toObject(includeInstance: boolean, msg: SubscribeSwapEventsRequest): SubscribeSwapEventsRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: SubscribeSwapEventsRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): SubscribeSwapEventsRequest;
    static deserializeBinaryFromReader(message: SubscribeSwapEventsRequest, reader: jspb.BinaryReader): SubscribeSwapEventsRequest;
}

export namespace SubscribeSwapEventsRequest {
    export type AsObject = {
    }
}

export class SubscribeSwapEventsResponse extends jspb.Message { 
    getEvent(): SwapEvent;
    setEvent(value: SwapEvent): void;


    hasClaimDetails(): boolean;
    clearClaimDetails(): void;
    getClaimDetails(): ClaimDetails | undefined;
    setClaimDetails(value?: ClaimDetails): void;


    hasAbortDetails(): boolean;
    clearAbortDetails(): void;
    getAbortDetails(): AbortDetails | undefined;
    setAbortDetails(value?: AbortDetails): void;


    hasRefundDetails(): boolean;
    clearRefundDetails(): void;
    getRefundDetails(): RefundDetails | undefined;
    setRefundDetails(value?: RefundDetails): void;


    hasZeroConfRejectedDetails(): boolean;
    clearZeroConfRejectedDetails(): void;
    getZeroConfRejectedDetails(): ZeroConfRejectedDetails | undefined;
    setZeroConfRejectedDetails(value?: ZeroConfRejectedDetails): void;


    getEventDetailsCase(): SubscribeSwapEventsResponse.EventDetailsCase;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): SubscribeSwapEventsResponse.AsObject;
    static toObject(includeInstance: boolean, msg: SubscribeSwapEventsResponse): SubscribeSwapEventsResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: SubscribeSwapEventsResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): SubscribeSwapEventsResponse;
    static deserializeBinaryFromReader(message: SubscribeSwapEventsResponse, reader: jspb.BinaryReader): SubscribeSwapEventsResponse;
}

export namespace SubscribeSwapEventsResponse {
    export type AsObject = {
        event: SwapEvent,
        claimDetails?: ClaimDetails.AsObject,
        abortDetails?: AbortDetails.AsObject,
        refundDetails?: RefundDetails.AsObject,
        zeroConfRejectedDetails?: ZeroConfRejectedDetails.AsObject,
    }

    export enum EventDetailsCase {
        EVENTDETAILS_NOT_SET = 0,
    
    CLAIM_DETAILS = 2,

    ABORT_DETAILS = 3,

    REFUND_DETAILS = 4,

    ZERO_CONF_REJECTED_DETAILS = 5,

    }

}

export class ClaimDetails extends jspb.Message { 
    getLockupTransactionHash(): string;
    setLockupTransactionHash(value: string): void;

    getLockupVout(): number;
    setLockupVout(value: number): void;

    getMinerFee(): number;
    setMinerFee(value: number): void;


    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ClaimDetails.AsObject;
    static toObject(includeInstance: boolean, msg: ClaimDetails): ClaimDetails.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ClaimDetails, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ClaimDetails;
    static deserializeBinaryFromReader(message: ClaimDetails, reader: jspb.BinaryReader): ClaimDetails;
}

export namespace ClaimDetails {
    export type AsObject = {
        lockupTransactionHash: string,
        lockupVout: number,
        minerFee: number,
    }
}

export class AbortDetails extends jspb.Message { 
    getInvoice(): string;
    setInvoice(value: string): void;


    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): AbortDetails.AsObject;
    static toObject(includeInstance: boolean, msg: AbortDetails): AbortDetails.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: AbortDetails, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): AbortDetails;
    static deserializeBinaryFromReader(message: AbortDetails, reader: jspb.BinaryReader): AbortDetails;
}

export namespace AbortDetails {
    export type AsObject = {
        invoice: string,
    }
}

export class RefundDetails extends jspb.Message { 
    getLockupTransactionHash(): string;
    setLockupTransactionHash(value: string): void;

    getLockupVout(): number;
    setLockupVout(value: number): void;

    getMinerFee(): number;
    setMinerFee(value: number): void;


    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): RefundDetails.AsObject;
    static toObject(includeInstance: boolean, msg: RefundDetails): RefundDetails.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: RefundDetails, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): RefundDetails;
    static deserializeBinaryFromReader(message: RefundDetails, reader: jspb.BinaryReader): RefundDetails;
}

export namespace RefundDetails {
    export type AsObject = {
        lockupTransactionHash: string,
        lockupVout: number,
        minerFee: number,
    }
}

export class ZeroConfRejectedDetails extends jspb.Message { 
    getInvoice(): string;
    setInvoice(value: string): void;

    getReason(): string;
    setReason(value: string): void;


    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ZeroConfRejectedDetails.AsObject;
    static toObject(includeInstance: boolean, msg: ZeroConfRejectedDetails): ZeroConfRejectedDetails.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ZeroConfRejectedDetails, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ZeroConfRejectedDetails;
    static deserializeBinaryFromReader(message: ZeroConfRejectedDetails, reader: jspb.BinaryReader): ZeroConfRejectedDetails;
}

export namespace ZeroConfRejectedDetails {
    export type AsObject = {
        invoice: string,
        reason: string,
    }
}

export class CreateSwapRequest extends jspb.Message { 
    getBaseCurrency(): string;
    setBaseCurrency(value: string): void;

    getQuoteCurrency(): string;
    setQuoteCurrency(value: string): void;

    getOrderSide(): OrderSide;
    setOrderSide(value: OrderSide): void;

    getInvoice(): string;
    setInvoice(value: string): void;

    getExpectedAmount(): number;
    setExpectedAmount(value: number): void;

    getRefundPublicKey(): string;
    setRefundPublicKey(value: string): void;

    getOutputType(): OutputType;
    setOutputType(value: OutputType): void;

    getTimeoutBlockDelta(): number;
    setTimeoutBlockDelta(value: number): void;

    getAcceptZeroConf(): boolean;
    setAcceptZeroConf(value: boolean): void;


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
        invoice: string,
        expectedAmount: number,
        refundPublicKey: string,
        outputType: OutputType,
        timeoutBlockDelta: number,
        acceptZeroConf: boolean,
    }
}

export class CreateSwapResponse extends jspb.Message { 
    getRedeemScript(): string;
    setRedeemScript(value: string): void;

    getTimeoutBlockHeight(): number;
    setTimeoutBlockHeight(value: number): void;

    getAddress(): string;
    setAddress(value: string): void;


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
    }
}

export class CreateReverseSwapRequest extends jspb.Message { 
    getBaseCurrency(): string;
    setBaseCurrency(value: string): void;

    getQuoteCurrency(): string;
    setQuoteCurrency(value: string): void;

    getOrderSide(): OrderSide;
    setOrderSide(value: OrderSide): void;

    getInvoiceAmount(): number;
    setInvoiceAmount(value: number): void;

    getOnchainAmount(): number;
    setOnchainAmount(value: number): void;

    getClaimPublicKey(): string;
    setClaimPublicKey(value: string): void;

    getTimeoutBlockDelta(): number;
    setTimeoutBlockDelta(value: number): void;


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
        invoiceAmount: number,
        onchainAmount: number,
        claimPublicKey: string,
        timeoutBlockDelta: number,
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

    getMinerFee(): number;
    setMinerFee(value: number): void;


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
        minerFee: number,
    }
}

export class SendCoinsRequest extends jspb.Message { 
    getCurrency(): string;
    setCurrency(value: string): void;

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
        currency: string,
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

export class SubscribeChannelBackupsRequest extends jspb.Message { 

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): SubscribeChannelBackupsRequest.AsObject;
    static toObject(includeInstance: boolean, msg: SubscribeChannelBackupsRequest): SubscribeChannelBackupsRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: SubscribeChannelBackupsRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): SubscribeChannelBackupsRequest;
    static deserializeBinaryFromReader(message: SubscribeChannelBackupsRequest, reader: jspb.BinaryReader): SubscribeChannelBackupsRequest;
}

export namespace SubscribeChannelBackupsRequest {
    export type AsObject = {
    }
}

export class ChannelBackup extends jspb.Message { 
    getCurrency(): string;
    setCurrency(value: string): void;

    getMultiChannelBackup(): string;
    setMultiChannelBackup(value: string): void;


    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ChannelBackup.AsObject;
    static toObject(includeInstance: boolean, msg: ChannelBackup): ChannelBackup.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ChannelBackup, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ChannelBackup;
    static deserializeBinaryFromReader(message: ChannelBackup, reader: jspb.BinaryReader): ChannelBackup;
}

export namespace ChannelBackup {
    export type AsObject = {
        currency: string,
        multiChannelBackup: string,
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
    FAILED_TO_PAY = 1,
    SETTLED = 2,
}

export enum SwapEvent {
    CLAIM = 0,
    ABORT = 1,
    ZEROCONF_REJECTED = 2,
    REFUND = 3,
}
