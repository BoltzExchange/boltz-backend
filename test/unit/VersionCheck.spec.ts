import VersionCheck from '../../lib/VersionCheck';

describe('VersionCheck', () => {
  test('should check version of chain clients', () => {
    const symbol = 'BTC';
    const limits = VersionCheck['chainClientVersionLimits'];

    expect(() => VersionCheck.checkChainClientVersion(symbol, limits.minimal - 1))
      .toThrow('unsupported BTC Core version: 180099; max version 200000; min version 180100');

    expect(() => VersionCheck.checkChainClientVersion(symbol, VersionCheck['chainClientVersionLimits'].maximal + 1))
      .toThrow('unsupported BTC Core version: 200001; max version 200000; min version 180100');

    expect(() => VersionCheck.checkChainClientVersion(symbol, limits.maximal)).not.toThrow();
    expect(() => VersionCheck.checkChainClientVersion(symbol, limits.minimal)).not.toThrow();
  });

  test('should check version of LND clients', () => {
    const symbol = 'BTC';

    expect(() => VersionCheck.checkLndVersion(symbol, '0.10.0-beta'))
      .toThrow('unsupported BTC LND version: 0.10.0-beta; max version 0.10.1; min version 0.10.1');

    expect(() => VersionCheck.checkLndVersion(symbol, '0.10.2-beta'))
      .toThrow('unsupported BTC LND version: 0.10.2-beta; max version 0.10.1; min version 0.10.1');

    const limits = VersionCheck['lndVersionLimits'];

    expect(() => VersionCheck.checkLndVersion(symbol, limits.maximal)).not.toThrow();
    expect(() => VersionCheck.checkLndVersion(symbol, limits.minimal)).not.toThrow();
  });
});
