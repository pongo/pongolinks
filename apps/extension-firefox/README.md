# pongolinks Firefox Extension

This directory contains the Firefox extension source. It is intended for private, signed self-distribution through Mozilla Add-ons and requires Firefox Desktop 140 or newer. The manifest requires Firefox Android 142 or newer because Mozilla introduced its built-in data consent there in version 142.

The source extension points to the local app base URL:

```text
http://localhost:3000/pl/
```

Build and validate the extension from the repository root:

```bash
bun run extension:build:firefox https://example.com/pl/
```

The URL must be a valid HTTP(S) URL ending with `/`. The command creates:

- `apps/extension-firefox/dist`, the validated extension files.
- `apps/extension-firefox/web-ext-artifacts/pongolinks-<version>.zip`, the archive to submit to Mozilla Add-ons.

## Install temporarily

Use a temporary installation to test the extension without signing it:

1. Open `about:debugging#/runtime/this-firefox` in Firefox.
2. Click `Load Temporary Add-on`.
3. Select `apps/extension-firefox/dist/manifest.json`.

Firefox keeps the temporary extension installed until you remove it or restart the browser. After a restart, repeat these steps to load it again. Rebuild the extension before reloading it when the source files or target app URL change.

## Sign for private use

1. Open the Mozilla Add-on Developer Hub and submit a new extension version.
2. Choose self-distribution rather than listing the extension on addons.mozilla.org.
3. Upload the generated ZIP from `apps/extension-firefox/web-ext-artifacts`.
4. After Mozilla finishes validation, download the signed `.xpi` file.

The extension remains unlisted and has no public catalog page.

## Install

1. Open the Firefox Add-ons Manager.
2. Open its settings menu and choose `Install Add-on From File`.
3. Select the signed `.xpi` file and confirm installation.

To update the extension, increment `version` in `manifest.json`, build and sign it again, then install the new signed `.xpi` over the existing version. Keep `browser_specific_settings.gecko.id` unchanged so Firefox recognizes it as the same extension.

The extension uses the browser profile's existing pongolinks session cookie for the configured origin. It sends visited page URLs to pongolinks to detect saved bookmarks and sends the current page title when opening bookmark creation.
