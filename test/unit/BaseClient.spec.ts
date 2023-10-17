import Logger from '../../lib/Logger';
import BaseClient from '../../lib/BaseClient';
import { ClientStatus } from '../../lib/consts/Enums';

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

      const name = 'test';
      const client = new BaseClient(Logger.disabledLogger, name);

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
      expect(spy).toHaveBeenCalledWith(`${name} status changed: ${status}`);
    },
  );

  test('should ignore setClientStatus with same status as already set', () => {
    const spy = jest.spyOn(Logger.disabledLogger, 'error');
    const client = new BaseClient(Logger.disabledLogger, '');

    client.setClientStatus(ClientStatus.Disconnected);

    expect(spy).toHaveBeenCalledTimes(0);
  });
});
