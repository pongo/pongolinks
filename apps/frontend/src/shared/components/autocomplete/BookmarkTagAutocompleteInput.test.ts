import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";

import type { TagSummaryDTO } from "#/features/tags/types.ts";
import {
  replaceCurrentTagToken,
  suggestTags,
} from "../../../features/bookmark-editor/components/BookmarkTagInput/tag-autocomplete.ts";
import {
  replaceCurrentSearchTagToken,
  suggestSearchFieldTags,
} from "#/features/bookmarks/views/BookmarkListView/search/search-tag-autocomplete.ts";
import BookmarkTagAutocompleteInput from "./BookmarkTagAutocompleteInput.vue";

type TagAutocomplete = {
  replaceCurrentTagToken: (
    value: string,
    cursor: number,
    tagName: string,
  ) => { value: string; cursor: number };
  suggestTags: (tags: TagSummaryDTO[], value: string, cursor: number) => TagSummaryDTO[];
};

const TAGS: TagSummaryDTO[] = [
  { id: 1, name: "Article", nameLower: "article", usageCount: 9 },
  { id: 2, name: "Architecture", nameLower: "architecture", usageCount: 6 },
  { id: 3, name: "Tools", nameLower: "tools", usageCount: 3 },
];

const contexts: Array<{
  name: string;
  autocomplete: TagAutocomplete;
  selectionSeed: string;
  completedTokenWithSpace: string;
  noSuggestionsText: string;
}> = [
  {
    name: "bookmark tags",
    autocomplete: {
      replaceCurrentTagToken,
      suggestTags,
    },
    selectionSeed: "ar",
    completedTokenWithSpace: "Article ",
    noSuggestionsText: "plain text",
  },
  {
    name: "search tags",
    autocomplete: {
      replaceCurrentTagToken: replaceCurrentSearchTagToken,
      suggestTags: suggestSearchFieldTags,
    },
    selectionSeed: "#ar",
    completedTokenWithSpace: "#Article ",
    noSuggestionsText: "plain text",
  },
];

function mountInput({
  autocomplete,
  modelValue = "",
  showClearButton = false,
  enterKeyBehavior,
}: {
  autocomplete: TagAutocomplete;
  modelValue?: string;
  showClearButton?: boolean;
  enterKeyBehavior?: "select-suggestion" | "submit";
}) {
  return mount(BookmarkTagAutocompleteInput, {
    props: {
      modelValue,
      tagSuggestions: TAGS,
      autocomplete,
      inputClass: "test-input",
      tagListboxId: "bookmark-tag-listbox",
      showClearButton,
      enterKeyBehavior,
    },
    attachTo: document.body,
  });
}

describe.each(contexts)("BookmarkTagAutocompleteInput ($name)", (context) => {
  it("does not open suggestions on plain focus when current cursor has no suggestions", async () => {
    const wrapper = mountInput({
      autocomplete: context.autocomplete,
      modelValue: context.noSuggestionsText,
    });
    const input = wrapper.get("input");
    const element = input.element as HTMLInputElement;

    element.setSelectionRange(element.value.length, element.value.length);
    await input.trigger("focus");

    expect(wrapper.find('[role="listbox"]').exists()).toBe(false);
    wrapper.unmount();
  });

  it("does not reopen suggestions for a completed tag token followed by a space", async () => {
    const wrapper = mountInput({
      autocomplete: context.autocomplete,
      modelValue: context.completedTokenWithSpace,
    });
    const input = wrapper.get("input");
    const element = input.element as HTMLInputElement;

    element.setSelectionRange(element.value.length, element.value.length);
    await input.trigger("focus");
    await input.trigger("click");
    await input.trigger("input");

    expect(wrapper.find('[role="listbox"]').exists()).toBe(false);
    wrapper.unmount();
  });

  it("highlights the first suggestion when suggestions open from input", async () => {
    const wrapper = mountInput({
      autocomplete: context.autocomplete,
      modelValue: context.selectionSeed,
    });
    const input = wrapper.get("input");
    const element = input.element as HTMLInputElement;

    element.setSelectionRange(context.selectionSeed.length, context.selectionSeed.length);
    await input.trigger("input");

    const options = wrapper.findAll('[role="option"]');
    expect(options).toHaveLength(2);
    expect(options[0]?.attributes("aria-selected")).toBe("true");
    expect(element.getAttribute("aria-activedescendant")).toBe("bookmark-tag-listbox-1");
    wrapper.unmount();
  });

  it.each(["Enter", "Tab"])(
    "opens with ArrowDown and selects active suggestion with %s",
    async (selectKey) => {
      const wrapper = mountInput({
        autocomplete: context.autocomplete,
        modelValue: context.selectionSeed,
      });
      const input = wrapper.get("input");
      const element = input.element as HTMLInputElement;

      element.focus();
      element.setSelectionRange(context.selectionSeed.length, context.selectionSeed.length);

      await input.trigger("keydown", { key: "ArrowDown" });
      expect(wrapper.find('[role="listbox"]').exists()).toBe(true);

      await input.trigger("keydown", { key: selectKey });

      const expected = context.autocomplete.replaceCurrentTagToken(
        context.selectionSeed,
        context.selectionSeed.length,
        "Article",
      );
      const updateEvents = wrapper.emitted("update:modelValue");

      expect(updateEvents?.at(-1)).toEqual([expected.value]);
      expect(wrapper.find('[role="listbox"]').exists()).toBe(false);
      expect(document.activeElement).toBe(element);
      expect(element.selectionStart).toBe(expected.cursor);
      expect(element.selectionEnd).toBe(expected.cursor);
      wrapper.unmount();
    },
  );

  it("closes suggestions on blur", async () => {
    const wrapper = mountInput({
      autocomplete: context.autocomplete,
      modelValue: context.selectionSeed,
    });
    const input = wrapper.get("input");
    const element = input.element as HTMLInputElement;

    element.setSelectionRange(context.selectionSeed.length, context.selectionSeed.length);
    await input.trigger("keydown", { key: "ArrowDown" });
    expect(wrapper.find('[role="listbox"]').exists()).toBe(true);

    await input.trigger("blur");
    expect(wrapper.find('[role="listbox"]').exists()).toBe(false);
    wrapper.unmount();
  });
});

describe("BookmarkTagAutocompleteInput submit-on-enter behavior", () => {
  const autocomplete: TagAutocomplete = {
    replaceCurrentTagToken: replaceCurrentSearchTagToken,
    suggestTags: suggestSearchFieldTags,
  };

  it("selects the active suggestion and submits when Enter is pressed", async () => {
    const wrapper = mountInput({
      autocomplete,
      modelValue: "#ar",
      enterKeyBehavior: "submit",
    });
    const input = wrapper.get("input");
    const element = input.element as HTMLInputElement;

    element.focus();
    element.setSelectionRange(element.value.length, element.value.length);

    await input.trigger("keydown", { key: "ArrowDown" });
    expect(wrapper.find('[role="listbox"]').exists()).toBe(true);

    await input.trigger("keydown", { key: "Enter" });

    const expected = replaceCurrentSearchTagToken("#ar", "#ar".length, "Article");
    expect(wrapper.emitted("update:modelValue")?.at(-1)).toEqual([expected.value]);
    expect(wrapper.emitted("submit")).toHaveLength(1);
    expect(wrapper.find('[role="listbox"]').exists()).toBe(false);
    wrapper.unmount();
  });

  it("still selects the active suggestion with Tab in submit-on-enter mode", async () => {
    const wrapper = mountInput({
      autocomplete,
      modelValue: "#ar",
      enterKeyBehavior: "submit",
    });
    const input = wrapper.get("input");
    const element = input.element as HTMLInputElement;

    element.focus();
    element.setSelectionRange(element.value.length, element.value.length);

    await input.trigger("keydown", { key: "ArrowDown" });
    await input.trigger("keydown", { key: "Tab" });

    const expected = replaceCurrentSearchTagToken("#ar", "#ar".length, "Article");
    expect(wrapper.emitted("update:modelValue")?.at(-1)).toEqual([expected.value]);
    expect(wrapper.emitted("submit")).toBeUndefined();
    expect(wrapper.find('[role="listbox"]').exists()).toBe(false);
    wrapper.unmount();
  });
});

describe("BookmarkTagAutocompleteInput clear button", () => {
  const autocomplete: TagAutocomplete = {
    replaceCurrentTagToken,
    suggestTags,
  };

  it("is hidden when clear button is disabled", () => {
    const wrapper = mountInput({
      autocomplete,
      modelValue: "Article",
      showClearButton: false,
    });

    expect(wrapper.find('button[aria-label="Clear"]').exists()).toBe(false);
    wrapper.unmount();
  });

  it("is hidden when value is empty after trimming", () => {
    const wrapper = mountInput({
      autocomplete,
      modelValue: "   ",
      showClearButton: true,
    });

    expect(wrapper.find('button[aria-label="Clear"]').exists()).toBe(false);
    wrapper.unmount();
  });

  it("is visible for non-empty value and emits clear on click", async () => {
    const wrapper = mountInput({
      autocomplete,
      modelValue: "Article",
      showClearButton: true,
    });
    const clearButton = wrapper.get('button[aria-label="Clear"]');

    await clearButton.trigger("click");
    expect(wrapper.emitted("clear")).toHaveLength(1);
    wrapper.unmount();
  });
});
