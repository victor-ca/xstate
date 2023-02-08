import {
  AnyEventObject,
  BaseActionObject,
  StateSchema,
  StatesConfig,
} from "xstate";
import { Context } from "../../model/model";

export const transactionProcessorStates: StatesConfig<
  Context,
  StateSchema<Context>,
  AnyEventObject,
  BaseActionObject
> = {
  idle: {
    on: {
      NEW_TRANSACTION: [
        {
          cond: (t: any) => t.sender.isExternal || t.receiver.isExternal,
          target: "getExternalWalletRiskScore",
        },
        {
          cond: (t: any) => t.receiver.blocked,
          target: "blockSender",
        },
        { target: "updateRiskScores" },
      ],
    },
  },
  blockSender: {},
  getExternalWalletRiskScore: {
    on: {
      EXTERNAL_RISK_CAPTURED: {
        target: "updateRiskScores",
      },
    },
  },
  updateRiskScores: {
    on: {
      UPDATE_COMPLETE: {
        target: "processTransaction",
      },
    },
  },
  reject: {
    type: "final",
    // should update risk score
  },
  approve: {
    type: "final",
  },
  blockWallet: {
    on: {
      ALERT_SENT: {
        target: "reject",
      },
    },
  },
  processTransaction: {
    on: {
      TRANSACTION_REJECTED: [
        { target: "reject" },
        {
          cond: () => {
            /** ... */
          },
          target: "blockWallet",
        },
      ],
      TRANSACTION_APPROVED: {
        target: "approve",
      },
    },
  },
};

export type KnownStates = "idle" | "blockSender"; //keyof typeof transactionProcessorStates;
