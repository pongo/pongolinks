import type { ValidUrl } from "@pongolinks/shared/brands";

export type WaybackTimestamp = string & { readonly __brand?: unique symbol };

export type WaybackAvailabilityDTO =
  | { available: false }
  | {
      available: true;
      archivedUrl: ValidUrl;
      timestamp: WaybackTimestamp;
    };
