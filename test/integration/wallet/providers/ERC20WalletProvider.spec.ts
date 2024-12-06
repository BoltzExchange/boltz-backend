import { ERC20 } from 'boltz-core/typechain/ERC20';
import Logger from '../../../../lib/Logger';
import { Token } from '../../../../lib/consts/Types';
import Database from '../../../../lib/db/Database';
import TransactionLabel from '../../../../lib/db/models/TransactionLabel';
import TransactionLabelRepository from '../../../../lib/db/repositories/TransactionLabelRepository';
import ERC20WalletProvider from '../../../../lib/wallet/providers/ERC20WalletProvider';
import {
  EthereumSetup,
  fundSignerWallet,
  getContracts,
  getSigner,
  waitForTransactionHash,
} from '../EthereumTools';

describe('ERC20WalletProvider', () => {
  let database: Database;
  let setup: EthereumSetup;

  let token: Token;
  let contract: ERC20;
  let wallet: ERC20WalletProvider;

  beforeAll(async () => {
    database = new Database(Logger.disabledLogger, Database.memoryDatabase);
    await database.init();

    setup = await getSigner();
    contract = (await getContracts(setup.signer)).token;

    token = {
      contract,

      decimals: 18,
      symbol: 'TRC',
      address: await contract.getAddress(),
    };

    await fundSignerWallet(setup.signer, setup.etherBase);
    await fundSignerWallet(setup.signer, setup.etherBase, token.contract);

    wallet = new ERC20WalletProvider(
      Logger.disabledLogger,
      setup.signer,
      token,
    );
  });

  beforeEach(() => {
    token.decimals = 18;
  });

  afterAll(async () => {
    setup.provider.destroy();

    await TransactionLabel.destroy({
      truncate: true,
    });

    await database.close();
  });

  test('should get contract address', () => {
    expect(wallet.tokenAddress).toEqual(token.address);
  });

  test('should get address', async () => {
    expect(await wallet.getAddress()).toEqual(await setup.signer.getAddress());
  });

  test('should get balance', async () => {
    const balance = await token.contract.balanceOf(
      await setup.signer.getAddress(),
    );
    const normalizedAmount = Number(balance / BigInt(10) ** BigInt(10));

    expect(await wallet.getBalance()).toEqual({
      confirmedBalance: normalizedAmount,
      unconfirmedBalance: 0,
    });
  });

  test('should send to address', async () => {
    const amount = 1_000_000;
    const label = 'test tx label';

    const { transactionId } = await wallet.sendToAddress(
      await setup.etherBase.getAddress(),
      amount,
      undefined,
      label,
    );

    const transaction = await setup.provider.getTransaction(transactionId);
    const receipt = await transaction!.wait(1);

    expect(BigInt(receipt!.logs[0].data)).toEqual(
      BigInt(amount) * BigInt(10) ** BigInt(10),
    );

    const labelRes = await TransactionLabelRepository.getLabel(
      transaction!.hash,
    );
    expect(labelRes!).not.toBeNull();
    expect(labelRes!.id).toEqual(transaction!.hash);
    expect(labelRes!.symbol).toEqual(wallet.symbol);
    expect(labelRes!.label).toEqual(label);
  });

  test('should sweep wallet', async () => {
    const balance = await token.contract.balanceOf(
      await setup.signer.getAddress(),
    );

    const label = 'test sweep label';

    const { transactionId } = await wallet.sweepWallet(
      await setup.etherBase.getAddress(),
      undefined,
      label,
    );

    const transaction = await setup.provider.getTransaction(transactionId);
    const receipt = await transaction!.wait(1);

    expect(BigInt(receipt!.logs[0].data)).toEqual(balance);
    expect(
      await token.contract.balanceOf(await setup.signer.getAddress()),
    ).toEqual(BigInt(0));

    const labelRes = await TransactionLabelRepository.getLabel(
      transaction!.hash,
    );
    expect(labelRes!).not.toBeNull();
    expect(labelRes!.id).toEqual(transaction!.hash);
    expect(labelRes!.symbol).toEqual(wallet.symbol);
    expect(labelRes!.label).toEqual(label);
  });

  test('should get allowance', async () => {
    const address = await setup.signer.getAddress();

    const allowance = await token.contract.allowance(address, address);
    expect(await wallet.getAllowance(address)).toEqual(allowance);
  });

  test('should approve', async () => {
    const address = await setup.signer.getAddress();
    let newAllowance = BigInt(1);

    const tx = await wallet.approve(address, newAllowance);

    await waitForTransactionHash(setup.provider, tx.transactionId);
    expect(await token.contract.allowance(address, address)).toEqual(
      newAllowance,
    );

    const labelRes = await TransactionLabelRepository.getLabel(
      tx.transactionId,
    );
    expect(labelRes!).not.toBeNull();
    expect(labelRes!.id).toEqual(tx.transactionId);
    expect(labelRes!.symbol).toEqual(wallet.symbol);
    expect(labelRes!.label).toEqual(TransactionLabelRepository.erc20Approval());

    newAllowance = BigInt(0);
    await waitForTransactionHash(
      setup.provider,
      (await wallet.approve(address, newAllowance)).transactionId,
    );
    expect(await token.contract.allowance(address, address)).toEqual(
      newAllowance,
    );
  });

  test.each`
    amount               | decimals | expected
    ${BigInt(190000000)} | ${8}     | ${190000000}
    ${BigInt(190000000)} | ${9}     | ${19000000}
    ${BigInt(190000000)} | ${10}    | ${1900000}
    ${BigInt(190000000)} | ${16}    | ${1}
    ${BigInt(190000000)} | ${7}     | ${1900000000}
    ${BigInt(190000000)} | ${6}     | ${19000000000}
    ${BigInt(190000000)} | ${5}     | ${190000000000}
  `('should normalize token balance', ({ amount, decimals, expected }) => {
    token.decimals = decimals;
    expect(wallet.normalizeTokenAmount(amount)).toEqual(expected);
  });

  test.each`
    amount       | decimals | expected
    ${190000000} | ${8}     | ${190000000}
    ${190000000} | ${9}     | ${1900000000}
    ${190000000} | ${10}    | ${19000000000}
    ${190000000} | ${16}    | ${'19000000000000000'}
    ${190000000} | ${7}     | ${19000000}
    ${190000000} | ${6}     | ${1900000}
    ${190000000} | ${5}     | ${190000}
  `('should format token amount', ({ amount, decimals, expected }) => {
    token.decimals = decimals;
    expect(wallet.formatTokenAmount(amount)).toEqual(BigInt(expected));
  });
});
