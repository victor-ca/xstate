import { Wallet } from "./model";

export type LockService = {
  releaseLocks(locks: string[]): Promise<unknown>;
  aquireLocks(wallets: string[]): Promise<string[]>;
};

export type RiskService = {
  fecthWallet: (walletId: string) => Promise<Wallet>;
  updateWallet: (
    walletId: string,
    newScore: number,
    block?: boolean
  ) => Promise<unknown>;
};
