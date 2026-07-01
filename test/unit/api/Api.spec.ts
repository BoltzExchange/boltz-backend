import Logger from '../../../lib/Logger';
import { handleUnhandledError } from '../../../lib/api/Api';
import { mockRequest, mockResponse } from './Utils';

describe('Api', () => {
  describe('handleUnhandledError', () => {
    test('should forward to next when headers were already sent', () => {
      const req = mockRequest({});
      const res = mockResponse();
      (res as any).headersSent = true;
      const next = jest.fn();
      const error = new Error('some error');

      handleUnhandledError(Logger.disabledLogger, error, req, res, next);

      expect(next).toHaveBeenCalledWith(error);
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });

    test('should respond with the status code of the error, e.g. Range Not Satisfiable', () => {
      const req = mockRequest({});
      const res = mockResponse();
      const next = jest.fn();

      const error: any = new Error('Range Not Satisfiable');
      error.status = 416;

      handleUnhandledError(Logger.disabledLogger, error, req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(416);
      expect(res.json).toHaveBeenCalledWith({ error: error.message });
    });

    test('should fall back to statusCode when status is not set', () => {
      const req = mockRequest({});
      const res = mockResponse();
      const next = jest.fn();

      const error: any = new Error('Teapot');
      error.statusCode = 418;

      handleUnhandledError(Logger.disabledLogger, error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(418);
      expect(res.json).toHaveBeenCalledWith({ error: error.message });
    });

    test('should fall back to 500 when neither status nor statusCode is set', () => {
      const req = mockRequest({});
      const res = mockResponse();
      const next = jest.fn();

      const error = new Error('unknown error');

      handleUnhandledError(Logger.disabledLogger, error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: error.message });
    });
  });
});
