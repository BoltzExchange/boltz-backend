import { ERC20 } from 'boltz-core/typechain/ERC20';
import Logger from '../../../../lib/Logger';
import { Token } from '../../../../lib/consts/Types';
import { getContracts } from '../../../../lib/cli/ethereum/EthereumUtils';
import ERC20WalletProvider from '../../../../lib/wallet/providers/ERC20WalletProvider';
import {
  EthereumSetup,
  fundSignerWallet,
  getSigner,
  waitForTransactionHash,
} from '../EthereumTools';

describe('ERC20WalletProvider', () => {
  let setup: EthereumSetup;

  let token: Token;
  let contract: ERC20;
  let wallet: ERC20WalletProvider;

  beforeAll(async () => {
    setup = await getSigner();
    contract = (await getContracts(setup.signer)).token;

    token = {
      contract,

      decimals: 18,
      symbol: 'TRC',
      address: await contract.getAddress(),
    };

    wallet = new ERC20WalletProvider(
      Logger.disabledLogger,
      setup.signer,
      token,
    );
  });

  test('should get contract address', () => {
    expect(wallet.getTokenAddress()).toEqual(token.address);
  });

  test('should get address', async () => {
    expect(await wallet.getAddress()).toEqual(await setup.signer.getAddress());
  });

  test('should get balance', async () => {
    await fundSignerWallet(setup.signer, setup.etherBase, token.contract);

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
    const amount = 1000000;
    const { transactionId } = await wallet.sendToAddress(
      await setup.etherBase.getAddress(),
      amount,
    );

    const transaction = await setup.provider.getTransaction(transactionId);
    const receipt = await transaction!.wait(1);

    expect(BigInt(receipt!.logs[0].data)).toEqual(
      BigInt(amount) * BigInt(10) ** BigInt(10),
    );
  });

  test('should sweep wallet', async () => {
    const balance = await token.contract.balanceOf(
      await setup.signer.getAddress(),
    );

    const { transactionId } = await wallet.sweepWallet(
      await setup.etherBase.getAddress(),
    );

    const transaction = await setup.provider.getTransaction(transactionId);
    const receipt = await transaction!.wait(1);

    expect(BigInt(receipt!.logs[0].data)).toEqual(balance);
    expect(
      await token.contract.balanceOf(await setup.signer.getAddress()),
    ).toEqual(BigInt(0));
  });

  test('should get allowance', async () => {
    const address = await setup.signer.getAddress();

    const allowance = await token.contract.allowance(address, address);
    expect(await wallet.getAllowance(address)).toEqual(allowance);
  });

  test('should approve', async () => {
    const address = await setup.signer.getAddress();
    let newAllowance = BigInt(1);

    await waitForTransactionHash(
      setup.provider,
      (await wallet.approve(address, newAllowance)).transactionId,
    );
    expect(await token.contract.allowance(address, address)).toEqual(
      newAllowance,
    );

    newAllowance = BigInt(0);
    await waitForTransactionHash(
      setup.provider,
      (await wallet.approve(address, newAllowance)).transactionId,
    );
    expect(await token.contract.allowance(address, address)).toEqual(
      newAllowance,
    );
  });

  test('should normalize token balance', () => {
    const amount = BigInt(190000000);

    token.decimals = 8;
    expect(wallet.normalizeTokenAmount(amount)).toEqual(190000000);

    token.decimals = 9;
    expect(wallet.normalizeTokenAmount(amount)).toEqual(19000000);
    token.decimals = 10;
    expect(wallet.normalizeTokenAmount(amount)).toEqual(1900000);
    token.decimals = 16;
    expect(wallet.normalizeTokenAmount(amount)).toEqual(1);

    token.decimals = 7;
    expect(wallet.normalizeTokenAmount(amount)).toEqual(1900000000);
    token.decimals = 6;
    expect(wallet.normalizeTokenAmount(amount)).toEqual(19000000000);
    token.decimals = 5;
    expect(wallet.normalizeTokenAmount(amount)).toEqual(190000000000);

    token.decimals = 18;
  });

  test('should format token amount', () => {
    const amount = 190000000;

    token.decimals = 8;
    expect(wallet.formatTokenAmount(amount)).toEqual(BigInt(190000000));

    token.decimals = 9;
    expect(wallet.formatTokenAmount(amount)).toEqual(BigInt(1900000000));
    token.decimals = 10;
    expect(wallet.formatTokenAmount(amount)).toEqual(BigInt(19000000000));
    token.decimals = 16;
    expect(wallet.formatTokenAmount(amount)).toEqual(
      BigInt('19000000000000000'),
    );

    token.decimals = 7;
    expect(wallet.formatTokenAmount(amount)).toEqual(BigInt(19000000));
    token.decimals = 6;
    expect(wallet.formatTokenAmount(amount)).toEqual(BigInt(1900000));
    token.decimals = 5;
    expect(wallet.formatTokenAmount(amount)).toEqual(BigInt(190000));

    token.decimals = 18;
  });

  afterAll(() => {
    setup.provider.destroy();
  });
});
