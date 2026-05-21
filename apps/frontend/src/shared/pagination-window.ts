export type PaginationWindowItem =
  | {
      type: "page";
      page: number;
    }
  | {
      type: "ellipsis";
      key: "before" | "after";
    };

const PAGINATION_WINDOW_SIZE = 5;

export function createPaginationWindow({
  page,
  totalPages,
}: {
  page: number;
  totalPages: number;
}): PaginationWindowItem[] {
  if (totalPages <= 0) {
    return [];
  }

  const windowSize = Math.min(PAGINATION_WINDOW_SIZE, totalPages);
  const halfWindow = Math.floor(windowSize / 2);
  const maxStart = totalPages - windowSize + 1;
  const start = Math.max(1, Math.min(page - halfWindow, maxStart));
  const end = start + windowSize - 1;
  const items: PaginationWindowItem[] = [];

  if (start > 1) {
    items.push({ type: "page", page: 1 });

    if (start > 2) {
      items.push({ type: "ellipsis", key: "before" });
    }
  }

  for (let current = start; current <= end; current += 1) {
    items.push({ type: "page", page: current });
  }

  if (end < totalPages) {
    if (end < totalPages - 1) {
      items.push({ type: "ellipsis", key: "after" });
    }

    items.push({ type: "page", page: totalPages });
  }

  return items;
}
