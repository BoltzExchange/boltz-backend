import { slip77FromSeed } from '../../../lib/wallet/Slip77';

type Fixture = {
  name: string;
  seedHex: string;
  scriptHex: string;
  masterKey: string;
  derivedPrivateKey: string;
  derivedPublicKey: string;
};

const ABANDON_SEED =
  '5eb00bbddcf069084889a8ab9155568165f5c453ccb85e70811aaed6f6da5fc19a5ac40b389cd370d086206dec8aa6c43daea6690f20ad3d8d48b2d2ce9e38e4';
const ABANDON_MASTER =
  '9c8e4f05c7711a98c838be228bcb84924d4570ca53f35fa1c793e58841d47023';

const canonicalFixtures: Fixture[] = [
  {
    name: 'BIP-39 abandon seed / P2PKH (zero hash160)',
    seedHex: ABANDON_SEED,
    scriptHex: '76a914' + '00'.repeat(20) + '88ac',
    masterKey: ABANDON_MASTER,
    derivedPrivateKey:
      '1b53defc3ee6151725a832a32170c3db518c7654b8cffdbe274e7c9dbdd5c9bb',
    derivedPublicKey:
      '037994f455a6b82b2b9c3bafe093da65aa21368982039c4f71d472c3457a1dc345',
  },
  {
    name: 'BIP-39 abandon seed / P2WPKH (zero hash160)',
    seedHex: ABANDON_SEED,
    scriptHex: '0014' + '00'.repeat(20),
    masterKey: ABANDON_MASTER,
    derivedPrivateKey:
      '9d1a40dadaeacd6601d5765da41fef13afb410107abc4b6dd4bf096e6175e836',
    derivedPublicKey:
      '024f84c773ab92c316e26bb3a20a2ca9edf757790f64b1f1ac48ede521540a5e6b',
  },
  {
    name: 'BIP-39 abandon seed / P2WSH (zero sha256)',
    seedHex: ABANDON_SEED,
    scriptHex: '0020' + '00'.repeat(32),
    masterKey: ABANDON_MASTER,
    derivedPrivateKey:
      '351c40a8b1ebf19ee7c89ad1598ac49ed4e33cd00017a4b945cd3d7706e18823',
    derivedPublicKey:
      '03f7bec7969f9370ebcd019449430735d3a025d4e365ea2005d3d8bb03ef5aeb5b',
  },
  {
    name: 'BIP-39 abandon seed / P2TR (zero x-only key)',
    seedHex: ABANDON_SEED,
    scriptHex: '5120' + '00'.repeat(32),
    masterKey: ABANDON_MASTER,
    derivedPrivateKey:
      'c5902ea9b71b04e96770ac5ff5a409f96d1f8024c04466e4c2ac46c8c78a4fe6',
    derivedPublicKey:
      '0376b0dca3f1fc94b39a391b6792d655ba243e0a0d9124f350aea30dea03df92ac',
  },
  {
    name: 'BIP-39 abandon seed / BIP-0034 genesis coinbase output script',
    seedHex: ABANDON_SEED,
    scriptHex:
      '4104678afdb0fe5548271967f1a67130b7105cd6a828e03909a67962e0ea1f61deb649f6bc3f4cef38c4f35504e51ec112de5c384df7ba0b8d578a4c702b6bf11dfac',
    masterKey: ABANDON_MASTER,
    derivedPrivateKey:
      '636e110cfddb1fe456300de661f2e1ad9e297024a85d30494924b1cfecc6442e',
    derivedPublicKey:
      '0279c4d5c1b49fae9717c087beb68dcb3d912c2a1975cea16d3f1071e4432ccb27',
  },
];

const parityFixtures: Fixture[] = [
  {
    name: 'seed-0xab x32 / script p2wpkh zeros',
    seedHex: 'ab'.repeat(32),
    scriptHex: '0014' + '00'.repeat(20),
    masterKey:
      '80768ab2f1a6de596c012fbc67409b16b655e702987d6560d2de2b1e10947d27',
    derivedPrivateKey:
      '76a18e8c77287da576be0b451576caa35cfe46d8b3890d0cf9130c7ab55c9656',
    derivedPublicKey:
      '03a9681f11bd2436f64461d155d0e095191b22847860e3909115d6cd860510a6a0',
  },
  {
    name: 'seed-0xab x32 / script 0x01 x20',
    seedHex: 'ab'.repeat(32),
    scriptHex: '01'.repeat(20),
    masterKey:
      '80768ab2f1a6de596c012fbc67409b16b655e702987d6560d2de2b1e10947d27',
    derivedPrivateKey:
      'd50bc53494429be573ad36c2e3602db62e08b3d32566ce1698d11aa389c9a0aa',
    derivedPublicKey:
      '0283d809b8fb34d4677316f7cdea62fee92b82b7c3a50c481bdeb6fb8b0d728b0f',
  },
  {
    name: 'seed-0xab x32 / script 0x02 x20',
    seedHex: 'ab'.repeat(32),
    scriptHex: '02'.repeat(20),
    masterKey:
      '80768ab2f1a6de596c012fbc67409b16b655e702987d6560d2de2b1e10947d27',
    derivedPrivateKey:
      'b737ad9294feaf83012dd385a42587a7db3a6f038ae81e4782d63f4173b55281',
    derivedPublicKey:
      '03ae5c4aa71569096699a1dd7a7e759730bbb87bca47b95058ee87e4c3067fce01',
  },
  {
    name: 'seed-counted / script p2wsh deadbeef',
    seedHex: '000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f',
    scriptHex: '0020' + 'deadbeef'.repeat(8),
    masterKey:
      'f78e2d62012799039ed6d9e812e24ab5fc3a228931ccaba04dd7574bfcf6cc3d',
    derivedPrivateKey:
      '3116afb616871475b86a795fa0024ec8c848f2712d6465afbeac7d33bb36e059',
    derivedPublicKey:
      '02e4f15ea930246bc2eb73d319904be70673f28cb48c220a560528018a23793402',
  },
  {
    name: 'seed-0xaa as hex string / script arbitrary p2wpkh',
    seedHex: 'aa'.repeat(32),
    scriptHex: '00149f4d4e8f0a4e9b1c2d3e4f5a6b7c8d9e0f1a2b3c',
    masterKey:
      '6cf4e2a0a7e956c61c9941c157321a9cb5419905de3abba3a3cdebac547b0338',
    derivedPrivateKey:
      '55c57b75e99edb214784d4d1e1955533061b4c3680171ebd6f3889ecc887e950',
    derivedPublicKey:
      '021dfddb39c975f2317685572d9f1ee9be9ccde1d001eaabae1e945f06b7394b27',
  },
];

const runFixture = (f: Fixture) => {
  const seed = Buffer.from(f.seedHex, 'hex');
  const script = Buffer.from(f.scriptHex, 'hex');

  it('produces the expected master blinding key', () => {
    const node = slip77FromSeed(seed);
    expect(node.masterKey).toBeInstanceOf(Buffer);
    expect(node.masterKey).toHaveLength(32);
    expect(node.masterKey.toString('hex')).toEqual(f.masterKey);
  });

  it('produces the expected derived private + public key for the script', () => {
    const derived = slip77FromSeed(seed).derive(script);
    expect(derived.privateKey).toBeInstanceOf(Buffer);
    expect(derived.privateKey).toHaveLength(32);
    expect(derived.publicKey).toBeInstanceOf(Buffer);
    expect(derived.publicKey).toHaveLength(33);
    expect(derived.privateKey.toString('hex')).toEqual(f.derivedPrivateKey);
    expect(derived.publicKey.toString('hex')).toEqual(f.derivedPublicKey);
  });
};

describe('Slip77', () => {
  describe.each(canonicalFixtures)(
    'canonical BIP-39 abandon seed — $name',
    (f) => {
      runFixture(f);
    },
  );

  describe.each(parityFixtures)('npm-slip77 parity — $name', (f) => {
    runFixture(f);
  });

  it('accepts a hex string seed equivalently to a Buffer seed', () => {
    const hex = 'aa'.repeat(32);
    const fromHex = slip77FromSeed(hex);
    const fromBuf = slip77FromSeed(Buffer.from(hex, 'hex'));
    expect(fromHex.masterKey.equals(fromBuf.masterKey)).toBe(true);
  });

  it('produces independent keys for different scripts', () => {
    const node = slip77FromSeed(Buffer.alloc(32, 0xab));
    const a = node.derive(Buffer.alloc(20, 0x01));
    const b = node.derive(Buffer.alloc(20, 0x02));
    expect(a.privateKey.equals(b.privateKey)).toBe(false);
    expect(a.publicKey.equals(b.publicKey)).toBe(false);
  });

  it('accepts a raw Uint8Array script (not a Buffer) equivalently', () => {
    const node = slip77FromSeed(Buffer.alloc(32, 0xab));
    const rawScript = new Uint8Array(20);
    rawScript.fill(0x01);
    expect(Buffer.isBuffer(rawScript)).toBe(false);
    const fromRaw = node.derive(rawScript);
    const fromBuf = node.derive(Buffer.alloc(20, 0x01));
    expect(fromRaw.privateKey.equals(fromBuf.privateKey)).toBe(true);
    expect(fromRaw.publicKey.equals(fromBuf.publicKey)).toBe(true);
  });
});
