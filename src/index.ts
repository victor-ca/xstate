import { getMockScoringService } from "./services/mock-scoring.service";
import { createXStateTransactionProcessor } from "./services/transaction-processor/x-state.transation-processor";

const scoringService = getMockScoringService();
const transactionProcessor = createXStateTransactionProcessor(scoringService);

transactionProcessor.processTransaction({
  amount: 10,
  sender: "a",
  receiver: "b",
});
