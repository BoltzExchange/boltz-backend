import { ERC20Swap } from 'boltz-core/typechain/ERC20Swap';
import { EtherSwap } from 'boltz-core/typechain/EtherSwap';
import { ContractTransactionResponse, Provider } from 'ethers';
import { ethereumPrepayMinerFeeGasLimit } from '../../consts/Consts';
import { swapTypeToPrettyString } from '../../consts/Enums';
import { AnySwap } from '../../consts/Types';
import TransactionLabelRepository from '../../db/repositories/TransactionLabelRepository';
import ERC20WalletProvider from '../providers/ERC20WalletProvider';
import { getGasPrices } from './EthereumUtils';
import { NetworkDetails } from './EvmNetworks';

export type BatchClaimValues = {
  preimage: Buffer;
  amount: bigint;
  refundAddress: string;
  timelock: number;
};

class ContractHandler {
  private provider!: Provider;

  public etherSwap!: EtherSwap;
  public erc20Swap!: ERC20Swap;

  constructor(private readonly networkDetails: NetworkDetails) {}

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
    swap: AnySwap,
    preimageHash: Buffer,
    amount: bigint,
    claimAddress: string,
    timeLock: number,
  ): Promise<ContractTransactionResponse> =>
    this.annotateLabel(
      TransactionLabelRepository.lockupLabel(swap),
      this.networkDetails.symbol,
      this.etherSwap.lock(preimageHash, claimAddress, timeLock, {
        value: amount,
        ...(await getGasPrices(this.provider)),
      }),
    );

  public lockupEtherPrepayMinerfee = async (
    swap: AnySwap,
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

    return this.annotateLabel(
      TransactionLabelRepository.lockupLabel(swap, true),
      this.networkDetails.symbol,
      this.etherSwap.lockPrepayMinerfee(
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
      ),
    );
  };

  public claimEther = async (
    swap: AnySwap,
    preimage: Buffer,
    amount: bigint,
    refundAddress: string,
    timelock: number,
  ): Promise<ContractTransactionResponse> =>
    this.annotateLabel(
      TransactionLabelRepository.claimLabel(swap),
      this.networkDetails.symbol,
      this.etherSwap['claim(bytes32,uint256,address,uint256)'](
        preimage,
        amount,
        refundAddress,
        timelock,
        {
          ...(await getGasPrices(this.provider)),
        },
      ),
    );

  public claimBatchEther = async (
    swapsIds: string[],
    values: BatchClaimValues[],
  ): Promise<ContractTransactionResponse> =>
    this.annotateLabel(
      TransactionLabelRepository.claimBatchLabel(swapsIds),
      this.networkDetails.symbol,
      this.etherSwap.claimBatch(
        values.map((v) => v.preimage),
        values.map((v) => v.amount),
        values.map((v) => v.refundAddress),
        values.map((v) => v.timelock),
        {
          ...(await getGasPrices(this.provider)),
        },
      ),
    );

  public refundEther = async (
    swap: AnySwap,
    preimageHash: Buffer,
    amount: bigint,
    claimAddress: string,
    timelock: number,
  ): Promise<ContractTransactionResponse> =>
    this.annotateLabel(
      `Refund of ${swapTypeToPrettyString(swap.type)} Swap ${swap.id}`,
      this.networkDetails.symbol,
      this.etherSwap.refund(preimageHash, amount, claimAddress, timelock, {
        ...(await getGasPrices(this.provider)),
      }),
    );

  public lockupToken = async (
    swap: AnySwap,
    token: ERC20WalletProvider,
    preimageHash: Buffer,
    amount: bigint,
    claimAddress: string,
    timeLock: number,
  ): Promise<ContractTransactionResponse> =>
    this.annotateLabel(
      TransactionLabelRepository.lockupLabel(swap),
      token.symbol,
      this.erc20Swap.lock(
        preimageHash,
        amount,
        token.tokenAddress,
        claimAddress,
        timeLock,
        {
          ...(await getGasPrices(this.provider)),
        },
      ),
    );

  public lockupTokenPrepayMinerfee = async (
    swap: AnySwap,
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
        token.tokenAddress,
        claimAddress,
        timeLock,
      );

    return this.annotateLabel(
      TransactionLabelRepository.lockupLabel(swap, true),
      token.symbol,
      this.erc20Swap.lockPrepayMinerfee(
        preimageHash,
        amount,
        token.tokenAddress,
        claimAddress,
        timeLock,
        {
          value: amountPrepay,
          gasLimit:
            gasLimitEstimationWithoutPrepay + ethereumPrepayMinerFeeGasLimit,
          ...(await getGasPrices(this.provider)),
        },
      ),
    );
  };

  public claimToken = async (
    swap: AnySwap,
    token: ERC20WalletProvider,
    preimage: Buffer,
    amount: bigint,
    refundAddress: string,
    timeLock: number,
  ): Promise<ContractTransactionResponse> =>
    this.annotateLabel(
      TransactionLabelRepository.claimLabel(swap),
      token.symbol,
      this.erc20Swap['claim(bytes32,uint256,address,address,uint256)'](
        preimage,
        amount,
        token.tokenAddress,
        refundAddress,
        timeLock,
        {
          ...(await getGasPrices(this.provider)),
        },
      ),
    );

  public claimBatchToken = async (
    swapsIds: string[],
    token: ERC20WalletProvider,
    values: BatchClaimValues[],
  ): Promise<ContractTransactionResponse> =>
    this.annotateLabel(
      TransactionLabelRepository.claimBatchLabel(swapsIds),
      token.symbol,
      this.erc20Swap.claimBatch(
        token.tokenAddress,
        values.map((v) => v.preimage),
        values.map((v) => v.amount),
        values.map((v) => v.refundAddress),
        values.map((v) => v.timelock),
        {
          ...(await getGasPrices(this.provider)),
        },
      ),
    );

  public refundToken = async (
    swap: AnySwap,
    token: ERC20WalletProvider,
    preimageHash: Buffer,
    amount: bigint,
    claimAddress: string,
    timeLock: number,
  ): Promise<ContractTransactionResponse> =>
    this.annotateLabel(
      TransactionLabelRepository.refundLabel(swap),
      token.symbol,
      this.erc20Swap.refund(
        preimageHash,
        amount,
        token.tokenAddress,
        claimAddress,
        timeLock,
        {
          ...(await getGasPrices(this.provider)),
        },
      ),
    );

  private annotateLabel = async (
    label: string,
    symbol: string,
    tx: Promise<ContractTransactionResponse>,
  ): Promise<ContractTransactionResponse> => {
    const res = await tx;
    await TransactionLabelRepository.addLabel(res.hash, symbol, label);
    return res;
  };
}

export default ContractHandler;
