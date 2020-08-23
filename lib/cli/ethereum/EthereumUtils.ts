import { ContractABIs } from 'boltz-core';
import { Ierc20 } from 'boltz-core/typechain/Ierc20';
import { Signer, providers, Contract } from 'ethers';
import { Erc20Swap } from 'boltz-core/typechain/Erc20Swap';
import { EtherSwap } from 'boltz-core/typechain/EtherSwap';

const Constants = {
  erc20TokenAddress: '0xc82f9a12855DE540370A097e109AF2D0fF85e24E',

  etherSwapAddress: '0x1c0dC6eAF99FEf235519cB17Aef9C4e29089fb7F',
  erc20SwapAddress: '0x6C4a24139F1FC8270339d9091405aB999f0CBf13',
};

const connectEthereum = (providerUrl: string, signerAddress: string): Signer => {
  const provider = new providers.JsonRpcProvider(providerUrl);
  return provider.getSigner(signerAddress);
};

const getContracts = (signer: Signer): { token: Contract, etherSwap: EtherSwap, erc20Swap: Erc20Swap } => {
  return {
    token: new Contract(
      Constants.erc20TokenAddress,
      ContractABIs.IERC20,
      signer,
    ) as Ierc20,

    etherSwap: new Contract(
      Constants.etherSwapAddress,
      ContractABIs.EtherSwap,
      signer,
    ) as EtherSwap,
    erc20Swap: new Contract(
      Constants.erc20SwapAddress,
      ContractABIs.ERC20Swap,
      signer,
    ) as Erc20Swap,
  };
};

export {
  Constants,

  getContracts,
  connectEthereum,
};
