import { SwapType, swapTypeToPrettyString } from '../../consts/Enums';
import { AnySwap } from '../../consts/Types';
import TransactionLabel from '../models/TransactionLabel';

class TransactionLabelRepository {
  public static addLabel = async (
    id: string,
    symbol: string,
    label: string,
  ) => {
    await TransactionLabel.create({
      id,
      label,
      symbol,
    });
  };

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

  public static claimBatchLabel = (type: SwapType, ids: string[]) =>
    `Batch claim of ${swapTypeToPrettyString(type)} Swaps ${ids.join(', ')}`;

  public static refundLabel = (swap: AnySwap) =>
    `Refund of ${swapTypeToPrettyString(swap.type)} Swap ${swap.id}`;

  public static refundAddressLabel = (type: SwapType, id: string) =>
    `Refund address of ${swapTypeToPrettyString(type)} Swap ${id}`;

  public static erc20Approval = () => 'ERC20 approval';
}

export default TransactionLabelRepository;
