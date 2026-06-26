import Papa from "papaparse";
import { enrichContract } from "./government";
import { computeRiskScores } from "./risk-scoring";
import type { Contract, GovernmentLevel, RawContract } from "./types";

const COLUMN_MAP: Record<string, string[]> = {
  ocid: ["ocid", "OCID", "release_id"],
  notice_id: ["notice_id", "notice id", "id", "Notice ID"],
  title: ["title", "contract_title", "Contract Title", "name"],
  buyer: ["buyer", "department", "Buyer", "organisation", "buyer_name"],
  supplier: ["supplier", "Supplier", "supplier_name", "awardee"],
  award_date: ["award_date", "Award Date", "date", "awardDate"],
  value_gbp: ["value_gbp", "value", "Contract Value", "amount", "value_amount"],
  cpv_code: ["cpv_code", "cpv", "CPV", "main_cpv"],
  category: ["category", "Category", "cpv_description"],
  description: ["description", "Description", "summary", "keywords"],
  government_level: ["government_level", "Government Level", "tier"],
  location_lat: ["location_lat", "lat", "latitude"],
  location_lng: ["location_lng", "lng", "longitude"],
  location_locality: ["location_locality", "locality", "location"],
  data_source: ["data_source", "source", "portal"],
  is_sample: ["is_sample", "sample"],
};

function normalizeRow(row: Record<string, string>): RawContract | null {
  const lowerMap: Record<string, string> = {};
  for (const [k, v] of Object.entries(row)) {
    lowerMap[k.toLowerCase().trim()] = v;
  }

  const mapped: Record<string, string> = {};
  for (const [target, aliases] of Object.entries(COLUMN_MAP)) {
    for (const alias of aliases) {
      const val = lowerMap[alias.toLowerCase().trim()];
      if (val !== undefined) {
        mapped[target] = val;
        break;
      }
    }
  }

  const value = parseFloat(mapped.value_gbp);
  if (!mapped.title || !mapped.buyer || !mapped.supplier || !mapped.award_date || isNaN(value)) {
    return null;
  }

  const raw: RawContract = {
    ocid: mapped.ocid ?? `unknown-${Date.now()}`,
    notice_id: mapped.notice_id ?? `N/A`,
    title: mapped.title,
    buyer: mapped.buyer,
    supplier: mapped.supplier,
    award_date: mapped.award_date,
    value_gbp: Math.abs(value),
    cpv_code: mapped.cpv_code ?? "",
    category: mapped.category ?? "Uncategorised",
    description: mapped.description ?? mapped.title,
    department_tag: mapped.department_tag,
    contracts_finder_url: mapped.contracts_finder_url,
    government_level: mapped.government_level as GovernmentLevel | undefined,
    location_lat: mapped.location_lat ? parseFloat(mapped.location_lat) : undefined,
    location_lng: mapped.location_lng ? parseFloat(mapped.location_lng) : undefined,
    location_locality: mapped.location_locality,
    data_source: mapped.data_source,
    is_sample: mapped.is_sample === "true" || mapped.is_sample === "1",
  };

  return enrichContract(raw, { isSample: raw.is_sample });
}

export function parseCSV(text: string): Contract[] {
  const parsed = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: true,
  });
  const raw = parsed.data.map(normalizeRow).filter((r): r is RawContract => r !== null);
  return computeRiskScores(raw.map((r) => ({ ...r, is_sample: false })));
}

export function parseJSON(text: string): Contract[] {
  const data = JSON.parse(text);
  const rows = Array.isArray(data) ? data : [data];
  const raw = rows
    .map((row) => normalizeRow(row as Record<string, string>))
    .filter((r): r is RawContract => r !== null);
  return computeRiskScores(raw.map((r) => ({ ...r, is_sample: false })));
}

export async function loadSampleContracts(): Promise<Contract[]> {
  const res = await fetch("/data/contracts.json");
  if (!res.ok) throw new Error("Failed to load sample data");
  return res.json();
}