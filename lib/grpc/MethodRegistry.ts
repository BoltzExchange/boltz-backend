import { BoltzService } from '../proto/boltzrpc';

// Wildcard matching every method on every service
export const wildcardAll = '*';

const allPaths = Object.values(BoltzService).map((m) => m.path as string);

export const validMethodPaths: ReadonlySet<string> = new Set(allPaths);

export const validServiceWildcards: ReadonlySet<string> = new Set(
  allPaths.map((p) => `${p.slice(0, p.lastIndexOf('/'))}/*`),
);

export const isValidAllowedMethodEntry = (entry: string): boolean => {
  if (entry === wildcardAll) {
    return true;
  }
  if (validServiceWildcards.has(entry)) {
    return true;
  }
  return validMethodPaths.has(entry);
};

export const assertValidAllowedMethods = (entries: string[]): void => {
  const invalid = entries.filter((entry) => !isValidAllowedMethodEntry(entry));
  if (invalid.length > 0) {
    throw new Error(`unknown method path(s): ${invalid.join(', ')}`);
  }
};
