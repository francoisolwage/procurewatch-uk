"use client";

import { GOVERNMENT_ERAS } from "@/lib/constants";
import { GOVERNMENT_LEVEL_LABELS } from "@/lib/government";
import type { Filters, GovernmentLevel, PageSection } from "@/lib/types";
import type { DataViewMode } from "@/lib/data-pipeline";

const GOVERNMENT_LEVELS: GovernmentLevel[] = [
  "central",
  "local",
  "scotland",
  "wales",
  "northern_ireland",
];

const SORT_OPTIONS = [
  "Highest value",
  "Newest first",
  "Highest risk score",
  "Most red flags",
] as const;

interface Props {
  section: PageSection;
  sections: PageSection[];
  onSectionChange: (s: PageSection) => void;
  dataMode: DataViewMode;
  onNationalMode: () => void;
  onLiveMode: () => void;
  onFixturesMode: () => void;
  onDemonstrationMode: () => void;
  onUploadMode: () => void;
  onUpload: (file: File) => void;
  uploading: boolean;
  filters: Filters;
  bounds: { yearMin: number; yearMax: number; valueMin: number; valueMax: number };
  departments: string[];
  filteredCount: number;
  totalCount: number;
  rangeWarning: string | null;
  onFilterChange: <K extends keyof Filters>(key: K, value: Filters[K]) => void;
}

export default function FilterPanel({
  section,
  sections,
  onSectionChange,
  dataMode,
  onNationalMode,
  onLiveMode,
  onFixturesMode,
  onDemonstrationMode,
  onUploadMode,
  onUpload,
  uploading,
  filters,
  bounds,
  departments,
  filteredCount,
  totalCount,
  rangeWarning,
  onFilterChange,
}: Props) {
  return (
    <div className="space-y-4 rounded-xl border border-gov-border bg-gov-surface p-4">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-gov-slate">
        Navigation
      </h2>
      <nav className="space-y-1 lg:block">
        {sections.map((s) => (
          <button
            key={s}
            onClick={() => onSectionChange(s)}
            className={`nav-item ${section === s ? "nav-item-active" : "nav-item-inactive"}`}
          >
            {s}
          </button>
        ))}
      </nav>

      <hr className="border-gov-border" />

      <h2 className="text-sm font-semibold uppercase tracking-wide text-gov-slate">
        Data Source
      </h2>
      <div className="space-y-2 text-sm" data-testid="data-source-panel">
        <label className="flex items-center gap-2">
          <input
            type="radio"
            name="data-view-mode"
            checked={dataMode === "national"}
            onChange={onNationalMode}
          />
          Full national dataset (live + fixtures)
        </label>
        <label className="flex items-center gap-2">
          <input
            type="radio"
            name="data-view-mode"
            checked={dataMode === "live"}
            onChange={onLiveMode}
          />
          Live OCDS records only
        </label>
        <label className="flex items-center gap-2">
          <input
            type="radio"
            name="data-view-mode"
            checked={dataMode === "fixtures"}
            onChange={onFixturesMode}
          />
          Portal fixture snapshots
        </label>
        <label className="flex items-center gap-2">
          <input
            type="radio"
            name="data-view-mode"
            checked={dataMode === "demonstration"}
            onChange={onDemonstrationMode}
          />
          Demonstration data
        </label>
        <label className="flex items-center gap-2">
          <input
            type="radio"
            name="data-view-mode"
            checked={dataMode === "upload"}
            onChange={onUploadMode}
          />
          Upload real data
        </label>
        {dataMode === "upload" && (
          <input
            type="file"
            accept=".csv,.json,.jsonl"
            className="w-full text-xs"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onUpload(f);
            }}
            disabled={uploading}
          />
        )}
      </div>

      <hr className="border-gov-border" />

      <h2 className="text-sm font-semibold uppercase tracking-wide text-gov-slate">
        Filters
      </h2>

      {rangeWarning && (
        <p className="rounded-md border border-amber-200 bg-amber-50 px-2 py-1 text-xs text-amber-800">
          {rangeWarning}
        </p>
      )}

      <div className="space-y-3 text-sm">
        <div>
          <label className="mb-1 block text-xs text-gov-slate">Government level</label>
          <select
            multiple
            data-testid="government-level-filter"
            className="h-28 w-full rounded-lg border border-gov-border px-2 py-1"
            value={filters.governmentLevels}
            onChange={(e) =>
              onFilterChange(
                "governmentLevels",
                Array.from(e.target.selectedOptions, (o) => o.value as GovernmentLevel)
              )
            }
          >
            {GOVERNMENT_LEVELS.map((level) => (
              <option key={level} value={level}>
                {GOVERNMENT_LEVEL_LABELS[level]}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-xs text-gov-slate">Department</label>
          <select
            multiple
            className="h-24 w-full rounded-lg border border-gov-border px-2 py-1"
            value={filters.departments}
            onChange={(e) =>
              onFilterChange(
                "departments",
                Array.from(e.target.selectedOptions, (o) => o.value)
              )
            }
          >
            {departments.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-xs text-gov-slate">
            Year from: {filters.yearMin}
          </label>
          <input
            type="range"
            min={bounds.yearMin}
            max={bounds.yearMax}
            value={Math.min(filters.yearMin, filters.yearMax)}
            className="w-full"
            onChange={(e) => onFilterChange("yearMin", parseInt(e.target.value))}
          />
          <label className="mb-1 block text-xs text-gov-slate">
            Year to: {filters.yearMax}
          </label>
          <input
            type="range"
            min={bounds.yearMin}
            max={bounds.yearMax}
            value={Math.max(filters.yearMin, filters.yearMax)}
            className="w-full"
            onChange={(e) => onFilterChange("yearMax", parseInt(e.target.value))}
          />
        </div>

        <div>
          <label className="mb-1 block text-xs text-gov-slate">
            Min value (£{filters.valueMin.toLocaleString()})
          </label>
          <input
            type="range"
            min={bounds.valueMin}
            max={bounds.valueMax}
            value={Math.min(filters.valueMin, filters.valueMax)}
            className="w-full"
            onChange={(e) => onFilterChange("valueMin", parseFloat(e.target.value))}
          />
          <label className="mb-1 block text-xs text-gov-slate">
            Max value (£{filters.valueMax.toLocaleString()})
          </label>
          <input
            type="range"
            min={bounds.valueMin}
            max={bounds.valueMax}
            value={Math.max(filters.valueMin, filters.valueMax)}
            className="w-full"
            onChange={(e) => onFilterChange("valueMax", parseFloat(e.target.value))}
          />
        </div>

        <div>
          <label className="mb-1 block text-xs text-gov-slate">Search</label>
          <input
            type="text"
            placeholder="Title, supplier…"
            className="w-full rounded-lg border border-gov-border px-3 py-2"
            value={filters.search}
            onChange={(e) => onFilterChange("search", e.target.value)}
          />
        </div>

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={filters.flaggedOnly}
            onChange={(e) => onFilterChange("flaggedOnly", e.target.checked)}
          />
          Flagged only
        </label>

        <div>
          <label className="mb-1 block text-xs text-gov-slate">Government era</label>
          <select
            className="w-full rounded-lg border border-gov-border px-2 py-2"
            value={filters.era}
            onChange={(e) => onFilterChange("era", e.target.value)}
          >
            <option value="All">All</option>
            {Object.keys(GOVERNMENT_ERAS).map((e) => (
              <option key={e} value={e}>
                {e}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-xs text-gov-slate">Sort by</label>
          <select
            className="w-full rounded-lg border border-gov-border px-2 py-2"
            value={filters.sortBy}
            onChange={(e) =>
              onFilterChange("sortBy", e.target.value as Filters["sortBy"])
            }
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        </div>
      </div>

      <p className="text-xs text-gov-slate" data-testid="filter-scope-summary">
        Showing <strong data-testid="filter-visible-count">{filteredCount.toLocaleString()}</strong> of{" "}
        <strong data-testid="filter-scope-count">{totalCount.toLocaleString()}</strong> contracts
      </p>
    </div>
  );
}