import { status } from '@grpc/grpc-js';
import Logger from '../../../../lib/Logger';
import * as boltzrpc from '../../../../lib/proto/boltzrpc';
import FailureHook, {
  ClaimFailureType,
} from '../../../../lib/swap/hooks/FailureHook';

describe('FailureHook', () => {
  let hook: FailureHook;
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
    hook = new FailureHook(Logger.disabledLogger);
  });

  test('does nothing when no stream is connected', async () => {
    await expect(
      hook.claim({
        type: ClaimFailureType.Immediate,
        symbol: 'BTC',
        swapId: 'swap-id',
      }),
    ).resolves.toBeUndefined();
    expect(stream.write).not.toHaveBeenCalled();
  });

  test('uses a unique event id for every failure', async () => {
    hook.connectToStream(stream);

    const first = hook.claim({
      type: ClaimFailureType.Immediate,
      symbol: 'BTC',
      swapId: 'swap-id',
    });
    const second = hook.claim({
      type: ClaimFailureType.Batch,
      symbol: 'L-BTC',
      batchSize: 2,
    });
    const [firstRequest, secondRequest] = stream.write.mock.calls.map(
      ([request]) => request as boltzrpc.FailureHookRequest,
    );

    expect(firstRequest.id).not.toEqual(secondRequest.id);

    handlers.data({ id: secondRequest.id });
    handlers.data({ id: firstRequest.id });
    await expect(Promise.all([first, second])).resolves.toEqual([
      undefined,
      undefined,
    ]);
  });

  test.each`
    type                          | symbol     | swapId       | batchSize    | grpcType
    ${ClaimFailureType.Immediate} | ${'BTC'}   | ${'swap-id'} | ${undefined} | ${boltzrpc.ClaimFailureType.CLAIM_FAILURE_IMMEDIATE}
    ${ClaimFailureType.Batch}     | ${'L-BTC'} | ${undefined} | ${3}         | ${boltzrpc.ClaimFailureType.CLAIM_FAILURE_BATCH}
  `(
    'sends and acknowledges $type claim failure',
    async ({ type, symbol, swapId, batchSize, grpcType }) => {
      hook.connectToStream(stream);

      const pending = hook.claim({ type, symbol, swapId, batchSize });
      const request = stream.write.mock.calls[0][0];
      expect(request).toEqual({
        id: expect.any(String),
        claimFailure: {
          type: grpcType,
          symbol,
          swapId,
          batchSize,
        },
      } satisfies boltzrpc.FailureHookRequest);

      handlers.data({
        id: request.id,
      } satisfies boltzrpc.FailureHookResponse);
      await expect(pending).resolves.toBeUndefined();
    },
  );

  test.each`
    event      | payload
    ${'end'}   | ${undefined}
    ${'error'} | ${{ code: status.UNAVAILABLE, details: 'test' }}
  `('resolves pending events on stream $event', async ({ event, payload }) => {
    hook.connectToStream(stream);
    const pending = hook.claim({
      type: ClaimFailureType.Batch,
      symbol: 'BTC',
      batchSize: 2,
    });

    handlers[event](payload);

    await expect(pending).resolves.toBeUndefined();
  });
});
