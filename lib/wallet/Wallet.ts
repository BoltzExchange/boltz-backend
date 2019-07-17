import AsyncLock from 'async-lock';
import { BIP32Interface } from 'bip32';
import { OutputType, TransactionOutput, estimateFee } from 'boltz-core';
import { Transaction, Network, address, crypto, TransactionBuilder, ECPair, TxOutput } from 'bitcoinjs-lib';
import Errors from './Errors';
import Logger from '../Logger';
import Utxo from '../db/models/Utxo';
import UtxoRepository from './UtxoRepository';
import ChainClient from '../chain/ChainClient';
import WalletRepository from './WalletRepository';
import OutputRepository from './OutputRepository';
import { getPubkeyHashFunction, getHexString, getHexBuffer, reverseBuffer } from '../Utils';

type UTXO = TransactionOutput & {
  id: number;
  keys: BIP32Interface;
  redeemScript?: Buffer;
};

type WalletBalance = {
  totalBalance: number;
  confirmedBalance: number;
  unconfirmedBalance: number;
};

type UtxoPromise = Promise<Utxo>;

class Wallet {
  // A map between output scripts and information necessary to spend them
  private relevantOutputs = new Map<string, { id: number, keyIndex: number, type: OutputType, redeemScript: string | null }>();

  // A map between the ids and relevant output scripts
  private outputIds = new Map<number, string>();

  private symbol: string;

  private lock = new AsyncLock();
  private sendToAddressLock = 'sendToAddress';

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
    private masterNode: BIP32Interface,
    public readonly network: Network,
    private chainClient: ChainClient,
    public readonly derivationPath: string,
    public highestIndex: number) {

    this.symbol = this.chainClient.symbol;

    // If a transaction is found in the mempool and mined a few milliseconds afterwards
    // it can happen that the UTXO gets inserted in the database twice. To avoid that this
    // Map between the ids of unconfirmed transacions and their database insertion
    // Promises is checked before adding a new UTXO to the database.
    const mempoolInsertPromises = new Map<string, UtxoPromise>();

    const upsertUtxo = (transaction: Transaction, confirmed: boolean) => {
      transaction.outs.forEach(async (openOutput, vout) => {
        const output = openOutput as TxOutput;

        const hexScript = getHexString(output.script);
        const outputInfo = this.relevantOutputs.get(hexScript);

        if (outputInfo) {
          const promise = new Promise<Utxo>(async (resolve) => {
            const existingUtxo = await this.utxoRepository.getUtxo(transaction.getId(), vout);

            if (existingUtxo && confirmed) {
              if (!existingUtxo.confirmed) {
                this.logUtxoFoundMessage(transaction.getId(), vout, output.value, confirmed);

                resolve(existingUtxo.update({
                  confirmed,
                }));
              }
            } else if (!existingUtxo) {
              this.logUtxoFoundMessage(transaction.getId(), vout, output.value, confirmed);

              resolve(this.utxoRepository.addUtxo({
                vout,
                confirmed,
                spent: false,
                value: output.value,
                currency: this.symbol,
                outputId: outputInfo.id,
                txId: transaction.getId(),
              }));
            }
          });

          if (confirmed) {
            await promise;
          } else {
            mempoolInsertPromises.set(transaction.getId(), promise);
          }
        }
      });
    };

    this.chainClient.on('transaction', async (transaction, confirmed) => {
      if (confirmed) {
        const mempoolInsertPromise = mempoolInsertPromises.get(transaction.getId());

        if (mempoolInsertPromise) {
          mempoolInsertPromises.delete(transaction.getId());
          await mempoolInsertPromise;
        }

        upsertUtxo(transaction, true);
      } else {
        upsertUtxo(transaction, false);
      }
    });

    this.chainClient.on('block', async (blockheight: number) => {
      await this.walletRepository.setBlockHeight(this.symbol, blockheight);
    });
  }

  /**
   * @param blockheight height of the last block that was scanned
   */
  public init = async (blockheight: number) => {
    const outputs = await this.outputRepository.getOutputs(this.symbol);

    const addresses: Buffer[] = [];

    outputs.forEach((output) => {
      addresses.push(getHexBuffer(output.script));

      this.outputIds.set(output.id, output.script);
      this.relevantOutputs.set(output.script, {
        id: output.id,
        keyIndex: output.keyIndex,
        type: output.type,
        redeemScript: output.redeemScript,
      });
    });

    this.chainClient.updateOutputFilter(addresses);

    await this.checkUnconfirmedFunds();

    // If the blockheight in the database is "0" a new wallet got created
    // and no blocks have to be rescanned
    if (blockheight !== 0) {
      await this.chainClient.rescanChain(blockheight);
    }

    const { blocks } = await this.chainClient.getBlockchainInfo();
    await this.walletRepository.setBlockHeight(this.symbol, blocks);
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
    this.walletRepository.setHighestUsedIndex(this.symbol, this.highestIndex);

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

    const encodeFunction = getPubkeyHashFunction(type);
    const output = encodeFunction(crypto.hash160(keys.publicKey));

    let outputScript: Buffer;

    // TODO: use undefined?
    // tslint:disable-next-line:no-null-keyword
    let redeemScript: string | null = null;

    if (type === OutputType.Compatibility) {
      const nestedOutput = output as { redeemScript: Buffer, outputScript: Buffer };

      outputScript = nestedOutput.outputScript;
      redeemScript = getHexString(nestedOutput.redeemScript);
    } else {
      outputScript = output as Buffer;
    }

    const address = this.encodeAddress(outputScript);
    this.logger.debug(`Generated new ${this.symbol} address: ${address}`);

    await this.listenToOutput(outputScript, index, type, redeemScript);

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

    utxos.forEach((utxo: Utxo) => {
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

  /**
   * Sends a specific amount of funds to an address
   *
   * @returns the transaction itself and the vout of the provided address
   */
  public sendToAddress = async (
    address: string,
    type: OutputType,
    isScriptHash: boolean,
    amount: number,
    satsPerByte?: number,
    sendAll?: boolean) => {

    return this.lock.acquire(this.sendToAddressLock, async () => {
      const utxos = await this.utxoRepository.getUtxosSorted(this.symbol);

      // The UTXOs that will be spent
      const toSpend: UTXO[] = [];

      const feePerByte = satsPerByte || await this.chainClient.estimateFee();

      const outputs: any[] = [{ type, isSh: isScriptHash }];

      // Add a change address to the estimation if not all coins will be sent
      if (!sendAll) {
        outputs.push({ type: OutputType.Bech32 });
      }

      const recalculateFee = () => {
        return estimateFee(feePerByte, toSpend, outputs);
      };

      let toSpendSum = 0;
      let fee = recalculateFee();

      const fundsSufficient = () => {
        return sendAll ? false : (amount + fee) <= toSpendSum;
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
          keys: this.getKeysByIndex(output.keyIndex),
          txHash: reverseBuffer(getHexBuffer(utxoInstance.txId)),
        });

        toSpendSum += utxoInstance.value;
        fee = recalculateFee();

        if (fundsSufficient()) {
          break;
        }
      }

      // Throw an error if the wallet doesn't have enough funds
      if (!fundsSufficient() && !sendAll) {
        throw Errors.NOT_ENOUGH_FUNDS(amount);
      }

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

      if (!sendAll) {
        // Add the requested ouput to the transaction
        builder.addOutput(address, amount);

        // Send the value left of the UTXOs to a new change address
        const changeAddress = await this.getNewAddress(OutputType.Bech32);
        builder.addOutput(changeAddress, toSpendSum - (amount + fee));
      } else {
        builder.addOutput(address, toSpendSum - fee);
      }

      // Sign the transaction
      toSpend.forEach((utxo, index) => {
        const keys = ECPair.fromPrivateKey(utxo.keys.privateKey!, { network: this.network });

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

      // Mark the UTXOs that were spent in the transaction
      for (const utxo of toSpend) {
        await this.utxoRepository.markUtxoSpent(utxo.id);
      }

      return {
        fee,
        vout: 0,
        transaction: builder.build(),
      };
    }).catch((error) => {
      this.logger.error(`Could not send ${sendAll ? 'all' : amount} ${this.symbol} to address ${address}: ${JSON.stringify(error)}`);
      throw error;
    });
  }

  /**
   * Checks if unconfirmed funds got confirmed since last startup
   */
  private checkUnconfirmedFunds = async () => {
    const utxos = await this.utxoRepository.getUnconfirmedUtxos(this.symbol);

    for (const utxo of utxos) {
      const transactionInfo = await this.chainClient.getRawTransactionVerbose(utxo.txId);

      if (transactionInfo.confirmations) {
        this.logUtxoFoundMessage(utxo.txId, utxo.vout, utxo.value, true);

        utxo.set('confirmed', true);
        await utxo.save();
      } else {
        this.chainClient.zmqClient.utxos.add(utxo.txId);
      }
    }
  }

  private listenToOutput = async (script: Buffer, keyIndex: number, type: OutputType, redeemScript: string | null) => {
    const scriptString = getHexString(script);

    this.chainClient.updateOutputFilter([script]);

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

  private logUtxoFoundMessage = (transactionId: string, vout: number, value: number, confirmed: boolean) => {
    const message = `Found UTXO of ${this.symbol} wallet ${confirmed ? 'in a block' : 'in mempool'}:` +
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
