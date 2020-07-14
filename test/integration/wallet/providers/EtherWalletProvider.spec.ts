import { BigNumber } from 'ethers';
import Logger from '../../../../lib/Logger';
import { getSigner } from '../EthereumTools';
import { etherDecimals } from '../../../../lib/consts/Consts';
import EtherWalletProvider from '../../../../lib/wallet/providers/EtherWalletProvider';

describe('EtherWalletProvider', () => {
  const { provider, signer } = getSigner();
  const wallet = new EtherWalletProvider(Logger.disabledLogger, signer);

  test('should get address', async () => {
    expect(await wallet.getAddress()).toEqual('0xA7430D5ef25467365112C21A0e803cc72905cC50');
  });

  test('should get balance', async () => {
    const balance = (await signer.getBalance()).div(etherDecimals).toNumber();

    expect(await wallet.getBalance()).toEqual({
      totalBalance: balance,
      confirmedBalance: balance,
      unconfirmedBalance: 0,
    });
  });

  test('should send to address', async () => {
    const amount = 100000000;
    const { transactionId } = await wallet.sendToAddress(await signer.getAddress(), amount);

    const transaction = await provider.getTransaction(transactionId);
    expect(transaction.value).toEqual(BigNumber.from(amount).mul(etherDecimals));
  });

  test('should sweep wallet', async () => {
    const balance = await signer.getBalance();

    const { transactionId } = await wallet.sweepWallet(await signer.getAddress());

    const transaction = await provider.getTransaction(transactionId);
    const receipt = await provider.getTransactionReceipt(transactionId);

    const sentInTransaction = transaction.value.add(receipt.gasUsed.mul(transaction.gasPrice));

    expect(balance).toEqual(sentInTransaction);
  });
});
