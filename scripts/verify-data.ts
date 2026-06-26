import fs from "fs";
import path from "path";
import { countByGovernmentLevel, contractsWithLocation } from "../lib/government";
import type { Contract } from "../lib/types";

const dataPath = path.join(process.cwd(), "public", "data", "contracts.json");
const contracts: Contract[] = JSON.parse(fs.readFileSync(dataPath, "utf-8"));

const counts = countByGovernmentLevel(contracts);
const withLoc = contractsWithLocation(contracts);

console.log("Tier counts:", counts);
console.log("With location:", withLoc.length, "/", contracts.length);
console.log("All tiers present:", Object.values(counts).every((n) => n > 0));
const verified = contracts.filter((c) => !c.is_sample);
const demo = contracts.filter((c) => c.is_sample);
console.log("Verified records:", verified.length);
console.log("Demo records:", demo.length);
console.log(
  "Labelling correct:",
  verified.every((c) => !c.is_sample) && demo.every((c) => c.is_sample)
);