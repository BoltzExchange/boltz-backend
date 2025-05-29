import { crypto } from 'bitcoinjs-lib';
import { randomBytes } from 'crypto';
import Logger from '../../../lib/Logger';
import { getHexBuffer, getHexString } from '../../../lib/Utils';
import { SwapType, SwapUpdateEvent } from '../../../lib/consts/Enums';
import ReverseSwapRepository from '../../../lib/db/repositories/ReverseSwapRepository';
import SwapRepository from '../../../lib/db/repositories/SwapRepository';
import { InvoiceState } from '../../../lib/lightning/LightningClient';
import SelfPaymentClient from '../../../lib/lightning/SelfPaymentClient';

jest.mock('../../../lib/db/repositories/SwapRepository');
jest.mock('../../../lib/db/repositories/ReverseSwapRepository');

describe('SelfPaymentClient', () => {
  let client: SelfPaymentClient;

  beforeEach(() => {
    jest.clearAllMocks();
    client = new SelfPaymentClient(Logger.disabledLogger);
  });

  describe('handleSelfPayment', () => {
    const preimageHash = getHexString(randomBytes(32));
    const preimage = getHexString(randomBytes(32));

    const mockSwap = {
      id: 'sub',
      type: SwapType.Submarine,
      preimageHash,
    };

    const mockDecoded = {
      minFinalCltv: 40,
    };

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
        );

        expect(result).toEqual({
          isSelf: false,
          result: undefined,
        });

        expect(client['getReverseSwap']).toHaveBeenCalledTimes(1);
        expect(client['getReverseSwap']).toHaveBeenCalledWith(preimageHash);
      },
    );

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
          ),
        ).rejects.toThrow('CLTV limit too small');

        expect(client['getReverseSwap']).toHaveBeenCalledTimes(1);
      },
    );

    test('should emit htlc.accepted when reverse swap status is SwapCreated', async () => {
      const mockReverseSwap = {
        id: 'rev',
        preimageHash,
        status: SwapUpdateEvent.SwapCreated,
        invoice: 'lnbc1000n1...',
      };

      client['getReverseSwap'] = jest.fn().mockResolvedValue(mockReverseSwap);
      const emitSpy = jest.spyOn(client, 'emit');

      const result = await client.handleSelfPayment(
        mockSwap as any,
        mockDecoded as any,
        100,
      );

      expect(emitSpy).toHaveBeenCalledTimes(1);
      expect(emitSpy).toHaveBeenCalledWith(
        'htlc.accepted',
        mockReverseSwap.invoice,
      );

      expect(result).toEqual({
        isSelf: true,
        result: undefined,
      });
    });

    test('should not emit htlc.accepted when reverse swap status is not SwapCreated', async () => {
      const mockReverseSwap = {
        id: 'rev',
        preimageHash,
        status: SwapUpdateEvent.InvoiceSettled,
        invoice: 'lnbc1000n1...',
      };

      client['getReverseSwap'] = jest.fn().mockResolvedValue(mockReverseSwap);
      const emitSpy = jest.spyOn(client, 'emit');

      const result = await client.handleSelfPayment(
        mockSwap as any,
        mockDecoded as any,
        100,
      );

      expect(emitSpy).not.toHaveBeenCalled();

      expect(result).toEqual({
        isSelf: true,
        result: undefined,
      });
    });

    test('should return payment result when reverse swap has preimage', async () => {
      const mockReverseSwap = {
        id: 'rev',
        preimageHash,
        status: SwapUpdateEvent.SwapCreated,
        preimage,
        invoice: 'lnbc1000n1...',
      };

      client['getReverseSwap'] = jest.fn().mockResolvedValue(mockReverseSwap);

      const result = await client.handleSelfPayment(
        mockSwap as any,
        mockDecoded as any,
        100,
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
          status: SwapUpdateEvent.SwapCreated,
          preimage: preimageValue,
          invoice: 'lnbc1000n1...',
        };

        client['getReverseSwap'] = jest.fn().mockResolvedValue(mockReverseSwap);

        const result = await client.handleSelfPayment(
          mockSwap as any,
          mockDecoded as any,
          100,
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
        status: SwapUpdateEvent.SwapCreated,
        invoice: 'lnbc1000n1...',
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
      );
      const promise2 = client.handleSelfPayment(
        mockSwap as any,
        mockDecoded as any,
        100,
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

    test.each`
      swapStatus                                 | expectedState
      ${SwapUpdateEvent.SwapCreated}             | ${InvoiceState.Open}
      ${SwapUpdateEvent.InvoicePending}          | ${InvoiceState.Accepted}
      ${SwapUpdateEvent.InvoicePaid}             | ${InvoiceState.Settled}
      ${SwapUpdateEvent.TransactionClaimPending} | ${InvoiceState.Settled}
      ${SwapUpdateEvent.TransactionClaimed}      | ${InvoiceState.Settled}
      ${SwapUpdateEvent.TransactionFailed}       | ${InvoiceState.Open}
      ${undefined}                               | ${InvoiceState.Open}
    `(
      'should return $expectedState when swap status is $swapStatus',
      async ({ swapStatus, expectedState }) => {
        const mockSwap = {
          id: 'sub',
          preimageHash,
          status: swapStatus,
        };

        client['lookupSwapsForPreimageHash'] = jest
          .fn()
          .mockResolvedValue({ swap: mockSwap });

        const result = await client.lookupHoldInvoice(preimageHash);

        expect(client['lookupSwapsForPreimageHash']).toHaveBeenCalledTimes(1);
        expect(client['lookupSwapsForPreimageHash']).toHaveBeenCalledWith(
          getHexString(preimageHash),
        );
        expect(result).toEqual({ state: expectedState, htlcs: [] });
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

  describe('settleHoldInvoice', () => {
    const preimage = randomBytes(32);
    const preimageHash = getHexString(crypto.sha256(preimage));

    const mockReverseSwap = {
      id: 'rev',
      preimageHash,
      status: SwapUpdateEvent.SwapCreated,
    };

    test('should call settle hold invoices', async () => {
      client['lookupSwapsForPreimageHash'] = jest
        .fn()
        .mockResolvedValue({ reverseSwap: mockReverseSwap });

      await client.settleHoldInvoice(preimage);

      expect(client['lookupSwapsForPreimageHash']).toHaveBeenCalledTimes(1);
      expect(client['lookupSwapsForPreimageHash']).toHaveBeenCalledWith(
        preimageHash,
      );

      expect(ReverseSwapRepository.setInvoiceSettled).toHaveBeenCalledTimes(1);
      expect(ReverseSwapRepository.setInvoiceSettled).toHaveBeenCalledWith(
        mockReverseSwap,
        getHexString(preimage),
      );
    });

    test('should bubble up error when lookupSwapsForPreimageHash throws', async () => {
      const msg = 'fail';
      client['lookupSwapsForPreimageHash'] = jest
        .fn()
        .mockRejectedValue(new Error(msg));

      await expect(client.settleHoldInvoice(preimage)).rejects.toThrow(msg);
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
