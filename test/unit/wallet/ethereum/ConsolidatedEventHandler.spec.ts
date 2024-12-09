import ConsolidatedEventHandler from '../../../../lib/wallet/ethereum/ConsolidatedEventHandler';
import ContractEventHandler from '../../../../lib/wallet/ethereum/contracts/ContractEventHandler';

describe('ConsolidatedEventHandler', () => {
  const emittersV3 = {};
  const eventsV3 = {
    rescan: jest.fn(),
    on: jest.fn().mockImplementation((event, callback) => {
      emittersV3[event] = callback;
    }),
  } as unknown as ContractEventHandler;

  const emittersV4 = {};
  const eventsV4 = {
    rescan: jest.fn(),
    on: jest.fn().mockImplementation((event, callback) => {
      emittersV4[event] = callback;
    }),
  } as unknown as ContractEventHandler;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test.each`
    event
    ${'eth.lockup'}
    ${'eth.claim'}
    ${'eth.refund'}
    ${'erc20.lockup'}
    ${'erc20.claim'}
    ${'erc20.refund'}
  `('should forward event $event', ({ event }) => {
    expect.assertions(6);

    const handler = new ConsolidatedEventHandler();
    handler.register(eventsV3);
    handler.register(eventsV4);

    expect(eventsV3.on).toHaveBeenCalledTimes(6);
    expect(eventsV3.on).toHaveBeenCalledWith(event, expect.any(Function));

    expect(emittersV3[event]).toBeDefined();
    expect(emittersV4[event]).toBeDefined();

    const dataV3 = 'dataV3';
    const dataV4 = 'dataV4';

    handler.on(event, (emittedData) => {
      expect(emittedData === dataV3 || emittedData === dataV4).toEqual(true);
    });

    emittersV3[event](dataV3);
    emittersV4[event](dataV4);
  });

  test('should rescan all event handlers', async () => {
    const handler = new ConsolidatedEventHandler();
    handler.register(eventsV3);
    handler.register(eventsV4);

    const startHeight = 21;
    await handler.rescan(startHeight);

    expect(eventsV3.rescan).toHaveBeenCalledWith(startHeight);
    expect(eventsV4.rescan).toHaveBeenCalledWith(startHeight);
  });
});
