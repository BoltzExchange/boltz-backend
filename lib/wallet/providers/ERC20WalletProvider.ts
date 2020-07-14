import { BigNumber, Signer } from 'ethers';
import Logger from '../../Logger';
import { Token } from '../../consts/Types';
import { getGasPrice } from '../ethereum/EthereumUtils';
import WalletProviderInterface, { SentTransaction, WalletBalance } from './WalletProviderInterface';

class ERC20WalletProvider implements WalletProviderInterface {
  public readonly symbol: string;

  constructor(private logger: Logger, private signer: Signer, private token: Token) {
    this.symbol = token.symbol;

    this.logger.info(`Initialized ${this.symbol} ERC20 wallet with contract: ${token.contract.address}`);
  }

  public getTokenAddress = (): string => {
    return this.token.contract.address;
  }

  public getAddress = (): Promise<string> => {
    return this.signer.getAddress();
  }

  public getBalance = async (): Promise<WalletBalance> => {
    const balance = this.normalizeTokenBalance(
      await this.token.contract.balanceOf(await this.getAddress()),
    );

    return {
      totalBalance: balance,
      confirmedBalance: balance,
      unconfirmedBalance: 0,
    };
  }

  public sendToAddress = async (address: string, amount: number, gasPrice?: number): Promise<SentTransaction> => {
    const actualAmount = this.formatTokenAmount(amount);
    const transaction = await this.token.contract.transfer(address, actualAmount, {
      gasPrice: await getGasPrice(this.signer.provider!, gasPrice),
    });

    return {
      transactionId: transaction.hash,
    };
  }

  public sweepWallet = async (address: string, gasPrice?: number): Promise<SentTransaction> => {
    const balance = await this.token.contract.balanceOf(address);
    const transaction = await this.token.contract.transfer(address, balance, {
      gasPrice: await getGasPrice(this.signer.provider!, gasPrice),
    });

    return {
      transactionId: transaction.hash,
    };
  }

  public getAllowance = async (spender: string): Promise<BigNumber> => {
    return this.token.contract.allowance(await this.signer.getAddress(), spender);
  }

  public approve = async (spender: string, amount: BigNumber): Promise<SentTransaction> => {
    const transaction = await this.token.contract.approve(spender, amount);

    return {
      transactionId: transaction.hash,
    };
  }

  /**
   * Formats the token amount to send from 10 ** -8 decimals
   */
  public formatTokenAmount = (amount: number): BigNumber => {
    const amountBn = BigNumber.from(amount);

    if (this.token.decimals === 8) {
      return amountBn;
    } else {
      const exponent = BigNumber.from(10).pow(BigNumber.from(Math.abs(this.token.decimals - 8)));

      if (this.token.decimals > 8) {
        return amountBn.mul(exponent);
      } else {
        return amountBn.div(exponent);
      }
    }
  }

  /**
   * Normalizes the token balance to 10 ** -8 decimals
   */
  private normalizeTokenBalance = (amount: BigNumber): number => {
    if (this.token.decimals === 8) {
      return amount.toNumber();
    } else {
      const exponent = BigNumber.from(10).pow(BigNumber.from(Math.abs(this.token.decimals - 8)));

      if (this.token.decimals > 8) {
        return amount.div(exponent).toNumber();
      } else {
        return amount.mul(exponent).toNumber();
      }
    }
  }
}

export default ERC20WalletProvider;
