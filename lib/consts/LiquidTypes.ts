type MyLiquidBalances = {
  trusted: Record<string, number>;
  untrusted_pending: Record<string, number>;
};

export type LiquidBalances = {
  mine: MyLiquidBalances;
};

export type AddressInfo = {
  address: string;
  scriptPubKey: string;
  ismine: boolean;
  solvable: boolean;
  desc: string;
  iswatchonly: boolean;
  isscript: boolean;
  iswitness: boolean;
  witness_version: number;
  witness_program: string;
  pubkey: string;
  confidential: string;
  confidential_key: string;
  unconfidential: string;
  ischange: boolean;
  timestamp: number;
  hdkeypath: string;
  hdseedid: string;
  hdmasterfingerprint: string;
  labels?: string[];
};
