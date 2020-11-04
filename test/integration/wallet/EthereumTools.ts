import { ContractABIs } from 'boltz-core';
import { EtherSwap } from 'boltz-core/typechain/EtherSwap';
import { Erc20Swap } from 'boltz-core/typechain/Erc20Swap';
import { Erc20 as ERC20 } from 'boltz-core/typechain/Erc20';
import { BigNumber, Contract, providers, Signer, Wallet } from 'ethers';

export const getSigner = (): { provider: providers.WebSocketProvider, signer: Signer, etherBase: Signer } => {
  const provider = new providers.WebSocketProvider('http://127.0.0.1:8546');

  return {
    provider,
    signer: Wallet.createRandom().connect(provider),
    etherBase: provider.getSigner(0),
  };
};

export const getTokenContract = (signer: Signer): ERC20 => {
  return new Contract('0x5f7B47A8Bdf82c208784273509B8dc820c84C4A8', ContractABIs.ERC20, signer) as any as ERC20;
};

export const getSwapContracts = (signer: Signer): { etherSwap: EtherSwap, erc20Swap: Erc20Swap } => {
  return {
    etherSwap: new Contract('0xcBdFe3F3509AF7eb5683be5F4c30f7df9316d1AC', ContractABIs.EtherSwap, signer) as any as EtherSwap,
    erc20Swap: new Contract('0x086e6Dcfb55b98B86ADd9BDDc8f95A020D5717D3', ContractABIs.ERC20Swap, signer) as any as Erc20Swap,
  };
};

export const fundSignerWallet = async (signer: Signer, etherBase: Signer, token?: ERC20): Promise<void> => {
  const signerAddress = await signer.getAddress();

  const etherFundingTransaction = await etherBase.sendTransaction({
    to: signerAddress,
    value: BigNumber.from(10).pow(18),
  });

  await etherFundingTransaction.wait(1);

  if (token) {
    const tokenFundingTransaction = await token.connect(etherBase).transfer(
      signerAddress,
      BigNumber.from(10).pow(18),
    );

    await tokenFundingTransaction.wait(1);
  }
};
