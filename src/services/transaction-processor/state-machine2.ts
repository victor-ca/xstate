import { createMachine } from "xstate";

type Context = {
  init: { sendingWallet: string; receivingWallet: string };
};

export const stateMachineV2 =
  /** @xstate-layout N4IgpgJg5mDOIC5QBcBOBDAdrdBjZAlgPaYC06ADhakQG5ioB0AggI4CuBqYABADJFcAa1gBiCCTCNYydMilosOfMTKVqdBiw5deA4bADaABgC6iUBSKwChEhZAAPRAFYATABoQAT0QBONwBmRgBGADYIsJDjAHZAsIAOMMCAXxSvRWw8OzUqGnomNk5ufkERRn0hHgAxdAIAG0hRRxk5KXQAM3lUAAoXY2MASlFM5RzyPM1CnRLK2AqymrrGiBNzJBArGxyHZwQXGL9GQLcEkKCAFmMQmJuEr18EEP7GPze3wIu3ML9btzSMhgsioSBMNAVtMU9GV5kUuARMFBSgZxJJGAjaEQhAogWNVGD8lo4bMYZD4YjkSIEBjBHJVGs1g4trZVLtXIEEoxvi4wm5vklAtd7j5EG4Li5Xu8-J8YuK-AkXBcASBRtl8epCdMoZTYTMEUi5qIGDQmBR6nIOkRUABbRiqkG5cFEmbQgxk1D6nXUzCY3B0kgMsxM6ws+wbPYuDlcsI8vmJZJCh6IELyxgXKWffoxBIXBIxZX28YaqYLdAQT0AdXQ9UayDEEkwUla8jtuLVoOLEIEZcr1drRiDG2ZO3DiASxiOOcC2YiFzi4TCSYQAWCC4i0Ti8dS6RVbYdBJL3fLFKrNbAddLx6Rp-7qMb6J9WJxSnbjs1l97Z4vR8--e9vv9TBA3WSwQxHUA9iuCV0xTRUXDOC4Ik8EUEDiCUOWicd5TcPwQgLPci0mCEAElMHkMieAAJTAXAwAIegIFERkhzA1lRwQNwJ0YYxEKSXlpRCBI-F5JcbknWUPgSQJnjcQ5-h3Qt1SIrQAAUaFo2BYB4ZgiOrO8m1kFtFI7ZSmDUwQ4C0nTwWrZjQO2NiINFHkjhcZ5EkOH4pOlJcV1CSIolieIBXwl9907VT1Ms7TdPqB8WT0uzNlYsMnKeAZJyCYxZOeC4TgOJcEm+V4Li+L4cwSISflC4FCKdMyos0mKbLihEEvqJiQhA5KHNSpxk1iMJGDcnkomwvxFRiJcfiGi4F0jbMVzcPCFIIpT6sYcyNKs2LNsamwKVI7pMGrZr8j0hsDLaVswrq98tui6zzrih7NM9I6GBO+ozroWzB3s0NMDZJ4-GMTkhOMH5lrQn4XF8twJTBwIThwuc5rOGq8RMjbXp2lq9ost7DrIz7Tqe364taVBkCY-6esB4GQg5I4Jw5SGvmylw-AuXznm4qTpKq4wDiVVbbvW+79p+2hqwJ7b3pJ1Avul2WqZpwwuuDXqgfYpmhO46VxzCDmEe53yYiGpGThTMHrgCTHXwPCFcZVl79s9ABRRxjrJ2L9OkQzn1qiWSxd8mZbdwmDqRL2fe+8O-u64dHP6ji5snPKzkCaVDikqaUNhxgAsVGNQeE0XAXF7HJaj125csz3vdJ+PdrawgLrRGlsRu4Pq9DqWE8j+WKVj5u67bghq3-WkcmArWGd1nlVzzFx+jCYXcOypd52GgWbiuQV5Qd8LTPrprB7P6OeFHpXffxj7b++gBlXArV4ABVCgIDaRikuTvq9icR5FyLO1xvilUSMKR4YQYgxEYBJeU6YVyQzCMfO6-da4X1xo3OOdcH7Kxfm-Hgn9v7yF-prFi2tgZAKGqcJmYDja8SgYgOInIEF5mlL8Nyfg0EhwhNRRo6Ar6Gj-ilHWaU+ScmzpDc4EQYhBEFIEUSBxjDHGRicJI8jYGix3JgIgEA4AOGMm+KY89wKp1IIuFCpAxTcQGNcFR5x4LGHiLwvuEJiSuhEGYlOgCkihCuLyOcOYbjJB5gXYISD5SVV5AqGMCQ3EmI8S6HUCxhDaRdBAHxACWF82nFE1e8Rs7hMeGKYICCAhgOzLJCuu4q5JOdNqOYaSqi1AaJAbJ4jU63HQhUwpyQzYoWeJyK2skAhXACC4RJTtGm6FScST0cxOnA2RhcAJkMxTZjmhbT4olbhpilLcYSmyirTIikwH8J4+znngJQheaVnjQR2SmHCfIQiZ2mkEY4ZxYjLVBo4s5p9LnXmud+IgPYrlfluQDcxgCXFpmeQEAIy0PkoVuKoyqG4YElxzPmMWvcGkXPBVeHgN4bmMDJXWUoZYOl3Nha4BUByUyQMCFzRR29kahGkrECay0JxfEBRtD6FFqK0XorSmFvjEBfD2eDBBq8-g8lzIKmu21XbLPYnmNZ0kAjhDGe80qS4kHwKQRJeIkibgqowWqi+E9qwarSsi44Ly9WHANSUxAY00xfGRri7hc4rXOwHrtbBxNcGDwdanc4KYDbTl+O82SMTCq2PgsjPWPEswJPxVjQll866hqRPgu+z0A7oGppGvYsi4Gs0OLcL42Yki8yOAg2B2VpRg1Qdmx25y81YPdmGseF9w4SvpvSp4txOTvMhocZGYoir50eLhNw-M01SXjHyKZXaT442DfjAtPAi0t3xtRAAVjRMhFbkwTvWTA6UJxcyyXNsEUZTNwjTqzZXAlMyGqYJDf2mOTdH7qrpVKp4bzjhczKhNOCiElzwTgWKN4udzVQUDZFX9e7-3X0A8rW1mB2qXrAz8CD3NEOr3FLBtFsQV3SWkrKPMpw0M-ptX+qOODB27UPTwQhJQSE-0I4JVldiBirzeQcM4HLVGpsUbBcU2UmO9tY8PAD4bdrDqySBnJHE+Qs0NtcCciRhJWOgbKE1bwcxXBcaJhTYclMNxHjh4tFNGCnvPSO-+XTAE6djeOaIwkqrGZYUJ9hcRgkDFqcY79in8aDx4C7AAwkQa0ZpzzubEcDX4rl3Lr1vTcPkolZKWwFmKb4rKmYKYEWAIRiyYSEYKkMlyai00QLcqVhTiXku1jS1Q9iJxIlTluMMv5zCng8hGcV+RfnU1pDSEAA */
  createMachine<Context>(
    {
      id: "transaction-approver",
      predictableActionArguments: true,
      context: {
        init: { sendingWallet: "a", receivingWallet: "b" },
      },
      states: {
        "Aquire Locks": {
          states: {
            "Lock Aquired": {
              type: "final",
            },

            "Lock Failed": {
              after: {
                "500": "Aquiring Locks",
              },
            },

            "Aquiring Locks": {
              invoke: {
                src: "aquireLock",
                onDone: "Lock Aquired",
                onError: "Lock Failed",
              },
            },
          },

          onDone: "Loading Wallets",
          initial: "Aquiring Locks",
        },

        "Loading Wallets": {
          states: {
            "Loading Wallets": {
              invoke: {
                src: "loadWallets",
                onDone: "Wallets Loaded",
              },
            },

            "Wallets Loaded": {
              type: "final",
            },
          },

          initial: "Loading Wallets",

          onDone: "Process Approval",
        },

        "Intent Received": {
          always: "Aquire Locks",
        },

        "Process Approval": {
          states: {
            initial: {
              always: [
                {
                  target: "Processing Internal Approval",
                  cond: "Is Internal",
                },
                "Processing External Approval",
              ],
            },

            "Processing Internal Approval": {
              states: {
                start: {
                  always: [
                    {
                      target: "Approved",
                      cond: "Score sum < 300 & wallets not blocked",
                    },
                    "Rejected",
                  ],
                },

                Approved: {
                  type: "final",
                },

                Rejected: {
                  type: "final",
                },
              },

              initial: "start",

              onDone: "Approval Process Completed",
            },

            "Processing External Approval": {
              states: {
                initial: {
                  invoke: {
                    src: "updateInternalWalletScore",
                    onDone: "Internal Score Updated",
                  },
                },

                "Internal Score Updated": {
                  always: [
                    {
                      target: "Approved",
                      cond: "Score < 100",
                    },
                    "Rejected",
                  ],
                },

                Approved: {
                  type: "final",
                },

                Rejected: {
                  type: "final",
                },
              },

              initial: "initial",

              onDone: "Approval Process Completed",
            },

            "Approval Process Completed": {
              type: "final",
            },
          },

          initial: "initial",

          onDone: "Releasing Locks",
        },

        "Releasing Locks": {
          always: "Completed",
        },

        Completed: {
          type: "final",
        },
      },

      initial: "Intent Received",
    },
    {
      guards: {
        "Is Internal": () => true,
        "Score sum < 300 & wallets not blocked": () => true,
      },
      services: {
        aquireLock: (ctx) => {
          console.warn(ctx);
          var r = Math.random();
          return r < 0.2 ? Promise.resolve() : Promise.reject();
        },
        loadWallets: () => Promise.resolve(true),
      },
    }
  );
