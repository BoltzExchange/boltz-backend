import Logger from '../../../../lib/Logger';
import Database from '../../../../lib/db/Database';
import Pair from '../../../../lib/db/models/Pair';
import Swap from '../../../../lib/db/models/Swap';
import SwapRepository from '../../../../lib/db/repositories/SwapRepository';
import { createSubmarineSwapData } from './Fixtures';

describe('SwapRepository', () => {
  let database: Database;

  beforeAll(async () => {
    database = new Database(Logger.disabledLogger, Database.memoryDatabase);
    await database.init();
    await Pair.create({
      base: 'BTC',
      quote: 'BTC',
      id: 'BTC/BTC',
    });
  });

  beforeEach(async () => {
    await Swap.destroy({
      truncate: true,
    });
  });

  afterAll(async () => {
    await database.close();
  });

  describe('disableZeroConf', () => {
    test('should disable 0-conf', async () => {
      const swaps: Swap[] = [];

      for (let i = 0; i < 3; i++) {
        swaps.push(await Swap.create(createSubmarineSwapData(true)));
      }

      expect(swaps.every((s) => s.acceptZeroConf)).toEqual(true);

      await SwapRepository.disableZeroConf([swaps[0], swaps[1]]);

      expect(
        (await SwapRepository.getSwap({
          id: swaps[0].id,
        }))!.acceptZeroConf,
      ).toEqual(false);
      expect(
        (await SwapRepository.getSwap({
          id: swaps[1].id,
        }))!.acceptZeroConf,
      ).toEqual(false);
      expect(
        (await SwapRepository.getSwap({
          id: swaps[2].id,
        }))!.acceptZeroConf,
      ).toEqual(true);
    });

    test('should ignore when no swaps are given as parameter', async () => {
      const swaps: Swap[] = [];

      for (let i = 0; i < 3; i++) {
        swaps.push(await Swap.create(createSubmarineSwapData(true)));
      }

      await SwapRepository.disableZeroConf([]);

      for (const swap of swaps) {
        expect(
          (await SwapRepository.getSwap({
            id: swap.id,
          }))!.acceptZeroConf,
        ).toEqual(true);
      }
    });
  });
});
