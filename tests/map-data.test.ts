import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { deriveMapPoints, mapPointsForLevel } from "../lib/map-data";
import { makeContract } from "./helpers";

describe("deriveMapPoints", () => {
  const contracts = [
    makeContract({
      ocid: "map-a",
      buyer: "HM Treasury",
      government_level: "central",
      location: { lat: 51.5034, lng: -0.1276, locality: "London", nation: "England" },
      title: "Central IT contract",
      value_gbp: 1_000_000,
      risk_score: 35,
    }),
    makeContract({
      ocid: "map-b",
      buyer: "Scottish Government",
      government_level: "scotland",
      location: { lat: 55.9533, lng: -3.1883, locality: "Edinburgh", nation: "Scotland" },
      title: "Scotland roads",
      value_gbp: 2_000_000,
      risk_score: 70,
    }),
    makeContract({
      ocid: "map-c",
      buyer: "Welsh Government",
      government_level: "wales",
      location: { lat: 51.4816, lng: -3.1791, locality: "Cardiff", nation: "Wales" },
      title: "Wales health IT",
      value_gbp: 500_000,
      risk_score: 0,
    }),
  ];

  it("produces one map point per contract with coordinates", () => {
    const points = deriveMapPoints(contracts);
    assert.equal(points.length, 3);
    assert.equal(points[0].lat, 51.5034);
    assert.equal(points[1].lng, -3.1883);
    assert.equal(points[2].government_level, "wales");
  });

  it("highlights selected contract", () => {
    const points = deriveMapPoints(contracts, "map-b");
    const highlighted = points.filter((p) => p.highlighted);
    assert.equal(highlighted.length, 1);
    assert.equal(highlighted[0].id, "map-b");
    assert.equal(highlighted[0].title, "Scotland roads");
  });
});

describe("mapPointsForLevel", () => {
  const points = deriveMapPoints([
    makeContract({
      ocid: "x",
      buyer: "HM Treasury",
      government_level: "central",
      location: { lat: 51.5, lng: -0.12, locality: "London", nation: "England" },
    }),
    makeContract({
      ocid: "y",
      buyer: "Scottish Government",
      government_level: "scotland",
      location: { lat: 55.95, lng: -3.19, locality: "Edinburgh", nation: "Scotland" },
    }),
  ]);

  it("filters points to wales level", () => {
    assert.equal(mapPointsForLevel(points, "wales").length, 0);
  });

  it("filters points to scotland level", () => {
    const scotland = mapPointsForLevel(points, "scotland");
    assert.equal(scotland.length, 1);
    assert.equal(scotland[0].id, "y");
  });
});