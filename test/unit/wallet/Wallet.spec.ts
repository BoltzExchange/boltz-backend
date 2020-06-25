import { fromSeed } from 'bip32';
import ops from '@boltz/bitcoin-ops';
import { Networks } from 'boltz-core';
import { Transaction, script, crypto } from 'bitcoinjs-lib';
import { generateMnemonic, mnemonicToSeedSync } from 'bip39';
import Logger from '../../../lib/Logger';
import Wallet from '../../../lib/wallet/Wallet';
import Database from '../../../lib/db/Database';
import { getHexBuffer } from '../../../lib/Utils';
import KeyRepository from '../../../lib/db/KeyRepository';
import LndWalletProvider from '../../../lib/wallet/providers/LndWalletProvider';
import { WalletBalance, SentTransaction } from '../../../lib/wallet/providers/WalletProviderInterface';

const symbol = 'BTC';

const balance: WalletBalance = {
  totalBalance: 3,
  confirmedBalance: 1,
  unconfirmedBalance: 2,
};

const mockGetBalance = jest.fn().mockResolvedValue(balance);

const address = 'bcrt1qu5m32tnhs3wl633qcg3yae8u0mqkjkm5txrqf9';

const mockNewAddress = jest.fn().mockResolvedValue(address);

const sentTransaction: SentTransaction = {
  fee: 1,
  vout: 0,
  transaction: {} as any as Transaction,
  transactionId: 'b866402106a97f06f84215abf545ef3b455346fd998845731385f6cdcb12d96d',
};

const mockSendToAddress = jest.fn().mockResolvedValue(sentTransaction);
const mockSweepWallet = jest.fn().mockResolvedValue(sentTransaction);

jest.mock('../../../lib/wallet/providers/LndWalletProvider', () => {
  return jest.fn().mockImplementation(() => {
    return {
      symbol,

      getBalance: mockGetBalance,
      newAddress: mockNewAddress,

      sendToAddress: mockSendToAddress,
      sweepWallet: mockSweepWallet,
    };
  });
});

const mockedLndWalletProvider = <jest.Mock<LndWalletProvider>>LndWalletProvider;

describe('Wallet', () => {
  const encodeOutput = getHexBuffer('00147ca6c71979907c36d5d62f325d6d8104a8497445');
  const encodedAddress = 'bcrt1q0jnvwxtejp7rd4wk9ue96mvpqj5yjaz9v7vte5';

  const mnemonic = generateMnemonic();
  const masterNode = fromSeed(mnemonicToSeedSync(mnemonic));

  const database = new Database(Logger.disabledLogger, ':memory:');

  const keyRepository = new KeyRepository();

  const derivationPath = 'm/0/0';
  let highestUsedIndex = 21;

  const network = Networks.bitcoinRegtest;

  const walletProvider = new mockedLndWalletProvider();

  const wallet = new Wallet(
    network,
    derivationPath,
    highestUsedIndex,
    Logger.disabledLogger,
    masterNode,
    keyRepository,
    walletProvider,
  );

  const incrementIndex = () => {
    highestUsedIndex = highestUsedIndex + 1;
  };

  const getKeysByIndex = (index: number) => {
    return masterNode.derivePath(`${derivationPath}/${index}`);
  };

  beforeAll(async () => {
    await database.init();

    await keyRepository.addKeyProvider({
      symbol,
      derivationPath,
      highestUsedIndex,
    });
  });

  test('should set symbol' , () => {
    expect(wallet.symbol).toEqual(symbol);
  });

  test('should get correct address from index', () => {
    const index = 1;

    expect(wallet.getKeysByIndex(index)).toEqual(getKeysByIndex(index));
  });

  test('should get new keys', () => {
    incrementIndex();

    const { keys, index } = wallet.getNewKeys();

    expect(keys).toEqual(getKeysByIndex(highestUsedIndex));
    expect(index).toEqual(wallet.highestUsedIndex);

    expect(wallet.highestUsedIndex).toEqual(highestUsedIndex);
  });

  test('should encode addresses', () => {
    expect(wallet.encodeAddress(encodeOutput)).toEqual(encodedAddress);
  });

  test('should ignore OP_RETURN outputs', () => {
    const outputScript = script.compile([
      ops.OP_RETURN,
      crypto.sha256(Buffer.alloc(0)),
    ]);

    expect(wallet.encodeAddress(outputScript)).toEqual('');
  });

  test('should decode addresses', () => {
    expect(wallet.decodeAddress(encodedAddress)).toEqual(encodeOutput);
  });

  test('should update highest used index in database', async () => {
    const dbKeyProvider = await keyRepository.getKeyProvider(symbol);

    expect(dbKeyProvider!.highestUsedIndex).toEqual(highestUsedIndex);
  });

  test('should get a new address', async () => {
    expect(await wallet.newAddress()).toEqual(address);

    expect(mockNewAddress).toHaveBeenCalledTimes(1);
  });

  test('should get correct balance', async () => {
    expect(await wallet.getBalance()).toEqual(balance);

    expect(mockGetBalance).toHaveBeenCalledTimes(1);
  });

  test('should send coins to address', async () => {
    const address = '2N94uHZqzv6q5UeFjgKcG6iqeyz1UJNq9Ye';
    const amount = 372498;
    const satPerVbyte = 18;

    expect(await wallet.sendToAddress(address, amount, satPerVbyte)).toEqual(sentTransaction);

    expect(mockSendToAddress).toHaveBeenCalledTimes(1);
  });

  test('should sweep wallet', async () => {
    const address = 'bcrt1qk4pces7y5csg3qv8gr4ftghgp8gzgg3lv3nwju';
    const satPerVbyte = 2;

    expect(await wallet.sweepWallet(address, satPerVbyte)).toEqual(sentTransaction);

    expect(mockSweepWallet).toHaveBeenCalledTimes(1);
  });

  afterAll(async () => {
    await database.close();
  });
});
