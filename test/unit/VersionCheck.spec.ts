import VersionCheck from '../../lib/VersionCheck';

describe('VersionCheck', () => {
  test('should check version of chain clients', () => {
    const symbol = 'BTC';
    const limits = VersionCheck['chainClientVersionLimits'];

    let unsupportedVersion = limits.minimal - 1;
    expect(() => VersionCheck.checkChainClientVersion(symbol, unsupportedVersion))
      .toThrow(`unsupported BTC Core version: ${unsupportedVersion}; min version ${limits.minimal}; max version ${limits.maximal}`);

    unsupportedVersion = limits.maximal + 1;
    expect(() => VersionCheck.checkChainClientVersion(symbol, unsupportedVersion))
      .toThrow(`unsupported BTC Core version: ${unsupportedVersion}; min version ${limits.minimal}; max version ${limits.maximal}`);

    expect(() => VersionCheck.checkChainClientVersion(symbol, limits.maximal)).not.toThrow();
    expect(() => VersionCheck.checkChainClientVersion(symbol, limits.minimal)).not.toThrow();
  });

  test('should check version of LND clients', () => {
    const symbol = 'BTC';
    const limits = VersionCheck['lndVersionLimits'];

    expect(() => VersionCheck.checkLndVersion(symbol, '0.10.4-beta'))
      .toThrow(`unsupported BTC LND version: 0.10.4-beta; min version ${limits.minimal}; max version ${limits.maximal}`);

    const maxThrowVersion = `0.${Number(limits.maximal.split('.')[1]) + 1}.0-beta`;
    expect(() => VersionCheck.checkLndVersion(symbol, maxThrowVersion))
      .toThrow(`unsupported BTC LND version: ${maxThrowVersion}; min version ${limits.minimal}; max version ${limits.maximal}`);

    expect(() => VersionCheck.checkLndVersion(symbol, limits.maximal)).not.toThrow();
    expect(() => VersionCheck.checkLndVersion(symbol, limits.minimal)).not.toThrow();
  });
});
