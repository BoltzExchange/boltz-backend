import { Provider } from 'ethers';
import { getHexBuffer } from '../../../../lib/Utils';
import {
  getGasPrices,
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
});
