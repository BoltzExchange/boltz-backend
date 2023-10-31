import { DatabaseType } from './Database';

type Queries = {
  [DatabaseType.SQLite]: string;
  [DatabaseType.PostgreSQL]: string;
};

export { Queries };
