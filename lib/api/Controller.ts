import { Request, Response } from 'express';
import path from 'path';
import Logger from '../Logger';
import {
  getChainCurrency,
  getVersion,
  mapToObject,
  saneStringify,
  splitPairId,
  stringify,
} from '../Utils';
import { SwapType, SwapUpdateEvent, SwapVersion } from '../consts/Enums';
import ReferralStats from '../data/ReferralStats';
import ChannelCreationRepository from '../db/repositories/ChannelCreationRepository';
import ReverseSwapRepository from '../db/repositories/ReverseSwapRepository';
import SwapRepository from '../db/repositories/SwapRepository';
import LndClient from '../lightning/LndClient';
import ClnClient from '../lightning/cln/ClnClient';
import CountryCodes from '../service/CountryCodes';
import ServiceErrors from '../service/Errors';
import { SwapUpdate } from '../service/EventHandler';
import NodeInfo from '../service/NodeInfo';
import Service from '../service/Service';
import SwapNursery from '../swap/SwapNursery';
import Bouncer from './Bouncer';
import {
  checkPreimageHashLength,
  createdResponse,
  errorResponse,
  markSwap,
  successResponse,
  validateRequest,
} from './Utils';

class Controller {
  // TODO: refactor
  // A map between the ids and statuses of the swaps
  public pendingSwapInfos = new Map<string, SwapUpdate>();

  // A map between the ids and HTTP streams of all pending swaps
  private pendingSwapStreams = new Map<string, Response>();

  constructor(
    private readonly logger: Logger,
    private readonly service: Service,
    private readonly countryCodes: CountryCodes,
  ) {
    this.service.eventHandler.on('swap.update', ({ id, status }) => {
      this.logger.debug(`Swap ${id} update: ${saneStringify(status)}`);
      this.pendingSwapInfos.set(id, status);

      const response = this.pendingSwapStreams.get(id);

      if (response) {
        this.writeToSse(response, status);
      }
    });
  }

  public init = async (): Promise<void> => {
    this.logger.verbose('Fetching swaps status from database');

    // Get the latest status of all swaps in the database
    const [swaps, reverseSwaps] = await Promise.all([
      SwapRepository.getSwaps(),
      ReverseSwapRepository.getReverseSwaps(),
    ]);

    for (const swap of swaps) {
      const status = swap.status;

      switch (status) {
        case SwapUpdateEvent.ChannelCreated: {
          const channelCreation =
            await ChannelCreationRepository.getChannelCreation({
              swapId: swap.id,
            });

          this.pendingSwapInfos.set(swap.id, {
            status,
            channel: {
              fundingTransactionId: channelCreation!.fundingTransactionId!,
              fundingTransactionVout: channelCreation!.fundingTransactionVout!,
            },
          });

          break;
        }

        case SwapUpdateEvent.TransactionZeroConfRejected:
          this.pendingSwapInfos.set(swap.id, {
            status: SwapUpdateEvent.TransactionMempool,
            zeroConfRejected: true,
          });
          break;

        default:
          this.pendingSwapInfos.set(swap.id, {
            status: swap.status as SwapUpdateEvent,
            failureReason:
              swap.failureReason !== null ? swap.failureReason : undefined,
          });
          break;
      }
    }

    for (const reverseSwap of reverseSwaps) {
      const status = reverseSwap.status;

      switch (status) {
        case SwapUpdateEvent.TransactionMempool:
        case SwapUpdateEvent.TransactionConfirmed: {
          const { base, quote } = splitPairId(reverseSwap.pair);
          const chainCurrency = getChainCurrency(
            base,
            quote,
            reverseSwap.orderSide,
            true,
          );

          try {
            const transactionHex = await this.service.getTransaction(
              chainCurrency,
              reverseSwap.transactionId!,
            );

            this.pendingSwapInfos.set(reverseSwap.id, {
              status,
              transaction: {
                hex: transactionHex,
                id: reverseSwap.transactionId!,
                eta:
                  status === SwapUpdateEvent.TransactionMempool
                    ? SwapNursery.reverseSwapMempoolEta
                    : undefined,
              },
            });
          } catch (error) {
            // If the transaction can't be queried with the service it's either a transaction on the Ethereum network,
            // or something is terribly wrong
            if (
              (error as any).message !==
              ServiceErrors.NOT_SUPPORTED_BY_SYMBOL(chainCurrency).message
            ) {
              throw error;
            }

            this.pendingSwapInfos.set(reverseSwap.id, {
              status,
              transaction: {
                id: reverseSwap.transactionId!,
              },
            });
          }

          break;
        }

        default:
          this.pendingSwapInfos.set(reverseSwap.id, {
            status: status as SwapUpdateEvent,
          });
          break;
      }
    }
  };

  // Static files
  public serveFile = (fileName: string) => {
    return (_: Request, res: Response): void => {
      res.sendFile(path.join(__dirname, 'static', fileName));
    };
  };

  // GET requests
  public version = (_: Request, res: Response): void => {
    successResponse(res, {
      version: getVersion(),
    });
  };

  public getPairs = (_: Request, res: Response): void => {
    const data = this.service.getPairs();

    successResponse(res, {
      info: data.info,
      warnings: data.warnings,
      pairs: mapToObject(data.pairs),
    });
  };

  public getNodes = (_: Request, res: Response): void => {
    const result = Object.fromEntries(
      Array.from(this.service.getNodes().entries()).map(
        ([symbol, nodeInfo]) => {
          return [
            symbol,
            nodeInfo.get(LndClient.serviceName) ||
              nodeInfo.get(ClnClient.serviceName),
          ];
        },
      ),
    );

    successResponse(res, {
      nodes: result,
    });
  };

  public getNodeStats = (_: Request, res: Response): void => {
    const stats = this.service.getNodeStats();

    successResponse(res, {
      nodes: Object.fromEntries(
        Array.from(stats).map(([symbol, stats]) => {
          return [symbol, stats.get(NodeInfo.totalStats)];
        }),
      ),
    });
  };

  public getTimeouts = async (_: Request, res: Response): Promise<void> => {
    const timeouts = this.service.getTimeouts();

    successResponse(res, {
      timeouts: mapToObject(timeouts),
    });
  };

  public getContracts = async (req: Request, res: Response): Promise<void> => {
    try {
      const contracts = await this.service.getContracts();

      const response: Record<string, any> = {};
      for (const [network, networkContracts] of Object.entries(contracts)) {
        response[network] = {
          network: networkContracts.network,
          swapContracts: mapToObject(networkContracts.swapContracts),
          tokens: mapToObject(networkContracts.tokens),
        };
      }

      successResponse(res, response);
    } catch (error) {
      errorResponse(this.logger, req, res, error, 501);
    }
  };

  public getFeeEstimation = async (
    _: Request,
    res: Response,
  ): Promise<void> => {
    const feeEstimation = await this.service.getFeeEstimation();

    successResponse(res, mapToObject(feeEstimation));
  };

  // POST requests
  public routingHints = async (req: Request, res: Response): Promise<void> => {
    try {
      const { symbol, routingNode } = validateRequest(req.body, [
        { name: 'symbol', type: 'string' },
        { name: 'routingNode', type: 'string' },
      ]);

      const routingHints = await this.service.getRoutingHints(
        symbol,
        routingNode,
      );

      successResponse(res, {
        routingHints,
      });
    } catch (error) {
      errorResponse(this.logger, req, res, error);
    }
  };

  public swapStatus = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = validateRequest(req.body, [
        { name: 'id', type: 'string' },
      ]);

      const response = this.pendingSwapInfos.get(id);

      if (response) {
        successResponse(res, response);
      } else {
        errorResponse(
          this.logger,
          req,
          res,
          `could not find swap with id: ${id}`,
          404,
        );
      }
    } catch (error) {
      errorResponse(this.logger, req, res, error);
    }
  };

  public swapRates = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = validateRequest(req.body, [
        { name: 'id', type: 'string' },
      ]);

      const response = await this.service.getSwapRates(id);
      successResponse(res, response);
    } catch (error) {
      errorResponse(this.logger, req, res, error);
    }
  };

  public getTransaction = async (
    req: Request,
    res: Response,
  ): Promise<void> => {
    try {
      const { currency, transactionId } = validateRequest(req.body, [
        { name: 'currency', type: 'string' },
        { name: 'transactionId', type: 'string' },
      ]);

      const response = await this.service.getTransaction(
        currency,
        transactionId,
      );
      successResponse(res, { transactionHex: response });
    } catch (error) {
      errorResponse(this.logger, req, res, error);
    }
  };

  public getSwapTransaction = async (
    req: Request,
    res: Response,
  ): Promise<void> => {
    try {
      const { id } = validateRequest(req.body, [
        { name: 'id', type: 'string' },
      ]);

      const response = await this.service.getSwapTransaction(id);
      successResponse(res, response);
    } catch (error) {
      errorResponse(this.logger, req, res, error);
    }
  };

  public broadcastTransaction = async (
    req: Request,
    res: Response,
  ): Promise<void> => {
    try {
      const { currency, transactionHex } = validateRequest(req.body, [
        { name: 'currency', type: 'string' },
        { name: 'transactionHex', type: 'string' },
      ]);

      const response = await this.service.broadcastTransaction(
        currency,
        transactionHex,
      );
      successResponse(res, { transactionId: response });
    } catch (error) {
      errorResponse(this.logger, req, res, error);
    }
  };

  public createSwap = async (req: Request, res: Response): Promise<void> => {
    try {
      const { type } = validateRequest(req.body, [
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
      errorResponse(this.logger, req, res, error);
    }
  };

  private createSubmarineSwap = async (req: Request, res: Response) => {
    const {
      pairId,
      channel,
      invoice,
      pairHash,
      orderSide,
      referralId,
      preimageHash,
      refundPublicKey,
    } = validateRequest(req.body, [
      { name: 'pairId', type: 'string' },
      { name: 'orderSide', type: 'string' },
      { name: 'channel', type: 'object', optional: true },
      { name: 'invoice', type: 'string', optional: true },
      { name: 'pairHash', type: 'string', optional: true },
      { name: 'referralId', type: 'string', optional: true },
      { name: 'refundPublicKey', type: 'string', hex: true, optional: true },
      { name: 'preimageHash', type: 'string', hex: true, optional: true },
    ]);

    if (channel !== undefined) {
      validateRequest(channel, [
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
        pairHash,
        referralId,
        channel,
      );
    } else {
      // Check that the preimage hash was set
      validateRequest(req.body, [
        { name: 'preimageHash', type: 'string', hex: true },
      ]);

      checkPreimageHashLength(preimageHash);

      response = await this.service.createSwap({
        pairId,
        channel,
        orderSide,
        referralId,
        preimageHash,
        refundPublicKey,
        version: SwapVersion.Legacy,
      });
    }

    await markSwap(this.countryCodes, req.ip, response.id);

    this.logger.verbose(`Created new Swap with id: ${response.id}`);
    this.logger.silly(`Swap ${response.id}: ${stringify(response)}`);

    delete response.canBeRouted;

    createdResponse(res, response);
  };

  private createReverseSubmarineSwap = async (req: Request, res: Response) => {
    const {
      pairId,
      address,
      pairHash,
      orderSide,
      referralId,
      routingNode,
      claimAddress,
      preimageHash,
      invoiceAmount,
      onchainAmount,
      claimPublicKey,
      prepayMinerFee,
    } = validateRequest(req.body, [
      { name: 'pairId', type: 'string' },
      { name: 'orderSide', type: 'string' },
      { name: 'address', type: 'string', optional: true },
      { name: 'preimageHash', type: 'string', hex: true },
      { name: 'pairHash', type: 'string', optional: true },
      { name: 'referralId', type: 'string', optional: true },
      { name: 'routingNode', type: 'string', optional: true },
      { name: 'claimAddress', type: 'string', optional: true },
      { name: 'invoiceAmount', type: 'number', optional: true },
      { name: 'onchainAmount', type: 'number', optional: true },
      { name: 'prepayMinerFee', type: 'boolean', optional: true },
      { name: 'claimPublicKey', type: 'string', hex: true, optional: true },
    ]);

    checkPreimageHashLength(preimageHash);

    const response = await this.service.createReverseSwap({
      pairId,
      pairHash,
      orderSide,
      referralId,
      routingNode,
      claimAddress,
      preimageHash,
      invoiceAmount,
      onchainAmount,
      claimPublicKey,
      prepayMinerFee,
      userAddress: address,
      version: SwapVersion.Legacy,
    });

    await markSwap(this.countryCodes, req.ip, response.id);

    this.logger.verbose(`Created Reverse Swap with id: ${response.id}`);
    this.logger.silly(`Reverse swap ${response.id}: ${stringify(response)}`);

    createdResponse(res, response);
  };

  public setInvoice = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id, invoice, pairHash } = validateRequest(req.body, [
        { name: 'id', type: 'string' },
        { name: 'invoice', type: 'string' },
        { name: 'pairHash', type: 'string', optional: true },
      ]);

      const response = await this.service.setInvoice(
        id,
        invoice.toLowerCase(),
        pairHash,
      );
      successResponse(res, response);
    } catch (error) {
      errorResponse(this.logger, req, res, error);
    }
  };

  public queryReferrals = async (
    req: Request,
    res: Response,
  ): Promise<void> => {
    try {
      const referral = await Bouncer.validateRequestAuthentication(req);
      const stats = await ReferralStats.getReferralFees(referral.id);

      successResponse(res, stats);
    } catch (error) {
      errorResponse(this.logger, req, res, error, 401);
    }
  };

  // EventSource streams
  public streamSwapStatus = (req: Request, res: Response): void => {
    try {
      const { id } = validateRequest(req.query, [
        { name: 'id', type: 'string' },
      ]);

      res.writeHead(200, {
        Connection: 'keep-alive',
        'X-Accel-Buffering': 'no',
        'Cache-Control': 'no-cache',
        'Content-Type': 'text/event-stream',
      });

      res.setTimeout(0);

      const lastUpdate = this.pendingSwapInfos.get(id);
      if (lastUpdate) {
        this.writeToSse(res, lastUpdate);
      }

      this.pendingSwapStreams.set(id, res);

      res.on('close', () => {
        this.pendingSwapStreams.delete(id);
      });
    } catch (error) {
      errorResponse(this.logger, req, res, error);
    }
  };

  private parseSwapType = (type: string) => {
    const lowerCaseType = type.toLowerCase();

    for (const swapType in SwapType) {
      if (lowerCaseType === SwapType[swapType]) {
        return lowerCaseType as SwapType;
      }
    }

    throw `could not find swap type: ${type}`;
  };

  private writeToSse = (res: Response, message: SwapUpdate) => {
    res.write(`data: ${JSON.stringify(message)}\n\n`);
  };
}

export default Controller;
