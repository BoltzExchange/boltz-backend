import { Provider } from 'ethers';
import { getHexBuffer } from '../../../../lib/Utils';
import {
  getGasPrices,
  parseBuffer,
} from '../../../../lib/wallet/ethereum/EthereumUtils';

const mockGetFeeDataResult = {
  maxFeePerGas: BigInt(100),
  maxPriorityFeePerGas: BigInt(2),
};
const mockGetFeeData = jest.fn().mockResolvedValue(mockGetFeeDataResult);

const MockedProvider = <jest.Mock<Provider>>(
  (<any>jest.fn().mockImplementation(() => ({
    getFeeData: mockGetFeeData,
  })))
);

describe('EthereumUtils', () => {
  const provider = new MockedProvider();

  test('should parse buffers', () => {
    const data =
      '40fee37b911579bdd107e57add77c9351ace6692cd01dee36fd7879c6a7cf9fe';

    expect(parseBuffer(`0x${data}`)).toEqual(getHexBuffer(data));
  });

  test('should get gas prices', async () => {
    expect(await getGasPrices(provider)).toEqual({
      type: 2,
      ...mockGetFeeDataResult,
    });
  });
});
