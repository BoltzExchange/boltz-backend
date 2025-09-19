import { generateMnemonic } from 'bip39';
import { ContractABIs } from 'boltz-core';
import type { ERC20 } from 'boltz-core/typechain/ERC20';
import type { ERC20Swap } from 'boltz-core/typechain/ERC20Swap';
import type { EtherSwap } from 'boltz-core/typechain/EtherSwap';
import type { Signer } from 'ethers';
import { Contract, JsonRpcProvider, Wallet } from 'ethers';

export type EthereumSetup = {
  mnemonic: string;
  signer: Signer;
  etherBase: Signer;
  provider: JsonRpcProvider;
};

export const providerEndpoint = 'http://127.0.0.1:8545';

export const getSigner = async (): Promise<EthereumSetup> => {
  const provider = new JsonRpcProvider(providerEndpoint, undefined, {
    polling: true,
  });
  provider.pollingInterval = 500;

  const mnemonic = generateMnemonic();

  return {
    mnemonic,
    provider,
    signer: Wallet.fromPhrase(mnemonic).connect(provider),
    etherBase: await provider.getSigner(0),
  };
};

export const fundSignerWallet = async (
  signer: Signer,
  etherBase: Signer,
  token?: ERC20,
): Promise<void> => {
  const signerAddress = await signer.getAddress();
  const transferAmount = BigInt(10) ** BigInt(18);

  const etherFundingTransaction = await etherBase.sendTransaction({
    to: signerAddress,
    value: transferAmount,
  });

  if (token) {
    token = token.connect(etherBase) as ERC20;
    const tokenFundingTransaction = await token.transfer(
      signerAddress,
      transferAmount,
    );

    await tokenFundingTransaction.wait(1);
  }

  await etherFundingTransaction.wait(1);
};

export const waitForTransactionHash = async (
  provider: JsonRpcProvider,
  transactionHash: string,
): Promise<void> => {
  const transaction = await provider.getTransaction(transactionHash);
  await transaction!.wait(1);
};

export const getContracts = async (
  signer: Signer,
): Promise<{
  token: ERC20;
  etherSwap: EtherSwap;
  erc20Swap: ERC20Swap;
}> => {
  return {
    etherSwap: new Contract(
      '0x5FbDB2315678afecb367f032d93F642f64180aa3',
      ContractABIs.EtherSwap,
      signer,
    ) as unknown as EtherSwap,
    erc20Swap: new Contract(
      '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512',
      ContractABIs.ERC20Swap,
      signer,
    ) as unknown as ERC20Swap,
    token: new Contract(
      '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0',
      ContractABIs.ERC20,
      signer,
    ) as unknown as ERC20,
  };
};
