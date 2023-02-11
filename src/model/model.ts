export interface Wallet {
  address: string;
  riskScore: number;
  blocked: boolean;
  isExternal: boolean;
}

export interface Transaction {
  sender: string;
  receiver: string;
  amount: number;
}

type WithTransaction = { transaction: Transaction };
export type TransactionWallets = { receiver: Wallet; sender: Wallet };
type Context<T extends string> = {
  state: T;
};

export type CryptoTransactionIntentOnly = Context<"initial"> & WithTransaction;
export type CryptoTransactionWalletContext = Context<"resolved"> &
  WithTransaction &
  TransactionWallets;

export type CryptoTransactionContext =
  | CryptoTransactionIntentOnly
  | CryptoTransactionWalletContext;
