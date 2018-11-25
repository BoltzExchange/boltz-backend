import winston from 'winston';
import colors from 'colors/safe';
import { getTsString } from './Utils';

class Logger {

  public static readonly disabledLogger = new Logger('', '', true);

  // TODO: multiple loggeres for different scopes
  // TODO: 'trace' level instead of 'silly'
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
        case 'error': return colors.red(level);
        case 'warn': return colors.yellow(level);
        case 'info': return colors.green(level);
        case 'verbose': return colors.cyan(level);
        case 'debug': return colors.blue(level);
        case 'silly': return colors.magenta(level);
      }
    }
    return level;
  }

  public error = (message: string) => {
    this.log('error', message);
  }

  public warn = (message: string) => {
    this.log('warn', message);
  }

  public info = (message: string) => {
    this.log('info', message);
  }

  public verbose = (message: string) => {
    this.log('verbose', message);
  }

  public debug = (message: string) => {
    this.log('debug', message);
  }

  public silly = (message: string) => {
    this.log('silly', message);
  }

  private log = (level: string, message: string) => {
    if (!this.disabled) {
      winston.log(level, message);
    }
  }
}

export default Logger;
