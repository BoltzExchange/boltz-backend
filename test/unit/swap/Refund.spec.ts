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
      result: '01000000000101285d227e2823c679c224b4d562a9b5b5b7b927badd483df9f4225c6fc761d75400000000000000000001e80300000000000016001400000000000000000000000000000000000000000347304402202ce597865ddc7db924645e924a6d9653f17d315e5e65f5b435d7978543b4546502204397b8fd8069a9eef2b3b4fbb0c13797ce40fbbc78d0ddd397e6e7ac3b38ee9e010064a914a0738c92fde6361f09d28950c7bd0d2bf32b34be87632103be4a251dae719d565ce1d6a7a5787df99fc1ecc1f6e847567981a686f32abce167027802b1752103f7877d4ae985bb30b6f150ad6b6b9935c342432beed1a4781347b169c1e2417368ac0b000000',
    };

    const result = constructRefundTransaction(
      timeoutBlockHeight,
      refundKeys,
      destinationScript,
      testData.args.utxo,
      redeemScript,
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
      result: '0100000001285d227e2823c679c224b4d562a9b5b5b7b927badd483df9f4225c6fc761d75400000000af473044022023e89a77bbf66f182e5ef573683581f77003d69b0c60129fed67ba478c5fdbb602200dc2d3223cff6b8ff10dbddb3e70baa5037cd57c53df00c359e52c2f89e4655d01004c64a914a0738c92fde6361f09d28950c7bd0d2bf32b34be87632103be4a251dae719d565ce1d6a7a5787df99fc1ecc1f6e847567981a686f32abce167027802b1752103f7877d4ae985bb30b6f150ad6b6b9935c342432beed1a4781347b169c1e2417368ac0000000001e80300000000000016001400000000000000000000000000000000000000000b000000',
    };

    const result = constructRefundTransaction(
      timeoutBlockHeight,
      refundKeys,
      destinationScript,
      testData.args.utxo,
      redeemScript,
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
      result: '01000000000101285d227e2823c679c224b4d562a9b5b5b7b927badd483df9f4225c6fc761d75400000000232200206f38b6ce82427d4df080a9833d06cc6c66ab816545c9fd4df50f9d1ca8430b9e0000000001e80300000000000016001400000000000000000000000000000000000000000347304402202ce597865ddc7db924645e924a6d9653f17d315e5e65f5b435d7978543b4546502204397b8fd8069a9eef2b3b4fbb0c13797ce40fbbc78d0ddd397e6e7ac3b38ee9e010064a914a0738c92fde6361f09d28950c7bd0d2bf32b34be87632103be4a251dae719d565ce1d6a7a5787df99fc1ecc1f6e847567981a686f32abce167027802b1752103f7877d4ae985bb30b6f150ad6b6b9935c342432beed1a4781347b169c1e2417368ac0b000000',
    };

    const result = constructRefundTransaction(
      timeoutBlockHeight,
      refundKeys,
      destinationScript,
      testData.args.utxo,
      redeemScript,
    );

    expect(result.toHex()).to.be.equal(testData.result);
  });
});
