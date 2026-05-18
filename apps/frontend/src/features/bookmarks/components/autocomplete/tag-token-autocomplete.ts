export type TokenRange = {
  start: number;
  end: number;
  value: string;
};

export function currentToken(value: string, cursor: number): TokenRange {
  const safeCursor = Math.min(Math.max(cursor, 0), value.length);
  let start = safeCursor;
  let end = safeCursor;

  while (start > 0 && !/\s/.test(value[start - 1] ?? "")) {
    start -= 1;
  }

  while (end < value.length && !/\s/.test(value[end] ?? "")) {
    end += 1;
  }

  return {
    start,
    end,
    value: value.slice(start, end),
  };
}

export function replaceCurrentToken(
  value: string,
  cursor: number,
  insertedToken: string,
): { value: string; cursor: number } {
  const token = currentToken(value, cursor);
  const before = value.slice(0, token.start);
  const after = value.slice(token.end).replace(/^\s+/, "");
  const inserted = `${insertedToken} `;
  const nextValue = `${before}${inserted}${after}`;

  return {
    value: nextValue,
    cursor: before.length + inserted.length,
  };
}
