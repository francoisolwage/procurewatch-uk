import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  deriveGovernmentLevel,
  filterByGovernmentLevel,
  countByGovernmentLevel,
  contractsWithLocation,
  enrichContract,
} from "../lib/government";
import { DATA_SOURCES } from "../lib/constants";
import { makeContract } from "./helpers";

describe("deriveGovernmentLevel", () => {
  it("classifies known central buyer", () => {
    assert.equal(deriveGovernmentLevel("HM Treasury"), "central");
  });

  it("classifies known local buyer", () => {
    assert.equal(deriveGovernmentLevel("Leeds City Council"), "local");
  });

  it("classifies known Scotland buyer", () => {
    assert.equal(deriveGovernmentLevel("Scottish Government"), "scotland");
  });

  it("classifies known Wales buyer", () => {
    assert.equal(deriveGovernmentLevel("Welsh Government"), "wales");
  });

  it("classifies known Northern Ireland buyer", () => {
    assert.equal(deriveGovernmentLevel("Belfast City Council"), "northern_ireland");
  });
});

describe("enrichContract", () => {
  it("attaches Scotland portal and coordinates for Scottish Government", () => {
    const enriched = enrichContract({
      ocid: "ocds-test-1",
      notice_id: "PCS-1",
      title: "Highland roads contract",
      buyer: "Scottish Government",
      supplier: "Supplier A",
      award_date: "2025-01-15",
      value_gbp: 500_000,
      cpv_code: "45000000",
      category: "Construction",
      description: "Road maintenance",
    });

    assert.equal(enriched.government_level, "scotland");
    assert.equal(enriched.data_source, DATA_SOURCES.public_contracts_scotland);
    assert.equal(enriched.location_lat, 55.9533);
    assert.equal(enriched.location_lng, -3.1883);
    assert.equal(enriched.location_locality, "Edinburgh");
  });
});

describe("filterByGovernmentLevel", () => {
  const mixed = [
    makeContract({ ocid: "a", buyer: "HM Treasury", government_level: "central" }),
    makeContract({ ocid: "b", buyer: "Leeds City Council", government_level: "local", location: { lat: 53.8, lng: -1.55, locality: "Leeds", nation: "England" } }),
    makeContract({ ocid: "c", buyer: "Scottish Government", government_level: "scotland", location: { lat: 55.95, lng: -3.19, locality: "Edinburgh", nation: "Scotland" } }),
    makeContract({ ocid: "d", buyer: "Welsh Government", government_level: "wales", location: { lat: 51.48, lng: -3.18, locality: "Cardiff", nation: "Wales" } }),
    makeContract({ ocid: "e", buyer: "Belfast City Council", government_level: "northern_ireland", location: { lat: 54.6, lng: -5.93, locality: "Belfast", nation: "Northern Ireland" } }),
  ];

  it("returns all when no levels selected", () => {
    assert.equal(filterByGovernmentLevel(mixed, []).length, 5);
  });

  it("returns only devolved Scotland records", () => {
    const result = filterByGovernmentLevel(mixed, ["scotland"]);
    assert.equal(result.length, 1);
    assert.equal(result[0].ocid, "c");
  });

  it("returns central and local together", () => {
    const result = filterByGovernmentLevel(mixed, ["central", "local"]);
    assert.equal(result.length, 2);
    assert.deepEqual(result.map((r) => r.ocid).sort(), ["a", "b"]);
  });
});

describe("countByGovernmentLevel", () => {
  it("counts each tier in mixed input", () => {
    const mixed = [
      makeContract({ ocid: "1", buyer: "HM Treasury", government_level: "central" }),
      makeContract({ ocid: "2", buyer: "HM Treasury", government_level: "central" }),
      makeContract({ ocid: "3", buyer: "Scottish Government", government_level: "scotland" }),
      makeContract({ ocid: "4", buyer: "Welsh Government", government_level: "wales" }),
      makeContract({ ocid: "5", buyer: "Belfast City Council", government_level: "northern_ireland" }),
      makeContract({ ocid: "6", buyer: "Leeds City Council", government_level: "local" }),
    ];
    const counts = countByGovernmentLevel(mixed);
    assert.equal(counts.central, 2);
    assert.equal(counts.local, 1);
    assert.equal(counts.scotland, 1);
    assert.equal(counts.wales, 1);
    assert.equal(counts.northern_ireland, 1);
  });
});

describe("contractsWithLocation", () => {
  it("excludes contracts missing locality", () => {
    const withLoc = makeContract({
      ocid: "ok",
      buyer: "HM Treasury",
      government_level: "central",
      location: { lat: 51.5, lng: -0.12, locality: "London", nation: "England" },
    });
    const noLoc = makeContract({
      ocid: "bad",
      buyer: "HM Treasury",
      government_level: "central",
      location: { lat: 51.5, lng: -0.12, locality: "", nation: "England" },
    });
    const result = contractsWithLocation([withLoc, noLoc]);
    assert.equal(result.length, 1);
    assert.equal(result[0].ocid, "ok");
  });
});