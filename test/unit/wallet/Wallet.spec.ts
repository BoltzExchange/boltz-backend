import { BIP32Factory } from 'bip32';
import { randomBytes } from 'crypto';
import ops from '@boltz/bitcoin-ops';
import { Networks } from 'boltz-core';
import * as ecc from 'tiny-secp256k1';
import { SLIP77Factory } from 'slip77';
import { networks as networkLiquid } from 'liquidjs-lib';
import { crypto, script, Transaction } from 'bitcoinjs-lib';
import { generateMnemonic, mnemonicToSeedSync } from 'bip39';
import Logger from '../../../lib/Logger';
import Wallet from '../../../lib/wallet/Wallet';
import Database from '../../../lib/db/Database';
import { getHexBuffer } from '../../../lib/Utils';
import { CurrencyType } from '../../../lib/consts/Enums';
import WalletLiquid from '../../../lib/wallet/WalletLiquid';
import KeyRepository from '../../../lib/db/repositories/KeyRepository';
import LndWalletProvider from '../../../lib/wallet/providers/LndWalletProvider';
import {
  SentTransaction,
  WalletBalance,
} from '../../../lib/wallet/providers/WalletProviderInterface';

const bip32 = BIP32Factory(ecc);
const slip77 = SLIP77Factory(ecc);

const symbol = 'BTC';

const balance: WalletBalance = {
  totalBalance: 3,
  confirmedBalance: 1,
  unconfirmedBalance: 2,
};

const mockGetBalance = jest.fn().mockResolvedValue(balance);

const address = 'bcrt1qu5m32tnhs3wl633qcg3yae8u0mqkjkm5txrqf9';

const mockGetAddress = jest.fn().mockResolvedValue(address);

const sentTransaction: SentTransaction = {
  fee: 1,
  vout: 0,
  transaction: {} as any as Transaction,
  transactionId:
    'b866402106a97f06f84215abf545ef3b455346fd998845731385f6cdcb12d96d',
};

const mockSendToAddress = jest.fn().mockResolvedValue(sentTransaction);
const mockSweepWallet = jest.fn().mockResolvedValue(sentTransaction);

jest.mock('../../../lib/wallet/providers/LndWalletProvider', () => {
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

const mockedLndWalletProvider = <jest.Mock<LndWalletProvider>>LndWalletProvider;

describe('Wallet', () => {
  const encodeOutput = getHexBuffer(
    '00147ca6c71979907c36d5d62f325d6d8104a8497445',
  );
  const encodedAddress = 'bcrt1q0jnvwxtejp7rd4wk9ue96mvpqj5yjaz9v7vte5';

  const mnemonic = generateMnemonic();
  const masterNode = bip32.fromSeed(mnemonicToSeedSync(mnemonic));

  const database = new Database(Logger.disabledLogger, ':memory:');

  const derivationPath = 'm/0/0';
  let highestUsedIndex = 21;

  const network = Networks.bitcoinRegtest;

  const walletProvider = new mockedLndWalletProvider();

  const wallet = new Wallet(Logger.disabledLogger, walletProvider);

  wallet.initKeyProvider(network, derivationPath, highestUsedIndex, masterNode);

  const incrementIndex = () => {
    highestUsedIndex = highestUsedIndex + 1;
  };

  const getKeysByIndex = (index: number) => {
    return masterNode.derivePath(`${derivationPath}/${index}`);
  };

  beforeAll(async () => {
    await database.init();

    await KeyRepository.addKeyProvider({
      symbol,
      derivationPath,
      highestUsedIndex,
    });
  });

  test('should init', () => {
    expect(wallet.symbol).toEqual(symbol);
    expect(wallet.type).toEqual(CurrencyType.BitcoinLike);
  });

  test('should get correct address from index', () => {
    const index = 1;

    expect(wallet.getKeysByIndex(index)).toEqual(getKeysByIndex(index));
  });

  test('should get new keys', () => {
    incrementIndex();

    const { keys, index } = wallet.getNewKeys();

    expect(keys).toEqual(getKeysByIndex(highestUsedIndex));
    expect(index).toEqual(wallet['highestUsedIndex']);

    expect(wallet['highestUsedIndex']).toEqual(highestUsedIndex);
  });

  test('should encode addresses', () => {
    expect(wallet.encodeAddress(encodeOutput)).toEqual(encodedAddress);
  });

  test('should ignore OP_RETURN outputs', () => {
    const outputScript = script.compile([
      ops.OP_RETURN,
      crypto.sha256(randomBytes(64)),
    ]);

    expect(wallet.encodeAddress(outputScript)).toEqual('');
  });

  test('should ignore all invalid addresses', () => {
    const invalidScripts = [
      script.compile([ops.OP_1, randomBytes(32)]),
      script.compile([randomBytes(32)]),
      script.compile([ops.OP_6]),
      script.compile([
        ops.OP_NUMEQUAL,
        ops.OP_4,
        ops.OP_NOP1,
        ops.OP_NUMNOTEQUAL,
        ops.OP_CHECKSIGVERIFY,
      ]),
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
    expect(await wallet.getAddress()).toEqual(address);

    expect(mockGetAddress).toHaveBeenCalledTimes(1);
  });

  test('should get correct balance', async () => {
    expect(await wallet.getBalance()).toEqual(balance);

    expect(mockGetBalance).toHaveBeenCalledTimes(1);
  });

  test('should send coins to address', async () => {
    const address = '2N94uHZqzv6q5UeFjgKcG6iqeyz1UJNq9Ye';
    const amount = 372498;
    const satPerVbyte = 18;

    expect(await wallet.sendToAddress(address, amount, satPerVbyte)).toEqual(
      sentTransaction,
    );

    expect(mockSendToAddress).toHaveBeenCalledTimes(1);
  });

  test('should sweep wallet', async () => {
    const address = 'bcrt1qk4pces7y5csg3qv8gr4ftghgp8gzgg3lv3nwju';
    const satPerVbyte = 2;

    expect(await wallet.sweepWallet(address, satPerVbyte)).toEqual(
      sentTransaction,
    );

    expect(mockSweepWallet).toHaveBeenCalledTimes(1);
  });

  test('should blind Liquid addresses', () => {
    const walletLiquid = new WalletLiquid(
      Logger.disabledLogger,
      walletProvider,
      slip77.fromSeed(mnemonic),
    );
    expect(walletLiquid.type).toEqual(CurrencyType.Liquid);

    walletLiquid.initKeyProvider(
      networkLiquid.liquid,
      derivationPath,
      highestUsedIndex,
      masterNode,
    );

    expect(walletLiquid.encodeAddress(encodeOutput)).toEqual(
      'lq1qqw7njsv88f8cdq9uqenz4ydvnw9qcdrxcqzwe36xt9lsqhggmjwa6l9xcuvhnyruxm2avtejt4kczp9gf96y2ys6ef5ahk8gn',
    );
  });

  afterAll(async () => {
    await database.close();
  });
});
