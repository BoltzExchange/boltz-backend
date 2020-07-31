import { Arguments } from 'yargs';
import { BigNumber } from 'ethers';
import { etherDecimals } from '../../../consts/Consts';
import BuilderComponents from '../../BuilderComponents';
import { connectEthereum, getContracts } from '../EthereumUtils';

export const command = 'send <amount> [destination] [token]';

export const describe = 'sends Ether or a ERC20 token to the destined address';

export const builder = {
  amount: {
    describe: 'amount of tokens that should be sent',
    type: 'number',
  },
  destination: {
    describe: 'address to which the coins should be sent',
    type: 'string',
    default: '0xf75812E6F32a0465ea5369Ab1259cf0B5B2198d0',
  },
  token: BuilderComponents.token,
};

export const handler = async (argv: Arguments<any>): Promise<void> => {
  const signer = connectEthereum(argv.provider, argv.signer);
  const { token } = getContracts(signer);

  const amount = BigNumber.from(argv.amount).mul(etherDecimals);

  let transactionHash: string;

  if (argv.token) {
    const transaction = await token.transfer(argv.destination, amount);
    await transaction.wait(1);

    transactionHash = transaction.hash;
  } else {
    const transaction = await signer.sendTransaction({
      value: amount,
      to: argv.destination,
    });
    await transaction.wait(1);

    transactionHash = transaction.hash;
  }

  console.log(`Sent ${argv.token ? 'ERC20 token' : 'Ether'} in: ${transactionHash}`);
};
