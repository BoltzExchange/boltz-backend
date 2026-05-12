import { Metadata } from '@grpc/grpc-js';
import { EventEmitter } from 'events';
import type Logger from '../../../lib/Logger';
import ArkClient from '../../../lib/chain/ArkClient';
import ArkSubscription from '../../../lib/chain/ArkSubscription';

class MockStream extends EventEmitter {
  public destroy = jest.fn();
  public cancel = jest.fn();
}

describe('ArkSubscription', () => {
  const mockLogger = {
    warn: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
    verbose: jest.fn(),
  };

  const client = {
    serviceName: () => 'ark',
    symbol: 'ARK',
  } as unknown as ArkClient;

  const createSubscription = (rescanIntervalSeconds?: number) => {
    const stream = new MockStream();
    const notificationClient = {
      getVtxoNotifications: jest.fn().mockReturnValue(stream),
    };
    const metadata = new Metadata();
    metadata.add('macaroon', 'deadbeef');
    const unaryCall = jest.fn();
    const unaryNotificationCall = jest.fn();

    const subscription = new ArkSubscription(
      mockLogger as unknown as Logger,
      client,
      notificationClient as any,
      metadata,
      unaryCall as any,
      unaryNotificationCall as any,
      rescanIntervalSeconds,
    );

    return {
      metadata,
      notificationClient,
      stream,
      unaryCall,
      unaryNotificationCall,
      subscription,
    };
  };

  beforeEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
  });

  test('ignores invalid notification addresses and still emits valid vHTLCs', () => {
    const { stream, subscription } = createSubscription();

    const created = jest.fn();
    subscription.on('vhtlc.created', created);

    const tweakedPubKey = Buffer.alloc(32, 1);
    jest
      .spyOn(ArkClient, 'decodeAddress')
      .mockImplementation((address: string) => {
        if (address === 'invalid-address') {
          throw new Error('invalid address');
        }

        return {
          serverPubKey: Buffer.alloc(32, 2),
          tweakedPubKey,
        };
      });

    (subscription as any).streamVhtlcs();

    stream.emit('data', {
      notification: {
        addresses: ['invalid-address', 'valid-address'],
        newVtxos: [
          {
            script: Buffer.concat([Buffer.alloc(2), tweakedPubKey]).toString(
              'hex',
            ),
            outpoint: {
              txid: 'txid',
              vout: 1,
            },
            amount: '21',
          },
        ],
        spentVtxos: [],
      },
    });

    expect(mockLogger.warn).toHaveBeenCalledWith(
      'Ignoring invalid notification ARK address invalid-address: invalid address',
    );
    expect(created).toHaveBeenCalledWith({
      address: 'valid-address',
      txId: 'txid',
      vout: 1,
      amount: 21,
    });
  });

  test('passes metadata when opening the vHTLC notification stream', () => {
    const { subscription, notificationClient, metadata } = createSubscription();

    (subscription as any).streamVhtlcs();

    expect(notificationClient.getVtxoNotifications).toHaveBeenCalledWith(
      {},
      metadata,
    );
  });

  test('skips subscribe call when address list is empty', async () => {
    const { subscription, unaryNotificationCall } = createSubscription();

    await subscription.subscribeAddresses([]);

    expect(unaryNotificationCall).not.toHaveBeenCalled();
  });

  test('skips unsubscribe call when address list is empty', async () => {
    const { subscription, unaryNotificationCall } = createSubscription();

    await subscription.unsubscribeAddresses([]);

    expect(unaryNotificationCall).not.toHaveBeenCalled();
  });

  test('getSubscribedVhtlcState returns empty state when no addresses are subscribed', async () => {
    const { subscription, unaryCall } = createSubscription();

    const state = await subscription.getSubscribedVhtlcState();

    expect(state).toEqual({ created: [], spent: [] });
    expect(unaryCall).not.toHaveBeenCalled();
  });

  test('batches unsubscribe requests for multiple addresses', async () => {
    const { subscription, unaryNotificationCall } = createSubscription();

    await subscription.subscribeAddresses([
      {
        address: 'address-one',
        vHtlcId: 'vhtlc-one',
      },
      {
        address: 'address-two',
        vHtlcId: 'vhtlc-two',
      },
    ]);

    unaryNotificationCall.mockResolvedValue({});

    await subscription.unsubscribeAddresses([
      'address-one',
      'address-two',
      'address-one',
    ]);

    expect(unaryNotificationCall).toHaveBeenLastCalledWith(
      'unsubscribeForAddresses',
      {
        addresses: ['address-one', 'address-two'],
      },
    );
    expect(subscription['subscribedAddresses'].has('address-one')).toEqual(
      false,
    );
    expect(subscription['subscribedAddresses'].has('address-two')).toEqual(
      false,
    );
  });

  describe('rescan interval', () => {
    test('falls back to the default when none is configured', () => {
      const { subscription } = createSubscription();

      expect((subscription as any).rescanIntervalSeconds).toEqual(
        ArkSubscription.defaultRescanIntervalSeconds,
      );
    });

    test('uses the configured value', () => {
      const { subscription } = createSubscription(123);

      expect((subscription as any).rescanIntervalSeconds).toEqual(123);
    });

    test.each([0, -1])(
      'throws when the configured value is below 1 (%i)',
      (value) => {
        expect(() => createSubscription(value)).toThrow(RangeError);
      },
    );

    test('accepts the minimum value of 1', () => {
      const { subscription } = createSubscription(1);

      expect((subscription as any).rescanIntervalSeconds).toEqual(1);
    });

    test('schedules the periodic rescan timer with the configured interval', async () => {
      const setIntervalSpy = jest.spyOn(global, 'setInterval');
      const { subscription } = createSubscription(45);

      await subscription.connect();

      try {
        expect(setIntervalSpy).toHaveBeenCalledTimes(1);
        expect(setIntervalSpy).toHaveBeenCalledWith(
          expect.any(Function),
          45_000,
        );
        expect(mockLogger.debug).toHaveBeenCalledWith(
          'Rescanning ark ARK every 45 seconds',
        );
      } finally {
        subscription.disconnect();
      }
    });
  });

  test('ignores invalid subscribed addresses during rescan and still emits valid vHTLCs', async () => {
    const { subscription, unaryCall } = createSubscription();

    const created = jest.fn();
    subscription.on('vhtlc.created', created);

    const tweakedPubKey = Buffer.alloc(32, 1);
    jest
      .spyOn(ArkClient, 'decodeAddress')
      .mockImplementation((address: string) => {
        if (address === 'invalid-address') {
          throw new Error('invalid address');
        }

        return {
          serverPubKey: Buffer.alloc(32, 2),
          tweakedPubKey,
        };
      });

    await subscription.subscribeAddresses([
      {
        address: 'invalid-address',
        vHtlcId: 'bad-vhtlc-id',
      },
      {
        address: 'valid-address',
        vHtlcId: 'good-vhtlc-id',
      },
    ]);

    unaryCall.mockResolvedValue({
      vhtlcs: [
        {
          script: Buffer.concat([Buffer.alloc(2), tweakedPubKey]).toString(
            'hex',
          ),
          outpoint: {
            txid: 'txid',
            vout: 1,
          },
          amount: '21',
          isSpent: false,
        },
      ],
    });

    await subscription.rescan();

    expect(mockLogger.warn).toHaveBeenCalledWith(
      'Ignoring invalid subscribed ARK address invalid-address: invalid address',
    );
    expect(created).toHaveBeenCalledWith({
      address: 'valid-address',
      txId: 'txid',
      vout: 1,
      amount: 21,
    });
  });
});
