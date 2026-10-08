import Logger from '../../../../lib/Logger';
import type { IChainClient } from '../../../../lib/chain/ChainClient';
import RpcClient from '../../../../lib/chain/RpcClient';
import { resolveBitcoinNetwork } from '../../../../lib/consts/BitcoinNetworks';
import CoreWalletProvider from '../../../../lib/wallet/providers/CoreWalletProvider';
import NotBroadcastError from '../../../../lib/wallet/providers/NotBroadcastError';

describe('CoreWalletProvider', () => {
  const provider = (
    sendToAddress: jest.Mock,
    getWalletTransaction?: jest.Mock,
  ) =>
    new CoreWalletProvider(
      Logger.disabledLogger,
      {
        symbol: 'BTC',
        sendToAddress,
        getWalletTransaction:
          getWalletTransaction ??
          jest.fn().mockRejectedValue(new Error('unreachable')),
      } as unknown as IChainClient,
      resolveBitcoinNetwork('regtest')!,
    );

  test('should mark a refusal by the node as not broadcast', async () => {
    const refusal = RpcClient.markNodeError({
      code: -6,
      message: 'Insufficient funds',
    });
    await expect(
      provider(jest.fn().mockRejectedValue(refusal)).sendToAddress(
        'bcrt1q',
        1,
        2,
        'label',
      ),
    ).rejects.toBeInstanceOf(NotBroadcastError);
  });

  test('should not mark an error of another origin as not broadcast', async () => {
    const lookalike = { code: -6, message: 'not from the node' };
    await expect(
      provider(jest.fn().mockRejectedValue(lookalike)).sendToAddress(
        'bcrt1q',
        1,
        2,
        'label',
      ),
    ).rejects.toBe(lookalike);
  });

  test('should not mark a lost answer as not broadcast', async () => {
    const lost = new Error('socket hang up');
    await expect(
      provider(jest.fn().mockRejectedValue(lost)).sendToAddress(
        'bcrt1q',
        1,
        2,
        'label',
      ),
    ).rejects.toBe(lost);
  });

  test('should not mark an error after the send as not broadcast', async () => {
    const after = RpcClient.markNodeError({
      code: -5,
      message: 'Invalid or non-wallet transaction id',
    });
    await expect(
      provider(
        jest.fn().mockResolvedValue('txid'),
        jest.fn().mockRejectedValue(after),
      ).sendToAddress('bcrt1q', 1, 2, 'label'),
    ).rejects.toBe(after);
  });

  describe('findSend', () => {
    const address = 'bcrt1plockup';
    const since = new Date(1_700_000_000_000);
    const sinceSeconds = since.getTime() / 1000;

    const entry = (overrides: Record<string, unknown> = {}) => ({
      txid: 'other',
      category: 'receive',
      address: 'bcrt1qother',
      amount: 0.001,
      confirmations: 1,
      time: sinceSeconds + 60,
      timereceived: sinceSeconds + 60,
      ...overrides,
    });
    const fullPage = (overrides: Record<string, unknown> = {}) =>
      Array.from({ length: 100 }, () => entry(overrides));

    const findSendWith = (listWalletTransactions: jest.Mock) => {
      const walletProvider = new CoreWalletProvider(
        Logger.disabledLogger,
        { symbol: 'BTC', listWalletTransactions } as unknown as IChainClient,
        resolveBitcoinNetwork('regtest')!,
      );
      const handleCoreTransaction = jest
        .spyOn(walletProvider as any, 'handleCoreTransaction')
        .mockImplementation(async (transactionId) => ({
          transactionId,
          vout: 1,
          fee: 150,
        }));

      return { walletProvider, handleCoreTransaction };
    };

    test('should find a send to the address', async () => {
      const list = jest
        .fn()
        .mockResolvedValue([
          entry(),
          entry({ txid: 'lockup', category: 'send', address, amount: -0.001 }),
        ]);
      const { walletProvider, handleCoreTransaction } = findSendWith(list);

      await expect(walletProvider.findSend(address, since)).resolves.toEqual({
        transactionId: 'lockup',
        vout: 1,
        fee: 150,
      });
      expect(list).toHaveBeenCalledWith(100, 0);
      expect(handleCoreTransaction).toHaveBeenCalledWith('lockup', address);
    });

    test.each`
      description            | overrides
      ${'a receive'}         | ${{ category: 'receive', address }}
      ${'another address'}   | ${{ category: 'send', address: 'bcrt1qother' }}
      ${'an abandoned send'} | ${{ category: 'send', address, abandoned: true }}
      ${'a conflicted send'} | ${{ category: 'send', address, confirmations: -2 }}
    `('should not count $description', async ({ overrides }) => {
      const { walletProvider } = findSendWith(
        jest.fn().mockResolvedValue([entry(overrides)]),
      );

      await expect(
        walletProvider.findSend(address, since),
      ).resolves.toBeUndefined();
    });

    test('should read older pages until one starts before since', async () => {
      const list = jest
        .fn()
        .mockResolvedValueOnce(fullPage())
        .mockResolvedValueOnce([
          ...fullPage().slice(1),
          entry({ txid: 'lockup', category: 'send', address }),
        ])
        .mockResolvedValue(fullPage({ timereceived: sinceSeconds - 1 }));
      const { walletProvider } = findSendWith(list);

      await expect(walletProvider.findSend(address, since)).resolves.toEqual(
        expect.objectContaining({ transactionId: 'lockup' }),
      );
      expect(list).toHaveBeenCalledTimes(2);
      expect(list).toHaveBeenNthCalledWith(2, 100, 100);
    });

    test('should stop at the page that starts before since', async () => {
      const list = jest
        .fn()
        .mockResolvedValueOnce(fullPage())
        .mockResolvedValueOnce(fullPage({ timereceived: sinceSeconds - 1 }))
        .mockResolvedValue(fullPage());
      const { walletProvider } = findSendWith(list);

      await expect(
        walletProvider.findSend(address, since),
      ).resolves.toBeUndefined();
      expect(list).toHaveBeenCalledTimes(2);
    });

    test('should stop at a short page', async () => {
      const list = jest
        .fn()
        .mockResolvedValueOnce(fullPage())
        .mockResolvedValue([]);
      const { walletProvider } = findSendWith(list);

      await expect(
        walletProvider.findSend(address, since),
      ).resolves.toBeUndefined();
      expect(list).toHaveBeenCalledTimes(2);
    });

    test('should throw when it cannot find where since begins', async () => {
      const list = jest.fn().mockResolvedValue(fullPage());
      const { walletProvider } = findSendWith(list);

      await expect(walletProvider.findSend(address, since)).rejects.toThrow(
        'more than 5000 wallet transactions since',
      );
      expect(list).toHaveBeenCalledTimes(50);
    });

    test('should pass on errors of the node', async () => {
      const error = new Error('connection refused');
      const { walletProvider } = findSendWith(
        jest.fn().mockRejectedValue(error),
      );

      await expect(walletProvider.findSend(address, since)).rejects.toBe(error);
    });
  });
});
