export enum ErrorCodePrefix {
  General = 0,
  Grpc = 1,
  Service = 2,
  Wallet = 3,
  Chain = 4,
  Lnd = 5,
  Swap = 6,
  Rates = 7,
  Bakcup = 8,
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
  InvoicePaid = 'invoice.paid',
  InvoiceSettled = 'invoice.settled',
  InvoiceFailedToPay = 'invoice.failedToPay',

  // Means that Boltz is waiting for the user to send a transaction
  TransactionWaiting = 'transaction.waiting',

  TransactionMempool = 'transaction.mempool',
  TransactionClaimed = 'transaction.claimed',
  TransactionConfirmed = 'transaction.confirmed',

  // Transaction events with the prefix "boltz" are related to transactions sent by Boltz
  BoltzTransactionMempool = 'boltz.transaction.mempool',
  BoltzTransactionConfirmed = 'boltz.transaction.confirmed',
  BoltzTransactionRefunded = 'boltz.transaction.refunded',

  SwapAborted = 'swap.aborted',
  SwapExpired = 'swap.expired',
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

  ChainToChain = 'chaintochain',
}
