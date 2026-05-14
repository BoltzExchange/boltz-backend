import { Signer, signerFromJSON } from '../proto/boltzrpc';

const signerNames = new Map<Signer, string>(
  Object.entries(Signer)
    .filter(([, value]) => typeof value === 'number' && value > 0)
    .map(([name, value]) => [value as Signer, name]),
);

export const isValidSigner = (signer: number): signer is Signer =>
  signerNames.has(signer as Signer);

export const signerName = (signer: Signer): string => {
  const name = signerNames.get(signer);
  if (name === undefined) {
    throw new Error(`invalid signer: ${signer}`);
  }

  return name;
};

export const signerFromName = (name: string): Signer => {
  const signer = signerFromJSON(name);
  if (!isValidSigner(signer)) {
    throw new Error(`invalid signer: ${name}`);
  }

  return signer;
};

export const disabledSignerMessage = (signer: Signer): string =>
  `signer ${signerName(signer)} is disabled`;
