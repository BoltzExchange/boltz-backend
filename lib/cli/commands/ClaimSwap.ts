import { Arguments } from 'yargs';
import { Networks } from 'boltz-core';
import { claimSwap, parseCommands } from '../Utils';
import { printResponse } from '../Command';
import BuilderComponents from '../BuilderComponents';

export const command = 'claimswap [network] [lockup_transaction] [redeem_script] [preimage] [claim_private_key] [destination_address] [fee_per_byte]';

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
    describe: 'private key with which a claiming transaction has to be signed',
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
    name: 'preimage',
    message: 'preimage of the invoice',
  },
  {
    type: 'input',
    name: 'claim_private_key',
    message: 'private key with which a claiming transaction has to be signed',
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
  },
];

export const handler = async (argv: Arguments<any>) => {
  const commands = await parseCommands(inquiries, argv);
  const claimTransaction = claimSwap(commands);

  printResponse({
    claimTransaction,
  });
};
