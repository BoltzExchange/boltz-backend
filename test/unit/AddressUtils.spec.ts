import { ripemd160 } from '@noble/hashes/legacy.js';
import { sha256 } from '@noble/hashes/sha2.js';
import { address as liquidAddress, networks as liquidNetworks } from 'liquidjs-lib';
import {
  addressFromOutputScript,
  outputScriptFromAddress,
} from '../../lib/AddressUtils';
import { CurrencyType } from '../../lib/consts/Enums';
import type Sidecar from '../../lib/sidecar/Sidecar';
import { bitcoin, regtest, testnet } from '../Networks';

type AddressVector = {
  name: string;
  network: 'bitcoin' | 'testnet' | 'regtest';
  address: string;
  scriptHex: string;
};

const networkOf = (n: AddressVector['network']) =>
  n === 'bitcoin' ? bitcoin : n === 'testnet' ? testnet : regtest;

// Mock sidecar that delegates to liquidjs-lib so unit tests don't need a running sidecar.
// The Rust impl is covered by chain::utils::test::address_codec in boltzr.
const mockSidecar: Sidecar = {
  decodeAddress: jest.fn(async (_chain: string, address: string) => {
    if (liquidAddress.isConfidential(address)) {
      const decoded = liquidAddress.fromConfidential(address);
      return {
        scriptPubkey: decoded.scriptPubKey!,
        blindingPubkey: decoded.blindingKey,
      };
    }
    return {
      scriptPubkey: liquidAddress.toOutputScript(
        address,
        liquidNetworks.regtest,
      ),
      blindingPubkey: undefined,
    };
  }),
  encodeAddress: jest.fn(
    async (
      _chain: string,
      scriptPubkey: Buffer,
      blindingPubkey?: Buffer,
    ) => {
      const addr = liquidAddress.fromOutputScript(
        scriptPubkey,
        liquidNetworks.regtest,
      );
      if (blindingPubkey && blindingPubkey.length > 0) {
        return liquidAddress.toConfidential(addr, blindingPubkey);
      }
      return addr;
    },
  ),
} as unknown as Sidecar;

const vectors: AddressVector[] = [
  {
    name: 'mainnet P2PKH (genesis coinbase address)',
    network: 'bitcoin',
    address: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
    scriptHex: '76a91462e907b15cbf27d5425399ebf6f0fb50ebb88f1888ac',
  },
  {
    name: 'mainnet P2SH',
    network: 'bitcoin',
    address: '3J98t1WpEZ73CNmQviecrnyiWrnqRhWNLy',
    scriptHex: 'a914b472a266d0bd89c13706a4132ccfb16f7c3b9fcb87',
  },
  {
    name: 'mainnet P2WPKH (BIP-173)',
    network: 'bitcoin',
    address: 'bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4',
    scriptHex: '0014751e76e8199196d454941c45d1b3a323f1433bd6',
  },
  {
    name: 'testnet P2WPKH (BIP-173)',
    network: 'testnet',
    address: 'tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx',
    scriptHex: '0014751e76e8199196d454941c45d1b3a323f1433bd6',
  },
  {
    name: 'mainnet P2WSH (BIP-173)',
    network: 'bitcoin',
    address: 'bc1qrp33g0q5c5txsp9arysrx4k6zdkfs4nce4xj0gdcccefvpysxf3qccfmv3',
    scriptHex:
      '00201863143c14c5166804bd19203356da136c985678cd4d27a1b8c6329604903262',
  },
  {
    name: 'mainnet P2TR (BIP-350)',
    network: 'bitcoin',
    address: 'bc1p0xlxvlhemja6c4dqv22uapctqupfhlxm9h8z3k2e72q4k9hcz7vqzk5jj0',
    scriptHex:
      '512079be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798',
  },
];

describe('AddressUtils', () => {
  describe('outputScriptFromAddress (bitcoin)', () => {
    it.each(vectors)(
      'encodes $name to the expected scriptPubKey',
      async ({ network, address, scriptHex }) => {
        const got = await outputScriptFromAddress(
          CurrencyType.BitcoinLike,
          address,
          networkOf(network),
        );
        expect(got.toString('hex')).toEqual(scriptHex);
      },
    );

    it('throws on a malformed address', async () => {
      await expect(
        outputScriptFromAddress(
          CurrencyType.BitcoinLike,
          'this-is-not-an-address',
          bitcoin,
        ),
      ).rejects.toThrow();
    });

    it('rejects a mismatched-network bech32 address', async () => {
      await expect(
        outputScriptFromAddress(
          CurrencyType.BitcoinLike,
          'bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4',
          testnet,
        ),
      ).rejects.toThrow();
    });
  });

  describe('addressFromOutputScript (bitcoin)', () => {
    it.each(vectors)(
      'decodes $name scriptPubKey back to the expected address',
      async ({ network, address, scriptHex }) => {
        const got = await addressFromOutputScript(
          CurrencyType.BitcoinLike,
          Buffer.from(scriptHex, 'hex'),
          networkOf(network),
        );
        expect(got).toEqual(address);
      },
    );
  });

  describe('round-trip', () => {
    it.each(vectors)(
      'address → script → address yields the original for $name',
      async ({ network, address }) => {
        const script = await outputScriptFromAddress(
          CurrencyType.BitcoinLike,
          address,
          networkOf(network),
        );
        const back = await addressFromOutputScript(
          CurrencyType.BitcoinLike,
          script,
          networkOf(network),
        );
        expect(back).toEqual(address);
      },
    );
  });

  describe('liquid', () => {
    const publicKey = Buffer.from(
      '03f0081c29011d63e741e4bfe2465a9e1bb203852d239f541d92dc8d9e40bdb3e6',
      'hex',
    );
    const xOnlyPubkey = publicKey.subarray(1, 33);
    const pubkeyHash = Buffer.from(ripemd160(sha256(publicKey)));

    const p2wpkhScript = Buffer.concat([Buffer.from([0x00, 0x14]), pubkeyHash]);
    const p2trScript = Buffer.concat([Buffer.from([0x51, 0x20]), xOnlyPubkey]);

    const blindingKey = Buffer.from(
      '0279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798',
      'hex',
    );

    const liquidRegtest = liquidNetworks.regtest;

    it('encodes a regtest P2WPKH script to an ert1q address (unblinded)', async () => {
      expect(
        await addressFromOutputScript(
          CurrencyType.Liquid,
          p2wpkhScript,
          liquidRegtest,
          undefined,
          mockSidecar,
        ),
      ).toEqual('ert1q84ufadu3juwu6zjcdcweqhe9ewhwxrvtj3lmzj');
    });

    it('encodes a regtest P2TR script to an ert1p address (unblinded)', async () => {
      expect(
        await addressFromOutputScript(
          CurrencyType.Liquid,
          p2trScript,
          liquidRegtest,
          undefined,
          mockSidecar,
        ),
      ).toEqual(
        'ert1p7qypc2gpr437ws0yhl3yvk57rweq8pfdyw04g8vjmjxeus9ak0nqwf79lm',
      );
    });

    it('decodes an ert1q regtest address back to its scriptPubKey', async () => {
      const got = await outputScriptFromAddress(
        CurrencyType.Liquid,
        'ert1q84ufadu3juwu6zjcdcweqhe9ewhwxrvtj3lmzj',
        liquidRegtest,
        mockSidecar,
      );
      expect(got.toString('hex')).toEqual(p2wpkhScript.toString('hex'));
    });

    it('round-trips a regtest P2WPKH (unblinded)', async () => {
      const addr = await addressFromOutputScript(
        CurrencyType.Liquid,
        p2wpkhScript,
        liquidRegtest,
        undefined,
        mockSidecar,
      );
      const back = await outputScriptFromAddress(
        CurrencyType.Liquid,
        addr,
        liquidRegtest,
        mockSidecar,
      );
      expect(back.toString('hex')).toEqual(p2wpkhScript.toString('hex'));
    });

    it('encodes a confidential P2WPKH (el1q…) when a blindingKey is supplied', async () => {
      const got = await addressFromOutputScript(
        CurrencyType.Liquid,
        p2wpkhScript,
        liquidRegtest,
        blindingKey,
        mockSidecar,
      );
      expect(got).toMatchSnapshot();
      expect(got.startsWith('el1qq')).toBe(true);
    });

    it('encodes a confidential P2TR (el1p…) when a blindingKey is supplied', async () => {
      const got = await addressFromOutputScript(
        CurrencyType.Liquid,
        p2trScript,
        liquidRegtest,
        blindingKey,
        mockSidecar,
      );
      expect(got).toMatchSnapshot();
      expect(got.startsWith('el1p')).toBe(true);
    });

    it('falls back to the unblinded address when blindingKey is empty', async () => {
      const got = await addressFromOutputScript(
        CurrencyType.Liquid,
        p2wpkhScript,
        liquidRegtest,
        Buffer.alloc(0),
        mockSidecar,
      );
      expect(got).toEqual('ert1q84ufadu3juwu6zjcdcweqhe9ewhwxrvtj3lmzj');
    });

    it('decoding a confidential address yields the unblinded scriptPubKey', async () => {
      const confidential = await addressFromOutputScript(
        CurrencyType.Liquid,
        p2wpkhScript,
        liquidRegtest,
        blindingKey,
        mockSidecar,
      );
      const back = await outputScriptFromAddress(
        CurrencyType.Liquid,
        confidential,
        liquidRegtest,
        mockSidecar,
      );
      expect(back.toString('hex')).toEqual(p2wpkhScript.toString('hex'));
    });

    it('throws when sidecar is not provided for Liquid encode', async () => {
      await expect(
        addressFromOutputScript(
          CurrencyType.Liquid,
          p2wpkhScript,
          liquidRegtest,
        ),
      ).rejects.toThrow('sidecar required');
    });

    it('throws when sidecar is not provided for Liquid decode', async () => {
      await expect(
        outputScriptFromAddress(
          CurrencyType.Liquid,
          'ert1q84ufadu3juwu6zjcdcweqhe9ewhwxrvtj3lmzj',
          liquidRegtest,
        ),
      ).rejects.toThrow('sidecar required');
    });
  });
});
