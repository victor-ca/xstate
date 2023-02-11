import { LockService, RiskService } from "./model/services";
import { createXStateTransactionProcessor } from "./services/x-state.transation-processor";

const lockService: LockService = {
  aquireLocks: (args) => {
    console.warn(`requesting locks for ${args}`);
    return Promise.resolve(args.map((x) => x + "-lock"));
  },
  releaseLocks: (args) => {
    console.warn(`releasing locks: ${args}`);
    return Promise.resolve();
  },
};

const riskService: RiskService = {
  updateWallet: (walletId, score, doBlock = false) => {
    return Promise.resolve({ walletId, score, doBlock });
  },
  fecthWallet(walletId) {
    if (walletId === "a") {
      return Promise.resolve({
        address: "a",
        isBlocked: false,
        isInternal: true,
        riskScore: 600,
      });
    }
    return Promise.resolve({
      address: "b",
      isBlocked: false,
      isInternal: true,
      riskScore: 600,
    });
  },
};

const transactionApprovalService = createXStateTransactionProcessor(
  riskService,
  lockService
);

transactionApprovalService
  .processTransaction({
    receivingWalletId: "a",
    sendingWalletId: "b",
  })
  .then((x) => console.warn(x));
