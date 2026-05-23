import { mount } from "@vue/test-utils";
import { nextTick } from "vue";
import { describe, expect, it } from "vitest";

import type { TagSummaryDTO } from "../types";
import TagsTable from "./TagsTable.vue";

const tags: TagSummaryDTO[] = [
  {
    id: 1,
    name: "alpha",
    nameLower: "alpha",
    usageCount: 2,
  },
  {
    id: 2,
    name: "beta",
    nameLower: "beta",
    usageCount: 1,
  },
];
const alphaTag = tags[0]!;
const betaTag = tags[1]!;

type TagsTableProps = {
  tags: TagSummaryDTO[];
  isSaving: boolean;
  editingTag: TagSummaryDTO | null;
  editingName: string;
  editingError: string;
};

function mountTable(overrides: Partial<TagsTableProps> = {}) {
  return mount(TagsTable, {
    attachTo: document.body,
    props: {
      tags,
      isSaving: false,
      editingTag: null,
      editingName: "",
      editingError: "",
      ...overrides,
    },
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

describe("TagsTable", () => {
  it("emits edit and delete requests for selected tags", async () => {
    const wrapper = mountTable();

    await wrapper.get("button[aria-label='Edit tag alpha']").trigger("click");
    await wrapper.get("button[aria-label='Delete tag beta']").trigger("click");

    expect(wrapper.emitted("edit-request")).toEqual([[alphaTag]]);
    expect(wrapper.emitted("delete-request")).toEqual([[betaTag]]);

    wrapper.unmount();
  });

  it("focuses the inline editor and emits save/cancel keyboard actions", async () => {
    const wrapper = mountTable();

    await wrapper.setProps({
      editingTag: alphaTag,
      editingName: alphaTag.name,
    });
    await nextTick();

    const input = wrapper.get("input");
    expect(document.activeElement).toBe(input.element);

    await input.setValue("renamed");
    await input.trigger("keydown", { key: "Enter" });
    await input.trigger("keydown", { key: "Escape" });

    expect(wrapper.emitted("update:editingName")).toEqual([["renamed"]]);
    expect(wrapper.emitted("save-edit")).toHaveLength(1);
    expect(wrapper.emitted("cancel-edit")).toHaveLength(1);

    wrapper.unmount();
  });

  it("disables deleting the row currently being edited", () => {
    const wrapper = mountTable({
      editingTag: alphaTag,
      editingName: alphaTag.name,
    });

    expect(wrapper.get("button[aria-label='Delete tag alpha']").attributes("disabled")).toBe("");
    expect(wrapper.get("button[aria-label='Delete tag beta']").attributes("disabled")).toBe(
      undefined,
    );

    wrapper.unmount();
  });
});
