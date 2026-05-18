import { computed, ref, watch, type ComputedRef } from "vue";

type UseTagAutocompleteInteractionOptions = {
  listboxId: string;
  suggestionCount: ComputedRef<number>;
  getSuggestionId: (index: number) => number | string | undefined;
};

export function useTagAutocompleteInteraction({
  listboxId,
  suggestionCount,
  getSuggestionId,
}: UseTagAutocompleteInteractionOptions) {
  const isOpen = ref(false);
  const activeIndex = ref(-1);
  const activeDescendantId = computed(() => {
    if (!isOpen.value || activeIndex.value < 0) {
      return undefined;
    }

    const suggestionId = getSuggestionId(activeIndex.value);
    return suggestionId === undefined ? undefined : `${listboxId}-${suggestionId}`;
  });
  const selectableIndex = computed(() => (activeIndex.value >= 0 ? activeIndex.value : 0));

  watch(suggestionCount, (count) => {
    if (count === 0) {
      close();
      return;
    }

    if (activeIndex.value >= count) {
      activeIndex.value = count - 1;
    }
  });

  function openIfAny() {
    isOpen.value = suggestionCount.value > 0;
  }

  function close() {
    isOpen.value = false;
    resetActive();
  }

  function resetActive() {
    activeIndex.value = -1;
  }

  function moveActive(offset: number) {
    const count = suggestionCount.value;
    if (count === 0) {
      return;
    }

    isOpen.value = true;
    activeIndex.value =
      activeIndex.value < 0
        ? offset > 0
          ? 0
          : count - 1
        : (activeIndex.value + offset + count) % count;
  }

  return {
    activeDescendantId,
    activeIndex,
    close,
    isOpen,
    moveActive,
    openIfAny,
    resetActive,
    selectableIndex,
  };
}
