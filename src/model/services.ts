import { Transaction, Wallet } from "./model";

export type TransactionProcessor = {
  processTransaction(transaction: Transaction): Promise<unknown>;
};

export type ScoringService = {
  getScoredWallet(walletId: string): Promise<Wallet>;
};
