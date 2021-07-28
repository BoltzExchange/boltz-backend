import DatabaseVersion from '../models/DatabaseVersion';

class DatabaseVersionRepository {
  public getVersion = (): Promise<DatabaseVersion | null> => {
    return DatabaseVersion.findOne();
  }

  public createVersion = (version: number): Promise<DatabaseVersion> => {
    return DatabaseVersion.create({
      version,
    });
  }

  public updateVersion = async (newVersion: number): Promise<void> => {
    await DatabaseVersion.update({
      version: newVersion,
    }, {
      where: {},
    });
  }

  public dropTable = (): Promise<void> => {
    return DatabaseVersion.drop();
  }
}

export default DatabaseVersionRepository;
