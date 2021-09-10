import { Op } from 'sequelize';
import { EventEmitter } from 'events';
import Logger from '../Logger';
import { Invoice } from '../proto/lnd/rpc_pb';
import LndClient from '../lightning/LndClient';
import { SwapUpdateEvent } from '../consts/Enums';
import ReverseSwap from '../db/models/ReverseSwap';
import { Currency } from '../wallet/WalletManager';
import { decodeInvoice, getHexBuffer } from '../Utils';
import ReverseSwapRepository from '../db/repositories/ReverseSwapRepository';

interface LightningNursery {
  on(event: 'minerfee.invoice.paid', listener: (reverseSwap: ReverseSwap) => void): this;
  emit(event: 'minerfee.invoice.paid', reverseSwap: ReverseSwap): boolean;

  on(event: 'invoice.paid', listener: (reverseSwap: ReverseSwap) => void): this;
  emit(event: 'invoice.paid', reverseSwap: ReverseSwap): boolean;
}

class LightningNursery extends EventEmitter {
  constructor(
    private logger: Logger,
    private reverseSwapRepository: ReverseSwapRepository,
  ) {
    super();
  }

  public bindCurrencies = (currencies: Currency[]): void => {
    currencies.forEach((currency) => {
      if (currency.lndClient) {
        this.listenInvoices(currency.lndClient);
      }
    });
  }

  private listenInvoices = (lndClient: LndClient) => {
    lndClient.on('htlc.accepted', async (invoice: string) => {
      let reverseSwap = await this.reverseSwapRepository.getReverseSwap({
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
        this.logger.verbose(`Hold invoice of Reverse Swap ${reverseSwap.id} was accepted`);

        if (reverseSwap.minerFeeInvoicePreimage === null || reverseSwap.status === SwapUpdateEvent.MinerFeePaid) {
          if (reverseSwap.minerFeeInvoicePreimage) {
            await lndClient.settleInvoice(getHexBuffer(reverseSwap.minerFeeInvoicePreimage));
          }

          this.emit('invoice.paid', reverseSwap);
        } else {
          this.logger.debug(`Did not send onchain coins for Reverse Swap ${reverseSwap!.id} because miner fee invoice was not paid yet`);
        }
      } else {
        this.logger.debug(`Minerfee prepayment of Reverse Swap ${reverseSwap.id} was accepted`);

        reverseSwap = await this.reverseSwapRepository.setReverseSwapStatus(reverseSwap, SwapUpdateEvent.MinerFeePaid);
        this.emit('minerfee.invoice.paid', reverseSwap);

        // Settle the prepay invoice and emit the "invoice.paid" event in case the hold invoice was paid first
        const holdInvoice = await lndClient.lookupInvoice(getHexBuffer(decodeInvoice(reverseSwap.invoice).paymentHash!));

        if (holdInvoice.state === Invoice.InvoiceState.ACCEPTED) {
          await lndClient.settleInvoice(getHexBuffer(reverseSwap.minerFeeInvoicePreimage!));
          this.emit('invoice.paid', reverseSwap);
        }
      }
    });
  }
}

export default LightningNursery;
