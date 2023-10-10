const decimals = 8;
const satFactor = 100_000_000;

/**
 * Round a number to a specific amount of decimals
 */
const roundToDecimals = (number: number, decimals: number): number => {
  return Number(number.toFixed(decimals));
};

/**
 * Convert whole coins to satoshis
 */
export const coinsToSatoshis = (coins: number): number => {
  return coins * satFactor;
};

/**
 * Convert satoshis to whole coins and remove trailing zeros
 */
export const satoshisToCoins = (satoshis: number): number => {
  return roundToDecimals(satoshis / satFactor, decimals);
};

/**
 * Convert satoshis to whole coins with trailing zeros
 */
export const satoshisToPaddedCoins = (satoshis: number): string => {
  return (satoshis / satFactor).toFixed(decimals);
};

export const satoshisToSatcomma = (satoshis: number): string => {
  let coins = (satoshis / satFactor).toFixed(decimals);
  for (const [num, index] of [3, 6].entries()) {
    coins = `${coins.substring(
      0,
      coins.length - index - num,
    )},${coins.substring(coins.length - index - num)}`;
  }
  return coins;
};
