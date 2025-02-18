import { Transaction, address } from 'bitcoinjs-lib';
import { Networks } from 'boltz-core';
import { Op } from 'sequelize';
import { getHexString, getUnixTime, reverseBuffer } from '../../../lib/Utils';
import { OrderSide } from '../../../lib/consts/Enums';
import ChainSwapRepository, {
  ChainSwapInfo,
} from '../../../lib/db/repositories/ChainSwapRepository';
import ReverseSwapRepository from '../../../lib/db/repositories/ReverseSwapRepository';
import SwapRepository from '../../../lib/db/repositories/SwapRepository';
import Errors from '../../../lib/service/Errors';
import TransactionFetcher from '../../../lib/service/TransactionFetcher';
import Wallet from '../../../lib/wallet/Wallet';
import { Currency } from '../../../lib/wallet/WalletManager';
import { bitcoinClient } from '../Nodes';
import { getSigner } from '../wallet/EthereumTools';

jest.mock('../../../lib/db/repositories/SwapRepository');
jest.mock('../../../lib/db/repositories/ChainTipRepository');
jest.mock('../../../lib/db/repositories/ChainSwapRepository');
jest.mock('../../../lib/db/repositories/ReverseSwapRepository');

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

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    bitcoinClient.disconnect();
  });

  describe('getSubmarineTransaction', () => {
    test('should get lockup transaction for reverse swaps', async () => {
      const transactionId = await bitcoinClient.sendToAddress(
        await bitcoinClient.getNewAddress(''),
        100_000,
        undefined,
        false,
        '',
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
        await bitcoinClient.getNewAddress(''),
        100_000,
        undefined,
        false,
        '',
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
            await bitcoinClient.getNewAddress(''),
            100_000,
            undefined,
            false,
            '',
          ),
        },
      } as unknown as ChainSwapInfo;

      await expect(
        fetcher.getChainSwapTransactions(chainSwap),
      ).resolves.toEqual({
        userLock: {
          transaction: {
            id: chainSwap.receivingData.transactionId,
            hex: await bitcoinClient.getRawTransaction(
              chainSwap.receivingData.transactionId!,
            ),
          },
          timeout: { blockHeight: chainSwap.receivingData.timeoutBlockHeight },
        },
      });
    });

    test('should get user lockup transaction with timeout ETA for chain swap', async () => {
      const blockHeight = (await bitcoinClient.getBlockchainInfo()).blocks;
      const chainSwap = {
        sendingData: {},
        receivingData: {
          symbol: 'BTC',
          timeoutBlockHeight: blockHeight + 1,
          transactionId: await bitcoinClient.sendToAddress(
            await bitcoinClient.getNewAddress(''),
            100_000,
            undefined,
            false,
            '',
          ),
        },
      } as unknown as ChainSwapInfo;

      await expect(
        fetcher.getChainSwapTransactions(chainSwap),
      ).resolves.toEqual({
        userLock: {
          transaction: {
            id: chainSwap.receivingData.transactionId,
            hex: await bitcoinClient.getRawTransaction(
              chainSwap.receivingData.transactionId!,
            ),
          },
          timeout: {
            eta: getUnixTime() + 600,
            blockHeight: chainSwap.receivingData.timeoutBlockHeight,
          },
        },
      });
    });

    test('should get user and server lockup transaction for chain swap', async () => {
      const chainSwap = {
        sendingData: {
          symbol: 'RBTC',
          timeoutBlockHeight: 1,
          transactionId: '0xNotFetched',
        },
        receivingData: {
          symbol: 'BTC',
          timeoutBlockHeight: 123,
          transactionId: await bitcoinClient.sendToAddress(
            await bitcoinClient.getNewAddress(''),
            100_000,
            undefined,
            false,
            '',
          ),
        },
      } as unknown as ChainSwapInfo;

      await expect(
        fetcher.getChainSwapTransactions(chainSwap),
      ).resolves.toEqual({
        serverLock: {
          transaction: {
            id: chainSwap.sendingData.transactionId,
          },
          timeout: {
            blockHeight: chainSwap.sendingData.timeoutBlockHeight,
          },
        },
        userLock: {
          transaction: {
            id: chainSwap.receivingData.transactionId,
            hex: await bitcoinClient.getRawTransaction(
              chainSwap.receivingData.transactionId!,
            ),
          },
          timeout: {
            blockHeight: chainSwap.receivingData.timeoutBlockHeight,
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

  describe('getSwapsSpentInInputs', () => {
    let transaction: Transaction;

    beforeAll(async () => {
      transaction = Transaction.fromHex(
        await bitcoinClient.getRawTransaction(
          await bitcoinClient.sendToAddress(
            await bitcoinClient.getNewAddress(''),
            100_000,
            undefined,
            false,
            '',
          ),
        ),
      );
    });

    test('should fetch swaps spent in inputs', async () => {
      SwapRepository.getSwaps = jest.fn().mockResolvedValue([{ id: 'swap' }]);
      ReverseSwapRepository.getReverseSwaps = jest
        .fn()
        .mockResolvedValue([{ id: 'reverse' }]);
      ChainSwapRepository.getChainSwapsByData = jest
        .fn()
        .mockResolvedValue([{ id: 'chain' }]);

      const swaps = await fetcher.getSwapsSpentInInputs(transaction);
      expect(swaps.swapsRefunded).toEqual([{ id: 'swap' }]);
      expect(swaps.chainSwapsSpent).toEqual([{ id: 'chain' }]);
      expect(swaps.reverseSwapsClaimed).toEqual([{ id: 'reverse' }]);

      expect(SwapRepository.getSwaps).toHaveBeenCalledTimes(1);
      expect(SwapRepository.getSwaps).toHaveBeenCalledWith({
        [Op.or]: transaction.ins.map((input) => ({
          lockupTransactionVout: input.index,
          lockupTransactionId: getHexString(reverseBuffer(input.hash)),
        })),
      });
      expect(ReverseSwapRepository.getReverseSwaps).toHaveBeenCalledTimes(1);
      expect(ReverseSwapRepository.getReverseSwaps).toHaveBeenCalledWith({
        [Op.or]: transaction.ins.map((input) => ({
          transactionVout: input.index,
          transactionId: getHexString(reverseBuffer(input.hash)),
        })),
      });
      expect(ChainSwapRepository.getChainSwapsByData).toHaveBeenCalledTimes(1);
      expect(ChainSwapRepository.getChainSwapsByData).toHaveBeenCalledWith({
        [Op.or]: transaction.ins.map((input) => ({
          transactionVout: input.index,
          transactionId: getHexString(reverseBuffer(input.hash)),
        })),
      });
    });

    test('should not fetch from database when the transaction has no inputs', async () => {
      transaction.ins = [];

      const swaps = await fetcher.getSwapsSpentInInputs(transaction);
      expect(swaps.swapsRefunded).toEqual([]);
      expect(swaps.chainSwapsSpent).toEqual([]);
      expect(swaps.reverseSwapsClaimed).toEqual([]);

      expect(SwapRepository.getSwaps).not.toHaveBeenCalled();
      expect(ReverseSwapRepository.getReverseSwaps).not.toHaveBeenCalled();
      expect(ChainSwapRepository.getChainSwapsByData).not.toHaveBeenCalled();
    });
  });

  describe('getSwapsFundedInOutputs', () => {
    let transaction: Transaction;

    const wallet = {
      encodeAddress: (outputScript) => ({
        new: address.fromOutputScript(outputScript, Networks.bitcoinRegtest),
        legacy: address.fromOutputScript(outputScript, Networks.bitcoinRegtest),
      }),
    } as Wallet;

    beforeAll(async () => {
      transaction = Transaction.fromHex(
        await bitcoinClient.getRawTransaction(
          await bitcoinClient.sendToAddress(
            await bitcoinClient.getNewAddress(''),
            100_000,
            undefined,
            false,
            '',
          ),
        ),
      );
    });

    test('should fetch swaps funded in outputs', async () => {
      SwapRepository.getSwaps = jest.fn().mockResolvedValue([{ id: 'swap' }]);
      ChainSwapRepository.getChainSwapsByData = jest
        .fn()
        .mockResolvedValue([{ id: 'chain' }]);

      const swaps = await fetcher.getSwapsFundedInOutputs(wallet, transaction);
      expect(swaps.swapLockups).toEqual([{ id: 'swap' }]);
      expect(swaps.chainSwapLockups).toEqual([{ id: 'chain' }]);

      const outputAddresses = transaction.outs.flatMap((output) => [
        address.fromOutputScript(output.script, Networks.bitcoinRegtest),
        address.fromOutputScript(output.script, Networks.bitcoinRegtest),
      ]);

      expect(SwapRepository.getSwaps).toHaveBeenCalledTimes(1);
      expect(SwapRepository.getSwaps).toHaveBeenCalledWith({
        lockupAddress: {
          [Op.in]: outputAddresses,
        },
      });
      expect(ChainSwapRepository.getChainSwapsByData).toHaveBeenCalledTimes(1);
      expect(ChainSwapRepository.getChainSwapsByData).toHaveBeenCalledWith({
        lockupAddress: {
          [Op.in]: outputAddresses,
        },
      });
    });

    test('should not fetch from database when transaction has no outputs', async () => {
      transaction.outs = [
        {
          value: 123,
          script: Buffer.alloc(0),
        },
      ];

      const swaps = await fetcher.getSwapsFundedInOutputs(wallet, transaction);
      expect(swaps.swapLockups).toEqual([]);
      expect(swaps.chainSwapLockups).toEqual([]);

      expect(SwapRepository.getSwaps).not.toHaveBeenCalled();
      expect(ChainSwapRepository.getChainSwapsByData).not.toHaveBeenCalled();
    });
  });

  describe('getTransactionHex', () => {
    test('should get transaction hex for chain clients', async () => {
      const tx = Transaction.fromHex(
        await bitcoinClient.getRawTransaction(
          await bitcoinClient.sendToAddress(
            await bitcoinClient.getNewAddress(''),
            100_000,
            undefined,
            false,
            '',
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

  describe('getTimeoutEta', () => {
    test.each`
      delta
      ${0}
      ${-1}
      ${-21}
    `(
      'should return undefined when timeout block height has been reached already',
      async ({ delta }) => {
        const blockHeight = (await bitcoinClient.getBlockchainInfo()).blocks;
        await expect(
          fetcher['getTimeoutEta'](currencies.get('BTC')!, blockHeight + delta),
        ).resolves.toBeUndefined();
      },
    );

    test('should calculate timeout ETA for timeouts that have not been reached yet', async () => {
      const blockHeight = (await bitcoinClient.getBlockchainInfo()).blocks;
      await expect(
        fetcher['getTimeoutEta'](currencies.get('BTC'), blockHeight + 2),
      ).resolves.toEqual(getUnixTime() + 1_200);
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
