import BaseClient from '../../lib/BaseClient';
import Logger from '../../lib/Logger';
import { ClientStatus } from '../../lib/consts/Enums';

class BaseClientTest extends BaseClient {
  constructor(symbol: string) {
    super(Logger.disabledLogger, symbol);
  }

  public serviceName = (): string => {
    return 'Test';
  };
}

class BaseClientTestWithId extends BaseClient {
  constructor(symbol: string, id: string, alias?: string) {
    super(Logger.disabledLogger, symbol);
    this.id = id;
    this.alias = alias;
  }

  public serviceName = (): string => {
    return 'LND';
  };
}

describe('BaseClient', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test.each`
    status                       | statusFunc          | loggerFunc
    ${ClientStatus.Connected}    | ${'isConnected'}    | ${'info'}
    ${ClientStatus.OutOfSync}    | ${'isOutOfSync'}    | ${'error'}
    ${ClientStatus.Disconnected} | ${'isDisconnected'} | ${'error'}
  `(
    'should emit and log on state change to $status',
    async ({ status, statusFunc, loggerFunc }) => {
      const spy = jest.spyOn(Logger.disabledLogger, loggerFunc);

      const symbol = 'BTC';
      const client = new BaseClientTest(symbol);

      // To not have it ignore the status update by the new status being the same
      client['status'] =
        status === ClientStatus.Disconnected
          ? ClientStatus.Connected
          : ClientStatus.Disconnected;

      const emitPromise = new Promise<ClientStatus>((resolve) =>
        client.on('status.changed', (emitStatus: ClientStatus) =>
          resolve(emitStatus),
        ),
      );

      client.setClientStatus(status);

      expect(await emitPromise).toEqual(status);

      expect(client[statusFunc]()).toEqual(true);
      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith(
        `${client.serviceName()}-${symbol} status changed: ${status}`,
      );
    },
  );

  test('should ignore setClientStatus with same status as already set', () => {
    const spy = jest.spyOn(Logger.disabledLogger, 'error');
    const client = new BaseClientTest('');

    client.setClientStatus(ClientStatus.Disconnected);

    expect(spy).not.toHaveBeenCalled();
  });

  test('should include full node ID in log message when id is set', () => {
    const spy = jest.spyOn(Logger.disabledLogger, 'info');
    const nodeId =
      '02a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3';
    const client = new BaseClientTestWithId('BTC', nodeId);

    client['status'] = ClientStatus.Disconnected;
    client.setClientStatus(ClientStatus.Connected);

    expect(spy).toHaveBeenCalledWith(
      `LND-BTC (${nodeId}) status changed: ${ClientStatus.Connected}`,
    );
  });

  test('should not include ID in log message when id is "self"', () => {
    const spy = jest.spyOn(Logger.disabledLogger, 'info');
    const client = new BaseClientTestWithId('BTC', 'self');

    client['status'] = ClientStatus.Disconnected;
    client.setClientStatus(ClientStatus.Connected);

    expect(spy).toHaveBeenCalledWith(
      `LND-BTC status changed: ${ClientStatus.Connected}`,
    );
  });

  test('should include alias in log message when alias is set', () => {
    const spy = jest.spyOn(Logger.disabledLogger, 'info');
    const client = new BaseClientTestWithId('BTC', '', 'my-node');

    client['status'] = ClientStatus.Disconnected;
    client.setClientStatus(ClientStatus.Connected);

    expect(spy).toHaveBeenCalledWith(
      `LND-BTC (my-node) status changed: ${ClientStatus.Connected}`,
    );
  });

  test('should prefer alias over id in log message when both are set', () => {
    const spy = jest.spyOn(Logger.disabledLogger, 'info');
    const nodeId =
      '02a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3';
    const client = new BaseClientTestWithId('BTC', nodeId, 'my-node');

    client['status'] = ClientStatus.Disconnected;
    client.setClientStatus(ClientStatus.Connected);

    expect(spy).toHaveBeenCalledWith(
      `LND-BTC (my-node) status changed: ${ClientStatus.Connected}`,
    );
  });
});
