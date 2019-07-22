import { Request, Response } from 'express';
import Logger from '../../../lib/Logger';
import Service from '../../../lib/service/Service';
import Controller from '../../../lib/api/Controller';
import { SwapType } from '../../../lib/db/models/Swap';
import { SwapUpdateEvent } from '../../../lib/consts/Enums';
import { mapToObject, getHexBuffer } from '../../../lib/Utils';
import { ReverseSwapType } from '../../../lib/db/models/ReverseSwap';

type closeResponseCallback = () => void;
type swapUpdateCallback = (id: string, message: string) => void;

const swaps: SwapType[] = [
  {
    id: 'status',
    status: SwapUpdateEvent.InvoicePaid,
  } as any as SwapType,
  {
    id: 'noStatus',
  } as any as SwapType,
];
const reverseSwaps: ReverseSwapType[] = [
  {
    id: 'rStatus',
    status: SwapUpdateEvent.TransactionConfirmed,
  } as any as ReverseSwapType,
  {
    id: 'rStatusSettled',
    preimage: 'preimage',
    status: SwapUpdateEvent.InvoiceSettled,
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

const mockGetFeeEstimation = jest.fn().mockReturnValue(new Map<string, number>([
  ['BTC', 1],
]));

const mockGetTransaction = jest.fn().mockReturnValue('transactionHex');

const mockBroadcastTransaction = jest.fn().mockReturnValue('transactionId');

const mockCreateSwap = jest.fn().mockReturnValue({
  swap: 'created',
});

const mockCreateReverseSwap = jest.fn().mockReturnValue({
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
      swapRepository: {
        getSwaps: () => Promise.resolve(swaps),
      },
      reverseSwapRepository: {
        getReverseSwaps: () => Promise.resolve(reverseSwaps),
      },

      getPairs: mockGetPairs,
      getFeeEstimation: mockGetFeeEstimation,

      getTransaction: mockGetTransaction,
      broadcastTransaction: mockBroadcastTransaction,
      createSwap: mockCreateSwap,
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

    expect(pendingSwaps.get(swaps[0].id)).toEqual({
      event: swaps[0].status,
    });
    expect(pendingSwaps.get(swaps[1].id)).toBeUndefined();

    expect(pendingSwaps.get(reverseSwaps[0].id)).toEqual({
      event: reverseSwaps[0].status,
    });
    expect(pendingSwaps.get(reverseSwaps[1].id)).toEqual({
      event: reverseSwaps[1].status,
      preimage: reverseSwaps[1].preimage,
    });
    expect(pendingSwaps.get(reverseSwaps[2].id)).toBeUndefined();
  });

  test('should get pairs', () => {
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
      event: swaps[0].status,
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
      transactionHex: mockGetTransaction(),
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
      transactionId: mockBroadcastTransaction(),
    });
  });

  test('should create swaps', async () => {
    // No values provided in request
    const res = mockResponse();

    await controller.createSwap(mockRequest({}), res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: 'undefined parameter: pairId',
    });

    // Successful request
    const requestData = {
      pairId: 'LTC/BTC',
      orderSide: 'buy',
      invoice: 'lnbc',
      refundPublicKey: '298ae8cc',
    };

    await controller.createSwap(mockRequest(requestData), res);

    expect(service.createSwap).toHaveBeenCalledWith(
      requestData.pairId,
      requestData.orderSide,
      requestData.invoice,
      getHexBuffer(requestData.refundPublicKey),
    );

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(mockCreateSwap());
  });

  test('should create reverse swaps', async () => {
    // No values provided in request
    const res = mockResponse();

    await controller.createReverseSwap(mockRequest({}), res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: 'undefined parameter: pairId',
    });

    // Successful request
    const requestData = {
      pairId: 'LTC/BTC',
      orderSide: 'buy',
      invoiceAmount: 0,
      claimPublicKey: '298ae8cc',
    };

    await controller.createReverseSwap(mockRequest(requestData), res);

    expect(service.createReverseSwap).toHaveBeenCalledWith(
      requestData.pairId,
      requestData.orderSide,
      requestData.invoiceAmount,
      getHexBuffer(requestData.claimPublicKey),
    );

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(mockCreateReverseSwap());
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
      isHex: true,
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
    validateRequest({
      test: 'test',
    }, checks);

    // Successful hex validation
    validateRequest({
      test: '298ae8cc',
    }, hexChecks);
  });
});
