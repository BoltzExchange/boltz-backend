import { Network } from 'bitcoinjs-lib';
import {
  Networks,
  SwapTreeSerializer,
  Types,
  extractClaimPublicKeyFromReverseSwapTree,
  extractRefundPublicKeyFromReverseSwapTree,
} from 'boltz-core';
import { Networks as LiquidNetworks } from 'boltz-core/dist/lib/liquid';
import { LEAF_VERSION_TAPSCRIPT } from 'liquidjs-lib/src/bip341';
import { Arguments } from 'yargs';
import { parseTransaction } from '../../Core';
import { ECPair } from '../../ECPairHelper';
import { getHexBuffer, getHexString, stringify } from '../../Utils';
import { CurrencyType } from '../../consts/Enums';
import BoltzApiClient from '../BoltzApiClient';
import BuilderComponents, { ApiType, BuilderTypes } from '../BuilderComponents';
import {
  finalizeCooperativeTransaction,
  prepareCooperativeTransaction,
  setupCooperativeTransaction,
} from '../TaprootHelper';

export const command =
  'claim-cooperative-chain <swapId> <network> <preimage> <claimKeys> <claimTree> <refundKeys> <refundTree> <destinationAddress> [feePerVbyte] [blindingKey]';

export const describe = 'claims a Taproot Chain Swap cooperatively';

export const builder = {
  swapId: BuilderComponents.swapId,
  network: BuilderComponents.network,
  preimage: BuilderComponents.preimage,
  claimKeys: BuilderComponents.privateKey,
  claimTree: BuilderComponents.swapTree,
  refundKeys: BuilderComponents.privateKey,
  refundTree: BuilderComponents.swapTree,
  destinationAddress: BuilderComponents.destinationAddress,
  feePerVbyte: BuilderComponents.feePerVbyte,
  blindingKey: BuilderComponents.blindingKey,
};

const treeIsBitcoin = (tree: Types.SwapTree) =>
  tree.claimLeaf.version !== LEAF_VERSION_TAPSCRIPT;

const getNetworks = (
  network: string,
  claimTree: Types.SwapTree,
  refundTree: Types.SwapTree,
) => {
  const sanitizedNetwork =
    network[0].toUpperCase() + network.toLowerCase().slice(1);

  const getNetwork = (tree: Types.SwapTree): Network => {
    return treeIsBitcoin(tree)
      ? Networks[`bitcoin${sanitizedNetwork}`]
      : LiquidNetworks[`liquid${sanitizedNetwork}`];
  };

  return {
    claimNetwork: getNetwork(claimTree),
    refundNetwork: getNetwork(refundTree),
  };
};

export const handler = async (
  argv: Arguments<BuilderTypes<typeof builder> & ApiType>,
) => {
  const boltzClient = new BoltzApiClient(argv.api.endpoint);
  const swapStatus = await boltzClient.getStatus(argv.swapId);

  if (swapStatus.transaction === undefined) {
    throw 'no transaction in swap status';
  }

  const claimTree = SwapTreeSerializer.deserializeSwapTree(argv.claimTree);
  const refundTree = SwapTreeSerializer.deserializeSwapTree(argv.refundTree);

  const { claimNetwork, refundNetwork } = getNetworks(
    argv.network,
    claimTree,
    refundTree,
  );
  const claimType = treeIsBitcoin(claimTree)
    ? CurrencyType.BitcoinLike
    : CurrencyType.Liquid;

  const lockupTx = parseTransaction(claimType, swapStatus.transaction.hex);

  const claimDetails = await setupCooperativeTransaction(
    claimNetwork,
    claimType,
    claimTree,
    ECPair.fromPrivateKey(getHexBuffer(argv.claimKeys)),
    [extractRefundPublicKeyFromReverseSwapTree],
    lockupTx,
  );
  const claimTx = prepareCooperativeTransaction(
    claimNetwork,
    claimType,
    claimDetails.keys,
    claimDetails.tweakedKey,
    lockupTx,
    argv.destinationAddress,
    argv.feePerVbyte,
    argv.blindingKey,
  );

  const [apiClaimDetails, swapTransactions] = await Promise.all([
    boltzClient.getChainSwapClaimDetails(argv.swapId),
    boltzClient.getChainTransactions(argv.swapId),
  ]);

  const theirClaimType = treeIsBitcoin(refundTree)
    ? CurrencyType.BitcoinLike
    : CurrencyType.Liquid;
  const theirClaimDetails = await setupCooperativeTransaction(
    refundNetwork,
    theirClaimType,
    refundTree,
    ECPair.fromPrivateKey(getHexBuffer(argv.refundKeys)),
    [extractClaimPublicKeyFromReverseSwapTree],
    parseTransaction(
      theirClaimType,
      swapTransactions.userLock!.transaction.hex!,
    ),
  );
  theirClaimDetails.musig.aggregateNonces([
    [theirClaimDetails.theirPublicKey, getHexBuffer(apiClaimDetails.pubNonce)],
  ]);
  theirClaimDetails.musig.initializeSession(
    getHexBuffer(apiClaimDetails.transactionHash),
  );

  const ourClaimPartial = await boltzClient.getChainSwapClaimPartialSignature(
    argv.swapId,
    argv.preimage,
    {
      index: 0,
      transaction: claimTx.tx.toHex(),
      pubNonce: getHexString(Buffer.from(claimDetails.musig.getPublicNonce())),
    },
    {
      pubNonce: getHexString(
        Buffer.from(theirClaimDetails.musig.getPublicNonce()),
      ),
      partialSignature: getHexString(
        Buffer.from(theirClaimDetails.musig.signPartial()),
      ),
    },
  );

  console.log(
    stringify({
      claimTransaction: finalizeCooperativeTransaction(
        claimTx.tx,
        claimDetails.musig,
        claimNetwork,
        claimType,
        claimDetails.theirPublicKey,
        claimTx.details,
        ourClaimPartial,
      ).toHex(),
    }),
  );
};
