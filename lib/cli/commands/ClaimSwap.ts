import { Arguments } from 'yargs';
import { claimSwap } from '../Utils';
import { printResponse } from '../Command';
import BuilderComponents from '../BuilderComponents';

export const command = 'claimswap <network> <lockup_transaction> <redeem_script> <preimage> <claim_private_key> <destination_address>';

export const describe = 'claims the onchain part of a reverse swap';

export const builder = {
  network: BuilderComponents.network,
  lockup_transaction: BuilderComponents.lockupTransaction,
  redeem_script: BuilderComponents.redeemScript,
  preimage: {
    describe: 'preimage of the invoice',
    type: 'string',
  },
  claim_private_key: {
    describe: 'public key with which a claiming transaction has to be signed',
    type: 'string',
  },
  destination_address: BuilderComponents.destinationAddress,
};

export const handler = (argv: Arguments) => {
  const claimTransaction = claimSwap(argv);

  printResponse({
    claimTransaction,
  });
};
