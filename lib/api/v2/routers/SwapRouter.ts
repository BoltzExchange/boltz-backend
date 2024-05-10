import { Request, Response, Router } from 'express';
import Logger from '../../../Logger';
import { getHexString, stringify } from '../../../Utils';
import { SwapVersion } from '../../../consts/Enums';
import SwapRepository from '../../../db/repositories/SwapRepository';
import RateProviderTaproot from '../../../rates/providers/RateProviderTaproot';
import CountryCodes from '../../../service/CountryCodes';
import Errors from '../../../service/Errors';
import Service from '../../../service/Service';
import Controller from '../../Controller';
import {
  checkPreimageHashLength,
  createdResponse,
  errorResponse,
  markSwap,
  parseReferralId,
  successResponse,
  validateRequest,
} from '../../Utils';
import RouterBase from './RouterBase';

class SwapRouter extends RouterBase {
  constructor(
    logger: Logger,
    private readonly service: Service,
    private readonly controller: Controller,
    private readonly countryCodes: CountryCodes,
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
     *           required: true
     *           description: Tapscript version
     *         output:
     *           type: string
     *           required: true
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
     *     SubmarinePair:
     *       type: object
     *       properties:
     *         hash:
     *           type: string
     *           required: true
     *           description: Hash of the pair that can be used when creating the Submarine Swap to ensure the information of the client is up-to-date
     *         rate:
     *           type: number
     *           required: true
     *           description: Exchange rate of the pair
     *         limits:
     *           type: object
     *           properties:
     *             minimal:
     *               type: number
     *               required: true
     *               description: Minimal amount that can be swapped in satoshis
     *             maximal:
     *               type: number
     *               required: true
     *               description: Maximal amount that can be swapped in satoshis
     *             maximalZeroConf:
     *               type: number
     *               required: true
     *               description: Maximal amount that will be accepted 0-conf in satoshis
     *         fees:
     *           type: object
     *           required: true
     *           properties:
     *             percentage:
     *               type: number
     *               required: true
     *               description: Relative fee that will be charged in percent
     *             minerFees:
     *               type: number
     *               required: true
     *               description: Absolute miner fee that will be charged in satoshis
     */

    /**
     * @openapi
     * /swap/submarine:
     *   get:
     *     description: Possible pairs for Submarine Swaps
     *     tags: [Submarine]
     *     responses:
     *       '200':
     *         description: Dictionary of the from -> to currencies that can be used in a Submarine Swap
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               additionalProperties:
     *                 type: object
     *                 additionalProperties:
     *                   $ref: '#/components/schemas/SubmarinePair'
     *             examples:
     *               json:
     *                 value: '{"BTC":{"BTC":{"hash":"90ab5c8e6ece5db52173e9423a0dd3071f5894dc8d35ed592a439ccabcdebbd5","rate":1,"limits":{"maximal":25000000,"minimal":50000,"maximalZeroConf":0},"fees":{"percentage":0.1,"minerFees":4379}}},"L-BTC":{"BTC":{"hash":"b53c0ac3da051a78f67f6dd25f2ab0858492dc6881015b236d554227c85fda7d","rate":1,"limits":{"maximal":25000000,"minimal":1000,"maximalZeroConf":100000},"fees":{"percentage":0.1,"minerFees":148}}}}'
     */
    router.get('/submarine', this.handleError(this.getSubmarine));

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
     *           description: BOLT11 invoice that should be paid
     *         preimageHash:
     *           type: string
     *           description: Preimage hash of an invoice that will be set later
     *         refundPublicKey:
     *           type: string
     *           required: true
     *           description: Public key with which the Submarine Swap can be refunded encoded as HEX
     *         pairHash:
     *           type: string
     *           description: Pair hash from the pair information for the client to check if their fee data is up-to-date
     *         referralId:
     *           type: string
     *           description: Referral ID to be used for the Submarine swap
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
     *           required: true
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
     *           required: true
     *           description: Timeout block height of the onchain HTLC
     *         acceptZeroConf:
     *           type: boolean
     *           description: Whether 0-conf will be accepted assuming the transaction does not signal RBF and has a reasonably high fee
     *         expectedAmount:
     *           type: number
     *           required: true
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
     * /swap/submarine/{id}/invoice:
     *   post:
     *     tags: [Submarine]
     *     description: Set the invoice for a Submarine Swap
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *         description: ID of the Submarine Swap
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               invoice:
     *                 type: string
     *                 required: true
     *                 description: BOLT11 invoice that should be paid. The preimage hash has to match the one specified when creating the swap
     *               pairHash:
     *                 type: string
     *     responses:
     *       '200':
     *         description: Information about the onchain part of the Submarine Swap
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 bip21:
     *                   type: string
     *                   required: true
     *                   description: BIP21 for the onchain payment request
     *                 expectedAmount:
     *                   type: number
     *                   required: true
     *                   description: Amount that is expected to be sent to the onchain HTLC address in satoshis
     *                 acceptZeroConf:
     *                   type: boolean
     *                   required: true
     *                   description: Whether 0-conf will be accepted assuming the transaction does not signal RBF and has a reasonably high fee
     *       '400':
     *         description: Error that caused the request to fail
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/ErrorResponse'
     */
    router.post(
      '/submarine/:id/invoice',
      this.handleError(this.setSubmarineInvoice),
    );

    /**
     * @openapi
     * /swap/submarine/{id}/invoice/amount:
     *   get:
     *     tags: [Submarine]
     *     description: Get the expected amount of the invoice that should be set after the Swap was created with a preimage hash and an onchain transaction was sent
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *         description: ID of the Submarine Swap
     *     responses:
     *       '200':
     *         description: Expected amount of the invoice
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 invoiceAmount:
     *                   type: number
     *                   required: true
     *                   description: Expected amount of the invoice
     *       '400':
     *         description: Error that caused the request to fail
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/ErrorResponse'
     */
    router.get(
      '/submarine/:id/invoice/amount',
      this.handleError(this.getSubmarineInvoiceAmount),
    );

    /**
     * @openapi
     * components:
     *   schemas:
     *     SubmarineTransaction:
     *       type: object
     *       properties:
     *         id:
     *           type: string
     *           required: true
     *           description: ID the lockup transaction
     *         hex:
     *           type: string
     *           description: Lockup transaction as raw HEX
     *         timeoutBlockHeight:
     *           type: number
     *           required: true
     *           description: Block height at which the time-lock expires
     *         timeoutEta:
     *           type: number
     *           description: UNIX timestamp at which the time-lock expires; set if it has not expired already
     */

    /**
     * @openapi
     * /swap/submarine/{id}/transaction:
     *   get:
     *     tags: [Submarine]
     *     description: Get the lockup transaction of a Submarine Swap
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *         description: ID of the Submarine Swap
     *     responses:
     *       '200':
     *         description: The lockup transaction of the Submarine Swap and accompanying information
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/SubmarineTransaction'
     *       '400':
     *         description: Error that caused the request to fail
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/ErrorResponse'
     */
    router.get(
      '/submarine/:id/transaction',
      this.handleError(this.getSubmarineTransaction),
    );

    /**
     * @openapi
     * /swap/submarine/{id}/refund:
     *   get:
     *     tags: [Submarine]
     *     description: Get an EIP-712 signature for a cooperative EVM refund
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *         description: ID of the Swap
     *     responses:
     *       '200':
     *         description: EIP-712 signature
     *         content:
     *           application/json:
     *             schema:
     *               properties:
     *                 signature:
     *                   type: string
     *                   required: true
     *                   description: EIP-712 signature with which a cooperative refund can be executed onchain
     *       '400':
     *         description: Error that caused signature request to fail
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/ErrorResponse'
     */
    router.get(
      '/submarine/:id/refund',
      this.handleError(this.refundSubmarineEvm),
    );

    /**
     * @openapi
     * components:
     *   schemas:
     *     SubmarineRefundRequest:
     *       type: object
     *       properties:
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
     *           required: true
     *           description: Public nonce  encoded as HEX
     *         partialSignature:
     *           type: string
     *           required: true
     *           description: Partial signature encoded as HEX
     */

    /**
     * @openapi
     * /swap/submarine/{id}/refund:
     *   post:
     *     description: Requests a partial signature for a cooperative Submarine Swap refund transaction
     *     tags: [Submarine]
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *         description: ID of the Swap
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
    router.post(
      '/submarine/:id/refund',
      this.handleError(this.refundSubmarine),
    );

    // Deprecated endpoint from first Taproot deployment
    router.post('/submarine/refund', this.handleError(this.refundSubmarine));

    /**
     * @openapi
     * components:
     *   schemas:
     *     SubmarineClaimDetails:
     *       type: object
     *       properties:
     *         preimage:
     *           type: string
     *           required: true
     *           description: Preimage of the invoice for the Submarine Swap encoded as HEX
     *         pubNonce:
     *           type: string
     *           required: true
     *           description: Public nonce of Boltz encoded as HEX
     *         publicKey:
     *           type: string
     *           required: true
     *           description: Public key of Boltz encoded as HEX
     *         transactionHash:
     *           type: string
     *           required: true
     *           description: Hash of the transaction that should be signed
     */

    /**
     * @openapi
     * /swap/submarine/{id}/claim:
     *   get:
     *     tags: [Submarine]
     *     description: Get the needed information to post a partial signature for a cooperative Submarine Swap claim transaction
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *         description: ID of the Swap
     *     responses:
     *       '200':
     *         description: The latest status of the Swap
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/SubmarineClaimDetails'
     *       '400':
     *         description: Error that caused signature request to fail
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/ErrorResponse'
     *       '404':
     *         description: When no Swap with the ID could be found
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/ErrorResponse'
     */
    router.get(
      '/submarine/:id/claim',
      this.handleError(this.getSubmarineClaimDetails),
    );

    /**
     * @openapi
     * /swap/submarine/{id}/claim:
     *   post:
     *     tags: [Submarine]
     *     description: Send Boltz the clients partial signature for a cooperative Submarine Swap claim transaction
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *         description: ID of the Swap
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/PartialSignature'
     *     responses:
     *       '200':
     *         description: The latest status of the Swap
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *       '400':
     *         description: Error that caused signature request to fail
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/ErrorResponse'
     *       '404':
     *         description: When no Swap with the ID could be found
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/ErrorResponse'
     */
    router.post('/submarine/:id/claim', this.handleError(this.claimSubmarine));

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
     *     ReversePair:
     *       type: object
     *       properties:
     *         hash:
     *           type: string
     *           required: true
     *           description: Hash of the pair that can be used when creating the Reverse Swap to ensure the information of the client is up-to-date
     *         rate:
     *           type: number
     *           required: true
     *           description: Exchange rate of the pair
     *         limits:
     *           type: object
     *           properties:
     *             minimal:
     *               type: number
     *               required: true
     *               description: Minimal amount that can be swapped in satoshis
     *             maximal:
     *               type: number
     *               required: true
     *               description: Maximal amount that can be swapped in satoshis
     *         fees:
     *           type: object
     *           properties:
     *             percentage:
     *               type: number
     *               required: true
     *               description: Relative fee that will be charged in percent
     *             minerFees:
     *               type: object
     *               properties:
     *                 lockup:
     *                   type: number
     *                   required: true
     *                   description: Absolute miner fee that will be charged in satoshis
     *                 claim:
     *                   type: number
     *                   required: true
     *                   description: Absolute miner fee that we estimate for the claim transaction in satoshis
     */

    /**
     * @openapi
     * /swap/reverse:
     *   get:
     *     description: Possible pairs for Reverse Swaps
     *     tags: [Reverse]
     *     responses:
     *       '200':
     *         description: Dictionary of the from -> to currencies that can be used in a Reverse Swap
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               additionalProperties:
     *                 type: object
     *                 additionalProperties:
     *                   $ref: '#/components/schemas/ReversePair'
     *             examples:
     *               json:
     *                 value: '{"BTC":{"BTC":{"hash":"784db95522d197f4e90d661e8451d0d78f63906f74cc566cd395d32f359fdc90","rate":1,"limits":{"maximal":25000000,"minimal":50000},"fees":{"percentage":0.5,"minerFees":{"claim":1998,"lockup":2772}}},"L-BTC":{"hash":"976e6dad9097f657213244b046e5f29524b743568a2c3d569b421df1e07e1b44","rate":1,"limits":{"maximal":25000000,"minimal":1000},"fees":{"percentage":0.25,"minerFees":{"claim":143,"lockup":276}}}}}'
     */
    router.get('/reverse', this.handleError(this.getReverse));

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
     *           description: Public key with which the Reverse Swap can be claimed encoded as HEX
     *         claimAddress:
     *           type: string
     *           description: EVM address with which the Reverse Swap can be claimed
     *         invoiceAmount:
     *           type: number
     *           description: Amount for which the invoice should be; conflicts with "onchainAmount"
     *         onchainAmount:
     *           type: number
     *           description: Amount that should be locked in the onchain HTLC; conflicts with "invoiceAmount"
     *         pairHash:
     *           type: string
     *           description: Pair hash from the pair information for the client to check if their fee data is up-to-date
     *         referralId:
     *           type: string
     *           description: Referral ID to be used for the Submarine swap
     *         address:
     *           type: string
     *           description: Address to be used for a BIP-21 direct payment
     *         addressSignature:
     *           type: string
     *           description: Signature of the claim public key of the SHA256 hash of the address for the direct payment
     *         claimCovenant:
     *           type: boolean
     *           default: false
     *           description: If the claim covenant should be added to the Taproot tree. Only possible when "address" is set
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
     *           required: true
     *           description: ID of the created Reverse Swap
     *         invoice:
     *           type: string
     *           required: true
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
     *           required: true
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
     *     ReverseTransaction:
     *       type: object
     *       properties:
     *         id:
     *           type: string
     *           required: true
     *           description: ID the lockup transaction
     *         hex:
     *           type: string
     *           description: Lockup transaction as raw HEX
     *         timeoutBlockHeight:
     *           type: number
     *           required: true
     *           description: Block height at which the time-lock expires
     */

    /**
     * @openapi
     * /swap/reverse/{id}/transaction:
     *   get:
     *     tags: [Reverse]
     *     description: Get the lockup transaction of a Reverse Swap
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *         description: ID of the Reverse Swap
     *     responses:
     *       '200':
     *         description: The lockup transaction of the Reverse Swap and accompanying information
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/ReverseTransaction'
     *       '400':
     *         description: Error that caused the request to fail
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/ErrorResponse'
     */
    router.get(
      '/reverse/:id/transaction',
      this.handleError(this.getReverseTransaction),
    );

    /**
     * @openapi
     * components:
     *   schemas:
     *     ReverseClaimRequest:
     *       type: object
     *       properties:
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
     * /swap/reverse/{id}/claim:
     *   post:
     *     description: Requests a partial signature for a cooperative Reverse Swap claim transaction
     *     tags: [Reverse]
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *         description: ID of the Swap
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
    router.post('/reverse/:id/claim', this.handleError(this.claimReverse));

    // Deprecated endpoint from first Taproot deployment
    router.post('/reverse/claim', this.handleError(this.claimReverse));

    /**
     * @openapi
     * components:
     *   schemas:
     *     ReverseBip21:
     *       type: object
     *       properties:
     *         bip21:
     *           type: string
     *           required: true
     *           description: BIP-21 for the Reverse Swap
     *         signature:
     *           type: string
     *           required: true
     *           description: Signature of the address in the BIP-21 of the public key in the routing hint
     */

    /**
     * @openapi
     * /swap/reverse/{invoice}/bip21:
     *   get:
     *     tags: [Reverse]
     *     description: Get the BIP-21 of a Reverse Swap for a direct payment
     *     parameters:
     *       - in: path
     *         name: invoice
     *         required: true
     *         schema:
     *           type: string
     *         description: Invoice of the Reverse Swap
     *     responses:
     *       '200':
     *         description: BIP-21 and signature to prove the authenticity of the BIP-21
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/ReverseBip21'
     *       '404':
     *         description: When no BIP-21 was set for the Reverse Swap
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/ErrorResponse'
     *       '400':
     *         description: Error that caused the request to fail
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/ErrorResponse'
     */
    router.get(
      '/reverse/:invoice/bip21',
      this.handleError(this.getReverseBip21),
    );

    /**
     * @openapi
     * tags:
     *   name: Swap
     *   description: Generic Swap related endpoints
     */

    /**
     * @openapi
     * components:
     *   schemas:
     *     SwapStatus:
     *       type: object
     *       properties:
     *         status:
     *           type: string
     *           required: true
     *           description: Status of the Swap
     *         zeroConfRejected:
     *           type: boolean
     *           description: Whether 0-conf was accepted for the lockup transaction of the Submarine Swap
     *         transaction:
     *           type: object
     *           description: Details of the lockup transaction of a Reverse Swap
     *           properties:
     *             id:
     *               type: string
     *               description: ID of the transaction
     *             hex:
     *               type: string
     *               description: Raw hex of the transaction
     */

    /**
     * @openapi
     * /swap/{id}:
     *   get:
     *     tags: [Swap]
     *     description: Get the status of a Swap
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *         description: ID of the Swap
     *     responses:
     *       '200':
     *         description: The latest status of the Swap
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/SwapStatus'
     *       '404':
     *         description: When no Swap with the ID could be found
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/ErrorResponse'
     */
    router.get('/:id', this.handleError(this.getSwapStatus));

    return router;
  };

  private getSubmarine = (_req: Request, res: Response) =>
    successResponse(
      res,
      RateProviderTaproot.serializePairs(
        this.service.rateProvider.providers[SwapVersion.Taproot].submarinePairs,
      ),
    );

  private createSubmarine = async (req: Request, res: Response) => {
    const { to, from, invoice, pairHash, refundPublicKey } = validateRequest(
      req.body,
      [
        { name: 'to', type: 'string' },
        { name: 'from', type: 'string' },
        { name: 'invoice', type: 'string', optional: true },
        { name: 'pairHash', type: 'string', optional: true },
        { name: 'refundPublicKey', type: 'string', hex: true, optional: true },
      ],
    );
    const referralId = parseReferralId(req);

    const { pairId, orderSide } = this.service.convertToPairAndSide(from, to);

    let response: { id: string };

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
      const { preimageHash } = validateRequest(req.body, [
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

    await markSwap(this.countryCodes, req.ip, response.id);

    this.logger.verbose(`Created new Swap with id: ${response.id}`);
    this.logger.silly(`Swap ${response.id}: ${stringify(response)}`);

    createdResponse(res, response);
  };

  private setSubmarineInvoice = async (req: Request, res: Response) => {
    const { id } = validateRequest(req.params, [
      { name: 'id', type: 'string' },
    ]);
    const { invoice, pairHash } = validateRequest(req.body, [
      { name: 'invoice', type: 'string' },
      { name: 'pairHash', type: 'string', optional: true },
    ]);

    const response = await this.service.setInvoice(
      id,
      invoice.toLowerCase(),
      pairHash,
    );
    successResponse(res, response);
  };

  public getSubmarineInvoiceAmount = async (req: Request, res: Response) => {
    const { id } = validateRequest(req.params, [
      { name: 'id', type: 'string' },
    ]);

    const { submarineSwap } = await this.service.getSwapRates(id);
    successResponse(res, { invoiceAmount: submarineSwap.invoiceAmount });
  };

  private getSubmarineTransaction = async (req: Request, res: Response) => {
    const { id } = validateRequest(req.params, [
      { name: 'id', type: 'string' },
    ]);

    const { transactionHex, transactionId, timeoutBlockHeight, timeoutEta } =
      await this.service.getSwapTransaction(id);
    successResponse(res, {
      id: transactionId,
      hex: transactionHex,
      timeoutBlockHeight,
      timeoutEta,
    });
  };

  private refundSubmarine = async (req: Request, res: Response) => {
    const params = req.params
      ? validateRequest(req.params, [
          { name: 'id', type: 'string', optional: true },
        ])
      : {};

    const { id, pubNonce, index, transaction } = validateRequest(req.body, [
      { name: 'id', type: 'string', optional: params.id !== undefined },
      { name: 'index', type: 'number' },
      { name: 'pubNonce', type: 'string', hex: true },
      { name: 'transaction', type: 'string', hex: true },
    ]);

    const sig = await this.service.musigSigner.signSwapRefund(
      params.id || id,
      pubNonce,
      transaction,
      index,
    );

    successResponse(res, {
      pubNonce: getHexString(sig.pubNonce),
      partialSignature: getHexString(sig.signature),
    });
  };

  private refundSubmarineEvm = async (req: Request, res: Response) => {
    const { id } = validateRequest(req.params, [
      { name: 'id', type: 'string' },
    ]);

    successResponse(res, {
      signature: await this.service.eipSigner.signSwapRefund(id),
    });
  };

  private getSubmarineClaimDetails = async (req: Request, res: Response) => {
    const { id } = validateRequest(req.params, [
      { name: 'id', type: 'string' },
    ]);
    const swap = await SwapRepository.getSwap({
      id,
    });
    if (swap === null || swap === undefined) {
      errorResponse(this.logger, req, res, Errors.SWAP_NOT_FOUND(id), 404);
      return;
    }

    const details =
      await this.service.swapManager.deferredClaimer.getCooperativeDetails(
        swap,
      );
    successResponse(res, {
      preimage: getHexString(details.preimage),
      pubNonce: getHexString(details.pubNonce),
      publicKey: getHexString(details.publicKey),
      transactionHash: getHexString(details.transactionHash),
    });
  };

  private claimSubmarine = async (req: Request, res: Response) => {
    const { id } = validateRequest(req.params, [
      { name: 'id', type: 'string' },
    ]);
    const { pubNonce, partialSignature } = validateRequest(req.body, [
      { name: 'pubNonce', type: 'string', hex: true },
      { name: 'partialSignature', type: 'string', hex: true },
    ]);

    const swap = await SwapRepository.getSwap({
      id,
    });
    if (swap === null || swap === undefined) {
      errorResponse(this.logger, req, res, Errors.SWAP_NOT_FOUND(id), 404);
      return;
    }

    await this.service.swapManager.deferredClaimer.broadcastCooperative(
      swap,
      pubNonce,
      partialSignature,
    );
    successResponse(res, {});
  };

  private getReverse = (_req: Request, res: Response) =>
    successResponse(
      res,
      RateProviderTaproot.serializePairs(
        this.service.rateProvider.providers[SwapVersion.Taproot].reversePairs,
      ),
    );

  private createReverse = async (req: Request, res: Response) => {
    const {
      to,
      from,
      address,
      pairHash,
      routingNode,
      preimageHash,
      claimAddress,
      invoiceAmount,
      onchainAmount,
      claimCovenant,
      claimPublicKey,
      addressSignature,
    } = validateRequest(req.body, [
      { name: 'to', type: 'string' },
      { name: 'from', type: 'string' },
      { name: 'preimageHash', type: 'string', hex: true },
      { name: 'address', type: 'string', optional: true },
      { name: 'pairHash', type: 'string', optional: true },
      { name: 'routingNode', type: 'string', optional: true },
      { name: 'claimAddress', type: 'string', optional: true },
      { name: 'invoiceAmount', type: 'number', optional: true },
      { name: 'onchainAmount', type: 'number', optional: true },
      { name: 'claimCovenant', type: 'boolean', optional: true },
      { name: 'claimPublicKey', type: 'string', hex: true, optional: true },
      { name: 'addressSignature', type: 'string', hex: true, optional: true },
    ]);
    const referralId = parseReferralId(req);

    checkPreimageHashLength(preimageHash);

    const { pairId, orderSide } = this.service.convertToPairAndSide(from, to);
    const response = await this.service.createReverseSwap({
      pairId,
      pairHash,
      orderSide,
      referralId,
      routingNode,
      preimageHash,
      claimAddress,
      invoiceAmount,
      onchainAmount,
      claimCovenant,
      claimPublicKey,

      userAddress: address,
      prepayMinerFee: false,
      version: SwapVersion.Taproot,
      userAddressSignature: addressSignature,
    });

    await markSwap(this.countryCodes, req.ip, response.id);

    this.logger.verbose(`Created Reverse Swap with id: ${response.id}`);
    this.logger.silly(`Reverse swap ${response.id}: ${stringify(response)}`);

    createdResponse(res, response);
  };

  private getReverseBip21 = async (req: Request, res: Response) => {
    const { invoice } = validateRequest(req.params, [
      { name: 'invoice', type: 'string' },
    ]);

    const hint = await this.service.getReverseBip21(invoice.toLowerCase());
    if (hint === undefined) {
      errorResponse(this.logger, req, res, 'no BIP-21 for swap', 404);
      return;
    }

    successResponse(res, {
      bip21: hint.bip21,
      signature: hint.signature,
    });
  };

  private getReverseTransaction = async (req: Request, res: Response) => {
    const { id } = validateRequest(req.params, [
      { name: 'id', type: 'string' },
    ]);

    const { transactionHex, transactionId, timeoutBlockHeight } =
      await this.service.getReverseSwapTransaction(id);
    successResponse(res, {
      id: transactionId,
      hex: transactionHex,
      timeoutBlockHeight,
    });
  };

  private claimReverse = async (req: Request, res: Response) => {
    const params = req.params
      ? validateRequest(req.params, [
          { name: 'id', type: 'string', optional: true },
        ])
      : {};

    const { id, preimage, pubNonce, index, transaction } = validateRequest(
      req.body,
      [
        { name: 'id', type: 'string', optional: params.id !== undefined },
        { name: 'index', type: 'number' },
        { name: 'preimage', type: 'string', hex: true },
        { name: 'pubNonce', type: 'string', hex: true },
        { name: 'transaction', type: 'string', hex: true },
      ],
    );

    const sig = await this.service.musigSigner.signReverseSwapClaim(
      params.id || id,
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

  private getSwapStatus = (req: Request, res: Response) => {
    const { id } = validateRequest(req.params, [
      { name: 'id', type: 'string' },
    ]);

    const response = this.controller.pendingSwapInfos.get(id);

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
  };
}

export default SwapRouter;
