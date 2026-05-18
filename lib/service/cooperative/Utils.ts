import { sha256 } from '@noble/hashes/sha2.js';
import { Transaction } from '@scure/btc-signer';
import type { Types } from 'boltz-core';
import {
  createMusig,
  hashForWitnessV1,
  parseTransaction,
  tweakMusig,
} from '../../Core';
import { TxView } from '../../TxView';
import { getHexString } from '../../Utils';
import type Wallet from '../../wallet/Wallet';
import type { Currency } from '../../wallet/WalletManager';
import Errors from '../Errors';
import type { PartialSignature } from './MusigSigner';

export const isPreimageValid = (
  swap: { preimageHash: string },
  preimage: Buffer,
) =>
  preimage.length === 32 &&
  getHexString(sha256(preimage)) === swap.preimageHash;

export const createPartialSignature = async (
  currency: Currency,
  wallet: Wallet,
  swapTree: Types.SwapTree,
  keyIndex: number,
  theirPublicKey: Buffer,
  theirNonce: Buffer,
  rawTransaction: Buffer | string,
  vin: number,
): Promise<PartialSignature> => {
  const tx = parseTransaction(currency.type, rawTransaction);
  if (vin < 0 || TxView.of(tx).inputs.length <= vin) {
    throw Errors.INVALID_VIN();
  }

  const ourKeys = wallet.getKeysByIndex(keyIndex);
  const hash = await hashForWitnessV1(currency, tx, vin);

  const withNonce = tweakMusig(
    currency.type,
    createMusig(ourKeys, theirPublicKey),
    swapTree,
  )
    .message(hash)
    .generateNonce();

  const signed = withNonce
    .aggregateNonces([[theirPublicKey, theirNonce]])
    .initializeSession()
    .signPartial();

  return {
    signature: Buffer.from(signed.ourPartialSignature),
    pubNonce: Buffer.from(withNonce.publicNonce),
  };
};

export const checkArkTransaction = (
  transaction: string,
  checkpoint: string,
  lockupTransactionId?: string,
  lockupTransactionVout?: number,
) => {
  const checkpointPsbt = Transaction.fromPSBT(
    Buffer.from(checkpoint, 'base64'),
  );
  if (checkpointPsbt.inputsLength !== 1) {
    throw new Error('checkpoint must have exactly one input');
  }

  {
    const input = checkpointPsbt.getInput(0);
    if (
      input.txid === undefined ||
      getHexString(Buffer.from(input.txid)) !== lockupTransactionId ||
      input.index !== lockupTransactionVout
    ) {
      throw new Error('transaction is not for this swap');
    }
  }

  {
    const refundPsbt = Transaction.fromPSBT(Buffer.from(transaction, 'base64'));
    if (refundPsbt.inputsLength !== 1) {
      throw new Error('transaction must have exactly one input');
    }

    if (
      checkpointPsbt.id !==
      Buffer.from(refundPsbt.getInput(0).txid || '').toString('hex')
    ) {
      throw new Error('transaction is not for this swap');
    }
  }
};
