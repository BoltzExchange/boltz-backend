import { InvoiceFeature } from '../../../lib/lightning/LightningClient';
import { InvoiceType } from '../../../lib/sidecar/DecodedInvoice';
import Sidecar from '../../../lib/sidecar/Sidecar';
import { sidecar, startSidecar } from './Utils';

const bolt11 =
  'lnbcrt210n1pnwx7gtpp5szd2rf0afvz0v9jdlwlgv5zpx8c8snj8r0wt2xra8wzd65ca33jqdqqcqzzsxqyz5vqsp525y356qjeue8hjkel92rwt56p6g3qdxyut7lcjh8yhjklc2kyg4s9qxpqysgqay3xv89aqt58ezpk2y0ryzr26jdqe8sp2vqj5jg7agkf5t743l7rk7mp4fdjyxrperpqx5kweuwv3u80ntuv2fe2sqkce5u8rcre5zgpaf3gdy';

const bolt12Offer =
  'lno1qgsqvgnwgcg35z6ee2h3yczraddm72xrfua9uve2rlrm9deu7xyfzrc2q36x2um5zcssyeyreggqmet8r4k6krvd3knppsx6c8v5g7tj8hcuq8lleta9ve5n';

const bolt12Invoice =
  'lni1qqg0q7dhvm99ejgrjndfa8tyet4zqq3qqc3xu3s3rg94nj40zfsy866mhu5vxne6tcej5878k2mneuvgjy8s5pr5v4ehg93pqfjg8jssphjkw8td4vxcmrdxzrqd4sweg3uhy003cq0lljh62enfx5pqqc3xu3s3rg94nj40zfsy866mhu5vxne6tcej5878k2mneuvgjy84yq4yzpvzzq4dhctwjj0am86jph9l5uryl45uazal0ksql8n96zt2mczcxwx9lwsfsqnys09pqr09vuwkm2cd3kx6vyxqmtqaj3rewg7lrsqlll9054nxjvptthksj4zhy8pgs3n3wcrzxz4fjsyck4z3r8rmnvdcvev7exls6gcpqfasp83h8zeah4v2f72f3uuyk0qyx20ew4m2u2876vceed3gwje9sqpjuy0zu4ta78uutye2lh9uau85hc0vg8p0rh3t6adxzv9hwprv45la4r8cs3dmvf0erumu0m668pe8e2th5gwqqqqqqqqqqqqqqq9qqqqqqqqqqqqqr5jt9hav2gqqqqqq5szxdcm6px5zqcxt5wy4a0xnemrtvjzrr37qahzllgaz7kcq9ast4r36pwexsky64gp2gy9syypxfq72zqx72ecadk4smrvd5cgvpkkpm9z8ju3a78qpll72lftxdylsgqy6g4ka78rq28fjt90kgjtnzn4s8urahq38rg2hakghj3gg9f3dds8julx0u9krt8ek7v5zcrc87hkes9gesx8h3szdn304qjzlujxh';

describe('DecodedInvoice', () => {
  beforeAll(async () => {
    startSidecar();
    await sidecar.connect(
      { on: jest.fn(), removeAllListeners: jest.fn() } as any,
      {} as any,
      false,
    );
  });

  afterAll(async () => {
    sidecar.disconnect();
    await Sidecar.stop();
  });

  test.each`
    type                         | pretty            | input
    ${InvoiceType.Bolt11}        | ${'BOLT11'}       | ${bolt11}
    ${InvoiceType.Offer}         | ${'BOLT12 offer'} | ${bolt12Offer}
    ${InvoiceType.Bolt12Invoice} | ${'BOLT12'}       | ${bolt12Invoice}
  `('should decode invoice type $pretty', async ({ type, pretty, input }) => {
    const decoded = await sidecar.decodeInvoiceOrOffer(input);
    expect(decoded.type).toEqual(type);
    expect(decoded.typePretty).toEqual(pretty);
  });

  test.each`
    payee                                                                   | input
    ${'02efa59e1e7bdca2f22d2657a344772e45ad95792b282a92baa2d618357ade283c'} | ${bolt11}
    ${'026483ca100de5671d6dab0d8d8da610c0dac1d94479723df1c01fffcafa566693'} | ${bolt12Offer}
    ${'026483ca100de5671d6dab0d8d8da610c0dac1d94479723df1c01fffcafa566693'} | ${bolt12Invoice}
  `('should get payee of $input', async ({ payee, input }) => {
    const dec = await sidecar.decodeInvoiceOrOffer(input);
    expect(dec.payee!.toString('hex')).toEqual(payee);
  });

  test.each`
    amount    | input
    ${21_000} | ${bolt11}
    ${0}      | ${bolt12Offer}
    ${42_000} | ${bolt12Invoice}
  `('should get amount of $input', async ({ amount, input }) => {
    const dec = await sidecar.decodeInvoiceOrOffer(input);
    expect(dec.amountMsat).toEqual(amount);
  });

  test('should decode invoice with 0 amount', async () => {
    const dec = await sidecar.decodeInvoiceOrOffer(
      'lnbcrt1pnwtvwqsp5jnl4paukvexugk2v80e8zcxvned0wvuheghsr58wyh8v86gx5jcspp5gvtw4tw06qkcg9nztmd2wp96pur54yvgkhw8a0wnec527plc3m0qdq8w3jhxaqxqyjw5qcqp2rzjqvecujkps8wvdlckumywaz0fpll43cuhluu9p45rqlmd8gyuzc446qqq0sqqqqgqqqqqqqlgqqqqqqgq2q9qxpqysgq4xtsut54q8aehdsr9ysuw5lt4rfs8x2adw5zphezatygd7348qdzx4vhpa0f8vht65p4y94jhrnw294g9e3249xft7am0jv5w4uf3aqqr55k8m',
    );
    expect(dec.amountMsat).toEqual(0);
  });

  test.each`
    expected       | invoice
    ${120_000_323} | ${'lnbcrt1200003230p1pje4yezsp5fcaw07mpwzqq4zxx349jfmp8rplpuznl3vl3jnz0gam4k97d3suqpp5rcrkszpgnkf7dqzrgmakmuvqyhe9df33fmavk3a8tpw3vzranm4qdq8v9ekgesxqyjw5qcqp2rzjqwdgldgs6nfufyx75x60nvjc0va7emuujkdqr7cuczfzrqyt3plvcqqqdcqqqqgqqqqqqqlgqqqqqqgq2q9qxpqysgqalxdy0fqurdu6z34uvcmz0hw5v6x5pf57yj7cwzdwdf4wt9m7y6jskkzeelpt9727ha7ktrl9s0x30hllc6twrnn7vlxka2dfaf9g9spgsjj0r'}
    ${130_000_323} | ${'lnbcrt1300003230p1pje4yujsp54k30ymnuel6p7756nc00vq06stu8gdrn77z9frn6jxhpkf5fjekqpp57dz6tlrra5g2cs3k0relg55rt26hs4m9kjgt9nh8j5kuhuvuhrqsdqgv9ekgenxxqyjw5qcqp2rzjqtst8pw56xy8uydcjkd6t20rwux4uwkpsf7h7nwms4x2r6zgphyg6qqq0sqqqqgqqqqqqqlgqqqqqqgq2q9qxpqysgqed55scqulmlr5em9rww8v92rwmuefzpektrpmrvpyjprrjr23qckmh9cnst8crwspggm59366huqshtuwyawhj4tgmez0thfmfqrducqu8ez5v'}
  `(
    'should decode invoice with msats precision',
    async ({ expected, invoice }) => {
      const dec = await sidecar.decodeInvoiceOrOffer(invoice);
      expect(dec.amountMsat).toEqual(expected);
    },
  );

  test.each`
    paymentHash                                                           | input
    ${'809aa1a5fd4b04f6164dfbbe86504131f0784e471bdcb5187d3b84dd531d8c64'} | ${bolt11}
    ${undefined}                                                          | ${bolt12Offer}
    ${'60cba3895ebcd3cec6b648431c7c0edc5ffa3a2f5b002f60ba8e3a0bb268589a'} | ${bolt12Invoice}
  `('should get payment hash of $input', async ({ paymentHash, input }) => {
    const dec = await sidecar.decodeInvoiceOrOffer(input);
    expect(
      dec.paymentHash !== undefined
        ? dec.paymentHash.toString('hex')
        : undefined,
    ).toEqual(paymentHash);
  });

  test.each`
    expected               | invoice
    ${1708990426 + 3600}   | ${'lnbcrt500u1pja6876pp5n4zvktq9my0ecjcv0stgph3u0uxkqck5rww3t49zrtc8adyjdx8qdqqcqzzsxqrrsssp5r38u5kz4f4mgmq3gdq2u4z9t8909vcvapw5j2m4js5xxem42efnq9qyyssqlcn5xlxxpnndaafrrn7eqkpt4en54pq0vumedu085xa6m7u4g7g3rzjn6fxdp5ldhfj9nupa6l895qcxhhkjm2jevsn7hf3spwwqancqekamsj'}
    ${1708990605 + 604800} | ${'lnbcrt1230p1pja6gydsp5yup8wedvypfdhps3m8ted33ngdex6kye37uwshnw4myr30tprftspp5scha4k5uclumd78me5k8y8m6hn5k27dnzvwlel32eeqnhar0mpzsdq8v9j8xesxqyjw5qcqp2rzjq0kuk5cssreq495qpyf8q8v9dssd05ujxa3e7f5chk7pf0al6npevqqq0sqqqqgqqqqqqqlgqqqqqqgq2q9qxpqysgqekwcwjwpqk38rpuj2pwaqgrfm5p6q85cllwg3ecwd469urrt273zsrhcg02c4lcmrnf3scltgl25dp4urrezr4lghfu0depftd2h96spul6ljs'}
    ${1726183945 + 7200}   | ${bolt12Invoice}
  `(
    'should decode invoice expiry of $invoice',
    async ({ invoice, expected }) => {
      const dec = await sidecar.decodeInvoiceOrOffer(invoice);

      expect(dec.isExpired).toEqual(true);
      expect(dec.expiryTimestamp).toEqual(expected);
    },
  );

  test('should decode routing info', async () => {
    const dec = await sidecar.decodeInvoiceOrOffer(
      'lnbc1p023g0zpp5rrr09tcxfymsyxgywe0vpeqzt8ppc7dzlme9e0wa3qqch0fpt8tsdqqxqrrss9qy9qsqsp56xpafe94rfkt5qtc00lua7pwem9znvvq4en9sr2t24kmdq4ll2mqrzjqt3xwz3vyes6nm4p8d70mnwh74f0tydeaesw2eut02l80dle29hevz905gqqjdsqqqqqqqlgqqqqqeqqjqrzjqfsktpgyjffp7jkg40vmmqygzg6yd5fx7eyv5d0xp7ypwlwpf88tyzx0ccqq8msqqqqqqqlgqqqqqeqqjqtk44jdc0f78c6cg8jd02889jud0phxea7nxtj7sue7ft44daf9nye99ekujxxgkgw82t0kxfwetxp9vs5rt54lkfd35vjle0sexhv2qqpv7aq4',
    );

    expect(dec.routingHints).toEqual([
      [
        {
          feeBaseMsat: 1000,
          cltvExpiryDelta: 144,
          chanId: '625896994266021900',
          feeProportionalMillionths: 100,
          nodeId:
            '02e2670a2c2661a9eea13b7cfdcdd7f552f591b9ee60e5678b7abe77b7f9516f96',
        },
      ],
      [
        {
          feeBaseMsat: 1000,
          cltvExpiryDelta: 144,
          chanId: '634943775850758100',
          feeProportionalMillionths: 100,
          nodeId:
            '026165850492521f4ac8abd9bd8088123446d126f648ca35e60f88177dc149ceb2',
        },
      ],
    ]);
  });

  test.each`
    expected                | invoice
    ${[InvoiceFeature.MPP]} | ${bolt11}
    ${[]}                   | ${bolt12Invoice}
  `('should decode features', async ({ expected, invoice }) => {
    const dec = await sidecar.decodeInvoiceOrOffer(invoice);
    expect(dec.features).toEqual(new Set(expected));
  });

  test('should throw when decoding AMP invoices', async () => {
    await expect(
      sidecar.decodeInvoiceOrOffer(
        'lnbcrt10n1pnwtd8mpp54tvpgc0rpaldmk82jhz87ljf3k48tsy0e6yqvgc545v9aghaz9dqdqqcqzzsxq9z0rgqsp5ly9k6t3zqnsa49nj6x324e5jq0q08fsm5snyqpr7jllvxj7k6tjs9q8pqqqsgq7mvl47u0zhxurdvl95ndr7kv9vw5cysr5enrh0d9jy9ukru8w4wxxj5lsutmy7vpdcejtpvr5rxcn02ntkjwcwfkrmc4qmp6zduwppqpmnvyrg',
      ),
    ).rejects.toEqual(expect.anything());
  });

  test.each`
    expected | invoice
    ${80}    | ${bolt11}
    ${10}    | ${bolt12Invoice}
  `('should get min final CLTV', async ({ expected, invoice }) => {
    const dec = await sidecar.decodeInvoiceOrOffer(invoice);
    expect(dec.minFinalCltv).toEqual(expected);
  });
});
