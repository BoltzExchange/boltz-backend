import {
  assertValidAllowedMethods,
  isValidAllowedMethodEntry,
  validMethodPaths,
  validServiceWildcards,
} from '../../../lib/grpc/MethodRegistry';
import { BoltzService } from '../../../lib/proto/boltzrpc';

describe('MethodRegistry', () => {
  test('derives the valid path set from BoltzService (not hardcoded)', () => {
    const expected = new Set(
      Object.values(BoltzService).map((m) => m.path as string),
    );
    expect(validMethodPaths).toEqual(expected);
    expect(validMethodPaths.has('/boltzrpc.Boltz/GetInfo')).toBe(true);
  });

  test('derives service wildcards from the same source', () => {
    expect(validServiceWildcards.has('/boltzrpc.Boltz/*')).toBe(true);
  });

  describe('isValidAllowedMethodEntry', () => {
    test.each([
      ['*', true],
      ['/boltzrpc.Boltz/*', true],
      ['/boltzrpc.Boltz/GetInfo', true],
      ['/boltzrpc.Boltz/IssueJwt', true],
      ['/boltzrpc.Boltz/GetInfoo', false],
      ['/other.Service/*', false],
      ['/other.Service/Foo', false],
      ['', false],
      ['GetInfo', false],
    ])('entry %j -> %s', (entry, expected) => {
      expect(isValidAllowedMethodEntry(entry)).toBe(expected);
    });
  });

  describe('assertValidAllowedMethods', () => {
    test('accepts all-valid lists', () => {
      expect(() =>
        assertValidAllowedMethods([
          '*',
          '/boltzrpc.Boltz/*',
          '/boltzrpc.Boltz/GetInfo',
        ]),
      ).not.toThrow();
    });

    test('throws listing every invalid entry', () => {
      expect(() =>
        assertValidAllowedMethods([
          '/boltzrpc.Boltz/GetInfo',
          '/boltzrpc.Boltz/Bogus',
          '/wrong/Path',
        ]),
      ).toThrow(/Bogus.*wrong\/Path/);
    });
  });
});
