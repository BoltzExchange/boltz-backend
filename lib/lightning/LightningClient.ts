import BaseClient from '../BaseClient';
import { decodeInvoiceAmount } from '../Utils';
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

type EventTypes = {
  'status.changed': ClientStatus;
  'peer.online': string;
  // TODO: get rid of LND types
  'channel.active': lndrpc.ChannelPoint.AsObject;
  'htlc.accepted': string;
  'invoice.settled': string;
  'channel.backup': string;
  'subscription.error': string | undefined;
  'subscription.reconnected': null;
};

interface LightningClient extends BalancerFetcher, BaseClient<EventTypes> {
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
  const invoiceAmt = decodeInvoiceAmount(invoice);
  return Math.ceil(Math.max(invoiceAmt * maxRatio, minFee));
};

export {
  Htlc,
  Route,
  HopHint,
  Invoice,
  NodeInfo,
  HtlcState,
  EventTypes,
  ChannelInfo,
  InvoiceState,
  InvoiceFeature,
  DecodedInvoice,
  LightningClient,
  PaymentResponse,
  calculatePaymentFee,
  RoutingHintsProvider,
};
