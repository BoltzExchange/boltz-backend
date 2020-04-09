import { Request, Response } from 'express';
import Logger from '../../../lib/Logger';
import Service from '../../../lib/service/Service';
import Controller from '../../../lib/api/Controller';
import SwapNursery from '../../../lib/swap/SwapNursery';
import { ReverseSwapType } from '../../../lib/db/models/ReverseSwap';
import { SwapType as SwapDbType } from '../../../lib/db/models/Swap';
import { SwapUpdateEvent, SwapType } from '../../../lib/consts/Enums';
import { mapToObject, getHexBuffer, getVersion } from '../../../lib/Utils';

type closeResponseCallback = () => void;
type swapUpdateCallback = (id: string, message: string) => void;

const swaps: SwapDbType[] = [
  {
    id: 'status',
    status: SwapUpdateEvent.InvoicePaid,
  } as any as SwapDbType,
  {
    id: 'noStatus',
  } as any as SwapDbType,
];
const reverseSwaps: ReverseSwapType[] = [
  {
    id: 'rStatus',
    status: SwapUpdateEvent.InvoiceSettled,
  } as any as ReverseSwapType,
  {
    id: 'rStatusSettled',
    orderSide: 0,
    pair: 'BTC/BTC',
    transactionId: 'transaction',
    status: SwapUpdateEvent.TransactionConfirmed,
  } as any as ReverseSwapType,
  {
    id: 'rStatusMempool',
    orderSide: 0,
    pair: 'BTC/BTC',
    transactionId: 'transactionMempool',
    status: SwapUpdateEvent.TransactionMempool,
  } as any as ReverseSwapType,
  {
    id: 'rNoStatus',
  } as any as ReverseSwapType,
];

let swapUpdate: swapUpdateCallback;
let emitClose: closeResponseCallback;

const mockGetPairs = jest.fn().mockReturnValue({
  warnings: [],
  pairs: [],
});

const getNodes = new Map<string, {
  nodeKey: string,
  uris: string[],
}>([
  ['BTC', {
    nodeKey: '321',
    uris: [
      '321@127.0.0.1:9735',
    ],
  }],
]);
const mockGetNodes = jest.fn().mockResolvedValue(getNodes);

const mockGetFeeEstimation = jest.fn().mockResolvedValue(new Map<string, number>([
  ['BTC', 1],
]));

const mockSetInvoice = jest.fn().mockResolvedValue({
  set: 'invoice',
});

const rawTransaction = 'transactionHex';
const mockGetTransaction = jest.fn().mockResolvedValue(rawTransaction);

const swapTransaction = {
  timeoutEta: 1586291268,
  timeoutBlockHeight: 321,
  transactionHex: rawTransaction,
};
const mockGetSwapTransaction = jest.fn().mockResolvedValue(swapTransaction);

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
      eventHandler: {
        on: (event: string, callback: swapUpdateCallback) => {
          expect(event).toEqual('swap.update');

          swapUpdate = callback;
        },
      },
      swapManager: {
        swapRepository: {
          getSwaps: () => Promise.resolve(swaps),
        },
        reverseSwapRepository: {
          getReverseSwaps: () => Promise.resolve(reverseSwaps),
        },
      },

      getPairs: mockGetPairs,
      getNodes: mockGetNodes,
      getFeeEstimation: mockGetFeeEstimation,

      setSwapInvoice: mockSetInvoice,
      getTransaction: mockGetTransaction,
      getSwapTransaction: mockGetSwapTransaction,
      broadcastTransaction: mockBroadcastTransaction,

      createSwap: mockCreateSwap,
      createSwapWithInvoice: mockCreateSwapWithInvoice,

      createReverseSwap: mockCreateReverseSwap,
    };
  });
});

const mockedService = <jest.Mock<Service>><any>Service;

const mockRequest = (body: any, query?: any) => ({
  body,
  query,
} as Request);

const mockResponse = () => {
  const res = {} as any as Response;

  res.json = jest.fn().mockReturnValue(res);
  res.write = jest.fn().mockReturnValue(true);
  res.status = jest.fn().mockReturnValue(res);
  res.writeHead = jest.fn().mockReturnValue(res);
  res.setTimeout = jest.fn().mockReturnValue(res);

  res.set = jest.fn().mockImplementation((field: string, value: string) => {
    expect(field).toEqual('Content-Type');
    expect(value).toEqual('application/json');

    return res;
  });

  res.on = jest.fn().mockImplementation((event: string, callback: closeResponseCallback) => {
    expect(event).toEqual('close');

    emitClose = callback;
  });

  return res;
};

describe('Controller', () => {
  const service = mockedService();

  const controller = new Controller(
    Logger.disabledLogger,
    service,
  );

  test('should load status of all swaps on init', async () => {
    await controller.init();

    const pendingSwaps = controller['pendingSwapInfos'];

    expect(mockGetTransaction).toHaveBeenCalledTimes(2);
    expect(mockGetTransaction).toHaveBeenCalledWith('BTC', reverseSwaps[1].transactionId);
    expect(mockGetTransaction).toHaveBeenCalledWith('BTC', reverseSwaps[2].transactionId);

    expect(pendingSwaps.get(swaps[0].id)).toEqual({
      status: swaps[0].status,
    });
    expect(pendingSwaps.get(swaps[1].id)).toBeUndefined();

    expect(pendingSwaps.get(reverseSwaps[0].id)).toEqual({
      status: reverseSwaps[0].status,
    });
    expect(pendingSwaps.get(reverseSwaps[1].id)).toEqual({
      status: reverseSwaps[1].status,
      transaction: {
        eta: undefined,
        hex: rawTransaction,
        id: reverseSwaps[1].transactionId,
      },
    });
    expect(pendingSwaps.get(reverseSwaps[2].id)).toEqual({
      status: reverseSwaps[2].status,
      transaction: {
        hex: rawTransaction,
        id: reverseSwaps[2].transactionId,
        eta: SwapNursery.reverseSwapMempoolEta,
      },
    });
    expect(pendingSwaps.get(reverseSwaps[3].id)).toBeUndefined();
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
      nodes: mapToObject(getNodes),
    });
  });

  test('should get fee estimation', async () => {
    const res = mockResponse();

    await controller.getFeeEstimation(mockRequest({}), res);

    expect(mockGetFeeEstimation).toHaveBeenCalledTimes(1);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      mapToObject(
        await service.getFeeEstimation(),
      ),
    );
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

    await controller.swapStatus(mockRequest({
      id,
    }), res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      error: `could not find swap with id: ${id}`,
    });

    // Successful request
    await controller.swapStatus(mockRequest({
      id: swaps[0].id,
    }), res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      status: swaps[0].status,
    });
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

    expect(service.getSwapTransaction).toHaveBeenCalledWith(
      requestData.id,
    );

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
    );

    expect(res.status).toHaveBeenNthCalledWith(2, 201);
    expect(res.json).toHaveBeenNthCalledWith(2, await mockCreateSwapWithInvoice());

    // Should convert all letters of invoice to lower case
    requestData.invoice = 'UPPERCASE';
    expect(requestData.invoice).not.toEqual(requestData.invoice.toLowerCase());

    await controller.createSwap(mockRequest(requestData), res);

    expect(service.createSwapWithInvoice).toHaveBeenNthCalledWith(3,
      requestData.pairId,
      requestData.orderSide,
      getHexBuffer(requestData.refundPublicKey),
      requestData.invoice.toLowerCase(),
    );

    expect(res.status).toHaveBeenNthCalledWith(3, 201);
    expect(res.json).toHaveBeenNthCalledWith(3, await mockCreateSwapWithInvoice());
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
    requestData.preimageHash = 'e3ed8e78cddaa8165ca26c199f6dc03ec2abf3a40eb2f7eb87dbd8d33c47e39f';

    await controller.createSwap(mockRequest(requestData), res);

    expect(service.createSwap).toHaveBeenCalledWith(
      requestData.pairId,
      requestData.orderSide,
      getHexBuffer(requestData.refundPublicKey),
      getHexBuffer(requestData.preimageHash),
    );

    expect(res.status).toHaveBeenNthCalledWith(3, 201);
    expect(res.json).toHaveBeenNthCalledWith(3, await mockCreateSwap());
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

    expect(service.setSwapInvoice).toHaveBeenCalledWith(
      requestData.id,
      requestData.invoice,
    );

    expect(res.status).toHaveBeenNthCalledWith(2, 200);
    expect(res.json).toHaveBeenNthCalledWith(2, await mockSetInvoice());

    // Should convert all letters of invoice to lower case
    requestData.invoice = 'UPPERCASE';
    expect(requestData.invoice).not.toEqual(requestData.invoice.toLowerCase());

    await controller.setInvoice(mockRequest(requestData), res);

    expect(service.setSwapInvoice).toHaveBeenNthCalledWith(3,
      requestData.id,
      requestData.invoice.toLowerCase(),
    );

    expect(res.status).toHaveBeenNthCalledWith(3, 200);
    expect(res.json).toHaveBeenNthCalledWith(3, await mockSetInvoice());
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
      invoiceAmount: 0,
      claimPublicKey: '298ae8cc',
      preimageHash: '98aed2bbba02f46751d1d4f687642df910cd1a6b85ba8adfabdbe7d82c8a4e6c',
    };

    await controller.createSwap(mockRequest(requestData), res);

    expect(service.createReverseSwap).toHaveBeenCalledWith(
      requestData.pairId,
      requestData.orderSide,
      getHexBuffer(requestData.preimageHash),
      requestData.invoiceAmount,
      getHexBuffer(requestData.claimPublicKey),
    );

    expect(res.status).toHaveBeenNthCalledWith(2, 201);
    expect(res.json).toHaveBeenNthCalledWith(2, await mockCreateReverseSwap());
  });

  test('should stream swap status updates', () => {
    // No id provided in request
    const res = mockResponse();

    controller.streamSwapStatus(mockRequest({}, {}), res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: 'undefined parameter: id',
    });

    // Successful request
    const id = 'id';

    controller.streamSwapStatus(mockRequest({}, {
      id,
    }), res);

    expect(controller['pendingSwapStreams'].get(id)).not.toBeUndefined();

    expect(res.setTimeout).toBeCalledWith(0);
    expect(res.writeHead).toBeCalledWith(200, {
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
      'Cache-Control': 'no-cache',
      'Content-Type': 'text/event-stream',
    });

    const message = SwapUpdateEvent.InvoiceSettled;

    swapUpdate(id, message);
    expect(res.write).toHaveBeenCalledWith(`data: \"${message}\"\n\n`);

    emitClose();
    expect(controller['pendingSwapStreams'].get(id)).toBeUndefined();
  });

  test('should validate requests', () => {
    const validateRequest = controller['validateRequest'];

    const checks = [{
      name: 'test',
      type: 'string',
    }];

    const hexChecks = [{
      name: 'test',
      type: 'string',
      hex: true,
    }];

    const optionalChecks = [{
      name: 'test',
      type: 'string',
      optional: true,
    }];

    // Undefined parameter
    expect(() => validateRequest({}, checks))
      .toThrowError(`undefined parameter: ${checks[0].name}`);

    // Invalid parameter
    expect(() => validateRequest({
      test: 0,
    }, checks)).toThrowError(`invalid parameter: ${checks[0].name}`);

    // Hex can't be parsed
    expect(() => validateRequest({
      test: '',
    }, hexChecks)).toThrowError(`could not parse hex string: ${hexChecks[0].name}`);

    // Successful validation
    expect(
      validateRequest({
        test: 'test',
      }, checks),
    ).toEqual({ test: 'test' });

    // Successful hex validation
    expect(
      validateRequest({
        test: '298ae8cc',
      }, hexChecks),
    ).toEqual({ test: getHexBuffer('298ae8cc') });

    // Optional argument
    expect(validateRequest({}, optionalChecks)).toEqual({});
    expect(validateRequest({
      test: 'test',
    }, optionalChecks)).toEqual({ test: 'test' });
  });

  test('should handle error responses', () => {
    const res = mockResponse();

    let error: any = '123';

    controller.errorResponse(res, error);

    expect(res.status).toHaveBeenNthCalledWith(1, 400);
    expect(res.json).toHaveBeenNthCalledWith(1, { error });

    error = {
      details: 'missing inputs',
    };

    controller.errorResponse(res, error);

    expect(res.status).toHaveBeenNthCalledWith(2, 400);
    expect(res.json).toHaveBeenNthCalledWith(2, { error: error.details });

    error = {
      timeoutBlockHeight: 321,
      error: 'timelock requirement not met',
    };

    controller.errorResponse(res, error);

    expect(res.status).toHaveBeenNthCalledWith(3, 400);
    expect(res.json).toHaveBeenNthCalledWith(3, error);

    error = {
      message: 'some other error',
    };

    controller.errorResponse(res, error);

    expect(res.status).toHaveBeenNthCalledWith(4, 400);
    expect(res.json).toHaveBeenNthCalledWith(4, { error: error.message });

    controller.errorResponse(res, error, 401);

    expect(res.status).toHaveBeenNthCalledWith(5, 401);
    expect(res.json).toHaveBeenNthCalledWith(5, { error: error.message });
  });

  test('should parse swap types', () => {
    const parseSwapType = controller['parseSwapType'];

    expect(parseSwapType('submarine')).toEqual(SwapType.Submarine);
    expect(parseSwapType('sUbMaRiNe')).toEqual(SwapType.Submarine);
    expect(parseSwapType('SUBMARINE')).toEqual(SwapType.Submarine);

    expect(parseSwapType('reversesubmarine')).toEqual(SwapType.ReverseSubmarine);
    expect(parseSwapType('reverseSubmarine')).toEqual(SwapType.ReverseSubmarine);

    expect(() => parseSwapType('notFound')).toThrow('could not find swap type: notFound');
  });

  test('should check preimage hash length', () => {
    const checkPreimageHashLength = controller['checkPreimageHashLength'];

    checkPreimageHashLength(getHexBuffer('34786bcde69ec5873bcf2e8a42c47fbcc762bdb1096c1077709cb9854fef308d'));

    // Check errors
    expect(
      () => checkPreimageHashLength(getHexBuffer('34786bcde69ec5873bcf2e8a42c47fbcc762bdb1096c1077709cb9854fef308')),
    ).toThrowError('invalid preimage hash length: 31');

    expect(
      () => checkPreimageHashLength(getHexBuffer('34786bcde69ec5873bcf2e8a42c47fbcc762bdb1096c1077709cb9854fef308dff')),
    ).toThrowError('invalid preimage hash length: 33');
  });
});
