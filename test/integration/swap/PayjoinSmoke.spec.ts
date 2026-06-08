import { secp256k1 } from '@noble/curves/secp256k1.js';
import bolt11 from 'bolt11';
import { spawn, spawnSync } from 'child_process';
import type { ChildProcess } from 'child_process';
import { randomBytes } from 'crypto';
import fs from 'fs';
import http from 'http';
import net from 'net';
import os from 'os';
import path from 'path';
import { QueryTypes } from 'sequelize';
import { parseTransaction, setup } from '../../../lib/Core';
import Logger from '../../../lib/Logger';
import { getPairId } from '../../../lib/Utils';
import RpcClient from '../../../lib/chain/RpcClient';
import {
  CurrencyType,
  SwapUpdateEvent,
  SwapVersion,
} from '../../../lib/consts/Enums';
import type { PairConfig } from '../../../lib/consts/Types';
import Database from '../../../lib/db/Database';
import KeyRepository from '../../../lib/db/repositories/KeyRepository';
import PairRepository from '../../../lib/db/repositories/PairRepository';
import SwapRepository from '../../../lib/db/repositories/SwapRepository';
import RoutingFee from '../../../lib/lightning/RoutingFee';
import PaymentRequestUtils from '../../../lib/service/PaymentRequestUtils';
import Service from '../../../lib/service/Service';
import Sidecar, { TransactionStatus } from '../../../lib/sidecar/Sidecar';
import NodeSwitch from '../../../lib/swap/NodeSwitch';
import OverpaymentProtector from '../../../lib/swap/OverpaymentProtector';
import type { Currency } from '../../../lib/wallet/WalletManager';
import WalletManager from '../../../lib/wallet/WalletManager';
import { regtest as bitcoinRegtest } from '../../Networks';
import { getPostgresDatabase, wait } from '../../Utils';
import {
  bitcoinClient,
  bitcoinLndClient,
  bitcoinLndClient2,
  getBitcoinLndClient2,
  resetNodeConnectionPromises,
} from '../Nodes';

const testTimeout = 300_000;

jest.setTimeout(testTimeout);

type PayjoinSessionRow = {
  id: number;
  swapId: string;
  completedAt: Date | null;
  payjoinTxId: string | null;
};

type PayjoinEventRow = {
  eventData: string;
};

const logStep = (message: string, details?: Record<string, unknown>) => {
  const detailText =
    details === undefined ? '' : ` ${JSON.stringify(details, null, 2)}`;
  console.log(`[payjoin-smoke] ${message}${detailText}`);
};

const loggedStep = async <T>(
  message: string,
  fn: () => Promise<T>,
  details?: Record<string, unknown>,
): Promise<T> => {
  const started = Date.now();
  logStep(`${message}: start`, details);

  try {
    const result = await fn();
    logStep(`${message}: done`, { durationMs: Date.now() - started });
    return result;
  } catch (error) {
    logStep(`${message}: failed`, {
      durationMs: Date.now() - started,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
};

const commandAvailable = (command: string) =>
  spawnSync(command, ['--help'], { stdio: 'ignore' }).status === 0;

const payjoinCliAvailable = () =>
  commandAvailable('payjoin-cli') && commandAvailable('payjoin-mailroom');

type EncodeBip21Args = Parameters<PaymentRequestUtils['encodeBip21']>;

const waitFor = async <T>(
  description: string,
  fn: () => Promise<T | undefined>,
  timeoutMs = 60_000,
  intervalMs = 500,
): Promise<T> => {
  const started = Date.now();

  while (Date.now() - started < timeoutMs) {
    const result = await fn();
    if (result !== undefined) {
      return result;
    }

    await wait(intervalMs);
  }

  throw new Error(`Timed out waiting for ${description}`);
};

const eventName = (row: PayjoinEventRow) => {
  const event = JSON.parse(row.eventData);
  return Object.keys(event)[0];
};

const createBitcoinRpc = (wallet?: string) =>
  new RpcClient(Logger.disabledLogger, 'BTC', {
    host: '127.0.0.1',
    port: 18_443,
    user: 'backend',
    password: 'DPGn0yNNWN5YvBBeRX2kEcJBwv8zwrw9Mw9nkIl05o4',
    wallet,
  });

const getFreePort = async (): Promise<number> =>
  new Promise((resolve, reject) => {
    const server = net.createServer();
    server.on('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      server.close(() => {
        resolve((address as net.AddressInfo).port);
      });
    });
  });

const startPayjoinMailroom = async (
  cwd: string,
  name: string,
): Promise<{
  process: ChildProcess;
  url: string;
}> => {
  const port = await getFreePort();
  const url = `http://127.0.0.1:${port}`;

  const storageDir = path.join(cwd, name);
  fs.mkdirSync(storageDir, { recursive: true });
  const configPath = path.join(cwd, `${name}.toml`);
  fs.writeFileSync(
    configPath,
    [
      `listener = "127.0.0.1:${port}"`,
      `storage_dir = "${storageDir}"`,
      'timeout = 30',
      'mailbox_ttl = 86400',
      '',
    ].join('\n'),
  );

  const process = spawn('payjoin-mailroom', ['--config', configPath], {
    cwd,
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  let stderr = '';
  process.stderr.on('data', (chunk) => {
    stderr += chunk.toString();
  });

  await waitFor(
    'payjoin mailroom to start',
    async () => {
      try {
        const response = await fetch(`${url}/health`);
        return response.ok ? url : undefined;
      } catch {
        return undefined;
      }
    },
    20_000,
    250,
  ).catch((error) => {
    throw new Error(`${error.message}\npayjoin-mailroom stderr:\n${stderr}`);
  });

  return { process, url };
};

const readBody = (request: http.IncomingMessage): Promise<Buffer> =>
  new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    request.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
    request.on('end', () => resolve(Buffer.concat(chunks)));
    request.on('error', reject);
  });

const startPayjoinRelayProxy = async (): Promise<{
  server: http.Server;
  url: string;
}> => {
  const server = http.createServer(async (request, response) => {
    try {
      if (request.url === '/health') {
        response.writeHead(200);
        response.end();
        return;
      }

      const rawUrl = request.url || '';
      const target =
        rawUrl.startsWith('http://') || rawUrl.startsWith('https://')
          ? new URL(rawUrl)
          : new URL(rawUrl.slice(1));
      const targetUrl = `${target.origin}/.well-known/ohttp-gateway`;
      const body = await readBody(request);

      const forwarded = await fetch(targetUrl, {
        method: request.method,
        headers: {
          accept: request.headers.accept || '',
          'content-type': request.headers['content-type'] || '',
        },
        body: request.method === 'GET' ? undefined : body,
      });

      response.writeHead(
        forwarded.status,
        Object.fromEntries(forwarded.headers.entries()),
      );
      response.end(Buffer.from(await forwarded.arrayBuffer()));
    } catch (error) {
      response.writeHead(502);
      response.end(String(error));
    }
  });

  const port = await new Promise<number>((resolve, reject) => {
    server.on('error', reject);
    server.listen(0, '127.0.0.1', () => {
      resolve((server.address() as net.AddressInfo).port);
    });
  });

  return {
    server,
    url: `http://127.0.0.1:${port}`,
  };
};

const startBitcoinRpcProxy = async (
  wallet: string,
): Promise<{
  server: http.Server;
  url: string;
}> => {
  const server = http.createServer(async (request, response) => {
    try {
      const body = await readBody(request);
      const forwarded = await fetch(`http://127.0.0.1:18443/wallet/${wallet}`, {
        method: 'POST',
        headers: {
          authorization: `Basic ${Buffer.from(
            'backend:DPGn0yNNWN5YvBBeRX2kEcJBwv8zwrw9Mw9nkIl05o4',
          ).toString('base64')}`,
          'content-type': 'application/json',
        },
        body,
      });

      const json = (await forwarded.json()) as {
        result?: {
          warnings?: unknown;
        };
      };
      if (json?.result?.warnings === '') {
        json.result.warnings = [];
      }

      response.writeHead(forwarded.status, {
        'content-type': 'application/json',
      });
      response.end(JSON.stringify(json));
    } catch (error) {
      response.writeHead(502);
      response.end(String(error));
    }
  });

  const port = await new Promise<number>((resolve, reject) => {
    server.on('error', reject);
    server.listen(0, '127.0.0.1', () => {
      resolve((server.address() as net.AddressInfo).port);
    });
  });

  return {
    server,
    url: `http://127.0.0.1:${port}`,
  };
};

const writeSidecarConfig = async (cwd: string) => {
  const grpcPort = await getFreePort();
  const apiPort = await getFreePort();
  const wsPort = await getFreePort();
  const config = fs
    .readFileSync(path.join(__dirname, '..', 'sidecar', 'config.toml'), {
      encoding: 'utf-8',
    })
    .replace('port = 10_001', `port = ${grpcPort}`)
    .replace('port = 10_002', `port = ${apiPort}`)
    .replace('port = 10_003', `port = ${wsPort}`);
  const configPath = path.join(cwd, 'sidecar.toml');
  fs.writeFileSync(configPath, config);
  fs.copyFileSync(
    path.join(__dirname, '..', 'sidecar', 'seed.dat'),
    path.join(cwd, 'seed.dat'),
  );

  return {
    configPath,
    grpcPort,
    apiPort,
    wsPort,
  };
};

const seedSidecarDatabase = async () => {
  const sidecarDb = getPostgresDatabase();
  await sidecarDb.init();
  if ((await KeyRepository.getKeyProvider('BTC')) === null) {
    await KeyRepository.addKeyProvider({
      symbol: 'BTC',
      derivationPath: 'm/0/0',
      highestUsedIndex: 0,
    });
  }
  await sidecarDb.close();
};

const startSmokeSidecar = (
  configPath: string,
  payjoinDirectory: string,
  payjoinRelay: string,
) =>
  spawn(
    './target/debug/boltzr',
    ['--config', configPath, '--log-level', 'error'],
    {
      env: {
        ...process.env,
        BOLTZ_PAYJOIN_DIRECTORY: payjoinDirectory,
        BOLTZ_PAYJOIN_OHTTP_RELAYS: payjoinRelay,
      },
      stdio: ['ignore', 'pipe', 'pipe'],
    },
  );

const runPayjoinCli = async (cwd: string, bip21: string) => {
  logStep('running payjoin-cli sender', { cwd });
  const child = spawn('payjoin-cli', ['send', '--fee-rate', '1', bip21], {
    cwd,
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  let stdout = '';
  let stderr = '';
  child.stdout.on('data', (chunk) => {
    stdout += chunk.toString();
  });
  child.stderr.on('data', (chunk) => {
    stderr += chunk.toString();
  });

  const code = await new Promise<number | null>((resolve) => {
    child.on('close', resolve);
  });

  if (code !== 0) {
    throw new Error(
      `payjoin-cli exited with ${code}\nstdout:\n${stdout}\nstderr:\n${stderr}`,
    );
  }

  expect(stdout).toContain('Payjoin sent');
  logStep('payjoin-cli sender completed', {
    stdout: stdout.trim(),
    stderr: stderr.trim(),
  });
};

const payjoinDescribe = payjoinCliAvailable() ? describe : describe.skip;

payjoinDescribe('Payjoin submarine smoke', () => {
  let db: Database;
  let service: Service;
  let smokeSidecar: Sidecar;
  let smokeSidecarProcess: ChildProcess | undefined;
  let tempDir: string;
  let payjoinDirectory: string;
  let payjoinRelay: string;
  let payjoinMailrooms: ChildProcess[] = [];
  let payjoinRelayProxy: http.Server | undefined;
  let bitcoinRpcProxy: http.Server | undefined;
  let bitcoinRpcProxyUrl: string;
  let previousPayjoinDirectory: string | undefined;
  let previousPayjoinRelays: string | undefined;
  const senderWallet = `payjoin-smoke-${process.pid}`;

  const pair: PairConfig = {
    base: 'BTC',
    quote: 'BTC',
    fee: 0.1,
    rate: 1,
    timeoutDelta: 20,
    invoiceExpiry: 60,
    minSwapAmount: 1,
    maxSwapAmount: 100_000_000,
    swapTypes: ['submarine'],
  };

  const currencies = [
    {
      network: bitcoinRegtest,
      chainClient: bitcoinClient,
      lndClients: new Map([[bitcoinLndClient2.id, bitcoinLndClient2]]),
      symbol: bitcoinClient.symbol,
      type: CurrencyType.BitcoinLike,
      limits: {
        minWalletBalance: 1,
        maxZeroConfAmount: 10_000_000,
      },
    },
  ] as Currency[];

  const mnemonicPath = path.join(
    os.tmpdir(),
    `boltz-payjoin-smoke-seed-${process.pid}.dat`,
  );

  const walletManager = new WalletManager(
    Logger.disabledLogger,
    undefined as any,
    mnemonicPath,
    mnemonicPath,
    currencies,
    [],
  );

  beforeAll(async () => {
    logStep('starting setup');
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'boltz-payjoin-smoke-'));
    previousPayjoinDirectory = process.env.BOLTZ_PAYJOIN_DIRECTORY;
    previousPayjoinRelays = process.env.BOLTZ_PAYJOIN_OHTTP_RELAYS;

    const directory = await loggedStep('starting local Payjoin directory', () =>
      startPayjoinMailroom(tempDir, 'mailroom-directory'),
    );
    const relay = await loggedStep(
      'starting local Payjoin OHTTP relay proxy',
      () => startPayjoinRelayProxy(),
    );
    payjoinDirectory = directory.url;
    payjoinRelay = relay.url;
    payjoinMailrooms = [directory.process];
    payjoinRelayProxy = relay.server;
    process.env.BOLTZ_PAYJOIN_DIRECTORY = payjoinDirectory;
    process.env.BOLTZ_PAYJOIN_OHTTP_RELAYS = payjoinRelay;
    logStep('configured Payjoin endpoints', {
      directory: payjoinDirectory,
      relay: payjoinRelay,
    });

    const sidecarConfig = await loggedStep(
      'writing temporary boltzr sidecar config',
      () => writeSidecarConfig(tempDir),
    );
    await loggedStep('seeding boltzr sidecar database', () =>
      seedSidecarDatabase(),
    );
    smokeSidecar = new Sidecar(
      Logger.disabledLogger,
      {
        grpc: {
          host: '127.0.0.1',
          port: sidecarConfig.grpcPort,
          certificates: path.join(tempDir, 'sidecar', 'certificates'),
        },
      },
      '',
    );
    await loggedStep(
      'starting boltzr sidecar',
      async () => {
        smokeSidecarProcess = startSmokeSidecar(
          sidecarConfig.configPath,
          payjoinDirectory,
          payjoinRelay,
        );
        smokeSidecarProcess.stdout?.pipe(process.stdout);
        smokeSidecarProcess.stderr?.pipe(process.stderr);
      },
      {
        grpcPort: sidecarConfig.grpcPort,
        apiPort: sidecarConfig.apiPort,
        wsPort: sidecarConfig.wsPort,
      },
    );
    await loggedStep('running core setup', () => setup());

    db = getPostgresDatabase();
    await loggedStep('initializing Postgres database', () => db.init());
    try {
      await loggedStep('adding BTC/BTC pair row', () =>
        PairRepository.addPair({
          base: pair.base,
          quote: pair.quote,
          id: getPairId(pair),
        }),
      );
    } catch {
      // The integration Postgres database is shared across specs and regtest runs.
      logStep('BTC/BTC pair row already exists');
    }

    await loggedStep('generating Bitcoin regtest block', () =>
      bitcoinClient.generate(1),
    );
    logStep('skipping first Bitcoin LND client connection', {
      reason: 'not required for Payjoin lockup smoke assertion',
    });
    await loggedStep('connecting second Bitcoin LND client', () =>
      getBitcoinLndClient2(),
    );

    await loggedStep('connecting sidecar client', () =>
      smokeSidecar.connect(
        { on: jest.fn(), removeAllListeners: jest.fn() } as any,
        {} as any,
        false,
      ),
    );

    await loggedStep('initializing wallet manager', () =>
      walletManager.init([
        {
          symbol: bitcoinClient.symbol,
          preferredWallet: 'core',
        } as any,
      ]),
    );

    const nodeSwitch = new NodeSwitch(Logger.disabledLogger, {
      swapNode: 'LND',
    });
    const overpaymentProtector = new OverpaymentProtector(
      Logger.disabledLogger,
    );

    service = new Service(
      Logger.disabledLogger,
      undefined,
      {
        currencies: [],
        pairs: [pair],
        prepayminerfee: false,
        rates: {
          interval: 60_000,
        },
        retryInterval: 0,
        swap: {
          minSwapSizeMultipliers: {},
          batchClaimInterval: '',
          expiryTolerance: 10_000,
          deferredClaimSymbols: [],
          cltvDelta: 20,
        },
        swapwitnessaddress: false,
      } as any,
      walletManager,
      nodeSwitch,
      new Map<string, Currency>(currencies.map((cur) => [cur.symbol, cur])),
      smokeSidecar,
      {
        cltvDelta: 20,
      },
      new RoutingFee(Logger.disabledLogger),
      overpaymentProtector,
    );
    logStep('service constructed');

    service['nodeInfo'].isNoRoute = jest.fn().mockReturnValue(false);
    service['timeoutDeltaProvider'].getTimeout = jest
      .fn()
      .mockResolvedValue([1024, true]);
    service['timeoutDeltaProvider'].getCltvLimit = jest
      .fn()
      .mockResolvedValue(18);
    service['timeoutDeltaProvider'].checkRoutability = jest
      .fn()
      .mockResolvedValue(18);
    service['timeoutDeltaProvider'].init([pair], []);
    service['rateProvider'].feeProvider.getFees = jest.fn().mockReturnValue({
      baseFee: 100,
      percentageFee: 100,
      percentageFeeRate: 0,
    });
    const paymentRequestUtils = service['paymentRequestUtils'];
    paymentRequestUtils.encodeBip21 = async (...args: EncodeBip21Args) => {
      const [symbol, address, satoshis, label, swapId, enablePayjoin = true] =
        args;

      if (enablePayjoin && symbol === 'BTC' && swapId !== undefined) {
        return smokeSidecar.getPayjoinUri(address, satoshis, label, swapId);
      }

      return PaymentRequestUtils.prototype.encodeBip21.call(
        paymentRequestUtils,
        ...args,
      );
    };

    await loggedStep('initializing rate provider', () =>
      service['rateProvider'].init([pair]),
    );
    await loggedStep('initializing swap manager', () =>
      service.swapManager.init(currencies, [pair]),
    );

    logStep('creating sender wallet', { wallet: senderWallet });
    try {
      await createBitcoinRpc().request('createwallet', [senderWallet]);
    } catch {
      try {
        await createBitcoinRpc().request('loadwallet', [senderWallet]);
      } catch {
        // The regtest client wallet can already exist and be loaded from local manual runs.
      }
    }

    logStep('funding sender wallet');
    const senderAddress = await createBitcoinRpc(senderWallet).request<string>(
      'getnewaddress',
      ['payjoin-smoke', 'bech32'],
      true,
    );
    await bitcoinClient.sendToAddress(
      senderAddress,
      100_000_000,
      undefined,
      false,
      'payjoin-smoke-funding',
    );
    await bitcoinClient.generate(1);
    logStep('sender wallet funded', { wallet: senderWallet, senderAddress });

    logStep('starting Bitcoin RPC compatibility proxy');
    const rpcProxy = await loggedStep(
      'starting Bitcoin RPC compatibility proxy',
      () => startBitcoinRpcProxy(senderWallet),
    );
    bitcoinRpcProxy = rpcProxy.server;
    bitcoinRpcProxyUrl = rpcProxy.url;
    logStep('Bitcoin RPC compatibility proxy ready', {
      url: bitcoinRpcProxyUrl,
    });

    fs.writeFileSync(
      path.join(tempDir, 'config.toml'),
      [
        '[bitcoind]',
        `rpchost = "${bitcoinRpcProxyUrl}"`,
        'rpcuser = "backend"',
        'rpcpassword = "backend"',
        '',
        '[v2]',
        `pj_directory = "${payjoinDirectory}"`,
        `ohttp_relays = ["${payjoinRelay}"]`,
        '',
      ].join('\n'),
    );
    logStep('wrote payjoin-cli config', {
      cwd: tempDir,
      directory: payjoinDirectory,
      relay: payjoinRelay,
      rpchost: bitcoinRpcProxyUrl,
    });
  });

  afterAll(async () => {
    logStep('starting cleanup');
    service?.rateProvider.disconnect();
    service?.swapManager.routingHints.stop();
    service?.swapManager.deferredClaimer.close();
    service?.swapManager.nursery['invoiceNursery'].destroy();
    service?.['balanceCheck'].destroy();
    const lightningTrackers = service?.swapManager.nursery[
      'pendingPaymentTracker'
    ].lightningTrackers as Record<string, { stop?: () => void }> | undefined;
    if (lightningTrackers !== undefined) {
      for (const tracker of Object.values(lightningTrackers)) {
        if (typeof tracker?.stop === 'function') {
          tracker.stop();
        }
      }
    }

    smokeSidecar?.disconnect();
    if (
      smokeSidecarProcess !== undefined &&
      smokeSidecarProcess.exitCode === null
    ) {
      await new Promise<void>((resolve) => {
        smokeSidecarProcess!.once('exit', resolve);
        smokeSidecarProcess!.kill('SIGINT');
      });
    }

    bitcoinLndClient.disconnect();
    bitcoinLndClient2.disconnect();
    resetNodeConnectionPromises();
    bitcoinClient.disconnect();

    for (const mailroom of payjoinMailrooms) {
      if (mailroom.exitCode === null) {
        await new Promise<void>((resolve) => {
          mailroom.once('exit', resolve);
          mailroom.kill('SIGINT');
        });
      }
    }
    payjoinMailrooms = [];
    if (payjoinRelayProxy !== undefined) {
      await new Promise<void>((resolve) =>
        payjoinRelayProxy!.close(() => resolve()),
      );
    }
    if (bitcoinRpcProxy !== undefined) {
      await new Promise<void>((resolve) =>
        bitcoinRpcProxy!.close(() => resolve()),
      );
    }

    if (previousPayjoinDirectory === undefined) {
      delete process.env.BOLTZ_PAYJOIN_DIRECTORY;
    } else {
      process.env.BOLTZ_PAYJOIN_DIRECTORY = previousPayjoinDirectory;
    }
    if (previousPayjoinRelays === undefined) {
      delete process.env.BOLTZ_PAYJOIN_OHTTP_RELAYS;
    } else {
      process.env.BOLTZ_PAYJOIN_OHTTP_RELAYS = previousPayjoinRelays;
    }

    await wait(500);
    await db?.close();

    if (fs.existsSync(mnemonicPath)) {
      fs.unlinkSync(mnemonicPath);
    }
    if (tempDir && fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
    logStep('cleanup complete');
  });

  test('creates a BTC to LN submarine Payjoin swap and reaches Closed', async () => {
    logStep('creating Lightning invoice');
    const invoiceAmount = 50_000;
    const invoice = await bitcoinLndClient2.addInvoice(invoiceAmount);
    const preimageHash = bolt11
      .decode(invoice.paymentRequest)
      .tags.find((tag) => tag.tagName === 'payment_hash')!.data as string;
    logStep('created Lightning invoice', { invoiceAmount, preimageHash });

    logStep('creating BTC to LN submarine swap');
    const refundKey = secp256k1.getPublicKey(randomBytes(32), true);
    const created = await service.createSwapWithInvoice(
      getPairId(pair),
      'sell',
      Buffer.from(refundKey),
      invoice.paymentRequest,
      undefined,
      undefined,
      SwapVersion.Taproot,
    );
    logStep('created swap', {
      id: created.id,
      address: created.address,
      expectedAmount: created.expectedAmount,
      bip21: created.bip21,
    });

    logStep('asserting BIP21 contains Payjoin parameters');
    expect(created.bip21).toMatch(/^bitcoin:/);
    expect(created.bip21).toContain(created.address);
    const bip21 = new URL(created.bip21);
    expect(bip21.searchParams.get('amount')).toEqual(
      String(created.expectedAmount / 100_000_000),
    );
    expect(created.bip21).toContain('pj=');

    await runPayjoinCli(tempDir, created.bip21);

    logStep('waiting for Payjoin session to close', { swapId: created.id });
    const session = await waitFor('Payjoin session to close', async () => {
      const rows = await Database.sequelize.query<PayjoinSessionRow>(
        'SELECT id, "swapId", "completedAt", "payjoinTxId" FROM "payjoinReceiverSessions" WHERE "swapId" = $1 LIMIT 1',
        {
          bind: [created.id],
          type: QueryTypes.SELECT,
        },
      );

      const row = rows[0];
      return row?.completedAt ? row : undefined;
    });

    expect(session.swapId).toEqual(created.id);
    expect(session.payjoinTxId).toBeTruthy();
    logStep('Payjoin session closed', {
      sessionId: session.id,
      swapId: session.swapId,
      completedAt: session.completedAt,
      payjoinTxId: session.payjoinTxId,
    });

    logStep('loading Payjoin event log', { sessionId: session.id });
    const events = await Database.sequelize.query<PayjoinEventRow>(
      'SELECT "eventData" FROM "payjoinReceiverSessionEvents" WHERE "sessionId" = $1 ORDER BY id ASC',
      {
        bind: [session.id],
        type: QueryTypes.SELECT,
      },
    );
    const names = events.map(eventName);
    logStep('Payjoin event sequence', { events: names });

    expect(names).toEqual(
      expect.arrayContaining([
        'Created',
        'RetrievedOriginalPayload',
        'CheckedBroadcastSuitability',
        'CheckedInputsNotOwned',
        'CheckedNoInputsSeenBefore',
        'IdentifiedReceiverOutputs',
        'CommittedOutputs',
        'CommittedInputs',
        'AppliedFeeRange',
        'FinalizedProposal',
        'PostedPayjoinProposal',
        'Closed',
      ]),
    );

    logStep('injecting Payjoin transaction into UtxoNursery', {
      txId: session.payjoinTxId,
    });
    const payjoinTransaction = parseTransaction(
      CurrencyType.BitcoinLike,
      await bitcoinClient.getRawTransaction(session.payjoinTxId!),
    );
    smokeSidecar.emit('transaction', {
      symbol: bitcoinClient.symbol,
      transaction: payjoinTransaction,
      status: TransactionStatus.ZeroConfSafe,
      swapIds: [],
    });

    logStep('waiting for swap lockup acceptance', { swapId: created.id });
    await waitFor('swap lockup to be accepted', async () => {
      const swap = await SwapRepository.getSwap({ id: created.id });
      if (
        swap?.status !== SwapUpdateEvent.SwapCreated &&
        swap?.status !== SwapUpdateEvent.InvoiceSet
      ) {
        return swap;
      }

      return undefined;
    });

    const swap = (await SwapRepository.getSwap({ id: created.id }))!;
    logStep('swap lockup accepted', {
      swapId: swap.id,
      status: swap.status,
      lockupTransactionId: swap.lockupTransactionId,
      expectedAmount: swap.expectedAmount,
      onchainAmount: swap.onchainAmount,
    });
    expect(swap.preimageHash).toEqual(preimageHash);
    expect(swap.status).not.toEqual(SwapUpdateEvent.TransactionLockupFailed);
    expect(swap.lockupTransactionId).toEqual(session.payjoinTxId);
    expect(Number(swap.onchainAmount)).toBeGreaterThan(
      Number(swap.expectedAmount),
    );
  });
});
