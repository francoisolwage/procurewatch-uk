/**
 * Evidence capture gate-runner.
 * Usage: SCRATCH_DIR=<path> [CAPTURE_RUN=1|2] npm run capture-evidence
 *
 * Run twice as separate shell invocations. After both runs, execute:
 *   npm run write-delivery-evidence
 */
import { execSync, spawn } from "child_process";
import fs from "fs";
import path from "path";

const SCRATCH =
  process.env.SCRATCH_DIR ??
  path.join(process.cwd(), ".verification");
const ROOT = process.cwd();
const CAPTURE_RUN = process.env.CAPTURE_RUN ?? "1";

function run(cmd: string, logFile: string, env?: NodeJS.ProcessEnv): string {
  console.log(`→ ${cmd} → ${logFile}`);
  const out = execSync(cmd, {
    cwd: ROOT,
    encoding: "utf-8",
    stdio: "pipe",
    env: { ...process.env, ...env },
  });
  fs.writeFileSync(path.join(SCRATCH, logFile), out);
  process.stdout.write(out);
  return out;
}

function runRepeated(cmd: string, logBase: string, times = 2): void {
  const outputs: string[] = [];
  for (let i = 1; i <= times; i++) {
    outputs.push(run(cmd, `${logBase}-run${i}.log`));
  }
  fs.writeFileSync(
    path.join(SCRATCH, `${logBase}.log`),
    outputs.map((o, i) => `=== run ${i + 1} ===\n${o}`).join("\n\n")
  );
}

function stopServer(): void {
  try {
    execSync(
      'powershell -Command "Get-NetTCPConnection -LocalPort 3000 -EA SilentlyContinue | Select -Expand OwningProcess -Unique | ForEach-Object { Stop-Process -Id $_ -Force -EA SilentlyContinue }"',
      { cwd: ROOT, stdio: "pipe" }
    );
  } catch {
    /* ignore */
  }
}

function startServer(): ReturnType<typeof spawn> {
  const server = spawn("npm", ["run", "start"], {
    cwd: ROOT,
    stdio: "ignore",
    detached: true,
    shell: true,
  });
  server.unref();
  return server;
}

async function main() {
  fs.mkdirSync(SCRATCH, { recursive: true });

  const header = [
    `CAPTURE_RUN=${CAPTURE_RUN}`,
    `pid=${process.pid}`,
    `timestamp=${new Date().toISOString()}`,
    "",
  ].join("\n");
  fs.writeFileSync(
    path.join(SCRATCH, `capture-evidence-run${CAPTURE_RUN}.log`),
    header
  );
  console.log(header.trim());

  runRepeated("npm run build", "build", 2);
  runRepeated("npm test", "unit-tests", 2);
  run("npm run verify-data", "data-verification.log");

  stopServer();
  await new Promise((r) => setTimeout(r, 2000));
  const server = startServer();
  console.log(`server_pid=${server.pid ?? "unknown"}`);
  await new Promise((r) => setTimeout(r, 6000));

  try {
    run("npm run verify-server", "server-verification.log");
    run(`npm run verify-browser`, `browser-verification-run${CAPTURE_RUN}.log`, {
      SCREENSHOT_DIR: SCRATCH,
      BASE_URL: "http://localhost:3000",
      BROWSER_RUN: CAPTURE_RUN,
    });
    const report = path.join(SCRATCH, "browser-verification.json");
    if (fs.existsSync(report)) {
      fs.copyFileSync(
        report,
        path.join(SCRATCH, `browser-verification-run${CAPTURE_RUN}.json`)
      );
    }
  } finally {
    stopServer();
    await new Promise((r) => setTimeout(r, 1500));
  }

  const footer = `\ncompleted CAPTURE_RUN=${CAPTURE_RUN} at ${new Date().toISOString()}\n`;
  fs.appendFileSync(
    path.join(SCRATCH, `capture-evidence-run${CAPTURE_RUN}.log`),
    footer
  );
  console.log(`Evidence written to ${SCRATCH}`);
  console.log("Run npm run write-delivery-evidence to emit CHANGED_FILES + patch.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});