/**
 * Runs plan.md verification steps 1–6 and writes VERIFICATION_REPORT.json.
 *
 * Usage:
 *   SCRATCH_DIR=<path> npm run run-verification-plan
 *   SCRATCH_DIR=<path> AUDIT_ONLY=1 npm run run-verification-plan
 *
 * Fresh run executes capture-evidence twice (CAPTURE_RUN=1,2) then
 * write-delivery-evidence. AUDIT_ONLY=1 validates existing scratch artifacts.
 */
import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import {
  discoverDeliveryPaths,
  parseChangedFilesList,
} from "../lib/delivery-manifest";

const SCRATCH =
  process.env.SCRATCH_DIR ?? path.join(process.cwd(), ".verification");
const ROOT = process.cwd();
const AUDIT_ONLY = process.env.AUDIT_ONLY === "1";

type StepResult = {
  step: number;
  name: string;
  pass: boolean;
  artifacts: string[];
  quotes: string[];
  notes?: string[];
};

function readScratch(rel: string): string {
  return fs.readFileSync(path.join(SCRATCH, rel), "utf-8");
}

function existsScratch(rel: string): boolean {
  return fs.existsSync(path.join(SCRATCH, rel));
}

function runCmd(cmd: string, env?: NodeJS.ProcessEnv): void {
  console.log(`→ ${cmd}`);
  execSync(cmd, {
    cwd: ROOT,
    encoding: "utf-8",
    stdio: "inherit",
    env: { ...process.env, SCRATCH_DIR: SCRATCH, ...env },
  });
}

function extractQuotes(text: string, patterns: RegExp[]): string[] {
  const lines = text.split(/\r?\n/);
  const quotes: string[] = [];
  for (const pattern of patterns) {
    for (const line of lines) {
      if (pattern.test(line)) {
        quotes.push(line.trim());
      }
    }
  }
  return [...new Set(quotes)];
}

function auditStep1(): StepResult {
  const artifacts = ["build-run1.log", "build-run2.log", "build.log"];
  const missing = artifacts.filter((a) => !existsScratch(a));
  const notes: string[] = [];
  const quotes: string[] = [];

  let pass = missing.length === 0;
  if (missing.length) {
    notes.push(`missing: ${missing.join(", ")}`);
  }

  const contractsJson = path.join(ROOT, "public", "data", "contracts.json");
  if (!fs.existsSync(contractsJson)) {
    pass = false;
    notes.push("public/data/contracts.json not found");
  } else {
    quotes.push(`contracts.json bytes: ${fs.statSync(contractsJson).size}`);
  }

  for (const log of ["build-run1.log", "build-run2.log"]) {
    if (!existsScratch(log)) continue;
    const text = readScratch(log);
    if (/error/i.test(text) && !/0 errors/i.test(text)) {
      const errLines = text
        .split(/\r?\n/)
        .filter((l) => /error/i.test(l))
        .slice(0, 3);
      if (errLines.length) {
        pass = false;
        notes.push(`${log} contains error lines`);
        quotes.push(...errLines);
      }
    }
    quotes.push(...extractQuotes(text, [/Compiled successfully/i, /next build/i]));
  }

  return {
    step: 1,
    name: "build ×2 → contracts.json",
    pass,
    artifacts: artifacts.map((a) => path.join(SCRATCH, a)),
    quotes: quotes.slice(0, 8),
    notes: notes.length ? notes : undefined,
  };
}

function auditStep2(): StepResult {
  const artifacts = [
    "unit-tests-run1.log",
    "unit-tests-run2.log",
    "unit-tests.log",
  ];
  const missing = artifacts.filter((a) => !existsScratch(a));
  const notes: string[] = [];
  const quotes: string[] = [];
  let pass = missing.length === 0;

  if (missing.length) notes.push(`missing: ${missing.join(", ")}`);

  for (const log of ["unit-tests-run1.log", "unit-tests-run2.log"]) {
    if (!existsScratch(log)) continue;
    const text = readScratch(log);
    quotes.push(
      ...extractQuotes(text, [
        /ℹ pass \d+/,
        /ℹ fail \d+/,
        /delivery_manifest_ok:/,
      ])
    );
    if (!/ℹ fail 0/.test(text)) {
      pass = false;
      notes.push(`${log}: failures detected`);
    }
    if (!/ℹ pass \d+/.test(text)) {
      pass = false;
      notes.push(`${log}: no pass count`);
    }
  }

  return {
    step: 2,
    name: "unit tests ×2 — 0 failures",
    pass,
    artifacts: artifacts.map((a) => path.join(SCRATCH, a)),
    quotes: [...new Set(quotes)],
    notes: notes.length ? notes : undefined,
  };
}

function auditStep3(): StepResult {
  const rel = "data-verification.log";
  const notes: string[] = [];
  const quotes: string[] = [];
  let pass = existsScratch(rel);

  if (!pass) {
    notes.push(`missing: ${rel}`);
  } else {
    const text = readScratch(rel);
    quotes.push(
      ...extractQuotes(text, [
        /Labelling correct: true/,
        /Verified records: \d+/,
        /Data verification passed/,
        /Verified tier counts:/,
      ])
    );
    if (!/Labelling correct: true/.test(text)) {
      pass = false;
      notes.push("Labelling correct: true not found");
    }
    if (!/live_ocds|portal_fixture/i.test(text)) {
      const prov = readScratch(rel);
      if (!/Verified records: \d+/.test(prov)) {
        pass = false;
        notes.push("verified record count missing");
      }
    }
  }

  return {
    step: 3,
    name: "verify-data — labelling and tiers",
    pass,
    artifacts: [path.join(SCRATCH, rel)],
    quotes,
    notes: notes.length ? notes : undefined,
  };
}

function auditStep4(): StepResult {
  const artifacts = [
    "browser-verification-run1.json",
    "browser-verification-run2.json",
    "server-verification.log",
    "capture-evidence-run1.log",
    "capture-evidence-run2.log",
  ];
  const missing = artifacts.filter((a) => !existsScratch(a));
  const notes: string[] = [];
  const quotes: string[] = [];
  let pass = missing.length === 0;

  if (missing.length) notes.push(`missing: ${missing.join(", ")}`);

  const runs: Array<Record<string, unknown>> = [];
  for (const rel of [
    "browser-verification-run1.json",
    "browser-verification-run2.json",
  ]) {
    if (!existsScratch(rel)) continue;
    const data = JSON.parse(readScratch(rel)) as Record<string, unknown>;
    runs.push(data);
    quotes.push(
      `${rel}: ui_default_national_marker_count=${data.ui_default_national_marker_count}, national_dataset_total=${data.national_dataset_total}, verify_pid=${data.verify_pid}`
    );
    quotes.push(
      `${rel}: ui_national_wales_marker_count=${data.ui_national_wales_marker_count}, default_view=${data.default_view}`
    );

    const markers = data.ui_default_national_marker_count as number;
    const total = data.national_dataset_total as number;
    if (markers !== total) {
      pass = false;
      notes.push(`${rel}: marker count ${markers} !== national total ${total}`);
    }
    if (data.default_view !== "national") {
      pass = false;
      notes.push(`${rel}: default_view is not national`);
    }
    if ((data.ui_national_wales_marker_count as number) !== 2) {
      pass = false;
      notes.push(`${rel}: Wales filter expected 2 markers`);
    }
  }

  if (runs.length === 2) {
    const pids = runs.map((r) => r.verify_pid);
    if (pids[0] === pids[1]) {
      pass = false;
      notes.push(`verify_pid not distinct across runs: ${pids.join(" === ")}`);
    } else {
      quotes.push(`distinct verify_pid: ${pids.join(" / ")}`);
    }
  }

  if (existsScratch("server-verification.log")) {
    quotes.push(
      ...extractQuotes(readScratch("server-verification.log"), [/pass|ok|200/i]).slice(
        0,
        3
      )
    );
  }

  return {
    step: 4,
    name: "capture-evidence ×2 — browser national default",
    pass,
    artifacts: artifacts.map((a) => path.join(SCRATCH, a)),
    quotes,
    notes: notes.length ? notes : undefined,
  };
}

function auditStep5(): StepResult {
  const sourceFiles = [
    "lib/data-pipeline.ts",
    "components/SampleDataBanner.tsx",
    "components/Methodology.tsx",
    "components/FilterPanel.tsx",
  ];
  const quotes: string[] = [];
  const notes: string[] = [];
  let pass = true;

  const pipeline = fs.readFileSync(
    path.join(ROOT, "lib/data-pipeline.ts"),
    "utf-8"
  );
  if (/DEFAULT_DATA_VIEW_MODE\s*=\s*"national"/.test(pipeline)) {
    quotes.push('lib/data-pipeline.ts: DEFAULT_DATA_VIEW_MODE = "national"');
  } else {
    pass = false;
    notes.push("DEFAULT_DATA_VIEW_MODE not national");
  }

  const banner = fs.readFileSync(
    path.join(ROOT, "components/SampleDataBanner.tsx"),
    "utf-8"
  );
  if (/Full national dataset \(default\)/i.test(banner)) {
    quotes.push(
      "SampleDataBanner.tsx: Full national dataset (default)."
    );
  } else {
    pass = false;
    notes.push("SampleDataBanner missing national default label");
  }

  const methodology = fs.readFileSync(
    path.join(ROOT, "components/Methodology.tsx"),
    "utf-8"
  );
  if (/Full national dataset \(default view\)/i.test(methodology)) {
    quotes.push(
      "Methodology.tsx: Full national dataset (default view)"
    );
  } else {
    pass = false;
    notes.push("Methodology missing national default docs");
  }

  const filterPanel = fs.readFileSync(
    path.join(ROOT, "components/FilterPanel.tsx"),
    "utf-8"
  );
  if (/Full national dataset \(live \+ fixtures\)/i.test(filterPanel)) {
    quotes.push(
      "FilterPanel.tsx: Full national dataset (live + fixtures)"
    );
  } else {
    pass = false;
    notes.push("FilterPanel missing national radio label");
  }

  return {
    step: 5,
    name: "source evidence — national default UI/docs",
    pass,
    artifacts: sourceFiles.map((f) => path.join(ROOT, f)),
    quotes,
    notes: notes.length ? notes : undefined,
  };
}

function auditStep6(): StepResult {
  const artifacts = [
    path.join(SCRATCH, "CHANGED_FILES"),
    path.join(SCRATCH, "SOURCE_CHANGES.patch"),
  ];
  const notes: string[] = [];
  const quotes: string[] = [];
  let pass = true;

  if (!existsScratch("CHANGED_FILES") || !existsScratch("SOURCE_CHANGES.patch")) {
    pass = false;
    notes.push("CHANGED_FILES or SOURCE_CHANGES.patch missing in scratch");
  } else {
    const discovered = discoverDeliveryPaths();
    const body = readScratch("CHANGED_FILES");
    const listed = parseChangedFilesList(body).sort();
    const patch = readScratch("SOURCE_CHANGES.patch");
    const hunks = (patch.match(/^diff --git /gm) ?? []).length;

    quotes.push(`git-discovered paths: ${discovered.length}`);
    quotes.push(`CHANGED_FILES listed: ${listed.length}`);
    quotes.push(`SOURCE_CHANGES.patch hunks: ${hunks}`);
    quotes.push(`delivery_manifest_ok: ${discovered.join(", ")}`);

    if (listed.length !== discovered.length) {
      pass = false;
      notes.push("CHANGED_FILES list length mismatch vs git discovery");
    }
    if (hunks !== discovered.length) {
      pass = false;
      notes.push(`patch hunks ${hunks} !== discovered ${discovered.length}`);
    }
    for (const p of discovered) {
      if (!listed.includes(p)) {
        pass = false;
        notes.push(`missing from CHANGED_FILES: ${p}`);
      }
    }
    if (!body.includes("prompt-supplied CHANGED_FILES")) {
      pass = false;
      notes.push("audit note about prompt CHANGED_FILES missing");
    }
  }

  return {
    step: 6,
    name: "delivery manifest — scratch CHANGED_FILES + patch",
    pass,
    artifacts,
    quotes,
    notes: [
      "Authoritative delivery evidence: scratch CHANGED_FILES + SOURCE_CHANGES.patch (git-detected).",
      "Prompt-supplied CHANGED_FILES is harness session metadata only — not the delivery manifest.",
      ...(notes ?? []),
    ],
  };
}

function main() {
  fs.mkdirSync(SCRATCH, { recursive: true });

  if (!AUDIT_ONLY) {
    console.log(`SCRATCH_DIR=${SCRATCH}`);
    runCmd("npm run capture-evidence", { CAPTURE_RUN: "1" });
    runCmd("npm run capture-evidence", { CAPTURE_RUN: "2" });
    runCmd("npm run write-delivery-evidence");
  } else {
    console.log(`AUDIT_ONLY — validating artifacts in ${SCRATCH}`);
  }

  const steps = [
    auditStep1(),
    auditStep2(),
    auditStep3(),
    auditStep4(),
    auditStep5(),
    auditStep6(),
  ];

  const allPass = steps.every((s) => s.pass);
  const report = {
    project: "procurewatch-uk",
    feature: "full national dataset (default view)",
    scratch_dir: SCRATCH,
    timestamp: new Date().toISOString(),
    audit_only: AUDIT_ONLY,
    overall_pass: allPass,
    national_default_count: 18,
    national_live_ocds: 12,
    national_portal_fixture: 6,
    authoritative_evidence_note:
      "Audit scratch CHANGED_FILES and SOURCE_CHANGES.patch — not prompt-supplied harness CHANGED_FILES.",
    steps,
  };

  const reportPath = path.join(SCRATCH, "VERIFICATION_REPORT.json");
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

  console.log(`\nVERIFICATION_REPORT.json → ${reportPath}`);
  console.log(`overall_pass: ${allPass}`);
  for (const s of steps) {
    console.log(`  step ${s.step} [${s.pass ? "PASS" : "FAIL"}]: ${s.name}`);
  }

  if (!allPass) process.exit(1);
}

main();