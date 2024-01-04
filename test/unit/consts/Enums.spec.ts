import { SwapVersion, swapVersionToString } from '../../../lib/consts/Enums';

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
});
