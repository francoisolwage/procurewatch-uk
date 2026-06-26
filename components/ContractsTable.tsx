"use client";

import { useState } from "react";
import { GOVERNMENT_LEVEL_LABELS } from "@/lib/government";
import { formatDate, formatGBP, riskColor } from "@/lib/format";
import type { Contract } from "@/lib/types";

interface Props {
  contracts: Contract[];
  onSelect: (contract: Contract) => void;
  pageSize?: number;
}

export default function ContractsTable({
  contracts,
  onSelect,
  pageSize = 25,
}: Props) {
  const [page, setPage] = useState(0);
  const totalPages = Math.max(1, Math.ceil(contracts.length / pageSize));
  const safePage = Math.min(page, totalPages - 1);
  const slice = contracts.slice(
    safePage * pageSize,
    safePage * pageSize + pageSize
  );

  if (!contracts.length) {
    return (
      <p className="rounded-lg border border-gov-border bg-gov-surface p-6 text-center text-slate-500">
        No contracts match the current filters.
      </p>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-gov-border bg-white">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead className="border-b border-gov-border bg-gov-surface text-xs uppercase tracking-wide text-gov-slate">
            <tr>
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Department</th>
              <th className="px-4 py-3">Supplier</th>
              <th className="px-4 py-3">Award Date</th>
              <th className="px-4 py-3 text-right">Value (£)</th>
              <th className="px-4 py-3 text-center">Risk</th>
              <th className="px-4 py-3 text-center">Flags</th>
              <th className="px-4 py-3">Level</th>
              <th className="px-4 py-3">Tag</th>
            </tr>
          </thead>
          <tbody>
            {slice.map((c) => (
              <tr
                key={c.ocid + c.notice_id}
                onClick={() => onSelect(c)}
                className="cursor-pointer border-b border-slate-100 transition hover:bg-blue-50/50"
              >
                <td className="max-w-xs truncate px-4 py-3 font-medium">
                  {c.title}
                </td>
                <td className="max-w-[160px] truncate px-4 py-3">{c.buyer}</td>
                <td className="max-w-[140px] truncate px-4 py-3">{c.supplier}</td>
                <td className="whitespace-nowrap px-4 py-3">
                  {formatDate(c.award_date)}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-right font-medium">
                  {formatGBP(c.value_gbp)}
                </td>
                <td className={`px-4 py-3 text-center font-semibold ${riskColor(c.risk_score)}`}>
                  {c.risk_score}
                </td>
                <td className="px-4 py-3 text-center">
                  {c.red_flag_count > 0 ? (
                    <span className="flag-badge">{c.red_flag_count}/3</span>
                  ) : (
                    <span className="text-slate-400">—</span>
                  )}
                </td>
                <td className="px-4 py-3 text-xs text-slate-600">
                  {GOVERNMENT_LEVEL_LABELS[c.government_level].split("—")[0].trim()}
                </td>
                <td className="px-4 py-3 text-xs text-slate-500">
                  {c.department_tag}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between border-t border-gov-border px-4 py-3 text-sm text-slate-600">
        <span>
          Showing {safePage * pageSize + 1}–
          {Math.min((safePage + 1) * pageSize, contracts.length)} of{" "}
          {contracts.length.toLocaleString()}
        </span>
        <div className="flex gap-2">
          <button
            className="btn-secondary disabled:opacity-40"
            disabled={safePage === 0}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
          >
            Previous
          </button>
          <button
            className="btn-secondary disabled:opacity-40"
            disabled={safePage >= totalPages - 1}
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}