const msatFactor = 1_000;

export const scidLndToCln = (s: string): string => {
  const big = BigInt(s);
  const block = big >> BigInt(40);
  const tx = (big >> BigInt(16)) & BigInt(0xffffff);
  const output = big & BigInt(0xffff);
  return [block, tx, output].join('x');
};

export const scidClnToLnd = (s: string): string => {
  const parts = s.split('x').map((part) => BigInt(part));
  return (
    (parts[0] << BigInt(40)) |
    (parts[1] << BigInt(16)) |
    parts[2]
  ).toString();
};

export const transactionToLndScid = (
  blockHeight: number,
  transactionIndex: number,
  outputIndex: number,
): string => {
  const scid =
    (BigInt(blockHeight) << 40n) |
    (BigInt(transactionIndex) << 16n) |
    BigInt(outputIndex);
  return scid.toString();
};

export const msatToSat = (msat: number): number => {
  return Math.round(msat / msatFactor);
};

export const satToMsat = (sat: number): number => {
  return Math.round(sat * msatFactor);
};
