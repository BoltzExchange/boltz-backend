import BN from 'bn.js';
import Web3 from 'web3';
import { ContractABIs } from 'boltz-core';
import { Contract } from 'web3-eth-contract';
import Logger from '../../../lib/Logger';
import EthereumWallet from '../../../lib/wallet/EthereumWallet';

describe('EthereumWallet', () => {
  const provider = new Web3.providers.HttpProvider('http://127.0.0.1:8545');
  const web3 = new Web3(provider as any);

  const erc20Symbol = 'TER';
  const erc20Decimals = new BN(10).pow(new BN(18));

  let erc20Address: string;
  let erc20Contract: Contract;

  let account: string;
  let accountErc20: string;

  let wallet: EthereumWallet;

  const mnemonic = 'tooth code rookie pitch grid distance desk toss kingdom wait finger hurdle';

  beforeAll(async () => {
    const accounts = await web3.eth.getAccounts();

    account = accounts[0];
    accountErc20 = accounts[1];

    const tokenDeploymentBlock = await web3.eth.getBlock(5);
    const creationReceipt = await web3.eth.getTransactionReceipt(tokenDeploymentBlock.transactions[0]);

    erc20Address = creationReceipt.contractAddress!;
    erc20Contract = new web3.eth.Contract(ContractABIs.IERC20ABI, erc20Address);
  });

  test('should initialize', async () => {
    const tokenConfig = {
      decimals: 18,
      symbol: erc20Symbol,
      address: erc20Address,
    };

    wallet = new EthereumWallet(
      Logger.disabledLogger,
      mnemonic,
      {
        providerEndpoint: 'http://127.0.0.1:8545',
        tokens: [tokenConfig],
      },
    );

    expect(wallet.web3).toBeDefined();
  });

  test('should get its own address', () => {
    expect(wallet.address).toEqual('0x60532f8ad74ea19325146d785068eefff2008f9b');
  });

  test('should get its own ether balance', async () => {
    const sentValue = new BN(10).pow(new BN(18));

    await web3.eth.sendTransaction({
      from: account,
      value: sentValue,
      to: wallet.address,
    });

    const balance = await wallet.getBalance();

    expect(balance.ether).toEqual(new BN(await web3.eth.getBalance(wallet.address)).div(wallet['etherDecimals']).toNumber());
  });

  test('should get its own ERC20 token balances', async () => {
    await erc20Contract.methods.transfer(wallet.address, erc20Decimals.toString()).send({
      from: account,
    });

    const balance = await wallet.getBalance();

    expect(balance.tokens.size).toEqual(1);
    expect(balance.tokens.get(erc20Symbol)).toEqual(10 ** 8);
  });

  test('should send ERC20 tokens', async () => {
    const recipient = accountErc20;
    const amount = new BN(1);

    const receipt = await wallet.sendToken(erc20Symbol, recipient, amount.toNumber());

    expect(receipt.from).toEqual(wallet.address);
    expect(receipt.to).toEqual(erc20Address.toLowerCase());

    const eventReturnValues = receipt.events.Transfer.returnValues;

    expect(eventReturnValues.value).toEqual(amount.mul(new BN(10 ** 10)).toString());
    expect(eventReturnValues.to).toEqual(recipient);
    expect(eventReturnValues.from.toLowerCase()).toEqual(wallet.address);
  });

  test('should sweep ERC20 tokens', async () => {
    const gasPrice = 7;
    const recipient = account;
    const amount = new BN(await erc20Contract.methods.balanceOf(wallet.address).call()).div(new BN(10 ** 10));

    const receipt = await wallet.sweepToken(erc20Symbol, recipient, gasPrice);

    expect(receipt.from).toEqual(wallet.address);
    expect(receipt.to).toEqual(erc20Address.toLowerCase());

    const eventReturnValues = receipt.events.Transfer.returnValues;

    expect(eventReturnValues.value).toEqual(amount.mul(new BN(10 ** 10)).toString());
    expect(eventReturnValues.to).toEqual(recipient);
    expect(eventReturnValues.from.toLowerCase()).toEqual(wallet.address);

    const transaction = await web3.eth.getTransaction(receipt.transactionHash);

    expect(transaction.value).toEqual('0');
    expect(transaction.gasPrice).toEqual(web3.utils.toWei(new BN(gasPrice), 'gwei').toString());
  });

  test('should send Ether', async () => {
    const gasPrice = 5;
    const value = new BN(10);
    const recipient = account.toLowerCase();

    const receipt = await wallet.sendEther(recipient, value.toNumber(), gasPrice);

    expect(receipt.to).toEqual(recipient);
    expect(receipt.from).toEqual(wallet.address);

    const transaction = await web3.eth.getTransaction(receipt.transactionHash);

    expect(transaction.value).toEqual(value.mul(wallet['etherDecimals']).toString());
    expect(transaction.gasPrice).toEqual(web3.utils.toWei(new BN(gasPrice), 'gwei').toString());
  });

  test('should sweep Ether', async () => {
    const recipient = account.toLowerCase();

    const receipt = await wallet.sweepEther(recipient, 1);

    expect(receipt.to).toEqual(recipient);
    expect(receipt.from).toEqual(wallet.address);

    const balance = await wallet.getBalance();
    // Transacting on Ganache does not cost any ether
    expect(balance.ether).toEqual(2100);
  });

  test('should get gas price', async () => {
    const getGasPrice = wallet['getGasPrice'];

    // Convert provided values to WEI
    const gasPrice = 6;
    expect((await getGasPrice(gasPrice)).toString()).toEqual('6000000000');

    // Get estimation from web3 provider
    expect(await getGasPrice()).toEqual((await web3.eth.getGasPrice()).toString());
  });

  afterAll(() => {
    wallet.stop();
    provider.disconnect();
  });
});
