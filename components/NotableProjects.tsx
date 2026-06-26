import { NOTABLE_PROJECTS } from "@/lib/constants";

export default function NotableProjects() {
  return (
    <div>
      <h2 className="section-title">Notable High-Cost / Controversial Projects</h2>
      <p className="mt-1 text-sm text-slate-600">
        Curated examples of major projects with documented cost overruns or delays.
        Suggest additions via GitHub Issues.
      </p>
      <div className="mt-4 space-y-4">
        {NOTABLE_PROJECTS.map((proj) => (
          <div
            key={proj.name}
            className="rounded-xl border border-gov-border bg-white p-5"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
              <div className="flex-1">
                <h3 className="font-semibold text-gov-navy">{proj.name}</h3>
                <p className="text-sm text-gov-slate">{proj.department}</p>
                <p className="mt-2 text-sm text-slate-700">{proj.explanation}</p>
              </div>
              <div className="shrink-0 text-sm">
                <p>
                  <span className="text-gov-slate">Original:</span>{" "}
                  <strong>£{proj.original_cost_m.toLocaleString()}m</strong>
                </p>
                <p>
                  <span className="text-gov-slate">Final / latest:</span>{" "}
                  <strong>£{proj.final_cost_m.toLocaleString()}m</strong>
                </p>
                <p className="mt-1 italic text-slate-500">{proj.status}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}