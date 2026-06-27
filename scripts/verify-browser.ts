/**
 * Headless browser verification: national default scope + map filter assertions.
 */
import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";
import {
  filterNationalDataset,
  isNationalRecord,
} from "../lib/data-pipeline";
import { deriveMapPoints } from "../lib/map-data";
import { applyFilters } from "../lib/filters";
import type { Contract, Filters } from "../lib/types";

const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const OUT_DIR =
  process.env.SCREENSHOT_DIR ??
  join(process.cwd(), ".verification");
const BROWSER_RUN = process.env.BROWSER_RUN ?? "1";
const VERIFY_PID = process.pid;

const WIDE_FILTERS: Filters = {
  departments: [],
  governmentLevels: [],
  yearMin: 2010,
  yearMax: 2030,
  valueMin: 0,
  valueMax: Number.MAX_SAFE_INTEGER,
  search: "",
  flaggedOnly: false,
  era: "All",
  sortBy: "Highest value",
};

const WALES_FILTERS: Filters = {
  ...WIDE_FILTERS,
  governmentLevels: ["wales"],
};

async function verifyNationalScopeFromData(contracts: Contract[]): Promise<{
  nationalTotal: number;
  nationalWales: number;
  nationalWalesMap: number;
}> {
  const national = filterNationalDataset(contracts);
  if (national.length === 0) throw new Error("National dataset is empty");

  const tiers = new Set(national.map((c) => c.government_level));
  for (const tier of [
    "central",
    "local",
    "scotland",
    "wales",
    "northern_ireland",
  ] as const) {
    if (!tiers.has(tier)) {
      throw new Error(`National dataset missing tier: ${tier}`);
    }
  }

  if (national.some((c) => c.data_provenance === "demonstration")) {
    throw new Error("National dataset includes demonstration records");
  }
  if (!national.every(isNationalRecord)) {
    throw new Error("National dataset includes non-authoritative provenance");
  }

  const filteredNational = applyFilters(national, WIDE_FILTERS);
  if (filteredNational.length !== national.length) {
    throw new Error(
      `applyFilters dropped national records (${filteredNational.length} < ${national.length})`
    );
  }

  const walesOnly = applyFilters(national, WALES_FILTERS);
  if (walesOnly.length >= national.length) {
    throw new Error(
      `National Wales filter did not reduce set (${walesOnly.length} >= ${national.length})`
    );
  }
  if (walesOnly.some((c) => !isNationalRecord(c))) {
    throw new Error("Wales-filtered national set includes non-national records");
  }

  const walesMap = deriveMapPoints(walesOnly).length;
  console.log(
    `National scope (data layer): ${national.length} records, ${walesOnly.length} Wales-only, ${walesMap} map points`
  );

  return {
    nationalTotal: national.length,
    nationalWales: walesOnly.length,
    nationalWalesMap: walesMap,
  };
}

async function verifyMapInteractivityFromData(contracts: Contract[]): Promise<{
  total: number;
  wales: number;
}> {
  const demo = contracts.filter((c) => c.data_provenance === "demonstration");
  const allPoints = deriveMapPoints(demo);
  const walesOnly = applyFilters(demo, WALES_FILTERS);
  const walesPoints = deriveMapPoints(walesOnly);

  if (allPoints.length === 0) throw new Error("No demo map points");
  if (walesPoints.length >= allPoints.length) {
    throw new Error(
      `Demo Wales filter did not reduce markers (${walesPoints.length} >= ${allPoints.length})`
    );
  }
  console.log(
    `Map interactivity (demo data): ${allPoints.length} markers → ${walesPoints.length} Wales-only`
  );
  return { total: allPoints.length, wales: walesPoints.length };
}

async function runPlaywright(
  contracts: Contract[],
  nationalExpect: { nationalTotal: number; nationalWales: number; nationalWalesMap: number }
): Promise<{
  nationalCount: number;
  nationalScopeCount: number;
  nationalWalesCount: number;
  nationalWalesMarkers: number;
  liveOnlyCount: number;
  demoCountBefore: number;
  demoCountAfter: number;
}> {
  const { chromium } = await import("playwright");
  mkdirSync(OUT_DIR, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

  await page.goto(BASE, { waitUntil: "networkidle", timeout: 90_000 });
  await page.waitForSelector("text=ProcureWatch UK", { timeout: 30_000 });
  await page.waitForSelector('[data-testid="procurement-map"]', { timeout: 60_000 });

  const nationalRadio = page.getByRole("radio", {
    name: /Full national dataset/i,
  });
  if (!(await nationalRadio.isChecked())) {
    throw new Error("Default radio is not Full national dataset");
  }

  const nationalCount = parseInt(
    (await page.getByTestId("map-marker-count").textContent()) ?? "0",
    10
  );
  console.log(`Default national view map-marker-count: ${nationalCount}`);
  if (nationalCount !== nationalExpect.nationalTotal) {
    throw new Error(
      `National map count ${nationalCount} !== expected ${nationalExpect.nationalTotal}`
    );
  }

  const nationalScopeCount = parseInt(
    (await page.getByTestId("filter-scope-count").textContent()) ?? "0",
    10
  );
  console.log(`Default national filter-scope-count: ${nationalScopeCount}`);
  if (nationalScopeCount !== nationalExpect.nationalTotal) {
    throw new Error(
      `National scope count ${nationalScopeCount} !== expected ${nationalExpect.nationalTotal}`
    );
  }

  await page.screenshot({
    path: join(OUT_DIR, `dashboard-national-run${BROWSER_RUN}.png`),
  });

  await page.getByTestId("government-level-filter").selectOption(["wales"]);
  await page.waitForTimeout(1500);

  const nationalWalesMarkers = parseInt(
    (await page.getByTestId("map-marker-count").textContent()) ?? "0",
    10
  );
  const nationalWalesCount = parseInt(
    (await page.getByTestId("filter-visible-count").textContent()) ?? "0",
    10
  );
  console.log(
    `National Wales filter: ${nationalWalesMarkers} markers, ${nationalWalesCount} visible contracts`
  );

  if (nationalWalesMarkers !== nationalExpect.nationalWalesMap) {
    throw new Error(
      `National Wales markers ${nationalWalesMarkers} !== expected ${nationalExpect.nationalWalesMap}`
    );
  }
  if (nationalWalesCount !== nationalExpect.nationalWales) {
    throw new Error(
      `National Wales visible count ${nationalWalesCount} !== expected ${nationalExpect.nationalWales}`
    );
  }
  if (nationalWalesCount >= nationalExpect.nationalTotal) {
    throw new Error("National Wales filter did not reduce visible count");
  }

  await page.screenshot({
    path: join(OUT_DIR, "dashboard-national-wales-filter.png"),
  });

  // Switching data mode resets filters (clears Wales selection) without reload
  await page.getByRole("radio", { name: /Live OCDS records only/i }).check();
  await page.waitForTimeout(1500);

  const liveOnlyCount = parseInt(
    (await page.getByTestId("map-marker-count").textContent()) ?? "0",
    10
  );
  console.log(`Live-only view map-marker-count: ${liveOnlyCount}`);
  await page.screenshot({ path: join(OUT_DIR, "dashboard-live.png") });

  const expectedLive = contracts.filter((c) => c.data_provenance === "live_ocds").length;
  if (liveOnlyCount !== expectedLive) {
    throw new Error(`Live-only map count ${liveOnlyCount} !== expected ${expectedLive}`);
  }

  await page.getByRole("radio", { name: /Demonstration data/i }).check();
  await page.waitForTimeout(2000);

  const demoCountBefore = parseInt(
    (await page.getByTestId("map-marker-count").textContent()) ?? "0",
    10
  );
  console.log(`Demonstration view map-marker-count (before Wales): ${demoCountBefore}`);
  await page.screenshot({ path: join(OUT_DIR, "dashboard.png") });

  await page.getByTestId("government-level-filter").selectOption(["wales"]);
  await page.waitForTimeout(1500);

  const demoCountAfter = parseInt(
    (await page.getByTestId("map-marker-count").textContent()) ?? "0",
    10
  );
  console.log(`Demonstration view map-marker-count (Wales filter): ${demoCountAfter}`);

  if (demoCountAfter >= demoCountBefore) {
    throw new Error(
      `map-marker-count did not decrease (${demoCountBefore} → ${demoCountAfter})`
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
  return {
    nationalCount,
    nationalScopeCount,
    nationalWalesCount,
    nationalWalesMarkers,
    liveOnlyCount,
    demoCountBefore,
    demoCountAfter,
  };
}

async function loadContractsFromPublic(): Promise<Contract[]> {
  const res = await fetch(`${BASE}/data/contracts.json`);
  if (!res.ok) throw new Error(`Cannot load contracts.json: HTTP ${res.status}`);
  return (await res.json()) as Contract[];
}

async function main() {
  mkdirSync(OUT_DIR, { recursive: true });

  const contracts = await loadContractsFromPublic();
  const nationalScope = await verifyNationalScopeFromData(contracts);
  const mapCounts = await verifyMapInteractivityFromData(contracts);
  const uiCounts = await runPlaywright(contracts, nationalScope);

  const provenance = {
    live_ocds: contracts.filter((c) => c.data_provenance === "live_ocds").length,
    portal_fixture: contracts.filter((c) => c.data_provenance === "portal_fixture").length,
    demonstration: contracts.filter((c) => c.data_provenance === "demonstration").length,
  };

  const report = {
    base_url: BASE,
    contracts_loaded: contracts.length,
    provenance,
    national_dataset_total: nationalScope.nationalTotal,
    national_wales_filtered: nationalScope.nationalWales,
    map_data_national_wales: nationalScope.nationalWalesMap,
    map_data_demo_total: mapCounts.total,
    map_data_demo_wales: mapCounts.wales,
    ui_default_national_marker_count: uiCounts.nationalCount,
    ui_default_national_scope_count: uiCounts.nationalScopeCount,
    ui_national_wales_marker_count: uiCounts.nationalWalesMarkers,
    ui_national_wales_visible_count: uiCounts.nationalWalesCount,
    ui_live_only_marker_count: uiCounts.liveOnlyCount,
    ui_demo_marker_count_before_wales: uiCounts.demoCountBefore,
    ui_demo_marker_count_wales_filter: uiCounts.demoCountAfter,
    map_filter_test_scope_national: "national_default_wales_filter",
    map_filter_test_scope_demo: "demonstration_wales_filter",
    map_filter_test: "passed",
    default_view: "national",
    browser_run: Number(BROWSER_RUN),
    verify_pid: VERIFY_PID,
    server_session: "fresh_start_per_capture_run",
    screenshot: `dashboard-national-run${BROWSER_RUN}.png`,
    timestamp: new Date().toISOString(),
  };
  writeFileSync(join(OUT_DIR, "browser-verification.json"), JSON.stringify(report, null, 2));
  console.log("Browser verification passed");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});