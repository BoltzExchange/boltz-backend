// tslint:disable:max-line-length
import { expect } from 'chai';
import { fromBase58 } from 'bip32';
import { address } from 'bitcoinjs-lib';
import { getHexBuffer } from '../../../lib/Utils';
import Networks from '../../../lib/consts/Networks';
import { constructRefundTransaction } from '../../../lib/swap/Refund';
import { OutputType } from '../../../lib/proto/boltzrpc_pb';

// TODO: use valid values
describe('Refund', () => {
  const timeoutBlockHeight = 11;
  const refundKeys = fromBase58('xprv9xgxR6htMdXUXGipynZp1janNrWNYJxaz2o4tH9fdtZqcF26BX5VB88GSM5KgZHWCyAyb8FZpQik2UET84CHfGWXFMG5zWWjmtDMgqYuo19');
  const redeemScript = getHexBuffer('a914a0738c92fde6361f09d28950c7bd0d2bf32b34be87632103be4a251dae719d565ce1d6a7a5787df99fc1ecc1f6e847567981a686f32abce167027802b1752103f7877d4ae985bb30b6f150ad6b6b9935c342432beed1a4781347b169c1e2417368ac');
  const destinationScript = address.toOutputScript('bcrt1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqdku202', Networks.bitcoinRegtest);

  const utxo = {
    txHash: getHexBuffer('285d227e2823c679c224b4d562a9b5b5b7b927badd483df9f4225c6fc761d754'),
    vout: 0,
    value: 2000,
  };

  it('should refund a P2WSH swap', () => {
    const testData = {
      args: {
        utxo: {
          ...utxo,
          type: OutputType.BECH32,
          script: getHexBuffer('00206f38b6ce82427d4df080a9833d06cc6c66ab816545c9fd4df50f9d1ca8430b9e'),
        },
      },
      result: '01000000000101285d227e2823c679c224b4d562a9b5b5b7b927badd483df9f4225c6fc761d754000000000000000000017a07000000000000160014000000000000000000000000000000000000000003483045022100f6409965db31e30d825ddf98ddeb2a758e98da3504ac0b9ac6ae4990bad32fd4022058a3927b42a4db58a02f55ae0142559481617f54127e93b841fc862d9dfced13010064a914a0738c92fde6361f09d28950c7bd0d2bf32b34be87632103be4a251dae719d565ce1d6a7a5787df99fc1ecc1f6e847567981a686f32abce167027802b1752103f7877d4ae985bb30b6f150ad6b6b9935c342432beed1a4781347b169c1e2417368ac0b000000',
    };

    const result = constructRefundTransaction(
      refundKeys,
      redeemScript,
      timeoutBlockHeight,
      testData.args.utxo,
      destinationScript,
    );

    expect(result.toHex()).to.be.equal(testData.result);
  });

  it('should refund a P2SH swap', () => {
    const testData = {
      args: {
        utxo: {
          ...utxo,
          type: OutputType.LEGACY,
          script: getHexBuffer('a9148f439aff651860bdb28c66500c6e958cfbe7a69387'),
        },
      },
      result: '0100000001285d227e2823c679c224b4d562a9b5b5b7b927badd483df9f4225c6fc761d75400000000af47304402200e3332c9c29c50511ccf5be56913c972391b9a8e284999b42d0e5fcbf2c54d0502200700ff8e245343e2b31124531119d044545dbd5cb30c114ecbb6a6deef10165f01004c64a914a0738c92fde6361f09d28950c7bd0d2bf32b34be87632103be4a251dae719d565ce1d6a7a5787df99fc1ecc1f6e847567981a686f32abce167027802b1752103f7877d4ae985bb30b6f150ad6b6b9935c342432beed1a4781347b169c1e2417368ac0000000001f70600000000000016001400000000000000000000000000000000000000000b000000',
    };

    const result = constructRefundTransaction(
      refundKeys,
      redeemScript,
      timeoutBlockHeight,
      testData.args.utxo,
      destinationScript,
    );

    expect(result.toHex()).to.be.equal(testData.result);
  });

  it('should refund a P2SH nested P2WSH swap', () => {
    const testData = {
      args: {
        utxo: {
          ...utxo,
          type: OutputType.COMPATIBILITY,
          script: getHexBuffer('a9143cdeb56e328a10d3bfe107fd5a16bd73871adb8d87'),
        },
      },
      result: '01000000000101285d227e2823c679c224b4d562a9b5b5b7b927badd483df9f4225c6fc761d75400000000232200206f38b6ce82427d4df080a9833d06cc6c66ab816545c9fd4df50f9d1ca8430b9e000000000160070000000000001600140000000000000000000000000000000000000000034730440220296d79d2e470ea38f209227d9aa1a3ebd00317e282778d8d2d6490d15ef2d14002200261ce28fd1c89d69dcdd9535403ddb39dc203240aed354ed649cef7147ba670010064a914a0738c92fde6361f09d28950c7bd0d2bf32b34be87632103be4a251dae719d565ce1d6a7a5787df99fc1ecc1f6e847567981a686f32abce167027802b1752103f7877d4ae985bb30b6f150ad6b6b9935c342432beed1a4781347b169c1e2417368ac0b000000',
    };

    const result = constructRefundTransaction(
      refundKeys,
      redeemScript,
      timeoutBlockHeight,
      testData.args.utxo,
      destinationScript,
    );

    expect(result.toHex()).to.be.equal(testData.result);
  });
});
