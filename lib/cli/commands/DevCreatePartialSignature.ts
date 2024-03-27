import { Musig, SwapTreeSerializer } from 'boltz-core';
import { randomBytes } from 'crypto';
import { Arguments } from 'yargs';
import { setup, tweakMusig, zkp } from '../../Core';
import { ECPair } from '../../ECPairHelper';
import { getHexBuffer, getHexString, stringify } from '../../Utils';
import { CurrencyType } from '../../consts/Enums';
import { BuilderTypes } from '../BuilderComponents';

export const command =
  'dev-createpartial <ourPrivateKey> <theirPublicKey> <theirPubNonce> <hash> [tweak] [isLiquid]';

export const describe = 'creates a partial Musig2 signature';

export const builder = {
  ourPrivateKey: {
    type: 'string',
    describe: 'our private key',
  },
  theirPublicKey: {
    type: 'string',
    describe: 'their public key',
  },
  theirPubNonce: {
    type: 'string',
    describe: 'their public nonce',
  },
  hash: {
    type: 'string',
    describe: 'hash to sign',
  },
  tweak: {
    type: 'string',
    describe: 'SwapTree to tweak with',
  },
  isLiquid: {
    type: 'boolean',
    describe: 'whether the SwapTree is for Liquid',
  },
};

export const handler = async (
  argv: Arguments<BuilderTypes<typeof builder>>,
): Promise<void> => {
  await setup();

  const ourKeys = ECPair.fromPrivateKey(getHexBuffer(argv.ourPrivateKey));
  const musig = new Musig(zkp, ourKeys, randomBytes(32), [
    getHexBuffer(argv.theirPublicKey),
    ourKeys.publicKey,
  ]);

  if (argv.tweak !== undefined) {
    tweakMusig(
      argv.isLiquid ? CurrencyType.Liquid : CurrencyType.BitcoinLike,
      musig,
      SwapTreeSerializer.deserializeSwapTree(argv.tweak),
    );
  }

  musig.aggregateNonces([
    [getHexBuffer(argv.theirPublicKey), getHexBuffer(argv.theirPubNonce)],
  ]);
  musig.initializeSession(getHexBuffer(argv.hash));

  console.log(
    stringify({
      signature: getHexString(Buffer.from(musig.signPartial())),
      pubNonce: getHexString(Buffer.from(musig.getPublicNonce())),
    }),
  );
};
