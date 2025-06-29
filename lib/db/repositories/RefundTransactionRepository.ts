import RefundTransaction, {
  RefundStatus,
  type RefundTransactionType,
} from '../models/RefundTransaction';
import type ReverseSwap from '../models/ReverseSwap';
import ChainSwapRepository, { type ChainSwapInfo } from './ChainSwapRepository';
import ReverseSwapRepository from './ReverseSwapRepository';

class RefundTransactionRepository {
  public static addTransaction = async (
    refundTransaction: Omit<RefundTransactionType, 'status'>,
  ) => {
    return await RefundTransaction.create({
      ...refundTransaction,
      status: RefundStatus.Pending,
    });
  };

  public static getTransaction = async (txId: string) => {
    return await RefundTransaction.findOne({ where: { id: txId } });
  };

  public static setStatus = async (swapId: string, status: RefundStatus) => {
    await RefundTransaction.update({ status }, { where: { swapId } });
  };

  public static getTransactionForSwap = async (swapId: string) => {
    return await RefundTransaction.findOne({ where: { swapId } });
  };

  public static getPendingTransactions = async () => {
    const txs = await RefundTransaction.findAll({
      where: { status: RefundStatus.Pending },
    });

    return Promise.all(
      txs.map(async (tx) => {
        const swap = await this.getSwapForTransaction(tx.swapId);
        return { tx, swap };
      }),
    );
  };

  private static getSwapForTransaction = async (
    swapId: string,
  ): Promise<ReverseSwap | ChainSwapInfo> => {
    const [reverse, chain] = await Promise.all([
      ReverseSwapRepository.getReverseSwap({ id: swapId }),
      ChainSwapRepository.getChainSwap({ id: swapId }),
    ]);

    if (reverse !== null && chain !== null) {
      throw new Error(
        'both reverse and chain swaps found for refund transaction',
      );
    }

    if (reverse !== null) {
      return reverse;
    }

    if (chain !== null) {
      return chain;
    }

    throw new Error('no swap found for refund transaction');
  };
}

export default RefundTransactionRepository;
