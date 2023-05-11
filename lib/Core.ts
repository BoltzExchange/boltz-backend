import zkp from '@vulpemventures/secp256k1-zkp';
import { Network as NetworkLiquid } from 'liquidjs-lib/src/networks';
import { address, Network, Transaction, TxOutput } from 'bitcoinjs-lib';
import {
  address as addressLiquid,
  confidential,
  Transaction as TransactionLiquid,
  TxOutput as TxOutputLiquid,
} from 'liquidjs-lib';
import {
  ClaimDetails as ClaimDetailsBitcoin,
  RefundDetails as RefundDetailsBitcoin,
} from 'boltz-core/dist/lib/consts/Types';
import {
  ClaimDetails as ClaimDetailsLiquid,
  RefundDetails as RefundDetailsLiquid,
} from 'boltz-core-liquid-michael1011/dist/consts/Types';
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
  targetFee,
  prepareConfidential,
} from 'boltz-core-liquid-michael1011';
import Wallet from './wallet/Wallet';
import ChainClient from './chain/ChainClient';
import { CurrencyType } from './consts/Enums';
import WalletLiquid from './wallet/WalletLiquid';
import {
  getHexString,
  reverseBuffer,
  calculateUtxoTransactionFee,
  calculateLiquidTransactionFee,
} from './Utils';

let confi: confidential.Confidential;

export const setup = async () => {
  const zkpLib = await zkp();
  confi = new confidential.Confidential(zkpLib);
  prepareConfidential(zkpLib);
};

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
  wallet: Wallet,
  output: TxOutput | TxOutputLiquid,
) => {
  if (isBitcoin(wallet.type)) {
    return output.value as number;
  }

  let value: number;
  let asset: Buffer;

  if ((output as TxOutputLiquid).rangeProof?.length !== 0) {
    const unblinded = confi.unblindOutputWithKey(
      output as TxOutputLiquid,
      (wallet as WalletLiquid).deriveBlindingKeyFromScript(output.script)
        .privateKey!,
    );

    value = Number(unblinded.value);
    asset = unblinded.asset;
  } else {
    value = confidential.confidentialValueToSatoshi(output.value as Buffer);
    asset = (output as TxOutputLiquid).asset;
    // Remove the un-confidential prefix
    asset = asset.slice(1, asset.length);
  }

  if (
    getHexString(reverseBuffer(asset)) !==
    (wallet.network as NetworkLiquid).assetHash
  ) {
    return 0;
  }

  return value;
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
  wallet: Wallet,
  claimDetails: ClaimDetailsBitcoin[] | ClaimDetailsLiquid[],
  destinationAddress: string,
  feePerVbyte: number,
  assetHash?: string,
) => {
  if (isBitcoin(wallet.type)) {
    return constructClaimTransactionBitcoin(
      claimDetails as ClaimDetailsBitcoin[],
      wallet.decodeAddress(destinationAddress),
      feePerVbyte,
      true,
    );
  }

  const decodedAddress = addressLiquid.fromConfidential(destinationAddress);
  return targetFee(feePerVbyte, (fee) =>
    constructClaimTransactionLiquid(
      populateBlindingKeys(
        wallet as WalletLiquid,
        claimDetails as ClaimDetailsLiquid[],
      ),
      decodedAddress.scriptPubKey!,
      fee,
      true,
      assetHash,
      decodedAddress.blindingKey,
    ),
  );
};

export const constructRefundTransaction = (
  wallet: Wallet,
  refundDetails: RefundDetailsBitcoin[] | RefundDetailsLiquid[],
  destinationAddress: string,
  timeoutBlockHeight: number,
  feePerVbyte: number,
  assetHash?: string,
) => {
  if (isBitcoin(wallet.type)) {
    return constructRefundTransactionBitcoin(
      refundDetails as RefundDetailsBitcoin[],
      wallet.decodeAddress(destinationAddress),
      timeoutBlockHeight,
      feePerVbyte,
      true,
    );
  }

  const decodedAddress = addressLiquid.fromConfidential(destinationAddress);
  return targetFee(feePerVbyte, (fee) =>
    constructRefundTransactionLiquid(
      populateBlindingKeys(
        wallet as WalletLiquid,
        refundDetails as RefundDetailsLiquid[],
      ),
      decodedAddress.scriptPubKey!,
      timeoutBlockHeight,
      fee,
      true,
      assetHash,
      decodedAddress.blindingKey,
    ),
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

const populateBlindingKeys = <
  T extends ClaimDetailsLiquid | RefundDetailsLiquid,
>(
  wallet: WalletLiquid,
  utxos: T[],
): T[] => {
  for (const utxo of utxos) {
    utxo.blindingPrivKey = wallet.deriveBlindingKeyFromScript(
      utxo.script,
    ).privateKey!;
  }

  return utxos;
};

export {
  ClaimDetailsBitcoin,
  ClaimDetailsLiquid,
  RefundDetailsBitcoin,
  RefundDetailsLiquid,
};
