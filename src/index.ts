// import { getMockScoringService } from "./services/mock-scoring.service";
// import { createXStateTransactionProcessor } from "./services/transaction-processor/x-state.transation-processor";
import { stateMachineV3 } from "./services/transaction-processor/state-machine3";
import { interpret } from "xstate";
// const scoringService = getMockScoringService();
// const transactionProcessor = createXStateTransactionProcessor(scoringService);
const transactionProcessor = interpret(stateMachineV3);
transactionProcessor
  .onTransition((state, evt) => {
    console.log("     -     ");
    console.log(
      `${evt.type} >>> ${JSON.stringify(state.value)} | ${JSON.stringify(
        state.context
      )}` /*, state.context*/
    );
  })
  .start()
  .onDone(() => console.warn("done"));
// transactionProcessor.processTransaction({
//   amount: 10,
//   sender: "a",
//   receiver: "b",
// });
