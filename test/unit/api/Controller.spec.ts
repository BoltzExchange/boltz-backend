import Logger from '../../../lib/Logger';
import { getHexBuffer, getVersion, mapToObject } from '../../../lib/Utils';
import Bouncer from '../../../lib/api/Bouncer';
import Controller from '../../../lib/api/Controller';
import SwapInfos from '../../../lib/api/SwapInfos';
import { SwapUpdateEvent, SwapVersion } from '../../../lib/consts/Enums';
import ReferralStats from '../../../lib/data/ReferralStats';
import type Swap from '../../../lib/db/models/Swap';
import MarkedSwapRepository from '../../../lib/db/repositories/MarkedSwapRepository';
import Service from '../../../lib/service/Service';
import { mockRequest, mockResponse } from './Utils';

const swap: Swap = {
  id: 'status',
  status: SwapUpdateEvent.InvoicePaid,
} as any as Swap;

const mockGetPairs = jest.fn().mockReturnValue({
  warnings: [],
  pairs: [],
});

const getNodes = new Map<
  string,
  Map<
    string,
    {
      nodeKey: string;
      uris: string[];
    }
  >
>([
  [
    'BTC',
    new Map<string, { nodeKey: string; uris: string[] }>([
      [
        'LND',
        {
          nodeKey: '321',
          uris: ['321@127.0.0.1:9735'],
        },
      ],
    ]),
  ],
]);
const mockGetNodes = jest.fn().mockReturnValue(getNodes);

const timeouts = new Map<
  string,
  {
    base: number;
    quote: number;
  }
>([
  [
    'BTC/BTC',
    {
      base: 12,
      quote: 123,
    },
  ],
]);
const mockGetTimeouts = jest.fn().mockReturnValue(timeouts);

const getContracts: Record<string, any> = {
  ethereum: {
    network: {
      some: 'networkData',
    },
    swapContracts: new Map<string, string>([
      ['EtherSwap', '0x18A4374d714762FA7DE346E997f7e28Fb3744EC1'],
      ['ERC20Swap', '0xC685b2c4369D7bf9242DA54E9c391948079d83Cd'],
    ]),
    tokens: new Map<string, string>([
      ['USDT', '0xDf567Cd5d0cf3d90cE6E3E9F897e092f9ECE359a'],
    ]),
  },
};
const mockGetContracts = jest.fn().mockImplementation(async () => getContracts);

const mockGetRoutingHintsResult = [
  {
    just: 'some',
  },
  {
    test: 'data',
  },
];
const mockGetRoutingHints = jest
  .fn()
  .mockReturnValue(mockGetRoutingHintsResult);

const mockGetFeeEstimation = jest
  .fn()
  .mockResolvedValue(new Map<string, number>([['BTC', 1]]));

const mockSetInvoice = jest.fn().mockResolvedValue({
  set: 'invoice',
});

const mockedSwapRates = {
  onchainAmount: 123123,
  submarineSwap: {
    invoiceAmount: 123000,
  },
};
const mockGetSwapRates = jest.fn().mockResolvedValue(mockedSwapRates);

const rawTransaction = 'transactionHex';
const mockGetTransaction = jest.fn().mockResolvedValue({ hex: rawTransaction });

const swapTransaction = {
  timeoutEta: 1586291268,
  timeoutBlockHeight: 321,
  transactionHex: rawTransaction,
};
const mockGetSubmarineTransaction = jest
  .fn()
  .mockResolvedValue(swapTransaction);

const mockBroadcastTransaction = jest.fn().mockResolvedValue('transactionId');

const mockCreateSwap = jest.fn().mockResolvedValue({
  swap: 'created',
});
const mockCreateSwapWithInvoice = jest.fn().mockResolvedValue({
  swap: 'createdWithInvoice',
});

const mockCreateReverseSwap = jest.fn().mockResolvedValue({
  reverseSwap: 'created',
});

jest.mock('../../../lib/service/Service', () => {
  return jest.fn().mockImplementation(() => {
    return {
      sidecar: {
        isMarked: jest.fn().mockResolvedValue(true),
      },

      transactionFetcher: {
        getSubmarineTransaction: mockGetSubmarineTransaction,
      },

      getPairs: mockGetPairs,
      getNodes: mockGetNodes,
      getTimeouts: mockGetTimeouts,
      getContracts: mockGetContracts,
      getRoutingHints: mockGetRoutingHints,
      getFeeEstimation: mockGetFeeEstimation,

      setInvoice: mockSetInvoice,
      getSwapRates: mockGetSwapRates,
      getTransaction: mockGetTransaction,
      broadcastTransaction: mockBroadcastTransaction,

      createSwap: mockCreateSwap,
      createSwapWithInvoice: mockCreateSwapWithInvoice,

      createReverseSwap: mockCreateReverseSwap,
    };
  });
});

const mockedService = <jest.Mock<Service>>(<any>Service);

jest.mock('../../../lib/api/SwapInfos', () => {
  return jest.fn().mockImplementation(() => {
    return {
      get: jest.fn().mockImplementation(async (id: string) => {
        if (swap.id === id) {
          return {
            status: swap.status,
          };
        }

        return undefined;
      }),
    };
  });
});

const mockedSwapInfos = <jest.Mock<SwapInfos>>(<any>SwapInfos);

let mockValidateRequestAuthenticationResult: any = null;
const mockValidateRequestAuthentication = jest.fn().mockImplementation(() => {
  if (mockValidateRequestAuthenticationResult === null) {
    throw 'unauthorized';
  } else {
    return mockValidateRequestAuthenticationResult;
  }
});

Bouncer.validateRequestAuthentication = mockValidateRequestAuthentication;

const mockGenerateReferralStatsResult = 'some stats';
const mockGenerateReferralStats = jest.fn().mockImplementation(() => {
  return mockGenerateReferralStatsResult;
});

jest.mock('../../../lib/data/ReferralStats');

jest.mock('../../../lib/db/repositories/MarkedSwapRepository', () => ({
  addMarkedSwap: jest.fn().mockResolvedValue(undefined),
}));

describe('Controller', () => {
  const service = mockedService();
  const swapInfos = mockedSwapInfos();

  const controller = new Controller(Logger.disabledLogger, service, swapInfos);

  beforeEach(() => {
    ReferralStats.getReferralFees = mockGenerateReferralStats;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('should get version', () => {
    const res = mockResponse();

    controller.version(mockRequest({}), res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      version: getVersion(),
    });
  });

  test('should get pairs', async () => {
    const res = mockResponse();

    controller.getPairs(mockRequest({}), res);

    expect(mockGetPairs).toHaveBeenCalledTimes(1);

    const data = service.getPairs();

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      warnings: data.warnings,
      pairs: mapToObject(data.pairs),
    });
  });

  test('should get nodes', async () => {
    const res = mockResponse();

    await controller.getNodes(mockRequest({}), res);

    expect(mockGetNodes).toHaveBeenCalledTimes(1);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      nodes: {
        BTC: mockGetNodes().get('BTC').get('LND'),
      },
    });
  });

  test('should get timeouts', async () => {
    const res = mockResponse();

    await controller.getTimeouts(mockRequest({}), res);

    expect(mockGetTimeouts).toHaveBeenCalledTimes(1);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      timeouts: mapToObject(timeouts),
    });
  });

  test('should get contracts', async () => {
    const res = mockResponse();

    await controller.getContracts(mockRequest({}), res);

    expect(mockGetContracts).toHaveBeenCalledTimes(1);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      ethereum: {
        network: getContracts.ethereum.network,
        swapContracts: mapToObject(getContracts.ethereum.swapContracts),
        tokens: mapToObject(getContracts.ethereum.tokens),
      },
    });
  });

  test('should get contracts for multiple chains', async () => {
    getContracts.rsk = {
      network: {
        chainId: 123,
      },
      swapContracts: new Map<string, string>([['EtherSwap', '0x123']]),
      tokens: new Map<string, string>(),
    };

    const res = mockResponse();
    await controller.getContracts(mockRequest({}), res);

    expect(mockGetContracts).toHaveBeenCalledTimes(1);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      ethereum: {
        network: getContracts.ethereum.network,
        swapContracts: mapToObject(getContracts.ethereum.swapContracts),
        tokens: mapToObject(getContracts.ethereum.tokens),
      },
      rsk: {
        network: getContracts.rsk.network,
        swapContracts: mapToObject(getContracts.rsk.swapContracts),
        tokens: {},
      },
    });
  });

  test('should get fee estimation', async () => {
    const res = mockResponse();

    await controller.getFeeEstimation(mockRequest({}), res);

    expect(mockGetFeeEstimation).toHaveBeenCalledTimes(1);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      mapToObject(await service.getFeeEstimation()),
    );
  });

  test('should get routing hints', async () => {
    const res = mockResponse();

    const request: any = {
      symbol: 'BTC',
      routingNode:
        '031015a7839468a3c266d662d5bb21ea4cea24226936e2864a7ca4f2c3939836e0',
    };

    await controller.routingHints(mockRequest(request), res);

    expect(res.status).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(200);

    expect(res.json).toHaveBeenCalledTimes(1);
    expect(res.json).toHaveBeenCalledWith({
      routingHints: mockGetRoutingHintsResult,
    });

    expect(mockGetRoutingHints).toHaveBeenCalledTimes(1);
    expect(mockGetRoutingHints).toHaveBeenCalledWith(
      request.symbol,
      request.routingNode,
    );

    // Missing parameter
    request.symbol = undefined;

    controller.routingHints(mockRequest(request), res);

    expect(res.status).toHaveBeenCalledTimes(2);
    expect(res.status).toHaveBeenNthCalledWith(2, 400);

    expect(res.json).toHaveBeenCalledTimes(2);
    expect(res.json).toHaveBeenNthCalledWith(2, {
      error: 'undefined parameter: symbol',
    });
  });

  test('should get swap status', async () => {
    // No id provided in request
    const res = mockResponse();

    await controller.swapStatus(mockRequest({}), res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: 'undefined parameter: id',
    });

    // No swap with this id found
    const id = 'notFound';

    await controller.swapStatus(
      mockRequest({
        id,
      }),
      res,
    );

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      error: `could not find swap with id: ${id}`,
    });

    // Successful request
    await controller.swapStatus(
      mockRequest({
        id: swap.id,
      }),
      res,
    );

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      status: swap.status,
    });
  });

  test('should get swap rates', async () => {
    // No id provided in request
    const res = mockResponse();

    await controller.swapRates(mockRequest({}), res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: 'undefined parameter: id',
    });

    // Successful request
    const requestData = {
      id: '123',
    };

    await controller.swapRates(mockRequest(requestData), res);

    expect(service.getSwapRates).toHaveBeenCalledWith(requestData.id);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(mockedSwapRates);
  });

  test('should get transactions', async () => {
    // No values provided in request
    const res = mockResponse();

    await controller.getTransaction(mockRequest({}), res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: 'undefined parameter: currency',
    });

    // Successful request
    const requestData = {
      currency: 'BTC',
      transactionId: 'id',
    };

    await controller.getTransaction(mockRequest(requestData), res);

    expect(service.getTransaction).toHaveBeenCalledWith(
      requestData.currency,
      requestData.transactionId,
    );

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      transactionHex: rawTransaction,
    });
  });

  test('should get Swap transaction', async () => {
    // No values provided in request
    const res = mockResponse();

    await controller.getSwapTransaction(mockRequest({}), res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: 'undefined parameter: id',
    });

    // Successful request
    const requestData = {
      id: 'id',
    };

    await controller.getSwapTransaction(mockRequest(requestData), res);

    expect(
      service.transactionFetcher.getSubmarineTransaction,
    ).toHaveBeenCalledWith(requestData.id);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      timeoutEta: swapTransaction.timeoutEta,
      transactionHex: swapTransaction.transactionHex,
      timeoutBlockHeight: swapTransaction.timeoutBlockHeight,
    });
  });

  test('should broadcast transactions', async () => {
    // No values provided in request
    const res = mockResponse();

    await controller.broadcastTransaction(mockRequest({}), res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: 'undefined parameter: currency',
    });

    // Successful request
    const requestData = {
      currency: 'BTC',
      transactionHex: 'hex',
    };

    await controller.broadcastTransaction(mockRequest(requestData), res);

    expect(service.broadcastTransaction).toHaveBeenCalledWith(
      requestData.currency,
      requestData.transactionHex,
    );

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      transactionId: await mockBroadcastTransaction(),
    });
  });

  test('should create submarine swaps with invoices', async () => {
    const res = mockResponse();

    // No values provided in request
    let requestData: any = {
      type: 'submarine',
    };

    await controller.createSwap(mockRequest(requestData), res);

    expect(res.status).toHaveBeenNthCalledWith(1, 400);
    expect(res.json).toHaveBeenNthCalledWith(1, {
      error: 'undefined parameter: pairId',
    });

    // Successful request
    requestData = {
      ...requestData,
      pairId: 'LTC/BTC',
      orderSide: 'buy',
      refundPublicKey: '298ae8cc',
      invoice: 'lnbc',
    };

    await controller.createSwap(mockRequest(requestData), res);

    expect(service.createSwapWithInvoice).toHaveBeenCalledWith(
      requestData.pairId,
      requestData.orderSide,
      getHexBuffer(requestData.refundPublicKey),
      requestData.invoice,
      undefined,
      undefined,
      undefined,
    );

    expect(MarkedSwapRepository.addMarkedSwap).toHaveBeenCalledTimes(1);

    expect(res.status).toHaveBeenNthCalledWith(2, 201);
    expect(res.json).toHaveBeenNthCalledWith(
      2,
      await mockCreateSwapWithInvoice(),
    );

    // Should convert all letters of invoice to lower case
    requestData.invoice = 'UPPERCASE';
    expect(requestData.invoice).not.toEqual(requestData.invoice.toLowerCase());

    await controller.createSwap(mockRequest(requestData), res);

    expect(service.createSwapWithInvoice).toHaveBeenNthCalledWith(
      3,
      requestData.pairId,
      requestData.orderSide,
      getHexBuffer(requestData.refundPublicKey),
      requestData.invoice.toLowerCase(),
      undefined,
      undefined,
      undefined,
    );

    expect(res.status).toHaveBeenNthCalledWith(3, 201);
    expect(res.json).toHaveBeenNthCalledWith(
      3,
      await mockCreateSwapWithInvoice(),
    );

    // Should parse and pass channel object
    requestData.channel = {
      auto: true,
      private: true,
      inboundLiquidity: 25,
    };

    await controller.createSwap(mockRequest(requestData), res);

    expect(service.createSwapWithInvoice).toHaveBeenNthCalledWith(
      5,
      requestData.pairId,
      requestData.orderSide,
      getHexBuffer(requestData.refundPublicKey),
      requestData.invoice.toLowerCase(),
      undefined,
      undefined,
      requestData.channel,
    );

    expect(res.status).toHaveBeenNthCalledWith(4, 201);
    expect(res.json).toHaveBeenNthCalledWith(
      4,
      await mockCreateSwapWithInvoice(),
    );

    requestData.channel = undefined;

    // Should parse and pass the pair hash
    requestData.pairHash = 'someHash';

    await controller.createSwap(mockRequest(requestData), res);

    expect(service.createSwapWithInvoice).toHaveBeenNthCalledWith(
      7,
      requestData.pairId,
      requestData.orderSide,
      getHexBuffer(requestData.refundPublicKey),
      requestData.invoice.toLowerCase(),
      requestData.pairHash,
      undefined,
      undefined,
    );

    expect(res.status).toHaveBeenNthCalledWith(5, 201);
    expect(res.json).toHaveBeenNthCalledWith(
      5,
      await mockCreateSwapWithInvoice(),
    );

    requestData.pairHash = undefined;

    // Should parse and pass referral IDs
    requestData.referralId = 'someId';

    await controller.createSwap(mockRequest(requestData), res);

    expect(service.createSwapWithInvoice).toHaveBeenNthCalledWith(
      9,
      requestData.pairId,
      requestData.orderSide,
      getHexBuffer(requestData.refundPublicKey),
      requestData.invoice.toLowerCase(),
      undefined,
      requestData.referralId,
      undefined,
    );

    expect(res.status).toHaveBeenNthCalledWith(6, 201);
    expect(res.json).toHaveBeenNthCalledWith(
      6,
      await mockCreateSwapWithInvoice(),
    );
  });

  test('should create submarine swaps with preimage hashes', async () => {
    const res = mockResponse();

    // No values provided in request
    let requestData: any = {
      type: 'submarine',
    };

    await controller.createSwap(mockRequest(requestData), res);

    expect(res.status).toHaveBeenNthCalledWith(1, 400);
    expect(res.json).toHaveBeenNthCalledWith(1, {
      error: 'undefined parameter: pairId',
    });

    // Invalid preimage hash length
    requestData = {
      ...requestData,
      pairId: 'LTC/BTC',
      orderSide: 'buy',
      refundPublicKey: '298ae8cc',
      preimageHash: 'ff',
    };

    await controller.createSwap(mockRequest(requestData), res);

    expect(res.status).toHaveBeenNthCalledWith(2, 400);
    expect(res.json).toHaveBeenNthCalledWith(2, {
      error: 'invalid preimage hash length: 1',
    });

    // Successful request
    requestData.preimageHash =
      'e3ed8e78cddaa8165ca26c199f6dc03ec2abf3a40eb2f7eb87dbd8d33c47e39f';

    await controller.createSwap(mockRequest(requestData), res);

    expect(service.createSwap).toHaveBeenCalledWith({
      pairId: requestData.pairId,
      version: SwapVersion.Legacy,
      orderSide: requestData.orderSide,
      preimageHash: getHexBuffer(requestData.preimageHash),
      refundPublicKey: getHexBuffer(requestData.refundPublicKey),
    });

    expect(MarkedSwapRepository.addMarkedSwap).toHaveBeenCalledTimes(1);

    expect(res.status).toHaveBeenNthCalledWith(3, 201);
    expect(res.json).toHaveBeenNthCalledWith(3, await mockCreateSwap());

    // Should parse and pass channel object
    requestData.channel = {
      auto: true,
      private: true,
      inboundLiquidity: 25,
    };

    await controller.createSwap(mockRequest(requestData), res);

    expect(service.createSwap).toHaveBeenCalledWith({
      pairId: requestData.pairId,
      version: SwapVersion.Legacy,
      channel: requestData.channel,
      orderSide: requestData.orderSide,
      preimageHash: getHexBuffer(requestData.preimageHash),
      refundPublicKey: getHexBuffer(requestData.refundPublicKey),
    });

    expect(res.status).toHaveBeenNthCalledWith(4, 201);
    expect(res.json).toHaveBeenNthCalledWith(4, await mockCreateSwap());

    // Should parse and pass referral IDs
    requestData.referralId = 'someId';

    await controller.createSwap(mockRequest(requestData), res);

    expect(service.createSwap).toHaveBeenCalledWith({
      pairId: requestData.pairId,
      version: SwapVersion.Legacy,
      channel: requestData.channel,
      orderSide: requestData.orderSide,
      referralId: requestData.referralId,
      preimageHash: getHexBuffer(requestData.preimageHash),
      refundPublicKey: getHexBuffer(requestData.refundPublicKey),
    });

    expect(res.status).toHaveBeenNthCalledWith(5, 201);
    expect(res.json).toHaveBeenNthCalledWith(5, await mockCreateSwap());
  });

  test('should set invoices', async () => {
    const res = mockResponse();

    // No values provided in request
    const requestData: any = {
      id: 'id',
    };

    await controller.setInvoice(mockRequest(requestData), res);

    expect(res.status).toHaveBeenNthCalledWith(1, 400);
    expect(res.json).toHaveBeenNthCalledWith(1, {
      error: 'undefined parameter: invoice',
    });

    // Successful request
    requestData.invoice = 'lnbc';

    await controller.setInvoice(mockRequest(requestData), res);

    expect(service.setInvoice).toHaveBeenCalledWith(
      requestData.id,
      requestData.invoice,
      undefined,
    );

    expect(res.status).toHaveBeenNthCalledWith(2, 200);
    expect(res.json).toHaveBeenNthCalledWith(2, await mockSetInvoice());

    // Should convert all letters of invoice to lower case
    requestData.invoice = 'UPPERCASE';
    expect(requestData.invoice).not.toEqual(requestData.invoice.toLowerCase());

    await controller.setInvoice(mockRequest(requestData), res);

    expect(service.setInvoice).toHaveBeenNthCalledWith(
      3,
      requestData.id,
      requestData.invoice.toLowerCase(),
      undefined,
    );

    expect(res.status).toHaveBeenNthCalledWith(3, 200);
    expect(res.json).toHaveBeenNthCalledWith(3, await mockSetInvoice());

    // Should parse and pass the pair hash
    requestData.pairHash = 'someHash';

    await controller.setInvoice(mockRequest(requestData), res);

    expect(service.setInvoice).toHaveBeenNthCalledWith(
      5,
      requestData.id,
      requestData.invoice.toLowerCase(),
      requestData.pairHash,
    );

    expect(res.status).toHaveBeenNthCalledWith(4, 200);
    expect(res.json).toHaveBeenNthCalledWith(4, await mockSetInvoice());
  });

  test('should create reverse swaps', async () => {
    const res = mockResponse();

    // No values provided in request
    let requestData: any = {
      type: 'reverseSubmarine',
    };

    await controller.createSwap(mockRequest(requestData), res);

    expect(res.status).toHaveBeenNthCalledWith(1, 400);
    expect(res.json).toHaveBeenNthCalledWith(1, {
      error: 'undefined parameter: pairId',
    });

    // Successful request
    requestData = {
      ...requestData,
      pairId: 'LTC/BTC',
      orderSide: 'buy',
      invoiceAmount: 321,
      claimPublicKey: '298ae8cc',
      preimageHash:
        '98aed2bbba02f46751d1d4f687642df910cd1a6b85ba8adfabdbe7d82c8a4e6c',
    };

    await controller.createSwap(mockRequest(requestData), res);

    expect(service.createReverseSwap).toHaveBeenCalledWith({
      pairId: requestData.pairId,
      version: SwapVersion.Legacy,
      orderSide: requestData.orderSide,
      invoiceAmount: requestData.invoiceAmount,
      preimageHash: getHexBuffer(requestData.preimageHash),
      claimPublicKey: getHexBuffer(requestData.claimPublicKey),
    });

    expect(MarkedSwapRepository.addMarkedSwap).toHaveBeenCalledTimes(1);

    expect(res.status).toHaveBeenNthCalledWith(2, 201);
    expect(res.json).toHaveBeenNthCalledWith(2, await mockCreateReverseSwap());

    // Should parse and pass the pair hash
    requestData.pairHash = 'someHash';

    await controller.createSwap(mockRequest(requestData), res);

    expect(service.createReverseSwap).toHaveBeenNthCalledWith(3, {
      pairId: requestData.pairId,
      version: SwapVersion.Legacy,
      pairHash: requestData.pairHash,
      orderSide: requestData.orderSide,
      invoiceAmount: requestData.invoiceAmount,
      preimageHash: getHexBuffer(requestData.preimageHash),
      claimPublicKey: getHexBuffer(requestData.claimPublicKey),
    });

    expect(res.status).toHaveBeenNthCalledWith(3, 201);
    expect(res.json).toHaveBeenNthCalledWith(3, await mockCreateReverseSwap());

    requestData.pairHash = undefined;

    // Should parse and pass onchain amount
    requestData.onchainAmount = 123;
    requestData.invoiceAmount = undefined;

    await controller.createSwap(mockRequest(requestData), res);

    expect(service.createReverseSwap).toHaveBeenNthCalledWith(5, {
      pairId: requestData.pairId,
      version: SwapVersion.Legacy,
      orderSide: requestData.orderSide,
      onchainAmount: requestData.onchainAmount,
      preimageHash: getHexBuffer(requestData.preimageHash),
      claimPublicKey: getHexBuffer(requestData.claimPublicKey),
    });

    expect(res.status).toHaveBeenNthCalledWith(4, 201);
    expect(res.json).toHaveBeenNthCalledWith(4, await mockCreateReverseSwap());

    // Should parse and pass referral IDs
    requestData.referralId = 'someId';

    await controller.createSwap(mockRequest(requestData), res);

    expect(service.createReverseSwap).toHaveBeenNthCalledWith(7, {
      pairId: requestData.pairId,
      version: SwapVersion.Legacy,
      orderSide: requestData.orderSide,
      referralId: requestData.referralId,
      preimageHash: getHexBuffer(requestData.preimageHash),
      onchainAmount: requestData.onchainAmount,
      claimPublicKey: getHexBuffer(requestData.claimPublicKey),
    });

    expect(res.status).toHaveBeenNthCalledWith(5, 201);
    expect(res.json).toHaveBeenNthCalledWith(5, await mockCreateReverseSwap());
  });

  test('should query referrals', async () => {
    const res = mockResponse();

    mockValidateRequestAuthenticationResult = null;
    await controller.queryReferrals(mockRequest({}, {}), res);

    expect(mockValidateRequestAuthentication).toHaveBeenCalledTimes(1);

    expect(res.status).toHaveBeenNthCalledWith(1, 401);
    expect(res.json).toHaveBeenNthCalledWith(1, {
      error: 'unauthorized',
    });

    mockValidateRequestAuthenticationResult = {
      id: 'referralId',
    };

    await controller.queryReferrals(mockRequest({}, {}), res);

    expect(mockValidateRequestAuthentication).toHaveBeenCalledTimes(2);

    expect(res.status).toHaveBeenNthCalledWith(2, 200);
    expect(res.write).toHaveBeenNthCalledWith(
      1,
      mockGenerateReferralStatsResult,
    );
    expect(res.end).toHaveBeenCalledTimes(1);
  });
});
