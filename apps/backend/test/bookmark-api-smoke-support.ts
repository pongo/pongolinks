import { assert } from "#test/api-smoke-support.ts";

export function bookmarkPayload(overrides: Record<string, unknown> = {}) {
  return {
    url: "https://example.com",
    title: "Example",
    description: "A useful reference",
    isPrivate: false,
    tagsText: "",
    ...overrides,
  };
}

export function assertBookmarkErrorCode(
  body: { isErr: boolean; error?: { code?: unknown } },
  code: string,
  message: string,
) {
  assert(body.isErr === true, `${message} should return Err result`);
  assert(body.error?.code === code, `${message} should return ${code}`);
}
