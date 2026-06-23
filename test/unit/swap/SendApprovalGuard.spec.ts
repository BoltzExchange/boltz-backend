import { SwapType } from '../../../lib/consts/Enums';
import SendApprovalHoldRepository from '../../../lib/db/repositories/SendApprovalHoldRepository';
import {
  persistSendApprovalDecision,
  resolveSendApprovalDecision,
} from '../../../lib/swap/SendApprovalGuard';
import { SendApprovalAction } from '../../../lib/swap/hooks/SendApprovalHook';

jest.mock('../../../lib/db/repositories/SendApprovalHoldRepository', () => ({
  __esModule: true,
  default: {
    create: jest.fn(),
    remove: jest.fn(),
    exists: jest.fn().mockResolvedValue(false),
  },
}));

describe('SendApprovalGuard', () => {
  const hook = { hook: jest.fn().mockResolvedValue(SendApprovalAction.Accept) };

  beforeEach(() => {
    jest.clearAllMocks();
    (SendApprovalHoldRepository.exists as jest.Mock).mockResolvedValue(false);
  });

  describe('resolveSendApprovalDecision', () => {
    test('should ask without a fallback when the swap is not held', async () => {
      await expect(
        resolveSendApprovalDecision(hook as any, 'id', 'L-BTC/BTC', 'BTC', 100),
      ).resolves.toEqual(SendApprovalAction.Accept);

      expect(hook.hook).toHaveBeenCalledWith(
        'id',
        'L-BTC/BTC',
        'BTC',
        100,
        undefined,
      );
    });

    test('should ask with a hold fallback when the swap is already held', async () => {
      (SendApprovalHoldRepository.exists as jest.Mock).mockResolvedValue(true);

      await resolveSendApprovalDecision(
        hook as any,
        'id',
        'L-BTC/BTC',
        'BTC',
        100,
      );

      expect(hook.hook).toHaveBeenCalledWith(
        'id',
        'L-BTC/BTC',
        'BTC',
        100,
        SendApprovalAction.Hold,
      );
    });
  });

  describe('persistSendApprovalDecision', () => {
    test('should create the hold and not allow proceeding on Hold', async () => {
      await expect(
        persistSendApprovalDecision(
          'id',
          SwapType.Chain,
          SendApprovalAction.Hold,
        ),
      ).resolves.toEqual(false);

      expect(SendApprovalHoldRepository.create).toHaveBeenCalledWith({
        swapId: 'id',
        type: SwapType.Chain,
      });
      expect(SendApprovalHoldRepository.remove).not.toHaveBeenCalled();
    });

    test.each`
      action
      ${SendApprovalAction.Accept}
      ${SendApprovalAction.Reject}
    `(
      'should remove the hold and allow proceeding on $action',
      async ({ action }) => {
        await expect(
          persistSendApprovalDecision('id', SwapType.Submarine, action),
        ).resolves.toEqual(true);

        expect(SendApprovalHoldRepository.remove).toHaveBeenCalledWith('id');
        expect(SendApprovalHoldRepository.create).not.toHaveBeenCalled();
      },
    );
  });
});
