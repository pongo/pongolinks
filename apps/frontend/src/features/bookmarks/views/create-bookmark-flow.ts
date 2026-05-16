import { clean as tidyUrl } from "tidy-url";

import type { EditableBookmarkPayload } from "../types";
import type { BookmarkFormInitialFocusTarget } from "../components/bookmark-form-state";

export type CreateBookmarkState =
  | { kind: "manual-entry" }
  | { kind: "choose-url"; originalUrl: string; cleanedUrl: string; title: string }
  | { kind: "create-form"; initialUrl: string; initialTitle: string; focusTarget: BookmarkFormInitialFocusTarget };

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
    return { kind: "manual-entry" };
  }

  const incomingTitle = pickFirst(input.title)?.trim() ?? "";
  const parsedIncoming = parseAbsoluteHttpUrl(incomingUrl);

  if (!parsedIncoming) {
    return {
      kind: "create-form",
      initialUrl: incomingUrl,
      initialTitle: incomingTitle,
      focusTarget: "url",
    };
  }

  const cleanedUrl = tidyUrl(parsedIncoming.toString()).url;
  if (cleanedUrl === parsedIncoming.toString()) {
    return {
      kind: "create-form",
      initialUrl: parsedIncoming.toString(),
      initialTitle: incomingTitle,
      focusTarget: "tags",
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
): Extract<CreateBookmarkState, { kind: "create-form" }> {
  return {
    kind: "create-form",
    initialUrl: choice === "original" ? state.originalUrl : state.cleanedUrl,
    initialTitle: state.title,
    focusTarget: "tags",
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
