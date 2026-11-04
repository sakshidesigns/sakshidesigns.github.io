import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("subscribeTick", () => {
  let rafCallbacks: FrameRequestCallback[];
  let cancelled: number[];
  let nextId: number;
  let subscribeTick: (callback: (timestamp: number) => void) => () => void;

  beforeEach(async () => {
    vi.resetModules();
    rafCallbacks = [];
    cancelled = [];
    nextId = 1;
    vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => {
      rafCallbacks.push(cb);
      return nextId++;
    });
    vi.stubGlobal("cancelAnimationFrame", (id: number) => {
      cancelled.push(id);
    });
    const module = await import("./ticker");
    subscribeTick = module.subscribeTick;
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  function flushOneFrame(timestamp: number) {
    const pending = rafCallbacks.splice(0, rafCallbacks.length);
    pending.forEach((cb) => cb(timestamp));
  }

  it("invokes a subscribed callback on the next animation frame", () => {
    const calls: number[] = [];
    subscribeTick((t) => calls.push(t));
    flushOneFrame(16);
    expect(calls).toEqual([16]);
  });

  it("invokes multiple subscribers with the same timestamp", () => {
    const callsA: number[] = [];
    const callsB: number[] = [];
    subscribeTick((t) => callsA.push(t));
    subscribeTick((t) => callsB.push(t));
    flushOneFrame(32);
    expect(callsA).toEqual([32]);
    expect(callsB).toEqual([32]);
  });

  it("stops invoking a callback after it unsubscribes", () => {
    const calls: number[] = [];
    const unsubscribe = subscribeTick((t) => calls.push(t));
    flushOneFrame(1);
    unsubscribe();
    flushOneFrame(2);
    expect(calls).toEqual([1]);
  });

  it("cancels the underlying animation frame once the last subscriber unsubscribes", () => {
    const unsubscribe = subscribeTick(() => {});
    flushOneFrame(1);
    unsubscribe();
    expect(cancelled.length).toBeGreaterThan(0);
  });
});
