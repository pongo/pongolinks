# pongolinks Chrome Extension

This directory contains the unpacked Chrome extension source.

The source extension points to the local app base URL:

```text
http://localhost:3000/pl/
```

Build the loadable extension explicitly from the repository root:

```bash
bun run extension:build https://example.com/pl/
```

The build command creates `apps/extension-chrome/dist`, clears any previous contents, copies the extension files, and replaces the local app base URL in text files with the provided URL. The URL argument must be a valid HTTP(S) URL and must end with `/`.

Load `apps/extension-chrome/dist` as an unpacked extension in Chrome.

The extension uses the browser profile's existing pongolinks session cookie for the configured origin. If the API request is unauthorized or fails, the toolbar badge is cleared and the failure is not cached.
