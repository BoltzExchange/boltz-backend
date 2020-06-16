import { Op } from 'sequelize';
import { Request, Response } from 'express';
import Logger from '../Logger';
import Service from '../service/Service';
import SwapNursery from '../swap/SwapNursery';
import { SwapUpdate } from '../service/EventHandler';
import { SwapType, SwapUpdateEvent } from '../consts/Enums';
import { getChainCurrency, getHexBuffer, getVersion, mapToObject, splitPairId, stringify } from '../Utils';

type ApiArgument = {
  name: string,
  type: string,
  hex?: boolean,
  optional?: boolean,
};

class Controller {
  // A map between the ids and HTTP streams of all pending swaps
  private pendingSwapStreams = new Map<string, Response>();

  // A map between the ids and statuses of the swaps
  private pendingSwapInfos = new Map<string, SwapUpdate>();

  constructor(private logger: Logger, private service: Service) {
    this.service.eventHandler.on('swap.update', (id, message) => {
      this.logger.debug(`Swap ${id} update: ${stringify(message)}`);
      this.pendingSwapInfos.set(id, message);

      const response = this.pendingSwapStreams.get(id);

      if (response) {
        response.write(`data: ${JSON.stringify(message)}\n\n`);
      }
    });
  }

  public init = async () => {
    // Get the latest status of all swaps in the database
    const [swaps, reverseSwaps] = await Promise.all([
      this.service.swapManager.swapRepository.getSwaps(),
      this.service.swapManager.reverseSwapRepository.getReverseSwaps(),
    ]);

    for (const swap of swaps) {
      const status = swap.status as SwapUpdateEvent;

      switch (status) {
        case SwapUpdateEvent.ChannelCreated:
          const channelCreation = await this.service.swapManager.channelCreationRepository.getChannelCreation({
            swapId: {
              [Op.eq]: swap.id,
            },
          });

          this.pendingSwapInfos.set(swap.id, {
            status,
            channel: {
              fundingTransactionId: channelCreation!.fundingTransactionId!,
              fundingTransactionVout: channelCreation!.fundingTransactionVout!,
            },
          });

          break;

        default:
          this.pendingSwapInfos.set(swap.id, { status: swap.status as SwapUpdateEvent });
          break;
      }
    }

    for (const reverseSwap of reverseSwaps) {
      const status = reverseSwap.status as SwapUpdateEvent;

      switch (status) {
        case SwapUpdateEvent.TransactionMempool:
        case SwapUpdateEvent.TransactionConfirmed:
          const { base, quote } = splitPairId(reverseSwap.pair);
          const chainCurrency = getChainCurrency(base, quote, reverseSwap.orderSide, true);

          const transactionHex = await this.service.getTransaction(chainCurrency, reverseSwap.transactionId!);

          this.pendingSwapInfos.set(reverseSwap.id, {
            status,
            transaction: {
              hex: transactionHex,
              id: reverseSwap.transactionId!,
              eta: status === SwapUpdateEvent.TransactionMempool ? SwapNursery.reverseSwapMempoolEta : undefined,
            },
          });
          break;

        default:
          this.pendingSwapInfos.set(reverseSwap.id, { status });
          break;
      }
    }
  }

  // GET requests
  public version = (_: Request, res: Response) => {
    this.successResponse(res, {
      version: getVersion(),
    });
  }

  public getPairs = (_: Request, res: Response) => {
    const data = this.service.getPairs();

    this.successResponse(res, {
      info: data.info,
      warnings: data.warnings,
      pairs: mapToObject(data.pairs),
    });
  }

  public getNodes = async (_: Request, res: Response) => {
    const nodes = await this.service.getNodes();

    this.successResponse(res, {
      nodes: mapToObject(nodes),
    });
  }

  public getFeeEstimation = async (_: Request, res: Response) => {
    const feeEstimation = await this.service.getFeeEstimation();

    this.successResponse(res, mapToObject(feeEstimation));
  }

  // POST requests
  public swapStatus = async (req: Request, res: Response) => {
    try {
      const { id } = this.validateRequest(req.body, [
        { name: 'id', type: 'string' },
      ]);

      const response = this.pendingSwapInfos.get(id);

      if (response) {
        this.successResponse(res, response);
      } else {
        this.errorResponse(req, res, `could not find swap with id: ${id}`, 404);
      }
    } catch (error) {
      this.errorResponse(req, res, error);
    }
  }

  public swapRates = async (req: Request, res: Response) => {
    try {
      const { id } = this.validateRequest(req.body, [
        { name: 'id', type: 'string' },
      ]);

      const response = await this.service.getSwapRates(id);
      this.successResponse(res, response);
    } catch (error) {
      this.errorResponse(req, res, error);
    }
  }

  public getTransaction = async (req: Request, res: Response) => {
    try {
      const { currency, transactionId } = this.validateRequest(req.body, [
        { name: 'currency', type: 'string' },
        { name: 'transactionId', type: 'string' },
      ]);

      const response = await this.service.getTransaction(currency, transactionId);
      this.successResponse(res, { transactionHex: response });
    } catch (error) {
      this.errorResponse(req, res, error);
    }
  }

  public getSwapTransaction = async (req: Request, res: Response) => {
    try {
      const { id } = this.validateRequest(req.body, [
        { name: 'id', type: 'string' },
      ]);

      const response = await this.service.getSwapTransaction(id);
      this.successResponse(res, response);
    } catch (error) {
      this.errorResponse(req, res, error);
    }
  }

  public broadcastTransaction = async (req: Request, res: Response) => {
    try {
      const { currency, transactionHex } = this.validateRequest(req.body, [
        { name: 'currency', type: 'string' },
        { name: 'transactionHex', type: 'string' },
      ]);

      const response = await this.service.broadcastTransaction(currency, transactionHex);
      this.successResponse(res, { transactionId: response });
    } catch (error) {
      this.errorResponse(req, res, error);
    }
  }

  public createSwap = async (req: Request, res: Response) => {
    try {
      const { type } = this.validateRequest(req.body, [
        { name: 'type', type: 'string' },
      ]);

      const swapType = this.parseSwapType(type);

      switch (swapType) {
        case SwapType.Submarine:
          await this.createSubmarineSwap(req, res);
          break;

        case SwapType.ReverseSubmarine:
          await this.createReverseSubmarineSwap(req, res);
          break;
      }

    } catch (error) {
      this.errorResponse(req, res, error);
    }
  }

  private createSubmarineSwap = async (req: Request, res: Response) => {
    const { pairId, orderSide, invoice, refundPublicKey, preimageHash, channel } = this.validateRequest(req.body, [
      { name: 'pairId', type: 'string' },
      { name: 'orderSide', type: 'string' },
      { name: 'invoice', type: 'string', optional: true },
      { name: 'refundPublicKey', type: 'string', hex: true },
      { name: 'preimageHash', type: 'string', hex: true, optional: true },
      { name: 'channel', type: 'object', optional: true },
    ]);

    if (channel !== undefined) {
      this.validateRequest(channel, [
        { name: 'auto', type: 'boolean' },
        { name: 'private', type: 'boolean' },
        { name: 'inboundLiquidity', type: 'number' },
      ]);
    }

    let response: any;

    if (invoice) {
      response = await this.service.createSwapWithInvoice(
        pairId,
        orderSide,
        refundPublicKey,
        invoice.toLowerCase(),
        channel,
      );
    } else {
      // Check that the preimage hash was set
      this.validateRequest(req.body, [
        { name: 'preimageHash', type: 'string', hex: true },
      ]);

      this.checkPreimageHashLength(preimageHash);

      response = await this.service.createSwap(
        pairId,
        orderSide,
        refundPublicKey,
        preimageHash,
        channel,
      );
    }

    this.logger.verbose(`Created new swap with id: ${response.id}`);
    this.logger.silly(`Swap ${response.id}: ${stringify(response)}`);

    this.createdResponse(res, response);
  }

  private createReverseSubmarineSwap = async (req: Request, res: Response) => {
    const {
      pairId,
      orderSide,
      preimageHash,
      invoiceAmount,
      claimPublicKey,
    } = this.validateRequest(req.body, [
      { name: 'pairId', type: 'string' },
      { name: 'orderSide', type: 'string' },
      { name: 'invoiceAmount', type: 'number' },
      { name: 'preimageHash', type: 'string', hex: true },
      { name: 'claimPublicKey', type: 'string', hex: true },
    ]);

    this.checkPreimageHashLength(preimageHash);

    const response = await this.service.createReverseSwap(pairId, orderSide, preimageHash, invoiceAmount, claimPublicKey);

    this.logger.verbose(`Created reverse swap with id: ${response.id}`);
    this.logger.silly(`Reverse swap ${response.id}: ${stringify(response)}`);

    this.createdResponse(res, response);
  }

  public setInvoice = async (req: Request, res: Response) => {
    try {
      const { id, invoice } = this.validateRequest(req.body, [
        { name: 'id', type: 'string' },
        { name: 'invoice', type: 'string' },
      ]);

      const response = await this.service.setSwapInvoice(id, invoice.toLowerCase());
      this.successResponse(res, response);
    } catch (error) {
      this.errorResponse(req, res, error);
    }
  }

  // EventSource streams
  public streamSwapStatus = (req: Request, res: Response) => {
    try {
      const { id } = this.validateRequest(req.query, [
        { name: 'id', type: 'string' },
      ]);

      res.writeHead(200, {
        Connection: 'keep-alive',
        'X-Accel-Buffering': 'no',
        'Cache-Control': 'no-cache',
        'Content-Type': 'text/event-stream',
      });

      res.setTimeout(0);

      this.pendingSwapStreams.set(id, res);

      res.on('close', () => {
        this.pendingSwapStreams.delete(id);
      });
    } catch (error) {
      this.errorResponse(req, res, error);
    }
  }

  /**
   * Validates that all required arguments were provided in the body correctly
   *
   * @returns the validated arguments
   */
  private validateRequest = (body: object, argsToCheck: ApiArgument[]) => {
    const response: any = {};

    argsToCheck.forEach((arg) => {
      const value = body[arg.name];

      if (value !== undefined) {
        if (typeof value === arg.type) {
          if (arg.hex) {
            const buffer = getHexBuffer(value);

            if (buffer.length === 0) {
              throw `could not parse hex string: ${arg.name}`;
            }

            response[arg.name] = buffer;
          } else {
            response[arg.name] = value;
          }
        } else {
          throw `invalid parameter: ${arg.name}`;
        }
      } else if (!arg.optional) {
        throw `undefined parameter: ${arg.name}`;
      }
    });

    return response;
  }

  public errorResponse = (req: Request, res: Response, error: any, statusCode = 400) => {
    if (typeof error === 'string') {
      this.writeErrorResponse(req, res, statusCode, { error });
    } else {
      // Bitcoin Core related errors
      if (error.details) {
        this.writeErrorResponse(req, res, statusCode, { error: error.details });
      // Custom error when broadcasting a refund transaction fails because
      // the locktime requirement has not been met yet
      } else if (error.timeoutBlockHeight) {
        this.writeErrorResponse(req, res, statusCode, error);
      // Everything else
      } else {
        this.writeErrorResponse(req, res, statusCode, { error: error.message });
      }
    }
  }

  private successResponse = (res: Response, data: object) => {
    this.setContentTypeJson(res);
    res.status(200).json(data);
  }

  private createdResponse = (res: Response, data: object) => {
    this.setContentTypeJson(res);
    res.status(201).json(data);
  }

  private writeErrorResponse = (req: Request, res: Response, statusCode: number, error: object) => {
    this.logger.warn(`Request ${req.url} ${JSON.stringify(req.body)} failed: ${JSON.stringify(error)}`);

    this.setContentTypeJson(res);
    res.status(statusCode).json(error);
  }

  private setContentTypeJson = (res: Response) => {
    res.set('Content-Type', 'application/json');
  }

  private parseSwapType = (type: string) => {
    const lowerCaseType = type.toLowerCase();

    for (const swapType in SwapType) {
      if (lowerCaseType === SwapType[swapType]) {
        return lowerCaseType as SwapType;
      }
    }

    throw `could not find swap type: ${type}`;
  }

  private checkPreimageHashLength = (preimageHash: Buffer) => {
    if (preimageHash.length !== 32) {
      throw `invalid preimage hash length: ${preimageHash.length}`;
    }
  }
}

export default Controller;
