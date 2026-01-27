import Logger from '../../../lib/Logger';
import { sleep } from '../../../lib/PromiseUtils';
import ElementsWrapper from '../../../lib/chain/ElementsWrapper';
import { CurrencyType } from '../../../lib/consts/Enums';
import type Sidecar from '../../../lib/sidecar/Sidecar';
import { elementsConfig } from '../Nodes';

jest.mock('../../../lib/db/repositories/ChainTipRepository');

const mockSidecar = {
  on: jest.fn(),
} as unknown as Sidecar;

describe('ElementsWrapper', () => {
  const wrapper = new ElementsWrapper(
    Logger.disabledLogger,
    mockSidecar,
    'liquidRegtest',
    {
      ...elementsConfig,
      lowball: elementsConfig,
    },
  );

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
        mockSidecar,
        'liquidRegtest',
        elementsConfig,
      );

      expect(oneWrapper['clients']).toHaveLength(1);
      expect(oneWrapper['publicClient']()).not.toBeUndefined();
      expect(oneWrapper['walletClient']()).not.toBeUndefined();
      expect(oneWrapper['lowballClient']()).toBeUndefined();
    });
  });

  test('should send transaction to public client when lowball client is used', async () => {
    const mockSendRawTransaction = jest.fn();
    wrapper['publicClient']()['sendRawTransaction'] = mockSendRawTransaction;

    const txId = await wrapper.sendToAddress(
      await wrapper.getNewAddress(''),
      10_000,
      undefined,
      undefined,
      '',
    );
    await sleep(250);

    expect(mockSendRawTransaction).toHaveBeenCalledTimes(1);
    expect(mockSendRawTransaction).toHaveBeenCalledWith(
      await wrapper.getRawTransaction(txId),
    );
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
        mockSidecar,
        'liquidRegtest',
        elementsConfig,
      );
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
