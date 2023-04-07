import DatabaseVersion from '../models/DatabaseVersion';

class DatabaseVersionRepository {
  public static getVersion = (): Promise<DatabaseVersion | null> => {
    return DatabaseVersion.findOne();
  };

  public static createVersion = (version: number): Promise<DatabaseVersion> => {
    return DatabaseVersion.create({
      version,
    });
  };

  public static updateVersion = async (newVersion: number): Promise<void> => {
    await DatabaseVersion.update({
      version: newVersion,
    }, {
      where: {},
    });
  };

  public static dropTable = (): Promise<void> => {
    return DatabaseVersion.drop();
  };
}

export default DatabaseVersionRepository;
