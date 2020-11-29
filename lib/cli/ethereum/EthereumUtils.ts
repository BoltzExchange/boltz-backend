import { join } from 'path';
import { ContractABIs } from 'boltz-core';
import { existsSync, readFileSync } from 'fs';
import { Erc20Swap } from 'boltz-core/typechain/Erc20Swap';
import { EtherSwap } from 'boltz-core/typechain/EtherSwap';
import { Erc20 as ERC20 } from 'boltz-core/typechain/Erc20';
import { Signer, providers, Contract, Wallet } from 'ethers';

const Constants = {
  erc20TokenAddress: '0x4255bE490B6c19C970aF84cFEF8ABCd8991C34E5',

  etherSwapAddress: '0x3ca6Be983906f146EEAd04199042e0ab8620bC9c',
  erc20SwapAddress: '0xDD2639B5127BbA4E8d059c83519C64dd194f3c7E',
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
