import { Models } from '../db/Database';
import * as db from '../consts/Database';

class WalletRepository {
  constructor(private models: Models) {}

  public getWallets = async () => {
    return this.models.Wallet.findAll();
  }

  public getWallet = async (symbol: string) => {
    return this.models.Wallet.findOne({
      where: {
        symbol,
      },
    });
  }

  public addWallet = async (wallet: db.WalletFactory) => {
    return this.models.Wallet.create(wallet);
  }

  public addWallets = async (wallets: db.WalletFactory[]) => {
    return this.models.Wallet.bulkCreate(wallets);
  }

  public setHighestUsedIndex = async (symbol: string, highestUsedIndex: number) => {
    return this.models.Wallet.update({
      highestUsedIndex,
    }, {
      where: {
        symbol,
      },
    });
  }

  public setBlockheight = async (symbol: string, blockheight: number) => {
    return this.models.Wallet.update({
      blockheight,
    }, {
      where: {
        symbol,
      },
    });
  }
}

export default WalletRepository;
