import { join } from 'path';
import { ContractABIs } from 'boltz-core';
import { existsSync, readFileSync } from 'fs';
import { ERC20 } from 'boltz-core/typechain/ERC20';
import { ERC20Swap } from 'boltz-core/typechain/ERC20Swap';
import { EtherSwap } from 'boltz-core/typechain/EtherSwap';
import { Signer, providers, Contract, Wallet, ContractInterface } from 'ethers';

export const connectEthereum = (providerUrl: string): Signer => {
  const provider = new providers.JsonRpcProvider(providerUrl);
  return provider.getSigner(0);
};

export const getContracts = async (signer: Signer): Promise<{
  token: ERC20,
  etherSwap: EtherSwap,
  erc20Swap: ERC20Swap,
}> => {
  const getCreateTxFromBlock = async <T>(blockNumber: number, abi: ContractInterface): Promise<T> => {
    const block = await signer.provider!.getBlock(blockNumber);
    const tx = await signer.provider!.getTransaction(block.transactions[0]);

    return new Contract((tx as any).creates, abi, signer) as unknown as T;
  };

  const [etherSwap, erc20Swap, token] = await Promise.all([
    getCreateTxFromBlock<EtherSwap>(1, ContractABIs.EtherSwap),
    getCreateTxFromBlock<ERC20Swap>(2, ContractABIs.ERC20Swap),
    getCreateTxFromBlock<ERC20>(3, ContractABIs.ERC20),
  ]);

  return {
    etherSwap,
    erc20Swap,
    token,
  };
};

export const getBoltzAddress = async (): Promise<string | undefined> => {
  const filePath = join(process.env.HOME!, '.boltz/seed.dat');

  if (existsSync(filePath)) {
    return Wallet.fromMnemonic(readFileSync(
      filePath,
      {
        encoding: 'utf-8',
      },
    )).getAddress();
  }

  return;
};
