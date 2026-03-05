import { Signer } from '../../../lib/proto/boltzrpc_pb';
import SignerControlRegistry from '../../../lib/service/SignerControlRegistry';

describe('SignerControlRegistry', () => {
  let registry: SignerControlRegistry;

  beforeEach(() => {
    registry = new SignerControlRegistry();
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

  test('should throw for empty signer lists', () => {
    expect(() => registry.disableSigners([])).toThrow(
      'at least one signer must be specified',
    );
    expect(() => registry.enableSigners([])).toThrow(
      'at least one signer must be specified',
    );
  });

  test('should reject invalid signer values without partial mutation', () => {
    registry.disableSigners([Signer.SIGNER_CHAIN_LOCKUP]);

    expect(() =>
      registry.disableSigners([
        Signer.SIGNER_REVERSE_LOCKUP,
        123_456 as unknown as Signer,
      ]),
    ).toThrow('invalid signer: 123456');

    expect(registry.getDisabledSigners()).toEqual([Signer.SIGNER_CHAIN_LOCKUP]);
  });

  test('should reset state with a new instance', () => {
    registry.disableSigners([Signer.SIGNER_CHAIN_LOCKUP]);

    const newRegistry = new SignerControlRegistry();
    expect(newRegistry.getDisabledSigners()).toEqual([]);
  });
});
