import { createSwap } from './Utils';
import Report from '../../../lib/data/Report';
import Swap from '../../../lib/db/models/Swap';
import ReverseSwap from '../../../lib/db/models/ReverseSwap';
import SwapRepository from '../../../lib/db/repositories/SwapRepository';
import ReverseSwapRepository from '../../../lib/db/repositories/ReverseSwapRepository';

const swaps: Swap[] = [];

jest.mock('../../../lib/db/repositories/SwapRepository', () => {
  return jest.fn().mockImplementation(() => {
    return {
      getSwaps: () => Promise.resolve(swaps),
    };
  });
});

const mockedSwapRepository = <jest.Mock<SwapRepository>><any>SwapRepository;

const reverseSwaps: ReverseSwap[] = [];

jest.mock('../../../lib/db/repositories/ReverseSwapRepository', () => {
  return jest.fn().mockImplementation(() => {
    return {
      getReverseSwaps: () => Promise.resolve(reverseSwaps),
    };
  });
});

const mockedReverseSwapRepository = <jest.Mock<ReverseSwapRepository>><any>ReverseSwapRepository;

describe('Report', () => {
  const report = new Report(
    mockedSwapRepository(),
    mockedReverseSwapRepository(),
  );

  beforeAll(() => {
    for (let i = 0; i < 2; i += 1) {
      const swapMock = createSwap<Swap>(true, i !== 1, {});
      const reverseSwapMock = createSwap<ReverseSwap>(false, i !== 1, {});

      swaps.push(swapMock);
      reverseSwaps.push(reverseSwapMock);
    }
  });

  test('should format months', () => {
    expect(Report.getMonth(new Date())).toEqual(new Date().getMonth() + 1);
  });

  test('should generate reports', async () => {
    const csv = await report.generate();
    const formatDate = report['formatDate'](new Date(swaps[0].createdAt));

    expect(csv).toEqual(
      // tslint:disable-next-line: prefer-template
      'date,pair,type,orderSide,failed,minerFee,routingFee,fee,feeCurrency\n' +

      `${formatDate},LTC/BTC,Lightning/Chain,buy,false,0.00010000,0.001,0.00001000,BTC\n` +
      `${formatDate},LTC/BTC,Chain/Lightning,sell,false,0.00010000,0.001,0.00001000,LTC\n` +
      `${formatDate},LTC/BTC,Chain/Lightning,buy,false,0.00010000,0.000,0.00001000,LTC\n` +
      `${formatDate},LTC/BTC,Lightning/Chain,sell,false,0.00010000,0.000,0.00001000,BTC\n` +
      `${formatDate},LTC/BTC,Lightning/Chain,buy,true,0.00010000,0.001,0.00001000,BTC\n` +
      `${formatDate},LTC/BTC,Chain/Lightning,sell,true,0.00010000,0.001,0.00001000,LTC\n` +
      `${formatDate},LTC/BTC,Chain/Lightning,buy,true,0.00010000,0.000,0.00001000,LTC\n` +
      `${formatDate},LTC/BTC,Lightning/Chain,sell,true,0.00010000,0.000,0.00001000,BTC`,
    );
  });
});
