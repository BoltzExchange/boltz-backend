import type { SwapType } from '../consts/Enums';
import SendApprovalHoldRepository from '../db/repositories/SendApprovalHoldRepository';
import type SendApprovalHook from './hooks/SendApprovalHook';
import { SendApprovalAction } from './hooks/SendApprovalHook';

// Ask the send approval hook for a decision. When the swap is already held, keep
// holding on a non-resolution (hook not connected, timed out or disconnected) so
// only a real approver response can release it.
const resolveSendApprovalDecision = async (
  hook: SendApprovalHook,
  swapId: string,
  pair: string,
  symbol: string,
  amount: number,
): Promise<SendApprovalAction> => {
  const fallback = (await SendApprovalHoldRepository.exists(swapId))
    ? SendApprovalAction.Hold
    : undefined;

  return hook.hook(swapId, pair, symbol, amount, fallback);
};

// Persist the decision: a Hold creates the hold row and returns false (the send
// must keep holding); anything else removes the row and returns true (the send
// may proceed)
const persistSendApprovalDecision = async (
  swapId: string,
  type: SwapType,
  action: SendApprovalAction,
): Promise<boolean> => {
  if (action === SendApprovalAction.Hold) {
    await SendApprovalHoldRepository.create({ swapId, type });
    return false;
  }

  await SendApprovalHoldRepository.remove(swapId);
  return true;
};

export { resolveSendApprovalDecision, persistSendApprovalDecision };
