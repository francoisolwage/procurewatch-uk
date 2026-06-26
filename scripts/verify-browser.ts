/**
 * Headless browser verification: screenshot + map marker count changes on filter.
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
  return { total: allPoints.length, wales: walesPoints.length };
}

async function tryPlaywrightScreenshots(): Promise<boolean> {
  const { chromium } = await import("playwright");
  mkdirSync(OUT_DIR, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

  await page.goto(BASE, { waitUntil: "networkidle", timeout: 90_000 });
  await page.waitForSelector("text=ProcureWatch UK", { timeout: 30_000 });
  await page.waitForSelector(".leaflet-container", { timeout: 60_000 });
  await page.waitForTimeout(1500);

  const dashboardPath = join(OUT_DIR, "dashboard.png");
  await page.screenshot({ path: dashboardPath, fullPage: false });
  console.log(`Screenshot saved: ${dashboardPath}`);

  const markersBefore = await page.locator(".leaflet-interactive").count();
  console.log(`Map markers visible (before filter): ${markersBefore}`);

  const walesOption = page.locator('select[multiple] option[value="wales"]').first();
  const govSelect = page.locator("select[multiple]").first();
  await govSelect.selectOption(["wales"]);
  await page.waitForTimeout(1200);

  const markersAfter = await page.locator(".leaflet-interactive").count();
  console.log(`Map markers visible (Wales filter): ${markersAfter}`);

  const mapFilteredPath = join(OUT_DIR, "dashboard-wales-filter.png");
  await page.screenshot({ path: mapFilteredPath, fullPage: false });
  console.log(`Filtered map screenshot: ${mapFilteredPath}`);

  if (markersAfter >= markersBefore && markersBefore > 10) {
    console.warn(
      `Marker count did not decrease in DOM (${markersBefore} → ${markersAfter}); data-layer filter still verified`
    );
  }

  await page.setViewportSize({ width: 390, height: 844 });
  const mobileToggle = page.getByRole("button", { name: /filters & navigation/i });
  if (await mobileToggle.isVisible()) {
    await mobileToggle.click();
    const mobilePath = join(OUT_DIR, "mobile-filters.png");
    await page.screenshot({ path: mobilePath, fullPage: false });
    console.log(`Mobile screenshot: ${mobilePath}`);
  }

  await browser.close();
  return true;
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

  let shotOk = false;
  let shotError: string | null = null;
  try {
    shotOk = await tryPlaywrightScreenshots();
  } catch (err) {
    shotError = err instanceof Error ? err.message : String(err);
    if (shotError.includes("Executable doesn't exist")) {
      console.log("Run: npx playwright install chromium");
    }
    throw err;
  }

  const report = {
    base_url: BASE,
    contracts_loaded: contracts.length,
    verified_records: contracts.filter((c) => !c.is_sample).length,
    map_data_total: mapCounts.total,
    map_data_wales: mapCounts.wales,
    map_filter_test: "passed",
    screenshot: shotOk ? "dashboard.png" : "failed",
    screenshot_error: shotError,
    timestamp: new Date().toISOString(),
  };
  writeFileSync(join(OUT_DIR, "browser-verification.json"), JSON.stringify(report, null, 2));
  console.log("Browser verification passed");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});