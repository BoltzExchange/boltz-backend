// tslint:disable: max-line-length

import os from 'os';
import { expect } from 'chai';
import { Transaction } from 'bitcoinjs-lib';
import * as utils from '../../lib/Utils';
import { constructTransaction } from '../Utils';

describe('Utils', () => {
  const sampleTransactions = [
    Transaction.fromHex('01000000017fa897c3556271c34cb28c03c196c2d912093264c9d293cb4980a2635474467d010000000f5355540b6f93598893578893588851ffffffff01501e0000000000001976a914aa2482ce71d219018ef334f6cc551ee88abd920888ac00000000'),
    Transaction.fromHex('010000000001010dabcc426e9f5f57c1000e1560d06ebd21f510c74fe2d0c30fe8eefcabaf31f50200000000fdffffff02a086010000000000160014897ab9fb4e4bf920af9047b5a1896b4689a65bff0e52090000000000160014b3330dbbb43be7a4e2df367f58cf76c74f68141602483045022100ef83bcabb40debd4e13c0eda6b918b940b404344f41253a42c51fc76319ca64502205a1ad86d0bb92f25de75a6b37edf7118863ba9b7c438473ecde07765dedbb9ed012103df1535396d6f4c68458ef3ae86a32e5484e89d7bfc94cabd6c0c09ceaab0b2ab00000000'),
  ];

  it('should split derivation path', () => {
    const master = 'm';
    const sub = [0, 2, 543];
    const derivationPath = `${master}/${sub[0]}/${sub[1]}/${sub[2]}`;

    const result = utils.splitDerivationPath(derivationPath);

    expect(result.master).to.be.equal(master);
    expect(result.sub.length).to.be.equal(sub.length);

    sub.forEach((value, index) => {
      expect(result.sub[index]).to.be.equal(value);
    });
  });

  it('should concat error code', () => {
    const prefix = 0;
    const code = 1;

    expect(utils.concatErrorCode(prefix, code)).to.be.equal(`${prefix}.${code}`);
  });

  it('should capitalize the first letter', () => {
    const input = 'test123';
    const result = input.charAt(0).toUpperCase() + input.slice(1);

    expect(utils.capitalizeFirstLetter(input)).to.be.equal(result);
  });

  it('should resolve home', () => {
    const input = '~.boltz';

    if (os.platform() !== 'win32') {
      expect(utils.resolveHome(input).charAt(0)).to.be.equal('/');
    } else {
      expect(utils.resolveHome(input)).to.be.equal(input);
    }
  });

  it('should get a hex encoded Buffers and strings', () => {
    const string = 'test';

    expect(utils.getHexBuffer(string)).to.be.deep.equal(Buffer.from(string, 'hex'));
    expect(utils.getHexString(Buffer.from(string))).to.be.equal(Buffer.from(string).toString('hex'));
  });

  it('should check whether it is an object', () => {
    expect(utils.isObject({})).to.be.true;
    expect(utils.isObject([])).to.be.false;
  });

  it('should split host and port', () => {
    const host = 'localhost';
    const port = '9000';

    const input = `${host}:${port}`;

    expect(utils.splitListen(input)).to.be.deep.equal({ host, port });
  });

  it('should detect whether a transaction signals RBF', () => {
    const inputHash = '9788d1d096dfb41c429a5e76bf2c6e6eb6e3b9aa57feecae3b33c57b4f6fea62';

    expect(utils.transactionSignalsRbfExplicitly(constructTransaction(true, inputHash))).to.be.true;
    expect(utils.transactionSignalsRbfExplicitly(constructTransaction(false, inputHash))).to.be.false;

    expect(utils.transactionSignalsRbfExplicitly(Transaction.fromHex(sampleTransactions[0].toHex()))).to.be.false;
    expect(utils.transactionSignalsRbfExplicitly(Transaction.fromHex(sampleTransactions[1].toHex()))).to.be.true;
  });
});
