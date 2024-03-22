import { Request, Response } from 'express';
import path from 'path';
import Logger from '../Logger';
import { getVersion, mapToObject, saneStringify, stringify } from '../Utils';
import { SwapType, SwapVersion, swapTypeToString } from '../consts/Enums';
import ReferralStats from '../data/ReferralStats';
import LndClient from '../lightning/LndClient';
import ClnClient from '../lightning/cln/ClnClient';
import CountryCodes from '../service/CountryCodes';
import { SwapUpdate } from '../service/EventHandler';
import NodeInfo from '../service/NodeInfo';
import Service from '../service/Service';
import Bouncer from './Bouncer';
import SwapInfos from './SwapInfos';
import {
  checkPreimageHashLength,
  createdResponse,
  errorResponse,
  markSwap,
  successResponse,
  validateRequest,
} from './Utils';

class Controller {
  // A map between the ids and HTTP streams of all pending swaps
  private pendingSwapStreams = new Map<string, Response>();

  constructor(
    private readonly logger: Logger,
    private readonly service: Service,
    private readonly countryCodes: CountryCodes,
    private readonly swapInfos: SwapInfos,
  ) {
    this.service.eventHandler.on('swap.update', ({ id, status }) => {
      this.logger.debug(`Swap ${id} update: ${saneStringify(status)}`);
      this.swapInfos.set(id, status);

      const response = this.pendingSwapStreams.get(id);

      if (response) {
        this.writeToSse(response, status);
      }
    });
  }

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

      const response = this.swapInfos.get(id);

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

        default:
          errorResponse(this.logger, req, res, 'invalid swap type');
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
      addressSignature,
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
      { name: 'claimPublicKey', type: 'string', hex: true, optional: true },
      { name: 'addressSignature', type: 'string', hex: true, optional: true },
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
      userAddress: address,
      version: SwapVersion.Legacy,
      userAddressSignature: addressSignature,
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

      const lastUpdate = this.swapInfos.get(id);
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

    for (const swapType of Object.keys(SwapType).filter((v: any) => isNaN(v))) {
      if (lowerCaseType === swapTypeToString(SwapType[swapType])) {
        return SwapType[swapType];
      }
    }

    throw `could not find swap type: ${type}`;
  };

  private writeToSse = (res: Response, message: SwapUpdate) => {
    res.write(`data: ${JSON.stringify(message)}\n\n`);
  };
}

export default Controller;
