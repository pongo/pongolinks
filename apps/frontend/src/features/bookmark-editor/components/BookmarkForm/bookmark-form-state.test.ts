import { describe, expect, it } from "vitest";

import type { BookmarkDTO } from "#/features/bookmarks/types.ts";
import { resolveBookmarkFormInitialPayload } from "./bookmark-form-state.ts";

function buildBookmark(overrides: Partial<BookmarkDTO> = {}): BookmarkDTO {
  return {
    id: 1,
    url: "https://example.com",
    title: "Example",
    description: "Description",
    isPrivate: false,
    createdAt: "2026-01-01 00:00:00",
    updatedAt: "2026-01-01 00:00:00",
    tags: [
      { id: 1, name: "Article", nameLower: "article" },
      { id: 2, name: "Read", nameLower: "read" },
    ],
    relatedLinks: [],
    ...overrides,
  };
}

describe("bookmark form state", () => {
  it("uses existing bookmark values for edit mode", () => {
    const payload = resolveBookmarkFormInitialPayload({
      bookmark: buildBookmark(),
    });

    expect(payload).toEqual({
      url: "https://example.com",
      title: "Example",
      description: "Description",
      isPrivate: false,
      tagsText: "Article Read ",
    });
  });

  it("uses initial create values when provided", () => {
    const payload = resolveBookmarkFormInitialPayload({
      initialCreateValues: {
        url: "http://invalid-url",
        title: "Captured title",
        description: "Captured description",
        isPrivate: true,
        tagsText: "captured ",
      },
    });

    expect(payload).toEqual({
      url: "http://invalid-url",
      title: "Captured title",
      description: "Captured description",
      isPrivate: true,
      tagsText: "captured ",
    });
  });

  it("starts with empty create values in manual mode", () => {
    const payload = resolveBookmarkFormInitialPayload({});

    expect(payload).toEqual({
      url: "",
      title: "",
      description: "",
      isPrivate: false,
      tagsText: "",
    });
  });

  it("throws when bookmark and initial create values are passed together", () => {
    expect(() =>
      resolveBookmarkFormInitialPayload({
        bookmark: buildBookmark(),
        initialCreateValues: {
          url: "https://example.com/new",
          title: "",
          description: "",
          isPrivate: false,
          tagsText: "",
        },
      }),
    ).toThrowError(/programmer error/i);
  });
});
