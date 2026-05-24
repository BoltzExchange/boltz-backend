import Tracing from './Tracing';
import { hexToBytes } from '@noble/hashes/utils.js';
import { SpanKind, context, trace } from '@opentelemetry/api';
import { Transaction as ScureTransaction, SigHash } from '@scure/btc-signer';
import type { Secp256k1ZKP } from '@vulpemventures/secp256k1-zkp';
import zkpInit from '@vulpemventures/secp256k1-zkp';
import type { ClaimDetails, RefundDetails, Types } from 'boltz-core';
import {
  Musig,
  OutputType,
  SwapTreeSerializer,
  TaprootUtils,
  constructClaimTransaction as constructClaimTransactionBitcoin,
  constructRefundTransaction as constructRefundTransactionBitcoin,
  detectSwap,
  targetFee,
} from 'boltz-core';
import {
  TaprootUtils as TaprootUtilsLiquid,
  constructClaimTransaction as constructClaimTransactionLiquid,
  constructRefundTransaction as constructRefundTransactionLiquid,
  init as initLiquid,
} from 'boltz-core/liquid';
import type {
  LiquidClaimDetails,
  LiquidRefundDetails,
} from 'boltz-core/liquid';
import type { TxOutput as LiquidTxOutput } from 'liquidjs-lib';
import {
  Transaction as LiquidTransaction,
  confidential,
  bip341 as liquidBip341,
} from 'liquidjs-lib';
import type { Network as LiquidNetwork } from 'liquidjs-lib/src/networks';
import type { ConstructedTransaction } from './TxView';
import { TxView } from './TxView';
import {
  calculateLiquidTransactionFee,
  calculateUtxoTransactionFee,
  getHexBuffer,
  reverseBuffer,
} from './Utils';
import type { IChainClient } from './chain/ChainClient';
import ElementsClient from './chain/ElementsClient';
import {
  CurrencyType,
  SwapType,
  SwapVersion,
  currencyTypeToString,
} from './consts/Enums';
import { liquidSymbol } from './consts/LiquidTypes';
import type ChainSwapData from './db/models/ChainSwapData';
import type Swap from './db/models/Swap';
import type Sidecar from './sidecar/Sidecar';
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
  zkp = await zkpInit();
  confi = new confidential.Confidential(zkp as any);
  initLiquid(zkp);
};

export const parseTransaction = <
  T extends ScureTransaction | LiquidTransaction,
>(
  type: CurrencyType,
  rawTx: string | Buffer | Uint8Array,
): T => {
  if (isBitcoin(type)) {
    const bytes =
      typeof rawTx === 'string' ? hexToBytes(rawTx) : Uint8Array.from(rawTx);
    return ScureTransaction.fromRaw(bytes, {
      allowUnknownOutputs: true,
      allowUnknownInputs: true,
      allowLegacyWitnessUtxo: true,
    }) as unknown as T;
  }

  if (rawTx instanceof Buffer) {
    return LiquidTransaction.fromBuffer(rawTx) as T;
  }

  if (typeof rawTx === 'string') {
    return LiquidTransaction.fromHex(rawTx) as T;
  }

  return LiquidTransaction.fromBuffer(Buffer.from(rawTx)) as T;
};

export const getBlindingKey = async (
  type: CurrencyType,
  address: string,
  sidecar: Sidecar,
): Promise<Buffer | undefined> => {
  if (type !== CurrencyType.Liquid) {
    return undefined;
  }
  return (await sidecar.decodeAddress(ElementsClient.symbol, address))
    .blindingPubkey;
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

export type BitcoinTxOutput = { script: Uint8Array; amount: bigint };

export const getOutputValue = (
  wallet: Wallet,
  output: BitcoinTxOutput | LiquidTxOutput,
) => {
  if (isBitcoin(wallet.type)) {
    return Number((output as BitcoinTxOutput).amount);
  }

  const liquidOutput = output as LiquidTxOutput;
  const blindingKey = (wallet as WalletLiquid).deriveBlindingKeyFromScript(
    Buffer.from(liquidOutput.script),
  );

  if (blindingKey.privateKey !== undefined) {
    try {
      const unblinded = unblindOutput(
        wallet,
        liquidOutput,
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

type ParsedOutput = {
  script: Buffer;
  amount?: bigint;
  liquid?: LiquidTxOutput;
};

const getOutputAt = (
  type: CurrencyType,
  transaction: ScureTransaction | LiquidTransaction,
  vout: number,
): ParsedOutput => {
  if (isBitcoin(type)) {
    const out = (transaction as ScureTransaction).getOutput(vout);
    return { script: Buffer.from(out.script!), amount: out.amount };
  }

  const out = (transaction as LiquidTransaction).outs[vout];
  return { script: Buffer.from(out.script), liquid: out };
};

export const constructClaimDetails = (
  swapOutputType: SwapOutputType,
  wallet: Wallet,
  swap: Swap | ChainSwapData,
  transaction: ScureTransaction | LiquidTransaction,
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

  const output = getOutputAt(wallet.type, transaction, lockupVout!);
  const keys = wallet.getKeysByIndex(swap.keyIndex!);
  const isLiquid = !isBitcoin(wallet.type);
  const base = {
    preimage,
    vout: lockupVout!,
    transactionId: TxView.of(transaction).id,
    privateKey: keys.privateKey!,
    script: output.script,
    ...(isLiquid
      ? {
          asset: output.liquid!.asset,
          value: output.liquid!.value,
          nonce: output.liquid!.nonce,
          rangeProof: output.liquid!.rangeProof,
          surjectionProof: output.liquid!.surjectionProof,
        }
      : {
          amount: output.amount!,
        }),
  };

  switch (isSubmarine ? (swap as Swap).version : SwapVersion.Taproot) {
    case SwapVersion.Taproot: {
      return {
        ...base,
        type: OutputType.Taproot,
        cooperative: preimage === undefined,
        swapTree: SwapTreeSerializer.deserializeSwapTree(
          isSubmarine
            ? (swap as Swap).redeemScript!
            : (swap as ChainSwapData).swapTree!,
        ) as Types.SwapTree,
        internalKey: Buffer.from(
          createMusig(keys, getHexBuffer(swap.theirPublicKey!)).aggPubkey,
        ),
      } as ClaimDetails | LiquidClaimDetails;
    }

    default: {
      return {
        ...base,
        type: swapOutputType.get(wallet.type),
        redeemScript: getHexBuffer((swap as Swap).redeemScript!),
      } as ClaimDetails | LiquidClaimDetails;
    }
  }
};

export const constructClaimTransaction = async (
  wallet: Wallet,
  claimDetails: ClaimDetails[] | LiquidClaimDetails[],
  destinationAddress: string,
  feePerVbyte: number,
): Promise<ConstructedTransaction> => {
  const span = Tracing.tracer.startSpan('constructClaimTransaction', {
    kind: SpanKind.INTERNAL,
    attributes: {
      type: currencyTypeToString(wallet.type),
      'claimDetails.length': claimDetails.length,
    },
  });
  const ctx = trace.setSpan(context.active(), span);

  try {
    if (isBitcoin(wallet.type)) {
      const destinationScript = await wallet.decodeAddress(destinationAddress);
      return context.with(ctx, () =>
        targetFee(feePerVbyte, (fee) =>
          constructClaimTransactionBitcoin(
            claimDetails as ClaimDetails[],
            destinationScript,
            fee,
            true,
          ),
        ),
      );
    }

    const walletLiquid = wallet as WalletLiquid;
    const liquidDetails = populateBlindingKeys(
      walletLiquid,
      claimDetails as LiquidClaimDetails[],
    );
    const decodedAddress = await walletLiquid.sidecar!.decodeAddress(
      ElementsClient.symbol,
      destinationAddress,
    );

    return context.with(ctx, () =>
      targetFee(
        feePerVbyte,
        (fee) =>
          constructClaimTransactionLiquid(
            liquidDetails,
            decodedAddress.scriptPubkey,
            fee,
            true,
            wallet.network as LiquidNetwork,
            decodedAddress.blindingPubkey,
          ),
        true,
      ),
    );
  } finally {
    span.end();
  }
};

export const constructRefundTransaction = async (
  wallet: Wallet,
  refundDetails: RefundDetails[] | LiquidRefundDetails[],
  destinationAddress: string,
  timeoutBlockHeight: number,
  feePerVbyte: number,
): Promise<ConstructedTransaction> => {
  const span = Tracing.tracer.startSpan('constructRefundTransaction', {
    kind: SpanKind.INTERNAL,
    attributes: {
      type: currencyTypeToString(wallet.type),
      'refundDetails.length': refundDetails.length,
    },
  });
  const ctx = trace.setSpan(context.active(), span);

  try {
    if (isBitcoin(wallet.type)) {
      const destinationScript = await wallet.decodeAddress(destinationAddress);
      return context.with(ctx, () =>
        targetFee(feePerVbyte, (fee) =>
          constructRefundTransactionBitcoin(
            refundDetails as RefundDetails[],
            destinationScript,
            timeoutBlockHeight,
            fee,
            true,
          ),
        ),
      );
    }

    const walletLiquid = wallet as WalletLiquid;
    const liquidDetails = populateBlindingKeys(
      walletLiquid,
      refundDetails as LiquidRefundDetails[],
    );
    const decodedAddress = await walletLiquid.sidecar!.decodeAddress(
      ElementsClient.symbol,
      destinationAddress,
    );

    return context.with(ctx, () =>
      targetFee(
        feePerVbyte,
        (fee) =>
          constructRefundTransactionLiquid(
            liquidDetails,
            decodedAddress.scriptPubkey,
            timeoutBlockHeight,
            fee,
            true,
            wallet.network as LiquidNetwork,
            decodedAddress.blindingPubkey,
          ),
        true,
      ),
    );
  } finally {
    span.end();
  }
};

export const calculateTransactionFee = async (
  chainClient: IChainClient,
  transaction: ConstructedTransaction,
) => {
  if (chainClient.symbol === liquidSymbol) {
    return calculateLiquidTransactionFee(transaction as LiquidTransaction);
  }

  return calculateUtxoTransactionFee(
    chainClient,
    transaction as ScureTransaction,
  );
};

export const createMusig = (
  ourKeys: { privateKey: Uint8Array; publicKey: Uint8Array },
  theirPublicKey: Uint8Array,
): Musig.MusigKeyAgg =>
  Musig.create(ourKeys.privateKey, [ourKeys.publicKey, theirPublicKey]);

export const tweakMusig = <T extends Musig.MusigKeyAgg>(
  type: CurrencyType,
  musig: T,
  swapTree: Types.SwapTree,
): T =>
  (isBitcoin(type) ? TaprootUtils : TaprootUtilsLiquid).tweakMusig(
    musig,
    swapTree.tree,
  ) as T;

const collectBitcoinInputs = async (
  currency: Currency,
  tx: ScureTransaction,
): Promise<{ script: Uint8Array; amount: bigint }[]> =>
  Promise.all(
    TxView.of(tx).inputs.map(async (input) => {
      const prevHex = await currency.chainClient!.getRawTransaction(input.txid);
      const prevTx = ScureTransaction.fromRaw(hexToBytes(prevHex), {
        allowUnknownOutputs: true,
        allowUnknownInputs: true,
        allowLegacyWitnessUtxo: true,
      });
      const prevOut = prevTx.getOutput(input.index);
      return { script: prevOut.script!, amount: prevOut.amount! };
    }),
  );

const collectLiquidInputs = async (
  currency: Currency,
  tx: LiquidTransaction,
): Promise<LiquidTxOutput[]> =>
  Promise.all(
    TxView.of(tx).inputs.map(async (input) => {
      const inTx = parseTransaction<LiquidTransaction>(
        currency.type,
        await currency.chainClient!.getRawTransaction(input.txid),
      );
      return inTx.outs[input.index];
    }),
  );

export const hashForWitnessV1 = async (
  currency: Currency,
  tx: ConstructedTransaction,
  index: number,
  leafScript?: Buffer,
  leafVer?: number,
  hashType: number = SigHash.DEFAULT,
): Promise<Buffer> => {
  if (isBitcoin(currency.type)) {
    const scureTx = tx as ScureTransaction;
    const inputs = await collectBitcoinInputs(currency, scureTx);
    return Buffer.from(
      scureTx.preimageWitnessV1(
        index,
        inputs.map((i) => i.script),
        hashType,
        inputs.map((i) => i.amount),
        undefined,
        leafScript,
        leafVer,
      ),
    );
  }

  const liquidTx = tx as LiquidTransaction;
  const inputs = await collectLiquidInputs(currency, liquidTx);
  const leafHash =
    leafScript !== undefined
      ? liquidBip341.tapLeafHash({
          scriptHex: leafScript.toString('hex'),
          version: leafVer,
        })
      : undefined;
  return liquidTx.hashForWitnessV1(
    index,
    inputs.map((input) => input.script),
    inputs.map((input) => ({
      asset: input.asset,
      value: input.value,
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

export type {
  ClaimDetails,
  RefundDetails,
  LiquidClaimDetails,
  LiquidRefundDetails,
  UnblindedOutput,
};
