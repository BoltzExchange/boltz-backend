import { Transaction } from '@scure/btc-signer';
import { Op } from 'sequelize';
import Logger from '../../../lib/Logger';
import { getHexBuffer, getHexString } from '../../../lib/Utils';
import type ArkClient from '../../../lib/chain/ArkClient';
import {
  CurrencyType,
  SwapType,
  SwapUpdateEvent,
} from '../../../lib/consts/Enums';
import ChainSwapRepository from '../../../lib/db/repositories/ChainSwapRepository';
import ReverseSwapRepository from '../../../lib/db/repositories/ReverseSwapRepository';
import SwapRepository from '../../../lib/db/repositories/SwapRepository';
import ArkNursery from '../../../lib/swap/ArkNursery';
import Errors from '../../../lib/swap/Errors';
import OverpaymentProtector from '../../../lib/swap/OverpaymentProtector';
import type { Currency } from '../../../lib/wallet/WalletManager';

describe('ArkNursery', () => {
  const nursery = new ArkNursery(
    Logger.disabledLogger,
    new OverpaymentProtector(Logger.disabledLogger),
  );

  const claimTx = Transaction.fromPSBT(
    Buffer.from(
      'cHNidP8BAF4CAAAAAWPfskEdPmcBOdo0T5mn3q9HIcvmAypSMUXfPS9jfDE4AAAAAAD/////ASsIAAAAAAAAIlEgle/dbLckDE8iEbi89OvrKt3XVYzl7dbfwijm16D5Hc0AAAAAAAEBKysIAAAAAAAAIlEg8cE8bmnhX3pxvBuj8KK34xSci670SjK/tB89js+1FEZBFDAA8Bt0qzp+R0dFcWOo+qcf/V/kc02tu6IhIzBtSO/OtyFGcJzqh5wD/F1rqTBJKrFl74LpQNfQkrRhwpg9xNhA8Bc/3s7XznAkhMHiaQZR1jr9blFjKO5TAxczFrrByAlyx7WDMR/PxWSxJE10n4NCD/dToiGGKksdlVMUYGo4GUEUjSlkVbD0B82qdfrXguY1RmOt4k3tTKKVftBjq9Hrowi3IUZwnOqHnAP8XWupMEkqsWXvgulA19CStGHCmD3E2ECpF8c1EKlH4XJQN6iAHEzjA+s7SwD0pevfk/jjjouAAJaTXKWoB5bPghqzfnvqjrqVTKtxs5vo1GXSyuuKF/rtghXAUJKbdMGgSVS3i0tgNel6XgeKWg8o7JbVR7/ums6AOsDsoe3NA/skK3hvHck89R0toNx5H6OnbWhDseKnxjxh7MmMVDr5u9QcsOG72qzIKma9q2uRZN6/kzCPWoP57x3V6okLO9SOLLr71CkV3VzmJs1yRfQcr+pXgCkIz9D3nuNdqRQb35P0qMoenROI9+jSTFfvo835C4dpIDAA8Bt0qzp+R0dFcWOo+qcf/V/kc02tu6IhIzBtSO/OrSCNKWRVsPQHzap1+teC5jVGY63iTe1MopV+0GOr0eujCKzADP3/AGNvbmRpdGlvbiIBIHQRY1k+sfq4E+aYbfuyvZLZHHb49eLwTKXcZ+gXDh8ICv3/AHRhcHRyZWX9zgEGAcBcqRQb35P0qMoenROI9+jSTFfvo835C4dpIDAA8Bt0qzp+R0dFcWOo+qcf/V/kc02tu6IhIzBtSO/OrSCNKWRVsPQHzap1+teC5jVGY63iTe1MopV+0GOr0eujCKwBwGYgif9h5mAC+0zo4VcCQlqbx7zmUMSM+i7h4czTuukE1KmtIDAA8Bt0qzp+R0dFcWOo+qcf/V/kc02tu6IhIzBtSO/OrSCNKWRVsPQHzap1+teC5jVGY63iTe1MopV+0GOr0eujCKwBwEoDgLsAsXUgif9h5mAC+0zo4VcCQlqbx7zmUMSM+i7h4czTuukE1KmtII0pZFWw9AfNqnX614LmNUZjreJN7UyilX7QY6vR66MIrAHAP6kUG9+T9KjKHp0TiPfo0kxX76PN+QuHaQKGALJ1IDAA8Bt0qzp+R0dFcWOo+qcf/V/kc02tu6IhIzBtSO/OrAHASQIGAbJ1IIn/YeZgAvtM6OFXAkJam8e85lDEjPou4eHM07rpBNSprSAwAPAbdKs6fkdHRXFjqPqnH/1f5HNNrbuiISMwbUjvzqwBwCcCBgGydSCJ/2HmYAL7TOjhVwJCWpvHvOZQxIz6LuHhzNO66QTUqawAAA==',
      'base64',
    ),
  );
  const claimTxPreimage = getHexBuffer(
    '741163593eb1fab813e6986dfbb2bd92d91c76f8f5e2f04ca5dc67e8170e1f08',
  );

  describe('checkClaims', () => {
    test('should check reverse swap claims', async () => {
      const arkClient = {
        getTx: jest.fn().mockResolvedValue(claimTx),
        subscription: {
          unsubscribeAddress: jest.fn(),
        },
      };

      const swap = {
        id: 'rev',
        lockupAddress: 'ark_address',
      };
      ReverseSwapRepository.getReverseSwap = jest.fn().mockResolvedValue(swap);
      ChainSwapRepository.getChainSwap = jest.fn().mockResolvedValue(null);

      jest.spyOn(nursery, 'emit');

      await nursery['checkClaims'](
        arkClient as unknown as ArkClient,
        {
          spentBy: 'txid',
        } as unknown as any,
      );

      expect(arkClient.getTx).toHaveBeenCalledWith('txid');
      expect(ReverseSwapRepository.getReverseSwap).toHaveBeenCalledWith({
        status: {
          [Op.in]: [
            SwapUpdateEvent.TransactionMempool,
            SwapUpdateEvent.TransactionConfirmed,
          ],
        },
        preimageHash:
          '12882524ddbee7d099e2bf6dc2f32d320dfc0a01939bf2fd2cef181f27f5e26c',
      });
      expect(ChainSwapRepository.getChainSwap).toHaveBeenCalledWith({
        status: {
          [Op.in]: [
            SwapUpdateEvent.TransactionServerMempool,
            SwapUpdateEvent.TransactionServerConfirmed,
            SwapUpdateEvent.TransactionRefunded,
          ],
        },
        preimageHash:
          '12882524ddbee7d099e2bf6dc2f32d320dfc0a01939bf2fd2cef181f27f5e26c',
      });
      expect(nursery.emit).toHaveBeenCalledWith('reverseSwap.claimed', {
        reverseSwap: swap,
        preimage: claimTxPreimage,
      });
      expect(arkClient.subscription.unsubscribeAddress).toHaveBeenCalledWith(
        'ark_address',
      );
    });

    test('should check chain swap claims', async () => {
      const arkClient = {
        getTx: jest.fn().mockResolvedValue(claimTx),
        subscription: {
          unsubscribeAddress: jest.fn(),
        },
      };

      const swap = {
        id: 'chain',
        sendingData: {
          lockupAddress: 'ark_sending_address',
        },
      };
      ReverseSwapRepository.getReverseSwap = jest.fn().mockResolvedValue(null);
      ChainSwapRepository.getChainSwap = jest.fn().mockResolvedValue(swap);

      jest.spyOn(nursery, 'emit');

      await nursery['checkClaims'](
        arkClient as unknown as ArkClient,
        {
          spentBy: 'txid',
        } as unknown as any,
      );

      expect(arkClient.getTx).toHaveBeenCalledWith('txid');
      expect(ChainSwapRepository.getChainSwap).toHaveBeenCalledWith({
        status: {
          [Op.in]: [
            SwapUpdateEvent.TransactionServerMempool,
            SwapUpdateEvent.TransactionServerConfirmed,
            SwapUpdateEvent.TransactionRefunded,
          ],
        },
        preimageHash:
          '12882524ddbee7d099e2bf6dc2f32d320dfc0a01939bf2fd2cef181f27f5e26c',
      });
      expect(nursery.emit).toHaveBeenCalledWith('chainSwap.claimed', {
        swap,
        preimage: claimTxPreimage,
      });
      expect(arkClient.subscription.unsubscribeAddress).toHaveBeenCalledWith(
        'ark_sending_address',
      );
    });
  });

  describe('extractPreimages', () => {
    test('should extract preimage from claim transaction', () => {
      const preimages = ArkNursery['extractPreimages'](claimTx);
      expect(preimages.length).toEqual(1);

      const preimage = preimages[0];
      expect(preimage.length).toEqual(32);
      expect(getHexString(preimage)).toEqual(getHexString(claimTxPreimage));
    });
  });

  describe('isPreimage', () => {
    test('should identify preimage field', () => {
      const preimageField = {
        type: 0,
        key: new Uint8Array(Buffer.from('condition', 'utf-8')),
      };

      expect(ArkNursery['isPreimage'](preimageField)).toEqual(true);
    });

    test('should reject non-preimage field', () => {
      const nonPreimageField = {
        type: 0,
        key: new Uint8Array(Buffer.from('other', 'utf-8')),
      };

      expect(ArkNursery['isPreimage'](nonPreimageField)).toEqual(false);
    });
  });

  describe('init', () => {
    test('should bind events for Ark currencies', () => {
      const mockArkNode = {
        on: jest.fn(),
      };

      const currencies: Currency[] = [
        {
          symbol: 'ARK',
          type: CurrencyType.Ark,
          arkNode: mockArkNode as unknown as ArkClient,
        } as Currency,
        {
          symbol: 'BTC',
          type: CurrencyType.BitcoinLike,
        } as Currency,
      ];

      nursery.init(currencies);

      expect(mockArkNode.on).toHaveBeenCalledTimes(3);
      expect(mockArkNode.on).toHaveBeenCalledWith(
        'vhtlc.created',
        expect.any(Function),
      );
      expect(mockArkNode.on).toHaveBeenCalledWith(
        'vhtlc.spent',
        expect.any(Function),
      );
      expect(mockArkNode.on).toHaveBeenCalledWith(
        'block',
        expect.any(Function),
      );
    });
  });

  describe('checkSubmarineLockup', () => {
    const mockArkNode = {
      symbol: 'ARK',
      subscription: {
        unsubscribeAddress: jest.fn(),
      },
    } as unknown as ArkClient;

    beforeEach(() => {
      jest.clearAllMocks();
    });

    test('should return early when no swap is found', async () => {
      SwapRepository.getSwap = jest.fn().mockResolvedValue(null);

      await nursery['checkSubmarineLockup'](mockArkNode, {
        address: 'ark_address',
        txId: 'txid',
        vout: 0,
        amount: 100000,
      } as any);

      expect(SwapRepository.getSwap).toHaveBeenCalledWith({
        status: {
          [Op.in]: [SwapUpdateEvent.SwapCreated, SwapUpdateEvent.InvoiceSet],
        },
        lockupAddress: 'ark_address',
      });
      expect(
        mockArkNode.subscription.unsubscribeAddress,
      ).not.toHaveBeenCalled();
    });

    test('should emit failure for insufficient amount', async () => {
      const swap = {
        id: 'swap123',
        type: SwapType.Submarine,
        expectedAmount: 100000,
      };

      SwapRepository.getSwap = jest.fn().mockResolvedValue(swap);

      let emittedEvent: any = null;
      nursery.once('swap.lockup.failed', (data) => {
        emittedEvent = data;
      });

      await nursery['checkSubmarineLockup'](mockArkNode, {
        address: 'ark_address',
        txId: 'txid',
        vout: 0,
        amount: 50000,
      } as any);

      expect(mockArkNode.subscription.unsubscribeAddress).toHaveBeenCalledWith(
        'ark_address',
      );
      expect(emittedEvent).not.toBeNull();
      expect(emittedEvent.swap).toEqual(swap);
      expect(emittedEvent.reason).toEqual(
        Errors.INSUFFICIENT_AMOUNT(50000, 100000).message,
      );
    });

    test('should emit failure for unacceptable overpayment', async () => {
      const swap = {
        id: 'swap123',
        type: SwapType.Submarine,
        expectedAmount: 100000,
      };

      SwapRepository.getSwap = jest.fn().mockResolvedValue(swap);

      const protector = new OverpaymentProtector(Logger.disabledLogger, {
        exemptAmount: 1000,
        maxPercentage: 1,
      });
      const testNursery = new ArkNursery(Logger.disabledLogger, protector);

      let emittedEvent: any = null;
      testNursery.once('swap.lockup.failed', (data) => {
        emittedEvent = data;
      });

      await testNursery['checkSubmarineLockup'](mockArkNode, {
        address: 'ark_address',
        txId: 'txid',
        vout: 0,
        amount: 150000,
      } as any);

      expect(mockArkNode.subscription.unsubscribeAddress).toHaveBeenCalledWith(
        'ark_address',
      );
      expect(emittedEvent).not.toBeNull();
      expect(emittedEvent.swap).toEqual(swap);
      expect(emittedEvent.reason).toEqual(
        Errors.OVERPAID_AMOUNT(150000, 100000).message,
      );
    });

    test('should emit success for valid lockup', async () => {
      const swap = {
        id: 'swap123',
        type: SwapType.Submarine,
        expectedAmount: 100000,
      };

      const updatedSwap = {
        ...swap,
        lockupTransactionId: 'txid',
        onchainAmount: 100000,
      };

      SwapRepository.getSwap = jest.fn().mockResolvedValue(swap);
      SwapRepository.setLockupTransaction = jest
        .fn()
        .mockResolvedValue(updatedSwap);

      let emittedEvent: any = null;
      nursery.once('swap.lockup', (data) => {
        emittedEvent = data;
      });

      await nursery['checkSubmarineLockup'](mockArkNode, {
        address: 'ark_address',
        txId: 'txid',
        vout: 0,
        amount: 100000,
      } as any);

      expect(mockArkNode.subscription.unsubscribeAddress).toHaveBeenCalledWith(
        'ark_address',
      );
      expect(SwapRepository.setLockupTransaction).toHaveBeenCalledWith(
        swap,
        'txid',
        100000,
        true,
        0,
      );
      expect(emittedEvent).not.toBeNull();
      expect(emittedEvent.swap).toEqual(updatedSwap);
      expect(emittedEvent.lockupTransactionId).toEqual('txid');
    });

    test('should accept slight overpayment within limits', async () => {
      const swap = {
        id: 'swap123',
        type: SwapType.Submarine,
        expectedAmount: 100000,
      };

      const updatedSwap = {
        ...swap,
        lockupTransactionId: 'txid',
        onchainAmount: 100500,
      };

      SwapRepository.getSwap = jest.fn().mockResolvedValue(swap);
      SwapRepository.setLockupTransaction = jest
        .fn()
        .mockResolvedValue(updatedSwap);

      let emittedEvent: any = null;
      nursery.once('swap.lockup', (data) => {
        emittedEvent = data;
      });

      await nursery['checkSubmarineLockup'](mockArkNode, {
        address: 'ark_address',
        txId: 'txid',
        vout: 0,
        amount: 100500,
      } as any);

      expect(emittedEvent).not.toBeNull();
      expect(emittedEvent.swap).toEqual(updatedSwap);
      expect(emittedEvent.lockupTransactionId).toEqual('txid');
    });
  });

  describe('checkChainSwapLockup', () => {
    const mockArkNode = {
      symbol: 'ARK',
      subscription: {
        unsubscribeAddress: jest.fn(),
      },
    } as unknown as ArkClient;

    beforeEach(() => {
      jest.clearAllMocks();
    });

    test('should return early when no swap is found', async () => {
      ChainSwapRepository.getChainSwapByData = jest
        .fn()
        .mockResolvedValue(null);

      await nursery['checkChainSwapLockup'](mockArkNode, {
        address: 'ark_address',
        txId: 'txid',
        vout: 0,
        amount: 100000,
      } as any);

      expect(ChainSwapRepository.getChainSwapByData).toHaveBeenCalledWith(
        {
          lockupAddress: 'ark_address',
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
      expect(
        mockArkNode.subscription.unsubscribeAddress,
      ).not.toHaveBeenCalled();
    });

    test('should emit failure for insufficient amount', async () => {
      const swap = {
        id: 'chain123',
        type: SwapType.Chain,
        receivingData: {
          symbol: mockArkNode.symbol,
          expectedAmount: 100000,
        },
      };

      ChainSwapRepository.getChainSwapByData = jest
        .fn()
        .mockResolvedValue(swap);

      let emittedEvent: any = null;
      nursery.once('chainSwap.lockup.failed', (data) => {
        emittedEvent = data;
      });

      await nursery['checkChainSwapLockup'](mockArkNode, {
        address: 'ark_address',
        txId: 'txid',
        vout: 0,
        amount: 50000,
      } as any);

      expect(mockArkNode.subscription.unsubscribeAddress).toHaveBeenCalledWith(
        'ark_address',
      );
      expect(emittedEvent).not.toBeNull();
      expect(emittedEvent.swap).toEqual(swap);
      expect(emittedEvent.reason).toEqual(
        Errors.INSUFFICIENT_AMOUNT(50000, 100000).message,
      );
    });

    test('should emit failure for unacceptable overpayment', async () => {
      const swap = {
        id: 'chain123',
        type: SwapType.Chain,
        receivingData: {
          symbol: mockArkNode.symbol,
          expectedAmount: 100000,
        },
      };

      ChainSwapRepository.getChainSwapByData = jest
        .fn()
        .mockResolvedValue(swap);

      const protector = new OverpaymentProtector(Logger.disabledLogger, {
        exemptAmount: 1000,
        maxPercentage: 1,
      });
      const testNursery = new ArkNursery(Logger.disabledLogger, protector);

      let emittedEvent: any = null;
      testNursery.once('chainSwap.lockup.failed', (data) => {
        emittedEvent = data;
      });

      await testNursery['checkChainSwapLockup'](mockArkNode, {
        address: 'ark_address',
        txId: 'txid',
        vout: 0,
        amount: 150000,
      } as any);

      expect(mockArkNode.subscription.unsubscribeAddress).toHaveBeenCalledWith(
        'ark_address',
      );
      expect(emittedEvent).not.toBeNull();
      expect(emittedEvent.swap).toEqual(swap);
      expect(emittedEvent.reason).toEqual(
        Errors.OVERPAID_AMOUNT(150000, 100000).message,
      );
    });

    test('should emit success for valid lockup', async () => {
      const swap = {
        id: 'chain123',
        type: SwapType.Chain,
        receivingData: {
          symbol: mockArkNode.symbol,
          expectedAmount: 100000,
        },
      };

      const updatedSwap = {
        ...swap,
        receivingData: {
          ...swap.receivingData,
          lockupTransactionId: 'txid',
          amount: 100000,
        },
      };

      ChainSwapRepository.getChainSwapByData = jest
        .fn()
        .mockResolvedValue(swap);
      ChainSwapRepository.setUserLockupTransaction = jest
        .fn()
        .mockResolvedValue(updatedSwap);

      let emittedEvent: any = null;
      nursery.once('chainSwap.lockup', (data) => {
        emittedEvent = data;
      });

      await nursery['checkChainSwapLockup'](mockArkNode, {
        address: 'ark_address',
        txId: 'txid',
        vout: 0,
        amount: 100000,
      } as any);

      expect(mockArkNode.subscription.unsubscribeAddress).toHaveBeenCalledWith(
        'ark_address',
      );
      expect(ChainSwapRepository.setUserLockupTransaction).toHaveBeenCalledWith(
        swap,
        'txid',
        100000,
        true,
        0,
      );
      expect(emittedEvent).not.toBeNull();
      expect(emittedEvent.swap).toEqual(updatedSwap);
      expect(emittedEvent.lockupTransactionId).toEqual('txid');
    });
  });

  describe('checkExpiredSwaps', () => {
    const mockArkNode = {
      symbol: 'ARK',
      subscription: {
        unsubscribeAddress: jest.fn(),
      },
    } as unknown as ArkClient;

    beforeEach(() => {
      jest.clearAllMocks();
    });

    test('should emit expired event for Ark reverse swaps', async () => {
      const expiredSwap = {
        id: 'rev123',
        type: SwapType.ReverseSubmarine,
        pair: 'ARK/BTC',
        orderSide: 0,
        lockupAddress: 'ark_address',
        chainCurrency: 'ARK',
      };

      ReverseSwapRepository.getReverseSwapsExpirable = jest
        .fn()
        .mockResolvedValue([expiredSwap]);
      ChainSwapRepository.getChainSwapsExpirable = jest
        .fn()
        .mockResolvedValue([]);

      let emittedSwap: any = null;
      nursery.once('reverseSwap.expired', (swap) => {
        emittedSwap = swap;
      });

      await nursery['checkExpiredSwaps'](mockArkNode, 1234567);

      expect(
        ReverseSwapRepository.getReverseSwapsExpirable,
      ).toHaveBeenCalledWith(1234567);
      expect(ChainSwapRepository.getChainSwapsExpirable).toHaveBeenCalledWith(
        ['ARK'],
        1234567,
      );
      expect(mockArkNode.subscription.unsubscribeAddress).toHaveBeenCalledWith(
        'ark_address',
      );
      expect(emittedSwap).toEqual(expiredSwap);
    });

    test('should not emit for non-Ark reverse swaps', async () => {
      const expiredSwap = {
        id: 'rev123',
        type: SwapType.ReverseSubmarine,
        pair: 'BTC/BTC',
        orderSide: 0,
        lockupAddress: 'btc_address',
        chainCurrency: 'BTC',
      };

      ReverseSwapRepository.getReverseSwapsExpirable = jest
        .fn()
        .mockResolvedValue([expiredSwap]);
      ChainSwapRepository.getChainSwapsExpirable = jest
        .fn()
        .mockResolvedValue([]);

      let emittedSwap: any = null;
      nursery.once('reverseSwap.expired', (swap) => {
        emittedSwap = swap;
      });

      await nursery['checkExpiredSwaps'](mockArkNode, 1234567);

      expect(
        mockArkNode.subscription.unsubscribeAddress,
      ).not.toHaveBeenCalled();
      expect(emittedSwap).toBeNull();
    });

    test('should handle multiple expired swaps', async () => {
      const expiredSwaps = [
        {
          id: 'rev1',
          type: SwapType.ReverseSubmarine,
          pair: 'ARK/BTC',
          orderSide: 0,
          lockupAddress: 'ark_address1',
          chainCurrency: 'ARK',
        },
        {
          id: 'rev2',
          type: SwapType.ReverseSubmarine,
          pair: 'ARK/BTC',
          orderSide: 0,
          lockupAddress: 'ark_address2',
          chainCurrency: 'ARK',
        },
        {
          id: 'rev3',
          type: SwapType.ReverseSubmarine,
          pair: 'BTC/BTC',
          orderSide: 0,
          lockupAddress: 'btc_address',
          chainCurrency: 'BTC',
        },
      ];

      ReverseSwapRepository.getReverseSwapsExpirable = jest
        .fn()
        .mockResolvedValue(expiredSwaps);
      ChainSwapRepository.getChainSwapsExpirable = jest
        .fn()
        .mockResolvedValue([]);

      const emittedSwaps: any[] = [];
      nursery.on('reverseSwap.expired', (swap) => {
        emittedSwaps.push(swap);
      });

      await nursery['checkExpiredSwaps'](mockArkNode, 1234567);

      expect(mockArkNode.subscription.unsubscribeAddress).toHaveBeenCalledTimes(
        2,
      );
      expect(mockArkNode.subscription.unsubscribeAddress).toHaveBeenCalledWith(
        'ark_address1',
      );
      expect(mockArkNode.subscription.unsubscribeAddress).toHaveBeenCalledWith(
        'ark_address2',
      );
      expect(emittedSwaps.length).toEqual(2);
      expect(emittedSwaps[0]).toEqual(expiredSwaps[0]);
      expect(emittedSwaps[1]).toEqual(expiredSwaps[1]);
    });

    test('should handle empty expired swaps array', async () => {
      ReverseSwapRepository.getReverseSwapsExpirable = jest
        .fn()
        .mockResolvedValue([]);
      ChainSwapRepository.getChainSwapsExpirable = jest
        .fn()
        .mockResolvedValue([]);

      await nursery['checkExpiredSwaps'](mockArkNode, 1234567);

      expect(
        mockArkNode.subscription.unsubscribeAddress,
      ).not.toHaveBeenCalled();
    });

    test('should emit expired event for Ark chain swaps', async () => {
      const expiredSwap = {
        id: 'chain123',
        type: SwapType.Chain,
        pair: 'ARK/BTC',
        orderSide: 0,
        sendingData: {
          symbol: 'ARK',
          lockupAddress: 'ark_address',
        },
      };

      ReverseSwapRepository.getReverseSwapsExpirable = jest
        .fn()
        .mockResolvedValue([]);
      ChainSwapRepository.getChainSwapsExpirable = jest
        .fn()
        .mockResolvedValue([expiredSwap]);

      let emittedSwap: any = null;
      nursery.once('chainSwap.expired', (swap) => {
        emittedSwap = swap;
      });

      await nursery['checkExpiredSwaps'](mockArkNode, 1234567);

      expect(ChainSwapRepository.getChainSwapsExpirable).toHaveBeenCalledWith(
        ['ARK'],
        1234567,
      );
      expect(mockArkNode.subscription.unsubscribeAddress).toHaveBeenCalledWith(
        'ark_address',
      );
      expect(emittedSwap).toEqual(expiredSwap);
    });
  });

  describe('checkClaims - no swap found', () => {
    test('should continue when no reverse swap is found', async () => {
      const isolatedNursery = new ArkNursery(
        Logger.disabledLogger,
        new OverpaymentProtector(Logger.disabledLogger),
      );

      const arkClient = {
        getTx: jest.fn().mockResolvedValue(claimTx),
        subscription: {
          unsubscribeAddress: jest.fn(),
        },
      };

      ReverseSwapRepository.getReverseSwap = jest.fn().mockResolvedValue(null);
      ChainSwapRepository.getChainSwap = jest.fn().mockResolvedValue(null);

      jest.spyOn(isolatedNursery, 'emit');

      await isolatedNursery['checkClaims'](
        arkClient as unknown as ArkClient,
        {
          spentBy: 'txid',
        } as unknown as any,
      );

      expect(arkClient.getTx).toHaveBeenCalledWith('txid');
      expect(arkClient.subscription.unsubscribeAddress).not.toHaveBeenCalled();
      expect(isolatedNursery.emit).not.toHaveBeenCalled();
    });
  });
});
