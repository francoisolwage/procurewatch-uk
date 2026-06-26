import fs from "fs";
import path from "path";
import Papa from "papaparse";
import { enrichContract } from "../lib/government";
import { computeRiskScores } from "../lib/risk-scoring";
import type { GovernmentLevel, RawContract } from "../lib/types";

const csvPath = path.join(process.cwd(), "data", "sample_contracts.csv");
const verifiedPath = path.join(process.cwd(), "data", "verified_contracts.json");
const outPath = path.join(process.cwd(), "public", "data", "contracts.json");

const csv = fs.readFileSync(csvPath, "utf-8");
const parsed = Papa.parse<Record<string, string>>(csv, {
  header: true,
  skipEmptyLines: true,
});

const raw: RawContract[] = parsed.data
  .map((row) =>
    enrichContract(
      {
        ocid: row.ocid,
        notice_id: row.notice_id,
        title: row.title,
        buyer: row.buyer,
        supplier: row.supplier,
        award_date: row.award_date,
        value_gbp: parseFloat(row.value_gbp),
        cpv_code: row.cpv_code,
        category: row.category,
        description: row.description,
        department_tag: row.department_tag,
        contracts_finder_url: row.contracts_finder_url || undefined,
        government_level: row.government_level as GovernmentLevel | undefined,
        location_lat: row.location_lat ? parseFloat(row.location_lat) : undefined,
        location_lng: row.location_lng ? parseFloat(row.location_lng) : undefined,
        location_locality: row.location_locality,
        data_source: row.data_source,
        is_sample: row.is_sample === "true",
      },
      { isSample: true }
    )
  )
  .filter((r) => r.title && !isNaN(r.value_gbp));

const verified: RawContract[] = JSON.parse(fs.readFileSync(verifiedPath, "utf-8")).map(
  (row: RawContract) => enrichContract(row, { isSample: false })
);

const combined = [...verified, ...raw];
const contracts = computeRiskScores(combined);

fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, JSON.stringify(contracts));

const flagged = contracts.filter((c) => c.red_flag_count > 0).length;
const verifiedCount = contracts.filter((c) => !c.is_sample).length;
console.log(`Processed ${contracts.length} contracts (${verifiedCount} verified + ${raw.length} demo) → ${outPath}`);
console.log(`Flagged: ${flagged} (${((flagged / contracts.length) * 100).toFixed(1)}%)`);