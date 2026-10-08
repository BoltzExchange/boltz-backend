import bolt11 from 'bolt11';
import { randomBytes } from 'crypto';
import { Op } from 'sequelize';
import Logger from '../../../lib/Logger';
import { getHexBuffer, getHexString } from '../../../lib/Utils';
import {
  CurrencyType,
  OrderSide,
  SwapUpdateEvent,
} from '../../../lib/consts/Enums';
import ReverseSwapRepository from '../../../lib/db/repositories/ReverseSwapRepository';
import WrappedSwapRepository from '../../../lib/db/repositories/WrappedSwapRepository';
import { HtlcState } from '../../../lib/lightning/LightningClient';
import LndClient from '../../../lib/lightning/LndClient';
import SelfPaymentClient from '../../../lib/lightning/SelfPaymentClient';
import { Invoice_InvoiceState } from '../../../lib/proto/lnd/rpc';
import type Sidecar from '../../../lib/sidecar/Sidecar';
import LightningNursery from '../../../lib/swap/LightningNursery';
import type { Currency } from '../../../lib/wallet/WalletManager';
import { regtest as Networks } from '../../Networks';
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

let mockLookupHoldInvoiceState: Invoice_InvoiceState;
let mockHtlcs: { state: HtlcState; expiryHeight?: number }[] = [];
const mockLookupHoldInvoice = jest.fn().mockImplementation(async () => {
  return {
    state: mockLookupHoldInvoiceState,
    htlcs: mockHtlcs,
  };
});
const mockCancelHoldInvoice = jest.fn().mockImplementation(async () => {});

const mockSettleHoldInvoice = jest.fn().mockImplementation(async () => {});

jest.mock('../../../lib/lightning/LndClient', () => {
  return jest.fn().mockImplementation(() => ({
    id: 'lnd-1',
    raceCall,
    on: mockOn,
    lookupHoldInvoice: mockLookupHoldInvoice,
    settleHoldInvoice: mockSettleHoldInvoice,
    cancelHoldInvoice: mockCancelHoldInvoice,
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

  const preimageHash = getHexString(randomBytes(32));
  const timeoutBlockHeight = 1_000;

  const minerFeeInvoicePreimage = getHexString(randomBytes(32));
  const minerFeeInvoice =
    'lnbcrt21u1psprx5xpp5xa0d3f37sz5cmp34cm0hd2tujuxctw6ydge27cd0cp8k0cu5ynnsdqqcqzpgsp55tje9q5t5xnkk03tgvv50tle49gf5nxeec03lvsaal3v2hcner7q9qy9qsqdgmep4nwprmtslrztla04jyvhc7rw8gtf5kydakz95tserqcchjx6f3u3yrupuadle2rqq8w27885h33v4gysl0ch5cxa5faz3akk0sqykdymf';

  const decodeInvoice = (invoice: string) => {
    const dec = bolt11.decode(invoice);
    return {
      paymentHash: getHexBuffer(
        dec.tags.find((tag) => tag.tagName === 'payment_hash')!.data as string,
      ),
    };
  };

  const sidecar = {
    decodeInvoiceOrOffer: jest
      .fn()
      .mockImplementation(async (invoice: string) => {
        return decodeInvoice(invoice);
      }),
  } as unknown as Sidecar;

  const nursery = new LightningNursery(
    Logger.disabledLogger,
    sidecar,
    new SelfPaymentClient(Logger.disabledLogger, {} as any),
  );

  const btcLndClient = MockedLndClient();
  (btcLndClient as any).id = 'lnd-1';
  const currencies: Currency[] = [
    {
      symbol: 'BTC',
      limits: {} as any,
      lndClients: new Map([[btcLndClient.id, btcLndClient]]),
      type: CurrencyType.BitcoinLike,
      network: Networks,
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

  describe('HTLC expiry of the hold invoice', () => {
    // lnd cancels a held invoice 18 blocks before its HTLC expires; the
    // service's refund needs 12 more after the lockup times out.
    const required =
      timeoutBlockHeight +
      LightningNursery.holdExpiryDelta +
      LightningNursery.refundConfirmationMargin;

    afterEach(() => {
      mockHtlcs = [];
    });

    test('should check the HTLCs again when the prepayment arrives after them', async () => {
      mockHtlcs = [{ state: HtlcState.Accepted, expiryHeight: required - 1 }];
      mockLookupHoldInvoiceState = Invoice_InvoiceState.ACCEPTED;
      mockGetReverseSwapResult = {
        id: 'prepaid',
        invoice,
        pair: 'BTC/BTC',
        orderSide: OrderSide.BUY,
        preimageHash,
        timeoutBlockHeight,
        minerFeeInvoice,
        minerFeeInvoicePreimage,
      };

      let paid = 0;
      nursery.on('invoice.paid', () => {
        paid += 1;
      });

      await emitHtlcAccepted(minerFeeInvoice);

      expect(paid).toEqual(0);
      expect(mockSettleHoldInvoice).not.toHaveBeenCalled();
      expect(mockCancelHoldInvoice).toHaveBeenCalledWith(
        getHexBuffer(preimageHash),
      );
    });

    test.each`
      description             | expiry          | locksUp
      ${'one block too soon'} | ${required - 1} | ${false}
      ${'just enough'}        | ${required}     | ${true}
    `(
      'should lock up only if the HTLC outlasts the refund: $description',
      async ({ expiry, locksUp }) => {
        mockHtlcs = [
          { state: HtlcState.Accepted, expiryHeight: required + 100 },
          { state: HtlcState.Accepted, expiryHeight: expiry },
        ];
        mockGetReverseSwapResult = {
          invoice,
          pair: 'BTC/BTC',
          orderSide: OrderSide.BUY,
          preimageHash,
          timeoutBlockHeight,
          minerFeeInvoicePreimage: null,
        };

        let paid = 0;
        nursery.on('invoice.paid', () => {
          paid += 1;
        });

        await emitHtlcAccepted(invoice);

        expect(paid).toEqual(locksUp ? 1 : 0);
        if (locksUp) {
          expect(mockCancelHoldInvoice).not.toHaveBeenCalled();
        } else {
          expect(mockCancelHoldInvoice).toHaveBeenCalledWith(
            getHexBuffer(preimageHash),
          );
        }
      },
    );

    test('should not compare the HTLC with a timeout on another chain', async () => {
      // A Liquid lockup's timeout is a Liquid height, far above the Bitcoin
      // height the HTLC expires at; the cross chain buffer covers it.
      mockHtlcs = [{ state: HtlcState.Accepted, expiryHeight: 900 }];
      mockGetReverseSwapResult = {
        invoice,
        pair: 'L-BTC/BTC',
        orderSide: OrderSide.BUY,
        preimageHash,
        timeoutBlockHeight: 3_000_000,
        minerFeeInvoicePreimage: null,
      };

      let paid = 0;
      nursery.on('invoice.paid', () => {
        paid += 1;
      });

      await emitHtlcAccepted(invoice);

      expect(paid).toEqual(1);
      expect(mockCancelHoldInvoice).not.toHaveBeenCalled();
    });
  });

  test('should handle Reverse Swaps without prepay miner fee', async () => {
    let eventsEmitted = 0;

    nursery.on('invoice.paid', (reverseSwap) => {
      expect(reverseSwap).toEqual(mockGetReverseSwapResult);

      eventsEmitted += 1;
    });

    mockGetReverseSwapResult = {
      invoice,
      pair: 'BTC/BTC',
      orderSide: OrderSide.BUY,
      preimageHash,
      timeoutBlockHeight,
      minerFeeInvoicePreimage: null,
    };

    await emitHtlcAccepted(invoice);

    // Only to check the expiry of the HTLCs
    expect(mockLookupHoldInvoice).toHaveBeenCalledTimes(1);
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

    mockLookupHoldInvoiceState = Invoice_InvoiceState.OPEN;

    mockGetReverseSwapResult = {
      invoice,
      pair: 'BTC/BTC',
      orderSide: OrderSide.BUY,
      preimageHash,
      timeoutBlockHeight,
      minerFeeInvoice,
      minerFeeInvoicePreimage,
    };

    // Accept HTLC(s) for the miner fee invoice
    await emitHtlcAccepted(minerFeeInvoice);

    expect(eventsEmitted).toEqual(1);

    expect(mockLookupHoldInvoice).toHaveBeenCalledTimes(1);
    expect(mockLookupHoldInvoice).toHaveBeenCalledWith(
      decodeInvoice(invoice).paymentHash,
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
      pair: 'BTC/BTC',
      orderSide: OrderSide.BUY,
      preimageHash,
      timeoutBlockHeight,
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

    mockLookupHoldInvoiceState = Invoice_InvoiceState.ACCEPTED;

    // Accept HTLC(s) for the miner fee invoice
    await emitHtlcAccepted(minerFeeInvoice);

    expect(eventsEmitted).toEqual(2);

    // Once for the HTLC expiry when the hold invoice is accepted, once after
    // the prepay
    expect(mockLookupHoldInvoice).toHaveBeenCalledTimes(3);
    expect(mockLookupHoldInvoice).toHaveBeenCalledWith(
      decodeInvoice(invoice).paymentHash,
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
      pair: 'BTC/BTC',
      orderSide: OrderSide.BUY,
      preimageHash,
      timeoutBlockHeight,
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
