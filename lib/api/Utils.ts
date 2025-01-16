import { Request, Response } from 'express';
import Logger from '../Logger';
import { getHexBuffer } from '../Utils';
import MarkedSwapRepository from '../db/repositories/MarkedSwapRepository';
import ServiceErrors from '../service/Errors';
import Sidecar from '../sidecar/Sidecar';
import Errors from './Errors';

export type ApiType = 'string' | 'number' | 'boolean' | 'object';

export type ApiArgument = {
  name: string;
  type: ApiType;
  hex?: boolean;
  optional?: boolean;
};

// Some endpoints are getting spammed on mainnet, so we don't log the warnings for them
const errorsNotToLog: any[] = [
  ServiceErrors.SWAP_NO_LOCKUP().message,
  ServiceErrors.ETHEREUM_NOT_ENABLED().message,
];

/**
 * Validates that all required arguments were provided in the body correctly
 *
 * @returns the validated arguments
 */
export const validateRequest = (
  body: Record<string, any>,
  argsToCheck: ApiArgument[],
) => {
  const response: any = {};

  argsToCheck.forEach((arg) => {
    const value = body[arg.name];

    if (value !== undefined) {
      if (typeof value === arg.type) {
        if (arg.hex && value !== '') {
          const buffer = getHexBuffer(value);

          if (buffer.length === 0) {
            throw Errors.COULD_NOT_PARSE_HEX(arg.name);
          }

          response[arg.name] = buffer;
        } else {
          response[arg.name] = value;
        }
      } else {
        throw Errors.INVALID_PARAMETER(arg.name);
      }
    } else if (!arg.optional) {
      throw Errors.UNDEFINED_PARAMETER(arg.name);
    }
  });

  return response;
};

export const validateArray = (
  name: string,
  data: object,
  entryType: ApiType,
  maxLength?: number,
) => {
  if (!Array.isArray(data)) {
    throw Errors.INVALID_PARAMETER(name);
  }

  if ((data as any[]).some((val) => typeof val !== entryType)) {
    throw Errors.INVALID_PARAMETER(name);
  }

  if (maxLength !== undefined && maxLength < (data as any[]).length) {
    throw Errors.INVALID_PARAMETER(name);
  }
};

export const errorResponse = (
  logger: Logger,
  req: Request,
  res: Response,
  error: unknown,
  statusCode = 400,
): void => {
  if (typeof error === 'string') {
    writeErrorResponse(logger, req, res, statusCode, { error });
  } else {
    const errorObject = error as any;

    // Bitcoin Core related errors
    if (errorObject.details) {
      writeErrorResponse(logger, req, res, statusCode, {
        error: errorObject.details,
      });
      // Custom error when broadcasting a refund transaction fails because
      // the locktime requirement has not been met yet
    } else if (errorObject.timeoutBlockHeight) {
      writeErrorResponse(logger, req, res, statusCode, error);
      // Everything else
    } else {
      writeErrorResponse(logger, req, res, statusCode, {
        error: errorObject.message,
      });
    }
  }
};

export const successResponse = (
  res: Response,
  data: unknown,
  statusCode = 200,
) => {
  setContentTypeJson(res);
  res.status(statusCode);

  if (typeof data === 'object') {
    res.json(data);
  } else {
    res.write(data);
    res.end();
  }
};

export const createdResponse = (res: Response, data: unknown) => {
  setContentTypeJson(res);
  res.status(201).json(data);
};

export const writeErrorResponse = (
  logger: Logger,
  req: Request,
  res: Response,
  statusCode: number,
  error: any,
) => {
  if (!errorsNotToLog.includes(error?.error || error)) {
    logger.warn(
      `Request ${req.method} ${req.originalUrl} ${
        req.body && Object.keys(req.body).length > 0
          ? `${JSON.stringify(req.body)} `
          : ''
      }failed: ${JSON.stringify(error)}`,
    );
  }

  setContentTypeJson(res);
  res.status(statusCode).json(error);
};

export const setContentTypeJson = (res: Response) => {
  res.set('Content-Type', 'application/json');
};

export const checkPreimageHashLength = (preimageHash: Buffer) => {
  if (preimageHash.length !== 32) {
    throw `invalid preimage hash length: ${preimageHash.length}`;
  }
};

export const markSwap = async (
  sidecar: Sidecar,
  ip: string | undefined,
  swapId: string,
) => {
  if (ip === undefined) {
    return;
  }

  if (await sidecar.isMarked(ip)) {
    await MarkedSwapRepository.addMarkedSwap(swapId);
  }
};

export const parseReferralId = (req: Request): string | undefined => {
  const apiArguments: ApiArgument[] = [
    { name: 'referralId', type: 'string', optional: true },
  ];
  const parsedBody = validateRequest(req.body, apiArguments);

  if (parsedBody.referralId !== undefined && parsedBody.referralId !== '') {
    return parsedBody.referralId;
  }

  if (req.query) {
    return validateRequest(req.query, apiArguments).referralId;
  }

  return undefined;
};
