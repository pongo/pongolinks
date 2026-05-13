import { describe, expect, it } from "vitest";

import { parseApiEnvelope } from "./api";

describe("bookmark API envelope parsing", () => {
  it("parses success envelopes", () => {
    const result = parseApiEnvelope({
      ok: true,
      data: {
        bookmarks: [],
      },
    });

    expect(result).toEqual({
      ok: true,
      data: {
        bookmarks: [],
      },
    });
  });

  it("maps field error envelopes", () => {
    const result = parseApiEnvelope({
      ok: false,
      error: {
        message: "Bookmark URL is required",
        code: "bookmark.url_required",
      },
    });

    expect(result).toMatchObject({
      ok: false,
      errors: {
        url: "Bookmark URL is required",
      },
    });
  });

  it("maps form error envelopes", () => {
    const result = parseApiEnvelope({
      ok: false,
      error: {
        message: "Bookmark was not found",
        code: "bookmark.not_found",
      },
    });

    expect(result).toMatchObject({
      ok: false,
      errors: {
        form: "Bookmark was not found",
      },
    });
  });
});
