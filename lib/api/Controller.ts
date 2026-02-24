import type { Request, Response } from 'express';
import path from 'path';
import { absolutePath as swaggerUiAbsolutePath } from 'swagger-ui-dist';
import type Logger from '../Logger';
import { getVersion, mapToObject, stringify } from '../Utils';
import { SwapType, SwapVersion, stringToSwapType } from '../consts/Enums';
import ReferralStats from '../data/ReferralStats';
import LndClient from '../lightning/LndClient';
import ClnClient from '../lightning/cln/ClnClient';
import NodeInfo from '../service/NodeInfo';
import type Service from '../service/Service';
import Bouncer from './Bouncer';
import type SwapInfos from './SwapInfos';
import {
  checkPreimageHashLength,
  createdResponse,
  errorResponse,
  markSwap,
  parseReferralId,
  successResponse,
  validateRequest,
} from './Utils';

const safePathJoin = (basePath: string, ...paths: string[]) => {
  const base = path.resolve(basePath);
  const joined = path.resolve(base, ...paths);

  const relative = path.relative(base, joined);
  const isOutsideBase =
    relative === '..' ||
    relative.startsWith(`..${path.sep}`) ||
    path.isAbsolute(relative);

  if (isOutsideBase) {
    throw new Error('invalid path');
  }

  return joined;
};

class Controller {
  constructor(
    private readonly logger: Logger,
    private readonly service: Service,
    private readonly swapInfos: SwapInfos,
  ) {}

  // Static files
  public serveFile = (fileName: string) => {
    return (req: Request, res: Response): void => {
      try {
        res.sendFile(safePathJoin(__dirname, 'static', fileName));
      } catch (error) {
        errorResponse(this.logger, req, res, error);
      }
    };
  };

  public serveSwaggerStaticFile = (fileName: string) => {
    return (req: Request, res: Response): void => {
      try {
        res.sendFile(safePathJoin(swaggerUiAbsolutePath(), fileName));
      } catch (error) {
        errorResponse(this.logger, req, res, error);
      }
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
          swapContracts: networkContracts.swapContracts,
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

      const response = await this.swapInfos.get(id);

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

      const data = await this.service.getTransaction(currency, transactionId);
      successResponse(res, { transactionHex: data.hex });
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

      const response =
        await this.service.transactionFetcher.getSubmarineTransaction(id);
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

      const swapType = stringToSwapType(type);

      switch (swapType) {
        case SwapType.Submarine:
          await this.createSubmarineSwap(req, res);
          break;

        case SwapType.ReverseSubmarine:
          await this.createReverseSubmarineSwap(req, res);
          break;

        default:
          errorResponse(this.logger, req, res, 'invalid swap type');
          break;
      }
    } catch (error) {
      errorResponse(this.logger, req, res, error);
    }
  };

  private createSubmarineSwap = async (req: Request, res: Response) => {
    const {
      pairId,
      invoice,
      pairHash,
      orderSide,
      preimageHash,
      refundPublicKey,
    } = validateRequest(req.body, [
      { name: 'pairId', type: 'string' },
      { name: 'orderSide', type: 'string' },
      { name: 'invoice', type: 'string', optional: true },
      { name: 'pairHash', type: 'string', optional: true },
      { name: 'refundPublicKey', type: 'string', hex: true, optional: true },
      { name: 'preimageHash', type: 'string', hex: true, optional: true },
    ]);
    const referralId = parseReferralId(req);

    let response: any;

    if (invoice) {
      response = await this.service.createSwapWithInvoice(
        pairId,
        orderSide,
        refundPublicKey,
        invoice.toLowerCase(),
        pairHash,
        referralId,
      );
    } else {
      // Check that the preimage hash was set
      validateRequest(req.body, [
        { name: 'preimageHash', type: 'string', hex: true },
      ]);

      checkPreimageHashLength(preimageHash);

      response = await this.service.createSwap({
        pairId,
        orderSide,
        referralId,
        preimageHash,
        refundPublicKey,
        version: SwapVersion.Legacy,
      });
    }

    await markSwap(this.service.sidecar, req.ip, response.id);

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
      { name: 'routingNode', type: 'string', optional: true },
      { name: 'claimAddress', type: 'string', optional: true },
      { name: 'invoiceAmount', type: 'number', optional: true },
      { name: 'onchainAmount', type: 'number', optional: true },
      { name: 'claimPublicKey', type: 'string', hex: true, optional: true },
      { name: 'addressSignature', type: 'string', hex: true, optional: true },
    ]);
    const referralId = parseReferralId(req);

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

    await markSwap(this.service.sidecar, req.ip, response.id);

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
}

export default Controller;
