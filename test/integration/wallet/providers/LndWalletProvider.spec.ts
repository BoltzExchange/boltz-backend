import { coinsToSatoshis } from '../../../../lib/DenominationConverter';
import Logger from '../../../../lib/Logger';
import type { ListUnspentResponse } from '../../../../lib/proto/lnd/rpc_pb';
import { ListUnspentRequest } from '../../../../lib/proto/lnd/rpc_pb';
import LndWalletProvider from '../../../../lib/wallet/providers/LndWalletProvider';
import type { SentTransaction } from '../../../../lib/wallet/providers/WalletProviderInterface';
import { wait } from '../../../Utils';
import { bitcoinClient, bitcoinLndClient } from '../../Nodes';

const spyGetOnchainTransactions = jest.spyOn(
  bitcoinLndClient,
  'getOnchainTransactions',
);

describe('LndWalletProvider', () => {
  const provider = new LndWalletProvider(
    Logger.disabledLogger,
    bitcoinLndClient,
    bitcoinClient,
  );

  beforeAll(async () => {
    await bitcoinLndClient.connect(false);
  });

  beforeEach(async () => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await bitcoinClient.generate(1);
    bitcoinLndClient.disconnect();
  });

  const verifySentTransaction = async (
    sentTransaction: SentTransaction,
    destination: string,
    amount: number,
    isSweep: boolean,
  ) => {
    const rawTransaction = await bitcoinClient.getRawTransactionVerbose(
      sentTransaction.transactionId,
    );

    expect(sentTransaction.transactionId).toEqual(
      sentTransaction.transaction!.getId(),
    );

    const expectedAmount = isSweep
      ? Math.round(amount - sentTransaction.fee!)
      : amount;
    expect(
      Math.round(
        coinsToSatoshis(rawTransaction.vout[sentTransaction.vout!].value),
      ),
    ).toEqual(expectedAmount);

    const { transactionsList } =
      await bitcoinLndClient.getOnchainTransactions(0);

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

    const { utxosList } = await new Promise<ListUnspentResponse.AsObject>(
      (resolve) => {
        bitcoinLndClient['lightning']!.listUnspent(
          new ListUnspentRequest(),
          bitcoinLndClient['meta'],
          (_, response) => {
            resolve(response.toObject());
          },
        );
      },
    );

    const utxo = utxosList.find(
      (u) =>
        u.outpoint!.txidStr === sentTransaction.transactionId &&
        u.outpoint!.outputIndex === sentTransaction.vout,
    );
    expect(utxo).not.toBeUndefined();
    expect(utxo!.address).toEqual(destination);
    expect(utxo!.amountSat).toEqual(expectedAmount);
  };

  test('should generate addresses', async () => {
    expect((await provider.getAddress('')).startsWith('bcrt1')).toBeTruthy();
  });

  test('should get balance', async () => {
    const unconfirmedAmount = 3498572;

    await bitcoinClient.generate(1);
    await bitcoinClient.sendToAddress(
      await provider.getAddress(''),
      3498572,
      undefined,
      false,
      '',
    );

    await wait(100);

    const balance = await provider.getBalance();

    expect(balance.confirmedBalance).toBeGreaterThan(0);
    expect(balance.unconfirmedBalance).toEqual(unconfirmedAmount);
  });

  test('should send transactions', async () => {
    const { blockHeight } = await bitcoinLndClient.getInfo();

    const amount = 2498572;
    const label = 'send LND coins';
    const destination = await provider.getAddress('');

    const sentTransaction = await provider.sendToAddress(
      destination,
      amount,
      undefined,
      label,
    );

    expect(spyGetOnchainTransactions).toHaveBeenCalledTimes(1);
    expect(spyGetOnchainTransactions).toHaveBeenCalledWith(blockHeight);

    const transactions = await bitcoinLndClient.getOnchainTransactions(0);
    const transaction = transactions.transactionsList.find(
      (t) => t.txHash === sentTransaction.transactionId,
    );

    expect(transaction).not.toBeUndefined();
    expect(transaction!.label).toEqual(label);

    await verifySentTransaction(sentTransaction, destination, amount, false);
  });

  test('should sweep the wallet', async () => {
    await bitcoinClient.generate(1);
    await wait(250);

    const { blockHeight } = await bitcoinLndClient.getInfo();
    const balance = await provider.getBalance();

    const destination = await provider.getAddress('');
    const label = 'LND sweep';

    const sentTransaction = await provider.sweepWallet(
      destination,
      undefined,
      label,
    );

    expect(spyGetOnchainTransactions).toHaveBeenCalledTimes(1);
    expect(spyGetOnchainTransactions).toHaveBeenCalledWith(blockHeight);

    const transactions = await bitcoinLndClient.getOnchainTransactions(0);
    const transaction = transactions.transactionsList.find(
      (t) => t.txHash === sentTransaction.transactionId,
    );

    expect(transaction).not.toBeUndefined();
    expect(transaction!.label).toEqual(label);

    await verifySentTransaction(
      sentTransaction,
      destination,
      balance.confirmedBalance + balance.unconfirmedBalance,
      true,
    );

    expect((await provider.getBalance()).confirmedBalance).toEqual(0);
  });
});
