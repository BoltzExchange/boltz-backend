import { Transaction } from 'bitcoinjs-lib';
import { getUnixTime } from '../../../lib/Utils';
import { OrderSide } from '../../../lib/consts/Enums';
import { ChainSwapInfo } from '../../../lib/db/repositories/ChainSwapRepository';
import ReverseSwapRepository from '../../../lib/db/repositories/ReverseSwapRepository';
import SwapRepository from '../../../lib/db/repositories/SwapRepository';
import Errors from '../../../lib/service/Errors';
import TransactionFetcher from '../../../lib/service/TransactionFetcher';
import { Currency } from '../../../lib/wallet/WalletManager';
import { bitcoinClient } from '../Nodes';
import { getSigner } from '../wallet/EthereumTools';

jest.mock('../../../lib/db/repositories/ChainTipRepository');

describe('TransactionFetcher', () => {
  const currencies = new Map<string, any>([]);
  const fetcher = new TransactionFetcher(currencies);

  beforeAll(async () => {
    await bitcoinClient.connect();
    await bitcoinClient.generate(1);
    currencies.set('BTC', {
      symbol: 'BTC',
      chainClient: bitcoinClient,
    });

    const { provider } = await getSigner();
    currencies.set('RBTC', {
      provider,
      symbol: 'RBTC',
    });
  });

  afterAll(() => {
    bitcoinClient.disconnect();
  });

  describe('getSubmarineTransaction', () => {
    test('should get lockup transaction for reverse swaps', async () => {
      const transactionId = await bitcoinClient.sendToAddress(
        await bitcoinClient.getNewAddress(),
        100_000,
      );
      const timeoutBlockHeight =
        (await bitcoinClient.getBlockchainInfo()).blocks + 1;

      SwapRepository.getSwap = jest.fn().mockResolvedValue({
        timeoutBlockHeight,
        pair: 'L-BTC/BTC',
        orderSide: OrderSide.BUY,
        lockupTransactionId: transactionId,
      });

      const res = await fetcher.getSubmarineTransaction('id');
      expect(res.transactionId).toEqual(transactionId);
      expect(res.timeoutBlockHeight).toEqual(timeoutBlockHeight);
      expect(res.timeoutEta).toBeLessThanOrEqual(getUnixTime() + 600);
      expect(res.transactionHex).toEqual(
        await bitcoinClient.getRawTransaction(transactionId),
      );
    });

    test('should throw when submarine swap has no transaction', async () => {
      SwapRepository.getSwap = jest.fn().mockResolvedValue({});

      await expect(fetcher.getSubmarineTransaction('noTx')).rejects.toEqual(
        Errors.SWAP_NO_LOCKUP(),
      );
    });

    test('should throw when no submarine swap for id can be found', async () => {
      SwapRepository.getSwap = jest.fn().mockResolvedValue(null);
      const id = 'notFound';

      await expect(fetcher.getSubmarineTransaction(id)).rejects.toEqual(
        Errors.SWAP_NOT_FOUND(id),
      );
    });
  });

  describe('getReverseSwapTransaction', () => {
    test('should get lockup transaction for reverse swaps', async () => {
      const transactionId = await bitcoinClient.sendToAddress(
        await bitcoinClient.getNewAddress(),
        100_000,
      );

      ReverseSwapRepository.getReverseSwap = jest.fn().mockResolvedValue({
        transactionId,
        pair: 'L-BTC/BTC',
        timeoutBlockHeight: 123,
        orderSide: OrderSide.SELL,
      });

      await expect(fetcher.getReverseSwapTransaction('id')).resolves.toEqual({
        transactionId,
        timeoutBlockHeight: 123,
        transactionHex: await bitcoinClient.getRawTransaction(transactionId),
      });
    });

    test('should throw when reverse swap has no transaction', async () => {
      ReverseSwapRepository.getReverseSwap = jest.fn().mockResolvedValue({});

      await expect(fetcher.getReverseSwapTransaction('noTx')).rejects.toEqual(
        Errors.SWAP_NO_LOCKUP(),
      );
    });

    test('should throw when no reverse swap for id can be found', async () => {
      ReverseSwapRepository.getReverseSwap = jest.fn().mockResolvedValue(null);
      const id = 'notFound';

      await expect(fetcher.getReverseSwapTransaction(id)).rejects.toEqual(
        Errors.SWAP_NOT_FOUND(id),
      );
    });
  });

  describe('getChainSwapTransactions', () => {
    test('should get user lockup transaction for chain swap', async () => {
      const chainSwap = {
        sendingData: {},
        receivingData: {
          symbol: 'BTC',
          timeoutBlockHeight: 123,
          transactionId: await bitcoinClient.sendToAddress(
            await bitcoinClient.getNewAddress(),
            100_000,
          ),
        },
      } as unknown as ChainSwapInfo;

      await expect(
        fetcher.getChainSwapTransactions(chainSwap),
      ).resolves.toEqual({
        userLock: {
          timeoutBlockHeight: chainSwap.receivingData.timeoutBlockHeight,
          transaction: {
            id: chainSwap.receivingData.transactionId,
            hex: await bitcoinClient.getRawTransaction(
              chainSwap.receivingData.transactionId!,
            ),
          },
        },
      });
    });

    test('should get user and server lockup transaction for chain swap', async () => {
      const chainSwap = {
        sendingData: {
          symbol: 'RBTC',
          timeoutBlockHeight: 4310,
          transactionId: '0xNotFetched',
        },
        receivingData: {
          symbol: 'BTC',
          timeoutBlockHeight: 123,
          transactionId: await bitcoinClient.sendToAddress(
            await bitcoinClient.getNewAddress(),
            100_000,
          ),
        },
      } as unknown as ChainSwapInfo;

      await expect(
        fetcher.getChainSwapTransactions(chainSwap),
      ).resolves.toEqual({
        serverLock: {
          timeoutBlockHeight: chainSwap.sendingData.timeoutBlockHeight,
          transaction: {
            id: chainSwap.sendingData.transactionId,
          },
        },
        userLock: {
          timeoutBlockHeight: chainSwap.receivingData.timeoutBlockHeight,
          transaction: {
            id: chainSwap.receivingData.transactionId,
            hex: await bitcoinClient.getRawTransaction(
              chainSwap.receivingData.transactionId!,
            ),
          },
        },
      });
    });

    test('should throw when chain swap has no transactions', async () => {
      await expect(
        fetcher.getChainSwapTransactions({
          sendingData: {},
          receivingData: {},
        } as unknown as ChainSwapInfo),
      ).rejects.toEqual(Errors.SWAP_NO_LOCKUP());
    });
  });

  describe('getTransactionHex', () => {
    test('should get transaction hex for chain clients', async () => {
      const tx = Transaction.fromHex(
        await bitcoinClient.getRawTransaction(
          await bitcoinClient.sendToAddress(
            await bitcoinClient.getNewAddress(),
            100_000,
          ),
        ),
      );

      await expect(
        fetcher['getTransactionHex'](currencies.get('BTC'), tx.getId()),
      ).resolves.toEqual(tx.toHex());
    });

    test('should return undefined when getting transaction hex for currency without chain client', async () => {
      await expect(
        fetcher['getTransactionHex'](currencies.get('RBTC'), 'id'),
      ).resolves.toBeUndefined();
    });
  });

  describe('getBlockHeight', () => {
    test('should get block height for chain clients', async () => {
      await expect(
        fetcher['getBlockHeight'](currencies.get('BTC')!),
      ).resolves.toEqual((await bitcoinClient.getBlockchainInfo()).blocks);
    });

    test('should get block height for Ethereum providers', async () => {
      const rbtc = currencies.get('RBTC');
      await expect(fetcher['getBlockHeight'](rbtc)).resolves.toEqual(
        await rbtc.provider!.getBlockNumber(),
      );
    });

    test('should throw when getting block height for currency with no chain client and no provider', async () => {
      const currency = {
        symbol: 'no',
      } as Currency;
      await expect(fetcher['getBlockHeight'](currency)).rejects.toEqual(
        Errors.NOT_SUPPORTED_BY_SYMBOL(currency.symbol),
      );
    });
  });
});
