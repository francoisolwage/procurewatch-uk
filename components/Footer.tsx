import { DATA_SOURCES } from "@/lib/constants";

export default function Footer() {
  return (
    <footer className="mt-10 rounded-lg border-t-2 border-slate-300 bg-slate-100 px-5 py-4 text-sm text-slate-600">
      <strong>ProcureWatch UK</strong> · Data sources:{" "}
      <a
        href={DATA_SOURCES.contracts_finder}
        className="text-gov-blue hover:underline"
        target="_blank"
        rel="noopener noreferrer"
      >
        Contracts Finder
      </a>{" "}
      ·{" "}
      <a
        href={DATA_SOURCES.ocds_bulk}
        className="text-gov-blue hover:underline"
        target="_blank"
        rel="noopener noreferrer"
      >
        OCDS Bulk Data
      </a>
      <br />
      Sample dataset last generated: June 2026 · Not affiliated with HM
      Government · For accountability research purposes
    </footer>
  );
}