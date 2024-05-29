import { Transaction } from 'bitcoinjs-lib';
import { Transaction as LiquidTransaction } from 'liquidjs-lib';
import { Op } from 'sequelize';
import {
  getChainCurrency,
  getHexString,
  reverseBuffer,
  splitPairId,
} from '../Utils';
import ChainSwapData from '../db/models/ChainSwapData';
import ReverseSwap from '../db/models/ReverseSwap';
import Swap from '../db/models/Swap';
import ChainSwapRepository, {
  ChainSwapInfo,
} from '../db/repositories/ChainSwapRepository';
import ReverseSwapRepository from '../db/repositories/ReverseSwapRepository';
import SwapRepository from '../db/repositories/SwapRepository';
import Wallet from '../wallet/Wallet';
import { Currency } from '../wallet/WalletManager';
import Errors from './Errors';
import { calculateTimeoutDate, getCurrency } from './Utils';

type ReverseTransaction = {
  transactionId: string;
  timeoutBlockHeight: number;
  transactionHex?: string;
};

type SwapTransaction = ReverseTransaction & {
  timeoutEta?: number;
};

type ChainSwapTransaction = {
  transaction: {
    id: string;
    hex?: string;
  };
  timeout: {
    blockHeight: number;
    eta?: number;
  };
};

type ChainSwapTransactions = {
  userLock?: ChainSwapTransaction;
  serverLock?: ChainSwapTransaction;
};

class TransactionFetcher {
  constructor(private readonly currencies: Map<string, Currency>) {}

  /**
   * Gets the hex encoded lockup transaction of a Submarine Swap, the block height
   * at which it will time out and the expected ETA for that block
   */
  public getSubmarineTransaction = async (
    id: string,
  ): Promise<SwapTransaction> => {
    const swap = await SwapRepository.getSwap({
      id,
    });

    if (!swap) {
      throw Errors.SWAP_NOT_FOUND(id);
    }

    if (!swap.lockupTransactionId) {
      throw Errors.SWAP_NO_LOCKUP();
    }

    const { base, quote } = splitPairId(swap.pair);
    const chainCurrency = getChainCurrency(base, quote, swap.orderSide, false);
    const currency = getCurrency(this.currencies, chainCurrency);

    const [timeoutEta, transactionHex] = await Promise.all([
      this.getTimeoutEta(currency, swap.timeoutBlockHeight),
      this.getTransactionHex(currency, swap.lockupTransactionId!),
    ]);

    return {
      timeoutEta,
      transactionHex,
      transactionId: swap.lockupTransactionId,
      timeoutBlockHeight: swap.timeoutBlockHeight,
    };
  };

  public getReverseSwapTransaction = async (
    id: string,
  ): Promise<ReverseTransaction> => {
    const reverseSwap = await ReverseSwapRepository.getReverseSwap({
      id,
    });

    if (!reverseSwap) {
      throw Errors.SWAP_NOT_FOUND(id);
    }

    if (!reverseSwap.transactionId) {
      throw Errors.SWAP_NO_LOCKUP();
    }

    const { base, quote } = splitPairId(reverseSwap.pair);
    const currency = getCurrency(
      this.currencies,
      getChainCurrency(base, quote, reverseSwap.orderSide, true),
    );

    return {
      transactionId: reverseSwap.transactionId,
      timeoutBlockHeight: reverseSwap.timeoutBlockHeight,
      transactionHex: await this.getTransactionHex(
        currency,
        reverseSwap.transactionId,
      ),
    };
  };

  public getChainSwapTransactions = async (
    chainSwap: ChainSwapInfo,
  ): Promise<ChainSwapTransactions> => {
    if (
      [chainSwap.sendingData, chainSwap.receivingData].every(
        (d) => d.transactionId === undefined || d.transactionId === null,
      )
    ) {
      throw Errors.SWAP_NO_LOCKUP();
    }

    const [userLock, serverLock] = await Promise.all([
      this.getChainSwapTransaction(chainSwap.receivingData),
      this.getChainSwapTransaction(chainSwap.sendingData),
    ]);

    return {
      userLock,
      serverLock,
    };
  };

  public getSwapsSpentInInputs = async (
    transaction: Transaction | LiquidTransaction,
  ): Promise<{
    swapsRefunded: Swap[];
    chainSwapsSpent: ChainSwapInfo[];
    reverseSwapsClaimed: ReverseSwap[];
  }> => {
    const inputIds = transaction.ins.map((input) =>
      getHexString(reverseBuffer(input.hash)),
    );
    if (inputIds.length === 0) {
      return {
        swapsRefunded: [],
        chainSwapsSpent: [],
        reverseSwapsClaimed: [],
      };
    }

    const [swapsRefunded, reverseSwapsClaimed, chainSwapsSpent] =
      await Promise.all([
        SwapRepository.getSwaps({
          lockupTransactionId: {
            [Op.in]: inputIds,
          },
        }),
        ReverseSwapRepository.getReverseSwaps({
          transactionId: {
            [Op.in]: inputIds,
          },
        }),
        ChainSwapRepository.getChainSwapsByData({
          transactionId: {
            [Op.in]: inputIds,
          },
        }),
      ]);

    return {
      swapsRefunded,
      chainSwapsSpent,
      reverseSwapsClaimed,
    };
  };

  public getSwapsFundedInOutputs = async (
    wallet: Wallet | undefined,
    transaction: Transaction | LiquidTransaction,
  ): Promise<{
    swapLockups: Swap[];
    chainSwapLockups: ChainSwapInfo[];
  }> => {
    const outputAddresses =
      wallet !== undefined
        ? transaction.outs
            // Filter Liquid fee outputs
            .filter((out) => out.script.length > 0)
            .map((out) => wallet.encodeAddress(out.script))
        : [];

    if (outputAddresses.length === 0) {
      return {
        swapLockups: [],
        chainSwapLockups: [],
      };
    }

    const [swapLockups, chainSwapLockups] = await Promise.all([
      SwapRepository.getSwaps({
        lockupAddress: {
          [Op.in]: outputAddresses,
        },
      }),
      ChainSwapRepository.getChainSwapsByData({
        lockupAddress: {
          [Op.in]: outputAddresses,
        },
      }),
    ]);

    return {
      swapLockups,
      chainSwapLockups,
    };
  };

  private getChainSwapTransaction = async (
    data: ChainSwapData,
  ): Promise<ChainSwapTransaction | undefined> => {
    if (data.transactionId === undefined || data.transactionId === null) {
      return undefined;
    }

    const currency = getCurrency(this.currencies, data.symbol);

    const [transactionHex, timeoutEta] = await Promise.all([
      this.getTransactionHex(currency, data.transactionId),
      this.getTimeoutEta(currency, data.timeoutBlockHeight),
    ]);

    return {
      transaction: {
        hex: transactionHex,
        id: data.transactionId,
      },
      timeout: {
        eta: timeoutEta,
        blockHeight: data.timeoutBlockHeight,
      },
    };
  };

  /**
   * Returns the raw transaction as hex string for UTXO based chains
   */
  private getTransactionHex = async (
    currency: Currency,
    transactionId: string,
  ) => {
    if (currency.chainClient === undefined) {
      return undefined;
    }

    return currency.chainClient.getRawTransaction(transactionId);
  };

  /**
   * Returns undefined when the timeout block height has been reached already
   */
  private getTimeoutEta = async (
    currency: Currency,
    timeoutBlockHeight: number,
  ): Promise<number | undefined> => {
    const blockHeight = await this.getBlockHeight(currency);
    if (blockHeight >= timeoutBlockHeight) {
      return undefined;
    }

    return calculateTimeoutDate(
      currency.symbol,
      timeoutBlockHeight - blockHeight,
    );
  };

  private getBlockHeight = async (currency: Currency): Promise<number> => {
    if (currency.chainClient) {
      const chainInfo = await currency.chainClient.getBlockchainInfo();
      return chainInfo.blocks;
    }

    if (currency.provider) {
      return currency.provider.getBlockNumber();
    }

    throw Errors.NOT_SUPPORTED_BY_SYMBOL(currency.symbol);
  };
}

export default TransactionFetcher;
export { ChainSwapTransactions, ChainSwapTransaction };
