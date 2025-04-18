import { Transaction } from 'bitcoinjs-lib';
import type Logger from '../../Logger';
import { isTxConfirmed, transactionHashToId } from '../../Utils';
import type { IChainClient } from '../../chain/ChainClient';
import ChainClient, { AddressType } from '../../chain/ChainClient';
import type { SentTransaction, WalletBalance } from './WalletProviderInterface';
import type WalletProviderInterface from './WalletProviderInterface';

class CoreWalletProvider implements WalletProviderInterface {
  public readonly symbol: string;

  constructor(
    public logger: Logger,
    public chainClient: IChainClient,
  ) {
    this.symbol = chainClient.symbol;

    this.logger.info(`Initialized ${this.symbol} Core wallet`);
  }

  public serviceName = (): string => {
    return 'Core';
  };

  public getAddress = (
    label: string,
    type: AddressType = AddressType.Taproot,
  ): Promise<string> => this.chainClient.getNewAddress(label, type);

  public getBalance = async (): Promise<WalletBalance> => {
    const utxos = await this.chainClient.listUnspent(0);

    let confirmed = BigInt(0);
    let unconfirmed = BigInt(0);

    utxos.forEach((utxo) => {
      const amount = BigInt(Math.round(utxo.amount * ChainClient.decimals));

      // Core considers its change as safe to spend, so should we
      if (isTxConfirmed(utxo) || utxo.safe) {
        confirmed += amount;
      } else {
        unconfirmed += amount;
      }
    });

    return {
      confirmedBalance: Number(confirmed),
      unconfirmedBalance: Number(unconfirmed),
    };
  };

  public sendToAddress = async (
    address: string,
    amount: number,
    satPerVbyte: number | undefined,
    label: string,
  ): Promise<SentTransaction> => {
    const transactionId = await this.chainClient.sendToAddress(
      address,
      amount,
      await this.getFeePerVbyte(satPerVbyte),
      false,
      label,
    );
    return await this.handleCoreTransaction(transactionId, address);
  };

  public sweepWallet = async (
    address: string,
    satPerVbyte: number | undefined,
    label: string,
  ): Promise<SentTransaction> => {
    const { confirmedBalance } = await this.getBalance();
    const transactionId = await this.chainClient.sendToAddress(
      address,
      confirmedBalance,
      await this.getFeePerVbyte(satPerVbyte),
      true,
      label,
    );

    return await this.handleCoreTransaction(transactionId, address);
  };

  private handleCoreTransaction = async (
    transactionId: string,
    address: string,
  ): Promise<SentTransaction> => {
    const rawTransactionVerbose =
      await this.chainClient.getRawTransactionVerbose(transactionId);
    const rawTransaction = Transaction.fromHex(rawTransactionVerbose.hex);

    let vout = 0;
    let outputSum = BigInt(0);

    for (let i = 0; i < rawTransaction.outs.length; i += 1) {
      outputSum += BigInt(rawTransaction.outs[i].value);

      const scriptPubKey = rawTransactionVerbose.vout[i].scriptPubKey;

      if (
        scriptPubKey.address === address ||
        (scriptPubKey.addresses && scriptPubKey.addresses.includes(address))
      ) {
        vout = i;
      }
    }

    // Fetch all input transactions before processing them to avoid fetching one twice
    const fetchedTransaction = new Map<string, string>();

    for (const input of rawTransactionVerbose.vin) {
      if (!fetchedTransaction.has(input.txid)) {
        fetchedTransaction.set(
          input.txid,
          await this.chainClient.getRawTransaction(input.txid),
        );
      }
    }

    let inputSum = BigInt(0);

    for (const input of rawTransaction.ins) {
      const inputTransactionId = transactionHashToId(input.hash);

      const inputTransaction = Transaction.fromHex(
        fetchedTransaction.get(inputTransactionId)!,
      );
      const inputVout = inputTransaction.outs[input.index];

      inputSum += BigInt(inputVout.value);
    }

    return {
      vout,
      transactionId,

      transaction: rawTransaction,
      fee: Math.ceil(Number(inputSum - outputSum)),
    };
  };

  private getFeePerVbyte = async (satPerVbyte?: number) => {
    return satPerVbyte || (await this.chainClient.estimateFee());
  };
}

export default CoreWalletProvider;
