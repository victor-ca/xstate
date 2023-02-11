import { interpret } from "xstate";
import { ApprovalState, Transaction } from "../model/model";
import { WalletLockService, WalletRiskService } from "../model/services";
import { buildCryptoStateMachine } from "./state-machine";

export type TransactionProcessor = {
  processTransaction: (transaction: Transaction) => Promise<ApprovalState>;
};
export const createXStateTransactionProcessor = (
  riskService: WalletRiskService,
  lockService: WalletLockService
): TransactionProcessor => {
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
          // .onTransition((state, evt) => {
          //   console.log(
          //     `${evt.type} >>> ${JSON.stringify(
          //       state.value
          //     )} | ${JSON.stringify(state.context)}` /*, state.context*/
          //   );
          // })
          .start()
          .onDone(() =>
            resolve(transactionProcessor.getSnapshot().context.result!.approval)
          );
      });
    },
  };
};
