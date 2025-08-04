import { RawWitness, type Transaction } from '@scure/btc-signer';
import { createHash } from 'crypto';
import { Op } from 'sequelize';
import type Logger from '../Logger';
import { getChainCurrency, splitPairId } from '../Utils';
import ArkClient, {
  type CreatedVHtlc,
  type SpentVHtlc,
} from '../chain/ArkClient';
import AspClient from '../chain/AspClient';
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
  'swap.lockup': {
    swap: Swap;
    lockupTransactionId: string;
  };
  'swap.lockup.failed': {
    swap: Swap;
    reason: string;
  };

  'reverseSwap.expired': ReverseSwap;
  'reverseSwap.claimed': {
    reverseSwap: ReverseSwap;
    preimage: Buffer;
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
      this.bindEvents(ark.arkNode!);
    }
  };

  private bindEvents = (arkNode: ArkClient) => {
    arkNode.on('vhtlc.created', async (vHtlc) => {
      await this.checkLockups(vHtlc);
    });

    arkNode.on('vhtlc.spent', async (vHtlc) => {
      await this.checkClaims(arkNode, vHtlc);
    });

    arkNode.on('block', async (blockNumber) => {
      await this.checkExpiredReverseSwaps(arkNode, blockNumber);
    });
  };

  private checkLockups = async (vHtlc: CreatedVHtlc) => {
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

    if (swap.expectedAmount! > vHtlc.amount) {
      this.emit('swap.lockup.failed', {
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
      this.emit('swap.lockup.failed', {
        swap,
        reason: Errors.OVERPAID_AMOUNT(vHtlc.amount, swap.expectedAmount!)
          .message,
      });
      return;
    }

    this.emit('swap.lockup', {
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

  private checkClaims = async (arkNode: ArkClient, vHtlc: SpentVHtlc) => {
    const claimTx = await arkNode.aspClient.getTx(vHtlc.spentBy);
    for (const preimage of ArkNursery.extractPreimages(claimTx)) {
      const preimageHash = createHash('sha256').update(preimage).digest('hex');

      // TODO: Chain swaps
      const reverseSwap = await ReverseSwapRepository.getReverseSwap({
        status: {
          [Op.in]: [
            SwapUpdateEvent.TransactionMempool,
            SwapUpdateEvent.TransactionConfirmed,
          ],
        },
        preimageHash,
      });
      if (reverseSwap === null || reverseSwap === undefined) {
        continue;
      }

      this.emit('reverseSwap.claimed', {
        reverseSwap,
        preimage,
      });
    }
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
        this.emit('reverseSwap.expired', swap);
      }
    }
  };

  private static extractPreimages = (tx: Transaction) => {
    return AspClient.mapInputs(tx)
      .map((input) => {
        const arkConditionField = input.unknown?.find(([x]) =>
          ArkNursery.isPreimage(x),
        );

        if (arkConditionField === undefined) {
          return undefined;
        }

        const conditionWitness = RawWitness.decode(arkConditionField[1]);
        if (conditionWitness.length !== 1) {
          return undefined;
        }

        return Buffer.from(conditionWitness[0]);
      })
      .filter((x) => x !== undefined);
  };

  private static arkConditionPsbtKeyName = Buffer.from('condition', 'utf-8');

  private static isPreimage = (field: { type: number; key: Uint8Array }) => {
    return Buffer.from([field.type, ...field.key]).includes(
      ArkNursery.arkConditionPsbtKeyName,
    );
  };
}

export default ArkNursery;
