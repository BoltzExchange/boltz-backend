import AsyncLock from 'async-lock';
import { SwapTreeSerializer } from 'boltz-core';
import Logger from '../../Logger';
import {
  getChainCurrency,
  getHexBuffer,
  getHexString,
  getLightningCurrency,
  splitPairId,
} from '../../Utils';
import {
  FailedSwapUpdateEvents,
  SwapType,
  SwapUpdateEvent,
  SwapVersion,
  swapTypeToPrettyString,
} from '../../consts/Enums';
import Swap from '../../db/models/Swap';
import { ChainSwapInfo } from '../../db/repositories/ChainSwapRepository';
import ReverseSwapRepository from '../../db/repositories/ReverseSwapRepository';
import SwapRepository from '../../db/repositories/SwapRepository';
import WrappedSwapRepository from '../../db/repositories/WrappedSwapRepository';
import ClnClient from '../../lightning/cln/ClnClient';
import { Payment } from '../../proto/lnd/rpc_pb';
import SwapNursery from '../../swap/SwapNursery';
import WalletManager, { Currency } from '../../wallet/WalletManager';
import Errors from '../Errors';
import { createPartialSignature, isPreimageValid } from './Utils';

type PartialSignature = {
  pubNonce: Buffer;
  signature: Buffer;
};

enum RefundRejectionReason {
  VersionNotTaproot = 'swap version is not Taproot',
  StatusNotEligible = 'status not eligible',
  LightningPaymentPending = 'lightning payment still in progress, try again in a couple minutes',
}

// TODO: Should we verify what we are signing? And if so, how strict should we be?

class MusigSigner {
  private static readonly reverseSwapClaimSignatureLock =
    'reverseSwapClaimSignature';
  private readonly lock = new AsyncLock();

  constructor(
    private readonly logger: Logger,
    private readonly currencies: Map<string, Currency>,
    private readonly walletManager: WalletManager,
    private readonly nursery: SwapNursery,
  ) {}

  public signRefund = async (
    swapId: string,
    theirNonce: Buffer,
    rawTransaction: Buffer,
    index: number,
  ): Promise<PartialSignature> => {
    const swap = await SwapRepository.getSwap({ id: swapId });
    if (!swap) {
      throw Errors.SWAP_NOT_FOUND(swapId);
    }

    const { base, quote } = splitPairId(swap.pair);
    const currency = this.currencies.get(
      getChainCurrency(base, quote, swap.orderSide, false),
    )!;

    if (currency.chainClient === undefined) {
      throw Errors.CURRENCY_NOT_UTXO_BASED();
    }

    {
      const rejectionReason = await MusigSigner.refundNonEligibilityReason(
        swap,
        this.currencies.get(
          getLightningCurrency(base, quote, swap.orderSide, false),
        )!,
      );
      if (rejectionReason !== undefined) {
        this.logger.verbose(
          `Not creating partial signature for refund of ${swapTypeToPrettyString(swap.type)} Swap ${swap.id}: ${rejectionReason}`,
        );
        throw Errors.NOT_ELIGIBLE_FOR_COOPERATIVE_REFUND(rejectionReason);
      }
    }

    this.logger.debug(
      `Creating partial signature for refund of Swap ${swap.id}`,
    );

    const swapTree = SwapTreeSerializer.deserializeSwapTree(swap.redeemScript!);

    return createPartialSignature(
      currency,
      this.walletManager.wallets.get(currency.symbol)!,
      swapTree,
      swap.keyIndex!,
      getHexBuffer(swap.refundPublicKey!),
      theirNonce,
      rawTransaction,
      index,
    );
  };

  public signReverseSwapClaim = (
    swapId: string,
    preimage: Buffer,
    theirNonce: Buffer,
    rawTransaction: Buffer,
    index: number,
  ): Promise<PartialSignature> => {
    return this.lock.acquire(
      MusigSigner.reverseSwapClaimSignatureLock,
      async () => {
        const swap = await ReverseSwapRepository.getReverseSwap({ id: swapId });
        if (!swap) {
          throw Errors.SWAP_NOT_FOUND(swapId);
        }

        if (
          swap.version !== SwapVersion.Taproot ||
          ![
            SwapUpdateEvent.TransactionMempool,
            SwapUpdateEvent.TransactionConfirmed,
            SwapUpdateEvent.InvoiceSettled,
          ].includes(swap.status as SwapUpdateEvent)
        ) {
          this.logger.verbose(
            `Not creating partial signature for claim of Reverse Swap ${swap.id}: it is not eligible`,
          );
          throw Errors.NOT_ELIGIBLE_FOR_COOPERATIVE_CLAIM();
        }

        if (!isPreimageValid(swap, preimage)) {
          this.logger.verbose(
            `Not creating partial signature for claim of Reverse Swap ${swap.id}: preimage is incorrect`,
          );
          throw Errors.INCORRECT_PREIMAGE();
        }

        this.logger.debug(
          `Got preimage for Reverse Swap ${swap.id}: ${getHexString(preimage)}`,
        );
        await WrappedSwapRepository.setPreimage(swap, preimage);

        return this.nursery.lock.acquire(
          SwapNursery.reverseSwapLock,
          async () => {
            if (swap.status !== SwapUpdateEvent.InvoiceSettled) {
              await this.nursery.settleReverseSwapInvoice(swap, preimage);
            }

            this.logger.debug(
              `Creating partial signature for claim of Reverse Swap ${swap.id}`,
            );

            const { base, quote } = splitPairId(swap.pair);
            const chainCurrency = getChainCurrency(
              base,
              quote,
              swap.orderSide,
              true,
            );
            const swapTree = SwapTreeSerializer.deserializeSwapTree(
              swap.redeemScript!,
            );

            return createPartialSignature(
              this.currencies.get(chainCurrency)!,
              this.walletManager.wallets.get(chainCurrency)!,
              swapTree,
              swap.keyIndex!,
              getHexBuffer(swap.claimPublicKey!),
              theirNonce,
              rawTransaction,
              index,
            );
          },
        );
      },
    );
  };

  public static refundNonEligibilityReason = async (
    swap: Swap | ChainSwapInfo,
    lightningCurrency?: Currency,
  ): Promise<string | undefined> => {
    if (swap.version !== SwapVersion.Taproot) {
      return RefundRejectionReason.VersionNotTaproot;
    }

    if (!FailedSwapUpdateEvents.includes(swap.status as SwapUpdateEvent)) {
      return RefundRejectionReason.StatusNotEligible;
    }

    if (
      lightningCurrency !== undefined &&
      (await MusigSigner.hasPendingOrSuccessfulLightningPayment(
        lightningCurrency,
        swap,
      ))
    ) {
      return RefundRejectionReason.LightningPaymentPending;
    }

    return undefined;
  };

  private static hasPendingOrSuccessfulLightningPayment = async (
    currency: Currency,
    swap: Swap | ChainSwapInfo,
  ): Promise<boolean> => {
    if (swap.type === SwapType.Chain) {
      return false;
    }

    try {
      if (currency.lndClient) {
        const pendingPayment = await currency.lndClient!.trackPayment(
          getHexBuffer(swap.preimageHash),
        );
        return pendingPayment.status !== Payment.PaymentStatus.FAILED;
      }
    } catch (e) {
      /* empty */
    }

    try {
      const invoice = (swap as Swap).invoice;
      if (currency.clnClient && invoice !== undefined) {
        const payment = await currency.clnClient!.checkPayStatus(invoice);
        return payment !== undefined;
      }
    } catch (e) {
      // We do have a pending payment when the pending error is thrown
      // Else, it's some other error and we can allow cooperative refunds
      return e === ClnClient.paymentPendingError;
    }

    return false;
  };
}

export default MusigSigner;
export { PartialSignature, RefundRejectionReason };
