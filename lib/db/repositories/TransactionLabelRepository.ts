import Logger from '../../Logger';
import { SwapType, swapTypeToPrettyString } from '../../consts/Enums';
import { AnySwap } from '../../consts/Types';
import TransactionLabel from '../models/TransactionLabel';

class TransactionLabelRepository {
  public static logger?: Logger;

  public static setLogger = (logger: Logger) => {
    this.logger = logger;
  };

  public static addLabel = async (
    id: string,
    symbol: string,
    label: string,
  ) => {
    try {
      return await TransactionLabel.create({
        id,
        label,
        symbol,
      });
    } catch (error) {
      if ((error as any).name === 'SequelizeUniqueConstraintError') {
        const existingLabel = await TransactionLabel.findOne({ where: { id } });
        if (existingLabel) {
          this.logger?.warn(
            `Updating existing label for ${id} from "${existingLabel.label}" to "${label}"`,
          );
          return await existingLabel.update({ label });
        }
      }

      throw error;
    }
  };

  public static getLabel = (id: string) =>
    TransactionLabel.findOne({
      where: {
        id,
      },
    });

  public static lockupLabel = (
    swap: AnySwap,
    isPrepayMinerFee: boolean = false,
  ) =>
    `Lockup${isPrepayMinerFee ? ' with prepay miner fee' : ''} for ${swapTypeToPrettyString(swap.type)} Swap ${swap.id}`;

  public static claimLabel = (swap: AnySwap) =>
    `Claim of ${swapTypeToPrettyString(swap.type)} Swap ${swap.id}`;

  public static claimAddressLabel = (type: SwapType, id: string) =>
    `Claim address of ${swapTypeToPrettyString(type)} Swap ${id}`;

  public static claimCooperativeLabel = (swap: AnySwap) =>
    `Cooperative claim for ${swapTypeToPrettyString(swap.type)} Swap ${swap.id}`;

  public static claimBatchLabel = (ids: string[]) =>
    `Batch claim of Swaps ${ids.join(', ')}`;

  public static refundLabel = (swap: AnySwap) =>
    `Refund of ${swapTypeToPrettyString(swap.type)} Swap ${swap.id}`;

  public static refundAddressLabel = (type: SwapType, id: string) =>
    `Refund address of ${swapTypeToPrettyString(type)} Swap ${id}`;

  public static erc20Approval = () => 'ERC20 approval';
}

export default TransactionLabelRepository;
