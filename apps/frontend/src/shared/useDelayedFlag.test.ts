import { effectScope } from "vue";
import { afterEach, describe, expect, it, vi } from "vitest";

import { useDelayedFlag } from "./useDelayedFlag";

function createDelayedFlag(delayMs: number) {
  const scope = effectScope();
  const delayedFlag = scope.run(() => useDelayedFlag(delayMs));

  if (delayedFlag === undefined) {
    throw new Error("useDelayedFlag setup failed");
  }

  return {
    ...delayedFlag,
    dispose: () => scope.stop(),
  };
}

describe("useDelayedFlag", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("starts as not delayed", () => {
    const { isDelayed, dispose } = createDelayedFlag(1000);

    expect(isDelayed.value).toBe(false);

    dispose();
  });

  it("flips only after the delay passes", () => {
    vi.useFakeTimers();

    const { isDelayed, start, stop, dispose } = createDelayedFlag(1000);

    start();
    vi.advanceTimersByTime(999);

    expect(isDelayed.value).toBe(false);

    vi.advanceTimersByTime(1);

    expect(isDelayed.value).toBe(true);

    stop();
    dispose();
  });

  it("stop clears a pending timer and resets the flag", () => {
    vi.useFakeTimers();

    const { isDelayed, start, stop, dispose } = createDelayedFlag(1000);

    start();
    stop();
    vi.advanceTimersByTime(1000);

    expect(isDelayed.value).toBe(false);

    dispose();
  });

  it("repeated start restarts the delay", () => {
    vi.useFakeTimers();

    const { isDelayed, start, stop, dispose } = createDelayedFlag(1000);

    start();
    vi.advanceTimersByTime(900);
    start();
    vi.advanceTimersByTime(999);

    expect(isDelayed.value).toBe(false);

    vi.advanceTimersByTime(1);

    expect(isDelayed.value).toBe(true);

    stop();
    dispose();
  });

  it("scope disposal clears a pending timer", () => {
    vi.useFakeTimers();

    const { isDelayed, start, dispose } = createDelayedFlag(1000);

    start();
    dispose();
    vi.advanceTimersByTime(1000);

    expect(isDelayed.value).toBe(false);
  });
});
