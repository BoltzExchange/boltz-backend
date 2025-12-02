import AsyncLock from 'async-lock';
import { SwapTreeSerializer } from 'boltz-core';
import { Op } from 'sequelize';
import type Logger from '../../Logger';
import { formatError, getHexBuffer, getHexString } from '../../Utils';
import {
  CurrencyType,
  SwapUpdateEvent,
  currencyTypeToString,
  swapTypeToPrettyString,
} from '../../consts/Enums';
import type Swap from '../../db/models/Swap';
import type { ChainSwapInfo } from '../../db/repositories/ChainSwapRepository';
import ChainSwapRepository from '../../db/repositories/ChainSwapRepository';
import WrappedSwapRepository from '../../db/repositories/WrappedSwapRepository';
import type SwapOutputType from '../../swap/SwapOutputType';
import type { Currency } from '../../wallet/WalletManager';
import type WalletManager from '../../wallet/WalletManager';
import Errors from '../Errors';
import type {
  CooperativeClientDetails,
  CooperativeDetails,
  SwapToClaim,
} from './CoopSignerBase';
import CoopSignerBase, {
  cooperativeSignaturesDisabledMessage,
} from './CoopSignerBase';
import type { PartialSignature } from './MusigSigner';
import MusigSigner from './MusigSigner';
import {
  checkArkTransaction,
  createPartialSignature,
  isPreimageValid,
} from './Utils';

type TheirSigningData = {
  pubNonce: Buffer;
  transaction: Buffer;
  index: number;
};

class ChainSwapSigner extends CoopSignerBase<{ claim: ChainSwapInfo }> {
  private static readonly swapsToClaimLock = 'swapsToClaim';
  private static readonly refundSignatureLock = 'refundSignature';
  private static readonly cooperativeBroadcastLock = 'cooperativeBroadcast';

  private attemptSettleSwap!: (
    currency: Currency,
    swap: Swap | ChainSwapInfo,
    outgoingChannelId?: string,
    preimage?: Buffer,
  ) => Promise<void>;

  private readonly lock = new AsyncLock();
  private readonly swapsToClaim = new Map<string, SwapToClaim<ChainSwapInfo>>();
  private disableCooperative = false;

  constructor(
    logger: Logger,
    private readonly currencies: Map<string, Currency>,
    walletManager: WalletManager,
    swapOutputType: SwapOutputType,
  ) {
    super(logger, walletManager, swapOutputType);
  }

  public setDisableCooperative = (disabled: boolean) => {
    this.disableCooperative = disabled;
  };

  public refundSignatureLock = <T>(cb: () => Promise<T>): Promise<T> =>
    this.lock.acquire(ChainSwapSigner.refundSignatureLock, cb);

  public init = async () => {
    const claimableChainSwaps = await ChainSwapRepository.getChainSwaps({
      status: {
        [Op.or]: [
          SwapUpdateEvent.TransactionServerMempool,
          SwapUpdateEvent.TransactionServerConfirmed,
        ],
      },
    });

    for (const swap of claimableChainSwaps) {
      await this.registerForClaim(swap);
    }
  };

  public setAttemptSettle = (func: typeof this.attemptSettleSwap) => {
    this.attemptSettleSwap = func;
  };

  public signRefund = (
    swapId: string,
    theirNonce: Buffer,
    transaction: Buffer,
    index: number,
  ): Promise<PartialSignature> =>
    this.refundSignatureLock(async () => {
      const swap = await ChainSwapRepository.getChainSwap({ id: swapId });
      if (!swap) {
        throw Errors.SWAP_NOT_FOUND(swapId);
      }

      const currency = this.currencies.get(swap.receivingData.symbol);
      if (currency === undefined || currency.chainClient === undefined) {
        throw Errors.CURRENCY_NOT_UTXO_BASED();
      }

      if (this.disableCooperative) {
        throw Errors.NOT_ELIGIBLE_FOR_COOPERATIVE_REFUND(
          cooperativeSignaturesDisabledMessage,
        );
      }

      {
        const rejectionReason =
          await MusigSigner.refundNonEligibilityReason(swap);
        if (rejectionReason !== undefined) {
          this.logger.verbose(
            `Not creating partial signature for refund of ${swapTypeToPrettyString(swap.type)} Swap ${swap.id}: ${rejectionReason}`,
          );
          throw Errors.NOT_ELIGIBLE_FOR_COOPERATIVE_REFUND(rejectionReason);
        }
      }

      this.logger.debug(
        `Creating partial signature for refund of ${swapTypeToPrettyString(swap.type)} Swap ${swap.id}`,
      );

      const sig = await createPartialSignature(
        currency,
        this.walletManager.wallets.get(swap.receivingData.symbol)!,
        SwapTreeSerializer.deserializeSwapTree(swap.receivingData.swapTree!),
        swap.receivingData.keyIndex!,
        getHexBuffer(swap.receivingData.theirPublicKey!),
        theirNonce,
        transaction,
        index,
      );

      await ChainSwapRepository.setRefundSignatureCreated(swap.id);

      return sig;
    });

  public signRefundArk = async (
    swapId: string,
    transaction: string,
    checkpoint: string,
  ): Promise<{ transaction: string; checkpoint: string }> => {
    return await this.refundSignatureLock(async () => {
      const swap = await ChainSwapRepository.getChainSwap({ id: swapId });
      if (!swap) {
        throw Errors.SWAP_NOT_FOUND(swapId);
      }

      const currency = this.currencies.get(swap.receivingData.symbol);
      if (
        currency === undefined ||
        currency.type !== CurrencyType.Ark ||
        currency.arkNode === undefined
      ) {
        throw new Error(
          `currency is not ${currencyTypeToString(CurrencyType.Ark)}`,
        );
      }

      if (this.disableCooperative) {
        throw Errors.NOT_ELIGIBLE_FOR_COOPERATIVE_REFUND(
          cooperativeSignaturesDisabledMessage,
        );
      }

      {
        const rejectionReason =
          await MusigSigner.refundNonEligibilityReason(swap);
        if (rejectionReason !== undefined) {
          this.logger.verbose(
            `Not creating partial signature for refund of ${currencyTypeToString(CurrencyType.Ark)} ${swapTypeToPrettyString(swap.type)} Swap ${swap.id}: ${rejectionReason}`,
          );
          throw Errors.NOT_ELIGIBLE_FOR_COOPERATIVE_REFUND(rejectionReason);
        }
      }

      checkArkTransaction(
        transaction,
        checkpoint,
        swap.receivingData.transactionId,
        swap.receivingData.transactionVout,
      );

      this.logger.debug(
        `Creating refund signature for ${currencyTypeToString(CurrencyType.Ark)} ${swapTypeToPrettyString(swap.type)} Swap ${swap.id}`,
      );

      const [transactionSigned, checkpointSigned] = await Promise.all([
        currency.arkNode.signTransaction(transaction),
        currency.arkNode.signTransaction(checkpoint),
      ]);

      await ChainSwapRepository.setRefundSignatureCreated(swap.id);

      return {
        transaction: transactionSigned,
        checkpoint: checkpointSigned,
      };
    });
  };

  public registerForClaim = async (swap: ChainSwapInfo) => {
    await this.lock.acquire(ChainSwapSigner.swapsToClaimLock, async () => {
      if (this.swapsToClaim.has(swap.id)) {
        return;
      }

      if (!this.canClaimCooperatively(swap)) {
        return;
      }

      this.swapsToClaim.set(swap.id, {
        swap,
      });
    });
  };

  public removeFromClaimable = async (id: string) => {
    await this.lock.acquire(ChainSwapSigner.swapsToClaimLock, async () => {
      this.swapsToClaim.delete(id);
    });
  };

  public getCooperativeDetails = async (
    swap: ChainSwapInfo,
  ): Promise<CooperativeClientDetails> => {
    if (this.disableCooperative) {
      throw Errors.NOT_ELIGIBLE_FOR_COOPERATIVE_CLAIM(
        cooperativeSignaturesDisabledMessage,
      );
    }

    if (swap.status === SwapUpdateEvent.TransactionClaimed) {
      throw Errors.SERVER_CLAIM_SUCCEEDED_ALREADY();
    }

    const claimDetails = await this.getToClaimDetails(swap.id);
    if (claimDetails === undefined) {
      throw Errors.NOT_ELIGIBLE_FOR_COOPERATIVE_CLAIM();
    }

    return this.createCoopDetails(
      this.currencies.get(swap.receivingData.symbol)!,
      claimDetails,
    );
  };

  public signClaim = async (
    swap: ChainSwapInfo,
    toSign: TheirSigningData,
    preimage?: Buffer,
    theirSignature?: PartialSignature,
  ): Promise<PartialSignature> => {
    // To avoid clients shooting themselves in the foot, we don't allow cooperative claims for refunded swaps
    if (swap.status === SwapUpdateEvent.TransactionRefunded) {
      this.logger.verbose(
        `Not cooperatively claiming ${swapTypeToPrettyString(swap.type)} Swap ${swap.id} because it has been refunded`,
      );
      throw Errors.NOT_ELIGIBLE_FOR_COOPERATIVE_CLAIM();
    }

    return await this.lock.acquire(
      ChainSwapSigner.cooperativeBroadcastLock,
      async () => {
        if (this.disableCooperative) {
          throw Errors.NOT_ELIGIBLE_FOR_COOPERATIVE_CLAIM(
            cooperativeSignaturesDisabledMessage,
          );
        }

        // If the swap is settled already, we still allow the partial signing of claims
        if (!swap.isSettled) {
          if (preimage === undefined || !isPreimageValid(swap, preimage)) {
            this.logNotCooperativelyClaiming(swap, 'preimage is incorrect');
            throw Errors.INCORRECT_PREIMAGE();
          }

          this.logger.debug(
            `Got preimage for ${swapTypeToPrettyString(swap.type)} Swap ${swap.id}: ${getHexString(preimage)}`,
          );
          // TODO: broadcast the claim eventually when the preimage is correct but the signature is not?
          swap = await WrappedSwapRepository.setPreimage(swap, preimage);

          if (this.canClaimCooperatively(swap)) {
            const claimDetails = await this.getToClaimDetails(swap.id);
            if (
              claimDetails === undefined ||
              claimDetails.cooperative === undefined
            ) {
              throw Errors.NOT_ELIGIBLE_FOR_COOPERATIVE_CLAIM_BROADCAST();
            }

            if (theirSignature === undefined) {
              this.logNotCooperativelyClaiming(swap, 'signature missing');
              throw Errors.INVALID_PARTIAL_SIGNATURE();
            }

            this.logger.verbose(`Cooperatively claiming Chain Swap ${swap.id}`);

            try {
              swap = await this.broadcastReceivingClaimTransaction(
                swap,
                preimage,
                claimDetails.cooperative,
                theirSignature,
              );
              this.emit('claim', swap);
            } catch (e) {
              // TODO: reset the claim details for new attempt?
              this.logger.warn(
                `Our cooperative claim for ${swapTypeToPrettyString(swap.type)} Swap ${swap.id} failed: ${formatError(e)}`,
              );
              throw e;
            }
          } else {
            await this.attemptSettleSwap(
              this.currencies.get(swap.receivingData.symbol)!,
              swap,
              undefined,
              preimage,
            );
          }
        }

        return this.createSendingPartialSignature(swap, toSign);
      },
    );
  };

  private broadcastReceivingClaimTransaction = async (
    swap: ChainSwapInfo,
    preimage: Buffer,
    claimDetails: CooperativeDetails,
    theirSignature: PartialSignature,
  ) => {
    const { fee } = await this.broadcastCooperativeTransaction(
      swap,
      this.currencies.get(swap.receivingData.symbol)!,
      claimDetails,
      theirSignature.pubNonce,
      theirSignature.signature,
    );

    await this.removeFromClaimable(swap.id);
    return ChainSwapRepository.setClaimMinerFee(swap, preimage, fee);
  };

  private createSendingPartialSignature = async (
    swap: ChainSwapInfo,
    toSign: TheirSigningData,
  ) => {
    this.logger.debug(
      `Creating partial signature for user claim of ${swapTypeToPrettyString(swap.type)} Swap ${swap.id}`,
    );

    const data = swap.sendingData;
    return createPartialSignature(
      this.currencies.get(data.symbol)!,
      this.walletManager.wallets.get(data.symbol)!,
      SwapTreeSerializer.deserializeSwapTree(data.swapTree!),
      data.keyIndex!,
      getHexBuffer(data.theirPublicKey!),
      toSign.pubNonce,
      toSign.transaction,
      toSign.index,
    );
  };

  private getToClaimDetails = async (id: string) => {
    let details: SwapToClaim<ChainSwapInfo> | undefined;
    await this.lock.acquire(ChainSwapSigner.swapsToClaimLock, async () => {
      details = this.swapsToClaim.get(id);
    });

    return details;
  };

  private canClaimCooperatively = (swap: ChainSwapInfo) => {
    const receivingWallet = this.walletManager.wallets.get(
      swap.receivingData.symbol,
    )!;

    return (
      receivingWallet.type === CurrencyType.BitcoinLike ||
      receivingWallet.type === CurrencyType.Liquid
    );
  };

  private logNotCooperativelyClaiming = (
    swap: ChainSwapInfo,
    reason: string,
  ) => {
    this.logger.warn(
      `Not cooperatively claiming ${swapTypeToPrettyString(swap.type)} Swap ${swap.id}: ${reason}`,
    );
  };
}

export default ChainSwapSigner;
export { TheirSigningData };
