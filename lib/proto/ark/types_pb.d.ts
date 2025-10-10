// package: fulmine.v1
// file: ark/types.proto

/* tslint:disable */
/* eslint-disable */

import * as jspb from "google-protobuf";

export class AccountInfo extends jspb.Message { 
    getNamespace(): string;
    setNamespace(value: string): AccountInfo;
    getLabel(): string;
    setLabel(value: string): AccountInfo;
    getDerivationPath(): string;
    setDerivationPath(value: string): AccountInfo;
    getXpubs(): string;
    setXpubs(value: string): AccountInfo;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): AccountInfo.AsObject;
    static toObject(includeInstance: boolean, msg: AccountInfo): AccountInfo.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: AccountInfo, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): AccountInfo;
    static deserializeBinaryFromReader(message: AccountInfo, reader: jspb.BinaryReader): AccountInfo;
}

export namespace AccountInfo {
    export type AsObject = {
        namespace: string,
        label: string,
        derivationPath: string,
        xpubs: string,
    }
}

export class BlockDetails extends jspb.Message { 
    getHash(): string;
    setHash(value: string): BlockDetails;
    getHeight(): number;
    setHeight(value: number): BlockDetails;
    getTimestamp(): number;
    setTimestamp(value: number): BlockDetails;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): BlockDetails.AsObject;
    static toObject(includeInstance: boolean, msg: BlockDetails): BlockDetails.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: BlockDetails, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): BlockDetails;
    static deserializeBinaryFromReader(message: BlockDetails, reader: jspb.BinaryReader): BlockDetails;
}

export namespace BlockDetails {
    export type AsObject = {
        hash: string,
        height: number,
        timestamp: number,
    }
}

export class BuildInfo extends jspb.Message { 
    getVersion(): string;
    setVersion(value: string): BuildInfo;
    getCommit(): string;
    setCommit(value: string): BuildInfo;
    getDate(): string;
    setDate(value: string): BuildInfo;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): BuildInfo.AsObject;
    static toObject(includeInstance: boolean, msg: BuildInfo): BuildInfo.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: BuildInfo, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): BuildInfo;
    static deserializeBinaryFromReader(message: BuildInfo, reader: jspb.BinaryReader): BuildInfo;
}

export namespace BuildInfo {
    export type AsObject = {
        version: string,
        commit: string,
        date: string,
    }
}

export class Fees extends jspb.Message { 
    getBoltz(): number;
    setBoltz(value: number): Fees;
    getNetwork(): number;
    setNetwork(value: number): Fees;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): Fees.AsObject;
    static toObject(includeInstance: boolean, msg: Fees): Fees.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: Fees, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): Fees;
    static deserializeBinaryFromReader(message: Fees, reader: jspb.BinaryReader): Fees;
}

export namespace Fees {
    export type AsObject = {
        boltz: number,
        network: number,
    }
}

export class Input extends jspb.Message { 
    getTxid(): string;
    setTxid(value: string): Input;
    getVout(): number;
    setVout(value: number): Input;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): Input.AsObject;
    static toObject(includeInstance: boolean, msg: Input): Input.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: Input, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): Input;
    static deserializeBinaryFromReader(message: Input, reader: jspb.BinaryReader): Input;
}

export namespace Input {
    export type AsObject = {
        txid: string,
        vout: number,
    }
}

export class Node extends jspb.Message { 
    getTxid(): string;
    setTxid(value: string): Node;
    getTx(): string;
    setTx(value: string): Node;
    getParentTxid(): string;
    setParentTxid(value: string): Node;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): Node.AsObject;
    static toObject(includeInstance: boolean, msg: Node): Node.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: Node, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): Node;
    static deserializeBinaryFromReader(message: Node, reader: jspb.BinaryReader): Node;
}

export namespace Node {
    export type AsObject = {
        txid: string,
        tx: string,
        parentTxid: string,
    }
}

export class Output extends jspb.Message { 
    getPubkey(): string;
    setPubkey(value: string): Output;
    getAmount(): number;
    setAmount(value: number): Output;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): Output.AsObject;
    static toObject(includeInstance: boolean, msg: Output): Output.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: Output, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): Output;
    static deserializeBinaryFromReader(message: Output, reader: jspb.BinaryReader): Output;
}

export namespace Output {
    export type AsObject = {
        pubkey: string,
        amount: number,
    }
}

export class Round extends jspb.Message { 
    getId(): string;
    setId(value: string): Round;
    getStart(): number;
    setStart(value: number): Round;
    getEnd(): number;
    setEnd(value: number): Round;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): Round.AsObject;
    static toObject(includeInstance: boolean, msg: Round): Round.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: Round, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): Round;
    static deserializeBinaryFromReader(message: Round, reader: jspb.BinaryReader): Round;
}

export namespace Round {
    export type AsObject = {
        id: string,
        start: number,
        end: number,
    }
}

export class TransactionInfo extends jspb.Message { 
    getDate(): string;
    setDate(value: string): TransactionInfo;
    getAmount(): number;
    setAmount(value: number): TransactionInfo;
    getCommitmentTxid(): string;
    setCommitmentTxid(value: string): TransactionInfo;
    getArkTxid(): string;
    setArkTxid(value: string): TransactionInfo;
    getBoardingTxid(): string;
    setBoardingTxid(value: string): TransactionInfo;
    getType(): TxType;
    setType(value: TxType): TransactionInfo;
    getSettled(): boolean;
    setSettled(value: boolean): TransactionInfo;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): TransactionInfo.AsObject;
    static toObject(includeInstance: boolean, msg: TransactionInfo): TransactionInfo.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: TransactionInfo, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): TransactionInfo;
    static deserializeBinaryFromReader(message: TransactionInfo, reader: jspb.BinaryReader): TransactionInfo;
}

export namespace TransactionInfo {
    export type AsObject = {
        date: string,
        amount: number,
        commitmentTxid: string,
        arkTxid: string,
        boardingTxid: string,
        type: TxType,
        settled: boolean,
    }
}

export class Tree extends jspb.Message { 
    clearLevelsList(): void;
    getLevelsList(): Array<TreeLevel>;
    setLevelsList(value: Array<TreeLevel>): Tree;
    addLevels(value?: TreeLevel, index?: number): TreeLevel;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): Tree.AsObject;
    static toObject(includeInstance: boolean, msg: Tree): Tree.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: Tree, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): Tree;
    static deserializeBinaryFromReader(message: Tree, reader: jspb.BinaryReader): Tree;
}

export namespace Tree {
    export type AsObject = {
        levelsList: Array<TreeLevel.AsObject>,
    }
}

export class TreeLevel extends jspb.Message { 
    clearNodesList(): void;
    getNodesList(): Array<Node>;
    setNodesList(value: Array<Node>): TreeLevel;
    addNodes(value?: Node, index?: number): Node;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): TreeLevel.AsObject;
    static toObject(includeInstance: boolean, msg: TreeLevel): TreeLevel.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: TreeLevel, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): TreeLevel;
    static deserializeBinaryFromReader(message: TreeLevel, reader: jspb.BinaryReader): TreeLevel;
}

export namespace TreeLevel {
    export type AsObject = {
        nodesList: Array<Node.AsObject>,
    }
}

export class Vtxo extends jspb.Message { 

    hasOutpoint(): boolean;
    clearOutpoint(): void;
    getOutpoint(): Input | undefined;
    setOutpoint(value?: Input): Vtxo;
    getCreatedAt(): number;
    setCreatedAt(value: number): Vtxo;
    getExpiresAt(): number;
    setExpiresAt(value: number): Vtxo;
    clearCommitmentTxidsList(): void;
    getCommitmentTxidsList(): Array<string>;
    setCommitmentTxidsList(value: Array<string>): Vtxo;
    addCommitmentTxids(value: string, index?: number): string;
    getIsPreconfirmed(): boolean;
    setIsPreconfirmed(value: boolean): Vtxo;
    getIsSwept(): boolean;
    setIsSwept(value: boolean): Vtxo;
    getIsUnrolled(): boolean;
    setIsUnrolled(value: boolean): Vtxo;
    getIsSpent(): boolean;
    setIsSpent(value: boolean): Vtxo;
    getSpentBy(): string;
    setSpentBy(value: string): Vtxo;
    getSettledBy(): string;
    setSettledBy(value: string): Vtxo;
    getArkTxid(): string;
    setArkTxid(value: string): Vtxo;
    getScript(): string;
    setScript(value: string): Vtxo;
    getAmount(): number;
    setAmount(value: number): Vtxo;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): Vtxo.AsObject;
    static toObject(includeInstance: boolean, msg: Vtxo): Vtxo.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: Vtxo, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): Vtxo;
    static deserializeBinaryFromReader(message: Vtxo, reader: jspb.BinaryReader): Vtxo;
}

export namespace Vtxo {
    export type AsObject = {
        outpoint?: Input.AsObject,
        createdAt: number,
        expiresAt: number,
        commitmentTxidsList: Array<string>,
        isPreconfirmed: boolean,
        isSwept: boolean,
        isUnrolled: boolean,
        isSpent: boolean,
        spentBy: string,
        settledBy: string,
        arkTxid: string,
        script: string,
        amount: number,
    }
}

export class TxData extends jspb.Message { 
    getTxid(): string;
    setTxid(value: string): TxData;
    getTx(): string;
    setTx(value: string): TxData;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): TxData.AsObject;
    static toObject(includeInstance: boolean, msg: TxData): TxData.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: TxData, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): TxData;
    static deserializeBinaryFromReader(message: TxData, reader: jspb.BinaryReader): TxData;
}

export namespace TxData {
    export type AsObject = {
        txid: string,
        tx: string,
    }
}

export class Notification extends jspb.Message { 
    clearAddressesList(): void;
    getAddressesList(): Array<string>;
    setAddressesList(value: Array<string>): Notification;
    addAddresses(value: string, index?: number): string;
    clearNewVtxosList(): void;
    getNewVtxosList(): Array<Vtxo>;
    setNewVtxosList(value: Array<Vtxo>): Notification;
    addNewVtxos(value?: Vtxo, index?: number): Vtxo;
    clearSpentVtxosList(): void;
    getSpentVtxosList(): Array<Vtxo>;
    setSpentVtxosList(value: Array<Vtxo>): Notification;
    addSpentVtxos(value?: Vtxo, index?: number): Vtxo;
    getTxid(): string;
    setTxid(value: string): Notification;
    getTx(): string;
    setTx(value: string): Notification;

    getCheckpointsMap(): jspb.Map<string, TxData>;
    clearCheckpointsMap(): void;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): Notification.AsObject;
    static toObject(includeInstance: boolean, msg: Notification): Notification.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: Notification, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): Notification;
    static deserializeBinaryFromReader(message: Notification, reader: jspb.BinaryReader): Notification;
}

export namespace Notification {
    export type AsObject = {
        addressesList: Array<string>,
        newVtxosList: Array<Vtxo.AsObject>,
        spentVtxosList: Array<Vtxo.AsObject>,
        txid: string,
        tx: string,

        checkpointsMap: Array<[string, TxData.AsObject]>,
    }
}

export enum RoundEventType {
    ROUND_EVENT_TYPE_UNSPECIFIED = 0,
    ROUND_EVENT_TYPE_BROADCASTED = 1,
    ROUND_EVENT_TYPE_UNCONFIRMED = 2,
    ROUND_EVENT_TYPE_CONFIRMED = 3,
}

export enum WebhookEventType {
    WEBHOOK_EVENT_TYPE_UNSPECIFIED = 0,
    WEBHOOK_EVENT_TYPE_ROUND = 1,
}

export enum TxType {
    TX_TYPE_UNSPECIFIED = 0,
    TX_TYPE_SENT = 1,
    TX_TYPE_RECEIVED = 2,
}
