import { Arguments } from 'yargs';
import { ContractTransactionResponse } from 'ethers';
import { getHexBuffer } from '../../../Utils';
import BuilderComponents from '../../BuilderComponents';
import {
  connectEthereum,
  getContracts,
  getLogsQueryStartHeight,
} from '../EthereumUtils';
import {
  queryERC20SwapValues,
  queryEtherSwapValues,
} from '../../../wallet/ethereum/ContractUtils';

export const command = 'refund <preimageHash> [token]';

export const describe =
  'refunds Ether or a ERC20 token from the corresponding swap contract';

export const builder = {
  preimageHash: {
    describe: 'preimage hash with which the funds have been locked',
    type: 'string',
  },
  token: BuilderComponents.token,
};

export const handler = async (argv: Arguments<any>): Promise<void> => {
  const signer = await connectEthereum(argv.provider);
  const { etherSwap, erc20Swap } = getContracts(argv.chain, signer);

  const preimageHash = getHexBuffer(argv.preimageHash);

  let transaction: ContractTransactionResponse;

  if (argv.token) {
    const erc20SwapValues = await queryERC20SwapValues(
      erc20Swap,
      preimageHash,
      await getLogsQueryStartHeight(
        signer.provider!,
        argv.queryStartHeightDelta,
      ),
    );
    transaction = await erc20Swap.refund(
      preimageHash,
      erc20SwapValues.amount,
      erc20SwapValues.tokenAddress,
      erc20SwapValues.claimAddress,
      erc20SwapValues.timelock,
    );
  } else {
    const etherSwapValues = await queryEtherSwapValues(
      etherSwap,
      preimageHash,
      await getLogsQueryStartHeight(
        signer.provider!,
        argv.queryStartHeightDelta,
      ),
    );
    transaction = await etherSwap.refund(
      preimageHash,
      etherSwapValues.amount,
      etherSwapValues.claimAddress,
      etherSwapValues.timelock,
    );
  }

  console.log(
    `Refunded ${argv.token ? 'ERC20 token' : 'Ether'} in: ${transaction.hash}`,
  );
};
