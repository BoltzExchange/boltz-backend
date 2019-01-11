import { BIP32 } from 'bip32';
import { Transaction, address } from 'bitcoinjs-lib';
import { OutputType, TransactionOutput, Scripts, pkRefundSwap, constructClaimTransaction } from 'boltz-core';
import Errors from './Errors';
import Logger from '../Logger';
import LndClient from '../lightning/LndClient';
import { OrderSide } from '../proto/boltzrpc_pb';
import WalletManager, { Currency } from '../wallet/WalletManager';
import { getHexBuffer, getHexString, getScriptHashEncodeFunction, reverseString } from '../Utils';

const { p2shP2wshOutput } = Scripts;

type BaseSwapDetails = {
  redeemScript: Buffer;
};

type SwapDetails = BaseSwapDetails & {
  lndClient: LndClient;
  expectedAmount: number;
  invoice: string;
  claimKeys: BIP32;
  outputType: OutputType;
};

type ReverseSwapDetails = BaseSwapDetails & {
  refundKeys: BIP32;
  output: TransactionOutput;
};

type SwapMaps = {
  // A map between an output script and the SwapDetails
  swaps: Map<string, SwapDetails>;

  // A map between an invoice and the ReverseSwapDetails
  reverseSwaps: Map<string, ReverseSwapDetails>;
};

// TODO: catch errors here not in GrpcServer
// TODO: configurable timeouts
// TODO: verify values and amounts
// TODO: fees for the Boltz to collect
// TODO: automatically refund failed swaps
// TODO: save pending swap to database to be able to claim/refund them if boltz crashes
class SwapManager {
  public currencies = new Map<string, Currency & SwapMaps>();

  constructor(private logger: Logger, private walletManager: WalletManager, currencies: Currency[]) {
    currencies.forEach((currency) => {
      if (!this.currencies.get(currency.symbol)) {
        const swapMaps = {
          swaps: new Map<string, SwapDetails>(),
          reverseSwaps: new Map<string, ReverseSwapDetails>(),
        };

        this.currencies.set(currency.symbol, {
          ...currency,
          ...swapMaps,
        });

        this.bindCurrency(currency, swapMaps);
      }
    });
  }

  /**
   * Creates a new Swap from the chain to Lightning
   *
   * @param baseCurrency base currency ticker symbol
   * @param quoteCurrency quote currency ticker symbol
   * @param orderSide whether the order is a buy or sell one
   * @param rate conversion rate of base and quote currency
   * @param invoice the invoice that should be paid
   * @param refundPublicKey public key of the keypair needed for claiming
   * @param outputType what kind of adress should be returned
   *
   * @returns an onchain address
   */
  public createSwap = async (baseCurrency: string, quoteCurrency: string, orderSide: OrderSide, rate: number,
    invoice: string, refundPublicKey: Buffer, outputType: OutputType) => {

    const { sendingCurrency, receivingCurrency } = this.getCurrencies(baseCurrency, quoteCurrency, orderSide);

    this.logger.silly(`Sending ${sendingCurrency.symbol} on Lightning and receiving ${receivingCurrency.symbol} on the chain`);

    const bestBlock = await receivingCurrency.chainClient.getBestBlock();
    const { paymentHash, numSatoshis } = await sendingCurrency.lndClient.decodePayReq(invoice);

    this.logger.verbose(`Creating new Swap from ${receivingCurrency.symbol} to ${sendingCurrency.symbol} with preimage hash: ${paymentHash}`);

    const { keys } = receivingCurrency.wallet.getNewKeys();

    const timeoutBlockHeight = bestBlock.height + 10;
    const redeemScript = pkRefundSwap(
      getHexBuffer(paymentHash),
      keys.publicKey,
      refundPublicKey,
      timeoutBlockHeight,
    );

    const encodeFunction = getScriptHashEncodeFunction(outputType);
    const outputScript = encodeFunction(redeemScript);

    const address = receivingCurrency.wallet.encodeAddress(outputScript);
    const expectedAmount = this.calculateExpectedAmount(numSatoshis, this.getRate(rate, orderSide));

    receivingCurrency.swaps.set(getHexString(outputScript), {
      invoice,
      outputType,
      redeemScript,
      expectedAmount,
      claimKeys: keys,
      lndClient: sendingCurrency.lndClient,
    });

    await receivingCurrency.chainClient.loadTxFiler(false, [address], []);

    return {
      address,
      expectedAmount,
      timeoutBlockHeight,
      redeemScript: getHexString(redeemScript),
    };
  }

  /**
   * Creates a new reverse Swap from Lightning to the chain
   *
   * @param baseCurrency base currency ticker symbol
   * @param quoteCurrency quote currency ticker symbol
   * @param orderSide whether the order is a buy or sell one
   * @param rate conversion rate of base and quote currency
   * @param claimPublicKey public key of the keypair needed for claiming
   * @param amount amount of the invoice
   *
   * @returns a Lightning invoice, the lockup transaction and its hash
   */
  public createReverseSwap = async (baseCurrency: string, quoteCurrency: string, orderSide: OrderSide, rate: number,
    claimPublicKey: Buffer, amount: number) => {

    const { sendingCurrency, receivingCurrency } = this.getCurrencies(baseCurrency, quoteCurrency, orderSide);

    this.logger.silly(`Sending ${sendingCurrency.symbol} on the chain and receiving ${receivingCurrency.symbol} on Lightning`);
    this.logger.verbose(`Creating new reverse Swap from ${receivingCurrency.symbol} to ${sendingCurrency.symbol}` +
      `for public key: ${getHexString(claimPublicKey)}`);

    const { blocks } = await sendingCurrency.chainClient.getInfo();
    const { rHash, paymentRequest } = await receivingCurrency.lndClient.addInvoice(amount);

    const { keys } = sendingCurrency.wallet.getNewKeys();
    const redeemScript = pkRefundSwap(
      Buffer.from(rHash as string, 'base64'),
      claimPublicKey,
      keys.publicKey,
      blocks + 10,
    );

    const outputScript = p2shP2wshOutput(redeemScript);
    const address = sendingCurrency.wallet.encodeAddress(outputScript);

    const sendingAmount = this.calculateExpectedAmount(amount, this.getRate(rate, orderSide));

    this.logger.debug(`Sending ${sendingAmount} on ${sendingCurrency.symbol} to swap address: ${address}`);

    const { tx, vout } = await sendingCurrency.wallet.sendToAddress(address, OutputType.Compatibility, true, sendingAmount);
    const rawTx = tx.toHex();

    await sendingCurrency.chainClient.sendRawTransaction(rawTx);

    sendingCurrency.reverseSwaps.set(paymentRequest, {
      redeemScript,
      refundKeys: keys,
      output: {
        vout,
        txHash: tx.getHash(),
        type: OutputType.Compatibility,
        script: outputScript,
        value: sendingAmount,
      },
    });

    return {
      invoice: paymentRequest,
      redeemScript: getHexString(redeemScript),
      lockupAddress: address,
      lockupTransaction: rawTx,
      lockupTransactionHash: tx.getId(),
    };
  }

  private bindCurrency = (currency: Currency, maps: SwapMaps) => {
    currency.chainClient.on('transaction.relevant.block', async (transactionHex: string) => {
      const transaction = Transaction.fromHex(transactionHex);

      let vout = 0;

      for (const output of transaction.outs) {
        const hexScript = getHexString(output.script);
        const swapDetails = maps.swaps.get(hexScript);

        if (swapDetails) {
          maps.swaps.delete(hexScript);
          await this.claimSwap(
            currency,
            swapDetails.lndClient,
            transaction.getHash(),
            output.script,
            output.value,
            vout,
            swapDetails,
          );
        }

        vout += 1;
      }
    });
  }

  private claimSwap = async (currency: Currency, lndClient: LndClient,
    txHash: Buffer, outpuScript: Buffer, outputValue: number, vout: number, details: SwapDetails) => {

    const swapOutput = `${reverseString(getHexString(txHash))}:${vout}`;

    if (outputValue < details.expectedAmount) {
      this.logger.warn(`Value ${outputValue} of ${swapOutput} is less than expected ${details.expectedAmount}. Aborting swap`);
      return;
    }

    const { symbol, chainClient } = currency;

    // The ID of the transaction is used by wallets, block explorers and node software and is the reversed hash of the transaction
    this.logger.info(`Claiming swap output of ${symbol} transaction ${swapOutput}`);

    const payInvoice = await lndClient.payInvoice(details.invoice);

    if (payInvoice.paymentError !== '') {
      // TODO: retry and show error to the user
      this.logger.warn(`Could not pay invoice ${details.invoice}: ${payInvoice.paymentError}`);
      return;
    }

    const preimage = payInvoice.paymentPreimage as string;
    this.logger.verbose(`Got preimage: ${preimage}`);

    const destinationAddress = await this.walletManager.wallets.get(currency.symbol)!.getNewAddress(OutputType.Bech32);

    const claimTx = constructClaimTransaction(
      [{
        vout,
        txHash,
        value: outputValue,
        script: outpuScript,
        keys: details.claimKeys,
        type: details.outputType,
        redeemScript: details.redeemScript,
        preimage: Buffer.from(preimage, 'base64'),
      }],
      address.toOutputScript(destinationAddress, currency.network),
      1,
      true,
    );

    this.logger.silly(`Broadcasting claim transaction: ${claimTx.getId()}`);
    await chainClient.sendRawTransaction(claimTx.toHex());
  }

  private getCurrencies = (baseCurrency: string, quoteCurrency: string, orderSide: OrderSide) => {
    const base = this.getCurrency(baseCurrency);
    const quote = this.getCurrency(quoteCurrency);

    const isBuy = orderSide === OrderSide.BUY;

    const sending = isBuy ? base : quote;
    const receiving = isBuy ? quote : base;

    return {
      sendingCurrency: {
        ...sending,
        wallet: this.walletManager.wallets.get(sending.symbol)!,
      },
      receivingCurrency: {
        ...receiving,
        wallet: this.walletManager.wallets.get(receiving.symbol)!,
      },
    };
  }

  private getCurrency = (currencySymbol: string) => {
    const currency = this.currencies.get(currencySymbol);

    if (!currency) {
      throw Errors.CURRENCY_NOT_FOUND(currencySymbol);
    }

    return currency;
  }

  private calculateExpectedAmount = (amount: number, rate: number) => {
    return Math.ceil(amount * rate);
  }

  private getRate = (rate: number, orderSide: OrderSide) => {
    return orderSide === OrderSide.BUY ? rate : 1 / rate;
  }
}

export default SwapManager;
