import fs from 'fs';
import path from 'path';
import { Arguments } from 'yargs';
import Config from './Config';
import Logger from './Logger';
import Stats from './data/Stats';
import Report from './data/Report';
import Database from './db/Database';
import { resolveHome, stringify } from './Utils';
import SwapRepository from './db/SwapRepository';
import SwapFailureChecker from './data/SwapFailureChecker';
import ReverseSwapRepository from './db/ReverseSwapRepository';

const initDatabase = async (argv: Arguments<any>): Promise<void> => {
  // Get the path to the database from the command line arguments or
  // use a default one if none was specified
  const dbPath = argv.dbpath || path.join(Config.defaultDataDir, Config.defaultDbPath);

  const db = new Database(Logger.disabledLogger, resolveHome(dbPath));
  await db.init();
};

const generateReport = async (argv: Arguments<any>): Promise<void> => {
  await initDatabase(argv);

  const report = new Report(new SwapRepository(), new ReverseSwapRepository());
  const csv = await report.generate();

  if (argv.reportpath) {
    fs.writeFileSync(resolveHome(argv.reportpath), csv);
  } else {
    console.log(csv);
  }
};

const generateStats = async (argv: Arguments<any>): Promise<void> => {
  await initDatabase(argv);

  const stats = new Stats(new SwapRepository(), new ReverseSwapRepository());

  console.log(await stats.generate());
};

const checkFailedSwaps = async (argv: Arguments<any>): Promise<void> => {
  await initDatabase(argv);

  const failedSwaps = new SwapFailureChecker(new SwapRepository(), new ReverseSwapRepository());

  console.log(stringify(await failedSwaps.check()));
};

export {
  generateStats,
  generateReport,
  checkFailedSwaps,
};
