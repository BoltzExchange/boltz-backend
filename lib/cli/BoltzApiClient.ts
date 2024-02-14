import axios from 'axios';
import { SwapUpdateEvent } from '../consts/Enums';

type PartialSignature = {
  pubNonce: string;
  partialSignature: string;
};

class BoltzApiClient {
  public static readonly regtestEndpoint = 'http://127.0.0.1:9001';

  constructor(private readonly endpoint = BoltzApiClient.regtestEndpoint) {}

  public getStatus = async (
    swapId: string,
  ): Promise<{
    status: SwapUpdateEvent;
    transaction?: {
      hex: string;
    };
  }> =>
    (
      await axios.post(`${this.endpoint}/swapstatus`, {
        id: swapId,
      })
    ).data;

  public getSwapTransaction = async (
    swapId: string,
  ): Promise<{
    transactionHex: string;
  }> =>
    (
      await axios.post(`${this.endpoint}/getswaptransaction`, {
        id: swapId,
      })
    ).data;

  public getSwapRefundPartialSignature = async (
    swapId: string,
    transaction: string,
    vin: number,
    pubNonce: string,
  ): Promise<PartialSignature> =>
    (
      await axios.post(`${this.endpoint}/v2/swap/submarine/refund`, {
        pubNonce,
        transaction,
        id: swapId,
        index: vin,
      })
    ).data;

  public getReverseClaimPartialSignature = async (
    swapId: string,
    preimage: string,
    transaction: string,
    vin: number,
    pubNonce: string,
  ): Promise<PartialSignature> =>
    (
      await axios.post(`${this.endpoint}/v2/swap/reverse/claim`, {
        pubNonce,
        preimage,
        transaction,
        id: swapId,
        index: vin,
      })
    ).data;
}

export default BoltzApiClient;
export { PartialSignature };
