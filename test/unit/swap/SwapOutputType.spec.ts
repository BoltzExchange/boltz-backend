import { OutputType } from 'boltz-core';
import { CurrencyType } from '../../../lib/consts/Enums';
import SwapOutputType from '../../../lib/swap/SwapOutputType';

describe('SwapOutputType', () => {
  test('should default to type set in constructor', () => {
    expect(
      new SwapOutputType(OutputType.Compatibility).get(
        CurrencyType.BitcoinLike,
      ),
    ).toEqual(OutputType.Compatibility);
    expect(
      new SwapOutputType(OutputType.Legacy).get(CurrencyType.Ether),
    ).toEqual(OutputType.Legacy);
  });

  test('should always use bech32 for Liquid', () => {
    expect(
      new SwapOutputType(OutputType.Legacy).get(CurrencyType.Liquid),
    ).toEqual(OutputType.Bech32);
    expect(
      new SwapOutputType(OutputType.Compatibility).get(CurrencyType.Liquid),
    ).toEqual(OutputType.Bech32);
  });
});
