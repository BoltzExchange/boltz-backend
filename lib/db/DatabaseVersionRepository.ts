import DatabaseVersion from './models/DatabaseVersion';

class DatabaseVersionRepository {
  public getVersion = (): Promise<DatabaseVersion | null> => {
    return DatabaseVersion.findOne();
  }

  public createVersion = (version: number): Promise<DatabaseVersion> => {
    return DatabaseVersion.create({
      version,
    });
  }

  public dropTable = (): Promise<void> => {
    return DatabaseVersion.drop();
  }
}

export default DatabaseVersionRepository;
