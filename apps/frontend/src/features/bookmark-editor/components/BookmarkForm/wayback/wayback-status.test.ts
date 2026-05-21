import { describe, expect, it } from "vitest";

import { parseWaybackTimestamp } from "./wayback-status.ts";

describe("parseWaybackTimestamp", () => {
  it("parses a valid Wayback timestamp into a UTC Date", () => {
    expectDateToBe(parseWaybackTimestamp("20230215094530"), "2023-02-15T09:45:30.000Z");
    expectDateToBe(parseWaybackTimestamp("20260212061822"), "2026-02-12T06:18:22.000Z");
    expectDateToBe(parseWaybackTimestamp("20260112102653"), "2026-01-12T10:26:53.000Z");
  });

  it("returns null when timestamp has a non-digit character", () => {
    expect(parseWaybackTimestamp("2026AA12061822")).toBeNull();
  });

  it("returns null when timestamp length is not 14 digits", () => {
    expect(parseWaybackTimestamp("2026021206182")).toBeNull();
  });
});

function expectDateToBe(date: Date | null, expected: string) {
  expect(date).not.toBeNull();
  expect(date?.toISOString()).toBe(expected);
}
