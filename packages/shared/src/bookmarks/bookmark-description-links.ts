import type { AutolinkerConfig } from "autolinker";

export const bookmarkDescriptionLinkParsingOptions = {
  urls: {
    schemeMatches: true,
    tldMatches: false,
    ipV4Matches: false,
  },
  email: false,
  phone: false,
  mention: false,
  hashtag: false,
} satisfies AutolinkerConfig;
