import fs from 'fs';
import { expect } from 'chai';
import { mock, instance, when, anything } from 'ts-mockito';
import { ClientReadableStream } from 'grpc';
import GrpcClient from '../GrpcClient';
import Logger from '../../../lib/Logger';
import Service from '../../../lib/service/Service';
import { waitForFunctionToBeTrue } from '../../Utils';
import GrpcService from '../../../lib/grpc/GrpcService';
import EventHandler from '../../../lib/service/EventHandler';
import GrpcServer, { GrpcConfig } from '../../../lib/grpc/GrpcServer';
import {
  SubscribeTransactionsRequest,
  SubscribeTransactionsResponse,
  SubscribeChannelBackupsRequest,
  ChannelBackup,
} from '../../../lib/proto/boltzrpc_pb';

// Because the gRPC types are really hard to mock,
// integration tests are used to test the gRPC functionality
describe('GrpcService', () => {
  let emitChannelBackup: any;

  const grpcConfig: GrpcConfig = {
    host: '127.0.0.1',
    port: 9000,
    certpath: 'tls.cert',
    keypath: 'tls.key',
  };

  const eventHandlerMock = mock(EventHandler);
  when(eventHandlerMock.on('channel.backup', anything())).thenCall((_, callback) => {
    emitChannelBackup = callback;
  });

  const serviceMock = mock(Service);
  when(serviceMock.eventHandler).thenReturn(instance(eventHandlerMock));

  const serviceInstance = instance(serviceMock);

  const service = new GrpcService(serviceInstance);
  const server = new GrpcServer(Logger.disabledLogger, service, grpcConfig);

  const client = new GrpcClient(grpcConfig);

  before(async () => {
    server.listen();
    client.init();
  });

  it('should stream channel backups', async () => {
    const currency = 'BTC';
    // tslint:disable-next-line: max-line-length
    const multiChannelBackup = '8d6d01a2e004fdccafff7fe986f62acf264046a802c44ce24655c9defdd0de86dd5e4f09e1e776d5dc570821f7731143ab6fa3775a6e0f6dbd42ebcf0e1c78a0d1b73630b9378cf166a3cfa8435f14056b067c54e2d9ece6ea04482de973fa844d90f1bc0ef7d14a9d81d2e26ce4a9cc3f1e0c54f12125fdacc22fd6759ee5a0fd6b9996486716c8d5af482adf217cacb5087ccad9d38ac1202e7fd8ebbae1a1556be5df79d53bb880be8739cfa25106711436c316a56a1ea9ed81e7192fc0a7e6e126a63d6820173800599dcb70c653ecf59b9195131b2cbb41f12ba324deb36ab7858eeb41e661627e3e4b307a69222dabc9b4de3daf2d0ca883ed9d9a0a43317c468a3831c4c27f92541b2484982105a7f70643f6680d298c075cda9089c379ed0db49fd895a8640c8172debd33afbc9639a1644613d28049834c10ca713016768dd6861da78a448917394efb65c35dc7d5b418883bdfd4a5c66185ff76fdc629357cbef376db67985be587aad4569a725dacc0cea169e3eb7a864cec3e7d3553273e12d6816bba832c3c2fa772a2575e5af6e10e525f7d7bea33b88a3d5e4e6192cd300ddbab3a84e601ee629f6174f87a83f5fd0a991e675140920dde921f9604ea84c7219dfb9f92d9b02723ebac2f366c6bb6a3ed05b6ce2dedf94b57a5bce1619c0e88da45d176d8e0b0899352796251e51c45c7be3b33f822a21270d70edbccc58f7451febf577212888ee3251d0c13f79219f8700cdc6aa51a6c76a417ed8b349a59fd9b97bf10ca202bf6f59e4e744667d0831071a26777dedb0e0860bfef36357e36566284e5ca9d59c0f8b0faa32e9a3cff3e62c89c99b515bc71deeb744efbcfb66ea191eac2cf5632a05b2b57e9bcfebf4da389e764e1ceb8ea36df91847acd7de342461ae5c1efa2f4659874159e6c5c3ecee3120e71344667a899ccfbf6e76890b347506ce25083c18bca7cf42015d0b6fe71c90d67a19a1f100e730e63a3e918e17bf5f97725d8e8d2128b97d4858fcb76d22b77ebeb1b2b73ab99390b340e2d68e97c7cbe10b71406cae7ed83997d64255c004d88dd9b623b4f2540b202d2c38bfe182de945c5c97067b4d114eb269f7b991dd9c0233404d6a5e976e5a3345304c74198d6c0e114de1240a3691762cffda4f20e85ef0a9c3221775dc7d6df5c93ece57af61d02516d98b09407c356ce38a9a2ddba3dd64bf3b1b2e6b9eee303c7fd4f604add09ca3a52428a255533728facf1cfaf6090e4fbb11f71f408b4f5fc5f53ed44c71e137e759219d50ada32ba06167ddc7a3e611c02ecbf67d3c012c61f26dca4e7bc6d267d6c6529bcf2762a56ad7ce7b81b68d424887cf49837060da202f0d939887cc7cd71ff74ad940848330a0a4d4b35770ca1bb8f9b38094888445cbdc589ff8eb65084d9b6ca17ced693c0db4032b959c72cc0a00e3d7c76919170f4059ebb3135129b57d569ef42f6a309dbe7d799b764991dd53fae2cddd7ba89586882ef13e4c17c3f574e2a859e8e63d2b4fab47d3e5a3a9f2ff280e25cf4983591c9491ed9dcc7e88fc33f175ac39bccf604fdb5a9161612bd1aae102706b046c14c634a1e27667293022368c5fcf41f123c1b0f1c1358d5d629d3ce241fdf29bbd56890cf4a67107f239fad2d59';

    const subscription = client.boltz.subscribeChannelBackups(new SubscribeChannelBackupsRequest());

    await waitForFunctionToBeTrue(() => {
      return service['channelBackupSubscriptions'].length === 1;
    });

    let eventEmitted = false;

    subscription.on('data', (channelBackup: ChannelBackup) => {
      expect(channelBackup.getCurrency()).to.be.equal(currency);
      expect(channelBackup.getMultiChannelBackup()).to.be.equal(multiChannelBackup);

      eventEmitted = true;
    });

    emitChannelBackup(currency, multiChannelBackup);

    await waitForFunctionToBeTrue(() => {
      return eventEmitted;
    });
  });

  it('should remove closed subscriptions', async () => {
    const serverSubscriptions = service['transactionSubscriptions'];
    const clientSubscriptions: ClientReadableStream<SubscribeTransactionsResponse>[] = [];

    for (let i = 0; i < 10; i += 1) {
      clientSubscriptions.push(
        client.boltz.subscribeTransactions(new SubscribeTransactionsRequest(), client),
      );
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
