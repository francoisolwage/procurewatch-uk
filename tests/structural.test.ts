import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");

describe("structural presence", () => {
  it("includes interactive map component", () => {
    assert.ok(fs.existsSync(path.join(ROOT, "components", "ProcurementMap.tsx")));
    assert.ok(fs.existsSync(path.join(ROOT, "components", "ProcurementMapInner.tsx")));
    const inner = fs.readFileSync(
      path.join(ROOT, "components", "ProcurementMapInner.tsx"),
      "utf-8"
    );
    assert.match(inner, /data-testid="procurement-map"/);
    assert.match(inner, /MapContainer/);
    assert.match(inner, /CircleMarker/);
  });

  it("documents multi-portal data sources", () => {
    const methodology = fs.readFileSync(
      path.join(ROOT, "components", "Methodology.tsx"),
      "utf-8"
    );
    const constants = fs.readFileSync(path.join(ROOT, "lib", "constants.ts"), "utf-8");
    assert.match(methodology, /DATA_SOURCE_LABELS/);
    assert.match(methodology, /Three data tiers/i);
    assert.match(methodology, /Official records \(default view\)/i);
    assert.match(methodology, /is_sample: true/i);
    assert.match(constants, /public_contracts_scotland/);
    assert.match(constants, /sell2wales/);
    assert.match(constants, /etenders_ni/);
  });

  it("dashboard includes Project Map navigation", () => {
    const dashboard = fs.readFileSync(
      path.join(ROOT, "components", "Dashboard.tsx"),
      "utf-8"
    );
    assert.match(dashboard, /Project Map/);
    assert.match(dashboard, /FilterPanel/);
    assert.match(dashboard, /ProcurementMap/);
    assert.match(dashboard, /filters & navigation/i);
    assert.match(dashboard, /official/);
    assert.match(dashboard, /scopeContracts/);
  });
});