import { BIP32Interface } from 'bip32';
import { Networks, OutputType } from 'boltz-core';
import { ECPair, Transaction } from 'bitcoinjs-lib';
import Logger from '../../../lib/Logger';
import { getHexString } from '../../../lib/Utils';
import { CurrencyConfig } from '../../../lib/Config';
import { constructTransaction, wait } from '../../Utils';
import ChainClient from '../../../lib/chain/ChainClient';
import LndClient from '../../../lib/lightning/LndClient';
import { SendResponse } from '../../../lib/proto/lndrpc_pb';
import WalletManager from '../../../lib/wallet/WalletManager';
import SwapNursery, { SwapDetails, ReverseSwapDetails, MinimalReverseSwapDetails } from '../../../lib/swap/SwapNursery';

const mockSendPayment = jest.fn().mockReturnValue(new SendResponse());

jest.mock('../../../lib/lightning/LndClient', () => {
  return jest.fn().mockImplementation(() => {
    return {
      on: () => {},
      sendPayment: mockSendPayment,
    };
  });
});

const mockedLndClient = <jest.Mock<LndClient>><any>LndClient;

let chainClientFeeEstimation = 2;
const mockEstimateFee = jest.fn().mockImplementation(() => chainClientFeeEstimation);

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

const mockGetRawTransaction = jest.fn().mockReturnValue(
  constructTransaction(false, explicitTxInput, explicitTxInputAmount).toHex(),
);

const mockGetRawTransactionVerbose = jest.fn().mockImplementation(
  (output: string) => {
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
  },
);

jest.mock('../../../lib/chain/ChainClient', () => {
  return jest.fn().mockImplementation(() => {
    return {
      estimateFee: mockEstimateFee,
      on: mockChainClientEventHandler,
      getRawTransaction: mockGetRawTransaction,
      getRawTransactionVerbose: mockGetRawTransactionVerbose,
    };
  });
});

const mockedChainClient = <jest.Mock<ChainClient>><any>ChainClient;

jest.mock('../../../lib/wallet/WalletManager');

const mockedWalletManager = <jest.Mock<WalletManager>><any>WalletManager;

describe('SwapNursery', () => {
  const lndClient = mockedLndClient();
  const chainClient = mockedChainClient();

  const emptySwapDetails = {
    expectedAmount: 0,
    sendingSymbol: 'BTC',
    acceptZeroConf: true,
    invoice: 'lnbcrt10000',
    redeemScript: Buffer.alloc(0),
    outputType: OutputType.Bech32,
    claimKeys: ECPair.makeRandom({ network: Networks.bitcoinRegtest }) as unknown as BIP32Interface,
  };

  const walletManager = mockedWalletManager();

  const swapNursery = new SwapNursery(Logger.disabledLogger, walletManager);
  const transactionSignalsRbf = swapNursery['transactionSignalsRbf'];
  const calculateTransactionFee = swapNursery['calculateTransactionFee'];

  const swaps = new Map<string, SwapDetails>();
  const swapTimeouts = new Map<number, string[]>();
  const reverseSwaps = new Map<string, ReverseSwapDetails>();
  const reverseSwapTransactions =  new Map<string, MinimalReverseSwapDetails>();
  const reverseSwapTimeouts = new Map<number, MinimalReverseSwapDetails[]>();

  beforeAll(() => {
    swapNursery.bindCurrency({
      lndClient,
      chainClient,
      symbol: 'BTC',
      network: Networks.bitcoinRegtest,
      config: {} as any as CurrencyConfig,
    }, {
      swaps,
      swapTimeouts,
      reverseSwaps,
      reverseSwapTimeouts,
      reverseSwapTransactions,
    });
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should wait for one confirmation for RBF transactions', async () => {
    let event = false;

    swapNursery.once('zeroconf.rejected', (invoice, reason) => {
      expect(invoice).toEqual(emptySwapDetails.invoice);
      expect(reason).toEqual('transaction or one of its unconfirmed ancestors signals RBF');

      event = true;
    });

    const transaction = constructTransaction(true, explicitTxInput);
    swaps.set(getHexString(transaction.outs[0].script), {
      ...emptySwapDetails,
    });

    emitTransaction(transaction, false);
    await wait(10);

    expect(event).toBeTruthy();
    expect(mockSendPayment).toHaveBeenCalledTimes(0);
  });

  test('should wait for one confirmation for transactions that have a fee below the threshold', async () => {
    let event = false;

    swapNursery.once('zeroconf.rejected', (invoice, reason) => {
      expect(invoice).toEqual(emptySwapDetails.invoice);
      expect(reason).toEqual('transaction fee is too low');

      event = true;
    });

    chainClientFeeEstimation = 100;
    const transaction = constructTransaction(false, explicitTxInput, explicitTxInputAmount);
    swaps.set(getHexString(transaction.outs[0].script), {
      ...emptySwapDetails,
    });

    emitTransaction(transaction, false);

    await wait(10);

    expect(event).toBeTruthy();
    expect(mockSendPayment).toHaveBeenCalledTimes(0);

    chainClientFeeEstimation = 2;
  });

  test('should accept unconfirmed transactions with any fee if the estimation is 2 sat/vbyte', async () => {
    const transaction = constructTransaction(false, explicitTxInput, explicitTxInputAmount);
    swaps.set(getHexString(transaction.outs[0].script), {
      ...emptySwapDetails,
    });

    emitTransaction(transaction, false);

    await wait(10);

    expect(mockSendPayment).toHaveBeenCalledTimes(1);
    expect(mockSendPayment).toHaveBeenNthCalledWith(1, emptySwapDetails.invoice);
  });

  test('should accept 0-conf non-RBF transactions if allowed', async () => {
    // "acceptZeroConf" is false -> it should not try to pay the invoice
    const transaction = constructTransaction(false, explicitTxInput);
    swaps.set(getHexString(transaction.outs[0].script), {
      ...emptySwapDetails,
      acceptZeroConf: false,
    });

    emitTransaction(transaction, false);
    await wait(10);

    expect(mockSendPayment).toHaveBeenCalledTimes(0);

    // "acceptZeroConf" is true -> it should try to pay the invoice
    swaps.set(getHexString(transaction.outs[0].script), {
      ...emptySwapDetails,
    });

    emitTransaction(transaction, false);
    await wait(10);

    expect(mockSendPayment).toHaveBeenCalledTimes(1);
    expect(mockSendPayment).toHaveBeenNthCalledWith(1, emptySwapDetails.invoice);
  });

  test('should accept RBF and non-RBF transactions when they are confirmed', async () => {
    const rbfTransaction = constructTransaction(true, explicitTxInput);
    swaps.set(getHexString(rbfTransaction.outs[0].script), {
      ...emptySwapDetails,
    });

    emitTransaction(rbfTransaction, true);
    await wait(10);

    expect(mockSendPayment).toHaveBeenCalledTimes(1);
    expect(mockSendPayment).toHaveBeenNthCalledWith(1, emptySwapDetails.invoice);

    const nonRbfTransaction = constructTransaction(false, explicitTxInput);
    swaps.set(getHexString(nonRbfTransaction.outs[0].script), {
      ...emptySwapDetails,
    });

    emitTransaction(nonRbfTransaction, true);
    await wait(10);

    expect(mockSendPayment).toHaveBeenCalledTimes(2);
    expect(mockSendPayment).toHaveBeenNthCalledWith(2, emptySwapDetails.invoice);
  });

  test('should accept confirmed transactions with any fee', async () => {
    chainClientFeeEstimation = 100;

    const transaction = constructTransaction(false, explicitTxInput, explicitTxInputAmount);
    swaps.set(getHexString(transaction.outs[0].script), {
      ...emptySwapDetails,
    });

    emitTransaction(transaction, true);

    await wait(10);

    expect(mockSendPayment).toHaveBeenCalledTimes(1);
    expect(mockSendPayment).toHaveBeenNthCalledWith(1, emptySwapDetails.invoice);

    chainClientFeeEstimation = 2;
  });

  test('should detect explicit RBF signalling', async () => {
    expect(await transactionSignalsRbf(chainClient, constructTransaction(true, explicitTxInput))).toBeTruthy();
    expect(await transactionSignalsRbf(chainClient, constructTransaction(false, explicitTxInput))).toBeFalsy();
  });

  test('should detect inherited RBF signalling', async () => {
    expect(await transactionSignalsRbf(chainClient, constructTransaction(false, inheritedTxInput))).toBeTruthy();
  });

  test('should calculate the miner fee of a transaction', async () => {
    const outputAmount = 798543;

    expect(await calculateTransactionFee(constructTransaction(false, explicitTxInput, outputAmount), chainClient))
      .toEqual(explicitTxInputAmount - outputAmount);
  });
});
