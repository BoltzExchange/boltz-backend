import { Op } from 'sequelize';
import type Logger from '../Logger';
import { SwapUpdateEvent } from '../consts/Enums';
import TypedEventEmitter from '../consts/TypedEventEmitter';
import type ReverseSwap from '../db/models/ReverseSwap';
import ReverseSwapRepository from '../db/repositories/ReverseSwapRepository';
import type Sidecar from '../sidecar/Sidecar';

/**
 * InvoiceNursery takes care of cancelling pending HTLCs of Reverse Swaps with prepay miner fee
 * in case only one of the two invoices is paid and the other expired and cannot be paid anymore
 */
class InvoiceNursery extends TypedEventEmitter<{
  'invoice.expired': ReverseSwap;
}> {
  // Interval for checking for expired invoices in seconds
  private static readonly checkInterval = 60;

  private interval: any;

  constructor(
    private readonly logger: Logger,
    private readonly sidecar: Sidecar,
  ) {
    super();
  }

  public init = async (): Promise<void> => {
    this.logger.debug(
      `Checking for expired invoices every ${InvoiceNursery.checkInterval} seconds`,
    );

    this.interval = setInterval(
      this.checkExpiredInvoices,
      InvoiceNursery.checkInterval * 1000,
    );
    await this.checkExpiredInvoices();
  };

  public destroy = (): void => {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = undefined;
    }
  };

  private checkExpiredInvoices = async () => {
    const pendingSwaps = await ReverseSwapRepository.getReverseSwaps({
      status: {
        [Op.or]: [SwapUpdateEvent.SwapCreated, SwapUpdateEvent.MinerFeePaid],
      },
    });

    if (pendingSwaps.length === 0) {
      return;
    }

    this.logger.silly(
      `Checking ${pendingSwaps.length} Reverse Swaps for expired invoices`,
    );

    for (const reverseSwap of pendingSwaps) {
      const decoded = await this.sidecar.decodeInvoiceOrOffer(
        reverseSwap.invoice,
      );

      if (decoded.isExpired) {
        this.emit('invoice.expired', reverseSwap);
      }
    }
  };
}

export default InvoiceNursery;
