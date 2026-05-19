import { hexToBytes } from '@noble/hashes/utils.js';
import { HDKey } from '@scure/bip32';

type Bip32Vector = {
  name: string;
  seedHex: string;
  derivations: Array<{
    path: string;
    xpub: string;
    xprv: string;
  }>;
};

const vectors: Bip32Vector[] = [
  {
    name: 'BIP-32 test vector 1',
    seedHex: '000102030405060708090a0b0c0d0e0f',
    derivations: [
      {
        path: 'm',
        xpub: 'xpub661MyMwAqRbcFtXgS5sYJABqqG9YLmC4Q1Rdap9gSE8NqtwybGhePY2gZ29ESFjqJoCu1Rupje8YtGqsefD265TMg7usUDFdp6W1EGMcet8',
        xprv: 'xprv9s21ZrQH143K3QTDL4LXw2F7HEK3wJUD2nW2nRk4stbPy6cq3jPPqjiChkVvvNKmPGJxWUtg6LnF5kejMRNNU3TGtRBeJgk33yuGBxrMPHi',
      },
      {
        path: "m/0'",
        xpub: 'xpub68Gmy5EdvgibQVfPdqkBBCHxA5htiqg55crXYuXoQRKfDBFA1WEjWgP6LHhwBZeNK1VTsfTFUHCdrfp1bgwQ9xv5ski8PX9rL2dZXvgGDnw',
        xprv: 'xprv9uHRZZhk6KAJC1avXpDAp4MDc3sQKNxDiPvvkX8Br5ngLNv1TxvUxt4cV1rGL5hj6KCesnDYUhd7oWgT11eZG7XnxHrnYeSvkzY7d2bhkJ7',
      },
      {
        path: "m/0'/1",
        xpub: 'xpub6ASuArnXKPbfEwhqN6e3mwBcDTgzisQN1wXN9BJcM47sSikHjJf3UFHKkNAWbWMiGj7Wf5uMash7SyYq527Hqck2AxYysAA7xmALppuCkwQ',
        xprv: 'xprv9wTYmMFdV23N2TdNG573QoEsfRrWKQgWeibmLntzniatZvR9BmLnvSxqu53Kw1UmYPxLgboyZQaXwTCg8MSY3H2EU4pWcQDnRnrVA1xe8fs',
      },
      {
        path: "m/0'/1/2'",
        xpub: 'xpub6D4BDPcP2GT577Vvch3R8wDkScZWzQzMMUm3PWbmWvVJrZwQY4VUNgqFJPMM3No2dFDFGTsxxpG5uJh7n7epu4trkrX7x7DogT5Uv6fcLW5',
        xprv: 'xprv9z4pot5VBttmtdRTWfWQmoH1taj2axGVzFqSb8C9xaxKymcFzXBDptWmT7FwuEzG3ryjH4ktypQSAewRiNMjANTtpgP4mLTj34bhnZX7UiM',
      },
      {
        path: "m/0'/1/2'/2",
        xpub: 'xpub6FHa3pjLCk84BayeJxFW2SP4XRrFd1JYnxeLeU8EqN3vDfZmbqBqaGJAyiLjTAwm6ZLRQUMv1ZACTj37sR62cfN7fe5JnJ7dh8zL4fiyLHV',
        xprv: 'xprvA2JDeKCSNNZky6uBCviVfJSKyQ1mDYahRjijr5idH2WwLsEd4Hsb2Tyh8RfQMuPh7f7RtyzTtdrbdqqsunu5Mm3wDvUAKRHSC34sJ7in334',
      },
      {
        path: "m/0'/1/2'/2/1000000000",
        xpub: 'xpub6H1LXWLaKsWFhvm6RVpEL9P4KfRZSW7abD2ttkWP3SSQvnyA8FSVqNTEcYFgJS2UaFcxupHiYkro49S8yGasTvXEYBVPamhGW6cFJodrTHy',
        xprv: 'xprvA41z7zogVVwxVSgdKUHDy1SKmdb533PjDz7J6N6mV6uS3ze1ai8FHa8kmHScGpWmj4WggLyQjgPie1rFSruoUihUZREPSL39UNdE3BBDu76',
      },
    ],
  },
  {
    name: 'BIP-32 test vector 3 (leading-zero key)',
    seedHex:
      '4b381541583be4423346c643850da4b320e46a87ae3d2a4e6da11eba819cd4acba45d239319ac14f863b8d5ab5a0d0c64d2e8a1e7d1457df2e5a3c51c73235be',
    derivations: [
      {
        path: 'm',
        xpub: 'xpub661MyMwAqRbcEZVB4dScxMAdx6d4nFc9nvyvH3v4gJL378CSRZiYmhRoP7mBy6gSPSCYk6SzXPTf3ND1cZAceL7SfJ1Z3GC8vBgp2epUt13',
        xprv: 'xprv9s21ZrQH143K25QhxbucbDDuQ4naNntJRi4KUfWT7xo4EKsHt2QJDu7KXp1A3u7Bi1j8ph3EGsZ9Xvz9dGuVrtHHs7pXeTzjuxBrCmmhgC6',
      },
      {
        path: "m/0'",
        xpub: 'xpub68NZiKmJWnxxS6aaHmn81bvJeTESw724CRDs6HbuccFQN9Ku14VQrADWgqbhhTHBaohPX4CjNLf9fq9MYo6oDaPPLPxSb7gwQN3ih19Zm4Y',
        xprv: 'xprv9uPDJpEQgRQfDcW7BkF7eTya6RPxXeJCqCJGHuCJ4GiRVLzkTXBAJMu2qaMWPrS7AANYqdq6vcBcBUdJCVVFceUvJFjaPdGZ2y9WACViL4L',
      },
    ],
  },
];

describe('BIP-32 (@scure/bip32)', () => {
  describe.each(vectors)('$name', (v) => {
    const seed = hexToBytes(v.seedHex);

    it.each(v.derivations)(
      'derives canonical xpub/xprv at $path',
      ({ path, xpub, xprv }) => {
        const master = HDKey.fromMasterSeed(seed);
        const node = path === 'm' ? master : master.derive(path);
        expect(node.publicExtendedKey).toEqual(xpub);
        expect(node.privateExtendedKey).toEqual(xprv);
      },
    );
  });

  it('reproduces a known public key from a known seed (sanity)', () => {
    const seed = hexToBytes('000102030405060708090a0b0c0d0e0f');
    const node = HDKey.fromMasterSeed(seed);
    expect(Buffer.from(node.publicKey!).toString('hex')).toEqual(
      '0339a36013301597daef41fbe593a02cc513d0b55527ec2df1050e2e8ff49c85c2',
    );
  });

  it('round-trips through fromExtendedKey', () => {
    const seed = hexToBytes('000102030405060708090a0b0c0d0e0f');
    const node = HDKey.fromMasterSeed(seed);
    const restored = HDKey.fromExtendedKey(node.privateExtendedKey);
    expect(restored.privateExtendedKey).toEqual(node.privateExtendedKey);
    expect(restored.publicExtendedKey).toEqual(node.publicExtendedKey);
  });
});
