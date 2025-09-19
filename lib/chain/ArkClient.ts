import { Metadata, credentials } from '@grpc/grpc-js';
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
import { ServiceClient } from '../proto/ark/service_grpc_pb';
import * as arkrpc from '../proto/ark/service_pb';
import { WalletServiceClient } from '../proto/ark/wallet_grpc_pb';
import * as walletrpc from '../proto/ark/wallet_pb';
import TimeoutDeltaProvider from '../service/TimeoutDeltaProvider';
import type { WalletBalance } from '../wallet/providers/WalletProviderInterface';
import ArkSubscription, {
  CreatedVHtlc,
  type Events,
  SpentVHtlc,
} from './ArkSubscription';
import AspClient from './AspClient';
import type { IChainClient } from './ChainClient';

export type ArkConfig = {
  host: string;
  port: number;

  asp?: string;

  minWalletBalance?: number;
  maxZeroConfAmount?: number;

  useLocktimeSeconds?: boolean;
};

export type Timeouts = {
  refund: number;
  unilateralClaim: number;
  unilateralRefund: number;
  unilateralRefundWithoutReceiver: number;
};

type ArkAddress = {
  address: string;
  publicKey: string;
  boardingAddress: string;
};

class ArkClient extends BaseClient<
  BaseClientEvents &
    Events & {
      // "height" is populated when timelocks based on block numbers are used
      // else, "medianTime" is populated for seconds based timelocks
      block: { height?: number; medianTime?: number };
    }
> {
  public static readonly symbol = 'ARK';
  private static readonly OP_CSV_MULTIPLE = 512;

  public aspClient!: AspClient;
  public subscription!: ArkSubscription;

  private chainClient?: IChainClient;

  private client?: ServiceClient;
  private walletClient?: WalletServiceClient;
  private notificationClient?: NotificationServiceClient;

  private useLocktimeSeconds: boolean = false;

  private readonly meta: Metadata = new Metadata();

  constructor(
    protected readonly logger: Logger,
    private readonly config: ArkConfig,
  ) {
    super(logger, ArkClient.symbol);
  }

  public static decodeAddress = (address: string) => {
    const dec = bech32m.decodeUnsafe(address, 1023);
    if (dec === undefined) {
      throw new Error('invalid address');
    }

    const data = Buffer.from(bech32m.fromWords(dec.words));
    if (data.length !== 65) {
      throw new Error('invalid address (data.length !== 65)');
    }

    return {
      serverPubKey: data.subarray(1, 33),
      tweakedPubKey: data.subarray(33, 65),
    };
  };

  public connect = async (chainClient: IChainClient): Promise<boolean> => {
    if (chainClient === undefined) {
      throw new Error('BTC chain client is required for ARK node connection');
    }

    if (this.config.useLocktimeSeconds === undefined) {
      // On regtest we want to use block timeouts
      this.useLocktimeSeconds = !chainClient.isRegtest;
    } else {
      this.useLocktimeSeconds = this.config.useLocktimeSeconds;
    }

    this.logger.info(
      `Using ${this.useLocktimeSeconds ? 'second' : 'block'} timeouts for ${this.serviceName()} ${this.symbol}`,
    );

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

    this.walletClient = new WalletServiceClient(
      `${this.config.host}:${this.config.port}`,
      credentials.createInsecure(),
    );

    this.notificationClient = new NotificationServiceClient(
      `${this.config.host}:${this.config.port}`,
      credentials.createInsecure(),
    );

    try {
      const info = await this.getInfo();
      this.aspClient = new AspClient(this.config.asp ?? info.serverUrl);
      this.logger.debug(
        `Connected to ASP with pubkey: ${(await this.aspClient.getInfo()).signerPubkey}`,
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

    this.subscription = new ArkSubscription(
      this.logger,
      this,
      this.notificationClient,
      this.unaryCall,
      this.unaryNotificationCall,
    );
    this.subscription.on('vhtlc.created', (vHtlc) => {
      this.emit('vhtlc.created', vHtlc);
    });
    this.subscription.on('vhtlc.spent', (vHtlc) => {
      this.emit('vhtlc.spent', vHtlc);
    });

    this.subscription.connect();

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

      this.subscription?.connect();

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

    this.subscription?.disconnect();
    this.subscription?.removeAllListeners();

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
    return 'Fulmine';
  }

  public getInfo = async () => {
    return await this.unaryCall<
      arkrpc.GetInfoRequest,
      arkrpc.GetInfoResponse.AsObject
    >('getInfo', new arkrpc.GetInfoRequest());
  };

  public getWalletStatus = async () => {
    return await this.walletUnaryCall<
      walletrpc.StatusRequest,
      walletrpc.StatusResponse.AsObject
    >('status', new walletrpc.StatusRequest());
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
    height: number;
    timeouts: Timeouts;
  }> => {
    const convertDelay = (delay: number) => {
      if (this.useLocktimeSeconds) {
        const seconds = TimeoutDeltaProvider.minutesToSeconds(
          TimeoutDeltaProvider.blockTimes.get(this.chainClient!.symbol)! *
            delay,
        );
        return Math.round(
          Math.ceil(seconds / ArkClient.OP_CSV_MULTIPLE) *
            ArkClient.OP_CSV_MULTIPLE,
        );
      }

      return delay;
    };

    const createDelay = (delay: number) => {
      const timeout = new arkrpc.RelativeLocktime();

      timeout.setType(
        this.useLocktimeSeconds
          ? arkrpc.RelativeLocktime.LocktimeType.LOCKTIME_TYPE_SECOND
          : arkrpc.RelativeLocktime.LocktimeType.LOCKTIME_TYPE_BLOCK,
      );
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
      refund: convertDelay(Math.ceil(currentHeight + refundDelay)),
      unilateralClaim: convertDelay(Math.ceil(claimDelay)),
      unilateralRefund: convertDelay(Math.ceil(refundDelay)),
      unilateralRefundWithoutReceiver: convertDelay(Math.ceil(refundDelay)),
    };

    req.setRefundLocktime(timeouts.refund);
    req.setUnilateralClaimDelay(createDelay(timeouts.unilateralClaim));
    req.setUnilateralRefundDelay(createDelay(timeouts.unilateralRefund));
    req.setUnilateralRefundWithoutReceiverDelay(
      createDelay(timeouts.unilateralRefundWithoutReceiver),
    );

    return {
      timeouts,
      height: currentHeight,
      vHtlc: await this.unaryCall<
        arkrpc.CreateVHTLCRequest,
        arkrpc.CreateVHTLCResponse.AsObject
      >('createVHTLC', req, true),
    };
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

  private listenBlocks = async (blockNumber: number) => {
    if (this.useLocktimeSeconds) {
      const blockHash = await this.chainClient!.getBlockhash(blockNumber);
      const block = await this.chainClient!.getBlock(blockHash);

      this.emit('block', {
        medianTime: block.mediantime,
      });
    } else {
      this.emit('block', {
        height: blockNumber,
      });
    }
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

  private walletUnaryCall = <T, U>(
    methodName: keyof WalletServiceClient,
    params: T,
    asObject: boolean = true,
  ): Promise<U> => {
    return unaryCall(
      this.walletClient!,
      methodName,
      params,
      this.meta,
      asObject,
    );
  };
}

export default ArkClient;
export { CreatedVHtlc, SpentVHtlc };
