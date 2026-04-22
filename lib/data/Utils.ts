export const unsafeKeys = new Set(['__proto__', 'constructor', 'prototype']);

// Normalize a value to the property key JS uses when indexing and throw
// if it resolves to a prototype-pollution vector.
// Symbols pass through unchanged; everything else is coerced to a string.
// This prevents bypasses like `{ toString: () => '__proto__' }` slipping past
// a raw-value check but still indexing as `'__proto__'`.
const normalizeAndAssertSafe = (
  value: any,
  makeError: (normalized: string) => Error,
): PropertyKey => {
  const normalized = typeof value === 'symbol' ? value : String(value);
  if (typeof normalized === 'string' && unsafeKeys.has(normalized)) {
    throw makeError(normalized);
  }

  return normalized;
};

export const assertSafeObjectKey = (key: any): PropertyKey =>
  normalizeAndAssertSafe(key, (k) => new Error(`unsafe object key: ${k}`));

export const assertSafeReferralId = (id: string): void => {
  normalizeAndAssertSafe(
    id,
    (k) => new Error(`referral IDs cannot use reserved names: ${k}`),
  );
};

export const getNestedObject = (
  obj: { [key: PropertyKey]: any },
  key: any,
): any => {
  const normalizedKey = assertSafeObjectKey(key);

  if (!Object.prototype.hasOwnProperty.call(obj, normalizedKey)) {
    obj[normalizedKey] = {};
  }

  return obj[normalizedKey];
};
