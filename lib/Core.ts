import zkpInit, { Secp256k1ZKP } from '@vulpemventures/secp256k1-zkp';
import { BIP32Interface } from 'bip32';
import {
  Network,
  Transaction,
  TxOutput,
  address,
  initEccLib,
} from 'bitcoinjs-lib';
import {
  ClaimDetails,
  Musig,
  OutputType,
  RefundDetails,
  SwapTreeSerializer,
  TaprootUtils,
  Types,
  constructClaimTransaction as constructClaimTransactionBitcoin,
  constructRefundTransaction as constructRefundTransactionBitcoin,
  detectSwap,
  init,
  targetFee,
} from 'boltz-core';
import {
  LiquidClaimDetails,
  LiquidRefundDetails,
  TaprootUtils as TaprootUtilsLiquid,
  constructClaimTransaction as constructClaimTransactionLiquid,
  constructRefundTransaction as constructRefundTransactionLiquid,
  init as initLiquid,
} from 'boltz-core/dist/lib/liquid';
import { randomBytes } from 'crypto';
import { ECPairInterface } from 'ecpair';
import {
  Transaction as LiquidTransaction,
  TxOutput as LiquidTxOutput,
  confidential,
  address as liquidAddress,
} from 'liquidjs-lib';
import { Network as LiquidNetwork } from 'liquidjs-lib/src/networks';
import * as ecc from 'tiny-secp256k1';
import { ECPair } from './ECPairHelper';
import {
  calculateLiquidTransactionFee,
  calculateUtxoTransactionFee,
  getHexBuffer,
  getHexString,
  reverseBuffer,
} from './Utils';
import ChainClient from './chain/ChainClient';
import { CurrencyType, SwapVersion } from './consts/Enums';
import { liquidSymbol } from './consts/LiquidTypes';
import Swap from './db/models/Swap';
import SwapOutputType from './swap/SwapOutputType';
import Wallet from './wallet/Wallet';
import WalletLiquid from './wallet/WalletLiquid';
import { Currency } from './wallet/WalletManager';

type UnblindedOutput = Omit<LiquidTxOutput, 'value'> & {
  value: number;
  isLbtc: boolean;
};

export let zkp: Secp256k1ZKP;
let confi: confidential.Confidential;

export const setup = async () => {
  init(ecc);
  initEccLib(ecc);

  zkp = await zkpInit();
  confi = new confidential.Confidential(zkp as any);
  initLiquid(zkp);
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
    : liquidAddress.fromOutputScript(outputScript, network as LiquidNetwork);
};

export const toOutputScript = (
  type: CurrencyType,
  toDecode: string,
  network: Network | LiquidNetwork,
) => {
  return isBitcoin(type)
    ? address.toOutputScript(toDecode, network)
    : liquidAddress.toOutputScript(toDecode, network as LiquidNetwork);
};

export const unblindOutput = (
  wallet: Wallet,
  output: LiquidTxOutput,
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
  output: TxOutput | LiquidTxOutput,
) => {
  if (isBitcoin(wallet.type)) {
    return output.value as number;
  }

  const unblinded = unblindOutput(
    wallet,
    output as LiquidTxOutput,
    (wallet as WalletLiquid).deriveBlindingKeyFromScript(output.script)
      .privateKey!,
  );

  return unblinded.isLbtc ? unblinded.value : 0;
};

export const constructClaimDetails = (
  swapOutputType: SwapOutputType,
  wallet: Wallet,
  swap: Swap,
  transaction: Transaction | LiquidTransaction,
  preimage: Buffer,
  cooperative: boolean = false,
): ClaimDetails | LiquidClaimDetails => {
  // Compatibility mode with database schema version 0 in which this column didn't exist
  if (swap.lockupTransactionVout === undefined) {
    swap.lockupTransactionVout = detectSwap(
      getHexBuffer(swap.redeemScript!),
      transaction,
    )!.vout;
  }

  const output = transaction.outs[swap.lockupTransactionVout!];
  const claimDetails = {
    ...output,
    preimage,
    txHash: transaction.getHash(),
    vout: swap.lockupTransactionVout!,
    keys: wallet.getKeysByIndex(swap.keyIndex!),
  } as ClaimDetails | LiquidClaimDetails;

  switch (swap.version) {
    case SwapVersion.Taproot: {
      claimDetails.type = OutputType.Taproot;
      claimDetails.cooperative = cooperative;
      claimDetails.swapTree = SwapTreeSerializer.deserializeSwapTree(
        swap.redeemScript!,
      );
      claimDetails.internalKey = createMusig(
        claimDetails.keys!,
        getHexBuffer(swap.refundPublicKey!),
      ).getAggregatedPublicKey();
      break;
    }

    default: {
      claimDetails.type = swapOutputType.get(wallet.type);
      claimDetails.redeemScript = getHexBuffer(swap.redeemScript!);
      break;
    }
  }

  return claimDetails;
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
  const decodedAddress = liquidAddress.fromConfidential(destinationAddress);

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
  const decodedAddress = liquidAddress.fromConfidential(destinationAddress);

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

export const createMusig = (
  ourKeys: ECPairInterface | BIP32Interface,
  theirPublicKey: Buffer,
) =>
  new Musig(zkp, ECPair.fromPrivateKey(ourKeys.privateKey!), randomBytes(32), [
    ourKeys.publicKey,
    theirPublicKey,
  ]);

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
      asset: (input as LiquidTxOutput).asset,
      value: (input as LiquidTxOutput).value,
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
