import { status } from '@grpc/grpc-js';
import Logger from '../../../../lib/Logger';
import * as boltzrpc from '../../../../lib/proto/boltzrpc';
import SendApprovalHook, {
  SendApprovalAction,
} from '../../../../lib/swap/hooks/SendApprovalHook';

describe('SendApprovalHook', () => {
  let hook: SendApprovalHook;

  let handlers: Record<string, (data?: any) => void>;
  let stream: any;

  const request = {
    swapId: 'swap-id',
    pair: 'L-BTC/BTC',
    symbol: 'BTC',
    amount: 100_000,
  };

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

    hook = new SendApprovalHook(Logger.disabledLogger);
  });

  describe('hook', () => {
    test('should resolve accept action if stream is not connected', async () => {
      await expect(
        hook.hook(request.swapId, request.pair, request.symbol, request.amount),
      ).resolves.toEqual(SendApprovalAction.Accept);

      expect(stream.write).not.toHaveBeenCalled();
    });

    test('should send send approval hook request', async () => {
      hook.connectToStream(stream);

      const promise = hook.hook(
        request.swapId,
        request.pair,
        request.symbol,
        request.amount,
      );
      hook['pendingHooks']
        .get(request.swapId)
        ?.resolve(SendApprovalAction.Accept);

      await expect(promise).resolves.toEqual(SendApprovalAction.Accept);

      expect(stream.write).toHaveBeenCalledTimes(1);
      expect(stream.write).toHaveBeenCalledWith({
        id: request.swapId,
        pair: request.pair,
        symbol: request.symbol,
        amount: request.amount.toString(),
      } satisfies boltzrpc.SendApprovalHookRequest);
    });

    test('should resolve accept action if hook is not resolved after timeout', async () => {
      jest.useFakeTimers();

      hook.connectToStream(stream);

      const promise = hook.hook(
        request.swapId,
        request.pair,
        request.symbol,
        request.amount,
      );
      expect(hook['pendingHooks'].has(request.swapId)).toEqual(true);

      jest.runAllTimers();

      await expect(promise).resolves.toEqual(SendApprovalAction.Accept);
      expect(hook['pendingHooks'].has(request.swapId)).toEqual(false);
    });

    test.each`
      event      | payload
      ${'end'}   | ${undefined}
      ${'error'} | ${{ code: status.UNAVAILABLE, details: 'test' }}
    `(
      'should resolve pending hooks to accept action on $event',
      async ({ event, payload }) => {
        hook.connectToStream(stream);

        const promise = hook.hook(
          request.swapId,
          request.pair,
          request.symbol,
          request.amount,
        );
        expect(hook['pendingHooks'].has(request.swapId)).toEqual(true);

        handlers[event](payload);

        await expect(promise).resolves.toEqual(SendApprovalAction.Accept);
        expect(hook['pendingHooks'].has(request.swapId)).toEqual(false);
      },
    );
  });

  describe('fallback', () => {
    test('should resolve to the fallback action if stream is not connected', async () => {
      await expect(
        hook.hook(
          request.swapId,
          request.pair,
          request.symbol,
          request.amount,
          SendApprovalAction.Hold,
        ),
      ).resolves.toEqual(SendApprovalAction.Hold);
    });

    test('should resolve to the fallback action on timeout', async () => {
      jest.useFakeTimers();
      hook.connectToStream(stream);

      const promise = hook.hook(
        request.swapId,
        request.pair,
        request.symbol,
        request.amount,
        SendApprovalAction.Hold,
      );
      jest.runAllTimers();

      await expect(promise).resolves.toEqual(SendApprovalAction.Hold);
    });

    test.each`
      event      | payload
      ${'end'}   | ${undefined}
      ${'error'} | ${{ code: status.UNAVAILABLE, details: 'test' }}
    `(
      'should resolve pending hooks to the fallback action on $event',
      async ({ event, payload }) => {
        hook.connectToStream(stream);

        const promise = hook.hook(
          request.swapId,
          request.pair,
          request.symbol,
          request.amount,
          SendApprovalAction.Hold,
        );
        handlers[event](payload);

        await expect(promise).resolves.toEqual(SendApprovalAction.Hold);
      },
    );

    test('should apply a real response over the fallback', async () => {
      hook.connectToStream(stream);

      const promise = hook.hook(
        request.swapId,
        request.pair,
        request.symbol,
        request.amount,
        SendApprovalAction.Hold,
      );
      hook['pendingHooks']
        .get(request.swapId)
        ?.resolve(SendApprovalAction.Accept);

      await expect(promise).resolves.toEqual(SendApprovalAction.Accept);
    });
  });

  describe('defaultAction', () => {
    test('should default to accept when not configured', async () => {
      const defaultHook = new SendApprovalHook(Logger.disabledLogger);

      await expect(
        defaultHook.hook(
          request.swapId,
          request.pair,
          request.symbol,
          request.amount,
        ),
      ).resolves.toEqual(SendApprovalAction.Accept);
    });

    test.each`
      action      | expected
      ${'reject'} | ${SendApprovalAction.Reject}
      ${'REJECT'} | ${SendApprovalAction.Reject}
      ${'accept'} | ${SendApprovalAction.Accept}
      ${'hold'}   | ${SendApprovalAction.Hold}
    `(
      'should resolve $action to the configured action when not connected',
      async ({ action, expected }) => {
        const configuredHook = new SendApprovalHook(
          Logger.disabledLogger,
          undefined,
          action,
        );

        await expect(
          configuredHook.hook(
            request.swapId,
            request.pair,
            request.symbol,
            request.amount,
          ),
        ).resolves.toEqual(expected);
      },
    );

    test('should resolve to the configured action on timeout', async () => {
      jest.useFakeTimers();

      const configuredHook = new SendApprovalHook(
        Logger.disabledLogger,
        undefined,
        'reject',
      );
      configuredHook.connectToStream(stream);

      const promise = configuredHook.hook(
        request.swapId,
        request.pair,
        request.symbol,
        request.amount,
      );

      jest.runAllTimers();

      await expect(promise).resolves.toEqual(SendApprovalAction.Reject);
    });

    test.each`
      action
      ${'maybe'}
      ${'constructor'}
      ${'__proto__'}
      ${'toString'}
    `('should throw for the invalid action $action', ({ action }) => {
      expect(
        () => new SendApprovalHook(Logger.disabledLogger, undefined, action),
      ).toThrow(`invalid send approval default action: ${action}`);
    });
  });

  describe('parseGrpcAction', () => {
    test.each`
      action                                              | result
      ${boltzrpc.SendApprovalAction.SEND_APPROVAL_ACCEPT} | ${SendApprovalAction.Accept}
      ${boltzrpc.SendApprovalAction.SEND_APPROVAL_REJECT} | ${SendApprovalAction.Reject}
      ${boltzrpc.SendApprovalAction.SEND_APPROVAL_HOLD}   | ${SendApprovalAction.Hold}
    `('should parse action $action', ({ action, result }) => {
      expect(
        hook['parseGrpcAction']({
          id: request.swapId,
          action,
        }),
      ).toEqual(result);
    });
  });
});
