import { BIP32 } from 'bip32';
import Bluebird from 'bluebird';
import { OutputType, TransactionOutput, estimateFee } from 'boltz-core';
import { Transaction, Network, address, crypto, TransactionBuilder, ECPair } from 'bitcoinjs-lib';
import Errors from './Errors';
import Logger from '../Logger';
import UtxoRepository from './UtxoRepository';
import ChainClient from '../chain/ChainClient';
import { UtxoInstance } from '../consts/Database';
import WalletRepository from './WalletRepository';
import OutputRepository from './OutputRepository';
import { getPubKeyHashEncodeFuntion, getHexString, getHexBuffer, reverseBuffer } from '../Utils';

type UTXO = TransactionOutput & {
  id: number;
  keys: BIP32;
  redeemScript?: Buffer;
};

type WalletBalance = {
  totalBalance: number;
  confirmedBalance: number;
  unconfirmedBalance: number;
};

type UtxoPromise = Promise<UtxoInstance> | Bluebird<UtxoInstance>;

// TODO: detect funds received whlie Boltz was not running
// TODO: more advanced UTXO management
// TODO: multiple outputs to the wallet in one transaction
class Wallet {
  // A map between output scripts and information necessary to spend them
  private relevantOutputs = new Map<string, { id: number, keyIndex: number, type: OutputType, redeemScript?: string }>();

  // A map between the ids and relevant output scripts
  private outputIds = new Map<number, string>();

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
    private outputRepository: OutputRepository,
    private utxoRepository: UtxoRepository,
    private masterNode: BIP32,
    public readonly network: Network,
    private chainClient: ChainClient,
    public readonly derivationPath: string,
    private highestIndex: number) {

    this.symbol = this.chainClient.symbol;

    // If a transaction is found in the mempool and mined a few milliseconds afterwards
    // it can happen that the UTXO gets inserted in the database twice. To avoid that this
    // Map between the hex encoded unconfirmed transacions and their database insertion
    // Promises is checked before adding a new UTXO to the database.
    const mempoolInsertPromises = new Map<string, UtxoPromise>();

    const upsertUtxo = (txHex: string, blockHeight?: number) => {
      const transaction = Transaction.fromHex(txHex);
      const confirmed = blockHeight !== undefined;

      transaction.outs.forEach(async (output, vout) => {
        const hexScript = getHexString(output.script);
        const outputInfo = this.relevantOutputs.get(hexScript);

        if (outputInfo) {
          if (confirmed) {
            this.logUtxoFoundMessage(true, transaction.getId(), vout, output.value, blockHeight);
          } else {
            this.logUtxoFoundMessage(false, transaction.getId(), vout, output.value);
          }

          const txHash = getHexString(transaction.getHash());

          const promise = new Promise<UtxoInstance>(async (resolve) => {
            const existingUtxo = await this.utxoRepository.getUtxo(txHash, vout);

            if (existingUtxo && confirmed) {
              resolve(existingUtxo.update({
                confirmed,
              }));
            } else {
              resolve(this.utxoRepository.addUtxo({
                vout,
                confirmed,
                spent: false,
                value: output.value,
                currency: this.symbol,
                outputId: outputInfo.id,
                txHash: getHexString(transaction.getHash()),
              }));
            }
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

  public init = async () => {
    const outputs = await this.outputRepository.getOutputs(this.symbol);
    const addresses: string[] = [];

    outputs.forEach((output) => {
      addresses.push(this.encodeAddress(getHexBuffer(output.script)));

      this.outputIds.set(output.id, output.script);
      this.relevantOutputs.set(output.script, {
        id: output.id,
        keyIndex: output.keyIndex,
        type: output.type,
        redeemScript: output.redeemScript,
      });
    });

    await this.chainClient.loadTxFiler(false, addresses, []);
    await this.checkUnconfirmedFunds();
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
    this.logger.debug(`Generated new ${this.symbol} address: ${address}`);

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
      const script = this.outputIds.get(utxoInstance.outputId)!;
      const output = this.relevantOutputs.get(script)!;

      const redeemScript = output.redeemScript ? getHexBuffer(output.redeemScript) : undefined;

      toSpend.push({
        redeemScript,
        type: output.type,
        id: utxoInstance.id,
        vout: utxoInstance.vout,
        value: utxoInstance.value,
        script: getHexBuffer(script),
        txHash: getHexBuffer(utxoInstance.txHash),
        keys: this.getKeysByIndex(output.keyIndex),
      });

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

    // Mark the UTXOs that are going to be spent
    const markPromises: Promise<any>[] = [];
    toSpend.forEach((utxo) => {
      markPromises.push(this.utxoRepository.markUtxoSpent(utxo.id));
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

    await Promise.all(markPromises);

    return {
      tx: builder.build(),
      vout: 0,
    };
  }

  /**
   * Checks if unconfirmed funds got confirmed since last startup
   */
  private checkUnconfirmedFunds = async () => {
    const utxos = await this.utxoRepository.getUnconfirmedUtxos(this.symbol);

    utxos.forEach(async (utxo) => {
      // The reversed version of the hex representation of a Buffer is not equal to the reversed Buffer.
      // Therefore we have to go full circle from a string to back to the Buffer, reverse that Buffer
      // and convert it back to a string to get the id of the transaction that is used by BTCD
      const transactionId = getHexString(
        reverseBuffer(
          getHexBuffer(utxo.txHash),
        ),
      );

      const transactionInfo = await this.chainClient.getRawTransaction(transactionId, 1);

      if (transactionInfo.confirmations) {
        const bestBlock = await this.chainClient.getBestBlock();

        // BTCD shows 1 confirmtation if the transaction in the best block (tip of the chain). Therefore to get the
        // block height in which it got confirmed we have to get the height of the best block minus how deep the block
        // in which the transaction confirmed is in the chain (confirmations minus one)
        this.logUtxoFoundMessage(true, transactionId, utxo.vout, utxo.value, bestBlock.height - (transactionInfo.confirmations - 1));

        utxo.set('confirmed', true);
        await utxo.save();
      }
    });
  }

  /**
   * Add an output that can be spent by the wallet
   */
  private listenToOutput = async (script: Buffer, keyIndex: number, type: OutputType, address?: string, redeemScript?: string) => {
    const scriptString = getHexString(script);

    const chainAddress = address ? address : this.encodeAddress(script);

    await this.chainClient.loadTxFiler(false, [chainAddress], []);

    const outputInstance = await this.outputRepository.addOutput({
      type,
      keyIndex,
      redeemScript,
      script: scriptString,
      currency: this.symbol,
    });

    this.outputIds.set(outputInstance.id, scriptString);
    this.relevantOutputs.set(scriptString, {
      type,
      keyIndex,
      redeemScript,
      id: outputInstance.id,
    });
  }

  private logUtxoFoundMessage = (confirmed: boolean, transactionId: string, vout: number, value: number, blockHeight?: number) => {
    const message = `Found UTXO of ${this.symbol} wallet ${confirmed ? `in block #${blockHeight}` : 'in mempool'}:` +
      ` ${transactionId}:${vout} with value ${value}`;

    if (confirmed) {
      this.logger.info(message);
    } else {
      this.logger.verbose(message);
    }
  }
}

export default Wallet;
export { WalletBalance };
