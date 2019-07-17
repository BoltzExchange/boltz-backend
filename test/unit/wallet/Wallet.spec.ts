import { fromSeed } from 'bip32';
import { address, crypto } from 'bitcoinjs-lib';
import { Networks, OutputType } from 'boltz-core';
import { generateMnemonic, mnemonicToSeedSync } from 'bip39';
import Logger from '../../../lib/Logger';
import Wallet from '../../../lib/wallet/Wallet';
import Database from '../../../lib/db/Database';
import ChainClient from '../../../lib/chain/ChainClient';
import UtxoRepository from '../../../lib/wallet/UtxoRepository';
import WalletRepository from '../../../lib/wallet/WalletRepository';
import OutputRepository from '../../../lib/wallet/OutputRepository';
import { getPubkeyHashFunction, getHexBuffer } from '../../../lib/Utils';

const currency = 'BTC';

jest.mock('../../../lib/chain/ChainClient', () => {
  return jest.fn().mockImplementation(() => {
    return {
      symbol: currency,
      on: () => {},
      updateOutputFilter: (_: any) => {},
    };
  });
});

const mockedChainClient = <jest.Mock<ChainClient>><any>ChainClient;

describe('Wallet', () => {
  const mnemonic = generateMnemonic();
  const masterNode = fromSeed(mnemonicToSeedSync(mnemonic));

  const database = new Database(Logger.disabledLogger, ':memory:');
  const walletRepository = new WalletRepository();
  const outputRepository = new OutputRepository();
  const utxoRepository = new UtxoRepository();

  const derivationPath = 'm/0/0';
  let highestUsedIndex = 21;

  const network = Networks.bitcoinRegtest;

  const chainClient = new mockedChainClient();

  const wallet = new Wallet(
    Logger.disabledLogger,
    walletRepository,
    outputRepository,
    utxoRepository,
    masterNode,
    network,
    chainClient,
    derivationPath,
    highestUsedIndex,
  );

  const incrementIndex = () => {
    highestUsedIndex = highestUsedIndex + 1;
  };

  const getKeysByIndex = (index: number) => {
    return masterNode.derivePath(`${derivationPath}/${index}`);
  };

  beforeAll(async () => {
    await database.init();

    // Create the foreign constraint for the "utxos" table
    await walletRepository.addWallet({
      derivationPath,
      highestUsedIndex,
      symbol: currency,
      blockHeight: 0,
    });
  });

  test('should get correct address from index', () => {
    const index = 1;

    expect(wallet.getKeysByIndex(index)).toEqual(getKeysByIndex(index));
  });

  test('should get new keys', () => {
    incrementIndex();

    const { keys, index } = wallet.getNewKeys();

    expect(keys).toEqual(getKeysByIndex(highestUsedIndex));
    expect(index).toEqual(wallet.highestIndex);

    expect(wallet.highestIndex).toEqual(highestUsedIndex);
  });

  test('should encode an address', () => {
    const output = getHexBuffer('00147ca6c71979907c36d5d62f325d6d8104a8497445');
    const address = 'bcrt1q0jnvwxtejp7rd4wk9ue96mvpqj5yjaz9v7vte5';

    expect(wallet.encodeAddress(output)).toEqual(address);
  });

  test('should get a new address', async () => {
    incrementIndex();

    const outputType = OutputType.Bech32;

    const keys = getKeysByIndex(highestUsedIndex);
    const encodeFunction = getPubkeyHashFunction(outputType);
    const outputScript = encodeFunction(crypto.hash160(keys.publicKey)) as Buffer;
    const outputAddress = address.fromOutputScript(outputScript, network);

    expect(await wallet.getNewAddress(outputType)).toEqual(outputAddress);
  });

  test('should get correct balance', async () => {
    const expectedBalance = {
      confirmedBalance: 0,
      unconfirmedBalance: 0,
      totalBalance: 0,
    };

    const { id } = await outputRepository.addOutput({
      script: '',
      // tslint:disable-next-line:no-null-keyword
      redeemScript: null,
      currency: 'BTC',
      keyIndex: 0,
      type: 0,
    });

    for (let i = 0; i <= 10; i += 1) {
      const confirmed = i % 2 === 0;
      const value = Math.floor(Math.random() * 1000000) + 1;

      await utxoRepository.addUtxo({
        value,
        confirmed,
        vout: 0,
        spent: false,
        outputId: id,
        currency: 'BTC',
        txId: `${value}`,
      });

      if (confirmed) {
        expectedBalance.confirmedBalance += value;
      } else {
        expectedBalance.unconfirmedBalance += value;
      }

      expectedBalance.totalBalance += value;
    }

    expect(await wallet.getBalance()).toEqual(expectedBalance);
  });

  test('should update highest used index in database', async () => {
    const dbWallet = await walletRepository.getWallet(currency);

    expect(dbWallet.highestUsedIndex).toEqual(highestUsedIndex);
  });

  afterAll(async () => {
    await database.close();
  });
});
