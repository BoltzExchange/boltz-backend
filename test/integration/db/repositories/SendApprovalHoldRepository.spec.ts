import Logger from '../../../../lib/Logger';
import { SwapType } from '../../../../lib/consts/Enums';
import Database from '../../../../lib/db/Database';
import SendApprovalHold from '../../../../lib/db/models/SendApprovalHold';
import SendApprovalHoldRepository from '../../../../lib/db/repositories/SendApprovalHoldRepository';

describe('SendApprovalHoldRepository', () => {
  let database: Database;

  beforeAll(async () => {
    database = new Database(Logger.disabledLogger, Database.memoryDatabase);
    await database.init();
  });

  beforeEach(async () => {
    await SendApprovalHold.truncate();
  });

  afterAll(async () => {
    await database.close();
  });

  test('should create a hold', async () => {
    const hold = await SendApprovalHoldRepository.create({
      swapId: 'swap-id',
      type: SwapType.ReverseSubmarine,
    });

    expect(hold.swapId).toEqual('swap-id');
    expect(hold.type).toEqual(SwapType.ReverseSubmarine);
    expect(await SendApprovalHoldRepository.getAll()).toHaveLength(1);
  });

  test('should reject a hold with an invalid type', async () => {
    await expect(
      SendApprovalHoldRepository.create({
        swapId: 'swap-id',
        type: 99 as unknown as SwapType,
      }),
    ).rejects.toThrow();

    expect(await SendApprovalHoldRepository.getAll()).toHaveLength(0);
  });

  test('should be idempotent when the hold already exists', async () => {
    await SendApprovalHoldRepository.create({
      swapId: 'swap-id',
      type: SwapType.Chain,
    });
    const again = await SendApprovalHoldRepository.create({
      swapId: 'swap-id',
      type: SwapType.ReverseSubmarine,
    });

    expect(again.type).toEqual(SwapType.Chain);
    expect(await SendApprovalHoldRepository.getAll()).toHaveLength(1);
  });

  test('should get all holds', async () => {
    await SendApprovalHoldRepository.create({
      swapId: 'a',
      type: SwapType.Chain,
    });
    await SendApprovalHoldRepository.create({
      swapId: 'b',
      type: SwapType.ReverseSubmarine,
    });

    const all = await SendApprovalHoldRepository.getAll();
    expect(all.map((hold) => hold.swapId).sort()).toEqual(['a', 'b']);
    expect(all.find((hold) => hold.swapId === 'a')?.type).toEqual(
      SwapType.Chain,
    );
    expect(all.find((hold) => hold.swapId === 'b')?.type).toEqual(
      SwapType.ReverseSubmarine,
    );
  });

  test('should remove a hold', async () => {
    await SendApprovalHoldRepository.create({
      swapId: 'swap-id',
      type: SwapType.Chain,
    });

    expect(await SendApprovalHoldRepository.remove('swap-id')).toEqual(1);
    expect(await SendApprovalHoldRepository.getAll()).toHaveLength(0);
  });

  test('should not fail removing a non-existent hold', async () => {
    expect(await SendApprovalHoldRepository.remove('missing')).toEqual(0);
  });

  test('should report whether a hold exists', async () => {
    expect(await SendApprovalHoldRepository.exists('swap-id')).toEqual(false);

    await SendApprovalHoldRepository.create({
      swapId: 'swap-id',
      type: SwapType.Chain,
    });
    expect(await SendApprovalHoldRepository.exists('swap-id')).toEqual(true);

    await SendApprovalHoldRepository.remove('swap-id');
    expect(await SendApprovalHoldRepository.exists('swap-id')).toEqual(false);
  });
});
