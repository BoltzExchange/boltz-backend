import { Op } from 'sequelize';
import { EventEmitter } from 'events';
import Logger from '../Logger';
import { Invoice } from '../proto/lnd/rpc_pb';
import LndClient from '../lightning/LndClient';
import { SwapUpdateEvent } from '../consts/Enums';
import ReverseSwap from '../db/models/ReverseSwap';
import { Currency } from '../wallet/WalletManager';
import { decodeInvoice, getHexBuffer } from '../Utils';
import ReverseSwapRepository from '../db/ReverseSwapRepository';

interface LightningNursery {
  on(event: 'minerfee.invoice.paid', listener: (reverseSwap: ReverseSwap) => void): this;
  emit(event: 'minerfee.invoice.paid', reverseSwap: ReverseSwap): boolean;

  on(event: 'invoice.paid', listener: (reverseSwap: ReverseSwap) => void): this;
  emit(event: 'invoice.paid', reverseSwap: ReverseSwap): boolean;
}

class LightningNursery extends EventEmitter {
  constructor(
    private logger: Logger,
    private prepayMinerFee: boolean,
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
      const reverseSwap = await this.reverseSwapRepository.getReverseSwap({
        invoice: {
          [Op.eq]: invoice,
        },
      });

      if (!reverseSwap) {
        return;
      }

      this.logger.verbose(`Hold invoice of Reverse Swap ${reverseSwap.id} was accepted`);

      if (reverseSwap.minerFeeInvoice === null || reverseSwap.status === SwapUpdateEvent.MinerFeePaid) {
        this.emit('invoice.paid', reverseSwap);
      } else {
        this.logger.debug(`Did not send onchain coins for Reverse Swap ${reverseSwap!.id} because miner fee invoice was not paid yet`);
      }
    });

    // Only relevant if prepay miner fees are enabled
    if (this.prepayMinerFee) {
      lndClient.on('invoice.settled', async (invoice: string) => {
        let reverseSwap = await this.reverseSwapRepository.getReverseSwap({
          minerFeeInvoice: {
            [Op.eq]: invoice,
          },
        });

        if (!reverseSwap) {
          return;
        }

        this.logger.debug(`Minerfee prepayment of Reverse Swap ${reverseSwap.id} settled`);

        reverseSwap = await this.reverseSwapRepository.setReverseSwapStatus(reverseSwap, SwapUpdateEvent.MinerFeePaid);
        this.emit('minerfee.invoice.paid', reverseSwap);

        // Also emit the "invoice.paid" event in case the hold invoice was paid first
        const holdInvoice = await lndClient.lookupInvoice(getHexBuffer(decodeInvoice(reverseSwap.invoice).paymentHash!));
        if (holdInvoice.state === Invoice.InvoiceState.ACCEPTED) {
          this.emit('invoice.paid', reverseSwap);
        }
      });
    }
  }
}

export default LightningNursery;
