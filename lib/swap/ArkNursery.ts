import { Op } from 'sequelize';
import type Logger from '../Logger';
import { getChainCurrency, splitPairId } from '../Utils';
import ArkClient, { type VHtlc } from '../chain/ArkClient';
import {
  CurrencyType,
  SwapUpdateEvent,
  swapTypeToPrettyString,
} from '../consts/Enums';
import TypedEventEmitter from '../consts/TypedEventEmitter';
import type ReverseSwap from '../db/models/ReverseSwap';
import type Swap from '../db/models/Swap';
import ReverseSwapRepository from '../db/repositories/ReverseSwapRepository';
import SwapRepository from '../db/repositories/SwapRepository';
import type { Currency } from '../wallet/WalletManager';
import Errors from './Errors';
import type OverpaymentProtector from './OverpaymentProtector';

class ArkNursery extends TypedEventEmitter<{
  'vhtlc.found': {
    swap: Swap;
    lockupTransactionId: string;
  };
  'vhtlc.failed': {
    swap: Swap;
    reason: string;
  };
  'vhtlc.expired': ReverseSwap;
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
      this.bindEvents(ark.arkNode!);
    }
  };

  private bindEvents = (arkNode: ArkClient) => {
    arkNode.on('vhtlc.found', async (vHtlc) => {
      await this.handleVhtlc(vHtlc);
    });

    arkNode.on('block', async (blockNumber) => {
      await this.checkExpiredReverseSwaps(arkNode, blockNumber);
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
      this.emit('vhtlc.failed', {
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
      this.emit('vhtlc.failed', {
        swap,
        reason: Errors.OVERPAID_AMOUNT(vHtlc.amount, swap.expectedAmount!)
          .message,
      });
      return;
    }

    this.emit('vhtlc.found', {
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

  private checkExpiredReverseSwaps = async (
    node: ArkClient,
    blockNumber: number,
  ) => {
    const expirable =
      await ReverseSwapRepository.getReverseSwapsExpirable(blockNumber);

    for (const swap of expirable) {
      const { base, quote } = splitPairId(swap.pair);
      const chainCurrency = getChainCurrency(base, quote, swap.orderSide, true);

      if (chainCurrency === node.symbol) {
        this.emit('vhtlc.expired', swap);
      }
    }
  };
}

export default ArkNursery;
