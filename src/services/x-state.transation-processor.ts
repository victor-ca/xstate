import { interpret } from "xstate";
import { ApprovalState, Transaction } from "../model/model";
import { LockService, RiskService } from "../model/services";
import { buildCryptoStateMachine } from "./state-machine";

export type CryptoTransactionApprovalProcessor = {
  processTransaction: (transaction: Transaction) => Promise<ApprovalState>;
};
export const createXStateTransactionProcessor = (
  riskService: RiskService,
  lockService: LockService
): CryptoTransactionApprovalProcessor => {
  return {
    processTransaction: async (
      transaction: Transaction
    ): Promise<ApprovalState> => {
      return new Promise((resolve) => {
        const stateMachine = buildCryptoStateMachine(
          { lockService, riskService },
          transaction
        );

        const transactionProcessor = interpret(stateMachine);
        transactionProcessor
          .start()
          .onDone(() =>
            resolve(transactionProcessor.getSnapshot().context.result!.approval)
          );
      });
    },
  };
};
