import { RawWitness, type Transaction } from '@scure/btc-signer';
import { createHash } from 'crypto';
import { Op } from 'sequelize';
import type Logger from '../Logger';
import { getChainCurrency, getHexString, splitPairId } from '../Utils';
import ArkClient, {
  type CreatedVHtlc,
  type SpentVHtlc,
} from '../chain/ArkClient';
import {
  CurrencyType,
  SwapType,
  SwapUpdateEvent,
  swapTypeToPrettyString,
} from '../consts/Enums';
import TypedEventEmitter from '../consts/TypedEventEmitter';
import type ReverseSwap from '../db/models/ReverseSwap';
import type Swap from '../db/models/Swap';
import type { ChainSwapInfo } from '../db/repositories/ChainSwapRepository';
import ChainSwapRepository from '../db/repositories/ChainSwapRepository';
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

  'chainSwap.lockup': {
    swap: ChainSwapInfo;
    lockupTransactionId: string;
  };
  'chainSwap.lockup.failed': {
    swap: ChainSwapInfo;
    reason: string;
  };
  'chainSwap.claimed': {
    swap: ChainSwapInfo;
    preimage: Buffer;
  };
  'chainSwap.expired': ChainSwapInfo;
}> {
  private static readonly arkConditionPsbtKeyName = Buffer.from(
    'condition',
    'utf-8',
  );

  constructor(
    private readonly logger: Logger,
    private readonly overpaymentProtector: OverpaymentProtector,
  ) {
    super();
  }

  private static extractPreimages = (tx: Transaction) => {
    return ArkClient.mapInputs(tx)
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

  private static isPreimage = (field: { type: number; key: Uint8Array }) => {
    return Buffer.from([field.type, ...field.key]).includes(
      ArkNursery.arkConditionPsbtKeyName,
    );
  };

  public init = (currencies: Currency[]) => {
    for (const ark of currencies.filter(
      (c) => c.type === CurrencyType.Ark && c.arkNode !== undefined,
    )) {
      this.bindEvents(ark.arkNode!);
    }
  };

  private bindEvents = (arkNode: ArkClient) => {
    arkNode.on('vhtlc.created', async (vHtlc) => {
      await Promise.all([
        this.checkSubmarineLockup(arkNode, vHtlc),
        this.checkChainSwapLockup(arkNode, vHtlc),
      ]);
    });

    arkNode.on('vhtlc.spent', async (vHtlc) => {
      await this.checkClaims(arkNode, vHtlc);
    });

    arkNode.on('block', async ({ height, medianTime }) => {
      await this.checkExpiredSwaps(arkNode, height || medianTime || 0);
    });
  };

  private checkSubmarineLockup = async (
    arkNode: ArkClient,
    vHtlc: CreatedVHtlc,
  ) => {
    const swap = await SwapRepository.getSwap({
      status: {
        [Op.in]: [SwapUpdateEvent.SwapCreated, SwapUpdateEvent.InvoiceSet],
      },
      lockupAddress: vHtlc.address,
    });

    if (swap === null || swap === undefined) {
      return;
    }

    arkNode.subscription.unsubscribeAddress(vHtlc.address);

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

  private checkChainSwapLockup = async (
    arkNode: ArkClient,
    vHtlc: CreatedVHtlc,
  ) => {
    const swap = await ChainSwapRepository.getChainSwapByData(
      {
        lockupAddress: vHtlc.address,
      },
      {
        status: {
          [Op.in]: [
            SwapUpdateEvent.SwapCreated,
            SwapUpdateEvent.TransactionMempool,
            SwapUpdateEvent.TransactionLockupFailed,
            SwapUpdateEvent.TransactionZeroConfRejected,
            SwapUpdateEvent.TransactionConfirmed,
          ],
        },
      },
    );

    if (swap === null || swap === undefined) {
      return;
    }

    if (swap.receivingData.symbol !== arkNode.symbol) {
      return;
    }

    arkNode.subscription.unsubscribeAddress(vHtlc.address);

    this.logger.info(
      `Found ${ArkClient.symbol} lockup vHTLC for ${swapTypeToPrettyString(swap.type)} Swap ${swap.id}: ${vHtlc.txId}:${vHtlc.vout}`,
    );

    if (swap.receivingData.expectedAmount! > vHtlc.amount) {
      this.emit('chainSwap.lockup.failed', {
        swap,
        reason: Errors.INSUFFICIENT_AMOUNT(
          vHtlc.amount,
          swap.receivingData.expectedAmount!,
        ).message,
      });
      return;
    }

    if (
      this.overpaymentProtector.isUnacceptableOverpay(
        swap.type,
        swap.receivingData.expectedAmount!,
        vHtlc.amount,
      )
    ) {
      this.emit('chainSwap.lockup.failed', {
        swap,
        reason: Errors.OVERPAID_AMOUNT(
          vHtlc.amount,
          swap.receivingData.expectedAmount!,
        ).message,
      });
      return;
    }

    this.emit('chainSwap.lockup', {
      swap: await ChainSwapRepository.setUserLockupTransaction(
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
    this.logger.debug(
      `Checking claims for ${ArkClient.symbol} vHTLC in: ${vHtlc.spentBy}`,
    );
    const claimTx = await arkNode.getTx(vHtlc.spentBy);
    for (const preimage of ArkNursery.extractPreimages(claimTx)) {
      const preimageHash = createHash('sha256').update(preimage).digest('hex');

      const [reverseSwap, chainSwap] = await Promise.all([
        ReverseSwapRepository.getReverseSwap({
          status: {
            [Op.in]: [
              SwapUpdateEvent.TransactionMempool,
              SwapUpdateEvent.TransactionConfirmed,
            ],
          },
          preimageHash,
        }),
        ChainSwapRepository.getChainSwap({
          status: {
            [Op.or]: [
              SwapUpdateEvent.TransactionServerMempool,
              SwapUpdateEvent.TransactionServerConfirmed,
              SwapUpdateEvent.TransactionRefunded,
            ],
          },
          preimageHash,
        }),
      ]);

      const logPreimage = (swap: ReverseSwap | ChainSwapInfo) => {
        this.logger.debug(
          `Found preimage for ${swapTypeToPrettyString(swap.type)} Swap ${swap.id} in ${vHtlc.spentBy}: ${getHexString(preimage)}`,
        );
      };

      if (reverseSwap !== null && reverseSwap !== undefined) {
        logPreimage(reverseSwap);
        this.emit('reverseSwap.claimed', {
          reverseSwap,
          preimage,
        });
        arkNode.subscription.unsubscribeAddress(reverseSwap.lockupAddress);
      }

      if (chainSwap !== null && chainSwap !== undefined) {
        logPreimage(chainSwap);
        this.emit('chainSwap.claimed', {
          swap: chainSwap,
          preimage,
        });
        arkNode.subscription.unsubscribeAddress(
          chainSwap.sendingData.lockupAddress,
        );
      }
    }
  };

  private checkExpiredSwaps = async (node: ArkClient, currentTime: number) => {
    const [reverseSwaps, chainSwaps] = await Promise.all([
      ReverseSwapRepository.getReverseSwapsExpirable(currentTime),
      ChainSwapRepository.getChainSwapsExpirable([node.symbol], currentTime),
    ]);

    for (const swap of [...reverseSwaps, ...chainSwaps]) {
      const { base, quote } = splitPairId(swap.pair);
      const chainCurrency = getChainCurrency(base, quote, swap.orderSide, true);

      if (chainCurrency === node.symbol) {
        node.subscription.unsubscribeAddress(
          swap.type === SwapType.ReverseSubmarine
            ? (swap as ReverseSwap).lockupAddress
            : (swap as ChainSwapInfo).sendingData.lockupAddress,
        );

        if (swap.type === SwapType.ReverseSubmarine) {
          this.emit('reverseSwap.expired', swap as ReverseSwap);
        } else {
          this.emit('chainSwap.expired', swap as ChainSwapInfo);
        }
      }
    }
  };
}

export default ArkNursery;
