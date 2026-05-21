import type { BookmarkDTO } from "#/features/bookmarks/types.ts";
import type { EditableBookmarkPayload } from "../../types.ts";

export type BookmarkFormInitialFocusTarget = "url" | "tags";

export type BookmarkFormInitialCreateValues = EditableBookmarkPayload;

export function resolveBookmarkFormInitialPayload(options: {
  bookmark?: BookmarkDTO;
  initialCreateValues?: BookmarkFormInitialCreateValues;
}): EditableBookmarkPayload {
  const { bookmark, initialCreateValues } = options;

  if (bookmark && initialCreateValues) {
    throw new Error(
      "BookmarkForm received both bookmark and initialCreateValues. This is a programmer error.",
    );
  }

  if (bookmark) {
    const tagsText = bookmark.tags.map((tag) => tag.name).join(" ");

    return {
      url: bookmark.url,
      title: bookmark.title,
      description: bookmark.description,
      isPrivate: bookmark.isPrivate,
      tagsText: tagsText ? `${tagsText} ` : "",
    };
  }

  if (initialCreateValues) {
    return { ...initialCreateValues };
  }

  return {
    url: "",
    title: "",
    description: "",
    isPrivate: false,
    tagsText: "",
  };
}
