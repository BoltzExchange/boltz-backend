import { crypto } from 'bitcoinjs-lib';
import { SwapTreeSerializer } from 'boltz-core';
import Logger from '../../Logger';
import {
  getChainCurrency,
  getHexBuffer,
  getHexString,
  splitPairId,
} from '../../Utils';
import { FailedSwapUpdateEvents, SwapUpdateEvent } from '../../consts/Enums';
import Swap from '../../db/models/Swap';
import ReverseSwapRepository from '../../db/repositories/ReverseSwapRepository';
import SwapRepository from '../../db/repositories/SwapRepository';
import { Payment } from '../../proto/lnd/rpc_pb';
import SwapNursery from '../../swap/SwapNursery';
import WalletManager, { Currency } from '../../wallet/WalletManager';
import Errors from '../Errors';
import MusigBase from './MusigBase';

type PartialSignature = {
  pubNonce: Buffer;
  signature: Buffer;
};

// TODO: Should we verify what we are signing? And if so, how strict should we be?

class MusigSigner extends MusigBase {
  constructor(
    private readonly logger: Logger,
    private readonly currencies: Map<string, Currency>,
    walletManager: WalletManager,
    private readonly nursery: SwapNursery,
  ) {
    super(walletManager);
  }

  public signSwapRefund = async (
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

    if (
      !FailedSwapUpdateEvents.includes(swap.status as SwapUpdateEvent) ||
      (await this.hasNonFailedLightningPayment(currency, swap))
    ) {
      this.logger.verbose(
        `Not creating partial signature for refund of Swap ${swap.id}: it is not eligible`,
      );
      throw Errors.NOT_ELIGIBLE_FOR_COOPERATIVE_REFUND();
    }

    this.logger.debug(
      `Creating partial signature for refund of Swap ${swap.id}`,
    );

    const swapTree = SwapTreeSerializer.deserializeSwapTree(swap.redeemScript!);
    return this.createPartialSignature(
      currency,
      swapTree,
      swap.keyIndex!,
      getHexBuffer(swap.refundPublicKey!),
      theirNonce,
      rawTransaction,
      index,
    );
  };

  public signReverseSwapClaim = async (
    swapId: string,
    preimage: Buffer,
    theirNonce: Buffer,
    rawTransaction: Buffer,
    index: number,
  ): Promise<PartialSignature> => {
    const swap = await ReverseSwapRepository.getReverseSwap({ id: swapId });
    if (!swap) {
      throw Errors.SWAP_NOT_FOUND(swapId);
    }

    if (
      ![
        SwapUpdateEvent.TransactionMempool,
        SwapUpdateEvent.TransactionConfirmed,
        SwapUpdateEvent.InvoiceSettled,
      ].includes(swap.status as SwapUpdateEvent)
    ) {
      this.logger.verbose(
        `Not creating partial signature for claim of Reverse Swap ${swap.id}: it is not eligible`,
      );
      throw Errors.NOT_ELIGIBLE_FOR_COOPERATIVE_REFUND();
    }

    if (getHexString(crypto.sha256(preimage)) !== swap.preimageHash) {
      this.logger.verbose(
        `Not creating partial signature for claim of Reverse Swap ${swap.id}: preimage is incorrect`,
      );
      throw Errors.INCORRECT_PREIMAGE();
    }

    this.logger.debug(
      `Creating partial signature for claim of Reverse Swap ${swap.id}`,
    );

    if (swap.status !== SwapUpdateEvent.InvoiceSettled) {
      await this.nursery.lock.acquire(SwapNursery.reverseSwapLock, async () => {
        await this.nursery.settleReverseSwapInvoice(swap, preimage);
      });
    }

    const { base, quote } = splitPairId(swap.pair);
    const swapTree = SwapTreeSerializer.deserializeSwapTree(swap.redeemScript!);

    return this.createPartialSignature(
      this.currencies.get(getChainCurrency(base, quote, swap.orderSide, true))!,
      swapTree,
      swap.keyIndex!,
      getHexBuffer(swap.claimPublicKey!),
      theirNonce,
      rawTransaction,
      index,
    );
  };

  private hasNonFailedLightningPayment = async (
    currency: Currency,
    swap: Swap,
  ): Promise<boolean> => {
    try {
      if (currency.lndClient) {
        const pendingPayment = await currency.lndClient!.trackPayment(
          getHexBuffer(swap.preimageHash),
        );

        if (pendingPayment.status !== Payment.PaymentStatus.FAILED) {
          return true;
        }
      }
    } catch (e) {
      /* empty */
    }

    try {
      if (currency.clnClient && swap.invoice) {
        const payment = await currency.clnClient!.checkPayStatus(swap.invoice);

        if (payment !== undefined) {
          return true;
        }
      }
    } catch (e) {
      return true;
    }

    return false;
  };
}

export default MusigSigner;
export { PartialSignature };
