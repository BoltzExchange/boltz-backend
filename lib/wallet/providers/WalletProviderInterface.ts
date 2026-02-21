import type { Transaction } from 'bitcoinjs-lib';
import type { Transaction as LiquidTransaction } from 'liquidjs-lib';
import type Logger from '../../Logger';
import { formatError } from '../../Utils';
import type { IChainClient } from '../../chain/ChainClient';
import type NotificationClient from '../../notifications/NotificationClient';

type WalletBalance = {
  confirmedBalance: number;
  unconfirmedBalance: number;
};

type SentTransaction = {
  fee?: number;

  vout?: number;
  transactionId: string;

  transaction?: Transaction | LiquidTransaction;
};

interface BalancerFetcher {
  serviceName(): string;
  getBalance(): Promise<WalletBalance>;
}

interface WalletProviderInterface extends BalancerFetcher {
  readonly symbol: string;

  getAddress: (label: string) => Promise<string>;

  /**
   * Sends coins from the wallet
   *
   * @param address
   * @param amount
   * @param relativeFee
   */
  sendToAddress: (
    address: string,
    amount: number,
    relativeFee: number | undefined,
    label: string,
  ) => Promise<SentTransaction>;

  /**
   * Sweeps the wallet
   *
   * @param address
   * @param relativeFee
   */
  sweepWallet: (
    address: string,
    relativeFee: number | undefined,
    label: string,
  ) => Promise<SentTransaction>;
}

const checkMempoolAndSaveRebroadcast = async (
  logger: Logger,
  notifications: NotificationClient | undefined,
  chainClient: IChainClient,
  transactionId: string,
  transactionHex: string,
): Promise<void> => {
  try {
    await chainClient.getRawTransaction(transactionId);
  } catch (e) {
    try {
      await chainClient.saveRebroadcast(transactionHex);
    } catch (e) {
      logger.error(
        `Failed to save ${chainClient.symbol} rebroadcast (${transactionId}): ${formatError(e)}`,
      );
    }

    const message = `${chainClient.symbol} transaction (${transactionId}) not in mempool: ${formatError(e)}`;
    logger.warn(message);

    try {
      await notifications?.sendMessage(message, true, true);
    } catch (e) {
      logger.warn(
        `Failed to send notification about transaction being not in mempool: ${formatError(e)}`,
      );
    }
  }
};

export default WalletProviderInterface;
export {
  SentTransaction,
  WalletBalance,
  BalancerFetcher,
  checkMempoolAndSaveRebroadcast,
};
