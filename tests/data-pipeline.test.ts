import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "fs";
import path from "path";
import {
  parseOcdsRelease,
  supplementMissingVerifiedTiers,
  mergeVerifiedAndDemo,
  assertLabelling,
  countVerifiedByTier,
  loadTierFixtures,
  type OcdsRelease,
} from "../lib/data-pipeline";
import type { GovernmentLevel, RawContract } from "../lib/types";

const FIXTURES = path.resolve(import.meta.dirname, "..", "data", "fixtures", "verified");

function loadFixtureTier(tier: string): RawContract[] {
  return JSON.parse(fs.readFileSync(path.join(FIXTURES, `${tier}.json`), "utf-8"));
}

const cfAwardRelease: OcdsRelease = {
  ocid: "ocds-test-cf-001",
  id: "notice-uuid-001",
  date: "2024-06-01",
  tag: ["award"],
  tender: {
    title: "IT Support Services",
    description: "Council IT support contract award.",
    classification: { id: "72000000", description: "IT services" },
  },
  parties: [
    { name: "Leeds City Council", roles: ["buyer"] },
    { name: "Acme IT Ltd", roles: ["supplier"] },
  ],
  awards: [
    {
      date: "2024-06-01",
      value: { amount: 250000 },
      suppliers: [{ name: "Acme IT Ltd" }],
      documents: [
        {
          url: "https://www.contractsfinder.service.gov.uk/Notice/notice-uuid-001",
        },
      ],
    },
  ],
};

describe("parseOcdsRelease", () => {
  it("parses Contracts Finder award release", () => {
    const c = parseOcdsRelease(cfAwardRelease, {
      portalBase: "https://www.contractsfinder.service.gov.uk/",
      portalLabel: "Contracts Finder",
    });
    assert.ok(c);
    assert.equal(c!.buyer, "Leeds City Council");
    assert.equal(c!.government_level, "local");
    assert.equal(c!.is_sample, false);
    assert.match(c!.contracts_finder_url, /contractsfinder/);
  });
});

describe("supplementMissingVerifiedTiers", () => {
  it("fills Wales and NI from fixtures when live fetch lacks them", () => {
    const live: RawContract[] = [
      {
        ocid: "live-central",
        notice_id: "live-1",
        title: "Central contract",
        buyer: "HM Treasury",
        supplier: "Supplier A",
        award_date: "2024-01-01",
        value_gbp: 100000,
        cpv_code: "72000000",
        category: "IT",
        description: "Live central",
        government_level: "central",
        is_sample: false,
      },
    ];
    const fixtures = loadTierFixtures([
      ...loadFixtureTier("wales"),
      ...loadFixtureTier("northern_ireland"),
      ...loadFixtureTier("scotland"),
      ...loadFixtureTier("local"),
      ...loadFixtureTier("central"),
    ]);

    const result = supplementMissingVerifiedTiers(live, fixtures, 2);
    const counts = countVerifiedByTier(result);

    assert.ok(counts.wales >= 2, `Wales verified: ${counts.wales}`);
    assert.ok(counts.northern_ireland >= 2, `NI verified: ${counts.northern_ireland}`);
    assert.ok(counts.central >= 1);
  });
});

describe("mergeVerifiedAndDemo", () => {
  it("labels demo and verified correctly", () => {
    const verified: RawContract[] = loadFixtureTier("wales").slice(0, 1);
    const demo: RawContract[] = [
      {
        ocid: "demo-1",
        notice_id: "DEMO-0001",
        title: "Demo",
        buyer: "HM Treasury",
        supplier: "X",
        award_date: "2024-01-01",
        value_gbp: 1,
        cpv_code: "72000000",
        category: "IT",
        description: "Representative demonstration record — not an official notice.",
        government_level: "central" as GovernmentLevel,
        is_sample: true,
      },
    ];
    const merged = mergeVerifiedAndDemo(verified, demo);
    assert.equal(merged.filter((c) => !c.is_sample).length, 1);
    assert.equal(merged.filter((c) => c.is_sample).length, 1);
  });
});

describe("assertLabelling", () => {
  it("passes for correctly labelled mixed set", () => {
    const result = assertLabelling([
      {
        is_sample: false,
        notice_id: "REAL-1",
        description: "Official notice",
      },
      {
        is_sample: true,
        notice_id: "DEMO-1",
        description: "Representative demonstration record — not an official notice.",
      },
    ]);
    assert.equal(result.ok, true);
  });
});