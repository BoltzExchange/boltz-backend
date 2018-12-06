import { Arguments } from 'yargs';
import { refundSwap, parseCommands } from '../Utils';
import Networks from '../../consts/Networks';
import { printResponse } from '../Command';
import BuilderComponents from '../BuilderComponents';

export const command = 'refundswap [network] [lockup_transaction] [redeem_script] [timeout_block_height] [refund_private_key] ' +
  '[destination_address] [fee_per_byte]';

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
    describe: 'private key with which a refund transaction has to be signed',
    type: 'string',
  },
  destination_address: BuilderComponents.destinationAddress,
  fee_per_byte: BuilderComponents.feePerByte,
};

const inquiries = [
  {
    type: 'list',
    name: 'network',
    message: BuilderComponents.network.describe,
    choices: Object.keys(Networks),
  },
  {
    type: 'input',
    name: 'lockup_transaction',
    message: BuilderComponents.lockupTransaction.describe,
  },
  {
    type: 'input',
    name: 'redeem_script',
    message: BuilderComponents.redeemScript.describe,
  },
  {
    type: 'input',
    name: 'timeout_block_height',
    message: 'timeout block height of the timelock',
    validate: (value) => {
      const valid = !isNaN(parseFloat(value));
      return valid || 'Please enter a number';
    },
    filter: Number,
  },
  {
    type: 'input',
    name: 'refund_private_key',
    message: 'private key with which a refund transaction has to be signed',
  },
  {
    type: 'input',
    name: 'destination_address',
    message: BuilderComponents.destinationAddress.describe,
  },
  {
    type: 'input',
    name: 'fee_per_byte',
    message: BuilderComponents.feePerByte.describe,
    default: BuilderComponents.feePerByte.detauls,
    validate: (value) => {
      const valid = !isNaN(parseFloat(value));
      return valid || 'Please enter a number';
    },
    filter: Number,
  },
];

export const handler = async (argv: Arguments) => {
  const commands = await parseCommands(inquiries, argv);
  const refundTransaction = refundSwap(commands);
  printResponse({
    refundTransaction,
  });
};
