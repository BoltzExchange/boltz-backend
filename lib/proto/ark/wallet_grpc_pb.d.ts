// package: fulmine.v1
// file: ark/wallet.proto

/* tslint:disable */
/* eslint-disable */

import * as grpc from "@grpc/grpc-js";
import * as ark_wallet_pb from "../ark/wallet_pb";

interface IWalletServiceService extends grpc.ServiceDefinition<grpc.UntypedServiceImplementation> {
    genSeed: IWalletServiceService_IGenSeed;
    createWallet: IWalletServiceService_ICreateWallet;
    unlock: IWalletServiceService_IUnlock;
    lock: IWalletServiceService_ILock;
    changePassword: IWalletServiceService_IChangePassword;
    restoreWallet: IWalletServiceService_IRestoreWallet;
    status: IWalletServiceService_IStatus;
    auth: IWalletServiceService_IAuth;
}

interface IWalletServiceService_IGenSeed extends grpc.MethodDefinition<ark_wallet_pb.GenSeedRequest, ark_wallet_pb.GenSeedResponse> {
    path: "/fulmine.v1.WalletService/GenSeed";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<ark_wallet_pb.GenSeedRequest>;
    requestDeserialize: grpc.deserialize<ark_wallet_pb.GenSeedRequest>;
    responseSerialize: grpc.serialize<ark_wallet_pb.GenSeedResponse>;
    responseDeserialize: grpc.deserialize<ark_wallet_pb.GenSeedResponse>;
}
interface IWalletServiceService_ICreateWallet extends grpc.MethodDefinition<ark_wallet_pb.CreateWalletRequest, ark_wallet_pb.CreateWalletResponse> {
    path: "/fulmine.v1.WalletService/CreateWallet";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<ark_wallet_pb.CreateWalletRequest>;
    requestDeserialize: grpc.deserialize<ark_wallet_pb.CreateWalletRequest>;
    responseSerialize: grpc.serialize<ark_wallet_pb.CreateWalletResponse>;
    responseDeserialize: grpc.deserialize<ark_wallet_pb.CreateWalletResponse>;
}
interface IWalletServiceService_IUnlock extends grpc.MethodDefinition<ark_wallet_pb.UnlockRequest, ark_wallet_pb.UnlockResponse> {
    path: "/fulmine.v1.WalletService/Unlock";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<ark_wallet_pb.UnlockRequest>;
    requestDeserialize: grpc.deserialize<ark_wallet_pb.UnlockRequest>;
    responseSerialize: grpc.serialize<ark_wallet_pb.UnlockResponse>;
    responseDeserialize: grpc.deserialize<ark_wallet_pb.UnlockResponse>;
}
interface IWalletServiceService_ILock extends grpc.MethodDefinition<ark_wallet_pb.LockRequest, ark_wallet_pb.LockResponse> {
    path: "/fulmine.v1.WalletService/Lock";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<ark_wallet_pb.LockRequest>;
    requestDeserialize: grpc.deserialize<ark_wallet_pb.LockRequest>;
    responseSerialize: grpc.serialize<ark_wallet_pb.LockResponse>;
    responseDeserialize: grpc.deserialize<ark_wallet_pb.LockResponse>;
}
interface IWalletServiceService_IChangePassword extends grpc.MethodDefinition<ark_wallet_pb.ChangePasswordRequest, ark_wallet_pb.ChangePasswordResponse> {
    path: "/fulmine.v1.WalletService/ChangePassword";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<ark_wallet_pb.ChangePasswordRequest>;
    requestDeserialize: grpc.deserialize<ark_wallet_pb.ChangePasswordRequest>;
    responseSerialize: grpc.serialize<ark_wallet_pb.ChangePasswordResponse>;
    responseDeserialize: grpc.deserialize<ark_wallet_pb.ChangePasswordResponse>;
}
interface IWalletServiceService_IRestoreWallet extends grpc.MethodDefinition<ark_wallet_pb.RestoreWalletRequest, ark_wallet_pb.RestoreWalletResponse> {
    path: "/fulmine.v1.WalletService/RestoreWallet";
    requestStream: false;
    responseStream: true;
    requestSerialize: grpc.serialize<ark_wallet_pb.RestoreWalletRequest>;
    requestDeserialize: grpc.deserialize<ark_wallet_pb.RestoreWalletRequest>;
    responseSerialize: grpc.serialize<ark_wallet_pb.RestoreWalletResponse>;
    responseDeserialize: grpc.deserialize<ark_wallet_pb.RestoreWalletResponse>;
}
interface IWalletServiceService_IStatus extends grpc.MethodDefinition<ark_wallet_pb.StatusRequest, ark_wallet_pb.StatusResponse> {
    path: "/fulmine.v1.WalletService/Status";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<ark_wallet_pb.StatusRequest>;
    requestDeserialize: grpc.deserialize<ark_wallet_pb.StatusRequest>;
    responseSerialize: grpc.serialize<ark_wallet_pb.StatusResponse>;
    responseDeserialize: grpc.deserialize<ark_wallet_pb.StatusResponse>;
}
interface IWalletServiceService_IAuth extends grpc.MethodDefinition<ark_wallet_pb.AuthRequest, ark_wallet_pb.AuthResponse> {
    path: "/fulmine.v1.WalletService/Auth";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<ark_wallet_pb.AuthRequest>;
    requestDeserialize: grpc.deserialize<ark_wallet_pb.AuthRequest>;
    responseSerialize: grpc.serialize<ark_wallet_pb.AuthResponse>;
    responseDeserialize: grpc.deserialize<ark_wallet_pb.AuthResponse>;
}

export const WalletServiceService: IWalletServiceService;

export interface IWalletServiceServer extends grpc.UntypedServiceImplementation {
    genSeed: grpc.handleUnaryCall<ark_wallet_pb.GenSeedRequest, ark_wallet_pb.GenSeedResponse>;
    createWallet: grpc.handleUnaryCall<ark_wallet_pb.CreateWalletRequest, ark_wallet_pb.CreateWalletResponse>;
    unlock: grpc.handleUnaryCall<ark_wallet_pb.UnlockRequest, ark_wallet_pb.UnlockResponse>;
    lock: grpc.handleUnaryCall<ark_wallet_pb.LockRequest, ark_wallet_pb.LockResponse>;
    changePassword: grpc.handleUnaryCall<ark_wallet_pb.ChangePasswordRequest, ark_wallet_pb.ChangePasswordResponse>;
    restoreWallet: grpc.handleServerStreamingCall<ark_wallet_pb.RestoreWalletRequest, ark_wallet_pb.RestoreWalletResponse>;
    status: grpc.handleUnaryCall<ark_wallet_pb.StatusRequest, ark_wallet_pb.StatusResponse>;
    auth: grpc.handleUnaryCall<ark_wallet_pb.AuthRequest, ark_wallet_pb.AuthResponse>;
}

export interface IWalletServiceClient {
    genSeed(request: ark_wallet_pb.GenSeedRequest, callback: (error: grpc.ServiceError | null, response: ark_wallet_pb.GenSeedResponse) => void): grpc.ClientUnaryCall;
    genSeed(request: ark_wallet_pb.GenSeedRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: ark_wallet_pb.GenSeedResponse) => void): grpc.ClientUnaryCall;
    genSeed(request: ark_wallet_pb.GenSeedRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: ark_wallet_pb.GenSeedResponse) => void): grpc.ClientUnaryCall;
    createWallet(request: ark_wallet_pb.CreateWalletRequest, callback: (error: grpc.ServiceError | null, response: ark_wallet_pb.CreateWalletResponse) => void): grpc.ClientUnaryCall;
    createWallet(request: ark_wallet_pb.CreateWalletRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: ark_wallet_pb.CreateWalletResponse) => void): grpc.ClientUnaryCall;
    createWallet(request: ark_wallet_pb.CreateWalletRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: ark_wallet_pb.CreateWalletResponse) => void): grpc.ClientUnaryCall;
    unlock(request: ark_wallet_pb.UnlockRequest, callback: (error: grpc.ServiceError | null, response: ark_wallet_pb.UnlockResponse) => void): grpc.ClientUnaryCall;
    unlock(request: ark_wallet_pb.UnlockRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: ark_wallet_pb.UnlockResponse) => void): grpc.ClientUnaryCall;
    unlock(request: ark_wallet_pb.UnlockRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: ark_wallet_pb.UnlockResponse) => void): grpc.ClientUnaryCall;
    lock(request: ark_wallet_pb.LockRequest, callback: (error: grpc.ServiceError | null, response: ark_wallet_pb.LockResponse) => void): grpc.ClientUnaryCall;
    lock(request: ark_wallet_pb.LockRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: ark_wallet_pb.LockResponse) => void): grpc.ClientUnaryCall;
    lock(request: ark_wallet_pb.LockRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: ark_wallet_pb.LockResponse) => void): grpc.ClientUnaryCall;
    changePassword(request: ark_wallet_pb.ChangePasswordRequest, callback: (error: grpc.ServiceError | null, response: ark_wallet_pb.ChangePasswordResponse) => void): grpc.ClientUnaryCall;
    changePassword(request: ark_wallet_pb.ChangePasswordRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: ark_wallet_pb.ChangePasswordResponse) => void): grpc.ClientUnaryCall;
    changePassword(request: ark_wallet_pb.ChangePasswordRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: ark_wallet_pb.ChangePasswordResponse) => void): grpc.ClientUnaryCall;
    restoreWallet(request: ark_wallet_pb.RestoreWalletRequest, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<ark_wallet_pb.RestoreWalletResponse>;
    restoreWallet(request: ark_wallet_pb.RestoreWalletRequest, metadata?: grpc.Metadata, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<ark_wallet_pb.RestoreWalletResponse>;
    status(request: ark_wallet_pb.StatusRequest, callback: (error: grpc.ServiceError | null, response: ark_wallet_pb.StatusResponse) => void): grpc.ClientUnaryCall;
    status(request: ark_wallet_pb.StatusRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: ark_wallet_pb.StatusResponse) => void): grpc.ClientUnaryCall;
    status(request: ark_wallet_pb.StatusRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: ark_wallet_pb.StatusResponse) => void): grpc.ClientUnaryCall;
    auth(request: ark_wallet_pb.AuthRequest, callback: (error: grpc.ServiceError | null, response: ark_wallet_pb.AuthResponse) => void): grpc.ClientUnaryCall;
    auth(request: ark_wallet_pb.AuthRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: ark_wallet_pb.AuthResponse) => void): grpc.ClientUnaryCall;
    auth(request: ark_wallet_pb.AuthRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: ark_wallet_pb.AuthResponse) => void): grpc.ClientUnaryCall;
}

export class WalletServiceClient extends grpc.Client implements IWalletServiceClient {
    constructor(address: string, credentials: grpc.ChannelCredentials, options?: Partial<grpc.ClientOptions>);
    public genSeed(request: ark_wallet_pb.GenSeedRequest, callback: (error: grpc.ServiceError | null, response: ark_wallet_pb.GenSeedResponse) => void): grpc.ClientUnaryCall;
    public genSeed(request: ark_wallet_pb.GenSeedRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: ark_wallet_pb.GenSeedResponse) => void): grpc.ClientUnaryCall;
    public genSeed(request: ark_wallet_pb.GenSeedRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: ark_wallet_pb.GenSeedResponse) => void): grpc.ClientUnaryCall;
    public createWallet(request: ark_wallet_pb.CreateWalletRequest, callback: (error: grpc.ServiceError | null, response: ark_wallet_pb.CreateWalletResponse) => void): grpc.ClientUnaryCall;
    public createWallet(request: ark_wallet_pb.CreateWalletRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: ark_wallet_pb.CreateWalletResponse) => void): grpc.ClientUnaryCall;
    public createWallet(request: ark_wallet_pb.CreateWalletRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: ark_wallet_pb.CreateWalletResponse) => void): grpc.ClientUnaryCall;
    public unlock(request: ark_wallet_pb.UnlockRequest, callback: (error: grpc.ServiceError | null, response: ark_wallet_pb.UnlockResponse) => void): grpc.ClientUnaryCall;
    public unlock(request: ark_wallet_pb.UnlockRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: ark_wallet_pb.UnlockResponse) => void): grpc.ClientUnaryCall;
    public unlock(request: ark_wallet_pb.UnlockRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: ark_wallet_pb.UnlockResponse) => void): grpc.ClientUnaryCall;
    public lock(request: ark_wallet_pb.LockRequest, callback: (error: grpc.ServiceError | null, response: ark_wallet_pb.LockResponse) => void): grpc.ClientUnaryCall;
    public lock(request: ark_wallet_pb.LockRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: ark_wallet_pb.LockResponse) => void): grpc.ClientUnaryCall;
    public lock(request: ark_wallet_pb.LockRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: ark_wallet_pb.LockResponse) => void): grpc.ClientUnaryCall;
    public changePassword(request: ark_wallet_pb.ChangePasswordRequest, callback: (error: grpc.ServiceError | null, response: ark_wallet_pb.ChangePasswordResponse) => void): grpc.ClientUnaryCall;
    public changePassword(request: ark_wallet_pb.ChangePasswordRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: ark_wallet_pb.ChangePasswordResponse) => void): grpc.ClientUnaryCall;
    public changePassword(request: ark_wallet_pb.ChangePasswordRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: ark_wallet_pb.ChangePasswordResponse) => void): grpc.ClientUnaryCall;
    public restoreWallet(request: ark_wallet_pb.RestoreWalletRequest, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<ark_wallet_pb.RestoreWalletResponse>;
    public restoreWallet(request: ark_wallet_pb.RestoreWalletRequest, metadata?: grpc.Metadata, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<ark_wallet_pb.RestoreWalletResponse>;
    public status(request: ark_wallet_pb.StatusRequest, callback: (error: grpc.ServiceError | null, response: ark_wallet_pb.StatusResponse) => void): grpc.ClientUnaryCall;
    public status(request: ark_wallet_pb.StatusRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: ark_wallet_pb.StatusResponse) => void): grpc.ClientUnaryCall;
    public status(request: ark_wallet_pb.StatusRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: ark_wallet_pb.StatusResponse) => void): grpc.ClientUnaryCall;
    public auth(request: ark_wallet_pb.AuthRequest, callback: (error: grpc.ServiceError | null, response: ark_wallet_pb.AuthResponse) => void): grpc.ClientUnaryCall;
    public auth(request: ark_wallet_pb.AuthRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: ark_wallet_pb.AuthResponse) => void): grpc.ClientUnaryCall;
    public auth(request: ark_wallet_pb.AuthRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: ark_wallet_pb.AuthResponse) => void): grpc.ClientUnaryCall;
}
