import { Arguments } from 'yargs';
import { address, ECPair, Transaction } from 'bitcoinjs-lib';
import { Networks, detectSwap, constructClaimTransaction, constructRefundTransaction } from 'boltz-core';
import inquire from './inquire';
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

const parseParameters = (argv: Arguments) => {
  const network = getNetwork(argv.network);

  return {
    network,
    lockupTransaction: Transaction.fromHex(argv.lockup_transaction),
    redeemScript: getHexBuffer(argv.redeem_script),
    destinationScript: address.toOutputScript(argv.destination_address, network),
  };
};

const parseSwapOutput = (redeemScript: Buffer, lockupTransaction: Transaction) => {
  const swapOutput = detectSwap(redeemScript, lockupTransaction);

  if (!swapOutput) {
    throw 'Could not find swap in transaction';
  }

  return swapOutput;
};

export const parseCommands = async (inquiries: any[], argv: Arguments): Promise<Arguments> => {
  const argvLength = Object.keys(argv).length;
  if (argvLength === inquiries.length) {
    const answers = await inquire(inquiries);
    return { ...answers, ...argv };
  } else {
    return argv;
  }
};

export const claimSwap = (argv: Arguments) => {
  const { network, lockupTransaction, redeemScript, destinationScript } = parseParameters(argv);
  const claimKeys = ECPair.fromPrivateKey(getHexBuffer(argv.claim_private_key), { network });

  const swapOutput = parseSwapOutput(redeemScript, lockupTransaction);

  const claimTransaction = constructClaimTransaction(
    {
      redeemScript,
      preimage: getHexBuffer(argv.preimage),
      keys: claimKeys,
    },
    {
      txHash: lockupTransaction.getHash(),
      ...swapOutput,
    },
    destinationScript,
    argv.fee_per_byte,
  );

  return claimTransaction.toHex();
};

export const refundSwap = (argv: Arguments) => {
  const { network, lockupTransaction, redeemScript, destinationScript } = parseParameters(argv);
  const refundKeys = ECPair.fromPrivateKey(getHexBuffer(argv.refund_private_key), { network });

  const swapOutput = parseSwapOutput(redeemScript, lockupTransaction);

  const refundTransaction = constructRefundTransaction(
    refundKeys,
    redeemScript,
    argv.timeout_block_height,
    {
      txHash: lockupTransaction.getHash(),
      ...swapOutput,
    },
    destinationScript,
    argv.fee_per_byte,
  );

  return refundTransaction.toHex();
};
