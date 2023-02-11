import { AnyEventObject, assign, createMachine } from "xstate";
import { sendParent } from "xstate/lib/actions";

type Context = {
  init: { sendingWalletId: string; receivingWalletId: string };
  locks: string[];
  result?: ApprovalResult;
  sender?: Wallet;
  receiver?: Wallet;
};
type WalletPair = Required<Pick<Context, "sender" | "receiver">>;
type LockMachineContext = {
  walletIds: string[];
  internalWalletLockIds: string[];
};

type Wallet = {
  isInternal: boolean;
  isBlocked: boolean;
  address: string;
  riskScore: number;
};

type WalletUpdate = {
  address: string;
  newScore: number;
  doBlock: boolean;
};
type ApprovalState = "unknown" | "approved" | "rejected";
type ApprovalResult = {
  updates: WalletUpdate[];
  approval: "unknown" | "approved" | "rejected";
};
type ApprovalContextBase<Mode = "internal" | "internal-vs-external"> = {
  mode: Mode;
};
type InternalApprovalContext = ApprovalContextBase<"internal"> & {
  wallets: [Wallet, Wallet];
};
type ExternalApprovalContext = ApprovalContextBase<"internal-vs-external"> & {
  internal: Wallet;
  external: Wallet;
};
type ApprovalContext = InternalApprovalContext | ExternalApprovalContext;
type ApprovalMachineContext = ApprovalResult & ApprovalContext;

const resolveTransactionApprovalContext = (ctx: Context): ApprovalContext => {
  const wallets = [ctx.sender, ctx.receiver] as [Wallet, Wallet];
  const externalWallet = wallets.find((x) => !x.isInternal);
  return !!externalWallet
    ? {
        mode: "internal-vs-external",
        external: externalWallet,
        internal: wallets.find((x) => x.isInternal)!,
      }
    : { mode: "internal", wallets };
};
export const stateMachineV3 =
  /** @xstate-layout N4IgpgJg5mDOIC5QBcBOBDAdrdBjZAlgPaYC0ADqkbnLKeuZUQG7oA2pAtngBYGZgAdGiywChEgElM4gumSQAxG2oBrAIIBHAK4FUkANoAGALqJQ5ImImZzIAB6IATAE4jggCwBWAMwBGDw8XIL8ANlDfABoQAE9EPydQwSMnH28nRJc-AA5QgHYAXwLokWw8GwoqGlg6BiZWDm5cPgFBADMwZGb+KAB1djZOgBF5dEUIEiF+ZiJVIVKcfGIyJmraxioGrl5+IQ6ulr6B4dGEaep5ZeMTa7tLa2W7RwRQ7OzPV+y-PNS-FycvB5onEEAE-II8nk0l4YU4PGk8i4iiUMGUliRKtRaPQNix2Ntuq19oSjmxBsgRsgxmBUFRUIJyGx5G0iKhOMJUYsKqtsXVNvimi09p0Sf0yScqWdMDNcJcSNdbkgQPdZCQnohPh83t9fv9AcDENknIIvEYzUZ-B48n4bS5CsUQAtystMWscfUBTtWgAFKq0HoAAgAKpznSQAwBZL1gRR8vFsX1YmoAYSInEZnUMpjuVlVtiVzz8Rgigic1p8XmyWTyHlcoQNCB8oXBTbyoRcrzcgMroWRjtD6JWfpq7v5jWjggASmBBuhYGAAwAZNSwcaTQTnOYc0RhodJ9Ye8eEoTT2fzpcrqUyuWYBXZpUqmzq0FeP6CKtGRFZIww4INgIuJ4YSvD+HjfE2Ph9k6g6uryuJbIKuyCImayBgAquQEDyHAa6tLAVIKNuaLcsOB5jgSQrIaR6GYdhsCKhYuZPgW8QVu8uQ-O23z5B22QNqkgFwi4LjZG2Ik5LkThQQOJH7qO8YUUhKH+pgUABhhWEKLAG4yMgigMcqTGPCxoIJF4gihB4oQVv4doZCkDaWXkELfDkIl5OawTSTuME8iOcYIROyk1DRmlwDp4j6X4ZgPkZaomX4-jGp+2RNpZLg+C4jmiSaQS1m44QuKa2TecRLp+WRCmIT61GqeptFaVRcAEPhPQaXRuFTNKszzDJ5WkfJgXHlR+6hXRTViK1qntVpV4XDYd4xYxDzxaAhamkk1mmt8MIVvCfGxBqNbJK+eRVn8RZeKEUl9pgRAQHAdjQbJboBZ6x45it+ZrYgpD1odCCkB4gjCaDPgVqERipT4omlVy-VyW9R6UQsebSLI2EQJ9ebPrW-4AhCppGH8olcUYgRw7usH+fB72UcShxiuSlLoNjzE-QgHhfCaZ05D+PyfsTXj4+ZeREyTYlFmBlO+QNSOKTVo11SGPk2JG0Zs8ZHO5D4pbuZZn52uTB0ggC4KJd86QZdkpo3SiqsI69tPI0hp5gHOC7LrgqjwLFX3PolTjgm2aQ5D84NfECAOB8kHg-n4prhwLdv9g7GIVYNdNIam6bkpAmurQ48TWu4ALEx2YFWlZfj-lagjAdZUKQ3C1oyy9cGHgrQjBWIdUzY9fs4wln7A5Z1n5GkMMJ3kDZBM51o-HCrjwv49r22V6dy87XcjahfcNeF-DiAX31F6ZGQWVZraT18XgzwDlbmUHAvCWWtZQm3jsd+R1Xd7Van920r6ZqU0oCAJPgHRI4IjQkwiB2BOXMGxiySAnf4qRciVgAp-TeiNt6-13ipABB9tI5wzAoLGg92Zn0SsWZI10oQ+DFpCa0WUH421LDqIwr8axlkgkUAoQA */
  createMachine<Context>(
    {
      id: "transaction-process-approval-machine",
      predictableActionArguments: true,

      context: {
        init: { sendingWalletId: "a", receivingWalletId: "b" },
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
            data: resolveTransactionApprovalContext,
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
            console.warn("LAK", JSON.stringify(event));
            return (event as any).locks;
          },
        }),
      },
      services: {
        persistUpdates: (ctx) => {
          console.warn("saving...", ctx.result!.updates);
          return Promise.resolve();
        },
        fecthWallets: (_ctx): Promise<WalletPair> =>
          Promise.resolve({
            sender: {
              address: "a",
              isInternal: true,
              isBlocked: false,
              riskScore: 330,
            },
            receiver: {
              address: "b",
              isInternal: true,
              isBlocked: false,
              riskScore: 330,
            },
          }),

        releaseLocks: (_ctx) => Promise.resolve(),
        lockAquireMachine:
          /** @xstate-layout N4IgpgJg5mDOIC5QBsD2BjA1gWgLYEN0ALASwDswA6AOVQAIAZDTAYglQsvIDdVMq0WPIVKdajZgh4Z8AFxIcA2gAYAuitWJQAB1SwS8jlpAAPRACYALADZKARnMBWZcoDsADkfvL7qwGYAGhAAT0R3O0pnF2U7P3NXO0dHAE5kgF80oMEcAmJyKnEmLBYwACdS1FLKbWQ5ADNK3Eps4TyxeiLMKTJedDkFMg0NY119QzJjMwQrWwcojy8ffyDQ6fMI5Mc-WMdza3dUyziMrOZW0SoAdXwDOgAlMFlS4Ilik1hZOSp8OtkygAoogBKFgtXIXSjXW4PJ4vTrDJAgUYGAaTCzJVyUaxOFyWdauAk+awrRB2VyWSiWLaxczmTzudx+DwZTIgMioCBwYxgkT5EZ6FFGRFTbDEkKIUWUaLSmUuVwnEA8toFDrMfljVHCxB4kkIOyWZKUTbbPzKbzJBy+dKspUQzp0ACCAEcAK4kUqQdWCiZahBHPxYhIM9zKaxRGK6uwxI2uMPJcwYhPJPzeBW2-KQm6ye6PZ6vTBe8Zov1+APWIMM0Phuy69aOSh+awYg5k5RMvzWjJAA */
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
                aquireLock: () => Promise.resolve(["lockA"]),
              },
            }
          ),

        processApprovalStateMachine:
          /** @xstate-layout N4IgpgJg5mDOIC5QBcBOBDAdrdBjZAlgPaYC06ADhakQG7oA2pAtngBYGZgB0nBhjAMQBtAAwBdRKApFY-YpikgAHogAsAZm4B2AGwaArAEYAHHrVqATActG1AGhABPRKQOHuRg6NHaTlyzMATiNLAF8wxzQsHHwFcioaeiZWXA4uXkx5IWEjSSQQGTlCEiVVBDUjblFdUQ0gjRMvet09A0cXBFJNbWrtY101INETDQ0AiKiMbDwSskpqOkYWdk4eAAUaXDg5TCgAAgBJTGQwVExGfYAVadi5wQgSHlhkdFPuaJm4kgTF5JW0mtuJsiNtYLsDsdTudLjcYrMFGJ8tJZPJSgVykZRLZuGpdJZ8S1hvp2s5EKFRLjdCYTMZNCY6hojBpJiBPnd4gskstUukNlsdpxISczhcGNdbgiSNwXuhUMgRBIlEU0YoMYhDJTTIZdPjREF+hoHGSEFjLDptCFdS0CWpWeypfNEksUqsMiCwRCjiKYeK4V85jLXvKRHllai5mUNRpdNxvEZBpZNVivB1EAFzUEDAYgvi8TG6hZ7ZLvk6-jy3fzQYK9vsAKLKaFiiXw0sPJ5Bt48B2l37c12A90C8FC+uN0WwktzJHh4oKKOm7G9NQjBl43PMglprpYrX1Ox+JnaAkmILF1tzPsugF84HDr0NpuTi8KTshmcFFWR9UIeombh6noVpGl4Cbbt0IwAd4IyVPGp4GNo54Bpyzr-LyQIejWByPhOfpTq+srvmGn4RvOP4xlodS1Nip6iDmqYmqQlgNLiohDKY3j9Cu4SspgRAQHASg9peXLXuhXCzqqC6kKEsZJoM2h1EEti6EEaikp0pCqVoXg+EEtK2GofgGEhHI-KJaGVpk2QMJJ36gOUpB+Nw8lGUpKlqRprgIbGaijPUzEEhoojMqZjpXpZg5Vp6o5QrhLbIeiKJzklKjpjScYhYmyYhV5XRGS5lgjNmrTqT4uVhb2FkVlFd7ViOtZxb6CVmZgb7IHZZEORqBXatmJiqWx2jGp0K4uZaoEaNoCYWANJmRGy+HmahNW3phDXCk+eEvtKACCqFgJ1qXlCS1SqXowT6LopjbjN3AGkyJhGdoTJGFxlUiStA5rfesU+s2-qtdwABKYAAFZgPgR1qt1CCDFUWVZUZWYGKM26BFoDK1HYBKo-pLILcJKHlt9GG-bWOHNYDjrQwugRqHGurFXRhiydo4G1AYUF6Qe7hjLoH3E-2N5k-VD7jlTS1tYRHUkSlMNpb+4yM7UtIs8YBLs4xxj-rpq65ghwxGILy0kyLQ5i6OlMA1L3D7X8kC0z+1Jc7Yb3HvUMHDeB4xBNUalmjYPgvTxUw7WWwvidFWFjltLWOiD4OQ6cEBO7Dg2eAY6lGEYanWLSRjgUV-76oYymmMyZiWIhhNSxFq1AgAwkQzAUAwYAp2nitmgzWdTf0OZJkalhF5j+jqQNQQGrnucRBEQA */
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
                          actions: "add 15% penalty to wallet risk",
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
                },
              },
            },
            {
              actions: {
                emitResultToParent: sendParent(({ approval, updates }) => {
                  return {
                    type: "approvalProcessCompleted",
                    data: {
                      approval,
                      updates,
                    } as ApprovalResult,
                  };
                }),
                "Add 10% penalty to both wallets": assign({
                  updates: (ctx): WalletUpdate[] =>
                    (ctx as InternalApprovalContext).wallets.map(
                      (w): WalletUpdate => ({
                        address: w.address,
                        doBlock: false,
                        newScore: w.riskScore * 1.1,
                      })
                    ),
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
                  console.warn(ctx);
                  return ctx.mode === "internal-vs-external";
                },
                "Sum Scores < 300 and no wallet is blocked": (ctx) => {
                  const context = ctx as InternalApprovalContext;
                  const score =
                    context.wallets[0].riskScore + context.wallets[1].riskScore;
                  const anyBlocked = context.wallets.find((x) => x.isBlocked);
                  return score < 300 && !anyBlocked;
                },
              },
            }
          ),
      },
    }
  );
