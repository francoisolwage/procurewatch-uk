/**
 * Single evidence capture command for the verification harness.
 * Usage: SCRATCH_DIR=<path> npm run capture-evidence
 */
import { execSync, spawn } from "child_process";
import fs from "fs";
import path from "path";

const SCRATCH =
  process.env.SCRATCH_DIR ??
  path.join(process.cwd(), ".verification");
const ROOT = process.cwd();

const SOURCE_FILES = [
  "lib/data-pipeline.ts",
  "data/fixtures/verified/central.json",
  "data/fixtures/verified/local.json",
  "data/fixtures/verified/scotland.json",
  "data/fixtures/verified/wales.json",
  "data/fixtures/verified/northern_ireland.json",
  "scripts/fetch-verified.ts",
  "scripts/preprocess.ts",
  "scripts/verify-data.ts",
  "scripts/verify-browser.ts",
  "scripts/verify-server.ts",
  "scripts/capture-evidence.ts",
  "tests/data-pipeline.test.ts",
  "components/Dashboard.tsx",
  "components/FilterPanel.tsx",
  "components/SampleDataBanner.tsx",
  "components/ProcurementMapInner.tsx",
  "components/Methodology.tsx",
  "package.json",
];

function run(cmd: string, logFile: string, env?: NodeJS.ProcessEnv): void {
  console.log(`→ ${cmd}`);
  const out = execSync(cmd, {
    cwd: ROOT,
    encoding: "utf-8",
    stdio: "pipe",
    env: { ...process.env, ...env },
  });
  fs.writeFileSync(path.join(SCRATCH, logFile), out);
  process.stdout.write(out);
}

async function main() {
  fs.mkdirSync(SCRATCH, { recursive: true });

  run("npm run build", "build.log");
  run("npm test", "unit-tests.log");
  run("npm run verify-data", "data-verification.log");

  const server = spawn("npm", ["run", "start"], {
    cwd: ROOT,
    stdio: "ignore",
    detached: true,
    shell: true,
  });
  server.unref();

  await new Promise((r) => setTimeout(r, 5000));

  try {
    run("npm run verify-server", "server-verification.log");
    run("npm run verify-browser", "browser-verification.log", {
      SCREENSHOT_DIR: SCRATCH,
      BASE_URL: "http://localhost:3000",
    });
  } finally {
    try {
      execSync(
        'powershell -Command "Get-NetTCPConnection -LocalPort 3000 -EA SilentlyContinue | Select -Expand OwningProcess -Unique | ForEach-Object { Stop-Process -Id $_ -Force -EA SilentlyContinue }"'
      );
    } catch {
      /* ignore */
    }
  }

  fs.writeFileSync(
    path.join(SCRATCH, "CHANGED_FILES"),
    `# ProcureWatch UK — source files in this delivery\n\n${SOURCE_FILES.map((f) => `- ${f}`).join("\n")}\n`
  );

  console.log(`Evidence written to ${SCRATCH}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});