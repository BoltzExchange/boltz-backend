import type { Provider } from 'ethers';
import { getHexBuffer } from '../../../../lib/Utils';
import {
  bumpGasLimit,
  getGasPrices,
  isNonceConflictError,
  parseBuffer,
} from '../../../../lib/wallet/ethereum/EthereumUtils';

let mockGetFeeDataResult: any;
const mockGetFeeData = jest
  .fn()
  .mockImplementation(async () => mockGetFeeDataResult);

const MockedProvider = <jest.Mock<Provider>>(
  (<any>jest.fn().mockImplementation(() => ({
    getFeeData: mockGetFeeData,
  })))
);

describe('EthereumUtils', () => {
  const provider = new MockedProvider();

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('should parse buffers', () => {
    const data =
      '40fee37b911579bdd107e57add77c9351ace6692cd01dee36fd7879c6a7cf9fe';

    expect(parseBuffer(`0x${data}`)).toEqual(getHexBuffer(data));
  });

  test.each`
    gasLimit   | expected
    ${0n}      | ${0n}
    ${1n}      | ${2n}
    ${4n}      | ${5n}
    ${21_000n} | ${26_250n}
    ${100n}    | ${125n}
  `(
    'should bump gas limit $gasLimit to $expected',
    ({ gasLimit, expected }) => {
      expect(bumpGasLimit(gasLimit)).toEqual(expected);
    },
  );

  test.each`
    name                          | expected                                                         | feeData
    ${'EIP-1559'}                 | ${{ type: 2, maxFeePerGas: 2323545n, maxPriorityFeePerGas: 1n }} | ${{ maxFeePerGas: 2323545n, maxPriorityFeePerGas: 1n }}
    ${'sanitized EIP-1559'}       | ${{ type: 2, maxFeePerGas: 2323545n, maxPriorityFeePerGas: 1n }} | ${{ maxFeePerGas: 2323545n, maxPriorityFeePerGas: 1n, some: 'shenanigans' }}
    ${'legacy'}                   | ${{ type: 0, gasPrice: 123n }}                                   | ${{ gasPrice: 123n }}
    ${'legacy null maxFeePerGas'} | ${{ type: 0, gasPrice: 123n }}                                   | ${{ gasPrice: 123n, maxFeePerGas: null }}
    ${'sanitized legacy'}         | ${{ type: 0, gasPrice: 123n }}                                   | ${{ gasPrice: 123n, other: 'data', maxPriorityFeePerGas: 42n }}
  `('should get $name gas prices', async ({ expected, feeData }) => {
    mockGetFeeDataResult = feeData;
    expect(await getGasPrices(provider)).toEqual(expected);

    expect(mockGetFeeData).toHaveBeenCalledTimes(1);
  });

  describe('isNonceConflictError', () => {
    test.each`
      name                                 | error
      ${'ethers NONCE_EXPIRED code'}       | ${{ code: 'NONCE_EXPIRED', message: 'whatever' }}
      ${'ethers REPLACEMENT_UNDERPRICED'}  | ${{ code: 'REPLACEMENT_UNDERPRICED', message: 'whatever' }}
      ${'nonce too low message'}           | ${{ message: 'nonce too low: address 0x..., tx: 2909 state: 2910' }}
      ${'nonce has already been used'}     | ${new Error('nonce has already been used (transaction=...)')}
      ${'already known'}                   | ${{ message: 'ALREADY KNOWN' }}
      ${'replacement underpriced message'} | ${{ shortMessage: 'replacement transaction underpriced' }}
      ${'nested RPC message'}              | ${{ info: { error: { message: 'nonce too low: address 0x..., tx: 2909 state: 2910' } } }}
      ${'nested cause code'}               | ${{ cause: { code: 'NONCE_EXPIRED' } }}
      ${'JSON-RPC body message'}           | ${{ body: JSON.stringify({ error: { message: 'replacement transaction underpriced' } }) }}
    `('matches $name', ({ error }) => {
      expect(isNonceConflictError(error)).toBe(true);
    });

    test.each`
      name             | error
      ${'null'}        | ${null}
      ${'undefined'}   | ${undefined}
      ${'unrelated'}   | ${{ code: 'INSUFFICIENT_FUNDS', message: 'insufficient funds for gas' }}
      ${'empty error'} | ${new Error('boom')}
    `('does not match $name', ({ error }) => {
      expect(isNonceConflictError(error)).toBe(false);
    });

    test('matches the real ethers v6 error from the Arbitrum log (Chain Swap uqUNFMq6M1Tu)', () => {
      const realError = Object.assign(
        new Error(
          'nonce has already been used (transaction="0x02f9011082a4b1820b5d80...", ' +
            'info={ "error": { "code": -32000, "message": "nonce too low: address ' +
            '0xA6D0956216da39AA1989066A9B22b64c30924DCd, tx: 2909 state: 2910" } }, ' +
            'code=NONCE_EXPIRED, version=6.16.0)',
        ),
        {
          code: 'NONCE_EXPIRED',
          shortMessage: 'nonce has already been used',
          info: {
            error: {
              code: -32000,
              message:
                'nonce too low: address 0xA6D0956216da39AA1989066A9B22b64c30924DCd, tx: 2909 state: 2910',
            },
          },
        },
      );

      expect(isNonceConflictError(realError)).toBe(true);
    });
  });
});
