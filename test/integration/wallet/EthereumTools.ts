import { Contract, providers, Signer } from 'ethers';
import { Ierc20 } from 'boltz-core/typechain/Ierc20';
import { ContractABIs } from 'boltz-core';
import { EtherSwap } from 'boltz-core/typechain/EtherSwap';
import { Erc20Swap } from 'boltz-core/typechain/Erc20Swap';

export const getSigner = (): { provider: providers.WebSocketProvider, signer: Signer } => {
  const provider = new providers.WebSocketProvider('http://127.0.0.1:8545');

  return {
    provider,
    signer: provider.getSigner('0xA7430D5ef25467365112C21A0e803cc72905cC50')
  };
};

export const getTokenContract = (signer: Signer): Ierc20 => {
  return new Contract('0x3A7C462A24c6299EA33ADE208e0f7DB593d002F9', ContractABIs.IERC20, signer) as Ierc20;
};

export const getSwapContracts = (signer: Signer): { etherSwap: EtherSwap, erc20Swap: Erc20Swap } => {
  return {
    etherSwap: new Contract('0x7509536C8bE8Ac1E5112A089f7a5bC4894A040b9', ContractABIs.EtherSwap, signer) as EtherSwap,
    erc20Swap: new Contract('0x32E023673C5149A49552676cE85a69705Dab9696', ContractABIs.ERC20Swap, signer) as Erc20Swap,
  };
};
