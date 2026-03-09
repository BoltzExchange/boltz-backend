import Logger from '../../../lib/Logger';
import { Signer } from '../../../lib/proto/boltzrpc_pb';
import SignerControlRegistry from '../../../lib/service/SignerControlRegistry';

describe('SignerControlRegistry', () => {
  let registry: SignerControlRegistry;

  beforeEach(() => {
    registry = SignerControlRegistry.getInstance();
    registry.init(Logger.disabledLogger);
    registry.reset();
  });

  test('should disable signers with set semantics', () => {
    const disabled = registry.disableSigners([
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

  test('should enable signers idempotently', () => {
    registry.disableSigners([
      Signer.SIGNER_REVERSE_LOCKUP,
      Signer.SIGNER_CHAIN_LOCKUP,
    ]);

    expect(registry.enableSigners([Signer.SIGNER_REVERSE_LOCKUP])).toEqual([
      Signer.SIGNER_CHAIN_LOCKUP,
    ]);
    expect(registry.enableSigners([Signer.SIGNER_REVERSE_LOCKUP])).toEqual([
      Signer.SIGNER_CHAIN_LOCKUP,
    ]);
  });

  test('should log disable and enable operations', () => {
    const infoSpy = jest.spyOn(Logger.disabledLogger, 'info');

    registry.disableSigners([Signer.SIGNER_CHAIN_LOCKUP]);
    registry.enableSigners([Signer.SIGNER_CHAIN_LOCKUP]);

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

  test('should return the same singleton instance', () => {
    registry.disableSigners([Signer.SIGNER_CHAIN_LOCKUP]);

    expect(SignerControlRegistry.getInstance()).toBe(registry);
  });

  test('should reset state explicitly', () => {
    registry.disableSigners([Signer.SIGNER_CHAIN_LOCKUP]);

    registry.reset();
    expect(registry.getDisabledSigners()).toEqual([]);
  });
});
