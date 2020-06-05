import { Op } from 'sequelize';
import { Networks } from 'boltz-core';
import { Transaction, ECPair } from 'bitcoinjs-lib';
import Logger from '../../../lib/Logger';
import Swap from '../../../lib/db/models/Swap';
import Wallet from '../../../lib/wallet/Wallet';
import { CurrencyConfig } from '../../../lib/Config';
import SwapNursery from '../../../lib/swap/SwapNursery';
import LndClient from '../../../lib/lightning/LndClient';
import ChainClient from '../../../lib/chain/ChainClient';
import { constructTransaction, wait } from '../../Utils';
import RateProvider from '../../../lib/rates/RateProvider';
import SwapRepository from '../../../lib/db/SwapRepository';
import ReverseSwap from '../../../lib/db/models/ReverseSwap';
import WalletManager from '../../../lib/wallet/WalletManager';
import { getHexBuffer, reverseBuffer } from '../../../lib/Utils';
import { OrderSide, SwapUpdateEvent } from '../../../lib/consts/Enums';
import ReverseSwapRepository from '../../../lib/db/ReverseSwapRepository';

let mockGetSwapResult: any = undefined;
const mockGetSwap = jest.fn().mockImplementation(async () => {
  return mockGetSwapResult;
});

let mockGetSwapsResult: any[] = [];
const mockGetSwaps = jest.fn().mockImplementation(async () => {
  return mockGetSwapsResult;
});

const mockSetMinerFee = jest.fn().mockImplementation(async (swap) => {
  return swap;
});
const mockSetSwapStatus = jest.fn().mockImplementation(async (swap) => {
  return swap;
});
const mockSetInvoicePaid = jest.fn().mockImplementation(async (swap) => {
  return swap;
});
const mockSetLockupTransactionId = jest.fn().mockImplementation(async (swap) => {
  return swap;
});

jest.mock('../../../lib/db/SwapRepository', () => {
  return jest.fn().mockImplementation(() => {
    return {
      getSwap: mockGetSwap,
      getSwaps: mockGetSwaps,
      setMinerFee: mockSetMinerFee,
      setSwapStatus: mockSetSwapStatus,
      setInvoicePaid: mockSetInvoicePaid,
      setLockupTransactionId: mockSetLockupTransactionId,
    };
  });
});

const mockedSwapRepository = <jest.Mock<SwapRepository>><any>SwapRepository;

let mockGetReverseSwapResult: any = undefined;
const mockGetReverseSwap = jest.fn().mockImplementation(async () => {
  return mockGetReverseSwapResult;
});

let mockGetReverseSwapsResult: any[] = [];
const mockGetReverseSwaps = jest.fn().mockImplementation(async () => {
  return mockGetReverseSwapsResult;
});

const mockSetInvoiceSettled = jest.fn().mockImplementation(async (reverseSwap) => {
  return reverseSwap;
});
const mockSetLockupTransaction = jest.fn().mockImplementation(async (reverseSwap) => {
  return reverseSwap;
});
const mockSetReverseSwapStatus = jest.fn().mockImplementation(async (reverseSwap) => {
  return reverseSwap;
});
const mockSetTransactionRefunded = jest.fn().mockImplementation(async (reverseSwap) => {
  return reverseSwap;
});

jest.mock('../../../lib/db/ReverseSwapRepository', () => {
  return jest.fn().mockImplementation(() => {
    return {
      getReverseSwap: mockGetReverseSwap,
      getReverseSwaps: mockGetReverseSwaps,
      setInvoiceSettled: mockSetInvoiceSettled,
      setLockupTransaction: mockSetLockupTransaction,
      setReverseSwapStatus: mockSetReverseSwapStatus,
      setTransactionRefunded: mockSetTransactionRefunded,
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
  if (invoice !== 'fail') {
    return mockSendPaymentResponse;
  } else {
    throw 'payment failed';
  }
});

const mockCancelInvoice = jest.fn().mockImplementation(async () => {});
const mockSettleInvoice = jest.fn().mockImplementation(async () => {});

let emitHtlcAccepted: (invoice: string) => void;

const mockLndClientEventHandler = jest.fn().mockImplementation((event: string, callback: any) => {
  switch (event) {
    case 'htlc.accepted':
      emitHtlcAccepted = callback;
      break;
  }
});

jest.mock('../../../lib/lightning/LndClient', () => {
  return jest.fn().mockImplementation(() => {
    return {
      on: mockLndClientEventHandler,
      sendPayment: mockSendPayment,
      cancelInvoice: mockCancelInvoice,
      settleInvoice: mockSettleInvoice,
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

let emitBlock: (height: number) => void;
let emitTransaction: (transaction: Transaction, confirmed: boolean) => void;

const mockChainClientEventHandler = jest.fn().mockImplementation((event: string, callback: any) => {
  switch (event) {
    case 'block':
      emitBlock = callback;
      break;

    case 'transaction':
      emitTransaction = callback;
      break;
  }
});

const mockGetRawTransactionResult = '020000000001011d35c04887a4e56d815bd68f9b92533fa7fca3470e5ea8a46c535d29b4b0ee1e0000000000ffffffff0100e1f505000000001600144e578277b2c88136775a369ebcc4a92ebb8bcf600247304402201a97fd7787ed919f7670258edf45aa235080fcff322206fab88e1d265dd4aa7402205bf4ba7e212c10c7772ef6c9f3fdbf837b36909b2eec7337a2758268166837320121020b27c02319022ed08ea405e567385315d41f8b3dedd33817132cc780d206924500000000';
const mockGetRawTransaction = jest.fn().mockResolvedValue(mockGetRawTransactionResult);

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

const mockRemoveInputFilter = jest.fn().mockImplementation(() => {});
const mockRemoveOutputFilter = jest.fn().mockImplementation(() => {});

jest.mock('../../../lib/chain/ChainClient', () => {
  return jest.fn().mockImplementation(() => {
    return {
      estimateFee: mockEstimateFee,
      on: mockChainClientEventHandler,
      addInputFilter: mockAddInputFilter,
      addOutputFilter: mockAddOutputFilter,
      removeInputFilter: mockRemoveInputFilter,
      getRawTransaction: mockGetRawTransaction,
      removeOutputFilter: mockRemoveOutputFilter,
      sendRawTransaction: mockSendRawTransaction,
      getRawTransactionVerbose: mockGetRawTransactionVerbose,
    };
  });
});

const mockedChainClient = <jest.Mock<ChainClient>><any>ChainClient;

const mockNewAddressResult = '2N4yXyjhjBc4WCy29vsCAGJgC8DaYH1cxr5';
const mockNewAddress = jest.fn().mockResolvedValue(mockNewAddressResult);

const mockEncodeAddressResult = 'bcrt1qmjnxhkk5qah2xp273tnce25dsfwa38t5ad0ja3';
const mockEncodeAddress = jest.fn().mockReturnValue(mockEncodeAddressResult);

const mockSendToAddressResult = {
  fee: 5643,
  transaction: constructTransaction(false, explicitTxInput),
  transactionId: '7397d5f7b4ab094c03f9cc40afce6c001108219cf6557f411d8c9cb1ae5c1cf6',
};
const mockSendToAddress = jest.fn().mockImplementation(async (lockupAddress: string) => {
  if (lockupAddress !== 'fail') {
    return mockSendToAddressResult;
  } else {
    throw 'no coins or whatever';
  }
});

const mockDecodeAddressResult = getHexBuffer('0020f8d668a3523d64953018f12199be94a7baefaf1adbf97af9d2caeb6d46a2280c');
const mockDecodeAddress = jest.fn().mockReturnValue(mockDecodeAddressResult);

const mockGetKeysByIndexResult = ECPair.makeRandom();
const mockGetKeysByIndex = jest.fn().mockReturnValue(mockGetKeysByIndexResult);

jest.mock('../../../lib/wallet/Wallet', () => {
  return jest.fn().mockImplementation(() => {
    return {
      newAddress: mockNewAddress,
      encodeAddress: mockEncodeAddress,
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

jest.mock('../../../lib/rates/RateProvider', () => {
  return jest.fn().mockImplementation(() => {
    return {
      pairs: new Map<string, { rate: number }>([
        ['BTC/BTC', { rate: 1 }],
      ]),
    };
  });
});

const mockedRateProvider = <jest.Mock<RateProvider>><any>RateProvider;

describe('SwapNursery', () => {
  const walletManager = mockedWalletManager();

  const swapNursery = new SwapNursery(
    Logger.disabledLogger,
    mockedRateProvider(),
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
    swap.invoice = 'fail';
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
      invoice: 'lnbcrt1p0x0hunpp5cs3gn2kcawahed3ahukx6w8nvvh2lhxm8sv5855fd78kjlp2he0sdqqcqzpgsp5r7feuhflu88j885f2x0lkxflhnw6rnjd7rxenumqvef4uyvytj3s9qy9qsqaaqy5vlu9sck2ezkd6qsegxc7tuadu5zvnjggnhhdtpy4vy94xcndhlll0qrddjjq7sldlypy0q4ne829hf4fwpzeq6dnd83ph7pj7sp5yjwg9',
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
    reverseSwap.lockupAddress = 'fail';

    swapNursery.once('coins.failedToSend', (eventReverseSwap) => {
      expect(eventReverseSwap).toEqual(reverseSwap);

      eventsEmitted += 1;
    });

    await swapNursery['sendReverseSwapCoins'](reverseSwap);

    expect(mockCancelInvoice).toHaveBeenCalledTimes(1);
    expect(mockCancelInvoice).toHaveBeenCalledWith(getHexBuffer('c42289aad8ebbb7cb63dbf2c6d38f3632eafdcdb3c1943d2896f8f697c2abe5f'));

    expect(mockSetReverseSwapStatus).toHaveBeenCalledTimes(1);
    expect(mockSetReverseSwapStatus).toHaveBeenCalledWith(reverseSwap, SwapUpdateEvent.TransactionFailed);

    expect(eventsEmitted).toEqual(2);
  });

  test('should settle reverse swaps', async () => {
    const vin = 0;
    const preimage = '715b57a3bcf5d18efc8920f6055e9b49afde9dd210785a0f82ae86a92858b7c7';
    const transaction = Transaction.fromHex('01000000000101ad29409669f1b719b824e4434461ceafb34f98e09aa2a85c6ba89ecc2c7c2e11010000000000000000010c5d000000000000220020fcfe64529a408c9fe79b87e5f0b8346b169bfaf00d5941ffeb2dff0391092dca0347304402206a2386521bbf5e5faf752beb0606d3e501a7983e9b821c21b7fbf9fe6de0c82002206b1c34c41aa26060ce83922a5dd82bd10da9644d14ce1884f6297224a49ec5970120715b57a3bcf5d18efc8920f6055e9b49afde9dd210785a0f82ae86a92858b7c76a8201208763a91497ccd4a3ab070e48714bc530954977ca639a7ba5882103fdb198fe1182ae974719f1a82e9ff79106272ac76947b13eecb0034bf1f01134677503e27709b175210301826ce7e969e59e392890de85ccb06518800c59f5ccfb6abc360cdc6519a06468ac00000000');

    const reverseSwap = {
      pair: 'BTC/BTC',
    } as ReverseSwap;

    let eventEmitted = false;

    swapNursery.once('invoice.settled', (eventReverseSwap) => {
      expect(eventReverseSwap).toEqual(reverseSwap);

      eventEmitted = true;
    });

    await swapNursery['settleReverseSwap'](reverseSwap, transaction, vin);

    expect(mockSettleInvoice).toHaveBeenCalledTimes(1);
    expect(mockSettleInvoice).toHaveBeenCalledWith(getHexBuffer(preimage));

    expect(mockSetInvoiceSettled).toHaveBeenCalledTimes(1);
    expect(mockSetInvoiceSettled).toHaveBeenCalledWith(reverseSwap, preimage);

    expect(eventEmitted).toEqual(true);
  });

  test('should refund reverse swaps', async () => {
    const reverseSwap = {
      keyIndex: 42,
      pair: 'BTC/BTC',
      lockupAddress: 'bcrt1qmjnxhkk5qah2xp273tnce25dsfwa38t5ad0ja3',
      transactionId: 'ac30163148f6777fdb629dadf64e2ba2d927b1f412458a669a4afc3fe1cf4cda',
      redeemScript: 'a914379299189c7558198e8116b3e1e81e8d627df093876321023d9e44575cd6f03dbc851cc9a6e037339302d0faad6a8d86284745146850633e67017eb175210360ecf59b1bacc5787842a3b7094da57cf62e2fdb8cc63fbbf9c489aad782cbad68ac',
      invoice: 'lnbcrt1p0xu3acpp5e9x99zkxwvrsh3mg2mlcc7eeyzjfjm70lefna4fp5gk2s392l3aqdqqcqzpgsp5tvsv342p27h2hf86pudcx2nez0hlf0gkjymqytamh3ln9295rxlq9qy9qsqr90az7sykc20j63lu5sy5d6tjf8q248jn9jxl0x9dzc6r3md9g380ve4t87ype40xe0av0yhr8rtwwpt9eks99a0l5t8levnkscxergp9pggg3',
    } as ReverseSwap;

    let eventEmitted = false;

    swapNursery.once('refund', (eventReverseSwap) => {
      expect(eventReverseSwap).toEqual(reverseSwap);

      eventEmitted = true;
    });

    await swapNursery['refundReverseSwap'](
      reverseSwap,
      btcCurrency.chainClient,
      walletManager.wallets.get('BTC')!,
      340598,
    );

    expect(mockGetRawTransaction).toHaveBeenCalledTimes(1);
    expect(mockGetRawTransaction).toHaveBeenCalledWith(reverseSwap.transactionId);

    expect(mockEncodeAddress).toHaveBeenCalledTimes(1);
    expect(mockEncodeAddress).toHaveBeenCalledWith(getHexBuffer('00144e578277b2c88136775a369ebcc4a92ebb8bcf60'));

    expect(mockDecodeAddress).toHaveBeenCalledTimes(2);
    expect(mockDecodeAddress).toHaveBeenNthCalledWith(1, reverseSwap.lockupAddress);
    expect(mockDecodeAddress).toHaveBeenNthCalledWith(2, mockNewAddressResult);

    expect(mockRemoveInputFilter).toHaveBeenCalledTimes(1);
    expect(mockRemoveInputFilter).toHaveBeenCalledWith(Transaction.fromHex(mockGetRawTransactionResult).getHash());

    expect(mockRemoveOutputFilter).toHaveBeenCalledTimes(1);
    expect(mockRemoveOutputFilter).toHaveBeenCalledWith(mockDecodeAddressResult);

    expect(mockNewAddress).toHaveBeenCalledTimes(1);

    expect(mockGetKeysByIndex).toHaveBeenCalledTimes(1);
    expect(mockGetKeysByIndex).toHaveBeenCalledWith(reverseSwap.keyIndex);

    expect(mockSendRawTransaction).toHaveBeenCalledTimes(1);
    expect(mockSendRawTransaction).toHaveBeenCalledWith(expect.anything());

    expect(mockCancelInvoice).toHaveBeenCalledTimes(1);
    expect(mockCancelInvoice).toHaveBeenCalledWith(getHexBuffer('c94c528ac673070bc76856ff8c7b3920a4996fcffe533ed521a22ca844aafc7a'));

    expect(mockSetTransactionRefunded).toHaveBeenCalledTimes(1);
    expect(mockSetTransactionRefunded).toHaveBeenCalledWith(reverseSwap, 280);

    expect(eventEmitted).toEqual(true);
  });

  test('should cancel invoices', async () => {
    const preimageHash = getHexBuffer('2b3acbf64c1ffabbf29817726f04a1b1b873718164f1b1b941e2c1edaff68334');

    await swapNursery['cancelInvoice'](btcCurrency.lndClient, preimageHash);

    expect(mockCancelInvoice).toHaveBeenCalledTimes(1);
    expect(mockCancelInvoice).toHaveBeenCalledWith(preimageHash);
  });

  test('should pay invoices', async () => {
    expect(await swapNursery['payInvoice'](btcCurrency.lndClient, 'invoice')).toEqual({
      preimage: mockSendPaymentResponse.paymentPreimage,
      fee: mockSendPaymentResponse.paymentRoute.totalFeesMsat,
    });
    expect(await swapNursery['payInvoice'](btcCurrency.lndClient, 'fail')).toEqual(undefined);
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

  test('should handle transaction events', async () => {
    // Swaps
    const mockClaimSwap = jest.fn().mockImplementation(async () => {});
    swapNursery['claimSwap'] = mockClaimSwap;

    let eventsEmitted = 0;

    mockGetSwapResult = {
      pair: 'BTC/BTC',
      redeemScript: 'a9144c20f41b1ff5d0fd8b1a817e9fcb1e799eee600887632102ce0da7e0645b67b465374066d2c269e8255ae85f5d82be8f1306361b228a710367010ab17521032ec3e4027d70ac43b97ca8b693bfff604ca8a266e2a31351d1d6c1802b43005168ac',
      acceptZeroConf: true,
    };

    // 0-conf accepted
    const zeroConfTransaction = Transaction.fromHex('020000000001011d35c04887a4e56d815bd68f9b92533fa7fca3470e5ea8a46c535d29b4b0ee1e0000000000ffffffff01e8030000000000002200206d6378f3d60708fc2960a66dcfcb56cf4b15fc5745d6fa8964a78f1ae2129a890247304402202fa2a9b8d29adbe262c9492ce1a38e19fc150c36a1853c38b3004db262dda9e6022005711690cc25935d393ae1491b8f262d781e1203fac9d3fd86a0595d0d7517ee01210307a4820cabe35d2524363dbe34ebae92c9824df0a74088d4e55e99aa73b01cc300000000');

    swapNursery.once('transaction', (transaction, swap, confirmed, isReverse) => {
      expect(transaction).toEqual(zeroConfTransaction);
      expect(swap).toEqual(mockGetSwapResult);
      expect(confirmed).toEqual(false);
      expect(isReverse).toEqual(false);

      eventsEmitted += 1;
    });

    emitTransaction(zeroConfTransaction, false);

    await wait(50);

    expect(eventsEmitted).toEqual(1);

    expect(mockGetSwap).toHaveBeenCalledTimes(1);
    expect(mockGetSwap).toHaveBeenCalledWith({
      status: {
        [Op.or]: [
          SwapUpdateEvent.InvoiceSet,
          SwapUpdateEvent.SwapCreated,
          SwapUpdateEvent.TransactionMempool,
        ],
      },
      lockupAddress: {
        [Op.eq]: mockEncodeAddressResult,
      },
    });

    expect(mockEncodeAddress).toHaveBeenCalledTimes(1);
    expect(mockEncodeAddress).toHaveBeenCalledWith(zeroConfTransaction.outs[0].script);

    expect(mockSetLockupTransactionId).toHaveBeenCalledTimes(1);
    expect(mockSetLockupTransactionId).toHaveBeenCalledWith(mockGetSwapResult, 1, zeroConfTransaction.getId(), 1000, false);

    expect(mockRemoveOutputFilter).toHaveBeenCalledTimes(1);
    expect(mockRemoveOutputFilter).toHaveBeenCalledWith(zeroConfTransaction.outs[0].script);

    expect(mockClaimSwap).toHaveBeenCalledTimes(1);
    expect(mockClaimSwap).toHaveBeenCalledWith(btcCurrency, walletManager.wallets.get('BTC'), mockGetSwapResult, zeroConfTransaction, 0);

    // 0-conf failed
    const rbfTransaction = Transaction.fromHex('020000000001011d35c04887a4e56d815bd68f9b92533fa7fca3470e5ea8a46c535d29b4b0ee1e0000000000fdffffff01e8030000000000002200206d6378f3d60708fc2960a66dcfcb56cf4b15fc5745d6fa8964a78f1ae2129a8902483045022100ae4566edf3799587724533a0f3a8d1ce28e00cec3759301edda45d637a93a4b202204b7bfd36534305352dcc2d54f7b5132bf773abe404ac1bb56842a103e9af3e1f01210308c52966a440133b8292e19bfa8400b6cd6d69dadf67b9ef7a8c0cb38eac748600000000');

    swapNursery.once('transaction', (transaction, swap, confirmed, isReverse) => {
      expect(transaction).toEqual(rbfTransaction);
      expect(swap).toEqual(mockGetSwapResult);
      expect(confirmed).toEqual(false);
      expect(isReverse).toEqual(false);

      eventsEmitted += 1;
    });

    swapNursery.once('zeroconf.rejected', (swap, reason) => {
      expect(swap).toEqual(mockGetSwapResult);
      expect(reason).toEqual('transaction or one of its unconfirmed ancestors signals RBF');

      eventsEmitted += 1;
    });

    emitTransaction(rbfTransaction, false);

    await wait(50);

    expect(eventsEmitted).toEqual(3);

    expect(mockGetSwap).toHaveBeenCalledTimes(2);
    expect(mockGetSwap).toHaveBeenNthCalledWith(2, {
      status: {
        [Op.or]: [
          SwapUpdateEvent.InvoiceSet,
          SwapUpdateEvent.SwapCreated,
          SwapUpdateEvent.TransactionMempool,
        ],
      },
      lockupAddress: {
        [Op.eq]: mockEncodeAddressResult,
      },
    });

    expect(mockEncodeAddress).toHaveBeenCalledTimes(2);
    expect(mockEncodeAddress).toHaveBeenNthCalledWith(2, rbfTransaction.outs[0].script);

    expect(mockSetLockupTransactionId).toHaveBeenCalledTimes(2);
    expect(mockSetLockupTransactionId).toHaveBeenNthCalledWith(2, mockGetSwapResult, 1, rbfTransaction.getId(), 1000, false);

    // Should accept 0-conf if the transaction is confirmed
    const confirmedTransaction = zeroConfTransaction;

    swapNursery.once('transaction', (transaction, swap, confirmed, isReverse) => {
      expect(transaction).toEqual(confirmedTransaction);
      expect(swap).toEqual(mockGetSwapResult);
      expect(confirmed).toEqual(true);
      expect(isReverse).toEqual(false);

      eventsEmitted += 1;
    });

    emitTransaction(confirmedTransaction, true);

    await wait(50);

    expect(eventsEmitted).toEqual(4);

    expect(mockGetSwap).toHaveBeenCalledTimes(3);
    expect(mockGetSwap).toHaveBeenNthCalledWith(3, {
      status: {
        [Op.or]: [
          SwapUpdateEvent.InvoiceSet,
          SwapUpdateEvent.SwapCreated,
          SwapUpdateEvent.TransactionMempool,
        ],
      },
      lockupAddress: {
        [Op.eq]: mockEncodeAddressResult,
      },
    });

    expect(mockEncodeAddress).toHaveBeenCalledTimes(3);
    expect(mockEncodeAddress).toHaveBeenNthCalledWith(3, confirmedTransaction.outs[0].script);

    expect(mockSetLockupTransactionId).toHaveBeenCalledTimes(3);
    expect(mockSetLockupTransactionId).toHaveBeenNthCalledWith(3, mockGetSwapResult, 1, confirmedTransaction.getId(), 1000, true);

    expect(mockRemoveOutputFilter).toHaveBeenCalledTimes(2);
    expect(mockRemoveOutputFilter).toHaveBeenNthCalledWith(2, confirmedTransaction.outs[0].script);

    expect(mockClaimSwap).toHaveBeenCalledTimes(2);
    expect(mockClaimSwap).toHaveBeenNthCalledWith(2, btcCurrency, walletManager.wallets.get('BTC'), mockGetSwapResult, confirmedTransaction, 0);

    mockGetSwapResult = undefined;

    mockGetReverseSwap.mockClear();
    mockRemoveOutputFilter.mockClear();

    // Reverse swaps
    const mockSettleReverseSwap = jest.fn().mockImplementation(async () => {});
    swapNursery['settleReverseSwap'] = mockSettleReverseSwap;

    mockGetReverseSwapResult = {
      pair: 'BTC/BTC',
      lockupAddress: '2MyVkzuTMnyTyBFB35Ar8aSuimyBHZv8eS7',
    };

    const reverseTransaction = constructTransaction(true, explicitTxInput);

    let eventEmitted = false;

    swapNursery.once('transaction', (eventTransaction, reverseSwap, confirmed, isReverse) => {
      expect(eventTransaction).toEqual(reverseTransaction);
      expect(reverseSwap).toEqual(mockGetReverseSwapResult);
      expect(confirmed).toEqual(true);
      expect(isReverse).toEqual(true);

      eventEmitted = true;
    });

    emitTransaction(reverseTransaction, true);

    await wait(50);

    expect(mockGetReverseSwap).toHaveBeenCalledTimes(2);

    // Confirmation event
    expect(eventEmitted).toEqual(true);

    expect(mockGetReverseSwap).toHaveBeenNthCalledWith(1,
      {
        status: {
          [Op.eq]: SwapUpdateEvent.TransactionMempool,
        },
        transactionId: {
          [Op.eq]: reverseTransaction.getId(),
        },
      },
    );

    expect(mockDecodeAddress).toHaveBeenCalledTimes(1);
    expect(mockDecodeAddress).toHaveBeenCalledWith(mockGetReverseSwapResult.lockupAddress);

    expect(mockRemoveOutputFilter).toHaveBeenCalledTimes(1);
    expect(mockRemoveOutputFilter).toHaveBeenCalledWith(mockDecodeAddressResult);

    expect(mockSetReverseSwapStatus).toHaveBeenCalledTimes(1);
    expect(mockSetReverseSwapStatus).toHaveBeenCalledWith(mockGetReverseSwapResult, SwapUpdateEvent.TransactionConfirmed);

    // Settling of invoice
    expect(mockGetReverseSwap).toHaveBeenNthCalledWith(2,
      {
        status: {
          [Op.or]: [
            SwapUpdateEvent.TransactionMempool,
            SwapUpdateEvent.TransactionConfirmed,
          ],
        },
        transactionId: {
          [Op.eq]: explicitTxInput,
        },
      },
    );

    expect(mockRemoveInputFilter).toHaveBeenCalledTimes(1);
    expect(mockRemoveInputFilter).toHaveBeenCalledWith(reverseBuffer(getHexBuffer(explicitTxInput)));

    expect(mockSettleReverseSwap).toHaveBeenCalledTimes(1);
    expect(mockSettleReverseSwap).toHaveBeenCalledWith(mockGetReverseSwapResult, reverseTransaction, 0);

    mockGetReverseSwapResult = undefined;
  });

  test('should handle block events', async () => {
    // Swaps
    mockGetSwapsResult = [
      {
        pair: 'BTC/BTC',
        orderSide: OrderSide.BUY,
      },
      // Wrong chain currency
      {
        pair: 'LTC/BTC',
        orderSide: OrderSide.SELL,
      },
    ];

    const blockHeight = 328;

    let eventEmitted = false;

    swapNursery.once('expiration', (swap, isReverse) => {
      expect(swap).toEqual(mockGetSwapsResult[0]);
      expect(isReverse).toEqual(false);

      eventEmitted = true;
    });

    emitBlock(blockHeight);

    await wait(50);

    expect(eventEmitted).toEqual(true);

    expect(mockGetSwaps).toHaveBeenCalledTimes(1);
    expect(mockGetSwaps).toHaveBeenCalledWith({
      status: {
        [Op.not]: [
          SwapUpdateEvent.SwapExpired,
          SwapUpdateEvent.InvoiceFailedToPay,
          SwapUpdateEvent.TransactionClaimed,
        ],
      },
      timeoutBlockHeight: {
        [Op.lte]: blockHeight,
      },
    });

    expect(mockSetSwapStatus).toHaveBeenCalledTimes(1);
    expect(mockSetSwapStatus).toHaveBeenCalledWith(mockGetSwapsResult[0], SwapUpdateEvent.SwapExpired);

    eventEmitted = false;
    mockGetSwapsResult = [];

    // Reverse swaps
    const mockRefundReverseSwap = jest.fn().mockImplementation(async () => {});
    swapNursery['refundReverseSwap'] = mockRefundReverseSwap;

    mockGetReverseSwapsResult = [
      // Refund
      {
        pair: 'BTC/BTC',
        orderSide: OrderSide.BUY,
        status: SwapUpdateEvent.TransactionMempool,
      },
      {
        pair: 'BTC/BTC',
        orderSide: OrderSide.BUY,
        status: SwapUpdateEvent.TransactionConfirmed,
      },
      // Expiration
      {
        pair: 'BTC/BTC',
        orderSide: OrderSide.BUY,
      },
      // Wrong chain currency
      {
        pair: 'LTC/BTC',
        orderSide: OrderSide.BUY,
      },
    ];

    swapNursery.once('expiration', (reverseSwap, isReverse) => {
      expect(reverseSwap).toEqual(mockGetReverseSwapsResult[2]);
      expect(isReverse).toEqual(true);

      eventEmitted = true;
    });

    emitBlock(blockHeight);

    await wait(50);

    // Expiration
    expect(eventEmitted).toEqual(true);

    expect(mockSetReverseSwapStatus).toHaveBeenCalledTimes(1);
    expect(mockSetReverseSwapStatus).toHaveBeenCalledWith(mockGetReverseSwapsResult[2], SwapUpdateEvent.SwapExpired);

    // Refund
    expect(mockRefundReverseSwap).toHaveBeenCalledTimes(2);
    expect(mockRefundReverseSwap).toHaveBeenNthCalledWith(1,
      mockGetReverseSwapsResult[0],
      btcCurrency.chainClient,
      walletManager.wallets.get('BTC'),
      blockHeight,
    );
    expect(mockRefundReverseSwap).toHaveBeenNthCalledWith(2,
      mockGetReverseSwapsResult[1],
      btcCurrency.chainClient,
      walletManager.wallets.get('BTC'),
      blockHeight,
    );

    mockGetReverseSwapsResult = [];
  });

  test('should handle HTLC acceptance', async () => {
    mockGetReverseSwapResult = {};

    const mockSendReverseSwapCoins = jest.fn().mockImplementation(async () => {});
    swapNursery['sendReverseSwapCoins'] = mockSendReverseSwapCoins;

    const invoice = 'lnbcrt1p0xl0gkpp5syfwzw2j5t0gtaj95h2xtz69nfranyky73p4s8p4x0tel74lcm8sdqqcqzpgsp59t0z6vnxrp9yj0aw0zmc808pd0j75yrtr4qaqrpa2jpu5wmvp4dq9qy9qsqk7u0wv4l4tkpzyzy73yae9wp76kestgu74uj6mg6plp6hehtm5p9a9kkdr5mxljxg6wxdsvhmk6q7qtlq6zpeuvnmztrwt3mesxscpqqcsljq8';

    emitHtlcAccepted(invoice);

    await wait(50);

    expect(mockGetReverseSwap).toHaveBeenCalledTimes(1);
    expect(mockGetReverseSwap).toHaveBeenCalledWith({
      invoice: {
        [Op.eq]: invoice,
      },
    });

    expect(mockSendReverseSwapCoins).toHaveBeenCalledTimes(1);
    expect(mockSendReverseSwapCoins).toHaveBeenCalledWith(mockGetReverseSwapResult);

    // Should not try to send coins if not reverse swap was found
    mockGetReverseSwapResult = undefined;

    emitHtlcAccepted(invoice);

    await wait(50);

    expect(mockGetReverseSwap).toHaveBeenCalledTimes(2);
    expect(mockGetReverseSwap).toHaveBeenLastCalledWith({
      invoice: {
        [Op.eq]: invoice,
      },
    });

    expect(mockSendReverseSwapCoins).toHaveBeenCalledTimes(1);
  });
});
