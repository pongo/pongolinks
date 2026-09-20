export function normalizeQueryString(value: unknown): unknown {
  // Elysia represents an unescaped comma in a query value as an array.
  return Array.isArray(value) ? value.join(",") : value;
}
