/**
 * Runs the plan verification steps and writes evidence to SCRATCH dir.
 * Usage: SCRATCH_DIR=<path> tsx scripts/capture-evidence.ts
 */
import { execSync, spawn } from "child_process";
import fs from "fs";
import path from "path";

const SCRATCH =
  process.env.SCRATCH_DIR ??
  path.join(process.cwd(), ".verification");
const ROOT = process.cwd();

function run(cmd: string, logFile: string): void {
  console.log(`→ ${cmd}`);
  const out = execSync(cmd, { cwd: ROOT, encoding: "utf-8", stdio: "pipe" });
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

  await new Promise((r) => setTimeout(r, 4000));

  try {
    run("npm run verify-server", "server-verification.log");
    process.env.SCREENSHOT_DIR = SCRATCH;
    run("npm run verify-browser", "browser-verification.log");
  } finally {
    try {
      execSync('powershell -Command "Get-NetTCPConnection -LocalPort 3000 -EA SilentlyContinue | Select -Expand OwningProcess -Unique | ForEach-Object { Stop-Process -Id $_ -Force -EA SilentlyContinue }"');
    } catch {
      /* ignore */
    }
  }

  const changed = execSync("git diff --name-only HEAD~1 HEAD 2>nul || git diff --name-only", {
    cwd: ROOT,
    encoding: "utf-8",
  });
  const staged = execSync("git status --porcelain", { cwd: ROOT, encoding: "utf-8" });
  fs.writeFileSync(
    path.join(SCRATCH, "CHANGED_FILES"),
    `# Source files in this delivery\n\n## Last commit\n${changed}\n\n## Working tree\n${staged}`
  );

  console.log(`Evidence written to ${SCRATCH}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});