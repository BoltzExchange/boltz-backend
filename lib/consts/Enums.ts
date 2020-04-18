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

  InvoiceSet = 'invoice.set',
  InvoicePaid = 'invoice.paid',
  InvoiceSettled = 'invoice.settled',
  InvoiceFailedToPay = 'invoice.failedToPay',

  TransactionFailed = 'transaction.failed',
  TransactionMempool = 'transaction.mempool',
  TransactionClaimed = 'transaction.claimed',
  TransactionRefunded = 'transaction.refunded',
  TransactionConfirmed = 'transaction.confirmed',
}

export enum ChannelCreationType {
  Auto = 'auto',
  Create = 'create',
}

export enum ChannelCreationStatus {
  Created = 'created',
  Settled = 'settled',
}

export enum ServiceWarning {
  ReverseSwapsDisabled = 'reverse.swaps.disabled',
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
