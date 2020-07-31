import { ContractABIs } from 'boltz-core';
import { Ierc20 } from 'boltz-core/typechain/Ierc20';
import { Signer, providers, Contract } from 'ethers';
import { Erc20Swap } from 'boltz-core/typechain/Erc20Swap';
import { EtherSwap } from 'boltz-core/typechain/EtherSwap';

const Constants = {
  erc20TokenAddress: '0x19CFe68340Fbca38349d09Ed7cC6A3b6b8d64211',

  etherSwapAddress: '0xE923CA8ec43f002964F9A06BC59B814270a252d4',
  erc20SwapAddress: '0x02EBC3024CDef2c3Bb3Bd9Fa82cCACB1C50A3368',
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
