interface Props {
  verifiedCount: number;
  demoCount: number;
}

export default function SampleDataBanner({ verifiedCount, demoCount }: Props) {
  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
      <strong>Mixed dataset.</strong>{" "}
      <span className="font-medium text-green-800">
        {verifiedCount.toLocaleString()} verified
      </span>{" "}
      record{verifiedCount === 1 ? "" : "s"} from official UK procurement portals
      are included alongside{" "}
      <span className="font-medium">
        {demoCount.toLocaleString()} demonstration
      </span>{" "}
      record{demoCount === 1 ? "" : "s"} for exploration. Verified entries are
      labelled <code className="text-xs">is_sample: false</code> in exports.
      Upload your own CSV or JSON from Contracts Finder, Public Contracts Scotland,
      Sell2Wales or eTendersNI for full verified analysis. Map markers show buyer
      administrative locations, not precise project sites.
    </div>
  );
}