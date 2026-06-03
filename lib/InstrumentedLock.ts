import AsyncLock from 'async-lock';

type HeldEntry = {
  op: string;
  since: number;
};

type LockSnapshotEntry = {
  name: string;
  key: string;
  // The operation currently holding the lock, undefined if it is not held
  op?: string;
  holdAgeMs: number;
  pending: number;
  rejections: number;
};

/**
 * Thin wrapper around {@link AsyncLock} that records, per lock key, which
 * operation currently holds the lock, how many tasks are waiting for it and how
 * often the queue overflowed. This makes "Too many pending tasks in queue"
 * rejections debuggable: the rejection (which {@link AsyncLock} delivers to the
 * waiter, not the holder) is enriched with the stuck holder and queue depth, and
 * the live state is exposed via {@link InstrumentedLock.snapshot} for metrics.
 */
class InstrumentedLock {
  private static readonly instances = new Set<InstrumentedLock>();

  private readonly lock: AsyncLock;

  // Current holder per key (one at a time, since the lock serializes)
  private readonly held = new Map<string, HeldEntry>();
  // Number of tasks currently waiting to acquire each key
  private readonly pending = new Map<string, number>();
  // Cumulative number of tasks rejected because the queue was full
  private readonly rejections = new Map<string, number>();

  constructor(
    public readonly name: string,
    options?: ConstructorParameters<typeof AsyncLock>[0],
  ) {
    this.lock = new AsyncLock(options);
    InstrumentedLock.instances.add(this);
  }

  public acquire = async <T>(
    key: string,
    op: string,
    cb: () => Promise<T>,
  ): Promise<T> => {
    this.changePending(key, 1);

    let entered = false;

    try {
      return await this.lock.acquire(key, async () => {
        entered = true;
        this.changePending(key, -1);
        this.held.set(key, { op, since: Date.now() });

        try {
          return await cb();
        } finally {
          this.held.delete(key);
        }
      });
    } catch (error) {
      if (!entered) {
        // The task never started, so its pending slot was never cleared
        this.changePending(key, -1);

        if (InstrumentedLock.isOverflowError(error)) {
          this.rejections.set(key, (this.rejections.get(key) ?? 0) + 1);
          throw new Error(this.formatOverflowError(key, op));
        }
      }

      throw error;
    }
  };

  public isBusy = (key?: string): boolean => this.lock.isBusy(key);

  public destroy = (): void => {
    InstrumentedLock.instances.delete(this);
  };

  private changePending = (key: string, delta: number): void => {
    this.pending.set(key, Math.max(0, (this.pending.get(key) ?? 0) + delta));
  };

  private formatOverflowError = (key: string, op: string): string => {
    const holder = this.held.get(key);
    const heldFor = holder === undefined ? 0 : Date.now() - holder.since;

    return (
      `lock ${this.name}.${key} overflow (op=${op}); ` +
      `holder=${holder?.op ?? 'none'} held for ${heldFor}ms, ` +
      `${this.pending.get(key) ?? 0} pending`
    );
  };

  private static isOverflowError = (error: unknown): boolean =>
    error instanceof Error && error.message.includes('Too many pending tasks');

  public static snapshot = (): LockSnapshotEntry[] => {
    const now = Date.now();
    const entries: LockSnapshotEntry[] = [];

    for (const instance of InstrumentedLock.instances) {
      const keys = new Set<string>([
        ...instance.pending.keys(),
        ...instance.held.keys(),
        ...instance.rejections.keys(),
      ]);

      for (const key of keys) {
        const holder = instance.held.get(key);
        entries.push({
          name: instance.name,
          key,
          op: holder?.op,
          holdAgeMs: holder === undefined ? 0 : now - holder.since,
          pending: instance.pending.get(key) ?? 0,
          rejections: instance.rejections.get(key) ?? 0,
        });
      }
    }

    return entries;
  };
}

export default InstrumentedLock;
export { LockSnapshotEntry };
