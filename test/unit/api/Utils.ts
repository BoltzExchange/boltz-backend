import { Request, Response } from 'express';

export type closeResponseCallback = () => void;
export let emitClose: closeResponseCallback;

export const mockRequest = (
  body: any = null,
  query?: Record<string, any>,
  params?: Record<string, any>,
) =>
  ({
    body,
    query,
    params,
  }) as Request;

export const mockResponse = () => {
  const res = {} as any as Response;

  res.json = jest.fn().mockReturnValue(res);
  res.write = jest.fn().mockReturnValue(true);
  res.end = jest.fn().mockResolvedValue(undefined);
  res.status = jest.fn().mockReturnValue(res);
  res.writeHead = jest.fn().mockReturnValue(res);
  res.setTimeout = jest.fn().mockReturnValue(res);

  res.set = jest.fn().mockImplementation((field: string, value: string) => {
    expect(field).toEqual('Content-Type');
    expect(value).toEqual('application/json');

    return res;
  });

  res.on = jest
    .fn()
    .mockImplementation((event: string, callback: closeResponseCallback) => {
      expect(event).toEqual('close');

      emitClose = callback;
    });

  return res;
};
