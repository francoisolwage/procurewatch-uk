import type { Contract, GovernmentLevel } from "../lib/types";

export function makeContract(
  overrides: Partial<Contract> & { ocid: string; buyer: string; government_level: GovernmentLevel }
): Contract {
  return {
    notice_id: "TEST-1",
    title: "Test contract",
    supplier: "Test Supplier Ltd",
    award_date: "2024-06-01",
    value_gbp: 100_000,
    cpv_code: "72000000",
    category: "IT services",
    description: "Test description",
    department_tag: "Central Govt",
    contracts_finder_url: "https://example.com/notice/1",
    location: { lat: 51.5, lng: -0.12, locality: "London", nation: "England" },
    data_source: "https://www.contractsfinder.service.gov.uk/",
    is_sample: false,
    flag_duplicate_risk: false,
    flag_repeated_consultancy: false,
    flag_value_spike: false,
    red_flag_count: 0,
    red_flags: "—",
    risk_score: 0,
    is_legal: false,
    is_consultancy: false,
    ...overrides,
  };
}