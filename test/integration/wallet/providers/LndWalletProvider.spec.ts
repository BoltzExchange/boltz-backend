import { wait } from '../../../Utils';
import Logger from '../../../../lib/Logger';
import { bitcoinLndClient, bitcoinClient } from '../../Nodes';
import { coinsToSatoshis } from '../../../../lib/DenominationConverter';
import LndWalletProvider from '../../../../lib/wallet/providers/LndWalletProvider';
import { ListUnspentRequest, ListUnspentResponse } from '../../../../lib/proto/lndrpc_pb';
import { SentTransaction } from '../../../../lib/wallet/providers/WalletProviderInterface';

describe('LndWalletProvider', () => {
  const provider = new LndWalletProvider(Logger.disabledLogger, bitcoinLndClient, bitcoinClient);

  const verifySentTransaction = async (sentTransaction: SentTransaction, destination: string, amount?: number) => {
    const rawTransaction = await bitcoinClient.getRawTransactionVerbose(sentTransaction.transactionId);

    expect(sentTransaction.transactionId).toEqual(sentTransaction.transaction.getId());

    if (amount) {
      expect(coinsToSatoshis(rawTransaction.vout[sentTransaction.vout].value)).toEqual(amount);
    }

    const { transactionsList } = await bitcoinLndClient.getOnchainTransactions();

    for (let i = 0; i < transactionsList.length; i += 1) {
      const transaction = transactionsList[i];

      if (transaction.txHash === sentTransaction.transactionId) {
        expect(sentTransaction.fee).toEqual(transaction.totalFees);
        break;
      }

      // Could not find the sent lnd transaction and therefore not verify returned values
      if (i + 1 === transactionsList.length) {
        throw 'could not find sent LND transaction';
      }
    }

    const { utxosList } = await new Promise<ListUnspentResponse.AsObject>((resolve) => {
      bitcoinLndClient['lightning']!.listUnspent(new ListUnspentRequest(), bitcoinLndClient['meta'], (_, response) => {
        resolve(response.toObject());
      });
    });

    for (let i = 0; i < utxosList.length; i += 1) {
      const utxo = utxosList[i];

      if (utxo.outpoint!.txidStr === sentTransaction.transactionId && utxo.outpoint!.outputIndex === sentTransaction.vout) {
        expect(utxo.address).toEqual(destination);

        if (amount) {
          expect(utxo.amountSat).toEqual(amount);
        }

        break;
      }

      // Could not find the lnd uxto and therefore not verify returned values
      if (i + 1 === utxosList.length) {
        throw 'could not find LND UTXO';
      }
    }
  };

  beforeAll(async () => {
    await bitcoinLndClient.connect(false);
  });

  test('should generate addresses', async () => {
    expect((await provider.newAddress()).startsWith('bcrt1')).toBeTruthy();
  });

  test('should get balance', async () => {
    const unconfirmedAmount = 3498572;

    await bitcoinClient.generate(1);
    await bitcoinClient.sendToAddress(await provider.newAddress(), 3498572);

    await wait(100);

    const balance = await provider.getBalance();

    expect(balance.confirmedBalance).toBeGreaterThan(0);
    expect(balance.unconfirmedBalance).toEqual(unconfirmedAmount);

    expect(balance.totalBalance).toEqual(balance.confirmedBalance + balance.unconfirmedBalance);
  });

  test('should send transactions', async () => {
    const amount = 2498572;
    const destination = await provider.newAddress();

    const sentTransaction = await provider.sendToAddress(destination, amount);

    await verifySentTransaction(sentTransaction, destination, amount);
  });

  test('should sweep wallets', async () => {
    await bitcoinClient.generate(1);

    const destination = await provider.newAddress();
    const sentTransaction = await provider.sweepWallet(destination);

    await verifySentTransaction(sentTransaction, destination);

    expect((await provider.getBalance()).confirmedBalance).toEqual(0);
  });

  afterAll(async () => {
    await bitcoinClient.generate(1);
    bitcoinLndClient.disconnect();
  });
});
