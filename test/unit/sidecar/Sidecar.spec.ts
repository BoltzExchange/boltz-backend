import { randomBytes } from 'crypto';
import Logger from '../../../lib/Logger';
import { getVersion } from '../../../lib/Utils';
import { SwapUpdateEvent } from '../../../lib/consts/Enums';
import type * as sidecarrpc from '../../../lib/proto/boltzr';
import Sidecar from '../../../lib/sidecar/Sidecar';

describe('Sidecar', () => {
  const sidecar = new Sidecar(Logger.disabledLogger, {} as any, '');

  describe('validateVersion', () => {
    test('should check for exact match in production', async () => {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-expect-error
      Sidecar['isProduction'] = true;

      sidecar.getInfo = jest.fn().mockResolvedValue({
        version: getVersion(),
      });

      await sidecar.validateVersion();
    });

    test('should throw on slight mismatch in production', async () => {
      const sidecarVersion = getVersion().split('-');
      sidecarVersion[1] = randomBytes(4).toString('hex');
      sidecar.getInfo = jest.fn().mockResolvedValue({
        version: sidecarVersion.join('-'),
      });

      await expect(sidecar.validateVersion()).rejects.toEqual(
        `sidecar version incompatible: ${(await sidecar.getInfo()).version} vs ${getVersion()}`,
      );
    });

    test('should allow slight mismatch in development', async () => {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-expect-error
      Sidecar['isProduction'] = false;

      const sidecarVersion = getVersion().split('-');
      sidecarVersion[1] = randomBytes(4).toString('hex');
      sidecar.getInfo = jest.fn().mockResolvedValue({
        version: sidecarVersion.join('-'),
      });

      await sidecar.validateVersion();
    });

    test('should throw on version mismatch in development', async () => {
      const sidecarVersion = getVersion().split('-');
      sidecarVersion[0] = randomBytes(4).toString('hex');
      sidecar.getInfo = jest.fn().mockResolvedValue({
        version: sidecarVersion.join('-'),
      });

      await expect(sidecar.validateVersion()).rejects.toEqual(
        `sidecar version incompatible: ${(await sidecar.getInfo()).version} vs ${getVersion()}`,
      );
    });
  });

  describe('trimDirtySuffix', () => {
    test('should trim dirty suffix', () => {
      const version = '3.8.0-1ec2944b';

      expect(Sidecar['trimDirtySuffix'](`${version}-dirty`)).toEqual(version);
    });
  });

  describe('subscribeSwapUpdates', () => {
    test('should serialize transaction confirmed flag', async () => {
      const stream = {
        on: jest.fn().mockReturnThis(),
        write: jest.fn(),
        cancel: jest.fn(),
      };
      let swapUpdateListener:
        | ((args: {
            id: string;
            status: {
              status: SwapUpdateEvent;
              transaction?: {
                id: string;
                confirmed?: boolean;
              };
            };
          }) => Promise<void>)
        | undefined;

      sidecar['client'] = {
        swapUpdate: jest.fn().mockReturnValue(stream),
      } as any;
      sidecar['eventHandler'] = {
        on: jest.fn((event: string, listener: typeof swapUpdateListener) => {
          if (event === 'swap.update') {
            swapUpdateListener = listener;
          }
        }),
      } as any;
      sidecar['sendWebHook'] = jest.fn().mockResolvedValue(undefined);

      sidecar['subscribeSwapUpdates']();

      expect(swapUpdateListener).toBeDefined();

      await swapUpdateListener!({
        id: 'swap-id',
        status: {
          status: SwapUpdateEvent.TransactionRefunded,
          transaction: {
            id: 'refund-tx',
            confirmed: true,
          },
        },
      });

      expect(stream.write).toHaveBeenCalledTimes(1);

      const request = stream.write.mock
        .calls[0][0] as sidecarrpc.SwapUpdateRequest;
      const update = request.status[0];
      const transaction = update.transactionInfo!;

      expect(update.status).toEqual(SwapUpdateEvent.TransactionRefunded);
      expect(transaction.id).toEqual('refund-tx');
      expect(transaction.confirmed).toEqual(true);
    });
  });
});
