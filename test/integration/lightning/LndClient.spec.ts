import * as grpc from '@grpc/grpc-js';
import { randomBytes } from 'crypto';
import { readFileSync } from 'fs';
import Logger from '../../../lib/Logger';
import { getHexString, getUnixTime } from '../../../lib/Utils';
import { InvoiceFeature } from '../../../lib/lightning/LightningClient';
import LndClient from '../../../lib/lightning/LndClient';
import RoutingFee from '../../../lib/lightning/RoutingFee';
import {
  LightningClient,
  LightningService,
} from '../../../lib/proto/lnd/rpc_grpc_pb';
import {
  GetInfoResponse,
  Transaction,
  TransactionDetails,
} from '../../../lib/proto/lnd/rpc_pb';
import Sidecar from '../../../lib/sidecar/Sidecar';
import { getPort } from '../../Utils';
import { bitcoinClient, getBitcoinLndClient, lndDataPath } from '../Nodes';
import { sidecar, startSidecar } from '../sidecar/Utils';

describe('LndClient', () => {
  let bitcoinLndClient: LndClient;

  beforeAll(async () => {
    await startSidecar();

    await bitcoinClient.generate(1);
    bitcoinLndClient = await getBitcoinLndClient();
    await bitcoinLndClient.connect(false);

    await sidecar.connect(
      { on: jest.fn(), removeAllListeners: jest.fn() } as any,
      {} as any,
      false,
    );
  });

  afterAll(async () => {
    await Sidecar.stop();
    sidecar.disconnect();

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

      const decoded = await sidecar.decodeInvoiceOrOffer(invoice);
      expect(decoded.isExpired).toEqual(false);
      expect(
        getUnixTime() + expiry - decoded.expiryTimestamp,
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
      const dec = await sidecar.decodeInvoiceOrOffer(invoice);
      expect(getHexString(dec.descriptionHash!)).toEqual(
        getHexString(descriptionHash),
      );
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
      const dec = await sidecar.decodeInvoiceOrOffer(invoice);
      expect(dec.description).toBeUndefined();
      expect(getHexString(dec.descriptionHash!)).toEqual(
        getHexString(descriptionHash),
      );
    });
  });

  test('should decode invoices', async () => {
    const dec = await bitcoinLndClient.decodeInvoice(
      'lnbcrt210n1pnwd6jxsp5897fwndkvflqgexy7flgdpx338zewcspwq6nrg9n4ftqefwwj4kspp57s5k4n8sxdnc3c8sql2nsasp8tr25ghzcjuxjkztf8pm6fza4xhqdq8w3jhxaqxqyjw5qcqp2rzjqf9mghde3gm8qjyk0r5n899qt6j0kqt5wvp0rds85ps7cqzlvtw7zqqqdcqqqqgqqqqqqqlgqqqqqqgq2q9qxpqysgq0nr5fua6f5ltl5a9hnae5l7r02yrah24fy4suwzefrjrqwnnhyz3un79nwnma6f0ckk7qkrmyq030lf7vaj8spl46d4j33zr5gswgfcprcl5ag',
    );
    expect(dec.value).toEqual(21);
    expect(dec.cltvExpiry).toEqual(10);
    expect(dec.features).toEqual(new Set([InvoiceFeature.MPP]));
    expect(getHexString(dec.paymentHash)).toEqual(
      'f4296accf0336788e0f007d53876013ac6aa22e2c4b869584b49c3bd245da9ae',
    );
    expect(dec.destination).toEqual(
      '0335ac19eb7042b7a594999939fe26dddc501bff81fbcb49a0e3b6f5b5713084f2',
    );
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

    const bindPort = await new Promise((resolve) => {
      server.bindAsync(
        `${serverHost}:${serverPort}`,
        grpc.ServerCredentials.createSsl(null, [
          {
            cert_chain: readFileSync(`${lndDataPath(1)}/tls.cert`),
            private_key: readFileSync(`${lndDataPath(1)}/tls.key`),
          },
        ]),
        (_, port) => {
          resolve(port);
        },
      );
    });

    expect(bindPort).toEqual(serverPort);

    // Mock pubkey that the mock server will return
    const mockPubkey =
      '000000000000000000000000000000000000000000000000000000000000000000';

    // Update the mock to return this pubkey
    serviceImplementation['getInfo'] = async (
      _: any | null,
      callback: (error: any, res: GetInfoResponse) => void,
    ) => {
      const response = new GetInfoResponse();
      response.setIdentityPubkey(mockPubkey);
      callback(null, response);
    };

    // Connect to the mocked LND gRPC server
    const lndClient = new LndClient(
      Logger.disabledLogger,
      'MOCK',
      {
        pubkey: mockPubkey,
        host: serverHost,
        port: serverPort,
        certpath: `${lndDataPath(1)}/tls.cert`,
        macaroonpath: `${lndDataPath(1)}/data/chain/bitcoin/regtest/admin.macaroon`,
      },
      sidecar,
      new RoutingFee(Logger.disabledLogger),
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
