export default {
  COULD_NOT_PARSE_HEX: (argName: string): string => `could not parse hex string: ${argName}`,
  INVALID_PARAMETER: (argName: string): string => `invalid parameter: ${argName}`,
  UNDEFINED_PARAMETER: (argName: string): string => `undefined parameter: ${argName}`,
};
