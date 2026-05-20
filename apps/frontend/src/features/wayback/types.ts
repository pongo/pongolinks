export type WaybackAvailabilityDTO =
  | { available: false }
  | {
      available: true;
      archivedUrl: string;
      timestamp: string;
    };
