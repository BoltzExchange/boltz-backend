import { ripemd160 } from '@noble/hashes/legacy.js';
import { sha256 } from '@noble/hashes/sha2.js';
import { mnemonicToSeedSync } from '@scure/bip39';
import { OP } from '@scure/btc-signer/script.js';
import { Scripts } from 'boltz-core';
import { Networks } from 'boltz-core/liquid';
import { address } from 'liquidjs-lib';
import Logger from '../../../lib/Logger';
import { getHexBuffer } from '../../../lib/Utils';
import { slip77FromSeed } from '../../../lib/wallet/Slip77';
import WalletLiquid from '../../../lib/wallet/WalletLiquid';
import type WalletProviderInterface from '../../../lib/wallet/providers/WalletProviderInterface';

const hash160 = (data: Uint8Array): Uint8Array => ripemd160(sha256(data));
const toXOnly = (publicKey: Uint8Array): Uint8Array =>
  publicKey.subarray(1, 33);

describe('WalletLiquid', () => {
  const mnemonic =
    'test test test test test test test test test test test junk';

  const provider = {
    serviceName: () => 'Elements',
  } as WalletProviderInterface;

  const wallet = new WalletLiquid(
    Logger.disabledLogger,
    provider,
    slip77FromSeed(mnemonicToSeedSync(mnemonic)),
    Networks.liquidRegtest,
  );
  wallet.initKeyProvider('', {} as any);

  const publicKey = getHexBuffer(
    '03f0081c29011d63e741e4bfe2465a9e1bb203852d239f541d92dc8d9e40bdb3e6',
  );

  test.each`
    addr
    ${'AzpvTi6t8GTVxhg6tZ4vxNCdQKS9YYMMgJmxQAFYfhVvaogb6iVgTixvtv246tSbeM3zdgG1Z2ToreMt'}
    ${'CTEvqk9mbKSWnkPhF7DwqHf5X5Jx1Q25LXh4sprdqj4KRgMZTZaiGrhCCDfWrDyVqBbxUrhyCtLwgB7J'}
    ${'el1qqwxdjljvzdukcfxeammq6jktrvcurh329k7j208pm4rwe7anu2luhh7255kde06j2et2d0g5ym6yy949rx6rkp04xeav62vjp'}
  `('should derive blinding keys from script for address $addr', ({ addr }) => {
    const blindingKey = wallet.deriveBlindingKeyFromScript(
      address.toOutputScript(addr, Networks.liquidRegtest),
    );
    expect(blindingKey.privateKey).toMatchSnapshot();
  });

  test.each`
    name        | shouldBlind | outputScript
    ${'P2PKH'}  | ${false}    | ${Buffer.from(Scripts.p2pkhOutput(hash160(publicKey)))}
    ${'P2PKH'}  | ${true}     | ${Buffer.from(Scripts.p2pkhOutput(hash160(publicKey)))}
    ${'P2SH'}   | ${false}    | ${Buffer.from(Scripts.p2shOutput(publicKey))}
    ${'P2SH'}   | ${true}     | ${Buffer.from(Scripts.p2shOutput(publicKey))}
    ${'P2WPKH'} | ${false}    | ${Buffer.from(Scripts.p2wpkhOutput(hash160(publicKey)))}
    ${'P2WPKH'} | ${true}     | ${Buffer.from(Scripts.p2wpkhOutput(hash160(publicKey)))}
    ${'P2WSH'}  | ${false}    | ${Buffer.from(Scripts.p2wshOutput(publicKey))}
    ${'P2WSH'}  | ${true}     | ${Buffer.from(Scripts.p2wshOutput(publicKey))}
    ${'P2TR'}   | ${false}    | ${Buffer.from(Scripts.p2trOutput(toXOnly(publicKey)))}
    ${'P2TR'}   | ${true}     | ${Buffer.from(Scripts.p2trOutput(toXOnly(publicKey)))}
  `(
    'should encode $name address (confidential: $shouldBlind)',
    ({ outputScript, shouldBlind }) => {
      expect(wallet.encodeAddress(outputScript, shouldBlind)).toMatchSnapshot();
    },
  );

  test('should return empty string as address for an empty script', () => {
    expect(wallet.encodeAddress(Buffer.alloc(0), true)).toEqual('');
    expect(wallet.encodeAddress(Buffer.alloc(0), false)).toEqual('');
  });

  test('should return empty string as address for scripts that cannot be encoded', () => {
    const outputScript = Buffer.from([OP.RETURN, 1, 2, 3]);
    expect(wallet.encodeAddress(outputScript, true)).toEqual('');
    expect(wallet.encodeAddress(outputScript, false)).toEqual('');
  });

  test('should blind by default', () => {
    const res = wallet.encodeAddress(
      Buffer.from(Scripts.p2trOutput(toXOnly(publicKey))),
    );
    expect(res.startsWith(Networks.liquidRegtest.blech32)).toEqual(true);
  });
});
