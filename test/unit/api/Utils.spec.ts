import { randomBytes } from 'crypto';
import Logger from '../../../lib/Logger';
import { getHexBuffer } from '../../../lib/Utils';
import { mockRequest, mockResponse } from './Utils';
import {
  checkPreimageHashLength,
  errorResponse,
  validateRequest,
} from '../../../lib/api/Utils';

describe('Utils', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  test('should validate requests', () => {
    const checks = [
      {
        name: 'test',
        type: 'string',
      },
    ];

    const hexChecks = [
      {
        name: 'test',
        type: 'string',
        hex: true,
      },
    ];

    const optionalChecks = [
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
});
