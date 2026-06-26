import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { applyFilters } from "../lib/filters";
import { makeContract } from "./helpers";
import type { Filters } from "../lib/types";

const baseFilters: Filters = {
  departments: [],
  governmentLevels: [],
  yearMin: 2017,
  yearMax: 2026,
  valueMin: 0,
  valueMax: 10_000_000,
  search: "",
  flaggedOnly: false,
  era: "All",
  sortBy: "Highest value",
};

describe("applyFilters government level", () => {
  const contracts = [
    makeContract({ ocid: "c1", buyer: "HM Treasury", government_level: "central", value_gbp: 100_000 }),
    makeContract({ ocid: "l1", buyer: "Leeds City Council", government_level: "local", value_gbp: 200_000, location: { lat: 53.8, lng: -1.55, locality: "Leeds", nation: "England" } }),
    makeContract({ ocid: "s1", buyer: "Scottish Government", government_level: "scotland", title: "Scottish roads maintenance", value_gbp: 300_000, location: { lat: 55.95, lng: -3.19, locality: "Edinburgh", nation: "Scotland" } }),
    makeContract({ ocid: "w1", buyer: "Welsh Government", government_level: "wales", value_gbp: 400_000, location: { lat: 51.48, lng: -3.18, locality: "Cardiff", nation: "Wales" } }),
    makeContract({ ocid: "n1", buyer: "Belfast City Council", government_level: "northern_ireland", value_gbp: 500_000, location: { lat: 54.6, lng: -5.93, locality: "Belfast", nation: "Northern Ireland" } }),
  ];

  it("filters to Wales and Northern Ireland only", () => {
    const result = applyFilters(contracts, {
      ...baseFilters,
      governmentLevels: ["wales", "northern_ireland"],
    });
    assert.equal(result.length, 2);
    assert.deepEqual(result.map((r) => r.ocid).sort(), ["n1", "w1"]);
  });

  it("combines search with government level filter", () => {
    const result = applyFilters(contracts, {
      ...baseFilters,
      governmentLevels: ["scotland"],
      search: "Scottish",
    });
    assert.equal(result.length, 1);
    assert.equal(result[0].ocid, "s1");
  });
});