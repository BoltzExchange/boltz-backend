import * as grpc from '@grpc/grpc-js';
import { randomBytes } from 'crypto';
import { readFileSync } from 'fs';
import Logger from '../../../lib/Logger';
import { decodeInvoice, getHexString, getUnixTime } from '../../../lib/Utils';
import LndClient from '../../../lib/lightning/LndClient';
import {
  LightningClient,
  LightningService,
} from '../../../lib/proto/lnd/rpc_grpc_pb';
import {
  GetInfoResponse,
  Transaction,
  TransactionDetails,
} from '../../../lib/proto/lnd/rpc_pb';
import InvoiceExpiryHelper from '../../../lib/service/InvoiceExpiryHelper';
import { getPort } from '../../Utils';
import { bitcoinClient, bitcoinLndClient, lndDataPath } from '../Nodes';

describe('LndClient', () => {
  beforeAll(async () => {
    await bitcoinClient.generate(1);
    await bitcoinLndClient.connect(false);
  });

  afterAll(async () => {
    await bitcoinClient.generate(1);

    bitcoinLndClient.removeAllListeners();
    bitcoinLndClient.disconnect();
    bitcoinLndClient.disconnect();
  });

  describe('addHoldInvoice', () => {
    test.each`
      expiry
      ${60}
      ${1200}
      ${3600}
      ${43200}
    `('should create invoices with expiry $expiry', async ({ expiry }) => {
      const invoice = await bitcoinLndClient.addHoldInvoice(
        10_000,
        randomBytes(32),
        undefined,
        expiry,
      );
      const { timestamp, timeExpireDate } = decodeInvoice(invoice);
      expect(
        getUnixTime() +
          expiry -
          InvoiceExpiryHelper.getInvoiceExpiry(timestamp, timeExpireDate),
      ).toBeLessThanOrEqual(5);
    });

    test('should create invoices with description hash', async () => {
      const descriptionHash = randomBytes(32);
      const invoice = await bitcoinLndClient.addHoldInvoice(
        1,
        randomBytes(32),
        undefined,
        undefined,
        undefined,
        descriptionHash,
      );
      const dec = decodeInvoice(invoice);
      expect(dec.descriptionHash).toEqual(getHexString(descriptionHash));
    });

    test('should prefer description hash over memo', async () => {
      const descriptionHash = randomBytes(32);
      const invoice = await bitcoinLndClient.addHoldInvoice(
        1,
        randomBytes(32),
        undefined,
        undefined,
        'test',
        descriptionHash,
      );
      const dec = decodeInvoice(invoice);
      expect(dec.description).toBeUndefined();
      expect(dec.descriptionHash).toEqual(getHexString(descriptionHash));
    });
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
      serviceImplementation[method] = async (
        _: any | null,
        callback: (error: any, res: GetInfoResponse) => void,
      ) => {
        // "GetInfo" is the only call the LndClient is using on startup
        callback(null, new GetInfoResponse());
      };
    }

    serviceImplementation['getTransactions'] = async (
      _: any | null,
      callback: (error: any, res: TransactionDetails) => void,
    ) => {
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

  describe('sendCoins', () => {
    test('should add label', async () => {
      const label = 'test sendCoins';
      const { address } = await bitcoinLndClient.newAddress();
      const { txid } = await bitcoinLndClient.sendCoins(
        address,
        100_000,
        undefined,
        label,
      );

      const { transactionsList } =
        await bitcoinLndClient.getOnchainTransactions(0);
      const transaction = transactionsList.find((tx) => tx.txHash === txid);

      expect(transaction).not.toBeUndefined();
      expect(transaction!.label).toEqual(label);
    });
  });

  describe('sweepWallet', () => {
    test('should add label', async () => {
      const label = 'test sweepWallet';
      const { address } = await bitcoinLndClient.newAddress();
      const { txid } = await bitcoinLndClient.sweepWallet(
        address,
        undefined,
        label,
      );

      const { transactionsList } =
        await bitcoinLndClient.getOnchainTransactions(0);
      const transaction = transactionsList.find((tx) => tx.txHash === txid);

      expect(transaction).not.toBeUndefined();
      expect(transaction!.label).toEqual(label);
    });
  });
});
