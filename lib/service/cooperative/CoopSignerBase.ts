import { Transaction } from 'bitcoinjs-lib';
import { Musig, SwapTreeSerializer } from 'boltz-core';
import { Transaction as LiquidTransaction } from 'liquidjs-lib/src/transaction';
import {
  ClaimDetails,
  LiquidClaimDetails,
  calculateTransactionFee,
  constructClaimDetails,
  constructClaimTransaction,
  createMusig,
  hashForWitnessV1,
  parseTransaction,
  tweakMusig,
} from '../../Core';
import Logger from '../../Logger';
import { getHexBuffer } from '../../Utils';
import ChainClient from '../../chain/ChainClient';
import { SwapType, swapTypeToPrettyString } from '../../consts/Enums';
import TypedEventEmitter from '../../consts/TypedEventEmitter';
import ChainSwapData from '../../db/models/ChainSwapData';
import Swap from '../../db/models/Swap';
import { ChainSwapInfo } from '../../db/repositories/ChainSwapRepository';
import SwapOutputType from '../../swap/SwapOutputType';
import Wallet from '../../wallet/Wallet';
import WalletManager, { Currency } from '../../wallet/WalletManager';
import Errors from '../Errors';

type CooperativeDetails = {
  musig: Musig;
  sweepAddress: string;
  transaction: Transaction | LiquidTransaction;
};

type SwapToClaim<T> = {
  swap: T;
  cooperative?: CooperativeDetails;
};

abstract class CoopSignerBase<
  T extends Swap | ChainSwapInfo,
  K extends Record<string | symbol, any>,
> extends TypedEventEmitter<K> {
  protected constructor(
    protected readonly logger: Logger,
    protected readonly walletManager: WalletManager,
    private readonly swapOutputType: SwapOutputType,
  ) {
    super();
  }

  protected createCoopDetails = async (
    chainCurrency: Currency,
    toClaim: SwapToClaim<T>,
  ): Promise<{
    pubNonce: Buffer;
    publicKey: Buffer;
    transactionHash: Buffer;
  }> => {
    const wallet = this.walletManager.wallets.get(chainCurrency.symbol)!;
    const address =
      toClaim.cooperative?.sweepAddress || (await wallet.getAddress());

    const isSubmarine = toClaim.swap.type === SwapType.Submarine;

    const details = isSubmarine
      ? (toClaim.swap as Swap)
      : (toClaim.swap as ChainSwapInfo).receivingData;

    const keyIndex = isSubmarine
      ? (details as Swap).keyIndex!
      : (details as ChainSwapData).keyIndex!;
    const theirPublicKey = isSubmarine
      ? (details as Swap).refundPublicKey!
      : (details as ChainSwapData).theirPublicKey!;

    const ourKeys = wallet.getKeysByIndex(keyIndex);
    toClaim.cooperative = {
      sweepAddress: address,
      musig: createMusig(ourKeys, getHexBuffer(theirPublicKey)),
      transaction: constructClaimTransaction(
        wallet,
        [
          await this.constructClaimDetails(
            chainCurrency.chainClient!,
            wallet,
            toClaim,
          ),
        ] as ClaimDetails[] | LiquidClaimDetails[],
        address,
        await chainCurrency.chainClient!.estimateFee(),
      ),
    };

    return {
      publicKey: ourKeys.publicKey,
      pubNonce: Buffer.from(toClaim.cooperative.musig.getPublicNonce()),
      transactionHash: await hashForWitnessV1(
        chainCurrency,
        toClaim.cooperative.transaction,
        0,
      ),
    };
  };

  /**
   * Cooperative when the preimage is undefined
   */
  protected constructClaimDetails = async (
    chainClient: ChainClient,
    wallet: Wallet,
    toClaim: SwapToClaim<T>,
    preimage?: Buffer,
  ): Promise<ClaimDetails | LiquidClaimDetails> => {
    const { swap } = toClaim;
    const details =
      swap.type === SwapType.Submarine
        ? (swap as Swap)
        : (swap as ChainSwapInfo).receivingData;

    const tx = parseTransaction(
      wallet.type,
      await chainClient.getRawTransaction(details.lockupTransactionId!),
    );

    return constructClaimDetails(
      this.swapOutputType,
      wallet,
      swap.type,
      details,
      tx,
      preimage,
      preimage === undefined,
    );
  };

  protected broadcastCooperativeTransaction = async (
    swap: T,
    chainCurrency: Currency,
    musig: Musig,
    transaction: Transaction | LiquidTransaction,
    theirPubNonce: Buffer,
    theirPartialSignature: Buffer,
  ) => {
    const isSubmarine = swap.type === SwapType.Submarine;
    const details = isSubmarine
      ? (swap as Swap)
      : (swap as ChainSwapInfo).receivingData;

    const swapTree = isSubmarine
      ? (details as Swap).redeemScript!
      : (details as ChainSwapData).swapTree!;
    tweakMusig(
      chainCurrency.type,
      musig,
      SwapTreeSerializer.deserializeSwapTree(swapTree),
    );

    const theirPublicKey = getHexBuffer(
      isSubmarine
        ? (details as Swap).refundPublicKey!
        : (details as ChainSwapData).theirPublicKey!,
    );
    musig.aggregateNonces([[theirPublicKey, theirPubNonce]]);
    musig.initializeSession(
      await hashForWitnessV1(chainCurrency, transaction, 0),
    );
    if (!musig.verifyPartial(theirPublicKey, theirPartialSignature)) {
      throw Errors.INVALID_PARTIAL_SIGNATURE();
    }

    musig.addPartial(theirPublicKey, theirPartialSignature);
    musig.signPartial();

    transaction.ins[0].witness = [musig.aggregatePartials()];

    this.logger.info(
      `Broadcasting cooperative ${chainCurrency.symbol} claim of ${swapTypeToPrettyString(swap.type)} Swap ${swap.id} in: ${transaction.getId()}`,
    );
    await chainCurrency.chainClient!.sendRawTransaction(transaction.toHex());

    return {
      transaction,
      fee: await calculateTransactionFee(
        chainCurrency.chainClient!,
        transaction,
      ),
    };
  };
}

export default CoopSignerBase;
export { SwapToClaim, CooperativeDetails };
