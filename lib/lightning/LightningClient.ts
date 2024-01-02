import bolt11 from 'bolt11';
import { IBaseClient } from '../BaseClient';
import { ClientStatus } from '../consts/Enums';
import * as lndrpc from '../proto/lnd/rpc_pb';
import { BalancerFetcher } from '../wallet/providers/WalletProviderInterface';

enum InvoiceState {
  Open,
  Settled,
  Cancelled,
  Accepted,
}

enum HtlcState {
  Accepted,
  Settled,
  Cancelled,
}

type NodeInfo = {
  version: string;
  pubkey: string;
  uris: string[];
  peers: number;
  blockHeight: number;
  channels: {
    active: number;
    inactive: number;
    pending: number;
  };
};

type ChannelInfo = {
  remotePubkey: string;
  private: boolean;
  chanId: string;
  fundingTransactionId: string;
  fundingTransactionVout: number;
  capacity: number;
  localBalance: number;
  remoteBalance: number;
};

type HopHint = {
  nodeId: string;
  chanId: string;
  feeBaseMsat: number;
  feeProportionalMillionths: number;
  cltvExpiryDelta: number;
};

type Htlc = {
  valueMsat: number;
  state: HtlcState;
};

type Invoice = {
  state: InvoiceState;
  htlcs: Htlc[];
};

enum InvoiceFeature {
  MPP,
  AMP,
}

type DecodedInvoice = {
  value: number;
  cltvExpiry: number;
  destination: string;
  routingHints: HopHint[][];
  features: Set<InvoiceFeature>;
};

type PaymentResponse = {
  preimage: Buffer;
  feeMsat: number;
};

type Route = {
  ctlv: number;
  feesMsat: number;
};

interface LightningClient extends BalancerFetcher, IBaseClient {
  on(event: 'peer.online', listener: (publicKey: string) => void): void;
  emit(event: 'peer.online', publicKey: string): boolean;

  // TODO: get rid of LND types
  on(
    even: 'channel.active',
    listener: (channel: lndrpc.ChannelPoint.AsObject) => void,
  ): void;
  emit(even: 'channel.active', channel: lndrpc.ChannelPoint.AsObject): boolean;

  on(event: 'htlc.accepted', listener: (invoice: string) => void): void;
  emit(event: 'htlc.accepted', invoice: string): boolean;

  on(event: 'invoice.settled', listener: (invoice: string) => void): void;
  emit(event: 'invoice.settled', string: string): boolean;

  on(event: 'channel.backup', listener: (channelBackup: string) => void): void;
  emit(event: 'channel.backup', channelBackup: string): boolean;

  on(
    event: 'subscription.error',
    listener: (subscription?: string) => void,
  ): void;
  emit(event: 'subscription.error', subscription?: string): void;

  on(event: 'subscription.reconnected', listener: () => void): void;
  emit(event: 'subscription.reconnected'): void;

  on(event: 'status.changed', listener: (status: ClientStatus) => void): void;
  emit(event: 'status.changed', status: ClientStatus): void;

  symbol: string;

  isConnected(): boolean;
  setClientStatus(status: ClientStatus): void;

  raceCall<T>(
    promise: (() => Promise<T>) | Promise<T>,
    raceHandler: (reason?: any) => void,
    raceTimeout: number,
  ): Promise<T>;

  connect(startSubscriptions?: boolean): Promise<boolean>;
  disconnect(): void;

  getInfo(): Promise<NodeInfo>;
  listChannels(
    activeOnly?: boolean,
    privateOnly?: boolean,
  ): Promise<ChannelInfo[]>;

  addHoldInvoice(
    value: number,
    preimageHash: Buffer,
    cltvExpiry?: number,
    expiry?: number,
    memo?: string,
    routingHints?: HopHint[][],
  ): Promise<string>;
  lookupHoldInvoice(preimageHash: Buffer): Promise<Invoice>;
  settleHoldInvoice(preimage: Buffer): Promise<void>;
  cancelHoldInvoice(preimageHash: Buffer): Promise<void>;

  subscribeSingleInvoice(preimageHash: Buffer): void;

  decodeInvoice(invoice: string): Promise<DecodedInvoice>;

  sendPayment(
    invoice: string,
    cltvDelta?: number,
    outgoingChannelId?: string,
  ): Promise<PaymentResponse>;
  queryRoutes(
    destination: string,
    amt: number,
    cltvLimit?: number,
    finalCltvDelta?: number,
    routingHints?: HopHint[][],
  ): Promise<Route[]>;
}

interface RoutingHintsProvider {
  stop(): void;
  routingHints(nodeId: string): Promise<HopHint[][]>;
}

const calculatePaymentFee = (
  invoice: string,
  maxRatio: number,
  minFee: number,
): number => {
  const invoiceAmt = bolt11.decode(invoice).satoshis || 0;
  return Math.ceil(Math.max(invoiceAmt * maxRatio, minFee));
};

export {
  Htlc,
  Route,
  HopHint,
  Invoice,
  NodeInfo,
  HtlcState,
  ChannelInfo,
  InvoiceState,
  InvoiceFeature,
  DecodedInvoice,
  LightningClient,
  PaymentResponse,
  calculatePaymentFee,
  RoutingHintsProvider,
};
