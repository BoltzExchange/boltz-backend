import { expect } from 'chai';
import { BIP32Interface } from 'bip32';
import { Networks, OutputType } from 'boltz-core';
import { ECPair, Transaction } from 'bitcoinjs-lib';
import { mock, instance, when, anything, verify } from 'ts-mockito';
import Logger from '../../../lib/Logger';
import { getHexString } from '../../../lib/Utils';
import { constructTransaction, wait } from '../../Utils';
import ChainClient from '../../../lib/chain/ChainClient';
import LndClient from '../../../lib/lightning/LndClient';
import WalletManager from '../../../lib/wallet/WalletManager';
import SwapNursery, { SwapDetails, ReverseSwapDetails } from '../../../lib/swap/SwapNursery';

describe('SwapNursery', () => {
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

  const lndClientMock = mock(LndClient);

  const emptySwapDetails = {
    expectedAmount: 0,
    acceptZeroConf: true,
    invoice: 'lnbcrt10000',
    redeemScript: Buffer.alloc(0),
    outputType: OutputType.Bech32,
    lndClient: instance(lndClientMock),
    claimKeys: ECPair.makeRandom({ network: Networks.bitcoinRegtest }) as unknown as BIP32Interface,
  };

  const explicitTxInput = '1eeeb0b4295d536ca4a85e0e47a3fca73f53929b8fd65b816de5a48748c0351d';
  const inheritedTxInput = 'd3db4612fd44c6effe0b6bcd115a26a525d4e6502b31308ea3d7f4512eaea585';

  const explicitTxInputAmount = 100000000;

  let chainClientFeeEstimation = 2;
  let emitTransaction: (transaction: Transaction, confirmed: boolean) => void;

  const chainClientMock = mock(ChainClient);
  when(chainClientMock.estimateFee()).thenCall(() => {
    return chainClientFeeEstimation;
  });

  when(chainClientMock.on('transaction', anything())).thenCall((_, callback) => {
    emitTransaction = callback;
  });
  when(chainClientMock.getRawTransactionVerbose(explicitTxInput)).thenResolve({
    ...emptyRawTransaction,

    confirmations: 1,
  });
  when(chainClientMock.getRawTransaction(explicitTxInput)).thenResolve(
    constructTransaction(false, explicitTxInput, explicitTxInputAmount).toHex(),
  );
  when(chainClientMock.getRawTransactionVerbose(inheritedTxInput)).thenResolve({
    ...emptyRawTransaction,

    confirmations: 0,
    hex: constructTransaction(true, inheritedTxInput).toHex(),
  });

  const chainClient = instance(chainClientMock);

  const walletManagerMock = mock(WalletManager);
  const walletManager = instance(walletManagerMock);

  const swapNursery = new SwapNursery(Logger.disabledLogger, walletManager);
  const transactionSignalsRbf = swapNursery['transactionSignalsRbf'];
  const calculateTransactionFee = swapNursery['calculateTransactionFee'];

  const swaps = new Map<string, SwapDetails>();
  const swapTimeouts = new Map<number, string[]>();
  const reverseSwaps = new Map<number, ReverseSwapDetails[]>();

  before(() => {
    swapNursery.bindCurrency({
      chainClient,
      lndClient: instance(lndClientMock),
      symbol: 'BTC',
      network: Networks.bitcoinRegtest,
    }, {
      swaps,
      swapTimeouts,
      reverseSwaps,
    });
  });

  it('should wait for one confirmation for RBF transactions', async () => {
    let event = false;

    swapNursery.once('zeroconf.rejected', (invoice, reason) => {
      expect(invoice).to.be.equal(emptySwapDetails.invoice);
      expect(reason).to.be.equal('transaction or one of its unconfirmed ancestors signals RBF');

      event = true;
    });

    const transaction = constructTransaction(true, explicitTxInput);
    swaps.set(getHexString(transaction.outs[0].script), {
      ...emptySwapDetails,
    });

    emitTransaction(transaction, false);
    await wait(10);

    expect(event).to.be.true;
    verify(lndClientMock.sendPayment(emptySwapDetails.invoice)).never();
  });

  it('should wait for one confirmation for transactions that have a fee below the threshold', async () => {
    let event = false;

    swapNursery.once('zeroconf.rejected', (invoice, reason) => {
      expect(invoice).to.be.equal(emptySwapDetails.invoice);
      expect(reason).to.be.equal('transaction fee is too low');

      event = true;
    });

    chainClientFeeEstimation = 100;
    const transaction = constructTransaction(false, explicitTxInput, explicitTxInputAmount);
    swaps.set(getHexString(transaction.outs[0].script), {
      ...emptySwapDetails,
    });

    emitTransaction(transaction, false);

    await wait(10);

    expect(event).to.be.true;
    verify(lndClientMock.sendPayment(emptySwapDetails.invoice)).never();

    chainClientFeeEstimation = 2;
  });

  it('should accept unconfirmed transactions with any fee if the estimation is 2 sat/vbyte', async () => {
    const transaction = constructTransaction(false, explicitTxInput, explicitTxInputAmount);
    swaps.set(getHexString(transaction.outs[0].script), {
      ...emptySwapDetails,
    });

    emitTransaction(transaction, false);

    await wait(10);

    verify(lndClientMock.sendPayment(emptySwapDetails.invoice)).once();
  });

  it('should accept 0-conf non-RBF transactions if allowed', async () => {
    // "acceptZeroConf" is false -> it should not try to pay the invoice
    const transaction = constructTransaction(false, explicitTxInput);
    swaps.set(getHexString(transaction.outs[0].script), {
      ...emptySwapDetails,
      acceptZeroConf: false,
    });

    emitTransaction(transaction, false);
    await wait(10);

    verify(lndClientMock.sendPayment(emptySwapDetails.invoice)).once();

    // "acceptZeroConf" is true -> it should try to pay the invoice
    swaps.set(getHexString(transaction.outs[0].script), {
      ...emptySwapDetails,
    });

    emitTransaction(transaction, false);
    await wait(10);

    verify(lndClientMock.sendPayment(emptySwapDetails.invoice)).twice();
  });

  it('should accept RBF and non-RBF transactions when they are confirmed', async () => {
    const rbfTransaction = constructTransaction(true, explicitTxInput);
    swaps.set(getHexString(rbfTransaction.outs[0].script), {
      ...emptySwapDetails,
    });

    emitTransaction(rbfTransaction, true);
    await wait(10);

    verify(lndClientMock.sendPayment(emptySwapDetails.invoice)).thrice();

    const nonRbfTransaction = constructTransaction(false, explicitTxInput);
    swaps.set(getHexString(nonRbfTransaction.outs[0].script), {
      ...emptySwapDetails,
    });

    emitTransaction(nonRbfTransaction, true);
    await wait(10);

    verify(lndClientMock.sendPayment(emptySwapDetails.invoice)).times(4);
  });

  it('should accept confirmed transactions with any fee', async () => {
    chainClientFeeEstimation = 100;

    const transaction = constructTransaction(false, explicitTxInput, explicitTxInputAmount);
    swaps.set(getHexString(transaction.outs[0].script), {
      ...emptySwapDetails,
    });

    emitTransaction(transaction, true);

    await wait(10);

    verify(lndClientMock.sendPayment(emptySwapDetails.invoice)).times(5);

    chainClientFeeEstimation = 2;
  });

  it('should detect explicit RBF signalling', async () => {
    expect(await transactionSignalsRbf(chainClient, constructTransaction(true, explicitTxInput))).to.be.true;
    expect(await transactionSignalsRbf(chainClient, constructTransaction(false, explicitTxInput))).to.be.false;
  });

  it('should detect inherited RBF signalling', async () => {
    expect(await transactionSignalsRbf(chainClient, constructTransaction(false, inheritedTxInput))).to.be.true;
  });

  it('should calculate the miner fee of a transaction', async () => {
    const outputAmount = 798543;

    expect(await calculateTransactionFee(constructTransaction(false, explicitTxInput, outputAmount), chainClient))
      .to.be.equal(explicitTxInputAmount - outputAmount);
  });
});
