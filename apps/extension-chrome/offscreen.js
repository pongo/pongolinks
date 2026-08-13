const COLOR_SCHEME_CHANGED_MESSAGE_TYPE = "pongolinks.color-scheme-changed";
const darkColorScheme = window.matchMedia("(prefers-color-scheme: dark)");

function reportColorScheme(isDark) {
  void chrome.runtime.sendMessage({
    type: COLOR_SCHEME_CHANGED_MESSAGE_TYPE,
    isDark,
  });
}

reportColorScheme(darkColorScheme.matches);

darkColorScheme.addEventListener("change", (event) => {
  reportColorScheme(event.matches);
});
