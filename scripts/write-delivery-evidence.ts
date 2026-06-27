/**
 * Standalone delivery evidence writer (run after capture-evidence).
 * Usage: SCRATCH_DIR=<path> [GOAL_SESSION_DIR=<path>] npm run write-delivery-evidence
 */
import path from "path";
import { writeDeliveryEvidenceToDirs } from "../lib/delivery-manifest";

function main() {
  const scratch =
    process.env.SCRATCH_DIR ??
    path.join(process.cwd(), ".verification");
  const dirs = new Set<string>([scratch]);

  const parent = path.dirname(scratch);
  if (path.basename(scratch) === "implementer") {
    dirs.add(parent);
  }

  const goalSession =
    process.env.GOAL_SESSION_DIR ??
    "C:\\Users\\FrancoisOlwage\\.grok\\sessions\\C%3A%5CUsers%5CFrancoisOlwage\\019f048f-970e-7172-ac06-55f318c40445\\goal";
  dirs.add(goalSession);

  const { changed, destinations } = writeDeliveryEvidenceToDirs([...dirs]);

  console.log(`CHANGED_FILES: ${changed.length} git-detected path(s)`);
  console.log(changed.join("\n"));
  console.log(`Written to: ${destinations.join(", ")}`);
}

main();