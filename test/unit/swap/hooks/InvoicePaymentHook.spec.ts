import Logger from '../../../../lib/Logger';
import type NotificationClient from '../../../../lib/notifications/NotificationClient';
import type * as boltzrpc from '../../../../lib/proto/boltzrpc';
import type DecodedInvoice from '../../../../lib/sidecar/DecodedInvoice';
import InvoicePaymentHook from '../../../../lib/swap/hooks/InvoicePaymentHook';

describe('InvoicePaymentHook', () => {
  let hook: InvoicePaymentHook;

  beforeEach(() => {
    jest.clearAllMocks();
    hook = new InvoicePaymentHook(
      Logger.disabledLogger,
      {} as unknown as NotificationClient,
    );
  });

  describe('hook', () => {
    test('should return undefined if not connected', async () => {
      hook['isConnected'] = jest.fn().mockReturnValue(false);

      const mockSendHook = jest.fn();
      hook['sendHook'] = mockSendHook;

      await expect(
        hook.hook('id', '', {} as unknown as DecodedInvoice),
      ).resolves.toBeUndefined();
      expect(mockSendHook).not.toHaveBeenCalled();
    });
  });

  describe('parseGrpcAction', () => {
    test('should return empty result when no preferences provided', () => {
      const mockResponse = {
        id: 'id',
        nodePubkey: '',
      } as boltzrpc.InvoicePaymentHookResponse;

      expect(hook['parseGrpcAction'](mockResponse)).toEqual({
        nodeId: undefined,
      });
    });

    test('should return time preference when provided', () => {
      const mockResponse = {
        id: 'id',
        nodePubkey: '',
        timePreference: -0.5,
      } as boltzrpc.InvoicePaymentHookResponse;

      expect(hook['parseGrpcAction'](mockResponse)).toEqual({
        nodeId: undefined,
        timePreference: -0.5,
      });
    });

    test('should parse node id from action', () => {
      const mockResponse = {
        id: 'id',
        nodePubkey: 'lnd-override',
      } as boltzrpc.InvoicePaymentHookResponse;

      expect(hook['parseGrpcAction'](mockResponse)).toEqual({
        nodeId: 'lnd-override',
      });
    });

    test('should parse node id with time preference', () => {
      const mockResponse = {
        id: 'id',
        nodePubkey: 'lnd-override',
        timePreference: 0.8,
      } as boltzrpc.InvoicePaymentHookResponse;

      expect(hook['parseGrpcAction'](mockResponse)).toEqual({
        nodeId: 'lnd-override',
        timePreference: 0.8,
      });
    });

    describe('time preference validation', () => {
      test.each`
        timePreference
        ${-1}
        ${-0.123}
        ${0}
        ${0.123}
        ${0.5}
        ${1}
      `(
        'should accept valid time preference $timePreference',
        ({ timePreference }) => {
          const mockResponse = {
            id: 'id',
            nodePubkey: '',
            timePreference,
          } as boltzrpc.InvoicePaymentHookResponse;

          expect(hook['parseGrpcAction'](mockResponse)).toEqual({
            timePreference,
            nodeId: undefined,
          });
        },
      );

      test.each`
        timePreference
        ${-1.1}
        ${1.1}
        ${2}
        ${-2}
      `(
        'should return undefined if time preference is invalid: $timePreference',
        ({ timePreference }) => {
          const mockResponse = {
            id: 'test',
            nodePubkey: '',
            timePreference,
          } as boltzrpc.InvoicePaymentHookResponse;

          expect(hook['parseGrpcAction'](mockResponse)).toBeUndefined();
        },
      );
    });
  });
});
