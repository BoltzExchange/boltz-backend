import { status } from '@grpc/grpc-js';
import Logger from '../../../../lib/Logger';
import { SwapType } from '../../../../lib/consts/Enums';
import * as boltzrpc from '../../../../lib/proto/boltzrpc';
import { Action } from '../../../../lib/swap/hooks/CreationHook';
import TransactionHook from '../../../../lib/swap/hooks/TransactionHook';

describe('TransactionHook', () => {
  let hook: TransactionHook;

  let handlers: Record<string, (data?: any) => void>;
  let stream: any;

  const request = {
    swapId: 'swap-id',
    symbol: 'BTC',
    txId: 'tx-id',
    tx: Buffer.from('tx'),
    confirmed: true,
    swapType: SwapType.Submarine,
    vout: 1,
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

    hook = new TransactionHook(Logger.disabledLogger);
  });

  describe('hook', () => {
    test('should resolve accept action if stream is not connected', async () => {
      await expect(
        hook.hook(
          request.swapId,
          request.symbol,
          request.txId,
          request.tx,
          request.confirmed,
          request.swapType,
          request.vout,
        ),
      ).resolves.toEqual(Action.Accept);

      expect(stream.write).not.toHaveBeenCalled();
    });

    test('should send transaction hook request', async () => {
      hook.connectToStream(stream);

      const promise = hook.hook(
        request.swapId,
        request.symbol,
        request.txId,
        request.tx,
        request.confirmed,
        request.swapType,
        request.vout,
      );
      hook['pendingHooks'].get(request.swapId)?.(Action.Accept);

      await expect(promise).resolves.toEqual(Action.Accept);

      expect(stream.write).toHaveBeenCalledTimes(1);
      expect(stream.write).toHaveBeenCalledWith({
        id: request.swapId,
        symbol: request.symbol,
        tx: request.tx,
        txId: request.txId,
        confirmed: request.confirmed,
        swapType: boltzrpc.SwapType.SUBMARINE,
        vout: request.vout.toString(),
      } satisfies boltzrpc.TransactionHookRequest);
    });

    test('should resolve accept action if hook is not resolved after timeout', async () => {
      jest.useFakeTimers();

      hook.connectToStream(stream);

      const promise = hook.hook(
        request.swapId,
        request.symbol,
        request.txId,
        request.tx,
        request.confirmed,
        request.swapType,
        request.vout,
      );
      expect(hook['pendingHooks'].has(request.swapId)).toEqual(true);

      jest.runAllTimers();

      await expect(promise).resolves.toEqual(Action.Accept);
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
          request.symbol,
          request.txId,
          request.tx,
          request.confirmed,
          request.swapType,
          request.vout,
        );
        expect(hook['pendingHooks'].has(request.swapId)).toEqual(true);

        handlers[event](payload);

        await expect(promise).resolves.toEqual(Action.Accept);
        expect(hook['pendingHooks'].has(request.swapId)).toEqual(false);
      },
    );
  });

  describe('parseGrpcAction', () => {
    test.each`
      action                    | result
      ${boltzrpc.Action.ACCEPT} | ${Action.Accept}
      ${boltzrpc.Action.REJECT} | ${Action.Reject}
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
