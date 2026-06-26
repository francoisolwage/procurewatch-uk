import {
  CONSULTANCY_KEYWORDS,
  CONSULTANCY_SUPPLIERS,
  DEPARTMENT_TAGS,
  LEGAL_KEYWORDS,
  RED_FLAG_DEFINITIONS,
} from "./constants";
import type { Contract, RawContract } from "./types";

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function similarity(a: string, b: string): number {
  const s1 = normalizeText(a);
  const s2 = normalizeText(b);
  if (s1 === s2) return 1;
  if (!s1 || !s2) return 0;

  const len1 = s1.length;
  const len2 = s2.length;
  const matrix: number[][] = Array.from({ length: len1 + 1 }, (_, i) =>
    Array.from({ length: len2 + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );

  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }

  const dist = matrix[len1][len2];
  return 1 - dist / Math.max(len1, len2);
}

function isConsultancy(row: RawContract): boolean {
  const cpv = String(row.cpv_code ?? "");
  const title = row.title.toLowerCase();
  const desc = row.description.toLowerCase();
  if (cpv.startsWith("79") && !cpv.startsWith("791")) return true;
  if (CONSULTANCY_SUPPLIERS.includes(row.supplier)) return true;
  return CONSULTANCY_KEYWORDS.some((k) => title.includes(k) || desc.includes(k));
}

function isLegal(row: RawContract): boolean {
  const cpv = String(row.cpv_code ?? "");
  const title = row.title.toLowerCase();
  const desc = row.description.toLowerCase();
  if (cpv.startsWith("791")) return true;
  return LEGAL_KEYWORDS.some((k) => title.includes(k) || desc.includes(k));
}

function daysBetween(a: string, b: string): number {
  return Math.abs(new Date(a).getTime() - new Date(b).getTime()) / 86400000;
}

function detectDuplicateRisk(contracts: RawContract[]): boolean[] {
  return contracts.map((row, idx) => {
    const peers = contracts.filter(
      (p, i) =>
        i !== idx &&
        p.supplier === row.supplier &&
        p.buyer === row.buyer &&
        daysBetween(p.award_date, row.award_date) <= 730 &&
        new Date(p.award_date) <= new Date(row.award_date)
    );
    return peers.some((peer) => {
      const titleSim = similarity(row.title, peer.title);
      const descSim = similarity(row.description, peer.description);
      return titleSim >= 0.88 || (titleSim >= 0.75 && descSim >= 0.82);
    });
  });
}

function detectRepeatedConsultancy(contracts: RawContract[]): boolean[] {
  return contracts.map((row, idx) => {
    if (!isConsultancy(row)) return false;
    const peers = contracts.filter(
      (p, i) =>
        i !== idx &&
        p.buyer === row.buyer &&
        daysBetween(p.award_date, row.award_date) <= 548 &&
        new Date(p.award_date) <= new Date(row.award_date)
    );
    const consultCount = peers.filter(isConsultancy).length;
    const sameCat = peers.filter(
      (p) => isConsultancy(p) && p.category === row.category
    ).length;
    return consultCount >= 4 || sameCat >= 3;
  });
}

function detectValueSpike(contracts: RawContract[]): boolean[] {
  return contracts.map((row, idx) => {
    const year = new Date(row.award_date).getFullYear();
    const recent = contracts.filter(
      (p, i) =>
        i !== idx &&
        p.buyer === row.buyer &&
        p.category === row.category &&
        new Date(p.award_date).getFullYear() >= year - 3 &&
        new Date(p.award_date).getFullYear() <= year
    );
    if (recent.length < 8) return false;
    const values = recent.map((p) => p.value_gbp).sort((a, b) => a - b);
    const mid = Math.floor(values.length / 2);
    const median =
      values.length % 2 === 0
        ? (values[mid - 1] + values[mid]) / 2
        : values[mid];
    if (median <= 0) return false;
    return row.value_gbp > median * 4 && row.value_gbp > 250_000;
  });
}

function formatRedFlags(flags: {
  duplicate: boolean;
  consultancy: boolean;
  spike: boolean;
}): string {
  const active: string[] = [];
  if (flags.duplicate) active.push("Duplicate");
  if (flags.consultancy) active.push("Consultancy");
  if (flags.spike) active.push("Value Spike");
  return active.length ? active.join(", ") : "—";
}

export function explainFlags(contract: Contract): string {
  const parts: string[] = [];
  if (contract.flag_duplicate_risk)
    parts.push(RED_FLAG_DEFINITIONS.duplicate_risk.description);
  if (contract.flag_repeated_consultancy)
    parts.push(RED_FLAG_DEFINITIONS.repeated_consultancy.description);
  if (contract.flag_value_spike)
    parts.push(RED_FLAG_DEFINITIONS.value_spike.description);
  return parts.length
    ? parts.join(" ")
    : "No red flags detected for this contract.";
}

export function computeRiskScores(raw: RawContract[]): Contract[] {
  const dup = detectDuplicateRisk(raw);
  const consult = detectRepeatedConsultancy(raw);
  const spike = detectValueSpike(raw);

  const values = raw.map((r) => r.value_gbp).sort((a, b) => a - b);
  const p95Idx = Math.floor(values.length * 0.95);
  const p95 = values[p95Idx] ?? 0;

  return raw.map((row, i) => {
    let riskScore =
      (dup[i] ? RED_FLAG_DEFINITIONS.duplicate_risk.weight : 0) +
      (consult[i] ? RED_FLAG_DEFINITIONS.repeated_consultancy.weight : 0) +
      (spike[i] ? RED_FLAG_DEFINITIONS.value_spike.weight : 0);

    if (row.value_gbp > p95) riskScore = Math.min(100, riskScore + 10);

    const redFlagCount =
      Number(dup[i]) + Number(consult[i]) + Number(spike[i]);

    return {
      ...row,
      department_tag: row.department_tag ?? DEPARTMENT_TAGS[row.buyer] ?? "Other",
      contracts_finder_url:
        row.contracts_finder_url ??
        `https://www.contractsfinder.service.gov.uk/Notice/${row.notice_id}`,
      flag_duplicate_risk: dup[i],
      flag_repeated_consultancy: consult[i],
      flag_value_spike: spike[i],
      red_flag_count: redFlagCount,
      red_flags: formatRedFlags({
        duplicate: dup[i],
        consultancy: consult[i],
        spike: spike[i],
      }),
      risk_score: Math.min(100, riskScore),
      is_legal: isLegal(row),
      is_consultancy: isConsultancy(row),
    };
  });
}