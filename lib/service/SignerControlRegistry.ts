import LoggerClass from '../Logger';
import type Logger from '../Logger';
import type { Signer } from '../proto/boltzrpc_pb';
import { signerName } from './SignerControlUtils';

class SignerControlRegistry {
  private static instance: SignerControlRegistry | undefined;

  private readonly disabledSigners = new Set<Signer>();
  private logger = LoggerClass.disabledLogger;

  private constructor() {}

  public static getInstance = (): SignerControlRegistry => {
    if (SignerControlRegistry.instance === undefined) {
      SignerControlRegistry.instance = new SignerControlRegistry();
    }

    return SignerControlRegistry.instance;
  };

  public init = (logger: Logger) => {
    this.logger = logger;
  };

  public disableSigners = (signers: Signer[]): Signer[] => {
    for (const signer of signers) {
      this.disabledSigners.add(signer);
    }

    const disabledSigners = this.getDisabledSigners();
    this.logger.info(
      this.formatLogMessage('Disabled', signers, disabledSigners),
    );
    return disabledSigners;
  };

  public enableSigners = (signers: Signer[]): Signer[] => {
    for (const signer of signers) {
      this.disabledSigners.delete(signer);
    }

    const disabledSigners = this.getDisabledSigners();
    this.logger.info(
      this.formatLogMessage('Enabled', signers, disabledSigners),
    );
    return disabledSigners;
  };

  public getDisabledSigners = (): Signer[] =>
    Array.from(this.disabledSigners).sort((a, b) => a - b);

  public isDisabled = (signer: Signer): boolean =>
    this.disabledSigners.has(signer);

  // Tests use this to clear singleton state between cases.
  public reset = () => {
    this.disabledSigners.clear();
  };

  private formatLogMessage = (
    action: 'Disabled' | 'Enabled',
    signers: Signer[],
    disabledSigners: Signer[],
  ) => {
    const changed = signers.map(signerName).join(', ');
    if (disabledSigners.length === 0) {
      return `${action} signers: ${changed}. No signers are disabled`;
    }

    return `${action} signers: ${changed}. Disabled signer set: ${disabledSigners
      .map(signerName)
      .join(', ')}`;
  };
}

export default SignerControlRegistry;
