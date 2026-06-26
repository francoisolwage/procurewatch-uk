import type { GovernmentEra, NotableProject, RedFlagDefinition } from "./types";

export const GOVERNMENT_ERAS: Record<string, GovernmentEra> = {
  May: { start: "2017-01-01", end: "2019-07-23", color: "#4A6FA5" },
  Johnson: { start: "2019-07-24", end: "2022-09-05", color: "#2E5E4E" },
  Truss: { start: "2022-09-06", end: "2022-10-24", color: "#8B4513" },
  Sunak: { start: "2022-10-25", end: "2024-07-04", color: "#5C4B7A" },
  Starmer: { start: "2024-07-05", end: "2026-12-31", color: "#C41E3A" },
};

export const DEPARTMENT_TAGS: Record<string, string> = {
  "Cabinet Office": "Central Govt",
  "Department for Business and Trade": "Central Govt",
  "Department for Education": "Central Govt",
  "Department for Energy Security and Net Zero": "Central Govt",
  "Department for Environment, Food and Rural Affairs": "Central Govt",
  "Department for Science, Innovation and Technology": "Central Govt",
  "Department for Transport": "Central Govt",
  "Department for Work and Pensions": "Central Govt",
  "Department of Health and Social Care": "Central Govt",
  "Foreign, Commonwealth & Development Office": "Central Govt",
  "HM Revenue & Customs": "Central Govt",
  "HM Treasury": "Central Govt",
  "Home Office": "Central Govt",
  "Ministry of Defence": "Central Govt",
  "Ministry of Justice": "Central Govt",
  "NHS England": "NHS",
  "NHS Scotland": "NHS",
  "Birmingham City Council": "Local Authority",
  "Greater Manchester Combined Authority": "Local Authority",
  "Leeds City Council": "Local Authority",
  "London Borough of Camden": "Local Authority",
  "Transport for London": "Local Authority",
  "Westminster City Council": "Local Authority",
};

export const CONSULTANCY_SUPPLIERS = [
  "Deloitte LLP", "PwC LLP", "KPMG LLP", "Ernst & Young LLP",
  "McKinsey & Company", "Boston Consulting Group", "Accenture UK Limited",
  "PA Consulting Group", "Capgemini UK plc", "IBM United Kingdom Limited",
  "Atos IT Services UK Ltd", "CGI IT UK Limited", "Serco Group plc",
  "Capita plc", "Kainos Software Limited",
];

export const LEGAL_KEYWORDS = [
  "legal advice", "solicitors", "judicial review", "litigation",
  "barrister", "counsel", "legal services", "law firm",
  "legal representation", "dispute resolution", "arbitration", "tribunal",
];

export const CONSULTANCY_KEYWORDS = [
  "consultancy", "consulting", "advisory", "strategy review",
  "transformation programme", "business case", "feasibility study",
  "implementation partner", "professional services",
];

export const RED_FLAG_DEFINITIONS: Record<string, RedFlagDefinition> = {
  duplicate_risk: {
    label: "Duplicate Risk",
    description:
      "Very similar contract title/description awarded to the same supplier within the last 24 months.",
    weight: 35,
  },
  repeated_consultancy: {
    label: "Repeated Consultancy",
    description:
      "Same department awarding multiple consultancy-style contracts in similar categories within 18 months.",
    weight: 30,
  },
  value_spike: {
    label: "Value Spike",
    description:
      "Contract value exceeds 4× the median for similar contracts in the same category and department (recent years).",
    weight: 35,
  },
};

export const NOTABLE_PROJECTS: NotableProject[] = [
  {
    name: "HS2 — Bat Tunnel Mitigation",
    department: "Department for Transport",
    original_cost_m: 35000,
    final_cost_m: 42000,
    status: "Ongoing delays",
    explanation:
      "Environmental mitigation including bat tunnels and ecological surveys added significant costs and timetable delays to Phase 1.",
  },
  {
    name: "HS2 — Euston Station Redesign",
    department: "Department for Transport",
    original_cost_m: 2800,
    final_cost_m: 4700,
    status: "Scope revised",
    explanation:
      "Repeated redesigns and scope changes at Euston have driven cost escalation beyond original estimates.",
  },
  {
    name: "NHS National Programme for IT (NPfIT)",
    department: "Department of Health and Social Care",
    original_cost_m: 2300,
    final_cost_m: 12000,
    status: "Cancelled (2011)",
    explanation:
      "Landmark IT programme widely cited as one of the largest public sector IT failures; costs ballooned before cancellation.",
  },
  {
    name: "Royal Navy Fleet Solid Support Ships",
    department: "Ministry of Defence",
    original_cost_m: 1500,
    final_cost_m: 2100,
    status: "Delayed procurement",
    explanation:
      "Repeated tender delays and industrial strategy disputes extended timelines and increased unit costs.",
  },
  {
    name: "Garden Bridge (London)",
    department: "Transport for London",
    original_cost_m: 60,
    final_cost_m: 53,
    status: "Cancelled (2017)",
    explanation:
      "Project cancelled after £53m spent on design and consultancy without construction commencing.",
  },
  {
    name: "Smart Motorways Programme",
    department: "Department for Transport",
    original_cost_m: 6000,
    final_cost_m: 9000,
    status: "Paused / reviewed",
    explanation:
      "Safety reviews and retrofitting requirements increased total programme costs beyond initial business case.",
  },
];

export const DATA_SOURCES = {
  contracts_finder: "https://www.contractsfinder.service.gov.uk/",
  ocds_bulk: "https://data.open-contracting.org/en/publication/143",
  ocds_api: "https://www.contractsfinder.service.gov.uk/api/rest/get",
  public_contracts_scotland: "https://www.publiccontractsscotland.gov.uk/",
  sell2wales: "https://www.sell2wales.gov.wales/",
  etenders_ni: "https://etendersni.gov.uk/",
};

export const DATA_SOURCE_LABELS: Record<string, string> = {
  [DATA_SOURCES.contracts_finder]: "Contracts Finder (UK central & local)",
  [DATA_SOURCES.public_contracts_scotland]: "Public Contracts Scotland",
  [DATA_SOURCES.sell2wales]: "Sell2Wales",
  [DATA_SOURCES.etenders_ni]: "eTendersNI",
  [DATA_SOURCES.ocds_bulk]: "OCDS Bulk Data (UK)",
};