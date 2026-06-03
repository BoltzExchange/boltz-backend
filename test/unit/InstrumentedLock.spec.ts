import InstrumentedLock from '../../lib/InstrumentedLock';

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
});
