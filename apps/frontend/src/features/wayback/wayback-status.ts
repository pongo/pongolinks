import type { WaybackAvailabilityDTO } from "./types";

export type WaybackStatusViewModel =
  | { kind: "idle" }
  | { kind: "checking" }
  | { kind: "unavailable" }
  | { kind: "available"; archivedUrl: string; timestamp: string }
  | { kind: "error"; message: string };

const waybackTimestampPattern = /^\d{14}$/;

export function toWaybackStatusViewModel(dto: WaybackAvailabilityDTO): WaybackStatusViewModel {
  if (!dto.available) {
    return { kind: "unavailable" };
  }

  return {
    kind: "available",
    archivedUrl: dto.archivedUrl,
    timestamp: dto.timestamp,
  };
}

export function formatWaybackTimestamp(timestamp: string): string {
  if (!waybackTimestampPattern.test(timestamp)) {
    return timestamp;
  }

  const year = Number(timestamp.slice(0, 4));
  const month = Number(timestamp.slice(4, 6));
  const day = Number(timestamp.slice(6, 8));
  const hour = Number(timestamp.slice(8, 10));
  const minute = Number(timestamp.slice(10, 12));
  const second = Number(timestamp.slice(12, 14));
  const date = new Date(Date.UTC(year, month - 1, day, hour, minute, second));

  if (Number.isNaN(date.getTime())) {
    return timestamp;
  }

  const formatted = new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC",
  }).format(date);

  return `${formatted} UTC`;
}
