import erc20 from 'boltz-core/out/ERC20.sol/ERC20.json';
import erc20Swap from 'boltz-core/out/ERC20Swap.sol/ERC20Swap.json';
import etherSwap from 'boltz-core/out/EtherSwap.sol/EtherSwap.json';

export const ContractABIs = {
  ERC20: erc20.abi,
  ERC20Swap: erc20Swap.abi,
  EtherSwap: etherSwap.abi,
} as const;
