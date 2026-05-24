import { schnorr, secp256k1 } from '@noble/curves/secp256k1.js';
import { sha256 } from '@noble/hashes/sha2.js';
import { hexToBytes } from '@noble/hashes/utils.js';
import { HDKey } from '@scure/bip32';
import { generateMnemonic, mnemonicToSeedSync } from '@scure/bip39';
import { wordlist } from '@scure/bip39/wordlists/english.js';
import { Transaction } from '@scure/btc-signer';
import type { ClaimDetails, Types } from 'boltz-core';
import {
  OutputType,
  Scripts,
  SwapTreeSerializer,
  detectSwap,
  reverseSwapTree,
  swapScript,
  swapTree,
} from 'boltz-core';
import { Networks as LiquidNetworks } from 'boltz-core/liquid';
import { randomBytes } from 'crypto';
import {
  Creator,
  CreatorInput,
  Extractor,
  Finalizer,
  Transaction as LiquidTransaction,
  Updater,
  address as liquidAddress,
  networks,
} from 'liquidjs-lib';
import {
  addressFromOutputScript,
  outputScriptFromAddress,
} from '../../lib/AddressUtils';
import {
  constructClaimDetails,
  createMusig,
  getBlindingKey,
  getOutputValue,
  hashForWitnessV1,
  parseTransaction,
  setup,
  tweakMusig,
} from '../../lib/Core';
import Logger from '../../lib/Logger';
import { getHexBuffer, getHexString } from '../../lib/Utils';
import { CurrencyType, SwapType, SwapVersion } from '../../lib/consts/Enums';
import Database from '../../lib/db/Database';
import type ChainSwapData from '../../lib/db/models/ChainSwapData';
import type Swap from '../../lib/db/models/Swap';
import KeyRepository from '../../lib/db/repositories/KeyRepository';
import type SwapOutputType from '../../lib/swap/SwapOutputType';
import { slip77FromSeed } from '../../lib/wallet/Slip77';
import Wallet from '../../lib/wallet/Wallet';
import WalletLiquid from '../../lib/wallet/WalletLiquid';
import type { Currency } from '../../lib/wallet/WalletManager';
import CoreWalletProvider from '../../lib/wallet/providers/CoreWalletProvider';
import ElementsWalletProvider from '../../lib/wallet/providers/ElementsWalletProvider';
import { regtest as bitcoinRegtest } from '../Networks';
import { sidecar } from './sidecar/Utils';
import { bitcoinClient, elementsClient } from './Nodes';

const toXOnly = (publicKey: Uint8Array): Buffer =>
  Buffer.from(publicKey.length === 33 ? publicKey.subarray(1) : publicKey);

const makeKeys = () => {
  const privateKey = randomBytes(32);
  return {
    privateKey: Buffer.from(privateKey),
    publicKey: Buffer.from(secp256k1.getPublicKey(privateKey, true)),
    signSchnorr: (msg: Uint8Array) =>
      Buffer.from(schnorr.sign(msg, privateKey)),
  };
};

const keysFromPrivate = (privateKey: Buffer) => ({
  privateKey,
  publicKey: Buffer.from(secp256k1.getPublicKey(privateKey, true)),
});

KeyRepository.incrementHighestUsedIndex = jest.fn().mockResolvedValue(0);

describe('Core', () => {
  const database = new Database(Logger.disabledLogger, ':memory:');

  let wallet: Wallet;
  let walletLiquid: WalletLiquid;

  beforeAll(async () => {
    await Promise.all([setup(), database.init()]);

    const initWallet = (w: Wallet) => {
      w.initKeyProvider(
        'm/0/0',
        HDKey.fromMasterSeed(
          mnemonicToSeedSync(
            'miracle tower paper teach stomach black exile discover paddle country around survey',
          ),
        ),
      );
    };

    wallet = new Wallet(
      Logger.disabledLogger,
      CurrencyType.BitcoinLike,
      new CoreWalletProvider(
        Logger.disabledLogger,
        bitcoinClient,
        bitcoinRegtest,
      ),
      bitcoinRegtest,
    );
    initWallet(wallet);

    walletLiquid = new WalletLiquid(
      Logger.disabledLogger,
      new ElementsWalletProvider(Logger.disabledLogger, elementsClient, sidecar),
      slip77FromSeed(mnemonicToSeedSync(generateMnemonic(wordlist))),
      networks.regtest,
      sidecar,
    );
    initWallet(walletLiquid);

    // To have a blinded output in the Elements wallet
    await elementsClient.sendToAddress(
      await elementsClient.getNewAddress(''),
      10 ** 8,
      undefined,
      false,
      '',
    );

    await Promise.all([bitcoinClient.generate(1), elementsClient.generate(1)]);
  });

  afterAll(async () => {
    await Promise.all([bitcoinClient.generate(1), elementsClient.generate(1)]);

    bitcoinClient.disconnect();
    elementsClient.disconnect();
  });

  test('should get output value of Bitcoin transactions', async () => {
    const outputAmount = 420234;
    const { transaction, vout } = await wallet.sendToAddress(
      await wallet.getAddress(''),
      outputAmount,
      undefined,
      '',
    );

    const out = (transaction as Transaction).getOutput(vout!);
    expect(
      getOutputValue(wallet, { script: out.script!, amount: out.amount! }),
    ).toEqual(outputAmount);
  });

  test('should get output value of unblinded Liquid transactions', async () => {
    const outputAmount = 562312;
    const { transaction, vout } = await walletLiquid.sendToAddress(
      await addressFromOutputScript(
        CurrencyType.Liquid,
        await outputScriptFromAddress(
          CurrencyType.Liquid,
          await walletLiquid.getAddress(''),
          networks.regtest,
          sidecar,
        ),
        networks.regtest,
        undefined,
        sidecar,
      ),
      outputAmount,
      undefined,
      '',
    );

    expect(
      getOutputValue(
        walletLiquid,
        (transaction as LiquidTransaction).outs[vout!],
      ),
    ).toEqual(outputAmount);

    // Wrong asset

    // @ts-expect-error - private property access for test fixture
    walletLiquid['network'] = networks.liquid;
    expect(
      getOutputValue(
        walletLiquid,
        (transaction as LiquidTransaction).outs[vout!],
      ),
    ).toEqual(0);

    // @ts-expect-error - private property access for test fixture
    walletLiquid['network'] = networks.regtest;
  });

  test('should get output value of blinded Liquid transactions', async () => {
    const script = await outputScriptFromAddress(
      CurrencyType.Liquid,
      await walletLiquid.getAddress(''),
      walletLiquid.network!,
      sidecar,
    );

    const outputAmount = 1245412;
    const { transaction, vout } = await walletLiquid.sendToAddress(
      await walletLiquid.encodeAddress(script),
      outputAmount,
      undefined,
      '',
    );

    expect(
      getOutputValue(
        walletLiquid,
        (transaction as LiquidTransaction).outs[vout!],
      ),
    ).toEqual(outputAmount);

    // Wrong asset hash

    // @ts-expect-error - private property access for test fixture
    walletLiquid['network'] = networks.liquid;
    expect(
      getOutputValue(
        walletLiquid,
        (transaction as LiquidTransaction).outs[vout!],
      ),
    ).toEqual(0);

    // @ts-expect-error - private property access for test fixture
    walletLiquid['network'] = networks.regtest;
  });

  test('should construct legacy claim details', async () => {
    const preimage = randomBytes(32);
    const claimKeys = await wallet.getNewKeys();
    const refundKeys = makeKeys();

    const redeemScript = Buffer.from(
      swapScript(
        Buffer.from(sha256(preimage)),
        claimKeys.keys.publicKey,
        Buffer.from(refundKeys.publicKey),
        2,
      ),
    );
    const outputScript = Buffer.from(Scripts.p2wshOutput(redeemScript));

    const tx = Transaction.fromRaw(
      hexToBytes(
        await bitcoinClient.getRawTransaction(
          await bitcoinClient.sendToAddress(
            await wallet.encodeAddress(outputScript),
            100_00,
            undefined,
            false,
            '',
          ),
        ),
      ),
    );
    const output = detectSwap(redeemScript, tx)!;

    const claimDetails = constructClaimDetails(
      {
        get: jest.fn().mockReturnValue(OutputType.Bech32),
      } as unknown as SwapOutputType,
      wallet,
      {
        type: SwapType.Submarine,
        keyIndex: claimKeys.index,
        version: SwapVersion.Legacy,
        redeemScript: getHexString(redeemScript),
      } as unknown as Swap,
      tx,
      preimage,
    ) as ClaimDetails;

    expect(claimDetails).toEqual({
      preimage,
      redeemScript,
      script: output.script,
      amount: output.amount,
      vout: output.vout,
      transactionId: tx.id,
      type: OutputType.Bech32,
      privateKey: expect.anything(),
    });
  });

  test('should construct Taproot claim details', async () => {
    const preimage = randomBytes(32);
    const claimKeys = await wallet.getNewKeys();
    const refundKeys = makeKeys();

    const tree = swapTree(
      false,
      Buffer.from(sha256(preimage)),
      claimKeys.keys.publicKey,
      Buffer.from(refundKeys.publicKey),
      2,
    );
    const musig = createMusig(
      claimKeys.keys,
      Buffer.from(refundKeys.publicKey),
    );
    const tweakedKey = Buffer.from(
      tweakMusig(CurrencyType.BitcoinLike, musig, tree).aggPubkey,
    );
    const outputScript = Buffer.from(Scripts.p2trOutput(tweakedKey));

    const tx = Transaction.fromRaw(
      hexToBytes(
        await bitcoinClient.getRawTransaction(
          await bitcoinClient.sendToAddress(
            await wallet.encodeAddress(outputScript),
            100_00,
            undefined,
            false,
            '',
          ),
        ),
      ),
    );
    const output = detectSwap(tweakedKey, tx)!;

    const claimDetails = constructClaimDetails(
      {} as unknown as SwapOutputType,
      wallet,
      {
        type: SwapType.Submarine,
        keyIndex: claimKeys.index,
        version: SwapVersion.Taproot,
        lockupTransactionVout: output.vout,
        theirPublicKey: Buffer.from(refundKeys.publicKey),
        redeemScript: SwapTreeSerializer.serializeSwapTree(tree),
      } as unknown as Swap,
      tx,
      preimage,
    ) as ClaimDetails;

    expect(claimDetails.vout).toEqual(output.vout);
    expect(claimDetails.preimage).toEqual(preimage);
    expect(claimDetails.amount).toEqual(output.amount);
    expect(claimDetails.privateKey).toEqual(claimKeys.keys.privateKey);
    expect(claimDetails.transactionId).toEqual(tx.id);
    expect(claimDetails.script).toEqual(output.script);
    expect(claimDetails.type).toEqual(OutputType.Taproot);
    expect(claimDetails.cooperative).toEqual(false);
    expect(claimDetails.internalKey).toEqual(Buffer.from(musig.aggPubkey));
    expect(
      SwapTreeSerializer.serializeSwapTree(
        claimDetails.swapTree as Types.LiquidSwapTree,
      ),
    ).toEqual(SwapTreeSerializer.serializeSwapTree(tree));
  });

  test.each`
    cooperative
    ${true}
    ${false}
  `(
    'should construct Taproot Chain Swap details (cooperative: $cooperative)',
    async ({ cooperative }) => {
      const preimage = getHexBuffer(
        'f16c5f680a48102de3b85175b6ae99e874013dd590a7c5cec3d9f2aba95a354c',
      );
      const claimKeysIndex = 123;
      const claimKeys = wallet.getKeysByIndex(claimKeysIndex);
      const refundKeys = keysFromPrivate(
        getHexBuffer(
          'ef77e158cdd6f47737dc71c844b6fb3d9e5dc0a109dd7974f91230c534eb7806',
        ),
      );

      const tree = reverseSwapTree(
        false,
        Buffer.from(sha256(preimage)),
        claimKeys.publicKey,
        Buffer.from(refundKeys.publicKey),
        2,
      );
      const musig = createMusig(claimKeys, Buffer.from(refundKeys.publicKey));
      const tweakedKey = Buffer.from(
        tweakMusig(CurrencyType.BitcoinLike, musig, tree).aggPubkey,
      );

      const lockupOutputScript = Buffer.from(Scripts.p2trOutput(tweakedKey));
      const amountSent = 100_000_000;
      const lockupTransaction = Transaction.fromRaw(
        hexToBytes(
          await bitcoinClient.getRawTransaction(
            await bitcoinClient.sendToAddress(
              await addressFromOutputScript(
                CurrencyType.BitcoinLike,
                lockupOutputScript,
                bitcoinRegtest,
              ),
              amountSent,
              undefined,
              false,
              '',
            ),
          ),
        ),
      );
      const output = detectSwap(tweakedKey, lockupTransaction)!;
      expect(output).not.toBeUndefined();

      const claimDetails = constructClaimDetails(
        {} as unknown as SwapOutputType,
        wallet,
        {
          type: SwapType.Chain,
          keyIndex: claimKeysIndex,
          transactionVout: output.vout,
          theirPublicKey: getHexString(Buffer.from(refundKeys.publicKey)),
          swapTree: JSON.stringify(SwapTreeSerializer.serializeSwapTree(tree)),
        } as Partial<ChainSwapData> as ChainSwapData,
        lockupTransaction,
        cooperative ? undefined : preimage,
      ) as ClaimDetails;
      expect(claimDetails.cooperative).toEqual(cooperative);
      expect(claimDetails.amount).toEqual(BigInt(amountSent));
      expect(claimDetails.vout).toEqual(output.vout);
      expect(claimDetails.transactionId).toEqual(lockupTransaction.id);
      expect(claimDetails.type).toEqual(OutputType.Taproot);
      expect(claimDetails.script).toEqual(lockupOutputScript);
      expect(claimDetails.internalKey).toEqual(Buffer.from(musig.aggPubkey));
      expect(claimDetails.preimage).toEqual(cooperative ? undefined : preimage);
      expect(
        SwapTreeSerializer.serializeSwapTree(
          claimDetails.swapTree as Types.LiquidSwapTree,
        ),
      ).toEqual(SwapTreeSerializer.serializeSwapTree(tree));
    },
  );

  test('should create Musig', () => {
    const ourKeys = keysFromPrivate(
      getHexBuffer(
        'a01c77e7effc4d49dd2d2f345b9dde1984c426b17c6756d10041819f73856b8e',
      ),
    );
    const theirPublicKey = getHexBuffer(
      '03d8b9ee7742d8f98484f8e3826083d13453547dea7e8f2976f5733672f3a71f4a',
    );
    const musig = createMusig(ourKeys, theirPublicKey);

    expect(musig.publicKeys).toEqual([
      Buffer.from(ourKeys.publicKey),
      theirPublicKey,
    ]);
    expect(Buffer.from(musig.aggPubkey)).toMatchSnapshot();
  });

  test.each`
    isLiquid
    ${true}
    ${false}
  `('should tweak Musig (liquid: $isLiquid)', ({ isLiquid }) => {
    const tree = SwapTreeSerializer.deserializeSwapTree({
      claimLeaf: {
        version: 192,
        output:
          '82012088a91412fb93c968f24c233c64081fb734e34e9ecb0cfb88206584eb8c9a539e24fed7a81b002891506ee94fb32ee7c6c23a488caeedd5a653ac',
      },
      refundLeaf: {
        version: 192,
        output:
          '20fb00c6a397ac4f25c6aa85392ded2e3487f219a150ef7ac615f33310b1d95945ad025e07b1',
      },
    });

    const ourKeys = keysFromPrivate(
      getHexBuffer(
        'a01c77e7effc4d49dd2d2f345b9dde1984c426b17c6756d10041819f73856b8e',
      ),
    );
    const theirPublicKey = getHexBuffer(
      '03d8b9ee7742d8f98484f8e3826083d13453547dea7e8f2976f5733672f3a71f4a',
    );
    const musig = createMusig(ourKeys, theirPublicKey);
    const tweakedMusig = tweakMusig(
      isLiquid ? CurrencyType.Liquid : CurrencyType.BitcoinLike,
      musig,
      tree,
    );

    expect(Buffer.from(tweakedMusig.aggPubkey)).toMatchSnapshot();
  });

  test('should hash Bitcoin transactions for witness v1', async () => {
    const keys = makeKeys();

    const outputScript = Buffer.from(
      Scripts.p2trOutput(toXOnly(Buffer.from(keys.publicKey))),
    );
    const amountSent = 100_000;

    const tx = parseTransaction(
      CurrencyType.BitcoinLike,
      await bitcoinClient.getRawTransaction(
        await bitcoinClient.sendToAddress(
          await addressFromOutputScript(
            CurrencyType.BitcoinLike,
            outputScript,
            bitcoinRegtest,
          ),
          amountSent,
          undefined,
          false,
          '',
        ),
      ),
    ) as Transaction;

    let outputToSpendIndex = -1;
    for (let i = 0; i < tx.outputsLength; i++) {
      if (Buffer.from(tx.getOutput(i).script!).equals(outputScript)) {
        outputToSpendIndex = i;
        break;
      }
    }

    const spendTx = new Transaction();
    spendTx.addInput({
      txid: tx.id,
      index: outputToSpendIndex,
      sequence: 0xffffffff - 1,
      witnessUtxo: {
        amount: tx.getOutput(outputToSpendIndex).amount!,
        script: tx.getOutput(outputToSpendIndex).script!,
      },
    });
    spendTx.addOutput({
      script: await outputScriptFromAddress(
        CurrencyType.BitcoinLike,
        await bitcoinClient.getNewAddress(''),
        bitcoinRegtest,
      ),
      amount: BigInt(amountSent - 1_000),
    });

    const hash = await hashForWitnessV1(
      {
        chainClient: bitcoinClient,
        type: CurrencyType.BitcoinLike,
        network: bitcoinRegtest,
      } as unknown as Currency,
      spendTx,
      0,
    );

    spendTx.updateInput(
      0,
      { finalScriptWitness: [keys.signSchnorr(hash)] },
      true,
    );

    await bitcoinClient.sendRawTransaction(spendTx.hex);
  });

  test('should hash Liquid transactions for witness v1', async () => {
    const keys = makeKeys();

    const outputScript = Buffer.from(
      Scripts.p2trOutput(toXOnly(Buffer.from(keys.publicKey))),
    );
    const amountSent = 100_000;

    const tx = parseTransaction(
      CurrencyType.Liquid,
      await elementsClient.getRawTransaction(
        await elementsClient.sendToAddress(
          liquidAddress.fromOutputScript(outputScript, networks.regtest),
          amountSent,
          undefined,
          false,
          '',
        ),
      ),
    ) as LiquidTransaction;
    const outputToSpendIndex = tx.outs.findIndex((output) =>
      output.script.equals(outputScript),
    );

    const pset = Creator.newPset();
    pset.addInput(
      new CreatorInput(tx.getId(), outputToSpendIndex).toPartialInput(),
    );
    pset.inputs[0].sighashType = LiquidTransaction.SIGHASH_DEFAULT;

    const feeAmount = 1_000;

    const updater = new Updater(pset);
    updater.addInWitnessUtxo(0, tx.outs[outputToSpendIndex]);
    updater.addOutputs([
      {
        amount: amountSent - feeAmount,
        asset: LiquidNetworks.liquidRegtest.assetHash,
        script: liquidAddress.toOutputScript(
          await elementsClient.getNewAddress(''),
        ),
      },
      {
        amount: feeAmount,
        asset: LiquidNetworks.liquidRegtest.assetHash,
      },
    ]);

    const finalizer = new Finalizer(pset);
    finalizer.finalizeInput(0, () => {
      return {
        finalScriptWitness: Buffer.alloc(64),
      };
    });

    finalizer.finalize();
    const spendTx = Extractor.extract(pset);

    const hash = await hashForWitnessV1(
      {
        chainClient: elementsClient,
        type: CurrencyType.Liquid,
        network: LiquidNetworks.liquidRegtest,
      } as unknown as Currency,
      spendTx,
      0,
    );

    spendTx.setWitness(0, [Buffer.from(keys.signSchnorr(hash))]);

    await elementsClient.sendRawTransaction(spendTx.toHex());
  });

  describe('addressFromOutputScript', () => {
    test.each`
      currency                    | address                                                                                                    | scriptPubKey                                      | blindingKey
      ${CurrencyType.BitcoinLike} | ${'bcrt1qyetkcrlsxsrnxxzsh3k8e3ug7z78yshzx6mlam'}                                                          | ${'001426576c0ff03407331850bc6c7cc788f0bc7242e2'} | ${null}
      ${CurrencyType.BitcoinLike} | ${'bcrt1qyetkcrlsxsrnxxzsh3k8e3ug7z78yshzx6mlam'}                                                          | ${'001426576c0ff03407331850bc6c7cc788f0bc7242e2'} | ${undefined}
      ${CurrencyType.Liquid}      | ${'ert1qdfmwtuw2vvr5uy5p8a5sdgtl2x77f45cm44wz4'}                                                           | ${'00146a76e5f1ca63074e12813f6906a17f51bde4d698'} | ${''}
      ${CurrencyType.Liquid}      | ${'el1qqvjyv27jmxu6tsly8ha26plksv6lnw8ayyyx0svjxu2v6gxvl2eg7p2ngdsn937d2wft8gutt2lh0elalrdazhdv063nuytmy'} | ${'00140553436132c7cd5392b3a38b5abf77e7fdf8dbd1'} | ${'0324462bd2d9b9a5c3e43dfaad07f68335f9b8fd210867c1923714cd20ccfab28f'}
    `(
      'parse output scripts correctly',
      async ({ currency, address, scriptPubKey, blindingKey }) => {
        const result = addressFromOutputScript(
          currency,
          getHexBuffer(scriptPubKey),
          currency === CurrencyType.Liquid ? networks.regtest : bitcoinRegtest,
          blindingKey ? getHexBuffer(blindingKey) : blindingKey,
        );
        expect(result).toEqual(address);
      },
    );

    test('should handle invalid scripts', () => {
      expect(() =>
        addressFromOutputScript(
          CurrencyType.BitcoinLike,
          Buffer.alloc(0),
          bitcoinRegtest,
        ),
      ).toThrow();

      const invalidScript = Buffer.from([0x6a, 0x01, 0x02, 0x03]);
      expect(() =>
        addressFromOutputScript(
          CurrencyType.BitcoinLike,
          invalidScript,
          bitcoinRegtest,
        ),
      ).toThrow();

      expect(() =>
        addressFromOutputScript(
          CurrencyType.Liquid,
          invalidScript,
          networks.regtest,
        ),
      ).toThrow();
    });
  });

  describe('getBlindingKey', () => {
    test.each`
      currency                    | address                                                                                                    | blindingKey
      ${CurrencyType.BitcoinLike} | ${'bcrt1qyetkcrlsxsrnxxzsh3k8e3ug7z78yshzx6mlam'}                                                          | ${''}
      ${CurrencyType.Liquid}      | ${'ert1qdfmwtuw2vvr5uy5p8a5sdgtl2x77f45cm44wz4'}                                                           | ${''}
      ${CurrencyType.Liquid}      | ${'el1qqvjyv27jmxu6tsly8ha26plksv6lnw8ayyyx0svjxu2v6gxvl2eg7p2ngdsn937d2wft8gutt2lh0elalrdazhdv063nuytmy'} | ${'0324462bd2d9b9a5c3e43dfaad07f68335f9b8fd210867c1923714cd20ccfab28f'}
    `(
      'should get correct blinding key for address',
      async ({ currency, address, blindingKey }) => {
        const result = await getBlindingKey(currency, address, sidecar);
        expect(result).toEqual(
          blindingKey ? getHexBuffer(blindingKey) : undefined,
        );
      },
    );
  });
});
