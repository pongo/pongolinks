const URL_CHECK_CACHE_INVALIDATION_MESSAGE_TYPE = "pongolinks.invalidate-url-check-cache";
const URL_CHECK_CACHE_INVALIDATION_ACK_TYPE = "url-check-cache-invalidation-ack";

function isInvalidateCacheMessage(message) {
  return (
    message !== null &&
    typeof message === "object" &&
    message.type === URL_CHECK_CACHE_INVALIDATION_MESSAGE_TYPE &&
    Array.isArray(message.urls) &&
    message.urls.every((url) => typeof url === "string")
  );
}

window.addEventListener("message", async (event) => {
  if (event.source !== window || event.origin !== window.location.origin) {
    return;
  }

  if (!isInvalidateCacheMessage(event.data)) {
    return;
  }

  await chrome.runtime.sendMessage(event.data);
  window.postMessage(
    { type: URL_CHECK_CACHE_INVALIDATION_ACK_TYPE, requestId: event.data.requestId },
    window.location.origin,
  );
});
