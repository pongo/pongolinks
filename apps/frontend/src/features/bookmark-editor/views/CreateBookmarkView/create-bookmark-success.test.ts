import { describe, expect, it, vi } from "vitest";

import { handleCreateBookmarkSuccess } from "./create-bookmark-success.ts";

describe("create bookmark success behavior", () => {
  it("navigates to list for manual create", async () => {
    const navigateToList = vi.fn(async () => {});
    const closeWindow = vi.fn();

    await handleCreateBookmarkSuccess({
      closeAfterCreate: false,
      closeWindow,
      isWindowClosed: () => false,
      navigateToList,
      wait: async () => {},
    });

    expect(closeWindow).not.toHaveBeenCalled();
    expect(navigateToList).toHaveBeenCalledOnce();
  });

  it("attempts to close window for bookmarklet-assisted create", async () => {
    const navigateToList = vi.fn(async () => {});
    const closeWindow = vi.fn();

    await handleCreateBookmarkSuccess({
      closeAfterCreate: true,
      closeWindow,
      isWindowClosed: () => true,
      navigateToList,
      wait: async () => {},
    });

    expect(closeWindow).toHaveBeenCalledOnce();
    expect(navigateToList).not.toHaveBeenCalled();
  });

  it("falls back to list when browser keeps tab open", async () => {
    const navigateToList = vi.fn(async () => {});
    const closeWindow = vi.fn();

    await handleCreateBookmarkSuccess({
      closeAfterCreate: true,
      closeWindow,
      isWindowClosed: () => false,
      navigateToList,
      wait: async () => {},
    });

    expect(closeWindow).toHaveBeenCalledOnce();
    expect(navigateToList).toHaveBeenCalledOnce();
  });
});
