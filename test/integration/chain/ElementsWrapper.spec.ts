import { Transaction } from 'liquidjs-lib';
import Logger from '../../../lib/Logger';
import { sleep } from '../../../lib/PromiseUtils';
import ElementsWrapper from '../../../lib/chain/ElementsWrapper';
import { ClientStatus, CurrencyType } from '../../../lib/consts/Enums';
import { elementsConfig } from '../Nodes';

jest.mock('../../../lib/db/repositories/ChainTipRepository');

describe('ElementsWrapper', () => {
  const wrapper = new ElementsWrapper(Logger.disabledLogger, {
    ...elementsConfig,
    lowball: elementsConfig,
  });

  beforeAll(async () => {
    await wrapper.connect();

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    wrapper['zeroConfCheck'] = {
      name: 'test',
      checkTransaction: jest.fn().mockResolvedValue(true),
      init: jest.fn().mockImplementation(() => Promise.resolve()),
    };
  });

  beforeEach(() => {
    wrapper.removeAllListeners();
    jest.clearAllMocks();
  });

  afterAll(() => {
    wrapper.disconnect();
  });

  test('should have currencyType', () => {
    expect(wrapper.currencyType).toEqual(CurrencyType.Liquid);
  });

  test('should have symbol', () => {
    expect(wrapper.symbol).toEqual('L-BTC');
  });

  test('should have serviceName', () => {
    expect(wrapper.serviceName()).toEqual('ElementsWrapper');
  });

  describe('constructor', () => {
    test('should construct with lowball node', () => {
      expect(wrapper['clients']).toHaveLength(2);
      expect(wrapper['publicClient']()).not.toBeUndefined();
      expect(wrapper['walletClient']()).not.toBeUndefined();
      expect(wrapper['lowballClient']()).not.toBeUndefined();
    });

    test('should construct with just public node', () => {
      const oneWrapper = new ElementsWrapper(
        Logger.disabledLogger,
        elementsConfig,
      );

      expect(oneWrapper['clients']).toHaveLength(1);
      expect(oneWrapper['publicClient']()).not.toBeUndefined();
      expect(oneWrapper['walletClient']()).not.toBeUndefined();
      expect(oneWrapper['lowballClient']()).toBeUndefined();
    });
  });

  test('should bubble up status change of public client', () => {
    expect.assertions(1);

    const newStatus = ClientStatus.Connected;

    wrapper.on('status.changed', (status) => {
      expect(status).toEqual(newStatus);
    });
    wrapper['publicClient']()['setClientStatus'](newStatus);
  });

  test('should emit on block', async () => {
    const blockPromise = new Promise<void>((resolve) => {
      wrapper.on('block', async (height) => {
        expect(height).toEqual((await wrapper.getBlockchainInfo()).blocks);
        resolve();
      });
    });

    await wrapper['clients'][0].generate(1);
    await blockPromise;
  });

  describe('transaction emitter', () => {
    const testTx = 'i am a real tx' as unknown as Transaction;

    test('should emit confirmed transactions from public client', async () => {
      expect.assertions(2);

      wrapper.on('transaction', ({ transaction, confirmed }) => {
        expect(transaction).toEqual(testTx);
        expect(confirmed).toEqual(true);
      });

      wrapper['publicClient']()['emit']('transaction', {
        transaction: testTx,
        confirmed: true,
      });
      wrapper['lowballClient']()!['emit']('transaction', {
        transaction: testTx,
        confirmed: true,
      });
    });

    test('should emit unconfirmed transactions from lowball client', async () => {
      expect.assertions(2);

      const tx = Transaction.fromHex(
        await wrapper.getRawTransaction(
          await wrapper.sendToAddress(
            await wrapper.getNewAddress(''),
            100_000,
            undefined,
            undefined,
            '',
          ),
        ),
      );

      wrapper.on('transaction', ({ transaction, confirmed }) => {
        expect(transaction).toEqual(tx);
        expect(confirmed).toEqual(false);
      });

      wrapper['publicClient']()['emit']('transaction', {
        transaction: tx,
        confirmed: false,
      });
      wrapper['lowballClient']()!['emit']('transaction', {
        transaction: tx,
        confirmed: false,
      });

      await sleep(wrapper['zeroConfCheckTime'] * 2);
    });

    test('should emit confirmed and unconfirmed transaction from public node if no lowball client is configued', async () => {
      const oneWrapper = new ElementsWrapper(
        Logger.disabledLogger,
        elementsConfig,
      );
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-expect-error
      oneWrapper['zeroConfCheck'] = {
        name: 'stub',
        checkTransaction: jest.fn().mockResolvedValue(true),
        init: jest.fn().mockImplementation(() => Promise.resolve()),
      };

      await oneWrapper.connect();

      expect.assertions(2);

      oneWrapper.on('transaction', ({ transaction }) => {
        expect(transaction).toEqual(testTx);
      });

      oneWrapper['publicClient']()['emit']('transaction', {
        transaction: testTx,
        confirmed: true,
      });
      oneWrapper['publicClient']()['emit']('transaction', {
        transaction: testTx,
        confirmed: false,
      });

      oneWrapper.disconnect();
    });
  });

  test.each`
    name
    ${'rescanChain'}
  `('should call $name only with public client', async ({ name }) => {
    const mockFnPublic = jest.fn();
    const mockFnLowball = jest.fn();
    wrapper['publicClient']()[name] = mockFnPublic;
    wrapper['lowballClient']()![name] = mockFnLowball;

    const param = 123;
    await wrapper[name](param);

    expect(mockFnPublic).toHaveBeenCalledTimes(1);
    expect(mockFnPublic).toHaveBeenCalledWith(param);
    expect(mockFnLowball).not.toHaveBeenCalled();
  });

  test('should call checkTransaction with all clients', async () => {
    const mockFnPublic = jest.fn();
    const mockFnLowball = jest.fn();
    wrapper['publicClient']()['checkTransaction'] = mockFnPublic;
    wrapper['lowballClient']()!['checkTransaction'] = mockFnLowball;

    const transactionId = 'testTxId';
    await wrapper.checkTransaction(transactionId);

    expect(mockFnPublic).toHaveBeenCalledTimes(1);
    expect(mockFnPublic).toHaveBeenCalledWith(transactionId);
    expect(mockFnLowball).toHaveBeenCalledTimes(1);
    expect(mockFnLowball).toHaveBeenCalledWith(transactionId);
  });

  describe('sendRawTransaction', () => {
    test('should broadcast swap related transactions with all clients', async () => {
      const mockFnPublic = jest.fn();
      const mockFnLowball = jest.fn();
      wrapper['publicClient']()['sendRawTransaction'] = mockFnPublic;
      wrapper['lowballClient']()!['sendRawTransaction'] = mockFnLowball;

      const param = 'testTx';
      await wrapper.sendRawTransaction(param, true);

      expect(mockFnPublic).toHaveBeenCalledTimes(1);
      expect(mockFnPublic).toHaveBeenCalledWith(param);
      expect(mockFnLowball).toHaveBeenCalledTimes(1);
      expect(mockFnLowball).toHaveBeenCalledWith(param);
    });

    test('should not throw when public broadcast of swap related transactions fails', async () => {
      const txId = 'testId';

      const mockFnPublic = jest.fn().mockRejectedValue('not feeling like it');
      const mockFnLowball = jest.fn().mockResolvedValue(txId);
      wrapper['publicClient']()['sendRawTransaction'] = mockFnPublic;
      wrapper['lowballClient']()!['sendRawTransaction'] = mockFnLowball;

      const param = 'testTx';
      await expect(wrapper.sendRawTransaction(param, true)).resolves.toEqual(
        txId,
      );

      expect(mockFnPublic).toHaveBeenCalledTimes(1);
      expect(mockFnPublic).toHaveBeenCalledWith(param);
      expect(mockFnLowball).toHaveBeenCalledTimes(1);
      expect(mockFnLowball).toHaveBeenCalledWith(param);
    });

    test('should broadcast non swap related transactions only with public client', async () => {
      const mockFnPublic = jest.fn();
      const mockFnLowball = jest.fn();
      wrapper['publicClient']()['sendRawTransaction'] = mockFnPublic;
      wrapper['lowballClient']()!['sendRawTransaction'] = mockFnLowball;

      const param = 'testTx';
      await wrapper.sendRawTransaction(param, false);

      expect(mockFnPublic).toHaveBeenCalledTimes(1);
      expect(mockFnPublic).toHaveBeenCalledWith(param);
      expect(mockFnLowball).not.toHaveBeenCalled();
    });
  });

  test.each`
    name
    ${'addInputFilter'}
    ${'addOutputFilter'}
    ${'removeOutputFilter'}
    ${'removeInputFilter'}
  `('should call $name on both clients', ({ name }) => {
    const mockFnPublic = jest.fn();
    const mockFnLowball = jest.fn();
    wrapper['publicClient']()[name] = mockFnPublic;
    wrapper['lowballClient']()![name] = mockFnLowball;

    const param = 'data';
    wrapper[name](param);

    expect(mockFnPublic).toHaveBeenCalledTimes(1);
    expect(mockFnPublic).toHaveBeenCalledTimes(1);
    expect(mockFnLowball).toHaveBeenCalledTimes(1);
    expect(mockFnLowball).toHaveBeenCalledWith(param);
  });

  test.each`
    name
    ${'getNetworkInfo'}
    ${'getBlockchainInfo'}
  `('should annotate lowball info for $name', async ({ name }) => {
    const res = await wrapper[name]();

    const realRes = await wrapper['clients'][0][name]();
    expect(res).toEqual({
      ...realRes,
      lowball: realRes,
    });
  });

  test.each`
    name
    ${'getNetworkInfo'}
    ${'getBlockchainInfo'}
  `(
    'should not annotate lowball info for $name when lowball is not configured',
    async ({ name }) => {
      const oneWrapper = new ElementsWrapper(
        Logger.disabledLogger,
        elementsConfig,
      );
      await oneWrapper.connect();

      const res = await oneWrapper[name]();

      expect(res).toEqual({
        ...(await wrapper['clients'][0][name]()),
        lowball: undefined,
      });

      oneWrapper.disconnect();
    },
  );

  describe.each`
    name
    ${'getRawTransaction'}
    ${'getRawTransactionVerbose'}
  `('allSettled handling of $name', ({ name }) => {
    test('should call both clients', async () => {
      const mockFnPublic = jest.fn().mockResolvedValue(1);
      const mockFnLowball = jest.fn().mockResolvedValue(2);
      wrapper['publicClient']()[name] = mockFnPublic;
      wrapper['lowballClient']()![name] = mockFnLowball;

      await expect(wrapper[name]()).resolves.toEqual(1);

      expect(mockFnPublic).toHaveBeenCalledTimes(1);
      expect(mockFnLowball).toHaveBeenCalledTimes(1);
    });

    test('should return when one client throws', async () => {
      const mockFnPublic = jest.fn().mockRejectedValue('no go');
      const mockFnLowball = jest.fn().mockResolvedValue(1);
      wrapper['publicClient']()[name] = mockFnPublic;
      wrapper['lowballClient']()![name] = mockFnLowball;

      await expect(wrapper[name]()).resolves.toEqual(1);

      expect(mockFnPublic).toHaveBeenCalledTimes(1);
      expect(mockFnLowball).toHaveBeenCalledTimes(1);
    });

    test('should throw when both clients throw', async () => {
      const mockFnPublic = jest.fn().mockRejectedValue('no go');
      const mockFnLowball = jest.fn().mockRejectedValue('still not');
      wrapper['publicClient']()[name] = mockFnPublic;
      wrapper['lowballClient']()![name] = mockFnLowball;

      await expect(wrapper[name]()).rejects.toEqual('no go');
    });
  });

  test.each`
    name
    ${'listUnspent'}
    ${'getAddressInfo'}
    ${'getBalances'}
    ${'getNewAddress'}
    ${'dumpBlindingKey'}
    ${'sendToAddress'}
  `('should use wallet client for $name', async ({ name }) => {
    const res = 'data';

    wrapper['walletClient']()[name] = jest.fn().mockResolvedValue(res);

    await expect(wrapper[name]()).resolves.toEqual(res);
  });

  test('should prefer lowball over public client for wallet', () => {
    expect(wrapper['walletClient']().isLowball).toEqual(true);
  });
});
