// package: boltzrpc
// file: boltzrpc.proto

/* tslint:disable */
/* eslint-disable */

import * as jspb from 'google-protobuf';

export class GetInfoRequest extends jspb.Message {
  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): GetInfoRequest.AsObject;
  static toObject(
    includeInstance: boolean,
    msg: GetInfoRequest,
  ): GetInfoRequest.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: GetInfoRequest,
    writer: jspb.BinaryWriter,
  ): void;
  static deserializeBinary(bytes: Uint8Array): GetInfoRequest;
  static deserializeBinaryFromReader(
    message: GetInfoRequest,
    reader: jspb.BinaryReader,
  ): GetInfoRequest;
}

export namespace GetInfoRequest {
  export type AsObject = {};
}

export class GetInfoResponse extends jspb.Message {
  getVersion(): string;
  setVersion(value: string): GetInfoResponse;

  getChainsMap(): jspb.Map<string, CurrencyInfo>;
  clearChainsMap(): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): GetInfoResponse.AsObject;
  static toObject(
    includeInstance: boolean,
    msg: GetInfoResponse,
  ): GetInfoResponse.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: GetInfoResponse,
    writer: jspb.BinaryWriter,
  ): void;
  static deserializeBinary(bytes: Uint8Array): GetInfoResponse;
  static deserializeBinaryFromReader(
    message: GetInfoResponse,
    reader: jspb.BinaryReader,
  ): GetInfoResponse;
}

export namespace GetInfoResponse {
  export type AsObject = {
    version: string;

    chainsMap: Array<[string, CurrencyInfo.AsObject]>;
  };
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
  static toObject(
    includeInstance: boolean,
    msg: CurrencyInfo,
  ): CurrencyInfo.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: CurrencyInfo,
    writer: jspb.BinaryWriter,
  ): void;
  static deserializeBinary(bytes: Uint8Array): CurrencyInfo;
  static deserializeBinaryFromReader(
    message: CurrencyInfo,
    reader: jspb.BinaryReader,
  ): CurrencyInfo;
}

export namespace CurrencyInfo {
  export type AsObject = {
    chain?: ChainInfo.AsObject;

    lightningMap: Array<[string, LightningInfo.AsObject]>;
  };
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
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: ChainInfo,
    writer: jspb.BinaryWriter,
  ): void;
  static deserializeBinary(bytes: Uint8Array): ChainInfo;
  static deserializeBinaryFromReader(
    message: ChainInfo,
    reader: jspb.BinaryReader,
  ): ChainInfo;
}

export namespace ChainInfo {
  export type AsObject = {
    version: number;
    blocks: number;
    scannedBlocks: number;
    connections: number;
    error: string;
  };
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
  static toObject(
    includeInstance: boolean,
    msg: LightningInfo,
  ): LightningInfo.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: LightningInfo,
    writer: jspb.BinaryWriter,
  ): void;
  static deserializeBinary(bytes: Uint8Array): LightningInfo;
  static deserializeBinaryFromReader(
    message: LightningInfo,
    reader: jspb.BinaryReader,
  ): LightningInfo;
}

export namespace LightningInfo {
  export type AsObject = {
    version: string;
    channels?: LightningInfo.Channels.AsObject;
    blockHeight: number;
    error: string;
  };

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
    static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
    static extensionsBinary: {
      [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
    };
    static serializeBinaryToWriter(
      message: Channels,
      writer: jspb.BinaryWriter,
    ): void;
    static deserializeBinary(bytes: Uint8Array): Channels;
    static deserializeBinaryFromReader(
      message: Channels,
      reader: jspb.BinaryReader,
    ): Channels;
  }

  export namespace Channels {
    export type AsObject = {
      active: number;
      inactive: number;
      pending: number;
    };
  }
}

export class GetBalanceRequest extends jspb.Message {
  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): GetBalanceRequest.AsObject;
  static toObject(
    includeInstance: boolean,
    msg: GetBalanceRequest,
  ): GetBalanceRequest.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: GetBalanceRequest,
    writer: jspb.BinaryWriter,
  ): void;
  static deserializeBinary(bytes: Uint8Array): GetBalanceRequest;
  static deserializeBinaryFromReader(
    message: GetBalanceRequest,
    reader: jspb.BinaryReader,
  ): GetBalanceRequest;
}

export namespace GetBalanceRequest {
  export type AsObject = {};
}

export class GetBalanceResponse extends jspb.Message {
  getBalancesMap(): jspb.Map<string, Balances>;
  clearBalancesMap(): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): GetBalanceResponse.AsObject;
  static toObject(
    includeInstance: boolean,
    msg: GetBalanceResponse,
  ): GetBalanceResponse.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: GetBalanceResponse,
    writer: jspb.BinaryWriter,
  ): void;
  static deserializeBinary(bytes: Uint8Array): GetBalanceResponse;
  static deserializeBinaryFromReader(
    message: GetBalanceResponse,
    reader: jspb.BinaryReader,
  ): GetBalanceResponse;
}

export namespace GetBalanceResponse {
  export type AsObject = {
    balancesMap: Array<[string, Balances.AsObject]>;
  };
}

export class Balances extends jspb.Message {
  getWalletsMap(): jspb.Map<string, Balances.WalletBalance>;
  clearWalletsMap(): void;

  getLightningMap(): jspb.Map<string, Balances.LightningBalance>;
  clearLightningMap(): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): Balances.AsObject;
  static toObject(includeInstance: boolean, msg: Balances): Balances.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: Balances,
    writer: jspb.BinaryWriter,
  ): void;
  static deserializeBinary(bytes: Uint8Array): Balances;
  static deserializeBinaryFromReader(
    message: Balances,
    reader: jspb.BinaryReader,
  ): Balances;
}

export namespace Balances {
  export type AsObject = {
    walletsMap: Array<[string, Balances.WalletBalance.AsObject]>;

    lightningMap: Array<[string, Balances.LightningBalance.AsObject]>;
  };

  export class WalletBalance extends jspb.Message {
    getConfirmed(): number;
    setConfirmed(value: number): WalletBalance;
    getUnconfirmed(): number;
    setUnconfirmed(value: number): WalletBalance;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): WalletBalance.AsObject;
    static toObject(
      includeInstance: boolean,
      msg: WalletBalance,
    ): WalletBalance.AsObject;
    static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
    static extensionsBinary: {
      [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
    };
    static serializeBinaryToWriter(
      message: WalletBalance,
      writer: jspb.BinaryWriter,
    ): void;
    static deserializeBinary(bytes: Uint8Array): WalletBalance;
    static deserializeBinaryFromReader(
      message: WalletBalance,
      reader: jspb.BinaryReader,
    ): WalletBalance;
  }

  export namespace WalletBalance {
    export type AsObject = {
      confirmed: number;
      unconfirmed: number;
    };
  }

  export class LightningBalance extends jspb.Message {
    getLocal(): number;
    setLocal(value: number): LightningBalance;
    getRemote(): number;
    setRemote(value: number): LightningBalance;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): LightningBalance.AsObject;
    static toObject(
      includeInstance: boolean,
      msg: LightningBalance,
    ): LightningBalance.AsObject;
    static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
    static extensionsBinary: {
      [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
    };
    static serializeBinaryToWriter(
      message: LightningBalance,
      writer: jspb.BinaryWriter,
    ): void;
    static deserializeBinary(bytes: Uint8Array): LightningBalance;
    static deserializeBinaryFromReader(
      message: LightningBalance,
      reader: jspb.BinaryReader,
    ): LightningBalance;
  }

  export namespace LightningBalance {
    export type AsObject = {
      local: number;
      remote: number;
    };
  }
}

export class DeriveKeysRequest extends jspb.Message {
  getSymbol(): string;
  setSymbol(value: string): DeriveKeysRequest;
  getIndex(): number;
  setIndex(value: number): DeriveKeysRequest;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): DeriveKeysRequest.AsObject;
  static toObject(
    includeInstance: boolean,
    msg: DeriveKeysRequest,
  ): DeriveKeysRequest.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: DeriveKeysRequest,
    writer: jspb.BinaryWriter,
  ): void;
  static deserializeBinary(bytes: Uint8Array): DeriveKeysRequest;
  static deserializeBinaryFromReader(
    message: DeriveKeysRequest,
    reader: jspb.BinaryReader,
  ): DeriveKeysRequest;
}

export namespace DeriveKeysRequest {
  export type AsObject = {
    symbol: string;
    index: number;
  };
}

export class DeriveKeysResponse extends jspb.Message {
  getPublicKey(): string;
  setPublicKey(value: string): DeriveKeysResponse;
  getPrivateKey(): string;
  setPrivateKey(value: string): DeriveKeysResponse;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): DeriveKeysResponse.AsObject;
  static toObject(
    includeInstance: boolean,
    msg: DeriveKeysResponse,
  ): DeriveKeysResponse.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: DeriveKeysResponse,
    writer: jspb.BinaryWriter,
  ): void;
  static deserializeBinary(bytes: Uint8Array): DeriveKeysResponse;
  static deserializeBinaryFromReader(
    message: DeriveKeysResponse,
    reader: jspb.BinaryReader,
  ): DeriveKeysResponse;
}

export namespace DeriveKeysResponse {
  export type AsObject = {
    publicKey: string;
    privateKey: string;
  };
}

export class DeriveBlindingKeyRequest extends jspb.Message {
  getAddress(): string;
  setAddress(value: string): DeriveBlindingKeyRequest;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): DeriveBlindingKeyRequest.AsObject;
  static toObject(
    includeInstance: boolean,
    msg: DeriveBlindingKeyRequest,
  ): DeriveBlindingKeyRequest.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: DeriveBlindingKeyRequest,
    writer: jspb.BinaryWriter,
  ): void;
  static deserializeBinary(bytes: Uint8Array): DeriveBlindingKeyRequest;
  static deserializeBinaryFromReader(
    message: DeriveBlindingKeyRequest,
    reader: jspb.BinaryReader,
  ): DeriveBlindingKeyRequest;
}

export namespace DeriveBlindingKeyRequest {
  export type AsObject = {
    address: string;
  };
}

export class DeriveBlindingKeyResponse extends jspb.Message {
  getPublicKey(): string;
  setPublicKey(value: string): DeriveBlindingKeyResponse;
  getPrivateKey(): string;
  setPrivateKey(value: string): DeriveBlindingKeyResponse;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): DeriveBlindingKeyResponse.AsObject;
  static toObject(
    includeInstance: boolean,
    msg: DeriveBlindingKeyResponse,
  ): DeriveBlindingKeyResponse.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: DeriveBlindingKeyResponse,
    writer: jspb.BinaryWriter,
  ): void;
  static deserializeBinary(bytes: Uint8Array): DeriveBlindingKeyResponse;
  static deserializeBinaryFromReader(
    message: DeriveBlindingKeyResponse,
    reader: jspb.BinaryReader,
  ): DeriveBlindingKeyResponse;
}

export namespace DeriveBlindingKeyResponse {
  export type AsObject = {
    publicKey: string;
    privateKey: string;
  };
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
  static toObject(
    includeInstance: boolean,
    msg: UnblindOutputsRequest,
  ): UnblindOutputsRequest.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: UnblindOutputsRequest,
    writer: jspb.BinaryWriter,
  ): void;
  static deserializeBinary(bytes: Uint8Array): UnblindOutputsRequest;
  static deserializeBinaryFromReader(
    message: UnblindOutputsRequest,
    reader: jspb.BinaryReader,
  ): UnblindOutputsRequest;
}

export namespace UnblindOutputsRequest {
  export type AsObject = {
    id: string;
    hex: string;
  };

  export enum TransactionCase {
    TRANSACTION_NOT_SET = 0,
    ID = 1,
    HEX = 2,
  }
}

export class UnblindOutputsResponse extends jspb.Message {
  clearOutputsList(): void;
  getOutputsList(): Array<UnblindOutputsResponse.UnblindedOutput>;
  setOutputsList(
    value: Array<UnblindOutputsResponse.UnblindedOutput>,
  ): UnblindOutputsResponse;
  addOutputs(
    value?: UnblindOutputsResponse.UnblindedOutput,
    index?: number,
  ): UnblindOutputsResponse.UnblindedOutput;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): UnblindOutputsResponse.AsObject;
  static toObject(
    includeInstance: boolean,
    msg: UnblindOutputsResponse,
  ): UnblindOutputsResponse.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: UnblindOutputsResponse,
    writer: jspb.BinaryWriter,
  ): void;
  static deserializeBinary(bytes: Uint8Array): UnblindOutputsResponse;
  static deserializeBinaryFromReader(
    message: UnblindOutputsResponse,
    reader: jspb.BinaryReader,
  ): UnblindOutputsResponse;
}

export namespace UnblindOutputsResponse {
  export type AsObject = {
    outputsList: Array<UnblindOutputsResponse.UnblindedOutput.AsObject>;
  };

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
    static toObject(
      includeInstance: boolean,
      msg: UnblindedOutput,
    ): UnblindedOutput.AsObject;
    static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
    static extensionsBinary: {
      [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
    };
    static serializeBinaryToWriter(
      message: UnblindedOutput,
      writer: jspb.BinaryWriter,
    ): void;
    static deserializeBinary(bytes: Uint8Array): UnblindedOutput;
    static deserializeBinaryFromReader(
      message: UnblindedOutput,
      reader: jspb.BinaryReader,
    ): UnblindedOutput;
  }

  export namespace UnblindedOutput {
    export type AsObject = {
      value: number;
      asset: Uint8Array | string;
      isLbtc: boolean;
      script: Uint8Array | string;
      nonce: Uint8Array | string;
      rangeProof: Uint8Array | string;
      surjectionProof: Uint8Array | string;
    };
  }
}

export class GetAddressRequest extends jspb.Message {
  getSymbol(): string;
  setSymbol(value: string): GetAddressRequest;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): GetAddressRequest.AsObject;
  static toObject(
    includeInstance: boolean,
    msg: GetAddressRequest,
  ): GetAddressRequest.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: GetAddressRequest,
    writer: jspb.BinaryWriter,
  ): void;
  static deserializeBinary(bytes: Uint8Array): GetAddressRequest;
  static deserializeBinaryFromReader(
    message: GetAddressRequest,
    reader: jspb.BinaryReader,
  ): GetAddressRequest;
}

export namespace GetAddressRequest {
  export type AsObject = {
    symbol: string;
  };
}

export class GetAddressResponse extends jspb.Message {
  getAddress(): string;
  setAddress(value: string): GetAddressResponse;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): GetAddressResponse.AsObject;
  static toObject(
    includeInstance: boolean,
    msg: GetAddressResponse,
  ): GetAddressResponse.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: GetAddressResponse,
    writer: jspb.BinaryWriter,
  ): void;
  static deserializeBinary(bytes: Uint8Array): GetAddressResponse;
  static deserializeBinaryFromReader(
    message: GetAddressResponse,
    reader: jspb.BinaryReader,
  ): GetAddressResponse;
}

export namespace GetAddressResponse {
  export type AsObject = {
    address: string;
  };
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

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): SendCoinsRequest.AsObject;
  static toObject(
    includeInstance: boolean,
    msg: SendCoinsRequest,
  ): SendCoinsRequest.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: SendCoinsRequest,
    writer: jspb.BinaryWriter,
  ): void;
  static deserializeBinary(bytes: Uint8Array): SendCoinsRequest;
  static deserializeBinaryFromReader(
    message: SendCoinsRequest,
    reader: jspb.BinaryReader,
  ): SendCoinsRequest;
}

export namespace SendCoinsRequest {
  export type AsObject = {
    symbol: string;
    address: string;
    amount: number;
    fee: number;
    sendAll: boolean;
  };
}

export class SendCoinsResponse extends jspb.Message {
  getTransactionId(): string;
  setTransactionId(value: string): SendCoinsResponse;
  getVout(): number;
  setVout(value: number): SendCoinsResponse;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): SendCoinsResponse.AsObject;
  static toObject(
    includeInstance: boolean,
    msg: SendCoinsResponse,
  ): SendCoinsResponse.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: SendCoinsResponse,
    writer: jspb.BinaryWriter,
  ): void;
  static deserializeBinary(bytes: Uint8Array): SendCoinsResponse;
  static deserializeBinaryFromReader(
    message: SendCoinsResponse,
    reader: jspb.BinaryReader,
  ): SendCoinsResponse;
}

export namespace SendCoinsResponse {
  export type AsObject = {
    transactionId: string;
    vout: number;
  };
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

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): UpdateTimeoutBlockDeltaRequest.AsObject;
  static toObject(
    includeInstance: boolean,
    msg: UpdateTimeoutBlockDeltaRequest,
  ): UpdateTimeoutBlockDeltaRequest.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: UpdateTimeoutBlockDeltaRequest,
    writer: jspb.BinaryWriter,
  ): void;
  static deserializeBinary(bytes: Uint8Array): UpdateTimeoutBlockDeltaRequest;
  static deserializeBinaryFromReader(
    message: UpdateTimeoutBlockDeltaRequest,
    reader: jspb.BinaryReader,
  ): UpdateTimeoutBlockDeltaRequest;
}

export namespace UpdateTimeoutBlockDeltaRequest {
  export type AsObject = {
    pair: string;
    reverseTimeout: number;
    swapMinimalTimeout: number;
    swapMaximalTimeout: number;
  };
}

export class UpdateTimeoutBlockDeltaResponse extends jspb.Message {
  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): UpdateTimeoutBlockDeltaResponse.AsObject;
  static toObject(
    includeInstance: boolean,
    msg: UpdateTimeoutBlockDeltaResponse,
  ): UpdateTimeoutBlockDeltaResponse.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: UpdateTimeoutBlockDeltaResponse,
    writer: jspb.BinaryWriter,
  ): void;
  static deserializeBinary(bytes: Uint8Array): UpdateTimeoutBlockDeltaResponse;
  static deserializeBinaryFromReader(
    message: UpdateTimeoutBlockDeltaResponse,
    reader: jspb.BinaryReader,
  ): UpdateTimeoutBlockDeltaResponse;
}

export namespace UpdateTimeoutBlockDeltaResponse {
  export type AsObject = {};
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
  static toObject(
    includeInstance: boolean,
    msg: AddReferralRequest,
  ): AddReferralRequest.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: AddReferralRequest,
    writer: jspb.BinaryWriter,
  ): void;
  static deserializeBinary(bytes: Uint8Array): AddReferralRequest;
  static deserializeBinaryFromReader(
    message: AddReferralRequest,
    reader: jspb.BinaryReader,
  ): AddReferralRequest;
}

export namespace AddReferralRequest {
  export type AsObject = {
    id: string;
    feeShare: number;
    routingNode: string;
  };
}

export class AddReferralResponse extends jspb.Message {
  getApiKey(): string;
  setApiKey(value: string): AddReferralResponse;
  getApiSecret(): string;
  setApiSecret(value: string): AddReferralResponse;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): AddReferralResponse.AsObject;
  static toObject(
    includeInstance: boolean,
    msg: AddReferralResponse,
  ): AddReferralResponse.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: AddReferralResponse,
    writer: jspb.BinaryWriter,
  ): void;
  static deserializeBinary(bytes: Uint8Array): AddReferralResponse;
  static deserializeBinaryFromReader(
    message: AddReferralResponse,
    reader: jspb.BinaryReader,
  ): AddReferralResponse;
}

export namespace AddReferralResponse {
  export type AsObject = {
    apiKey: string;
    apiSecret: string;
  };
}

export enum OutputType {
  BECH32 = 0,
  COMPATIBILITY = 1,
  LEGACY = 2,
}
