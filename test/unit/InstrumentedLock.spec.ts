import { SpanKind, SpanStatusCode } from '@opentelemetry/api';
import InstrumentedLock from '../../lib/InstrumentedLock';
import Tracing from '../../lib/Tracing';

const deferred = () => {
  let resolve!: () => void;
  const promise = new Promise<void>((res) => {
    resolve = res;
  });
  return { promise, resolve };
};

describe('InstrumentedLock', () => {
  const locks: InstrumentedLock[] = [];

  const newLock = (
    name: string,
    options?: ConstructorParameters<typeof InstrumentedLock>[1],
  ) => {
    const lock = new InstrumentedLock(name, options);
    locks.push(lock);
    return lock;
  };

  afterEach(() => {
    locks.forEach((lock) => lock.destroy());
    locks.length = 0;
  });

  test('should return the value of the callback', async () => {
    const lock = newLock('test');
    await expect(lock.acquire('key', 'op', async () => 42)).resolves.toEqual(
      42,
    );
  });

  test('should run tasks for the same key serially', async () => {
    const lock = newLock('test');
    const order: number[] = [];

    const first = lock.acquire('key', 'first', async () => {
      order.push(1);
      await new Promise((resolve) => setTimeout(resolve, 5));
      order.push(2);
    });
    const second = lock.acquire('key', 'second', async () => {
      order.push(3);
    });

    await Promise.all([first, second]);
    expect(order).toEqual([1, 2, 3]);
  });

  test('should track the holder and waiters in the snapshot', async () => {
    const lock = newLock('test');
    const holder = deferred();

    const held = lock.acquire('key', 'holder', () => holder.promise);
    const waiter = lock.acquire('key', 'waiter', async () => {});

    const entry = InstrumentedLock.snapshot().find(
      (e) => e.name === 'test' && e.key === 'key',
    );
    expect(entry).toBeDefined();
    expect(entry!.op).toEqual('holder');
    expect(entry!.pending).toEqual(1);
    expect(entry!.holdAgeMs).toBeGreaterThanOrEqual(0);

    holder.resolve();
    await Promise.all([held, waiter]);

    expect(lock.isBusy('key')).toEqual(false);
  });

  test('should reflect whether a key is busy', async () => {
    const lock = newLock('test');
    const holder = deferred();

    expect(lock.isBusy('key')).toEqual(false);
    const held = lock.acquire('key', 'holder', () => holder.promise);
    expect(lock.isBusy('key')).toEqual(true);

    holder.resolve();
    await held;
    expect(lock.isBusy('key')).toEqual(false);
  });

  test('should enrich the queue overflow error with the stuck holder', async () => {
    const lock = newLock('eipSigner', { maxPending: 1 });
    const holder = deferred();

    const held = lock.acquire(
      'refundSignature',
      'holder',
      () => holder.promise,
    );
    const waiter = lock.acquire('refundSignature', 'waiter', async () => {});

    await expect(
      lock.acquire('refundSignature', 'overflowed', async () => {}),
    ).rejects.toThrow(
      /^lock eipSigner\.refundSignature overflow \(op=overflowed\); holder=holder held for \d+ms, 1 pending$/,
    );

    const entry = InstrumentedLock.snapshot().find(
      (e) => e.name === 'eipSigner' && e.key === 'refundSignature',
    );
    expect(entry!.rejections).toEqual(1);
    expect(entry!.pending).toEqual(1);

    holder.resolve();
    await Promise.all([held, waiter]);
  });

  test('should not count an error thrown inside the callback as a rejection', async () => {
    const lock = newLock('test');

    await expect(
      lock.acquire('key', 'op', async () => {
        throw new Error('boom');
      }),
    ).rejects.toThrow('boom');

    const entry = InstrumentedLock.snapshot().find(
      (e) => e.name === 'test' && e.key === 'key',
    );
    expect(entry?.rejections ?? 0).toEqual(0);
    expect(entry?.pending ?? 0).toEqual(0);
  });

  test('should release the lock after the callback throws', async () => {
    const lock = newLock('test');

    await expect(
      lock.acquire('key', 'op', async () => {
        throw new Error('boom');
      }),
    ).rejects.toThrow('boom');

    // The lock must not be wedged: the next acquirer can still run
    await expect(
      lock.acquire('key', 'op', async () => 'next'),
    ).resolves.toEqual('next');
    expect(lock.isBusy('key')).toEqual(false);
  });

  test('should run tasks for different keys concurrently', async () => {
    const lock = newLock('test');
    const blocker = deferred();
    const order: string[] = [];

    const a = lock.acquire('keyA', 'op', async () => {
      order.push('a-start');
      await blocker.promise;
      order.push('a-end');
    });
    const b = lock.acquire('keyB', 'op', async () => {
      order.push('b');
    });

    // "keyB" finishes while "keyA" is still held: different keys don't serialize
    await b;
    expect(order).toEqual(['a-start', 'b']);

    blocker.resolve();
    await a;
  });

  test('should remove the lock from the snapshot when destroyed', async () => {
    const lock = newLock('willBeDestroyed');
    const holder = deferred();
    const held = lock.acquire('key', 'op', () => holder.promise);

    expect(
      InstrumentedLock.snapshot().some((e) => e.name === 'willBeDestroyed'),
    ).toEqual(true);

    lock.destroy();
    expect(
      InstrumentedLock.snapshot().some((e) => e.name === 'willBeDestroyed'),
    ).toEqual(false);

    holder.resolve();
    await held;
  });

  describe('tracing', () => {
    let spans: {
      setAttribute: jest.Mock;
      setStatus: jest.Mock;
      end: jest.Mock;
    }[];
    let startSpan: jest.Mock;
    let originalTracer: typeof Tracing.tracer;

    beforeEach(() => {
      spans = [];
      startSpan = jest.fn(() => {
        const span = {
          setAttribute: jest.fn(),
          setStatus: jest.fn(),
          end: jest.fn(),
        };
        spans.push(span);
        return span;
      });

      originalTracer = Tracing.tracer;
      Tracing.tracer = { startSpan } as unknown as typeof Tracing.tracer;
    });

    afterEach(() => {
      Tracing.tracer = originalTracer;
    });

    test('should start a span with the lock attributes and end it', async () => {
      const lock = newLock('myLock');

      await expect(
        lock.acquire('myKey', 'myOp', async () => 'done'),
      ).resolves.toEqual('done');

      expect(startSpan).toHaveBeenCalledWith('lock myLock myOp', {
        kind: SpanKind.INTERNAL,
        attributes: {
          'lock.name': 'myLock',
          'lock.key': 'myKey',
          'lock.op': 'myOp',
        },
      });

      const span = spans[0];
      expect(span.setAttribute).toHaveBeenCalledWith(
        'lock.wait_ms',
        expect.any(Number),
      );
      expect(span.setAttribute).toHaveBeenCalledWith(
        'lock.held_ms',
        expect.any(Number),
      );
      expect(span.setStatus).not.toHaveBeenCalled();
      expect(span.end).toHaveBeenCalledTimes(1);
    });

    test('should mark the span as errored when the callback throws', async () => {
      const lock = newLock('myLock');

      await expect(
        lock.acquire('myKey', 'myOp', async () => {
          throw new Error('boom');
        }),
      ).rejects.toThrow('boom');

      const span = spans[0];
      expect(span.setStatus).toHaveBeenCalledWith({
        code: SpanStatusCode.ERROR,
        message: expect.stringContaining('boom'),
      });
      expect(span.end).toHaveBeenCalledTimes(1);
    });

    test('should mark the span as errored on queue overflow', async () => {
      const lock = newLock('myLock', { maxPending: 1 });
      const holder = deferred();

      const held = lock.acquire('myKey', 'holder', () => holder.promise);
      const waiter = lock.acquire('myKey', 'waiter', async () => {});

      await expect(
        lock.acquire('myKey', 'overflowed', async () => {}),
      ).rejects.toThrow(/overflow/);

      // Spans are created in call order: holder, waiter, then the rejected task
      const overflowSpan = spans[2];
      expect(overflowSpan.setStatus).toHaveBeenCalledWith({
        code: SpanStatusCode.ERROR,
        message: expect.stringContaining('overflow'),
      });
      expect(overflowSpan.end).toHaveBeenCalledTimes(1);

      holder.resolve();
      await Promise.all([held, waiter]);
    });

    test('should accept a synchronous callback', async () => {
      const lock = newLock('myLock');

      await expect(
        lock.acquire('myKey', 'myOp', () => 'syncDone'),
      ).resolves.toEqual('syncDone');

      expect(startSpan).toHaveBeenCalledWith('lock myLock myOp', {
        kind: SpanKind.INTERNAL,
        attributes: {
          'lock.name': 'myLock',
          'lock.key': 'myKey',
          'lock.op': 'myOp',
        },
      });

      const span = spans[0];
      expect(span.setAttribute).toHaveBeenCalledWith(
        'lock.wait_ms',
        expect.any(Number),
      );
      expect(span.setAttribute).toHaveBeenCalledWith(
        'lock.held_ms',
        expect.any(Number),
      );
      expect(span.end).toHaveBeenCalledTimes(1);
    });
  });
});
