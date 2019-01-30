export enum ErrorCodePrefix {
  General = 0,
  Grpc = 1,
  Service = 2,
  Wallet = 3,
  Chain = 4,
  Lnd = 5,
  Swap = 6,
}

export enum Symbol {
  BTC = 'BTC',
  LTC = 'LTC',
}

export enum Chain {
  BTC = 'bitcoin',
  LTC = 'litecoin',
}

export enum Network {
  Mainnet = 'mainnet',
  Testnet = 'testnet',
  Simnet = 'simnet',
  Regtest = 'regtest',
}

export enum ClientStatus {
  Disconnected,
  Connected,
  OutOfSync,
}
