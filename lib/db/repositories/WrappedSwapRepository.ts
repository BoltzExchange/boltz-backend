import { getHexString } from '../../Utils';
import { SwapType, SwapUpdateEvent } from '../../consts/Enums';
import Database from '../Database';
import type ReverseSwap from '../models/ReverseSwap';
import type { ChainSwapInfo } from './ChainSwapRepository';

class WrappedSwapRepository {
  public static setStatus = async <T extends ReverseSwap | ChainSwapInfo>(
    swap: T,
    status: SwapUpdateEvent,
    failureReason?: string,
  ): Promise<T> => {
    if (swap.type === SwapType.ReverseSubmarine) {
      return (await (swap as ReverseSwap).update({
        status,
        failureReason: swap.failureReason || failureReason,
      })) as T;
    } else {
      const chainSwap = swap as ChainSwapInfo;
      chainSwap.chainSwap = await chainSwap.chainSwap.update({
        status,
        failureReason: swap.failureReason || failureReason,
      });
      return chainSwap as T;
    }
  };

  public static setServerLockupTransaction = <
    T extends ReverseSwap | ChainSwapInfo,
  >(
    swap: T,
    transactionId: string,
    onchainAmount: number,
    fee: number,
    vout?: number,
  ): Promise<T> => {
    if (swap.type === SwapType.ReverseSubmarine) {
      return (swap as ReverseSwap).update({
        transactionId,
        minerFee: fee,
        transactionVout: vout,
        status: SwapUpdateEvent.TransactionMempool,
      }) as Promise<T>;
    } else {
      const chainSwap = swap as ChainSwapInfo;
      return Database.sequelize.transaction<T>(async (transaction) => {
        chainSwap.chainSwap = await chainSwap.chainSwap.update(
          {
            status: SwapUpdateEvent.TransactionServerMempool,
          },
          { transaction },
        );
        chainSwap.sendingData = await chainSwap.sendingData.update(
          {
            transactionId,
            fee,
            transactionVout: vout,
            amount: onchainAmount,
          },
          { transaction },
        );

        return chainSwap as T;
      });
    }
  };

  public static setPreimage = async <T extends ReverseSwap | ChainSwapInfo>(
    swap: T,
    preimage: Buffer,
  ): Promise<T> => {
    if (swap.type === SwapType.ReverseSubmarine) {
      return (await (swap as ReverseSwap).update({
        preimage: getHexString(preimage),
      })) as T;
    } else {
      const chainSwap = swap as ChainSwapInfo;
      chainSwap.chainSwap = await chainSwap.chainSwap.update({
        preimage: getHexString(preimage),
      });
      return chainSwap as T;
    }
  };

  public static setTransactionRefunded = <
    T extends ReverseSwap | ChainSwapInfo,
  >(
    swap: T,
    minerFee: number,
    failureReason: string,
  ): Promise<T> => {
    if (swap.type === SwapType.ReverseSubmarine) {
      return (swap as ReverseSwap).update({
        failureReason,
        status: SwapUpdateEvent.TransactionRefunded,
        minerFee: (swap as ReverseSwap).minerFee + minerFee,
      }) as Promise<T>;
    } else {
      const chainSwap = swap as ChainSwapInfo;
      return Database.sequelize.transaction<T>(async (transaction) => {
        chainSwap.chainSwap = await chainSwap.chainSwap.update(
          {
            failureReason,
            status: SwapUpdateEvent.TransactionRefunded,
          },
          { transaction },
        );
        chainSwap.sendingData = await chainSwap.sendingData.update(
          {
            fee: chainSwap.sendingData.fee! + minerFee,
          },
          { transaction },
        );

        return chainSwap as T;
      });
    }
  };
}

export default WrappedSwapRepository;
