import ops from '@boltz/bitcoin-ops';
import { mnemonicToSeedSync } from 'bip39';
import { crypto } from 'bitcoinjs-lib';
import { toXOnly } from 'bitcoinjs-lib/src/psbt/bip371';
import { Scripts } from 'boltz-core';
import Networks from 'boltz-core/dist/lib/liquid/consts/Networks';
import { address } from 'liquidjs-lib';
import { SLIP77Factory } from 'slip77';
import * as ecc from 'tiny-secp256k1';
import Logger from '../../../lib/Logger';
import { getHexBuffer } from '../../../lib/Utils';
import WalletLiquid from '../../../lib/wallet/WalletLiquid';
import type WalletProviderInterface from '../../../lib/wallet/providers/WalletProviderInterface';

describe('WalletLiquid', () => {
  const slip77 = SLIP77Factory(ecc);
  const mnemonic =
    'test test test test test test test test test test test junk';

  const provider = {
    serviceName: () => 'Elements',
  } as WalletProviderInterface;

  const wallet = new WalletLiquid(
    Logger.disabledLogger,
    provider,
    slip77.fromSeed(mnemonicToSeedSync(mnemonic)),
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
    ${'P2PKH'}  | ${false}    | ${Scripts.p2pkhOutput(crypto.hash160(publicKey))}
    ${'P2PKH'}  | ${true}     | ${Scripts.p2pkhOutput(crypto.hash160(publicKey))}
    ${'P2SH'}   | ${false}    | ${Scripts.p2shOutput(publicKey)}
    ${'P2SH'}   | ${true}     | ${Scripts.p2shOutput(publicKey)}
    ${'P2WPKH'} | ${false}    | ${Scripts.p2wpkhOutput(crypto.hash160(publicKey))}
    ${'P2WPKH'} | ${true}     | ${Scripts.p2wpkhOutput(crypto.hash160(publicKey))}
    ${'P2WSH'}  | ${false}    | ${Scripts.p2wshOutput(publicKey)}
    ${'P2WSH'}  | ${true}     | ${Scripts.p2wshOutput(publicKey)}
    ${'P2TR'}   | ${false}    | ${Scripts.p2trOutput(toXOnly(publicKey))}
    ${'P2TR'}   | ${true}     | ${Scripts.p2trOutput(toXOnly(publicKey))}
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
    const outputScript = Buffer.from([ops.OP_RETURN, 1, 2, 3]);
    expect(wallet.encodeAddress(outputScript, true)).toEqual('');
    expect(wallet.encodeAddress(outputScript, false)).toEqual('');
  });

  test('should blind by default', () => {
    const res = wallet.encodeAddress(Scripts.p2trOutput(toXOnly(publicKey)));
    expect(res.startsWith(Networks.liquidRegtest.blech32)).toEqual(true);
  });
});
