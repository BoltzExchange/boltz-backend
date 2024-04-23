import Logger from '../../../lib/Logger';
import ElementsClient from '../../../lib/chain/ElementsClient';

describe('ElementsClient', () => {
  test.each`
    lowball  | expected
    ${false} | ${0.11}
    ${true}  | ${0.01}
  `(
    'should set estimate sat/vbyte fee of $expected for lowball ($lowball)',
    async ({ lowball, expected }) => {
      const client = new ElementsClient(
        Logger.disabledLogger,
        {
          host: '127.0.0.1',
          port: 123,
          user: 'good',
          password: 'morning',
        },
        lowball,
      );

      await expect(client.estimateFee()).resolves.toEqual(expected);
    },
  );
});
