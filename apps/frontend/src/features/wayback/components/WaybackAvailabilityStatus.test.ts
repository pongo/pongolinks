import { mount } from "@vue/test-utils";
import { describe, expect, it, vi } from "vitest";

import WaybackAvailabilityStatus from "./WaybackAvailabilityStatus.vue";

describe("WaybackAvailabilityStatus", () => {
  it("renders checking state", () => {
    const wrapper = mount(WaybackAvailabilityStatus, {
      props: {
        status: { kind: "checking" },
      },
    });

    expect(wrapper.text()).toContain("Checking Wayback availability...");
  });

  it("renders archived state with snapshot link and readable timestamp", () => {
    const wrapper = mount(WaybackAvailabilityStatus, {
      props: {
        status: {
          kind: "available",
          archivedUrl: "http://web.archive.org/web/20260212061822/https://example.com",
          timestamp: "20260212061822",
        },
      },
    });

    expect(wrapper.text()).toContain("Archived snapshot found on");
    expect(wrapper.text()).toContain("2026");
    const link = wrapper.get("a");
    expect(link.attributes("href")).toBe(
      "http://web.archive.org/web/20260212061822/https://example.com",
    );
  });

  it("renders unavailable state with Wayback browse link", () => {
    const wrapper = mount(WaybackAvailabilityStatus, {
      props: {
        status: { kind: "unavailable" },
        url: "https://example.com/missing",
      },
    });

    expect(wrapper.text()).toContain("No Wayback snapshot found for this URL.");
    const link = wrapper.get("a");
    expect(link.attributes("href")).toBe("https://web.archive.org/web/https://example.com/missing");
  });

  it("renders non-blocking error state", () => {
    const wrapper = mount(WaybackAvailabilityStatus, {
      props: {
        status: { kind: "error", message: "Could not check Wayback availability right now." },
      },
    });

    expect(wrapper.text()).toContain("Could not check Wayback availability right now.");
  });

  it("runs one-time check for edit form after bookmark URL is shown", async () => {
    vi.useFakeTimers();
    const check = vi.fn().mockResolvedValue({
      isOk: true,
      isErr: false,
      value: { available: false },
    });

    const wrapper = mount(WaybackAvailabilityStatus, {
      props: {
        url: "https://example.com/edit",
        initialCheckUrl: "https://example.com/edit",
        check,
      },
    });

    await vi.advanceTimersByTimeAsync(400);
    await Promise.resolve();
    expect(check).toHaveBeenCalledTimes(1);
    expect(check).toHaveBeenCalledWith("https://example.com/edit");

    await wrapper.setProps({ url: "https://example.com/edit" });
    await vi.advanceTimersByTimeAsync(400);
    await Promise.resolve();
    expect(check).toHaveBeenCalledTimes(1);
    vi.useRealTimers();
  });

  it("runs one-time check for create form when initial route URL reaches final form", async () => {
    vi.useFakeTimers();
    const check = vi.fn().mockResolvedValue({
      isOk: true,
      isErr: false,
      value: {
        available: true,
        archivedUrl: "http://web.archive.org/web/20260212061822/https://example.com/create",
        timestamp: "20260212061822",
      },
    });

    mount(WaybackAvailabilityStatus, {
      props: {
        url: "https://example.com/create",
        initialCheckUrl: "https://example.com/create",
        check,
      },
    });

    await vi.advanceTimersByTimeAsync(400);
    await Promise.resolve();
    expect(check).toHaveBeenCalledTimes(1);
    expect(check).toHaveBeenCalledWith("https://example.com/create");
    vi.useRealTimers();
  });

  it("does not check Wayback for empty manual create form", async () => {
    vi.useFakeTimers();
    const check = vi.fn();

    mount(WaybackAvailabilityStatus, {
      props: {
        url: "",
        initialCheckUrl: "",
        check,
      },
    });

    await vi.advanceTimersByTimeAsync(400);
    await Promise.resolve();
    expect(check).not.toHaveBeenCalled();
    vi.useRealTimers();
  });

  it("hides status after URL edit from the initial check target", async () => {
    vi.useFakeTimers();
    const check = vi.fn().mockResolvedValue({
      isOk: true,
      isErr: false,
      value: { available: false },
    });

    const wrapper = mount(WaybackAvailabilityStatus, {
      props: {
        url: "https://example.com/original",
        initialCheckUrl: "https://example.com/original",
        check,
      },
    });

    await vi.advanceTimersByTimeAsync(400);
    await Promise.resolve();
    expect(wrapper.text()).toContain("No Wayback snapshot found for this URL.");

    await wrapper.setProps({ url: "https://example.com/edited" });
    await Promise.resolve();
    expect(wrapper.text()).toBe("");
    expect(check).toHaveBeenCalledTimes(1);
    vi.useRealTimers();
  });
});
