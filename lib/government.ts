import { DATA_SOURCES } from "./constants";
import type { Contract, ContractLocation, GovernmentLevel, RawContract } from "./types";

export const GOVERNMENT_LEVEL_LABELS: Record<GovernmentLevel, string> = {
  central: "UK Central Government",
  local: "Local Authority (England)",
  scotland: "Devolved — Scotland",
  wales: "Devolved — Wales",
  northern_ireland: "Devolved — Northern Ireland",
};

export const GOVERNMENT_LEVEL_COLORS: Record<GovernmentLevel, string> = {
  central: "#1e40af",
  local: "#0f766e",
  scotland: "#0369a1",
  wales: "#b45309",
  northern_ireland: "#7c3aed",
};

interface BuyerProfile {
  level: GovernmentLevel;
  lat: number;
  lng: number;
  locality: string;
  nation: string;
  data_source: string;
  department_tag: string;
}

/** Buyer HQ / administrative location — not claimed as precise project site. */
export const BUYER_PROFILES: Record<string, BuyerProfile> = {
  "Cabinet Office": { level: "central", lat: 51.5034, lng: -0.1276, locality: "London", nation: "England", data_source: DATA_SOURCES.contracts_finder, department_tag: "Central Govt" },
  "Department for Business and Trade": { level: "central", lat: 51.5034, lng: -0.1276, locality: "London", nation: "England", data_source: DATA_SOURCES.contracts_finder, department_tag: "Central Govt" },
  "Department for Education": { level: "central", lat: 51.5034, lng: -0.1276, locality: "London", nation: "England", data_source: DATA_SOURCES.contracts_finder, department_tag: "Central Govt" },
  "Department for Energy Security and Net Zero": { level: "central", lat: 51.5034, lng: -0.1276, locality: "London", nation: "England", data_source: DATA_SOURCES.contracts_finder, department_tag: "Central Govt" },
  "Department for Environment, Food and Rural Affairs": { level: "central", lat: 51.5034, lng: -0.1276, locality: "London", nation: "England", data_source: DATA_SOURCES.contracts_finder, department_tag: "Central Govt" },
  "Department for Science, Innovation and Technology": { level: "central", lat: 51.5034, lng: -0.1276, locality: "London", nation: "England", data_source: DATA_SOURCES.contracts_finder, department_tag: "Central Govt" },
  "Department for Transport": { level: "central", lat: 51.5034, lng: -0.1276, locality: "London", nation: "England", data_source: DATA_SOURCES.contracts_finder, department_tag: "Central Govt" },
  "Department for Work and Pensions": { level: "central", lat: 51.5034, lng: -0.1276, locality: "London", nation: "England", data_source: DATA_SOURCES.contracts_finder, department_tag: "Central Govt" },
  "Department of Health and Social Care": { level: "central", lat: 51.5034, lng: -0.1276, locality: "London", nation: "England", data_source: DATA_SOURCES.contracts_finder, department_tag: "Central Govt" },
  "Foreign, Commonwealth & Development Office": { level: "central", lat: 51.5034, lng: -0.1276, locality: "London", nation: "England", data_source: DATA_SOURCES.contracts_finder, department_tag: "Central Govt" },
  "HM Revenue & Customs": { level: "central", lat: 51.5034, lng: -0.1276, locality: "London", nation: "England", data_source: DATA_SOURCES.contracts_finder, department_tag: "Central Govt" },
  "HM Treasury": { level: "central", lat: 51.5034, lng: -0.1276, locality: "London", nation: "England", data_source: DATA_SOURCES.contracts_finder, department_tag: "Central Govt" },
  "Home Office": { level: "central", lat: 51.5034, lng: -0.1276, locality: "London", nation: "England", data_source: DATA_SOURCES.contracts_finder, department_tag: "Central Govt" },
  "Ministry of Defence": { level: "central", lat: 51.5034, lng: -0.1276, locality: "London", nation: "England", data_source: DATA_SOURCES.contracts_finder, department_tag: "Central Govt" },
  "Ministry of Justice": { level: "central", lat: 51.5034, lng: -0.1276, locality: "London", nation: "England", data_source: DATA_SOURCES.contracts_finder, department_tag: "Central Govt" },
  "NHS England": { level: "central", lat: 51.5034, lng: -0.1276, locality: "London", nation: "England", data_source: DATA_SOURCES.contracts_finder, department_tag: "NHS" },
  "Birmingham City Council": { level: "local", lat: 52.4862, lng: -1.8904, locality: "Birmingham", nation: "England", data_source: DATA_SOURCES.contracts_finder, department_tag: "Local Authority" },
  "Greater Manchester Combined Authority": { level: "local", lat: 53.4808, lng: -2.2426, locality: "Manchester", nation: "England", data_source: DATA_SOURCES.contracts_finder, department_tag: "Local Authority" },
  "Leeds City Council": { level: "local", lat: 53.8008, lng: -1.5491, locality: "Leeds", nation: "England", data_source: DATA_SOURCES.contracts_finder, department_tag: "Local Authority" },
  "London Borough of Camden": { level: "local", lat: 51.529, lng: -0.1255, locality: "Camden", nation: "England", data_source: DATA_SOURCES.contracts_finder, department_tag: "Local Authority" },
  "Transport for London": { level: "local", lat: 51.5074, lng: -0.1278, locality: "London", nation: "England", data_source: DATA_SOURCES.contracts_finder, department_tag: "Local Authority" },
  "Westminster City Council": { level: "local", lat: 51.4975, lng: -0.1357, locality: "Westminster", nation: "England", data_source: DATA_SOURCES.contracts_finder, department_tag: "Local Authority" },
  "Scottish Government": { level: "scotland", lat: 55.9533, lng: -3.1883, locality: "Edinburgh", nation: "Scotland", data_source: DATA_SOURCES.public_contracts_scotland, department_tag: "Devolved Govt" },
  "NHS Scotland": { level: "scotland", lat: 55.8642, lng: -4.2518, locality: "Glasgow", nation: "Scotland", data_source: DATA_SOURCES.public_contracts_scotland, department_tag: "NHS Scotland" },
  "City of Edinburgh Council": { level: "scotland", lat: 55.9533, lng: -3.1883, locality: "Edinburgh", nation: "Scotland", data_source: DATA_SOURCES.public_contracts_scotland, department_tag: "Local Authority" },
  "Glasgow City Council": { level: "scotland", lat: 55.8642, lng: -4.2518, locality: "Glasgow", nation: "Scotland", data_source: DATA_SOURCES.public_contracts_scotland, department_tag: "Local Authority" },
  "Highland Council": { level: "scotland", lat: 57.4778, lng: -4.2247, locality: "Inverness", nation: "Scotland", data_source: DATA_SOURCES.public_contracts_scotland, department_tag: "Local Authority" },
  "Welsh Government": { level: "wales", lat: 51.4816, lng: -3.1791, locality: "Cardiff", nation: "Wales", data_source: DATA_SOURCES.sell2wales, department_tag: "Devolved Govt" },
  "NHS Wales": { level: "wales", lat: 51.4816, lng: -3.1791, locality: "Cardiff", nation: "Wales", data_source: DATA_SOURCES.sell2wales, department_tag: "NHS Wales" },
  "Cardiff Council": { level: "wales", lat: 51.4816, lng: -3.1791, locality: "Cardiff", nation: "Wales", data_source: DATA_SOURCES.sell2wales, department_tag: "Local Authority" },
  "Swansea Council": { level: "wales", lat: 51.6214, lng: -3.9436, locality: "Swansea", nation: "Wales", data_source: DATA_SOURCES.sell2wales, department_tag: "Local Authority" },
  "Northern Ireland Executive": { level: "northern_ireland", lat: 54.5973, lng: -5.9301, locality: "Belfast", nation: "Northern Ireland", data_source: DATA_SOURCES.etenders_ni, department_tag: "Devolved Govt" },
  "Belfast City Council": { level: "northern_ireland", lat: 54.5973, lng: -5.9301, locality: "Belfast", nation: "Northern Ireland", data_source: DATA_SOURCES.etenders_ni, department_tag: "Local Authority" },
  "Derry City and Strabane District Council": { level: "northern_ireland", lat: 54.9966, lng: -7.3086, locality: "Derry", nation: "Northern Ireland", data_source: DATA_SOURCES.etenders_ni, department_tag: "Local Authority" },
  "Health and Social Care Northern Ireland": { level: "northern_ireland", lat: 54.5973, lng: -5.9301, locality: "Belfast", nation: "Northern Ireland", data_source: DATA_SOURCES.etenders_ni, department_tag: "NHS NI" },
};

const SCOTLAND_KEYWORDS = ["scotland", "scottish", "edinburgh", "glasgow", "highland council"];
const WALES_KEYWORDS = ["welsh", "wales", "cardiff", "swansea", "gwynedd"];
const NI_KEYWORDS = ["northern ireland", "belfast", "derry", "strabane", "ulster"];
const LOCAL_KEYWORDS = ["council", "borough", "combined authority", "city of", "county"];

export function deriveGovernmentLevel(buyer: string): GovernmentLevel {
  const profile = BUYER_PROFILES[buyer];
  if (profile) return profile.level;

  const lower = buyer.toLowerCase();
  if (SCOTLAND_KEYWORDS.some((k) => lower.includes(k))) return "scotland";
  if (WALES_KEYWORDS.some((k) => lower.includes(k))) return "wales";
  if (NI_KEYWORDS.some((k) => lower.includes(k))) return "northern_ireland";
  if (LOCAL_KEYWORDS.some((k) => lower.includes(k))) return "local";
  return "central";
}

export function deriveNoticeUrl(
  row: RawContract,
  level: GovernmentLevel
): string {
  if (row.contracts_finder_url?.startsWith("http")) {
    return row.contracts_finder_url;
  }
  const noticeId = row.notice_id ?? "";
  if (
    (level === "central" || level === "local") &&
    noticeId &&
    !noticeId.startsWith("DEMO-") &&
    !noticeId.startsWith("N/A")
  ) {
    return `https://www.contractsfinder.service.gov.uk/Notice/${noticeId}`;
  }
  return deriveDataSource(level);
}

export function deriveDataSource(level: GovernmentLevel): string {
  switch (level) {
    case "scotland":
      return DATA_SOURCES.public_contracts_scotland;
    case "wales":
      return DATA_SOURCES.sell2wales;
    case "northern_ireland":
      return DATA_SOURCES.etenders_ni;
    default:
      return DATA_SOURCES.contracts_finder;
  }
}

export function deriveLocation(
  buyer: string,
  level: GovernmentLevel,
  overrides?: Partial<ContractLocation>
): ContractLocation {
  if (
    overrides?.lat !== undefined &&
    overrides?.lng !== undefined &&
    overrides?.locality
  ) {
    return {
      lat: overrides.lat,
      lng: overrides.lng,
      locality: overrides.locality,
      nation: overrides.nation ?? profileNation(level),
    };
  }

  const profile = BUYER_PROFILES[buyer];
  if (profile) {
    return {
      lat: profile.lat,
      lng: profile.lng,
      locality: profile.locality,
      nation: profile.nation,
    };
  }

  const defaults: Record<GovernmentLevel, ContractLocation> = {
    central: { lat: 51.5074, lng: -0.1278, locality: "London", nation: "England" },
    local: { lat: 52.4862, lng: -1.8904, locality: "Birmingham", nation: "England" },
    scotland: { lat: 55.9533, lng: -3.1883, locality: "Edinburgh", nation: "Scotland" },
    wales: { lat: 51.4816, lng: -3.1791, locality: "Cardiff", nation: "Wales" },
    northern_ireland: { lat: 54.5973, lng: -5.9301, locality: "Belfast", nation: "Northern Ireland" },
  };
  return defaults[level];
}

function profileNation(level: GovernmentLevel): string {
  const map: Record<GovernmentLevel, string> = {
    central: "England",
    local: "England",
    scotland: "Scotland",
    wales: "Wales",
    northern_ireland: "Northern Ireland",
  };
  return map[level];
}

export function enrichContract(
  row: RawContract,
  options?: { isSample?: boolean }
): RawContract {
  const level = row.government_level ?? deriveGovernmentLevel(row.buyer);
  const profile = BUYER_PROFILES[row.buyer];
  const location = deriveLocation(row.buyer, level, {
    lat: row.location_lat,
    lng: row.location_lng,
    locality: row.location_locality,
    nation: profile?.nation,
  });

  return {
    ...row,
    government_level: level,
    location_lat: location.lat,
    location_lng: location.lng,
    location_locality: location.locality,
    department_tag: row.department_tag ?? profile?.department_tag ?? "Other",
    data_source: row.data_source ?? profile?.data_source ?? deriveDataSource(level),
    is_sample: options?.isSample ?? row.is_sample ?? false,
    contracts_finder_url:
      row.contracts_finder_url ??
      (level === "central" || level === "local"
        ? `https://www.contractsfinder.service.gov.uk/Notice/${row.notice_id}`
        : undefined),
  };
}

export function filterByGovernmentLevel(
  contracts: Contract[],
  levels: GovernmentLevel[]
): Contract[] {
  if (!levels.length) return contracts;
  const set = new Set(levels);
  return contracts.filter((c) => set.has(c.government_level));
}

export function countByGovernmentLevel(
  contracts: Contract[]
): Record<GovernmentLevel, number> {
  const counts: Record<GovernmentLevel, number> = {
    central: 0,
    local: 0,
    scotland: 0,
    wales: 0,
    northern_ireland: 0,
  };
  for (const c of contracts) {
    counts[c.government_level]++;
  }
  return counts;
}

export function contractsWithLocation(contracts: Contract[]): Contract[] {
  return contracts.filter(
    (c) =>
      Number.isFinite(c.location.lat) &&
      Number.isFinite(c.location.lng) &&
      c.location.locality.length > 0
  );
}