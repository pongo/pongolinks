import { Autolinker } from "autolinker";
import { bookmarkDescriptionLinkParsingOptions } from "@pongolinks/shared/bookmarks";

export function extractRelatedLinks(description: string): string[] {
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
