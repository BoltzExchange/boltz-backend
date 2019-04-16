import { expect } from 'chai';
import { fromSeed } from 'bip32';
import { mock } from 'ts-mockito';
import { generateMnemonic, mnemonicToSeedSync } from 'bip39';
import { address, crypto } from 'bitcoinjs-lib';
import { Networks, OutputType } from 'boltz-core';
import Wallet from '../../../lib/wallet/Wallet';
import ChainClient from '../../../lib/chain/ChainClient';
import Logger from '../../../lib/Logger';
import Database from '../../../lib/db/Database';
import UtxoRepository from '../../../lib/wallet/UtxoRepository';
import WalletRepository from '../../../lib/wallet/WalletRepository';
import OutputRepository from '../../../lib/wallet/OutputRepository';
import { getPubkeyHashFunction, getHexBuffer } from '../../../lib/Utils';

describe('Wallet', () => {
  const currency = 'BTC';

  const mnemonic = generateMnemonic();
  const masterNode = fromSeed(mnemonicToSeedSync(mnemonic));

  const database = new Database(Logger.disabledLogger, ':memory:');
  const walletRepository = new WalletRepository();
  const outputRepository = new OutputRepository();
  const utxoRepository = new UtxoRepository();

  const derivationPath = 'm/0/0';
  let highestUsedIndex = 21;

  const network = Networks.bitcoinRegtest;

  const chainClientMock = mock(ChainClient);
  // "as any" is needed to force override a "readonly" value
  chainClientMock['symbol' as any] = currency;

  const wallet = new Wallet(
    Logger.disabledLogger,
    walletRepository,
    outputRepository,
    utxoRepository,
    masterNode,
    network,
    chainClientMock,
    derivationPath,
    highestUsedIndex,
  );

  const incrementIndex = () => {
    highestUsedIndex = highestUsedIndex + 1;
  };

  const getKeysByIndex = (index: number) => {
    return masterNode.derivePath(`${derivationPath}/${index}`);
  };

  before(async () => {
    await database.init();

    // Create the foreign constraint for the "utxos" table
    await walletRepository.addWallet({
      derivationPath,
      highestUsedIndex,
      symbol: currency,
      blockHeight: 0,
    });
  });

  it('should get correct address from index', () => {
    const index = 1;

    expect(wallet.getKeysByIndex(index)).to.be.deep.equal(getKeysByIndex(index));
  });

  it('should get new keys', () => {
    incrementIndex();

    const { keys, index } = wallet.getNewKeys();

    expect(keys).to.be.deep.equal(getKeysByIndex(highestUsedIndex));
    expect(index).to.be.equal(wallet.highestIndex);

    expect(wallet.highestIndex).to.be.equal(highestUsedIndex);
  });

  it('should encode an address', () => {
    const output = getHexBuffer('00147ca6c71979907c36d5d62f325d6d8104a8497445');
    const address = 'bcrt1q0jnvwxtejp7rd4wk9ue96mvpqj5yjaz9v7vte5';

    expect(wallet.encodeAddress(output)).to.be.equal(address);
  });

  it('should get a new address', async () => {
    incrementIndex();

    const outputType = OutputType.Bech32;

    const keys = getKeysByIndex(highestUsedIndex);
    const encodeFunction = getPubkeyHashFunction(outputType);
    const outputScript = encodeFunction(crypto.hash160(keys.publicKey)) as Buffer;
    const outputAddress = address.fromOutputScript(outputScript, network);

    expect(await wallet.getNewAddress(outputType)).to.be.equal(outputAddress);
  });

  it('should get correct balance', async () => {
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
        txHash: `${value}`,
      });

      if (confirmed) {
        expectedBalance.confirmedBalance += value;
      } else {
        expectedBalance.unconfirmedBalance += value;
      }

      expectedBalance.totalBalance += value;
    }

    expect(await wallet.getBalance()).to.be.deep.equal(expectedBalance);
  });

  it('should update highest used index in database', async () => {
    const dbWallet = await walletRepository.getWallet(currency);

    expect(dbWallet!.highestUsedIndex).to.be.equal(highestUsedIndex);
  });

  after(async () => {
    await database.close();
  });
});
