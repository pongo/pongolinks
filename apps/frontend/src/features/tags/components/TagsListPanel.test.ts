import { flushPromises, mount } from "@vue/test-utils";
import { Ok } from "@pongolinks/shared/result";
import { afterEach, describe, expect, it, vi } from "vitest";

import TagsListPanel from "./TagsListPanel.vue";
import { deleteTag, listTags } from "../api";
import type { TagSummaryDTO } from "../types";

vi.mock("../api", () => ({
  deleteTag: vi.fn(),
  listTags: vi.fn(),
  updateTag: vi.fn(),
}));

function createTags(count: number): TagSummaryDTO[] {
  return Array.from({ length: count }, (_, index) => {
    const id = index + 1;
    const name = `tag-${id.toString().padStart(4, "0")}`;

    return {
      id,
      name,
      nameLower: name,
      usageCount: count - index,
    };
  });
}

function mountPanel() {
  return mount(TagsListPanel, {
    global: {
      stubs: {
        RouterLink: {
          props: ["to"],
          template: "<a><slot /></a>",
        },
      },
    },
  });
}

describe("TagsListPanel", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("paginates tags locally and resets to the first page when filtering", async () => {
    const scrollTo = vi.fn();
    vi.stubGlobal("scrollTo", scrollTo);
    vi.mocked(listTags).mockResolvedValue(Ok({ tags: createTags(501) }));

    const wrapper = mountPanel();
    await flushPromises();

    expect(wrapper.text()).toContain("Showing 1-500 of 501 tags");
    expect(wrapper.text()).toContain("tag-0001");
    expect(wrapper.text()).not.toContain("tag-0501");

    await wrapper.get("button[aria-label='Next page']").trigger("click");

    expect(wrapper.text()).toContain("Showing 501-501 of 501 tags");
    expect(wrapper.text()).toContain("tag-0501");
    expect(scrollTo).toHaveBeenCalledWith({ top: 0, behavior: "instant" });

    await wrapper.get("#tags-filter").setValue("tag-0501");

    expect(wrapper.text()).toContain("Showing 1-1 of 1 tag");
    expect(wrapper.text()).toContain("tag-0501");
  });

  it("clamps the current page after a delete reload shrinks the list", async () => {
    vi.stubGlobal(
      "confirm",
      vi.fn(() => true),
    );
    vi.mocked(listTags)
      .mockResolvedValueOnce(Ok({ tags: createTags(1001) }))
      .mockResolvedValueOnce(Ok({ tags: createTags(900) }));
    vi.mocked(deleteTag).mockResolvedValue(Ok({ deletedTagId: 1001 }));

    const wrapper = mountPanel();
    await flushPromises();

    await wrapper.get("button[aria-label='Next page']").trigger("click");
    await wrapper.get("button[aria-label='Next page']").trigger("click");

    expect(wrapper.text()).toContain("Showing 1001-1001 of 1001 tags");

    await wrapper.get("button[aria-label='Delete tag tag-1001']").trigger("click");
    await flushPromises();

    expect(wrapper.text()).toContain("Showing 501-900 of 900 tags");
    expect(wrapper.text()).not.toContain("tag-1001");
  });
});
