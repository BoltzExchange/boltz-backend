import { secp256k1 } from '@noble/curves/secp256k1.js';
import { randomBytes } from '@noble/hashes/utils.js';
import bolt11 from 'bolt11';
import { getHexString, getUnixTime } from '../../../lib/Utils';
import type { BitcoinNetwork } from '../../Networks';
import { regtest as regtestNetwork } from '../../Networks';

const invoiceSigningKeys = (() => {
  const privateKey = randomBytes(32);
  return {
    privateKey: Buffer.from(privateKey),
    publicKey: Buffer.from(secp256k1.getPublicKey(privateKey, true)),
  };
})();

export const createInvoice = (
  preimageHash?: string,
  timestamp?: number,
  expiry?: number,
  satoshis?: number,
  network: BitcoinNetwork = regtestNetwork,
): string => {
  const invoiceEncode = bolt11.encode({
    network: {
      ...network,
      validWitnessVersions: [0, 1],
    },
    satoshis: satoshis || 100,
    timestamp: timestamp || getUnixTime(),
    payeeNodeKey: getHexString(Buffer.from(invoiceSigningKeys.publicKey)),
    tags: [
      {
        data: preimageHash || getHexString(randomBytes(32)),
        tagName: 'payment_hash',
      },
      {
        data: getHexString(randomBytes(32)),
        tagName: 'payment_secret',
      },
      {
        data: expiry || 3600,
        tagName: 'expire_time',
      },
    ],
  });

  return bolt11.sign(invoiceEncode, Buffer.from(invoiceSigningKeys.privateKey!))
    .paymentRequest!;
};
