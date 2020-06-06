import { Op } from 'sequelize';
import AsyncLock from 'async-lock';
import { EventEmitter } from 'events';
import { address, Transaction } from 'bitcoinjs-lib';
import {
  detectSwap,
  OutputType,
  detectPreimage,
  constructClaimTransaction,
  constructRefundTransaction,
} from 'boltz-core';
import Logger from '../Logger';
import Swap from '../db/models/Swap';
import Wallet from '../wallet/Wallet';
import { Invoice } from '../proto/lndrpc_pb';
import ChannelNursery from './ChannelNursery';
import ChainClient from '../chain/ChainClient';
import FeeProvider from '../rates/FeeProvider';
import LndClient from '../lightning/LndClient';
import RateProvider from '../rates/RateProvider';
import SwapRepository from '../db/SwapRepository';
import ReverseSwap from '../db/models/ReverseSwap';
import { ReverseSwapOutputType } from '../consts/Consts';
import ChannelCreation from '../db/models/ChannelCreation';
import ReverseSwapRepository from '../db/ReverseSwapRepository';
import WalletManager, { Currency } from '../wallet/WalletManager';
import { ChannelCreationType, SwapUpdateEvent } from '../consts/Enums';
import ChannelCreationRepository from '../db/ChannelCreationRepository';
import {
  getRate,
  formatError,
  splitPairId,
  getHexBuffer,
  getHexString,
  decodeInvoice,
  reverseBuffer,
  getChainCurrency,
  transactionHashToId,
  getLightningCurrency,
  transactionSignalsRbfExplicitly,
} from '../Utils';

interface SwapNursery {
  on(event: 'transaction', listener: (transaction: Transaction, swap: Swap | ReverseSwap, confirmed: boolean, isReverse: boolean) => void): this;
  emit(event: 'transaction', transaction: Transaction, swap: Swap | ReverseSwap, confirmed: boolean, isReverse: boolean): boolean;

  on(event: 'expiration', listener: (swap: Swap | ReverseSwap, isReverse: boolean) => void): this;
  emit(event: 'expiration', swap: Swap | ReverseSwap, isReverse: boolean): boolean;

  // Swap related events
  on(event: 'claim', listener: (swap: Swap) => void): this;
  emit(event: 'claim', swap: Swap): boolean;

  on(event: 'invoice.pending', listener: (swap: Swap) => void): this;
  emit(even: 'invoice.pending', swap: Swap): boolean;

  on(event: 'invoice.paid', listener: (swap: Swap) => void): this;
  emit(event: 'invoice.paid', swap: Swap): boolean;

  on(event: 'invoice.failedToPay', listener: (swap: Swap) => void): this;
  emit(event: 'invoice.failedToPay', swap: Swap): boolean;

  on(event: 'zeroconf.rejected', listener: (swap: Swap, reason: string) => void): this;
  emit(event: 'zeroconf.rejected', swap: Swap, reason: string): boolean;

  // Reverse swap related events
  on(event: 'minerfee.paid', listener: (reverseSwap: ReverseSwap) => void): this;
  emit(event: 'minerfee.paid', reverseSwap: ReverseSwap): boolean;

  on(event: 'coins.sent', listener: (reverseSwap: ReverseSwap, transaction: Transaction) => void): this;
  emit(event: 'coins.sent', reverseSwap: ReverseSwap, transaction: Transaction): boolean;

  on(event: 'coins.failedToSend', listener: (reverseSwap: ReverseSwap) => void): this;
  emit(event: 'coins.failedToSend', reverseSwap: ReverseSwap): boolean;

  on(event: 'refund', listener: (reverseSwap: ReverseSwap, refundTransactionId: string) => void): this;
  emit(event: 'refund', reverseSwap: ReverseSwap, refundTransactionId: string): boolean;

  on(event: 'invoice.settled', listener: (reverseSwap: ReverseSwap) => void): this;
  emit(event: 'invoice.settled', reverseSwap: ReverseSwap): boolean;
}

// TODO: remove finished swaps from filters (make sure they are actually gone)
class SwapNursery extends EventEmitter {
  public static reverseSwapMempoolEta = 2;

  private lock = new AsyncLock();

  private currencies = new Map<string, Currency>();

  private channelNursery: ChannelNursery;

  private static retryLock = 'lock';

  private static swapLock = 'swap';
  private static reverseSwapLock = 'reverseSwap';

  // TODO: implement retry logic; how long to retry swaps that have not timed out yet (+ eventually emit "invoice.failedToPay" event)
  constructor(
    private logger: Logger,
    private rateProvider: RateProvider,
    private walletManager: WalletManager,
    private swapRepository: SwapRepository,
    private reverseSwapRepository: ReverseSwapRepository,
    private channelCreationRepository: ChannelCreationRepository,
    private prepayMinerFee: boolean,
    private swapOutputType: OutputType,
    retryInterval: number,
  ) {
    super();

    this.channelNursery = new ChannelNursery(
      this.logger,
      this.swapRepository,
      this.channelCreationRepository,
      // TODO: there is a similar method in the SwapManager already; those should be unified
      async (currency: Currency, swap: Swap, outgoingChannelId: string) => {
        const lockupTransaction = await currency.chainClient.getRawTransaction(swap.lockupTransactionId!);

        return this.attemptSettleSwap(
          currency,
          this.walletManager.wallets.get(currency.symbol)!,
          swap,
          Transaction.fromHex(lockupTransaction),
          true,
          outgoingChannelId,
        );
      },
    );

    this.logger.info(`Setting Swap retry interval to ${retryInterval} seconds`);

    setInterval(async () => {
      // Skip this iteration if the last one is still running
      if (this.lock.isBusy(SwapNursery.retryLock)) {
        return;
      }

      this.logger.silly('Retrying to settle Swaps');

      await this.lock.acquire(SwapNursery.retryLock, async () => {
        await this.lock.acquire(SwapNursery.swapLock, async () => {
          const unsettledSwaps = await this.swapRepository.getSwaps({
            status: {
              [Op.eq]: SwapUpdateEvent.InvoicePending,
            },
          });

          for (const swap of unsettledSwaps) {
            const channelCreation = await this.channelCreationRepository.getChannelCreation({
              swapId: {
                [Op.eq]: swap.id,
              },
              status: {
                // tslint:disable-next-line:no-null-keyword
                [Op.not]: null,
              },
            });

            // The ChannelNursery takes care of settling attempted Channel Creations
            if (channelCreation) {
              continue;
            }

            const { base, quote } = splitPairId(swap.pair);
            const chainCurrency = this.currencies.get(getChainCurrency(base, quote, swap.orderSide, false))!;

            const lockupTransaction = await chainCurrency.chainClient.getRawTransaction(swap.lockupTransactionId!);

            try {
              await this.attemptSettleSwap(
                chainCurrency,
                this.walletManager.wallets.get(chainCurrency.symbol)!,
                swap,
                Transaction.fromHex(lockupTransaction),
                // Since the lockup transaction confirmed already or 0-conf was accepted, the 0-conf checks can just be skipped
                true,
              );
            } catch (error) {
              this.logger.debug(`Could not settle Swap ${swap.id} on retry: ${formatError(error)}`);
            }
          }
        });
      });
    }, retryInterval * 1000);
  }

  public init = async (currencies: Currency[]) => {
    currencies.forEach((currency) => {
      this.bindCurrency(currency);
    });

    await this.channelNursery.init(currencies);
  }

  // TODO: write integration tests
  private bindCurrency = (currency: Currency) => {
    this.currencies.set(currency.symbol, currency);

    const { symbol } = currency;
    const { chainClient, lndClient } = currency;
    const wallet = this.walletManager.wallets.get(symbol)!;

    if (lndClient) {
      lndClient.on('htlc.accepted', async (invoice: string) => {
        await this.lock.acquire(SwapNursery.reverseSwapLock, async () => {
          const reverseSwap = await this.reverseSwapRepository.getReverseSwap({
            invoice: {
              [Op.eq]: invoice,
            },
          });

          if (reverseSwap && reverseSwap.status === SwapUpdateEvent.MinerFeePaid) {
            await this.sendReverseSwapCoins(reverseSwap);
          } else {
            this.logger.debug(`Did not send onchain coins for Reverse Swap ${reverseSwap.id} because miner fee invoice was not paid yet`);
          }
        });
      });

      // Only relevant if prepay miner fees are enabled
      if (this.prepayMinerFee) {
        lndClient.on('invoice.settled', async (invoice: string) => {
          await this.lock.acquire(SwapNursery.reverseSwapLock, async () => {
            const reverseSwap = await this.reverseSwapRepository.getReverseSwap({
              minerFeeInvoice: {
                [Op.eq]: invoice,
              },
            });

            if (reverseSwap) {
              this.logger.silly(`Minerfee prepayment of Reverse Swap ${ reverseSwap.id } settled`);
              this.emit('minerfee.paid', await this.reverseSwapRepository.setReverseSwapStatus(reverseSwap, SwapUpdateEvent.MinerFeePaid));

              // Send onchain coins in case the hold invoice was paid first
              const holdInvoice = await lndClient.lookupInvoice(getHexBuffer(decodeInvoice(reverseSwap.invoice).paymentHash!));
              if (holdInvoice.state === Invoice.InvoiceState.ACCEPTED) {
                await this.sendReverseSwapCoins(reverseSwap);
              }
            }
          });
        });
      }
    }

    chainClient.on('transaction', async (transaction, confirmed) => {
      await Promise.all([
        await this.lock.acquire(SwapNursery.swapLock, async () => {
          for (let vout = 0; vout < transaction.outs.length; vout += 1) {
            const output = transaction.outs[vout];

            let swap = await this.swapRepository.getSwap({
              status: {
                [Op.or]: [
                  SwapUpdateEvent.InvoiceSet,
                  SwapUpdateEvent.SwapCreated,
                  SwapUpdateEvent.TransactionMempool,
                ],
              },
              lockupAddress: {
                [Op.eq]: wallet.encodeAddress(output.script),
              },
            });

            if (swap) {
              const rate = getRate(
                this.rateProvider.pairs.get(swap.pair)!.rate,
                swap.orderSide,
                false,
              );

              swap = await this.swapRepository.setLockupTransactionId(
                swap,
                rate,
                transaction.getId(),
                output.value,
                confirmed,
              );

              this.emit(
                'transaction',
                transaction,
                swap!,
                confirmed,
                false,
              );

              // If no invoice was set yet we have to wait for the client
              if (!swap!.invoice) {
                continue;
              }

              try {
                await this.attemptSettleSwap(
                  currency,
                  wallet,
                  swap!,
                  transaction,
                  confirmed,
                );
              } catch (error) {
                this.logger.warn(`Could not settle Swap ${swap!.id}: ${formatError(error)}`);
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

            if (reverseSwap) {
              chainClient.removeOutputFilter(wallet.decodeAddress(reverseSwap.lockupAddress));

              this.emit(
                'transaction',
                transaction,
                await this.reverseSwapRepository.setReverseSwapStatus(reverseSwap, SwapUpdateEvent.TransactionConfirmed),
                true,
                true,
              );
            }
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
              transactionVout: {
                [Op.eq]: input.index,
              },
            });

            if (reverseSwap) {
              try {
                await this.settleReverseSwap(reverseSwap, transaction, vin);
                chainClient.removeInputFilter(input.hash);
              } catch (error) {
                this.logger.warn(`Could not settle Reverse Swap ${reverseSwap.id}: ${formatError(error)}`);
              }
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
              this.emit('expiration', await this.swapRepository.setSwapStatus(swap, SwapUpdateEvent.SwapExpired), false);
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
                try {
                  await this.refundReverseSwap(
                    reverseSwap,
                    chainClient,
                    wallet,
                    height,
                  );
                } catch (error) {
                  this.logger.error(`Could not broadcast refund transaction: ${formatError(error)}`);
                }
              } else {
                this.logger.verbose(`Aborting reverse swap: ${reverseSwap.id}`);
                this.emit('expiration', await this.reverseSwapRepository.setReverseSwapStatus(reverseSwap, SwapUpdateEvent.SwapExpired), true);
              }
            }
          }
        }),
      ]);
    });
  }

  /**
   * Check whether the invoice of a Swap should be paid and pays it if so
   */
  public attemptSettleSwap = async (
    currency: Currency,
    wallet: Wallet,
    swap: Swap,
    transaction: Transaction,
    confirmed: boolean,
    outgoingChannelId?: string,
  ) => {
    let zeroConfRejectedReason: string | undefined = undefined;

    // Confirmed transactions do not have to be checked for 0-conf criteria
    if (!confirmed) {
      // Check if the transaction signals RBF
      const signalsRbf = await this.transactionSignalsRbf(currency.chainClient, transaction);

      if (signalsRbf) {
        zeroConfRejectedReason = 'transaction or one of its unconfirmed ancestors signals RBF';
      } else {
        // Check if the transaction has a fee high enough to be confirmed in a timely manner
        const feeEstimation = await currency.chainClient.estimateFee();

        const transactionFee = await this.calculateTransactionFee(currency.chainClient, transaction);
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

    if (zeroConfRejectedReason !== undefined) {
      this.logger.warn(`Rejected 0-conf ${currency.symbol} transaction ${transaction.getId()}: ${zeroConfRejectedReason}`);
      this.emit('zeroconf.rejected', swap, zeroConfRejectedReason);
    } else if (confirmed || swap.acceptZeroConf) {
      const swapOutput = detectSwap(getHexBuffer(swap.redeemScript), transaction)!;

      if (!confirmed) {
        this.logger.silly(`Accepted 0-conf ${currency.symbol} swap: ${transaction.getId()}:${swapOutput.vout}`);
      }

      currency.chainClient.removeOutputFilter(swapOutput.script);

      const channelCreation = await this.channelCreationRepository.getChannelCreation({
        swapId: {
          [Op.eq]: swap.id,
        },
      });

      // If the Swap should always open a channel regardless of whether the invoice can be paid,
      // the channel will be opened at this point
      if (channelCreation) {
        if (channelCreation.type === ChannelCreationType.Create && channelCreation.status === null) {
          // TODO: logging and swap update event when the sent amount it too little
          if (swap.onchainAmount! >= swap.expectedAmount!) {
            // TODO: cross chain
            await this.channelNursery.openChannel(currency, swap, channelCreation);
          }

          return;
        }
      }

      await this.claimSwap(currency, wallet, swap, channelCreation, transaction, swapOutput.vout, outgoingChannelId);
    }
  }

  private claimSwap = async (
    currency: Currency,
    wallet: Wallet,
    swap: Swap,
    channelCreation: ChannelCreation | undefined,
    transaction: Transaction,
    vout: number,
    outgoingChannelId?: string,
  ) => {
    // If there is a Channel Creation but no outgoing channel id specified, this function won't do anything
    if (channelCreation) {
      if (
        channelCreation.fundingTransactionId !== null && outgoingChannelId === undefined ||
        channelCreation.type === ChannelCreationType.Create && channelCreation.fundingTransactionId === null
      ) {
        return;
      }
    }

    const output = transaction.outs[vout];
    const swapOutput = `${transaction.getId()}:${vout}`;

    if (output.value < swap.expectedAmount!) {
      this.logger.error(`Aborting ${currency.symbol} swap: value ${output.value} of ${swapOutput} is less than expected ${swap.expectedAmount}`);
      // TODO: emit event
      return;
    }

    this.logger.verbose(`Claiming ${currency.symbol} Swap ${swap.id} output: ${swapOutput}`);

    if (swap.status !== SwapUpdateEvent.InvoicePending) {
      await this.swapRepository.setSwapStatus(swap, SwapUpdateEvent.InvoicePending);
      this.emit('invoice.pending', swap);
    }

    const { base, quote } = splitPairId(swap.pair);
    const lightningCurrency = getLightningCurrency(base, quote, swap.orderSide, false);

    let response: {
      preimage: Buffer,
      fee: number,
    } | undefined;

    try {
      response = await this.payInvoice(this.currencies.get(lightningCurrency)!.lndClient!, swap.invoice!, outgoingChannelId);
    } catch (error) {
      this.logger.debug(`Could not pay invoice of Swap ${swap.id}: ${formatError(error)}`);

      // TODO: double check if peer is connected to us -> open a channel in all cases
      /*
       * Errors that should trigger no Channel Creation and a retry:
       *  - "unable to route payment to destination: UnknownNextPeer@"
       *
       * Errors that should always trigger a Channel Creation:
       *  - "insufficient local balance"
       *  - "unable to find a path to destination"
       *
       * Just to be sure we also open a channel for errors of the type string we don't know how to handle
       */

      if (
        channelCreation &&
        !channelCreation.status &&
        typeof error === 'string' &&
        !error.startsWith('unable to route payment to destination: UnknownNextPeer')
      ) {
        // TODO: cross chain support
        await this.channelNursery.openChannel(currency, swap, channelCreation);
        return;
      }

      // Since paying the invoice failed, we can't continue with the claiming flow
      throw `could not pay invoice: ${formatError(error)}`;
    }

    this.logger.silly(`Got ${currency.symbol} preimage: ${getHexString(response.preimage)}`);

    this.emit('invoice.paid', await this.swapRepository.setInvoicePaid(swap, response.fee));

    const destinationAddress = await wallet.newAddress();

    const claimTx = constructClaimTransaction(
      [{
        vout,
        value: output.value,
        script: output.script,
        preimage: response.preimage,
        txHash: transaction.getHash(),
        type: this.swapOutputType,
        keys: wallet.getKeysByIndex(swap.keyIndex),
        redeemScript: getHexBuffer(swap.redeemScript),
      }],
      address.toOutputScript(destinationAddress, currency.network),
      await currency.chainClient.estimateFee(),
      true,
    );
    const minerFee = await this.calculateTransactionFee(currency.chainClient, claimTx);

    this.logger.silly(`Broadcasting ${currency.symbol} claim transaction: ${claimTx.getId()}`);

    await currency.chainClient.sendRawTransaction(claimTx.toHex());
    this.emit('claim', await this.swapRepository.setMinerFee(swap, minerFee));
  }

  private sendReverseSwapCoins = async (reverseSwap: ReverseSwap) => {
    const { base, quote } = splitPairId(reverseSwap.pair);
    const chainCurrency = getChainCurrency(base, quote, reverseSwap.orderSide, true);
    const lightningCurrency = getLightningCurrency(base, quote, reverseSwap.orderSide, true);

    try {
      const chainClient = this.currencies.get(chainCurrency)!.chainClient;
      const wallet = this.walletManager.wallets.get(chainCurrency)!;

      let feePerVbyte: number;

      if (reverseSwap.minerFeeInvoice) {
        feePerVbyte = Math.round(decodeInvoice(reverseSwap.minerFeeInvoice).satoshis / FeeProvider.transactionSizes.reverseLockup);
        this.logger.debug(`Using prepaid minerfee for Reverse Swap ${reverseSwap.id} of ${feePerVbyte} sat/vbyte`);
      } else {
        feePerVbyte = await chainClient.estimateFee(SwapNursery.reverseSwapMempoolEta);
      }
      const { fee, vout, transaction, transactionId } = await wallet.sendToAddress(reverseSwap.lockupAddress, reverseSwap.onchainAmount, feePerVbyte);

      this.logger.verbose(`Sent ${chainCurrency} to reverse swap ${reverseSwap.id} in transaction: ${transactionId}:${vout}`);

      chainClient.addInputFilter(transaction.getHash());
      chainClient.addOutputFilter(wallet.decodeAddress(reverseSwap.lockupAddress));

      this.emit('coins.sent', await this.reverseSwapRepository.setLockupTransaction(reverseSwap, transactionId, vout, fee), transaction);
    } catch (error) {
      const preimageHash = getHexBuffer(decodeInvoice(reverseSwap.invoice).paymentHash!);

      const lndClient = this.currencies.get(lightningCurrency)!.lndClient!;
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

    const lndClient = this.currencies.get(lightningCurrency)!.lndClient!;
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
    const lockupTransaction = Transaction.fromHex(await chainClient.getRawTransaction(reverseSwap.transactionId!));

    for (let i = 0; i < lockupTransaction.outs.length; i += 1) {
      const output = lockupTransaction.outs[i];

      if (wallet.encodeAddress(output.script) === reverseSwap.lockupAddress) {
        vout = i;
        break;
      }
    }

    // This should never happen but if it does we cannot refund the coins
    if (vout === undefined) {
      throw 'could not find lockup output';
    }

    chainClient.removeInputFilter(lockupTransaction.getHash());
    chainClient.removeOutputFilter(wallet.decodeAddress(reverseSwap.lockupAddress));

    this.logger.info(`Refunding ${chainClient.symbol} reverse swap: ${reverseSwap.transactionId}:${vout}`);

    const destinationAddress = await wallet.newAddress();
    const refundTransaction = constructRefundTransaction(
      [{
        vout,
        ...lockupTransaction.outs[vout],
        type: ReverseSwapOutputType,
        txHash: lockupTransaction.getHash(),
        keys: wallet.getKeysByIndex(reverseSwap.keyIndex),
        redeemScript: getHexBuffer(reverseSwap.redeemScript),
      }],
      wallet.decodeAddress(destinationAddress),
      blockHeight,
      await chainClient.estimateFee(),
    );
    const minerFee = await this.calculateTransactionFee(chainClient, refundTransaction, lockupTransaction.outs[vout].value);

    this.logger.verbose(`Broadcasting ${chainClient.symbol} refund transaction: ${refundTransaction.getId()}`);

    await chainClient.sendRawTransaction(refundTransaction.toHex());

    const preimageHash = getHexBuffer(decodeInvoice(reverseSwap.invoice).paymentHash!);
    await this.cancelInvoice(this.currencies.get(lightningCurrency)!.lndClient!, preimageHash);

    this.emit('refund', await this.reverseSwapRepository.setTransactionRefunded(reverseSwap, minerFee), refundTransaction.getId());
  }

  private cancelInvoice = (lndClient: LndClient, preimageHash: Buffer) => {
    this.logger.verbose(`Cancelling hold invoice with preimage hash: ${getHexString(preimageHash)}`);

    return lndClient.cancelInvoice(preimageHash);
  }

  private payInvoice = async (lndClient: LndClient, invoice: string, outgoingChannelId?: string) => {
    const response = await lndClient.sendPayment(invoice, outgoingChannelId);

    return {
      preimage: response.paymentPreimage,
      fee: response.paymentRoute.totalFeesMsat,
    };
  }

  // TODO: write integration test
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

        const relevantOutput = inputTransaction.outs[input.index];

        queriedInputSum += relevantOutput.value;
      }

      return queriedInputSum;
    };

    let fee = inputSum || await queryInputSum();

    transaction.outs.forEach((output) => {
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
