import { Autolinker, type AutolinkerConfig } from "autolinker";

const bookmarkDescriptionLinkParsingOptions = {
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

export function extractRelatedLinkUrls(description: string): string[] {
  const urls = new Set<string>();
  const matches = Autolinker.parse(description, bookmarkDescriptionLinkParsingOptions);

  for (const match of matches) {
    if (match.type !== "url" || match.getUrlMatchType() !== "scheme") {
      continue;
    }

    const url = match.getUrl();

    if (url.startsWith("http://") || url.startsWith("https://")) {
      urls.add(url);
    }
  }

  return [...urls];
}
