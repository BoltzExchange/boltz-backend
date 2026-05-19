import { sha256 } from '@noble/hashes/sha2.js';
import { HDKey } from '@scure/bip32';
import { generateMnemonic, mnemonicToSeedSync } from '@scure/bip39';
import { wordlist } from '@scure/bip39/wordlists/english.js';
import type { Transaction } from '@scure/btc-signer';
import { Script } from '@scure/btc-signer/script.js';
import { randomBytes } from 'crypto';
import { networks as networkLiquid } from 'liquidjs-lib';
import Logger from '../../../lib/Logger';
import { getHexBuffer } from '../../../lib/Utils';
import { CurrencyType } from '../../../lib/consts/Enums';
import Database from '../../../lib/db/Database';
import KeyRepository from '../../../lib/db/repositories/KeyRepository';
import { slip77FromSeed } from '../../../lib/wallet/Slip77';
import Wallet from '../../../lib/wallet/Wallet';
import WalletLiquid from '../../../lib/wallet/WalletLiquid';
import CoreWalletProvider from '../../../lib/wallet/providers/CoreWalletProvider';
import type {
  SentTransaction,
  WalletBalance,
} from '../../../lib/wallet/providers/WalletProviderInterface';
import { regtest as bitcoinRegtest } from '../../Networks';

const symbol = 'BTC';

const balance: WalletBalance = {
  confirmedBalance: 1,
  unconfirmedBalance: 2,
};

const mockGetBalance = jest.fn().mockResolvedValue(balance);

const address = 'bcrt1qu5m32tnhs3wl633qcg3yae8u0mqkjkm5txrqf9';

const mockGetAddress = jest.fn().mockResolvedValue(address);

const sentTransaction: SentTransaction = {
  fee: 1,
  vout: 0,
  transaction: {} as unknown as Transaction,
  transactionId:
    'b866402106a97f06f84215abf545ef3b455346fd998845731385f6cdcb12d96d',
};

const mockSendToAddress = jest.fn().mockResolvedValue(sentTransaction);
const mockSweepWallet = jest.fn().mockResolvedValue(sentTransaction);

jest.mock('../../../lib/wallet/providers/CoreWalletProvider', () => {
  return jest.fn().mockImplementation(() => {
    return {
      symbol,

      getBalance: mockGetBalance,
      getAddress: mockGetAddress,

      sendToAddress: mockSendToAddress,
      sweepWallet: mockSweepWallet,
    };
  });
});

const mockedCoreWalletProvider = <jest.Mock<CoreWalletProvider>>(
  CoreWalletProvider
);

describe('Wallet', () => {
  const encodeOutput = getHexBuffer(
    '00147ca6c71979907c36d5d62f325d6d8104a8497445',
  );
  const encodedAddress = 'bcrt1q0jnvwxtejp7rd4wk9ue96mvpqj5yjaz9v7vte5';

  const mnemonic = generateMnemonic(wordlist);
  const seed = mnemonicToSeedSync(mnemonic);
  const masterNode = HDKey.fromMasterSeed(seed);

  const database = new Database(Logger.disabledLogger, ':memory:');

  const derivationPath = 'm/0/0';
  let highestUsedIndex = 21;

  const network = bitcoinRegtest;

  const walletProvider = new mockedCoreWalletProvider();

  const wallet = new Wallet(
    Logger.disabledLogger,
    CurrencyType.BitcoinLike,
    walletProvider,
    network,
  );

  wallet.initKeyProvider(derivationPath, masterNode);

  const incrementIndex = () => {
    highestUsedIndex = highestUsedIndex + 1;
  };

  const getKeysByIndex = (index: number) => {
    const node = masterNode.derive(`${derivationPath}/${index}`);
    return {
      publicKey: Buffer.from(node.publicKey!),
      privateKey: Buffer.from(node.privateKey!),
    };
  };

  const walletLiquid = new WalletLiquid(
    Logger.disabledLogger,
    walletProvider,
    slip77FromSeed(seed),
    networkLiquid.liquid,
  );

  walletLiquid.initKeyProvider(derivationPath, masterNode);

  beforeAll(async () => {
    await database.init();

    await KeyRepository.addKeyProvider({
      symbol,
      derivationPath,
      highestUsedIndex,
    });
  });

  afterAll(async () => {
    await database.close();
  });

  test('should init', () => {
    expect(wallet.symbol).toEqual(symbol);
    expect(wallet.type).toEqual(CurrencyType.BitcoinLike);
  });

  test('should get correct address from index', () => {
    const index = 1;

    expect(wallet.getKeysByIndex(index).publicKey).toEqual(
      getKeysByIndex(index).publicKey,
    );
  });

  describe('canonical BIP-39 abandon seed key derivation', () => {
    const abandonMnemonic =
      'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';
    const abandonSeed = mnemonicToSeedSync(abandonMnemonic);
    const abandonMaster = HDKey.fromMasterSeed(abandonSeed);
    const abandonWallet = new Wallet(
      Logger.disabledLogger,
      CurrencyType.BitcoinLike,
      walletProvider,
      network,
    );
    abandonWallet.initKeyProvider('m/0/0', abandonMaster);

    test.each`
      index | privateKey                                                            | publicKey
      ${0}  | ${'772e60d43d93aeefea69e3b3ec0639ff60feefc98a5c572cc09414bbb4b512e7'} | ${'0275e1557269c40cd90ebea26daf85ea0f6427b1885bb018ba3c204ea56e27aa49'}
      ${1}  | ${'731573db19bfd58d896e982ca68728ed927197757b93f2fd40d26129c7184512'} | ${'0350d801e5faf5cc96dc275996ab4e9fd88e52e32c95f3989b9349cce704ea41e6'}
      ${21} | ${'f244348bd54f49ded4b597e9587048a9750b6d39dd0bf61d585f72d6093fe15f'} | ${'03c19e1843c39e40d8fc7183558261032ea5856bcf0a18a75a72e1946df00acc72'}
    `(
      'derives canonical keys at m/0/0/$index',
      ({ index, privateKey, publicKey }) => {
        const keys = abandonWallet.getKeysByIndex(index);
        expect(keys.privateKey.toString('hex')).toEqual(privateKey);
        expect(keys.publicKey.toString('hex')).toEqual(publicKey);
      },
    );
  });

  test('should get new keys', async () => {
    incrementIndex();
    const { keys, index } = await wallet.getNewKeys();

    expect(keys.publicKey).toEqual(getKeysByIndex(highestUsedIndex).publicKey);
    expect(index).toEqual(highestUsedIndex);
  });

  test('should encode addresses', () => {
    expect(wallet.encodeAddress(encodeOutput)).toEqual(encodedAddress);
  });

  test('should ignore OP_RETURN outputs', () => {
    const outputScript = Buffer.from(
      Script.encode(['RETURN', sha256(randomBytes(64))]),
    );

    expect(wallet.encodeAddress(outputScript)).toEqual('');
  });

  test('should ignore all invalid addresses', () => {
    const invalidScripts = [
      Buffer.from(Script.encode([randomBytes(32)])),
      Buffer.from(Script.encode(['OP_6'])),
      Buffer.from(
        Script.encode([
          'NUMEQUAL',
          'OP_4',
          'NOP1',
          'NUMNOTEQUAL',
          'CHECKSIGVERIFY',
        ]),
      ),
    ];

    for (const script of invalidScripts) {
      expect(wallet.encodeAddress(script)).toEqual('');
    }
  });

  test('should decode addresses', () => {
    expect(wallet.decodeAddress(encodedAddress)).toEqual(encodeOutput);
  });

  test('should update highest used index in database', async () => {
    const dbKeyProvider = await KeyRepository.getKeyProvider(symbol);

    expect(dbKeyProvider!.highestUsedIndex).toEqual(highestUsedIndex);
  });

  test('should get a new address', async () => {
    const label = 'label for some good reason';
    expect(await wallet.getAddress(label)).toEqual(address);

    expect(mockGetAddress).toHaveBeenCalledTimes(1);
    expect(mockGetAddress).toHaveBeenCalledWith(label);
  });

  test('should get correct balance', async () => {
    expect(await wallet.getBalance()).toEqual(balance);

    expect(mockGetBalance).toHaveBeenCalledTimes(1);
  });

  test('should send coins to address', async () => {
    const address = '2N94uHZqzv6q5UeFjgKcG6iqeyz1UJNq9Ye';
    const amount = 372498;
    const satPerVbyte = 18;
    const label = 'send some funds';

    await expect(
      wallet.sendToAddress(address, amount, satPerVbyte, label),
    ).resolves.toEqual(sentTransaction);

    expect(mockSendToAddress).toHaveBeenCalledTimes(1);
    expect(mockSendToAddress).toHaveBeenCalledWith(
      address,
      amount,
      satPerVbyte,
      label,
    );
  });

  test('should sweep wallet', async () => {
    const address = 'bcrt1qk4pces7y5csg3qv8gr4ftghgp8gzgg3lv3nwju';
    const satPerVbyte = 2;
    const label = 'sweep it all';

    expect(await wallet.sweepWallet(address, satPerVbyte, label)).toEqual(
      sentTransaction,
    );

    expect(mockSweepWallet).toHaveBeenCalledTimes(1);
    expect(mockSweepWallet).toHaveBeenCalledWith(address, satPerVbyte, label);
  });

  test('should blind Liquid addresses', () => {
    expect(walletLiquid.type).toEqual(CurrencyType.Liquid);
    const enc = walletLiquid.encodeAddress(encodeOutput);
    expect(enc.startsWith('lq1qq')).toBeTruthy();
  });

  test('should encode unblinded Liquid addresses', () => {
    const enc = walletLiquid.encodeAddress(encodeOutput, false);
    expect(enc.startsWith('ex')).toBeTruthy();
  });
});
