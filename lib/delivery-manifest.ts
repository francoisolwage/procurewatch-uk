import { execSync } from "child_process";
import fs from "fs";
import path from "path";

export const NATIONAL_BASELINE = "c65aba9";

const SOURCE_PREFIXES = ["lib/", "components/", "scripts/", "tests/"] as const;
const EXTRA_ROOT_FILES = new Set(["package.json"]);
const EXCLUDED_PREFIXES = ["data/", "public/", "node_modules/"];

const ROOT = process.cwd();

/** All paths changed between baseline and HEAD (unscoped git). */
export function gitAllChangedPaths(): string[] {
  return execSync(`git diff --name-only ${NATIONAL_BASELINE} HEAD`, {
    cwd: ROOT,
    encoding: "utf-8",
  })
    .trim()
    .split(/\r?\n/)
    .filter(Boolean)
    .map((f) => f.replace(/\\/g, "/"));
}

/** Keep only national-delivery source paths; exclude generated data artifacts. */
export function filterDeliverySourcePaths(paths: string[]): string[] {
  return paths
    .filter((p) => {
      if (EXCLUDED_PREFIXES.some((prefix) => p.startsWith(prefix))) return false;
      if (EXTRA_ROOT_FILES.has(p)) return true;
      return SOURCE_PREFIXES.some((prefix) => p.startsWith(prefix));
    })
    .sort();
}

/** Git-discovered delivery manifest (no hardcoded file list). */
export function discoverDeliveryPaths(): string[] {
  return filterDeliverySourcePaths(gitAllChangedPaths());
}

export function gitDiffPatchFor(paths: string[]): string {
  if (!paths.length) return "";
  const pathArgs = paths.map((p) => `"${p}"`).join(" ");
  return execSync(`git diff ${NATIONAL_BASELINE} HEAD -- ${pathArgs}`, {
    cwd: ROOT,
    encoding: "utf-8",
    maxBuffer: 10 * 1024 * 1024,
  });
}

export function buildChangedFilesBody(changed: string[]): string {
  const commit = execSync("git rev-parse HEAD", {
    cwd: ROOT,
    encoding: "utf-8",
  }).trim();
  return [
    "# ProcureWatch UK — national dataset delivery (git-detected)",
    `# baseline: ${NATIONAL_BASELINE}`,
    `# commit: ${commit}`,
    `# discovery: unscoped git diff filtered to source prefixes`,
    "",
    ...changed.map((f) => `- ${f}`),
    "",
    `# ${changed.length} source file(s)`,
    "",
    "See SOURCE_CHANGES.patch for unified diff hunks.",
    "",
    "Audit note: prompt-supplied CHANGED_FILES lists harness session metadata only.",
    "This file is the authoritative delivery manifest (generated from git diff).",
  ].join("\n");
}

export function parseChangedFilesList(body: string): string[] {
  return body
    .split(/\r?\n/)
    .filter((line) => line.startsWith("- ") && !line.startsWith("- #"))
    .map((line) => line.slice(2).trim());
}

export function writeDeliveryEvidenceToDirs(dirs: string[]): {
  changed: string[];
  destinations: string[];
} {
  const changed = discoverDeliveryPaths();
  const changedBody = buildChangedFilesBody(changed);
  const patch = gitDiffPatchFor(changed);

  const manifest = [
    "# Evidence manifest",
    "",
    "Authoritative delivery evidence (audit these paths, not prompt CHANGED_FILES):",
    "",
    ...dirs.map((d) => `- ${path.join(d, "CHANGED_FILES")}`),
    ...dirs.map((d) => `- ${path.join(d, "SOURCE_CHANGES.patch")}`),
    "",
    `Git-discovered paths: ${changed.length}`,
    changed.map((f) => `  - ${f}`).join("\n"),
  ].join("\n");

  const destinations: string[] = [];
  for (const dir of dirs) {
    if (!dir) continue;
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, "CHANGED_FILES"), changedBody);
    fs.writeFileSync(path.join(dir, "SOURCE_CHANGES.patch"), patch);
    fs.writeFileSync(path.join(dir, "EVIDENCE_MANIFEST.md"), manifest);
    destinations.push(dir);
  }

  return { changed, destinations };
}