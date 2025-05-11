import {
  SwapType,
  SwapVersion,
  stringToSwapType,
  swapTypeFromGrpcSwapType,
  swapTypeToGrpcSwapType,
  swapVersionToString,
} from '../../../lib/consts/Enums';
import * as boltzrpc from '../../../lib/proto/boltzrpc_pb';

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

  test.each`
    type                         | expected
    ${SwapType.Submarine}        | ${boltzrpc.SwapType.SUBMARINE}
    ${SwapType.ReverseSubmarine} | ${boltzrpc.SwapType.REVERSE}
    ${SwapType.Chain}            | ${boltzrpc.SwapType.CHAIN}
    ${99}                        | ${undefined}
  `(
    'should convert swap type $type to gRPC swap type $expected',
    ({ type, expected }) => {
      if (type === 99) {
        expect(() => swapTypeToGrpcSwapType(type as any)).toThrow(
          'invalid swap type: 99',
        );
      } else {
        expect(swapTypeToGrpcSwapType(type)).toEqual(expected);
      }
    },
  );

  test.each`
    type                           | expected
    ${boltzrpc.SwapType.SUBMARINE} | ${SwapType.Submarine}
    ${boltzrpc.SwapType.REVERSE}   | ${SwapType.ReverseSubmarine}
    ${boltzrpc.SwapType.CHAIN}     | ${SwapType.Chain}
    ${99}                          | ${undefined}
  `(
    'should convert gRPC swap type $type to swap type $expected',
    ({ type, expected }) => {
      if (type === 99) {
        expect(() => swapTypeFromGrpcSwapType(type as any)).toThrow(
          'invalid swap type: 99',
        );
      } else {
        expect(swapTypeFromGrpcSwapType(type)).toEqual(expected);
      }
    },
  );
});
