import { BigNumber, providers } from 'ethers';
import { getHexBuffer } from '../../../../lib/Utils';
import { gweiDecimals } from '../../../../lib/consts/Consts';
import { getGasPrice, parseBuffer } from '../../../../lib/wallet/ethereum/EthereumUtils';

const mockGetGasPriceResult = BigNumber.from(1);
const mockGetGasPrice = jest.fn().mockResolvedValue(mockGetGasPriceResult);

const MockedProvider = <jest.Mock<providers.Provider>><any>jest.fn().mockImplementation(() => ({
  getGasPrice: mockGetGasPrice,
}));

describe('EthereumUtils', () => {
  const provider = new MockedProvider();

  test('should parse buffers', () => {
    const data = '40fee37b911579bdd107e57add77c9351ace6692cd01dee36fd7879c6a7cf9fe';

    expect(parseBuffer(`0x${data}`)).toEqual(getHexBuffer(data));
  });

  test('should get gas price', async () => {
    const providedGasPrice = 20;

    expect(await getGasPrice(provider, providedGasPrice)).toEqual(BigNumber.from(providedGasPrice).mul(gweiDecimals));
    expect(await getGasPrice(provider)).toEqual(mockGetGasPriceResult);
  });
});
