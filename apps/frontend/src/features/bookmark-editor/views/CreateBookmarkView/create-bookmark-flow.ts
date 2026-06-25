import type { Result } from "@pongolinks/shared/result";
import { clean as tidyUrl } from "tidy-url";
import { computed, ref } from "vue";

import type { FormErrors, ApiError } from "#/shared/api/errors.ts";
import type { BookmarkDTO } from "#/features/bookmarks/types.ts";
import type { TagSummaryDTO } from "#/features/tags/types.ts";
import type { EditableBookmarkPayload } from "#/features/bookmark-editor/types.ts";
import { invalidateBookmarkUrlCheckCache } from "#/features/bookmark-editor/url-check-cache.ts";
import type { BookmarkFormInitialFocusTarget } from "../../components/BookmarkForm/bookmark-form-state.ts";
import type {
  BookmarkUrlCheckBookmark,
  BookmarkUrlCheckResult,
} from "#/features/check-url/types.ts";
import { diffUrls } from "./url-diff.ts";

type DuplicateBookmarkMatch = BookmarkUrlCheckBookmark & {
  editHref: string;
};

type RelatedLinkBookmarkMatch = BookmarkUrlCheckBookmark & {
  editHref: string;
};

export type CreateBookmarkState =
  | { kind: "checking"; url: string; title: string; closeAfterCreate: boolean }
  | { kind: "choose-url"; originalUrl: string; cleanedUrl: string; title: string }
  | {
      kind: "duplicate-bookmark";
      bookmark: DuplicateBookmarkMatch;
      initialUrl: string;
      initialTitle: string;
      closeAfterCreate: boolean;
    }
  | {
      kind: "related-link-matches";
      bookmarks: RelatedLinkBookmarkMatch[];
      initialUrl: string;
      initialTitle: string;
      closeAfterCreate: boolean;
    }
  | {
      kind: "create-form";
      initialUrl: string;
      initialTitle: string;
      focusTarget: BookmarkFormInitialFocusTarget;
      closeAfterCreate: boolean;
    };

export type CreateBookmarkQueryInput = {
  url?: string | string[];
  title?: string | string[];
};

type CreateBookmarkFlowOptions = {
  query: CreateBookmarkQueryInput;
  checkBookmarkUrl: (url: string) => Promise<Result<BookmarkUrlCheckResult, ApiError>>;
  createBookmark: (payload: EditableBookmarkPayload) => Promise<Result<BookmarkDTO, ApiError>>;
  listTags: () => Promise<Result<{ tags: TagSummaryDTO[] }, ApiError>>;
  onBookmarkSaved?: (bookmark: BookmarkDTO) => void;
  navigateToList: () => Promise<void>;
  navigateToEdit: (bookmarkId: number) => Promise<void>;
  closeWindow: () => void;
  isWindowClosed: () => boolean;
  wait: (ms: number) => Promise<void>;
};

const CLOSE_CHECK_DELAY_MS = 50;

function pickFirst(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}

function parseAbsoluteHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:" ? url : undefined;
  } catch {
    return undefined;
  }
}

function createEditHref(bookmarkId: number) {
  return `/bookmarks/${bookmarkId}/edit`;
}

function resolveCreateBookmarkState(input: CreateBookmarkQueryInput): CreateBookmarkState {
  const incomingUrl = pickFirst(input.url);
  if (incomingUrl === undefined) {
    return {
      kind: "create-form",
      initialUrl: "",
      initialTitle: "",
      focusTarget: "url",
      closeAfterCreate: false,
    };
  }

  const incomingTitle = pickFirst(input.title)?.trim() ?? "";
  const parsedIncoming = parseAbsoluteHttpUrl(incomingUrl);

  if (!parsedIncoming) {
    return {
      kind: "create-form",
      initialUrl: incomingUrl,
      initialTitle: incomingTitle,
      focusTarget: "url",
      closeAfterCreate: true,
    };
  }

  const cleanedUrl = tidyUrl(parsedIncoming.toString()).url;
  if (cleanedUrl === parsedIncoming.toString()) {
    return {
      kind: "checking",
      url: parsedIncoming.toString(),
      title: incomingTitle,
      closeAfterCreate: true,
    };
  }

  return {
    kind: "choose-url",
    originalUrl: parsedIncoming.toString(),
    cleanedUrl,
    title: incomingTitle,
  };
}

function chooseBookmarkCreateUrl(
  state: Extract<CreateBookmarkState, { kind: "choose-url" }>,
  choice: "original" | "cleaned",
): Extract<CreateBookmarkState, { kind: "checking" }> {
  return {
    kind: "checking",
    url: choice === "original" ? state.originalUrl : state.cleanedUrl,
    title: state.title,
    closeAfterCreate: true,
  };
}

function resolveCheckedBookmarkState(
  checkResult: BookmarkUrlCheckResult,
  checkingState: Extract<CreateBookmarkState, { kind: "checking" }>,
):
  | Exclude<CreateBookmarkState, { kind: "checking" }>
  | { kind: "redirect-edit"; bookmarkId: number } {
  if (checkResult.status === "exact-bookmark") {
    return { kind: "redirect-edit", bookmarkId: checkResult.bookmark.id };
  }

  if (checkResult.status === "alternate-protocol-bookmark") {
    return {
      kind: "duplicate-bookmark",
      bookmark: {
        ...checkResult.bookmark,
        editHref: createEditHref(checkResult.bookmark.id),
      },
      initialUrl: checkingState.url,
      initialTitle: checkingState.title,
      closeAfterCreate: checkingState.closeAfterCreate,
    };
  }

  if (checkResult.status === "related-link") {
    return {
      kind: "related-link-matches",
      bookmarks: checkResult.bookmarks.map((bookmark) => ({
        ...bookmark,
        editHref: createEditHref(bookmark.id),
      })),
      initialUrl: checkingState.url,
      initialTitle: checkingState.title,
      closeAfterCreate: checkingState.closeAfterCreate,
    };
  }

  return {
    kind: "create-form",
    initialUrl: checkingState.url,
    initialTitle: checkingState.title,
    focusTarget: "tags",
    closeAfterCreate: checkingState.closeAfterCreate,
  };
}

function continueAfterDuplicateOrRelated(
  state:
    | Extract<CreateBookmarkState, { kind: "duplicate-bookmark" }>
    | Extract<CreateBookmarkState, { kind: "related-link-matches" }>,
): Extract<CreateBookmarkState, { kind: "create-form" }> {
  return {
    kind: "create-form",
    initialUrl: state.initialUrl,
    initialTitle: state.initialTitle,
    focusTarget: "tags",
    closeAfterCreate: state.closeAfterCreate,
  };
}

function createInitialBookmarkPayload(
  state: Extract<CreateBookmarkState, { kind: "create-form" }>,
): EditableBookmarkPayload {
  return {
    url: state.initialUrl,
    title: state.initialTitle,
    description: "",
    isPrivate: false,
    tagsText: "",
  };
}

async function handleCreateBookmarkSuccess(
  options: Pick<
    CreateBookmarkFlowOptions,
    "closeWindow" | "isWindowClosed" | "navigateToList" | "wait"
  > & {
    closeAfterCreate: boolean;
  },
) {
  if (!options.closeAfterCreate) {
    await options.navigateToList();
    return;
  }

  options.closeWindow();
  await options.wait(CLOSE_CHECK_DELAY_MS);

  if (!options.isWindowClosed()) {
    await options.navigateToList();
  }
}

export function useCreateBookmarkFlow(options: CreateBookmarkFlowOptions) {
  const errors = ref<FormErrors>({});
  const isSaving = ref(false);
  const isChecking = ref(false);
  const tagSuggestions = ref<TagSummaryDTO[]>([]);
  const state = ref<CreateBookmarkState>(resolveCreateBookmarkState(options.query));

  const urlChoiceDiff = computed(() =>
    state.value.kind === "choose-url"
      ? diffUrls(state.value.originalUrl, state.value.cleanedUrl)
      : null,
  );
  const formInitialValues = computed(() =>
    state.value.kind === "create-form" ? createInitialBookmarkPayload(state.value) : undefined,
  );
  const formInitialFocusTarget = computed(() =>
    state.value.kind === "create-form" ? state.value.focusTarget : "url",
  );

  async function start() {
    const [tagsResult] = await Promise.all([options.listTags(), runUrlCheckIfNeeded()]);

    if (tagsResult.isOk) {
      tagSuggestions.value = tagsResult.value.tags;
    }
  }

  async function submit(payload: EditableBookmarkPayload) {
    isSaving.value = true;
    errors.value = {};

    const result = await options.createBookmark(payload);

    if (result.isOk) {
      options.onBookmarkSaved?.(result.value);

      if (state.value.kind !== "create-form") {
        await options.navigateToList();
      } else {
        await handleCreateBookmarkSuccess({
          closeAfterCreate: state.value.closeAfterCreate,
          closeWindow: options.closeWindow,
          isWindowClosed: options.isWindowClosed,
          navigateToList: options.navigateToList,
          wait: options.wait,
        });
      }
    } else {
      errors.value = result.error.formErrors;
    }

    isSaving.value = false;
  }

  function chooseOriginalUrl() {
    if (state.value.kind !== "choose-url") {
      return;
    }

    state.value = chooseBookmarkCreateUrl(state.value, "original");
    void runUrlCheckIfNeeded();
  }

  function chooseCleanedUrl() {
    if (state.value.kind !== "choose-url") {
      return;
    }

    state.value = chooseBookmarkCreateUrl(state.value, "cleaned");
    void runUrlCheckIfNeeded();
  }

  function createAnyway() {
    if (state.value.kind === "duplicate-bookmark" || state.value.kind === "related-link-matches") {
      state.value = continueAfterDuplicateOrRelated(state.value);
    }
  }

  async function runUrlCheckIfNeeded() {
    if (state.value.kind !== "checking" || isChecking.value) {
      return;
    }

    isChecking.value = true;
    errors.value = {};

    const checkingState = state.value;
    const result = await options.checkBookmarkUrl(checkingState.url);

    if (result.isErr) {
      state.value = {
        kind: "create-form",
        initialUrl: checkingState.url,
        initialTitle: checkingState.title,
        focusTarget: "url",
        closeAfterCreate: checkingState.closeAfterCreate,
      };
      errors.value = result.error.formErrors;
      isChecking.value = false;
      return;
    }

    const next = resolveCheckedBookmarkState(result.value, checkingState);
    if (next.kind === "redirect-edit") {
      await options.navigateToEdit(next.bookmarkId);
      isChecking.value = false;
      return;
    }

    state.value = next;
    isChecking.value = false;
  }

  return {
    state,
    errors,
    isSaving,
    isChecking,
    tagSuggestions,
    urlChoiceDiff,
    formInitialValues,
    formInitialFocusTarget,
    start,
    submit,
    chooseOriginalUrl,
    chooseCleanedUrl,
    createAnyway,
  };
}
