import { crypto } from 'bitcoinjs-lib';
import type { Types } from 'boltz-core';
import {
  createMusig,
  hashForWitnessV1,
  parseTransaction,
  tweakMusig,
} from '../../Core';
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
  getHexString(crypto.sha256(preimage)) === swap.preimageHash;

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
  if (vin < 0 || tx.ins.length <= vin) {
    throw Errors.INVALID_VIN();
  }

  const ourKeys = wallet.getKeysByIndex(keyIndex);

  const musig = createMusig(ourKeys, theirPublicKey);
  tweakMusig(currency.type, musig, swapTree);

  musig.aggregateNonces([[theirPublicKey, theirNonce]]);

  const hash = await hashForWitnessV1(currency, tx, vin);
  musig.initializeSession(hash);

  return {
    signature: Buffer.from(musig.signPartial()),
    pubNonce: Buffer.from(musig.getPublicNonce()),
  };
};
