import Logger from '../../../../lib/Logger';
import { etherDecimals } from '../../../../lib/consts/Consts';
import Database from '../../../../lib/db/Database';
import TransactionLabel from '../../../../lib/db/models/TransactionLabel';
import TransactionLabelRepository from '../../../../lib/db/repositories/TransactionLabelRepository';
import { networks } from '../../../../lib/wallet/ethereum/EvmNetworks';
import EtherWalletProvider from '../../../../lib/wallet/providers/EtherWalletProvider';
import type { EthereumSetup } from '../EthereumTools';
import { fundSignerWallet, getSigner } from '../EthereumTools';

describe('EtherWalletProvider', () => {
  let database: Database;
  let setup: EthereumSetup;
  let wallet: EtherWalletProvider;

  beforeAll(async () => {
    database = new Database(Logger.disabledLogger, Database.memoryDatabase);
    await database.init();

    setup = await getSigner();
    wallet = new EtherWalletProvider(
      Logger.disabledLogger,
      setup.signer,
      networks.Ethereum,
    );
  });

  afterAll(async () => {
    setup.provider.destroy();

    await TransactionLabel.destroy({
      truncate: true,
    });

    await database.close();
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
      confirmedBalance: balance,
      unconfirmedBalance: 0,
    });
  });

  test('should send to address', async () => {
    const amount = 1_000_000;
    const label = 'integration test tx';

    const { transactionId } = await wallet.sendToAddress(
      await setup.signer.getAddress(),
      amount,
      undefined,
      label,
    );
    await setup.provider!.waitForTransaction(transactionId);

    const transaction = await setup.provider.getTransaction(transactionId);
    expect(transaction!.value).toEqual(BigInt(amount) * etherDecimals);

    const labelRes = await TransactionLabelRepository.getLabel(
      transaction!.hash,
    );
    expect(labelRes!).not.toBeNull();
    expect(labelRes!.id).toEqual(transaction!.hash);
    expect(labelRes!.symbol).toEqual(wallet.symbol);
    expect(labelRes!.label).toEqual(label);
  });

  test('should sweep wallet', async () => {
    const balance = await setup.provider.getBalance(
      await setup.signer.getAddress(),
    );

    const label = 'integration test tx';

    const { transactionId } = await wallet.sweepWallet(
      await setup.etherBase.getAddress(),
      undefined,
      label,
    );

    const transaction = await setup.provider.getTransaction(transactionId);
    const receipt = await setup.provider.waitForTransaction(transactionId);

    const sentInTransaction =
      transaction!.value + receipt!.gasUsed * transaction!.maxFeePerGas!;

    expect(balance).toEqual(sentInTransaction);

    expect(
      await setup.provider.getBalance(await setup.signer.getAddress()),
    ).toEqual(transaction!.maxFeePerGas! * receipt!.gasUsed - receipt!.fee);

    const labelRes = await TransactionLabelRepository.getLabel(
      transaction!.hash,
    );
    expect(labelRes).not.toBeNull();
    expect(labelRes!.id).toEqual(transaction!.hash);
    expect(labelRes!.symbol).toEqual(wallet.symbol);
    expect(labelRes!.label).toEqual(label);
  });
});
