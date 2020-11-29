import { Arguments } from 'yargs';
import { connectEthereum } from '../EthereumUtils';

export const command = 'mine <blocks>';

export const describe = 'mines the specified number of blocks on the Ganache chain';

export const builder = {
  blocks: {
    describe: 'number of blocks to mine',
    type: 'number',
  },
};

export const handler = async (argv: Arguments<any>): Promise<void> => {
  const signer = connectEthereum(argv.provider, argv.signer);
  const signerAddress = await signer.getAddress();

  // Since Ganache mines a block whenever a transaction is sent, we are just going to send transactions
  // and wait for a confirmation until the specified number of blocks is mined
  for (let i = 0; i < argv.blocks; i += 1) {
    const transaction = await signer.sendTransaction({
      to: signerAddress,
    });
    await transaction.wait(1);
  }

  console.log(`Mined ${argv.blocks} blocks`);
};
