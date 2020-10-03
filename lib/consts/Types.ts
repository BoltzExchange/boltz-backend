import { BigNumber } from 'ethers';
import { Ierc20 } from 'boltz-core/typechain/Ierc20';

export type EtherSwapValues = {
  preimageHash: Buffer;
  amount: BigNumber;
  claimAddress: string;
  refundAddress: string;
  timelock: number;
};

export type ERC20SwapValues = EtherSwapValues & {
  tokenAddress: string;
};

export type Error = {
  message: string;
  code: string;
};

export type Token = {
  symbol: string;

  contract: Ierc20;
  decimals: number;
};

export type PairConfig = {
  base: string;
  quote: string;

  // Percentage of the amount that will be charged as fee
  fee?: number;

  // If there is a hardcoded rate the APIs of the exchanges will not be queried
  rate?: number;

  // The timeout of the swaps on this pair in minutes
  timeoutDelta?: number;
};

/**
 * There are multiple levels of verbosity that can be used when querying blocks from Bitcoin Core:
 * - 0: returns the whole block hex encoded (not used by Boltz currently)
 * - 1: returns a JSON object with all keys of BlockWithoutTransactions and an array of the IDs of the included transactions called "tx"
 * - 2: similar to "1" but "tx" is not an array of the IDs of the transactions but an array of the type Transaction
 *
 * This type is used as base for the return types of verbosity "1" and "2"
 */
type BlockWithoutTransactions = {
  hash: string;
  confirmations: number;
  strippedsize: number;
  size: number;
  weight: number;
  height: number;
  version: number;
  versionHex: string;
  merkleroot: string;
  time: number;
  nonce: number;
  bits: string;
  difficulty: number;
  chainwork: string;
  nTx: number;
  previousblockhash: string;
};

export type Block = BlockWithoutTransactions & {
  tx: string[];
};

export type BlockVerbose = BlockWithoutTransactions & {
  tx: Transaction[];
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

export type ScriptSig = {
  asm: string;
  hex: string;
};

export type Input = {
  txid: string;
  vout: number;
  scriptSig: ScriptSig;
  txinwitness: string[];
  sequence: number;
};

export type ScriptPubKey = {
  asm: string;
  hex: string;
  reqSigs: number;
  type: string;
  addresses: string;
};

export type Output = {
  value: number;
  n: number;
  scriptPubKey: ScriptPubKey;
};

export type Transaction = {
  txid: string;
  hash: string;
  version: number;
  size: number;
  vsize: number;
  weight: number;
  locktime: number;
  vin: Input[];
  vout: Output[];
  hex: string;
};

export type RawTransaction = Transaction & {
  blockhash?: string;
  confirmations: number;
  time: number;
  blocktime: number;
};

export type NetworkInfo = {
  version: number;
  subversion: string;
  protocolversion: number;
  localservices: number;
  localrelay: boolean;
  timeoffset: number;
  networkactive: boolean;
  connections: number;
  relayfee: number;
  incrementalfee: number;
};

export type UnspentUtxo = {
  txid: string;
  vout: number;
  address: string;
  label: string;
  scriptPubKey: string;
  amount: number;
  confirmations: number;
  redeemScript: string;
  witnessScript: string;
  spendable: boolean;
  solvable: boolean;
  desc?: string;
  safe: boolean;
};
