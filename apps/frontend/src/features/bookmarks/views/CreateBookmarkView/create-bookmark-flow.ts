import { clean as tidyUrl } from "tidy-url";

import type { EditableBookmarkPayload } from "../../types.ts";
import type { BookmarkFormInitialFocusTarget } from "../../components/BookmarkForm/bookmark-form-state.ts";
import type { BookmarkUrlCheckBookmark, BookmarkUrlCheckResult } from "#/features/search/types.ts";

export type CreateBookmarkState =
  | { kind: "checking"; url: string; title: string; closeAfterCreate: boolean }
  | { kind: "choose-url"; originalUrl: string; cleanedUrl: string; title: string }
  | {
      kind: "duplicate-bookmark";
      bookmark: BookmarkUrlCheckBookmark;
      initialUrl: string;
      initialTitle: string;
      closeAfterCreate: boolean;
    }
  | {
      kind: "related-link-matches";
      bookmarks: BookmarkUrlCheckBookmark[];
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

export function resolveCreateBookmarkState(input: CreateBookmarkQueryInput): CreateBookmarkState {
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

export function chooseBookmarkCreateUrl(
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

export function resolveCheckedBookmarkState(
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
      bookmark: checkResult.bookmark,
      initialUrl: checkingState.url,
      initialTitle: checkingState.title,
      closeAfterCreate: checkingState.closeAfterCreate,
    };
  }

  if (checkResult.status === "related-link") {
    return {
      kind: "related-link-matches",
      bookmarks: checkResult.bookmarks,
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

export function continueAfterDuplicateOrRelated(
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

export function createInitialBookmarkPayload(
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
