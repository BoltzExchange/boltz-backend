import { Networks as CoreNetworks } from 'boltz-core';
import { resolveBitcoinNetwork } from '../../../lib/consts/BitcoinNetworks';

describe('BitcoinNetworks', () => {
  describe('resolveBitcoinNetwork', () => {
    test.each`
      name         | expected
      ${'bitcoin'} | ${CoreNetworks.bitcoin}
      ${'testnet'} | ${CoreNetworks.testnet}
      ${'regtest'} | ${CoreNetworks.regtest}
    `(
      'resolves v4 canonical key $name to the boltz-core network',
      ({ name, expected }) => {
        expect(resolveBitcoinNetwork(name)).toBe(expected);
      },
    );

    test.each`
      legacy              | canonical
      ${'bitcoinMainnet'} | ${'bitcoin'}
      ${'bitcoinTestnet'} | ${'testnet'}
      ${'bitcoinSignet'}  | ${'testnet'}
      ${'bitcoinRegtest'} | ${'regtest'}
    `(
      'maps boltz-core v3 legacy key $legacy to v4 $canonical',
      ({ legacy, canonical }) => {
        expect(resolveBitcoinNetwork(legacy)).toBe(
          resolveBitcoinNetwork(canonical),
        );
      },
    );

    test.each`
      name
      ${'litecoinMainnet'}
      ${'dogecoinRegtest'}
      ${'bitcoinSimnet'}
      ${'not-a-network'}
      ${''}
    `('returns undefined for unsupported network name $name', ({ name }) => {
      expect(resolveBitcoinNetwork(name)).toBeUndefined();
    });

    test('returns undefined when name is undefined', () => {
      expect(resolveBitcoinNetwork(undefined)).toBeUndefined();
    });
  });
});
