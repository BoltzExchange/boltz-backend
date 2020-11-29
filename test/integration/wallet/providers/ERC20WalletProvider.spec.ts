import { BigNumber } from 'ethers';
import Logger from '../../../../lib/Logger';
import { fundSignerWallet, getSigner, getTokenContract } from '../EthereumTools';
import ERC20WalletProvider from '../../../../lib/wallet/providers/ERC20WalletProvider';

describe('ERC20WalletProvider', () => {
  const { provider, signer, etherBase } = getSigner();
  const contract = getTokenContract(signer);

  const token = {
    contract,

    symbol: 'TRC',
    decimals: 18,
    address: contract.address,
  };

  const wallet = new ERC20WalletProvider(
    Logger.disabledLogger,
    signer,
    token,
  );

  test('should get contract address', () => {
    expect(wallet.getTokenAddress()).toEqual(contract.address);
  });

  test('should get address', async () => {
    expect(await wallet.getAddress()).toEqual(await signer.getAddress());
  });

  test('should get balance', async () => {
    await fundSignerWallet(signer, etherBase, token.contract);

    const balance = await token.contract.balanceOf(await signer.getAddress());
    const normalizedAmount = balance.div(BigNumber.from(10).pow(10)).toNumber();

    expect(await wallet.getBalance()).toEqual({
      totalBalance: normalizedAmount,
      confirmedBalance: normalizedAmount,
      unconfirmedBalance: 0,
    });
  });

  test('should send to address', async () => {
    const amount = 1000000;
    const { transactionId } = await wallet.sendToAddress(await etherBase.getAddress(), amount);

    const transaction = await provider.getTransaction(transactionId);
    const receipt = await transaction.wait(1);

    expect(BigNumber.from(receipt.logs[0].data)).toEqual(BigNumber.from(amount).mul(BigNumber.from(10).pow(10)));
  });

  test('should sweep wallet', async () => {
    const balance = await token.contract.balanceOf(await signer.getAddress());

    const { transactionId } = await wallet.sweepWallet(await etherBase.getAddress());

    const transaction = await provider.getTransaction(transactionId);
    const receipt = await transaction.wait(1);

    expect(BigNumber.from(receipt.logs[0].data)).toEqual(balance);
    expect((await token.contract.balanceOf(await signer.getAddress())).toNumber()).toEqual(0);
  });

  test('should get allowance', async () => {
    const address = await signer.getAddress();

    const allowance = await token.contract.allowance(address, address);
    expect(await wallet.getAllowance(address)).toEqual(allowance);
  });

  test('should approve', async () => {
    const address = await signer.getAddress();
    let newAllowance = BigNumber.from(1);

    await wallet.approve(address, newAllowance);
    expect(await token.contract.allowance(address, address)).toEqual(newAllowance);

    newAllowance = BigNumber.from(0);
    await wallet.approve(address, newAllowance);
    expect(await token.contract.allowance(address, address)).toEqual(newAllowance);
  });

  test('should normalize token balance', () => {
    const amount = BigNumber.from(190000000);

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
    expect(wallet.formatTokenAmount(amount)).toEqual(BigNumber.from(190000000));

    token.decimals = 9;
    expect(wallet.formatTokenAmount(amount)).toEqual(BigNumber.from(1900000000));
    token.decimals = 10;
    expect(wallet.formatTokenAmount(amount)).toEqual(BigNumber.from(19000000000));
    token.decimals = 16;
    expect(wallet.formatTokenAmount(amount)).toEqual(BigNumber.from('19000000000000000'));

    token.decimals = 7;
    expect(wallet.formatTokenAmount(amount)).toEqual(BigNumber.from(19000000));
    token.decimals = 6;
    expect(wallet.formatTokenAmount(amount)).toEqual(BigNumber.from(1900000));
    token.decimals = 5;
    expect(wallet.formatTokenAmount(amount)).toEqual(BigNumber.from(190000));

    token.decimals = 18;
  });

  afterAll(async () => {
    await provider.destroy();
  });
});
