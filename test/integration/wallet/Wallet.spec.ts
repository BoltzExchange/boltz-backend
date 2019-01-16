import { expect } from 'chai';
import { OutputType, Networks } from 'boltz-core';
import bip32 from 'bip32';
import bip39 from 'bip39';
import Wallet from '../../../lib/wallet/Wallet';
import { btcdClient, btcManager, btcAddress } from '../chain/ChainClient.spec';
import Logger from '../../../lib/Logger';
import Database from '../../../lib/db/Database';
import UtxoRepository from '../../../lib/wallet/UtxoRepository';
import WalletRepository from '../../../lib/wallet/WalletRepository';
import { getOutputType } from '../../../lib/Utils';
import OutputRepository from '../../../lib/wallet/OutputRepository';

// TODO: test detection of UTXOs in mempool
describe('Wallet', () => {
  const derivationPath = 'm/0/0';
  const highestUsedIndex = 0;

  const mnemonic = bip39.generateMnemonic();
  const masterNode = bip32.fromSeed(bip39.mnemonicToSeed(mnemonic));

  const database = new Database(Logger.disabledLogger, ':memory:');
  const walletRepository = new WalletRepository(database.models);
  const outputRepository = new OutputRepository(database.models);
  const utxoRepository = new UtxoRepository(database.models);

  const wallet = new Wallet(
    Logger.disabledLogger,
    walletRepository,
    outputRepository,
    utxoRepository,
    masterNode,
    Networks.bitcoinSimnet,
    btcdClient,
    derivationPath,
    highestUsedIndex,
  );

  let walletBalance: number;

  const confirmedBalancePromise = () => {
    return new Promise<void>((resolve) => {
      const interval = setInterval(async () => {
        const balance = await wallet.getBalance();

        if (balance.unconfirmedBalance === 0) {
          clearInterval(interval);
          resolve();
        }
      }, 100);
    });
  };

  before(async () => {
    await btcdClient.connect();
    await database.init();

    // Create the foreign constraint for the "utxos" table
    const walletRepository = new WalletRepository(database.models);
    await walletRepository.addWallet({
      derivationPath,
      highestUsedIndex,
      symbol: 'BTC',
    });
  });

  it('should recognize transactions to its addresses', async () => {
    const addresses: { address: string, amount: number }[] = [];
    const expectedBalance = {
      confirmedBalance: 0,
      unconfirmedBalance: 0,
      totalBalance: 0,
    };

    for (let i = 0; i < 3; i += 1) {
      const outputType = getOutputType(i);

      const address = {
        address: await wallet.getNewAddress(outputType),
        amount: (i + 1) * 10000,
      };

      expectedBalance.confirmedBalance += address.amount;
      addresses.push(address);
    }

    expectedBalance.totalBalance = expectedBalance.confirmedBalance;

    for (const address of addresses) {
      const tx = btcManager.constructTransaction(address.address, address.amount);
      await btcdClient.sendRawTransaction(tx.toHex());
    }

    await btcdClient.generate(1);

    await confirmedBalancePromise();

    expect(await wallet.getBalance()).to.be.deep.equal(expectedBalance);

    walletBalance = expectedBalance.confirmedBalance;
  });

  it('should spend UTXOs', async () => {
    expect(walletBalance).to.not.be.undefined;

    const destinationAddress = btcAddress;
    const destinationAmount = walletBalance / 2;

    const { tx, vout } = await wallet.sendToAddress(destinationAddress, OutputType.Legacy, false, destinationAmount);

    await btcdClient.sendRawTransaction(tx.toHex());
    await btcdClient.generate(1);

    expect(vout).to.be.equal(0);

    await confirmedBalancePromise();

    const balance = await wallet.getBalance();
    expect(balance.confirmedBalance).to.be.lessThan(walletBalance);
  });

  after(async () => {
    await btcdClient.disconnect();
  });
});
