import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "fs";
import path from "path";
import {
  parseOcdsRelease,
  supplementMissingVerifiedTiers,
  appendFixtureSnapshots,
  filterNationalDataset,
  isNationalRecord,
  scopeContractsForMode,
  DEFAULT_DATA_VIEW_MODE,
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

describe("appendFixtureSnapshots", () => {
  it("adds central/local fixtures when live fetch already covers those tiers", () => {
    const live: RawContract[] = [
      {
        ocid: "ocds-live-central",
        notice_id: "live-central-1",
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
        data_provenance: "live_ocds",
      },
      {
        ocid: "ocds-live-central-2",
        notice_id: "live-central-2",
        title: "Central contract 2",
        buyer: "HM Treasury",
        supplier: "Supplier B",
        award_date: "2024-02-01",
        value_gbp: 200000,
        cpv_code: "72000000",
        category: "IT",
        description: "Live central 2",
        government_level: "central",
        is_sample: false,
        data_provenance: "live_ocds",
      },
    ];
    const fixtures = {
      central: loadFixtureTier("central"),
      local: loadFixtureTier("local"),
    };
    const result = appendFixtureSnapshots(live, fixtures, 2);
    const fixtureCentral = result.filter(
      (c) => c.government_level === "central" && c.data_provenance === "portal_fixture"
    );
    const fixtureLocal = result.filter(
      (c) => c.government_level === "local" && c.data_provenance === "portal_fixture"
    );
    assert.equal(fixtureCentral.length, 2);
    assert.equal(fixtureLocal.length, 2);
  });
});

describe("filterNationalDataset", () => {
  it("includes live_ocds and portal_fixture but excludes demonstration", () => {
    const mixed = [
      { data_provenance: "live_ocds" as const, government_level: "central" as const },
      { data_provenance: "portal_fixture" as const, government_level: "wales" as const },
      { data_provenance: "demonstration" as const, government_level: "local" as const },
      { data_provenance: "user_upload" as const, government_level: "scotland" as const },
    ];
    const national = filterNationalDataset(mixed);
    assert.equal(national.length, 2);
    assert.ok(national.every(isNationalRecord));
  });
});

describe("scopeContractsForMode", () => {
  const mixed = [
    { data_provenance: "live_ocds" as const },
    { data_provenance: "portal_fixture" as const },
    { data_provenance: "demonstration" as const },
    { data_provenance: "user_upload" as const },
  ];

  it("defaults to national union", () => {
    assert.equal(DEFAULT_DATA_VIEW_MODE, "national");
    const scoped = scopeContractsForMode("national", mixed);
    assert.equal(scoped.length, 2);
    assert.ok(scoped.every(isNationalRecord));
  });

  it("scopes live, fixtures, and demonstration independently", () => {
    assert.equal(scopeContractsForMode("live", mixed).length, 1);
    assert.equal(scopeContractsForMode("fixtures", mixed).length, 1);
    assert.equal(scopeContractsForMode("demonstration", mixed).length, 1);
    assert.equal(scopeContractsForMode("upload", mixed).length, 4);
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
        ocid: "ocds-live-001",
        is_sample: false,
        notice_id: "REAL-1",
        description: "Official notice",
        data_provenance: "live_ocds",
      },
      {
        ocid: "demo-001",
        is_sample: true,
        notice_id: "DEMO-1",
        description: "Representative demonstration record — not an official notice.",
        data_provenance: "demonstration",
      },
    ]);
    assert.equal(result.ok, true);
  });
});