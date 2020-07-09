import { Arguments } from 'yargs';
import { ContractTransaction } from 'ethers';
import { getHexBuffer } from '../../../Utils';
import BuilderComponents from '../../BuilderComponents';
import { connectEthereum, getContracts } from '../EthereumUtils';

export const command = 'refund <preimageHash> [token]';

export const describe = 'refunds Ether or a ERC20 token from the corresponding swap contract';

export const builder = {
  preimageHash: {
    describe: 'preimage hash with which the funds have been locked',
    type: 'string',
  },
  token: BuilderComponents.token,
};

export const handler = async (argv: Arguments<any>): Promise<any> => {
  const signer = connectEthereum(argv.signer);
  const { etherSwap, erc20Swap } = getContracts(signer);

  const preimageHash = getHexBuffer(argv.preimageHash);

  let transaction: ContractTransaction;

  if (argv.token) {
    transaction = await erc20Swap.refund(preimageHash);
  } else {
    transaction = await etherSwap.refund(preimageHash);
  }

  await transaction.wait(1);

  console.log(`Refunded ${argv.token ? 'ERC20 token' : 'Ether'} in: ${transaction.hash}`);
};
