import { Request, Response } from 'express';
import Logger from '../Logger';
import { getHexBuffer } from '../Utils';
import ServiceErrors from '../service/Errors';
import Errors from './Errors';

type ApiArgument = {
  name: string;
  type: string;
  hex?: boolean;
  optional?: boolean;
};

// Some endpoints are getting spammed on mainnet, so we don't log the warnings for them
const errorsNotToLog: any[] = [ServiceErrors.SWAP_NO_LOCKUP().message];

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

export const errorResponse = (
  logger: Logger,
  req: Request,
  res: Response,
  error: unknown,
  statusCode = 400,
  urlPrefix: string = '',
): void => {
  if (typeof error === 'string') {
    writeErrorResponse(logger, req, res, statusCode, { error }, urlPrefix);
  } else {
    const errorObject = error as any;

    // Bitcoin Core related errors
    if (errorObject.details) {
      writeErrorResponse(
        logger,
        req,
        res,
        statusCode,
        {
          error: errorObject.details,
        },
        urlPrefix,
      );
      // Custom error when broadcasting a refund transaction fails because
      // the locktime requirement has not been met yet
    } else if (errorObject.timeoutBlockHeight) {
      writeErrorResponse(logger, req, res, statusCode, error, urlPrefix);
      // Everything else
    } else {
      writeErrorResponse(
        logger,
        req,
        res,
        statusCode,
        {
          error: errorObject.message,
        },
        urlPrefix,
      );
    }
  }
};

export const successResponse = (res: Response, data: unknown) => {
  setContentTypeJson(res);
  res.status(200);

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
  urlPrefix: string = '',
) => {
  if (!errorsNotToLog.includes(error?.error || error)) {
    logger.warn(
      `Request ${urlPrefix + req.url} ${JSON.stringify(
        req.body,
      )} failed: ${JSON.stringify(error)}`,
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
