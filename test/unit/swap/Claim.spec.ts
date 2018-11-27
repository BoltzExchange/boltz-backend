// tslint:disable:max-line-length
import { expect } from 'chai';
import { fromBase58 } from 'bip32';
import { address } from 'bitcoinjs-lib';
import { getHexBuffer } from '../../../lib/Utils';
import Networks from '../../../lib/consts/Networks';
import { OutputType } from '../../../lib/proto/boltzrpc_pb';
import { constructClaimTransaction } from '../../../lib/swap/Claim';

// TODO: use valid values
describe('Claim', () => {
  const preimage = getHexBuffer('b5b2dbb1f0663878ecbc20323b58b92c');
  const keys = fromBase58('xprv9xgxR6htMdXUXGipynZp1janNrWNYJxaz2o4tH9fdtZqcF26BX5VB88GSM5KgZHWCyAyb8FZpQik2UET84CHfGWXFMG5zWWjmtDMgqYuo19');
  const redeemScript = getHexBuffer('a914a0738c92fde6361f09d28950c7bd0d2bf32b34be87632103be4a251dae719d565ce1d6a7a5787df99fc1ecc1f6e847567981a686f32abce167027802b1752103f7877d4ae985bb30b6f150ad6b6b9935c342432beed1a4781347b169c1e2417368ac');
  const destinationScript = address.toOutputScript('bcrt1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqdku202', Networks.bitcoinRegtest);

  const utxo = {
    txHash: getHexBuffer('285d227e2823c679c224b4d562a9b5b5b7b927badd483df9f4225c6fc761d754'),
    vout: 0,
    value: 2000,
  };

  it('should claim a P2WSH swap', () => {
    const testData = {
      args: {
        utxo: {
          ...utxo,
          type: OutputType.BECH32,
          script: getHexBuffer('00206f38b6ce82427d4df080a9833d06cc6c66ab816545c9fd4df50f9d1ca8430b9e'),
        },
      },
      result: '01000000000101285d227e2823c679c224b4d562a9b5b5b7b927badd483df9f4225c6fc761d75400000000000000000001760700000000000016001400000000000000000000000000000000000000000348304502210084107deb87799822ced6a5f58ab8cee5d12890e3bace092d25ba4e9a61e24ed60220091d026014b57e2bf42842a826be6f69d0245f656d6d6cc6fea179e05ca9fb930110b5b2dbb1f0663878ecbc20323b58b92c64a914a0738c92fde6361f09d28950c7bd0d2bf32b34be87632103be4a251dae719d565ce1d6a7a5787df99fc1ecc1f6e847567981a686f32abce167027802b1752103f7877d4ae985bb30b6f150ad6b6b9935c342432beed1a4781347b169c1e2417368ac00000000',
    };

    const result = constructClaimTransaction(
      {
        preimage,
        keys,
        redeemScript,
      },
      testData.args.utxo,
      destinationScript,
    );

    expect(result.toHex()).to.be.equal(testData.result);
  });

  it('should claim a P2SH swap', () => {
    const testData = {
      args: {
        utxo: {
          ...utxo,
          type: OutputType.LEGACY,
          script: getHexBuffer('a9148f439aff651860bdb28c66500c6e958cfbe7a69387'),
        },
      },
      result: '0100000001285d227e2823c679c224b4d562a9b5b5b7b927badd483df9f4225c6fc761d75400000000c0483045022100db3f44dc1113b4fc6fb09e22e7dd519378721350b4f8ca514ed032033a71348602201795e8aca5466a3bbbe46470eda6ae365844ec94b1d7bd10aebaeea4e6befca90110b5b2dbb1f0663878ecbc20323b58b92c4c64a914a0738c92fde6361f09d28950c7bd0d2bf32b34be87632103be4a251dae719d565ce1d6a7a5787df99fc1ecc1f6e847567981a686f32abce167027802b1752103f7877d4ae985bb30b6f150ad6b6b9935c342432beed1a4781347b169c1e2417368ac0000000001e706000000000000160014000000000000000000000000000000000000000000000000',
    };

    const result = constructClaimTransaction(
      {
        preimage,
        keys,
        redeemScript,
      },
      testData.args.utxo,
      destinationScript,
    );

    expect(result.toHex()).to.be.equal(testData.result);
  });

  it('should claim a P2SH nested P2WSH swap', () => {
    const testData = {
      args: {
        utxo: {
          ...utxo,
          type: OutputType.COMPATIBILITY,
          script: getHexBuffer('a9143cdeb56e328a10d3bfe107fd5a16bd73871adb8d87'),
        },
      },
      result: '01000000000101285d227e2823c679c224b4d562a9b5b5b7b927badd483df9f4225c6fc761d75400000000232200206f38b6ce82427d4df080a9833d06cc6c66ab816545c9fd4df50f9d1ca8430b9e00000000015c0700000000000016001400000000000000000000000000000000000000000347304402204594ba0f54beccd5f991b78b89ecc8f3b84e0ff424ffce0e8238ed898e5565f7022033627b26c3cc1db8741e476c3c630e81222bfd745770087fdccd65c1c1531bad0110b5b2dbb1f0663878ecbc20323b58b92c64a914a0738c92fde6361f09d28950c7bd0d2bf32b34be87632103be4a251dae719d565ce1d6a7a5787df99fc1ecc1f6e847567981a686f32abce167027802b1752103f7877d4ae985bb30b6f150ad6b6b9935c342432beed1a4781347b169c1e2417368ac00000000',
    };

    const result = constructClaimTransaction(
      {
        preimage,
        keys,
        redeemScript,
      },
      testData.args.utxo,
      destinationScript,
    );

    expect(result.toHex()).to.be.equal(testData.result);
  });
});
