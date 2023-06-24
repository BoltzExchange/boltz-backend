import * as ecc from 'tiny-secp256k1';
import zkp from '@vulpemventures/secp256k1-zkp';
import { Network as LiquidNetwork } from 'liquidjs-lib/src/networks';
import {
  address,
  Network,
  TxOutput,
  initEccLib,
  Transaction,
} from 'bitcoinjs-lib';
import {
  confidential,
  address as addressLiquid,
  TxOutput as TxOutputLiquid,
  Transaction as TransactionLiquid,
} from 'liquidjs-lib';
import {
  ClaimDetails,
  RefundDetails,
  targetFee,
  constructClaimTransaction as constructClaimTransactionBitcoin,
  constructRefundTransaction as constructRefundTransactionBitcoin,
} from 'boltz-core';
import {
  init as initLiquid,
  LiquidClaimDetails,
  LiquidRefundDetails,
  constructClaimTransaction as constructClaimTransactionLiquid,
  constructRefundTransaction as constructRefundTransactionLiquid,
} from 'boltz-core/dist/lib/liquid';
import Wallet from './wallet/Wallet';
import ChainClient from './chain/ChainClient';
import { CurrencyType } from './consts/Enums';
import WalletLiquid from './wallet/WalletLiquid';
import { liquidSymbol } from './consts/LiquidTypes';
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
  initEccLib(ecc);
  initLiquid(zkpLib);
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
  network: Network | LiquidNetwork,
) => {
  return isBitcoin(type)
    ? address.fromOutputScript(outputScript, network)
    : addressLiquid.fromOutputScript(outputScript, network as LiquidNetwork);
};

export const toOutputScript = (
  type: CurrencyType,
  toDecode: string,
  network: Network | LiquidNetwork,
) => {
  return isBitcoin(type)
    ? address.toOutputScript(toDecode, network)
    : addressLiquid.toOutputScript(toDecode, network as LiquidNetwork);
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
    (wallet.network as LiquidNetwork).assetHash
  ) {
    return 0;
  }

  return value;
};

export const constructClaimTransaction = (
  wallet: Wallet,
  claimDetails: ClaimDetails[] | LiquidClaimDetails[],
  destinationAddress: string,
  feePerVbyte: number,
  assetHash?: string,
) => {
  if (isBitcoin(wallet.type)) {
    return targetFee(feePerVbyte, (fee) =>
      constructClaimTransactionBitcoin(
        claimDetails as ClaimDetails[],
        wallet.decodeAddress(destinationAddress),
        fee,
        true,
      ),
    );
  }

  const liquidDetails = populateBlindingKeys(
    wallet as WalletLiquid,
    claimDetails as LiquidClaimDetails[],
  );
  const decodedAddress = addressLiquid.fromConfidential(destinationAddress);

  return targetFee(feePerVbyte, (fee) =>
    constructClaimTransactionLiquid(
      liquidDetails,
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
  refundDetails: RefundDetails[] | LiquidRefundDetails[],
  destinationAddress: string,
  timeoutBlockHeight: number,
  feePerVbyte: number,
  assetHash?: string,
) => {
  if (isBitcoin(wallet.type)) {
    return targetFee(feePerVbyte, (fee) =>
      constructRefundTransactionBitcoin(
        refundDetails as RefundDetails[],
        wallet.decodeAddress(destinationAddress),
        timeoutBlockHeight,
        fee,
        true,
      ),
    );
  }

  const liquidDetails = populateBlindingKeys(
    wallet as WalletLiquid,
    refundDetails as LiquidRefundDetails[],
  );
  const decodedAddress = addressLiquid.fromConfidential(destinationAddress);

  return targetFee(feePerVbyte, (fee) =>
    constructRefundTransactionLiquid(
      liquidDetails,
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
  return chainClient.symbol !== liquidSymbol
    ? calculateUtxoTransactionFee(chainClient, transaction as Transaction)
    : calculateLiquidTransactionFee(transaction as TransactionLiquid);
};

export const getAssetHash = (
  type: CurrencyType,
  network: Network,
): string | undefined => {
  return isBitcoin(type) ? undefined : (network as LiquidNetwork).assetHash;
};

const isBitcoin = (type: CurrencyType) => type === CurrencyType.BitcoinLike;

const populateBlindingKeys = <
  T extends LiquidClaimDetails | LiquidRefundDetails,
>(
  wallet: WalletLiquid,
  utxos: T[],
): T[] => {
  for (const utxo of utxos) {
    utxo.blindingPrivateKey = wallet.deriveBlindingKeyFromScript(
      utxo.script,
    ).privateKey!;
  }

  return utxos;
};

export { ClaimDetails, RefundDetails, LiquidClaimDetails, LiquidRefundDetails };
