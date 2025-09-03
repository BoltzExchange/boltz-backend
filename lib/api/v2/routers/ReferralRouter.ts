import type { Request, Response } from 'express';
import { Router } from 'express';
import type Logger from '../../../Logger';
import ReferralStats from '../../../data/ReferralStats';
import Stats from '../../../data/Stats';
import type Referral from '../../../db/models/Referral';
import ExtraFeeRepository from '../../../db/repositories/ExtraFeeRepository';
import Bouncer from '../../Bouncer';
import { errorResponse, successResponse } from '../../Utils';
import RouterBase from './RouterBase';

class ReferralRouter extends RouterBase {
  constructor(logger: Logger) {
    super(logger, 'referral');
  }

  public getRouter = () => {
    const router = Router();

    /**
     * @openapi
     * tags:
     *   name: Referral
     *   description: Referral related endpoints
     */

    /**
     * @openapi
     * /referral:
     *   get:
     *     description: Referral ID for the used API keys
     *     tags: [Referral]
     *     parameters:
     *       - in: header
     *         name: TS
     *         required: true
     *         schema:
     *           type: string
     *         description: Current UNIX timestamp when the request is sent
     *       - in: header
     *         name: API-KEY
     *         required: true
     *         schema:
     *           type: string
     *         description: Your API key
     *       - in: header
     *         name: API-HMAC
     *         required: true
     *         schema:
     *           type: string
     *         description: HMAC-SHA256 with your API-Secret as key of the TS + HTTP method (all uppercase) + the HTTP path
     *     responses:
     *       '200':
     *         description: The referral ID for your API-KEY to be used when creating Swaps
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               required: ["id"]
     *               properties:
     *                 id:
     *                   type: string
     *                   description: The referral ID for your API-KEY
     *       '401':
     *         description: Unauthorized in case of an unknown API-KEY or bad HMAC
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/ErrorResponse'
     */
    router.get('/', this.handleError(this.getName));

    /**
     * @openapi
     * /referral/fees:
     *   get:
     *     description: Referral fees collected for an ID
     *     tags: [Referral]
     *     parameters:
     *       - in: header
     *         name: TS
     *         required: true
     *         schema:
     *           type: string
     *         description: Current UNIX timestamp when the request is sent
     *       - in: header
     *         name: API-KEY
     *         required: true
     *         schema:
     *           type: string
     *         description: Your API key
     *       - in: header
     *         name: API-HMAC
     *         required: true
     *         schema:
     *           type: string
     *         description: HMAC-SHA256 with your API-Secret as key of the TS + HTTP method (all uppercase) + the HTTP path
     *     responses:
     *       '200':
     *         description: Referral fees collected per currency grouped by year and month
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               description: Year
     *               additionalProperties:
     *                 type: object
     *                 description: Month
     *                 additionalProperties:
     *                   type: object
     *                   description: Fees collected in that month
     *                   additionalProperties:
     *                     type: string
     *                     description: Fees collected in that currency in satoshis
     *             examples:
     *               json:
     *                 value: '{"2024":{"1":{"BTC":307}}}'
     *       '401':
     *         description: Unauthorized in case of an unknown API-KEY or bad HMAC
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/ErrorResponse'
     */
    router.get('/fees', this.handleError(this.getFees));

    /**
     * @openapi
     * /referral/stats:
     *   get:
     *     description: Statistics for Swaps created with a referral ID
     *     tags: [Referral]
     *     parameters:
     *       - in: header
     *         name: TS
     *         required: true
     *         schema:
     *           type: string
     *         description: Current UNIX timestamp when the request is sent
     *       - in: header
     *         name: API-KEY
     *         required: true
     *         schema:
     *           type: string
     *         description: Your API key
     *       - in: header
     *         name: API-HMAC
     *         required: true
     *         schema:
     *           type: string
     *         description: HMAC-SHA256 with your API-Secret as key of the TS + HTTP method (all uppercase) + the HTTP path
     *     responses:
     *       '200':
     *         description: Swap statistics
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               description: Year
     *               additionalProperties:
     *                 type: object
     *                 description: Month
     *                 additionalProperties:
     *                   type: object
     *                   description: Swap statistics for that month
     *                   properties:
     *                     volume:
     *                       type: object
     *                       description: Swap volume
     *                       properties:
     *                         total:
     *                           type: string
     *                           description: Volume across all pairs in BTC
     *                       additionalProperties:
     *                         type: string
     *                         description: Volume in that pair in BTC
     *                     trades:
     *                       type: object
     *                       description: Swap counts
     *                       properties:
     *                         total:
     *                           type: integer
     *                           description: Swap count across all pairs
     *                       additionalProperties:
     *                         type: integer
     *                         description: Swap count for that pair
     *                     failureRates:
     *                       type: object
     *                       description: Swap failure rates for each type
     *                       properties:
     *                         submarine:
     *                           type: number
     *                           description: Submarine Swap failure rate
     *                         reverse:
     *                           type: number
     *                           description: Reverse Swap failure rate
     *                         chain:
     *                           type: number
     *                           description: Chain Swap failure rate
     *                     groups:
     *                       type: object
     *                       description: Stats grouped by extra fee identifier
     *                       additionalProperties:
     *                         type: object
     *                         description: Stats for a specific group
     *                         properties:
     *                           volume:
     *                             type: object
     *                             description: Swap volume for the group
     *                             properties:
     *                               total:
     *                                 type: string
     *                                 description: Volume across all pairs in BTC for the group
     *                             additionalProperties:
     *                               type: string
     *                               description: Volume in that pair in BTC for the group
     *                           trades:
     *                             type: object
     *                             description: Swap counts for the group
     *                             properties:
     *                               total:
     *                                 type: integer
     *                                 description: Swap count across all pairs for the group
     *                             additionalProperties:
     *                               type: integer
     *                               description: Swap count for that pair for the group
     *                           failureRates:
     *                             type: object
     *                             description: Failure rates for the group by swap type
     *                             properties:
     *                               submarine:
     *                                 type: number
     *                                 description: Submarine Swap failure rate for the group
     *                               reverse:
     *                                 type: number
     *                                 description: Reverse Swap failure rate for the group
     *                               chain:
     *                                 type: number
     *                                 description: Chain Swap failure rate for the group
     *             examples:
     *               json:
     *                 value: '{"2024":{"1":{"volume":{"total":"0.00321844","L-BTC/BTC":"0.00321844"},"trades":{"total":3,"L-BTC/BTC":3},"failureRates":{"submarine": 0.12, "reverse":0, "chain":0}}}}'
     *       '401':
     *         description: Unauthorized in case of an unknown API-KEY or bad HMAC
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/ErrorResponse'
     */
    router.get('/stats', this.handleError(this.getStats));

    /**
     * @openapi
     * /referral/stats/extra:
     *   get:
     *     description: Extra fees collected for swaps created with a referral ID
     *     tags: [Referral]
     *     parameters:
     *       - in: header
     *         name: TS
     *         required: true
     *         schema:
     *           type: string
     *         description: Current UNIX timestamp when the request is sent
     *       - in: header
     *         name: API-KEY
     *         required: true
     *         schema:
     *           type: string
     *         description: Your API key
     *       - in: header
     *         name: API-HMAC
     *         required: true
     *         schema:
     *           type: string
     *         description: HMAC-SHA256 with your API-Secret as key of the TS + HTTP method (all uppercase) + the HTTP path
     *     responses:
     *       '200':
     *         description: Extra fees collected by extra id grouped by year and month
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               description: Year
     *               additionalProperties:
     *                 type: object
     *                 description: Month
     *                 additionalProperties:
     *                   type: object
     *                   description: Extra fees collected in that month
     *                   additionalProperties:
     *                     type: integer
     *                     format: uint64
     *                     description: Total extra fees collected grouped by identifier
     *             examples:
     *               json:
     *                 value: '{"2024":{"1":{"swap123":1000,"swap456":2500},"2":{"swap789":1500}}}'
     *       '401':
     *         description: Unauthorized in case of an unknown API-KEY or bad HMAC
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/ErrorResponse'
     */
    router.get('/stats/extra', this.handleError(this.getExtraFees));

    return router;
  };

  private getName = async (req: Request, res: Response) => {
    const referral = await this.checkAuthentication(req, res);
    if (referral === undefined) {
      return;
    }

    successResponse(res, { id: referral.id });
  };

  private getFees = async (req: Request, res: Response) => {
    const referral = await this.checkAuthentication(req, res);
    if (referral === undefined) {
      return;
    }

    successResponse(res, await ReferralStats.getReferralFees(referral.id));
  };

  private getStats = async (req: Request, res: Response) => {
    const referral = await this.checkAuthentication(req, res);
    if (referral === undefined) {
      return;
    }

    const [stats, extraStats] = await Promise.all([
      Stats.generate(0, 0, referral.id),
      ExtraFeeRepository.getStatsByReferral(referral.id),
    ]);

    successResponse(res, ExtraFeeRepository.mergeStats(stats, extraStats));
  };

  private getExtraFees = async (req: Request, res: Response) => {
    const referral = await this.checkAuthentication(req, res);
    if (referral === undefined) {
      return;
    }

    successResponse(
      res,
      await ExtraFeeRepository.getFeesByReferral(referral.id),
    );
  };

  private checkAuthentication = async (
    req: Request,
    res: Response,
  ): Promise<Referral | undefined> => {
    try {
      return await Bouncer.validateRequestAuthentication(req);
    } catch (e) {
      errorResponse(this.logger, req, res, e, 401);
    }

    return;
  };
}

export default ReferralRouter;
