export interface RawContract {
  ocid: string;
  notice_id: string;
  title: string;
  buyer: string;
  supplier: string;
  award_date: string;
  value_gbp: number;
  cpv_code: string;
  category: string;
  description: string;
  department_tag?: string;
  contracts_finder_url?: string;
}

export interface Contract extends RawContract {
  department_tag: string;
  contracts_finder_url: string;
  flag_duplicate_risk: boolean;
  flag_repeated_consultancy: boolean;
  flag_value_spike: boolean;
  red_flag_count: number;
  red_flags: string;
  risk_score: number;
  is_legal: boolean;
  is_consultancy: boolean;
}

export type SortOption =
  | "Highest value"
  | "Newest first"
  | "Highest risk score"
  | "Most red flags";

export type PageSection =
  | "Overview"
  | "All Contracts"
  | "By Department"
  | "Legal Services / Lawfare"
  | "Red Flags Explorer"
  | "Notable Projects"
  | "Methodology & Data";

export interface Filters {
  departments: string[];
  yearMin: number;
  yearMax: number;
  valueMin: number;
  valueMax: number;
  search: string;
  flaggedOnly: boolean;
  era: string;
  sortBy: SortOption;
}

export interface GovernmentEra {
  start: string;
  end: string;
  color: string;
}

export interface NotableProject {
  name: string;
  department: string;
  original_cost_m: number;
  final_cost_m: number;
  status: string;
  explanation: string;
}

export interface RedFlagDefinition {
  label: string;
  description: string;
  weight: number;
}