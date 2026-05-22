import { mkdir, readdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import { dirname, extname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const SOURCE_APP_BASE_URL = "http://localhost:3000/pl/";
const TEXT_FILE_EXTENSIONS = new Set([".css", ".html", ".js", ".json"]);

const scriptDir = dirname(fileURLToPath(import.meta.url));
const rootDir = join(scriptDir, "..");
const extensionDir = join(rootDir, "apps", "extension-chrome");
const distDir = join(extensionDir, "dist");

function parseTargetAppBaseUrl(value) {
  if (!value) {
    throw new Error("Usage: bun run extension:build <app-base-url-ending-with-slash>");
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

function isTextFile(filePath) {
  return TEXT_FILE_EXTENSIONS.has(extname(filePath));
}

function shouldReplaceAppBaseUrl(sourcePath) {
  const relativePath = relative(extensionDir, sourcePath).replaceAll("\\", "/");
  return relativePath !== "lib/quick-lru.js" && isTextFile(sourcePath);
}

async function copyExtensionFile(sourcePath, targetPath, targetAppBaseUrl) {
  await mkdir(dirname(targetPath), { recursive: true });

  if (!shouldReplaceAppBaseUrl(sourcePath)) {
    await Bun.write(targetPath, Bun.file(sourcePath));
    return;
  }

  const source = await readFile(sourcePath, "utf8");
  await writeFile(targetPath, source.replaceAll(SOURCE_APP_BASE_URL, targetAppBaseUrl));
}

async function copyExtensionDirectory(sourceDir, targetDir, targetAppBaseUrl) {
  const entries = await readdir(sourceDir, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.name === "dist") {
      continue;
    }

    const sourcePath = join(sourceDir, entry.name);
    const targetPath = join(targetDir, entry.name);

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
  await mkdir(distDir, { recursive: true });
  await copyExtensionDirectory(extensionDir, distDir, targetAppBaseUrl);

  const relativeDist = relative(rootDir, distDir);
  console.log(`Built Chrome extension in ${relativeDist}`);
}

build().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
