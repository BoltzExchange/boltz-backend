import { Request, Response, Router } from 'express';
import Logger from '../../../Logger';
import { mapToObject } from '../../../Utils';
import Service from '../../../service/Service';
import { createdResponse, successResponse, validateRequest } from '../../Utils';
import RouterBase from './RouterBase';

class ChainRouter extends RouterBase {
  constructor(
    logger: Logger,
    private readonly service: Service,
  ) {
    super(logger, 'chain');
  }

  public getRouter = () => {
    const router = Router();

    /**
     * @openapi
     * tags:
     *   name: Chain
     *   description: Onchain data related endpoints
     */

    /**
     * @openapi
     * /chain/fees:
     *   get:
     *     description: Fee estimations for all supported chains
     *     tags: [Chain]
     *     responses:
     *       '200':
     *         description: Object of currency of chain -> fee estimation
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               additionalProperties:
     *                 type: number
     *                 description: Fee estimation in sat/vbyte or GWEI
     */
    router.get('/fees', this.handleError(this.getFees));

    /**
     * @openapi
     * /chain/{currency}/fee:
     *   get:
     *     description: Fee estimations for a chain
     *     tags: [Chain]
     *     parameters:
     *       - in: path
     *         name: currency
     *         required: true
     *         schema:
     *           type: string
     *         description: Currency of the chain to get a fee estimation for
     *     responses:
     *       '200':
     *         description: Object containing the fee estimation
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 fee:
     *                   type: number
     *                   description: Fee estimation in sat/vbyte or GWEI
     */
    router.get('/:currency/fee', this.handleError(this.getFeeForChain));

    /**
     * @openapi
     * /chain/{currency}/transaction/{id}:
     *   get:
     *     tags: [Chain]
     *     description: Fetch a raw transaction by its id
     *     parameters:
     *       - in: path
     *         name: currency
     *         required: true
     *         schema:
     *           type: string
     *         description: Currency of the chain to query for
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *         description: Id of the transaction to query
     *     responses:
     *       '200':
     *         description: Raw transaction
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 hex:
     *                   type: string
     *                   description: The transaction encoded as HEX
     *       '400':
     *         description: Error that caused the query for the transaction to fail
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/ErrorResponse'
     */
    router.get(
      '/:currency/transaction/:id',
      this.handleError(this.getTransaction),
    );

    /**
     * @openapi
     * /chain/{currency}/transaction:
     *   post:
     *     tags: [Chain]
     *     description: Broadcast a transaction
     *     parameters:
     *       - in: path
     *         name: currency
     *         schema:
     *           type: string
     *         description: Currency of the chain to broadcast on
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               hex:
     *                 type: string
     *                 description: The transaction to broadcast as raw HEX
     *     responses:
     *       '200':
     *         description: Id of the broadcast transaction
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 id:
     *                   type: string
     *                   description: Id of the broadcast transaction
     *       '400':
     *         description: Error that caused the broadcast of the transaction to fail
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/ErrorResponse'
     */
    router.post(
      '/:currency/transaction',
      this.handleError(this.postTransaction),
    );

    return router;
  };

  private getFees = async (_: Request, res: Response) =>
    successResponse(res, mapToObject(await this.service.getFeeEstimation()));

  private getFeeForChain = async (req: Request, res: Response) => {
    const currency = this.getCurrencyFromPath(req);
    successResponse(res, {
      fee: (await this.service.getFeeEstimation(currency)).get(currency),
    });
  };

  private getTransaction = async (req: Request, res: Response) => {
    const currency = this.getCurrencyFromPath(req);
    const { id } = validateRequest(req.params, [
      { name: 'id', type: 'string' },
    ]);

    const tx = await this.service.getTransaction(currency, id);
    successResponse(res, { hex: tx });
  };

  private postTransaction = async (req: Request, res: Response) => {
    const currency = this.getCurrencyFromPath(req);
    const { hex } = validateRequest(req.body, [
      { name: 'hex', type: 'string' },
    ]);

    const id = await this.service.broadcastTransaction(currency, hex);
    createdResponse(res, { id });
  };

  private getCurrencyFromPath = (req: Request): string =>
    validateRequest(req.params, [{ name: 'currency', type: 'string' }])
      .currency;
}

export default ChainRouter;
