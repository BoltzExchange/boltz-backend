import {
  allSettled,
  allSettledFirst,
  filterAsync,
  racePromise,
} from '../../lib/PromiseUtils';

describe('PromiseUtils', () => {
  beforeAll(() => {
    jest.useFakeTimers();
  });

  describe('racePromise', () => {
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

      const promise = racePromise(
        new Promise<void>(() => {}),
        raceHandler,
        1000,
      );
      jest.runOnlyPendingTimers();

      await expect(promise).rejects.toEqual(rejectionMessage);
      expect(raceHandler).toHaveBeenCalledTimes(1);
    });

    test('should not call raceHandler when promise throws', async () => {
      const raceMessage = 'rejected after timeout';
      const raceHandler = jest
        .fn()
        .mockImplementation((reject) => reject(raceMessage));

      const promiseRejection = 'promise threw';
      const promise = racePromise(
        new Promise<void>((_, reject) => reject(promiseRejection)),
        raceHandler,
        1000,
      );
      await expect(promise).rejects.toEqual(promiseRejection);

      jest.runOnlyPendingTimers();
      expect(raceHandler).not.toHaveBeenCalled();
    });
  });

  describe('allSettled', () => {
    test('should return all settled promises', async () => {
      await expect(
        allSettled([
          new Promise((resolve) => resolve(1)),
          new Promise((resolve) => resolve(2)),
          new Promise((resolve) => resolve(3)),
        ]),
      ).resolves.toEqual([1, 2, 3]);
    });

    test('should return only settled promises', async () => {
      await expect(
        allSettled([
          new Promise((resolve) => resolve(1)),
          new Promise((_, reject) => reject('no')),
          new Promise((resolve) => resolve(3)),
        ]),
      ).resolves.toEqual([1, 3]);
    });

    test('should throw when all throw', async () => {
      await expect(
        allSettled([
          new Promise((_, reject) => reject('error 1')),
          new Promise((_, reject) => reject('error 2')),
          new Promise((_, reject) => reject('error 3')),
        ]),
      ).rejects.toEqual('error 1');
    });
  });

  describe('allSettledFirst', () => {
    test('should return only first resolved promise result', async () => {
      await expect(
        allSettledFirst([
          new Promise((resolve) => resolve(1)),
          new Promise((resolve) => resolve(2)),
          new Promise((resolve) => resolve(3)),
        ]),
      ).resolves.toEqual(1);
    });

    test('should throw when all throw', async () => {
      await expect(
        allSettled([
          new Promise((_, reject) => reject('error 1')),
          new Promise((_, reject) => reject('error 2')),
          new Promise((_, reject) => reject('error 3')),
        ]),
      ).rejects.toEqual('error 1');
    });
  });

  describe('filterAsync', () => {
    test('should filter with Promise predicates', async () => {
      const arr = [1, 2, 3, 4];

      await expect(
        filterAsync(arr, async (param) => param % 2 === 0),
      ).resolves.toEqual([2, 4]);
    });
  });
});
