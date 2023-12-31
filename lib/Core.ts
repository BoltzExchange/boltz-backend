import * as ecc from 'tiny-secp256k1';
import { randomBytes } from 'crypto';
import { BIP32Interface } from 'bip32';
import { ECPairInterface } from 'ecpair';
import zkpInit from '@vulpemventures/secp256k1-zkp';
import { Network as LiquidNetwork } from 'liquidjs-lib/src/networks';
import zkpMusigInit, { Secp256k1ZKP } from '@michael1011/secp256k1-zkp';
import {
  address,
  initEccLib,
  Network,
  script,
  Transaction,
  TxOutput,
} from 'bitcoinjs-lib';
import {
  address as addressLiquid,
  confidential,
  Transaction as LiquidTransaction,
  TxOutput as TxOutputLiquid,
} from 'liquidjs-lib';
import {
  ClaimDetails,
  constructClaimTransaction as constructClaimTransactionBitcoin,
  constructRefundTransaction as constructRefundTransactionBitcoin,
  init,
  Musig,
  RefundDetails,
  TaprootUtils,
  targetFee,
  Types,
} from 'boltz-core';
import {
  constructClaimTransaction as constructClaimTransactionLiquid,
  constructRefundTransaction as constructRefundTransactionLiquid,
  init as initLiquid,
  LiquidClaimDetails,
  LiquidRefundDetails,
  TaprootUtils as TaprootUtilsLiquid,
} from 'boltz-core/dist/lib/liquid';
import Wallet from './wallet/Wallet';
import { ECPair } from './ECPairHelper';
import ChainClient from './chain/ChainClient';
import { CurrencyType } from './consts/Enums';
import WalletLiquid from './wallet/WalletLiquid';
import { Currency } from './wallet/WalletManager';
import { liquidSymbol } from './consts/LiquidTypes';
import {
  calculateLiquidTransactionFee,
  calculateUtxoTransactionFee,
  getHexBuffer,
  getHexString,
  reverseBuffer,
} from './Utils';

type UnblindedOutput = Omit<TxOutputLiquid, 'value'> & {
  value: number;
  isLbtc: boolean;
};

export let zkpMusig: Secp256k1ZKP;
let confi: confidential.Confidential;

export const setup = async () => {
  init(ecc);
  initEccLib(ecc);

  const zkp = await zkpInit();
  confi = new confidential.Confidential(zkp);

  zkpMusig = await zkpMusigInit();
  initLiquid(zkpMusig);
};

export const parseTransaction = (
  type: CurrencyType,
  rawTx: string | Buffer,
): Transaction | LiquidTransaction => {
  if (rawTx instanceof Buffer) {
    return isBitcoin(type)
      ? Transaction.fromBuffer(rawTx)
      : LiquidTransaction.fromBuffer(rawTx);
  } else {
    return isBitcoin(type)
      ? Transaction.fromHex(rawTx)
      : LiquidTransaction.fromHex(rawTx);
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

export const unblindOutput = (
  wallet: Wallet,
  output: TxOutputLiquid,
  blindingKey?: Buffer,
): UnblindedOutput => {
  let value = 0;
  let asset = output.asset;

  if (output.rangeProof?.length !== 0) {
    if (blindingKey !== undefined) {
      const unblinded = confi.unblindOutputWithKey(output, blindingKey!);

      value = Number(unblinded.value);
      asset = unblinded.asset;
    }
  } else {
    value = confidential.confidentialValueToSatoshi(output.value as Buffer);
    asset = output.asset;

    // Remove the un-confidential prefix
    asset = asset.slice(1, asset.length);
  }

  asset = reverseBuffer(asset);

  return {
    ...output,
    value: value,
    asset: asset,
    isLbtc: asset.equals(
      getHexBuffer((wallet.network as LiquidNetwork).assetHash),
    ),
  };
};

export const getOutputValue = (
  wallet: Wallet,
  output: TxOutput | TxOutputLiquid,
) => {
  if (isBitcoin(wallet.type)) {
    return output.value as number;
  }

  const unblinded = unblindOutput(
    wallet,
    output as TxOutputLiquid,
    (wallet as WalletLiquid).deriveBlindingKeyFromScript(output.script)
      .privateKey!,
  );

  return unblinded.isLbtc ? unblinded.value : 0;
};

export const constructClaimTransaction = (
  wallet: Wallet,
  claimDetails: ClaimDetails[] | LiquidClaimDetails[],
  destinationAddress: string,
  feePerVbyte: number,
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
      wallet.network as LiquidNetwork,
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
      wallet.network as LiquidNetwork,
      decodedAddress.blindingKey,
    ),
  );
};

export const calculateTransactionFee = async (
  chainClient: ChainClient,
  transaction: Transaction | LiquidTransaction,
) => {
  return chainClient.symbol !== liquidSymbol
    ? calculateUtxoTransactionFee(chainClient, transaction as Transaction)
    : calculateLiquidTransactionFee(transaction as LiquidTransaction);
};

export const extractRefundPublicKeyFromSwapTree = (
  swapTree: Types.SwapTree,
): Buffer => script.decompile(swapTree.refundLeaf.output)![0] as Buffer;

export const extractClaimPublicKeyFromSwapTree = (
  swapTree: Types.SwapTree,
): Buffer => script.decompile(swapTree.claimLeaf.output)![3] as Buffer;

export const createMusig = (
  ourKeys: ECPairInterface | BIP32Interface,
  refundPublicKey: Buffer,
) =>
  new Musig(
    zkpMusig,
    ECPair.fromPrivateKey(ourKeys.privateKey!),
    randomBytes(32),
    [ourKeys.publicKey, refundPublicKey],
  );

export const tweakMusig = (
  type: CurrencyType,
  musig: Musig,
  swapTree: Types.SwapTree,
) =>
  (isBitcoin(type) ? TaprootUtils : TaprootUtilsLiquid).tweakMusig(
    musig,
    swapTree.tree,
  );

export const hashForWitnessV1 = async (
  currency: Currency,
  tx: Transaction | LiquidTransaction,
  index: number,
  leafHash?: Buffer,
  hashType: number = Transaction.SIGHASH_DEFAULT,
): Promise<Buffer> => {
  const inputs = await Promise.all(
    tx.ins.map(async (input) => {
      const inTx = parseTransaction(
        currency.type,
        await currency.chainClient!.getRawTransaction(
          getHexString(reverseBuffer(input.hash)),
        ),
      );
      return inTx.outs[input.index];
    }),
  );

  if (isBitcoin(currency.type)) {
    return (tx as Transaction).hashForWitnessV1(
      index,
      inputs.map((input) => input.script),
      inputs.map((input) => input.value as number),
      hashType,
      leafHash,
    );
  }

  return (tx as LiquidTransaction).hashForWitnessV1(
    index,
    inputs.map((input) => input.script),
    inputs.map((input) => ({
      asset: (input as TxOutputLiquid).asset,
      value: (input as TxOutputLiquid).value,
    })),
    hashType,
    (currency.network as LiquidNetwork).genesisBlockHash,
    leafHash,
  );
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

export {
  ClaimDetails,
  RefundDetails,
  LiquidClaimDetails,
  LiquidRefundDetails,
  UnblindedOutput,
};
