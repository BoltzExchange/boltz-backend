import Logger from '../../../lib/Logger';
import RoutingFee from '../../../lib/lightning/RoutingFee';
import type DecodedInvoice from '../../../lib/sidecar/DecodedInvoice';

describe('RoutingFee', () => {
  const logger = Logger.disabledLogger;

  describe('constructor', () => {
    test('should use default ratio when not provided', () => {
      const routingFee = new RoutingFee(logger, {});
      expect(routingFee.defaultPaymentFeeRatio).toEqual(0.0035);
    });

    test('should use provided default ratio', () => {
      const defaultRatio = 0.05;
      const routingFee = new RoutingFee(logger, {
        default: defaultRatio,
      });
      expect(routingFee.defaultPaymentFeeRatio).toEqual(defaultRatio);
    });

    test('should initialize with overrides', () => {
      const overrides = {
        '03abc': 0.02,
        '03def': 0.03,
      };
      const routingFee = new RoutingFee(logger, {
        default: 0.01,
        overrides,
      });
      expect(routingFee.defaultPaymentFeeRatio).toEqual(0.01);
      expect(routingFee['overrides'].size).toEqual(2);
      expect(routingFee['overrides'].get('03abc')).toEqual(0.02);
      expect(routingFee['overrides'].get('03def')).toEqual(0.03);
    });

    test('should convert node IDs to lowercase in overrides', () => {
      const overrides = {
        '03ABC': 0.02,
        '03DEF': 0.03,
      };
      const routingFee = new RoutingFee(logger, {
        overrides,
      });
      expect(routingFee['overrides'].get('03abc')).toEqual(0.02);
      expect(routingFee['overrides'].get('03def')).toEqual(0.03);
    });

    test.each`
      ratio    | name
      ${0}     | ${'default'}
      ${-0.01} | ${'default'}
      ${0.1}   | ${'default'}
      ${0.11}  | ${'default'}
    `(
      'should throw error for invalid default ratio: $ratio',
      ({ ratio, name }) => {
        expect(() => new RoutingFee(logger, { default: ratio })).toThrow(
          `invalid routing fee ratio for ${name}: ${ratio}. Must be > 0 and < 0.1 (10%)`,
        );
      },
    );

    test.each`
      nodeId     | ratio
      ${'node1'} | ${0}
      ${'node2'} | ${-0.01}
      ${'node3'} | ${0.1}
      ${'node4'} | ${0.15}
    `(
      'should throw error for invalid override ratio: $ratio for $nodeId',
      ({ nodeId, ratio }) => {
        expect(
          () =>
            new RoutingFee(logger, {
              overrides: { [nodeId]: ratio },
            }),
        ).toThrow(
          `invalid routing fee ratio for ${nodeId}: ${ratio}. Must be > 0 and < 0.1 (10%)`,
        );
      },
    );
  });

  describe('calculateFee', () => {
    const minFeeMillisatoshi = Math.ceil(121 * 1000);

    const createInvoice = (
      amountMsat: number,
      payee?: Buffer,
      routingHints?: { nodeId: string }[][],
      paths?: { nodeId: Buffer | undefined }[],
    ): DecodedInvoice =>
      ({
        amountMsat,
        payee,
        routingHints: routingHints || [],
        paths: paths || [],
      }) as any;

    test('should calculate fee with default ratio', () => {
      const routingFee = new RoutingFee(logger, { default: 0.01 });
      const amountMsat = 1_000_000;
      const decoded = createInvoice(amountMsat);

      const fee = routingFee.calculateFee(decoded);

      expect(fee).toEqual(minFeeMillisatoshi);
    });

    test('should use minimum fee when calculated fee is below minimum', () => {
      const routingFee = new RoutingFee(logger, { default: 0.01 });
      const amountMsat = 100_000;
      const decoded = createInvoice(amountMsat);

      const fee = routingFee.calculateFee(decoded);

      expect(fee).toEqual(minFeeMillisatoshi);
    });

    test('should calculate fee above minimum', () => {
      const routingFee = new RoutingFee(logger, { default: 0.02 });
      const amountMsat = 10_000_000;
      const decoded = createInvoice(amountMsat);

      const fee = routingFee.calculateFee(decoded);

      expect(fee).toEqual(Math.ceil(amountMsat * 0.02));
    });

    test('should use maxPaymentFeeRatio when provided', () => {
      const routingFee = new RoutingFee(logger, { default: 0.01 });
      const amountMsat = 10_000_000;
      const maxPaymentFeeRatio = 0.05;
      const decoded = createInvoice(amountMsat);

      const fee = routingFee.calculateFee(decoded, maxPaymentFeeRatio);

      expect(fee).toEqual(Math.ceil(amountMsat * maxPaymentFeeRatio));
    });

    test('should use override for payee node', () => {
      const payeeNodeId =
        '02a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3';
      const overrideRatio = 0.03;
      const routingFee = new RoutingFee(logger, {
        default: 0.01,
        overrides: { [payeeNodeId]: overrideRatio },
      });
      const amountMsat = 10_000_000;
      const decoded = createInvoice(
        amountMsat,
        Buffer.from(payeeNodeId, 'hex'),
      );

      const fee = routingFee.calculateFee(decoded);

      expect(fee).toEqual(Math.ceil(amountMsat * overrideRatio));
    });

    test('should use override for routing hint node', () => {
      const routingHintNodeId =
        '02d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2';
      const overrideRatio = 0.04;
      const routingFee = new RoutingFee(logger, {
        default: 0.01,
        overrides: { [routingHintNodeId]: overrideRatio },
      });
      const amountMsat = 10_000_000;
      const decoded = createInvoice(amountMsat, undefined, [
        [{ nodeId: routingHintNodeId }],
      ]);

      const fee = routingFee.calculateFee(decoded);

      expect(fee).toEqual(Math.ceil(amountMsat * overrideRatio));
    });

    test('should use override for path node', () => {
      const pathNodeId =
        '03a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3';
      const overrideRatio = 0.05;
      const routingFee = new RoutingFee(logger, {
        default: 0.01,
        overrides: { [pathNodeId]: overrideRatio },
      });
      const amountMsat = 10_000_000;
      const decoded = createInvoice(
        amountMsat,
        undefined,
        [],
        [{ nodeId: Buffer.from(pathNodeId, 'hex') }],
      );

      const fee = routingFee.calculateFee(decoded);

      expect(fee).toEqual(Math.ceil(amountMsat * overrideRatio));
    });

    test('should use highest override when multiple destinations have overrides', () => {
      const node1 = '02aa';
      const node2 = '02bb';
      const node3 = '02cc';
      const routingFee = new RoutingFee(logger, {
        default: 0.01,
        overrides: {
          [node1]: 0.02,
          [node2]: 0.05,
          [node3]: 0.03,
        },
      });
      const amountMsat = 10_000_000;
      const decoded = createInvoice(
        amountMsat,
        Buffer.from(node1, 'hex'),
        [[{ nodeId: node2 }]],
        [{ nodeId: Buffer.from(node3, 'hex') }],
      );

      const fee = routingFee.calculateFee(decoded);

      expect(fee).toEqual(Math.ceil(amountMsat * 0.05));
    });

    test('should handle mixed case node IDs in invoice', () => {
      const nodeId =
        '02ABCDEFABCDEFABCDEFABCDEFABCDEFABCDEFABCDEFABCDEFABCDEFABCDEFAB';
      const overrideRatio = 0.03;
      const routingFee = new RoutingFee(logger, {
        default: 0.01,
        overrides: { [nodeId.toLowerCase()]: overrideRatio },
      });
      const amountMsat = 10_000_000;
      const decoded = createInvoice(amountMsat, Buffer.from(nodeId, 'hex'));

      const fee = routingFee.calculateFee(decoded);

      expect(fee).toEqual(Math.ceil(amountMsat * overrideRatio));
    });

    test('should use default when no overrides match', () => {
      const routingFee = new RoutingFee(logger, {
        default: 0.01,
        overrides: {
          '03aa': 0.05,
        },
      });
      const amountMsat = 20_000_000;
      const decoded = createInvoice(amountMsat, Buffer.from('03bb', 'hex'));

      const fee = routingFee.calculateFee(decoded);

      expect(fee).toEqual(Math.ceil(amountMsat * 0.01));
    });

    test('should handle invoice with no destinations', () => {
      const routingFee = new RoutingFee(logger, { default: 0.01 });
      const amountMsat = 20_000_000;
      const decoded = createInvoice(amountMsat);

      const fee = routingFee.calculateFee(decoded);

      expect(fee).toEqual(Math.ceil(amountMsat * 0.01));
    });

    test('should handle paths with undefined nodeId', () => {
      const routingFee = new RoutingFee(logger, { default: 0.01 });
      const amountMsat = 20_000_000;
      const decoded = createInvoice(
        amountMsat,
        undefined,
        [],
        [{ nodeId: undefined }, { nodeId: undefined }],
      );

      const fee = routingFee.calculateFee(decoded);

      expect(fee).toEqual(Math.ceil(amountMsat * 0.01));
    });

    test('should handle multiple routing hints', () => {
      const node1 = '0211';
      const node2 = '0222';
      const node3 = '0233';
      const routingFee = new RoutingFee(logger, {
        default: 0.01,
        overrides: {
          [node2]: 0.04,
        },
      });
      const amountMsat = 10_000_000;
      const decoded = createInvoice(amountMsat, undefined, [
        [{ nodeId: node1 }],
        [{ nodeId: node2 }, { nodeId: node3 }],
      ]);

      const fee = routingFee.calculateFee(decoded);

      expect(fee).toEqual(Math.ceil(amountMsat * 0.04));
    });

    test('should prioritize maxPaymentFeeRatio over overrides', () => {
      const nodeId = '02a1';
      const overrideRatio = 0.05;
      const maxPaymentFeeRatio = 0.02;

      const routingFee = new RoutingFee(logger, {
        default: 0.01,
        overrides: { [nodeId]: overrideRatio },
      });
      const amountMsat = 10_000_000;
      const decoded = createInvoice(amountMsat, Buffer.from(nodeId, 'hex'));

      const fee = routingFee.calculateFee(decoded, maxPaymentFeeRatio);

      expect(fee).toEqual(Math.ceil(amountMsat * maxPaymentFeeRatio));
    });

    test('should use minimum fee for zero amount invoice', () => {
      const routingFee = new RoutingFee(logger, { default: 0.01 });
      const amountMsat = 0;
      const decoded = createInvoice(amountMsat);

      const fee = routingFee.calculateFee(decoded);

      expect(fee).toEqual(minFeeMillisatoshi);
    });

    test('should handle duplicate destinations with different overrides', () => {
      const nodeId = '02a1';
      const overrideRatio = 0.05;

      const routingFee = new RoutingFee(logger, {
        default: 0.01,
        overrides: { [nodeId]: overrideRatio },
      });
      const amountMsat = 10_000_000;
      const decoded = createInvoice(amountMsat, Buffer.from(nodeId, 'hex'), [
        [{ nodeId }],
      ]);

      const fee = routingFee.calculateFee(decoded);

      expect(fee).toEqual(Math.ceil(amountMsat * overrideRatio));
    });

    test('should ceil the fee calculation', () => {
      const routingFee = new RoutingFee(logger, { default: 0.015 });
      const amountMsat = 10_000_001;
      const decoded = createInvoice(amountMsat);

      const fee = routingFee.calculateFee(decoded);

      expect(fee).toEqual(150001);
    });

    test.each`
      amountMsat    | ratio   | expectedFee
      ${1_000_000}  | ${0.01} | ${minFeeMillisatoshi}
      ${10_000_000} | ${0.01} | ${minFeeMillisatoshi}
      ${20_000_000} | ${0.01} | ${200_000}
      ${50_000_000} | ${0.02} | ${1_000_000}
      ${100_000}    | ${0.05} | ${minFeeMillisatoshi}
    `(
      'should calculate fee for $amountMsat msat with ratio $ratio',
      ({ amountMsat, ratio, expectedFee }) => {
        const routingFee = new RoutingFee(logger, { default: ratio });
        const decoded = createInvoice(amountMsat);

        const fee = routingFee.calculateFee(decoded);

        expect(fee).toEqual(expectedFee);
      },
    );
  });
});
