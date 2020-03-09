import { Networks, Scripts } from 'boltz-core';
import { Transaction, ECPair } from 'bitcoinjs-lib';
import Logger from '../../../lib/Logger';
import Swap from '../../../lib/db/models/Swap';
import Wallet from '../../../lib/wallet/Wallet';
import { constructTransaction } from '../../Utils';
import { CurrencyConfig } from '../../../lib/Config';
import SwapNursery from '../../../lib/swap/SwapNursery';
import ChainClient from '../../../lib/chain/ChainClient';
import LndClient from '../../../lib/lightning/LndClient';
import WalletManager from '../../../lib/wallet/WalletManager';
import { getHexBuffer, getHexString } from '../../../lib/Utils';
import SwapRepository from '../../../lib/db/SwapRepository';
import ReverseSwap from '../../../lib/db/models/ReverseSwap';
import { OrderSide } from '../../../lib/consts/Enums';
import ReverseSwapRepository from '../../../lib/db/ReverseSwapRepository';

const mockSetMinerFee = jest.fn().mockImplementation(async (swap) => {
  return swap;
});
const mockSetSwapStatus = jest.fn().mockImplementation(async (swap) => {
  return swap;
});
const mockSetInvoicePaid = jest.fn().mockImplementation(async (swap) => {
  return swap;
});

jest.mock('../../../lib/db/SwapRepository', () => {
  return jest.fn().mockImplementation(() => {
    return {
      setMinerFee: mockSetMinerFee,
      setSwapStatus: mockSetSwapStatus,
      setInvoicePaid: mockSetInvoicePaid,
    };
  });
});

const mockedSwapRepository = <jest.Mock<SwapRepository>><any>SwapRepository;

const mockSetLockupTransaction = jest.fn().mockImplementation(async (reverseSwap) => {
  return reverseSwap;
});

jest.mock('../../../lib/db/ReverseSwapRepository', () => {
  return jest.fn().mockImplementation(() => {
    return {
      setLockupTransaction: mockSetLockupTransaction,
    };
  });
});

const mockedReverseSwapRepository = <jest.Mock<ReverseSwapRepository>><any>ReverseSwapRepository;

const mockSendPaymentResponse = {
  paymentRoute: {
    totalFeesMsat: 5.645,
  },
  paymentPreimage: getHexBuffer('82b6795313c1cdbc82308ce393652366d15a400e72b33c1f36a877fdb98a4c35'),
};
const mockSendPayment = jest.fn().mockImplementation(async (invoice) => {
  if (invoice !== 'failed') {
    return mockSendPaymentResponse;
  } else {
    throw 'payment failed';
  }
});

jest.mock('../../../lib/lightning/LndClient', () => {
  return jest.fn().mockImplementation(() => {
    return {
      on: () => {},
      sendPayment: mockSendPayment,
    };
  });
});

const mockedLndClient = <jest.Mock<LndClient>><any>LndClient;

const mockEstimateFeeResult = 2;
const mockEstimateFee = jest.fn().mockResolvedValue(mockEstimateFeeResult);

const emptyRawTransaction = {
  txid: '',
  hash: '',
  version: 0,
  size: 0,
  vsize: 0,
  weight: 0,
  locktime: 0,
  vin: [],
  vout: [],
  hex: '',
  time: 0,
  blocktime: 0,
};

const explicitTxInput = '1eeeb0b4295d536ca4a85e0e47a3fca73f53929b8fd65b816de5a48748c0351d';
const inheritedTxInput = 'd3db4612fd44c6effe0b6bcd115a26a525d4e6502b31308ea3d7f4512eaea585';

const explicitTxInputAmount = 100000000;

let emitTransaction: (transaction: Transaction, confirmed: boolean) => void;

const mockChainClientEventHandler = jest.fn().mockImplementation(
  (event: string, callback: (transaction: Transaction, confirmed: boolean) => void) => {
    if (event === 'transaction') {
      emitTransaction = callback;
    }
  },
);

const mockGetRawTransaction = jest.fn().mockResolvedValue(
  constructTransaction(false, explicitTxInput, explicitTxInputAmount).toHex(),
);

const mockGetRawTransactionVerbose = jest.fn().mockImplementation(async (output: string) => {
  if (output === explicitTxInput) {
    return {
      ...emptyRawTransaction,

      confirmations: 1,
    };
  } else if (output === inheritedTxInput) {
    return {
      ...emptyRawTransaction,

      confirmations: 0,
      hex: constructTransaction(true, inheritedTxInput).toHex(),
    };
  }

  throw '';
});

const mockSendRawTransactionResult = 'd55da40f32208f465ced694abbeb73822c6cf4a7815a0f6dffb5645067fbd4ad';
const mockSendRawTransaction = jest.fn().mockResolvedValue(mockSendRawTransactionResult);

const mockAddInputFilter = jest.fn().mockImplementation(() => {});
const mockAddOutputFilter = jest.fn().mockImplementation(() => {});

jest.mock('../../../lib/chain/ChainClient', () => {
  return jest.fn().mockImplementation(() => {
    return {
      estimateFee: mockEstimateFee,
      on: mockChainClientEventHandler,
      addInputFilter: mockAddInputFilter,
      addOutputFilter: mockAddOutputFilter,
      getRawTransaction: mockGetRawTransaction,
      sendRawTransaction: mockSendRawTransaction,
      getRawTransactionVerbose: mockGetRawTransactionVerbose,
    };
  });
});

const mockedChainClient = <jest.Mock<ChainClient>><any>ChainClient;

const mockNewAddressResult = '2N4yXyjhjBc4WCy29vsCAGJgC8DaYH1cxr5';
const mockNewAddress = jest.fn().mockResolvedValue(mockNewAddressResult);

const mockSendToAddressResult = {
  fee: 5643,
  transaction: constructTransaction(false, explicitTxInput),
  transactionId: '7397d5f7b4ab094c03f9cc40afce6c001108219cf6557f411d8c9cb1ae5c1cf6',
};
const mockSendToAddress = jest.fn().mockResolvedValue(mockSendToAddressResult);

const mockDecodeAddressResult = getHexBuffer('0020f8d668a3523d64953018f12199be94a7baefaf1adbf97af9d2caeb6d46a2280c');
const mockDecodeAddress = jest.fn().mockReturnValue(mockDecodeAddressResult);

const mockGetKeysByIndexResult = ECPair.makeRandom();
const mockGetKeysByIndex = jest.fn().mockReturnValue(mockGetKeysByIndexResult);

jest.mock('../../../lib/wallet/Wallet', () => {
  return jest.fn().mockImplementation(() => {
    return {
      newAddress: mockNewAddress,
      sendToAddress: mockSendToAddress,
      decodeAddress: mockDecodeAddress,
      getKeysByIndex: mockGetKeysByIndex,
    };
  });
});

const mockedWallet = <jest.Mock<Wallet>><any>Wallet;

jest.mock('../../../lib/wallet/WalletManager', () => {
  return jest.fn().mockImplementation(() => {
    return {
      wallets: new Map<string, Wallet>([['BTC', mockedWallet()]]),
    };
  });
});

const mockedWalletManager = <jest.Mock<WalletManager>><any>WalletManager;

describe('SwapNursery', () => {
  const walletManager = mockedWalletManager();

  const swapNursery = new SwapNursery(
    Logger.disabledLogger,
    walletManager,
    mockedSwapRepository(),
    mockedReverseSwapRepository(),
  );

  const btcCurrency = {
    symbol: 'BTC',
    lndClient: mockedLndClient(),
    chainClient: mockedChainClient(),
    network: Networks.bitcoinRegtest,
    config: {} as any as CurrencyConfig,
  };

  beforeAll(() => {
    swapNursery.bindCurrency(btcCurrency);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should claim swaps', async () => {
    const wallet = walletManager.wallets.get('BTC')!;

    const vout = 0;
    const transaction = constructTransaction(true, inheritedTxInput, 10000);

    const swap = {
      pair: 'BTC/BTC',
      redeemScript: 'a914379299189c7558198e8116b3e1e81e8d627df093876321023d9e44575cd6f03dbc851cc9a6e037339302d0faad6a8d86284745146850633e67017eb175210360ecf59b1bacc5787842a3b7094da57cf62e2fdb8cc63fbbf9c489aad782cbad68ac',
      invoice: 'lnbcrt1p0x0t79pp50stupfmdswrpwtewss9cqfaquj8zzx4wmyhlrc9twmzu7g9vfu9qdqqcqzpgsp5qj7k4g5gtkup2jx2ant9djfsttavzs3tedd33rj78567wlp4s86q9qy9qsqydq2wdahxhrt2wsgssjgxc6reynp3ah4d9yx7sjswm7s0uu20xen0khefce2fpany8d58lppm38w30xuvgxnjjxk0wqj8vr36w3qt0gpp3k092',
    } as Swap;

    let eventsEmitted = 0;

    swapNursery.once('invoice.paid', (eventSwap) => {
      expect(eventSwap).toEqual(swap);

      eventsEmitted += 1;
    });

    swapNursery.once('claim', (eventSwap) => {
      expect(eventSwap).toEqual(swap);

      eventsEmitted += 1;
    });

    await swapNursery['claimSwap'](btcCurrency, wallet, swap, transaction, vout);

    expect(eventsEmitted).toEqual(2);

    expect(mockSendPayment).toHaveBeenCalledTimes(1);
    expect(mockSendPayment).toHaveBeenCalledWith(swap.invoice);

    expect(mockSetInvoicePaid).toHaveBeenCalledTimes(1);
    expect(mockSetInvoicePaid).toHaveBeenCalledWith(swap, mockSendPaymentResponse.paymentRoute.totalFeesMsat);

    expect(mockNewAddress).toHaveBeenCalledTimes(1);
    expect(mockGetKeysByIndex).toHaveBeenCalledTimes(1);
    expect(mockSendRawTransaction).toHaveBeenCalledTimes(1);

    expect(mockSetMinerFee).toHaveBeenCalledTimes(1);
    expect(mockSetMinerFee).toHaveBeenCalledWith(swap, 99990342);

    // Should not claim if output value is smaller than expected amount
    swap.expectedAmount = Number.POSITIVE_INFINITY;

    await swapNursery['claimSwap'](
      btcCurrency,
      wallet,
      swap,
      transaction,
      0,
    );

    expect(mockSendPayment).toHaveBeenCalledTimes(1);

    // Should emit an event if the invoice cannot be paid
    swap.invoice = 'failed';
    swap.expectedAmount = 0;

    swapNursery.once('invoice.failedToPay', (eventSwap) => {
      expect(eventSwap).toEqual(swap);

      eventsEmitted += 1;
    });

    await swapNursery['claimSwap'](
      btcCurrency,
      wallet,
      swap,
      transaction,
      0,
    );

    expect(eventsEmitted).toEqual(3);

    expect(mockSendPayment).toHaveBeenCalledTimes(2);
    expect(mockSendPayment).toHaveBeenNthCalledWith(2, swap.invoice);
  });

  test('should send reverse swap coins', async () => {
    const reverseSwap = {
      pair: 'BTC/BTC',
      onchainAmount: 14670351,
      orderSide: OrderSide.BUY,
      lockupAddress: 'bcrt1qurjp4td00vdrkvqkrmgds82l60dxh093d5arzxj8z4x48w5lgttqsken94',
    } as ReverseSwap;

    let eventsEmitted = 0;

    swapNursery.once('coins.sent', (eventReverseSwap, transaction) => {
      expect(eventReverseSwap).toEqual(reverseSwap);
      expect(transaction).toEqual(mockSendToAddressResult.transaction);

      eventsEmitted += 1;
    });

    await swapNursery['sendReverseSwapCoins'](reverseSwap);

    expect(eventsEmitted).toEqual(1);

    expect(mockEstimateFee).toHaveBeenCalledTimes(1);
    expect(mockEstimateFee).toHaveBeenCalledWith(SwapNursery.reverseSwapMempoolEta);

    expect(mockSendToAddress).toHaveBeenCalledTimes(1);
    expect(mockSendToAddress).toHaveBeenCalledWith(reverseSwap.lockupAddress, reverseSwap.onchainAmount, mockEstimateFeeResult);

    expect(mockAddInputFilter).toHaveBeenCalledTimes(1);
    expect(mockAddInputFilter).toHaveBeenCalledWith(mockSendToAddressResult.transaction.getHash());

    expect(mockAddOutputFilter).toHaveBeenCalledTimes(1);
    expect(mockAddOutputFilter).toHaveBeenCalledWith(mockDecodeAddressResult);

    expect(mockSetLockupTransaction).toHaveBeenCalledTimes(1);
    expect(mockSetLockupTransaction).toHaveBeenCalledWith(reverseSwap, mockSendToAddressResult.transactionId, mockSendToAddressResult.fee);

    // Should cancel invoice on failure

  });

  test('should settle reverse swaps', async () => {

  });

  test('should refund reverse swaps', async () => {

  });

  test('should cancel invoices', async () => {

  });

  test('should pay invocies', async () => {

  });

  test('should calculate the miner fee of a transaction', async () => {
    const outputAmount = 798543;
    const calculateTransactionFee = swapNursery['calculateTransactionFee'];

    expect(await calculateTransactionFee(btcCurrency.chainClient, constructTransaction(false, explicitTxInput, outputAmount)))
      .toEqual(explicitTxInputAmount - outputAmount);
  });

  test('should detect explicit RBF signalling', async () => {
    const transactionSignalsRbf = swapNursery['transactionSignalsRbf'];

    expect(await transactionSignalsRbf(btcCurrency.chainClient, constructTransaction(true, explicitTxInput))).toBeTruthy();
    expect(await transactionSignalsRbf(btcCurrency.chainClient, constructTransaction(false, explicitTxInput))).toBeFalsy();
  });

  test('should detect inherited RBF signalling', async () => {
    const transactionSignalsRbf = swapNursery['transactionSignalsRbf'];

    expect(await transactionSignalsRbf(btcCurrency.chainClient, constructTransaction(false, inheritedTxInput))).toBeTruthy();
    expect(await transactionSignalsRbf(btcCurrency.chainClient, constructTransaction(false, explicitTxInput))).toBeFalsy();
  });
});
