import { Request, Response } from 'express';

export const mockRequest = (
  body: any = null,
  query?: Record<string, any>,
  params?: Record<string, any>,
) =>
  ({
    body,
    query,
    params,
    ip: '127.0.0.1',
    header: jest.fn().mockReturnValue(undefined),
  }) as unknown as Request;

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

  return res;
};
