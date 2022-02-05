// package: boltzrpc
// file: boltzrpc.proto

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

  getBlocks(): number;
  setBlocks(value: number): void;

  getScannedBlocks(): number;
  setScannedBlocks(value: number): void;

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
    blocks: number,
    scannedBlocks: number,
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
  getLocalBalance(): number;
  setLocalBalance(value: number): void;

  getRemoteBalance(): number;
  setRemoteBalance(value: number): void;

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
    localBalance: number,
    remoteBalance: number,
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

export class DeriveKeysRequest extends jspb.Message {
  getSymbol(): string;
  setSymbol(value: string): void;

  getIndex(): number;
  setIndex(value: number): void;

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
  setPublicKey(value: string): void;

  getPrivateKey(): string;
  setPrivateKey(value: string): void;

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

export class GetAddressRequest extends jspb.Message {
  getSymbol(): string;
  setSymbol(value: string): void;

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
  }
}

export class GetAddressResponse extends jspb.Message {
  getAddress(): string;
  setAddress(value: string): void;

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
  setSymbol(value: string): void;

  getAddress(): string;
  setAddress(value: string): void;

  getAmount(): number;
  setAmount(value: number): void;

  getFee(): number;
  setFee(value: number): void;

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
    fee: number,
    sendAll: boolean,
  }
}

export class SendCoinsResponse extends jspb.Message {
  getTransactionId(): string;
  setTransactionId(value: string): void;

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
    transactionId: string,
    vout: number,
  }
}

export class UpdateTimeoutBlockDeltaRequest extends jspb.Message {
  getPair(): string;
  setPair(value: string): void;

  getNewDelta(): number;
  setNewDelta(value: number): void;

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
    newDelta: number,
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
  setId(value: string): void;

  getFeeShare(): number;
  setFeeShare(value: number): void;

  getRoutingNode(): string;
  setRoutingNode(value: string): void;

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
  setApiKey(value: string): void;

  getApiSecret(): string;
  setApiSecret(value: string): void;

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

export interface OutputTypeMap {
  BECH32: 0;
  COMPATIBILITY: 1;
  LEGACY: 2;
}

export const OutputType: OutputTypeMap;

