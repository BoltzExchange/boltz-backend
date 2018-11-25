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

  public updateHighestUsedIndex = async (symbol: string, highestUsedIndex: number) => {
    return this.models.Wallet.update({
      highestUsedIndex,
    }, {
      where: {
        symbol,
      },
    });
  }
}

export default WalletRepository;
