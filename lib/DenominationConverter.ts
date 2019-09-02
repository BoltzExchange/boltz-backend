const decimals = 100000000;

/**
 * Convert whole coins to satoshis
 */
export const coinsToSatoshis = (coins: number) => {
  return coins * decimals;
};

/**
 * Convert satoshis to whole coins and remove trailing zeros
 */
export const satoshisToCoins = (satoshis: number) => {
  return roundToDecimals(satoshis / decimals, 8);
};

/**
 * Round a number to a specific amount of decimals
 */
const roundToDecimals = (number: number, decimals: number) => {
  return Number(number.toFixed(decimals));
};
