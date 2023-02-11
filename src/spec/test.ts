import { ApprovalState } from "../model/model";
import { givenSut } from "./spec.builder";

describe("crypto evaluator tests", () => {
  it("simple pass", async () => {
    const result = await givenSut()
      .withSender({ riskScore: 0, isInternal: true })
      .withReceiver({ riskScore: 0, isInternal: true })
      .processTransaction();

    expect(result.state).toBe("approved" as ApprovalState);
  });

  it("internal vs external: reject if risk over over 100", async () => {
    const score90 = await givenSut()
      .withSender({ riskScore: 95, isInternal: true })
      .withReceiver({ riskScore: 0, isInternal: false })
      .processTransaction();

    const score104 = await givenSut()
      .withSender({ riskScore: 99, isInternal: true })
      .withReceiver({ riskScore: 5, isInternal: false })
      .processTransaction();

    expect(score90.state).toBe("approved" as ApprovalState);
    expect(score104.state).toBe("rejected" as ApprovalState);
  });

  it("internal vs external: reject if any is blocked", async () => {
    const sutWithBlockedSender = await givenSut()
      .withSender({ riskScore: 0, isInternal: true, isBlocked: true })
      .withReceiver({ riskScore: 0, isInternal: false })
      .processTransaction();

    const sutWithBlockedReceiver = await givenSut()
      .withSender({ riskScore: 0, isInternal: true })
      .withReceiver({ riskScore: 0, isInternal: false, isBlocked: true })
      .processTransaction();

    expect(sutWithBlockedSender.state).toBe("rejected" as ApprovalState);
    expect(sutWithBlockedReceiver.state).toBe("rejected" as ApprovalState);
  });

  it("internal vs internal: reject if score >= 300", async () => {
    const score299 = await givenSut()
      .withSender({ riskScore: 100, isInternal: true })
      .withReceiver({ riskScore: 199, isInternal: true })
      .processTransaction();

    const score300 = await givenSut()
      .withSender({ riskScore: 100, isInternal: true })
      .withReceiver({ riskScore: 201, isInternal: true })
      .processTransaction();

    expect(score299.state).toBe("approved" as ApprovalState);
    expect(score300.state).toBe("rejected" as ApprovalState);
  });

  it("internal vs internal: reject if a wallet is blocked", async () => {
    const noneBlockedSut = await givenSut()
      .withSender({ riskScore: 100, isInternal: true })
      .withReceiver({ riskScore: 100, isInternal: true })
      .processTransaction();

    const senderBlockedSut = await givenSut()
      .withSender({ riskScore: 100, isInternal: true, isBlocked: true })
      .withReceiver({ riskScore: 100, isInternal: true })
      .processTransaction();

    const receiverBlockedSut = await givenSut()
      .withSender({ riskScore: 100, isInternal: true })
      .withReceiver({ riskScore: 100, isInternal: true, isBlocked: true })
      .processTransaction();

    expect(noneBlockedSut.state).toBe("approved" as ApprovalState);
    expect(senderBlockedSut.state).toBe("rejected" as ApprovalState);
    expect(receiverBlockedSut.state).toBe("rejected" as ApprovalState);
  });

  it("internal vs internal: rejected transaction will penalise both wallets with 10%", async () => {
    const rejectedPenaltySut = await givenSut()
      .withSender({ riskScore: 100, isInternal: true })
      .withReceiver({ riskScore: 200, isInternal: true })
      .processTransaction();

    expect(rejectedPenaltySut.state).toBe("rejected" as ApprovalState);
    expect(rejectedPenaltySut.senderUpdatedScore).toBeCloseTo(110);
    expect(rejectedPenaltySut.receiverUpdatedScore).toBeCloseTo(220);
  });

  it("internal vs external: add 15% penalty to internal wallet score if the transaction got rejected", async () => {
    const noSumSenderTest = await givenSut()
      .withSender({ riskScore: 100, isInternal: true, isBlocked: true })
      .withReceiver({ riskScore: 0, isInternal: false })
      .processTransaction();

    const sumSenderTest = await givenSut()
      .withSender({ riskScore: 105, isInternal: true, isBlocked: true })
      .withReceiver({ riskScore: -5, isInternal: false })
      .processTransaction();

    const reveiverSutTest = await givenSut()
      .withSender({ riskScore: 105, isInternal: false, isBlocked: true })
      .withReceiver({ riskScore: -5, isInternal: true })
      .processTransaction();

    expect(noSumSenderTest.senderUpdatedScore).toBeCloseTo(115);

    expect(sumSenderTest.senderUpdatedScore).toBeCloseTo(115);
    expect(sumSenderTest.receiverUpdatedScore).toBeUndefined();

    expect(reveiverSutTest.senderUpdatedScore).toBeUndefined();
    expect(reveiverSutTest.receiverUpdatedScore).toBeCloseTo(115);
  });

  it("additional: sending to blocked wallet will block the sender", async () => {
    const sentToInternal = await givenSut()
      .withSender({ riskScore: 0, isInternal: true })
      .withReceiver({ riskScore: 0, isInternal: true, isBlocked: true })
      .processTransaction();

    const sentToExternal = await givenSut()
      .withSender({ riskScore: 0, isInternal: true })
      .withReceiver({ riskScore: 0, isInternal: false, isBlocked: true })
      .processTransaction();

    expect(sentToInternal.state).toBe("rejected" as ApprovalState);
    expect(sentToInternal.senderGotBlocked).toBe(true);

    expect(sentToExternal.state).toBe("rejected" as ApprovalState);
    expect(sentToExternal.senderGotBlocked).toBe(true);
  });

  it("additional: reaching 600 will block a wallet", async () => {
    const senderLessThan600AfterSum = await givenSut()
      .withSender({ riskScore: 500, isInternal: true })
      .withReceiver({ riskScore: 4, isInternal: false })
      .processTransaction();

    const senderOver600AfterSum = await givenSut()
      .withSender({ riskScore: 590, isInternal: true })
      .withReceiver({ riskScore: 4, isInternal: false })
      .processTransaction();

    const doubleBlock = await givenSut()
      .withSender({ riskScore: 600, isInternal: true })
      .withReceiver({ riskScore: 600, isInternal: true })
      .processTransaction();

    expect(senderLessThan600AfterSum.senderGotBlocked).toBe(false);
    expect(senderLessThan600AfterSum.senderUpdatedScore).toBeLessThan(600);

    expect(senderOver600AfterSum.senderGotBlocked).toBe(true);
    expect(senderOver600AfterSum.senderUpdatedScore).toBeGreaterThan(600);

    expect(doubleBlock.senderGotBlocked).toBe(true);
    expect(doubleBlock.receiverGotBlocked).toBe(true);
  });
});
