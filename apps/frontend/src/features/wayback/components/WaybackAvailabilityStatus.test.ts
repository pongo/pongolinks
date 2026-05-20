import { flushPromises, mount } from "@vue/test-utils";
import { nextTick } from "vue";
import { describe, expect, it, vi } from "vitest";

import WaybackAvailabilityStatus from "./WaybackAvailabilityStatus.vue";

describe("WaybackAvailabilityStatus", () => {
  it("renders checking state without running an injected check", async () => {
    const check = vi.fn();
    const wrapper = mount(WaybackAvailabilityStatus, {
      props: {
        status: { kind: "checking" },
        url: "https://example.com/status",
        check,
      },
    });
    await nextTick();

    expect(wrapper.text()).toContain("Checking Wayback availability...");
    expect(check).not.toHaveBeenCalled();
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
    const check = vi.fn().mockResolvedValue({
      isOk: true,
      isErr: false,
      value: { available: false },
    });

    const wrapper = mount(WaybackAvailabilityStatus, {
      props: {
        url: "https://example.com/edit",
        check,
      },
    });

    await flushPromises();
    expect(check).toHaveBeenCalledTimes(1);
    expect(check).toHaveBeenCalledWith("https://example.com/edit");

    await wrapper.setProps({ url: "https://example.com/edit" });
    await flushPromises();
    expect(check).toHaveBeenCalledTimes(1);
  });

  it("runs one-time check for create form when initial route URL reaches final form", async () => {
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
        check,
      },
    });

    await flushPromises();
    expect(check).toHaveBeenCalledTimes(1);
    expect(check).toHaveBeenCalledWith("https://example.com/create");
  });

  it("does not check Wayback for empty manual create form", async () => {
    const check = vi.fn();

    mount(WaybackAvailabilityStatus, {
      props: {
        url: "",
        check,
      },
    });

    await flushPromises();
    expect(check).not.toHaveBeenCalled();
  });

  it("hides status after URL edit from the initial check target", async () => {
    const check = vi.fn().mockResolvedValue({
      isOk: true,
      isErr: false,
      value: { available: false },
    });

    const wrapper = mount(WaybackAvailabilityStatus, {
      props: {
        url: "https://example.com/original",
        check,
      },
    });

    await flushPromises();
    expect(wrapper.text()).toContain("No Wayback snapshot found for this URL.");

    await wrapper.setProps({ url: "https://example.com/edited" });
    await flushPromises();
    expect(wrapper.text()).toBe("");
    expect(check).toHaveBeenCalledTimes(1);
  });

  it("does not show a stale result when URL changes before the check resolves", async () => {
    let resolveCheck: (value: { isOk: true; isErr: false; value: { available: false } }) => void;
    const check = vi.fn(
      () =>
        new Promise<{
          isOk: true;
          isErr: false;
          value: { available: false };
        }>((resolve) => {
          resolveCheck = resolve;
        }),
    );

    const wrapper = mount(WaybackAvailabilityStatus, {
      props: {
        url: "https://example.com/original",
        check,
      },
    });

    await flushPromises();
    expect(wrapper.text()).toContain("Checking Wayback availability...");

    await wrapper.setProps({ url: "https://example.com/edited" });
    await nextTick();
    expect(wrapper.text()).toBe("");

    resolveCheck!({
      isOk: true,
      isErr: false,
      value: { available: false },
    });
    await flushPromises();
    await nextTick();

    expect(wrapper.text()).toBe("");
    expect(check).toHaveBeenCalledTimes(1);
  });
});
