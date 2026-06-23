import type { SendApprovalHoldType } from '../models/SendApprovalHold';
import SendApprovalHold from '../models/SendApprovalHold';

class SendApprovalHoldRepository {
  public static create = async (
    hold: SendApprovalHoldType,
  ): Promise<SendApprovalHold> => {
    const [sendApprovalHold] = await SendApprovalHold.findOrCreate({
      where: { swapId: hold.swapId },
      defaults: hold,
    });

    return sendApprovalHold;
  };

  public static getAll = (): Promise<SendApprovalHold[]> =>
    SendApprovalHold.findAll();

  public static exists = async (swapId: string): Promise<boolean> =>
    (await SendApprovalHold.findByPk(swapId)) !== null;

  public static remove = (swapId: string): Promise<number> =>
    SendApprovalHold.destroy({ where: { swapId } });
}

export default SendApprovalHoldRepository;
