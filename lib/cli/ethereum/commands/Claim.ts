import { Arguments } from 'yargs';
import { ContractTransaction } from 'ethers';
import { getHexBuffer } from '../../../Utils';
import BuilderComponents from '../../BuilderComponents';
import { connectEthereum, getContracts } from '../EthereumUtils';

export const command = 'claim <preimage> [token]';

export const describe = 'claims Ether or a ERC20 token from the corresponding swap contract';

export const builder = {
  preimage: {
    describe: 'preimage with which the funds have been locked',
    type: 'string',
  },
  token: BuilderComponents.token,
};

export const handler = async (argv: Arguments<any>): Promise<void> => {
  const signer = connectEthereum(argv.signer);
  const { etherSwap, erc20Swap } = getContracts(signer);

  const preimage = getHexBuffer(argv.preimage);

  let transaction: ContractTransaction;

  if (argv.token) {
    transaction = await erc20Swap.claim(preimage);
  } else {
    transaction = await etherSwap.claim(preimage);
  }

  await transaction.wait(1);

  console.log(`Claimed ${argv.token ? 'ERC20 token' : 'Ether'} in: ${transaction.hash}`);
};
