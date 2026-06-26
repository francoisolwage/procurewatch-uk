import fs from "fs";
import path from "path";
import { countByGovernmentLevel, contractsWithLocation } from "../lib/government";
import {
  assertLabelling,
  countVerifiedByTier,
  ALL_TIERS,
} from "../lib/data-pipeline";
import type { Contract } from "../lib/types";

const dataPath = path.join(process.cwd(), "public", "data", "contracts.json");
const contracts: Contract[] = JSON.parse(fs.readFileSync(dataPath, "utf-8"));

const combinedCounts = countByGovernmentLevel(contracts);
const withLoc = contractsWithLocation(contracts);
const labelling = assertLabelling(contracts);
const verifiedTierCounts = countVerifiedByTier(contracts);

console.log("Combined tier counts:", combinedCounts);
console.log("With location:", withLoc.length, "/", contracts.length);
console.log("All combined tiers present:", Object.values(combinedCounts).every((n) => n > 0));
console.log("Verified records:", labelling.verifiedCount);
console.log("Demo records:", labelling.demoCount);
console.log("Verified tier counts:", verifiedTierCounts);
console.log("Labelling correct:", labelling.ok);

const minVerifiedPerTier = 2;
const missingVerifiedTiers = ALL_TIERS.filter(
  (t) => verifiedTierCounts[t] < minVerifiedPerTier
);

if (missingVerifiedTiers.length) {
  console.error(
    `FAIL: verified tiers below minimum (${minVerifiedPerTier}): ${missingVerifiedTiers.join(", ")}`
  );
  process.exit(1);
}

if (!labelling.ok) {
  console.error("FAIL: labelling errors:", labelling.errors.join("; "));
  process.exit(1);
}

console.log("Data verification passed");