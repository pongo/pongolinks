export type UrlQueryDiff =
  | { kind: "removed"; key: string; originalValue: string }
  | { kind: "added"; key: string; cleanedValue: string }
  | { kind: "changed"; key: string; originalValue: string; cleanedValue: string };

export type UrlDiffSummary = {
  nonQueryChanged: boolean;
  queryDiffs: UrlQueryDiff[];
};

function mapSearchParams(params: URLSearchParams) {
  const result = new Map<string, string>();
  for (const [key, value] of params.entries()) {
    if (!result.has(key)) {
      result.set(key, value);
    }
  }

  return result;
}

export function diffUrls(originalUrl: string, cleanedUrl: string): UrlDiffSummary {
  const original = new URL(originalUrl);
  const cleaned = new URL(cleanedUrl);

  const nonQueryChanged =
    original.protocol !== cleaned.protocol ||
    original.hostname !== cleaned.hostname ||
    original.port !== cleaned.port ||
    original.pathname !== cleaned.pathname ||
    original.hash !== cleaned.hash;

  const originalParams = mapSearchParams(original.searchParams);
  const cleanedParams = mapSearchParams(cleaned.searchParams);
  const keys = Array.from(new Set([...originalParams.keys(), ...cleanedParams.keys()])).sort();
  const queryDiffs: UrlQueryDiff[] = [];

  for (const key of keys) {
    const originalValue = originalParams.get(key);
    const cleanedValue = cleanedParams.get(key);

    if (typeof originalValue === "string" && cleanedValue === undefined) {
      queryDiffs.push({ kind: "removed", key, originalValue });
      continue;
    }

    if (originalValue === undefined && typeof cleanedValue === "string") {
      queryDiffs.push({ kind: "added", key, cleanedValue });
      continue;
    }

    if (
      typeof originalValue === "string" &&
      typeof cleanedValue === "string" &&
      originalValue !== cleanedValue
    ) {
      queryDiffs.push({ kind: "changed", key, originalValue, cleanedValue });
    }
  }

  return { nonQueryChanged, queryDiffs };
}
