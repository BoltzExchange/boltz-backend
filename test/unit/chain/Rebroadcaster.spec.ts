import Logger from '../../../lib/Logger';
import ChainClient from '../../../lib/chain/ChainClient';
import Rebroadcaster from '../../../lib/chain/Rebroadcaster';
import RebroadcastRepository from '../../../lib/db/repositories/RebroadcastRepository';

describe('Rebroadcaster', () => {
  let emitBlock: () => void;

  const client = {
    symbol: 'BTC',
    on: jest.fn().mockImplementation((event: string, cb: () => void) => {
      if (event === 'block') {
        emitBlock = cb;
      }
    }),
  } as any as ChainClient;
  let rebroadcaster: Rebroadcaster;

  beforeEach(() => {
    rebroadcaster = new Rebroadcaster(Logger.disabledLogger, client);

    jest.clearAllMocks();
  });

  test.each`
    reason                                                   | expected
    ${'too-long-mempool-chain, too many descendants for tx'} | ${true}
    ${'bad-txns-inputs-missingorspent'}                      | ${false}
    ${'Transaction outputs already in utxo set'}             | ${false}
  `('should check if isReasonToRebroadcast', ({ reason, expected }) => {
    expect(Rebroadcaster.isReasonToRebroadcast(reason)).toEqual(expected);
  });

  describe('constructor', () => {
    test('should rebroadcast when a new block is received', async () => {
      rebroadcaster = new Rebroadcaster(Logger.disabledLogger, client);
      rebroadcaster['rebroadcast'] = jest.fn();

      expect(client.on).toHaveBeenCalledTimes(1);
      expect(client.on).toHaveBeenCalledWith('block', expect.any(Function));

      emitBlock();

      expect(rebroadcaster['rebroadcast']).toHaveBeenCalledTimes(1);
    });

    test('should not error when rebroadcast on block failed', async () => {
      rebroadcaster = new Rebroadcaster(Logger.disabledLogger, client);
      rebroadcaster['rebroadcast'] = jest.fn().mockRejectedValue('big crash');

      emitBlock();

      expect(rebroadcaster['rebroadcast']).toHaveBeenCalledTimes(1);
    });
  });

  describe('save', () => {
    const rawTx = 'tx';

    test('should save raw transactions', async () => {
      RebroadcastRepository.get = jest.fn().mockReturnValue(null);
      RebroadcastRepository.add = jest.fn();

      await rebroadcaster.save(rawTx);

      expect(RebroadcastRepository.get).toHaveBeenCalledTimes(1);
      expect(RebroadcastRepository.get).toHaveBeenCalledWith(rawTx);

      expect(RebroadcastRepository.add).toHaveBeenCalledTimes(1);
      expect(RebroadcastRepository.add).toHaveBeenCalledWith(
        client.symbol,
        rawTx,
      );
    });

    test('should not save raw transactions if already saved', async () => {
      RebroadcastRepository.get = jest.fn().mockReturnValue({});
      RebroadcastRepository.add = jest.fn();

      await rebroadcaster.save(rawTx);

      expect(RebroadcastRepository.get).toHaveBeenCalledTimes(1);
      expect(RebroadcastRepository.get).toHaveBeenCalledWith(rawTx);

      expect(RebroadcastRepository.add).toHaveBeenCalledTimes(0);
    });
  });

  describe('rebroadcast', () => {
    test('should delete transactions that have been broadcast successfully', async () => {
      client.sendRawTransaction = jest.fn().mockReturnValue('id');

      const rawTransaction = 'tx';
      RebroadcastRepository.getForSymbol = jest
        .fn()
        .mockResolvedValue([{ rawTransaction }]);

      RebroadcastRepository.delete = jest.fn();

      await rebroadcaster['rebroadcast']();

      expect(RebroadcastRepository.getForSymbol).toHaveBeenCalledTimes(1);
      expect(RebroadcastRepository.getForSymbol).toHaveBeenCalledWith(
        client.symbol,
      );

      expect(client.sendRawTransaction).toHaveBeenCalledTimes(1);
      expect(client.sendRawTransaction).toHaveBeenCalledWith(rawTransaction);

      expect(RebroadcastRepository.delete).toHaveBeenCalledTimes(1);
      expect(RebroadcastRepository.delete).toHaveBeenCalledWith(rawTransaction);
    });

    test('should delete transactions that failed to broadcast with an error that should not be rebroadcast', async () => {
      client.sendRawTransaction = jest
        .fn()
        .mockRejectedValue('bad-txns-inputs-missingorspent');

      const rawTransaction = 'tx';
      RebroadcastRepository.getForSymbol = jest
        .fn()
        .mockResolvedValue([{ rawTransaction }]);

      RebroadcastRepository.delete = jest.fn();

      await rebroadcaster['rebroadcast']();

      expect(RebroadcastRepository.delete).toHaveBeenCalledTimes(1);
      expect(RebroadcastRepository.delete).toHaveBeenCalledWith(rawTransaction);
    });

    test('should delete transactions that failed to broadcast with an error that should be rebroadcast', async () => {
      client.sendRawTransaction = jest
        .fn()
        .mockRejectedValue('too-long-mempool-chain');

      const rawTransaction = 'tx';
      RebroadcastRepository.getForSymbol = jest
        .fn()
        .mockResolvedValue([{ rawTransaction }]);

      RebroadcastRepository.delete = jest.fn();

      await rebroadcaster['rebroadcast']();

      expect(RebroadcastRepository.delete).not.toHaveBeenCalled();
    });
  });
});
