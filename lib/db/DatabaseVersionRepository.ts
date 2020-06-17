import DatabaseVersion from './models/DatabaseVersion';

class DatabaseVersionRepository {
  public getVersion = (): Promise<DatabaseVersion | null> => {
    return DatabaseVersion.findOne();
  }

  public createVersion = (version: number) => {
    return DatabaseVersion.create({
      version,
    });
  }

  public dropTable = () => {
    return DatabaseVersion.drop();
  }
}

export default DatabaseVersionRepository;
