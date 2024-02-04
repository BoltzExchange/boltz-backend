import { BIP32Factory } from 'bip32';
import { generateMnemonic, mnemonicToSeedSync } from 'bip39';
import { Transaction, address, crypto } from 'bitcoinjs-lib';
import { toXOnly } from 'bitcoinjs-lib/src/psbt/bip371';
import {
  ClaimDetails,
  Networks,
  OutputType,
  Scripts,
  SwapTreeSerializer,
  detectSwap,
  swapScript,
  swapTree,
} from 'boltz-core';
import { Networks as LiquidNetworks } from 'boltz-core/dist/lib/liquid';
import { p2trOutput, p2wshOutput } from 'boltz-core/dist/lib/swap/Scripts';
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
import { SLIP77Factory } from 'slip77';
import * as ecc from 'tiny-secp256k1';
import {
  constructClaimDetails,
  createMusig,
  fromOutputScript,
  getOutputValue,
  hashForWitnessV1,
  parseTransaction,
  setup,
  toOutputScript,
  tweakMusig,
} from '../../lib/Core';
import { ECPair } from '../../lib/ECPairHelper';
import Logger from '../../lib/Logger';
import { getHexBuffer, getHexString } from '../../lib/Utils';
import { CurrencyType, SwapVersion } from '../../lib/consts/Enums';
import Database from '../../lib/db/Database';
import Swap from '../../lib/db/models/Swap';
import SwapOutputType from '../../lib/swap/SwapOutputType';
import Wallet from '../../lib/wallet/Wallet';
import WalletLiquid from '../../lib/wallet/WalletLiquid';
import { Currency } from '../../lib/wallet/WalletManager';
import CoreWalletProvider from '../../lib/wallet/providers/CoreWalletProvider';
import ElementsWalletProvider from '../../lib/wallet/providers/ElementsWalletProvider';
import { bitcoinClient, elementsClient } from './Nodes';

describe('Core', () => {
  const bip32 = BIP32Factory(ecc);
  const slip77 = SLIP77Factory(ecc);

  const database = new Database(Logger.disabledLogger, ':memory:');

  let wallet: Wallet;
  let walletLiquid: WalletLiquid;

  beforeAll(async () => {
    await Promise.all([setup(), database.init()]);

    const initWallet = (w: Wallet, network: any) => {
      w.initKeyProvider(
        network,
        'm/0/0',
        0,
        bip32.fromSeed(mnemonicToSeedSync(generateMnemonic())),
      );
    };

    wallet = new Wallet(
      Logger.disabledLogger,
      CurrencyType.BitcoinLike,
      new CoreWalletProvider(Logger.disabledLogger, bitcoinClient),
    );
    initWallet(wallet, Networks.bitcoinRegtest);

    walletLiquid = new WalletLiquid(
      Logger.disabledLogger,
      new ElementsWalletProvider(Logger.disabledLogger, elementsClient),
      slip77.fromSeed(generateMnemonic()),
    );
    initWallet(walletLiquid, networks.regtest);

    await bitcoinClient.connect();
    await elementsClient.connect();

    // To have a blinded output in the Elements wallet
    await elementsClient.sendToAddress(
      await elementsClient.getNewAddress(),
      10 ** 8,
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
      await wallet.getAddress(),
      outputAmount,
    );

    expect(getOutputValue(wallet, transaction!.outs[vout!])).toEqual(
      outputAmount,
    );
  });

  test('should get output value of unblinded Liquid transactions', async () => {
    const outputAmount = 562312;
    const { transaction, vout } = await walletLiquid.sendToAddress(
      fromOutputScript(
        CurrencyType.Liquid,
        toOutputScript(
          CurrencyType.Liquid,
          await walletLiquid.getAddress(),
          networks.regtest,
        ),
        networks.regtest,
      ),
      outputAmount,
    );

    expect(
      getOutputValue(
        walletLiquid,
        (transaction as LiquidTransaction).outs[vout!],
      ),
    ).toEqual(outputAmount);

    // Wrong asset
    walletLiquid['network'] = networks.liquid;
    expect(
      getOutputValue(
        walletLiquid,
        (transaction as LiquidTransaction).outs[vout!],
      ),
    ).toEqual(0);
    walletLiquid['network'] = networks.regtest;
  });

  test('should get output value of blinded Liquid transactions', async () => {
    const script = toOutputScript(
      CurrencyType.Liquid,
      await walletLiquid.getAddress(),
      walletLiquid.network,
    );

    const outputAmount = 1245412;
    const { transaction, vout } = await walletLiquid.sendToAddress(
      walletLiquid.encodeAddress(script),
      outputAmount,
    );

    expect(
      getOutputValue(
        walletLiquid,
        (transaction as LiquidTransaction).outs[vout!],
      ),
    ).toEqual(outputAmount);

    // Wrong asset hash
    walletLiquid['network'] = networks.liquid;
    expect(
      getOutputValue(
        walletLiquid,
        (transaction as LiquidTransaction).outs[vout!],
      ),
    ).toEqual(0);
    walletLiquid['network'] = networks.regtest;
  });

  test('should construct legacy claim details', async () => {
    const preimage = randomBytes(32);
    const claimKeys = wallet.getNewKeys();
    const refundKeys = ECPair.makeRandom();

    const redeemScript = swapScript(
      crypto.sha256(preimage),
      claimKeys.keys.publicKey,
      refundKeys.publicKey,
      2,
    );
    const outputScript = p2wshOutput(redeemScript);

    const tx = Transaction.fromHex(
      await bitcoinClient.getRawTransaction(
        await bitcoinClient.sendToAddress(
          wallet.encodeAddress(outputScript),
          100_00,
        ),
      ),
    );
    const output = detectSwap(redeemScript, tx);

    const claimDetails = constructClaimDetails(
      {
        get: jest.fn().mockReturnValue(OutputType.Bech32),
      } as unknown as SwapOutputType,
      wallet,
      {
        keyIndex: claimKeys.index,
        version: SwapVersion.Legacy,
        redeemScript: getHexString(redeemScript),
      } as unknown as Swap,
      tx,
      preimage,
    ) as ClaimDetails;

    expect(claimDetails).toEqual({
      ...output,
      preimage,
      redeemScript,
      txHash: tx.getHash(),
      type: OutputType.Bech32,
      keys: wallet.getKeysByIndex(claimKeys.index),
    });
  });

  test('should construct Taproot claim details', async () => {
    const preimage = randomBytes(32);
    const claimKeys = wallet.getNewKeys();
    const refundKeys = ECPair.makeRandom();

    const tree = swapTree(
      false,
      crypto.sha256(preimage),
      claimKeys.keys.publicKey,
      refundKeys.publicKey,
      2,
    );
    const musig = createMusig(claimKeys.keys, refundKeys.publicKey);
    const tweakedKey = tweakMusig(CurrencyType.BitcoinLike, musig, tree);
    const outputScript = p2trOutput(tweakedKey);

    const tx = Transaction.fromHex(
      await bitcoinClient.getRawTransaction(
        await bitcoinClient.sendToAddress(
          wallet.encodeAddress(outputScript),
          100_00,
        ),
      ),
    );
    const output = detectSwap(tweakedKey, tx)!;

    const claimDetails = constructClaimDetails(
      {} as unknown as SwapOutputType,
      wallet,
      {
        keyIndex: claimKeys.index,
        version: SwapVersion.Taproot,
        lockupTransactionVout: output.vout,
        refundPublicKey: refundKeys.publicKey,
        redeemScript: SwapTreeSerializer.serializeSwapTree(tree),
      } as unknown as Swap,
      tx,
      preimage,
    ) as ClaimDetails;

    expect(claimDetails.vout).toEqual(output.vout);
    expect(claimDetails.preimage).toEqual(preimage);
    expect(claimDetails.value).toEqual(output.value);
    expect(claimDetails.keys).toEqual(claimKeys.keys);
    expect(claimDetails.txHash).toEqual(tx.getHash());
    expect(claimDetails.script).toEqual(output.script);
    expect(claimDetails.type).toEqual(OutputType.Taproot);
    expect(claimDetails.cooperative).toEqual(false);
    expect(claimDetails.internalKey).toEqual(musig.getAggregatedPublicKey());
    expect(
      SwapTreeSerializer.serializeSwapTree(claimDetails.swapTree!),
    ).toEqual(SwapTreeSerializer.serializeSwapTree(tree));
  });

  test('should create Musig', () => {
    const ourKeys = ECPair.fromPrivateKey(
      getHexBuffer(
        'a01c77e7effc4d49dd2d2f345b9dde1984c426b17c6756d10041819f73856b8e',
      ),
    );
    const theirPublicKey = getHexBuffer(
      '03d8b9ee7742d8f98484f8e3826083d13453547dea7e8f2976f5733672f3a71f4a',
    );
    const musig = createMusig(ourKeys, theirPublicKey);

    expect(musig.publicKeys).toEqual([ourKeys.publicKey, theirPublicKey]);
    expect(musig.getAggregatedPublicKey()).toMatchSnapshot();
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

    const ourKeys = ECPair.fromPrivateKey(
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

    expect(tweakedMusig).toMatchSnapshot();
  });

  test('should hash Bitcoin transactions for witness v1', async () => {
    const keys = ECPair.makeRandom();

    const outputScript = Scripts.p2trOutput(toXOnly(keys.publicKey));
    const amountSent = 100_000;

    const tx = parseTransaction(
      CurrencyType.BitcoinLike,
      await bitcoinClient.getRawTransaction(
        await bitcoinClient.sendToAddress(
          address.fromOutputScript(outputScript, Networks.bitcoinRegtest),
          amountSent,
        ),
      ),
    );
    const outputToSpendIndex = tx.outs.findIndex((output) =>
      output.script.equals(outputScript),
    );

    const spendTx = new Transaction();
    spendTx.addInput(tx.getHash(), outputToSpendIndex);
    spendTx.addOutput(
      address.toOutputScript(
        await bitcoinClient.getNewAddress(),
        Networks.bitcoinRegtest,
      ),
      amountSent - 1_000,
    );

    const hash = await hashForWitnessV1(
      {
        chainClient: bitcoinClient,
        type: CurrencyType.BitcoinLike,
        network: Networks.bitcoinRegtest,
      } as Currency,
      spendTx,
      0,
    );

    spendTx.setWitness(0, [keys.signSchnorr(hash)]);

    await bitcoinClient.sendRawTransaction(spendTx.toHex());
  });

  test('should hash Liquid transactions for witness v1', async () => {
    const keys = ECPair.makeRandom();

    const outputScript = Scripts.p2trOutput(toXOnly(keys.publicKey));
    const amountSent = 100_000;

    const tx = parseTransaction(
      CurrencyType.Liquid,
      await elementsClient.getRawTransaction(
        await elementsClient.sendToAddress(
          address.fromOutputScript(outputScript, networks.regtest),
          amountSent,
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
          await elementsClient.getNewAddress(),
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

    spendTx.setWitness(0, [keys.signSchnorr(hash)]);

    await elementsClient.sendRawTransaction(spendTx.toHex());
  });
});
