import { Request, Response } from 'express';
import Logger from '../Logger';
import Service from '../service/Service';
import { SwapUpdateEvent } from '../consts/Enums';
import { stringify, getHexBuffer, mapToObject } from '../Utils';

class Controller {
  // A map between the ids and HTTP streams of all pending swaps
  private pendingSwapStreams = new Map<string, Response>();

  // A map between the ids and statuses of the swaps
  private pendingSwapInfos = new Map<string, object>();

  constructor(private logger: Logger, private service: Service) {
    this.service.eventHandler.on('swap.update', (id, message) => {
      this.pendingSwapInfos.set(id, message);

      const response = this.pendingSwapStreams.get(id);

      if (response) {
        this.logger.debug(`Swap ${id} update: ${stringify(message)}`);
        response.write(`data: ${JSON.stringify(message)}\n\n`);
      }
    });
  }

  public init = async () => {
    // Get the latest status of all swaps in the database
    const [swaps, reverseSwaps] = await Promise.all([
      this.service.swapRepository.getSwaps(),
      this.service.reverseSwapRepository.getReverseSwaps(),
    ]);

    swaps.forEach((swap) => {
      if (swap.status) {
        this.pendingSwapInfos.set(swap.id, { event: swap.status });
      }
    });

    reverseSwaps.forEach((reverseSwap) => {
      if (reverseSwap.status) {
        const event = reverseSwap.status;

        if (event !== SwapUpdateEvent.InvoiceSettled) {
          this.pendingSwapInfos.set(reverseSwap.id, { event });
        } else {
          this.pendingSwapInfos.set(reverseSwap.id, { event, preimage: reverseSwap.preimage });
        }
      }
    });
  }

  // GET requests
  public getPairs = (_req: Request, res: Response) => {
    const data = this.service.getPairs();

    this.successResponse(res, {
      warnings: data.warnings,
      pairs: mapToObject(data.pairs),
    });
  }

  public getFeeEstimation = async (_req: Request, res: Response) => {
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
        this.errorResponse(res, `could not find swap with id: ${id}`, 404);
      }
    } catch (error) {
      this.errorResponse(res, error);
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
      this.errorResponse(res, error);
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
      this.errorResponse(res, error);
    }
  }

  public createSwap = async (req: Request, res: Response) => {
    try {
      const { pairId, orderSide, invoice, refundPublicKey } = this.validateRequest(req.body, [
        { name: 'pairId', type: 'string' },
        { name: 'orderSide', type: 'string' },
        { name: 'invoice', type: 'string' },
        { name: 'refundPublicKey', type: 'string', isHex: true },
      ]);

      const response = await this.service.createSwap(
        pairId,
        orderSide,
        invoice,
        refundPublicKey,
      );

      this.logger.verbose(`Created new swap with id: ${response.id}`);
      this.logger.silly(`Swap ${response.id}: ${stringify(response)}`);

      this.createdResponse(res, response);
    } catch (error) {
      this.errorResponse(res, error);
    }
  }

  public createReverseSwap = async (req: Request, res: Response) => {
    try {
      const { pairId, orderSide, invoiceAmount, claimPublicKey } = this.validateRequest(req.body, [
        { name: 'pairId', type: 'string' },
        { name: 'orderSide', type: 'string' },
        { name: 'invoiceAmount', type: 'number' },
        { name: 'claimPublicKey', type: 'string', isHex: true },
      ]);

      const response = await this.service.createReverseSwap(pairId, orderSide, invoiceAmount, claimPublicKey);

      this.logger.verbose(`Created reverse swap with id: ${response.id}`);
      this.logger.silly(`Reverse swap ${response.id}: ${stringify(response)}`);

      this.createdResponse(res, response);
    } catch (error) {
      this.errorResponse(res, error);
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
      this.errorResponse(res, error);
    }
  }

  /**
   * Validates that all required arguments were provided in the body correctly
   *
   * @returns the validated arguments
   */
  private validateRequest = (body: object, argsToCheck: { name: string, type: string, isHex?: boolean }[]) => {
    const response: any = {};

    argsToCheck.forEach((arg) => {
      const value = body[arg.name];

      if (value !== undefined) {
        if (typeof value === arg.type) {
          if (arg.isHex) {
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
      } else {
        throw `undefined parameter: ${arg.name}`;
      }
    });

    return response;
  }

  public errorResponse = (res: Response, error: any, statusCode = 400) => {
    if (typeof error === 'string') {
      this.writeErrorResponse(res, statusCode, error);
    } else {
      if (error.details) {
        this.writeErrorResponse(res, statusCode, error.details);
      } else {
        this.writeErrorResponse(res, statusCode, error.message);
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

  private writeErrorResponse = (res: Response, statusCode: number, error: string) => {
    this.logger.warn(`Request failed: ${error}`);

    this.setContentTypeJson(res);
    res.status(statusCode).json({ error });
  }

  private setContentTypeJson = (res: Response) => {
    res.set('Content-Type', 'application/json');
  }
}

export default Controller;
