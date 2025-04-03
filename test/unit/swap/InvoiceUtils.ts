import { networks } from 'bitcoinjs-lib';
import bolt11 from 'bolt11';
import { randomBytes } from 'crypto';
import { ECPair } from '../../../lib/ECPairHelper';
import { getHexString, getUnixTime } from '../../../lib/Utils';

const invoiceSigningKeys = ECPair.makeRandom();

export const createInvoice = (
  preimageHash?: string,
  timestamp?: number,
  expiry?: number,
  satoshis?: number,
  network = networks.regtest,
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
        data: expiry || 3600,
        tagName: 'expire_time',
      },
    ],
  });

  return bolt11.sign(invoiceEncode, Buffer.from(invoiceSigningKeys.privateKey!))
    .paymentRequest!;
};
