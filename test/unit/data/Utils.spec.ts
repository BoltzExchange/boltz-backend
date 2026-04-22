import { getNestedObject } from '../../../lib/data/Utils';

describe('data/Utils', () => {
  describe('getNestedObject', () => {
    test('should create and return a new nested object for an unknown key', () => {
      const root: Record<string, any> = {};
      const nested = getNestedObject(root, 'foo');

      expect(nested).toEqual({});
      expect(root.foo).toBe(nested);
    });

    test('should return the existing nested object for a known key', () => {
      const existing = { bar: 1 };
      const root: Record<string, any> = { foo: existing };

      expect(getNestedObject(root, 'foo')).toBe(existing);
    });

    test.each(['__proto__', 'constructor', 'prototype'])(
      'should reject unsafe key "%s"',
      (key) => {
        const root: Record<string, any> = {};
        expect(() => getNestedObject(root, key)).toThrow(
          `unsafe object key: ${key}`,
        );
      },
    );

    test('should not pollute Object.prototype via __proto__', () => {
      const root: Record<string, any> = {};

      expect(() => {
        const polluted = getNestedObject(root, '__proto__');
        polluted.polluted = 'yes';
      }).toThrow();

      expect(({} as any).polluted).toBeUndefined();
    });

    test.each(['__proto__', 'constructor', 'prototype'])(
      'should reject non-string keys that coerce to unsafe key "%s"',
      (unsafeKey) => {
        const root: Record<string, any> = {};
        const coercingKey = { toString: () => unsafeKey };

        expect(() => getNestedObject(root, coercingKey)).toThrow(
          `unsafe object key: ${unsafeKey}`,
        );
        expect(({} as any).polluted).toBeUndefined();
      },
    );

    test('should not return inherited method for a name like "toString"', () => {
      const root: Record<string, any> = {};
      const nested = getNestedObject(root, 'toString');

      expect(nested).toEqual({});
      expect(root.toString).toBe(nested);
    });

    test('should preserve a falsy own property instead of overwriting it', () => {
      const root: Record<string, any> = {};
      Object.defineProperty(root, 'foo', {
        value: 0,
        writable: true,
        enumerable: true,
        configurable: true,
      });

      expect(getNestedObject(root, 'foo')).toBe(0);
      expect(root.foo).toBe(0);
    });

    test('should not be fooled by a shadowed hasOwnProperty', () => {
      const root: Record<string, any> = { hasOwnProperty: () => true };
      const nested = getNestedObject(root, 'missing');

      expect(nested).toEqual({});
      expect(root.missing).toBe(nested);
    });

    test('should accept numeric keys used for year/month buckets', () => {
      const root: Record<string, any> = {};
      const yearObj = getNestedObject(root, 2026);
      const monthObj = getNestedObject(yearObj, 4);

      expect(monthObj).toEqual({});
      expect(root[2026][4]).toBe(monthObj);
    });
  });
});
