/*
 * The API is implemented in the sidecar
 */

/**
 * @openapi
 * tags:
 *   name: Funding Address
 *   description: Funding address related endpoints for pre-funding swap addresses
 */

/**
 * @openapi
 * components:
 *   schemas:
 *     FundingTree:
 *       type: object
 *       required:
 *         - refundLeaf
 *       properties:
 *         refundLeaf:
 *           $ref: '#/components/schemas/SwapTreeLeaf'
 */

/**
 * @openapi
 * components:
 *   schemas:
 *     FundingAddressRequest:
 *       type: object
 *       required: ["symbol", "refundPublicKey"]
 *       properties:
 *         symbol:
 *           type: string
 *           description: Currency symbol for the funding address (e.g. BTC, L-BTC)
 *         refundPublicKey:
 *           type: string
 *           description: Public key with which the funding address can be refunded encoded as HEX
 */

/**
 * @openapi
 * components:
 *   schemas:
 *     FundingAddressUpdate:
 *       type: object
 *       required: ["id", "status"]
 *       properties:
 *         id:
 *           type: string
 *           description: ID of the funding address
 *         status:
 *           type: string
 *           description: Current status of the funding address
 *         transaction:
 *           type: object
 *           properties:
 *             id:
 *               type: string
 *               description: ID of the lockup transaction
 *             hex:
 *               type: string
 *               description: Raw lockup transaction encoded as HEX
 *         swapId:
 *           type: string
 *           description: ID of the swap associated with the funding address
 */

/**
 * @openapi
 * components:
 *   schemas:
 *     FundingAddressResponse:
 *       type: object
 *       required: ["id", "address", "timeoutBlockHeight", "serverPublicKey", "tree"]
 *       properties:
 *         id:
 *           type: string
 *           description: ID of the created funding address
 *         address:
 *           type: string
 *           description: Address to which funds should be sent
 *         timeoutBlockHeight:
 *           type: number
 *           description: Block height at which the funding address times out
 *         serverPublicKey:
 *           type: string
 *           description: Public key of Boltz used in the funding address encoded as HEX
 *         blindingKey:
 *           type: string
 *           description: Liquid blinding private key encoded as HEX. Only set for Liquid funding addresses
 *         tree:
 *           $ref: '#/components/schemas/FundingTree'
 */

/**
 * @openapi
 * components:
 *   schemas:
 *     FundingAddressSigningDetails:
 *       type: object
 *       required: ["pubNonce", "publicKey", "transactionHex", "transactionHash"]
 *       properties:
 *         pubNonce:
 *           type: string
 *           description: Public nonce of Boltz for the signing session encoded as HEX
 *         publicKey:
 *           type: string
 *           description: Public key of Boltz encoded as HEX
 *         transactionHex:
 *           type: string
 *           description: Transaction to be signed encoded as HEX
 *         transactionHash:
 *           type: string
 *           description: Hash of the transaction to be signed encoded as HEX
 */

/**
 * @openapi
 * components:
 *   schemas:
 *     FundingAddressClaimRequest:
 *       type: object
 *       required: ["pubNonce", "transactionHash"]
 *       properties:
 *         pubNonce:
 *           type: string
 *           description: Public nonce of the client for the session encoded as HEX
 *         transactionHash:
 *           type: string
 *           description: Hash of the transaction to be signed encoded as HEX
 */

/**
 * @openapi
 * /funding:
 *   post:
 *     description: Create a new funding address for pre-funding swaps
 *     tags: [Funding Address]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/FundingAddressRequest'
 *     responses:
 *       '201':
 *         description: The created funding address
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/FundingAddressResponse'
 *       '400':
 *         description: Error that caused the funding address creation to fail
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '404':
 *         description: When the currency is not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

/**
 * @openapi
 * /funding/{id}:
 *   get:
 *     tags: [Funding Address]
 *     description: Get the status of a funding address
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the funding address
 *     responses:
 *       '200':
 *         description: Status of the funding address
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/FundingAddressUpdate'
 *       '404':
 *         description: When the funding address is not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

/**
 * @openapi
 * /funding/{id}/signature:
 *   get:
 *     tags: [Funding Address]
 *     description: Get the signing details for a funding address to create a swap
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the funding address
 *       - in: query
 *         name: swapId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the swap to fund with this funding address
 *     responses:
 *       '200':
 *         description: Signing details for the funding transaction
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/FundingAddressSigningDetails'
 *       '400':
 *         description: Error that caused the request to fail
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '404':
 *         description: When the funding address is not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

/**
 * @openapi
 * /funding/{id}/signature:
 *   patch:
 *     tags: [Funding Address]
 *     description: Submit a partial signature for a funding address transaction
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the funding address
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PartialSignature'
 *     responses:
 *       '204':
 *         description: Signature was accepted and transaction broadcast
 *       '400':
 *         description: Error that caused the signature submission to fail
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '404':
 *         description: When the funding address is not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

/**
 * @openapi
 * /funding/{id}/claim:
 *   post:
 *     description: Requests a partial signature for a funding address claim transaction
 *     tags: [Funding Address]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the funding address
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/FundingAddressClaimRequest'
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
 *       '404':
 *         description: When the funding address is not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
