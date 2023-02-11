import { AnyEventObject, assign, createMachine } from "xstate";
import { sendParent } from "xstate/lib/actions";
import {
  ApprovalMachineContext,
  WalletUpdate,
  Wallet,
  Context,
  LockMachineContext,
  ApprovalResult,
  WalletPair,
  ApprovalState,
} from "../model/model";
import { LockService, RiskService } from "../model/services";

const buildPostApprovalUpdates = (
  ctx: ApprovalMachineContext
): WalletUpdate[] => {
  const buildUpdate = (
    w: Wallet,
    { computedScore, doBlock }: { computedScore: number; doBlock: boolean }
  ): WalletUpdate | undefined => {
    const scoreChanged = w.riskScore !== computedScore;
    const isInternal = w.isInternal;
    const stateChangedToBlocked = !w.isBlocked && doBlock;

    const shouldUpdate = isInternal && (scoreChanged || stateChangedToBlocked);

    if (!shouldUpdate) {
      return undefined;
    }

    return { address: w.address, doBlock, newScore: computedScore };
  };
  return [
    buildUpdate(ctx.sender, {
      computedScore: ctx.postApprovalScores.senderScore,
      doBlock: ctx.postApprovalScores.doBlockSender,
    }),
    buildUpdate(ctx.receiver, {
      computedScore: ctx.postApprovalScores.receiverScore,
      doBlock: ctx.postApprovalScores.doBlockReceiver,
    }),
  ].filter(Boolean) as WalletUpdate[];
};

export const buildCryptoStateMachine = (
  {
    lockService,
    riskService,
  }: {
    lockService: LockService;
    riskService: RiskService;
  },
  { receivingWalletId, sendingWalletId }: Context["init"]
) => {
  /** @xstate-layout N4IgpgJg5mDOIC5QBcBOBDAdrdBjZAlgPaYC0ADqkbnLKeuZUQG7oA2pAtngBYGZgAdGiywChEgElM4gumSQAxG2oBrAIIBHAK4FUkANoAGALqJQ5ImImZzIAB6IAHACZBARgCsAZiN+jTgDsACxO3gBsAJwANCAAnojeIYIR4Z5GwZEuwZ7u7oEAvgWxIth4NhRUNLB0DEysHNy4fAKCAGZgyM38UADq7GydACLy6IoQJEL8zESqQqU4+MRkTNW1jFQNXLz8Qh1dLX0Dw6MI09Tyy8Ym13aW1st2jgjBRp6CweGBWcGB30HeWIJBAuFzvbwucKfSKRYJeJyeT5FEoYMpLEiVai0egbFjsbbdVr7QlHNiDZAjZBjMCoKioQTkNjyNpEVCcYSoxYVVbYuqbfFNFp7Tok-pkk5Us6YGa4S4ka63JAge6yEhPRBw8KCIx-Fww8JBQKpIGIdyhQSIhFwpyva1Q5EgBblZaYtY4+oCnatAAKVVoPQABAAVTnOkgBgCyXrAij5eLYvqxNQAwkROIzOoZTHcrKrbErnt4gtrwuEXIEgvkocEkiaEJ5It4UpF3L4K0YDe5YQ6neiVn6au7+Y1o4IAEpgQboWBgAMAGTUsHGk0E5zmHNEYf7SfWHpHhKEE6nM-ni6lMrlmAV2aVKps6oQeXcTkE4TyPiyeUC7i+dZ-RkEP4DQNK09TCHtQz7V1eVxLZBV2QREzWQMAFVyAgeQ4GXVpYCpBQNzRbkB13YcCSFRDiNQ9DMNgRULFze8C1NFxvCbcI-GCTjPG+TwG08OtvHcACnC+N4-DyFiRIgzcoJ5Qc4zg0ckP9TAoADNCMIUWBVxkZBFDo5UGMeJiEECXjBCcJxYSyMyy0bdw614rUbU+Sy3x-b9gmkwiXTkkj4zIhDlJqKjNLgHTxH09wzFvIy1RMsz3ks6zy08OzBLrKJIgtWFOxEyyIicbyuV84ihwC+CfUo1T1OorSKLgAhcJ6DSaOwqZpVmeZIKIndysUg8KJ3UKaIasRmtU1qtPPC4bGvGL6IeeLQGed9gg+CIiyyriRMctLtVyo1fkK+0HUwIgIDgOxe16t0FM9A8cyW-MVsQUgvHeTjyw7X4jEEowYniRA321UJuLCSF2zNTxiq3aD5Ngh7yIWPNpFkTCICevMH3enUPmCb6oUCP6hMB4Eu2y0IhLSMzPjeMFYdksr7v3cjiUOMVyUpdAscY17H2SSInCEm03l4gJuL-LIPDCL4W28biuwJxnbpgvdAqq4aapDGSbEjaNeeM-mkgAlsOzfDI0ghusCYA59hdLI03lp8IVdKvqWY1w9JzAadZwXXBVHgWLnofP4XwdyJSx-AnskBIHHxBwJyzyN9vHswIyzdjE-P6pGENTdNyUgQ3locU04XWiIjVBH8XFcGE-08F8jEhES5d8ISvOKR0evdu7EdZoLqrUqarpD7GEr+izie47JcsbMnEmJmWnCMZ9W4bSHs+3Af1cqoRgrEGqx+0-hxFLl7y9M3IZ+d+foXTm3uNfIIha8dO0s8Fwd-h-yBvIkfEa9VfSNQmlAU+l8HxZGyjqYmOp8jWnyI5QSOVXKsSyNkdwv9c6ewPkNZCJ86rhULhmBQmMJ582vlHbKoIWxdnNr4SymUo4HU+G+SI38-qRCKEUIAA */
  return createMachine<Context>(
    {
      id: "transaction-process-approval-machine",
      predictableActionArguments: true,

      context: {
        init: { sendingWalletId, receivingWalletId },
        locks: [],
      },

      states: {
        transitionInitiated: {
          invoke: {
            src: "lockAquireMachine",

            data: {
              wallets: (ctx: Context): LockMachineContext["walletIds"] => [
                ctx.init.sendingWalletId,
                ctx.init.receivingWalletId,
              ],
            },
          },

          on: {
            lockAquired: {
              actions: "saveLockInContext",
              target: "fetchingWalletData",
            },
          },
        },

        fetchingWalletData: {
          invoke: {
            src: "fecthWallets",
            onDone: {
              target: "Processing Transaction Machine",
              actions: "saveWalletsInContext",
            },
            onError: "Release Locks",
          },
        },

        "Processing Transaction Machine": {
          invoke: {
            src: "processApprovalStateMachine",
            data: ({ sender, receiver }) => ({
              sender,
              receiver,
            }),
          },

          on: {
            approvalProcessCompleted: {
              target: "Processing Updates",
              actions: "saveApprovalResultInContext",
            },
          },
        },

        "Release Locks": {
          invoke: {
            src: "releaseLocks",
            onDone: "Completed",
          },
        },

        Completed: {
          type: "final",
        },

        "Processing Updates": {
          states: {
            init: {
              always: [
                {
                  target: "PresistingUpdates",
                  cond: "hasUpdates",
                },
                "Completed",
              ],
            },

            PresistingUpdates: {
              invoke: {
                src: "persistUpdates",
                onDone: "Completed",
              },
            },

            Completed: {
              type: "final",
            },
          },

          initial: "init",

          onDone: "Release Locks",
        },
      },

      initial: "transitionInitiated",
    },
    {
      guards: {
        hasUpdates: (ctx) => ctx.result!.updates.length !== 0,
      },
      actions: {
        saveApprovalResultInContext: assign({
          result: (_ctx, event) => {
            return event["data"] as ApprovalResult;
          },
        }),
        saveWalletsInContext: assign({
          sender: (_ctx, event) =>
            ((event as AnyEventObject)["data"] as WalletPair).sender,

          receiver: (_ctx, event) =>
            ((event as AnyEventObject)["data"] as WalletPair).receiver,
        }),
        saveLockInContext: assign({
          locks: (_context, event) => {
            // console.warn("LAK", JSON.stringify(event));
            return (event as any).locks;
          },
        }),
      },
      services: {
        persistUpdates: (ctx) => {
          const updates = ctx.result!.updates.map(
            ({ address, doBlock, newScore }) =>
              riskService.updateWallet(address, newScore, doBlock)
          );

          return Promise.all(updates);
        },
        fecthWallets: async (ctx): Promise<WalletPair> =>
          Promise.resolve({
            sender: await riskService.fecthWallet(ctx.init.sendingWalletId),
            receiver: await riskService.fecthWallet(ctx.init.receivingWalletId),
          }),

        releaseLocks: (ctx) => lockService.releaseLocks(ctx.locks),
        lockAquireMachine:
          /** @xstate-layout N4IgpgJg5mDOIC5QBsD2BjA1gWgLYEN0ALASwDswA6AOVQAIAZDTAYglQsvIDdVMq0WPIVKdajZgh4Z8AFxIcA2gAYAuitWJQAB1SwS8jlpAAPRAEYAnAFZKANgDMDywHY7dy+et3zADl8ANCAAnoi+ypSuLlYuDlZ+ygBMAL7JQYI4BMTkVOJMWCxgAE5FqEWU2shyAGZluJQZwtli9PmYUmS86HIKZBoaxrr6hmTGZggALA6JlMoTvt7Klg5J5sp2LkGhCNYOlC7WNrF+E34ulqnpzE2iVADq+AZ0AEpgskXBEgUmsLJyVPhqrJigAKazKZQAShYjSyt0oDyer3enzaAyQICGBl6Y0QE2s5kiynODkcuwm0XMW0Q2HMK0ovgcvhs6ySrnxDlSaRAZFQEDgxlhIhygz02KMGPG5gp9icrncnm8fkCIRpiT8lCczImdmsvkSiT1hsuICFzVyrWYouGOMlFksvn2iUsHh1E0S7h8iWpCGwLkd7ji5hcHssSScnO5ZvhbToAEEAI4AVxIRUg1vFoztk0SE3svjpsRZLmJ1msPq8edczIJbgmEyWwZN0ZyCMeshebw+X0wGZGuMm80oDedDrWTPWm1VvrLlHMjjW1kSC18Pl8LgmXOSQA */
          createMachine<{
            wallets: string[];
            internalWalletLockIds: string[];
          }>(
            {
              id: "lock-machine",
              predictableActionArguments: true,
              states: {
                "No Lock": {
                  invoke: {
                    src: "aquireLock",
                    onDone: {
                      target: "Lock Aquired",
                      actions: "sendLockToParent",
                    },
                    onError: "Wait Retry Lock",
                  },
                },

                "Lock Aquired": {
                  type: "final",
                },
                "Wait Retry Lock": {
                  after: {
                    "500": "No Lock",
                  },
                },
              },

              initial: "No Lock",
            },
            {
              actions: {
                sendLockToParent: sendParent((_, event) => ({
                  type: "lockAquired",
                  locks: event["data"],
                })),
              },
              services: {
                aquireLock: (ctx) => lockService.aquireLocks(ctx.wallets),
              },
            }
          ),

        processApprovalStateMachine:
          /** @xstate-layout N4IgpgJg5mDOIC5QBcBOBDAdrdBjZAlgPaYC06ADhakQG7oA2pAtngBYGZgB0nBhjAMQBtAAwBdRKApFY-YpikgAHogCMANgDM3AJz79ogKy6jGgOzmzAGhABPRACY1a7uYAs+82q0AODb5aRlrmAL6htmhYOPgK5FQ09EysuBxcvJjyQsJqkkggMnKEJEqqCJo6BoYmZpY29ohGjubcjp6mGmruar5GHuGRGNh4xWSU1HSMLOycPAAKNLhwcphQAAQAkpjIYKiYjGsAKkMxo4IQJDywyOg73FHDsSTxE0nTqbPcC0RLsCvrWx2ewOx2iIwUYjy0lk8hK+TKLgCem8Wi0GkcaPcogxtgcCCarlEvVEIR6PU8YQiIAepzi40SUxSaXmi2WnAB212+wYRxO4JI3Gu6FQyBEEiUhVhinhjTUuj0umM7mVunMul8vlxjS07m4XQszXMGI0RgG1L5TzGCUmyRm6W+v3+m05wJ5oMeo0FNxFIlyEpho1Ksvl1WVFPVmoaCE68vcjlE5KNjg0ytNVJp-Ktr0ZdpZPzZqzWAFFlEDubywZbzpcvbceBnLS8GbaPvbWX92cXS1yQRbRpD-UUFEHyhijG5dAFTFpHEZgu4tFqEM5RAqvPH-E13EZ3GaG6Mmzb3syvu2nSWy73K56hT6B-lJYGZdHsXoAlY1PH47pP0u1JZuHaVVVX-DV3G0Pc+zpa03iZT4HQLdYLx7N0oIFW9RRyKECgDYdnw0V9J18D8v1EH9HCXZNHDccxUV0PwsX-MxwipTAiAgOAlH3aDsxbZlBylEdSF8eUNEnDQCPVUxHB-NQl1INpuFEZTlNVTpzF8ZwNUg68eObY9Pj4AQGAEp9QDKUhum4MSJMkkSmlkv9aO4DVHGTOMrCNIJd3TNCs30uC23zDtC0BFCKw9PDoSHOFzMQHUQ0VOctEVDE1FEdxzCXONV31cwLDMcDmkcHTIueekj0CvNHU7MLXQi2l0O9ZBTKilR4tVBVjGCVKtHSzKl2CXwXJ8Px6M-HxPFKxr-Mq3NT2Cp06vLd0Zu4ABBGCwFa2L2oQYjqMcYjug0iSmh3QbRBaFMLDjOUZ18dxiOmzND1g+aEJCjlL1Q3SBQAJTAAArMB8B26U4v2o1WmO0Cztndwl06ccbu8I0TSCXw1BexsKve1tqsQrsfoazNwZHLRRA0FyTFJYxKZNXQkZ0IDdDcz9-H8SlBj+2b8ZPT7z27erVszWsRXJ59vJp+jvHpqmTD-CTAIME0FyMDL-xxg88ZzAmFpqwtkJFvyNq2iBJchycdG8YjbNMB2-w1td9G6YijDlJptb0ub9cFztjZW03AZB-BIEtvbrbcHp8okh3FajWdhqqMTZwdo6tG98qYL1k8AGEiGYCgGDAHYLYfXDdoRSnCQyxnPMVOSo3A67emcI6XAJTKWNCIA */
          createMachine<ApprovalMachineContext>(
            {
              predictableActionArguments: true,
              id: "transaction-approval-machine",
              initial: "initial",
              states: {
                initial: {
                  always: [
                    {
                      target: "Processing External Transaction",
                      cond: "isExternal",
                    },
                    "Processing Internal Transaction",
                  ],

                  entry: "initalizeState",
                },

                "Processing Internal Transaction": {
                  states: {
                    start: {
                      always: [
                        {
                          target: "Approve",
                          cond: "Sum Scores < 300 and no wallet is blocked",
                        },
                        {
                          target: "Reject",
                          actions: "Add 10% penalty to both wallets",
                        },
                      ],
                    },

                    Approve: {
                      type: "final",
                      entry: "concludeApproved",
                    },

                    Reject: {
                      type: "final",
                      entry: "concludeRejected",
                    },
                  },

                  initial: "start",

                  onDone: "Completed",
                },

                "Processing External Transaction": {
                  states: {
                    start: {
                      entry: "appendExternalRisk",

                      always: [
                        {
                          target: "Approved",
                          cond: "internal score < 100 and no wallet is blocked",
                        },
                        {
                          target: "Rejected",
                          actions: "add 15% penalty to internal wallet risk",
                        },
                      ],
                    },

                    Approved: {
                      type: "final",
                      entry: "concludeApproved",
                    },
                    Rejected: {
                      type: "final",
                      entry: "concludeRejected",
                    },
                  },

                  initial: "start",

                  onDone: "Completed",
                },

                Completed: {
                  type: "final",
                  exit: "emitResultToParent",
                  entry: "processAdditionalRules",
                },
              },
            },
            {
              actions: {
                processAdditionalRules: assign({
                  postApprovalScores: (ctx) => {
                    const canBlock = (w: Wallet) =>
                      w.isInternal && !w.isBlocked;
                    return {
                      ...ctx.postApprovalScores,
                      doBlockSender:
                        canBlock(ctx.sender) &&
                        (ctx.receiver.isBlocked ||
                          ctx.postApprovalScores.senderScore > 600),

                      doBlockReceiver:
                        canBlock(ctx.receiver) &&
                        ctx.postApprovalScores.receiverScore > 600,
                    };
                  },
                }),
                emitResultToParent: sendParent((ctx) => {
                  return {
                    type: "approvalProcessCompleted",
                    data: {
                      approval: ctx.approval,
                      updates: buildPostApprovalUpdates(ctx),
                    } as ApprovalResult,
                  };
                }),
                "Add 10% penalty to both wallets": assign({
                  postApprovalScores: (ctx) => ({
                    ...ctx.postApprovalScores,
                    receiverScore: ctx.postApprovalScores.receiverScore * 1.1,
                    senderScore: ctx.postApprovalScores.senderScore * 1.1,
                  }),
                }),

                "add 15% penalty to internal wallet risk": assign({
                  postApprovalScores: (ctx) => {
                    const penalized: keyof typeof ctx.postApprovalScores = ctx
                      .sender.isInternal
                      ? "senderScore"
                      : "receiverScore";

                    return {
                      ...ctx.postApprovalScores,
                      [penalized]: ctx.postApprovalScores[penalized] * 1.15,
                    };
                  },
                }),
                initalizeState: assign({
                  postApprovalScores: (ctx) => ({
                    doBlockReceiver: false,
                    doBlockSender: false,
                    receiverScore: ctx.receiver.riskScore,
                    senderScore: ctx.sender.riskScore,
                  }),
                }),
                appendExternalRisk: assign({
                  postApprovalScores: (ctx) => {
                    const sumScore =
                      ctx.postApprovalScores.senderScore +
                      ctx.postApprovalScores.receiverScore;
                    const updatedWalletProp: keyof typeof ctx.postApprovalScores =
                      ctx.sender.isInternal ? "senderScore" : "receiverScore";
                    return {
                      ...ctx.postApprovalScores,
                      [updatedWalletProp]: sumScore,
                    };
                  },
                }),
                concludeApproved: assign({
                  approval: (_): ApprovalState => "approved",
                }),
                concludeRejected: assign({
                  approval: (_): ApprovalState => "rejected",
                }),
              },
              guards: {
                isExternal: (ctx) => {
                  // console.warn(ctx);
                  return !ctx.sender.isInternal || !ctx.receiver.isInternal;
                },
                "internal score < 100 and no wallet is blocked": (ctx) => {
                  const internalWalletKey: keyof typeof ctx.postApprovalScores =
                    ctx.sender.isInternal ? "senderScore" : "receiverScore";

                  const anyBlocked =
                    ctx.sender.isBlocked || ctx.receiver.isBlocked;

                  return (
                    ctx.postApprovalScores[internalWalletKey] < 100 &&
                    !anyBlocked
                  );
                },
                "Sum Scores < 300 and no wallet is blocked": (ctx) => {
                  const score =
                    ctx.postApprovalScores.senderScore +
                    ctx.postApprovalScores.receiverScore;

                  const anyBlocked =
                    ctx.sender.isBlocked || ctx.receiver.isBlocked;

                  return score < 300 && !anyBlocked;
                },
              },
            }
          ),
      },
    }
  );
};
