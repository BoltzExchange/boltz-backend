import { Signer } from '../proto/boltzrpc_pb';

const signerNames = new Map<Signer, string>(
  Object.entries(Signer).map(([name, value]) => [value as Signer, name]),
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

export const disabledSignerMessage = (signer: Signer): string =>
  `signer ${signerName(signer)} is disabled`;
