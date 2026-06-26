import type { Contract, GovernmentLevel, RawContract } from "./types";
import { deriveGovernmentLevel, deriveDataSource } from "./government";

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
): RawContract | null {
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
  };
}

export function dedupeByOcid(records: RawContract[]): RawContract[] {
  const seen = new Set<string>();
  const out: RawContract[] = [];
  for (const r of records) {
    if (seen.has(r.ocid)) continue;
    seen.add(r.ocid);
    out.push(r);
  }
  return out;
}

/** Ensure each tier has at least minPerTier verified records using fixture fallbacks. */
export function supplementMissingVerifiedTiers(
  live: RawContract[],
  fixtures: Partial<Record<GovernmentLevel, RawContract[]>>,
  minPerTier = 2
): RawContract[] {
  const byTier = new Map<GovernmentLevel, RawContract[]>();
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
        current.push({ ...f, government_level: tier, is_sample: false });
      }
    }
    byTier.set(tier, current);
  }

  return dedupeByOcid(ALL_TIERS.flatMap((t) => byTier.get(t) ?? []));
}

export function balanceVerifiedByTier(
  records: RawContract[],
  perTier: number
): RawContract[] {
  const byTier = new Map<GovernmentLevel, RawContract[]>();
  for (const t of ALL_TIERS) byTier.set(t, []);
  for (const r of records) {
    if (!r.government_level) continue;
    byTier.get(r.government_level)?.push(r);
  }
  return ALL_TIERS.flatMap((t) => (byTier.get(t) ?? []).slice(0, perTier));
}

export function mergeVerifiedAndDemo(
  verified: RawContract[],
  demo: RawContract[]
): RawContract[] {
  const v = verified.map((r) => ({ ...r, is_sample: false }));
  const d = demo.map((r) => ({ ...r, is_sample: true }));
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
  contracts: Array<Pick<Contract, "is_sample" | "notice_id" | "description">>
): LabellingResult {
  const errors: string[] = [];
  let verifiedCount = 0;
  let demoCount = 0;

  for (const c of contracts) {
    if (c.is_sample) {
      demoCount++;
      if (!c.notice_id.startsWith("DEMO-")) {
        errors.push(`Demo record ${c.notice_id} missing DEMO- prefix`);
      }
      if (!/demonstration|not an official/i.test(c.description)) {
        errors.push(`Demo record ${c.notice_id} missing demonstration disclaimer`);
      }
    } else {
      verifiedCount++;
      if (c.notice_id.startsWith("DEMO-")) {
        errors.push(`Verified record ${c.notice_id} has DEMO- prefix`);
      }
    }
  }

  return { ok: errors.length === 0, verifiedCount, demoCount, errors };
}

export function loadTierFixtures(
  records: RawContract[]
): Partial<Record<GovernmentLevel, RawContract[]>> {
  const out: Partial<Record<GovernmentLevel, RawContract[]>> = {};
  for (const r of records) {
    if (!r.government_level) continue;
    const tier = r.government_level;
    if (!out[tier]) out[tier] = [];
    out[tier]!.push({ ...r, is_sample: false });
  }
  return out;
}