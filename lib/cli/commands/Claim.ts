import { Arguments } from 'yargs';
import { address, ECPair, Transaction } from 'bitcoinjs-lib';
import { Networks, constructClaimTransaction, detectSwap } from 'boltz-core';
import { getHexBuffer, stringify } from '../../Utils';

export const command = 'claim <network> <preimage> <privateKey> <redeemScript> <rawTransaction> <destinationAddress>';

export const describe = 'claims reverse submarine or chain to chain swaps';

export const builder = {
  network: {
    describe: 'network on which the coins should be claimed',
    type: 'string',
  },
  preimage: {
    describe: 'preimage of the swap',
    type: 'string',
  },
  privateKey: {
    describe: 'private key of the claim key pair',
    type: 'string',
  },
  redeemScript: {
    describe: 'redeem script of the swap',
    type: 'string',
  },
  rawTransaction: {
    describe: 'raw lockup transaction',
    type: 'string',
  },
  destinationAddress: {
    describe: 'address to which the coins should be claimed',
    type: 'string',
  },
};

export const handler = (argv: Arguments<any>) => {
  const network = Networks[argv.network];

  const redeemScript = getHexBuffer(argv.redeemScript);
  const transaction = Transaction.fromHex(argv.rawTransaction);

  const swapOutput = detectSwap(redeemScript, transaction)!;

  const claimTransaction = constructClaimTransaction(
    [{
      ...swapOutput,
      txHash: transaction.getHash(),
      preimage: getHexBuffer(argv.preimage),
      redeemScript: getHexBuffer(argv.redeemScript),
      keys: ECPair.fromPrivateKey(getHexBuffer(argv.privateKey)),
    }],
    address.toOutputScript(argv.destinationAddress, network),
    2,
    true,
  );

  console.log(stringify({ claimTransaction: claimTransaction.toHex() }));
};
