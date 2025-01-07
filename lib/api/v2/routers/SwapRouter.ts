import { Request, Response, Router } from 'express';
import Logger from '../../../Logger';
import { getHexString, stringify } from '../../../Utils';
import { SwapUpdateEvent, SwapVersion } from '../../../consts/Enums';
import ChainSwapRepository from '../../../db/repositories/ChainSwapRepository';
import ReferralRepository from '../../../db/repositories/ReferralRepository';
import SwapRepository from '../../../db/repositories/SwapRepository';
import RateProviderTaproot from '../../../rates/providers/RateProviderTaproot';
import CountryCodes from '../../../service/CountryCodes';
import Errors from '../../../service/Errors';
import Service, { WebHookData } from '../../../service/Service';
import ChainSwapSigner from '../../../service/cooperative/ChainSwapSigner';
import MusigSigner, {
  PartialSignature,
} from '../../../service/cooperative/MusigSigner';
import ApiErrors from '../../Errors';
import SwapInfos from '../../SwapInfos';
import {
  checkPreimageHashLength,
  createdResponse,
  errorResponse,
  markSwap,
  parseReferralId,
  successResponse,
  validateArray,
  validateRequest,
} from '../../Utils';
import RouterBase from './RouterBase';

class SwapRouter extends RouterBase {
  constructor(
    logger: Logger,
    private readonly service: Service,
    private readonly swapInfos: SwapInfos,
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
     *       required: ["version", "output"]
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
     *       required: ["claimLeaf", "refundLeaf"]
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
     *       required: ["hash", "rate", "limits", "fees"]
     *       properties:
     *         hash:
     *           type: string
     *           description: Hash of the pair that can be used when creating the Submarine Swap to ensure the information of the client is up-to-date
     *         rate:
     *           type: number
     *           description: Exchange rate of the pair
     *         limits:
     *           type: object
     *           required: ["minimal", "maximal", "maximalZeroConf"]
     *           properties:
     *             minimal:
     *               type: number
     *               description: Minimal amount that can be swapped in satoshis
     *             maximal:
     *               type: number
     *               description: Maximal amount that can be swapped in satoshis
     *             maximalZeroConf:
     *               type: number
     *               description: Maximal amount that will be accepted 0-conf in satoshis
     *         fees:
     *           type: object
     *           required: ["percentage", "minerFees"]
     *           properties:
     *             percentage:
     *               type: number
     *               description: Relative fee that will be charged in percent
     *             minerFees:
     *               type: number
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
     *     WebhookData:
     *       type: object
     *       required: ["url"]
     *       properties:
     *         url:
     *           type: string
     *           description: URL that should be called. Only HTTPS is allowed
     *         hashSwapId:
     *           type: boolean
     *           default: false
     *           description: If the swap id in the Webhook calls should be hashed with SHA256; useful when Webhooks are processed by a third party
     *         status:
     *           type: array
     *           items:
     *             type: string
     *           default: []
     *           description: Swap status events for which the Webhook should be called. If undefined or empty, the Webhook will be called for all status events
     */

    /**
     * @openapi
     * components:
     *   schemas:
     *     SubmarineRequest:
     *       type: object
     *       required: ["from", "to"]
     *       properties:
     *         from:
     *           type: string
     *           description: The asset that is sent onchain
     *         to:
     *           type: string
     *           description: The asset that is received on lightning
     *         invoice:
     *           type: string
     *           description: BOLT11 invoice that should be paid
     *         preimageHash:
     *           type: string
     *           description: Preimage hash of an invoice that will be set later
     *         refundPublicKey:
     *           type: string
     *           description: Public key with which the Submarine Swap can be refunded encoded as HEX
     *         pairHash:
     *           type: string
     *           description: Pair hash from the pair information for the client to check if their fee data is up-to-date
     *         referralId:
     *           type: string
     *           description: Referral ID to be used for the Submarine swap
     *         webhook:
     *           $ref: '#/components/schemas/WebhookData'
     */

    /**
     * @openapi
     * components:
     *   schemas:
     *     SubmarineResponse:
     *       type: object
     *       required: ["id", "timeoutBlockHeight", "expectedAmount"]
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
     *         referralId:
     *           type: string
     *           description: Referral ID used for the swap
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
     *             required: ["invoice"]
     *             properties:
     *               invoice:
     *                 type: string
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
     *               required: ["bip21", "expectedAmount", "acceptZeroConf"]
     *               properties:
     *                 bip21:
     *                   type: string
     *                   description: BIP21 for the onchain payment request
     *                 expectedAmount:
     *                   type: number
     *                   description: Amount that is expected to be sent to the onchain HTLC address in satoshis
     *                 acceptZeroConf:
     *                   type: boolean
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
     *               required: ["invoiceAmount"]
     *               properties:
     *                 invoiceAmount:
     *                   type: number
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
     *       required: ["id", "timeoutBlockHeight"]
     *       properties:
     *         id:
     *           type: string
     *           description: ID the lockup transaction
     *         hex:
     *           type: string
     *           description: Lockup transaction as raw HEX
     *         timeoutBlockHeight:
     *           type: number
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
     * components:
     *   schemas:
     *     SubmarinePreimage:
     *       type: object
     *       required: ["preimage"]
     *       properties:
     *         preimage:
     *           type: string
     *           description: Preimage of the Submarine Swap
     */

    /**
     * @openapi
     * /swap/submarine/{id}/preimage:
     *   get:
     *     tags: [Submarine]
     *     description: Get the preimage of a successful Submarine Swap
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *         description: ID of the Submarine Swap
     *     responses:
     *       '200':
     *         description: The preimage of a Submarine Swap
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/SubmarinePreimage'
     *       '400':
     *         description: Error that caused the request to fail
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/ErrorResponse'
     */
    router.get(
      '/submarine/:id/preimage',
      this.handleError(this.getSubmarinePreimage),
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
     *         description: ID or preimage hash of the Swap
     *     responses:
     *       '200':
     *         description: EIP-712 signature
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               required: ["signature"]
     *               properties:
     *                 signature:
     *                   type: string
     *                   description: EIP-712 signature with which a cooperative refund can be executed onchain
     *       '400':
     *         description: Error that caused signature request to fail
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/ErrorResponse'
     */
    router.get('/submarine/:id/refund', this.handleError(this.refundEvm));

    /**
     * @openapi
     * components:
     *   schemas:
     *     RefundRequest:
     *       type: object
     *       required: ["pubNonce", "transaction", "index"]
     *       properties:
     *         pubNonce:
     *           type: string
     *           description: Public nonce of the client for the session encoded as HEX
     *         transaction:
     *           type: string
     *           description: Transaction which should be signed encoded as HEX
     *         index:
     *           type: number
     *           description: Index of the input of the transaction that should be signed
     */

    /**
     * @openapi
     * components:
     *   schemas:
     *     PartialSignature:
     *       type: object
     *       required: ["pubNonce", "partialSignature"]
     *       properties:
     *         pubNonce:
     *           type: string
     *           description: Public nonce encoded as HEX
     *         partialSignature:
     *           type: string
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
     *             $ref: '#/components/schemas/RefundRequest'
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
      this.handleError(this.signUtxoRefund(this.service.musigSigner)),
    );

    // Deprecated endpoint from first the Taproot deployment
    router.post(
      '/submarine/refund',
      this.handleError(this.signUtxoRefund(this.service.musigSigner)),
    );

    /**
     * @openapi
     * components:
     *   schemas:
     *     SubmarineClaimDetails:
     *       type: object
     *       required: ["preimage", "pubNonce", "publicKey", "transactionHash"]
     *       properties:
     *         preimage:
     *           type: string
     *           description: Preimage of the invoice for the Submarine Swap encoded as HEX
     *         pubNonce:
     *           type: string
     *           description: Public nonce of Boltz encoded as HEX
     *         publicKey:
     *           type: string
     *           description: Public key of Boltz encoded as HEX
     *         transactionHash:
     *           type: string
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
     *       required: ["hash", "rate", "limits", "fees"]
     *       properties:
     *         hash:
     *           type: string
     *           description: Hash of the pair that can be used when creating the Reverse Swap to ensure the information of the client is up-to-date
     *         rate:
     *           type: number
     *           description: Exchange rate of the pair
     *         limits:
     *           type: object
     *           required: ["minimal", "maximal"]
     *           properties:
     *             minimal:
     *               type: number
     *               description: Minimal amount that can be swapped in satoshis
     *             maximal:
     *               type: number
     *               description: Maximal amount that can be swapped in satoshis
     *         fees:
     *           type: object
     *           required: ["percentage", "minerFees"]
     *           properties:
     *             percentage:
     *               type: number
     *               description: Relative fee that will be charged in percent
     *             minerFees:
     *               type: object
     *               required: ["lockup", "claim"]
     *               properties:
     *                 lockup:
     *                   type: number
     *                   description: Absolute miner fee that will be charged in satoshis
     *                 claim:
     *                   type: number
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
     *       required: ["from", "to", "preimageHash"]
     *       properties:
     *         from:
     *           type: string
     *           description: The asset that is sent on lightning
     *         to:
     *           type: string
     *           description: The asset that is received onchain
     *         preimageHash:
     *           type: string
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
     *           description: Referral ID to be used for the Reverse Swap
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
     *         description:
     *           type: string
     *           description: Description of the created invoice and magic routing hint. Only ASCII and a maximum length of 100 characters is allowed
     *         descriptionHash:
     *           type: string
     *           description: Description hash for the invoice. Takes precedence over "description" if both are specified
     *         invoiceExpiry:
     *           type: number
     *           description: Expiry of the invoice in seconds
     *         webhook:
     *           $ref: '#/components/schemas/WebhookData'
     */
    /**
     * @openapi
     * components:
     *   schemas:
     *     ReverseResponse:
     *       type: object
     *       required: ["id", "invoice", "timeoutBlockHeight"]
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
     *         referralId:
     *           type: string
     *           description: Referral ID used for the swap
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
     *       required: ["id", "timeoutBlockHeight"]
     *       properties:
     *         id:
     *           type: string
     *           description: ID the lockup transaction
     *         hex:
     *           type: string
     *           description: Lockup transaction as raw HEX
     *         timeoutBlockHeight:
     *           type: number
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
     *       required: ["preimage"]
     *       properties:
     *         preimage:
     *           type: string
     *           description: Preimage of the Reverse Swap encoded as HEX
     *         pubNonce:
     *           type: string
     *           description: Public nonce of the client for the session encoded as HEX
     *         transaction:
     *           type: string
     *           description: Transaction which should be signed encoded as HEX
     *         index:
     *           type: number
     *           description: Index of the input of the transaction that should be signed
     */

    /**
     * @openapi
     * /swap/reverse/{id}/claim:
     *   post:
     *     description: Requests a partial signature for a cooperative Reverse Swap claim transaction. To settle the invoice, but not claim the onchain HTLC (eg to create a batched claim in the future), only the preimage is required. If no transaction is provided, an empty object is returned as response.
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

    // Deprecated endpoint from the first Taproot deployment
    router.post('/reverse/claim', this.handleError(this.claimReverse));

    /**
     * @openapi
     * components:
     *   schemas:
     *     ReverseBip21:
     *       type: object
     *       required: ["bip12", "signature"]
     *       properties:
     *         bip21:
     *           type: string
     *           description: BIP-21 for the Reverse Swap
     *         signature:
     *           type: string
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
     *   name: Chain Swap
     *   description: Chain Swap related endpoints
     */

    /**
     * @openapi
     * components:
     *   schemas:
     *     ChainPair:
     *       type: object
     *       required: ["hash", "rate", "limits", "fees"]
     *       properties:
     *         hash:
     *           type: string
     *           description: Hash of the pair that can be used when creating the Chain Swap to ensure the information of the client is up-to-date
     *         rate:
     *           type: number
     *           description: Exchange rate of the pair
     *         limits:
     *           type: object
     *           required: ["minimal", "maximal"]
     *           properties:
     *             minimal:
     *               type: number
     *               description: Minimal amount that can be swapped in satoshis
     *             maximal:
     *               type: number
     *               description: Maximal amount that can be swapped in satoshis
     *         fees:
     *           type: object
     *           required: ["percentage", "minerFees"]
     *           properties:
     *             percentage:
     *               type: number
     *               description: Relative fee that will be charged in percent
     *             minerFees:
     *               type: object
     *               required: ["lockup", "claim"]
     *               properties:
     *                 lockup:
     *                   type: number
     *                   description: Absolute miner fee that will be charged in satoshis
     *                 claim:
     *                   type: number
     *                   description: Absolute miner fee that we estimate for the claim transaction in satoshis
     */

    /**
     * @openapi
     * /swap/chain:
     *   get:
     *     description: Possible pairs for Chain Swaps
     *     tags: [Chain Swap]
     *     responses:
     *       '200':
     *         description: Dictionary of the from -> to currencies that can be used in a Chain Swap
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               additionalProperties:
     *                 type: object
     *                 additionalProperties:
     *                   $ref: '#/components/schemas/ChainPair'
     *             examples:
     *               json:
     *                 value: '{"BTC":{"RBTC":{"hash":"819c288da87e4212ed9420b60e2699d49ff3f989215f1beb3dc986a3dfbe8160","rate":1,"limits":{"maximal":4294967,"minimal":50000,"maximalZeroConf":0},"fees":{"percentage":0.5,"minerFees":{"server":7035,"user":{"claim":3108,"lockup":5077}}}},"L-BTC":{"hash":"43087e267db95668b9b7c48efcf44d922484870f1bdb8b926e5d6b76bf4d0709","rate":1,"limits":{"maximal":4294967,"minimal":10000,"maximalZeroConf":0},"fees":{"percentage":0.25,"minerFees":{"server":4455,"user":{"claim":3108,"lockup":276}}}}},"RBTC":{"BTC":{"hash":"a5de5e1fb35ea29d67131283bf5c682e5b16a19ecaadc0e80345d95f4831e201","rate":1,"limits":{"maximal":4294967,"minimal":50000,"maximalZeroConf":0},"fees":{"percentage":0.5,"minerFees":{"server":8185,"user":{"claim":2723,"lockup":4312}}}}},"L-BTC":{"BTC":{"hash":"3ec520412cee74863f2c75a9cd7b8d2077f68267632344ec3c4646e100883091","rate":1,"limits":{"maximal":4294967,"minimal":10000,"maximalZeroConf":0},"fees":{"percentage":0.25,"minerFees":{"server":3384,"user":{"claim":143,"lockup":4312}}}}}}'
     */
    router.get('/chain', this.handleError(this.getChain));

    /**
     * @openapi
     * components:
     *   schemas:
     *     ChainRequest:
     *       type: object
     *       required: ["from", "to", "preimageHash"]
     *       properties:
     *         from:
     *           type: string
     *           description: The asset that is sent on lightning
     *         to:
     *           type: string
     *           description: The asset that is received onchain
     *         preimageHash:
     *           type: string
     *           description: SHA-256 hash of the preimage of the Chain Swap encoded as HEX
     *         claimPublicKey:
     *           type: string
     *           description: Public key with which the Chain Swap can be claimed encoded as HEX
     *         refundPublicKey:
     *           type: string
     *           description: Public key with which the Chain Swap can be refunded encdoed as HEX
     *         claimAddress:
     *           type: string
     *           description: EVM address with which the Chain Swap can be claimed
     *         userLockAmount:
     *           type: number
     *           description: Amount the client is expected to lock; conflicts with "serverLockAmount"
     *         serverLockAmount:
     *           type: number
     *           description: Amount the server should lock; conflicts with "userLockAmount"
     *         pairHash:
     *           type: string
     *           description: Pair hash from the pair information for the client to check if their fee data is up-to-date
     *         referralId:
     *           type: string
     *           description: Referral ID to be used for the Chain Swap
     *         webhook:
     *           $ref: '#/components/schemas/WebhookData'
     */

    /**
     * @openapi
     * components:
     *   schemas:
     *     ChainSwapData:
     *       type: object
     *       required: ["swapTree", "timeoutBlockHeight", "amount"]
     *       properties:
     *         swapTree:
     *           $ref: '#/components/schemas/SwapTree'
     *         lockupAddress:
     *           type: string
     *           description: HTLC address in which coins will be locked
     *         serverPublicKey:
     *           type: string
     *           description: Public key of Boltz that is used in the aggregated public key
     *         timeoutBlockHeight:
     *           type: number
     *           description: Timeout block height of the onchain HTLC
     *         amount:
     *           type: number
     *           description: Amount that is supposed to be locked in the onchain HTLC
     *         blindingKey:
     *           type: string
     *           description: Liquid blinding private key encoded as HEX
     *         refundAddress:
     *           type: string
     *           description: Address that should be specified as refund address for EVM lockup transactions
     *         bip21:
     *           type: string
     *           description: BIP-21 for the UTXO onchain lockup of the user
     */

    /**
     * @openapi
     * components:
     *   schemas:
     *     ChainResponse:
     *       type: object
     *       required: ["id", "claimDetails", "lockupDetails"]
     *       properties:
     *         id:
     *           type: string
     *           description: ID of the created Reverse Swap
     *         referralId:
     *           type: string
     *           description: Referral ID used for the swap
     *         claimDetails:
     *           $ref: '#/components/schemas/ChainSwapData'
     *         lockupDetails:
     *           $ref: '#/components/schemas/ChainSwapData'
     */

    /**
     * @openapi
     * /swap/chain:
     *   post:
     *     description: Create a new Chain Swap from chain to chain. Omit "userLockAmount" and "serverLockAmount" to create a Chain Swap with an arbitrary amount
     *     tags: [Chain Swap]
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/ChainRequest'
     *     responses:
     *       '201':
     *         description: The created Chain Swap
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/ChainResponse'
     *       '400':
     *         description: Error that caused the Chain Swap creation to fail
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/ErrorResponse'
     */
    router.post('/chain', this.handleError(this.createChain));

    /**
     * @openapi
     * components:
     *   schemas:
     *     ChainSwapTransaction:
     *       type: object
     *       required: ["transaction"]
     *       properties:
     *         transaction:
     *           type: object
     *           required: ["id"]
     *           properties:
     *             id:
     *               type: string
     *               description: ID of the transaction
     *             hex:
     *               type: string
     *               description: The transaction encoded as HEX; set for UTXO based chains
     *         timeout:
     *           type: object
     *           required: ["blockHeight"]
     *           properties:
     *             blockHeight:
     *               type: number
     *               description: Timeout block height of the onchain HTLC
     *             eta:
     *               type: number
     *               description: Expected UNIX timestamp of the expiry of the onchain HTLC if not expired already
     *
     *     ChainSwapTransactions:
     *       type: object
     *       properties:
     *         userLock:
     *           $ref: '#/components/schemas/ChainSwapTransaction'
     *         serverLock:
     *           $ref: '#/components/schemas/ChainSwapTransaction'
     */

    /**
     * @openapi
     * /swap/chain/{id}/transactions:
     *   get:
     *     description: Gets the transactions of a Chain Swap
     *     tags: [Chain Swap]
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *         description: ID of the Swap
     *     responses:
     *       '200':
     *         description: Transactions of the Chain Swap
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/ChainSwapTransactions'
     *       '404':
     *         description: When no Chain Swap with the ID could be found
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
      '/chain/:id/transactions',
      this.handleError(this.getChainSwapTransactions),
    );

    /**
     * @openapi
     * components:
     *   schemas:
     *     ChainSwapSigningDetails:
     *       type: object
     *       required: ["pubNonce", "publicKey", "transactionHash"]
     *       properties:
     *         pubNonce:
     *           type: string
     *           description: Public nonce of the client for the session, encoded as HEX
     *         publicKey:
     *           type: string
     *           description: Public key of the server that was used in the aggregated public key
     *         transactionHash:
     *           type: string
     *           description: Transaction hash which should be signed, encoded as HEX
     */

    /**
     * @openapi
     * /swap/chain/{id}/claim:
     *   get:
     *     description: Gets the server claim transaction signing details
     *     tags: [Chain Swap]
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *         description: ID of the Swap
     *     responses:
     *       '200':
     *         description: Server claim signing details
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/ChainSwapSigningDetails'
     *       '404':
     *         description: When no Chain Swap with the ID could be found
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
      '/chain/:id/claim',
      this.handleError(this.getChainSwapClaimDetails),
    );

    /**
     * @openapi
     * components:
     *   schemas:
     *     ChainSwapSigningRequest:
     *       type: object
     *       properties:
     *         preimage:
     *           type: string
     *           description: Preimage of the Chain Swap, encoded as HEX
     *         signature:
     *           $ref: '#/components/schemas/PartialSignature'
     *         toSign:
     *           type: object
     *           required: ["pubNonce", "transaction", "index"]
     *           properties:
     *             pubNonce:
     *               type: string
     *               description: Public nonce of the client for the session encoded as HEX
     *             transaction:
     *               type: string
     *               description: Transaction which should be signed encoded as HEX
     *             index:
     *               type: number
     *               description: Index of the input of the transaction that should be signed
     */

    /**
     * @openapi
     * /swap/chain/{id}/claim:
     *   post:
     *     description: Send Boltz a partial signature for its claim transaction and get a partial signature for the clients claim in return
     *     tags: [Chain Swap]
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
     *             $ref: '#/components/schemas/ChainSwapSigningRequest'
     *     responses:
     *       '200':
     *         description: Partial signature for the claim transaction of the user
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/PartialSignature'
     *       '404':
     *         description: When no Chain Swap with the ID could be found
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
    router.post('/chain/:id/claim', this.handleError(this.claimChainSwap));

    /**
     * @openapi
     * /swap/chain/{id}/refund:
     *   get:
     *     tags: [Chain Swap]
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
     *               type: object
     *               required: ["signature"]
     *               properties:
     *                 signature:
     *                   type: string
     *                   description: EIP-712 signature with which a cooperative refund can be executed onchain
     *       '400':
     *         description: Error that caused signature request to fail
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/ErrorResponse'
     */
    router.get(
      '/chain/:id/refund',
      // We can use the exact same handler as for Submarine Swaps
      this.handleError(this.refundEvm),
    );

    /**
     * @openapi
     * /swap/chain/{id}/refund:
     *   post:
     *     description: Requests a partial signature for a cooperative Chain Swap refund transaction
     *     tags: [Chain Swap]
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
     *             $ref: '#/components/schemas/RefundRequest'
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
      '/chain/:id/refund',
      this.handleError(
        this.signUtxoRefund(this.service.swapManager.chainSwapSigner),
      ),
    );

    /**
     * @openapi
     * components:
     *   schemas:
     *     Quote:
     *       type: object
     *       required: ["amount"]
     *       properties:
     *         amount:
     *           type: number
     *           description: New quote for a Swap. Amount that the server will lock for Chain Swaps
     */

    /**
     * @openapi
     * /swap/chain/{id}/quote:
     *   get:
     *     tags: [Chain Swap]
     *     description: Gets a new quote for an overpaid or underpaid Chain Swap
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *         description: ID of the Swap
     *     responses:
     *       '200':
     *         description: The new quote
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/Quote'
     *       '400':
     *         description: When the Chain Swap is not eligible for a new quote
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/ErrorResponse'
     */
    router.get('/chain/:id/quote', this.handleError(this.chainSwapQuote));

    /**
     * @openapi
     * components:
     *   schemas:
     *     QuoteResponse:
     *       type: object
     */

    /**
     * @openapi
     * /swap/chain/{id}/quote:
     *   post:
     *     tags: [Chain Swap]
     *     description: Accepts a new quote for a Chain Swap
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
     *             $ref: '#/components/schemas/Quote'
     *     responses:
     *       '202':
     *         description: The new quote was accepted
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/QuoteResponse'
     *       '400':
     *         description: When the Chain Swap is not eligible for a new quote
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/ErrorResponse'
     */
    router.post(
      '/chain/:id/quote',
      this.handleError(this.chainSwapAcceptQuote),
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
     *       required: ["status"]
     *       properties:
     *         status:
     *           type: string
     *           description: Status of the Swap
     *         zeroConfRejected:
     *           type: boolean
     *           description: Whether 0-conf was accepted for the lockup transaction of the user
     *         transaction:
     *           type: object
     *           description: Details of the transaction relevant to the status update
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

  private getSubmarine = async (req: Request, res: Response) => {
    const referral = await this.getReferralFromHeader(req);
    successResponse(
      res,
      RateProviderTaproot.serializePairs(
        this.service.rateProvider.providers[
          SwapVersion.Taproot
        ].getSubmarinePairs(referral),
      ),
    );
  };

  private createSubmarine = async (req: Request, res: Response) => {
    const { to, from, invoice, webhook, pairHash, refundPublicKey } =
      validateRequest(req.body, [
        { name: 'to', type: 'string' },
        { name: 'from', type: 'string' },
        { name: 'webhook', type: 'object', optional: true },
        { name: 'invoice', type: 'string', optional: true },
        { name: 'pairHash', type: 'string', optional: true },
        { name: 'refundPublicKey', type: 'string', hex: true, optional: true },
      ]);
    const referralId = parseReferralId(req);

    const { pairId, orderSide } = this.service.convertToPairAndSide(from, to);
    const webHookData = this.parseWebHook(webhook);

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
        webHookData,
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
        webHook: webHookData,
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
      await this.service.transactionFetcher.getSubmarineTransaction(id);
    successResponse(res, {
      id: transactionId,
      hex: transactionHex,
      timeoutBlockHeight,
      timeoutEta,
    });
  };

  private getSubmarinePreimage = async (req: Request, res: Response) => {
    const { id } = validateRequest(req.params, [
      { name: 'id', type: 'string' },
    ]);

    successResponse(res, {
      preimage: await this.service.getSubmarinePreimage(id),
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

  private getReverse = async (req: Request, res: Response) => {
    const referral = await this.getReferralFromHeader(req);
    successResponse(
      res,
      RateProviderTaproot.serializePairs(
        this.service.rateProvider.providers[
          SwapVersion.Taproot
        ].getReversePairs(referral),
      ),
    );
  };

  private createReverse = async (req: Request, res: Response) => {
    const {
      to,
      from,
      webhook,
      address,
      pairHash,
      description,
      routingNode,
      preimageHash,
      claimAddress,
      invoiceExpiry,
      invoiceAmount,
      onchainAmount,
      claimCovenant,
      claimPublicKey,
      descriptionHash,
      addressSignature,
    } = validateRequest(req.body, [
      { name: 'to', type: 'string' },
      { name: 'from', type: 'string' },
      { name: 'preimageHash', type: 'string', hex: true },
      { name: 'address', type: 'string', optional: true },
      { name: 'webhook', type: 'object', optional: true },
      { name: 'pairHash', type: 'string', optional: true },
      { name: 'description', type: 'string', optional: true },
      { name: 'routingNode', type: 'string', optional: true },
      { name: 'claimAddress', type: 'string', optional: true },
      { name: 'invoiceAmount', type: 'number', optional: true },
      { name: 'invoiceExpiry', type: 'number', optional: true },
      { name: 'onchainAmount', type: 'number', optional: true },
      { name: 'claimCovenant', type: 'boolean', optional: true },
      { name: 'descriptionHash', type: 'string', hex: true, optional: true },
      { name: 'claimPublicKey', type: 'string', hex: true, optional: true },
      { name: 'addressSignature', type: 'string', hex: true, optional: true },
    ]);
    const referralId = parseReferralId(req);

    checkPreimageHashLength(preimageHash);

    const { pairId, orderSide } = this.service.convertToPairAndSide(from, to);
    const webHookData = this.parseWebHook(webhook);

    const response = await this.service.createReverseSwap({
      pairId,
      pairHash,
      orderSide,
      referralId,
      routingNode,
      description,
      preimageHash,
      claimAddress,
      invoiceAmount,
      onchainAmount,
      claimCovenant,
      invoiceExpiry,
      claimPublicKey,
      descriptionHash,
      userAddress: address,
      webHook: webHookData,
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
      await this.service.transactionFetcher.getReverseSwapTransaction(id);
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
        { name: 'preimage', type: 'string', hex: true },
        { name: 'index', type: 'number', optional: true },
        { name: 'pubNonce', type: 'string', hex: true, optional: true },
        { name: 'transaction', type: 'string', hex: true, optional: true },
      ],
    );

    const toSignParams = [pubNonce, index, transaction];
    const allDefined = toSignParams.every((param) => param !== undefined);
    const allUndefined = toSignParams.every((param) => param === undefined);

    if (!allDefined && !allUndefined) {
      throw 'pubNonce, index and transaction must be all set or all undefined';
    }

    const sig = await this.service.musigSigner.signReverseSwapClaim(
      params.id || id,
      preimage,
      allDefined
        ? {
            index,
            theirNonce: pubNonce,
            rawTransaction: transaction,
          }
        : undefined,
    );

    successResponse(
      res,
      sig !== undefined
        ? {
            pubNonce: getHexString(sig.pubNonce),
            partialSignature: getHexString(sig.signature),
          }
        : {},
    );
  };

  private getChain = async (req: Request, res: Response) => {
    const referral = await this.getReferralFromHeader(req);
    successResponse(
      res,
      RateProviderTaproot.serializePairs(
        this.service.rateProvider.providers[SwapVersion.Taproot].getChainPairs(
          referral,
        ),
      ),
    );
  };

  // TODO: claim covenant
  private createChain = async (req: Request, res: Response) => {
    const {
      to,
      from,
      webhook,
      pairHash,
      referralId,
      preimageHash,
      claimAddress,
      claimPublicKey,
      userLockAmount,
      refundPublicKey,
      serverLockAmount,
    } = validateRequest(req.body, [
      { name: 'to', type: 'string' },
      { name: 'from', type: 'string' },
      { name: 'webhook', type: 'object', optional: true },
      { name: 'preimageHash', type: 'string', hex: true },
      { name: 'pairHash', type: 'string', optional: true },
      { name: 'referralId', type: 'string', optional: true },
      { name: 'claimAddress', type: 'string', optional: true },
      { name: 'userLockAmount', type: 'number', optional: true },
      { name: 'serverLockAmount', type: 'number', optional: true },
      { name: 'claimPublicKey', type: 'string', hex: true, optional: true },
      { name: 'refundPublicKey', type: 'string', hex: true, optional: true },
    ]);

    checkPreimageHashLength(preimageHash);
    const webHookData = this.parseWebHook(webhook);

    const { pairId, orderSide } = this.service.convertToPairAndSide(from, to);
    const response = await this.service.createChainSwap({
      pairId,
      pairHash,
      orderSide,
      referralId,
      preimageHash,
      claimAddress,
      claimPublicKey,
      userLockAmount,
      refundPublicKey,
      serverLockAmount,
      webHook: webHookData,
    });

    await markSwap(this.countryCodes, req.ip, response.id);

    this.logger.verbose(`Created Chain Swap with id: ${response.id}`);
    this.logger.silly(`Chain swap ${response.id}: ${stringify(response)}`);

    createdResponse(res, response);
  };

  private getChainSwapClaimDetails = async (req: Request, res: Response) => {
    const { id } = validateRequest(req.params, [
      { name: 'id', type: 'string' },
    ]);
    const swap = await ChainSwapRepository.getChainSwap({
      id,
    });
    if (swap === null || swap === undefined) {
      errorResponse(this.logger, req, res, Errors.SWAP_NOT_FOUND(id), 404);
      return;
    }

    let details: Awaited<
      ReturnType<
        typeof this.service.swapManager.chainSwapSigner.getCooperativeDetails
      >
    >;

    // Pending claims are handled in the DeferredClaimer
    if (swap.status !== SwapUpdateEvent.TransactionClaimPending) {
      details =
        await this.service.swapManager.chainSwapSigner.getCooperativeDetails(
          swap,
        );
    } else {
      details =
        await this.service.swapManager.deferredClaimer.getCooperativeDetails(
          swap,
        );
    }

    successResponse(res, {
      pubNonce: getHexString(details.pubNonce),
      publicKey: getHexString(details.publicKey),
      transactionHash: getHexString(details.transactionHash),
    });
  };

  private claimChainSwap = async (req: Request, res: Response) => {
    const { id } = validateRequest(req.params, [
      { name: 'id', type: 'string' },
    ]);
    const { preimage, toSign, signature } = validateRequest(req.body, [
      { name: 'toSign', type: 'object', optional: true },
      { name: 'signature', type: 'object', optional: true },
      { name: 'preimage', type: 'string', hex: true, optional: true },
    ]);

    let toSignParsed: any | undefined;
    if (toSign !== undefined) {
      toSignParsed = validateRequest(toSign, [
        { name: 'index', type: 'number' },
        { name: 'pubNonce', type: 'string', hex: true },
        { name: 'transaction', type: 'string', hex: true },
      ]);
    }

    let partialSignatureParsed: PartialSignature | undefined;
    if (signature !== undefined) {
      const parsed = validateRequest(signature, [
        { name: 'pubNonce', type: 'string', hex: true },
        { name: 'partialSignature', type: 'string', hex: true },
      ]);
      partialSignatureParsed = {
        pubNonce: parsed.pubNonce,
        signature: parsed.partialSignature,
      };
    }

    const swap = await ChainSwapRepository.getChainSwap({
      id,
    });
    if (swap === null || swap === undefined) {
      errorResponse(this.logger, req, res, Errors.SWAP_NOT_FOUND(id), 404);
      return;
    }

    // Pending claims are handled in the DeferredClaimer
    if (swap.status !== SwapUpdateEvent.TransactionClaimPending) {
      if (toSignParsed === undefined) {
        throw ApiErrors.UNDEFINED_PARAMETER('toSign');
      }

      const sig = await this.service.swapManager.chainSwapSigner.signClaim(
        swap,
        toSignParsed,
        preimage,
        partialSignatureParsed,
      );
      successResponse(res, {
        pubNonce: getHexString(sig.pubNonce),
        partialSignature: getHexString(sig.signature),
      });
    } else {
      if (partialSignatureParsed === undefined) {
        throw ApiErrors.UNDEFINED_PARAMETER('signature');
      }

      await this.service.swapManager.deferredClaimer.broadcastCooperative(
        swap,
        partialSignatureParsed.pubNonce,
        partialSignatureParsed.signature,
      );
      successResponse(res, {});
    }
  };

  private getChainSwapTransactions = async (req: Request, res: Response) => {
    const { id } = validateRequest(req.params, [
      { name: 'id', type: 'string' },
    ]);

    const chainSwap = await ChainSwapRepository.getChainSwap({ id });
    if (chainSwap === null || chainSwap === undefined) {
      errorResponse(this.logger, req, res, Errors.SWAP_NOT_FOUND(id), 404);
      return;
    }

    successResponse(
      res,
      await this.service.transactionFetcher.getChainSwapTransactions(chainSwap),
    );
  };

  private signUtxoRefund =
    (signer: MusigSigner | ChainSwapSigner) =>
    async (req: Request, res: Response) => {
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

      const sig = await signer.signRefund(
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

  private refundEvm = async (req: Request, res: Response) => {
    const { id } = validateRequest(req.params, [
      { name: 'id', type: 'string' },
    ]);

    successResponse(res, {
      signature: await this.service.swapManager.eipSigner.signSwapRefund(id),
    });
  };

  private chainSwapQuote = async (req: Request, res: Response) => {
    const { id } = validateRequest(req.params, [
      { name: 'id', type: 'string' },
    ]);

    successResponse(res, {
      amount: await this.service.swapManager.renegotiator.getQuote(id),
    });
  };

  private chainSwapAcceptQuote = async (req: Request, res: Response) => {
    const { id } = validateRequest(req.params, [
      { name: 'id', type: 'string' },
    ]);
    const { amount } = validateRequest(req.body, [
      { name: 'amount', type: 'number' },
    ]);

    await this.service.swapManager.renegotiator.acceptQuote(id, amount);
    successResponse(res, {}, 202);
  };

  private getSwapStatus = async (req: Request, res: Response) => {
    const { id } = validateRequest(req.params, [
      { name: 'id', type: 'string' },
    ]);

    const response = await this.swapInfos.get(id);

    if (response) {
      successResponse(res, response);
    } else {
      errorResponse(this.logger, req, res, Errors.SWAP_NOT_FOUND(id), 404);
    }
  };

  private parseWebHook = (
    data?: Record<string, any>,
  ): WebHookData | undefined => {
    if (data === undefined) {
      return undefined;
    }

    const res = validateRequest(data, [
      { name: 'url', type: 'string' },
      { name: 'status', type: 'object', optional: true },
      { name: 'hashSwapId', type: 'boolean', optional: true },
    ]);

    if (res.status) {
      validateArray('status', res.status, 'string', 21);

      const possibleStatus = new Set<string>(Object.values(SwapUpdateEvent));
      for (const status of res.status as any[]) {
        if (!possibleStatus.has(status)) {
          throw ApiErrors.INVALID_SWAP_STATUS(status);
        }
      }
    }

    return res;
  };

  private getReferralFromHeader = async (req: Request) => {
    const referral = req.header('referral');
    if (referral === undefined) {
      return null;
    }

    return ReferralRepository.getReferralById(referral);
  };
}

export default SwapRouter;
