import { Arguments } from 'yargs';
import { refundSwap } from '../Utils';
import { printResponse } from '../Command';
import BuilderComponents from '../BuilderComponents';

export const command = 'refundswap <network> <lockup_transaction> <redeem_script> <timeout_block_height> <refund_private_key> ' +
  '<destination_address> [fee_per_byte]';

export const describe = 'refunds the onchain part of a swap';

export const builder = {
  network: BuilderComponents.network,
  lockup_transaction: BuilderComponents.lockupTransaction,
  redeem_script: BuilderComponents.redeemScript,
  timeout_block_height: {
    describe: 'timeout block height of the timelock',
    type: 'number',
  },
  refund_private_key: {
    describe: 'public key with which a refund transaction has to be signed',
    type: 'string',
  },
  destination_address: BuilderComponents.destinationAddress,
  fee_per_byte: BuilderComponents.feePerByte,
};

export const handler = (argv: Arguments) => {
  const refundTransaction = refundSwap(argv);

  printResponse({
    refundTransaction,
  });
};
