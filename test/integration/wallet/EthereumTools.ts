import { ContractABIs } from 'boltz-core';
import { Ierc20 } from 'boltz-core/typechain/Ierc20';
import { EtherSwap } from 'boltz-core/typechain/EtherSwap';
import { Erc20Swap } from 'boltz-core/typechain/Erc20Swap';
import { BigNumber, Contract, providers, Signer, Wallet } from 'ethers';

export const getSigner = (): { provider: providers.WebSocketProvider, signer: Signer, etherBase: Signer } => {
  const provider = new providers.WebSocketProvider('http://127.0.0.1:8546');

  return {
    provider,
    signer: Wallet.createRandom().connect(provider),
    etherBase: provider.getSigner(0),
  };
};

export const getTokenContract = (signer: Signer): Ierc20 => {
  return new Contract('0x504eF817bFdE039b33189C7eb8aa8861c25392C1', ContractABIs.IERC20, signer) as any as Ierc20;
};

export const getSwapContracts = (signer: Signer): { etherSwap: EtherSwap, erc20Swap: Erc20Swap } => {
  return {
    etherSwap: new Contract('0xc6105E7F62690cee5bf47f8d8A353403D93eCC6B', ContractABIs.EtherSwap, signer) as any as EtherSwap,
    erc20Swap: new Contract('0x0Cd61AD302e9B2D76015050D44218eCF53cFadC9', ContractABIs.ERC20Swap, signer) as any as Erc20Swap,
  };
};

export const fundSignerWallet = async (signer: Signer, etherBase: Signer, token?: Ierc20): Promise<void> => {
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
