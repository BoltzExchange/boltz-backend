export default {
  COULD_NOT_PARSE_HEX: (argName: string): string =>
    `could not parse hex string: ${argName}`,
  INVALID_PARAMETER: (argName: string): string =>
    `invalid parameter: ${argName}`,
  UNDEFINED_PARAMETER: (argName: string): string =>
    `undefined parameter: ${argName}`,
  UNSUPPORTED_PARAMETER: (symbol: string, argName: string): string =>
    `${symbol} does not support ${argName}`,
  ARK_ADDRESS_WRONG_NETWORK: (argName: string): string =>
    `ark address in "${argName}" is for the wrong network`,
  ARK_ADDRESS_WRONG_SERVER: (argName: string): string =>
    `ark address in "${argName}" is for the wrong server`,
  INVALID_SWAP_STATUS: (status: string): string =>
    `invalid swap status: ${status}`,
  INVALID_EXTRA_FEES_PERCENTAGE: (percentage: number): string =>
    `invalid extra fees percentage: ${percentage}`,
  INVALID_EXTRA_FEES_ID: (id: string): string => `invalid extra fees id: ${id}`,
};
