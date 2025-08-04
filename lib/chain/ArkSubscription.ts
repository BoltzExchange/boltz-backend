import type { ClientReadableStream } from '@grpc/grpc-js';
import { crypto } from 'bitcoinjs-lib';
import type Logger from '../Logger';
import { sleep } from '../PromiseUtils';
import { formatError, getHexBuffer, getHexString } from '../Utils';
import TypedEventEmitter from '../consts/TypedEventEmitter';
import type { NotificationServiceClient } from '../proto/ark/notification_grpc_pb';
import * as notificationrpc from '../proto/ark/notification_pb';
import * as arkrpc from '../proto/ark/service_pb';
import ArkClient from './ArkClient';

type SubscribedAddress = {
  address: string;
  preimageHash: Buffer;
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

type Events = {
  'vhtlc.created': CreatedVHtlc;
  'vhtlc.spent': SpentVHtlc;
};

class ArkSubscription extends TypedEventEmitter<Events> {
  private static readonly reconnectInterval = 2_500;

  private readonly subscribedAddresses = new Set<SubscribedAddress>();

  private shouldDisconnect = false;
  private vHtlcStream?: ClientReadableStream<notificationrpc.GetVtxoNotificationsResponse>;

  constructor(
    private readonly logger: Logger,
    private readonly client: ArkClient,
    private readonly notificationClient: NotificationServiceClient,
    private readonly unaryCall: (typeof ArkClient.prototype)['unaryCall'],
    private readonly unaryNotificationCall: (typeof ArkClient.prototype)['unaryNotificationCall'],
  ) {
    super();
  }

  public connect = () => {
    this.shouldDisconnect = false;

    this.rescan();
    this.streamVhtlcs();
  };

  public disconnect = () => {
    this.shouldDisconnect = true;

    if (this.vHtlcStream !== undefined) {
      this.vHtlcStream.cancel();
      this.vHtlcStream = undefined;
    }
  };

  public subscribeAddresses = async (addresses: SubscribedAddress[]) => {
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

  public rescan = async () => {
    const toRescan = Array.from(this.subscribedAddresses);

    for (const { address, preimageHash } of toRescan) {
      try {
        const req = new arkrpc.ListVHTLCRequest();
        req.setPreimageHashFilter(getHexString(crypto.ripemd160(preimageHash)));

        const res = await this.unaryCall<
          arkrpc.ListVHTLCRequest,
          arkrpc.ListVHTLCResponse.AsObject
        >('listVHTLC', req, true);

        for (const vhtlc of res.vhtlcsList) {
          this.emit('vhtlc.created', {
            address,
            txId: vhtlc.outpoint!.txid,
            vout: vhtlc.outpoint!.vout,
            amount: vhtlc.amount,
          });

          if (vhtlc.isSpent && vhtlc.spentBy !== '') {
            this.emit('vhtlc.spent', {
              outpoint: {
                txid: vhtlc.outpoint!.txid,
                vout: vhtlc.outpoint!.vout,
              },
              spentBy: vhtlc.spentBy,
            });
          }
        }
      } catch (error) {
        this.logger.silly(
          `No ${this.client.serviceName()} ${this.client.symbol} vHTLC found for address ${address}: ${formatError(error)}`,
        );
      }
    }
  };

  private streamVhtlcs = () => {
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
          const recipient = decoded.get(
            getHexString(getHexBuffer(vhtlc.script).subarray(2)),
          );
          if (recipient === undefined) {
            continue;
          }

          this.emit('vhtlc.created', {
            address: recipient,
            txId: vhtlc.outpoint!.txid,
            vout: vhtlc.outpoint!.vout,
            amount: vhtlc.amount,
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

    this.vHtlcStream.on('end', () => {
      this.logger.warn('Stream of vHTLCs ended');
      this.reconnect();
    });

    this.vHtlcStream.on('error', (err) => {
      this.logger.error(`Error streaming vHTLCs: ${err}`);
      this.reconnect();
    });

    this.vHtlcStream.on('close', () => {
      this.logger.warn('Stream of vHTLCs closed');
      this.reconnect();
    });
  };

  private reconnect = async () => {
    if (this.shouldDisconnect) {
      return;
    }

    if (this.vHtlcStream !== undefined) {
      this.vHtlcStream.cancel();
      this.vHtlcStream = undefined;
    }

    while (true) {
      await sleep(ArkSubscription.reconnectInterval);

      try {
        const status = await this.client.getWalletStatus();
        if (!status.unlocked) {
          this.logger.warn(
            `${this.client.serviceName()} ${this.client.symbol} wallet is locked, waiting for ${ArkSubscription.reconnectInterval}ms`,
          );
          continue;
        }

        if (!status.synced) {
          this.logger.warn(
            `${this.client.serviceName()} ${this.client.symbol} wallet is not synced, waiting for ${ArkSubscription.reconnectInterval}ms`,
          );
          continue;
        }

        this.logger.info(
          `${this.client.serviceName()} ${this.client.symbol} wallet is synced, recreating subscriptions`,
        );

        await this.rescan();
        this.streamVhtlcs();
        break;
      } catch (e) {
        this.logger.error(
          `Could not recreate ${this.client.serviceName()} ${this.client.symbol} subscriptions: ${formatError(e)}`,
        );
      }
    }
  };
}

export default ArkSubscription;
export type { CreatedVHtlc, SpentVHtlc, Events };
