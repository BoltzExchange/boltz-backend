import { Op } from 'sequelize';
import type Logger from '../Logger';
import ArkClient from '../chain/ArkClient';
import {
  CurrencyType,
  SwapUpdateEvent,
  swapTypeToPrettyString,
} from '../consts/Enums';
import TypedEventEmitter from '../consts/TypedEventEmitter';
import type Swap from '../db/models/Swap';
import SwapRepository from '../db/repositories/SwapRepository';
import type { Vtxo } from '../proto/ark/types_pb';
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
    arkNode.on('ark.vhtlc.found', async (notification) => {
      if (notification.newVtxosList.length === 0) {
        return;
      }

      // TODO: how to handle that?
      if (notification.newVtxosList.length > 1) {
        this.logger.warn(
          `Found ${notification.newVtxosList.length} new VHTLCs for ${notification.address}`,
        );
        return;
      }

      await this.handleVhtlc(
        notification.address,
        notification.newVtxosList[0],
      );
    });
  };

  private handleVhtlc = async (address: string, vHtlc: Vtxo.AsObject) => {
    // TODO: Chain swaps
    const swap = await SwapRepository.getSwap({
      status: {
        [Op.in]: [SwapUpdateEvent.SwapCreated, SwapUpdateEvent.InvoiceSet],
      },
      lockupAddress: address,
    });

    if (swap === null || swap === undefined) {
      return;
    }

    this.logger.info(
      `Found ${ArkClient.symbol} lockup VHTLC for ${swapTypeToPrettyString(swap.type)} Swap ${swap.id}: ${vHtlc.outpoint!.txid}:${vHtlc.outpoint!.vout}`,
    );

    if (swap.expectedAmount! < vHtlc.receiver!.amount) {
      this.emit('ark.vhtlc.failed', {
        swap,
        reason: Errors.INSUFFICIENT_AMOUNT(
          vHtlc.receiver!.amount,
          swap.expectedAmount!,
        ).message,
      });
      return;
    }

    if (
      this.overpaymentProtector.isUnacceptableOverpay(
        swap.type,
        swap.expectedAmount!,
        vHtlc.receiver!.amount,
      )
    ) {
      this.emit('ark.vhtlc.failed', {
        swap,
        reason: Errors.OVERPAID_AMOUNT(
          vHtlc.receiver!.amount,
          swap.expectedAmount!,
        ).message,
      });
      return;
    }

    this.emit('ark.vhtlc', {
      swap: await SwapRepository.setLockupTransaction(
        swap,
        vHtlc.outpoint!.txid,
        vHtlc.receiver!.amount,
        // TODO: how to handle out of round?
        true,
        vHtlc.outpoint!.vout,
      ),
      lockupTransactionId: vHtlc.outpoint!.txid,
    });
  };
}

export default ArkNursery;
