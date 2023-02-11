export type Wallet = {
  isInternal: boolean;
  isBlocked: boolean;
  address: string;
  riskScore: number;
};

export type Transaction = {
  sendingWalletId: string;
  receivingWalletId: string;
};

export type Context = {
  init: { sendingWalletId: string; receivingWalletId: string };
  locks: string[];
  result?: ApprovalResult;
  sender?: Wallet;
  receiver?: Wallet;
};

export type WalletPair = Required<Pick<Context, "sender" | "receiver">>;

export type LockMachineContext = {
  walletIds: string[];
  internalWalletLockIds: string[];
};

export type WalletUpdate = {
  address: string;
  newScore: number;
  doBlock: boolean;
};
export type ApprovalState = "unknown" | "approved" | "rejected";

export type ApprovalResult = {
  updates: WalletUpdate[];
  approval: "unknown" | "approved" | "rejected";
};

export type ApprovalComputing = {
  postApprovalScores: {
    doBlockSender: boolean;
    doBlockReceiver: boolean;
    senderScore: number;
    receiverScore: number;
  };
};

export type ApprovalMachineContext = { approval: ApprovalState } & WalletPair &
  ApprovalComputing;
