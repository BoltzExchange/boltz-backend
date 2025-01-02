import { Network, Transaction } from 'bitcoinjs-lib';
import {
  Musig,
  OutputType,
  RefundDetails,
  TaprootUtils,
  Types,
  detectSwap,
} from 'boltz-core';
import {
  LiquidRefundDetails,
  TaprootUtils as LiquidTaprootDetails,
} from 'boltz-core/dist/lib/liquid';
import { ECPairInterface } from 'ecpair';
import { Network as LiquidNetwork } from 'liquidjs-lib/src/networks';
import { Transaction as LiquidTransaction } from 'liquidjs-lib/src/transaction';
import { constructClaimTransaction, setup } from '../Core';
import { getHexBuffer } from '../Utils';
import { CurrencyType } from '../consts/Enums';
import { PartialSignature } from './BoltzApiClient';
import { getWalletStub, musigFromExtractedKey } from './Command';

export const setupCooperativeTransaction = async (
  network: Network,
  currencyType: CurrencyType,
  swapTree: Types.SwapTree,
  keys: ECPairInterface,
  keyExtractionFuncs: ((tree: Types.SwapTree) => Buffer)[],
  lockupTx: Transaction | LiquidTransaction,
) => {
  await setup();

  const foundOutput = musigFromExtractedKey(
    currencyType,
    keys,
    keyExtractionFuncs.map((fn) => fn(swapTree)),
    swapTree,
    lockupTx,
  );
  if (foundOutput === undefined) {
    throw 'could not find swap output';
  }

  return {
    ...foundOutput,
    keys,
    network,
    currencyType,
  };
};

export const prepareCooperativeTransaction = <
  T extends Transaction | LiquidTransaction,
>(
  network: Network | LiquidNetwork,
  currencyType: CurrencyType,
  keys: ECPairInterface,
  tweakedKey: Buffer,
  lockupTx: T,
  destinationAddress: string,
  feePerVbyte: number,
  blindingKey?: string,
): { tx: T; details: RefundDetails | LiquidRefundDetails } => {
  const swapOutput = detectSwap(tweakedKey, lockupTx);
  if (swapOutput === undefined) {
    throw 'could not find swap output';
  }

  const details = {
    ...swapOutput,
    keys,
    txHash: lockupTx.getHash(),
    type: OutputType.Taproot,
    cooperative: true,
  } as any;
  const tx = constructClaimTransaction(
    getWalletStub(currencyType, network, destinationAddress, blindingKey),
    [details],
    destinationAddress,
    feePerVbyte,
  );

  return {
    details,
    tx: tx as T,
  };
};

export const finalizeCooperativeTransaction = <
  T extends Transaction | LiquidTransaction,
>(
  tx: T,
  musig: Musig,
  network: Network | LiquidNetwork,
  currencyType: CurrencyType,
  otherPublicKey: Buffer,
  details: RefundDetails | LiquidRefundDetails,
  partialSig: PartialSignature,
): T => {
  musig.aggregateNonces([[otherPublicKey, getHexBuffer(partialSig.pubNonce)]]);

  let hash: Buffer;
  if (currencyType === CurrencyType.BitcoinLike) {
    hash = TaprootUtils.hashForWitnessV1(
      [details] as RefundDetails[],
      tx as Transaction,
      0,
    );
  } else {
    hash = LiquidTaprootDetails.hashForWitnessV1(
      network as LiquidNetwork,
      [details] as LiquidRefundDetails[],
      tx as LiquidTransaction,
      0,
    );
  }

  musig.initializeSession(hash);
  musig.signPartial();
  musig.addPartial(otherPublicKey, getHexBuffer(partialSig.partialSignature));
  tx.setWitness(0, [musig.aggregatePartials()]);

  return tx;
};
