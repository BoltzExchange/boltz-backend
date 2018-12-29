import { BIP32 } from 'bip32';
import { Transaction, Network, address, crypto, TransactionBuilder, ECPair } from 'bitcoinjs-lib';
import { OutputType, TransactionOutput, estimateFee } from 'boltz-core';
import ChainClient from '../chain/ChainClient';
import { getPubKeyHashEncodeFuntion, getHexString, getHexBuffer } from '../Utils';
import Errors from './Errors';
import Logger from '../Logger';
import UtxoRepository from './UtxoRepository';
import WalletRepository from './WalletRepository';
import { UtxoInstance } from '../consts/Database';

type UTXO = TransactionOutput & {
  redeemScript?: Buffer;
  keys: BIP32;
};

type WalletBalance = {
  totalBalance: number;
  confirmedBalance: number;
  unconfirmedBalance: number;
};

// TODO: detect funds received whlie Boltz was not running
// TODO: more advanced UTXO management
// TODO: multiple transaction to same output
// TODO: multiple outputs to the wallet in one transaction
class Wallet {
  private relevantOutputs = new Map<string, { keyIndex: number, type: OutputType, redeemScript?: string }>();

  private symbol: string;

  /**
   * Wallet is a hierarchical deterministic wallet for a single currency
   *
   * @param masterNode the master node from which wallets are derived
   * @param network the network of the wallet
   * @param chainClient the ChainClient for the network
   * @param derivationPath should be in the format "m/0/<index of the wallet>"
   * @param highestIndex the highest index of a used address in the wallet
   */
  constructor(
    private logger: Logger,
    private walletRepository: WalletRepository,
    private utxoRepository: UtxoRepository,
    private masterNode: BIP32,
    public readonly network: Network,
    private chainClient: ChainClient,
    public readonly derivationPath: string,
    private highestIndex: number) {

    this.symbol = this.chainClient.symbol;

    // If a transaction is found in the mempool and mined a few milliseconds afterwards
    // it can happen that the UTXO gets inserted in the database twice which would result
    // in "SequelizeUniqueConstraintError: Validation error". To avoid these errors
    // this Map between the txHex of unconfirmed transactions and their database insertion
    // Promises is checked before inserting a confirmed transaction into the database.
    const mempoolInsertPromises = new Map<string, Promise<UtxoInstance>>();

    const upsertUtxo = (txHex: string, blockHeight?: number) => {
      const transaction = Transaction.fromHex(txHex);
      const confirmed = blockHeight !== undefined;

      transaction.outs.forEach(async (output, vout) => {
        const hexScript = getHexString(output.script);
        const outputInfo = this.relevantOutputs.get(hexScript);

        if (outputInfo) {
          this.logger.debug(`Found UTXO of ${this.symbol} wallet ${confirmed ? `in block #${blockHeight}` : 'in mempool'}:` +
            ` ${transaction.getId()}:${vout} with value ${output.value}`);

          if (confirmed) {
            this.relevantOutputs.delete(hexScript);
          }

          const promise = this.utxoRepository.upsertUtxo({
            vout,
            confirmed,
            currency: this.symbol,
            txHash: getHexString(transaction.getHash()),
            script: getHexString(output.script),
            redeemScript: outputInfo.redeemScript,
            value: output.value,
            ...outputInfo,
          });

          if (confirmed) {
            await promise;
          } else {
            mempoolInsertPromises.set(txHex, promise);
          }
        }
      });
    };

    this.chainClient.on('transaction.relevant.mempool', (txHex) => {
      upsertUtxo(txHex);
    });

    this.chainClient.on('transaction.relevant.block', async (txHex, blockHeight: number) => {
      const mempoolInsertPromise = mempoolInsertPromises.get(txHex);

      if (mempoolInsertPromise) {
        mempoolInsertPromises.delete(txHex);
        await mempoolInsertPromise;
      }

      upsertUtxo(txHex, blockHeight);
    });
  }

  public get highestUsedIndex() {
    return this.highestIndex;
  }

  /**
   * Gets a specific pair of keys
   *
   * @param index index of the keys to get
   */
  public getKeysByIndex = (index: number) => {
    return this.masterNode.derivePath(`${this.derivationPath}/${index}`);
  }

  /**
   * Gets a new pair of keys
   */
  public getNewKeys = () => {
    this.highestIndex += 1;

    // tslint:disable-next-line no-floating-promises
    this.walletRepository.updateHighestUsedIndex(this.symbol, this.highestIndex);

    return {
      keys: this.getKeysByIndex(this.highestIndex),
      index: this.highestIndex,
    };
  }

  /**
   * Gets a new address
   *
   * @param type ouput type of the address
   */
  public getNewAddress = async (type: OutputType) => {
    const { keys, index } = this.getNewKeys();

    const encodeFunction = getPubKeyHashEncodeFuntion(type);
    const output = encodeFunction(crypto.hash160(keys.publicKey));

    let outputScript: Buffer;
    let redeemScript: string | undefined = undefined;

    if (type === OutputType.Compatibility) {
      const nestedOutput = output as { redeemScript: Buffer, outputScript: Buffer };

      outputScript = nestedOutput.outputScript;
      redeemScript = getHexString(nestedOutput.redeemScript);
    } else {
      outputScript = output as Buffer;
    }

    const address = this.encodeAddress(outputScript);

    await this.listenToOutput(outputScript, index, type, address, redeemScript);

    return address;
  }

  /**
   * Encodes an address
   *
   * @param outputScript the output script to encode
   */
  public encodeAddress = (outputScript: Buffer) => {
    return address.fromOutputScript(
      outputScript,
      this.network,
    );
  }

  /**
   * Add an output that can be spent by the wallet
   */
  public listenToOutput = async (output: Buffer, keyIndex: number, type: OutputType, address?: string, redeemScript?: string) => {
    this.relevantOutputs.set(getHexString(output), { keyIndex, type, redeemScript });

    const chainAddress = address ? address : this.encodeAddress(output);
    await this.chainClient.loadTxFiler(false, [chainAddress], []);
  }

  /**
   * Get the balance of the wallet
   */
  public getBalance = async (): Promise<WalletBalance> => {
    let confirmedBalance = 0;
    let unconfirmedBalance = 0;

    const utxos = await this.utxoRepository.getUtxos(this.symbol);

    utxos.forEach((utxo) => {
      if (utxo.confirmed) {
        confirmedBalance += utxo.value;
      } else {
        unconfirmedBalance += utxo.value;
      }
    });

    return {
      confirmedBalance,
      unconfirmedBalance,
      totalBalance: confirmedBalance + unconfirmedBalance,
    };
  }

  // TODO: custom fee
  // TODO: avoid dust to change addresses
  /** Sends a specific amount of funds to and address
   *
   * @returns the transaction itself and the vout of the provided address
   */
  public sendToAddress = async (address: string, type: OutputType, isScriptHash: boolean, amount: number):
      Promise<{ tx: Transaction, vout: number }> => {

    const utxos = await this.utxoRepository.getUtxosSorted(this.symbol);
    const feePerByte = 10;

    // The UTXOs that will be spent
    const toSpend: UTXO[] = [];
    // The hex encoded strings of the UTXOs that will be spent
    const toRemove: string[] = [];

    const recalculateFee = () => {
      return estimateFee(feePerByte, toSpend, [{ type: OutputType.Bech32 }, { type, isSh: isScriptHash }]);
    };

    let toSpendSum = 0;
    let fee = recalculateFee();

    const fundsSufficient = () => {
      return (amount + fee) <= toSpendSum;
    };

    // Accumulate UTXOs to spend
    for (const utxoInstance of utxos) {
      const redeemScript = utxoInstance.redeemScript ? getHexBuffer(utxoInstance.redeemScript) : undefined;

      toSpend.push({
        redeemScript,
        txHash: getHexBuffer(utxoInstance.txHash),
        vout: utxoInstance.vout,
        type: utxoInstance.type,
        script: getHexBuffer(utxoInstance.script),
        value: utxoInstance.value,
        keys: this.getKeysByIndex(utxoInstance.keyIndex),
      });

      toRemove.push(utxoInstance.txHash);

      toSpendSum += utxoInstance.value;
      fee = recalculateFee();

      if (fundsSufficient()) {
        break;
      }
    }

    // Throw an error if the wallet doesn't have enough funds
    if (!fundsSufficient()) {
      throw Errors.NOT_ENOUGH_FUNDS(amount);
    }

    // Remove the UTXOs that are going to be spent from the UTXOs of the wallet
    const removePromises: Promise<any>[] = [];
    toRemove.forEach((txHash) => {
      removePromises.push(this.utxoRepository.removeUtxo(txHash));
    });

    // Construct the transaction
    const builder = new TransactionBuilder(this.network);

    // Add the UTXOs from before as inputs
    toSpend.forEach((utxo) => {
      if (utxo.type === OutputType.Bech32) {
        builder.addInput(utxo.txHash, utxo.vout, undefined, utxo.script);
      } else {
        builder.addInput(utxo.txHash, utxo.vout);
      }
    });

    // Add the requested ouput to the transaction
    builder.addOutput(address, amount);

    // Sent the value left of the UTXOs to a new change address
    builder.addOutput(await this.getNewAddress(OutputType.Bech32), toSpendSum - (amount + fee));

    // Sign the transaction
    toSpend.forEach((utxo, index) => {
      const keys = ECPair.fromPrivateKey(utxo.keys.privateKey, { network: this.network });

      switch (utxo.type) {
        case OutputType.Bech32:
          builder.sign(index, keys, undefined, undefined, utxo.value);
          break;

        case OutputType.Compatibility:
          builder.sign(index, keys, utxo.redeemScript, undefined, utxo.value);
          break;

        case OutputType.Legacy:
          builder.sign(index, keys);
          break;
      }
    });

    await Promise.all(removePromises);

    return {
      tx: builder.build(),
      vout: 0,
    };
  }
}

export default Wallet;
export { WalletBalance };
