import * as grpc from '@grpc/grpc-js';
import { readFileSync } from 'fs';
import { getPort } from '../../Utils';
import Logger from '../../../lib/Logger';
import LndClient from '../../../lib/lightning/LndClient';
import PaymentClient from '../../../lib/lightning/PaymentClient';
import { bitcoinLndClient, bitcoinLndClientConfig, lndDataPath } from '../Nodes';
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
    const calculatePaymentFee = bitcoinLndClient.paymentClient['calculatePaymentFee'];

    const bigInvoiceAmount = 8754398;
    const maxPaymentFeeRatio = 0.03;
    let invoice = await bitcoinLndClient.invoiceClient.addInvoice(bigInvoiceAmount);

    // Should use the payment fee ratio for big payments
    expect(calculatePaymentFee(invoice.paymentRequest)).toEqual(Math.ceil(bigInvoiceAmount * maxPaymentFeeRatio));

    // Should use the minimal payment fee for small payments
    invoice = await bitcoinLndClient.invoiceClient.addInvoice(1);
    expect(calculatePaymentFee(invoice.paymentRequest)).toEqual(PaymentClient['minPaymentFee']);

    invoice = await bitcoinLndClient.invoiceClient.addInvoice(0);
    expect(calculatePaymentFee(invoice.paymentRequest)).toEqual(PaymentClient['minPaymentFee']);
  });

  test('should set default payment fee ratio', () => {
    expect(bitcoinLndClient.paymentClient['maxPaymentFeeRatio']).toEqual(PaymentClient['defaultPaymentFeeRatio']);

    let client = new LndClient(Logger.disabledLogger, 'MOCK', {
      ...bitcoinLndClientConfig,
      maxPaymentFeeRatio: 0,
    });
    expect(client.paymentClient['maxPaymentFeeRatio']).toEqual(PaymentClient['defaultPaymentFeeRatio']);

    client = new LndClient(Logger.disabledLogger, 'MOCK', {
      ...bitcoinLndClientConfig,
      maxPaymentFeeRatio: 1,
    });
    expect(client.paymentClient['maxPaymentFeeRatio']).toEqual(1);

    client = new LndClient(Logger.disabledLogger, 'MOCK', {
      ...bitcoinLndClientConfig,
      maxPaymentFeeRatio: undefined as any,
    });
    expect(client['maxPaymentFeeRatio']).toEqual(LndClient['defaultPaymentFeeRatio']);
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
      randomTransaction.setRawTxHex('f'.repeat(randomDataLength));

      response.addTransactions(randomTransaction);

      callback(null, response);
    };

    server.addService(LightningService, serviceImplementation);

    const serverHost = '127.0.0.1';
    const serverPort = await getPort();
    const maxPaymentFeeRatio = 0.03;

    const bindPort = await new Promise((resolve) => {
      server.bindAsync(`${serverHost}:${serverPort}`, grpc.ServerCredentials.createSsl(null,
        [{
          cert_chain: readFileSync(`${lndDataPath}/certificates/tls.cert`),
          private_key: readFileSync(`${lndDataPath}/certificates/tls.key`),
        }]),
        (_, port) => {
          resolve(port);
        },
      );
    });

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
        maxPaymentFeeRatio: maxPaymentFeeRatio,
      },
    );
    await lndClient.connect(false);

    // This call will fetch "randomDataLength" of data
    // The default gRPC limit is 4 MB
    // Therefore, if this call does not throw, the default maximal receive message length was overwritten
    const response = await lndClient.routerClient.getOnchainTransactions(0);

    // Sanity check that the received data was actually longer than the default gRPC limit
    expect(JSON.stringify(response).length).toBeGreaterThan(defaultGrpcLimit);

    lndClient.disconnect();
    server.forceShutdown();
  });
});
