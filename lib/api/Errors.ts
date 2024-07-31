export default {
  COULD_NOT_PARSE_HEX: (argName: string): string =>
    `could not parse hex string: ${argName}`,
  INVALID_PARAMETER: (argName: string): string =>
    `invalid parameter: ${argName}`,
  UNDEFINED_PARAMETER: (argName: string): string =>
    `undefined parameter: ${argName}`,
  UNSUPPORTED_PARAMETER: (symbol: string, argName: string): string =>
    `${symbol} does not support ${argName}`,
  INVALID_SWAP_STATUS: (status: string): string =>
    `invalid swap status: ${status}`,
};
