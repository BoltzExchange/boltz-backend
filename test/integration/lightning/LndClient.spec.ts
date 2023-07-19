import * as grpc from '@grpc/grpc-js';
import { readFileSync } from 'fs';
import { getPort } from '../../Utils';
import Logger from '../../../lib/Logger';
import Database from '../../../lib/db/Database';
import LndClient from '../../../lib/lightning/LndClient';
import { bitcoinClient, bitcoinLndClient, lndDataPath } from '../Nodes';
import {
  LightningClient,
  LightningService,
} from '../../../lib/proto/lnd/rpc_grpc_pb';
import {
  GetInfoResponse,
  Transaction,
  TransactionDetails,
} from '../../../lib/proto/lnd/rpc_pb';

describe('LndClient', () => {
  const db = new Database(Logger.disabledLogger, Database.memoryDatabase);

  beforeAll(async () => {
    await db.init();
    await bitcoinClient.connect();
    await Promise.all([bitcoinLndClient.connect(), bitcoinClient.generate(1)]);
  });

  afterAll(async () => {
    bitcoinClient.disconnect();
    bitcoinLndClient.disconnect();

    await db.close();
  });

  test.each`
    fee                           | amount
    ${10000}                      | ${1000000}
    ${87544}                      | ${8754398}
    ${LndClient['paymentMinFee']} | ${0}
    ${LndClient['paymentMinFee']} | ${1}
  `(
    'should calculate payment fee $fee for invoice amount $amount',
    async ({ fee, amount }) => {
      expect(
        bitcoinLndClient['calculatePaymentFee'](
          (await bitcoinLndClient.addInvoice(amount)).paymentRequest,
        ),
      ).toEqual(fee);
    },
  );

  test('should handle messages longer than the default gRPC limit', async () => {
    // 4 MB is the default gRPC limit
    const defaultGrpcLimit = 1024 * 1024 * 4;

    // 10 MB
    const randomDataLength = 1024 * 1024 * 10;

    expect(randomDataLength).toBeGreaterThan(defaultGrpcLimit);

    // Mock a LND gRPC server
    const server = new grpc.Server();

    const serviceImplementation = {};

    // Define all needed methods of the LightningClient to work around gRPC throwing an error
    for (const method of Object.keys(LightningClient['service'])) {
      serviceImplementation[method] = async (_, callback) => {
        // "GetInfo" is the only call the LndClient is using on startup
        callback(null, new GetInfoResponse());
      };
    }

    serviceImplementation['getTransactions'] = async (_, callback) => {
      const response = new TransactionDetails();

      const randomTransaction = new Transaction();
      randomTransaction.setRawTxHex('f'.repeat(randomDataLength));

      response.addTransactions(randomTransaction);

      callback(null, response);
    };

    server.addService(LightningService, serviceImplementation);

    const serverHost = '127.0.0.1';
    const serverPort = await getPort();
    const maxPaymentFeeRatio = 0.03;

    const bindPort = await new Promise((resolve) => {
      server.bindAsync(
        `${serverHost}:${serverPort}`,
        grpc.ServerCredentials.createSsl(null, [
          {
            cert_chain: readFileSync(`${lndDataPath}/certificates/tls.cert`),
            private_key: readFileSync(`${lndDataPath}/certificates/tls.key`),
          },
        ]),
        (_, port) => {
          resolve(port);
        },
      );
    });

    expect(bindPort).toEqual(serverPort);

    server.start();

    // Connect to the mocked LND gRPC server
    const lndClient = new LndClient(Logger.disabledLogger, 'MOCK', {
      host: serverHost,
      port: serverPort,
      certpath: `${lndDataPath}/certificates/tls.cert`,
      macaroonpath: `${lndDataPath}/macaroons/admin.macaroon`,
      maxPaymentFeeRatio: maxPaymentFeeRatio,
    });
    await lndClient.connect(false);

    // This call will fetch "randomDataLength" of data
    // The default gRPC limit is 4 MB
    // Therefore, if this call does not throw, the default maximal receive message length was overwritten
    const response = await lndClient.getOnchainTransactions(0);

    // Sanity check that the received data was actually longer than the default gRPC limit
    expect(JSON.stringify(response).length).toBeGreaterThan(defaultGrpcLimit);

    lndClient.disconnect();
    server.forceShutdown();
  });
});
