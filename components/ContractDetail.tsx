"use client";

import { DATA_SOURCE_LABELS } from "@/lib/constants";
import { GOVERNMENT_LEVEL_LABELS } from "@/lib/government";
import { explainFlags } from "@/lib/risk-scoring";
import { formatDate, formatGBP, riskColor } from "@/lib/format";
import type { Contract } from "@/lib/types";

interface Props {
  contract: Contract;
  onClose: () => void;
}

export default function ContractDetail({ contract, onClose }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-start justify-between gap-4">
          <h2 className="text-lg font-semibold text-gov-navy">{contract.title}</h2>
          <button
            onClick={onClose}
            className="rounded-lg px-3 py-1 text-sm text-slate-500 hover:bg-slate-100"
          >
            ✕ Close
          </button>
        </div>

        <div className="mb-4 grid grid-cols-3 gap-3">
          <div className="metric-card">
            <p className="text-xs text-gov-slate">Value</p>
            <p className="font-semibold">{formatGBP(contract.value_gbp)}</p>
          </div>
          <div className="metric-card">
            <p className="text-xs text-gov-slate">Risk Score</p>
            <p className={`font-semibold ${riskColor(contract.risk_score)}`}>
              {contract.risk_score}/100
            </p>
          </div>
          <div className="metric-card">
            <p className="text-xs text-gov-slate">Red Flags</p>
            <p className="font-semibold">{contract.red_flag_count}/3</p>
          </div>
        </div>

        <dl className="space-y-2 text-sm">
          <div>
            <dt className="font-medium text-gov-slate">Department</dt>
            <dd>
              {contract.buyer} ({contract.department_tag})
            </dd>
          </div>
          <div>
            <dt className="font-medium text-gov-slate">Government level</dt>
            <dd>{GOVERNMENT_LEVEL_LABELS[contract.government_level]}</dd>
          </div>
          <div>
            <dt className="font-medium text-gov-slate">Location (buyer HQ)</dt>
            <dd>
              {contract.location.locality}, {contract.location.nation} (
              {contract.location.lat.toFixed(3)}, {contract.location.lng.toFixed(3)})
            </dd>
          </div>
          <div>
            <dt className="font-medium text-gov-slate">Data source</dt>
            <dd>
              {contract.is_sample ? (
                <span className="text-amber-700">Demonstration sample — not an official notice</span>
              ) : (
                DATA_SOURCE_LABELS[contract.data_source] ?? contract.data_source
              )}
            </dd>
          </div>
          <div>
            <dt className="font-medium text-gov-slate">Supplier</dt>
            <dd>{contract.supplier}</dd>
          </div>
          <div>
            <dt className="font-medium text-gov-slate">Award Date</dt>
            <dd>{formatDate(contract.award_date)}</dd>
          </div>
          <div>
            <dt className="font-medium text-gov-slate">CPV / Category</dt>
            <dd>
              {contract.cpv_code} — {contract.category}
            </dd>
          </div>
          <div>
            <dt className="font-medium text-gov-slate">IDs</dt>
            <dd className="font-mono text-xs">
              {contract.ocid} · {contract.notice_id}
            </dd>
          </div>
          <div>
            <dt className="font-medium text-gov-slate">Description</dt>
            <dd className="text-slate-700">{contract.description}</dd>
          </div>
        </dl>

        {contract.red_flag_count > 0 && (
          <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4">
            <h3 className="mb-1 font-semibold text-amber-900">
              Why is this flagged?
            </h3>
            <p className="text-sm text-amber-800">{explainFlags(contract)}</p>
          </div>
        )}

        {contract.contracts_finder_url?.startsWith("http") && (
          <a
            href={contract.contracts_finder_url}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary mt-4"
          >
            View source notice →
          </a>
        )}
        {!contract.contracts_finder_url?.startsWith("http") && contract.data_source && (
          <a
            href={contract.data_source}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary mt-4"
          >
            View official portal →
          </a>
        )}
      </div>
    </div>
  );
}