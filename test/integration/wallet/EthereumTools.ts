import { generateMnemonic } from 'bip39';
import { ContractABIs } from 'boltz-core';
import { ERC20 } from 'boltz-core/typechain/ERC20';
import { ERC20Swap } from 'boltz-core/typechain/ERC20Swap';
import { EtherSwap } from 'boltz-core/typechain/EtherSwap';
import {
  Block,
  Contract,
  JsonRpcProvider,
  Provider,
  Signer,
  TransactionResponse,
  Wallet,
  getCreateAddress,
} from 'ethers';

export type EthereumSetup = {
  mnemonic: string;
  signer: Signer;
  etherBase: Signer;
  provider: JsonRpcProvider;
};

export const providerEndpoint = 'http://127.0.0.1:8545';

export const getSigner = async (): Promise<EthereumSetup> => {
  const provider = new JsonRpcProvider(providerEndpoint, undefined, {
    polling: true,
  });
  provider.pollingInterval = 500;

  const mnemonic = generateMnemonic();

  return {
    mnemonic,
    provider,
    signer: Wallet.fromPhrase(mnemonic).connect(provider),
    etherBase: await provider.getSigner(0),
  };
};

export const fundSignerWallet = async (
  signer: Signer,
  etherBase: Signer,
  token?: ERC20,
): Promise<void> => {
  const signerAddress = await signer.getAddress();
  const transferAmount = BigInt(10) ** BigInt(18);

  const etherFundingTransaction = await etherBase.sendTransaction({
    to: signerAddress,
    value: transferAmount,
  });

  if (token) {
    token = token.connect(etherBase) as ERC20;
    const tokenFundingTransaction = await token.transfer(
      signerAddress,
      transferAmount,
    );

    await tokenFundingTransaction.wait(1);
  }

  await etherFundingTransaction.wait(1);
};

export const waitForTransactionHash = async (
  provider: JsonRpcProvider,
  transactionHash: string,
): Promise<void> => {
  const transaction = await provider.getTransaction(transactionHash);
  await transaction!.wait(1);
};

class TransactionIterator {
  private static readonly firstBlock = 1;

  private block?: Block;
  private txCount = 0;

  constructor(private provider: Provider) {}

  public getNextTransaction = async (): Promise<TransactionResponse | null> => {
    if (this.block === undefined) {
      this.block = (await this.provider.getBlock(
        TransactionIterator.firstBlock,
      ))!;
    }

    if (this.txCount < this.block.transactions.length) {
      this.txCount++;
      return this.provider.getTransaction(
        this.block.transactions[this.txCount - 1],
      );
    } else {
      this.txCount = 0;
      this.block = (await this.provider.getBlock(this.block.number + 1))!;
      return this.getNextTransaction();
    }
  };
}

export const getContracts = async (
  signer: Signer,
): Promise<{
  token: ERC20;
  etherSwap: EtherSwap;
  erc20Swap: ERC20Swap;
}> => {
  const contractsAbis = [
    ContractABIs.EtherSwap,
    ContractABIs.ERC20Swap,
    ContractABIs.ERC20,
  ];
  const contracts: any[] = [];

  const iter = new TransactionIterator(signer.provider!);

  for (const abi of contractsAbis) {
    const tx = await iter.getNextTransaction();
    contracts.push(new Contract(getCreateAddress(tx!), abi, signer));
  }

  return {
    etherSwap: contracts[0],
    erc20Swap: contracts[1],
    token: contracts[2],
  };
};
