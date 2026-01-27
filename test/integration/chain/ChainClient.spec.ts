import Rebroadcaster from '../../../lib/chain/Rebroadcaster';
import ChainTipRepository from '../../../lib/db/repositories/ChainTipRepository';
import { bitcoinClient } from '../Nodes';

const mockFindOrCreateTip = jest.fn().mockImplementation(async () => {
  return {};
});
const mockUpdateTip = jest.fn().mockImplementation();

jest.mock('../../../lib/db/repositories/ChainTipRepository');

describe('ChainClient', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    ChainTipRepository.updateTip = mockUpdateTip;
    ChainTipRepository.findOrCreateTip = mockFindOrCreateTip;
  });

  afterAll(async () => {
    bitcoinClient.disconnect();
  });

  test('should init', async () => {
    await bitcoinClient.generate(1);
  });

  test('should format getTransaction errors', async () => {
    const txId =
      '277014b6ff0b872dbd6dbfe506b1bfc7b5467a4096a0a27a06b0924423541e33';
    const expectedError = `No such mempool or blockchain transaction. Use gettransaction for wallet transactions. ID: ${txId}`;

    await expect(bitcoinClient.getRawTransaction(txId)).rejects.toEqual(
      expectedError,
    );
    await expect(bitcoinClient.getRawTransactionVerbose(txId)).rejects.toEqual(
      expectedError,
    );
  });

  describe('getNewAddress', () => {
    test('should add label', async () => {
      const label = 'data';
      const address = await bitcoinClient.getNewAddress(label);
      const { labels } = await bitcoinClient.getAddressInfo(address);
      expect(labels).toEqual([label]);
    });
  });

  describe('sendToAddress', () => {
    test('should add label', async () => {
      const label = 'data';
      const transactionId = await bitcoinClient.sendToAddress(
        await bitcoinClient.getNewAddress(''),
        100_000,
        undefined,
        false,
        label,
      );
      const { comment } =
        await bitcoinClient.getWalletTransaction(transactionId);
      expect(comment).toEqual(label);
    });
  });

  describe('sendRawTransaction', () => {
    test('should save rebroadcast for relevant errors', async () => {
      Rebroadcaster.isReasonToRebroadcast = jest.fn().mockReturnValue(true);
      bitcoinClient['rebroadcaster'].save = jest.fn();

      const rawTx = 'tx';
      await expect(bitcoinClient.sendRawTransaction(rawTx)).rejects.toEqual(
        expect.anything(),
      );

      expect(Rebroadcaster.isReasonToRebroadcast).toHaveBeenCalledTimes(1);
      expect(bitcoinClient['rebroadcaster'].save).toHaveBeenCalledTimes(1);
      expect(bitcoinClient['rebroadcaster'].save).toHaveBeenCalledWith(rawTx);
    });
  });
});
