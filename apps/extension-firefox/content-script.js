const URL_CHECK_CACHE_INVALIDATION_MESSAGE_TYPE = "pongolinks.invalidate-url-check-cache";

function isInvalidateCacheMessage(message) {
  return (
    message !== null &&
    typeof message === "object" &&
    message.type === URL_CHECK_CACHE_INVALIDATION_MESSAGE_TYPE &&
    Array.isArray(message.urls) &&
    message.urls.every((url) => typeof url === "string")
  );
}

window.addEventListener("message", (event) => {
  if (event.source !== window || event.origin !== window.location.origin) {
    return;
  }

  if (!isInvalidateCacheMessage(event.data)) {
    return;
  }

  void browser.runtime.sendMessage(event.data);
});
