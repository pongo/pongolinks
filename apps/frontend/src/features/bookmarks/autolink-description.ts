import { Autolinker } from "autolinker";

export function autolinkBookmarkDescription(description: string) {
  return Autolinker.link(description, {
    sanitizeHtml: true,
    newWindow: true,
    className: "bookmark-description-link",
    email: false,
    phone: false,
    mention: false,
    hashtag: false,
    stripPrefix: false,
    stripTrailingSlash: false,
  });
}
