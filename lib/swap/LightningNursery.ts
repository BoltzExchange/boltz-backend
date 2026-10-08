import { sha256 } from '@noble/hashes/sha2.js';
import { Op } from 'sequelize';
import InstrumentedLock from '../InstrumentedLock';
import type Logger from '../Logger';
import {
  formatError,
  getChainCurrency,
  getHexBuffer,
  getLightningCurrency,
  splitPairId,
} from '../Utils';
import { SwapUpdateEvent } from '../consts/Enums';
import TypedEventEmitter from '../consts/TypedEventEmitter';
import type ReverseSwap from '../db/models/ReverseSwap';
import ReverseSwapRepository from '../db/repositories/ReverseSwapRepository';
import WrappedSwapRepository from '../db/repositories/WrappedSwapRepository';
import LightningErrors from '../lightning/Errors';
import type { LightningClient } from '../lightning/LightningClient';
import { HtlcState, InvoiceState } from '../lightning/LightningClient';
import type SelfPaymentClient from '../lightning/SelfPaymentClient';
import type Sidecar from '../sidecar/Sidecar';
import { type Currency, getLightningClients } from '../wallet/WalletManager';

class LightningNursery extends TypedEventEmitter<{
  'invoice.paid': ReverseSwap;
  'minerfee.invoice.paid': ReverseSwap;
}> {
  public static readonly lightningClientCallTimeout = 15_000;

  // lnd's default `invoices.holdexpirydelta`
  public static readonly holdExpiryDelta = 18;
  // Blocks the service's refund of a timed out lockup gets to confirm
  public static readonly refundConfirmationMargin = 12;

  private lock = new InstrumentedLock('lightningNursery');

  private static invoiceLock = 'invoice';

  constructor(
    private readonly logger: Logger,
    private readonly sidecar: Sidecar,
    selfPaymentClient: SelfPaymentClient,
  ) {
    super();

    this.listenInvoices(selfPaymentClient);
  }

  public static errIsInvoicePaid = (error: unknown): boolean => {
    return (
      error !== undefined &&
      error !== null &&
      (error as any).details === 'invoice is already paid'
    );
  };

  public static errIsPaymentInTransition = (error: unknown): boolean => {
    return (
      error !== undefined &&
      error !== null &&
      (error as any).details === 'payment is in transition'
    );
  };

  public static errIsCltvLimitExceeded = (error: unknown): boolean => {
    if (error === undefined || error === null) {
      return false;
    }

    return /^(cltv limit )(\d{1,3}) (should be greater than )(\d{1,3})$/gm.test(
      (error as any).details,
    );
  };

  public static errIsInvoiceExpired = (error: string): boolean => {
    return (
      error === 'InvoiceExpiredError()' ||
      error.toLowerCase().includes('invoice expired')
    );
  };

  public static errIsPaymentTimedOut = (error: string): boolean => {
    return error === LightningErrors.PAYMENT_TIMED_OUT().message;
  };

  public static cancelReverseInvoices = async (
    lightningClient: LightningClient,
    reverseSwap: ReverseSwap,
    alsoMinerFeeInvoice: boolean,
  ) => {
    await lightningClient.raceCall(
      async () => {
        await lightningClient.cancelHoldInvoice(
          getHexBuffer(reverseSwap.preimageHash),
        );

        if (alsoMinerFeeInvoice && reverseSwap.minerFeeInvoicePreimage) {
          await lightningClient.cancelHoldInvoice(
            Buffer.from(
              sha256(getHexBuffer(reverseSwap.minerFeeInvoicePreimage)),
            ),
          );
        }
      },
      (reject) => reject('cancelling reverse swap invoices timed out'),
      LightningNursery.lightningClientCallTimeout,
    );
  };

  public bindCurrencies = (currencies: Currency[]): void => {
    currencies.forEach((currency) => {
      getLightningClients(currency).forEach((client) =>
        this.listenInvoices(client),
      );
    });
  };

  private listenInvoices = (lightningClient: LightningClient) => {
    lightningClient.on('htlc.accepted', async (invoice: string) => {
      await this.lock.acquire(
        LightningNursery.invoiceLock,
        'htlcAccepted',
        async () => {
          try {
            await lightningClient.raceCall(
              this.handleAcceptedInvoice(lightningClient, invoice),
              (reject) => reject('invoice acceptance handler timeout out'),
              LightningNursery.lightningClientCallTimeout,
            );
          } catch (e) {
            this.logger.warn(
              `Could not handle accepted invoice of ${lightningClient.serviceName()}-${lightningClient.id}: ${formatError(e)}`,
            );
          }
        },
      );
    });
  };

  /**
   * Whether every HTLC held for a reverse swap's invoice expires late enough
   * that lnd will still be holding it when the service's on-chain refund can
   * confirm. lnd cancels a held invoice `holdExpiryDelta` blocks before its
   * earliest HTLC expires; if that comes before the lockup times out, the
   * payer would get the Lightning payment back and could still claim the
   * lockup. Such a payment is refused by cancelling the invoice, before any
   * coins are locked up.
   *
   * Only when the lockup is on the Lightning chain itself: otherwise its
   * timeout is a height on another chain, and the cross chain buffer of the
   * hold invoice is what covers it.
   */
  private htlcsOutlastTimeout = async (
    lightningClient: LightningClient,
    reverseSwap: ReverseSwap,
  ): Promise<boolean> => {
    const { base, quote } = splitPairId(reverseSwap.pair);
    if (
      getChainCurrency(base, quote, reverseSwap.orderSide, true) !==
      getLightningCurrency(base, quote, reverseSwap.orderSide, true)
    ) {
      return true;
    }

    const { htlcs } = await lightningClient.lookupHoldInvoice(
      getHexBuffer(reverseSwap.preimageHash),
    );
    const expiries = (htlcs ?? [])
      .filter((htlc) => htlc.state === HtlcState.Accepted)
      .map((htlc) => htlc.expiryHeight)
      .filter((height): height is number => height !== undefined);

    // Nodes that do not report expiries are trusted as before.
    if (expiries.length === 0) {
      return true;
    }

    const earliest = Math.min(...expiries);
    const required =
      reverseSwap.timeoutBlockHeight +
      LightningNursery.holdExpiryDelta +
      LightningNursery.refundConfirmationMargin;
    if (earliest >= required) {
      return true;
    }

    this.logger.warn(
      `Cancelling hold invoice of Reverse Swap ${reverseSwap.id}: its HTLC expires at ${earliest}, needs ${required} (lockup timeout ${reverseSwap.timeoutBlockHeight})`,
    );
    await lightningClient.cancelHoldInvoice(
      getHexBuffer(reverseSwap.preimageHash),
    );
    return false;
  };

  private handleAcceptedInvoice = async (
    lightningClient: LightningClient,
    invoice: string,
  ) => {
    let reverseSwap = await ReverseSwapRepository.getReverseSwap({
      [Op.or]: [
        {
          invoice,
        },
        {
          minerFeeInvoice: invoice,
        },
      ],
    });

    if (!reverseSwap) {
      return;
    }

    if (reverseSwap.invoice === invoice) {
      this.logger.verbose(
        `Hold invoice of Reverse Swap ${reverseSwap.id} was accepted`,
      );

      if (!(await this.htlcsOutlastTimeout(lightningClient, reverseSwap))) {
        return;
      }

      if (
        reverseSwap.minerFeeInvoicePreimage === null ||
        reverseSwap.status === SwapUpdateEvent.MinerFeePaid
      ) {
        if (reverseSwap.minerFeeInvoicePreimage) {
          await lightningClient.settleHoldInvoice(
            getHexBuffer(reverseSwap.minerFeeInvoicePreimage),
          );
        }

        this.emit('invoice.paid', reverseSwap);
      } else {
        this.logger.debug(
          `Did not send onchain coins for Reverse Swap ${
            reverseSwap!.id
          } because miner fee invoice was not paid yet`,
        );
      }
    } else {
      this.logger.debug(
        `Minerfee prepayment of Reverse Swap ${reverseSwap.id} was accepted`,
      );

      reverseSwap = await WrappedSwapRepository.setStatus(
        reverseSwap,
        SwapUpdateEvent.MinerFeePaid,
      );
      this.emit('minerfee.invoice.paid', reverseSwap);

      // Settle the prepay invoice and emit the "invoice.paid" event in case the hold invoice was paid first
      const holdInvoice = await lightningClient.lookupHoldInvoice(
        (await this.sidecar.decodeInvoiceOrOffer(reverseSwap.invoice))
          .paymentHash!,
      );

      if (holdInvoice.state === InvoiceState.Accepted) {
        if (!(await this.htlcsOutlastTimeout(lightningClient, reverseSwap))) {
          return;
        }

        await lightningClient.settleHoldInvoice(
          getHexBuffer(reverseSwap.minerFeeInvoicePreimage!),
        );
        this.emit('invoice.paid', reverseSwap);
      }
    }
  };
}

export default LightningNursery;
