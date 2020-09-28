export enum ErrorCodePrefix {
  General = 0,
  Grpc = 1,
  Service = 2,
  Wallet = 3,
  Chain = 4,
  Lnd = 5,
  Swap = 6,
  Rates = 7,
  Backup = 8,
  Ethereum = 9,
}

export enum ClientStatus {
  Disconnected,
  Connected,
  OutOfSync,
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

  TransactionFailed = 'transaction.failed',
  TransactionMempool = 'transaction.mempool',
  TransactionClaimed = 'transaction.claimed',
  TransactionRefunded = 'transaction.refunded',
  TransactionConfirmed = 'transaction.confirmed',
  TransactionLockupFailed = 'transaction.lockupFailed',
  TransactionZeroConfRejected = 'transaction.zeroconf.rejected',

  // Events for the prepay miner fee Reverse Swap protocol
  MinerFeePaid = 'minerfee.paid',
}

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
  Submarine = 'submarine',
  ReverseSubmarine = 'reversesubmarine',
}

export enum BaseFeeType {
  NormalClaim,

  ReverseLockup,
  ReverseClaim,
}

export enum CurrencyType {
  BitcoinLike,
  Ether,
  ERC20
}
