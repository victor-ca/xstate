import { Wallet } from "./model";

export type WalletLockService = {
  releaseLocks(locks: string[]): Promise<unknown>;
  aquireLocks(wallets: string[]): Promise<string[]>;
};

export type WalletRiskService = {
  fecthWallet: (walletId: string) => Promise<Wallet>;
  updateWallet: (
    walletId: string,
    newScore: number,
    block?: boolean
  ) => Promise<unknown>;
};
