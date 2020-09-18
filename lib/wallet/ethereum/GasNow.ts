import Axios from 'axios';
import { BigNumber } from 'ethers';

class GasNow {
  private static readonly gasNowApiUrl = 'https://gasnow.org/api/v3';

  // Because the GasNow API takes more than half a second to respond,
  // the gas price is stored in a global variable and updated every 15 seconds
  public static latestGasPrice = BigNumber.from(0);

  private interval?: any;

  public init = async (): Promise<void> => {
    await this.updateGasPrice();

    this.interval = setInterval(async () => {
      await this.updateGasPrice();
    }, 15 * 1000);
  }

  public stop = (): void => {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = undefined;
    }
  }

  private updateGasPrice = async () => {
    const response = await Axios.get(`${GasNow.gasNowApiUrl}/gas/price`);
    GasNow.latestGasPrice = BigNumber.from(response.data.data.fast);
  }
}

export default GasNow;
