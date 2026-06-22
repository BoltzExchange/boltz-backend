import { secp256k1 } from '@noble/curves/secp256k1.js';
import { randomBytes } from 'crypto';
import { confidential, networks } from 'liquidjs-lib';
import type { TxOutput } from 'liquidjs-lib';
import { setup, unblindOutput, zkp } from '../../lib/Core';
import { getHexBuffer, reverseBuffer } from '../../lib/Utils';
import type Wallet from '../../lib/wallet/Wallet';

const lbtcAsset = reverseBuffer(getHexBuffer(networks.liquid.assetHash));
const otherAsset = Buffer.alloc(32, 0x07);

const rand32 = () => randomBytes(32);

describe('Core unblindOutput', () => {
  const liquidWallet = { network: networks.liquid } as unknown as Wallet;
  const script = getHexBuffer(`0014${'00'.repeat(20)}`);

  const blindingPrivateKey = rand32();
  const blindingPublicKey = Buffer.from(
    secp256k1.getPublicKey(blindingPrivateKey, true),
  );

  let confi: confidential.Confidential;

  const buildConfidentialOutput = (
    value: string,
    committedAsset: Buffer,
    messageAsset: Buffer,
  ): TxOutput => {
    const assetBlinder = rand32();
    const valueBlinder = rand32();

    const assetCommitment = confi.assetCommitment(committedAsset, assetBlinder);
    const valueCommitment = confi.valueCommitment(
      value,
      assetCommitment,
      valueBlinder,
    );

    const ephemeralKey = rand32();
    const ephemeralPublicKey = Buffer.from(
      secp256k1.getPublicKey(ephemeralKey, true),
    );
    const nonce = confi.nonceHash(blindingPublicKey, ephemeralKey);

    const rangeProof = confi.rangeProof(
      value,
      messageAsset,
      valueCommitment,
      assetCommitment,
      valueBlinder,
      assetBlinder,
      nonce,
      script,
    );

    return {
      asset: assetCommitment,
      value: valueCommitment,
      nonce: ephemeralPublicKey,
      script,
      rangeProof,
      surjectionProof: Buffer.alloc(0),
    } as unknown as TxOutput;
  };

  beforeAll(async () => {
    await setup();
    confi = new confidential.Confidential(zkp as never);
  });

  test('should unblind a confidential L-BTC output', () => {
    const output = buildConfidentialOutput('100000', lbtcAsset, lbtcAsset);

    const result = unblindOutput(liquidWallet, output, blindingPrivateKey);
    expect(result.value).toEqual(100000);
    expect(result.isLbtc).toEqual(true);
  });

  test('should not credit an output that cannot be unblinded', () => {
    const output = buildConfidentialOutput('100000', otherAsset, lbtcAsset);

    const result = unblindOutput(liquidWallet, output, blindingPrivateKey);
    expect(result.value).toEqual(0);
    expect(result.isLbtc).toEqual(false);
  });
});
