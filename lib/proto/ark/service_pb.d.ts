// package: fulmine.v1
// file: ark/service.proto

/* tslint:disable */
/* eslint-disable */

import * as jspb from "google-protobuf";
import * as ark_types_pb from "../ark/types_pb";

export class GetAddressRequest extends jspb.Message { 

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
    }
}

export class GetAddressResponse extends jspb.Message { 
    getAddress(): string;
    setAddress(value: string): GetAddressResponse;
    getPubkey(): string;
    setPubkey(value: string): GetAddressResponse;

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
        pubkey: string,
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
    getAmount(): number;
    setAmount(value: number): GetBalanceResponse;

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
        amount: number,
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
    getNetwork(): GetInfoResponse.Network;
    setNetwork(value: GetInfoResponse.Network): GetInfoResponse;
    getAddrPrefix(): string;
    setAddrPrefix(value: string): GetInfoResponse;
    getServerUrl(): string;
    setServerUrl(value: string): GetInfoResponse;

    hasBuildInfo(): boolean;
    clearBuildInfo(): void;
    getBuildInfo(): ark_types_pb.BuildInfo | undefined;
    setBuildInfo(value?: ark_types_pb.BuildInfo): GetInfoResponse;
    getPubkey(): string;
    setPubkey(value: string): GetInfoResponse;
    getSignerPubkey(): string;
    setSignerPubkey(value: string): GetInfoResponse;

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
        network: GetInfoResponse.Network,
        addrPrefix: string,
        serverUrl: string,
        buildInfo?: ark_types_pb.BuildInfo.AsObject,
        pubkey: string,
        signerPubkey: string,
    }

    export enum Network {
    NETWORK_UNSPECIFIED = 0,
    NETWORK_MAINNET = 1,
    NETWORK_TESTNET = 2,
    NETWORK_REGTEST = 3,
    }

}

export class GetOnboardAddressRequest extends jspb.Message { 
    getAmount(): number;
    setAmount(value: number): GetOnboardAddressRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): GetOnboardAddressRequest.AsObject;
    static toObject(includeInstance: boolean, msg: GetOnboardAddressRequest): GetOnboardAddressRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: GetOnboardAddressRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): GetOnboardAddressRequest;
    static deserializeBinaryFromReader(message: GetOnboardAddressRequest, reader: jspb.BinaryReader): GetOnboardAddressRequest;
}

export namespace GetOnboardAddressRequest {
    export type AsObject = {
        amount: number,
    }
}

export class GetOnboardAddressResponse extends jspb.Message { 
    getAddress(): string;
    setAddress(value: string): GetOnboardAddressResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): GetOnboardAddressResponse.AsObject;
    static toObject(includeInstance: boolean, msg: GetOnboardAddressResponse): GetOnboardAddressResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: GetOnboardAddressResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): GetOnboardAddressResponse;
    static deserializeBinaryFromReader(message: GetOnboardAddressResponse, reader: jspb.BinaryReader): GetOnboardAddressResponse;
}

export namespace GetOnboardAddressResponse {
    export type AsObject = {
        address: string,
    }
}

export class GetRoundInfoRequest extends jspb.Message { 
    getRoundId(): string;
    setRoundId(value: string): GetRoundInfoRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): GetRoundInfoRequest.AsObject;
    static toObject(includeInstance: boolean, msg: GetRoundInfoRequest): GetRoundInfoRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: GetRoundInfoRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): GetRoundInfoRequest;
    static deserializeBinaryFromReader(message: GetRoundInfoRequest, reader: jspb.BinaryReader): GetRoundInfoRequest;
}

export namespace GetRoundInfoRequest {
    export type AsObject = {
        roundId: string,
    }
}

export class GetRoundInfoResponse extends jspb.Message { 

    hasRound(): boolean;
    clearRound(): void;
    getRound(): ark_types_pb.Round | undefined;
    setRound(value?: ark_types_pb.Round): GetRoundInfoResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): GetRoundInfoResponse.AsObject;
    static toObject(includeInstance: boolean, msg: GetRoundInfoResponse): GetRoundInfoResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: GetRoundInfoResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): GetRoundInfoResponse;
    static deserializeBinaryFromReader(message: GetRoundInfoResponse, reader: jspb.BinaryReader): GetRoundInfoResponse;
}

export namespace GetRoundInfoResponse {
    export type AsObject = {
        round?: ark_types_pb.Round.AsObject,
    }
}

export class GetTransactionHistoryRequest extends jspb.Message { 

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): GetTransactionHistoryRequest.AsObject;
    static toObject(includeInstance: boolean, msg: GetTransactionHistoryRequest): GetTransactionHistoryRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: GetTransactionHistoryRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): GetTransactionHistoryRequest;
    static deserializeBinaryFromReader(message: GetTransactionHistoryRequest, reader: jspb.BinaryReader): GetTransactionHistoryRequest;
}

export namespace GetTransactionHistoryRequest {
    export type AsObject = {
    }
}

export class GetTransactionHistoryResponse extends jspb.Message { 
    clearTransactionsList(): void;
    getTransactionsList(): Array<ark_types_pb.TransactionInfo>;
    setTransactionsList(value: Array<ark_types_pb.TransactionInfo>): GetTransactionHistoryResponse;
    addTransactions(value?: ark_types_pb.TransactionInfo, index?: number): ark_types_pb.TransactionInfo;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): GetTransactionHistoryResponse.AsObject;
    static toObject(includeInstance: boolean, msg: GetTransactionHistoryResponse): GetTransactionHistoryResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: GetTransactionHistoryResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): GetTransactionHistoryResponse;
    static deserializeBinaryFromReader(message: GetTransactionHistoryResponse, reader: jspb.BinaryReader): GetTransactionHistoryResponse;
}

export namespace GetTransactionHistoryResponse {
    export type AsObject = {
        transactionsList: Array<ark_types_pb.TransactionInfo.AsObject>,
    }
}

export class RedeemNoteRequest extends jspb.Message { 
    getNote(): string;
    setNote(value: string): RedeemNoteRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): RedeemNoteRequest.AsObject;
    static toObject(includeInstance: boolean, msg: RedeemNoteRequest): RedeemNoteRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: RedeemNoteRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): RedeemNoteRequest;
    static deserializeBinaryFromReader(message: RedeemNoteRequest, reader: jspb.BinaryReader): RedeemNoteRequest;
}

export namespace RedeemNoteRequest {
    export type AsObject = {
        note: string,
    }
}

export class RedeemNoteResponse extends jspb.Message { 
    getTxid(): string;
    setTxid(value: string): RedeemNoteResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): RedeemNoteResponse.AsObject;
    static toObject(includeInstance: boolean, msg: RedeemNoteResponse): RedeemNoteResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: RedeemNoteResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): RedeemNoteResponse;
    static deserializeBinaryFromReader(message: RedeemNoteResponse, reader: jspb.BinaryReader): RedeemNoteResponse;
}

export namespace RedeemNoteResponse {
    export type AsObject = {
        txid: string,
    }
}

export class SettleRequest extends jspb.Message { 

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): SettleRequest.AsObject;
    static toObject(includeInstance: boolean, msg: SettleRequest): SettleRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: SettleRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): SettleRequest;
    static deserializeBinaryFromReader(message: SettleRequest, reader: jspb.BinaryReader): SettleRequest;
}

export namespace SettleRequest {
    export type AsObject = {
    }
}

export class SettleResponse extends jspb.Message { 
    getTxid(): string;
    setTxid(value: string): SettleResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): SettleResponse.AsObject;
    static toObject(includeInstance: boolean, msg: SettleResponse): SettleResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: SettleResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): SettleResponse;
    static deserializeBinaryFromReader(message: SettleResponse, reader: jspb.BinaryReader): SettleResponse;
}

export namespace SettleResponse {
    export type AsObject = {
        txid: string,
    }
}

export class SendOffChainRequest extends jspb.Message { 
    getAddress(): string;
    setAddress(value: string): SendOffChainRequest;
    getAmount(): number;
    setAmount(value: number): SendOffChainRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): SendOffChainRequest.AsObject;
    static toObject(includeInstance: boolean, msg: SendOffChainRequest): SendOffChainRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: SendOffChainRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): SendOffChainRequest;
    static deserializeBinaryFromReader(message: SendOffChainRequest, reader: jspb.BinaryReader): SendOffChainRequest;
}

export namespace SendOffChainRequest {
    export type AsObject = {
        address: string,
        amount: number,
    }
}

export class SendOffChainResponse extends jspb.Message { 
    getTxid(): string;
    setTxid(value: string): SendOffChainResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): SendOffChainResponse.AsObject;
    static toObject(includeInstance: boolean, msg: SendOffChainResponse): SendOffChainResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: SendOffChainResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): SendOffChainResponse;
    static deserializeBinaryFromReader(message: SendOffChainResponse, reader: jspb.BinaryReader): SendOffChainResponse;
}

export namespace SendOffChainResponse {
    export type AsObject = {
        txid: string,
    }
}

export class SendOnChainRequest extends jspb.Message { 
    getAddress(): string;
    setAddress(value: string): SendOnChainRequest;
    getAmount(): number;
    setAmount(value: number): SendOnChainRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): SendOnChainRequest.AsObject;
    static toObject(includeInstance: boolean, msg: SendOnChainRequest): SendOnChainRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: SendOnChainRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): SendOnChainRequest;
    static deserializeBinaryFromReader(message: SendOnChainRequest, reader: jspb.BinaryReader): SendOnChainRequest;
}

export namespace SendOnChainRequest {
    export type AsObject = {
        address: string,
        amount: number,
    }
}

export class SendOnChainResponse extends jspb.Message { 
    getTxid(): string;
    setTxid(value: string): SendOnChainResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): SendOnChainResponse.AsObject;
    static toObject(includeInstance: boolean, msg: SendOnChainResponse): SendOnChainResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: SendOnChainResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): SendOnChainResponse;
    static deserializeBinaryFromReader(message: SendOnChainResponse, reader: jspb.BinaryReader): SendOnChainResponse;
}

export namespace SendOnChainResponse {
    export type AsObject = {
        txid: string,
    }
}

export class SignTransactionRequest extends jspb.Message { 
    getTx(): string;
    setTx(value: string): SignTransactionRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): SignTransactionRequest.AsObject;
    static toObject(includeInstance: boolean, msg: SignTransactionRequest): SignTransactionRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: SignTransactionRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): SignTransactionRequest;
    static deserializeBinaryFromReader(message: SignTransactionRequest, reader: jspb.BinaryReader): SignTransactionRequest;
}

export namespace SignTransactionRequest {
    export type AsObject = {
        tx: string,
    }
}

export class SignTransactionResponse extends jspb.Message { 
    getSignedTx(): string;
    setSignedTx(value: string): SignTransactionResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): SignTransactionResponse.AsObject;
    static toObject(includeInstance: boolean, msg: SignTransactionResponse): SignTransactionResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: SignTransactionResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): SignTransactionResponse;
    static deserializeBinaryFromReader(message: SignTransactionResponse, reader: jspb.BinaryReader): SignTransactionResponse;
}

export namespace SignTransactionResponse {
    export type AsObject = {
        signedTx: string,
    }
}

export class CreateVHTLCRequest extends jspb.Message { 
    getPreimageHash(): string;
    setPreimageHash(value: string): CreateVHTLCRequest;
    getSenderPubkey(): string;
    setSenderPubkey(value: string): CreateVHTLCRequest;
    getReceiverPubkey(): string;
    setReceiverPubkey(value: string): CreateVHTLCRequest;
    getRefundLocktime(): number;
    setRefundLocktime(value: number): CreateVHTLCRequest;

    hasUnilateralClaimDelay(): boolean;
    clearUnilateralClaimDelay(): void;
    getUnilateralClaimDelay(): RelativeLocktime | undefined;
    setUnilateralClaimDelay(value?: RelativeLocktime): CreateVHTLCRequest;

    hasUnilateralRefundDelay(): boolean;
    clearUnilateralRefundDelay(): void;
    getUnilateralRefundDelay(): RelativeLocktime | undefined;
    setUnilateralRefundDelay(value?: RelativeLocktime): CreateVHTLCRequest;

    hasUnilateralRefundWithoutReceiverDelay(): boolean;
    clearUnilateralRefundWithoutReceiverDelay(): void;
    getUnilateralRefundWithoutReceiverDelay(): RelativeLocktime | undefined;
    setUnilateralRefundWithoutReceiverDelay(value?: RelativeLocktime): CreateVHTLCRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): CreateVHTLCRequest.AsObject;
    static toObject(includeInstance: boolean, msg: CreateVHTLCRequest): CreateVHTLCRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: CreateVHTLCRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): CreateVHTLCRequest;
    static deserializeBinaryFromReader(message: CreateVHTLCRequest, reader: jspb.BinaryReader): CreateVHTLCRequest;
}

export namespace CreateVHTLCRequest {
    export type AsObject = {
        preimageHash: string,
        senderPubkey: string,
        receiverPubkey: string,
        refundLocktime: number,
        unilateralClaimDelay?: RelativeLocktime.AsObject,
        unilateralRefundDelay?: RelativeLocktime.AsObject,
        unilateralRefundWithoutReceiverDelay?: RelativeLocktime.AsObject,
    }
}

export class CreateVHTLCResponse extends jspb.Message { 
    getId(): string;
    setId(value: string): CreateVHTLCResponse;
    getAddress(): string;
    setAddress(value: string): CreateVHTLCResponse;
    getClaimPubkey(): string;
    setClaimPubkey(value: string): CreateVHTLCResponse;
    getRefundPubkey(): string;
    setRefundPubkey(value: string): CreateVHTLCResponse;
    getServerPubkey(): string;
    setServerPubkey(value: string): CreateVHTLCResponse;

    hasSwapTree(): boolean;
    clearSwapTree(): void;
    getSwapTree(): TaprootTree | undefined;
    setSwapTree(value?: TaprootTree): CreateVHTLCResponse;
    getRefundLocktime(): number;
    setRefundLocktime(value: number): CreateVHTLCResponse;
    getUnilateralClaimDelay(): number;
    setUnilateralClaimDelay(value: number): CreateVHTLCResponse;
    getUnilateralRefundDelay(): number;
    setUnilateralRefundDelay(value: number): CreateVHTLCResponse;
    getUnilateralRefundWithoutReceiverDelay(): number;
    setUnilateralRefundWithoutReceiverDelay(value: number): CreateVHTLCResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): CreateVHTLCResponse.AsObject;
    static toObject(includeInstance: boolean, msg: CreateVHTLCResponse): CreateVHTLCResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: CreateVHTLCResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): CreateVHTLCResponse;
    static deserializeBinaryFromReader(message: CreateVHTLCResponse, reader: jspb.BinaryReader): CreateVHTLCResponse;
}

export namespace CreateVHTLCResponse {
    export type AsObject = {
        id: string,
        address: string,
        claimPubkey: string,
        refundPubkey: string,
        serverPubkey: string,
        swapTree?: TaprootTree.AsObject,
        refundLocktime: number,
        unilateralClaimDelay: number,
        unilateralRefundDelay: number,
        unilateralRefundWithoutReceiverDelay: number,
    }
}

export class ClaimVHTLCRequest extends jspb.Message { 
    getVhtlcId(): string;
    setVhtlcId(value: string): ClaimVHTLCRequest;
    getPreimage(): string;
    setPreimage(value: string): ClaimVHTLCRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ClaimVHTLCRequest.AsObject;
    static toObject(includeInstance: boolean, msg: ClaimVHTLCRequest): ClaimVHTLCRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ClaimVHTLCRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ClaimVHTLCRequest;
    static deserializeBinaryFromReader(message: ClaimVHTLCRequest, reader: jspb.BinaryReader): ClaimVHTLCRequest;
}

export namespace ClaimVHTLCRequest {
    export type AsObject = {
        vhtlcId: string,
        preimage: string,
    }
}

export class ClaimVHTLCResponse extends jspb.Message { 
    getRedeemTxid(): string;
    setRedeemTxid(value: string): ClaimVHTLCResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ClaimVHTLCResponse.AsObject;
    static toObject(includeInstance: boolean, msg: ClaimVHTLCResponse): ClaimVHTLCResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ClaimVHTLCResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ClaimVHTLCResponse;
    static deserializeBinaryFromReader(message: ClaimVHTLCResponse, reader: jspb.BinaryReader): ClaimVHTLCResponse;
}

export namespace ClaimVHTLCResponse {
    export type AsObject = {
        redeemTxid: string,
    }
}

export class RefundVHTLCWithoutReceiverRequest extends jspb.Message { 
    getVhtlcId(): string;
    setVhtlcId(value: string): RefundVHTLCWithoutReceiverRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): RefundVHTLCWithoutReceiverRequest.AsObject;
    static toObject(includeInstance: boolean, msg: RefundVHTLCWithoutReceiverRequest): RefundVHTLCWithoutReceiverRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: RefundVHTLCWithoutReceiverRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): RefundVHTLCWithoutReceiverRequest;
    static deserializeBinaryFromReader(message: RefundVHTLCWithoutReceiverRequest, reader: jspb.BinaryReader): RefundVHTLCWithoutReceiverRequest;
}

export namespace RefundVHTLCWithoutReceiverRequest {
    export type AsObject = {
        vhtlcId: string,
    }
}

export class RefundVHTLCWithoutReceiverResponse extends jspb.Message { 
    getRedeemTxid(): string;
    setRedeemTxid(value: string): RefundVHTLCWithoutReceiverResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): RefundVHTLCWithoutReceiverResponse.AsObject;
    static toObject(includeInstance: boolean, msg: RefundVHTLCWithoutReceiverResponse): RefundVHTLCWithoutReceiverResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: RefundVHTLCWithoutReceiverResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): RefundVHTLCWithoutReceiverResponse;
    static deserializeBinaryFromReader(message: RefundVHTLCWithoutReceiverResponse, reader: jspb.BinaryReader): RefundVHTLCWithoutReceiverResponse;
}

export namespace RefundVHTLCWithoutReceiverResponse {
    export type AsObject = {
        redeemTxid: string,
    }
}

export class SettleVHTLCRequest extends jspb.Message { 
    getVhtlcId(): string;
    setVhtlcId(value: string): SettleVHTLCRequest;

    hasClaim(): boolean;
    clearClaim(): void;
    getClaim(): ClaimPath | undefined;
    setClaim(value?: ClaimPath): SettleVHTLCRequest;

    hasRefund(): boolean;
    clearRefund(): void;
    getRefund(): RefundPath | undefined;
    setRefund(value?: RefundPath): SettleVHTLCRequest;

    getSettlementTypeCase(): SettleVHTLCRequest.SettlementTypeCase;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): SettleVHTLCRequest.AsObject;
    static toObject(includeInstance: boolean, msg: SettleVHTLCRequest): SettleVHTLCRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: SettleVHTLCRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): SettleVHTLCRequest;
    static deserializeBinaryFromReader(message: SettleVHTLCRequest, reader: jspb.BinaryReader): SettleVHTLCRequest;
}

export namespace SettleVHTLCRequest {
    export type AsObject = {
        vhtlcId: string,
        claim?: ClaimPath.AsObject,
        refund?: RefundPath.AsObject,
    }

    export enum SettlementTypeCase {
        SETTLEMENT_TYPE_NOT_SET = 0,
        CLAIM = 2,
        REFUND = 3,
    }

}

export class ClaimPath extends jspb.Message { 
    getPreimage(): string;
    setPreimage(value: string): ClaimPath;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ClaimPath.AsObject;
    static toObject(includeInstance: boolean, msg: ClaimPath): ClaimPath.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ClaimPath, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ClaimPath;
    static deserializeBinaryFromReader(message: ClaimPath, reader: jspb.BinaryReader): ClaimPath;
}

export namespace ClaimPath {
    export type AsObject = {
        preimage: string,
    }
}

export class RefundPath extends jspb.Message { 

    hasDelegateParams(): boolean;
    clearDelegateParams(): void;
    getDelegateParams(): DelegateRefundParams | undefined;
    setDelegateParams(value?: DelegateRefundParams): RefundPath;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): RefundPath.AsObject;
    static toObject(includeInstance: boolean, msg: RefundPath): RefundPath.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: RefundPath, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): RefundPath;
    static deserializeBinaryFromReader(message: RefundPath, reader: jspb.BinaryReader): RefundPath;
}

export namespace RefundPath {
    export type AsObject = {
        delegateParams?: DelegateRefundParams.AsObject,
    }
}

export class DelegateRefundParams extends jspb.Message { 
    getSignedIntentProof(): string;
    setSignedIntentProof(value: string): DelegateRefundParams;
    getIntentMessage(): string;
    setIntentMessage(value: string): DelegateRefundParams;
    getPartialForfeitTx(): string;
    setPartialForfeitTx(value: string): DelegateRefundParams;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): DelegateRefundParams.AsObject;
    static toObject(includeInstance: boolean, msg: DelegateRefundParams): DelegateRefundParams.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: DelegateRefundParams, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): DelegateRefundParams;
    static deserializeBinaryFromReader(message: DelegateRefundParams, reader: jspb.BinaryReader): DelegateRefundParams;
}

export namespace DelegateRefundParams {
    export type AsObject = {
        signedIntentProof: string,
        intentMessage: string,
        partialForfeitTx: string,
    }
}

export class SettleVHTLCResponse extends jspb.Message { 
    getTxid(): string;
    setTxid(value: string): SettleVHTLCResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): SettleVHTLCResponse.AsObject;
    static toObject(includeInstance: boolean, msg: SettleVHTLCResponse): SettleVHTLCResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: SettleVHTLCResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): SettleVHTLCResponse;
    static deserializeBinaryFromReader(message: SettleVHTLCResponse, reader: jspb.BinaryReader): SettleVHTLCResponse;
}

export namespace SettleVHTLCResponse {
    export type AsObject = {
        txid: string,
    }
}

export class ListVHTLCRequest extends jspb.Message { 
    getVhtlcId(): string;
    setVhtlcId(value: string): ListVHTLCRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ListVHTLCRequest.AsObject;
    static toObject(includeInstance: boolean, msg: ListVHTLCRequest): ListVHTLCRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ListVHTLCRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ListVHTLCRequest;
    static deserializeBinaryFromReader(message: ListVHTLCRequest, reader: jspb.BinaryReader): ListVHTLCRequest;
}

export namespace ListVHTLCRequest {
    export type AsObject = {
        vhtlcId: string,
    }
}

export class ListVHTLCResponse extends jspb.Message { 
    clearVhtlcsList(): void;
    getVhtlcsList(): Array<ark_types_pb.Vtxo>;
    setVhtlcsList(value: Array<ark_types_pb.Vtxo>): ListVHTLCResponse;
    addVhtlcs(value?: ark_types_pb.Vtxo, index?: number): ark_types_pb.Vtxo;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ListVHTLCResponse.AsObject;
    static toObject(includeInstance: boolean, msg: ListVHTLCResponse): ListVHTLCResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ListVHTLCResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ListVHTLCResponse;
    static deserializeBinaryFromReader(message: ListVHTLCResponse, reader: jspb.BinaryReader): ListVHTLCResponse;
}

export namespace ListVHTLCResponse {
    export type AsObject = {
        vhtlcsList: Array<ark_types_pb.Vtxo.AsObject>,
    }
}

export class GetInvoiceRequest extends jspb.Message { 
    getAmount(): number;
    setAmount(value: number): GetInvoiceRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): GetInvoiceRequest.AsObject;
    static toObject(includeInstance: boolean, msg: GetInvoiceRequest): GetInvoiceRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: GetInvoiceRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): GetInvoiceRequest;
    static deserializeBinaryFromReader(message: GetInvoiceRequest, reader: jspb.BinaryReader): GetInvoiceRequest;
}

export namespace GetInvoiceRequest {
    export type AsObject = {
        amount: number,
    }
}

export class GetInvoiceResponse extends jspb.Message { 
    getInvoice(): string;
    setInvoice(value: string): GetInvoiceResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): GetInvoiceResponse.AsObject;
    static toObject(includeInstance: boolean, msg: GetInvoiceResponse): GetInvoiceResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: GetInvoiceResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): GetInvoiceResponse;
    static deserializeBinaryFromReader(message: GetInvoiceResponse, reader: jspb.BinaryReader): GetInvoiceResponse;
}

export namespace GetInvoiceResponse {
    export type AsObject = {
        invoice: string,
    }
}

export class PayInvoiceRequest extends jspb.Message { 
    getInvoice(): string;
    setInvoice(value: string): PayInvoiceRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): PayInvoiceRequest.AsObject;
    static toObject(includeInstance: boolean, msg: PayInvoiceRequest): PayInvoiceRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: PayInvoiceRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): PayInvoiceRequest;
    static deserializeBinaryFromReader(message: PayInvoiceRequest, reader: jspb.BinaryReader): PayInvoiceRequest;
}

export namespace PayInvoiceRequest {
    export type AsObject = {
        invoice: string,
    }
}

export class PayInvoiceResponse extends jspb.Message { 
    getTxid(): string;
    setTxid(value: string): PayInvoiceResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): PayInvoiceResponse.AsObject;
    static toObject(includeInstance: boolean, msg: PayInvoiceResponse): PayInvoiceResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: PayInvoiceResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): PayInvoiceResponse;
    static deserializeBinaryFromReader(message: PayInvoiceResponse, reader: jspb.BinaryReader): PayInvoiceResponse;
}

export namespace PayInvoiceResponse {
    export type AsObject = {
        txid: string,
    }
}

export class TaprootTree extends jspb.Message { 

    hasClaimLeaf(): boolean;
    clearClaimLeaf(): void;
    getClaimLeaf(): TaprootLeaf | undefined;
    setClaimLeaf(value?: TaprootLeaf): TaprootTree;

    hasRefundLeaf(): boolean;
    clearRefundLeaf(): void;
    getRefundLeaf(): TaprootLeaf | undefined;
    setRefundLeaf(value?: TaprootLeaf): TaprootTree;

    hasRefundWithoutBoltzLeaf(): boolean;
    clearRefundWithoutBoltzLeaf(): void;
    getRefundWithoutBoltzLeaf(): TaprootLeaf | undefined;
    setRefundWithoutBoltzLeaf(value?: TaprootLeaf): TaprootTree;

    hasUnilateralClaimLeaf(): boolean;
    clearUnilateralClaimLeaf(): void;
    getUnilateralClaimLeaf(): TaprootLeaf | undefined;
    setUnilateralClaimLeaf(value?: TaprootLeaf): TaprootTree;

    hasUnilateralRefundLeaf(): boolean;
    clearUnilateralRefundLeaf(): void;
    getUnilateralRefundLeaf(): TaprootLeaf | undefined;
    setUnilateralRefundLeaf(value?: TaprootLeaf): TaprootTree;

    hasUnilateralRefundWithoutBoltzLeaf(): boolean;
    clearUnilateralRefundWithoutBoltzLeaf(): void;
    getUnilateralRefundWithoutBoltzLeaf(): TaprootLeaf | undefined;
    setUnilateralRefundWithoutBoltzLeaf(value?: TaprootLeaf): TaprootTree;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): TaprootTree.AsObject;
    static toObject(includeInstance: boolean, msg: TaprootTree): TaprootTree.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: TaprootTree, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): TaprootTree;
    static deserializeBinaryFromReader(message: TaprootTree, reader: jspb.BinaryReader): TaprootTree;
}

export namespace TaprootTree {
    export type AsObject = {
        claimLeaf?: TaprootLeaf.AsObject,
        refundLeaf?: TaprootLeaf.AsObject,
        refundWithoutBoltzLeaf?: TaprootLeaf.AsObject,
        unilateralClaimLeaf?: TaprootLeaf.AsObject,
        unilateralRefundLeaf?: TaprootLeaf.AsObject,
        unilateralRefundWithoutBoltzLeaf?: TaprootLeaf.AsObject,
    }
}

export class TaprootLeaf extends jspb.Message { 
    getVersion(): number;
    setVersion(value: number): TaprootLeaf;
    getOutput(): string;
    setOutput(value: string): TaprootLeaf;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): TaprootLeaf.AsObject;
    static toObject(includeInstance: boolean, msg: TaprootLeaf): TaprootLeaf.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: TaprootLeaf, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): TaprootLeaf;
    static deserializeBinaryFromReader(message: TaprootLeaf, reader: jspb.BinaryReader): TaprootLeaf;
}

export namespace TaprootLeaf {
    export type AsObject = {
        version: number,
        output: string,
    }
}

export class IsInvoiceSettledRequest extends jspb.Message { 
    getInvoice(): string;
    setInvoice(value: string): IsInvoiceSettledRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): IsInvoiceSettledRequest.AsObject;
    static toObject(includeInstance: boolean, msg: IsInvoiceSettledRequest): IsInvoiceSettledRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: IsInvoiceSettledRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): IsInvoiceSettledRequest;
    static deserializeBinaryFromReader(message: IsInvoiceSettledRequest, reader: jspb.BinaryReader): IsInvoiceSettledRequest;
}

export namespace IsInvoiceSettledRequest {
    export type AsObject = {
        invoice: string,
    }
}

export class IsInvoiceSettledResponse extends jspb.Message { 
    getSettled(): boolean;
    setSettled(value: boolean): IsInvoiceSettledResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): IsInvoiceSettledResponse.AsObject;
    static toObject(includeInstance: boolean, msg: IsInvoiceSettledResponse): IsInvoiceSettledResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: IsInvoiceSettledResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): IsInvoiceSettledResponse;
    static deserializeBinaryFromReader(message: IsInvoiceSettledResponse, reader: jspb.BinaryReader): IsInvoiceSettledResponse;
}

export namespace IsInvoiceSettledResponse {
    export type AsObject = {
        settled: boolean,
    }
}

export class RelativeLocktime extends jspb.Message { 
    getType(): RelativeLocktime.LocktimeType;
    setType(value: RelativeLocktime.LocktimeType): RelativeLocktime;
    getValue(): number;
    setValue(value: number): RelativeLocktime;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): RelativeLocktime.AsObject;
    static toObject(includeInstance: boolean, msg: RelativeLocktime): RelativeLocktime.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: RelativeLocktime, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): RelativeLocktime;
    static deserializeBinaryFromReader(message: RelativeLocktime, reader: jspb.BinaryReader): RelativeLocktime;
}

export namespace RelativeLocktime {
    export type AsObject = {
        type: RelativeLocktime.LocktimeType,
        value: number,
    }

    export enum LocktimeType {
    LOCKTIME_TYPE_UNSPECIFIED = 0,
    LOCKTIME_TYPE_BLOCK = 1,
    LOCKTIME_TYPE_SECOND = 2,
    }

}

export class Tapscripts extends jspb.Message { 
    clearScriptsList(): void;
    getScriptsList(): Array<string>;
    setScriptsList(value: Array<string>): Tapscripts;
    addScripts(value: string, index?: number): string;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): Tapscripts.AsObject;
    static toObject(includeInstance: boolean, msg: Tapscripts): Tapscripts.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: Tapscripts, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): Tapscripts;
    static deserializeBinaryFromReader(message: Tapscripts, reader: jspb.BinaryReader): Tapscripts;
}

export namespace Tapscripts {
    export type AsObject = {
        scriptsList: Array<string>,
    }
}

export class GetVirtualTxsRequest extends jspb.Message { 
    clearTxidsList(): void;
    getTxidsList(): Array<string>;
    setTxidsList(value: Array<string>): GetVirtualTxsRequest;
    addTxids(value: string, index?: number): string;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): GetVirtualTxsRequest.AsObject;
    static toObject(includeInstance: boolean, msg: GetVirtualTxsRequest): GetVirtualTxsRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: GetVirtualTxsRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): GetVirtualTxsRequest;
    static deserializeBinaryFromReader(message: GetVirtualTxsRequest, reader: jspb.BinaryReader): GetVirtualTxsRequest;
}

export namespace GetVirtualTxsRequest {
    export type AsObject = {
        txidsList: Array<string>,
    }
}

export class GetVirtualTxsResponse extends jspb.Message { 
    clearTxsList(): void;
    getTxsList(): Array<string>;
    setTxsList(value: Array<string>): GetVirtualTxsResponse;
    addTxs(value: string, index?: number): string;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): GetVirtualTxsResponse.AsObject;
    static toObject(includeInstance: boolean, msg: GetVirtualTxsResponse): GetVirtualTxsResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: GetVirtualTxsResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): GetVirtualTxsResponse;
    static deserializeBinaryFromReader(message: GetVirtualTxsResponse, reader: jspb.BinaryReader): GetVirtualTxsResponse;
}

export namespace GetVirtualTxsResponse {
    export type AsObject = {
        txsList: Array<string>,
    }
}

export class GetVtxosRequest extends jspb.Message { 

    hasSpendableOnly(): boolean;
    clearSpendableOnly(): void;
    getSpendableOnly(): boolean;
    setSpendableOnly(value: boolean): GetVtxosRequest;

    hasSpentOnly(): boolean;
    clearSpentOnly(): void;
    getSpentOnly(): boolean;
    setSpentOnly(value: boolean): GetVtxosRequest;

    hasRecoverableOnly(): boolean;
    clearRecoverableOnly(): void;
    getRecoverableOnly(): boolean;
    setRecoverableOnly(value: boolean): GetVtxosRequest;

    getFilterCase(): GetVtxosRequest.FilterCase;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): GetVtxosRequest.AsObject;
    static toObject(includeInstance: boolean, msg: GetVtxosRequest): GetVtxosRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: GetVtxosRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): GetVtxosRequest;
    static deserializeBinaryFromReader(message: GetVtxosRequest, reader: jspb.BinaryReader): GetVtxosRequest;
}

export namespace GetVtxosRequest {
    export type AsObject = {
        spendableOnly: boolean,
        spentOnly: boolean,
        recoverableOnly: boolean,
    }

    export enum FilterCase {
        FILTER_NOT_SET = 0,
        SPENDABLE_ONLY = 1,
        SPENT_ONLY = 2,
        RECOVERABLE_ONLY = 3,
    }

}

export class GetVtxosResponse extends jspb.Message { 
    clearVtxosList(): void;
    getVtxosList(): Array<ark_types_pb.Vtxo>;
    setVtxosList(value: Array<ark_types_pb.Vtxo>): GetVtxosResponse;
    addVtxos(value?: ark_types_pb.Vtxo, index?: number): ark_types_pb.Vtxo;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): GetVtxosResponse.AsObject;
    static toObject(includeInstance: boolean, msg: GetVtxosResponse): GetVtxosResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: GetVtxosResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): GetVtxosResponse;
    static deserializeBinaryFromReader(message: GetVtxosResponse, reader: jspb.BinaryReader): GetVtxosResponse;
}

export namespace GetVtxosResponse {
    export type AsObject = {
        vtxosList: Array<ark_types_pb.Vtxo.AsObject>,
    }
}

export class NextSettlementRequest extends jspb.Message { 

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): NextSettlementRequest.AsObject;
    static toObject(includeInstance: boolean, msg: NextSettlementRequest): NextSettlementRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: NextSettlementRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): NextSettlementRequest;
    static deserializeBinaryFromReader(message: NextSettlementRequest, reader: jspb.BinaryReader): NextSettlementRequest;
}

export namespace NextSettlementRequest {
    export type AsObject = {
    }
}

export class NextSettlementResponse extends jspb.Message { 
    getNextSettlementAt(): number;
    setNextSettlementAt(value: number): NextSettlementResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): NextSettlementResponse.AsObject;
    static toObject(includeInstance: boolean, msg: NextSettlementResponse): NextSettlementResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: NextSettlementResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): NextSettlementResponse;
    static deserializeBinaryFromReader(message: NextSettlementResponse, reader: jspb.BinaryReader): NextSettlementResponse;
}

export namespace NextSettlementResponse {
    export type AsObject = {
        nextSettlementAt: number,
    }
}

export class CreateChainSwapRequest extends jspb.Message { 
    getDirection(): SwapDirection;
    setDirection(value: SwapDirection): CreateChainSwapRequest;
    getAmount(): number;
    setAmount(value: number): CreateChainSwapRequest;
    getBtcAddress(): string;
    setBtcAddress(value: string): CreateChainSwapRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): CreateChainSwapRequest.AsObject;
    static toObject(includeInstance: boolean, msg: CreateChainSwapRequest): CreateChainSwapRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: CreateChainSwapRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): CreateChainSwapRequest;
    static deserializeBinaryFromReader(message: CreateChainSwapRequest, reader: jspb.BinaryReader): CreateChainSwapRequest;
}

export namespace CreateChainSwapRequest {
    export type AsObject = {
        direction: SwapDirection,
        amount: number,
        btcAddress: string,
    }
}

export class CreateChainSwapResponse extends jspb.Message { 
    getId(): string;
    setId(value: string): CreateChainSwapResponse;
    getStatus(): string;
    setStatus(value: string): CreateChainSwapResponse;
    getUserLockupTxid(): string;
    setUserLockupTxid(value: string): CreateChainSwapResponse;
    getLockupAddress(): string;
    setLockupAddress(value: string): CreateChainSwapResponse;
    getExpectedAmount(): number;
    setExpectedAmount(value: number): CreateChainSwapResponse;
    getTimeoutBlockHeight(): number;
    setTimeoutBlockHeight(value: number): CreateChainSwapResponse;
    getPreimage(): string;
    setPreimage(value: string): CreateChainSwapResponse;
    getError(): string;
    setError(value: string): CreateChainSwapResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): CreateChainSwapResponse.AsObject;
    static toObject(includeInstance: boolean, msg: CreateChainSwapResponse): CreateChainSwapResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: CreateChainSwapResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): CreateChainSwapResponse;
    static deserializeBinaryFromReader(message: CreateChainSwapResponse, reader: jspb.BinaryReader): CreateChainSwapResponse;
}

export namespace CreateChainSwapResponse {
    export type AsObject = {
        id: string,
        status: string,
        userLockupTxid: string,
        lockupAddress: string,
        expectedAmount: number,
        timeoutBlockHeight: number,
        preimage: string,
        error: string,
    }
}

export class ChainSwapResponse extends jspb.Message { 
    getId(): string;
    setId(value: string): ChainSwapResponse;
    getFrom(): string;
    setFrom(value: string): ChainSwapResponse;
    getTo(): string;
    setTo(value: string): ChainSwapResponse;
    getAmount(): number;
    setAmount(value: number): ChainSwapResponse;
    getStatus(): string;
    setStatus(value: string): ChainSwapResponse;
    getPreimage(): string;
    setPreimage(value: string): ChainSwapResponse;
    getUserLockupTxid(): string;
    setUserLockupTxid(value: string): ChainSwapResponse;
    getServerLockupTxid(): string;
    setServerLockupTxid(value: string): ChainSwapResponse;
    getClaimTxid(): string;
    setClaimTxid(value: string): ChainSwapResponse;
    getRefundTxid(): string;
    setRefundTxid(value: string): ChainSwapResponse;
    getBtcAddress(): string;
    setBtcAddress(value: string): ChainSwapResponse;
    getTimestamp(): number;
    setTimestamp(value: number): ChainSwapResponse;
    getErrorMessage(): string;
    setErrorMessage(value: string): ChainSwapResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ChainSwapResponse.AsObject;
    static toObject(includeInstance: boolean, msg: ChainSwapResponse): ChainSwapResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ChainSwapResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ChainSwapResponse;
    static deserializeBinaryFromReader(message: ChainSwapResponse, reader: jspb.BinaryReader): ChainSwapResponse;
}

export namespace ChainSwapResponse {
    export type AsObject = {
        id: string,
        from: string,
        to: string,
        amount: number,
        status: string,
        preimage: string,
        userLockupTxid: string,
        serverLockupTxid: string,
        claimTxid: string,
        refundTxid: string,
        btcAddress: string,
        timestamp: number,
        errorMessage: string,
    }
}

export class ListChainSwapsRequest extends jspb.Message { 
    clearSwapIdsList(): void;
    getSwapIdsList(): Array<string>;
    setSwapIdsList(value: Array<string>): ListChainSwapsRequest;
    addSwapIds(value: string, index?: number): string;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ListChainSwapsRequest.AsObject;
    static toObject(includeInstance: boolean, msg: ListChainSwapsRequest): ListChainSwapsRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ListChainSwapsRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ListChainSwapsRequest;
    static deserializeBinaryFromReader(message: ListChainSwapsRequest, reader: jspb.BinaryReader): ListChainSwapsRequest;
}

export namespace ListChainSwapsRequest {
    export type AsObject = {
        swapIdsList: Array<string>,
    }
}

export class ListChainSwapsResponse extends jspb.Message { 
    clearSwapsList(): void;
    getSwapsList(): Array<ChainSwapResponse>;
    setSwapsList(value: Array<ChainSwapResponse>): ListChainSwapsResponse;
    addSwaps(value?: ChainSwapResponse, index?: number): ChainSwapResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ListChainSwapsResponse.AsObject;
    static toObject(includeInstance: boolean, msg: ListChainSwapsResponse): ListChainSwapsResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ListChainSwapsResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ListChainSwapsResponse;
    static deserializeBinaryFromReader(message: ListChainSwapsResponse, reader: jspb.BinaryReader): ListChainSwapsResponse;
}

export namespace ListChainSwapsResponse {
    export type AsObject = {
        swapsList: Array<ChainSwapResponse.AsObject>,
    }
}

export class RefundChainSwapRequest extends jspb.Message { 
    getId(): string;
    setId(value: string): RefundChainSwapRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): RefundChainSwapRequest.AsObject;
    static toObject(includeInstance: boolean, msg: RefundChainSwapRequest): RefundChainSwapRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: RefundChainSwapRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): RefundChainSwapRequest;
    static deserializeBinaryFromReader(message: RefundChainSwapRequest, reader: jspb.BinaryReader): RefundChainSwapRequest;
}

export namespace RefundChainSwapRequest {
    export type AsObject = {
        id: string,
    }
}

export class RefundChainSwapResponse extends jspb.Message { 
    getMessage(): string;
    setMessage(value: string): RefundChainSwapResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): RefundChainSwapResponse.AsObject;
    static toObject(includeInstance: boolean, msg: RefundChainSwapResponse): RefundChainSwapResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: RefundChainSwapResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): RefundChainSwapResponse;
    static deserializeBinaryFromReader(message: RefundChainSwapResponse, reader: jspb.BinaryReader): RefundChainSwapResponse;
}

export namespace RefundChainSwapResponse {
    export type AsObject = {
        message: string,
    }
}

export class DelegateIntent extends jspb.Message { 
    getTxid(): string;
    setTxid(value: string): DelegateIntent;
    getMessage(): string;
    setMessage(value: string): DelegateIntent;
    getProof(): string;
    setProof(value: string): DelegateIntent;
    clearInputsList(): void;
    getInputsList(): Array<ark_types_pb.Input>;
    setInputsList(value: Array<ark_types_pb.Input>): DelegateIntent;
    addInputs(value?: ark_types_pb.Input, index?: number): ark_types_pb.Input;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): DelegateIntent.AsObject;
    static toObject(includeInstance: boolean, msg: DelegateIntent): DelegateIntent.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: DelegateIntent, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): DelegateIntent;
    static deserializeBinaryFromReader(message: DelegateIntent, reader: jspb.BinaryReader): DelegateIntent;
}

export namespace DelegateIntent {
    export type AsObject = {
        txid: string,
        message: string,
        proof: string,
        inputsList: Array<ark_types_pb.Input.AsObject>,
    }
}

export class DelegateForfeitTx extends jspb.Message { 

    hasInput(): boolean;
    clearInput(): void;
    getInput(): ark_types_pb.Input | undefined;
    setInput(value?: ark_types_pb.Input): DelegateForfeitTx;
    getForfeitTx(): string;
    setForfeitTx(value: string): DelegateForfeitTx;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): DelegateForfeitTx.AsObject;
    static toObject(includeInstance: boolean, msg: DelegateForfeitTx): DelegateForfeitTx.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: DelegateForfeitTx, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): DelegateForfeitTx;
    static deserializeBinaryFromReader(message: DelegateForfeitTx, reader: jspb.BinaryReader): DelegateForfeitTx;
}

export namespace DelegateForfeitTx {
    export type AsObject = {
        input?: ark_types_pb.Input.AsObject,
        forfeitTx: string,
    }
}

export class Delegate extends jspb.Message { 
    getId(): string;
    setId(value: string): Delegate;

    hasIntent(): boolean;
    clearIntent(): void;
    getIntent(): DelegateIntent | undefined;
    setIntent(value?: DelegateIntent): Delegate;
    clearForfeitTxsList(): void;
    getForfeitTxsList(): Array<DelegateForfeitTx>;
    setForfeitTxsList(value: Array<DelegateForfeitTx>): Delegate;
    addForfeitTxs(value?: DelegateForfeitTx, index?: number): DelegateForfeitTx;
    getFee(): number;
    setFee(value: number): Delegate;
    getDelegatorPublicKey(): string;
    setDelegatorPublicKey(value: string): Delegate;
    getScheduledAt(): number;
    setScheduledAt(value: number): Delegate;
    getStatus(): string;
    setStatus(value: string): Delegate;
    getFailReason(): string;
    setFailReason(value: string): Delegate;
    getCommitmentTxid(): string;
    setCommitmentTxid(value: string): Delegate;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): Delegate.AsObject;
    static toObject(includeInstance: boolean, msg: Delegate): Delegate.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: Delegate, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): Delegate;
    static deserializeBinaryFromReader(message: Delegate, reader: jspb.BinaryReader): Delegate;
}

export namespace Delegate {
    export type AsObject = {
        id: string,
        intent?: DelegateIntent.AsObject,
        forfeitTxsList: Array<DelegateForfeitTx.AsObject>,
        fee: number,
        delegatorPublicKey: string,
        scheduledAt: number,
        status: string,
        failReason: string,
        commitmentTxid: string,
    }
}

export class ListDelegatesRequest extends jspb.Message { 
    getStatus(): string;
    setStatus(value: string): ListDelegatesRequest;
    getLimit(): number;
    setLimit(value: number): ListDelegatesRequest;
    getOffset(): number;
    setOffset(value: number): ListDelegatesRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ListDelegatesRequest.AsObject;
    static toObject(includeInstance: boolean, msg: ListDelegatesRequest): ListDelegatesRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ListDelegatesRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ListDelegatesRequest;
    static deserializeBinaryFromReader(message: ListDelegatesRequest, reader: jspb.BinaryReader): ListDelegatesRequest;
}

export namespace ListDelegatesRequest {
    export type AsObject = {
        status: string,
        limit: number,
        offset: number,
    }
}

export class ListDelegatesResponse extends jspb.Message { 
    clearDelegatesList(): void;
    getDelegatesList(): Array<Delegate>;
    setDelegatesList(value: Array<Delegate>): ListDelegatesResponse;
    addDelegates(value?: Delegate, index?: number): Delegate;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ListDelegatesResponse.AsObject;
    static toObject(includeInstance: boolean, msg: ListDelegatesResponse): ListDelegatesResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ListDelegatesResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ListDelegatesResponse;
    static deserializeBinaryFromReader(message: ListDelegatesResponse, reader: jspb.BinaryReader): ListDelegatesResponse;
}

export namespace ListDelegatesResponse {
    export type AsObject = {
        delegatesList: Array<Delegate.AsObject>,
    }
}

export enum SwapDirection {
    SWAP_DIRECTION_UNSPECIFIED = 0,
    SWAP_DIRECTION_ARK_TO_BTC = 1,
    SWAP_DIRECTION_BTC_TO_ARK = 2,
}
