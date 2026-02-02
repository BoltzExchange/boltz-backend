import type Logger from '../../../../lib/Logger';
import type { IChainClient } from '../../../../lib/chain/ChainClient';
import type NotificationClient from '../../../../lib/notifications/NotificationClient';
import { checkMempoolAndSaveRebroadcast } from '../../../../lib/wallet/providers/WalletProviderInterface';

describe('WalletProviderInterface', () => {
  describe('checkMempoolAndSaveRebroadcast', () => {
    const transactionId = 'abc123txid';
    const transactionHex = '0200000001...';
    const symbol = 'BTC';

    let mockLogger: Logger;
    let mockChainClient: jest.Mocked<IChainClient>;
    let mockNotifications: jest.Mocked<NotificationClient>;

    beforeEach(() => {
      mockLogger = {
        warn: jest.fn(),
      } as unknown as Logger;

      mockChainClient = {
        symbol,
        getRawTransaction: jest.fn(),
        saveRebroadcast: jest.fn(),
      } as unknown as jest.Mocked<IChainClient>;

      mockNotifications = {
        sendMessage: jest.fn(),
      } as unknown as jest.Mocked<NotificationClient>;
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    test('should do nothing when transaction is in mempool', async () => {
      mockChainClient.getRawTransaction.mockResolvedValueOnce(transactionHex);

      await checkMempoolAndSaveRebroadcast(
        mockLogger,
        mockNotifications,
        mockChainClient,
        transactionId,
        transactionHex,
      );

      expect(mockChainClient.getRawTransaction).toHaveBeenCalledWith(
        transactionId,
      );
      expect(mockLogger.warn).not.toHaveBeenCalled();
      expect(mockNotifications.sendMessage).not.toHaveBeenCalled();
      expect(mockChainClient.saveRebroadcast).not.toHaveBeenCalled();
    });

    test('should log warning, send notification, and save for rebroadcast when not in mempool', async () => {
      const error = new Error('No such mempool or blockchain transaction');
      mockChainClient.getRawTransaction.mockRejectedValueOnce(error);
      mockChainClient.saveRebroadcast.mockResolvedValueOnce(undefined);

      await checkMempoolAndSaveRebroadcast(
        mockLogger,
        mockNotifications,
        mockChainClient,
        transactionId,
        transactionHex,
      );

      expect(mockChainClient.getRawTransaction).toHaveBeenCalledWith(
        transactionId,
      );
      expect(mockLogger.warn).toHaveBeenCalledWith(
        `${symbol} transaction (${transactionId}) not in mempool: ${error.message}`,
      );
      expect(mockNotifications.sendMessage).toHaveBeenCalledWith(
        `${symbol} transaction (${transactionId}) not in mempool: ${error.message}`,
        true,
        true,
      );
      expect(mockChainClient.saveRebroadcast).toHaveBeenCalledWith(
        transactionHex,
      );
    });

    test('should handle undefined notifications client gracefully', async () => {
      const error = new Error('No such mempool or blockchain transaction');
      mockChainClient.getRawTransaction.mockRejectedValueOnce(error);
      mockChainClient.saveRebroadcast.mockResolvedValueOnce(undefined);

      await checkMempoolAndSaveRebroadcast(
        mockLogger,
        undefined,
        mockChainClient,
        transactionId,
        transactionHex,
      );

      expect(mockChainClient.getRawTransaction).toHaveBeenCalledWith(
        transactionId,
      );
      expect(mockLogger.warn).toHaveBeenCalledWith(
        `${symbol} transaction (${transactionId}) not in mempool: ${error.message}`,
      );
      expect(mockChainClient.saveRebroadcast).toHaveBeenCalledWith(
        transactionHex,
      );
    });
  });
});
