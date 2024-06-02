import { Networks } from 'boltz-core';
import { randomBytes } from 'crypto';
import { Op } from 'sequelize';
import Logger from '../../../lib/Logger';
import { decodeInvoice, getHexBuffer, getHexString } from '../../../lib/Utils';
import { CurrencyType, SwapUpdateEvent } from '../../../lib/consts/Enums';
import ReverseSwapRepository from '../../../lib/db/repositories/ReverseSwapRepository';
import WrappedSwapRepository from '../../../lib/db/repositories/WrappedSwapRepository';
import LndClient from '../../../lib/lightning/LndClient';
import { Invoice } from '../../../lib/proto/lnd/rpc_pb';
import LightningNursery from '../../../lib/swap/LightningNursery';
import { Currency } from '../../../lib/wallet/WalletManager';
import { raceCall } from '../../Utils';

type htlcAcceptedCallback = (invoice: string) => Promise<void>;

let emitHtlcAccepted: htlcAcceptedCallback;

const mockOn = jest.fn().mockImplementation((event: string, callback: any) => {
  switch (event) {
    case 'htlc.accepted':
      emitHtlcAccepted = callback;
      break;
  }
});

let mockLookupHoldInvoiceState: Invoice.InvoiceState;
const mockLookupHoldInvoice = jest.fn().mockImplementation(async () => {
  return {
    state: mockLookupHoldInvoiceState,
  };
});

const mockSettleHoldInvoice = jest.fn().mockImplementation(async () => {});

jest.mock('../../../lib/lightning/LndClient', () => {
  return jest.fn().mockImplementation(() => ({
    raceCall,
    on: mockOn,
    lookupHoldInvoice: mockLookupHoldInvoice,
    settleHoldInvoice: mockSettleHoldInvoice,
  }));
});

const MockedLndClient = <jest.Mock<LndClient>>(<any>LndClient);

let mockGetReverseSwapResult: any = null;
const mockGetReverseSwap = jest.fn().mockImplementation(async () => {
  return mockGetReverseSwapResult;
});

const mockSetStatus = jest
  .fn()
  .mockImplementation(async (reverseSwap, status) => {
    return {
      status,
      ...reverseSwap,
    };
  });

jest.mock('../../../lib/db/repositories/ReverseSwapRepository');

describe('LightningNursery', () => {
  const invoice =
    'lnbcrt1p0csqltpp5xv57wt3s57gm50jksvyhuhmahnvtaw5q5elcuhkcpf9k7jcuey6qdqqcqzpgsp5t4t0aqn5jleve60dalh9t23r6ahana9t7c8steerurtt7x0x0xts9qy9qsqsas984xcqdxrd3l7kfzhejnjky3a2hhk0zp0chn43pjp0g49g825pazmdjppqvvdqsyc6euy6lg2xatrsf3pgavs0f62pg3xagljgrcpnrn4r5';

  const minerFeeInvoicePreimage = getHexString(randomBytes(32));
  const minerFeeInvoice =
    'lnbcrt21u1psprx5xpp5xa0d3f37sz5cmp34cm0hd2tujuxctw6ydge27cd0cp8k0cu5ynnsdqqcqzpgsp55tje9q5t5xnkk03tgvv50tle49gf5nxeec03lvsaal3v2hcner7q9qy9qsqdgmep4nwprmtslrztla04jyvhc7rw8gtf5kydakz95tserqcchjx6f3u3yrupuadle2rqq8w27885h33v4gysl0ch5cxa5faz3akk0sqykdymf';

  const nursery = new LightningNursery(Logger.disabledLogger);

  const btcLndClient = MockedLndClient();
  const currencies: Currency[] = [
    {
      symbol: 'BTC',
      limits: {} as any,
      lndClient: btcLndClient,
      type: CurrencyType.BitcoinLike,
      network: Networks.bitcoinRegtest,
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    nursery.removeAllListeners();

    ReverseSwapRepository.getReverseSwap = mockGetReverseSwap;
    WrappedSwapRepository.setStatus = mockSetStatus;

    mockGetReverseSwapResult = null;
  });

  test('should detect "invoice already paid" errors', () => {
    const code = 6;
    const details = 'invoice is already paid';

    expect(
      LightningNursery.errIsInvoicePaid({
        code,
        details,
      }),
    ).toEqual(true);

    expect(
      LightningNursery.errIsInvoicePaid({
        code,
      }),
    ).toEqual(false);
    expect(
      LightningNursery.errIsInvoicePaid({
        details,
      }),
    ).toEqual(true);
    expect(LightningNursery.errIsInvoicePaid({})).toEqual(false);
    expect(LightningNursery.errIsInvoicePaid(null)).toEqual(false);
    expect(LightningNursery.errIsInvoicePaid(undefined)).toEqual(false);
  });

  test.each`
    expected | error
    ${true}  | ${{ code: 6, details: 'payment is in transition' }}
    ${true}  | ${{ code: 5, details: 'payment is in transition' }}
    ${false} | ${{ code: 6, details: 'payment is not in transition' }}
    ${false} | ${{ code: 6 }}
    ${false} | ${{}}
    ${false} | ${undefined}
    ${false} | ${null}
  `(
    'should detect "payment is in transition" error for $error',
    ({ error, expected }) => {
      expect(LightningNursery.errIsPaymentInTransition(error)).toEqual(
        expected,
      );
    },
  );

  test('should detect "cltv limit should be greater than" errors', () => {
    expect(
      LightningNursery.errIsCltvLimitExceeded({
        details: 'cltv limit 29 should be greater than 147',
      }),
    ).toEqual(true);
    expect(
      LightningNursery.errIsCltvLimitExceeded({
        details: 'cltv limit 141 should be greater than 147',
      }),
    ).toEqual(true);
    expect(LightningNursery.errIsCltvLimitExceeded({})).toEqual(false);
    expect(LightningNursery.errIsCltvLimitExceeded(null)).toEqual(false);
    expect(LightningNursery.errIsCltvLimitExceeded(undefined)).toEqual(false);
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
          invoice,
        },
        {
          minerFeeInvoice: invoice,
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

    expect(mockLookupHoldInvoice).not.toHaveBeenCalled();
    expect(mockSettleHoldInvoice).not.toHaveBeenCalled();
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

    mockLookupHoldInvoiceState = Invoice.InvoiceState.OPEN;

    mockGetReverseSwapResult = {
      invoice,
      minerFeeInvoice,
      minerFeeInvoicePreimage,
    };

    // Accept HTLC(s) for the miner fee invoice
    await emitHtlcAccepted(minerFeeInvoice);

    expect(eventsEmitted).toEqual(1);

    expect(mockLookupHoldInvoice).toHaveBeenCalledTimes(1);
    expect(mockLookupHoldInvoice).toHaveBeenCalledWith(
      getHexBuffer(decodeInvoice(invoice).paymentHash!),
    );

    expect(mockSettleHoldInvoice).not.toHaveBeenCalled();
    expect(mockGetReverseSwap).toHaveBeenCalledTimes(1);

    nursery.on('invoice.paid', (reverseSwap) => {
      expect(reverseSwap).toEqual(mockGetReverseSwapResult);
      eventsEmitted += 1;
    });

    mockGetReverseSwapResult.status = SwapUpdateEvent.MinerFeePaid;

    // Accept HTLC(s) for the hold invoice
    await emitHtlcAccepted(invoice);

    expect(eventsEmitted).toEqual(2);

    expect(mockSettleHoldInvoice).toHaveBeenCalledTimes(1);
    expect(mockSettleHoldInvoice).toHaveBeenCalledWith(
      getHexBuffer(minerFeeInvoicePreimage),
    );

    expect(mockGetReverseSwap).toHaveBeenCalledTimes(2);

    expect(mockSetStatus).toHaveBeenCalledTimes(1);
    expect(mockSetStatus).toHaveBeenCalledWith(
      mockGetReverseSwapResult,
      SwapUpdateEvent.MinerFeePaid,
    );
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

    expect(mockSettleHoldInvoice).not.toHaveBeenCalled();
    expect(mockGetReverseSwap).toHaveBeenCalledTimes(1);

    nursery.on('minerfee.invoice.paid', (reverseSwap) => {
      expect(reverseSwap).toEqual({
        ...mockGetReverseSwapResult,
        status: SwapUpdateEvent.MinerFeePaid,
      });
      eventsEmitted += 1;
    });

    mockLookupHoldInvoiceState = Invoice.InvoiceState.ACCEPTED;

    // Accept HTLC(s) for the miner fee invoice
    await emitHtlcAccepted(minerFeeInvoice);

    expect(eventsEmitted).toEqual(2);

    expect(mockLookupHoldInvoice).toHaveBeenCalledTimes(1);
    expect(mockLookupHoldInvoice).toHaveBeenCalledWith(
      getHexBuffer(decodeInvoice(invoice).paymentHash!),
    );

    expect(mockSettleHoldInvoice).toHaveBeenCalledTimes(1);
    expect(mockSettleHoldInvoice).toHaveBeenCalledWith(
      getHexBuffer(minerFeeInvoicePreimage),
    );

    expect(mockGetReverseSwap).toHaveBeenCalledTimes(2);

    expect(mockSetStatus).toHaveBeenCalledTimes(1);
    expect(mockSetStatus).toHaveBeenCalledWith(
      mockGetReverseSwapResult,
      SwapUpdateEvent.MinerFeePaid,
    );
  });

  test('should handle htlc.accepted event sequentially', async () => {
    let eventsEmitted = 0;
    nursery.on('invoice.paid', () => {
      eventsEmitted++;
    });

    mockGetReverseSwapResult = {
      invoice,
      minerFeeInvoicePreimage: null,
    };

    const lock = nursery['lock'];
    const invoiceLock = LightningNursery['invoiceLock'];

    expect(lock.isBusy(invoiceLock)).toEqual(false);

    const emitPromise = emitHtlcAccepted(invoice);

    expect(lock.isBusy(invoiceLock)).toEqual(true);
    await emitPromise;

    expect(eventsEmitted).toEqual(1);
    expect(lock.isBusy(invoiceLock)).toEqual(false);
  });
});
