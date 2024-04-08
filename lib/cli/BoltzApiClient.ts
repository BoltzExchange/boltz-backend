import axios from 'axios';
import { SwapUpdateEvent } from '../consts/Enums';
import { ChainSwapTransactions } from '../service/TransactionFetcher';

type PartialSignature = {
  pubNonce: string;
  partialSignature: string;
};

class BoltzApiClient {
  constructor(private readonly endpoint: string) {}

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

  public getChainTransactions = async (
    swapId: string,
  ): Promise<ChainSwapTransactions> =>
    (await axios.get(`${this.endpoint}/v2/swap/chain/${swapId}/transactions`))
      .data;

  public getChainSwapClaimDetails = async (
    swapId: string,
  ): Promise<{
    pubNonce: string;
    publicKey: string;
    transactionHash: string;
  }> =>
    (await axios.get(`${this.endpoint}/v2/swap/chain/${swapId}/claim`)).data;

  public getChainSwapClaimPartialSignature = async (
    swapId: string,
    preimage: string,
    toSign: {
      index: number;
      pubNonce: string;
      transaction: string;
    },
    signature: { partialSignature: string; pubNonce: string },
  ): Promise<PartialSignature> =>
    (
      await axios.post(`${this.endpoint}/v2/swap/chain/${swapId}/claim`, {
        toSign,
        preimage,
        signature,
      })
    ).data;
}

export default BoltzApiClient;
export { PartialSignature };
