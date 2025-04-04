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
    getPreimageHash(): string;
    setPreimageHash(value: string): RefundVHTLCWithoutReceiverRequest;

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
        preimageHash: string,
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

export class ListVHTLCRequest extends jspb.Message { 
    getPreimageHashFilter(): string;
    setPreimageHashFilter(value: string): ListVHTLCRequest;

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
        preimageHashFilter: string,
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

export class GetDelegatePublicKeyRequest extends jspb.Message { 

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): GetDelegatePublicKeyRequest.AsObject;
    static toObject(includeInstance: boolean, msg: GetDelegatePublicKeyRequest): GetDelegatePublicKeyRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: GetDelegatePublicKeyRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): GetDelegatePublicKeyRequest;
    static deserializeBinaryFromReader(message: GetDelegatePublicKeyRequest, reader: jspb.BinaryReader): GetDelegatePublicKeyRequest;
}

export namespace GetDelegatePublicKeyRequest {
    export type AsObject = {
    }
}

export class GetDelegatePublicKeyResponse extends jspb.Message { 
    getPublicKey(): string;
    setPublicKey(value: string): GetDelegatePublicKeyResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): GetDelegatePublicKeyResponse.AsObject;
    static toObject(includeInstance: boolean, msg: GetDelegatePublicKeyResponse): GetDelegatePublicKeyResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: GetDelegatePublicKeyResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): GetDelegatePublicKeyResponse;
    static deserializeBinaryFromReader(message: GetDelegatePublicKeyResponse, reader: jspb.BinaryReader): GetDelegatePublicKeyResponse;
}

export namespace GetDelegatePublicKeyResponse {
    export type AsObject = {
        publicKey: string,
    }
}

export class WatchAddressForRolloverRequest extends jspb.Message { 

    hasRolloverAddress(): boolean;
    clearRolloverAddress(): void;
    getRolloverAddress(): RolloverAddress | undefined;
    setRolloverAddress(value?: RolloverAddress): WatchAddressForRolloverRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): WatchAddressForRolloverRequest.AsObject;
    static toObject(includeInstance: boolean, msg: WatchAddressForRolloverRequest): WatchAddressForRolloverRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: WatchAddressForRolloverRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): WatchAddressForRolloverRequest;
    static deserializeBinaryFromReader(message: WatchAddressForRolloverRequest, reader: jspb.BinaryReader): WatchAddressForRolloverRequest;
}

export namespace WatchAddressForRolloverRequest {
    export type AsObject = {
        rolloverAddress?: RolloverAddress.AsObject,
    }
}

export class WatchAddressForRolloverResponse extends jspb.Message { 

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): WatchAddressForRolloverResponse.AsObject;
    static toObject(includeInstance: boolean, msg: WatchAddressForRolloverResponse): WatchAddressForRolloverResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: WatchAddressForRolloverResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): WatchAddressForRolloverResponse;
    static deserializeBinaryFromReader(message: WatchAddressForRolloverResponse, reader: jspb.BinaryReader): WatchAddressForRolloverResponse;
}

export namespace WatchAddressForRolloverResponse {
    export type AsObject = {
    }
}

export class UnwatchAddressRequest extends jspb.Message { 
    getAddress(): string;
    setAddress(value: string): UnwatchAddressRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): UnwatchAddressRequest.AsObject;
    static toObject(includeInstance: boolean, msg: UnwatchAddressRequest): UnwatchAddressRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: UnwatchAddressRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): UnwatchAddressRequest;
    static deserializeBinaryFromReader(message: UnwatchAddressRequest, reader: jspb.BinaryReader): UnwatchAddressRequest;
}

export namespace UnwatchAddressRequest {
    export type AsObject = {
        address: string,
    }
}

export class UnwatchAddressResponse extends jspb.Message { 

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): UnwatchAddressResponse.AsObject;
    static toObject(includeInstance: boolean, msg: UnwatchAddressResponse): UnwatchAddressResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: UnwatchAddressResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): UnwatchAddressResponse;
    static deserializeBinaryFromReader(message: UnwatchAddressResponse, reader: jspb.BinaryReader): UnwatchAddressResponse;
}

export namespace UnwatchAddressResponse {
    export type AsObject = {
    }
}

export class ListWatchedAddressesRequest extends jspb.Message { 

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ListWatchedAddressesRequest.AsObject;
    static toObject(includeInstance: boolean, msg: ListWatchedAddressesRequest): ListWatchedAddressesRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ListWatchedAddressesRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ListWatchedAddressesRequest;
    static deserializeBinaryFromReader(message: ListWatchedAddressesRequest, reader: jspb.BinaryReader): ListWatchedAddressesRequest;
}

export namespace ListWatchedAddressesRequest {
    export type AsObject = {
    }
}

export class ListWatchedAddressesResponse extends jspb.Message { 
    clearAddressesList(): void;
    getAddressesList(): Array<RolloverAddress>;
    setAddressesList(value: Array<RolloverAddress>): ListWatchedAddressesResponse;
    addAddresses(value?: RolloverAddress, index?: number): RolloverAddress;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ListWatchedAddressesResponse.AsObject;
    static toObject(includeInstance: boolean, msg: ListWatchedAddressesResponse): ListWatchedAddressesResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ListWatchedAddressesResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ListWatchedAddressesResponse;
    static deserializeBinaryFromReader(message: ListWatchedAddressesResponse, reader: jspb.BinaryReader): ListWatchedAddressesResponse;
}

export namespace ListWatchedAddressesResponse {
    export type AsObject = {
        addressesList: Array<RolloverAddress.AsObject>,
    }
}

export class RolloverAddress extends jspb.Message { 
    getAddress(): string;
    setAddress(value: string): RolloverAddress;

    hasTaprootTree(): boolean;
    clearTaprootTree(): void;
    getTaprootTree(): Tapscripts | undefined;
    setTaprootTree(value?: Tapscripts): RolloverAddress;
    getDestinationAddress(): string;
    setDestinationAddress(value: string): RolloverAddress;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): RolloverAddress.AsObject;
    static toObject(includeInstance: boolean, msg: RolloverAddress): RolloverAddress.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: RolloverAddress, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): RolloverAddress;
    static deserializeBinaryFromReader(message: RolloverAddress, reader: jspb.BinaryReader): RolloverAddress;
}

export namespace RolloverAddress {
    export type AsObject = {
        address: string,
        taprootTree?: Tapscripts.AsObject,
        destinationAddress: string,
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
