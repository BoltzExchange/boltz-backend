import {
  address as liquidAddress,
  networks as liquidNetworks,
} from 'liquidjs-lib';
import { liquid } from 'liquidjs-lib/src/networks';
import type { Sequelize } from 'sequelize';
import { addressFromOutputScript } from '../../../lib/AddressUtils';
import Logger from '../../../lib/Logger';
import { CurrencyType } from '../../../lib/consts/Enums';
import Migration, { decodeBip21 } from '../../../lib/db/Migration';
import DatabaseVersion from '../../../lib/db/models/DatabaseVersion';
import DatabaseVersionRepository from '../../../lib/db/repositories/DatabaseVersionRepository';
import type Sidecar from '../../../lib/sidecar/Sidecar';
import type { Currency } from '../../../lib/wallet/WalletManager';
import { bitcoin } from '../../Networks';

const mockSidecar: Sidecar = {
  decodeAddress: jest.fn(async (_chain: string, address: string) => {
    if (liquidAddress.isConfidential(address)) {
      const decoded = liquidAddress.fromConfidential(address);
      return {
        scriptPubkey: decoded.scriptPubKey!,
        blindingPubkey: decoded.blindingKey,
      };
    }
    return {
      scriptPubkey: liquidAddress.toOutputScript(address, liquidNetworks.liquid),
      blindingPubkey: undefined,
    };
  }),
  encodeAddress: jest.fn(
    async (
      _chain: string,
      scriptPubkey: Buffer,
      blindingPubkey?: Buffer,
    ) => {
      const addr = liquidAddress.fromOutputScript(
        scriptPubkey,
        liquidNetworks.liquid,
      );
      if (blindingPubkey && blindingPubkey.length > 0) {
        return liquidAddress.toConfidential(addr, blindingPubkey);
      }
      return addr;
    },
  ),
} as unknown as Sidecar;

const MockedSequelize = <Sequelize>(
  (<any>jest.fn().mockImplementation(() => {}))
);

jest.mock('../../../lib/db/models/DatabaseVersion');

DatabaseVersion.sync = jest.fn().mockResolvedValue(undefined);

let mockGetVersionResult: any = undefined;
const mockGetVersion = jest.fn().mockImplementation(async () => {
  return mockGetVersionResult;
});

const mockCreateVersion = jest.fn().mockResolvedValue(undefined);

jest.mock('../../../lib/db/repositories/DatabaseVersionRepository');

describe('Migration', () => {
  const emptyCurrenciesMap = new Map<any, any>();

  const migration = new Migration(Logger.disabledLogger, MockedSequelize);

  beforeEach(() => {
    mockGetVersionResult = undefined;

    DatabaseVersionRepository.getVersion = mockGetVersion;
    DatabaseVersionRepository.createVersion = mockCreateVersion;

    jest.clearAllMocks();
  });

  test('should insert the latest database schema version in case there none already', async () => {
    await migration.migrate(emptyCurrenciesMap, mockSidecar);

    expect(mockGetVersion).toHaveBeenCalledTimes(1);

    expect(mockCreateVersion).toHaveBeenCalledTimes(1);
    expect(mockCreateVersion).toHaveBeenCalledWith(
      Migration['latestSchemaVersion'],
    );
  });

  test('should do nothing in case the database has already the latest schema version', async () => {
    mockGetVersionResult = {
      version: Migration['latestSchemaVersion'],
    };

    await migration.migrate(emptyCurrenciesMap, mockSidecar);

    expect(mockGetVersion).toHaveBeenCalledTimes(1);
  });

  test.each([1, 10, 11])(
    'should throw when upgrading from unsupported legacy database schema version %i',
    async (version) => {
      mockGetVersionResult = { version };

      await expect(
        migration.migrate(emptyCurrenciesMap, mockSidecar),
      ).rejects.toThrow(
        `database schema version ${version} is no longer supported; please upgrade using an older boltz-backend release first`,
      );
    },
  );

  test('should throw when there is an unexpected database schema version', async () => {
    mockGetVersionResult = {
      version: -42,
    };

    await expect(
      migration.migrate(emptyCurrenciesMap, mockSidecar),
    ).rejects.toEqual(
      `found unexpected database version ${mockGetVersionResult.version}`,
    );
  });

  const currencies = new Map<string, Currency>();
  currencies.set('BTC', {
    type: CurrencyType.BitcoinLike,
    network: bitcoin,
  } as Currency);
  currencies.set('L-BTC', {
    type: CurrencyType.Liquid,
    network: liquid,
  } as Currency);

  test.each`
    bip21                                                                                                                             | symbol     | params        | confidential
    ${'bitcoin:bc1qrknxymxah6vxw8lvd8h4knymz2f0w80qsdhx76?amount=3'}                                                                  | ${'BTC'}   | ${'amount=3'} | ${false}
    ${'liquidnetwork:ex1q7c2nrxek8wclh9m8v4yanm2e0g0gx48j7zjm9x?amount=3'}                                                            | ${'L-BTC'} | ${'amount=3'} | ${false}
    ${'liquidnetwork:lq1qqv0ae3h4ja8su0wha8f2wzlc33ssqyvf2lvu3kwyt6s3vk063m7l2c0rkcqekntg5g5f8wkx3qzgyskeg2s4jh4uhnxn70m58?amount=3'} | ${'L-BTC'} | ${'amount=3'} | ${true}
  `('should decode bip21', async ({ bip21, symbol, params, confidential }) => {
    const result = await decodeBip21(bip21, currencies, mockSidecar);
    expect(result.symbol).toEqual(symbol);
    expect(result.params).toEqual(params);
    expect(result.scriptPubkey).toBeDefined();
    if (confidential) {
      expect(result.blindingKey).toBeDefined();
    } else {
      expect(result.blindingKey).toBeUndefined();
    }
    const decodedAddress = await addressFromOutputScript(
      currencies.get(symbol)!.type,
      result.scriptPubkey,
      currencies.get(symbol)!.network!,
      undefined,
      mockSidecar,
    );
    expect(decodedAddress).toBeDefined();
  });
});
