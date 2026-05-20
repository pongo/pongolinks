import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";

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
      },
    });

    expect(wrapper.text()).toContain("No Wayback snapshot found for this URL.");
    const link = wrapper.get("a");
    expect(link.attributes("href")).toBe("https://web.archive.org/web/");
  });

  it("renders non-blocking error state", () => {
    const wrapper = mount(WaybackAvailabilityStatus, {
      props: {
        status: { kind: "error", message: "Could not check Wayback availability right now." },
      },
    });

    expect(wrapper.text()).toContain("Could not check Wayback availability right now.");
  });
});
