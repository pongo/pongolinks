import QuickLRU from "./lib/quick-lru.js";

const APP_BASE_URL = "http://localhost:3000/pl/";
const BADGE_COLOR = "#4CAF50";

const CACHE_MAX_SIZE = 1000;
const HOUR_MS = 60 * 60 * 1000;
const GLOBAL_CACHE_MAX_AGE_MS = HOUR_MS;
const EXISTS_CACHE_MAX_AGE_MS = 24 * HOUR_MS;
const NOT_EXISTS_CACHE_MAX_AGE_MS = HOUR_MS;
const URL_CHECK_CACHE_INVALIDATION_MESSAGE_TYPE = "pongolinks.invalidate-url-check-cache";

const urlCheckCache = new QuickLRU({
  maxSize: CACHE_MAX_SIZE,
  maxAge: GLOBAL_CACHE_MAX_AGE_MS,
});

function isCheckableUrl(url) {
  if (!url) {
    return false;
  }

  try {
    const parsedUrl = new URL(url);
    return parsedUrl.protocol === "http:" || parsedUrl.protocol === "https:";
  } catch {
    return false;
  }
}

function createBookmarkUrl(tab) {
  const createUrl = new URL("bookmarks/new", APP_BASE_URL);
  createUrl.searchParams.set("url", tab.url);
  createUrl.searchParams.set("title", tab.title ?? "");
  return createUrl.toString();
}

function createCheckUrl(url) {
  const checkUrl = new URL("api/search/check", APP_BASE_URL);
  checkUrl.searchParams.set("url", url);
  return checkUrl.toString();
}

async function clearBadge(tabId) {
  try {
    await browser.action.setBadgeText({ tabId, text: "" });
  } catch {
    // Tab was closed before badge could be cleared
  }
}

async function showExistsBadge(tabId) {
  try {
    await browser.action.setBadgeBackgroundColor({ tabId, color: BADGE_COLOR });
    // Firefox collapses a whitespace-only badge into a thin line, so use a real
    // glyph with matching text and background colors to keep the badge full-sized.
    await browser.action.setBadgeTextColor({ tabId, color: BADGE_COLOR });
    await browser.action.setBadgeText({ tabId, text: "." });
  } catch {
    // Tab was closed before badge could be shown
  }
}

function bookmarkExistsFromResult(result) {
  return result?.isOk === true && result.value?.status !== "not-found";
}

async function fetchBookmarkExists(url) {
  const response = await fetch(createCheckUrl(url), {
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error(`Bookmark URL check failed with ${response.status}`);
  }

  return bookmarkExistsFromResult(await response.json());
}

async function getCurrentTabUrl(tabId) {
  try {
    const tab = await browser.tabs.get(tabId);
    return tab.url;
  } catch {
    return undefined;
  }
}

async function applyCheckResult(tabId, checkedUrl, exists) {
  const currentUrl = await getCurrentTabUrl(tabId);
  if (currentUrl !== checkedUrl) {
    return;
  }

  if (exists) {
    await showExistsBadge(tabId);
  } else {
    await clearBadge(tabId);
  }
}

async function refreshTabsForUrls(urlSet) {
  const tabs = await browser.tabs.query({});
  const promises = tabs
    .filter((tab) => tab.id && tab.url && urlSet.has(tab.url))
    .map((tab) => checkTab(tab));
  await Promise.all(promises);
}

async function invalidateUrlCheckCache(urls) {
  const urlSet = new Set(urls);
  if (urlSet.size === 0) {
    return;
  }

  for (const url of urlSet) {
    urlCheckCache.delete(url);
  }

  await refreshTabsForUrls(urlSet);
}

async function checkTab(tab) {
  if (!tab.id) {
    return;
  }

  const { id: tabId, url } = tab;
  if (!isCheckableUrl(url)) {
    await clearBadge(tabId);
    return;
  }

  if (urlCheckCache.has(url)) {
    await applyCheckResult(tabId, url, urlCheckCache.get(url));
    return;
  }

  try {
    const exists = await fetchBookmarkExists(url);
    urlCheckCache.set(url, exists, exists ? EXISTS_CACHE_MAX_AGE_MS : NOT_EXISTS_CACHE_MAX_AGE_MS);
    await applyCheckResult(tabId, url, exists);
  } catch {
    await clearBadge(tabId);
  }
}

async function checkActiveTab(windowId) {
  const [tab] = await browser.tabs.query({
    active: true,
    windowId,
  });

  if (tab) {
    await checkTab(tab);
  }
}

async function checkNavigation({ tabId, frameId, url }) {
  if (frameId !== 0) return;

  let tab;
  try {
    tab = await browser.tabs.get(tabId);
  } catch {
    return;
  }

  if (!tab.active) return;

  await clearBadge(tabId);
  await checkTab({ ...tab, id: tabId, url });
}

browser.tabs.onActivated.addListener((activeInfo) => {
  void checkActiveTab(activeInfo.windowId);
});

// onCommitted runs when Firefox commits a main-frame document navigation
// such as a link click, typed URL, reload, or redirect
browser.webNavigation.onCommitted.addListener((details) => {
  void checkNavigation(details);
});

// onHistoryStateUpdated runs after an already-loaded document changes URL via
// history.pushState or history.replaceState, covering SPA route changes that
// do not trigger onCommitted.
//
// Hash-only URL changes are intentionally ignored;
// add browser.webNavigation.onReferenceFragmentUpdated if they should affect
// bookmark detection later.
browser.webNavigation.onHistoryStateUpdated.addListener((details) => {
  void checkNavigation(details);
});

browser.action.onClicked.addListener(async (tab) => {
  if (!tab.id || !isCheckableUrl(tab.url)) {
    if (tab.id) {
      await clearBadge(tab.id);
    }
    return;
  }

  urlCheckCache.delete(tab.url);
  await openTabToTheRight(createBookmarkUrl(tab));
});

browser.runtime.onMessage.addListener((message) => {
  if (message?.type !== URL_CHECK_CACHE_INVALIDATION_MESSAGE_TYPE) {
    return;
  }

  void invalidateUrlCheckCache(Array.isArray(message.urls) ? message.urls : []);
});

async function openTabToTheRight(targetUrl) {
  const [currentTab] = await browser.tabs.query({
    active: true,
    currentWindow: true,
  });
  await browser.tabs.create({
    url: targetUrl,
    index: currentTab.index + 1,
  });
}
