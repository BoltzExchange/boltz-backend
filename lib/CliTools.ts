import fs from 'fs';
import path from 'path';
import { Arguments } from 'yargs';
import Config from './Config';
import Logger from './Logger';
import Stats from './data/Stats';
import Report from './data/Report';
import Database from './db/Database';
import { resolveHome } from './Utils';
import SwapRepository from './service/SwapRepository';
import ReverseSwapRepository from './service/ReverseSwapRepository';

export const generateReport = async (argv: Arguments<any>) => {
  await initDatabase(argv);

  const report = new Report(new SwapRepository(), new ReverseSwapRepository());
  const csv = await report.generate();

  if (argv.reportpath) {
    fs.writeFileSync(resolveHome(argv.reportpath), csv);
  } else {
    console.log(csv);
  }
};

export const generateStats = async (argv: Arguments<any>) => {
  await initDatabase(argv);

  const stats = new Stats(new SwapRepository(), new ReverseSwapRepository());

  console.log(await stats.generate());
};

export const initDatabase = async (argv: Arguments<any>) => {
  // Get the path to the database from the command line arguments or
  // use a default one if none was specified
  const dbPath = argv.dbpath || path.join(Config.defaultDataDir, Config.defaultDbPath);

  const db = new Database(Logger.disabledLogger, resolveHome(dbPath));
  await db.init();

};
