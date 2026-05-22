export class HttpError extends Error {
  constructor(
    public readonly status: number,
    public readonly statusText: string,
    public readonly body: string,
  ) {
    super(`HTTP ${status} ${statusText}`);
    this.name = 'HttpError';
  }
}

type RequestOptions = {
  timeout?: number;
};

const doFetch = async (
  url: string,
  opts: RequestOptions,
): Promise<Response> => {
  const signal =
    opts.timeout !== undefined ? AbortSignal.timeout(opts.timeout) : undefined;
  const response = await fetch(url, { signal });
  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new HttpError(response.status, response.statusText, body);
  }
  return response;
};

export const getJson = async <T>(
  url: string,
  opts: RequestOptions = {},
): Promise<T> => {
  const response = await doFetch(url, opts);
  return (await response.json()) as T;
};

export const getText = async (
  url: string,
  opts: RequestOptions = {},
): Promise<string> => {
  const response = await doFetch(url, opts);
  return response.text();
};
