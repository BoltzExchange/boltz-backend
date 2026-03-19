import ReverseRoutingHint from '../../../lib/db/models/ReverseRoutingHint';
import ReverseRoutingHintRepository from '../../../lib/db/repositories/ReverseRoutingHintRepository';

describe('ReverseRoutingHintRepository', () => {
  const create = jest.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    ReverseRoutingHint.create = create;
    jest.clearAllMocks();
  });

  test('should persist hints with a script pubkey', async () => {
    const hint = {
      swapId: 'swap-id',
      symbol: 'BTC',
      scriptPubkey: Buffer.from('001122', 'hex'),
      signature: Buffer.from('334455', 'hex'),
    };

    await ReverseRoutingHintRepository.addHint(hint);

    expect(create).toHaveBeenCalledTimes(1);
    expect(create).toHaveBeenCalledWith(hint);
  });

  test('should persist hints with an address', async () => {
    const hint = {
      swapId: 'swap-id',
      symbol: 'ARK',
      address: 'tark1qexample',
      signature: Buffer.from('334455', 'hex'),
    };

    await ReverseRoutingHintRepository.addHint(hint);

    expect(create).toHaveBeenCalledTimes(1);
    expect(create).toHaveBeenCalledWith(hint);
  });

  test('should persist hints with a script pubkey when address is null', async () => {
    const hint = {
      swapId: 'swap-id',
      symbol: 'BTC',
      scriptPubkey: Buffer.from('001122', 'hex'),
      address: null as unknown as string,
      signature: Buffer.from('334455', 'hex'),
    };

    await ReverseRoutingHintRepository.addHint(hint);

    expect(create).toHaveBeenCalledTimes(1);
    expect(create).toHaveBeenCalledWith(hint);
  });

  test('should persist hints with an address when script pubkey is null', async () => {
    const hint = {
      swapId: 'swap-id',
      symbol: 'ARK',
      address: 'tark1qexample',
      scriptPubkey: null as unknown as Buffer,
      signature: Buffer.from('334455', 'hex'),
    };

    await ReverseRoutingHintRepository.addHint(hint);

    expect(create).toHaveBeenCalledTimes(1);
    expect(create).toHaveBeenCalledWith(hint);
  });

  test('should throw if neither script pubkey nor address are defined', async () => {
    await expect(
      ReverseRoutingHintRepository.addHint({
        swapId: 'swap-id',
        symbol: 'BTC',
        signature: Buffer.from('334455', 'hex'),
      }),
    ).rejects.toThrow(
      'exactly one of reverse routing hint scriptPubkey or address must be defined',
    );

    expect(create).not.toHaveBeenCalled();
  });

  test('should throw if script pubkey and address are null', async () => {
    await expect(
      ReverseRoutingHintRepository.addHint({
        swapId: 'swap-id',
        symbol: 'BTC',
        scriptPubkey: null as unknown as Buffer,
        address: null as unknown as string,
        signature: Buffer.from('334455', 'hex'),
      }),
    ).rejects.toThrow(
      'exactly one of reverse routing hint scriptPubkey or address must be defined',
    );

    expect(create).not.toHaveBeenCalled();
  });

  test('should throw if both script pubkey and address are defined', async () => {
    await expect(
      ReverseRoutingHintRepository.addHint({
        swapId: 'swap-id',
        symbol: 'BTC',
        scriptPubkey: Buffer.from('001122', 'hex'),
        address: 'bcrt1qexample',
        signature: Buffer.from('334455', 'hex'),
      }),
    ).rejects.toThrow(
      'exactly one of reverse routing hint scriptPubkey or address must be defined',
    );

    expect(create).not.toHaveBeenCalled();
  });
});
