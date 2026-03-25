const requestTimeout = 5_000;

interface Exchange {
  getPrice(baseAsset: string, quoteAsset: string): Promise<number>;
}

export default Exchange;
export { requestTimeout };
