import { randomBytes } from 'crypto';
import Logger from '../../../lib/Logger';
import { getHexBuffer } from '../../../lib/Utils';
import Errors from '../../../lib/api/Errors';
import type { ApiArgument } from '../../../lib/api/Utils';
import {
  checkPreimageHashLength,
  errorResponse,
  markSwap,
  validateArray,
  validateRequest,
} from '../../../lib/api/Utils';
import MarkedSwapRepository from '../../../lib/db/repositories/MarkedSwapRepository';
import type Sidecar from '../../../lib/sidecar/Sidecar';
import { mockRequest, mockResponse } from './Utils';

jest.mock('../../../lib/db/repositories/MarkedSwapRepository', () => ({
  addMarkedSwap: jest.fn().mockResolvedValue(undefined),
}));

describe('Utils', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  test('should validate requests', () => {
    const checks: ApiArgument[] = [
      {
        name: 'test',
        type: 'string',
      },
    ];

    const hexChecks: ApiArgument[] = [
      {
        name: 'test',
        type: 'string',
        hex: true,
      },
    ];

    const optionalChecks: ApiArgument[] = [
      {
        name: 'test',
        type: 'string',
        optional: true,
      },
    ];

    // Undefined parameter
    expect(() => validateRequest({}, checks)).toThrow(
      `undefined parameter: ${checks[0].name}`,
    );

    // Invalid parameter
    expect(() =>
      validateRequest(
        {
          test: 0,
        },
        checks,
      ),
    ).toThrow(`invalid parameter: ${checks[0].name}`);

    // Ignore empty hex
    expect(
      validateRequest(
        {
          test: '',
        },
        hexChecks,
      ),
    ).toEqual({
      test: '',
    });

    // Successful validation
    expect(
      validateRequest(
        {
          test: 'test',
        },
        checks,
      ),
    ).toEqual({ test: 'test' });

    // Successful hex validation
    expect(
      validateRequest(
        {
          test: '298ae8cc',
        },
        hexChecks,
      ),
    ).toEqual({ test: getHexBuffer('298ae8cc') });

    // Optional argument
    expect(validateRequest({}, optionalChecks)).toEqual({});
    expect(
      validateRequest(
        {
          test: 'test',
        },
        optionalChecks,
      ),
    ).toEqual({ test: 'test' });
  });

  describe('validateArray', () => {
    test.each`
      data
      ${1}
      ${1n}
      ${{}}
      ${''}
      ${false}
    `('should throw when data is not an array', ({ data }) => {
      const name = 'name';
      expect(() => validateArray(name, data, 'string')).toThrow(
        Errors.INVALID_PARAMETER(name),
      );
    });

    test('should throw when one of the entries is not of the specified type', () => {
      const name = 'name';
      expect(() => validateArray(name, ['string', 1, false], 'string')).toThrow(
        Errors.INVALID_PARAMETER(name),
      );
    });

    test('should throw when length is greater than max length', () => {
      const name = 'name';
      expect(() => validateArray(name, [1, 2, 3], 'number', 2)).toThrow(
        Errors.INVALID_PARAMETER(name),
      );
    });

    test('should not throw when constrains are fulfilled', () => {
      validateArray('', [1, 2, 3], 'number');
    });
  });

  test('should handle error responses', () => {
    const req = mockRequest({});
    const res = mockResponse();

    let error: any = '123';

    errorResponse(Logger.disabledLogger, req, res, error);

    expect(res.status).toHaveBeenNthCalledWith(1, 400);
    expect(res.json).toHaveBeenNthCalledWith(1, { error });

    error = {
      details: 'missing inputs',
    };

    errorResponse(Logger.disabledLogger, req, res, error);

    expect(res.status).toHaveBeenNthCalledWith(2, 400);
    expect(res.json).toHaveBeenNthCalledWith(2, { error: error.details });

    error = {
      timeoutBlockHeight: 321,
      error: 'timelock requirement not met',
    };

    errorResponse(Logger.disabledLogger, req, res, error);

    expect(res.status).toHaveBeenNthCalledWith(3, 400);
    expect(res.json).toHaveBeenNthCalledWith(3, error);

    error = {
      message: 'some other error',
    };

    errorResponse(Logger.disabledLogger, req, res, error);

    expect(res.status).toHaveBeenNthCalledWith(4, 400);
    expect(res.json).toHaveBeenNthCalledWith(4, { error: error.message });

    errorResponse(Logger.disabledLogger, req, res, error, 401);

    expect(res.status).toHaveBeenNthCalledWith(5, 401);
    expect(res.json).toHaveBeenNthCalledWith(5, { error: error.message });
  });

  test('should check preimage hash length', () => {
    checkPreimageHashLength(
      getHexBuffer(
        '34786bcde69ec5873bcf2e8a42c47fbcc762bdb1096c1077709cb9854fef308d',
      ),
    );
  });

  test.each`
    length
    ${16}
    ${31}
    ${33}
    ${64}
  `('should throw on invalid preimage hash length $length', ({ length }) => {
    expect(() => checkPreimageHashLength(randomBytes(length))).toThrow(
      `invalid preimage hash length: ${length}`,
    );
  });

  test('should mark swaps from relevant countries', async () => {
    const id = '123';
    const ip = '123.123.123.123';

    const sidecar = {
      isMarked: jest.fn().mockReturnValue(true),
    } as any as Sidecar;

    await markSwap(sidecar, ip, id);

    expect(sidecar.isMarked).toHaveBeenCalledTimes(1);
    expect(sidecar.isMarked).toHaveBeenCalledWith(ip);

    expect(MarkedSwapRepository.addMarkedSwap).toHaveBeenCalledTimes(1);
    expect(MarkedSwapRepository.addMarkedSwap).toHaveBeenCalledWith(id);
  });

  test('should not mark swaps from non relevant countries', async () => {
    const id = '123';
    const ip = '123.123.123.123';

    const sidecar = {
      isMarked: jest.fn().mockReturnValue(false),
    } as any as Sidecar;

    await markSwap(sidecar, ip, id);

    expect(sidecar.isMarked).toHaveBeenCalledTimes(1);
    expect(sidecar.isMarked).toHaveBeenCalledWith(ip);

    expect(MarkedSwapRepository.addMarkedSwap).not.toHaveBeenCalled();
  });
});
