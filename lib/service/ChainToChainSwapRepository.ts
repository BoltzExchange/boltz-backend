import { WhereOptions } from 'sequelize';
import { SwapUpdateEvent } from '../consts/Enums';
import ChainToChainSwap, { ChainToChainSwapType } from '../db/models/ChainToChainSwap';

class ChainToChainSwapRepository {
  public getChainToChainSwap = (options?: WhereOptions): Promise<ChainToChainSwap | undefined> => {
    return ChainToChainSwap.findOne({
      where: options,
    });
  }

  public getChainToChainSwaps = (options?: WhereOptions): Promise<ChainToChainSwap[]> => {
    return ChainToChainSwap.findAll({
      where: options,
    });
  }

  public addChainToChainSwap = (chainToChainSwap: ChainToChainSwapType): Promise<ChainToChainSwap> => {
    return ChainToChainSwap.create(chainToChainSwap);
  }

  public setChainToChainSwapStatus = (chainToChainSwap: ChainToChainSwap, status: string): Promise<ChainToChainSwap> => {
    return chainToChainSwap.update({
      status,
    });
  }

  public setReceivingTransaction = (
    chainToChainSwap: ChainToChainSwap,
    transactionId: string,
    amount: number,
    confirmed: boolean,
  ): Promise<ChainToChainSwap> => {
    return chainToChainSwap.update({
      receivingAmount: amount,
      receivingTransactionId: transactionId,
      status: confirmed ? SwapUpdateEvent.TransactionConfirmed : SwapUpdateEvent.TransactionMempool,
    });
  }

  public setSendingTransaction = (chainToChainSwap: ChainToChainSwap, transactionId: string, minerFee: number): Promise<ChainToChainSwap> => {
    return chainToChainSwap.update({
      sendingMinerFee: minerFee,
      sendingTransactionId: transactionId,
      status: SwapUpdateEvent.BoltzTransactionMempool,
    });
  }

  public setSendingTransactionRefunded = async (chainToChainSwap: ChainToChainSwap, minerFee: number): Promise<ChainToChainSwap> => {
    return chainToChainSwap.update({
      status: SwapUpdateEvent.BoltzTransactionRefunded,
      sendingMinerFee: chainToChainSwap.sendingMinerFee! + minerFee,
    });
  }

  public setClaimDetails = (chainToChainSwap: ChainToChainSwap, preimage: string, claimMinerFee: number): Promise<ChainToChainSwap> => {
    return chainToChainSwap.update({
      preimage,
      receivingMinerFee: claimMinerFee,
      status: SwapUpdateEvent.TransactionClaimed,
    });
  }

  public dropTable = () => {
    return ChainToChainSwap.drop();
  }
}

export default ChainToChainSwapRepository;
