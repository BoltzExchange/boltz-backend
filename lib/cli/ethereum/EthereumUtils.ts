import { join } from 'path';
import { ContractABIs } from 'boltz-core';
import { existsSync, readFileSync } from 'fs';
import { ERC20 } from 'boltz-core/typechain/ERC20';
import { ERC20Swap } from 'boltz-core/typechain/ERC20Swap';
import { EtherSwap } from 'boltz-core/typechain/EtherSwap';
import { Signer, providers, Contract, Wallet } from 'ethers';

const Constants = {
  erc20TokenAddress: '0x03dd3D7e410650C2B521Bfe27186136dc0Cc61d0',

  etherSwapAddress: '0x6835E3a3BE8735B66f3d78087334A93CA24389Eb',
  erc20SwapAddress: '0xaC4804f9A5f60f4ECE2CF6a4FaBa8C370EA03B99',
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
