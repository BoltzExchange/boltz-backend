import { status } from '@grpc/grpc-js';
import Logger from '../../../../lib/Logger';
import type NotificationClient from '../../../../lib/notifications/NotificationClient';
import type * as boltzrpc from '../../../../lib/proto/boltzrpc_pb';
import InvoiceCreationHook from '../../../../lib/swap/hooks/InvoiceCreationHook';

describe('InvoiceCreationHook', () => {
  let hook: InvoiceCreationHook;

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

    hook = new InvoiceCreationHook(Logger.disabledLogger, {
      sendMessage: jest.fn(),
    } as unknown as NotificationClient);
  });

  describe('hook', () => {
    test('should return undefined if not connected', async () => {
      hook['isConnected'] = jest.fn().mockReturnValue(false);

      const sendHook = jest.fn();
      hook['sendHook'] = sendHook;

      await expect(hook.hook('id', 1)).resolves.toBeUndefined();
      expect(sendHook).not.toHaveBeenCalled();
    });

    test('should send invoice creation hook request', async () => {
      hook.connectToStream(stream);

      let written: any;
      stream.write = jest.fn().mockImplementation((data: any) => {
        written = data;
      });

      const params = {
        id: 'swap-id',
        invoiceAmount: 1_321,
        referral: 'referral',
      };

      const promise = hook.hook(
        params.id,
        params.invoiceAmount,
        params.referral,
      );
      hook['pendingHooks'].get(params.id)?.({ nodeId: 'node-1' });

      await expect(promise).resolves.toEqual({ nodeId: 'node-1' });

      expect(stream.write).toHaveBeenCalledTimes(1);
      expect(written.getId()).toEqual(params.id);
      expect(written.getInvoiceAmountSats()).toEqual(params.invoiceAmount);
      expect(written.getReferral()).toEqual(params.referral);
    });

    test('should resolve undefined after timeout', async () => {
      jest.useFakeTimers();

      hook.connectToStream(stream);

      const id = 'swap-id';
      const promise = hook.hook(id, 123);
      expect(hook['pendingHooks'].has(id)).toEqual(true);

      jest.runAllTimers();

      await expect(promise).resolves.toBeUndefined();
      expect(hook['pendingHooks'].has(id)).toEqual(false);
    });

    test.each`
      event      | payload
      ${'end'}   | ${undefined}
      ${'error'} | ${{ code: status.UNAVAILABLE, details: 'test' }}
    `(
      'should resolve pending hooks to undefined on $event',
      async ({ event, payload }) => {
        hook.connectToStream(stream);

        const id = 'swap-id';
        const promise = hook.hook(id, 123);
        expect(hook['pendingHooks'].has(id)).toEqual(true);

        handlers[event](payload);

        await expect(promise).resolves.toBeUndefined();
        expect(hook['pendingHooks'].has(id)).toEqual(false);
      },
    );
  });

  describe('parseGrpcAction', () => {
    test('should return undefined when no node is provided', () => {
      const mockResponse = {
        getNodePubkey: () => '',
      } as boltzrpc.InvoiceCreationHookResponse;

      expect(hook['parseGrpcAction'](mockResponse)).toBeUndefined();
    });

    test('should parse and trim node id', () => {
      const mockResponse = {
        getNodePubkey: () => ' node-1 ',
      } as boltzrpc.InvoiceCreationHookResponse;

      expect(hook['parseGrpcAction'](mockResponse)).toEqual({
        nodeId: 'node-1',
      });
    });
  });
});
