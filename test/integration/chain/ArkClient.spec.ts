import Logger from '../../../lib/Logger';
import ArkClient from '../../../lib/chain/ArkClient';

describe('ArkClient', () => {
  const client = new ArkClient(Logger.disabledLogger, {
    host: '127.0.0.1',
    port: 7000,
  });

  test('should connect to the Ark node', async () => {
    await expect(client.connect()).resolves.toBe(true);
  });

  test('should get addresses', async () => {
    const address = await client.getAddress();
    expect(address.boardingAddress).toBeDefined();
    expect(address.boardingAddress.startsWith('bcrt')).toEqual(true);

    expect(address.address).toBeDefined();
    expect(address.address.startsWith('tark')).toEqual(true);

    expect(address.publicKey).toBeDefined();
  });
});
