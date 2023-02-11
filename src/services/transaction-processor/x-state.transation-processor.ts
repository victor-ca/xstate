import { interpret } from "xstate";
import { ScoringService, TransactionProcessor } from "../../model/services";
import { Transaction } from "../../model/model";
import { cryptoTransactionStateMachine } from "./state-machine";

export const createXStateTransactionProcessor = (
  _scoringService: ScoringService
): TransactionProcessor => {
  return {
    processTransaction: async (_transaction: Transaction): Promise<unknown> => {
      return new Promise((resolve) => {
        const processor = interpret(cryptoTransactionStateMachine());
        processor
          // .onEvent((evt) => console.warn(`>>>${evt.type}`))

          .onTransition((state, evt) => {
            console.log(
              `${evt.type} >>> ${JSON.stringify(
                state.value
              )}` /*, state.context*/
            );
          })
          .start();

        processor.onDone(resolve);
      });
    },
  };
};
