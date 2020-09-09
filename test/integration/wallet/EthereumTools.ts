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
    etherBase: provider.getSigner('0x88532974EC20559608681A53F4Ac8C34dd5e2804'),
  };
};

export const getTokenContract = (signer: Signer): Ierc20 => {
  return new Contract('0xDf567Cd5d0cf3d90cE6E3E9F897e092f9ECE359a', ContractABIs.IERC20, signer) as Ierc20;
};

export const getSwapContracts = (signer: Signer): { etherSwap: EtherSwap, erc20Swap: Erc20Swap } => {
  return {
    etherSwap: new Contract('0x18A4374d714762FA7DE346E997f7e28Fb3744EC1', ContractABIs.EtherSwap, signer) as EtherSwap,
    erc20Swap: new Contract('0xC685b2c4369D7bf9242DA54E9c391948079d83Cd', ContractABIs.ERC20Swap, signer) as Erc20Swap,
  };
};

export const fundSignerWallet = async (signer: Signer, etherBase: Signer, token?: Contract): Promise<void> => {
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
