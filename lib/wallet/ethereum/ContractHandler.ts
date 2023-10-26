import { EtherSwap } from 'boltz-core/typechain/EtherSwap';
import { ERC20Swap } from 'boltz-core/typechain/ERC20Swap';
import { ContractTransactionResponse, Provider } from 'ethers';
import Logger from '../../Logger';
import { getHexString } from '../../Utils';
import { getGasPrices } from './EthereumUtils';
import { NetworkDetails } from './EvmNetworks';
import ERC20WalletProvider from '../providers/ERC20WalletProvider';
import { ethereumPrepayMinerFeeGasLimit } from '../../consts/Consts';

class ContractHandler {
  private provider!: Provider;

  private etherSwap!: EtherSwap;
  private erc20Swap!: ERC20Swap;

  constructor(
    private readonly logger: Logger,
    private readonly networkDetails: NetworkDetails,
  ) {}

  public init = (
    provider: Provider,
    etherSwap: EtherSwap,
    erc20Swap: ERC20Swap,
  ): void => {
    this.provider = provider;
    this.etherSwap = etherSwap;
    this.erc20Swap = erc20Swap;
  };

  public lockupEther = async (
    preimageHash: Buffer,
    amount: bigint,
    claimAddress: string,
    timeLock: number,
  ): Promise<ContractTransactionResponse> => {
    this.logger.debug(
      `Locking ${amount} ${
        this.networkDetails.symbol
      } with preimage hash: ${getHexString(preimageHash)}`,
    );
    return this.etherSwap.lock(preimageHash, claimAddress, timeLock, {
      value: amount,
      ...(await getGasPrices(this.provider)),
    });
  };

  public lockupEtherPrepayMinerfee = async (
    preimageHash: Buffer,
    amount: bigint,
    amountPrepay: bigint,
    claimAddress: string,
    timeLock: number,
  ): Promise<ContractTransactionResponse> => {
    const transactionValue = amount + amountPrepay;

    const gasLimitEstimationWithoutPrepay =
      await this.etherSwap.lock.estimateGas(
        preimageHash,
        claimAddress,
        timeLock,
        {
          value: transactionValue,
        },
      );

    this.logger.debug(
      `Locking ${amount} and sending prepay ${amountPrepay} ${
        this.networkDetails.symbol
      } with preimage hash: ${getHexString(preimageHash)}`,
    );
    return this.etherSwap.lockPrepayMinerfee(
      preimageHash,
      claimAddress,
      timeLock,
      amountPrepay,
      {
        value: transactionValue,
        // TODO: integration test that tries to exploit the attack vector of using an insane amount of gas in the fallback function of the contract at the claim address
        gasLimit:
          gasLimitEstimationWithoutPrepay + ethereumPrepayMinerFeeGasLimit,
        ...(await getGasPrices(this.provider)),
      },
    );
  };

  public claimEther = async (
    preimage: Buffer,
    amount: bigint,
    refundAddress: string,
    timelock: number,
  ): Promise<ContractTransactionResponse> => {
    this.logger.debug(
      `Claiming ${this.networkDetails.symbol} with preimage: ${getHexString(
        preimage,
      )}`,
    );
    return this.etherSwap.claim(preimage, amount, refundAddress, timelock, {
      ...(await getGasPrices(this.provider)),
    });
  };

  public refundEther = async (
    preimageHash: Buffer,
    amount: bigint,
    claimAddress: string,
    timelock: number,
  ): Promise<ContractTransactionResponse> => {
    this.logger.debug(
      `Refunding ${
        this.networkDetails.symbol
      } with preimage hash: ${getHexString(preimageHash)}`,
    );
    return this.etherSwap.refund(preimageHash, amount, claimAddress, timelock, {
      ...(await getGasPrices(this.provider)),
    });
  };

  public lockupToken = async (
    token: ERC20WalletProvider,
    preimageHash: Buffer,
    amount: bigint,
    claimAddress: string,
    timeLock: number,
  ): Promise<ContractTransactionResponse> => {
    this.logger.debug(
      `Locking ${amount} ${token.symbol} with preimage hash: ${getHexString(
        preimageHash,
      )}`,
    );
    return this.erc20Swap.lock(
      preimageHash,
      amount,
      token.getTokenAddress(),
      claimAddress,
      timeLock,
      {
        ...(await getGasPrices(this.provider)),
      },
    );
  };

  public lockupTokenPrepayMinerfee = async (
    token: ERC20WalletProvider,
    preimageHash: Buffer,
    amount: bigint,
    amountPrepay: bigint,
    claimAddress: string,
    timeLock: number,
  ): Promise<ContractTransactionResponse> => {
    const gasLimitEstimationWithoutPrepay =
      await this.erc20Swap.lock.estimateGas(
        preimageHash,
        amount,
        token.getTokenAddress(),
        claimAddress,
        timeLock,
      );

    this.logger.debug(
      `Locking ${amount} ${
        token.symbol
      } and sending prepay ${amountPrepay} Ether with preimage hash: ${getHexString(
        preimageHash,
      )}`,
    );
    return this.erc20Swap.lockPrepayMinerfee(
      preimageHash,
      amount,
      token.getTokenAddress(),
      claimAddress,
      timeLock,
      {
        value: amountPrepay,
        gasLimit:
          gasLimitEstimationWithoutPrepay + ethereumPrepayMinerFeeGasLimit,
        ...(await getGasPrices(this.provider)),
      },
    );
  };

  public claimToken = async (
    token: ERC20WalletProvider,
    preimage: Buffer,
    amount: bigint,
    refundAddress: string,
    timeLock: number,
  ): Promise<ContractTransactionResponse> => {
    this.logger.debug(
      `Claiming ${token.symbol} with preimage: ${getHexString(preimage)}`,
    );
    return this.erc20Swap.claim(
      preimage,
      amount,
      token.getTokenAddress(),
      refundAddress,
      timeLock,
      {
        ...(await getGasPrices(this.provider)),
      },
    );
  };

  public refundToken = async (
    token: ERC20WalletProvider,
    preimageHash: Buffer,
    amount: bigint,
    claimAddress: string,
    timeLock: number,
  ): Promise<ContractTransactionResponse> => {
    this.logger.debug(
      `Refunding ${token.symbol} with preimage hash: ${getHexString(
        preimageHash,
      )}`,
    );
    return this.erc20Swap.refund(
      preimageHash,
      amount,
      token.getTokenAddress(),
      claimAddress,
      timeLock,
      {
        ...(await getGasPrices(this.provider)),
      },
    );
  };
}

export default ContractHandler;
