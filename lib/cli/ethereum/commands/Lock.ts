import { Arguments } from 'yargs';
import { BigNumber, ContractTransaction } from 'ethers';
import { getHexBuffer } from '../../../Utils';
import { etherDecimals } from '../../../consts/Consts';
import BuilderComponents from '../../BuilderComponents';
import { Constants, connectEthereum, calculateTimelock, getContracts } from '../EthereumUtils';

export const command = 'lock <preimageHash> <amount> <timelock> [token]';

export const describe = 'locks Ether or a ERC20 token in the corresponding swap contract';

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
  const signer = connectEthereum(argv.signer);
  const { etherSwap, erc20Swap, token } = getContracts(signer);

  const preimageHash = getHexBuffer(argv.preimageHash);
  const amount = BigNumber.from(argv.amount).mul(etherDecimals);
  const timelock = await calculateTimelock(signer, argv.timelock);

  // TODO: query address from boltz
  const boltzAddress = '0xf75812E6F32a0465ea5369Ab1259cf0B5B2198d0';

  let transaction: ContractTransaction;

  if (argv.token) {
    await token.approve(Constants.erc20SwapAddress, amount);

    transaction = await erc20Swap.lock(
      preimageHash,
      amount,
      Constants.erc20TokenAddress,
      boltzAddress,
      timelock,
    );
  } else {
    transaction = await etherSwap.lock(
      preimageHash,
      boltzAddress,
      timelock,
      {
        value: amount,
      },
    );
  }

  await transaction.wait(1);

  console.log(`Sent ${argv.token ? 'ERC20 token' : 'Ether'} in: ${transaction.hash}`);
};
