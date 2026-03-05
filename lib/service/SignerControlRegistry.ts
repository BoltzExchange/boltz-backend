import { Signer } from '../proto/boltzrpc_pb';

const supportedSigners = [
  Signer.SIGNER_SUBMARINE_REFUND_COOP,
  Signer.SIGNER_REVERSE_CLAIM_COOP,
  Signer.SIGNER_CHAIN_REFUND_COOP,
  Signer.SIGNER_CHAIN_CLAIM_COOP,
  Signer.SIGNER_DEFERRED_CLAIM_COOP,
  Signer.SIGNER_EVM_REFUND_COOP,
  Signer.SIGNER_EVM_COMMITMENT_REFUND_COOP,
  Signer.SIGNER_REVERSE_LOCKUP,
  Signer.SIGNER_CHAIN_LOCKUP,
  Signer.SIGNER_SUBMARINE_INVOICE_PAYMENT,
] as const;

const supportedSignersSet = new Set<number>(supportedSigners);

class SignerControlRegistry {
  public static readonly allSigners = supportedSigners;

  private readonly disabledSigners = new Set<Signer>();

  public disableSigners = (signers: Signer[]): Signer[] => {
    this.assertValidSigners(signers);

    for (const signer of signers) {
      this.disabledSigners.add(signer);
    }

    return this.getDisabledSigners();
  };

  public enableSigners = (signers: Signer[]): Signer[] => {
    this.assertValidSigners(signers);

    for (const signer of signers) {
      this.disabledSigners.delete(signer);
    }

    return this.getDisabledSigners();
  };

  public getDisabledSigners = (): Signer[] =>
    Array.from(this.disabledSigners).sort((a, b) => a - b);

  public isDisabled = (signer: Signer): boolean =>
    this.disabledSigners.has(signer);

  private assertValidSigners = (signers: Signer[]) => {
    if (signers.length === 0) {
      throw new Error('at least one signer must be specified');
    }

    for (const signer of signers) {
      if (!supportedSignersSet.has(signer)) {
        throw new Error(`invalid signer: ${signer}`);
      }
    }
  };
}

export default SignerControlRegistry;
