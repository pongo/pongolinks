import { Autolinker, type AutolinkerConfig } from "autolinker";
import type { ValidUrl } from "../brands.ts";

export type RenderBookmarkDescriptionHtmlOptions = {
  linkClassName?: string;
  quoteClassName?: string;
};

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

export function extractRelatedLinkUrls(description: string): ValidUrl[] {
  const urls = new Set<ValidUrl>();
  const matches = Autolinker.parse(description, bookmarkDescriptionLinkParsingOptions);

  for (const match of matches) {
    if (match.type !== "url" || match.getUrlMatchType() !== "scheme") {
      continue;
    }

    const url = match.getUrl();

    if (url.startsWith("http://") || url.startsWith("https://")) {
      urls.add(url as ValidUrl);
    }
  }

  return [...urls];
}

export function renderBookmarkDescriptionHtml(
  description: string,
  options: RenderBookmarkDescriptionHtmlOptions = {},
): string {
  return renderBookmarkDescriptionBlocks(description)
    .map((block) => {
      const html = renderBookmarkDescriptionText(block.text, options);

      if (block.type === "quote") {
        const classAttribute = options.quoteClassName
          ? ` class="${escapeHtmlAttribute(options.quoteClassName)}"`
          : "";

        return `<blockquote${classAttribute}>${html}</blockquote>`;
      }

      return html;
    })
    .join("");
}

type BookmarkDescriptionBlock =
  | {
      type: "text";
      text: string;
    }
  | {
      type: "quote";
      text: string;
    };

function renderBookmarkDescriptionText(
  text: string,
  options: RenderBookmarkDescriptionHtmlOptions,
): string {
  return Autolinker.link(text, {
    ...bookmarkDescriptionLinkParsingOptions,
    sanitizeHtml: true,
    newWindow: true,
    className: options.linkClassName,
    stripPrefix: false,
    stripTrailingSlash: false,
    replaceFn: (match) => {
      if (match.type !== "url" || match.getUrlMatchType() !== "scheme") {
        return false;
      }

      const url = match.getUrl();

      return url.startsWith("http://") || url.startsWith("https://");
    },
  });
}

function renderBookmarkDescriptionBlocks(description: string): BookmarkDescriptionBlock[] {
  const blocks: BookmarkDescriptionBlock[] = [];
  const lines = description.split(/(\r?\n)/);

  for (let index = 0; index < lines.length; index += 2) {
    const line = lines[index] ?? "";
    const newline = lines[index + 1] ?? "";
    const quoteLine = line.match(/^>\s?(.*)$/);

    if (quoteLine) {
      const previousBlock = blocks.at(-1);
      const quoteText = quoteLine[1] + newline;

      if (previousBlock?.type === "quote") {
        previousBlock.text += quoteText;
      } else {
        blocks.push({ type: "quote", text: quoteText });
      }

      continue;
    }

    const previousBlock = blocks.at(-1);
    const text = line + newline;

    if (previousBlock?.type === "text") {
      previousBlock.text += text;
    } else {
      blocks.push({ type: "text", text });
    }
  }

  return blocks;
}

function escapeHtmlAttribute(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}
