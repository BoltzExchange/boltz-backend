import Logger from '../../../lib/Logger';
import { Signer } from '../../../lib/proto/boltzrpc';
import SignerControlRegistry from '../../../lib/service/SignerControlRegistry';

const mockRepository = {
  getDisabledSigners: jest.fn(),
  addSigners: jest.fn(),
  removeSigners: jest.fn(),
};

describe('SignerControlRegistry', () => {
  let registry: SignerControlRegistry;

  beforeEach(() => {
    jest.clearAllMocks();
    mockRepository.getDisabledSigners.mockResolvedValue([]);
    mockRepository.addSigners.mockResolvedValue(undefined);
    mockRepository.removeSigners.mockResolvedValue(undefined);

    registry = SignerControlRegistry.getInstance();
    registry.init(Logger.disabledLogger, mockRepository as any);
    registry.reset();
  });

  test('should disable signers with set semantics', async () => {
    const disabled = await registry.disableSigners([
      Signer.SIGNER_CHAIN_LOCKUP,
      Signer.SIGNER_CHAIN_LOCKUP,
      Signer.SIGNER_REVERSE_LOCKUP,
    ]);

    expect(disabled).toEqual([
      Signer.SIGNER_REVERSE_LOCKUP,
      Signer.SIGNER_CHAIN_LOCKUP,
    ]);
    expect(registry.getDisabledSigners()).toEqual([
      Signer.SIGNER_REVERSE_LOCKUP,
      Signer.SIGNER_CHAIN_LOCKUP,
    ]);
  });

  test('should enable signers idempotently', async () => {
    await registry.disableSigners([
      Signer.SIGNER_REVERSE_LOCKUP,
      Signer.SIGNER_CHAIN_LOCKUP,
    ]);

    await expect(
      registry.enableSigners([Signer.SIGNER_REVERSE_LOCKUP]),
    ).resolves.toEqual([Signer.SIGNER_CHAIN_LOCKUP]);
    await expect(
      registry.enableSigners([Signer.SIGNER_REVERSE_LOCKUP]),
    ).resolves.toEqual([Signer.SIGNER_CHAIN_LOCKUP]);
  });

  test('should log disable and enable operations', async () => {
    const infoSpy = jest.spyOn(Logger.disabledLogger, 'info');

    await registry.disableSigners([Signer.SIGNER_CHAIN_LOCKUP]);
    await registry.enableSigners([Signer.SIGNER_CHAIN_LOCKUP]);

    expect(infoSpy).toHaveBeenCalledTimes(2);
    expect(infoSpy).toHaveBeenNthCalledWith(
      1,
      'Disabled signers: SIGNER_CHAIN_LOCKUP. Disabled signer set: SIGNER_CHAIN_LOCKUP',
    );
    expect(infoSpy).toHaveBeenNthCalledWith(
      2,
      'Enabled signers: SIGNER_CHAIN_LOCKUP. No signers are disabled',
    );
  });

  test('should return the same singleton instance', async () => {
    await registry.disableSigners([Signer.SIGNER_CHAIN_LOCKUP]);

    expect(SignerControlRegistry.getInstance()).toBe(registry);
  });

  test('should reset state explicitly', async () => {
    await registry.disableSigners([Signer.SIGNER_CHAIN_LOCKUP]);

    registry.reset();
    expect(registry.getDisabledSigners()).toEqual([]);
  });

  test('should load persisted disabled signers', async () => {
    registry.init(Logger.disabledLogger, mockRepository as any);
    mockRepository.getDisabledSigners.mockResolvedValueOnce([
      'SIGNER_CHAIN_LOCKUP',
      'SIGNER_REVERSE_LOCKUP',
    ]);

    await registry.load();

    expect(registry.getDisabledSigners()).toEqual([
      Signer.SIGNER_REVERSE_LOCKUP,
      Signer.SIGNER_CHAIN_LOCKUP,
    ]);
  });

  test('should persist mutations before changing memory', async () => {
    registry.init(Logger.disabledLogger, mockRepository as any);

    await expect(
      registry.disableSigners([Signer.SIGNER_CHAIN_LOCKUP]),
    ).resolves.toEqual([Signer.SIGNER_CHAIN_LOCKUP]);
    expect(mockRepository.addSigners).toHaveBeenCalledWith([
      'SIGNER_CHAIN_LOCKUP',
    ]);

    await expect(
      registry.enableSigners([Signer.SIGNER_CHAIN_LOCKUP]),
    ).resolves.toEqual([]);
    expect(mockRepository.removeSigners).toHaveBeenCalledWith([
      'SIGNER_CHAIN_LOCKUP',
    ]);
  });
});
