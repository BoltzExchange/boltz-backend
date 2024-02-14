import { crypto } from 'bitcoinjs-lib';
import { ContractTransactionResponse } from 'ethers';
import { Arguments } from 'yargs';
import { getHexBuffer } from '../../../Utils';
import {
  queryERC20SwapValues,
  queryEtherSwapValues,
} from '../../../wallet/ethereum/ContractUtils';
import BuilderComponents from '../../BuilderComponents';
import {
  connectEthereum,
  getContracts,
  getLogsQueryStartHeight,
} from '../EthereumUtils';

export const command = 'claim <preimage> [token]';

export const describe =
  'claims Ether or a ERC20 token from the corresponding swap contract';

export const builder = {
  preimage: {
    describe: 'preimage with which the funds have been locked',
    type: 'string',
  },
  token: BuilderComponents.token,
  queryStartHeightDelta: BuilderComponents.queryStartHeightDelta,
};

export const handler = async (argv: Arguments<any>): Promise<void> => {
  const signer = await connectEthereum(argv.provider);
  const { etherSwap, erc20Swap } = getContracts(argv.chain, signer);

  const preimage = getHexBuffer(argv.preimage);

  let transaction: ContractTransactionResponse;

  if (argv.token) {
    const erc20SwapValues = await queryERC20SwapValues(
      erc20Swap,
      crypto.sha256(preimage),
      await getLogsQueryStartHeight(
        signer.provider!,
        argv.queryStartHeightDelta,
      ),
    );
    transaction = await erc20Swap[
      'claim(bytes32,uint256,address,address,uint256)'
    ](
      preimage,
      erc20SwapValues.amount,
      erc20SwapValues.tokenAddress,
      erc20SwapValues.refundAddress,
      erc20SwapValues.timelock,
    );
  } else {
    const etherSwapValues = await queryEtherSwapValues(
      etherSwap,
      crypto.sha256(preimage),
      await getLogsQueryStartHeight(
        signer.provider!,
        argv.queryStartHeightDelta,
      ),
    );
    transaction = await etherSwap['claim(bytes32,uint256,address,uint256)'](
      preimage,
      etherSwapValues.amount,
      etherSwapValues.refundAddress,
      etherSwapValues.timelock,
    );
  }

  console.log(
    `Claimed ${argv.token ? 'ERC20 token' : 'Ether'} in: ${transaction.hash}`,
  );
};
