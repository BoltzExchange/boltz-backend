import { status } from '@grpc/grpc-js';
import Logger from '../../../../lib/Logger';
import { SwapType } from '../../../../lib/consts/Enums';
import * as boltzrpc from '../../../../lib/proto/boltzrpc_pb';
import CreationHook, { Action } from '../../../../lib/swap/hooks/CreationHook';

describe('CreationHook', () => {
  let hook: CreationHook;

  const stream = {
    on: jest.fn(),
    end: jest.fn(),
    write: jest.fn(),
    removeAllListeners: jest.fn(),
  } as any;

  beforeEach(() => {
    hook = new CreationHook(Logger.disabledLogger);
  });

  describe('connectToStream', () => {
    test('should connect to stream', () => {
      hook.connectToStream(stream);

      expect(stream.on).toHaveBeenCalledTimes(3);
      expect(stream.on).toHaveBeenCalledWith('end', expect.any(Function));
      expect(stream.on).toHaveBeenCalledWith('data', expect.any(Function));
      expect(stream.on).toHaveBeenCalledWith('error', expect.any(Function));
    });

    test('should disconnect from previous stream', () => {
      const previousStream = {
        ...stream,
        end: jest.fn(),
        emit: jest.fn(),
        removeAllListeners: jest.fn(),
      };

      hook.connectToStream(previousStream);
      hook.connectToStream(stream);

      expect(previousStream.emit).toHaveBeenCalledTimes(1);
      expect(previousStream.emit).toHaveBeenCalledWith('error', {
        code: status.RESOURCE_EXHAUSTED,
        details: 'received new connection',
      });

      expect(previousStream.end).toHaveBeenCalledTimes(1);
      expect(previousStream.removeAllListeners).toHaveBeenCalledTimes(1);
    });

    test.each`
      action                    | result
      ${boltzrpc.Action.ACCEPT} | ${Action.Accept}
      ${boltzrpc.Action.REJECT} | ${Action.Reject}
    `('should handle hook on data $action', ({ action, result }) => {
      const pendingHookId = '1';
      const pendingHook = jest.fn();
      hook['pendingHooks'].set(pendingHookId, pendingHook);

      let emitData: any;
      stream.on = jest.fn().mockImplementation((event: string, data: any) => {
        if (event === 'data') {
          emitData = data;
        }
      });

      hook.connectToStream(stream);

      emitData({
        getId: () => pendingHookId,
        getAction: () => action,
      });

      expect(pendingHook).toHaveBeenCalledTimes(1);
      expect(pendingHook).toHaveBeenCalledWith(result);
    });
  });

  describe('swapCreationHook', () => {
    test('should resolve accept action if stream is not connected', async () => {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-expect-error
      hook['defaultAction'] = Action.Hold;

      expect(hook['stream']).toBeUndefined();

      await expect(
        hook.hook(SwapType.Submarine, {
          id: '1',
          symbolSending: 'BTC',
          symbolReceiving: 'BTC',
          invoiceAmount: 1,
        }),
      ).resolves.toEqual(hook['handleAction'](Action.Accept));
    });

    test('should resolve default action if hook is not resolved after timeout', async () => {
      jest.useFakeTimers();

      hook.connectToStream(stream);

      const id = '1';
      const promise = hook.hook(SwapType.Submarine, {
        id,
        symbolSending: 'BTC',
        symbolReceiving: 'BTC',
        invoiceAmount: 1,
      });
      expect(hook['pendingHooks'].has(id)).toEqual(true);

      jest.runAllTimers();

      await expect(promise).resolves.toEqual(
        hook['handleAction'](hook['defaultAction']),
      );
      expect(hook['pendingHooks'].has(id)).toEqual(false);
    });

    test('should send submarine swap creation hook request', async () => {
      hook.connectToStream(stream);

      let written: any;
      stream.write = jest.fn().mockImplementation((data: any) => {
        written = data;
      });

      const params = {
        id: '1',
        referral: 'referral',
        symbolSending: 'BTC',
        symbolReceiving: 'L-BTC',
        invoiceAmount: 1_321,
      };

      const promise = hook.hook(SwapType.Submarine, params);
      hook['pendingHooks'].get(params.id)?.(Action.Accept);
      await promise;

      expect(stream.write).toHaveBeenCalledTimes(1);
      expect(written.getId()).toEqual(params.id);
      expect(written.getSymbolSending()).toEqual(params.symbolSending);
      expect(written.getSymbolReceiving()).toEqual(params.symbolReceiving);
      expect(written.getReferral()).toEqual(params.referral);
      expect(written.getSubmarine().getInvoiceAmount()).toEqual(
        params.invoiceAmount,
      );
    });

    test('should send reverse swap creation hook request', async () => {
      hook.connectToStream(stream);

      let written: any;
      stream.write = jest.fn().mockImplementation((data: any) => {
        written = data;
      });

      const params = {
        id: '1',
        referral: 'referral',
        symbolSending: 'BTC',
        symbolReceiving: 'L-BTC',
        invoiceAmount: 1_321,
      };

      const promise = hook.hook(SwapType.ReverseSubmarine, params);
      hook['pendingHooks'].get(params.id)?.(Action.Accept);
      await promise;

      expect(stream.write).toHaveBeenCalledTimes(1);
      expect(written.getId()).toEqual(params.id);
      expect(written.getSymbolSending()).toEqual(params.symbolSending);
      expect(written.getSymbolReceiving()).toEqual(params.symbolReceiving);
      expect(written.getReferral()).toEqual(params.referral);
      expect(written.getReverse().getInvoiceAmount()).toEqual(
        params.invoiceAmount,
      );
    });

    test('should send chain swap creation hook request', async () => {
      hook.connectToStream(stream);

      let written: any;
      stream.write = jest.fn().mockImplementation((data: any) => {
        written = data;
      });

      const params = {
        id: '1',
        referral: 'referral',
        symbolSending: 'BTC',
        symbolReceiving: 'L-BTC',
        userLockAmount: 1_321,
      };

      const promise = hook.hook(SwapType.Chain, params);
      hook['pendingHooks'].get(params.id)?.(Action.Accept);
      await promise;

      expect(stream.write).toHaveBeenCalledTimes(1);
      expect(written.getId()).toEqual(params.id);
      expect(written.getSymbolSending()).toEqual(params.symbolSending);
      expect(written.getSymbolReceiving()).toEqual(params.symbolReceiving);
      expect(written.getReferral()).toEqual(params.referral);
      expect(written.getChain().getUserLockAmount()).toEqual(
        params.userLockAmount,
      );
    });
  });

  describe('handleAction', () => {
    beforeEach(() => {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-expect-error
      hook['logger'] = {
        warn: jest.fn(),
      } as any;
    });

    test.each([
      { action: Action.Accept, expected: true },
      { action: Action.Hold, expected: true },
      { action: Action.Reject, expected: false },
    ])(
      'should return $expected when action is $action',
      ({ action, expected }) => {
        const result = hook['handleAction'](action);

        expect(result).toEqual(expected);

        if (action === Action.Hold) {
          expect(hook['logger'].warn).toHaveBeenCalledWith(
            'Hold not implemented for swap creation hook',
          );
        } else {
          expect(hook['logger'].warn).not.toHaveBeenCalled();
        }
      },
    );
  });

  test('closeStream', () => {
    hook.connectToStream(stream);

    const pendingHookId = '1';
    const pendingHook = jest.fn();
    hook['pendingHooks'].set(pendingHookId, pendingHook);

    hook['closeStream']();

    expect(stream.removeAllListeners).toHaveBeenCalledTimes(1);
    expect(stream.end).toHaveBeenCalledTimes(1);
    expect(hook['stream']).toBeUndefined();

    expect(pendingHook).toHaveBeenCalledTimes(1);
    expect(pendingHook).toHaveBeenCalledWith(hook['defaultAction']);
    expect(hook['pendingHooks'].size).toEqual(0);
    expect(hook['pendingHooks'].has(pendingHookId)).toEqual(false);
  });
});
