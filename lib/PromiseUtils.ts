export const racePromise = async <T>(
  promise: (() => Promise<T>) | Promise<T>,
  raceHandler: (reason?: any) => void,
  raceTimeout: number,
): Promise<T> => {
  let timeout: NodeJS.Timeout | undefined = undefined;

  const timeoutPromise = new Promise<T>((_, reject) => {
    timeout = setTimeout(() => raceHandler(reject), raceTimeout);
  });

  try {
    const res = await Promise.race([
      promise instanceof Promise ? promise : promise(),
      timeoutPromise,
    ]);

    if (timeout !== undefined) {
      clearTimeout(timeout);
    }
    return res;
  } catch (e) {
    if (timeout !== undefined) {
      clearTimeout(timeout);
    }

    throw e;
  }
};

export const allSettled = async <T>(promises: Promise<T>[]): Promise<T[]> => {
  const settled = await Promise.allSettled(promises);
  const results = settled
    .filter(
      (res): res is PromiseFulfilledResult<Awaited<T>> =>
        res.status === 'fulfilled',
    )
    .map((res) => res.value);

  if (results.length === 0) {
    throw (settled[0] as PromiseRejectedResult).reason;
  }

  return results;
};

export const allSettledFirst = async <T>(promises: Promise<T>[]): Promise<T> =>
  (await allSettled(promises))[0];

export const filterAsync = async <T>(
  arr: T[],
  predicate: (p: T) => Promise<boolean>,
): Promise<T[]> => {
  const results = await Promise.all(arr.map(predicate));
  return arr.filter((_, index) => results[index]);
};

export const sleep = (time: number) =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, time);
  });
