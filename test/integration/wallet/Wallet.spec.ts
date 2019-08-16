import { fromSeed } from 'bip32';
import { TxOutput } from 'bitcoinjs-lib';
import { OutputType, Networks } from 'boltz-core';
import { generateMnemonic, mnemonicToSeedSync } from 'bip39';
import Logger from '../../../lib/Logger';
import Errors from '../../../lib/wallet/Errors';
import Wallet from '../../../lib/wallet/Wallet';
import Database from '../../../lib/db/Database';
import { bitcoinClient } from '../chain/ChainClient.spec';
import UtxoRepository from '../../../lib/wallet/UtxoRepository';
import WalletRepository from '../../../lib/wallet/WalletRepository';
import OutputRepository from '../../../lib/wallet/OutputRepository';
import { waitForPromiseToBeTrue, generateAddress } from '../../Utils';
import { getOutputType, reverseBuffer, getHexBuffer } from '../../../lib/Utils';

describe('Wallet', () => {
  const derivationPath = 'm/0/0';
  const highestUsedIndex = 0;

  const mnemonic = generateMnemonic();
  const masterNode = fromSeed(mnemonicToSeedSync(mnemonic));

  const database = new Database(Logger.disabledLogger, ':memory:');

  const walletRepository = new WalletRepository();

  const utxoRepository = new UtxoRepository();
  const outputRepository = new OutputRepository();

  let wallet: Wallet;

  beforeAll(async () => {
    await database.init();

    const { blocks } = await bitcoinClient.getBlockchainInfo();

    await bitcoinClient.connect();

    // Create the foreign constraint for the "utxos" table
    await walletRepository.addWallet({
      derivationPath,
      highestUsedIndex,
      symbol: 'BTC',
      blockHeight: blocks,
    });

    wallet = new Wallet(
      Logger.disabledLogger,
      walletRepository,
      outputRepository,
      utxoRepository,
      masterNode,
      Networks.bitcoinRegtest,
      bitcoinClient,
      derivationPath,
      highestUsedIndex,
    );

    await wallet.init(blocks);
  });

  test('should recognize transactions to its addresses', async () => {
    const outputs: { address: string, amount: number }[] = [];
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
      outputs.push(address);
    }

    expectedBalance.totalBalance = expectedBalance.confirmedBalance;

    for (const output of outputs) {
      await bitcoinClient.sendToAddress(output.address, output.amount);
    }

    await waitForPromiseToBeTrue(async () => {
      const balance = await wallet.getBalance();
      return balance.unconfirmedBalance === expectedBalance.totalBalance;
    });

    await bitcoinClient.generate(1);

    await waitForPromiseToBeTrue(async () => {
      const balance = await wallet.getBalance();
      return balance.confirmedBalance === expectedBalance.confirmedBalance &&
        balance.totalBalance === expectedBalance.totalBalance;
    });
  });

  test('should spend coins', async () => {
    const { totalBalance } = await wallet.getBalance();
    const { address } = generateAddress(OutputType.Bech32);

    const { fee, vout, transaction } = await wallet.sendToAddress(address, OutputType.Bech32, false, totalBalance - 2000, 2);

    await bitcoinClient.sendRawTransaction(transaction.toHex());
    await bitcoinClient.generate(1);

    expect(vout).toEqual(0);
    expect(fee).toEqual(758);
    expect(transaction.ins.length).toEqual(3);

    await waitForPromiseToBeTrue(async () => {
      const balance = await wallet.getBalance();
      return balance.unconfirmedBalance === 0;
    });

    const newBalance = await wallet.getBalance();
    expect(newBalance.totalBalance).toBeLessThan(totalBalance);
  });

  test('should spend all coins', async () => {
    const address = await wallet.getNewAddress(OutputType.Bech32);

    await bitcoinClient.sendToAddress(address, 100000000);
    await bitcoinClient.sendToAddress(address, 100000000);

    await bitcoinClient.generate(1);

    await waitForPromiseToBeTrue(async () => {
      const balance = await wallet.getBalance();

      return balance.unconfirmedBalance === 0;
    });

    const { totalBalance } = await wallet.getBalance();

    const { transaction } = await wallet.sendToAddress(address, OutputType.Bech32, false, 0, 2, true);
    const out = transaction.outs[0] as TxOutput;

    expect(transaction.outs.length).toEqual(1);
    expect(out.value).toEqual(totalBalance - 490);
  });

  test('should prefer spending confirmed coins', async () => {
    const address = await wallet.getNewAddress(OutputType.Bech32);

    await bitcoinClient.sendToAddress(address, 100000000);
    await bitcoinClient.generate(1);

    await waitForPromiseToBeTrue(async () => {
      const balance = await wallet.getBalance();

      return balance.unconfirmedBalance === 0;
    });

    const unconfirmedTransactionId = await bitcoinClient.sendToAddress(address, 100000000);
    const unconfirmedTransactionHash = reverseBuffer(
      getHexBuffer(
        unconfirmedTransactionId,
      ),
    );

    await waitForPromiseToBeTrue(async () => {
      const balance = await wallet.getBalance();
      return balance.unconfirmedBalance !== 0;
    });

    const { transaction } = await wallet.sendToAddress(address, OutputType.Bech32, false, 1, 2);

    for (const input of transaction.ins) {
      expect(input.hash).not.toEqual(unconfirmedTransactionHash);
    }
  });

  test('should handle errors gracefully', async () => {
    await expect(
      wallet.sendToAddress(
        await wallet.getNewAddress(OutputType.Bech32),
        OutputType.Bech32,
        false,
        Number.MAX_SAFE_INTEGER,
      ),
    ).rejects.toEqual(Errors.NOT_ENOUGH_FUNDS(Number.MAX_SAFE_INTEGER));
  });

  afterAll(async () => {
    await bitcoinClient.disconnect();
  });
});
