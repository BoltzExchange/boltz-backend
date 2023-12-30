import { Request, Response, Router } from 'express';
import Logger from '../../../Logger';
import RouterBase from './RouterBase';
import { stringify } from '../../../Utils';
import Service from '../../../service/Service';
import {
  checkPreimageHashLength,
  createdResponse,
  validateRequest,
} from '../../Utils';
import { SwapVersion } from '../../../consts/Enums';

class SwapRouter extends RouterBase {
  constructor(
    logger: Logger,
    private readonly service: Service,
  ) {
    super(logger, 'swap');
  }

  public getRouter = () => {
    /**
     * @openapi
     * tags:
     *   name: Swap
     *   description: Swap related endpoints
     */

    const router = Router();

    /**
     * @openapi
     * components:
     *   schemas:
     *     SubmarineRequest:
     *       type: object
     *       properties:
     *         pairId:
     *           type: string
     *           required: true
     *         orderSide:
     *           type: string
     *           required: true
     *           enum:
     *             - buy
     *             - sell
     *         refundPublicKey:
     *           type: string
     *           required: true
     *         invoice:
     *           type: string
     *         preimageHash:
     *           type: string
     *         pairHash:
     *           type: string
     *         referralId:
     *           type: string
     */

    /**
     * @openapi
     * /swap/submarine:
     *   post:
     *     description: Create a new Submarine Swap from onchain to lightning
     *     tags: [Swap]
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/SubmarineRequest'
     *     responses:
     *       '200':
     *         description: The created Submarine Swap
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *       '400':
     *         description: Error that caused the Submarine Swap creation to fail
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/ErrorResponse'
     */
    router.post('/submarine', this.handleError(this.createSubmarine));

    return router;
  };

  private createSubmarine = async (req: Request, res: Response) => {
    const {
      pairId,
      invoice,
      pairHash,
      orderSide,
      referralId,
      preimageHash,
      refundPublicKey,
    } = validateRequest(req.body, [
      { name: 'pairId', type: 'string' },
      { name: 'orderSide', type: 'string' },
      { name: 'refundPublicKey', type: 'string', hex: true },
      { name: 'invoice', type: 'string', optional: true },
      { name: 'pairHash', type: 'string', optional: true },
      { name: 'referralId', type: 'string', optional: true },
      { name: 'preimageHash', type: 'string', hex: true, optional: true },
    ]);

    let response: any;

    if (invoice) {
      response = await this.service.createSwapWithInvoice(
        pairId,
        orderSide,
        refundPublicKey,
        invoice.toLowerCase(),
        pairHash,
        referralId,
        undefined,
        SwapVersion.Taproot,
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
        version: SwapVersion.Taproot,
      });
    }

    this.logger.verbose(`Created new Swap with id: ${response.id}`);
    this.logger.silly(`Swap ${response.id}: ${stringify(response)}`);

    delete response.canBeRouted;

    createdResponse(res, response);
  };
}

export default SwapRouter;
