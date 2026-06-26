/**
 * Headless browser verification: screenshot + map marker count changes on filter.
 * Falls back gracefully if Playwright browsers are not installed.
 */
import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";
import { deriveMapPoints } from "../lib/map-data";
import { applyFilters } from "../lib/filters";
import type { Contract, Filters } from "../lib/types";

const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const OUT_DIR =
  process.env.SCREENSHOT_DIR ??
  join(process.cwd(), ".verification");

async function verifyMapInteractivityFromData(contracts: Contract[]): Promise<void> {
  const allPoints = deriveMapPoints(contracts);
  const walesOnly = applyFilters(contracts, {
    departments: [],
    governmentLevels: ["wales"],
    yearMin: 2010,
    yearMax: 2030,
    valueMin: 0,
    valueMax: Number.MAX_SAFE_INTEGER,
    search: "",
    flaggedOnly: false,
    era: "All",
    sortBy: "Highest value",
  });
  const walesPoints = deriveMapPoints(walesOnly);

  if (allPoints.length === 0) {
    throw new Error("No map points in dataset");
  }
  if (walesPoints.length >= allPoints.length) {
    throw new Error(
      `Wales filter did not reduce markers (${walesPoints.length} >= ${allPoints.length})`
    );
  }
  console.log(
    `Map interactivity (data): ${allPoints.length} total markers → ${walesPoints.length} Wales-only`
  );
}

async function tryPlaywrightScreenshot(): Promise<boolean> {
  try {
    const { chromium } = await import("playwright");
    mkdirSync(OUT_DIR, { recursive: true });

    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

    await page.goto(BASE, { waitUntil: "networkidle", timeout: 60_000 });
    await page.waitForSelector("text=ProcureWatch UK", { timeout: 30_000 });

    const screenshotPath = join(OUT_DIR, "procurewatch-overview.png");
    await page.screenshot({ path: screenshotPath, fullPage: false });
    console.log(`Screenshot saved: ${screenshotPath}`);

    const mobileToggle = page.getByRole("button", {
      name: /filters & navigation/i,
    });
    if (await mobileToggle.isVisible()) {
      await mobileToggle.click();
      const mobileShot = join(OUT_DIR, "procurewatch-mobile-filters.png");
      await page.setViewportSize({ width: 390, height: 844 });
      await page.screenshot({ path: mobileShot, fullPage: false });
      console.log(`Mobile screenshot saved: ${mobileShot}`);
    }

    await browser.close();
    return true;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    const code = err && typeof err === "object" && "code" in err ? String(err.code) : "";
    if (
      code === "ERR_MODULE_NOT_FOUND" ||
      msg.includes("Cannot find module 'playwright'") ||
      msg.includes("Cannot find package 'playwright'")
    ) {
      console.log("Playwright not installed — skipping live screenshot");
      return false;
    }
    if (msg.includes("Executable doesn't exist") || msg.includes("browserType.launch")) {
      console.log("Playwright browsers not installed — skipping live screenshot");
      return false;
    }
    throw err;
  }
}

async function loadContractsFromPublic(): Promise<Contract[]> {
  const res = await fetch(`${BASE}/data/contracts.json`);
  if (!res.ok) throw new Error(`Cannot load contracts.json: HTTP ${res.status}`);
  const raw = (await res.json()) as Contract[];
  return raw;
}

async function main() {
  mkdirSync(OUT_DIR, { recursive: true });

  const contracts = await loadContractsFromPublic();
  await verifyMapInteractivityFromData(contracts);

  const shotOk = await tryPlaywrightScreenshot();
  const report = {
    base_url: BASE,
    contracts_loaded: contracts.length,
    verified_records: contracts.filter((c) => !c.is_sample).length,
    map_filter_test: "passed",
    screenshot: shotOk ? "playwright" : "skipped",
    timestamp: new Date().toISOString(),
  };
  writeFileSync(join(OUT_DIR, "browser-verification.json"), JSON.stringify(report, null, 2));
  console.log("Browser verification passed");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});