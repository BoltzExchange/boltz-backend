import { Request, Response, Router } from 'express';
import Logger from '../../../Logger';
import Sidecar from '../../../sidecar/Sidecar';
import { createdResponse, validateRequest } from '../../Utils';
import RouterBase from './RouterBase';

class LightningRouter extends RouterBase {
  constructor(
    logger: Logger,
    private readonly sidecar: Sidecar,
  ) {
    super(logger, 'lightning');
  }

  public getRouter = () => {
    const router = Router();

    /**
     * @openapi
     * tags:
     *   name: Lightning
     *   description: Lightning related endpoints
     */

    /**
     * @openapi
     * /lightning/{currency}/bolt12/fetch:
     *   post:
     *     tags: [Lightning]
     *     description: Fetches an invoice for a BOLT12 offer
     *     parameters:
     *       - in: path
     *         name: currency
     *         required: true
     *         schema:
     *           type: string
     *         description: Currency of the lightning network to use
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required: ["offer", "amount"]
     *             properties:
     *               offer:
     *                 type: string
     *                 description: A BOLT12 offer
     *               amount:
     *                 type: number
     *                 description: Amount of the invoice that should be fetched in satoshis
     *     responses:
     *       '201':
     *         description: BOLT12 invoice fetched from the offer
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               required: ["invoice"]
     *               properties:
     *                 invoice:
     *                   type: string
     *                   description: A BOLT12 invoice
     *       '400':
     *         description: Error that caused the broadcast of the transaction to fail
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/ErrorResponse'
     */
    router.post('/:currency/bolt12/fetch', this.handleError(this.fetchBolt12));

    return router;
  };

  private fetchBolt12 = async (req: Request, res: Response) => {
    const currency = this.getCurrencyFromPath(req);
    const { offer, amount } = validateRequest(req.body, [
      {
        name: 'offer',
        type: 'string',
      },
      {
        name: 'amount',
        type: 'number',
      },
    ]);

    const invoice = await this.sidecar.fetchOffer(currency, offer, amount);
    createdResponse(res, { invoice });
  };

  private getCurrencyFromPath = (req: Request): string =>
    validateRequest(req.params, [{ name: 'currency', type: 'string' }])
      .currency;
}

export default LightningRouter;
