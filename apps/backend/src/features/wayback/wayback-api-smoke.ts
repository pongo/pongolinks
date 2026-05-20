import { assert, request, withApp } from "#test/api-smoke-support.ts";

type FetchMock = (...args: Parameters<typeof fetch>) => ReturnType<typeof fetch>;

function withFetchMock(mock: FetchMock) {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = mock as typeof fetch;

  return () => {
    globalThis.fetch = originalFetch;
  };
}

await withApp(async ({ app }) => {
  let fetchCalls = 0;
  const restoreFetch = withFetchMock(async () => {
    fetchCalls += 1;
    return new Response(
      JSON.stringify({
        archived_snapshots: {
          closest: {
            available: true,
            url: "http://web.archive.org/web/20260212061822/https://example.com",
            timestamp: "20260212061822",
          },
        },
      }),
      { status: 200 },
    );
  });

  try {
    const response = await app.handle(
      request("/api/bookmarks/wayback-availability?url=https%3A%2F%2Fexample.com"),
    );
    const body = await response.json();

    assert(response.status === 200, "available wayback lookup should return 200");
    assert(body.value.available === true, "available wayback lookup should return available=true");
    assert(
      body.value.archivedUrl === "http://web.archive.org/web/20260212061822/https://example.com",
      "available wayback lookup should return archivedUrl",
    );
    assert(
      body.value.timestamp === "20260212061822",
      "available wayback lookup should return timestamp",
    );
    assert(fetchCalls === 1, "available wayback lookup should call wayback once");
  } finally {
    restoreFetch();
  }
});

await withApp(async ({ app }) => {
  let fetchCalls = 0;
  const restoreFetch = withFetchMock(async () => {
    fetchCalls += 1;
    return new Response(JSON.stringify({ archived_snapshots: {} }), { status: 200 });
  });

  try {
    const response = await app.handle(
      request("/api/bookmarks/wayback-availability?url=https%3A%2F%2Fexample.com%2Funavailable"),
    );
    const body = await response.json();

    assert(response.status === 200, "unavailable wayback lookup should return 200");
    assert(
      body.value.available === false,
      "unavailable wayback lookup should return available=false",
    );
    assert(fetchCalls === 1, "unavailable wayback lookup should call wayback once");
  } finally {
    restoreFetch();
  }
});

await withApp(async ({ app }) => {
  let fetchCalls = 0;
  const restoreFetch = withFetchMock(async () => {
    fetchCalls += 1;
    return new Response(JSON.stringify({ archived_snapshots: { closest: { available: true } } }), {
      status: 200,
    });
  });

  try {
    const response = await app.handle(
      request("/api/bookmarks/wayback-availability?url=https%3A%2F%2Fexample.com%2Fmalformed"),
    );
    const body = await response.json();

    assert(response.status === 502, "malformed wayback payload should return 502");
    assert(
      body.error.code === "bookmark.unexpected",
      "malformed wayback payload should return error",
    );
    assert(fetchCalls === 1, "malformed wayback payload should call wayback once");
  } finally {
    restoreFetch();
  }
});

await withApp(async ({ app }) => {
  let fetchCalls = 0;
  const restoreFetch = withFetchMock(async () => {
    fetchCalls += 1;
    return new Response("Too Many Requests", { status: 429 });
  });

  try {
    const response = await app.handle(
      request("/api/bookmarks/wayback-availability?url=https%3A%2F%2Fexample.com%2Frate-limited"),
    );
    const body = await response.json();

    assert(response.status === 502, "429 wayback response should return 502");
    assert(body.error.code === "bookmark.unexpected", "429 wayback response should return error");
    assert(fetchCalls === 1, "429 wayback response should not retry");
  } finally {
    restoreFetch();
  }
});

await withApp(async ({ app }) => {
  let fetchCalls = 0;
  const restoreFetch = withFetchMock(async () => {
    fetchCalls += 1;
    throw new Error("network failed");
  });

  try {
    const response = await app.handle(
      request("/api/bookmarks/wayback-availability?url=https%3A%2F%2Fexample.com%2Fnetwork"),
    );
    const body = await response.json();

    assert(response.status === 502, "wayback network failure should return 502");
    assert(
      body.error.code === "bookmark.unexpected",
      "wayback network failure should return error",
    );
    assert(fetchCalls === 1, "wayback network failure should not retry");
  } finally {
    restoreFetch();
  }
});

await withApp(async ({ app }) => {
  const response = await app.handle(
    request("/api/bookmarks/wayback-availability?url=ftp%3A%2F%2Fexample.com"),
  );
  const body = await response.json();

  assert(response.status === 400, "invalid bookmark URL should return 400");
  assert(
    body.error.code === "bookmark.url_invalid",
    "invalid bookmark URL should return url_invalid",
  );
});

await withApp(async ({ app }) => {
  let fetchCalls = 0;
  const restoreFetch = withFetchMock(async () => {
    fetchCalls += 1;
    return new Response(JSON.stringify({ archived_snapshots: {} }), { status: 200 });
  });

  try {
    const first = await app.handle(
      request(
        "/api/bookmarks/wayback-availability?url=https%3A%2F%2Fexample.com%2Fcached%3Fq%3D1%23a",
      ),
    );
    const firstBody = await first.json();
    assert(first.status === 200, "first cached request should return 200");
    assert(firstBody.value.available === false, "first cached request should be unavailable");

    const second = await app.handle(
      request(
        "/api/bookmarks/wayback-availability?url=%20https%3A%2F%2Fexample.com%2Fcached%3Fq%3D1%23a%20",
      ),
    );
    const secondBody = await second.json();
    assert(second.status === 200, "second cached request should return 200");
    assert(secondBody.value.available === false, "second cached request should be unavailable");
    assert(fetchCalls === 1, "cached request should prevent duplicate wayback calls");
  } finally {
    restoreFetch();
  }
});

console.log("wayback api smoke passed");
