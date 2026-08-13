import QuickLRU from "./lib/quick-lru.js";

const APP_BASE_URL = "http://localhost:3000/pl/";
const BADGE_COLOR = "#4CAF50";

const CACHE_MAX_SIZE = 1000;
const HOUR_MS = 60 * 60 * 1000;
const GLOBAL_CACHE_MAX_AGE_MS = HOUR_MS;
const EXISTS_CACHE_MAX_AGE_MS = 24 * HOUR_MS;
const NOT_EXISTS_CACHE_MAX_AGE_MS = HOUR_MS;
const URL_CHECK_CACHE_INVALIDATION_MESSAGE_TYPE = "pongolinks.invalidate-url-check-cache";
const COLOR_SCHEME_CHANGED_MESSAGE_TYPE = "pongolinks.color-scheme-changed";
const OFFSCREEN_DOCUMENT_PATH = "offscreen.html";
const LIGHT_ICON_PATHS = {
  16: "images/icon-16.png",
  32: "images/icon-32.png",
  48: "images/icon-48.png",
};
const DARK_ICON_PATHS = {
  16: "images/icon-dark-16.png",
  32: "images/icon-dark-32.png",
  48: "images/icon-dark-48.png",
};

let creatingOffscreenDocument;

const urlCheckCache = new QuickLRU({
  maxSize: CACHE_MAX_SIZE,
  maxAge: GLOBAL_CACHE_MAX_AGE_MS,
});

async function ensureThemeWatcher() {
  if (await chrome.offscreen.hasDocument()) {
    return;
  }

  if (!creatingOffscreenDocument) {
    creatingOffscreenDocument = chrome.offscreen
      .createDocument({
        url: OFFSCREEN_DOCUMENT_PATH,
        reasons: ["MATCH_MEDIA"],
        justification: "Track the preferred color scheme for the toolbar icon",
      })
      .finally(() => {
        creatingOffscreenDocument = undefined;
      });
  }

  await creatingOffscreenDocument;
}

async function initializeThemeWatcher() {
  try {
    await ensureThemeWatcher();
  } catch {
    // The manifest's default icon remains the fallback if offscreen setup fails.
  }
}

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
    await chrome.action.setBadgeText({ tabId, text: "" });
  } catch {
    // Tab was closed before badge could be cleared
  }
}

async function showExistsBadge(tabId) {
  try {
    await chrome.action.setBadgeBackgroundColor({ tabId, color: BADGE_COLOR });
    await chrome.action.setBadgeText({ tabId, text: " " });
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
    const tab = await chrome.tabs.get(tabId);
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
  const tabs = await chrome.tabs.query({});
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
  const [tab] = await chrome.tabs.query({
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
    tab = await chrome.tabs.get(tabId);
  } catch {
    return;
  }

  if (!tab.active) return;

  await clearBadge(tabId);
  await checkTab({ ...tab, id: tabId, url });
}

chrome.tabs.onActivated.addListener((activeInfo) => {
  void checkActiveTab(activeInfo.windowId);
});

chrome.runtime.onInstalled.addListener(() => {
  void initializeThemeWatcher();
});

chrome.runtime.onStartup.addListener(() => {
  void initializeThemeWatcher();
});

// onCommitted runs when Chrome commits a main-frame document navigation
// such as a link click, typed URL, reload, or redirect
chrome.webNavigation.onCommitted.addListener((details) => {
  void checkNavigation(details);
});

// onHistoryStateUpdated runs after an already-loaded document changes URL via
// history.pushState or history.replaceState, covering SPA route changes that
// do not trigger onCommitted.
//
// Hash-only URL changes are intentionally ignored;
// add chrome.webNavigation.onReferenceFragmentUpdated if they should affect
// bookmark detection later.
chrome.webNavigation.onHistoryStateUpdated.addListener((details) => {
  void checkNavigation(details);
});

chrome.action.onClicked.addListener(async (tab) => {
  if (!tab.id || !isCheckableUrl(tab.url)) {
    if (tab.id) {
      await clearBadge(tab.id);
    }
    return;
  }

  urlCheckCache.delete(tab.url);
  await openTabToTheRight(createBookmarkUrl(tab));
});

chrome.runtime.onMessage.addListener((message) => {
  if (message?.type !== URL_CHECK_CACHE_INVALIDATION_MESSAGE_TYPE) {
    return;
  }

  void invalidateUrlCheckCache(Array.isArray(message.urls) ? message.urls : []);
});

chrome.runtime.onMessage.addListener((message) => {
  if (message?.type !== COLOR_SCHEME_CHANGED_MESSAGE_TYPE) {
    return;
  }

  void chrome.action.setIcon({
    path: message.isDark ? DARK_ICON_PATHS : LIGHT_ICON_PATHS,
  });
});

void initializeThemeWatcher();

async function openTabToTheRight(targetUrl) {
  const [currentTab] = await chrome.tabs.query({
    active: true,
    currentWindow: true,
  });
  await chrome.tabs.create({
    url: targetUrl,
    index: currentTab.index + 1,
  });
}
