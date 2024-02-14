import { crypto } from 'bitcoinjs-lib';
import { SwapTreeSerializer, Types } from 'boltz-core';
import {
  createMusig,
  hashForWitnessV1,
  parseTransaction,
  tweakMusig,
} from '../../Core';
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
  SwapUpdateEvent,
  SwapVersion,
} from '../../consts/Enums';
import Swap from '../../db/models/Swap';
import ReverseSwapRepository from '../../db/repositories/ReverseSwapRepository';
import SwapRepository from '../../db/repositories/SwapRepository';
import { Payment } from '../../proto/lnd/rpc_pb';
import SwapNursery from '../../swap/SwapNursery';
import WalletManager, { Currency } from '../../wallet/WalletManager';
import Errors from '../Errors';

type PartialSignature = {
  pubNonce: Buffer;
  signature: Buffer;
};

// TODO: Should we verify what we are signing? And if so, how strict should we be?

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

    if (currency.chainClient === undefined) {
      throw 'chain currency is not UTXO based';
    }

    if (
      swap.version !== SwapVersion.Taproot ||
      !(await MusigSigner.isEligibleForRefund(
        swap,
        this.currencies.get(
          getLightningCurrency(base, quote, swap.orderSide, false),
        )!,
      ))
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

    if (
      preimage.length !== 32 ||
      getHexString(crypto.sha256(preimage)) !== swap.preimageHash
    ) {
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

  public static isEligibleForRefund = async (
    swap: Swap,
    lightningCurrency: Currency,
  ) =>
    FailedSwapUpdateEvents.includes(swap.status as SwapUpdateEvent) &&
    !(await MusigSigner.hasNonFailedLightningPayment(lightningCurrency, swap));

  private static hasNonFailedLightningPayment = async (
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

  private createPartialSignature = async (
    currency: Currency,
    swapTree: Types.SwapTree,
    keyIndex: number,
    theirPublicKey: Buffer,
    theirNonce: Buffer,
    rawTransaction: Buffer | string,
    vin: number,
  ): Promise<PartialSignature> => {
    const tx = parseTransaction(currency.type, rawTransaction);
    if (vin < 0 || tx.ins.length <= vin) {
      throw Errors.INVALID_VIN();
    }

    const wallet = this.walletManager.wallets.get(currency.symbol)!;

    const ourKeys = wallet.getKeysByIndex(keyIndex);

    const musig = createMusig(ourKeys, theirPublicKey);
    tweakMusig(currency.type, musig, swapTree);

    musig.aggregateNonces([[theirPublicKey, theirNonce]]);

    const hash = await hashForWitnessV1(currency, tx, vin);
    musig.initializeSession(hash);

    return {
      signature: Buffer.from(musig.signPartial()),
      pubNonce: Buffer.from(musig.getPublicNonce()),
    };
  };
}

export default MusigSigner;
export { PartialSignature };
