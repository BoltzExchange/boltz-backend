export type Error = {
  message: string;
  code: string;
};

export type WalletInfo = {
  derivationPath: string;
  highestUsedIndex: number;
};
