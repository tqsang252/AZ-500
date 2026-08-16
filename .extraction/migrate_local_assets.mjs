#!/usr/bin/env node
/**
 * Migrate Manus/remote image URLs to local public assets.
 *
 * Safe by default: without --write the script only reports what it would do.
 * Examples:
 *   node .extraction/migrate_local_assets.mjs
 *   node .extraction/migrate_local_assets.mjs --write
 *   node .extraction/migrate_local_assets.mjs --write --download
 *   node .extraction/migrate_local_assets.mjs --json client/public/question_1.json --dry-run
 */

import { createHash } from "node:crypto";
import { mkdir, readdir, readFile, stat, writeFile, copyFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const PROJECT_ROOT = path.resolve(process.cwd());
const DEFAULT_JSON = path.join(PROJECT_ROOT, "client/public/question_1.json");
const DEFAULT_PUBLIC = path.join(PROJECT_ROOT, "client/public");
const DEFAULT_ASSETS = path.join(DEFAULT_PUBLIC, "assets/exhibits");
const DEFAULT_UI_ASSETS = path.join(DEFAULT_PUBLIC, "assets/ui");
const DEFAULT_SOURCE_DIRS = [
  path.join(PROJECT_ROOT, "client/public/assets"),
  path.join(PROJECT_ROOT, "public/assets"),
  "/home/ubuntu/webdev-static-assets/az500-question-pages",
  "/home/ubuntu/webdev-static-assets",
];

const args = new Set(process.argv.slice(2));
const valueAfter = (name, fallback) => {
  const index = process.argv.indexOf(name);
  return index >= 0 && process.argv[index + 1] ? process.argv[index + 1] : fallback;
};
const WRITE = args.has("--write");
const DOWNLOAD = args.has("--download");
const DRY_RUN = !WRITE || args.has("--dry-run");
const JSON_FILE = path.resolve(valueAfter("--json", DEFAULT_JSON));
const PUBLIC_DIR = path.resolve(valueAfter("--public", DEFAULT_PUBLIC));
const EXHIBIT_DIR = path.resolve(valueAfter("--assets", DEFAULT_ASSETS));
const UI_DIR = path.resolve(valueAfter("--ui-assets", DEFAULT_UI_ASSETS));
const REPORT_FILE = path.resolve(valueAfter("--report", path.join(PROJECT_ROOT, ".extraction/local-assets-report.json")));
const SOURCE_DIRS = [valueAfter("--source-dir", ""), ...DEFAULT_SOURCE_DIRS].filter(Boolean).map((item) => path.resolve(item));

const report = {
  mode: DRY_RUN ? "dry-run" : "write",
  jsonFiles: [JSON_FILE],
  scannedFiles: [],
  referencesFound: 0,
  migrated: [],
  reused: [],
  missing: [],
  downloaded: [],
  errors: [],
  generatedAt: new Date().toISOString(),
};
const sourceIndex = new Map();
const copyCache = new Map();

function log(message) { console.log(`[local-assets] ${message}`); }
function normalizeUrl(value) { return String(value).replaceAll("\\", "/"); }
function isImageReference(value) { return /\.(?:png|jpe?g|gif|webp|svg|avif)(?:[?#].*)?$/i.test(value) || value.includes("/manus-storage/"); }
function safeFilename(value) {
  const withoutQuery = path.basename(value.split(/[?#]/)[0]);
  const cleaned = withoutQuery.replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/-+/g, "-").replace(/^[-.]+|[-.]+$/g, "");
  return cleaned || `asset-${createHash("sha1").update(value).digest("hex").slice(0, 10)}.bin`;
}
function publicUrlFor(filePath) {
  const relative = normalizeUrl(path.relative(PUBLIC_DIR, filePath));
  return `./${relative}`;
}
function relativeJsonUrl(jsonFile, destination) {
  const relative = normalizeUrl(path.relative(path.dirname(jsonFile), destination));
  return relative.startsWith(".") ? relative : `./${relative}`;
}
function shortHash(value) { return createHash("sha1").update(value).digest("hex").slice(0, 10); }

async function walk(directory) {
  const result = [];
  try {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      if (entry.name === "node_modules" || entry.name === ".git" || entry.name === "dist") continue;
      const full = path.join(directory, entry.name);
      if (entry.isDirectory()) result.push(...await walk(full));
      else result.push(full);
    }
  } catch { /* Optional source directories may not exist. */ }
  return result;
}

async function buildSourceIndex() {
  for (const directory of SOURCE_DIRS) {
    for (const file of await walk(directory)) {
      const name = path.basename(file).toLowerCase();
      if (!sourceIndex.has(name)) sourceIndex.set(name, file);
      // Also index the stem, allowing page-187_hash.jpg to resolve to page-187.jpg.
      const pageMatch = name.match(/(page-\d+)(?:[_-][a-z0-9]+)?\.(png|jpe?g|webp)$/i);
      if (pageMatch && !sourceIndex.has(`${pageMatch[1]}.${pageMatch[2]}`)) sourceIndex.set(`${pageMatch[1]}.${pageMatch[2]}`, file);
    }
  }
}

async function findLocalSource(url) {
  const normalized = normalizeUrl(url);
  const basename = safeFilename(normalized).toLowerCase();
  if (sourceIndex.has(basename)) return sourceIndex.get(basename);
  const pageMatch = basename.match(/(page-\d+)/i);
  if (pageMatch) {
    for (const [name, file] of sourceIndex) if (name.startsWith(pageMatch[1].toLowerCase() + ".")) return file;
  }
  // Generated UI assets often have a storage hash, e.g. az500-shield-mark_<hash>.png,
  // while the downloadable local source is az500-shield-mark.png.
  const extension = path.extname(basename);
  const stem = path.basename(basename, extension).replace(/[_-][a-f0-9]{8,}$/i, "");
  if (stem) {
    for (const [name, file] of sourceIndex) {
      const sourceStem = path.basename(name, path.extname(name));
      if (path.extname(name) === extension && sourceStem === stem) return file;
    }
  }
  return null;
}

async function exists(filePath) { try { await stat(filePath); return true; } catch { return false; } }

async function destinationFor(url, directory) {
  const filename = safeFilename(url);
  const base = path.join(directory, filename);
  if (!(await exists(base))) return base;
  const existing = await readFile(base).catch(() => null);
  const sourceHash = shortHash(url);
  const ext = path.extname(filename);
  const stem = path.basename(filename, ext);
  if (existing) return path.join(directory, `${stem}-${sourceHash}${ext}`);
  return base;
}

async function materialize(url, directory) {
  const normalized = normalizeUrl(url);
  if (copyCache.has(`${directory}:${normalized}`)) return copyCache.get(`${directory}:${normalized}`);
  const localSource = await findLocalSource(normalized);
  const destination = await destinationFor(normalized, directory);
  const result = { url: normalized, destination, status: "missing" };

  if (localSource) {
    result.source = localSource;
    result.status = "copied";
    if (!DRY_RUN) {
      await mkdir(directory, { recursive: true });
      await copyFile(localSource, destination);
    }
  } else if (/^https?:\/\//i.test(normalized) && DOWNLOAD) {
    try {
      const response = await fetch(normalized);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const buffer = Buffer.from(await response.arrayBuffer());
      result.status = "downloaded";
      result.bytes = buffer.length;
      if (!DRY_RUN) {
        await mkdir(directory, { recursive: true });
        await writeFile(destination, buffer);
      }
    } catch (error) {
      result.error = error instanceof Error ? error.message : String(error);
    }
  } else {
    result.error = /^https?:\/\//i.test(normalized) ? "Remote URL requires --download" : "No matching local source file";
  }

  copyCache.set(`${directory}:${normalized}`, result);
  if (result.status === "missing") report.missing.push(result);
  else if (result.status === "downloaded") report.downloaded.push(result);
  else if (result.status === "copied") report.migrated.push(result);
  return result;
}

async function migrateJson() {
  const raw = JSON.parse(await readFile(JSON_FILE, "utf8"));
  if (!Array.isArray(raw)) throw new Error(`${JSON_FILE} must contain an array.`);
  let changed = 0;
  for (const question of raw) {
    if (!Array.isArray(question.media)) continue;
    for (const media of question.media) {
      if (!media || typeof media.src !== "string" || !isImageReference(media.src)) continue;
      report.referencesFound += 1;
      const original = media.src;
      const result = await materialize(original, EXHIBIT_DIR);
      if (result.status === "copied" || result.status === "downloaded") {
        media.src = relativeJsonUrl(JSON_FILE, result.destination);
        changed += 1;
      }
      report.reused.push({ questionId: question.id, original, updated: media.src, status: result.status });
    }
  }
  if (changed && !DRY_RUN) await writeFile(JSON_FILE, `${JSON.stringify(raw, null, 2)}\n`);
  return changed;
}

async function migrateStaticReferences() {
  const files = (await walk(path.join(PROJECT_ROOT, "client"))).filter((file) => /\.(?:css|html|js)$/i.test(file));
  const pattern = /(?:https?:\/\/[^\s"')]+|\/manus-storage\/[a-zA-Z0-9._-]+\.(?:png|jpe?g|webp|svg|gif))/g;
  for (const file of files) {
    const original = await readFile(file, "utf8");
    const matches = [...new Set(original.match(pattern) || [])].filter(isImageReference);
    if (!matches.length) continue;
    let updated = original;
    for (const source of matches) {
      report.referencesFound += 1;
      const result = await materialize(source, UI_DIR);
      if (result.status === "copied" || result.status === "downloaded") updated = updated.replaceAll(source, publicUrlFor(result.destination));
      else report.errors.push({ file, source, error: result.error });
    }
    report.scannedFiles.push({ file, references: matches.length, changed: updated !== original });
    if (updated !== original && !DRY_RUN) await writeFile(file, updated);
  }
}

async function main() {
  await buildSourceIndex();
  log(`${DRY_RUN ? "Dry-run" : "Write"} mode. JSON: ${path.relative(PROJECT_ROOT, JSON_FILE)}`);
  const changedJson = await migrateJson();
  await migrateStaticReferences();
  report.summary = { changedJson, copiedOrDownloaded: report.migrated.length + report.downloaded.length, missing: report.missing.length, errors: report.errors.length };
  await mkdir(path.dirname(REPORT_FILE), { recursive: true });
  await writeFile(REPORT_FILE, `${JSON.stringify(report, null, 2)}\n`);
  log(`References found: ${report.referencesFound}`);
  log(`Would update: ${changedJson} JSON media references; copied/downloaded: ${report.summary.copiedOrDownloaded}; missing: ${report.summary.missing}`);
  log(`Report: ${path.relative(PROJECT_ROOT, REPORT_FILE)}`);
  if (DRY_RUN) log("No files were changed. Run again with --write to apply the migration.");
  if (report.missing.length || report.errors.length) process.exitCode = 2;
}

main().catch((error) => { console.error(`[local-assets] Fatal: ${error.stack || error}`); process.exitCode = 1; });
