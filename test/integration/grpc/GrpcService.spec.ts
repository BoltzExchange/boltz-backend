import fs from 'fs';
import { expect } from 'chai';
import { mock, instance } from 'ts-mockito';
import { ClientReadableStream } from 'grpc';
import GrpcClient from '../GrpcClient';
import Logger from '../../../lib/Logger';
import Service from '../../../lib/service/Service';
import GrpcService from '../../../lib/grpc/GrpcService';
import GrpcServer, { GrpcConfig } from '../../../lib/grpc/GrpcServer';
import { SubscribeTransactionsResponse } from '../../../lib/proto/boltzrpc_pb';
import { waitForFunctionToBeTrue } from '../../Utils';

// Because the gRPC types are really hard to mock,
// integration tests are used to test the gRPC functionality
describe('GrpcService', () => {
  const grpcConfig: GrpcConfig = {
    host: '127.0.0.1',
    port: 9000,
    certpath: 'tls.cert',
    keypath: 'tls.key',
  };

  const service = new GrpcService(instance(mock(Service)));
  const server = new GrpcServer(Logger.disabledLogger, service, grpcConfig);

  const client = new GrpcClient(grpcConfig);

  before(async () => {
    server.listen();
    client.init();
  });

  it('should remove closed subscriptions', async () => {
    const serverSubscriptions = service['transactionSubscriptions'];
    const clientSubscriptions: ClientReadableStream<SubscribeTransactionsResponse>[] = [];

    for (let i = 0; i < 10; i += 1) {
      clientSubscriptions.push(client.subscribeTransactions());
    }

    await waitForFunctionToBeTrue(() => {
      return serverSubscriptions.length === clientSubscriptions.length;
    });

    const indexToRemove = 4;

    const serverSubscription = serverSubscriptions[indexToRemove];

    serverSubscription.end();

    await waitForFunctionToBeTrue(() => {
      return serverSubscriptions.length === clientSubscriptions.length - 1;
    });

    expect(serverSubscriptions.includes(serverSubscription)).to.be.false;
  });

  after(async () => {
    const deleteFile = (path: string) => {
      if (fs.existsSync(path)) {
        fs.unlinkSync(path);
      }
    };

    deleteFile(grpcConfig.keypath);
    deleteFile(grpcConfig.certpath);
  });
});
