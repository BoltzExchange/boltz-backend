import { BigNumber, ContractTransaction } from 'ethers';
import { EtherSwap } from 'boltz-core/typechain/EtherSwap';
import { Erc20Swap } from 'boltz-core/typechain/Erc20Swap';
import Logger from '../../Logger';
import { getHexString } from '../../Utils';
import { getGasPrice } from './EthereumUtils';
import ERC20WalletProvider from '../providers/ERC20WalletProvider';

class ContractHandler {
  private etherSwap!: EtherSwap;
  private erc20Swap!: Erc20Swap;

  constructor(
    private logger: Logger,
  ) {}

  public init = (etherSwap: EtherSwap, erc20Swap: Erc20Swap): void => {
    this.etherSwap = etherSwap;
    this.erc20Swap = erc20Swap;
  }

  public lockupEther = async (
    preimageHash: Buffer,
    amount: BigNumber,
    claimAddress: string,
    timeLock: number,
  ): Promise<ContractTransaction> => {
    this.logger.debug(`Locking ${amount} Ether with preimage hash: ${getHexString(preimageHash)}`);
    return this.etherSwap.lock(preimageHash, claimAddress, timeLock, {
      value: amount,
      gasPrice: await getGasPrice(this.etherSwap.provider),
    });
  }

  public claimEther = async (
    preimage: Buffer,
    amount: BigNumber,
    refundAddress: string,
    timelock: number,
  ): Promise<ContractTransaction> => {
    this.logger.debug(`Claiming Ether with preimage: ${getHexString(preimage)}`);
    return this.etherSwap.claim(
      preimage,
      amount,
      refundAddress,
      timelock,
      {
        gasPrice: await getGasPrice(this.etherSwap.provider),
      }
    );
  }

  public refundEther = async (
    preimageHash: Buffer,
    amount: BigNumber,
    claimAddress: string,
    timelock: number,
  ): Promise<ContractTransaction> => {
    this.logger.debug(`Refunding Ether with preimage hash: ${getHexString(preimageHash)}`);
    return this.etherSwap.refund(
      preimageHash,
      amount,
      claimAddress,
      timelock,
      {
        gasPrice: await getGasPrice(this.etherSwap.provider),
      }
    );
  }

  public lockupToken = async (
    token: ERC20WalletProvider,
    preimageHash: Buffer,
    amount: BigNumber,
    claimAddress: string,
    timeLock: number,
  ): Promise<ContractTransaction> => {
    this.logger.debug(`Locking ${amount} ${token.symbol} with preimage hash: ${getHexString(preimageHash)}`);
    return this.erc20Swap.lock(
      preimageHash,
      amount,
      token.getTokenAddress(),
      claimAddress,
      timeLock,
      {
        gasPrice: await getGasPrice(this.erc20Swap.provider),
      }
    );
  }

  public claimToken = async (
    token: ERC20WalletProvider,
    preimage: Buffer,
    amount: BigNumber,
    refundAddress: string,
    timeLock: number,
  ): Promise<ContractTransaction> => {
    this.logger.debug(`Claiming ${token.symbol} with preimage: ${getHexString(preimage)}`);
    return this.erc20Swap.claim(
      preimage,
      amount,
      token.getTokenAddress(),
      refundAddress,
      timeLock,
      {
        gasPrice: await getGasPrice(this.erc20Swap.provider),
      }
    );
  }

  public refundToken = async (
    token: ERC20WalletProvider,
    preimageHash: Buffer,
    amount: BigNumber,
    claimAddress: string,
    timeLock: number,
  ): Promise<ContractTransaction> => {
    this.logger.debug(`Refunding ${token.symbol} with preimage hash: ${getHexString(preimageHash)}`);
    return this.erc20Swap.refund(
      preimageHash,
      amount,
      token.getTokenAddress(),
      claimAddress,
      timeLock,
      {
        gasPrice: await getGasPrice(this.erc20Swap.provider),
      }
    );
  }
}

export default ContractHandler;
