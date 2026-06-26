"use client";

import dynamic from "next/dynamic";
import type { Contract } from "@/lib/types";

const ProcurementMapInner = dynamic(() => import("./ProcurementMapInner"), {
  ssr: false,
  loading: () => (
    <div
      data-testid="procurement-map"
      className="flex h-[480px] items-center justify-center rounded-xl border border-gov-border bg-gov-surface text-sm text-gov-slate"
    >
      Loading map…
    </div>
  ),
});

interface Props {
  contracts: Contract[];
  selectedId?: string | null;
  onSelect?: (contract: Contract) => void;
}

export default function ProcurementMap(props: Props) {
  return <ProcurementMapInner {...props} />;
}