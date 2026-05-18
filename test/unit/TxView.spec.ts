import { Transaction as ScureTransaction } from '@scure/btc-signer';
import { Transaction as LiquidTransaction, confidential } from 'liquidjs-lib';
import { TxView } from '../../lib/TxView';
import { constructTransaction } from '../Utils';

const buildLiquidTx = (sequence = 0xffffffff): LiquidTransaction => {
  const tx = new LiquidTransaction();
  tx.addInput(Buffer.alloc(32, 0xaa), 0, sequence);
  const explicitValue = confidential.satoshiToConfidentialValue(1_000_000);
  const lbtcAsset = Buffer.concat([
    Buffer.from([0x01]),
    Buffer.alloc(32, 0xbb),
  ]);
  const script = Buffer.from([0x00, 0x14, ...Array(20).fill(0xcc)]);
  tx.addOutput(script, explicitValue, lbtcAsset, Buffer.from([0x00]));
  const feeValue = confidential.satoshiToConfidentialValue(100);
  tx.addOutput(Buffer.alloc(0), feeValue, lbtcAsset, Buffer.from([0x00]));
  return tx;
};

const liquidConfidentialHex =
  '02000000010147be68b6ffc3a6232d18cb26b5bde4bc5406a3df2affb8a7169d80ea2f7798860100000000fdffffff020b8d94aa4c28a8d3f9107d2ed60d34d3ea66ce210206547d434233345e33c0b98408355b510bce192aaa7ef985ecbbc95e87c987ab1e5200a027438c5727799764370336b5ebce389b3544a0c0c2c9abcef37b458b20b33641b6471525a594d9f38cd6160014ad533ca86ecf5cfdd25a790d2dbcdd8225f3964c016d521c38ec1ea15734ae22b7c46064412829c0d0579f0a713d1c04ede979026f01000000000000000e000000000000000003473044022054e78defd1234ecfd6f38e5ffeeb6e8b9e40cd0a787778349fdba9fb6416f29c02200ceee8c2dad4c240a32438e9f83f51d791452122a56e0690f66a9b478997a5930120ccaf6f7ad4c09686a577132ba13d974d96a2debf3a46b6009fdc86cc6df9fa9665a9149f1be4d865c3c4a46878de3ad68a76a79314a1058763210362a931e4774409d85034bd7ad7f9c6284aaab81b479416f18b1b2884207c8a656703e0032db17521029b8fca59a765a0d9903cbc8565a16c84b0f3e21642405fd243b7e83ad8003bb368ac00430100015e969b8055d44e5971c7cbc532bb641542ec5566b2d13c6e3242277b94f2bacef739bcfb8762384738887f5a47d9c7a92425726ffecb5cf4ff8ca03167eeab6afd4e1060330000000000000001c3bd0801c30fd0eec07fc52efa579d86bddd196307efe28c562c705d3e437343e5a0d88bd370d9564829366b4d36f32bbd26fd36cf671f89f1cceeb877537c4c1f1f245fe7c3a5cc51dce13e7968c348fa26e70d3bdd49f79ee745903e40a8931ef3e3ff77ea74896307244ee2ee6768d2b89e4f3af3112781168be82c0b1efdad54056caa5a665177c56cf9a91560a3a000f769e04f9432f2df287ea0c74af6573fff3435f374fe620e18a26ffcd842b672bd6deae2fcb2492b0a67088b522a24c4d2e89077ee3b86b687a76e5b304bf64aa34edf64b8e90d2de439b45106ca386a32599efeb81145cd20a509c788ac6cfaddf38ffaee21c10f8a48d1d02468355e1f6dcc67f5fa8f5b0c0cfb450bc0819e08350f5fbc26f663b0097f8b99817b270a8faa56647170503b59a0d49916cbfaaafed4c7b4c359e0b5eb3cb7596fd7496a2d988f4141e7dec3055f445a4cb6145d8c507fcd35a4ff61aa2728ecbf7f3eee8c7632fd81f6d762cbb7bac3bb238c7a7b690dea21de9118b7a74d696727227cbac5664f52f8349a12bf3d462cdaea253fda81feba198926c8e2c0060b139108707506497d3af5fdae1617d308929e5a5cb234219b61e42b18a6076ee9edf8f8738a9240b70eaa682fe119c1a0a655ef6ac9e685a148880033fcc9ef060d32588ea73ab71beaefa4f6d140819f0ca144b39706d6afdc374048a49c115734f1e7d79f4134bd9c51831f058ace660b57fec0192a72e657b5dfb2fbad93d7b047ffa6e4ab0cf13808bd9107ebf4ec98396b14f6f13f5d556e9603a1f2931dc8c008ae46f819b21aefe99103aed7837f8f76b7cf9aeef70919bf004a2d85027f74ace1165e36fcec4203bd30d7900bbdc56716308644c563eb69974fbfd7b51505e3296cfd0671818c88e628f14db5f0d4240e0feea49127d06be57bd844e4623af9d77371ca2e4c9feddbf6e56f3fcbcc4a1461e4301422d7fed8b960ce3177eec48412429c27721eb823c5c21166ce64eef1d720d51c24cc51a7105964ce0b093336f6aba84d0d11afae6dfb7e8ac0997ff7fefed1252da579ea81bb7211e0e78caec39c9d522091f1bf5dbe017c175b12898c362c9ef9c27c8d4ba2923d47c48e27d3a38510b5f573ce01c80f450c4a611e867c41fd1d3f05aa16729950cbf552143a2ba121530226815c5f9a9dbdd4f8b6ca41093620cd0140954c5738df64c7079e5599be16729bd2842c18439e019983158a54272eead5d4ec96b6a166b623cd2e66f98bab1dfeafc46aab584d58bc3ec9983443ce2cf771314a401d469475dd14c99848abee8c17f2a0a16c32ab3718fea5e2f1930b30b5b826857f929c401d2ad317eb3631ec04fc5d59bc20eb05ccb8256345a3ea58ec0f07630d6a03c1430bb161f755d0db5a29f986a1294fbaf15fe6179edc36d43d635626051238e48adf20cc3f80fdad3e575dab58f3ceba24a92f0c4ce1330e6f04d594c3b5f6f2b568edd28bce0f5a32bff3e54ef42c87c9863bb727c9030c1647d0effe976861a4adb7db39dd8087b24ae89b41149e55f83c0017ca65ed5187ba3b808f9f621c3e20b763e9cd8cb8619b0e155a5cf51ad2e59dfc648fad033916c35d51618586abb861db86062457dfcbc992e74161abce0d7baf9d85125e2ff63c68c5163ef7ab38d50fa1af48c89cc2d997a876674c5f16dae20db2fad2bd8f5a85d91d5e75a60081dcf3d6cc6813fd1aa4477da859248d5877b6a1838742f96b1aa5dd9dba10e05012109ecead3daa953061af7fbd376a727b39e62da72da6743e20d1eb2524d63dfe81959f0570d57746aef13e54d3d69a829680a1e348010e5e4a156985b53ca665a953dff80c63ee1df780aa71208138f9a104cfa11e39f35f42899ccf6d850ac7b664b29582851e7c48ed32ef2c5efa427334e0604a25a34a96639b759283df0a3f80b4fdca24d97d41fa2f369df0b551b80a036ba5eaadff53250ee715b449685aaa713458c54d41eed61f33fc1665253963410a6f9b3b6da8cc68ff1b48ae40d6428d6368e4baaa75624ca66343c3755d0aa14c718d00be7c60728a28f180e8a99da216aefe098d06df7c3e19f48f1663e182320e5bcad1ab44077c2cb39815f7bb03eca8145ffa3c54e3b6bcff522ff9802ba16ed0d329d9467b76b24b81acc16858c824327fbea8b122a3049010e8a2be6a050b402f28465e517888066828fb871c54ebdcf351038c22fb9c0e2f0040bc7e59ac942342a7b0654a6ff9a77dc02830d834a844d641da35b22bd4f87948dac256bbd277f10ede9a93de6ff335a991f3ad41a44e3800ecc35c6cc9570fc1909a8727093c024974287a9e6a5a1380815b4a3f8948002492383d53db173267b7a2dd94ceca3f4dceeaf1e1083906623702ef1c709af0e4d7633477c9b13d130387422c9be4ac8ec4e529bfa331a6d3bc69c8bf93d663046382e71d5b95f21cafde24fb7767f361c6c5a40b38a1327e1b758df644fab4423ebb8c9732bfd213bed42dff3ee3a3a83e13d238b45af60d06e50e1f908c94548bdee159ce2b588fc55dfb864f0ede48482b1ef9de8a5c26c26c578d9d228f1542c31d9fb78106170c1ccb3329567aedbc76760ba86f39fec2fbb4594051300d703f79dae08ac8b4a5f60b7b80ee98bff68c3f5223faebcd1b387a71ca397f68873dd98c33720fab120065ea921014c94f757fd80fdb917ece980962ed832db862c1c55b07b39bb862ba1853ac492d1b62734a8a58c03f221f2188ecdc0509aef0395e27d7e5c253e554ad01072109faed3d1199ff6107cdf2d77c2cdfe3782ca55cc37074a66106f27502bfbcc3884507d1c9abaa1c82d8eba9da232a3f319fc294607be426db44fad3c3a77f48171da4121e4769eb14ad120764c658230554e77acc5eb490b2af69715c2171fb976ff2c36899be35bd77055601cd93c1198985067bc59cabae46cad89f9401040611b99f706b5ded126070b5160f4148ef4fbca09ef8342338f682ad9ba824f63824df6e615235e9d6390b66f2ad7cd313235b0666f69cfd02b9ff3dca179f1d2beaa2c97f4ad2f79a571f506bb49c643154721861d3ada2067351669b3a07c793189c258c4c925a951ac1db475f236dd4590b6b3136546eaf85159840ca795f712b2b7e6430482f815ae35b40769177557dfaf85756e417b945cfd64c274f92e213770ff4954f44affd4dbef7c37ef0cb4f710a5a56f77e398898c903f936a10c0361bbdec757c9ca00c49e4371e2656163b0ebaffd157ceb04857542c48d7e4240b639c544c5276fa79ee5d50a88a240ddc2faff1bc75814e89df59e40550d16e20d67cb18965a852c52a21b5c98cd13984449c82d6a67bc4e6214211ffb24b615a04b4d00cf323a6867e54c828627645cc0b692cc15d11745d9683d3cba1e1a80a94f9db86c6f64903f579baec91b3be94ee4e7d4421793663003fee4eea17c8f57de19c34e9f87b2786a979b3c66a67306562324a9b98ee557289f9a8d4478fa2740567f14cc5511465aa0b7ec3027c7df4c44d52c74611b8a6fc247a1a706285ce8754e503939a35355a0c02feb9cf14cb491c3a858daf8df36b56cf532a2f07877656ddb6b0f6bd25b8f66ed1aba050ff2e81175ce439a4605a08a6940a349762cd480219ba83e97c66fac79197594a0f40541da600e2dce508d49398bde78b21b6b9619202b25e00832477123336608ab6a888f004e1677981e320d7a7807478fea8c828e74634fcb7dc19892e268b4ecbb0ab585e23d8363e352f5d9789bf98e25a0c9f4231e0c7111ade9e33097b6a907781590dad8d13d12646eda1bce2b54bf5c46e9b30528dcf4f18119727bcad2c651b652530abb6559609c5898b1b39641dea0340d414b59becbdc7399dd2f73716f8850a8171c5b3919fe656b1b16a7f1ed802bc85a0bf923447135aa14a03d7774d847dfc063cfb1dfa0d48e1fb4ca2659d8eec859ae217aa98379bafcc8da8cfafee93a9b3887e7806e929634f3abf0cbd60dd71f2c420d6a00d1141e3484e9ce988a0ef3d88a881e68f7c7f9d558b48bb081ee2a3a9ce672a51e4bc7e792d38b476cebc253596bab44eaf84cb1f5a5a6f51c14dfaa4f264f21c9e28e7f84e519c0f8b043b67585049f4796aed6231ef190feab9a1372490fb743549b37efc2d3d5eba1e4cceb1f64b929d649a598c3f20c20e053ebf5adcc812e4d62798746323b0f086161ac5ae3bc0e4776bbc20bddb7f71ea488ad67ad072180865ceafb0e11668b5cd15aaca412d7706e10a1aee12d1776594f7af3d6e90a34931cb98bcaed8857068a315a618c2c09f440d8f88d144773cc7c018e6c35fff8e38f88abfd0834927324c9bbde0f1133f34e5c0a3b0cffcaf4aca66013ae076b7dd0036376d4e3e10f5a19eaa7c7d7eaf96f0e0fa9336c584a9631ffe44f0c28718e638003255dcf8e591de42393f9cc3f4c2fb2946e9b828ab323c23db492de02d69544f99b0e94c7b2bef1bbe15d9cfa4e0ad3e47388570f2c76fc9a0aaed0a4d24f8c0a7c39a9d83ed696f0aab84d0ec9ed331113d53e0d8fe23003688e0daeeedb73c22e26f1c3c70de735febf2b465b923beffe7035bac3b1bbbc506e8793eb4dcbae7ff477fef4c7cc3761748ada6ea36a6ad3ce78ace68529b33ea2fa61579e92899dc706ce3d06f3bc96eaaeb6f900218ea1d335f63abdb6891ec008ed90b90e6a0ac85300802e3fa19e1322fea1235e1d5ffeaefe756a76c549151f42fbec971335fefe4df0842cf935be3a988e73cbae42016b723572ea168ab942aa239aa2b023b656ee589a7eceab7b493dbddc80ecf3df0a469e7470195f70667b262638798403756bf1adc3a7493e86657a3774125f947e684612cff8567c475a1af91d5052514c30db7830bcc138e97d83a5e79ef3afcd5d87f49838f293c4affb6fb698ad665ac697c60a217796052143ffc95b43d93a46db72f5de661085012799ff1056eb8d1212d5d48d9cf01781f985055c976a9223180e52aeea3b9bfaf9a91acd55d9233d347c279bdccf51c4cb3b3bdf0be88665fa946697239935e7761f064d1d14e343b97f1454eaa2f146c04a6b182ef6c62395fe3c0f88ddf91b08204c8ff34cb6701dbb2150f60ff13c166da08c30178bd8c24e5a9bb566a3048383862877999a84698bd88f649fab5b71f99aa025ebdd55f28cb4e9604a61648579d8eccc8f5fd0c2d9db2f56aabd96065f9ef78f6e8f6bfb78a4583faea4717bcaf18f8190205a8e98536867b562ca83b759a4002a321c6b4cf1df90b04d788bafe406caf3b5422e6d7a46687682f3890254ad0ec1d5a966fb4f39f4fa11e2dd9fb79fd17ce51d6efed67158010734af340b3d4161cc536e25686852de6947aa88678cf78936fbf8f7a88985e6c798c306ad4938fff930239ed9b10cb9160875702c1b2091907055fa657298a3a85db9d6e94f2722a44a835b7c21bb62961438f046cd0f0731a4540fad5ef37a8144bcdc65bda95ae7b5dfc6389f484777a69d034ad4686e24be3cc13dc86fa098090ccb601f5a6e140384dbda5eedf237d756ed759c61e154bb389f9470268f4c9eb6fc1a905598539d8bd93ef2767e88855fa602fa98578df76702d50a28a354a06af3f79d3e8f68ef93e832baec2d0d55e7db9a6b59e84dc784c1a6bf5eb7be4080ace381dda37b081510a84ecf61bea4a1c8db5862607655b91be1c652ccbd0758db715c8ca062222c2e1939e7ada4ddd3ee5763e8830f628b9e055804f0cc42e192083f4102cc61271a59c942e142a6cedd2ab36573da1e88d070f82602ea93fb50e041416301be054a2be6f9f1d65a5bc5ff79e45a707dbd978d541eeef2b6ed9eddb70000';

const inputHash =
  '9788d1d096dfb41c429a5e76bf2c6e6eb6e3b9aa57feecae3b33c57b4f6fea62';

describe('TxView', () => {
  describe('isScure (static type guard)', () => {
    test('returns true for a scure transaction', () => {
      const tx = constructTransaction(false, inputHash);
      expect(TxView.isScure(tx)).toBe(true);
    });

    test('returns false for a liquidjs transaction', () => {
      const tx = buildLiquidTx();
      expect(TxView.isScure(tx)).toBe(false);
    });
  });

  describe('scure backend', () => {
    const tx = constructTransaction(false, inputHash);
    const view = TxView.of(tx);

    test('id matches scure.id', () => {
      expect(view.id).toEqual(tx.id);
    });

    test('hex matches scure.hex', () => {
      expect(view.hex).toEqual(tx.hex);
    });

    test('bytes returns a Buffer that round-trips through fromRaw', () => {
      const bytes = view.bytes;
      expect(Buffer.isBuffer(bytes)).toBe(true);
      expect(ScureTransaction.fromRaw(bytes).id).toEqual(tx.id);
    });

    test('vsize matches scure.vsize (discountCT is ignored for scure)', () => {
      expect(view.vsize()).toEqual(tx.vsize);
      expect(view.vsize(true)).toEqual(tx.vsize);
      expect(view.vsize(false)).toEqual(tx.vsize);
    });

    test('inputs surface forward-hex txid + sequence', () => {
      expect(view.inputs).toHaveLength(1);
      expect(view.inputs[0].txid).toEqual(inputHash);
      expect(view.inputs[0].index).toEqual(0);
      expect(view.inputs[0].sequence).toEqual(0xffffffff);
    });

    test('outputs surface bigint amounts', () => {
      expect(view.outputs).toHaveLength(1);
      expect(view.outputs[0].amount).toEqual(1n);
      expect(Buffer.isBuffer(view.outputs[0].script)).toBe(true);
    });
  });

  describe('liquidjs backend', () => {
    const tx = buildLiquidTx(0xffffffff);
    const view = TxView.of(tx);

    test('id matches liquid.getId()', () => {
      expect(view.id).toEqual(tx.getId());
    });

    test('hex matches liquid.toHex()', () => {
      expect(view.hex).toEqual(tx.toHex());
    });

    test('bytes matches liquid.toBuffer()', () => {
      expect(view.bytes.equals(tx.toBuffer())).toBe(true);
    });

    test('vsize defaults discountCT to true', () => {
      expect(view.vsize()).toEqual(tx.virtualSize(true));
    });

    test('vsize honors discountCT=false', () => {
      expect(view.vsize(false)).toEqual(tx.virtualSize(false));
    });

    test('inputs: txid is reverse-byte-order forward hex', () => {
      const asymTx = new LiquidTransaction();
      const wireHash = Buffer.from(
        '0102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f20',
        'hex',
      );
      asymTx.addInput(wireHash, 7, 0xfffffffd);
      const asymView = TxView.of(asymTx);
      expect(asymView.inputs[0].txid).toEqual(
        '201f1e1d1c1b1a191817161514131211100f0e0d0c0b0a090807060504030201',
      );
      expect(asymView.inputs[0].index).toEqual(7);
      expect(asymView.inputs[0].sequence).toEqual(0xfffffffd);
    });

    test('outputs: explicit-value commitments surface bigint amount', () => {
      expect(view.outputs).toHaveLength(2);
      expect(Buffer.isBuffer(view.outputs[0].script)).toBe(true);
      expect(view.outputs[0].script.length).toBeGreaterThan(0);
      expect(view.outputs[0].amount).toBeUndefined();
      expect(view.outputs[1].script.length).toEqual(0); // Fee output
    });

    test('confidential outputs (real chain fixture) leave amount undefined', () => {
      const confTx = LiquidTransaction.fromHex(liquidConfidentialHex);
      const confView = TxView.of(confTx);
      expect(confView.outputs.length).toBeGreaterThan(0);
      for (const out of confView.outputs) {
        expect(out.amount).toBeUndefined();
      }
    });
  });

  describe('signalsRbfExplicitly', () => {
    test('liquidjs: true when any input sequence < 0xfffffffe', () => {
      expect(TxView.of(buildLiquidTx(0xfffffffd)).signalsRbfExplicitly()).toBe(
        true,
      );
    });

    test('liquidjs: false when all input sequences are final', () => {
      expect(TxView.of(buildLiquidTx(0xffffffff)).signalsRbfExplicitly()).toBe(
        false,
      );
      expect(TxView.of(buildLiquidTx(0xfffffffe)).signalsRbfExplicitly()).toBe(
        false,
      );
    });
  });

  describe('memoization', () => {
    test('inputs returns the same array reference on repeated reads', () => {
      const view = TxView.of(constructTransaction(false, inputHash));
      expect(view.inputs).toBe(view.inputs);
    });

    test('outputs returns the same array reference on repeated reads', () => {
      const view = TxView.of(constructTransaction(false, inputHash));
      expect(view.outputs).toBe(view.outputs);
    });

    test('memo holds across both backends', () => {
      const liquidView = TxView.of(buildLiquidTx());
      expect(liquidView.inputs).toBe(liquidView.inputs);
      expect(liquidView.outputs).toBe(liquidView.outputs);
    });
  });
});
