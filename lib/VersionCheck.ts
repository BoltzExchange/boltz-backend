import ChainClient from './chain/ChainClient';
import LndClient from './lightning/LndClient';
import ClnClient from './lightning/cln/ClnClient';
import MpayClient from './lightning/cln/MpayClient';

type Version = string | number;

type VersionLimits = {
  minimal: Version;
  maximal: Version;
};

class VersionSplit {
  private readonly parts: number[];

  constructor(version: string) {
    const split = version.split('.');
    this.parts = split.map(Number);
  }

  public eq = (cmp: VersionSplit): boolean => {
    return (
      this.parts.length === cmp.parts.length &&
      this.parts.every((elem, i) => elem === cmp.parts[i])
    );
  };

  public gt = (cmp: VersionSplit): boolean => {
    for (let i = 0; i < Math.max(this.parts.length, cmp.parts.length); i++) {
      const v1 = VersionSplit.getVersionPart(this.parts, i);
      const v2 = VersionSplit.getVersionPart(cmp.parts, i);

      if (v1 > v2) {
        return true;
      } else if (v2 > v1) {
        return false;
      }
    }

    return false;
  };

  private static getVersionPart = (arr: number[], index: number): number => {
    return arr.length > index ? arr[index] : 0;
  };
}

class Comperator {
  public static versionInBounds = (
    version: Version,
    limits: VersionLimits,
  ): boolean => {
    if (typeof version === 'number') {
      return (
        version <= (limits.maximal as number) &&
        version >= (limits.minimal as number)
      );
    }

    const [versionSplit, minSplit, maxSplit] = [
      version,
      limits.minimal,
      limits.maximal,
    ].map((ver) => new VersionSplit(ver as string));
    return (
      !minSplit.gt(versionSplit) &&
      (maxSplit.gt(versionSplit) || maxSplit.eq(versionSplit))
    );
  };
}

class VersionCheck {
  private static versionLimits: Record<
    string,
    {
      minimal: string | number;
      maximal: string | number;
    }
  > = {
    [ChainClient.serviceName]: {
      minimal: 220000,
      maximal: 270000,
    },
    [ClnClient.serviceName]: {
      minimal: '23.05',
      maximal: '24.02.2',
    },
    [ClnClient.serviceNameHold]: {
      minimal: '0.0.3',
      maximal: '0.0.5',
    },
    [MpayClient.serviceName]: {
      minimal: '0.1.0',
      maximal: '0.1.1',
    },
    [LndClient.serviceName]: {
      minimal: '0.16.0',
      maximal: '0.17.5',
    },
  };

  public static checkChainClientVersion = (
    symbol: string,
    version: number,
  ): void => {
    if (
      !Comperator.versionInBounds(
        version,
        VersionCheck.versionLimits[ChainClient.serviceName],
      )
    ) {
      throw VersionCheck.unsupportedVersionError(
        `${symbol} Core`,
        version,
        VersionCheck.versionLimits[ChainClient.serviceName],
      );
    }
  };

  public static checkLightningVersion = (
    serviceName: string,
    symbol: string,
    version: string,
  ): void => {
    let limits: VersionLimits;
    let sanitizedVersion = version;

    switch (serviceName) {
      case LndClient.serviceName:
        sanitizedVersion = version.split('-')[0];
        limits = VersionCheck.versionLimits[LndClient.serviceName];
        break;

      case ClnClient.serviceName:
        if (version.startsWith('v')) {
          sanitizedVersion = sanitizedVersion.slice(1);
        }
        if (version.endsWith(ClnClient.moddedVersionSuffix)) {
          sanitizedVersion = sanitizedVersion.slice(
            0,
            -ClnClient.moddedVersionSuffix.length,
          );
        }

        limits = VersionCheck.versionLimits[ClnClient.serviceName];
        break;

      case ClnClient.serviceNameHold:
        limits = VersionCheck.versionLimits[ClnClient.serviceNameHold];
        break;

      case MpayClient.serviceName:
        limits = VersionCheck.versionLimits[MpayClient.serviceName];
        break;

      default:
        throw `unsupported lightning client ${serviceName}`;
    }

    if (!Comperator.versionInBounds(sanitizedVersion, limits)) {
      throw VersionCheck.unsupportedVersionError(
        `${symbol} ${serviceName}`,
        version,
        limits,
      );
    }
  };

  private static unsupportedVersionError = (
    service: string,
    actual: Version,
    limits: VersionLimits,
  ) => {
    return `unsupported ${service} version: ${actual}; min version ${limits.minimal}; max version ${limits.maximal}`;
  };
}

export default VersionCheck;
