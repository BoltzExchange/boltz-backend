type Version = string | number;

class VersionCheck {
  private static chainClientVersionLimits = {
    minimal: 180100,
    maximal: 210100,
  };

  private static lndVersionLimits = {
    minimal: '0.12.0',
    maximal: '0.13.1',
  };

  public static checkChainClientVersion = (symbol: string, version: number): void => {
    const { maximal, minimal } = VersionCheck.chainClientVersionLimits;

    if (version > maximal || version < minimal) {
      throw VersionCheck.unsupportedVersionError(`${symbol} Core`, version, maximal, minimal);
    }
  }

  public static checkLndVersion = (symbol: string, version: string): void => {
    const parseStringVersion = (version: string) => {
      return Number(version.split('-')[0].replace('.', ''));
    };

    const { maximal, minimal } = VersionCheck.lndVersionLimits;
    const versionNumber = parseStringVersion(version);

    if (versionNumber > parseStringVersion(maximal) || versionNumber < parseStringVersion(minimal)) {
      throw VersionCheck.unsupportedVersionError(`${symbol} LND`, version, maximal, minimal);
    }
  }

  private static unsupportedVersionError = (service: string, actual: Version, maximal: Version, minimal: Version) => {
    return `unsupported ${service} version: ${actual}; min version ${minimal}; max version ${maximal}`;
  }
}

export default VersionCheck;
