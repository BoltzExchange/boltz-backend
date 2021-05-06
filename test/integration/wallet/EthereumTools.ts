import { ContractABIs } from 'boltz-core';
import { ERC20 } from 'boltz-core/typechain/ERC20';
import { EtherSwap } from 'boltz-core/typechain/EtherSwap';
import { ERC20Swap } from 'boltz-core/typechain/ERC20Swap';
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
  return new Contract('0x23d5395De7862A174b0cCbf9f7A350b4b8afC720', ContractABIs.ERC20, signer) as any as ERC20;
};

export const getSwapContracts = (signer: Signer): { etherSwap: EtherSwap, erc20Swap: ERC20Swap } => {
  return {
    etherSwap: new Contract('0xCc2dd65Bc10AdbE3C6cF341aaFB5d9440E72cc20', ContractABIs.EtherSwap, signer) as any as EtherSwap,
    erc20Swap: new Contract('0xf90664Edb44fd966089673f289834DaDb9888203', ContractABIs.ERC20Swap, signer) as any as ERC20Swap,
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

export const waitForTransactionHash = async (provider: providers.WebSocketProvider,  transactionHash: string): Promise<void> => {
  const transaction = await provider.getTransaction(transactionHash);
  await transaction.wait(1);
};
