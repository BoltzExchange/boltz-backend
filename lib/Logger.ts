import { blue, cyan, green, magenta, red, yellow } from 'colors/safe';
import winston from 'winston';
import LokiTransport from 'winston-loki';
import { name } from '../package.json';
import { getTsString } from './Utils';

class Logger {
  public static readonly disabledLogger = new Logger(
    '',
    undefined,
    undefined,
    undefined,
    true,
  );

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
      level,
      transports,
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
        case 'error':
          return red(level);
        case 'warn':
          return yellow(level);
        case 'info':
          return green(level);
        case 'verbose':
          return cyan(level);
        case 'debug':
          return blue(level);
        case 'silly':
          return magenta(level);
      }
    }
    return level;
  };

  public error = (message: string): void => {
    this.log('error', message);
  };

  public warn = (message: string): void => {
    this.log('warn', message);
  };

  public info = (message: string): void => {
    this.log('info', message);
  };

  public verbose = (message: string): void => {
    this.log('verbose', message);
  };

  public debug = (message: string): void => {
    this.log('debug', message);
  };

  public silly = (message: string): void => {
    this.log('silly', message);
  };

  private log = (level: string, message: string) => {
    if (!this.disabled) {
      winston.log(level, message);
    }
  };
}

export default Logger;
