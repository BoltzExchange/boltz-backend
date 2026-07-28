import fs from 'fs';
import os from 'os';
import path from 'path';
import Logger from '../../../lib/Logger';
import { getHexBuffer, getHexString } from '../../../lib/Utils';
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

  describe('createVHtlc', () => {
    const blockHeight = 100;
    const refundDelay = 21;

    const preimageHash = getHexBuffer(
      '6b0d0275c597a18cfcc23261a62e095e2ba12ac5c866823d2926912806a5b10a',
    );
    const claimPublicKey = getHexBuffer(
      '026c94d2958888e70fd32349b3c195803976e0865a54ab1755f19c2c820fcbafa8',
    );

    const createClient = () => {
      const client = new ArkClient(
        Logger.disabledLogger,
        {
          host: '127.0.0.1',
          port: 7000,
        },
        mockSidecar as any,
      );
      client['chainClient'] = {
        symbol: 'BTC',
        getBlockchainInfo: jest.fn().mockResolvedValue({ blocks: blockHeight }),
      } as any;

      const grpcClient = {
        createVhtlc: jest.fn((_req, _metadata, callback) =>
          callback(null, { address: 'arkAddress' }),
        ),
      };
      client['client'] = grpcClient as any;

      return { client, grpcClient };
    };

    test('should pass nonInteractiveClaim in the request', async () => {
      const { client, grpcClient } = createClient();
      const nonInteractiveClaim = { claimAddress: 'tark1address' };

      const { timeouts } = await client.createVHtlc(
        preimageHash,
        refundDelay,
        claimPublicKey,
        undefined,
        nonInteractiveClaim,
      );

      expect(grpcClient.createVhtlc).toHaveBeenCalledTimes(1);
      const req = grpcClient.createVhtlc.mock.calls[0][0];
      expect(req.nonInteractiveClaim).toEqual(nonInteractiveClaim);
      expect(req.receiverPubkey).toEqual(getHexString(claimPublicKey));
      expect(req.senderPubkey).toEqual('');
      expect(req.refundLocktime).toEqual(blockHeight + refundDelay);

      expect(timeouts.refund).toEqual(blockHeight + refundDelay);
    });

    test('should leave nonInteractiveClaim undefined when not set', async () => {
      const { client, grpcClient } = createClient();

      await client.createVHtlc(preimageHash, refundDelay, claimPublicKey);

      expect(grpcClient.createVhtlc).toHaveBeenCalledTimes(1);
      expect(
        grpcClient.createVhtlc.mock.calls[0][0].nonInteractiveClaim,
      ).toBeUndefined();
    });
  });

  describe('isOwnServerKey', () => {
    const xOnly =
      'e35799157be4b37565bb5afe4d04e6a0fa0a4b6a4f4e48b0d904685d253cdbdb';
    const otherXOnly =
      'aa5799157be4b37565bb5afe4d04e6a0fa0a4b6a4f4e48b0d904685d253cdbdb';

    const createClient = (signerPubkey: Buffer) => {
      const client = new ArkClient(
        Logger.disabledLogger,
        {
          host: '127.0.0.1',
          port: 7000,
        },
        mockSidecar as any,
      );
      client.signerPubkey = signerPubkey;

      return client;
    };

    test.each`
      name                                             | signerPubkey          | serverPubKey          | expected
      ${'x-only signer and x-only key'}                | ${xOnly}              | ${xOnly}              | ${true}
      ${'compressed even signer and x-only key'}       | ${`02${xOnly}`}       | ${xOnly}              | ${true}
      ${'compressed odd signer and x-only key'}        | ${`03${xOnly}`}       | ${xOnly}              | ${true}
      ${'x-only signer and compressed even key'}       | ${xOnly}              | ${`02${xOnly}`}       | ${true}
      ${'x-only signer and compressed odd key'}        | ${xOnly}              | ${`03${xOnly}`}       | ${true}
      ${'compressed signer and compressed key'}        | ${`02${xOnly}`}       | ${`02${xOnly}`}       | ${true}
      ${'compressed keys with different parity bytes'} | ${`02${xOnly}`}       | ${`03${xOnly}`}       | ${true}
      ${'different x-only keys'}                       | ${xOnly}              | ${otherXOnly}         | ${false}
      ${'different compressed keys'}                   | ${`02${xOnly}`}       | ${`02${otherXOnly}`}  | ${false}
      ${'empty signer key'}                            | ${''}                 | ${xOnly}              | ${false}
      ${'empty key'}                                   | ${xOnly}              | ${''}                 | ${false}
      ${'truncated key'}                               | ${xOnly}              | ${xOnly.slice(0, 62)} | ${false}
      ${'truncated signer key'}                        | ${xOnly.slice(0, 62)} | ${xOnly}              | ${false}
    `(
      'should return $expected for $name',
      ({ signerPubkey, serverPubKey, expected }) => {
        expect(
          createClient(getHexBuffer(signerPubkey)).isOwnServerKey(
            getHexBuffer(serverPubKey),
          ),
        ).toEqual(expected);
      },
    );

    test('should return false when signer key is not initialized', () => {
      const client = createClient(undefined as any);

      expect(client.isOwnServerKey(getHexBuffer(xOnly))).toEqual(false);
    });
  });
});
