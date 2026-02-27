import AsyncLock from 'async-lock';
import { crypto } from 'bitcoinjs-lib';
import { Op } from 'sequelize';
import type Logger from '../Logger';
import { formatError, getHexBuffer } from '../Utils';
import { SwapUpdateEvent } from '../consts/Enums';
import TypedEventEmitter from '../consts/TypedEventEmitter';
import type ReverseSwap from '../db/models/ReverseSwap';
import ReverseSwapRepository from '../db/repositories/ReverseSwapRepository';
import WrappedSwapRepository from '../db/repositories/WrappedSwapRepository';
import LightningErrors from '../lightning/Errors';
import type { LightningClient } from '../lightning/LightningClient';
import { InvoiceState } from '../lightning/LightningClient';
import type SelfPaymentClient from '../lightning/SelfPaymentClient';
import type Sidecar from '../sidecar/Sidecar';
import { type Currency, getLightningClients } from '../wallet/WalletManager';

class LightningNursery extends TypedEventEmitter<{
  'invoice.paid': ReverseSwap;
  'minerfee.invoice.paid': ReverseSwap;
}> {
  public static readonly lightningClientCallTimeout = 15_000;

  private lock = new AsyncLock();

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
            crypto.sha256(getHexBuffer(reverseSwap.minerFeeInvoicePreimage)),
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
      await this.lock.acquire(LightningNursery.invoiceLock, async () => {
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
      });
    });
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
        await lightningClient.settleHoldInvoice(
          getHexBuffer(reverseSwap.minerFeeInvoicePreimage!),
        );
        this.emit('invoice.paid', reverseSwap);
      }
    }
  };
}

export default LightningNursery;
