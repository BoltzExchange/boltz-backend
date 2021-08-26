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

    expect(() => VersionCheck.checkLndVersion(symbol, '0.10.4-beta'))
      .toThrow('unsupported BTC LND version: 0.10.4-beta; min version 0.12.0; max version 0.13.1');

    expect(() => VersionCheck.checkLndVersion(symbol, '0.13.2-beta'))
      .toThrow('unsupported BTC LND version: 0.13.2-beta; min version 0.12.0; max version 0.13.1');

    const limits = VersionCheck['lndVersionLimits'];

    expect(() => VersionCheck.checkLndVersion(symbol, limits.maximal)).not.toThrow();
    expect(() => VersionCheck.checkLndVersion(symbol, limits.minimal)).not.toThrow();
  });
});
