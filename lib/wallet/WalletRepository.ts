import { Op } from 'sequelize';
import Wallet from '../db/models/Wallet';

class WalletRepository {
  constructor() {}

  public getWallets = async (): Promise<Wallet[]> => {
    return Wallet.findAll();
  }

  public getWallet = async (symbol: string): Promise<Wallet> => {
    return Wallet.findOne({
      where: {
        symbol: {
          [Op.eq]: symbol,
        },
      },
    });
  }

  public addWallet = async (wallet: {
    symbol: string,

    highestUsedIndex: number,
    derivationPath: string,

    blockHeight: number,
  }) => {
    return Wallet.create(wallet);
  }

  public setHighestUsedIndex = async (symbol: string, highestUsedIndex: number) => {
    return Wallet.update({
      highestUsedIndex,
    }, {
      where: {
        symbol: {
          [Op.eq]: symbol,
        },
      },
    });
  }

  public setBlockHeight = async (symbol: string, blockHeight: number) => {
    return Wallet.update({
      blockHeight,
    }, {
      where: {
        symbol: {
          [Op.eq]: symbol,
        },
      },
    });
  }
}

export default WalletRepository;
