import { Transaction, crypto } from 'bitcoinjs-lib';
import { OutputType } from 'boltz-core';
import { randomBytes } from 'crypto';
import type { Socket } from 'zeromq/v5-compat';
import { socket as openSocket } from 'zeromq/v5-compat';
import Logger from '../../../lib/Logger';
import { getHexString, reverseBuffer } from '../../../lib/Utils';
import type ChainClient from '../../../lib/chain/ChainClient';
import Errors from '../../../lib/chain/Errors';
import type { ZmqNotification } from '../../../lib/chain/ZmqClient';
import ZmqClient, { filters } from '../../../lib/chain/ZmqClient';
import { CurrencyType } from '../../../lib/consts/Enums';
import {
  generateAddress,
  getPort,
  wait,
  waitForFunctionToBeTrue,
} from '../../Utils';
import FakedChainClient from './FakeChainClient';

class ZmqPublisher {
  public address: string;

  private socket: Socket;
  private readonly filter: string;

  constructor(port: number, filter: string) {
    this.address = `tcp://127.0.0.1:${port}`;
    this.filter = filter.replace('pub', '');

    this.socket = openSocket('pub');
  }

  public bind = () =>
    new Promise((resolve) => {
      this.socket.bind(this.address, resolve);
    });

  public close = () => {
    this.socket.close();
  };

  public sendMessage = (message: Buffer) => {
    this.socket.send([this.filter, message]);
  };
}

describe('ZmqClient', () => {
  const blocksToGenerate = 10;
  const chainClient = new FakedChainClient();

  // ZMQ publisher
  let rawTx: ZmqPublisher;

  let rawBlock: ZmqPublisher;
  let hashBlock: ZmqPublisher;

  const sendHashBlock = (height?: number, orphan = false) => {
    const { hash } = chainClient.generateBlock(height, orphan);
    hashBlock.sendMessage(reverseBuffer(hash));
  };

  // Variables and functions related to transactions
  const { outputScript } = generateAddress(OutputType.Bech32);

  const generateTransaction = (confirmed: boolean): Transaction => {
    const transaction = new Transaction();

    transaction.addOutput(outputScript, 1);
    transaction.addInput(crypto.hash256(randomBytes(32)), 0);

    chainClient.sendRawTransaction(transaction);

    if (confirmed) {
      chainClient.generateBlock();
    }

    return transaction;
  };

  const zmqClient = new ZmqClient(
    'BTC',
    Logger.disabledLogger,
    chainClient as unknown as ChainClient,
    '127.0.0.1',
  );

  beforeAll(async () => {
    rawTx = new ZmqPublisher(await getPort(), filters.rawTx);

    rawBlock = new ZmqPublisher(await getPort(), filters.rawBlock);
    hashBlock = new ZmqPublisher(await getPort(), filters.hashBlock);

    await Promise.all(
      [rawTx, rawBlock, hashBlock].map((socket) => socket.bind()),
    );
  });

  afterAll(async () => {
    zmqClient.close();

    rawTx.close();
    hashBlock.close();
  });

  test('should not init without needed subscriptions', async () => {
    const rejectZmqClient = new ZmqClient(
      'BTC',
      Logger.disabledLogger,
      chainClient as unknown as ChainClient,
      '127.0.0.1',
    );
    const notifications: ZmqNotification[] = [];

    await expect(
      rejectZmqClient.init(CurrencyType.BitcoinLike, notifications),
    ).rejects.toEqual(Errors.NO_RAWTX());
    rejectZmqClient.close();

    notifications.push({
      type: filters.rawTx,
      address: rawTx.address,
    });

    await expect(
      rejectZmqClient.init(CurrencyType.BitcoinLike, notifications),
    ).rejects.toEqual(Errors.NO_BLOCK_NOTIFICATIONS());
    rejectZmqClient.close();
  });

  test('should init', async () => {
    const notifications: ZmqNotification[] = [
      {
        type: filters.rawTx,
        address: rawTx.address,
      },
      {
        type: filters.rawBlock,
        address: rawBlock.address,
      },
      {
        type: filters.hashBlock,
        address: hashBlock.address,
      },
    ];

    await zmqClient.init(CurrencyType.BitcoinLike, notifications);

    zmqClient.relevantOutputs.add(getHexString(outputScript));
  });

  test('should rescan blocks', async () => {
    // Setup some data for the rescan test
    for (let i = 0; i < blocksToGenerate; i += 1) {
      for (let tx = 0; tx < blocksToGenerate; tx += 1) {
        generateTransaction(false);
      }
      chainClient.generateBlock();
    }

    zmqClient['blockHeight'] = chainClient.bestBlockHeight;

    let transactionsFound = 0;

    zmqClient.on('transaction', ({ confirmed }) => {
      if (confirmed) {
        transactionsFound += 1;
      }
    });

    await zmqClient.rescanChain(0);

    await wait(1000);

    await waitForFunctionToBeTrue(() => {
      return transactionsFound === blocksToGenerate * blocksToGenerate;
    });
  });

  test('should fallback to compatibility rescan', async () => {
    chainClient.disableGetBlockVerbose = true;

    let transactionsFound = 0;

    zmqClient.on('transaction', ({ confirmed }) => {
      if (confirmed) {
        transactionsFound += 1;
      }
    });

    await zmqClient.rescanChain(0);

    await wait(1000);

    await waitForFunctionToBeTrue(() => {
      return transactionsFound === blocksToGenerate * blocksToGenerate;
    });

    chainClient.disableGetBlockVerbose = false;
  });

  test('should handle raw transactions', async () => {
    let blockAcceptance = false;
    let mempoolAcceptance = false;

    zmqClient.on('transaction', ({ confirmed }) => {
      if (confirmed) {
        blockAcceptance = true;
      } else {
        mempoolAcceptance = true;
      }
    });

    // Flow of a transaction that gets added to the mempool and afterwards included in a block
    const mempoolTransaction = generateTransaction(false);

    rawTx.sendMessage(mempoolTransaction.toBuffer());

    await waitForFunctionToBeTrue(() => {
      return mempoolAcceptance;
    });

    await waitForFunctionToBeTrue(() => {
      return !blockAcceptance;
    });

    expect(zmqClient.utxos.has(mempoolTransaction.getId())).toBeTruthy();

    rawTx.sendMessage(mempoolTransaction.toBuffer());

    await waitForFunctionToBeTrue(() => {
      return blockAcceptance;
    });

    expect(zmqClient.utxos.has(mempoolTransaction.getId())).toBeFalsy();

    blockAcceptance = false;

    // Flow of a transaction that is added to a block directly
    const blockTransaction = generateTransaction(true);

    rawTx.sendMessage(blockTransaction.toBuffer());

    await waitForFunctionToBeTrue(() => {
      return blockAcceptance;
    });
  });

  test('should handle rawblock notifications', async () => {
    let blockHeight = 0;

    zmqClient.on('block', (height) => {
      blockHeight = height;
    });

    for (let i = 0; i < blocksToGenerate; i += 1) {
      const { block } = chainClient.generateBlock();
      rawBlock.sendMessage(block);
    }

    await waitForFunctionToBeTrue(() => {
      return blockHeight === chainClient.bestBlockHeight;
    });

    // Generate an orphan and make sure that the blockHeight did not increase
    const { block } = chainClient.generateBlock(1, true);
    rawBlock.sendMessage(block);

    await wait(10);

    expect(blockHeight).toEqual(chainClient.bestBlockHeight);
  });

  test('should handle rawblock reorganizations', async () => {
    let blockHeight = chainClient.bestBlockHeight;

    zmqClient.on('block', (height) => {
      expect(height).toEqual(blockHeight + 1);
      blockHeight = height;
    });

    const reorgHeight = chainClient.bestBlockHeight - 5;
    for (let i = 0; i <= blocksToGenerate; i += 1) {
      const { block } = chainClient.generateBlock(reorgHeight + i);
      rawBlock.sendMessage(block);
    }

    await waitForFunctionToBeTrue(() => {
      return blockHeight === chainClient.bestBlockHeight;
    });

    expect(blockHeight).toEqual(reorgHeight + blocksToGenerate);
  });

  test('should fallback to hashblock notifications', async () => {
    rawBlock.close();

    // Wait until there are three sockets in the ZmqClient which
    // means that the client connected to the hashblock fallback
    await waitForFunctionToBeTrue(() => {
      return zmqClient['sockets'].length === 3;
    });

    // Wait a little longer to make sure the socket is connected
    await wait(10);
  });

  test('should handle hashblock notifications', async () => {
    let blockHeight = 0;

    zmqClient.on('block', (height) => {
      blockHeight = height;
    });

    for (let i = 0; i < blocksToGenerate; i += 1) {
      sendHashBlock();
    }

    await waitForFunctionToBeTrue(() => {
      return blockHeight === chainClient.bestBlockHeight;
    });

    // Generate an orphan and make sure that the blockHeight did not increase
    sendHashBlock(1, true);

    await wait(10);

    expect(blockHeight).toEqual(chainClient.bestBlockHeight);
  });

  test('should handle hashblock reorganizations', async () => {
    let blockHeight = chainClient.bestBlockHeight;

    zmqClient.on('block', (height) => {
      expect(height).toEqual(blockHeight + 1);
      blockHeight = height;
    });

    const reorgHeight = chainClient.bestBlockHeight - 5;
    for (let i = 0; i <= blocksToGenerate; i += 1) {
      sendHashBlock(reorgHeight + i);
    }

    await waitForFunctionToBeTrue(() => {
      return blockHeight === chainClient.bestBlockHeight;
    });

    expect(blockHeight).toEqual(reorgHeight + blocksToGenerate);
  });

  test('should reject connecting to addresses that are not ZMQ publishers', async () => {
    expect(ZmqClient['connectTimeout']).toEqual(1000);
    const createSocket = zmqClient['createSocket'];

    const filter = 'filter';

    expect(zmqClient['sockets'].length).toEqual(3);

    const invalidAddress = `tcp://127.0.0.1:${await getPort()}`;
    await expect(createSocket(invalidAddress, filter)).rejects.toEqual(
      Errors.ZMQ_CONNECTION_TIMEOUT(
        zmqClient['symbol'],
        filter,
        invalidAddress,
      ),
    );

    expect(zmqClient['sockets'].length).toEqual(3);
    zmqClient.close();
  });

  test('should sanitize ZMQ addresses', async () => {
    const zmqClient = new ZmqClient(
      'BTC',
      Logger.disabledLogger,
      chainClient as unknown as ChainClient,
      '127.0.0.1',
    );

    const address = `tcp://0.0.0.0:${await getPort()}`;
    const filterName = 'name';

    await expect(
      zmqClient['createSocket'](address, filterName),
    ).rejects.toEqual(
      Errors.ZMQ_CONNECTION_TIMEOUT(
        'BTC',
        filterName,
        address.replace('0.0.0.0', '127.0.0.1'),
      ),
    );

    zmqClient.close();
  });

  test.each`
    address                   | sanitized
    ${'tcp://127.0.0.1:1234'} | ${'tcp://127.0.0.1:1234'}
    ${'tcp://bitcoind:3000'}  | ${'tcp://bitcoind:3000'}
    ${'tcp://0.0.0.0:4321'}   | ${'tcp://127.0.0.1:4321'}
  `(
    'should sanitize address $address to $sanitized',
    ({ address, sanitized }) => {
      const zmqClient = new ZmqClient(
        'BTC',
        Logger.disabledLogger,
        chainClient as unknown as ChainClient,
        '127.0.0.1',
      );

      expect(zmqClient['replaceZmqAddressWildcard'](address)).toEqual(
        sanitized,
      );
    },
  );
});
