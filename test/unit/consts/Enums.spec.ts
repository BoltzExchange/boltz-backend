import {
  SwapType,
  SwapVersion,
  stringToSwapType,
  swapVersionToString,
} from '../../../lib/consts/Enums';

describe('Enums', () => {
  test.each`
    version                | expected
    ${SwapVersion.Legacy}  | ${'Legacy'}
    ${SwapVersion.Taproot} | ${'Taproot'}
    ${21}                  | ${'Legacy'}
    ${'unknown'}           | ${'Legacy'}
  `(
    'should convert swap version $version to string',
    ({ version, expected }) => {
      expect(swapVersionToString(version)).toEqual(expected);
    },
  );

  test.each`
    type                  | expected
    ${'submarine'}        | ${SwapType.Submarine}
    ${'Submarine'}        | ${SwapType.Submarine}
    ${'sUbMaRiNe'}        | ${SwapType.Submarine}
    ${'SubMarine'}        | ${SwapType.Submarine}
    ${'SUBMARINE'}        | ${SwapType.Submarine}
    ${'reverse'}          | ${SwapType.ReverseSubmarine}
    ${'reversesubmarine'} | ${SwapType.ReverseSubmarine}
    ${'reverseSubmarine'} | ${SwapType.ReverseSubmarine}
    ${'chain'}            | ${SwapType.Chain}
    ${'CHAIN'}            | ${SwapType.Chain}
    ${'Chain'}            | ${SwapType.Chain}
  `('should convert string $type to swap type', ({ type, expected }) => {
    expect(stringToSwapType(type)).toEqual(expected);
  });
});
