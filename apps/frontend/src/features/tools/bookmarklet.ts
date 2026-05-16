const BOOKMARK_CREATE_PATH = "/bookmarks/new";

type CreateBookmarkletHrefOptions = {
  appBasePath: string;
  appOrigin: string;
};

function normalizeBasePath(basePath: string) {
  const trimmed = basePath.trim();
  if (trimmed === "" || trimmed === "/") {
    return "";
  }

  const withLeadingSlash = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  return withLeadingSlash.endsWith("/")
    ? withLeadingSlash.slice(0, withLeadingSlash.length - 1)
    : withLeadingSlash;
}

export function createBookmarkletHref(options: CreateBookmarkletHrefOptions) {
  const basePath = normalizeBasePath(options.appBasePath);
  const targetUrl = `${options.appOrigin}${basePath}${BOOKMARK_CREATE_PATH}`;
  const escapedTargetUrl = JSON.stringify(targetUrl);

  return `javascript:(()=>{const u=new URL(${escapedTargetUrl});u.searchParams.set("url",location.href);u.searchParams.set("title",document.title);window.open(u.toString(),"_blank","noopener");})();`;
}
