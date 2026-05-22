import QuickLRU from "./lib/quick-lru.js";

const APP_BASE_URL = "http://localhost:3000/pl/";
const BADGE_COLOR = "#fb2c36";
const CACHE_MAX_SIZE = 1000;
const CACHE_MAX_AGE_MS = 60 * 60 * 1000;

const urlCheckCache = new QuickLRU({
  maxSize: CACHE_MAX_SIZE,
  maxAge: CACHE_MAX_AGE_MS,
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
  await chrome.action.setBadgeText({ tabId, text: "" });
}

async function showExistsBadge(tabId) {
  await chrome.action.setBadgeBackgroundColor({ tabId, color: BADGE_COLOR });
  await chrome.action.setBadgeText({ tabId, text: " " });
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
    urlCheckCache.set(url, exists);
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

chrome.tabs.onActivated.addListener((activeInfo) => {
  void checkActiveTab(activeInfo.windowId);
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (!tab.active) {
    return;
  }

  if (changeInfo.url) {
    void (async () => {
      await clearBadge(tabId);
      await checkTab({ ...tab, id: tabId, url: changeInfo.url });
    })();
    return;
  }

  if (changeInfo.status === "complete") {
    void checkTab(tab);
  }
});

chrome.action.onClicked.addListener(async (tab) => {
  if (!tab.id || !isCheckableUrl(tab.url)) {
    if (tab.id) {
      await clearBadge(tab.id);
    }
    return;
  }

  urlCheckCache.delete(tab.url);
  await chrome.tabs.create({ url: createBookmarkUrl(tab) });
});
