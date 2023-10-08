export const racePromise = async <T>(
  promise: (() => Promise<T>) | Promise<T>,
  raceHandler: (reason?: any) => void,
  raceTimeout: number,
): Promise<T> => {
  let timeout: NodeJS.Timeout | undefined = undefined;

  const timeoutPromise = new Promise<T>((_, reject) => {
    timeout = setTimeout(() => raceHandler(reject), raceTimeout);
  });

  const res = await Promise.race([
    promise instanceof Promise ? promise : promise(),
    timeoutPromise,
  ]);

  if (timeout !== undefined) {
    clearTimeout(timeout);
  }
  return res;
};
