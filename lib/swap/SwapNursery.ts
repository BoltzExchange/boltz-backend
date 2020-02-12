import { Op } from 'sequelize';
import AsyncLock from 'async-lock';
import { EventEmitter } from 'events';
import { constructClaimTransaction, detectPreimage, constructRefundTransaction } from 'boltz-core';
import { Transaction, TxOutput, address } from 'bitcoinjs-lib';
import Logger from '../Logger';
import Swap from '../db/models/Swap';
import Wallet from '../wallet/Wallet';
import LndClient from '../lightning/LndClient';
import ChainClient from '../chain/ChainClient';
import SwapRepository from '../db/SwapRepository';
import { SwapUpdateEvent } from '../consts/Enums';
import ReverseSwap from '../db/models/ReverseSwap';
import ReverseSwapRepository from '../db/ReverseSwapRepository';
import WalletManager, { Currency } from '../wallet/WalletManager';
import {
  splitPairId,
  getHexBuffer,
  getHexString,
  reverseBuffer,
  getSwapOutputType,
  getLightningCurrency,
  transactionSignalsRbfExplicitly,
  getChainCurrency,
  getInvoicePreimageHash,
  formatError,
  transactionHashToId,
} from '../Utils';

interface SwapNursery {
  on(event: 'transaction', listener: (transaction: Transaction, swap: Swap | ReverseSwap, confirmed: boolean, isReverse: boolean) => void): this;
  emit(event: 'transaction', transaction: Transaction, swap: Swap | ReverseSwap, confirmed: boolean, isReverse: boolean): boolean;

  on(event: 'expiration', listener: (swap: Swap | ReverseSwap) => void): this;
  emit(event: 'expiration', swap: Swap | ReverseSwap): boolean;

  // Swap related events
  on(event: 'claim', listener: (swap: Swap) => void): this;
  emit(event: 'claim', swap: Swap): boolean;

  on(event: 'invoice.paid', listener: (swap: Swap) => void): this;
  emit(event: 'invoice.paid', swap: Swap): boolean;

  on(event: 'invoice.failedToPay', listener: (swap: Swap) => void): this;
  emit(event: 'invoice.failedToPay', swap: Swap): boolean;

  on(event: 'zeroconf.rejected', listener: (swap: Swap, reason: string) => void): this;
  emit(event: 'zeroconf.rejected', swap: Swap, reason: string): boolean;

  // Reverse swap related events
  on(event: 'coins.sent', listener: (reverseSwap: ReverseSwap, transaction: Transaction) => void): this;
  emit(event: 'coins.sent', reverseSwap: ReverseSwap, transaction: Transaction): boolean;

  on(event: 'coins.failedToSend', listener: (reverseSwap: ReverseSwap) => void): this;
  emit(event: 'coins.failedToSend', reverseSwap: ReverseSwap): boolean;

  on(event: 'refund', listener: (reverseSwap: ReverseSwap) => void): this;
  emit(event: 'refund', reverseSwap: ReverseSwap): boolean;

  on(event: 'invoice.settled', listener: (reverseSwap: ReverseSwap) => void): this;
  emit(event: 'invoice.settled', reverseSwap: ReverseSwap): boolean;
}

// TODO: remove finished swaps from filters (make sure they are actually gone)
class SwapNursery extends EventEmitter {
  public static reverseSwapMempoolEta = 2;

  private lock = new AsyncLock();

  private lndClients = new Map<string, LndClient>();
  private chainClients = new Map<string, ChainClient>();

  private static swapLock = 'swap';
  private static reverseSwapLock = 'reverseSwap';

  constructor(
    private logger: Logger,
    private walletManager: WalletManager,
    private swapRepository: SwapRepository,
    private reverseSwapRepository: ReverseSwapRepository,
  ) {
    super();
  }

  public bindCurrency = (currency: Currency) => {
    const { symbol } = currency;
    const { chainClient, lndClient } = currency;
    const wallet = this.walletManager.wallets.get(symbol)!;

    this.chainClients.set(symbol, chainClient);

    if (lndClient) {
      this.lndClients.set(symbol, lndClient);
    }

    chainClient.on('transaction', async (transaction, confirmed) => {
      await Promise.all([
        await this.lock.acquire(SwapNursery.swapLock, async () => {
          let zeroConfRejectedReason: string | undefined = undefined;

          // Confirmed transactions do not have to be checked for 0-conf criteria
          if (!confirmed) {
            // Check if the transaction signals RBF
            const signalsRbf = await this.transactionSignalsRbf(chainClient, transaction);

            if (signalsRbf) {
              zeroConfRejectedReason = 'transaction or one of its unconfirmed ancestors signals RBF';
            } else {
              // Check if the transaction has a fee high enough to be confirmed in a timely manner
              const feeEstimation = await chainClient.estimateFee();

              const transactionFee = await this.calculateTransactionFee(chainClient, transaction);
              const transactionFeePerVbyte = transactionFee / transaction.virtualSize();

              // If the transaction fee is less than 80% of the estimation, Boltz will wait for a confirmation
              //
              // Special case: if the fee estimator is returning the lowest possible fee, 2 sat/vbyte, every fee
              // paid by the transaction will be accepted
              if (
                transactionFeePerVbyte / feeEstimation < 0.8 &&
                feeEstimation !== 2
              ) {
                zeroConfRejectedReason = 'transaction fee is too low';
              }
            }
          }

          for (let vout = 0; vout < transaction.outs.length; vout += 1) {
            const output = transaction.outs[vout];

            const swap = await this.swapRepository.getSwap({
              status: {
                [Op.or]: [
                  SwapUpdateEvent.InvoiceSet,
                  SwapUpdateEvent.TransactionMempool,
                ],
              },
              lockupAddress: {
                [Op.eq]: wallet.encodeAddress(output.script),
              },
            });

            if (swap) {
              await this.swapRepository.setLockupTransactionId(swap, transaction.getId(), output.value, confirmed);
              this.emit('transaction', transaction, swap, confirmed, false);

              if (zeroConfRejectedReason !== undefined) {
                this.logger.warn(`Rejected 0-conf ${chainClient.symbol} transaction ${transaction.getId()}: ${zeroConfRejectedReason}`);
                this.emit('zeroconf.rejected', swap, zeroConfRejectedReason);
              } else if (confirmed || swap.acceptZeroConf) {
                if (!confirmed) {
                  this.logger.silly(`Accepted 0-conf ${chainClient.symbol} swap: ${transaction.getId()}:${vout}`);
                }

                chainClient.removeOutputFilter(output.script);
                await this.claimSwap(currency, wallet, swap, transaction, vout);
              }
            }
          }
        }),
        await this.lock.acquire(SwapNursery.reverseSwapLock, async () => {
          // Send "transaction.confirmed" event for lockup transaction
          if (confirmed) {
            const reverseSwap = await this.reverseSwapRepository.getReverseSwap({
              status: {
                [Op.eq]: SwapUpdateEvent.TransactionMempool,
              },
              transactionId: {
                [Op.eq]: transaction.getId(),
              },
            });

            if (!reverseSwap) {
              return;
            }

            chainClient.removeOutputFilter(wallet.decodeAddress(reverseSwap.lockupAddress));

            this.emit(
              'transaction',
              transaction,
              await this.reverseSwapRepository.setReverseSwapStatus(reverseSwap, SwapUpdateEvent.TransactionConfirmed),
              true,
              true,
            );
          }

          // Get preimage from claim transaction
          for (let vin = 0; vin < transaction.ins.length; vin += 1) {
            const input = transaction.ins[vin];

            const inputId = transactionHashToId(input.hash);

            const reverseSwap = await this.reverseSwapRepository.getReverseSwap({
              status: {
                [Op.or]: [
                  SwapUpdateEvent.TransactionMempool,
                  SwapUpdateEvent.TransactionConfirmed,
                ],
              },
              transactionId: {
                [Op.eq]: inputId,
              },
            });

            if (reverseSwap) {
              chainClient.removeInputFilter(input.hash);
              await this.settleReverseSwap(reverseSwap, transaction, vin);
            }
          }
        }),
      ]);
    });

    chainClient.on('block', async (height) => {
      // TODO: check for right onchain currency?
      // TODO: have a hardcoded list of statuses that are pending
      await Promise.all([
        this.lock.acquire(SwapNursery.swapLock, async () => {
          const swaps = await this.swapRepository.getSwaps({
            status: {
              [Op.not]: [
                SwapUpdateEvent.SwapExpired,
                SwapUpdateEvent.InvoiceFailedToPay,
                SwapUpdateEvent.TransactionClaimed,
              ],
            },
            timeoutBlockHeight: {
              [Op.lte]: height,
            },
          });

          for (const swap of swaps) {
            const { base, quote } = splitPairId(swap.pair);
            const chainCurrency = getChainCurrency(base, quote, swap.orderSide, false);

            if (symbol === chainCurrency) {
              this.logger.verbose(`Aborting swap: ${swap.id}`);
              this.emit('expiration', await this.swapRepository.setSwapStatus(swap, SwapUpdateEvent.SwapExpired));
            }
          }
        }),
        this.lock.acquire(SwapNursery.reverseSwapLock, async () => {
          const reverseSwaps = await this.reverseSwapRepository.getReverseSwaps({
            status: {
              [Op.not]: [
                SwapUpdateEvent.SwapExpired,
                SwapUpdateEvent.InvoiceSettled,
                SwapUpdateEvent.TransactionFailed,
                SwapUpdateEvent.TransactionRefunded,
              ],
            },
            timeoutBlockHeight: {
              [Op.lte]: height,
            },
          });

          for (const reverseSwap of reverseSwaps) {
            const { base, quote } = splitPairId(reverseSwap.pair);
            const chainCurrency = getChainCurrency(base, quote, reverseSwap.orderSide, true);

            if (symbol === chainCurrency) {
              if (reverseSwap.status === SwapUpdateEvent.TransactionMempool || reverseSwap.status === SwapUpdateEvent.TransactionConfirmed) {
                await this.refundReverseSwap(
                  reverseSwap,
                  chainClient,
                  wallet,
                  height,
                );
              } else {
                this.logger.verbose(`Aborting reverse swap: ${reverseSwap.id}`);
                this.emit('expiration', await this.reverseSwapRepository.setReverseSwapStatus(reverseSwap, SwapUpdateEvent.SwapExpired));
              }
            }
          }
        }),
      ]);
    });

    if (lndClient) {
      lndClient.on('htlc.accepted', async (invoice) => {
        await this.lock.acquire(SwapNursery.reverseSwapLock, async () => {
          const reverseSwap = await this.reverseSwapRepository.getReverseSwap({
            invoice: {
              [Op.eq]: invoice,
            },
          });

          if (!reverseSwap) {
            return;
          }

          await this.sendReverseSwapCoins(reverseSwap);
        });
      });
    }
  }

  private claimSwap = async (
    currency: Currency,
    wallet: Wallet,
    swap: Swap,
    transaction: Transaction,
    vout: number,
  ) => {
    const output = transaction.outs[vout];
    const swapOutput = `${transaction.getId()}:${vout}`;

    if (output.value < swap.expectedAmount!) {
      this.logger.error(`Aborting ${currency.symbol} swap: value ${output.value} of ${swapOutput} is less than expected ${swap.expectedAmount}`);
      // TODO: emit event
      return;
    }

    this.logger.verbose(`Claiming ${currency.symbol} swap output: ${swapOutput}`);

    const { base, quote } = splitPairId(swap.pair);
    const lightningCurrency = getLightningCurrency(base, quote, swap.orderSide, false);

    const response = await this.payInvoice(this.lndClients.get(lightningCurrency)!, swap.invoice!);

    if (response) {
      this.logger.silly(`Got ${currency.symbol} preimage: ${getHexString(response.preimage)}`);

      await this.swapRepository.setInvoicePaid(swap, response.fee);
      this.emit('invoice.paid', swap);

      const destinationAddress = await wallet.newAddress();

      const claimTx = constructClaimTransaction(
        [{
          vout,
          value: output.value,
          script: output.script,
          preimage: response.preimage,
          txHash: transaction.getHash(),
          type: getSwapOutputType(false),
          keys: wallet.getKeysByIndex(swap.keyIndex),
          redeemScript: getHexBuffer(swap.redeemScript),
        }],
        address.toOutputScript(destinationAddress, currency.network),
        await currency.chainClient.estimateFee(),
        true,
      );
      const minerFee = await this.calculateTransactionFee(currency.chainClient, claimTx, output.value);

      this.logger.silly(`Broadcasting ${currency.symbol} claim transaction: ${claimTx.getId()}`);

      await currency.chainClient.sendRawTransaction(claimTx.toHex());
      this.emit('claim', await this.swapRepository.setMinerFee(swap, minerFee));
    } else {
      this.emit('invoice.failedToPay', await this.swapRepository.setSwapStatus(swap, SwapUpdateEvent.InvoiceFailedToPay));
    }
  }

  private sendReverseSwapCoins = async (reverseSwap: ReverseSwap) => {
    const { base, quote } = splitPairId(reverseSwap.pair);
    const chainCurrency = getChainCurrency(base, quote, reverseSwap.orderSide, true);
    const lightningCurrency = getLightningCurrency(base, quote, reverseSwap.orderSide, true);

    try {
      const chainClient = this.chainClients.get(chainCurrency)!;
      const wallet = this.walletManager.wallets.get(chainCurrency)!;

      const feePerVbyte = await chainClient.estimateFee(SwapNursery.reverseSwapMempoolEta);
      const { fee, transaction, transactionId } = await wallet.sendToAddress(reverseSwap.lockupAddress, reverseSwap.onchainAmount, feePerVbyte);

      this.logger.verbose(`Sent ${chainCurrency} to reverse swap ${reverseSwap.id} in transaction: ${transactionId}`);

      chainClient.addInputFilter(transaction.getHash());
      chainClient.addOutputFilter(wallet.decodeAddress(reverseSwap.lockupAddress));

      this.emit('coins.sent', await this.reverseSwapRepository.setLockupTransaction(reverseSwap, transactionId, fee), transaction);
    } catch (error) {
      const preimageHash = getHexBuffer(getInvoicePreimageHash(reverseSwap.invoice));

      const lndClient = this.lndClients.get(lightningCurrency)!;
      await this.cancelInvoice(lndClient, preimageHash);

      this.logger.warn(`Failed to send ${reverseSwap.onchainAmount} ${chainCurrency} to reverse swap: ${formatError(error)}`);
      this.emit('coins.failedToSend', await this.reverseSwapRepository.setReverseSwapStatus(reverseSwap, SwapUpdateEvent.TransactionFailed));
    }
  }

  private settleReverseSwap = async (reverseSwap: ReverseSwap, transaction: Transaction, vin: number) => {
    const preimage = detectPreimage(vin, transaction);
    this.logger.verbose(`Got preimage of reverse swap ${reverseSwap.id}: ${getHexString(preimage)}`);

    const { base, quote } = splitPairId(reverseSwap.pair);
    const lightningCurrency = getLightningCurrency(base, quote, reverseSwap.orderSide, true);

    const lndClient = this.lndClients.get(lightningCurrency)!;
    await lndClient.settleInvoice(preimage);

    this.emit('invoice.settled', await this.reverseSwapRepository.setInvoiceSettled(reverseSwap, getHexString(preimage)));
  }

  private refundReverseSwap = async (
    reverseSwap: ReverseSwap,
    chainClient: ChainClient,
    wallet: Wallet,
    blockHeight: number,
  ) => {
    const { base, quote } = splitPairId(reverseSwap.pair);
    const lightningCurrency = getLightningCurrency(base, quote, reverseSwap.orderSide, true);

    let vout: number | undefined = undefined;
    const lockupTransaction = Transaction.fromHex(await chainClient.getRawTransaction(reverseSwap.transactionId));

    for (let i = 0; i < lockupTransaction.outs.length; i += 1) {
      const output = lockupTransaction.outs[i];
      if (wallet.encodeAddress(output.script) === reverseSwap.lockupAddress) {
        vout = i;
      }
    }

    // This should never happen but if it does we cannot refund the coins
    if (vout === undefined) {
      return;
    }

    chainClient.removeInputFilter(lockupTransaction.getHash());
    chainClient.removeOutputFilter(wallet.decodeAddress(reverseSwap.lockupAddress));

    const preimageHash = getHexBuffer(getInvoicePreimageHash(reverseSwap.invoice));
    await this.cancelInvoice(this.lndClients.get(lightningCurrency)!, preimageHash);

    this.logger.info(`Refunding ${chainClient.symbol} reverse swap: ${reverseSwap.transactionId}:${vout}`);

    const destinationAddress = await wallet.newAddress();
    const refundTransaction = constructRefundTransaction(
      [{
        vout,
        ...lockupTransaction.outs[vout],
        type: getSwapOutputType(true),
        txHash: lockupTransaction.getHash(),
        keys: wallet.getKeysByIndex(reverseSwap.keyIndex),
        redeemScript: getHexBuffer(reverseSwap.redeemScript),
      }],
      wallet.decodeAddress(destinationAddress),
      blockHeight,
      await chainClient.estimateFee(),
    );
    const minerFee = await this.calculateTransactionFee(chainClient, lockupTransaction, lockupTransaction.outs[vout].value);

    this.logger.verbose(`Broadcasting ${chainClient.symbol} refund transaction: ${refundTransaction.getId()}`);

    await chainClient.sendRawTransaction(refundTransaction.toHex());
    this.emit('refund', await this.reverseSwapRepository.setTransactionRefunded(reverseSwap, minerFee));
  }

  private cancelInvoice = (lndClient: LndClient, preimageHash: Buffer) => {
    this.logger.verbose(`Cancelling hold invoice with preimage hash: ${getHexString(preimageHash)}`);

    return lndClient.cancelInvoice(preimageHash);
  }

  private payInvoice = async (lndClient: LndClient, invoice: string) => {
    try {
      const response = await lndClient.sendPayment(invoice);

      return {
        preimage: response.paymentPreimage,
        fee: response.paymentRoute.totalFees,
      };
    } catch (error) {
      this.logger.warn(`Could not pay ${lndClient.symbol} invoice ${invoice}: ${error}`);
    }

    return;
  }

  /**
   * Gets the miner fee for a transaction
   * If `inputSum` is not set, the chainClient will be queried to get the sum of all inputs
   *
   * @param chainClient the client for the chain of the transaction
   * @param transaction the transaction that spends the inputs
   * @param inputSum the sum of all inputs of the transaction
   */
  private calculateTransactionFee = async (chainClient: ChainClient, transaction: Transaction, inputSum?: number) => {
    const queryInputSum = async () => {
      let queriedInputSum = 0;

      for (const input of transaction.ins) {
        const inputId = getHexString(reverseBuffer(input.hash));
        const rawInputTransaction = await chainClient.getRawTransaction(inputId);
        const inputTransaction = Transaction.fromHex(rawInputTransaction);

        const relevantOutput = inputTransaction.outs[input.index] as TxOutput;

        queriedInputSum += relevantOutput.value;
      }

      return queriedInputSum;
    };

    let fee = inputSum || await queryInputSum();

    transaction.outs.forEach((out) => {
      const output = out as TxOutput;
      fee -= output.value;
    });

    return fee;
  }

  /**
   * Detects whether the transaction signals RBF explicitly or inherently
   */
  private transactionSignalsRbf = async (chainClient: ChainClient, transaction: Transaction) => {
    // Check for explicit signalling
    const signalsExplicitly = transactionSignalsRbfExplicitly(transaction);

    if (signalsExplicitly) {
      return true;
    }

    // Check for inherited signalling from unconfirmed inputs
    for (const input of transaction.ins) {
      const inputId = getHexString(reverseBuffer(input.hash));
      const inputTransaction = await chainClient.getRawTransactionVerbose(inputId);

      if (!inputTransaction.confirmations) {
        const inputSingalsRbf = await this.transactionSignalsRbf(
          chainClient,
          Transaction.fromHex(inputTransaction.hex),
        );

        if (inputSingalsRbf) {
          return true;
        }
      }
    }

    return false;
  }
}

export default SwapNursery;
