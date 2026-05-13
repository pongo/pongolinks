import { Autolinker } from "autolinker";
import { bookmarkDescriptionLinkParsingOptions } from "@pongolinks/shared/bookmarks";

export function autolinkBookmarkDescription(description: string) {
  return Autolinker.link(description, {
    ...bookmarkDescriptionLinkParsingOptions,
    sanitizeHtml: true,
    newWindow: true,
    className: "bookmark-description-link",
    stripPrefix: false,
    stripTrailingSlash: false,
  });
}
