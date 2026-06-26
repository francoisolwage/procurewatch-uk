/**
 * HTTP verification of the production server entry point.
 * Note: Dashboard is client-rendered; nav/map strings are verified in the JS bundle.
 */
const BASE = process.env.BASE_URL ?? "http://localhost:3000";

async function verifyOnce(run: number): Promise<void> {
  const res = await fetch(BASE);
  if (!res.ok) throw new Error(`Run ${run}: HTTP ${res.status}`);
  const html = await res.text();

  if (!/ProcureWatch UK/.test(html)) {
    throw new Error(`Run ${run}: missing page title`);
  }

  const chunkMatch = html.match(/\/_next\/static\/chunks\/app\/page-[a-f0-9]+\.js/);
  if (!chunkMatch) throw new Error(`Run ${run}: missing page chunk reference`);

  const jsRes = await fetch(`${BASE}${chunkMatch[0]}`);
  if (!jsRes.ok) throw new Error(`Run ${run}: cannot load page chunk`);
  const js = await jsRes.text();

  const bundleChecks = [
    "Project Map",
    "procurement-map",
    "governmentLevels",
    "Methodology",
    "filters & navigation",
  ];
  for (const token of bundleChecks) {
    if (!js.includes(token)) {
      throw new Error(`Run ${run}: bundle missing ${token}`);
    }
  }

  console.log(`Run ${run}: OK (html=${html.length}b, bundle=${js.length}b)`);
}

async function main() {
  await verifyOnce(1);
  await verifyOnce(2);
  console.log("Server verification passed (2/2)");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});