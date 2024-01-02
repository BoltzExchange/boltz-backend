import { SwapTreeSerializer, Types } from 'boltz-core';
import Errors from './Errors';
import Logger from '../Logger';
import Swap from '../db/models/Swap';
import SwapNursery from '../swap/SwapNursery';
import { Payment } from '../proto/lnd/rpc_pb';
import SwapRepository from '../db/repositories/SwapRepository';
import WalletManager, { Currency } from '../wallet/WalletManager';
import {
  getChainCurrency,
  getHexBuffer,
  getHexString,
  splitPairId,
} from '../Utils';
import { FailedSwapUpdateEvents, SwapUpdateEvent } from '../consts/Enums';
import ReverseSwapRepository from '../db/repositories/ReverseSwapRepository';
import {
  createMusig,
  extractClaimPublicKeyFromReverseSwapTree,
  extractRefundPublicKeyFromSwapTree,
  hashForWitnessV1,
  parseTransaction,
  tweakMusig,
} from '../Core';
import { crypto } from 'bitcoinjs-lib';

type PartialSignature = {
  pubNonce: Buffer;
  signature: Buffer;
};

// TODO: verify

class MusigSigner {
  constructor(
    private readonly logger: Logger,
    private readonly currencies: Map<string, Currency>,
    private readonly walletManager: WalletManager,
    private readonly nursery: SwapNursery,
  ) {}

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
      (await this.hasPendingLightningPayment(currency, swap))
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
      extractRefundPublicKeyFromSwapTree(swapTree),
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

    await this.nursery.lock.acquire(SwapNursery.reverseSwapLock, async () => {
      await this.nursery.settleReverseSwapInvoice(swap, preimage);
    });

    const { base, quote } = splitPairId(swap.pair);
    const swapTree = SwapTreeSerializer.deserializeSwapTree(swap.redeemScript!);

    return this.createPartialSignature(
      this.currencies.get(getChainCurrency(base, quote, swap.orderSide, true))!,
      swapTree,
      swap.keyIndex!,
      extractClaimPublicKeyFromReverseSwapTree(swapTree),
      theirNonce,
      rawTransaction,
      index,
    );
  };

  private createPartialSignature = async (
    currency: Currency,
    swapTree: Types.SwapTree,
    keyIndex: number,
    theirPublicKey: Buffer,
    theirNonce: Buffer,
    rawTransaction: Buffer | string,
    vin: number,
  ): Promise<PartialSignature> => {
    const wallet = this.walletManager.wallets.get(currency.symbol)!;

    const ourKeys = wallet.getKeysByIndex(keyIndex);

    const musig = createMusig(ourKeys, theirPublicKey);
    tweakMusig(currency.type, musig, swapTree);

    musig.aggregateNonces([[theirPublicKey, theirNonce]]);

    const tx = parseTransaction(currency.type, rawTransaction);
    const hash = await hashForWitnessV1(currency, tx, vin);
    musig.initializeSession(hash);

    return {
      signature: Buffer.from(musig.signPartial()),
      pubNonce: Buffer.from(musig.getPublicNonce()),
    };
  };

  private hasPendingLightningPayment = async (
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
