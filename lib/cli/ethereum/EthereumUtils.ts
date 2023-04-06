import { join } from 'path';
import { ContractABIs } from 'boltz-core';
import { existsSync, readFileSync } from 'fs';
import { ERC20 } from 'boltz-core/typechain/ERC20';
import { ERC20Swap } from 'boltz-core/typechain/ERC20Swap';
import { EtherSwap } from 'boltz-core/typechain/EtherSwap';
import {
  Block,
  Signer,
  Wallet,
  Contract,
  Provider,
  JsonRpcProvider,
  getCreateAddress,
  TransactionResponse,
} from 'ethers';

class TransactionIterator {
  private static readonly firstBlock = 1;

  private block?: Block;
  private txCount = 0;

  constructor(private provider: Provider) {}

  public getNextTransaction = async (): Promise<TransactionResponse | null> => {
    if (this.block === undefined) {
      this.block = (await this.provider.getBlock(TransactionIterator.firstBlock))!;
    }

    if (this.txCount < this.block.transactions.length) {
      this.txCount++;
      return this.provider.getTransaction(this.block.transactions[this.txCount - 1]);
    } else {
      this.txCount = 0;
      this.block = (await this.provider.getBlock(this.block.number + 1))!;
      return this.getNextTransaction();
    }
  };
}

export const connectEthereum = async (providerUrl: string): Promise<Signer> => {
  const provider = new JsonRpcProvider(providerUrl);
  return provider.getSigner(0);
};

export const getContracts = async (signer: Signer): Promise<{
  token: ERC20,
  etherSwap: EtherSwap,
  erc20Swap: ERC20Swap,
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

export const getBoltzAddress = async (): Promise<string | undefined> => {
  const filePath = join(process.env.HOME!, '.boltz/seed.dat');

  if (existsSync(filePath)) {
    return Wallet.fromPhrase(readFileSync(
      filePath,
      {
        encoding: 'utf-8',
      },
    )).getAddress();
  }

  return;
};
