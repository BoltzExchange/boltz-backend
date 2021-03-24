import { Op } from 'sequelize';
import { Networks } from 'boltz-core';
import { Transaction, address } from 'bitcoinjs-lib';
import Logger from '../../../lib/Logger';
import Errors from '../../../lib/swap/Errors';
import Wallet from '../../../lib/wallet/Wallet';
import UtxoNursery from '../../../lib/swap/UtxoNursery';
import ChainClient from '../../../lib/chain/ChainClient';
import SwapRepository from '../../../lib/db/SwapRepository';
import { OrderSide, SwapUpdateEvent } from '../../../lib/consts/Enums';
import ReverseSwapRepository from '../../../lib/db/ReverseSwapRepository';
import { getHexBuffer, reverseBuffer, transactionHashToId } from '../../../lib/Utils';

type blockCallback = (height: number) => void;

let emitBlock: blockCallback;

const mockOnChainClient = jest.fn().mockImplementation((event: string, callback: any) => {
  switch (event) {
    case 'block':
      emitBlock = callback;
      break;
  }
});

const sampleRedeemScript = getHexBuffer('a9146575342754627fcff96fe4d186e497d88e52ebd78763210263f5775d4e5688f51f4c2fa03f75d1eee1deff2b1bc6e266dedb16c00aba160c6703d8791cb17521033b6a33a6e88da8bb44737b844b48626e5061aff2a5573167ad841d7187aac97168ac');

let mockEstimateFeeResult = 2;
const mockEstimateFee = jest.fn().mockImplementation(async () => {
  return mockEstimateFeeResult;
});

const mockGetRawTransaction = jest.fn().mockImplementation(async (transactionId: string) => {
  switch (transactionId) {
    case 'a21b0b3763a64ce2e5da23c52e3496c70c2b3268a37633653e21325ba64d4056':
      return '0100000000010148add838e8f7ea87f02d821640798d27a8999d890d939b21ff9b07e66c5dd53f0100000000ffffffff02a08601000000000017a914dc98e4ed71744bbaa0445f31745f7dd3481a9a8687a67c42020000000016001429294a57be065aab13c86eb6a7b29a70acdbd7ad02483045022100fb51263b29542d108f7534545b03f88d1b8a1cf0d027a5da771296d28bdfb66a022026be55aaea78818f220c1110a283365475dfc64dc7f61049dff0dc82cc52bcee01210376b43cc365901c197a74f4a803efdd4d8428ef97a1ac5a9f10016924f90bc4bf00000000';
    case '62af53c6dcda51c4ebac3309b85ce2ca043a912f127250c51e19b1de82299730':
      return '01000000000101566da34f5a70fd6021949f8517defca01d35d38f6d4a2fb3485f30c161a6102000000000232200208e073b6e2fb80797035b7fdbca584c04a1b9298855f05d1cf456ce726a85c6ea0000000001702a000000000000160014ca8f8b0a6f66940dce46eea1124648b9966bc70c0347304402205932d6acc8e3d6f691fc42739922f85ae01705528269ac7ae6273ad8aaff1d7602204f9b37e331a8bfd91f6e612210b27f5b64510e8ed6a5a3dcc1fc731fb5a0fff6010065a9149e8c2755f845cabfff9ba32c47189d9ad0dc16f48763210316252738ba05c03064f7d8ea7f9abda05f067f9a91c2b407a1711c321500b5e0670341791cb17521037ee9507deb4f9a1f637097f4fadc71efa8c79b026839b3662c2d31706c87b6c368ac41791c00';
    default:
      throw 'transaction not found';
  }
});

const mockRemoveInputFilter = jest.fn().mockImplementation(() => {});
const mockRemoveOutputFilter = jest.fn().mockImplementation(() => {});

const sampleTransactions = {
  claim: '01000000000101f491d1fcf639154425857d813bed7a8164c1db22ec9e148e1dc610ddd54cbfac010000000000000000016b2620000000000016001453914945b40ec9c4ce2701a8cf4d22d97ee12eb103483045022100a6c0c4627368feccfa147adddb6992f4d8a392345af5eaf82c8a7781a9b6eec7022079d26ee7c4570069d107c19de6e17512b4fbe77ffc8af5d5ffb909bfec3b469801200c25a0d5b61ae3f3dc6889742aefddc5608ebc8bae6dfa96e1a1481c5db7d5ed6a8201208763a9147c7c86826b8b5729fb3a034eca9be10a55fccd11882102c2f4d7d446e9304926e3ee4b769fed20be7f94dcb61c635867d7f37c6e8c4f08677503abff09b1752103714b3407f4085db73462bd3a21c1e4f6516d7f32b076c96cca9275faabda719568ac00000000',
  lockup: '0200000000010256404da65b32213e653376a368322b0cc796342ec523dae5e24ca663370b1ba2000000001716001462c3624e54b4514081681fde1ea05b15f3d1539b0000000030972982deb1191ec55072122f913a04cae25cb80933acebc451dadcc653af6200000000000000000001768701000000000017a914f57496106375de4141829b3925918d2295d080508702483045022100dbf4a4711d716b164f378aeff95b9a498cf00eac708f33a510fb84b2d3e3a21102201a15a031c44e8d67d52de9591a8f908e9e9c0ed80d999be45e9f60f528c31658012103b15acf8264f9d9df2d611c5661aff897755e4a71d868c363396f5096b565ae98024730440220343467e26a848696c42c346bf5b398ba488638a77806000852a8114146cd7c880220222a4cf261f535b5f03bdf06e2dca9a46336f5710fdfe4e5090dc697c12f9bf0012103a0fd09bab21602e66f0795e55c51236d624af1cc1f34383e157773c1ca592743b0791c00',

  rbf: '010000000001010b33cdbf485ed1516cff15b0bbe2670fa3d88b8020b65b09ee4086352803c47000000000000000000002c00e16020000000017a9142879c913239d33e0849eada775980c9e2931aee987cc35e40000000000160014f151250d70250e8b8d13410b7dd9b2863672bb7f024830450221009c4d24fcd65aae8d075b6382e39b7a259eec9c0860affe0ecb9272099c4d6f9d022000e3f68fdcaed74d196172dfda82cd7b05af991eeba7b4f882734980f61bf13801210258b05b768da0e42e01b47a7c23000682d68832e138418b92d5dca145c83ca2b400000000',
  nonRbf: '02000000014aa073a7737e155b9500c17c2a56a0668171fec2bda2bc75b0a41b2f36549706190000006a47304402204f7a81a09a872b498a5d4f06830aee4573834ba5f272536c22de05b3fb824f8802203842aabd9e98c5f354630342e72794347f28048f9938c7c0d58abe0bfaac22fd012103ca4a5dc16b459848c97032aa38a4331ed6b964e765eb69c9b5b75dfd83849071feffffff01b8f1090000000000160014d212c6da022ed8877f5c1be3b6307c3569e5148d38fc0900',
};

let mockGetRawTransactionVerboseResult: any = () => {
  return undefined;
};
const mockGetRawTransactionVerbose = jest.fn().mockImplementation(async (transactionId: string) => {
  return mockGetRawTransactionVerboseResult(transactionId);
});

jest.mock('../../../lib/chain/ChainClient', () => {
  return jest.fn().mockImplementation((symbol) => ({
    symbol,
    on: mockOnChainClient,
    estimateFee: mockEstimateFee,
    getRawTransaction: mockGetRawTransaction,
    removeInputFilter: mockRemoveInputFilter,
    removeOutputFilter: mockRemoveOutputFilter,
    getRawTransactionVerbose: mockGetRawTransactionVerbose,
  }));
});

const MockedChainClient = <jest.Mock<ChainClient>><any>ChainClient;

const decodeAddress = (toDecode: string) => address.toOutputScript(toDecode, Networks.bitcoinMainnet);
const mockDecodeAddress = jest.fn().mockImplementation((toDecode: string) => {
  return decodeAddress(toDecode);
});

const encodeAddress = (script: Buffer) => address.fromOutputScript(script, Networks.bitcoinMainnet);
const mockEncodeAddress = jest.fn().mockImplementation((script: Buffer) => {
  return encodeAddress(script);
});

jest.mock('../../../lib/wallet/Wallet', () => {
  return jest.fn().mockImplementation(() => ({
    decodeAddress: mockDecodeAddress,
    encodeAddress: mockEncodeAddress,
  }));
});

const MockedWallet = <jest.Mock<Wallet>><any>Wallet;

let mockGetSwapResult: any = null;
const mockGetSwap = jest.fn().mockImplementation(async () => {
  return mockGetSwapResult;
});

let mockGetSwapsExpirableResult: any[] = [];
const mockGetSwapsExpirable = jest.fn().mockImplementation(async () => {
  return mockGetSwapsExpirableResult;
});

const mockSetLockupTransaction = jest.fn().mockImplementation(async (arg) => arg);

jest.mock('../../../lib/db/SwapRepository', () => {
  return jest.fn().mockImplementation(() => ({
    getSwap: mockGetSwap,
    getSwapsExpirable: mockGetSwapsExpirable,
    setLockupTransaction: mockSetLockupTransaction,
  }));
});

const MockedSwapRepository = <jest.Mock<SwapRepository>>SwapRepository;

let mockGetReverseSwapResult: any = null;
const mockGetReverseSwap = jest.fn().mockImplementation(async () => {
  return mockGetReverseSwapResult;
});

let mockGetReverseSwapsResult: any[] = [];
const mockGetReverseSwaps = jest.fn().mockImplementation(async () => {
  return mockGetReverseSwapsResult;
});

let mockGetReverseSwapsExpirableResult: any[] = [];
const mockGetReverseSwapsExpirable = jest.fn().mockImplementation(async() => {
  return mockGetReverseSwapsExpirableResult;
});

const mockSetReverseSwapStatus = jest.fn().mockImplementation(async (arg) => arg);

jest.mock('../../../lib/db/ReverseSwapRepository', () => {
  return jest.fn().mockImplementation(() => ({
    getReverseSwap: mockGetReverseSwap,
    getReverseSwaps: mockGetReverseSwaps,
    setReverseSwapStatus: mockSetReverseSwapStatus,
    getReverseSwapsExpirable: mockGetReverseSwapsExpirable
  }));
});

const MockedReverseSwapRepository = <jest.Mock<ReverseSwapRepository>>ReverseSwapRepository;

describe('UtxoNursery', () => {
  const btcWallet = new MockedWallet();
  const btcChainClient = new MockedChainClient('BTC');

  const nursery = new UtxoNursery(
    Logger.disabledLogger,
    {
      wallets: new Map<string, any>([
        ['BTC', btcWallet],
      ]),
    } as any,
    new MockedSwapRepository(),
    new MockedReverseSwapRepository(),
  );

  beforeEach(() => {
    mockGetReverseSwapsResult = [];

    jest.clearAllMocks();
    nursery.removeAllListeners();
  });

  test('should init', () => {
    nursery.bindCurrency([
      {
        symbol: 'BTC',
        chainClient: btcChainClient,
      } as any,
    ]);

    expect(mockOnChainClient).toHaveBeenCalledTimes(2);
    expect(mockOnChainClient).toHaveBeenCalledWith('block', expect.anything());
    expect(mockOnChainClient).toHaveBeenCalledWith('transaction', expect.anything());
  });

  test('should handle confirmed Swap outputs', async () => {
    const checkSwapOutputs = nursery['checkSwapOutputs'];

    const transaction = Transaction.fromHex(sampleTransactions.lockup);

    let eventEmitted = false;

    mockGetSwapResult = {
      id: 'id',
      expectedAmount: 100214,
      redeemScript: sampleRedeemScript,
    };

    nursery.once('swap.lockup', (swap, emittedTransaction, confirmed) => {
      expect(swap).toEqual(mockGetSwapResult);
      expect(emittedTransaction).toEqual(transaction);
      expect(confirmed).toEqual(true);

      eventEmitted = true;
    });

    await checkSwapOutputs(btcChainClient, btcWallet, transaction, true);

    expect(eventEmitted).toEqual(true);

    expect(mockGetSwap).toHaveBeenCalledTimes(1);
    expect(mockGetSwap).toHaveBeenCalledWith({
      status: {
        [Op.or]: [
          SwapUpdateEvent.SwapCreated,
          SwapUpdateEvent.InvoiceSet,
          SwapUpdateEvent.TransactionMempool,
          SwapUpdateEvent.TransactionZeroConfRejected,
        ],
      },
      lockupAddress: {
        [Op.eq]: encodeAddress(transaction.outs[0].script),
      }
    });

    expect(mockEncodeAddress).toHaveBeenCalledTimes(1);
    expect(mockEncodeAddress).toHaveBeenCalledWith(transaction.outs[0].script);

    expect(mockSetLockupTransaction).toHaveBeenCalledTimes(1);
    expect(mockSetLockupTransaction).toHaveBeenCalledWith(
      mockGetSwapResult,
      transaction.getId(),
      transaction.outs[0].value,
      true,
      0,
    );

    expect(mockRemoveOutputFilter).toHaveBeenCalledTimes(1);
    expect(mockRemoveOutputFilter).toHaveBeenCalledWith(transaction.outs[0].script);

    jest.clearAllMocks();

    // Should handle transactions that lockup less coins than expected
    eventEmitted = false;

    mockGetSwapResult.expectedAmount += 1;

    nursery.once('swap.lockup.failed', (swap, error) => {
      expect(swap).toEqual(mockGetSwapResult);
      expect(error).toEqual(Errors.INSUFFICIENT_AMOUNT(transaction.outs[0].value, mockGetSwapResult.expectedAmount).message);

      eventEmitted = true;
    });

    await checkSwapOutputs(btcChainClient, btcWallet, transaction, true);

    expect(eventEmitted).toEqual(true);

    expect(mockGetSwap).toHaveBeenCalledTimes(1);
    expect(mockEncodeAddress).toHaveBeenCalledTimes(1);
    expect(mockSetLockupTransaction).toHaveBeenCalledTimes(1);

    expect(mockRemoveOutputFilter).toHaveBeenCalledTimes(1);
    expect(mockRemoveOutputFilter).toHaveBeenCalledWith(transaction.outs[0].script);

    jest.clearAllMocks();

    // Should ignore transactions that are not lockups of Swaps
    mockGetSwapResult = null;

    await checkSwapOutputs(btcChainClient, btcWallet, transaction, true);

    expect(mockGetSwap).toHaveBeenCalledTimes(1);
    expect(mockEncodeAddress).toHaveBeenCalledTimes(1);
    expect(mockSetLockupTransaction).toHaveBeenCalledTimes(0);
  });

  test('should handle unconfirmed Swap outputs', async () => {
    const checkSwapOutputs = nursery['checkSwapOutputs'];

    const transaction = Transaction.fromHex(sampleTransactions.lockup);
    transaction.ins[0].sequence = 0xffffffff;
    transaction.ins[1].sequence = 0xffffffff;

    let eventEmitted = false;

    mockGetSwapResult = {
      id: '0conf',
      acceptZeroConf: true,
      redeemScript: sampleRedeemScript,
    };

    mockGetRawTransactionVerboseResult = () => ({
      confirmations: 1,
    });

    nursery.once('swap.lockup', () => {
      eventEmitted = true;
    });

    await checkSwapOutputs(btcChainClient, btcWallet, transaction, false);

    expect(mockGetSwap).toHaveBeenCalledTimes(1);
    expect(mockEncodeAddress).toHaveBeenCalledTimes(1);
    expect(mockSetLockupTransaction).toHaveBeenCalledTimes(1);
    expect(mockRemoveOutputFilter).toHaveBeenCalledTimes(1);

    expect(eventEmitted).toEqual(true);

    jest.clearAllMocks();

    // Should reject 0-conf for Swaps that don't allow it
    eventEmitted = false;

    mockGetSwapResult.acceptZeroConf = null;

    nursery.once('swap.lockup.zeroconf.rejected', (swap, emittedTransaction, reason) => {
      expect(swap).toEqual(mockGetSwapResult);
      expect(emittedTransaction).toEqual(transaction);
      expect(reason).toEqual(Errors.SWAP_DOES_NOT_ACCEPT_ZERO_CONF().message);

      eventEmitted = true;
    });

    await checkSwapOutputs(btcChainClient, btcWallet, transaction, false);

    expect(eventEmitted).toEqual(true);

    expect(mockGetSwap).toHaveBeenCalledTimes(1);
    expect(mockEncodeAddress).toHaveBeenCalledTimes(1);
    expect(mockSetLockupTransaction).toHaveBeenCalledTimes(1);
    expect(mockRemoveOutputFilter).toHaveBeenCalledTimes(0);

    jest.clearAllMocks();

    // Should reject 0-conf for RBF lockup transactions
    eventEmitted = false;

    mockGetSwapResult.acceptZeroConf = true;

    const rbfTransaction = transaction.clone();
    // Since the backend code doesn't verify signatures, we can modify the transaction object as we please
    rbfTransaction.ins[0].sequence = 0xffffffff - 2;

    nursery.once('swap.lockup.zeroconf.rejected', (swap, emittedTransaction, reason) => {
      expect(swap).toEqual(mockGetSwapResult);
      expect(emittedTransaction).toEqual(rbfTransaction);
      expect(reason).toEqual(Errors.LOCKUP_TRANSACTION_SIGNALS_RBF().message);

      eventEmitted = true;
    });

    await checkSwapOutputs(btcChainClient, btcWallet, rbfTransaction, false);

    expect(eventEmitted).toEqual(true);

    expect(mockGetSwap).toHaveBeenCalledTimes(1);
    expect(mockEncodeAddress).toHaveBeenCalledTimes(1);
    expect(mockSetLockupTransaction).toHaveBeenCalledTimes(1);
    expect(mockRemoveOutputFilter).toHaveBeenCalledTimes(0);

    jest.clearAllMocks();

    // Should reject 0-conf non RBF lockup transactions if their fee is too low
    eventEmitted = false;

    mockEstimateFeeResult = 123;

    nursery.once('swap.lockup.zeroconf.rejected', (swap, emittedTransaction, reason) => {
      expect(swap).toEqual(mockGetSwapResult);
      expect(emittedTransaction).toEqual(transaction);
      expect(reason).toEqual(Errors.LOCKUP_TRANSACTION_FEE_TOO_LOW().message);

      eventEmitted = true;
    });

    await checkSwapOutputs(btcChainClient, btcWallet, transaction, false);

    expect(eventEmitted).toEqual(true);

    expect(mockGetSwap).toHaveBeenCalledTimes(1);
    expect(mockEncodeAddress).toHaveBeenCalledTimes(1);
    expect(mockSetLockupTransaction).toHaveBeenCalledTimes(1);
    expect(mockEstimateFee).toHaveBeenCalledTimes(1);
    expect(mockGetRawTransaction).toHaveBeenCalledTimes(2);
    expect(mockGetRawTransaction).toHaveBeenNthCalledWith(1, 'a21b0b3763a64ce2e5da23c52e3496c70c2b3268a37633653e21325ba64d4056');
    expect(mockGetRawTransaction).toHaveBeenNthCalledWith(2, '62af53c6dcda51c4ebac3309b85ce2ca043a912f127250c51e19b1de82299730');

    expect(mockRemoveOutputFilter).toHaveBeenCalledTimes(0);
  });

  test('should handle claimed Reverse Swaps', async () => {
    const checkReverseSwapsClaims = nursery['checkReverseSwapClaims'];

    const transaction = Transaction.fromHex(sampleTransactions.claim);

    mockGetReverseSwapResult = {
      id: 'id',
    };

    let eventEmitted = false;

    nursery.once('reverseSwap.claimed', (reverseSwap, preimage) => {
      expect(reverseSwap).toEqual(mockGetReverseSwapResult);
      expect(preimage).toEqual(getHexBuffer('0c25a0d5b61ae3f3dc6889742aefddc5608ebc8bae6dfa96e1a1481c5db7d5ed'));

      eventEmitted = true;
    });

    await checkReverseSwapsClaims(btcChainClient, transaction);

    expect(eventEmitted).toEqual(true);

    expect(mockGetReverseSwap).toHaveBeenCalledTimes(1);
    expect(mockGetReverseSwap).toHaveBeenCalledWith({
      status: {
        [Op.or]: [
          SwapUpdateEvent.TransactionMempool,
          SwapUpdateEvent.TransactionConfirmed,
        ],
      },
      transactionId: {
        [Op.eq]: transactionHashToId(transaction.ins[0].hash),
      },
      transactionVout: {
        [Op.eq]: transaction.ins[0].index,
      },
    });

    expect(mockRemoveInputFilter).toHaveBeenCalledTimes(1);
    expect(mockRemoveInputFilter).toHaveBeenCalledWith(transaction.ins[0].hash);

    jest.clearAllMocks();

    // Should ignore transactions that are not claims of a Reverse Swap
    mockGetReverseSwapResult = null;

    await checkReverseSwapsClaims(btcChainClient, transaction);

    expect(mockGetReverseSwap).toHaveBeenCalledTimes(1);
    expect(mockRemoveInputFilter).toHaveBeenCalledTimes(0);
  });

  test('should handle confirmed Reverse Swap lockups via transaction events', async () => {
    const checkReverseSwapLockupsConfirmed = nursery['checkReverseSwapLockupsConfirmed'];

    const transaction = Transaction.fromHex(sampleTransactions.rbf);

    mockGetReverseSwapResult = {
      id: 'id',
      lockupAddress: '1DuELuuVMPPw5gGcS7uq9eFsPMknj9tQNc',
    };

    let eventEmitted = false;

    nursery.on('reverseSwap.lockup.confirmed', (reverseSwap, emittedTransaction) => {
      expect(reverseSwap).toEqual(mockGetReverseSwapResult);
      expect(emittedTransaction).toEqual(transaction);

      eventEmitted = true;
    });

    await checkReverseSwapLockupsConfirmed(
      btcChainClient,
      btcWallet,
      transaction,
      true,
    );

    expect(eventEmitted).toEqual(true);

    expect(mockGetReverseSwap).toHaveBeenCalledTimes(1);
    expect(mockGetReverseSwap).toHaveBeenCalledWith({
      status: {
        [Op.eq]: SwapUpdateEvent.TransactionMempool,
      },
      transactionId: {
        [Op.eq]: transaction.getId(),
      },
    });

    expect(mockRemoveOutputFilter).toHaveBeenCalledTimes(1);
    expect(mockRemoveOutputFilter).toHaveBeenCalledWith(decodeAddress(mockGetReverseSwapResult.lockupAddress));

    expect(mockSetReverseSwapStatus).toHaveBeenCalledTimes(1);
    expect(mockSetReverseSwapStatus).toHaveBeenCalledWith(mockGetReverseSwapResult, SwapUpdateEvent.TransactionConfirmed);

    jest.clearAllMocks();

    // Should ignore unconfirmed transactions
    await checkReverseSwapLockupsConfirmed(
      btcChainClient,
      btcWallet,
      transaction,
      false,
    );

    expect(mockGetReverseSwap).toHaveBeenCalledTimes(0);

    jest.clearAllMocks();

    // Should ignore transaction that are not lockups of a Reverse Swaps
    mockGetReverseSwapResult = null;

    await checkReverseSwapLockupsConfirmed(
      btcChainClient,
      btcWallet,
      transaction,
      true,
    );

    expect(mockGetReverseSwap).toHaveBeenCalledTimes(1);
    expect(mockRemoveInputFilter).toHaveBeenCalledTimes(0);
  });

  test('should handle confirmed Reverse Swap lockups via block events', async () => {
    mockGetReverseSwapsResult = [
      // The transaction of this Reverse Swap is still in the mempool
      {
        id: 'mempool',
        lockupAddress: 'bc1ql279ggjjsy40nr2acmlmtcc95sexg8ty92pth5',
        transactionId: Transaction.fromHex(sampleTransactions.rbf).getId(),
      },
      // This ones transaction was confirmed but the transaction event was not properly emitted for it
      {
        id: 'nonMempool',
        lockupAddress: '3CxjzKKkxSa1eCRegA1KNS7KjXu1Hjhoqg',
        transactionId: Transaction.fromHex(sampleTransactions.nonRbf).getId(),
      },
    ];

    mockGetRawTransactionVerboseResult = (transactionId: string) => {
      if (transactionId === Transaction.fromHex(sampleTransactions.nonRbf).getId()) {
        return {
          confirmations: 1,
          hex: sampleTransactions.nonRbf,
        };
      }

      return {};
    };

    let eventsEmitted = 0;

    nursery.on('reverseSwap.lockup.confirmed', (reverseSwap, emittedTransaction) => {
      expect(reverseSwap).toEqual(mockGetReverseSwapsResult[1]);
      expect(emittedTransaction).toEqual(Transaction.fromHex(sampleTransactions.nonRbf));

      eventsEmitted += 1;
    });

    await emitBlock(1);

    expect(eventsEmitted).toEqual(1);

    expect(mockGetReverseSwaps).toHaveBeenCalledTimes(1);
    expect(mockGetReverseSwaps).toHaveBeenCalledWith({
      status: {
        [Op.eq]: SwapUpdateEvent.TransactionMempool,
      },
    });

    expect(mockGetRawTransactionVerbose).toHaveBeenCalledTimes(2);
    expect(mockGetRawTransactionVerbose).toHaveBeenNthCalledWith(1, mockGetReverseSwapsResult[0].transactionId);
    expect(mockGetRawTransactionVerbose).toHaveBeenNthCalledWith(2, mockGetReverseSwapsResult[1].transactionId);

    expect(mockDecodeAddress).toHaveBeenCalledTimes(1);
    expect(mockDecodeAddress).toHaveBeenCalledWith(mockGetReverseSwapsResult[1].lockupAddress);

    expect(mockRemoveOutputFilter).toHaveBeenCalledTimes(1);
    expect(mockRemoveOutputFilter).toHaveBeenCalledWith(decodeAddress(mockGetReverseSwapsResult[1].lockupAddress));

    expect(mockSetReverseSwapStatus).toHaveBeenCalledTimes(1);
    expect(mockSetReverseSwapStatus).toHaveBeenCalledWith(mockGetReverseSwapsResult[1], SwapUpdateEvent.TransactionConfirmed);
  });

  test('should handle expired Swaps', async () => {
    mockGetSwapsExpirableResult = [
      // Expired Swap
      {
        pair: 'BTC/USDT',
        orderSide: OrderSide.SELL,
        lockupAddress: '1DuELuuVMPPw5gGcS7uq9eFsPMknj9tQNc',
      },
      // Expired Swap with an onchain HTLC on the Ethereum chain that should not emit an event
      {
        pair: 'BTC/USDT',
        orderSide: OrderSide.BUY,
      },
    ];

    let eventEmitted = false;

    nursery.on('swap.expired', (swap) => {
      expect(swap).toEqual(mockGetSwapsExpirableResult[0]);

      eventEmitted = true;
    });

    const emittedBlockHeight = 123321;
    await emitBlock(emittedBlockHeight);

    expect(eventEmitted).toEqual(true);

    expect(mockGetSwapsExpirable).toHaveBeenCalledTimes(1);
    expect(mockGetSwapsExpirable).toHaveBeenCalledWith(emittedBlockHeight);

    expect(mockDecodeAddress).toHaveBeenCalledTimes(1);
    expect(mockDecodeAddress).toHaveBeenCalledWith(mockGetSwapsExpirableResult[0].lockupAddress);

    expect(mockRemoveOutputFilter).toHaveBeenCalledTimes(1);
    expect(mockRemoveOutputFilter).toHaveBeenCalledWith(decodeAddress(mockGetSwapsExpirableResult[0].lockupAddress));

    mockGetSwapsExpirableResult = [];
  });

  test('should handle expired Reverse Swaps', async () => {
    mockGetReverseSwapsExpirableResult = [
      // Expired Reverse Swap
      {
        pair: 'BTC/USDT',
        orderSide: OrderSide.BUY,
        lockupAddress: '1DuELuuVMPPw5gGcS7uq9eFsPMknj9tQNc',
      },
      // Expired Reverse Swap with a transaction id (lockup transaction)
      {
        pair: 'BTC/USDT',
        orderSide: OrderSide.BUY,
        lockupAddress: '1DtQRpZCbX42rxRmkZ8pvS3rytPyV92aVQ',
        transactionId: 'aab14a840e63b6ad3134d9b8d651eee9e95ab793fddff4bc3ab5392fcf7854e2',
      },
      // Expired Reverse Swap with an onchain HTLC on the Ethereum chain that should not emit an event
      {
        pair: 'BTC/USDT',
        orderSide: OrderSide.SELL,
      }
    ];

    let eventsEmitted = 0;

    nursery.on('reverseSwap.expired', (reverseSwap) => {
      if (eventsEmitted === 0) {
        expect(reverseSwap).toEqual(mockGetReverseSwapsExpirableResult[0]);
      } else {
        expect(reverseSwap).toEqual(mockGetReverseSwapsExpirableResult[1]);
      }

      eventsEmitted += 1;
    });

    const emittedBlockHeight = 123321;
    await emitBlock(emittedBlockHeight);

    expect(eventsEmitted).toEqual(2);

    expect(mockGetReverseSwapsExpirable).toHaveBeenCalledTimes(1);
    expect(mockGetReverseSwapsExpirable).toHaveBeenCalledWith(emittedBlockHeight);

    expect(mockDecodeAddress).toHaveBeenCalledTimes(2);
    expect(mockDecodeAddress).toHaveBeenCalledWith(mockGetReverseSwapsExpirableResult[0].lockupAddress);
    expect(mockDecodeAddress).toHaveBeenCalledWith(mockGetReverseSwapsExpirableResult[1].lockupAddress);

    expect(mockRemoveOutputFilter).toHaveBeenCalledTimes(2);
    expect(mockRemoveOutputFilter).toHaveBeenCalledWith(decodeAddress(mockGetReverseSwapsExpirableResult[0].lockupAddress));
    expect(mockRemoveOutputFilter).toHaveBeenCalledWith(decodeAddress(mockGetReverseSwapsExpirableResult[1].lockupAddress));

    expect(mockRemoveInputFilter).toHaveBeenCalledTimes(1);
    expect(mockRemoveInputFilter).toHaveBeenCalledWith(reverseBuffer(getHexBuffer(mockGetReverseSwapsExpirableResult[1].transactionId)));

    expect(mockRemoveInputFilter).toHaveBeenCalledTimes(1);

    mockGetReverseSwapsExpirableResult = [];
  });

  test('should detect when transactions signal RBF explicitly', async () => {
    const transaction = Transaction.fromHex(sampleTransactions.rbf);
    expect(await nursery['transactionSignalsRbf'](btcChainClient, transaction)).toEqual(true);

    expect(mockGetRawTransactionVerbose).toHaveBeenCalledTimes(0);
  });

  test('should detect when transactions signal RBF inherently', async () => {
    const transactionSignalsRbf = nursery['transactionSignalsRbf'];

    mockGetRawTransactionVerboseResult = () => ({
      confirmations: undefined,
      hex: sampleTransactions.rbf,
    });
    const transaction = Transaction.fromHex(sampleTransactions.nonRbf);

    expect(await transactionSignalsRbf(btcChainClient, transaction)).toEqual(true);

    expect(mockGetRawTransactionVerbose).toHaveBeenCalledTimes(1);

    // Should handle confirmed inputs
    mockGetRawTransactionVerboseResult = () => ({
      confirmations: 21,
      hex: sampleTransactions.rbf,
    });

    expect(await transactionSignalsRbf(btcChainClient, transaction)).toEqual(false);

    expect(mockGetRawTransactionVerbose).toHaveBeenCalledTimes(2);

    // Should handle unconfirmed non RBF inputs
    let returned = false;

    mockGetRawTransactionVerboseResult = () => {
      const toReturn = {
        confirmations: returned ? 1 : undefined,
        hex: sampleTransactions.nonRbf,
      };

      returned = true;

      return toReturn;
    };

    expect(await transactionSignalsRbf(btcChainClient, transaction)).toEqual(false);
  });
});
