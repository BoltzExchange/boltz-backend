import { ContractABIs } from 'boltz-core';
import { Ierc20 } from 'boltz-core/typechain/Ierc20';
import { Signer, providers, Contract } from 'ethers';
import { Erc20Swap } from 'boltz-core/typechain/Erc20Swap';
import { EtherSwap } from 'boltz-core/typechain/EtherSwap';

const Constants = {
  erc20TokenAddress: '0x0078371BDeDE8aAc7DeBfFf451B74c5EDB385Af7',

  etherSwapAddress: '0x7c2C195CD6D34B8F845992d380aADB2730bB9C6F',
  erc20SwapAddress: '0x8858eeB3DfffA017D4BCE9801D340D36Cf895CCf',
};

const connectEthereum = (signerAddress: string): Signer => {
  const provider = new providers.JsonRpcProvider('http://127.0.0.1:8545');
  return provider.getSigner(signerAddress);
};

const getContracts = (signer: Signer): { etherSwap: Contract, token: Contract, erc20Swap: Contract } => {
  return {
    etherSwap: new Contract(
      Constants.etherSwapAddress,
      ContractABIs.EtherSwap,
      signer,
    ) as EtherSwap,

    token: new Contract(
      Constants.erc20TokenAddress,
      ContractABIs.IERC20,
      signer,
    ) as Ierc20,
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
