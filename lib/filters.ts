import { GOVERNMENT_ERAS } from "./constants";
import type { Contract, Filters } from "./types";

export function getGovernmentEra(dateStr: string): string {
  const date = new Date(dateStr);
  for (const [era, cfg] of Object.entries(GOVERNMENT_ERAS)) {
    if (date >= new Date(cfg.start) && date <= new Date(cfg.end)) return era;
  }
  return "Other";
}

export function applyFilters(contracts: Contract[], filters: Filters): Contract[] {
  let result = [...contracts];

  if (filters.departments.length) {
    result = result.filter((c) => filters.departments.includes(c.buyer));
  }

  result = result.filter((c) => {
    const year = new Date(c.award_date).getFullYear();
    return year >= filters.yearMin && year <= filters.yearMax;
  });

  result = result.filter(
    (c) => c.value_gbp >= filters.valueMin && c.value_gbp <= filters.valueMax
  );

  if (filters.search) {
    const q = filters.search.toLowerCase();
    result = result.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        c.supplier.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q)
    );
  }

  if (filters.flaggedOnly) {
    result = result.filter((c) => c.red_flag_count > 0);
  }

  if (filters.era !== "All") {
    result = result.filter((c) => getGovernmentEra(c.award_date) === filters.era);
  }

  const sortFns: Record<Filters["sortBy"], (a: Contract, b: Contract) => number> = {
    "Highest value": (a, b) => b.value_gbp - a.value_gbp,
    "Newest first": (a, b) =>
      new Date(b.award_date).getTime() - new Date(a.award_date).getTime(),
    "Highest risk score": (a, b) => b.risk_score - a.risk_score,
    "Most red flags": (a, b) =>
      b.red_flag_count - a.red_flag_count || b.risk_score - a.risk_score,
  };

  result.sort(sortFns[filters.sortBy]);
  return result;
}

export function contractsToCSV(contracts: Contract[]): string {
  if (!contracts.length) return "";
  const headers = Object.keys(contracts[0]);
  const rows = contracts.map((c) =>
    headers
      .map((h) => {
        const val = String((c as unknown as Record<string, unknown>)[h] ?? "");
        return val.includes(",") ? `"${val.replace(/"/g, '""')}"` : val;
      })
      .join(",")
  );
  return [headers.join(","), ...rows].join("\n");
}