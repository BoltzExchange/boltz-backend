import { expect } from 'chai';
import { mock } from 'ts-mockito';
import fs from 'fs';
import bip32 from 'bip32';
import bip39 from 'bip39';
import { Networks } from 'boltz-core';
import WalletManager from '../../../lib/wallet/WalletManager';
import WalletErrors from '../../../lib/wallet/Errors';
import ChainClient from '../../../lib/chain/ChainClient';
import LndClient from '../../../lib/lightning/LndClient';
import Logger from '../../../lib/Logger';
import Database from '../../../lib/db/Database';
import WalletRepository from '../../../lib/wallet/WalletRepository';

describe('WalletManager', () => {
  const mnemonic = bip39.generateMnemonic();

  const database = new Database(Logger.disabledLogger, ':memory:');
  const repository = new WalletRepository(database.models);

  const chainClient = mock(ChainClient);
  const lndClient = mock(LndClient);

  const currencies = [
    {
      chainClient,
      lndClient,
      symbol: 'BTC',
      network: Networks.bitcoinRegtest,
    },
    {
      chainClient,
      lndClient,
      symbol: 'LTC',
      network: Networks.litecoinRegtest,
    },
  ];
  const mnemonicpath = 'mnemonic.dat';

  let walletManager: WalletManager;

  function removeWalletFile() {
    if (fs.existsSync(mnemonicpath)) {
      fs.unlinkSync(mnemonicpath);
    }
  }

  before(async () => {
    removeWalletFile();

    await database.init();
  });

  it('should not initialize without wallet file', () => {
    expect(() => new WalletManager(Logger.disabledLogger, currencies, database, mnemonicpath)).to.throw(WalletErrors.NOT_INITIALIZED().message);
  });

  it('should initialize a new wallet for each currency', async () => {
    walletManager = WalletManager.fromMnemonic(Logger.disabledLogger, mnemonic, mnemonicpath, currencies, database);
    await walletManager.init();

    let index = 0;

    for (const currency of currencies) {
      const wallet = walletManager.wallets.get(currency.symbol);
      expect(wallet).to.not.be.undefined;

      const { derivationPath, highestUsedIndex } = wallet!;

      // Compare to the values in the database
      const dbWallet = await repository.getWallet(currency.symbol);

      expect(derivationPath).to.be.equal(dbWallet!.derivationPath);
      expect(highestUsedIndex).to.be.equal(dbWallet!.highestUsedIndex);

      // Compare to the expected values
      expect(derivationPath).to.be.equal(`m/0/${index}`);
      expect(highestUsedIndex).to.be.equal(0);

      index += 1;
    }
  });

  it('should write and read the mnemonic', () => {
    expect(fs.existsSync(mnemonicpath)).to.be.true;

    const mnemonicFile = walletManager['loadMnemonic'](mnemonicpath);
    expect(mnemonicFile).to.be.equal(bip32.fromSeed(bip39.mnemonicToSeed(mnemonic)).toBase58());
  });

  it('should not accept invalid mnemonics', () => {
    const invalidMnemonic = 'invalid';

    expect(() => WalletManager.fromMnemonic(Logger.disabledLogger, invalidMnemonic, '', [], database))
      .to.throw(WalletErrors.INVALID_MNEMONIC(invalidMnemonic).message);
  });

  after(async () => {
    removeWalletFile();
  });
});
