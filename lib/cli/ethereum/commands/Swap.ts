import { Arguments } from 'yargs';
import { connectEthereum, getContracts } from '../EthereumUtils';
import BuilderComponents from '../../BuilderComponents';
import { getHexBuffer, getHexString, stringify } from '../../../Utils';

export const command = 'swap <preimageHash> [token]';

export const describe = 'queries a pending Ether or ERC20 swap from the corresponding contract';

export const builder = {
  preimageHash: {
    describe: 'preimage hash with which the funds have been locked',
    type: 'string',
  },
  token: BuilderComponents.token,
};

export const handler = async (argv: Arguments<any>): Promise<void> => {
  const signer = connectEthereum(argv.signer);
  const { etherSwap, erc20Swap } = getContracts(signer);

  const preimageHash = getHexBuffer(argv.preimageHash);

  let result: any;

  if (argv.token) {
    const swap = await erc20Swap.swaps(preimageHash);

    if (!swap.amount.isZero()) {
      result = {
        amount: swap.amount.toString(),
        erc20Token: swap.erc20Token,
        claimAddress: swap.claimAddress,
        refundAddress: swap.refundAddress,
        timelock: swap.timelock.toString(),
      };
    }
  } else {
    const swap = await etherSwap.swaps(preimageHash);

    if (!swap.amount.isZero()) {
      result = {
        amount: swap.amount.toString(),
        claimAddress: swap.claimAddress,
        refundAddress: swap.refundAddress,
        timelock: swap.timelock.toString(),
      };
    }
  }

  const kind = argv.token ? 'ERC20 token' : 'Ether';

  if (result) {
    console.log(`Pending ${kind} swap: ${stringify(result)}`);
  } else {
    console.log(`Could not find ${kind} swap with preimage hash: ${getHexString(preimageHash)}`);
  }
};
