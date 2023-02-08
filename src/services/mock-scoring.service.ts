import { ScoringService } from "../model/services";

export const getMockScoringService = (): ScoringService => {
  return {
    getScoredWallet: (walletAddress: string) =>
      Promise.resolve({
        address: walletAddress,
        blocked: false,
        isExternal: true,
        riskScore: 0,
      }),
  };
};
