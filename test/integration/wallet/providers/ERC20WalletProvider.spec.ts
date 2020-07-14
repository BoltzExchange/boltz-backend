import { BigNumber } from 'ethers';
import Logger from '../../../../lib/Logger';
import { getSigner, getTokenContract } from '../EthereumTools';
import ERC20WalletProvider from '../../../../lib/wallet/providers/ERC20WalletProvider';

describe('ERC20WalletProvider', () => {
  const { provider, signer } = getSigner();
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
    expect(await wallet.getAddress()).toEqual('0xA7430D5ef25467365112C21A0e803cc72905cC50');
  });

  test('should get balance', async () => {
    const balance = await token.contract.balanceOf(await signer.getAddress());
    const normalizedAmount = balance.div(BigNumber.from(10).pow(10)).toNumber();

    expect(await wallet.getBalance()).toEqual({
      totalBalance: normalizedAmount,
      confirmedBalance: normalizedAmount,
      unconfirmedBalance: 0,
    });
  });

  test('should send to address', async () => {
    const amount = 100000000;
    const { transactionId } = await wallet.sendToAddress(await signer.getAddress(), amount);

    const transaction = await provider.getTransaction(transactionId);
    const receipt = await transaction.wait(1);

    expect(BigNumber.from(receipt.logs[0].data)).toEqual(BigNumber.from(amount).mul(BigNumber.from(10).pow(10)));
  });

  test('should sweep wallet', async () => {
    const balance = await token.contract.balanceOf(await signer.getAddress());

    const { transactionId } = await wallet.sweepWallet(await signer.getAddress());

    const transaction = await provider.getTransaction(transactionId);
    const receipt = await transaction.wait(1);

    expect(BigNumber.from(receipt.logs[0].data)).toEqual(balance);
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
    const normalizeTokenBalance = wallet['normalizeTokenBalance'];

    const amount = BigNumber.from(190000000);

    token.decimals = 8;
    expect(normalizeTokenBalance(amount)).toEqual(190000000);

    token.decimals = 9;
    expect(normalizeTokenBalance(amount)).toEqual(19000000);
    token.decimals = 10;
    expect(normalizeTokenBalance(amount)).toEqual(1900000);
    token.decimals = 16;
    expect(normalizeTokenBalance(amount)).toEqual(1);

    token.decimals = 7;
    expect(normalizeTokenBalance(amount)).toEqual(1900000000);
    token.decimals = 6;
    expect(normalizeTokenBalance(amount)).toEqual(19000000000);
    token.decimals = 5;
    expect(normalizeTokenBalance(amount)).toEqual(190000000000);

    token.decimals = 18;
  });

  test('should format token amount', () => {
    const formatTokenAmount = wallet['formatTokenAmount'];

    const amount = 190000000;

    token.decimals = 8;
    expect(formatTokenAmount(amount)).toEqual(BigNumber.from(190000000));

    token.decimals = 9;
    expect(formatTokenAmount(amount)).toEqual(BigNumber.from(1900000000));
    token.decimals = 10;
    expect(formatTokenAmount(amount)).toEqual(BigNumber.from(19000000000));
    token.decimals = 16;
    expect(formatTokenAmount(amount)).toEqual(BigNumber.from('19000000000000000'));

    token.decimals = 7;
    expect(formatTokenAmount(amount)).toEqual(BigNumber.from(19000000));
    token.decimals = 6;
    expect(formatTokenAmount(amount)).toEqual(BigNumber.from(1900000));
    token.decimals = 5;
    expect(formatTokenAmount(amount)).toEqual(BigNumber.from(190000));

    token.decimals = 18;
  });
});
