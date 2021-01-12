import { Transaction } from 'bitcoinjs-lib';
import Logger from '../../../../lib/Logger';
import { bitcoinClient } from '../../Nodes';
import CoreWalletProvider from '../../../../lib/wallet/providers/CoreWalletProvider';
import { SentTransaction } from '../../../../lib/wallet/providers/WalletProviderInterface';

const testAddress = 'bcrt1q54g5dyexre4dg78ymnzz2y8h9xfptjrtxxakn6';

describe('CoreWalletProvider', () => {
  const provider = new CoreWalletProvider(Logger.disabledLogger, bitcoinClient);

  const verifySentTransaction = async (sentTransaction: SentTransaction, destination: string, amount: number, isSweep: boolean) => {
    const rawTransaction = await bitcoinClient.getRawTransactionVerbose(sentTransaction.transactionId);

    expect(sentTransaction.transactionId).toEqual(rawTransaction.txid);
    expect(sentTransaction.transactionId).toEqual(sentTransaction.transaction!.getId());
    expect(sentTransaction.transaction).toEqual(Transaction.fromHex(rawTransaction.hex));

    expect(rawTransaction.vout[sentTransaction.vout!].scriptPubKey.addresses.length).toEqual(1);
    expect(rawTransaction.vout[sentTransaction.vout!].scriptPubKey.addresses[0]).toEqual(destination);

    const expectedAmount = isSweep ? Math.round(amount - sentTransaction.fee!) : amount;
    expect(sentTransaction.transaction!.outs[sentTransaction.vout!].value).toEqual(expectedAmount);

    let outputSum = 0;

    for (const vout of sentTransaction.transaction!.outs) {
      outputSum += vout.value;
    }

    let inputSum = 0;

    for (const vin of rawTransaction.vin) {
      const inputTransaction = Transaction.fromHex(await bitcoinClient.getRawTransaction(vin.txid));
      inputSum += inputTransaction.outs[vin.vout].value;
    }

    expect(sentTransaction.fee).toEqual(inputSum - outputSum);
  };

  beforeEach(async () => {
    await bitcoinClient.generate(1);
  });

  it('should generate addresses', async () => {
    expect((await provider.getAddress()).startsWith('bcrt1')).toBeTruthy();
  });

  it('should get balance', async () => {
    const balance = await provider.getBalance();

    expect(balance.confirmedBalance).toBeGreaterThan(0);
    expect(balance.totalBalance).toEqual(balance.confirmedBalance + balance.unconfirmedBalance);
  });

  it('should send transactions', async () => {
    const amount = 212121;
    const sentTransaction = await provider.sendToAddress(testAddress, amount);

    await verifySentTransaction(sentTransaction, testAddress, amount, false);
  });

  it('should sweep the wallet', async () => {
    const balance = await provider.getBalance();
    const sentTransaction = await provider.sweepWallet(testAddress);

    await verifySentTransaction(sentTransaction, testAddress, balance.confirmedBalance, true);

    expect((await provider.getBalance()).confirmedBalance).toEqual(0);
  });
});
