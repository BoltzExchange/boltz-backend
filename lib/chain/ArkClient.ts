import {
  type ClientReadableStream,
  Metadata,
  credentials,
} from '@grpc/grpc-js';
import { bech32m } from '@scure/base';
import { crypto } from 'bitcoinjs-lib';
import type { BaseClientEvents } from '../BaseClient';
import BaseClient from '../BaseClient';
import type Logger from '../Logger';
import { formatError, getHexString } from '../Utils';
import { ClientStatus } from '../consts/Enums';
import TransactionLabelRepository from '../db/repositories/TransactionLabelRepository';
import { unaryCall } from '../lightning/GrpcUtils';
import { NotificationServiceClient } from '../proto/ark/notification_grpc_pb';
import * as notificationrpc from '../proto/ark/notification_pb';
import { ServiceClient } from '../proto/ark/service_grpc_pb';
import * as arkrpc from '../proto/ark/service_pb';
import type { WalletBalance } from '../wallet/providers/WalletProviderInterface';
import AspClient from './AspClient';
import type { IChainClient } from './ChainClient';

export type ArkConfig = {
  host: string;
  port: number;

  minWalletBalance?: number;
  maxZeroConfAmount?: number;
};

export type Timeouts = {
  unilateralClaim: number;
  unilateralRefund: number;
  unilateralRefundWithoutReceiver: number;
};

type ArkAddress = {
  address: string;
  publicKey: string;
  boardingAddress: string;
};

type CreatedVHtlc = {
  address: string;
  txId: string;
  vout: number;
  amount: number;
};

type SpentVHtlc = {
  outpoint: {
    txid: string;
    vout: number;
  };
  spentBy: string;
};

type SubscribedAddress = {
  address: string;
  preimageHash: Buffer;
};

class ArkClient extends BaseClient<
  BaseClientEvents & {
    block: number;
    'vhtlc.created': CreatedVHtlc;
    'vhtlc.spent': SpentVHtlc;
  }
> {
  public static readonly symbol = 'ARK';

  public aspClient!: AspClient;

  private chainClient?: IChainClient;

  private client?: ServiceClient;
  private notificationClient?: NotificationServiceClient;
  private vHtlcStream?: ClientReadableStream<notificationrpc.GetVtxoNotificationsResponse>;

  private readonly meta: Metadata = new Metadata();
  private readonly subscribedAddresses = new Set<SubscribedAddress>();

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

    if (this.chainClient !== undefined) {
      this.chainClient.removeListener('block', this.listenBlocks);
    }

    this.chainClient = chainClient;
    this.chainClient.on('block', this.listenBlocks);

    this.client = new ServiceClient(
      `${this.config.host}:${this.config.port}`,
      credentials.createInsecure(),
    );

    this.notificationClient = new NotificationServiceClient(
      `${this.config.host}:${this.config.port}`,
      credentials.createInsecure(),
    );

    try {
      const info = await this.getInfo();
      this.aspClient = new AspClient(info.serverUrl);
      this.logger.debug(
        `Connected to ASP with pubkey: ${(await this.aspClient.getInfo()).pubkey}`,
      );

      this.setClientStatus(ClientStatus.Connected);
    } catch (error) {
      this.setClientStatus(ClientStatus.Disconnected);
      this.logger.error(
        `Could not connect to ${this.serviceName()}: ${formatError(error)}`,
      );
      this.logger.info(`Retrying in ${this.RECONNECT_INTERVAL} ms`);

      this.reconnectionTimer = setTimeout(
        (client) => this.connect(client),
        this.RECONNECT_INTERVAL,
      );

      return false;
    }

    this.streamVhtlcs();

    return true;
  };

  private reconnect = async () => {
    this.setClientStatus(ClientStatus.Disconnected);

    try {
      await this.getInfo();

      this.logger.info(
        `Reestablished connection to ${this.serviceName()} ${this.symbol}`,
      );

      this.clearReconnectTimer();

      this.streamVhtlcs();

      this.setClientStatus(ClientStatus.Connected);
    } catch (err) {
      this.setClientStatus(ClientStatus.Disconnected);

      this.logger.error(
        `Could not reconnect to ${this.serviceName()} ${this.symbol}: ${err}`,
      );
      this.logger.info(`Retrying in ${this.RECONNECT_INTERVAL} ms`);

      this.reconnectionTimer = setTimeout(
        this.reconnect,
        this.RECONNECT_INTERVAL,
      );
    }
  };

  public disconnect = () => {
    this.clearReconnectTimer();
    this.setClientStatus(ClientStatus.Disconnected);

    if (this.vHtlcStream !== undefined) {
      this.vHtlcStream.cancel();
      this.vHtlcStream = undefined;
    }

    if (this.client !== undefined) {
      this.client.close();
      this.client = undefined;
    }

    if (this.notificationClient !== undefined) {
      this.notificationClient.close();
      this.notificationClient = undefined;
    }

    this.chainClient?.removeListener('block', this.listenBlocks);

    this.removeAllListeners();
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
      throw new Error('chain client not set');
    }

    return (await this.chainClient.getBlockchainInfo()).blocks;
  };

  public getBalance = async (): Promise<WalletBalance> => {
    const balance = await this.unaryCall<
      arkrpc.GetBalanceRequest,
      arkrpc.GetBalanceResponse.AsObject
    >('getBalance', new arkrpc.GetBalanceRequest());

    return {
      confirmedBalance: balance.amount,
      unconfirmedBalance: 0,
    };
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
    label: string,
  ): Promise<string> => {
    const req = new arkrpc.SendOffChainRequest();
    req.setAddress(address);
    req.setAmount(amount);

    const response = await this.unaryCall<
      arkrpc.SendOffChainRequest,
      arkrpc.SendOffChainResponse.AsObject
    >('sendOffChain', req);

    await TransactionLabelRepository.addLabel(
      response.txid,
      ArkClient.symbol,
      label,
    );
    return response.txid;
  };

  public signTransaction = async (transaction: string): Promise<string> => {
    const req = new arkrpc.SignTransactionRequest();
    req.setTx(transaction);

    const res = await this.unaryCall<
      arkrpc.SignTransactionRequest,
      arkrpc.SignTransactionResponse.AsObject
    >('signTransaction', req, true);
    return res.signedTx;
  };

  /**
   * @param preimageHash - SHA256 of the preimage
   */
  public createVHtlc = async (
    preimageHash: Buffer,
    claimDelay: number,
    refundDelay: number,
    claimPublicKey?: Buffer,
    refundPublicKey?: Buffer,
  ): Promise<{
    vHtlc: arkrpc.CreateVHTLCResponse.AsObject;
    timeouts: Timeouts;
  }> => {
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

    const currentHeight = await this.getBlockHeight();
    const timeouts: Timeouts = {
      unilateralClaim: Math.ceil(currentHeight + claimDelay),
      unilateralRefund: Math.ceil(currentHeight + refundDelay),
      unilateralRefundWithoutReceiver: Math.ceil(currentHeight + refundDelay),
    };

    req.setUnilateralClaimDelay(createDelay(timeouts.unilateralClaim));
    req.setUnilateralRefundDelay(createDelay(timeouts.unilateralRefund));
    req.setUnilateralRefundWithoutReceiverDelay(
      createDelay(timeouts.unilateralRefundWithoutReceiver),
    );

    return {
      timeouts,
      vHtlc: await this.unaryCall<
        arkrpc.CreateVHTLCRequest,
        arkrpc.CreateVHTLCResponse.AsObject
      >('createVHTLC', req, true),
    };
  };

  // TODO: subscribe on startup
  public subscribeAddresses = async (addresses: SubscribedAddress[]) => {
    // TODO: when do we need that?
    // TODO: unsubscribe
    for (const address of addresses) {
      this.subscribedAddresses.add(address);
    }

    const req = new notificationrpc.SubscribeForAddressesRequest();
    req.setAddressesList(addresses.map((a) => a.address));

    await this.unaryNotificationCall<
      notificationrpc.SubscribeForAddressesRequest,
      notificationrpc.SubscribeForAddressesResponse.AsObject
    >('subscribeForAddresses', req);
  };

  public claimVHtlc = async (
    preimage: Buffer,
    label: string,
  ): Promise<string> => {
    const req = new arkrpc.ClaimVHTLCRequest();
    req.setPreimage(getHexString(preimage));

    const res = await this.unaryCall<
      arkrpc.ClaimVHTLCRequest,
      arkrpc.ClaimVHTLCResponse.AsObject
    >('claimVHTLC', req);

    await TransactionLabelRepository.addLabel(
      res.redeemTxid,
      ArkClient.symbol,
      label,
    );
    return res.redeemTxid;
  };

  public refundVHtlc = async (preimageHash: Buffer, label: string) => {
    const req = new arkrpc.RefundVHTLCWithoutReceiverRequest();
    req.setPreimageHash(getHexString(crypto.ripemd160(preimageHash)));

    const res = await this.unaryCall<
      arkrpc.RefundVHTLCWithoutReceiverRequest,
      arkrpc.RefundVHTLCWithoutReceiverResponse.AsObject
    >('refundVHTLCWithoutReceiver', req);

    await TransactionLabelRepository.addLabel(
      res.redeemTxid,
      ArkClient.symbol,
      label,
    );

    return res.redeemTxid;
  };

  // TODO: rescan for spent
  // TODO: list vhtlcs not working?
  public rescan = async () => {
    const toRescan = Array.from(this.subscribedAddresses);
    this.subscribedAddresses.clear();

    for (const { address, preimageHash } of toRescan) {
      try {
        const req = new arkrpc.ListVHTLCRequest();
        req.setPreimageHashFilter(getHexString(crypto.ripemd160(preimageHash)));

        const res = await this.unaryCall<
          arkrpc.ListVHTLCRequest,
          arkrpc.ListVHTLCResponse.AsObject
        >('listVHTLC', req, true);

        if (res.vhtlcsList.length === 0) {
          continue;
        }

        if (res.vhtlcsList.length > 1) {
          this.logger.warn(
            `Found ${res.vhtlcsList.length} new vHTLCs for ${address}`,
          );
        }

        const vhtlc = res.vhtlcsList[0];
        this.emit('vhtlc.created', {
          address,
          txId: vhtlc.outpoint!.txid,
          vout: vhtlc.outpoint!.vout,
          amount: vhtlc.receiver!.amount,
        });
      } catch (error) {
        this.logger.silly(
          `No ${this.serviceName()} ${this.symbol} vHTLC found for address ${address}: ${formatError(error)}`,
        );
      }
    }
  };

  private static decodeAddress = (address: string) => {
    const dec = bech32m.decodeUnsafe(address, 1023);
    if (dec === undefined) {
      throw new Error('invalid address');
    }

    const data = Buffer.from(bech32m.fromWords(dec.words));
    if (data.length !== 64) {
      throw new Error('invalid address (data.length !== 64)');
    }

    return {
      serverPubKey: data.subarray(0, 32),
      tweakedPubKey: data.subarray(32, 64),
    };
  };

  private streamVhtlcs = async () => {
    if (this.vHtlcStream !== undefined) {
      this.vHtlcStream.destroy();
    }

    const req = new notificationrpc.GetVtxoNotificationsRequest();
    this.vHtlcStream = this.notificationClient!.getVtxoNotifications(req);

    this.vHtlcStream.on(
      'data',
      (res: notificationrpc.GetVtxoNotificationsResponse) => {
        const notification = res.getNotification()?.toObject();
        if (notification === undefined) {
          return;
        }

        const decoded = new Map<string, string>(
          notification.addressesList.map((address) => [
            getHexString(ArkClient.decodeAddress(address).tweakedPubKey),
            address,
          ]),
        );

        for (const vhtlc of notification.newVtxosList) {
          if (vhtlc.receiver === undefined) {
            continue;
          }

          const recipient = decoded.get(vhtlc.receiver.pubkey);
          if (recipient === undefined) {
            continue;
          }

          this.emit('vhtlc.created', {
            address: recipient,
            txId: vhtlc.outpoint!.txid,
            vout: vhtlc.outpoint!.vout,
            amount: vhtlc.receiver!.amount,
          });
        }

        for (const vhtlc of notification.spentVtxosList) {
          this.emit('vhtlc.spent', {
            outpoint: {
              txid: vhtlc.outpoint!.txid,
              vout: vhtlc.outpoint!.vout,
            },
            spentBy: vhtlc.spentBy!,
          });
        }
      },
    );

    this.vHtlcStream.on('error', (err) => {
      this.logger.error(`Error streaming VHTLCs: ${err}`);

      if (this.isConnected()) {
        this.reconnect();
      }
    });

    this.vHtlcStream.on('end', () => {
      this.logger.warn('Stream of vHTLCs ended');
    });
  };

  private listenBlocks = (blockNumber: number) => {
    this.emit('block', blockNumber);
  };

  private unaryCall = <T, U>(
    methodName: keyof ServiceClient,
    params: T,
    asObject: boolean = true,
  ): Promise<U> => {
    return unaryCall(this.client!, methodName, params, this.meta, asObject);
  };

  private unaryNotificationCall = <T, U>(
    methodName: keyof NotificationServiceClient,
    params: T,
    asObject: boolean = true,
  ): Promise<U> => {
    return unaryCall(
      this.notificationClient!,
      methodName,
      params,
      this.meta,
      asObject,
    );
  };
}

export default ArkClient;
export type { CreatedVHtlc, SpentVHtlc };
