import { elementsClient } from '../Nodes';

jest.mock('../../../lib/db/repositories/ChainTipRepository');

describe('ElementsClient', () => {
  afterAll(() => {
    elementsClient.disconnect();
  });

  describe('getNewAddress', () => {
    test('should add label', async () => {
      const label = 'test';
      const address = await elementsClient.getNewAddress(label);
      const { labels } = await elementsClient.getAddressInfo(address);
      expect(labels).toEqual([label]);
    });
  });

  describe('sendToAddress', () => {
    test('should add label', async () => {
      const label = 'test tx';
      const transactionId = await elementsClient.sendToAddress(
        await elementsClient.getNewAddress(''),
        100_000,
        undefined,
        false,
        label,
      );
      const { comment } =
        await elementsClient.getWalletTransaction(transactionId);
      expect(comment).toEqual(label);
    });
  });

  describe('getWalletTransaction', () => {
    test('should return wallet transaction with normalized fee and amount', async () => {
      const transactionId = await elementsClient.sendToAddress(
        await elementsClient.getNewAddress(''),
        50_000,
        undefined,
        false,
        'test wallet tx',
      );

      const result = await elementsClient.getWalletTransaction(transactionId);

      expect(result.hex).toBeDefined();
      expect(result.comment).toEqual('test wallet tx');
      // Fee and amount should be normalized to numbers (not { bitcoin: number } objects)
      expect(typeof result.fee).toEqual('number');
      expect(typeof result.amount).toEqual('number');
    });
  });
});
