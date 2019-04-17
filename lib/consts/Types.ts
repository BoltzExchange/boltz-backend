export type Error = {
  message: string;
  code: string;
};

export type WalletInfo = {
  derivationPath: string;
  highestUsedIndex: number;
  blockHeight: number;
};

export type Block = {
  hash: string;
  confirmations: number;
  strippedsize: number;
  size: number;
  weight: number;
  height: number;
  version: number;
  versionHex: string;
  merkleroot: string;
  tx: string[];
  time: number;
  nonce: number;
  bits: string;
  difficulty: number;
  chainwork: string;
  nTx: number;
  previousblockhash: string;
};

export type BlockchainInfo = {
  chain: string;
  blocks: number;
  headers: number;
  bestblockhash: string;
  difficulty: number;
  mediantime: number;
  verificationprogress: number;
  initialblockdownload: string;
  chainwork: string;
  size_on_disk: number;
  pruned: boolean;
};

export type RawTransaction = {
  txid: string;
  hash: string;
  version: number;
  size: number;
  vsize: number;
  weight: number;
  locktime: number;
  vin: any[];
  vout: any[];
  hex: string;
  blockhash?: string;
  confirmations: number;
  time: number;
  blocktime: number;
};
