import { BigNumber } from 'ethers';
import { EtherSwap } from 'boltz-core/typechain/EtherSwap';
import { Erc20Swap } from 'boltz-core/typechain/Erc20Swap';
import Logger from '../../Logger';
import { getHexString } from '../../Utils';
import { etherDecimals } from '../../consts/Consts';
import ERC20WalletProvider from '../providers/ERC20WalletProvider';

class ContractHandler {
  constructor(
    private logger: Logger,
    private etherSwap: EtherSwap,
    private erc20Swap: Erc20Swap,
  ) {}

  public lockupEther = async (
    preimageHash: Buffer,
    claimAddress: string,
    timeLock: number,
    amount: number,
  ): Promise<string> => {
    this.logger.info(`Locking ${amount} Ether with preimage hash: ${getHexString(preimageHash)}`);

    const transaction = await this.etherSwap.lock(preimageHash, claimAddress, `${timeLock}`, {
      value: BigNumber.from(amount).mul(etherDecimals).toString(),
    });

    return transaction.hash;
  }

  public claimEther = async (preimage: Buffer): Promise<string> => {
    this.logger.info(`Claiming Ether with preimage: ${getHexString(preimage)}`);

    const transaction = await this.etherSwap.claim(preimage);
    return transaction.hash;
  }

  public refundEther = async (preimageHash: Buffer): Promise<string> => {
    this.logger.info(`Refunding Ether with preimage hash: ${getHexString(preimageHash)}`);

    const transaction = await this.etherSwap.refund(preimageHash);
    return transaction.hash;
  }

  public lockupToken = async (
    token: ERC20WalletProvider,
    preimageHash: Buffer,
    amount: number,
    claimAddress: string,
    timeLock: number,
  ): Promise<string> => {
    this.logger.info(`Locking ${amount} ${token.symbol} with preimage hash: ${getHexString(preimageHash)}`);

    const transaction = await this.erc20Swap.lock(
      preimageHash,
      token.formatTokenAmount(amount),
      token.getTokenAddress(),
      claimAddress,
      timeLock,
    );

    return transaction.hash;
  }

  public claimToken = async (
    token: ERC20WalletProvider,
    preimage: Buffer,
  ): Promise<string> => {
    this.logger.info(`Claiming ${token.symbol} with preimage: ${getHexString(preimage)}`);

    const transaction = await this.erc20Swap.claim(preimage);
    return transaction.hash;
  }

  public refundToken = async (
    token: ERC20WalletProvider,
    preimageHash: Buffer,
  ): Promise<string> => {
    this.logger.info(`Refunding ${token.symbol} with preimage hash: ${getHexString(preimageHash)}`);

    const transaction = await this.erc20Swap.refund(preimageHash);
    return transaction.hash;
  }
}

export default ContractHandler;
