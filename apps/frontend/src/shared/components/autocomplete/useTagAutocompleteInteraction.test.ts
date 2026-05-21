import { computed, nextTick, ref } from "vue";
import { describe, expect, it } from "vitest";

import { useTagAutocompleteInteraction } from "./useTagAutocompleteInteraction.ts";

function setupInteraction(initialSuggestions: Array<{ id: string }> = []) {
  const suggestions = ref(initialSuggestions);
  const interaction = useTagAutocompleteInteraction({
    listboxId: "tag-listbox",
    suggestionCount: computed(() => suggestions.value.length),
    getSuggestionId: (index) => suggestions.value[index]?.id,
  });

  return { interaction, suggestions };
}

describe("tag autocomplete interaction", () => {
  it("starts closed without an active suggestion", () => {
    const { interaction } = setupInteraction();

    expect(interaction.isOpen.value).toBe(false);
    expect(interaction.activeIndex.value).toBe(-1);
    expect(interaction.activeDescendantId.value).toBeUndefined();
    expect(interaction.selectableIndex.value).toBe(0);
  });

  it("opens only when suggestions exist and activates the first suggestion", () => {
    const { interaction, suggestions } = setupInteraction();

    interaction.openIfAny();
    expect(interaction.isOpen.value).toBe(false);
    expect(interaction.activeIndex.value).toBe(-1);

    suggestions.value = [{ id: "one" }];
    interaction.openIfAny();

    expect(interaction.isOpen.value).toBe(true);
    expect(interaction.activeIndex.value).toBe(0);
    expect(interaction.activeDescendantId.value).toBe("tag-listbox-one");
  });

  it("moves through suggestions and wraps around", () => {
    const { interaction } = setupInteraction([{ id: "one" }, { id: "two" }, { id: "three" }]);

    interaction.moveActive(1);
    expect(interaction.isOpen.value).toBe(true);
    expect(interaction.activeIndex.value).toBe(0);
    expect(interaction.activeDescendantId.value).toBe("tag-listbox-one");

    interaction.moveActive(1);
    interaction.moveActive(1);
    interaction.moveActive(1);
    expect(interaction.activeIndex.value).toBe(0);

    interaction.moveActive(-1);
    expect(interaction.activeIndex.value).toBe(2);
  });

  it("closes and resets the active suggestion", () => {
    const { interaction } = setupInteraction([{ id: "one" }]);

    interaction.moveActive(1);
    interaction.close();

    expect(interaction.isOpen.value).toBe(false);
    expect(interaction.activeIndex.value).toBe(-1);
    expect(interaction.activeDescendantId.value).toBeUndefined();
  });

  it("clamps or closes when the suggestion count changes", async () => {
    const { interaction, suggestions } = setupInteraction([
      { id: "one" },
      { id: "two" },
      { id: "three" },
    ]);

    interaction.moveActive(-1);
    expect(interaction.activeIndex.value).toBe(2);

    suggestions.value = [{ id: "one" }];
    await nextTick();
    expect(interaction.activeIndex.value).toBe(0);

    suggestions.value = [];
    await nextTick();
    expect(interaction.isOpen.value).toBe(false);
    expect(interaction.activeIndex.value).toBe(-1);
  });
});
