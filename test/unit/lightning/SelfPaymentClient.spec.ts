import { randomBytes } from 'crypto';
import Logger from '../../../lib/Logger';
import { getHexBuffer, getHexString } from '../../../lib/Utils';
import {
  OrderSide,
  SwapType,
  SwapUpdateEvent,
} from '../../../lib/consts/Enums';
import type ReverseSwap from '../../../lib/db/models/ReverseSwap';
import { NodeType } from '../../../lib/db/models/ReverseSwap';
import type Swap from '../../../lib/db/models/Swap';
import RefundTransactionRepository from '../../../lib/db/repositories/RefundTransactionRepository';
import ReverseSwapRepository from '../../../lib/db/repositories/ReverseSwapRepository';
import SwapRepository from '../../../lib/db/repositories/SwapRepository';
import { satToMsat } from '../../../lib/lightning/ChannelUtils';
import {
  HtlcState,
  InvoiceState,
} from '../../../lib/lightning/LightningClient';
import PendingPaymentTracker from '../../../lib/lightning/PendingPaymentTracker';
import SelfPaymentClient from '../../../lib/lightning/SelfPaymentClient';
import LightningNursery from '../../../lib/swap/LightningNursery';
import type SwapNursery from '../../../lib/swap/SwapNursery';

jest.mock('../../../lib/db/repositories/SwapRepository');
jest.mock('../../../lib/db/repositories/ReverseSwapRepository');

describe('SelfPaymentClient', () => {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-expect-error
  PendingPaymentTracker.raceTimeout = 1;

  LightningNursery.cancelReverseInvoices = jest.fn();

  let nursery: SwapNursery;
  let client: SelfPaymentClient;

  beforeEach(() => {
    jest.clearAllMocks();
    nursery = {
      on: jest.fn(),
      removeListener: jest.fn(),
      currencies: new Map([
        [
          'BTC',
          {
            clnClient: {
              type: NodeType.CLN,
              isConnected: jest.fn().mockReturnValue(true),
            },
          },
        ],
      ]),
    } as unknown as SwapNursery;
    client = new SelfPaymentClient(Logger.disabledLogger, nursery);
  });

  describe('handleSelfPayment', () => {
    const preimageHash = getHexString(randomBytes(32));
    const preimage = getHexString(randomBytes(32));

    const mockSwap = {
      id: 'sub',
      type: SwapType.Submarine,
      preimageHash,
      invoice: 'invoice',
    };

    const mockDecoded = {
      minFinalCltv: 40,
    };

    test('should return isSelf: false when payments array is not empty', async () => {
      const mockPayments = [{ id: 'payment1' }];

      const getReverseSwapSpy = jest.spyOn(client as any, 'getReverseSwap');

      await expect(
        client.handleSelfPayment(
          mockSwap as any,
          mockDecoded as any,
          100,
          mockPayments as any,
        ),
      ).resolves.toEqual({
        isSelf: false,
        result: undefined,
      });

      expect(getReverseSwapSpy).not.toHaveBeenCalled();
    });

    test.each([[null], [undefined]])(
      'should return isSelf: false when reverse swap is %s',
      async (reverseSwapValue) => {
        client['getReverseSwap'] = jest
          .fn()
          .mockResolvedValue(reverseSwapValue);

        const result = await client.handleSelfPayment(
          mockSwap as any,
          mockDecoded as any,
          100,
          [],
        );

        expect(result).toEqual({
          isSelf: false,
          result: undefined,
        });

        expect(client['getReverseSwap']).toHaveBeenCalledTimes(1);
        expect(client['getReverseSwap']).toHaveBeenCalledWith(preimageHash);
      },
    );

    test('should throw error when swap invoice does not match reverse swap invoice', async () => {
      const mockSwapWithInvoice = {
        ...mockSwap,
        invoice: 'swap',
      };

      const mockReverseSwap = {
        id: 'rev',
        preimageHash,
        status: SwapUpdateEvent.SwapCreated,
        invoice: 'reverse',
      };

      client['getReverseSwap'] = jest.fn().mockResolvedValue(mockReverseSwap);

      await expect(
        client.handleSelfPayment(
          mockSwapWithInvoice as any,
          mockDecoded as any,
          100,
          [],
        ),
      ).rejects.toThrow('invoice mismatch');

      expect(client['getReverseSwap']).toHaveBeenCalledTimes(1);
      expect(client['getReverseSwap']).toHaveBeenCalledWith(preimageHash);
    });

    test.each([
      [40, 40],
      [39, 40],
      [30, 40],
      [0, 40],
    ])(
      'should throw error when CLTV limit (%d) is too small for minFinalCltv (%d)',
      async (cltvLimit, minFinalCltv) => {
        const mockReverseSwap = {
          id: 'rev',
          preimageHash,
          invoice: mockSwap.invoice,
          status: SwapUpdateEvent.SwapCreated,
        };

        const mockDecodedWithCltv = {
          ...mockDecoded,
          minFinalCltv,
        };

        client['getReverseSwap'] = jest.fn().mockResolvedValue(mockReverseSwap);

        await expect(
          client.handleSelfPayment(
            mockSwap as any,
            mockDecodedWithCltv as any,
            cltvLimit,
            [],
          ),
        ).rejects.toThrow('CLTV limit too small');

        expect(client['getReverseSwap']).toHaveBeenCalledTimes(1);
      },
    );

    test('should throw error when invoice is expired', async () => {
      const mockReverseSwap = {
        id: 'rev',
        preimageHash,
        invoice: mockSwap.invoice,
        status: SwapUpdateEvent.SwapCreated,
      };

      client['getReverseSwap'] = jest.fn().mockResolvedValue(mockReverseSwap);

      await expect(
        client.handleSelfPayment(
          mockSwap as any,
          {
            ...mockDecoded,
            isExpired: true,
          } as any,
          100,
          [],
        ),
      ).rejects.toThrow('invoice expired');

      expect(client['getReverseSwap']).toHaveBeenCalledTimes(1);
    });

    test('should emit htlc.accepted when reverse swap status is SwapCreated', async () => {
      const mockReverseSwap = {
        preimageHash,
        id: 'rev',
        pair: 'L-BTC/BTC',
        orderSide: OrderSide.BUY,
        invoice: mockSwap.invoice,
        status: SwapUpdateEvent.SwapCreated,
      };

      client['getReverseSwap'] = jest.fn().mockResolvedValue(mockReverseSwap);
      const emitSpy = jest.spyOn(client, 'emit');

      await expect(
        client.handleSelfPayment(mockSwap as any, mockDecoded as any, 100, []),
      ).resolves.toEqual({
        isSelf: true,
        result: undefined,
      });

      expect(emitSpy).toHaveBeenCalledTimes(1);
      expect(emitSpy).toHaveBeenCalledWith(
        'htlc.accepted',
        mockReverseSwap.invoice,
      );

      expect(LightningNursery.cancelReverseInvoices).toHaveBeenCalledTimes(1);
      expect(LightningNursery.cancelReverseInvoices).toHaveBeenCalledWith(
        nursery.currencies.get('BTC')!.clnClient,
        mockReverseSwap,
        false,
      );
    });

    test('should not emit htlc.accepted when reverse swap status is not SwapCreated', async () => {
      const mockReverseSwap = {
        preimageHash,
        id: 'rev',
        pair: 'L-BTC/BTC',
        orderSide: OrderSide.BUY,
        invoice: mockSwap.invoice,
        status: SwapUpdateEvent.InvoiceSettled,
      };

      client['getReverseSwap'] = jest.fn().mockResolvedValue(mockReverseSwap);
      const emitSpy = jest.spyOn(client, 'emit');

      await expect(
        client.handleSelfPayment(mockSwap as any, mockDecoded as any, 100, []),
      ).resolves.toEqual({
        isSelf: true,
        result: undefined,
      });
      expect(emitSpy).not.toHaveBeenCalled();
    });

    test('should return payment result when reverse swap has preimage', async () => {
      const mockReverseSwap = {
        preimage,
        preimageHash,
        id: 'rev',
        invoice: mockSwap.invoice,
        status: SwapUpdateEvent.InvoiceSettled,
      };

      client['getReverseSwap'] = jest.fn().mockResolvedValue(mockReverseSwap);

      const result = await client.handleSelfPayment(
        mockSwap as any,
        mockDecoded as any,
        100,
        [],
      );

      expect(result).toEqual({
        isSelf: true,
        result: {
          feeMsat: 0,
          preimage: getHexBuffer(preimage),
        },
      });
    });

    test.each([[null], [undefined]])(
      'should return undefined result when reverse swap preimage is %s',
      async (preimageValue) => {
        const mockReverseSwap = {
          id: 'rev',
          preimageHash,
          pair: 'L-BTC/BTC',
          orderSide: OrderSide.BUY,
          status: SwapUpdateEvent.SwapCreated,
          preimage: preimageValue,
          invoice: mockSwap.invoice,
        };

        client['getReverseSwap'] = jest.fn().mockResolvedValue(mockReverseSwap);

        const result = await client.handleSelfPayment(
          mockSwap as any,
          mockDecoded as any,
          100,
          [],
        );

        expect(result).toEqual({
          isSelf: true,
          result: undefined,
        });
      },
    );

    test('should use async lock to prevent concurrent execution', async () => {
      const mockReverseSwap = {
        id: 'rev',
        preimageHash,
        pair: 'L-BTC/BTC',
        orderSide: OrderSide.BUY,
        status: SwapUpdateEvent.SwapCreated,
        invoice: mockSwap.invoice,
      };

      let resolveFirst: () => void;
      let resolveSecond: () => void;

      const firstPromise = new Promise<void>((resolve) => {
        resolveFirst = resolve;
      });
      const secondPromise = new Promise<void>((resolve) => {
        resolveSecond = resolve;
      });

      let callCount = 0;
      client['getReverseSwap'] = jest.fn().mockImplementation(async () => {
        callCount++;
        if (callCount === 1) {
          await firstPromise;
        } else {
          await secondPromise;
        }
        return mockReverseSwap;
      });

      // Start two concurrent calls
      const promise1 = client.handleSelfPayment(
        mockSwap as any,
        mockDecoded as any,
        100,
        [],
      );
      const promise2 = client.handleSelfPayment(
        mockSwap as any,
        mockDecoded as any,
        100,
        [],
      );

      // Verify only first call started
      expect(callCount).toBe(1);

      // Resolve first call
      resolveFirst!();
      await promise1;

      // Now second call should start
      expect(callCount).toBe(2);

      // Resolve second call
      resolveSecond!();
      await promise2;
    });
  });

  describe('lookupHoldInvoice', () => {
    const preimageHash = randomBytes(32);

    const invoiceAmount = 100_000;
    const invoiceAmountMsat = satToMsat(invoiceAmount);

    test.each`
      swapStatus                                 | expectedState            | expectedHtlcs
      ${SwapUpdateEvent.SwapCreated}             | ${InvoiceState.Open}     | ${[]}
      ${SwapUpdateEvent.TransactionFailed}       | ${InvoiceState.Open}     | ${[]}
      ${SwapUpdateEvent.InvoicePending}          | ${InvoiceState.Accepted} | ${[{ state: HtlcState.Accepted, valueMsat: invoiceAmountMsat }]}
      ${SwapUpdateEvent.InvoicePaid}             | ${InvoiceState.Settled}  | ${[{ state: HtlcState.Settled, valueMsat: invoiceAmountMsat }]}
      ${SwapUpdateEvent.TransactionClaimPending} | ${InvoiceState.Settled}  | ${[{ state: HtlcState.Settled, valueMsat: invoiceAmountMsat }]}
      ${SwapUpdateEvent.TransactionClaimed}      | ${InvoiceState.Settled}  | ${[{ state: HtlcState.Settled, valueMsat: invoiceAmountMsat }]}
      ${undefined}                               | ${InvoiceState.Open}     | ${[]}
    `(
      'should return $expectedState and correct HTLCs when swap status is $swapStatus',
      async ({ swapStatus, expectedState, expectedHtlcs }) => {
        const mockSwap = {
          id: 'sub',
          preimageHash,
          status: swapStatus,
          invoiceAmount,
        };

        client['lookupSwapsForPreimageHash'] = jest
          .fn()
          .mockResolvedValue({ swap: mockSwap });

        const result = await client.lookupHoldInvoice(preimageHash);

        expect(client['lookupSwapsForPreimageHash']).toHaveBeenCalledTimes(1);
        expect(client['lookupSwapsForPreimageHash']).toHaveBeenCalledWith(
          getHexString(preimageHash),
        );
        expect(result).toEqual({ state: expectedState, htlcs: expectedHtlcs });
      },
    );

    test('should bubble up error when lookupSwapsForPreimageHash throws', async () => {
      const msg = 'fail';
      client['lookupSwapsForPreimageHash'] = jest
        .fn()
        .mockRejectedValue(new Error(msg));

      await expect(client.lookupHoldInvoice(preimageHash)).rejects.toThrow(msg);
    });
  });

  describe('waitForPreimage', () => {
    test('should return preimage when nursery settles reverse swap', async () => {
      const reverseSwap = {
        id: 'rev',
        preimage:
          'c4783710a8b755517a1cdb00ceffea5bf3e359c932a6f07590a7b121adffbbc3',
      } as unknown as ReverseSwap;

      nursery.on = jest.fn().mockImplementation((event, callback) => {
        if (event === 'invoice.settled') {
          callback(reverseSwap);
        }
      });

      await expect(client['waitForPreimage'](reverseSwap)).resolves.toEqual({
        feeMsat: 0,
        preimage: getHexBuffer(reverseSwap.preimage!),
      });
    });

    test('should return undefined when nursery does not settle reverse swap in time', async () => {
      const reverseSwap = {
        id: 'rev',
      } as unknown as ReverseSwap;

      await expect(client['waitForPreimage'](reverseSwap)).resolves.toEqual(
        undefined,
      );
    });
  });

  describe('getPreimage', () => {
    test('should return preimage when reverse swap has preimage', async () => {
      const reverseSwap = {
        preimage:
          'd101170063d5de1243c44eed1ab6b99f1664d96cdaf1d3fab8c508e30b348d5f',
      } as unknown as ReverseSwap;
      await expect(
        client['getPreimage']({} as unknown as Swap, reverseSwap),
      ).resolves.toEqual({
        isSelf: true,
        result: {
          feeMsat: 0,
          preimage: getHexBuffer(reverseSwap.preimage!),
        },
      });
    });

    test.each([null, undefined])(
      'should return undefined result when reverse swap has no preimage',
      async (preimage) => {
        const reverseSwap = {
          preimage,
        } as unknown as ReverseSwap;
        await expect(
          client['getPreimage']({} as unknown as Swap, reverseSwap),
        ).resolves.toEqual({
          isSelf: true,
          result: undefined,
        });
      },
    );

    test.each([null, undefined, { isFinal: false }])(
      'should not throw error when reverse swap is refunded but refund tx is not final',
      async (refundTx) => {
        const reverseSwap = {
          status: SwapUpdateEvent.TransactionRefunded,
        } as unknown as ReverseSwap;

        RefundTransactionRepository.getTransactionForSwap = jest
          .fn()
          .mockResolvedValue(refundTx);

        await expect(
          client['getPreimage']({} as unknown as Swap, reverseSwap),
        ).resolves.toEqual({
          isSelf: true,
          result: undefined,
        });
      },
    );

    test('should throw error when reverse swap is refunded', async () => {
      const reverseSwap = {
        status: SwapUpdateEvent.TransactionRefunded,
      } as unknown as ReverseSwap;

      RefundTransactionRepository.getTransactionForSwap = jest
        .fn()
        .mockResolvedValue({
          isFinal: true,
        });

      await expect(
        client['getPreimage']({} as unknown as Swap, reverseSwap),
      ).rejects.toThrow('incorrect payment details');
    });
  });

  describe('lookupSwapsForPreimageHash', () => {
    const preimageHash = getHexString(randomBytes(32));

    const mockSwap = {
      id: 'sub',
      preimageHash,
      status: SwapUpdateEvent.InvoicePaid,
    };

    const mockReverseSwap = {
      id: 'rev',
      preimageHash,
      status: SwapUpdateEvent.SwapCreated,
    };

    test('should successfully return both swap and reverse swap when both exist', async () => {
      SwapRepository.getSwap = jest.fn().mockResolvedValue(mockSwap as any);
      ReverseSwapRepository.getReverseSwap = jest
        .fn()
        .mockResolvedValue(mockReverseSwap as any);

      const result = await client['lookupSwapsForPreimageHash'](preimageHash);

      expect(result).toEqual({
        swap: mockSwap,
        reverseSwap: mockReverseSwap,
      });

      expect(SwapRepository.getSwap).toHaveBeenCalledTimes(1);
      expect(SwapRepository.getSwap).toHaveBeenCalledWith({
        preimageHash,
      });

      expect(ReverseSwapRepository.getReverseSwap).toHaveBeenCalledTimes(1);
      expect(ReverseSwapRepository.getReverseSwap).toHaveBeenCalledWith({
        preimageHash,
      });
    });

    test.each`
      description                              | swapValue           | reverseSwapValue
      ${'swap is null'}                        | ${null}             | ${mockReverseSwap as any}
      ${'swap is undefined'}                   | ${undefined as any} | ${mockReverseSwap as any}
      ${'reverse swap is null'}                | ${mockSwap as any}  | ${null}
      ${'reverse swap is undefined'}           | ${mockSwap as any}  | ${undefined as any}
      ${'both swap and reverse swap are null'} | ${null}             | ${null}
    `(
      'should throw error when $description',
      async ({ swapValue, reverseSwapValue }) => {
        SwapRepository.getSwap = jest.fn().mockResolvedValue(swapValue);
        ReverseSwapRepository.getReverseSwap = jest
          .fn()
          .mockResolvedValue(reverseSwapValue);

        await expect(
          client['lookupSwapsForPreimageHash'](preimageHash),
        ).rejects.toThrow('not a self payment');

        expect(SwapRepository.getSwap).toHaveBeenCalledTimes(1);
        expect(ReverseSwapRepository.getReverseSwap).toHaveBeenCalledTimes(1);
      },
    );
  });
});
