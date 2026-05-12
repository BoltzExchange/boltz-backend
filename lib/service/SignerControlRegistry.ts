import LoggerClass from '../Logger';
import type Logger from '../Logger';
import DisabledSignerRepository from '../db/repositories/DisabledSignerRepository';
import type { Signer } from '../proto/boltzrpc';
import { signerFromName, signerName } from './SignerControlUtils';

class SignerControlRegistry {
  private static instance: SignerControlRegistry | undefined;

  private readonly disabledSigners = new Set<Signer>();
  private logger = LoggerClass.disabledLogger;
  private repository: typeof DisabledSignerRepository | undefined =
    DisabledSignerRepository;

  private constructor() {}

  public static getInstance = (): SignerControlRegistry => {
    if (SignerControlRegistry.instance === undefined) {
      SignerControlRegistry.instance = new SignerControlRegistry();
    }

    return SignerControlRegistry.instance;
  };

  public init = (
    logger: Logger,
    repository:
      | typeof DisabledSignerRepository
      | undefined = DisabledSignerRepository,
  ) => {
    this.logger = logger;
    this.repository = repository;
  };

  public load = async (): Promise<void> => {
    if (this.repository === undefined) {
      return;
    }

    this.disabledSigners.clear();
    for (const signer of await this.repository.getDisabledSigners()) {
      this.disabledSigners.add(signerFromName(signer));
    }
  };

  public disableSigners = async (signers: Signer[]): Promise<Signer[]> => {
    await this.repository?.addSigners(signers.map(signerName));

    for (const signer of signers) {
      this.disabledSigners.add(signer);
    }

    const disabledSigners = this.getDisabledSigners();
    this.logger.info(
      this.formatLogMessage('Disabled', signers, disabledSigners),
    );
    return disabledSigners;
  };

  public enableSigners = async (signers: Signer[]): Promise<Signer[]> => {
    await this.repository?.removeSigners(signers.map(signerName));

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
    this.repository = undefined;
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
