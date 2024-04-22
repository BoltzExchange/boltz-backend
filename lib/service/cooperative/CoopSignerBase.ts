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
import { IChainClient } from '../../chain/ChainClient';
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

    const ourKeys = wallet.getKeysByIndex(details.keyIndex!);
    toClaim.cooperative = {
      sweepAddress: address,
      musig: createMusig(ourKeys, getHexBuffer(details.theirPublicKey!)),
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
    chainClient: IChainClient,
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
      details,
      tx,
      preimage,
    );
  };

  protected broadcastCooperativeTransaction = async <
    J extends Transaction | LiquidTransaction,
  >(
    swap: T,
    chainCurrency: Currency,
    musig: Musig,
    transaction: J,
    theirPubNonce: Buffer,
    theirPartialSignature: Buffer,
  ): Promise<{
    fee: number;
    transaction: J;
  }> => {
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

    const theirPublicKey = getHexBuffer(details.theirPublicKey!);
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
