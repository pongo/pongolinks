import { Err, Ok } from "@pongolinks/shared/result";
import { describe, expect, it, vi } from "vitest";

import { ApiError, type FormErrors } from "#/shared/api/errors.ts";
import type { BookmarkDTO } from "#/features/bookmarks/types.ts";
import type { EditableBookmarkPayload } from "#/features/bookmark-editor/types.ts";
import type { BookmarkUrlCheckResult } from "#/features/check-url/types.ts";
import { useCreateBookmarkFlow } from "./create-bookmark-flow.ts";

function bookmark(overrides: Partial<BookmarkDTO> = {}): BookmarkDTO {
  return {
    id: 1,
    url: "https://example.com",
    title: "Example",
    description: "",
    isPrivate: false,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    tags: [],
    relatedLinks: [],
    ...overrides,
  };
}

function payload(overrides: Partial<EditableBookmarkPayload> = {}): EditableBookmarkPayload {
  return {
    url: "https://example.com",
    title: "Example",
    description: "",
    isPrivate: false,
    tagsText: "",
    ...overrides,
  };
}

function createApiError(message: string, formErrors: FormErrors = { form: message }) {
  return new ApiError(message, "internal.unexpected", undefined, formErrors);
}

function createFlowOptions(
  overrides: Partial<Parameters<typeof useCreateBookmarkFlow>[0]> = {},
): Parameters<typeof useCreateBookmarkFlow>[0] {
  return {
    query: {},
    checkBookmarkUrl: vi.fn(async () => Ok<BookmarkUrlCheckResult>({ status: "not-found" })),
    createBookmark: vi.fn(async () => Ok(bookmark())),
    listTags: vi.fn(async () =>
      Ok({
        tags: [{ id: 1, name: "vue", nameLower: "vue", usageCount: 3 }],
      }),
    ),
    navigateToList: vi.fn(async () => {}),
    navigateToEdit: vi.fn(async () => {}),
    closeWindow: vi.fn(),
    isWindowClosed: vi.fn(() => false),
    wait: vi.fn(async () => {}),
    ...overrides,
  };
}

describe("create bookmark flow", () => {
  it("starts manual create with an empty create form and tag suggestions", async () => {
    const options = createFlowOptions();
    const flow = useCreateBookmarkFlow(options);

    await flow.start();

    expect(flow.state.value).toMatchObject({
      kind: "create-form",
      initialUrl: "",
      initialTitle: "",
      focusTarget: "url",
      closeAfterCreate: false,
    });
    expect(flow.formInitialValues.value).toEqual(payload({ url: "", title: "" }));
    expect(flow.tagSuggestions.value).toEqual([
      { id: 1, name: "vue", nameLower: "vue", usageCount: 3 },
    ]);
    expect(options.checkBookmarkUrl).not.toHaveBeenCalled();
  });

  it("checks a bookmarklet URL when tidy-url output is identical", async () => {
    const options = createFlowOptions({
      query: { url: "https://example.com/page", title: " Example " },
    });
    const flow = useCreateBookmarkFlow(options);

    await flow.start();

    expect(options.checkBookmarkUrl).toHaveBeenCalledWith("https://example.com/page");
    expect(flow.state.value).toMatchObject({
      kind: "create-form",
      initialUrl: "https://example.com/page",
      initialTitle: "Example",
      focusTarget: "tags",
      closeAfterCreate: true,
    });
  });

  it("lets the user choose a cleaned URL before checking", async () => {
    const options = createFlowOptions({
      query: { url: "https://example.com/page?utm_source=newsletter", title: " Example " },
    });
    const flow = useCreateBookmarkFlow(options);

    expect(flow.state.value.kind).toBe("choose-url");
    flow.chooseCleanedUrl();

    await vi.waitFor(() => {
      expect(options.checkBookmarkUrl).toHaveBeenCalledOnce();
    });

    expect(options.checkBookmarkUrl).toHaveBeenCalledWith("https://example.com/page");
    expect(flow.state.value).toMatchObject({
      kind: "create-form",
      initialUrl: "https://example.com/page",
      initialTitle: "Example",
    });
  });

  it("redirects exact Bookmark matches to edit", async () => {
    const options = createFlowOptions({
      query: { url: "https://example.com/page" },
      checkBookmarkUrl: vi.fn(async () =>
        Ok<BookmarkUrlCheckResult>({
          status: "exact-bookmark",
          bookmark: { id: 42, url: "https://example.com/page", title: "Existing" },
        }),
      ),
    });
    const flow = useCreateBookmarkFlow(options);

    await flow.start();

    expect(options.navigateToEdit).toHaveBeenCalledWith(42);
  });

  it("opens duplicate warning with edit href for alternate-protocol matches", async () => {
    const options = createFlowOptions({
      query: { url: "http://example.com/page", title: "Example" },
      checkBookmarkUrl: vi.fn(async () =>
        Ok<BookmarkUrlCheckResult>({
          status: "alternate-protocol-bookmark",
          bookmark: { id: 7, url: "https://example.com/page", title: "Existing" },
        }),
      ),
    });
    const flow = useCreateBookmarkFlow(options);

    await flow.start();

    expect(flow.state.value).toMatchObject({
      kind: "duplicate-bookmark",
      bookmark: {
        id: 7,
        editHref: "/bookmarks/7/edit",
      },
      initialUrl: "http://example.com/page",
      initialTitle: "Example",
    });
  });

  it("opens Related Link matches with edit hrefs", async () => {
    const options = createFlowOptions({
      query: { url: "https://related.example.com/doc", title: "Related" },
      checkBookmarkUrl: vi.fn(async () =>
        Ok<BookmarkUrlCheckResult>({
          status: "related-link",
          bookmarks: [
            { id: 2, url: "https://example.com/a", title: "A" },
            { id: 3, url: "https://example.com/b", title: "B" },
          ],
        }),
      ),
    });
    const flow = useCreateBookmarkFlow(options);

    await flow.start();

    expect(flow.state.value).toMatchObject({
      kind: "related-link-matches",
      bookmarks: [
        { id: 2, editHref: "/bookmarks/2/edit" },
        { id: 3, editHref: "/bookmarks/3/edit" },
      ],
    });
  });

  it("continues to the create form after duplicate or Related Link warnings", async () => {
    const options = createFlowOptions({
      query: { url: "http://example.com/page", title: "Example" },
      checkBookmarkUrl: vi.fn(async () =>
        Ok<BookmarkUrlCheckResult>({
          status: "alternate-protocol-bookmark",
          bookmark: { id: 7, url: "https://example.com/page", title: "Existing" },
        }),
      ),
    });
    const flow = useCreateBookmarkFlow(options);

    await flow.start();
    flow.createAnyway();

    expect(flow.state.value).toMatchObject({
      kind: "create-form",
      initialUrl: "http://example.com/page",
      initialTitle: "Example",
      focusTarget: "tags",
    });
  });

  it("places URL check errors on the form", async () => {
    const options = createFlowOptions({
      query: { url: "https://example.com/page", title: "Example" },
      checkBookmarkUrl: vi.fn(async () =>
        Err(createApiError("Bookmark URL must use http or https", { url: "Invalid URL" })),
      ),
    });
    const flow = useCreateBookmarkFlow(options);

    await flow.start();

    expect(flow.state.value).toMatchObject({
      kind: "create-form",
      initialUrl: "https://example.com/page",
      focusTarget: "url",
    });
    expect(flow.errors.value).toEqual({ url: "Invalid URL" });
  });

  it("places create errors on the form", async () => {
    const options = createFlowOptions({
      createBookmark: vi.fn(async () =>
        Err(createApiError("Title is required", { title: "Title is required" })),
      ),
    });
    const flow = useCreateBookmarkFlow(options);

    await flow.submit(payload({ title: "" }));

    expect(flow.errors.value).toEqual({ title: "Title is required" });
    expect(options.navigateToList).not.toHaveBeenCalled();
  });

  it("navigates to list after manual create", async () => {
    const options = createFlowOptions();
    const flow = useCreateBookmarkFlow(options);

    await flow.submit(payload());

    expect(options.closeWindow).not.toHaveBeenCalled();
    expect(options.navigateToList).toHaveBeenCalledOnce();
  });

  it("attempts to close after Bookmarklet create and falls back when the tab stays open", async () => {
    const options = createFlowOptions({
      query: { url: "https://example.com/page", title: "Example" },
    });
    const flow = useCreateBookmarkFlow(options);

    await flow.start();
    await flow.submit(payload());

    expect(options.closeWindow).toHaveBeenCalledOnce();
    expect(options.wait).toHaveBeenCalledWith(50);
    expect(options.navigateToList).toHaveBeenCalledOnce();
  });
});
