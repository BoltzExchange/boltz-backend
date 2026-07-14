import { status } from '@grpc/grpc-js';
import Logger from '../../../../lib/Logger';
import * as boltzrpc from '../../../../lib/proto/boltzrpc';
import ClaimFailureHook, {
  ClaimFailureType,
} from '../../../../lib/swap/hooks/ClaimFailureHook';

describe('ClaimFailureHook', () => {
  let hook: ClaimFailureHook;
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
    hook = new ClaimFailureHook(Logger.disabledLogger);
  });

  test('does nothing when no stream is connected', async () => {
    await expect(
      hook.hook(ClaimFailureType.Immediate, 'BTC', 'swap-id'),
    ).resolves.toBeUndefined();
    expect(stream.write).not.toHaveBeenCalled();
  });

  test.each`
    type                          | symbol     | swapId       | batchSize | grpcType
    ${ClaimFailureType.Immediate} | ${'BTC'}   | ${'swap-id'} | ${0}      | ${boltzrpc.ClaimFailureType.CLAIM_FAILURE_IMMEDIATE}
    ${ClaimFailureType.Batch}     | ${'L-BTC'} | ${undefined} | ${3}      | ${boltzrpc.ClaimFailureType.CLAIM_FAILURE_BATCH}
  `(
    'sends and acknowledges $type claim failure',
    async ({ type, symbol, swapId, batchSize, grpcType }) => {
      hook.connectToStream(stream);

      const pending = hook.hook(type, symbol, swapId, batchSize);
      const request = stream.write.mock.calls[0][0];
      expect(request).toEqual({
        id: expect.any(String),
        type: grpcType,
        symbol,
        swapId,
        batchSize,
      } satisfies boltzrpc.ClaimFailureHookRequest);

      handlers.data({
        id: request.id,
      } satisfies boltzrpc.ClaimFailureHookResponse);
      await expect(pending).resolves.toBeUndefined();
    },
  );

  test.each`
    event      | payload
    ${'end'}   | ${undefined}
    ${'error'} | ${{ code: status.UNAVAILABLE, details: 'test' }}
  `('resolves pending events on stream $event', async ({ event, payload }) => {
    hook.connectToStream(stream);
    const pending = hook.hook(ClaimFailureType.Batch, 'BTC', undefined, 2);

    handlers[event](payload);

    await expect(pending).resolves.toBeUndefined();
  });
});
