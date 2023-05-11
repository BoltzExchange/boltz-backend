import { Arguments } from 'yargs';
import BuilderComponents from '../BuilderComponents';
import { prepareTx } from '../Command';
import { getHexBuffer, stringify } from '../../Utils';
import { constructClaimTransaction, toOutputScript } from '../../Core';

export const command =
  'claim <network> <preimage> <privateKey> <redeemScript> <rawTransaction> <destinationAddress> [feePerVbyte] [blindingKey]';

export const describe = 'claims reverse submarine or chain to chain swaps';

export const builder = {
  network: BuilderComponents.network,
  privateKey: BuilderComponents.privateKey,
  redeemScript: BuilderComponents.redeemScript,
  rawTransaction: BuilderComponents.rawTransaction,
  destinationAddress: BuilderComponents.destinationAddress,
  preimage: {
    describe: 'preimage of the swap',
    type: 'string',
  },
  feePerVbyte: BuilderComponents.feePerVbyte,
  blindingKey: {
    describe: 'Liquid blinding key for the HTLC address',
    type: 'string',
  },
};

export const handler = async (argv: Arguments<any>): Promise<void> => {
  const {
    keys,
    type,
    network,
    swapOutput,
    blindingKey,
    transaction,
    redeemScript,
    destinationAddress,
  } = await prepareTx(argv);

  const claimTransaction = constructClaimTransaction(
    {
      type,
      deriveBlindingKeyFromScript: () => ({
        privateKey: blindingKey,
      }),
      decodeAddress: toOutputScript(type, argv.destinationAddress, network),
    } as any,
    [
      {
        ...swapOutput,
        keys,
        redeemScript,
        txHash: transaction.getHash(),
        preimage: getHexBuffer(argv.preimage),
      } as any,
    ],
    destinationAddress,
    argv.feePerVbyte,
    // Needed for Liquid
    network.assetHash,
  ).toHex();

  console.log(stringify({ claimTransaction }));
};
