export interface Wallet {
  address: string;
  riskScore?: number;
  blocked: boolean;
  isExternal: boolean;
}

export interface Transaction {
  sender: string;
  receiver: string;
  amount: number;
}

export interface Context {
  receiver: Wallet;
  sender: Wallet;
  transaction: Transaction;
}
