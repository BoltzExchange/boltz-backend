import AsyncLock from 'async-lock';
import { crypto } from 'bitcoinjs-lib';
import { Op } from 'sequelize';
import Logger from '../Logger';
import { decodeInvoice, formatError, getHexBuffer } from '../Utils';
import { SwapUpdateEvent } from '../consts/Enums';
import TypedEventEmitter from '../consts/TypedEventEmitter';
import ReverseSwap from '../db/models/ReverseSwap';
import ReverseSwapRepository from '../db/repositories/ReverseSwapRepository';
import { InvoiceState, LightningClient } from '../lightning/LightningClient';
import LndClient from '../lightning/LndClient';
import ClnClient from '../lightning/cln/ClnClient';
import { Currency } from '../wallet/WalletManager';

class LightningNursery extends TypedEventEmitter<{
  'invoice.paid': ReverseSwap;
  'minerfee.invoice.paid': ReverseSwap;
}> {
  public static readonly lightningClientCallTimeout = 15_000;

  private lock = new AsyncLock();

  private static invoiceLock = 'invoice';

  constructor(private logger: Logger) {
    super();
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
    return error.toLowerCase().includes('invoice expired');
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
      [currency.lndClient, currency.clnClient]
        .filter(
          (client): client is LndClient | ClnClient => client !== undefined,
        )
        .map(this.listenInvoices);
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
            `Could not handle accepted invoice of ${lightningClient.serviceName()}: ${formatError(
              e,
            )}`,
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
        `Hold invoice payment of Reverse Swap ${reverseSwap.id} pending`,
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

      reverseSwap = await ReverseSwapRepository.setReverseSwapStatus(
        reverseSwap,
        SwapUpdateEvent.MinerFeePaid,
      );
      this.emit('minerfee.invoice.paid', reverseSwap);

      // Settle the prepay invoice and emit the "invoice.paid" event in case the hold invoice was paid first
      const holdInvoice = await lightningClient.lookupHoldInvoice(
        getHexBuffer(decodeInvoice(reverseSwap.invoice).paymentHash!),
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
