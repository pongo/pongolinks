import type { LocationQuery, LocationQueryRaw } from "vue-router";

import { normalizeBookmarkListPageQuery } from "./pagination-window";

export type BookmarkListRouteState = {
  q: string | null;
  tags: string[];
  domain: string | null;
  url: string | null;
  page: number;
};

function pickFirstString(value: LocationQuery[string] | undefined) {
  if (typeof value === "string") {
    return value;
  }

  return Array.isArray(value) ? (value[0] ?? undefined) : undefined;
}

function pickStringList(value: LocationQuery[string] | undefined) {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string");
  }

  return typeof value === "string" ? [value] : [];
}

function isHttpUrl(value: string) {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function dedupeTags(tags: string[]) {
  const seen = new Set<string>();
  const unique: string[] = [];

  for (const tag of tags) {
    const trimmed = tag.trim();
    if (!trimmed) continue;
    const key = trimmed.toLocaleLowerCase("und");
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(trimmed);
  }

  return unique;
}

export function parseBookmarkListRouteQuery(query: LocationQuery): BookmarkListRouteState {
  const q = pickFirstString(query.q)?.trim() ?? "";
  const domain = pickFirstString(query.domain)?.trim() ?? "";
  const url = pickFirstString(query.url)?.trim() ?? "";
  const tags = dedupeTags(pickStringList(query.tag));

  return {
    q: q === "" ? null : q,
    tags,
    domain: domain === "" ? null : domain,
    url: url === "" ? null : url,
    page: normalizeBookmarkListPageQuery(query.page),
  };
}

export function renderMiniQueryFromState(state: BookmarkListRouteState) {
  if (state.url && !state.q && !state.domain && state.tags.length === 0) {
    return state.url;
  }

  const parts: string[] = [];
  if (state.q) {
    parts.push(state.q);
  }
  for (const tag of state.tags) {
    if (tag.startsWith("-")) {
      const name = tag.slice(1);
      if (name) parts.push(`-#${name}`);
      continue;
    }

    parts.push(`#${tag}`);
  }
  if (state.domain) {
    parts.push(`@${state.domain}`);
  }

  return parts.join(" ").trim();
}

export function parseMiniQueryToState(input: string): Omit<BookmarkListRouteState, "page"> {
  const trimmedInput = input.trim();
  if (trimmedInput !== "" && isHttpUrl(trimmedInput)) {
    return { q: null, tags: [], domain: null, url: trimmedInput };
  }

  const qTokens: string[] = [];
  const tags: string[] = [];
  let domain: string | null = null;

  for (const token of trimmedInput.split(/\s+/u)) {
    if (!token) continue;

    if (token.startsWith("-#")) {
      const tag = token.slice(2).trim();
      if (tag) tags.push(`-${tag}`);
      continue;
    }

    if (token.startsWith("#")) {
      const tag = token.slice(1).trim();
      if (tag) tags.push(tag);
      continue;
    }

    if (token.startsWith("@")) {
      const nextDomain = token.slice(1).trim();
      if (nextDomain) domain = nextDomain;
      continue;
    }

    qTokens.push(token);
  }

  return {
    q: qTokens.length > 0 ? qTokens.join(" ") : null,
    tags: dedupeTags(tags),
    domain,
    url: null,
  };
}

export function toBookmarkListRouteQuery(state: BookmarkListRouteState): LocationQueryRaw {
  const query: LocationQueryRaw = {};

  if (state.url) {
    query.url = state.url;
  } else {
    if (state.q) query.q = state.q;
    if (state.tags.length === 1) query.tag = state.tags[0]!;
    if (state.tags.length > 1) query.tag = state.tags;
    if (state.domain) query.domain = state.domain;
  }

  if (state.page > 1) {
    query.page = String(state.page);
  }

  return query;
}

export function isFilterActive(state: BookmarkListRouteState) {
  return Boolean(state.q || state.domain || state.url || state.tags.length > 0);
}
