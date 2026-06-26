/**
 * Headless browser verification: screenshot + map-marker-count filter assertion.
 */
import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";
import { deriveMapPoints } from "../lib/map-data";
import { applyFilters } from "../lib/filters";
import type { Contract } from "../lib/types";

const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const OUT_DIR =
  process.env.SCREENSHOT_DIR ??
  join(process.cwd(), ".verification");

async function verifyMapInteractivityFromData(contracts: Contract[]): Promise<{
  total: number;
  wales: number;
}> {
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

  if (allPoints.length === 0) throw new Error("No map points in dataset");
  if (walesPoints.length >= allPoints.length) {
    throw new Error(
      `Wales filter did not reduce markers (${walesPoints.length} >= ${allPoints.length})`
    );
  }
  console.log(
    `Map interactivity (data): ${allPoints.length} total markers → ${walesPoints.length} Wales-only`
  );
  return { total: allPoints.length, wales: walesPoints.length };
}

async function runPlaywright(): Promise<{
  countBefore: number;
  countAfter: number;
}> {
  const { chromium } = await import("playwright");
  mkdirSync(OUT_DIR, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

  await page.goto(BASE, { waitUntil: "networkidle", timeout: 90_000 });
  await page.waitForSelector("text=ProcureWatch UK", { timeout: 30_000 });
  await page.waitForSelector('[data-testid="procurement-map"]', { timeout: 60_000 });

  const officialCount = parseInt(
    (await page.getByTestId("map-marker-count").textContent()) ?? "0",
    10
  );
  console.log(`Official view map-marker-count: ${officialCount}`);

  await page.screenshot({ path: join(OUT_DIR, "dashboard-official.png") });

  await page.getByRole("radio", { name: /Demonstration data/i }).check();
  await page.waitForTimeout(2000);

  const countBefore = parseInt(
    (await page.getByTestId("map-marker-count").textContent()) ?? "0",
    10
  );
  console.log(`Demonstration view map-marker-count (before Wales): ${countBefore}`);

  await page.screenshot({ path: join(OUT_DIR, "dashboard.png") });

  const govSelect = page.getByTestId("government-level-filter");
  await govSelect.selectOption(["wales"]);
  await page.waitForTimeout(1500);

  const countAfter = parseInt(
    (await page.getByTestId("map-marker-count").textContent()) ?? "0",
    10
  );
  console.log(`Demonstration view map-marker-count (Wales filter): ${countAfter}`);

  if (countAfter >= countBefore) {
    throw new Error(
      `map-marker-count did not decrease after Wales filter (${countBefore} → ${countAfter})`
    );
  }

  await page.screenshot({ path: join(OUT_DIR, "dashboard-wales-filter.png") });

  await page.setViewportSize({ width: 390, height: 844 });
  const mobileToggle = page.getByRole("button", { name: /filters & navigation/i });
  if (await mobileToggle.isVisible()) {
    await mobileToggle.click();
    await page.screenshot({ path: join(OUT_DIR, "mobile-filters.png") });
  }

  await browser.close();
  return { countBefore, countAfter };
}

async function loadContractsFromPublic(): Promise<Contract[]> {
  const res = await fetch(`${BASE}/data/contracts.json`);
  if (!res.ok) throw new Error(`Cannot load contracts.json: HTTP ${res.status}`);
  return (await res.json()) as Contract[];
}

async function main() {
  mkdirSync(OUT_DIR, { recursive: true });

  const contracts = await loadContractsFromPublic();
  const mapCounts = await verifyMapInteractivityFromData(contracts);
  const uiCounts = await runPlaywright();

  const report = {
    base_url: BASE,
    contracts_loaded: contracts.length,
    verified_records: contracts.filter((c) => !c.is_sample).length,
    demo_records: contracts.filter((c) => c.is_sample).length,
    map_data_total: mapCounts.total,
    map_data_wales: mapCounts.wales,
    ui_marker_count_before_wales: uiCounts.countBefore,
    ui_marker_count_wales_filter: uiCounts.countAfter,
    map_filter_test: "passed",
    screenshot: "dashboard.png",
    timestamp: new Date().toISOString(),
  };
  writeFileSync(join(OUT_DIR, "browser-verification.json"), JSON.stringify(report, null, 2));
  console.log("Browser verification passed");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});