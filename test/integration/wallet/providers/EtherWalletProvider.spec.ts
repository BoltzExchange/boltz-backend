import { BigNumber } from 'ethers';
import Logger from '../../../../lib/Logger';
import { etherDecimals } from '../../../../lib/consts/Consts';
import { fundSignerWallet, getSigner } from '../EthereumTools';
import EtherWalletProvider from '../../../../lib/wallet/providers/EtherWalletProvider';

describe('EtherWalletProvider', () => {
  const { provider, signer, etherBase } = getSigner();
  const wallet = new EtherWalletProvider(Logger.disabledLogger, signer);

  test('should get address', async () => {
    expect(await wallet.getAddress()).toEqual(await signer.getAddress());
  });

  test('should get balance', async () => {
    fundSignerWallet(signer, etherBase);

    const balance = (await signer.getBalance()).div(etherDecimals).toNumber();

    expect(await wallet.getBalance()).toEqual({
      totalBalance: balance,
      confirmedBalance: balance,
      unconfirmedBalance: 0,
    });
  });

  test('should send to address', async () => {
    const amount = 1000000;
    const { transactionId } = await wallet.sendToAddress(await signer.getAddress(), amount);

    const transaction = await provider.getTransaction(transactionId);
    expect(transaction.value).toEqual(BigNumber.from(amount).mul(etherDecimals));
  });

  test('should sweep wallet', async () => {
    const balance = await signer.getBalance();

    const { transactionId } = await wallet.sweepWallet(await etherBase.getAddress());

    const transaction = await provider.getTransaction(transactionId);
    const receipt = await provider.getTransactionReceipt(transactionId);

    const sentInTransaction = transaction.value.add(receipt.gasUsed.mul(transaction.gasPrice));

    expect(balance).toEqual(sentInTransaction);
    expect((await signer.getBalance()).toNumber()).toEqual(0);
  });

  afterAll(async () => {
    await provider.destroy();
  });
});
