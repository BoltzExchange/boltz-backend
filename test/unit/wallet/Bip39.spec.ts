import { hexToBytes } from '@noble/hashes/utils.js';
import {
  entropyToMnemonic,
  mnemonicToSeedSync,
  validateMnemonic,
} from '@scure/bip39';
import { wordlist } from '@scure/bip39/wordlists/english.js';

type Bip39Vector = {
  entropyHex: string;
  mnemonic: string;
  seedTrezorHex: string;
};

const trezorVectors: Bip39Vector[] = [
  {
    entropyHex: '00000000000000000000000000000000',
    mnemonic:
      'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about',
    seedTrezorHex:
      'c55257c360c07c72029aebc1b53c05ed0362ada38ead3e3e9efa3708e53495531f09a6987599d18264c1e1c92f2cf141630c7a3c4ab7c81b2f001698e7463b04',
  },
  {
    entropyHex: '7f7f7f7f7f7f7f7f7f7f7f7f7f7f7f7f',
    mnemonic:
      'legal winner thank year wave sausage worth useful legal winner thank yellow',
    seedTrezorHex:
      '2e8905819b8723fe2c1d161860e5ee1830318dbf49a83bd451cfb8440c28bd6fa457fe1296106559a3c80937a1c1069be3a3a5bd381ee6260e8d9739fce1f607',
  },
  {
    entropyHex: '80808080808080808080808080808080',
    mnemonic:
      'letter advice cage absurd amount doctor acoustic avoid letter advice cage above',
    seedTrezorHex:
      'd71de856f81a8acc65e6fc851a38d4d7ec216fd0796d0a6827a3ad6ed5511a30fa280f12eb2e47ed2ac03b5c462a0358d18d69fe4f985ec81778c1b370b652a8',
  },
  {
    entropyHex: 'ffffffffffffffffffffffffffffffff',
    mnemonic: 'zoo zoo zoo zoo zoo zoo zoo zoo zoo zoo zoo wrong',
    seedTrezorHex:
      'ac27495480225222079d7be181583751e86f571027b0497b5b5d11218e0a8a13332572917f0f8e5a589620c6f15b11c61dee327651a14c34e18231052e48c069',
  },
];

const noPassphraseAbandonSeedHex =
  '5eb00bbddcf069084889a8ab9155568165f5c453ccb85e70811aaed6f6da5fc19a5ac40b389cd370d086206dec8aa6c43daea6690f20ad3d8d48b2d2ce9e38e4';

describe('BIP-39 (@scure/bip39)', () => {
  describe('mnemonicToSeedSync with "TREZOR" passphrase', () => {
    it.each(trezorVectors)(
      'seed matches canonical Trezor vector for "$mnemonic"',
      ({ mnemonic, seedTrezorHex }) => {
        const seed = mnemonicToSeedSync(mnemonic, 'TREZOR');
        expect(Buffer.from(seed).toString('hex')).toEqual(seedTrezorHex);
      },
    );
  });

  describe('mnemonicToSeedSync with no passphrase (production path)', () => {
    it('reproduces the canonical empty-passphrase seed for the all-abandon mnemonic', () => {
      const mnemonic =
        'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';
      const seed = mnemonicToSeedSync(mnemonic);
      expect(Buffer.from(seed).toString('hex')).toEqual(
        noPassphraseAbandonSeedHex,
      );
    });
  });

  describe('entropyToMnemonic', () => {
    it.each(trezorVectors)(
      'derives mnemonic "$mnemonic" from entropy',
      ({ entropyHex, mnemonic }) => {
        expect(entropyToMnemonic(hexToBytes(entropyHex), wordlist)).toEqual(
          mnemonic,
        );
      },
    );
  });

  describe('validateMnemonic', () => {
    it('accepts every canonical mnemonic from the Trezor vectors', () => {
      for (const v of trezorVectors) {
        expect(validateMnemonic(v.mnemonic, wordlist)).toBe(true);
      }
    });

    it('rejects an obviously invalid mnemonic', () => {
      expect(validateMnemonic('not actually a mnemonic at all', wordlist)).toBe(
        false,
      );
    });

    it('rejects a mnemonic with a bad checksum', () => {
      const bad =
        'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon';
      expect(validateMnemonic(bad, wordlist)).toBe(false);
    });
  });
});
