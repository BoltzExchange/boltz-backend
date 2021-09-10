import { BigNumber, providers } from 'ethers';
import { getHexBuffer } from '../../../../lib/Utils';
import GasNow from '../../../../lib/wallet/ethereum/GasNow';
import { getGasPrices, parseBuffer } from '../../../../lib/wallet/ethereum/EthereumUtils';

const mockGetFeeDataResult = {
  maxFeePerGas: BigNumber.from(100),
  maxPriorityFeePerGas: BigNumber.from(2),
};
const mockGetFeeData = jest.fn().mockResolvedValue(mockGetFeeDataResult);

const MockedProvider = <jest.Mock<providers.Provider>><any>jest.fn().mockImplementation(() => ({
  getFeeData: mockGetFeeData,
}));

GasNow.latestGasPrice = BigNumber.from(2);

describe('EthereumUtils', () => {
  const provider = new MockedProvider();

  test('should parse buffers', () => {
    const data = '40fee37b911579bdd107e57add77c9351ace6692cd01dee36fd7879c6a7cf9fe';

    expect(parseBuffer(`0x${data}`)).toEqual(getHexBuffer(data));
  });

  test('should get gas prices', async () => {
    expect(await getGasPrices(provider)).toEqual({
      type: 2,
      ...mockGetFeeDataResult,
    });
  });
});
