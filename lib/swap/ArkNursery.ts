import { Op } from 'sequelize';
import type Logger from '../Logger';
import ArkClient, { type VHtlc } from '../chain/ArkClient';
import {
  CurrencyType,
  SwapUpdateEvent,
  swapTypeToPrettyString,
} from '../consts/Enums';
import TypedEventEmitter from '../consts/TypedEventEmitter';
import type Swap from '../db/models/Swap';
import SwapRepository from '../db/repositories/SwapRepository';
import type { Currency } from '../wallet/WalletManager';
import Errors from './Errors';
import type OverpaymentProtector from './OverpaymentProtector';

class ArkNursery extends TypedEventEmitter<{
  'ark.vhtlc': {
    swap: Swap;
    lockupTransactionId: string;
  };
  'ark.vhtlc.failed': {
    swap: Swap;
    reason: string;
  };
}> {
  constructor(
    private readonly logger: Logger,
    private readonly overpaymentProtector: OverpaymentProtector,
  ) {
    super();
  }

  public init = (currencies: Currency[]) => {
    for (const ark of currencies.filter(
      (c) => c.type === CurrencyType.Ark && c.arkNode !== undefined,
    )) {
      this.bindEvent(ark.arkNode!);
    }
  };

  private bindEvent = (arkNode: ArkClient) => {
    arkNode.on('ark.vhtlc.found', async (vHtlc) => {
      await this.handleVhtlc(vHtlc);
    });
  };

  private handleVhtlc = async (vHtlc: VHtlc) => {
    // TODO: Chain swaps
    const swap = await SwapRepository.getSwap({
      status: {
        [Op.in]: [SwapUpdateEvent.SwapCreated, SwapUpdateEvent.InvoiceSet],
      },
      lockupAddress: vHtlc.address,
    });

    if (swap === null || swap === undefined) {
      return;
    }

    this.logger.info(
      `Found ${ArkClient.symbol} lockup vHTLC for ${swapTypeToPrettyString(swap.type)} Swap ${swap.id}: ${vHtlc.txId}:${vHtlc.vout}`,
    );

    await SwapRepository.setLockupTransaction(
      swap,
      vHtlc.txId,
      vHtlc.amount,
      true,
      vHtlc.vout,
    );

    if (swap.expectedAmount! < vHtlc.amount) {
      this.emit('ark.vhtlc.failed', {
        swap,
        reason: Errors.INSUFFICIENT_AMOUNT(vHtlc.amount, swap.expectedAmount!)
          .message,
      });
      return;
    }

    if (
      this.overpaymentProtector.isUnacceptableOverpay(
        swap.type,
        swap.expectedAmount!,
        vHtlc.amount,
      )
    ) {
      this.emit('ark.vhtlc.failed', {
        swap,
        reason: Errors.OVERPAID_AMOUNT(vHtlc.amount, swap.expectedAmount!)
          .message,
      });
      return;
    }

    this.emit('ark.vhtlc', {
      swap: await SwapRepository.setLockupTransaction(
        swap,
        vHtlc.txId,
        vHtlc.amount,
        // TODO: how to handle out of round?
        true,
        vHtlc.vout,
      ),
      lockupTransactionId: vHtlc.txId,
    });
  };
}

export default ArkNursery;
