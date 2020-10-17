import { join } from 'path';
import { ContractABIs } from 'boltz-core';
import { existsSync, readFileSync } from 'fs';
import { Erc20 as ERC20 } from 'boltz-core/typechain/Erc20';
import { Signer, providers, Contract, Wallet } from 'ethers';
import { Erc20Swap } from 'boltz-core/typechain/Erc20Swap';
import { EtherSwap } from 'boltz-core/typechain/EtherSwap';

const Constants = {
  erc20TokenAddress: '0x52926360A75EB50A9B242E748f094eCd73193036',

  etherSwapAddress: '0x76562e81C099cdFfbF6cCB664543817028552634',
  erc20SwapAddress: '0xD104195e630A2E26D33c8B215710E940Ca041351',
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
