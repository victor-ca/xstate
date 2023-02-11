import { ApprovalState, Wallet } from "../model/model";
import { LockService, RiskService } from "../model/services";
import { createXStateTransactionProcessor } from "../services/x-state.transation-processor";

type SpecResultEvaluator = {
  senderUpdatedScore: number | undefined;
  senderGotBlocked: boolean;
  receiverGotBlocked: boolean;
  receiverUpdatedScore: number | undefined;
  state: ApprovalState;
};
type SpecBuilder = {
  withSender: (sender: Partial<Omit<Wallet, "address">>) => SpecBuilder;
  withReceiver: (sender: Partial<Omit<Wallet, "address">>) => SpecBuilder;
  processTransaction: () => Promise<SpecResultEvaluator>;
};

const mockLockService: LockService = {
  aquireLocks: (args) => Promise.resolve(args.map((x) => x + "-lock")),
  releaseLocks: (args) => Promise.resolve(args),
};

export const givenSut = (): SpecBuilder => {
  const sut = {} as SpecBuilder;
  const actors = {
    sender: { address: "a" } as Wallet,
    receiver: { address: "b" } as Wallet,
  };
  sut.withSender = (w) => {
    actors.sender = { ...actors.sender, ...w };
    return sut;
  };
  sut.withReceiver = (w) => {
    actors.receiver = { ...actors.receiver, ...w };
    return sut;
  };
  sut.processTransaction = async () => {
    let mockRiskService: RiskService = {
      updateWallet: jest.fn(),
      fecthWallet: (walletId: string) => {
        if (walletId === "a") {
          return Promise.resolve(actors.sender);
        }
        return Promise.resolve(actors.receiver);
      },
    };

    const processor = createXStateTransactionProcessor(
      mockRiskService,
      mockLockService
    );
    const result = await processor.processTransaction({
      sendingWalletId: "a",
      receivingWalletId: "b",
    });

    const updatesCalls: Record<string, { score: number; blocked: boolean }> = (
      mockRiskService.updateWallet as jest.Mock
    ).mock.calls.reduce(
      (acc, [id, score, blocked]) => ({
        ...acc,
        [id]: { score, blocked },
      }),
      {}
    );

    return {
      senderUpdatedScore: updatesCalls["a"]?.score,
      senderGotBlocked: updatesCalls["a"]?.blocked === true,
      receiverUpdatedScore: updatesCalls["b"]?.score,
      receiverGotBlocked: updatesCalls["b"]?.blocked === true,
      state: result,
    };
  };
  return sut;
};
