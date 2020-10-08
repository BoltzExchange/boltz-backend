import { ContractABIs } from 'boltz-core';
import { Erc20 as ERC20 } from 'boltz-core/typechain/Erc20';
import { Signer, providers, Contract } from 'ethers';
import { Erc20Swap } from 'boltz-core/typechain/Erc20Swap';
import { EtherSwap } from 'boltz-core/typechain/EtherSwap';

const Constants = {
  erc20TokenAddress: '0x504eF817bFdE039b33189C7eb8aa8861c25392C1',

  etherSwapAddress: '0xc6105E7F62690cee5bf47f8d8A353403D93eCC6B',
  erc20SwapAddress: '0x0Cd61AD302e9B2D76015050D44218eCF53cFadC9',
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

export {
  Constants,

  getContracts,
  connectEthereum,
};
