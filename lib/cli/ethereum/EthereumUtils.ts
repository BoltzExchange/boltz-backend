import { join } from 'path';
import { ContractABIs } from 'boltz-core';
import { existsSync, readFileSync } from 'fs';
import { ERC20 } from 'boltz-core/typechain/ERC20';
import { ERC20Swap } from 'boltz-core/typechain/ERC20Swap';
import { EtherSwap } from 'boltz-core/typechain/EtherSwap';
import { Signer, providers, Contract, Wallet } from 'ethers';

const Constants = {
  erc20TokenAddress: '0xbBB04A924fca4b99F7D529Dc58203d6ecA30e5F7',

  etherSwapAddress: '0x2194630BfD334A2a7bB896C0384BbA35a98d9EB2',
  erc20SwapAddress: '0x1308b7739CE97199B5F1C95c915c6Cc3Ac81f86B',
};

const connectEthereum = (providerUrl: string, signerAddress: string): Signer => {
  const provider = new providers.JsonRpcProvider(providerUrl);
  return provider.getSigner(signerAddress);
};

const getContracts = (signer: Signer): { token: ERC20, etherSwap: EtherSwap, erc20Swap: ERC20Swap } => {
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
    ) as any as ERC20Swap,
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
