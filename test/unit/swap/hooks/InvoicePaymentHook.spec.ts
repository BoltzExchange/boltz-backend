import { status } from '@grpc/grpc-js';
import Logger from '../../../../lib/Logger';
import type NotificationClient from '../../../../lib/notifications/NotificationClient';
import * as boltzrpc from '../../../../lib/proto/boltzrpc';
import type DecodedInvoice from '../../../../lib/sidecar/DecodedInvoice';
import InvoicePaymentHook, {
  InvoicePaymentHookAction,
} from '../../../../lib/swap/hooks/InvoicePaymentHook';

describe('InvoicePaymentHook', () => {
  let hook: InvoicePaymentHook;

  let handlers: Record<string, (data?: any) => void>;
  let stream: any;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();

    handlers = {};
    stream = {
      on: jest.fn().mockImplementation((event: string, handler: any) => {
        handlers[event] = handler;
      }),
      end: jest.fn(),
      write: jest.fn(),
      removeAllListeners: jest.fn(),
      emit: jest.fn(),
    };

    hook = new InvoicePaymentHook(Logger.disabledLogger, {
      sendMessage: jest.fn(),
    } as unknown as NotificationClient);
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

    test('should resolve continue action if hook is not resolved after timeout', async () => {
      jest.useFakeTimers();

      hook.connectToStream(stream);

      const id = 'id';
      const promise = hook.hook(id, 'invoice', {
        rawRes: {},
      } as unknown as DecodedInvoice);
      expect(hook['pendingHooks'].has(id)).toEqual(true);

      jest.runAllTimers();

      await expect(promise).resolves.toEqual({
        action: InvoicePaymentHookAction.Continue,
      });
      expect(hook['pendingHooks'].has(id)).toEqual(false);
    });

    test.each`
      event      | payload
      ${'end'}   | ${undefined}
      ${'error'} | ${{ code: status.UNAVAILABLE, details: 'test' }}
    `(
      'should resolve pending hooks to continue action on $event',
      async ({ event, payload }) => {
        hook.connectToStream(stream);

        const id = 'id';
        const promise = hook.hook(id, 'invoice', {
          rawRes: {},
        } as unknown as DecodedInvoice);
        expect(hook['pendingHooks'].has(id)).toEqual(true);

        handlers[event](payload);

        await expect(promise).resolves.toEqual({
          action: InvoicePaymentHookAction.Continue,
        });
        expect(hook['pendingHooks'].has(id)).toEqual(false);
      },
    );
  });

  describe('parseGrpcAction', () => {
    test('should return empty result when no preferences provided', () => {
      const mockResponse = {
        id: 'id',
        nodePubkey: '',
      } as boltzrpc.InvoicePaymentHookResponse;

      expect(hook['parseGrpcAction'](mockResponse)).toEqual({
        action: InvoicePaymentHookAction.Continue,
        nodeId: undefined,
      });
    });

    test('should return continue action when explicitly provided', () => {
      const mockResponse = {
        id: 'id',
        nodePubkey: '',
        action: boltzrpc.InvoicePaymentHookAction.CONTINUE,
      } as boltzrpc.InvoicePaymentHookResponse;

      expect(hook['parseGrpcAction'](mockResponse)).toEqual({
        action: InvoicePaymentHookAction.Continue,
        nodeId: undefined,
      });
    });

    test('should return hold action without preferences', () => {
      const mockResponse = {
        id: 'id',
        nodePubkey: 'ignored',
        timePreference: -0.5,
        action: boltzrpc.InvoicePaymentHookAction.HOLD,
      } as boltzrpc.InvoicePaymentHookResponse;

      expect(hook['parseGrpcAction'](mockResponse)).toEqual({
        action: InvoicePaymentHookAction.Hold,
      });
    });

    test('should return time preference when provided', () => {
      const mockResponse = {
        id: 'id',
        nodePubkey: '',
        timePreference: -0.5,
      } as boltzrpc.InvoicePaymentHookResponse;

      expect(hook['parseGrpcAction'](mockResponse)).toEqual({
        action: InvoicePaymentHookAction.Continue,
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
        action: InvoicePaymentHookAction.Continue,
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
        action: InvoicePaymentHookAction.Continue,
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
            action: InvoicePaymentHookAction.Continue,
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
