import Logger from '../../../lib/Logger';
import ElementsWrapper from '../../../lib/chain/ElementsWrapper';
import type Sidecar from '../../../lib/sidecar/Sidecar';

describe('ElementsWrapper', () => {
  const mockSidecar = {
    on: jest.fn(),
  } as unknown as Sidecar;

  const baseConfig = {
    host: '127.0.0.1',
    port: 123,
    user: 'good',
    password: 'morning',
  };

  describe('feeFloor', () => {
    test('should return feeFloor from wallet client (default)', () => {
      const wrapper = new ElementsWrapper(
        Logger.disabledLogger,
        mockSidecar,
        'liquidRegtest',
        baseConfig,
      );

      // Default Elements fee floor is 0.1
      expect(wrapper.feeFloor).toEqual(0.1);
    });

    test('should return custom feeFloor from wallet client', () => {
      const customFeeFloor = 0.05;
      const wrapper = new ElementsWrapper(
        Logger.disabledLogger,
        mockSidecar,
        'liquidRegtest',
        {
          ...baseConfig,
          feeFloor: customFeeFloor,
        },
      );

      expect(wrapper.feeFloor).toEqual(customFeeFloor);
    });

    test('should return feeFloor from lowball client when configured', () => {
      const customFeeFloor = 0.03;
      const wrapper = new ElementsWrapper(
        Logger.disabledLogger,
        mockSidecar,
        'liquidRegtest',
        {
          ...baseConfig,
          lowball: {
            ...baseConfig,
            feeFloor: customFeeFloor,
          },
        },
      );

      // Lowball client is the wallet client when configured
      expect(wrapper.feeFloor).toEqual(customFeeFloor);
    });
  });
});
