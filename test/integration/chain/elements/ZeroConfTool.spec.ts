import express from 'express';
import http from 'http';
import Logger from '../../../../lib/Logger';
import ZeroConfTool from '../../../../lib/chain/elements/ZeroConfTool';
import { getPort } from '../../../Utils';

describe('ZeroConfTool', () => {
  let server: http.Server;
  let endpoint: string;

  let tool: ZeroConfTool;

  beforeAll(async () => {
    const app = express();
    app.use(
      express.json({
        verify(req, _, buf: Buffer, encoding: string) {
          if (buf && buf.length) {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            req.rawBody = buf.toString((encoding as BufferEncoding) || 'utf-8');
          }
        },
      }),
    );

    app.get('/accept', (_, res) => {
      res.json({
        node_types: {
          bridge: {
            seen: 21,
            total: 21,
          },
        },
      });
    });

    app.get('/timeout', (_, res) => {
      res.json({
        node_types: {
          bridge: {
            seen: 20,
            total: 21,
          },
        },
      });
    });

    const port = await getPort();
    server = app.listen(port);
    endpoint = `http://localhost:${port}`;
  });

  afterAll(() => {
    tool.stop();

    server.close();
  });

  test('should parse config', () => {
    tool = new ZeroConfTool(Logger.disabledLogger, {
      endpoint,
    });
    tool.stop();

    expect(tool['maxRetries']).toEqual(60);
    expect(tool['retryDelay']).toEqual(100);

    tool = new ZeroConfTool(Logger.disabledLogger, {
      endpoint,
      interval: 250,
      maxRetries: 2,
    });
    expect(tool['maxRetries']).toEqual(2);
    expect(tool['retryDelay']).toEqual(250);
  });

  test('should accept transactions', async () => {
    await expect(
      tool.checkTransaction({
        getId: jest.fn().mockReturnValue('accept'),
      } as any),
    ).resolves.toEqual(true);

    expect(tool['toCheck'].size).toEqual(0);

    expect(tool.listenerCount('accepted')).toEqual(0);
    expect(tool.listenerCount('timeout')).toEqual(0);
  });

  test('should timeout after max retries', async () => {
    await expect(
      tool.checkTransaction({
        getId: jest.fn().mockReturnValue('timeout'),
      } as any),
    ).resolves.toEqual(false);

    expect(tool['toCheck'].size).toEqual(0);

    expect(tool.listenerCount('accepted')).toEqual(0);
    expect(tool.listenerCount('timeout')).toEqual(0);
  });

  test('should be able to handle multiple transactions', async () => {
    await expect(
      Promise.all([
        tool.checkTransaction({
          getId: jest.fn().mockReturnValue('timeout'),
        } as any),
        tool.checkTransaction({
          getId: jest.fn().mockReturnValue('accept'),
        } as any),
      ]),
    ).resolves.toEqual([false, true]);

    expect(tool['toCheck'].size).toEqual(0);

    expect(tool.listenerCount('accepted')).toEqual(0);
    expect(tool.listenerCount('timeout')).toEqual(0);
  });

  test('should bubble up errors', async () => {
    await expect(
      tool.checkTransaction({
        getId: jest.fn().mockReturnValue('notFound'),
      } as any),
    ).rejects.toEqual(expect.anything());

    expect(tool['toCheck'].size).toEqual(0);

    expect(tool.listenerCount('accepted')).toEqual(0);
    expect(tool.listenerCount('timeout')).toEqual(0);
  });
});
