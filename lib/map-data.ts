import type { Contract, MapPoint } from "./types";

export function deriveMapPoints(
  contracts: Contract[],
  selectedId?: string | null
): MapPoint[] {
  return contracts
    .filter(
      (c) =>
        Number.isFinite(c.location?.lat) &&
        Number.isFinite(c.location?.lng)
    )
    .map((c) => ({
      id: c.ocid,
      lat: c.location.lat,
      lng: c.location.lng,
      title: c.title,
      buyer: c.buyer,
      value_gbp: c.value_gbp,
      government_level: c.government_level,
      risk_score: c.risk_score,
      highlighted: selectedId === c.ocid,
    }));
}

export function mapPointsForLevel(
  points: MapPoint[],
  level: string
): MapPoint[] {
  if (level === "all") return points;
  return points.filter((p) => p.government_level === level);
}