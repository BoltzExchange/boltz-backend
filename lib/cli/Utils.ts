import inquirer from 'inquirer';
import { Arguments } from 'yargs';
import { address, ECPair, Transaction } from 'bitcoinjs-lib';
import { Networks, detectSwap, constructClaimTransaction, constructRefundTransaction } from 'boltz-core';
import { getHexBuffer } from '../Utils';
import { OutputType, OrderSide } from '../proto/boltzrpc_pb';

export const getOrderSide = (side: string) => {
  switch (side.toLowerCase()) {
    case 'buy': return OrderSide.BUY;
    case 'sell': return OrderSide.SELL;

    default: throw `could not find order side: ${side}`;
  }
};

export const getOutputType = (type: string) => {
  switch (type.toLowerCase()) {
    case 'bech32': return OutputType.BECH32;
    case 'compatibility': return OutputType.COMPATIBILITY;

    default: return OutputType.LEGACY;
  }
};

export const getNetwork = (networkKey: string) => {
  const network = Networks[networkKey];

  if (!network) {
    throw `Could not find network: ${networkKey}`;
  }

  return network;
};

const parseParameters = (argv: Arguments<any>) => {
  const network = getNetwork(argv.network);

  return {
    network,
    lockupTransaction: Transaction.fromHex(argv.lockup_transaction),
    redeemScript: getHexBuffer(argv.redeem_script),
    destinationScript: address.toOutputScript(argv.destination_address, network),
  };
};

const getSwapOutput = (redeemScript: Buffer, lockupTransaction: Transaction) => {
  const swapOutput = detectSwap(redeemScript, lockupTransaction);

  if (!swapOutput) {
    throw 'Could not find swap in transaction';
  }

  return swapOutput;
};

export const parseCommands = async (inquiries: any[], argv: Arguments<any>): Promise<Arguments<any>> => {
  const argvLength = Object.keys(argv).length;
  if (argvLength === inquiries.length) {
    const answers = await inquirer.prompt(inquiries);
    return { ...answers, ...argv };
  } else {
    return argv;
  }
};

export const claimSwap = (argv: Arguments<any>) => {
  const { network, lockupTransaction, redeemScript, destinationScript } = parseParameters(argv);
  const claimKeys = ECPair.fromPrivateKey(getHexBuffer(argv.claim_private_key), { network });

  const swapOutput = getSwapOutput(redeemScript, lockupTransaction);

  const claimTransaction = constructClaimTransaction(
    [{
      ...swapOutput,
      redeemScript,
      keys: claimKeys,
      txHash: lockupTransaction.getHash(),
      preimage: getHexBuffer(argv.preimage),
    }],
    destinationScript,
    argv.fee_per_byte,
    true,
  );

  return claimTransaction.toHex();
};

export const refundSwap = (argv: Arguments<any>) => {
  const { network, lockupTransaction, redeemScript, destinationScript } = parseParameters(argv);
  const refundKeys = ECPair.fromPrivateKey(getHexBuffer(argv.refund_private_key), { network });

  const swapOutput = getSwapOutput(redeemScript, lockupTransaction);

  const refundTransaction = constructRefundTransaction(
    [{
      ...swapOutput,
      redeemScript,
      keys: refundKeys,
      txHash: lockupTransaction.getHash(),
    }],
    destinationScript,
    argv.timeout_block_height,
    argv.fee_per_byte,
  );

  return refundTransaction.toHex();
};
