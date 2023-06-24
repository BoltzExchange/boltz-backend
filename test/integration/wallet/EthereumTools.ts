import { ERC20 } from 'boltz-core/typechain/ERC20';
import { Signer, Wallet, JsonRpcProvider } from 'ethers';

export type EthereumSetup = {
  signer: Signer;
  etherBase: Signer;
  provider: JsonRpcProvider;
};

export const getSigner = async (): Promise<EthereumSetup> => {
  const provider = new JsonRpcProvider('http://127.0.0.1:8545', undefined, {
    polling: true,
  });
  provider.pollingInterval = 500;

  return {
    provider,
    signer: Wallet.createRandom().connect(provider),
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
