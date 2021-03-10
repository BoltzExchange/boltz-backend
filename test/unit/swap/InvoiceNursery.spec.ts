import { Op } from 'sequelize';
import Logger from '../../../lib/Logger';
import { createInvoice } from './InvoiceUtils';
import { getUnixTime } from '../../../lib/Utils';
import { SwapUpdateEvent } from '../../../lib/consts/Enums';
import InvoiceNursery from '../../../lib/swap/InvoiceNursery';
import ReverseSwapRepository from '../../../lib/db/ReverseSwapRepository';

let mockGetReverseSwapsResult: any[] = [];
const mockGetReverseSwaps = jest.fn().mockImplementation(async () => {
  return mockGetReverseSwapsResult;
});

const mockSetReverseSwapStatus = jest.fn().mockImplementation(async (reverseSwap, status) => {
  return {
    ...reverseSwap,
    status,
  };
});

jest.mock('../../../lib/db/ReverseSwapRepository', () => {
  return jest.fn().mockImplementation(() => ({
    getReverseSwaps: mockGetReverseSwaps,
    setReverseSwapStatus: mockSetReverseSwapStatus,
  }));
});

const mockedReverseSwapRepository = <jest.Mock<ReverseSwapRepository>><any>ReverseSwapRepository;

describe('InvoiceNursery', () => {
  const nursery = new InvoiceNursery(
    Logger.disabledLogger,
    mockedReverseSwapRepository(),
  );

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetReverseSwapsResult = [];
  });

  afterEach(() => {
    nursery.destroy();
  });

  test('should init', async () => {
    await nursery.init();

    expect(nursery['interval']).toBeDefined();

    // The check for expired invoices should run on initialization but not find anything because the database query returns no results
    expect(mockGetReverseSwapsResult.length).toEqual(0);

    expect(mockGetReverseSwaps).toHaveBeenCalledTimes(1);
    expect(mockGetReverseSwaps).toHaveBeenCalledWith({
      status: {
        [Op.or]: [
          SwapUpdateEvent.SwapCreated,
          SwapUpdateEvent.MinerFeePaid,
        ],
      },
    });

    expect(mockSetReverseSwapStatus).toHaveBeenCalledTimes(0);
  });

  test('should check expired invoices', async () => {
    const currentTime = getUnixTime();

    const invoice = createInvoice(undefined, currentTime);
    const expiredInvoice = createInvoice(undefined, currentTime - (3600 * 2));

    mockGetReverseSwapsResult = [
      { invoice },
      { invoice: expiredInvoice },
    ];

    let eventsEmitted = 0;

    nursery.on('invoice.expired', (reverseSwap) => {
      expect(reverseSwap).toEqual({
        ...mockGetReverseSwapsResult[1],
        status: SwapUpdateEvent.InvoiceExpired,
      });

      eventsEmitted += 1;
    });

    await nursery['checkExpiredInvoices']();

    expect(eventsEmitted).toEqual(1);

    expect(mockGetReverseSwaps).toHaveBeenCalledTimes(1);
    expect(mockGetReverseSwaps).toHaveBeenCalledWith({
      status: {
        [Op.or]: [
          SwapUpdateEvent.SwapCreated,
          SwapUpdateEvent.MinerFeePaid,
        ],
      },
    });

    expect(mockSetReverseSwapStatus).toHaveBeenCalledTimes(1);
    expect(mockSetReverseSwapStatus).toHaveBeenCalledWith(mockGetReverseSwapsResult[1], SwapUpdateEvent.InvoiceExpired);
  });
});
