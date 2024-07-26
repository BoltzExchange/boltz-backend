import { randomBytes } from 'crypto';
import Logger from '../../../lib/Logger';
import { getVersion } from '../../../lib/Utils';
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
});
