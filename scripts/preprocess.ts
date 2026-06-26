import fs from "fs";
import path from "path";
import Papa from "papaparse";
import { computeRiskScores } from "../lib/risk-scoring";
import type { RawContract } from "../lib/types";

const csvPath = path.join(process.cwd(), "data", "sample_contracts.csv");
const outPath = path.join(process.cwd(), "public", "data", "contracts.json");

const csv = fs.readFileSync(csvPath, "utf-8");
const parsed = Papa.parse<Record<string, string>>(csv, {
  header: true,
  skipEmptyLines: true,
});

const raw: RawContract[] = parsed.data
  .map((row) => ({
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
    contracts_finder_url: row.contracts_finder_url,
  }))
  .filter((r) => r.title && !isNaN(r.value_gbp));

const contracts = computeRiskScores(raw);

fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, JSON.stringify(contracts));

const flagged = contracts.filter((c) => c.red_flag_count > 0).length;
console.log(`Processed ${contracts.length} contracts → ${outPath}`);
console.log(`Flagged: ${flagged} (${((flagged / contracts.length) * 100).toFixed(1)}%)`);