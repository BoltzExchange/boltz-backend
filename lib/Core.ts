import ChainClient from './chain/ChainClient';
import { CurrencyType } from './consts/Enums';
import { Network as NetworkLiquid } from 'liquidjs-lib/src/networks';
import { address, Network, Transaction, TxOutput } from 'bitcoinjs-lib';
import {
  confidential,
  address as addressLiquid,
  TxOutput as TxOutputLiquid,
  Transaction as TransactionLiquid,
} from 'liquidjs-lib';
import {
  calculateLiquidTransactionFee,
  calculateUtxoTransactionFee,
} from './Utils';
import {
  ClaimDetails as ClaimDetailsBitcoin,
  RefundDetails as RefundDetailsBitcoin,
} from 'boltz-core/dist/lib/consts/Types';
import {
  ClaimDetails as ClaimDetailsLiquid,
  RefundDetails as RefundDetailsLiquid,
} from 'boltz-core-liquid/dist/lib/consts/Types';
import {
  constructClaimTransaction as constructClaimTransactionBitcoin,
  constructRefundTransaction as constructRefundTransactionBitcoin,
  detectPreimage as detectPreimageBitcoin,
  detectSwap as detectSwapBitcoin,
} from 'boltz-core';
import {
  constructClaimTransaction as constructClaimTransactionLiquid,
  constructRefundTransaction as constructRefundTransactionLiquid,
  detectPreimage as detectPreimageLiquid,
  detectSwap as detectSwapLiquid,
} from 'boltz-core-liquid';

export const parseTransaction = (
  type: CurrencyType,
  rawTx: string | Buffer,
): Transaction | TransactionLiquid => {
  if (rawTx instanceof Buffer) {
    return isBitcoin(type)
      ? Transaction.fromBuffer(rawTx)
      : TransactionLiquid.fromBuffer(rawTx);
  } else {
    return isBitcoin(type)
      ? Transaction.fromHex(rawTx)
      : TransactionLiquid.fromHex(rawTx);
  }
};

export const fromOutputScript = (
  type: CurrencyType,
  outputScript: Buffer,
  network: Network | NetworkLiquid,
) => {
  return isBitcoin(type)
    ? address.fromOutputScript(outputScript, network)
    : addressLiquid.fromOutputScript(outputScript, network as NetworkLiquid);
};

export const toOutputScript = (
  type: CurrencyType,
  toDecode: string,
  network: Network | NetworkLiquid,
) => {
  return isBitcoin(type)
    ? address.toOutputScript(toDecode, network)
    : addressLiquid.toOutputScript(toDecode, network as NetworkLiquid);
};

export const getOutputValue = (
  type: CurrencyType,
  output: TxOutput | TxOutputLiquid,
) => {
  return isBitcoin(type)
    ? (output.value as number)
    : confidential.confidentialValueToSatoshi(output.value as Buffer);
};

export const detectSwap = (
  type: CurrencyType,
  redeemScript: Buffer,
  transaction: Transaction | TransactionLiquid,
) => {
  return isBitcoin(type)
    ? detectSwapBitcoin(redeemScript, transaction as Transaction)
    : detectSwapLiquid(redeemScript, transaction as TransactionLiquid);
};

export const detectPreimage = (
  type: CurrencyType,
  vin: number,
  transaction: Transaction | TransactionLiquid,
) => {
  return isBitcoin(type)
    ? detectPreimageBitcoin(vin, transaction as Transaction)
    : detectPreimageLiquid(vin, transaction as TransactionLiquid);
};

export const constructClaimTransaction = (
  type: CurrencyType,
  claimDetails: ClaimDetailsBitcoin[] | ClaimDetailsLiquid[],
  destinationAddress: Buffer,
  feePerVbyte: number,
  assetHash?: string,
) => {
  return isBitcoin(type)
    ? constructClaimTransactionBitcoin(
        claimDetails as ClaimDetailsBitcoin[],
        destinationAddress,
        feePerVbyte,
        true,
      )
    : constructClaimTransactionLiquid(
        claimDetails as ClaimDetailsLiquid[],
        destinationAddress,
        feePerVbyte,
        true,
        assetHash,
      );
};

export const constructRefundTransaction = (
  type: CurrencyType,
  refundDetails: RefundDetailsBitcoin[] | RefundDetailsLiquid[],
  destinationAddress: Buffer,
  timeoutBlockHeight: number,
  feePerVbyte: number,
  assetHash?: string,
) => {
  return isBitcoin(type)
    ? constructRefundTransactionBitcoin(
        refundDetails as RefundDetailsBitcoin[],
        destinationAddress,
        timeoutBlockHeight,
        feePerVbyte,
        true,
      )
    : constructRefundTransactionLiquid(
        refundDetails as RefundDetailsLiquid[],
        destinationAddress,
        timeoutBlockHeight,
        feePerVbyte,
        true,
        assetHash,
      );
};

export const calculateTransactionFee = async (
  chainClient: ChainClient,
  transaction: Transaction | TransactionLiquid,
) => {
  return transaction instanceof Transaction
    ? calculateUtxoTransactionFee(chainClient, transaction as Transaction)
    : calculateLiquidTransactionFee(transaction as TransactionLiquid);
};

export const getAssetHash = (
  type: CurrencyType,
  network: Network,
): string | undefined => {
  return isBitcoin(type) ? undefined : (network as NetworkLiquid).assetHash;
};

const isBitcoin = (type: CurrencyType) => type === CurrencyType.BitcoinLike;

export {
  ClaimDetailsBitcoin,
  ClaimDetailsLiquid,
  RefundDetailsBitcoin,
  RefundDetailsLiquid,
};
