import BN from 'bn.js';
import Web3 from 'web3';
import { ContractABIs } from 'boltz-core';
import { Contract } from 'web3-eth-contract';
import HDWalletProvider from '@truffle/hdwallet-provider';
import Errors from './Errors';
import Logger from '../Logger';

type TokenConfig = {
  symbol: string;
  address: string;
  decimals: number;
};

type EthereumConfig = {
  tokens: TokenConfig[];
  providerEndpoint: string;
};

type EthereumBalance = {
  ether: number;
  tokens: Map<string, number>;
};

// TODO: show ethereum client status on startup
// TODO: enforce gas limits?
// TODO: typings for ERC20 token contract
class EthereumWallet {
  public readonly address: string;

  public web3: Web3;
  private provider: HDWalletProvider;

  // A map between the token symbols and their contracts
  private tokenContracts = new Map<string, Contract>();

  // A map between the token symbols and their decimals
  private tokenDecimals =  new Map<string, BN>();
  private etherDecimals = new BN(10).pow(new BN(10));

  constructor(
    private logger: Logger,
    mnemonic: string,
    config: EthereumConfig,
  ) {
    this.provider = new HDWalletProvider(mnemonic, config.providerEndpoint);
    this.web3 = new Web3(this.provider as any);

    this.address = this.provider.getAddress(0);

    // TODO: throw error for invalid configurations
    config.tokens.forEach((token) => {
      const contract = new this.web3.eth.Contract(ContractABIs.IERC20ABI, token.address);

      this.tokenContracts.set(token.symbol.toUpperCase(), contract);

      // TODO: support for tokens with less than 8 decimals
      this.tokenDecimals.set(token.symbol, new BN(10).pow(new BN(token.decimals - 8)));
    });

    this.logger.info(`Initialized Ethereum wallet: ${this.address} with tokens: ${Array.from(this.tokenContracts.keys()).join(', ')}`);
  }

  public stop = () => {
    this.provider.engine.stop();
  }

  public getBalance = async (): Promise<EthereumBalance> => {
    const etherBalance = new BN(await this.web3.eth.getBalance(this.address)).div(this.etherDecimals).toNumber();

    const tokenBalances = new Map<string, number>();

    const balancePromises: Promise<void>[] = [];

    this.tokenContracts.forEach((contract, symbol) => {
      balancePromises.push(new Promise(async (resolve) => {
        const contractBalance = await contract.methods.balanceOf(this.address).call();
        tokenBalances.set(symbol, new BN(contractBalance).div(this.tokenDecimals.get(symbol)!).toNumber());

        resolve();
      }));
    });

    await Promise.all(balancePromises);

    return {
      ether: etherBalance,
      tokens: tokenBalances,
    };
  }

  public supportsToken = (symbol: string) => {
    return this.tokenContracts.get(symbol.toUpperCase()) !== undefined;
  }

  /**
   * @param address recipient of the transaction
   * @param value amount of Ether that should be sent; denominated in 10 ** 10 WEI
   * @param gasPrice denominated in GWEI
   */
  public sendEther = async (address: string, value: number, gasPrice?: number) => {
    this.logger.info(`Sending ${value} ETH to ${address}`);

    return this.web3.eth.sendTransaction({
      to: address,
      from: this.address,
      gasPrice: await this.getGasPrice(gasPrice),
      value: new BN(value).mul(this.etherDecimals),
    });
  }

  /**
   * @param address recipient of the transaction
   * @param gasPrice denominated in GWEI
   */
  public sweepEther = async (address: string, gasPrice?: number) => {
    const balance = await this.web3.eth.getBalance(this.address);

    const actualGasPrice = new BN(await this.getGasPrice(gasPrice));
    // The gas needed for sending Ether is 21000
    const gasCost = new BN(21000).mul(actualGasPrice);

    const amount = new BN(balance).sub(gasCost).div(this.etherDecimals);

    return this.sendEther(address, amount.toNumber(), actualGasPrice.div(this.etherDecimals).toNumber());
  }

  /**
   * @param symbol symbol of the token to send; defined via parameter of the constructor
   * @param address recipient of the transaction
   * @param amount amount of tokens to send; denominated in 10 ** -8 tokens
   * @param gasPrice denominated in GWEI
   */
  public sendToken = async (symbol: string, address: string, amount: number, gasPrice?: number) => {
    const contract = this.tokenContracts.get(symbol);

    if (contract === undefined) {
      throw Errors.CURRENCY_NOT_SUPPORTED(symbol);
    }

    this.logger.info(`Sending ${amount.toString()} ${symbol} to ${address}`);

    return contract.methods.transfer(address, new BN(amount).mul(this.tokenDecimals.get(symbol)!).toString()).send({
      from: this.address,
      gasPrice: await this.getGasPrice(gasPrice),
    });
  }

  /**
   * @param symbol symbol of the token to send; defined via parameter of the constructor
   * @param address recipient of the transaction
   * @param gasPrice denominated in GWEI
   */
  public sweepToken = async (symbol: string, address: string, gasPrice?: number) => {
    const balances = await this.getBalance();
    return this.sendToken(symbol, address, balances.tokens.get(symbol)!, gasPrice);
  }

  private getGasPrice = async (gasPrice?: number) => {
    if (gasPrice !== undefined) {
      return this.web3.utils.toWei(new BN(gasPrice), 'gwei');
    }

    return (await this.web3.eth.getGasPrice()).toString();
  }
}

export default EthereumWallet;
export { EthereumConfig };
