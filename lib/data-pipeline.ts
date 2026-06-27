import type { Contract, GovernmentLevel, RawContract } from "./types";
import { deriveGovernmentLevel, deriveDataSource } from "./government";

/** How the record entered the dataset — mirrors runtime contracts.json field. */
export type DataProvenance =
  | "live_ocds"
  | "portal_fixture"
  | "demonstration"
  | "user_upload";

export type DataViewMode =
  | "national"
  | "live"
  | "fixtures"
  | "demonstration"
  | "upload";

export const DEFAULT_DATA_VIEW_MODE: DataViewMode = "national";

/** Minimal shape for provenance-aware scoping (Contract may carry this at runtime). */
export type ProvenanceRecord = { data_provenance?: DataProvenance };

/** RawContract plus runtime provenance field (present in contracts.json). */
export type PipelineRawContract = RawContract & ProvenanceRecord;

export const ALL_TIERS: GovernmentLevel[] = [
  "central",
  "local",
  "scotland",
  "wales",
  "northern_ireland",
];

export interface OcdsRelease {
  ocid: string;
  id: string;
  date?: string;
  tag?: string[];
  tender?: {
    title?: string;
    description?: string;
    classification?: { id?: string; description?: string };
    value?: { amount?: number };
    documents?: Array<{ url?: string }>;
  };
  parties?: Array<{
    name?: string;
    roles?: string[];
  }>;
  buyer?: { name?: string };
  awards?: Array<{
    date?: string;
    title?: string;
    value?: { amount?: number };
    suppliers?: Array<{ name?: string }>;
    documents?: Array<{ url?: string }>;
  }>;
  contracts?: Array<{ value?: { amount?: number } }>;
}

function partyName(release: OcdsRelease, role: string): string {
  const p = release.parties?.find((x) => x.roles?.includes(role));
  return p?.name ?? release.buyer?.name ?? "";
}

function awardNoticeUrl(release: OcdsRelease): string | undefined {
  for (const award of release.awards ?? []) {
    for (const doc of award.documents ?? []) {
      if (doc.url?.startsWith("http")) return doc.url;
    }
  }
  return release.tender?.documents?.find((d) => d.url?.startsWith("http"))?.url;
}

export interface ParseOcdsOptions {
  portalBase: string;
  portalLabel: string;
  governmentLevel?: GovernmentLevel;
}

/** Parse one OCDS release into a verified RawContract (null if insufficient fields). */
export function parseOcdsRelease(
  release: OcdsRelease,
  options: ParseOcdsOptions
): PipelineRawContract | null {
  const award = release.awards?.[0];
  const buyer = partyName(release, "buyer");
  const supplier =
    award?.suppliers?.[0]?.name ?? partyName(release, "supplier");
  const title =
    release.tender?.title ?? award?.title ?? "";
  const amount =
    award?.value?.amount ??
    release.contracts?.[0]?.value?.amount ??
    release.tender?.value?.amount ??
    0;
  const awardDate = (award?.date ?? release.date ?? "").slice(0, 10);

  if (!buyer || !title || amount <= 0 || !awardDate) return null;

  const level =
    options.governmentLevel ?? deriveGovernmentLevel(buyer);
  const url = awardNoticeUrl(release);

  return {
    ocid: release.ocid,
    notice_id: release.id,
    title,
    buyer,
    supplier: supplier || "Awarded supplier (see notice)",
    award_date: awardDate,
    value_gbp: Math.round(amount),
    cpv_code: release.tender?.classification?.id ?? "",
    category: release.tender?.classification?.description ?? "Uncategorised",
    description: `OCDS record from ${options.portalLabel}. ${(release.tender?.description ?? "").slice(0, 180)}`,
    government_level: level,
    data_source: deriveDataSource(level),
    contracts_finder_url: url ?? options.portalBase,
    is_sample: false,
    data_provenance: "live_ocds",
  };
}

export function dedupeByOcid<T extends { ocid: string }>(records: T[]): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const r of records) {
    if (seen.has(r.ocid)) continue;
    seen.add(r.ocid);
    out.push(r);
  }
  return out;
}

/** Ensure each tier has at least minPerTier verified records using fixture fallbacks. */
export function supplementMissingVerifiedTiers(
  live: PipelineRawContract[],
  fixtures: Partial<Record<GovernmentLevel, PipelineRawContract[]>>,
  minPerTier = 2
): PipelineRawContract[] {
  const byTier = new Map<GovernmentLevel, PipelineRawContract[]>();
  for (const t of ALL_TIERS) byTier.set(t, []);

  for (const r of dedupeByOcid(live)) {
    if (r.is_sample || !r.government_level) continue;
    byTier.get(r.government_level)?.push(r);
  }

  for (const tier of ALL_TIERS) {
    const current = byTier.get(tier) ?? [];
    if (current.length >= minPerTier) continue;
    const needed = minPerTier - current.length;
    const fallback = (fixtures[tier] ?? []).filter((f) => !f.is_sample);
    for (const f of fallback.slice(0, needed)) {
      if (!current.some((c) => c.ocid === f.ocid)) {
        current.push({
          ...f,
          government_level: tier,
          is_sample: false,
          data_provenance: "portal_fixture",
        });
      }
    }
    byTier.set(tier, current);
  }

  return dedupeByOcid(ALL_TIERS.flatMap((t) => byTier.get(t) ?? []));
}

/** Add checked-in portal fixtures per tier for the explicit fixture data view. */
export function appendFixtureSnapshots(
  verified: PipelineRawContract[],
  fixtures: Partial<Record<GovernmentLevel, PipelineRawContract[]>>,
  perTier = 2
): PipelineRawContract[] {
  const existingOcids = new Set(verified.map((r) => r.ocid));
  const extras: PipelineRawContract[] = [];

  for (const tier of ALL_TIERS) {
    for (const f of (fixtures[tier] ?? []).slice(0, perTier)) {
      if (existingOcids.has(f.ocid)) continue;
      extras.push({
        ...f,
        government_level: tier,
        is_sample: false,
        data_provenance: "portal_fixture",
      });
      existingOcids.add(f.ocid);
    }
  }

  return dedupeByOcid([...verified, ...extras]);
}

export function balanceVerifiedByTier(
  records: PipelineRawContract[],
  perTier: number
): PipelineRawContract[] {
  const byTier = new Map<GovernmentLevel, RawContract[]>();
  for (const t of ALL_TIERS) byTier.set(t, []);
  for (const r of records) {
    if (!r.government_level) continue;
    byTier.get(r.government_level)?.push(r);
  }
  return ALL_TIERS.flatMap((t) => (byTier.get(t) ?? []).slice(0, perTier));
}

export function mergeVerifiedAndDemo(
  verified: PipelineRawContract[],
  demo: PipelineRawContract[]
): PipelineRawContract[] {
  const v = verified.map((r) => ({
    ...r,
    is_sample: false,
    data_provenance: r.data_provenance ?? "live_ocds",
  }));
  const d = demo.map((r) => ({
    ...r,
    is_sample: true,
    data_provenance: "demonstration" as DataProvenance,
  }));
  return dedupeByOcid([...v, ...d]);
}

export function countVerifiedByTier(
  contracts: Array<Pick<Contract, "government_level" | "is_sample">>
): Record<GovernmentLevel, number> {
  const counts: Record<GovernmentLevel, number> = {
    central: 0,
    local: 0,
    scotland: 0,
    wales: 0,
    northern_ireland: 0,
  };
  for (const c of contracts) {
    if (!c.is_sample) counts[c.government_level]++;
  }
  return counts;
}

export interface LabellingResult {
  ok: boolean;
  verifiedCount: number;
  demoCount: number;
  errors: string[];
}

export function assertLabelling(
  contracts: Array<
    Pick<Contract, "is_sample" | "notice_id" | "description" | "ocid"> & ProvenanceRecord
  >
): LabellingResult {
  const errors: string[] = [];
  let verifiedCount = 0;
  let demoCount = 0;

  for (const c of contracts) {
    if (c.is_sample || c.data_provenance === "demonstration") {
      demoCount++;
      if (!c.notice_id.startsWith("DEMO-")) {
        errors.push(`Demo record ${c.notice_id} missing DEMO- prefix`);
      }
      if (!/demonstration|not an official/i.test(c.description)) {
        errors.push(`Demo record ${c.notice_id} missing demonstration disclaimer`);
      }
      if (c.data_provenance !== "demonstration") {
        errors.push(`Demo record ${c.notice_id} missing data_provenance=demonstration`);
      }
    } else if (c.data_provenance === "portal_fixture") {
      verifiedCount++;
      if (!c.ocid.startsWith("ocds-fixture-")) {
        errors.push(`Fixture ${c.ocid} should use ocds-fixture- prefix`);
      }
      if (!/fixture|snapshot/i.test(c.description)) {
        errors.push(`Fixture ${c.ocid} description must mention fixture/snapshot`);
      }
    } else if (c.data_provenance === "live_ocds") {
      verifiedCount++;
      if (c.ocid.startsWith("ocds-fixture-")) {
        errors.push(`Live record ${c.ocid} must not use fixture ocid prefix`);
      }
      if (c.notice_id.startsWith("DEMO-")) {
        errors.push(`Live record ${c.notice_id} has DEMO- prefix`);
      }
    } else {
      errors.push(`Record ${c.ocid} has unknown provenance: ${c.data_provenance}`);
    }
  }

  return { ok: errors.length === 0, verifiedCount, demoCount, errors };
}

function provenanceOf(record: object): DataProvenance | undefined {
  return (record as ProvenanceRecord).data_provenance;
}

/** Authoritative national record: live OCDS pull or checked-in portal fixture. */
export function isNationalRecord(contract: object): boolean {
  const p = provenanceOf(contract);
  return p === "live_ocds" || p === "portal_fixture";
}

/** Default view scope: union of live_ocds + portal_fixture provenances. */
export function filterNationalDataset<T extends object>(contracts: T[]): T[] {
  return contracts.filter(isNationalRecord);
}

/** Scope contracts for the active data view mode (single entry point for UI + tests). */
export function scopeContractsForMode<T extends object>(
  mode: DataViewMode,
  contracts: T[]
): T[] {
  switch (mode) {
    case "upload":
      return contracts;
    case "demonstration":
      return contracts.filter((c) => provenanceOf(c) === "demonstration");
    case "fixtures":
      return contracts.filter((c) => provenanceOf(c) === "portal_fixture");
    case "live":
      return contracts.filter((c) => provenanceOf(c) === "live_ocds");
    case "national":
    default:
      return filterNationalDataset(contracts);
  }
}

export function countNationalByTier(
  contracts: Array<Pick<Contract, "government_level"> & ProvenanceRecord>
): Record<GovernmentLevel, number> {
  const counts: Record<GovernmentLevel, number> = {
    central: 0,
    local: 0,
    scotland: 0,
    wales: 0,
    northern_ireland: 0,
  };
  for (const c of contracts) {
    if (isNationalRecord(c)) counts[c.government_level]++;
  }
  return counts;
}

export function countByProvenance(contracts: object[]): Record<DataProvenance, number> {
  return {
    live_ocds: contracts.filter((c) => provenanceOf(c) === "live_ocds").length,
    portal_fixture: contracts.filter((c) => provenanceOf(c) === "portal_fixture").length,
    demonstration: contracts.filter((c) => provenanceOf(c) === "demonstration").length,
    user_upload: contracts.filter((c) => provenanceOf(c) === "user_upload").length,
  };
}

export function countLiveByTier(
  contracts: Array<Pick<Contract, "government_level"> & ProvenanceRecord>
): Record<GovernmentLevel, number> {
  const counts: Record<GovernmentLevel, number> = {
    central: 0,
    local: 0,
    scotland: 0,
    wales: 0,
    northern_ireland: 0,
  };
  for (const c of contracts) {
    if (provenanceOf(c) === "live_ocds") counts[c.government_level]++;
  }
  return counts;
}

export function countFixtureByTier(
  contracts: Array<Pick<Contract, "government_level"> & ProvenanceRecord>
): Record<GovernmentLevel, number> {
  const counts: Record<GovernmentLevel, number> = {
    central: 0,
    local: 0,
    scotland: 0,
    wales: 0,
    northern_ireland: 0,
  };
  for (const c of contracts) {
    if (provenanceOf(c) === "portal_fixture") counts[c.government_level]++;
  }
  return counts;
}

export function loadTierFixtures(
  records: PipelineRawContract[]
): Partial<Record<GovernmentLevel, PipelineRawContract[]>> {
  const out: Partial<Record<GovernmentLevel, PipelineRawContract[]>> = {};
  for (const r of records) {
    if (!r.government_level) continue;
    const tier = r.government_level;
    if (!out[tier]) out[tier] = [];
    out[tier]!.push({
      ...r,
      is_sample: false,
      data_provenance: "portal_fixture",
    });
  }
  return out;
}