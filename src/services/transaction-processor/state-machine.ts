import {
  AnyAssignAction,
  AnyEventObject,
  assign,
  createMachine,
  DoneInvokeEvent,
} from "xstate";
import {
  CryptoTransactionContext,
  CryptoTransactionWalletContext,
  TransactionWallets,
} from "../../model/model";

const getMockWallets = (
  _context: CryptoTransactionContext,
  _event: AnyEventObject
): Promise<TransactionWallets> =>
  Promise.resolve({
    receiver: {
      address: "b",
      blocked: false,
      isExternal: true,
      riskScore: 5,
    },
    sender: { address: "b", blocked: false, isExternal: false, riskScore: 200 },
  });

export const cryptoTransactionStateMachine = () => {
  /** @xstate-layout N4IgpgJg5mDOIC5QBUBOBDAdrdBjALgJYD2mABAJKb5jVkAKqxucsxqAdGljgSeVRp0ASmBaEAbpADEEUmA6FME4gGsFMfAHV0AG11h8sANoAGALqJQAB2KxCRUlZAAPRAFoAjABYArB1MATl8ADgA2QNMAJkDAsIBmT3iAGhAAT0Qo03iOBIB2X28QqJD4vM9IvIBfKtTubDxHAWpafAYmFlg2TnreJsoWkTEwSRkwVCZOa110fAAzdgBbDk0dfUMTC2dbeybnNwREjl944t8o3188+Ljs31SMhCyojj9gsKjr4NjA+Jq6jANPikAZCNqMZisdgcNYGIxkURsXRSCDSMyWJAgHYOfj7DzxKIvWLZIq+QLeQKecIPRC+UxhDjFMLMzxRbwRGKBf4gXqNfig1rtSFdaGwjYIuDEZEyYyeDE2Ow4pyYg7uAmmAJ5cLhIJRMLRML3dK0hIcVnxK5lE6eTymaq1HmAvr8wSCiGdbocd2sJRQXpKzBaBwACwAcsQAKIuGioTB6MX4NFbTHYvYqzKfDg3AmlQJ5NneTxGx6286MvyhE7lIrxMLc3nA5pgoUe6Herq+-1NIP4MOR6PjOO6BNouXbRVp0AHQmeDi-EpkzzMinU40IG2mfxlPJa8khbKUkL1p18kGuujtz2XztOgM94NRmNDhOKTA4vSyeSvlTqDjoazWLQECPoOegAMq4OwYDouOuy4um66ZiUhYxOy+rlLWNIIBEs5FjuYTeHkm7nFyDoNv057gh0UKcNemB+re3YhiBsbxnocKvu+ujSOMkwcNMswLKgyz-oBmDAQOrG6BBUEwSmE7wVOiBJP4paePmST5gR3hYaELyFBUbIFMEhJHmRJ6NgKF7USKtE2fY9Fdvw94sc+7GGBwrpSTJqBgAAqtYECzDKyYKnBypKQg3glHOISFER8RFOSdpYTus7ZtEnx+Eu5zHjwp5Nm69ltvZN48HezGSW56z4J5LTeZBvkBUFNCorK8pYgpEWuIghaBFm+7FCZBGmKUWGlLOIQ+Iltp5N4815HW5n5ZZlEtjRXr2RKABWYj9PQtB6PgaSfpgChKD+CiXjte38gdQ5pHJYUBniCAhHFHB6pES47nam4pGuvwaoRHwhDuFpFt4fzLUCFGDFRwpXltoi7ZZ91HSdvHQgJ8xLJtiM3Wjh26I9oWdeFmCveE3jljc0QGlcxSpaEuTeKYVJg3NgRxdDDqYMQEBwM45EuvD622bBL0IWqRFzpEiVxeSh5hFh7ghJ91xQyEe5g0l9oAitcPNpe0Ii2eYuiOIKKS5OPUIF4wTHFEkOsvNlzO6l-WEoahpZFS5yjXlsOi8bxWcAmsASki1vyRTr1eIajJ0gSMSLmUepYbWNPlFNi2GoR5L646hsh0ViMlYjZXYBVvbhq5bE1Tbil2+4Fz9QROds78rKElhpYamSlyLfSQTzdDBvB+bofl3ZleOYxzmVU+Ddwk33Wqj4-Xs0unxBGEU2JADjznC8WSmIWvt01SQfOlPZetrPHpVxTLlVSvHlKFxa+U9LtqztvHwiJxAPj4LC+p+pEXPlkMIc1QZmQnrfQq1kZ74yfvPcqTFez12HO5WqXkhw+X8oFYKEBv6vR8P4a47MPi1n3iEGsqUiiMjBpucIBFCjBBvgVKyCMH4cFwKgHEuA9AADF0CEF0AAV18mQhCNxs5FmKFqCkyiVZrlrDkdkU0pp2kPhaJaCDuFrRNj0Cy-QACCAEmAx2erbA48QbixRKFEG4kRfARDyFhQImYtIOOKHadxi0uGrTFiYrgZj+Qoz2pAWRkV6H+DZD4JI7Jfp+D7vSdWphRpLkShcM4Bji6TyQbwja10olEyHMdWJdsEj+DBu4tm+9CQLXGjuLM3M5pZQ+EWKINQahAA */
  const stateMachine = createMachine<CryptoTransactionContext>(
    {
      id: "Transaction Intent Processor",
      initial: "Transaction Intent Received",
      predictableActionArguments: true,

      context: {
        state: "initial",
        transaction: { amount: 0, receiver: "b", sender: "a" },
      },
      states: {
        "Transaction Intent Received": {
          invoke: {
            id: "getWallets",
            src: getMockWallets,
            onDone: {
              target: "Wallets Resolved",
              actions: assign({
                state: (): CryptoTransactionContext["state"] => "resolved",
                sender: (_ctx, evt: DoneInvokeEvent<TransactionWallets>) =>
                  evt.data.sender,
                receiver: (_ctx, evt: DoneInvokeEvent<TransactionWallets>) =>
                  evt.data.receiver,
              }) as AnyAssignAction<CryptoTransactionContext, any>,
            },
            onError: {
              target: "criticalFailure",
            },
          },
        },

        "Wallets Resolved": {
          always: [
            {
              target: "ProcessingTransitionWithExternalWallet",
              cond: "Has External Wallet",
            },
            "ProcessingTransitionWithNoExternalWallet",
          ],
        },

        ProcessingTransitionWithNoExternalWallet: {
          always: [
            {
              target: "Transaction Approved",
              cond: "Score Sum < 300",
            },
            "Process Rejection Penalty",
          ],
        },

        ProcessingTransitionWithExternalWallet: {
          initial: "initial",

          states: {
            initial: {
              invoke: {
                id: "appendExternalScore",

                src: () => {
                  console.warn("appending external scores...");
                  return Promise.resolve();
                },

                onError: {
                  actions: ["fatalError"],
                  target: "#Transaction Intent Processor.criticalFailure",
                },

                onDone: "InternalScoreUpdated",
              },
            },

            InternalScoreUpdated: {
              always: [
                {
                  target:
                    "#Transaction Intent Processor.Process Rejection Penalty",
                  cond: "internal Score >= 100 or blocked wallet",
                },
                "#Transaction Intent Processor.Transaction Approved",
              ],
            },
          },
        },

        criticalFailure: { type: "final" },
        "Transaction Approved": { type: "final" },

        "Transaction Rejected": {
          type: "final",
        },

        "Process Rejection Penalty": {
          invoke: {
            id: "Process Rejection Penaly",
            src: (_ctx, action) => {
              console.warn(action, "processing rejection penalty...");
              return Promise.resolve();
            },
            onDone: {
              target: "Transaction Rejected",
            },
            onError: {
              actions: ["fatalError"],
              target: "criticalFailure",
            },
          },
        },
      },
    },
    {
      guards: {
        "Score Sum < 300": (context: CryptoTransactionContext) => {
          const ctx = context as CryptoTransactionWalletContext;

          const score = ctx.sender.riskScore + ctx.receiver.riskScore;
          return score < 300;
        },
        "internal Score >= 100 or blocked wallet": (
          context: CryptoTransactionContext
        ) => {
          const ctx = context as CryptoTransactionWalletContext;
          const internal = [ctx.sender, ctx.receiver].find(
            (x) => !x.isExternal
          )!;

          return (
            ctx.sender.blocked ||
            ctx.receiver.blocked ||
            internal.riskScore > 100
          );
        },
        "Has External Wallet": (context: CryptoTransactionContext) => {
          const ctx = context as CryptoTransactionWalletContext;
          return ctx.sender.isExternal || ctx.receiver.isExternal;
        },
      },
    }
  );

  return stateMachine;
};
