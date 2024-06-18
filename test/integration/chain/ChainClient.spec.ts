import { OutputType } from 'boltz-core';
import { getHexBuffer, reverseBuffer } from '../../../lib/Utils';
import ChainTipRepository from '../../../lib/db/repositories/ChainTipRepository';
import { generateAddress, wait, waitForFunctionToBeTrue } from '../../Utils';
import { bitcoinClient } from '../Nodes';

const mockFindOrCreateTip = jest.fn().mockImplementation(async () => {
  return {};
});
const mockUpdateTip = jest.fn().mockImplementation();

jest.mock('../../../lib/db/repositories/ChainTipRepository');

describe('ChainClient', () => {
  const numTransactions = 15;

  let transactionWithRelevantInput = '';

  const testData = {
    inputs: [] as Buffer[],
    outputScripts: [] as Buffer[],

    addresses: [] as string[],
  };

  beforeEach(() => {
    jest.clearAllMocks();

    ChainTipRepository.updateTip = mockUpdateTip;
    ChainTipRepository.findOrCreateTip = mockFindOrCreateTip;
  });

  afterAll(async () => {
    bitcoinClient.disconnect();
  });

  test('should init', async () => {
    await bitcoinClient.connect();
    await bitcoinClient.generate(1);
  });

  test('should add to the output filer', () => {
    for (let i = 0; i < numTransactions; i += 1) {
      const { outputScript, address } = generateAddress(OutputType.Bech32);

      testData.outputScripts.push(outputScript);
      testData.addresses.push(address);

      bitcoinClient.addOutputFilter(outputScript);
    }

    expect(bitcoinClient['zmqClient'].relevantOutputs.size).toEqual(
      numTransactions,
    );
  });

  test('should emit an event on mempool acceptance of relevant output', async () => {
    let mempoolTransactions = 0;

    bitcoinClient.on('transaction', ({ confirmed }) => {
      if (!confirmed) {
        mempoolTransactions += 1;
      }
    });

    for (const address of testData.addresses) {
      await bitcoinClient.sendToAddress(address, 1000, undefined, false, '');
    }

    await waitForFunctionToBeTrue(() => {
      return mempoolTransactions === numTransactions;
    });
  });

  test('should emit an event on block acceptance of relevant output', async () => {
    let blockTransactions = 0;

    bitcoinClient.on('transaction', async ({ confirmed }) => {
      if (confirmed) {
        blockTransactions += 1;
      }
    });

    await bitcoinClient.generate(1);

    await waitForFunctionToBeTrue(() => {
      return blockTransactions === numTransactions;
    });
  });

  test('should add to the input filer', async () => {
    const unspentUtxos = await bitcoinClient.listUnspent();

    for (const utxo of unspentUtxos) {
      const input = reverseBuffer(getHexBuffer(utxo.txid));

      testData.inputs.push(input);
      bitcoinClient.addInputFilter(input);
    }

    expect(bitcoinClient['zmqClient'].relevantInputs.size).toEqual(
      // In case the wallet has multiple outputs from the same transaction
      new Set<string>(unspentUtxos.map((utxo) => utxo.txid)).size,
    );
  });

  test('should emit an event on mempool acceptance of relevant inputs', async () => {
    let event = false;

    bitcoinClient.on('transaction', ({ transaction, confirmed }) => {
      if (!confirmed && !event) {
        transaction.ins.forEach((input) => {
          let hasRelevantInput = false;

          // "testData.inputs.includes(input.hash)" does not work; therefore this loop is needed
          for (const relevantInput of testData.inputs) {
            if (input.hash.equals(relevantInput)) {
              hasRelevantInput = true;
            }
          }

          expect(hasRelevantInput).toBeTruthy();

          transactionWithRelevantInput = transaction.getId();
        });

        event = true;
      }
    });

    const { address } = generateAddress(OutputType.Bech32);
    await bitcoinClient.sendToAddress(address, 1000, undefined, false, '');

    await waitForFunctionToBeTrue(() => {
      return event;
    });
  });

  test('should emit an event on block acceptance of relevant inputs', async () => {
    let event = false;

    bitcoinClient.on('transaction', ({ transaction, confirmed }) => {
      if (confirmed) {
        if (transaction.getId() === transactionWithRelevantInput) {
          event = true;
        }
      }
    });

    await bitcoinClient.generate(1);

    await waitForFunctionToBeTrue(() => {
      return event;
    });
  });

  test('should remove from the output filter', () => {
    testData.outputScripts.forEach((output) => {
      bitcoinClient.removeOutputFilter(output);
    });

    expect(bitcoinClient['zmqClient'].relevantOutputs.size).toEqual(0);
  });

  test('should remove from the input filter', () => {
    testData.inputs.forEach((input) => {
      bitcoinClient.removeInputFilter(input);
    });

    expect(bitcoinClient['zmqClient'].relevantInputs.size).toEqual(0);
  });

  test('should emit an event when a block gets mined', async () => {
    const generated = numTransactions;

    let blocks = 0;
    let bestBlockHeight = 0;

    bitcoinClient.on('block', (height: number) => {
      blocks += 1;
      bestBlockHeight = height;
    });

    await bitcoinClient.generate(generated);

    await waitForFunctionToBeTrue(() => {
      return blocks === generated;
    });

    const blockchainInfo = await bitcoinClient.getBlockchainInfo();
    await wait(250);

    expect(bestBlockHeight).toEqual(blockchainInfo.blocks);
  });

  test('should update the chain tip in the database after a block gets mined', async () => {
    let blockEmitted = false;

    bitcoinClient.on('block', (height: number) => {
      expect(mockUpdateTip).toHaveBeenCalledTimes(1);
      expect(mockUpdateTip).toHaveBeenCalledWith(expect.anything(), height);

      blockEmitted = true;
    });

    await bitcoinClient.generate(1);

    await waitForFunctionToBeTrue(() => {
      return blockEmitted;
    });
  });

  test('should format getTransaction errors', async () => {
    const txId =
      '277014b6ff0b872dbd6dbfe506b1bfc7b5467a4096a0a27a06b0924423541e33';
    const expectedError = `No such mempool or blockchain transaction. Use gettransaction for wallet transactions. ID: ${txId}`;

    await expect(bitcoinClient.getRawTransaction(txId)).rejects.toEqual(
      expectedError,
    );
    await expect(bitcoinClient.getRawTransactionVerbose(txId)).rejects.toEqual(
      expectedError,
    );
  });

  describe('getNewAddress', () => {
    test('should add label', async () => {
      const label = 'data';
      const address = await bitcoinClient.getNewAddress(label);
      const { labels } = await bitcoinClient.getAddressInfo(address);
      expect(labels).toEqual([label]);
    });
  });

  describe('sendToAddress', () => {
    test('should add label', async () => {
      const label = 'data';
      const transactionId = await bitcoinClient.sendToAddress(
        await bitcoinClient.getNewAddress(''),
        100_000,
        undefined,
        false,
        label,
      );
      const { comment } =
        await bitcoinClient.getWalletTransaction(transactionId);
      expect(comment).toEqual(label);
    });
  });
});
