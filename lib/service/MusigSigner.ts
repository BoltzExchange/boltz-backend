import { SwapTreeSerializer } from 'boltz-core';
import Errors from './Errors';
import Logger from '../Logger';
import Swap from '../db/models/Swap';
import { Payment } from '../proto/lnd/rpc_pb';
import SwapRepository from '../db/repositories/SwapRepository';
import WalletManager, { Currency } from '../wallet/WalletManager';
import { getChainCurrency, getHexBuffer, splitPairId } from '../Utils';
import { FailedSwapUpdateEvents, SwapUpdateEvent } from '../consts/Enums';
import {
  createMusig,
  extractRefundPublicKeyFromSwapTree,
  hashForWitnessV1,
  parseTransaction,
  tweakMusig,
} from '../Core';

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
        `Not creating partial signature for refund of Swap ${swap.id} because it is not eligible`,
      );
      throw Errors.NOT_ELIGIBLE_FOR_COOPERATIVE_REFUND();
    }

    this.logger.debug(
      `Creating partial signature for refund of Swap ${swap.id}`,
    );

    const wallet = this.walletManager.wallets.get(currency.symbol)!;

    const swapTree = SwapTreeSerializer.deserializeSwapTree(swap.redeemScript!);
    const claimKeys = wallet.getKeysByIndex(swap.keyIndex!);
    const refundKeys = extractRefundPublicKeyFromSwapTree(swapTree);

    const tx = parseTransaction(currency.type, rawTransaction);

    const musig = createMusig(claimKeys, refundKeys);
    tweakMusig(currency.type, musig, swapTree);

    musig.aggregateNonces(
      new Map<Buffer, Uint8Array>([[refundKeys, theirNonce]]),
    );

    const hash = await hashForWitnessV1(currency, tx, index);
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
