import { Metadata, credentials } from '@grpc/grpc-js';
import { crypto } from 'bitcoinjs-lib';
import type { BaseClientEvents } from '../BaseClient';
import BaseClient from '../BaseClient';
import type Logger from '../Logger';
import { formatError, getHexString } from '../Utils';
import { ClientStatus } from '../consts/Enums';
import { unaryCall } from '../lightning/GrpcUtils';
import { NotificationServiceClient } from '../proto/ark/notification_grpc_pb';
import * as notificationrpc from '../proto/ark/notification_pb';
import { ServiceClient } from '../proto/ark/service_grpc_pb';
import * as arkrpc from '../proto/ark/service_pb';
import type * as arkrpcTypes from '../proto/ark/types_pb';
import type { IChainClient } from './ChainClient';

export type ArkConfig = {
  host: string;
  port: number;
};

export type ArkSwapTree = arkrpc.TaprootTree.AsObject;

type ArkAddress = {
  address: string;
  publicKey: string;
  boardingAddress: string;
};

// TODO: rescan on startup
class ArkClient extends BaseClient<
  BaseClientEvents & {
    'ark.vhtlc.found': arkrpcTypes.Notification.AsObject;
  }
> {
  public static readonly symbol = 'ARK';

  private chainClient?: IChainClient;

  private client!: ServiceClient;
  private notificationClient!: NotificationServiceClient;
  private readonly meta: Metadata = new Metadata();

  constructor(
    protected readonly logger: Logger,
    private readonly config: ArkConfig,
  ) {
    super(logger, ArkClient.symbol);
  }

  public connect = async (chainClient: IChainClient): Promise<boolean> => {
    if (this.isConnected()) {
      return true;
    }

    this.chainClient = chainClient;

    this.client = new ServiceClient(
      `${this.config.host}:${this.config.port}`,
      credentials.createInsecure(),
    );

    this.notificationClient = new NotificationServiceClient(
      `${this.config.host}:${this.config.port}`,
      credentials.createInsecure(),
    );

    try {
      await this.getInfo();
      this.setClientStatus(ClientStatus.Connected);
    } catch (error) {
      this.setClientStatus(ClientStatus.Disconnected);
      this.logger.error(
        `Could not connect to ${this.serviceName()}: ${formatError(error)}`,
      );
      return false;
    }

    // TODO: retry on disconnect
    this.streamVhtlcs();

    return true;
  };

  public serviceName(): string {
    return 'ARK-node';
  }

  public getInfo = async () => {
    return await this.unaryCall<
      arkrpc.GetInfoRequest,
      arkrpc.GetInfoResponse.AsObject
    >('getInfo', new arkrpc.GetInfoRequest());
  };

  public getBlockHeight = async (): Promise<number> => {
    if (this.chainClient === undefined) {
      throw 'chain client not set';
    }

    return (await this.chainClient.getBlockchainInfo()).blocks;
  };

  public getBalance = async (): Promise<number> => {
    const balance = await this.unaryCall<
      arkrpc.GetBalanceRequest,
      arkrpc.GetBalanceResponse.AsObject
    >('getBalance', new arkrpc.GetBalanceRequest());

    return balance.amount;
  };

  public getAddress = async (): Promise<ArkAddress> => {
    const res = await this.unaryCall<
      arkrpc.GetAddressRequest,
      arkrpc.GetAddressResponse.AsObject
    >('getAddress', new arkrpc.GetAddressRequest());

    const [base, queryString] = res.address.split('?');
    const params = new URLSearchParams(queryString || '');

    return {
      publicKey: res.pubkey,
      address: params.get('ark')!,
      boardingAddress: base.replace('bitcoin:', ''),
    };
  };

  public sendOffchain = async (
    address: string,
    amount: number,
  ): Promise<string> => {
    const req = new arkrpc.SendOffChainRequest();
    req.setAddress(address);
    req.setAmount(amount);

    const response = await this.unaryCall<
      arkrpc.SendOffChainRequest,
      arkrpc.SendOffChainResponse.AsObject
    >('sendOffChain', req);
    return response.txid;
  };

  /**
   * @param preimageHash - Should be the SHA256 of the preimage
   */
  public createVHtlc = async (
    preimageHash: Buffer,
    claimDelay: number,
    refundDelay: number,
    claimPublicKey?: Buffer,
    refundPublicKey?: Buffer,
  ): Promise<arkrpc.CreateVHTLCResponse> => {
    const createDelay = (delay: number) => {
      const timeout = new arkrpc.RelativeLocktime();
      timeout.setType(arkrpc.RelativeLocktime.LocktimeType.LOCKTIME_TYPE_BLOCK);
      timeout.setValue(delay);
      return timeout;
    };

    const req = new arkrpc.CreateVHTLCRequest();
    req.setPreimageHash(getHexString(crypto.ripemd160(preimageHash)));

    if (claimPublicKey) {
      req.setReceiverPubkey(getHexString(claimPublicKey));
    }

    if (refundPublicKey) {
      req.setSenderPubkey(getHexString(refundPublicKey));
    }

    req.setUnilateralClaimDelay(createDelay(claimDelay));
    req.setUnilateralRefundDelay(createDelay(refundDelay));
    req.setUnilateralRefundWithoutReceiverDelay(createDelay(refundDelay));

    return await this.unaryCall<
      arkrpc.CreateVHTLCRequest,
      arkrpc.CreateVHTLCResponse
    >('createVHTLC', req, false);
  };

  public subscribeAddresses = async (addresses: string[]) => {
    const req = new notificationrpc.SubscribeForAddressesRequest();
    req.setAddressesList(addresses);

    await this.unaryNotificationCall<
      notificationrpc.SubscribeForAddressesRequest,
      notificationrpc.SubscribeForAddressesResponse.AsObject
    >('subscribeForAddresses', req);
  };

  public claimVHtlc = async (preimage: Buffer): Promise<string> => {
    const req = new arkrpc.ClaimVHTLCRequest();
    req.setPreimage(getHexString(preimage));

    const res = await this.unaryCall<
      arkrpc.ClaimVHTLCRequest,
      arkrpc.ClaimVHTLCResponse.AsObject
    >('claimVHTLC', req);
    return res.redeemTxid;
  };

  private streamVhtlcs = async () => {
    const req = new notificationrpc.GetVtxoNotificationsRequest();
    const stream = this.notificationClient.getVtxoNotifications(req);

    stream.on('data', (res: notificationrpc.GetVtxoNotificationsResponse) => {
      const notification = res.getNotification();
      if (notification) {
        this.emit('ark.vhtlc.found', notification.toObject());
      }
    });

    stream.on('error', (err) => {
      this.logger.error(`Error streaming VHTLCs: ${err}`);
    });

    stream.on('end', () => {
      this.logger.info('Stream of VHTLCs ended');
    });
  };

  private unaryCall = <T, U>(
    methodName: keyof ServiceClient,
    params: T,
    asObject: boolean = true,
  ): Promise<U> => {
    return unaryCall(this.client, methodName, params, this.meta, asObject);
  };

  private unaryNotificationCall = <T, U>(
    methodName: keyof NotificationServiceClient,
    params: T,
    asObject: boolean = true,
  ): Promise<U> => {
    return unaryCall(
      this.notificationClient,
      methodName,
      params,
      this.meta,
      asObject,
    );
  };
}

export default ArkClient;
