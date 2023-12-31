import axios from 'axios';

class BoltzApiClient {
  public static readonly regtestEndpoint = 'http://127.0.0.1:9001';

  constructor(private readonly endpoint = BoltzApiClient.regtestEndpoint) {}

  public getSwapTransaction = async (
    swapId: string,
  ): Promise<{
    transactionHex: string;
  }> => {
    return (
      await axios.post(`${this.endpoint}/getswaptransaction`, {
        id: swapId,
      })
    ).data;
  };

  public refundSwap = async (
    swapId: string,
    transaction: string,
    vin: number,
    pubNonce: string,
  ): Promise<{
    pubNonce: string;
    partialSignature: string;
  }> => {
    return (
      await axios.post(`${this.endpoint}/v2/swap/submarine/refund`, {
        pubNonce,
        transaction,
        id: swapId,
        index: vin,
      })
    ).data;
  };
}

export default BoltzApiClient;
