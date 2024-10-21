import { blue, cyan, green, magenta, red, yellow } from 'colors/safe';
import winston from 'winston';
import LokiTransport from 'winston-loki';
import { name } from '../package.json';
import { getTsString } from './Utils';

enum LogLevel {
  Error = 'error',
  Warn = 'warn',
  Info = 'info',
  Verbose = 'verbose',
  Debug = 'debug',
  Silly = 'silly',
}

const levelToPriority = (level: LogLevel) => {
  switch (level) {
    case LogLevel.Error:
      return 0;
    case LogLevel.Warn:
      return 1;
    case LogLevel.Info:
      return 2;
    case LogLevel.Verbose:
      return 3;
    case LogLevel.Debug:
      return 4;
    case LogLevel.Silly:
      return 5;

    default:
      throw 'invalid log level';
  }
};

class Logger {
  public static readonly disabledLogger = new Logger(
    '',
    undefined,
    undefined,
    undefined,
    true,
  );

  private level = 0;
  private readonly loki?: LokiTransport;

  constructor(
    level: string,
    filename?: string,
    lokiHost?: string,
    network?: string,
    private disabled = false,
  ) {
    if (disabled) {
      return;
    }

    this.level = levelToPriority(level as LogLevel);

    const transports: winston.transport[] = [
      new winston.transports.Console({
        format: this.getLogFormat(true),
      }),
    ];

    if (filename) {
      transports.push(
        new winston.transports.File({
          filename,
          format: this.getLogFormat(false),
        }),
      );
    }

    const lokiEnabled = [lokiHost, network].every((val) => val !== undefined);

    if (lokiEnabled) {
      this.loki = new LokiTransport({
        host: lokiHost!,
        format: winston.format.printf((info) =>
          JSON.stringify({
            message: info.message,
            span_id: info.span_id,
            trace_id: info.trace_id,
            trace_flags: info.trace_flags,
          }),
        ),
        labels: {
          network,
          job: `${name}-${network}`,
        },
      });
      transports.push(this.loki!);
    }

    winston.configure({
      transports,
      level: 'silly',
    });

    if (!lokiEnabled) {
      this.warn('Disabled loki logger because of invalid configuration');
    } else {
      this.debug('Enabled loki logger');
    }
  }

  public close = async () => {
    if (this.loki !== undefined) {
      await this.loki.flush();
      await (this.loki as any).close();
    }
  };

  public setLevel = (level: LogLevel) => {
    this.level = levelToPriority(level);
  };

  private getLogFormat = (colorize: boolean) => {
    return winston.format.printf(
      (info) =>
        `${getTsString()} ${this.getLevel(info.level, colorize)}: ${
          info.message
        }`,
    );
  };

  private getLevel = (level: string, colorize: boolean) => {
    if (colorize) {
      switch (level) {
        case LogLevel.Error:
          return red(level);
        case LogLevel.Warn:
          return yellow(level);
        case LogLevel.Info:
          return green(level);
        case LogLevel.Verbose:
          return cyan(level);
        case LogLevel.Debug:
          return blue(level);
        case LogLevel.Silly:
          return magenta(level);
      }
    }
    return level;
  };

  public error = (message: string): void => {
    this.log(LogLevel.Error, message);
  };

  public warn = (message: string): void => {
    this.log(LogLevel.Warn, message);
  };

  public info = (message: string): void => {
    this.log(LogLevel.Info, message);
  };

  public verbose = (message: string): void => {
    this.log(LogLevel.Verbose, message);
  };

  public debug = (message: string): void => {
    this.log(LogLevel.Debug, message);
  };

  public silly = (message: string): void => {
    this.log(LogLevel.Silly, message);
  };

  private log = (level: LogLevel, message: string) => {
    if (!this.disabled && this.level >= levelToPriority(level)) {
      winston.log(level, message);
    }
  };
}

export default Logger;
export { LogLevel };
