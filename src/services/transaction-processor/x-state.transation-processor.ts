import { createMachine, interpret } from "xstate";
import { ScoringService, TransactionProcessor } from "../../model/services";
import {
  KnownStates,
  transactionProcessorStates,
} from "./transaction-processor.states";
import { Context, Transaction } from "../../model/model";

export const createXStateTransactionProcessor = (
  scoringService: ScoringService
): TransactionProcessor => {
  return {
    processTransaction: async (transaction: Transaction): Promise<unknown> => {
      const { sender: senderWalletId, receiver: receiverWalletId } =
        transaction;
      const sender = await scoringService.getScoredWallet(senderWalletId);
      const receiver = await scoringService.getScoredWallet(receiverWalletId);

      const stateMachine = createMachine<Context>({
        id: "CRYPTO_TRANSACTION",
        initial: "idle",
        context: {
          sender,
          receiver,
          transaction,
        },
        states: transactionProcessorStates,
      });

      const processor = interpret(stateMachine);
      processor
        .onTransition((state) => {
          const stateType = state.value as KnownStates;
          switch (stateType) {
            case "idle":
              // ...
              break;
            case "blockSender":
              break;
          }
          console.log();
        })
        .start();

      processor.send("NEW_TRANSACTION");

      return Promise.resolve(transaction);
    },
  };
};
