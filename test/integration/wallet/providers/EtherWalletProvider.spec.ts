import Logger from '../../../../lib/Logger';
import { etherDecimals } from '../../../../lib/consts/Consts';
import { EthereumSetup, fundSignerWallet, getSigner } from '../EthereumTools';
import EtherWalletProvider from '../../../../lib/wallet/providers/EtherWalletProvider';

describe('EtherWalletProvider', () => {
  let setup: EthereumSetup;
  let wallet: EtherWalletProvider;

  beforeAll(async () => {
    setup = await getSigner();
    wallet = new EtherWalletProvider(Logger.disabledLogger, setup.signer);
  });

  test('should get address', async () => {
    expect(await wallet.getAddress()).toEqual(await setup.signer.getAddress());
  });

  test('should get balance', async () => {
    await fundSignerWallet(setup.signer, setup.etherBase);

    const balance = Number(
      (await setup.provider.getBalance(await setup.signer.getAddress())) /
        etherDecimals,
    );

    expect(await wallet.getBalance()).toEqual({
      totalBalance: balance,
      confirmedBalance: balance,
      unconfirmedBalance: 0,
    });
  });

  test('should send to address', async () => {
    const amount = 1000000;
    const { transactionId } = await wallet.sendToAddress(
      await setup.signer.getAddress(),
      amount,
    );
    await setup.provider!.waitForTransaction(transactionId);

    const transaction = await setup.provider.getTransaction(transactionId);
    expect(transaction!.value).toEqual(BigInt(amount) * etherDecimals);
  });

  test('should sweep wallet', async () => {
    const balance = await setup.provider.getBalance(
      await setup.signer.getAddress(),
    );

    const { transactionId } = await wallet.sweepWallet(
      await setup.etherBase.getAddress(),
    );

    const transaction = await setup.provider.getTransaction(transactionId);
    const receipt = await setup.provider.waitForTransaction(transactionId);

    const sentInTransaction =
      transaction!.value + receipt!.gasUsed * transaction!.maxFeePerGas!;

    expect(balance).toEqual(sentInTransaction);

    expect(
      await setup.provider.getBalance(await setup.signer.getAddress()),
    ).toEqual(transaction!.maxFeePerGas! * receipt!.gasUsed - receipt!.fee);
  });

  afterAll(() => {
    setup.provider.destroy();
  });
});
