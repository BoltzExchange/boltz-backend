import type {
  CreatedVHtlc,
  SpentVHtlc,
} from '../../../lib/chain/ArkSubscription';
import TransactionLabelRepository from '../../../lib/db/repositories/TransactionLabelRepository';
import type * as notificationrpc from '../../../lib/proto/ark/notification_pb';
import { arkClient, bitcoinClient } from '../Nodes';
import { createVHtlc } from './Utils';

TransactionLabelRepository.addLabel = jest.fn();

describe('ArkSubscription', () => {
  beforeAll(async () => {
    await bitcoinClient.connect();
    await arkClient.connect(bitcoinClient);
  });

  beforeEach(() => {
    jest.clearAllMocks();
    arkClient.removeAllListeners();
  });

  afterAll(() => {
    arkClient.disconnect();
    bitcoinClient.disconnect();
  });

  test('should subscribe to addresses', async () => {
    const vHtlcOne = await createVHtlc(arkClient, undefined, arkClient.pubkey);
    const vHtlcTwo = await createVHtlc(arkClient, undefined, arkClient.pubkey);

    const addresses = [vHtlcOne, vHtlcTwo].map((vHtlc) => ({
      address: vHtlc.vHtlc.address,
      vHtlcId: vHtlc.vHtlc.id,
    }));

    const spy = jest
      .spyOn(arkClient.subscription as any, 'unaryNotificationCall')
      .mockResolvedValue({});

    await arkClient.subscription.subscribeAddresses(addresses);

    expect(
      arkClient.subscription['subscribedAddresses'].get(addresses[0].address),
    ).toEqual(addresses[0].vHtlcId);
    expect(
      arkClient.subscription['subscribedAddresses'].get(addresses[1].address),
    ).toEqual(addresses[1].vHtlcId);

    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith(
      'subscribeForAddresses',
      expect.any(Object),
    );

    const callArgs = spy.mock.calls[0];
    const request = callArgs[1] as notificationrpc.SubscribeForAddressesRequest;
    expect(request.getAddressesList()).toEqual([
      addresses[0].address,
      addresses[1].address,
    ]);

    spy.mockRestore();
  });

  test('should unsubscribe from address', async () => {
    const vHtlc = await createVHtlc(arkClient, undefined, arkClient.pubkey);

    await arkClient.subscription.subscribeAddresses([
      {
        address: vHtlc.vHtlc.address,
        vHtlcId: vHtlc.vHtlc.id,
      },
    ]);

    expect(
      arkClient.subscription['subscribedAddresses'].get(vHtlc.vHtlc.address),
    ).toEqual(vHtlc.vHtlc.id);

    const spy = jest
      .spyOn(arkClient.subscription as any, 'unaryNotificationCall')
      .mockResolvedValue({});

    await arkClient.subscription.unsubscribeAddress(vHtlc.vHtlc.address);

    expect(
      arkClient.subscription['subscribedAddresses'].has(vHtlc.vHtlc.address),
    ).toEqual(false);

    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith(
      'unsubscribeForAddresses',
      expect.any(Object),
    );

    const callArgs = spy.mock.calls[0];
    const request =
      callArgs[1] as notificationrpc.UnsubscribeForAddressesRequest;
    expect(request.getAddressesList()).toEqual([vHtlc.vHtlc.address]);

    spy.mockRestore();
  });

  describe('streamVhtlcs', () => {
    test('should forward vHTLC created events', async () => {
      const vHtlc = await createVHtlc(arkClient, undefined, arkClient.pubkey);

      await arkClient.subscription.subscribeAddresses([
        {
          address: vHtlc.vHtlc.address,
          vHtlcId: vHtlc.vHtlc.id,
        },
      ]);

      const emitPromise = new Promise<CreatedVHtlc>((resolve) => {
        arkClient.subscription.on('vhtlc.created', (event) => {
          if (event.address === vHtlc.vHtlc.address) {
            resolve(event);
            arkClient.subscription.removeAllListeners('vhtlc.created');
          }
        });
      });

      const amount = 10_000;
      const transactionId = await arkClient.sendOffchain(
        vHtlc.vHtlc.address,
        amount,
        'test',
      );

      const funded = await emitPromise;
      expect(funded.amount).toEqual(amount);
      expect(funded.address).toEqual(vHtlc.vHtlc.address);
      expect(funded.txId).toEqual(transactionId);
    });

    test('should forward vHTLC spent events', async () => {
      const vHtlc = await createVHtlc(arkClient, undefined, arkClient.pubkey);

      await arkClient.subscription.subscribeAddresses([
        {
          address: vHtlc.vHtlc.address,
          vHtlcId: vHtlc.vHtlc.id,
        },
      ]);

      const emitPromise = new Promise<SpentVHtlc>((resolve) => {
        arkClient.subscription.once('vhtlc.spent', (vHtlc) => {
          resolve(vHtlc);
        });
      });

      const amount = 10_000;
      await arkClient.sendOffchain(vHtlc.vHtlc.address, amount, 'test');
      await arkClient.claimVHtlc(
        vHtlc.preimage,
        arkClient.pubkey,
        arkClient.pubkey,
        'test',
      );

      await emitPromise;
    });
  });

  describe('rescan', () => {
    test('should emit vHTLC created events', async () => {
      const vHtlc = await createVHtlc(arkClient, undefined, arkClient.pubkey);

      const emitPromise = new Promise<CreatedVHtlc>((resolve) => {
        arkClient.subscription.on('vhtlc.created', (event) => {
          if (event.address === vHtlc.vHtlc.address) {
            resolve(event);
          }
        });
      });

      const amount = 10_000;
      const transactionId = await arkClient.sendOffchain(
        vHtlc.vHtlc.address,
        amount,
        'test',
      );

      await arkClient.subscription.subscribeAddresses([
        {
          address: vHtlc.vHtlc.address,
          vHtlcId: vHtlc.vHtlc.id,
        },
      ]);

      await arkClient.subscription.rescan();

      const rescanned = await emitPromise;
      expect(rescanned.amount).toEqual(amount);
      expect(rescanned.address).toEqual(vHtlc.vHtlc.address);
      expect(rescanned.txId).toEqual(transactionId);
    });

    test('should emit vHTLC spent events', async () => {
      const vHtlc = await createVHtlc(arkClient, undefined, arkClient.pubkey);

      const amount = 10_000;
      await arkClient.sendOffchain(vHtlc.vHtlc.address, amount, 'test');
      await arkClient.claimVHtlc(
        vHtlc.preimage,
        arkClient.pubkey,
        arkClient.pubkey,
        'test',
      );

      await arkClient.subscription.subscribeAddresses([
        {
          address: vHtlc.vHtlc.address,
          vHtlcId: vHtlc.vHtlc.id,
        },
      ]);

      const emitPromise = new Promise<SpentVHtlc>((resolve) => {
        arkClient.subscription.once('vhtlc.spent', (vHtlc) => {
          resolve(vHtlc);
        });
      });

      await arkClient.subscription.rescan();

      await emitPromise;
    });
  });
});
