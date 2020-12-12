import { join } from 'path';
import { ContractABIs } from 'boltz-core';
import { existsSync, readFileSync } from 'fs';
import { Erc20Swap } from 'boltz-core/typechain/Erc20Swap';
import { EtherSwap } from 'boltz-core/typechain/EtherSwap';
import { Erc20 as ERC20 } from 'boltz-core/typechain/Erc20';
import { Signer, providers, Contract, Wallet } from 'ethers';

const Constants = {
  erc20TokenAddress: '0xd7a04099C5fa04ca8FFA789328B6d3249Bb3fD25',

  etherSwapAddress: '0x353dcb4b7A2786f41a4aB08c411983B637e7F649',
  erc20SwapAddress: '0x0ADa3E00344B3bcbB37237963ef7388b4FA822dc',
};

const connectEthereum = (providerUrl: string, signerAddress: string): Signer => {
  const provider = new providers.JsonRpcProvider(providerUrl);
  return provider.getSigner(signerAddress);
};

const getContracts = (signer: Signer): { token: ERC20, etherSwap: EtherSwap, erc20Swap: Erc20Swap } => {
  return {
    token: new Contract(
      Constants.erc20TokenAddress,
      ContractABIs.ERC20,
      signer,
    ) as any as ERC20,

    etherSwap: new Contract(
      Constants.etherSwapAddress,
      ContractABIs.EtherSwap,
      signer,
    ) as any as EtherSwap,
    erc20Swap: new Contract(
      Constants.erc20SwapAddress,
      ContractABIs.ERC20Swap,
      signer,
    ) as any as Erc20Swap,
  };
};

const getBoltzAddress = async (): Promise<string | undefined> => {
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

export {
  Constants,

  getContracts,
  connectEthereum,
  getBoltzAddress,
};
