import { Op } from 'sequelize';
import { randomBytes } from 'crypto';
import { Networks } from 'boltz-core';
import Logger from '../../../lib/Logger';
import { Invoice } from '../../../lib/proto/lnd/rpc_pb';
import LndClient from '../../../lib/lightning/LndClient';
import { Currency } from '../../../lib/wallet/WalletManager';
import LightningNursery from '../../../lib/swap/LightningNursery';
import ReverseSwapRepository from '../../../lib/db/ReverseSwapRepository';
import { CurrencyType, SwapUpdateEvent } from '../../../lib/consts/Enums';
import { decodeInvoice, getHexBuffer, getHexString } from '../../../lib/Utils';

import InvoiceState = Invoice.InvoiceState;

type htlcAcceptedCallback = (invoice: string) => void;

let emitHtlcAccepted: htlcAcceptedCallback;

const mockOn = jest.fn().mockImplementation((event: string, callback: any) => {
  switch (event) {
    case 'htlc.accepted':
      emitHtlcAccepted = callback;
      break;
  }
});

let mockLookupInvoiceState: Invoice.InvoiceState;
const mockLookupInvoice = jest.fn().mockImplementation(async () => {
  return {
    state: mockLookupInvoiceState,
  };
});

const mockSettleInvoice = jest.fn().mockImplementation(async () => {});

jest.mock('../../../lib/lightning/LndClient', () => {
  return jest.fn().mockImplementation(() => ({
    on: mockOn,
    lookupInvoice: mockLookupInvoice,
    settleInvoice: mockSettleInvoice,
  }));
});

const MockedLndClient = <jest.Mock<LndClient>><any>LndClient;

let mockGetReverseSwapResult: any = null;
const mockGetReverseSwap = jest.fn().mockImplementation(async () => {
  return mockGetReverseSwapResult;
});

const mockSetReverseSwapStatus = jest.fn().mockImplementation(async (reverseSwap, status) => {
  return {
    status,
    ...reverseSwap,
  };
});

jest.mock('../../../lib/db/ReverseSwapRepository', () => {
  return jest.fn().mockImplementation(() => ({
    getReverseSwap: mockGetReverseSwap,
    setReverseSwapStatus: mockSetReverseSwapStatus,
  }));
});

const MockedReverseSwapRepository = <jest.Mock<ReverseSwapRepository>>ReverseSwapRepository;

describe('LightningNursery', () => {
  const invoice = 'lnbcrt1p0csqltpp5xv57wt3s57gm50jksvyhuhmahnvtaw5q5elcuhkcpf9k7jcuey6qdqqcqzpgsp5t4t0aqn5jleve60dalh9t23r6ahana9t7c8steerurtt7x0x0xts9qy9qsqsas984xcqdxrd3l7kfzhejnjky3a2hhk0zp0chn43pjp0g49g825pazmdjppqvvdqsyc6euy6lg2xatrsf3pgavs0f62pg3xagljgrcpnrn4r5';

  const minerFeeInvoicePreimage = getHexString(randomBytes(32));
  const minerFeeInvoice = 'lnbcrt21u1psprx5xpp5xa0d3f37sz5cmp34cm0hd2tujuxctw6ydge27cd0cp8k0cu5ynnsdqqcqzpgsp55tje9q5t5xnkk03tgvv50tle49gf5nxeec03lvsaal3v2hcner7q9qy9qsqdgmep4nwprmtslrztla04jyvhc7rw8gtf5kydakz95tserqcchjx6f3u3yrupuadle2rqq8w27885h33v4gysl0ch5cxa5faz3akk0sqykdymf';

  const nursery = new LightningNursery(
    Logger.disabledLogger,
    MockedReverseSwapRepository(),
  );

  const btcLndClient = MockedLndClient();
  const currencies: Currency[] = [
    {
      symbol: 'BTC',
      limits: {} as any,
      lndClient: btcLndClient,
      type: CurrencyType.BitcoinLike,
      network: Networks.bitcoinRegtest,
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    nursery.removeAllListeners();

    mockGetReverseSwapResult = null;
  });

  test('should bind currencies', () => {
    nursery.bindCurrencies(currencies);

    expect(mockOn).toHaveBeenCalledTimes(1);
    expect(mockOn).toHaveBeenCalledWith('htlc.accepted', expect.anything());
  });

  test('should ignore accepted HTLCs with no association to a Reverse Swap', async () => {
    let eventsEmitted = 0;

    nursery.on('invoice.paid', (reverseSwap) => {
      expect(reverseSwap).toEqual(mockGetReverseSwapResult);

      eventsEmitted += 1;
    });

    mockGetReverseSwapResult = null;
    await emitHtlcAccepted(invoice);

    expect(mockGetReverseSwap).toHaveBeenCalledTimes(1);
    expect(mockGetReverseSwap).toHaveBeenCalledWith({
      [Op.or]: [
        {
          invoice: {
            [Op.eq]: invoice,
          },
        },
        {
          minerFeeInvoice: {
            [Op.eq]: invoice,
          },
        },
      ],
    });

    expect(eventsEmitted).toEqual(0);
  });

  test('should handle Reverse Swaps without prepay miner fee', async () => {
    let eventsEmitted = 0;

    nursery.on('invoice.paid', (reverseSwap) => {
      expect(reverseSwap).toEqual(mockGetReverseSwapResult);

      eventsEmitted += 1;
    });

    mockGetReverseSwapResult = {
      invoice,
      minerFeeInvoicePreimage: null,
    };

    await emitHtlcAccepted(invoice);

    expect(mockLookupInvoice).toHaveBeenCalledTimes(0);
    expect(mockSettleInvoice).toHaveBeenCalledTimes(0);
    expect(mockGetReverseSwap).toHaveBeenCalledTimes(1);

    expect(eventsEmitted).toEqual(1);
  });

  test('should handle the miner fee invoice being paid first', async () => {
    let eventsEmitted = 0;

    nursery.on('minerfee.invoice.paid', (reverseSwap) => {
      expect(reverseSwap).toEqual({
        ...mockGetReverseSwapResult,
        status: SwapUpdateEvent.MinerFeePaid,
      });
      eventsEmitted += 1;
    });

    mockLookupInvoiceState = InvoiceState.OPEN;

    mockGetReverseSwapResult = {
      invoice,
      minerFeeInvoice,
      minerFeeInvoicePreimage,
    };

    // Accept HTLC(s) for the miner fee invoice
    await emitHtlcAccepted(minerFeeInvoice);

    expect(eventsEmitted).toEqual(1);

    expect(mockLookupInvoice).toHaveBeenCalledTimes(1);
    expect(mockLookupInvoice).toHaveBeenCalledWith(getHexBuffer(decodeInvoice(invoice).paymentHash!));

    expect(mockSettleInvoice).toHaveBeenCalledTimes(0);
    expect(mockGetReverseSwap).toHaveBeenCalledTimes(1);

    nursery.on('invoice.paid', (reverseSwap) => {
      expect(reverseSwap).toEqual(mockGetReverseSwapResult);
      eventsEmitted += 1;
    });

    mockGetReverseSwapResult.status = SwapUpdateEvent.MinerFeePaid;

    // Accept HTLC(s) for the hold invoice
    await emitHtlcAccepted(invoice);

    expect(eventsEmitted).toEqual(2);

    expect(mockSettleInvoice).toHaveBeenCalledTimes(1);
    expect(mockSettleInvoice).toHaveBeenCalledWith(getHexBuffer(minerFeeInvoicePreimage));

    expect(mockGetReverseSwap).toHaveBeenCalledTimes(2);

    expect(mockSetReverseSwapStatus).toHaveBeenCalledTimes(1);
    expect(mockSetReverseSwapStatus).toHaveBeenCalledWith(mockGetReverseSwapResult, SwapUpdateEvent.MinerFeePaid);
  });

  test('should handle the hold invoice being paid first', async () => {
    let eventsEmitted = 0;

    nursery.on('invoice.paid', (reverseSwap) => {
      expect(reverseSwap).toEqual({
        ...mockGetReverseSwapResult,
        status: SwapUpdateEvent.MinerFeePaid,
      });
      eventsEmitted += 1;
    });

    mockGetReverseSwapResult = {
      invoice,
      minerFeeInvoice,
      minerFeeInvoicePreimage,
    };

    // Accept HTLC(s) for the hold invoice
    await emitHtlcAccepted(invoice);

    expect(eventsEmitted).toEqual(0);

    expect(mockSettleInvoice).toHaveBeenCalledTimes(0);
    expect(mockGetReverseSwap).toHaveBeenCalledTimes(1);

    nursery.on('minerfee.invoice.paid', (reverseSwap) => {
      expect(reverseSwap).toEqual({
        ...mockGetReverseSwapResult,
        status: SwapUpdateEvent.MinerFeePaid,
      });
      eventsEmitted += 1;
    });

    mockLookupInvoiceState = InvoiceState.ACCEPTED;

    // Accept HTLC(s) for the miner fee invoice
    await emitHtlcAccepted(minerFeeInvoice);

    expect(eventsEmitted).toEqual(2);

    expect(mockLookupInvoice).toHaveBeenCalledTimes(1);
    expect(mockLookupInvoice).toHaveBeenCalledWith(getHexBuffer(decodeInvoice(invoice).paymentHash!));

    expect(mockSettleInvoice).toHaveBeenCalledTimes(1);
    expect(mockSettleInvoice).toHaveBeenCalledWith(getHexBuffer(minerFeeInvoicePreimage));

    expect(mockGetReverseSwap).toHaveBeenCalledTimes(2);

    expect(mockSetReverseSwapStatus).toHaveBeenCalledTimes(1);
    expect(mockSetReverseSwapStatus).toHaveBeenCalledWith(mockGetReverseSwapResult, SwapUpdateEvent.MinerFeePaid);
  });
});
