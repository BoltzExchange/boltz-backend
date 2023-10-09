import { racePromise } from '../../lib/PromiseUtils';

describe('PromiseUtils', () => {
  beforeAll(() => {
    jest.useFakeTimers();
  });

  test.each`
    name                              | promise                                                 | expected
    ${'Promises'}                     | ${new Promise<string>((resolve) => resolve('promise'))} | ${'promise'}
    ${'functions returning Promises'} | ${async () => 'func'}                                   | ${'func'}
  `('should resolve $name correctly', async ({ promise, expected }) => {
    await expect(
      racePromise(
        promise,
        () => {
          throw 'error callback called';
        },
        1000,
      ),
    ).resolves.toEqual(expected);
  });

  test('should call raceHandler after timeout', async () => {
    const rejectionMessage = 'rejected after timeout';
    const raceHandler = jest
      .fn()
      .mockImplementation((reject) => reject(rejectionMessage));

    const promise = racePromise(new Promise<void>(() => {}), raceHandler, 1000);
    jest.runOnlyPendingTimers();

    await expect(promise).rejects.toEqual(rejectionMessage);
    expect(raceHandler).toHaveBeenCalledTimes(1);
    expect(raceHandler).toHaveBeenCalledWith(expect.anything());
  });
});
