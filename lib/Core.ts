import Tracing from './Tracing';
import { SpanKind, context, trace } from '@opentelemetry/api';
import type { Secp256k1ZKP } from '@vulpemventures/secp256k1-zkp';
import zkpInit from '@vulpemventures/secp256k1-zkp';
import type { BIP32Interface } from 'bip32';
import type { Network, TxOutput } from 'bitcoinjs-lib';
import { Transaction, address, initEccLib } from 'bitcoinjs-lib';
import type { Types } from 'boltz-core';
import {
  ClaimDetails,
  Musig,
  OutputType,
  RefundDetails,
  SwapTreeSerializer,
  TaprootUtils,
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
import type { ECPairInterface } from 'ecpair';
import type { TxOutput as LiquidTxOutput } from 'liquidjs-lib';
import {
  Transaction as LiquidTransaction,
  confidential,
  address as liquidAddress,
} from 'liquidjs-lib';
import type { Network as LiquidNetwork } from 'liquidjs-lib/src/networks';
import * as ecc from 'tiny-secp256k1';
import { ECPair } from './ECPairHelper';
import {
  calculateLiquidTransactionFee,
  calculateUtxoTransactionFee,
  getHexBuffer,
  getHexString,
  reverseBuffer,
} from './Utils';
import type { IChainClient } from './chain/ChainClient';
import type { SomeTransaction } from './chain/ZmqClient';
import {
  CurrencyType,
  SwapType,
  SwapVersion,
  currencyTypeToString,
} from './consts/Enums';
import { liquidSymbol } from './consts/LiquidTypes';
import type ChainSwapData from './db/models/ChainSwapData';
import type Swap from './db/models/Swap';
import type SwapOutputType from './swap/SwapOutputType';
import type Wallet from './wallet/Wallet';
import type WalletLiquid from './wallet/WalletLiquid';
import type { Currency } from './wallet/WalletManager';

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

export const parseTransaction = <T extends Transaction | LiquidTransaction>(
  type: CurrencyType,
  rawTx: string | Buffer,
): T => {
  if (rawTx instanceof Buffer) {
    return isBitcoin(type)
      ? (Transaction.fromBuffer(rawTx) as T)
      : (LiquidTransaction.fromBuffer(rawTx) as T);
  } else {
    return isBitcoin(type)
      ? (Transaction.fromHex(rawTx as string) as T)
      : (LiquidTransaction.fromHex(rawTx as string) as T);
  }
};

export const fromOutputScript = (
  type: CurrencyType,
  outputScript: Buffer,
  network: Network | LiquidNetwork,
  blindingKey?: Buffer,
) => {
  const result = isBitcoin(type)
    ? address.fromOutputScript(outputScript, network)
    : liquidAddress.fromOutputScript(outputScript, network as LiquidNetwork);
  if (blindingKey && blindingKey.length > 0) {
    return liquidAddress.toConfidential(result, blindingKey);
  }
  return result;
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

export const getBlindingKey = (type: CurrencyType, address: string) => {
  if (type === CurrencyType.Liquid && liquidAddress.isConfidential(address)) {
    return liquidAddress.fromConfidential(address).blindingKey;
  }
  return undefined;
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
    asset = asset.subarray(1, asset.length);
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

  const blindingKey = (wallet as WalletLiquid).deriveBlindingKeyFromScript(
    output.script,
  );

  if (blindingKey.privateKey !== undefined) {
    try {
      const unblinded = unblindOutput(
        wallet,
        output as LiquidTxOutput,
        blindingKey.privateKey,
      );

      return unblinded.isLbtc ? unblinded.value : 0;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (e) {
      /* empty */
    }
  }

  return 0;
};

export const constructClaimDetails = (
  swapOutputType: SwapOutputType,
  wallet: Wallet,
  swap: Swap | ChainSwapData,
  transaction: Transaction | LiquidTransaction,
  preimage?: Buffer,
): ClaimDetails | LiquidClaimDetails => {
  const isSubmarine = swap.type === SwapType.Submarine;

  let lockupVout = isSubmarine
    ? (swap as Swap).lockupTransactionVout
    : (swap as ChainSwapData).transactionVout;

  // Compatibility mode with database schema version 0 in which this column didn't exist
  if (lockupVout === undefined) {
    lockupVout = detectSwap(
      getHexBuffer((swap as Swap).redeemScript!),
      transaction,
    )!.vout;
  }

  const output = transaction.outs[lockupVout!];
  const claimDetails = {
    ...output,
    preimage,
    txHash: transaction.getHash(),
    vout: lockupVout!,
    keys: wallet.getKeysByIndex(swap.keyIndex!),
  } as ClaimDetails | LiquidClaimDetails;

  switch (isSubmarine ? (swap as Swap).version : SwapVersion.Taproot) {
    case SwapVersion.Taproot: {
      claimDetails.type = OutputType.Taproot;
      claimDetails.cooperative = preimage === undefined;
      claimDetails.swapTree = SwapTreeSerializer.deserializeSwapTree(
        isSubmarine
          ? (swap as Swap).redeemScript!
          : (swap as ChainSwapData).swapTree!,
      );
      claimDetails.internalKey = createMusig(
        claimDetails.keys!,
        getHexBuffer(swap.theirPublicKey!),
      ).getAggregatedPublicKey();
      break;
    }

    default: {
      claimDetails.type = swapOutputType.get(wallet.type);
      claimDetails.redeemScript = getHexBuffer((swap as Swap).redeemScript!);
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
): SomeTransaction => {
  const span = Tracing.tracer.startSpan('constructClaimTransaction', {
    kind: SpanKind.INTERNAL,
    attributes: {
      type: currencyTypeToString(wallet.type),
      'claimDetails.length': claimDetails.length,
    },
  });
  const ctx = trace.setSpan(context.active(), span);

  try {
    return context.with(ctx, () => {
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

      const walletLiquid = wallet as WalletLiquid;
      const liquidDetails = populateBlindingKeys(
        walletLiquid,
        claimDetails as LiquidClaimDetails[],
      );
      const decodedAddress = liquidAddress.fromConfidential(destinationAddress);

      return targetFee(
        feePerVbyte,
        (fee) =>
          constructClaimTransactionLiquid(
            liquidDetails,
            decodedAddress.scriptPubKey!,
            fee,
            true,
            wallet.network as LiquidNetwork,
            decodedAddress.blindingKey,
          ),
        true,
      );
    });
  } finally {
    span.end();
  }
};

export const constructRefundTransaction = (
  wallet: Wallet,
  refundDetails: RefundDetails[] | LiquidRefundDetails[],
  destinationAddress: string,
  timeoutBlockHeight: number,
  feePerVbyte: number,
): SomeTransaction => {
  const span = Tracing.tracer.startSpan('constructRefundTransaction', {
    kind: SpanKind.INTERNAL,
    attributes: {
      type: currencyTypeToString(wallet.type),
      'refundDetails.length': refundDetails.length,
    },
  });
  const ctx = trace.setSpan(context.active(), span);

  try {
    return context.with(ctx, () => {
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

      const walletLiquid = wallet as WalletLiquid;
      const liquidDetails = populateBlindingKeys(
        walletLiquid,
        refundDetails as LiquidRefundDetails[],
      );
      const decodedAddress = liquidAddress.fromConfidential(destinationAddress);

      return targetFee(
        feePerVbyte,
        (fee) =>
          constructRefundTransactionLiquid(
            liquidDetails,
            decodedAddress.scriptPubKey!,
            timeoutBlockHeight,
            fee,
            true,
            wallet.network as LiquidNetwork,
            decodedAddress.blindingKey,
          ),
        true,
      );
    });
  } finally {
    span.end();
  }
};

export const calculateTransactionFee = async (
  chainClient: IChainClient,
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
    Buffer.from(ourKeys.publicKey),
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
