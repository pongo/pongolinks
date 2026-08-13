import { mkdir, readdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { $ } from "bun";

const SOURCE_APP_BASE_URLS = ["http://localhost:3000/pl/", "http://localhost:5173/pl/"];
const IGNORED_EXTENSION_PATHS = new Set(["dist", "web-ext-artifacts", "README.md"]);
const APP_BASE_URL_REPLACEMENT_PATHS = new Set(["background.js", "manifest.json"]);

const scriptDir = dirname(fileURLToPath(import.meta.url));
const rootDir = join(scriptDir, "..");
const extensionDir = join(rootDir, "apps", "extension-firefox");
const distDir = join(extensionDir, "dist");
const artifactsDir = join(extensionDir, "web-ext-artifacts");

function parseTargetAppBaseUrl(value) {
  if (!value) {
    throw new Error("Usage: bun run extension:build:firefox <app-base-url-ending-with-slash>");
  }

  let url;
  try {
    url = new URL(value);
  } catch {
    throw new Error(`Invalid app base URL: ${value}`);
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("App base URL must use http: or https:");
  }

  if (!value.endsWith("/")) {
    throw new Error("App base URL must end with /");
  }

  return url.toString();
}

function toExtensionRelativePath(sourcePath) {
  return relative(extensionDir, sourcePath).replaceAll("\\", "/");
}

function shouldIgnoreExtensionPath(sourcePath) {
  return IGNORED_EXTENSION_PATHS.has(toExtensionRelativePath(sourcePath));
}

function shouldReplaceAppBaseUrl(sourcePath) {
  return APP_BASE_URL_REPLACEMENT_PATHS.has(toExtensionRelativePath(sourcePath));
}

async function copyExtensionFile(sourcePath, targetPath, targetAppBaseUrl) {
  await mkdir(dirname(targetPath), { recursive: true });

  if (!shouldReplaceAppBaseUrl(sourcePath)) {
    await Bun.write(targetPath, Bun.file(sourcePath));
    return;
  }

  const source = await readFile(sourcePath, "utf8");
  let rewrittenSource = source;

  for (const sourceAppBaseUrl of SOURCE_APP_BASE_URLS) {
    rewrittenSource = rewrittenSource.replaceAll(sourceAppBaseUrl, targetAppBaseUrl);
  }

  await writeFile(targetPath, rewrittenSource);
}

async function copyExtensionDirectory(sourceDir, targetDir, targetAppBaseUrl) {
  const entries = await readdir(sourceDir, { withFileTypes: true });

  for (const entry of entries) {
    const sourcePath = join(sourceDir, entry.name);
    const targetPath = join(targetDir, entry.name);

    if (shouldIgnoreExtensionPath(sourcePath)) {
      continue;
    }

    if (entry.isDirectory()) {
      await copyExtensionDirectory(sourcePath, targetPath, targetAppBaseUrl);
      continue;
    }

    if (entry.isFile()) {
      await copyExtensionFile(sourcePath, targetPath, targetAppBaseUrl);
    }
  }
}

async function build() {
  const targetAppBaseUrl = parseTargetAppBaseUrl(Bun.argv[2]);

  const extensionStats = await stat(extensionDir);
  if (!extensionStats.isDirectory()) {
    throw new Error(`Extension source directory does not exist: ${extensionDir}`);
  }

  await rm(distDir, { recursive: true, force: true });
  await rm(artifactsDir, { recursive: true, force: true });
  await mkdir(distDir, { recursive: true });
  await copyExtensionDirectory(extensionDir, distDir, targetAppBaseUrl);

  await $`bunx web-ext lint --source-dir ${distDir}`.cwd(rootDir);
  await $`bunx web-ext build --source-dir ${distDir} --artifacts-dir ${artifactsDir} --overwrite-dest`.cwd(
    rootDir,
  );

  console.log(`Built Firefox extension in ${relative(rootDir, distDir)}`);
  console.log(`Created AMO submission archive in ${relative(rootDir, artifactsDir)}`);
}

build().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
