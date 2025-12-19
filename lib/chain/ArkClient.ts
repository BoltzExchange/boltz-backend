import type { Client } from '@grpc/grpc-js';
import { Metadata, credentials } from '@grpc/grpc-js';
import { bech32m } from '@scure/base';
import { Transaction } from '@scure/btc-signer';
import type {
  TransactionInput,
  TransactionOutput,
} from '@scure/btc-signer/psbt';
import { crypto } from 'bitcoinjs-lib';
import type { BaseClientEvents } from '../BaseClient';
import BaseClient from '../BaseClient';
import type Logger from '../Logger';
import { formatError, getHexBuffer, getHexString, stringify } from '../Utils';
import { ClientStatus } from '../consts/Enums';
import TransactionLabelRepository from '../db/repositories/TransactionLabelRepository';
import { unaryCall } from '../lightning/GrpcUtils';
import { NotificationServiceClient } from '../proto/ark/notification_grpc_pb';
import { ServiceClient } from '../proto/ark/service_grpc_pb';
import * as arkrpc from '../proto/ark/service_pb';
import { WalletServiceClient } from '../proto/ark/wallet_grpc_pb';
import * as walletrpc from '../proto/ark/wallet_pb';
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

class ArkClient extends BaseClient<
  BaseClientEvents &
    Events & {
      // "height" is populated when timelocks based on block numbers are used
      // else, "medianTime" is populated for seconds based timelocks
      block: { height?: number; medianTime?: number };
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

  public get lockTimeInSeconds(): boolean {
    return this.useLocktimeSeconds;
  }

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
      this.sidecar.removeListener('block', this.listenBlocks);
    }

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
    refundDelay: number,
    claimPublicKey?: Buffer,
    refundPublicKey?: Buffer,
  ): Promise<{
    vHtlc: arkrpc.CreateVHTLCResponse.AsObject;
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

    req.setRefundLocktime(timeouts.refund);
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

  public claimVHtlc = async (
    preimage: Buffer,
    senderPubkey: Buffer,
    receiverPubkey: Buffer,
    label: string,
  ): Promise<string> => {
    const req = new arkrpc.ClaimVHTLCRequest();
    req.setPreimage(getHexString(preimage));
    req.setVhtlcId(
      ArkClient.createVhtlcId(
        crypto.sha256(preimage),
        senderPubkey,
        receiverPubkey,
      ),
    );

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

  /**
   * @param preimageHash - sha256 hash of the preimage
   */
  public refundVHtlc = async (
    preimageHash: Buffer,
    senderPubkey: Buffer,
    receiverPubkey: Buffer,
    label: string,
  ) => {
    const req = new arkrpc.RefundVHTLCWithoutReceiverRequest();
    req.setVhtlcId(
      ArkClient.createVhtlcId(preimageHash, senderPubkey, receiverPubkey),
    );

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

  public getTx = async (txId: string): Promise<Transaction> => {
    const req = new arkrpc.GetVirtualTxsRequest();
    req.setTxidsList([txId]);

    const res = await this.unaryCall<
      arkrpc.GetVirtualTxsRequest,
      arkrpc.GetVirtualTxsResponse.AsObject
    >('getVirtualTxs', req);

    if (res.txsList.length === 0) {
      throw new Error('transaction not found');
    }

    return Transaction.fromPSBT(
      Uint8Array.from(Buffer.from(res.txsList[0], 'base64')),
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
        medianTime: blockData.mediantime,
      });
    } else {
      this.emit('block', {
        height: block.height,
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
