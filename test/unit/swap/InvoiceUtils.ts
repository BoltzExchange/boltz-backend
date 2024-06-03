import bolt11 from '@boltz/bolt11';
import { randomBytes } from 'crypto';
import { ECPair } from '../../../lib/ECPairHelper';
import { getHexString, getUnixTime } from '../../../lib/Utils';

const invoiceSigningKeys = ECPair.makeRandom();

export const createInvoice = (
  preimageHash?: string,
  timestamp?: number,
  expiry?: number,
  satoshis?: number,
): string => {
  const invoiceEncode = bolt11.encode({
    satoshis: satoshis || 100,
    timestamp: timestamp || getUnixTime(),
    payeeNodeKey: getHexString(invoiceSigningKeys.publicKey),
    tags: [
      {
        data: preimageHash || getHexString(randomBytes(32)),
        tagName: 'payment_hash',
      },
      {
        data: expiry || 3600,
        tagName: 'expire_time',
      },
    ],
  });

  return bolt11.sign(invoiceEncode, invoiceSigningKeys.privateKey!)
    .paymentRequest!;
};
