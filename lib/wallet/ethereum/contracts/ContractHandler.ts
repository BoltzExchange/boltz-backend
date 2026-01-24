import type { ERC20Swap } from 'boltz-core/typechain/ERC20Swap';
import type { EtherSwap } from 'boltz-core/typechain/EtherSwap';
import {
  type ContractTransactionResponse,
  type Provider,
  type Signer,
} from 'ethers';
import { ethereumPrepayMinerFeeGasLimit } from '../../../consts/Consts';
import { swapTypeToPrettyString } from '../../../consts/Enums';
import type { AnySwap } from '../../../consts/Types';
import CommitmentRepository from '../../../db/repositories/CommitmentRepository';
import TransactionLabelRepository from '../../../db/repositories/TransactionLabelRepository';
import type ERC20WalletProvider from '../../providers/ERC20WalletProvider';
import Errors from '../Errors';
import { getGasPrices } from '../EthereumUtils';
import type { NetworkDetails } from '../EvmNetworks';
import { Feature } from './Contracts';

export type BatchClaimValues = {
  preimage: Buffer;
  amount: bigint;
  refundAddress: string;
  timelock: number;
  commitmentSignature?: {
    v: number;
    r: string;
    s: string;
  };
};

const emptySignature = {
  v: 0,
  r: '0x' + '0'.repeat(64),
  s: '0x' + '0'.repeat(64),
};

class ContractHandler {
  private provider!: Provider;
  private signer!: Signer;

  public etherSwap!: EtherSwap;
  public erc20Swap!: ERC20Swap;

  private features: Set<Feature> = new Set();

  constructor(private readonly networkDetails: NetworkDetails) {}

  public init = (
    features: Set<Feature>,
    provider: Provider,
    signer: Signer,
    etherSwap: EtherSwap,
    erc20Swap: ERC20Swap,
  ): void => {
    this.features = features;
    this.provider = provider;
    this.signer = signer;
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
      this.etherSwap['lock(bytes32,address,uint256)'](
        preimageHash,
        claimAddress,
        timeLock,
        {
          value: amount,
          ...(await getGasPrices(this.provider)),
        },
      ),
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

    const gasLimitEstimationWithoutPrepay = await this.etherSwap[
      'lock(bytes32,address,uint256)'
    ].estimateGas(preimageHash, claimAddress, timeLock, {
      value: transactionValue,
    });

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
      async () => {
        const gasPrices = await getGasPrices(this.provider);
        const commitment = await CommitmentRepository.getBySwapId(swap.id);

        if (commitment !== null && commitment !== undefined) {
          const sig = commitment.signatureEthers;

          return this.etherSwap[
            'claim(bytes32,uint256,address,address,uint256,uint8,bytes32,bytes32)'
          ](
            preimage,
            amount,
            await this.signer.getAddress(),
            refundAddress,
            timelock,
            sig.v,
            sig.r,
            sig.s,
            {
              ...gasPrices,
            },
          );
        } else {
          return this.etherSwap['claim(bytes32,uint256,address,uint256)'](
            preimage,
            amount,
            refundAddress,
            timelock,
            {
              ...gasPrices,
            },
          );
        }
      },
    );

  public claimBatchEther = async (
    swapsIds: string[],
    values: BatchClaimValues[],
  ): Promise<ContractTransactionResponse> => {
    if (!this.features.has(Feature.BatchClaim)) {
      throw Errors.NOT_SUPPORTED_BY_CONTRACT_VERSION();
    }

    return this.annotateLabel(
      TransactionLabelRepository.claimBatchLabel(swapsIds),
      this.networkDetails.symbol,
      async () => {
        const gasPrices = await getGasPrices(this.provider);
        const hasCommitments = values.some(
          (v) => v.commitmentSignature !== undefined,
        );

        // Use cheaper format when there are no commitments
        if (!hasCommitments) {
          return this.etherSwap[
            'claimBatch(bytes32[],uint256[],address[],uint256[])'
          ](
            values.map((v) => v.preimage),
            values.map((v) => v.amount),
            values.map((v) => v.refundAddress),
            values.map((v) => v.timelock),
            { ...gasPrices },
          );
        }

        return this.etherSwap[
          'claimBatch((bytes32,uint256,address,uint256,uint8,bytes32,bytes32)[])'
        ](
          values.map((v) => ({
            preimage: v.preimage,
            amount: v.amount,
            refundAddress: v.refundAddress,
            timelock: v.timelock,
            ...(v.commitmentSignature ?? emptySignature),
          })),
          { ...gasPrices },
        );
      },
    );
  };

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
      this.etherSwap['refund(bytes32,uint256,address,uint256)'](
        preimageHash,
        amount,
        claimAddress,
        timelock,
        {
          ...(await getGasPrices(this.provider)),
        },
      ),
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
      this.erc20Swap['lock(bytes32,uint256,address,address,uint256)'](
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
    const gasLimitEstimationWithoutPrepay = await this.erc20Swap[
      'lock(bytes32,uint256,address,address,uint256)'
    ].estimateGas(
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
      async () => {
        const gasPrices = await getGasPrices(this.provider);
        const commitment = await CommitmentRepository.getBySwapId(swap.id);

        if (commitment !== null && commitment !== undefined) {
          const sig = commitment.signatureEthers;

          return this.erc20Swap[
            'claim(bytes32,uint256,address,address,address,uint256,uint8,bytes32,bytes32)'
          ](
            preimage,
            amount,
            token.tokenAddress,
            await this.signer.getAddress(),
            refundAddress,
            timeLock,
            sig.v,
            sig.r,
            sig.s,
            {
              ...gasPrices,
            },
          );
        } else {
          return this.erc20Swap[
            'claim(bytes32,uint256,address,address,uint256)'
          ](preimage, amount, token.tokenAddress, refundAddress, timeLock, {
            ...gasPrices,
          });
        }
      },
    );

  public claimBatchToken = async (
    swapsIds: string[],
    token: ERC20WalletProvider,
    values: BatchClaimValues[],
  ): Promise<ContractTransactionResponse> => {
    if (!this.features.has(Feature.BatchClaim)) {
      throw Errors.NOT_SUPPORTED_BY_CONTRACT_VERSION();
    }

    return this.annotateLabel(
      TransactionLabelRepository.claimBatchLabel(swapsIds),
      token.symbol,
      async () => {
        const gasPrices = await getGasPrices(this.provider);
        const hasCommitments = values.some(
          (v) => v.commitmentSignature !== undefined,
        );

        // Use cheaper format when there are no commitments
        if (!hasCommitments) {
          return this.erc20Swap[
            'claimBatch(address,bytes32[],uint256[],address[],uint256[])'
          ](
            token.tokenAddress,
            values.map((v) => v.preimage),
            values.map((v) => v.amount),
            values.map((v) => v.refundAddress),
            values.map((v) => v.timelock),
            { ...gasPrices },
          );
        }

        return this.erc20Swap[
          'claimBatch(address,(bytes32,uint256,address,uint256,uint8,bytes32,bytes32)[])'
        ](
          token.tokenAddress,
          values.map((v) => ({
            preimage: v.preimage,
            amount: v.amount,
            refundAddress: v.refundAddress,
            timelock: v.timelock,
            ...(v.commitmentSignature ?? emptySignature),
          })),
          { ...gasPrices },
        );
      },
    );
  };

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
      this.erc20Swap['refund(bytes32,uint256,address,address,uint256)'](
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
    tx:
      | Promise<ContractTransactionResponse>
      | (() => Promise<ContractTransactionResponse>),
  ): Promise<ContractTransactionResponse> => {
    const res = typeof tx === 'function' ? await tx() : await tx;
    await TransactionLabelRepository.addLabel(res.hash, symbol, label);
    return res;
  };
}

export default ContractHandler;
