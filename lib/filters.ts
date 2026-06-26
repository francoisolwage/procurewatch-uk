import { GOVERNMENT_ERAS } from "./constants";
import { filterByGovernmentLevel } from "./government";
import type { Contract, Filters } from "./types";

export function getGovernmentEra(dateStr: string): string {
  const date = new Date(dateStr);
  for (const [era, cfg] of Object.entries(GOVERNMENT_ERAS)) {
    if (date >= new Date(cfg.start) && date <= new Date(cfg.end)) return era;
  }
  return "Other";
}

/** Clamp inverted year/value ranges so filters always produce valid bounds. */
export function normalizeFilters(filters: Filters): Filters {
  const yearMin = Math.min(filters.yearMin, filters.yearMax);
  const yearMax = Math.max(filters.yearMin, filters.yearMax);
  const valueMin = Math.min(filters.valueMin, filters.valueMax);
  const valueMax = Math.max(filters.valueMin, filters.valueMax);
  return { ...filters, yearMin, yearMax, valueMin, valueMax };
}

export function getRangeWarning(filters: Filters): string | null {
  if (filters.yearMin > filters.yearMax) {
    return "Year range was inverted — showing results using swapped bounds.";
  }
  if (filters.valueMin > filters.valueMax) {
    return "Value range was inverted — showing results using swapped bounds.";
  }
  return null;
}

export function applyFilters(contracts: Contract[], filters: Filters): Contract[] {
  const f = normalizeFilters(filters);
  let result = [...contracts];

  if (f.departments.length) {
    result = result.filter((c) => f.departments.includes(c.buyer));
  }

  result = filterByGovernmentLevel(result, f.governmentLevels);

  result = result.filter((c) => {
    const year = new Date(c.award_date).getFullYear();
    return year >= f.yearMin && year <= f.yearMax;
  });

  result = result.filter(
    (c) => c.value_gbp >= f.valueMin && c.value_gbp <= f.valueMax
  );

  if (f.search) {
    const q = f.search.toLowerCase();
    result = result.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        c.supplier.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q)
    );
  }

  if (f.flaggedOnly) {
    result = result.filter((c) => c.red_flag_count > 0);
  }

  if (f.era !== "All") {
    result = result.filter((c) => getGovernmentEra(c.award_date) === f.era);
  }

  const sortFns: Record<Filters["sortBy"], (a: Contract, b: Contract) => number> = {
    "Highest value": (a, b) => b.value_gbp - a.value_gbp,
    "Newest first": (a, b) =>
      new Date(b.award_date).getTime() - new Date(a.award_date).getTime(),
    "Highest risk score": (a, b) => b.risk_score - a.risk_score,
    "Most red flags": (a, b) =>
      b.red_flag_count - a.red_flag_count || b.risk_score - a.risk_score,
  };

  result.sort(sortFns[f.sortBy]);
  return result;
}

const CSV_COLUMNS: (keyof Contract | "location_lat" | "location_lng" | "location_locality" | "location_nation")[] = [
  "ocid",
  "notice_id",
  "title",
  "buyer",
  "supplier",
  "award_date",
  "value_gbp",
  "cpv_code",
  "category",
  "description",
  "government_level",
  "department_tag",
  "location_lat",
  "location_lng",
  "location_locality",
  "location_nation",
  "data_source",
  "is_sample",
  "risk_score",
  "red_flag_count",
  "red_flags",
  "contracts_finder_url",
];

function csvCell(value: unknown): string {
  if (value === null || value === undefined) return "";
  const s = String(value);
  return s.includes(",") || s.includes('"') || s.includes("\n")
    ? `"${s.replace(/"/g, '""')}"`
    : s;
}

export function contractsToCSV(contracts: Contract[]): string {
  if (!contracts.length) return "";
  const rows = contracts.map((c) =>
    CSV_COLUMNS.map((col) => {
      if (col === "location_lat") return csvCell(c.location.lat);
      if (col === "location_lng") return csvCell(c.location.lng);
      if (col === "location_locality") return csvCell(c.location.locality);
      if (col === "location_nation") return csvCell(c.location.nation);
      return csvCell(c[col as keyof Contract]);
    }).join(",")
  );
  return [CSV_COLUMNS.join(","), ...rows].join("\n");
}