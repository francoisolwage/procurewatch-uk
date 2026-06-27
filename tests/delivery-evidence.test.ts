import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { execSync } from "child_process";
import fs from "fs";
import os from "os";
import path from "path";
import {
  NATIONAL_BASELINE,
  buildChangedFilesBody,
  discoverDeliveryPaths,
  filterDeliverySourcePaths,
  gitAllChangedPaths,
  gitDiffPatchFor,
  parseChangedFilesList,
  writeDeliveryEvidenceToDirs,
} from "../lib/delivery-manifest";

const ROOT = path.resolve(import.meta.dirname, "..");

/** Build-time generated artifacts allowed outside the delivery commit. */
const ALLOWED_DIRTY = new Set([
  "data/sample_contracts.csv",
  "data/verified_contracts.json",
  "public/data/contracts.json",
]);

function porcelainPaths(): string[] {
  const out = execSync("git status --porcelain", {
    cwd: ROOT,
    encoding: "utf-8",
  }).trim();
  if (!out) return [];
  return out
    .split(/\r?\n/)
    .map((line) => line.replace(/^\s*[MADRCU?!]+\s+/, "").trim())
    .map((f) => f.replace(/\\/g, "/"));
}

describe("national delivery manifest (plan step 6 — git-discovered)", () => {
  it("discovers delivery paths from unscoped git diff (not a hardcoded list)", () => {
    const allChanged = gitAllChangedPaths();
    const discovered = discoverDeliveryPaths();
    const filtered = filterDeliverySourcePaths(allChanged);

    assert.deepEqual(discovered, filtered);
    assert.ok(discovered.length >= 10, `expected ≥10 source paths, got ${discovered.length}`);
    assert.ok(
      !discovered.some((p) => p.startsWith("data/") || p.startsWith("public/")),
      "manifest must exclude generated data artifacts"
    );

    console.log(`delivery_manifest_ok: ${discovered.join(", ")}`);
  });

  it("discovered paths exist on disk and include national default markers", () => {
    const discovered = discoverDeliveryPaths();
    for (const rel of discovered) {
      const abs = path.join(ROOT, rel);
      assert.ok(fs.existsSync(abs), `missing delivery file: ${rel}`);
    }

    const pipeline = fs.readFileSync(
      path.join(ROOT, "lib", "data-pipeline.ts"),
      "utf-8"
    );
    assert.match(pipeline, /DEFAULT_DATA_VIEW_MODE.*=.*"national"/);
    assert.match(pipeline, /scopeContractsForMode/);

    assert.ok(
      discovered.includes("lib/data-pipeline.ts"),
      "git must report lib/data-pipeline.ts in delivery"
    );
    assert.ok(
      discovered.includes("components/Dashboard.tsx"),
      "git must report Dashboard in delivery"
    );
  });

  it("write-delivery-evidence output matches git-discovered manifest", () => {
    const discovered = discoverDeliveryPaths();
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "pw-delivery-"));
    try {
      writeDeliveryEvidenceToDirs([tmp]);
      const changedBody = fs.readFileSync(path.join(tmp, "CHANGED_FILES"), "utf-8");
      const listed = parseChangedFilesList(changedBody).sort();
      assert.deepEqual(listed, discovered);

      const patch = fs.readFileSync(path.join(tmp, "SOURCE_CHANGES.patch"), "utf-8");
      const hunks = (patch.match(/^diff --git /gm) ?? []).length;
      assert.equal(hunks, discovered.length);
      assert.ok(patch.includes("scopeContractsForMode") || patch.includes("national"));
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });

  it("baseline patch is non-empty for discovered paths", () => {
    const discovered = discoverDeliveryPaths();
    const patch = gitDiffPatchFor(discovered);
    assert.ok(patch.includes("diff --git"));
    assert.equal(
      (patch.match(/^diff --git /gm) ?? []).length,
      discovered.length
    );
  });

  it("working tree has no unexpected dirty paths", () => {
    const dirty = porcelainPaths();
    const unexpected = dirty.filter((f) => !ALLOWED_DIRTY.has(f));
    assert.deepEqual(
      unexpected,
      [],
      `unexpected dirty paths: ${unexpected.join(", ")}`
    );
  });

  it("buildChangedFilesBody round-trips discovered paths", () => {
    const discovered = discoverDeliveryPaths();
    const body = buildChangedFilesBody(discovered);
    assert.deepEqual(parseChangedFilesList(body).sort(), discovered);
    assert.match(body, new RegExp(`# baseline: ${NATIONAL_BASELINE}`));
  });
});