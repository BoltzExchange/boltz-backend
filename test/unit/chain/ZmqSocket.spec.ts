import { Publisher } from 'zeromq';
import Logger from '../../../lib/Logger';
import { sleep } from '../../../lib/PromiseUtils';
import ZmqSocket from '../../../lib/chain/ZmqSocket';
import { getPort } from '../../Utils';

describe('ZmqSocket', () => {
  const filter = 'rawtx';

  const createSocket = async () => {
    const pub = new Publisher();
    const port = await getPort();
    const address = `tcp://127.0.0.1:${port}`;

    await pub.bind(address);

    return {
      pub,
      address,
    };
  };

  test('should emit data', async () => {
    const { address, pub } = await createSocket();

    const socket = new ZmqSocket(
      Logger.disabledLogger,
      'BTC',
      filter,
      address,
      5_000,
    );

    socket.connect();

    const receivedPromise = new Promise<Buffer>((resolve) => {
      socket.on('data', (data) => {
        resolve(data);
        socket.removeAllListeners();
      });
    });

    await sleep(50);

    const message = Buffer.from('test');
    await pub.send([filter, message]);

    expect(await receivedPromise).toEqual(message);

    socket.disconnect();
    pub.close();
  });

  test('should reconnect after inactivity', async () => {
    const { address, pub } = await createSocket();

    const inactivityTimeout = 1_000;
    const socket = new ZmqSocket(
      Logger.disabledLogger,
      'BTC',
      filter,
      address,
      inactivityTimeout,
    );

    socket.connect();

    await sleep(inactivityTimeout + 100);

    expect(socket['disconnected']).toBe(true);

    await sleep(ZmqSocket['reconnectTimeoutMs'] - 10);

    const dataPromise = new Promise<Buffer>((resolve) => {
      socket.on('data', (data) => {
        resolve(data);
      });
    });
    const reconnectedPromise = new Promise<unknown>((resolve) => {
      socket.on('reconnected', () => {
        resolve(true);
      });
    });

    const message = Buffer.from('test');

    // Send some messages to make sure it reconnects
    for (let i = 0; i < 10; i++) {
      await pub.send([filter, message]);
      await sleep(100);
    }

    expect(socket['disconnected']).toBe(false);

    expect(await dataPromise).toEqual(message);
    expect(await reconnectedPromise).toBe(true);

    socket.removeAllListeners();
    socket.disconnect();
    pub.close();
  });
});
