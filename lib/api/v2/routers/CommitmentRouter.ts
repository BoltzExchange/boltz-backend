import type { Request, Response } from 'express';
import { Router } from 'express';
import type Logger from '../../../Logger';
import type Service from '../../../service/Service';
import type EthereumManager from '../../../wallet/ethereum/EthereumManager';
import Errors from '../../Errors';
import { createdResponse, successResponse, validateRequest } from '../../Utils';
import RouterBase from './RouterBase';

class CommitmentRouter extends RouterBase {
  constructor(
    logger: Logger,
    private readonly service: Service,
  ) {
    super(logger, 'commitment');
  }

  public getRouter = () => {
    const router = Router();

    /**
     * @openapi
     * tags:
     *   name: Commitment
     *   description: Commitment swap related endpoints
     */

    /**
     * @openapi
     * components:
     *   schemas:
     *     CommitmentLockupDetails:
     *       type: object
     *       required: ["contract", "claimAddress", "timelock"]
     *       properties:
     *         contract:
     *           type: string
     *           description: Address of the swap contract to lock funds in
     *         claimAddress:
     *           type: string
     *           description: Address that will claim the locked funds
     *         timelock:
     *           type: number
     *           description: Block height until which the funds should be locked
     */

    /**
     * @openapi
     * /commitment/{currency}/details:
     *   get:
     *     tags: [Commitment]
     *     description: Get lockup details for commitment swaps on an EVM chain
     *     parameters:
     *       - in: path
     *         name: currency
     *         required: true
     *         schema:
     *           type: string
     *         description: Currency of the chain to get lockup details for
     *     responses:
     *       '200':
     *         description: Lockup details for commitment swaps
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/CommitmentLockupDetails'
     *             examples:
     *               json:
     *                 value: '{"contract":"0x5FbDB2315678afecb367f032d93F642f64180aa3","claimAddress":"0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266","timelock":20160}'
     *       '400':
     *         description: Error that caused the request to fail
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/ErrorResponse'
     */
    router.get('/:currency/details', this.handleError(this.getDetails));

    /**
     * @openapi
     * /commitment/{currency}:
     *   post:
     *     tags: [Commitment]
     *     description: Submit a commitment for a swap
     *     parameters:
     *       - in: path
     *         name: currency
     *         required: true
     *         schema:
     *           type: string
     *         description: Currency of the commitment
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required: ["swapId", "signature", "transactionHash"]
     *             properties:
     *               swapId:
     *                 type: string
     *                 description: ID of the swap
     *               signature:
     *                 type: string
     *                 description: Signature authorizing the claim
     *               transactionHash:
     *                 type: string
     *                 description: Transaction hash of the lockup transaction
     *               logIndex:
     *                 type: number
     *                 description: Log index of the lockup event if there are multiple in the transaction
     *     responses:
     *       '201':
     *         description: Commitment created successfully
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *       '400':
     *         description: Error that caused the request to fail
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/ErrorResponse'
     */
    router.post('/:currency', this.handleError(this.postCommitment));

    return router;
  };

  private getDetails = async (req: Request, res: Response) => {
    const { currency } = validateRequest(req.params, [
      { name: 'currency', type: 'string' },
    ]);

    const manager = this.getManager(currency);
    const details = await manager.commitments.lockupDetails(currency);
    successResponse(res, details);
  };

  private postCommitment = async (req: Request, res: Response) => {
    const { currency } = validateRequest(req.params, [
      { name: 'currency', type: 'string' },
    ]);
    const { swapId, signature, transactionHash, logIndex } = validateRequest(
      req.body,
      [
        { name: 'swapId', type: 'string' },
        { name: 'signature', type: 'string' },
        { name: 'transactionHash', type: 'string' },
        { name: 'logIndex', type: 'number', optional: true },
      ],
    );

    if (logIndex !== undefined && logIndex < 0) {
      throw Errors.INVALID_PARAMETER('logIndex');
    }

    const manager = this.getManager(currency);
    await manager.commitments.commit(
      currency,
      swapId,
      signature,
      transactionHash,
      logIndex,
    );
    createdResponse(res, {});
  };

  private getManager = (currency: string): EthereumManager => {
    const manager = this.service.walletManager.ethereumManagers.find(
      (manager) => manager.hasSymbol(currency),
    );

    if (manager === undefined) {
      throw new Error('currency does not support commitment swaps');
    }

    return manager;
  };
}

export default CommitmentRouter;
