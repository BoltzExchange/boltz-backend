import VersionCheck from '../../lib/VersionCheck';
import ChainClient from '../../lib/chain/ChainClient';
import LndClient from '../../lib/lightning/LndClient';
import ClnClient from '../../lib/lightning/cln/ClnClient';

describe('VersionCheck', () => {
  test('should check version of chain clients', () => {
    const symbol = 'BTC';
    const limits = VersionCheck['versionLimits'][ChainClient.serviceName];

    let unsupportedVersion = (limits.minimal as number) - 1;
    expect(() =>
      VersionCheck.checkChainClientVersion(symbol, unsupportedVersion),
    ).toThrow(
      `unsupported BTC Core version: ${unsupportedVersion}; min version ${limits.minimal}; max version ${limits.maximal}`,
    );

    unsupportedVersion = (limits.maximal as number) + 1;
    expect(() =>
      VersionCheck.checkChainClientVersion(symbol, unsupportedVersion),
    ).toThrow(
      `unsupported BTC Core version: ${unsupportedVersion}; min version ${limits.minimal}; max version ${limits.maximal}`,
    );

    expect(() =>
      VersionCheck.checkChainClientVersion(symbol, limits.maximal as number),
    ).not.toThrow();
    expect(() =>
      VersionCheck.checkChainClientVersion(symbol, limits.minimal as number),
    ).not.toThrow();
  });

  test('should check version of LND clients', () => {
    const symbol = 'BTC';
    const limits = VersionCheck['versionLimits'][LndClient.serviceName];

    expect(() =>
      VersionCheck.checkLightningVersion(
        LndClient.serviceName,
        symbol,
        '0.10.4-beta',
      ),
    ).toThrow(
      `unsupported BTC LND version: 0.10.4-beta; min version ${limits.minimal}; max version ${limits.maximal}`,
    );

    const maxThrowVersion = `0.${
      Number((limits.maximal as string).split('.')[1]) + 1
    }.0-beta`;
    expect(() =>
      VersionCheck.checkLightningVersion(
        LndClient.serviceName,
        symbol,
        maxThrowVersion,
      ),
    ).toThrow(
      `unsupported BTC LND version: ${maxThrowVersion}; min version ${limits.minimal}; max version ${limits.maximal}`,
    );

    expect(() =>
      VersionCheck.checkLightningVersion(
        LndClient.serviceName,
        symbol,
        limits.maximal as string,
      ),
    ).not.toThrow();
    expect(() =>
      VersionCheck.checkLightningVersion(
        LndClient.serviceName,
        symbol,
        limits.minimal as string,
      ),
    ).not.toThrow();
  });

  test('should check version of CLN clients', () => {
    const symbol = 'BTC';
    const limits = VersionCheck['versionLimits'][ClnClient.serviceName];

    expect(() =>
      VersionCheck.checkLightningVersion(ClnClient.serviceName, symbol, 'v22'),
    ).toThrow(
      `unsupported BTC CLN version: v22; min version ${limits.minimal}; max version ${limits.maximal}`,
    );

    const maxThrowVersion = `v${
      Number((limits.maximal as string).split('.')[0]) + 1
    }.0`;
    expect(() =>
      VersionCheck.checkLightningVersion(
        ClnClient.serviceName,
        symbol,
        maxThrowVersion,
      ),
    ).toThrow(
      `unsupported BTC CLN version: ${maxThrowVersion}; min version ${limits.minimal}; max version ${limits.maximal}`,
    );

    expect(() =>
      VersionCheck.checkLightningVersion(
        ClnClient.serviceName,
        symbol,
        limits.maximal as string,
      ),
    ).not.toThrow();
    expect(() =>
      VersionCheck.checkLightningVersion(
        ClnClient.serviceName,
        symbol,
        limits.minimal as string,
      ),
    ).not.toThrow();
  });

  test('should allow modded versions of CLN', () => {
    expect(() =>
      VersionCheck.checkLightningVersion(
        ClnClient.serviceName,
        'BTC',
        'v24.11-modded',
      ),
    ).not.toThrow();
  });
});
