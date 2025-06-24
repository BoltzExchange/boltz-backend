import { parseAmount } from '../../../lib/cli/Command';

describe('Command', () => {
  describe('parseAmount', () => {
    test.each`
      amount            | expected
      ${'0'}            | ${0}
      ${'1'}            | ${1}
      ${'100'}          | ${100}
      ${'0.00000001'}   | ${1}
      ${'0.1'}          | ${10_000_000}
      ${'1.23456789'}   | ${123_456_789}
      ${'123.45678901'} | ${12_345_678_901}
      ${'-1'}           | ${-1}
      ${'-0.1'}         | ${-10_000_000}
      ${'-100'}         | ${-100}
    `(
      'should convert "$amount" to $expected satoshis',
      ({ amount, expected }) => {
        expect(parseAmount(amount)).toBe(expected);
      },
    );

    test.each(['abc', '', 'NaN'])(
      'should throw on invalid amount "%s"',
      (invalidAmount) => {
        expect(() => parseAmount(invalidAmount as string)).toThrow(
          'invalid amount',
        );
      },
    );

    test.each([' 123 ', '\n100\t'])(
      'should handle whitespace in amount "%s"',
      (amount) => {
        expect(() => parseAmount(amount as string)).not.toThrow();
      },
    );
  });
});
