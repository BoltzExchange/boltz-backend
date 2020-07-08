import axios from 'axios';

interface Exchange {
  getPrice(baseAsset: string, quoteAsset: string): Promise<number>;
}

const makeRequest = async (url: string): Promise<any> => {
  const response = await axios.get(url, {
    timeout: 5000,
  });

  return response.data;
};

export default Exchange;
export { makeRequest };
