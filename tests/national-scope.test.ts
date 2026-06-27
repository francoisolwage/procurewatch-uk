import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {
  DEFAULT_DATA_VIEW_MODE,
  filterNationalDataset,
  isNationalRecord,
  scopeContractsForMode,
} from "../lib/data-pipeline";
import { applyFilters, contractsToCSV } from "../lib/filters";
import { deriveMapPoints } from "../lib/map-data";
import type { Contract } from "../lib/types";

const CONTRACTS_PATH = path.resolve(
  import.meta.dirname,
  "..",
  "public",
  "data",
  "contracts.json"
);

const WIDE_FILTERS = {
  departments: [] as string[],
  governmentLevels: [] as Contract["government_level"][],
  yearMin: 2010,
  yearMax: 2030,
  valueMin: 0,
  valueMax: Number.MAX_SAFE_INTEGER,
  search: "",
  flaggedOnly: false,
  era: "All" as const,
  sortBy: "Highest value" as const,
};

describe("national default scope on shipped contracts.json", () => {
  const contracts: Contract[] = JSON.parse(
    fs.readFileSync(CONTRACTS_PATH, "utf-8")
  );

  it("national union excludes demonstration and user_upload", () => {
    const national = filterNationalDataset(contracts);
    assert.ok(national.length > 0);
    assert.ok(national.every(isNationalRecord));
    assert.ok(
      national.every(
        (c) =>
          c.data_provenance !== "demonstration" &&
          c.data_provenance !== "user_upload"
      )
    );
  });

  it("applyFilters on national scope covers all five tiers", () => {
    const national = filterNationalDataset(contracts);
    const tiers = new Set(national.map((c) => c.government_level));
    for (const tier of [
      "central",
      "local",
      "scotland",
      "wales",
      "northern_ireland",
    ] as const) {
      assert.ok(tiers.has(tier), `missing tier ${tier} in national dataset`);
    }
  });

  it("wales filter on national scope reduces count and stays authoritative", () => {
    const national = filterNationalDataset(contracts);
    const wales = applyFilters(national, {
      ...WIDE_FILTERS,
      governmentLevels: ["wales"],
    });
    assert.ok(wales.length > 0);
    assert.ok(wales.length < national.length);
    assert.ok(wales.every((c) => c.government_level === "wales"));
    assert.ok(wales.every(isNationalRecord));
  });

  it("scopeContractsForMode defaults to national union", () => {
    assert.equal(DEFAULT_DATA_VIEW_MODE, "national");
    const scoped = scopeContractsForMode(DEFAULT_DATA_VIEW_MODE, contracts);
    const national = filterNationalDataset(contracts);
    assert.equal(scoped.length, national.length);
    assert.deepEqual(
      scoped.map((c) => c.ocid).sort(),
      national.map((c) => c.ocid).sort()
    );
  });

  it("scopeContractsForMode excludes demo from live and fixtures modes", () => {
    const live = scopeContractsForMode("live", contracts);
    const fixtures = scopeContractsForMode("fixtures", contracts);
    const demo = scopeContractsForMode("demonstration", contracts);
    assert.ok(live.every((c) => c.data_provenance === "live_ocds"));
    assert.ok(fixtures.every((c) => c.data_provenance === "portal_fixture"));
    assert.ok(demo.every((c) => c.data_provenance === "demonstration"));
    assert.ok(live.length + fixtures.length <= scopeContractsForMode("national", contracts).length);
  });

  it("national map points derive only from scoped authoritative records", () => {
    const national = scopeContractsForMode("national", contracts);
    const filtered = applyFilters(national, WIDE_FILTERS);
    const points = deriveMapPoints(filtered);
    assert.ok(points.length > 0);
    assert.ok(points.length <= filtered.length);
    const wales = applyFilters(national, {
      ...WIDE_FILTERS,
      governmentLevels: ["wales"],
    });
    const walesPoints = deriveMapPoints(wales);
    assert.ok(walesPoints.length < points.length);
    assert.ok(walesPoints.every((p) => p.government_level === "wales"));
  });

  it("CSV export on national scope contains only authoritative ocid prefixes", () => {
    const national = scopeContractsForMode("national", contracts);
    const filtered = applyFilters(national, WIDE_FILTERS);
    const csv = contractsToCSV(filtered);
    const lines = csv.split("\n").filter(Boolean);
    assert.ok(lines.length > 1);
    assert.match(lines[0], /ocid/i);
    for (const line of lines.slice(1)) {
      assert.ok(!line.includes("DEMO-"), "CSV must not include demonstration records");
    }
  });
});