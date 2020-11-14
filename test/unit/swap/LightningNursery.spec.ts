import { Op } from 'sequelize';
import { Networks } from 'boltz-core';
import Logger from '../../../lib/Logger';
import { Invoice } from '../../../lib/proto/lnd/rpc_pb';
import LndClient from '../../../lib/lightning/LndClient';
import { Currency } from '../../../lib/wallet/WalletManager';
import { decodeInvoice, getHexBuffer } from '../../../lib/Utils';
import LightningNursery from '../../../lib/swap/LightningNursery';
import ReverseSwapRepository from '../../../lib/db/ReverseSwapRepository';
import { CurrencyType, SwapUpdateEvent } from '../../../lib/consts/Enums';

type htlcAcceptedCallback = (invoice: string) => void;
type invoiceSettledCallback = (invoice: string) => void;

let emitHtlcAccepted: htlcAcceptedCallback;
let emitInvoiceSettled: invoiceSettledCallback;

const mockOn = jest.fn().mockImplementation((event: string, callback: any) => {
  switch (event) {
    case 'htlc.accepted':
      emitHtlcAccepted = callback;
      break;

    case 'invoice.settled':
      emitInvoiceSettled = callback;
      break;
  }
});

let mockLookupInvoiceState: Invoice.InvoiceState;
const mockLookupInvoice = jest.fn().mockImplementation(async () => {
  return {
    state: mockLookupInvoiceState,
  };
});

jest.mock('../../../lib/lightning/LndClient', () => {
  return jest.fn().mockImplementation(() => ({
    on: mockOn,
    lookupInvoice: mockLookupInvoice,
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

  const nursery = new LightningNursery(
    Logger.disabledLogger,
    true,
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
  });

  test('should bind currencies', () => {
    nursery.bindCurrencies(currencies);

    expect(mockOn).toHaveBeenCalledTimes(2);

    expect(mockOn).toHaveBeenCalledWith('htlc.accepted', expect.anything());
    expect(mockOn).toHaveBeenCalledWith('invoice.settled', expect.anything());
  });

  test('should emit events for accepted HTLCs', async () => {
    let eventsEmitted = 0;

    nursery.on('invoice.paid', (reverseSwap) => {
      expect(reverseSwap).toEqual(mockGetReverseSwapResult);

      eventsEmitted += 1;
    });

    // Should do nothing when there is no Reverse Swap with the invoice
    await emitHtlcAccepted(invoice);

    expect(mockGetReverseSwap).toHaveBeenCalledTimes(1);
    expect(mockGetReverseSwap).toHaveBeenCalledWith({
      invoice: {
        [Op.eq]: invoice,
      },
    });

    expect(eventsEmitted).toEqual(0);

    // Should emit an event when there is an Reverse Swap with the invoice
    mockGetReverseSwapResult = {
      minerFeeInvoice: null,
    };

    await emitHtlcAccepted(invoice);

    expect(mockGetReverseSwap).toHaveBeenCalledTimes(2);
    expect(eventsEmitted).toEqual(1);

    // Should emit an event when there is a prepay miner fee Reverse Swap with the invoice
    // and a paid miner fee invoice
    mockGetReverseSwapResult = {
      minerFeeInvoice: 'f',
      status: SwapUpdateEvent.MinerFeePaid,
    };

    await emitHtlcAccepted(invoice);

    expect(mockGetReverseSwap).toHaveBeenCalledTimes(3);
    expect(eventsEmitted).toEqual(2);

    mockGetReverseSwapResult = null;
    nursery.removeAllListeners();
  });

  test('should ignore accepted HTLCs when miner fee invoice is not paid yet', async () => {
    nursery.on('invoice.paid', () => {
      throw 'this event should not be emitted';
    });

    mockGetReverseSwapResult = {
      mineFeeInvoice: 'f',
      status: SwapUpdateEvent.SwapCreated,
    };

    await emitHtlcAccepted(invoice);

    mockGetReverseSwapResult = null;
    nursery.removeAllListeners();
  });

  test('should handle settled prepay minerfee invoices', async () => {
    let invoiceEventsEmitted = 0;
    let minerfeeEventsEmitted = 0;

    nursery.on('minerfee.invoice.paid', (reverseSwap) => {
      expect(reverseSwap).toEqual({
        ...reverseSwap,
        status: SwapUpdateEvent.MinerFeePaid,
      });

      minerfeeEventsEmitted += 1;
    });

    nursery.on('invoice.paid', (reverseSwap) => {
      expect(reverseSwap).toEqual({
        ...reverseSwap,
        status: SwapUpdateEvent.MinerFeePaid,
      });

      invoiceEventsEmitted += 1;
    });

    // Should do nothing when there is no Reverse Swap with that miner fee invoice
    await emitInvoiceSettled(invoice);

    expect(mockGetReverseSwap).toHaveBeenCalledTimes(1);

    expect(invoiceEventsEmitted).toEqual(0);
    expect(minerfeeEventsEmitted).toEqual(0);

    // Should update Reverse Swap in database and emit "minerfee.invoice.paid" when minerfee invoice was paid first...
    mockGetReverseSwapResult = {
      invoice,
    };
    mockLookupInvoiceState = Invoice.InvoiceState.OPEN;

    await emitInvoiceSettled(invoice);

    expect(mockGetReverseSwap).toHaveBeenCalledTimes(2);
    expect(mockLookupInvoice).toHaveBeenCalledTimes(1);

    expect(invoiceEventsEmitted).toEqual(0);
    expect(minerfeeEventsEmitted).toEqual(1);

    // ...and also emit "invoice.paid" if the hold invoice was paid before
    mockLookupInvoiceState = Invoice.InvoiceState.ACCEPTED;

    await emitInvoiceSettled(invoice);

    expect(mockGetReverseSwap).toHaveBeenCalledTimes(3);

    expect(mockLookupInvoice).toHaveBeenCalledTimes(2);
    expect(mockLookupInvoice).toHaveBeenCalledWith(getHexBuffer(decodeInvoice(invoice).paymentHash!));

    expect(invoiceEventsEmitted).toEqual(1);
    expect(minerfeeEventsEmitted).toEqual(2);

    mockGetReverseSwapResult = undefined;
    nursery.removeAllListeners();
  });
});
