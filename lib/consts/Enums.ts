export enum ErrorCodePrefix {
  General = 0,
  Grpc = 1,
  Service = 2,
  Wallet = 3,
  Chain = 4,
  Lightning = 5,
  Swap = 6,
  Rates = 7,
  Backup = 8,
  Ethereum = 9,
}

export enum ClientStatus {
  Disconnected = 'disconnected',
  Connected = 'connected',
  OutOfSync = 'out of sync',
}

export enum OrderSide {
  BUY,
  SELL,
}

export enum SwapUpdateEvent {
  SwapCreated = 'swap.created',
  SwapExpired = 'swap.expired',

  ChannelCreated = 'channel.created',

  InvoiceSet = 'invoice.set',
  InvoicePaid = 'invoice.paid',
  InvoicePending = 'invoice.pending',
  InvoiceSettled = 'invoice.settled',
  InvoiceFailedToPay = 'invoice.failedToPay',

  // When an onchain transaction:
  // - cannot be sent from the backend
  // - of the user is rejected by the backend
  TransactionFailed = 'transaction.failed',

  TransactionMempool = 'transaction.mempool',
  TransactionClaimPending = 'transaction.claim.pending',
  TransactionClaimed = 'transaction.claimed',
  TransactionRefunded = 'transaction.refunded',
  TransactionConfirmed = 'transaction.confirmed',
  TransactionLockupFailed = 'transaction.lockupFailed',
  TransactionZeroConfRejected = 'transaction.zeroconf.rejected',

  TransactionServerMempool = 'transaction.server.mempool',
  TransactionServerConfirmed = 'transaction.server.confirmed',

  // Events for the prepay miner fee Reverse Swap protocol
  MinerFeePaid = 'minerfee.paid',
  InvoiceExpired = 'invoice.expired',
}

export const SuccessSwapUpdateEvents = [
  SwapUpdateEvent.InvoiceSettled,
  SwapUpdateEvent.TransactionClaimed,
];

export const FailedSwapUpdateEvents = [
  SwapUpdateEvent.SwapExpired,
  SwapUpdateEvent.TransactionLockupFailed,
  SwapUpdateEvent.InvoiceFailedToPay,
  SwapUpdateEvent.TransactionRefunded,
];

export const FinalSwapEvents = [
  SwapUpdateEvent.SwapExpired,
  SwapUpdateEvent.InvoiceFailedToPay,
  SwapUpdateEvent.TransactionClaimed,
];
export const FinalReverseSwapEvents = [
  SwapUpdateEvent.SwapExpired,
  SwapUpdateEvent.InvoiceSettled,
  SwapUpdateEvent.TransactionFailed,
  SwapUpdateEvent.TransactionRefunded,
];
export const FinalChainSwapEvents = [
  SwapUpdateEvent.SwapExpired,
  SwapUpdateEvent.TransactionFailed,
  SwapUpdateEvent.TransactionClaimed,
  SwapUpdateEvent.TransactionRefunded,
];

export enum ChannelCreationType {
  Auto = 'auto',
  Create = 'create',
}

export enum ChannelCreationStatus {
  Attempted = 'attempted',
  Created = 'created',
  Settled = 'settled',
  Abandoned = 'abandoned',
}

export enum ServiceWarning {
  ReverseSwapsDisabled = 'reverse.swaps.disabled',
}

export enum ServiceInfo {
  PrepayMinerFee = 'prepay.minerfee',
}

export enum Network {
  Mainnet = 'mainnet',
  Testnet = 'testnet',
  Simnet = 'simnet',
  Regtest = 'regtest',
}

export enum SwapType {
  Submarine,
  ReverseSubmarine,
  Chain,
}

export const swapTypeToPrettyString = (type: SwapType): string => {
  switch (type) {
    case SwapType.Submarine:
      return 'Submarine';

    case SwapType.ReverseSubmarine:
      return 'Reverse';

    case SwapType.Chain:
      return 'Chain';
  }
};

export const swapTypeToString = (type: SwapType): string => {
  switch (type) {
    case SwapType.Submarine:
      return 'submarine';

    case SwapType.ReverseSubmarine:
      return 'reversesubmarine';

    case SwapType.Chain:
      return 'chain';
  }
};

export const stringToSwapType = (type: string): SwapType => {
  switch (type.toLowerCase()) {
    case 'submarine':
      return SwapType.Submarine;

    case 'reverse':
    case 'reversesubmarine':
      return SwapType.ReverseSubmarine;

    case 'chain':
      return SwapType.Chain;
  }

  throw `invalid swap type: ${type}`;
};

export enum BaseFeeType {
  NormalClaim,

  ReverseLockup,
  ReverseClaim,
}

export enum CurrencyType {
  BitcoinLike,
  Ether,
  ERC20,
  Liquid,
}

export enum SwapVersion {
  Legacy = 0,
  Taproot = 1,
}

export const swapVersionToString = (version: SwapVersion): string => {
  switch (version) {
    case SwapVersion.Taproot:
      return 'Taproot';
    default:
      return 'Legacy';
  }
};

export enum PercentageFeeType {
  Display,
  Calculation,
}
