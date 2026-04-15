import type { Client } from '@grpc/grpc-js';
import { Metadata, credentials } from '@grpc/grpc-js';
import { bech32m } from '@scure/base';
import { Transaction } from '@scure/btc-signer';
import type {
  TransactionInput,
  TransactionOutput,
} from '@scure/btc-signer/psbt.js';
import { crypto } from 'bitcoinjs-lib';
import fs from 'fs';
import type { BaseClientEvents } from '../BaseClient';
import BaseClient from '../BaseClient';
import type Logger from '../Logger';
import {
  formatError,
  fromProtoInt,
  getHexBuffer,
  getHexString,
  stringify,
  toProtoInt,
} from '../Utils';
import { ClientStatus } from '../consts/Enums';
import TransactionLabelRepository from '../db/repositories/TransactionLabelRepository';
import { unaryCall } from '../lightning/GrpcUtils';
import { NotificationServiceClient } from '../proto/ark/notification';
import { ServiceClient } from '../proto/ark/service';
import * as arkrpc from '../proto/ark/service';
import type * as arktypes from '../proto/ark/types';
import { WalletServiceClient } from '../proto/ark/wallet';
import type * as walletrpc from '../proto/ark/wallet';
import TimeoutDeltaProvider from '../service/TimeoutDeltaProvider';
import type Sidecar from '../sidecar/Sidecar';
import type { WalletBalance } from '../wallet/providers/WalletProviderInterface';
import ArkSubscription, {
  CreatedVHtlc,
  type Events,
  SpentVHtlc,
} from './ArkSubscription';
import type { IChainClient } from './ChainClient';

export type ArkConfig = {
  host: string;
  port: number;
  macaroonpath?: string;

  minWalletBalance?: number;
  maxZeroConfAmount?: number;

  useLocktimeSeconds?: boolean;

  unilateralDelays?: Delays;
};

export type Timeouts = {
  refund: number;
  unilateralClaim: number;
  unilateralRefund: number;
  unilateralRefundWithoutReceiver: number;
};

type Outpoint = {
  txId: string;
  vout: number;
};

// All values in blocks
type Delays = {
  claim: number;
  refund: number;
  refundWithoutReceiver: number;
};

type ArkAddress = {
  address: string;
  publicKey: string;
  boardingAddress: string;
};

enum ArkBlockEventKind {
  Height = 'height',
  MedianTime = 'medianTime',
}

// "height" is populated when timelocks based on block numbers are used
// else, "medianTime" is populated for seconds based timelocks
type ArkBlockEvent =
  | {
      kind: ArkBlockEventKind.Height;
      height: number;
    }
  | {
      kind: ArkBlockEventKind.MedianTime;
      medianTime: number;
    };

class ArkClient extends BaseClient<
  BaseClientEvents &
    Events & {
      block: ArkBlockEvent;
    }
> {
  public static readonly symbol = 'ARK';

  private static readonly opCsvMultiple = 512;

  public pubkey!: Buffer;
  public subscription!: ArkSubscription;

  private chainClient?: IChainClient;

  private client?: ServiceClient & Client;
  private walletClient?: WalletServiceClient & Client;
  private notificationClient?: NotificationServiceClient & Client;

  private useLocktimeSeconds: boolean = false;

  private readonly meta: Metadata = new Metadata();
  private readonly delays: Delays;

  constructor(
    protected readonly logger: Logger,
    private readonly config: ArkConfig,
    private readonly sidecar: Sidecar,
  ) {
    super(logger, ArkClient.symbol);

    if (this.config.unilateralDelays !== undefined) {
      if (
        [
          this.config.unilateralDelays.claim,
          this.config.unilateralDelays.refund,
          this.config.unilateralDelays.refundWithoutReceiver,
        ].some((delay) => delay === undefined || isNaN(delay) || delay < 1)
      ) {
        throw new Error('all ark delays must be set');
      }
    }

    this.delays = this.config.unilateralDelays ?? {
      claim: 16,
      refund: 32,
      refundWithoutReceiver: 64,
    };

    if (
      this.config.macaroonpath !== undefined &&
      this.config.macaroonpath !== ''
    ) {
      if (!fs.existsSync(this.config.macaroonpath)) {
        throw new Error(
          `could not find configured macaroon file for ${this.serviceName()} ${this.symbol}`,
        );
      }

      const adminMacaroon = fs.readFileSync(this.config.macaroonpath);
      this.meta.add('macaroon', adminMacaroon.toString('hex'));
    }

    this.logger.debug(
      `${this.serviceName()} ${this.symbol} delays: ${stringify(this.delays)}`,
    );
  }

  public get usesLocktimeSeconds(): boolean {
    return this.useLocktimeSeconds;
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

  public static mapInputs = (tx: Transaction): TransactionInput[] => {
    const inputs: TransactionInput[] = [];

    for (let i = 0; i < tx.inputsLength; i++) {
      inputs.push(tx.getInput(i));
    }

    return inputs;
  };

  public static mapOutputs = (tx: Transaction): TransactionOutput[] => {
    const outputs: TransactionOutput[] = [];
    for (let i = 0; i < tx.outputsLength; i++) {
      outputs.push(tx.getOutput(i));
    }

    return outputs;
  };

  /**
   * @param preimageHash - SHA256 hash of the preimage
   */
  public static createVhtlcId = (
    preimageHash: Buffer,
    senderPubkey: Buffer,
    receiverPubkey: Buffer,
  ) => {
    const data = Buffer.concat([
      crypto.ripemd160(preimageHash),
      senderPubkey,
      receiverPubkey,
    ]);
    return getHexString(crypto.sha256(data));
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

    this.sidecar.removeListener('block', this.listenBlocks);

    this.chainClient = chainClient;
    this.sidecar.on('block', this.listenBlocks);

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
      this.logger.debug(
        `Connected to ${this.serviceName()} ${this.symbol} with pubkey: ${info.pubkey}`,
      );
      this.pubkey = getHexBuffer(info.pubkey);

      this.setClientStatus(ClientStatus.Connected);
    } catch (error) {
      this.setClientStatus(ClientStatus.Disconnected);

      this.client.close();
      this.walletClient.close();
      this.notificationClient.close();

      this.logger.error(
        `Could not connect to ${this.serviceName()}: ${formatError(error)}`,
      );
      this.logger.info(`Retrying in ${this.RECONNECT_INTERVAL} ms`);

      this.reconnectionTimer = setTimeout(
        () => this.connect(this.chainClient!),
        this.RECONNECT_INTERVAL,
      );

      return false;
    }

    this.subscription = new ArkSubscription(
      this.logger,
      this,
      this.notificationClient,
      this.meta,
      this.unaryCall,
      this.unaryNotificationCall,
    );
    this.subscription.on('vhtlc.created', (vHtlc) => {
      this.emit('vhtlc.created', vHtlc);
    });
    this.subscription.on('vhtlc.spent', (vHtlc) => {
      this.emit('vhtlc.spent', vHtlc);
    });

    await this.subscription.connect();

    return true;
  };

  private reconnect = async () => {
    this.setClientStatus(ClientStatus.Disconnected);

    try {
      const info = await this.getInfo();
      this.pubkey = getHexBuffer(info.pubkey);

      this.logger.info(
        `Reestablished connection to ${this.serviceName()} ${this.symbol}`,
      );

      this.clearReconnectTimer();

      await this.subscription?.connect();

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

    if (this.walletClient !== undefined) {
      this.walletClient.close();
      this.walletClient = undefined;
    }

    if (this.notificationClient !== undefined) {
      this.notificationClient.close();
      this.notificationClient = undefined;
    }

    this.sidecar.removeListener('block', this.listenBlocks);

    this.removeAllListeners();
  };

  public serviceName(): string {
    return 'Fulmine';
  }

  public getInfo = async () => {
    return await this.unaryCall<arkrpc.GetInfoRequest, arkrpc.GetInfoResponse>(
      'getInfo',
      {},
    );
  };

  public getWalletStatus = async () => {
    return await this.walletUnaryCall<
      walletrpc.StatusRequest,
      walletrpc.StatusResponse
    >('status', {});
  };

  public getBlockHeight = async (): Promise<number> => {
    if (this.chainClient === undefined) {
      throw new Error('chain client not set');
    }

    return (await this.chainClient.getBlockchainInfo()).blocks;
  };

  public getBlockTimestamp = async (height: number): Promise<number> => {
    if (this.chainClient === undefined) {
      throw new Error('chain client not set');
    }

    const blockHash = await this.chainClient.getBlockhash(height);
    const block = await this.chainClient.getBlock(blockHash);
    return block.mediantime;
  };

  public getBalance = async (): Promise<WalletBalance> => {
    const balance = await this.unaryCall<
      arkrpc.GetBalanceRequest,
      arkrpc.GetBalanceResponse
    >('getBalance', {});

    return {
      confirmedBalance: fromProtoInt(balance.amount),
      unconfirmedBalance: 0,
    };
  };

  public getAddress = async (): Promise<ArkAddress> => {
    const res = await this.unaryCall<
      arkrpc.GetAddressRequest,
      arkrpc.GetAddressResponse
    >('getAddress', {});

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
    const req: arkrpc.SendOffChainRequest = {
      address,
      amount: toProtoInt(amount),
    };

    const response = await this.unaryCall<
      arkrpc.SendOffChainRequest,
      arkrpc.SendOffChainResponse
    >('sendOffChain', req);

    await TransactionLabelRepository.addLabel(
      response.txid,
      ArkClient.symbol,
      label,
    );
    return response.txid;
  };

  public signTransaction = async (transaction: string): Promise<string> => {
    const req: arkrpc.SignTransactionRequest = {
      tx: transaction,
    };

    const res = await this.unaryCall<
      arkrpc.SignTransactionRequest,
      arkrpc.SignTransactionResponse
    >('signTransaction', req);
    return res.signedTx;
  };

  /**
   * @param preimageHash - SHA256 of the preimage
   */
  public createVHtlc = async (
    preimageHash: Buffer,
    refundDelay: number,
    claimPublicKey?: Buffer,
    refundPublicKey?: Buffer,
  ): Promise<{
    vHtlc: arkrpc.CreateVHTLCResponse;
    timeouts: Timeouts;
  }> => {
    const convertDelay = (delay: number) => {
      if (this.useLocktimeSeconds) {
        const seconds = TimeoutDeltaProvider.minutesToSeconds(
          TimeoutDeltaProvider.blockTimes.get(this.chainClient!.symbol)! *
            delay,
        );
        return Math.round(
          Math.ceil(seconds / ArkClient.opCsvMultiple) *
            ArkClient.opCsvMultiple,
        );
      }

      return delay;
    };

    const createDelay = (delay: number) => {
      return {
        type: this.useLocktimeSeconds
          ? arkrpc.RelativeLocktime_LocktimeType.LOCKTIME_TYPE_SECOND
          : arkrpc.RelativeLocktime_LocktimeType.LOCKTIME_TYPE_BLOCK,
        value: delay,
      } satisfies arkrpc.RelativeLocktime;
    };

    const req: arkrpc.CreateVHTLCRequest = {
      preimageHash: getHexString(crypto.ripemd160(preimageHash)),
      senderPubkey: '',
      receiverPubkey: '',
      refundLocktime: 0,
      unilateralClaimDelay: undefined,
      unilateralRefundDelay: undefined,
      unilateralRefundWithoutReceiverDelay: undefined,
    };

    if (claimPublicKey) {
      req.receiverPubkey = getHexString(claimPublicKey);
    }

    if (refundPublicKey) {
      req.senderPubkey = getHexString(refundPublicKey);
    }

    const currentHeight = await this.getBlockHeight();

    let refund: number;
    if (this.useLocktimeSeconds) {
      const currentTimestamp = await this.getBlockTimestamp(currentHeight);
      refund = currentTimestamp + convertDelay(Math.ceil(refundDelay));
    } else {
      refund = currentHeight + refundDelay;
    }

    const timeouts: Timeouts = {
      refund: Math.ceil(refund),
      unilateralClaim: convertDelay(Math.ceil(this.delays.claim)),
      unilateralRefund: convertDelay(Math.ceil(this.delays.refund)),
      unilateralRefundWithoutReceiver: convertDelay(
        Math.ceil(this.delays.refundWithoutReceiver),
      ),
    };

    req.refundLocktime = timeouts.refund;
    req.unilateralClaimDelay = createDelay(timeouts.unilateralClaim);
    req.unilateralRefundDelay = createDelay(timeouts.unilateralRefund);
    req.unilateralRefundWithoutReceiverDelay = createDelay(
      timeouts.unilateralRefundWithoutReceiver,
    );

    return {
      timeouts,
      vHtlc: await this.unaryCall<
        arkrpc.CreateVHTLCRequest,
        arkrpc.CreateVHTLCResponse
      >('createVhtlc', req),
    };
  };

  public claimVHtlc = async (
    preimage: Buffer,
    senderPubkey: Buffer,
    receiverPubkey: Buffer,
    outpoint: Outpoint,
    label: string,
  ): Promise<string> => {
    const vhtlcId = ArkClient.createVhtlcId(
      crypto.sha256(preimage),
      senderPubkey,
      receiverPubkey,
    );
    this.logger.debug(
      `Claiming vHTLC ${vhtlcId} outpoint: ${outpoint.txId}:${outpoint.vout}`,
    );

    const res = await this.unaryCall<
      arkrpc.ClaimVHTLCRequest,
      arkrpc.ClaimVHTLCResponse
    >('claimVhtlc', {
      preimage: getHexString(preimage),
      vhtlcId: vhtlcId,
      outpoint: this.createOutpoint(outpoint),
    });

    await TransactionLabelRepository.addLabel(
      res.redeemTxid,
      ArkClient.symbol,
      label,
    );
    return res.redeemTxid;
  };

  /**
   * @param preimageHash - sha256 hash of the preimage
   */
  public refundVHtlc = async (
    preimageHash: Buffer,
    senderPubkey: Buffer,
    receiverPubkey: Buffer,
    outpoint: Outpoint,
    label: string,
  ) => {
    const vhtlcId = ArkClient.createVhtlcId(
      preimageHash,
      senderPubkey,
      receiverPubkey,
    );
    this.logger.debug(
      `Refunding vHTLC ${vhtlcId} outpoint: ${outpoint.txId}:${outpoint.vout}`,
    );
    const res = await this.unaryCall<
      arkrpc.RefundVHTLCWithoutReceiverRequest,
      arkrpc.RefundVHTLCWithoutReceiverResponse
    >('refundVhtlcWithoutReceiver', {
      vhtlcId: vhtlcId,
      outpoint: this.createOutpoint(outpoint),
    });

    await TransactionLabelRepository.addLabel(
      res.redeemTxid,
      ArkClient.symbol,
      label,
    );

    return res.redeemTxid;
  };

  public getTx = async (txId: string): Promise<Transaction> => {
    const req: arkrpc.GetVirtualTxsRequest = {
      txids: [txId],
    };

    const res = await this.unaryCall<
      arkrpc.GetVirtualTxsRequest,
      arkrpc.GetVirtualTxsResponse
    >('getVirtualTxs', req);

    if (res.txs.length === 0) {
      throw new Error('transaction not found');
    }

    return Transaction.fromPSBT(
      Uint8Array.from(Buffer.from(res.txs[0], 'base64')),
    );
  };

  private listenBlocks = async (block: { height: number; symbol: string }) => {
    if (block.symbol !== this.chainClient?.symbol) {
      return;
    }

    if (this.useLocktimeSeconds) {
      const blockHash = await this.chainClient!.getBlockhash(block.height);
      const blockData = await this.chainClient!.getBlock(blockHash);

      this.emit('block', {
        kind: ArkBlockEventKind.MedianTime,
        medianTime: blockData.mediantime,
      });
    } else {
      this.emit('block', {
        kind: ArkBlockEventKind.Height,
        height: block.height,
      });
    }
  };

  private unaryCall = <T, U>(
    methodName: keyof ServiceClient,
    params: T,
  ): Promise<U> => {
    return unaryCall(this.client!, methodName, params, this.meta);
  };

  private unaryNotificationCall = <T, U>(
    methodName: keyof NotificationServiceClient,
    params: T,
  ): Promise<U> => {
    return unaryCall(this.notificationClient!, methodName, params, this.meta);
  };

  private walletUnaryCall = <T, U>(
    methodName: keyof WalletServiceClient,
    params: T,
  ): Promise<U> => {
    return unaryCall(this.walletClient!, methodName, params, this.meta);
  };

  private createOutpoint = (outpoint: Outpoint) => {
    return {
      txid: outpoint.txId,
      vout: outpoint.vout,
    } satisfies arktypes.Input;
  };
}

export default ArkClient;
export { CreatedVHtlc, SpentVHtlc };
export { ArkBlockEventKind };
export type { ArkBlockEvent };
