import * as grpc from 'grpc';
import getPort from 'get-port';
import { readFileSync } from 'fs';
import { randomBytes } from 'crypto';
import Logger from '../../../lib/Logger';
import { bitcoinLndClient, lndDataPath } from '../Nodes';
import LndClient from '../../../lib/lightning/LndClient';
import { LightningClient, LightningService } from '../../../lib/proto/lnd/rpc_grpc_pb';
import { GetInfoResponse, Transaction, TransactionDetails } from '../../../lib/proto/lnd/rpc_pb';

describe('LndClient', () => {
  beforeAll(async () => {
    await bitcoinLndClient.connect();
  });

  afterAll(async () => {
    bitcoinLndClient.disconnect();
  });

  test('should calculate payment fees', async () => {
    const calculatePaymentFee = bitcoinLndClient['calculatePaymentFee'];

    const bigInvoiceAmount = 8754398;
    let invoice = await bitcoinLndClient.addInvoice(bigInvoiceAmount);

    // Should use the payment fee ratio for big payments
    expect(calculatePaymentFee(invoice.paymentRequest)).toEqual(Math.ceil(bigInvoiceAmount * LndClient['maxPaymentFeeRatio']));

    // Should use the minimal payment fee for small payments
    invoice = await bitcoinLndClient.addInvoice(1);
    expect(calculatePaymentFee(invoice.paymentRequest)).toEqual(LndClient['minPaymentFee']);

    invoice = await bitcoinLndClient.addInvoice(0);
    expect(calculatePaymentFee(invoice.paymentRequest)).toEqual(LndClient['minPaymentFee']);
  });

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
      randomTransaction.setRawTxHex(randomBytes(randomDataLength / 2).toString('hex').substring(0, randomDataLength));

      response.addTransactions(randomTransaction);

      callback(null, response);
    };

    server.addService(LightningService, serviceImplementation);

    const serverHost = '127.0.0.1';
    const serverPort = await getPort();

    const bindPort = server.bind(`${serverHost}:${serverPort}`, grpc.ServerCredentials.createSsl(null,
      [{
        cert_chain: readFileSync(`${lndDataPath}/certificates/tls.cert`),
        private_key: readFileSync(`${lndDataPath}/certificates/tls.key`),
      }],
      false,
    ));

    expect(bindPort).toEqual(serverPort);

    server.start();

    // Connect to the mocked LND gRPC server
    const lndClient = new LndClient(
      Logger.disabledLogger,
      'MOCK',
      {
        host: serverHost,
        port: serverPort,
        certpath: `${lndDataPath}/certificates/tls.cert`,
        macaroonpath: `${lndDataPath}/macaroons/admin.macaroon`,
      },
    );
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
