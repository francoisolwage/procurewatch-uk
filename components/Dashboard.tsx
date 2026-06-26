"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Header from "./Header";
import Footer from "./Footer";
import Metrics from "./Metrics";
import EraLegend from "./EraLegend";
import SpendByYearChart from "./SpendByYearChart";
import DepartmentChart from "./DepartmentChart";
import SupplierChart from "./SupplierChart";
import SpendLineChart from "./SpendLineChart";
import ContractsTable from "./ContractsTable";
import ContractDetail from "./ContractDetail";
import NotableProjects from "./NotableProjects";
import ProcurementMap from "./ProcurementMap";
import TierCoverage from "./TierCoverage";
import SampleDataBanner from "./SampleDataBanner";
import FilterPanel from "./FilterPanel";
import { RiskMethodology, DataSources, EraKey } from "./Methodology";
import { RED_FLAG_DEFINITIONS } from "@/lib/constants";
import { applyFilters, contractsToCSV, getRangeWarning } from "@/lib/filters";
import { loadSampleContracts, parseCSV, parseJSON } from "@/lib/data-loader";
import { formatGBP } from "@/lib/format";
import type { Contract, Filters, PageSection } from "@/lib/types";

const SECTIONS: PageSection[] = [
  "Overview",
  "Project Map",
  "All Contracts",
  "By Department",
  "Legal Services / Lawfare",
  "Red Flags Explorer",
  "Notable Projects",
  "Methodology & Data",
];

export default function Dashboard() {
  const [allContracts, setAllContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [section, setSection] = useState<PageSection>("Overview");
  const [selected, setSelected] = useState<Contract | null>(null);
  const [dataMode, setDataMode] = useState<"sample" | "upload">("sample");
  const [uploading, setUploading] = useState(false);
  const [deptChoice, setDeptChoice] = useState("All departments");
  const [tableKey, setTableKey] = useState(0);
  const [mobilePanelOpen, setMobilePanelOpen] = useState(false);

  const bounds = useMemo(() => {
    if (!allContracts.length) {
      return { yearMin: 2017, yearMax: 2026, valueMin: 0, valueMax: 1_000_000 };
    }
    const years = allContracts.map((c) => new Date(c.award_date).getFullYear());
    const values = allContracts.map((c) => c.value_gbp);
    return {
      yearMin: Math.min(...years),
      yearMax: Math.max(...years),
      valueMin: Math.min(...values),
      valueMax: Math.max(...values),
    };
  }, [allContracts]);

  const [filters, setFilters] = useState<Filters>({
    departments: [],
    governmentLevels: [],
    yearMin: 2017,
    yearMax: 2026,
    valueMin: 0,
    valueMax: 100_000_000,
    search: "",
    flaggedOnly: false,
    era: "All",
    sortBy: "Highest value",
  });

  useEffect(() => {
    loadSampleContracts()
      .then((data) => {
        setAllContracts(data);
        const years = data.map((c) => new Date(c.award_date).getFullYear());
        const values = data.map((c) => c.value_gbp);
        setFilters((f) => ({
          ...f,
          yearMin: Math.min(...years),
          yearMax: Math.max(...years),
          valueMin: Math.min(...values),
          valueMax: Math.max(...values),
        }));
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const departments = useMemo(
    () => [...new Set(allContracts.map((c) => c.buyer))].sort(),
    [allContracts]
  );

  const verifiedCount = useMemo(
    () => allContracts.filter((c) => !c.is_sample).length,
    [allContracts]
  );

  const demoCount = useMemo(
    () => allContracts.filter((c) => c.is_sample).length,
    [allContracts]
  );

  const filtered = useMemo(
    () => applyFilters(allContracts, filters),
    [allContracts, filters]
  );

  const rangeWarning = useMemo(() => getRangeWarning(filters), [filters]);

  const updateFilter = useCallback(
    <K extends keyof Filters>(key: K, value: Filters[K]) => {
      setFilters((f) => ({ ...f, [key]: value }));
      setTableKey((k) => k + 1);
    },
    []
  );

  const handleUpload = async (file: File) => {
    setUploading(true);
    setError(null);
    try {
      const text = await file.text();
      const name = file.name.toLowerCase();
      const parsed =
        name.endsWith(".csv")
          ? parseCSV(text)
          : name.endsWith(".json") || name.endsWith(".jsonl")
            ? parseJSON(text)
            : null;
      if (!parsed) throw new Error("Unsupported format. Use CSV or JSON/JSONL.");
      setAllContracts(parsed);
      setDataMode("upload");
      const years = parsed.map((c) => new Date(c.award_date).getFullYear());
      const values = parsed.map((c) => c.value_gbp);
      setFilters({
        departments: [],
        governmentLevels: [],
        yearMin: Math.min(...years),
        yearMax: Math.max(...years),
        valueMin: Math.min(...values),
        valueMax: Math.max(...values),
        search: "",
        flaggedOnly: false,
        era: "All",
        sortBy: "Highest value",
      });
      setTableKey((k) => k + 1);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const resetToSample = async () => {
    setLoading(true);
    try {
      const data = await loadSampleContracts();
      setAllContracts(data);
      setDataMode("sample");
      const years = data.map((c) => new Date(c.award_date).getFullYear());
      const values = data.map((c) => c.value_gbp);
      setFilters((f) => ({
        ...f,
        departments: [],
        governmentLevels: [],
        yearMin: Math.min(...years),
        yearMax: Math.max(...years),
        valueMin: Math.min(...values),
        valueMax: Math.max(...values),
        search: "",
        flaggedOnly: false,
        era: "All",
      }));
      setTableKey((k) => k + 1);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load sample");
    } finally {
      setLoading(false);
    }
  };

  const downloadCSV = () => {
    const csv = contractsToCSV(filtered);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "procurewatch_export.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const deptFiltered =
    deptChoice === "All departments"
      ? filtered
      : filtered.filter((c) => c.buyer === deptChoice);

  const legalFiltered = filtered.filter((c) => c.is_legal);
  const flaggedFiltered = filtered
    .filter((c) => c.red_flag_count > 0)
    .sort(
      (a, b) =>
        b.red_flag_count - a.red_flag_count || b.risk_score - a.risk_score
    );

  const filterPanelProps = {
    section,
    sections: SECTIONS,
    onSectionChange: (s: PageSection) => {
      setSection(s);
      setMobilePanelOpen(false);
    },
    dataMode,
    onSampleMode: resetToSample,
    onUploadMode: () => setDataMode("upload"),
    onUpload: handleUpload,
    uploading,
    filters,
    bounds,
    departments,
    filteredCount: filtered.length,
    totalCount: allContracts.length,
    rangeWarning,
    onFilterChange: updateFilter,
  };

  if (loading && !allContracts.length) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gov-surface">
        <p className="text-gov-slate">Loading procurement data…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto flex max-w-[1440px] gap-6 px-4 py-6 lg:px-6">
        {/* Desktop sidebar */}
        <aside className="hidden w-72 shrink-0 lg:block">
          <div className="sticky top-6">
            <FilterPanel {...filterPanelProps} />
          </div>
        </aside>

        {/* Main */}
        <main className="min-w-0 flex-1 space-y-6">
          <Header />
          {dataMode === "sample" && (
            <SampleDataBanner verifiedCount={verifiedCount} demoCount={demoCount} />
          )}

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              {error}
            </div>
          )}

          {/* Mobile filters & navigation */}
          <div className="lg:hidden">
            <button
              type="button"
              onClick={() => setMobilePanelOpen((o) => !o)}
              className="flex w-full items-center justify-between rounded-lg border border-gov-border bg-gov-surface px-4 py-3 text-sm font-medium text-gov-navy"
              aria-expanded={mobilePanelOpen}
            >
              <span>{mobilePanelOpen ? "Hide" : "Show"} filters &amp; navigation</span>
              <span className="text-gov-slate">
                {filtered.length.toLocaleString()} / {allContracts.length.toLocaleString()}
              </span>
            </button>
            {mobilePanelOpen && (
              <div className="mt-3">
                <FilterPanel {...filterPanelProps} />
              </div>
            )}
          </div>

          {section === "Overview" && (
            <>
              <h2 className="section-title">Overview</h2>
              <TierCoverage contracts={filtered} />
              <Metrics contracts={filtered} />
              <ProcurementMap
                contracts={filtered}
                selectedId={selected?.ocid}
                onSelect={setSelected}
              />
              <SpendByYearChart contracts={filtered} />
              <EraLegend />
              <h3 className="text-lg font-semibold text-gov-navy">All Contracts</h3>
              <ContractsTable
                key={tableKey}
                contracts={filtered}
                onSelect={setSelected}
              />
              <button onClick={downloadCSV} className="btn-secondary">
                Download filtered data (CSV)
              </button>
              <RiskMethodology />
            </>
          )}

          {section === "Project Map" && (
            <>
              <h2 className="section-title">Project Map</h2>
              <p className="text-sm text-slate-600">
                Interactive map of procurement by buyer location across central,
                local and devolved UK governments. Filters update markers in real
                time. Click a marker or table row for details.
              </p>
              <TierCoverage contracts={filtered} />
              <ProcurementMap
                contracts={filtered}
                selectedId={selected?.ocid}
                onSelect={setSelected}
              />
              <ContractsTable
                key={`map-${tableKey}`}
                contracts={filtered}
                onSelect={(c) => {
                  setSelected(c);
                  setSection("Project Map");
                }}
              />
            </>
          )}

          {section === "All Contracts" && (
            <>
              <h2 className="section-title">All Contracts</h2>
              <Metrics contracts={filtered} />
              <ContractsTable
                key={tableKey}
                contracts={filtered}
                onSelect={setSelected}
              />
              <button onClick={downloadCSV} className="btn-secondary">
                Download filtered data (CSV)
              </button>
            </>
          )}

          {section === "By Department" && (
            <>
              <h2 className="section-title">Spend by Department</h2>
              <select
                className="rounded-lg border border-gov-border px-3 py-2"
                value={deptChoice}
                onChange={(e) => setDeptChoice(e.target.value)}
              >
                <option>All departments</option>
                {departments.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
              {deptChoice === "All departments" ? (
                <DepartmentChart
                  contracts={filtered}
                  title="Total Spend by Department"
                />
              ) : (
                <>
                  <Metrics contracts={deptFiltered} />
                  <SpendByYearChart
                    contracts={deptFiltered}
                    title={`${deptChoice} — Spend by Year`}
                  />
                </>
              )}
              <ContractsTable
                key={`dept-${tableKey}`}
                contracts={deptFiltered}
                onSelect={setSelected}
              />
              <button onClick={downloadCSV} className="btn-secondary">
                Download filtered data (CSV)
              </button>
            </>
          )}

          {section === "Legal Services / Lawfare" && (
            <>
              <h2 className="section-title">Legal Services / Lawfare Tracker</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="metric-card">
                  <p className="text-xs text-gov-slate">Legal Contracts</p>
                  <p className="text-2xl font-semibold">{legalFiltered.length}</p>
                </div>
                <div className="metric-card">
                  <p className="text-xs text-gov-slate">Total Legal Spend</p>
                  <p className="text-2xl font-semibold">
                    {formatGBP(legalFiltered.reduce((s, c) => s + c.value_gbp, 0))}
                  </p>
                </div>
              </div>
              {legalFiltered.length ? (
                <>
                  <SpendLineChart
                    contracts={legalFiltered}
                    title="Legal Services Spend Over Time"
                  />
                  <div className="grid gap-4 lg:grid-cols-2">
                    <DepartmentChart
                      contracts={legalFiltered}
                      title="Legal Spend by Department"
                    />
                    <SupplierChart
                      contracts={legalFiltered}
                      title="Top 10 Law Firms / Suppliers"
                    />
                  </div>
                  <h3 className="font-semibold">All Legal-Related Contracts</h3>
                  <ContractsTable
                    key={`legal-${tableKey}`}
                    contracts={legalFiltered}
                    onSelect={setSelected}
                  />
                  <button onClick={downloadCSV} className="btn-secondary">
                    Download legal contracts (CSV)
                  </button>
                </>
              ) : (
                <p className="text-slate-500">No legal services contracts match filters.</p>
              )}
              <p className="text-xs text-gov-slate">
                Detection: CPV 791xxxx or keywords (legal advice, solicitors, judicial
                review, litigation, etc.)
              </p>
            </>
          )}

          {section === "Red Flags Explorer" && (
            <>
              <h2 className="section-title">Red Flags Explorer</h2>
              <p className="text-sm text-slate-600">
                <strong>{flaggedFiltered.length.toLocaleString()}</strong> contracts
                with at least one red flag
                {filtered.length
                  ? ` (${((flaggedFiltered.length / filtered.length) * 100).toFixed(1)}% of filtered set)`
                  : ""}
              </p>
              <ul className="list-disc space-y-1 pl-5 text-sm text-slate-700">
                {Object.values(RED_FLAG_DEFINITIONS).map((cfg) => (
                  <li key={cfg.label}>
                    <strong>{cfg.label}:</strong> {cfg.description}
                  </li>
                ))}
              </ul>
              {flaggedFiltered.length ? (
                <>
                  <ContractsTable
                    key={`flags-${tableKey}`}
                    contracts={flaggedFiltered}
                    onSelect={setSelected}
                  />
                  <button onClick={downloadCSV} className="btn-secondary">
                    Download flagged contracts (CSV)
                  </button>
                </>
              ) : (
                <p className="rounded-lg border border-green-200 bg-green-50 p-4 text-green-800">
                  No flagged contracts in the current filter set.
                </p>
              )}
              <RiskMethodology />
            </>
          )}

          {section === "Notable Projects" && <NotableProjects />}

          {section === "Methodology & Data" && (
            <>
              <h2 className="section-title">Methodology &amp; Transparency</h2>
              <RiskMethodology />
              <DataSources />
              <div className="rounded-xl border border-gov-border bg-gov-surface p-4">
                <EraKey />
              </div>
            </>
          )}

          <Footer />
        </main>
      </div>

      {selected && (
        <ContractDetail contract={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}