import fs from 'fs';
import os from 'os';
import path from 'path';
import Logger from '../../../lib/Logger';
import ArkClient from '../../../lib/chain/ArkClient';

describe('ArkClient', () => {
  const mockSidecar = {
    on: jest.fn(),
    removeListener: jest.fn(),
  };

  let tempDir: string;

  beforeEach(() => {
    jest.clearAllMocks();
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'boltz-ark-client-test-'));
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  test('loads configured macaroon metadata for unary calls', async () => {
    const macaroonHex = 'deadbeef';
    const macaroonPath = path.join(tempDir, 'admin.macaroon');
    fs.writeFileSync(macaroonPath, Buffer.from(macaroonHex, 'hex'));

    const client = new ArkClient(
      Logger.disabledLogger,
      {
        host: '127.0.0.1',
        port: 7000,
        macaroonpath: macaroonPath,
      },
      mockSidecar as any,
    );

    const grpcClient = {
      getInfo: jest.fn((_params, _metadata, callback) =>
        callback(null, { pubkey: '02' }),
      ),
    };
    client['client'] = grpcClient as any;

    await client.getInfo();

    expect(grpcClient.getInfo).toHaveBeenCalledTimes(1);
    expect(grpcClient.getInfo.mock.calls[0][1].get('macaroon')).toEqual([
      macaroonHex,
    ]);
  });

  test('throws when configured macaroon file does not exist', () => {
    expect(
      () =>
        new ArkClient(
          Logger.disabledLogger,
          {
            host: '127.0.0.1',
            port: 7000,
            macaroonpath: path.join(tempDir, 'missing.macaroon'),
          },
          mockSidecar as any,
        ),
    ).toThrow('could not find configured macaroon file for Fulmine ARK');
  });
});
