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
console.log("Sample labelled:", contracts.every((c) => c.is_sample === true));