/*
 * The API is implemented in the sidecar
 */

/**
 * @openapi
 * tags:
 *   name: Quotes
 *   description: Quotes and transaction encoding for token swaps
 */

/**
 * @openapi
 * components:
 *   schemas:
 *     TokenQuote:
 *       type: object
 *       required: ["quote", "data"]
 *       properties:
 *         quote:
 *           type: string
 *           description: Quote for the token swap
 *         data:
 *           type: object
 *           additionalProperties: true
 *
 *     Call:
 *       type: object
 *       required: ["to", "value", "data"]
 *       properties:
 *         to:
 *           type: string
 *           description: Contract address to call
 *         value:
 *           type: string
 *           description: Value to send with the call
 *         data:
 *           type: string
 *           description: Encoded function calldata
 */

/**
 * @openapi
 * /quote/{currency}/in:
 *   get:
 *     tags: [Quotes]
 *     description: Gets quotes for a token swap with specified input amount
 *     parameters:
 *       - in: path
 *         name: currency
 *         required: true
 *         schema:
 *           type: string
 *         description: Network for the token swap
 *       - in: query
 *         name: tokenIn
 *         required: true
 *         schema:
 *           type: string
 *         description: Token to swap from
 *       - in: query
 *         name: tokenOut
 *         required: true
 *         schema:
 *           type: string
 *         description: Token to swap to
 *       - in: query
 *         name: amountIn
 *         required: true
 *         schema:
 *           type: string
 *         description: Amount to swap
 *     responses:
 *       '200':
 *         description: Quotes for the token swap sorted by highest output (descending)
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/TokenQuote'
 *       '400':
 *         description: Unprocessable request parameters
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '404':
 *         description: When the network is not supported
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

/**
 * @openapi
 * /quote/{currency}/out:
 *   get:
 *     tags: [Quotes]
 *     description: Gets quotes for a token swap with specified output amount
 *     parameters:
 *       - in: path
 *         name: currency
 *         required: true
 *         schema:
 *           type: string
 *         description: Network for the token swap
 *       - in: query
 *         name: tokenIn
 *         required: true
 *         schema:
 *           type: string
 *         description: Token to swap from
 *       - in: query
 *         name: tokenOut
 *         required: true
 *         schema:
 *           type: string
 *         description: Token to swap to
 *       - in: query
 *         name: amountOut
 *         required: true
 *         schema:
 *           type: string
 *         description: Amount to receive from swap
 *     responses:
 *       '200':
 *         description: Quotes for the token swap sorted by lowest input (ascending)
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/TokenQuote'
 *       '400':
 *         description: Unprocessable request parameters
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '404':
 *         description: When the network is not supported
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

/**
 * @openapi
 * /quote/{currency}/encode:
 *   post:
 *     tags: [Quotes]
 *     description: Encodes calldata for a token swap
 *     parameters:
 *       - in: path
 *         name: currency
 *         required: true
 *         schema:
 *           type: string
 *         description: Network for the token swap
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - data
 *               - recipient
 *               - amountIn
 *               - amountOutMin
 *             properties:
 *               recipient:
 *                 type: string
 *                 description: Address to send the tokens to
 *               amountIn:
 *                 type: string
 *                 description: Amount of tokens to swap
 *               amountOutMin:
 *                 type: string
 *                 description: Minimum amount of tokens to receive
 *               data:
 *                 type: object
 *                 additionalProperties: true
 *     responses:
 *       '200':
 *         description: Encoded calldata for the token swap
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required: ["calls"]
 *               properties:
 *                 calls:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Call'
 *                   description: Array of contract calls to execute
 *       '400':
 *         description: Unprocessable request parameters
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '404':
 *         description: When the network is not supported
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
