import { Arguments } from 'yargs';
import { ContractTransactionResponse } from 'ethers';
import { getHexBuffer } from '../../../Utils';
import { etherDecimals } from '../../../consts/Consts';
import BuilderComponents from '../../BuilderComponents';
import {
  connectEthereum,
  getContracts,
  getBoltzAddress,
} from '../EthereumUtils';

export const command = 'lock <preimageHash> <amount> <timelock> [token]';

export const describe =
  'locks Ether or a ERC20 token in the corresponding swap contract';

export const builder = {
  preimageHash: {
    describe: 'preimage hash with which the funds should be locked',
    type: 'string',
  },
  amount: {
    describe: 'amount of tokens that should be locked up',
    type: 'number',
  },
  timelock: {
    describe: 'timelock delta in blocks',
    type: 'number',
  },
  token: BuilderComponents.token,
};

export const handler = async (argv: Arguments<any>): Promise<void> => {
  const signer = await connectEthereum(argv.provider);
  const { etherSwap, erc20Swap, token } = await getContracts(signer);

  const preimageHash = getHexBuffer(argv.preimageHash);
  const amount = BigInt(argv.amount) * etherDecimals;

  const boltzAddress = await getBoltzAddress();

  if (boltzAddress === undefined) {
    console.log(
      'Could not lock coins because the address of Boltz could not be queried',
    );
    return;
  }

  let transaction: ContractTransactionResponse;

  if (argv.token) {
    await token.approve(await erc20Swap.getAddress(), amount);

    transaction = await erc20Swap.lock(
      preimageHash,
      amount,
      await token.getAddress(),
      boltzAddress,
      argv.timelock,
    );
  } else {
    transaction = await etherSwap.lock(
      preimageHash,
      boltzAddress,
      argv.timelock,
      {
        value: amount,
      },
    );
  }

  await transaction.wait(1);

  console.log(
    `Sent ${argv.token ? 'ERC20 token' : 'Ether'} in: ${transaction.hash}`,
  );
};
