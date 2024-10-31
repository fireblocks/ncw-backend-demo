import { ActiveTxPoller, PollingMode } from "./polling.service";
import { TransactionStatus } from "fireblocks-sdk";

function flushPromises() {
  return new Promise((resolve) =>
    jest.requireActual("timers").setImmediate(resolve),
  );
}

describe("ActiveTxPoller", () => {
  let pollAndUpdateFn: jest.Mock;
  let activeTxPoller: ActiveTxPoller;

  beforeEach(() => {
    pollAndUpdateFn = jest.fn();
    activeTxPoller = new ActiveTxPoller(pollAndUpdateFn);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should add active transaction", () => {
    const txId = "123";
    const tx = { id: txId, status: TransactionStatus.SUBMITTED };
    activeTxPoller.handleActiveTx(tx);

    expect(activeTxPoller["activeTxIds"]).toContain(txId);
    expect(activeTxPoller["active"]).toBe(true);
    expect(pollAndUpdateFn).toHaveBeenCalledTimes(1);
    expect(pollAndUpdateFn).toHaveBeenCalledWith(PollingMode.BY_IDS, [txId]);
  });

  it("final transaction arrived first time", () => {
    const txId = "123";
    const tx = { id: txId, status: TransactionStatus.COMPLETED };
    activeTxPoller.handleActiveTx(tx);

    expect(activeTxPoller["activeTxIds"]).not.toContain(txId);
    expect(activeTxPoller["active"]).toBe(false);
    expect(pollAndUpdateFn).not.toHaveBeenCalled();
  });

  it("should remove active transaction when it is final", async () => {
    jest.useFakeTimers();

    const txId = "123";
    const tx = { id: txId, status: TransactionStatus.SUBMITTED };
    activeTxPoller.handleActiveTx(tx);

    expect(activeTxPoller["activeTxIds"]).toContain(txId);
    expect(activeTxPoller["active"]).toBe(true);
    expect(pollAndUpdateFn).toHaveBeenCalledTimes(1);
    expect(pollAndUpdateFn).toHaveBeenCalledWith(PollingMode.BY_IDS, [txId]);

    activeTxPoller.handleActiveTx({
      ...tx,
      status: TransactionStatus.COMPLETED,
    });

    expect(activeTxPoller["activeTxIds"]).not.toContain(txId);

    // wait for the polling loop to finish
    await flushPromises();
    jest.advanceTimersByTime(10_000);
    await Promise.resolve();

    expect(activeTxPoller["active"]).toBe(false);
    expect(pollAndUpdateFn).toHaveBeenCalledTimes(1);

    jest.useRealTimers();
  });

  it("should remove active transaction after a timeout", async () => {
    jest.useFakeTimers();

    const txId = "123";
    const tx = { id: txId, status: TransactionStatus.SUBMITTED };
    activeTxPoller.handleActiveTx(tx);

    expect(activeTxPoller["activeTxIds"]).toContain(txId);
    expect(activeTxPoller["active"]).toBe(true);
    expect(pollAndUpdateFn).toHaveBeenCalledTimes(1);
    expect(pollAndUpdateFn).toHaveBeenCalledWith(PollingMode.BY_IDS, [txId]);

    // wait for the polling loop to finish
    for (let i = 0; i < 12; i++) {
      await flushPromises();
      jest.advanceTimersByTime(10_000);
      expect(activeTxPoller["active"]).toBe(true);
    }
    await flushPromises();

    expect(activeTxPoller["activeTxIds"]).not.toContain(txId);
    expect(activeTxPoller["active"]).toBe(false);
    expect(pollAndUpdateFn).toHaveBeenCalledTimes(12);

    jest.useRealTimers();
  });
});
