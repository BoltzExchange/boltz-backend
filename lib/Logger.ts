import winston from 'winston';
import { red, yellow, green, cyan, blue, magenta } from 'colors/safe';
import { getTsString } from './Utils';

class Logger {
  public static readonly disabledLogger = new Logger('', '', true);

  constructor(filename: string, level: string, private disabled = false) {
    if (disabled) {
      return;
    }

    winston.configure({
      level,
      transports: [
        new winston.transports.Console({
          format: this.getLogFormat(true),
        }),
        new winston.transports.File({
          filename,
          format: this.getLogFormat(false),
        }),
      ],
    });
  }

  private getLogFormat = (colorize: boolean) => {
    return winston.format.printf(info => `${getTsString()} ${this.getLevel(info.level, colorize)}: ${info.message}`);
  }

  private getLevel = (level: string, colorize: boolean) => {
    if (colorize) {
      switch (level) {
        case 'error': return red(level);
        case 'warn': return yellow(level);
        case 'info': return green(level);
        case 'verbose': return cyan(level);
        case 'debug': return blue(level);
        case 'silly': return magenta(level);
      }
    }
    return level;
  }

  public error = (message: string): void => {
    this.log('error', message);
  }

  public warn = (message: string): void => {
    this.log('warn', message);
  }

  public info = (message: string): void => {
    this.log('info', message);
  }

  public verbose = (message: string): void => {
    this.log('verbose', message);
  }

  public debug = (message: string): void => {
    this.log('debug', message);
  }

  public silly = (message: string): void => {
    this.log('silly', message);
  }

  private log = (level: string, message: string) => {
    if (!this.disabled) {
      winston.log(level, message);
    }
  }
}

export default Logger;
