import { ContractABIs } from 'boltz-core';
import { Ierc20 } from 'boltz-core/typechain/Ierc20';
import { Signer, providers, Contract } from 'ethers';
import { Erc20Swap } from 'boltz-core/typechain/Erc20Swap';
import { EtherSwap } from 'boltz-core/typechain/EtherSwap';

const Constants = {
  erc20TokenAddress: '0x3A7C462A24c6299EA33ADE208e0f7DB593d002F9',

  etherSwapAddress: '0x7509536C8bE8Ac1E5112A089f7a5bC4894A040b9',
  erc20SwapAddress: '0x32E023673C5149A49552676cE85a69705Dab9696',
};

const connectEthereum = (signerAddress: string): Signer => {
  const provider = new providers.JsonRpcProvider('http://127.0.0.1:8545');
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

const calculateTimelock = async (signer: Signer, delta: number | undefined): Promise<number> => {
  return (await signer.provider!.getBlockNumber()) + (delta || 0);
};

export {
  Constants,

  getContracts,
  connectEthereum,
  calculateTimelock,
};
