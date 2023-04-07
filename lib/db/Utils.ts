export const arrayToSqlInClause = (arr: string[]): string => {
  return arr.map((event) => `'${event}'`).join(',');
};
