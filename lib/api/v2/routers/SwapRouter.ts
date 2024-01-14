import { Request, Response, Router } from 'express';
import Logger from '../../../Logger';
import { getHexString, stringify } from '../../../Utils';
import { SwapVersion } from '../../../consts/Enums';
import Service from '../../../service/Service';
import {
  checkPreimageHashLength,
  createdResponse,
  successResponse,
  validateRequest,
} from '../../Utils';
import RouterBase from './RouterBase';

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
     * components:
     *   schemas:
     *     SwapTreeLeaf:
     *       type: object
     *       properties:
     *         version:
     *           type: number
     *           description: Tapscript version
     *         output:
     *           type: string
     *           description: Script encoded as HEX
     */

    /**
     * @openapi
     * components:
     *   schemas:
     *     SwapTree:
     *       type: object
     *       properties:
     *         claimLeaf:
     *           $ref: '#/components/schemas/SwapTreeLeaf'
     *         refundLeaf:
     *           $ref: '#/components/schemas/SwapTreeLeaf'
     */

    const router = Router();

    /**
     * @openapi
     * tags:
     *   name: Submarine
     *   description: Submarine Swap related endpoints
     */

    /**
     * @openapi
     * components:
     *   schemas:
     *     SubmarineRequest:
     *       type: object
     *       properties:
     *         from:
     *           type: string
     *           required: true
     *           description: The asset that is sent onchain
     *         to:
     *           type: string
     *           required: true
     *           description: The asset that is received on lightning
     *         invoice:
     *           type: string
     *           required: true
     *           description: BOLT11 invoice that should be paid on lightning
     *         refundPublicKey:
     *           type: string
     *           required: true
     *           description: Public key with which the Submarine Swap can be refunded encoded as HEX
     *         pairHash:
     *           type: string
     *         referralId:
     *           type: string
     */

    /**
     * @openapi
     * components:
     *   schemas:
     *     SubmarineResponse:
     *       type: object
     *       properties:
     *         id:
     *           type: string
     *           description: ID of the created Submarine Swap
     *         bip21:
     *           type: string
     *           description: BIP21 for the onchain payment request
     *         address:
     *           type: string
     *           description: Onchain HTLC address
     *         swapTree:
     *           $ref: '#/components/schemas/SwapTree'
     *         claimPublicKey:
     *           type: string
     *           description: Public key of Boltz that will be used to sweep the onchain HTLC
     *         timeoutBlockHeight:
     *           type: number
     *           description: Timeout block height of the onchain HTLC
     *         acceptZeroConf:
     *           type: boolean
     *           description: Whether 0-conf will be accepted assuming the transaction does not signal RBF and has a reasonably high fee
     *         expectedAmount:
     *           type: number
     *           description: Amount that is expected to be sent to the onchain HTLC address in satoshis
     *         blindingKey:
     *           type: string
     *           description: Liquid blinding private key encoded as HEX
     */

    /**
     * @openapi
     * /swap/submarine:
     *   post:
     *     description: Create a new Submarine Swap from onchain to lightning
     *     tags: [Submarine]
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/SubmarineRequest'
     *     responses:
     *       '201':
     *         description: The created Submarine Swap
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/SubmarineResponse'
     *       '400':
     *         description: Error that caused the Submarine Swap creation to fail
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/ErrorResponse'
     */
    router.post('/submarine', this.handleError(this.createSubmarine));

    /**
     * @openapi
     * components:
     *   schemas:
     *     SubmarineRefundRequest:
     *       type: object
     *       properties:
     *         id:
     *           type: string
     *           required: true
     *           description: ID of the Submarine Swap that should be refunded
     *         pubNonce:
     *           type: string
     *           required: true
     *           description: Public nonce of the client for the session encoded as HEX
     *         transaction:
     *           type: string
     *           required: true
     *           description: Transaction which should be signed encoded as HEX
     *         index:
     *           type: number
     *           required: true
     *           description: Index of the input of the transaction that should be signed
     */

    /**
     * @openapi
     * components:
     *   schemas:
     *     PartialSignature:
     *       type: object
     *       properties:
     *         pubNonce:
     *           type: string
     *           description: Public nonce of Boltz encoded as HEX
     *         partialSignature:
     *           type: string
     *           description: Partial signature encoded as HEX
     */

    /**
     * @openapi
     * /swap/submarine/refund:
     *   post:
     *     description: Requests a partial signature for a cooperative Submarine Swap refund transaction
     *     tags: [Submarine]
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/SubmarineRefundRequest'
     *     responses:
     *       '200':
     *         description: A partial signature
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/PartialSignature'
     *       '400':
     *         description: Error that caused signature request to fail
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/ErrorResponse'
     */
    router.post('/submarine/refund', this.handleError(this.refundSubmarine));

    /**
     * @openapi
     * tags:
     *   name: Reverse
     *   description: Reverse Swap related endpoints
     */

    /**
     * @openapi
     * components:
     *   schemas:
     *     ReverseRequest:
     *       type: object
     *       properties:
     *         from:
     *           type: string
     *           required: true
     *           description: The asset that is sent on lightning
     *         to:
     *           type: string
     *           required: true
     *           description: The asset that is received onchain
     *         preimageHash:
     *           type: string
     *           required: true
     *           description: SHA-256 hash of the preimage of the Reverse Swap encoded as HEX
     *         claimPublicKey:
     *           type: string
     *           required: true
     *           description: Public key with which the Reverse Swap can be claimed encoded as HEX
     *         invoiceAmount:
     *           type: string
     *           description: Amount for which the invoice should be; conflicts with "onchainAmount"
     *         onchainAmount:
     *           type: string
     *           description: Amount that should be locked in the onchain HTLC; conflicts with "invoiceAmount"
     *         pairHash:
     *           type: string
     *         referralId:
     *           type: string
     */

    /**
     * @openapi
     * components:
     *   schemas:
     *     ReverseResponse:
     *       type: object
     *       properties:
     *         id:
     *           type: string
     *           description: ID of the created Reverse Swap
     *         invoice:
     *           type: string
     *           description: Hold invoice of the Reverse Swap
     *         swapTree:
     *           $ref: '#/components/schemas/SwapTree'
     *         lockupAddress:
     *           type: string
     *           description: HTLC address in which coins will be locked
     *         refundPublicKey:
     *           type: string
     *           description: Public key of Boltz that will be used to refund the onchain HTLC
     *         timeoutBlockHeight:
     *           type: number
     *           description: Timeout block height of the onchain HTLC
     *         onchainAmount:
     *           type: number
     *           description: Amount that will be locked in the onchain HTLC
     *         blindingKey:
     *           type: string
     *           description: Liquid blinding private key encoded as HEX
     */

    /**
     * @openapi
     * /swap/reverse:
     *   post:
     *     description: Create a new Reverse Swap from lightning to onchain
     *     tags: [Reverse]
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/ReverseRequest'
     *     responses:
     *       '201':
     *         description: The created Reverse Swap
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/ReverseResponse'
     *       '400':
     *         description: Error that caused the Reverse Swap creation to fail
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/ErrorResponse'
     */
    router.post('/reverse', this.handleError(this.createReverse));

    /**
     * @openapi
     * components:
     *   schemas:
     *     ReverseClaimRequest:
     *       type: object
     *       properties:
     *         id:
     *           type: string
     *           required: true
     *           description: ID of the Reverse Swap that should be refunded
     *         preimage:
     *           type: string
     *           required: true
     *           description: Preimage of the Reverse Swap encoded as HEX
     *         pubNonce:
     *           type: string
     *           required: true
     *           description: Public nonce of the client for the session encoded as HEX
     *         transaction:
     *           type: string
     *           required: true
     *           description: Transaction which should be signed encoded as HEX
     *         index:
     *           type: number
     *           required: true
     *           description: Index of the input of the transaction that should be signed
     */

    /**
     * @openapi
     * /swap/reverse/claim:
     *   post:
     *     description: Requests a partial signature for a cooperative Reverse Swap claim transaction
     *     tags: [Reverse]
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/ReverseClaimRequest'
     *     responses:
     *       '200':
     *         description: A partial signature
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/PartialSignature'
     *       '400':
     *         description: Error that caused signature request to fail
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/ErrorResponse'
     */
    router.post('/reverse/claim', this.handleError(this.claimReverse));

    return router;
  };

  private createSubmarine = async (req: Request, res: Response) => {
    const { to, from, invoice, pairHash, referralId, refundPublicKey } =
      validateRequest(req.body, [
        { name: 'to', type: 'string' },
        { name: 'from', type: 'string' },
        { name: 'invoice', type: 'string' },
        { name: 'refundPublicKey', type: 'string', hex: true },
        { name: 'pairHash', type: 'string', optional: true },
        { name: 'referralId', type: 'string', optional: true },
      ]);

    const { pairId, orderSide } = this.service.convertToPairAndSide(
      from,
      to,
      false,
    );

    const response = await this.service.createSwapWithInvoice(
      pairId,
      orderSide,
      refundPublicKey,
      invoice.toLowerCase(),
      pairHash,
      referralId,
      undefined,
      SwapVersion.Taproot,
    );

    this.logger.verbose(`Created new Swap with id: ${response.id}`);
    this.logger.silly(`Swap ${response.id}: ${stringify(response)}`);

    createdResponse(res, response);
  };

  private refundSubmarine = async (req: Request, res: Response) => {
    const { id, pubNonce, index, transaction } = validateRequest(req.body, [
      { name: 'id', type: 'string' },
      { name: 'index', type: 'number' },
      { name: 'pubNonce', type: 'string', hex: true },
      { name: 'transaction', type: 'string', hex: true },
    ]);

    const sig = await this.service.musigSigner.signSwapRefund(
      id,
      pubNonce,
      transaction,
      index,
    );

    successResponse(res, {
      pubNonce: getHexString(sig.pubNonce),
      partialSignature: getHexString(sig.signature),
    });
  };

  private createReverse = async (req: Request, res: Response) => {
    const {
      to,
      from,
      pairHash,
      referralId,
      routingNode,
      claimAddress,
      preimageHash,
      invoiceAmount,
      onchainAmount,
      claimPublicKey,
    } = validateRequest(req.body, [
      { name: 'to', type: 'string' },
      { name: 'from', type: 'string' },
      { name: 'preimageHash', type: 'string', hex: true },
      { name: 'claimPublicKey', type: 'string', hex: true },
      { name: 'pairHash', type: 'string', optional: true },
      { name: 'referralId', type: 'string', optional: true },
      { name: 'routingNode', type: 'string', optional: true },
      { name: 'claimAddress', type: 'string', optional: true },
      { name: 'invoiceAmount', type: 'number', optional: true },
      { name: 'onchainAmount', type: 'number', optional: true },
    ]);

    checkPreimageHashLength(preimageHash);

    const { pairId, orderSide } = this.service.convertToPairAndSide(
      from,
      to,
      true,
    );
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
      prepayMinerFee: false,
      version: SwapVersion.Taproot,
    });

    this.logger.verbose(`Created Reverse Swap with id: ${response.id}`);
    this.logger.silly(`Reverse swap ${response.id}: ${stringify(response)}`);

    createdResponse(res, response);
  };

  private claimReverse = async (req: Request, res: Response) => {
    const { id, preimage, pubNonce, index, transaction } = validateRequest(
      req.body,
      [
        { name: 'id', type: 'string' },
        { name: 'index', type: 'number' },
        { name: 'preimage', type: 'string', hex: true },
        { name: 'pubNonce', type: 'string', hex: true },
        { name: 'transaction', type: 'string', hex: true },
      ],
    );

    const sig = await this.service.musigSigner.signReverseSwapClaim(
      id,
      preimage,
      pubNonce,
      transaction,
      index,
    );

    successResponse(res, {
      pubNonce: getHexString(sig.pubNonce),
      partialSignature: getHexString(sig.signature),
    });
  };
}

export default SwapRouter;
