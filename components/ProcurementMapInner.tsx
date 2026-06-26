"use client";

import { useEffect, useMemo } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from "react-leaflet";
import type { LatLngBoundsExpression } from "leaflet";
import { GOVERNMENT_LEVEL_COLORS, GOVERNMENT_LEVEL_LABELS } from "@/lib/government";
import { deriveMapPoints } from "@/lib/map-data";
import { formatGBP } from "@/lib/format";
import type { Contract } from "@/lib/types";
import "leaflet/dist/leaflet.css";

const UK_BOUNDS: LatLngBoundsExpression = [
  [49.5, -8.5],
  [61.0, 2.5],
];

function FitBounds({ contracts }: { contracts: Contract[] }) {
  const map = useMap();
  const points = useMemo(
    () => deriveMapPoints(contracts),
    [contracts]
  );

  useEffect(() => {
    if (!points.length) return;
    const lats = points.map((p) => p.lat);
    const lngs = points.map((p) => p.lng);
    map.fitBounds([
      [Math.min(...lats) - 0.3, Math.min(...lngs) - 0.5],
      [Math.max(...lats) + 0.3, Math.max(...lngs) + 0.5],
    ]);
  }, [map, points]);

  return null;
}

interface Props {
  contracts: Contract[];
  selectedId?: string | null;
  onSelect?: (contract: Contract) => void;
}

export default function ProcurementMapInner({
  contracts,
  selectedId,
  onSelect,
}: Props) {
  const points = useMemo(
    () => deriveMapPoints(contracts, selectedId),
    [contracts, selectedId]
  );

  const contractById = useMemo(() => {
    const m = new Map<string, Contract>();
    for (const c of contracts) m.set(c.ocid, c);
    return m;
  }, [contracts]);

  return (
    <div
      className="overflow-hidden rounded-xl border border-gov-border"
      data-testid="procurement-map"
      style={{ height: 480, width: "100%" }}
    >
      <MapContainer
        bounds={UK_BOUNDS}
        scrollWheelZoom
        style={{ height: "100%", width: "100%" }}
        className="z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitBounds contracts={contracts} />
        {points.map((p) => {
          const color = GOVERNMENT_LEVEL_COLORS[p.government_level];
          const radius = p.highlighted ? 12 : 6 + Math.min(p.risk_score / 15, 8);
          const contract = contractById.get(p.id);
          return (
            <CircleMarker
              key={p.id}
              center={[p.lat, p.lng]}
              radius={radius}
              pathOptions={{
                color: p.highlighted ? "#0f172a" : color,
                fillColor: color,
                fillOpacity: p.highlighted ? 0.95 : 0.75,
                weight: p.highlighted ? 3 : 1.5,
              }}
              eventHandlers={{
                click: () => contract && onSelect?.(contract),
              }}
            >
              <Popup>
                <div className="max-w-xs text-sm">
                  <p className="font-semibold">{p.title}</p>
                  <p className="text-slate-600">{p.buyer}</p>
                  <p>{formatGBP(p.value_gbp)}</p>
                  <p className="text-xs text-slate-500">
                    {GOVERNMENT_LEVEL_LABELS[p.government_level]}
                  </p>
                  <p className="mt-1 text-xs italic text-slate-400">
                    Marker shows buyer administrative location — not necessarily the project site.
                  </p>
                </div>
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>
    </div>
  );
}