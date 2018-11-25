import { Out } from 'bitcoinjs-lib';
import { OutputType } from '../proto/boltzrpc_pb';

export type Error = {
  message: string;
  code: string;
};

export type ScriptElement = Buffer | number;

export type TransactionOutput = {
  txHash: Buffer;
  vout: number;
  type: OutputType;
} & Out;

export type WalletInfo = {
  derivationPath: string;
  highestUsedIndex: number;
};
