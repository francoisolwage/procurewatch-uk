/**
 * Thin I/O wrapper: optional live OCDS fetch + fixture supplement → verified_contracts.json
 */
import fs from "fs";
import path from "path";
import {
  parseOcdsRelease,
  supplementMissingVerifiedTiers,
  dedupeByOcid,
  type OcdsRelease,
} from "../lib/data-pipeline";
import type { GovernmentLevel, RawContract } from "../lib/types";

const OUT = path.join(process.cwd(), "data", "verified_contracts.json");
const FIXTURE_DIR = path.join(process.cwd(), "data", "fixtures", "verified");

function loadAllFixtures(): Partial<Record<GovernmentLevel, RawContract[]>> {
  const tiers: GovernmentLevel[] = [
    "central",
    "local",
    "scotland",
    "wales",
    "northern_ireland",
  ];
  const fixtures: Partial<Record<GovernmentLevel, RawContract[]>> = {};
  for (const tier of tiers) {
    const file = path.join(FIXTURE_DIR, `${tier}.json`);
    if (fs.existsSync(file)) {
      fixtures[tier] = JSON.parse(fs.readFileSync(file, "utf-8"));
    }
  }
  return fixtures;
}

async function fetchContractsFinder(limit = 20): Promise<RawContract[]> {
  const url =
    "https://www.contractsfinder.service.gov.uk/Published/Notices/OCDS/Search" +
    `?limit=${limit}&publishedFrom=2023-01-01`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Contracts Finder: HTTP ${res.status}`);
  const data = (await res.json()) as { releases?: OcdsRelease[] };
  return (data.releases ?? [])
    .map((r) =>
      parseOcdsRelease(r, {
        portalBase: "https://www.contractsfinder.service.gov.uk/",
        portalLabel: "Contracts Finder",
      })
    )
    .filter((c): c is RawContract => c !== null);
}

async function fetchPortalAwards(
  apiUrl: string,
  portalBase: string,
  portalLabel: string,
  level: GovernmentLevel,
  limit = 8
): Promise<RawContract[]> {
  const res = await fetch(`${apiUrl}?limit=${limit}&noticeType=3`, {
    headers: { Accept: "application/json" },
  });
  if (!res.ok) return [];
  const data = (await res.json()) as { releases?: OcdsRelease[] };
  return (data.releases ?? [])
    .filter((r) => r.tag?.includes("award"))
    .map((r) =>
      parseOcdsRelease(r, {
        portalBase,
        portalLabel,
        governmentLevel: level,
      })
    )
    .filter((c): c is RawContract => c !== null);
}

async function tryLiveFetch(): Promise<RawContract[]> {
  const chunks: RawContract[][] = [];
  try {
    chunks.push(await fetchContractsFinder(16));
  } catch (e) {
    console.warn("Contracts Finder fetch failed:", (e as Error).message);
  }
  try {
    chunks.push(
      await fetchPortalAwards(
        "https://api.publiccontractsscotland.gov.uk/v1/Notices",
        "https://www.publiccontractsscotland.gov.uk/",
        "Public Contracts Scotland",
        "scotland",
        6
      )
    );
  } catch (e) {
    console.warn("PCS fetch failed:", (e as Error).message);
  }
  try {
    chunks.push(
      await fetchPortalAwards(
        "https://api.sell2wales.gov.wales/v1/Notices",
        "https://www.sell2wales.gov.wales/",
        "Sell2Wales",
        "wales",
        6
      )
    );
  } catch (e) {
    console.warn("Sell2Wales fetch failed:", (e as Error).message);
  }
  return dedupeByOcid(chunks.flat());
}

async function main() {
  const live = await tryLiveFetch();
  const fixtures = loadAllFixtures();
  const verified = supplementMissingVerifiedTiers(live, fixtures, 2);

  const tierCounts = verified.reduce(
    (acc, c) => {
      acc[c.government_level] = (acc[c.government_level] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  console.log(
    `Verified set: ${verified.length} records (live=${live.length}, fixture supplement applied)`
  );
  console.log("Verified tier counts:", tierCounts);

  fs.writeFileSync(OUT, JSON.stringify(verified, null, 2));
  console.log(`Wrote → ${OUT}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});