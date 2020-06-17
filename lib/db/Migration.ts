import Logger from '../Logger';
import DatabaseVersionRepository from './DatabaseVersionRepository';

class Migration {
  private versionRepository: DatabaseVersionRepository;

  private static latestSchemaVersion = 1;

  constructor(private logger: Logger) {
    this.versionRepository = new DatabaseVersionRepository();
  }

  public migrate = async () => {
    const versionRow = await this.versionRepository.getVersion();

    // When no version row is found, just insert the latest version into the database
    if (!versionRow) {
      this.logger.verbose('No schema version found in database');
      this.logger.debug(`Inserting latest schema version ${Migration.latestSchemaVersion} in database`);

      await this.versionRepository.createVersion(Migration.latestSchemaVersion);
      return;
    }

    switch (versionRow.version) {
      case Migration.latestSchemaVersion:
        this.logger.verbose(`Database already at latest schema version ${Migration.latestSchemaVersion}`);
        break;

      default:
        throw `found unexpected database version ${versionRow.version}`;
    }
  }
}

export default Migration;
